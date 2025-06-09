/**
 * UIFlow - Adaptive UI density management library
 * Licensed under CC BY-NC 4.0
 */

import { 
  DataSourceManager, 
  APIDataSource, 
  SegmentDataSource 
} from './data-sources/index.js';

import type {
  UIFlowConfig,
  UIFlowInstance,
  Category,
  UserType,
  UserPattern,
  AreaStats,
  FlowConfiguration,
  ElementDependency,
  FlowRule,
  RuleTrigger,
  RuleAction,
  ABTestConfiguration,
  ABTestVariant,
  AreaId,
  ElementId,
  ElementData,
  AreaData,
  ElementOptions,
  HighlightOptions,
  HighlightInfo,
  InteractionData,
  EventDetail,
  DataSourceConfig,
  DataSourceInterface
} from './types.js';

export class UIFlow implements UIFlowInstance {
  public config: Required<UIFlowConfig>;
  private elements: Map<ElementId, ElementData>;
  private areas: Map<AreaId, AreaData>;
  private usageHistory: Map<string, number[]>;
  private elementUsageHistory: Map<ElementId, number[]>;
  private storedElementData: Map<ElementId, any>;
  private initialized: boolean;
  
  private syncTimer: number | null;
  private highlights: Map<ElementId, HighlightInfo>;
  private highlightStyles: HTMLStyleElement | null;
  private dataManager: DataSourceManager;

  constructor(options: Partial<UIFlowConfig> = {}) {
    this.config = {
      categories: ['basic', 'advanced', 'expert'],
      learningRate: 0.1,
      storageKey: 'uiflow-data',
      timeAcceleration: 1,
      adaptationThreshold: 3,
      decayRate: 0.95,
      syncInterval: 5 * 60 * 1000,
      userId: null,
      dataSources: {},
      ...options
    } as Required<UIFlowConfig>;
    
    this.elements = new Map();
    this.areas = new Map();
    this.usageHistory = new Map();
    this.elementUsageHistory = new Map();
    this.storedElementData = new Map();
    this.initialized = false;
    this.syncTimer = null;
    this.highlights = new Map();
    this.highlightStyles = null;
    this.dataManager = new DataSourceManager();
  }

  /**
   * Initialize UIFlow with configuration
   */
  async init(options: Partial<UIFlowConfig> = {}): Promise<UIFlowInstance> {
    Object.assign(this.config, options);
    this.loadStoredData();
    this.setupObservers();
    this.injectHighlightStyles();
    
    // Initialize data sources
    await this.setupDataSources();
    
    // Sync with data sources if configured
    if (this.config.userId && this.dataManager.getSourceNames().length > 0) {
      await this.syncWithDataSources();
      this.startSyncTimer();
    }
    
    this.initialized = true;
    
    // Emit initialization event
    this.emit('uiflow:initialized', { areas: Array.from(this.areas.keys()) });
    
    return this;
  }

  /**
   * Categorize a UI element with optional area specification
   */
  categorize(
    element: HTMLElement, 
    category: Category, 
    area: AreaId = 'default', 
    options: ElementOptions = {}
  ): UIFlowInstance {
    if (!this.config.categories.includes(category)) {
      throw new Error(`Invalid category: ${category}`);
    }
    
    const id = this.getElementId(element);
    
    // Set initial visibility correctly based on dependencies/category
    const initiallyVisible = options.dependencies && options.dependencies.length > 0 
      ? false  // Elements with dependencies ALWAYS start hidden until dependencies are met
      : category === 'basic'; // Only basic elements start visible, advanced/expert need unlocking
    
    // Check if we have stored data for this element
    const storedData = this.storedElementData.get(id);
    console.log(`🔧 Registering element ${id}, storedData:`, storedData);
    
    this.elements.set(id, {
      element,
      category,
      area,
      visible: initiallyVisible,  // Always use dependency-based initial visibility, not stored
      interactions: storedData ? storedData.interactions : 0,  // But restore interaction counts
      lastUsed: storedData ? storedData.lastUsed : null,
      helpText: options.helpText,
      isNew: options.isNew ?? false,
      dependencies: options.dependencies ?? []
    });
    
    console.log(`🔧 Element ${id} registered with interactions:`, this.elements.get(id)?.interactions);
    
    // Initialize area if not exists
    if (!this.areas.has(area)) {
      this.areas.set(area, {
        lastActivity: Date.now(),
        totalInteractions: 0
      });
    }
    
    element.setAttribute('data-uiflow-category', category);
    element.setAttribute('data-uiflow-area', area);
    element.setAttribute('data-uiflow-id', id);
    
    if (options.helpText) {
      element.setAttribute('data-uiflow-help', options.helpText);
    }
    
    this.updateElementVisibility(id);
    return this;
  }



  /**
   * Check if element should be visible based on category
   * Elements without dependencies use simple category rules:
   * - basic: always visible
   * - advanced/expert: hidden until dependencies are met
   */
  shouldShowElement(category: Category, area: AreaId = 'default'): boolean {
    // Only basic elements are visible by default
    return category === 'basic';
  }

  /**
   * Enhanced element visibility check including dependencies
   */
  shouldShowElementWithDependencies(elementId: ElementId): boolean {
    const element = this.elements.get(elementId);
    if (!element) return false;
    
    // Elements with dependencies use pure dependency-based visibility
    if (element.dependencies && element.dependencies.length > 0) {
      return this.validateDependencies(elementId);
    }
    
    // Elements without dependencies use simple category-based rules
    return this.shouldShowElement(element.category, element.area);
  }





  /**
   * Highlight an element with specific style and optional tooltip
   */
  highlightElement(
    elementId: ElementId, 
    style: string = 'default', 
    options: HighlightOptions = {}
  ): UIFlowInstance {
    const data = this.elements.get(elementId);
    if (!data || !data.visible) return this;

    const highlightInfo: HighlightInfo = {
      style,
      startTime: Date.now(),
      duration: options.duration ?? 5000,
      tooltip: options.tooltip ?? data.helpText ?? undefined,
      persistent: options.persistent ?? false,
      onDismiss: options.onDismiss
    };

    this.highlights.set(elementId, highlightInfo);
    this.applyHighlight(elementId, highlightInfo);

    // Auto-remove highlight after duration (unless persistent)
    if (!highlightInfo.persistent) {
      setTimeout(() => {
        this.removeHighlight(elementId);
      }, highlightInfo.duration);
    }

    this.emit('uiflow:highlight-added', { elementId, style, options });
    return this;
  }

  /**
   * Remove highlight from element
   */
  removeHighlight(elementId: ElementId): UIFlowInstance {
    const highlightInfo = this.highlights.get(elementId);
    if (!highlightInfo) return this;

    const data = this.elements.get(elementId);
    if (data) {
      data.element.classList.remove(`uiflow-highlight-${highlightInfo.style}`);
      data.element.removeAttribute('data-uiflow-tooltip');
      
      // Remove tooltip if it exists
      const tooltip = data.element.querySelector('.uiflow-tooltip');
      if (tooltip) {
        tooltip.remove();
      }
    }

    this.highlights.delete(elementId);
    
    if (highlightInfo.onDismiss) {
      highlightInfo.onDismiss(elementId);
    }

    this.emit('uiflow:highlight-removed', { elementId });
    return this;
  }

  /**
   * Flag element as new with optional help text
   */
  flagAsNew(elementId: ElementId, helpText?: string, duration: number = 8000): UIFlowInstance {
    const data = this.elements.get(elementId);
    if (!data) return this;

    data.isNew = true;
    if (helpText) {
      data.helpText = helpText;
      data.element.setAttribute('data-uiflow-help', helpText);
    }

    // If element is currently visible, highlight it immediately
    if (data.visible) {
      this.highlightElement(elementId, 'new-feature', {
        duration,
        tooltip: helpText ?? 'New feature available!'
      });
    }

    return this;
  }

  /**
   * Show tooltip for element
   */
  showTooltip(elementId: ElementId, text: string, options: Partial<HighlightOptions> = {}): UIFlowInstance {
    return this.highlightElement(elementId, 'tooltip', {
      tooltip: text,
      duration: options.duration ?? 3000,
      persistent: options.persistent ?? false
    });
  }

  /**
   * Clear all highlights
   */
  clearAllHighlights(): UIFlowInstance {
    for (const elementId of this.highlights.keys()) {
      this.removeHighlight(elementId);
    }
    return this;
  }

  /**
   * Get currently highlighted elements
   */
  getHighlights(): ElementId[] {
    return Array.from(this.highlights.keys());
  }

  /**
   * Add a data source dynamically
   */
  addDataSource(name: string, type: string, config: DataSourceConfig, isPrimary: boolean = false): UIFlowInstance {
    let source: DataSourceInterface;
    
    switch (type) {
      case 'api':
        source = new APIDataSource({ endpoint: config.endpoint! });
        break;
      case 'segment':
        source = new SegmentDataSource({ 
          writeKey: config.writeKey!,
          trackingPlan: config.trackingPlan,
          useUserProperties: config.useUserProperties
        });
        break;
      default:
        throw new Error(`Unknown data source type: ${type}`);
    }
    
    this.dataManager.addSource(name, source, isPrimary);
    source.initialize();
    
    this.emit('uiflow:datasource-added', { sources: [name] });
    return this;
  }

  /**
   * Remove a data source
   */
  removeDataSource(name: string): UIFlowInstance {
    this.dataManager.removeSource(name);
    this.emit('uiflow:datasource-removed', { sources: [name] });
    return this;
  }

  /**
   * Get data source by name (for advanced usage)
   */
  getDataSource(name: string): DataSourceInterface | undefined {
    return this.dataManager.getSource(name);
  }

  /**
   * Force sync with data sources and apply updates
   */
  async forceSync(): Promise<void> {
    await this.syncWithDataSources();
    await this.pushToDataSources();
  }

  /**
   * Simulate usage over time for testing
   */
  simulateUsage(area: AreaId, interactions: InteractionData[], daysToSimulate: number = 7): void {
    const originalAcceleration = this.config.timeAcceleration;
    this.config.timeAcceleration = 1000; // Speed up for simulation
    
    const msPerDay = 24 * 60 * 60 * 1000;
    const totalMs = daysToSimulate * msPerDay;
    const intervalMs = totalMs / interactions.length;
    
    interactions.forEach((interaction, index) => {
      const simulatedTime = Date.now() + (index * intervalMs);
      this.recordUsageHistory(area, interaction.category, simulatedTime * this.config.timeAcceleration);
    });
    
    // Re-evaluate dependencies after simulation
    this.updateDependentElements();
    this.config.timeAcceleration = originalAcceleration;
  }

  /**
   * Simulate realistic user behavior patterns
   */
  simulateUserType(type: UserType | UserPattern, areas?: AreaId | AreaId[]): void {
    const predefinedPatterns: Record<UserType, UserPattern> = {
      beginner: { basic: 0.85, advanced: 0.13, expert: 0.02 },
      intermediate: { basic: 0.60, advanced: 0.35, expert: 0.05 },
      'power-user': { basic: 0.30, advanced: 0.50, expert: 0.20 },
      expert: { basic: 0.15, advanced: 0.40, expert: 0.45 }
    };

    const pattern = typeof type === 'string' ? predefinedPatterns[type] : type;
    const targetAreas = areas ? (Array.isArray(areas) ? areas : [areas]) : Array.from(this.areas.keys());
    
    // Generate interactions based on pattern (50 total for realistic simulation)
    const totalInteractions = 50;
    const interactions: InteractionData[] = [];
    
    const basicCount = Math.round(totalInteractions * pattern.basic);
    const advancedCount = Math.round(totalInteractions * pattern.advanced);
    const expertCount = totalInteractions - basicCount - advancedCount;
    
    // Add interactions in shuffled order for realism
    for (let i = 0; i < basicCount; i++) interactions.push({ category: 'basic' });
    for (let i = 0; i < advancedCount; i++) interactions.push({ category: 'advanced' });
    for (let i = 0; i < expertCount; i++) interactions.push({ category: 'expert' });
    
    // Shuffle for realistic distribution
    for (let i = interactions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = interactions[i];
      if (interactions[j] !== undefined && temp !== undefined) {
        interactions[i] = interactions[j];
        interactions[j] = temp;
      }
    }
    
    // Apply to all target areas
    targetAreas.forEach(area => {
      this.simulateUsage(area, interactions, 7);
    });
    
    console.log(`🤖 Simulated ${typeof type === 'string' ? type : 'custom'} user for areas: ${targetAreas.join(', ')}`);
  }

  /**
   * Enable/disable demo mode for testing
   */
  setDemoMode(enabled: boolean): void {
    // Store original config
    if (!this.demoModeOriginal) {
      this.demoModeOriginal = {
        learningRate: this.config.learningRate,
        timeAcceleration: this.config.timeAcceleration,
        adaptationThreshold: this.config.adaptationThreshold
      };
    }
    
    if (enabled) {
      this.config.learningRate = 0.9;
      this.config.timeAcceleration = 2;
      this.config.adaptationThreshold = 1;
    } else {
      Object.assign(this.config, this.demoModeOriginal);
    }
  }

  /**
   * Reset area to initial state
   */
  resetArea(area: AreaId): void {
    const areaData = this.areas.get(area);
    if (areaData) {
      areaData.totalInteractions = 0;
      areaData.lastActivity = 0;
      
      // Clear usage history for this area
      for (const category of this.config.categories) {
        const key = `${area}:${category}`;
        this.usageHistory.delete(key);
      }
      
      // Reset element interaction counts in this area
      for (const [elementId, elementData] of this.elements.entries()) {
        if (elementData.area === area) {
          elementData.interactions = 0;
          elementData.lastUsed = null;
        }
      }
      
      this.updateAreaElementsVisibility(area);
      this.saveData();
      console.log(`🔄 Reset ${area} to initial state`);
    }
  }

  /**
   * Get comprehensive stats for an area
   */
  getAreaStats(area: AreaId): AreaStats {
    const areaData = this.areas.get(area);
    if (!areaData) {
      return { visibleElements: 0, totalElements: 0, recentUsage: { basic: 0, advanced: 0, expert: 0 }, adaptationEvents: 0 };
    }

    const elements = Array.from(this.elements.values()).filter(el => el.area === area);
    const visibleElements = elements.filter(el => el.visible).length;
    const recentUsage = this.getRecentUsageByArea(area);

    return {
      visibleElements,
      totalElements: elements.length,
      recentUsage,
      adaptationEvents: areaData.totalInteractions
    };
  }

  /**
   * Get stats for all areas
   */
  getOverviewStats(): Record<AreaId, AreaStats> {
    const stats: Record<AreaId, AreaStats> = {};
    for (const area of this.areas.keys()) {
      stats[area] = this.getAreaStats(area);
    }
    return stats;
  }

  private demoModeOriginal?: { learningRate: number; timeAcceleration: number; adaptationThreshold: number };
  private loadedConfiguration?: FlowConfiguration;
  private sequenceTracker: Map<string, number[]> = new Map(); // Track element interaction sequences
  private activeRules: FlowRule[] = [];
  private ruleCheckTimer: number | undefined;
  private abTestVariant?: string;
  private abTestMetrics: Map<string, number> = new Map();

  /**
   * Public getters for controlled access to private properties
   */
  getElementCount(): number {
    return this.elements.size;
  }

  getAreaCount(): number {
    return this.areas.size;
  }

  getElementsForArea(area: AreaId): ElementData[] {
    return Array.from(this.elements.values()).filter(el => el.area === area);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get elements for demo features (controlled access)
   */
  getNewVisibleElements(): Array<{ elementId: ElementId; helpText: string | undefined }> {
    return Array.from(this.elements.entries())
      .filter(([_, data]) => data.isNew && data.visible)
      .map(([elementId, data]) => ({ elementId, helpText: data.helpText }));
  }

  getVisibleElementsWithHelp(): Array<{ elementId: ElementId; helpText: string }> {
    return Array.from(this.elements.entries())
      .filter(([_, data]) => data.visible && data.helpText)
      .map(([elementId, data]) => ({ elementId, helpText: data.helpText! }));
  }

  getVisibleElementsSorted(): Array<{ elementId: ElementId; category: Category; helpText: string | undefined }> {
    return Array.from(this.elements.entries())
      .filter(([_, data]) => data.visible && data.helpText)
      .sort(([, a], [, b]) => {
        const order = { basic: 0, advanced: 1, expert: 2 };
        return order[a.category] - order[b.category];
      })
      .map(([elementId, data]) => ({ elementId, category: data.category, helpText: data.helpText }));
  }

  /**
   * Validate element dependencies
   */
  validateDependencies(elementId: ElementId): boolean {
    const elementData = this.elements.get(elementId);
    if (!elementData || !elementData.dependencies) {
      return true; // No dependencies = always valid
    }

    return elementData.dependencies.every(dep => this.validateSingleDependency(dep));
  }

  private validateSingleDependency(dependency: ElementDependency): boolean {
    switch (dependency.type) {
      case 'usage_count':
        return this.validateUsageCount(dependency);
      
      case 'sequence':
        return this.validateSequence(dependency);
      
      case 'time_based':
        return this.validateTimeBased(dependency);
      
      case 'logical_and':
        return dependency.elements?.every(elemId => 
          this.validateDependencies(elemId)
        ) ?? false;
      
      case 'logical_or':
        return dependency.elements?.some(elemId => 
          this.validateDependencies(elemId)
        ) ?? false;
      
      default:
        console.warn(`Unknown dependency type: ${dependency.type}`);
        return false;
    }
  }

  private validateUsageCount(dependency: ElementDependency): boolean {
    if (!dependency.elementId || !dependency.threshold) return false;
    
    const targetElement = this.elements.get(dependency.elementId);
    if (!targetElement) return false;
    
    return targetElement.interactions >= dependency.threshold;
  }

  private validateSequence(dependency: ElementDependency): boolean {
    if (!dependency.elements || dependency.elements.length === 0) return false;
    
    // Check if user has interacted with elements in the specified sequence
    const sequenceKey = dependency.elements.join('→');
    const interactions = this.sequenceTracker.get(sequenceKey) || [];
    
    // Simple validation: all elements in sequence have been used
    return dependency.elements.every(elemId => {
      const element = this.elements.get(elemId);
      return element && element.interactions > 0;
    });
  }

  private validateTimeBased(dependency: ElementDependency): boolean {
    if (!dependency.elementId || !dependency.timeWindow || !dependency.minUsage) {
      return false;
    }
    
    const targetElement = this.elements.get(dependency.elementId);
    if (!targetElement) return false;
    
    // For simulation/demo purposes, if we have enough total interactions, consider it valid
    // In a real app, this would check interactions within the time window
    if (targetElement.interactions >= dependency.minUsage) {
      return true;
    }
    
    // Parse time window (e.g., '7d', '30d', '1w')
    const timeWindowMs = this.parseTimeWindow(dependency.timeWindow);
    const now = this.getAcceleratedTime();
    const cutoff = now - timeWindowMs;
    
    // Count recent usage for this specific element
    const elementHistory = this.elementUsageHistory.get(dependency.elementId) || [];
    const recentUsage = elementHistory.filter(timestamp => timestamp > cutoff).length;
    return recentUsage >= dependency.minUsage;
  }

  private parseTimeWindow(timeWindow: string): number {
    const match = timeWindow.match(/^(\d+)([dwmy])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // Default to 7 days
    
    const [, amount, unit] = match;
    const value = parseInt(amount || '7', 10);
    
    switch (unit) {
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'w': return value * 7 * 24 * 60 * 60 * 1000;
      case 'm': return value * 30 * 24 * 60 * 60 * 1000;
      case 'y': return value * 365 * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Track element sequences for dependency validation and user journey analysis
   */
  private trackElementSequence(elementId: ElementId): void {
    const element = this.elements.get(elementId);
    if (!element) return;
    
    const timestamp = Date.now();
    const areaSequenceKey = `${element.area}:sequence`;
    const globalSequenceKey = 'global:sequence';
    
    // Track area-specific sequence
    this.addToSequence(areaSequenceKey, { elementId, timestamp, area: element.area });
    
    // Track global sequence across all areas
    this.addToSequence(globalSequenceKey, { elementId, timestamp, area: element.area });
    
    // Analyze and detect common patterns
    this.analyzeUserJourney(element.area);
  }

  private addToSequence(key: string, entry: { elementId: ElementId; timestamp: number; area: AreaId }): void {
    if (!this.sequenceTracker.has(key)) {
      this.sequenceTracker.set(key, []);
    }
    
    const sequence = this.sequenceTracker.get(key)!;
    sequence.push(entry.timestamp);
    
    // Keep only last 20 interactions in sequence for pattern analysis
    if (sequence.length > 20) {
      sequence.splice(0, sequence.length - 20);
    }
  }

  /**
   * Analyze user journey patterns and detect competency progression
   */
  private analyzeUserJourney(area: AreaId): void {
    const sequenceKey = `${area}:sequence`;
    const sequence = this.sequenceTracker.get(sequenceKey) || [];
    
    if (sequence.length < 5) return; // Need minimum interactions for pattern analysis
    
    // Detect usage patterns
    const recentInteractions = sequence.slice(-10);
    const timeSpan = (recentInteractions[recentInteractions.length - 1] || 0) - (recentInteractions[0] || 0);
    const interactionRate = recentInteractions.length / (timeSpan / 1000 / 60); // per minute
    
    // Classify user behavior
    let userBehavior: 'exploring' | 'focused' | 'expert' = 'exploring';
    
    if (interactionRate > 2) {
      userBehavior = 'focused'; // High interaction rate suggests focused usage
    }
    
    const areaElements = this.getElementsForArea(area);
    const advancedUsage = areaElements.filter(el => 
      (el.category === 'advanced' || el.category === 'expert') && el.interactions > 0
    ).length;
    
    if (advancedUsage > areaElements.length * 0.5) {
      userBehavior = 'expert'; // Using >50% advanced features
    }
    
    // Emit journey insights
    this.emit('uiflow:journey-analyzed', {
      area,
      behavior: userBehavior,
      interactionRate,
      advancedFeatureUsage: advancedUsage,
      totalSequenceLength: sequence.length,
      recentActivity: recentInteractions.length
    });
    
    // Trigger adaptive responses based on detected patterns
    this.adaptToUserJourney(area, userBehavior);
  }

  /**
   * Adapt UIFlow behavior based on detected user journey patterns
   */
  private adaptToUserJourney(area: AreaId, behavior: 'exploring' | 'focused' | 'expert'): void {
    switch (behavior) {
      case 'exploring':
        // User is exploring - show helpful hints and basic features
        this.flagNewElementsInArea(area, 'basic');
        break;
      
      case 'focused':
        // User is working focused - show advanced features with dependencies met
        this.flagNewElementsInArea(area, 'advanced');
        break;
      
      case 'expert':
        // User is expert - unlock expert features, minimal hand-holding
        this.unlockCategory('expert', area);
        break;
    }
  }

  /**
   * Flag new elements in an area for discovery
   */
  private flagNewElementsInArea(area: AreaId, category?: Category): void {
    for (const [elementId, element] of this.elements) {
      if (element.area === area && element.visible) {
        if (!category || element.category === category) {
          element.isNew = true;
          this.flagAsNew(elementId, element.helpText || 'Try this feature!', 5000);
        }
      }
    }
  }

  /**
   * Load configuration from JSON with optional A/B testing
   */
  async loadConfiguration(config: FlowConfiguration): Promise<UIFlowInstance> {
    // Load stored data before registering elements
    this.loadStoredData();
    
    let finalConfig = config;
    
    // Handle A/B testing if enabled
    if (config.abTest?.enabled) {
      const selectedVariant = this.selectABTestVariant(config.abTest);
      if (selectedVariant) {
        finalConfig = this.mergeConfiguration(config, selectedVariant.configuration);
        this.abTestVariant = selectedVariant.id;
        this.initializeABTestMetrics(config.abTest.metrics);
        
        console.log(`🧪 A/B Test Active: ${config.abTest.testId}, Variant: ${selectedVariant.name}`);
      }
    }
    
    this.loadedConfiguration = finalConfig;
    
    // Apply area configurations
    for (const [areaId, areaConfig] of Object.entries(finalConfig.areas)) {
      // Initialize area if not exists
      if (!this.areas.has(areaId)) {
        this.areas.set(areaId, {
          lastActivity: Date.now(),
          totalInteractions: 0
        });
      }
      
      // Auto-categorize elements from configuration
      for (const elementConfig of areaConfig.elements) {
        const element = document.querySelector(elementConfig.selector) as HTMLElement;
        if (element) {
          this.categorize(element, elementConfig.category, areaId, {
            helpText: elementConfig.helpText,
            dependencies: elementConfig.dependencies
          });
        } else {
          console.warn(`Element not found for selector: ${elementConfig.selector}`);
        }
      }
    }
    
    // Initialize rule engine if rules are present
    if (finalConfig.rules && finalConfig.rules.length > 0) {
      this.initializeRuleEngine(finalConfig.rules);
    }
    
    // Update initial visibility for all elements based on dependencies
    this.updateAllElementsVisibility();
    
    console.log(`✅ UIFlow configuration loaded: ${finalConfig.name} v${finalConfig.version}`);
    this.emit('uiflow:configuration-loaded', { config: finalConfig, abTestVariant: this.abTestVariant });
    
    return this;
  }

  /**
   * Select A/B test variant based on traffic allocation
   */
  private selectABTestVariant(abTest: ABTestConfiguration): ABTestVariant | null {
    if (!abTest.variants.length || !abTest.trafficAllocation.length) {
      return null;
    }
    
    // Generate a consistent hash based on user ID for stable variant assignment
    const userId = this.config.userId || 'anonymous';
    const hash = this.hashString(userId + abTest.testId);
    const percentage = hash % 100;
    
    // Select variant based on traffic allocation
    let cumulativePercentage = 0;
    for (let i = 0; i < abTest.variants.length; i++) {
      cumulativePercentage += abTest.trafficAllocation[i] || 0;
      if (percentage < cumulativePercentage) {
        return abTest.variants[i] || null;
      }
    }
    
    return abTest.variants[0] || null; // Fallback to first variant
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Merge base configuration with variant configuration
   */
  private mergeConfiguration(base: FlowConfiguration, variant: Partial<FlowConfiguration>): FlowConfiguration {
    return {
      ...base,
      ...variant,
      areas: {
        ...base.areas,
        ...variant.areas
      },
      rules: variant.rules || base.rules || [],
      templates: variant.templates || base.templates || []
    };
  }

  /**
   * Initialize A/B test metrics tracking
   */
  private initializeABTestMetrics(metrics: string[]): void {
    for (const metric of metrics) {
      this.abTestMetrics.set(metric, 0);
    }
  }

  /**
   * Track A/B test metrics
   */
  trackABTestMetric(metric: string, value: number = 1): void {
    if (this.abTestVariant && this.abTestMetrics.has(metric)) {
      const currentValue = this.abTestMetrics.get(metric) || 0;
      this.abTestMetrics.set(metric, currentValue + value);
      
      this.emit('uiflow:ab-test-metric', {
        testVariant: this.abTestVariant,
        metric,
        value: currentValue + value
      });
    }
  }

  /**
   * Get A/B test results
   */
  getABTestResults(): { variant: string | undefined; metrics: Record<string, number> } {
    const metrics: Record<string, number> = {};
    for (const [key, value] of this.abTestMetrics) {
      metrics[key] = value;
    }
    
    return {
      variant: this.abTestVariant,
      metrics
    };
  }

  /**
   * Export current configuration
   */
  exportConfiguration(): FlowConfiguration {
    if (this.loadedConfiguration) {
      return this.loadedConfiguration;
    }
    
    // Generate configuration from current state
    const areas: Record<AreaId, any> = {};
    
    for (const [areaId, areaData] of this.areas) {
      const elements = this.getElementsForArea(areaId).map(elementData => ({
        id: elementData.element.getAttribute('data-uiflow-id') || '',
        selector: `#${elementData.element.id}` || `.${elementData.element.className}`,
        category: elementData.category,
        helpText: elementData.helpText,
        dependencies: elementData.dependencies
      }));
      
      areas[areaId] = {
        elements
      };
    }
    
    return {
      name: 'Generated UIFlow Configuration',
      version: '1.0.0',
      areas,
      rules: []
    };
  }

  /**
   * Initialize rule engine with configuration rules
   */
  private initializeRuleEngine(rules: FlowRule[]): void {
    this.activeRules = rules;
    
    // Start periodic rule checking (every 30 seconds)
    this.ruleCheckTimer = window.setInterval(() => {
      this.processRules();
    }, 30000);
    
    console.log(`🔧 Rule engine initialized with ${rules.length} rules`);
  }

  /**
   * Process all active rules
   */
  private processRules(): void {
    for (const rule of this.activeRules) {
      if (this.evaluateRuleTrigger(rule.trigger)) {
        this.executeRuleAction(rule.action);
        console.log(`📋 Rule executed: ${rule.name}`);
        
        this.emit('uiflow:rule-triggered', {
          rule: rule.name,
          trigger: rule.trigger,
          action: rule.action
        });
      }
    }
  }

  /**
   * Evaluate if a rule trigger condition is met
   */
  private evaluateRuleTrigger(trigger: RuleTrigger): boolean {
    switch (trigger.type) {
      case 'usage_pattern':
        return this.evaluateUsagePattern(trigger);
      
      case 'time_based':
        return this.evaluateTimeBased(trigger);
      
      case 'element_interaction':
        return this.evaluateElementInteraction(trigger);
      
      case 'custom_event':
        // Custom events would be handled via external triggers
        return false;
      
      default:
        console.warn(`Unknown trigger type: ${trigger.type}`);
        return false;
    }
  }

  private evaluateUsagePattern(trigger: RuleTrigger): boolean {
    if (!trigger.elements || !trigger.frequency || !trigger.duration) {
      return false;
    }
    
    const durationMs = this.parseTimeWindow(trigger.duration);
    const now = this.getAcceleratedTime();
    const cutoff = now - durationMs;
    
    // Check if all specified elements have been used according to frequency
    return trigger.elements.every(elementId => {
      const element = this.elements.get(elementId);
      if (!element) return false;
      
      const area = element.area;
      const category = element.category;
      const key = `${area}:${category}`;
      const history = this.usageHistory.get(key) || [];
      
      const recentUsage = history.filter(timestamp => timestamp > cutoff);
      
      // Check frequency requirement
      switch (trigger.frequency) {
        case 'daily':
          return recentUsage.length >= Math.ceil(durationMs / (24 * 60 * 60 * 1000));
        case 'weekly':
          return recentUsage.length >= Math.ceil(durationMs / (7 * 24 * 60 * 60 * 1000));
        case 'monthly':
          return recentUsage.length >= Math.ceil(durationMs / (30 * 24 * 60 * 60 * 1000));
        default:
          return false;
      }
    });
  }

  private evaluateTimeBased(trigger: RuleTrigger): boolean {
    // Time-based triggers could check things like:
    // - User has been active for X duration
    // - It's been Y time since last interaction
    // - Current time matches specific criteria
    
    if (trigger.threshold) {
      const totalInteractions = Array.from(this.elements.values())
        .reduce((sum, element) => sum + element.interactions, 0);
      return totalInteractions >= trigger.threshold;
    }
    
    return false;
  }

  private evaluateElementInteraction(trigger: RuleTrigger): boolean {
    if (!trigger.elements) return false;
    
    // Check if any of the specified elements have been interacted with
    return trigger.elements.some(elementId => {
      const element = this.elements.get(elementId);
      return element && element.interactions > 0;
    });
  }

  private evaluateUsageCountTrigger(trigger: RuleTrigger): boolean {
    if (!trigger.elements || !trigger.threshold) return false;
    
    // Check if any of the specified elements have reached the usage threshold
    return trigger.elements.some(elementId => {
      const element = this.elements.get(elementId);
      return element && trigger.threshold !== undefined && element.interactions >= trigger.threshold;
    });
  }

  /**
   * Execute a rule action
   */
  private executeRuleAction(action: RuleAction): void {
    console.log(`🎬 Executing rule action: ${action.type}`, action);
    
    switch (action.type) {
      case 'unlock_element':
        if (action.elementId) {
          console.log(`🔓 Unlocking element: ${action.elementId}`);
          this.unlockElement(action.elementId);
        } else {
          console.warn(`⚠️ unlock_element action missing elementId`);
        }
        break;
      
      case 'unlock_category':
        if (action.category && action.area) {
          console.log(`🔓 Unlocking category: ${action.category} in area: ${action.area}`);
          this.unlockCategory(action.category, action.area);
        } else {
          console.warn(`⚠️ unlock_category action missing category or area`, action);
        }
        break;
      
      case 'show_tutorial':
        console.log(`📚 Showing tutorial:`, action.data);
        this.showTutorial(action.data);
        break;
      
      case 'send_event':
        console.log(`📡 Sending custom event:`, action.data);
        this.emit('uiflow:custom-event', action.data);
        break;
      
      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  private unlockElement(elementId: ElementId): void {
    const element = this.elements.get(elementId);
    if (element) {
      element.visible = true;
      this.updateElementVisibility(elementId);
      
      this.emit('uiflow:element-unlocked', {
        elementId,
        category: element.category,
        area: element.area,
        trigger: 'rule-action'
      });
    }
  }

  private unlockCategory(category: Category, area: AreaId): void {
    let unlockedCount = 0;
    
    console.log(`🔍 Looking for elements with category: ${category}, area: ${area}`);
    console.log(`🗂️ Total elements tracked: ${this.elements.size}`);
    
    for (const [elementId, element] of this.elements) {
      console.log(`🔎 Checking element ${elementId}: category=${element.category}, area=${element.area}, visible=${element.visible}`);
      
      if (element.category === category && element.area === area) {
        const wasVisible = element.visible;
        element.visible = true;
        console.log(`✅ Unlocking element ${elementId} (was visible: ${wasVisible})`);
        this.updateElementVisibility(elementId);
        
        if (!wasVisible) {
          unlockedCount++;
        }
      }
    }
    
    console.log(`🎯 Unlocked ${unlockedCount} elements in category ${category}/${area}`);
    
    if (unlockedCount > 0) {
      this.emit('uiflow:category-unlocked', {
        category,
        area,
        elementsUnlocked: unlockedCount,
        trigger: 'rule-action'
      });
    }
  }

  private showTutorial(data: any): void {
    // Emit tutorial event that the application can handle
    this.emit('uiflow:tutorial-requested', {
      tutorial: data?.tutorial || 'default',
      autoStart: data?.autoStart ?? false,
      data
    });
  }

  /**
   * Destroy instance and cleanup timers
   */
  destroy(): void {
    this.stopSyncTimer();
    this.clearAllHighlights();
    this.dataManager.destroy();
    
    // Clean up rule engine timer
    if (this.ruleCheckTimer) {
      clearInterval(this.ruleCheckTimer);
      this.ruleCheckTimer = undefined;
    }
    
    if (this.highlightStyles) {
      this.highlightStyles.remove();
      this.highlightStyles = null;
    }
    
    this.initialized = false;
    this.emit('uiflow:destroyed', {});
  }

  // Private methods implementation
  private getElementId(element: HTMLElement): ElementId {
    return element.id || `uiflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateElementVisibility(elementId: ElementId): void {
    const data = this.elements.get(elementId);
    if (!data) return;

    // Use dependency-based visibility if element has dependencies, otherwise use density-based
    const shouldShow = data.dependencies && data.dependencies.length > 0 
      ? this.shouldShowElementWithDependencies(elementId)
      : this.shouldShowElement(data.category, data.area);
    const wasVisible = data.visible;
    
    if (data.visible !== shouldShow) {
      data.visible = shouldShow;
      data.element.style.display = shouldShow ? '' : 'none';
      data.element.setAttribute('data-uiflow-visible', shouldShow.toString());
      
      // Also manage 'hidden' class for better CSS integration
      if (shouldShow) {
        data.element.classList.remove('hidden');
      } else {
        data.element.classList.add('hidden');
      }
      
      // If element just became visible and it's new, highlight it
      if (shouldShow && !wasVisible && data.isNew) {
        this.highlightElement(elementId, 'new-feature');
      }
    }
  }

  private updateAreaElementsVisibility(area: AreaId): void {
    for (const [id, data] of this.elements) {
      if (data.area === area) {
        this.updateElementVisibility(id);
      }
    }
  }

  private updateAllElementsVisibility(): void {
    for (const [id] of this.elements) {
      this.updateElementVisibility(id);
    }
  }

  private setupObservers(): void {
    // Track clicks on categorized elements
    document.addEventListener('click', (e) => {
      const element = (e.target as HTMLElement).closest('[data-uiflow-category]') as HTMLElement;
      if (element) {
        this.recordInteractionFromElement(element);
      }
    });
  }

  private recordInteractionFromElement(element: HTMLElement): void {
    const id = element.getAttribute('data-uiflow-id');
    if (!id) {
      console.log(`⚠️ Element clicked but no data-uiflow-id found:`, element);
      return;
    }
    
    const data = this.elements.get(id);
    
    if (data) {
      const now = this.getAcceleratedTime();
      data.interactions++;
      data.lastUsed = now;
      
      console.log(`👆 Interaction recorded: ${id} (total: ${data.interactions})`);
      
      // Track element sequences for dependency validation
      this.trackElementSequence(id);
      
      // Update area activity
      const areaData = this.areas.get(data.area);
      if (areaData) {
        areaData.lastActivity = now;
        areaData.totalInteractions++;
      }
      
      // Track interaction in data sources
      this.trackInteraction(data);
      
      // Record in usage history for time-based analysis
      this.recordUsageHistory(data.area, data.category, now);
      
      // Track element-specific usage history for time-based dependencies
      const elementHistory = this.elementUsageHistory.get(id) || [];
      elementHistory.push(now);
      // Keep only last 100 interactions to prevent memory bloat
      if (elementHistory.length > 100) {
        elementHistory.shift();
      }
      this.elementUsageHistory.set(id, elementHistory);
      
      // Check if new elements should be unlocked due to dependency changes
      this.updateDependentElements();
    } else {
      console.log(`⚠️ Element ${id} not found in UIFlow elements map`);
    }
  }

  /**
   * Update visibility of elements that may have dependencies satisfied
   */
  private updateDependentElements(): void {
    for (const [elementId, elementData] of this.elements) {
      if (elementData.dependencies && elementData.dependencies.length > 0) {
        const shouldBeVisible = this.shouldShowElementWithDependencies(elementId);
        if (shouldBeVisible !== elementData.visible) {
          elementData.visible = shouldBeVisible;
          this.updateElementVisibility(elementId);
          
          // Emit event for newly unlocked elements
          if (shouldBeVisible) {
            this.emit('uiflow:element-unlocked', {
              elementId,
              category: elementData.category,
              area: elementData.area,
              dependencies: elementData.dependencies
            });
          }
        }
      }
    }
  }



  private async trackInteraction(elementData: ElementData): Promise<void> {
    if (!this.config.userId) return;

    const event = {
      elementId: elementData.element.getAttribute('data-uiflow-id'),
      category: elementData.category,
      area: elementData.area,
      action: 'click',
      isNew: elementData.isNew,
      timestamp: Date.now()
    };

    await this.dataManager.trackEvent(this.config.userId, event);
  }

  private recordUsageHistory(area: AreaId, category: Category, timestamp: number): void {
    const key = `${area}:${category}`;
    if (!this.usageHistory.has(key)) {
      this.usageHistory.set(key, []);
    }
    
    const history = this.usageHistory.get(key)!;
    history.push(timestamp);
    
    // Keep only last 30 interactions per category/area
    if (history.length > 30) {
      history.splice(0, history.length - 30);
    }
  }

  // Removed: adaptDensity - no longer using density system

  private getRecentUsageByArea(area: AreaId, timeWindow: number = 7 * 24 * 60 * 60 * 1000): Record<Category, number> {
    const now = this.getAcceleratedTime();
    const acceleratedWindow = timeWindow / this.config.timeAcceleration;
    const cutoff = now - acceleratedWindow;
    
    const usage: Record<Category, number> = { basic: 0, advanced: 0, expert: 0 };
    
    for (const category of this.config.categories as Category[]) {
      const key = `${area}:${category}`;
      const history = this.usageHistory.get(key) || [];
      
      const recentCount = history.filter(timestamp => timestamp > cutoff).length;
      usage[category] = recentCount;
    }
    
    return usage;
  }

  private getAcceleratedTime(): number {
    return Date.now() * this.config.timeAcceleration;
  }

  private loadStoredData(): void {
    try {
      console.log('🔄 loadStoredData() called, storageKey:', this.config.storageKey);
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        console.log('🔄 Parsed stored data:', data);
        
        // Load area densities
        if (data.areas) {
          this.areas = new Map(data.areas);
          console.log('🔄 Loaded areas:', this.areas.size);
        }
        
        // Load usage history
        if (data.usageHistory) {
          this.usageHistory = new Map(data.usageHistory);
          console.log('🔄 Loaded usageHistory:', this.usageHistory.size);
        }
        
        // Load element usage history
        if (data.elementUsageHistory) {
          this.elementUsageHistory = new Map(data.elementUsageHistory);
          console.log('🔄 Loaded elementUsageHistory:', this.elementUsageHistory.size);
        }
        
        // Store element data for restoration after DOM registration
        if (data.elements) {
          this.storedElementData = new Map(data.elements);
          console.log('🔄 Created storedElementData map with size:', this.storedElementData.size);
          console.log('🔄 storedElementData keys:', Array.from(this.storedElementData.keys()));
        }
      } else {
        console.log('🔄 No stored data found in localStorage');
      }
    } catch (e) {
      console.warn('UIFlow: Failed to load stored data', e);
    }
  }

  private saveData(): void {
    try {
      // Convert element data to serializable format
      const elementsData = Array.from(this.elements.entries()).map(([id, data]) => [
        id, 
        {
          interactions: data.interactions,
          lastUsed: data.lastUsed,
          visible: data.visible,
          category: data.category,
          area: data.area
        }
      ]);
      
      const data = {
        areas: Array.from(this.areas.entries()),
        usageHistory: Array.from(this.usageHistory.entries()),
        elementUsageHistory: Array.from(this.elementUsageHistory.entries()),
        elements: elementsData,
        lastSaved: Date.now()
      };
      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn('UIFlow: Failed to save data', e);
    }
  }

  private emit(eventName: string, detail: EventDetail): void {
    const event = new CustomEvent(eventName, { detail });
    document.dispatchEvent(event);
  }

  // Data source management methods
  private async setupDataSources(): Promise<void> {
    const { dataSources } = this.config;
    
    for (const [name, config] of Object.entries(dataSources)) {
      try {
        let source: DataSourceInterface;
        
        switch (name) {
          case 'api':
            source = new APIDataSource({ endpoint: config.endpoint! });
            break;
          case 'segment':
            source = new SegmentDataSource({ 
              writeKey: config.writeKey!,
              trackingPlan: config.trackingPlan,
              useUserProperties: config.useUserProperties
            });
            break;
          default:
            console.warn(`Unknown data source type: ${name}`);
            continue;
        }
        
        this.dataManager.addSource(name, source, config.primary ?? false);
        this.emit('uiflow:datasource-added', { sources: [name] });
      } catch (error) {
        console.warn(`Failed to setup data source ${name}:`, error);
      }
    }
    
    await this.dataManager.initialize();
  }

  private async syncWithDataSources(): Promise<void> {
    if (!this.config.userId) return;

    try {
      const data = await this.dataManager.pullData(this.config.userId);
      this.applyRemoteSettings(data);
      this.emit('uiflow:sync-success', { sources: this.dataManager.getSourceNames(), data });
    } catch (error) {
      console.warn('UIFlow: Failed to sync with data sources', error);
      this.emit('uiflow:sync-error', { error: (error as Error).message });
    }
  }

  private async pushToDataSources(): Promise<void> {
    if (!this.config.userId) return;

    try {
      const payload = {
        areas: Array.from(this.areas.keys()),
        usageHistory: Array.from(this.usageHistory.entries()),
        lastUpdated: Date.now()
      };

      await this.dataManager.pushData(this.config.userId, payload);
      this.emit('uiflow:push-success', { sources: this.dataManager.getSourceNames(), data: payload });
    } catch (error) {
      console.warn('UIFlow: Failed to push to data sources', error);
      this.emit('uiflow:push-error', { error: (error as Error).message });
    }
  }

  private applyRemoteSettings(data: any): void {
    // Simplified: no longer applying density overrides
    // Could be extended to apply remote dependency configuration
    this.updateAllElementsVisibility();
  }

  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.syncWithDataSources();
    }, this.config.syncInterval);
  }

  private stopSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  // Private highlighting methods
  private applyHighlight(elementId: ElementId, highlightInfo: HighlightInfo): void {
    const data = this.elements.get(elementId);
    if (!data) return;

    const element = data.element;
    element.classList.add(`uiflow-highlight-${highlightInfo.style}`);

    // Add tooltip if provided
    if (highlightInfo.tooltip) {
      this.createTooltip(element, highlightInfo.tooltip);
    }

    // Make element focusable for accessibility
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }
  }

  private createTooltip(element: HTMLElement, text: string): void {
    // Remove existing tooltip
    const existingTooltip = element.querySelector('.uiflow-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }

    const tooltip = document.createElement('div');
    tooltip.className = 'uiflow-tooltip';
    tooltip.textContent = text;
    tooltip.setAttribute('role', 'tooltip');
    
    element.appendChild(tooltip);
    element.setAttribute('aria-describedby', tooltip.id = `uiflow-tooltip-${Date.now()}`);

    // Position tooltip
    this.positionTooltip(element, tooltip);

    // Add click to dismiss
    tooltip.addEventListener('click', (e) => {
      e.stopPropagation();
      const elementId = element.getAttribute('data-uiflow-id');
      if (elementId) {
        this.removeHighlight(elementId);
      }
    });
  }

  private positionTooltip(element: HTMLElement, tooltip: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // Position above element by default
    let top = rect.top - tooltipRect.height - 8;
    let left = rect.left + (rect.width - tooltipRect.width) / 2;
    
    // Adjust if tooltip would go off screen
    if (top < 8) {
      top = rect.bottom + 8; // Position below instead
    }
    if (left < 8) {
      left = 8;
    } else if (left + tooltipRect.width > window.innerWidth - 8) {
      left = window.innerWidth - tooltipRect.width - 8;
    }
    
    tooltip.style.position = 'fixed';
    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
    tooltip.style.zIndex = '9999';
  }

  private injectHighlightStyles(): void {
    if (this.highlightStyles) return;

    const styles = `
      .uiflow-highlight-default {
        position: relative;
        animation: uiflow-pulse 2s infinite;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4) !important;
      }
      
      .uiflow-highlight-new-feature {
        position: relative;
        animation: uiflow-glow 2s infinite alternate;
        box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.6) !important;
      }
      
      .uiflow-highlight-new-feature::before {
        content: "NEW";
        position: absolute;
        top: -8px;
        right: -8px;
        background: #22c55e;
        color: white;
        font-size: 10px;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 10px;
        z-index: 10;
      }
      
      .uiflow-highlight-tooltip {
        box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.4) !important;
      }
      
      .uiflow-tooltip {
        position: absolute;
        background: #1f2937;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 13px;
        max-width: 200px;
        line-height: 1.4;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      
      .uiflow-tooltip::before {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 6px solid transparent;
        border-top-color: #1f2937;
      }
      
      .uiflow-tooltip:hover {
        background: #374151;
      }
      
      @keyframes uiflow-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      
      @keyframes uiflow-glow {
        0% { box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.6) !important; }
        100% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.3) !important; }
      }
    `;

    this.highlightStyles = document.createElement('style');
    this.highlightStyles.textContent = styles;
    document.head.appendChild(this.highlightStyles);
  }
}

// Static factory method for convenience
export function createUIFlow(options?: Partial<UIFlowConfig>): UIFlow {
  return new UIFlow(options);
}

// Default instance
export default new UIFlow();

// Re-export types for consumers
export type * from './types.js';

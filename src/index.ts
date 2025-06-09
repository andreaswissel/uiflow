/**
 * UIFlow - Adaptive UI density management library (Refactored)
 * Licensed under CC BY-NC 4.0
 */

import { 
  DataSourceManager, 
  APIDataSource, 
  SegmentDataSource 
} from './data-sources/index.js';

import { DependencyEngine } from './dependency-engine.js';
import { HighlightManager } from './highlight-manager.js';
import { JourneyAnalyzer } from './journey-analyzer.js';
import { Logger } from './logger.js';

import type {
  UIFlowConfig,
  UIFlowInstance,
  Category,
  UserType,
  UserPattern,
  AreaStats,
  FlowConfiguration,
  AreaId,
  ElementId,
  ElementData,
  AreaData,
  ElementOptions,
  HighlightOptions,
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
  private dataManager: DataSourceManager;
  
  // Module instances
  private dependencyEngine: DependencyEngine;
  private highlightManager: HighlightManager;
  private journeyAnalyzer: JourneyAnalyzer;
  private logger: Logger;

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
      debug: false,
      ...options
    } as Required<UIFlowConfig>;
    
    this.elements = new Map();
    this.areas = new Map();
    this.usageHistory = new Map();
    this.elementUsageHistory = new Map();
    this.storedElementData = new Map();
    this.initialized = false;
    this.syncTimer = null;
    this.dataManager = new DataSourceManager();

    // Initialize logger
    this.logger = new Logger(this.config.debug);

    // Initialize modules
    this.dependencyEngine = new DependencyEngine(
      this.elements,
      this.areas,
      this.usageHistory,
      this.elementUsageHistory,
      this.config,
      this.emit.bind(this),
      this.getAcceleratedTime.bind(this),
      this.logger
    );

    this.highlightManager = new HighlightManager(
      this.elements,
      this.emit.bind(this),
      this.logger
    );

    this.journeyAnalyzer = new JourneyAnalyzer(
      this.elements,
      this.areas,
      this.usageHistory,
      this.config,
      this.emit.bind(this),
      this.getAcceleratedTime.bind(this),
      this.dependencyEngine.unlockCategory.bind(this.dependencyEngine),
      this.logger
    );
  }

  /**
   * Initialize UIFlow with configuration
   */
  async init(options: Partial<UIFlowConfig> = {}): Promise<UIFlowInstance> {
    Object.assign(this.config, options);
    this.loadStoredData();
    this.setupObservers();
    
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
    this.logger.debug(`Registering element ${id}`, storedData);
    
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
    
    this.logger.elementRegistered(id, this.elements.get(id)?.interactions || 0);
    
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
      return this.dependencyEngine.validateDependencies(elementId);
    }
    
    // Elements without dependencies use simple category-based rules
    return this.shouldShowElement(element.category, element.area);
  }

  // Delegation to HighlightManager
  highlightElement(elementId: ElementId, style: string = 'default', options: HighlightOptions = {}): UIFlowInstance {
    this.highlightManager.highlightElement(elementId, style, options);
    return this;
  }

  removeHighlight(elementId: ElementId): UIFlowInstance {
    this.highlightManager.removeHighlight(elementId);
    return this;
  }

  flagAsNew(elementId: ElementId, helpText?: string, duration: number = 8000): UIFlowInstance {
    this.highlightManager.flagAsNew(elementId, helpText, duration);
    return this;
  }

  showTooltip(elementId: ElementId, text: string, options: Partial<HighlightOptions> = {}): UIFlowInstance {
    this.highlightManager.showTooltip(elementId, text, options);
    return this;
  }

  clearAllHighlights(): UIFlowInstance {
    this.highlightManager.clearAllHighlights();
    return this;
  }

  getHighlights(): ElementId[] {
    return this.highlightManager.getHighlights();
  }

  // Delegation to DependencyEngine
  validateDependencies(elementId: ElementId): boolean {
    return this.dependencyEngine.validateDependencies(elementId);
  }

  async loadConfiguration(config: FlowConfiguration): Promise<UIFlowInstance> {
    // Load stored data before registering elements
    this.loadStoredData();
    
    await this.dependencyEngine.loadConfiguration(config);
    
    // Apply area configurations from the loaded config
    for (const [areaId, areaConfig] of Object.entries(config.areas)) {
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
          this.logger.warn(`Element not found for selector: ${elementConfig.selector}`);
        }
      }
    }
    
    // Update initial visibility for all elements based on dependencies
    this.updateAllElementsVisibility();
    
    return this;
  }

  trackABTestMetric(metric: string, value: number = 1): void {
    this.dependencyEngine.trackABTestMetric(metric, value);
  }

  getABTestResults(): { variant: string | undefined; metrics: Record<string, number> } {
    return this.dependencyEngine.getABTestResults();
  }

  exportConfiguration(): FlowConfiguration {
    return this.dependencyEngine.exportConfiguration();
  }

  unlockCategory(category: Category, area: AreaId): void {
    this.dependencyEngine.unlockCategory(category, area);
    this.updateAreaElementsVisibility(area);
  }

  // Delegation to JourneyAnalyzer
  simulateUsage(area: AreaId, interactions: any[], daysToSimulate: number = 7): void {
    this.journeyAnalyzer.simulateUsage(area, interactions, daysToSimulate);
    this.dependencyEngine.updateDependentElements(this.updateElementVisibility.bind(this));
  }

  simulateUserType(type: UserType | UserPattern, areas?: AreaId | AreaId[]): void {
    this.journeyAnalyzer.simulateUserType(type, areas);
    this.dependencyEngine.updateDependentElements(this.updateElementVisibility.bind(this));
  }

  getRecentUsageByArea(area: AreaId, timeWindow?: number): Record<Category, number> {
    return this.journeyAnalyzer.getRecentUsageByArea(area, timeWindow);
  }

  // Highlight manager delegations for demo features
  getNewVisibleElements(): Array<{ elementId: ElementId; helpText: string | undefined }> {
    return this.highlightManager.getNewVisibleElements();
  }

  getVisibleElementsWithHelp(): Array<{ elementId: ElementId; helpText: string }> {
    return this.highlightManager.getVisibleElementsWithHelp();
  }

  getVisibleElementsSorted(): Array<{ elementId: ElementId; category: Category; helpText: string | undefined }> {
    return this.highlightManager.getVisibleElementsSorted();
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
      
      // Reset element interaction counts in this area
      for (const [elementId, elementData] of this.elements.entries()) {
        if (elementData.area === area) {
          elementData.interactions = 0;
          elementData.lastUsed = null;
        }
      }
      
      // Reset journey data
      this.journeyAnalyzer.resetArea(area);
      
      this.updateAreaElementsVisibility(area);
      this.saveData();
      this.logger.areaReset(area);
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

  // Private members for demo mode
  private demoModeOriginal?: { learningRate: number; timeAcceleration: number; adaptationThreshold: number };

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
   * Destroy instance and cleanup timers
   */
  destroy(): void {
    this.stopSyncTimer();
    this.dataManager.destroy();
    this.dependencyEngine.destroy();
    this.highlightManager.destroy();
    this.journeyAnalyzer.destroy();
    
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

    // Listen for events from modules
    document.addEventListener('uiflow:simulation-complete', () => {
      this.dependencyEngine.updateDependentElements(this.updateElementVisibility.bind(this));
    });

    document.addEventListener('uiflow:element-flagged-new', (e: any) => {
      const { elementId, helpText, duration } = e.detail;
      this.flagAsNew(elementId, helpText, duration);
    });
  }

  private recordInteractionFromElement(element: HTMLElement): void {
    const id = element.getAttribute('data-uiflow-id');
    if (!id) {
      this.logger.warn(`Element clicked but no data-uiflow-id found`, element);
      return;
    }
    
    const data = this.elements.get(id);
    
    if (data) {
      const now = this.getAcceleratedTime();
      data.interactions++;
      data.lastUsed = now;
      
      this.logger.interaction(id, data.interactions);
      
      // Track element sequences for dependency validation
      this.journeyAnalyzer.trackElementSequence(id);
      this.dependencyEngine.trackElementSequence(id);
      
      // Update area activity
      const areaData = this.areas.get(data.area);
      if (areaData) {
        areaData.lastActivity = now;
        areaData.totalInteractions++;
      }
      
      // Track interaction in data sources
      this.trackInteraction(data);
      
      // Record in usage history for time-based analysis
      this.journeyAnalyzer.recordUsageHistory(data.area, data.category, now);
      
      // Track element-specific usage history for time-based dependencies
      const elementHistory = this.elementUsageHistory.get(id) || [];
      elementHistory.push(now);
      // Keep only last 100 interactions to prevent memory bloat
      if (elementHistory.length > 100) {
        elementHistory.shift();
      }
      this.elementUsageHistory.set(id, elementHistory);
      
      // Check if new elements should be unlocked due to dependency changes
      this.dependencyEngine.updateDependentElements(this.updateElementVisibility.bind(this));
    } else {
      this.logger.warn(`Element ${id} not found in UIFlow elements map`);
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

  private getAcceleratedTime(): number {
    return Date.now() * this.config.timeAcceleration;
  }

  private loadStoredData(): void {
    try {
      this.logger.storage('loadStoredData() called', { storageKey: this.config.storageKey });
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.logger.storage('Parsed stored data', data);
        
        // Load area densities
        if (data.areas) {
          this.areas = new Map(data.areas);
          this.logger.storage('Loaded areas', { size: this.areas.size });
        }
        
        // Load usage history
        if (data.usageHistory) {
          this.usageHistory = new Map(data.usageHistory);
          this.logger.storage('Loaded usageHistory', { size: this.usageHistory.size });
        }
        
        // Load element usage history
        if (data.elementUsageHistory) {
          this.elementUsageHistory = new Map(data.elementUsageHistory);
          this.logger.storage('Loaded elementUsageHistory', { size: this.elementUsageHistory.size });
        }
        
        // Store element data for restoration after DOM registration
        if (data.elements) {
          this.storedElementData = new Map(data.elements);
          this.logger.storage('Created storedElementData map', { 
            size: this.storedElementData.size,
            keys: Array.from(this.storedElementData.keys())
          });
        }
      } else {
        this.logger.storage('No stored data found in localStorage');
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
}

// Static factory method for convenience
export function createUIFlow(options?: Partial<UIFlowConfig>): UIFlow {
  return new UIFlow(options);
}

// Default instance
export default new UIFlow();

// Re-export types for consumers
export type * from './types.js';

/**
 * DependencyEngine - Handles element dependencies, rules, and A/B testing
 */

import type {
  ElementId,
  ElementDependency,
  FlowConfiguration,
  FlowRule,
  RuleTrigger,
  RuleAction,
  ABTestConfiguration,
  ABTestVariant,
  Category,
  AreaId,
  ElementData,
  AreaData,
  UIFlowConfig
} from './types.js';

import type { Logger } from './logger.js';

export class DependencyEngine {
  private activeRules: FlowRule[] = [];
  private ruleCheckTimer: number | undefined;
  private abTestVariant?: string;
  private abTestMetrics: Map<string, number> = new Map();
  private loadedConfiguration?: FlowConfiguration;
  private sequenceTracker: Map<string, number[]> = new Map();

  constructor(
    private elements: Map<ElementId, ElementData>,
    private areas: Map<AreaId, AreaData>,
    private usageHistory: Map<string, number[]>,
    private elementUsageHistory: Map<ElementId, number[]>,
    private config: Required<UIFlowConfig>,
    private emitEvent: (eventName: string, detail: any) => void,
    private getAcceleratedTime: () => number,
    private logger: Logger
  ) {}

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
   * Load configuration from JSON with optional A/B testing
   */
  async loadConfiguration(config: FlowConfiguration): Promise<void> {
    let finalConfig = config;
    
    // Handle A/B testing if enabled
    if (config.abTest?.enabled) {
      const selectedVariant = this.selectABTestVariant(config.abTest);
      if (selectedVariant) {
        finalConfig = this.mergeConfiguration(config, selectedVariant.configuration);
        this.abTestVariant = selectedVariant.id;
        this.initializeABTestMetrics(config.abTest.metrics);
        
        this.logger.info(`A/B Test Active: ${config.abTest.testId}, Variant: ${selectedVariant.name}`);
      }
    }
    
    this.loadedConfiguration = finalConfig;
    
    // Initialize rule engine if rules are present
    if (finalConfig.rules && finalConfig.rules.length > 0) {
      this.initializeRuleEngine(finalConfig.rules);
    }
    
    this.logger.configLoaded(finalConfig.name, finalConfig.version);
    this.emitEvent('uiflow:configuration-loaded', { config: finalConfig, abTestVariant: this.abTestVariant });
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
      
      this.emitEvent('uiflow:ab-test-metric', {
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
    
    for (const [areaId] of this.areas) {
      const elements = Array.from(this.elements.values())
        .filter(el => el.area === areaId)
        .map(elementData => ({
          id: elementData.element.getAttribute('data-uiflow-id') || '',
          selector: `#${elementData.element.id}` || `.${elementData.element.className}`,
          category: elementData.category,
          helpText: elementData.helpText,
          dependencies: elementData.dependencies
        }));
      
      areas[areaId] = { elements };
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
    
    this.logger.info(`Rule engine initialized with ${rules.length} rules`);
  }

  /**
   * Process all active rules
   */
  private processRules(): void {
    for (const rule of this.activeRules) {
      if (this.evaluateRuleTrigger(rule.trigger)) {
        this.executeRuleAction(rule.action);
        this.logger.ruleExecuted(rule.name);
        
        this.emitEvent('uiflow:rule-triggered', {
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
        this.emitEvent('uiflow:custom-event', action.data);
        break;
      
      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  private unlockElement(elementId: ElementId): void {
    const element = this.elements.get(elementId);
    if (element) {
      element.visible = true;
      
      this.emitEvent('uiflow:element-unlocked', {
        elementId,
        category: element.category,
        area: element.area,
        trigger: 'rule-action'
      });
    }
  }

  unlockCategory(category: Category, area: AreaId): void {
    let unlockedCount = 0;
    
    console.log(`🔍 Looking for elements with category: ${category}, area: ${area}`);
    console.log(`🗂️ Total elements tracked: ${this.elements.size}`);
    
    for (const [elementId, element] of this.elements) {
      console.log(`🔎 Checking element ${elementId}: category=${element.category}, area=${element.area}, visible=${element.visible}`);
      
      if (element.category === category && element.area === area) {
        const wasVisible = element.visible;
        element.visible = true;
        console.log(`✅ Unlocking element ${elementId} (was visible: ${wasVisible})`);
        
        if (!wasVisible) {
          unlockedCount++;
        }
      }
    }
    
    console.log(`🎯 Unlocked ${unlockedCount} elements in category ${category}/${area}`);
    
    if (unlockedCount > 0) {
      this.emitEvent('uiflow:category-unlocked', {
        category,
        area,
        elementsUnlocked: unlockedCount,
        trigger: 'rule-action'
      });
    }
  }

  private showTutorial(data: any): void {
    // Emit tutorial event that the application can handle
    this.emitEvent('uiflow:tutorial-requested', {
      tutorial: data?.tutorial || 'default',
      autoStart: data?.autoStart ?? false,
      data
    });
  }

  /**
   * Track element sequences for dependency validation
   */
  trackElementSequence(elementId: ElementId): void {
    const element = this.elements.get(elementId);
    if (!element) return;
    
    const timestamp = Date.now();
    const areaSequenceKey = `${element.area}:sequence`;
    const globalSequenceKey = 'global:sequence';
    
    // Track area-specific sequence
    this.addToSequence(areaSequenceKey, { elementId, timestamp, area: element.area });
    
    // Track global sequence across all areas
    this.addToSequence(globalSequenceKey, { elementId, timestamp, area: element.area });
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
   * Update visibility of elements that may have dependencies satisfied
   */
  updateDependentElements(updateElementVisibility: (elementId: ElementId) => void): void {
    for (const [elementId, elementData] of this.elements) {
      if (elementData.dependencies && elementData.dependencies.length > 0) {
        const shouldBeVisible = this.validateDependencies(elementId);
        if (shouldBeVisible !== elementData.visible) {
          elementData.visible = shouldBeVisible;
          updateElementVisibility(elementId);
          
          // Emit event for newly unlocked elements
          if (shouldBeVisible) {
            this.emitEvent('uiflow:element-unlocked', {
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

  /**
   * Clean up timers and resources
   */
  destroy(): void {
    if (this.ruleCheckTimer) {
      clearInterval(this.ruleCheckTimer);
      this.ruleCheckTimer = undefined;
    }
  }
}

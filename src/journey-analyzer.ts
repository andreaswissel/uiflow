/**
 * JourneyAnalyzer - Handles user behavior analysis, journey tracking, and adaptation
 */

import type {
  ElementId,
  ElementData,
  AreaData,
  AreaId,
  Category,
  UserType,
  UserPattern,
  InteractionData,
  UIFlowConfig
} from './types.js';

import type { Logger } from './logger.js';

export class JourneyAnalyzer {
  private sequenceTracker: Map<string, number[]> = new Map();

  constructor(
    private elements: Map<ElementId, ElementData>,
    private areas: Map<AreaId, AreaData>,
    private usageHistory: Map<string, number[]>,
    private config: Required<UIFlowConfig>,
    private emitEvent: (eventName: string, detail: any) => void,
    private getAcceleratedTime: () => number,
    private unlockCategory: (category: Category, area: AreaId) => void,
    private logger: Logger
  ) {}

  /**
   * Track element sequences for dependency validation and user journey analysis
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
    this.emitEvent('uiflow:journey-analyzed', {
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
          // This would trigger highlighting through the main class
          this.emitEvent('uiflow:element-flagged-new', { 
            elementId, 
            helpText: element.helpText || 'Try this feature!',
            duration: 5000 
          });
        }
      }
    }
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
    
    // Emit event to trigger dependency updates
    this.emitEvent('uiflow:simulation-complete', { area, interactions: interactions.length });
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
    
    this.logger.simulation(typeof type === 'string' ? type : 'custom', targetAreas);
  }

  /**
   * Get recent usage statistics for an area
   */
  getRecentUsageByArea(area: AreaId, timeWindow: number = 7 * 24 * 60 * 60 * 1000): Record<Category, number> {
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

  /**
   * Record usage in history for analysis
   */
  recordUsageHistory(area: AreaId, category: Category, timestamp: number): void {
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

  /**
   * Get elements for a specific area
   */
  private getElementsForArea(area: AreaId): ElementData[] {
    return Array.from(this.elements.values()).filter(el => el.area === area);
  }

  /**
   * Reset journey data for an area
   */
  resetArea(area: AreaId): void {
    // Clear usage history for this area
    for (const category of this.config.categories) {
      const key = `${area}:${category}`;
      this.usageHistory.delete(key);
    }
    
    // Clear sequence tracking for this area
    const sequenceKey = `${area}:sequence`;
    this.sequenceTracker.delete(sequenceKey);
    
    this.logger.debug(`Reset journey data for ${area}`);
  }

  /**
   * Get journey statistics
   */
  getJourneyStats(area: AreaId): {
    totalInteractions: number;
    recentActivity: number;
    sequenceLength: number;
    usagePattern: Record<Category, number>;
  } {
    const sequenceKey = `${area}:sequence`;
    const sequence = this.sequenceTracker.get(sequenceKey) || [];
    const recentUsage = this.getRecentUsageByArea(area);
    
    return {
      totalInteractions: Object.values(recentUsage).reduce((a, b) => a + b, 0),
      recentActivity: sequence.slice(-10).length,
      sequenceLength: sequence.length,
      usagePattern: recentUsage
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.sequenceTracker.clear();
  }
}

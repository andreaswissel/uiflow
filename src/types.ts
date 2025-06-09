/**
 * TypeScript type definitions for UIFlow
 */

export type Category = 'basic' | 'advanced' | 'expert';
export type AreaId = string;
export type ElementId = string;
// Removed: DensityLevel - no longer using density system

export interface UIFlowConfig {
  categories?: Category[];
  learningRate?: number;
  storageKey?: string;
  timeAcceleration?: number;
  adaptationThreshold?: number;
  decayRate?: number;
  syncInterval?: number;
  userId?: string | null;
  dataSources?: Record<string, DataSourceConfig>;
  debug?: boolean | 'verbose'; // false = no logs, true = important logs, 'verbose' = all logs
}

export interface DataSourceConfig {
  endpoint?: string;
  writeKey?: string;
  trackingPlan?: string;
  useUserProperties?: boolean;
  primary?: boolean;
}

export interface ElementData {
  element: HTMLElement;
  category: Category;
  area: AreaId;
  visible: boolean;
  interactions: number;
  lastUsed: number | null;
  helpText?: string | undefined;
  isNew?: boolean;
  dependencies?: ElementDependency[];
}

export interface AreaData {
  lastActivity: number;
  totalInteractions: number;
}

export interface ElementOptions {
  helpText?: string | undefined;
  isNew?: boolean;
  dependencies?: ElementDependency[] | undefined;
}

export interface ElementDependency {
  type: 'usage_count' | 'sequence' | 'time_based' | 'logical_and' | 'logical_or';
  elementId?: ElementId;
  elements?: ElementId[];
  threshold?: number;
  timeWindow?: string; // e.g., '7d', '30d'
  minUsage?: number;
  description?: string;
}

export interface FlowConfiguration {
  name: string;
  version: string;
  areas: Record<AreaId, AreaConfiguration>;
  rules?: FlowRule[];
  templates?: RuleTemplate[];
  abTest?: ABTestConfiguration;
}

export interface ABTestConfiguration {
  enabled: boolean;
  testId: string;
  variants: ABTestVariant[];
  trafficAllocation: number[]; // Percentage allocation for each variant
  metrics: string[]; // Metrics to track
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  configuration: Partial<FlowConfiguration>;
}

export interface AreaConfiguration {
  elements: ElementConfiguration[];
  rules?: AreaRule[];
}

export interface ElementConfiguration {
  id: ElementId;
  selector: string;
  category: Category;
  helpText?: string;
  dependencies?: ElementDependency[];
  metadata?: Record<string, any>;
}

export interface FlowRule {
  name: string;
  trigger: RuleTrigger;
  action: RuleAction;
  conditions?: RuleCondition[];
}

export interface RuleTrigger {
  type: 'usage_pattern' | 'time_based' | 'element_interaction' | 'custom_event';
  elements?: ElementId[];
  frequency?: 'daily' | 'weekly' | 'monthly';
  duration?: string;
  threshold?: number;
}

export interface RuleAction {
  type: 'unlock_element' | 'unlock_category' | 'show_tutorial' | 'send_event';
  elementId?: ElementId;
  category?: Category;
  area?: AreaId;
  data?: any;
}

export interface RuleCondition {
  type: 'user_property' | 'time_range' | 'feature_flag' | 'custom';
  property?: string;
  value?: any;
  operator?: 'equals' | 'greater_than' | 'less_than' | 'contains';
}

export interface AreaRule {
  name: string;
  trigger: RuleTrigger;
  action: RuleAction;
  area: AreaId;
}

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: 'onboarding' | 'progressive_disclosure' | 'power_user' | 'custom';
  template: Partial<FlowRule>;
}

export interface HighlightOptions {
  duration?: number;
  tooltip?: string;
  persistent?: boolean;
  onDismiss?: (elementId: ElementId) => void;
}

export interface HighlightInfo {
  style: string;
  startTime: number;
  duration: number;
  tooltip: string | undefined;
  persistent: boolean;
  onDismiss: ((elementId: ElementId) => void) | undefined;
}

export interface InteractionData {
  category: Category;
}

export interface UserPattern {
  basic: number;
  advanced: number;
  expert: number;
}

export type UserType = 'beginner' | 'intermediate' | 'power-user' | 'expert';

export interface UserSimulationOptions {
  pattern?: UserPattern;
  areas?: AreaId[];
  interactions?: number;
  timespan?: string; // e.g., '7d', '2w', '1m'
}

export interface AreaStats {
  visibleElements: number;
  totalElements: number;
  recentUsage: Record<Category, number>;
  adaptationEvents: number;
}

export interface UsageHistoryEntry {
  timestamp: number;
  category: Category;
  area: AreaId;
}

export interface StoredData {
  areas: [AreaId, AreaData][];
  usageHistory: [string, number[]][];
  lastSaved: number;
}

export interface EventDetail {
  area?: AreaId;
  areas?: string[];
  totalInteractions?: number;
  elementId?: ElementId;
  style?: string;
  options?: HighlightOptions;
  sources?: string[];
  data?: any;
  error?: string;
  behavior?: string;
  category?: Category;
  rule?: string;
  tutorial?: string;
  config?: any;
  testVariant?: string;
  abTestVariant?: string | undefined;
  interactionRate?: number;
  metric?: string;
  trigger?: string | RuleTrigger;
  elementsUnlocked?: number;
  autoStart?: boolean;
  dependencies?: ElementDependency[];
  advancedFeatureUsage?: number;
  value?: number;
  totalSequenceLength?: number;
  action?: RuleAction;
  recentActivity?: number;
}

export interface DataSourceInterface {
  initialize(): Promise<void>;
  pullData(userId: string): Promise<any>;
  pushData(userId: string, data: any): Promise<void>;
  trackEvent(userId: string, event: any): Promise<void>;
  identifyUser?(userId: string, traits: any): Promise<void>;
  destroy(): void;
}

export type UIFlowEventType = 
  | 'uiflow:initialized'
  | 'uiflow:adaptation'
  | 'uiflow:sync-success'
  | 'uiflow:sync-error'
  | 'uiflow:push-success'
  | 'uiflow:push-error'
  | 'uiflow:highlight-added'
  | 'uiflow:highlight-removed'
  | 'uiflow:datasource-added'
  | 'uiflow:datasource-removed'
  | 'uiflow:destroyed';

export interface UIFlowEvent extends CustomEvent {
  detail: EventDetail;
}

// Utility types for framework adapters
export interface ReactUIFlowContext {
  uiflow: UIFlowInstance | null;
  isReady: boolean;
}

export interface VueUIFlowInstance {
  uiflow: { value: UIFlowInstance | null };
  isReady: { value: boolean };
  error: { value: Error | null };
  initialize: () => Promise<void>;
  destroy: () => void;
}

export interface AngularUIFlowConfig extends UIFlowConfig {
  // Angular-specific configuration
}

// Main UIFlow class interface
export interface UIFlowInstance {
  config: Required<UIFlowConfig>;
  
  // ✅ Encapsulated getters instead of direct property access
  getElementCount(): number;
  getAreaCount(): number;
  getElementsForArea(area: AreaId): ElementData[];
  isInitialized(): boolean;
  getNewVisibleElements(): Array<{ elementId: ElementId; helpText: string | undefined }>;
  getVisibleElementsWithHelp(): Array<{ elementId: ElementId; helpText: string }>;
  getVisibleElementsSorted(): Array<{ elementId: ElementId; category: Category; helpText: string | undefined }>;
  
  // Core methods
  init(config?: Partial<UIFlowConfig>): Promise<UIFlowInstance>;
  destroy(): void;
  
  // Element management
  categorize(
    element: HTMLElement, 
    category: Category, 
    area?: AreaId, 
    options?: ElementOptions
  ): UIFlowInstance;
  
  // Element visibility
  shouldShowElement(category: Category, area?: AreaId): boolean;
  
  // Data source management
  addDataSource(name: string, type: string, config: DataSourceConfig, isPrimary?: boolean): UIFlowInstance;
  removeDataSource(name: string): UIFlowInstance;
  getDataSource(name: string): DataSourceInterface | undefined;
  forceSync(): Promise<void>;
  
  // User education
  highlightElement(elementId: ElementId, style?: string, options?: HighlightOptions): UIFlowInstance;
  removeHighlight(elementId: ElementId): UIFlowInstance;
  flagAsNew(elementId: ElementId, helpText?: string, duration?: number): UIFlowInstance;
  showTooltip(elementId: ElementId, text: string, options?: Partial<HighlightOptions>): UIFlowInstance;
  clearAllHighlights(): UIFlowInstance;
  getHighlights(): ElementId[];
  
  // Testing and simulation
  simulateUsage(area: AreaId, interactions: InteractionData[], daysToSimulate?: number): void;
  simulateUserType(type: UserType | UserPattern, areas?: AreaId | AreaId[]): void;
  
  // Demo and testing helpers
  setDemoMode(enabled: boolean): void;

  resetArea(area: AreaId, preserveUnlockedCategories?: boolean): void;
  
  // Enhanced statistics
  getAreaStats(area: AreaId): AreaStats;
  getOverviewStats(): Record<AreaId, AreaStats>;
  
  // Configuration system
  loadConfiguration(config: FlowConfiguration): Promise<UIFlowInstance>;
  exportConfiguration(): FlowConfiguration;
  validateDependencies(elementId: ElementId): boolean;
  
  // A/B Testing
  trackABTestMetric(metric: string, value?: number): void;
  getABTestResults(): { variant: string | undefined; metrics: Record<string, number> };
}

// Global type augmentation for custom events
declare global {
  interface DocumentEventMap {
    'uiflow:initialized': UIFlowEvent;
    'uiflow:density-changed': UIFlowEvent;
    'uiflow:adaptation': UIFlowEvent;
    'uiflow:sync-success': UIFlowEvent;
    'uiflow:sync-error': UIFlowEvent;
    'uiflow:push-success': UIFlowEvent;
    'uiflow:push-error': UIFlowEvent;
    'uiflow:override-applied': UIFlowEvent;
    'uiflow:override-cleared': UIFlowEvent;
    'uiflow:highlight-added': UIFlowEvent;
    'uiflow:highlight-removed': UIFlowEvent;
    'uiflow:datasource-added': UIFlowEvent;
    'uiflow:datasource-removed': UIFlowEvent;
    'uiflow:destroyed': UIFlowEvent;
  }
}

/**
 * UIFlow Vue Adapter Type Definitions
 */

import type { 
  Ref, 
  ComputedRef, 
  InjectionKey, 
  App,
  DefineComponent
} from 'vue';

import type {
  UIFlowConfig,
  UIFlowInstance,
  Category,
  AreaId,
  DensityLevel,
  ElementOptions,
  HighlightOptions
} from '../../types.js';

// Vue composable return types
export interface CreateUIFlowReturn {
  uiflow: ComputedRef<UIFlowInstance | null>;
  isReady: ComputedRef<boolean>;
  error: ComputedRef<Error | null>;
  initialize: () => Promise<void>;
  destroy: () => void;
}

export interface UseUIFlowElementReturn {
  elementRef: Ref<HTMLElement | null>;
  isVisible: ComputedRef<boolean>;
  uiflow: ComputedRef<UIFlowInstance | null>;
}

export interface UseAreaDensityReturn {
  density: ComputedRef<DensityLevel>;
  hasOverride: ComputedRef<boolean>;
  setDensityLevel: (level: DensityLevel) => void;
}

export interface UseUIFlowHighlightReturn {
  highlight: (elementId: string, style?: string, options?: HighlightOptions) => UIFlowInstance | undefined;
  removeHighlight: (elementId: string) => UIFlowInstance | undefined;
  flagAsNew: (elementId: string, helpText?: string, duration?: number) => UIFlowInstance | undefined;
  showTooltip: (elementId: string, text: string, options?: Partial<HighlightOptions>) => UIFlowInstance | undefined;
}

// Injection key
export const UIFlowKey: InjectionKey<CreateUIFlowReturn>;

// Composable functions
export function createUIFlow(config?: Partial<UIFlowConfig>): CreateUIFlowReturn;

export function provideUIFlow(uiflowInstance: CreateUIFlowReturn): void;

export function useUIFlow(): CreateUIFlowReturn;

export function useUIFlowElement(
  category: Category,
  area?: AreaId,
  options?: ElementOptions
): UseUIFlowElementReturn;

export function useAreaDensity(area?: AreaId): UseAreaDensityReturn;

export function useUIFlowHighlight(): UseUIFlowHighlightReturn;

export function useUIFlowEvents(eventHandlers: Record<string, (detail: any) => void>): void;

// Component props
export interface UIFlowElementProps {
  category: Category;
  area?: AreaId;
  helpText?: string;
  isNew?: boolean;
  tag?: string;
  fallback?: string;
}

export interface UIFlowConditionalProps {
  area?: AreaId;
  minDensity?: DensityLevel;
  maxDensity?: DensityLevel;
  fallback?: string;
}

export interface UIFlowDensityIndicatorProps {
  area?: AreaId;
  showOverride?: boolean;
}

// Vue components
export const UIFlowElement: DefineComponent<UIFlowElementProps>;
export const UIFlowConditional: DefineComponent<UIFlowConditionalProps>;
export const UIFlowDensityIndicator: DefineComponent<UIFlowDensityIndicatorProps>;

// Plugin type
export interface UIFlowPluginOptions {
  config?: Partial<UIFlowConfig>;
}

export const UIFlowPlugin: {
  install: (app: App, options?: UIFlowPluginOptions) => void;
};

// Version export
export const VUE_ADAPTER_VERSION: string;

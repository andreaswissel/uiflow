/**
 * UIFlow React Adapter Type Definitions
 */

import { 
  ReactNode, 
  RefObject, 
  ComponentProps, 
  FunctionComponent,
  Context
} from 'react';

import type {
  UIFlowConfig,
  UIFlowInstance,
  Category,
  AreaId,
  DensityLevel,
  ElementOptions,
  HighlightOptions
} from '../../types.js';

// Context types
export interface UIFlowContextValue {
  uiflow: UIFlowInstance | null;
  isReady: boolean;
}

export const UIFlowContext: Context<UIFlowContextValue | null>;

// Provider component props
export interface UIFlowProviderProps {
  children: ReactNode;
  config?: Partial<UIFlowConfig>;
  onReady?: (uiflow: UIFlowInstance) => void;
}

export const UIFlowProvider: FunctionComponent<UIFlowProviderProps>;

// Hook return types
export interface UseUIFlowReturn {
  uiflow: UIFlowInstance | null;
  isReady: boolean;
}

export interface UseUIFlowElementReturn {
  elementRef: RefObject<HTMLElement>;
  isVisible: boolean;
  uiflow: UIFlowInstance | null;
}

export interface UseAreaDensityReturn {
  density: DensityLevel;
  hasOverride: boolean;
  setDensityLevel: (level: DensityLevel) => void;
}

export interface UseUIFlowHighlightReturn {
  highlight: (elementId: string, style?: string, options?: HighlightOptions) => UIFlowInstance | undefined;
  removeHighlight: (elementId: string) => UIFlowInstance | undefined;
  flagAsNew: (elementId: string, helpText?: string, duration?: number) => UIFlowInstance | undefined;
  showTooltip: (elementId: string, text: string, options?: Partial<HighlightOptions>) => UIFlowInstance | undefined;
}

// Hook functions
export function useUIFlow(): UseUIFlowReturn;

export function useUIFlowElement(
  category: Category,
  area?: AreaId,
  options?: ElementOptions
): UseUIFlowElementReturn;

export function useAreaDensity(area?: AreaId): UseAreaDensityReturn;

export function useUIFlowHighlight(): UseUIFlowHighlightReturn;

export function useUIFlowEvents(eventHandlers: Record<string, (detail: any) => void>): void;

// Component props
export interface UIFlowElementProps extends ComponentProps<'div'> {
  category: Category;
  area?: AreaId;
  helpText?: string;
  isNew?: boolean;
  as?: keyof JSX.IntrinsicElements;
  fallback?: ReactNode;
}

export interface UIFlowConditionalProps {
  area?: AreaId;
  minDensity?: DensityLevel;
  maxDensity?: DensityLevel;
  children: ReactNode;
  fallback?: ReactNode;
}

export interface UIFlowDensityIndicatorProps {
  area?: AreaId;
  showOverride?: boolean;
}

// Component functions
export const UIFlowElement: FunctionComponent<UIFlowElementProps>;
export const UIFlowConditional: FunctionComponent<UIFlowConditionalProps>;
export const UIFlowDensityIndicator: FunctionComponent<UIFlowDensityIndicatorProps>;

// Version export
export const REACT_ADAPTER_VERSION: string;

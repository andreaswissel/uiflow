/**
 * UIFlow React Adapter
 * React hooks and components for UIFlow integration
 */

import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { UIFlow } from '../../index.js';

// React Context for UIFlow instance
const UIFlowContext = createContext(null);

/**
 * UIFlow Provider Component
 * Wraps your app to provide UIFlow instance to all child components
 */
export function UIFlowProvider({ children, config = {}, onReady = null }) {
  const [uiflow, setUIFlow] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const instance = new UIFlow();
    
    instance.init(config).then(() => {
      setUIFlow(instance);
      setIsReady(true);
      if (onReady) onReady(instance);
    }).catch(console.error);

    return () => {
      if (instance) {
        instance.destroy();
      }
    };
  }, []);

  return React.createElement(UIFlowContext.Provider, { 
    value: { uiflow, isReady } 
  }, children);
}

/**
 * Hook to access UIFlow instance
 */
export function useUIFlow() {
  const context = useContext(UIFlowContext);
  if (!context) {
    throw new Error('useUIFlow must be used within UIFlowProvider');
  }
  return context;
}

/**
 * Hook for element categorization with ref
 */
export function useUIFlowElement(category, area = 'default', options = {}) {
  const elementRef = useRef(null);
  const { uiflow, isReady } = useUIFlow();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isReady || !uiflow || !elementRef.current) return;

    // Categorize element
    uiflow.categorize(elementRef.current, category, area, options);

    // Listen for visibility changes
    const handleVisibilityChange = (event) => {
      if (event.detail.area === area) {
        const shouldShow = uiflow.shouldShowElement(category, area);
        setIsVisible(shouldShow);
      }
    };

    document.addEventListener('uiflow:density-changed', handleVisibilityChange);
    document.addEventListener('uiflow:adaptation', handleVisibilityChange);
    document.addEventListener('uiflow:override-applied', handleVisibilityChange);

    // Initial visibility check
    setIsVisible(uiflow.shouldShowElement(category, area));

    return () => {
      document.removeEventListener('uiflow:density-changed', handleVisibilityChange);
      document.removeEventListener('uiflow:adaptation', handleVisibilityChange);
      document.removeEventListener('uiflow:override-applied', handleVisibilityChange);
    };
  }, [isReady, category, area, options.helpText, options.isNew]);

  return { elementRef, isVisible, uiflow: isReady ? uiflow : null };
}

// Removed: useAreaDensity - no longer using density system

/**
 * Hook for element highlighting
 */
export function useUIFlowHighlight() {
  const { uiflow, isReady } = useUIFlow();

  const highlight = useCallback((elementId, style = 'default', options = {}) => {
    if (uiflow) {
      return uiflow.highlightElement(elementId, style, options);
    }
  }, [uiflow]);

  const removeHighlight = useCallback((elementId) => {
    if (uiflow) {
      return uiflow.removeHighlight(elementId);
    }
  }, [uiflow]);

  const flagAsNew = useCallback((elementId, helpText, duration) => {
    if (uiflow) {
      return uiflow.flagAsNew(elementId, helpText, duration);
    }
  }, [uiflow]);

  const showTooltip = useCallback((elementId, text, options) => {
    if (uiflow) {
      return uiflow.showTooltip(elementId, text, options);
    }
  }, [uiflow]);

  return { highlight, removeHighlight, flagAsNew, showTooltip };
}

/**
 * UIFlow Element Component
 * Wrapper component that automatically categorizes and manages visibility
 */
export function UIFlowElement({ 
  category, 
  area = 'default', 
  helpText = null,
  isNew = false,
  children, 
  as = 'div',
  fallback = null,
  ...props 
}) {
  const { elementRef, isVisible } = useUIFlowElement(category, area, { helpText, isNew });

  if (!isVisible) {
    return fallback;
  }

  return React.createElement(as, { 
    ref: elementRef, 
    ...props 
  }, children);
}

/**
 * Simple conditional render - simplified without density
 */
export function UIFlowConditional({ 
  area = 'default', 
  children,
  fallback = null 
}) {
  // Simplified: always render children for now
  // Could be extended to check element visibility in area
  return children;
}

// Removed: UIFlowDensityIndicator - no longer using density system

/**
 * Hook for UIFlow events
 */
export function useUIFlowEvents(eventHandlers = {}) {
  const { isReady } = useUIFlow();

  useEffect(() => {
    if (!isReady) return;

    const listeners = [];

    Object.entries(eventHandlers).forEach(([eventName, handler]) => {
      const fullEventName = eventName.startsWith('uiflow:') ? eventName : `uiflow:${eventName}`;
      
      const listener = (event) => handler(event.detail);
      document.addEventListener(fullEventName, listener);
      listeners.push([fullEventName, listener]);
    });

    return () => {
      listeners.forEach(([eventName, listener]) => {
        document.removeEventListener(eventName, listener);
      });
    };
  }, [isReady, eventHandlers]);
}

// Export React version for compatibility check
export const REACT_ADAPTER_VERSION = '1.0.0';

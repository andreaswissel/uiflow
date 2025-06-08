/**
 * UIFlow Vue Adapter
 * Vue composables and components for UIFlow integration
 */

import { ref, reactive, computed, onMounted, onUnmounted, inject, provide, watch, nextTick } from 'vue';
import { UIFlow } from '../../index.js';

// Vue injection key
const UIFlowKey = Symbol('UIFlow');

/**
 * Create UIFlow instance and provide to child components
 */
export function createUIFlow(config = {}) {
  const uiflow = ref(null);
  const isReady = ref(false);
  const error = ref(null);

  const initialize = async () => {
    try {
      const instance = new UIFlow();
      await instance.init(config);
      uiflow.value = instance;
      isReady.value = true;
    } catch (err) {
      error.value = err;
      console.error('UIFlow initialization failed:', err);
    }
  };

  const destroy = () => {
    if (uiflow.value) {
      uiflow.value.destroy();
      uiflow.value = null;
      isReady.value = false;
    }
  };

  return {
    uiflow: computed(() => uiflow.value),
    isReady: computed(() => isReady.value),
    error: computed(() => error.value),
    initialize,
    destroy
  };
}

/**
 * Provide UIFlow instance to component tree
 */
export function provideUIFlow(uiflowInstance) {
  provide(UIFlowKey, uiflowInstance);
}

/**
 * Use UIFlow instance from provider
 */
export function useUIFlow() {
  const uiflowInstance = inject(UIFlowKey);
  if (!uiflowInstance) {
    throw new Error('useUIFlow must be used within a component that provides UIFlow');
  }
  return uiflowInstance;
}

/**
 * Composable for element categorization and visibility
 */
export function useUIFlowElement(category, area = 'default', options = {}) {
  const elementRef = ref(null);
  const isVisible = ref(true);
  const { uiflow, isReady } = useUIFlow();

  const categorizeElement = () => {
    if (!isReady.value || !uiflow.value || !elementRef.value) return;

    uiflow.value.categorize(elementRef.value, category, area, options);
    updateVisibility();
  };

  const updateVisibility = () => {
    if (!uiflow.value) return;
    isVisible.value = uiflow.value.shouldShowElement(category, area);
  };

  onMounted(() => {
    if (isReady.value) {
      nextTick(categorizeElement);
    }
  });

  watch(isReady, (ready) => {
    if (ready) {
      nextTick(categorizeElement);
    }
  });

  // Listen for UIFlow events
  onMounted(() => {
    const handleVisibilityChange = (event) => {
      if (event.detail.area === area) {
        updateVisibility();
      }
    };

    document.addEventListener('uiflow:density-changed', handleVisibilityChange);
    document.addEventListener('uiflow:adaptation', handleVisibilityChange);
    document.addEventListener('uiflow:override-applied', handleVisibilityChange);

    onUnmounted(() => {
      document.removeEventListener('uiflow:density-changed', handleVisibilityChange);
      document.removeEventListener('uiflow:adaptation', handleVisibilityChange);
      document.removeEventListener('uiflow:override-applied', handleVisibilityChange);
    });
  });

  return {
    elementRef,
    isVisible: computed(() => isVisible.value),
    uiflow: computed(() => uiflow.value)
  };
}

/**
 * Composable for area density management
 */
export function useAreaDensity(area = 'default') {
  const density = ref(0.3);
  const hasOverride = ref(false);
  const { uiflow, isReady } = useUIFlow();

  const updateDensity = () => {
    if (!uiflow.value) return;
    density.value = uiflow.value.getDensityLevel(area);
    hasOverride.value = uiflow.value.hasOverride(area);
  };

  const setDensityLevel = (level) => {
    if (uiflow.value) {
      uiflow.value.setDensityLevel(level, area);
    }
  };

  onMounted(() => {
    if (isReady.value) {
      updateDensity();
    }

    const handleDensityChange = (event) => {
      if (event.detail.area === area) {
        updateDensity();
      }
    };

    const handleOverride = (event) => {
      if (event.detail.area === area) {
        updateDensity();
      }
    };

    document.addEventListener('uiflow:density-changed', handleDensityChange);
    document.addEventListener('uiflow:adaptation', handleDensityChange);
    document.addEventListener('uiflow:override-applied', handleOverride);
    document.addEventListener('uiflow:override-cleared', handleOverride);

    onUnmounted(() => {
      document.removeEventListener('uiflow:density-changed', handleDensityChange);
      document.removeEventListener('uiflow:adaptation', handleDensityChange);
      document.removeEventListener('uiflow:override-applied', handleOverride);
      document.removeEventListener('uiflow:override-cleared', handleOverride);
    });
  });

  watch(isReady, (ready) => {
    if (ready) {
      updateDensity();
    }
  });

  return {
    density: computed(() => density.value),
    hasOverride: computed(() => hasOverride.value),
    setDensityLevel
  };
}

/**
 * Composable for element highlighting
 */
export function useUIFlowHighlight() {
  const { uiflow } = useUIFlow();

  const highlight = (elementId, style = 'default', options = {}) => {
    if (uiflow.value) {
      return uiflow.value.highlightElement(elementId, style, options);
    }
  };

  const removeHighlight = (elementId) => {
    if (uiflow.value) {
      return uiflow.value.removeHighlight(elementId);
    }
  };

  const flagAsNew = (elementId, helpText, duration) => {
    if (uiflow.value) {
      return uiflow.value.flagAsNew(elementId, helpText, duration);
    }
  };

  const showTooltip = (elementId, text, options) => {
    if (uiflow.value) {
      return uiflow.value.showTooltip(elementId, text, options);
    }
  };

  return {
    highlight,
    removeHighlight,
    flagAsNew,
    showTooltip
  };
}

/**
 * Composable for UIFlow events
 */
export function useUIFlowEvents(eventHandlers = {}) {
  const { isReady } = useUIFlow();

  onMounted(() => {
    if (!isReady.value) return;

    const listeners = [];

    Object.entries(eventHandlers).forEach(([eventName, handler]) => {
      const fullEventName = eventName.startsWith('uiflow:') ? eventName : `uiflow:${eventName}`;
      
      const listener = (event) => handler(event.detail);
      document.addEventListener(fullEventName, listener);
      listeners.push([fullEventName, listener]);
    });

    onUnmounted(() => {
      listeners.forEach(([eventName, listener]) => {
        document.removeEventListener(eventName, listener);
      });
    });
  });

  watch(isReady, (ready) => {
    if (ready) {
      // Re-attach listeners when UIFlow becomes ready
      const listeners = [];

      Object.entries(eventHandlers).forEach(([eventName, handler]) => {
        const fullEventName = eventName.startsWith('uiflow:') ? eventName : `uiflow:${eventName}`;
        
        const listener = (event) => handler(event.detail);
        document.addEventListener(fullEventName, listener);
        listeners.push([fullEventName, listener]);
      });

      onUnmounted(() => {
        listeners.forEach(([eventName, listener]) => {
          document.removeEventListener(eventName, listener);
        });
      });
    }
  });
}

// Vue Components

/**
 * UIFlow Element Component
 */
export const UIFlowElement = {
  props: {
    category: {
      type: String,
      required: true
    },
    area: {
      type: String,
      default: 'default'
    },
    helpText: {
      type: String,
      default: null
    },
    isNew: {
      type: Boolean,
      default: false
    },
    tag: {
      type: String,
      default: 'div'
    },
    fallback: {
      type: String,
      default: null
    }
  },
  setup(props, { slots }) {
    const { elementRef, isVisible } = useUIFlowElement(
      props.category, 
      props.area, 
      { 
        helpText: props.helpText,
        isNew: props.isNew
      }
    );

    return {
      elementRef,
      isVisible
    };
  },
  render() {
    if (!this.isVisible) {
      return this.fallback ? h('div', this.fallback) : null;
    }

    return h(this.tag, {
      ref: 'elementRef'
    }, this.$slots.default?.());
  }
};

/**
 * Conditional rendering component
 */
export const UIFlowConditional = {
  props: {
    area: {
      type: String,
      default: 'default'
    },
    minDensity: {
      type: Number,
      default: 0
    },
    maxDensity: {
      type: Number,
      default: 1
    },
    fallback: {
      type: String,
      default: null
    }
  },
  setup(props, { slots }) {
    const { density } = useAreaDensity(props.area);
    
    const shouldRender = computed(() => {
      return density.value >= props.minDensity && density.value <= props.maxDensity;
    });

    return {
      shouldRender
    };
  },
  render() {
    if (!this.shouldRender) {
      return this.fallback ? h('div', this.fallback) : null;
    }

    return this.$slots.default?.();
  }
};

/**
 * Density indicator component
 */
export const UIFlowDensityIndicator = {
  props: {
    area: {
      type: String,
      default: 'default'
    },
    showOverride: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    const { density, hasOverride } = useAreaDensity(props.area);
    
    return {
      density,
      hasOverride
    };
  },
  render() {
    const style = {
      padding: '4px 8px',
      backgroundColor: this.hasOverride ? '#fbbf24' : '#3b82f6',
      color: 'white',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 'bold'
    };

    return h('div', {
      class: 'uiflow-density-indicator',
      style
    }, [
      h('span', `${this.area}: `),
      h('span', `${Math.round(this.density * 100)}%`),
      this.showOverride && this.hasOverride && h('span', {
        style: { marginLeft: '4px', opacity: 0.8 }
      }, ' (override)')
    ]);
  }
};

// Vue plugin for global installation
export const UIFlowPlugin = {
  install(app, options = {}) {
    // Register components globally
    app.component('UIFlowElement', UIFlowElement);
    app.component('UIFlowConditional', UIFlowConditional);
    app.component('UIFlowDensityIndicator', UIFlowDensityIndicator);

    // Provide global UIFlow instance if configured
    if (options.config) {
      const uiflowInstance = createUIFlow(options.config);
      uiflowInstance.initialize();
      app.provide(UIFlowKey, uiflowInstance);
    }
  }
};

// Export Vue version for compatibility check
export const VUE_ADAPTER_VERSION = '1.0.0';

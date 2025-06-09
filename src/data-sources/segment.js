/**
 * Segment data source for UIFlow
 */
import { BaseDataSource } from './base.js';

export class SegmentDataSource extends BaseDataSource {
  constructor(config = {}) {
    super(config);
    this.writeKey = config.writeKey;
    this.trackingPlan = config.trackingPlan || 'uiflow';
    this.useUserProperties = config.useUserProperties !== false; // Default true
    this.analytics = null;
    
    if (!this.writeKey) {
      throw new Error('Segment write key is required');
    }
  }

  async initialize() {
    // Load Segment Analytics.js if not already loaded
    if (!window.analytics) {
      await this.loadSegmentScript();
    }
    
    this.analytics = window.analytics;
    
    // Initialize Segment if not already done
    if (!this.analytics.initialized) {
      this.analytics.load(this.writeKey);
    }
    
    this.ready = true;
  }

  async loadSegmentScript() {
    return new Promise((resolve, reject) => {
      // Segment's analytics.js snippet (simplified)
      const analytics = window.analytics = window.analytics || [];
      
      if (analytics.initialize) {
        resolve();
        return;
      }
      
      if (analytics.invoked) {
        console.error('Segment snippet included twice.');
        reject(new Error('Segment already loaded'));
        return;
      }
      
      analytics.invoked = true;
      analytics.methods = [
        'trackSubmit', 'trackClick', 'trackLink', 'trackForm', 'pageview', 'identify',
        'reset', 'group', 'track', 'ready', 'alias', 'debug', 'page', 'once', 'off', 'on'
      ];
      
      analytics.factory = function(method) {
        return function() {
          const args = Array.prototype.slice.call(arguments);
          args.unshift(method);
          analytics.push(args);
          return analytics;
        };
      };
      
      for (let i = 0; i < analytics.methods.length; i++) {
        const method = analytics.methods[i];
        analytics[method] = analytics.factory(method);
      }
      
      analytics.load = function(key, options) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = 'https://cdn.segment.com/analytics.js/v1/' + key + '/analytics.min.js';
        
        script.onload = resolve;
        script.onerror = reject;
        
        const first = document.getElementsByTagName('script')[0];
        first.parentNode.insertBefore(script, first);
        
        analytics._loadOptions = options;
      };
      
      analytics.SNIPPET_VERSION = '4.13.1';
    });
  }

  async pushData(userId, data) {
    if (!this.isReady()) {
      throw new Error('Segment data source not ready');
    }

    // Store UI density preferences as user traits
    if (this.useUserProperties) {
      this.analytics.identify(userId, {
        uiflow_areas: data.areas,
        uiflow_last_updated: Date.now(),
        uiflow_total_interactions: this.getTotalInteractions(data.usageHistory)
      });
    }

    // Track the settings update event
    this.analytics.track('UIFlow Settings Updated', {
      userId,
      areas: data.areas,
      source: this.trackingPlan,
      timestamp: Date.now()
    });
  }

  async pullData(userId) {
    if (!this.isReady()) {
      throw new Error('Segment data source not ready');
    }

    // Segment doesn't typically provide user data retrieval in the browser
    // This would need to be implemented via Segment's Personas API or similar
    // For now, return empty data and rely on local storage + tracking
    console.warn('Segment data source: pullData not implemented - Segment is primarily for tracking');
    
    return {
      areas: {},
      overrides: {},
      usageHistory: [],
      note: 'Segment is write-only from browser. Use Segment Personas API for reading user data.'
    };
  }

  async trackEvent(userId, event) {
    if (!this.isReady()) return;

    // Map UIFlow events to Segment events
    const segmentEvent = this.mapToSegmentEvent(event);
    
    this.analytics.track(segmentEvent.name, {
      ...segmentEvent.properties,
      userId,
      source: this.trackingPlan,
      timestamp: Date.now()
    });
  }

  mapToSegmentEvent(event) {
    const { elementId, category, area, action } = event;
    
    return {
      name: 'UI Element Interacted',
      properties: {
        element_id: elementId,
        element_category: category,
        ui_area: area,
        action_type: action || 'click',
        density_level: event.densityLevel,
        is_new_feature: event.isNew || false
      }
    };
  }

  getTotalInteractions(usageHistory) {
    if (!Array.isArray(usageHistory)) return 0;
    
    return usageHistory.reduce((total, [key, interactions]) => {
      return total + (Array.isArray(interactions) ? interactions.length : 0);
    }, 0);
  }

  // Segment-specific methods
  async identifyUser(userId, traits = {}) {
    if (!this.isReady()) return Promise.resolve();
    
    this.analytics.identify(userId, {
      ...traits,
      uiflow_enabled: true,
      uiflow_initialized_at: Date.now()
    });
    
    return Promise.resolve();
  }

  trackPageView(userId, page = {}) {
    if (!this.isReady()) return;
    
    this.analytics.page({
      ...page,
      uiflow_enabled: true,
      source: this.trackingPlan
    });
  }

  trackDensityChange(userId, area, oldDensity, newDensity, reason) {
    if (!this.isReady()) return;
    
    this.analytics.track('UIFlow Density Changed', {
      userId,
      ui_area: area,
      old_density: oldDensity,
      new_density: newDensity,
      change_reason: reason, // 'user_manual', 'auto_adaptation', 'admin_override'
      source: this.trackingPlan
    });
  }

  trackFeatureDiscovery(userId, elementId, category, area) {
    if (!this.isReady()) return;
    
    this.analytics.track('UIFlow Feature Discovered', {
      userId,
      element_id: elementId,
      element_category: category,
      ui_area: area,
      source: this.trackingPlan
    });
  }
}

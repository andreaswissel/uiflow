/**
 * UIFlow - Adaptive UI density management library
 * Licensed under CC BY-NC 4.0
 */

import { DataSourceManager, APIDataSource, SegmentDataSource } from './data-sources/index.js';

export class UIFlow {
  constructor(options = {}) {
    this.config = {
      categories: ['basic', 'advanced', 'expert'],
      learningRate: 0.1,
      storageKey: 'uiflow-data',
      timeAcceleration: 1, // For testing: 1 = real time, 100 = 100x faster
      adaptationThreshold: 3, // Interactions needed before adaptation
      decayRate: 0.95, // How quickly old usage patterns fade
      syncInterval: 5 * 60 * 1000, // Sync with data sources every 5 minutes
      userId: null, // User identifier for data sources
      // Data source configuration
      dataSources: {
        // api: { endpoint: 'https://api.example.com', primary: true },
        // segment: { writeKey: 'your-segment-key', primary: false }
      },
      ...options
    };
    
    this.elements = new Map();
    this.areas = new Map(); // Area-specific density tracking
    this.usageHistory = new Map(); // Time-based usage tracking
    this.defaultDensity = 0.3; // Start conservative
    this.initialized = false;
    this.syncTimer = null;
    this.remoteOverrides = new Map(); // Remote overrides from data sources
    this.highlights = new Map(); // Element highlighting/flagging
    this.highlightStyles = null; // Injected CSS for highlights
    this.dataManager = new DataSourceManager(); // Manage multiple data sources
  }

  /**
   * Initialize UIFlow with configuration
   */
  async init(options = {}) {
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
    this.emit('uiflow:initialized', { areas: this.getAreaDensities() });
    
    return this;
  }

  /**
   * Categorize a UI element with optional area specification
   */
  categorize(element, category, area = 'default', options = {}) {
    if (!this.config.categories.includes(category)) {
      throw new Error(`Invalid category: ${category}`);
    }
    
    const id = this.getElementId(element);
    this.elements.set(id, {
      element,
      category,
      area,
      visible: true,
      interactions: 0,
      lastUsed: null,
      helpText: options.helpText || null,
      isNew: options.isNew || false
    });
    
    // Initialize area if not exists
    if (!this.areas.has(area)) {
      this.areas.set(area, {
        density: this.defaultDensity,
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
   * Get density level for specific area (0-1)
   * Checks remote overrides first, then local data
   */
  getDensityLevel(area = 'default') {
    // Check for remote override first
    if (this.remoteOverrides.has(area)) {
      return this.remoteOverrides.get(area);
    }
    
    const areaData = this.areas.get(area);
    return areaData ? areaData.density : this.defaultDensity;
  }

  /**
   * Get all area densities
   */
  getAreaDensities() {
    const densities = {};
    for (const [area, data] of this.areas) {
      densities[area] = data.density;
    }
    return densities;
  }

  /**
   * Set density level for specific area manually
   */
  setDensityLevel(level, area = 'default', options = {}) {
    const clampedLevel = Math.max(0, Math.min(1, level));
    
    if (!this.areas.has(area)) {
      this.areas.set(area, {
        density: clampedLevel,
        lastActivity: Date.now(),
        totalInteractions: 0
      });
    } else {
      this.areas.get(area).density = clampedLevel;
    }
    
    this.updateAreaElementsVisibility(area);
    this.emit('uiflow:density-changed', { 
      area, 
      density: clampedLevel,
      areas: this.getAreaDensities()
    });

    // Push to data sources unless explicitly skipped
    if (!options.skipAPI && this.config.userId) {
      this.pushToDataSources();
    }

    return this;
  }

  // Private methods
  getElementId(element) {
    return element.id || `uiflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  updateElementVisibility(elementId) {
    const data = this.elements.get(elementId);
    if (!data) return;

    const shouldShow = this.shouldShowElement(data.category, data.area);
    const wasVisible = data.visible;
    
    if (data.visible !== shouldShow) {
      data.visible = shouldShow;
      data.element.style.display = shouldShow ? '' : 'none';
      data.element.setAttribute('data-uiflow-visible', shouldShow);
      
      // If element just became visible and it's new, highlight it
      if (shouldShow && !wasVisible && data.isNew) {
        this.highlightElement(elementId, 'new-feature');
      }
    }
  }

  shouldShowElement(category, area = 'default') {
    const categoryIndex = this.config.categories.indexOf(category);
    const threshold = categoryIndex / (this.config.categories.length - 1);
    const areaDensity = this.getDensityLevel(area);
    return areaDensity >= threshold;
  }

  updateAreaElementsVisibility(area) {
    for (const [id, data] of this.elements) {
      if (data.area === area) {
        this.updateElementVisibility(id);
      }
    }
  }

  updateAllElementsVisibility() {
    for (const [id] of this.elements) {
      this.updateElementVisibility(id);
    }
  }

  setupObservers() {
    // Track clicks on categorized elements
    document.addEventListener('click', (e) => {
      const element = e.target.closest('[data-uiflow-category]');
      if (element) {
        this.recordInteraction(element);
      }
    });
  }

  recordInteraction(element) {
    const id = element.getAttribute('data-uiflow-id');
    const data = this.elements.get(id);
    
    if (data) {
      const now = this.getAcceleratedTime();
      data.interactions++;
      data.lastUsed = now;
      
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
      this.adaptDensity(data.area);
    }
  }

  async trackInteraction(elementData) {
    if (!this.config.userId) return;

    const event = {
      elementId: elementData.element.getAttribute('data-uiflow-id'),
      category: elementData.category,
      area: elementData.area,
      action: 'click',
      densityLevel: this.getDensityLevel(elementData.area),
      isNew: elementData.isNew,
      timestamp: Date.now()
    };

    await this.dataManager.trackEvent(this.config.userId, event);
  }

  recordUsageHistory(area, category, timestamp) {
    const key = `${area}:${category}`;
    if (!this.usageHistory.has(key)) {
      this.usageHistory.set(key, []);
    }
    
    const history = this.usageHistory.get(key);
    history.push(timestamp);
    
    // Keep only last 30 interactions per category/area
    if (history.length > 30) {
      history.splice(0, history.length - 30);
    }
  }

  adaptDensity(area) {
    const areaData = this.areas.get(area);
    if (!areaData) return;

    const recentUsage = this.getRecentUsageByArea(area);
    const advancedInteractions = recentUsage.advanced + recentUsage.expert;
    const totalRecent = recentUsage.basic + recentUsage.advanced + recentUsage.expert;
    
    // Only adapt if we have enough interactions
    if (totalRecent >= this.config.adaptationThreshold) {
      const advancedRatio = advancedInteractions / totalRecent;
      const targetDensity = Math.min(0.3 + (advancedRatio * 0.7), 1.0);
      
      // Gradual adaptation towards target
      const currentDensity = areaData.density;
      const newDensity = currentDensity + (targetDensity - currentDensity) * this.config.learningRate;
      
      areaData.density = Math.max(0, Math.min(1, newDensity));
      this.updateAreaElementsVisibility(area);
      this.saveData();
      
      this.emit('uiflow:adaptation', {
        area,
        oldDensity: currentDensity,
        newDensity: areaData.density,
        advancedRatio,
        totalInteractions: totalRecent
      });
    }
  }

  getRecentUsageByArea(area, timeWindow = 7 * 24 * 60 * 60 * 1000) { // 1 week default
    const now = this.getAcceleratedTime();
    const acceleratedWindow = timeWindow / this.config.timeAcceleration;
    const cutoff = now - acceleratedWindow;
    
    const usage = { basic: 0, advanced: 0, expert: 0 };
    
    for (const category of this.config.categories) {
      const key = `${area}:${category}`;
      const history = this.usageHistory.get(key) || [];
      
      const recentCount = history.filter(timestamp => timestamp > cutoff).length;
      usage[category] = recentCount;
    }
    
    return usage;
  }

  getAcceleratedTime() {
    return Date.now() * this.config.timeAcceleration;
  }

  /**
   * Simulate usage over time for testing
   */
  simulateUsage(area, interactions, daysToSimulate = 7) {
    const originalAcceleration = this.config.timeAcceleration;
    this.config.timeAcceleration = 1000; // Speed up for simulation
    
    const msPerDay = 24 * 60 * 60 * 1000;
    const totalMs = daysToSimulate * msPerDay;
    const intervalMs = totalMs / interactions.length;
    
    interactions.forEach((interaction, index) => {
      const simulatedTime = Date.now() + (index * intervalMs);
      this.recordUsageHistory(area, interaction.category, simulatedTime * this.config.timeAcceleration);
    });
    
    // Trigger adaptation after simulation
    this.adaptDensity(area);
    this.config.timeAcceleration = originalAcceleration;
  }

  loadStoredData() {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        
        // Load area densities
        if (data.areas) {
          this.areas = new Map(data.areas);
        }
        
        // Load usage history
        if (data.usageHistory) {
          this.usageHistory = new Map(data.usageHistory);
        }
      }
    } catch (e) {
      console.warn('UIFlow: Failed to load stored data', e);
    }
  }

  saveData() {
    try {
      const data = {
        areas: Array.from(this.areas.entries()),
        usageHistory: Array.from(this.usageHistory.entries()),
        lastSaved: Date.now()
      };
      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn('UIFlow: Failed to save data', e);
    }
  }

  emit(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    document.dispatchEvent(event);
  }

  // Data source management methods
  async setupDataSources() {
    const { dataSources } = this.config;
    
    for (const [name, config] of Object.entries(dataSources)) {
      try {
        let source;
        
        switch (name) {
          case 'api':
            source = new APIDataSource({ endpoint: config.endpoint });
            break;
          case 'segment':
            source = new SegmentDataSource({ 
              writeKey: config.writeKey,
              trackingPlan: config.trackingPlan,
              useUserProperties: config.useUserProperties
            });
            break;
          default:
            console.warn(`Unknown data source type: ${name}`);
            continue;
        }
        
        this.dataManager.addSource(name, source, config.primary);
        this.emit('uiflow:datasource-added', { name, type: name });
      } catch (error) {
        console.warn(`Failed to setup data source ${name}:`, error);
      }
    }
    
    await this.dataManager.initialize();
  }

  async syncWithDataSources() {
    if (!this.config.userId) return;

    try {
      const data = await this.dataManager.pullData(this.config.userId);
      this.applyRemoteSettings(data);
      this.emit('uiflow:sync-success', { sources: this.dataManager.getSourceNames(), data });
    } catch (error) {
      console.warn('UIFlow: Failed to sync with data sources', error);
      this.emit('uiflow:sync-error', { error: error.message });
    }
  }

  async pushToDataSources() {
    if (!this.config.userId) return;

    try {
      const payload = {
        areas: this.getAreaDensities(),
        usageHistory: Array.from(this.usageHistory.entries()),
        lastUpdated: Date.now()
      };

      await this.dataManager.pushData(this.config.userId, payload);
      this.emit('uiflow:push-success', { sources: this.dataManager.getSourceNames(), data: payload });
    } catch (error) {
      console.warn('UIFlow: Failed to push to data sources', error);
      this.emit('uiflow:push-error', { error: error.message });
    }
  }

  applyRemoteSettings(data) {
    if (data.overrides) {
      // Apply hard overrides (admin-set density levels)
      for (const [area, density] of Object.entries(data.overrides)) {
        this.remoteOverrides.set(area, density);
      }
    }

    if (data.areas) {
      // Merge remote area densities with local (remote takes precedence for conflicts)
      for (const [area, density] of Object.entries(data.areas)) {
        if (!this.remoteOverrides.has(area)) {
          this.setDensityLevel(density, area, { skipAPI: true });
        }
      }
    }

    this.updateAllElementsVisibility();
  }

  startSyncTimer() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.syncWithDataSources();
    }, this.config.syncInterval);
  }

  stopSyncTimer() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Override density for specific area (admin control)
   */
  setRemoteOverride(area, density) {
    this.remoteOverrides.set(area, Math.max(0, Math.min(1, density)));
    this.updateAreaElementsVisibility(area);
    this.emit('uiflow:override-applied', { area, density });
  }

  /**
   * Remove remote override for area
   */
  clearRemoteOverride(area) {
    this.remoteOverrides.delete(area);
    this.updateAreaElementsVisibility(area);
    this.emit('uiflow:override-cleared', { area });
  }

  /**
   * Get current override status
   */
  getOverrides() {
    return Object.fromEntries(this.remoteOverrides);
  }

  /**
   * Check if area has remote override
   */
  hasOverride(area) {
    return this.remoteOverrides.has(area);
  }

  /**
   * Force sync with data sources and apply updates
   */
  async forceSync() {
    await this.syncWithDataSources();
    await this.pushToDataSources();
  }

  /**
   * Highlight an element with specific style and optional tooltip
   */
  highlightElement(elementId, style = 'default', options = {}) {
    const data = this.elements.get(elementId);
    if (!data || !data.visible) return;

    const highlightInfo = {
      style,
      startTime: Date.now(),
      duration: options.duration || 5000, // 5 seconds default
      tooltip: options.tooltip || data.helpText,
      persistent: options.persistent || false,
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
  removeHighlight(elementId) {
    const highlightInfo = this.highlights.get(elementId);
    if (!highlightInfo) return;

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
  flagAsNew(elementId, helpText = null, duration = 8000) {
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
        tooltip: helpText || 'New feature available!'
      });
    }

    return this;
  }

  /**
   * Show tooltip for element
   */
  showTooltip(elementId, text, options = {}) {
    return this.highlightElement(elementId, 'tooltip', {
      tooltip: text,
      duration: options.duration || 3000,
      persistent: options.persistent || false
    });
  }

  /**
   * Clear all highlights
   */
  clearAllHighlights() {
    for (const elementId of this.highlights.keys()) {
      this.removeHighlight(elementId);
    }
    return this;
  }

  /**
   * Get currently highlighted elements
   */
  getHighlights() {
    return Array.from(this.highlights.keys());
  }

  // Private highlighting methods
  applyHighlight(elementId, highlightInfo) {
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

  createTooltip(element, text) {
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
      this.removeHighlight(elementId);
    });
  }

  positionTooltip(element, tooltip) {
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

  injectHighlightStyles() {
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

  /**
   * Destroy instance and cleanup timers
   */
  destroy() {
    this.stopSyncTimer();
    this.clearAllHighlights();
    this.dataManager.destroy();
    
    if (this.highlightStyles) {
      this.highlightStyles.remove();
      this.highlightStyles = null;
    }
    
    this.initialized = false;
    this.emit('uiflow:destroyed');
  }

  /**
   * Add a data source dynamically
   */
  addDataSource(name, type, config, isPrimary = false) {
    let source;
    
    switch (type) {
      case 'api':
        source = new APIDataSource({ endpoint: config.endpoint });
        break;
      case 'segment':
        source = new SegmentDataSource({ 
          writeKey: config.writeKey,
          trackingPlan: config.trackingPlan,
          useUserProperties: config.useUserProperties
        });
        break;
      default:
        throw new Error(`Unknown data source type: ${type}`);
    }
    
    this.dataManager.addSource(name, source, isPrimary);
    source.initialize();
    
    this.emit('uiflow:datasource-added', { name, type });
    return this;
  }

  /**
   * Remove a data source
   */
  removeDataSource(name) {
    this.dataManager.removeSource(name);
    this.emit('uiflow:datasource-removed', { name });
    return this;
  }

  /**
   * Get data source by name (for advanced usage)
   */
  getDataSource(name) {
    return this.dataManager.getSource(name);
  }
}

// Static factory method for convenience
export function createUIFlow(options) {
  return new UIFlow(options);
}

// Default instance
export default new UIFlow();

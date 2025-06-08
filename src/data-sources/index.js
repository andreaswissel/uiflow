/**
 * Data sources for UIFlow
 */
export { BaseDataSource } from './base.js';
export { APIDataSource } from './api.js';
export { SegmentDataSource } from './segment.js';

/**
 * Data source manager for handling multiple sources
 */
export class DataSourceManager {
  constructor() {
    this.sources = new Map();
    this.primary = null;
  }

  /**
   * Add a data source
   * @param {string} name - Data source name
   * @param {BaseDataSource} source - Data source instance
   * @param {boolean} isPrimary - Whether this is the primary source for reading data
   */
  addSource(name, source, isPrimary = false) {
    this.sources.set(name, source);
    
    if (isPrimary || !this.primary) {
      this.primary = name;
    }
  }

  /**
   * Initialize all data sources
   */
  async initialize() {
    const initPromises = Array.from(this.sources.values()).map(source => 
      source.initialize().catch(error => {
        console.warn('Data source initialization failed:', error);
        return null;
      })
    );
    
    await Promise.all(initPromises);
  }

  /**
   * Push data to all sources
   */
  async pushData(userId, data) {
    const pushPromises = Array.from(this.sources.entries()).map(async ([name, source]) => {
      try {
        if (source.isReady()) {
          await source.pushData(userId, data);
        }
      } catch (error) {
        console.warn(`Data push failed for source ${name}:`, error);
      }
    });
    
    await Promise.all(pushPromises);
  }

  /**
   * Pull data from primary source
   */
  async pullData(userId) {
    if (!this.primary) {
      return { areas: {}, overrides: {}, usageHistory: [] };
    }
    
    const primarySource = this.sources.get(this.primary);
    if (!primarySource || !primarySource.isReady()) {
      return { areas: {}, overrides: {}, usageHistory: [] };
    }
    
    try {
      return await primarySource.pullData(userId);
    } catch (error) {
      console.warn('Primary data source pull failed:', error);
      return { areas: {}, overrides: {}, usageHistory: [] };
    }
  }

  /**
   * Track event in all sources
   */
  async trackEvent(userId, event) {
    const trackPromises = Array.from(this.sources.values()).map(async (source) => {
      try {
        if (source.isReady()) {
          await source.trackEvent(userId, event);
        }
      } catch (error) {
        console.warn('Event tracking failed for source:', error);
      }
    });
    
    await Promise.all(trackPromises);
  }

  /**
   * Get source by name
   */
  getSource(name) {
    return this.sources.get(name);
  }

  /**
   * Get all source names
   */
  getSourceNames() {
    return Array.from(this.sources.keys());
  }

  /**
   * Remove a source
   */
  removeSource(name) {
    const source = this.sources.get(name);
    if (source) {
      source.destroy();
      this.sources.delete(name);
      
      if (this.primary === name) {
        // Set new primary to first available source
        this.primary = this.sources.size > 0 ? this.sources.keys().next().value : null;
      }
    }
  }

  /**
   * Destroy all sources
   */
  destroy() {
    for (const source of this.sources.values()) {
      source.destroy();
    }
    this.sources.clear();
    this.primary = null;
  }
}

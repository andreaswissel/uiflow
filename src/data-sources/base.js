/**
 * Base class for UIFlow data sources
 */
export class BaseDataSource {
  constructor(config = {}) {
    this.config = config;
    this.ready = false;
  }

  /**
   * Initialize the data source
   */
  async initialize() {
    this.ready = true;
  }

  /**
   * Check if data source is ready
   */
  isReady() {
    return this.ready;
  }

  /**
   * Push usage data to the data source
   * @param {string} userId - User identifier
   * @param {Object} data - Usage data to push
   */
  async pushData(userId, data) {
    throw new Error('pushData must be implemented by subclasses');
  }

  /**
   * Pull user settings from the data source
   * @param {string} userId - User identifier
   * @returns {Object} User settings data
   */
  async pullData(userId) {
    throw new Error('pullData must be implemented by subclasses');
  }

  /**
   * Track a UI interaction event
   * @param {string} userId - User identifier
   * @param {Object} event - Event data
   */
  async trackEvent(userId, event) {
    // Default implementation - can be overridden
    console.log(`Tracking event for ${userId}:`, event);
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.ready = false;
  }
}

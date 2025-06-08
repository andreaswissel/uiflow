/**
 * Dedicated API data source for UIFlow
 */
import { BaseDataSource } from './base.js';

export class APIDataSource extends BaseDataSource {
  constructor(config = {}) {
    super(config);
    this.endpoint = config.endpoint;
    if (!this.endpoint) {
      throw new Error('API endpoint is required');
    }
  }

  async initialize() {
    // Test API connectivity
    try {
      const response = await fetch(`${this.endpoint}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        console.warn('UIFlow API health check failed, but continuing...');
      }
    } catch (error) {
      console.warn('UIFlow API not accessible:', error.message);
    }
    
    this.ready = true;
  }

  async pushData(userId, data) {
    if (!this.isReady()) {
      throw new Error('API data source not ready');
    }

    try {
      const response = await fetch(`${this.endpoint}/users/${userId}/ui-density`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          source: 'uiflow-api',
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`API push failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('UIFlow API push error:', error);
      throw error;
    }
  }

  async pullData(userId) {
    if (!this.isReady()) {
      throw new Error('API data source not ready');
    }

    try {
      const response = await fetch(`${this.endpoint}/users/${userId}/ui-density`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // User not found, return empty data
          return { areas: {}, overrides: {}, usageHistory: [] };
        }
        throw new Error(`API pull failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('UIFlow API pull error:', error);
      throw error;
    }
  }

  async trackEvent(userId, event) {
    if (!this.isReady()) return;

    try {
      await fetch(`${this.endpoint}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          event: 'ui_interaction',
          properties: {
            ...event,
            source: 'uiflow'
          },
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.warn('UIFlow API event tracking failed:', error);
    }
  }
}

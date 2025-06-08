/**
 * Mock Segment Analytics.js for UIFlow demo
 * Simulates the Segment analytics library behavior
 */

class MockSegmentAnalytics {
  constructor() {
    this.initialized = false;
    this.writeKey = null;
    this.events = [];
    this.userTraits = {};
    this.userId = null;
  }

  load(writeKey) {
    this.writeKey = writeKey;
    this.initialized = true;
    console.log(`📊 Mock Segment loaded with write key: ${writeKey}`);
  }

  identify(userId, traits = {}) {
    this.userId = userId;
    this.userTraits = { ...this.userTraits, ...traits };
    
    const event = {
      type: 'identify',
      userId,
      traits,
      timestamp: new Date().toISOString()
    };
    
    this.events.push(event);
    console.log('📊 Segment Identify:', event);
  }

  track(eventName, properties = {}) {
    const event = {
      type: 'track',
      event: eventName,
      properties,
      userId: this.userId,
      timestamp: new Date().toISOString()
    };
    
    this.events.push(event);
    console.log('📊 Segment Track:', event);
  }

  page(properties = {}) {
    const event = {
      type: 'page',
      properties,
      userId: this.userId,
      timestamp: new Date().toISOString()
    };
    
    this.events.push(event);
    console.log('📊 Segment Page:', event);
  }

  // Demo helper methods
  getEvents() {
    return this.events;
  }

  getUIFlowEvents() {
    return this.events.filter(e => 
      e.type === 'track' && 
      (e.properties.source === 'uiflow-demo' || e.event.includes('UIFlow'))
    );
  }

  clearEvents() {
    this.events = [];
  }

  getUserTraits() {
    return this.userTraits;
  }
}

// Set up mock analytics on window
if (!window.analytics) {
  window.analytics = new MockSegmentAnalytics();
}

// Export for demo controls
window.mockSegment = window.analytics;

export default window.analytics;

/**
 * Mock API server for UIFlow demo
 * Simulates external settings API
 */

class MockAPIServer {
  constructor() {
    this.users = new Map();
    this.adminOverrides = new Map();
  }

  // GET /users/:userId/ui-density
  getUserSettings(userId) {
    const userData = this.users.get(userId) || {
      areas: { editor: 0.3, dashboard: 0.3 },
      usageHistory: [],
      lastUpdated: Date.now()
    };

    const overrides = this.adminOverrides.get(userId) || {};

    return {
      ...userData,
      overrides
    };
  }

  // POST /users/:userId/ui-density
  saveUserSettings(userId, data) {
    this.users.set(userId, {
      ...data,
      lastUpdated: Date.now()
    });
    return { success: true };
  }

  // Admin methods for demo
  setAdminOverride(userId, area, density) {
    if (!this.adminOverrides.has(userId)) {
      this.adminOverrides.set(userId, {});
    }
    this.adminOverrides.get(userId)[area] = density;
  }

  clearAdminOverride(userId, area) {
    if (this.adminOverrides.has(userId)) {
      delete this.adminOverrides.get(userId)[area];
    }
  }

  getAdminOverrides(userId) {
    return this.adminOverrides.get(userId) || {};
  }
}

// Create global mock server
const mockServer = new MockAPIServer();

// Mock fetch implementation for demo
const originalFetch = window.fetch;

window.fetch = function(url, options = {}) {
  // Check if this is a UIFlow API call
  const uiFlowPattern = /\/users\/([^\/]+)\/ui-density$/;
  const match = url.match(uiFlowPattern);
  
  if (match) {
    const userId = match[1];
    const method = options.method || 'GET';
    
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        if (method === 'GET') {
          const data = mockServer.getUserSettings(userId);
          resolve({
            ok: true,
            json: () => Promise.resolve(data)
          });
        } else if (method === 'POST') {
          const data = JSON.parse(options.body);
          mockServer.saveUserSettings(userId, data);
          resolve({
            ok: true,
            json: () => Promise.resolve({ success: true })
          });
        }
      }, 200); // 200ms delay
    });
  }
  
  // Fall back to original fetch for other URLs
  return originalFetch.call(this, url, options);
};

// Export for demo controls
window.mockServer = mockServer;

export default mockServer;

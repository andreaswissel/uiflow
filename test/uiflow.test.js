import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UIFlow } from '../src/index.js';

// Mock DOM methods
global.document = {
  addEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  createElement: vi.fn(() => ({
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    style: {},
    classList: { contains: vi.fn() },
    textContent: ''
  })),
  head: {
    appendChild: vi.fn()
  },
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => [])
};

global.window = {
  innerWidth: 1024,
  innerHeight: 768
};

global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
};

global.CustomEvent = vi.fn();
global.Date = {
  now: vi.fn(() => 1640995200000) // Fixed timestamp for tests
};

describe('UIFlow', () => {
  let uiflow;
  let mockElement;

  beforeEach(() => {
    uiflow = new UIFlow();
    mockElement = {
      id: 'test-element',
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      style: {},
      classList: { contains: vi.fn() }
    };
    vi.clearAllMocks();
    
    // Reset localStorage mock to return null by default
    localStorage.getItem.mockReturnValue(null);
  });

  describe('initialization', () => {
    it('should create instance with default config', () => {
      expect(uiflow.config.categories).toEqual(['basic', 'advanced', 'expert']);
      expect(uiflow.config.learningRate).toBe(0.1);
      expect(uiflow.getDensityLevel()).toBe(0.3); // Default density is now 0.3
    });

    it('should accept custom configuration', () => {
      const customUIFlow = new UIFlow({
        learningRate: 0.2,
        categories: ['beginner', 'intermediate', 'pro']
      });
      
      expect(customUIFlow.config.learningRate).toBe(0.2);
      expect(customUIFlow.config.categories).toEqual(['beginner', 'intermediate', 'pro']);
    });

    it('should initialize with init method', async () => {
      const result = await uiflow.init({ userId: 'test-user' });
      
      expect(result).toBe(uiflow);
      expect(uiflow.config.userId).toBe('test-user');
      expect(uiflow.initialized).toBe(true);
    });
  });

  describe('element categorization', () => {
    beforeEach(async () => {
      await uiflow.init();
    });

    it('should categorize element correctly', () => {
      const result = uiflow.categorize(mockElement, 'advanced', 'test-area');
      
      expect(result).toBe(uiflow);
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-uiflow-category', 'advanced');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-uiflow-area', 'test-area');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-uiflow-id', 'test-element');
    });

    it('should throw error for invalid category', () => {
      expect(() => {
        uiflow.categorize(mockElement, 'invalid');
      }).toThrow('Invalid category: invalid');
    });

    it('should generate ID for element without ID', () => {
      const elementWithoutId = {
        id: '',
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
        style: {}
      };
      
      uiflow.categorize(elementWithoutId, 'basic');
      
      expect(elementWithoutId.setAttribute).toHaveBeenCalledWith(
        'data-uiflow-id', 
        expect.stringMatching(/^uiflow-\d+-[a-z0-9]+$/)
      );
    });

    it('should categorize with options', () => {
      uiflow.categorize(mockElement, 'advanced', 'test-area', {
        helpText: 'Test help',
        isNew: true
      });
      
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-uiflow-help', 'Test help');
    });
  });

  describe('density management', () => {
    beforeEach(async () => {
      await uiflow.init();
    });

    it('should get current density level', () => {
      expect(uiflow.getDensityLevel()).toBe(0.3); // Default density
    });

    it('should set density level within bounds', () => {
      const result = uiflow.setDensityLevel(0.8, 'test-area');
      
      expect(result).toBe(uiflow);
      expect(uiflow.getDensityLevel('test-area')).toBe(0.8);
    });

    it('should clamp density level to valid range', () => {
      uiflow.setDensityLevel(-0.5, 'test-area');
      expect(uiflow.getDensityLevel('test-area')).toBe(0);
      
      uiflow.setDensityLevel(1.5, 'test-area');
      expect(uiflow.getDensityLevel('test-area')).toBe(1);
    });

    it('should get area densities', () => {
      uiflow.setDensityLevel(0.5, 'area1');
      uiflow.setDensityLevel(0.8, 'area2');
      
      const densities = uiflow.getAreaDensities();
      expect(densities.area1).toBe(0.5);
      expect(densities.area2).toBe(0.8);
    });

    it('should handle remote overrides', () => {
      uiflow.setRemoteOverride('test-area', 0.9);
      
      expect(uiflow.getDensityLevel('test-area')).toBe(0.9);
      expect(uiflow.hasOverride('test-area')).toBe(true);
      
      uiflow.clearRemoteOverride('test-area');
      expect(uiflow.hasOverride('test-area')).toBe(false);
    });
  });

  describe('element visibility', () => {
    beforeEach(async () => {
      await uiflow.init();
    });

    it('should show basic elements at any density', () => {
      expect(uiflow.shouldShowElement('basic', 'test-area')).toBe(true);
      
      uiflow.setDensityLevel(0, 'test-area');
      expect(uiflow.shouldShowElement('basic', 'test-area')).toBe(true);
    });

    it('should show advanced elements only at medium+ density', () => {
      uiflow.setDensityLevel(0.2, 'test-area');
      expect(uiflow.shouldShowElement('advanced', 'test-area')).toBe(false);
      
      uiflow.setDensityLevel(0.5, 'test-area');
      expect(uiflow.shouldShowElement('advanced', 'test-area')).toBe(true);
    });

    it('should show expert elements only at high density', () => {
      uiflow.setDensityLevel(0.5, 'test-area');
      expect(uiflow.shouldShowElement('expert', 'test-area')).toBe(false);
      
      uiflow.setDensityLevel(1.0, 'test-area'); // Expert requires full density (2/2 = 1.0)
      expect(uiflow.shouldShowElement('expert', 'test-area')).toBe(true);
    });
  });

  describe('data persistence', () => {
    beforeEach(async () => {
      await uiflow.init();
    });

    it('should save data to localStorage', () => {
      uiflow.setDensityLevel(0.7, 'test-area');
      uiflow.saveData();
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'uiflow-data',
        expect.stringContaining('"density":0.7')
      );
    });

    it('should load data from localStorage', () => {
      const mockData = {
        areas: [['test-area', { density: 0.8, lastActivity: Date.now(), totalInteractions: 0 }]],
        usageHistory: [],
        lastSaved: Date.now()
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(mockData));
      
      uiflow.loadStoredData();
      
      expect(uiflow.getDensityLevel('test-area')).toBe(0.8);
    });

    it('should handle localStorage errors gracefully', () => {
      localStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      expect(() => uiflow.loadStoredData()).not.toThrow();
    });
  });

  describe('usage simulation', () => {
    beforeEach(async () => {
      await uiflow.init();
    });

    it('should simulate usage patterns', () => {
      const interactions = [
        { category: 'basic' },
        { category: 'advanced' },
        { category: 'expert' }
      ];
      
      expect(() => {
        uiflow.simulateUsage('test-area', interactions, 7);
      }).not.toThrow();
    });
  });

  describe('highlighting', () => {
    beforeEach(async () => {
      await uiflow.init();
    });

    it('should highlight elements', () => {
      // Mock an element that's been categorized
      uiflow.categorize(mockElement, 'advanced', 'test-area');
      const elementId = mockElement.getAttribute('data-uiflow-id') || 'test-element';
      
      expect(() => {
        uiflow.highlightElement(elementId, 'new-feature', {
          duration: 5000,
          tooltip: 'Test tooltip'
        });
      }).not.toThrow();
    });

    it('should flag elements as new', () => {
      uiflow.categorize(mockElement, 'advanced', 'test-area');
      const elementId = mockElement.getAttribute('data-uiflow-id') || 'test-element';
      
      expect(() => {
        uiflow.flagAsNew(elementId, 'New feature!', 5000);
      }).not.toThrow();
    });
  });
});

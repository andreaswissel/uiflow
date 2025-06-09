import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UIFlow } from '../src/index.ts';

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
      classList: { 
        contains: vi.fn(),
        add: vi.fn(),
        remove: vi.fn()
      }
    };
    vi.clearAllMocks();
    
    // Reset localStorage mock to return null by default
    localStorage.getItem.mockReturnValue(null);
  });

  describe('initialization', () => {
    it('should create instance with default config', () => {
      expect(uiflow.config.categories).toEqual(['basic', 'advanced', 'expert']);
      expect(uiflow.config.learningRate).toBe(0.1);
      expect(uiflow.isInitialized()).toBe(false); // Not initialized until init() is called
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
        style: {},
        classList: { 
          contains: vi.fn(),
          add: vi.fn(),
          remove: vi.fn()
        }
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

  describe('area management', () => {
    beforeEach(async () => {
      await uiflow.init();
    });

    it('should track area statistics', () => {
      uiflow.categorize(mockElement, 'basic', 'test-area');
      const stats = uiflow.getAreaStats('test-area');
      
      expect(stats.totalElements).toBe(1);
      expect(stats.visibleElements).toBe(1); // Basic elements are visible by default
      expect(stats.recentUsage).toEqual({ basic: 0, advanced: 0, expert: 0 });
    });

    it('should get overview stats for all areas', () => {
      uiflow.categorize(mockElement, 'basic', 'area1');
      const overview = uiflow.getOverviewStats();
      
      expect(overview.area1).toBeDefined();
      expect(overview.area1.totalElements).toBe(1);
    });
  });

  describe('element visibility', () => {
    beforeEach(async () => {
      await uiflow.init();
    });

    it('should show basic elements by default', () => {
      expect(uiflow.shouldShowElement('basic', 'test-area')).toBe(true);
    });

    it('should not show advanced elements by default', () => {
      expect(uiflow.shouldShowElement('advanced', 'test-area')).toBe(false);
    });

    it('should not show expert elements by default', () => {
      expect(uiflow.shouldShowElement('expert', 'test-area')).toBe(false);
    });

    it('should unlock categories when requested', () => {
      uiflow.categorize(mockElement, 'advanced', 'test-area');
      
      // Initially should not be visible
      let stats = uiflow.getAreaStats('test-area');
      expect(stats.visibleElements).toBe(0);
      expect(stats.totalElements).toBe(1);
      
      uiflow.unlockCategory('advanced', 'test-area');
      
      // Element should now be visible
      stats = uiflow.getAreaStats('test-area');
      expect(stats.visibleElements).toBe(1);
      expect(stats.totalElements).toBe(1);
    });
  });

  describe('data persistence', () => {
    beforeEach(async () => {
      await uiflow.init();
    });

    it('should save data to localStorage', () => {
      uiflow.categorize(mockElement, 'basic', 'test-area');
      // Access the private saveData method through a public action that triggers it
      uiflow.resetArea('test-area');
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'uiflow-data',
        expect.stringContaining('"areas"')
      );
    });

    it('should load data from localStorage', () => {
      const mockData = {
        areas: [['test-area', { lastActivity: Date.now(), totalInteractions: 0 }]],
        usageHistory: [],
        elementUsageHistory: [],
        elements: [],
        lastSaved: Date.now()
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(mockData));
      
      expect(() => {
        // Create new instance to trigger data loading
        new UIFlow();
      }).not.toThrow();
    });

    it('should handle localStorage errors gracefully', () => {
      localStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      expect(() => new UIFlow()).not.toThrow();
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

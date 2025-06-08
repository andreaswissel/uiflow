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
    classList: { contains: vi.fn() }
  }))
};

global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
};

global.CustomEvent = vi.fn();

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
  });

  describe('initialization', () => {
    it('should create instance with default config', () => {
      expect(uiflow.config.categories).toEqual(['basic', 'advanced', 'expert']);
      expect(uiflow.config.learningRate).toBe(0.1);
      expect(uiflow.densityLevel).toBe(0.5);
    });

    it('should accept custom configuration', () => {
      const customUIFlow = new UIFlow({
        learningRate: 0.2,
        categories: ['beginner', 'intermediate', 'pro']
      });
      
      expect(customUIFlow.config.learningRate).toBe(0.2);
      expect(customUIFlow.config.categories).toEqual(['beginner', 'intermediate', 'pro']);
    });

    it('should initialize with init method', () => {
      const result = uiflow.init({ apiEndpoint: 'https://api.test.com' });
      
      expect(result).toBe(uiflow);
      expect(uiflow.config.apiEndpoint).toBe('https://api.test.com');
      expect(uiflow.initialized).toBe(true);
    });
  });

  describe('element categorization', () => {
    beforeEach(() => {
      uiflow.init();
    });

    it('should categorize element correctly', () => {
      const result = uiflow.categorize(mockElement, 'advanced');
      
      expect(result).toBe(uiflow);
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-uiflow-category', 'advanced');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-uiflow-id', 'test-element');
    });

    it('should throw error for invalid category', () => {
      expect(() => {
        uiflow.categorize(mockElement, 'invalid');
      }).toThrow('Invalid category: invalid');
    });

    it('should generate ID for element without ID', () => {
      const elementWithoutId = {
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
  });

  describe('density management', () => {
    beforeEach(() => {
      uiflow.init();
    });

    it('should get current density level', () => {
      expect(uiflow.getDensityLevel()).toBe(0.5);
    });

    it('should set density level within bounds', () => {
      const result = uiflow.setDensityLevel(0.8);
      
      expect(result).toBe(uiflow);
      expect(uiflow.getDensityLevel()).toBe(0.8);
    });

    it('should clamp density level to valid range', () => {
      uiflow.setDensityLevel(-0.5);
      expect(uiflow.getDensityLevel()).toBe(0);
      
      uiflow.setDensityLevel(1.5);
      expect(uiflow.getDensityLevel()).toBe(1);
    });
  });

  describe('element visibility', () => {
    beforeEach(() => {
      uiflow.init();
    });

    it('should show basic elements at any density', () => {
      expect(uiflow.shouldShowElement('basic')).toBe(true);
      
      uiflow.setDensityLevel(0);
      expect(uiflow.shouldShowElement('basic')).toBe(true);
    });

    it('should show advanced elements only at medium+ density', () => {
      uiflow.setDensityLevel(0.4);
      expect(uiflow.shouldShowElement('advanced')).toBe(false);
      
      uiflow.setDensityLevel(0.6);
      expect(uiflow.shouldShowElement('advanced')).toBe(true);
    });

    it('should show expert elements only at high density', () => {
      uiflow.setDensityLevel(0.8);
      expect(uiflow.shouldShowElement('expert')).toBe(false);
      
      uiflow.setDensityLevel(1.0);
      expect(uiflow.shouldShowElement('expert')).toBe(true);
    });
  });

  describe('data persistence', () => {
    beforeEach(() => {
      uiflow.init();
    });

    it('should save data to localStorage', () => {
      uiflow.setDensityLevel(0.7);
      uiflow.saveData();
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'uiflow-data',
        expect.stringContaining('"densityLevel":0.7')
      );
    });

    it('should load data from localStorage', () => {
      localStorage.getItem.mockReturnValue('{"densityLevel":0.8,"usageData":[]}');
      
      uiflow.loadStoredData();
      
      expect(uiflow.getDensityLevel()).toBe(0.8);
    });

    it('should handle localStorage errors gracefully', () => {
      localStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      expect(() => uiflow.loadStoredData()).not.toThrow();
    });
  });
});

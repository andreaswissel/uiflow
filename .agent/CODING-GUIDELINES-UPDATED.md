# UIFlow Coding Guidelines (Updated December 2024)

## TypeScript Standards

### Type Definitions
- Use strict TypeScript configuration
- Define interfaces for all public APIs
- Use generic types for framework adapters
- Prefer `interface` over `type` for object shapes

### Naming Conventions
- **Classes**: PascalCase (`UIFlow`, `DataSourceManager`)
- **Methods**: camelCase (`recordInteraction`, `categorizeElement`)
- **Interfaces**: PascalCase with descriptive names (`ElementData`, `AreaConfig`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_HISTORY_SIZE`, `DEFAULT_THRESHOLD`)

## Architecture Patterns

### Event-Driven Design
```typescript
// Emit events for external consumption
this.emit('uiflow:element-unlocked', { elementId, category, area });

// Use custom events for framework communication
element.dispatchEvent(new CustomEvent('uiflow:element-unlocked'));
```

### Map-Based Storage
```typescript
// Use Maps for O(1) lookups
private elements: Map<ElementId, ElementData>;
private areas: Map<AreaId, AreaData>;
```

### Defensive Programming
```typescript
// Always check for existence before operations
const data = this.elements.get(elementId);
if (!data) return;

// Validate inputs early
if (!this.initialized) {
  throw new Error('UIFlow must be initialized before use');
}
```

## Element Visibility Management (Critical Pattern)

### Complete Visibility Update Pattern
```typescript
private updateElementVisibility(elementId: ElementId): void {
  const data = this.elements.get(elementId);
  if (!data) return;

  const shouldShow = this.shouldShowElementWithDependencies(elementId);
  const wasVisible = data.visible;
  
  if (data.visible !== shouldShow) {
    data.visible = shouldShow;
    
    // Update BOTH display style AND CSS classes for theme compatibility
    data.element.style.display = shouldShow ? '' : 'none';
    data.element.setAttribute('data-uiflow-visible', shouldShow.toString());
    
    // Manage 'hidden' class for CSS integration
    if (shouldShow) {
      data.element.classList.remove('hidden');
    } else {
      data.element.classList.add('hidden');
    }
    
    // Highlight newly visible elements
    if (shouldShow && !wasVisible && data.isNew) {
      this.highlightElement(elementId, 'new-feature');
    }
  }
}
```

### Element Registration with Correct Initial State
```typescript
registerElement(element: HTMLElement, category: Category, area: AreaId, options: ElementOptions = {}): UIFlowInstance {
  const id = this.getElementId(element);
  
  // CRITICAL: Set correct initial visibility for elements with dependencies
  const initiallyVisible = options.dependencies && options.dependencies.length > 0 
    ? false  // Elements with dependencies start hidden until dependencies are met
    : this.shouldShowElement(category, area); // Density-based for elements without dependencies
  
  this.elements.set(id, {
    element,
    category,
    area,
    visible: initiallyVisible,  // NOT always true!
    interactions: 0,
    lastUsed: null,
    helpText: options.helpText,
    isNew: options.isNew ?? false,
    dependencies: options.dependencies ?? []
  });
  
  // Apply initial visibility state to DOM
  this.updateElementVisibility(id);
  return this;
}
```

## Dependency System Patterns

### Time-Based Dependency Validation
```typescript
private validateTimeBased(dependency: ElementDependency): boolean {
  if (!dependency.elementId || !dependency.timeWindow || !dependency.minUsage) {
    return false;
  }
  
  const targetElement = this.elements.get(dependency.elementId);
  if (!targetElement) return false;
  
  // For demo/simulation: if total interactions meet threshold, consider valid
  if (targetElement.interactions >= dependency.minUsage) {
    return true;
  }
  
  // For production: check actual time window
  const elementHistory = this.elementUsageHistory.get(dependency.elementId) || [];
  const timeWindowMs = this.parseTimeWindow(dependency.timeWindow);
  const cutoff = this.getAcceleratedTime() - timeWindowMs;
  const recentUsage = elementHistory.filter(timestamp => timestamp > cutoff).length;
  return recentUsage >= dependency.minUsage;
}
```

### Element Usage History Tracking
```typescript
private recordInteractionFromElement(element: HTMLElement): void {
  const id = element.getAttribute('data-uiflow-id');
  const data = this.elements.get(id);
  
  if (data) {
    const now = this.getAcceleratedTime();
    data.interactions++;
    data.lastUsed = now;
    
    // Track element-specific usage history for time-based dependencies
    const elementHistory = this.elementUsageHistory.get(id) || [];
    elementHistory.push(now);
    
    // Prevent memory bloat - keep last 100 interactions only
    if (elementHistory.length > 100) {
      elementHistory.shift();
    }
    this.elementUsageHistory.set(id, elementHistory);
    
    // Re-evaluate dependencies after any interaction
    this.updateDependentElements();
  }
}
```

## Performance Guidelines

### Memory Management
- Limit usage history arrays (max 100 entries per element)
- Use WeakMap for DOM element references when possible
- Clean up event listeners in destroy() method

### DOM Efficiency
```typescript
// Batch DOM updates - BOTH style AND classes
element.style.display = shouldShow ? '' : 'none';
element.setAttribute('data-uiflow-visible', shouldShow.toString());
if (shouldShow) {
  element.classList.remove('hidden');
} else {
  element.classList.add('hidden');
}
```

### Debouncing
```typescript
// Debounce expensive operations
private adaptDensity = debounce((area: AreaId) => {
  // Expensive calculation here
}, 150);
```

## Error Handling

### Graceful Degradation
```typescript
try {
  this.loadConfiguration(config);
} catch (error) {
  console.warn('UIFlow configuration failed, using defaults:', error);
  this.useDefaultConfiguration();
}
```

### Informative Logging
```typescript
// Use consistent emoji prefixes for log categories
console.log('🔧 Rule engine initialized');      // Setup
console.log('👆 Interaction recorded');         // User actions  
console.log('🎯 UI adapted');                   // State changes
console.log('⚠️ Warning: Missing element');     // Warnings
console.log('❌ Error: Invalid config');        // Errors
```

## Testing Standards

### Unit Test Structure
```typescript
describe('UIFlow Core', () => {
  let uiflow: UIFlow;
  
  beforeEach(() => {
    uiflow = new UIFlow();
  });
  
  afterEach(() => {
    uiflow.destroy();
  });
  
  it('should register elements with correct initial state', () => {
    // Arrange
    const element = document.createElement('button');
    
    // Act
    uiflow.categorize(element, 'advanced', 'editor');
    
    // Assert
    expect(uiflow.elements.has(element.id)).toBe(true);
  });
});
```

### Dependency Testing Pattern
```typescript
it('should validate time-based dependencies correctly', () => {
  const element = document.createElement('button');
  element.id = 'test-element';
  
  uiflow.categorize(element, 'basic', 'test-area');
  
  // Simulate required interactions
  for (let i = 0; i < 5; i++) {
    uiflow.recordInteraction('test-element');
  }
  
  const dependency = {
    type: 'time_based',
    elementId: 'test-element',
    timeWindow: '7d',
    minUsage: 5
  };
  
  expect(uiflow.validateTimeBased(dependency)).toBe(true);
});
```

### Integration Test Patterns
```typescript
// Test full user workflows
it('should unlock targeting widget after social manager simulation', async () => {
  await simulateContentCreator();
  await simulateSocialManager();
  
  const targetingWidget = document.getElementById('targeting-widget');
  expect(targetingWidget.style.display).not.toBe('none');
  expect(targetingWidget.classList.contains('hidden')).toBe(false);
});
```

## Demo Simulation Patterns

### Timing Control for UI Updates
```typescript
function simulateUser(userType: UserType) {
  if (userType === 'social-manager') {
    // Stage 1: Basic interactions
    for (let i = 0; i < 5; i++) {
      simulateElementClick('publish-now');
    }
    
    setTimeout(() => {
      // Stage 2: Advanced features
      simulateElementClick('media-widget');
      
      setTimeout(() => {
        // Stage 3: Expert features
        simulateElementClick('targeting-widget');
        
        // Notification after all changes complete
        setTimeout(() => {
          showNotification('🎭 Simulation complete!');
        }, 100);
      }, 200);
    }, 100);
  }
}
```

## Documentation Standards

### JSDoc Comments
```typescript
/**
 * Validates all dependencies for a given element
 * @param elementId - The unique identifier for the element
 * @param visited - Set of already visited elements (prevents circular dependencies)
 * @returns true if all dependencies are satisfied
 * @example
 * ```typescript
 * if (uiflow.validateDependencies('export-btn')) {
 *   showExportButton();
 * }
 * ```
 */
validateDependencies(elementId: ElementId, visited = new Set()): boolean
```

## Framework Adapter Guidelines

### React Integration
```typescript
// Use hooks for state management
export function useAreaDensity(area: AreaId) {
  const [density, setDensity] = useState(0.3);
  
  useEffect(() => {
    const handler = (e: CustomEvent) => setDensity(e.detail.density);
    document.addEventListener('uiflow:density-changed', handler);
    return () => document.removeEventListener('uiflow:density-changed', handler);
  }, []);
  
  return density;
}
```

### Vue Integration  
```typescript
// Use composables for reactivity
export function useUIFlow() {
  const density = ref(0.3);
  
  onMounted(() => {
    document.addEventListener('uiflow:density-changed', (e) => {
      density.value = e.detail.density;
    });
  });
  
  return { density };
}
```

### Angular Integration (Modern)
```typescript
// Use standalone components and modern providers
export function provideUIFlow(config: Partial<UIFlowConfig>) {
  return makeEnvironmentProviders([
    { provide: UIFLOW_CONFIG, useValue: config },
    UIFlowService
  ]);
}
```

## Configuration Best Practices

### JSON Schema Validation
```typescript
// Validate configuration structure before use
function validateConfiguration(config: any): UIFlowConfiguration {
  if (!config.name || typeof config.name !== 'string') {
    throw new Error('Configuration must have a string name');
  }
  
  if (!config.areas || typeof config.areas !== 'object') {
    throw new Error('Configuration must define areas');
  }
  
  return config as UIFlowConfiguration;
}
```

### Progressive Disclosure Patterns
```json
{
  "dependencies": [
    {
      "type": "usage_count",
      "elementId": "basic-feature",
      "threshold": 3,
      "description": "Use basic feature 3 times to unlock advanced"
    },
    {
      "type": "logical_and", 
      "elements": ["feature-a", "feature-b"],
      "description": "Must use both prerequisite features"
    }
  ]
}
```

## Critical Debugging Insights

### Visibility State Machine
Every element goes through this state machine:
1. **Registration** → `initiallyVisible` set based on dependencies
2. **Dependency Change** → `updateElementVisibility()` called
3. **DOM Update** → Both `display` style AND CSS classes updated
4. **User Interaction** → Dependencies re-evaluated

### Common Anti-Patterns to Avoid
```typescript
// ❌ Wrong: Setting all elements visible initially
visible: true,

// ✅ Correct: Check dependencies
visible: options.dependencies?.length > 0 ? false : this.shouldShowElement(category, area),

// ❌ Wrong: Only managing display style  
element.style.display = shouldShow ? '' : 'none';

// ✅ Correct: Manage both display and CSS classes
element.style.display = shouldShow ? '' : 'none';
element.classList.toggle('hidden', !shouldShow);
```

## Security Considerations

### XSS Prevention
```typescript
// Sanitize user-provided content
element.textContent = userInput; // Safe
element.innerHTML = sanitize(userInput); // If HTML needed

// Validate configuration sources
if (!isValidConfigurationSource(configUrl)) {
  throw new Error('Untrusted configuration source');
}
```

### Data Privacy
```typescript
// Don't log sensitive user data
console.log('User interaction:', { elementId, timestamp }); // OK
console.log('User data:', userData); // Avoid
```

These guidelines ensure consistent, maintainable, and performant UIFlow code across all contributors.

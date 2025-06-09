# UIFlow Architecture Principles

## Core Philosophy: Configuration-Driven Progressive Disclosure

UIFlow follows a **declarative, configuration-driven approach** rather than imperative API calls. This architectural decision enables:

- **Non-developer friendly** setup via JSON/YAML configs
- **Version control ready** configurations as code
- **Predictable behavior** through declarative rules
- **Framework agnostic** implementation

## Key Architectural Patterns

### 1. Configuration-First Design

**❌ Wrong Approach (API-driven):**
```javascript
// Manual API calls bypass the configuration system
uiflow.recordInteraction('publish-now', 'basic', 'composer');
uiflow.showElement('media-widget');
uiflow.hideElement('schedule-widget');
```

**✅ Correct Approach (Configuration-driven):**
```json
{
  "areas": {
    "composer": {
      "elements": [
        {
          "id": "media-widget",
          "selector": "#media-widget", 
          "category": "advanced",
          "dependencies": [
            {
              "type": "usage_count",
              "elementId": "publish-now",
              "threshold": 2
            }
          ]
        }
      ]
    }
  }
}
```

### 2. DOM-Driven Interaction Tracking

UIFlow automatically tracks interactions on elements with proper data attributes:

```html
<button id="publish-now" 
        data-uiflow-id="publish-now"
        data-uiflow-category="basic" 
        data-uiflow-area="composer">
  Publish Now
</button>
```

When users click these elements, UIFlow:
1. Captures the interaction via event listeners
2. Updates dependency counters
3. Evaluates which elements should be shown/hidden
4. Applies progressive disclosure rules

### 3. Dependency-Based Progressive Disclosure

Elements are shown/hidden based on declarative dependency rules:

- **usage_count**: Show after N interactions with another element
- **sequence**: Show after elements are used in specific order  
- **time_based**: Show after patterns over time windows
- **logical_and/or**: Complex conditional logic

### 4. Separation of Concerns

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   JSON Config   │───▶│   UIFlow Core    │───▶│   DOM Updates   │
│  (Declarative)  │    │ (Rule Engine)    │    │ (Visual State)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

- **Configuration**: Defines what elements exist and their relationships
- **UIFlow Core**: Processes rules and manages state
- **DOM**: Reflects the current adaptive state visually

## Implementation Guidelines

### For Demo/App Developers

1. **Define elements in configuration first**
2. **Ensure DOM elements have proper data attributes**
3. **Let UIFlow handle the interaction tracking automatically**
4. **Test by interacting with actual UI elements, not API calls**

### For Simulations

```javascript
// ❌ Wrong: Direct API calls
uiflow.recordInteraction('element-id', 'category', 'area');

// ✅ Right: Simulate real user interactions
function simulateElementClick(elementId) {
  const element = document.querySelector(`[data-uiflow-id="${elementId}"]`);
  element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}
```

### For Testing

- Test configurations by loading them and interacting with real DOM elements
- Verify dependency rules work by checking element visibility changes
- Simulate user journeys by clicking through actual UI flows

## Benefits of This Architecture

1. **Maintainability**: Changes to UI behavior happen in config files, not code
2. **Collaboration**: Product managers can modify behavior without developer intervention
3. **Testability**: Configurations can be unit tested separately from implementation
4. **Flexibility**: Same core engine works across different frameworks and use cases
5. **Predictability**: Declarative rules make behavior easier to reason about

## Anti-Patterns to Avoid

- ❌ Bypassing configuration with direct API calls
- ❌ Hardcoding element relationships in JavaScript
- ❌ Manual show/hide logic outside the dependency system  
- ❌ Imperative interaction tracking instead of declarative rules
- ❌ Framework-specific implementations in the core engine

This architecture ensures UIFlow remains a **configuration-first, framework-agnostic progressive disclosure engine** that scales from simple use cases to complex enterprise applications.

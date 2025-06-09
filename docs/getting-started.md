# Getting Started with UIFlow

A comprehensive guide to integrating UIFlow into your application for dependency-based progressive disclosure.

## What is UIFlow?

UIFlow is a JavaScript library that automatically adapts your user interface complexity based on user behavior patterns. It progressively reveals advanced features as users become more proficient, creating a personalized experience that grows with user expertise.

### Key Concepts

- **Categories**: UI elements are categorized as `basic`, `advanced`, or `expert`
- **Areas**: Logical UI sections like `editor`, `toolbar`, `sidebar` 
- **Dependencies**: Rules that determine when elements become visible
- **Progressive Disclosure**: Elements unlock based on user interaction patterns

## Quick Start

### 1. Installation

```bash
npm install uiflow
```

Or include via CDN:

```html
<script src="https://unpkg.com/uiflow@latest/dist/uiflow.min.js"></script>
```

### 2. Basic Setup

```javascript
import { UIFlow } from 'uiflow';

// Create and initialize UIFlow
const uiflow = new UIFlow({
  userId: 'user-123',
  categories: ['basic', 'advanced', 'expert']
});

await uiflow.init();
```

### 3. Categorize Your UI Elements

```html
<div id="toolbar" class="toolbar">
  <!-- Always visible -->
  <button id="save-btn">Save</button>
  
  <!-- Shows when density ≥ 0.33 -->
  <button id="export-btn">Export</button>
  
  <!-- Shows when density ≥ 0.67 -->
  <button id="batch-btn">Batch Operations</button>
</div>
```

```javascript
// Categorize elements
uiflow.categorize(
  document.getElementById('save-btn'), 
  'basic', 
  'toolbar'
);

uiflow.categorize(
  document.getElementById('export-btn'), 
  'advanced', 
  'toolbar',
  { helpText: 'Export your data in multiple formats' }
);

uiflow.categorize(
  document.getElementById('batch-btn'), 
  'expert', 
  'toolbar',
  { helpText: 'Advanced batch operations for power users' }
);
```

### 4. Watch It Adapt

As users interact with advanced features, UIFlow will automatically increase the density and show more complex UI elements.

## Framework Integration

### React

```jsx
import { UIFlowProvider, UIFlowElement } from 'uiflow/adapters/react';

function App() {
  return (
    <UIFlowProvider config={{ userId: 'user-123' }}>
      <Toolbar />
    </UIFlowProvider>
  );
}

function Toolbar() {
  return (
    <div className="toolbar">
      <UIFlowElement category="basic" area="toolbar">
        <button>Save</button>
      </UIFlowElement>
      
      <UIFlowElement 
        category="advanced" 
        area="toolbar"
        helpText="Export your data"
      >
        <button>Export</button>
      </UIFlowElement>
      
      <UIFlowElement category="expert" area="toolbar">
        <button>Batch Operations</button>
      </UIFlowElement>
    </div>
  );
}
```

### Vue

```vue
<template>
  <div class="toolbar">
    <UIFlowElement category="basic" area="toolbar">
      <button>Save</button>
    </UIFlowElement>
    
    <UIFlowElement 
      category="advanced" 
      area="toolbar"
      help-text="Export your data"
    >
      <button>Export</button>
    </UIFlowElement>
    
    <UIFlowElement category="expert" area="toolbar">
      <button>Batch Operations</button>
    </UIFlowElement>
  </div>
</template>

<script setup>
import { createUIFlow, provideUIFlow } from 'uiflow/adapters/vue';

const uiflow = createUIFlow({ userId: 'user-123' });
provideUIFlow(uiflow);
uiflow.initialize();
</script>
```

### Angular

```typescript
// app.module.ts
import { UIFlowModule } from 'uiflow/adapters/angular';

@NgModule({
  imports: [
    UIFlowModule.forRoot({ userId: 'user-123' })
  ]
})
export class AppModule { }
```

```html
<!-- toolbar.component.html -->
<div class="toolbar">
  <button uiflowElement="basic" uiflowArea="toolbar">
    Save
  </button>
  
  <button 
    uiflowElement="advanced" 
    uiflowArea="toolbar"
    uiflowHelpText="Export your data">
    Export
  </button>
  
  <button uiflowElement="expert" uiflowArea="toolbar">
    Batch Operations
  </button>
</div>
```

## Core Concepts Deep Dive

### Categories Explained

**Basic (Always Visible)**
- Core functionality every user needs
- Save, Load, basic editing tools
- Should work without any learning curve

**Advanced (Shows at ~33% density)**
- Power user features
- Export, import, formatting tools
- Useful once users are comfortable with basics

**Expert (Shows at ~67% density)**
- Complex, specialized features
- Batch operations, advanced configurations
- For users who have mastered the application

### Areas for Organization

Organize your UI into logical areas for independent density management:

```javascript
// Good: Specific, logical areas
uiflow.categorize(element, 'advanced', 'text-editor');
uiflow.categorize(element, 'expert', 'file-browser');
uiflow.categorize(element, 'advanced', 'settings-panel');

// Avoid: Everything in default area
uiflow.categorize(element, 'advanced', 'default');
```

### Density Levels

| Density | Visible Categories | Use Case |
|---------|-------------------|----------|
| 0.0 - 0.33 | Basic only | New users, simple tasks |
| 0.33 - 0.67 | Basic + Advanced | Regular users, complex tasks |
| 0.67 - 1.0 | All categories | Power users, all features |

## User Education Features

### Highlighting New Features

```javascript
// Flag element as new when it becomes visible
uiflow.flagAsNew('export-btn', 'Try our new export feature!', 8000);

// Or highlight existing elements
uiflow.highlightElement('export-btn', 'new-feature', {
  tooltip: 'Export your data to PDF, Excel, or CSV',
  duration: 5000
});
```

### Progressive Disclosure

```javascript
// Listen for density changes to educate users
document.addEventListener('uiflow:adaptation', (event) => {
  const { area, newDensity } = event.detail;
  
  if (newDensity > 0.5) {
    // User is ready for expert features
    showFeatureTour('expert-features');
  }
});
```

## Data Persistence

### Local Storage (Default)

UIFlow automatically saves usage patterns to localStorage:

```javascript
// Data is automatically saved after interactions
// and loaded on initialization
```

### External API Integration

```javascript
const uiflow = new UIFlow({
  userId: 'user-123',
  dataSources: {
    api: {
      endpoint: 'https://api.yourapp.com/uiflow',
      primary: true
    }
  }
});
```

Your API should handle:
- `GET /uiflow/:userId` - Fetch user preferences
- `POST /uiflow/:userId` - Save user preferences

### Analytics Integration

```javascript
const uiflow = new UIFlow({
  userId: 'user-123',
  dataSources: {
    segment: {
      writeKey: 'your-segment-write-key',
      trackingPlan: 'uiflow'
    }
  }
});
```

## Testing Your Implementation

### Manual Testing

```javascript
// Simulate different user types
const beginnerPattern = Array(20).fill({ category: 'basic' });
const expertPattern = [
  ...Array(5).fill({ category: 'basic' }),
  ...Array(15).fill({ category: 'expert' })
];

// Test beginner behavior
uiflow.simulateUsage('editor', beginnerPattern, 7);
console.log('Beginner density:', uiflow.getDensityLevel('editor'));

// Test expert behavior  
uiflow.simulateUsage('editor', expertPattern, 7);
console.log('Expert density:', uiflow.getDensityLevel('editor'));
```

### Admin Controls

```javascript
// Force specific density for testing
uiflow.setRemoteOverride('editor', 0.8);

// Check current state
console.log('Areas:', uiflow.getAreaDensities());
console.log('Overrides:', uiflow.getOverrides());
```

## Common Patterns

### Conditional Toolbars

```javascript
// Show different tools based on density
function updateToolbar() {
  const density = uiflow.getDensityLevel('editor');
  
  if (density < 0.3) {
    showBasicToolbar();
  } else if (density < 0.7) {
    showAdvancedToolbar();
  } else {
    showExpertToolbar();
  }
}

document.addEventListener('uiflow:density-changed', updateToolbar);
document.addEventListener('uiflow:adaptation', updateToolbar);
```

### Feature Discovery

```javascript
// Highlight newly available features
document.addEventListener('uiflow:adaptation', (event) => {
  const { area, newDensity, oldDensity } = event.detail;
  
  // If density increased significantly, show what's new
  if (newDensity - oldDensity > 0.2) {
    discoverNewFeatures(area);
  }
});

function discoverNewFeatures(area) {
  const elements = document.querySelectorAll(
    `[data-uiflow-area="${area}"][data-uiflow-visible="true"]`
  );
  
  elements.forEach(element => {
    const category = element.getAttribute('data-uiflow-category');
    const helpText = element.getAttribute('data-uiflow-help');
    
    if (category !== 'basic' && helpText) {
      const elementId = element.getAttribute('data-uiflow-id');
      uiflow.flagAsNew(elementId, helpText, 8000);
    }
  });
}
```

### Responsive Complexity

```css
/* Adapt spacing based on density */
.toolbar[data-uiflow-area="toolbar"] {
  gap: 1rem;
}

.toolbar[data-uiflow-area="toolbar"][data-density="high"] {
  gap: 0.5rem;
}

/* Hide labels in high density mode */
.toolbar[data-density="high"] .button-label {
  display: none;
}
```

## Best Practices

### 1. Start Conservative
Begin with low density (0.3) and let users naturally progress.

### 2. Logical Grouping
Group related features in the same category and area.

### 3. Clear Help Text
Always provide helpful descriptions for non-basic features.

### 4. Graceful Degradation
Ensure basic functionality works even if UIFlow fails to load.

### 5. Test User Journeys
Simulate different user types to validate the adaptation logic.

### 6. Monitor Analytics
Track how users interact with different density levels.

## Troubleshooting

### Elements Not Hiding/Showing

```javascript
// Check element categorization
console.log('Element data:', uiflow.elements.get('element-id'));

// Check current density
console.log('Area density:', uiflow.getDensityLevel('area-name'));

// Check if element should be visible
console.log('Should show:', uiflow.shouldShowElement('advanced', 'area-name'));
```

### Density Not Adapting

```javascript
// Check usage history
console.log('Usage history:', uiflow.usageHistory);

// Check adaptation threshold
console.log('Adaptation threshold:', uiflow.config.adaptationThreshold);

// Manually trigger adaptation
uiflow.adaptDensity('area-name');
```

### Data Not Persisting

```javascript
// Check localStorage
console.log('Stored data:', localStorage.getItem('uiflow-data'));

// Check data sources
console.log('Data sources:', uiflow.dataManager.getSourceNames());

// Force sync
await uiflow.forceSync();
```

## Next Steps

- Read the [API Reference](./api.md) for complete method documentation
- Explore [Framework Adapters](./framework-adapters.md) for your specific framework
- Check out [Best Practices](./best-practices.md) for advanced patterns
- See [Examples](./examples/) for real-world implementations

## Support

- [GitHub Issues](https://github.com/yourorg/uiflow/issues)
- [Documentation](./README.md)
- [Examples Repository](https://github.com/yourorg/uiflow-examples)

# UIFlow 🎛️

**Adaptive UI Density Management Library**

UIFlow automatically adapts your user interface complexity based on user behavior patterns, creating personalized experiences that grow with user expertise. Features intelligent element dependencies, A/B testing, and declarative configuration for scalable UX management.

[![npm version](https://img.shields.io/npm/v/@andreaswissel/uiflow.svg)](https://www.npmjs.com/package/@andreaswissel/uiflow)
[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)
[![Build Status](https://img.shields.io/github/actions/workflow/status/andreaswissel/uiflow/ci.yml)](https://github.com/andreaswissel/uiflow/actions)

## ✨ Features

- 🎯 **Progressive Disclosure**: Show UI complexity based on user proficiency
- 🧠 **Smart Learning**: Automatically adapts to user behavior patterns
- 🔗 **Element Dependencies**: Define logical relationships between features with usage thresholds
- 📊 **A/B Testing**: Built-in experimentation framework with variant selection and metrics
- 📋 **Declarative Configuration**: JSON-based setup for scalable UX management
- 🎛️ **Area-Specific Control**: Independent density management per UI section
- 🎨 **User Education**: Visual highlights, tooltips, and feature discovery
- 💾 **Data Persistence**: Local storage + external API/analytics sync
- ⚡ **Framework Native**: First-class React, Vue, and Angular support
- 🛡️ **Admin Controls**: Remote overrides for organizational policies
- 🔧 **Developer Friendly**: TypeScript support, comprehensive docs

## 🚀 Quick Start

### Installation

```bash
npm install @andreaswissel/uiflow
```

### Vanilla JavaScript

```javascript
import { UIFlow } from '@andreaswissel/uiflow';

// Initialize UIFlow
const uiflow = new UIFlow({ userId: 'user-123' });
await uiflow.init();

// Categorize UI elements
uiflow.categorize(
  document.querySelector('#advanced-btn'), 
  'advanced', 
  'toolbar',
  { helpText: 'Advanced formatting options' }
);

// Elements automatically show/hide based on user proficiency
```

### React

```jsx
import { UIFlowProvider, UIFlowElement } from '@andreaswissel/uiflow/adapters/react';

function App() {
  return (
    <UIFlowProvider config={{ userId: 'user-123' }}>
      <Toolbar />
    </UIFlowProvider>
  );
}

function Toolbar() {
  return (
    <div>
      {/* Always visible */}
      <UIFlowElement category="basic" area="toolbar">
        <button>Save</button>
      </UIFlowElement>
      
      {/* Shows when user becomes proficient */}
      <UIFlowElement 
        category="advanced" 
        area="toolbar"
        helpText="Export in multiple formats"
      >
        <button>Export</button>
      </UIFlowElement>
      
      {/* Expert-level features */}
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
  <div>
    <UIFlowElement category="basic" area="toolbar">
      <button>Save</button>
    </UIFlowElement>
    
    <UIFlowElement 
      category="advanced" 
      area="toolbar"
      help-text="Export in multiple formats"
    >
      <button>Export</button>
    </UIFlowElement>
    
    <UIFlowElement category="expert" area="toolbar">
      <button>Batch Operations</button>
    </UIFlowElement>
  </div>
</template>

<script setup>
import { createUIFlow, provideUIFlow } from '@andreaswissel/uiflow/adapters/vue';

const uiflow = createUIFlow({ userId: 'user-123' });
provideUIFlow(uiflow);
await uiflow.initialize();
</script>
```

### Angular

```typescript
// main.ts (standalone application)
import { bootstrapApplication } from '@angular/platform-browser';
import { provideUIFlow } from '@andreaswissel/uiflow/adapters/angular';
import { AppComponent } from './app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideUIFlow({ userId: 'user-123' })
  ]
});
```

```typescript
// toolbar.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UIFLOW_COMPONENTS } from '@andreaswissel/uiflow/adapters/angular';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, ...UIFLOW_COMPONENTS],
  template: `
    <div>
      <button uiflowElement="basic" uiflowArea="toolbar">
        Save
      </button>
      
      <button 
        uiflowElement="advanced" 
        uiflowArea="toolbar"
        uiflowHelpText="Export in multiple formats">
        Export
      </button>
      
      <button uiflowElement="expert" uiflowArea="toolbar">
        Batch Operations
      </button>
    </div>
  `
})
export class ToolbarComponent { }
```

## 🎯 Configuration-Based Setup

For complex applications, use declarative JSON configuration with element dependencies and A/B testing:

```javascript
// Load configuration with intelligent dependencies
const config = {
  "areas": {
    "social": {
      "elements": [
        {
          "id": "media-widget",
          "category": "advanced",
          "dependencies": [
            {
              "type": "usage_count",
              "elementId": "publish-btn",
              "threshold": 2,
              "description": "Create 2 posts before uploading media"
            }
          ]
        },
        {
          "id": "scheduler",
          "category": "expert", 
          "dependencies": [
            {
              "type": "logical_and",
              "elements": ["media-widget", "publish-btn"],
              "description": "Use media uploads before accessing scheduler"
            }
          ]
        }
      ]
    }
  }
};

await uiflow.loadConfiguration(config);
```

### Element Dependencies

Create logical UX progressions:

```javascript
// Usage count: "Use feature X times to unlock Y"
{
  "type": "usage_count",
  "elementId": "basic-editor",
  "threshold": 5
}

// Sequence: "Complete workflow A → B → C"
{
  "type": "sequence", 
  "elements": ["create-post", "add-media", "schedule"]
}

// Time-based: "Use X features over Y period"
{
  "type": "time_based",
  "elementId": "advanced-tools",
  "timeWindow": "7d",
  "minUsage": 3
}

// Logical AND: "Master multiple features"
{
  "type": "logical_and",
  "elements": ["feature-a", "feature-b"]
}
```

### A/B Testing

Built-in experimentation framework:

```javascript
const config = {
  "abTest": {
    "variants": [
      { "id": "control", "weight": 0.5 },
      { "id": "aggressive", "weight": 0.5 }
    ]
  }
};

// Track conversion metrics
uiflow.trackABTestMetric('feature_adoption');
uiflow.trackABTestMetric('user_retention');

// Get experiment results
const results = uiflow.getABTestResults();
console.log(results); // { variant: "control", metrics: { ... } }
```

## 🎮 Live Demos

Experience UIFlow in action with our interactive demos:

### 🚀 [SocialFlow Demo](https://andreaswissel.github.io/uiflow/demo/social-media-demo.html)
A Buffer.com-style social media post creator showcasing intelligent progressive disclosure:
- Create posts to unlock media uploads
- Use media features to unlock scheduling  
- Complete workflows to unlock analytics
- **Perfect for**: Product managers, UX designers, marketers

### 🛠️ [Technical Demo](https://andreaswissel.github.io/uiflow/demo/technical-demo.html) 
Framework integration examples with admin controls and detailed analytics:
- React, Vue, Angular code examples
- Admin override panels
- Data source integrations
- **Perfect for**: Developers, system architects

**Local Development:**
```bash
npm run dev
# Visit http://localhost:5173/ for demo showcase
```

## 🎯 How It Works

UIFlow operates on three core concepts:

### 1. Categories
- **Basic**: Essential features every user needs (always visible)
- **Advanced**: Power user features (show at ~33% density)
- **Expert**: Complex/specialized features (show at ~67% density)

### 2. Areas
Logical UI sections that adapt independently:
```javascript
uiflow.categorize(element, 'advanced', 'text-editor');
uiflow.categorize(element, 'expert', 'file-browser');
uiflow.categorize(element, 'basic', 'navigation');
```

### 3. Density (0-1 scale)
Represents UI complexity in each area:
- **0-33%**: Beginner mode (basic features only)
- **33-67%**: Intermediate mode (basic + advanced)
- **67-100%**: Expert mode (all features)

## 📊 Adaptive Learning

UIFlow automatically tracks user interactions and adapts density:

```javascript
// Simulate different user types for testing
const beginnerPattern = Array(20).fill({ category: 'basic' });
const expertPattern = [
  ...Array(5).fill({ category: 'basic' }),
  ...Array(15).fill({ category: 'expert' })
];

uiflow.simulateUsage('editor', beginnerPattern, 7); // 7 days
uiflow.simulateUsage('editor', expertPattern, 7);
```

Monitor adaptation in real-time:
```javascript
document.addEventListener('uiflow:adaptation', (event) => {
  const { area, newDensity, advancedRatio } = event.detail;
  console.log(`${area} adapted to ${Math.round(newDensity * 100)}%`);
});
```

## 🎨 User Education

Help users discover new features as they become available:

```javascript
// Automatic feature highlighting
uiflow.flagAsNew('export-btn', 'Try our new export feature!', 8000);

// Interactive tooltips
uiflow.showTooltip('batch-btn', 'Process multiple files at once');

// Custom highlighting
uiflow.highlightElement('advanced-feature', 'new-feature', {
  duration: 5000,
  tooltip: 'New advanced feature available!',
  onDismiss: (elementId) => console.log(`User dismissed ${elementId}`)
});
```

## 💾 Data Persistence

### Local Storage (Default)
```javascript
// Automatic persistence - no setup required
const uiflow = new UIFlow({ userId: 'user-123' });
```

### External API
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

Your API endpoints:
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

## 🛡️ Admin Controls

Override user preferences for organizational policies:

```javascript
// Force specific density levels
uiflow.setRemoteOverride('editor', 0.8); // 80% density

// Check override status
if (uiflow.hasOverride('editor')) {
  console.log('Editor density is controlled remotely');
}

// Clear overrides
uiflow.clearRemoteOverride('editor');
```

## 🎛️ Manual Controls

Always provide users control over their experience:

```javascript
// Manual density adjustment
uiflow.setDensityLevel(0.7, 'editor');

// Get current state
const densities = uiflow.getAreaDensities();
// Returns: { editor: 0.7, toolbar: 0.5, sidebar: 0.3 }

// Check what's visible
const shouldShow = uiflow.shouldShowElement('advanced', 'editor');
```

## 📖 Documentation

- **[Getting Started](./docs/getting-started.md)** - Complete tutorial
- **[API Reference](./docs/api.md)** - Full method documentation  
- **[Framework Adapters](./src/adapters/README.md)** - React, Vue, Angular guides
- **[Best Practices](./docs/best-practices.md)** - Production patterns
- **[Examples](./docs/examples/)** - Real-world implementations

## 🏗️ Framework Support

| Framework | Version | Adapter | Features |
|-----------|---------|---------|----------|
| **React** | 16.8+ | `@andreaswissel/uiflow/adapters/react` | Hooks, Context, Components |
| **Vue** | 3.0+ | `@andreaswissel/uiflow/adapters/vue` | Composables, Plugins, Reactivity |
| **Angular** | 12+ | `@andreaswissel/uiflow/adapters/angular` | Services, Directives, Observables |
| **Vanilla JS** | ES6+ | `@andreaswissel/uiflow` | Full API, Framework-agnostic |

## 🔧 Configuration

```javascript
const uiflow = new UIFlow({
  userId: 'user-123',                    // User identifier
  categories: ['basic', 'advanced', 'expert'], // UI complexity levels
  learningRate: 0.1,                    // Adaptation speed (0-1)
  timeAcceleration: 1,                  // For testing (1-1000x)
  adaptationThreshold: 3,               // Min interactions before adapting
  decayRate: 0.95,                      // How quickly old patterns fade
  syncInterval: 5 * 60 * 1000,          // Data source sync interval
  dataSources: {                        // External data integration
    api: { endpoint: 'https://...', primary: true },
    segment: { writeKey: 'key' }
  }
});
```

## 🧪 Testing

UIFlow includes comprehensive testing utilities:

```javascript
// A/B testing different categorizations
const experimentGroup = Math.random() < 0.5 ? 'A' : 'B';
const category = experimentGroup === 'A' ? 'advanced' : 'basic';
uiflow.categorize(exportBtn, category, 'toolbar');

// Performance monitoring
document.addEventListener('uiflow:adaptation', (event) => {
  const { area, newDensity, totalInteractions } = event.detail;
  analytics.track('density_adaptation', {
    area, density: newDensity, interactions: totalInteractions
  });
});

// Simulate user journeys
uiflow.simulateUsage('editor', beginnerInteractions, 30); // 30 days
expect(uiflow.getDensityLevel('editor')).toBeLessThan(0.4);
```

## 🎨 Styling

UIFlow adds CSS classes and data attributes for styling:

```css
/* Style by category */
[data-uiflow-category="advanced"] {
  border-left: 3px solid blue;
}

[data-uiflow-category="expert"] {
  border-left: 3px solid red;
}

/* Style by visibility */
[data-uiflow-visible="false"] {
  opacity: 0.5;
  pointer-events: none;
}

/* Smooth transitions */
[data-uiflow-category] {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

/* Density-based responsive design */
[data-uiflow-area="toolbar"][data-density="high"] {
  gap: 0.25rem; /* Tighter spacing in dense mode */
}
```

## 🌟 Use Cases

### Social Media Management
Like our SocialFlow demo - unlock media uploads after creating posts, scheduling after using media:
```json
{ "type": "usage_count", "elementId": "publish-btn", "threshold": 2 }
```

### Text Editors & IDEs
Progressive disclosure of formatting tools, macros, and plugin management based on coding patterns.

### Admin Dashboards  
Show basic metrics to new users, advanced analytics and SQL builders to power users.

### Design Tools
Reveal complex tools and settings as users demonstrate proficiency with basic features.

### E-commerce Platforms
Adaptive seller tools: basic listing → advanced SEO → bulk operations → automation rules.

### Data Visualization
Progressive complexity: simple charts → custom styling → advanced analytics → API integrations.

### SaaS Applications
Use A/B testing to optimize feature rollouts and element dependencies to reduce cognitive load.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/andreaswissel/uiflow.git
cd uiflow
npm install
npm run dev    # Start demo server
npm run test   # Run test suite
npm run build  # Build library
```

## 📊 Browser Support

- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Node.js**: 16+
- **Dependencies**: Zero runtime dependencies
- **Bundle Size**: < 15KB gzipped

## 📄 License

UIFlow is licensed under [Creative Commons Attribution-NonCommercial 4.0 International](https://creativecommons.org/licenses/by-nc/4.0/).

- ✅ **Open Source Use**: Free for non-commercial projects
- ✅ **Attribution Required**: Please credit UIFlow
- ❌ **Commercial Use**: Requires separate license

For commercial licensing, please contact [support@kaeku.io](mailto:support@kaeku.io).

## 🙏 Acknowledgments

- Inspired by adaptive interfaces research from MIT and Stanford HCI labs
- Built with modern web standards and best practices
- Tested across diverse applications and user types

## 📞 Support

- 📖 **Documentation**: [docs/](./docs/)
- 🐛 **Issues**: [GitHub Issues](https://github.com/andreaswissel/uiflow/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/andreaswissel/uiflow/discussions)
- 📧 **Email**: [support@kaeku.io](mailto:support@kaeku.io)

---

**Ready to create adaptive interfaces?** [Get started](./docs/getting-started.md) with UIFlow today! 🚀

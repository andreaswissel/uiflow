# UIFlow Framework Adapters

Framework-specific adapters for easy UIFlow integration with React, Vue, and Angular.

## Overview

UIFlow provides native adapters for popular JavaScript frameworks, offering idiomatic integration patterns:

- **React**: Hooks, Context API, and components
- **Vue**: Composables, plugins, and reactive components  
- **Angular**: Services, directives, and observables

## Features

### React Adapter
- **Hooks**: `useUIFlow`, `useUIFlowElement`, `useAreaDensity`, `useUIFlowHighlight`
- **Components**: `UIFlowProvider`, `UIFlowElement`, `UIFlowConditional`
- **Context**: Automatic UIFlow instance sharing
- **Events**: Custom event handling with `useUIFlowEvents`

### Vue Adapter  
- **Composables**: `useUIFlow`, `useUIFlowElement`, `useAreaDensity`, `useUIFlowHighlight`
- **Components**: `UIFlowElement`, `UIFlowConditional`, `UIFlowDensityIndicator`
- **Plugin**: Global installation with `UIFlowPlugin`
- **Reactivity**: Full Vue 3 reactivity support

### Angular Adapter
- **Services**: `UIFlowService` with full Observable support
- **Directives**: `uiflowElement`, `*uiflowIf` for structural control
- **Components**: `uiflow-density-indicator`, `uiflow-density-control`
- **Module**: `UIFlowModule.forRoot()` for configuration

## Quick Start

### React

```jsx
import { UIFlowProvider, UIFlowElement } from 'uiflow/adapters/react';

function App() {
  return (
    <UIFlowProvider config={{ userId: 'user-123' }}>
      <UIFlowElement category="advanced" area="editor">
        <button>Advanced Feature</button>
      </UIFlowElement>
    </UIFlowProvider>
  );
}
```

### Vue

```vue
<template>
  <UIFlowElement category="advanced" area="editor">
    <button>Advanced Feature</button>
  </UIFlowElement>
</template>

<script setup>
import { useAreaDensity } from 'uiflow/adapters/vue';
const { density } = useAreaDensity('editor');
</script>
```

### Angular

```typescript
// app.module.ts
import { UIFlowModule } from 'uiflow/adapters/angular';

@NgModule({
  imports: [UIFlowModule.forRoot({ userId: 'user-123' })]
})
export class AppModule { }
```

```html
<!-- component.html -->
<button uiflowElement="advanced" uiflowArea="editor">
  Advanced Feature
</button>
```

## API Reference

### React

#### Hooks

**`useUIFlow()`**
Access the UIFlow instance and ready state.

```jsx
const { uiflow, isReady } = useUIFlow();
```

**`useUIFlowElement(category, area, options)`**
Categorize an element and track visibility.

```jsx
const { elementRef, isVisible } = useUIFlowElement('advanced', 'editor', {
  helpText: 'Advanced editing features',
  isNew: true
});
```

**`useAreaDensity(area)`**
Track and control density for an area.

```jsx
const { density, hasOverride, setDensityLevel } = useAreaDensity('editor');
```

**`useUIFlowHighlight()`**
Control element highlighting and tooltips.

```jsx
const { highlight, flagAsNew, showTooltip } = useUIFlowHighlight();
```

#### Components

**`<UIFlowProvider config={} onReady={}>`**
Root provider component.

**`<UIFlowElement category="" area="" helpText="" isNew={} fallback={}>`**
Wrapper for categorized elements.

**`<UIFlowConditional area="" minDensity={} maxDensity={}>`**
Conditional rendering based on density.

### Vue

#### Composables

**`createUIFlow(config)`**
Create UIFlow instance.

```js
const { uiflow, isReady, initialize } = createUIFlow(config);
```

**`useUIFlowElement(category, area, options)`**
Element categorization composable.

```js
const { elementRef, isVisible } = useUIFlowElement('advanced', 'editor');
```

**`useAreaDensity(area)`**
Area density management.

```js
const { density, hasOverride, setDensityLevel } = useAreaDensity('editor');
```

#### Components

**`<UIFlowElement category="" area="" help-text="" :is-new="">`**
Element wrapper component.

**`<UIFlowConditional area="" :min-density="" :max-density="">`**
Conditional rendering component.

### Angular

#### Services

**`UIFlowService`**
Core service for UIFlow integration.

```typescript
constructor(private uiflowService: UIFlowService) {}

// Methods
categorize(element, category, area, options)
getDensityLevel(area): number
getDensity$(area): Observable<number>
setDensityLevel(level, area)
```

#### Directives

**`uiflowElement`**
Element categorization directive.

```html
<button 
  uiflowElement="advanced" 
  uiflowArea="editor"
  uiflowHelpText="Help text"
  [uiflowIsNew]="true">
  Button
</button>
```

**`*uiflowIf`**
Structural directive for conditional rendering.

```html
<div *uiflowIf="'expert'; uiflowIfArea: 'editor'">
  Expert content
</div>
```

## Advanced Usage

### Custom Event Handling

**React**
```jsx
useUIFlowEvents({
  'adaptation': (detail) => console.log('Adapted:', detail),
  'sync-success': (detail) => console.log('Synced:', detail)
});
```

**Vue**
```js
useUIFlowEvents({
  'adaptation': (detail) => console.log('Adapted:', detail)
});
```

**Angular**
```typescript
// Listen to DOM events directly
document.addEventListener('uiflow:adaptation', (event) => {
  console.log('Adapted:', event.detail);
});
```

### Feature Discovery

**React**
```jsx
const { discoverNewFeatures } = useFeatureDiscovery('editor');

// Automatically highlight new features when density increases
useEffect(() => {
  discoverNewFeatures();
}, [density]);
```

**Vue**
```js
// Watch for density changes and highlight new features
watch(density, () => {
  const elements = document.querySelectorAll('[data-uiflow-visible="true"]');
  // Highlight logic...
});
```

**Angular**
```typescript
@Directive({ selector: '[uiflowAutoDiscover]' })
export class AutoDiscoverDirective {
  // Automatically discover and highlight new features
}
```

### Usage Simulation

All frameworks support usage simulation for testing:

```javascript
// Simulate beginner usage
uiflow.simulateUsage('editor', 
  Array(20).fill({ category: 'basic' }), 
  7 // days
);

// Simulate expert usage
uiflow.simulateUsage('editor', [
  ...Array(5).fill({ category: 'basic' }),
  ...Array(15).fill({ category: 'expert' })
], 7);
```

## Best Practices

### 1. Area Organization
Organize your UI into logical areas for better density management:

```javascript
// Good: Specific areas
<UIFlowElement category="advanced" area="text-editor">
<UIFlowElement category="expert" area="file-browser">

// Avoid: Generic areas
<UIFlowElement category="advanced" area="default">
```

### 2. Progressive Disclosure
Structure categories from basic to expert:

```javascript
// Basic: Always visible core functionality
<UIFlowElement category="basic" area="editor">
  <textarea />
</UIFlowElement>

// Advanced: Power user features
<UIFlowElement category="advanced" area="editor">
  <FormattingToolbar />
</UIFlowElement>

// Expert: Complex/rare features
<UIFlowElement category="expert" area="editor">
  <CodeEditor />
</UIFlowElement>
```

### 3. Help Text & Discovery
Always provide helpful descriptions for non-basic features:

```jsx
<UIFlowElement 
  category="advanced" 
  area="editor"
  helpText="Rich text formatting with bold, italic, and links"
  isNew={true}>
  <RichTextToolbar />
</UIFlowElement>
```

### 4. Responsive Design
Consider different density levels in your CSS:

```css
/* Adapt spacing based on density */
[data-uiflow-area="toolbar"] {
  gap: 0.5rem;
}

[data-uiflow-area="toolbar"][data-density="high"] {
  gap: 0.25rem;
}
```

## Migration Guide

### From Vanilla UIFlow

Replace manual categorization:

```javascript
// Before (vanilla)
uiflow.categorize(element, 'advanced', 'editor');

// After (React)
<UIFlowElement category="advanced" area="editor">
  {children}
</UIFlowElement>

// After (Vue)
<UIFlowElement category="advanced" area="editor">
  <slot />
</UIFlowElement>

// After (Angular)
<div uiflowElement="advanced" uiflowArea="editor">
  Content
</div>
```

### Between Frameworks

The core concepts remain the same across frameworks:

1. **Categorization**: `basic` → `advanced` → `expert`
2. **Areas**: Logical UI sections (`editor`, `sidebar`, etc.)
3. **Density**: 0-1 scale of UI complexity
4. **Events**: Adaptation, sync, highlighting

Only the syntax changes between frameworks.

## Troubleshooting

### Common Issues

**React: "useUIFlow must be used within UIFlowProvider"**
```jsx
// Wrap your app with UIFlowProvider
<UIFlowProvider config={config}>
  <App />
</UIFlowProvider>
```

**Vue: "useUIFlow must be used within a component that provides UIFlow"**
```js
// Use the plugin or provide manually
app.use(UIFlowPlugin, { config });
// OR
provideUIFlow(uiflowInstance);
```

**Angular: "No provider for UIFlowService"**
```typescript
// Import UIFlowModule in your module
imports: [UIFlowModule.forRoot(config)]
```

### Performance Tips

1. **Minimize Re-renders**: Use `React.memo`, Vue `v-memo`, or Angular `OnPush`
2. **Debounce Density Changes**: Avoid rapid UI updates
3. **Lazy Load Expert Features**: Code-split complex components
4. **Cache Visibility Calculations**: Store computed visibility states

## Support

- Framework compatibility matrix in `FRAMEWORK_COMPATIBILITY`
- Auto-detection with `detectFramework()`
- Integration guides with `getIntegrationGuide(framework)`
- Version checking with `checkCompatibility(framework, version)`

# UIFlow API Reference

Complete API reference for UIFlow - Adaptive UI Density Management Library.

## Table of Contents

- [Core API](#core-api)
- [Configuration](#configuration)
- [Element Management](#element-management)
- [Density Control](#density-control)
- [Data Sources](#data-sources)
- [User Education](#user-education)
- [Events](#events)
- [Framework Adapters](#framework-adapters)

## Core API

### UIFlow Constructor

```javascript
const uiflow = new UIFlow(options);
```

**Parameters:**
- `options` (Object, optional): Initial configuration object

**Example:**
```javascript
const uiflow = new UIFlow({
  categories: ['basic', 'advanced', 'expert'],
  learningRate: 0.1,
  userId: 'user-123'
});
```

### init(config)

Initialize UIFlow with configuration and set up data sources.

```javascript
await uiflow.init(config);
```

**Parameters:**
- `config` (Object): Configuration object (merged with constructor options)

**Returns:** Promise<UIFlow> - The UIFlow instance

**Example:**
```javascript
await uiflow.init({
  userId: 'user-123',
  dataSources: {
    api: { endpoint: 'https://api.example.com', primary: true }
  }
});
```

### destroy()

Clean up UIFlow instance, remove event listeners, and stop sync timers.

```javascript
uiflow.destroy();
```

## Configuration

### Default Configuration

```javascript
{
  categories: ['basic', 'advanced', 'expert'],
  learningRate: 0.1,                    // How quickly to adapt (0-1)
  storageKey: 'uiflow-data',            // localStorage key
  timeAcceleration: 1,                  // For testing: speed up time
  adaptationThreshold: 3,               // Interactions needed before adaptation
  decayRate: 0.95,                      // How quickly old patterns fade
  syncInterval: 5 * 60 * 1000,          // Data source sync interval (5 min)
  userId: null,                         // User identifier
  dataSources: {}                       // Data source configurations
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `categories` | Array<string> | `['basic', 'advanced', 'expert']` | UI complexity categories |
| `learningRate` | number | `0.1` | Adaptation speed (0-1) |
| `timeAcceleration` | number | `1` | Time acceleration for testing |
| `adaptationThreshold` | number | `3` | Min interactions before adapting |
| `decayRate` | number | `0.95` | How quickly old usage patterns fade |
| `userId` | string | `null` | User identifier for data sources |
| `dataSources` | Object | `{}` | Data source configurations |

## Element Management

### categorize(element, category, area, options)

Categorize a UI element for adaptive density management.

```javascript
uiflow.categorize(element, category, area, options);
```

**Parameters:**
- `element` (HTMLElement): DOM element to categorize
- `category` (string): Element category ('basic', 'advanced', 'expert')
- `area` (string, default: 'default'): UI area identifier
- `options` (Object, optional): Additional options

**Options:**
- `helpText` (string): Help text for user education
- `isNew` (boolean): Mark element as new feature

**Example:**
```javascript
const button = document.querySelector('#advanced-btn');
uiflow.categorize(button, 'advanced', 'toolbar', {
  helpText: 'Advanced text formatting options',
  isNew: true
});
```

### shouldShowElement(category, area)

Check if an element should be visible based on current density.

```javascript
const visible = uiflow.shouldShowElement(category, area);
```

**Parameters:**
- `category` (string): Element category
- `area` (string, default: 'default'): UI area

**Returns:** boolean - Whether element should be visible

## Density Control

### getDensityLevel(area)

Get current density level for an area.

```javascript
const density = uiflow.getDensityLevel(area);
```

**Parameters:**
- `area` (string, default: 'default'): UI area identifier

**Returns:** number - Density level (0-1)

### setDensityLevel(level, area, options)

Manually set density level for an area.

```javascript
uiflow.setDensityLevel(level, area, options);
```

**Parameters:**
- `level` (number): Density level (0-1)
- `area` (string, default: 'default'): UI area
- `options` (Object, optional): Options

**Options:**
- `skipAPI` (boolean): Skip pushing to data sources

**Example:**
```javascript
// Set editor to high density
uiflow.setDensityLevel(0.8, 'editor');

// Set without syncing to API
uiflow.setDensityLevel(0.5, 'dashboard', { skipAPI: true });
```

### getAreaDensities()

Get density levels for all areas.

```javascript
const densities = uiflow.getAreaDensities();
// Returns: { editor: 0.7, toolbar: 0.5, sidebar: 0.3 }
```

**Returns:** Object - Area name to density level mapping

### setRemoteOverride(area, density)

Set admin override for area density.

```javascript
uiflow.setRemoteOverride(area, density);
```

**Parameters:**
- `area` (string): UI area identifier
- `density` (number): Override density level (0-1)

### clearRemoteOverride(area)

Remove admin override for area.

```javascript
uiflow.clearRemoteOverride(area);
```

### hasOverride(area)

Check if area has admin override.

```javascript
const hasOverride = uiflow.hasOverride(area);
```

**Returns:** boolean - Whether area has override

### getOverrides()

Get all current overrides.

```javascript
const overrides = uiflow.getOverrides();
// Returns: { editor: 0.8, dashboard: 0.5 }
```

## Data Sources

### addDataSource(name, type, config, isPrimary)

Add a data source dynamically.

```javascript
uiflow.addDataSource(name, type, config, isPrimary);
```

**Parameters:**
- `name` (string): Data source identifier
- `type` (string): Data source type ('api' or 'segment')
- `config` (Object): Data source configuration
- `isPrimary` (boolean, default: false): Whether this is the primary source

**Example:**
```javascript
// Add API data source
uiflow.addDataSource('main-api', 'api', {
  endpoint: 'https://api.example.com'
}, true);

// Add Segment analytics
uiflow.addDataSource('analytics', 'segment', {
  writeKey: 'your-segment-key',
  trackingPlan: 'uiflow'
});
```

### removeDataSource(name)

Remove a data source.

```javascript
uiflow.removeDataSource(name);
```

### getDataSource(name)

Get data source instance for advanced usage.

```javascript
const apiSource = uiflow.getDataSource('main-api');
```

### forceSync()

Force synchronization with all data sources.

```javascript
await uiflow.forceSync();
```

## User Education

### highlightElement(elementId, style, options)

Highlight an element with visual styling.

```javascript
uiflow.highlightElement(elementId, style, options);
```

**Parameters:**
- `elementId` (string): Element ID (data-uiflow-id attribute)
- `style` (string, default: 'default'): Highlight style
- `options` (Object, optional): Highlight options

**Styles:**
- `'default'`: Blue pulsing highlight
- `'new-feature'`: Green glow with "NEW" badge
- `'tooltip'`: Purple border for tooltips

**Options:**
- `duration` (number, default: 5000): Highlight duration in ms
- `tooltip` (string): Tooltip text to show
- `persistent` (boolean, default: false): Keep highlight until manually removed
- `onDismiss` (function): Callback when highlight is removed

**Example:**
```javascript
// Highlight with tooltip
uiflow.highlightElement('btn-export', 'new-feature', {
  duration: 8000,
  tooltip: 'Try the new export feature!',
  onDismiss: (elementId) => console.log(`Dismissed ${elementId}`)
});
```

### removeHighlight(elementId)

Remove highlight from element.

```javascript
uiflow.removeHighlight(elementId);
```

### flagAsNew(elementId, helpText, duration)

Flag element as new with help text.

```javascript
uiflow.flagAsNew(elementId, helpText, duration);
```

**Parameters:**
- `elementId` (string): Element ID
- `helpText` (string, optional): Help text for tooltip
- `duration` (number, default: 8000): Highlight duration

### showTooltip(elementId, text, options)

Show tooltip for element.

```javascript
uiflow.showTooltip(elementId, text, options);
```

**Parameters:**
- `elementId` (string): Element ID
- `text` (string): Tooltip text
- `options` (Object, optional): Tooltip options

### clearAllHighlights()

Remove all current highlights.

```javascript
uiflow.clearAllHighlights();
```

### getHighlights()

Get array of currently highlighted element IDs.

```javascript
const highlighted = uiflow.getHighlights();
// Returns: ['btn-export', 'menu-advanced']
```

## Testing & Simulation

### simulateUsage(area, interactions, daysToSimulate)

Simulate user interactions for testing adaptation behavior.

```javascript
uiflow.simulateUsage(area, interactions, daysToSimulate);
```

**Parameters:**
- `area` (string): UI area to simulate
- `interactions` (Array): Array of interaction objects
- `daysToSimulate` (number, default: 7): Time period to simulate

**Example:**
```javascript
// Simulate beginner usage
uiflow.simulateUsage('editor', 
  Array(20).fill({ category: 'basic' }), 
  7
);

// Simulate expert usage pattern
uiflow.simulateUsage('editor', [
  ...Array(5).fill({ category: 'basic' }),
  ...Array(10).fill({ category: 'advanced' }),
  ...Array(15).fill({ category: 'expert' })
], 7);
```

## Events

UIFlow emits custom DOM events for various activities:

### Event Types

**uiflow:initialized**
Emitted when UIFlow is fully initialized.
```javascript
document.addEventListener('uiflow:initialized', (event) => {
  console.log('UIFlow ready, areas:', event.detail.areas);
});
```

**uiflow:density-changed**
Emitted when area density is manually changed.
```javascript
document.addEventListener('uiflow:density-changed', (event) => {
  const { area, density, areas } = event.detail;
  console.log(`${area} density: ${density}`);
});
```

**uiflow:adaptation**
Emitted when UIFlow automatically adapts density based on usage.
```javascript
document.addEventListener('uiflow:adaptation', (event) => {
  const { area, oldDensity, newDensity, advancedRatio } = event.detail;
  console.log(`Adapted ${area}: ${oldDensity} → ${newDensity}`);
});
```

**uiflow:sync-success**
Emitted when data source synchronization succeeds.
```javascript
document.addEventListener('uiflow:sync-success', (event) => {
  const { sources, data } = event.detail;
  console.log('Synced with:', sources);
});
```

**uiflow:sync-error**
Emitted when data source synchronization fails.
```javascript
document.addEventListener('uiflow:sync-error', (event) => {
  console.error('Sync failed:', event.detail.error);
});
```

**uiflow:highlight-added**
Emitted when element highlighting is added.

**uiflow:highlight-removed** 
Emitted when element highlighting is removed.

**uiflow:override-applied**
Emitted when admin override is applied.

**uiflow:override-cleared**
Emitted when admin override is removed.

## Framework Adapters

UIFlow provides native adapters for popular frameworks:

### React
```javascript
import { UIFlowProvider, useUIFlow, UIFlowElement } from 'uiflow/adapters/react';
```

### Vue
```javascript
import { createUIFlow, useUIFlowElement, UIFlowElement } from 'uiflow/adapters/vue';
```

### Angular
```javascript
import { UIFlowService, UIFlowModule } from 'uiflow/adapters/angular';
```

See [Framework Adapters Documentation](./framework-adapters.md) for detailed usage.

## Error Handling

UIFlow handles errors gracefully and provides informative console warnings:

```javascript
// Invalid category
uiflow.categorize(element, 'invalid-category', 'area');
// Throws: Error: Invalid category: invalid-category

// Missing element
uiflow.categorize(null, 'basic', 'area');
// Console warning and no-op

// Data source sync failures are logged but don't break functionality
// Storage errors fallback to in-memory operation
```

## TypeScript Support

UIFlow includes TypeScript definitions:

```typescript
interface UIFlowConfig {
  categories?: string[];
  learningRate?: number;
  userId?: string;
  dataSources?: Record<string, DataSourceConfig>;
  // ... other options
}

interface ElementOptions {
  helpText?: string;
  isNew?: boolean;
}

class UIFlow {
  categorize(element: HTMLElement, category: string, area?: string, options?: ElementOptions): this;
  getDensityLevel(area?: string): number;
  setDensityLevel(level: number, area?: string, options?: { skipAPI?: boolean }): this;
  // ... other methods
}
```

## Browser Compatibility

- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Features Used**: 
  - ES6+ (Classes, Promises, Map, Set)
  - DOM APIs (MutationObserver, Custom Events)
  - Web Storage (localStorage)
  - Fetch API (for data sources)

## Performance Considerations

- **Element Tracking**: O(1) element lookup using Maps
- **Usage History**: Limited to 30 interactions per category/area
- **Event Throttling**: Density calculations are debounced
- **Memory Management**: Automatic cleanup on destroy()
- **Storage**: Efficient JSON serialization with data compression

## Security

- **No Sensitive Data**: UIFlow doesn't handle authentication tokens directly
- **XSS Protection**: All user content is properly escaped
- **Data Sources**: Support for secure API endpoints with proper headers
- **Local Storage**: Only stores non-sensitive usage patterns

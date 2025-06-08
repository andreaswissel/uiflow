/**
 * UIFlow Framework Adapters
 * Easy integration for popular JavaScript frameworks
 */

// Re-export framework adapters
export * from './react/index.js';
export * from './vue/index.js';
// Note: Angular adapter is TypeScript-only, import directly from './angular/index.ts'

/**
 * Framework detection and auto-setup utilities
 */
export function detectFramework() {
  // React detection
  if (typeof window !== 'undefined' && window.React) {
    return 'react';
  }
  
  // Vue detection  
  if (typeof window !== 'undefined' && (window.Vue || window.__VUE__)) {
    return 'vue';
  }
  
  // Angular detection
  if (typeof window !== 'undefined' && window.ng) {
    return 'angular';
  }
  
  // Check for module imports
  if (typeof module !== 'undefined' && module.exports) {
    try {
      require.resolve('react');
      return 'react';
    } catch (e) {
      // Not React
    }
    
    try {
      require.resolve('vue');
      return 'vue';
    } catch (e) {
      // Not Vue
    }
    
    try {
      require.resolve('@angular/core');
      return 'angular';
    } catch (e) {
      // Not Angular
    }
  }
  
  return 'vanilla';
}

/**
 * Auto-setup UIFlow for detected framework
 */
export async function autoSetup(config = {}) {
  const framework = detectFramework();
  
  switch (framework) {
    case 'react':
      const { createUIFlow: createReactUIFlow } = await import('./react/index.js');
      return createReactUIFlow(config);
      
    case 'vue':
      const { createUIFlow: createVueUIFlow } = await import('./vue/index.js');
      return createVueUIFlow(config);
      
    case 'angular':
      console.warn('Angular setup requires manual configuration. Import UIFlowModule.forRoot(config)');
      return null;
      
    default:
      const { UIFlow } = await import('../index.js');
      const instance = new UIFlow();
      await instance.init(config);
      return instance;
  }
}

/**
 * Framework compatibility information
 */
export const FRAMEWORK_COMPATIBILITY = {
  react: {
    minVersion: '16.8.0', // Hooks support
    features: ['hooks', 'components', 'context', 'events'],
    adapter: './react/index.js'
  },
  vue: {
    minVersion: '3.0.0', // Composition API
    features: ['composables', 'components', 'plugin', 'events'],
    adapter: './vue/index.js'
  },
  angular: {
    minVersion: '12.0.0', // Ivy renderer
    features: ['services', 'directives', 'components', 'observables'],
    adapter: './angular/index.ts'
  }
};

/**
 * Check if current framework version is compatible
 */
export function checkCompatibility(framework, version) {
  const compat = FRAMEWORK_COMPATIBILITY[framework];
  if (!compat) return false;
  
  // Simple version comparison (for production, use a proper semver library)
  const [major, minor, patch] = version.split('.').map(Number);
  const [minMajor, minMinor, minPatch] = compat.minVersion.split('.').map(Number);
  
  if (major > minMajor) return true;
  if (major === minMajor && minor > minMinor) return true;
  if (major === minMajor && minor === minMinor && patch >= minPatch) return true;
  
  return false;
}

/**
 * Get integration guide for framework
 */
export function getIntegrationGuide(framework) {
  const guides = {
    react: `
# React Integration

## Installation
\`\`\`bash
npm install uiflow
\`\`\`

## Setup
\`\`\`jsx
import { UIFlowProvider } from 'uiflow/adapters/react';

function App() {
  const config = {
    userId: 'user-123',
    categories: ['basic', 'advanced', 'expert']
  };

  return (
    <UIFlowProvider config={config}>
      <YourApp />
    </UIFlowProvider>
  );
}
\`\`\`

## Usage
\`\`\`jsx
import { UIFlowElement, useAreaDensity } from 'uiflow/adapters/react';

function MyComponent() {
  const { density } = useAreaDensity('editor');
  
  return (
    <UIFlowElement category="advanced" area="editor">
      <button>Advanced Feature</button>
    </UIFlowElement>
  );
}
\`\`\`
    `,
    
    vue: `
# Vue Integration

## Installation
\`\`\`bash
npm install uiflow
\`\`\`

## Setup
\`\`\`js
import { createApp } from 'vue';
import { UIFlowPlugin } from 'uiflow/adapters/vue';

const app = createApp(App);

app.use(UIFlowPlugin, {
  config: {
    userId: 'user-123',
    categories: ['basic', 'advanced', 'expert']
  }
});
\`\`\`

## Usage
\`\`\`vue
<template>
  <UIFlowElement category="advanced" area="editor">
    <button>Advanced Feature</button>
  </UIFlowElement>
</template>

<script setup>
import { useAreaDensity } from 'uiflow/adapters/vue';

const { density } = useAreaDensity('editor');
</script>
\`\`\`
    `,
    
    angular: `
# Angular Integration

## Installation
\`\`\`bash
npm install uiflow
\`\`\`

## Setup
\`\`\`typescript
import { UIFlowModule } from 'uiflow/adapters/angular';

@NgModule({
  imports: [
    UIFlowModule.forRoot({
      userId: 'user-123',
      categories: ['basic', 'advanced', 'expert']
    })
  ]
})
export class AppModule { }
\`\`\`

## Usage
\`\`\`html
<button 
  uiflowElement="advanced" 
  uiflowArea="editor"
  uiflowHelpText="Advanced feature">
  Advanced Feature
</button>

<div *uiflowIf="'expert'; uiflowIfArea: 'editor'">
  Expert content
</div>
\`\`\`
    `
  };
  
  return guides[framework] || 'Framework not supported';
}

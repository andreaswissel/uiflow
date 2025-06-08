<template>
  <div class="app">
    <!-- Header with categorized elements -->
    <header class="header">
      <h1>My Vue App</h1>
      
      <!-- Always visible basic button -->
      <UIFlowElement category="basic" area="header">
        <button>Save</button>
      </UIFlowElement>
      
      <!-- Advanced export button -->
      <UIFlowElement 
        category="advanced" 
        area="header"
        help-text="Export your data in various formats"
        :is-new="true"
      >
        <button>Export</button>
      </UIFlowElement>
      
      <!-- Expert-level batch operations -->
      <UIFlowElement 
        category="expert" 
        area="header"
        help-text="Bulk operations for power users"
      >
        <button>Batch Operations</button>
      </UIFlowElement>
      
      <!-- Density indicator -->
      <UIFlowDensityIndicator area="header" />
    </header>

    <!-- Main content area -->
    <main class="main-content">
      <h2>Editor (Density: {{ Math.round(editorDensity * 100) }}%)</h2>
      
      <!-- Basic text editing always available -->
      <UIFlowElement category="basic" area="editor">
        <textarea placeholder="Start typing..."></textarea>
      </UIFlowElement>
      
      <!-- Conditional formatting toolbar -->
      <UIFlowConditional area="editor" :min-density="0.3">
        <div class="formatting-toolbar">
          <UIFlowElement category="advanced" area="editor">
            <button>Bold</button>
          </UIFlowElement>
          
          <UIFlowElement category="advanced" area="editor">
            <button>Italic</button>
          </UIFlowElement>
          
          <UIFlowElement category="expert" area="editor">
            <button>Insert Table</button>
          </UIFlowElement>
        </div>
      </UIFlowConditional>
      
      <!-- Expert features only at high density -->
      <UIFlowConditional area="editor" :min-density="0.7">
        <AdvancedEditor />
      </UIFlowConditional>
    </main>

    <!-- Sidebar with controls -->
    <aside class="sidebar">
      <h3>Controls</h3>
      
      <UIFlowElement category="basic" area="sidebar">
        <button @click="simulateBeginner">
          Simulate Beginner Usage
        </button>
      </UIFlowElement>
      
      <UIFlowElement category="advanced" area="sidebar">
        <button @click="simulateExpert">
          Simulate Expert Usage
        </button>
      </UIFlowElement>
      
      <UIFlowElement 
        category="expert" 
        area="sidebar"
        help-text="Highlight features for user education"
      >
        <button @click="highlightFeature">
          Highlight Feature
        </button>
      </UIFlowElement>
      
      <!-- Manual density controls -->
      <UIFlowConditional area="sidebar" :min-density="0.5">
        <DensityControls />
      </UIFlowConditional>
    </aside>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { 
  createUIFlow, 
  provideUIFlow, 
  useUIFlow,
  useAreaDensity,
  useUIFlowHighlight,
  useUIFlowEvents,
  UIFlowElement,
  UIFlowConditional,
  UIFlowDensityIndicator
} from './index.js';
import AdvancedEditor from './components/AdvancedEditor.vue';
import DensityControls from './components/DensityControls.vue';

// Create and provide UIFlow instance
const config = {
  userId: 'user-123',
  categories: ['basic', 'advanced', 'expert'],
  learningRate: 0.1,
  dataSources: {
    api: { 
      endpoint: 'https://api.example.com', 
      primary: true 
    }
  }
};

const uiflowInstance = createUIFlow(config);
provideUIFlow(uiflowInstance);

// Initialize UIFlow
onMounted(() => {
  uiflowInstance.initialize();
});

// Use UIFlow composables
const { uiflow } = useUIFlow();
const { density: editorDensity } = useAreaDensity('editor');
const { flagAsNew } = useUIFlowHighlight();

// Listen to UIFlow events
useUIFlowEvents({
  'adaptation': (detail) => {
    console.log('Density adapted:', detail);
  },
  'sync-success': (detail) => {
    console.log('Synced with data sources:', detail);
  }
});

// Methods
const simulateBeginner = () => {
  if (uiflow.value) {
    const interactions = Array(20).fill({ category: 'basic' });
    uiflow.value.simulateUsage('editor', interactions, 7);
  }
};

const simulateExpert = () => {
  if (uiflow.value) {
    const interactions = [
      ...Array(5).fill({ category: 'basic' }),
      ...Array(10).fill({ category: 'advanced' }),
      ...Array(15).fill({ category: 'expert' })
    ];
    uiflow.value.simulateUsage('editor', interactions, 7);
  }
};

const highlightFeature = () => {
  const advancedButton = document.querySelector('[data-uiflow-category="advanced"]');
  if (advancedButton) {
    const elementId = advancedButton.getAttribute('data-uiflow-id');
    flagAsNew(elementId, 'Try this advanced feature!', 5000);
  }
};
</script>

<style scoped>
.app {
  display: grid;
  grid-template-areas: 
    "header header"
    "main sidebar";
  grid-template-columns: 1fr 300px;
  grid-template-rows: auto 1fr;
  height: 100vh;
  gap: 1rem;
  padding: 1rem;
}

.header {
  grid-area: header;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 8px;
}

.main-content {
  grid-area: main;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sidebar {
  grid-area: sidebar;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.formatting-toolbar {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
  padding: 0.5rem;
  background: #f3f4f6;
  border-radius: 4px;
}

textarea {
  width: 100%;
  height: 200px;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  resize: vertical;
}

button {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #2563eb;
}

h1, h2, h3 {
  margin: 0 0 1rem 0;
}
</style>

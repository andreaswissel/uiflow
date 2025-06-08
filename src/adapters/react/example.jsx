/**
 * UIFlow React Adapter - Usage Example
 */

import React from 'react';
import { 
  UIFlowProvider, 
  UIFlowElement, 
  UIFlowConditional,
  UIFlowDensityIndicator,
  useUIFlow,
  useAreaDensity,
  useUIFlowElement,
  useUIFlowHighlight,
  useUIFlowEvents
} from './index.js';

// Example App with UIFlow
function App() {
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

  return (
    <UIFlowProvider config={config}>
      <div className="app">
        <Header />
        <MainContent />
        <Sidebar />
      </div>
    </UIFlowProvider>
  );
}

// Header with basic and advanced features
function Header() {
  return (
    <header className="header">
      <h1>My App</h1>
      
      {/* Always visible basic button */}
      <UIFlowElement category="basic" area="header">
        <button>Save</button>
      </UIFlowElement>
      
      {/* Advanced export button */}
      <UIFlowElement 
        category="advanced" 
        area="header"
        helpText="Export your data in various formats"
        isNew={true}
      >
        <button>Export</button>
      </UIFlowElement>
      
      {/* Expert-level batch operations */}
      <UIFlowElement 
        category="expert" 
        area="header"
        helpText="Bulk operations for power users"
      >
        <button>Batch Operations</button>
      </UIFlowElement>
      
      {/* Density indicator */}
      <UIFlowDensityIndicator area="header" />
    </header>
  );
}

// Main content area with conditional rendering
function MainContent() {
  const { density } = useAreaDensity('editor');
  
  return (
    <main className="main-content">
      <h2>Editor (Density: {Math.round(density * 100)}%)</h2>
      
      {/* Basic text editing always available */}
      <UIFlowElement category="basic" area="editor">
        <textarea placeholder="Start typing..."></textarea>
      </UIFlowElement>
      
      {/* Conditional rendering based on density */}
      <UIFlowConditional area="editor" minDensity={0.3}>
        <div className="formatting-toolbar">
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
      
      {/* Expert features only at high density */}
      <UIFlowConditional area="editor" minDensity={0.7}>
        <AdvancedEditor />
      </UIFlowConditional>
    </main>
  );
}

// Advanced editor component
function AdvancedEditor() {
  const { elementRef, isVisible } = useUIFlowElement('expert', 'editor', {
    helpText: 'Advanced code editor with syntax highlighting'
  });
  
  if (!isVisible) return null;
  
  return (
    <div ref={elementRef} className="advanced-editor">
      <h3>Code Editor</h3>
      <textarea placeholder="// Advanced code editing..."></textarea>
    </div>
  );
}

// Sidebar with event handling
function Sidebar() {
  const { highlight, flagAsNew, showTooltip } = useUIFlowHighlight();
  const { uiflow } = useUIFlow();
  
  // Listen to UIFlow events
  useUIFlowEvents({
    'adaptation': (detail) => {
      console.log('Density adapted:', detail);
    },
    'sync-success': (detail) => {
      console.log('Synced with data sources:', detail);
    }
  });
  
  const handleSimulateBeginner = () => {
    if (uiflow) {
      // Simulate beginner usage pattern
      const interactions = Array(20).fill({ category: 'basic' });
      uiflow.simulateUsage('editor', interactions, 7);
    }
  };
  
  const handleSimulateExpert = () => {
    if (uiflow) {
      // Simulate expert usage pattern
      const interactions = [
        ...Array(5).fill({ category: 'basic' }),
        ...Array(10).fill({ category: 'advanced' }),
        ...Array(15).fill({ category: 'expert' })
      ];
      uiflow.simulateUsage('editor', interactions, 7);
    }
  };
  
  const handleHighlightFeature = () => {
    // Find an advanced feature and highlight it
    const advancedButton = document.querySelector('[data-uiflow-category="advanced"]');
    if (advancedButton) {
      const elementId = advancedButton.getAttribute('data-uiflow-id');
      flagAsNew(elementId, 'Try this advanced feature!', 5000);
    }
  };
  
  return (
    <aside className="sidebar">
      <h3>Controls</h3>
      
      <UIFlowElement category="basic" area="sidebar">
        <button onClick={handleSimulateBeginner}>
          Simulate Beginner Usage
        </button>
      </UIFlowElement>
      
      <UIFlowElement category="advanced" area="sidebar">
        <button onClick={handleSimulateExpert}>
          Simulate Expert Usage
        </button>
      </UIFlowElement>
      
      <UIFlowElement 
        category="expert" 
        area="sidebar"
        helpText="Highlight features for user education"
      >
        <button onClick={handleHighlightFeature}>
          Highlight Feature
        </button>
      </UIFlowElement>
      
      {/* Manual density controls */}
      <UIFlowConditional area="sidebar" minDensity={0.5}>
        <DensityControls />
      </UIFlowConditional>
    </aside>
  );
}

// Manual density controls component
function DensityControls() {
  const { density, setDensityLevel } = useAreaDensity('editor');
  
  return (
    <div className="density-controls">
      <h4>Manual Density Control</h4>
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={density}
        onChange={(e) => setDensityLevel(parseFloat(e.target.value))}
      />
      <span>{Math.round(density * 100)}%</span>
    </div>
  );
}

export default App;

// Example of custom hook for feature discovery
export function useFeatureDiscovery(area = 'default') {
  const { uiflow } = useUIFlow();
  const { highlight, flagAsNew } = useUIFlowHighlight();
  
  const discoverNewFeatures = React.useCallback(() => {
    if (!uiflow) return;
    
    // Find elements that just became visible
    const elements = document.querySelectorAll(`[data-uiflow-area="${area}"][data-uiflow-visible="true"]`);
    
    elements.forEach(element => {
      const category = element.getAttribute('data-uiflow-category');
      const elementId = element.getAttribute('data-uiflow-id');
      const helpText = element.getAttribute('data-uiflow-help');
      
      if (category !== 'basic' && helpText) {
        flagAsNew(elementId, helpText, 8000);
      }
    });
  }, [uiflow, area, flagAsNew]);
  
  return { discoverNewFeatures };
}

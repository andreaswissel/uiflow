# Text Editor Example

A comprehensive example of implementing UIFlow in a text editor application.

## Overview

This example demonstrates how to create an adaptive text editor that progressively reveals features based on user expertise:

- **Beginner**: Basic text editing, save/load
- **Intermediate**: Formatting toolbar, find/replace  
- **Expert**: Advanced formatting, plugins, custom shortcuts

## HTML Structure

```html
<!DOCTYPE html>
<html>
<head>
  <title>Adaptive Text Editor</title>
  <link rel="stylesheet" href="editor.css">
</head>
<body>
  <div class="editor-app">
    <!-- Header with file operations -->
    <header class="header">
      <div class="file-operations" data-uiflow-area="file-ops">
        <!-- Basic file operations -->
        <button id="new-btn" class="btn">New</button>
        <button id="open-btn" class="btn">Open</button>
        <button id="save-btn" class="btn">Save</button>
        
        <!-- Advanced file operations -->
        <button id="save-as-btn" class="btn">Save As</button>
        <button id="export-btn" class="btn">Export</button>
        
        <!-- Expert file operations -->
        <button id="batch-ops-btn" class="btn">Batch Operations</button>
      </div>
      
      <!-- Progress indicator -->
      <div class="progress-indicator" id="progress-display"></div>
    </header>

    <!-- Main editing area -->
    <main class="main-content">
      <!-- Basic text editing -->
      <div class="editor-container" data-uiflow-area="editor">
        <textarea id="text-editor" placeholder="Start typing..."></textarea>
        
        <!-- Formatting toolbar -->
        <div id="formatting-toolbar" class="formatting-toolbar">
          <!-- Basic formatting -->
          <button id="bold-btn" class="format-btn">B</button>
          <button id="italic-btn" class="format-btn">I</button>
          <button id="underline-btn" class="format-btn">U</button>
          
          <!-- Advanced formatting -->
          <select id="font-family" class="format-select">
            <option>Arial</option>
            <option>Times</option>
            <option>Courier</option>
          </select>
          
          <select id="font-size" class="format-select">
            <option>12px</option>
            <option>14px</option>
            <option>16px</option>
            <option>18px</option>
          </select>
          
          <!-- Expert formatting -->
          <button id="styles-btn" class="format-btn">Styles</button>
          <button id="themes-btn" class="format-btn">Themes</button>
        </div>
        
        <!-- Advanced features panel -->
        <div id="advanced-panel" class="advanced-panel">
          <div class="feature-group">
            <h3>Find & Replace</h3>
            <input id="find-input" placeholder="Find...">
            <input id="replace-input" placeholder="Replace...">
            <button id="replace-btn">Replace All</button>
          </div>
          
          <div class="feature-group">
            <h3>Statistics</h3>
            <div id="word-count">Words: 0</div>
            <div id="char-count">Characters: 0</div>
          </div>
        </div>
        
        <!-- Expert features panel -->
        <div id="expert-panel" class="expert-panel">
          <div class="feature-group">
            <h3>Plugins</h3>
            <button id="grammar-check-btn">Grammar Check</button>
            <button id="markdown-preview-btn">Markdown Preview</button>
            <button id="code-highlight-btn">Code Highlighting</button>
          </div>
          
          <div class="feature-group">
            <h3>Automation</h3>
            <button id="macros-btn">Macros</button>
            <button id="auto-save-btn">Auto-save</button>
            <button id="templates-btn">Templates</button>
          </div>
        </div>
      </div>
    </main>

    <!-- Sidebar with tools -->
    <aside class="sidebar" data-uiflow-area="tools">
      <!-- Basic tools -->
      <div class="tool-group">
        <h3>Document</h3>
        <button id="undo-btn" class="tool-btn">Undo</button>
        <button id="redo-btn" class="tool-btn">Redo</button>
      </div>
      
      <!-- Advanced tools -->
      <div class="tool-group">
        <h3>Navigation</h3>
        <button id="outline-btn" class="tool-btn">Outline</button>
        <button id="bookmarks-btn" class="tool-btn">Bookmarks</button>
      </div>
      
      <!-- Expert tools -->
      <div class="tool-group">
        <h3>Development</h3>
        <button id="api-docs-btn" class="tool-btn">API Docs</button>
        <button id="custom-css-btn" class="tool-btn">Custom CSS</button>
      </div>
      
      <!-- Settings -->
      <div class="tool-group">
        <h3>Settings</h3>
        <div id="manual-density-control"></div>
      </div>
    </aside>
  </div>

  <script src="https://unpkg.com/uiflow@latest/dist/uiflow.min.js"></script>
  <script src="editor.js"></script>
</body>
</html>
```

## JavaScript Implementation

```javascript
// editor.js
class AdaptiveTextEditor {
  constructor() {
    this.uiflow = null;
    this.currentDocument = '';
    this.undoStack = [];
    this.redoStack = [];
    
    this.initializeUIFlow();
    this.setupEventListeners();
    this.setupFeatureTracking();
  }

  async initializeUIFlow() {
    this.uiflow = new UIFlow({
      userId: this.getUserId(),
      categories: ['basic', 'advanced', 'expert'],
      learningRate: 0.15, // Slightly faster learning for editors
      timeAcceleration: 1,
      dataSources: {
        api: {
          endpoint: '/api/uiflow',
          primary: true
        }
      }
    });

    await this.uiflow.init();
    this.categorizeElements();
    this.setupProgressDisplay();
  }

  categorizeElements() {
    // File operations
    this.categorizeFileOperations();
    
    // Editor features
    this.categorizeEditorFeatures();
    
    // Sidebar tools
    this.categorizeSidebarTools();
  }

  categorizeFileOperations() {
    const area = 'file-ops';
    
    // Basic file operations - always visible
    this.uiflow.categorize(
      document.getElementById('new-btn'), 
      'basic', 
      area
    );
    this.uiflow.categorize(
      document.getElementById('open-btn'), 
      'basic', 
      area
    );
    this.uiflow.categorize(
      document.getElementById('save-btn'), 
      'basic', 
      area
    );

    // Advanced file operations
    this.uiflow.categorize(
      document.getElementById('save-as-btn'), 
      'advanced', 
      area,
      { helpText: 'Save document with a new name or format' }
    );
    this.uiflow.categorize(
      document.getElementById('export-btn'), 
      'advanced', 
      area,
      { helpText: 'Export to PDF, HTML, or other formats' }
    );

    // Expert file operations
    this.uiflow.categorize(
      document.getElementById('batch-ops-btn'), 
      'expert', 
      area,
      { helpText: 'Process multiple files simultaneously' }
    );
  }

  categorizeEditorFeatures() {
    const area = 'editor';
    
    // Basic text editor - always visible
    this.uiflow.categorize(
      document.getElementById('text-editor'), 
      'basic', 
      area
    );

    // Basic formatting
    this.uiflow.categorize(
      document.getElementById('bold-btn'), 
      'basic', 
      area
    );
    this.uiflow.categorize(
      document.getElementById('italic-btn'), 
      'basic', 
      area
    );
    this.uiflow.categorize(
      document.getElementById('underline-btn'), 
      'basic', 
      area
    );

    // Advanced formatting
    this.uiflow.categorize(
      document.getElementById('font-family'), 
      'advanced', 
      area,
      { helpText: 'Choose from different font families' }
    );
    this.uiflow.categorize(
      document.getElementById('font-size'), 
      'advanced', 
      area,
      { helpText: 'Adjust text size' }
    );

    // Advanced features panel
    this.uiflow.categorize(
      document.getElementById('advanced-panel'), 
      'advanced', 
      area,
      { helpText: 'Find & replace, document statistics' }
    );

    // Expert formatting
    this.uiflow.categorize(
      document.getElementById('styles-btn'), 
      'expert', 
      area,
      { helpText: 'Custom paragraph and character styles' }
    );
    this.uiflow.categorize(
      document.getElementById('themes-btn'), 
      'expert', 
      area,
      { helpText: 'Switch between editor themes' }
    );

    // Expert features panel
    this.uiflow.categorize(
      document.getElementById('expert-panel'), 
      'expert', 
      area,
      { helpText: 'Plugins, macros, and automation tools' }
    );
  }

  categorizeSidebarTools() {
    const area = 'tools';
    
    // Basic tools
    this.uiflow.categorize(
      document.getElementById('undo-btn'), 
      'basic', 
      area
    );
    this.uiflow.categorize(
      document.getElementById('redo-btn'), 
      'basic', 
      area
    );

    // Advanced tools
    this.uiflow.categorize(
      document.getElementById('outline-btn'), 
      'advanced', 
      area,
      { helpText: 'Navigate document structure' }
    );
    this.uiflow.categorize(
      document.getElementById('bookmarks-btn'), 
      'advanced', 
      area,
      { helpText: 'Save and jump to specific locations' }
    );

    // Expert tools
    this.uiflow.categorize(
      document.getElementById('api-docs-btn'), 
      'expert', 
      area,
      { helpText: 'API documentation for custom extensions' }
    );
    this.uiflow.categorize(
      document.getElementById('custom-css-btn'), 
      'expert', 
      area,
      { helpText: 'Customize editor appearance with CSS' }
    );
  }

  setupProgressDisplay() {
    const progressDisplay = document.getElementById('progress-display');
    
    const updateDisplay = () => {
      const areas = ['editor', 'file-ops', 'tools'];
      const stats = areas.map(area => this.uiflow.getAreaStats(area));
      
      progressDisplay.innerHTML = `
        ${stats.map((stat, index) => `
          <div class="progress-item">
            <span>${areas[index]}: ${stat.visibleElements}/${stat.totalElements} features</span>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${(stat.visibleElements/stat.totalElements)*100}%"></div>
            </div>
          </div>
        `).join('')}
      `;
    };

    // Update on changes
    document.addEventListener('uiflow:density-changed', updateDisplay);
    document.addEventListener('uiflow:adaptation', updateDisplay);
    document.addEventListener('uiflow:override-applied', updateDisplay);
    document.addEventListener('uiflow:override-cleared', updateDisplay);
    
    // Initial update
    updateDisplay();
    
    // Manual density control
    this.setupManualDensityControl();
  }

  setupManualDensityControl() {
    const container = document.getElementById('manual-density-control');
    
    const areas = ['editor', 'file-ops', 'tools'];
    
    areas.forEach(area => {
      const control = document.createElement('div');
      control.className = 'density-control';
      control.innerHTML = `
        <label for="${area}-density">${area}:</label>
        <input 
          type="range" 
          id="${area}-density"
          min="0" 
          max="1" 
          step="0.1" 
          value="${this.uiflow.getDensityLevel(area)}"
        >
        <span class="density-value">${Math.round(this.uiflow.getDensityLevel(area) * 100)}%</span>
      `;
      
      const slider = control.querySelector('input');
      const valueSpan = control.querySelector('.density-value');
      
      slider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        this.uiflow.setDensityLevel(value, area);
        valueSpan.textContent = `${Math.round(value * 100)}%`;
      });
      
      container.appendChild(control);
    });
  }

  setupEventListeners() {
    // File operations
    this.setupFileOperations();
    
    // Editor operations
    this.setupEditorOperations();
    
    // Feature discovery
    this.setupFeatureDiscovery();
  }

  setupFileOperations() {
    // Basic operations
    document.getElementById('new-btn').addEventListener('click', () => {
      this.newDocument();
    });
    
    document.getElementById('save-btn').addEventListener('click', () => {
      this.saveDocument();
    });
    
    document.getElementById('open-btn').addEventListener('click', () => {
      this.openDocument();
    });
    
    // Advanced operations
    document.getElementById('save-as-btn').addEventListener('click', () => {
      this.saveDocumentAs();
    });
    
    document.getElementById('export-btn').addEventListener('click', () => {
      this.exportDocument();
    });
    
    // Expert operations
    document.getElementById('batch-ops-btn').addEventListener('click', () => {
      this.openBatchOperations();
    });
  }

  setupEditorOperations() {
    const textEditor = document.getElementById('text-editor');
    
    // Track typing activity
    textEditor.addEventListener('input', () => {
      this.updateWordCount();
      this.trackEditorUsage();
    });
    
    // Formatting operations
    document.getElementById('bold-btn').addEventListener('click', () => {
      this.formatText('bold');
    });
    
    document.getElementById('italic-btn').addEventListener('click', () => {
      this.formatText('italic');
    });
    
    document.getElementById('underline-btn').addEventListener('click', () => {
      this.formatText('underline');
    });
    
    // Advanced features
    document.getElementById('replace-btn').addEventListener('click', () => {
      this.replaceText();
    });
    
    // Expert features
    document.getElementById('grammar-check-btn').addEventListener('click', () => {
      this.runGrammarCheck();
    });
    
    document.getElementById('macros-btn').addEventListener('click', () => {
      this.openMacroEditor();
    });
  }

  setupFeatureDiscovery() {
    // Highlight new features when density increases
    document.addEventListener('uiflow:adaptation', (event) => {
      const { area, newDensity, oldDensity } = event.detail;
      
      // Significant increase in density - show what's new
      if (newDensity - oldDensity > 0.2) {
        setTimeout(() => this.discoverNewFeatures(area), 1000);
      }
    });
  }

  discoverNewFeatures(area) {
    const newElements = document.querySelectorAll(
      `[data-uiflow-area="${area}"][data-uiflow-visible="true"]`
    );
    
    newElements.forEach(element => {
      const category = element.getAttribute('data-uiflow-category');
      const helpText = element.getAttribute('data-uiflow-help');
      const elementId = element.getAttribute('data-uiflow-id');
      
      if (category !== 'basic' && helpText) {
        this.uiflow.flagAsNew(elementId, helpText, 8000);
      }
    });
  }

  setupFeatureTracking() {
    // Track which features users actually use
    document.addEventListener('click', (event) => {
      const element = event.target.closest('[data-uiflow-category]');
      if (!element) return;
      
      const category = element.getAttribute('data-uiflow-category');
      const area = element.getAttribute('data-uiflow-area');
      const density = this.uiflow.getDensityLevel(area);
      
      // Analytics tracking
      this.trackFeatureUsage({
        feature: element.id || 'unknown',
        category,
        area,
        density,
        timestamp: Date.now()
      });
    });
  }

  // Feature implementations
  newDocument() {
    if (this.currentDocument && !confirm('Discard current document?')) {
      return;
    }
    
    document.getElementById('text-editor').value = '';
    this.currentDocument = '';
    this.updateWordCount();
  }

  saveDocument() {
    this.currentDocument = document.getElementById('text-editor').value;
    // Simulate save
    this.showNotification('Document saved!');
  }

  saveDocumentAs() {
    const filename = prompt('Save as:', 'document.txt');
    if (filename) {
      this.saveDocument();
      this.showNotification(`Saved as ${filename}`);
    }
  }

  exportDocument() {
    const formats = ['PDF', 'HTML', 'Markdown'];
    const format = prompt(`Export format (${formats.join(', ')}):`, 'PDF');
    
    if (formats.includes(format)) {
      this.showNotification(`Exported as ${format}`);
    }
  }

  openBatchOperations() {
    this.showNotification('Batch operations panel opened');
    // In a real app, this would open a complex batch processing interface
  }

  formatText(type) {
    // Simple text formatting simulation
    const textEditor = document.getElementById('text-editor');
    const selection = textEditor.selectionStart !== textEditor.selectionEnd;
    
    if (selection) {
      this.showNotification(`Applied ${type} formatting`);
    } else {
      this.showNotification(`${type} mode activated`);
    }
  }

  replaceText() {
    const findText = document.getElementById('find-input').value;
    const replaceText = document.getElementById('replace-input').value;
    
    if (findText) {
      const textEditor = document.getElementById('text-editor');
      const content = textEditor.value;
      const replaced = content.split(findText).join(replaceText);
      textEditor.value = replaced;
      
      const count = content.split(findText).length - 1;
      this.showNotification(`Replaced ${count} instances`);
    }
  }

  runGrammarCheck() {
    this.showNotification('Grammar check completed - 3 suggestions');
  }

  openMacroEditor() {
    this.showNotification('Macro editor opened');
  }

  updateWordCount() {
    const text = document.getElementById('text-editor').value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    
    document.getElementById('word-count').textContent = `Words: ${words}`;
    document.getElementById('char-count').textContent = `Characters: ${chars}`;
  }

  trackEditorUsage() {
    // Throttled usage tracking
    if (!this.trackingTimeout) {
      this.trackingTimeout = setTimeout(() => {
        if (this.uiflow) {
          // Track as basic usage for typing
          this.recordUsage('basic', 'editor');
        }
        this.trackingTimeout = null;
      }, 1000);
    }
  }

  recordUsage(category, area) {
    // This would normally be handled automatically by UIFlow
    // but we can also manually record specific interactions
    const element = document.getElementById('text-editor');
    if (element && this.uiflow) {
      this.uiflow.recordInteraction(element);
    }
  }

  trackFeatureUsage(data) {
    // Send to analytics
    console.log('Feature usage:', data);
    
    // In a real app, you'd send this to your analytics service
    // analytics.track('editor_feature_usage', data);
  }

  showNotification(message) {
    // Simple notification system
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      z-index: 1000;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  getUserId() {
    // Get or generate user ID
    let userId = localStorage.getItem('editor-user-id');
    if (!userId) {
      userId = 'user-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('editor-user-id', userId);
    }
    return userId;
  }
}

// Initialize the editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AdaptiveTextEditor();
});
```

## CSS Styles

```css
/* editor.css */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f5f5f5;
}

.editor-app {
  display: grid;
  grid-template-areas: 
    "header header"
    "main sidebar";
  grid-template-columns: 1fr 250px;
  grid-template-rows: auto 1fr;
  height: 100vh;
  gap: 1px;
}

/* Header */
.header {
  grid-area: header;
  background: white;
  padding: 1rem;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-operations {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn {
  padding: 0.5rem 1rem;
  background: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.btn:hover {
  background: #005a9e;
}

.btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Density indicator */
.density-indicator {
  display: flex;
  gap: 1rem;
  font-size: 12px;
  color: #666;
}

.density-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.override {
  background: #ff9500;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
}

/* Main content */
.main-content {
  grid-area: main;
  background: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

#text-editor {
  flex: 1;
  padding: 1rem;
  border: none;
  outline: none;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  font-family: 'Monaco', 'Consolas', monospace;
}

/* Formatting toolbar */
.formatting-toolbar {
  padding: 0.5rem;
  background: #f8f8f8;
  border-top: 1px solid #ddd;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  transition: all 0.3s ease;
}

.format-btn {
  padding: 0.25rem 0.5rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 3px;
  cursor: pointer;
  font-weight: bold;
  min-width: 30px;
}

.format-btn:hover {
  background: #e8e8e8;
}

.format-select {
  padding: 0.25rem;
  border: 1px solid #ddd;
  border-radius: 3px;
  background: white;
}

/* Advanced and expert panels */
.advanced-panel,
.expert-panel {
  padding: 1rem;
  background: #fafafa;
  border-top: 1px solid #ddd;
  transition: all 0.3s ease;
}

.feature-group {
  margin-bottom: 1rem;
}

.feature-group h3 {
  margin-bottom: 0.5rem;
  font-size: 14px;
  color: #333;
}

.feature-group input {
  padding: 0.25rem;
  border: 1px solid #ddd;
  border-radius: 3px;
  margin-right: 0.5rem;
  width: 120px;
}

/* Sidebar */
.sidebar {
  grid-area: sidebar;
  background: white;
  padding: 1rem;
  border-left: 1px solid #ddd;
  overflow-y: auto;
}

.tool-group {
  margin-bottom: 1.5rem;
}

.tool-group h3 {
  margin-bottom: 0.5rem;
  font-size: 14px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.25rem;
}

.tool-btn {
  display: block;
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 0.25rem;
  background: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 3px;
  cursor: pointer;
  text-align: left;
  font-size: 13px;
  transition: all 0.3s ease;
}

.tool-btn:hover {
  background: #e8e8e8;
}

/* Manual density controls */
.density-control {
  margin-bottom: 0.5rem;
}

.density-control label {
  display: block;
  font-size: 12px;
  margin-bottom: 0.25rem;
  text-transform: capitalize;
}

.density-control input[type="range"] {
  width: 100%;
  margin-bottom: 0.25rem;
}

.density-value {
  font-size: 11px;
  color: #666;
}

/* UIFlow element transitions */
[data-uiflow-category] {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

[data-uiflow-visible="false"] {
  opacity: 0;
  transform: scale(0.95);
  pointer-events: none;
}

[data-uiflow-visible="true"] {
  opacity: 1;
  transform: scale(1);
}

/* Responsive adjustments based on density */
[data-uiflow-area][data-density="high"] .formatting-toolbar {
  padding: 0.25rem;
  gap: 0.25rem;
}

[data-uiflow-area][data-density="high"] .btn {
  padding: 0.25rem 0.5rem;
  font-size: 12px;
}

/* Notification */
.notification {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .editor-app {
    grid-template-areas: 
      "header"
      "main"
      "sidebar";
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }
  
  .sidebar {
    max-height: 200px;
    overflow-y: auto;
  }
  
  .file-operations {
    flex-wrap: wrap;
  }
  
  .density-indicator {
    display: none;
  }
}
```

## Usage Patterns

This editor demonstrates several key UIFlow patterns:

### 1. Progressive Disclosure
- Basic: Essential editing and file operations
- Advanced: Formatting, find/replace, statistics  
- Expert: Plugins, macros, customization

### 2. Area-Specific Adaptation
- **Editor area**: Text editing and formatting features
- **File-ops area**: File management operations
- **Tools area**: Navigation and utility functions

### 3. User Education
- Help text for advanced features
- Automatic highlighting of new features
- Progressive feature discovery

### 4. Manual Override
- Density sliders for each area
- Visual indicators for admin overrides
- Immediate feedback on changes

## Customization

You can adapt this example by:

1. **Adding more categories**: Introduce domain-specific feature levels
2. **Custom areas**: Create specialized tool areas
3. **Different learning rates**: Adjust adaptation speed per area
4. **Analytics integration**: Track real usage patterns
5. **A/B testing**: Test different categorization strategies

This example provides a solid foundation for implementing adaptive interfaces in text editors, IDEs, or any content creation tool.

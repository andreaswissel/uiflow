import { UIFlow } from '../src/index.ts';
import type { UserType, AreaStats } from '../src/types.ts';
import './mock-api.js';
import './mock-segment.js';

// Initialize UIFlow with demo-optimized settings
const uiflow = new UIFlow({
  categories: ['basic', 'advanced', 'expert']
});

// Enable demo mode for optimal responsiveness
uiflow.setDemoMode(true);

// Track interactions for demo purposes
let interactions: Array<{action: string; category: string; timestamp: number}> = [];

// ✅ DRY utility functions for event handlers
function addClickHandler(id: string, handler: () => void): void {
  document.getElementById(id)?.addEventListener('click', handler);
}

function getElement(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function updateSliderValue(sliderId: string, valueId: string, value: number): void {
  const slider = getElement(sliderId) as HTMLInputElement;
  const valueDisplay = getElement(valueId);
  
  if (slider) slider.value = value.toString();
  if (valueDisplay) valueDisplay.textContent = `${value}%`;
}

// Initialize and setup the demo
async function initializeDemo() {
  // Initialize the UIFlow instance
  await uiflow.init();
  
  // Categorize elements after initialization
  setupElementCategorization();
  
  // Setup demo functionality
  setupEventListeners();
  setupFrameworkTabs();
  
  // Initialize stats display
  updateStats();
  
  // Add welcome message about framework adapters
  console.log(`
🎯 UIFlow Framework Adapters Demo

This demo showcases UIFlow's native adapters for:
- ⚛️  React (hooks, context, components)
- 🟢 Vue (composables, plugins, reactivity)
- 🔴 Angular (services, directives, observables)
- 📦 Vanilla JS (core library)

Click the tabs above to see different implementation approaches!
`);

  // Track demo initialization
  trackEvent('demo_initialized', {
    framework: 'vanilla',
    uiflow_version: '0.1.0',
    features_enabled: ['adapters', 'user_education', 'data_sources', 'admin_controls']
  });
}

function setupElementCategorization() {
  // Categorize elements by area with help text
  document.querySelectorAll('#editor-section .ui-element').forEach(element => {
    const category = element.classList.contains('basic') ? 'basic' :
                     element.classList.contains('advanced') ? 'advanced' : 'expert';
    const action = element.getAttribute('data-action');
    
    const helpTexts = {
      'bold': 'Make text bold for emphasis',
      'italic': 'Make text italic for styling',
      'underline': 'Underline important text',
      'font-size': 'Change the size of your text',
      'text-color': 'Change text color for better presentation',
      'alignment': 'Align text left, center, or right',
      'styles': 'Apply custom CSS styles to elements',
      'macros': 'Create automated text snippets and commands',
      'plugins': 'Manage and install editor extensions'
    };
    
    uiflow.categorize(element, category, 'editor', {
      helpText: helpTexts[action],
      isNew: category === 'expert' // Mark expert features as new
    });
  });

  document.querySelectorAll('#dashboard-section .ui-element').forEach(element => {
    const category = element.classList.contains('basic') ? 'basic' :
                     element.classList.contains('advanced') ? 'advanced' : 'expert';
    const action = element.getAttribute('data-action');
    
    const helpTexts = {
      'overview': 'Get a quick summary of your data',
      'charts': 'View data in visual chart format',
      'filters': 'Filter data by specific criteria',
      'exports': 'Download data in various formats',
      'compare': 'Compare data across different time periods',
      'sql': 'Write custom SQL queries for advanced analysis',
      'api': 'Access data programmatically via REST API',
      'automation': 'Set up automated reports and alerts'
    };
    
    uiflow.categorize(element, category, 'dashboard', {
      helpText: helpTexts[action],
      isNew: category === 'expert' // Mark expert features as new
    });
  });
}

// Framework tab switching functionality
function setupFrameworkTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const frameworkContents = document.querySelectorAll('.framework-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const framework = button.getAttribute('data-framework');
      
      // Update active tab
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update active content
      frameworkContents.forEach(content => {
        content.classList.remove('active');
        if (content.getAttribute('data-framework') === framework) {
          content.classList.add('active');
        }
      });
      
      // Track framework selection
      trackEvent('framework_selected', { framework });
    });
  });
}

// Event tracking function
function trackEvent(eventName, properties = {}) {
  console.log(`📊 Event: ${eventName}`, properties);
  
  // In a real app, you'd send this to your analytics service
  if (window.analytics && window.analytics.track) {
    window.analytics.track(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
      source: 'uiflow-demo'
    });
  }
}

function setupEventListeners() {
  // Manual density control - now per area
const editorSlider = document.getElementById('editor-density-slider');
const dashboardSlider = document.getElementById('dashboard-density-slider');

editorSlider.addEventListener('input', (e) => {
  const density = e.target.value / 100;
  uiflow.setDensityLevel(density, 'editor');
  document.getElementById('editor-density-value').textContent = e.target.value + '%';
});

dashboardSlider.addEventListener('input', (e) => {
  const density = e.target.value / 100;
  uiflow.setDensityLevel(density, 'dashboard');
  document.getElementById('dashboard-density-value').textContent = e.target.value + '%';
});

// ✅ Use DRY utilities for event handlers  
addClickHandler('reset-btn', () => {
  // Reset but preserve unlocked categories so users don't lose progress
  uiflow.resetArea('editor', true);
  uiflow.resetArea('dashboard', true);
  updateSliderValue('editor-density-slider', 'editor-density-value', 30);
  updateSliderValue('dashboard-density-slider', 'dashboard-density-value', 30);
  updateStats();
});

addClickHandler('simulate-beginner', () => simulateUserBehavior('beginner'));
addClickHandler('simulate-power-user', () => simulateUserBehavior('power-user'));

// ✅ Education Controls using DRY utilities
addClickHandler('highlight-new', () => {
  const newElements = uiflow.getNewVisibleElements();
  newElements.forEach(({ elementId, helpText }) => {
    uiflow.highlightElement(elementId, 'new-feature', {
      duration: 6000,
      tooltip: helpText || 'This is a new feature!'
    });
  });
});

addClickHandler('show-tips', () => {
  const elementsWithHelp = uiflow.getVisibleElementsWithHelp();
  elementsWithHelp.forEach(({ elementId, helpText }) => {
    uiflow.showTooltip(elementId, helpText, { duration: 4000 });
  });
});

addClickHandler('clear-highlights', () => uiflow.clearAllHighlights());
addClickHandler('feature-tour', () => startFeatureTour());

function startFeatureTour() {
  // ✅ Use encapsulated getter instead of accessing private property
  const visibleElements = uiflow.getVisibleElementsSorted();

  if (visibleElements.length === 0) {
    alert('No elements with help text are currently visible. Try increasing density first!');
    return;
  }

  let currentIndex = 0;
  
  function showNextTip() {
    // Clear previous highlight
    if (currentIndex > 0) {
      uiflow.removeHighlight(visibleElements[currentIndex - 1].elementId);
    }
    
    if (currentIndex >= visibleElements.length) {
      alert('Tour complete! 🎉');
      return;
    }
    
    const { elementId, helpText } = visibleElements[currentIndex];
    const isLast = currentIndex === visibleElements.length - 1;
    
    uiflow.highlightElement(elementId, 'default', {
      tooltip: `${helpText} ${isLast ? '(Click to finish tour)' : '(Click to continue tour)'}`,
      persistent: true,
      onDismiss: () => {
        currentIndex++;
        setTimeout(showNextTip, 500);
      }
    });
  }
  
  showNextTip();
}

// Data Source Controls
document.getElementById('enable-api').addEventListener('change', async (e) => {
  if (e.target.checked) {
    // Re-initialize with API and Segment data sources
    await uiflow.init({
      userId: 'demo-user-123',
      syncInterval: 10000, // 10 seconds for demo
      dataSources: {
        api: {
          endpoint: 'https://api.demo.com',
          primary: true // API is primary for reading data
        },
        segment: {
          writeKey: 'demo-segment-key',
          trackingPlan: 'uiflow-demo',
          useUserProperties: true,
          primary: false // Segment is for tracking only
        }
      }
    });
  } else {
    uiflow.destroy();
    await uiflow.init({
      userId: null,
      dataSources: {}
    });
  }
});

document.getElementById('force-sync').addEventListener('click', async () => {
  if (uiflow.dataManager.getSourceNames().length > 0) {
    await uiflow.forceSync();
  } else {
    alert('Enable data sources first!');
  }
});

document.getElementById('admin-panel-btn').addEventListener('click', () => {
  const panel = document.getElementById('admin-panel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('segment-events-btn').addEventListener('click', () => {
  const events = window.mockSegment.getUIFlowEvents();
  const userTraits = window.mockSegment.getUserTraits();
  
  const message = `
📊 Segment Events (UIFlow):
${events.length === 0 ? 'No events yet. Enable data sources and interact with elements!' : 
  events.slice(-5).map(e => `• ${e.event || e.type}: ${JSON.stringify(e.properties || e.traits)}`).join('\n')}

👤 User Traits:
${Object.keys(userTraits).length === 0 ? 'No traits set yet.' :
  Object.entries(userTraits).map(([k, v]) => `• ${k}: ${JSON.stringify(v)}`).join('\n')}
  `.trim();
  
  alert(message);
});

// Admin controls
document.getElementById('admin-editor-enable').addEventListener('change', (e) => {
  const slider = document.getElementById('admin-editor-slider');
  slider.disabled = !e.target.checked;
  
  if (e.target.checked) {
    const density = slider.value / 100;
    window.mockServer.setAdminOverride('demo-user-123', 'editor', density);
    uiflow.setRemoteOverride('editor', density);
  } else {
    window.mockServer.clearAdminOverride('demo-user-123', 'editor');
    uiflow.clearRemoteOverride('editor');
  }
});

document.getElementById('admin-dashboard-enable').addEventListener('change', (e) => {
  const slider = document.getElementById('admin-dashboard-slider');
  slider.disabled = !e.target.checked;
  
  if (e.target.checked) {
    const density = slider.value / 100;
    window.mockServer.setAdminOverride('demo-user-123', 'dashboard', density);
    uiflow.setRemoteOverride('dashboard', density);
  } else {
    window.mockServer.clearAdminOverride('demo-user-123', 'dashboard');
    uiflow.clearRemoteOverride('dashboard');
  }
});

document.getElementById('admin-editor-slider').addEventListener('input', (e) => {
  const density = e.target.value / 100;
  document.getElementById('admin-editor-value').textContent = e.target.value + '%';
  
  if (!e.target.disabled) {
    window.mockServer.setAdminOverride('demo-user-123', 'editor', density);
    uiflow.setRemoteOverride('editor', density);
  }
});

document.getElementById('admin-dashboard-slider').addEventListener('input', (e) => {
  const density = e.target.value / 100;
  document.getElementById('admin-dashboard-value').textContent = e.target.value + '%';
  
  if (!e.target.disabled) {
    window.mockServer.setAdminOverride('demo-user-123', 'dashboard', density);
    uiflow.setRemoteOverride('dashboard', density);
  }
});

// Listen to UIFlow events
document.addEventListener('uiflow:density-changed', (e) => {
  const { area, density } = e.detail;
  if (area === 'editor') {
    editorSlider.value = Math.round(density * 100);
    document.getElementById('editor-density-value').textContent = Math.round(density * 100) + '%';
  } else if (area === 'dashboard') {
    dashboardSlider.value = Math.round(density * 100);
    document.getElementById('dashboard-density-value').textContent = Math.round(density * 100) + '%';
  }
  updateStats();
});

document.addEventListener('uiflow:initialized', (e) => {
  const areas = e.detail.areas;
  const editorDensity = Math.round((areas.editor || 0.3) * 100);
  const dashboardDensity = Math.round((areas.dashboard || 0.3) * 100);
  
  editorSlider.value = editorDensity;
  dashboardSlider.value = dashboardDensity;
  document.getElementById('editor-density-value').textContent = editorDensity + '%';
  document.getElementById('dashboard-density-value').textContent = dashboardDensity + '%';
  updateStats();
});

document.addEventListener('uiflow:adaptation', (e) => {
  const { area, oldDensity, newDensity, advancedRatio, totalInteractions } = e.detail;
  console.log(`${area} adapted: ${Math.round(oldDensity * 100)}% → ${Math.round(newDensity * 100)}% (advanced ratio: ${Math.round(advancedRatio * 100)}%, total recent: ${totalInteractions})`);
  
  // Debug recent usage breakdown
  const usage = uiflow.getRecentUsageByArea(area);
  console.log(`  Recent usage - Basic: ${usage.basic}, Advanced: ${usage.advanced}, Expert: ${usage.expert}`);
  updateStats();
});

// API sync events
document.addEventListener('uiflow:sync-success', (e) => {
  console.log('✅ Sync successful:', e.detail);
  updateStats();
});

document.addEventListener('uiflow:sync-error', (e) => {
  console.warn('❌ Sync failed:', e.detail.error);
});

document.addEventListener('uiflow:override-applied', (e) => {
  console.log(`🔒 Override applied: ${e.detail.area} → ${Math.round(e.detail.density * 100)}%`);
  updateStats();
});

document.addEventListener('uiflow:override-cleared', (e) => {
  console.log(`🔓 Override cleared: ${e.detail.area}`);
  updateStats();
});

// Highlight events
document.addEventListener('uiflow:highlight-added', (e) => {
  console.log(`✨ Highlight added: ${e.detail.elementId} (${e.detail.style})`);
});

document.addEventListener('uiflow:highlight-removed', (e) => {
  console.log(`💫 Highlight removed: ${e.detail.elementId}`);
});

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('ui-element')) {
    const action = e.target.getAttribute('data-action');
    const category = e.target.classList.contains('basic') ? 'basic' :
                     e.target.classList.contains('advanced') ? 'advanced' : 'expert';
    
    interactions.push({
      action,
      category,
      timestamp: Date.now()
    });
    
    // Keep only last 20 interactions for demo
    if (interactions.length > 20) {
      interactions = interactions.slice(-20);
    }
    
    setTimeout(updateStats, 100); // Small delay to let UIFlow process
  }
});
}

function simulateUserBehavior(userType: UserType): void {
  // ✅ Use the new convenience API - no more manual interaction arrays!
  uiflow.simulateUserType(userType, ['editor', 'dashboard']);
  
  // For power users, unlock advanced/expert features immediately
  if (userType === 'power-user' || userType === 'expert') {
    setTimeout(() => {
      // Unlock advanced features in both areas
      uiflow.unlockCategory('advanced', 'editor');
      uiflow.unlockCategory('advanced', 'dashboard');
      
      // For experts, also unlock expert features
      if (userType === 'expert') {
        uiflow.unlockCategory('expert', 'editor');
        uiflow.unlockCategory('expert', 'dashboard');
      }
      updateStats();
    }, 100);
  }
  
  console.log(`📊 After simulation - Unlocked categories in both areas`);
  
  // Flag newly revealed expert features after power user simulation
  if (userType === 'power-user') {
    setTimeout(() => {
      // ✅ Use encapsulated getter for expert elements
      const newElements = uiflow.getNewVisibleElements();
      newElements.forEach(({ elementId, helpText }) => {
        uiflow.flagAsNew(elementId, helpText, 10000);
      });
    }, 1000);
  }
  
  updateStats();
  
  // Add more detailed console logging
  console.log('📈 Current usage patterns:', {
    editor: uiflow.getRecentUsageByArea('editor'),
    dashboard: uiflow.getRecentUsageByArea('dashboard')
  });
}

function updateStats(): void {
  const statsContent = document.getElementById('stats-content');
  if (!statsContent) return;
  
  // ✅ Use the new enhanced stats API
  const editorStats: AreaStats = uiflow.getAreaStats('editor');
  const dashboardStats: AreaStats = uiflow.getAreaStats('dashboard');
  
  // Check for overrides
  const editorOverride = uiflow.hasOverride('editor');
  const dashboardOverride = uiflow.hasOverride('dashboard');
  
  statsContent.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div>
        <h4>📝 Editor Area${editorOverride ? '<span class="override-indicator">OVERRIDE</span>' : ''}</h4>
        <p><strong>Density:</strong> ${Math.round(editorStats.density * 100)}%</p>
        <p><strong>Visible:</strong> ${editorStats.visibleElements}/${editorStats.totalElements} elements</p>
        <p><strong>Recent Usage:</strong></p>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Basic: ${editorStats.recentUsage.basic}</li>
          <li>Advanced: ${editorStats.recentUsage.advanced}</li>
          <li>Expert: ${editorStats.recentUsage.expert}</li>
        </ul>
      </div>
      <div>
        <h4>📊 Dashboard Area${dashboardOverride ? '<span class="override-indicator">OVERRIDE</span>' : ''}</h4>
        <p><strong>Density:</strong> ${Math.round(dashboardStats.density * 100)}%</p>
        <p><strong>Visible:</strong> ${dashboardStats.visibleElements}/${dashboardStats.totalElements} elements</p>
        <p><strong>Recent Usage:</strong></p>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Basic: ${dashboardStats.recentUsage.basic}</li>
          <li>Advanced: ${dashboardStats.recentUsage.advanced}</li>
          <li>Expert: ${dashboardStats.recentUsage.expert}</li>
        </ul>
      </div>
    </div>
    <p style="margin-top: 15px;"><em>💡 Try the simulation buttons, API sync, or admin overrides!</em></p>
  `;
}

// Start the demo
initializeDemo();

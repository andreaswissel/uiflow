import UIFlow from '../src/index.js';
import './mock-api.js';
import './mock-segment.js';

// Initialize UIFlow with faster learning for demo
const uiflow = UIFlow.init({
  learningRate: 0.3,
  timeAcceleration: 10, // 10x faster for demo
  adaptationThreshold: 2, // Lower threshold for demo
  categories: ['basic', 'advanced', 'expert']
});

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

// Reset button
document.getElementById('reset-btn').addEventListener('click', () => {
  localStorage.removeItem('uiflow-data');
  uiflow.setDensityLevel(0.3, 'editor');
  uiflow.setDensityLevel(0.3, 'dashboard');
  editorSlider.value = 30;
  dashboardSlider.value = 30;
  document.getElementById('editor-density-value').textContent = '30%';
  document.getElementById('dashboard-density-value').textContent = '30%';
  updateStats();
});

// Simulation buttons
document.getElementById('simulate-beginner').addEventListener('click', () => {
  simulateUserBehavior('beginner');
});

document.getElementById('simulate-power-user').addEventListener('click', () => {
  simulateUserBehavior('power-user');
});

// Education Controls
document.getElementById('highlight-new').addEventListener('click', () => {
  // Highlight all new features that are currently visible
  for (const [elementId, data] of uiflow.elements) {
    if (data.isNew && data.visible) {
      uiflow.highlightElement(elementId, 'new-feature', {
        duration: 6000,
        tooltip: data.helpText || 'This is a new feature!'
      });
    }
  }
});

document.getElementById('show-tips').addEventListener('click', () => {
  // Show tooltips for all visible elements with help text
  for (const [elementId, data] of uiflow.elements) {
    if (data.visible && data.helpText) {
      uiflow.showTooltip(elementId, data.helpText, { duration: 4000 });
    }
  }
});

document.getElementById('clear-highlights').addEventListener('click', () => {
  uiflow.clearAllHighlights();
});

document.getElementById('feature-tour').addEventListener('click', () => {
  startFeatureTour();
});

function startFeatureTour() {
  const visibleElements = Array.from(uiflow.elements.entries())
    .filter(([id, data]) => data.visible && data.helpText)
    .sort(([, a], [, b]) => {
      // Sort by category: basic, advanced, expert
      const order = { basic: 0, advanced: 1, expert: 2 };
      return order[a.category] - order[b.category];
    });

  if (visibleElements.length === 0) {
    alert('No elements with help text are currently visible. Try increasing density first!');
    return;
  }

  let currentIndex = 0;
  
  function showNextTip() {
    // Clear previous highlight
    if (currentIndex > 0) {
      uiflow.removeHighlight(visibleElements[currentIndex - 1][0]);
    }
    
    if (currentIndex >= visibleElements.length) {
      alert('Tour complete! 🎉');
      return;
    }
    
    const [elementId, data] = visibleElements[currentIndex];
    const isLast = currentIndex === visibleElements.length - 1;
    
    uiflow.highlightElement(elementId, 'default', {
      tooltip: `${data.helpText} ${isLast ? '(Click to finish tour)' : '(Click to continue tour)'}`,
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
  const { area, oldDensity, newDensity, advancedRatio } = e.detail;
  console.log(`${area} adapted: ${Math.round(oldDensity * 100)}% → ${Math.round(newDensity * 100)}% (advanced ratio: ${Math.round(advancedRatio * 100)}%)`);
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

// Track interactions for demo purposes
let interactions = [];

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

function simulateUserBehavior(userType) {
  const editorInteractions = [];
  const dashboardInteractions = [];
  
  if (userType === 'beginner') {
    // Beginner: mostly basic features
    for (let i = 0; i < 20; i++) {
      editorInteractions.push({ category: 'basic' });
      dashboardInteractions.push({ category: 'basic' });
    }
    for (let i = 0; i < 3; i++) {
      editorInteractions.push({ category: 'advanced' });
    }
  } else if (userType === 'power-user') {
    // Power user: uses advanced and expert features
    for (let i = 0; i < 10; i++) {
      editorInteractions.push({ category: 'basic' });
      dashboardInteractions.push({ category: 'basic' });
    }
    for (let i = 0; i < 15; i++) {
      editorInteractions.push({ category: 'advanced' });
      dashboardInteractions.push({ category: 'advanced' });
    }
    for (let i = 0; i < 8; i++) {
      editorInteractions.push({ category: 'expert' });
      dashboardInteractions.push({ category: 'expert' });
    }
  }
  
  // Simulate usage over 7 days
  uiflow.simulateUsage('editor', editorInteractions, 7);
  uiflow.simulateUsage('dashboard', dashboardInteractions, 7);
  
  // Flag newly revealed expert features after power user simulation
  if (userType === 'power-user') {
    setTimeout(() => {
      for (const [elementId, data] of uiflow.elements) {
        if (data.category === 'expert' && data.visible && data.isNew) {
          uiflow.flagAsNew(elementId, data.helpText, 10000);
        }
      }
    }, 1000);
  }
  
  updateStats();
}

function updateStats() {
  const statsContent = document.getElementById('stats-content');
  const recentInteractions = interactions.slice(-10);
  
  // Get area densities
  const editorDensity = uiflow.getDensityLevel('editor');
  const dashboardDensity = uiflow.getDensityLevel('dashboard');
  
  // Count visible elements per area
  const editorVisible = document.querySelectorAll('#editor-section .ui-element[data-uiflow-visible="true"]').length;
  const editorTotal = document.querySelectorAll('#editor-section .ui-element').length;
  const dashboardVisible = document.querySelectorAll('#dashboard-section .ui-element[data-uiflow-visible="true"]').length;
  const dashboardTotal = document.querySelectorAll('#dashboard-section .ui-element').length;
  
  // Get usage patterns
  const editorUsage = uiflow.getRecentUsageByArea('editor');
  const dashboardUsage = uiflow.getRecentUsageByArea('dashboard');
  
  // Check for overrides
  const editorOverride = uiflow.hasOverride('editor');
  const dashboardOverride = uiflow.hasOverride('dashboard');
  
  statsContent.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div>
        <h4>📝 Editor Area${editorOverride ? '<span class="override-indicator">OVERRIDE</span>' : ''}</h4>
        <p><strong>Density:</strong> ${Math.round(editorDensity * 100)}%</p>
        <p><strong>Visible:</strong> ${editorVisible}/${editorTotal} elements</p>
        <p><strong>Recent Usage:</strong></p>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Basic: ${editorUsage.basic}</li>
          <li>Advanced: ${editorUsage.advanced}</li>
          <li>Expert: ${editorUsage.expert}</li>
        </ul>
      </div>
      <div>
        <h4>📊 Dashboard Area${dashboardOverride ? '<span class="override-indicator">OVERRIDE</span>' : ''}</h4>
        <p><strong>Density:</strong> ${Math.round(dashboardDensity * 100)}%</p>
        <p><strong>Visible:</strong> ${dashboardVisible}/${dashboardTotal} elements</p>
        <p><strong>Recent Usage:</strong></p>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Basic: ${dashboardUsage.basic}</li>
          <li>Advanced: ${dashboardUsage.advanced}</li>
          <li>Expert: ${dashboardUsage.expert}</li>
        </ul>
      </div>
    </div>
    <p style="margin-top: 15px;"><em>💡 Try the simulation buttons, API sync, or admin overrides!</em></p>
  `;
}

// Initialize stats display
updateStats();

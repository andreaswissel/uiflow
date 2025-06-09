import { UIFlow } from '../src/index.ts';
import type { UserType } from '../src/types.ts';

// Initialize UIFlow
const uiflow = new UIFlow({
  userId: 'social-demo-user',
  categories: ['basic', 'advanced', 'expert']
});

// Demo state
let postsCreated = 0;
let mediaUploaded = 0;
let postsScheduled = 0;
let currentCharCount = 0;

// Load configuration and initialize
async function initializeSocialFlow() {
  try {
    // Load the configuration
    const configResponse = await fetch('./social-media-config.json');
    const config = await configResponse.json();
    
    await uiflow.loadConfiguration(config);
    
    // Initialize UI event listeners
    setupEventListeners();
    
    // Setup character counter
    setupCharacterCounter();
    
    // Initial UI update
    updateProgress();
    updateStats();
    updateElementVisibility(); // Set initial element visibility
    
    console.log('🚀 SocialFlow initialized with smart progressive disclosure!');
    
    // Track demo initialization
    uiflow.trackABTestMetric('demo_initialized');
    
  } catch (error) {
    console.error('Failed to initialize SocialFlow:', error);
    
    // Fallback to manual initialization
    initializeManually();
  }
}

// Fallback manual initialization
function initializeManually() {
  console.log('📋 Fallback: Manual UIFlow initialization');
  
  // Manually categorize elements
  uiflow.categorize(document.getElementById('instagram-platform')!, 'advanced', 'composer', {
    helpText: 'Share visual content on Instagram',
    dependencies: [
      { type: 'usage_count', elementId: 'publish-now', threshold: 2 }
    ]
  });
  
  uiflow.categorize(document.getElementById('media-widget')!, 'advanced', 'media', {
    helpText: 'Add photos and videos to make your posts more engaging',
    dependencies: [
      { type: 'usage_count', elementId: 'publish-now', threshold: 2 }
    ]
  });
  
  uiflow.categorize(document.getElementById('schedule-widget')!, 'expert', 'scheduling', {
    helpText: 'Schedule your posts for optimal engagement times',
    dependencies: [
      { type: 'usage_count', elementId: 'publish-now', threshold: 3 }
    ]
  });
  
  setupEventListeners();
  updateProgress();
  updateStats();
  updateElementVisibility(); // Set initial element visibility
}

// Setup all event listeners
function setupEventListeners() {
  // UIFlow events
  document.addEventListener('uiflow:element-unlocked', handleElementUnlocked);
  document.addEventListener('uiflow:journey-analyzed', handleJourneyAnalyzed);
  document.addEventListener('uiflow:rule-triggered', handleRuleTriggered);
  document.addEventListener('uiflow:tutorial-requested', handleTutorialRequested);
  document.addEventListener('uiflow:adaptation', handleUIAdaptation);
  
  // Platform selector
  document.querySelectorAll('.platform-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      selectPlatform(target.dataset.platform!);
    });
  });
  
  // Post textarea
  const textarea = document.getElementById('post-content') as HTMLTextAreaElement;
  textarea.addEventListener('input', updateCharacterCount);
  textarea.addEventListener('input', trackTypingBehavior);
}

// Character counter setup
function setupCharacterCounter() {
  const textarea = document.getElementById('post-content') as HTMLTextAreaElement;
  const charCount = document.getElementById('char-count')!;
  
  textarea.addEventListener('input', () => {
    const length = textarea.value.length;
    const maxLength = parseInt(textarea.getAttribute('maxlength') || '280');
    charCount.textContent = `${length} / ${maxLength}`;
    
    // Update color based on character usage
    if (length > maxLength * 0.9) {
      charCount.style.color = '#e53e3e';
    } else if (length > maxLength * 0.7) {
      charCount.style.color = '#d69e2e';
    } else {
      charCount.style.color = '#718096';
    }
  });
}

// Track typing behavior for user journey analysis
function trackTypingBehavior() {
  const textarea = document.getElementById('post-content') as HTMLTextAreaElement;
  currentCharCount = textarea.value.length;
  
  // Track content creation engagement
  if (currentCharCount > 50) {
    uiflow.trackABTestMetric('engaged_writing');
  }
}

// Platform selection
function selectPlatform(platform: string) {
  document.querySelectorAll('.platform-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const selectedBtn = document.querySelector(`[data-platform="${platform}"]`) as HTMLElement;
  selectedBtn?.classList.add('active');
  
  // Update character limit based on platform
  const textarea = document.getElementById('post-content') as HTMLTextAreaElement;
  const limits = {
    twitter: 280,
    linkedin: 3000,
    facebook: 2000,
    instagram: 2200
  };
  
  textarea.setAttribute('maxlength', limits[platform as keyof typeof limits].toString());
  updateCharacterCount();
  
  // Track platform usage
  uiflow.trackABTestMetric('platform_selected');
}

// Update character count display
function updateCharacterCount() {
  const textarea = document.getElementById('post-content') as HTMLTextAreaElement;
  const charCount = document.getElementById('char-count')!;
  const length = textarea.value.length;
  const maxLength = parseInt(textarea.getAttribute('maxlength') || '280');
  
  charCount.textContent = `${length} / ${maxLength}`;
}

// Demo Actions
(window as any).publishPost = function() {
  const textarea = document.getElementById('post-content') as HTMLTextAreaElement;
  const content = textarea.value.trim();
  
  if (!content) {
    alert('Please write something before publishing!');
    return;
  }
  
  postsCreated++;
  console.log(`📤 Post ${postsCreated} published: "${content.substring(0, 50)}..."`);
  
  // Track the interaction for UIFlow
  uiflow.recordInteraction('publish-now', 'basic', 'composer');
  
  // Clear the textarea
  textarea.value = '';
  updateCharacterCount();
  
  // Update UI
  updateProgress();
  updateStats();
  updateElementVisibility(); // Update element visibility after interaction
  
  // Track metrics
  uiflow.trackABTestMetric('posts_created');
  
  // Show success feedback
  showNotification(`🎉 Post ${postsCreated} published successfully!`, 'success');
  
  // Check for milestones
  checkMilestones();
};

(window as any).saveDraft = function() {
  const textarea = document.getElementById('post-content') as HTMLTextAreaElement;
  const content = textarea.value.trim();
  
  if (!content) {
    alert('Nothing to save!');
    return;
  }
  
  console.log('💾 Draft saved');
  uiflow.trackABTestMetric('drafts_saved');
  showNotification('💾 Draft saved successfully!', 'info');
};

(window as any).uploadMedia = function() {
  if (!uiflow.validateDependencies('media-widget')) {
    showNotification('📸 Create 2 posts first to unlock media uploads!', 'warning');
    return;
  }
  
  mediaUploaded++;
  console.log('📸 Media uploaded');
  
  // Record the interaction for UIFlow
  uiflow.recordInteraction('media-widget', 'advanced', 'media');
  
  // Add mock media preview
  const preview = document.getElementById('media-preview')!;
  const mediaItem = document.createElement('div');
  mediaItem.className = 'media-item';
  mediaItem.textContent = `Image ${mediaUploaded}`;
  preview.appendChild(mediaItem);
  
  uiflow.trackABTestMetric('media_uploaded');
  updateElementVisibility(); // Update visibility after interaction
  showNotification('📸 Media uploaded successfully!', 'success');
};

(window as any).schedulePost = function() {
  const dateInput = document.getElementById('schedule-date') as HTMLInputElement;
  const timeInput = document.getElementById('schedule-time') as HTMLInputElement;
  
  if (!dateInput.value || !timeInput.value) {
    alert('Please select both date and time!');
    return;
  }
  
  postsScheduled++;
  console.log(`⏰ Post scheduled for ${dateInput.value} at ${timeInput.value}`);
  
  // Record the interaction for UIFlow
  uiflow.recordInteraction('schedule-widget', 'expert', 'scheduling');
  
  uiflow.trackABTestMetric('posts_scheduled');
  updateStats();
  updateElementVisibility(); // Update visibility after interaction
  showNotification('⏰ Post scheduled successfully!', 'success');
};

(window as any).addHashtag = function(hashtag: string) {
  const textarea = document.getElementById('post-content') as HTMLTextAreaElement;
  textarea.value += ` ${hashtag}`;
  updateCharacterCount();
  
  uiflow.trackABTestMetric('hashtags_used');
};

(window as any).generateHashtags = function() {
  const mockHashtags = ['#AI', '#automation', '#productivity', '#socialmedia', '#marketing'];
  const randomHashtags = mockHashtags.sort(() => 0.5 - Math.random()).slice(0, 3);
  
  const textarea = document.getElementById('post-content') as HTMLTextAreaElement;
  textarea.value += ` ${randomHashtags.join(' ')}`;
  updateCharacterCount();
  
  uiflow.trackABTestMetric('ai_hashtags_generated');
  showNotification('🤖 AI hashtags generated!', 'success');
};

(window as any).enhanceText = function() {
  const textarea = document.getElementById('post-content') as HTMLTextAreaElement;
  if (!textarea.value.trim()) {
    alert('Write some text first!');
    return;
  }
  
  // Mock text enhancement
  textarea.value = textarea.value + ' ✨ (Enhanced with AI)';
  updateCharacterCount();
  
  uiflow.trackABTestMetric('text_enhanced');
  showNotification('✨ Text enhanced with AI!', 'success');
};

(window as any).checkGrammar = function() {
  uiflow.trackABTestMetric('grammar_checked');
  showNotification('📝 Grammar looks good!', 'success');
};

(window as any).viewDetailedAnalytics = function() {
  uiflow.trackABTestMetric('analytics_viewed');
  showNotification('📊 Opening detailed analytics...', 'info');
};

// Demo simulation functions
(window as any).simulateUser = function(userType: UserType | 'content-creator' | 'social-manager') {
  console.log(`🎭 Simulating ${userType} behavior...`);
  
  // Map demo user types to UIFlow types
  const mappedType: UserType = userType === 'content-creator' ? 'intermediate' : 
                               userType === 'social-manager' ? 'expert' : 'beginner';
  
  // Update demo state based on simulation
  if (userType === 'content-creator') {
    postsCreated = 8;
    mediaUploaded = 3;
    postsScheduled = 2;
    
    // Simulate interactions for content creator
    for (let i = 0; i < 8; i++) {
      uiflow.recordInteraction('publish-now', 'basic', 'composer');
    }
    for (let i = 0; i < 3; i++) {
      uiflow.recordInteraction('media-widget', 'advanced', 'media');
    }
    for (let i = 0; i < 2; i++) {
      uiflow.recordInteraction('schedule-widget', 'expert', 'scheduling');
    }
  } else if (userType === 'social-manager') {
    postsCreated = 20;
    mediaUploaded = 12;
    postsScheduled = 15;
    
    // Simulate interactions for social manager  
    for (let i = 0; i < 20; i++) {
      uiflow.recordInteraction('publish-now', 'basic', 'composer');
    }
    for (let i = 0; i < 12; i++) {
      uiflow.recordInteraction('media-widget', 'advanced', 'media');
    }
    for (let i = 0; i < 15; i++) {
      uiflow.recordInteraction('schedule-widget', 'expert', 'scheduling');
    }
    for (let i = 0; i < 5; i++) {
      uiflow.recordInteraction('hashtag-widget', 'advanced', 'tools');
    }
  } else {
    postsCreated = 1;
    mediaUploaded = 0;
    postsScheduled = 0;
    
    // Simulate minimal interactions for beginner
    uiflow.recordInteraction('publish-now', 'basic', 'composer');
  }
  
  // Use UIFlow's user simulation for density adaptation
  uiflow.simulateUserType(mappedType, ['composer', 'media', 'scheduling', 'tools', 'analytics']);
  
  updateProgress();
  updateStats();
  updateElementVisibility(); // Ensure UI updates immediately
  
  showNotification(`🎭 Simulated ${userType} behavior - watch the UI adapt!`, 'info');
};

(window as any).resetProgress = function() {
  postsCreated = 0;
  mediaUploaded = 0;
  postsScheduled = 0;
  
  // Reset UIFlow
  uiflow.resetArea('composer');
  uiflow.resetArea('media');
  uiflow.resetArea('scheduling');
  uiflow.resetArea('tools');
  uiflow.resetArea('analytics');
  
  // Clear UI
  document.getElementById('media-preview')!.innerHTML = '';
  (document.getElementById('post-content') as HTMLTextAreaElement).value = '';
  updateCharacterCount();
  
  updateProgress();
  updateStats();
  updateElementVisibility(); // Reset element visibility
  
  showNotification('🔄 Progress reset - start your journey again!', 'info');
};

(window as any).showStats = function() {
  const results = uiflow.getABTestResults();
  const stats = uiflow.getOverviewStats();
  
  console.log('📊 UIFlow Statistics:', {
    abTestResults: results,
    areaStats: stats,
    demoStats: {
      postsCreated,
      mediaUploaded,
      postsScheduled
    }
  });
  
  showNotification('📊 Check console for detailed statistics!', 'info');
};

// Update progress bar
function updateProgress() {
  const totalActions = postsCreated + mediaUploaded + postsScheduled;
  const maxActions = 20; // Total actions for 100% progress
  const progressPercentage = Math.min((totalActions / maxActions) * 100, 100);
  
  const progressFill = document.getElementById('progress-fill')!;
  progressFill.style.width = `${progressPercentage}%`;
}

// Update statistics display
function updateStats() {
  document.getElementById('posts-count')!.textContent = postsCreated.toString();
  document.getElementById('engagement-rate')!.textContent = `${Math.min(postsCreated * 2.3, 100).toFixed(1)}%`;
  document.getElementById('reach-count')!.textContent = `${postsCreated * 150}`;
  document.getElementById('best-time')!.textContent = postsCreated > 5 ? '9-11 AM' : '--';
}

// Check for milestones
function checkMilestones() {
  if (postsCreated === 1) {
    showNotification('🎉 First post created! Hashtag suggestions unlocked!', 'success');
  } else if (postsCreated === 2) {
    showNotification('📸 Media uploads now available!', 'success');
  } else if (postsCreated === 3) {
    showNotification('⏰ Scheduling feature unlocked!', 'success');
  } else if (postsCreated === 5) {
    showNotification('📊 Analytics dashboard unlocked!', 'success');
  }
}

// UIFlow event handlers
function handleElementUnlocked(event: CustomEvent) {
  const { elementId, category, area } = event.detail;
  console.log(`🔓 Element unlocked: ${elementId} (${category} in ${area})`);
  
  // Update UI to show unlocked state
  const element = document.getElementById(elementId);
  if (element) {
    const badge = element.querySelector('.feature-badge');
    if (badge) {
      badge.textContent = 'UNLOCKED';
      badge.classList.remove('locked');
    }
    
    // Hide unlock hints
    const hint = element.querySelector('.unlock-hint') as HTMLElement;
    if (hint) {
      hint.style.display = 'none';
    }
  }
  
  showNotification(`🔓 New feature unlocked: ${elementId.replace('-', ' ')}!`, 'success');
}

function handleJourneyAnalyzed(event: CustomEvent) {
  const { area, behavior, interactionRate } = event.detail;
  console.log(`🧭 Journey analyzed: ${behavior} behavior in ${area} (${interactionRate.toFixed(1)} interactions/min)`);
  
  // Provide contextual tips based on behavior
  if (behavior === 'focused' && area === 'composer') {
    showNotification('🎯 You\'re focused! Consider scheduling posts for consistent engagement.', 'info');
  } else if (behavior === 'expert') {
    showNotification('🥷 Expert detected! Advanced features are now available.', 'success');
  }
}

function handleRuleTriggered(event: CustomEvent) {
  const { rule } = event.detail;
  console.log(`📋 Rule triggered: ${rule}`);
  
  if (rule === 'Power User Recognition') {
    showNotification('🥷 Congratulations! You\'ve achieved Social Media Ninja status!', 'success');
  }
}

function handleTutorialRequested(event: CustomEvent) {
  const { tutorial, message } = event.detail.data;
  console.log(`🎓 Tutorial requested: ${tutorial}`);
  
  if (message) {
    showNotification(message, 'info');
  }
}

function handleUIAdaptation(event: CustomEvent) {
  const { area, newDensity } = event.detail;
  console.log(`🎯 UI adapted: ${area} → ${Math.round(newDensity * 100)}%`);
  
  // Update element visibility based on new density
  updateElementVisibility();
}

// Update element visibility based on UIFlow state
function updateElementVisibility() {
  const elements = [
    { id: 'instagram-platform', category: 'advanced', area: 'composer' },
    { id: 'text-tools', category: 'advanced', area: 'composer' },
    { id: 'media-widget', category: 'advanced', area: 'media' },
    { id: 'schedule-widget', category: 'expert', area: 'scheduling' },
    { id: 'hashtag-widget', category: 'advanced', area: 'tools' },
    { id: 'analytics-widget', category: 'expert', area: 'analytics' },
    { id: 'targeting-widget', category: 'expert', area: 'tools' }
  ];

  elements.forEach(({ id, category, area }) => {
    const element = document.getElementById(id);
    if (element) {
      const shouldShow = uiflow.shouldShowElement(category, area);
      const dependencies = uiflow.validateDependencies ? uiflow.validateDependencies(id) : true;
      const isVisible = shouldShow && dependencies;
      
      // Update visibility
      if (isVisible) {
        element.classList.remove('hidden');
        element.style.display = '';
        
        // Update badge
        const badge = element.querySelector('.feature-badge');
        if (badge) {
          badge.textContent = 'UNLOCKED';
          badge.classList.remove('locked');
        }
        
        // Hide unlock hints
        const hint = element.querySelector('.unlock-hint') as HTMLElement;
        if (hint) {
          hint.style.display = 'none';
        }
      } else {
        element.classList.add('hidden');
        
        // Update badge
        const badge = element.querySelector('.feature-badge');
        if (badge) {
          badge.textContent = 'LOCKED';
          badge.classList.add('locked');
        }
        
        // Show unlock hints
        const hint = element.querySelector('.unlock-hint') as HTMLElement;
        if (hint) {
          hint.style.display = 'block';
        }
      }
    }
  });
}

// Notification system
function showNotification(message: string, type: 'success' | 'info' | 'warning' = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? '#48bb78' : type === 'warning' ? '#ed8936' : '#4299e1'};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
    to { transform: translateX(-50%) translateY(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(-50%) translateY(0); opacity: 1; }
    to { transform: translateX(-50%) translateY(-20px); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSocialFlow);
} else {
  initializeSocialFlow();
}

// Export for debugging
(window as any).uiflow = uiflow;
(window as any).demoState = {
  get postsCreated() { return postsCreated; },
  get mediaUploaded() { return mediaUploaded; },
  get postsScheduled() { return postsScheduled; }
};

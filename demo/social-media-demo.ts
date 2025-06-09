import { UIFlow } from '../src/index.ts';
import type { UserType } from '../src/types.ts';

// Initialize UIFlow
const uiflow = new UIFlow({
  userId: 'social-demo-user',
  categories: ['basic', 'advanced', 'expert']
});

// Demo state - will be initialized from UIFlow persistent data
let postsCreated = 0;
let mediaUploaded = 0;
let postsScheduled = 0;
let currentCharCount = 0;

// Sync demo state with UIFlow persistent element data
function initializeDemoStateFromUIFlow() {
  // Debug: Check localStorage first
  const stored = localStorage.getItem('uiflow-data');
  if (stored) {
    const data = JSON.parse(stored);
    console.log('💾 Found stored UIFlow data:', data);
    if (data.elements) {
      console.log('💾 Stored elements array:', data.elements);
      console.log('💾 First element sample:', data.elements[0]);
      // Show element IDs and interaction counts
      data.elements.forEach(([id, elementData]: [string, any]) => {
        console.log(`💾 Element ${id}: interactions=${elementData.interactions}, visible=${elementData.visible}`);
      });
    }
  } else {
    console.log('💾 No stored UIFlow data found in localStorage');
  }
  
  // Debug: Check what elements are registered
  console.log('🔍 UIFlow elements map size:', (uiflow as any).elements.size);
  console.log('🔍 UIFlow elements keys:', Array.from((uiflow as any).elements.keys()));
  
  // Debug: Check if storedElementData was populated
  console.log('💾 Stored element data map size:', (uiflow as any).storedElementData?.size || 'undefined');
  if ((uiflow as any).storedElementData) {
    console.log('💾 Stored element data keys:', Array.from((uiflow as any).storedElementData.keys()));
  }
  
  // Get interaction counts from UIFlow elements
  const publishElement = (uiflow as any).elements.get('publish-now');
  const mediaElement = (uiflow as any).elements.get('media-widget');  
  const scheduleElement = (uiflow as any).elements.get('schedule-widget');
  
  console.log('🔍 Found elements:', { 
    publish: !!publishElement, 
    media: !!mediaElement, 
    schedule: !!scheduleElement 
  });
  
  if (publishElement) {
    postsCreated = publishElement.interactions || 0;
    console.log('📊 Publish element interactions:', publishElement.interactions);
  }
  if (mediaElement) {
    mediaUploaded = mediaElement.interactions || 0;
    console.log('📊 Media element interactions:', mediaElement.interactions);
  }
  if (scheduleElement) {
    postsScheduled = scheduleElement.interactions || 0;
    console.log('📊 Schedule element interactions:', scheduleElement.interactions);
  }
  
  console.log('📊 Demo state initialized from UIFlow:', { postsCreated, mediaUploaded, postsScheduled });
}

// Helper function to simulate element clicks for UIFlow integration
function simulateElementClick(elementId: string) {
  // Pre-fill content for publish-now to avoid empty content alerts
  if (elementId === 'publish-now') {
    const textarea = document.getElementById('post-content') as HTMLTextAreaElement;
    if (!textarea.value.trim()) {
      const samplePosts = [
        "🚀 Excited to share my latest project! #innovation",
        "📊 Just discovered some amazing insights from our analytics data",
        "💡 Here's a quick tip for better social media engagement...",
        "🎯 Working on something special - stay tuned!",
        "✨ Another productive day building amazing things",
        "🔥 Love seeing the community grow and engage",
        "📈 Data-driven decisions are the key to success",
        "🌟 Grateful for all the support from our community"
      ];
      const randomPost = samplePosts[Math.floor(Math.random() * samplePosts.length)];
      textarea.value = randomPost;
      updateCharacterCount();
    }
  }
  
  const element = document.querySelector(`[data-uiflow-id="${elementId}"]`) as HTMLElement;
  if (element) {
    console.log(`🎯 Simulating click on element: ${elementId}`);
    
    // Directly trigger UIFlow's interaction recording for reliable simulation
    // This bypasses the event system to ensure the interaction is always recorded
    (uiflow as any).recordInteractionFromElement(element);
    
    // Also dispatch the actual UI click for any other listeners
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    element.dispatchEvent(clickEvent);
  } else {
    console.warn(`⚠️ Element with data-uiflow-id="${elementId}" not found for simulation`);
  }
}

// Load configuration and initialize
async function initializeSocialFlow() {
  try {
    // Load the configuration
    const configResponse = await fetch('./social-media-config.json');
    const config = await configResponse.json();
    
    await uiflow.loadConfiguration(config);
    
    // Wait for DOM registration to complete, then initialize demo state
    setTimeout(() => {
      initializeDemoStateFromUIFlow();
    }, 100);
    
    // Initialize UI event listeners
    setupEventListeners();
    
    // Setup character counter
    setupCharacterCounter();
    
    // Initial UI update
    updateProgress();
    updateStats();
    // UIFlow handles visibility automatically via configuration
    
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
  
  // Initialize demo state from persistent UIFlow data (delayed for element registration)
  setTimeout(() => {
    initializeDemoStateFromUIFlow();
  }, 100);
  
  setupEventListeners();
  updateProgress();
  updateStats();
  // UIFlow handles visibility automatically via configuration
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
  
  // Track the interaction for UIFlow (the click event will be handled by UIFlow's event listener)
  
  // Clear the textarea
  textarea.value = '';
  updateCharacterCount();
  
  // Update UI
  updateProgress();
  updateStats();
  // UIFlow handles visibility automatically after interactions
  
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
  
  // Record the interaction for UIFlow (the click event will be handled by UIFlow's event listener)
  
  // Add mock media preview
  const preview = document.getElementById('media-preview')!;
  const mediaItem = document.createElement('div');
  mediaItem.className = 'media-item';
  mediaItem.textContent = `Image ${mediaUploaded}`;
  preview.appendChild(mediaItem);
  
  uiflow.trackABTestMetric('media_uploaded');
  // UIFlow handles visibility automatically after interactions
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
  
  // Record the interaction for UIFlow (the click event will be handled by UIFlow's event listener)
  
  uiflow.trackABTestMetric('posts_scheduled');
  updateStats();
  // UIFlow handles visibility automatically after interactions
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
    
    // Content Creator: Focuses on basic content creation + some media
    // 1. Basic posts to unlock Instagram and text tools
    for (let i = 0; i < 4; i++) {
      simulateElementClick('publish-now');
    }
    
    // Small delay to allow dependency updates
    setTimeout(() => {
      // 2. Instagram becomes available (needs 2 posts)
      simulateElementClick('instagram-platform');
      
      // 3. Media widget becomes available (needs 2 posts)
      for (let i = 0; i < 3; i++) {
        simulateElementClick('media-widget');
      }
      
      // 4. More posts to reach text-tools threshold (needs 3)
      for (let i = 4; i < 8; i++) {
        simulateElementClick('publish-now');
      }
      
      // 5. Some hashtag usage (threshold: 1)
      simulateElementClick('hashtag-widget');
      
      // Small delay for schedule-widget dependencies  
      setTimeout(() => {
        // 6. Light scheduling usage (needs media-widget + publish-now ≥ 3)
        for (let i = 0; i < 2; i++) {
          simulateElementClick('schedule-widget');
        }
        
        // Show notification after content creator simulation is complete
        setTimeout(() => {
          showNotification(`🎭 Simulated ${userType} behavior - watch the UI adapt!`, 'info');
        }, 100);
      }, 100);
    }, 100);
  } else if (userType === 'social-manager') {
    postsCreated = 20;
    mediaUploaded = 12;
    postsScheduled = 15;
    
    // Social Manager: Heavy usage across all features + targeting
    // 1. Establish baseline posts for all dependencies
    for (let i = 0; i < 5; i++) {
      simulateElementClick('publish-now');
    }
    
    // Small delay to allow dependency updates
    setTimeout(() => {
      // 2. Instagram and basic tools become available
      simulateElementClick('instagram-platform');
      
      // 3. Heavy media usage
      for (let i = 0; i < 12; i++) {
        simulateElementClick('media-widget');
      }
      
      // 4. More posts (total 20 for expert level)
      for (let i = 5; i < 20; i++) {
        simulateElementClick('publish-now');
      }
      
      // 5. Heavy hashtag usage (satisfies targeting logical_and requirement)
      for (let i = 0; i < 8; i++) {
        simulateElementClick('hashtag-widget');
      }
      
      // Small delay for schedule-widget dependencies
      setTimeout(() => {
        // 6. Heavy scheduling usage (satisfies targeting logical_and requirement)
        for (let i = 0; i < 15; i++) {
          simulateElementClick('schedule-widget');
        }
        
        // Small delay for targeting-widget to become available
        setTimeout(() => {
          // 7. Targeting widget (needs: 5 posts in 7d + schedule + hashtag usage)
          for (let i = 0; i < 3; i++) {
            simulateElementClick('targeting-widget');
          }
          
          // 8. Analytics widget (expert level)
          for (let i = 0; i < 2; i++) {
            simulateElementClick('analytics-widget');
          }
          
          // Show notification after all simulation is complete
          setTimeout(() => {
            showNotification(`🎭 Simulated ${userType} behavior - watch the UI adapt!`, 'info');
          }, 100);
        }, 200);
      }, 100);
    }, 100);
  } else {
    postsCreated = 1;
    mediaUploaded = 0;
    postsScheduled = 0;
    
    // Simulate minimal interactions for beginner
    simulateElementClick('publish-now');
    
    // Show notification for beginner
    setTimeout(() => {
      showNotification(`🎭 Simulated ${userType} behavior - watch the UI adapt!`, 'info');
    }, 100);
  }
  
  // Use UIFlow's user simulation for dependency-based progression
  uiflow.simulateUserType(mappedType, ['composer', 'media', 'scheduling', 'tools', 'analytics']);
  
  updateProgress();
  updateStats();
  // UIFlow handles visibility automatically through configuration
  
  // Notification is now shown after simulation completes (moved to timeouts above)
};

(window as any).resetProgress = function() {
  postsCreated = 0;
  mediaUploaded = 0;
  postsScheduled = 0;
  
  // Reset UIFlow areas
  uiflow.resetArea('composer');
  uiflow.resetArea('media');
  uiflow.resetArea('scheduling');
  uiflow.resetArea('tools');
  uiflow.resetArea('analytics');
  
  // Reset element interaction counts directly for complete reset
  const elementsToReset = [
    'publish-now', 'instagram-platform', 'text-tools', 
    'media-widget', 'schedule-widget', 'hashtag-widget', 
    'targeting-widget', 'analytics-widget'
  ];
  
  elementsToReset.forEach(elementId => {
    const elementData = (uiflow as any).elements.get(elementId);
    if (elementData) {
      elementData.interactions = 0;
      elementData.lastUsed = null;
      elementData.visible = elementId === 'publish-now'; // Only publish-now should be visible initially
      (uiflow as any).updateElementVisibility(elementId);
    }
  });
  
  // Clear UI
  document.getElementById('media-preview')!.innerHTML = '';
  (document.getElementById('post-content') as HTMLTextAreaElement).value = '';
  updateCharacterCount();
  
  updateProgress();
  updateStats();
  
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
  const { area } = event.detail;
  console.log(`🎯 UI adapted: ${area} dependencies updated`);
  
  // UIFlow handles visibility automatically based on dependencies and configuration
}

// UIFlow now handles all visibility automatically through configuration
// This function is no longer needed - UIFlow manages element visibility internally

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

// Debug function to check persistence
(window as any).checkPersistence = function() {
  const stored = localStorage.getItem('uiflow-data');
  if (stored) {
    const data = JSON.parse(stored);
    console.log('💾 Stored UIFlow data:', data);
    
    if (data.elements) {
      console.log('📊 Element interactions stored:', 
        Array.from(data.elements).map(([id, data]: [string, any]) => 
          ({ id, interactions: data.interactions, visible: data.visible })
        )
      );
    }
  } else {
    console.log('💾 No stored UIFlow data found');
  }
};

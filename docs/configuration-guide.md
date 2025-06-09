# UIFlow Configuration Guide

Comprehensive guide to UIFlow's declarative JSON configuration system for scalable UX management.

## Table of Contents

- [Overview](#overview)
- [Basic Configuration](#basic-configuration)
- [Element Dependencies](#element-dependencies)
- [A/B Testing](#ab-testing)
- [Flow Rules](#flow-rules)
- [Real-World Examples](#real-world-examples)
- [Best Practices](#best-practices)

## Overview

UIFlow's configuration system allows you to define complex adaptive UX behaviors using declarative JSON, making it perfect for:
- **SaaS Applications**: Progressive feature disclosure
- **Content Management**: Workflow-based unlocking
- **E-commerce**: Skill-based seller tools
- **Social Media**: Engagement-driven features

## Basic Configuration

### Minimal Setup

```json
{
  "name": "My App Configuration",
  "version": "1.0.0", 
  "areas": {
    "toolbar": {
      "defaultDensity": 0.3,
      "elements": [
        {
          "id": "save-btn",
          "selector": "#save-btn",
          "category": "basic",
          "helpText": "Save your work"
        },
        {
          "id": "export-btn", 
          "selector": "#export-btn",
          "category": "advanced",
          "helpText": "Export to various formats"
        }
      ]
    }
  }
}
```

### Configuration Schema

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | ✅ | Configuration identifier |
| `version` | string | ✅ | Configuration version |
| `areas` | object | ✅ | UI areas definition |
| `rules` | array | ❌ | Advanced behavior rules |
| `templates` | array | ❌ | Reusable rule templates |
| `abTest` | object | ❌ | A/B testing configuration |

### Area Configuration

```json
{
  "areas": {
    "editor": {
      "defaultDensity": 0.4,
      "learningRate": 0.15,
      "elements": [...],
      "metadata": {
        "description": "Text editing interface",
        "owner": "content-team"
      }
    }
  }
}
```

## Element Dependencies

Define logical relationships between UI elements to create progressive disclosure patterns.

### Usage Count Dependencies

Unlock features after repeated use:

```json
{
  "id": "advanced-editor",
  "category": "advanced",
  "dependencies": [
    {
      "type": "usage_count",
      "elementId": "basic-editor",
      "threshold": 5,
      "description": "Use basic editor 5 times to unlock advanced features"
    }
  ]
}
```

**Use Cases:**
- Text editor: Basic formatting → Advanced styling
- Photo editor: Crop/resize → Filters and effects
- Dashboard: View reports → Create custom reports

### Sequence Dependencies

Create workflows that must be completed in order:

```json
{
  "id": "publish-scheduler",
  "category": "expert",
  "dependencies": [
    {
      "type": "sequence",
      "elements": ["create-post", "add-media", "preview-post"],
      "description": "Complete content creation workflow first"
    }
  ]
}
```

**Use Cases:**
- Social media: Create → Edit → Preview → Schedule
- E-commerce: Add product → Set pricing → Upload images → Publish
- CRM: Add contact → Qualify lead → Create opportunity → Close deal

### Time-Based Dependencies

Unlock based on consistent usage over time:

```json
{
  "id": "automation-tools",
  "category": "expert", 
  "dependencies": [
    {
      "type": "time_based",
      "elementId": "manual-actions",
      "timeWindow": "7d",
      "minUsage": 10,
      "description": "Use manual tools 10+ times in a week to unlock automation"
    }
  ]
}
```

**Use Cases:**
- Marketing tools: Manual campaigns → Automated workflows
- Analytics: Manual reports → Scheduled reports  
- Customer support: Manual tickets → Auto-routing

### Logical AND Dependencies

Require mastery of multiple features:

```json
{
  "id": "power-user-dashboard",
  "category": "expert",
  "dependencies": [
    {
      "type": "logical_and", 
      "elements": ["advanced-filters", "custom-charts", "data-exports"],
      "description": "Master all analysis tools to unlock power dashboard"
    }
  ]
}
```

**Use Cases:**
- Analytics: Multiple chart types → Executive dashboard
- Design tools: Basic shapes + colors + effects → Templates
- Project management: Tasks + time tracking + reporting → Advanced PM

## A/B Testing

Built-in experimentation framework for optimizing progressive disclosure.

### Basic A/B Test

```json
{
  "abTest": {
    "name": "Feature Unlock Speed Test",
    "description": "Test aggressive vs conservative unlock patterns",
    "variants": [
      {
        "id": "control",
        "weight": 0.5,
        "name": "Standard Progression"
      },
      {
        "id": "aggressive", 
        "weight": 0.3,
        "name": "Fast Unlock",
        "modifications": {
          "thresholdMultiplier": 0.5
        }
      },
      {
        "id": "conservative",
        "weight": 0.2, 
        "name": "Gradual Unlock",
        "modifications": {
          "thresholdMultiplier": 1.5
        }
      }
    ]
  }
}
```

### Variant-Specific Configuration

```json
{
  "areas": {
    "toolbar": {
      "elements": [
        {
          "id": "advanced-tools",
          "category": "advanced",
          "dependencies": [
            {
              "type": "usage_count",
              "elementId": "basic-tools", 
              "threshold": 5,
              "variants": {
                "aggressive": { "threshold": 2 },
                "conservative": { "threshold": 8 }
              }
            }
          ]
        }
      ]
    }
  }
}
```

### Metrics Tracking

Track success metrics automatically:

```javascript
// In your application code
uiflow.trackABTestMetric('feature_adoption');
uiflow.trackABTestMetric('user_retention_7d');
uiflow.trackABTestMetric('conversion_rate', 0.12);

// Get results
const results = uiflow.getABTestResults();
// { variant: "aggressive", metrics: { feature_adoption: 15, ... } }
```

## Flow Rules

Advanced behavioral rules that trigger based on user patterns.

### Usage Pattern Rules

```json
{
  "rules": [
    {
      "name": "Content Creator Journey",
      "description": "Unlock advanced tools for active creators",
      "trigger": {
        "type": "usage_pattern",
        "elements": ["create-post", "add-media"],
        "frequency": "daily",
        "duration": "3d",
        "threshold": 2
      },
      "action": {
        "type": "unlock_category", 
        "category": "advanced",
        "area": "content-tools"
      }
    }
  ]
}
```

### Element Interaction Rules

```json
{
  "rules": [
    {
      "name": "First Media Upload Tutorial",
      "trigger": {
        "type": "element_interaction",
        "elements": ["media-upload"],
        "firstTime": true
      },
      "action": {
        "type": "show_tutorial",
        "data": {
          "tutorial": "media-best-practices",
          "autoStart": true,
          "message": "🎉 Great! Visual content gets 2.3x more engagement!"
        }
      }
    }
  ]
}
```

### Time-Based Rules

```json
{
  "rules": [
    {
      "name": "Power User Recognition",
      "trigger": {
        "type": "time_based",
        "threshold": 30,
        "unit": "interactions" 
      },
      "action": {
        "type": "send_event",
        "data": {
          "event": "power_user_achieved",
          "badge": "Expert User 🏆"
        }
      }
    }
  ]
}
```

## Real-World Examples

### Social Media Management Platform

Complete SocialFlow configuration:

```json
{
  "name": "SocialFlow - Social Media Creator",
  "version": "1.0.0",
  "areas": {
    "composer": {
      "defaultDensity": 0.8,
      "elements": [
        {
          "id": "instagram-platform",
          "selector": "#instagram-platform", 
          "category": "advanced",
          "helpText": "Share visual content on Instagram",
          "dependencies": [
            {
              "type": "usage_count",
              "elementId": "publish-btn",
              "threshold": 2,
              "description": "Create 2 posts before accessing Instagram"
            }
          ]
        }
      ]
    },
    "media": {
      "defaultDensity": 0.3,
      "elements": [
        {
          "id": "media-upload",
          "selector": "#media-upload",
          "category": "advanced", 
          "helpText": "Add photos and videos",
          "dependencies": [
            {
              "type": "usage_count",
              "elementId": "publish-btn",
              "threshold": 2
            }
          ]
        }
      ]
    },
    "scheduling": {
      "defaultDensity": 0.2,
      "elements": [
        {
          "id": "post-scheduler",
          "selector": "#post-scheduler",
          "category": "expert",
          "helpText": "Schedule posts for optimal engagement",
          "dependencies": [
            {
              "type": "logical_and",
              "elements": ["media-upload", "publish-btn"],
              "description": "Use media uploads and create posts first"
            },
            {
              "type": "usage_count", 
              "elementId": "publish-btn",
              "threshold": 3
            }
          ]
        }
      ]
    },
    "analytics": {
      "defaultDensity": 0.1,
      "elements": [
        {
          "id": "analytics-dashboard",
          "selector": "#analytics-dashboard",
          "category": "expert",
          "helpText": "Track performance and optimize strategy",
          "dependencies": [
            {
              "type": "sequence",
              "elements": ["publish-btn", "media-upload", "post-scheduler"],
              "description": "Complete the content workflow: post → media → schedule"
            },
            {
              "type": "usage_count",
              "elementId": "post-scheduler", 
              "threshold": 3
            }
          ]
        }
      ]
    }
  },
  "rules": [
    {
      "name": "Content Creator Recognition",
      "trigger": {
        "type": "usage_pattern",
        "elements": ["publish-btn", "media-upload"],
        "frequency": "daily",
        "duration": "3d"
      },
      "action": {
        "type": "unlock_category",
        "category": "advanced",
        "area": "analytics"
      }
    }
  ],
  "abTest": {
    "name": "Progressive Disclosure Speed",
    "variants": [
      { "id": "standard", "weight": 0.6 },
      { "id": "fast", "weight": 0.4 }
    ]
  }
}
```

### E-commerce Seller Tools

Progressive seller capabilities:

```json
{
  "name": "Seller Tools Progressive Disclosure",
  "areas": {
    "product-management": {
      "elements": [
        {
          "id": "basic-listing",
          "category": "basic",
          "helpText": "Create product listings"
        },
        {
          "id": "seo-optimization", 
          "category": "advanced",
          "dependencies": [
            {
              "type": "usage_count",
              "elementId": "basic-listing",
              "threshold": 5,
              "description": "Create 5 listings to unlock SEO tools"
            }
          ]
        },
        {
          "id": "bulk-operations",
          "category": "expert",
          "dependencies": [
            {
              "type": "logical_and",
              "elements": ["basic-listing", "seo-optimization"],
              "description": "Master individual listings and SEO first"
            },
            {
              "type": "usage_count",
              "elementId": "basic-listing", 
              "threshold": 20,
              "description": "Create 20+ listings to unlock bulk tools"
            }
          ]
        }
      ]
    },
    "marketing": {
      "elements": [
        {
          "id": "promotion-creator",
          "category": "advanced",
          "dependencies": [
            {
              "type": "sequence",
              "elements": ["basic-listing", "first-sale"],
              "description": "Create listings and make first sale"
            }
          ]
        },
        {
          "id": "ad-automation",
          "category": "expert", 
          "dependencies": [
            {
              "type": "time_based",
              "elementId": "promotion-creator",
              "timeWindow": "14d",
              "minUsage": 5,
              "description": "Run 5+ promotions in 2 weeks"
            }
          ]
        }
      ]
    }
  }
}
```

## Best Practices

### 1. Start Simple

Begin with basic usage_count dependencies:

```json
{
  "dependencies": [
    {
      "type": "usage_count",
      "elementId": "basic-feature",
      "threshold": 3,
      "description": "Clear, actionable unlock requirement"
    }
  ]
}
```

### 2. Logical Progressions

Design dependencies that feel natural:

```javascript
// ✅ Good: Logical workflow
create-post → add-media → schedule-post → analytics

// ❌ Bad: Arbitrary requirements  
create-post → analytics → add-media
```

### 3. Clear Descriptions

Always include helpful descriptions:

```json
{
  "description": "Create 3 posts to understand scheduling value"
}
```

### 4. Reasonable Thresholds

Don't make users wait too long:

```javascript
// ✅ Good: Quick wins (2-5 uses)
{ "threshold": 3 }

// ❌ Bad: Frustrating delays (20+ uses)
{ "threshold": 25 }
```

### 5. A/B Testing

Test different unlock speeds:

```json
{
  "variants": [
    { "id": "standard", "weight": 0.7 },
    { "id": "aggressive", "weight": 0.3, "thresholdMultiplier": 0.5 }
  ]
}
```

### 6. Progressive Complexity

Layer dependencies for advanced features:

```json
{
  "expert-feature": {
    "dependencies": [
      { "type": "logical_and", "elements": ["basic-mastery", "advanced-usage"] },
      { "type": "time_based", "timeWindow": "7d", "minUsage": 10 }
    ]
  }
}
```

### 7. User Feedback

Provide unlock hints and progress indicators:

```json
{
  "dependencies": [
    {
      "type": "usage_count",
      "threshold": 5,
      "description": "📊 Use reports 5 times to unlock advanced analytics",
      "progressHint": "Progress: {current}/{total} reports viewed"
    }
  ]
}
```

## Configuration Validation

UIFlow automatically validates your configuration and provides helpful error messages:

```javascript
try {
  await uiflow.loadConfiguration(config);
} catch (error) {
  console.error('Configuration Error:', error.message);
  // "Element 'advanced-btn' depends on non-existent element 'missing-btn'"
  // "Circular dependency detected: a → b → c → a"
  // "Invalid dependency type 'custom_type' for element 'test-btn'"
}
```

## Next Steps

- 📖 [API Reference](./api.md) - Complete method documentation
- 🎮 [SocialFlow Demo](../demo/social-media-demo.html) - See configuration in action
- 🛠️ [Best Practices](./best-practices.md) - Advanced patterns and optimization
- 📊 [Analytics Integration](./analytics.md) - Track configuration effectiveness

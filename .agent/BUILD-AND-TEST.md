# UIFlow Build & Test Guide

## Development Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Start development server with demos
npm run dev
# Demo URLs: http://localhost:5173/ (landing), /social-media-demo.html, /technical-demo.html

# Build library for production
npm run build
# Outputs: dist/uiflow.js, dist/uiflow.min.js, dist/uiflow.esm.js

# Run test suite
npm run test

# TypeScript type checking
npm run typecheck
```

### Build Output
- **`dist/uiflow.js`** - UMD bundle for browser `<script>` tags
- **`dist/uiflow.min.js`** - Minified UMD bundle  
- **`dist/uiflow.esm.js`** - ES modules for modern bundlers
- **Types**: Built-in TypeScript definitions in all bundles

### Expected Build Warnings (Safe to Ignore)
```
(!) [plugin typescript] src/index.ts (1118:12): 
TS2678: Type '"usage_count"' is not comparable to type '"time_based" | "usage_pattern" | "element_interaction" | "custom_event"'.

(!) [plugin typescript] src/index.ts (1194:49): 
TS18048: 'trigger.threshold' is possibly 'undefined'.
```
These are from incomplete type definitions and don't affect functionality.

## Testing

### Current Test Coverage
- **21 tests passing** in test suite
- **Core functionality**: Element registration, dependency validation, user simulation
- **Framework adapters**: React, Vue, Angular integration tests
- **Configuration**: JSON loading and validation

### Manual Testing with Demos

#### SocialFlow Demo Testing Checklist
1. **Visit**: `http://localhost:5173/social-media-demo.html`
2. **Reset Progress**: Verify only basic elements visible (publish button)
3. **Simulate Content Creator**:
   - Instagram platform appears after 2 posts
   - Media widget unlocks after 2 posts  
   - Text tools unlock after 3 posts
   - Scheduling becomes available
   - Notification appears after ~300ms
4. **Simulate Social Manager**:
   - All content creator features plus:
   - Targeting widget appears (expert level)
   - Analytics widget appears (expert level)
   - Notification appears after ~500ms
5. **Check Console**: Should see interaction logs with emojis
6. **No JavaScript Errors**: Console should be clean

#### Technical Demo Testing
1. **Visit**: `http://localhost:5173/technical-demo.html`
2. **Framework Examples**: React, Vue, Angular code samples
3. **Progressive Disclosure**: Elements unlock based on dependencies
4. **A/B Testing**: Variant assignment visible
5. **Configuration**: JSON config loading works

### Unit Test Patterns

#### Testing Element Registration
```typescript
it('should register elements with correct initial visibility', () => {
  const element = document.createElement('button');
  element.id = 'test-btn';
  
  // Element with dependencies should start hidden
  uiflow.categorize(element, 'advanced', 'editor', {
    dependencies: [{ type: 'usage_count', elementId: 'basic-btn', threshold: 3 }]
  });
  
  const elementData = uiflow.elements.get('test-btn');
  expect(elementData.visible).toBe(false);
  expect(element.style.display).toBe('none');
  expect(element.classList.contains('hidden')).toBe(true);
});
```

#### Testing Dependency Validation
```typescript
it('should validate usage_count dependencies', () => {
  const basicElement = document.createElement('button');
  basicElement.id = 'basic-btn';
  uiflow.categorize(basicElement, 'basic', 'editor');
  
  // Simulate required interactions
  for (let i = 0; i < 3; i++) {
    uiflow.recordInteraction('basic-btn');
  }
  
  const dependency = {
    type: 'usage_count',
    elementId: 'basic-btn', 
    threshold: 3
  };
  
  expect(uiflow.validateUsageCount(dependency)).toBe(true);
});
```

#### Testing Time-Based Dependencies
```typescript
it('should validate time-based dependencies with element history', () => {
  const element = document.createElement('button');
  element.id = 'publish-btn';
  uiflow.categorize(element, 'basic', 'composer');
  
  // Simulate 5 interactions to meet minUsage threshold
  for (let i = 0; i < 5; i++) {
    uiflow.recordInteraction('publish-btn');
  }
  
  const dependency = {
    type: 'time_based',
    elementId: 'publish-btn',
    timeWindow: '7d',
    minUsage: 5
  };
  
  expect(uiflow.validateTimeBased(dependency)).toBe(true);
});
```

### Integration Testing

#### Full User Journey Testing
```typescript
it('should complete social manager simulation correctly', async () => {
  // Load SocialFlow configuration
  await uiflow.loadConfiguration('./demo/social-media-config.json');
  
  // Run full simulation
  window.simulateUser('social-manager');
  
  // Wait for all timeouts to complete
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // Verify expert elements are visible
  const targetingWidget = document.getElementById('targeting-widget');
  const analyticsWidget = document.getElementById('analytics-widget');
  
  expect(targetingWidget.style.display).not.toBe('none');
  expect(targetingWidget.classList.contains('hidden')).toBe(false);
  expect(analyticsWidget.style.display).not.toBe('none');
  expect(analyticsWidget.classList.contains('hidden')).toBe(false);
});
```

## Build System Details

### Rollup Configuration
- **Input**: `src/index.ts`
- **TypeScript**: Compiled with strict mode
- **Outputs**: UMD, ES modules, minified versions
- **External**: No external dependencies in bundle

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "ESNext",
    "declaration": true,
    "sourceMap": true
  }
}
```

### Package.json Scripts
```json
{
  "scripts": {
    "build": "rollup -c",
    "dev": "vite --open /demo/",
    "test": "vitest",
    "typecheck": "tsc --noEmit"
  }
}
```

## Debugging Build Issues

### Common Problems

#### 1. Vite Import Errors
```
Failed to resolve import "../src/index.ts"
```
**Solution**: Ensure Vite serves from project root, not demo directory
```json
// vite.config.js
export default {
  root: '.',  // Project root
  server: {
    open: '/demo/'  // Open demo path
  }
}
```

#### 2. TypeScript Errors in Demos
```
Cannot find module '../src/index.ts'
```
**Solution**: Use relative imports from demo files
```typescript
// demo/social-media-demo.ts
import { UIFlow } from '../src/index.ts';  // Correct
```

#### 3. CSS Class Management Issues
```
Element appears in DOM but not visible to user
```
**Debug Steps**:
1. Check `element.style.display` - should be '' (empty) when visible
2. Check `element.classList.contains('hidden')` - should be false when visible
3. Verify `updateElementVisibility()` manages both style and classes

### Performance Monitoring

#### Memory Usage
```typescript
// Check usage history growth
console.log('Memory usage:', {
  elements: uiflow.elements.size,
  usageHistory: Array.from(uiflow.usageHistory.values())
    .reduce((sum, arr) => sum + arr.length, 0),
  elementHistory: Array.from(uiflow.elementUsageHistory.values())
    .reduce((sum, arr) => sum + arr.length, 0)
});
```

#### Rule Execution Performance
```typescript
// Time rule checking
console.time('Rule execution');
uiflow.checkRuleTriggers();
console.timeEnd('Rule execution');
```

## Continuous Integration

### Pre-commit Checklist
1. **Build passes**: `npm run build` with no errors
2. **Tests pass**: `npm run test` all green
3. **TypeScript clean**: `npm run typecheck` (warnings OK, errors not OK)
4. **Demo works**: Manual test of SocialFlow simulation
5. **No console errors**: Check browser DevTools

### Release Checklist
1. **Version bump**: Update package.json version
2. **Build artifacts**: Ensure dist/ files are up to date
3. **Documentation**: Update README with new features
4. **Examples**: Verify all demo URLs work
5. **Framework compatibility**: Test React/Vue/Angular adapters

This guide ensures reliable builds and comprehensive testing for UIFlow development.

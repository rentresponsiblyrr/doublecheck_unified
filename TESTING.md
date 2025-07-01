# STR Certified Testing & Validation Guide

## Overview

This guide covers the comprehensive testing framework for STR Certified, including unit tests, integration tests, E2E tests, and migration validation.

## 🧪 Testing Stack

- **Unit Testing**: Jest + React Testing Library
- **E2E Testing**: Cypress
- **Performance Testing**: Lighthouse
- **Migration Validation**: Custom validation scripts
- **API Testing**: MSW + tRPC mocking

## 📋 Test Categories

### 1. Unit Tests

Test individual components and functions in isolation.

```bash
# Run all unit tests
npm run test:unit

# Run with coverage
npm run test

# Watch mode
npm run test:watch
```

**Coverage Goals:**
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

### 2. Integration Tests

Test API routes and database operations.

```bash
# Run integration tests
npm run test:integration
```

### 3. E2E Tests

Test complete user flows with Cypress.

```bash
# Run E2E tests (headless)
npm run test:e2e

# Open Cypress interactive mode
npm run test:e2e:open
```

### 4. Performance Tests

Test performance metrics with Lighthouse.

```bash
# Run Lighthouse tests
npm run test:lighthouse
```

**Performance Thresholds:**
- Performance: 85%
- Accessibility: 95%
- Best Practices: 90%
- SEO: 90%
- PWA: 90%

### 5. Migration Validation

Validate the migration from original projects.

```bash
# Run migration validation
npm run test:validate
```

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Set up test database**
   ```bash
   # Create test database
   createdb str_certified_test
   
   # Run migrations
   DATABASE_URL="postgresql://user:pass@localhost:5432/str_certified_test" pnpm db:migrate
   
   # Seed test data
   DATABASE_URL="postgresql://user:pass@localhost:5432/str_certified_test" pnpm db:seed
   ```

3. **Run all tests**
   ```bash
   npm run test:all
   ```

## 📱 Mobile Testing

### Viewport Testing

Cypress is configured for mobile-first testing:

```javascript
// Default viewport (iPhone X)
cy.setMobileViewport('iphone-x');

// Other devices
cy.setMobileViewport('iphone-14');
cy.setMobileViewport('pixel-5');
cy.setMobileViewport('samsung-s21');
```

### Touch Interactions

```javascript
// Swipe gestures
cy.swipeLeft('.carousel');
cy.swipeRight('.carousel');

// Touch events
cy.get('button').trigger('touchstart').trigger('touchend');
```

## 🔌 Offline Testing

### PWA Installation

```javascript
// Mock PWA install prompt
cy.mockPWAInstall();

// Check service worker
cy.waitForServiceWorker();
```

### Offline Mode

```javascript
// Simulate offline
cy.goOffline();

// Test offline functionality
cy.get('[data-testid="offline-indicator"]').should('be.visible');

// Go back online
cy.goOnline();
```

## 🔍 Migration Validation

The migration validation script checks:

1. **Database Schema**: All tables and relationships
2. **API Endpoints**: Scraper functionality preserved
3. **Authentication**: Login flows and protected routes
4. **Mobile Responsiveness**: Device compatibility
5. **PWA Features**: Manifest and service worker
6. **Data Migration**: Seed data integrity

### Running Validation

```bash
# Start dev server first
npm run dev

# In another terminal
npm run test:validate
```

### Expected Output

```
🚀 Starting STR Certified Migration Validation
==================================================

📊 Validating Database Schema...
✅ Table Organization exists
✅ Table User exists
✅ Table Property exists
✅ Relationships configured correctly

🕷️ Validating Scraper Migration...
✅ Endpoint accessible
✅ VRBO URL construction
✅ Image extraction

🔐 Validating Authentication...
✅ Login page accessible
✅ Protected routes redirect to login
✅ Login flow works

📱 Validating Mobile Responsiveness...
✅ iPhone 12 compatibility
✅ Pixel 5 compatibility
✅ iPad Pro compatibility

📋 Migration Validation Report
==================================================
Total Tests: 25
✅ Passed: 25
❌ Failed: 0
Success Rate: 100.0%
```

## 🎯 Test Data Factories

Use factories for consistent test data:

```typescript
import { TestFactory } from '@/__tests__/utils/test-factory';

const factory = new TestFactory(prisma);

// Create test organization
const org = await factory.createOrganization();

// Create test user
const user = await factory.createUser(org.id, {
  role: 'INSPECTOR',
  email: 'test@example.com'
});

// Create test property
const property = await factory.createProperty(org.id);

// Create test inspection
const inspection = await factory.createInspection(
  property.id,
  user.id,
  org.id
);

// Cleanup after tests
await factory.cleanup();
```

## 📊 Performance Optimization

### Lighthouse Recommendations

Based on testing results, implement:

1. **Image Optimization**
   - Lazy loading for inspection photos
   - WebP format conversion
   - Responsive image sizes

2. **JavaScript Bundle**
   - Code splitting by route
   - Dynamic imports for heavy components
   - Tree shaking unused code

3. **Rendering Performance**
   - Virtual scrolling for long lists
   - CSS containment
   - Reduce layout shifts

4. **Caching Strategy**
   - Service worker caching
   - API response caching
   - Static asset optimization

## 🐛 Debugging Tests

### Jest Debugging

```bash
# Run specific test file
npm test -- QuickStats.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should render"

# Debug in VS Code
# Add breakpoint and run "Jest: Debug Current Test"
```

### Cypress Debugging

```javascript
// Pause execution
cy.pause();

// Debug commands
cy.debug();

// Take screenshot
cy.screenshot('debug-state');
```

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm db:migrate
      - run: pnpm test
      - run: pnpm test:e2e
      - run: pnpm test:lighthouse
```

## ✅ Testing Checklist

Before deploying:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Lighthouse scores meet thresholds
- [ ] Migration validation passes
- [ ] No console errors in browser
- [ ] Mobile gestures work correctly
- [ ] Offline mode functions properly
- [ ] PWA installs successfully
- [ ] Performance metrics acceptable

## 🆘 Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout: `jest.setTimeout(30000)`
   - Check async operations

2. **Cypress not finding elements**
   - Add `data-testid` attributes
   - Use `.should('be.visible')` before interactions

3. **Database connection errors**
   - Ensure test database exists
   - Check DATABASE_URL in test environment

4. **Service worker issues**
   - Clear browser cache
   - Disable in development: `next-pwa` config

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Cypress Documentation](https://docs.cypress.io)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
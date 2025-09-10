# Playwright Setup Guide for AI-SDLC Framework

## 🎭 Overview

This guide helps front-end teams quickly set up and use Playwright for end-to-end testing in the AI-SDLC Framework. Playwright is already configured and ready to use!

## 📋 What's Already Set Up

### ✅ Configuration Files

- `playwright.config.js` - Main configuration with CI/CD integration
- `tests/e2e/` - Test directory structure
- `.github/workflows/playwright.yml` - CI/CD pipeline
- `tests/e2e/utils/helpers.js` - Common utilities

### ✅ Package Scripts

```bash
# Run all E2E tests
npm run e2e

# Run tests in CI mode
npm run e2e:ci

# Debug tests with browser visible
npm run e2e:debug

# Run tests with headed browser
npm run e2e:headed

# Run mobile-specific tests
npm run e2e:mobile

# Open Playwright UI for test development
npm run e2e:ui

# Install Playwright browsers
npm run e2e:install

# View test reports
npm run e2e:report

# Show trace viewer for debugging
npm run e2e:trace
```

## 🚀 Quick Start (5 minutes)

### 1. Install Browsers

```bash
npm run e2e:install
```

### 2. Run Existing Tests

```bash
npm run e2e
```

### 3. View Test Reports

```bash
npm run e2e:report
```

## 📝 Writing Your First Tests

### Basic Test Structure

```javascript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test("should perform specific action", async ({ page }) => {
    // Navigate to page
    await page.goto("/");

    // Interact with elements
    await page.click('[data-testid="button"]');

    // Make assertions
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

### Example: Testing Credit Score Feature

```javascript
import { test, expect } from "@playwright/test";

test.describe("Credit Score Display", () => {
  test("should display credit score correctly", async ({ page }) => {
    await page.goto("/");

    // Wait for React app to load
    await expect(page.locator("h1")).toContainText("AI-SDLC Framework");

    // Check if credit score component renders
    const creditScoreElement = page.locator(
      '[data-testid="credit-score-result"]'
    );
    await expect(creditScoreElement).toBeVisible();

    // Verify credit score value
    const score = await creditScoreElement.textContent();
    expect(parseInt(score)).toBeGreaterThanOrEqual(300);
    expect(parseInt(score)).toBeLessThanOrEqual(850);
  });

  test("should handle credit score updates", async ({ page }) => {
    await page.goto("/");

    // Find and interact with credit score button
    await page.click('[data-testid="credit-score-button"]');

    // Verify the score display updates
    await expect(
      page.locator('[data-testid="credit-score-display"]')
    ).toBeVisible();
  });
});
```

## 🛠️ Best Practices

### 1. Use data-testid Attributes

```html
<!-- ✅ Good -->
<button data-testid="submit-button">Submit</button>

<!-- ❌ Avoid -->
<button class="btn btn-primary">Submit</button>
<button id="submit-btn">Submit</button>
```

### 2. Wait for Conditions, Not Time

```javascript
// ✅ Good
await expect(page.locator('[data-testid="loading"]')).toBeHidden();
await expect(page.locator('[data-testid="results"]')).toBeVisible();

// ❌ Avoid
await page.waitForTimeout(3000);
```

### 3. Keep Tests Independent

```javascript
// ✅ Good - each test is standalone
test("should login user", async ({ page }) => {
  await login(page, "user@example.com", "password");
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
});

// ❌ Avoid - depends on previous test state
test("should login user", async ({ page }) => {
  // ... login logic
});

test("should access dashboard", async ({ page }) => {
  // Assumes user is already logged in
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
});
```

### 4. Use Page Object Model for Complex Features

```javascript
// tests/e2e/pages/CreditScorePage.js
export class CreditScorePage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/");
  }

  async getCreditScore() {
    return this.page.locator('[data-testid="credit-score-result"]');
  }

  async clickCreditScoreButton() {
    await this.page.click('[data-testid="credit-score-button"]');
  }
}

// In your test
import { CreditScorePage } from "../pages/CreditScorePage";

test("should display credit score", async ({ page }) => {
  const creditScorePage = new CreditScorePage(page);
  await creditScorePage.goto();

  const scoreElement = await creditScorePage.getCreditScore();
  await expect(scoreElement).toBeVisible();
});
```

## 🧪 Test Organization

### File Structure

```
tests/e2e/
├── smoke.spec.js          # Critical path tests (run first)
├── auth.spec.js           # Authentication tests
├── forms.spec.js          # Form interaction tests
├── credit-score.spec.js   # Feature-specific tests
├── utils/
│   ├── helpers.js         # Common utilities
│   └── test-data.js       # Test data constants
└── pages/                 # Page Object Models
    └── CreditScorePage.js
```

### Test Categories

- **Smoke Tests** (`@smoke`) - Critical user journeys
- **Regression Tests** (`@regression`) - Previously broken functionality
- **Integration Tests** - Multi-component interactions
- **Accessibility Tests** (`@accessibility`) - A11y compliance

### Running Specific Test Types

```bash
# Run only smoke tests
npm run e2e -- --grep "@smoke"

# Run regression tests
npm run e2e -- --grep "@regression"

# Run tests for specific file
npm run e2e -- tests/e2e/smoke.spec.js
```

## 🔧 Advanced Configuration

### Custom Browser Configuration

Edit `playwright.config.js` to add custom browsers:

```javascript
projects: [
  {
    name: "chromium",
    use: { ...devices["Desktop Chrome"] },
  },
  {
    name: "firefox",
    use: { ...devices["Desktop Firefox"] },
  },
  {
    name: "webkit",
    use: { ...devices["Desktop Safari"] },
  },
  {
    name: "mobile-chrome",
    use: { ...devices["Pixel 7"] },
  },
];
```

### Environment-Specific Configuration

```javascript
// Use different base URLs for different environments
use: {
  baseURL: process.env.PLAYWRIGHT_BASE_URL ||
           process.env.NODE_ENV === "production"
           ? "https://your-app.com"
           : "http://localhost:3000",
}
```

### Visual Regression Testing

```javascript
test("should match visual snapshot", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveScreenshot("homepage.png");
});
```

## 🚨 Troubleshooting

### Tests Fail Locally But Pass in CI

- **Issue**: Dev server not running
- **Solution**: Ensure `npm run dev` is running on port 3000
- **Check**: Verify `PLAYWRIGHT_BASE_URL` environment variable

### Tests Are Slow

- **Issue**: Too many waits or timeouts
- **Solution**: Replace `page.waitForTimeout()` with proper conditions
- **Tip**: Use `page.waitForLoadState("networkidle")` for dynamic content

### Element Not Found Errors

- **Issue**: Elements load asynchronously
- **Solution**: Add proper waits before interactions

```javascript
await expect(page.locator('[data-testid="element"]')).toBeVisible();
await page.click('[data-testid="element"]');
```

### Flaky Tests

- **Issue**: Timing-dependent failures
- **Solutions**:
  - Increase timeouts for slow operations
  - Use more specific selectors
  - Add retry logic for network-dependent actions
  - Avoid race conditions with proper waits

## 📊 Test Reporting

### HTML Reports

```bash
npm run e2e:report
```

Opens interactive HTML report showing:

- Test execution timeline
- Screenshots and videos of failures
- Step-by-step execution details

### JSON Reports

Available at `playwright-results.json` after test runs

### CI Integration

- Tests run automatically on PRs and pushes
- Reports uploaded as artifacts
- GitHub integration shows test status in PRs

## 🎯 Next Steps

### Week 1: Foundation

- [ ] Run existing smoke tests
- [ ] Add data-testid attributes to 5 key components
- [ ] Write 3 basic user journey tests
- [ ] Set up CI to run tests on PRs

### Week 2: Expansion

- [ ] Create Page Object Models for complex features
- [ ] Add mobile-responsive tests
- [ ] Implement visual regression testing
- [ ] Add accessibility testing

### Week 3: Optimization

- [ ] Set up test parallelization
- [ ] Add performance testing
- [ ] Implement test data management
- [ ] Add cross-browser testing

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Test Runner](https://playwright.dev/docs/test-runner)
- [Best Practices Guide](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

## 🔧 Quick Commands Reference

```bash
# Development
npm run e2e:ui           # Interactive test development
npm run e2e:debug        # Debug mode with browser
npm run e2e:headed       # Run with visible browser

# CI/CD
npm run e2e:ci           # CI-optimized test run
npm run e2e:install      # Install browser binaries

# Reporting
npm run e2e:report       # View HTML test report
npm run e2e:trace        # Debug with trace viewer

# Code Generation
npm run e2e:codegen      # Generate test code interactively
```

---

**Happy Testing!** 🎭✨

The AI-SDLC Framework now includes comprehensive Playwright testing capabilities. Start with the smoke tests and gradually expand your test coverage as your application grows.

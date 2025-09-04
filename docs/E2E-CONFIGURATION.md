# 🎭 E2E Testing Configuration Guide

## Overview

The AI-SDLC Framework includes enterprise-grade E2E testing with Playwright and intelligent auto-healing capabilities. Tests run automatically in CI/CD pipelines with comprehensive reporting and learning capture.

## 🚀 Quick Start

E2E tests are **enabled by default** in CI environments. No additional configuration needed for basic usage.

```bash
# Local development
npm run test:e2e

# CI environment (automatic)
# Tests run as part of Enhanced CI/CD Pipeline
```

## 🔧 Configuration Options

### Environment Variables

| Variable                | Default                               | Description                       |
| ----------------------- | ------------------------------------- | --------------------------------- |
| `ENABLE_E2E`            | `true` (in CI)                        | Enable/disable E2E test execution |
| `PLAYWRIGHT_BASE_URL`   | `http://localhost:3000`               | Target URL for tests              |
| `PLAYWRIGHT_WEB_SERVER` | `npx http-server public -p 3000 -c-1` | Development server command        |

### Repository Variables

Configure via **GitHub Settings → Actions → Variables**:

```bash
# Enable E2E in CI (override default)
gh variable set ENABLE_E2E -b "true"

# Custom test URL
gh variable set PLAYWRIGHT_BASE_URL -b "https://staging.example.com"

# Custom server command
gh variable set PLAYWRIGHT_WEB_SERVER -b "npm start"
```

## 🏗️ CI/CD Integration

The Enhanced CI/CD Pipeline automatically:

1. **Installs Playwright**: `npx playwright install --with-deps`
2. **Starts Web Server**: Lightweight HTTP server for testing
3. **Runs E2E Tests**: Cross-browser testing (Chrome, Firefox, Safari)
4. **Captures Learnings**: Auto-healing selector intelligence
5. **Uploads Artifacts**: HTML reports and test results

### Workflow Matrix

```yaml
strategy:
  matrix:
    test-type: [unit, integration, e2e]
    node-version: [20]
```

### Artifacts Generated

| Artifact                   | Retention | Description                  |
| -------------------------- | --------- | ---------------------------- |
| `playwright-report-node20` | 7 days    | HTML test report             |
| `test-results-e2e-node20`  | 30 days   | Raw test results + learnings |

## 🤖 Auto-Healing Features

### Smart Selector Fallbacks

```javascript
// Example: Credit score input with multiple fallback strategies
const healing = new CreditRepairAutoHealing(page);
await healing.enterCreditScore(750); // Automatically tries multiple selectors
```

### Learning Export

Auto-healing captures and exports selector learnings:

```json
{
  "workingFallbacks": {
    "[data-testid='credit-score']": "#credit-score"
  },
  "stats": {
    "healingSuccessRate": "85.7%"
  }
}
```

## 🎯 Domain-Specific Features

### Credit Repair Utilities

```javascript
// FCRA-compliant testing
await healing.validateFCRACompliance();
await healing.enterCreditScore(750); // Validates 300-850 range
await healing.enterSSN("123-45-6789"); // Secure formatting
```

### Test Data Generation

```javascript
// Generate realistic test scenarios
const testData = CreditRepairAutoHealing.generateTestData("fair_credit");
// Returns: { creditScore: 650, ssn: '***-**-4321', income: 50000 }
```

## 📊 Monitoring & Debugging

### View Test Results

```bash
# Check workflow status
gh run list --workflow="🚀 Enhanced CI/CD Pipeline"

# Download artifacts
gh run download <run-id> --name playwright-report-node20
```

### Local Development

```bash
# Run with visible browser
ENABLE_E2E=true npm run test:e2e

# Run auto-healing demo
npm run ai:auto-heal
```

## 🔍 Troubleshooting

### Common Issues

**Tests not running in CI**

```bash
# Ensure E2E is enabled
gh variable set ENABLE_E2E -b "true"
```

**Port conflicts**

```bash
# Use different port
gh variable set PLAYWRIGHT_BASE_URL -b "http://localhost:3001"
gh variable set PLAYWRIGHT_WEB_SERVER -b "npx http-server public -p 3001 -c-1"
```

**Missing dependencies**

```bash
# Install Playwright browsers
npx playwright install --with-deps
```

### Debug Mode

```javascript
// Enable detailed logging
const healing = new CreditRepairAutoHealing(page, { debug: true });
```

## 🎖️ Best Practices

### Test Organization

```
tests/
  e2e/
    ├── credit-score.spec.js     # Credit scoring flows
    ├── dispute-process.spec.js  # Dispute management
    ├── compliance.spec.js       # FCRA compliance
    └── dirty-heal.spec.js       # Auto-healing validation
```

### Selector Strategy

```javascript
// Prefer data-testid attributes
'[data-testid="credit-score"]';

// Fallback to semantic selectors
"#credit-score";
".credit-score-value";
'[aria-label*="credit score"]';
```

### CI/CD Optimization

- ✅ Tests run in parallel across browsers
- ✅ Non-blocking: E2E failures don't break pipeline
- ✅ Artifact retention: 7 days for reports, 30 days for data
- ✅ Smart caching: Dependencies cached between runs

## 📚 Related Documentation

- [AI-SDLC Framework Overview](../README.md)
- [Auto-Healing Architecture](./auto-healing-guide.md)
- [FCRA Compliance Testing](./compliance-testing.md)
- [Playwright Configuration](../playwright.config.js)

---

**Framework**: AI-SDLC v3.3.0 🤖✨
**Last Updated**: $(date)

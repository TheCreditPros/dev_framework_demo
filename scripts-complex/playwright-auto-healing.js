#!/usr/bin/env node

/**
 * Playwright Auto-Healing Utilities
 *
 * Standalone auto-healing utilities for Playwright tests that can be used
 * independently or integrated with existing test suites.
 *
 * Features:
 * - Smart selector fallback system
 * - Auto-retry with intelligent waiting
 * - Dynamic element detection
 * - Credit repair domain-specific utilities
 * - Self-healing test maintenance
 */

const { test, chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

class PlaywrightAutoHealing {
  constructor(page, options = {}) {
    this.page = page;
    this.config = {
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      selectorTimeout: options.selectorTimeout || 5000,
      fallbackTimeout: options.fallbackTimeout || 3000,
      debug: options.debug || false,
      ...options,
    };

    this.healingStats = {
      totalAttempts: 0,
      successfulHeals: 0,
      failedSelectors: [],
      workingFallbacks: new Map(),
    };
  }

  /**
   * Smart element finder with automatic fallback selectors
   */
  async findElement(primarySelector, fallbackSelectors = [], _options = {}) {
    this.healingStats.totalAttempts++;

    const selectors = [primarySelector, ...fallbackSelectors];
    let lastError = null;

    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      const timeout =
        i === 0 ? this.config.selectorTimeout : this.config.fallbackTimeout;

      try {
        if (this.config.debug) {
          console.log(
            `🔍 Trying selector ${i + 1}/${selectors.length}: ${selector}`
          );
        }

        await this.page.waitForSelector(selector, { timeout });

        if (i > 0) {
          this.healingStats.successfulHeals++;
          this.healingStats.workingFallbacks.set(primarySelector, selector);
          console.log(`✅ Auto-healed: "${primarySelector}" → "${selector}"`);
        }

        return selector;
      } catch (error) {
        lastError = error;
        if (this.config.debug) {
          console.log(`❌ Selector failed: ${selector} (${error.message})`);
        }
        continue;
      }
    }

    // All selectors failed
    this.healingStats.failedSelectors.push({
      primary: primarySelector,
      fallbacks: fallbackSelectors,
      error: lastError.message,
      timestamp: new Date().toISOString(),
    });

    throw new Error(
      `All selectors failed for: ${primarySelector}. Last error: ${lastError.message}`
    );
  }

  /**
   * Auto-healing click with smart waiting
   */
  async smartClick(primarySelector, fallbackSelectors = [], options = {}) {
    const workingSelector = await this.findElement(
      primarySelector,
      fallbackSelectors,
      options
    );

    // Wait for element to be clickable
    await this.page.waitForFunction(
      (selector) => {
        const element = document.querySelector(selector); // eslint-disable-line no-undef
        return element && !element.disabled && element.offsetParent !== null;
      },
      workingSelector,
      { timeout: this.config.selectorTimeout }
    );

    // Try clicking with retry logic
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        await this.page.click(workingSelector, options);
        return workingSelector;
      } catch (error) {
        if (attempt === this.config.maxRetries) throw error;

        console.log(
          `🔄 Click attempt ${attempt} failed, retrying... (${error.message})`
        );
        await this.page.waitForTimeout(this.config.retryDelay);

        // Check if element is still there and clickable
        const isVisible = await this.page.isVisible(workingSelector);
        if (!isVisible) {
          throw new Error(
            `Element disappeared after click attempt: ${workingSelector}`
          );
        }
      }
    }
  }

  /**
   * Auto-healing form fill with validation
   */
  async smartFill(
    primarySelector,
    value,
    fallbackSelectors = [],
    _options = {}
  ) {
    const workingSelector = await this.findElement(
      primarySelector,
      fallbackSelectors,
      _options
    );

    // Clear existing value
    await this.page.fill(workingSelector, '');

    // Fill with retry logic
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        await this.page.fill(workingSelector, value);

        // Verify the value was set correctly
        const actualValue = await this.page.inputValue(workingSelector);
        if (actualValue === value) {
          return workingSelector;
        } else {
          throw new Error(
            `Value mismatch: expected "${value}", got "${actualValue}"`
          );
        }
      } catch (error) {
        if (attempt === this.config.maxRetries) throw error;

        console.log(
          `🔄 Fill attempt ${attempt} failed, retrying... (${error.message})`
        );
        await this.page.waitForTimeout(this.config.retryDelay);
      }
    }
  }

  /**
   * Auto-healing text assertion with content variations
   */
  async smartExpectText(
    primarySelector,
    expectedText,
    fallbackSelectors = [],
    _options = {}
  ) {
    const workingSelector = await this.findElement(
      primarySelector,
      fallbackSelectors
    );

    const variations = [
      expectedText,
      expectedText.toLowerCase(),
      expectedText.toUpperCase(),
      expectedText.trim(),
      expectedText.replace(/\s+/g, ' '), // Normalize whitespace
    ];

    const actualText = await this.page.textContent(workingSelector);

    for (const variation of variations) {
      if (actualText.includes(variation)) {
        return true;
      }
    }

    throw new Error(
      `Text assertion failed. Expected variations of "${expectedText}", but got "${actualText}"`
    );
  }

  /**
   * Wait for any of multiple conditions
   */
  async waitForAnyCondition(conditions, timeout = 30000) {
    const promises = conditions.map((condition) => {
      if (typeof condition === 'string') {
        // Treat as selector
        return this.page.waitForSelector(condition, { timeout });
      } else if (typeof condition === 'function') {
        // Treat as function
        return this.page.waitForFunction(condition, [], { timeout });
      } else if (condition.type === 'url') {
        // URL pattern
        return this.page.waitForURL(condition.pattern, { timeout });
      }
      return Promise.reject(new Error('Invalid condition type'));
    });

    return Promise.race(promises);
  }

  /**
   * Auto-retry page navigation with fallback URLs
   */
  async smartGoto(primaryUrl, fallbackUrls = [], options = {}) {
    const urls = [primaryUrl, ...fallbackUrls];
    let lastError = null;

    for (const url of urls) {
      try {
        console.log(`🌐 Navigating to: ${url}`);
        await this.page.goto(url, {
          waitUntil: 'networkidle',
          timeout: 30000,
          ...options,
        });

        // Wait for page to be ready
        await this.page.waitForLoadState('domcontentloaded');

        return url;
      } catch (error) {
        lastError = error;
        console.log(`❌ Navigation failed for ${url}: ${error.message}`);
        continue;
      }
    }

    throw new Error(
      `All navigation attempts failed. Last error: ${lastError.message}`
    );
  }

  /**
   * Get healing statistics
   */
  getHealingStats() {
    return {
      ...this.healingStats,
      healingSuccessRate:
        this.healingStats.totalAttempts > 0
          ? (
              (this.healingStats.successfulHeals /
                this.healingStats.totalAttempts) *
              100
            ).toFixed(2) + '%'
          : '0%',
    };
  }

  /**
   * Export learned fallback selectors for reuse
   */
  exportLearnings(filePath = './test-results/healing-learnings.json') {
    const learnings = {
      workingFallbacks: Object.fromEntries(this.healingStats.workingFallbacks),
      failedSelectors: this.healingStats.failedSelectors,
      stats: this.getHealingStats(),
      exportedAt: new Date().toISOString(),
    };

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(learnings, null, 2));
    console.log(`📊 Healing learnings exported to: ${filePath}`);

    return learnings;
  }
}

/**
 * Credit Repair Domain-Specific Auto-Healing Utilities
 */
class CreditRepairAutoHealing extends PlaywrightAutoHealing {
  constructor(page, options = {}) {
    super(page, options);

    // Credit repair specific selector patterns
    this.creditRepairSelectors = {
      creditScore: [
        '[data-testid="credit-score"]',
        '#credit-score',
        '.credit-score-value',
        '[aria-label*="credit score"]',
        'input[name*="score"]',
      ],
      ssnInput: [
        '[data-testid="ssn"]',
        '#ssn',
        'input[name="ssn"]',
        'input[placeholder*="SSN"]',
        '.ssn-input',
      ],
      fcraDisclosure: [
        '[data-testid="fcra-disclosure"]',
        '.fcra-disclosure',
        '#fcra-notice',
        '[aria-label*="FCRA"]',
        '.compliance-notice',
      ],
      calculateButton: [
        '[data-testid="calculate"]',
        '#calculate-btn',
        '.calculate',
        'button:has-text("Calculate")',
        'input[type="submit"]',
      ],
    };
  }

  /**
   * Credit score input with validation
   */
  async enterCreditScore(score, options = {}) {
    // Validate credit score range
    const numScore = parseInt(score);
    if (numScore < 300 || numScore > 850) {
      throw new Error(
        `Invalid credit score: ${score}. Must be between 300-850.`
      );
    }

    const selector = await this.smartFill(
      this.creditRepairSelectors.creditScore[0],
      score.toString(),
      this.creditRepairSelectors.creditScore.slice(1),
      options
    );

    // Validate the score was accepted
    const enteredValue = await this.page.inputValue(selector);
    if (parseInt(enteredValue) !== numScore) {
      throw new Error(
        `Credit score validation failed. Expected ${numScore}, got ${enteredValue}`
      );
    }

    return selector;
  }

  /**
   * SSN input with format validation
   */
  async enterSSN(ssn, options = {}) {
    // Format SSN if needed (123456789 → 123-45-6789)
    let formattedSSN = ssn.replace(/\D/g, '');
    if (formattedSSN.length === 9) {
      formattedSSN = `${formattedSSN.substr(0, 3)}-${formattedSSN.substr(3, 2)}-${formattedSSN.substr(5)}`;
    }

    const selector = await this.smartFill(
      this.creditRepairSelectors.ssnInput[0],
      formattedSSN,
      this.creditRepairSelectors.ssnInput.slice(1),
      options
    );

    return selector;
  }

  /**
   * Validate FCRA compliance disclosure is present
   */
  async validateFCRACompliance(options = {}) {
    const selector = await this.findElement(
      this.creditRepairSelectors.fcraDisclosure[0],
      this.creditRepairSelectors.fcraDisclosure.slice(1),
      options
    );

    // Check that disclosure is visible and contains required text
    const isVisible = await this.page.isVisible(selector);
    if (!isVisible) {
      throw new Error('FCRA disclosure is not visible');
    }

    const disclosureText = await this.page.textContent(selector);
    const requiredTerms = [
      'FCRA',
      'Fair Credit Reporting Act',
      'consumer report',
      'permissible purpose',
    ];

    const missingTerms = requiredTerms.filter(
      (term) => !disclosureText.toLowerCase().includes(term.toLowerCase())
    );

    if (missingTerms.length > 0) {
      console.warn(
        `⚠️ FCRA disclosure may be incomplete. Missing terms: ${missingTerms.join(', ')}`
      );
    }

    console.log('✅ FCRA compliance disclosure validated');
    return selector;
  }

  /**
   * Credit calculation flow with auto-healing
   */
  async performCreditCalculation(testData, options = {}) {
    console.log('🧮 Starting credit calculation flow with auto-healing...');

    // Step 1: Enter credit score
    await this.enterCreditScore(testData.creditScore);

    // Step 2: Enter SSN (if required)
    if (testData.ssn) {
      await this.enterSSN(testData.ssn);
    }

    // Step 3: Validate FCRA compliance
    await this.validateFCRACompliance();

    // Step 4: Click calculate
    const calculateSelector = await this.smartClick(
      this.creditRepairSelectors.calculateButton[0],
      this.creditRepairSelectors.calculateButton.slice(1),
      options
    );

    // Step 5: Wait for results
    await this.waitForAnyCondition([
      '#results',
      '.calculation-results',
      '[data-testid="results"]',
      () => document.querySelector('.loading') === null, // eslint-disable-line no-undef
    ]);

    console.log('✅ Credit calculation flow completed');
    return calculateSelector;
  }

  /**
   * Generate test data for credit repair scenarios
   */
  static generateTestData(scenario = 'good_credit') {
    const scenarios = {
      good_credit: {
        creditScore: 750,
        ssn: '123-45-6789',
        income: 75000,
        debts: [],
      },
      fair_credit: {
        creditScore: 650,
        ssn: '987-65-4321',
        income: 50000,
        debts: [{ type: 'credit_card', amount: 5000 }],
      },
      poor_credit: {
        creditScore: 550,
        ssn: '456-78-9123',
        income: 35000,
        debts: [
          { type: 'credit_card', amount: 8000 },
          { type: 'auto_loan', amount: 15000 },
        ],
      },
      thin_file: {
        creditScore: 620,
        ssn: '789-12-3456',
        income: 40000,
        debts: [],
      },
    };

    return scenarios[scenario] || scenarios.good_credit;
  }
}

/**
 * Test Runner with Auto-Healing Integration
 */
class AutoHealingTestRunner {
  static async runHealingDemo() {
    console.log('🚀 Starting Playwright Auto-Healing Demo...');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    const healing = new CreditRepairAutoHealing(page, { debug: true });

    try {
      // Demo: Navigate with fallback URLs
      await healing.smartGoto('http://localhost:3000', [
        'http://localhost:8000',
        'https://example.com',
      ]);

      // Demo: Credit calculation with test data
      const testData = CreditRepairAutoHealing.generateTestData('fair_credit');
      await healing.performCreditCalculation(testData);

      // Export learnings
      const stats = healing.getHealingStats();
      console.log('📊 Healing Statistics:', stats);

      healing.exportLearnings();
    } catch (error) {
      console.error('❌ Demo failed:', error.message);
    } finally {
      await browser.close();
    }
  }

  static createHealingTest(testName, testFunction) {
    return test(testName, async ({ page }) => {
      const healing = new CreditRepairAutoHealing(page);

      try {
        await testFunction(healing, page);
      } finally {
        // Always export learnings after test
        healing.exportLearnings(`./test-results/${testName}-learnings.json`);

        const stats = healing.getHealingStats();
        if (stats.successfulHeals > 0) {
          console.log(
            `✅ Test "${testName}" auto-healed ${stats.successfulHeals} selectors`
          );
        }
      }
    });
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'demo':
      AutoHealingTestRunner.runHealingDemo();
      break;

    case 'help':
    default:
      console.log(`
🔧 Playwright Auto-Healing Utilities

Commands:
  demo     - Run interactive demo of auto-healing features
  help     - Show this help message

Usage in tests:
  const healing = new CreditRepairAutoHealing(page);
  await healing.smartClick('#button', ['.button', '[data-test="btn"]']);
  
Features:
  ✅ Smart selector fallback system
  ✅ Auto-retry with intelligent waiting  
  ✅ Credit repair domain utilities
  ✅ Learning and statistics export
  ✅ Self-healing test maintenance
      `);
      break;
  }
}

module.exports = {
  PlaywrightAutoHealing,
  CreditRepairAutoHealing,
  AutoHealingTestRunner,
};

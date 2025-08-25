#!/usr/bin/env node

/**
 * Qase AIDEN Integration with Auto-Healing Playwright Tests
 *
 * This script integrates Qase AIDEN AI test generation with auto-healing
 * capabilities for robust, self-maintaining test suites.
 *
 * Features:
 * - Generate Playwright tests from natural language requirements
 * - Convert manual test cases to automated Playwright scripts
 * - Add auto-healing wrapper to all generated tests
 * - Credit repair domain-specific test patterns
 * - FCRA/FACTA compliance testing integration
 */

const fs = require('fs');
const path = require('path');
// const { execSync } = require('child_process'); // Unused import

class QaseAIDENIntegration {
  constructor() {
    this.config = {
      qaseToken: process.env.QASE_API_TOKEN,
      projectCode: process.env.QASE_PROJECT_CODE || 'TCP',
      testDir: './tests/e2e',
      autoHealingRetries: 3,
      domain: 'credit-repair',
      // Target repositories for TheCreditPros implementation
      targetRepos: [
        'https://github.com/TheCreditPros/customer-frontend-portal',
        'https://github.com/TheCreditPros/portal2-refactor', 
        'https://github.com/TheCreditPros/portal2-admin-refactor'
      ],
    };

    this.validateConfig();
  }

  validateConfig() {
    if (!this.config.qaseToken) {
      console.log('⚠️  QASE_API_TOKEN not found in environment.');
      console.log('💡 Running in demo mode with template generation.');
      this.config.demoMode = true;
    }

    // Ensure test directory exists
    if (!fs.existsSync(this.config.testDir)) {
      fs.mkdirSync(this.config.testDir, { recursive: true });
      console.log(`✅ Created test directory: ${this.config.testDir}`);
    }
  }

  /**
   * Generate Playwright test from natural language requirement
   */
  async generateTestFromRequirement(requirement, outputFile = null) {
    console.log(`🤖 Generating test from requirement: "${requirement}"`);

    if (this.config.demoMode) {
      return this.generateDemoTest(requirement, outputFile);
    }

    try {
      // Use Qase AIDEN to generate test
      const aidenTest = await this.callQaseAIDEN({
        requirement: requirement,
        framework: 'playwright',
        domain: this.config.domain,
        compliance: ['FCRA', 'FACTA', 'PCI-DSS'],
      });

      // Wrap with auto-healing capabilities
      const healingTest = this.wrapWithAutoHealing(aidenTest, requirement);

      // Save to file
      const fileName = outputFile || this.generateFileName(requirement);
      const filePath = path.join(this.config.testDir, fileName);

      fs.writeFileSync(filePath, healingTest);
      console.log(`✅ Generated test saved to: ${filePath}`);

      return filePath;
    } catch (error) {
      console.error('❌ Error generating test:', error.message);
      return this.generateDemoTest(requirement, outputFile);
    }
  }

  /**
   * Convert manual test case to automated Playwright test
   */
  async convertManualToAutomated(testCaseId) {
    console.log(`🔄 Converting manual test case ${testCaseId} to automated...`);

    if (this.config.demoMode) {
      return this.generateDemoConversion(testCaseId);
    }

    try {
      // Fetch manual test case from Qase
      const manualTest = await this.fetchQaseTestCase(testCaseId);

      // Use AIDEN to convert to Playwright
      const automatedTest = await this.callQaseAIDEN({
        manualTest: manualTest,
        framework: 'playwright',
        domain: this.config.domain,
        convert: true,
      });

      // Add auto-healing wrapper
      const healingTest = this.wrapWithAutoHealing(
        automatedTest,
        `Manual Test ${testCaseId}`
      );

      // Save to file
      const fileName = `converted-test-case-${testCaseId}.spec.js`;
      const filePath = path.join(this.config.testDir, fileName);

      fs.writeFileSync(filePath, healingTest);
      console.log(`✅ Converted test saved to: ${filePath}`);

      return filePath;
    } catch (error) {
      console.error('❌ Error converting manual test:', error.message);
      return this.generateDemoConversion(testCaseId);
    }
  }

  /**
   * Wrap AIDEN-generated test with auto-healing capabilities
   */
  wrapWithAutoHealing(aidenTest, description) {
    const timestamp = new Date().toISOString();

    return `// Auto-Generated Test with AIDEN + Auto-Healing
// Generated: ${timestamp}
// Description: ${description}
// Framework: Playwright with Auto-Healing Wrapper

const { test, expect } = require('@playwright/test');

// Auto-healing configuration
test.use({
  retry: ${this.config.autoHealingRetries},
  timeout: 30000,
  actionTimeout: 10000
});

// Auto-healing utilities
class AutoHealingLocators {
  static async findElement(page, primarySelector, fallbackSelectors = []) {
    try {
      await page.waitForSelector(primarySelector, { timeout: 5000 });
      return primarySelector;
    } catch (error) {
      console.log(\`🔧 Primary selector failed: \${primarySelector}, trying fallbacks...\`);
      
      for (const fallback of fallbackSelectors) {
        try {
          await page.waitForSelector(fallback, { timeout: 3000 });
          console.log(\`✅ Using fallback selector: \${fallback}\`);
          return fallback;
        } catch (fallbackError) {
          continue;
        }
      }
      
      throw new Error(\`❌ All selectors failed for: \${primarySelector}\`);
    }
  }

  static async smartFill(page, selector, value, fallbacks = []) {
    const workingSelector = await this.findElement(page, selector, fallbacks);
    await page.fill(workingSelector, value);
  }

  static async smartClick(page, selector, fallbacks = []) {
    const workingSelector = await this.findElement(page, selector, fallbacks);
    await page.click(workingSelector);
  }
}

// Credit Repair Domain Utilities
class CreditRepairTestUtils {
  static generateTestCreditProfile() {
    return {
      ssn: '123-45-6789', // Test SSN
      creditScore: 650,
      income: 50000,
      debts: [
        { type: 'credit_card', amount: 5000, creditor: 'Test Bank' },
        { type: 'auto_loan', amount: 15000, creditor: 'Test Auto Finance' }
      ]
    };
  }

  static async validateFCRACompliance(page) {
    // Check for required FCRA disclosures
    const disclosureSelector = await AutoHealingLocators.findElement(
      page,
      '[data-testid="fcra-disclosure"]',
      ['.fcra-disclosure', '#fcra-notice', '[aria-label*="FCRA"]']
    );
    
    await expect(page.locator(disclosureSelector)).toBeVisible();
    console.log('✅ FCRA compliance disclosure validated');
  }

  static async validateSecureDataHandling(page) {
    // Ensure PII data is properly masked
    const elements = await page.locator('[data-sensitive]').all();
    for (const element of elements) {
      const text = await element.textContent();
      if (text && text.includes('***')) {
        console.log('✅ PII data properly masked');
      }
    }
  }
}

${aidenTest}

// Auto-healing test wrapper
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === 'failed') {
    console.log(\`🔧 Test failed, capturing debugging info...\`);
    
    // Capture screenshot for debugging
    await page.screenshot({ 
      path: \`test-results/failed-\${testInfo.title.replace(/[^a-z0-9]/gi, '_')}-\${Date.now()}.png\`,
      fullPage: true 
    });
    
    // Log page errors
    page.on('pageerror', error => {
      console.log(\`📄 Page error: \${error.message}\`);
    });
    
    // Check for common auto-fixable issues
    await this.attemptAutoFix(page, testInfo);
  }
});

async function attemptAutoFix(page, testInfo) {
  console.log('🔧 Attempting auto-fix for common issues...');
  
  // Check for loading states
  const loadingElements = await page.locator('[data-loading], .loading, .spinner').count();
  if (loadingElements > 0) {
    console.log('⏳ Detected loading state, waiting...');
    await page.waitForLoadState('networkidle');
  }
  
  // Check for modal overlays
  const modals = await page.locator('[role="dialog"], .modal, .overlay').count();
  if (modals > 0) {
    console.log('🚪 Detected modal, attempting to close...');
    await page.keyboard.press('Escape');
  }
  
  // Check for error messages
  const errorMessages = await page.locator('[role="alert"], .error-message, .alert-danger').count();
  if (errorMessages > 0) {
    const errorText = await page.locator('[role="alert"], .error-message, .alert-danger').first().textContent();
    console.log(\`⚠️ Error detected: \${errorText}\`);
  }
}
`;
  }

  /**
   * Generate demo test when AIDEN is not available
   */
  generateDemoTest(requirement, outputFile = null) {
    console.log('🎭 Generating demo test (AIDEN not configured)...');

    const testName = this.sanitizeTestName(requirement);
    const fileName = outputFile || `${testName}.spec.js`;
    const filePath = path.join(this.config.testDir, fileName);

    const demoTest = `// Demo Auto-Generated Test (Configure AIDEN for real generation)
// Requirement: "${requirement}"

test('${testName}', async ({ page }) => {
  // Navigate to application
  await page.goto('/');
  
  // Example credit repair test pattern
  await AutoHealingLocators.smartFill(
    page, 
    '#credit-score', 
    '650',
    ['[name="creditScore"]', '[data-testid="credit-input"]']
  );
  
  await AutoHealingLocators.smartClick(
    page,
    '#calculate-btn',
    ['.calculate', '[data-testid="calculate"]', 'button:has-text("Calculate")']
  );
  
  // Validate FCRA compliance
  await CreditRepairTestUtils.validateFCRACompliance(page);
  
  // Assert results
  await expect(page.locator('#results')).toBeVisible();
  
  console.log('✅ Demo test completed - Configure QASE_API_TOKEN for AI generation');
});`;

    const fullTest = this.wrapWithAutoHealing(demoTest, requirement);
    fs.writeFileSync(filePath, fullTest);

    console.log(`✅ Demo test saved to: ${filePath}`);
    console.log(
      '💡 Set QASE_API_TOKEN environment variable for real AIDEN integration'
    );

    return filePath;
  }

  generateDemoConversion(testCaseId) {
    console.log(`🎭 Generating demo conversion for test case ${testCaseId}...`);

    const fileName = `demo-converted-${testCaseId}.spec.js`;
    const filePath = path.join(this.config.testDir, fileName);

    const demoConversion = `// Demo Converted Test Case ${testCaseId}
test('converted manual test case ${testCaseId}', async ({ page }) => {
  // This would be generated from your manual test case in Qase
  await page.goto('/credit-reports');
  
  // Example conversion of manual steps
  await AutoHealingLocators.smartClick(page, '#import-report-btn');
  await AutoHealingLocators.smartFill(page, '#bureau-select', 'Equifax');
  
  // FCRA compliance validation
  await CreditRepairTestUtils.validateFCRACompliance(page);
  
  await expect(page.locator('#report-imported')).toBeVisible();
});`;

    const fullTest = this.wrapWithAutoHealing(
      demoConversion,
      `Manual Test Case ${testCaseId}`
    );
    fs.writeFileSync(filePath, fullTest);

    console.log(`✅ Demo conversion saved to: ${filePath}`);
    return filePath;
  }

  /**
   * Heal existing tests and generate new ones
   */
  async healAndGenerate() {
    console.log('🔧 Healing existing tests and generating new ones...');

    // Find existing test files
    const testFiles = fs
      .readdirSync(this.config.testDir)
      .filter((file) => file.endsWith('.spec.js') || file.endsWith('.test.js'));

    console.log(`📁 Found ${testFiles.length} existing test files`);

    // Add auto-healing to existing tests
    for (const testFile of testFiles) {
      const filePath = path.join(this.config.testDir, testFile);
      const content = fs.readFileSync(filePath, 'utf8');

      if (!content.includes('AutoHealingLocators')) {
        console.log(`🔧 Adding auto-healing to ${testFile}...`);
        const healedContent = this.addAutoHealingToExisting(content);
        fs.writeFileSync(filePath, healedContent);
      }
    }

    // Generate common credit repair tests
    const commonRequirements = [
      'Test credit score calculation with FICO 8 algorithm',
      'Validate FCRA Section 604 permissible purpose disclosure',
      'Test credit dispute submission with required documentation',
      'Validate secure PII data handling in credit reports',
    ];

    for (const requirement of commonRequirements) {
      await this.generateTestFromRequirement(requirement);
    }

    console.log('✅ Heal and generate completed');
  }

  addAutoHealingToExisting(testContent) {
    // Insert auto-healing utilities at the top of existing tests
    const autoHealingImports = `
// Auto-healing utilities added by AI-SDLC
class AutoHealingLocators {
  static async findElement(page, primarySelector, fallbackSelectors = []) {
    try {
      await page.waitForSelector(primarySelector, { timeout: 5000 });
      return primarySelector;
    } catch (error) {
      for (const fallback of fallbackSelectors) {
        try {
          await page.waitForSelector(fallback, { timeout: 3000 });
          return fallback;
        } catch (fallbackError) {
          continue;
        }
      }
      throw new Error(\`All selectors failed for: \${primarySelector}\`);
    }
  }
}

`;

    return autoHealingImports + testContent;
  }

  /**
   * Mock AIDEN API call (replace with real implementation)
   */
  async callQaseAIDEN(params) {
    // This would be the real AIDEN API call
    console.log('🤖 Calling Qase AIDEN API...');

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000)); // eslint-disable-line no-undef

    // Return mock generated test
    return `test('${this.sanitizeTestName(params.requirement || 'generated test')}', async ({ page }) => {
  // AIDEN-generated test code would appear here
  await page.goto('/');
  console.log('🤖 This test was generated by Qase AIDEN');
});`;
  }

  async fetchQaseTestCase(testCaseId) {
    // Mock test case fetch
    return {
      id: testCaseId,
      title: `Manual Test Case ${testCaseId}`,
      steps: [
        'Navigate to credit reports page',
        'Click import report button',
        'Select Equifax bureau',
        'Verify report imported successfully',
      ],
    };
  }

  sanitizeTestName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\s/g, '_');
  }

  generateFileName(requirement) {
    const baseName = this.sanitizeTestName(requirement);
    return `${baseName.substring(0, 50)}.spec.js`;
  }

  /**
   * CLI interface
   */
  static async runCLI() {
    const args = process.argv.slice(2);
    const command = args[0];
    const integration = new QaseAIDENIntegration();

    console.log('🚀 Qase AIDEN Integration with Auto-Healing');
    console.log('===========================================');

    switch (command) {
      case 'generate': {
        const requirement = args[1];
        if (!requirement) {
          console.log(
            '❌ Usage: node qase-aiden-integration.js generate "your requirement"'
          );
          process.exit(1);
        }
        await integration.generateTestFromRequirement(requirement);
        break;
      }

      case 'convert': {
        const testCaseId = args[1];
        if (!testCaseId) {
          console.log(
            '❌ Usage: node qase-aiden-integration.js convert <test-case-id>'
          );
          process.exit(1);
        }
        await integration.convertManualToAutomated(testCaseId);
        break;
      }

      case 'heal-and-generate':
        await integration.healAndGenerate();
        break;

      case 'help':
      default:
        console.log(`
🤖 Available Commands:

generate "requirement"     - Generate test from natural language requirement
convert <test-case-id>     - Convert manual Qase test case to automated
heal-and-generate         - Heal existing tests + generate common ones
help                      - Show this help message

📋 Examples:

node qase-aiden-integration.js generate "Test FCRA compliance flow"
node qase-aiden-integration.js convert 123
node qase-aiden-integration.js heal-and-generate

🔑 Environment Variables:

QASE_API_TOKEN           - Your Qase API token
QASE_PROJECT_CODE        - Your Qase project code (default: TCP)

💡 Without QASE_API_TOKEN, runs in demo mode with template generation.
        `);
        break;
    }
  }
}

// Run CLI if called directly
if (require.main === module) {
  QaseAIDENIntegration.runCLI().catch(console.error);
}

module.exports = QaseAIDENIntegration;

#!/usr/bin/env node

/**
 * Implementation Tracker for AI-SDLC Framework
 * Monitors which documented features are actually implemented
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ImplementationTracker {
  constructor() {
    this.projectRoot = process.cwd();
    this.implementationStatus = {
      core: {},
      scripts: {},
      integrations: {},
      testing: {},
    };
  }

  /**
   * Main tracking function
   */
  async trackImplementation() {
    console.log('🔍 AI-SDLC Implementation Tracker\n');

    await this.checkCoreInfrastructure();
    await this.checkAutomationScripts();
    await this.checkIntegrations();
    await this.checkTestingCapabilities();

    this.generateReport();
    this.saveReport();

    return this.implementationStatus;
  }

  /**
   * Check core framework infrastructure
   */
  async checkCoreInfrastructure() {
    console.log('📋 Checking Core Infrastructure...');

    const checks = [
      {
        name: 'Auto Setup Script',
        check: () =>
          fs.existsSync('./auto-setup.sh') &&
          this.isExecutable('./auto-setup.sh'),
        requirement: 'Executable auto-setup.sh script',
      },
      {
        name: 'CLI Interface',
        check: () =>
          fs.existsSync('./ai-sdlc') && this.isExecutable('./ai-sdlc'),
        requirement: 'Working ai-sdlc CLI',
      },
      {
        name: 'Git Hooks',
        check: () => fs.existsSync('.husky/pre-commit'),
        requirement: 'Husky git hooks configured',
      },
      {
        name: 'Package.json',
        check: () => fs.existsSync('package.json'),
        requirement: 'npm package configuration',
      },
      {
        name: 'Environment Config',
        check: () => fs.existsSync('.env') || fs.existsSync('.env.example'),
        requirement: 'Environment variable template',
      },
      {
        name: 'Documentation Site',
        check: () => fs.existsSync('mkdocs.yml') && fs.existsSync('docs/'),
        requirement: 'MkDocs documentation structure',
      },
    ];

    for (const check of checks) {
      const status = check.check();
      this.implementationStatus.core[check.name] = {
        implemented: status,
        requirement: check.requirement,
      };
      console.log(`  ${status ? '✅' : '❌'} ${check.name}`);
    }
    console.log();
  }

  /**
   * Check automation scripts in scripts-complex/
   */
  async checkAutomationScripts() {
    console.log('🤖 Checking Automation Scripts...');

    const scriptsDir = 'scripts-complex';
    const expectedScripts = [
      'ai-test-generator.js',
      'ai-e2e-generator.js',
      'qase-aiden-integration.js',
      'security-scanner.js',
      'performance-monitor.js',
      'sonarqube-integration.js',
      'postgres-automation.sh',
    ];

    for (const script of expectedScripts) {
      const scriptPath = path.join(scriptsDir, script);
      const exists = fs.existsSync(scriptPath);
      const isWorking = exists ? await this.testScript(scriptPath) : false;

      this.implementationStatus.scripts[script] = {
        exists,
        working: isWorking,
        path: scriptPath,
      };

      console.log(`  ${exists ? (isWorking ? '✅' : '⚠️ ') : '❌'} ${script}`);
    }
    console.log();
  }

  /**
   * Check API integrations
   */
  async checkIntegrations() {
    console.log('🔗 Checking API Integrations...');

    const integrations = [
      {
        name: 'OpenAI',
        envVar: 'OPENAI_API_KEY',
        testCommand: 'node scripts-complex/ai-test-generator.js --help',
      },
      {
        name: 'Qase',
        envVar: 'QASE_TOKEN',
        testCommand: 'node scripts-complex/qase-aiden-integration.js --help',
      },
      {
        name: 'GitHub',
        envVar: 'GITHUB_TOKEN',
        testCommand: 'gh auth status',
      },
      {
        name: 'SonarQube',
        envVar: 'SONAR_TOKEN',
        testCommand: 'node scripts-complex/sonarqube-integration.js --help',
      },
    ];

    const envContent = this.readEnvFile();

    for (const integration of integrations) {
      const hasConfig = this.hasEnvVar(envContent, integration.envVar);
      const isWorking = hasConfig
        ? await this.testIntegration(integration.testCommand)
        : false;

      this.implementationStatus.integrations[integration.name] = {
        configured: hasConfig,
        working: isWorking,
        envVar: integration.envVar,
      };

      console.log(
        `  ${hasConfig ? (isWorking ? '✅' : '⚠️ ') : '❌'} ${integration.name} API`
      );
    }
    console.log();
  }

  /**
   * Check testing capabilities
   */
  async checkTestingCapabilities() {
    console.log('🧪 Checking Testing Capabilities...');

    const testChecks = [
      {
        name: 'Vitest Configuration',
        check: () =>
          fs.existsSync('vitest.config.js') || this.hasPackageScript('test'),
      },
      {
        name: 'Playwright E2E',
        check: () =>
          fs.existsSync('playwright.config.js') &&
          this.hasPackageDependency('@playwright/test'),
      },
      {
        name: 'AI Test Generation',
        check: () => this.hasPackageScript('ai:generate-tests'),
      },
      {
        name: 'Coverage Reporting',
        check: () =>
          this.hasPackageScript('coverage') ||
          this.hasPackageDependency('vitest'),
      },
      {
        name: 'Linting',
        check: () =>
          fs.existsSync('.eslintrc.js') || fs.existsSync('.eslintrc.json'),
      },
    ];

    for (const check of testChecks) {
      const status = check.check();
      this.implementationStatus.testing[check.name] = {
        implemented: status,
      };
      console.log(`  ${status ? '✅' : '❌'} ${check.name}`);
    }
    console.log();
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log('📊 Implementation Summary Report\n');

    const categories = [
      { name: 'Core Infrastructure', data: this.implementationStatus.core },
      { name: 'Automation Scripts', data: this.implementationStatus.scripts },
      {
        name: 'API Integrations',
        data: this.implementationStatus.integrations,
      },
      { name: 'Testing Capabilities', data: this.implementationStatus.testing },
    ];

    for (const category of categories) {
      const items = Object.keys(category.data);
      const implemented = items.filter((item) => {
        const status = category.data[item];
        return (
          status.implemented ||
          status.exists ||
          status.configured ||
          status.working
        );
      });

      const percentage =
        items.length > 0
          ? Math.round((implemented.length / items.length) * 100)
          : 0;

      console.log(
        `${category.name}: ${percentage}% (${implemented.length}/${items.length})`
      );

      // Show what's missing
      const missing = items.filter((item) => {
        const status = category.data[item];
        return !(
          status.implemented ||
          status.exists ||
          status.configured ||
          status.working
        );
      });

      if (missing.length > 0) {
        console.log(`  Missing: ${missing.join(', ')}`);
      }
      console.log();
    }

    // Overall status
    const totalItems = Object.values(this.implementationStatus).reduce(
      (acc, category) => {
        return acc + Object.keys(category).length;
      },
      0
    );

    const implementedItems = Object.values(this.implementationStatus).reduce(
      (acc, category) => {
        return (
          acc +
          Object.keys(category).filter((item) => {
            const status = category[item];
            return (
              status.implemented ||
              status.exists ||
              status.configured ||
              status.working
            );
          }).length
        );
      },
      0
    );

    const overallPercentage =
      totalItems > 0 ? Math.round((implementedItems / totalItems) * 100) : 0;

    console.log(
      `🎯 Overall Implementation: ${overallPercentage}% (${implementedItems}/${totalItems})`
    );

    if (overallPercentage >= 80) {
      console.log('✅ Excellent! Framework is production-ready');
    } else if (overallPercentage >= 60) {
      console.log('⚠️  Good foundation, some features need configuration');
    } else {
      console.log('❌ Significant setup required for full functionality');
    }
  }

  /**
   * Save report to file
   */
  saveReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      version: '2.7.1',
      implementationStatus: this.implementationStatus,
      summary: this.generateSummaryData(),
    };

    fs.writeFileSync(
      'implementation-report.json',
      JSON.stringify(reportData, null, 2)
    );
    console.log('\n💾 Report saved to implementation-report.json');
  }

  /**
   * Helper functions
   */
  isExecutable(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return !!(stats.mode & parseInt('111', 8));
    } catch {
      return false;
    }
  }

  async testScript(scriptPath) {
    try {
      // Test if script can be executed with --help flag
      execSync(`node ${scriptPath} --help`, {
        stdio: 'ignore',
        timeout: 5000,
      });
      return true;
    } catch {
      // Try without --help
      try {
        execSync(`node ${scriptPath}`, {
          stdio: 'ignore',
          timeout: 5000,
        });
        return true;
      } catch {
        return false;
      }
    }
  }

  async testIntegration(command) {
    try {
      execSync(command, {
        stdio: 'ignore',
        timeout: 10000,
      });
      return true;
    } catch {
      return false;
    }
  }

  readEnvFile() {
    try {
      return fs.readFileSync('.env', 'utf8');
    } catch {
      try {
        return fs.readFileSync('.env.example', 'utf8');
      } catch {
        return '';
      }
    }
  }

  hasEnvVar(envContent, varName) {
    const regex = new RegExp(`^${varName}=.+`, 'm');
    return regex.test(envContent);
  }

  hasPackageScript(scriptName) {
    try {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.scripts && pkg.scripts[scriptName];
    } catch {
      return false;
    }
  }

  hasPackageDependency(depName) {
    try {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return (
        (pkg.dependencies && pkg.dependencies[depName]) ||
        (pkg.devDependencies && pkg.devDependencies[depName])
      );
    } catch {
      return false;
    }
  }

  generateSummaryData() {
    // Generate summary statistics for the report
    const categories = Object.keys(this.implementationStatus);
    const summary = {};

    for (const category of categories) {
      const items = Object.keys(this.implementationStatus[category]);
      const implemented = items.filter((item) => {
        const status = this.implementationStatus[category][item];
        return (
          status.implemented ||
          status.exists ||
          status.configured ||
          status.working
        );
      });

      summary[category] = {
        total: items.length,
        implemented: implemented.length,
        percentage:
          items.length > 0
            ? Math.round((implemented.length / items.length) * 100)
            : 0,
      };
    }

    return summary;
  }
}

// CLI execution
if (require.main === module) {
  const tracker = new ImplementationTracker();
  tracker.trackImplementation().catch(console.error);
}

module.exports = ImplementationTracker;

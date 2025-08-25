#!/usr/bin/env node

/**
 * MCP Server Validator for AI-SDLC Framework
 * Validates MCP server configurations and connectivity for credit repair development
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MCPValidator {
  constructor() {
    this.configPath = path.join(process.cwd(), '.mcp.json');
    this.logPrefix = '🔍 MCP Validator';
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
    };
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const emoji =
      level === 'error'
        ? '❌'
        : level === 'warn'
          ? '⚠️'
          : level === 'success'
            ? '✅'
            : 'ℹ️';
    console.log(`[${timestamp}] ${emoji} ${this.logPrefix}: ${message}`);
  }

  async loadConfig() {
    try {
      if (!fs.existsSync(this.configPath)) {
        throw new Error(`MCP config not found at ${this.configPath}`);
      }

      const configContent = fs.readFileSync(this.configPath, 'utf8');
      const config = JSON.parse(configContent);

      this.log('MCP configuration loaded successfully ✓');
      return config;
    } catch (error) {
      this.log(`Failed to load MCP config: ${error.message}`, 'error');
      throw error;
    }
  }

  async validateEnvironment() {
    this.log('Validating environment setup...');
    const checks = [];

    // Check for required environment variables
    const envVars = ['GITHUB_TOKEN', 'OPENAI_API_KEY'];

    const optional = [
      'DATABASE_URL',
      'QASE_API_TOKEN',
      'PLAYWRIGHT_BROWSERS_PATH',
    ];

    envVars.forEach((envVar) => {
      if (process.env[envVar]) {
        checks.push({ name: envVar, status: 'pass', message: 'Set ✓' });
      } else {
        checks.push({
          name: envVar,
          status: 'fail',
          message: 'Missing - required for full functionality',
        });
      }
    });

    optional.forEach((envVar) => {
      if (process.env[envVar]) {
        checks.push({ name: envVar, status: 'pass', message: 'Set ✓' });
      } else {
        checks.push({
          name: envVar,
          status: 'warn',
          message: 'Optional - not set',
        });
      }
    });

    return checks;
  }

  async validateServerPackage(packageName) {
    try {
      // Check if package exists in npm registry
      const result = execSync(`npm view ${packageName} version 2>/dev/null`, {
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim();

      if (result) {
        this.log(`Package ${packageName} v${result} available ✓`);
        return { status: 'pass', version: result };
      } else {
        this.log(`Package ${packageName} not found in registry`, 'warn');
        return { status: 'warn', message: 'Not found in npm registry' };
      }
    } catch (error) {
      this.log(
        `Package ${packageName} validation failed: ${error.message}`,
        'warn'
      );
      return { status: 'warn', message: error.message };
    }
  }

  async validateServerConfig(serverName, serverConfig) {
    const validationResult = {
      name: serverName,
      command: serverConfig.command,
      status: 'unknown',
      checks: [],
    };

    // Validate command type
    if (serverConfig.command === 'npx') {
      const packageName = serverConfig.args?.find(
        (arg) => !arg.startsWith('-')
      );
      if (packageName) {
        const packageCheck = await this.validateServerPackage(packageName);
        validationResult.checks.push({
          type: 'package',
          name: packageName,
          ...packageCheck,
        });
      }
    } else if (serverConfig.command === 'node') {
      const scriptPath = serverConfig.args?.[0];
      if (scriptPath) {
        const fullPath = path.join(process.cwd(), scriptPath);
        const scriptExists = fs.existsSync(fullPath);
        validationResult.checks.push({
          type: 'script',
          name: scriptPath,
          status: scriptExists ? 'pass' : 'fail',
          message: scriptExists ? 'Script exists ✓' : 'Script not found',
        });
      }
    }

    // Validate capabilities
    const validCapabilities = ['resources', 'tools', 'prompts'];
    const invalidCapabilities =
      serverConfig.capabilities?.filter(
        (cap) => !validCapabilities.includes(cap)
      ) || [];

    if (invalidCapabilities.length > 0) {
      validationResult.checks.push({
        type: 'capabilities',
        status: 'warn',
        message: `Invalid capabilities: ${invalidCapabilities.join(', ')}`,
      });
    } else {
      validationResult.checks.push({
        type: 'capabilities',
        status: 'pass',
        message: `Valid capabilities: ${serverConfig.capabilities?.join(', ') || 'none'}`,
      });
    }

    // Overall status
    const hasFailures = validationResult.checks.some(
      (check) => check.status === 'fail'
    );
    const hasWarnings = validationResult.checks.some(
      (check) => check.status === 'warn'
    );

    if (hasFailures) {
      validationResult.status = 'fail';
    } else if (hasWarnings) {
      validationResult.status = 'warn';
    } else {
      validationResult.status = 'pass';
    }

    return validationResult;
  }

  async validateCreditRepairIntegration() {
    this.log('Validating credit repair domain integration...');
    const checks = [];

    // Check for credit repair specific files
    const creditRepairFiles = [
      'memory_bank/compliance_rules.md',
      'memory_bank/project_brief.md',
      '.clinerules_modular/tcp_domain.md',
      'scripts-complex/mcp-server.js',
    ];

    creditRepairFiles.forEach((filePath) => {
      const exists = fs.existsSync(path.join(process.cwd(), filePath));
      checks.push({
        name: filePath,
        status: exists ? 'pass' : 'warn',
        message: exists ? 'Exists ✓' : 'File not found',
      });
    });

    return checks;
  }

  generateReport() {
    const report = `# MCP Server Validation Report
Generated: ${new Date().toISOString()}
Framework: AI-SDLC v3.2.0

## Summary
- ✅ Passed: ${this.results.passed.length}
- ❌ Failed: ${this.results.failed.length}  
- ⚠️  Warnings: ${this.results.warnings.length}

## Detailed Results

${
  this.results.passed.length > 0
    ? `### ✅ Passed Tests
${this.results.passed.map((result) => `- ${result}`).join('\n')}
`
    : ''
}

${
  this.results.failed.length > 0
    ? `### ❌ Failed Tests
${this.results.failed.map((result) => `- ${result}`).join('\n')}
`
    : ''
}

${
  this.results.warnings.length > 0
    ? `### ⚠️ Warnings
${this.results.warnings.map((result) => `- ${result}`).join('\n')}
`
    : ''
}

## Recommendations

${
  this.results.failed.length > 0
    ? `
### Critical Issues
Please resolve the following issues before using MCP servers:
${this.results.failed.map((result) => `- ${result}`).join('\n')}
`
    : ''
}

${
  this.results.warnings.length > 0
    ? `
### Improvements
Consider addressing these warnings for optimal performance:
${this.results.warnings.map((result) => `- ${result}`).join('\n')}
`
    : ''
}

${
  this.results.failed.length === 0 && this.results.warnings.length === 0
    ? `
🎉 All validations passed! Your MCP servers are ready for credit repair development.

### Next Steps:
1. Run: \`claude mcp add --config ./.mcp.json\`
2. Test with: \`npm run mcp:status\`
3. Start developing with AI-powered automation!
`
    : ''
}

---
Generated by AI-SDLC Framework v3.2.0 MCP Validator
`;

    const reportPath = path.join(process.cwd(), 'MCP-VALIDATION-REPORT.md');
    fs.writeFileSync(reportPath, report);
    this.log(`Validation report saved to MCP-VALIDATION-REPORT.md`);
  }

  async run() {
    try {
      this.log('Starting MCP server validation for AI-SDLC v3.2.0');

      // Load MCP configuration
      const mcpConfig = await this.loadConfig();

      // Validate environment
      const envChecks = await this.validateEnvironment();
      envChecks.forEach((check) => {
        const message = `Environment ${check.name}: ${check.message}`;
        if (check.status === 'pass') {
          this.results.passed.push(message);
        } else if (check.status === 'fail') {
          this.results.failed.push(message);
        } else {
          this.results.warnings.push(message);
        }
      });

      // Validate each MCP server
      this.log(
        `Validating ${Object.keys(mcpConfig.servers).length} MCP servers...`
      );

      for (const [serverName, serverConfig] of Object.entries(
        mcpConfig.servers
      )) {
        this.log(`Validating server: ${serverName}`);
        const validation = await this.validateServerConfig(
          serverName,
          serverConfig
        );

        const message = `Server ${serverName}: ${validation.checks.map((c) => c.message).join(', ')}`;

        if (validation.status === 'pass') {
          this.results.passed.push(message);
          this.log(`Server ${serverName} validation passed ✅`, 'success');
        } else if (validation.status === 'fail') {
          this.results.failed.push(message);
          this.log(`Server ${serverName} validation failed ❌`, 'error');
        } else {
          this.results.warnings.push(message);
          this.log(`Server ${serverName} has warnings ⚠️`, 'warn');
        }
      }

      // Validate credit repair integration
      const creditChecks = await this.validateCreditRepairIntegration();
      creditChecks.forEach((check) => {
        const message = `Credit repair integration ${check.name}: ${check.message}`;
        if (check.status === 'pass') {
          this.results.passed.push(message);
        } else {
          this.results.warnings.push(message);
        }
      });

      // Generate report
      this.generateReport();

      // Summary
      this.log('Validation complete!');
      console.log('\n📊 Validation Summary:');
      console.log(`✅ Passed: ${this.results.passed.length}`);
      console.log(`❌ Failed: ${this.results.failed.length}`);
      console.log(`⚠️  Warnings: ${this.results.warnings.length}`);

      if (this.results.failed.length > 0) {
        console.log(
          '\n❌ Critical issues found. Please review MCP-VALIDATION-REPORT.md'
        );
        process.exit(1);
      } else if (this.results.warnings.length > 0) {
        console.log(
          '\n⚠️  Warnings found. Review MCP-VALIDATION-REPORT.md for improvements'
        );
      } else {
        console.log('\n🎉 All validations passed! MCP servers are ready!');
      }
    } catch (error) {
      this.log(`Validation failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run the validator
if (require.main === module) {
  const validator = new MCPValidator();
  validator.run().catch((error) => {
    console.error('❌ MCP Validation failed:', error);
    process.exit(1);
  });
}

module.exports = MCPValidator;

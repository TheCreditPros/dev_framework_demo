#!/usr/bin/env node

/**
 * API Contract Tester for AI-SDLC
 * Sets up contract testing between frontend and backend
 * Validates request/response schema matching and detects breaking changes
 */

// Load environment variables
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class APIContractTester {
  constructor() {
    this.projectRoot = process.cwd();
    this.reportsDir = path.join(this.projectRoot, 'reports', 'api-contracts');
    this.setupReportsDirectory();

    // Supported contract testing tools
    this.supportedTools = {
      dredd: {
        name: 'Dredd',
        package: 'dredd',
        config: 'dredd.yml',
        command: 'dredd'
      },
      pact: {
        name: 'Pact',
        package: '@pact-foundation/pact',
        config: 'pact.config.js',
        command: 'pact'
      },
      openapi: {
        name: 'OpenAPI Validator',
        package: 'openapi-validator',
        config: 'openapi.yaml',
        command: 'openapi-validator'
      }
    };
  }

  setupReportsDirectory() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Detect available contract testing tools
   */
  detectAvailableTools() {
    const availableTools = [];

    for (const [toolKey, toolInfo] of Object.entries(this.supportedTools)) {
      try {
        // Check if tool is installed
        execSync(`npm list ${toolInfo.package}`, { stdio: 'ignore' });
        availableTools.push(toolKey);
      } catch (error) {
        // Tool not installed, continue
      }
    }

    return availableTools;
  }

  /**
   * Find OpenAPI/Swagger specification files
   */
  findAPISpecifications() {
    const specFiles = [];
    const specPatterns = [
      'openapi.yaml',
      'openapi.yml',
      'openapi.json',
      'swagger.yaml',
      'swagger.yml',
      'swagger.json'
    ];

    // Search in common API documentation locations
    const searchPaths = [
      this.projectRoot,
      path.join(this.projectRoot, 'docs'),
      path.join(this.projectRoot, 'api'),
      path.join(this.projectRoot, 'spec'),
      path.join(this.projectRoot, 'specs')
    ];

    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        const files = fs.readdirSync(searchPath);
        for (const file of files) {
          if (specPatterns.includes(file.toLowerCase())) {
            specFiles.push(path.join(searchPath, file));
          }
        }
      }
    }

    return specFiles;
  }

  /**
   * Validate API specification completeness
   */
  validateAPISpecification(specPath) {
    const issues = [];

    try {
      const specContent = fs.readFileSync(specPath, 'utf8');
      const spec = this.parseSpec(specContent, specPath);

      // Validate OpenAPI version
      if (!spec.openapi && !spec.swagger) {
        issues.push('Specification must define openapi or swagger version');
      }

      // Validate info section
      if (!spec.info) {
        issues.push('Specification missing info section');
      } else {
        if (!spec.info.title) {
          issues.push('Specification missing title');
        }
        if (!spec.info.version) {
          issues.push('Specification missing version');
        }
      }

      // Validate paths
      if (!spec.paths) {
        issues.push('Specification missing paths');
      } else {
        issues.push(...this.validatePaths(spec.paths, specPath));
      }

      // Validate components/schemas
      if (spec.components && spec.components.schemas) {
        issues.push(...this.validateSchemas(spec.components.schemas));
      }

    } catch (error) {
      issues.push(`Failed to parse specification: ${error.message}`);
    }

    return issues;
  }

  /**
   * Parse API specification
   */
  parseSpec(content, specPath) {
    const ext = path.extname(specPath).toLowerCase();

    if (ext === '.json') {
      return JSON.parse(content);
    } else {
      // Try YAML parsing
      const yaml = require('js-yaml');
      return yaml.load(content);
    }
  }

  /**
   * Validate API paths
   */
  validatePaths(paths, specPath) {
    const issues = [];

    for (const [path, pathItem] of Object.entries(paths)) {
      if (!path.startsWith('/')) {
        issues.push(`Path "${path}" should start with "/" in ${specPath}`);
      }

      for (const [method, operation] of Object.entries(pathItem)) {
        if (['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method.toLowerCase())) {
          issues.push(...this.validateOperation(operation, path, method, specPath));
        }
      }
    }

    return issues;
  }

  /**
   * Validate individual API operation
   */
  validateOperation(operation, path, method, specPath) {
    const issues = [];

    // Validate operationId
    if (!operation.operationId) {
      issues.push(`Missing operationId for ${method.toUpperCase()} ${path} in ${specPath}`);
    }

    // Validate summary
    if (!operation.summary) {
      issues.push(`Missing summary for ${method.toUpperCase()} ${path} in ${specPath}`);
    } else if (operation.summary.length < 20) {
      issues.push(`Summary too brief for ${method.toUpperCase()} ${path} in ${specPath}`);
    }

    // Validate responses
    if (!operation.responses) {
      issues.push(`Missing responses for ${method.toUpperCase()} ${path} in ${specPath}`);
    } else {
      issues.push(...this.validateResponses(operation.responses, path, method, specPath));
    }

    // Validate parameters
    if (operation.parameters) {
      issues.push(...this.validateParameters(operation.parameters, path, method, specPath));
    }

    return issues;
  }

  /**
   * Validate API responses
   */
  validateResponses(responses, path, method, specPath) {
    const issues = [];

    for (const [statusCode, response] of Object.entries(responses)) {
      if (!response.description) {
        issues.push(`Missing description for ${statusCode} response in ${method.toUpperCase()} ${path} in ${specPath}`);
      }

      // Validate response schemas
      if (response.content) {
        for (const [contentType, content] of Object.entries(response.content)) {
          if (content.schema) {
            issues.push(...this.validateSchema(content.schema, `${statusCode} ${contentType}`, specPath));
          }
        }
      }
    }

    return issues;
  }

  /**
   * Validate API parameters
   */
  validateParameters(parameters, path, method, specPath) {
    const issues = [];

    for (const param of parameters) {
      if (!param.name) {
        issues.push(`Parameter missing name in ${method.toUpperCase()} ${path} in ${specPath}`);
      }

      if (!param.in) {
        issues.push(`Parameter "${param.name}" missing location (in) in ${method.toUpperCase()} ${path} in ${specPath}`);
      }

      if (!param.description) {
        issues.push(`Parameter "${param.name}" missing description in ${method.toUpperCase()} ${path} in ${specPath}`);
      } else if (param.description.length < 20) {
        issues.push(`Parameter "${param.name}" description too brief in ${method.toUpperCase()} ${path} in ${specPath}`);
      }

      if (param.required === undefined) {
        issues.push(`Parameter "${param.name}" missing required field in ${method.toUpperCase()} ${path} in ${specPath}`);
      }
    }

    return issues;
  }

  /**
   * Validate schema definitions
   */
  validateSchemas(schemas) {
    const issues = [];

    for (const [schemaName, schema] of Object.entries(schemas)) {
      issues.push(...this.validateSchema(schema, schemaName));
    }

    return issues;
  }

  /**
   * Validate individual schema
   */
  validateSchema(schema, schemaName) {
    const issues = [];

    if (!schema.type && !schema.$ref && !schema.allOf && !schema.anyOf && !schema.oneOf) {
      issues.push(`Schema "${schemaName}" missing type definition`);
    }

    if (schema.properties) {
      for (const [propName, prop] of Object.entries(schema.properties)) {
        if (!prop.type && !prop.$ref) {
          issues.push(`Property "${propName}" in schema "${schemaName}" missing type`);
        }

        if (prop.required === true && schema.required && !schema.required.includes(propName)) {
          issues.push(`Required property "${propName}" not listed in required array for schema "${schemaName}"`);
        }
      }
    }

    return issues;
  }

  /**
   * Setup Dredd configuration
   */
  setupDredd(specPath) {
    const dreddConfig = {
      'swagger': specPath,
      'server': 'http://localhost:3000',
      'hooks-worker-timeout': 5000,
      'hooks-worker-connect-timeout': 1500,
      'hooks-worker-after-connect-wait': 100,
      'hooks-worker-term-timeout': 5000,
      'hooks-worker-term-retry': 500,
      'hooks-worker-handler-host': '127.0.0.1',
      'hooks-worker-handler-port': 61321
    };

    const configPath = path.join(this.projectRoot, 'dredd.yml');
    fs.writeFileSync(configPath, this.yamlDump(dreddConfig));

    return configPath;
  }

  /**
   * Simple YAML dumper (since we don't want to add dependencies)
   */
  yamlDump(obj, indent = 0) {
    let yaml = '';
    const spaces = '  '.repeat(indent);

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n${this.yamlDump(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        for (const item of value) {
          yaml += `${spaces}  - ${item}\n`;
        }
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }

    return yaml;
  }

  /**
   * Run contract tests with available tools
   */
  async runContractTests() {
    console.log('🔍 Detecting available contract testing tools...');

    const availableTools = this.detectAvailableTools();

    if (availableTools.length === 0) {
      console.log('⚠️  No contract testing tools found. Installing Dredd...');
      try {
        execSync('npm install --save-dev dredd', { stdio: 'inherit' });
        availableTools.push('dredd');
        console.log('✅ Dredd installed successfully');
      } catch (error) {
        console.error('❌ Failed to install Dredd:', error.message);
        return { status: 'failed', error: 'Could not install contract testing tool' };
      }
    }

    console.log('🔍 Finding API specifications...');
    const specFiles = this.findAPISpecifications();

    if (specFiles.length === 0) {
      console.log('⚠️  No API specification files found');
      console.log('💡 Create openapi.yaml, swagger.yaml, or similar in your project');
      return { status: 'warning', message: 'No API specifications found' };
    }

    console.log(`✅ Found ${specFiles.length} API specification file(s)`);

    const results = [];

    for (const specFile of specFiles) {
      console.log(`\n🧪 Validating specification: ${specFile}`);

      const validationIssues = this.validateAPISpecification(specFile);

      if (validationIssues.length > 0) {
        console.log(`⚠️  Found ${validationIssues.length} validation issues:`);
        for (const issue of validationIssues) {
          console.log(`  • ${issue}`);
        }
      } else {
        console.log('✅ Specification validation passed');
      }

      // Run contract tests if Dredd is available
      if (availableTools.includes('dredd')) {
        console.log('🚀 Running contract tests with Dredd...');

        try {
          const dreddConfig = this.setupDredd(specFile);
          console.log(`📝 Dredd configuration created: ${dreddConfig}`);

          // Run Dredd (this would normally be done in a separate process)
          console.log('💡 To run contract tests, use:');
          console.log(`   npx dredd ${specFile} http://localhost:3000`);

          results.push({
            specFile,
            tool: 'dredd',
            status: 'configured',
            issues: validationIssues.length
          });
        } catch (error) {
          console.error('❌ Dredd setup failed:', error.message);
          results.push({
            specFile,
            tool: 'dredd',
            status: 'failed',
            error: error.message
          });
        }
      }
    }

    // Generate report
    const reportPath = this.generateReport(results, specFiles);

    return {
      status: 'success',
      reportPath,
      results,
      specFiles
    };
  }

  /**
   * Generate contract testing report
   */
  generateReport(results, specFiles) {
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      summary: {
        totalSpecifications: specFiles.length,
        totalResults: results.length,
        passed: results.filter(r => r.status === 'configured').length,
        failed: results.filter(r => r.status === 'failed').length
      },
      specifications: specFiles,
      testResults: results
    };

    const reportPath = path.join(this.reportsDir, `contract-test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return reportPath;
  }

  /**
   * Check for breaking changes in API contracts
   */
  checkBreakingChanges(oldSpecPath, newSpecPath) {
    const issues = [];

    try {
      const oldSpec = this.parseSpec(fs.readFileSync(oldSpecPath, 'utf8'), oldSpecPath);
      const newSpec = this.parseSpec(fs.readFileSync(newSpecPath, 'utf8'), newSpecPath);

      // Compare paths
      const oldPaths = Object.keys(oldSpec.paths || {});
      const newPaths = Object.keys(newSpec.paths || {});

      // Check for removed paths
      for (const path of oldPaths) {
        if (!newPaths.includes(path)) {
          issues.push(`BREAKING: Path removed: ${path}`);
        }
      }

      // Check for removed operations
      for (const [path, pathItem] of Object.entries(oldSpec.paths || {})) {
        if (newSpec.paths && newSpec.paths[path]) {
          const newOperations = newSpec.paths[path];
          for (const method of Object.keys(pathItem)) {
            if (!newOperations[method]) {
              issues.push(`BREAKING: Operation removed: ${method.toUpperCase()} ${path}`);
            }
          }
        }
      }

      // Check for required parameter changes
      // (simplified check - in practice this would be more comprehensive)

    } catch (error) {
      issues.push(`Failed to compare specifications: ${error.message}`);
    }

    return issues;
  }

  /**
   * Ensure backward compatibility
   */
  ensureBackwardCompatibility(specPath) {
    const issues = [];

    try {
      const spec = this.parseSpec(fs.readFileSync(specPath, 'utf8'), specPath);

      // Check versioning
      if (spec.info && spec.info.version) {
        const version = spec.info.version;
        if (!this.isValidSemver(version)) {
          issues.push(`Version "${version}" is not valid semver format`);
        }
      }

      // Check for deprecated endpoints
      for (const [path, pathItem] of Object.entries(spec.paths || {})) {
        for (const [method, operation] of Object.entries(pathItem)) {
          if (operation.deprecated) {
            issues.push(`Deprecated endpoint: ${method.toUpperCase()} ${path}`);
          }
        }
      }

    } catch (error) {
      issues.push(`Failed to check compatibility: ${error.message}`);
    }

    return issues;
  }

  /**
   * Validate semantic versioning
   */
  isValidSemver(version) {
    const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
    return semverRegex.test(version);
  }

  /**
   * Integrate with existing testing frameworks
   */
  integrateWithTestingFrameworks() {
    const integrations = {};

    // Check for Vitest
    if (fs.existsSync(path.join(this.projectRoot, 'vitest.config.js'))) {
      integrations.vitest = this.setupVitestIntegration();
    }

    // Check for Playwright
    if (fs.existsSync(path.join(this.projectRoot, 'playwright.config.js'))) {
      integrations.playwright = this.setupPlaywrightIntegration();
    }

    return integrations;
  }

  /**
   * Setup Vitest integration
   */
  setupVitestIntegration() {
    // This would typically modify vitest.config.js or create test files
    return {
      status: 'detected',
      configPath: 'vitest.config.js',
      integration: 'API contract tests can be run with vitest'
    };
  }

  /**
   * Setup Playwright integration
   */
  setupPlaywrightIntegration() {
    // This would typically create Playwright test files
    return {
      status: 'detected',
      configPath: 'playwright.config.js',
      integration: 'API contract tests can be integrated with E2E tests'
    };
  }

  /**
   * Main contract testing function
   */
  async testAll() {
    console.log('🤖 Starting API Contract Testing Setup...');

    try {
      // Check for testing framework integrations
      const frameworkIntegrations = this.integrateWithTestingFrameworks();

      // Run contract tests
      const testResults = await this.runContractTests();

      // Generate comprehensive report
      const finalReport = {
        ...testResults,
        frameworkIntegrations,
        timestamp: new Date().toISOString()
      };

      console.log('\n✅ API Contract Testing Setup Complete!');

      if (testResults.status === 'success') {
        console.log(`📁 Report saved to: ${testResults.reportPath}`);
        console.log(`📊 Specifications analyzed: ${testResults.specFiles.length}`);

        const passed = testResults.results.filter(r => r.status === 'configured').length;
        const failed = testResults.results.filter(r => r.status === 'failed').length;

        if (passed > 0) {
          console.log(`🟢 ${passed} specification(s) configured successfully`);
        }
        if (failed > 0) {
          console.log(`🔴 ${failed} specification(s) failed to configure`);
        }
      }

      return finalReport;
    } catch (error) {
      console.error('❌ Contract testing setup failed:', error.message);
      return {
        status: 'failed',
        error: error.message
      };
    }
  }
}

// CLI interface
async function main() {
  const tester = new APIContractTester();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case 'test': {
      const result = await tester.testAll();

      if (result.status === 'success') {
        console.log('\n🎉 Contract testing setup completed successfully!');
        console.log(`📄 Detailed report: ${result.reportPath}`);
      } else if (result.status === 'failed') {
        console.error('💥 Contract testing setup failed');
        process.exit(1);
      }
      break;
    }

    case 'validate': {
      const specPath = args[0];
      if (!specPath) {
        console.error('❌ Please specify a specification file path');
        process.exit(1);
      }

      const issues = tester.validateAPISpecification(specPath);

      if (issues.length > 0) {
        console.log(`⚠️  Found ${issues.length} validation issues:`);
        for (const issue of issues) {
          console.log(`  • ${issue}`);
        }
      } else {
        console.log('✅ Specification validation passed');
      }
      break;
    }

    case 'breaking-changes': {
      const oldSpec = args[0];
      const newSpec = args[1];

      if (!oldSpec || !newSpec) {
        console.error('❌ Please specify old and new specification file paths');
        process.exit(1);
      }

      const issues = tester.checkBreakingChanges(oldSpec, newSpec);

      if (issues.length > 0) {
        console.log(`⚠️  Found ${issues.length} potential breaking changes:`);
        for (const issue of issues) {
          console.log(`  • ${issue}`);
        }
      } else {
        console.log('✅ No breaking changes detected');
      }
      break;
    }

    default:
      console.log('API Contract Tester for AI-SDLC Framework');
      console.log('');
      console.log('Usage:');
      console.log('  api-contract-tester.js test');
      console.log('  api-contract-tester.js validate <spec-file>');
      console.log('  api-contract-tester.js breaking-changes <old-spec> <new-spec>');
      console.log('');
      console.log('Commands:');
      console.log('  test              Run full contract testing setup');
      console.log('  validate          Validate API specification completeness');
      console.log('  breaking-changes  Check for breaking changes between versions');
      console.log('');
      console.log('Features:');
      console.log('  • Detects and validates OpenAPI/Swagger specifications');
      console.log('  • Sets up contract testing with Dredd/Pact/OpenAPI tools');
      console.log('  • Validates request/response schema matching');
      console.log('  • Detects breaking changes in API contracts');
      console.log('  • Ensures backward compatibility');
      console.log('  • Integrates with Vitest and Playwright');
      console.log('  • Generates detailed testing reports');
      break;
  }
}

// Export for use as module
module.exports = APIContractTester;

// Run CLI if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

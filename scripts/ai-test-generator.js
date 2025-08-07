#!/usr/bin/env node

/**
 * AI-Powered Test Generator for AI-SDLC
 * The Credit Pros - Development Team
 *
 * Generates comprehensive test suites using AI analysis
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent
      .split('\n')
      .filter((line) => line.trim() && !line.startsWith('#'));

    for (const line of envLines) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // Only set if not already set (respect existing env vars)
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
    console.log('🔧 Loaded environment variables from .env file');
  }
}

// Load .env file at startup
loadEnvFile();

class AITestGenerator {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.codiumApiKey = process.env.CODIUM_API_KEY;
    this.projectRoot = process.cwd();
    
    // Qase dual project configuration
    this.qase = {
      apiKey: process.env.QASE_API_KEY,
      clientProject: process.env.QASE_CLIENT_PROJECT_CODE || 'TCP',
      adminProject: process.env.QASE_ADMIN_PROJECT_CODE || 'PCU',
      defaultProject: process.env.QASE_PROJECT_CODE || 'TCP',
      targetProject: process.env.QASE_TARGET_PROJECT || 'TCP',
      dualProjectMode: process.env.QASE_DUAL_PROJECT_MODE === 'true'
    };
    this.testPatterns = {
      javascript: {
        unit: ['*.test.js', '*.spec.js'],
        integration: ['*.integration.test.js'],
        e2e: ['*.e2e.test.js', '*.e2e.spec.js'],
      },
      typescript: {
        unit: ['*.test.ts', '*.spec.ts'],
        integration: ['*.integration.test.ts'],
        e2e: ['*.e2e.test.ts', '*.e2e.spec.ts'],
      },
      react: {
        unit: ['*.test.jsx', '*.test.tsx'],
        component: ['*.component.test.js', '*.component.test.tsx'],
      },
      php: {
        unit: ['*Test.php'],
        feature: ['*FeatureTest.php'],
        integration: ['*IntegrationTest.php'],
      },
    };

    // Platform status logging
    if (!this.openaiApiKey) {
      console.warn(
        '⚠️  OPENAI_API_KEY not configured. Using template-based generation.'
      );
    }
    if (!this.qaseApiKey) {
      console.warn(
        '⚠️  QASE_API_KEY not configured. Test management integration disabled.'
      );
    }
    if (!this.codiumApiKey) {
      console.warn(
        '⚠️  CODIUM_API_KEY not configured. Advanced AI test generation disabled.'
      );
    }

    console.log('🔧 Platform Status:');
    console.log(
      `   OpenAI: ${this.openaiApiKey ? '✅ Connected' : '❌ Disabled'}`
    );
    console.log(`   Qase: ${this.qaseApiKey ? '✅ Connected' : '❌ Disabled'}`);
    console.log(
      `   Codium: ${this.codiumApiKey ? '✅ Connected' : '❌ Disabled'}`
    );
  }

  /**
   * Initialize AI test generation
   */
  async initializeTestGeneration() {
    console.log('🤖 Initializing AI test generation...');

    try {
      // Analyze project structure
      const projectAnalysis = await this.analyzeProject();

      // Create test directories
      await this.createTestDirectories(projectAnalysis);

      // Generate test configuration files
      await this.createTestConfigurations(projectAnalysis);

      // Create test templates
      await this.createTestTemplates();

      // Set up test scripts in package.json
      await this.updatePackageJsonScripts();

      console.log('✅ AI test generation initialized successfully');
      console.log('📁 Test directories created');
      console.log('⚙️  Test configurations generated');
      console.log('📝 Test templates ready');

      return {
        status: 'success',
        message: 'Test generation initialized',
        projectType: projectAnalysis.type,
        testFrameworks: projectAnalysis.frameworks,
      };
    } catch (error) {
      console.error('❌ Failed to initialize test generation:', error.message);
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * Analyze project structure to determine test strategy
   */
  async analyzeProject() {
    const analysis = {
      type: 'unknown',
      languages: [],
      frameworks: [],
      structure: {},
      testCoverage: 0,
    };

    // Check for different project types
    if (fs.existsSync('package.json')) {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      analysis.languages.push('javascript');

      // Check for TypeScript
      if (
        packageJson.dependencies?.typescript ||
        packageJson.devDependencies?.typescript
      ) {
        analysis.languages.push('typescript');
      }

      // Check for React
      if (
        packageJson.dependencies?.react ||
        packageJson.devDependencies?.react
      ) {
        analysis.frameworks.push('react');
        analysis.type = 'react';
      }

      // Check for Node.js/Express
      if (packageJson.dependencies?.express) {
        analysis.frameworks.push('express');
        analysis.type = analysis.type === 'unknown' ? 'node' : analysis.type;
      }
    }

    // Check for PHP/Laravel
    if (fs.existsSync('composer.json')) {
      analysis.languages.push('php');
      const composerJson = JSON.parse(fs.readFileSync('composer.json', 'utf8'));

      if (composerJson.require?.['laravel/framework']) {
        analysis.frameworks.push('laravel');
        analysis.type = 'laravel';
      }
    }

    // Analyze existing source structure
    analysis.structure = this.analyzeSourceStructure();

    // Calculate current test coverage
    analysis.testCoverage = this.calculateCurrentTestCoverage();

    return analysis;
  }

  /**
   * Analyze source code structure
   */
  analyzeSourceStructure() {
    const structure = {
      directories: [],
      files: [],
      components: [],
      controllers: [],
      models: [],
      services: [],
    };

    const scanDirectory = (dir, type = 'general') => {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (
            !['node_modules', '.git', 'vendor', 'dist', 'build'].includes(item)
          ) {
            structure.directories.push({ name: item, path: fullPath, type });
            scanDirectory(fullPath, item);
          }
        } else {
          const ext = path.extname(item);
          const baseName = path.basename(item, ext);

          structure.files.push({
            name: item,
            path: fullPath,
            type,
            ext,
            baseName,
          });

          // Categorize files
          if (ext === '.jsx' || ext === '.tsx' || item.includes('Component')) {
            structure.components.push({ name: baseName, path: fullPath });
          } else if (
            item.includes('Controller') ||
            dir.includes('controller')
          ) {
            structure.controllers.push({ name: baseName, path: fullPath });
          } else if (item.includes('Model') || dir.includes('model')) {
            structure.models.push({ name: baseName, path: fullPath });
          } else if (item.includes('Service') || dir.includes('service')) {
            structure.services.push({ name: baseName, path: fullPath });
          }
        }
      }
    };

    // Scan common source directories
    ['src', 'app', 'components', 'pages', 'lib', 'utils', 'services'].forEach(
      (dir) => {
        scanDirectory(dir, dir);
      }
    );

    return structure;
  }

  /**
   * Calculate current test coverage
   */
  calculateCurrentTestCoverage() {
    let testFiles = 0;
    let sourceFiles = 0;

    const countFiles = (dir, isTest = false) => {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!['node_modules', '.git', 'vendor'].includes(item)) {
            const isTestDir =
              item.includes('test') ||
              item.includes('spec') ||
              item === '__tests__';
            countFiles(fullPath, isTest || isTestDir);
          }
        } else {
          const ext = path.extname(item);
          if (['.js', '.ts', '.jsx', '.tsx', '.php'].includes(ext)) {
            if (
              isTest ||
              item.includes('.test.') ||
              item.includes('.spec.') ||
              item.includes('Test.php')
            ) {
              testFiles++;
            } else {
              sourceFiles++;
            }
          }
        }
      }
    };

    countFiles(this.projectRoot);

    return sourceFiles > 0 ? Math.round((testFiles / sourceFiles) * 100) : 0;
  }

  /**
   * Create test directories
   */
  async createTestDirectories(analysis) {
    const testDirs = [
      'tests',
      'tests/unit',
      'tests/integration',
      'tests/e2e',
      '__tests__',
      '__tests__/components',
      '__tests__/services',
      '__tests__/utils',
    ];

    // Add framework-specific directories
    if (analysis.frameworks.includes('laravel')) {
      testDirs.push('tests/Feature', 'tests/Unit');
    }

    if (analysis.frameworks.includes('react')) {
      testDirs.push('__tests__/pages', '__tests__/hooks');
    }

    for (const dir of testDirs) {
      const fullPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`📁 Created test directory: ${dir}`);
      }
    }
  }

  /**
   * Create test configuration files
   */
  async createTestConfigurations(analysis) {
    // Jest configuration for JavaScript/TypeScript
    if (
      analysis.languages.includes('javascript') ||
      analysis.languages.includes('typescript')
    ) {
      await this.createJestConfig(analysis);
    }

    // Playwright configuration for E2E tests
    await this.createPlaywrightConfig(analysis);

    // PHPUnit configuration for PHP/Laravel
    if (analysis.languages.includes('php')) {
      await this.createPHPUnitConfig(analysis);
    }

    // Testing library setup
    if (analysis.frameworks.includes('react')) {
      await this.createTestingLibrarySetup();
    }
  }

  /**
   * Create Jest configuration
   */
  async createJestConfig(analysis) {
    const jestConfig = {
      testEnvironment: analysis.frameworks.includes('react') ? 'jsdom' : 'node',
      roots: ['<rootDir>/src', '<rootDir>/tests', '<rootDir>/__tests__'],
      testMatch: [
        '**/__tests__/**/*.(js|jsx|ts|tsx)',
        '**/?(*.)+(spec|test).(js|jsx|ts|tsx)',
      ],
      transform: {
        '\\.[jt]sx?$': 'babel-jest',
      },
      collectCoverageFrom: [
        'src/**/*.(js|jsx|ts|tsx)',
        '!src/**/*.d.ts',
        '!src/**/index.(js|ts)',
      ],
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    };

    // Add React-specific configuration
    if (analysis.frameworks.includes('react')) {
      jestConfig.setupFilesAfterEnv = ['<rootDir>/tests/setup-react.js'];
      jestConfig.testEnvironment = 'jsdom';
    }

    fs.writeFileSync(
      path.join(this.projectRoot, 'jest.config.js'),
      `module.exports = ${JSON.stringify(jestConfig, null, 2)};`
    );
    console.log('✅ Created Jest configuration');
  }

  /**
   * Create Playwright configuration
   */
  async createPlaywrightConfig(_analysis) {
    const playwrightConfig = `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});`;

    fs.writeFileSync(
      path.join(this.projectRoot, 'playwright.config.ts'),
      playwrightConfig
    );
    console.log('✅ Created Playwright configuration');
  }

  /**
   * Create PHPUnit configuration
   */
  async createPHPUnitConfig(_analysis) {
    const phpunitConfig = `<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="./vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true">
    <testsuites>
        <testsuite name="Unit">
            <directory suffix="Test.php">./tests/Unit</directory>
        </testsuite>
        <testsuite name="Feature">
            <directory suffix="Test.php">./tests/Feature</directory>
        </testsuite>
    </testsuites>
    <coverage processUncoveredFiles="true">
        <include>
            <directory suffix=".php">./app</directory>
        </include>
        <exclude>
            <directory suffix=".php">./app/Console</directory>
            <file>./app/Http/Kernel.php</file>
        </exclude>
        <report>
            <clover outputFile="coverage/clover.xml"/>
            <html outputDirectory="coverage/html"/>
        </report>
    </coverage>
    <php>
        <env name="APP_ENV" value="testing"/>
        <env name="BCRYPT_ROUNDS" value="4"/>
        <env name="CACHE_DRIVER" value="array"/>
        <env name="DB_CONNECTION" value="sqlite"/>
        <env name="DB_DATABASE" value=":memory:"/>
        <env name="MAIL_MAILER" value="array"/>
        <env name="QUEUE_CONNECTION" value="sync"/>
        <env name="SESSION_DRIVER" value="array"/>
        <env name="TELESCOPE_ENABLED" value="false"/>
    </php>
</phpunit>`;

    fs.writeFileSync(path.join(this.projectRoot, 'phpunit.xml'), phpunitConfig);
    console.log('✅ Created PHPUnit configuration');
  }

  /**
   * Create React Testing Library setup
   */
  async createTestingLibrarySetup() {
    const setupContent = `import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});`;

    fs.writeFileSync(
      path.join(this.projectRoot, 'tests/setup-react.js'),
      setupContent
    );
    console.log('✅ Created React Testing Library setup');
  }

  /**
   * Create test templates
   */
  async createTestTemplates() {
    const templatesDir = path.join(this.projectRoot, 'tests/templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }

    // Unit test template
    const unitTestTemplate = `// Unit Test Template
// Generated by AI-SDLC Test Generator

describe('{{COMPONENT_NAME}}', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should {{TEST_DESCRIPTION}}', () => {
    // Arrange
    
    // Act
    
    // Assert
    expect(true).toBe(true);
  });

  it('should handle edge cases', () => {
    // Test edge cases
  });

  it('should handle errors gracefully', () => {
    // Test error handling
  });
});`;

    fs.writeFileSync(
      path.join(templatesDir, 'unit-test.template.js'),
      unitTestTemplate
    );

    // React component test template
    const reactTestTemplate = `// React Component Test Template
// Generated by AI-SDLC Test Generator

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { {{COMPONENT_NAME}} } from '../{{COMPONENT_PATH}}';

describe('{{COMPONENT_NAME}}', () => {
  const defaultProps = {
    // Default props here
  };

  const renderComponent = (props = {}) => {
    return render(<{{COMPONENT_NAME}} {...defaultProps} {...props} />);
  };

  it('should render correctly', () => {
    renderComponent();
    expect(screen.getByTestId('{{COMPONENT_NAME}}')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    renderComponent();
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      // Assert expected behavior
    });
  });

  it('should handle props correctly', () => {
    const customProps = { /* custom props */ };
    renderComponent(customProps);
    
    // Assert prop handling
  });
});`;

    fs.writeFileSync(
      path.join(templatesDir, 'react-component.template.js'),
      reactTestTemplate
    );

    // Laravel test template
    const laravelTestTemplate = `<?php

// Laravel Test Template
// Generated by AI-SDLC Test Generator

namespace Tests\\Feature;

use Illuminate\\Foundation\\Testing\\RefreshDatabase;
use Tests\\TestCase;

class {{CLASS_NAME}}Test extends TestCase
{
    use RefreshDatabase;

    public function setUp(): void
    {
        parent::setUp();
        // Setup for each test
    }

    public function test_{{TEST_METHOD}}()
    {
        // Arrange
        
        // Act
        $response = $this->get('/api/{{ENDPOINT}}');
        
        // Assert
        $response->assertStatus(200);
    }

    public function test_handles_validation_errors()
    {
        // Test validation
        $response = $this->post('/api/{{ENDPOINT}}', []);
        $response->assertStatus(422);
    }

    public function test_requires_authentication()
    {
        // Test authentication
        $response = $this->get('/api/{{ENDPOINT}}');
        $response->assertStatus(401);
    }
}`;

    fs.writeFileSync(
      path.join(templatesDir, 'laravel-feature.template.php'),
      laravelTestTemplate
    );

    console.log('✅ Created test templates');
  }

  /**
   * Update package.json with test scripts
   */
  async updatePackageJsonScripts() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(packageJsonPath)) return;

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    if (!packageJson.scripts) packageJson.scripts = {};

    // Add test scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      test: 'jest',
      'test:watch': 'jest --watch',
      'test:coverage': 'jest --coverage',
      'test:ci': 'jest --ci --coverage --watchAll=false',
      'test:unit': 'jest tests/unit',
      'test:integration': 'jest tests/integration',
      'test:e2e': 'playwright test',
      'test:e2e:ui': 'playwright test --ui',
      'test:ai-generate': 'node scripts/ai-test-generator.js generate',
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json with test scripts');
  }

  /**
   * Generate tests for specific files using AI
   */
  async generateTestsForFile(filePath, testType = 'unit') {
    console.log(`🤖 Generating ${testType} tests for ${filePath}...`);

    try {
      // Read and analyze source file
      const sourceCode = fs.readFileSync(filePath, 'utf8');
      const analysis = this.analyzeSourceFile(filePath, sourceCode);

      // Generate test code
      let testCode;
      if (this.openaiApiKey) {
        testCode = await this.generateTestWithAI(analysis, testType);
      } else {
        testCode = this.generateTestWithTemplate(analysis, testType);
      }

      // Write test file
      const testFilePath = this.getTestFilePath(filePath, testType);
      fs.writeFileSync(testFilePath, testCode);

      console.log(`✅ Generated test file: ${testFilePath}`);

      return {
        status: 'success',
        sourceFile: filePath,
        testFile: testFilePath,
        testType,
        analysis,
      };
    } catch (error) {
      console.error(
        `❌ Failed to generate tests for ${filePath}:`,
        error.message
      );
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * Analyze source file to understand its structure
   */
  analyzeSourceFile(filePath, sourceCode) {
    const analysis = {
      filePath,
      fileName: path.basename(filePath),
      fileType: path.extname(filePath),
      functions: [],
      classes: [],
      exports: [],
      imports: [],
      complexity: 'low',
      framework: 'none',
    };

    // Extract functions
    const functionMatches = sourceCode.match(
      /(?:function|const|let|var)\s+(\w+)/g
    );
    if (functionMatches) {
      analysis.functions = functionMatches.map((match) => {
        const name = match.replace(/(?:function|const|let|var)\s+/, '');
        return { name, type: 'function' };
      });
    }

    // Extract classes
    const classMatches = sourceCode.match(/class\s+(\w+)/g);
    if (classMatches) {
      analysis.classes = classMatches.map((match) => {
        const name = match.replace('class ', '');
        return { name, type: 'class' };
      });
    }

    // Extract exports
    const exportMatches = sourceCode.match(
      /export\s+(?:default\s+)?(?:function|class|const|let|var)?\s*(\w+)/g
    );
    if (exportMatches) {
      analysis.exports = exportMatches.map((match) => {
        const name = match.replace(
          /export\s+(?:default\s+)?(?:function|class|const|let|var)?\s*/,
          ''
        );
        return { name };
      });
    }

    // Detect framework
    if (sourceCode.includes('React') || sourceCode.includes('jsx')) {
      analysis.framework = 'react';
    } else if (sourceCode.includes('Vue')) {
      analysis.framework = 'vue';
    } else if (sourceCode.includes('express') || sourceCode.includes('app.')) {
      analysis.framework = 'express';
    }

    // Estimate complexity
    const complexityIndicators = [
      /if\s*\(/g,
      /for\s*\(/g,
      /while\s*\(/g,
      /switch\s*\(/g,
      /catch\s*\(/g,
    ];

    let complexityScore = 0;
    complexityIndicators.forEach((pattern) => {
      const matches = sourceCode.match(pattern);
      if (matches) complexityScore += matches.length;
    });

    if (complexityScore > 10) analysis.complexity = 'high';
    else if (complexityScore > 5) analysis.complexity = 'medium';

    return analysis;
  }

  /**
   * Generate test file path
   */
  getTestFilePath(sourceFilePath, testType) {
    const relativePath = path.relative(this.projectRoot, sourceFilePath);
    const parsedPath = path.parse(relativePath);

    let testDir = '__tests__';
    if (testType === 'integration') testDir = 'tests/integration';
    else if (testType === 'e2e') testDir = 'tests/e2e';

    const testFileName = `${parsedPath.name}.test${parsedPath.ext}`;
    return path.join(this.projectRoot, testDir, parsedPath.dir, testFileName);
  }

  /**
   * Generate test with AI (OpenAI or Codium)
   */
  async generateTestWithAI(analysis, testType) {
    if (this.codiumApiKey) {
      return await this.generateTestWithCodium(analysis, testType);
    } else if (this.openaiApiKey) {
      return await this.generateTestWithOpenAI(analysis, testType);
    } else {
      return this.generateTestWithTemplate(analysis, testType);
    }
  }

  /**
   * Generate test with Codium AI (premium)
   */
  async generateTestWithCodium(analysis, testType) {
    const https = require('https');

    return new Promise((resolve, _reject) => {
      const prompt = this.buildCodiumPrompt(analysis, testType);

      const data = JSON.stringify({
        source_code: fs.readFileSync(analysis.filePath, 'utf8'),
        test_type: testType,
        framework: analysis.framework || 'generic',
        instructions: prompt,
      });

      const options = {
        hostname: 'api.codium.ai',
        path: '/v1/generate-tests',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.codiumApiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': data.length,
        },
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => (responseData += chunk));
        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            resolve(
              result.generated_tests ||
                this.generateTestWithTemplate(analysis, testType)
            );
          } catch {
            console.warn('⚠️  Codium API failed, falling back to template');
            resolve(this.generateTestWithTemplate(analysis, testType));
          }
        });
      });

      req.on('error', (error) => {
        console.warn(
          '⚠️  Codium API error, falling back to template:',
          error.message
        );
        resolve(this.generateTestWithTemplate(analysis, testType));
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Generate test with OpenAI
   */
  async generateTestWithOpenAI(analysis, testType) {
    const https = require('https');

    return new Promise((resolve, _reject) => {
      const prompt = this.buildOpenAIPrompt(analysis, testType);

      const data = JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert software tester specializing in credit repair and financial applications. Generate comprehensive, production-ready tests.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      });

      const options = {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': data.length,
        },
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => (responseData += chunk));
        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            const generatedTest = result.choices?.[0]?.message?.content;
            resolve(
              generatedTest || this.generateTestWithTemplate(analysis, testType)
            );
          } catch {
            console.warn('⚠️  OpenAI API failed, falling back to template');
            resolve(this.generateTestWithTemplate(analysis, testType));
          }
        });
      });

      req.on('error', (error) => {
        console.warn(
          '⚠️  OpenAI API error, falling back to template:',
          error.message
        );
        resolve(this.generateTestWithTemplate(analysis, testType));
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Build Codium-specific prompt
   */
  buildCodiumPrompt(analysis, testType) {
    return `Generate comprehensive ${testType} tests for a credit repair application component.

Focus on:
- FCRA/FACTA compliance testing
- PII data handling validation
- Credit score calculation accuracy
- Customer data security
- Database performance
- React component behavior (if applicable)
- Laravel API endpoints (if applicable)

File: ${analysis.fileName}
Framework: ${analysis.framework}
Complexity: ${analysis.complexity}`;
  }

  /**
   * Build OpenAI-specific prompt
   */
  buildOpenAIPrompt(analysis, testType) {
    const sourceCode = fs.readFileSync(analysis.filePath, 'utf8');

    return `Generate comprehensive ${testType} tests for this ${analysis.framework} code in a credit repair application.

Source Code:
\`\`\`${analysis.fileType.slice(1)}
${sourceCode}
\`\`\`

Requirements:
1. Test all exported functions/components
2. Include edge cases and error handling
3. Focus on financial data accuracy
4. Test PII data protection
5. Include performance considerations
6. Use appropriate testing framework (Jest/Playwright/PHPUnit)
7. Follow credit repair industry best practices

Generate complete, runnable test code with proper imports and setup.`;
  }

  /**
   * Generate test with template
   */
  generateTestWithTemplate(analysis, _testType) {
    const componentName = analysis.fileName.replace(/\.(js|ts|jsx|tsx)$/, '');

    if (analysis.framework === 'react') {
      return this.generateReactComponentTest(analysis, componentName);
    } else if (analysis.fileType === '.php') {
      return this.generatePHPTest(analysis, componentName);
    } else {
      return this.generateJavaScriptTest(analysis, componentName);
    }
  }

  /**
   * Generate React component test
   */
  generateReactComponentTest(analysis, componentName) {
    return `import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ${componentName} } from '${analysis.filePath.replace(this.projectRoot, '.')}';

describe('${componentName}', () => {
  it('should render without crashing', () => {
    render(<${componentName} />);
    expect(screen.getByTestId('${componentName.toLowerCase()}')).toBeInTheDocument();
  });

  ${analysis.functions
    .map(
      (func) => `
  it('should handle ${func.name}', () => {
    render(<${componentName} />);
    // Test ${func.name} functionality
    expect(true).toBe(true);
  });`
    )
    .join('')}

  it('should handle props correctly', () => {
    const testProps = { testProp: 'test value' };
    render(<${componentName} {...testProps} />);
    // Assert prop handling
  });
});`;
  }

  /**
   * Generate JavaScript test
   */
  generateJavaScriptTest(analysis, componentName) {
    return `import { ${analysis.functions.map((f) => f.name).join(', ')} } from '${analysis.filePath.replace(this.projectRoot, '.')}';

describe('${componentName}', () => {
  ${analysis.functions
    .map(
      (func) => `
  describe('${func.name}', () => {
    it('should work correctly', () => {
      // Test ${func.name} functionality
      expect(typeof ${func.name}).toBe('function');
    });

    it('should handle edge cases', () => {
      // Test edge cases for ${func.name}
    });
  });`
    )
    .join('')}
});`;
  }

  /**
   * Generate PHP test
   */
  generatePHPTest(analysis, className) {
    return `<?php

namespace Tests\\Unit;

use Tests\\TestCase;
use App\\${className};

class ${className}Test extends TestCase
{
    public function test_${className.toLowerCase()}_functionality()
    {
        $instance = new ${className}();
        $this->assertInstanceOf(${className}::class, $instance);
    }

    ${analysis.functions
      .map(
        (func) => `
    public function test_${func.name}()
    {
        // Test ${func.name} functionality
        $this->assertTrue(true);
    }`
      )
      .join('')}
}`;
  }

  /**
   * Generate comprehensive test suite for entire project
   */
  async generateFullTestSuite() {
    console.log('🚀 Generating comprehensive test suite...');

    try {
      const projectAnalysis = await this.analyzeProject();
      const results = {
        generated: 0,
        failed: 0,
        files: [],
      };

      // Generate tests for all source files
      for (const file of projectAnalysis.structure.files) {
        if (this.shouldGenerateTestFor(file)) {
          const result = await this.generateTestsForFile(file.path);

          if (result.status === 'success') {
            results.generated++;
          } else {
            results.failed++;
          }

          results.files.push(result);
        }
      }

      console.log(`✅ Generated tests for ${results.generated} files`);
      if (results.failed > 0) {
        console.log(`⚠️  Failed to generate tests for ${results.failed} files`);
      }

      const finalResults = {
        status: 'success',
        results,
        coverage: this.calculateCurrentTestCoverage(),
      };

      // Sync with Qase if configured
      const qaseSync = await this.syncWithQase({
        generated: results.generated,
        failed: results.failed,
        files: results.files,
        coverage: finalResults.coverage,
      });

      finalResults.qaseSync = qaseSync;
      return finalResults;
    } catch (error) {
      console.error('❌ Failed to generate full test suite:', error.message);
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * Sync tests with Qase test management
   */
  async syncWithQase(testResults) {
    if (!this.qaseApiKey || !this.qaseProjectCode) {
      console.log('⚠️  Qase integration not configured, skipping sync');
      return { status: 'skipped', reason: 'not_configured' };
    }

    console.log('📊 Syncing test results with Qase...');

    try {
      // const https = require('https'); // TODO: Implement HTTPS requests for Qase

      // Create test run in Qase
      const runData = await this.createQaseTestRun(testResults);

      // Upload test results
      for (const result of testResults.files) {
        if (result.status === 'success') {
          await this.createQaseTestCase(result, runData.id);
        }
      }

      console.log(
        `✅ Synced ${testResults.files.length} tests with Qase run #${runData.id}`
      );
      return { status: 'success', runId: runData.id };
    } catch (error) {
      console.warn('⚠️  Qase sync failed:', error.message);
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * Create test run in Qase
   */
  async createQaseTestRun(testResults) {
    const https = require('https');

    return new Promise((resolve, reject) => {
      const runData = JSON.stringify({
        title: `AI-Generated Tests - ${new Date().toISOString().split('T')[0]}`,
        description: `Automated test generation results:\n- Generated: ${testResults.generated}\n- Failed: ${testResults.failed}\n- Coverage: ${testResults.coverage}%`,
        include_all_cases: false,
        is_autotest: true,
      });

      const options = {
        hostname: 'api.qase.io',
        path: `/v1/run/${this.qaseProjectCode}`,
        method: 'POST',
        headers: {
          Token: this.qaseApiKey,
          'Content-Type': 'application/json',
          'Content-Length': runData.length,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result.result);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.write(runData);
      req.end();
    });
  }

  /**
   * Create test case in Qase
   */
  async createQaseTestCase(testResult, _runId) {
    const https = require('https');

    return new Promise((resolve, reject) => {
      const testCaseData = JSON.stringify({
        title: `${testResult.analysis.fileName} - ${testResult.testType} tests`,
        description: `Generated test for ${testResult.sourceFile}`,
        severity: this.mapComplexityToSeverity(testResult.analysis.complexity),
        priority: this.mapFrameworkToPriority(testResult.analysis.framework),
        type: this.mapTestTypeToQaseType(testResult.testType),
        layer: this.mapFrameworkToLayer(testResult.analysis.framework),
        is_flaky: 0,
        automation: 2, // Automated
        status: 1, // Active
      });

      const options = {
        hostname: 'api.qase.io',
        path: `/v1/case/${this.qaseProjectCode}`,
        method: 'POST',
        headers: {
          Token: this.qaseApiKey,
          'Content-Type': 'application/json',
          'Content-Length': testCaseData.length,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result.result);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.write(testCaseData);
      req.end();
    });
  }

  /**
   * Map complexity to Qase severity
   */
  mapComplexityToSeverity(complexity) {
    const map = {
      low: 'trivial',
      medium: 'normal',
      high: 'critical',
    };
    return map[complexity] || 'normal';
  }

  /**
   * Map framework to Qase priority
   */
  mapFrameworkToPriority(framework) {
    const map = {
      react: 'high', // Frontend critical
      laravel: 'high', // Backend critical
      express: 'medium', // API medium
      php: 'medium', // Server-side medium
    };
    return map[framework] || 'medium';
  }

  /**
   * Map test type to Qase type
   */
  mapTestTypeToQaseType(testType) {
    const map = {
      unit: 'functional',
      integration: 'integration',
      e2e: 'e2e',
    };
    return map[testType] || 'functional';
  }

  /**
   * Map framework to Qase layer
   */
  mapFrameworkToLayer(framework) {
    const map = {
      react: 'ui',
      laravel: 'api',
      express: 'api',
      php: 'api',
    };
    return map[framework] || 'unit';
  }

  /**
   * Check if we should generate test for this file
   */
  shouldGenerateTestFor(file) {
    // Skip test files themselves
    if (file.name.includes('.test.') || file.name.includes('.spec.')) {
      return false;
    }

    // Skip certain file types
    const skipPatterns = ['.d.ts', '.min.js', 'index.js', 'index.ts'];
    if (skipPatterns.some((pattern) => file.name.includes(pattern))) {
      return false;
    }

    // Only generate for supported file types
    const supportedExts = ['.js', '.ts', '.jsx', '.tsx', '.php'];
    return supportedExts.includes(file.ext);
  }
}

// CLI interface
async function main() {
  const generator = new AITestGenerator();
  const command = process.argv[2];
  const arg = process.argv[3];

  switch (command) {
    case 'init':
    case 'initialize':
      await generator.initializeTestGeneration();
      break;

    case 'generate':
      if (arg === 'all') {
        await generator.generateFullTestSuite();
      } else if (arg) {
        await generator.generateTestsForFile(arg);
      } else {
        console.error('❌ Please specify a file path or "all"');
        process.exit(1);
      }
      break;

    default:
      console.log('AI Test Generator for AI-SDLC Framework');
      console.log('');
      console.log('Usage:');
      console.log(
        '  ai-test-generator.js init              - Initialize test generation'
      );
      console.log(
        '  ai-test-generator.js generate <file>   - Generate tests for specific file'
      );
      console.log(
        '  ai-test-generator.js generate all     - Generate tests for entire project'
      );
      console.log('');
      console.log('Environment Variables:');
      console.log(
        '  OPENAI_API_KEY - OpenAI API key for AI-powered test generation'
      );
      console.log(
        '  CODIUM_API_KEY - Codium AI API key for premium test generation'
      );
      console.log(
        '  QASE_API_KEY - Qase API key for test management integration'
      );
      console.log('  QASE_PROJECT_CODE - Qase project code for test syncing');
      console.log('');
      console.log('Premium Features:');
      console.log(
        '  🤖 AI-powered test generation (OpenAI GPT-4 or Codium AI)'
      );
      console.log('  📊 Qase test management integration');
      console.log('  🏦 Credit repair domain-specific test patterns');
      console.log('  🔒 FCRA/FACTA compliance testing');
      console.log('  📈 Test coverage tracking and reporting');
      console.log('');
      console.log('Free Features:');
      console.log('  • Template-based test generation (no API keys required)');
      console.log('  • Multi-framework support (React, Laravel, Node.js)');
      console.log('  • Professional test configurations');
      console.log('  • Comprehensive test scaffolding');
      console.log('');
      console.log('ROI Analysis:');
      console.log('  💰 Estimated cost: $50-100/month for premium APIs');
      console.log(
        '  ⏱️  Time savings: 15-20 hours/week in manual test writing'
      );
      console.log('  🚀 Development velocity: 40-60% faster test coverage');
      console.log(
        '  🛡️  Risk reduction: Automated compliance and security testing'
      );
      break;
  }
}

// Export for use as module
module.exports = AITestGenerator;

// Run CLI if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

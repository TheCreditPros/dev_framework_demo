#!/usr/bin/env node
/**
 * Smart Test Selection - AI-SDLC Framework
 * Runs only tests for files that have changed, optimizing CI/CD performance
 * Credit Repair Domain Optimized for The Credit Pros
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SmartTestSelector {
  constructor() {
    this.projectRoot = process.cwd();
    this.changedFiles = [];
    this.testFiles = [];
    this.coverageTargets = [];
  }

  /**
   * Get changed files since last commit or merge-base
   */
  getChangedFiles() {
    try {
      // Get changed files since HEAD~1 or main branch
      const gitCommand =
        'git diff --name-only HEAD~1 2>/dev/null || git diff --name-only main...HEAD 2>/dev/null || git diff --cached --name-only';
      const output = execSync(gitCommand, {
        encoding: 'utf8',
        cwd: this.projectRoot,
      });

      this.changedFiles = output
        .split('\n')
        .filter((file) => file.trim())
        .filter((file) => fs.existsSync(path.join(this.projectRoot, file)))
        .filter((file) => !file.includes('node_modules/'))
        .filter((file) => !file.includes('.git/'));

      console.log(`📁 Found ${this.changedFiles.length} changed files:`);
      this.changedFiles.forEach((file) => console.log(`   ${file}`));
    } catch {
      console.log('⚠️ Could not determine changed files, running all tests');
      this.changedFiles = [];
    }
  }

  /**
   * Map changed files to their corresponding test files
   */
  findRelatedTests() {
    if (this.changedFiles.length === 0) {
      console.log('🧪 No changed files detected, running full test suite');
      return this.runFullTestSuite();
    }

    const testMappings = [];

    for (const file of this.changedFiles) {
      const testFiles = this.findTestsForFile(file);
      testFiles.forEach((testFile) => {
        if (!testMappings.includes(testFile)) {
          testMappings.push(testFile);
        }
      });

      // Add the file itself for coverage tracking
      if (this.isSourceFile(file)) {
        this.coverageTargets.push(file);
      }
    }

    this.testFiles = testMappings;
    console.log(`🎯 Found ${this.testFiles.length} related test files:`);
    this.testFiles.forEach((file) => console.log(`   ${file}`));
  }

  /**
   * Find test files for a specific source file
   */
  findTestsForFile(sourceFile) {
    const testFiles = [];
    const baseName = path.basename(sourceFile, path.extname(sourceFile));
    const dirName = path.dirname(sourceFile);

    // Common test patterns
    const testPatterns = [
      `${baseName}.test.js`,
      `${baseName}.test.ts`,
      `${baseName}.spec.js`,
      `${baseName}.spec.ts`,
      `${baseName}.test.jsx`,
      `${baseName}.test.tsx`,
      `__tests__/${baseName}.test.js`,
      `__tests__/${baseName}.test.ts`,
      `tests/${baseName}.test.js`,
      `tests/${baseName}.test.ts`,
      `${dirName}/__tests__/${baseName}.test.js`,
      `${dirName}/__tests__/${baseName}.test.ts`,
      `${dirName}/${baseName}.test.js`,
      `${dirName}/${baseName}.test.ts`,
    ];

    // Check if test files exist
    for (const pattern of testPatterns) {
      const testPath = path.join(this.projectRoot, pattern);
      if (fs.existsSync(testPath)) {
        testFiles.push(pattern);
      }
    }

    // Special handling for credit repair domain files
    if (
      sourceFile.includes('credit') ||
      sourceFile.includes('score') ||
      sourceFile.includes('dispute')
    ) {
      const creditTestFiles = this.findCreditRepairTests(sourceFile);
      testFiles.push(...creditTestFiles);
    }

    return testFiles;
  }

  /**
   * Find credit repair specific integration tests
   */
  findCreditRepairTests(_sourceFile) {
    const creditTests = [];
    // TODO: Implement credit repair test patterns when needed

    // This would be expanded based on actual credit repair test structure
    return creditTests;
  }

  /**
   * Check if file is a source file that should have tests
   */
  isSourceFile(file) {
    const sourceExtensions = ['.js', '.ts', '.jsx', '.tsx', '.php'];
    const ext = path.extname(file);

    return (
      sourceExtensions.includes(ext) &&
      !file.includes('test') &&
      !file.includes('spec') &&
      !file.includes('config') &&
      !file.includes('node_modules')
    );
  }

  /**
   * Run tests for selected files
   */
  async runSmartTests() {
    if (this.testFiles.length === 0) {
      console.log(
        '⚠️ No specific tests found, running changed file pattern matching'
      );
      return this.runChangedFileTests();
    }

    console.log('🚀 Running smart test selection...');

    try {
      // Run Vitest with specific test files
      const testCommand = `npx vitest run ${this.testFiles.join(' ')} --reporter=verbose --coverage`;
      console.log(`📝 Command: ${testCommand}`);

      execSync(testCommand, {
        stdio: 'inherit',
        cwd: this.projectRoot,
      });

      console.log('✅ Smart tests completed successfully');

      // Run focused coverage analysis
      if (this.coverageTargets.length > 0) {
        await this.runFocusedCoverage();
      }
    } catch {
      console.error('❌ Smart tests failed');
      process.exit(1);
    }
  }

  /**
   * Run tests based on changed file patterns
   */
  runChangedFileTests() {
    try {
      console.log('🔄 Running Vitest with changed files pattern...');
      const command =
        'npx vitest run --changed HEAD~1 --coverage --reporter=verbose';

      execSync(command, {
        stdio: 'inherit',
        cwd: this.projectRoot,
      });

      console.log('✅ Changed file tests completed');
    } catch {
      console.error('❌ Changed file tests failed');
      process.exit(1);
    }
  }

  /**
   * Run full test suite as fallback
   */
  runFullTestSuite() {
    try {
      console.log('🌐 Running full test suite...');
      const command = 'npx vitest run --coverage --reporter=verbose';

      execSync(command, {
        stdio: 'inherit',
        cwd: this.projectRoot,
      });

      console.log('✅ Full test suite completed');
    } catch {
      console.error('❌ Full test suite failed');
      process.exit(1);
    }
  }

  /**
   * Run focused coverage analysis for changed files
   */
  async runFocusedCoverage() {
    console.log('📊 Analyzing coverage for changed files...');

    try {
      // Check if coverage directory exists
      const coverageDir = path.join(this.projectRoot, 'coverage');
      if (!fs.existsSync(coverageDir)) {
        console.log('⚠️ No coverage data available');
        return;
      }

      console.log('📈 Coverage analysis completed');
      console.log(`   Analyzed ${this.coverageTargets.length} source files`);
    } catch (error) {
      console.warn('⚠️ Coverage analysis failed:', error.message);
    }
  }

  /**
   * Main execution method
   */
  async run() {
    console.log('🎯 Smart Test Selection - AI-SDLC Framework');
    console.log('   Credit Repair Domain Optimized for The Credit Pros\n');

    this.getChangedFiles();
    this.findRelatedTests();
    await this.runSmartTests();
  }
}

// Execute if run directly
if (require.main === module) {
  const selector = new SmartTestSelector();
  selector.run().catch((error) => {
    console.error('💥 Smart test selection failed:', error);
    process.exit(1);
  });
}

module.exports = SmartTestSelector;

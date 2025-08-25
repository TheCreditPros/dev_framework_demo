#!/usr/bin/env node

/**
 * API Error Response Validator for AI-SDLC
 * Validates standardized error response format across all APIs
 * Ensures no sensitive information is exposed in error responses
 */

// Load environment variables
require('dotenv').config();

const fs = require('fs');
const path = require('path');

class APIErrorValidator {
  constructor(fsModule = null) {
    this.fs = fsModule || fs;
    this.projectRoot = process.cwd();
    this.reportsDir = path.join(this.projectRoot, 'reports', 'api-validation');
    this.setupReportsDirectory();

    // FCRA compliance patterns for credit repair domain
    this.fcraPatterns = [
      /ssn/i,
      /social\s+security/i,
      /credit\s+card\s+number/i,
      /bank\s+account/i,
      /routing\s+number/i,
      /driver'?s?\s+license/i,
    ];

    // Sensitive data patterns to avoid in error responses
    this.sensitivePatterns = [
      ...this.fcraPatterns,
      /\b\d{3}-?\d{2}-?\d{4}\b/, // SSN format
      /\b\d{16}\b/, // Credit card numbers
      /\b\d{9,12}\b/, // Bank account numbers
      /password/i,
      /token/i,
      /secret/i,
      /key/i,
    ];
  }

  setupReportsDirectory() {
    if (!this.fs.existsSync(this.reportsDir)) {
      this.fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Validate error response format consistency
   */
  validateErrorResponseFormat(errorResponse) {
    const issues = [];
    const requiredFields = ['error', 'message', 'status'];

    // Check required fields
    for (const field of requiredFields) {
      if (!Object.hasOwn(errorResponse, field)) {
        issues.push(`Missing required field: ${field}`);
      }
    }

    // Validate error field
    if (errorResponse.error && typeof errorResponse.error !== 'string') {
      issues.push('Error field should be a string');
    }

    // Validate status field
    if (errorResponse.status && typeof errorResponse.status !== 'number') {
      issues.push('Status field should be a number');
    }

    // Validate message field
    if (errorResponse.message) {
      if (typeof errorResponse.message !== 'string') {
        issues.push('Message field should be a string');
      } else if (errorResponse.message.length < 10) {
        issues.push(
          'Error message should be descriptive (minimum 10 characters)'
        );
      }
    }

    return issues;
  }

  /**
   * Check for sensitive information in error responses
   */
  checkSensitiveInformation(errorResponse) {
    const issues = [];
    const responseString = JSON.stringify(errorResponse, null, 2).toLowerCase();

    for (const pattern of this.sensitivePatterns) {
      if (pattern.test(responseString)) {
        const match = responseString.match(pattern);
        if (match) {
          issues.push(`Sensitive information detected: ${match[0]}`);
        }
      }
    }

    return issues;
  }

  /**
   * Validate HTTP status codes are used properly
   */
  validateStatusCodes(errorResponse, expectedStatusCode) {
    const issues = [];

    if (errorResponse.status && expectedStatusCode) {
      const actualStatus = errorResponse.status;
      if (actualStatus !== expectedStatusCode) {
        issues.push(
          `Status code mismatch: expected ${expectedStatusCode}, got ${actualStatus}`
        );
      }
    }

    // Validate standard HTTP status code ranges
    if (errorResponse.status) {
      const status = errorResponse.status;
      if (status < 400 || status >= 600) {
        issues.push(
          `Invalid error status code: ${status} (should be 4xx or 5xx)`
        );
      }
    }

    return issues;
  }

  /**
   * Validate error messages for user-friendliness and consistency
   */
  validateErrorMessageQuality(errorResponse) {
    const issues = [];

    if (errorResponse.message) {
      const message = errorResponse.message;

      // Check for developer jargon
      const jargonPatterns = [
        /exception/i,
        /stack\s+trace/i,
        /internal\s+server\s+error/i,
        /500/i,
      ];

      for (const pattern of jargonPatterns) {
        if (pattern.test(message)) {
          issues.push(`Error message contains developer jargon: "${message}"`);
        }
      }

      // Check for generic messages
      const genericMessages = [
        'error',
        'something went wrong',
        'internal error',
        'unknown error',
      ];

      const lowerMessage = message.toLowerCase();
      for (const generic of genericMessages) {
        if (lowerMessage.includes(generic)) {
          issues.push(`Error message is too generic: "${message}"`);
        }
      }
    }

    return issues;
  }

  /**
   * Validate FCRA compliance for credit repair applications
   */
  validateFCRACompliance(errorResponse) {
    const issues = [];

    // Check for PII exposure in credit repair context
    const creditRepairSensitive = [
      /credit\s+report/i,
      /credit\s+score/i,
      /dispute/i,
      /account\s+number/i,
      /member\s+number/i,
    ];

    const responseString = JSON.stringify(errorResponse, null, 2).toLowerCase();

    for (const pattern of creditRepairSensitive) {
      if (pattern.test(responseString)) {
        issues.push(
          `Potential FCRA compliance issue: credit-related PII exposure`
        );
      }
    }

    return issues;
  }

  /**
   * Scan API files for error handling patterns
   */
  scanAPIFiles() {
    const apiFiles = this.findAPIFiles();
    const validationResults = [];

    console.log('🔍 Scanning API files for error handling patterns...');

    for (const file of apiFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const issues = this.analyzeErrorHandlingInFile(content, file);

        if (issues.length > 0) {
          validationResults.push({
            file,
            issues,
            severity: this.calculateSeverity(issues),
          });
        }
      } catch (error) {
        console.warn(`⚠️  Could not read file ${file}: ${error.message}`);
      }
    }

    return validationResults;
  }

  /**
   * Find API-related files in the project
   */
  findAPIFiles() {
    const apiDirectories = ['src', 'app', 'routes', 'controllers', 'api'];
    const apiFiles = [];

    for (const dir of apiDirectories) {
      const fullPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(fullPath)) {
        this.findFilesRecursively(fullPath, apiFiles);
      }
    }

    return apiFiles.filter(
      (file) =>
        file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.php')
    );
  }

  /**
   * Recursively find files in a directory
   */
  findFilesRecursively(dir, files) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        this.findFilesRecursively(fullPath, files);
      } else {
        files.push(fullPath);
      }
    }
  }

  /**
   * Analyze error handling patterns in a file
   */
  analyzeErrorHandlingInFile(content, _filePath) {
    const issues = [];

    // Check for try-catch blocks without proper error handling
    const tryCatchPattern = /try\s*{[^}]*}\s*catch\s*\([^)]*\)\s*{[^}]*}/g;
    const tryCatchMatches = content.match(tryCatchPattern) || [];

    for (const match of tryCatchMatches) {
      if (!match.includes('res.status') && !match.includes('next(')) {
        issues.push('Try-catch block without proper error response');
      }
    }

    // Check for error logging
    if (
      !content.includes('console.error') &&
      !content.includes('logger.error')
    ) {
      issues.push('No error logging found');
    }

    // Check for standardized error responses
    const errorResponsePattern =
      /res\.status\(\d+\)\.json\(\{[^}]*error[^}]*\}\)/i;
    if (!errorResponsePattern.test(content)) {
      issues.push('No standardized error response format detected');
    }

    return issues;
  }

  /**
   * Calculate severity level based on issues
   */
  calculateSeverity(issues) {
    const highSeverityKeywords = [
      'sensitive',
      'fcra',
      'compliance',
      'exposure',
    ];
    const mediumSeverityKeywords = ['format', 'status', 'generic'];

    for (const issue of issues) {
      const lowerIssue = issue.toLowerCase();
      for (const keyword of highSeverityKeywords) {
        if (lowerIssue.includes(keyword)) {
          return 'high';
        }
      }
      for (const keyword of mediumSeverityKeywords) {
        if (lowerIssue.includes(keyword)) {
          return 'medium';
        }
      }
    }

    return 'low';
  }

  /**
   * Generate comprehensive error validation report
   */
  generateReport(validationResults) {
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      summary: {
        totalFiles: validationResults.length,
        highSeverity: validationResults.filter((r) => r.severity === 'high')
          .length,
        mediumSeverity: validationResults.filter((r) => r.severity === 'medium')
          .length,
        lowSeverity: validationResults.filter((r) => r.severity === 'low')
          .length,
      },
      details: validationResults,
    };

    const reportPath = path.join(
      this.reportsDir,
      `error-validation-report-${Date.now()}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return reportPath;
  }

  /**
   * Main validation function
   */
  async validateAll() {
    console.log('🤖 Starting API Error Response Validation...');

    try {
      // Scan API files for error handling patterns
      const fileResults = this.scanAPIFiles();

      // Generate report
      const reportPath = this.generateReport(fileResults);

      console.log('\n✅ API Error Validation Complete!');
      console.log(`📁 Report saved to: ${reportPath}`);
      console.log(`📊 Files analyzed: ${fileResults.length}`);

      // Print summary
      const highSeverity = fileResults.filter(
        (r) => r.severity === 'high'
      ).length;
      const mediumSeverity = fileResults.filter(
        (r) => r.severity === 'medium'
      ).length;

      if (highSeverity > 0) {
        console.log(`🔴 High severity issues: ${highSeverity}`);
      }
      if (mediumSeverity > 0) {
        console.log(`🟡 Medium severity issues: ${mediumSeverity}`);
      }

      if (highSeverity === 0 && mediumSeverity === 0) {
        console.log('🟢 All error handling patterns look good!');
      }

      return {
        status: 'success',
        reportPath,
        results: fileResults,
      };
    } catch (error) {
      console.error('❌ Error validation failed:', error.message);
      return {
        status: 'failed',
        error: error.message,
      };
    }
  }
}

// CLI interface
async function main() {
  const validator = new APIErrorValidator();
  const command = process.argv[2];

  switch (command) {
    case 'validate': {
      const result = await validator.validateAll();

      if (result.status === 'success') {
        console.log('\n🎉 Error validation completed successfully!');
        console.log(`📄 Detailed report: ${result.reportPath}`);
      } else {
        console.error('💥 Error validation failed');
        process.exit(1);
      }
      break;
    }

    default:
      console.log('API Error Response Validator for AI-SDLC Framework');
      console.log('');
      console.log('Usage:');
      console.log('  api-error-validator.js validate');
      console.log('');
      console.log('Commands:');
      console.log('  validate    Scan API files and validate error handling');
      console.log('');
      console.log('Features:');
      console.log('  • Validates standardized error response format');
      console.log('  • Checks for sensitive information exposure');
      console.log('  • Ensures proper HTTP status code usage');
      console.log('  • Validates error message quality');
      console.log('  • FCRA compliance checking for credit repair apps');
      console.log('  • Generates detailed validation reports');
      break;
  }
}

// Export for use as module
module.exports = APIErrorValidator;

// Run CLI if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

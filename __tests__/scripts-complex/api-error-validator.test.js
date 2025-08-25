// API Error Validator Tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// Mock file system operations
vi.mock('fs');
vi.mock('child_process');

// Import the validator
const APIErrorValidator = require('../../scripts-complex/api-error-validator.js');

describe('APIErrorValidator', () => {
  let validator;
  let mockProjectRoot;

  beforeEach(() => {
    mockProjectRoot = '/mock/project';
    process.cwd = vi.fn().mockReturnValue(mockProjectRoot);

    validator = new APIErrorValidator();

    // Mock fs operations
    fs.existsSync.mockImplementation((filePath) => {
      if (filePath.includes('reports')) return true;
      if (filePath.includes('error-log.json')) return true;
      return false;
    });

    fs.readdirSync.mockImplementation((dirPath) => {
      if (dirPath === mockProjectRoot) return ['error-log.json'];
      if (dirPath === path.join(mockProjectRoot, 'logs')) return ['api-errors.log'];
      return [];
    });

    fs.readFileSync.mockImplementation((filePath) => {
      if (filePath.includes('error-log.json')) {
        return JSON.stringify({
          errors: [
            {
              timestamp: '2024-01-01T10:00:00Z',
              endpoint: '/api/users',
              method: 'GET',
              status: 400,
              error: 'validation_error',
              message: 'Invalid input provided'
            }
          ]
        });
      }
      return '';
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findErrorLogs', () => {
    it('should find error log files in common locations', () => {
      const logFiles = validator.findErrorLogs();
      expect(logFiles).toHaveLength(2);
      expect(logFiles[0]).toContain('error-log.json');
      expect(logFiles[1]).toContain('api-errors.log');
    });

    it('should return empty array when no error logs found', () => {
      fs.readdirSync.mockReturnValue([]);
      fs.existsSync.mockReturnValue(false);

      const logFiles = validator.findErrorLogs();
      expect(logFiles).toHaveLength(0);
    });
  });

  describe('validateErrorResponseFormat', () => {
    it('should validate standardized error response format', () => {
      const errorResponse = {
        error: 'validation_error',
        message: 'The provided data is invalid',
        status: 400,
        timestamp: '2024-01-01T10:00:00Z',
        requestId: 'req-123'
      };

      const issues = validator.validateErrorResponseFormat(errorResponse);
      expect(issues).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const errorResponse = {
        message: 'Something went wrong'
      };

      const issues = validator.validateErrorResponseFormat(errorResponse);

      expect(issues).toContain('Missing required field: error');
      expect(issues).toContain('Missing required field: status');
    });

    it('should validate error response structure compliance', () => {
      const errorResponse = {
        error: 'internal_server_error',
        message: 'An unexpected error occurred',
        status: 500,
        timestamp: '2024-01-01T10:00:00Z',
        stack: 'Error: Something went wrong...' // Should not be exposed
      };

      const issues = validator.validateErrorResponseFormat(errorResponse);
      expect(issues).toContain('Sensitive field "stack" should not be exposed in error responses');
    });
  });

  describe('validateUserFriendliness', () => {
    it('should validate user-friendly error messages', () => {
      const errorResponse = {
        message: 'Unable to process your request. Please check your input and try again.'
      };

      const issues = validator.validateUserFriendliness(errorResponse);
      expect(issues).toHaveLength(0);
    });

    it('should detect developer jargon in error messages', () => {
      const errorResponse = {
        message: 'NullPointerException occurred in UserService.processUser()'
      };

      const issues = validator.validateUserFriendliness(errorResponse);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0]).toContain('Error message contains developer jargon');
    });

    it('should detect generic error messages', () => {
      const errorResponse = {
        message: 'Something went wrong'
      };

      const issues = validator.validateUserFriendliness(errorResponse);
      expect(issues).toContain('Error message is too generic: "Something went wrong"');
    });
  });

  describe('checkSensitiveInformation', () => {
    it('should detect sensitive information in error responses', () => {
      const errorResponse = {
        error: 'credit_report_error',
        message: 'Failed to retrieve credit report for SSN 123-45-6789',
        status: 500
      };

      const issues = validator.checkSensitiveInformation(errorResponse);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0]).toContain('Sensitive information detected');
    });

    it('should detect database connection strings in errors', () => {
      const errorResponse = {
        error: 'database_error',
        message: 'Connection failed: postgresql://user:pass@localhost:5432/db',
        status: 500
      };

      const issues = validator.checkSensitiveInformation(errorResponse);
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should not flag non-sensitive error messages', () => {
      const errorResponse = {
        error: 'validation_error',
        message: 'Invalid input provided',
        status: 400
      };

      const issues = validator.checkSensitiveInformation(errorResponse);
      expect(issues).toHaveLength(0);
    });
  });

  describe('validateHTTPStatusCodes', () => {
    it('should validate proper HTTP status codes', () => {
      const issues = validator.validateHTTPStatusCodes(400);
      expect(issues).toHaveLength(0);
    });

    it('should detect invalid status codes', () => {
      const issues = validator.validateHTTPStatusCodes(999);
      expect(issues).toContain('Invalid HTTP status code: 999');
    });

    it('should validate error status code ranges', () => {
      const issues = validator.validateHTTPStatusCodes(200);
      expect(issues).toContain('Status code 200 is not an error status (should be 4xx or 5xx)');
    });
  });

  describe('FCRA Compliance Validation', () => {
    it('should detect FCRA compliance violations in error responses', () => {
      const errorResponse = {
        error: 'credit_data_access_error',
        message: 'Failed to retrieve credit data for user with SSN 123-45-6789',
        status: 500
      };

      const issues = validator.checkSensitiveInformation(errorResponse);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some(issue => issue.includes('FCRA'))).toBe(true);
    });

    it('should validate that error responses do not expose PII in credit repair context', () => {
      const errorResponse = {
        error: 'user_not_found',
        message: 'User account not found',
        status: 404
      };

      const issues = validator.checkSensitiveInformation(errorResponse);
      expect(issues).toHaveLength(0);
    });

    it('should detect credit score exposure in error messages', () => {
      const errorResponse = {
        error: 'credit_calculation_error',
        message: 'Failed to calculate score: 750 for user',
        status: 500
      };

      const issues = validator.checkSensitiveInformation(errorResponse);
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeErrorPatterns', () => {
    it('should identify recurring error patterns', () => {
      const errorLogs = [
        { error: 'validation_error', endpoint: '/api/users', count: 15 },
        { error: 'auth_error', endpoint: '/api/auth/login', count: 8 },
        { error: 'database_error', endpoint: '/api/reports', count: 3 }
      ];

      const patterns = validator.analyzeErrorPatterns(errorLogs);
      expect(patterns).toHaveLength(3);
      expect(patterns[0].error).toBe('validation_error');
      expect(patterns[0].severity).toBe('high');
    });

    it('should categorize error severity levels', () => {
      const errorLogs = [
        { error: 'validation_error', count: 5 },
        { error: 'auth_error', count: 25 },
        { error: 'database_error', count: 2 }
      ];

      const patterns = validator.analyzeErrorPatterns(errorLogs);

      const authPattern = patterns.find(p => p.error === 'auth_error');
      const validationPattern = patterns.find(p => p.error === 'validation_error');
      const dbPattern = patterns.find(p => p.error === 'database_error');

      expect(authPattern.severity).toBe('critical');
      expect(validationPattern.severity).toBe('medium');
      expect(dbPattern.severity).toBe('high');
    });
  });

  describe('Integration Tests', () => {
    it('should validate complete error handling workflow', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await validator.validate();

      expect(result.status).toBe('success');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('API Error Validation Complete'));

      consoleSpy.mockRestore();
    });

    it('should generate comprehensive error analysis reports', async () => {
      const result = await validator.validateAll();

      expect(result.status).toBe('success');
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large error log files efficiently', async () => {
      // Mock a large error log
      const largeErrorLog = {
        errors: []
      };

      // Generate many errors
      for (let i = 0; i < 1000; i++) {
        largeErrorLog.errors.push({
          timestamp: new Date().toISOString(),
          endpoint: `/api/resource${i % 100}`,
          method: 'GET',
          status: 400 + (i % 100),
          error: `error_${i}`,
          message: `Error message ${i}`
        });
      }

      fs.readFileSync.mockImplementation(() => JSON.stringify(largeErrorLog));

      const startTime = Date.now();
      const patterns = validator.analyzeErrorPatterns(largeErrorLog.errors);
      const endTime = Date.now();

      // Should complete within reasonable time (less than 2 seconds)
      expect(endTime - startTime).toBeLessThan(2000);
      expect(Array.isArray(patterns)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed error log files gracefully', () => {
      fs.readFileSync.mockImplementation(() => 'invalid json content');

      const logFiles = validator.findErrorLogs();
      expect(logFiles).toHaveLength(2);
    });

    it('should handle empty error log files', () => {
      fs.readFileSync.mockImplementation(() => '');

      const logFiles = validator.findErrorLogs();
      expect(logFiles).toHaveLength(2);
    });

    it('should validate error responses with missing optional fields', () => {
      const errorResponse = {
        error: 'validation_error',
        message: 'Invalid input',
        status: 400
        // Missing timestamp and requestId (optional)
      };

      const issues = validator.validateErrorResponseFormat(errorResponse);
      expect(issues).toHaveLength(0); // Should pass as optional fields are not required
    });
  });

  describe('Security Validation', () => {
    it('should detect SQL injection attempts in error messages', () => {
      const errorResponse = {
        error: 'database_error',
        message: "SQL Error: SELECT * FROM users WHERE id = '1' OR '1'='1'",
        status: 500
      };

      const issues = validator.checkSensitiveInformation(errorResponse);
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should detect path disclosure in error messages', () => {
      const errorResponse = {
        error: 'file_error',
        message: 'File not found: /var/www/html/config/database.php',
        status: 500
      };

      const issues = validator.checkSensitiveInformation(errorResponse);
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should validate that error responses do not expose system information', () => {
      const errorResponse = {
        error: 'server_error',
        message: 'Internal server error occurred',
        status: 500
      };

      const issues = validator.checkSensitiveInformation(errorResponse);
      expect(issues).toHaveLength(0);
    });
  });
});

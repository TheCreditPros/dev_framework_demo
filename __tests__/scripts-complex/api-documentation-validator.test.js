// API Documentation Validator Tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// Mock file system operations
vi.mock('fs');
vi.mock('child_process');

// Import the validator
const APIDocumentationValidator = require('../../scripts-complex/api-documentation-validator.js');

describe('APIDocumentationValidator', () => {
  let validator;
  let mockProjectRoot;

  beforeEach(() => {
    mockProjectRoot = '/mock/project';
    process.cwd = vi.fn().mockReturnValue(mockProjectRoot);

    validator = new APIDocumentationValidator();

    // Mock fs operations
    fs.existsSync.mockImplementation((filePath) => {
      if (filePath.includes('reports')) return true;
      if (filePath.includes('openapi.yaml')) return true;
      if (filePath.includes('swagger.json')) return true;
      return false;
    });

    fs.readdirSync.mockImplementation((dirPath) => {
      if (dirPath === mockProjectRoot) return ['openapi.yaml'];
      if (dirPath === path.join(mockProjectRoot, 'docs')) return ['swagger.json'];
      return [];
    });

    fs.readFileSync.mockImplementation((filePath) => {
      if (filePath.includes('openapi.yaml')) {
        return `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
  description: A test API for validation
servers:
  - url: https://api.example.com
paths:
  /users:
    get:
      summary: Get users
      description: Retrieve a list of users
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
`;
      }
      return '{}';
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findAPISpecifications', () => {
    it('should find API specification files in common locations', () => {
      const specFiles = validator.findAPISpecifications();
      expect(specFiles).toHaveLength(2);
      expect(specFiles[0]).toContain('openapi.yaml');
      expect(specFiles[1]).toContain('swagger.json');
    });

    it('should return empty array when no spec files found', () => {
      fs.readdirSync.mockReturnValue([]);
      fs.existsSync.mockReturnValue(false);

      const specFiles = validator.findAPISpecifications();
      expect(specFiles).toHaveLength(0);
    });
  });

  describe('validateSpecificationCompleteness', () => {
    it('should validate complete OpenAPI specification', () => {
      const specContent = fs.readFileSync('/mock/project/openapi.yaml', 'utf8');
      const spec = validator.parseSpec(specContent, '/mock/project/openapi.yaml');
      const issues = validator.validateSpecificationCompleteness(spec, '/mock/project/openapi.yaml');

      expect(issues).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const incompleteSpec = {
        paths: {
          '/users': {
            get: {
              responses: {}
            }
          }
        }
      };

      const issues = validator.validateSpecificationCompleteness(incompleteSpec, '/mock/project/bad-spec.yaml');

      expect(issues).toHaveLength(3);
      expect(issues.some(issue => issue.type === 'missing-info')).toBe(true);
      expect(issues.some(issue => issue.type === 'missing-servers')).toBe(true);
      expect(issues.some(issue => issue.type === 'missing-responses')).toBe(true);
    });
  });

  describe('validateOperation', () => {
    it('should validate operation with adequate documentation', () => {
      const operation = {
        summary: 'Get users with detailed description that exceeds minimum length requirements',
        description: 'Retrieve a comprehensive list of users from the system with detailed filtering and sorting capabilities that provide extensive functionality for user management',
        responses: {
          '200': {
            description: 'Successful response with user data'
          }
        }
      };

      const issues = validator.validateOperation(operation, '/users', 'get', '/mock/project/spec.yaml');
      expect(issues).toHaveLength(2); // Missing operationId and security
    });

    it('should detect brief descriptions', () => {
      const operation = {
        summary: 'Get users',
        description: 'Get users',
        responses: {
          '200': {
            description: 'OK'
          }
        }
      };

      const issues = validator.validateOperation(operation, '/users', 'get', '/mock/project/spec.yaml');

      expect(issues.some(issue => issue.type === 'brief-summary')).toBe(true);
      expect(issues.some(issue => issue.type === 'brief-description')).toBe(true);
    });
  });

  describe('validateErrorResponseFormat', () => {
    it('should validate proper error response format', () => {
      const errorResponse = {
        error: 'validation_error',
        message: 'The provided data is invalid and cannot be processed',
        status: 400
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
  });

  describe('checkSensitiveInformation', () => {
    it('should detect sensitive information in error responses', () => {
      const errorResponse = {
        error: 'validation_error',
        message: 'Invalid SSN provided: 123-45-6789',
        status: 400
      };

      const issues = validator.checkSensitiveInformation(errorResponse);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0]).toContain('Sensitive information detected');
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

  describe('FCRA Compliance', () => {
    it('should detect FCRA compliance issues in credit repair context', () => {
      const errorResponse = {
        error: 'credit_report_error',
        message: 'Failed to retrieve credit report for SSN 123-45-6789',
        status: 500
      };

      const issues = validator.checkSensitiveInformation(errorResponse);
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should validate that error responses do not expose PII', () => {
      const errorResponse = {
        error: 'user_not_found',
        message: 'User account not found',
        status: 404
      };

      const issues = validator.checkSensitiveInformation(errorResponse);
      expect(issues).toHaveLength(0);
    });
  });

  describe('validateStatusCodes', () => {
    it('should validate proper HTTP status codes', () => {
      const issues = validator.validateStatusCodes({ status: 400 }, 400);
      expect(issues).toHaveLength(0);
    });

    it('should detect invalid status codes', () => {
      const issues = validator.validateStatusCodes({ status: 200 }, 400);
      expect(issues).toContain('Status code mismatch: expected 400, got 200');
    });

    it('should detect non-error status codes', () => {
      const issues = validator.validateStatusCodes({ status: 200 });
      expect(issues).toContain('Invalid error status code: 200 (should be 4xx or 5xx)');
    });
  });

  describe('validateErrorMessageQuality', () => {
    it('should validate user-friendly error messages', () => {
      const errorResponse = {
        message: 'Unable to process your request. Please check your input and try again.'
      };

      const issues = validator.validateErrorMessageQuality(errorResponse);
      expect(issues).toHaveLength(0);
    });

    it('should detect developer jargon in error messages', () => {
      const errorResponse = {
        message: 'Internal server error occurred in the exception handler'
      };

      const issues = validator.validateErrorMessageQuality(errorResponse);
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should detect generic error messages', () => {
      const errorResponse = {
        message: 'Something went wrong'
      };

      const issues = validator.validateErrorMessageQuality(errorResponse);
      expect(issues).toContain('Error message is too generic: "Something went wrong"');
    });
  });

  describe('Integration Tests', () => {
    it('should validate complete API specification workflow', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await validator.validate();

      expect(result.status).toBe('success');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('API Documentation Validation Complete'));

      consoleSpy.mockRestore();
    });

    it('should generate comprehensive validation reports', async () => {
      const result = await validator.validateAll();

      expect(result.status).toBe('success');
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large API specifications efficiently', async () => {
      // Mock a large specification
      const largeSpec = {
        openapi: '3.0.0',
        info: { title: 'Large API', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com' }],
        paths: {}
      };

      // Generate many paths
      for (let i = 0; i < 100; i++) {
        largeSpec.paths[`/resource${i}`] = {
          get: {
            summary: `Get resource ${i}`,
            description: `Retrieve resource ${i} with detailed information`,
            responses: {
              '200': { description: 'Success' }
            }
          }
        };
      }

      fs.readFileSync.mockImplementation(() => JSON.stringify(largeSpec));

      const startTime = Date.now();
      const issues = validator.validateSpecificationCompleteness(largeSpec, '/mock/large-spec.json');
      const endTime = Date.now();

      // Should complete within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(Array.isArray(issues)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed specification files gracefully', () => {
      fs.readFileSync.mockImplementation(() => 'invalid yaml content');

      const specFiles = validator.findAPISpecifications();
      expect(specFiles).toHaveLength(2);
    });

    it('should handle empty specification files', () => {
      fs.readFileSync.mockImplementation(() => '');

      const specFiles = validator.findAPISpecifications();
      expect(specFiles).toHaveLength(2);
    });

    it('should validate multi-step processes in documentation', () => {
      const spec = {
        paths: {
          '/users': {
            post: {
              tags: ['user-management'],
              summary: 'Create user',
              description: 'Create a new user account',
              operationId: 'createUser'
            }
          },
          '/users/{id}': {
            get: {
              tags: ['user-management'],
              summary: 'Get user',
              description: 'Retrieve user details',
              operationId: 'getUser'
            }
          }
        }
      };

      const processes = validator.identifyMultiStepProcesses(spec, '/mock/spec.yaml');
      expect(processes).toHaveLength(1);
      expect(processes[0].name).toBe('User Management');
    });
  });
});

// API Contract Tester Tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// Mock file system operations
vi.mock('fs');
vi.mock('child_process');

// Import the tester
const APIContractTester = require('../../scripts-complex/api-contract-tester.js');

describe('APIContractTester', () => {
  let tester;
  let mockProjectRoot;

  beforeEach(() => {
    mockProjectRoot = '/mock/project';
    process.cwd = vi.fn().mockReturnValue(mockProjectRoot);

    tester = new APIContractTester();

    // Mock fs operations
    fs.existsSync.mockImplementation((filePath) => {
      if (filePath.includes('reports')) return true;
      if (filePath.includes('openapi.yaml')) return true;
      if (filePath.includes('swagger.json')) return true;
      if (filePath.includes('vitest.config.js')) return true;
      if (filePath.includes('playwright.config.js')) return true;
      return false;
    });

    fs.readdirSync.mockImplementation((dirPath) => {
      if (dirPath === mockProjectRoot) return ['openapi.yaml'];
      if (dirPath === path.join(mockProjectRoot, 'docs')) return ['swagger.json'];
      if (dirPath === path.join(mockProjectRoot, 'spec')) return ['api-spec.yml'];
      return [];
    });

    fs.readFileSync.mockImplementation((filePath) => {
      if (filePath.includes('openapi.yaml')) {
        return `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get users
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
    post:
      summary: Create user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
components:
  schemas:
    User:
      type: object
      required:
        - name
        - email
      properties:
        id:
          type: integer
        name:
          type: string
        email:
          type: string
          format: email
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
      const specFiles = tester.findAPISpecifications();
      expect(specFiles).toHaveLength(3);
      expect(specFiles.some(file => file.includes('openapi.yaml'))).toBe(true);
      expect(specFiles.some(file => file.includes('swagger.json'))).toBe(true);
    });

    it('should return empty array when no spec files found', () => {
      fs.readdirSync.mockReturnValue([]);
      fs.existsSync.mockReturnValue(false);

      const specFiles = tester.findAPISpecifications();
      expect(specFiles).toHaveLength(0);
    });
  });

  describe('validateAPISpecification', () => {
    it('should validate complete OpenAPI specification', () => {
      const specPath = '/mock/project/openapi.yaml';
      const issues = tester.validateAPISpecification(specPath);

      expect(issues).toHaveLength(0);
    });

    it('should detect missing required fields in specification', () => {
      fs.readFileSync.mockImplementation(() => `
openapi: 3.0.0
paths:
  /users:
    get:
      responses: {}
`);

      const specPath = '/mock/project/bad-spec.yaml';
      const issues = tester.validateAPISpecification(specPath);

      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some(issue => issue.includes('missing'))).toBe(true);
    });

    it('should validate specification version compliance', () => {
      fs.readFileSync.mockImplementation(() => `
swagger: 2.0
info:
  title: Old API
  version: 1.0.0
`);

      const specPath = '/mock/project/old-spec.yaml';
      const issues = tester.validateAPISpecification(specPath);

      expect(issues.some(issue => issue.includes('version'))).toBe(true);
    });
  });

  describe('checkBreakingChanges', () => {
    it('should detect breaking changes between API versions', () => {
      const oldSpec = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /users:
    get:
      responses:
        '200':
          description: Success
`;

      const newSpec = `
openapi: 3.0.0
info:
  title: Test API
  version: 2.0.0
paths:
  /users:
    post:
      responses:
        '201':
          description: Created
`;

      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('old')) return oldSpec;
        if (filePath.includes('new')) return newSpec;
        return '{}';
      });

      const issues = tester.checkBreakingChanges('/mock/old-spec.yaml', '/mock/new-spec.yaml');
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some(issue => issue.includes('removed'))).toBe(true);
    });

    it('should detect field type changes as breaking changes', () => {
      const oldSpec = `
openapi: 3.0.0
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
`;

      const newSpec = `
openapi: 3.0.0
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
`;

      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('old')) return oldSpec;
        if (filePath.includes('new')) return newSpec;
        return '{}';
      });

      const issues = tester.checkBreakingChanges('/mock/old-spec.yaml', '/mock/new-spec.yaml');
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should not flag compatible changes as breaking', () => {
      const oldSpec = `
openapi: 3.0.0
components:
  schemas:
    User:
      type: object
      properties:
        name:
          type: string
`;

      const newSpec = `
openapi: 3.0.0
components:
  schemas:
    User:
      type: object
      properties:
        name:
          type: string
        email:
          type: string
`;

      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('old')) return oldSpec;
        if (filePath.includes('new')) return newSpec;
        return '{}';
      });

      const issues = tester.checkBreakingChanges('/mock/old-spec.yaml', '/mock/new-spec.yaml');
      expect(issues).toHaveLength(0);
    });
  });

  describe('ensureBackwardCompatibility', () => {
    it('should validate semantic versioning compliance', () => {
      const issues = tester.ensureBackwardCompatibility('/mock/project/openapi.yaml');
      expect(issues).toHaveLength(0);
    });

    it('should detect invalid semantic versioning', () => {
      fs.readFileSync.mockImplementation(() => `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0
`);

      const issues = tester.ensureBackwardCompatibility('/mock/project/bad-version.yaml');
      expect(issues.some(issue => issue.includes('semver'))).toBe(true);
    });

    it('should detect deprecated endpoints', () => {
      fs.readFileSync.mockImplementation(() => `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /users:
    get:
      deprecated: true
      responses:
        '200':
          description: Success
`);

      const issues = tester.ensureBackwardCompatibility('/mock/project/deprecated-spec.yaml');
      expect(issues.some(issue => issue.includes('deprecated'))).toBe(true);
    });
  });

  describe('Framework Integration', () => {
    it('should detect Vitest configuration', () => {
      const integrations = tester.integrateWithTestingFrameworks();
      expect(integrations.vitest).toBeDefined();
      expect(integrations.vitest.status).toBe('detected');
    });

    it('should detect Playwright configuration', () => {
      const integrations = tester.integrateWithTestingFrameworks();
      expect(integrations.playwright).toBeDefined();
      expect(integrations.playwright.status).toBe('detected');
    });

    it('should generate contract test files for Vitest', () => {
      const testFiles = tester.generateVitestContractTests('/mock/project/openapi.yaml');
      expect(Array.isArray(testFiles)).toBe(true);
      expect(testFiles.length).toBeGreaterThan(0);
    });

    it('should generate contract test files for Playwright', () => {
      const testFiles = tester.generatePlaywrightContractTests('/mock/project/openapi.yaml');
      expect(Array.isArray(testFiles)).toBe(true);
      expect(testFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Schema Validation', () => {
    it('should validate request/response schema matching', () => {
      const specContent = fs.readFileSync('/mock/project/openapi.yaml', 'utf8');
      const spec = tester.parseSpec(specContent, '/mock/project/openapi.yaml');

      const validation = tester.validateSchemaMatching(spec);
      expect(Array.isArray(validation.issues)).toBe(true);
    });

    it('should detect schema validation errors', () => {
      fs.readFileSync.mockImplementation(() => `
openapi: 3.0.0
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: invalid_type
`);

      const validation = tester.validateSchemaMatching(tester.parseSpec(
        fs.readFileSync('/mock/project/bad-schema.yaml', 'utf8'),
        '/mock/project/bad-schema.yaml'
      ));

      expect(validation.issues.length).toBeGreaterThan(0);
    });

    it('should validate required field constraints', () => {
      fs.readFileSync.mockImplementation(() => `
openapi: 3.0.0
components:
  schemas:
    User:
      type: object
      required:
        - name
        - email
      properties:
        name:
          type: string
        email:
          type: string
`);

      const spec = tester.parseSpec(
        fs.readFileSync('/mock/project/user-schema.yaml', 'utf8'),
        '/mock/project/user-schema.yaml'
      );

      const validation = tester.validateSchemaMatching(spec);
      expect(Array.isArray(validation.issues)).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should validate complete contract testing workflow', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await tester.testAll();

      expect(result.status).toBe('success');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('API Contract Testing Setup Complete'));

      consoleSpy.mockRestore();
    });

    it('should generate comprehensive contract testing reports', async () => {
      const result = await tester.testAll();

      expect(result.status).toBe('success');
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large API specifications efficiently', async () => {
      // Mock a large specification
      let largeSpec = 'openapi: 3.0.0\ninfo:\n  title: Large API\n  version: 1.0.0\npaths:\n';

      // Generate many paths
      for (let i = 0; i < 100; i++) {
        largeSpec += `
  /resource${i}:
    get:
      responses:
        '200':
          description: Success
`;
      }

      fs.readFileSync.mockImplementation(() => largeSpec);

      const startTime = Date.now();
      const issues = tester.validateAPISpecification('/mock/large-spec.yaml');
      const endTime = Date.now();

      // Should complete within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(Array.isArray(issues)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed specification files gracefully', () => {
      fs.readFileSync.mockImplementation(() => 'invalid yaml content');

      const specFiles = tester.findAPISpecifications();
      expect(specFiles).toHaveLength(3);
    });

    it('should handle empty specification files', () => {
      fs.readFileSync.mockImplementation(() => '');

      const specFiles = tester.findAPISpecifications();
      expect(specFiles).toHaveLength(3);
    });

    it('should validate specifications with circular references', () => {
      fs.readFileSync.mockImplementation(() => `
openapi: 3.0.0
components:
  schemas:
    User:
      type: object
      properties:
        friend:
          $ref: '#/components/schemas/User'
`);

      const issues = tester.validateAPISpecification('/mock/circular-spec.yaml');
      expect(Array.isArray(issues)).toBe(true);
    });
  });

  describe('Security Validation', () => {
    it('should validate security scheme definitions', () => {
      fs.readFileSync.mockImplementation(() => `
openapi: 3.0.0
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
`);

      const issues = tester.validateAPISpecification('/mock/security-spec.yaml');
      expect(Array.isArray(issues)).toBe(true);
    });

    it('should detect missing security definitions', () => {
      fs.readFileSync.mockImplementation(() => `
openapi: 3.0.0
paths:
  /users:
    get:
      security: []
      responses:
        '200':
          description: Success
`);

      const issues = tester.validateAPISpecification('/mock/no-security-spec.yaml');
      expect(issues.some(issue => issue.includes('security'))).toBe(true);
    });

    it('should validate OAuth2 security configurations', () => {
      fs.readFileSync.mockImplementation(() => `
openapi: 3.0.0
components:
  securitySchemes:
    oauth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://example.com/oauth/authorize
          tokenUrl: https://example.com/oauth/token
          scopes:
            read:users: Read user information
`);

      const issues = tester.validateAPISpecification('/mock/oauth-spec.yaml');
      expect(Array.isArray(issues)).toBe(true);
    });
  });
});

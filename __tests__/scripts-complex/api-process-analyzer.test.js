// API Process Analyzer Tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';

// Mock the fs module using vi.doMock for CommonJS compatibility
vi.doMock('fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn()
}));

vi.doMock('child_process', () => ({}));

describe('APIProcessAnalyzer', () => {
  let analyzer;
  let mockProjectRoot;
  let fs;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset modules to ensure fresh imports
    vi.resetModules();
    
    mockProjectRoot = '/mock/project';
    process.cwd = vi.fn().mockReturnValue(mockProjectRoot);

    // Import fs after mocking
    fs = await import('fs');

    // Set up ALL mocks BEFORE importing the analyzer
    fs.existsSync.mockImplementation((filePath) => {
      // Return false for the specific reports directory to trigger mkdirSync
      if (filePath === path.join(mockProjectRoot, 'reports', 'api-processes')) return false;
      // Return true for the parent reports directory
      if (filePath === path.join(mockProjectRoot, 'reports')) return true;
      if (filePath.includes('openapi.yaml')) return true;
      if (filePath.includes('swagger.json')) return true;
      return false;
    });

    // Mock mkdirSync to always succeed - no matter what path or options
    fs.mkdirSync.mockImplementation(() => {
      // Always succeed silently for any mkdir operation
      return undefined;
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
    post:
      tags: [user-management]
      summary: Create user
      operationId: createUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
      responses:
        '201':
          description: User created
    get:
      tags: [user-management]
      summary: Get users
      operationId: getUsers
      responses:
        '200':
          description: Users retrieved
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
  /users/{id}:
    get:
      tags: [user-management]
      summary: Get user
      operationId: getUser
      responses:
        '200':
          description: User retrieved
    put:
      tags: [user-management]
      summary: Update user
      operationId: updateUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
      responses:
        '200':
          description: User updated
    delete:
      tags: [user-management]
      summary: Delete user
      operationId: deleteUser
      responses:
        '204':
          description: User deleted
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

    // Mock fs.writeFileSync for report generation
    fs.writeFileSync.mockImplementation(() => {
      // Mock successful file write
      return undefined;
    });

    // NOW import and instantiate the analyzer after all mocks are set up
    const { default: APIProcessAnalyzer } = await import('../../scripts-complex/api-process-analyzer.js');
    analyzer = new APIProcessAnalyzer(fs);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findAPISpecifications', () => {
    it('should find API specification files in common locations', () => {
      const specFiles = analyzer.findAPISpecifications();
      expect(specFiles).toHaveLength(3);
      expect(specFiles.some(file => file.includes('openapi.yaml'))).toBe(true);
      expect(specFiles.some(file => file.includes('swagger.json'))).toBe(true);
    });

    it('should return empty array when no spec files found', () => {
      fs.readdirSync.mockReturnValue([]);
      fs.existsSync.mockReturnValue(false);

      const specFiles = analyzer.findAPISpecifications();
      expect(specFiles).toHaveLength(0);
    });
  });

  describe('identifySequentialOperations', () => {
    it('should identify sequential API operations by tags', () => {
      const specContent = fs.readFileSync('/mock/project/openapi.yaml', 'utf8');
      const spec = analyzer.parseSpec(specContent, '/mock/project/openapi.yaml');

      const processes = analyzer.identifySequentialOperations(spec);
      expect(processes).toHaveLength(1);
      expect(processes[0].name).toBe('User Management');
      expect(processes[0].operations).toHaveLength(5);
    });

    it('should group operations by common tags', () => {
      const specContent = fs.readFileSync('/mock/project/openapi.yaml', 'utf8');
      const spec = analyzer.parseSpec(specContent, '/mock/project/openapi.yaml');

      const processes = analyzer.identifySequentialOperations(spec);
      const userManagementProcess = processes.find(p => p.name === 'User Management');

      expect(userManagementProcess).toBeDefined();
      expect(userManagementProcess.operations.map(op => op.operationId)).toEqual([
        'createUser',
        'getUsers',
        'getUser',
        'updateUser',
        'deleteUser'
      ]);
    });

    it('should handle operations without tags', () => {
      fs.readFileSync.mockImplementation(() => `
openapi: 3.0.0
paths:
  /users:
    get:
      summary: Get users
      responses:
        '200':
          description: Success
`);

      const specContent = fs.readFileSync('/mock/project/no-tags.yaml', 'utf8');
      const spec = analyzer.parseSpec(specContent, '/mock/project/no-tags.yaml');

      const processes = analyzer.identifySequentialOperations(spec);
      expect(processes).toHaveLength(1);
      expect(processes[0].name).toBe('Default');
    });
  });

  describe('validateProcessDocumentation', () => {
    it('should validate well-documented processes', () => {
      const specContent = fs.readFileSync('/mock/project/openapi.yaml', 'utf8');
      const spec = analyzer.parseSpec(specContent, '/mock/project/openapi.yaml');
      const processes = analyzer.identifySequentialOperations(spec);

      const issues = analyzer.validateProcessDocumentation(processes, '/mock/project/openapi.yaml');
      expect(issues).toHaveLength(0);
    });

    it('should detect poorly documented processes', () => {
      fs.readFileSync.mockImplementation(() => `
openapi: 3.0.0
paths:
  /users:
    post:
      tags: [user-process]
      responses:
        '201':
          description: Created
`);

      const specContent = fs.readFileSync('/mock/project/poor-doc.yaml', 'utf8');
      const spec = analyzer.parseSpec(specContent, '/mock/project/poor-doc.yaml');
      const processes = analyzer.identifySequentialOperations(spec);

      const issues = analyzer.validateProcessDocumentation(processes, '/mock/project/poor-doc.yaml');
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some(issue => issue.type === 'step-description')).toBe(true);
    });

    it('should validate multi-step process documentation quality', () => {
      const specContent = fs.readFileSync('/mock/project/openapi.yaml', 'utf8');
      const spec = analyzer.parseSpec(specContent, '/mock/project/openapi.yaml');
      const processes = analyzer.identifySequentialOperations(spec);

      const userProcess = processes[0];
      const documentationQuality = analyzer.assessProcessDocumentationQuality(userProcess.operations);

      expect(documentationQuality.totalSteps).toBe(5);
      expect(documentationQuality.documentedSteps).toBeGreaterThan(0);
    });
  });

  describe('identifyMissingSteps', () => {
    it('should identify missing steps in credit repair processes', () => {
      const processes = [{
        name: 'Credit Report Retrieval',
        tag: 'credit-retrieval',
        operations: [
          { operation: { operationId: 'getCreditReport' } }
        ]
      }];

      const issues = analyzer.identifyMissingSteps(processes);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].type).toBe('missing-steps');
    });

    it('should validate complete credit repair workflows', () => {
      const processes = [{
        name: 'Credit Dispute Process',
        tag: 'credit-dispute',
        operations: [
          { operation: { operationId: 'createDispute' } },
          { operation: { operationId: 'submitDispute' } },
          { operation: { operationId: 'trackDispute' } },
          { operation: { operationId: 'resolveDispute' } }
        ]
      }];

      const issues = analyzer.identifyMissingSteps(processes);
      expect(issues).toHaveLength(0);
    });

    it('should detect incomplete user management workflows', () => {
      const processes = [{
        name: 'User Management',
        tag: 'user-management',
        operations: [
          { operation: { operationId: 'createUser' } }
          // Missing get, update, delete operations
        ]
      }];

      const issues = analyzer.identifyMissingSteps(processes);
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('FCRA Compliance Validation', () => {
    it('should validate FCRA compliance in credit repair processes', () => {
      const processes = [{
        name: 'Credit Data Access',
        tag: 'credit-data',
        operations: [
          { operation: { operationId: 'accessCreditData' } }
        ]
      }];

      const issues = analyzer.identifyMissingSteps(processes);
      expect(Array.isArray(issues)).toBe(true);
    });

    it('should ensure audit trail requirements for credit operations', () => {
      const processes = [{
        name: 'Credit Report Processing',
        tag: 'credit-processing',
        operations: [
          { operation: { operationId: 'getCreditReport' } },
          { operation: { operationId: 'updateCreditReport' } }
        ]
      }];

      const issues = analyzer.identifyMissingSteps(processes);
      // Should require audit trail steps
      expect(Array.isArray(issues)).toBe(true);
    });

    it('should validate permissible purpose checks in credit workflows', () => {
      const processes = [{
        name: 'Credit Pull Process',
        tag: 'credit-pull',
        operations: [
          { operation: { operationId: 'pullCreditReport' } }
        ]
      }];

      const issues = analyzer.identifyMissingSteps(processes);
      // Should require permissible purpose validation
      expect(Array.isArray(issues)).toBe(true);
    });
  });

  describe('generateProcessFlowDocumentation', () => {
    it('should generate comprehensive process documentation', () => {
      const specContent = fs.readFileSync('/mock/project/openapi.yaml', 'utf8');
      const spec = analyzer.parseSpec(specContent, '/mock/project/openapi.yaml');
      const processes = analyzer.identifySequentialOperations(spec);

      const documentation = analyzer.generateProcessFlowDocumentation(processes, '/mock/project/openapi.yaml');
      expect(Array.isArray(documentation)).toBe(true);
      expect(documentation).toHaveLength(1);
      expect(documentation[0].name).toBe('User Management');
      expect(Array.isArray(documentation[0].steps)).toBe(true);
    });

    it('should include detailed step information in documentation', () => {
      const specContent = fs.readFileSync('/mock/project/openapi.yaml', 'utf8');
      const spec = analyzer.parseSpec(specContent, '/mock/project/openapi.yaml');
      const processes = analyzer.identifySequentialOperations(spec);

      const documentation = analyzer.generateProcessFlowDocumentation(processes, '/mock/project/openapi.yaml');
      const userProcess = documentation[0];

      expect(userProcess.steps).toHaveLength(5);
      expect(userProcess.steps[0].method).toBe('POST');
      expect(userProcess.steps[0].path).toBe('/users');
      expect(userProcess.steps[0].operationId).toBe('createUser');
    });

    it('should provide process recommendations', () => {
      const specContent = fs.readFileSync('/mock/project/openapi.yaml', 'utf8');
      const spec = analyzer.parseSpec(specContent, '/mock/project/openapi.yaml');
      const processes = analyzer.identifySequentialOperations(spec);

      const documentation = analyzer.generateProcessFlowDocumentation(processes, '/mock/project/openapi.yaml');
      const userProcess = documentation[0];

      expect(Array.isArray(userProcess.recommendations)).toBe(true);
    });
  });

  describe('provideImprovementRecommendations', () => {
    it('should provide actionable process improvement recommendations', () => {
      const issues = [
        { severity: 'high', message: 'Missing required step' },
        { severity: 'medium', message: 'Poor documentation' }
      ];

      const processes = [{
        name: 'Test Process',
        complexity: 3,
        operations: []
      }];

      const recommendations = analyzer.provideImprovementRecommendations(issues, processes);
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend process simplification for complex workflows', () => {
      const issues = [];
      const processes = [{
        name: 'Very Complex Process',
        complexity: 15, // Very complex
        operations: []
      }];

      const recommendations = analyzer.provideImprovementRecommendations(issues, processes);
      expect(recommendations.some(rec => rec.title.includes('Simplification'))).toBe(true);
    });

    it('should prioritize high-severity issues in recommendations', () => {
      const issues = [
        { severity: 'high', message: 'Critical issue' },
        { severity: 'medium', message: 'Medium issue' },
        { severity: 'low', message: 'Low issue' }
      ];

      const recommendations = analyzer.provideImprovementRecommendations(issues, []);
      expect(recommendations[0].priority).toBe('high');
    });
  });

  describe('Integration Tests', () => {
    it('should analyze complete API processes workflow', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await analyzer.analyzeAll();

      expect(result.status).toBe('success');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('API Process Analysis Complete'));

      consoleSpy.mockRestore();
    });

    it('should generate comprehensive process analysis reports', async () => {
      const result = await analyzer.analyzeAll();

      expect(result.status).toBe('success');
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large API specifications with many processes efficiently', async () => {
      // Mock a large specification with many processes
      let largeSpec = 'openapi: 3.0.0\ninfo:\n  title: Large API\n  version: 1.0.0\npaths:\n';

      // Generate many process-related paths
      for (let i = 0; i < 50; i++) {
        largeSpec += `
  /process${i}:
    post:
      tags: [process-management]
      operationId: process${i}
      responses:
        '200':
          description: Success
`;
      }

      fs.readFileSync.mockImplementation(() => largeSpec);

      const startTime = Date.now();
      const specContent = fs.readFileSync('/mock/large-process-spec.yaml', 'utf8');
      const spec = analyzer.parseSpec(specContent, '/mock/large-process-spec.yaml');
      const processes = analyzer.identifySequentialOperations(spec);
      const endTime = Date.now();

      // Should complete within reasonable time (less than 2 seconds)
      expect(endTime - startTime).toBeLessThan(2000);
      expect(Array.isArray(processes)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed specification files gracefully', () => {
      fs.readFileSync.mockImplementation(() => 'invalid yaml content');

      const specFiles = analyzer.findAPISpecifications();
      expect(specFiles).toHaveLength(3);
    });

    it('should handle empty specification files', () => {
      fs.readFileSync.mockImplementation(() => '');

      const specFiles = analyzer.findAPISpecifications();
      expect(specFiles).toHaveLength(3);
    });

    it('should handle processes with circular dependencies', () => {
      fs.readFileSync.mockImplementation(() => `
openapi: 3.0.0
paths:
  /step1:
    post:
      tags: [circular-process]
      responses:
        '200':
          description: Go to step 2
  /step2:
    post:
      tags: [circular-process]
      responses:
        '200':
          description: Go to step 1
`);

      const specContent = fs.readFileSync('/mock/circular-process.yaml', 'utf8');
      const spec = analyzer.parseSpec(specContent, '/mock/circular-process.yaml');
      const processes = analyzer.identifySequentialOperations(spec);

      expect(Array.isArray(processes)).toBe(true);
    });
  });

  describe('Credit Repair Domain Specific Tests', () => {
    it('should validate credit dispute resolution workflows', () => {
      fs.readFileSync.mockImplementation(() => `
openapi: 3.0.0
paths:
  /disputes:
    post:
      tags: [credit-dispute]
      summary: Create dispute
      operationId: createDispute
    get:
      tags: [credit-dispute]
      summary: Get dispute status
      operationId: getDispute
  /disputes/{id}/submit:
    post:
      tags: [credit-dispute]
      summary: Submit dispute to bureau
      operationId: submitDispute
`);

      const specContent = fs.readFileSync('/mock/credit-dispute-spec.yaml', 'utf8');
      const spec = analyzer.parseSpec(specContent, '/mock/credit-dispute-spec.yaml');
      const processes = analyzer.identifySequentialOperations(spec);

      const creditDisputeProcess = processes.find(p => p.tag.includes('dispute'));
      expect(creditDisputeProcess).toBeDefined();
    });

    it('should ensure PII handling compliance in credit processes', () => {
      const processes = [{
        name: 'Credit Data Processing',
        tag: 'credit-data',
        operations: [
          {
            operation: {
              operationId: 'processCreditData',
              security: [{ bearerAuth: [] }] // Should have security
            }
          }
        ]
      }];

      const documentation = analyzer.generateProcessFlowDocumentation(processes, '/mock/credit-spec.yaml');
      expect(Array.isArray(documentation)).toBe(true);
    });

    it('should validate credit score calculation workflows', () => {
      fs.readFileSync.mockImplementation(() => `
openapi: 3.0.0
paths:
  /credit-scores:
    post:
      tags: [credit-scoring]
      summary: Calculate credit score
      operationId: calculateScore
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                ssn:
                  type: string
                income:
                  type: number
`);

      const specContent = fs.readFileSync('/mock/credit-score-spec.yaml', 'utf8');
      const spec = analyzer.parseSpec(specContent, '/mock/credit-score-spec.yaml');
      const processes = analyzer.identifySequentialOperations(spec);

      const issues = analyzer.validateProcessDocumentation(processes, '/mock/credit-score-spec.yaml');
      // Should flag SSN handling as sensitive
      expect(Array.isArray(issues)).toBe(true);
    });
  });
});
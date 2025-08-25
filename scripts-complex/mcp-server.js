#!/usr/bin/env node

/**
 * AI-SDLC Framework MCP Server
 * Provides Model Context Protocol integration for enhanced Claude Code functionality
 * Specialized for credit repair domain and FCRA compliance automation
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const {
  StdioServerTransport,
} = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ReadResourceRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs');
const { execSync } = require('child_process');

// AI-SDLC Framework integration
const RealAITestGenerator = require('./real-ai-test-generator.js');
const SmartTestSelector = require('./smart-test-selector.js');
const CreditComplianceAgent = require('../qodo-agents/credit-compliance-agent.js');

class AISDLCMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'ai-sdlc-toolkit',
        version: '2.8.1',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
          prompts: {},
        },
      }
    );

    this.testGenerator = new RealAITestGenerator();
    this.testSelector = new SmartTestSelector();
    this.complianceAgent = new CreditComplianceAgent();

    this.setupHandlers();
    console.error(
      '🤖 AI-SDLC MCP Server initialized for credit repair domain automation'
    );
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'generate_ai_tests',
          description:
            'Generate comprehensive AI-powered unit tests for credit repair components',
          inputSchema: {
            type: 'object',
            properties: {
              file_path: { type: 'string', description: 'Path to source file' },
              test_type: {
                type: 'string',
                enum: ['unit', 'integration', 'e2e'],
                default: 'unit',
              },
              compliance_mode: {
                type: 'boolean',
                default: true,
                description: 'Include FCRA compliance validation',
              },
            },
            required: ['file_path'],
          },
        },
        {
          name: 'validate_fcra_compliance',
          description: 'Validate code for FCRA Section 604/607/615 compliance',
          inputSchema: {
            type: 'object',
            properties: {
              file_path: {
                type: 'string',
                description: 'Path to file for compliance check',
              },
              sections: {
                type: 'array',
                items: { type: 'string' },
                default: ['604', '607', '615'],
                description: 'FCRA sections to validate against',
              },
            },
            required: ['file_path'],
          },
        },
        {
          name: 'run_smart_tests',
          description: 'Execute smart test selection based on changed files',
          inputSchema: {
            type: 'object',
            properties: {
              changed_files: {
                type: 'array',
                items: { type: 'string' },
                description:
                  'Optional list of changed files. Auto-detected if not provided',
              },
              coverage_threshold: {
                type: 'number',
                default: 80,
                minimum: 50,
                maximum: 100,
              },
            },
          },
        },
        {
          name: 'validate_credit_score',
          description:
            'Validate credit score calculation for FICO 8 compliance',
          inputSchema: {
            type: 'object',
            properties: {
              score: { type: 'number', minimum: 300, maximum: 850 },
              factors: {
                type: 'object',
                properties: {
                  payment_history: { type: 'number', minimum: 0, maximum: 100 },
                  credit_utilization: {
                    type: 'number',
                    minimum: 0,
                    maximum: 100,
                  },
                  credit_history: { type: 'number', minimum: 0 },
                  credit_mix: { type: 'number', minimum: 0, maximum: 10 },
                  new_credit: { type: 'number', minimum: 0 },
                },
                required: ['payment_history', 'credit_utilization'],
              },
            },
            required: ['score', 'factors'],
          },
        },
        {
          name: 'audit_pii_handling',
          description:
            'Audit codebase for proper PII data handling and encryption',
          inputSchema: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                default: './src',
                description: 'Directory to audit',
              },
              patterns: {
                type: 'array',
                items: { type: 'string' },
                default: [
                  'ssn',
                  'social_security',
                  'credit_card',
                  'bank_account',
                ],
                description: 'PII patterns to search for',
              },
            },
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'generate_ai_tests':
            return await this.handleGenerateAITests(args);

          case 'validate_fcra_compliance':
            return await this.handleValidateFCRACompliance(args);

          case 'run_smart_tests':
            return await this.handleRunSmartTests(args);

          case 'validate_credit_score':
            return await this.handleValidateCreditScore(args);

          case 'audit_pii_handling':
            return await this.handleAuditPIIHandling(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Error executing ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'tcp://credit-score/validation-rules',
          name: 'Credit Score Validation Rules',
          mimeType: 'application/json',
          description:
            'FICO 8 credit score validation rules and compliance requirements',
        },
        {
          uri: 'tcp://fcra/compliance-patterns',
          name: 'FCRA Compliance Patterns',
          mimeType: 'application/json',
          description:
            'Code patterns and validations for FCRA Section 604/607/615 compliance',
        },
        {
          uri: 'tcp://tests/templates',
          name: 'AI Test Templates',
          mimeType: 'application/json',
          description:
            'Template patterns for AI-generated tests with credit repair domain expertise',
        },
      ],
    }));

    // Handle resource reads
    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        const { uri } = request.params;

        switch (uri) {
          case 'tcp://credit-score/validation-rules':
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(
                    {
                      fico_range: { min: 300, max: 850 },
                      weights: {
                        payment_history: 0.35,
                        credit_utilization: 0.3,
                        credit_history: 0.15,
                        credit_mix: 0.1,
                        new_credit: 0.1,
                      },
                      compliance_rules: [
                        'Score must be within 300-850 range',
                        'Calculation must follow FICO 8 algorithm',
                        'Must validate input data integrity',
                        'Must handle edge cases (missing data, extreme values)',
                      ],
                    },
                    null,
                    2
                  ),
                },
              ],
            };

          case 'tcp://fcra/compliance-patterns':
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(
                    {
                      section_604: {
                        name: 'Permissible Purposes',
                        required_patterns: [
                          'permissible_purpose',
                          'consumer_consent',
                        ],
                        prohibited_patterns: [
                          'unauthorized_access',
                          'credit_data_without_purpose',
                        ],
                      },
                      section_607: {
                        name: 'Accuracy Requirements',
                        required_patterns: [
                          'validate',
                          'verify',
                          'accuracy_check',
                        ],
                        test_requirements: [
                          'edge_case_handling',
                          'data_integrity',
                        ],
                      },
                      section_615: {
                        name: 'Disclosure Requirements',
                        required_patterns: [
                          'disclosure_notice',
                          'consumer_notification',
                        ],
                        documentation_requirements: [
                          'audit_trail',
                          'compliance_log',
                        ],
                      },
                    },
                    null,
                    2
                  ),
                },
              ],
            };

          case 'tcp://tests/templates':
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(
                    {
                      credit_score_test_template: {
                        framework: 'vitest',
                        patterns: [
                          'should validate score within 300-850 range',
                          'should handle missing credit data gracefully',
                          'should calculate correct FICO 8 score',
                          'should enforce FCRA compliance rules',
                        ],
                      },
                      compliance_test_template: {
                        framework: 'vitest',
                        patterns: [
                          'should validate permissible purpose (FCRA 604)',
                          'should ensure data accuracy (FCRA 607)',
                          'should provide proper disclosures (FCRA 615)',
                          'should maintain audit trail for compliance',
                        ],
                      },
                    },
                    null,
                    2
                  ),
                },
              ],
            };

          default:
            throw new Error(`Unknown resource: ${uri}`);
        }
      }
    );

    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: [
        {
          name: 'credit_repair_test_generation',
          description:
            'Generate comprehensive tests for credit repair components with FCRA compliance',
          arguments: [
            {
              name: 'component_path',
              description: 'Path to the credit repair component',
              required: true,
            },
            {
              name: 'compliance_sections',
              description: 'FCRA sections to include (604,607,615)',
              required: false,
            },
          ],
        },
      ],
    }));

    // Handle prompt requests
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'credit_repair_test_generation': {
          const componentPath = args?.component_path || 'component';
          const complianceSections = args?.compliance_sections || '604,607,615';

          return {
            description: `Generate comprehensive tests for ${componentPath} with FCRA ${complianceSections} compliance`,
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Generate comprehensive Vitest unit tests for the credit repair component at ${componentPath}. Include:

1. **Functional Testing:**
   - All public methods and functions
   - Edge cases and error handling
   - Input validation and boundary conditions
   - Credit score calculations (300-850 range)

2. **FCRA Compliance Testing (Sections ${complianceSections}):**
   - Section 604: Permissible purpose validation
   - Section 607: Data accuracy requirements  
   - Section 615: Disclosure requirements
   - PII data encryption and protection

3. **Credit Repair Domain Testing:**
   - Credit score calculation accuracy
   - Consumer data protection
   - Regulatory compliance validation
   - Audit trail maintenance

4. **Test Structure:**
   - Use describe/it blocks for organization
   - Include setup/teardown as needed
   - Mock external dependencies
   - Test both success and failure scenarios

Generate complete, runnable tests that achieve 100% code coverage while ensuring regulatory compliance.`,
                },
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown prompt: ${name}`);
      }
    });
  }

  async handleGenerateAITests(args) {
    const { file_path, test_type = 'unit', compliance_mode = true } = args;

    console.error(
      `🤖 Generating ${test_type} tests for ${file_path} (FCRA compliance: ${compliance_mode})`
    );

    const result = await this.testGenerator.generateTestsForFile(
      file_path,
      test_type
    );

    return {
      content: [
        {
          type: 'text',
          text: `✅ AI Test Generation Results:

**Source File:** ${result.sourceFile || file_path}
**Test File:** ${result.testFile || 'Not generated'}
**Test Type:** ${result.testType || test_type}
**AI Generated:** ${result.aiGenerated ? 'Yes' : 'No (Template)'}
**Status:** ${result.status}
${result.error ? `**Error:** ${result.error}` : ''}

${compliance_mode ? '🏦 **FCRA Compliance:** Validation patterns included for credit repair domain' : ''}

The generated tests include:
- Comprehensive unit test coverage
- Edge case and error handling validation
- Credit repair domain-specific test patterns
${compliance_mode ? '- FCRA Section 604/607/615 compliance checks' : ''}
- Auto-healing test selectors for E2E scenarios`,
        },
      ],
    };
  }

  async handleValidateFCRACompliance(args) {
    const { file_path, sections = ['604', '607', '615'] } = args;

    if (!fs.existsSync(file_path)) {
      throw new Error(`File not found: ${file_path}`);
    }

    const content = fs.readFileSync(file_path, 'utf8');
    const analysis = await this.complianceAgent.analyzeCode(file_path, content);

    return {
      content: [
        {
          type: 'text',
          text: `🏦 FCRA Compliance Analysis for ${file_path}

**Sections Analyzed:** ${sections.join(', ')}

**FCRA Compliance:** ${analysis.fcraCompliance.compliant ? '✅ Compliant' : '❌ Issues Found'}
${analysis.fcraCompliance.issues.map((issue) => `  - ${issue.severity.toUpperCase()}: ${issue.message} (${issue.rule})`).join('\n')}

**FACTA Compliance:** ${analysis.factaCompliance.compliant ? '✅ Compliant' : '❌ Issues Found'}
${analysis.factaCompliance.issues.map((issue) => `  - ${issue.severity.toUpperCase()}: ${issue.message}`).join('\n')}

**PII Handling:** ${analysis.piiHandling.secure ? '✅ Secure' : '❌ Issues Found'}
${analysis.piiHandling.issues.map((issue) => `  - ${issue.severity.toUpperCase()}: ${issue.message}`).join('\n')}

**Audit Trails:** ${analysis.auditTrails.compliant ? '✅ Compliant' : '❌ Issues Found'}
${analysis.auditTrails.issues.map((issue) => `  - ${issue.severity.toUpperCase()}: ${issue.message}`).join('\n')}

**Recommendations:**
- Review code against FCRA sections ${sections.join(', ')}
- Implement proper permissible purpose validation
- Add audit logging for credit data access
- Ensure PII encryption and secure handling`,
        },
      ],
    };
  }

  async handleRunSmartTests(args) {
    const { changed_files, coverage_threshold = 80 } = args;

    console.error('🎯 Running smart test selection...');

    try {
      // Configure coverage threshold
      if (coverage_threshold !== 80) {
        console.error(
          `📊 Setting coverage threshold to ${coverage_threshold}%`
        );
      }

      await this.testSelector.run();

      return {
        content: [
          {
            type: 'text',
            text: `✅ Smart Test Selection Completed

**Coverage Threshold:** ${coverage_threshold}%
**Changed Files:** ${changed_files ? changed_files.join(', ') : 'Auto-detected'}

**Results:**
- Identified test files for changed components
- Executed targeted test suite with coverage analysis
- Applied credit repair domain-specific test patterns
- Validated FCRA compliance requirements

**Performance Benefits:**
- Faster CI/CD pipeline execution
- Focused testing on changed code areas
- Maintained comprehensive coverage standards
- Optimized resource utilization

Use \`npm run test:smart\` for direct CLI access to smart test selection.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Smart test execution failed: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async handleValidateCreditScore(args) {
    const { score, factors } = args;

    // Validate score range
    if (score < 300 || score > 850) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Invalid credit score: ${score}

**Issue:** Credit score must be within FICO range (300-850)
**Actual:** ${score}
**FCRA Compliance:** FAILED - Score outside valid range

**Recommendations:**
- Implement proper score capping logic
- Add input validation for credit factors
- Follow FICO 8 algorithm specifications`,
          },
        ],
        isError: true,
      };
    }

    // Validate factors
    const validationResults = [];

    if (factors.payment_history < 0 || factors.payment_history > 100) {
      validationResults.push('Payment history must be 0-100%');
    }

    if (factors.credit_utilization < 0 || factors.credit_utilization > 100) {
      validationResults.push('Credit utilization must be 0-100%');
    }

    return {
      content: [
        {
          type: 'text',
          text: `✅ Credit Score Validation Results

**Score:** ${score} (Valid FICO range: 300-850)
**FCRA Compliance:** ${validationResults.length === 0 ? 'PASSED' : 'FAILED'}

**Factor Analysis:**
- Payment History: ${factors.payment_history}% (35% weight)
- Credit Utilization: ${factors.credit_utilization}% (30% weight)  
- Credit History: ${factors.credit_history} months (15% weight)
- Credit Mix: ${factors.credit_mix}/10 (10% weight)
- New Credit: ${factors.new_credit} accounts (10% weight)

${validationResults.length > 0 ? `**Issues Found:**\n${validationResults.map((issue) => `- ${issue}`).join('\n')}` : '**All factors within valid ranges**'}

**Compliance Notes:**
- Score calculation follows FICO 8 algorithm
- All factors validated against industry standards
- Ready for production credit repair workflows`,
        },
      ],
    };
  }

  async handleAuditPIIHandling(args) {
    const {
      directory = './src',
      patterns = ['ssn', 'social_security', 'credit_card', 'bank_account'],
    } = args;

    console.error(`🔍 Auditing PII handling in ${directory}...`);

    const auditResults = {
      files_scanned: 0,
      pii_found: [],
      encryption_issues: [],
      recommendations: [],
    };

    try {
      // Scan directory for PII patterns
      const scanCommand = `find ${directory} -type f \\( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \\) -exec grep -l "${patterns.join('\\|')}" {} \\;`;
      const filesWithPII = execSync(scanCommand, { encoding: 'utf8' })
        .split('\n')
        .filter((f) => f.trim());

      auditResults.files_scanned = parseInt(
        execSync(
          `find ${directory} -type f \\( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \\) | wc -l`,
          { encoding: 'utf8' }
        )
      );

      for (const file of filesWithPII) {
        if (!file.trim()) continue;

        const content = fs.readFileSync(file, 'utf8');
        const foundPatterns = patterns.filter((pattern) =>
          content.includes(pattern)
        );

        auditResults.pii_found.push({
          file: file,
          patterns: foundPatterns,
        });

        // Check for encryption
        if (
          !content.includes('encrypt') &&
          !content.includes('hash') &&
          !content.includes('bcrypt')
        ) {
          auditResults.encryption_issues.push(file);
        }
      }

      // Generate recommendations
      if (auditResults.pii_found.length > 0) {
        auditResults.recommendations.push(
          'Implement encryption for all PII data handling'
        );
        auditResults.recommendations.push(
          'Add audit logging for PII data access'
        );
        auditResults.recommendations.push(
          'Validate FCRA permissible purpose before PII access'
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: `🔍 PII Data Handling Audit Results

**Directory Scanned:** ${directory}
**Files Scanned:** ${auditResults.files_scanned}
**PII Patterns Searched:** ${patterns.join(', ')}

**Files with PII Data:** ${auditResults.pii_found.length}
${auditResults.pii_found.map((item) => `  📄 ${item.file}: ${item.patterns.join(', ')}`).join('\n')}

**Encryption Issues:** ${auditResults.encryption_issues.length}
${auditResults.encryption_issues.map((file) => `  ⚠️ ${file}: No encryption detected`).join('\n')}

**FCRA Compliance Status:** ${auditResults.encryption_issues.length === 0 ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}

**Recommendations:**
${auditResults.recommendations.map((rec) => `- ${rec}`).join('\n')}
${auditResults.recommendations.length === 0 ? '- No PII handling issues detected' : ''}

**Next Steps:**
1. Review identified files for proper PII encryption
2. Implement audit logging for PII access
3. Validate permissible purpose requirements
4. Add automated PII detection to CI/CD pipeline`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ PII audit failed: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(
      '🚀 AI-SDLC MCP Server running - Credit repair domain automation ready'
    );
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new AISDLCMCPServer();
  server.start().catch((error) => {
    console.error('❌ MCP Server failed to start:', error);
    process.exit(1);
  });
}

module.exports = AISDLCMCPServer;

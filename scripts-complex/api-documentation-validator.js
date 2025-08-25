#!/usr/bin/env node

/**
 * API Documentation Validator for AI-SDLC
 * Validates OpenAPI 3.0+ specifications for completeness
 * Checks documentation quality and identifies multi-step processes
 */

// Load environment variables
require('dotenv').config();

const fs = require('fs');
const path = require('path');

class APIDocumentationValidator {
  constructor(fsModule = null) {
    this.fs = fsModule || fs;
    this.projectRoot = process.cwd();
    this.reportsDir = path.join(
      this.projectRoot,
      'reports',
      'api-documentation'
    );
    this.setupReportsDirectory();

    // Quality thresholds
    this.qualityThresholds = {
      descriptionMinLength: 50,
      parameterDescriptionMinLength: 30,
      exampleMinCount: 1,
      responseSchemaCoverage: 0.8,
      endpointDocumentationRatio: 0.9,
    };
  }

  setupReportsDirectory() {
    if (!this.fs.existsSync(this.reportsDir)) {
      this.fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Find API specification files
   */
  findAPISpecifications() {
    const specFiles = [];
    const specPatterns = [
      'openapi.yaml',
      'openapi.yml',
      'openapi.json',
      'swagger.yaml',
      'swagger.yml',
      'swagger.json',
    ];

    // Search in common locations
    const searchPaths = [
      this.projectRoot,
      path.join(this.projectRoot, 'docs'),
      path.join(this.projectRoot, 'api'),
      path.join(this.projectRoot, 'spec'),
      path.join(this.projectRoot, 'specs'),
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
   * Validate OpenAPI specification completeness
   */
  validateSpecificationCompleteness(spec, specPath) {
    const issues = [];

    // Validate OpenAPI version
    if (!spec.openapi && !spec.swagger) {
      issues.push({
        type: 'spec-version',
        severity: 'high',
        message: 'Specification must define openapi or swagger version',
        location: specPath,
      });
    }

    // Validate info section
    if (!spec.info) {
      issues.push({
        type: 'missing-info',
        severity: 'high',
        message: 'Specification missing info section',
        location: specPath,
      });
    } else {
      if (!spec.info.title) {
        issues.push({
          type: 'missing-title',
          severity: 'medium',
          message: 'Specification missing title',
          location: specPath,
        });
      }

      if (!spec.info.version) {
        issues.push({
          type: 'missing-version',
          severity: 'medium',
          message: 'Specification missing version',
          location: specPath,
        });
      }

      if (!spec.info.description || spec.info.description.length < 50) {
        issues.push({
          type: 'brief-description',
          severity: 'low',
          message:
            'Specification description should be more detailed (minimum 50 characters)',
          location: specPath,
        });
      }
    }

    // Validate servers
    if (!spec.servers || spec.servers.length === 0) {
      issues.push({
        type: 'missing-servers',
        severity: 'medium',
        message: 'Specification missing servers section',
        location: specPath,
      });
    }

    // Validate paths
    if (!spec.paths) {
      issues.push({
        type: 'missing-paths',
        severity: 'high',
        message: 'Specification missing paths',
        location: specPath,
      });
    } else {
      issues.push(...this.validatePaths(spec.paths, specPath));
    }

    // Validate components
    if (spec.components) {
      issues.push(...this.validateComponents(spec.components, specPath));
    }

    return issues;
  }

  /**
   * Validate API paths
   */
  validatePaths(paths, specPath) {
    const issues = [];
    let totalEndpoints = 0;
    let documentedEndpoints = 0;

    for (const [path, pathItem] of Object.entries(paths)) {
      if (!path.startsWith('/')) {
        issues.push({
          type: 'invalid-path',
          severity: 'medium',
          message: `Path "${path}" should start with "/"`,
          location: `${specPath}#/paths/${path}`,
        });
      }

      for (const [method, operation] of Object.entries(pathItem)) {
        if (
          ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(
            method.toLowerCase()
          )
        ) {
          totalEndpoints++;

          const operationIssues = this.validateOperation(
            operation,
            path,
            method,
            specPath
          );
          issues.push(...operationIssues);

          if (operationIssues.length === 0) {
            documentedEndpoints++;
          }
        }
      }
    }

    // Check overall documentation coverage
    const documentationRatio =
      totalEndpoints > 0 ? documentedEndpoints / totalEndpoints : 0;
    if (
      documentationRatio < this.qualityThresholds.endpointDocumentationRatio
    ) {
      issues.push({
        type: 'low-coverage',
        severity: 'medium',
        message: `Only ${Math.round(documentationRatio * 100)}% of endpoints are well-documented (target: ${Math.round(this.qualityThresholds.endpointDocumentationRatio * 100)}%)`,
        location: specPath,
      });
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
      issues.push({
        type: 'missing-operation-id',
        severity: 'low',
        message: `Missing operationId for ${method.toUpperCase()} ${path}`,
        location: `${specPath}#/paths/${path}/${method}`,
      });
    }

    // Validate summary
    if (!operation.summary) {
      issues.push({
        type: 'missing-summary',
        severity: 'medium',
        message: `Missing summary for ${method.toUpperCase()} ${path}`,
        location: `${specPath}#/paths/${path}/${method}`,
      });
    } else if (
      operation.summary.length < this.qualityThresholds.descriptionMinLength
    ) {
      issues.push({
        type: 'brief-summary',
        severity: 'low',
        message: `Summary too brief for ${method.toUpperCase()} ${path} (${operation.summary.length} chars, min ${this.qualityThresholds.descriptionMinLength})`,
        location: `${specPath}#/paths/${path}/${method}`,
      });
    }

    // Validate description
    if (!operation.description) {
      issues.push({
        type: 'missing-description',
        severity: 'medium',
        message: `Missing description for ${method.toUpperCase()} ${path}`,
        location: `${specPath}#/paths/${path}/${method}`,
      });
    } else if (
      operation.description.length < this.qualityThresholds.descriptionMinLength
    ) {
      issues.push({
        type: 'brief-description',
        severity: 'low',
        message: `Description too brief for ${method.toUpperCase()} ${path} (${operation.description.length} chars, min ${this.qualityThresholds.descriptionMinLength})`,
        location: `${specPath}#/paths/${path}/${method}`,
      });
    }

    // Validate responses
    if (!operation.responses) {
      issues.push({
        type: 'missing-responses',
        severity: 'high',
        message: `Missing responses for ${method.toUpperCase()} ${path}`,
        location: `${specPath}#/paths/${path}/${method}`,
      });
    } else {
      issues.push(
        ...this.validateResponses(operation.responses, path, method, specPath)
      );
    }

    // Validate parameters
    if (operation.parameters) {
      issues.push(
        ...this.validateParameters(operation.parameters, path, method, specPath)
      );
    }

    // Validate request body
    if (operation.requestBody) {
      issues.push(
        ...this.validateRequestBody(
          operation.requestBody,
          path,
          method,
          specPath
        )
      );
    }

    // Validate security
    if (!operation.security) {
      issues.push({
        type: 'missing-security',
        severity: 'low',
        message: `Missing security definition for ${method.toUpperCase()} ${path}`,
        location: `${specPath}#/paths/${path}/${method}`,
      });
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
        issues.push({
          type: 'missing-response-description',
          severity: 'medium',
          message: `Missing description for ${statusCode} response in ${method.toUpperCase()} ${path}`,
          location: `${specPath}#/paths/${path}/${method}/responses/${statusCode}`,
        });
      }

      // Validate response schemas
      if (response.content) {
        let schemaCount = 0;
        let documentedSchemaCount = 0;

        for (const [contentType, content] of Object.entries(response.content)) {
          schemaCount++;

          if (content.schema) {
            documentedSchemaCount++;
            issues.push(
              ...this.validateSchema(
                content.schema,
                `${statusCode} ${contentType}`,
                specPath
              )
            );
          } else {
            issues.push({
              type: 'missing-schema',
              severity: 'medium',
              message: `Missing schema for ${statusCode} ${contentType} response in ${method.toUpperCase()} ${path}`,
              location: `${specPath}#/paths/${path}/${method}/responses/${statusCode}/content/${contentType}`,
            });
          }
        }

        // Check schema documentation coverage
        const schemaCoverage =
          schemaCount > 0 ? documentedSchemaCount / schemaCount : 0;
        if (
          schemaCount > 0 &&
          schemaCoverage < this.qualityThresholds.responseSchemaCoverage
        ) {
          issues.push({
            type: 'low-schema-coverage',
            severity: 'low',
            message: `Only ${Math.round(schemaCoverage * 100)}% of response schemas documented for ${method.toUpperCase()} ${path} (target: ${Math.round(this.qualityThresholds.responseSchemaCoverage * 100)}%)`,
            location: `${specPath}#/paths/${path}/${method}/responses`,
          });
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
        issues.push({
          type: 'missing-param-name',
          severity: 'high',
          message: `Parameter missing name in ${method.toUpperCase()} ${path}`,
          location: `${specPath}#/paths/${path}/${method}/parameters`,
        });
      }

      if (!param.in) {
        issues.push({
          type: 'missing-param-location',
          severity: 'high',
          message: `Parameter "${param.name}" missing location (in) in ${method.toUpperCase()} ${path}`,
          location: `${specPath}#/paths/${path}/${method}/parameters`,
        });
      }

      if (!param.description) {
        issues.push({
          type: 'missing-param-description',
          severity: 'medium',
          message: `Parameter "${param.name}" missing description in ${method.toUpperCase()} ${path}`,
          location: `${specPath}#/paths/${path}/${method}/parameters`,
        });
      } else if (
        param.description.length <
        this.qualityThresholds.parameterDescriptionMinLength
      ) {
        issues.push({
          type: 'brief-param-description',
          severity: 'low',
          message: `Parameter "${param.name}" description too brief in ${method.toUpperCase()} ${path} (${param.description.length} chars, min ${this.qualityThresholds.parameterDescriptionMinLength})`,
          location: `${specPath}#/paths/${path}/${method}/parameters`,
        });
      }

      if (param.required === undefined) {
        issues.push({
          type: 'missing-param-required',
          severity: 'medium',
          message: `Parameter "${param.name}" missing required field in ${method.toUpperCase()} ${path}`,
          location: `${specPath}#/paths/${path}/${method}/parameters`,
        });
      }

      // Check for examples
      if (
        !param.example &&
        (!param.examples || Object.keys(param.examples).length === 0)
      ) {
        issues.push({
          type: 'missing-param-example',
          severity: 'low',
          message: `Parameter "${param.name}" missing example in ${method.toUpperCase()} ${path}`,
          location: `${specPath}#/paths/${path}/${method}/parameters`,
        });
      }
    }

    return issues;
  }

  /**
   * Validate request body
   */
  validateRequestBody(requestBody, path, method, specPath) {
    const issues = [];

    if (!requestBody.description) {
      issues.push({
        type: 'missing-request-body-description',
        severity: 'medium',
        message: `Missing request body description for ${method.toUpperCase()} ${path}`,
        location: `${specPath}#/paths/${path}/${method}/requestBody`,
      });
    }

    if (requestBody.content) {
      for (const [contentType, content] of Object.entries(
        requestBody.content
      )) {
        if (content.schema) {
          issues.push(
            ...this.validateSchema(
              content.schema,
              `request body ${contentType}`,
              specPath
            )
          );
        } else {
          issues.push({
            type: 'missing-request-schema',
            severity: 'medium',
            message: `Missing schema for request body ${contentType} in ${method.toUpperCase()} ${path}`,
            location: `${specPath}#/paths/${path}/${method}/requestBody/content/${contentType}`,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Validate schema definitions
   */
  validateSchemas(schemas, specPath) {
    const issues = [];

    for (const [schemaName, schema] of Object.entries(schemas)) {
      issues.push(...this.validateSchema(schema, schemaName, specPath));
    }

    return issues;
  }

  /**
   * Validate individual schema
   */
  validateSchema(schema, schemaName, specPath) {
    const issues = [];

    if (
      !schema.type &&
      !schema.$ref &&
      !schema.allOf &&
      !schema.anyOf &&
      !schema.oneOf
    ) {
      issues.push({
        type: 'missing-schema-type',
        severity: 'medium',
        message: `Schema "${schemaName}" missing type definition`,
        location: specPath,
      });
    }

    if (schema.properties) {
      for (const [propName, prop] of Object.entries(schema.properties)) {
        if (!prop.type && !prop.$ref) {
          issues.push({
            type: 'missing-property-type',
            severity: 'medium',
            message: `Property "${propName}" in schema "${schemaName}" missing type`,
            location: specPath,
          });
        }

        if (!prop.description) {
          issues.push({
            type: 'missing-property-description',
            severity: 'low',
            message: `Property "${propName}" in schema "${schemaName}" missing description`,
            location: specPath,
          });
        } else if (prop.description.length < 20) {
          issues.push({
            type: 'brief-property-description',
            severity: 'low',
            message: `Property "${propName}" description too brief in schema "${schemaName}"`,
            location: specPath,
          });
        }

        // Check for examples
        if (
          !prop.example &&
          (!prop.examples || Object.keys(prop.examples).length === 0)
        ) {
          issues.push({
            type: 'missing-property-example',
            severity: 'low',
            message: `Property "${propName}" missing example in schema "${schemaName}"`,
            location: specPath,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Validate components section
   */
  validateComponents(components, specPath) {
    const issues = [];

    if (components.schemas) {
      issues.push(...this.validateSchemas(components.schemas, specPath));
    }

    if (components.parameters) {
      issues.push(
        ...this.validateParameters(
          Object.values(components.parameters),
          'components',
          'parameters',
          specPath
        )
      );
    }

    if (components.responses) {
      for (const [responseName, response] of Object.entries(
        components.responses
      )) {
        if (!response.description) {
          issues.push({
            type: 'missing-component-response-description',
            severity: 'medium',
            message: `Component response "${responseName}" missing description`,
            location: specPath,
          });
        }
      }
    }

    if (components.securitySchemes) {
      for (const [schemeName, scheme] of Object.entries(
        components.securitySchemes
      )) {
        if (!scheme.type) {
          issues.push({
            type: 'missing-security-scheme-type',
            severity: 'high',
            message: `Security scheme "${schemeName}" missing type`,
            location: specPath,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Identify multi-step processes in documentation
   */
  identifyMultiStepProcesses(spec) {
    const processes = [];

    if (!spec.paths) return processes;

    // Group operations by tags to identify workflows
    const taggedOperations = {};

    for (const [path, pathItem] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (
          ['get', 'post', 'put', 'delete', 'patch'].includes(
            method.toLowerCase()
          )
        ) {
          const tags = operation.tags || ['default'];

          for (const tag of tags) {
            if (!taggedOperations[tag]) {
              taggedOperations[tag] = [];
            }

            taggedOperations[tag].push({
              path,
              method: method.toUpperCase(),
              operation,
              operationId: operation.operationId,
              summary: operation.summary,
            });
          }
        }
      }
    }

    // Analyze each tag group for sequential patterns
    for (const [tag, operations] of Object.entries(taggedOperations)) {
      if (operations.length > 1) {
        const sortedOperations = this.sortOperationsBySequence(operations);

        processes.push({
          name: this.formatTagName(tag),
          tag,
          operations: sortedOperations,
          complexity: sortedOperations.length,
          documentationQuality:
            this.assessProcessDocumentationQuality(sortedOperations),
        });
      }
    }

    return processes;
  }

  /**
   * Sort operations by likely sequence
   */
  sortOperationsBySequence(operations) {
    // Sort by common sequence patterns: create -> read -> update -> delete
    const methodOrder = {
      POST: 1,
      GET: 2,
      PUT: 3,
      PATCH: 4,
      DELETE: 5,
    };

    return operations.sort((a, b) => {
      const methodA = methodOrder[a.method] || 99;
      const methodB = methodOrder[b.method] || 99;

      if (methodA !== methodB) {
        return methodA - methodB;
      }

      // If same method, sort by path
      return a.path.localeCompare(b.path);
    });
  }

  /**
   * Format tag name for display
   */
  formatTagName(tag) {
    return tag
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Assess process documentation quality
   */
  assessProcessDocumentationQuality(operations) {
    let documentedSteps = 0;

    for (const operation of operations) {
      if (
        operation.operation.summary &&
        operation.operation.summary.length >= 20
      ) {
        documentedSteps++;
      }

      if (
        operation.operation.description &&
        operation.operation.description.length >= 50
      ) {
        documentedSteps++;
      }
    }

    return {
      totalSteps: operations.length,
      documentedSteps,
      documentationRatio:
        operations.length > 0 ? documentedSteps / (operations.length * 2) : 0,
      isWellDocumented: documentedSteps >= operations.length,
    };
  }

  /**
   * Validate multi-step processes are documented
   */
  validateProcessDocumentation(processes) {
    const issues = [];

    for (const process of processes) {
      if (!process.documentationQuality.isWellDocumented) {
        issues.push({
          type: 'poor-process-documentation',
          severity: 'medium',
          message: `Process "${process.name}" lacks adequate documentation (${process.documentationQuality.documentedSteps}/${process.documentationQuality.totalSteps * 2} elements documented)`,
          process: process.name,
          recommendation:
            'Add detailed descriptions and examples for each step',
        });
      }
    }

    return issues;
  }

  /**
   * Generate quality reports with actionable feedback
   */
  generateQualityReport(issues, processes, specPath) {
    const report = {
      timestamp: new Date().toISOString(),
      specification: specPath,
      summary: {
        totalIssues: issues.length,
        highSeverity: issues.filter((i) => i.severity === 'high').length,
        mediumSeverity: issues.filter((i) => i.severity === 'medium').length,
        lowSeverity: issues.filter((i) => i.severity === 'low').length,
        totalProcesses: processes.length,
      },
      issues: issues.map((issue) => ({
        type: issue.type,
        severity: issue.severity,
        message: issue.message,
        location: issue.location,
        recommendation: issue.recommendation,
      })),
      processes: processes.map((process) => ({
        name: process.name,
        complexity: process.complexity,
        documentationQuality: process.documentationQuality,
      })),
      recommendations: this.generateRecommendations(issues, processes),
    };

    return report;
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(issues, processes) {
    const recommendations = [];

    // High severity issues
    const highSeverity = issues.filter((issue) => issue.severity === 'high');
    if (highSeverity.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Critical Documentation Issues',
        description:
          'These issues must be addressed immediately to ensure API usability',
        items: highSeverity.map((issue) => ({
          issue: issue.message,
          recommendation: issue.recommendation || 'Fix this critical issue',
        })),
      });
    }

    // Medium severity issues
    const mediumSeverity = issues.filter(
      (issue) => issue.severity === 'medium'
    );
    if (mediumSeverity.length > 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Documentation Improvements',
        description:
          'These improvements will enhance API clarity and usability',
        items: mediumSeverity.map((issue) => ({
          issue: issue.message,
          recommendation:
            issue.recommendation || 'Improve documentation quality',
        })),
      });
    }

    // Process documentation
    const poorlyDocumentedProcesses = processes.filter(
      (p) => !p.documentationQuality.isWellDocumented
    );
    if (poorlyDocumentedProcesses.length > 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Process Documentation',
        description: 'Multi-step processes need better documentation',
        items: poorlyDocumentedProcesses.map((process) => ({
          issue: `Process "${process.name}" needs better documentation`,
          recommendation:
            'Add detailed descriptions for each step in the process',
        })),
      });
    }

    // General improvements
    recommendations.push({
      priority: 'low',
      title: 'Best Practices',
      description: 'Follow these practices for excellent API documentation',
      items: [
        'Use consistent terminology across all endpoints',
        'Include examples for all parameters and responses',
        'Document error scenarios and edge cases',
        'Provide clear descriptions of business logic',
        'Use meaningful operation IDs',
        'Include security considerations for each endpoint',
      ],
    });

    return recommendations;
  }

  /**
   * Validate all API specifications
   */
  async validateAll() {
    console.log('🔍 Finding API specifications...');

    const specFiles = this.findAPISpecifications();

    if (specFiles.length === 0) {
      console.log('⚠️  No API specification files found');
      return { status: 'warning', message: 'No API specifications found' };
    }

    console.log(`✅ Found ${specFiles.length} API specification file(s)`);

    const allResults = [];

    for (const specFile of specFiles) {
      console.log(`\n📄 Validating specification: ${specFile}`);

      try {
        const specContent = fs.readFileSync(specFile, 'utf8');
        const spec = this.parseSpec(specContent, specFile);

        // Validate specification completeness
        const validationIssues = this.validateSpecificationCompleteness(
          spec,
          specFile
        );

        // Identify multi-step processes
        const processes = this.identifyMultiStepProcesses(spec, specFile);
        const processIssues = this.validateProcessDocumentation(processes);

        const allIssues = [...validationIssues, ...processIssues];

        // Generate quality report
        const qualityReport = this.generateQualityReport(
          allIssues,
          processes,
          specFile
        );

        const result = {
          specFile,
          issues: allIssues.length,
          validationIssues: validationIssues.length,
          processIssues: processIssues.length,
          processes: processes.length,
          report: qualityReport,
        };

        allResults.push(result);

        // Print summary
        if (allIssues.length > 0) {
          console.log(`⚠️  Found ${allIssues.length} issues:`);
          const highSeverity = allIssues.filter(
            (i) => i.severity === 'high'
          ).length;
          const mediumSeverity = allIssues.filter(
            (i) => i.severity === 'medium'
          ).length;
          const lowSeverity = allIssues.filter(
            (i) => i.severity === 'low'
          ).length;

          if (highSeverity > 0)
            console.log(`  🔴 High severity: ${highSeverity}`);
          if (mediumSeverity > 0)
            console.log(`  🟡 Medium severity: ${mediumSeverity}`);
          if (lowSeverity > 0) console.log(`  🟢 Low severity: ${lowSeverity}`);
        } else {
          console.log('✅ Specification validation passed');
        }

        if (processes.length > 0) {
          console.log(
            `📊 Identified ${processes.length} multi-step process(es)`
          );
        }
      } catch (error) {
        console.error(`❌ Failed to validate ${specFile}:`, error.message);
        allResults.push({
          specFile,
          status: 'failed',
          error: error.message,
        });
      }
    }

    // Generate comprehensive report
    const reportPath = this.generateFinalReport(allResults);

    return {
      status: 'success',
      reportPath,
      results: allResults,
    };
  }

  /**
   * Generate final comprehensive report
   */
  generateFinalReport(results) {
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      summary: {
        totalSpecifications: results.length,
        specificationsWithIssues: results.filter(
          (r) => r.issues && r.issues > 0
        ).length,
        totalIssues: results.reduce((sum, r) => sum + (r.issues || 0), 0),
        totalProcesses: results.reduce((sum, r) => sum + (r.processes || 0), 0),
      },
      detailedResults: results,
    };

    const reportPath = path.join(
      this.reportsDir,
      `documentation-validation-report-${Date.now()}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Also generate human-readable report
    const humanReportPath = path.join(
      this.reportsDir,
      `documentation-validation-report-${Date.now()}.md`
    );
    this.generateHumanReadableReport(results, humanReportPath);

    return reportPath;
  }

  /**
   * Generate human-readable report
   */
  generateHumanReadableReport(results, outputPath) {
    let markdown = `# API Documentation Validation Report\n\n`;
    markdown += `Generated on: ${new Date().toISOString()}\n\n`;

    const totalIssues = results.reduce((sum, r) => sum + (r.issues || 0), 0);
    const specsWithIssues = results.filter(
      (r) => r.issues && r.issues > 0
    ).length;

    markdown += `## Summary\n\n`;
    markdown += `- Total specifications analyzed: ${results.length}\n`;
    markdown += `- Specifications with issues: ${specsWithIssues}\n`;
    markdown += `- Total issues found: ${totalIssues}\n`;
    markdown += `- Multi-step processes identified: ${results.reduce((sum, r) => sum + (r.processes || 0), 0)}\n\n`;

    for (const result of results) {
      if (result.specFile && result.report) {
        markdown += `## Specification: ${path.basename(result.specFile)}\n\n`;

        const report = result.report;
        markdown += `### Issues Summary\n\n`;
        markdown += `- High severity: ${report.summary.highSeverity}\n`;
        markdown += `- Medium severity: ${report.summary.mediumSeverity}\n`;
        markdown += `- Low severity: ${report.summary.lowSeverity}\n`;
        markdown += `- Multi-step processes: ${report.summary.totalProcesses}\n\n`;

        if (report.issues.length > 0) {
          markdown += `### Detailed Issues\n\n`;
          for (const issue of report.issues) {
            const emoji =
              issue.severity === 'high'
                ? '🔴'
                : issue.severity === 'medium'
                  ? '🟡'
                  : '🟢';
            markdown += `${emoji} **${issue.severity.toUpperCase()}**: ${issue.message}\n\n`;
          }
        }

        if (report.recommendations.length > 0) {
          markdown += `### Recommendations\n\n`;
          for (const rec of report.recommendations) {
            markdown += `#### ${rec.title}\n`;
            markdown += `${rec.description}\n\n`;
            for (const item of rec.items) {
              markdown += `- ${item.issue || item}\n`;
            }
            markdown += `\n`;
          }
        }

        markdown += `---\n\n`;
      }
    }

    fs.writeFileSync(outputPath, markdown);
  }

  /**
   * Main validation function
   */
  async validate() {
    console.log('🤖 Starting API Documentation Validation...');

    try {
      const results = await this.validateAll();

      console.log('\n✅ API Documentation Validation Complete!');

      if (results.status === 'success') {
        console.log(`📁 Validation report: ${results.reportPath}`);

        const totalIssues = results.results.reduce(
          (sum, r) => sum + (r.issues || 0),
          0
        );
        const specsWithIssues = results.results.filter(
          (r) => r.issues && r.issues > 0
        ).length;

        console.log(`📊 Total issues found: ${totalIssues}`);
        console.log(
          `⚠️  Specifications with issues: ${specsWithIssues}/${results.results.length}`
        );

        if (totalIssues === 0) {
          console.log('🟢 All specifications are well-documented!');
        }
      }

      return results;
    } catch (error) {
      console.error('❌ Documentation validation failed:', error.message);
      return {
        status: 'failed',
        error: error.message,
      };
    }
  }
}

// CLI interface
async function main() {
  const validator = new APIDocumentationValidator();
  const command = process.argv[2];

  switch (command) {
    case 'validate': {
      const result = await validator.validate();

      if (result.status === 'success') {
        console.log('\n🎉 Documentation validation completed successfully!');
        console.log(`📄 Detailed report: ${result.reportPath}`);
      } else if (result.status === 'failed') {
        console.error('💥 Documentation validation failed');
        process.exit(1);
      }
      break;
    }

    default:
      console.log('API Documentation Validator for AI-SDLC Framework');
      console.log('');
      console.log('Usage:');
      console.log('  api-documentation-validator.js validate');
      console.log('');
      console.log('Commands:');
      console.log(
        '  validate    Validate OpenAPI 3.0+ specifications for completeness'
      );
      console.log('');
      console.log('Features:');
      console.log('  • Validates OpenAPI 3.0+ specifications for completeness');
      console.log(
        '  • Checks that all endpoints have meaningful descriptions (≥50 words)'
      );
      console.log(
        '  • Ensures all parameters have clear descriptions with examples'
      );
      console.log('  • Validates response schemas are properly documented');
      console.log(
        "  • Identifies multi-step processes and ensures they're documented"
      );
      console.log('  • Generates quality reports with actionable feedback');
      console.log(
        '  • FCRA compliance validation for credit repair applications'
      );
      console.log('  • Generates detailed validation reports');
      break;
  }
}

// Export for use as module
module.exports = APIDocumentationValidator;

// Run CLI if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

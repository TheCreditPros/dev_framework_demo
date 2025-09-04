#!/usr/bin/env node

/**
 * API Process Analyzer for AI-SDLC
 * Identifies sequential API operations and validates multi-step processes
 * Generates process flow documentation and provides improvement recommendations
 */

// Load environment variables
require("dotenv").config();

const fs = require("fs");
const path = require("path");

class APIProcessAnalyzer {
  constructor(fsModule = null) {
    this.fs = fsModule || fs;
    this.projectRoot = process.cwd();
    this.reportsDir = path.join(this.projectRoot, "reports", "api-processes");
    this.setupReportsDirectory();

    // Common multi-step process patterns in credit repair applications
    this.creditRepairProcesses = {
      "credit-report-retrieval": {
        name: "Credit Report Retrieval",
        steps: [
          "authenticate",
          "validate-permissible-purpose",
          "fetch-credit-report",
          "store-audit-trail",
        ],
        description:
          "Complete credit report retrieval workflow with FCRA compliance",
      },
      "dispute-submission": {
        name: "Dispute Submission",
        steps: [
          "validate-dispute-data",
          "create-dispute-record",
          "submit-to-bureau",
          "track-dispute-status",
        ],
        description: "Credit dispute submission and tracking process",
      },
      "account-setup": {
        name: "Client Account Setup",
        steps: [
          "client-registration",
          "identity-verification",
          "credit-pull-authorization",
          "service-agreement",
        ],
        description: "New client onboarding and account setup workflow",
      },
      "payment-processing": {
        name: "Payment Processing",
        steps: [
          "validate-payment-info",
          "process-payment",
          "update-account-balance",
          "send-receipt",
        ],
        description: "Payment processing and account update workflow",
      },
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
      "openapi.yaml",
      "openapi.yml",
      "openapi.json",
      "swagger.yaml",
      "swagger.yml",
      "swagger.json",
    ];

    // Search in common locations
    const searchPaths = [
      this.projectRoot,
      path.join(this.projectRoot, "docs"),
      path.join(this.projectRoot, "api"),
      path.join(this.projectRoot, "spec"),
      path.join(this.projectRoot, "specs"),
    ];

    for (const searchPath of searchPaths) {
      if (this.fs.existsSync(searchPath)) {
        const files = this.fs.readdirSync(searchPath);
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

    if (ext === ".json") {
      return JSON.parse(content);
    } else {
      // Try YAML parsing
      const yaml = require("js-yaml");
      return yaml.load(content);
    }
  }

  /**
   * Identify sequential API operations
   */
  identifySequentialOperations(spec) {
    const processes = [];

    if (!spec.paths) return processes;

    // Group operations by tags/prefixes to identify workflows
    const taggedOperations = {};

    for (const [path, pathItem] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (
          ["get", "post", "put", "delete", "patch"].includes(
            method.toLowerCase()
          )
        ) {
          const tag = this.getOperationTag(operation, path);

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

    // Analyze each tag group for sequential patterns
    for (const [tag, operations] of Object.entries(taggedOperations)) {
      const sortedOperations = this.sortOperationsBySequence(operations);

      if (sortedOperations.length > 1) {
        processes.push({
          name: this.formatTagName(tag),
          tag,
          operations: sortedOperations,
          complexity: sortedOperations.length,
          hasDocumentation: this.checkProcessDocumentation(
            sortedOperations,
            spec
          ),
        });
      }
    }

    return processes;
  }

  /**
   * Get operation tag for grouping
   */
  getOperationTag(operation, path) {
    if (operation.tags && operation.tags.length > 0) {
      return operation.tags[0];
    }

    // Extract tag from path
    const pathParts = path
      .split("/")
      .filter((part) => part && !part.startsWith("{"));
    return pathParts.length > 0 ? pathParts[0] : "default";
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
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Check if process has adequate documentation
   */
  checkProcessDocumentation(operations, _spec) {
    let documentedSteps = 0;

    for (const operation of operations) {
      if (
        operation.operation.summary &&
        operation.operation.summary.length > 20
      ) {
        documentedSteps++;
      }

      if (
        operation.operation.description &&
        operation.operation.description.length > 50
      ) {
        documentedSteps++;
      }
    }

    return {
      totalSteps: operations.length,
      documentedSteps,
      documentationRatio:
        operations.length > 0 ? documentedSteps / operations.length : 0,
      isWellDocumented: documentedSteps >= operations.length * 0.8,
    };
  }

  /**
   * Assess process documentation quality
   */
  assessProcessDocumentationQuality(operations) {
    return this.checkProcessDocumentation(operations, null);
  }

  /**
   * Validate multi-step processes are clearly documented
   */
  validateProcessDocumentation(processes, _specPath) {
    const issues = [];

    for (const process of processes) {
      if (!process.hasDocumentation.isWellDocumented) {
        issues.push({
          type: "documentation",
          severity: "medium",
          message: `Process "${process.name}" lacks adequate documentation (${process.hasDocumentation.documentedSteps}/${process.hasDocumentation.totalSteps} steps documented)`,
          process: process.name,
          recommendation:
            "Add detailed descriptions and examples for each step",
        });
      }

      // Check for missing step descriptions
      for (const operation of process.operations) {
        if (
          !operation.operation.summary ||
          operation.operation.summary.length < 20
        ) {
          issues.push({
            type: "step-description",
            severity: "low",
            message: `Step "${operation.method} ${operation.path}" in process "${process.name}" has insufficient description`,
            process: process.name,
            step: `${operation.method} ${operation.path}`,
            recommendation: "Add a detailed summary (minimum 20 characters)",
          });
        }
      }
    }

    return issues;
  }

  /**
   * Identify missing steps in processes
   */
  identifyMissingSteps(processes) {
    const issues = [];

    for (const process of processes) {
      const expectedProcess = this.findExpectedProcess(process.tag);

      if (expectedProcess) {
        const actualSteps = process.operations.map((op) =>
          this.extractStepName(op.operation.operationId || op.path)
        );

        const missingSteps = expectedProcess.steps.filter(
          (step) => !actualSteps.includes(step)
        );

        if (missingSteps.length > 0) {
          issues.push({
            type: "missing-steps",
            severity: "high",
            message: `Process "${process.name}" missing required steps: ${missingSteps.join(", ")}`,
            process: process.name,
            missingSteps,
            recommendation: `Add the following steps to ensure compliance: ${missingSteps.join(", ")}`,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Find expected process for credit repair applications
   */
  findExpectedProcess(tag) {
    const tagLower = tag.toLowerCase();

    for (const [key, process] of Object.entries(this.creditRepairProcesses)) {
      if (
        tagLower.includes(key.replace("-", "")) ||
        key.includes(tagLower.replace("-", ""))
      ) {
        return process;
      }
    }

    return null;
  }

  /**
   * Extract step name from operation
   */
  extractStepName(operationIdOrPath) {
    if (operationIdOrPath) {
      return operationIdOrPath
        .replace(/[^a-zA-Z0-9-]/g, "-")
        .toLowerCase()
        .replace(/^-+|-+$/g, "");
    }

    return "unknown-step";
  }

  /**
   * Generate process flow documentation
   */
  generateProcessFlowDocumentation(processes, specPath) {
    const documentation = [];

    for (const process of processes) {
      const processDoc = {
        name: process.name,
        description: this.getProcessDescription(process, specPath),
        steps: process.operations.map((op, index) => ({
          step: index + 1,
          method: op.method,
          path: op.path,
          operationId: op.operationId,
          summary: op.operation.summary || "No summary provided",
          description:
            op.operation.description || "No detailed description provided",
          parameters: this.extractParameters(op.operation),
          responses: this.extractResponses(op.operation),
          security: op.operation.security || [],
        })),
        documentationQuality: process.hasDocumentation,
        recommendations: this.generateProcessRecommendations(process),
      };

      documentation.push(processDoc);
    }

    return documentation;
  }

  /**
   * Get process description
   */
  getProcessDescription(process, _specPath) {
    const expectedProcess = this.findExpectedProcess(process.tag);

    if (expectedProcess) {
      return expectedProcess.description;
    }

    // Try to infer from first operation
    if (process.operations.length > 0) {
      const firstOp = process.operations[0];
      return (
        firstOp.operation.summary ||
        `Multi-step process involving ${process.operations.length} operations`
      );
    }

    return "Automated process analysis";
  }

  /**
   * Extract parameters from operation
   */
  extractParameters(operation) {
    const parameters = [];

    if (operation.parameters) {
      for (const param of operation.parameters) {
        parameters.push({
          name: param.name,
          in: param.in,
          required: param.required,
          description: param.description,
        });
      }
    }

    return parameters;
  }

  /**
   * Extract responses from operation
   */
  extractResponses(operation) {
    const responses = {};

    if (operation.responses) {
      for (const [code, response] of Object.entries(operation.responses)) {
        responses[code] = {
          description: response.description,
          content: response.content ? Object.keys(response.content) : [],
        };
      }
    }

    return responses;
  }

  /**
   * Generate process recommendations
   */
  generateProcessRecommendations(process) {
    const recommendations = [];

    // Check documentation quality
    if (
      process.hasDocumentation &&
      process.hasDocumentation.documentationRatio < 0.8
    ) {
      recommendations.push(
        "Improve documentation for each step with detailed descriptions and examples"
      );
    }

    // Check for error handling
    const stepsWithErrors = process.operations.filter(
      (op) =>
        op.operation.responses &&
        (op.operation.responses["400"] || op.operation.responses["500"])
    );

    if (stepsWithErrors.length < process.operations.length * 0.5) {
      recommendations.push("Add comprehensive error handling to all steps");
    }

    // Check for security
    const securedSteps = process.operations.filter(
      (op) => op.operation.security && op.operation.security.length > 0
    );

    if (securedSteps.length < process.operations.length) {
      recommendations.push(
        "Ensure all steps have appropriate security measures"
      );
    }

    return recommendations;
  }

  /**
   * Provide recommendations for process improvement
   */
  provideImprovementRecommendations(issues, processes) {
    const recommendations = [];

    // High severity issues
    const highSeverity = issues.filter((issue) => issue.severity === "high");
    if (highSeverity.length > 0) {
      recommendations.push({
        priority: "high",
        title: "Critical Process Issues",
        description: "These issues must be addressed immediately",
        items: highSeverity.map((issue) => ({
          issue: issue.message,
          recommendation: issue.recommendation,
        })),
      });
    }

    // Medium severity issues
    const mediumSeverity = issues.filter(
      (issue) => issue.severity === "medium"
    );
    if (mediumSeverity.length > 0) {
      recommendations.push({
        priority: "medium",
        title: "Process Documentation Improvements",
        description: "These improvements will enhance process clarity",
        items: mediumSeverity.map((issue) => ({
          issue: issue.message,
          recommendation: issue.recommendation,
        })),
      });
    }

    // General process optimization
    for (const process of processes) {
      if (process.complexity > 5) {
        recommendations.push({
          priority: "low",
          title: "Process Simplification",
          description: "Consider breaking down complex processes",
          items: [
            {
              issue: `Process "${process.name}" has ${process.complexity} steps`,
              recommendation:
                "Break into smaller, more manageable sub-processes",
            },
          ],
        });
      }
    }

    return recommendations;
  }

  /**
   * Analyze API processes from specifications
   */
  async analyzeProcesses() {
    console.log("🔍 Finding API specifications...");

    const specFiles = this.findAPISpecifications();

    if (specFiles.length === 0) {
      console.log("⚠️  No API specification files found");
      return { status: "warning", message: "No API specifications found" };
    }

    console.log(`✅ Found ${specFiles.length} API specification file(s)`);

    const allResults = [];

    for (const specFile of specFiles) {
      console.log(`\n📊 Analyzing processes in: ${specFile}`);

      try {
        const specContent = this.fs.readFileSync(specFile, "utf8");
        const spec = this.parseSpec(specContent, specFile);

        // Identify sequential operations
        const processes = this.identifySequentialOperations(spec);

        if (processes.length === 0) {
          console.log("⚠️  No multi-step processes identified");
          continue;
        }

        console.log(`✅ Identified ${processes.length} multi-step process(es)`);

        // Validate documentation
        const documentationIssues = this.validateProcessDocumentation(
          processes,
          specFile
        );
        const missingStepIssues = this.identifyMissingSteps(processes);
        const allIssues = [...documentationIssues, ...missingStepIssues];

        // Generate documentation
        const processDocumentation = this.generateProcessFlowDocumentation(
          processes,
          specFile
        );

        // Generate recommendations
        const recommendations = this.provideImprovementRecommendations(
          allIssues,
          processes
        );

        const result = {
          specFile,
          processes: processes.length,
          issues: allIssues.length,
          documentation: processDocumentation,
          recommendations,
          validationIssues: {
            documentation: documentationIssues.length,
            missingSteps: missingStepIssues.length,
          },
        };

        allResults.push(result);

        // Print summary
        if (allIssues.length > 0) {
          console.log(`⚠️  Found ${allIssues.length} issues:`);
          const highSeverity = allIssues.filter(
            (i) => i.severity === "high"
          ).length;
          const mediumSeverity = allIssues.filter(
            (i) => i.severity === "medium"
          ).length;

          if (highSeverity > 0)
            console.log(`  🔴 High severity: ${highSeverity}`);
          if (mediumSeverity > 0)
            console.log(`  🟡 Medium severity: ${mediumSeverity}`);
        }
      } catch (error) {
        console.error(`❌ Failed to analyze ${specFile}:`, error.message);
        allResults.push({
          specFile,
          status: "failed",
          error: error.message,
        });
      }
    }

    // Generate comprehensive report
    const reportPath = this.generateReport(allResults);

    return {
      status: "success",
      reportPath,
      results: allResults,
    };
  }

  /**
   * Generate comprehensive analysis report
   */
  generateReport(results) {
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      summary: {
        totalSpecifications: results.length,
        totalProcesses: results.reduce((sum, r) => sum + (r.processes || 0), 0),
        totalIssues: results.reduce((sum, r) => sum + (r.issues || 0), 0),
        specificationsWithIssues: results.filter(
          (r) => r.issues && r.issues > 0
        ).length,
      },
      detailedResults: results,
    };

    const reportPath = path.join(
      this.reportsDir,
      `process-analysis-report-${Date.now()}.json`
    );
    this.fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Also generate human-readable documentation
    const docsPath = path.join(
      this.reportsDir,
      `process-documentation-${Date.now()}.md`
    );
    this.generateMarkdownDocumentation(results, docsPath);

    return reportPath;
  }

  /**
   * Generate markdown documentation
   */
  generateMarkdownDocumentation(results, outputPath) {
    let markdown = "# API Process Analysis Documentation\n\n";
    markdown += `Generated on: ${new Date().toISOString()}\n\n`;

    for (const result of results) {
      if (result.documentation) {
        markdown += `## Specification: ${path.basename(result.specFile)}\n\n`;

        for (const processDoc of result.documentation) {
          markdown += `### ${processDoc.name}\n\n`;
          markdown += `${processDoc.description}\n\n`;

          markdown += "#### Process Steps\n\n";
          for (const step of processDoc.steps) {
            markdown += `${step.step}. **${step.method}** \`${step.path}\`\n`;
            markdown += `   ${step.summary}\n\n`;
          }

          if (
            processDoc.recommendations &&
            processDoc.recommendations.length > 0
          ) {
            markdown += "#### Recommendations\n\n";
            for (const rec of processDoc.recommendations) {
              markdown += `- ${rec}\n`;
            }
            markdown += "\n";
          }
        }
      }
    }

    this.fs.writeFileSync(outputPath, markdown);
  }

  /**
   * Main analysis function
   */
  async analyzeAll() {
    console.log("🤖 Starting API Process Analysis...");

    try {
      const results = await this.analyzeProcesses();

      console.log("\n✅ API Process Analysis Complete!");

      if (results.status === "success") {
        console.log(`📁 Analysis report: ${results.reportPath}`);

        const totalProcesses = results.results.reduce(
          (sum, r) => sum + (r.processes || 0),
          0
        );
        const totalIssues = results.results.reduce(
          (sum, r) => sum + (r.issues || 0),
          0
        );

        console.log(`📊 Total processes analyzed: ${totalProcesses}`);
        console.log(`⚠️  Total issues identified: ${totalIssues}`);

        if (totalIssues === 0) {
          console.log("🟢 All processes are well-documented and complete!");
        }
      }

      return results;
    } catch (error) {
      console.error("❌ Process analysis failed:", error.message);
      return {
        status: "failed",
        error: error.message,
      };
    }
  }
}

// CLI interface
async function main() {
  const analyzer = new APIProcessAnalyzer();
  const command = process.argv[2];

  switch (command) {
    case "analyze": {
      const result = await analyzer.analyzeAll();

      if (result.status === "success") {
        console.log("\n🎉 Process analysis completed successfully!");
        console.log(`📄 Detailed report: ${result.reportPath}`);
      } else if (result.status === "failed") {
        console.error("💥 Process analysis failed");
        process.exit(1);
      }
      break;
    }

    default:
      console.log("API Process Analyzer for AI-SDLC Framework");
      console.log("");
      console.log("Usage:");
      console.log("  api-process-analyzer.js analyze");
      console.log("");
      console.log("Commands:");
      console.log("  analyze    Identify and analyze multi-step API processes");
      console.log("");
      console.log("Features:");
      console.log("  • Identifies sequential API operations in documentation");
      console.log("  • Validates multi-step processes are clearly documented");
      console.log("  • Checks for missing steps or unclear sequences");
      console.log("  • Generates process flow documentation");
      console.log("  • Provides recommendations for process improvement");
      console.log(
        "  • FCRA compliance validation for credit repair applications"
      );
      console.log("  • Generates detailed analysis reports");
      break;
  }
}

// Export for use as module
module.exports = APIProcessAnalyzer;

// Run CLI if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });
}

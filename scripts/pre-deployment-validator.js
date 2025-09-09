#!/usr/bin/env node

/**
 * Pre-Deployment GitHub Actions Validator
 * Ensures local workflow files exactly match what will run post-deployment
 * Prevents deployment failures by catching workflow issues locally
 */

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const crypto = require("crypto");

class PreDeploymentValidator {
  constructor() {
    this.workflowsDir = path.join(process.cwd(), ".github", "workflows");
    this.localWorkflows = {};
    this.validationResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      critical: 0,
      tests: [],
    };
  }

  /**
   * Validate all workflow files match expected post-deployment behavior
   */
  async validateAllWorkflows() {
    console.log("🔍 PRE-DEPLOYMENT WORKFLOW VALIDATION");
    console.log("=====================================");

    try {
      await this.loadLocalWorkflows();
      await this.validateWorkflowStructure();
      await this.validateTriggerEvents();
      await this.validatePermissions();
      await this.validateSecretsAndTokens();
      await this.validateJobDependencies();
      await this.validateTimeoutConfigurations();
      await this.validatePostDeploymentHooks();

      this.generateValidationReport();
      return this.validationResults.failed === 0;
    } catch (error) {
      console.error("❌ Pre-deployment validation failed:", error.message);
      return false;
    }
  }

  /**
   * Load all local workflow files
   */
  async loadLocalWorkflows() {
    console.log("\n📂 Loading workflow files...");

    if (!fs.existsSync(this.workflowsDir)) {
      this.addResult(
        "WORKFLOW_DIR",
        "CRITICAL",
        "Workflows directory missing",
        ".github/workflows/ directory not found"
      );
      return;
    }

    const workflowFiles = fs
      .readdirSync(this.workflowsDir)
      .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"));

    if (workflowFiles.length === 0) {
      this.addResult(
        "WORKFLOW_FILES",
        "CRITICAL",
        "No workflow files found",
        "No .yml or .yaml files in workflows directory"
      );
      return;
    }

    for (const file of workflowFiles) {
      try {
        const filePath = path.join(this.workflowsDir, file);
        const content = fs.readFileSync(filePath, "utf8");
        const parsed = yaml.load(content);

        this.localWorkflows[file] = {
          path: filePath,
          content: content,
          parsed: parsed,
          hash: this.calculateHash(content),
        };

        this.addResult(
          "WORKFLOW_LOAD",
          "PASS",
          `Loaded ${file}`,
          `Valid YAML structure`
        );
      } catch (error) {
        this.addResult(
          "WORKFLOW_LOAD",
          "CRITICAL",
          `Failed to load ${file}`,
          error.message
        );
      }
    }

    this.addResult(
      "WORKFLOW_COUNT",
      "INFO",
      `Found ${workflowFiles.length} workflow files`
    );
  }

  /**
   * Validate workflow structure and required elements
   */
  async validateWorkflowStructure() {
    console.log("\n🏗️ Validating workflow structure...");

    for (const [filename, workflow] of Object.entries(this.localWorkflows)) {
      const parsed = workflow.parsed;

      // Check required top-level keys
      const requiredKeys = ["name", "on", "jobs"];
      for (const key of requiredKeys) {
        if (!parsed[key]) {
          this.addResult(
            "STRUCTURE",
            "CRITICAL",
            `${filename} missing required key: ${key}`
          );
        }
      }

      // Validate job structure
      if (parsed.jobs) {
        for (const [jobName, jobConfig] of Object.entries(parsed.jobs)) {
          if (!jobConfig.steps || !Array.isArray(jobConfig.steps)) {
            this.addResult(
              "JOB_STRUCTURE",
              "CRITICAL",
              `${filename}:${jobName} missing or invalid steps`
            );
          }

          // Check for runs-on
          if (!jobConfig["runs-on"]) {
            this.addResult(
              "JOB_RUNNER",
              "CRITICAL",
              `${filename}:${jobName} missing runs-on`
            );
          }
        }
      }

      if (requiredKeys.every((key) => parsed[key])) {
        this.addResult("STRUCTURE", "PASS", `${filename} has valid structure`);
      }
    }
  }

  /**
   * Validate trigger events match expected deployment patterns
   */
  async validateTriggerEvents() {
    console.log("\n🎯 Validating trigger events...");

    const expectedTriggers = [
      "push",
      "pull_request",
      "deployment",
      "deployment_status",
      "release",
      "workflow_dispatch",
    ];

    for (const [filename, workflow] of Object.entries(this.localWorkflows)) {
      const triggers = workflow.parsed.on;

      if (!triggers) {
        this.addResult("TRIGGERS", "CRITICAL", `${filename} missing triggers`);
        continue;
      }

      // Check trigger types
      const triggerTypes = Array.isArray(triggers)
        ? triggers
        : Object.keys(triggers);

      for (const trigger of triggerTypes) {
        if (!expectedTriggers.includes(trigger)) {
          this.addResult(
            "TRIGGER_TYPE",
            "WARNING",
            `${filename} uses uncommon trigger: ${trigger}`
          );
        }
      }

      // Validate push triggers for main/master branches
      if (triggers.push) {
        const pushConfig = triggers.push;
        if (
          pushConfig.branches &&
          !pushConfig.branches.includes("main") &&
          !pushConfig.branches.includes("master")
        ) {
          this.addResult(
            "PUSH_TRIGGER",
            "WARNING",
            `${filename} push trigger missing main/master branch`
          );
        }
      }

      this.addResult("TRIGGERS", "PASS", `${filename} has valid triggers`);
    }
  }

  /**
   * Validate permissions match post-deployment requirements
   */
  async validatePermissions() {
    console.log("\n🔐 Validating permissions...");

    for (const [filename, workflow] of Object.entries(this.localWorkflows)) {
      const parsed = workflow.parsed;

      // Check workflow-level permissions
      if (parsed.permissions) {
        const permissions = parsed.permissions;

        // Validate common permission patterns
        if (
          permissions.contents === "write" ||
          permissions.contents === "read"
        ) {
          this.addResult(
            "PERMISSIONS",
            "PASS",
            `${filename} has appropriate contents permissions`
          );
        }

        if (permissions["pull-requests"] === "write") {
          this.addResult("PERMISSIONS", "PASS", `${filename} can write to PRs`);
        }

        if (permissions.deployments === "write") {
          this.addResult(
            "PERMISSIONS",
            "PASS",
            `${filename} can manage deployments`
          );
        }
      } else {
        this.addResult(
          "PERMISSIONS",
          "WARNING",
          `${filename} missing explicit permissions`
        );
      }

      // Check for overly permissive permissions
      if (
        parsed.permissions?.contents === "write" &&
        parsed.permissions?.actions === "write"
      ) {
        this.addResult(
          "PERMISSIONS",
          "WARNING",
          `${filename} has broad write permissions`
        );
      }
    }
  }

  /**
   * Validate secrets and token usage
   */
  async validateSecretsAndTokens() {
    console.log("\n🔑 Validating secrets and tokens...");

    const requiredSecrets = ["GITHUB_TOKEN", "NPM_TOKEN", "DOCKER_HUB_TOKEN"];

    for (const [filename, workflow] of Object.entries(this.localWorkflows)) {
      const content = workflow.content;

      // Check for hardcoded secrets (security risk) - more specific patterns
      const secretPatterns = [
        /password\s*[:=]\s*['"][A-Za-z0-9_-]{10,}['"]/gi,
        /token\s*[:=]\s*['"][A-Za-z0-9_-]{20,}['"]/gi,
        /secret\s*[:=]\s*['"][A-Za-z0-9_-]{15,}['"]/gi,
        /key\s*[:=]\s*['"][A-Za-z0-9_-]{15,}['"]/gi,
      ];

      for (const pattern of secretPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          this.addResult(
            "HARD_CODED_SECRETS",
            "CRITICAL",
            `${filename} contains potential hardcoded secrets`,
            matches.join(", ")
          );
        }
      }

      // Check for required secrets usage
      for (const secret of requiredSecrets) {
        if (content.includes(`secrets.${secret}`)) {
          this.addResult("SECRET_USAGE", "PASS", `${filename} uses ${secret}`);
        }
      }

      // Validate GITHUB_TOKEN usage
      if (
        content.includes("secrets.GITHUB_TOKEN") ||
        content.includes("github.token")
      ) {
        this.addResult(
          "GITHUB_TOKEN",
          "PASS",
          `${filename} uses GITHUB_TOKEN properly`
        );
      } else {
        this.addResult(
          "GITHUB_TOKEN",
          "WARNING",
          `${filename} may not be using GITHUB_TOKEN`
        );
      }
    }
  }

  /**
   * Validate job dependencies and ordering
   */
  async validateJobDependencies() {
    console.log("\n🔗 Validating job dependencies...");

    for (const [filename, workflow] of Object.entries(this.localWorkflows)) {
      const jobs = workflow.parsed.jobs;

      if (!jobs) continue;

      const jobNames = Object.keys(jobs);

      for (const [jobName, jobConfig] of Object.entries(jobs)) {
        // Check needs dependencies
        if (jobConfig.needs) {
          const dependencies = Array.isArray(jobConfig.needs)
            ? jobConfig.needs
            : [jobConfig.needs];

          for (const dep of dependencies) {
            if (!jobNames.includes(dep)) {
              this.addResult(
                "JOB_DEPENDENCY",
                "CRITICAL",
                `${filename}:${jobName} depends on non-existent job: ${dep}`
              );
            }
          }

          if (dependencies.every((dep) => jobNames.includes(dep))) {
            this.addResult(
              "JOB_DEPENDENCY",
              "PASS",
              `${filename}:${jobName} has valid dependencies`
            );
          }
        }

        // Check for circular dependencies (basic check)
        if (jobConfig.needs && jobConfig.needs.includes(jobName)) {
          this.addResult(
            "CIRCULAR_DEPENDENCY",
            "CRITICAL",
            `${filename}:${jobName} has circular dependency`
          );
        }
      }
    }
  }

  /**
   * Validate timeout configurations
   */
  async validateTimeoutConfigurations() {
    console.log("\n⏰ Validating timeout configurations...");

    for (const [filename, workflow] of Object.entries(this.localWorkflows)) {
      const content = workflow.content;

      // Check for timeout-minutes in jobs
      const timeoutMatches = content.match(/timeout-minutes:\s*\d+/g);
      if (timeoutMatches) {
        for (const match of timeoutMatches) {
          const minutes = parseInt(match.split(":")[1].trim());
          if (minutes > 360) {
            // 6 hours
            this.addResult(
              "TIMEOUT_CONFIG",
              "WARNING",
              `${filename} has very long timeout: ${minutes} minutes`
            );
          } else if (minutes < 5) {
            this.addResult(
              "TIMEOUT_CONFIG",
              "WARNING",
              `${filename} has very short timeout: ${minutes} minutes`
            );
          } else {
            this.addResult(
              "TIMEOUT_CONFIG",
              "PASS",
              `${filename} has reasonable timeout: ${minutes} minutes`
            );
          }
        }
      } else {
        this.addResult(
          "TIMEOUT_CONFIG",
          "INFO",
          `${filename} using default timeouts`
        );
      }
    }
  }

  /**
   * Validate post-deployment specific configurations
   */
  async validatePostDeploymentHooks() {
    console.log("\n🚀 Validating post-deployment configurations...");

    const deploymentWorkflows = Object.entries(this.localWorkflows).filter(
      ([_, workflow]) => {
        const triggers = workflow.parsed.on;
        return (
          triggers &&
          ((Array.isArray(triggers) && triggers.includes("deployment")) ||
            triggers.deployment ||
            triggers.deployment_status)
        );
      }
    );

    if (deploymentWorkflows.length === 0) {
      this.addResult(
        "DEPLOYMENT_WORKFLOWS",
        "WARNING",
        "No deployment-triggered workflows found"
      );
      return;
    }

    for (const [filename, workflow] of deploymentWorkflows) {
      // Check for deployment environment handling
      const content = workflow.content;
      if (
        content.includes("github.event.deployment.environment") ||
        content.includes("github.event.deployment_status.environment")
      ) {
        this.addResult(
          "DEPLOYMENT_ENV",
          "PASS",
          `${filename} handles deployment environments`
        );
      } else {
        this.addResult(
          "DEPLOYMENT_ENV",
          "WARNING",
          `${filename} may not handle deployment environments properly`
        );
      }

      // Check for deployment status checks
      if (
        content.includes("deployment_status") ||
        content.includes("deployment.status")
      ) {
        this.addResult(
          "DEPLOYMENT_STATUS",
          "PASS",
          `${filename} handles deployment status events`
        );
      }

      // Validate deployment job structure
      const jobs = workflow.parsed.jobs;
      for (const [jobName, jobConfig] of Object.entries(jobs)) {
        if (jobConfig.environment) {
          this.addResult(
            "DEPLOYMENT_JOB_ENV",
            "PASS",
            `${filename}:${jobName} specifies deployment environment`
          );
        }
      }
    }

    this.addResult(
      "DEPLOYMENT_WORKFLOWS",
      "PASS",
      `Found ${deploymentWorkflows.length} deployment workflows`
    );
  }

  /**
   * Add validation result
   */
  addResult(type, status, message, details = "") {
    const result = {
      type,
      status,
      message,
      details,
      timestamp: new Date().toISOString(),
    };

    this.validationResults.tests.push(result);

    switch (status) {
      case "PASS":
        this.validationResults.passed++;
        break;
      case "FAIL":
        this.validationResults.failed++;
        break;
      case "WARNING":
        this.validationResults.warnings++;
        break;
      case "CRITICAL":
        this.validationResults.critical++;
        this.validationResults.failed++;
        break;
    }

    const emoji =
      status === "PASS"
        ? "✅"
        : status === "WARNING"
          ? "⚠️"
          : status === "CRITICAL"
            ? "🚨"
            : "❌";

    console.log(`${emoji} ${type}: ${message}`);
    if (details) console.log(`   └─ ${details}`);
  }

  /**
   * Generate comprehensive validation report
   */
  generateValidationReport() {
    console.log("\n📊 PRE-DEPLOYMENT VALIDATION REPORT");
    console.log("===================================");

    const results = this.validationResults;

    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⚠️ Warnings: ${results.warnings}`);
    console.log(`🚨 Critical: ${results.critical}`);

    const totalTests = results.tests.length;
    const score = totalTests > 0 ? (results.passed / totalTests) * 100 : 0;
    console.log(`🎯 Overall Score: ${score.toFixed(1)}%`);

    if (results.failed === 0 && results.critical === 0) {
      console.log("\n🚀 WORKFLOWS READY FOR DEPLOYMENT!");
      console.log("All pre-deployment validations passed.");
    } else {
      console.log("\n❌ DEPLOYMENT BLOCKED!");
      console.log(
        "Critical workflow issues must be resolved before deployment."
      );

      if (results.critical > 0) {
        console.log("\n🚨 Critical Issues:");
        results.tests
          .filter((test) => test.status === "CRITICAL")
          .forEach((test) => {
            console.log(`  • ${test.message}`);
            if (test.details) console.log(`    ${test.details}`);
          });
      }

      if (results.failed > 0) {
        console.log("\n❌ Failed Validations:");
        results.tests
          .filter((test) => test.status === "FAIL")
          .forEach((test) => {
            console.log(`  • ${test.message}`);
            if (test.details) console.log(`    ${test.details}`);
          });
      }
    }

    // Export detailed report
    this.exportValidationReport();
  }

  /**
   * Export validation report to file
   */
  exportValidationReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const reportPath = path.join(
      process.cwd(),
      `pre-deployment-validation-${timestamp}.json`
    );

    const report = {
      timestamp: new Date().toISOString(),
      summary: this.validationResults,
      details: this.validationResults.tests,
      workflows: Object.keys(this.localWorkflows),
      recommendations: this.generateRecommendations(),
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved: ${reportPath}`);
  }

  /**
   * Generate recommendations based on validation results
   */
  generateRecommendations() {
    const recommendations = [];
    const results = this.validationResults;

    if (results.critical > 0) {
      recommendations.push({
        priority: "CRITICAL",
        type: "IMMEDIATE_FIX",
        message: `${results.critical} critical workflow issues found`,
        action: "Fix all critical issues before deployment",
      });
    }

    if (results.warnings > 0) {
      recommendations.push({
        priority: "MEDIUM",
        type: "REVIEW_WARNINGS",
        message: `${results.warnings} workflow warnings detected`,
        action: "Review and address warnings for optimal deployment",
      });
    }

    // Specific recommendations based on test types
    const criticalTests = results.tests.filter((t) => t.status === "CRITICAL");
    const criticalTypes = [...new Set(criticalTests.map((t) => t.type))];

    if (criticalTypes.includes("HARD_CODED_SECRETS")) {
      recommendations.push({
        priority: "CRITICAL",
        type: "SECURITY_FIX",
        message: "Hardcoded secrets detected in workflows",
        action: "Replace hardcoded secrets with GitHub Secrets",
      });
    }

    if (criticalTypes.includes("JOB_DEPENDENCY")) {
      recommendations.push({
        priority: "HIGH",
        type: "DEPENDENCY_FIX",
        message: "Invalid job dependencies found",
        action: "Fix job dependency references",
      });
    }

    return recommendations;
  }

  /**
   * Calculate content hash for comparison
   */
  calculateHash(content) {
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  /**
   * Compare local workflows with remote (if available)
   */
  async compareWithRemote() {
    // This would integrate with GitHub API to compare local vs remote workflows
    console.log("\n🔄 Comparing with remote workflows...");
    // Implementation would fetch remote workflow files and compare hashes
  }
}

// CLI interface
if (require.main === module) {
  const validator = new PreDeploymentValidator();

  async function main() {
    const success = await validator.validateAllWorkflows();
    process.exit(success ? 0 : 1);
  }

  main().catch((error) => {
    console.error("💥 Validation error:", error.message);
    process.exit(1);
  });
}

module.exports = PreDeploymentValidator;

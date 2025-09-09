#!/usr/bin/env node

/**
 * Virtuous Cycle Loop for Deployment Validation and Error Fixing
 * Automatically monitors deployments, detects failures, analyzes errors, and suggests fixes
 * Continues until deployment is successful or manual intervention is required
 */

const GitHubActionsMonitor = require("./github-actions-monitor");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

class DeploymentValidationLoop {
  constructor() {
    this.monitor = new GitHubActionsMonitor();
    this.cycleCount = 0;
    this.maxCycles = 10; // Prevent infinite loops
    this.cycleHistory = [];
    this.isRunning = false;
    this.lastDeploymentTime = null;
    this.errorPatterns = this.loadErrorPatterns();
    this.fixStrategies = this.loadFixStrategies();
  }

  /**
   * Load error patterns from configuration
   */
  loadErrorPatterns() {
    const patternsPath = path.join(
      __dirname,
      "..",
      "config",
      "error-patterns.json"
    );

    if (fs.existsSync(patternsPath)) {
      return JSON.parse(fs.readFileSync(patternsPath, "utf8"));
    }

    // Default error patterns
    return {
      timeout: {
        pattern: /timeout|timed out/i,
        category: "TIMEOUT",
        priority: "HIGH",
        fixes: ["increase_timeout", "optimize_performance"],
      },
      dependency: {
        pattern: /dependency|module not found/i,
        category: "DEPENDENCY",
        priority: "HIGH",
        fixes: ["update_dependencies", "check_package_json"],
      },
      syntax: {
        pattern: /syntax error|parse error/i,
        category: "SYNTAX",
        priority: "HIGH",
        fixes: ["lint_fix", "check_syntax"],
      },
      permission: {
        pattern: /permission denied|unauthorized/i,
        category: "PERMISSION",
        priority: "MEDIUM",
        fixes: ["check_permissions", "verify_tokens"],
      },
      network: {
        pattern: /network|connection|ECONNREFUSED/i,
        category: "NETWORK",
        priority: "MEDIUM",
        fixes: ["retry_deployment", "check_connectivity"],
      },
    };
  }

  /**
   * Load fix strategies from configuration
   */
  loadFixStrategies() {
    const strategiesPath = path.join(
      __dirname,
      "..",
      "config",
      "fix-strategies.json"
    );

    if (fs.existsSync(strategiesPath)) {
      return JSON.parse(fs.readFileSync(strategiesPath, "utf8"));
    }

    // Default fix strategies
    return {
      increase_timeout: {
        description: "Increase timeout values in workflow files",
        commands: [
          "find .github/workflows -name '*.yml' -exec sed -i 's/timeout-minutes: [0-9]\\+/timeout-minutes: 30/g' {} \\;",
          "find .github/workflows -name '*.yml' -exec sed -i 's/timeout: [0-9]\\+/timeout: 1800/g' {} \\;",
        ],
      },
      update_dependencies: {
        description: "Update project dependencies",
        commands: ["npm audit fix", "npm update", "npm install"],
      },
      lint_fix: {
        description: "Run linting and auto-fix issues",
        commands: ["npm run lint:fix", "npm run format:fix"],
      },
      check_permissions: {
        description: "Verify and fix permission issues",
        commands: ["chmod +x scripts/*.sh", "chmod +x *.sh"],
      },
      retry_deployment: {
        description: "Retry the deployment process",
        commands: ["git push --force-with-lease"],
      },
    };
  }

  /**
   * Start the virtuous cycle loop
   * @param {Object} options - Loop options
   */
  async startValidationLoop(options = {}) {
    const {
      maxCycles = this.maxCycles,
      deploymentCommand = null,
      autoFix = true,
      notifyOnFailure = true,
    } = options;

    this.isRunning = true;
    this.cycleCount = 0;
    this.maxCycles = maxCycles;

    this.monitor.log(
      "INFO",
      "🚀 Starting Virtuous Cycle Deployment Validation Loop"
    );
    this.monitor.log(
      "INFO",
      `Configuration: maxCycles=${maxCycles}, autoFix=${autoFix}, notifyOnFailure=${notifyOnFailure}`
    );

    try {
      while (this.isRunning && this.cycleCount < this.maxCycles) {
        this.cycleCount++;
        this.monitor.log(
          "INFO",
          `🔄 Starting validation cycle ${this.cycleCount}/${this.maxCycles}`
        );

        const cycleResult = await this.runValidationCycle({
          deploymentCommand,
          autoFix,
          notifyOnFailure,
        });

        this.cycleHistory.push({
          cycle: this.cycleCount,
          timestamp: new Date().toISOString(),
          result: cycleResult,
        });

        // Check if we should continue the loop
        if (cycleResult.success) {
          this.monitor.log(
            "SUCCESS",
            `✅ Deployment successful after ${this.cycleCount} cycles!`
          );
          break;
        } else if (cycleResult.criticalFailure) {
          this.monitor.log(
            "ERROR",
            "💥 Critical failure detected - manual intervention required"
          );
          break;
        } else if (cycleResult.autoFixed && autoFix) {
          this.monitor.log(
            "INFO",
            "🔧 Auto-fix applied - continuing to next cycle"
          );
          await this.sleep(5000); // Wait for fixes to take effect
        } else {
          this.monitor.log(
            "WARN",
            "⚠️ No auto-fix available - continuing monitoring"
          );
          await this.sleep(30000); // Wait longer before next check
        }
      }

      if (this.cycleCount >= this.maxCycles) {
        this.monitor.log(
          "ERROR",
          `❌ Maximum cycles (${this.maxCycles}) reached - manual intervention required`
        );
      }
    } catch (error) {
      this.monitor.log("ERROR", "💥 Validation loop failed", error.message);
    } finally {
      this.isRunning = false;
      await this.generateCycleReport();
    }
  }

  /**
   * Run a single validation cycle
   * @param {Object} options - Cycle options
   * @returns {Promise<Object>} Cycle result
   */
  async runValidationCycle(options = {}) {
    const { deploymentCommand, autoFix, notifyOnFailure } = options;

    const cycleResult = {
      cycle: this.cycleCount,
      success: false,
      criticalFailure: false,
      autoFixed: false,
      errors: [],
      fixes: [],
      analysis: null,
    };

    try {
      // Step 1: Run deployment if command provided
      if (deploymentCommand && this.cycleCount === 1) {
        this.monitor.log("INFO", "📤 Executing deployment command");
        const deployResult = await this.executeCommand(deploymentCommand);
        if (!deployResult.success) {
          cycleResult.errors.push({
            type: "DEPLOYMENT_COMMAND",
            message: deployResult.error,
            critical: true,
          });
          cycleResult.criticalFailure = true;
          return cycleResult;
        }
        this.lastDeploymentTime = new Date();
      }

      // Step 2: Wait for deployment to be processed
      if (this.lastDeploymentTime) {
        const waitTime = Math.max(
          0,
          30000 - (Date.now() - this.lastDeploymentTime.getTime())
        );
        if (waitTime > 0) {
          this.monitor.log(
            "INFO",
            `⏳ Waiting ${Math.round(waitTime / 1000)}s for deployment processing`
          );
          await this.sleep(waitTime);
        }
      }

      // Step 3: Analyze post-deployment workflows
      this.monitor.log("INFO", "📊 Analyzing post-deployment workflows");
      cycleResult.analysis = await this.monitor.analyzePostDeploymentWorkflows({
        days: 1, // Focus on recent deployments
        includeJobs: true,
        includeLogs: true,
      });

      // Step 4: Check for failures
      const failures = cycleResult.analysis.summary.recent_failures;
      if (failures.length > 0) {
        this.monitor.log(
          "WARN",
          `❌ Found ${failures.length} workflow failures`
        );

        for (const failure of failures) {
          const errorAnalysis = await this.analyzeWorkflowFailure(failure);
          cycleResult.errors.push(errorAnalysis);

          if (autoFix && errorAnalysis.canAutoFix) {
            this.monitor.log(
              "INFO",
              `🔧 Attempting auto-fix for: ${errorAnalysis.description}`
            );
            const fixResult = await this.applyAutoFix(errorAnalysis);
            cycleResult.fixes.push(fixResult);

            if (fixResult.success) {
              cycleResult.autoFixed = true;
            }
          }
        }
      } else if (cycleResult.analysis.summary.successful_runs > 0) {
        cycleResult.success = true;
        this.monitor.log("SUCCESS", "✅ All workflows completed successfully");
      } else {
        this.monitor.log(
          "INFO",
          "⏳ No completed workflows found yet - continuing monitoring"
        );
      }

      // Step 5: Generate recommendations
      if (cycleResult.analysis.recommendations.length > 0) {
        this.monitor.log("INFO", "💡 Recommendations:");
        cycleResult.analysis.recommendations.forEach((rec) => {
          this.monitor.log("INFO", `  ${rec.priority}: ${rec.message}`);
        });
      }
    } catch (error) {
      this.monitor.log("ERROR", "Cycle execution failed", error.message);
      cycleResult.errors.push({
        type: "CYCLE_EXECUTION",
        message: error.message,
        critical: true,
      });
      cycleResult.criticalFailure = true;
    }

    return cycleResult;
  }

  /**
   * Analyze a workflow failure to determine cause and potential fixes
   * @param {Object} failure - Failure information
   * @returns {Promise<Object>} Error analysis
   */
  async analyzeWorkflowFailure(failure) {
    this.monitor.log(
      "INFO",
      `🔍 Analyzing failure for workflow: ${failure.name} (${failure.id})`
    );

    const analysis = {
      workflowId: failure.id,
      workflowName: failure.name,
      description: "",
      category: "UNKNOWN",
      priority: "MEDIUM",
      canAutoFix: false,
      suggestedFixes: [],
      errorDetails: null,
    };

    try {
      // Get detailed job information
      const jobs = await this.monitor.getWorkflowRunJobs(failure.id);
      const failedJobs = jobs.filter((job) => job.conclusion === "failure");

      if (failedJobs.length > 0) {
        const primaryFailure = failedJobs[0];

        // Try to get logs for detailed error analysis
        try {
          const logs = await this.monitor.getWorkflowRunLogs(failure.id);
          analysis.errorDetails = this.parseWorkflowLogs(logs);
        } catch (logError) {
          this.monitor.log(
            "WARN",
            `Could not retrieve logs for workflow ${failure.id}`,
            logError.message
          );
        }

        // Analyze error message and steps
        const errorMessage =
          primaryFailure.steps?.find((step) => step.conclusion === "failure")
            ?.name || "Unknown error";
        analysis.description = `Job "${primaryFailure.name}" failed: ${errorMessage}`;

        // Match against known error patterns
        for (const [patternName, pattern] of Object.entries(
          this.errorPatterns
        )) {
          if (
            pattern.pattern.test(analysis.description) ||
            (analysis.errorDetails &&
              pattern.pattern.test(analysis.errorDetails))
          ) {
            analysis.category = pattern.category;
            analysis.priority = pattern.priority;
            analysis.suggestedFixes = pattern.fixes;
            analysis.canAutoFix = pattern.fixes.some(
              (fix) => this.fixStrategies[fix]
            );

            this.monitor.log(
              "INFO",
              `Matched error pattern: ${patternName} (${pattern.category})`
            );
            break;
          }
        }
      } else {
        analysis.description =
          "Workflow failed but no specific job failures found";
      }
    } catch (error) {
      this.monitor.log(
        "ERROR",
        `Failed to analyze workflow failure ${failure.id}`,
        error.message
      );
      analysis.description = `Analysis failed: ${error.message}`;
    }

    return analysis;
  }

  /**
   * Parse workflow logs to extract error details
   * @param {Buffer} logs - Raw log data
   * @returns {string} Parsed error details
   */
  parseWorkflowLogs(logs) {
    // This is a simplified log parser - in a real implementation,
    // you'd need to unzip and parse the actual log files
    try {
      const logString = logs.toString();
      const errorLines = logString
        .split("\n")
        .filter((line) => /error|fail|exception/i.test(line));

      return errorLines.slice(-5).join("\n"); // Last 5 error lines
    } catch (error) {
      return "Log parsing failed";
    }
  }

  /**
   * Apply an automatic fix for a detected error
   * @param {Object} errorAnalysis - Error analysis result
   * @returns {Promise<Object>} Fix result
   */
  async applyAutoFix(errorAnalysis) {
    const fixResult = {
      errorType: errorAnalysis.category,
      fixes: [],
      success: false,
      details: [],
    };

    for (const fixName of errorAnalysis.suggestedFixes) {
      const strategy = this.fixStrategies[fixName];
      if (!strategy) {
        fixResult.details.push(`Fix strategy "${fixName}" not found`);
        continue;
      }

      this.monitor.log("INFO", `Applying fix: ${strategy.description}`);

      let strategySuccess = true;
      const strategyDetails = [];

      for (const command of strategy.commands) {
        try {
          this.monitor.log("INFO", `Running: ${command}`);
          const result = await this.executeCommand(command);
          strategyDetails.push({
            command,
            success: result.success,
            output: result.output?.substring(0, 200),
            error: result.error,
          });

          if (!result.success) {
            strategySuccess = false;
            break;
          }
        } catch (error) {
          strategySuccess = false;
          strategyDetails.push({
            command,
            success: false,
            error: error.message,
          });
          break;
        }
      }

      fixResult.fixes.push({
        name: fixName,
        description: strategy.description,
        success: strategySuccess,
        details: strategyDetails,
      });

      if (strategySuccess) {
        fixResult.success = true;
        break; // Stop after first successful fix
      }
    }

    return fixResult;
  }

  /**
   * Execute a shell command
   * @param {string} command - Command to execute
   * @returns {Promise<Object>} Command result
   */
  executeCommand(command) {
    return new Promise((resolve) => {
      const [cmd, ...args] = command.split(" ");
      const child = spawn(cmd, args, {
        stdio: ["inherit", "pipe", "pipe"],
        shell: true,
      });

      let output = "";
      let errorOutput = "";

      child.stdout.on("data", (data) => {
        output += data.toString();
      });

      child.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      child.on("close", (code) => {
        resolve({
          success: code === 0,
          code,
          output,
          error: errorOutput,
        });
      });

      child.on("error", (error) => {
        resolve({
          success: false,
          code: -1,
          output,
          error: error.message,
        });
      });
    });
  }

  /**
   * Generate a comprehensive cycle report
   */
  async generateCycleReport() {
    const report = {
      summary: {
        totalCycles: this.cycleCount,
        success: this.cycleHistory.some((cycle) => cycle.result.success),
        finalStatus: this.cycleHistory[this.cycleHistory.length - 1]?.result
          .success
          ? "SUCCESS"
          : "FAILED",
        totalErrors: this.cycleHistory.reduce(
          (sum, cycle) => sum + cycle.result.errors.length,
          0
        ),
        totalFixes: this.cycleHistory.reduce(
          (sum, cycle) => sum + cycle.result.fixes.length,
          0
        ),
      },
      cycleDetails: this.cycleHistory,
      recommendations: this.generateFinalRecommendations(),
    };

    const reportPath = path.join(
      process.cwd(),
      `deployment-validation-report-${Date.now()}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    this.monitor.log("INFO", `📄 Cycle report generated: ${reportPath}`);

    // Print summary to console
    console.log("\n📊 DEPLOYMENT VALIDATION CYCLE REPORT");
    console.log("=====================================");
    console.log(`Total Cycles: ${report.summary.totalCycles}`);
    console.log(`Final Status: ${report.summary.finalStatus}`);
    console.log(`Total Errors: ${report.summary.totalErrors}`);
    console.log(`Total Fixes Applied: ${report.summary.totalFixes}`);
    console.log(`Report saved to: ${reportPath}`);

    return report;
  }

  /**
   * Generate final recommendations based on cycle history
   */
  generateFinalRecommendations() {
    const recommendations = [];

    const errorCategories = {};
    this.cycleHistory.forEach((cycle) => {
      cycle.result.errors.forEach((error) => {
        errorCategories[error.category] =
          (errorCategories[error.category] || 0) + 1;
      });
    });

    // Most common error categories
    const sortedCategories = Object.entries(errorCategories).sort(
      ([, a], [, b]) => b - a
    );

    if (sortedCategories.length > 0) {
      recommendations.push({
        type: "FREQUENT_ERRORS",
        message: `Most frequent error category: ${sortedCategories[0][0]} (${sortedCategories[0][1]} occurrences)`,
        action: "Investigate and prevent this error type",
      });
    }

    // Success rate analysis
    const successfulCycles = this.cycleHistory.filter(
      (cycle) => cycle.result.success
    ).length;
    const successRate = (successfulCycles / this.cycleHistory.length) * 100;

    if (successRate < 50) {
      recommendations.push({
        type: "LOW_SUCCESS_RATE",
        message: `Low validation success rate: ${successRate.toFixed(1)}%`,
        action: "Review deployment process and error handling",
      });
    }

    return recommendations;
  }

  /**
   * Stop the validation loop
   */
  stopLoop() {
    this.isRunning = false;
    this.monitor.log("INFO", "🛑 Validation loop stopped by user request");
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = DeploymentValidationLoop;

// CLI interface
if (require.main === module) {
  const loop = new DeploymentValidationLoop();

  const command = process.argv[2];

  async function main() {
    try {
      switch (command) {
        case "start":
          const maxCycles = parseInt(process.argv[3]) || 5;
          const deploymentCommand =
            process.argv[4] || "./deploy-with-timeout.sh";
          await loop.startValidationLoop({
            maxCycles,
            deploymentCommand,
            autoFix: true,
            notifyOnFailure: true,
          });
          break;

        case "monitor":
          await loop.startValidationLoop({
            maxCycles: 10,
            deploymentCommand: null, // Just monitor existing deployments
            autoFix: false,
            notifyOnFailure: true,
          });
          break;

        case "quick":
          await loop.startValidationLoop({
            maxCycles: 3,
            deploymentCommand: null,
            autoFix: true,
            notifyOnFailure: false,
          });
          break;

        default:
          console.log("\n🚀 Deployment Validation Loop CLI");
          console.log("Usage:");
          console.log(
            "  start [maxCycles] [deployCommand] - Start full validation loop"
          );
          console.log(
            "  monitor                          - Monitor existing deployments"
          );
          console.log(
            "  quick                            - Quick validation with auto-fix"
          );
          console.log("\nExamples:");
          console.log(
            '  node deployment-validation-loop.js start 5 "./deploy-with-timeout.sh"'
          );
          console.log("  node deployment-validation-loop.js monitor");
          break;
      }
    } catch (error) {
      console.error("❌ Error:", error.message);
      process.exit(1);
    }
  }

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Received SIGINT, stopping validation loop...");
    loop.stopLoop();
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 Received SIGTERM, stopping validation loop...");
    loop.stopLoop();
  });

  main();
}

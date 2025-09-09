#!/usr/bin/env node

/**
 * GitHub Actions Post-Deployment Monitoring System
 * Comprehensive API client for tracking, reviewing, and fixing GitHub Actions workflows
 *
 * Based on GitHub Actions API methodology:
 * - List Workflow Runs: GET /repos/{owner}/{repo}/actions/runs
 * - Get Specific Run: GET /repos/{owner}/{repo}/actions/runs/{run_id}
 * - Get Run Jobs: GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs
 * - Get Run Logs: GET /repos/{owner}/{repo}/actions/runs/{run_id}/logs
 * - Pending Deployments: GET /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");

class GitHubActionsMonitor {
  constructor() {
    this.baseURL = "https://api.github.com";
    this.owner =
      process.env.GITHUB_REPOSITORY?.split("/")[0] || "TheCreditPros";
    this.repo =
      process.env.GITHUB_REPOSITORY?.split("/")[1] || "dev_framework_demo";
    this.token = process.env.GITHUB_TOKEN;

    if (!this.token) {
      console.warn("⚠️ GITHUB_TOKEN not found. Some features may be limited.");
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        "Authorization": this.token ? `Bearer ${this.token}` : undefined,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "AI-SDLC-Framework-Monitor/1.0",
      },
      timeout: 30000,
    });

    this.logs = [];
    this.monitoringActive = false;
  }

  /**
   * Log function with timestamps and categorization
   */
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
    };

    this.logs.push(logEntry);

    const colors = {
      INFO: "\x1b[36m", // Cyan
      SUCCESS: "\x1b[32m", // Green
      WARN: "\x1b[33m", // Yellow
      ERROR: "\x1b[31m", // Red
      RESET: "\x1b[0m",
    };

    const color = colors[level] || colors.RESET;
    console.log(`${color}[${timestamp}] ${level}: ${message}${colors.RESET}`);

    if (data) {
      console.log(
        `${color}  └─ Details:`,
        JSON.stringify(data, null, 2).substring(0, 500) + "..."
      );
    }
  }

  /**
   * Get workflow runs with comprehensive filtering
   * @param {Object} options - Filtering options
   * @returns {Promise<Array>} Workflow runs
   */
  async getWorkflowRuns(options = {}) {
    const {
      event = null, // 'push', 'pull_request', 'deployment', 'deployment_status'
      status = null, // 'completed', 'success', 'failure', 'in_progress'
      branch = null, // Branch name
      created = null, // Date range (ISO 8601)
      per_page = 30, // Results per page (max 100)
      page = 1, // Page number
    } = options;

    const params = new URLSearchParams();
    if (event) params.append("event", event);
    if (status) params.append("status", status);
    if (branch) params.append("branch", branch);
    if (created) params.append("created", created);
    params.append("per_page", per_page.toString());
    params.append("page", page.toString());

    try {
      this.log(
        "INFO",
        `Fetching workflow runs for ${this.owner}/${this.repo}`,
        { params: params.toString() }
      );

      const response = await this.client.get(
        `/repos/${this.owner}/${this.repo}/actions/runs?${params}`
      );
      const runs = response.data.workflow_runs || [];

      this.log("SUCCESS", `Retrieved ${runs.length} workflow runs`);
      return runs;
    } catch (error) {
      this.log(
        "ERROR",
        "Failed to fetch workflow runs",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Get detailed information about a specific workflow run
   * @param {string|number} runId - Workflow run ID
   * @returns {Promise<Object>} Detailed run information
   */
  async getWorkflowRun(runId) {
    try {
      this.log("INFO", `Fetching details for workflow run ${runId}`);

      const response = await this.client.get(
        `/repos/${this.owner}/${this.repo}/actions/runs/${runId}`
      );
      const run = response.data;

      this.log("SUCCESS", `Retrieved workflow run details`, {
        id: run.id,
        name: run.name,
        status: run.status,
        conclusion: run.conclusion,
        created_at: run.created_at,
        updated_at: run.updated_at,
      });

      return run;
    } catch (error) {
      this.log(
        "ERROR",
        `Failed to fetch workflow run ${runId}`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Get jobs for a specific workflow run
   * @param {string|number} runId - Workflow run ID
   * @returns {Promise<Array>} Run jobs
   */
  async getWorkflowRunJobs(runId) {
    try {
      this.log("INFO", `Fetching jobs for workflow run ${runId}`);

      const response = await this.client.get(
        `/repos/${this.owner}/${this.repo}/actions/runs/${runId}/jobs`
      );
      const jobs = response.data.jobs || [];

      this.log("SUCCESS", `Retrieved ${jobs.length} jobs for run ${runId}`);

      // Analyze job statuses
      const jobStatuses = jobs.reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        if (job.conclusion) {
          acc[job.conclusion] = (acc[job.conclusion] || 0) + 1;
        }
        return acc;
      }, {});

      this.log("INFO", "Job status summary", jobStatuses);

      return jobs;
    } catch (error) {
      this.log(
        "ERROR",
        `Failed to fetch jobs for run ${runId}`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Get logs for a specific workflow run
   * @param {string|number} runId - Workflow run ID
   * @returns {Promise<Buffer>} Run logs as ZIP buffer
   */
  async getWorkflowRunLogs(runId) {
    try {
      this.log("INFO", `Fetching logs for workflow run ${runId}`);

      const response = await this.client.get(
        `/repos/${this.owner}/${this.repo}/actions/runs/${runId}/logs`,
        {
          responseType: "arraybuffer",
        }
      );

      this.log(
        "SUCCESS",
        `Retrieved logs for run ${runId} (${response.data.length} bytes)`
      );
      return response.data;
    } catch (error) {
      this.log(
        "ERROR",
        `Failed to fetch logs for run ${runId}`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Get pending deployments for a workflow run
   * @param {string|number} runId - Workflow run ID
   * @returns {Promise<Array>} Pending deployments
   */
  async getPendingDeployments(runId) {
    try {
      this.log("INFO", `Fetching pending deployments for run ${runId}`);

      const response = await this.client.get(
        `/repos/${this.owner}/${this.repo}/actions/runs/${runId}/pending_deployments`
      );
      const deployments = response.data || [];

      this.log(
        "SUCCESS",
        `Retrieved ${deployments.length} pending deployments for run ${runId}`
      );
      return deployments;
    } catch (error) {
      this.log(
        "ERROR",
        `Failed to fetch pending deployments for run ${runId}`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Analyze post-deployment workflows with comprehensive metrics
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis results
   */
  async analyzePostDeploymentWorkflows(options = {}) {
    const {
      days = 7, // Look back period in days
      environment = null, // Specific environment to analyze
      includeJobs = true, // Include job-level analysis
      includeLogs = false, // Include log analysis (expensive)
    } = options;

    this.log("INFO", "Starting post-deployment workflow analysis", {
      days,
      environment,
      includeJobs,
      includeLogs,
    });

    const analysis = {
      summary: {
        total_runs: 0,
        successful_runs: 0,
        failed_runs: 0,
        in_progress_runs: 0,
        success_rate: 0,
        average_duration_minutes: 0,
        total_duration_minutes: 0,
        environment_breakdown: {},
        recent_failures: [],
        critical_errors: [],
      },
      workflows: [],
      recommendations: [],
    };

    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const createdRange = `${startDate.toISOString()}..${endDate.toISOString()}`;

      // Get deployment-related workflow runs
      const deploymentRuns = await this.getWorkflowRuns({
        event: "deployment",
        created: createdRange,
        per_page: 100,
      });

      const deploymentStatusRuns = await this.getWorkflowRuns({
        event: "deployment_status",
        created: createdRange,
        per_page: 100,
      });

      // Combine and deduplicate runs
      const allRuns = [...deploymentRuns, ...deploymentStatusRuns];
      const uniqueRuns = allRuns.filter(
        (run, index, self) => index === self.findIndex((r) => r.id === run.id)
      );

      analysis.summary.total_runs = uniqueRuns.length;

      // Analyze each run
      for (const run of uniqueRuns) {
        const workflow = {
          id: run.id,
          name: run.name,
          status: run.status,
          conclusion: run.conclusion,
          created_at: run.created_at,
          updated_at: run.updated_at,
          duration_minutes: null,
          environment: this.extractEnvironment(run),
          jobs: [],
          logs: null,
        };

        // Calculate duration if completed
        if (run.status === "completed" && run.created_at && run.updated_at) {
          const duration = new Date(run.updated_at) - new Date(run.created_at);
          workflow.duration_minutes = Math.round(duration / (1000 * 60));
          analysis.summary.total_duration_minutes += workflow.duration_minutes;
        }

        // Environment breakdown
        if (workflow.environment) {
          analysis.summary.environment_breakdown[workflow.environment] =
            (analysis.summary.environment_breakdown[workflow.environment] ||
              0) + 1;
        }

        // Status tracking
        if (run.status === "completed") {
          if (run.conclusion === "success") {
            analysis.summary.successful_runs++;
          } else if (run.conclusion === "failure") {
            analysis.summary.failed_runs++;
            analysis.summary.recent_failures.push({
              id: run.id,
              name: run.name,
              created_at: run.created_at,
              environment: workflow.environment,
            });
          }
        } else if (run.status === "in_progress") {
          analysis.summary.in_progress_runs++;
        }

        // Get detailed job information if requested
        if (includeJobs) {
          try {
            workflow.jobs = await this.getWorkflowRunJobs(run.id);
          } catch (error) {
            this.log(
              "WARN",
              `Failed to get jobs for run ${run.id}`,
              error.message
            );
          }
        }

        // Get logs if requested and run failed
        if (includeLogs && run.conclusion === "failure") {
          try {
            workflow.logs = await this.getWorkflowRunLogs(run.id);
          } catch (error) {
            this.log(
              "WARN",
              `Failed to get logs for run ${run.id}`,
              error.message
            );
          }
        }

        analysis.workflows.push(workflow);
      }

      // Calculate summary metrics
      if (analysis.summary.total_runs > 0) {
        analysis.summary.success_rate =
          (analysis.summary.successful_runs / analysis.summary.total_runs) *
          100;
      }

      if (analysis.summary.successful_runs > 0) {
        analysis.summary.average_duration_minutes =
          analysis.summary.total_duration_minutes /
          analysis.summary.successful_runs;
      }

      // Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis);

      this.log("SUCCESS", "Post-deployment analysis completed", {
        total_runs: analysis.summary.total_runs,
        success_rate: `${analysis.summary.success_rate.toFixed(1)}%`,
        average_duration: `${analysis.summary.average_duration_minutes.toFixed(1)} minutes`,
        failures: analysis.summary.recent_failures.length,
      });

      return analysis;
    } catch (error) {
      this.log("ERROR", "Post-deployment analysis failed", error.message);
      throw error;
    }
  }

  /**
   * Extract environment information from workflow run
   * @param {Object} run - Workflow run object
   * @returns {string|null} Environment name
   */
  extractEnvironment(run) {
    // Check branch name for environment
    if (run.head_branch) {
      if (
        run.head_branch.includes("prod") ||
        run.head_branch.includes("main") ||
        run.head_branch.includes("master")
      ) {
        return "production";
      }
      if (
        run.head_branch.includes("staging") ||
        run.head_branch.includes("stage")
      ) {
        return "staging";
      }
      if (
        run.head_branch.includes("dev") ||
        run.head_branch.includes("develop")
      ) {
        return "development";
      }
    }

    // Check workflow name for environment
    if (run.name) {
      const name = run.name.toLowerCase();
      if (name.includes("prod")) return "production";
      if (name.includes("staging") || name.includes("stage")) return "staging";
      if (name.includes("dev")) return "development";
    }

    // Check for deployment payload
    if (run.event === "deployment" && run.deployment?.environment) {
      return run.deployment.environment;
    }

    return null;
  }

  /**
   * Generate recommendations based on analysis
   * @param {Object} analysis - Analysis results
   * @returns {Array} Recommendations
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    // Success rate recommendations
    if (analysis.summary.success_rate < 80) {
      recommendations.push({
        priority: "HIGH",
        type: "SUCCESS_RATE",
        message: `Low success rate (${analysis.summary.success_rate.toFixed(1)}%). Investigate recent failures.`,
        action: "Review failure logs and fix recurring issues",
      });
    }

    // Duration recommendations
    if (analysis.summary.average_duration_minutes > 30) {
      recommendations.push({
        priority: "MEDIUM",
        type: "PERFORMANCE",
        message: `High average deployment duration (${analysis.summary.average_duration_minutes.toFixed(1)} minutes)`,
        action: "Optimize workflow steps and consider parallelization",
      });
    }

    // Environment-specific recommendations
    Object.entries(analysis.summary.environment_breakdown).forEach(
      ([env, count]) => {
        if (env === "production" && count < 5) {
          recommendations.push({
            priority: "MEDIUM",
            type: "COVERAGE",
            message: `Low production deployment frequency (${count} deployments)`,
            action: "Consider increasing deployment cadence for better testing",
          });
        }
      }
    );

    // Failure analysis recommendations
    if (analysis.summary.recent_failures.length > 3) {
      recommendations.push({
        priority: "HIGH",
        type: "FAILURE_ANALYSIS",
        message: `${analysis.summary.recent_failures.length} recent failures detected`,
        action: "Perform root cause analysis and implement fixes",
      });
    }

    return recommendations;
  }

  /**
   * Monitor workflow runs in real-time with continuous updates
   * @param {Object} options - Monitoring options
   * @returns {Promise<Object>} Monitoring results
   */
  async monitorWorkflowRuns(options = {}) {
    const {
      duration_minutes = 30, // How long to monitor
      poll_interval_seconds = 30, // How often to check
      target_status = "completed", // Status to wait for
      workflow_name = null, // Specific workflow to monitor
    } = options;

    this.log("INFO", "Starting real-time workflow monitoring", {
      duration_minutes,
      poll_interval_seconds,
      target_status,
      workflow_name,
    });

    this.monitoringActive = true;
    const startTime = Date.now();
    const endTime = startTime + duration_minutes * 60 * 1000;
    const monitoredRuns = new Map();

    try {
      while (Date.now() < endTime && this.monitoringActive) {
        const currentRuns = await this.getWorkflowRuns({
          status: target_status === "completed" ? null : target_status,
          per_page: 10,
        });

        for (const run of currentRuns) {
          if (workflow_name && !run.name.includes(workflow_name)) continue;

          const runKey = run.id.toString();

          if (!monitoredRuns.has(runKey)) {
            this.log(
              "INFO",
              `New workflow run detected: ${run.name} (${run.id})`
            );
            monitoredRuns.set(runKey, {
              ...run,
              first_seen: new Date(),
              last_status: run.status,
              last_conclusion: run.conclusion,
            });
          } else {
            const existing = monitoredRuns.get(runKey);

            // Check for status changes
            if (
              existing.status !== run.status ||
              existing.conclusion !== run.conclusion
            ) {
              this.log(
                "INFO",
                `Workflow ${run.name} status changed: ${existing.status}/${existing.conclusion} → ${run.status}/${run.conclusion}`
              );

              existing.status = run.status;
              existing.conclusion = run.conclusion;
              existing.last_updated = new Date();

              // If completed, log final result
              if (run.status === "completed") {
                const duration = new Date() - existing.first_seen;
                const durationMinutes = Math.round(duration / (1000 * 60));

                if (run.conclusion === "success") {
                  this.log(
                    "SUCCESS",
                    `✅ Workflow ${run.name} completed successfully in ${durationMinutes} minutes`
                  );
                } else {
                  this.log(
                    "ERROR",
                    `❌ Workflow ${run.name} failed after ${durationMinutes} minutes`
                  );
                }
              }
            }
          }
        }

        // Check if we should stop monitoring
        const completedRuns = Array.from(monitoredRuns.values()).filter(
          (run) => run.status === target_status
        );

        if (target_status === "completed" && completedRuns.length > 0) {
          this.log(
            "INFO",
            `Target status '${target_status}' achieved for ${completedRuns.length} workflows`
          );
          break;
        }

        await this.sleep(poll_interval_seconds * 1000);
      }

      const results = {
        duration_minutes: Math.round((Date.now() - startTime) / (1000 * 60)),
        monitored_runs: Array.from(monitoredRuns.values()),
        summary: {
          total: monitoredRuns.size,
          completed: Array.from(monitoredRuns.values()).filter(
            (r) => r.status === "completed"
          ).length,
          failed: Array.from(monitoredRuns.values()).filter(
            (r) => r.conclusion === "failure"
          ).length,
          successful: Array.from(monitoredRuns.values()).filter(
            (r) => r.conclusion === "success"
          ).length,
        },
      };

      this.log("SUCCESS", "Workflow monitoring completed", results.summary);
      return results;
    } catch (error) {
      this.log("ERROR", "Workflow monitoring failed", error.message);
      throw error;
    } finally {
      this.monitoringActive = false;
    }
  }

  /**
   * Stop active monitoring
   */
  stopMonitoring() {
    this.monitoringActive = false;
    this.log("INFO", "Monitoring stopped by user request");
  }

  /**
   * Utility sleep function
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Export logs to file
   * @param {string} filename - Output filename
   */
  exportLogs(filename = null) {
    if (!filename) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      filename = `github-actions-monitor-${timestamp}.log`;
    }

    const logPath = path.join(process.cwd(), filename);
    const logContent = this.logs
      .map(
        (entry) =>
          `[${entry.timestamp}] ${entry.level}: ${entry.message}${entry.data ? "\n  " + JSON.stringify(entry.data, null, 2) : ""}`
      )
      .join("\n\n");

    fs.writeFileSync(logPath, logContent);
    this.log("INFO", `Logs exported to ${logPath}`);
    return logPath;
  }

  /**
   * Get repository information
   * @returns {Promise<Object>} Repository info
   */
  async getRepositoryInfo() {
    try {
      const response = await this.client.get(
        `/repos/${this.owner}/${this.repo}`
      );
      return response.data;
    } catch (error) {
      this.log(
        "ERROR",
        "Failed to get repository info",
        error.response?.data || error.message
      );
      throw error;
    }
  }
}

module.exports = GitHubActionsMonitor;

// CLI interface
if (require.main === module) {
  const monitor = new GitHubActionsMonitor();

  const command = process.argv[2];

  async function main() {
    try {
      switch (command) {
        case "analyze":
          const days = parseInt(process.argv[3]) || 7;
          const analysis = await monitor.analyzePostDeploymentWorkflows({
            days,
          });
          console.log("\n📊 Analysis Results:");
          console.log(JSON.stringify(analysis.summary, null, 2));
          break;

        case "monitor":
          const duration = parseInt(process.argv[3]) || 10;
          console.log(`\n🔍 Monitoring workflows for ${duration} minutes...`);
          const results = await monitor.monitorWorkflowRuns({
            duration_minutes: duration,
          });
          console.log("\n📈 Monitoring Results:");
          console.log(JSON.stringify(results.summary, null, 2));
          break;

        case "runs":
          const runs = await monitor.getWorkflowRuns({ per_page: 5 });
          console.log("\n📋 Recent Workflow Runs:");
          runs.forEach((run) => {
            console.log(
              `• ${run.name} (${run.id}): ${run.status} - ${run.conclusion || "pending"}`
            );
          });
          break;

        case "info":
          const info = await monitor.getRepositoryInfo();
          console.log("\n📂 Repository Info:");
          console.log(`Name: ${info.name}`);
          console.log(`Owner: ${info.owner.login}`);
          console.log(`Description: ${info.description}`);
          console.log(`Stars: ${info.stargazers_count}`);
          break;

        default:
          console.log("\n🚀 GitHub Actions Monitor CLI");
          console.log("Usage:");
          console.log(
            "  analyze [days]    - Analyze post-deployment workflows"
          );
          console.log("  monitor [minutes] - Monitor workflows in real-time");
          console.log("  runs              - List recent workflow runs");
          console.log("  info              - Show repository information");
          console.log("\nEnvironment Variables:");
          console.log("  GITHUB_TOKEN      - GitHub API token (recommended)");
          console.log("  GITHUB_REPOSITORY - Repository (owner/repo format)");
          break;
      }
    } catch (error) {
      console.error("❌ Error:", error.message);
      process.exit(1);
    } finally {
      // Export logs
      monitor.exportLogs();
    }
  }

  main();
}

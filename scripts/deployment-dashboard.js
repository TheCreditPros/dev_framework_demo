#!/usr/bin/env node

/**
 * Deployment Monitoring Dashboard
 * Real-time status updates and comprehensive error tracking for GitHub Actions deployments
 */

const GitHubActionsMonitor = require("./github-actions-monitor");
const DeploymentValidationLoop = require("./deployment-validation-loop");

class DeploymentDashboard {
  constructor() {
    this.monitor = new GitHubActionsMonitor();
    this.loop = new DeploymentValidationLoop();
    this.isRunning = false;
    this.dashboardData = {
      lastUpdate: null,
      summary: {},
      workflows: [],
      errors: [],
      recommendations: [],
      metrics: {},
    };
  }

  /**
   * Display the main dashboard
   */
  async displayDashboard(options = {}) {
    const {
      refreshInterval = 30, // Refresh every 30 seconds
      maxRuntime = 3600, // Run for 1 hour max
      showDetails = true, // Show detailed information
      autoRefresh = true, // Auto-refresh the display
    } = options;

    this.isRunning = true;
    console.clear();

    console.log("🚀 DEPLOYMENT MONITORING DASHBOARD");
    console.log("===================================");
    console.log(`Repository: ${this.monitor.owner}/${this.monitor.repo}`);
    console.log(`Started: ${new Date().toLocaleString()}`);
    console.log(
      `Refresh: Every ${refreshInterval}s | Max Runtime: ${maxRuntime / 60}min\n`
    );

    const startTime = Date.now();
    let cycleCount = 0;

    while (this.isRunning && Date.now() - startTime < maxRuntime * 1000) {
      cycleCount++;
      console.log(
        `\n🔄 Dashboard Update #${cycleCount} - ${new Date().toLocaleTimeString()}`
      );
      console.log("─".repeat(60));

      try {
        await this.updateDashboardData();
        this.renderDashboard(showDetails);

        if (autoRefresh) {
          console.log(
            `\n⏳ Next update in ${refreshInterval} seconds... (Ctrl+C to stop)`
          );
          await this.sleep(refreshInterval * 1000);
        } else {
          break;
        }
      } catch (error) {
        console.error(`❌ Dashboard update failed: ${error.message}`);
        await this.sleep(5000); // Wait 5 seconds before retry
      }
    }

    console.log("\n🏁 Dashboard session ended");
    this.displayFinalSummary();
  }

  /**
   * Update dashboard data from GitHub Actions API
   */
  async updateDashboardData() {
    try {
      this.dashboardData.lastUpdate = new Date();

      // Get comprehensive analysis
      const analysis = await this.monitor.analyzePostDeploymentWorkflows({
        days: 1,
        includeJobs: true,
        includeLogs: false, // Skip logs for dashboard performance
      });

      this.dashboardData.summary = analysis.summary;
      this.dashboardData.workflows = analysis.workflows.slice(0, 10); // Last 10 workflows
      this.dashboardData.recommendations = analysis.recommendations;

      // Calculate additional metrics
      this.calculateMetrics();

      // Get recent errors
      this.dashboardData.errors = this.extractRecentErrors();
    } catch (error) {
      this.monitor.log(
        "ERROR",
        "Failed to update dashboard data",
        error.message
      );
      throw error;
    }
  }

  /**
   * Calculate additional metrics for the dashboard
   */
  calculateMetrics() {
    const summary = this.dashboardData.summary;

    this.dashboardData.metrics = {
      health_score: this.calculateHealthScore(),
      average_duration: summary.average_duration_minutes || 0,
      failure_rate:
        summary.total_runs > 0
          ? (summary.failed_runs / summary.total_runs) * 100
          : 0,
      success_rate: summary.success_rate || 0,
      active_workflows: summary.in_progress_runs || 0,
      recent_failures: summary.recent_failures?.length || 0,
      environment_status: this.getEnvironmentStatus(),
    };
  }

  /**
   * Calculate overall health score (0-100)
   */
  calculateHealthScore() {
    const summary = this.dashboardData.summary;
    let score = 100;

    // Success rate impact (40% weight)
    if (summary.success_rate !== undefined) {
      score -= (100 - summary.success_rate) * 0.4;
    }

    // Recent failures impact (30% weight)
    const recentFailures = summary.recent_failures?.length || 0;
    score -= Math.min(recentFailures * 10, 30);

    // In-progress workflows impact (20% weight)
    const inProgress = summary.in_progress_runs || 0;
    score -= Math.min(inProgress * 5, 20);

    // Duration impact (10% weight)
    if (summary.average_duration_minutes > 15) {
      score -= Math.min((summary.average_duration_minutes - 15) * 2, 10);
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * Get environment status summary
   */
  getEnvironmentStatus() {
    const envBreakdown = this.dashboardData.summary.environment_breakdown || {};
    const status = {};

    Object.entries(envBreakdown).forEach(([env, count]) => {
      if (env === "production") {
        status[env] = count > 0 ? "ACTIVE" : "INACTIVE";
      } else if (env === "staging") {
        status[env] = count > 0 ? "ACTIVE" : "QUIET";
      } else {
        status[env] = count > 0 ? "ACTIVE" : "IDLE";
      }
    });

    return status;
  }

  /**
   * Extract recent errors from workflows
   */
  extractRecentErrors() {
    const errors = [];
    const workflows = this.dashboardData.workflows || [];

    workflows.forEach((workflow) => {
      if (workflow.conclusion === "failure") {
        errors.push({
          workflow: workflow.name,
          run_id: workflow.id,
          created_at: workflow.created_at,
          environment: workflow.environment,
          duration: workflow.duration_minutes,
        });
      }
    });

    return errors.slice(0, 5); // Last 5 errors
  }

  /**
   * Render the dashboard to console
   */
  renderDashboard(showDetails = true) {
    const data = this.dashboardData;
    const metrics = this.dashboardData.metrics;

    // Health Score
    const healthEmoji =
      metrics.health_score >= 80
        ? "🟢"
        : metrics.health_score >= 60
          ? "🟡"
          : "🔴";
    console.log(`${healthEmoji} HEALTH SCORE: ${metrics.health_score}/100`);

    // Key Metrics
    console.log("\n📊 KEY METRICS:");
    console.log(`  ✅ Success Rate: ${metrics.success_rate.toFixed(1)}%`);
    console.log(`  ❌ Failure Rate: ${metrics.failure_rate.toFixed(1)}%`);
    console.log(
      `  ⏱️  Avg Duration: ${metrics.average_duration.toFixed(1)} minutes`
    );
    console.log(`  🔄 Active Workflows: ${metrics.active_workflows}`);
    console.log(`  🚨 Recent Failures: ${metrics.recent_failures}`);

    // Environment Status
    console.log("\n🌍 ENVIRONMENT STATUS:");
    Object.entries(metrics.environment_status).forEach(([env, status]) => {
      const emoji =
        status === "ACTIVE" ? "🟢" : status === "QUIET" ? "🟡" : "⚪";
      console.log(`  ${emoji} ${env.toUpperCase()}: ${status}`);
    });

    // Recent Workflows
    if (showDetails && data.workflows.length > 0) {
      console.log("\n📋 RECENT WORKFLOWS:");
      data.workflows.slice(0, 5).forEach((workflow) => {
        const status =
          workflow.status === "completed"
            ? workflow.conclusion === "success"
              ? "✅"
              : "❌"
            : workflow.status === "in_progress"
              ? "🔄"
              : "⏸️";

        const duration = workflow.duration_minutes
          ? `${workflow.duration_minutes.toFixed(1)}m`
          : "N/A";

        console.log(`  ${status} ${workflow.name} (${workflow.id})`);
        console.log(
          `     Status: ${workflow.status} | Duration: ${duration} | Env: ${workflow.environment || "N/A"}`
        );
      });
    }

    // Recent Errors
    if (data.errors.length > 0) {
      console.log("\n🚨 RECENT ERRORS:");
      data.errors.forEach((error) => {
        console.log(`  ❌ ${error.workflow} (${error.run_id})`);
        console.log(
          `     Environment: ${error.environment || "N/A"} | Duration: ${error.duration || "N/A"}m`
        );
        console.log(
          `     Created: ${new Date(error.created_at).toLocaleString()}`
        );
      });
    }

    // Recommendations
    if (data.recommendations.length > 0) {
      console.log("\n💡 RECOMMENDATIONS:");
      data.recommendations.forEach((rec) => {
        const priorityEmoji =
          rec.priority === "CRITICAL"
            ? "🔴"
            : rec.priority === "HIGH"
              ? "🟠"
              : "🟡";
        console.log(`  ${priorityEmoji} ${rec.message}`);
      });
    }

    // Last Update
    console.log(`\n🕒 Last Update: ${data.lastUpdate.toLocaleString()}`);
  }

  /**
   * Display final summary when dashboard ends
   */
  displayFinalSummary() {
    const data = this.dashboardData;
    const metrics = this.dashboardData.metrics;

    console.log("\n🎯 FINAL DEPLOYMENT SUMMARY");
    console.log("===========================");

    if (Object.keys(data.summary).length > 0) {
      console.log(`Total Workflows Analyzed: ${data.summary.total_runs || 0}`);
      console.log(
        `Successful Deployments: ${data.summary.successful_runs || 0}`
      );
      console.log(`Failed Deployments: ${data.summary.failed_runs || 0}`);
      console.log(
        `Average Duration: ${metrics.average_duration.toFixed(1)} minutes`
      );
      console.log(`Final Health Score: ${metrics.health_score}/100`);
    } else {
      console.log("No workflow data available");
    }

    console.log("\n📄 Dashboard session complete");
    console.log(
      `Use 'node scripts/deployment-dashboard.js' to restart monitoring`
    );
  }

  /**
   * Generate a detailed HTML report
   */
  async generateHTMLReport(filename = null) {
    if (!filename) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      filename = `deployment-report-${timestamp}.html`;
    }

    const html = this.generateHTMLContent();
    const filepath = `/Users/damondecrescenzo/dev_framework_demo/${filename}`;

    require("fs").writeFileSync(filepath, html);
    console.log(`📄 HTML report generated: ${filepath}`);
    return filepath;
  }

  /**
   * Generate HTML content for the report
   */
  generateHTMLContent() {
    const data = this.dashboardData;
    const metrics = this.dashboardData.metrics;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deployment Monitoring Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #007acc; padding-bottom: 20px; margin-bottom: 30px; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #007acc; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007acc; }
        .metric-label { color: #666; margin-top: 5px; }
        .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .status-card { padding: 15px; border-radius: 6px; text-align: center; }
        .status-active { background: #d4edda; color: #155724; }
        .status-inactive { background: #f8d7da; color: #721c24; }
        .workflow-list { margin-bottom: 30px; }
        .workflow-item { background: #f8f9fa; padding: 15px; margin-bottom: 10px; border-radius: 6px; border-left: 4px solid #28a745; }
        .error-item { background: #f8d7da; padding: 15px; margin-bottom: 10px; border-radius: 6px; border-left: 4px solid #dc3545; }
        .recommendation-item { background: #fff3cd; padding: 15px; margin-bottom: 10px; border-radius: 6px; border-left: 4px solid #ffc107; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Deployment Monitoring Report</h1>
            <p><strong>Repository:</strong> ${this.monitor.owner}/${this.monitor.repo}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-value">${metrics.health_score}/100</div>
                <div class="metric-label">Health Score</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${metrics.success_rate.toFixed(1)}%</div>
                <div class="metric-label">Success Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${metrics.average_duration.toFixed(1)}m</div>
                <div class="metric-label">Avg Duration</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.summary.total_runs || 0}</div>
                <div class="metric-label">Total Workflows</div>
            </div>
        </div>

        <h2>🌍 Environment Status</h2>
        <div class="status-grid">
            ${Object.entries(metrics.environment_status)
              .map(
                ([env, status]) => `
                <div class="status-card ${status === "ACTIVE" ? "status-active" : "status-inactive"}">
                    <strong>${env.toUpperCase()}</strong><br>
                    ${status}
                </div>
            `
              )
              .join("")}
        </div>

        ${
          data.workflows.length > 0
            ? `
        <h2>📋 Recent Workflows</h2>
        <div class="workflow-list">
            ${data.workflows
              .slice(0, 10)
              .map(
                (workflow) => `
                <div class="workflow-item">
                    <strong>${workflow.name}</strong> (${workflow.id})<br>
                    <span class="timestamp">Status: ${workflow.status} | Duration: ${workflow.duration_minutes || "N/A"}m | Environment: ${workflow.environment || "N/A"}</span>
                </div>
            `
              )
              .join("")}
        </div>
        `
            : ""
        }

        ${
          data.errors.length > 0
            ? `
        <h2>🚨 Recent Errors</h2>
        <div class="workflow-list">
            ${data.errors
              .map(
                (error) => `
                <div class="error-item">
                    <strong>${error.workflow}</strong> (${error.run_id})<br>
                    <span class="timestamp">Environment: ${error.environment || "N/A"} | Duration: ${error.duration || "N/A"}m | Created: ${new Date(error.created_at).toLocaleString()}</span>
                </div>
            `
              )
              .join("")}
        </div>
        `
            : ""
        }

        ${
          data.recommendations.length > 0
            ? `
        <h2>💡 Recommendations</h2>
        <div class="workflow-list">
            ${data.recommendations
              .map(
                (rec) => `
                <div class="recommendation-item">
                    <strong>${rec.priority}:</strong> ${rec.message}<br>
                    <span class="timestamp">${rec.action}</span>
                </div>
            `
              )
              .join("")}
        </div>
        `
            : ""
        }
    </div>
</body>
</html>`;
  }

  /**
   * Start interactive monitoring mode
   */
  async startInteractiveMode() {
    console.log("🔍 Starting Interactive Deployment Monitoring...");
    console.log("Commands:");
    console.log("  status  - Show current status");
    console.log("  refresh - Refresh dashboard data");
    console.log("  report  - Generate HTML report");
    console.log("  analyze - Run detailed analysis");
    console.log("  quit    - Exit interactive mode");
    console.log("");

    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const askCommand = () => {
      rl.question("deployment-monitor> ", async (command) => {
        try {
          switch (command.toLowerCase()) {
            case "status":
              await this.updateDashboardData();
              this.renderDashboard(true);
              break;

            case "refresh":
              console.log("🔄 Refreshing data...");
              await this.updateDashboardData();
              console.log("✅ Data refreshed");
              break;

            case "report":
              console.log("📄 Generating HTML report...");
              const reportPath = await this.generateHTMLReport();
              console.log(`✅ Report generated: ${reportPath}`);
              break;

            case "analyze":
              console.log("🔍 Running detailed analysis...");
              const analysis =
                await this.monitor.analyzePostDeploymentWorkflows({
                  days: 7,
                  includeJobs: true,
                  includeLogs: true,
                });
              console.log("📊 Detailed Analysis Results:");
              console.log(JSON.stringify(analysis.summary, null, 2));
              break;

            case "quit":
            case "exit":
              console.log("👋 Goodbye!");
              rl.close();
              return;

            default:
              console.log(
                '❓ Unknown command. Type "help" for available commands.'
              );
              break;
          }
        } catch (error) {
          console.error(`❌ Command failed: ${error.message}`);
        }

        askCommand();
      });
    };

    askCommand();
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Stop the dashboard
   */
  stop() {
    this.isRunning = false;
    console.log("\n🛑 Dashboard stopped");
  }
}

// CLI interface
if (require.main === module) {
  const dashboard = new DeploymentDashboard();

  const command = process.argv[2];

  async function main() {
    try {
      switch (command) {
        case "live":
          await dashboard.displayDashboard({
            refreshInterval: 30,
            maxRuntime: 3600,
            showDetails: true,
          });
          break;

        case "quick":
          await dashboard.displayDashboard({
            refreshInterval: 0, // No auto-refresh
            showDetails: true,
          });
          break;

        case "report":
          await dashboard.updateDashboardData();
          await dashboard.generateHTMLReport();
          break;

        case "interactive":
          await dashboard.startInteractiveMode();
          break;

        default:
          console.log("\n🚀 Deployment Monitoring Dashboard CLI");
          console.log("Usage:");
          console.log("  live         - Start live monitoring dashboard");
          console.log("  quick        - Show current status once");
          console.log("  report       - Generate HTML report");
          console.log("  interactive  - Start interactive monitoring mode");
          console.log("\nEnvironment Variables:");
          console.log("  GITHUB_TOKEN      - GitHub API token (recommended)");
          console.log("  GITHUB_REPOSITORY - Repository (owner/repo format)");
          break;
      }
    } catch (error) {
      console.error("❌ Error:", error.message);
      process.exit(1);
    }
  }

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Received SIGINT, stopping dashboard...");
    dashboard.stop();
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 Received SIGTERM, stopping dashboard...");
    dashboard.stop();
  });

  main();
}

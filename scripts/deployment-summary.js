#!/usr/bin/env node

/**
 * Deployment Summary & Health Check
 * Comprehensive overview of the deployment monitoring system
 */

const GitHubActionsMonitor = require("./github-actions-monitor");
const DeploymentValidationLoop = require("./deployment-validation-loop");
const DeploymentMemory = require("./deployment-memory");

class DeploymentSummary {
  constructor() {
    this.monitor = new GitHubActionsMonitor();
    this.memory = new DeploymentMemory();
    this.loop = new DeploymentValidationLoop();
  }

  /**
   * Generate comprehensive deployment summary
   */
  async generateSummary(options = {}) {
    const { days = 7, showDetails = true, generateReport = true } = options;

    console.log("📊 DEPLOYMENT MONITORING SYSTEM SUMMARY");
    console.log("=======================================");
    console.log(`Generated: ${new Date().toLocaleString()}`);
    console.log(`Analysis Period: Last ${days} days\n`);

    const summary = {
      timestamp: new Date().toISOString(),
      systemHealth: {},
      deploymentStats: {},
      complianceStatus: {},
      recentActivity: {},
      recommendations: [],
    };

    try {
      // System health check
      console.log("🔍 Checking system components...");
      summary.systemHealth = await this.checkSystemHealth();

      // Deployment statistics
      console.log("📈 Analyzing deployment statistics...");
      summary.deploymentStats = await this.analyzeDeploymentStats(days);

      // Compliance status
      console.log("✅ Checking compliance status...");
      summary.complianceStatus = this.memory.generateComplianceReport();

      // Recent activity
      console.log("📋 Gathering recent activity...");
      summary.recentActivity = await this.getRecentActivity(days);

      // Generate recommendations
      summary.recommendations = this.generateSystemRecommendations(summary);

      // Display results
      this.displaySummary(summary, showDetails);

      // Generate report file
      if (generateReport) {
        await this.generateReportFile(summary);
      }

      return summary;
    } catch (error) {
      console.error("❌ Failed to generate deployment summary:", error.message);
      throw error;
    }
  }

  /**
   * Check health of all system components
   */
  async checkSystemHealth() {
    const health = {
      overall: "UNKNOWN",
      components: {},
      issues: [],
    };

    // Check GitHub API connectivity
    try {
      await this.monitor.getRepositoryInfo();
      health.components.github_api = "HEALTHY";
    } catch (error) {
      health.components.github_api = "UNHEALTHY";
      health.issues.push(`GitHub API: ${error.message}`);
    }

    // Check deployment memory system
    try {
      const stats = this.memory.getStatistics();
      health.components.deployment_memory = "HEALTHY";
      health.components.memory_stats = stats;
    } catch (error) {
      health.components.deployment_memory = "UNHEALTHY";
      health.issues.push(`Deployment Memory: ${error.message}`);
    }

    // Check workflow files
    const fs = require("fs");
    const path = require("path");
    const workflowsDir = path.join(process.cwd(), ".github", "workflows");

    if (fs.existsSync(workflowsDir)) {
      const workflowFiles = fs
        .readdirSync(workflowsDir)
        .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"));

      health.components.workflow_files =
        workflowFiles.length > 0 ? "HEALTHY" : "WARNING";
      health.components.workflow_count = workflowFiles.length;
    } else {
      health.components.workflow_files = "MISSING";
      health.issues.push("Workflows directory .github/workflows not found");
    }

    // Check configuration files
    const configFiles = [
      "config/error-patterns.json",
      "config/fix-strategies.json",
    ];

    health.components.configuration = "HEALTHY";
    for (const configFile of configFiles) {
      if (!fs.existsSync(path.join(process.cwd(), configFile))) {
        health.components.configuration = "INCOMPLETE";
        health.issues.push(`Configuration file missing: ${configFile}`);
      }
    }

    // Determine overall health
    const unhealthyComponents = Object.values(health.components).filter(
      (status) => status === "UNHEALTHY" || status === "MISSING"
    );

    if (unhealthyComponents.length === 0) {
      health.overall = "HEALTHY";
    } else if (
      unhealthyComponents.length === 1 &&
      health.components.workflow_files === "WARNING"
    ) {
      health.overall = "WARNING";
    } else {
      health.overall = "UNHEALTHY";
    }

    return health;
  }

  /**
   * Analyze deployment statistics
   */
  async analyzeDeploymentStats(days) {
    const stats = {
      totalDeployments: 0,
      successfulDeployments: 0,
      failedDeployments: 0,
      monitoredDeployments: 0,
      averageDuration: 0,
      environmentBreakdown: {},
      failureRate: 0,
      successRate: 0,
    };

    try {
      // Get workflow analysis
      const analysis = await this.monitor.analyzePostDeploymentWorkflows({
        days,
        includeJobs: false,
        includeLogs: false,
      });

      // Get memory statistics
      const memoryStats = this.memory.getStatistics();

      // Combine statistics
      stats.totalDeployments = analysis.summary.total_runs || 0;
      stats.successfulDeployments = analysis.summary.successful_runs || 0;
      stats.failedDeployments = analysis.summary.failed_runs || 0;
      stats.averageDuration = analysis.summary.average_duration_minutes || 0;
      stats.environmentBreakdown = analysis.summary.environment_breakdown || {};

      // Calculate rates
      if (stats.totalDeployments > 0) {
        stats.failureRate =
          (stats.failedDeployments / stats.totalDeployments) * 100;
        stats.successRate =
          (stats.successfulDeployments / stats.totalDeployments) * 100;
      }

      // Add memory compliance data
      stats.monitoredDeployments = memoryStats.monitoredPercentage
        ? (memoryStats.totalDeployments * memoryStats.monitoredPercentage) / 100
        : 0;
    } catch (error) {
      console.warn("⚠️ Could not analyze deployment stats:", error.message);
    }

    return stats;
  }

  /**
   * Get recent activity summary
   */
  async getRecentActivity(days) {
    const activity = {
      recentDeployments: [],
      recentFailures: [],
      activeWorkflows: [],
      pendingMonitoring: [],
    };

    try {
      // Get recent workflow runs
      const runs = await this.monitor.getWorkflowRuns({
        per_page: 10,
      });

      activity.recentDeployments = runs.slice(0, 5).map((run) => ({
        id: run.id,
        name: run.name,
        status: run.status,
        conclusion: run.conclusion,
        created_at: run.created_at,
        environment: this.monitor.extractEnvironment(run),
      }));

      // Get recent failures
      const failures = runs
        .filter((run) => run.conclusion === "failure")
        .slice(0, 3);
      activity.recentFailures = failures.map((failure) => ({
        id: failure.id,
        name: failure.name,
        created_at: failure.created_at,
        environment: this.monitor.extractEnvironment(failure),
      }));

      // Get active workflows
      const activeRuns = runs.filter((run) => run.status === "in_progress");
      activity.activeWorkflows = activeRuns.map((run) => ({
        id: run.id,
        name: run.name,
        started_at: run.created_at,
      }));
    } catch (error) {
      console.warn("⚠️ Could not get recent activity:", error.message);
    }

    // Get pending monitoring from memory system
    const reminders = this.memory.checkReminders();
    activity.pendingMonitoring = reminders.map((reminder) => ({
      deploymentId: reminder.deploymentId,
      hoursSinceDeployment: reminder.hoursSinceDeployment,
      environment: reminder.environment,
      priority: reminder.priority,
    }));

    return activity;
  }

  /**
   * Generate system-wide recommendations
   */
  generateSystemRecommendations(summary) {
    const recommendations = [];

    // Health-based recommendations
    if (summary.systemHealth.overall === "UNHEALTHY") {
      recommendations.push({
        priority: "CRITICAL",
        type: "SYSTEM_HEALTH",
        message: "System health is compromised",
        action: "Fix critical system issues immediately",
        details: summary.systemHealth.issues,
      });
    }

    // Compliance recommendations
    const compliance = summary.complianceStatus;
    if (compliance.compliance?.status === "NON_COMPLIANT") {
      recommendations.push({
        priority: "HIGH",
        type: "COMPLIANCE",
        message: `Low monitoring compliance: ${compliance.compliance.complianceRate.toFixed(1)}%`,
        action: "Monitor unmonitored deployments immediately",
      });
    }

    // Deployment success recommendations
    const stats = summary.deploymentStats;
    if (stats.failureRate > 20) {
      recommendations.push({
        priority: "HIGH",
        type: "DEPLOYMENT_SUCCESS",
        message: `High failure rate: ${stats.failureRate.toFixed(1)}%`,
        action: "Analyze and fix deployment issues",
      });
    }

    // Performance recommendations
    if (stats.averageDuration > 30) {
      recommendations.push({
        priority: "MEDIUM",
        type: "PERFORMANCE",
        message: `Slow deployments: ${stats.averageDuration.toFixed(1)} minutes average`,
        action: "Optimize deployment workflows",
      });
    }

    // Pending monitoring recommendations
    const pending = summary.recentActivity.pendingMonitoring;
    if (pending.length > 0) {
      const criticalPending = pending.filter((p) => p.priority === "CRITICAL");
      if (criticalPending.length > 0) {
        recommendations.push({
          priority: "CRITICAL",
          type: "PENDING_MONITORING",
          message: `${criticalPending.length} critical deployments unmonitored`,
          action: "Monitor critical deployments immediately",
        });
      }
    }

    return recommendations;
  }

  /**
   * Display summary in console
   */
  displaySummary(summary, showDetails = true) {
    const health = summary.systemHealth;
    const stats = summary.deploymentStats;
    const compliance = summary.complianceStatus.compliance;
    const activity = summary.recentActivity;

    // Overall status
    const healthEmoji =
      health.overall === "HEALTHY"
        ? "🟢"
        : health.overall === "WARNING"
          ? "🟡"
          : "🔴";
    console.log(`\n${healthEmoji} SYSTEM STATUS: ${health.overall}`);

    // Component health
    console.log("\n🏥 COMPONENT HEALTH:");
    Object.entries(health.components).forEach(([component, status]) => {
      const emoji =
        status === "HEALTHY"
          ? "✅"
          : status === "WARNING"
            ? "⚠️"
            : status === "UNHEALTHY"
              ? "❌"
              : "❓";
      console.log(
        `  ${emoji} ${component.replace(/_/g, " ").toUpperCase()}: ${status}`
      );
    });

    if (health.issues.length > 0) {
      console.log("\n🚨 SYSTEM ISSUES:");
      health.issues.forEach((issue) => console.log(`  • ${issue}`));
    }

    // Deployment statistics
    console.log("\n📈 DEPLOYMENT STATISTICS:");
    console.log(`  Total Deployments: ${stats.totalDeployments}`);
    console.log(`  Success Rate: ${stats.successRate.toFixed(1)}%`);
    console.log(`  Failure Rate: ${stats.failureRate.toFixed(1)}%`);
    console.log(
      `  Average Duration: ${stats.averageDuration.toFixed(1)} minutes`
    );
    console.log(`  Monitored: ${stats.monitoredDeployments} deployments`);

    // Environment breakdown
    if (Object.keys(stats.environmentBreakdown).length > 0) {
      console.log("\n🌍 ENVIRONMENT BREAKDOWN:");
      Object.entries(stats.environmentBreakdown).forEach(([env, count]) => {
        console.log(`  ${env}: ${count} deployments`);
      });
    }

    // Compliance status
    if (compliance) {
      console.log("\n✅ COMPLIANCE STATUS:");
      console.log(`  Status: ${compliance.status}`);
      console.log(
        `  Compliance Rate: ${compliance.complianceRate.toFixed(1)}%`
      );
      console.log(
        `  Unmonitored: ${compliance.unmonitoredDeployments}/${compliance.totalDeployments}`
      );
    }

    // Recent activity
    if (showDetails && activity.recentDeployments.length > 0) {
      console.log("\n📋 RECENT DEPLOYMENTS:");
      activity.recentDeployments.forEach((deployment) => {
        const status =
          deployment.status === "completed"
            ? deployment.conclusion === "success"
              ? "✅"
              : "❌"
            : deployment.status === "in_progress"
              ? "🔄"
              : "⏸️";
        console.log(
          `  ${status} ${deployment.name} (${new Date(deployment.created_at).toLocaleString()})`
        );
      });
    }

    if (activity.recentFailures.length > 0) {
      console.log("\n🚨 RECENT FAILURES:");
      activity.recentFailures.forEach((failure) => {
        console.log(
          `  ❌ ${failure.name} (${new Date(failure.created_at).toLocaleString()})`
        );
      });
    }

    if (activity.pendingMonitoring.length > 0) {
      console.log("\n⏰ PENDING MONITORING:");
      activity.pendingMonitoring.slice(0, 3).forEach((pending) => {
        const priorityEmoji =
          pending.priority === "CRITICAL"
            ? "🔴"
            : pending.priority === "HIGH"
              ? "🟠"
              : "🟡";
        console.log(
          `  ${priorityEmoji} ${pending.deploymentId}: ${pending.hoursSinceDeployment}h old`
        );
      });
    }

    // Recommendations
    if (summary.recommendations.length > 0) {
      console.log("\n💡 SYSTEM RECOMMENDATIONS:");
      summary.recommendations.forEach((rec) => {
        const priorityEmoji =
          rec.priority === "CRITICAL"
            ? "🔴"
            : rec.priority === "HIGH"
              ? "🟠"
              : "🟡";
        console.log(`  ${priorityEmoji} ${rec.message}`);
        console.log(`     → ${rec.action}`);
      });
    }
  }

  /**
   * Generate detailed report file
   */
  async generateReportFile(summary) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `deployment-summary-${timestamp}.json`;
    const filepath = `/Users/damondecrescenzo/dev_framework_demo/${filename}`;

    const fs = require("fs");
    fs.writeFileSync(filepath, JSON.stringify(summary, null, 2));

    console.log(`\n📄 Detailed report saved: ${filepath}`);
    return filepath;
  }
}

// CLI interface
if (require.main === module) {
  const summary = new DeploymentSummary();

  const command = process.argv[2];
  const days = parseInt(process.argv[3]) || 7;

  async function main() {
    try {
      switch (command) {
        case "quick":
          await summary.generateSummary({ days, showDetails: false });
          break;

        case "detailed":
          await summary.generateSummary({ days, showDetails: true });
          break;

        case "report":
          const result = await summary.generateSummary({
            days,
            showDetails: true,
          });
          console.log(`\n📊 Summary generated successfully`);
          console.log(
            `Use 'node scripts/deployment-summary.js detailed ${days}' for full details`
          );
          break;

        default:
          console.log("\n📊 Deployment Summary CLI");
          console.log("Usage:");
          console.log("  quick [days]     - Quick system overview");
          console.log("  detailed [days]  - Detailed system analysis");
          console.log("  report [days]    - Generate and save detailed report");
          console.log("\nExamples:");
          console.log("  node scripts/deployment-summary.js detailed 7");
          console.log("  node scripts/deployment-summary.js quick 1");
          break;
      }
    } catch (error) {
      console.error("❌ Error:", error.message);
      process.exit(1);
    }
  }

  main();
}

module.exports = DeploymentSummary;

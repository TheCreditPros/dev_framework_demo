#!/usr/bin/env node

/**
 * Deployment Memory System
 * Tracks deployments and ensures post-deployment monitoring is never skipped
 * Provides reminders, validation, and comprehensive deployment history
 */

const fs = require("fs");
const path = require("path");
const GitHubActionsMonitor = require("./github-actions-monitor");

class DeploymentMemory {
  constructor() {
    this.memoryFile = path.join(process.cwd(), ".deployment-memory.json");
    this.monitor = new GitHubActionsMonitor();
    this.memory = this.loadMemory();
    this.reminders = [];
  }

  /**
   * Load deployment memory from file
   */
  loadMemory() {
    try {
      if (fs.existsSync(this.memoryFile)) {
        const data = fs.readFileSync(this.memoryFile, "utf8");
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn("⚠️ Failed to load deployment memory:", error.message);
    }

    // Default memory structure
    return {
      deployments: [],
      lastReminderCheck: null,
      monitoringHistory: [],
      settings: {
        mandatoryMonitoring: true,
        reminderIntervalHours: 24,
        maxHistoryDays: 30,
        autoCleanup: true,
      },
    };
  }

  /**
   * Save deployment memory to file
   */
  saveMemory() {
    try {
      fs.writeFileSync(this.memoryFile, JSON.stringify(this.memory, null, 2));
    } catch (error) {
      console.error("❌ Failed to save deployment memory:", error.message);
    }
  }

  /**
   * Record a new deployment
   */
  recordDeployment(deploymentData) {
    const deployment = {
      id: this.generateDeploymentId(),
      timestamp: new Date().toISOString(),
      commit: deploymentData.commit || null,
      branch: deploymentData.branch || null,
      environment: deploymentData.environment || null,
      triggeredBy: deploymentData.triggeredBy || process.env.USER || "unknown",
      monitoringRequired: true,
      monitoringCompleted: false,
      monitoringTimestamp: null,
      workflowsTriggered: [],
      status: "DEPLOYED",
      notes: deploymentData.notes || "",
      validationResults: null,
    };

    this.memory.deployments.unshift(deployment);
    this.saveMemory();

    this.monitor.log("INFO", `📝 Deployment recorded: ${deployment.id}`, {
      branch: deployment.branch,
      environment: deployment.environment,
      commit: deployment.commit?.substring(0, 7),
    });

    return deployment;
  }

  /**
   * Mark deployment monitoring as completed
   */
  completeMonitoring(deploymentId, validationResults = null) {
    const deployment = this.memory.deployments.find(
      (d) => d.id === deploymentId
    );

    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    deployment.monitoringCompleted = true;
    deployment.monitoringTimestamp = new Date().toISOString();
    deployment.validationResults = validationResults;

    this.saveMemory();

    this.monitor.log(
      "SUCCESS",
      `✅ Monitoring completed for deployment: ${deploymentId}`,
      {
        duration: this.getTimeSinceDeployment(deployment.timestamp),
        workflowsTriggered: deployment.workflowsTriggered.length,
      }
    );

    return deployment;
  }

  /**
   * Check for unmonitored deployments and generate reminders
   */
  checkReminders() {
    const now = new Date();
    const reminders = [];

    this.memory.deployments.forEach((deployment) => {
      if (!deployment.monitoringCompleted && deployment.monitoringRequired) {
        const deploymentTime = new Date(deployment.timestamp);
        const hoursSinceDeployment = (now - deploymentTime) / (1000 * 60 * 60);

        if (
          hoursSinceDeployment >= this.memory.settings.reminderIntervalHours
        ) {
          reminders.push({
            deploymentId: deployment.id,
            hoursSinceDeployment: Math.round(hoursSinceDeployment),
            branch: deployment.branch,
            environment: deployment.environment,
            priority: this.calculateReminderPriority(hoursSinceDeployment),
          });
        }
      }
    });

    this.reminders = reminders;
    this.memory.lastReminderCheck = now.toISOString();
    this.saveMemory();

    return reminders;
  }

  /**
   * Calculate reminder priority based on time elapsed
   */
  calculateReminderPriority(hoursSinceDeployment) {
    if (hoursSinceDeployment >= 72) return "CRITICAL"; // 3+ days
    if (hoursSinceDeployment >= 48) return "HIGH"; // 2+ days
    if (hoursSinceDeployment >= 24) return "MEDIUM"; // 1+ day
    return "LOW";
  }

  /**
   * Validate that monitoring has been completed for recent deployments
   */
  validateMonitoringCompliance(options = {}) {
    const {
      maxAgeHours = 168, // 7 days
      requireValidation = true,
    } = options;

    const now = new Date();
    const cutoffTime = new Date(now.getTime() - maxAgeHours * 60 * 60 * 1000);

    const recentDeployments = this.memory.deployments.filter((d) => {
      const deploymentTime = new Date(d.timestamp);
      return deploymentTime >= cutoffTime;
    });

    const compliance = {
      totalDeployments: recentDeployments.length,
      monitoredDeployments: recentDeployments.filter(
        (d) => d.monitoringCompleted
      ).length,
      unmonitoredDeployments: recentDeployments.filter(
        (d) => !d.monitoringCompleted
      ).length,
      complianceRate: 0,
      violations: [],
      status: "UNKNOWN",
    };

    if (compliance.totalDeployments > 0) {
      compliance.complianceRate =
        (compliance.monitoredDeployments / compliance.totalDeployments) * 100;

      // Identify violations
      recentDeployments.forEach((deployment) => {
        if (!deployment.monitoringCompleted) {
          compliance.violations.push({
            deploymentId: deployment.id,
            timestamp: deployment.timestamp,
            hoursSinceDeployment: this.getTimeSinceDeployment(
              deployment.timestamp
            ),
            branch: deployment.branch,
            environment: deployment.environment,
          });
        }
      });

      // Determine overall status
      if (compliance.complianceRate === 100) {
        compliance.status = "COMPLIANT";
      } else if (compliance.complianceRate >= 80) {
        compliance.status = "MOSTLY_COMPLIANT";
      } else {
        compliance.status = "NON_COMPLIANT";
      }
    }

    return compliance;
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport() {
    const compliance = this.validateMonitoringCompliance();
    const reminders = this.checkReminders();

    const report = {
      generatedAt: new Date().toISOString(),
      compliance,
      activeReminders: reminders,
      summary: {
        totalDeployments: this.memory.deployments.length,
        monitoredDeployments: this.memory.deployments.filter(
          (d) => d.monitoringCompleted
        ).length,
        unmonitoredDeployments: this.memory.deployments.filter(
          (d) => !d.monitoringCompleted
        ).length,
        oldestUnmonitored: this.getOldestUnmonitoredDeployment(),
      },
      recommendations: this.generateComplianceRecommendations(
        compliance,
        reminders
      ),
    };

    return report;
  }

  /**
   * Generate compliance recommendations
   */
  generateComplianceRecommendations(compliance, reminders) {
    const recommendations = [];

    if (compliance.status === "NON_COMPLIANT") {
      recommendations.push({
        priority: "CRITICAL",
        type: "COMPLIANCE",
        message: `Critical: Only ${compliance.complianceRate.toFixed(1)}% of deployments have been monitored`,
        action: "Review all unmonitored deployments immediately",
      });
    }

    if (reminders.length > 0) {
      const criticalReminders = reminders.filter(
        (r) => r.priority === "CRITICAL"
      );
      if (criticalReminders.length > 0) {
        recommendations.push({
          priority: "CRITICAL",
          type: "REMINDERS",
          message: `${criticalReminders.length} critical deployment monitoring reminders pending`,
          action: "Monitor critical deployments immediately",
        });
      }
    }

    if (compliance.violations.length > 0) {
      const oldestViolation = compliance.violations.reduce(
        (oldest, current) => {
          return current.hoursSinceDeployment > oldest.hoursSinceDeployment
            ? current
            : oldest;
        }
      );

      if (oldestViolation.hoursSinceDeployment > 72) {
        recommendations.push({
          priority: "HIGH",
          type: "AGED_VIOLATIONS",
          message: `Oldest unmonitored deployment is ${oldestViolation.hoursSinceDeployment} hours old`,
          action: "Address aged deployment monitoring violations",
        });
      }
    }

    return recommendations;
  }

  /**
   * Get oldest unmonitored deployment
   */
  getOldestUnmonitoredDeployment() {
    const unmonitored = this.memory.deployments.filter(
      (d) => !d.monitoringCompleted
    );

    if (unmonitored.length === 0) return null;

    return unmonitored.reduce((oldest, current) => {
      return new Date(current.timestamp) < new Date(oldest.timestamp)
        ? current
        : oldest;
    });
  }

  /**
   * Clean up old deployment records
   */
  cleanupOldRecords() {
    const cutoffDate = new Date();
    cutoffDate.setDate(
      cutoffDate.getDate() - this.memory.settings.maxHistoryDays
    );

    const originalCount = this.memory.deployments.length;
    this.memory.deployments = this.memory.deployments.filter((deployment) => {
      const deploymentDate = new Date(deployment.timestamp);
      return deploymentDate >= cutoffDate;
    });

    const removedCount = originalCount - this.memory.deployments.length;

    if (removedCount > 0) {
      this.monitor.log(
        "INFO",
        `🧹 Cleaned up ${removedCount} old deployment records`
      );
      this.saveMemory();
    }

    return removedCount;
  }

  /**
   * Get time since deployment in hours
   */
  getTimeSinceDeployment(deploymentTimestamp) {
    const deploymentTime = new Date(deploymentTimestamp);
    const now = new Date();
    return Math.round((now - deploymentTime) / (1000 * 60 * 60));
  }

  /**
   * Generate unique deployment ID
   */
  generateDeploymentId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `dep_${timestamp}_${random}`;
  }

  /**
   * Get deployment statistics
   */
  getStatistics() {
    const stats = {
      totalDeployments: this.memory.deployments.length,
      monitoredPercentage: 0,
      averageMonitoringDelay: 0,
      environmentBreakdown: {},
      branchBreakdown: {},
      complianceByEnvironment: {},
    };

    if (stats.totalDeployments === 0) return stats;

    const monitoredDeployments = this.memory.deployments.filter(
      (d) => d.monitoringCompleted
    );
    stats.monitoredPercentage =
      (monitoredDeployments.length / stats.totalDeployments) * 100;

    // Calculate average monitoring delay
    const delays = monitoredDeployments
      .filter((d) => d.monitoringTimestamp)
      .map((d) => {
        const deploymentTime = new Date(d.timestamp);
        const monitoringTime = new Date(d.monitoringTimestamp);
        return (monitoringTime - deploymentTime) / (1000 * 60 * 60); // hours
      });

    if (delays.length > 0) {
      stats.averageMonitoringDelay =
        delays.reduce((sum, delay) => sum + delay, 0) / delays.length;
    }

    // Environment and branch breakdown
    this.memory.deployments.forEach((deployment) => {
      if (deployment.environment) {
        stats.environmentBreakdown[deployment.environment] =
          (stats.environmentBreakdown[deployment.environment] || 0) + 1;
      }

      if (deployment.branch) {
        stats.branchBreakdown[deployment.branch] =
          (stats.branchBreakdown[deployment.branch] || 0) + 1;
      }

      // Compliance by environment
      if (deployment.environment) {
        if (!stats.complianceByEnvironment[deployment.environment]) {
          stats.complianceByEnvironment[deployment.environment] = {
            total: 0,
            monitored: 0,
            complianceRate: 0,
          };
        }

        const envStats = stats.complianceByEnvironment[deployment.environment];
        envStats.total++;

        if (deployment.monitoringCompleted) {
          envStats.monitored++;
        }

        envStats.complianceRate = (envStats.monitored / envStats.total) * 100;
      }
    });

    return stats;
  }

  /**
   * Export deployment history to various formats
   */
  exportHistory(format = "json", filename = null) {
    if (!filename) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      filename = `deployment-history-${timestamp}`;
    }

    let content = "";
    let extension = "json";

    switch (format.toLowerCase()) {
      case "json":
        content = JSON.stringify(this.memory, null, 2);
        extension = "json";
        break;

      case "csv":
        content = this.exportToCSV();
        extension = "csv";
        break;

      case "markdown":
        content = this.exportToMarkdown();
        extension = "md";
        break;

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    const filepath = path.join(process.cwd(), `${filename}.${extension}`);
    fs.writeFileSync(filepath, content);

    this.monitor.log("INFO", `📄 Deployment history exported: ${filepath}`);
    return filepath;
  }

  /**
   * Export to CSV format
   */
  exportToCSV() {
    const headers = [
      "Deployment ID",
      "Timestamp",
      "Branch",
      "Environment",
      "Triggered By",
      "Monitoring Completed",
      "Monitoring Timestamp",
      "Status",
      "Notes",
    ];

    const rows = this.memory.deployments.map((deployment) => [
      deployment.id,
      deployment.timestamp,
      deployment.branch || "",
      deployment.environment || "",
      deployment.triggeredBy,
      deployment.monitoringCompleted ? "Yes" : "No",
      deployment.monitoringTimestamp || "",
      deployment.status,
      deployment.notes,
    ]);

    return [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
  }

  /**
   * Export to Markdown format
   */
  exportToMarkdown() {
    let markdown = "# Deployment History\n\n";
    markdown += `Generated: ${new Date().toISOString()}\n\n`;

    const stats = this.getStatistics();
    markdown += "## Statistics\n\n";
    markdown += `- Total Deployments: ${stats.totalDeployments}\n`;
    markdown += `- Monitored: ${stats.monitoredPercentage.toFixed(1)}%\n`;
    markdown += `- Average Monitoring Delay: ${stats.averageMonitoringDelay.toFixed(1)} hours\n\n`;

    markdown += "## Recent Deployments\n\n";
    markdown +=
      "| ID | Timestamp | Branch | Environment | Monitored | Status |\n";
    markdown +=
      "|----|-----------|--------|-------------|----------|--------|\n";

    this.memory.deployments.slice(0, 50).forEach((deployment) => {
      const monitored = deployment.monitoringCompleted ? "✅" : "❌";
      markdown += `| ${deployment.id} | ${new Date(deployment.timestamp).toLocaleString()} | ${deployment.branch || "-"} | ${deployment.environment || "-"} | ${monitored} | ${deployment.status} |\n`;
    });

    return markdown;
  }

  /**
   * Display memory status dashboard
   */
  displayStatus() {
    console.log("🧠 DEPLOYMENT MEMORY SYSTEM STATUS");
    console.log("===================================");

    const stats = this.getStatistics();
    const compliance = this.validateMonitoringCompliance();
    const reminders = this.checkReminders();

    console.log(`\n📊 Statistics:`);
    console.log(`  Total Deployments: ${stats.totalDeployments}`);
    console.log(
      `  Monitoring Compliance: ${stats.monitoredPercentage.toFixed(1)}%`
    );
    console.log(
      `  Average Monitoring Delay: ${stats.averageMonitoringDelay.toFixed(1)} hours`
    );

    console.log(`\n✅ Compliance Status:`);
    console.log(`  Status: ${compliance.status}`);
    console.log(`  Compliance Rate: ${compliance.complianceRate.toFixed(1)}%`);
    console.log(
      `  Unmonitored Deployments: ${compliance.unmonitoredDeployments}`
    );

    if (reminders.length > 0) {
      console.log(`\n🚨 Active Reminders (${reminders.length}):`);
      reminders.slice(0, 5).forEach((reminder) => {
        const priorityEmoji =
          reminder.priority === "CRITICAL"
            ? "🔴"
            : reminder.priority === "HIGH"
              ? "🟠"
              : "🟡";
        console.log(
          `  ${priorityEmoji} ${reminder.deploymentId}: ${reminder.hoursSinceDeployment}h old (${reminder.environment})`
        );
      });
    }

    console.log(
      `\n🕒 Last Reminder Check: ${this.memory.lastReminderCheck || "Never"}`
    );
    console.log(`📁 Memory File: ${this.memoryFile}`);

    return { stats, compliance, reminders };
  }
}

// CLI interface
if (require.main === module) {
  const memory = new DeploymentMemory();

  const command = process.argv[2];
  const subCommand = process.argv[3];

  async function main() {
    try {
      switch (command) {
        case "record":
          const deploymentData = {
            commit: process.env.GITHUB_SHA,
            branch: process.env.GITHUB_REF?.replace("refs/heads/", ""),
            environment: subCommand || process.argv[4] || "unknown",
            triggeredBy: process.env.GITHUB_ACTOR || process.env.USER || "cli",
          };
          const deployment = memory.recordDeployment(deploymentData);
          console.log(`✅ Deployment recorded: ${deployment.id}`);
          break;

        case "complete":
          const deploymentId = subCommand || process.argv[4];
          if (!deploymentId) {
            console.error("❌ Please provide deployment ID");
            process.exit(1);
          }
          memory.completeMonitoring(deploymentId);
          console.log(`✅ Monitoring completed for: ${deploymentId}`);
          break;

        case "status":
          memory.displayStatus();
          break;

        case "reminders":
          const reminders = memory.checkReminders();
          if (reminders.length === 0) {
            console.log("✅ No active reminders");
          } else {
            console.log(`🚨 ${reminders.length} active reminders:`);
            reminders.forEach((reminder) => {
              console.log(
                `  ${reminder.priority}: ${reminder.deploymentId} (${reminder.hoursSinceDeployment}h old)`
              );
            });
          }
          break;

        case "compliance":
          const compliance = memory.validateMonitoringCompliance();
          console.log("📊 Compliance Report:");
          console.log(`  Status: ${compliance.status}`);
          console.log(
            `  Compliance Rate: ${compliance.complianceRate.toFixed(1)}%`
          );
          console.log(
            `  Unmonitored: ${compliance.unmonitoredDeployments}/${compliance.totalDeployments}`
          );
          break;

        case "export":
          const format = subCommand || "json";
          const filepath = memory.exportHistory(format);
          console.log(`📄 History exported: ${filepath}`);
          break;

        case "cleanup":
          const removed = memory.cleanupOldRecords();
          console.log(`🧹 Cleaned up ${removed} old records`);
          break;

        default:
          console.log("\n🧠 Deployment Memory System CLI");
          console.log("Usage:");
          console.log("  record [environment]   - Record a new deployment");
          console.log(
            "  complete <id>          - Mark monitoring as completed"
          );
          console.log("  status                  - Show memory system status");
          console.log("  reminders               - Check for active reminders");
          console.log("  compliance              - Show compliance report");
          console.log(
            "  export [format]         - Export deployment history (json/csv/markdown)"
          );
          console.log("  cleanup                 - Clean up old records");
          break;
      }
    } catch (error) {
      console.error("❌ Error:", error.message);
      process.exit(1);
    }
  }

  main();
}

module.exports = DeploymentMemory;

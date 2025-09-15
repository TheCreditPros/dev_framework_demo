#!/usr/bin/env node

/**
 * GitHub Actions Monitor
 * Monitors GitHub Actions workflow runs and provides real-time status
 */

const https = require("https");
const { execSync } = require("child_process");

class GitHubActionsMonitor {
  constructor() {
    this.repo = this.getRepoInfo();
    this.token = process.env.GITHUB_TOKEN;
    this.interval = 30000; // 30 seconds
    this.intervalId = null;
    this.timeout = parseInt(process.env.MONITOR_TIMEOUT) || 300000; // 5 minutes default
    this.startTime = Date.now();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getRepoInfo() {
    try {
      const remoteUrl = execSync("git config --get remote.origin.url", {
        encoding: "utf8",
      }).trim();
      const match = remoteUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
      if (match) {
        return {
          owner: match[1],
          name: match[2],
        };
      }
    } catch (error) {
      console.error("❌ Could not determine repository information");
      process.exit(1);
    }
  }

  async makeRequest(endpoint) {
    const options = {
      hostname: "api.github.com",
      path: `/repos/${this.repo.owner}/${this.repo.name}${endpoint}`,
      method: "GET",
      headers: {
        "User-Agent": "GitHub-Actions-Monitor/1.0",
        "Accept": "application/vnd.github.v3+json",
        ...(this.token && { Authorization: `token ${this.token}` }),
      },
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on("error", reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });

      req.end();
    });
  }

  async getWorkflowRuns() {
    try {
      const response = await this.makeRequest("/actions/runs?per_page=5");
      return response.workflow_runs || [];
    } catch (error) {
      console.error("❌ Failed to fetch workflow runs:", error.message);
      return [];
    }
  }

  formatStatus(status) {
    switch (status) {
      case "completed":
        return "✅ Completed";
      case "in_progress":
        return "🔄 In Progress";
      case "queued":
        return "⏳ Queued";
      case "requested":
        return "📋 Requested";
      case "waiting":
        return "⏸️ Waiting";
      default:
        return `❓ ${status}`;
    }
  }

  formatConclusion(conclusion) {
    switch (conclusion) {
      case "success":
        return "✅ Success";
      case "failure":
        return "❌ Failure";
      case "neutral":
        return "⚪ Neutral";
      case "cancelled":
        return "🚫 Cancelled";
      case "skipped":
        return "⏭️ Skipped";
      case "timed_out":
        return "⏰ Timed Out";
      case "action_required":
        return "⚠️ Action Required";
      default:
        return conclusion ? `❓ ${conclusion}` : "";
    }
  }

  async displayWorkflowRuns() {
    console.clear();
    console.log("🚀 GitHub Actions Monitor");
    console.log("========================");
    console.log(`📦 Repository: ${this.repo.owner}/${this.repo.name}`);
    console.log(`⏰ Last updated: ${new Date().toLocaleTimeString()}`);
    console.log("");

    const runs = await this.getWorkflowRuns();

    if (runs.length === 0) {
      console.log("❌ No workflow runs found");
      return;
    }

    runs.forEach((run, index) => {
      const status = this.formatStatus(run.status);
      const conclusion = this.formatConclusion(run.conclusion);
      const duration = run.updated_at
        ? Math.floor((new Date() - new Date(run.created_at)) / 1000 / 60)
        : 0;

      console.log(`${index + 1}. ${run.name || "Unnamed Workflow"}`);
      console.log(`   ${status} ${conclusion}`);
      console.log(`   📋 Run: #${run.run_number}`);
      console.log(`   🔗 ${run.html_url}`);
      console.log(`   ⏱️ Duration: ${duration} minutes`);
      console.log(
        `   📅 Created: ${new Date(run.created_at).toLocaleString()}`
      );
      console.log("");
    });
  }

  async startMonitoring() {
    console.log("🔍 Starting GitHub Actions monitoring...");
    console.log("Press Ctrl+C to stop");
    console.log("");

    // Initial display
    await this.displayWorkflowRuns();

    // Set up interval monitoring with timeout
    this.intervalId = setInterval(async () => {
      // Check if timeout has been exceeded
      if (Date.now() - this.startTime > this.timeout) {
        console.log(`\n⏰ Monitor timeout reached after ${this.timeout / 1000} seconds`);
        console.log("👋 Stopping GitHub Actions monitor...");
        this.stop();
        return;
      }

      await this.displayWorkflowRuns();
    }, this.interval);
  }
}

// Main execution
if (require.main === module) {
  const monitor = new GitHubActionsMonitor();

  if (!monitor.token) {
    console.log("⚠️ GITHUB_TOKEN not found. Some features may be limited.");
    console.log(
      "Set GITHUB_TOKEN environment variable for full functionality."
    );
    console.log("");
  }

  monitor.startMonitoring().catch((error) => {
    console.error("❌ Monitor failed:", error);
    process.exit(1);
  });

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n👋 Stopping GitHub Actions monitor...");
    monitor.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n👋 Stopping GitHub Actions monitor...");
    monitor.stop();
    process.exit(0);
  });
}

module.exports = GitHubActionsMonitor;

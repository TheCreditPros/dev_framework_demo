#!/usr/bin/env node

/**
 * MS Teams Webhook Manager for AI-SDLC
 * The Credit Pros - Development Team
 *
 * Manages MS Teams webhook notifications for CI/CD pipeline
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

class WebhookManager {
  constructor() {
    this.webhookUrl = process.env.MS_TEAMS_WEBHOOK_URI;
    this.defaultTheme = {
      success: '00ff00',
      error: 'ff0000',
      warning: 'ff902a',
      info: '0f314b',
    };
  }

  /**
   * Send notification to MS Teams
   */
  async sendNotification(options) {
    const {
      title,
      subtitle = 'The Credit Pros - AI-SDLC',
      facts = [],
      theme = 'info',
      summary = title,
    } = options;

    if (!this.webhookUrl) {
      console.warn('⚠️  MS_TEAMS_WEBHOOK_URI not configured');
      return false;
    }

    const payload = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: this.defaultTheme[theme] || theme,
      summary: summary,
      sections: [
        {
          activityTitle: title,
          activitySubtitle: subtitle,
          facts: facts.map((fact) => ({
            name: fact.name,
            value: String(fact.value),
          })),
          markdown: true,
        },
      ],
    };

    try {
      await this.postWebhook(payload);
      console.log('✅ MS Teams notification sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to send MS Teams notification:', error.message);
      return false;
    }
  }

  /**
   * Send deployment notification
   */
  async sendDeploymentNotification(environment, status, details = {}) {
    const {
      branch = 'unknown',
      commit = 'unknown',
      duration = 'unknown',
      tests = 'unknown',
      coverage = 'unknown',
    } = details;

    const theme = status === 'success' ? 'success' : 'error';
    const emoji = status === 'success' ? '🚀' : '❌';

    return await this.sendNotification({
      title: `${emoji} Deployment ${status.toUpperCase()}`,
      subtitle: `Environment: ${environment}`,
      theme: theme,
      facts: [
        { name: 'Environment', value: environment },
        { name: 'Status', value: status },
        { name: 'Branch', value: branch },
        { name: 'Commit', value: commit },
        { name: 'Duration', value: duration },
        { name: 'Tests', value: tests },
        { name: 'Coverage', value: coverage },
        { name: 'Timestamp', value: new Date().toISOString() },
      ],
    });
  }

  /**
   * Send validation notification
   */
  async sendValidationNotification(score, passed, total, _details = {}) {
    const theme = score >= 90 ? 'success' : score >= 70 ? 'warning' : 'error';
    const emoji = score >= 90 ? '✅' : score >= 70 ? '⚠️' : '❌';

    return await this.sendNotification({
      title: `${emoji} AI-SDLC Validation Report`,
      subtitle: `Score: ${score}% (${passed}/${total})`,
      theme: theme,
      facts: [
        { name: 'Validation Score', value: `${score}%` },
        { name: 'Passed Checks', value: `${passed}/${total}` },
        {
          name: 'Status',
          value:
            score >= 90
              ? 'Excellent'
              : score >= 70
                ? 'Good'
                : 'Needs Attention',
        },
        { name: 'Branch', value: _details.branch || 'unknown' },
        { name: 'Timestamp', value: new Date().toISOString() },
      ],
    });
  }

  /**
   * Send test results notification
   */
  async sendTestResultsNotification(testType, results) {
    const {
      total = 0,
      passed = 0,
      failed = 0,
      skipped = 0,
      duration = 'unknown',
      coverage = 'unknown',
    } = results;

    const theme = failed === 0 ? 'success' : 'error';
    const emoji = failed === 0 ? '🧪✅' : '🧪❌';

    return await this.sendNotification({
      title: `${emoji} ${testType} Test Results`,
      theme: theme,
      facts: [
        { name: 'Test Type', value: testType },
        { name: 'Total Tests', value: total },
        { name: 'Passed', value: passed },
        { name: 'Failed', value: failed },
        { name: 'Skipped', value: skipped },
        { name: 'Duration', value: duration },
        { name: 'Coverage', value: coverage },
        { name: 'Timestamp', value: new Date().toISOString() },
      ],
    });
  }

  /**
   * Send security scan notification
   */
  async sendSecurityNotification(vulnerabilities, _details = {}) {
    const {
      critical = 0,
      high = 0,
      medium = 0,
      low = 0,
      tool = 'Security Scanner',
    } = vulnerabilities;

    const totalVulns = critical + high + medium + low;
    const theme =
      critical > 0 || high > 0 ? 'error' : medium > 0 ? 'warning' : 'success';
    const emoji = totalVulns === 0 ? '🛡️✅' : '🛡️⚠️';

    return await this.sendNotification({
      title: `${emoji} Security Scan Results`,
      subtitle: `Tool: ${tool}`,
      theme: theme,
      facts: [
        { name: 'Total Vulnerabilities', value: totalVulns },
        { name: 'Critical', value: critical },
        { name: 'High', value: high },
        { name: 'Medium', value: medium },
        { name: 'Low', value: low },
        {
          name: 'Status',
          value: totalVulns === 0 ? 'Clean' : 'Action Required',
        },
        { name: 'Timestamp', value: new Date().toISOString() },
      ],
    });
  }

  /**
   * Test webhook connectivity
   */
  async testWebhook() {
    console.log('🧪 Testing MS Teams webhook connectivity...');

    return await this.sendNotification({
      title: '🧪 Webhook Test',
      subtitle: 'AI-SDLC Webhook Connectivity Test',
      theme: 'info',
      facts: [
        { name: 'Test Status', value: '✅ Connection Successful' },
        {
          name: 'Environment',
          value: `${process.env.USER || 'unknown'}@${require('os').hostname()}`,
        },
        { name: 'Node Version', value: process.version },
        { name: 'Timestamp', value: new Date().toISOString() },
      ],
    });
  }

  /**
   * POST data to webhook
   */
  postWebhook(payload) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.webhookUrl);
      const data = JSON.stringify(payload);

      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      };

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(responseData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Load validation report and send notification
   */
  async sendValidationReportNotification() {
    const reportPath = path.join(process.cwd(), 'AI_SDLC_VALIDATION_REPORT.md');

    if (!fs.existsSync(reportPath)) {
      console.error('❌ Validation report not found. Run validation first.');
      return false;
    }

    try {
      const reportContent = fs.readFileSync(reportPath, 'utf8');

      // Parse validation score from report
      const scoreMatch = reportContent.match(
        /Validation Score:\*\* (\d+)% \((\d+)\/(\d+)/
      );
      if (!scoreMatch) {
        console.error('❌ Could not parse validation score from report');
        return false;
      }

      const [, score, passed, total] = scoreMatch;

      // Get git branch if available
      let branch = 'unknown';
      try {
        const { execSync } = require('child_process');
        branch = execSync('git branch --show-current', {
          encoding: 'utf8',
        }).trim();
      } catch {
        // Git not available or not in repo
      }

      return await this.sendValidationNotification(
        parseInt(score),
        parseInt(passed),
        parseInt(total),
        { branch }
      );
    } catch (error) {
      console.error('❌ Failed to process validation report:', error.message);
      return false;
    }
  }
}

// CLI interface
async function main() {
  const webhookManager = new WebhookManager();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case 'test':
      await webhookManager.testWebhook();
      break;

    case 'deploy': {
      const [environment, status] = args;
      if (!environment || !status) {
        console.error(
          'Usage: webhook-manager.js deploy <environment> <status>'
        );
        process.exit(1);
      }
      await webhookManager.sendDeploymentNotification(environment, status);
      break;
    }

    case 'validation':
      await webhookManager.sendValidationReportNotification();
      break;

    case 'security': {
      const vulnerabilities = JSON.parse(args[0] || '{}');
      await webhookManager.sendSecurityNotification(vulnerabilities);
      break;
    }

    case 'tests': {
      const [testType, resultsJson] = args;
      const results = JSON.parse(resultsJson || '{}');
      await webhookManager.sendTestResultsNotification(testType, results);
      break;
    }

    case 'custom': {
      const [title, theme, factsJson] = args;
      const facts = JSON.parse(factsJson || '[]');
      await webhookManager.sendNotification({ title, theme, facts });
      break;
    }

    default:
      console.log('MS Teams Webhook Manager for AI-SDLC');
      console.log('');
      console.log('Usage:');
      console.log(
        '  webhook-manager.js test                    - Test webhook connectivity'
      );
      console.log(
        '  webhook-manager.js deploy <env> <status>   - Send deployment notification'
      );
      console.log(
        '  webhook-manager.js validation              - Send validation report'
      );
      console.log(
        '  webhook-manager.js security <vulns-json>   - Send security scan results'
      );
      console.log(
        '  webhook-manager.js tests <type> <results>  - Send test results'
      );
      console.log(
        '  webhook-manager.js custom <title> <theme> <facts-json> - Custom notification'
      );
      console.log('');
      console.log('Environment Variables:');
      console.log('  MS_TEAMS_WEBHOOK_URI - MS Teams webhook URL');
      break;
  }
}

// Export for use as module
module.exports = WebhookManager;

// Run CLI if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

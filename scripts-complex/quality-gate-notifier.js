#!/usr/bin/env node

/**
 * Quality Gate Failure Notifier for AI-SDLC Framework v3.3.0
 * Enhanced MS Teams notifications with actionable developer guidance
 * The Credit Pros - Development Team
 */

const https = require('https');

// Import user mapper for GitHub → Teams user mapping
const TeamsUserMapper = require('./teams-user-mapper.js');

class QualityGateNotifier {
  constructor() {
    this.webhookUrl = process.env.MS_TEAMS_WEBHOOK_URI;
    this.devWebhookUrl = process.env.MS_TEAMS_DEV_WEBHOOK;
    this.securityWebhookUrl = process.env.MS_TEAMS_SECURITY_WEBHOOK;

    // Initialize user mapper for proper @mentions
    this.userMapper = new TeamsUserMapper();

    this.themeColors = {
      critical: 'ff0000', // Red - Critical failures
      error: 'dc3545', // Dark red - Errors
      warning: 'ff902a', // Orange - Warnings
      success: '28a745', // Green - Success
      info: '0f314b', // Blue - Info
      security: '6f42c1', // Purple - Security
    };

    this.priorityLevels = {
      P0: { emoji: '🚨', color: 'critical', urgency: 'IMMEDIATE' },
      P1: { emoji: '❌', color: 'error', urgency: 'HIGH' },
      P2: { emoji: '⚠️', color: 'warning', urgency: 'MEDIUM' },
      P3: { emoji: '💡', color: 'info', urgency: 'LOW' },
    };
  }

  /**
   * Send quality gate failure notification with actionable guidance
   */
  async sendQualityGateFailure(failureData) {
    const {
      gateType, // 'test', 'security', 'performance', 'coverage', 'lint'
      failureReason, // Specific reason for failure
      developer, // GitHub actor
      repository, // Repository name
      branch, // Branch name
      pullRequest, // PR number if applicable
      workflowRun, // GitHub Actions run ID
      priority = 'P1', // Priority level
      details = {}, // Additional failure details
    } = failureData;

    const priorityInfo = this.priorityLevels[priority];
    const actionableGuidance = this.getActionableGuidance(
      gateType,
      failureReason,
      details
    );

    // Get proper Teams mention for developer
    const teamsMention = this.userMapper.getTeamsMention(developer);

    // Get additional team members for critical issues
    const additionalMentions =
      priority === 'P0'
        ? this.userMapper
            .getNotificationTeam(gateType, priority)
            .map((member) => member.teamsHandle)
            .slice(0, 3) // Limit to 3 additional mentions
            .join(', ')
        : '';

    const notification = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: this.themeColors[priorityInfo.color],
      summary: `${priorityInfo.emoji} Quality Gate Failure - ${gateType.toUpperCase()}`,
      sections: [
        {
          activityTitle: `${priorityInfo.emoji} Quality Gate Failure - Action Required`,
          activitySubtitle: `${priorityInfo.urgency} Priority | Developer: ${teamsMention}${additionalMentions ? ` | Team: ${additionalMentions}` : ''}`,
          facts: [
            { name: '🎯 Gate Type', value: gateType.toUpperCase() },
            { name: '❌ Failure Reason', value: failureReason },
            { name: '👤 Developer', value: teamsMention },
            { name: '📁 Repository', value: repository },
            { name: '🌿 Branch', value: branch },
            { name: '🔗 Workflow Run', value: `#${workflowRun}` },
            ...(pullRequest
              ? [{ name: '📋 Pull Request', value: `#${pullRequest}` }]
              : []),
            ...(additionalMentions
              ? [{ name: '👥 Team Notified', value: additionalMentions }]
              : []),
            { name: '⏰ Timestamp', value: new Date().toISOString() },
          ],
          markdown: true,
        },
        {
          activityTitle: '🛠️ Immediate Action Items',
          facts: actionableGuidance.actionItems.map((item, index) => ({
            name: `${index + 1}.`,
            value: item,
          })),
          markdown: true,
        },
        {
          activityTitle: '💻 Local Testing Commands',
          facts: actionableGuidance.localCommands.map((cmd, index) => ({
            name: `Command ${index + 1}`,
            value: `\`${cmd}\``,
          })),
          markdown: true,
        },
        {
          activityTitle: '📚 Troubleshooting Resources',
          facts: actionableGuidance.resources.map((resource, index) => ({
            name: `Resource ${index + 1}`,
            value: resource,
          })),
          markdown: true,
        },
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: '🔍 View Workflow Run',
          targets: [
            {
              os: 'default',
              uri: `https://github.com/${repository}/actions/runs/${workflowRun}`,
            },
          ],
        },
        ...(pullRequest
          ? [
              {
                '@type': 'OpenUri',
                name: '📋 View Pull Request',
                targets: [
                  {
                    os: 'default',
                    uri: `https://github.com/${repository}/pull/${pullRequest}`,
                  },
                ],
              },
            ]
          : []),
        {
          '@type': 'OpenUri',
          name: '📖 Framework Documentation',
          targets: [
            { os: 'default', uri: 'https://nydamon.github.io/ai-sdlc-docs/' },
          ],
        },
      ],
    };

    // Send to appropriate webhook based on priority and type
    const webhookUrl = this.getWebhookUrl(gateType, priority);
    if (webhookUrl) {
      await this.sendNotification(webhookUrl, notification);
      console.log(`✅ Quality gate failure notification sent for ${gateType}`);
    } else {
      console.warn('⚠️ No webhook URL configured for notifications');
    }
  }

  /**
   * Get actionable guidance based on failure type
   */
  getActionableGuidance(gateType, failureReason, details) {
    const guidance = {
      actionItems: [],
      localCommands: [],
      resources: [],
    };

    switch (gateType) {
      case 'test':
        guidance.actionItems = [
          'Run tests locally to identify specific failures',
          'Check test coverage and add missing tests',
          'Verify mock data and test setup',
          'Ensure FCRA compliance tests are passing',
        ];
        guidance.localCommands = [
          'npm run test:coverage',
          'npm run test:unit',
          'npm run ai:generate-tests',
          './ai-sdlc explain "test failures"',
        ];
        guidance.resources = [
          'Testing Guide: docs/TESTING-README.md',
          'FCRA Test Patterns: tests/unit/',
          'AI Test Generation: npm run ai:generate-tests',
        ];
        break;

      case 'security':
        guidance.actionItems = [
          'Review security vulnerabilities immediately',
          'Update dependencies with security patches',
          'Check for exposed secrets or PII',
          'Validate FCRA compliance patterns',
        ];
        guidance.localCommands = [
          './scripts-complex/security-scanner.js full',
          'npm audit --audit-level=high',
          'npm run ci:security',
          './ai-sdlc explain "security vulnerabilities"',
        ];
        guidance.resources = [
          'Security Guide: docs/SECURITY_TOOLS_INTEGRATION.md',
          'FCRA Compliance: docs/compliance.md',
          'Security Scanner: scripts-complex/security-scanner.js',
        ];
        break;

      case 'performance':
        guidance.actionItems = [
          'Check Core Web Vitals performance metrics',
          'Optimize bundle size and loading performance',
          'Review credit calculation performance',
          'Test performance budgets locally',
        ];
        guidance.localCommands = [
          'npm run ci:performance',
          'performance-monitoring-removed',
          'npm run test:performance',
          './ai-sdlc explain "performance issues"',
        ];
        guidance.resources = [
          'Performance Config: Removed (Lighthouse deprecated)',
          'Performance Guide: docs/ci-cd-implementation-guide.md',
          'Budget Thresholds: Core Web Vitals < 2.5s',
        ];
        break;

      case 'coverage':
        guidance.actionItems = [
          `Increase test coverage to meet ${details.threshold || 80}% threshold`,
          'Focus on business logic and edge cases',
          'Add FCRA compliance test coverage',
          'Generate AI-powered tests for uncovered code',
        ];
        guidance.localCommands = [
          'npm run test:coverage',
          'npm run ai:generate-tests',
          'npm run test:watch-coverage',
          './ai-sdlc explain "low test coverage"',
        ];
        guidance.resources = [
          'Coverage Report: coverage/lcov-report/index.html',
          'AI Test Generation: npm run ai:generate-tests',
          'FCRA Test Patterns: tests/unit/',
        ];
        break;

      case 'lint':
        guidance.actionItems = [
          'Fix ESLint errors and warnings',
          'Run Prettier to format code',
          'Check TypeScript type errors',
          'Validate code quality standards',
        ];
        guidance.localCommands = [
          'npm run lint:fix',
          'npm run format',
          'npm run type-check',
          './ai-sdlc explain "ESLint errors"',
        ];
        guidance.resources = [
          'ESLint Config: eslint.config.js',
          'Code Standards: eslint.config.mjs',
          'TypeScript Guide: docs/react-best-practices-updated.md',
        ];
        break;

      case 'compliance':
        guidance.actionItems = [
          'Review FCRA compliance violations',
          'Check PII data handling patterns',
          'Validate audit trail implementation',
          'Ensure credit score range validation',
        ];
        guidance.localCommands = [
          'npm run ci:compliance',
          './scripts-complex/security-scanner.js compliance',
          'npm run test -- --grep "FCRA"',
          './ai-sdlc explain "FCRA compliance"',
        ];
        guidance.resources = [
          'FCRA Guidelines: docs/compliance.md',
          'TCP Domain Rules: docs/tcp-domain.md',
          'Compliance Tests: tests/e2e/*compliance*',
        ];
        break;

      default:
        guidance.actionItems = [
          'Review workflow logs for specific errors',
          'Check repository documentation',
          'Contact development team for assistance',
        ];
        guidance.localCommands = [
          './ai-sdlc status',
          './ai-sdlc validate',
          './ai-sdlc explain "workflow failure"',
        ];
        guidance.resources = [
          'Framework Docs: https://nydamon.github.io/ai-sdlc-docs/',
          'Troubleshooting: docs/troubleshooting-simple.md',
        ];
    }

    return guidance;
  }

  /**
   * Get appropriate webhook URL based on failure type and priority
   */
  getWebhookUrl(gateType, priority) {
    // Security failures go to security channel
    if (gateType === 'security' && this.securityWebhookUrl) {
      return this.securityWebhookUrl;
    }

    // High priority failures go to dev channel for immediate attention
    if (['P0', 'P1'].includes(priority) && this.devWebhookUrl) {
      return this.devWebhookUrl;
    }

    // Default to main webhook
    return this.webhookUrl;
  }

  /**
   * Send notification to webhook
   */
  async sendNotification(webhookUrl, payload) {
    return new Promise((resolve, reject) => {
      const url = new URL(webhookUrl);
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

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  /**
   * Send summary notification for multiple failures
   */
  async sendFailureSummary(failures) {
    if (!this.webhookUrl) return;

    const criticalCount = failures.filter((f) => f.priority === 'P0').length;
    const errorCount = failures.filter((f) => f.priority === 'P1').length;
    const warningCount = failures.filter((f) => f.priority === 'P2').length;

    const theme =
      criticalCount > 0 ? 'critical' : errorCount > 0 ? 'error' : 'warning';
    const emoji = criticalCount > 0 ? '🚨' : errorCount > 0 ? '❌' : '⚠️';

    const notification = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: this.themeColors[theme],
      summary: `${emoji} Multiple Quality Gate Failures`,
      sections: [
        {
          activityTitle: `${emoji} Quality Gate Summary - Multiple Failures Detected`,
          activitySubtitle: `Total Failures: ${failures.length} | Critical: ${criticalCount} | Errors: ${errorCount} | Warnings: ${warningCount}`,
          facts: [
            { name: '🚨 Critical (P0)', value: criticalCount },
            { name: '❌ Errors (P1)', value: errorCount },
            { name: '⚠️ Warnings (P2)', value: warningCount },
            { name: '📊 Total Failures', value: failures.length },
            { name: '⏰ Timestamp', value: new Date().toISOString() },
          ],
          markdown: true,
        },
        {
          activityTitle: '🔍 Failure Breakdown',
          facts: failures.slice(0, 5).map((failure, index) => ({
            name: `${index + 1}. ${failure.gateType.toUpperCase()}`,
            value: `${this.priorityLevels[failure.priority].emoji} ${failure.failureReason}`,
          })),
          markdown: true,
        },
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: '🔍 View All Workflows',
          targets: [
            {
              os: 'default',
              uri: `https://github.com/${failures[0].repository}/actions`,
            },
          ],
        },
      ],
    };

    await this.sendNotification(this.webhookUrl, notification);
  }

  /**
   * Parse GitHub Actions context and send appropriate notifications
   */
  async notifyFromGitHubContext() {
    const context = {
      repository: process.env.GITHUB_REPOSITORY,
      actor: process.env.GITHUB_ACTOR,
      ref: process.env.GITHUB_REF_NAME,
      workflow: process.env.GITHUB_WORKFLOW,
      runId: process.env.GITHUB_RUN_ID,
      eventName: process.env.GITHUB_EVENT_NAME,
      prNumber: process.env.GITHUB_EVENT_PULL_REQUEST_NUMBER,
    };

    // Analyze workflow failure
    const failureData = await this.analyzeWorkflowFailure(context);

    if (failureData) {
      await this.sendQualityGateFailure(failureData);
    }
  }

  /**
   * Analyze workflow failure and determine appropriate notification
   */
  async analyzeWorkflowFailure(context) {
    // This would be enhanced with actual log parsing
    // For now, we'll create a template based on workflow name

    let gateType = 'unknown';
    let failureReason = 'Workflow failed';
    let priority = 'P1';

    if (context.workflow.includes('CI/CD')) {
      gateType = 'test';
      failureReason = 'Tests failed or coverage below threshold';
      priority = 'P1';
    } else if (context.workflow.includes('Security')) {
      gateType = 'security';
      failureReason = 'Security vulnerabilities detected';
      priority = 'P0'; // Security is always critical
    } else if (context.workflow.includes('Performance')) {
      gateType = 'performance';
      failureReason = 'Performance budget exceeded';
      priority = 'P1';
    }

    return {
      gateType,
      failureReason,
      developer: context.actor,
      repository: context.repository,
      branch: context.ref,
      pullRequest: context.prNumber,
      workflowRun: context.runId,
      priority,
      details: {},
    };
  }
}

// CLI Interface
async function main() {
  const notifier = new QualityGateNotifier();
  const command = process.argv[2];

  switch (command) {
    case 'github-context':
      await notifier.notifyFromGitHubContext();
      break;

    default:
      console.log('Quality Gate Notifier for AI-SDLC Framework');
      console.log('');
      console.log('Usage:');
      console.log(
        '  quality-gate-notifier.js github-context    - Auto-detect from GitHub context (CI only)'
      );
      console.log('');
      console.log('Environment Variables:');
      console.log('  MS_TEAMS_WEBHOOK_URI     - Main webhook URL');
      console.log('  MS_TEAMS_DEV_WEBHOOK     - Developer channel webhook');
      console.log('  MS_TEAMS_SECURITY_WEBHOOK - Security team webhook');
      console.log('');
      console.log('Priority Levels:');
      console.log(
        '  P0 - Critical (Security, Compliance) - Immediate action required'
      );
      console.log(
        '  P1 - High (Tests, Performance) - Action required within hours'
      );
      console.log(
        '  P2 - Medium (Coverage, Lint) - Action required within day'
      );
      console.log('  P3 - Low (Info, Warnings) - Action required within week');
      break;
  }
}

// Export for use as module
module.exports = QualityGateNotifier;

// Run CLI if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

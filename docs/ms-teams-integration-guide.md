# Microsoft Teams Integration Guide - AI-SDLC Framework v3.2.1

## Overview

The AI-SDLC Framework provides comprehensive Microsoft Teams integration for real-time notifications when quality gates fail and developers need to take action. This guide covers setup, configuration, and best practices for actionable developer notifications.

## 🔔 Notification Strategy

### Multi-Channel Approach
- **Main Channel** (`MS_TEAMS_WEBHOOK_URI`) - General CI/CD status updates
- **Developer Channel** (`MS_TEAMS_DEV_WEBHOOK`) - Actionable failure notifications with specific guidance
- **Security Channel** (`MS_TEAMS_SECURITY_WEBHOOK`) - Critical security alerts and compliance failures

### Priority-Based Routing
- **P0 (Critical)** - Security vulnerabilities, FCRA compliance failures → Security Channel
- **P1 (High)** - Test failures, performance issues → Developer Channel
- **P2 (Medium)** - Coverage warnings, lint issues → Developer Channel
- **P3 (Low)** - General status updates → Main Channel

## 🚀 Quick Setup Process

### 1. Create MS Teams Webhooks

#### Main Notification Channel
1. Go to your main development Teams channel
2. Click **"..."** → **"Connectors"** → **"Incoming Webhook"**
3. Name: **"AI-SDLC Main Notifications"**
4. Upload icon (optional): Use AI-SDLC logo
5. Copy the webhook URL

#### Developer Action Channel
1. Go to your developer-focused Teams channel
2. Click **"..."** → **"Connectors"** → **"Incoming Webhook"**
3. Name: **"AI-SDLC Developer Actions"**
4. Description: **"Quality gate failures requiring immediate developer action"**
5. Copy the webhook URL

#### Security Alert Channel
1. Go to your security/compliance Teams channel
2. Click **"..."** → **"Connectors"** → **"Incoming Webhook"**
3. Name: **"AI-SDLC Security Alerts"**
4. Description: **"Critical security vulnerabilities and compliance failures"**
5. Copy the webhook URL

### 2. Configure Repository Secrets

Add the webhook URLs to your GitHub repository secrets:

```bash
# Go to Repository Settings → Secrets and variables → Actions
# Add these secrets:

MS_TEAMS_WEBHOOK_URI=https://outlook.office.com/webhook/...     # Main channel
MS_TEAMS_DEV_WEBHOOK=https://outlook.office.com/webhook/...     # Developer channel
MS_TEAMS_SECURITY_WEBHOOK=https://outlook.office.com/webhook/... # Security channel
```

### 3. Test Webhook Configuration

```bash
# Test main webhook
./scripts-complex/setup-ms-teams.sh --test

# Test quality gate notifications
node scripts-complex/quality-gate-notifier.js test-webhook

# Test specific failure types
node scripts-complex/quality-gate-notifier.js test-failure
node scripts-complex/quality-gate-notifier.js security-failure
node scripts-complex/quality-gate-notifier.js coverage-failure
```

## 🚨 Quality Gate Failure Notifications

### Notification Types

#### 1. Test Failures
**Triggers**: Unit tests fail, E2E tests fail, integration tests fail
**Channel**: Developer Channel
**Priority**: P1 (High)

**Notification Content**:
- ❌ **Failure Type**: Test Suite Failed
- 📊 **Details**: Number of failed tests, coverage percentage
- 🛠️ **Action Items**:
  1. Run tests locally to identify specific failures
  2. Check test coverage and add missing tests
  3. Verify mock data and test setup
  4. Ensure FCRA compliance tests are passing
- 💻 **Local Commands**:
  - `npm run test:coverage`
  - `npm run test:unit`
  - `npm run ai:generate-tests`
  - `./ai-sdlc explain "test failures"`

#### 2. Security Vulnerabilities
**Triggers**: High/critical vulnerabilities, secret exposure, compliance violations
**Channel**: Security Channel
**Priority**: P0 (Critical)

**Notification Content**:
- 🚨 **Failure Type**: Security Scan Failed
- 🔒 **Details**: Vulnerability count by severity, affected packages
- 🛠️ **Action Items**:
  1. Review security vulnerabilities immediately
  2. Update dependencies with security patches
  3. Check for exposed secrets or PII
  4. Validate FCRA compliance patterns
- 💻 **Local Commands**:
  - `./scripts-complex/security-scanner.js full`
  - `npm audit --audit-level=high`
  - `npm run ci:security`
  - `./ai-sdlc explain "security vulnerabilities"`

#### 3. Performance Budget Exceeded
**Triggers**: Core Web Vitals exceed thresholds, bundle size too large
**Channel**: Developer Channel
**Priority**: P1 (High)

**Notification Content**:
- ⚡ **Failure Type**: Performance Budget Exceeded
- 📈 **Details**: Specific metrics that failed (LCP, FCP, CLS, TBT)
- 🛠️ **Action Items**:
  1. Check Core Web Vitals performance metrics
  2. Optimize bundle size and loading performance
  3. Review credit calculation performance
  4. Test performance budgets locally
- 💻 **Local Commands**:
  - `npm run ci:performance`
  - `lighthouse-ci`
  - `npm run test:performance`
  - `./ai-sdlc explain "performance issues"`

#### 4. Code Coverage Below Threshold
**Triggers**: Test coverage < 80%
**Channel**: Developer Channel
**Priority**: P2 (Medium)

**Notification Content**:
- 📊 **Failure Type**: Code Coverage Below Threshold
- 📉 **Details**: Current coverage %, required threshold, gap
- 🛠️ **Action Items**:
  1. Increase test coverage to meet 80% threshold
  2. Focus on business logic and edge cases
  3. Add FCRA compliance test coverage
  4. Generate AI-powered tests for uncovered code
- 💻 **Local Commands**:
  - `npm run test:coverage`
  - `npm run ai:generate-tests`
  - `npm run test:watch-coverage`
  - `./ai-sdlc explain "low test coverage"`

#### 5. FCRA Compliance Failures
**Triggers**: Regulatory compliance violations, PII exposure, audit trail missing
**Channel**: Security Channel
**Priority**: P0 (Critical)

**Notification Content**:
- 🏦 **Failure Type**: FCRA Compliance Violation
- ⚖️ **Details**: Specific compliance violations, affected sections
- 🛠️ **Action Items**:
  1. Review FCRA compliance violations immediately
  2. Check PII data handling patterns
  3. Validate audit trail implementation
  4. Ensure credit score range validation
- 💻 **Local Commands**:
  - `npm run ci:compliance`
  - `./scripts-complex/security-scanner.js compliance`
  - `npm run test -- --grep "FCRA"`
  - `./ai-sdlc explain "FCRA compliance"`

## 📋 Notification Templates

### Critical Failure Template
```json
{
  "@type": "MessageCard",
  "@context": "http://schema.org/extensions",
  "themeColor": "ff0000",
  "summary": "🚨 Critical Quality Gate Failure",
  "sections": [{
    "activityTitle": "🚨 IMMEDIATE ACTION REQUIRED",
    "activitySubtitle": "Critical failure detected - Developer intervention needed",
    "facts": [
      {"name": "🎯 Issue Type", "value": "Security Vulnerability"},
      {"name": "👤 Developer", "value": "@developer"},
      {"name": "📁 Repository", "value": "repo-name"},
      {"name": "🌿 Branch", "value": "branch-name"},
      {"name": "🔗 Workflow", "value": "Security Analysis"}
    ],
    "text": "**CRITICAL SECURITY ISSUE DETECTED**\n\n⚠️ **Immediate Actions Required:**\n1. Stop all development on this branch\n2. Review security scan results immediately\n3. Fix vulnerabilities before proceeding\n4. Run local security validation\n\n**Local Testing:**\n```bash\n./scripts-complex/security-scanner.js full\nnpm audit --audit-level=high\n```\n\n**Need Help?** Use `./ai-sdlc explain \"security vulnerabilities\"` for detailed guidance."
  }],
  "potentialAction": [{
    "@type": "OpenUri",
    "name": "🔍 View Security Report",
    "targets": [{"os": "default", "uri": "workflow-url"}]
  }]
}
```

### Coverage Warning Template
```json
{
  "@type": "MessageCard",
  "@context": "http://schema.org/extensions",
  "themeColor": "ff902a",
  "summary": "📊 Code Coverage Below Threshold",
  "sections": [{
    "activityTitle": "📊 Code Coverage Alert - Action Required",
    "activitySubtitle": "Test coverage needs improvement",
    "facts": [
      {"name": "🎯 Current Coverage", "value": "75%"},
      {"name": "📏 Required Threshold", "value": "80%"},
      {"name": "📉 Gap", "value": "5%"},
      {"name": "👤 Developer", "value": "@developer"}
    ],
    "text": "**Action Required:**\n\n1. **Add Tests:** Write tests for uncovered code paths\n2. **Local Check:** Run `npm run test:coverage` to see detailed report\n3. **Focus Areas:** Business logic and edge cases\n4. **FCRA Compliance:** Ensure credit repair functions have 100% coverage\n\n**Quick Commands:**\n```bash\nnpm run test:coverage\nnpm run ai:generate-tests\n./ai-sdlc explain \"low test coverage\"\n```"
  }]
}
```

## 🔧 Configuration Files

### Enhanced Webhook Manager

The framework includes an enhanced webhook manager at [`scripts-complex/quality-gate-notifier.js`](scripts-complex/quality-gate-notifier.js) with:

- **Priority-based routing** - Critical issues go to appropriate channels
- **Actionable guidance** - Specific commands and steps for resolution
- **Context-aware messaging** - Different templates for different failure types
- **Developer-focused content** - Clear next steps and local testing commands

### GitHub Actions Integration

The quality gate notifications are integrated into all CI/CD workflows:

- **[`quality-gate-notifications.yml`](.github/workflows/quality-gate-notifications.yml)** - Dedicated workflow for failure analysis
- **[`ci-cd-enhanced.yml`](.github/workflows/ci-cd-enhanced.yml)** - Main pipeline with integrated notifications
- **[`security.yml`](.github/workflows/security.yml)** - Security-specific notifications
- **[`performance.yml`](.github/workflows/performance.yml)** - Performance failure notifications

## 🛠️ Setup Commands

### Automated Setup
```bash
# Run the enhanced setup script
./scripts-complex/setup-ms-teams.sh --webhook-url <your-webhook-url>

# Test the configuration
./scripts-complex/setup-ms-teams.sh --test

# Add to package.json scripts
npm run teams:setup
npm run teams:test
npm run teams:validate
```

### Manual Configuration
```bash
# Set environment variables
export MS_TEAMS_WEBHOOK_URI="https://outlook.office.com/webhook/..."
export MS_TEAMS_DEV_WEBHOOK="https://outlook.office.com/webhook/..."
export MS_TEAMS_SECURITY_WEBHOOK="https://outlook.office.com/webhook/..."

# Test webhooks
node scripts-complex/quality-gate-notifier.js test-webhook

# Test specific failure scenarios
node scripts-complex/quality-gate-notifier.js test-failure
node scripts-complex/quality-gate-notifier.js security-failure
node scripts-complex/quality-gate-notifier.js coverage-failure
```

## 📊 Notification Examples

### Test Failure Notification
```
🚨 Quality Gate Failure - Action Required
HIGH Priority | Developer: @john.doe

🎯 Gate Type: TEST
❌ Failure Reason: Unit tests failed with 3 failures
👤 Developer: john.doe
📁 Repository: TheCreditPros/credit-app
🌿 Branch: feature/credit-calculation
🔗 Workflow Run: #12345

🛠️ Immediate Action Items:
1. Run tests locally to identify specific failures
2. Check test coverage and add missing tests
3. Verify mock data and test setup
4. Ensure FCRA compliance tests are passing

💻 Local Testing Commands:
Command 1: npm run test:coverage
Command 2: npm run test:unit
Command 3: npm run ai:generate-tests
Command 4: ./ai-sdlc explain "test failures"

📚 Troubleshooting Resources:
Resource 1: Testing Guide: docs/TESTING-README.md
Resource 2: FCRA Test Patterns: .clinerules
Resource 3: AI Test Generation: npm run ai:generate-tests

[View Workflow Run] [View Pull Request] [Framework Documentation]
```

### Security Alert Notification
```
🚨 IMMEDIATE ACTION REQUIRED
Critical failure detected - Developer intervention needed

🎯 Issue Type: Security Vulnerability
👤 Developer: @jane.smith
📁 Repository: TheCreditPros/payment-service
🌿 Branch: feature/payment-processing
🔗 Workflow: Security Analysis

CRITICAL SECURITY ISSUE DETECTED

⚠️ Immediate Actions Required:
1. Stop all development on this branch
2. Review security scan results immediately
3. Fix vulnerabilities before proceeding
4. Run local security validation

Local Testing:
./scripts-complex/security-scanner.js full
npm audit --audit-level=high

Need Help? Use ./ai-sdlc explain "security vulnerabilities" for detailed guidance.

[View Security Report]
```

## 🔧 Advanced Configuration

### Custom Notification Rules

Create custom notification rules in [`scripts-complex/quality-gate-notifier.js`](scripts-complex/quality-gate-notifier.js):

```javascript
// Custom failure analysis
const customRules = {
  'credit-calculation-failure': {
    priority: 'P0',
    channel: 'security',
    actionItems: [
      'Validate FICO score range (300-850)',
      'Check credit calculation algorithms',
      'Verify FCRA Section 607 compliance',
      'Test with edge case scenarios'
    ],
    localCommands: [
      'npm run test -- --grep "credit.*score"',
      'npm run test:coverage -- src/credit/',
      './ai-sdlc explain "credit calculation errors"'
    ]
  },
  'pii-exposure': {
    priority: 'P0',
    channel: 'security',
    actionItems: [
      'Remove PII from code immediately',
      'Check for SSN, credit card patterns',
      'Validate encryption implementation',
      'Review audit trail logging'
    ],
    localCommands: [
      './scripts-complex/security-scanner.js pii',
      'grep -r "ssn\\|social.*security" src/',
      './ai-sdlc explain "PII exposure"'
    ]
  }
};
```

### Webhook Routing Logic

```javascript
// Enhanced webhook routing
getWebhookUrl(gateType, priority, failureReason) {
  // Critical security issues
  if (gateType === 'security' || failureReason.includes('PII') || failureReason.includes('FCRA')) {
    return this.securityWebhookUrl;
  }

  // High priority development issues
  if (['P0', 'P1'].includes(priority)) {
    return this.devWebhookUrl;
  }

  // General notifications
  return this.webhookUrl;
}
```

## 📱 Mobile Notifications

### Teams Mobile App Integration
- **Push Notifications** - Critical failures trigger mobile alerts
- **@Mentions** - Specific developers are mentioned for immediate attention
- **Action Buttons** - Direct links to workflow runs and documentation

### Notification Timing
- **Immediate** - P0 security and compliance failures
- **Within 5 minutes** - P1 test and performance failures
- **Within 15 minutes** - P2 coverage and lint warnings
- **Daily Summary** - P3 general status updates

## 🔍 Troubleshooting

### Common Issues

#### Webhook Not Receiving Messages
```bash
# Test webhook connectivity
curl -H "Content-Type: application/json" \
     -d '{"text": "Test message"}' \
     "$MS_TEAMS_WEBHOOK_URI"

# Validate webhook URL format
echo $MS_TEAMS_WEBHOOK_URI | grep -E "^https://.*\.webhook\.office\.com"
```

#### Missing Notifications
```bash
# Check GitHub secrets configuration
gh secret list

# Verify workflow permissions
# Ensure workflows have 'contents: read' and 'actions: read' permissions

# Test notification script
node scripts-complex/quality-gate-notifier.js test-webhook
```

#### Notification Spam
```bash
# Configure notification throttling in .env
echo "TEAMS_NOTIFICATION_THROTTLE=300" >> .env  # 5 minutes between similar notifications
echo "TEAMS_MAX_NOTIFICATIONS_PER_HOUR=10" >> .env
```

### Debug Commands
```bash
# Test all notification types
node scripts-complex/quality-gate-notifier.js test-failure
node scripts-complex/quality-gate-notifier.js security-failure
node scripts-complex/quality-gate-notifier.js coverage-failure
node scripts-complex/quality-gate-notifier.js performance-failure
node scripts-complex/quality-gate-notifier.js compliance-failure

# Validate webhook configuration
./scripts-complex/setup-ms-teams.sh --test

# Check notification history
cat .teams-notification-log.json  # If logging is enabled
```

## 📊 Notification Analytics

### Tracking Metrics
- **Response Time** - Time from failure to developer action
- **Resolution Rate** - Percentage of issues resolved within SLA
- **Notification Effectiveness** - Click-through rates on action buttons
- **Developer Engagement** - Usage of provided commands and resources

### Monitoring Dashboard
```bash
# Generate notification analytics
node scripts-complex/webhook-manager.js analytics

# View notification history
node scripts-complex/webhook-manager.js history --days 7

# Export metrics for analysis
node scripts-complex/webhook-manager.js export --format json
```

## 🎯 Best Practices

### Notification Content
- **Be Specific** - Include exact error messages and failure counts
- **Be Actionable** - Provide clear next steps and commands
- **Be Contextual** - Include relevant links and documentation
- **Be Timely** - Send notifications immediately when failures occur

### Channel Management
- **Separate Concerns** - Use different channels for different types of failures
- **Prioritize Appropriately** - Critical security issues get immediate attention
- **Avoid Spam** - Throttle similar notifications to prevent noise
- **Include Context** - Always provide links to logs and documentation

### Developer Experience
- **Local Testing First** - Always provide local commands to reproduce issues
- **Progressive Guidance** - Start with simple fixes, escalate to complex solutions
- **Framework Integration** - Leverage `./ai-sdlc explain` for contextual help
- **Documentation Links** - Include relevant guides and troubleshooting resources

## 🔄 Maintenance

### Weekly Tasks
- Review notification effectiveness and developer response times
- Update notification templates based on common failure patterns
- Validate webhook connectivity and permissions
- Analyze notification analytics for optimization opportunities

### Monthly Tasks
- Review and update priority levels based on business impact
- Optimize notification content for clarity and actionability
- Update troubleshooting resources and documentation links
- Conduct team feedback sessions on notification usefulness

This MS Teams integration provides immediate, actionable notifications that help developers quickly identify and resolve quality gate failures, maintaining high code quality and regulatory compliance for credit repair applications.

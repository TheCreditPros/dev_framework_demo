# GitHub to MS Teams User Mapping Guide - AI-SDLC Framework v3.2.1

## Overview

This guide explains how to map GitHub handles to MS Teams users for proper @mentions in quality gate failure notifications. When a developer's code fails quality gates, they'll receive personalized Teams notifications with their actual name and proper @mentions.

## 🎯 Why User Mapping is Important

### Without User Mapping
- Notifications show GitHub handles: `@nydamon`
- Generic mentions that may not trigger mobile notifications
- No department-based routing for specialized issues
- Difficult to identify who needs to take action

### With User Mapping
- Notifications show real names: `@Damon DeCrescenzo`
- Proper Teams @mentions that trigger mobile notifications
- Department-based routing (Security team for security issues)
- Clear identification and accountability

## 🚀 Quick Setup Process

### Step 1: Initialize User Mapping (2 minutes)

```bash
# Generate initial mapping template
npm run teams:map-init

# Import users from CODEOWNERS file
npm run teams:map-import

# View current mappings
npm run teams:map-list
```

This creates a `.teams-user-mapping.json` file with your team structure.

### Step 2: Configure Team Members (5 minutes)

```bash
# Add individual users
node scripts-complex/teams-user-mapper.js add-user nydamon damon@thecreditpros.com "Damon DeCrescenzo" Engineering CTO

node scripts-complex/teams-user-mapper.js add-user john.doe john.doe@thecreditpros.com "John Doe" Engineering "Senior Developer"

node scripts-complex/teams-user-mapper.js add-user jane.smith jane.smith@thecreditpros.com "Jane Smith" Security "Security Engineer"

# Add team groups
node scripts-complex/teams-user-mapper.js add-team security-team jane.smith security.lead

node scripts-complex/teams-user-mapper.js add-team frontend-team john.doe frontend.dev1 frontend.dev2

node scripts-complex/teams-user-mapper.js add-team senior-devs nydamon senior.dev1 senior.dev2
```

### Step 3: Validate Configuration (1 minute)

```bash
# Validate mapping completeness
npm run teams:map-validate

# Test user mentions
node scripts-complex/teams-user-mapper.js get-mention nydamon
# Output: @Damon DeCrescenzo

# Test team mentions
node scripts-complex/teams-user-mapper.js get-team Security
# Output: Security team members with Teams handles
```

## 📋 User Mapping Configuration File

### Structure: `.teams-user-mapping.json`

```json
{
  "version": "1.0.0",
  "description": "GitHub to MS Teams user mapping for AI-SDLC notifications",
  "lastUpdated": "2025-08-20T18:20:00.000Z",
  "users": {
    "nydamon": {
      "email": "damon@thecreditpros.com",
      "displayName": "Damon DeCrescenzo",
      "teamsId": null,
      "department": "Engineering",
      "role": "CTO / Senior Developer",
      "timezone": "America/New_York",
      "notificationCount": 0,
      "lastNotified": null
    },
    "john.doe": {
      "email": "john.doe@thecreditpros.com",
      "displayName": "John Doe",
      "teamsId": null,
      "department": "Engineering",
      "role": "Senior Developer",
      "timezone": "America/New_York"
    },
    "jane.smith": {
      "email": "jane.smith@thecreditpros.com",
      "displayName": "Jane Smith",
      "teamsId": null,
      "department": "Security",
      "role": "Security Engineer",
      "timezone": "America/New_York"
    }
  },
  "teams": {
    "security-team": {
      "members": ["jane.smith", "security.lead"],
      "teamsChannelId": null,
      "description": "Security and compliance team"
    },
    "frontend-team": {
      "members": ["john.doe", "frontend.dev1"],
      "teamsChannelId": null,
      "description": "Frontend development team"
    },
    "senior-devs": {
      "members": ["nydamon", "senior.dev1", "senior.dev2"],
      "teamsChannelId": null,
      "description": "Senior developers for escalation"
    }
  },
  "aliases": {
    "damon": "nydamon",
    "admin": "nydamon",
    "security": "security-team",
    "frontend": "frontend-team"
  }
}
```

## 🔧 Advanced User Mapping Features

### Department-Based Routing

The system automatically routes notifications based on failure type and user department:

```javascript
// Security issues → Security department
const securityTeam = userMapper.getTeamByDepartment('Security');
// Returns: [jane.smith, security.lead] with proper Teams mentions

// Performance issues → Frontend team
const frontendTeam = userMapper.getTeamByDepartment('Engineering')
  .filter(user => user.role.includes('Frontend'));

// Critical issues → Senior developers
const seniorDevs = userMapper.getTeamByDepartment('Engineering')
  .filter(user => user.role.includes('Senior') || user.role.includes('Lead'));
```

### Smart Mention Strategy

```javascript
// Priority-based mentions
const getMentionsForFailure = (failureType, priority, githubHandle) => {
  const primaryDev = userMapper.getTeamsMention(githubHandle);

  if (priority === 'P0') {
    // Critical issues: mention developer + relevant team + seniors
    const relevantTeam = userMapper.getNotificationTeam(failureType, priority);
    return [primaryDev, ...relevantTeam.map(m => m.teamsHandle)];
  } else {
    // Standard issues: mention developer only
    return [primaryDev];
  }
};
```

### Notification Tracking

The system tracks notification history for analytics:

```javascript
// Automatic tracking when mentions are used
user.lastNotified = new Date().toISOString();
user.notificationCount = (user.notificationCount || 0) + 1;

// Analytics available via command
npm run teams:map-stats
// Output:
// 📊 Notification Statistics:
//   Total Users: 15
//   Total Notifications: 47
//   Most Notified: John Doe (12)
//   Departments: { Engineering: 10, Security: 3, QA: 2 }
```

## 📱 Teams Mention Formats

### Supported Mention Types

#### 1. Email-based Mentions (Recommended)
```json
{
  "email": "damon@thecreditpros.com",
  "mention": "@damon@thecreditpros.com"
}
```
**Pros**: Works reliably, triggers mobile notifications
**Cons**: Requires corporate email addresses

#### 2. Display Name Mentions
```json
{
  "displayName": "Damon DeCrescenzo",
  "mention": "@Damon DeCrescenzo"
}
```
**Pros**: User-friendly, shows real names
**Cons**: May not trigger notifications if name doesn't match exactly

#### 3. Teams ID Mentions (Advanced)
```json
{
  "teamsId": "29:1a2b3c4d5e6f...",
  "mention": "<at>Damon DeCrescenzo</at>"
}
```
**Pros**: Most reliable, always triggers notifications
**Cons**: Requires Teams user IDs (can be obtained via Teams admin)

## 🔍 Getting Teams User IDs (Optional)

### Method 1: Teams Admin Center
1. Go to **Teams Admin Center** → **Users**
2. Search for user by email
3. Copy the **Object ID** (this is the Teams ID)
4. Add to mapping: `"teamsId": "29:1a2b3c4d5e6f..."`

### Method 2: PowerShell (IT Admin)
```powershell
# Connect to Teams
Connect-MicrosoftTeams

# Get user ID by email
Get-CsOnlineUser -Identity "damon@thecreditpros.com" | Select-Object UserPrincipalName, Identity

# Export all users
Get-CsOnlineUser | Select-Object UserPrincipalName, Identity, DisplayName | Export-Csv teams-users.csv
```

### Method 3: Graph API (Advanced)
```bash
# Using Microsoft Graph API
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     "https://graph.microsoft.com/v1.0/users/damon@thecreditpros.com" \
     | jq '.id'
```

## 🛠️ Practical Implementation Examples

### Example 1: Basic Team Setup

```bash
# Initialize mapping
npm run teams:map-init

# Add core team members
node scripts-complex/teams-user-mapper.js add-user nydamon damon@thecreditpros.com "Damon DeCrescenzo" Engineering CTO

node scripts-complex/teams-user-mapper.js add-user john.doe john.doe@thecreditpros.com "John Doe" Engineering "Senior Developer"

node scripts-complex/teams-user-mapper.js add-user jane.smith jane.smith@thecreditpros.com "Jane Smith" Security "Security Engineer"

# Create teams
node scripts-complex/teams-user-mapper.js add-team security-team jane.smith
node scripts-complex/teams-user-mapper.js add-team senior-devs nydamon john.doe

# Validate setup
npm run teams:map-validate
```

### Example 2: Import from CODEOWNERS

```bash
# Automatically import all GitHub handles from CODEOWNERS
npm run teams:map-import

# Review imported users (will have placeholder data)
npm run teams:map-list

# Update specific users with real information
node scripts-complex/teams-user-mapper.js add-user imported-user real.email@thecreditpros.com "Real Name" Engineering Developer
```

### Example 3: Test User Mentions

```bash
# Test individual user mention
node scripts-complex/teams-user-mapper.js get-mention nydamon
# Output: @Damon DeCrescenzo

# Test team mentions
node scripts-complex/teams-user-mapper.js get-team Security
# Output: Security team with Teams handles

# Test notification with proper mentions
node scripts-complex/quality-gate-notifier.js test-failure
# Will use mapped Teams names instead of GitHub handles
```

## 📊 Notification Examples with User Mapping

### Before User Mapping
```
🚨 Quality Gate Failure - Action Required
Developer: nydamon | Repository: TheCreditPros/credit-app

❌ Failure Reason: Unit tests failed with 3 failures
👤 Developer: nydamon
```

### After User Mapping
```
🚨 Quality Gate Failure - Action Required
Developer: @Damon DeCrescenzo | Repository: TheCreditPros/credit-app

❌ Failure Reason: Unit tests failed with 3 failures
👤 Developer: @Damon DeCrescenzo
👥 Team Notified: @John Doe, @Jane Smith (for P0 issues)
```

## 🔄 Maintenance and Updates

### Regular Maintenance Tasks

#### Weekly
```bash
# Review notification statistics
npm run teams:map-stats

# Validate mapping completeness
npm run teams:map-validate

# Check for new team members in CODEOWNERS
npm run teams:map-import
```

#### Monthly
```bash
# Export user mapping for backup
cp .teams-user-mapping.json .teams-user-mapping.backup.json

# Review and update department assignments
node scripts-complex/teams-user-mapper.js list

# Update user roles and departments as needed
node scripts-complex/teams-user-mapper.js add-user existing-user email@company.com "Name" NewDepartment "New Role"
```

### Handling Team Changes

#### New Team Member
```bash
# Add new developer
node scripts-complex/teams-user-mapper.js add-user new.dev new.dev@thecreditpros.com "New Developer" Engineering "Junior Developer"

# Add to relevant teams
node scripts-complex/teams-user-mapper.js add-team frontend-team john.doe new.dev frontend.dev1
```

#### Department Changes
```bash
# Update existing user's department
node scripts-complex/teams-user-mapper.js add-user john.doe john.doe@thecreditpros.com "John Doe" Security "Security Developer"
```

#### Team Restructuring
```bash
# Create new team structure
node scripts-complex/teams-user-mapper.js add-team compliance-team jane.smith compliance.officer legal.advisor

# Update user departments
node scripts-complex/teams-user-mapper.js add-user jane.smith jane.smith@thecreditpros.com "Jane Smith" Compliance "Compliance Officer"
```

## 🔒 Security Considerations

### Sensitive Information
- **Email Addresses**: Store corporate email addresses only
- **Teams IDs**: Optional but more secure than email mentions
- **Department Info**: Used for routing, keep current
- **File Security**: Add `.teams-user-mapping.json` to `.gitignore` if it contains sensitive data

### Access Control
```bash
# Add to .gitignore if mapping contains sensitive information
echo ".teams-user-mapping.json" >> .gitignore

# Or create a sanitized version for repository
node scripts-complex/teams-user-mapper.js export-sanitized
```

### Privacy Compliance
- Only store necessary information for notifications
- Respect user privacy preferences
- Allow users to opt-out of certain notification types
- Regular cleanup of notification history

## 🎯 Best Practices

### Mapping Strategy
1. **Start Simple** - Begin with email-based mentions
2. **Import from CODEOWNERS** - Automatically discover GitHub handles
3. **Update Gradually** - Add real information as you validate users
4. **Test Thoroughly** - Verify mentions work before going live

### Notification Effectiveness
1. **Use Real Names** - More personal and clear than GitHub handles
2. **Department Routing** - Send security issues to security team
3. **Priority Escalation** - Include senior developers for critical issues
4. **Mobile Optimization** - Ensure mentions trigger mobile notifications

### Team Management
1. **Keep Current** - Update mappings when team changes
2. **Validate Regularly** - Run validation checks weekly
3. **Monitor Usage** - Track notification statistics
4. **Gather Feedback** - Ask team about notification effectiveness

## 📊 Analytics and Monitoring

### Notification Statistics
```bash
# View comprehensive statistics
npm run teams:map-stats

# Example output:
# 📊 Notification Statistics:
#   Total Users: 15
#   Total Notifications: 47
#   Most Notified: John Doe (12)
#   Departments: { Engineering: 10, Security: 3, QA: 2 }
```

### User Activity Tracking
```javascript
// Automatic tracking in user mapping
{
  "nydamon": {
    "email": "damon@thecreditpros.com",
    "displayName": "Damon DeCrescenzo",
    "notificationCount": 12,
    "lastNotified": "2025-08-20T18:15:00.000Z",
    "averageResponseTime": "00:15:30"
  }
}
```

### Team Performance Metrics
- **Response Times** - How quickly team members respond to notifications
- **Resolution Rates** - Percentage of issues resolved using provided guidance
- **Notification Accuracy** - Relevance of department-based routing
- **Mobile Engagement** - Click-through rates on mobile notifications

## 🔧 Advanced Configuration

### Custom Mention Rules
```javascript
// Add to teams-user-mapper.js for custom mention logic
const getCustomMention = (githubHandle, failureType, priority) => {
  const user = this.userMapping.users[githubHandle];

  // Use Teams ID for critical security issues
  if (failureType === 'security' && priority === 'P0' && user.teamsId) {
    return `<at>${user.displayName}</at>`;
  }

  // Use email for standard notifications
  if (user.email) {
    return `@${user.email}`;
  }

  // Fallback to display name
  return `@${user.displayName}`;
};
```

### Timezone-Aware Notifications
```javascript
// Consider user timezones for notification timing
const shouldSendImmediateNotification = (user, priority) => {
  const userTime = new Date().toLocaleString('en-US', {
    timeZone: user.timezone || 'America/New_York'
  });

  const hour = new Date(userTime).getHours();

  // Always send P0 (critical) notifications
  if (priority === 'P0') return true;

  // Respect quiet hours for non-critical notifications
  if (hour < 8 || hour > 18) return false;

  return true;
};
```

### Integration with CODEOWNERS
```javascript
// Automatic team assignment based on file changes
const getRelevantTeamFromFiles = (changedFiles) => {
  const fileTeamMapping = {
    'src/security/': 'security-team',
    'src/credit/': 'credit-team',
    'src/frontend/': 'frontend-team',
    'tests/': 'qa-team'
  };

  const relevantTeams = new Set();

  changedFiles.forEach(file => {
    Object.entries(fileTeamMapping).forEach(([pattern, team]) => {
      if (file.includes(pattern)) {
        relevantTeams.add(team);
      }
    });
  });

  return Array.from(relevantTeams);
};
```

## 🎯 Implementation Checklist

### Initial Setup
- [ ] Run `npm run teams:map-init` to create mapping template
- [ ] Run `npm run teams:map-import` to import from CODEOWNERS
- [ ] Update user information with real names and emails
- [ ] Create team groups for different departments
- [ ] Validate mapping with `npm run teams:map-validate`

### Testing
- [ ] Test individual user mentions
- [ ] Test team mentions for different departments
- [ ] Verify notifications trigger properly in Teams
- [ ] Test mobile notification delivery
- [ ] Validate priority-based routing

### Production Deployment
- [ ] Add mapping file to repository (or keep local if sensitive)
- [ ] Train team on new notification format
- [ ] Monitor notification effectiveness
- [ ] Gather feedback and optimize
- [ ] Set up regular maintenance schedule

This user mapping system ensures that quality gate failure notifications reach the right people with proper @mentions, improving response times and accountability while maintaining professional communication standards.

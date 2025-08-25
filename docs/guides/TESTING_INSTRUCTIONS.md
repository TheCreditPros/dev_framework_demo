# MS Teams Integration Testing Instructions

## 🧪 What I Need From You for Testing

### Step 1: Create MS Teams Webhook (2 minutes)

1. **Go to any MS Teams channel** (can be a test channel or existing channel)
2. **Click the "..." menu** at the top of the channel
3. **Select "Connectors"**
4. **Find and click "Incoming Webhook"**
5. **Configure the webhook:**
   - **Name**: `AI-SDLC Test`
   - **Description**: `Testing AI-SDLC Framework notifications`
   - **Upload image**: (optional)
6. **Click "Create"**
7. **Copy the webhook URL** (it will look like: `https://outlook.office.com/webhook/...`)

### Step 2: Provide Information

**Please provide me with:**

1. **MS Teams Webhook URL** (from Step 1)
2. **Your GitHub handle** (e.g., `nydamon`)
3. **Your email address** (e.g., `damon@thecreditpros.com`)
4. **Your display name** (e.g., `Damon DeCrescenzo`)

**Example format:**
```
Webhook URL: https://outlook.office.com/webhook/abc123...
GitHub Handle: nydamon
Email: damon@thecreditpros.com
Display Name: Damon DeCrescenzo
```

## 🚀 What I'll Test Once You Provide This

### Test Sequence:
1. **Basic Connectivity** - Send a simple test message to verify webhook works
2. **User Mapping** - Configure your GitHub → Teams mapping
3. **Quality Gate Notifications** - Send sample failure notifications with:
   - Test failure notification
   - Security alert notification
   - Coverage warning notification
   - Performance issue notification
4. **Proper @Mentions** - Verify your real name appears instead of GitHub handle
5. **Mobile Notifications** - Confirm notifications trigger on your mobile Teams app

### Expected Results:
You should see **4 test notifications** in your Teams channel:
- ✅ **Webhook Test** - Basic connectivity confirmation
- 🚨 **Test Failure Alert** - Sample quality gate failure with actionable guidance
- 🔒 **Security Alert** - Sample security vulnerability notification
- 📊 **Coverage Warning** - Sample code coverage notification

Each notification will include:
- **Your real name** instead of GitHub handle
- **Specific action items** for resolving the issue
- **Local testing commands** you can copy and paste
- **Direct links** to documentation and resources

## 📱 Mobile Testing

After the notifications are sent:
1. **Check your Teams mobile app** - You should receive push notifications
2. **Verify @mentions work** - Your name should be properly mentioned
3. **Test action buttons** - Links should work on mobile
4. **Confirm readability** - Notifications should be clear and actionable on mobile

## 🎯 Success Criteria

The test is successful if:
- ✅ All 4 notifications appear in your Teams channel
- ✅ Your real name appears instead of GitHub handle
- ✅ Mobile notifications are triggered
- ✅ Action items and commands are clear and actionable
- ✅ Links work properly on both desktop and mobile

Ready to test? Just provide the webhook URL and your information!

#!/usr/bin/env node

/**
 * MCP Setup Script for AI-SDLC Framework
 * Orchestrates MCP server installation and configuration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MCPInstaller = require('./mcp-installer');
const MCPValidator = require('./mcp-validator');

class MCPSetup {
  constructor() {
    this.logPrefix = '🔧 MCP Setup';
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
    console.log(`[${timestamp}] ${emoji} ${this.logPrefix}: ${message}`);
  }

  async checkPrerequisites() {
    this.log('Checking prerequisites for MCP server setup...');

    const checks = [
      { name: 'Node.js', command: 'node --version' },
      { name: 'npm', command: 'npm --version' },
      { name: 'npx', command: 'npx --version' },
    ];

    let passed = 0;
    for (const check of checks) {
      try {
        const result = execSync(check.command, {
          encoding: 'utf8',
          stdio: 'pipe',
        });
        this.log(`${check.name} ${result.trim()} ✓`);
        passed++;
      } catch {
        this.log(`${check.name} not available`, 'error');
      }
    }

    if (passed !== checks.length) {
      throw new Error('Prerequisites not met. Please install Node.js and npm.');
    }

    this.log('Prerequisites check passed ✓');
  }

  async checkConfiguration() {
    this.log('Checking MCP configuration files...');

    const configPath = path.join(process.cwd(), '.mcp.json');
    if (!fs.existsSync(configPath)) {
      throw new Error('MCP configuration (.mcp.json) not found');
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const serverCount = Object.keys(config.servers || {}).length;
      this.log(`Found ${serverCount} MCP servers configured ✓`);
    } catch {
      throw new Error('Invalid MCP configuration');
    }
  }

  async runInstallation() {
    this.log('Running MCP server installation...');

    const installer = new MCPInstaller();
    await installer.run();

    this.log('MCP server installation completed ✅');
  }

  async runValidation() {
    this.log('Running MCP server validation...');

    const validator = new MCPValidator();
    await validator.run();

    this.log('MCP server validation completed ✅');
  }

  async createQuickStartGuide() {
    const guide = `# MCP Quick Start Guide - AI-SDLC v3.2.0

## ✅ MCP Servers Configured Successfully!

Your AI-SDLC framework now has 6 powerful MCP servers ready for credit repair development:

### 🎭 **Playwright Automation**
- **Purpose**: E2E testing with AI-driven test generation
- **Benefits**: Auto-generate tests in plain English, test credit repair workflows
- **Usage**: AI creates Playwright tests for dispute forms, credit reports, customer portals

### 🐙 **GitHub Integration** 
- **Purpose**: Repository management and compliance automation
- **Benefits**: Automated PR reviews, FCRA code scanning, issue tracking
- **Usage**: AI reviews code for PII exposure, manages compliance PRs

### 📁 **Secure Filesystem**
- **Purpose**: PII-safe file operations
- **Benefits**: Prevents accidental PII exposure, secure config management
- **Usage**: AI handles files while protecting sensitive credit data

### 🗄️ **PostgreSQL Enhanced**
- **Purpose**: Database operations with FCRA audit trails  
- **Benefits**: Compliance logging, PII encryption, schema validation
- **Usage**: AI generates compliant database queries with audit trails

### 🌐 **Web Content Fetch**
- **Purpose**: Safe content fetching for compliance docs
- **Benefits**: Fetch CFPB regulations, credit bureau API docs safely
- **Usage**: AI researches compliance requirements from trusted sources

### 🔧 **Everything Server**
- **Purpose**: Development utilities and testing
- **Benefits**: Full MCP feature testing, development debugging
- **Usage**: Test MCP functionality during development

## 🚀 Quick Start Commands

### Add MCP Servers to Claude Code:
\`\`\`bash
claude mcp add --config ./.mcp.json
\`\`\`

### Validate Installation:
\`\`\`bash
npm run mcp:validate
\`\`\`

### Check Status:
\`\`\`bash
npm run mcp:status
\`\`\`

## 🔑 Required Environment Variables

Add these to your \`.env\` file for full functionality:

\`\`\`bash
# Essential (Required)
GITHUB_TOKEN=ghp_your_github_token_here
OPENAI_API_KEY=sk-your_openai_key_here

# Database (If using PostgreSQL server)
DATABASE_URL=postgresql://user:pass@localhost:5432/database

# Optional Enhancements
PLAYWRIGHT_BROWSERS_PATH=./browsers
HEADLESS=true
TCP_DOMAIN=credit_repair
FCRA_COMPLIANCE_MODE=true
\`\`\`

## 🎯 What This Enables

With MCP servers configured, you can now:

1. **📝 Generate Tests in Plain English**
   - "Create E2E tests for the credit dispute submission form"
   - "Test FCRA compliance for the credit score calculation"

2. **🔍 AI Code Reviews for Compliance** 
   - Automatic PII detection in pull requests
   - FCRA Section 604 compliance validation
   - Credit repair domain pattern recognition

3. **⚡ Accelerated Development**
   - AI understands your credit repair business logic
   - Context-aware code generation
   - Automated compliance testing

4. **🛡️ Enhanced Security**
   - PII-safe file operations
   - Secure database queries with audit trails
   - Compliant web content fetching

## 📋 Next Steps

1. ✅ MCP servers are installed and configured
2. 🔑 Add environment variables to \`.env\` 
3. 🔌 Add to Claude Code: \`claude mcp add --config ./.mcp.json\`
4. 🧪 Test with: \`npm run mcp:validate\`
5. 🚀 Start developing with AI superpowers!

---

**🎉 Congratulations!** Your AI-SDLC framework is now supercharged with MCP servers optimized for credit repair development.

Generated by AI-SDLC Framework v3.2.0 MCP Setup
`;

    const guidePath = path.join(process.cwd(), 'MCP-QUICK-START.md');
    fs.writeFileSync(guidePath, guide);
    this.log('Quick start guide created at MCP-QUICK-START.md');
  }

  async run() {
    try {
      console.log('🔌 AI-SDLC v3.2.0 MCP Setup');
      console.log('==============================\n');

      await this.checkPrerequisites();
      await this.checkConfiguration();
      await this.runInstallation();
      await this.runValidation();
      await this.createQuickStartGuide();

      console.log('\n🎉 MCP Setup Complete!');
      console.log('📖 Check MCP-QUICK-START.md for next steps');
    } catch (error) {
      this.log(`Setup failed: ${error.message}`, 'error');
      console.log('\n💡 Troubleshooting:');
      console.log('1. Ensure .mcp.json exists in project root');
      console.log('2. Check Node.js and npm are installed');
      console.log('3. Review error messages above');
      process.exit(1);
    }
  }
}

// Run the setup
if (require.main === module) {
  const setup = new MCPSetup();
  setup.run().catch((error) => {
    console.error('❌ MCP Setup failed:', error);
    process.exit(1);
  });
}

module.exports = MCPSetup;

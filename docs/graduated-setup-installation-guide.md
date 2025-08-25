# AI-SDLC Framework: Graduated Setup Installation Guide

## Overview

This guide provides comprehensive instructions for safely installing the AI-SDLC Framework's graduated setup complexity levels on existing repositories without corrupting current methodologies.

## Setup Levels Available

| Level | Duration | Description | Use Case |
|-------|----------|-------------|----------|
| **Minimal** | 2-3 min | Essential tools only | New developers, quick start |
| **Standard** | 5-8 min | Current full setup (default) | Balanced development experience |
| **Enterprise** | 10-15 min | Full compliance + enterprise tools | Production environments |

## Pre-Installation Safety Checklist

### 1. Repository Compatibility Check

**Before installation, verify your repository meets these requirements:**

```bash
# Check Node.js version (>=18.0.0 required)
node --version

# Check npm version (>=8.0.0 required)
npm --version

# Check Git version (>=2.20.0 required)
git --version

# Verify you're in a Git repository
git status
```

### 2. Backup Critical Files

**Create backups of existing configuration files:**

```bash
# Create backup directory
mkdir -p .ai-sdlc-backup/$(date +%Y%m%d-%H%M%S)

# Backup existing configuration files
cp package.json .ai-sdlc-backup/$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true
cp .eslintrc.js .ai-sdlc-backup/$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true
cp .eslintrc.json .ai-sdlc-backup/$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true
cp eslint.config.js .ai-sdlc-backup/$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true
cp .prettierrc .ai-sdlc-backup/$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true
cp vitest.config.js .ai-sdlc-backup/$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true
cp playwright.config.js .ai-sdlc-backup/$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true

echo "✅ Backup created in .ai-sdlc-backup/"
```

### 3. Git Status Check

**Ensure clean working directory:**

```bash
# Check for uncommitted changes
git status

# If you have uncommitted changes, commit or stash them
git add .
git commit -m "Pre-AI-SDLC setup checkpoint" || git stash
```

## Installation Process

### Step 1: Download Required Files

```bash
# Download the three core files to your project root
curl -O https://raw.githubusercontent.com/your-repo/ai-sdlc-framework/main/setup-levels.json
curl -O https://raw.githubusercontent.com/your-repo/ai-sdlc-framework/main/auto-setup-enhanced.sh
curl -O https://raw.githubusercontent.com/your-repo/ai-sdlc-framework/main/test-setup-levels.sh

# Make scripts executable
chmod +x auto-setup-enhanced.sh test-setup-levels.sh
```

### Step 2: Choose Your Setup Level

#### For New Developers (Minimal Setup)
```bash
./auto-setup-enhanced.sh --minimal
```

#### For Standard Development (Default)
```bash
./auto-setup-enhanced.sh --standard
# or simply
./auto-setup-enhanced.sh
```

#### For Enterprise/Production (Full Features)
```bash
./auto-setup-enhanced.sh --enterprise
```

### Step 3: Validate Installation

```bash
# Run the validation script
npm run validate

# Test basic functionality
npm run lint
npm run format
npm run test
```

## Project Type Specific Instructions

### React/TypeScript Projects

**Additional considerations:**

```bash
# If you have existing TypeScript config, the setup will detect it
# Verify TypeScript integration after setup
npx tsc --noEmit

# Test React-specific linting
npm run lint -- --ext .tsx,.ts
```

### Laravel/PHP Projects

**Backend setup requirements:**

```bash
# Ensure Composer is available
composer --version

# The setup will automatically detect Laravel projects
# Verify PHP tools after enterprise setup
./vendor/bin/pint --test
```

### Full-Stack Projects

**For projects with both frontend and backend:**

```bash
# Run setup from project root
./auto-setup-enhanced.sh --enterprise

# Validate both frontend and backend
cd frontend && npm run validate && cd ..
cd backend && composer test && cd ..
```

## Rollback Instructions

### Automatic Rollback (If Setup Fails)

The setup script includes automatic cleanup on failure. If installation fails:

1. Original `package.json` is automatically restored from backup
2. Partially created config files are removed
3. No permanent changes are made to your repository

### Manual Rollback

**If you need to manually revert changes:**

```bash
# Restore from backup
BACKUP_DIR=$(ls -1t .ai-sdlc-backup/ | head -1)
cp .ai-sdlc-backup/$BACKUP_DIR/package.json . 2>/dev/null || true

# Remove AI-SDLC generated files
rm -f eslint.config.js .prettierrc vitest.config.js playwright.config.js
rm -f validate-setup.js lighthouse.config.js
rm -rf .husky/

# Clean up dependencies (optional)
npm install

echo "✅ Rollback completed"
```

### Git-Based Rollback

**Using Git to revert all changes:**

```bash
# Reset to last commit (loses all changes)
git reset --hard HEAD

# Or create a new branch and reset
git checkout -b pre-ai-sdlc-setup
git reset --hard HEAD~1
```

## Testing and Validation

### Level-Specific Validation

#### Minimal Setup Validation
```bash
# Test essential tools
npx eslint --version
npx prettier --version
npx husky --version
npm run lint
npm run format
```

#### Standard Setup Validation
```bash
# Test all standard features
npm run test
npm run test:e2e
npm run validate
```

#### Enterprise Setup Validation
```bash
# Test enterprise features
npm run ci:security
npm run ci:performance
npm run mcp:validate
npm run teams:validate
```

### Integration Testing

**Verify existing workflows still work:**

```bash
# Test your existing build process
npm run build

# Test existing test suites
npm test

# Verify Git hooks work
git add . && git commit -m "Test commit"
```

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Node.js version not supported"
```bash
# Solution: Update Node.js
nvm install 18
nvm use 18
```

#### Issue: "Git repository not found"
```bash
# Solution: Initialize Git repository
git init
git add .
git commit -m "Initial commit"
```

#### Issue: "Permission denied" on scripts
```bash
# Solution: Fix permissions
chmod +x auto-setup-enhanced.sh test-setup-levels.sh
```

#### Issue: "Package conflicts detected"
```bash
# Solution: Clean install
rm -rf node_modules package-lock.json
npm install
```

#### Issue: "ESLint configuration conflicts"
```bash
# Solution: Remove conflicting configs
rm .eslintrc.js .eslintrc.json
./auto-setup-enhanced.sh --minimal  # Re-run setup
```

### Enterprise-Specific Issues

#### Issue: "PostgreSQL not found"
```bash
# Solution: Install PostgreSQL or skip
brew install postgresql  # macOS
# or run with skip flag
./auto-setup-enhanced.sh --enterprise --skip-postgresql
```

#### Issue: "MCP server setup failed"
```bash
# Solution: Check scripts-complex directory
ls scripts-complex/mcp-installer.js
# or skip MCP setup
./auto-setup-enhanced.sh --enterprise --skip-mcp
```

## Team Installation Guidelines

### For Individual Developers

1. Follow standard installation process
2. Use `--minimal` for quick onboarding
3. Upgrade to `--standard` when comfortable

### For Development Teams

1. **Team Lead**: Test installation on development branch
2. **Standardize**: Choose one setup level for entire team
3. **Document**: Create team-specific installation notes
4. **Rollout**: Install on feature branches first

### CI/CD Integration

**Update your CI/CD workflows:**

```yaml
# .github/workflows/ci.yml
- name: Validate AI-SDLC Setup
  run: npm run validate

- name: Run Enhanced Tests
  run: |
    npm run test:coverage
    npm run test:e2e
```

## Support and Resources

### Getting Help

- **Validation Issues**: Run `npm run validate` for diagnostics
- **Setup Logs**: Check `ai-sdlc-setup.log` for detailed output
- **Configuration**: Review `setup-levels.json` for customization

### Additional Resources

- [Quick Start Guide](./quick-start-simple.md)
- [Troubleshooting Guide](./troubleshooting-simple.md)
- [Team Workflow Guide](./team-workflow-summary.md)

---

**⚠️ Important Notes:**

- Always backup your repository before installation
- Test in a development branch first
- The setup preserves existing configurations when possible
- Rollback options are available if issues occur
- Contact your team lead for enterprise setup assistance

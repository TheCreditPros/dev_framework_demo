# AI-SDLC Version Management Guide

## 🎯 Overview

This guide establishes the process for maintaining consistent version numbers across the AI-SDLC framework documentation and ensuring proper version management for all future deployments.

## 📋 Version Management Process

### Current Version: v3.0.0

**Last Updated:** August 7, 2025

### Automatic Version Update Script

The framework includes an automated version update script that maintains consistency across all documentation files:

```bash
# Update to a new version
./scripts-complex/version-update.sh v2.7.2

# The script will:
# 1. Update mkdocs.yml version and date
# 2. Update CLAUDE.md framework version
# 3. Update all docs/*.md files with new version
# 4. Update last modified dates
# 5. Create a git commit with the changes
```

## 🔄 Version Update Workflow

### Step 1: Determine New Version Number

Use **Semantic Versioning (semver)** format: `vMAJOR.MINOR.PATCH`

- **MAJOR (v3.0.0)**: Breaking changes, new architecture, significant framework overhaul
- **MINOR (v2.8.0)**: New features, new tools integration, significant enhancements
- **PATCH (v2.7.2)**: Bug fixes, documentation updates, minor improvements

### Step 2: Run Version Update Script

```bash
# Example: Updating to v2.7.2
./scripts-complex/version-update.sh v2.7.2
```

**Script Output:**

```
🚀 AI-SDLC Version Update Script
=================================

📋 Updating to version: v2.7.2
📅 Updating date to: August 7, 2025

📊 Current version: v3.0.0

Continue with version update? (y/N): y

🔄 Starting version update...

📄 Updating mkdocs.yml...
  ✅ mkdocs.yml updated

📄 Updating CLAUDE.md...
  ✅ CLAUDE.md updated

📂 Updating documentation files...
  ✅ Updated README.md
  ✅ Updated glossary.md
  [... all other files ...]

📊 Updated 19 documentation files

🎉 Version update completed!

📋 Git status:
M  CLAUDE.md
M  docs/README.md
[... other modified files ...]

Create git commit for version update? (y/N): y
✅ Git commit created successfully

📝 Commit details:
abc123f docs: update framework version to v2.7.2
```

### Step 3: Deploy Documentation

```bash
# Deploy to GitHub Pages with new version
./deploy-docs.sh
```

## 📂 Files Updated by Version Script

The automatic version update script modifies these files:

### Core Framework Files

- `mkdocs.yml` - Site configuration and copyright
- `CLAUDE.md` - Main framework instructions

### Documentation Files (docs/)

1. `README.md` - Main documentation homepage
2. `glossary.md` - Framework terminology
3. `implementation-guide-managers.md` - Manager implementation guide
4. `claude-code-cline-implementation-guide.md` - Enterprise platform guide
5. `centralized-ruleset-management.md` - Ruleset management guide
6. `architecture-simplified.md` - Framework architecture
7. `quick-start-simple.md` - Quick start guide
8. `enhanced-cursor-guidelines.md` - AI development guidelines
9. `git-hooks-automation.md` - Git automation guide
10. `postgresql-automation.md` - Database automation
11. `existing-database-setup.md` - Database integration
12. `react-best-practices-updated.md` - React development patterns
13. `developer-workflow-guide.md` - Developer workflows
14. `qa-team-workflow-guide.md` - QA team processes
15. `code-reviewer-guide.md` - Code review processes
16. `troubleshooting-simple.md` - Troubleshooting guide
17. `scripts-reference.md` - Scripts documentation
18. `TESTING-README.md` - Testing procedures
19. `scripts-download.md` - Scripts download page

## ⚙️ Manual Version Update (Fallback)

If the automatic script fails, update versions manually:

### 1. Update mkdocs.yml

```yaml
copyright: |
  Version: v2.7.2 | Updated: August 7, 2025
```

### 2. Update CLAUDE.md

```markdown
**Framework Version**: Enhanced AI-SDLC v3.0.0
**Document Version**: v3.0.0
**Last Updated**: August 7, 2025
```

### 3. Update All Documentation Files

Replace all instances of:

- `v2.8.1` → `v2.8.2`
- Previous date → Current date

## 📋 Version Update Checklist

Before deploying any version update:

- [ ] All documentation files show consistent version number
- [ ] All dates updated to current date
- [ ] No remaining references to old version number
- [ ] Git commit created with proper message format
- [ ] Documentation site deploys successfully
- [ ] All links and navigation working correctly

## 🔍 Version Validation Commands

### Check Current Version Consistency

```bash
# Check version consistency across files
grep -r "v[0-9]\+\.[0-9]\+\.[0-9]\+" . --include="*.md" --include="*.yml" | \
  grep -v ".git" | sort | uniq -c

# Should show same version number across all files
```

### Validate Date Consistency

```bash
# Check date consistency in documentation
grep -r "Last Updated:" docs/ | head -10
grep -r "Updated:" mkdocs.yml

# Should show same date across all files
```

## 🚨 Troubleshooting Version Updates

### Issue: "Version script not executable"

```bash
chmod +x scripts-complex/version-update.sh
```

### Issue: "Inconsistent version numbers"

```bash
# Find all version references
grep -r "v[0-9]\+\.[0-9]\+\.[0-9]\+" . --include="*.md" --include="*.yml" | \
  grep -v ".git"

# Run version update script again
./scripts-complex/version-update.sh v2.7.2
```

### Issue: "Git commit failed"

```bash
# Check git status
git status

# Stage files manually
git add -A
git commit -m "docs: update framework version to v2.7.2"
```

## 📋 Release Notes Template

For each version update, document changes in release notes:

```markdown
## AI-SDLC v2.7.2 - August 7, 2025

### 🆕 New Features

- [List new features added]

### 🔧 Improvements

- [List improvements and enhancements]

### 🐛 Bug Fixes

- [List bugs fixed]

### 📚 Documentation Updates

- Updated framework version to v2.7.2
- Refreshed all documentation dates
- [Other documentation changes]
```

## 🎯 Next Steps After Version Update

1. **Deploy Documentation**: Run `./deploy-docs.sh`
2. **Update External References**: Notify stakeholders of new version
3. **Create Release Notes**: Document changes in version update
4. **Test Deployment**: Verify all links and functionality work
5. **Archive Previous Version**: Keep record of version history

---

**🤖 Automation Status**: ✅ **FULLY AUTOMATED**  
**📝 Maintenance**: Minimal - script handles all version consistency  
**🔄 Update Frequency**: As needed for releases  
**👤 Responsible**: Implementation Manager / CTO

This version management system ensures consistent, reliable version tracking across the entire AI-SDLC framework documentation.

# 🚀 AI-SDLC Framework v3.3.2

> **Drop-in AI-powered development automation for any technology stack**

[![GitHub Actions](https://img.shields.io/github/actions/workflow/status/TheCreditPros/dev_framework_demo/ci-simplified.yml?branch=main)](https://github.com/TheCreditPros/dev_framework_demo/actions)
[![SonarCloud Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=TheCreditPros_dev_framework_demo&metric=alert_status)](https://sonarcloud.io/dashboard?id=TheCreditPros_dev_framework_demo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)

## 🎯 **Quick Start (2 Minutes)**

### **Install**

```bash
# Clone or download framework
git clone https://github.com/TheCreditPros/dev_framework_demo.git your-project
cd your-project

# One-command setup
./scripts/bootstrap.sh
```

### **Uninstall**

```bash
# Clean removal
./scripts/teardown.sh

# Or force cleanup
./scripts/teardown.sh --force
```

### **Validate Setup**

```bash
# Run all quality gates
npm run quality-gates

# Validate configuration
node validate-setup.js

# Validate CI consistency (ensures local matches GitHub Actions)
node scripts/validate-ci-consistency.cjs
```

## ✨ **What Actually Runs Here**

| Capability                | Enabled | Workflow file              | Blocks merge |
| ------------------------- | ------- | -------------------------- | ------------ |
| **Lint + Prettier**       | ✅      | ci-simplified.yml          | ✅           |
| **TypeScript checks**     | ✅      | ci-simplified.yml          | ✅           |
| **Unit tests + coverage** | ✅      | ci-simplified.yml          | ✅           |
| **SonarCloud (PRs)**      | ✅      | sonarcloud-pr-analysis.yml | ❌           |
| **AI code review**        | ✅      | ai-code-review.yml         | ❌           |
| **E2E (Playwright)**      | ⚠️      | n/a (scaffold only)        | ❌           |
| **Security scanning**     | ✅      | ci-simplified.yml          | ✅           |
| **Dependency review**     | ✅      | dependency-review.yml      | ✅           |
| **Commit standards**      | ✅      | pre-commit hooks           | ✅           |

## 🛠️ **Available Commands**

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run test:coverage    # Generate coverage report

# Quality Gates
npm run quality-gates    # Run all quality checks
npm run lint:fix         # Auto-fix code style
npm run format:fix       # Auto-fix formatting
npm run type-check       # TypeScript validation

# Validation
npm run validate-ci      # CI consistency check
node validate-setup.js   # Configuration validation
```

## 🚀 **Integration**

```bash
# Add to your project
./scripts/bootstrap.sh   # Setup environment
npm run quality-gates   # Verify everything works
```

## 📚 **Documentation**

- [Installation Guide](docs/ci-cd-implementation-guide.md)
- [Configuration Guide](docs/SECRETS_AND_CONFIGURATION.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)

## 📞 **Support**

- 🐛 [Issues](https://github.com/TheCreditPros/dev_framework_demo/issues)
- 💬 [Discussions](https://github.com/TheCreditPros/dev_framework_demo/discussions)
- 📖 [Documentation](/docs)

---

**Built with ❤️ by [The Credit Pros Development Team](https://github.com/TheCreditPros)**

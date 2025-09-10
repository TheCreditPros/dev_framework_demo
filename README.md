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
| **SonarCloud (PRs)**      | ✅      | sonarcloud-pr-analysis.yml | ✅           |
| **AI code review**        | ✅      | ai-code-review.yml         | ❌           |
| **E2E (Playwright)**      | ⚠️      | n/a (scaffold only)        | ❌           |
| **Security scanning**     | ✅      | ci-simplified.yml          | ✅           |
| **Dependency review**     | ✅      | dependency-review.yml      | ✅           |
| **Commit standards**      | ✅      | pre-commit hooks           | ✅           |

<<<<<<< HEAD

## 🔧 **What Actually Runs in This Repository**

| Capability             | Enabled Here | Workflow File(s)            | Blocks Merge | Status      |
| ---------------------- | ------------ | --------------------------- | ------------ | ----------- |
| **ESLint + Prettier**  | ✅           | `ci-simplified.yml`         | ✅           | Active      |
| **TypeScript Checks**  | ✅           | `ci-simplified.yml`         | ✅           | Active      |
| **Unit Tests**         | ✅           | `ci-simplified.yml`         | ✅           | Active      |
| **Test Coverage**      | ✅           | `ci-simplified.yml`         | ✅           | Active      |
| **Security Audit**     | ✅           | `ci-simplified.yml`         | ✅           | Active      |
| **CodeQL Analysis**    | ✅           | `ci-simplified.yml`         | ✅           | Active      |
| **SonarCloud Quality** | ✅           | `sonarcloud-analysis.yml`   | ✅           | Active      |
| **Dependabot Updates** | ✅           | `dependabot-auto-merge.yml` | ✅           | Active      |
| **AI Code Review**     | ✅           | `ai-code-review.yml`        | ❌           | Active      |
| **E2E Tests**          | ⚠️ scaffold  | n/a                         | ❌           | Config only |
| **Performance Tests**  | ❌           | n/a                         | ❌           | Not enabled |

## 🛠️ **Core Features**

### **AI-Powered Development**

- **🤖 Qodo PR-Agent**: Automatic code review with 8.9k+ GitHub stars
- **💡 Smart Suggestions**: Context-aware improvements and security fixes
- **🎯 FCRA Compliance**: Specialized validation for credit repair applications
- **📊 Cost Optimized**: 97% cost reduction vs GPT-4 (using GPT-4o-mini)

### **Security-First Approach**

- **🛡️ Daily Vulnerability Scans**: Dependabot + SonarCloud + CodeQL
- **🔐 PII Protection**: Automatic detection and masking of sensitive data
- **📋 Audit Trails**: Comprehensive logging for compliance requirements
- **⚡ Auto-Healing**: Intelligent fixes for common security issues

### **Universal Compatibility**

- **🌍 Any Tech Stack**: Works with JavaScript, TypeScript, Python, PHP, etc.
- **☁️ Any Platform**: GitHub, GitLab, BitBucket, Azure DevOps
- **🐳 Any Environment**: Docker, Kubernetes, serverless, traditional hosting

## 🛠️ **Available Commands**

### **Quick Commands**

```bash
npm run quality-gates    # Run all checks (lint, test, type-check, build)
npm run test:coverage    # Run tests with coverage
./scripts/bootstrap.sh   # Setup development environment
node validate-setup.js   # Validate configuration
```

[📚 **Full Command Reference**](docs/commands.md)

## 🚀 **Integration Guide**

### **Quick Setup**

```bash
# Add to existing project
git clone https://github.com/TheCreditPros/dev_framework_demo.git temp
cp -r temp/.github ./ && cp -r temp/scripts ./
cp temp/.* ./ && rm -rf temp
./scripts/bootstrap.sh
```

### **Required Secrets**

Add `SONAR_TOKEN` to GitHub Repository Secrets.

[📚 **Complete Integration Guide**](docs/integration-guide.md)

## 🤖 **AI Features**

### **Qodo PR-Agent Commands**

Use in PR comments: `/review`, `/describe`, `/improve`, `/security-review`, `/analyze`

### **Smart Automation**

- **🔍 Auto-Review Triggers**: Security failures, dependency updates
- **🛠️ Self-Healing Tests**: E2E tests automatically adapt to UI changes
- **📊 Quality Insights**: Continuous code quality monitoring

[📚 **AI Features Guide**](docs/ai-features.md)

## 📊 **Quality Metrics**

- **✅ Test Coverage**: 80%+ enforced
- **✅ Code Quality**: A-grade SonarCloud rating
- **✅ Security**: Zero high/critical vulnerabilities
- **⚡ Performance**: < 5 minute CI/CD pipeline
- **💰 Cost**: 97% reduction vs GPT-4

[📚 **Metrics Dashboard**](docs/metrics.md)

## 🔧 **Configuration Files**

**Core Configs**: `.github/workflows/`, `eslint.config.mjs`, `vitest.config.js`, `.pr_agent.toml`, `sonar-project.properties`

**Quality Gates**: `.husky/`, `.editorconfig`, `.github/dependabot.yml`

[📚 **Configuration Guide**](docs/configuration.md)

## 📚 **Documentation**

- [🚀 **Installation Guide**](docs/ci-cd-implementation-guide.md)
- [🔧 **Configuration Guide**](docs/SECRETS_AND_CONFIGURATION.md)
- [🤝 **Contributing Guide**](CONTRIBUTING.md)
- [🔒 **Security Policy**](SECURITY.md)
- [🧪 **E2E Testing**](docs/E2E-CONFIGURATION.md)
- [📊 **SonarCloud Setup**](docs/sonarcloud-setup.md)

[📚 **Full Documentation Index**](docs/README.md)

## 🌟 **Impact**

**Before**: Manual reviews (2-3 days), security vulnerabilities, inconsistent quality, high maintenance

**After**: Instant AI reviews, zero vulnerabilities, consistent quality, 90% less maintenance

## 🚀 **Latest Features (v3.3.2)**

- **🧠 Smart Repository Detection**: Auto-adapts to test/production
- **🔄 Idempotent Bootstrap**: Safe to run multiple times
- **⚡ Enhanced Automation**: Concurrency control, timeout protection
- **🤖 Advanced AI**: Cost-optimized models, FCRA compliance focus
- **🔧 Self-Healing Tests**: Playwright tests adapt automatically

[📋 **Changelog**](CHANGELOG.md)

## 🎯 **Perfect For**

- **🏦 Credit Repair Companies**: FCRA compliance, PII protection, audit trails
- **👥 Development Teams**: Consistent quality, automated security, AI reviews
- **🚀 Startups & Enterprises**: Scales with team size, production-ready, cost-optimized

## 📞 **Support & Community**

- 🐛 **Issues**: [GitHub Issues](https://github.com/TheCreditPros/dev_framework_demo/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/TheCreditPros/dev_framework_demo/discussions)
- 📖 **Documentation**: [Full Docs Index](docs/README.md)
- 🔒 **Security**: security@thecreditpros.com

---

## 🎉 **Get Started**

```bash
git clone https://github.com/TheCreditPros/dev_framework_demo.git your-project
cd your-project
./scripts/bootstrap.sh
npm run quality-gates
```

**🚀 Ready in 2 minutes!**

---

# _Built by [The Credit Pros](https://github.com/TheCreditPros) • MIT License_

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

> > > > > > > 8ffcdf3 (fix: core cleanup - node 20, remove python lint rule, consolidate installers)

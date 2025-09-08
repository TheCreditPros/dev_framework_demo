# 🚀 AI-SDLC Framework v3.3.2

> **Universal Development Automation Platform** - Works with any technology stack, any project type, any team size.

[![AI-SDLC Framework](https://img.shields.io/badge/AI--SDLC-v3.3.2-blue.svg)](https://github.com/TheCreditPros/dev_framework_demo)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Framework Status](https://img.shields.io/badge/Status-Production%20Ready-green.svg)](https://github.com/TheCreditPros/dev_framework_demo)

[![Quality Gates](https://img.shields.io/badge/Quality%20Gates-100%25-green.svg)](https://github.com/TheCreditPros/dev_framework_demo)

[![AI Integration](https://img.shields.io/badge/AI%20Integration-GPT4%20%2B%20Claude%20%2B%20DeepSeek-blue.svg)](https://github.com/TheCreditPros/dev_framework_demo)

## 🎯 **What This Framework Does**

The AI-SDLC Framework transforms any repository into an **AI-powered development powerhouse** with:

- 🤖 **AI-Powered Code Review** - PR Agent with full repository context
- 🧪 **Intelligent Test Generation** - Multi-model AI with cost optimization
- 🔍 **Quality Gates** - Flexible, environment-aware validation
- 🚀 **Auto-Healing Tests** - Self-maintaining E2E tests
- 📊 **Multi-Stack Detection** - Works with any technology combination
- 🛡️ **Universal Security** - Input validation, auth patterns, compliance
- 💰 **Cost Optimized** - 97% cost reduction vs GPT-4
- ✨ **Smart Repository Detection** - Automatically adapts to any environment
- 🔧 **Enhanced Quality Gates** - Better error reporting and auto-fixing
- 🔍 **SonarCloud Integration** - PR-based code analysis with developer feedback

## 📁 **Project Structure**

This repository contains a **React/TypeScript** AI-SDLC framework demo with the following structure:

```
├── src/                    # Main React/TypeScript source code
│   ├── components/         # React components
│   ├── utils/             # Utility functions
│   └── test/              # Test setup and utilities
├── tests/                 # Test files (unit, integration, e2e)
├── scripts/               # AI framework automation scripts
├── scripts-complex/       # Advanced AI tools and validators
├── legacy/                # Legacy PHP/Laravel examples (reference only)
│   └── php-examples/      # PHP files moved here for clarity
├── docs/                  # Documentation
└── .github/               # GitHub Actions workflows
```

**Note**: The `legacy/php-examples/` directory contains PHP/Laravel files that demonstrate the framework's multi-stack capabilities but are not part of the main React/TypeScript project.

## 🏗️ **Universal Architecture**

This framework works with **ANY** technology stack:

```
✅ Laravel + React + TypeScript
✅ Next.js + Node.js + MongoDB
✅ Python + Django + PostgreSQL
✅ Ruby + Rails + MySQL
✅ Go + Gin + Redis
✅ Java + Spring + Oracle
✅ .NET + C# + SQL Server
✅ And many more...
```

## 🔍 **SonarCloud PR Analysis**

The framework includes **comprehensive SonarCloud integration** that provides the standard developer experience:

### **How It Works**

1. **Automatic PR Analysis**: SonarCloud runs on every pull request
2. **Developer Feedback**: Quality issues and coverage metrics appear in PR comments
3. **Pre-Merge Validation**: Developers can fix issues before merging
4. **Quality Gates**: Prevents merging of problematic code

### **Setup (One-Time)**

```bash
# 1. Get your SonarCloud token
# Visit: https://sonarcloud.io/account/security/

# 2. Add token to GitHub repository secrets
# GitHub → Settings → Secrets and variables → Actions
# Add secret: SONAR_TOKEN = your_token_here

# 3. That's it! SonarCloud will now analyze all PRs
```

### **What You Get**

- ✅ **Code Quality Analysis** - Bugs, vulnerabilities, code smells
- ✅ **Coverage Reports** - JavaScript/TypeScript test coverage
- ✅ **Security Hotspots** - Potential security issues
- ✅ **Maintainability** - Technical debt and complexity metrics
- ✅ **PR Comments** - Rich feedback directly in pull requests
- ✅ **Quality Gates** - Automatic blocking of low-quality code

### **Workflows Included**

- **PR Analysis** (`.github/workflows/sonarcloud-pr-analysis.yml`) - Runs on PR events
- **Main Branch Analysis** (`.github/workflows/sonarcloud-analysis.yml`) - Runs on main branch pushes
- **Dynamic Configuration** - Automatically adapts to your repository

## 🚀 **Quick Start (5 Minutes)**

### **Prerequisites**

- **Node.js** (v18+ recommended)
- **Python** (v3.8+ for AI PR Agent - optional but recommended)
- **Git** (for version control)

### **1. Clone the Framework**

```bash
git clone https://github.com/TheCreditPros/dev_framework_demo.git
cd your-project
```

### **2. Run Smart Installation (installs all security automation)**

```bash
./install-framework-smart.sh
```

### **3. That's It!** 🎉

Your repository now has:

- AI-powered development automation
- Quality gates and testing (ESLint, Prettier, TypeScript, Vitest)
- Intelligent PR reviews (PR Agent auto-installed during setup)
- Auto-correction on commit (lint-staged + repo fixers)

## 🔑 **High‑Priority Configuration (Per Repository)**

These options let each repository point E2E tests at a real app and enable AI review. If not set, sensible defaults keep the template fully functional.

- **E2E App Target (Recommended)**
  - Set repository Variables in GitHub → Settings → Secrets and variables → Actions → Variables
    - `PLAYWRIGHT_WEB_SERVER`: command that starts your app in CI
      - Examples
        - Vite/React: `npm run preview -- --host --port 3000`
        - Next.js: `npm run start`
        - Express: `node server.js`

- **AI PR Agent (Optional)**
  - Set repository Secrets in GitHub → Settings → Secrets and variables → Actions → Secrets
    - `PR_AGENT_OPENAI_API_KEY`: Your OpenAI API key for AI-powered PR reviews
    - `PR_AGENT_GITHUB_TOKEN`: GitHub token with repo access

## 🎯 **Repository Types (NEW in v3.3.1)**

The framework now intelligently detects and adapts to different repository types:

| Type           | Detection                                | Git Hooks                | Use Case               |
| -------------- | ---------------------------------------- | ------------------------ | ---------------------- |
| **TEST**       | `/tmp/`, `test`, `demo`, `example` paths | Available but not active | Testing and validation |
| **PRODUCTION** | Has Git remote + not in test paths       | Fully active             | Live projects          |
| **LOCAL**      | No Git remote + not in test paths        | Configured               | Local development      |

### **Smart Installation**

```bash
# For any repository type
./install-framework-smart.sh

# The script automatically detects:
# - Test repositories: Safe testing without Git interference
# - Production repositories: Full Git hooks protection
# - Local repositories: Development-ready configuration
```

## 🔗 **Git Hooks Configuration (NEW in v3.3.1)**

The framework now includes an **interactive Git hooks configuration** that ensures users make informed decisions:

### **Interactive Prompt**

During installation, you'll see a prompt like this:

```bash
🔗 Git Hooks Configuration
=========================
The AI-SDLC framework includes Git hooks for:
  • Pre-commit: Run linting and formatting checks
  • Commit-msg: Enforce conventional commit messages
  • Pre-push: Run comprehensive quality gates

Repository Type: production
🚀 PRODUCTION REPOSITORY DETECTED
   Git hooks are HIGHLY RECOMMENDED for production repositories
   to ensure code quality and prevent bad commits from being pushed.

Do you want to configure Git hooks for this repository? (y/N)
   This will set 'git config core.hooksPath .husky'
   You can disable them later with: git config --unset core.hooksPath

Configure Git hooks? [Y]:
```

### **Context-Aware Defaults**

| Repository Type | Default | Recommendation                      |
| --------------- | ------- | ----------------------------------- |
| **Production**  | `Y`     | Highly recommended for code quality |
| **Test**        | `N`     | Optional for validation             |
| **Local**       | `Y`     | Recommended for development         |

### **Managing Git Hooks**

```bash
# Enable Git hooks
git config core.hooksPath .husky

# Disable Git hooks
git config --unset core.hooksPath

# Check current configuration
git config core.hooksPath
```

### **Benefits of Interactive Configuration**

- **No Assumptions**: Users explicitly choose their Git hooks setup
- **Clear Information**: Understand exactly what Git hooks do
- **Easy Management**: Simple commands to enable/disable later
- **Context-Aware**: Smart defaults based on repository type
- **Transparent Process**: Users know exactly what's being configured

## 🧪 **Testing Strategy**

### **Unit Tests (Vitest)**

- **Fast execution** with Vite's native speed
- **TypeScript support** out of the box
- **Coverage reporting** with v8 engine
- **React Testing Library** integration

### **Integration Tests**

- **API contract testing** with real endpoints
- **Database integration** testing
- **Service layer** validation

### **E2E Tests (Playwright)**

- **Cross-browser testing** (Chrome, Firefox, Safari)
- **Auto-healing capabilities** - tests fix themselves
- **Visual regression** testing
- **Performance monitoring** (Web Vitals)

### **AI-Powered Test Generation**

- **Multi-model AI** (GPT-4, Claude, DeepSeek)
- **Cost optimization** (97% reduction vs GPT-4)
- **Intelligent test cases** based on code analysis
- **Auto-updating tests** as code evolves

## 🔍 **Quality Gates**

### **Pre-Commit Hooks**

- **ESLint** - Code quality and style
- **Prettier** - Code formatting
- **TypeScript** - Type checking
- **Unit tests** - Fast feedback loop

### **Pre-Push Hooks**

- **Full test suite** - Comprehensive validation
- **Coverage thresholds** - Minimum 80% coverage
- **Build verification** - Ensures deployability
- **Security scanning** - Dependency vulnerabilities

### **CI/CD Pipeline**

- **GitHub Actions** - Automated workflows
- **SonarCloud** - Code quality analysis
- **CodeQL** - Security scanning
- **Deployment** - Automated releases

## 🤖 **AI Integration**

### **PR Agent**

- **Automated code review** with full context
- **Intelligent suggestions** for improvements
- **Security vulnerability** detection
- **Performance optimization** recommendations

### **Test Generation**

- **AI-powered test cases** based on code analysis
- **Multi-model approach** for best results
- **Cost optimization** with intelligent model selection
- **Auto-updating tests** as requirements change

### **Auto-Healing**

- **Self-maintaining tests** that fix themselves
- **Intelligent selectors** that adapt to UI changes
- **Automatic retry** mechanisms
- **Smart error recovery**

## 📊 **Performance & Monitoring**

### **Removed Components**

- **Lighthouse** - Deprecated, removed from framework
- **Performance tracking** - Focus on essential quality gates

### **Active Monitoring**

- **Web Vitals** - Core performance metrics
- **Test coverage** - Code quality assurance
- **Build performance** - Deployment efficiency
- **AI model costs** - Cost optimization tracking

## 🛠️ **Development Tools**

### **Code Quality**

- **ESLint** - Advanced linting with TypeScript support
- **Prettier** - Consistent code formatting
- **Husky** - Git hooks management
- **Commitlint** - Conventional commit messages

### **Testing**

- **Vitest** - Modern testing framework
- **Playwright** - E2E testing
- **Testing Library** - React component testing
- **Coverage** - Comprehensive test coverage

### **Build & Deploy**

- **Vite** - Fast build tool
- **TypeScript** - Type safety
- **GitHub Actions** - CI/CD automation
- **SonarCloud** - Code quality analysis

## 📚 **Documentation**

### **Core Documentation**

- **Installation Guide** - `docs/ci-cd-implementation-guide.md`
- **E2E Configuration** - `docs/E2E-CONFIGURATION.md`
- **SonarCloud Setup** - `docs/sonarcloud-setup.md`
- **Production Readiness** - `docs/production-readiness-assessment.md`

### **API Documentation**

- **Component APIs** - Auto-generated from TypeScript
- **Test Utilities** - Comprehensive testing helpers
- **Configuration Options** - All available settings

## 🚀 **Deployment**

### **Production Deployment**

1. Run `./install-framework-smart.sh` on your target repository
2. The script will detect it's a production repository
3. Git hooks will be fully activated
4. Quality gates will be enforced

### **Test Environment**

1. Run the script in a test directory (e.g., `/tmp/test-project`)
2. The script will detect it's a test repository
3. Git hooks will be available but not active
4. Full validation without interfering with Git workflow

## 🔒 **Security**

### **Dependency Security**

- **Automated scanning** for vulnerabilities
- **Regular updates** of dependencies
- **License compliance** checking
- **Security audit** reports

### **Code Security**

- **ESLint security rules** - Prevents common vulnerabilities
- **Input validation** - Sanitizes user inputs
- **Authentication patterns** - Secure auth implementation
- **Compliance checking** - Regulatory compliance validation

## 💰 **Cost Optimization**

### **AI Model Costs**

- **97% cost reduction** vs GPT-4
- **Intelligent model selection** based on task complexity
- **Batch processing** for efficiency
- **Caching** for repeated operations

### **Development Efficiency**

- **Automated testing** - Reduces manual QA time
- **Auto-healing tests** - Reduces maintenance overhead
- **Intelligent code review** - Faster PR reviews
- **Quality gates** - Prevents costly bugs in production

## 🎉 **What's New in v3.3.2**

### **✨ Smart Repository Detection**

- **Intelligent Environment Detection**: Automatically detects test, production, and local repositories
- **Environment-Aware Installation**: Adapts behavior based on repository type
- **Safe Testing**: Test repositories don't interfere with Git workflows
- **Production Ready**: Full Git hooks protection for production environments

### **🔧 Enhanced Quality Gates**

- **Comprehensive Error Reporting**: Detailed feedback instead of failing on first error
- **Auto-Fix Capabilities**: Many issues resolved automatically
- **Smart Validation**: Environment-aware validation with clear status reporting
- **Graceful Degradation**: Handles missing TypeScript/test files gracefully

### **🛠️ Improved Developer Experience**

- **Better ESLint Configuration**: Auto-fixable rules with proper error handling
- **Smart Git Hooks**: Properly configured for all environment types
- **Comprehensive Testing**: All quality gates and tests passing
- **Clear Documentation**: Detailed feedback and actionable guidance

### **🔗 Interactive Git Hooks Configuration**

- **Mandatory User Prompt**: No more assumptions - users explicitly choose Git hooks configuration
- **Context-Aware Defaults**: Smart defaults based on repository type (Production: Y, Test: N, Local: Y)
- **Clear Information**: Explains what Git hooks do and their benefits
- **Easy Management**: Simple commands to enable/disable hooks later
- **Transparent Process**: Users understand exactly what's being configured

### **🔍 SonarCloud PR Analysis Integration**

- **Standard PR Workflow**: SonarCloud analysis runs automatically on pull requests
- **Developer Feedback**: Quality issues and coverage metrics displayed directly in PR comments
- **Pre-Merge Validation**: Developers can fix issues before merging code
- **Dynamic Project Identification**: Automatically configures project keys and organization
- **Comprehensive Coverage Analysis**: JavaScript/TypeScript coverage with proper exclusions
- **Quality Gate Integration**: Prevents merging of problematic code
- **Main Branch Analysis**: Additional workflow for overall project health tracking
- **Easy Setup**: Just add `SONAR_TOKEN` secret to enable full functionality

### **🤖 Qodo PR-Agent Integration**

- **Official AI Code Review**: Uses the popular [Qodo PR-Agent](https://github.com/qodo-ai/pr-agent) (8.9k+ stars)
- **Comprehensive PR Operations**: Review, describe, improve, analyze, ask, and more
- **Interactive Commands**: Use `/review`, `/describe`, `/improve` in PR comments
- **FCRA Compliance Focus**: Specialized validation for credit repair applications
- **Multiple Model Support**: GPT-4o-mini, Claude, with intelligent fallbacks
- **Advanced Features**: PR compression, self-reflection, static code analysis
- **Zero Maintenance**: Community-supported open source project with regular updates
- **Enhanced Developer Experience**: Actionable suggestions and comprehensive feedback

### **🤖 Qodo PR-Agent Integration**

- **Official AI Code Review**: Uses the popular [Qodo PR-Agent](https://github.com/qodo-ai/pr-agent) (8.9k+ stars)
- **Comprehensive PR Operations**: Review, describe, improve, analyze, ask, and more
- **Interactive Commands**: Use `/review`, `/describe`, `/improve` in PR comments
- **FCRA Compliance Focus**: Specialized validation for credit repair applications
- **Multiple Model Support**: GPT-4o-mini, Claude, with intelligent fallbacks
- **Advanced Features**: PR compression, self-reflection, static code analysis
- **Zero Maintenance**: Community-supported open source project with regular updates
- **Enhanced Developer Experience**: Actionable suggestions and comprehensive feedback

## 📦 **Available Scripts**

### **Development**

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
```

### **Testing**

```bash
npm run test             # Run tests in watch mode
npm run test:ci          # Run tests once with coverage
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run end-to-end tests
```

### **Code Quality**

```bash
npm run lint             # Lint all files
npm run lint:fix         # Auto-fix linting issues
npm run format           # Check formatting
npm run format:fix       # Auto-fix formatting
npm run quality-gates    # Run all quality checks
```

### **Validation**

```bash
node validate-setup.js   # Validate framework installation
```

## 🔧 **Configuration**

### **ESLint Configuration**

- **File**: `eslint.config.mjs`
- **Features**: TypeScript support, auto-fixing, double quotes enforcement
- **Rules**: Comprehensive rule set with smart defaults

### **Prettier Configuration**

- **File**: `.prettierrc`
- **Settings**: Double quotes, 2-space tabs, ES5 trailing commas

### **Vitest Configuration**

- **File**: `vitest.config.js`
- **Features**: Coverage reporting, TypeScript support, React testing

### **Git Hooks**

- **Pre-commit**: Runs linting and formatting
- **Commit-msg**: Enforces conventional commit messages
- **Pre-push**: Runs quality gates before pushing

## �� **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run quality gates: `npm run quality-gates`
5. Commit with conventional messages
6. Push and create a pull request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

For support and questions:

- Create an issue in the repository
- Check the documentation in the `docs/` directory
- Run `node validate-setup.js` for installation validation

## 🎯 **Executive Summary**

The AI-SDLC Framework v3.3.1 is a **comprehensive development automation platform** that transforms any repository into an AI-powered development powerhouse. It provides:

- **Universal Compatibility**: Works with any technology stack
- **AI-Powered Automation**: Intelligent code review, test generation, and auto-healing
- **Quality Assurance**: Comprehensive quality gates and testing
- **Cost Optimization**: 97% cost reduction vs traditional AI tools
- **Smart Detection**: Automatically adapts to different environments
- **Production Ready**: Full Git hooks protection and quality enforcement

**Ready to supercharge your development workflow with AI-powered automation!** 🚀

# Test SonarCloud Integration

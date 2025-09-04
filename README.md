# AI-SDLC Framework

A comprehensive AI-driven Software Development Life Cycle framework that integrates modern development tools, quality gates, and intelligent automation for React/TypeScript projects.

## 🚀 Version 3.3.1 - Latest Features

### ✨ **Smart Repository Detection (NEW)**

- **Intelligent Environment Detection**: Automatically detects test, production, and local repositories
- **Environment-Aware Installation**: Adapts behavior based on repository type
- **Safe Testing**: Test repositories don't interfere with Git workflows
- **Production Ready**: Full Git hooks protection for production environments

### 🔧 **Enhanced Quality Gates**

- **Comprehensive Error Reporting**: Detailed feedback instead of failing on first error
- **Auto-Fix Capabilities**: Many issues resolved automatically
- **Smart Validation**: Environment-aware validation with clear status reporting
- **Graceful Degradation**: Handles missing TypeScript/test files gracefully

### 🛠️ **Improved Developer Experience**

- **Better ESLint Configuration**: Auto-fixable rules with proper error handling
- **Smart Git Hooks**: Properly configured for all environment types
- **Comprehensive Testing**: All quality gates and tests passing
- **Clear Documentation**: Detailed feedback and actionable guidance

## 📋 **Quick Start**

### **Installation**

```bash
# Clone the repository
git clone https://github.com/TheCreditPros/dev_framework_demo.git
cd dev_framework_demo

# Install dependencies
npm install

# Run the smart installation script on your target repository
cp install-framework-smart.sh /path/to/your/project
cd /path/to/your/project
chmod +x install-framework-smart.sh
./install-framework-smart.sh
```

### **Validation**

```bash
# Validate the installation
node validate-setup.js

# Run quality gates
npm run quality-gates
```

## 🏗️ **Architecture**

### **Core Components**

- **ESLint**: Advanced linting with TypeScript support and auto-fixing
- **Prettier**: Code formatting with double quotes enforcement
- **Vitest**: Modern testing framework with coverage reporting
- **Playwright**: End-to-end testing capabilities
- **Husky**: Git hooks for quality assurance
- **Commitlint**: Conventional commit message enforcement

### **Smart Features**

- **Repository Type Detection**: Automatically adapts to test/production/local environments
- **Quality Gates**: Comprehensive checks before deployment
- **Auto-Healing**: Automatic fixing of common issues
- **Environment Awareness**: Different behavior for different repository types

## 🎯 **Repository Types**

| Type           | Detection                                | Git Hooks                | Use Case               |
| -------------- | ---------------------------------------- | ------------------------ | ---------------------- |
| **TEST**       | `/tmp/`, `test`, `demo`, `example` paths | Available but not active | Testing and validation |
| **PRODUCTION** | Has Git remote + not in test paths       | Fully active             | Live projects          |
| **LOCAL**      | No Git remote + not in test paths        | Configured               | Local development      |

## 📊 **Quality Gates**

The framework includes comprehensive quality gates:

- ✅ **Dependencies**: Package integrity and security
- ✅ **Linting**: Code quality and style enforcement
- ✅ **Formatting**: Consistent code formatting
- ✅ **TypeScript**: Type safety and error checking
- ✅ **Tests**: Unit and integration test coverage
- ✅ **Build**: Successful build verification

## ��️ **Available Scripts**

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

## 📈 **Performance Monitoring**

- **Removed**: Lighthouse (deprecated)
- **Status**: Performance monitoring removed due to Lighthouse deprecation
- **Alternative**: Consider using modern alternatives like Web Vitals or Core Web Vitals

## 🤖 **AI Integration**

### **AI PR Agent**

- **Installation**: Automatic via `pipx` or `pip`
- **Features**: Automated code review and suggestions
- **Requirements**: Python 3.8+ and `pr-agent`

### **Smart Automation**

- **Auto-Healing**: Automatic fixing of common issues
- **Intelligent Detection**: Smart repository type detection
- **Quality Assurance**: Comprehensive validation and testing

## 📚 **Documentation**

- **Installation Guide**: `docs/ci-cd-implementation-guide.md`
- **E2E Configuration**: `docs/E2E-CONFIGURATION.md`
- **SonarCloud Setup**: `docs/sonarcloud-setup.md`
- **Production Readiness**: `docs/production-readiness-assessment.md`

## 🧪 **Testing**

The framework includes comprehensive testing:

- **Unit Tests**: React components and utilities
- **Integration Tests**: API contracts and workflows
- **E2E Tests**: End-to-end user workflows
- **Quality Gates**: Automated quality assurance

## 🔒 **Security**

- **Dependency Scanning**: Regular security audits
- **Code Quality**: ESLint security rules
- **Git Hooks**: Pre-commit and pre-push validation
- **Conventional Commits**: Structured commit messages

## 📦 **Dependencies**

### **Core Dependencies**

- React 19.1.1
- TypeScript 5.8.3
- Vite 6.3.5
- Vitest 3.2.4

### **Development Tools**

- ESLint 9.34.0
- Prettier 3.6.2
- Husky 9.1.7
- Playwright 1.49.1

## 🤝 **Contributing**

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

## 🎉 **What's New in v3.3.1**

- ✨ **Smart Repository Detection**: Automatically detects and adapts to different environments
- 🔧 **Enhanced Quality Gates**: Better error reporting and auto-fixing capabilities
- 🛠️ **Improved Developer Experience**: Clearer feedback and actionable guidance
- 🚀 **Production Ready**: Full Git hooks protection and quality assurance
- 🧪 **Comprehensive Testing**: All quality gates and tests passing
- 📚 **Better Documentation**: Updated README with latest features

---

**Ready to supercharge your development workflow with AI-powered automation!** 🚀

# 🚀 Simple Dev Framework

> **Basic TypeScript development framework with essential tooling**

[![GitHub Actions](https://img.shields.io/github/actions/workflow/status/TheCreditPros/dev_framework_demo/ci-simplified.yml?branch=main)](https://github.com/TheCreditPros/dev_framework_demo/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)

## 🎯 **Quick Start**

### **Install**

```bash
git clone https://github.com/TheCreditPros/dev_framework_demo.git
cd dev_framework_demo
npm install
```

### **Development**

```bash
# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 📋 **Available Scripts**

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm test          # Run tests
npm run lint      # Lint code
npm run type-check # TypeScript validation
```

## 🏗️ **Project Structure**

```
src/
├── components/     # React components
├── utils/         # Utility functions
└── test/          # Test setup

tests/
├── unit/          # Unit tests
├── integration/   # Integration tests
└── e2e/          # End-to-end tests

public/            # Static assets
```

## 🚀 **Deployment**

The project includes a simple CI/CD pipeline that runs on every push to main and pull requests.

**Checks performed:**

- Code linting with ESLint
- TypeScript type checking
- Unit tests with coverage
- Build verification

## 🤖 **AI-Powered PR Reviews**

This framework includes **Qodo AI PR Agent** for automated, intelligent code reviews that provide detailed feedback directly in your pull requests.

### **🎯 What AI Reviews Cover**

**Code Quality Analysis:**
- TypeScript best practices and type safety
- React component patterns and hooks usage
- Performance optimizations and memory management
- Code readability and maintainability
- Documentation completeness

**Security Analysis:**
- Input validation and sanitization
- Authentication and authorization patterns
- Data exposure prevention
- Dependency security vulnerabilities
- Secure coding practices

**Testing & Coverage:**
- Unit test adequacy and coverage (80%+ threshold)
- Integration test completeness
- Edge case handling and error scenarios
- Test maintainability

**Performance Review:**
- Bundle size optimization
- Runtime performance bottlenecks
- Memory leak prevention
- Loading optimization
- User experience considerations

### **🚀 Setting Up AI Reviews**

**1. Get Qodo API Token:**
```bash
# Visit: https://qodo.ai
# Sign up for an account
# Generate an API token
```

**2. Add to Repository Secrets:**
- Go to: **Settings** → **Secrets and variables** → **Actions**
- Add: `QODO_API_TOKEN` = `your_api_token_here`
- Add: `GITHUB_TOKEN` = `${{ secrets.GITHUB_TOKEN }}`

**3. AI Reviews Will Automatically:**
- ✅ Run on every PR (opened, synchronized, reopened)
- ✅ Analyze entire codebase changes
- ✅ Post detailed comments with specific line references
- ✅ Provide actionable improvement suggestions
- ✅ Include security analysis and performance recommendations
- ✅ Generate code quality scores and improvement plans

### **💬 AI Review Commands**

You can also trigger specific AI reviews manually by commenting on PRs:

```markdown
/review              # General code review
/security-review     # Security-focused analysis
/analyze             # Deep code analysis
/improve             # Specific improvement suggestions
/describe            # PR description enhancement
```

### **📊 AI Review Output**

**AI provides structured feedback including:**

1. **Code Quality Score** (1-10 scale)
2. **Critical Issues** requiring immediate attention
3. **Security Vulnerabilities** with severity levels
4. **Performance Recommendations** with code examples
5. **Best Practice Suggestions** with TypeScript examples
6. **Test Coverage Analysis** with improvement suggestions

### **🔧 AI Configuration**

**Custom Configuration:** `.qodo/config.toml`
- Review focus areas and priorities
- Custom instructions for your codebase
- Security analysis depth
- Performance optimization triggers
- Test coverage requirements

**Workflow Configuration:** `.github/workflows/qodo-pr-review.yml`
- Triggers and conditions for AI reviews
- Required checks and dependencies
- Output formatting and presentation

### **💡 AI Benefits for Developers**

- **🚀 Faster Reviews**: Instant feedback instead of waiting for human review
- **🎯 Actionable Feedback**: Specific line references and code examples
- **🔒 Security First**: Automated vulnerability detection
- **📈 Quality Assurance**: Consistent standards across all PRs
- **🎓 Learning Tool**: Educational explanations of best practices
- **⚡ Continuous Improvement**: Ongoing codebase quality enhancement

## 📄 **License**

MIT License - see LICENSE file for details.

---

**Simple and clean development framework**

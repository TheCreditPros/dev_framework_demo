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

This framework includes **Qodo AI PR Agent** - a comprehensive open-source tool for automated, intelligent code reviews that provide detailed feedback directly in your pull requests.

### **🚀 Qodo PR Agent Features**

**Qodo PR Agent is open source and does not require an API token!** 🎉

**✨ Core Capabilities:**

- ✅ **Automated PR Analysis** - Instant reviews on every PR
- ✅ **Multiple AI Models** - GPT-5, GPT-4, GPT-3.5-turbo, Claude support
- ✅ **Comprehensive Code Review** - Quality, security, performance, testing
- ✅ **Interactive Commands** - Manual triggers for specific analyses
- ✅ **Custom Configuration** - Tailored to your project's needs
- ✅ **GitHub Integration** - Native workflow and comment support
- ✅ **Batch Processing** - Multiple analyses in sequence
- ✅ **Self-Reflection** - AI validates its own suggestions

### **📋 Available Qodo Commands**

#### **🤖 Primary Review Commands**

| Command             | Description                    | Use Case                  |
| ------------------- | ------------------------------ | ------------------------- |
| `/review`           | Comprehensive code review      | General PR analysis       |
| `/describe`         | Generate/update PR description | Improve documentation     |
| `/improve`          | Code improvement suggestions   | Enhancement opportunities |
| `/ask`              | Answer questions about code    | Clarify implementation    |
| `/update_changelog` | Auto-update CHANGELOG.md       | Release management        |
| `/add_docs`         | Documentation suggestions      | Missing docs              |

#### **🔍 Specialized Analysis Commands**

| Command               | Description                        | Focus Area               |
| --------------------- | ---------------------------------- | ------------------------ |
| `/security_review`    | Security vulnerability analysis    | Security issues          |
| `/performance_review` | Performance optimization analysis  | Speed & efficiency       |
| `/test_review`        | Test coverage and quality analysis | Testing adequacy         |
| `/similar_prs`        | Find similar historical PRs        | Context & patterns       |
| `/analyze`            | Deep code analysis                 | Comprehensive assessment |
| `/feedback`           | General feedback on changes        | Overall assessment       |
| `/checklist`          | Generate review checklist          | Structured review        |
| `/best_practices`     | Best practice recommendations      | Code standards           |

#### **🛠️ Utility Commands**

| Command                 | Description                | Purpose            |
| ----------------------- | -------------------------- | ------------------ |
| `/help`                 | Display available commands | Command reference  |
| `/analyze_dependencies` | Dependency analysis        | Package management |
| `/check_performance`    | Performance benchmarking   | Optimization       |
| `/security_audit`       | Security audit report      | Compliance         |

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

**Qodo PR is open source and uses GPT-5 for advanced AI analysis!** 🚀

**Setup Requirements:**

- ✅ **OpenAI API Key**: Configured at company level in GitHub secrets
- ✅ **GitHub Token**: Uses built-in `${{ secrets.GITHUB_TOKEN }}`
- ✅ **Automatic Execution**: Runs on every PR event
- ✅ **GPT-5 Power**: Advanced AI model for comprehensive analysis

**AI Capabilities:**

- ✅ **Repository-Wide Context Analysis** - Understands entire codebase functionality
- ✅ **Breakage Prevention Standards** - Ensures no breaking changes
- ✅ Analyzes entire codebase changes with GPT-5
- ✅ Posts detailed comments with specific line references
- ✅ Provides actionable improvement suggestions
- ✅ Includes security analysis and performance recommendations
- ✅ Generates code quality scores and improvement plans
- ✅ Uses most advanced AI model available (GPT-5 equivalent)

### **🎯 Repository Context & Breakage Prevention**

**Repository-Wide Context Analysis:**
- Analyzes the entire repository structure and codebase
- Understands the functions and purpose of existing code
- Reviews how new changes integrate with existing functionality
- Identifies potential conflicts with established patterns
- Considers the overall architecture and design principles

**Breakage Prevention Standards:**
- NEVER suggests changes that could break existing functionality
- Ensures backward compatibility is maintained
- Verifies API contracts and interfaces remain intact
- Checks for potential side effects on other components
- Validates that existing tests continue to pass
- Confirms no breaking changes to public APIs or interfaces

### **💬 AI Review Commands**

You can also trigger specific AI reviews manually by commenting on PRs:

```markdown
/review # General code review
/security-review # Security-focused analysis
/analyze # Deep code analysis
/improve # Specific improvement suggestions
/describe # PR description enhancement
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

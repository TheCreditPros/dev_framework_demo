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

## 📄 **License**

MIT License - see LICENSE file for details.

---

**Simple and clean development framework**

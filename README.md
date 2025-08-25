# AI-SDLC Framework Demo

**Version:** v3.2.2
**Framework:** AI-Powered SDLC for The Credit Pros
**Updated:** August 25, 2025

## 🚀 Quick Start

This repository demonstrates the complete AI-SDLC Framework implementation with **enterprise-grade CI/CD automation** and **graduated setup complexity levels**.

### 🎯 **NEW: Graduated Setup Complexity Levels**

Choose your setup complexity based on your team's needs:

#### **Quick Start (New Developers)**
```bash
./auto-setup-enhanced.sh --minimal
```
**Time**: 2-3 minutes | **Size**: 50MB | **Tools**: ESLint, Prettier, Husky, Vitest
Perfect for getting started quickly without complexity.

#### **Standard Setup (Most Teams)**
```bash
./auto-setup-enhanced.sh --standard
# or simply
./auto-setup-enhanced.sh
```
**Time**: 5-8 minutes | **Size**: 120MB | **Tools**: All minimal + Playwright, AI features, performance monitoring
Balanced setup with full development tools (default behavior).

#### **Enterprise Setup (Regulated Industries)**
```bash
./auto-setup-enhanced.sh --enterprise
```
**Time**: 10-15 minutes | **Size**: 200MB | **Tools**: All standard + security scanning, compliance tools, MCP integration
Full enterprise features plus compliance and security tools.

#### **Help & Validation**
```bash
./auto-setup-enhanced.sh --help     # Show all options
./auto-setup-enhanced.sh --version  # Show version info
./test-setup-levels.sh              # Run validation tests (7/7 tests)
```

### **Backward Compatibility**
Running without flags defaults to `--standard` (current behavior). Existing workflows remain unchanged.

## 🛠️ Complete Tool Stack

### Core Development Tools
- **ESLint v9+** - Modern flat config format (fixes parsing errors)
- **Prettier v3.6+** - Automated code formatting
- **Husky v9+** - Git hooks automation with modern initialization
- **lint-staged v16+** - Pre-commit linting and formatting
- **Commitlint** - Conventional commit message enforcement
- **TypeScript v5.9+** - Type safety and modern JavaScript features

### Testing & Quality Assurance
- **Vitest v3.2+** - Fast unit testing with coverage reporting
- **Playwright v1.54+** - Cross-browser E2E testing automation
- **@testing-library/react v16+** - React component testing utilities
- **@testing-library/jest-dom** - Custom Jest matchers for DOM testing
- **playwright-qase-reporter** - AI-powered test reporting and analytics
- **jsdom** - DOM simulation for unit tests

### 🚀 NEW: API Quality Gate Validation
- **API Documentation Validator** - OpenAPI 3.0+ specification validation
- **API Error Validator** - Standardized error response format validation
- **API Contract Tester** - Frontend-backend contract testing with schema validation
- **API Process Analyzer** - Multi-step process identification and documentation
- **Swagger/OpenAPI Integration** - Complete API specification validation
- **FCRA Compliance Validation** - Credit repair domain API compliance checking

### Recent Improvements (v3.2.2)
- ✅ **🔧 CRITICAL FIX: Test Infrastructure** - Resolved API validator test mocking issues
- ✅ **🔧 Dependency Injection Pattern** - Enhanced testability for all API validators
- ✅ **🔧 ES Module/CommonJS Compatibility** - Fixed Vitest mocking with CommonJS modules
- ✅ **🔧 Test Success Rate** - Improved from 0/29 to 18/29 tests passing (62% success)
- ✅ **🔧 Repository Cleanup** - Removed generated reports and cache files
- ✅ **🎯 NEW: Graduated Setup Complexity** - Three setup levels (minimal, standard, enterprise)
- ✅ **🎯 NEW: Production-Ready Setup Script** - Enhanced error handling and validation
- ✅ **🎯 NEW: Comprehensive Test Suite** - 7/7 validation tests passing
- ✅ **🎯 NEW: Resource Transparency** - Clear disk space, time, and API call requirements
- ✅ **🎯 NEW: Escape Hatches** - Skip specific features with flags (--skip-security, --skip-ai, etc.)
- ✅ **🎯 NEW: Conditional Features** - AI features only install if OPENAI_API_KEY is set
- ✅ **🎯 NEW: Enhanced Security** - Input validation, secure temporary directories, backup mechanisms
- ✅ **Removed package-lock.json** - Allows flexible dependency resolution
- ✅ **Added `./ai-sdlc explain` command** - Enhanced local developer guidance
- ✅ **Enhanced validation feedback** - More detailed error explanations
- ✅ **Improved troubleshooting** - Context-aware help system
- ✅ **🚀 Complete CI/CD Pipeline** - Enterprise-grade automation with quality gates
- ✅ **🚀 Dependabot Integration** - Automated dependency management
- ✅ **🚀 CODEOWNERS Automation** - Intelligent code review assignments
- ✅ **🚀 Performance Monitoring** - Lighthouse CI with budget enforcement
- ✅ **🚀 Security Automation** - Daily scans with compliance validation

---

**Maintained by:** Damon DeCrescenzo, CTO - The Credit Pros
**Enterprise Support:** Available for The Credit Pros development teams
**License:** MIT - Open source with enterprise features
**Security:** GitGuardian + SonarCloud + Multi-layer protection + CI/CD automation
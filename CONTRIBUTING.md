# Contributing to AI-SDLC Framework

Thank you for your interest in contributing to the AI-SDLC Framework! This guide will help you get started.

## 🚀 Quick Start

1. **Fork and Clone**

   ```bash
   git clone https://github.com/TheCreditPros/dev_framework_demo.git
   cd dev_framework_demo
   ```

2. **Install Dependencies**

   ```bash
   npm ci
   ```

3. **Run Quality Gates**
   ```bash
   npm run quality-gates
   ```

## 📋 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Follow the existing code style
- Add tests for new functionality
- Update documentation as needed

### 3. Run Local Quality Gates

```bash
npm run quality-gates
```

This runs:

- ✅ Linting (ESLint)
- ✅ Formatting (Prettier)
- ✅ Type checking (TypeScript)
- ✅ Unit tests (Vitest)
- ✅ Build verification

### 4. Commit with Conventional Commits

```bash
git commit -m "feat: add new feature"
```

**Commit Types:**

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Maintenance tasks

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

## 🤖 AI-Powered Review Process

When you create a PR, our AI systems will automatically:

1. **🔍 AI Code Review** - Qodo PR-Agent will analyze your code
2. **🏗️ Quality Gates** - CI/CD pipeline runs all checks
3. **📊 SonarCloud Analysis** - Code quality and security scan
4. **🔒 Security Review** - Automated security validation

### AI Commands in PRs

You can use these commands in PR comments:

- `/review` - Request comprehensive AI review
- `/describe` - Generate/update PR description
- `/improve` - Get code improvement suggestions
- `/security-review` - Focus on security analysis
- `/compliance-review` - FCRA compliance validation

## 🏗️ Code Standards

### TypeScript/JavaScript

- Use TypeScript for new files
- Follow ESLint configuration
- Use double quotes for strings
- 2-space indentation

### Testing

- Write tests for all new functionality
- Use Vitest for unit tests
- Use Playwright for E2E tests
- Maintain 80%+ test coverage

### FCRA Compliance (Credit Repair Domain)

When working with credit-related features:

- ✅ **Permissible Purpose** - Validate FCRA Section 604 compliance
- ✅ **PII Protection** - Encrypt/mask sensitive data (SSN, DOB)
- ✅ **Audit Trail** - Log all credit-related operations
- ✅ **Error Handling** - No internal details in user-facing errors
- ✅ **Score Validation** - Enforce 300-850 FICO range

## 📁 Project Structure

```
├── .github/           # GitHub workflows and templates
├── src/              # Source code
│   ├── components/   # React components
│   └── utils/       # Utility functions
├── tests/            # Test files
│   ├── unit/        # Unit tests
│   ├── integration/ # Integration tests
│   └── e2e/         # End-to-end tests
├── scripts/          # Build and utility scripts
└── docs/            # Documentation
```

## 🔧 Available Scripts

| Command                 | Description              |
| ----------------------- | ------------------------ |
| `npm run dev`           | Start development server |
| `npm run build`         | Build for production     |
| `npm run test`          | Run unit tests           |
| `npm run test:coverage` | Generate coverage report |
| `npm run lint`          | Run linting              |
| `npm run lint:fix`      | Auto-fix lint issues     |
| `npm run format`        | Check formatting         |
| `npm run format:fix`    | Auto-fix formatting      |
| `npm run quality-gates` | Run all quality checks   |

## 🐛 Bug Reports

When reporting bugs:

1. **Search existing issues** first
2. **Use the issue template**
3. **Provide minimal reproduction**
4. **Include system information**
5. **Add relevant logs/screenshots**

## 💡 Feature Requests

When requesting features:

1. **Check if it already exists**
2. **Explain the use case**
3. **Provide examples**
4. **Consider implementation complexity**

## 📚 Documentation

- Update README for user-facing changes
- Add JSDoc comments for public APIs
- Update CHANGELOG.md following conventional format
- Include examples in documentation

## 🔒 Security

- Never commit secrets or API keys
- Follow OWASP security practices
- Report security issues privately to maintainers
- All security changes require thorough review

## 🤝 Code Review

- Reviews focus on correctness, security, and maintainability
- AI reviews happen automatically
- Human reviews for significant changes
- Address feedback constructively

## 🎯 Quality Standards

All contributions must pass:

- ✅ All automated tests
- ✅ Code coverage requirements
- ✅ Linting and formatting
- ✅ Security scans
- ✅ Performance benchmarks (if applicable)
- ✅ AI-powered code review

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🆘 Getting Help

- Check the [documentation](docs/)
- Search existing [issues](https://github.com/TheCreditPros/dev_framework_demo/issues)
- Create a new issue with the question template
- Join our discussions

---

**Thank you for contributing to the AI-SDLC Framework!** 🚀

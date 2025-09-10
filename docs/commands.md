# 🛠️ Commands Reference

## Development Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run test:ci          # Run tests for CI
npm run test:e2e         # Run E2E tests
```

## Quality Assurance

```bash
npm run quality-gates    # Run all quality checks
npm run lint             # Check code style
npm run lint:ci          # Check code style (CI mode)
npm run lint:fix         # Auto-fix code style
npm run format           # Check formatting
npm run format:fix       # Auto-fix formatting
npm run type-check       # TypeScript validation
```

## Framework Management

```bash
./scripts/bootstrap.sh           # Setup development environment
./scripts/teardown.sh            # Clean uninstall
./install-framework-smart.sh     # Install framework in other projects
node validate-setup.js           # Validate configuration
npm run framework:validate       # Validate setup
npm run framework:setup          # Setup framework
```

## AI Features

```bash
npm run ai:setup                 # Setup AI features
npm run ai:quality-check         # Run AI quality checks
npm run ai:test-generate         # Generate AI tests
npm run ai:auto-heal             # Run auto-healing
npm run ai:apply-heal            # Apply healing learnings
npm run ai:analyze               # Analyze API processes
```

## PR Agent Commands

Use in PR comments:

- `/review` - Comprehensive code review
- `/describe` - Generate PR description
- `/improve` - Code improvement suggestions
- `/security-review` - Security analysis
- `/analyze` - Deep code analysis
- `/update-changelog` - Update changelog
- `/add-docs` - Add documentation

## CI/CD Commands

```bash
npm run ci:test-fast             # Fast CI test
npm run ci:security              # Security checks
npm run ci:compliance            # Compliance checks
npm run ci:full                  # Full CI suite
```

## Utility Scripts

```bash
./scripts/local-quality-gates.sh # Local quality gates
./scripts/github-actions-monitor.js # Monitor GitHub Actions
./scripts/deployment-validation-loop.js # Deployment validation
```

---

_See [Main README](../README.md) for quick command overview_

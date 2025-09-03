# SonarCloud Setup - Main Branch Only

## Overview

SonarCloud analysis runs **only on the main branch** to provide comprehensive code quality insights without blocking development workflow.

## Features

- ✅ **Main branch only** - No development friction
- ✅ **Comprehensive analysis** - Code quality, security, reliability
- ✅ **Coverage reporting** - Test coverage integration
- ✅ **Non-blocking** - Doesn't prevent PR merges
- ✅ **Manual trigger** - Can be run on-demand

## Setup Requirements

### 1. SonarCloud Account

1. Go to [SonarCloud.io](https://sonarcloud.io)
2. Sign in with GitHub
3. Create organization: `thecreditpros`
4. Create project: `TheCreditPros_dev_framework_demo`

### 2. GitHub Secrets

Add these secrets to your GitHub repository:

```bash
# SonarCloud token (from SonarCloud project settings)
SONAR_TOKEN=your_sonarcloud_token_here
```

### 3. Project Configuration

The following files are already configured:

- `.github/workflows/sonarcloud-main-only.yml` - Workflow definition
- `sonar-project.properties` - SonarCloud configuration
- `package.json` - Coverage scripts

## How It Works

### Trigger Conditions

- **Automatic**: Pushes to `main` branch
- **Manual**: Workflow dispatch (on-demand)

### Analysis Process

1. **Checkout** repository with full history
2. **Setup** Node.js and install dependencies
3. **Run tests** with coverage collection
4. **Generate** LCOV coverage report
5. **Execute** SonarCloud analysis
6. **Upload** coverage artifacts

### Quality Gates

- **Security hotspots** - Critical security issues
- **Reliability** - Bug detection and prevention
- **Maintainability** - Code quality and technical debt
- **Coverage** - Test coverage thresholds

## Best Practices Applied

### 1. Minimum Friction

- **Non-blocking** - Doesn't prevent PR merges
- **Main branch only** - No development workflow impact
- **Fast execution** - Optimized configuration

### 2. Comprehensive Coverage

- **Source code** - All TypeScript/JavaScript files
- **Test coverage** - LCOV format integration
- **Exclusions** - Focus on source, exclude generated files

### 3. Performance Optimized

- **Shallow clone disabled** - Better analysis accuracy
- **Caching** - npm dependencies cached
- **Timeout** - 5-minute quality gate timeout

## Configuration Details

### Exclusions

```properties
# Exclude generated and test files
sonar.exclusions=**/node_modules/**,**/dist/**,**/build/**,**/coverage/**
sonar.coverage.exclusions=**/*.test.js,**/*.test.ts,**/*.spec.js,**/*.spec.ts
```

### Coverage Integration

```properties
# LCOV coverage reports
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.typescript.lcov.reportPaths=coverage/lcov.info
```

## Usage

### Automatic Analysis

SonarCloud runs automatically on every push to main branch.

### Manual Analysis

```bash
# Trigger manually via GitHub Actions
gh workflow run "SonarCloud Analysis (Main Only)"
```

### Local Coverage Testing

```bash
# Test coverage generation locally
npm run test:coverage:sonar
```

## Benefits

### 1. Code Quality

- **Technical debt** identification
- **Code smells** detection
- **Best practices** enforcement

### 2. Security

- **Vulnerability** scanning
- **Security hotspots** identification
- **OWASP** compliance checking

### 3. Reliability

- **Bug prevention** through static analysis
- **Error handling** validation
- **Resource leak** detection

### 4. Maintainability

- **Code complexity** analysis
- **Duplication** detection
- **Documentation** coverage

## Monitoring

### SonarCloud Dashboard

- View results at: `https://sonarcloud.io/project/overview?id=TheCreditPros_dev_framework_demo`
- Track quality trends over time
- Monitor technical debt evolution

### GitHub Integration

- **PR comments** (when applicable)
- **Quality gate** status
- **Coverage** reports

## Troubleshooting

### Common Issues

1. **Missing SONAR_TOKEN** - Add to GitHub secrets
2. **Coverage not found** - Ensure tests run successfully
3. **Quality gate timeout** - Increase timeout in workflow

### Support

- Check SonarCloud documentation
- Review workflow logs in GitHub Actions
- Verify project configuration in SonarCloud dashboard

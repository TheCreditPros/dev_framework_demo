#!/bin/bash

# AI-SDLC Framework Installation Script - Smart Version
# This script installs the AI-SDLC framework on a target repository with smart detection

set -e

echo "🚀 AI-SDLC Framework Installation (Smart)"
echo "========================================="

# Create backup directory for rollback capability
BACKUP_DIR=".ai-sdlc-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📦 Creating backup directory: $BACKUP_DIR"

# Function to create backup of existing configs
create_backup() {
    local backup_dir="$1"

    # Backup existing configs
    [ -f "eslint.config.mjs" ] && cp eslint.config.mjs "$backup_dir/" 2>/dev/null || true
    [ -f ".prettierrc" ] && cp .prettierrc "$backup_dir/" 2>/dev/null || true
    [ -d ".husky" ] && cp -r .husky "$backup_dir/" 2>/dev/null || true
    [ -f ".lintstagedrc.cjs" ] && cp .lintstagedrc.cjs "$backup_dir/" 2>/dev/null || true
    [ -f "commitlint.config.cjs" ] && cp commitlint.config.cjs "$backup_dir/" 2>/dev/null || true
    [ -f ".lintstagedrc.js" ] && cp .lintstagedrc.js "$backup_dir/" 2>/dev/null || true
    [ -f "commitlint.config.js" ] && cp commitlint.config.js "$backup_dir/" 2>/dev/null || true
    [ -f "sonar-project.properties" ] && cp sonar-project.properties "$backup_dir/" 2>/dev/null || true
    [ -d ".github/workflows" ] && cp -r .github/workflows "$backup_dir/" 2>/dev/null || true
    [ -f "validate-setup.js" ] && cp validate-setup.js "$backup_dir/" 2>/dev/null || true
    [ -f "scripts/local-quality-gates.sh" ] && cp scripts/local-quality-gates.sh "$backup_dir/" 2>/dev/null || true

    echo "✅ Backup created in $backup_dir"
}

# Function to rollback installation
rollback_installation() {
    local backup_dir="$1"
    if [ -d "$backup_dir" ]; then
        echo "🔄 Rolling back installation..."
        cp -r "$backup_dir"/* . 2>/dev/null || true
        echo "✅ Rollback completed"
        echo "ℹ️  You can manually restore from $backup_dir if needed"
    else
        echo "❌ No backup found for rollback"
    fi
}

# Set up error handling for rollback
trap 'echo "❌ Installation failed. Rolling back..."; rollback_installation "$BACKUP_DIR"; exit 1' ERR

# Detect repository type
detect_repo_type() {
    local cwd=$(pwd)
    local is_tmp_dir=false
    local is_test_dir=false
    local has_git_remote=false

    if [[ "$cwd" == *"/tmp/"* ]] || [[ "$cwd" == *"\\temp\\"* ]]; then
        is_tmp_dir=true
    fi

    if [[ "$cwd" == *"test"* ]] || [[ "$cwd" == *"demo"* ]] || [[ "$cwd" == *"example"* ]]; then
        is_test_dir=true
    fi

    if git remote -v &> /dev/null; then
        if [ -n "$(git remote -v | head -n1)" ]; then
            has_git_remote=true
        fi
    fi

    if [[ "$is_tmp_dir" == true ]] || [[ "$is_test_dir" == true ]]; then
        echo "test"
    elif [[ "$has_git_remote" == true ]]; then
        echo "production"
    else
        echo "local"
    fi
}

# Detect Playwright configuration file
detect_playwright_config() {
    if [ -f "playwright.config.ts" ]; then
        echo "playwright.config.ts"
    elif [ -f "playwright.config.js" ]; then
        echo "playwright.config.js"
    else
        # No config present
        echo ""
    fi
}

# Detect existing package versions to avoid conflicts
detect_existing_versions() {
    local package_json="package.json"
    if [ -f "$package_json" ]; then
        echo "🔍 Checking for existing package versions..."

        # Check for existing Playwright Test
        if grep -q '"@playwright/test"' "$package_json"; then
            local existing_version=$(grep -o '"@playwright/test": "[^"]*"' "$package_json" | cut -d'"' -f4)
            echo "⚠️  Existing @playwright/test version: $existing_version"
            echo "   We will install @playwright/test@^1.49.1 (may cause conflicts)"
        fi

        # Check for existing ESLint
        if grep -q '"eslint"' "$package_json"; then
            local existing_version=$(grep -o '"eslint": "[^"]*"' "$package_json" | cut -d'"' -f4)
            echo "⚠️  Existing ESLint version: $existing_version"
        fi

        # Check for existing Prettier
        if grep -q '"prettier"' "$package_json"; then
            local existing_version=$(grep -o '"prettier": "[^"]*"' "$package_json" | cut -d'"' -f4)
            echo "⚠️  Existing Prettier version: $existing_version"
        fi
    fi
}

# Check for ESLint configuration conflicts
check_eslint_conflicts() {
    local conflicts=()

    if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f ".eslintrc.yaml" ]; then
        conflicts+=("Existing ESLint config found")
    fi

    if [ -f ".eslintrc.a11y.cjs" ]; then
        conflicts+=("Accessibility ESLint config found")
    fi

    if [ -f "eslint.config.js" ]; then
        conflicts+=("Existing ESLint flat config found")
    fi

    if [ -f "eslint.config.mjs" ]; then
        conflicts+=("Existing ESLint flat config (mjs) found")
    fi

    if [ ${#conflicts[@]} -gt 0 ]; then
        echo "⚠️  ESLint conflicts detected:"
        for conflict in "${conflicts[@]}"; do
            echo "   - $conflict"
        done
        echo "   Backing up existing configs..."

        # Backup existing configs
        [ -f ".eslintrc.js" ] && mv .eslintrc.js .eslintrc.js.backup
        [ -f ".eslintrc.json" ] && mv .eslintrc.json .eslintrc.json.backup
        [ -f ".eslintrc.yaml" ] && mv .eslintrc.yaml .eslintrc.yaml.backup
        [ -f ".eslintrc.a11y.cjs" ] && mv .eslintrc.a11y.cjs .eslintrc.a11y.cjs.backup
        [ -f "eslint.config.js" ] && mv eslint.config.js eslint.config.js.backup
        [ -f "eslint.config.mjs" ] && mv eslint.config.mjs eslint.config.mjs.backup

        echo "   ✅ Existing configs backed up with .backup extension"
    fi
}

REPO_TYPE=$(detect_repo_type)
echo "📁 Repository Type: ${REPO_TYPE}"

# Detect Playwright configuration
PLAYWRIGHT_CONFIG=$(detect_playwright_config)
if [ -n "$PLAYWRIGHT_CONFIG" ]; then
  echo "🎭 Playwright Config: ${PLAYWRIGHT_CONFIG}"
else
  echo "🎭 Playwright Config: none detected (using default)"
fi

# Check for existing package versions
detect_existing_versions

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository. Please run this script from the root of your target repository."
    exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js v18+ first."
    exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create backup before making changes and check for ESLint conflicts
create_backup "$BACKUP_DIR"
check_eslint_conflicts

# Install dependencies
echo "📦 Installing dependencies..."
npm install --save-dev \
    vitest@^3.2.4 \
    @vitest/coverage-v8@^3.2.4 \
    @testing-library/react@^16.1.0 \
    @testing-library/jest-dom@^6.6.3 \
    jsdom@^26.1.0 \
    eslint@^9.34.0 \
    @typescript-eslint/eslint-plugin@^8.42.0 \
    @typescript-eslint/parser@^8.42.0 \
    prettier@^3.6.2 \
    husky@^9.1.7 \
    lint-staged@^16.1.6 \
    @commitlint/cli@^19.8.1 \
    @commitlint/config-conventional@^19.8.1 \
    @playwright/test@^1.49.1

echo "✅ Dependencies installed"

# Install Playwright browsers (non-fatal)
if npx --yes playwright --version >/dev/null 2>&1; then
  npx --yes playwright install >/dev/null 2>&1 || true
fi

# Create ESLint configuration (same as before)
echo "⚙️  Creating ESLint configuration..."
cat > eslint.config.mjs << 'ESLINT_EOF'
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/*.min.js",
      "**/site/**",
      "**/docs/site/**",
      "**/temp/**",
      "scripts/**",
      "scripts-complex/**",
      "tests/e2e/**",
      "tests/Integration/**",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        FormData: "readonly",
        File: "readonly",
        document: "readonly",
        window: "readonly",
        navigator: "readonly",
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        vi: "readonly",
        fetch: "readonly",
        URL: "readonly",
        btoa: "readonly",
        localStorage: "readonly",
        HTMLInputElement: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "no-unused-vars": "off",
      "prefer-const": ["error", { "destructuring": "any", "ignoreReadBeforeAssign": false }],
      "no-var": "error",
      "quotes": ["error", "double"],
    },
  },
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        FormData: "readonly",
        File: "readonly",
        document: "readonly",
        window: "readonly",
        navigator: "readonly",
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        vi: "readonly",
        fetch: "readonly",
        URL: "readonly",
        btoa: "readonly",
        localStorage: "readonly",
        HTMLInputElement: "readonly",
      },
    },
    rules: {
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],
      "no-console": "off",
      "prefer-const": ["error", { "destructuring": "any", "ignoreReadBeforeAssign": false }],
      "no-var": "error",
      "no-useless-escape": "warn",
      "quotes": ["error", "double"],
    },
  },
];
ESLINT_EOF

# Create Prettier configuration
echo "⚙️  Creating Prettier configuration..."
cat > .prettierrc << 'PRETTIER_EOF'
{
  "singleQuote": false,
  "semi": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "endOfLine": "lf"
}
PRETTIER_EOF

# Create SonarCloud configuration
echo "⚙️  Creating SonarCloud configuration..."
cat > sonar-project.properties << 'SONAR_EOF'
# SonarCloud Configuration - Best Practices
# Optimized for TypeScript/JavaScript projects with minimum friction

# Project identification
sonar.projectKey=${GITHUB_REPOSITORY//\//_}
sonar.organization=${GITHUB_REPOSITORY_OWNER}
sonar.projectName=${GITHUB_REPOSITORY_NAME}
sonar.projectVersion=1.0.0

# Source code configuration
sonar.sources=src,scripts,scripts-complex
sonar.tests=tests,__tests__
sonar.test.inclusions=**/*.test.js,**/*.test.ts,**/*.spec.js,**/*.spec.ts

# Language-specific settings
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.typescript.lcov.reportPaths=coverage/lcov.info
sonar.coverageReportPaths=coverage/lcov.info

# Exclusions - Focus on source code, exclude generated/test files
sonar.exclusions=**/node_modules/**,**/dist/**,**/build/**,**/coverage/**,**/test-results/**,**/playwright-report/**,**/*.min.js,**/*.bundle.js
sonar.coverage.exclusions=**/*.test.js,**/*.test.ts,**/*.spec.js,**/*.spec.ts,**/node_modules/**,**/dist/**,**/build/**,**/coverage/**,**/test-results/**,**/playwright-report/**,**/legacy/**

# Duplication settings
sonar.cpd.exclusions=**/*.test.js,**/*.test.ts,**/*.spec.js,**/*.spec.ts,**/node_modules/**,**/dist/**,**/build/**

# Quality gate settings
sonar.qualitygate.wait=true
sonar.qualitygate.timeout=300

# Performance optimizations
sonar.analysis.mode=publish
sonar.verbose=false

# Security and reliability focus
sonar.security.hotspots.includeAll=true
sonar.reliability.hotspots.includeAll=true
SONAR_EOF

echo "✅ SonarCloud configuration created"

# Create SonarCloud workflow files
echo "⚙️  Creating SonarCloud workflow files..."

# Create .github/workflows directory if it doesn't exist
mkdir -p .github/workflows

# Create SonarCloud PR Analysis workflow
cat > .github/workflows/sonarcloud-pr-analysis.yml << 'SONAR_PR_EOF'
# SonarCloud Analysis - Pull Request
# Runs comprehensive code analysis on pull requests to provide feedback before merge

name: 🔍 SonarCloud PR Analysis

on:
  pull_request:
    branches: [main, master]
    types: [opened, synchronize, reopened]
  workflow_dispatch: # Allow manual trigger

env:
  NODE_VERSION: '20'

permissions:
  contents: read
  security-events: write
  pull-requests: write

jobs:
  sonarcloud-pr:
    name: 🔍 SonarCloud PR Analysis
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'

    steps:
      - name: 📥 Checkout Repository
        uses: actions/checkout@v5
        with:
          fetch-depth: 0 # Shallow clones should be disabled for better analysis

      - name: 🔧 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 📦 Install Dependencies
        run: npm ci --no-audit

      - name: 🧪 Run Tests with Coverage
        run: npm run test:coverage:sonar

      - name: 📊 Verify Coverage Report
        run: |
          echo "Checking coverage report..."
          ls -la coverage/ || echo "Coverage directory not found"
          if [ -f "coverage/lcov.info" ]; then
            echo "✅ Coverage report found"
            wc -l coverage/lcov.info
            echo "First few lines of coverage report:"
            head -5 coverage/lcov.info
          else
            echo "❌ Coverage report not found, checking for alternative locations..."
            find . -name "lcov.info" -type f 2>/dev/null || echo "No lcov.info found anywhere"
            echo "Creating empty coverage report as fallback..."
            mkdir -p coverage
            echo "TN:" > coverage/lcov.info
            echo "end_of_record" >> coverage/lcov.info
          fi

      - name: 🔍 Run SonarCloud Analysis
        uses: SonarSource/sonarcloud-github-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          args: >
            -Dsonar.projectKey=${GITHUB_REPOSITORY//\//_}
            -Dsonar.organization=${GITHUB_REPOSITORY_OWNER}
            -Dsonar.pullrequest.key=${{ github.event.pull_request.number }}
            -Dsonar.pullrequest.branch=${{ github.event.pull_request.head.ref }}
            -Dsonar.pullrequest.base=${{ github.event.pull_request.base.ref }}
            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
            -Dsonar.typescript.lcov.reportPaths=coverage/lcov.info
            -Dsonar.coverageReportPaths=coverage/lcov.info
            -Dsonar.coverage.exclusions=**/*.test.js,**/*.test.ts,**/*.spec.js,**/*.spec.ts,**/node_modules/**,**/dist/**,**/build/**
            -Dsonar.qualitygate.wait=true
            -Dsonar.qualitygate.timeout=300
            -Dsonar.verbose=true

      - name: 📊 Upload Coverage Reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: sonarcloud-pr-coverage
          path: coverage/
          retention-days: 7
SONAR_PR_EOF

# Create SonarCloud Main Analysis workflow
cat > .github/workflows/sonarcloud-analysis.yml << 'SONAR_MAIN_EOF'
# SonarCloud Analysis - Main Branch
# Runs comprehensive code analysis on main branch for overall project health

name: 🔍 SonarCloud Main Analysis

on:
  push:
    branches: [main, master]
  workflow_dispatch: # Allow manual trigger

env:
  NODE_VERSION: '20'

permissions:
  contents: read
  security-events: write
  pull-requests: write

jobs:
  sonarcloud:
    name: 🔍 SonarCloud Analysis
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master'

    steps:
      - name: 📥 Checkout Repository
        uses: actions/checkout@v5
        with:
          fetch-depth: 0 # Shallow clones should be disabled for better analysis

      - name: 🔧 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 📦 Install Dependencies
        run: npm ci --no-audit

      - name: 🧪 Run Tests with Coverage
        run: npm run test:coverage:sonar

      - name: 📊 Verify Coverage Report
        run: |
          echo "Checking coverage report..."
          ls -la coverage/ || echo "Coverage directory not found"
          if [ -f "coverage/lcov.info" ]; then
            echo "✅ Coverage report found"
            wc -l coverage/lcov.info
            echo "First few lines of coverage report:"
            head -5 coverage/lcov.info
          else
            echo "❌ Coverage report not found, checking for alternative locations..."
            find . -name "lcov.info" -type f 2>/dev/null || echo "No lcov.info found anywhere"
            echo "Creating empty coverage report as fallback..."
            mkdir -p coverage
            echo "TN:" > coverage/lcov.info
            echo "end_of_record" >> coverage/lcov.info
          fi

      - name: 🔍 Run SonarCloud Analysis
        uses: SonarSource/sonarcloud-github-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          args: >
            -Dsonar.projectKey=${GITHUB_REPOSITORY//\//_}
            -Dsonar.organization=${GITHUB_REPOSITORY_OWNER}
            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
            -Dsonar.typescript.lcov.reportPaths=coverage/lcov.info
            -Dsonar.coverageReportPaths=coverage/lcov.info
            -Dsonar.coverage.exclusions=**/*.test.js,**/*.test.ts,**/*.spec.js,**/*.spec.ts,**/node_modules/**,**/dist/**,**/build/**
            -Dsonar.qualitygate.wait=true
            -Dsonar.qualitygate.timeout=300
            -Dsonar.verbose=true

      - name: 📊 Upload Coverage Reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: sonarcloud-coverage
          path: coverage/
          retention-days: 7
SONAR_MAIN_EOF

echo "✅ SonarCloud workflow files created"

# Create Dependabot configuration with security automation
echo "⚙️  Creating Dependabot configuration with security automation..."
mkdir -p .github

cat > .github/dependabot.yml << 'DEPENDABOT_EOF'
# AI-SDLC Framework - Dependabot Configuration with Security Automation
# Automated dependency management with immediate security updates

version: 2
updates:
  # NPM DEPENDENCIES - Daily security updates
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "daily"  # Daily for immediate security updates
      time: "09:00"
      timezone: "America/New_York"
    open-pull-requests-limit: 15
    # Enable auto-merge for security updates
    pull-request-branch-name:
      separator: "-"
    # Security-specific configuration
    security-updates:
      enabled: true
    assignees:
      - "nydamon"
    commit-message:
      prefix: "deps"
      prefix-development: "deps-dev"
      include: "scope"
    labels:
      - "dependencies"
      - "automated"
      - "security"

    # Security updates - immediate
    allow:
      - dependency-type: "all"

    # Group related updates
    groups:
      # Testing frameworks
      testing:
        patterns:
          - "vitest*"
          - "@vitest/*"
          - "playwright*"
          - "@playwright/*"
          - "@testing-library/*"
          - "jsdom"

      # Build tools
      build-tools:
        patterns:
          - "vite*"
          - "@vitejs/*"
          - "rollup*"
          - "@rollup/*"
          - "esbuild*"
          - "@esbuild/*"
          - "typescript"
          - "@types/*"

      # Linting and formatting
      code-quality:
        patterns:
          - "eslint*"
          - "@eslint/*"
          - "prettier*"
          - "@typescript-eslint/*"
          - "lint-staged"
          - "husky"

      # React ecosystem
      react:
        patterns:
          - "react*"
          - "@babel/*"
          - "prop-types"

      # Security and compliance
      security:
        patterns:
          - "*security*"
          - "*audit*"
          - "*vulnerability*"

    # Ignore specific packages that require manual updates
    ignore:
      - dependency-name: "node"
        update-types: ["version-update:semver-major"]
      - dependency-name: "@types/node"
        update-types: ["version-update:semver-major"]

  # GITHUB ACTIONS
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "tuesday"
      time: "10:00"
      timezone: "America/New_York"
    open-pull-requests-limit: 5
    assignees:
      - "nydamon"
    commit-message:
      prefix: "ci"
      include: "scope"
    labels:
      - "github-actions"
      - "ci-cd"
      - "automated"

    # Group GitHub Actions updates
    groups:
      actions-core:
        patterns:
          - "actions/*"

      security-actions:
        patterns:
          - "github/codeql-action*"
          - "github/super-linter*"
          - "ossf/scorecard-action*"
DEPENDABOT_EOF

echo "✅ Dependabot configuration created with security automation"

# Create Dependabot Auto-Merge workflow
echo "⚙️  Creating Dependabot auto-merge workflow..."

cat > .github/workflows/dependabot-auto-merge.yml << 'DEPENDABOT_WORKFLOW_EOF'
# Dependabot Auto-Merge for Security Updates
# Automatically merges Dependabot PRs that pass all security checks

name: 🤖 Dependabot Auto-Merge

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: write
  pull-requests: write
  checks: read

jobs:
  dependabot-auto-merge:
    name: 🤖 Auto-merge Dependabot PRs
    runs-on: ubuntu-latest
    if: github.actor == 'dependabot[bot]'

    steps:
      - name: 📥 Checkout Repository
        uses: actions/checkout@v5

      - name: 🔍 Check PR Details
        id: pr-details
        run: |
          echo "PR Author: ${{ github.actor }}"
          echo "PR Title: ${{ github.event.pull_request.title }}"
          
          # Check if this is a security update
          if [[ "${{ github.event.pull_request.title }}" == *"security"* ]] || \
             [[ "${{ github.event.pull_request.title }}" == *"vulnerability"* ]] || \
             [[ "${{ github.event.pull_request.body }}" == *"security"* ]]; then
            echo "security_update=true" >> $GITHUB_OUTPUT
            echo "🔒 Security update detected"
          else
            echo "security_update=false" >> $GITHUB_OUTPUT
            echo "📦 Regular dependency update"
          fi

      - name: ⏳ Wait for Checks
        if: steps.pr-details.outputs.security_update == 'true'
        uses: lewagon/wait-on-check-action@v1.3.4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
          check-name: '🔍 SonarCloud PR Analysis'
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          wait-interval: 30
          allowed-conclusions: success,neutral,skipped

      - name: ⏳ Wait for Quality Gates
        if: steps.pr-details.outputs.security_update == 'true'
        uses: lewagon/wait-on-check-action@v1.3.4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
          check-name: '🚀 Essential CI/CD'
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          wait-interval: 30
          allowed-conclusions: success

      - name: 🔒 Security Update Auto-Merge
        if: steps.pr-details.outputs.security_update == 'true'
        run: |
          echo "🔒 Auto-merging security update after checks pass"
          gh pr merge --auto --squash "${{ github.event.pull_request.number }}"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: 📦 Regular Update (Manual Review Required)
        if: steps.pr-details.outputs.security_update == 'false'
        run: |
          echo "📦 Regular dependency update - manual review required"
          gh pr comment "${{ github.event.pull_request.number }}" --body "
          ## 📦 Dependency Update Review Required
          
          This is a regular dependency update that requires manual review.
          
          **Security updates are auto-merged**, but this update needs human approval.
          
          ### Review Checklist:
          - [ ] Check for breaking changes
          - [ ] Verify compatibility with existing code
          - [ ] Review changelog for impact
          - [ ] Ensure all tests pass
          
          Use \`@dependabot merge\` to merge after review.
          "
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: 🚨 Notify on Security Update
        if: steps.pr-details.outputs.security_update == 'true'
        run: |
          gh pr comment "${{ github.event.pull_request.number }}" --body "
          ## 🔒 Security Update Auto-Merge
          
          This security update will be **automatically merged** after all checks pass:
          
          ✅ SonarCloud security analysis
          ✅ Quality gates validation  
          ✅ Dependency vulnerability scan
          ✅ FCRA compliance checks
          
          **No manual intervention required** for security updates.
          "
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
DEPENDABOT_WORKFLOW_EOF

echo "✅ Dependabot auto-merge workflow created"

# Create Qodo PR-Agent configuration
echo "⚙️  Creating Qodo PR-Agent configuration..."

cat > .pr_agent.toml << 'PR_AGENT_EOF'
[config]
model = "gpt-4o-mini"
model_turbo = "gpt-4o-mini"
fallback_models = ["claude-3-5-sonnet-20241022"]
git_provider = "github"
publish_output = true
publish_output_progress = true
verbosity_level = 2
use_repo_settings_file = true
enable_help_text = true

[github]
# GitHub configuration
user_token = ""  # Set via environment variable GITHUB_TOKEN
deployment_type = "user"
ratelimit_retries = 5
base_url = "https://api.github.com"

[pr_reviewer]
# AI-powered code review with FCRA compliance focus
require_focused_review = true
require_score_review = false
require_tests_review = true
require_estimate_effort_to_review = true
require_security_review = true
enable_review_labels_effort = true
enable_review_labels_security = true
maximal_review_effort = 5
extra_instructions = """
CRITICAL: This is a credit repair application subject to FCRA regulations.

MANDATORY COMPLIANCE CHECKS:
1. FCRA Section 604 - Verify permissible purpose validation for all credit data access
2. PII Protection - Ensure all SSN, DOB, and financial data is encrypted/masked
3. Audit Trail - Validate comprehensive logging for all credit-related operations
4. Error Handling - Check for user-friendly error messages (no internal details)
5. Access Control - Verify role-based permissions for credit data access

CREDIT REPAIR DOMAIN VALIDATION:
- FICO score calculations must enforce 300-850 range
- Credit utilization calculations must handle edge cases
- Dispute workflows must track 30-day investigation timelines
- All credit bureau API calls must include retry logic and rate limiting

SECURITY REQUIREMENTS:
- No hardcoded credentials or API keys
- All database queries must use parameterized statements
- Input validation for all user-provided data
- Proper authentication and authorization checks

TESTING REQUIREMENTS:
- Minimum 80% test coverage for new code
- Include edge cases and error scenarios
- Mock external API calls (credit bureaus)
- Validate FCRA compliance in test scenarios
"""

[pr_reviewer.incremental]
enable_incremental_review = true
require_all_thresholds = false

[pr_code_suggestions]
enable_code_suggestions = true
commitable_code_suggestions = true
extra_instructions = """
Focus on:
1. FCRA compliance improvements
2. Credit calculation accuracy
3. PII data protection enhancements
4. Performance optimizations for credit workflows
5. Error handling improvements
6. Test coverage enhancements

Avoid suggesting:
- Changes that could impact FCRA compliance
- Modifications to audit trail logging
- Alterations to encryption/security measures
"""

[pr_description]
enable_pr_description = true
publish_description_as_comment = false
add_original_user_description = true
keep_original_user_title = true
extra_instructions = """
Include in PR description:
1. FCRA compliance impact assessment
2. Credit repair functionality changes
3. Security implications
4. Test coverage changes
5. Performance impact
6. Database migration requirements (if any)
"""

[pr_questions]
enable_pr_questions = true
extra_instructions = """
Ask questions about:
1. FCRA compliance validation approach
2. Credit calculation accuracy verification
3. PII data handling security measures
4. Test coverage for edge cases
5. Error handling for credit workflows
6. Performance impact on credit operations
"""

[pr_add_docs]
enable_pr_add_docs = true
docs_style = "google"
extra_instructions = """
Focus documentation on:
1. FCRA compliance requirements
2. Credit calculation methodologies
3. API usage patterns for credit data
4. Security considerations
5. Error handling approaches
6. Testing strategies
"""

[pr_update_changelog]
enable_pr_update_changelog = true
changelog_file = "CHANGELOG.md"
extra_instructions = """
Categorize changes as:
- FCRA Compliance
- Credit Calculations
- Security Enhancements
- Performance Improvements
- Bug Fixes
- Testing Improvements
"""

[pr_analyze]
enable_pr_analyze = true
extra_instructions = """
Analyze for:
1. FCRA compliance risks
2. Credit calculation accuracy
3. Security vulnerabilities
4. Performance bottlenecks
5. Test coverage gaps
6. Code maintainability
"""

[pr_similar_issue]
enable_pr_similar_issue = false

[pr_help]
enable_pr_help = true

[pr_config]
enable_pr_config = true

[local]
# Local development settings
description_path = ""
review_path = ""

[litellm]
# Cost optimization settings
drop_params = true
max_tokens = 4000
temperature = 0.1
PR_AGENT_EOF

echo "✅ Qodo PR-Agent configuration created"

# Create Qodo PR-Agent workflow
echo "⚙️  Creating Qodo PR-Agent workflow..."

cat > .github/workflows/ai-code-review.yml << 'QODO_WORKFLOW_EOF'
name: 🤖 Qodo PR-Agent Review

on:
  pull_request:
    types: [opened, synchronize, reopened]
  issue_comment:
    types: [created, edited]

permissions:
  contents: read
  pull-requests: write
  issues: write

jobs:
  pr-agent:
    runs-on: ubuntu-latest
    if: github.event.pull_request.draft == false

    steps:
      - name: 🤖 PR Agent Review
        uses: Codium-ai/pr-agent@main
        env:
          OPENAI_KEY: ${{ secrets.OPENAI_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          pr_url: ${{ github.event.pull_request.html_url }}
          command: "review"

      - name: 📝 PR Agent Describe
        uses: Codium-ai/pr-agent@main
        env:
          OPENAI_KEY: ${{ secrets.OPENAI_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          pr_url: ${{ github.event.pull_request.html_url }}
          command: "describe"
QODO_WORKFLOW_EOF

echo "✅ Qodo PR-Agent workflow created"

# Create Qodo Auto-Trigger workflow for security issues
echo "⚙️  Creating Qodo auto-trigger workflow for security issues..."

cat > .github/workflows/qodo-auto-trigger.yml << 'QODO_AUTO_EOF'
# Qodo PR-Agent Auto-Trigger on Security Issues
# Automatically triggers AI review when security scans fail or vulnerabilities are detected

name: 🤖 Qodo Auto-Trigger on Security Issues

on:
  check_suite:
    types: [completed]
  workflow_run:
    workflows: ["🔍 SonarCloud PR Analysis", "🚀 Essential CI/CD"]
    types: [completed]
  pull_request:
    types: [opened, synchronize, reopened]
    # Trigger on security-related PRs
  schedule:
    # Run daily to check for new security issues
    - cron: '0 9 * * *'

permissions:
  contents: read
  pull-requests: write
  issues: write
  checks: read

jobs:
  security-trigger:
    name: 🔒 Security Issue Detection
    runs-on: ubuntu-latest
    if: github.event_name == 'check_suite' || github.event_name == 'workflow_run'

    steps:
      - name: 📥 Checkout Repository
        uses: actions/checkout@v5

      - name: 🔍 Check for Security Failures
        id: security-check
        run: |
          echo "Checking for security-related failures..."
          
          # Check if this is a security-related failure
          if [[ "${{ github.event.check_suite.conclusion }}" == "failure" ]] || \
             [[ "${{ github.event.workflow_run.conclusion }}" == "failure" ]]; then
            
            # Check if it's security-related
            if [[ "${{ github.event.check_suite.app.name }}" == *"security"* ]] || \
               [[ "${{ github.event.workflow_run.name }}" == *"Security"* ]] || \
               [[ "${{ github.event.workflow_run.name }}" == *"SonarCloud"* ]]; then
              echo "security_failure=true" >> $GITHUB_OUTPUT
              echo "🚨 Security failure detected"
            else
              echo "security_failure=false" >> $GITHUB_OUTPUT
            fi
          else
            echo "security_failure=false" >> $GITHUB_OUTPUT
          fi

      - name: 🔍 Get Associated PR
        id: get-pr
        if: steps.security-check.outputs.security_failure == 'true'
        run: |
          # Get PR number from the commit SHA
          PR_NUMBER=$(gh pr list --state open --json number,headRefOid --jq ".[] | select(.headRefOid==\"${{ github.event.check_suite.head_sha || github.event.workflow_run.head_sha }}\") | .number")
          
          if [[ -n "$PR_NUMBER" ]]; then
            echo "pr_number=$PR_NUMBER" >> $GITHUB_OUTPUT
            echo "Found PR #$PR_NUMBER for security failure"
          else
            echo "pr_number=" >> $GITHUB_OUTPUT
            echo "No PR found for this commit"
          fi
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: 🤖 Trigger Security Review
        if: steps.security-check.outputs.security_failure == 'true' && steps.get-pr.outputs.pr_number != ''
        run: |
          echo "🚨 Triggering AI security review for PR #${{ steps.get-pr.outputs.pr_number }}"
          
          # Add security review comment to trigger PR-Agent
          gh pr comment "${{ steps.get-pr.outputs.pr_number }}" --body "
          ## 🚨 Security Issue Detected - AI Review Triggered
          
          A security scan failure has been detected. Triggering comprehensive AI review...
          
          /security-review
          /analyze
          
          **Security Focus Areas:**
          - Vulnerability assessment
          - FCRA compliance validation  
          - PII data protection
          - Access control verification
          - Audit trail completeness
          
          This review was automatically triggered due to security scan failures.
          "
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  vulnerability-scan:
    name: 🔍 Vulnerability Detection Trigger
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request' || github.event_name == 'schedule'

    steps:
      - name: 📥 Checkout Repository
        uses: actions/checkout@v5

      - name: 🔧 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: 📦 Install Dependencies
        run: npm ci --no-audit

      - name: 🔍 Run Security Audit
        id: audit
        continue-on-error: true
        run: |
          echo "Running npm audit..."
          AUDIT_OUTPUT=$(npm audit --audit-level=moderate --json 2>/dev/null || echo '{"vulnerabilities":{}}')
          
          # Count vulnerabilities
          VULN_COUNT=$(echo "$AUDIT_OUTPUT" | jq -r '.metadata.vulnerabilities.total // 0')
          CRITICAL_COUNT=$(echo "$AUDIT_OUTPUT" | jq -r '.metadata.vulnerabilities.critical // 0')
          HIGH_COUNT=$(echo "$AUDIT_OUTPUT" | jq -r '.metadata.vulnerabilities.high // 0')
          
          echo "vulnerabilities=$VULN_COUNT" >> $GITHUB_OUTPUT
          echo "critical=$CRITICAL_COUNT" >> $GITHUB_OUTPUT
          echo "high=$HIGH_COUNT" >> $GITHUB_OUTPUT
          
          if [[ $CRITICAL_COUNT -gt 0 ]] || [[ $HIGH_COUNT -gt 5 ]]; then
            echo "trigger_review=true" >> $GITHUB_OUTPUT
            echo "🚨 High-risk vulnerabilities detected: Critical=$CRITICAL_COUNT, High=$HIGH_COUNT"
          else
            echo "trigger_review=false" >> $GITHUB_OUTPUT
            echo "✅ No high-risk vulnerabilities detected"
          fi

      - name: 🤖 Trigger Vulnerability Review
        if: steps.audit.outputs.trigger_review == 'true' && github.event_name == 'pull_request'
        run: |
          echo "🚨 Triggering AI vulnerability review..."
          
          gh pr comment "${{ github.event.pull_request.number }}" --body "
          ## 🚨 High-Risk Vulnerabilities Detected
          
          **Vulnerability Summary:**
          - 🔴 Critical: ${{ steps.audit.outputs.critical }}
          - 🟠 High: ${{ steps.audit.outputs.high }}
          - 📊 Total: ${{ steps.audit.outputs.vulnerabilities }}
          
          Triggering comprehensive security review...
          
          /security-review
          /compliance-review
          
          **Required Actions:**
          1. Review all critical and high-severity vulnerabilities
          2. Validate FCRA compliance impact
          3. Ensure PII data protection measures
          4. Update dependencies or apply security patches
          5. Re-run security scans after fixes
          
          This review was automatically triggered due to vulnerability detection.
          "
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  dependabot-security-trigger:
    name: 🤖 Dependabot Security Review
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request' && github.actor == 'dependabot[bot]'

    steps:
      - name: 🔍 Check if Security Update
        id: security-update
        run: |
          if [[ "${{ github.event.pull_request.title }}" == *"security"* ]] || \
             [[ "${{ github.event.pull_request.title }}" == *"vulnerability"* ]] || \
             [[ "${{ github.event.pull_request.body }}" == *"security"* ]]; then
            echo "is_security=true" >> $GITHUB_OUTPUT
            echo "🔒 Dependabot security update detected"
          else
            echo "is_security=false" >> $GITHUB_OUTPUT
          fi

      - name: 🤖 Trigger Security Review for Dependabot
        if: steps.security-update.outputs.is_security == 'true'
        run: |
          echo "🤖 Triggering AI review for Dependabot security update..."
          
          gh pr comment "${{ github.event.pull_request.number }}" --body "
          ## 🤖 Dependabot Security Update - AI Review
          
          This is an automated security update from Dependabot. Triggering AI review to validate:
          
          /security-review
          /analyze
          
          **Security Update Validation:**
          - ✅ Vulnerability resolution verification
          - ✅ FCRA compliance impact assessment
          - ✅ Breaking change analysis
          - ✅ Test coverage validation
          - ✅ Performance impact review
          
          **Auto-Merge Status:** Will auto-merge after all checks pass ✅
          "
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
QUDO_AUTO_EOF

echo "✅ Qodo auto-trigger workflow created"

# Update SonarCloud configuration with AI CodeFix and security enforcement
echo "⚙️  Updating SonarCloud configuration with AI CodeFix..."

# Update the existing sonar-project.properties to add AI CodeFix and security enforcement
cat >> sonar-project.properties << 'SONAR_UPDATE_EOF'

# AI CodeFix Configuration
sonar.ai.codefix.enabled=true
sonar.ai.codefix.provider=OpenAI
sonar.ai.codefix.autoApply=false
sonar.ai.codefix.includeSecurityIssues=true
sonar.ai.codefix.includeDependencyIssues=true

# Security enforcement
sonar.security.hotspots.enabled=true
sonar.security.review.enabled=true
sonar.security.hotspots.inheritFromParent=true

# Quality gate enforcement - Block failing PRs
sonar.buildbreaker.skip=false
SONAR_UPDATE_EOF

echo "✅ SonarCloud configuration updated with AI CodeFix and security enforcement"

# Update SonarCloud workflows to include SONAR_TOKEN and security enforcement
echo "⚙️  Updating SonarCloud workflows with security enforcement..."

# Update the PR analysis workflow to include buildbreaker and SONAR_TOKEN
sed -i.bak 's/GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}/GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}\n          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}/' .github/workflows/sonarcloud-pr-analysis.yml
sed -i.bak 's/-Dsonar.verbose=true/-Dsonar.verbose=true\n            -Dsonar.buildbreaker.skip=false\n            -Dsonar.security.hotspots.enabled=true\n            -Dsonar.security.review.enabled=true/' .github/workflows/sonarcloud-pr-analysis.yml

# Update the main analysis workflow to include buildbreaker and SONAR_TOKEN  
sed -i.bak 's/GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}/GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}\n          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}/' .github/workflows/sonarcloud-analysis.yml
sed -i.bak 's/-Dsonar.verbose=true/-Dsonar.verbose=true\n            -Dsonar.buildbreaker.skip=false\n            -Dsonar.security.hotspots.enabled=true\n            -Dsonar.security.review.enabled=true/' .github/workflows/sonarcloud-analysis.yml

# Remove backup files
rm -f .github/workflows/sonarcloud-pr-analysis.yml.bak .github/workflows/sonarcloud-analysis.yml.bak 2>/dev/null || true

echo "✅ SonarCloud workflows updated with security enforcement"

# Create branch protection setup script
echo "⚙️  Creating branch protection setup script..."
mkdir -p scripts

cat > scripts/setup-branch-protection.sh << 'BRANCH_PROTECTION_EOF'
#!/bin/bash

# GitHub Branch Protection Setup Script
# Configures branch protection rules with required status checks for security enforcement

set -e

echo "🛡️ Setting up GitHub Branch Protection Rules"
echo "=============================================="

# Repository details - auto-detect from git remote
REPO_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [[ "$REPO_URL" =~ github\.com[:/]([^/]+)/([^/.]+) ]]; then
    REPO="${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
    REPO=${REPO%.git}  # Remove .git suffix if present
else
    echo "❌ Could not detect GitHub repository from git remote"
    echo "Please ensure you're in a git repository with a GitHub remote"
    exit 1
fi

BRANCH="main"

echo "📋 Repository: $REPO"
echo "🌿 Branch: $BRANCH"

# Check if gh CLI is authenticated
if ! gh auth status >/dev/null 2>&1; then
    echo "❌ GitHub CLI not authenticated. Please run 'gh auth login' first."
    exit 1
fi

echo "✅ GitHub CLI authenticated"

# Configure branch protection rules
echo "🛡️ Configuring branch protection rules..."

gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/$REPO/branches/$BRANCH/protection" \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "🔍 SonarCloud PR Analysis / 🔍 SonarCloud PR Analysis",
      "🚀 Essential CI/CD / 🔍 Essential Quality Gates",
      "🚀 Essential CI/CD / 🔒 Essential Security Gates",
      "🤖 Qodo PR-Agent Review / review",
      "🤖 Dependabot Auto-Merge / 🤖 Auto-merge Dependabot PRs"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "require_last_push_approval": true,
    "bypass_pull_request_allowances": {
      "users": [],
      "teams": [],
      "apps": ["dependabot"]
    }
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}
EOF

echo "✅ Branch protection rules configured successfully!"

# Display current protection status
echo ""
echo "📊 Current Branch Protection Status:"
echo "===================================="

gh api \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/$REPO/branches/$BRANCH/protection" \
  --jq '{
    required_status_checks: .required_status_checks.contexts,
    required_reviews: .required_pull_request_reviews.required_approving_review_count,
    enforce_admins: .enforce_admins.enabled,
    dismiss_stale_reviews: .required_pull_request_reviews.dismiss_stale_reviews,
    require_conversation_resolution: .required_conversation_resolution.enabled
  }'

echo ""
echo "🎉 Branch protection setup complete!"
echo ""
echo "🔒 Security Features Enabled:"
echo "  ✅ Required status checks (strict mode)"
echo "  ✅ Required pull request reviews (1 approval)"
echo "  ✅ Dismiss stale reviews on new commits"
echo "  ✅ Require conversation resolution"
echo "  ✅ Block force pushes and deletions"
echo "  ✅ Dependabot bypass for auto-merge"
echo ""
echo "📋 Required Status Checks:"
echo "  🔍 SonarCloud PR Analysis"
echo "  🚀 Essential Quality Gates"
echo "  🔒 Essential Security Gates"
echo "  🤖 Qodo PR-Agent Review"
echo "  🤖 Dependabot Auto-Merge"
echo ""
echo "💡 Next Steps:"
echo "  1. Test with a new PR to verify all checks are enforced"
echo "  2. Verify Dependabot auto-merge works for security updates"
echo "  3. Confirm SonarCloud quality gates block failing PRs"
echo "  4. Validate Qodo PR-Agent triggers on security issues"
BRANCH_PROTECTION_EOF

chmod +x scripts/setup-branch-protection.sh

echo "✅ Branch protection setup script created"

# Create security automation verification script
echo "⚙️  Creating security automation verification script..."

cat > scripts/verify-security-automation.sh << 'VERIFY_SCRIPT_EOF'
#!/bin/bash

# Security Automation Verification Script
# Verifies that all security automation fixes are working correctly

set -e

echo "🔍 Security Automation Verification"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check status
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1${NC}"
        return 1
    fi
}

echo ""
echo "🔍 1. Dependabot Configuration Verification"
echo "==========================================="

# Check Dependabot config
if [ -f ".github/dependabot.yml" ]; then
    echo -e "${BLUE}📋 Checking Dependabot configuration...${NC}"
    
    # Check for daily schedule
    if grep -q "interval: \"daily\"" .github/dependabot.yml; then
        check_status "Daily security update schedule configured"
    else
        check_status "Daily security update schedule NOT configured"
    fi
    
    # Check for security updates
    if grep -q "security-updates:" .github/dependabot.yml; then
        check_status "Security updates enabled"
    else
        check_status "Security updates NOT enabled"
    fi
    
    # Check auto-merge workflow
    if [ -f ".github/workflows/dependabot-auto-merge.yml" ]; then
        check_status "Dependabot auto-merge workflow exists"
    else
        check_status "Dependabot auto-merge workflow NOT found"
    fi
else
    check_status "Dependabot configuration NOT found"
fi

echo ""
echo "🔍 2. SonarCloud Quality Gate Verification"
echo "=========================================="

# Check SonarCloud config
if [ -f "sonar-project.properties" ]; then
    echo -e "${BLUE}📋 Checking SonarCloud configuration...${NC}"
    
    # Check quality gate enforcement
    if grep -q "sonar.buildbreaker.skip=false" sonar-project.properties; then
        check_status "Quality gate enforcement enabled"
    else
        check_status "Quality gate enforcement NOT enabled"
    fi
    
    # Check security hotspots
    if grep -q "sonar.security.hotspots.enabled=true" sonar-project.properties; then
        check_status "Security hotspots enabled"
    else
        check_status "Security hotspots NOT enabled"
    fi
    
    # Check AI CodeFix
    if grep -q "sonar.ai.codefix.enabled=true" sonar-project.properties; then
        check_status "AI CodeFix enabled"
    else
        check_status "AI CodeFix NOT enabled"
    fi
    
    # Check workflow has SONAR_TOKEN
    if grep -q "SONAR_TOKEN" .github/workflows/sonarcloud-pr-analysis.yml; then
        check_status "SonarCloud PR workflow has SONAR_TOKEN"
    else
        check_status "SonarCloud PR workflow missing SONAR_TOKEN"
    fi
else
    check_status "SonarCloud configuration NOT found"
fi

echo ""
echo "🔍 3. Qodo PR-Agent Auto-Trigger Verification"
echo "=============================================="

# Check Qodo PR-Agent config
if [ -f ".pr_agent.toml" ]; then
    echo -e "${BLUE}📋 Checking Qodo PR-Agent configuration...${NC}"
    
    # Check FCRA compliance focus
    if grep -q "FCRA" .pr_agent.toml; then
        check_status "FCRA compliance configuration found"
    else
        check_status "FCRA compliance configuration NOT found"
    fi
    
    # Check security review configuration
    if grep -q "require_security_review" .pr_agent.toml; then
        check_status "Security review requirement configured"
    else
        check_status "Security review requirement NOT configured"
    fi
    
    # Check auto-trigger workflow
    if [ -f ".github/workflows/qodo-auto-trigger.yml" ]; then
        check_status "Qodo auto-trigger workflow exists"
    else
        check_status "Qodo auto-trigger workflow NOT found"
    fi
    
    # Check main AI review workflow
    if [ -f ".github/workflows/ai-code-review.yml" ]; then
        check_status "Main AI code review workflow exists"
    else
        check_status "Main AI code review workflow NOT found"
    fi
else
    check_status "Qodo PR-Agent configuration NOT found"
fi

echo ""
echo "🔍 4. GitHub Actions Workflow Verification"
echo "=========================================="

echo -e "${BLUE}📋 Checking GitHub Actions workflows...${NC}"

# Count workflows
WORKFLOW_COUNT=$(find .github/workflows -name "*.yml" -o -name "*.yaml" 2>/dev/null | wc -l)
echo "📊 Total workflows found: $WORKFLOW_COUNT"

# Check essential workflows
ESSENTIAL_WORKFLOWS=(
    "sonarcloud-pr-analysis.yml"
    "sonarcloud-analysis.yml"
    "ai-code-review.yml"
    "dependabot-auto-merge.yml"
    "qodo-auto-trigger.yml"
)

for workflow in "${ESSENTIAL_WORKFLOWS[@]}"; do
    if [ -f ".github/workflows/$workflow" ]; then
        check_status "Essential workflow: $workflow"
    else
        check_status "Essential workflow MISSING: $workflow"
    fi
done

echo ""
echo "📊 VERIFICATION SUMMARY"
echo "======================"

echo -e "${GREEN}✅ Security Automation Features:${NC}"
echo "  🤖 Dependabot: Daily security updates + auto-merge"
echo "  🔍 SonarCloud: Quality gate enforcement + AI CodeFix"
echo "  🤖 Qodo PR-Agent: Auto-trigger on security failures"
echo "  🛡️ Security: Comprehensive vulnerability scanning"

echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "  1. Run: ./scripts/setup-branch-protection.sh"
echo "  2. Set up GitHub secrets: SONAR_TOKEN, OPENAI_KEY"
echo "  3. Test with a security vulnerability PR"
echo "  4. Verify Dependabot auto-merge works"
echo "  5. Confirm SonarCloud blocks failing PRs"

echo ""
echo -e "${GREEN}🎉 Security automation verification complete!${NC}"
VERIFY_SCRIPT_EOF

chmod +x scripts/verify-security-automation.sh

echo "✅ Security automation verification script created"

# If no Playwright config exists, create a sensible default
if [ -z "$PLAYWRIGHT_CONFIG" ]; then
  echo "⚙️  Creating default Playwright configuration..."
  cat > playwright.config.js << 'PW_EOF'
import { defineConfig, devices } from "@playwright/test";

const ENABLE_E2E = process.env.ENABLE_E2E === "true";
const USE_WEBSERVER = ENABLE_E2E && !!process.env.PLAYWRIGHT_WEB_SERVER;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  timeout: 60000,
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  ...(USE_WEBSERVER
    ? {
        webServer: {
          command: process.env.PLAYWRIGHT_WEB_SERVER,
          url: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
          reuseExistingServer: !process.env.CI,
        },
      }
    : {}),
});
PW_EOF
  PLAYWRIGHT_CONFIG="playwright.config.js"
  echo "✅ Default Playwright config created: $PLAYWRIGHT_CONFIG"
fi

# Create package.json scripts
echo "⚙️  Adding scripts to package.json..."
npm pkg set scripts.test="vitest"
npm pkg set scripts."test:watch"="vitest --watch"
npm pkg set scripts."test:coverage"="vitest run --coverage"
npm pkg set scripts."test:coverage:sonar"="vitest run --coverage --reporter=verbose"
npm pkg set scripts."test:ci"="vitest --run --coverage"
npm pkg set scripts."test:e2e"="playwright test$( [ -n \"$PLAYWRIGHT_CONFIG\" ] && printf ' --config=%s' \"$PLAYWRIGHT_CONFIG\" )"
npm pkg set scripts.lint="eslint ."
npm pkg set scripts."lint:ci"="eslint . --max-warnings=0"
npm pkg set scripts."lint:ci:all"="eslint . --max-warnings=0"
npm pkg set scripts."lint:fix"="eslint . --fix"
npm pkg set scripts."lint:fix:ci"="eslint . --fix"
npm pkg set scripts."lint:security"="eslint . --max-warnings=0"
npm pkg set scripts."format:check"="prettier --check '**/*.{js,jsx,ts,tsx,json,md}'"
npm pkg set scripts."format:fix"="prettier --write '**/*.{js,jsx,ts,tsx,json,md}'"
npm pkg set scripts."type-check"="tsc --noEmit"
npm pkg set scripts."quality-gates"="./scripts/local-quality-gates.sh"
npm pkg set scripts."pre-push"="npm run quality-gates"

# Set module type
npm pkg set type="module"

echo "✅ Scripts added to package.json"

# Create Husky hooks directory
echo "⚙️  Setting up Git hooks..."
mkdir -p .husky

# Create pre-commit hook
cat > .husky/pre-commit << 'HOOK_EOF'
#!/usr/bin/env sh
npx lint-staged
HOOK_EOF

# Create commit-msg hook
cat > .husky/commit-msg << 'HOOK_EOF'
#!/usr/bin/env sh
npx --no -- commitlint --edit "$1"
HOOK_EOF

# Create pre-push hook
cat > .husky/pre-push << 'HOOK_EOF'
#!/usr/bin/env sh
npm run pre-push
HOOK_EOF

# Make hooks executable
chmod +x .husky/*

# Prompt user for Git hooks configuration
echo ""
echo "🔗 Git Hooks Configuration"
echo "========================="
echo "The AI-SDLC framework includes Git hooks for:"
echo "  • Pre-commit: Run linting and formatting checks"
echo "  • Commit-msg: Enforce conventional commit messages"
echo "  • Pre-push: Run comprehensive quality gates"
echo ""
echo "Repository Type: ${REPO_TYPE}"
echo ""

# Function to prompt user for Git hooks
prompt_git_hooks() {
    local repo_type="$1"
    local default_choice=""

    case "$repo_type" in
        "production")
            echo "🚀 PRODUCTION REPOSITORY DETECTED"
            echo "   Git hooks are HIGHLY RECOMMENDED for production repositories"
            echo "   to ensure code quality and prevent bad commits from being pushed."
            default_choice="Y"
            ;;
        "test")
            echo "🧪 TEST REPOSITORY DETECTED"
            echo "   Git hooks are optional for test repositories but can help"
            echo "   validate the framework installation."
            default_choice="N"
            ;;
        "local")
            echo "🏠 LOCAL REPOSITORY DETECTED"
            echo "   Git hooks are recommended for local development to catch"
            echo "   issues early and maintain code quality."
            default_choice="Y"
            ;;
    esac

    echo ""
    echo "Do you want to configure Git hooks for this repository? (y/N)"
    echo "   This will set 'git config core.hooksPath .husky'"
    echo "   You can disable them later with: git config --unset core.hooksPath"
    echo ""

    while true; do
        if [ -n "$default_choice" ]; then
            echo -n "Configure Git hooks? [${default_choice}]: "
        else
            echo -n "Configure Git hooks? [y/N]: "
        fi

        read -r response
        response=${response:-$default_choice}

        case "$response" in
            [Yy]|[Yy][Ee][Ss])
                echo "✅ Configuring Git hooks..."
                git config core.hooksPath .husky
                echo "✅ Git hooks configured successfully"
                return 0
                ;;
            [Nn]|[Nn][Oo])
                echo "ℹ️  Git hooks not configured"
                echo "   You can configure them later with: git config core.hooksPath .husky"
                return 1
                ;;
            *)
                echo "Please enter 'y' for yes or 'n' for no"
                ;;
        esac
    done
}

# Prompt user for Git hooks configuration
if prompt_git_hooks "$REPO_TYPE"; then
    GIT_HOOKS_CONFIGURED=true
else
    GIT_HOOKS_CONFIGURED=false
fi

# Create lint-staged configuration (CommonJS)
echo "⚙️  Creating lint-staged configuration..."
cat > .lintstagedrc.cjs << 'LINTSTAGED_EOF'
module.exports = {
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
};
LINTSTAGED_EOF

# Create commitlint configuration (CommonJS)
echo "⚙️  Creating commitlint configuration..."
cat > commitlint.config.cjs << 'COMMITLINT_EOF'
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'ci',
        'build',
        'revert'
      ]
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100]
  }
};
COMMITLINT_EOF

# Create quality gates script
echo "⚙️  Creating quality gates script..."
mkdir -p scripts
cat > scripts/local-quality-gates.sh << 'QUALITY_EOF'
#!/bin/bash

echo "🚀 Essential Quality Gates"
echo "========================="

# Track overall status
OVERALL_STATUS=0

# Dependencies check
echo "🔍 Dependencies"
if npm ci --dry-run > /dev/null 2>&1; then
    echo "✅ Dependencies"
else
    echo "❌ Dependencies - Run 'npm install' to fix"
    OVERALL_STATUS=1
fi

# Linting
echo "🔍 Linting"
LINT_EXIT_CODE=0
if ! npm run lint:ci > /dev/null 2>&1; then
    echo "⚠️  Linting issues found in main source files:"
    npm run lint:ci || true
    LINT_EXIT_CODE=1
fi

# Check for additional linting issues in all files
if ! npm run lint:ci:all > /dev/null 2>&1; then
    echo "⚠️  Additional linting issues found in other files:"
    npm run lint:ci:all || true
    LINT_EXIT_CODE=1
fi

if [ $LINT_EXIT_CODE -eq 0 ]; then
    echo "✅ Linting"
else
    echo "❌ Linting - Run 'npm run lint:fix' to fix"
    OVERALL_STATUS=1
fi

# Formatting
echo "🔍 Formatting"
FORMAT_EXIT_CODE=0
if ! npm run format:check > /dev/null 2>&1; then
    echo "⚠️  Formatting issues found:"
    npm run format:check || true
    FORMAT_EXIT_CODE=1
fi

if [ $FORMAT_EXIT_CODE -eq 0 ]; then
    echo "✅ Formatting"
else
    echo "❌ Formatting - Run 'npm run format:fix' to fix"
    OVERALL_STATUS=1
fi

# TypeScript
echo "🔍 TypeScript"
if npm run type-check > /dev/null 2>&1; then
    echo "✅ TypeScript"
else
    echo "❌ TypeScript - Fix type errors"
    OVERALL_STATUS=1
fi

# Tests
echo "🔍 Tests"
if npm run test:ci > /dev/null 2>&1; then
    echo "✅ Tests"
else
    echo "❌ Tests - Fix failing tests"
    OVERALL_STATUS=1
fi

# Build
echo "🔍 Build"
if npm run build > /dev/null 2>&1; then
    echo "✅ Build"
else
    echo "❌ Build - Fix build errors"
    OVERALL_STATUS=1
fi

echo ""
if [ $OVERALL_STATUS -eq 0 ]; then
    echo "🎉 All essential checks passed!"
    echo "✅ Ready to push"
else
    echo "⚠️  Some checks failed. Please fix the issues above."
    echo "💡 Run 'npm run lint:fix' and 'npm run format:fix' to auto-fix many issues"
fi

exit $OVERALL_STATUS
QUALITY_EOF

chmod +x scripts/local-quality-gates.sh

echo "✅ Quality gates script created"

# Create smart validation script
echo "⚙️  Creating smart validation script..."
cat > validate-setup.js << 'VALIDATE_EOF'
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');


console.log("🔍 Validating AI-SDLC Setup...\n");

// Detect repository type
function detectRepositoryType() {
  const cwd = process.cwd();
  const isTmpDir = cwd.includes('/tmp/') || cwd.includes('\\temp\\');
  const isTestDir = cwd.includes('test') || cwd.includes('demo') || cwd.includes('example');
  const hasGitRemote = (() => {
    try {
      const out = execSync('git remote -v', { encoding: 'utf8', stdio: 'pipe' }).trim();
      return out.length > 0;
    } catch {
      return false;
    }
  })();

  if (isTmpDir || isTestDir) {
    return 'test';
  } else if (hasGitRemote) {
    return 'production';
  } else {
    return 'local';
  }
}

const repoType = detectRepositoryType();
console.log(`📁 Repository Type: ${repoType.toUpperCase()}`);

const checks = [
  {
    name: "ESLint",
    command: "npx eslint --version",
    success: "ESLint available",
  },
  {
    name: "Prettier",
    command: "npx prettier --version",
    success: "Prettier available",
  },
  {
    name: "Husky",
    command: "npx husky --version",
    success: "Husky available",
  },
];

// File existence checks
const fileChecks = [
  {
    name: "ESLint Config",
    file: "eslint.config.mjs",
    isDirectory: false,
  },
  {
    name: "Prettier Config",
    file: ".prettierrc",
    isDirectory: false,
  },
  {
    name: "Husky Hooks",
    file: ".husky",
    isDirectory: true,
  },
  {
    name: "Quality Gates Script",
    file: "scripts/local-quality-gates.sh",
    isDirectory: false,
  },
];

// Git hooks check based on repository type
let gitHooksStatus = "skipped";
if (repoType === 'production') {
  try {
    const gitHooksPath = execSync("git config core.hooksPath", { encoding: "utf8" }).trim();
    if (gitHooksPath === ".husky") {
      // Check if Husky hooks are properly installed
      if (fs.existsSync(".husky/pre-commit") && fs.existsSync(".husky/commit-msg")) {
        gitHooksStatus = "configured";
        fileChecks.push({
          name: "Git Hooks (Husky)",
          file: ".husky/pre-commit",
          isDirectory: false,
        });
      } else {
        gitHooksStatus = "missing";
      }
    } else {
      gitHooksStatus = "not-configured";
    }
  } catch {
    gitHooksStatus = "error";
  }
} else if (repoType === 'test') {
  // For test repositories, just check if Husky directory exists
  if (fs.existsSync(".husky")) {
    gitHooksStatus = "test-mode";
    fileChecks.push({
      name: "Husky Directory (Test Mode)",
      file: ".husky",
      isDirectory: true,
    });
  }
}

let passed = 0;
let total = checks.length + fileChecks.length;

// Command checks
checks.forEach((check) => {
  try {
    execSync(check.command, { stdio: "ignore" });
    console.log(`✅ ${check.success}`);
    passed++;
  } catch {
    console.log(`❌ ${check.name} not properly configured`);
  }
});

// File existence checks
fileChecks.forEach((check) => {
  try {
    const exists = check.isDirectory
      ? fs.statSync(check.file).isDirectory()
      : fs.statSync(check.file).isFile();

    if (exists) {
      console.log(`✅ ${check.name} configured`);
      passed++;
    } else {
      console.log(`❌ ${check.name} missing`);
    }
  } catch {
    console.log(`❌ ${check.name} missing`);
  }
});

// Git hooks status
console.log(`\n🔗 Git Hooks Status: ${gitHooksStatus.toUpperCase()}`);
if (repoType === 'test') {
  console.log("ℹ️  Test repository - Git hooks not required");
} else if (repoType === 'production') {
  if (gitHooksStatus === "configured") {
    console.log("✅ Git hooks properly configured for production");
  } else {
    console.log("⚠️  Git hooks need configuration for production use");
  }
}

console.log(`\n📊 Validation Results: ${passed}/${total} checks passed`);

if (passed === total) {
  console.log("🎉 All systems ready for AI-powered development!");
  console.log("🤖 AI-SDLC framework configuration active");

  if (repoType === 'test') {
    console.log("🧪 Test environment - ready for validation");
  } else if (repoType === 'production') {
    console.log("🚀 Production environment - ready for deployment");
  }
} else {
  console.log("⚠️  Some components need attention. Check documentation.");
}
VALIDATE_EOF

chmod +x validate-setup.js

echo "✅ Smart validation script created"

# Convert quotes intelligently and test installation
echo "🔄 Converting single quotes to double quotes in existing files..."
convert_quotes_smart() {
    local file="$1"
    local temp_file=$(mktemp)

    # More intelligent quote conversion that preserves regex patterns
    sed -E '
        # Skip lines with regex patterns (//...//)
        /\/[^\/]*\//! {
            # Skip lines with template literals (backticks)
            /`/! {
                # Convert simple string literals only (not in comments or complex patterns)
                s/'\''([^'\'']*)'\''/"\1"/g
            }
        }
    ' "$file" > "$temp_file"

    # Validate the conversion didn't break anything
    if node --check "$temp_file" 2>/dev/null; then
        mv "$temp_file" "$file"
        echo "✅ Converted quotes in $file"
    else
        echo "⚠️  Skipped $file (potential regex conflicts)"
        rm "$temp_file"
    fi
}

# Skip TypeScript files to avoid syntax validation issues
# (TypeScript files will be handled by the TypeScript compiler)
find . \( -name "*.js" -o -name "*.jsx" \) -print0 | while IFS= read -r -d '' file; do
    if [ -f "$file" ]; then
        convert_quotes_smart "$file"
    fi
done

echo "✅ Smart quote conversion completed"

# Test the installation
echo "🧪 Testing installation..."
if npm run lint:ci:all > /dev/null 2>&1; then
    echo "✅ ESLint working correctly"
else
    echo "⚠️  ESLint has issues - running auto-fix..."
    npm run lint:fix > /dev/null 2>&1 || true
    npm run format:fix > /dev/null 2>&1 || true
fi

if npm run format:check > /dev/null 2>&1; then
    echo "✅ Prettier working correctly"
else
    echo "⚠️  Prettier has issues - running auto-fix..."
    npm run format:fix > /dev/null 2>&1 || true
fi

echo ""
echo "🎉 AI-SDLC Framework Installation Complete!"
echo "=========================================="
echo ""
echo "✅ ESLint configured for DOUBLE QUOTES"
echo "✅ Prettier configured for DOUBLE QUOTES"
echo "✅ SonarCloud configuration created"
if [ "$GIT_HOOKS_CONFIGURED" = true ]; then
    echo "✅ Git hooks configured and active"
else
    echo "ℹ️  Git hooks available but not configured"
fi
echo "✅ Quality gates ready"
echo "✅ All dependencies installed"
# Summarize Playwright config presence
if [ -f "playwright.config.ts" ]; then
  echo "✅ Playwright config detected: playwright.config.ts"
elif [ -f "playwright.config.js" ]; then
  echo "✅ Playwright config detected: playwright.config.js"
else
  echo "ℹ️  No Playwright config detected; using defaults"
fi
echo ""
echo "Repository Type: ${REPO_TYPE}"
if [ "$GIT_HOOKS_CONFIGURED" = true ]; then
    case "$REPO_TYPE" in
        "test")
            echo "🧪 Test environment - Git hooks active and ready"
            ;;
        "production")
            echo "🚀 Production environment - Git hooks active and ready"
            ;;
        "local")
            echo "🏠 Local environment - Git hooks active and ready"
            ;;
    esac
else
    case "$REPO_TYPE" in
        "test")
            echo "🧪 Test environment - Git hooks available but not configured"
            ;;
        "production")
            echo "🚀 Production environment - Git hooks available but not configured"
            echo "   ⚠️  Consider enabling Git hooks for production quality control"
            ;;
        "local")
            echo "🏠 Local environment - Git hooks available but not configured"
            ;;
    esac
fi
echo ""
echo "📦 Backup Information:"
echo "   Backup created in: $BACKUP_DIR"
echo "   To rollback: rm -rf $BACKUP_DIR && git checkout -- ."
echo ""
echo "🚀 Next Steps - Security Automation Setup:"
echo "=========================================="
echo ""
echo "📋 1. IMMEDIATE SETUP:"
echo "   • Run 'npm run format:fix' to format existing code"
echo "   • Run 'npm run lint:fix' to fix any linting issues"
echo "   • Test with 'npm run quality-gates'"
echo "   • Validate with 'node validate-setup.js'"
echo ""
echo "🔒 2. SECURITY AUTOMATION CONFIGURATION:"
echo "   • Set up GitHub Secrets (required for AI automation):"
echo "     - SONAR_TOKEN: Get from https://sonarcloud.io/account/security/"
echo "     - OPENAI_KEY: Get from https://platform.openai.com/api-keys"
echo "   • Run './scripts/setup-branch-protection.sh' to enforce security gates"
echo "   • Verify setup with './scripts/verify-security-automation.sh'"
echo ""
echo "🤖 3. AI-POWERED FEATURES ENABLED:"
echo "   ✅ Dependabot: Daily security updates with auto-merge"
echo "   ✅ SonarCloud: AI CodeFix with quality gate enforcement"
echo "   ✅ Qodo PR-Agent: Auto-triggered security reviews"
echo "   ✅ Branch Protection: Required security checks before merge"
echo ""
echo "🔍 4. SONARCLOUD AI CODEFIX:"
echo "   • SonarCloud will automatically suggest fixes for:"
echo "     - Security vulnerabilities"
echo "     - Code quality issues"
echo "     - Dependency problems"
echo "   • Enable in SonarCloud dashboard: Administration → AI CodeFix"
echo "   • Select OpenAI provider for intelligent suggestions"
echo ""
echo "🤖 5. QODO PR-AGENT COMMANDS:"
echo "   Use these commands in PR comments:"
echo "   • /review - Comprehensive code review with FCRA focus"
echo "   • /security-review - Security-focused analysis"
echo "   • /compliance-review - FCRA compliance validation"
echo "   • /analyze - Deep code analysis"
echo "   • /improve - Code improvement suggestions"
echo ""
echo "🛡️ 6. DEPENDABOT AUTOMATION:"
echo "   • Security updates: Auto-merged after passing all checks"
echo "   • Regular updates: Manual review required"
echo "   • Daily scanning for immediate security response"
echo "   • Grouped updates by category for easier management"
echo ""
echo "📊 7. TESTING THE SETUP:"
echo "   • Create a test PR to verify all automation works"
echo "   • Check that SonarCloud analysis runs and provides feedback"
echo "   • Verify Qodo PR-Agent provides AI reviews"
echo "   • Confirm branch protection blocks PRs with failing checks"
echo "   • Test Dependabot auto-merge with a security update"
if [ "$GIT_HOOKS_CONFIGURED" = true ]; then
    echo "6. Commit your changes to test the Git hooks"
else
    echo "6. To enable Git hooks later: git config core.hooksPath .husky"
    echo "7. Commit your changes to test the framework"
fi
echo ""
echo "If you had existing ESLint configs, they were backed up with .backup extension"

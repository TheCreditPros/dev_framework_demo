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
find . \( -name "*.js" -o -name "*.jsx" \) -print0 \
  | xargs -0 -I {} sh -c '[ -f "$1" ] && convert_quotes_smart "$1"' _ {}

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
echo "Next steps:"
echo "1. Run 'npm run format:fix' to format existing code"
echo "2. Run 'npm run lint:fix' to fix any linting issues"
echo "3. Test with 'npm run quality-gates'"
echo "4. Validate with 'node validate-setup.js'"
if [ "$GIT_HOOKS_CONFIGURED" = true ]; then
    echo "5. Commit your changes to test the Git hooks"
else
    echo "5. To enable Git hooks later: git config core.hooksPath .husky"
    echo "6. Commit your changes to test the framework"
fi
echo ""
echo "If you had existing ESLint configs, they were backed up with .backup extension"

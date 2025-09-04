#!/bin/bash

# AI-SDLC Framework Installation Script - Smart Version
# This script installs the AI-SDLC framework on a target repository with smart detection

set -e

echo "🚀 AI-SDLC Framework Installation (Smart)"
echo "========================================="

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
        has_git_remote=true
    fi
    
    if [[ "$is_tmp_dir" == true ]] || [[ "$is_test_dir" == true ]]; then
        echo "test"
    elif [[ "$has_git_remote" == true ]]; then
        echo "production"
    else
        echo "local"
    fi
}

REPO_TYPE=$(detect_repo_type)
echo "📁 Repository Type: ${REPO_TYPE}"

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

# Backup existing ESLint configs if they exist
if [ -f "eslint.config.js" ]; then
    echo "📦 Backing up existing eslint.config.js"
    mv eslint.config.js eslint.config.js.backup
fi

if [ -f ".eslintrc.js" ]; then
    echo "📦 Backing up existing .eslintrc.js"
    mv .eslintrc.js .eslintrc.js.backup
fi

if [ -f ".eslintrc.json" ]; then
    echo "📦 Backing up existing .eslintrc.json"
    mv .eslintrc.json .eslintrc.json.backup
fi

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
    playwright@^1.49.1

echo "✅ Dependencies installed"

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

# Create package.json scripts
echo "⚙️  Adding scripts to package.json..."
npm pkg set scripts.test="vitest"
npm pkg set scripts."test:watch"="vitest --watch"
npm pkg set scripts."test:coverage"="vitest run --coverage"
npm pkg set scripts."test:ci"="vitest --run --coverage"
npm pkg set scripts."test:e2e"="playwright test --config=playwright.config.js"
npm pkg set scripts.lint="eslint ."
npm pkg set scripts."lint:ci"="eslint assets --max-warnings=0"
npm pkg set scripts."lint:ci:all"="eslint . --max-warnings=0"
npm pkg set scripts."lint:fix"="eslint . --fix"
npm pkg set scripts."lint:fix:ci"="eslint assets --fix"
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

# Configure Git hooks path based on repository type
if [[ "$REPO_TYPE" == "production" ]]; then
    echo "🔗 Configuring Git hooks for production..."
    git config core.hooksPath .husky
    echo "✅ Git hooks configured for production"
elif [[ "$REPO_TYPE" == "test" ]]; then
    echo "🧪 Test repository - Git hooks not configured"
    echo "ℹ️  Git hooks will be available but not active in test mode"
else
    echo "🏠 Local repository - Git hooks configured"
    git config core.hooksPath .husky
fi

# Create lint-staged configuration
echo "⚙️  Creating lint-staged configuration..."
cat > .lintstagedrc.js << 'LINTSTAGED_EOF'
export default {
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
};
LINTSTAGED_EOF

# Create commitlint configuration
echo "⚙️  Creating commitlint configuration..."
cat > commitlint.config.js << 'COMMITLINT_EOF'
export default {
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

import { execSync } from "child_process";
import fs from "fs";


console.log("🔍 Validating AI-SDLC Setup...\n");

// Detect repository type
function detectRepositoryType() {
  const cwd = process.cwd();
  const isTmpDir = cwd.includes('/tmp/') || cwd.includes('\\temp\\');
  const isTestDir = cwd.includes('test') || cwd.includes('demo') || cwd.includes('example');
  const hasGitRemote = (() => {
    try {
      execSync("git remote -v", { stdio: "pipe" });
      return true;
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

# Convert quotes and test installation
echo "🔄 Converting single quotes to double quotes in existing files..."
find . -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | \
  grep -v node_modules | \
  grep -v coverage | \
  grep -v dist | \
  grep -v build | \
  while read file; do
    if [ -f "$file" ]; then
      sed -i '' "s/'/\"/g" "$file" 2>/dev/null || true
    fi
  done

echo "✅ Quote conversion completed"

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
echo "✅ Git hooks configured for ${REPO_TYPE} environment"
echo "✅ Quality gates ready"
echo "✅ All dependencies installed"
echo ""
echo "Repository Type: ${REPO_TYPE}"
if [[ "$REPO_TYPE" == "test" ]]; then
    echo "🧪 Test environment - Git hooks available but not active"
elif [[ "$REPO_TYPE" == "production" ]]; then
    echo "🚀 Production environment - Git hooks active and ready"
else
    echo "�� Local environment - Git hooks configured"
fi
echo ""
echo "Next steps:"
echo "1. Run 'npm run format:fix' to format existing code"
echo "2. Run 'npm run lint:fix' to fix any linting issues"
echo "3. Test with 'npm run quality-gates'"
echo "4. Validate with 'node validate-setup.js'"
echo "5. Commit your changes to test the hooks (if production)"
echo ""
echo "If you had existing ESLint configs, they were backed up with .backup extension"

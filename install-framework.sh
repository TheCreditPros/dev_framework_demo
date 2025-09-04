#!/bin/bash

# AI-SDLC Framework Installation Script
# This script installs the AI-SDLC framework on a target repository

set -e

echo "🚀 AI-SDLC Framework Installation"
echo "=================================="

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

# Create ESLint configuration
echo "⚙️  Creating ESLint configuration..."
cat > eslint.config.mjs << 'EOF'
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
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "no-unused-vars": "off",
      "prefer-const": "warn",
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
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "prefer-const": "warn",
      "no-var": "error",
      "no-useless-escape": "warn",
      "quotes": ["error", "double"],
    },
  },
];
EOF

# Create Prettier configuration
echo "⚙️  Creating Prettier configuration..."
cat > .prettierrc << 'EOF'
{
  "singleQuote": false,
  "semi": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "endOfLine": "lf"
}
EOF

# Create package.json scripts if they don't exist
echo "⚙️  Adding scripts to package.json..."

# Add scripts to package.json
npm pkg set scripts.test="vitest"
npm pkg set scripts."test:watch"="vitest --watch"
npm pkg set scripts."test:coverage"="vitest run --coverage"
npm pkg set scripts."test:ci"="vitest --run --coverage"
npm pkg set scripts."test:e2e"="playwright test --config=playwright.config.js"
npm pkg set scripts.lint="eslint ."
npm pkg set scripts."lint:ci"="eslint src tests/unit --max-warnings=0"
npm pkg set scripts."lint:fix"="eslint . --fix"
npm pkg set scripts."lint:security"="eslint . --max-warnings=0"
npm pkg set scripts.format="prettier --check '**/*.{js,jsx,ts,tsx,json,md}'"
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
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
npx lint-staged
EOF

# Create commit-msg hook
cat > .husky/commit-msg << 'EOF'
#!/usr/bin/env sh
npx --no -- commitlint --edit "$1"
EOF

# Create pre-push hook
cat > .husky/pre-push << 'EOF'
#!/usr/bin/env sh
npm run pre-push
EOF

# Make hooks executable
chmod +x .husky/*

# Configure Git hooks path
git config core.hooksPath .husky

echo "✅ Git hooks configured"

# Create lint-staged configuration
echo "⚙️  Creating lint-staged configuration..."
cat > .lintstagedrc.js << 'EOF'
export default {
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
};
EOF

# Create commitlint configuration
echo "⚙️  Creating commitlint configuration..."
cat > commitlint.config.js << 'EOF'
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
EOF

# Create quality gates script
echo "⚙️  Creating quality gates script..."
mkdir -p scripts
cat > scripts/local-quality-gates.sh << 'EOF'
#!/bin/bash

echo "🚀 Essential Quality Gates"
echo "========================="

# Dependencies check
echo "🔍 Dependencies"
if npm ci --dry-run > /dev/null 2>&1; then
    echo "✅ Dependencies"
else
    echo "❌ Dependencies - Run 'npm install' to fix"
    exit 1
fi

# Linting
echo "🔍 Linting"
if npm run lint:ci > /dev/null 2>&1; then
    echo "✅ Linting"
else
    echo "❌ Linting - Run 'npm run lint:fix' to fix"
    exit 1
fi

# Formatting
echo "🔍 Formatting"
if npm run format > /dev/null 2>&1; then
    echo "✅ Formatting"
else
    echo "❌ Formatting - Run 'npm run format:fix' to fix"
    exit 1
fi

# TypeScript
echo "🔍 TypeScript"
if npm run type-check > /dev/null 2>&1; then
    echo "✅ TypeScript"
else
    echo "❌ TypeScript - Fix type errors"
    exit 1
fi

# Tests
echo "🔍 Tests"
if npm run test:ci > /dev/null 2>&1; then
    echo "✅ Tests"
else
    echo "❌ Tests - Fix failing tests"
    exit 1
fi

# Build
echo "🔍 Build"
if npm run build > /dev/null 2>&1; then
    echo "✅ Build"
else
    echo "❌ Build - Fix build errors"
    exit 1
fi

echo ""
echo "🎉 All essential checks passed!"
echo "✅ Ready to push"
EOF

chmod +x scripts/local-quality-gates.sh

echo "✅ Quality gates script created"

# Test the installation
echo "🧪 Testing installation..."

# Test ESLint with double quotes
echo "Testing ESLint configuration..."
if npm run lint > /dev/null 2>&1; then
    echo "✅ ESLint working correctly"
else
    echo "⚠️  ESLint has issues - check configuration"
fi

# Test Prettier
echo "Testing Prettier configuration..."
if npm run format > /dev/null 2>&1; then
    echo "✅ Prettier working correctly"
else
    echo "⚠️  Prettier has issues - check configuration"
fi

echo ""
echo "🎉 AI-SDLC Framework Installation Complete!"
echo "=========================================="
echo ""
echo "✅ ESLint configured for DOUBLE QUOTES"
echo "✅ Prettier configured for DOUBLE QUOTES"
echo "✅ Git hooks configured"
echo "✅ Quality gates ready"
echo "✅ All dependencies installed"
echo ""
echo "Next steps:"
echo "1. Run 'npm run format:fix' to format existing code"
echo "2. Run 'npm run lint:fix' to fix any linting issues"
echo "3. Test with 'npm run quality-gates'"
echo "4. Commit your changes to test the hooks"
echo ""
echo "If you had existing ESLint configs, they were backed up with .backup extension"

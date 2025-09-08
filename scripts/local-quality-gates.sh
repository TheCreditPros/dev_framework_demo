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

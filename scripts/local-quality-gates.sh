#!/bin/bash

# 🚀 Local Quality Gates Script
# Validates code quality locally before deployment

set -euo pipefail

### COLORS
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

### FUNCTIONS
print_header() {
    echo -e "${BLUE}🚀 Essential Quality Gates${NC}"
    echo -e "${BLUE}$(printf '%.0s=' {1..25})${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

### MAIN SCRIPT
OVERALL_STATUS=0

print_header

# Dependencies
echo "🔍 Dependencies"
if npm ci --dry-run > /dev/null 2>&1; then
    print_success "Dependencies"
else
    print_error "Dependencies - Fix dependency issues"
    OVERALL_STATUS=1
fi

# Linting
echo "🔍 Linting"
if npm run lint:ci > /dev/null 2>&1; then
    print_success "Linting"
else
    print_error "Linting - Fix linting errors"
    OVERALL_STATUS=1
fi

# Formatting
echo "🔍 Formatting"
if npm run format:check > /dev/null 2>&1; then
    print_success "Formatting"
else
    print_error "Formatting - Fix formatting issues"
    OVERALL_STATUS=1
fi

# TypeScript
echo "🔍 TypeScript"
if npm run type-check > /dev/null 2>&1; then
    print_success "TypeScript"
else
    print_error "TypeScript - Fix type errors"
    OVERALL_STATUS=1
fi

# Tests
echo "🔍 Unit Tests"
if npm run test:coverage > /dev/null 2>&1; then
    print_success "Unit Tests"
else
    print_error "Unit Tests - Fix failing tests"
    OVERALL_STATUS=1
fi

# Build
echo "🔍 Build"
if npm run build > /dev/null 2>&1; then
    print_success "Build"
else
    print_error "Build - Fix build issues"
    OVERALL_STATUS=1
fi

# Security Audit
echo "🔍 Security Audit"
if npm audit --audit-level=moderate > /dev/null 2>&1; then
    print_success "Security Audit"
else
    print_warning "Security Audit - Review security issues"
    # Don't fail on security audit - it's informational
fi

echo ""

# Final status
if [ $OVERALL_STATUS -eq 0 ]; then
    echo -e "${GREEN}🎉 All essential checks passed!${NC}"
    echo -e "${GREEN}✅ Ready to push${NC}"
    exit 0
else
    echo -e "${RED}⚠️ Some checks failed${NC}"
    echo -e "${RED}💡 Fix the issues above before pushing${NC}"
    exit 1
fi

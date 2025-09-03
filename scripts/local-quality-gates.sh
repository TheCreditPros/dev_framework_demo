#!/bin/bash

# Local Quality Gates - Same as CI/CD Pipeline
# Run this before pushing to ensure all gates pass

set -e

# Colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
NC="\033[0m"

echo_color() {
  echo -e "${1}${2}${NC}"
}

echo_color $BLUE "🚀 Running Local Quality Gates (Same as CI/CD)"
echo_color $BLUE "=============================================="

# Track failures
FAILURES=0

# Function to run a check and track failures
run_check() {
  local check_name="$1"
  local command="$2"
  
  echo_color $YELLOW "🔍 Running: $check_name"
  if eval "$command"; then
    echo_color $GREEN "✅ $check_name: PASSED"
  else
    echo_color $RED "❌ $check_name: FAILED"
    ((FAILURES++))
  fi
  echo ""
}

# 1. LINTING CHECKS
echo_color $BLUE "📋 Phase 1: Code Quality & Linting"
echo_color $BLUE "=================================="

run_check "ESLint Check" "npm run lint:ci"
run_check "Code Formatting Check" "npm run format"

# 2. TYPE CHECKING
echo_color $BLUE "📋 Phase 2: Type Safety"
echo_color $BLUE "======================"

run_check "TypeScript Type Check" "npm run type-check"

# 3. SECURITY CHECKS
echo_color $BLUE "📋 Phase 3: Security"
echo_color $BLUE "==================="

run_check "Security Audit" "npm audit --audit-level=moderate"

# 4. TESTING
echo_color $BLUE "📋 Phase 4: Testing"
echo_color $BLUE "=================="

run_check "Unit Tests" "npm run test:ci"
run_check "Test Coverage" "npm run test:coverage"

# 5. BUILD VERIFICATION
echo_color $BLUE "📋 Phase 5: Build Verification"
echo_color $BLUE "=============================="

run_check "Build Check" "npm run build"

# 6. GIT STATUS CHECK
echo_color $BLUE "📋 Phase 6: Git Status"
echo_color $BLUE "====================="

run_check "Git Status Clean" "test -z \"$(git status --porcelain)\""

# SUMMARY
echo_color $BLUE "📊 Quality Gates Summary"
echo_color $BLUE "========================"

if [ $FAILURES -eq 0 ]; then
  echo_color $GREEN "🎉 ALL QUALITY GATES PASSED!"
  echo_color $GREEN "✅ Ready to push to remote repository"
  echo_color $GREEN "✅ CI/CD pipeline should pass"
  exit 0
else
  echo_color $RED "❌ $FAILURES QUALITY GATE(S) FAILED"
  echo_color $RED "🚫 DO NOT PUSH - Fix issues first"
  echo_color $YELLOW "💡 Run individual commands to debug:"
  echo_color $YELLOW "   npm run lint:ci"
  echo_color $YELLOW "   npm run format"
  echo_color $YELLOW "   npm run type-check"
  echo_color $YELLOW "   npm audit --audit-level=moderate"
  echo_color $YELLOW "   npm run test:ci"
  echo_color $YELLOW "   npm run test:coverage"
  echo_color $YELLOW "   npm run build"
  exit 1
fi

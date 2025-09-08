#!/bin/bash

# Essential Quality Gates - Fast & Focused
# Only the checks that actually block CI

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

echo_color $BLUE "🚀 Essential Quality Gates"
echo_color $BLUE "========================="

# Track failures
FAILURES=0

# Function to run a check and track failures
run_check() {
  local check_name="$1"
  local command="$2"

  echo_color $YELLOW "🔍 $check_name"
  if eval "$command"; then
    echo_color $GREEN "✅ $check_name"
  else
    echo_color $RED "❌ $check_name"
    ((FAILURES++))
  fi
}

# ESSENTIAL CHECKS ONLY (the ones that actually block CI)
run_check "Dependencies" "npm ci --dry-run"
run_check "Linting" "npm run lint:ci"
run_check "Formatting" "npm run format"
run_check "TypeScript" "npm run type-check"
run_check "Tests" "npm run test:ci"
run_check "Build" "npm run build"

echo ""

# SUMMARY
if [ $FAILURES -eq 0 ]; then
  echo_color $GREEN "🎉 All essential checks passed!"
  echo_color $GREEN "✅ Ready to push"
  exit 0
else
  echo_color $RED "❌ $FAILURES check(s) failed"
  echo_color $RED "🚫 Fix issues before pushing"
  exit 1
fi

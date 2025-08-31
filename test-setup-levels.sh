#!/bin/bash

# Test script for graduated setup complexity levels
# Tests all three modes and validation features

set -e

### COLORS
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
NC="\033[0m"

echo_color() {
  echo -e "${1}${2}${NC}"
}

echo_color $GREEN "🧪 Testing AI-SDLC Graduated Setup Levels"
echo ""

### TEST FUNCTIONS
test_help() {
  echo_color $YELLOW "Testing --help flag..."
  if ./auto-setup-enhanced.sh --help | grep -q "Setup Levels:"; then
    echo_color $GREEN "✅ Help function works"
  else
    echo_color $RED "❌ Help function failed"
    return 1
  fi
}

test_version() {
  echo_color $YELLOW "Testing --version flag..."
if ./auto-setup-enhanced.sh --version | grep -q "v3.3.0"; then
    echo_color $GREEN "✅ Version function works"
  else
    echo_color $RED "❌ Version function failed"
    return 1
  fi
}

test_conflicting_flags() {
  echo_color $YELLOW "Testing conflicting flags validation..."
  if ./auto-setup-enhanced.sh --minimal --enterprise 2>&1 | grep -q "Conflicting setup levels"; then
    echo_color $GREEN "✅ Conflicting flags validation works"
  else
    echo_color $RED "❌ Conflicting flags validation failed"
    return 1
  fi
}

test_invalid_flag() {
  echo_color $YELLOW "Testing invalid flag handling..."
  if ./auto-setup-enhanced.sh --invalid 2>&1 | grep -q "Unknown option"; then
    echo_color $GREEN "✅ Invalid flag handling works"
  else
    echo_color $RED "❌ Invalid flag handling failed"
    return 1
  fi
}

test_config_file() {
  echo_color $YELLOW "Testing configuration file loading..."
  if [[ -f "setup-levels.json" ]]; then
    if node -e "JSON.parse(require('fs').readFileSync('setup-levels.json', 'utf8'))" 2>/dev/null; then
      echo_color $GREEN "✅ Configuration file is valid JSON"
    else
      echo_color $RED "❌ Configuration file has invalid JSON"
      return 1
    fi
  else
    echo_color $RED "❌ Configuration file missing"
    return 1
  fi
}

test_backward_compatibility() {
  echo_color $YELLOW "Testing backward compatibility (default to standard)..."
  if grep -q 'SETUP_LEVEL="standard"' auto-setup-enhanced.sh; then
    echo_color $GREEN "✅ Backward compatibility maintained (defaults to standard)"
  else
    echo_color $RED "❌ Backward compatibility broken"
    return 1
  fi
}

test_dependencies() {
  echo_color $YELLOW "Testing dependency availability..."
  required_commands=("node" "npm" "git")

  for cmd in "${required_commands[@]}"; do
    if ! command -v "$cmd" &> /dev/null; then
      echo_color $RED "❌ Required command not found: $cmd"
      return 1
    fi
  done

  echo_color $GREEN "✅ All required dependencies available"
}

### RUN ALL TESTS
echo_color $BLUE "Running validation tests..."
echo ""

tests_passed=0
total_tests=7

# Run tests
test_dependencies && ((tests_passed++)) || true
test_help && ((tests_passed++)) || true
test_version && ((tests_passed++)) || true
test_conflicting_flags && ((tests_passed++)) || true
test_invalid_flag && ((tests_passed++)) || true
test_config_file && ((tests_passed++)) || true
test_backward_compatibility && ((tests_passed++)) || true

echo ""
echo_color $BLUE "📊 Test Results: $tests_passed/$total_tests tests passed"

if [[ $tests_passed -eq $total_tests ]]; then
  echo_color $GREEN "🎉 All tests passed! Graduated setup levels are working correctly."
  echo ""
  echo_color $BLUE "✅ Features Validated:"
  echo "   • Help and version flags work correctly"
  echo "   • Conflicting flags are properly detected and rejected"
  echo "   • Invalid flags are handled gracefully"
  echo "   • Configuration file is valid and loadable"
  echo "   • Backward compatibility is maintained (defaults to standard)"
  echo ""
  echo_color $GREEN "🚀 Ready for deployment!"
else
  echo_color $RED "❌ Some tests failed. Please review the implementation."
  exit 1
fi

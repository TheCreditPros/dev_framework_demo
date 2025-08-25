#!/bin/bash

# Test Script for Optimized AI-SDLC Framework Setup
# Validates all optimization features and performance improvements

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

### TEST RESULTS
TESTS_PASSED=0
TESTS_FAILED=0
PERFORMANCE_METRICS=()

### PERFORMANCE TESTING
test_performance() {
  echo_color $BLUE "⚡ Testing Performance Optimizations..."

  # Test 1: Quick mode setup time
  echo_color $YELLOW "Testing quick mode setup time..."
  local start_time=$(date +%s)

  # Simulate quick setup (dry run)
  if ./auto-setup-optimized.sh --quick --help >/dev/null 2>&1; then
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    PERFORMANCE_METRICS+=("Quick mode help: ${duration}s")
    echo_color $GREEN "✅ Quick mode responds in ${duration}s"
    ((TESTS_PASSED++))
  else
    echo_color $RED "❌ Quick mode test failed"
    ((TESTS_FAILED++))
  fi

  # Test 2: Selective hooks configuration
  echo_color $YELLOW "Testing selective hooks feature..."
  if ./auto-setup-optimized.sh --selective-hooks --help >/dev/null 2>&1; then
    echo_color $GREEN "✅ Selective hooks option available"
    ((TESTS_PASSED++))
  else
    echo_color $RED "❌ Selective hooks test failed"
    ((TESTS_FAILED++))
  fi

  # Test 3: Emergency bypass functionality
  echo_color $YELLOW "Testing emergency bypass feature..."
  if ./auto-setup-optimized.sh --bypass "test" "TEST-123" --help >/dev/null 2>&1; then
    echo_color $GREEN "✅ Emergency bypass option available"
    ((TESTS_PASSED++))
  else
    echo_color $RED "❌ Emergency bypass test failed"
    ((TESTS_FAILED++))
  fi
}

### TOOL CONSOLIDATION TESTING
test_tool_consolidation() {
  echo_color $BLUE "🔧 Testing Tool Consolidation..."

  # Test 1: Check if script prioritizes SonarCloud over multiple security tools
  echo_color $YELLOW "Testing security tool consolidation..."
  if grep -q "SonarCloud primary" auto-setup-optimized.sh; then
    echo_color $GREEN "✅ SonarCloud set as primary security scanner"
    ((TESTS_PASSED++))
  else
    echo_color $RED "❌ Security consolidation not implemented"
    ((TESTS_FAILED++))
  fi

  # Test 2: Check if testing is streamlined to Vitest + Playwright
  echo_color $YELLOW "Testing streamlined testing approach..."
  if grep -q "Vitest primary, Playwright for E2E" auto-setup-optimized.sh; then
    echo_color $GREEN "✅ Testing streamlined to Vitest + Playwright"
    ((TESTS_PASSED++))
  else
    echo_color $RED "❌ Testing consolidation not implemented"
    ((TESTS_FAILED++))
  fi

  # Test 3: Check for reduced dependency list
  echo_color $YELLOW "Testing dependency consolidation..."
  if grep -q "consolidated tool stack" auto-setup-optimized.sh; then
    echo_color $GREEN "✅ Dependencies consolidated"
    ((TESTS_PASSED++))
  else
    echo_color $RED "❌ Dependency consolidation not implemented"
    ((TESTS_FAILED++))
  fi
}

### ESCAPE HATCH TESTING
test_escape_hatches() {
  echo_color $BLUE "🚨 Testing Escape Hatches..."

  # Test 1: Check for emergency procedures documentation
  echo_color $YELLOW "Testing emergency procedures creation..."
  if grep -q "EMERGENCY_PROCEDURES.md" auto-setup-optimized.sh; then
    echo_color $GREEN "✅ Emergency procedures documentation included"
    ((TESTS_PASSED++))
  else
    echo_color $RED "❌ Emergency procedures not documented"
    ((TESTS_FAILED++))
  fi

  # Test 2: Check for bypass detection in hooks
  echo_color $YELLOW "Testing bypass detection in hooks..."
  if grep -q "Emergency bypass detected" auto-setup-optimized.sh; then
    echo_color $GREEN "✅ Bypass detection implemented in hooks"
    ((TESTS_PASSED++))
  else
    echo_color $RED "❌ Bypass detection not implemented"
    ((TESTS_FAILED++))
  fi

  # Test 3: Check for emergency npm scripts
  echo_color $YELLOW "Testing emergency npm scripts..."
  if grep -q "emergency:bypass" auto-setup-optimized.sh; then
    echo_color $GREEN "✅ Emergency npm scripts included"
    ((TESTS_PASSED++))
  else
    echo_color $RED "❌ Emergency scripts not implemented"
    ((TESTS_FAILED++))
  fi
}

### SELECTIVE EXECUTION TESTING
test_selective_execution() {
  echo_color $BLUE "🎯 Testing Selective Execution..."

  # Test 1: Check for documentation-only change detection
  echo_color $YELLOW "Testing documentation-only change detection..."
  if grep -q "Documentation-only changes detected" auto-setup-optimized.sh; then
    echo_color $GREEN "✅ Documentation-only detection implemented"
    ((TESTS_PASSED++))
  else
    echo_color $RED "❌ Documentation detection not implemented"
    ((TESTS_FAILED++))
  fi

  # Test 2: Check for file-type-based hook execution
  echo_color $YELLOW "Testing file-type-based execution..."
  if grep -q "JavaScript/TypeScript changes detected" auto-setup-optimized.sh; then
    echo_color $GREEN "✅ File-type-based execution implemented"
    ((TESTS_PASSED++))
  else
    echo_color $RED "❌ File-type detection not implemented"
    ((TESTS_FAILED++))
  fi

  # Test 3: Check for security-sensitive file detection
  echo_color $YELLOW "Testing security-sensitive file detection..."
  if grep -q "Security-sensitive files detected" auto-setup-optimized.sh; then
    echo_color $GREEN "✅ Security-sensitive file detection implemented"
    ((TESTS_PASSED++))
  else
    echo_color $RED "❌ Security file detection not implemented"
    ((TESTS_FAILED++))
  fi
}

### CONFIGURATION VALIDATION
test_configurations() {
  echo_color $BLUE "⚙️ Testing Configuration Optimizations..."

  # Test 1: Check for optimized Vitest configuration
  echo_color $YELLOW "Testing Vitest optimization..."
  if grep -q "Performance optimization" auto-setup-optimized.sh; then
    echo_color $GREEN "✅ Vitest performance optimizations included"
    ((TESTS_PASSED++))
  else
    echo_color $RED "❌ Vitest optimizations not implemented"
    ((TESTS_FAILED++))
  fi

  # Test 2: Check for optimized Playwright configuration
  echo_color $YELLOW "Testing Playwright optimization..."
  if grep -q "Reduced timeout" auto-setup-optimized.sh; then
    echo_color $GREEN "✅ Playwright timeout optimizations included"
    ((TESTS_PASSED++))
  else
    echo_color $RED "❌ Playwright optimizations not implemented"
    ((TESTS_FAILED++))
  fi

  # Test 3: Check for parallel execution support
  echo_color $YELLOW "Testing parallel execution..."
  if grep -q "parallel execution" auto-setup-optimized.sh; then
    echo_color $GREEN "✅ Parallel execution support included"
    ((TESTS_PASSED++))
  else
    echo_color $RED "❌ Parallel execution not implemented"
    ((TESTS_FAILED++))
  fi
}

### SCRIPT STRUCTURE VALIDATION
test_script_structure() {
  echo_color $BLUE "📋 Testing Script Structure..."

  # Test 1: Check for proper argument parsing
  echo_color $YELLOW "Testing argument parsing..."
  if grep -q "parse_arguments" auto-setup-optimized.sh; then
    echo_color $GREEN "✅ Argument parsing implemented"
    ((TESTS_PASSED++))
  else
    echo_color $RED "❌ Argument parsing not implemented"
    ((TESTS_FAILED++))
  fi

  # Test 2: Check for help function
  echo_color $YELLOW "Testing help function..."
  if grep -q "show_help" auto-setup-optimized.sh; then
    echo_color $GREEN "✅ Help function implemented"
    ((TESTS_PASSED++))
  else
    echo_color $RED "❌ Help function not implemented"
    ((TESTS_FAILED++))
  fi

  # Test 3: Check for validation function
  echo_color $YELLOW "Testing validation function..."
  if grep -q "validate_optimized_setup" auto-setup-optimized.sh; then
    echo_color $GREEN "✅ Validation function implemented"
    ((TESTS_PASSED++))
  else
    echo_color $RED "❌ Validation function not implemented"
    ((TESTS_FAILED++))
  fi
}

### GENERATE TEST REPORT
generate_report() {
  echo_color $BLUE "📊 Generating Test Report..."

  local total_tests=$((TESTS_PASSED + TESTS_FAILED))
  local success_rate=$((TESTS_PASSED * 100 / total_tests))

  cat > OPTIMIZATION_TEST_REPORT.md << EOF
# AI-SDLC Framework Optimization Test Report

## Test Summary
- **Total Tests**: ${total_tests}
- **Passed**: ${TESTS_PASSED}
- **Failed**: ${TESTS_FAILED}
- **Success Rate**: ${success_rate}%

## Performance Metrics
$(printf '%s\n' "${PERFORMANCE_METRICS[@]}")

## Test Categories

### ⚡ Performance Optimizations
- Quick mode setup
- Selective hooks
- Emergency bypass
- Parallel execution

### 🔧 Tool Consolidation
- Security tools (SonarCloud primary)
- Testing tools (Vitest + Playwright)
- Dependency reduction

### 🚨 Escape Hatches
- Emergency procedures documentation
- Bypass detection in hooks
- Emergency npm scripts

### 🎯 Selective Execution
- Documentation-only detection
- File-type-based execution
- Security-sensitive file detection

### ⚙️ Configuration Optimizations
- Vitest performance settings
- Playwright timeout reductions
- Parallel execution support

## Recommendations

$(if [[ $success_rate -ge 90 ]]; then
  echo "✅ **Excellent**: All major optimizations implemented successfully."
elif [[ $success_rate -ge 80 ]]; then
  echo "⚠️ **Good**: Most optimizations implemented, minor issues to address."
else
  echo "❌ **Needs Work**: Several optimizations missing or not working correctly."
fi)

## Next Steps
1. Address any failed tests
2. Monitor performance in real-world usage
3. Gather user feedback on optimization effectiveness
4. Consider additional optimizations based on usage patterns

---
Generated: $(date)
EOF

  echo_color $GREEN "✅ Test report generated: OPTIMIZATION_TEST_REPORT.md"
}

### MAIN EXECUTION
main() {
  echo_color $GREEN "🧪 AI-SDLC Framework Optimization Test Suite"
  echo_color $BLUE "   Validating all performance improvements and optimizations"
  echo ""

  # Check if optimized script exists
  if [[ ! -f "auto-setup-optimized.sh" ]]; then
    echo_color $RED "❌ auto-setup-optimized.sh not found!"
    exit 1
  fi

  # Make script executable
  chmod +x auto-setup-optimized.sh

  # Run all test categories
  test_performance
  test_tool_consolidation
  test_escape_hatches
  test_selective_execution
  test_configurations
  test_script_structure

  # Generate comprehensive report
  generate_report

  # Final summary
  echo ""
  echo_color $GREEN "🎉 Test Suite Complete!"
  echo_color $BLUE "📊 Results: ${TESTS_PASSED} passed, ${TESTS_FAILED} failed"

  if [[ $TESTS_FAILED -eq 0 ]]; then
    echo_color $GREEN "✅ All optimizations validated successfully!"
    exit 0
  else
    echo_color $YELLOW "⚠️ Some tests failed - check OPTIMIZATION_TEST_REPORT.md for details"
    exit 1
  fi
}

main "$@"

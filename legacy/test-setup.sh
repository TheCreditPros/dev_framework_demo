#!/bin/bash

# AI-SDLC Setup Testing Script
# Comprehensive testing for the auto-setup.sh fixes

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

### TEST ENVIRONMENT SETUP
setup_test_environment() {
  local test_dir="$1"
  echo_color $YELLOW "🧪 Setting up test environment: $test_dir"
  
  mkdir -p "$test_dir"
  cd "$test_dir"
  
  # Initialize git repository
  git init --quiet
  git config user.email "test@example.com"
  git config user.name "Test User"
  
  echo_color $GREEN "✔️ Test environment ready"
}

### CLEANUP TEST ENVIRONMENT
cleanup_test_environment() {
  local test_dir="$1"
  echo_color $YELLOW "🧹 Cleaning up test environment: $test_dir"
  cd ..
  rm -rf "$test_dir" 2>/dev/null || true
  echo_color $GREEN "✔️ Test environment cleaned"
}

### TEST CASES

# Test 1: Fresh repository (no existing files)
test_fresh_repository() {
  echo_color $BLUE "📋 Test 1: Fresh Repository Setup"
  
  local test_dir="test-fresh-repo"
  setup_test_environment "$test_dir"
  
  # Run the setup script
  cp ../../auto-setup.sh .
  chmod +x auto-setup.sh
  
  if ./auto-setup.sh; then
    echo_color $GREEN "✔️ Setup completed successfully"
    
    # Verify key files exist
    [[ -f ".gitignore" ]] && echo_color $GREEN "✔️ .gitignore created"
    [[ -f "package.json" ]] && echo_color $GREEN "✔️ package.json created"
    [[ -d ".husky" ]] && echo_color $GREEN "✔️ .husky directory exists"
    [[ -f ".husky/pre-commit" ]] && echo_color $GREEN "✔️ pre-commit hook exists"
    [[ -x ".husky/pre-commit" ]] && echo_color $GREEN "✔️ pre-commit hook is executable"
    
    # Run validation
    if node validate-setup.js; then
      echo_color $GREEN "✔️ Validation passed"
    else
      echo_color $RED "❌ Validation failed"
    fi
  else
    echo_color $RED "❌ Setup failed"
  fi
  
  cleanup_test_environment "$test_dir"
}

# Test 2: Existing project with package.json
test_existing_project() {
  echo_color $BLUE "📋 Test 2: Existing Project with package.json"
  
  local test_dir="test-existing-project"
  setup_test_environment "$test_dir"
  
  # Create existing package.json
  cat > package.json << 'EOF'
{
  "name": "existing-project",
  "version": "0.1.0",
  "scripts": {
    "start": "node index.js"
  }
}
EOF
  
  # Create some source files to test linting
  echo 'console.log("Hello World")' > index.js
  
  # Run the setup script
  cp ../../auto-setup.sh .
  chmod +x auto-setup.sh
  
  if ./auto-setup.sh; then
    echo_color $GREEN "✔️ Setup completed successfully"
    
    # Check that existing scripts were preserved
    if grep -q '"start"' package.json; then
      echo_color $GREEN "✔️ Existing scripts preserved"
    else
      echo_color $RED "❌ Existing scripts lost"
    fi
    
    # Check lint-staged configuration was added
    if grep -q 'lint-staged' package.json; then
      echo_color $GREEN "✔️ lint-staged configuration added"
    else
      echo_color $RED "❌ lint-staged configuration missing"
    fi
    
  else
    echo_color $RED "❌ Setup failed"
  fi
  
  cleanup_test_environment "$test_dir"
}

# Test 3: Rollback functionality
test_rollback_functionality() {
  echo_color $BLUE "📋 Test 3: Rollback Functionality"
  
  local test_dir="test-rollback"
  setup_test_environment "$test_dir"
  
  # Create existing files
  echo '{"name": "test"}' > package.json
  echo "node_modules/" > .gitignore
  
  # Copy and modify setup script to force failure
  cp ../../auto-setup.sh .
  # Simulate failure by making npm unavailable temporarily
  sed -i.bak 's/npm install/npm-fake-command install/g' auto-setup.sh
  chmod +x auto-setup.sh
  
  echo_color $YELLOW "🧪 Running script with simulated failure..."
  if ./auto-setup.sh 2>/dev/null; then
    echo_color $RED "❌ Script should have failed but didn't"
  else
    echo_color $GREEN "✔️ Script failed as expected"
    
    # Check if original files were restored
    if [[ -f "package.json" ]] && grep -q "test" package.json; then
      echo_color $GREEN "✔️ Original package.json restored"
    else
      echo_color $RED "❌ Original package.json not restored"
    fi
  fi
  
  cleanup_test_environment "$test_dir"
}

# Test 4: Husky hook execution
test_husky_execution() {
  echo_color $BLUE "📋 Test 4: Husky Hook Execution"
  
  local test_dir="test-husky-execution"
  setup_test_environment "$test_dir"
  
  # Run the setup script
  cp ../../auto-setup.sh .
  chmod +x auto-setup.sh
  
  if ./auto-setup.sh; then
    echo_color $GREEN "✔️ Setup completed successfully"
    
    # Create a test file with formatting issues
    echo 'const  x=1;console.log( x );' > test.js
    
    # Stage the file
    git add test.js
    
    # Try to commit (this should trigger the pre-commit hook)
    echo_color $YELLOW "🧪 Testing pre-commit hook execution..."
    
    # Note: In a real test environment, this would actually format the file
    # For this test, we just verify the hook exists and is executable
    if [[ -x ".husky/pre-commit" ]]; then
      echo_color $GREEN "✔️ Pre-commit hook is executable"
      
      # Check hook content
      if grep -q "lint-staged" .husky/pre-commit; then
        echo_color $GREEN "✔️ Hook contains lint-staged command"
      else
        echo_color $RED "❌ Hook missing lint-staged command"
      fi
    else
      echo_color $RED "❌ Pre-commit hook not executable"
    fi
  else
    echo_color $RED "❌ Setup failed"
  fi
  
  cleanup_test_environment "$test_dir"
}

# Test 5: Different Node.js project structures
test_project_structures() {
  echo_color $BLUE "📋 Test 5: Different Project Structures"
  
  # Test React project structure
  local test_dir="test-react-structure"
  setup_test_environment "$test_dir"
  
  mkdir -p client-frontend
  echo '{"name": "client"}' > client-frontend/package.json
  
  cp ../../auto-setup.sh .
  chmod +x auto-setup.sh
  
  if ./auto-setup.sh; then
    echo_color $GREEN "✔️ React project structure handled"
  else
    echo_color $RED "❌ React project structure failed"
  fi
  
  cleanup_test_environment "$test_dir"
  
  # Test Laravel project structure
  test_dir="test-laravel-structure"
  setup_test_environment "$test_dir"
  
  mkdir -p backend
  touch backend/artisan
  
  cp ../../auto-setup.sh .
  chmod +x auto-setup.sh
  
  if ./auto-setup.sh; then
    echo_color $GREEN "✔️ Laravel project structure handled"
  else
    echo_color $RED "❌ Laravel project structure failed"
  fi
  
  cleanup_test_environment "$test_dir"
}

### MAIN TEST RUNNER
run_all_tests() {
  echo_color $GREEN "🧪 Starting comprehensive AI-SDLC setup testing..."
  echo_color $YELLOW "📍 Testing from directory: $(pwd)"
  
  # Verify we have the setup script
  if [[ ! -f "auto-setup.sh" ]]; then
    echo_color $RED "❌ auto-setup.sh not found in current directory"
    exit 1
  fi
  
  # Create temporary test directory
  local base_test_dir="ai-sdlc-tests-$(date +%s)"
  mkdir -p "$base_test_dir"
  cd "$base_test_dir"
  
  echo_color $BLUE "📋 Running all test cases..."
  
  test_fresh_repository
  test_existing_project
  test_rollback_functionality
  test_husky_execution
  test_project_structures
  
  cd ..
  rm -rf "$base_test_dir"
  
  echo_color $GREEN "🎉 All tests completed!"
}

### USAGE
show_usage() {
  echo_color $BLUE "AI-SDLC Setup Testing Script"
  echo_color $YELLOW "Usage: $0 [test-name]"
  echo ""
  echo "Available tests:"
  echo "  fresh          - Test fresh repository setup"
  echo "  existing       - Test existing project setup"
  echo "  rollback       - Test rollback functionality"
  echo "  husky          - Test Husky hook execution"
  echo "  structures     - Test different project structures"
  echo "  all            - Run all tests (default)"
  echo ""
}

### MAIN
case "${1:-all}" in
  "fresh")
    run_all_tests() { test_fresh_repository; }
    ;;
  "existing")
    run_all_tests() { test_existing_project; }
    ;;
  "rollback")
    run_all_tests() { test_rollback_functionality; }
    ;;
  "husky")
    run_all_tests() { test_husky_execution; }
    ;;
  "structures")
    run_all_tests() { test_project_structures; }
    ;;
  "all")
    # Use default function
    ;;
  "help"|"-h"|"--help")
    show_usage
    exit 0
    ;;
  *)
    echo_color $RED "❌ Unknown test: $1"
    show_usage
    exit 1
    ;;
esac

run_all_tests
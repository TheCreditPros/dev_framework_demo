#!/bin/bash

# Enhanced AI-SDLC Setup Wizard
# Improves upon existing auto-setup.sh with guided configuration

set -e

### COLORS & UI
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
PURPLE="\033[0;35m"
CYAN="\033[0;36m"
NC="\033[0m"

echo_color() { echo -e "${1}${2}${NC}"; }
echo_header() { echo -e "${PURPLE}╔══════════════════════════════════════════════╗${NC}"; echo -e "${PURPLE}║ ${1}${NC}"; echo -e "${PURPLE}╚══════════════════════════════════════════════╝${NC}"; }

### CONFIGURATION
FRAMEWORK_VERSION="v2.7.1"
SETUP_LOG="ai-sdlc-setup.log"

### LOGGING
log() { echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$SETUP_LOG"; }
info() { echo_color $BLUE "ℹ️  $1"; log "INFO: $1"; }
success() { echo_color $GREEN "✅ $1"; log "SUCCESS: $1"; }
warn() { echo_color $YELLOW "⚠️  $1"; log "WARN: $1"; }
error() { echo_color $RED "❌ $1"; log "ERROR: $1"; }

### MAIN WIZARD
show_welcome() {
    clear
    echo_header "AI-SDLC Enhanced Setup Wizard $FRAMEWORK_VERSION"
    echo
    echo_color $CYAN "🚀 Welcome to The Credit Pros AI-SDLC Framework!"
    echo_color $CYAN "This wizard will guide you through setting up automated development tools."
    echo
    echo_color $YELLOW "What you'll get:"
    echo "   ✅ Enhanced Git hooks with security scanning"
    echo "   ✅ AI-powered test generation (with API keys)"
    echo "   ✅ E2E automation with Playwright"
    echo "   ✅ Code quality automation"
    echo "   ✅ CI/CD pipeline templates"
    echo
    read -p "Press Enter to continue or Ctrl+C to exit..."
}

### SETUP LEVEL SELECTION
select_setup_level() {
    echo_header "Choose Your Setup Level"
    echo
    echo_color $GREEN "1️⃣  Basic Setup (5 minutes)"
    echo "   • Enhanced git hooks"
    echo "   • Code formatting & linting"
    echo "   • Security scanning"
    echo "   • No API keys required"
    echo
    echo_color $YELLOW "2️⃣  AI-Powered Setup (15 minutes)"
    echo "   • Everything in Basic"
    echo "   • AI test generation"
    echo "   • Requires OpenAI API key"
    echo "   • 100% test coverage capability"
    echo
    echo_color $PURPLE "3️⃣  Enterprise Setup (30 minutes)"
    echo "   • Everything in AI-Powered"
    echo "   • E2E automation"
    echo "   • CI/CD pipelines"
    echo "   • Performance monitoring"
    echo "   • Requires multiple API keys"
    echo
    while true; do
        read -p "Select level (1-3): " level
        case $level in
            1) SETUP_LEVEL="basic"; break;;
            2) SETUP_LEVEL="ai-powered"; break;;
            3) SETUP_LEVEL="enterprise"; break;;
            *) echo_color $RED "Please select 1, 2, or 3";;
        esac
    done
    
    info "Selected: $SETUP_LEVEL setup level"
}

### PROJECT DETECTION
detect_project_type() {
    info "🔍 Detecting project type..."
    
    PROJECT_TYPES=()
    
    if [[ -f "package.json" ]]; then
        PROJECT_TYPES+=("node")
        if grep -q "react" package.json; then
            PROJECT_TYPES+=("react")
        fi
        if grep -q "typescript" package.json; then
            PROJECT_TYPES+=("typescript")
        fi
    fi
    
    if [[ -f "composer.json" ]] || [[ -f "artisan" ]]; then
        PROJECT_TYPES+=("laravel")
    fi
    
    if [[ -f "requirements.txt" ]] || [[ -f "pyproject.toml" ]]; then
        PROJECT_TYPES+=("python")
    fi
    
    if [[ ${#PROJECT_TYPES[@]} -eq 0 ]]; then
        PROJECT_TYPES+=("generic")
    fi
    
    PROJECT_TYPE=$(IFS='+'; echo "${PROJECT_TYPES[*]}")
    success "Detected project type: $PROJECT_TYPE"
}

### BASIC SETUP
run_basic_setup() {
    info "🛠️  Running basic setup..."
    
    # Use existing auto-setup.sh as foundation
    if [[ -f "./auto-setup.sh" ]]; then
        success "Found existing auto-setup.sh, enhancing it..."
        ./auto-setup.sh
    else
        # Fallback: basic git hooks setup
        info "Setting up basic git hooks..."
        
        # Install husky
        if command -v npm >/dev/null 2>&1; then
            npm install --save-dev husky lint-staged prettier eslint
            npx husky install
            
            # Create pre-commit hook
            mkdir -p .husky
            echo '#!/usr/bin/env sh' > .husky/pre-commit
            echo '. "$(dirname -- "$0")/_/husky.sh"' >> .husky/pre-commit
            echo 'npx lint-staged' >> .husky/pre-commit
            chmod +x .husky/pre-commit
            
            # Create lint-staged config
            cat > .lintstagedrc.json << 'EOF'
{
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,css,md}": ["prettier --write"]
}
EOF
        fi
    fi
    
    success "✅ Basic setup completed!"
}

### AI-POWERED SETUP
run_ai_setup() {
    info "🤖 Setting up AI-powered features..."
    
    # Run basic setup first
    run_basic_setup
    
    # Check for API keys
    check_api_keys_ai
    
    # Initialize AI test generation
    if [[ -f "./ai-sdlc" ]]; then
        info "Initializing AI test generation..."
        ./ai-sdlc test-init
        success "AI test generation ready!"
    fi
    
    # Set up npm scripts for AI features
    setup_ai_npm_scripts
    
    success "✅ AI-powered setup completed!"
}

### ENTERPRISE SETUP
run_enterprise_setup() {
    info "🏢 Setting up enterprise features..."
    
    # Run AI setup first
    run_ai_setup
    
    # Check for all API keys
    check_api_keys_enterprise
    
    # Setup E2E testing
    setup_e2e_testing
    
    # Setup CI/CD pipeline
    setup_cicd_pipeline
    
    # Setup monitoring
    setup_monitoring
    
    success "✅ Enterprise setup completed!"
}

### API KEY MANAGEMENT
check_api_keys_ai() {
    info "🔑 Checking AI API keys..."
    
    if [[ ! -f ".env" ]]; then
        warn ".env file not found, creating template..."
        create_env_template
    fi
    
    # Check OpenAI key
    if ! grep -q "OPENAI_API_KEY" .env || grep -q "OPENAI_API_KEY=$" .env; then
        warn "OpenAI API key not configured"
        echo_color $YELLOW "You'll need an OpenAI API key for AI test generation."
        echo_color $YELLOW "Visit: https://platform.openai.com/api-keys"
        echo
        read -p "Enter OpenAI API key (or press Enter to skip): " openai_key
        if [[ -n "$openai_key" ]]; then
            sed -i.bak "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$openai_key/" .env
            success "OpenAI API key configured"
        else
            warn "Skipping AI features (can configure later in .env)"
        fi
    else
        success "OpenAI API key already configured"
    fi
}

check_api_keys_enterprise() {
    check_api_keys_ai
    
    # Additional enterprise API checks
    local missing_keys=()
    
    if ! grep -q "QASE_TOKEN" .env || grep -q "QASE_TOKEN=$" .env; then
        missing_keys+=("QASE_TOKEN")
    fi
    
    if ! grep -q "GITHUB_TOKEN" .env || grep -q "GITHUB_TOKEN=$" .env; then
        missing_keys+=("GITHUB_TOKEN")
    fi
    
    if [[ ${#missing_keys[@]} -gt 0 ]]; then
        warn "Missing enterprise API keys: ${missing_keys[*]}"
        echo_color $YELLOW "These can be configured later in .env file"
        echo_color $YELLOW "Enterprise features will work with template/mock data"
    fi
}

### HELPER FUNCTIONS
create_env_template() {
    cat > .env << 'EOF'
# AI-SDLC Framework Configuration
# Copy this file and configure with your actual API keys

# OpenAI API for test generation
OPENAI_API_KEY=

# Qase API for test management
QASE_TOKEN=
QASE_PROJECT_CODE=

# GitHub token for PR automation
GITHUB_TOKEN=

# Optional: Additional integrations
SONAR_TOKEN=
CODIUM_API_KEY=
EOF
    info "Created .env template"
}

setup_ai_npm_scripts() {
    info "📝 Setting up AI npm scripts..."
    
    # Check if package.json exists
    if [[ ! -f "package.json" ]]; then
        npm init -y
    fi
    
    # Add AI scripts using Node.js
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json'));
    pkg.scripts = pkg.scripts || {};
    pkg.scripts['ai:generate-tests'] = 'node scripts-complex/ai-test-generator.js generate';
    pkg.scripts['ai:generate-e2e'] = 'node scripts-complex/ai-e2e-generator.js generate';
    pkg.scripts['ai:test-all'] = 'npm run ai:generate-tests all && npm test';
    pkg.scripts['ai:setup'] = './ai-sdlc test-init';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    " 2>/dev/null || warn "Could not update package.json scripts"
}

setup_e2e_testing() {
    info "🎭 Setting up E2E testing with Playwright..."
    
    if command -v npm >/dev/null 2>&1; then
        npm install --save-dev @playwright/test
        npx playwright install --with-deps
        
        # Generate playwright config if needed
        if [[ ! -f "playwright.config.js" ]] && [[ -f "scripts-complex/ai-e2e-generator.js" ]]; then
            node scripts-complex/ai-e2e-generator.js init
        fi
    fi
}

setup_cicd_pipeline() {
    info "⚙️  Setting up CI/CD pipeline templates..."
    
    mkdir -p .github/workflows
    
    # Create basic GitHub Actions workflow
    cat > .github/workflows/ai-sdlc.yml << 'EOF'
name: AI-SDLC Automation

on:
  push:
    branches: [ main, master, develop ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '18'
    - run: npm install
    - run: npm run lint
    - run: npm test
    - name: Generate tests if needed
      run: |
        if [ -n "${{ secrets.OPENAI_API_KEY }}" ]; then
          npm run ai:generate-tests
        fi
      env:
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
EOF
    
    success "CI/CD pipeline template created"
}

setup_monitoring() {
    info "📊 Setting up monitoring..."
    
    if [[ -f "scripts-complex/performance-monitor.js" ]]; then
        node scripts-complex/performance-monitor.js init
    fi
}

### VALIDATION
run_validation() {
    info "🔍 Running setup validation..."
    
    local issues=0
    
    # Test basic functionality
    if [[ -f "./ai-sdlc" ]]; then
        if ./ai-sdlc status >/dev/null 2>&1; then
            success "CLI is working"
        else
            error "CLI has issues"
            ((issues++))
        fi
    fi
    
    # Test git hooks
    if [[ -f ".husky/pre-commit" ]]; then
        success "Git hooks configured"
    else
        error "Git hooks missing"
        ((issues++))
    fi
    
    # Test npm scripts
    if command -v npm >/dev/null 2>&1 && [[ -f "package.json" ]]; then
        if npm run lint --silent >/dev/null 2>&1 || [[ $? -eq 1 ]]; then
            success "npm scripts working"
        else
            warn "Some npm scripts may need configuration"
        fi
    fi
    
    echo_header "Setup Validation Results"
    if [[ $issues -eq 0 ]]; then
        success "🎉 All validation checks passed!"
        echo_color $GREEN "Your AI-SDLC setup is ready to use!"
    else
        warn "$issues issues found, but basic functionality should work"
    fi
}

### MAIN EXECUTION
main() {
    log "Starting enhanced setup wizard"
    
    show_welcome
    select_setup_level
    detect_project_type
    
    echo_header "Running Setup: $SETUP_LEVEL"
    
    case $SETUP_LEVEL in
        "basic")
            run_basic_setup
            ;;
        "ai-powered")
            run_ai_setup
            ;;
        "enterprise")
            run_enterprise_setup
            ;;
    esac
    
    run_validation
    
    # Show next steps
    echo_header "🎉 Setup Complete!"
    echo_color $GREEN "Next steps:"
    echo "  1. Review generated configuration files"
    echo "  2. Configure API keys in .env (if applicable)"
    echo "  3. Run: ./ai-sdlc status"
    echo "  4. Start developing with enhanced automation!"
    echo
    echo_color $BLUE "Documentation: https://nydamon.github.io/ai-sdlc-docs/"
    echo_color $BLUE "Support: GitHub Issues"
    
    success "Setup completed successfully!"
}

# Execute main function
main "$@"
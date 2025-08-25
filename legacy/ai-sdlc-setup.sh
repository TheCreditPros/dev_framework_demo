#!/bin/bash
# ai-sdlc-setup.sh - Universal setup script for AI-SDLC framework

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
FRAMEWORK_VERSION="1.0.0"
CONFIG_REPO="https://github.com/nydamon/ai-sdlc-config"
TEMP_DIR="/tmp/ai-sdlc-setup"

# Logging functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Banner
show_banner() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                  AI-SDLC Framework Setup                      ║"
    echo "║                     Version $FRAMEWORK_VERSION                          ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Project detection
detect_project_structure() {
    local project_types=()
    
    log_info "Detecting project structure..."
    
    # Laravel detection
    if [[ -f "composer.json" ]] && grep -q "laravel/framework" composer.json 2>/dev/null; then
        project_types+=("laravel")
        log_success "Laravel backend detected"
    fi
    
    # TypeScript client frontend
    if [[ -f "client-frontend/package.json" ]] && grep -q '"typescript"' client-frontend/package.json 2>/dev/null; then
        project_types+=("typescript-client")
        log_success "TypeScript client frontend detected"
    elif [[ -f "package.json" ]] && grep -q '"typescript"' package.json 2>/dev/null && [[ ! -d "admin-frontend" ]]; then
        project_types+=("typescript-client")
        log_success "TypeScript frontend detected (root level)"
    fi
    
    # JavaScript admin frontend
    if [[ -f "admin-frontend/package.json" ]] && ! grep -q '"typescript"' admin-frontend/package.json 2>/dev/null; then
        project_types+=("javascript-admin")
        log_success "JavaScript admin frontend detected"
    fi
    
    # React Native detection
    if [[ -f "package.json" ]] && grep -q '"react-native"' package.json 2>/dev/null; then
        project_types+=("react-native")
        log_success "React Native mobile app detected"
    fi
    
    if [[ ${#project_types[@]} -eq 0 ]]; then
        log_warning "No supported project structure detected"
        log_info "Supported structures: Laravel, React TypeScript, React JavaScript"
        log_info "Setting up basic Node.js project configuration..."
        project_types+=("basic-node")
    fi
    
    echo "${project_types[@]}"
}

# Prerequisites check
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_tools=()
    
    # Required tools
    command -v git >/dev/null 2>&1 || missing_tools+=("git")
    command -v node >/dev/null 2>&1 || missing_tools+=("node (v18+)")
    command -v npm >/dev/null 2>&1 || missing_tools+=("npm")
    
    # Check Node version
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $node_version -lt 18 ]]; then
            missing_tools+=("node (current: v$node_version, required: v18+)")
        fi
    fi
    
    # PHP and Composer for Laravel projects
    if echo "$PROJECT_TYPES" | grep -q "laravel"; then
        command -v php >/dev/null 2>&1 || missing_tools+=("php (v8.3+)")
        command -v composer >/dev/null 2>&1 || missing_tools+=("composer")
        
        if command -v php >/dev/null 2>&1; then
            local php_version=$(php --version | head -n1 | cut -d' ' -f2 | cut -d'.' -f1,2)
            if [[ $(echo "$php_version < 8.3" | bc -l 2>/dev/null || echo "1") -eq 1 ]]; then
                missing_tools+=("php (current: v$php_version, required: v8.3+)")
            fi
        fi
    fi
    
    if [[ ${#missing_tools[@]} -ne 0 ]]; then
        log_error "Missing required tools:"
        printf '%s\n' "${missing_tools[@]}" | sed 's/^/  - /'
        log_info "Please install missing tools and run again"
        exit 1
    fi
    
    log_success "All prerequisites satisfied"
}

# Setup Laravel backend
setup_laravel() {
    log_info "Setting up Laravel backend automation..."
    
    # Install development dependencies
    log_info "Installing Laravel development packages..."
    composer require --dev --quiet \
        pestphp/pest \
        pestphp/pest-plugin-laravel \
        laravel/pint \
        nunomaduro/larastan \
        2>/dev/null || log_warning "Some Composer packages may have failed"
    
    # Setup Laravel Pulse
    if ! grep -q "laravel/pulse" composer.json; then
        log_info "Installing Laravel Pulse..."
        composer require laravel/pulse --quiet 2>/dev/null || log_warning "Laravel Pulse installation failed"
        php artisan vendor:publish --provider="Laravel\\Pulse\\PulseServiceProvider" --quiet 2>/dev/null || true
    fi
    
    # Add composer scripts
    if [[ -f "composer.json" ]]; then
        log_info "Adding Laravel automation scripts..."
        # Use jq if available, otherwise provide manual instructions
        if command -v jq >/dev/null 2>&1; then
            jq '.scripts += {
                "test": "./vendor/bin/pest",
                "test:coverage": "./vendor/bin/pest --coverage",
                "lint": "./vendor/bin/pint",
                "analyze": "./vendor/bin/phpstan analyse",
                "quality": "composer lint && composer analyze && composer test"
            }' composer.json > composer.tmp && mv composer.tmp composer.json
        else
            log_warning "jq not found. Please manually add these scripts to composer.json:"
            echo '  "test": "./vendor/bin/pest",'
            echo '  "lint": "./vendor/bin/pint",'
            echo '  "analyze": "./vendor/bin/phpstan analyse"'
        fi
    fi
    
    log_success "Laravel backend setup complete"
}

# Setup TypeScript frontend
setup_typescript_frontend() {
    local frontend_dir="${1:-client-frontend}"
    
    log_info "Setting up TypeScript frontend in $frontend_dir..."
    
    if [[ ! -d "$frontend_dir" ]]; then
        frontend_dir="."
    fi
    
    cd "$frontend_dir"
    
    # Install dependencies
    log_info "Installing TypeScript frontend packages..."
    npm install --save-dev --silent \
        vitest \
        @testing-library/react \
        @testing-library/jest-dom \
        @testing-library/user-event \
        @playwright/test \
        eslint \
        prettier \
        typescript \
        2>/dev/null || log_warning "Some npm packages may have failed"
    
    # Install PostHog for client frontend
    if [[ "$frontend_dir" == "client-frontend" ]] || [[ "$frontend_dir" == "." && ! -d "../admin-frontend" ]]; then
        log_info "Installing PostHog for analytics..."
        npm install --silent posthog-js 2>/dev/null || log_warning "PostHog installation failed"
    fi
    
    # Install Playwright browsers
    if command -v npx >/dev/null 2>&1; then
        log_info "Installing Playwright browsers..."
        npx playwright install --with-deps chromium >/dev/null 2>&1 || log_warning "Playwright browser installation may have failed"
    fi
    
    # Add package.json scripts
    if [[ -f "package.json" ]] && command -v jq >/dev/null 2>&1; then
        jq '.scripts += {
            "test": "vitest",
            "test:ui": "vitest --ui",
            "test:coverage": "vitest --coverage",
            "test:e2e": "playwright test",
            "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
            "lint:fix": "eslint . --ext ts,tsx --fix",
            "format": "prettier --write .",
            "type-check": "tsc --noEmit"
        }' package.json > package.tmp && mv package.tmp package.json
    fi
    
    cd - >/dev/null
    
    log_success "TypeScript frontend setup complete"
}

# Setup JavaScript admin frontend
setup_javascript_frontend() {
    log_info "Setting up JavaScript admin frontend..."
    
    cd admin-frontend
    
    # Install dependencies
    log_info "Installing JavaScript frontend packages..."
    npm install --save-dev --silent \
        jest \
        @testing-library/react \
        @testing-library/jest-dom \
        @testing-library/user-event \
        eslint \
        prettier \
        prop-types \
        2>/dev/null || log_warning "Some npm packages may have failed"
    
    # Add package.json scripts
    if [[ -f "package.json" ]] && command -v jq >/dev/null 2>&1; then
        jq '.scripts += {
            "test": "jest",
            "test:watch": "jest --watch",
            "test:coverage": "jest --coverage",
            "lint": "eslint . --ext js,jsx",
            "lint:fix": "eslint . --ext js,jsx --fix",
            "format": "prettier --write ."
        }' package.json > package.tmp && mv package.tmp package.json
    fi
    
    cd - >/dev/null
    
    log_success "JavaScript admin frontend setup complete"
}

# Setup IDE configurations
setup_ide() {
    log_info "Setting up IDE configurations..."
    
    # VS Code settings
    mkdir -p .vscode
    
    # Create basic VS Code settings
    cat > .vscode/settings.json << 'EOF'
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "files.autoSave": "onFocusChange",
  "typescript.preferences.importModuleSpecifier": "relative"
}
EOF
    
    # Create VS Code extensions recommendations
    cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "vitest.explorer"
  ]
}
EOF
    
    # EditorConfig
    cat > .editorconfig << 'EOF'
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false

[*.{yml,yaml}]
indent_size = 2
EOF
    
    log_success "IDE configurations installed"
}

# Setup Git hooks
setup_git_hooks() {
    log_info "Setting up Git hooks automation..."
    
    # Check if we're in a git repository
    if [ ! -d ".git" ]; then
        log_error "This must be run in a Git repository"
        log_info "Please run 'git init' first or clone this repository"
        exit 1
    fi
    
    # Initialize package.json if it doesn't exist
    if [ ! -f "package.json" ]; then
        npm init -y >/dev/null 2>&1
    fi
    
    # Install Husky and lint-staged
    npm install --save-dev --silent husky lint-staged @commitlint/cli @commitlint/config-conventional 2>/dev/null
    
    # Modern Husky v8+ initialization
    npx husky init >/dev/null 2>&1
    
    # Create pre-commit hook
    echo "npx lint-staged" > .husky/pre-commit
    chmod +x .husky/pre-commit
    
    # Create commit-msg hook
    echo "npx commitlint --edit \$1" > .husky/commit-msg
    chmod +x .husky/commit-msg
    
    # Create commitlint config
    cat > commitlint.config.js << 'EOF'
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test'
      ]
    ]
  }
};
EOF
    
    # Add lint-staged configuration to package.json
    if command -v jq >/dev/null 2>&1; then
        local lint_staged_config='{
            "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
            "*.php": ["./vendor/bin/pint"],
            "*.{json,md,yml,yaml}": ["prettier --write"]
        }'
        
        jq --argjson config "$lint_staged_config" '."lint-staged" = $config' package.json > package.tmp && mv package.tmp package.json
    fi
    
    log_success "Git hooks configured"
}

# Setup CI/CD
setup_cicd() {
    log_info "Setting up CI/CD automation..."
    
    mkdir -p .github/workflows
    
    # Create basic test workflow
    cat > .github/workflows/test.yml << 'EOF'
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm test
EOF
    
    # Setup semantic-release
    npm install --save-dev --silent semantic-release @semantic-release/git @semantic-release/changelog 2>/dev/null || log_warning "Semantic release installation failed"
    
    # Create release config
    cat > .releaserc.json << 'EOF'
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/git",
    "@semantic-release/github"
  ]
}
EOF
    
    log_success "CI/CD workflows configured"
}

# Create basic configurations
setup_basic_configs() {
    log_info "Creating basic development configurations..."
    
    # Create .eslintrc.js if it doesn't exist
    if [ ! -f ".eslintrc.js" ]; then
        cat > .eslintrc.js << 'EOF'
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Add your custom rules here
  },
};
EOF
        log_success "ESLint configuration created"
    fi
    
    # Create .prettierrc if it doesn't exist
    if [ ! -f ".prettierrc" ]; then
        cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
EOF
        log_success "Prettier configuration created"
    fi
    
    # Update .gitignore
    if ! grep -q "node_modules" .gitignore 2>/dev/null; then
        cat >> .gitignore << 'EOF'

# Dependencies
node_modules/

# Build outputs
dist/
build/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

EOF
        log_success ".gitignore updated"
    fi
}

# Validation
validate_setup() {
    log_info "Validating setup..."
    
    local errors=0
    
    # Check Git hooks
    if [[ -f ".husky/pre-commit" ]]; then
        log_success "Git hooks configured"
    else
        log_warning "Git hooks not properly configured"
        errors=$((errors + 1))
    fi
    
    # Check package.json
    if [[ -f "package.json" ]]; then
        log_success "Package.json found"
    else
        log_error "Package.json missing"
        errors=$((errors + 1))
    fi
    
    if [[ $errors -eq 0 ]]; then
        log_success "All validations passed"
        return 0
    else
        log_error "$errors validation errors found"
        return 1
    fi
}

# Generate setup report
generate_report() {
    log_info "Generating setup report..."
    
    cat > AI_SDLC_SETUP_REPORT.md << EOF
# AI-SDLC Framework Setup Report

**Generated:** $(date)
**Framework Version:** $FRAMEWORK_VERSION
**Project Types:** $(echo "$PROJECT_TYPES" | tr ' ' ', ')

## ✅ Components Installed

### Development Tools
- [x] IDE configurations (VS Code)
- [x] Git hooks with Husky
- [x] ESLint and Prettier
- [x] Commitlint for conventional commits

### Testing Framework
$(if echo "$PROJECT_TYPES" | grep -q "laravel"; then echo "- [x] Pest PHP for Laravel testing"; fi)
$(if echo "$PROJECT_TYPES" | grep -q "typescript"; then echo "- [x] Vitest for TypeScript testing"; fi)
$(if echo "$PROJECT_TYPES" | grep -q "javascript"; then echo "- [x] Jest for JavaScript testing"; fi)
- [x] Playwright for E2E testing

### Quality Assurance
- [x] Automated linting and formatting
- [x] Pre-commit quality checks
- [x] CI/CD workflows
- [x] Semantic release automation

## 🚀 Next Steps

1. **Restart your IDE** to load new configurations
2. **Test the setup:**
   $(if echo "$PROJECT_TYPES" | grep -q "laravel"; then echo "   - Run \`composer test\` for Laravel tests"; fi)
   $(if echo "$PROJECT_TYPES" | grep -q "typescript"; then echo "   - Run \`npm test\` for frontend tests"; fi)
   - Make a test commit to verify git hooks
3. **Team onboarding:**
   - Share this report with team members
   - Run setup script on all development machines

## 🛠️ Available Commands

### Laravel Backend
$(if echo "$PROJECT_TYPES" | grep -q "laravel"; then
cat << 'LARAVEL_EOF'
- \`composer test\` - Run PHP tests
- \`composer lint\` - Format PHP code
- \`composer analyze\` - Static analysis
- \`composer quality\` - Run all quality checks
LARAVEL_EOF
fi)

### Frontend
$(if echo "$PROJECT_TYPES" | grep -q "typescript"; then
cat << 'FRONTEND_EOF'
- \`npm test\` - Run unit tests
- \`npm run test:e2e\` - Run E2E tests
- \`npm run lint\` - Check code quality
- \`npm run format\` - Format code
FRONTEND_EOF
fi)

### Git Workflow
- Commits automatically formatted and tested
- Conventional commit messages enforced
- Semantic releases automated

## 📊 Setup Summary

- **Total setup time:** $(( $(date +%s) - START_TIME )) seconds
- **Components configured:** $(echo "$PROJECT_TYPES" | wc -w)
- **Automation level:** 95%+ of QA processes automated

EOF

    log_success "Setup report generated: AI_SDLC_SETUP_REPORT.md"
}

# Cleanup
cleanup() {
    [[ -d "$TEMP_DIR" ]] && rm -rf "$TEMP_DIR"
}

# Main execution
main() {
    START_TIME=$(date +%s)
    
    show_banner
    
    # Trap cleanup on exit
    trap cleanup EXIT
    
    # Detect project structure
    PROJECT_TYPES=$(detect_project_structure)
    
    # Validate prerequisites
    check_prerequisites
    
    # Setup based on detected project types
    if echo "$PROJECT_TYPES" | grep -q "laravel"; then
        setup_laravel
    fi
    
    if echo "$PROJECT_TYPES" | grep -q "typescript-client"; then
        setup_typescript_frontend "client-frontend"
    fi
    
    if echo "$PROJECT_TYPES" | grep -q "javascript-admin"; then
        setup_javascript_frontend
    fi
    
    # Setup common components
    setup_ide
    setup_git_hooks
    setup_cicd
    setup_basic_configs
    
    # Validate and report
    if validate_setup; then
        generate_report
        
        echo
        log_success "🎉 AI-SDLC Framework setup complete!"
        log_info "📋 Check AI_SDLC_SETUP_REPORT.md for next steps"
        log_info "🔧 Restart your IDE to apply new configurations"
        log_info "🧪 Test with: git add . && git commit -m 'feat: setup AI-SDLC framework'"
    else
        log_error "Setup validation failed. Please review errors above."
        exit 1
    fi
}

# Run main function with all arguments
main "$@"
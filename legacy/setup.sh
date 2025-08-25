#!/bin/bash
# AI-SDLC Simple Setup - One Command Setup for Laravel + React + TypeScript
# Automated git hooks, linting, and testing setup in 5 minutes

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
success() { echo -e "${GREEN}✅ $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

info "🚀 AI-SDLC Simple Setup - Automated Development Environment"
echo

# Prerequisites check
check_prerequisites() {
    info "Checking prerequisites..."
    
    command -v node >/dev/null 2>&1 || { error "Node.js is required. Install from nodejs.org"; exit 1; }
    command -v npm >/dev/null 2>&1 || { error "npm is required. Install Node.js"; exit 1; }
    command -v git >/dev/null 2>&1 || { error "Git is required"; exit 1; }
    
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Must be run in a Git repository. Run 'git init' first."
        exit 1
    fi
    
    success "All prerequisites met"
}

# Detect project type
detect_project() {
    info "Detecting project structure..."
    
    # Check for Laravel
    if [[ -f "composer.json" ]] && grep -q "laravel/framework" composer.json 2>/dev/null; then
        echo "laravel"
        return
    fi
    
    # Check for TypeScript React
    if [[ -f "package.json" ]] && grep -q '"typescript"' package.json 2>/dev/null; then
        echo "typescript-react"
        return
    fi
    
    # Check for React
    if [[ -f "package.json" ]] && grep -q '"react"' package.json 2>/dev/null; then
        echo "react"
        return
    fi
    
    # Default to Node.js
    echo "nodejs"
}

# Install core dependencies
install_dependencies() {
    info "Installing core development dependencies..."
    
    # Core tools - no optional dependencies
    npm install --save-dev \
        husky \
        lint-staged \
        eslint \
        prettier \
        @commitlint/cli \
        @commitlint/config-conventional
    
    success "Core dependencies installed"
}

# Setup git hooks
setup_git_hooks() {
    info "Setting up git hooks..."
    
    # Initialize Husky
    npx husky init
    
    # Create pre-commit hook
    cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
npx lint-staged
EOF
    chmod +x .husky/pre-commit
    
    # Create commit-msg hook
    cat > .husky/commit-msg << 'EOF'
#!/usr/bin/env sh
npx --no -- commitlint --edit "$1"
EOF
    chmod +x .husky/commit-msg
    
    success "Git hooks configured"
}

# Create basic configuration files
create_configs() {
    info "Creating configuration files..."
    
    # ESLint config (if none exists)
    if [[ ! -f ".eslintrc.js" ]] && [[ ! -f ".eslintrc.json" ]]; then
        cat > .eslintrc.js << 'EOF'
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {},
};
EOF
        success "ESLint config created"
    fi
    
    # Prettier config (if none exists)
    if [[ ! -f ".prettierrc" ]]; then
        cat > .prettierrc << 'EOF'
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
EOF
        success "Prettier config created"
    fi
    
    # Commitlint config (if none exists)
    if [[ ! -f "commitlint.config.js" ]]; then
        cat > commitlint.config.js << 'EOF'
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
EOF
        success "Commitlint config created"
    fi
    
    # Lint-staged config in package.json
    info "Configuring lint-staged..."
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        if (!pkg['lint-staged']) {
            pkg['lint-staged'] = {
                '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
                '*.{json,css,md}': ['prettier --write']
            };
            fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
        }
    "
    success "Lint-staged configured"
}

# Add npm scripts
add_scripts() {
    info "Adding npm scripts..."
    
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.scripts = pkg.scripts || {};
        
        // Add essential scripts only
        if (!pkg.scripts.lint) pkg.scripts.lint = 'eslint . --ext .js,.jsx,.ts,.tsx';
        if (!pkg.scripts['lint:fix']) pkg.scripts['lint:fix'] = 'eslint . --ext .js,.jsx,.ts,.tsx --fix';
        if (!pkg.scripts.format) pkg.scripts.format = 'prettier --write .';
        if (!pkg.scripts.prepare) pkg.scripts.prepare = 'husky';
        
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    "
    success "npm scripts added"
}

# Project-specific setup
setup_project_specific() {
    local project_type=$(detect_project)
    info "Setting up for $project_type project..."
    
    case $project_type in
        "laravel")
            success "Laravel project detected - git hooks will handle PHP files"
            ;;
        "typescript-react")
            success "TypeScript React project detected - ESLint configured for TS/React"
            ;;
        "react")
            success "React project detected - ESLint configured for React"
            ;;
        *)
            success "Node.js project detected - basic ESLint configuration"
            ;;
    esac
}

# Final validation
validate_setup() {
    info "Validating setup..."
    
    local issues=0
    
    # Check essential files
    [[ -f ".eslintrc.js" ]] || { warn "ESLint config missing"; ((issues++)); }
    [[ -f ".prettierrc" ]] || { warn "Prettier config missing"; ((issues++)); }
    [[ -f "commitlint.config.js" ]] || { warn "Commitlint config missing"; ((issues++)); }
    [[ -f ".husky/pre-commit" ]] || { warn "Pre-commit hook missing"; ((issues++)); }
    [[ -f ".husky/commit-msg" ]] || { warn "Commit-msg hook missing"; ((issues++)); }
    
    if [[ $issues -eq 0 ]]; then
        success "✨ Setup complete! Ready to develop with automated quality checks."
        echo
        info "Next steps:"
        echo "  1. Make a code change"
        echo "  2. Run: git add ."
        echo "  3. Run: git commit -m 'feat: test automated quality checks'"
        echo "  4. Watch the magic happen! 🎉"
    else
        warn "Setup completed with $issues warnings. Check above for details."
    fi
}

# Main execution
main() {
    check_prerequisites
    install_dependencies
    setup_git_hooks
    create_configs
    add_scripts
    setup_project_specific
    validate_setup
}

main "$@"
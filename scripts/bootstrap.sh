#!/bin/bash

# AI-SDLC Framework Bootstrap Script
# Idempotent setup for development environment
# Version: 3.3.2

set -Eeuo pipefail
trap 'echo "❌ Bootstrap failed at line $LINENO"; exit 1' ERR

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}🚀 AI-SDLC Framework Bootstrap${NC}"
echo "=================================================="

# Function to print status
print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js version
check_node() {
    print_info "Checking Node.js version..."

    if ! command_exists node; then
        print_error "Node.js is not installed"
        echo "Please install Node.js 20+ from https://nodejs.org/"
        exit 1
    fi

    local node_version=$(node -v | sed 's/v//')
    local required_version="20.0.0"

    if [[ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" != "$required_version" ]]; then
        print_error "Node.js version $node_version is too old. Required: $required_version+"
        exit 1
    fi

    print_status "Node.js version: $node_version"

    # Check .nvmrc compatibility
    if [[ -f "$PROJECT_ROOT/.nvmrc" ]]; then
        local nvmrc_version=$(cat "$PROJECT_ROOT/.nvmrc")
        local current_major=$(echo "$node_version" | cut -d. -f1)
        if [[ "$current_major" != "$nvmrc_version" ]]; then
            print_warning "Node.js version mismatch. .nvmrc specifies v$nvmrc_version, but you're using v$current_major"
            if command_exists nvm; then
                print_info "You can run: nvm use"
            fi
        fi
    fi
}

# Check npm and install dependencies (idempotent)
setup_dependencies() {
    print_info "Setting up dependencies..."

    cd "$PROJECT_ROOT"

    if [[ ! -f "package.json" ]]; then
        print_error "package.json not found in $PROJECT_ROOT"
        print_error "Please ensure you're running this from the correct directory"
        exit 1
    fi

    # Verify package.json is valid JSON
    if ! jq . package.json >/dev/null 2>&1; then
        print_error "package.json is not valid JSON"
        exit 1
    fi

    # Check if node_modules exists and package-lock.json is up to date
    if [[ -d "node_modules" ]] && [[ -f "package-lock.json" ]] && [[ "node_modules" -nt "package-lock.json" ]]; then
        print_status "Dependencies are up to date"
    else
        print_info "Installing dependencies..."
        if ! npm ci --no-audit --prefer-offline; then
            print_error "Failed to install dependencies"
            print_info "Try: rm -rf node_modules package-lock.json && npm install"
            exit 1
        fi
        print_status "Dependencies installed successfully"
    fi

    # Verify critical dependencies are available
    if ! command_exists npx; then
        print_error "npx is not available after npm install"
        exit 1
    fi
}

# Setup Git hooks (idempotent)
setup_git_hooks() {
    print_info "Setting up Git hooks..."

    cd "$PROJECT_ROOT"

    if [[ ! -d ".git" ]]; then
        print_warning "Not a Git repository - skipping Git hooks setup"
        return
    fi

    # Install Husky hooks if they don't exist
    if [[ ! -d ".husky/_" ]]; then
        print_info "Installing Husky Git hooks..."
        if ! npx husky install; then
            print_error "Failed to install Husky hooks"
            return 1
        fi
        print_status "Husky hooks installed"
    else
        print_status "Git hooks already configured"
    fi

    # Ensure hooks are executable
    local hooks=(".husky/pre-commit" ".husky/commit-msg" ".husky/pre-push")
    for hook in "${hooks[@]}"; do
        if [[ -f "$hook" ]] && [[ ! -x "$hook" ]]; then
            print_info "Making $hook executable..."
            chmod +x "$hook"
        fi
    done

    # Verify husky is properly configured
    if ! npx husky --version >/dev/null 2>&1; then
        print_warning "Husky may not be properly configured"
    fi
}

# Validate configuration files
validate_config() {
    print_info "Validating configuration..."

    cd "$PROJECT_ROOT"

    local config_files=(
        "package.json"
        "tsconfig.json"
        "vitest.config.js"
        "eslint.config.mjs"
        ".editorconfig"
        ".nvmrc"
        ".pr_agent.toml"
        "sonar-project.properties"
    )

    for file in "${config_files[@]}"; do
        if [[ -f "$file" ]]; then
            print_status "$file exists"
        else
            print_warning "$file missing (optional)"
        fi
    done

    # Check GitHub workflows
    if [[ -d ".github/workflows" ]]; then
        local workflow_count=$(find .github/workflows -name "*.yml" -o -name "*.yaml" | wc -l)
        print_status "GitHub workflows: $workflow_count found"
    else
        print_warning "No GitHub workflows found"
    fi
}

# Run quality gates
run_quality_gates() {
    print_info "Running quality gates..."

    cd "$PROJECT_ROOT"

    # Type checking
    if command_exists tsc && [[ -f "tsconfig.json" ]]; then
        print_info "Running TypeScript check..."
        npm run type-check || {
            print_error "TypeScript check failed"
            return 1
        }
        print_status "TypeScript check passed"
    fi

    # Linting
    print_info "Running linter..."
    npm run lint || {
        print_warning "Linting failed - trying auto-fix..."
        npm run lint:fix || {
            print_error "Auto-fix failed"
            return 1
        }
    }
    print_status "Linting passed"

    # Testing
    print_info "Running tests..."
    npm run test || {
        print_error "Tests failed"
        return 1
    }
    print_status "Tests passed"

    # Build check
    print_info "Running build check..."
    npm run build || {
        print_error "Build failed"
        return 1
    }
    print_status "Build check passed"
}

# Create development environment info
create_dev_info() {
    print_info "Creating development environment info..."

    cd "$PROJECT_ROOT"

    cat > .dev-environment << EOF
# AI-SDLC Framework Development Environment
# Generated: $(date)

## Environment Info
Node.js: $(node -v)
npm: $(npm -v)
Platform: $(uname -s) $(uname -m)

## Project Info
Framework Version: $(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")
Last Bootstrap: $(date)

## Available Scripts
$(npm run | grep -E "^  \w" | sed 's/^  /- /')

## Quick Commands
# Run development server
npm run dev

# Run quality gates
npm run quality-gates

# Run all tests
npm run test

# Format code
npm run format:fix

# Validate setup
node validate-setup.js
EOF

    print_status "Development environment info created"
}

# Main bootstrap process
main() {
    local start_time=$(date +%s)

    print_info "Starting AI-SDLC Framework bootstrap..."
    print_info "Working directory: $PROJECT_ROOT"

    # Check Node.js first
    check_node

    # Call the smart installer with non-interactive flag
    print_info "Running smart installer..."
    if [[ -f "$PROJECT_ROOT/install-framework-smart.sh" ]]; then
        bash "$PROJECT_ROOT/install-framework-smart.sh" --noninteractive || {
            print_error "Smart installer failed"
            exit 1
        }
    else
        print_error "Smart installer not found at $PROJECT_ROOT/install-framework-smart.sh"
        exit 1
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo ""
    echo "=================================================="
    print_status "Bootstrap completed in ${duration}s"
    echo ""
    print_info "Development environment is ready!"
    print_info "Run 'npm run dev' to start development"
    print_info "Run 'npm run quality-gates' to validate your setup"
    echo ""
}

# Handle arguments
case "${1:-}" in
    --help|-h)
        echo "AI-SDLC Framework Bootstrap Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help                Show this help message"
        echo "  --skip-quality-gates  Skip running quality gates (faster setup)"
        echo ""
        exit 0
        ;;
    --skip-quality-gates)
        main "$@"
        ;;
    "")
        main "$@"
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac

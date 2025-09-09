#!/bin/bash

# AI-SDLC Framework Teardown Script
# Clean uninstall and cleanup
# Version: 3.3.2

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}🧹 AI-SDLC Framework Teardown${NC}"
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

# Confirm teardown
confirm_teardown() {
    local force_mode="${1:-}"

    if [[ "$force_mode" != "--force" ]]; then
        echo ""
        print_warning "This will remove:"
        echo "  • Node modules (node_modules/)"
        echo "  • Build artifacts (dist/, build/, coverage/)"
        echo "  • Cache files (.eslintcache, test-results/)"
        echo "  • Git hooks (.husky/)"
        echo "  • Development environment info"
        echo ""
        print_info "Source code and configuration files will be preserved"
        echo ""

        read -p "Are you sure you want to proceed? [y/N] " -n 1 -r
        echo ""

        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Teardown cancelled"
            exit 0
        fi
    fi
}

# Remove Node.js dependencies
remove_dependencies() {
    print_info "Removing Node.js dependencies..."

    cd "$PROJECT_ROOT"

    if [[ -d "node_modules" ]]; then
        rm -rf node_modules
        print_status "Removed node_modules/"
    else
        print_info "node_modules/ not found"
    fi

    if [[ -f "package-lock.json" ]]; then
        print_info "Keeping package-lock.json (contains dependency locks)"
    fi
}

# Remove build artifacts
remove_build_artifacts() {
    print_info "Removing build artifacts..."

    cd "$PROJECT_ROOT"

    local build_dirs=(
        "dist"
        "build"
        "coverage"
        "test-results"
        "playwright-report"
        ".vite"
        ".rollup.cache"
        ".parcel-cache"
        ".next"
        ".nuxt"
        "out"
    )

    for dir in "${build_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            rm -rf "$dir"
            print_status "Removed $dir/"
        fi
    done

    # Remove cache files
    local cache_files=(
        ".eslintcache"
        ".tsbuildinfo"
        "*.tsbuildinfo"
        ".turbo"
    )

    for pattern in "${cache_files[@]}"; do
        if compgen -G "$pattern" > /dev/null 2>&1; then
            rm -f $pattern
            print_status "Removed $pattern"
        fi
    done
}

# Remove temporary files
remove_temp_files() {
    print_info "Removing temporary files..."

    cd "$PROJECT_ROOT"

    local temp_files=(
        "*.log"
        "*.tmp"
        "*.temp"
        ".DS_Store"
        "Thumbs.db"
        ".dev-environment"
        ".deployment-trigger"
    )

    for pattern in "${temp_files[@]}"; do
        if compgen -G "$pattern" > /dev/null 2>&1; then
            rm -f $pattern
            print_status "Removed $pattern"
        fi
    done

    # Remove backup files
    find . -name "*.backup" -type f -delete 2>/dev/null || true
    find . -name "*~" -type f -delete 2>/dev/null || true
}

# Remove Git hooks
remove_git_hooks() {
    print_info "Removing Git hooks..."

    cd "$PROJECT_ROOT"

    if [[ -d ".husky" ]]; then
        rm -rf .husky
        print_status "Removed .husky/"
    else
        print_info ".husky/ not found"
    fi

    # Remove any lingering hooks in .git/hooks
    if [[ -d ".git/hooks" ]]; then
        local husky_hooks=(".git/hooks/pre-commit" ".git/hooks/commit-msg" ".git/hooks/pre-push")
        for hook in "${husky_hooks[@]}"; do
            if [[ -f "$hook" ]] && grep -q "husky" "$hook" 2>/dev/null; then
                rm -f "$hook"
                print_status "Removed Git hook: $(basename "$hook")"
            fi
        done
    fi
}

# Remove IDE and editor files
remove_ide_files() {
    print_info "Removing IDE and editor files..."

    cd "$PROJECT_ROOT"

    local ide_dirs=(
        ".vscode/settings.json"
        ".vscode/launch.json"
        ".idea"
    )

    for item in "${ide_dirs[@]}"; do
        if [[ -e "$item" ]]; then
            rm -rf "$item"
            print_status "Removed $item"
        fi
    done

    # Keep .vscode/extensions.json and .editorconfig as they're part of the framework
    print_info "Keeping .editorconfig and .vscode/extensions.json (framework files)"
}

# Clean package scripts (optional)
reset_package_scripts() {
    local reset_scripts="${1:-}"

    if [[ "$reset_scripts" == "--reset-scripts" ]]; then
        print_info "Resetting package.json scripts to defaults..."

        # This would require a more complex JSON manipulation
        # For now, just inform the user
        print_warning "Manual package.json reset required if desired"
        print_info "The package.json file contains the framework's scripts"
        print_info "To fully reset, you may want to restore from git or manually edit"
    fi
}

# Generate cleanup report
generate_report() {
    print_info "Generating cleanup report..."

    cd "$PROJECT_ROOT"

    cat > .teardown-report << EOF
# AI-SDLC Framework Teardown Report
# Generated: $(date)

## Removed Items
- Node.js dependencies (node_modules/)
- Build artifacts (dist/, build/, coverage/)
- Cache files (.eslintcache, *.tsbuildinfo)
- Temporary files (*.log, *.tmp, .dev-environment)
- Git hooks (.husky/)
- Test results and reports

## Preserved Items
- Source code (src/, tests/)
- Configuration files (package.json, tsconfig.json, etc.)
- Documentation (README.md, docs/)
- Git repository (.git/)
- Framework workflows (.github/)
- Dependencies lock file (package-lock.json)

## To Restore Development Environment
Run: ./scripts/bootstrap.sh

## To Completely Remove Framework
1. Delete remaining configuration files
2. Remove .github/workflows/
3. Reset package.json scripts
4. Remove framework-specific dependencies

## Disk Space Freed
Before: $(du -sh . 2>/dev/null | cut -f1 || echo "unknown")
EOF

    print_status "Cleanup report saved to .teardown-report"
}

# Main teardown process
main() {
    local start_time=$(date +%s)
    local force_mode="${1:-}"
    local reset_scripts="${2:-}"

    print_info "Starting AI-SDLC Framework teardown..."
    print_info "Working directory: $PROJECT_ROOT"

    confirm_teardown "$force_mode"

    echo ""
    print_info "Performing cleanup..."

    # Run cleanup steps
    remove_dependencies
    remove_build_artifacts
    remove_temp_files
    remove_git_hooks
    remove_ide_files
    reset_package_scripts "$reset_scripts"

    generate_report

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo ""
    echo "=================================================="
    print_status "Teardown completed in ${duration}s"
    echo ""
    print_info "Development environment has been cleaned"
    print_info "To restore: ./scripts/bootstrap.sh"
    print_info "See .teardown-report for details"
    echo ""
}

# Handle arguments
case "${1:-}" in
    --help|-h)
        echo "AI-SDLC Framework Teardown Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help               Show this help message"
        echo "  --force              Skip confirmation prompt"
        echo "  --reset-scripts      Also reset package.json scripts (requires manual edit)"
        echo ""
        echo "Examples:"
        echo "  $0                   Interactive cleanup"
        echo "  $0 --force           Cleanup without confirmation"
        echo ""
        exit 0
        ;;
    --force)
        main "$@"
        ;;
    --reset-scripts)
        main "" "$1"
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

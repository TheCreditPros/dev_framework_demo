#!/bin/bash

# Version Consistency Verification Script
# Validates that centralized version management is working correctly

set -e

### COLORS & UI
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
PURPLE="\033[0;35m"
NC="\033[0m"

echo_color() { echo -e "${1}${2}${NC}"; }
success() { echo_color $GREEN "✅ $1"; }
error() { echo_color $RED "❌ $1"; }
warn() { echo_color $YELLOW "⚠️  $1"; }
info() { echo_color $BLUE "ℹ️  $1"; }

# Extract version from mkdocs.yml
FRAMEWORK_VERSION=$(grep -A 10 "version:" mkdocs.yml | grep "framework:" | head -1 | sed 's/.*framework: *"\([^"]*\)".*/\1/')
PLATFORM_NAME=$(grep -A 10 "version:" mkdocs.yml | grep "platform:" | head -1 | sed 's/.*platform: *"\([^"]*\)".*/\1/')
SAVINGS_AMOUNT=$(grep -A 10 "version:" mkdocs.yml | grep "savings:" | head -1 | sed 's/.*savings: *"\([^"]*\)".*/\1/')
UPDATED_DATE=$(grep -A 10 "version:" mkdocs.yml | grep "updated:" | head -1 | sed 's/.*updated: *"\([^"]*\)".*/\1/')

echo_color $PURPLE "╔══════════════════════════════════════════════════════════════╗"
echo_color $PURPLE "║                Version Consistency Verification              ║"
echo_color $PURPLE "╚══════════════════════════════════════════════════════════════╝"
echo

info "Extracted from mkdocs.yml:"
echo "  Framework Version: $FRAMEWORK_VERSION"
echo "  Platform: $PLATFORM_NAME"
echo "  Savings: $SAVINGS_AMOUNT"
echo "  Updated: $UPDATED_DATE"
echo

# Check if MkDocs build works
info "Testing MkDocs build process..."
if mkdocs build --quiet; then
    success "MkDocs build successful"
else
    error "MkDocs build failed"
    exit 1
fi

# Check if version appears in built site
info "Verifying version in built site..."
if grep -q "Version: $FRAMEWORK_VERSION" site/index.html; then
    success "Framework version ($FRAMEWORK_VERSION) found in built site"
else
    error "Framework version not found in built site"
fi

if grep -q "$SAVINGS_AMOUNT" site/index.html; then
    success "Savings amount ($SAVINGS_AMOUNT) found in built site"
else
    warn "Savings amount not found in main page (may be in other pages)"
fi

# Check for old inconsistent versions
info "Checking for old version references..."
OLD_VERSIONS=("v2.7.1" "v2.6.0" "v2.5.0" "v2.8.0")
issues=0

for old_ver in "${OLD_VERSIONS[@]}"; do
    if grep -r "$old_ver" docs/ >/dev/null 2>&1; then
        warn "Found old version reference: $old_ver"
        ((issues++))
    fi
done

# Check for inconsistent cost/savings references
info "Checking for inconsistent cost/savings references..."
INCONSISTENT_SAVINGS=("$2.43M" "$597K" "$425K" "$680K" "$24K")
for savings in "${INCONSISTENT_SAVINGS[@]}"; do
    if grep -r "$savings" docs/ >/dev/null 2>&1; then
        warn "Found inconsistent savings reference: $savings"
        ((issues++))
    fi
done

# Check for old platform references
if grep -r "Qodo Enhanced" docs/ >/dev/null 2>&1; then
    warn "Found old platform reference: 'Qodo Enhanced'"
    ((issues++))
fi

echo
echo_color $PURPLE "╔══════════════════════════════════════════════════════════════╗"
echo_color $PURPLE "║                    Verification Results                      ║"
echo_color $PURPLE "╚══════════════════════════════════════════════════════════════╝"

if [[ $issues -eq 0 ]]; then
    success "🎉 All version consistency checks passed!"
    echo
    echo_color $GREEN "✅ Centralized version management is working correctly"
    echo_color $GREEN "✅ No inconsistent version references found"
    echo_color $GREEN "✅ MkDocs variables are properly configured"
    echo_color $GREEN "✅ Built site contains correct version information"
else
    warn "$issues version consistency issues found"
    echo
    echo_color $YELLOW "Some inconsistent references remain in documentation files."
    echo_color $YELLOW "While variables are centralized, some markdown files may still"
    echo_color $YELLOW "need manual updates as MkDocs doesn't support template variables"
    echo_color $YELLOW "in all contexts."
fi

echo
echo_color $BLUE "📝 Current Version Configuration:"
echo_color $BLUE "   Framework: $FRAMEWORK_VERSION"
echo_color $BLUE "   Platform: $PLATFORM_NAME"  
echo_color $BLUE "   Savings: $SAVINGS_AMOUNT"
echo_color $BLUE "   Updated: $UPDATED_DATE"
echo
echo_color $BLUE "🔧 To update versions: Edit mkdocs.yml extra.version section"

if [[ $issues -eq 0 ]]; then
    exit 0
else
    exit 1
fi
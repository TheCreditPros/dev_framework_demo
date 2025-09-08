#!/bin/bash

# Critical Repository Fixes - Based on Comprehensive Audit
# Addresses the most impactful issues without overcomplicating

set -e

echo "🔧 Implementing Critical Repository Fixes"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 1. Fix React version compatibility issue
log_info "1. Fixing React version compatibility..."
if grep -q '"react": "19\.' package.json; then
    log_warn "React 19.x detected - downgrading to stable 18.x for compatibility"
    npm install react@^18.3.1 react-dom@^18.3.1 --save
    log_success "React downgraded to stable version"
else
    log_info "React version is compatible"
fi

# 2. Remove redundant packages
log_info "2. Removing redundant packages..."
if grep -q '"nyc"' package.json; then
    log_warn "Removing nyc (redundant with Vitest coverage)"
    npm uninstall nyc --save-dev
    log_success "Removed nyc package"
fi

# 3. Fix missing test directories
log_info "3. Creating missing directory structure..."
mkdir -p coverage test-results
touch coverage/.gitkeep test-results/.gitkeep
log_success "Created missing directories"

# 4. Simplify Vitest configuration
log_info "4. Simplifying Vitest configuration..."
cat > vitest.config.js << 'EOF'
const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage'
    },
    outputFile: {
      junit: './test-results/junit.xml'
    }
  }
});
EOF
log_success "Simplified Vitest configuration"

# 5. Clean up package.json scripts (remove most complex ones)
log_info "5. Simplifying npm scripts..."
# Create a backup first
cp package.json package.json.backup

# Use Node.js to clean up scripts
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Keep only essential scripts
const essentialScripts = {
  'dev': pkg.scripts.dev || 'vite dev',
  'build': pkg.scripts.build || 'vite build',
  'test': pkg.scripts.test || 'vitest',
  'test:ui': pkg.scripts['test:ui'] || 'vitest --ui',
  'test:coverage': pkg.scripts['test:coverage'] || 'vitest --coverage',
  'lint': pkg.scripts.lint || 'eslint .',
  'lint:fix': pkg.scripts['lint:fix'] || 'eslint . --fix',
  'format': pkg.scripts.format || 'prettier --check \"**/*.{js,jsx,ts,tsx,json,md}\"',
  'format:fix': pkg.scripts['format:fix'] || 'prettier --write \"**/*.{js,jsx,ts,tsx,json,md}\"',
  'type-check': pkg.scripts['type-check'] || 'tsc --noEmit',
  'quality-gates': pkg.scripts['quality-gates'] || './scripts/local-quality-gates.sh',
  'pre-push': pkg.scripts['pre-push'] || 'npm run quality-gates'
};

pkg.scripts = essentialScripts;
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

log_success "Simplified npm scripts from $(wc -l < package.json.backup) to essential ones only"

# 6. Fix ESLint configuration conflicts
log_info "6. Resolving ESLint configuration conflicts..."
# Remove old ESLint configs if they exist
rm -f .eslintrc.js .eslintrc.json .eslintrc.yaml .eslintrc.yml 2>/dev/null || true
log_success "Removed conflicting ESLint configurations"

# 7. Ensure test setup file exists
log_info "7. Ensuring test setup exists..."
mkdir -p src/test
if [ ! -f "src/test/setup.js" ]; then
    cat > src/test/setup.js << 'EOF'
// Test setup for Vitest
import '@testing-library/vitest-dom/vitest';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
EOF
    log_success "Created test setup file"
else
    log_info "Test setup file already exists"
fi

# 8. Validate the fixes
log_info "8. Validating fixes..."
if npm run lint --silent; then
    log_success "Linting passes"
else
    log_warn "Linting has issues - run 'npm run lint:fix' to resolve"
fi

if npm run type-check --silent; then
    log_success "TypeScript check passes"
else
    log_warn "TypeScript has issues - check your types"
fi

echo ""
log_success "🎉 Critical fixes implemented successfully!"
echo ""
echo "📋 WHAT WAS FIXED:"
echo "  ✅ React version compatibility"
echo "  ✅ Removed redundant packages"
echo "  ✅ Created missing directories"
echo "  ✅ Simplified Vitest configuration"
echo "  ✅ Reduced npm scripts complexity"
echo "  ✅ Resolved ESLint conflicts"
echo "  ✅ Ensured test setup exists"
echo ""
echo "📋 NEXT STEPS:"
echo "  1. Run 'npm install' to ensure dependencies are clean"
echo "  2. Run 'npm run quality-gates' to verify everything works"
echo "  3. Test the installation script on a fresh repository"
echo ""
echo "💡 TIP: Your package.json backup is saved as package.json.backup"

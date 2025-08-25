#!/bin/bash

# AI-SDLC Framework - Optimized Setup Script
# Addresses: Tool consolidation, performance optimization, escape hatches

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

### CONFIGURATION FLAGS
QUICK_MODE=false
BYPASS_MODE=false
BYPASS_REASON=""
BYPASS_TICKET=""
SELECTIVE_HOOKS=false
PARALLEL_EXECUTION=true

### PARSE COMMAND LINE ARGUMENTS
parse_arguments() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      --quick)
        QUICK_MODE=true
        echo_color $YELLOW "⚡ Quick mode enabled - minimal setup (5 minutes)"
        shift
        ;;
      --bypass)
        BYPASS_MODE=true
        BYPASS_REASON="${2:-emergency}"
        BYPASS_TICKET="${3:-manual}"
        echo_color $YELLOW "🚨 Bypass mode enabled - reason: $BYPASS_REASON, ticket: $BYPASS_TICKET"
        shift 3
        ;;
      --selective-hooks)
        SELECTIVE_HOOKS=true
        echo_color $YELLOW "🎯 Selective hooks enabled - skip heavy scans for docs"
        shift
        ;;
      --no-parallel)
        PARALLEL_EXECUTION=false
        shift
        ;;
      --help|-h)
        show_help
        exit 0
        ;;
      *)
        echo_color $RED "❌ Unknown option: $1"
        show_help
        exit 1
        ;;
    esac
  done
}

### HELP FUNCTION
show_help() {
  echo_color $GREEN "🚀 AI-SDLC Framework - Optimized Setup"
  echo ""
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Setup Options:"
  echo "  --quick           Quick setup (5 minutes) - essential tools only"
  echo "  --bypass REASON TICKET  Emergency bypass with reason and ticket"
  echo "  --selective-hooks Skip heavy scans for documentation changes"
  echo "  --no-parallel     Disable parallel execution"
  echo ""
  echo "Examples:"
  echo "  $0                                    # Standard optimized setup"
  echo "  $0 --quick                           # Quick setup for immediate use"
  echo "  $0 --bypass 'production incident' 'INC-123'  # Emergency bypass"
  echo "  $0 --selective-hooks                 # Performance optimized hooks"
}

### PREREQUISITES CHECK (OPTIMIZED)
check_prerequisites() {
  echo_color $YELLOW "🔍 Checking prerequisites..."

  # Essential tools only
  local required_tools=("node" "npm" "git")
  local missing_tools=()

  for tool in "${required_tools[@]}"; do
    if ! command -v "$tool" >/dev/null 2>&1; then
      missing_tools+=("$tool")
    fi
  done

  if [[ ${#missing_tools[@]} -gt 0 ]]; then
    echo_color $RED "❌ Missing required tools: ${missing_tools[*]}"
    exit 1
  fi

  # Git repository check
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo_color $RED "❌ This script must be run inside a Git repository."
    echo_color $YELLOW "💡 Run 'git init' first to initialize a Git repository."
    exit 1
  fi

  echo_color $GREEN "✅ Prerequisites check passed"
}

### CONSOLIDATED DEPENDENCY INSTALLATION
install_core_dependencies() {
  echo_color $YELLOW "📦 Installing core dependencies (consolidated approach)..."

  if [[ "$QUICK_MODE" == true ]]; then
    # Minimal setup - essential tools only
    npm install --save-dev eslint prettier husky lint-staged
    echo_color $GREEN "✅ Quick mode: Essential tools installed"
    return
  fi

  # Standard setup - consolidated tool stack
  local deps=(
    # Core quality tools (consolidated)
    "eslint" "prettier" "husky" "lint-staged"
    # Testing (streamlined - Vitest primary, Playwright for E2E)
    "vitest" "@playwright/test"
    # TypeScript support (if needed)
  )

  # Check if TypeScript is used
  if [[ -f "tsconfig.json" ]] || find . -name "*.ts" -o -name "*.tsx" | head -1 | grep -q .; then
    deps+=("@typescript-eslint/parser" "@typescript-eslint/eslint-plugin" "typescript")
    echo_color $BLUE "📝 TypeScript detected - adding TypeScript support"
  fi

  # Install in parallel if enabled
  if [[ "$PARALLEL_EXECUTION" == true ]]; then
    echo_color $BLUE "⚡ Installing dependencies in parallel..."
    npm install --save-dev "${deps[@]}" &
    INSTALL_PID=$!
  else
    npm install --save-dev "${deps[@]}"
  fi
}

### STREAMLINED SECURITY SETUP (PRIMARY + BACKUP)
setup_consolidated_security() {
  if [[ "$QUICK_MODE" == true ]]; then
    echo_color $YELLOW "⚡ Quick mode: Skipping security setup"
    return
  fi

  echo_color $BLUE "🛡️ Setting up consolidated security (SonarCloud primary)"

  # Primary: SonarCloud (comprehensive analysis)
  if [[ ! -f "sonar-project.properties" ]]; then
    cat > sonar-project.properties << 'EOF'
# AI-SDLC Framework - SonarCloud Configuration (Primary Security Scanner)
sonar.projectKey=ai-sdlc-framework
sonar.organization=thecreditpros
sonar.sources=src,app
sonar.tests=tests,__tests__
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.php.coverage.reportPaths=coverage/clover.xml
sonar.exclusions=**/node_modules/**,**/vendor/**,**/coverage/**
sonar.coverage.exclusions=**/*.test.js,**/*.spec.js,**/*.test.ts,**/*.spec.ts
EOF
    echo_color $GREEN "✅ SonarCloud configuration created (primary scanner)"
  fi

  # Backup: Basic security scanning (lightweight)
  if [[ -f "scripts-complex/security-scanner.js" ]]; then
    echo_color $BLUE "🔍 Backup security scanner available"
  fi

  echo_color $GREEN "✅ Consolidated security setup complete"
}

### OPTIMIZED GIT HOOKS (SELECTIVE EXECUTION)
setup_optimized_hooks() {
  echo_color $BLUE "🪝 Setting up optimized Git hooks..."

  # Modern Husky v9+ initialization
  npx husky init

  # Create optimized pre-commit hook with selective execution
  cat > .husky/pre-commit << 'EOF'
#!/bin/sh

# AI-SDLC Framework - Optimized Pre-commit Hook
# Features: Selective execution, performance optimization, escape hatches

# Emergency bypass check
if git log -1 --pretty=%B | grep -q "BYPASS:"; then
  echo "🚨 Emergency bypass detected - skipping hooks"
  exit 0
fi

# Check for documentation-only changes
CHANGED_FILES=$(git diff --cached --name-only)
DOC_ONLY=$(echo "$CHANGED_FILES" | grep -v -E '\.(md|txt|rst|adoc)$' | wc -l)

if [[ "$DOC_ONLY" -eq 0 ]]; then
  echo "📚 Documentation-only changes detected - running lightweight checks"
  npx prettier --write --list-different "*.md" || true
  exit 0
fi

# Selective hook execution based on file types
if echo "$CHANGED_FILES" | grep -q -E '\.(js|jsx|ts|tsx)$'; then
  echo "🔍 JavaScript/TypeScript changes detected"
  npx lint-staged --config .lintstagedrc.selective.json
elif echo "$CHANGED_FILES" | grep -q -E '\.php$'; then
  echo "🔍 PHP changes detected"
  # Run PHP-specific checks only
  if [[ -f "./vendor/bin/pint" ]]; then
    ./vendor/bin/pint --test || true
  fi
else
  echo "📝 Running basic formatting checks"
  npx prettier --write --list-different $CHANGED_FILES || true
fi

# Quick security scan (only for high-risk files)
if echo "$CHANGED_FILES" | grep -q -E '\.(env|key|pem|p12)$'; then
  echo "🚨 Security-sensitive files detected - running security scan"
  node scripts-complex/security-scanner.js --quick || true
fi

echo "✅ Optimized pre-commit checks complete"
EOF

  chmod +x .husky/pre-commit

  # Create selective lint-staged configuration
  cat > .lintstagedrc.selective.json << 'EOF'
{
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix --max-warnings 0",
    "prettier --write"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
}
EOF

  echo_color $GREEN "✅ Optimized Git hooks configured with selective execution"
}

### STREAMLINED TESTING SETUP
setup_streamlined_testing() {
  echo_color $BLUE "🧪 Setting up streamlined testing (Vitest + Playwright)"

  if [[ "$QUICK_MODE" == true ]]; then
    echo_color $YELLOW "⚡ Quick mode: Basic test setup only"
    # Create minimal test configuration
    if [[ ! -f "vitest.config.js" ]]; then
      cat > vitest.config.js << 'EOF'
// AI-SDLC Framework - Minimal Vitest Configuration
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      reporter: ['text', 'html'],
      threshold: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    }
  }
})
EOF
    fi
    return
  fi

  # Standard testing setup - consolidated approach
  echo_color $BLUE "📋 Configuring consolidated testing stack..."

  # Primary: Vitest for unit/integration tests
  if [[ ! -f "vitest.config.js" ]]; then
    cat > vitest.config.js << 'EOF'
// AI-SDLC Framework - Optimized Vitest Configuration
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    coverage: {
      reporter: ['text', 'lcov', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.{js,ts}',
        '**/*.spec.{js,ts}'
      ],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    // Performance optimization
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    }
  }
})
EOF
  fi

  # Secondary: Playwright for E2E tests (optimized config)
  if [[ ! -f "playwright.config.js" ]]; then
    cat > playwright.config.js << 'EOF'
// AI-SDLC Framework - Optimized Playwright Configuration
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // Reduced retries for performance
  workers: process.env.CI ? 2 : undefined, // Optimized worker count
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Performance optimizations
    navigationTimeout: 15000, // Reduced timeout
    actionTimeout: 5000,      // Reduced timeout
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
    // Removed Firefox and Safari for performance in development
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
EOF
  fi

  echo_color $GREEN "✅ Streamlined testing setup complete (Vitest + Playwright)"
}

### PERFORMANCE-OPTIMIZED PACKAGE.JSON SCRIPTS
setup_optimized_scripts() {
  echo_color $BLUE "📝 Setting up performance-optimized npm scripts..."

  # Wait for parallel installation to complete
  if [[ "$PARALLEL_EXECUTION" == true ]] && [[ -n "$INSTALL_PID" ]]; then
    wait $INSTALL_PID
    echo_color $GREEN "✅ Parallel dependency installation completed"
  fi

  # Add optimized scripts to package.json
  if [[ -f "package.json" ]]; then
    # Quick scripts (namespace organization)
    npx json -I -f package.json -e 'this.scripts=this.scripts||{}'

    # Core scripts
    npx json -I -f package.json -e 'this.scripts["test"]="vitest"'
    npx json -I -f package.json -e 'this.scripts["test:coverage"]="vitest --coverage"'
    npx json -I -f package.json -e 'this.scripts["test:e2e"]="playwright test"'
    npx json -I -f package.json -e 'this.scripts["lint"]="eslint . --cache --cache-location .eslintcache/"'
    npx json -I -f package.json -e 'this.scripts["format"]="prettier --write ."'

    # Quick scripts (grouped by function)
    npx json -I -f package.json -e 'this.scripts["quick:setup"]="npm install && npm run lint && npm test"'
    npx json -I -f package.json -e 'this.scripts["quick:test"]="vitest --run --reporter=basic"'
    npx json -I -f package.json -e 'this.scripts["quick:lint"]="eslint . --cache --max-warnings 0"'

    # Emergency scripts
    npx json -I -f package.json -e 'this.scripts["emergency:bypass"]="echo \"Emergency bypass - use: git commit -m \\\"hotfix: description\\\" --no-verify\""'
    npx json -I -f package.json -e 'this.scripts["emergency:status"]="git status && npm run lint -- --max-warnings 10"'

    # Performance scripts
    npx json -I -f package.json -e 'this.scripts["perf:test"]="vitest --run --reporter=basic --coverage=false"'
    npx json -I -f package.json -e 'this.scripts["perf:lint"]="eslint . --cache --cache-location .eslintcache/ --format=compact"'

    echo_color $GREEN "✅ Optimized npm scripts configured"
  fi
}

### ESCAPE HATCH DOCUMENTATION
create_escape_hatches() {
  if [[ "$QUICK_MODE" == true ]]; then
    return
  fi

  echo_color $BLUE "🚨 Creating escape hatch documentation..."

  cat > EMERGENCY_PROCEDURES.md << 'EOF'
# Emergency Procedures - AI-SDLC Framework

## Quick Bypass Options

### 1. Emergency Commit (Skip All Hooks)
```bash
git commit -m "hotfix: critical production issue" --no-verify
```

### 2. Bypass with Reason and Ticket
```bash
git commit -m "BYPASS: production incident - ticket INC-123

Critical fix for production outage
- Fixed database connection timeout
- Restored service availability

Bypass reason: Production incident
Ticket: INC-123"
```

### 3. Selective Hook Bypass
```bash
# Skip heavy security scans for documentation
git commit -m "docs: update README" --no-verify

# Or use selective hooks
./auto-setup-optimized.sh --selective-hooks
```

## Performance Optimizations

### Quick Commands
```bash
npm run quick:test      # Fast test run without coverage
npm run quick:lint      # Fast lint with cache
npm run perf:test       # Performance-optimized testing
```

### Emergency Status Check
```bash
npm run emergency:status  # Quick project health check
```

## Troubleshooting

### If Hooks Are Too Slow
1. Use `--selective-hooks` flag during setup
2. Run `npm run perf:lint` instead of full lint
3. Skip E2E tests in development: `npm run test -- --exclude=e2e`

### If Quality Gates Block Urgent Fix
1. Use `--no-verify` flag for commits
2. Create follow-up ticket for quality fixes
3. Document bypass reason in commit message

## Recovery Procedures

### Reset Hooks
```bash
rm -rf .husky
./auto-setup-optimized.sh --quick
```

### Emergency Rollback
```bash
git reset --hard HEAD~1  # Rollback last commit
git push --force-with-lease origin main  # Force push (use carefully)
```
EOF

  echo_color $GREEN "✅ Emergency procedures documented"
}

### VALIDATION WITH PERFORMANCE METRICS
validate_optimized_setup() {
  echo_color $YELLOW "✅ Validating optimized setup..."

  local start_time=$(date +%s)
  local issues=0

  # Essential validations only
  [[ -f .eslintrc.js ]] || [[ -f .eslintrc.json ]] || [[ -f eslint.config.js ]] || { echo_color $RED "⚠️ ESLint config missing"; ((issues++)); }
  [[ -f .prettierrc ]] || { echo_color $RED "⚠️ Prettier config missing"; ((issues++)); }
  [[ -f .husky/pre-commit ]] || { echo_color $RED "⚠️ Pre-commit hook missing"; ((issues++)); }

  if [[ "$QUICK_MODE" == false ]]; then
    [[ -f vitest.config.js ]] || { echo_color $RED "⚠️ Vitest config missing"; ((issues++)); }
    [[ -f playwright.config.js ]] || { echo_color $RED "⚠️ Playwright config missing"; ((issues++)); }
  fi

  local end_time=$(date +%s)
  local duration=$((end_time - start_time))

  if [[ $issues -eq 0 ]]; then
    echo_color $GREEN "🎉 Optimized setup complete with no issues!"
    echo_color $BLUE "⚡ Setup completed in ${duration} seconds"

    if [[ "$QUICK_MODE" == true ]]; then
      echo_color $BLUE "🚀 Quick mode: Ready for immediate development"
      echo_color $YELLOW "💡 Run './auto-setup-optimized.sh' for full setup later"
    else
      echo_color $BLUE "🚀 Full optimized setup: All tools configured with performance optimizations"
    fi

    if [[ "$BYPASS_MODE" == true ]]; then
      echo_color $YELLOW "🚨 Bypass mode was used - reason: $BYPASS_REASON, ticket: $BYPASS_TICKET"
    fi
  else
    echo_color $YELLOW "⚠️ Setup complete with $issues warnings (non-blocking)"
  fi

  # Performance summary
  echo_color $BLUE "📊 Performance Optimizations Applied:"
  echo "   ✅ Consolidated security tools (SonarCloud primary)"
  echo "   ✅ Streamlined testing (Vitest + Playwright only)"
  echo "   ✅ Selective pre-commit hooks"
  echo "   ✅ Parallel dependency installation"
  echo "   ✅ Emergency bypass procedures"
  echo "   ✅ Quick-start options available"

  echo_color $GREEN "🧪 Run 'npm run quick:test' to validate your setup"
}

### MAIN EXECUTION
main() {
  echo_color $GREEN "🚀 AI-SDLC Framework - Optimized Setup"
  echo_color $BLUE "   Performance-focused with escape hatches"
  echo ""

  parse_arguments "$@"
  check_prerequisites
  install_core_dependencies
  setup_consolidated_security
  setup_optimized_hooks
  setup_streamlined_testing
  setup_optimized_scripts
  create_escape_hatches
  validate_optimized_setup
}

main "$@"

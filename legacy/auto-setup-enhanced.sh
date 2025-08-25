#!/bin/bash

# Enhanced AI-Powered SDLC Setup Script with Graduated Complexity Levels
# Supports --minimal, --standard (default), --enterprise modes

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

### GLOBAL VARIABLES
SETUP_LEVEL="standard"  # Default to standard for backward compatibility
CONFIG_FILE="setup-levels.json"

### HELP FUNCTION
show_help() {
  echo_color $GREEN "🚀 AI-SDLC Framework Setup - Graduated Complexity Levels"
  echo ""
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Setup Levels:"
  echo "  --minimal     Essential tools only (ESLint, Prettier, basic testing) - 2-3 min"
  echo "  --standard    Current full setup (default) - 5-8 min"
  echo "  --enterprise  All features + compliance tools - 10-15 min"
  echo ""
  echo "Options:"
  echo "  --help        Show this help message"
  echo "  --version     Show version information"
  echo ""
  echo "Examples:"
  echo "  $0                    # Standard setup (default)"
  echo "  $0 --minimal          # Quick setup for new developers"
  echo "  $0 --enterprise       # Full enterprise features"
  echo ""
  echo "Backward Compatibility:"
  echo "  Running without flags defaults to --standard (current behavior)"
  echo ""
}

### VERSION FUNCTION
show_version() {
  echo_color $GREEN "AI-SDLC Framework v3.2.1"
  echo_color $BLUE "Enhanced setup with graduated complexity levels"
}

### PARSE ARGUMENTS
parse_arguments() {
  local conflicting_flags=()

  while [[ $# -gt 0 ]]; do
    case $1 in
      --minimal)
        if [[ "$SETUP_LEVEL" != "standard" ]]; then
          conflicting_flags+=("$SETUP_LEVEL" "$1")
        fi
        SETUP_LEVEL="minimal"
        shift
        ;;
      --standard)
        if [[ "$SETUP_LEVEL" != "standard" ]]; then
          conflicting_flags+=("$SETUP_LEVEL" "$1")
        fi
        SETUP_LEVEL="standard"
        shift
        ;;
      --enterprise)
        if [[ "$SETUP_LEVEL" != "standard" ]]; then
          conflicting_flags+=("$SETUP_LEVEL" "$1")
        fi
        SETUP_LEVEL="enterprise"
        shift
        ;;
      --help|-h)
        show_help
        exit 0
        ;;
      --version|-v)
        show_version
        exit 0
        ;;
      *)
        echo_color $RED "❌ Unknown option: $1"
        echo_color $YELLOW "💡 Use --help for usage information"
        exit 1
        ;;
    esac
  done

  # Check for conflicting flags
  if [[ ${#conflicting_flags[@]} -gt 0 ]]; then
    echo_color $RED "❌ Conflicting setup levels detected: ${conflicting_flags[*]}"
    echo_color $YELLOW "💡 Please use only one setup level flag"
    exit 1
  fi
}

### LOAD CONFIGURATION
load_config() {
  if [[ ! -f "$CONFIG_FILE" ]]; then
    echo_color $RED "❌ Configuration file $CONFIG_FILE not found"
    echo_color $YELLOW "💡 Please ensure setup-levels.json exists in the current directory"
    exit 1
  fi

  # Validate JSON syntax
  if ! node -e "JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8'))" 2>/dev/null; then
    echo_color $RED "❌ Invalid JSON in $CONFIG_FILE"
    exit 1
  fi
}

### GET CONFIG VALUE
get_config() {
  local path="$1"
  node -e "
    const config = JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8'));
    const value = path.split('.').reduce((obj, key) => obj && obj[key], config);
    console.log(value || '');
  " -- "$path"
}

### PREREQUISITES CHECK
check_prerequisites() {
  echo_color $YELLOW "🔍 Checking prerequisites for $SETUP_LEVEL setup..."

  # Check required tools
  local required_tools=$(get_config "validation.requiredTools.$SETUP_LEVEL")
  if [[ -n "$required_tools" ]]; then
    echo "$required_tools" | tr ',' '\n' | while read -r tool; do
      tool=$(echo "$tool" | tr -d '"[]' | xargs)
      if [[ -n "$tool" ]]; then
        command -v "$tool" >/dev/null 2>&1 || {
          echo_color $RED "❌ Required tool '$tool' not found";
          exit 1;
        }
      fi
    done
  fi

  # Check if we're in a git repository
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo_color $RED "❌ This script must be run inside a Git repository."
    echo_color $YELLOW "💡 Run 'git init' first to initialize a Git repository."
    exit 1
  fi

  # Check for project-specific tools only if directories exist
  if [[ -d "backend" ]] || [[ -f "artisan" ]]; then
    command -v composer >/dev/null 2>&1 || {
      echo_color $RED "❌ Composer is required for Laravel backend.";
      exit 1;
    }
  fi

  echo_color $GREEN "✔️ Prerequisites check passed"
}

### INSTALL DEPENDENCIES BASED ON LEVEL
install_dependencies() {
  local level_config="setupLevels.$SETUP_LEVEL"

  echo_color $YELLOW "📦 Installing dependencies for $SETUP_LEVEL setup..."

  # Get dependencies for the current level
  local core_deps=$(get_config "$level_config.dependencies.core")
  local testing_deps=$(get_config "$level_config.dependencies.testing")
  local typescript_deps=$(get_config "$level_config.dependencies.typescript")
  local security_deps=$(get_config "$level_config.dependencies.security")

  # Build npm install command
  local npm_packages=""

  # Add core dependencies
  if [[ -n "$core_deps" ]]; then
    npm_packages+=" $(echo "$core_deps" | tr -d '[]"' | tr ',' ' ')"
  fi

  # Add testing dependencies
  if [[ -n "$testing_deps" ]]; then
    npm_packages+=" $(echo "$testing_deps" | tr -d '[]"' | tr ',' ' ')"
  fi

  # Add TypeScript dependencies if TypeScript is detected
  if [[ -f "tsconfig.json" ]] || find . -name "*.ts" -o -name "*.tsx" | head -1 | grep -q .; then
    if [[ -n "$typescript_deps" ]]; then
      npm_packages+=" $(echo "$typescript_deps" | tr -d '[]"' | tr ',' ' ')"
    fi
  fi

  # Add security dependencies for enterprise
  if [[ "$SETUP_LEVEL" == "enterprise" ]] && [[ -n "$security_deps" ]]; then
    npm_packages+=" $(echo "$security_deps" | tr -d '[]"' | tr ',' ' ')"
  fi

  # Install packages
  if [[ -n "$npm_packages" ]]; then
    npm install --save-dev $npm_packages
    echo_color $GREEN "✔️ Dependencies installed successfully"
  fi
}

### SETUP GIT HOOKS
setup_git_hooks() {
  local features=$(get_config "setupLevels.$SETUP_LEVEL.features")

  if echo "$features" | grep -q '"gitHooks":true'; then
    echo_color $YELLOW "🪝 Setting up Git hooks..."

    # Modern Husky v8+ initialization
    npx husky init

    # Create pre-commit hook based on level
    if [[ "$SETUP_LEVEL" == "minimal" ]]; then
      cat > .husky/pre-commit << 'EOF'
npx lint-staged
EOF
    else
      cat > .husky/pre-commit << 'EOF'
npx lint-staged
EOF
    fi

    chmod +x .husky/pre-commit
    echo_color $GREEN "✔️ Git hooks configured for $SETUP_LEVEL level"
  fi
}

### SETUP BASIC CONFIGURATION
setup_basic_configuration() {
  echo_color $YELLOW "⚙️ Setting up basic configuration files..."

  # Create ESLint config if none exists
  if [[ ! -f ".eslintrc.js" ]] && [[ ! -f ".eslintrc.json" ]] && [[ ! -f "eslint.config.js" ]]; then
    if [[ -f "tsconfig.json" ]] || find . -name "*.ts" -o -name "*.tsx" | head -1 | grep -q .; then
      echo_color $YELLOW "📝 Creating TypeScript ESLint configuration..."
      cat > eslint.config.js << 'EOF'
const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');

module.exports = [
  {
    files: ['**/*.js', '**/*.jsx'],
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'warn',
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { '@typescript-eslint': typescriptEslint },
    rules: {
      'no-console': 'warn',
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
];
EOF
    else
      echo_color $YELLOW "📝 Creating JavaScript ESLint configuration..."
      cat > eslint.config.js << 'EOF'
module.exports = [
  {
    files: ['**/*.js', '**/*.jsx'],
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'warn',
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
    },
  },
];
EOF
    fi
    echo_color $GREEN "✔️ Created ESLint configuration."
  fi

  # Create Prettier config if none exists
  if [[ ! -f ".prettierrc" ]]; then
    cat > .prettierrc << 'EOF'
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
EOF
    echo_color $GREEN "✔️ Created Prettier configuration."
  fi
}

### SETUP TESTING CONFIGURATION
setup_testing() {
  local features=$(get_config "setupLevels.$SETUP_LEVEL.features")

  if echo "$features" | grep -q '"basicTesting":true'; then
    echo_color $YELLOW "🧪 Setting up testing configuration..."

    # Create basic Vitest config if none exists
    if [[ ! -f "vitest.config.js" ]] && [[ ! -f "vitest.config.ts" ]]; then
      cat > vitest.config.js << 'EOF'
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test-setup.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test-setup.js',
      ],
    },
  },
});
EOF
      echo_color $GREEN "✔️ Created Vitest configuration"
    fi

    # Create test setup file
    if [[ ! -f "test-setup.js" ]]; then
      cat > test-setup.js << 'EOF'
import '@testing-library/jest-dom';
EOF
      echo_color $GREEN "✔️ Created test setup file"
    fi
  fi

  # Setup E2E testing for standard and enterprise
  if echo "$features" | grep -q '"e2eTesting":true'; then
    if [[ ! -f "playwright.config.js" ]]; then
      echo_color $YELLOW "🎭 Setting up Playwright E2E testing..."
      cat > playwright.config.js << 'EOF'
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
EOF
      echo_color $GREEN "✔️ Created Playwright configuration"
    fi
  fi
}

### SETUP ADVANCED FEATURES
setup_advanced_features() {
  local features=$(get_config "setupLevels.$SETUP_LEVEL.features")

  # Setup CI/CD for standard and enterprise
  if echo "$features" | grep -q '"cicd":true'; then
    echo_color $BLUE "🚀 Setting up CI/CD automation..."
    mkdir -p .github/workflows
    echo_color $GREEN "✔️ CI/CD directory structure created"
  fi

  # Setup performance monitoring for standard and enterprise
  if echo "$features" | grep -q '"performance":true'; then
    if [[ ! -f "lighthouse.config.js" ]]; then
      echo_color $BLUE "⚡ Setting up performance monitoring..."
      cat > lighthouse.config.js << 'EOF'
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      startServerCommand: 'npm run dev',
      startServerReadyPattern: 'ready|listening|started',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
EOF
      echo_color $GREEN "✔️ Performance monitoring configured"
    fi
  fi

  # Setup MCP servers for enterprise
  if echo "$features" | grep -q '"mcp":true'; then
    if [[ -f "scripts-complex/mcp-installer.js" ]]; then
      echo_color $BLUE "🔌 Setting up MCP servers..."
      node scripts-complex/mcp-installer.js || echo_color $YELLOW "⚠️ MCP setup had warnings"
      echo_color $GREEN "✔️ MCP servers configured"
    fi
  fi

  # Setup PostgreSQL automation for enterprise
  if echo "$features" | grep -q '"postgresql":true'; then
    if command -v psql >/dev/null 2>&1; then
      echo_color $BLUE "🐘 Setting up PostgreSQL automation..."
      if [[ -f "scripts-complex/postgres-automation.sh" ]] && [[ ! -f "./postgres-automation.sh" ]]; then
        cp ./scripts-complex/postgres-automation.sh ./postgres-automation.sh
        chmod +x ./postgres-automation.sh
        echo_color $GREEN "✔️ PostgreSQL automation configured"
      fi
    else
      echo_color $YELLOW "⚠️ PostgreSQL not detected - skipping database automation"
    fi
  fi
}

### SETUP PACKAGE.JSON SCRIPTS
setup_package_scripts() {
  if [[ ! -f "package.json" ]]; then
    echo_color $YELLOW "📝 Creating package.json..."
    cat > package.json << 'EOF'
{
  "name": "ai-sdlc-project",
  "version": "1.0.0",
  "description": "AI-SDLC Framework Project",
  "scripts": {},
  "devDependencies": {}
}
EOF
  fi

  echo_color $YELLOW "📝 Adding scripts for $SETUP_LEVEL level..."

  # Get scripts for current level
  local scripts=$(get_config "setupLevels.$SETUP_LEVEL.scripts")

  # Add scripts using node
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const config = JSON.parse(fs.readFileSync('$CONFIG_FILE', 'utf8'));
    const scripts = config.setupLevels['$SETUP_LEVEL'].scripts;

    pkg.scripts = pkg.scripts || {};
    Object.assign(pkg.scripts, scripts);

    // Add prepare script for Husky
    pkg.scripts.prepare = 'husky';

    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  "

  echo_color $GREEN "✔️ Package.json scripts configured for $SETUP_LEVEL level"
}

### SETUP LINT-STAGED
setup_lint_staged() {
  echo_color $YELLOW "🧹 Setting up lint-staged configuration..."

  # Add lint-staged config to package.json
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    pkg['lint-staged'] = {
      '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
      '*.{json,md,yml,yaml}': ['prettier --write']
    };

    // Add PHP linting for Laravel projects
    if (require('fs').existsSync('artisan') || require('fs').existsSync('backend')) {
      pkg['lint-staged']['*.php'] = [
        'bash -c \"if [ -f ./vendor/bin/pint ] && [[ \\\"\$0\\\" != *\\\".template.php\\\" ]]; then ./vendor/bin/pint \\\"\$0\\\"; fi\"'
      ];
    }

    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  "

  echo_color $GREEN "✔️ Lint-staged configuration added"
}

### DETECT AND SETUP PROJECT TYPE
detect_and_setup_project() {
  echo_color $YELLOW "🔍 Detecting project type and setting up accordingly..."

  # Laravel Backend Detection
  if [[ -f "artisan" ]] || [[ -d "backend" ]]; then
    echo_color $GREEN "📦 Laravel project detected"
    if [[ "$SETUP_LEVEL" == "enterprise" ]]; then
      if [[ -f "artisan" ]]; then
        composer require --dev pestphp/pest laravel/pulse laravel/pennant --with-all-dependencies || true
      elif [[ -d "backend" ]]; then
        cd backend
        composer require --dev pestphp/pest laravel/pulse laravel/pennant --with-all-dependencies || true
        cd ..
      fi
      echo_color $GREEN "✔️ Laravel enterprise tools installed"
    fi
  fi

  # React/TypeScript Frontend Detection
  if [[ -f "client-frontend/package.json" ]] || [[ -f "frontend/package.json" ]]; then
    echo_color $GREEN "📦 Frontend project detected"
    # Dependencies already handled in install_dependencies
  fi
}

### CREATE VALIDATION SCRIPT
create_validation_script() {
  cat > validate-setup.js << 'EOF'
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Validating AI-SDLC Setup...\n');

// Load setup level from package.json or default to standard
let setupLevel = 'standard';
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  setupLevel = pkg.aiSdlcLevel || 'standard';
} catch (e) {
  // Use default
}

console.log(`📋 Validating ${setupLevel} setup level...\n`);

const checks = [
  { name: 'ESLint', command: 'npx eslint --version', success: 'ESLint available' },
  { name: 'Prettier', command: 'npx prettier --version', success: 'Prettier available' },
  { name: 'Husky', command: 'npx husky --version', success: 'Husky available' }
];

// Add level-specific checks
if (setupLevel !== 'minimal') {
  checks.push(
    { name: 'Vitest', command: 'npx vitest --version', success: 'Vitest available' },
    { name: 'Playwright', command: 'npx playwright --version', success: 'Playwright available' }
  );
}

let passed = 0;
let total = checks.length;

checks.forEach(check => {
  try {
    execSync(check.command, { stdio: 'ignore' });
    console.log(`✅ ${check.success}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${check.name} not properly configured`);
  }
});

console.log(`\n📊 Validation Results: ${passed}/${total} checks passed`);

if (passed === total) {
  console.log(`🎉 ${setupLevel} setup validated successfully!`);
} else {
  console.log('⚠️  Some components need attention. Check documentation.');
}
EOF

  # Add setup level to package.json
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.aiSdlcLevel = '$SETUP_LEVEL';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  "
}

### VALIDATE CONFIGURATION
validate_configuration() {
  echo_color $YELLOW "✅ Validating $SETUP_LEVEL setup..."
  local issues=0

  # Check essential files based on level
  [[ -f .eslintrc.js ]] || [[ -f .eslintrc.json ]] || [[ -f eslint.config.js ]] || {
    echo_color $RED "⚠️ ESLint config missing";
    ((issues++));
  }
  [[ -f .prettierrc ]] || {
    echo_color $RED "⚠️ Prettier config missing";
    ((issues++));
  }

  # Level-specific validation
  local features=$(get_config "setupLevels.$SETUP_LEVEL.features")

  if echo "$features" | grep -q '"e2eTesting":true'; then
    [[ -f playwright.config.js ]] || {
      echo_color $RED "⚠️ Playwright config missing";
      ((issues++));
    }
  fi

  if [[ $issues -eq 0 ]]; then
    # Show completion message
    local complete_msg=$(get_config "messages.$SETUP_LEVEL.complete")
    echo_color $GREEN "$complete_msg"
  else
    echo_color $YELLOW "⚠️ Setup complete with $issues warnings."
  fi

  echo_color $GREEN "🧪 Run 'npm run validate' to test your setup."
}

### MAIN FUNCTION
main() {
  # Parse command line arguments
  parse_arguments "$@"

  # Load configuration
  load_config

  # Show start message
  local start_msg=$(get_config "messages.$SETUP_LEVEL.start")
  echo_color $GREEN "$start_msg"
  echo ""

  # Execute setup steps
  check_prerequisites
  install_dependencies
  setup_basic_configuration
  setup_package_scripts
  setup_lint_staged
  setup_git_hooks
  detect_and_setup_project
  setup_testing
  setup_advanced_features
  create_validation_script
  validate_configuration
}

# Execute main function with all arguments
main "$@"

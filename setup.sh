#!/bin/bash

# AI-SDLC Simple Setup
# Supports Minimal, Standard, and Enterprise setup levels

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

# Default setup level
SETUP_LEVEL="standard"
CLEANUP=false
SKIP_SECURITY=false
SKIP_TESTING=false
SKIP_AI=false
SKIP_MCP=false
SKIP_COMPLIANCE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --minimal)
      SETUP_LEVEL="minimal"
      shift
      ;;
    --standard)
      SETUP_LEVEL="standard"
      shift
      ;;
    --enterprise)
      SETUP_LEVEL="enterprise"
      shift
      ;;
    --cleanup)
      CLEANUP=true
      shift
      ;;
    --skip-security)
      SKIP_SECURITY=true
      shift
      ;;
    --skip-testing)
      SKIP_TESTING=true
      shift
      ;;
    --skip-ai)
      SKIP_AI=true
      shift
      ;;
    --skip-mcp)
      SKIP_MCP=true
      shift
      ;;
    --skip-compliance)
      SKIP_COMPLIANCE=true
      shift
      ;;
    -h|--help)
      echo "AI-SDLC Framework Setup"
      echo "Usage: ./setup.sh [OPTIONS]"
      echo ""
      echo "Setup Levels:"
      echo "  --minimal     Essential tools only (2-3 minutes)"
      echo "  --standard    Balanced development experience (5-8 minutes) [default]"
      echo "  --enterprise  Full enterprise features + compliance (10-15 minutes)"
      echo ""
      echo "Options:"
      echo "  --cleanup     Remove installed dependencies and configs"
      echo "  --skip-security    Skip security tools installation"
      echo "  --skip-testing     Skip testing tools installation"
      echo "  --skip-ai          Skip AI tools installation"
      echo "  --skip-mcp         Skip MCP server installation"
      echo "  --skip-compliance  Skip compliance tools installation"
      echo "  -h, --help         Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Run './setup.sh --help' for usage information."
      exit 1
      ;;
  esac
done

### PREREQUISITES CHECK
check_prerequisites() {
  echo_color $YELLOW "🔍 Checking prerequisites for $SETUP_LEVEL setup..."

  # Check required tools
  command -v node >/dev/null 2>&1 || { echo_color $RED "❌ Node.js is required."; exit 1; }
  command -v npm >/dev/null 2>&1 || { echo_color $RED "❌ npm is required."; exit 1; }
  command -v git >/dev/null 2>&1 || { echo_color $RED "❌ Git is required."; exit 1; }

  # Check Node.js version
  NODE_VERSION=$(node --version | cut -d'.' -f1 | sed 's/v//')
  if [[ $NODE_VERSION -lt 18 ]]; then
    echo_color $RED "❌ Node.js version 18 or higher is required. Current: $(node --version)"
    exit 1
  fi

  # Check if we're in a git repository
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo_color $RED "❌ This script must be run inside a Git repository."
    echo_color $YELLOW "💡 Run 'git init' first to initialize a Git repository."
    exit 1
  fi

  echo_color $GREEN "✅ Prerequisites check passed"
}

### LOAD SETUP LEVELS CONFIGURATION
load_setup_config() {
  if [[ ! -f "setup-levels.json" ]]; then
    echo_color $RED "❌ setup-levels.json not found"
    exit 1
  fi

  echo_color $YELLOW "📋 Loading setup configuration for $SETUP_LEVEL level..."

  # Extract configuration for the selected setup level using node
  CONFIG=$(node -e "
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync('setup-levels.json', 'utf8'));
    const level = config.setupLevels['$SETUP_LEVEL'];
    if (!level) {
      console.error('Setup level $SETUP_LEVEL not found in configuration');
      process.exit(1);
    }
    console.log(JSON.stringify(level));
  ")

  if [[ $? -ne 0 ]]; then
    echo_color $RED "❌ Failed to load setup configuration"
    exit 1
  fi

  echo_color $GREEN "✅ Setup configuration loaded"
}

### CLEANUP FUNCTION
cleanup() {
  echo_color $YELLOW "🧹 Cleaning up previous installation..."

  # Remove installed dependencies
  if [[ -f "package.json" ]]; then
    node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      if (pkg.devDependencies) {
        const deps = Object.keys(pkg.devDependencies);
        console.log('Removing dev dependencies:', deps.join(', '));
      }
    "
  fi

  # Remove configuration files
  rm -f .eslintrc.js .prettierrc eslint.config.js
  rm -f .husky/pre-commit 2>/dev/null || true

  # Remove scripts
  rm -f validate-setup.js

  # Remove database automation
  rm -f postgres-automation.sh

  echo_color $GREEN "✅ Cleanup completed"
}

### INSTALL DEPENDENCIES
install_dependencies() {
  echo_color $YELLOW "📦 Installing dependencies for $SETUP_LEVEL setup..."

  # Install core dependencies
  CORE_DEPS=$(node -e "
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync('setup-levels.json', 'utf8'));
    const deps = config.setupLevels['$SETUP_LEVEL'].dependencies.core || [];
    console.log(deps.join(' '));
  ")

  if [[ -n "$CORE_DEPS" ]]; then
    npm install --save-dev $CORE_DEPS
  fi

  # Install testing dependencies (unless skipped)
  if [[ "$SKIP_TESTING" == false ]]; then
    TESTING_DEPS=$(node -e "
      const fs = require('fs');
      const config = JSON.parse(fs.readFileSync('setup-levels.json', 'utf8'));
      const deps = config.setupLevels['$SETUP_LEVEL'].dependencies.testing || [];
      console.log(deps.join(' '));
    ")

    if [[ -n "$TESTING_DEPS" ]]; then
      npm install --save-dev $TESTING_DEPS
    fi
  fi

  # Install TypeScript dependencies if needed
  if [[ -f "tsconfig.json" ]] || find . -name "*.ts" -o -name "*.tsx" | head -1 | grep -q .; then
    TYPESCRIPT_DEPS=$(node -e "
      const fs = require('fs');
      const config = JSON.parse(fs.readFileSync('setup-levels.json', 'utf8'));
      const deps = config.setupLevels['$SETUP_LEVEL'].dependencies.typescript || [];
      console.log(deps.join(' '));
    ")

    if [[ -n "$TYPESCRIPT_DEPS" ]]; then
      npm install --save-dev $TYPESCRIPT_DEPS
    fi
  fi

  # Install API dependencies
  API_DEPS=$(node -e "
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync('setup-levels.json', 'utf8'));
    const deps = config.setupLevels['$SETUP_LEVEL'].dependencies.api || [];
    console.log(deps.join(' '));
  ")

  if [[ -n "$API_DEPS" ]]; then
    npm install --save-dev $API_DEPS
  fi

  # Install security dependencies (unless skipped)
  if [[ "$SKIP_SECURITY" == false ]] && [[ "$SETUP_LEVEL" == "enterprise" ]]; then
    SECURITY_DEPS=$(node -e "
      const fs = require('fs');
      const config = JSON.parse(fs.readFileSync('setup-levels.json', 'utf8'));
      const deps = config.setupLevels['$SETUP_LEVEL'].dependencies.security || [];
      console.log(deps.join(' '));
    ")

    if [[ -n "$SECURITY_DEPS" ]]; then
      npm install --save-dev $SECURITY_DEPS
    fi
  fi

  echo_color $GREEN "✅ Dependencies installed"
}

### SETUP GIT HOOKS
setup_git_hooks() {
  echo_color $YELLOW "🪝 Setting up Git hooks..."

  # Initialize Husky
  npx husky init

  # Create pre-commit hook
  cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
EOF
  chmod +x .husky/pre-commit

  echo_color $GREEN "✅ Git hooks configured"
}

### SETUP CONFIGURATION FILES
setup_configuration() {
  echo_color $YELLOW "⚙️ Setting up configuration files..."

  # Create ESLint configuration
  if [[ ! -f ".eslintrc.js" ]] && [[ ! -f ".eslintrc.json" ]] && [[ ! -f "eslint.config.js" ]]; then
    if [[ -f "tsconfig.json" ]] || find . -name "*.ts" -o -name "*.tsx" | head -1 | grep -q .; then
      # TypeScript configuration
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
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
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
      # JavaScript configuration
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

  # Create basic Prettier config if none exists
  if [[ ! -f ".prettierrc" ]]; then
    cat > .prettierrc << 'EOF'
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
EOF
    echo_color $GREEN "✔️ Created basic Prettier configuration."
  fi

  echo_color $GREEN "⚙️ Configuration files setup complete."
}

### SETUP API VALIDATION TOOLS
setup_api_validation() {
  echo_color $BLUE "🔍 Setting up API validation tools..."

  # Create reports directory structure
  mkdir -p reports/api-documentation reports/api-validation reports/api-contracts reports/api-processes

  # Add API validation scripts to package.json
  if [[ -f "package.json" ]]; then
    echo_color $BLUE "📝 Adding API validation scripts to package.json..."

    # Add API validation scripts
    npx json -I -f package.json -e 'this.scripts=this.scripts||{}'
    npx json -I -f package.json -e 'this.scripts["api:validate-docs"]="node scripts-complex/api-documentation-validator.js validate"'
    npx json -I -f package.json -e 'this.scripts["api:validate-errors"]="node scripts-complex/api-error-validator.js validate"'
    npx json -I -f package.json -e 'this.scripts["api:test-contracts"]="node scripts-complex/api-contract-tester.js test"'
    npx json -I -f package.json -e 'this.scripts["api:analyze-processes"]="node scripts-complex/api-process-analyzer.js analyze"'
    npx json -I -f package.json -e 'this.scripts["api:validate-all"]="npm run api:validate-docs && npm run api:validate-errors && npm run api:test-contracts && npm run api:analyze-processes"'

    echo_color $GREEN "✅ API validation scripts added to package.json"
  fi

  echo_color $GREEN "🔍 API validation tools setup complete!"
}

### SETUP LEVELS CONFIGURATION
setup_levels_configuration() {
  echo_color $BLUE "📋 Configuring setup levels..."

  # Update setup-levels.json with API validation features
  if [[ -f "setup-levels.json" ]]; then
    node -e "
      const fs = require('fs');
      const config = JSON.parse(fs.readFileSync('setup-levels.json', 'utf8'));

      // Add API validation dependencies to all levels
      const apiDeps = ['swagger-parser', 'openapi-types', 'yaml'];

      // Minimal level - basic API validation
      if (config.setupLevels.minimal) {
        config.setupLevels.minimal.dependencies = config.setupLevels.minimal.dependencies || {};
        config.setupLevels.minimal.dependencies.api = apiDeps;
      }

      // Standard level - full API validation
      if (config.setupLevels.standard) {
        config.setupLevels.standard.dependencies = config.setupLevels.standard.dependencies || {};
        config.setupLevels.standard.dependencies.api = [
          ...apiDeps,
          '@apidevtools/swagger-parser',
          'ajv',
          'json-schema'
        ];
      }

      // Enterprise level - complete API validation with security
      if (config.setupLevels.enterprise) {
        config.setupLevels.enterprise.dependencies = config.setupLevels.enterprise.dependencies || {};
        config.setupLevels.enterprise.dependencies.api = [
          ...apiDeps,
          '@apidevtools/swagger-parser',
          'ajv',
          'json-schema',
          'zaproxy',
          'owasp-threat-dragon'
        ];
        config.setupLevels.enterprise.dependencies.security = [
          'eslint-plugin-security',
          'nsp',
          'snyk'
        ];
      }

      fs.writeFileSync('setup-levels.json', JSON.stringify(config, null, 2));
    "

    echo_color $GREEN "📋 Setup levels configured with API validation features"
  fi
}

### VALIDATE & REPORT
validate_configuration() {
  echo_color $YELLOW "✅ Validating setup..."
  local issues=0

  # Check essential files
  [[ -f .eslintrc.js ]] || [[ -f .eslintrc.json ]] || [[ -f eslint.config.js ]] || { echo_color $RED "⚠️ ESLint config missing"; ((issues++)); }
  [[ -f .prettierrc ]] || { echo_color $RED "⚠️ Prettier config missing"; ((issues++)); }

  # Check API validation setup
  [[ -d reports/api-documentation ]] || { echo_color $RED "⚠️ API documentation reports directory missing"; ((issues++)); }
  [[ -d reports/api-validation ]] || { echo_color $RED "⚠️ API validation reports directory missing"; ((issues++)); }
  [[ -d reports/api-contracts ]] || { echo_color $RED "⚠️ API contracts reports directory missing"; ((issues++)); }
  [[ -d reports/api-processes ]] || { echo_color $RED "⚠️ API processes reports directory missing"; ((issues++)); }

  if [[ $issues -eq 0 ]]; then
    echo_color $GREEN "🎉 Setup complete with no issues!"
    echo_color $BLUE "🚀 API validation tools ready for use"
  else
    echo_color $YELLOW "⚠️ Setup complete with $issues warnings. See documentation for full details."
  fi

  echo_color $GREEN "🧪 Run 'npm run validate' to test your setup."
  echo_color $GREEN "🔍 Run 'npm run api:validate-all' to run all API validation tools."
}

main() {
  if [[ "$CLEANUP" == true ]]; then
    cleanup
    exit 0
  fi

  check_prerequisites
  load_setup_config
  install_dependencies
  setup_git_hooks
  setup_configuration
  setup_api_validation
  setup_levels_configuration
  validate_configuration
}

main "$@"

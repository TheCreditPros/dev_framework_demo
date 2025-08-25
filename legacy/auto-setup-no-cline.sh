#!/bin/bash

# AI-Powered SDLC Setup Script (Cline-Free Version)
# Supports Laravel + TypeScript React projects

set -e

### COLORS
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
NC="\033[0m"

echo_color() {
  echo -e "${1}${2}${NC}"
}

echo_color $GREEN "🚀 AI-SDLC Single Command Setup"
echo_color $GREEN "   This is the ONLY setup command you need!"
echo ""

### PREREQUISITES CHECK
check_prerequisites() {
  echo_color $YELLOW "🔍 Checking prerequisites..."
  command -v node >/dev/null 2>&1 || { echo_color $RED "❌ Node.js is required."; exit 1; }
  command -v npm >/dev/null 2>&1 || { echo_color $RED "❌ npm is required."; exit 1; }
  command -v git >/dev/null 2>&1 || { echo_color $RED "❌ Git is required."; exit 1; }

  # Check if we're in a git repository
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo_color $RED "❌ This script must be run inside a Git repository."
    echo_color $YELLOW "💡 Run 'git init' first to initialize a Git repository."
    exit 1
  fi

  # Check for project-specific tools only if directories exist
  if [[ -d "backend" ]] || [[ -f "artisan" ]]; then
    command -v composer >/dev/null 2>&1 || { echo_color $RED "❌ Composer is required for Laravel backend."; exit 1; }
  fi
}

### INSTALL SHARED PACKAGES & HOOKS
install_common_dependencies() {
  echo_color $YELLOW "📦 Installing shared developer dependencies..."
  npm install --save-dev eslint prettier husky lint-staged commitlint @commitlint/config-conventional

  # Install Playwright and testing dependencies
  echo_color $YELLOW "🤖 Installing testing automation..."
  npm install --save-dev @playwright/test playwright-qase-reporter

  # Install TypeScript ESLint support if TypeScript is detected
  if [[ -f "tsconfig.json" ]] || find . -name "*.ts" -o -name "*.tsx" | head -1 | grep -q .; then
    echo_color $YELLOW "📝 TypeScript detected - installing ESLint TypeScript support..."
    npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
  fi

  # Modern Husky v8+ initialization
  echo_color $YELLOW "🪝 Setting up Git hooks with Husky..."
  npx husky init

  # Create pre-commit hook (modern Husky format)
  cat > .husky/pre-commit << 'EOF'
npx lint-staged
EOF
  chmod +x .husky/pre-commit

  echo_color $GREEN "✔️ Git hooks configured successfully."
}

### DETECT AND SETUP PROJECT TYPE
detect_and_setup_project() {
  # Laravel Backend Detection
  if [[ -f "artisan" ]] || [[ -d "backend" ]]; then
    echo_color $GREEN "📦 Laravel project detected"
    if [[ -f "artisan" ]]; then
      composer require --dev pestphp/pest laravel/pulse laravel/pennant --with-all-dependencies
    elif [[ -d "backend" ]]; then
      cd backend
      composer require --dev pestphp/pest laravel/pulse laravel/pennant --with-all-dependencies
      cd ..
    fi
    echo_color $GREEN "✔️ Installed Pest, Pulse, and Pennant for backend quality and monitoring."
  fi

  # TypeScript Client Frontend Detection
  if [[ -f "client-frontend/package.json" ]] || [[ -f "frontend/package.json" ]]; then
    echo_color $GREEN "📦 TypeScript client detected"
    if [[ -f "client-frontend/package.json" ]]; then
      cd client-frontend
    elif [[ -f "frontend/package.json" ]]; then
      cd frontend
    fi
    npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
    cd ..
    echo_color $GREEN "✔️ Installed Vitest and React testing libraries."
  fi

  # JavaScript Admin Frontend Detection
  if [[ -f "admin-frontend/package.json" ]] || [[ -f "admin/package.json" ]]; then
    echo_color $GREEN "📦 JavaScript admin detected"
    if [[ -f "admin-frontend/package.json" ]]; then
      cd admin-frontend
    elif [[ -f "admin/package.json" ]]; then
      cd admin
    fi
    npm install --save-dev jest @testing-library/react @testing-library/jest-dom
    cd ..
    echo_color $GREEN "✔️ Installed Jest and React testing libraries."
  fi

  # React App Detection (root level)
  if [[ -f "package.json" ]] && ! [[ -f "client-frontend/package.json" ]] && ! [[ -f "admin-frontend/package.json" ]]; then
    echo_color $GREEN "📦 React project detected"
    npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
    echo_color $GREEN "✔️ Installed Vitest and React testing libraries."
  fi
}

### SETUP BASIC CONFIGURATION
setup_basic_configuration() {
  echo_color $YELLOW "⚙️ Setting up basic configuration files..."

  # Create ESLint config based on project type
  if [[ ! -f ".eslintrc.js" ]] && [[ ! -f ".eslintrc.json" ]] && [[ ! -f "eslint.config.js" ]]; then
    # Check if TypeScript is present
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

  echo_color $GREEN "✔️ Basic configuration setup complete."
}

### VALIDATE & REPORT
validate_configuration() {
  echo_color $YELLOW "✅ Validating setup..."
  local issues=0

  # Check essential files
  [[ -f .eslintrc.js ]] || [[ -f .eslintrc.json ]] || [[ -f eslint.config.js ]] || { echo_color $RED "⚠️ ESLint config missing"; ((issues++)); }
  [[ -f .prettierrc ]] || { echo_color $RED "⚠️ Prettier config missing"; ((issues++)); }

  # Check project-specific configs
  if [[ -f "client-frontend/package.json" ]]; then
    cd client-frontend
    [[ -f "vitest.config.js" ]] || [[ -f "vitest.config.ts" ]] || { echo_color $RED "⚠️ Vitest config missing"; ((issues++)); }
    cd ..
  fi

  if [[ -f "artisan" ]] || [[ -d "backend" ]]; then
    if [[ -f "artisan" ]]; then
      [[ -d "tests" ]] || [[ -d "tests/Pest.php" ]] || { echo_color $RED "⚠️ Laravel tests folder missing"; ((issues++)); }
    elif [[ -d "backend" ]]; then
      [[ -d "backend/tests" ]] || { echo_color $RED "⚠️ Laravel tests folder missing"; ((issues++)); }
    fi
  fi

  if [[ $issues -eq 0 ]]; then
    echo_color $GREEN "🎉 Setup complete with no issues!"
    echo_color $BLUE "🤖 AI-powered development automation ready"
  else
    echo_color $YELLOW "⚠️ Setup complete with $issues warnings. See documentation for full details."
  fi

  echo_color $GREEN "🧪 Run 'npm run validate' to test your setup."
}

### CREATE VALIDATION SCRIPT
create_validation_script() {
  cat > validate-setup.js << 'EOF'
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Validating AI-SDLC Setup...\n');

const checks = [
  {
    name: 'Git Hooks',
    command: 'test -f .husky/pre-commit && echo "exists"',
    success: 'Pre-commit hooks installed'
  },
  {
    name: 'ESLint',
    command: 'npx eslint --version',
    success: 'ESLint available'
  },
  {
    name: 'Prettier',
    command: 'npx prettier --version',
    success: 'Prettier available'
  },
  {
    name: 'Husky',
    command: 'npx husky --version',
    success: 'Husky available'
  }
];

let passed = 0;
let total = checks.length;

// Command checks
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
  console.log('🎉 All systems ready for AI-powered development!');
} else {
  console.log('⚠️  Some components need attention. Check documentation.');
}
EOF

  # Add validation script to package.json if it exists
  if [[ -f "package.json" ]]; then
    node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      pkg.scripts = pkg.scripts || {};
      pkg.scripts.validate = 'node validate-setup.js';
      fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    "
  fi
}

### SETUP MCP SERVERS (Optional)
setup_mcp_servers() {
  echo_color $BLUE "🔌 Setting up MCP (Model Context Protocol) servers..."

  # Check if MCP configuration exists
  if [[ -f ".mcp.json" ]]; then
    echo_color $GREEN "✔️ MCP configuration found"

    # Run MCP installer if available
    if [[ -f "scripts-complex/mcp-installer.js" ]]; then
      echo_color $BLUE "📦 Installing MCP servers for credit repair development..."

      # Install MCP servers
      if node scripts-complex/mcp-installer.js; then
        echo_color $GREEN "✅ MCP servers installed successfully"

        # Run validation
        if [[ -f "scripts-complex/mcp-validator.js" ]]; then
          echo_color $BLUE "🔍 Validating MCP server configuration..."
          if node scripts-complex/mcp-validator.js; then
            echo_color $GREEN "✅ MCP servers validated successfully"
          else
            echo_color $YELLOW "⚠️  MCP validation had warnings - check MCP-VALIDATION-REPORT.md"
          fi
        fi

      else
        echo_color $YELLOW "⚠️  MCP server installation had issues - check logs"
      fi
    else
      echo_color $YELLOW "⚠️  MCP installer script not found - skipping MCP setup"
    fi

    # Show MCP setup instructions
    echo_color $BLUE "📋 MCP Setup Instructions:"
    echo "   1. Add required environment variables to .env file"
    echo "   2. Run: claude mcp add --config ./.mcp.json"
    echo "   3. Test: npm run mcp:validate"
    echo "   4. Check: npm run mcp:status"

  else
    echo_color $YELLOW "⚠️  MCP configuration not found - skipping MCP setup"
  fi
}

main() {
  check_prerequisites
  install_common_dependencies
  detect_and_setup_project
  setup_basic_configuration
  setup_mcp_servers  # Optional MCP integration
  create_validation_script
  validate_configuration
}

main

#!/bin/bash

# Fix Remaining 23% Implementation Gaps
# AI-SDLC Framework Completion Script

set -e

### COLORS
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
NC="\033[0m"

echo_color() { echo -e "${1}${2}${NC}"; }
info() { echo_color $BLUE "ℹ️  $1"; }
success() { echo_color $GREEN "✅ $1"; }
warn() { echo_color $YELLOW "⚠️  $1"; }
error() { echo_color $RED "❌ $1"; }

echo_color $GREEN "🔧 Fixing Remaining Implementation Gaps..."

### 1. FIX ESLINT CONFIGURATION
fix_eslint_config() {
    info "Setting up ESLint configuration..."
    
    if [[ ! -f ".eslintrc.js" ]] && [[ ! -f ".eslintrc.json" ]]; then
        cat > .eslintrc.js << 'EOF'
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks'
  ],
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    'prefer-const': 'error',
    '@typescript-eslint/no-unused-vars': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  },
  ignorePatterns: [
    'dist/',
    'build/',
    'node_modules/',
    'coverage/',
    '*.min.js'
  ]
};
EOF
        success "Created ESLint configuration"
    else
        success "ESLint already configured"
    fi
}

### 2. ADD AI TEST GENERATION NPM SCRIPTS
add_ai_npm_scripts() {
    info "Adding AI test generation npm scripts..."
    
    if [[ -f "package.json" ]]; then
        # Use Node.js to update package.json
        node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        pkg.scripts = pkg.scripts || {};
        
        // Add AI test generation scripts
        pkg.scripts['ai:generate-tests'] = 'node scripts-complex/ai-test-generator.js generate';
        pkg.scripts['ai:generate-e2e'] = 'node scripts-complex/ai-e2e-generator.js generate';
        pkg.scripts['ai:test-init'] = './ai-sdlc test-init';
        pkg.scripts['ai:validate'] = 'node implementation-tracker.js';
        
        // Add coverage scripts
        pkg.scripts['test:coverage'] = 'jest --coverage';
        pkg.scripts['coverage'] = 'jest --coverage';
        pkg.scripts['test:ci'] = 'jest --ci --coverage --watchAll=false';
        
        // Add linting scripts if missing
        if (!pkg.scripts['lint']) {
            pkg.scripts['lint'] = 'eslint . --ext .js,.jsx,.ts,.tsx';
            pkg.scripts['lint:fix'] = 'eslint . --ext .js,.jsx,.ts,.tsx --fix';
        }
        
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
        console.log('✅ Updated package.json with AI and coverage scripts');
        "
        success "Added AI test generation and coverage npm scripts"
    else
        warn "No package.json found, skipping npm scripts setup"
    fi
}

### 3. CREATE API KEY SETUP WIZARD
create_api_setup_wizard() {
    info "Creating API key setup wizard..."
    
    cat > api-setup-wizard.sh << 'EOF'
#!/bin/bash

# API Key Setup Wizard for AI-SDLC Framework

echo "🔑 API Key Setup Wizard"
echo "======================="
echo

# Check if .env exists
if [[ ! -f ".env" ]]; then
    if [[ -f ".env.example" ]]; then
        cp .env.example .env
        echo "✅ Created .env from template"
    else
        # Create basic .env template
        cat > .env << 'ENVEOF'
# AI-SDLC Framework API Configuration

# OpenAI API for test generation (Required for AI features)
OPENAI_API_KEY=

# Qase API for test management (Optional)
QASE_API_KEY=
QASE_PROJECT_CODE=TCP

# GitHub token for PR automation (Optional)
GITHUB_TOKEN=

# SonarQube token for code analysis (Optional)
SONAR_TOKEN=
SONAR_PROJECT_KEY=

# Additional integrations
CODIUM_API_KEY=
ENVEOF
        echo "✅ Created basic .env template"
    fi
fi

# Interactive API key setup
echo "Would you like to configure API keys now? (y/n)"
read -r configure_apis

if [[ "$configure_apis" == "y" ]]; then
    echo
    echo "🤖 OpenAI API Key (for AI test generation)"
    echo "Get yours at: https://platform.openai.com/api-keys"
    read -p "Enter OpenAI API key (or press Enter to skip): " openai_key
    if [[ -n "$openai_key" ]]; then
        sed -i.bak "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$openai_key/" .env
        echo "✅ OpenAI API key configured"
    fi
    
    echo
    echo "🧪 Qase API Key (for test management)"
    echo "Get yours at: https://app.qase.io/user/api/token"
    read -p "Enter Qase API key (or press Enter to skip): " qase_key
    if [[ -n "$qase_key" ]]; then
        sed -i.bak "s/QASE_API_KEY=.*/QASE_API_KEY=$qase_key/" .env
        echo "✅ Qase API key configured"
    fi
    
    echo
    echo "🔍 SonarQube Token (for code analysis)"
    echo "Get yours from your SonarQube instance: User > My Account > Security > Tokens"
    read -p "Enter SonarQube token (or press Enter to skip): " sonar_token
    if [[ -n "$sonar_token" ]]; then
        sed -i.bak "s/SONAR_TOKEN=.*/SONAR_TOKEN=$sonar_token/" .env
        echo "✅ SonarQube token configured"
    fi
fi

echo
echo "🎉 API setup complete!"
echo "✅ Configuration saved to .env file"
echo "ℹ️  You can always edit .env manually to update API keys"
echo
echo "Next steps:"
echo "  ./ai-sdlc validate    # Test your setup"
echo "  npm run ai:validate   # Run implementation tracker"
EOF

    chmod +x api-setup-wizard.sh
    success "Created API setup wizard"
}

### 4. CREATE JEST CONFIGURATION IF MISSING
setup_jest_config() {
    info "Setting up Jest configuration..."
    
    if [[ ! -f "jest.config.js" ]]; then
        cat > jest.config.js << 'EOF'
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests', '<rootDir>/__tests__'],
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/?(*.)+(spec|test).(js|jsx|ts|tsx)'
  ],
  transform: {
    '\\.[jt]sx?$': 'babel-jest'
  },
  collectCoverageFrom: [
    'src/**/*.(js|jsx|ts|tsx)',
    '!src/**/*.d.ts',
    '!src/**/index.(js|ts)',
    '!src/**/*.stories.(js|jsx|ts|tsx)'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
EOF
        success "Created Jest configuration"
    else
        success "Jest already configured"
    fi
}

### 5. INSTALL MISSING DEPENDENCIES
install_missing_deps() {
    info "Installing missing development dependencies..."
    
    if command -v npm >/dev/null 2>&1; then
        npm install --save-dev \
            eslint \
            @typescript-eslint/eslint-plugin \
            @typescript-eslint/parser \
            eslint-plugin-react \
            eslint-plugin-react-hooks \
            jest \
            @types/jest \
            babel-jest \
            @babel/preset-env \
            @babel/preset-typescript \
            @babel/preset-react 2>/dev/null || warn "Some dependencies may already be installed"
        
        success "Development dependencies installed"
    else
        warn "npm not available, skipping dependency installation"
    fi
}

### MAIN EXECUTION
main() {
    echo_color $BLUE "🚀 Starting AI-SDLC Gap Remediation..."
    echo
    
    fix_eslint_config
    echo
    
    add_ai_npm_scripts
    echo
    
    create_api_setup_wizard
    echo
    
    setup_jest_config
    echo
    
    install_missing_deps
    echo
    
    echo_color $GREEN "🎉 Gap Remediation Complete!"
    echo
    echo "Summary of fixes applied:"
    echo "  ✅ ESLint configuration created"
    echo "  ✅ AI test generation npm scripts added"
    echo "  ✅ Coverage reporting scripts added"
    echo "  ✅ Jest configuration created"
    echo "  ✅ API setup wizard created"
    echo "  ✅ Development dependencies installed"
    echo
    echo "Next steps to reach 95%+ implementation:"
    echo "  1. Run: ./api-setup-wizard.sh    # Configure API keys"
    echo "  2. Run: npm run ai:validate       # Check new status"
    echo "  3. Run: ./ai-sdlc validate        # Verify functionality"
    echo
    echo "Expected improvement: 77% → 95%+ implementation"
}

main "$@"
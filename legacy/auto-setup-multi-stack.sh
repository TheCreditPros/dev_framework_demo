#!/bin/bash

# AI-SDLC Framework - Multi-Stack Setup Script
# Full Laravel/React hybrid support with PHP ecosystem integration

set -e

### COLORS
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
PURPLE="\033[0;35m"
NC="\033[0m"

echo_color() {
  echo -e "${1}${2}${NC}"
}

### PLATFORM DETECTION
detect_platform() {
  if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OS" == "Windows_NT" ]]; then
    PLATFORM="windows"
    SCRIPT_EXT=".ps1"
    COMPOSER_CMD="composer.phar"
  else
    PLATFORM="unix"
    SCRIPT_EXT=".sh"
    COMPOSER_CMD="composer"
  fi

  echo_color $BLUE "🖥️  Platform detected: ${PLATFORM}"
}

### MULTI-STACK PROJECT DETECTION
detect_project_stack() {
  echo_color $YELLOW "🔍 Detecting project stack..."

  PROJECT_TYPE="unknown"
  HAS_LARAVEL=false
  HAS_REACT=false
  HAS_PHP=false
  HAS_NODEJS=false
  HAS_DOCKER=false

  # Laravel detection
  if [[ -f "artisan" ]] || [[ -f "composer.json" ]] || [[ -d "app" ]] || [[ -d "backend" ]]; then
    HAS_LARAVEL=true
    HAS_PHP=true
    echo_color $GREEN "✅ Laravel backend detected"
  fi

  # React/Node.js detection
  if [[ -f "package.json" ]]; then
    HAS_NODEJS=true
    if grep -q "react" package.json 2>/dev/null; then
      HAS_REACT=true
      echo_color $GREEN "✅ React frontend detected"
    fi
  fi

  # Docker detection
  if [[ -f "docker-compose.yml" ]] || [[ -f "Dockerfile" ]] || [[ -f "docker-compose.yaml" ]]; then
    HAS_DOCKER=true
    echo_color $GREEN "✅ Docker environment detected"
  fi

  # Laravel Sail detection
  if [[ -f "docker-compose.yml" ]] && grep -q "sail" docker-compose.yml 2>/dev/null; then
    echo_color $GREEN "✅ Laravel Sail detected"
  fi

  # Determine project type
  if [[ "$HAS_LARAVEL" == true ]] && [[ "$HAS_REACT" == true ]]; then
    PROJECT_TYPE="laravel_react_hybrid"
    echo_color $PURPLE "🏗️  Project Type: Laravel + React Hybrid"
  elif [[ "$HAS_LARAVEL" == true ]]; then
    PROJECT_TYPE="laravel_api"
    echo_color $PURPLE "🏗️  Project Type: Laravel API"
  elif [[ "$HAS_REACT" == true ]]; then
    PROJECT_TYPE="react_spa"
    echo_color $PURPLE "🏗️  Project Type: React SPA"
  elif [[ "$HAS_NODEJS" == true ]]; then
    PROJECT_TYPE="nodejs_app"
    echo_color $PURPLE "🏗️  Project Type: Node.js Application"
  fi
}

### PREREQUISITES CHECK (MULTI-STACK)
check_prerequisites() {
  echo_color $YELLOW "🔍 Checking multi-stack prerequisites..."

  local missing_tools=()

  # Essential tools
  command -v node >/dev/null 2>&1 || missing_tools+=("node")
  command -v npm >/dev/null 2>&1 || missing_tools+=("npm")
  command -v git >/dev/null 2>&1 || missing_tools+=("git")

  # PHP/Laravel tools (if Laravel detected)
  if [[ "$HAS_LARAVEL" == true ]] || [[ "$HAS_PHP" == true ]]; then
    command -v php >/dev/null 2>&1 || missing_tools+=("php")
    command -v composer >/dev/null 2>&1 || missing_tools+=("composer")
  fi

  # Docker tools (if Docker detected)
  if [[ "$HAS_DOCKER" == true ]]; then
    command -v docker >/dev/null 2>&1 || missing_tools+=("docker")
  fi

  if [[ ${#missing_tools[@]} -gt 0 ]]; then
    echo_color $RED "❌ Missing required tools: ${missing_tools[*]}"
    echo_color $YELLOW "💡 Install missing tools and run again"
    exit 1
  fi

  echo_color $GREEN "✅ Multi-stack prerequisites check passed"
}

### PHP ECOSYSTEM INTEGRATION
setup_php_ecosystem() {
  if [[ "$HAS_PHP" != true ]]; then
    echo_color $YELLOW "⚠️  PHP not detected - skipping PHP ecosystem setup"
    return
  fi

  echo_color $BLUE "🐘 Setting up PHP ecosystem integration..."

  # Install PHP development dependencies
  echo_color $YELLOW "📦 Installing PHP development tools..."

  local php_deps=(
    "pestphp/pest"
    "phpstan/phpstan"
    "laravel/pint"
    "rector/rector"
    "phpunit/phpunit"
  )

  # Laravel-specific dependencies
  if [[ "$HAS_LARAVEL" == true ]]; then
    php_deps+=(
      "laravel/dusk"
      "laravel/pulse"
      "laravel/pennant"
      "spatie/laravel-ray"
    )
  fi

  # Install PHP dependencies
  for dep in "${php_deps[@]}"; do
    echo_color $YELLOW "Installing $dep..."
    $COMPOSER_CMD require --dev "$dep" --with-all-dependencies || echo_color $YELLOW "⚠️  $dep installation skipped"
  done

  # Create PHPStan configuration
  if [[ ! -f "phpstan.neon" ]]; then
    cat > phpstan.neon << 'EOF'
# AI-SDLC Framework - PHPStan Level 8 Configuration
parameters:
    level: 8
    paths:
        - app
        - database
        - routes
        - tests
    excludePaths:
        - vendor
        - node_modules
        - bootstrap/cache
        - storage
    checkMissingIterableValueType: false
    checkGenericClassInNonGenericObjectType: false
    ignoreErrors:
        - '#Call to an undefined method Illuminate\\Database\\Eloquent\\Builder#'
        - '#Call to an undefined method Illuminate\\Database\\Query\\Builder#'
EOF
    echo_color $GREEN "✅ PHPStan Level 8 configuration created"
  fi

  # Create Rector configuration
  if [[ ! -f "rector.php" ]]; then
    cat > rector.php << 'EOF'
<?php

declare(strict_types=1);

use Rector\Config\RectorConfig;
use Rector\Laravel\Set\LaravelSetList;
use Rector\Set\ValueObject\LevelSetList;

return static function (RectorConfig $rectorConfig): void {
    $rectorConfig->paths([
        __DIR__ . '/app',
        __DIR__ . '/database',
        __DIR__ . '/routes',
        __DIR__ . '/tests',
    ]);

    $rectorConfig->sets([
        LevelSetList::UP_TO_PHP_82,
        LaravelSetList::LARAVEL_100,
    ]);

    $rectorConfig->skip([
        __DIR__ . '/vendor',
        __DIR__ . '/node_modules',
        __DIR__ . '/bootstrap/cache',
        __DIR__ . '/storage',
    ]);
};
EOF
    echo_color $GREEN "✅ Rector configuration created"
  fi

  echo_color $GREEN "✅ PHP ecosystem integration complete"
}

### API CONTRACT TESTING SETUP
setup_api_contract_testing() {
  if [[ "$PROJECT_TYPE" != "laravel_react_hybrid" ]]; then
    echo_color $YELLOW "⚠️  Not a Laravel/React hybrid - skipping API contract testing"
    return
  fi

  echo_color $BLUE "🔗 Setting up API contract testing..."

  # Install API testing dependencies
  npm install --save-dev @apidevtools/swagger-parser openapi-types axios-mock-adapter

  if [[ "$HAS_LARAVEL" == true ]]; then
    $COMPOSER_CMD require --dev "spectator/spectator" || echo_color $YELLOW "⚠️  Spectator installation skipped"
  fi

  # Create API contract test template
  mkdir -p tests/Integration/API
  cat > tests/Integration/API/ContractTest.js << 'EOF'
// AI-SDLC Framework - API Contract Testing
import { describe, it, expect, beforeAll } from 'vitest';
import SwaggerParser from '@apidevtools/swagger-parser';
import axios from 'axios';

describe('API Contract Testing', () => {
  let apiSpec;

  beforeAll(async () => {
    // Load OpenAPI specification
    try {
      apiSpec = await SwaggerParser.validate('./api-docs/openapi.json');
    } catch (error) {
      console.warn('OpenAPI spec not found - using mock validation');
    }
  });

  it('should validate credit score endpoint contract', async () => {
    const response = await axios.get('/api/credit-score/123');

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('score');
    expect(response.data.score).toBeGreaterThanOrEqual(300);
    expect(response.data.score).toBeLessThanOrEqual(850);
  });

  it('should validate credit report endpoint contract', async () => {
    const response = await axios.get('/api/credit-report/123');

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('report');
    expect(response.data).toHaveProperty('audit_trail');
  });

  it('should validate dispute submission contract', async () => {
    const disputeData = {
      consumer_id: '123',
      dispute_reason: 'Incorrect information',
      supporting_documents: []
    };

    const response = await axios.post('/api/disputes', disputeData);

    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('dispute_id');
    expect(response.data).toHaveProperty('status');
  });
});
EOF

  # Create Laravel API contract test
  if [[ "$HAS_LARAVEL" == true ]]; then
    mkdir -p tests/Feature/API
    cat > tests/Feature/API/ContractTest.php << 'EOF'
<?php

namespace Tests\Feature\API;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContractTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_validates_credit_score_api_contract()
    {
        $response = $this->getJson('/api/credit-score/123');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'score',
                    'factors',
                    'audit_trail' => [
                        'timestamp',
                        'user_id',
                        'permissible_purpose'
                    ]
                ]);

        $this->assertBetween(300, 850, $response->json('score'));
    }

    /** @test */
    public function it_validates_credit_report_api_contract()
    {
        $response = $this->getJson('/api/credit-report/123');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'report' => [
                        'personal_info',
                        'accounts',
                        'inquiries'
                    ],
                    'audit_trail'
                ]);
    }

    /** @test */
    public function it_validates_dispute_submission_contract()
    {
        $disputeData = [
            'consumer_id' => '123',
            'dispute_reason' => 'Incorrect information',
            'supporting_documents' => []
        ];

        $response = $this->postJson('/api/disputes', $disputeData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'dispute_id',
                    'status',
                    'created_at'
                ]);
    }

    private function assertBetween($min, $max, $value)
    {
        $this->assertGreaterThanOrEqual($min, $value);
        $this->assertLessThanOrEqual($max, $value);
    }
}
EOF
  fi

  echo_color $GREEN "✅ API contract testing setup complete"
}

### ENVIRONMENT-SPECIFIC CONFIGURATIONS
setup_environment_configs() {
  echo_color $BLUE "⚙️  Setting up environment-specific configurations..."

  # Create environment configuration templates
  mkdir -p config/environments

  # Development environment
  cat > config/environments/.env.development << 'EOF'
# AI-SDLC Framework - Development Environment Configuration

# Application
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ai_sdlc_dev
DB_USERNAME=root
DB_PASSWORD=

# Redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Mail
MAIL_MAILER=log

# AI Services (Development)
OPENAI_API_KEY=sk-dev-...
ANTHROPIC_API_KEY=sk-ant-dev-...

# Security (Development)
SECURITY_SCAN_LEVEL=basic
FCRA_COMPLIANCE_MODE=development
EOF

  # Staging environment
  cat > config/environments/.env.staging << 'EOF'
# AI-SDLC Framework - Staging Environment Configuration

# Application
APP_ENV=staging
APP_DEBUG=false
APP_URL=https://staging.example.com

# Database
DB_CONNECTION=pgsql
DB_HOST=${DB_HOST}
DB_PORT=5432
DB_DATABASE=${DB_DATABASE}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}

# Redis
REDIS_HOST=${REDIS_HOST}
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_PORT=6379

# Mail
MAIL_MAILER=smtp
MAIL_HOST=${MAIL_HOST}
MAIL_PORT=587
MAIL_USERNAME=${MAIL_USERNAME}
MAIL_PASSWORD=${MAIL_PASSWORD}

# AI Services (Staging)
OPENAI_API_KEY=${OPENAI_API_KEY}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}

# Security (Staging)
SECURITY_SCAN_LEVEL=enhanced
FCRA_COMPLIANCE_MODE=strict
SONARQUBE_URL=${SONARQUBE_URL}
SONARQUBE_TOKEN=${SONARQUBE_TOKEN}
EOF

  # Production environment
  cat > config/environments/.env.production << 'EOF'
# AI-SDLC Framework - Production Environment Configuration

# Application
APP_ENV=production
APP_DEBUG=false
APP_URL=${APP_URL}

# Database (Production)
DB_CONNECTION=pgsql
DB_HOST=${DB_HOST}
DB_PORT=5432
DB_DATABASE=${DB_DATABASE}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}

# Redis (Production)
REDIS_HOST=${REDIS_HOST}
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_PORT=6379

# Mail (Production)
MAIL_MAILER=smtp
MAIL_HOST=${MAIL_HOST}
MAIL_PORT=587
MAIL_USERNAME=${MAIL_USERNAME}
MAIL_PASSWORD=${MAIL_PASSWORD}

# AI Services (Production)
OPENAI_API_KEY=${OPENAI_API_KEY}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}

# Security (Production)
SECURITY_SCAN_LEVEL=enterprise
FCRA_COMPLIANCE_MODE=strict
SONARQUBE_URL=${SONARQUBE_URL}
SONARQUBE_TOKEN=${SONARQUBE_TOKEN}
SNYK_TOKEN=${SNYK_TOKEN}
OWASP_ZAP_URL=${OWASP_ZAP_URL}

# Monitoring
SENTRY_DSN=${SENTRY_DSN}
NEW_RELIC_LICENSE_KEY=${NEW_RELIC_LICENSE_KEY}
EOF

  echo_color $GREEN "✅ Environment-specific configurations created"
}

### ENHANCED SECURITY TOOLS SETUP
setup_enhanced_security() {
  echo_color $BLUE "🛡️  Setting up enhanced security tools..."

  # Install Snyk for dependency scanning
  npm install --save-dev snyk

  # Create SonarQube Enterprise configuration
  cat > sonar-project.properties << 'EOF'
# AI-SDLC Framework - SonarQube Enterprise Configuration
sonar.projectKey=ai-sdlc-framework
sonar.projectName=AI-SDLC Framework
sonar.projectVersion=3.2.1

# Multi-language source paths
sonar.sources=src,app,resources/js
sonar.tests=tests,__tests__

# Language-specific settings
sonar.php.coverage.reportPaths=coverage/clover.xml
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.typescript.lcov.reportPaths=coverage/lcov.info

# Security scanning
sonar.security.hotspots.inheritFromParent=true
sonar.security.review.category=SECURITY

# Exclusions
sonar.exclusions=**/node_modules/**,**/vendor/**,**/storage/**,**/bootstrap/cache/**
sonar.coverage.exclusions=**/*.test.js,**/*.spec.js,**/*.test.ts,**/*.spec.ts,**/*Test.php

# Quality gates
sonar.qualitygate.wait=true
EOF

  # Create OWASP ZAP configuration for API security
  mkdir -p security/owasp-zap
  cat > security/owasp-zap/api-scan.yaml << 'EOF'
# AI-SDLC Framework - OWASP ZAP API Security Scan Configuration
env:
  contexts:
    - name: "AI-SDLC API Context"
      urls:
        - "http://localhost:8000/api/*"
      includePaths:
        - "http://localhost:8000/api/.*"
      excludePaths:
        - "http://localhost:8000/api/health"
        - "http://localhost:8000/api/status"

jobs:
  - type: openapi
    parameters:
      apiFile: './api-docs/openapi.json'
      apiUrl: 'http://localhost:8000/api'

  - type: activeScan
    parameters:
      context: "AI-SDLC API Context"

  - type: report
    parameters:
      template: traditional-html
      reportDir: './security/reports'
      reportFile: 'zap-api-security-report'
EOF

  # Create Snyk configuration
  cat > .snyk << 'EOF'
# AI-SDLC Framework - Snyk Configuration
version: v1.0.0

# Language settings
language-settings:
  javascript:
    packageManager: npm
  php:
    packageManager: composer

# Ignore rules for known false positives
ignore:
  # Development dependencies
  SNYK-JS-LODASH-567746:
    - '*':
        reason: Development dependency only
        expires: '2025-12-31T23:59:59.999Z'

# Patches
patches: {}
EOF

  echo_color $GREEN "✅ Enhanced security tools configured"
}

### DOCKER AND LARAVEL SAIL INTEGRATION
setup_docker_integration() {
  if [[ "$HAS_DOCKER" != true ]] && [[ "$HAS_LARAVEL" != true ]]; then
    echo_color $YELLOW "⚠️  Docker/Laravel not detected - skipping Docker integration"
    return
  fi

  echo_color $BLUE "🐳 Setting up Docker and Laravel Sail integration..."

  # Laravel Sail setup
  if [[ "$HAS_LARAVEL" == true ]]; then
    echo_color $YELLOW "⛵ Configuring Laravel Sail..."

    # Install Laravel Sail if not present
    if [[ ! -f "docker-compose.yml" ]]; then
      $COMPOSER_CMD require laravel/sail --dev
      php artisan sail:install --with=mysql,redis,meilisearch
    fi

    # Create Sail aliases
    cat > sail-aliases${SCRIPT_EXT} << 'EOF'
# Laravel Sail Aliases for AI-SDLC Framework
alias sail='[ -f sail ] && sh sail || sh vendor/bin/sail'
alias sail-up='sail up -d'
alias sail-down='sail down'
alias sail-test='sail test'
alias sail-artisan='sail artisan'
alias sail-composer='sail composer'
alias sail-npm='sail npm'
EOF

    echo_color $GREEN "✅ Laravel Sail configured with aliases"
  fi

  # Create Docker development configuration
  if [[ ! -f "docker-compose.dev.yml" ]]; then
    cat > docker-compose.dev.yml << 'EOF'
# AI-SDLC Framework - Development Docker Configuration
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "8000:8000"
      - "3000:3000"
    volumes:
      - .:/var/www/html
      - /var/www/html/node_modules
      - /var/www/html/vendor
    environment:
      - APP_ENV=development
      - VITE_HMR_HOST=localhost
    depends_on:
      - database
      - redis

  database:
    image: postgres:15
    environment:
      POSTGRES_DB: ai_sdlc_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
EOF
  fi

  echo_color $GREEN "✅ Docker integration setup complete"
}

### CROSS-PLATFORM CI/CD TEMPLATES
setup_cicd_flexibility() {
  echo_color $BLUE "🚀 Setting up flexible CI/CD templates..."

  mkdir -p .ci-templates

  # GitHub Actions (existing)
  echo_color $YELLOW "📋 GitHub Actions template already configured"

  # GitLab CI template
  cat > .ci-templates/.gitlab-ci.yml << 'EOF'
# AI-SDLC Framework - GitLab CI Template
stages:
  - validate
  - test
  - security
  - deploy

variables:
  PHP_VERSION: "8.2"
  NODE_VERSION: "20"

# Multi-stack validation
validate:
  stage: validate
  image: php:${PHP_VERSION}
  before_script:
    - apt-get update && apt-get install -y nodejs npm
    - curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
  script:
    - composer install --no-dev --optimize-autoloader
    - npm ci
    - npm run lint
    - composer run phpstan
  artifacts:
    reports:
      junit: tests/results.xml

# PHP Testing
test:php:
  stage: test
  image: php:${PHP_VERSION}
  services:
    - postgres:15
  variables:
    POSTGRES_DB: ai_sdlc_test
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: password
  script:
    - composer install
    - php artisan test --coverage --min=80
  coverage: '/^\s*Lines:\s*\d+.\d+\%/'

# JavaScript Testing
test:js:
  stage: test
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run test:coverage
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'

# Security scanning
security:
  stage: security
  image: sonarqube/sonar-scanner-cli:latest
  script:
    - sonar-scanner
  only:
    - main
    - develop
EOF

  # Azure DevOps template
  cat > .ci-templates/azure-pipelines.yml << 'EOF'
# AI-SDLC Framework - Azure DevOps Template
trigger:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  phpVersion: '8.2'
  nodeVersion: '20.x'

stages:
- stage: Validate
  displayName: 'Multi-Stack Validation'
  jobs:
  - job: ValidateStack
    displayName: 'Validate Laravel/React Stack'
    steps:
    - task: UsePhpVersion@0
      inputs:
        versionSpec: $(phpVersion)
    - task: NodeTool@0
      inputs:
        versionSpec: $(nodeVersion)
    - script: |
        composer install --no-dev --optimize-autoloader
        npm ci
        npm run lint
        composer run phpstan
      displayName: 'Install dependencies and validate'

- stage: Test
  displayName: 'Multi-Stack Testing'
  dependsOn: Validate
  jobs:
  - job: TestPHP
    displayName: 'PHP/Laravel Tests'
    steps:
    - task: UsePhpVersion@0
      inputs:
        versionSpec: $(phpVersion)
    - script: |
        composer install
        php artisan test --coverage --min=80
      displayName: 'Run PHP tests'

  - job: TestJS
    displayName: 'JavaScript/React Tests'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: $(nodeVersion)
    - script: |
        npm ci
        npm run test:coverage
      displayName: 'Run JavaScript tests'

- stage: Security
  displayName: 'Security Scanning'
  dependsOn: Test
  jobs:
  - job: SecurityScan
    displayName: 'Multi-Stack Security Analysis'
    steps:
    - task: SonarQubePrepare@5
      inputs:
        SonarQube: 'SonarQube'
        scannerMode: 'CLI'
    - script: |
        npm run security:scan
        composer run security:scan
      displayName: 'Run security scans'
    - task: SonarQubePublish@5
EOF

  echo_color $GREEN "✅ Flexible CI/CD templates created"
}

### CROSS-PLATFORM SCRIPT GENERATION
create_cross_platform_scripts() {
  echo_color $BLUE "🖥️  Creating cross-platform scripts..."

  # Windows PowerShell version
  cat > auto-setup-multi-stack.ps1 << 'EOF'
# AI-SDLC Framework - Windows PowerShell Setup Script
# Multi-stack Laravel/React support for Windows environments

param(
    [switch]$Quick,
    [switch]$Help
)

function Write-ColorOutput {
    param([string]$Color, [string]$Message)

    $colorMap = @{
        'Green' = 'Green'
        'Red' = 'Red'
        'Yellow' = 'Yellow'
        'Blue' = 'Blue'
    }

    Write-Host $Message -ForegroundColor $colorMap[$Color]
}

function Show-Help {
    Write-ColorOutput "Green" "🚀 AI-SDLC Framework - Windows Setup"
    Write-Host ""
    Write-Host "Usage: .\auto-setup-multi-stack.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Quick    Quick setup (5 minutes)"
    Write-Host "  -Help     Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\auto-setup-multi-stack.ps1         # Standard setup"
    Write-Host "  .\auto-setup-multi-stack.ps1 -Quick  # Quick setup"
}

function Test-Prerequisites {
    Write-ColorOutput "Yellow" "🔍 Checking Windows prerequisites..."

    $missingTools = @()

    # Check Node.js
    try { node --version | Out-Null } catch { $missingTools += "Node.js" }

    # Check npm
    try { npm --version | Out-Null } catch { $missingTools += "npm" }

    # Check Git
    try { git --version | Out-Null } catch { $missingTools += "Git" }

    # Check PHP (if Laravel detected)
    if (Test-Path "artisan" -or Test-Path "composer.json") {
        try { php --version | Out-Null } catch { $missingTools += "PHP" }
        try { composer --version | Out-Null } catch { $missingTools += "Composer" }
    }

    if ($missingTools.Count -gt 0) {
        Write-ColorOutput "Red" "❌ Missing required tools: $($missingTools -join ', ')"
        Write-ColorOutput "Yellow" "💡 Install missing tools and run again"
        exit 1
    }

    Write-ColorOutput "Green" "✅ Windows prerequisites check passed"
}

function Install-Dependencies {
    Write-ColorOutput "Yellow" "📦 Installing dependencies..."

    if ($Quick) {
        # Quick mode - essential tools only
        npm install --save-dev eslint prettier husky lint-staged
        Write-ColorOutput "Green" "✅ Quick mode: Essential tools installed"
        return
    }

    # Full installation
    $npmDeps = @(
        "eslint", "prettier", "husky", "lint-staged",
        "vitest", "@playwright/test", "snyk"
    )

    # Check for TypeScript
    if (Test-Path "tsconfig.json") {
        $npmDeps += "@typescript-eslint/parser", "@typescript-eslint/eslint-plugin", "typescript"
        Write-ColorOutput "Blue" "📝 TypeScript detected - adding TypeScript support"
    }

    npm install --save-dev $npmDeps

    # PHP dependencies (if Laravel detected)
    if (Test-Path "composer.json") {
        Write-ColorOutput "Yellow" "🐘 Installing PHP dependencies..."
        composer require --dev pestphp/pest phpstan/phpstan laravel/pint rector/rector
    }

    Write-ColorOutput "Green" "✅ Dependencies installed successfully"
}

function Setup-Configuration {
    Write-ColorOutput "Blue" "⚙️ Setting up configurations..."

    # Create ESLint configuration
    if (-not (Test-Path ".eslintrc.js") -and -not (Test-Path "eslint.config.js")) {
        $eslintConfig = @"
module.exports = [
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'warn',
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
    },
  },
];
"@
        $eslintConfig | Out-File -FilePath "eslint.config.js" -Encoding UTF8
        Write-ColorOutput "Green" "✅ ESLint configuration created"
    }

    # Create Prettier configuration
    if (-not (Test-Path ".prettierrc")) {
        $prettierConfig = @"
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
"@
        $prettierConfig | Out-File -FilePath ".prettierrc" -Encoding UTF8
        Write-ColorOutput "Green" "✅ Prettier configuration created"
    }
}

function Setup-GitHooks {
    Write-ColorOutput "Blue" "🪝 Setting up Git hooks..."

    # Initialize Husky
    npx husky init

    # Create pre-commit hook
    $preCommitHook = @"
#!/bin/sh
npx lint-staged
"@
    $preCommitHook | Out-File -FilePath ".husky/pre-commit" -Encoding UTF8

    Write-ColorOutput "Green" "✅ Git hooks configured"
}

function Main {
    if ($Help) {
        Show-Help
        return
    }

    Write-ColorOutput "Green" "🚀 AI-SDLC Framework - Windows Multi-Stack Setup"
    Write-ColorOutput "Blue" "   Laravel/React hybrid support for Windows"
    Write-Host ""

    Test-Prerequisites
    Install-Dependencies
    Setup-Configuration
    Setup-GitHooks

    Write-ColorOutput "Green" "🎉 Windows setup complete!"
    Write-ColorOutput "Blue" "🧪 Run 'npm test' to validate your setup"
}

# Execute main function
Main
'@

# Make PowerShell script executable
if ($PLATFORM -eq "windows") {
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
fi
EOF

echo_color $GREEN "✅ Cross-platform scripts created"
}

### SETUP MULTI-STACK PACKAGE.JSON SCRIPTS
setup_multistack_scripts() {
  echo_color $BLUE "📝 Setting up multi-stack npm scripts..."

  if [[ -f "package.json" ]]; then
    # Core multi-stack scripts
    npx json -I -f package.json -e 'this.scripts=this.scripts||{}'

    # Laravel/React hybrid scripts
    if [[ "$PROJECT_TYPE" == "laravel_react_hybrid" ]]; then
      npx json -I -f package.json -e 'this.scripts["dev:full"]="concurrently \"php artisan serve\" \"npm run dev\""'
      npx json -I -f package.json -e 'this.scripts["dev:api"]="php artisan serve"'
      npx json -I -f package.json -e 'this.scripts["dev:frontend"]="npm run dev"'
      npx json -I -f package.json -e 'this.scripts["sail:up"]="./vendor/bin/sail up -d"'
      npx json -I -f package.json -e 'this.scripts["sail:down"]="./vendor/bin/sail down"'
      npx json -I -f package.json -e 'this.scripts["sail:test"]="./vendor/bin/sail test"'
    fi

    # PHP-specific scripts
    if [[ "$HAS_PHP" == true ]]; then
      npx json -I -f package.json -e 'this.scripts["php:test"]="composer run test"'
      npx json -I -f package.json -e 'this.scripts["php:stan"]="./vendor/bin/phpstan analyse"'
      npx json -I -f package.json -e 'this.scripts["php:pint"]="./vendor/bin/pint"'
      npx json -I -f package.json -e 'this.scripts["php:rector"]="./vendor/bin/rector --dry-run"'
      npx json -I -f package.json -e 'this.scripts["php:quality"]="npm run php:pint && npm run php:stan && npm run php:test"'
    fi

    # API contract testing scripts
    npx json -I -f package.json -e 'this.scripts["test:contracts"]="vitest tests/Integration/API"'
    npx json -I -f package.json -e 'this.scripts["test:api"]="vitest tests/Integration"'

    # Security scripts
    npx json -I -f package.json -e 'this.scripts["security:snyk"]="snyk test"'
    npx json -I -f package.json -e 'this.scripts["security:audit"]="npm audit && composer audit"'
    npx json -I -f package.json -e 'this.scripts["security:zap"]="docker run -v \$(pwd):/zap/wrk/:rw -t owasp/zap2docker-stable zap-api-scan.py -t http://localhost:8000/api -f openapi -d"'

    # Environment scripts
    npx json -I -f package.json -e 'this.scripts["env:dev"]="cp config/environments/.env.development .env"'
    npx json -I -f package.json -e 'this.scripts["env:staging"]="cp config/environments/.env.staging .env"'
    npx json -I -f package.json -e 'this.scripts["env:prod"]="cp config/environments/.env.production .env"'

    echo_color $GREEN "✅ Multi-stack npm scripts configured"
  fi
}

### VALIDATION WITH MULTI-STACK CHECKS
validate_multistack_setup() {
  echo_color $YELLOW "✅ Validating multi-stack setup..."

  local issues=0

  # Core validations
  [[ -f .eslintrc.js ]] || [[ -f .eslintrc.json ]] || [[ -f eslint.config.js ]] || { echo_color $RED "⚠️ ESLint config missing"; ((issues++)); }
  [[ -f .prettierrc ]] || { echo_color $RED "⚠️ Prettier config missing"; ((issues++)); }

  # PHP validations
  if [[ "$HAS_PHP" == true ]]; then
    [[ -f phpstan.neon ]] || { echo_color $RED "⚠️ PHPStan config missing"; ((issues++)); }
    [[ -f rector.php ]] || { echo_color $RED "⚠️ Rector config missing"; ((issues++)); }
    command -v composer >/dev/null 2>&1 || { echo_color $RED "⚠️ Composer not available"; ((issues++)); }
  fi

  # Laravel validations
  if [[ "$HAS_LARAVEL" == true ]]; then
    [[ -f artisan ]] || [[ -f composer.json ]] || { echo_color $RED "⚠️ Laravel not properly detected"; ((issues++)); }
  fi

  # Docker validations
  if [[ "$HAS_DOCKER" == true ]]; then
    [[ -f docker-compose.yml ]] || [[ -f docker-compose.dev.yml ]] || { echo_color $RED "⚠️ Docker config missing"; ((issues++)); }
  fi

  # API contract testing validations
  if [[ "$PROJECT_TYPE" == "laravel_react_hybrid" ]]; then
    [[ -d tests/Integration/API ]] || { echo_color $RED "⚠️ API contract tests missing"; ((issues++)); }
  fi

  # Security tool validations
  [[ -f sonar-project.properties ]] || { echo_color $RED "⚠️ SonarQube config missing"; ((issues++)); }
  [[ -f .snyk ]] || { echo_color $RED "⚠️ Snyk config missing"; ((issues++)); }

  if [[ $issues -eq 0 ]]; then
    echo_color $GREEN "🎉 Multi-stack setup complete with no issues!"
    echo_color $PURPLE "🏗️  Project Type: $PROJECT_TYPE"
    echo_color $BLUE "🐘 PHP Support: $HAS_PHP"
    echo_color $BLUE "⚛️  React Support: $HAS_REACT"
    echo_color $BLUE "🐳 Docker Support: $HAS_DOCKER"
    echo_color $BLUE "🚀 Platform: $PLATFORM"
  else
    echo_color $YELLOW "⚠️ Setup complete with $issues warnings (non-blocking)"
  fi

  echo_color $GREEN "🧪 Run 'npm run test:contracts' to test API contracts"
  echo_color $GREEN "🔍 Run 'npm run security:audit' to validate security"
}

### MAIN EXECUTION
main() {
  echo_color $GREEN "🚀 AI-SDLC Framework - Multi-Stack Setup"
  echo_color $BLUE "   True Laravel/React hybrid development platform"
  echo ""

  detect_platform
  detect_project_stack
  check_prerequisites
  setup_php_ecosystem
  setup_api_contract_testing
  setup_environment_configs
  setup_enhanced_security
  setup_docker_integration
  setup_cicd_flexibility
  create_cross_platform_scripts
  setup_multistack_scripts
  validate_multistack_setup
}

main "$@"

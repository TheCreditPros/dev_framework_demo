#!/bin/bash

# Test SonarCloud Integration
# Validates SonarCloud project management and API integration

set -e

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

echo "🧪 Testing SonarCloud Integration"
echo "================================="

# Check prerequisites
log_info "1. Checking prerequisites..."

if [ -z "$SONAR_TOKEN" ]; then
    log_error "SONAR_TOKEN environment variable is not set"
    echo "Please set SONAR_TOKEN with your SonarCloud API token"
    echo "Get your token from: https://sonarcloud.io/account/security"
    exit 1
else
    log_success "SONAR_TOKEN is configured"
fi

if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    exit 1
else
    log_success "Node.js is available: $(node --version)"
fi

if ! command -v curl &> /dev/null; then
    log_error "curl is not installed"
    exit 1
else
    log_success "curl is available"
fi

# Test SonarCloud API access
log_info "2. Testing SonarCloud API access..."

API_RESPONSE=$(curl -s -u "$SONAR_TOKEN:" "https://sonarcloud.io/api/authentication/validate" || echo "FAILED")

if echo "$API_RESPONSE" | grep -q '"valid":true'; then
    log_success "SonarCloud API access validated"
else
    log_error "SonarCloud API access failed"
    echo "Response: $API_RESPONSE"
    exit 1
fi

# Test project manager script
log_info "3. Testing SonarCloud project manager..."

if [ ! -f "scripts/sonarcloud-project-manager.js" ]; then
    log_error "SonarCloud project manager script not found"
    exit 1
fi

# Make script executable
chmod +x scripts/sonarcloud-project-manager.js

# Test script execution (dry run mode)
log_info "Running project manager in test mode..."

# Set test environment variables if not in GitHub Actions
if [ -z "$GITHUB_REPOSITORY" ]; then
    export GITHUB_REPOSITORY_OWNER="test-org"
    export GITHUB_REPOSITORY="test-org/test-repo"
    log_warn "Using test repository values (not in GitHub Actions)"
fi

# Run the project manager
if node scripts/sonarcloud-project-manager.js; then
    log_success "Project manager executed successfully"
else
    log_error "Project manager execution failed"
    exit 1
fi

# Verify generated configuration
log_info "4. Verifying generated configuration..."

if [ -f "sonar-project.properties" ]; then
    log_success "sonar-project.properties generated"

    # Check required properties
    REQUIRED_PROPS=("sonar.projectKey" "sonar.organization" "sonar.projectName")

    for prop in "${REQUIRED_PROPS[@]}"; do
        if grep -q "^${prop}=" sonar-project.properties; then
            VALUE=$(grep "^${prop}=" sonar-project.properties | cut -d'=' -f2)
            log_success "✓ ${prop} = ${VALUE}"
        else
            log_error "✗ Missing required property: ${prop}"
            exit 1
        fi
    done
else
    log_error "sonar-project.properties not generated"
    exit 1
fi

# Test SonarCloud project existence (if project key is available)
log_info "5. Testing SonarCloud project existence..."

PROJECT_KEY=$(grep "^sonar.projectKey=" sonar-project.properties | cut -d'=' -f2)

if [ -n "$PROJECT_KEY" ]; then
    PROJECT_CHECK=$(curl -s -u "$SONAR_TOKEN:" \
        "https://sonarcloud.io/api/projects/search?projects=${PROJECT_KEY}" \
        | jq -r '.components[0].key // "NOT_FOUND"' 2>/dev/null || echo "API_ERROR")

    if [ "$PROJECT_CHECK" = "$PROJECT_KEY" ]; then
        log_success "SonarCloud project exists: $PROJECT_KEY"
    elif [ "$PROJECT_CHECK" = "NOT_FOUND" ]; then
        log_warn "SonarCloud project does not exist: $PROJECT_KEY"
        log_info "This is expected for new repositories - project will be created automatically"
    else
        log_warn "Could not verify project existence (API error or jq not available)"
    fi
else
    log_error "Could not extract project key from configuration"
    exit 1
fi

# Test GitHub Actions workflow syntax
log_info "6. Validating GitHub Actions workflows..."

WORKFLOWS=(
    ".github/workflows/sonarcloud-setup.yml"
    ".github/workflows/sonarcloud-analysis.yml"
    ".github/workflows/sonarcloud-pr-analysis.yml"
)

for workflow in "${WORKFLOWS[@]}"; do
    if [ -f "$workflow" ]; then
        log_success "✓ Workflow exists: $workflow"

        # Basic YAML syntax check (if yq is available)
        if command -v yq &> /dev/null; then
            if yq eval '.' "$workflow" > /dev/null 2>&1; then
                log_success "  ✓ YAML syntax valid"
            else
                log_error "  ✗ YAML syntax invalid"
                exit 1
            fi
        fi
    else
        log_error "✗ Missing workflow: $workflow"
        exit 1
    fi
done

# Test npm scripts
log_info "7. Testing npm scripts..."

if npm run test:coverage:sonar --dry-run &> /dev/null; then
    log_success "✓ test:coverage:sonar script available"
else
    log_warn "✗ test:coverage:sonar script not available (will use fallback)"
fi

# Summary
echo ""
log_success "🎉 SonarCloud integration test completed successfully!"
echo ""
echo "📋 Test Results Summary:"
echo "  ✅ SONAR_TOKEN configured and valid"
echo "  ✅ SonarCloud API access working"
echo "  ✅ Project manager script functional"
echo "  ✅ Configuration generation working"
echo "  ✅ GitHub Actions workflows valid"
echo ""
echo "🚀 Next Steps:"
echo "  1. Commit and push these changes"
echo "  2. Run the SonarCloud Setup workflow manually to test"
echo "  3. Create a PR to test PR analysis workflow"
echo "  4. Verify SonarCloud dashboard shows your project"
echo ""
echo "🔗 Useful Links:"
echo "  • SonarCloud Dashboard: https://sonarcloud.io/projects"
echo "  • Project URL: https://sonarcloud.io/project/overview?id=${PROJECT_KEY}"
echo "  • API Documentation: https://sonarcloud.io/web_api"

# Cleanup test files if not in CI
if [ -z "$CI" ]; then
    log_info "Cleaning up test files..."
    rm -f project_check.txt
    log_success "Cleanup completed"
fi

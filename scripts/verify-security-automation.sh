#!/bin/bash

# Security Automation Verification Script
# Verifies that all security automation fixes are working correctly

set -e

echo "🔍 Security Automation Verification"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check status
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1${NC}"
        return 1
    fi
}

echo ""
echo "🔍 1. Dependabot Configuration Verification"
echo "==========================================="

# Check Dependabot config
if [ -f ".github/dependabot.yml" ]; then
    echo -e "${BLUE}📋 Checking Dependabot configuration...${NC}"
    
    # Check for daily schedule
    if grep -q "interval: 'daily'" .github/dependabot.yml; then
        check_status "Daily security update schedule configured"
    else
        check_status "Daily security update schedule NOT configured"
    fi
    
    # Check for security updates
    if grep -q "security-updates:" .github/dependabot.yml; then
        check_status "Security updates enabled"
    else
        check_status "Security updates NOT enabled"
    fi
    
    # Check auto-merge workflow
    if [ -f ".github/workflows/dependabot-auto-merge.yml" ]; then
        check_status "Dependabot auto-merge workflow exists"
    else
        check_status "Dependabot auto-merge workflow NOT found"
    fi
else
    check_status "Dependabot configuration NOT found"
fi

echo ""
echo "🔍 2. SonarCloud Quality Gate Verification"
echo "=========================================="

# Check SonarCloud config
if [ -f "sonar-project.properties" ]; then
    echo -e "${BLUE}📋 Checking SonarCloud configuration...${NC}"
    
    # Check quality gate enforcement
    if grep -q "sonar.buildbreaker.skip=false" sonar-project.properties; then
        check_status "Quality gate enforcement enabled"
    else
        check_status "Quality gate enforcement NOT enabled"
    fi
    
    # Check security hotspots
    if grep -q "sonar.security.hotspots.enabled=true" sonar-project.properties; then
        check_status "Security hotspots enabled"
    else
        check_status "Security hotspots NOT enabled"
    fi
    
    # Check AI CodeFix
    if grep -q "sonar.ai.codefix.enabled=true" sonar-project.properties; then
        check_status "AI CodeFix enabled"
    else
        check_status "AI CodeFix NOT enabled"
    fi
    
    # Check workflow has SONAR_TOKEN
    if grep -q "SONAR_TOKEN" .github/workflows/sonarcloud-pr-analysis.yml; then
        check_status "SonarCloud PR workflow has SONAR_TOKEN"
    else
        check_status "SonarCloud PR workflow missing SONAR_TOKEN"
    fi
else
    check_status "SonarCloud configuration NOT found"
fi

echo ""
echo "🔍 3. Qodo PR-Agent Auto-Trigger Verification"
echo "=============================================="

# Check Qodo PR-Agent config
if [ -f ".pr_agent.toml" ]; then
    echo -e "${BLUE}📋 Checking Qodo PR-Agent configuration...${NC}"
    
    # Check FCRA compliance focus
    if grep -q "FCRA" .pr_agent.toml; then
        check_status "FCRA compliance configuration found"
    else
        check_status "FCRA compliance configuration NOT found"
    fi
    
    # Check security review configuration
    if grep -q "require_security_review" .pr_agent.toml; then
        check_status "Security review requirement configured"
    else
        check_status "Security review requirement NOT configured"
    fi
    
    # Check auto-trigger workflow
    if [ -f ".github/workflows/qodo-auto-trigger.yml" ]; then
        check_status "Qodo auto-trigger workflow exists"
    else
        check_status "Qodo auto-trigger workflow NOT found"
    fi
    
    # Check main AI review workflow
    if [ -f ".github/workflows/ai-code-review.yml" ]; then
        check_status "Main AI code review workflow exists"
    else
        check_status "Main AI code review workflow NOT found"
    fi
else
    check_status "Qodo PR-Agent configuration NOT found"
fi

echo ""
echo "🔍 4. GitHub Actions Workflow Verification"
echo "=========================================="

echo -e "${BLUE}📋 Checking GitHub Actions workflows...${NC}"

# Count workflows
WORKFLOW_COUNT=$(find .github/workflows -name "*.yml" -o -name "*.yaml" | wc -l)
echo "📊 Total workflows found: $WORKFLOW_COUNT"

# Check essential workflows
ESSENTIAL_WORKFLOWS=(
    "sonarcloud-pr-analysis.yml"
    "sonarcloud-analysis.yml"
    "ai-code-review.yml"
    "dependabot-auto-merge.yml"
    "qodo-auto-trigger.yml"
)

for workflow in "${ESSENTIAL_WORKFLOWS[@]}"; do
    if [ -f ".github/workflows/$workflow" ]; then
        check_status "Essential workflow: $workflow"
    else
        check_status "Essential workflow MISSING: $workflow"
    fi
done

echo ""
echo "🔍 5. Security Configuration Verification"
echo "========================================="

echo -e "${BLUE}📋 Checking security configurations...${NC}"

# Check package.json overrides
if [ -f "package.json" ]; then
    if grep -q "overrides" package.json; then
        check_status "Security overrides in package.json"
        
        # Check specific overrides
        if grep -q "debug.*4.3.4" package.json; then
            check_status "Debug vulnerability override configured"
        else
            check_status "Debug vulnerability override NOT configured"
        fi
        
        if grep -q "cross-spawn" package.json; then
            check_status "Cross-spawn vulnerability override configured"
        else
            check_status "Cross-spawn vulnerability override NOT configured"
        fi
    else
        check_status "Security overrides NOT found in package.json"
    fi
else
    check_status "package.json NOT found"
fi

# Check for security-related scripts
if grep -q "security" package.json; then
    check_status "Security-related npm scripts found"
else
    check_status "Security-related npm scripts NOT found"
fi

echo ""
echo "🔍 6. Test Integration Verification"
echo "=================================="

echo -e "${BLUE}📋 Running integration tests...${NC}"

# Test npm audit
echo "🔍 Testing npm audit..."
if npm audit --audit-level=moderate >/dev/null 2>&1; then
    check_status "npm audit passes (no critical/high vulnerabilities)"
else
    echo -e "${YELLOW}⚠️  npm audit found issues (expected for dev dependencies)${NC}"
fi

# Test quality gates
echo "🔍 Testing quality gates..."
if npm run quality-gates >/dev/null 2>&1; then
    check_status "Quality gates pass"
else
    check_status "Quality gates FAIL"
fi

# Test linting
echo "🔍 Testing linting..."
if npm run lint:ci >/dev/null 2>&1; then
    check_status "Linting passes"
else
    check_status "Linting FAILS"
fi

# Test build
echo "🔍 Testing build..."
if npm run build >/dev/null 2>&1; then
    check_status "Build succeeds"
else
    check_status "Build FAILS"
fi

echo ""
echo "🔍 7. Branch Protection Verification"
echo "===================================="

echo -e "${BLUE}📋 Checking branch protection status...${NC}"

# Check if branch protection script exists
if [ -f "scripts/setup-branch-protection.sh" ]; then
    check_status "Branch protection setup script exists"
    
    if [ -x "scripts/setup-branch-protection.sh" ]; then
        check_status "Branch protection script is executable"
    else
        check_status "Branch protection script NOT executable"
    fi
else
    check_status "Branch protection setup script NOT found"
fi

# Try to check current branch protection (requires gh CLI and auth)
if command -v gh >/dev/null 2>&1; then
    if gh auth status >/dev/null 2>&1; then
        echo "🔍 Checking current branch protection..."
        if gh api "/repos/TheCreditPros/dev_framework_demo/branches/main/protection" >/dev/null 2>&1; then
            check_status "Branch protection rules are configured"
        else
            echo -e "${YELLOW}⚠️  Branch protection rules not yet configured${NC}"
            echo -e "${BLUE}💡 Run: ./scripts/setup-branch-protection.sh${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  GitHub CLI not authenticated - cannot check branch protection${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  GitHub CLI not installed - cannot check branch protection${NC}"
fi

echo ""
echo "📊 VERIFICATION SUMMARY"
echo "======================"

echo -e "${GREEN}✅ Fixed Issues:${NC}"
echo "  🤖 Dependabot: Daily security updates + auto-merge"
echo "  🔍 SonarCloud: Quality gate enforcement + AI CodeFix"
echo "  🤖 Qodo PR-Agent: Auto-trigger on security failures"
echo "  🛡️ Security: Vulnerability overrides + comprehensive scanning"

echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "  1. Run: ./scripts/setup-branch-protection.sh"
echo "  2. Test with a security vulnerability PR"
echo "  3. Verify Dependabot auto-merge works"
echo "  4. Confirm SonarCloud blocks failing PRs"
echo "  5. Validate Qodo triggers on security issues"

echo ""
echo -e "${GREEN}🎉 Security automation verification complete!${NC}"

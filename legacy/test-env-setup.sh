#!/bin/bash
# Test Environment Setup Script
# Tests AI-SDLC functionality with real API credentials

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         AI-SDLC Environment Testing Script         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo

# Check if .env file exists
if [[ ! -f ".env" ]]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo -e "${YELLOW}📝 Please copy .env.example to .env and fill in your API keys:${NC}"
    echo "   cp .env.example .env"
    echo "   # Edit .env with your actual API keys"
    echo
    echo -e "${BLUE}Required API keys:${NC}"
    echo "   • OPENAI_API_KEY (OpenAI account)"
    echo "   • QASE_API_KEY (Your existing Qase account)"
    echo "   • QASE_CLIENT_PROJECT_CODE=TCP (Client Frontend Project)"
    echo "   • QASE_ADMIN_PROJECT_CODE=PCU (Admin Frontend Project)"
    echo "   • QASE_TARGET_PROJECT=TCP (Default project)"
    echo "   • GITHUB_TOKEN (GitHub personal access token)"
    echo
    exit 1
fi

echo -e "${GREEN}✅ .env file found${NC}"
echo

# Test 1: Basic environment loading
echo -e "${BLUE}🧪 Test 1: Environment Variable Loading${NC}"
source .env 2>/dev/null || true

if [[ -n "$OPENAI_API_KEY" && "$OPENAI_API_KEY" != "sk-your-openai-key-here" ]]; then
    echo -e "${GREEN}✅ OpenAI API key configured${NC}"
    OPENAI_CONFIGURED=true
else
    echo -e "${YELLOW}⚠️  OpenAI API key not configured (will use templates)${NC}"
    OPENAI_CONFIGURED=false
fi

if [[ -n "$QASE_API_KEY" && "$QASE_API_KEY" != "your-qase-api-token-here" ]]; then
    echo -e "${GREEN}✅ Qase API key configured${NC}"
    QASE_CONFIGURED=true
    
    # Check dual project setup
    if [[ -n "$QASE_CLIENT_PROJECT_CODE" && "$QASE_CLIENT_PROJECT_CODE" = "TCP" ]]; then
        echo -e "${GREEN}   ✓ TCP (Client) project configured${NC}"
    else
        echo -e "${YELLOW}   ⚠️  TCP project not configured (set QASE_CLIENT_PROJECT_CODE=TCP)${NC}"
    fi
    
    if [[ -n "$QASE_ADMIN_PROJECT_CODE" && "$QASE_ADMIN_PROJECT_CODE" = "PCU" ]]; then
        echo -e "${GREEN}   ✓ PCU (Admin) project configured${NC}"
    else
        echo -e "${YELLOW}   ⚠️  PCU project not configured (set QASE_ADMIN_PROJECT_CODE=PCU)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Qase API key not configured${NC}"
    QASE_CONFIGURED=false
fi

if [[ -n "$GITHUB_TOKEN" && "$GITHUB_TOKEN" != "ghp_your-github-token-here" ]]; then
    echo -e "${GREEN}✅ GitHub token configured${NC}"
    GITHUB_CONFIGURED=true
else
    echo -e "${YELLOW}⚠️  GitHub token not configured${NC}"
    GITHUB_CONFIGURED=false
fi

echo

# Test 2: AI Test Generator
echo -e "${BLUE}🧪 Test 2: AI Test Generator${NC}"
if node scripts/ai-test-generator.js --help > /dev/null 2>&1; then
    echo -e "${GREEN}✅ AI Test Generator script working${NC}"
    
    # Test initialization (safe - just creates config files)
    echo -e "${BLUE}   Testing initialization...${NC}"
    if node scripts/ai-test-generator.js init > test-output.log 2>&1; then
        echo -e "${GREEN}✅ Test generation initialization successful${NC}"
        if [[ -f "jest.config.js" ]]; then
            echo -e "${GREEN}   ✓ Jest configuration created${NC}"
        fi
        if [[ -f "playwright.config.ts" ]]; then
            echo -e "${GREEN}   ✓ Playwright configuration created${NC}"
        fi
    else
        echo -e "${RED}❌ Test generation initialization failed${NC}"
        cat test-output.log
    fi
else
    echo -e "${RED}❌ AI Test Generator script has issues${NC}"
fi

echo

# Test 3: API Connectivity (if keys are configured)
if [[ "$OPENAI_CONFIGURED" == true ]]; then
    echo -e "${BLUE}🧪 Test 3: OpenAI API Connectivity${NC}"
    echo -e "${YELLOW}   Testing OpenAI API (this will make a small API call)...${NC}"
    
    # Create a simple test file to generate tests for
    mkdir -p test-sample
    cat > test-sample/calculator.js << 'EOF'
function add(a, b) {
    return a + b;
}

function multiply(a, b) {
    return a * b;
}

module.exports = { add, multiply };
EOF

    if node scripts/ai-test-generator.js generate test-sample/calculator.js > api-test.log 2>&1; then
        echo -e "${GREEN}✅ OpenAI API test successful${NC}"
        if [[ -f "__tests__/test-sample/calculator.test.js" ]]; then
            echo -e "${GREEN}   ✓ Test file generated${NC}"
            echo -e "${BLUE}   Generated test preview:${NC}"
            head -10 "__tests__/test-sample/calculator.test.js" | sed 's/^/     /'
        fi
    else
        echo -e "${RED}❌ OpenAI API test failed${NC}"
        echo -e "${YELLOW}   Check your OPENAI_API_KEY in .env${NC}"
        tail -5 api-test.log | sed 's/^/   /'
    fi
    
    # Cleanup
    rm -rf test-sample __tests__/test-sample 2>/dev/null || true
fi

echo

# Test 4: CLI Integration
echo -e "${BLUE}🧪 Test 4: CLI Integration${NC}"
if ./ai-sdlc help > /dev/null 2>&1; then
    echo -e "${GREEN}✅ CLI working${NC}"
    
    if ./ai-sdlc status > cli-test.log 2>&1; then
        echo -e "${GREEN}✅ CLI status command working${NC}"
    else
        echo -e "${YELLOW}⚠️  CLI status has issues (may be normal)${NC}"
    fi
else
    echo -e "${RED}❌ CLI has issues${NC}"
fi

echo

# Test 5: Security Check
echo -e "${BLUE}🧪 Test 5: Security Check${NC}"
if git status --porcelain | grep -q "\.env$"; then
    echo -e "${RED}❌ DANGER: .env file is staged for commit!${NC}"
    echo -e "${RED}   Run: git reset .env${NC}"
    exit 1
else
    echo -e "${GREEN}✅ .env file not staged (safe)${NC}"
fi

if [[ -f ".env" ]] && git check-ignore .env > /dev/null 2>&1; then
    echo -e "${GREEN}✅ .env file properly ignored by git${NC}"
else
    echo -e "${RED}❌ .env file not properly ignored by git${NC}"
    echo -e "${YELLOW}   Check .gitignore configuration${NC}"
fi

echo

# Summary
echo -e "${BLUE}📊 Test Summary${NC}"
echo "=================="

if [[ "$OPENAI_CONFIGURED" == true ]]; then
    echo -e "${GREEN}✅ OpenAI Integration: Ready for production${NC}"
    echo -e "   Cost: ~$20-50/month for heavy usage"
else
    echo -e "${YELLOW}⚠️  OpenAI Integration: Using free templates${NC}"
    echo -e "   Consider adding OPENAI_API_KEY for AI-powered tests"
fi

if [[ "$QASE_CONFIGURED" == true ]]; then
    echo -e "${GREEN}✅ Qase Integration: Ready${NC}"
    echo -e "   Will sync test cases to your existing Qase project"
else
    echo -e "${YELLOW}⚠️  Qase Integration: Disabled${NC}"
    echo -e "   Add QASE_API_KEY and QASE_PROJECT_CODE to enable"
fi

if [[ "$GITHUB_CONFIGURED" == true ]]; then
    echo -e "${GREEN}✅ GitHub Integration: Ready${NC}"
    echo -e "   Can analyze PRs and create automated reviews"
else
    echo -e "${YELLOW}⚠️  GitHub Integration: Disabled${NC}"
    echo -e "   Add GITHUB_TOKEN for PR analysis features"
fi

echo
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "1. Run: ./ai-sdlc test-init    (initialize test generation)"
echo "2. Run: ./ai-sdlc test-gen all (generate tests for your codebase)"
echo "3. Check generated tests in __tests__/ directory"
echo "4. Run your test suite: npm test"

# Cleanup
rm -f test-output.log api-test.log cli-test.log 2>/dev/null || true

echo
echo -e "${GREEN}🎉 Environment testing complete!${NC}"
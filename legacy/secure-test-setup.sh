#!/bin/bash
# Secure API Testing Setup Script
# This script helps you safely test the AI-SDLC framework with real API credentials

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Secure API Testing Setup              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo

# Step 1: Check if we already have credentials
if [[ -f ".env" ]]; then
    echo -e "${GREEN}✅ .env file already exists${NC}"
    echo -e "${YELLOW}   If you need to update credentials, edit .env directly${NC}"
    echo
else
    echo -e "${BLUE}📝 Setting up .env file for testing...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env from template${NC}"
    echo
fi

# Step 2: Guide user through credential setup
echo -e "${BLUE}🔑 API Credential Setup Guide${NC}"
echo "============================================="
echo

echo -e "${YELLOW}Required for testing:${NC}"
echo

echo -e "${BLUE}1. OpenAI API Key${NC}"
echo "   • Go to: https://platform.openai.com/api-keys"
echo "   • Create new secret key (starts with 'sk-')"
echo "   • Cost: ~$0.03 per 1K tokens (very cheap for testing)"
echo "   • Add to .env: OPENAI_API_KEY=sk-your-key-here"
echo

echo -e "${BLUE}2. Qase API Token (Dual Project Setup)${NC}"
echo "   • Go to: https://app.qase.io/user/api/token"
echo "   • Generate new token"
echo "   • Add to .env: QASE_API_KEY=your-token-here"
echo "   • Dual Qase Project Setup:"
echo "     QASE_CLIENT_PROJECT_CODE=TCP    # Client Frontend"
echo "     QASE_ADMIN_PROJECT_CODE=PCU     # Admin Frontend"
echo "     QASE_TARGET_PROJECT=TCP         # Default project"
echo

echo -e "${BLUE}3. GitHub Token${NC}"
echo "   • Go to: https://github.com/settings/tokens"
echo "   • Generate classic token with 'repo' permissions"
echo "   • Add to .env: GITHUB_TOKEN=ghp_your-token-here"
echo

echo -e "${YELLOW}Optional (for premium features):${NC}"
echo

echo -e "${BLUE}4. Codium AI API Key${NC}"
echo "   • Go to: https://www.codium.ai/"
echo "   • Sign up for account ($19-49/month)"
echo "   • Add to .env: CODIUM_API_KEY=your-key-here"
echo

# Step 3: Security checklist
echo -e "${RED}🔒 SECURITY CHECKLIST (CRITICAL)${NC}"
echo "================================="
echo -e "${RED}[ ] NEVER commit .env file to git${NC}"
echo -e "${RED}[ ] NEVER share API keys in chat/email${NC}"
echo -e "${RED}[ ] NEVER screenshot .env file${NC}"
echo -e "${RED}[ ] ALWAYS revoke keys when done testing${NC}"
echo

# Step 4: Verify git protection
echo -e "${BLUE}🛡️  Git Protection Verification${NC}"
if git check-ignore .env > /dev/null 2>&1; then
    echo -e "${GREEN}✅ .env file is properly ignored by git${NC}"
else
    echo -e "${RED}❌ WARNING: .env file is NOT ignored by git!${NC}"
    echo -e "${RED}   This is dangerous - fix .gitignore immediately${NC}"
    exit 1
fi

if git status --porcelain | grep -q "\.env$"; then
    echo -e "${RED}❌ DANGER: .env file is staged for commit!${NC}"
    echo -e "${RED}   Run: git reset .env${NC}"
    exit 1
else
    echo -e "${GREEN}✅ .env file is not staged (safe)${NC}"
fi

echo

# Step 5: Testing workflow
echo -e "${BLUE}🧪 Testing Workflow${NC}"
echo "=================="
echo "After adding your API keys to .env:"
echo
echo "1. Test environment setup:"
echo "   ./test-env-setup.sh"
echo
echo "2. Initialize AI test generation:"
echo "   ./ai-sdlc test-init"
echo
echo "3. Create a small test file:"
echo "   mkdir -p test-sample"
echo "   echo 'function add(a, b) { return a + b; }' > test-sample/calc.js"
echo
echo "4. Generate AI tests:"
echo "   ./ai-sdlc test-gen test-sample/calc.js"
echo
echo "5. Check generated test:"
echo "   cat __tests__/test-sample/calc.test.js"
echo
echo "6. Clean up test files:"
echo "   rm -rf test-sample __tests__/test-sample"
echo

# Step 6: Cost monitoring
echo -e "${BLUE}💰 Cost Monitoring${NC}"
echo "=================="
echo "• OpenAI: Check usage at https://platform.openai.com/usage"
echo "• Qase: Should be free with existing account"
echo "• GitHub: Free for basic usage"
echo "• Codium: Check billing dashboard"
echo
echo -e "${YELLOW}Expected test costs: <$5 for comprehensive testing${NC}"
echo

echo -e "${GREEN}🎉 Setup complete! Edit .env with your API keys and start testing.${NC}"
echo -e "${YELLOW}Remember: NEVER commit .env to version control!${NC}"
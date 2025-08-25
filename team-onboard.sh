#!/bin/bash

# Team Onboarding Script - Set up new team member in 2 minutes
# Usage: ./team-onboard.sh [developer-name]

GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
NC="\033[0m"

DEVELOPER_NAME="${1:-New Developer}"

echo -e "${GREEN}👋 Welcome to TheCreditPros Development Team, $DEVELOPER_NAME!${NC}"
echo -e "${BLUE}🚀 Setting up your development environment...${NC}"
echo ""

# Check if already set up
if [[ -f ".husky/pre-commit" ]] && [[ -f ".eslintrc.js" ]]; then
  echo -e "${GREEN}✅ Development environment already configured!${NC}"
  echo ""
  echo -e "${YELLOW}📋 Quick reminders:${NC}"
  echo "• Code formatting: Automatic on commit"
  echo "• Tests: Run with 'npm test'"
  echo "• Health check: Run './ai-sdlc status'"
  echo "• Help: Run './ai-sdlc help'"
  exit 0
fi

# Run main setup
if [[ -f "auto-setup.sh" ]]; then
  echo -e "${BLUE}🔧 Running automatic setup...${NC}"
  ./auto-setup.sh
elif [[ -f ".ai-sdlc/auto-setup.sh" ]]; then
  echo -e "${BLUE}🔧 Running automatic setup...${NC}"
  ./.ai-sdlc/auto-setup.sh
else
  echo -e "${YELLOW}⚠️  auto-setup.sh not found. Downloading framework...${NC}"
  
  # Download framework if not present
  if command -v git >/dev/null 2>&1; then
    git clone https://github.com/nydamon/ai-sdlc.git .ai-sdlc
    ./.ai-sdlc/auto-setup.sh
  else
    echo "❌ Git not found. Please install Git first."
    exit 1
  fi
fi

echo ""
echo -e "${GREEN}🎉 Welcome aboard, $DEVELOPER_NAME!${NC}"
echo ""
echo -e "${YELLOW}📋 Your development environment includes:${NC}"
echo "✅ Automatic code formatting (Prettier)"
echo "✅ Code quality checks (ESLint)"  
echo "✅ Git hooks for quality gates"
echo "✅ AI-powered test generation (with API keys)"
echo "✅ Modern development tools"
echo ""
echo -e "${YELLOW}🚀 Start developing:${NC}"
echo "1. Make code changes"
echo "2. Commit normally: git add . && git commit -m 'your message'"
echo "3. Everything formats and validates automatically!"
echo ""
echo -e "${YELLOW}💡 Helpful commands:${NC}"
echo "• ./ai-sdlc status    - Check system health"
echo "• ./ai-sdlc help      - Show all commands"
echo "• npm test            - Run tests"
echo "• npm run lint        - Check code quality"
echo ""
echo -e "${GREEN}Questions? Ask any team member or check the docs!${NC}"
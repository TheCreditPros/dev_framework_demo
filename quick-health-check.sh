#!/bin/bash

# Quick Health Check - Simple 30-second validation
# Usage: ./quick-health-check.sh

GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
NC="\033[0m"

echo -e "${GREEN}🔍 Quick Health Check (30 seconds)${NC}"
echo ""

score=0
total=6

# Check 1: Git repository
if git rev-parse --git-dir > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Git repository detected${NC}"
  ((score++))
else
  echo -e "${RED}❌ Not a Git repository - run 'git init' first${NC}"
fi

# Check 2: Node.js
if command -v node >/dev/null 2>&1; then
  version=$(node --version)
  echo -e "${GREEN}✅ Node.js $version detected${NC}"
  ((score++))
else
  echo -e "${RED}❌ Node.js not found - install Node.js 18+${NC}"
fi

# Check 3: Framework files
if [[ -f "package.json" ]] || [[ -f "artisan" ]] || [[ -f "composer.json" ]]; then
  echo -e "${GREEN}✅ Project framework detected${NC}"
  ((score++))
else
  echo -e "${YELLOW}⚠️  No framework files found (package.json, artisan, composer.json)${NC}"
fi

# Check 4: AI-SDLC installation
if [[ -f "auto-setup.sh" ]] || [[ -f ".ai-sdlc/auto-setup.sh" ]]; then
  echo -e "${GREEN}✅ AI-SDLC framework available${NC}"
  ((score++))
else
  echo -e "${RED}❌ AI-SDLC not found - download from GitHub first${NC}"
fi

# Check 5: Basic configuration
if [[ -f ".eslintrc.js" ]] || [[ -f ".prettierrc" ]] || [[ -f ".husky/pre-commit" ]]; then
  echo -e "${GREEN}✅ Development tools configured${NC}"
  ((score++))
else
  echo -e "${YELLOW}⚠️  Development tools not configured - run auto-setup.sh${NC}"
fi

# Check 6: API keys (optional)
if [[ -f ".env" ]]; then
  echo -e "${GREEN}✅ Environment configuration found${NC}"
  ((score++))
else
  echo -e "${YELLOW}⚠️  No .env file - AI features will be limited${NC}"
fi

echo ""
echo -e "${GREEN}📊 Health Score: $score/$total${NC}"

if [[ $score -eq $total ]]; then
  echo -e "${GREEN}🎉 Everything looks great! You're ready to develop.${NC}"
elif [[ $score -ge 4 ]]; then
  echo -e "${YELLOW}✨ Good setup! Minor improvements available.${NC}"
else
  echo -e "${RED}🚨 Setup needed. Run auto-setup.sh to get started.${NC}"
fi

echo ""
echo -e "${GREEN}Next steps:${NC}"
if [[ $score -lt 4 ]]; then
  echo "1. Run: ./auto-setup.sh"
  echo "2. Add API keys to .env (optional)"
  echo "3. Start developing!"
else
  echo "1. Start developing - everything runs automatically"
  echo "2. Run ./ai-sdlc status for detailed health check"
fi
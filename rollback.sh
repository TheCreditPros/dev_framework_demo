#!/bin/bash

# AI-SDLC Rollback Script - Remove all framework components
# Usage: ./rollback.sh [--confirm]

RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
NC="\033[0m"

if [[ "$1" != "--confirm" ]]; then
  echo -e "${YELLOW}⚠️  This will remove all AI-SDLC components from your project${NC}"
  echo ""
  echo "Components to be removed:"
  echo "• Git hooks (.husky/)"
  echo "• ESLint/Prettier configurations"
  echo "• AI configuration files (.clinerules, cline_config/)"
  echo "• MCP server configuration (.mcp.json)"
  echo "• Test configurations (vitest.config.js, playwright.config.js)"
  echo "• Package dependencies (eslint, prettier, husky, etc.)"
  echo ""
  echo -e "${RED}⚠️  Your source code will NOT be affected${NC}"
  echo ""
  echo "To confirm removal, run: ./rollback.sh --confirm"
  exit 0
fi

echo -e "${YELLOW}🔄 Rolling back AI-SDLC framework...${NC}"

# Remove git hooks
if [[ -d ".husky" ]]; then
  rm -rf .husky
  echo -e "${GREEN}✅ Removed git hooks${NC}"
fi

# Remove configuration files
config_files=(".eslintrc.js" ".eslintrc.json" ".prettierrc" ".clinerules" ".mcp.json" "vitest.config.js" "playwright.config.js" "commitlint.config.js")
for file in "${config_files[@]}"; do
  if [[ -f "$file" ]]; then
    rm "$file"
    echo -e "${GREEN}✅ Removed $file${NC}"
  fi
done

# Remove directories
config_dirs=(".clinerules_modular" "cline_config" "cline_templates" "__tests__" "tests/e2e")
for dir in "${config_dirs[@]}"; do
  if [[ -d "$dir" ]]; then
    rm -rf "$dir"
    echo -e "${GREEN}✅ Removed $dir/${NC}"
  fi
done

# Remove npm packages
if [[ -f "package.json" ]]; then
  echo -e "${YELLOW}📦 Removing AI-SDLC dependencies...${NC}"
  npm uninstall eslint prettier husky lint-staged commitlint @commitlint/config-conventional @playwright/test vitest @testing-library/react @testing-library/jest-dom jsdom 2>/dev/null
  echo -e "${GREEN}✅ Removed npm dependencies${NC}"
fi

# Remove validation scripts
validation_files=("validate-setup.js" "validate-scripts-availability.js")
for file in "${validation_files[@]}"; do
  if [[ -f "$file" ]]; then
    rm "$file"
    echo -e "${GREEN}✅ Removed $file${NC}"
  fi
done

echo ""
echo -e "${GREEN}🎉 AI-SDLC framework has been completely removed${NC}"
echo ""
echo "Your project is now back to its original state."
echo "• Source code unchanged"
echo "• Dependencies cleaned up"  
echo "• Configuration files removed"
echo ""
echo "To reinstall: ./auto-setup.sh"
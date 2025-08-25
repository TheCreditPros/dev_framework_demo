#!/bin/bash

# AI-SDLC Version Update Script
# Automatically updates version numbers across all documentation files
# Usage: ./version-update.sh <new_version>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display help
show_help() {
    echo "AI-SDLC Version Update Script"
    echo ""
    echo "Usage: $0 <new_version>"
    echo ""
    echo "Examples:"
    echo "  $0 v2.7.2      # Update to v2.7.2"
    echo "  $0 v2.8.0      # Update to v2.8.0"
    echo ""
    echo "This script will:"
    echo "  1. Update version in mkdocs.yml"
    echo "  2. Update version in CLAUDE.md"
    echo "  3. Update version in all docs/*.md files"
    echo "  4. Update dates to current date"
    echo "  5. Create a git commit with the changes"
    echo ""
}

# Check if version argument is provided
if [ $# -eq 0 ] || [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

NEW_VERSION="$1"
CURRENT_DATE=$(date +"%B %d, %Y")

echo -e "${BLUE}🚀 AI-SDLC Version Update Script${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# Validate version format
if [[ ! $NEW_VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}❌ Invalid version format. Use format: vX.Y.Z (e.g., v2.7.2)${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Updating to version: ${NEW_VERSION}${NC}"
echo -e "${YELLOW}📅 Updating date to: ${CURRENT_DATE}${NC}"
echo ""

# Get current version from mkdocs.yml
CURRENT_VERSION=$(grep -o "v[0-9]\+\.[0-9]\+\.[0-9]\+" mkdocs.yml | head -1)
if [ -n "$CURRENT_VERSION" ]; then
    echo -e "${BLUE}📊 Current version: ${CURRENT_VERSION}${NC}"
else
    echo -e "${YELLOW}⚠️  Could not detect current version${NC}"
fi

# Confirm with user
echo ""
read -p "Continue with version update? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ Version update cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}🔄 Starting version update...${NC}"
echo ""

# Update mkdocs.yml
echo -e "${BLUE}📄 Updating mkdocs.yml...${NC}"
if [ -f "mkdocs.yml" ]; then
    # Update version in copyright line
    sed -i.bak "s|Version: v[0-9]\+\.[0-9]\+\.[0-9]\+|Version: ${NEW_VERSION}|g" mkdocs.yml
    # Update date in copyright line  
    sed -i.bak "s|Updated: [^\"]*|Updated: ${CURRENT_DATE}|g" mkdocs.yml
    rm mkdocs.yml.bak
    echo -e "${GREEN}  ✅ mkdocs.yml updated${NC}"
else
    echo -e "${YELLOW}  ⚠️  mkdocs.yml not found${NC}"
fi

# Update CLAUDE.md
echo -e "${BLUE}📄 Updating CLAUDE.md...${NC}"
if [ -f "CLAUDE.md" ]; then
    sed -i.bak "s|Framework Version.*: Enhanced AI-SDLC v[0-9]\+\.[0-9]\+\.[0-9]\+|Framework Version**: Enhanced AI-SDLC ${NEW_VERSION}|g" CLAUDE.md
    sed -i.bak "s|Document Version.*: v[0-9]\+\.[0-9]\+\.[0-9]\+|Document Version:** ${NEW_VERSION}|g" CLAUDE.md
    sed -i.bak "s|Last Updated.*: [^*]*|Last Updated:** ${CURRENT_DATE}|g" CLAUDE.md
    rm CLAUDE.md.bak
    echo -e "${GREEN}  ✅ CLAUDE.md updated${NC}"
else
    echo -e "${YELLOW}  ⚠️  CLAUDE.md not found${NC}"
fi

# Update all documentation files in docs/
echo -e "${BLUE}📂 Updating documentation files...${NC}"
DOCS_DIR="docs"
if [ -d "$DOCS_DIR" ]; then
    FILES_UPDATED=0
    
    # Find all .md files in docs directory
    find "$DOCS_DIR" -name "*.md" -type f | while read -r file; do
        if grep -q "v[0-9]\+\.[0-9]\+\.[0-9]\+" "$file"; then
            # Update version numbers
            sed -i.bak "s|v[0-9]\+\.[0-9]\+\.[0-9]\+|${NEW_VERSION}|g" "$file"
            
            # Update dates (various formats)
            sed -i.bak "s|Last Updated: [^*_]*|Last Updated: ${CURRENT_DATE}|g" "$file"
            sed -i.bak "s|_Last Updated: [^*_]*|_Last Updated: ${CURRENT_DATE}|g" "$file"
            sed -i.bak "s|Updated: [^*_]*|Updated: ${CURRENT_DATE}|g" "$file"
            
            # Clean up backup file
            rm "${file}.bak" 2>/dev/null || true
            
            echo -e "${GREEN}  ✅ Updated $(basename "$file")${NC}"
            FILES_UPDATED=$((FILES_UPDATED + 1))
        fi
    done
    
    echo -e "${GREEN}📊 Updated ${FILES_UPDATED} documentation files${NC}"
else
    echo -e "${YELLOW}  ⚠️  docs/ directory not found${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Version update completed!${NC}"
echo ""

# Check git status
if command -v git &> /dev/null && [ -d .git ]; then
    echo -e "${BLUE}📋 Git status:${NC}"
    git status --porcelain | head -10
    
    if [ "$(git status --porcelain | wc -l)" -gt 0 ]; then
        echo ""
        read -p "Create git commit for version update? (y/N): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # Stage all modified files
            git add -A
            
            # Create commit message
            COMMIT_MSG="docs: update framework version to ${NEW_VERSION}

- Update version references across all documentation
- Update last modified dates to ${CURRENT_DATE}
- Maintain version consistency across framework

🤖 Generated with AI-SDLC Version Update Script

Co-Authored-By: Claude <noreply@anthropic.com>"

            # Create commit
            git commit -m "$COMMIT_MSG"
            
            echo -e "${GREEN}✅ Git commit created successfully${NC}"
            echo ""
            echo -e "${BLUE}📝 Commit details:${NC}"
            git log -1 --oneline
        else
            echo -e "${YELLOW}⚠️  Git commit skipped - files staged for manual commit${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Git repository not detected${NC}"
fi

echo ""
echo -e "${GREEN}🏁 Version update process completed!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Review the changes: ${YELLOW}git diff HEAD~1${NC}"
echo -e "  2. Deploy documentation: ${YELLOW}./deploy-docs.sh${NC}"
echo -e "  3. Update any external references to the new version"
echo ""
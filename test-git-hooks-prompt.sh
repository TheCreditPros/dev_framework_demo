#!/bin/bash

# Test script to demonstrate the Git hooks prompt functionality

# Function to prompt user for Git hooks
prompt_git_hooks() {
    local repo_type="$1"
    local default_choice=""
    
    case "$repo_type" in
        "production")
            echo "🚀 PRODUCTION REPOSITORY DETECTED"
            echo "   Git hooks are HIGHLY RECOMMENDED for production repositories"
            echo "   to ensure code quality and prevent bad commits from being pushed."
            default_choice="Y"
            ;;
        "test")
            echo "🧪 TEST REPOSITORY DETECTED"
            echo "   Git hooks are optional for test repositories but can help"
            echo "   validate the framework installation."
            default_choice="N"
            ;;
        "local")
            echo "🏠 LOCAL REPOSITORY DETECTED"
            echo "   Git hooks are recommended for local development to catch"
            echo "   issues early and maintain code quality."
            default_choice="Y"
            ;;
    esac
    
    echo ""
    echo "The AI-SDLC framework includes Git hooks for:"
    echo "  • Pre-commit: Run linting and formatting checks"
    echo "  • Commit-msg: Enforce conventional commit messages"
    echo "  • Pre-push: Run comprehensive quality gates"
    echo ""
    echo "Do you want to configure Git hooks for this repository? (y/N)"
    echo "   This will set 'git config core.hooksPath .husky'"
    echo "   You can disable them later with: git config --unset core.hooksPath"
    echo ""
    
    while true; do
        if [ -n "$default_choice" ]; then
            echo -n "Configure Git hooks? [${default_choice}]: "
        else
            echo -n "Configure Git hooks? [y/N]: "
        fi
        
        read -r response
        response=${response:-$default_choice}
        
        case "$response" in
            [Yy]|[Yy][Ee][Ss])
                echo "✅ Configuring Git hooks..."
                echo "   (Simulated: git config core.hooksPath .husky)"
                echo "✅ Git hooks configured successfully"
                return 0
                ;;
            [Nn]|[Nn][Oo])
                echo "ℹ️  Git hooks not configured"
                echo "   You can configure them later with: git config core.hooksPath .husky"
                return 1
                ;;
            *)
                echo "Please enter 'y' for yes or 'n' for no"
                ;;
        esac
    done
}

echo "=== Testing Git Hooks Prompt Functionality ==="
echo ""

echo "Test 1: Production Repository (default: Y)"
echo "----------------------------------------"
prompt_git_hooks "production"
echo ""

echo "Test 2: Test Repository (default: N)"
echo "----------------------------------"
prompt_git_hooks "test"
echo ""

echo "Test 3: Local Repository (default: Y)"
echo "-----------------------------------"
prompt_git_hooks "local"

#!/bin/bash

# Test the fixed installation script with timeout protection
set -e

echo "🧪 Testing Fixed Installation Script"
echo "===================================="

# Enable debug mode for testing
export DEBUG_MODE=true

# Create a test directory
TEST_DIR="/tmp/ai-sdlc-test-fixed-$(date +%s)"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo "📁 Test directory: $TEST_DIR"

# Initialize git repo
git init
git branch -m main
echo "# Test Repository" > README.md
git add README.md
git commit -m "initial commit"

# Copy the fixed installation script
cp /Users/damondecrescenzo/dev_framework_demo/install-framework-smart.sh .

echo "🚀 Running installation script with debug logging..."

# Run with timeout protection
timeout 1800 ./install-framework-smart.sh 2>&1 | tee installation.log

if [ $? -eq 0 ]; then
    echo "✅ Installation completed successfully!"
    echo "📋 Verifying installation..."

    # Basic verification
    [ -f "package.json" ] && echo "✅ package.json created"
    [ -f "eslint.config.mjs" ] && echo "✅ ESLint config created"
    [ -f ".prettierrc" ] && echo "✅ Prettier config created"
    [ -d ".github/workflows" ] && echo "✅ GitHub workflows created"
    [ -f ".pr_agent.toml" ] && echo "✅ PR Agent config created"

    echo "🎉 All checks passed!"
else
    echo "❌ Installation failed or timed out"
    echo "📋 Last 20 lines of log:"
    tail -20 installation.log
    exit 1
fi

echo "🧹 Cleaning up test directory..."
cd /tmp
rm -rf "$TEST_DIR"

echo "✅ Test completed successfully!"

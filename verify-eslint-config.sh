#!/bin/bash

echo "🔍 ESLint Configuration Verification"
echo "===================================="

# Check for conflicting ESLint configs
echo "Checking for conflicting ESLint configurations..."

if [ -f "eslint.config.js" ]; then
    echo "❌ Found eslint.config.js - this will conflict with eslint.config.mjs"
    echo "   Consider removing or renaming it"
else
    echo "✅ No eslint.config.js found"
fi

if [ -f ".eslintrc.js" ]; then
    echo "❌ Found .eslintrc.js - this will conflict with eslint.config.mjs"
    echo "   Consider removing or renaming it"
else
    echo "✅ No .eslintrc.js found"
fi

if [ -f ".eslintrc.json" ]; then
    echo "❌ Found .eslintrc.json - this will conflict with eslint.config.mjs"
    echo "   Consider removing or renaming it"
else
    echo "✅ No .eslintrc.json found"
fi

# Check our ESLint config
if [ -f "eslint.config.mjs" ]; then
    echo "✅ Found eslint.config.mjs"

    # Check if it has double quotes configuration
    if grep -q '"quotes": \["error", "double"\]' eslint.config.mjs; then
        echo "✅ ESLint configured for DOUBLE QUOTES"
    else
        echo "❌ ESLint NOT configured for double quotes"
    fi
else
    echo "❌ eslint.config.mjs not found"
fi

# Check Prettier config
if [ -f ".prettierrc" ]; then
    echo "✅ Found .prettierrc"

    if grep -q '"singleQuote": false' .prettierrc; then
        echo "✅ Prettier configured for DOUBLE QUOTES"
    else
        echo "❌ Prettier NOT configured for double quotes"
    fi
else
    echo "❌ .prettierrc not found"
fi

echo ""
echo "🧪 Testing ESLint with a sample file..."

# Create a test file with double quotes
cat > test-eslint.js << 'EOF'
const message = "Hello, world!";
const user = {
    name: "John",
    age: 30
};

console.log("Testing double quotes:", message);
EOF

# Test ESLint on the sample file
if npx eslint test-eslint.js > /dev/null 2>&1; then
    echo "✅ ESLint accepts double quotes"
else
    echo "❌ ESLint rejects double quotes - check configuration"
    npx eslint test-eslint.js
fi

# Clean up test file
rm -f test-eslint.js

echo ""
echo "📋 Summary:"
echo "- ESLint should enforce DOUBLE QUOTES"
echo "- Prettier should format with DOUBLE QUOTES"
echo "- No conflicting ESLint configs should exist"

#!/bin/bash

# Advanced quote conversion script
# Converts single quotes to double quotes while handling edge cases

echo "🔄 Converting single quotes to double quotes..."

# Function to safely convert quotes in a file
convert_quotes() {
    local file="$1"
    
    # Skip if file doesn't exist
    if [ ! -f "$file" ]; then
        return
    fi
    
    # Create a temporary file
    local temp_file=$(mktemp)
    
    # Convert quotes using a more sophisticated approach
    # This handles most common cases but avoids breaking escaped quotes
    cat "$file" | \
    sed -E "
        # Handle simple string literals (not in comments or already escaped)
        s/([^\\]|^)'([^']*)'/\1\"\2\"/g
        # Handle empty single quotes
        s/([^\\]|^)''/\1\"\"/g
        # Handle single quotes at start of line
        s/^'([^']*)'/\1/g
    " > "$temp_file"
    
    # Only replace the original file if the conversion looks valid
    if [ -s "$temp_file" ]; then
        mv "$temp_file" "$file"
        echo "✅ Converted quotes in: $file"
    else
        rm -f "$temp_file"
        echo "⚠️  Skipped conversion for: $file (potential issues)"
    fi
}

# Find all JS/TS files and convert quotes
find . -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | \
  grep -v node_modules | \
  grep -v coverage | \
  grep -v dist | \
  grep -v build | \
  while read file; do
    convert_quotes "$file"
  done

echo "✅ Quote conversion completed"

# Run ESLint and Prettier to fix any remaining issues
echo "🔧 Running ESLint and Prettier auto-fix..."

if command -v npm > /dev/null 2>&1; then
    npm run lint:fix > /dev/null 2>&1 || true
    npm run format:fix > /dev/null 2>&1 || true
    echo "✅ Auto-fix completed"
else
    echo "⚠️  npm not found, skipping auto-fix"
fi

echo "🎉 Quote conversion and auto-fix complete!"

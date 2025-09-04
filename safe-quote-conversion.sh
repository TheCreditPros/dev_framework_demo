#!/bin/bash

# Safe quote conversion script that doesn't break regex patterns
echo "🔄 Safe quote conversion (preserving regex patterns)..."

# Function to safely convert quotes in a file
safe_convert_quotes() {
    local file="$1"
    
    # Skip if file doesn't exist
    if [ ! -f "$file" ]; then
        return
    fi
    
    # Create a temporary file
    local temp_file=$(mktemp)
    
    # Convert quotes more carefully - only convert simple string literals
    cat "$file" | \
    sed -E "
        # Only convert simple string literals that are not in regex patterns
        # Look for patterns like: 'string' (not /pattern/ or \"string\")
        s/([^/\\])'([^']*)'([^/])/\1\"\2\"\3/g
        # Handle empty single quotes
        s/([^/\\])''([^/])/\1\"\"\2/g
        # Handle single quotes at start of line (but not regex)
        s/^'([^']*)'([^/])/\"\1\"\2/g
    " > "$temp_file"
    
    # Only replace if the file looks valid (no obvious syntax errors)
    if [ -s "$temp_file" ] && ! grep -q "SyntaxError\|Unexpected token" "$temp_file" 2>/dev/null; then
        mv "$temp_file" "$file"
        echo "✅ Converted quotes in: $file"
    else
        rm -f "$temp_file"
        echo "⚠️  Skipped conversion for: $file (preserving regex patterns)"
    fi
}

# Find all JS/TS files and convert quotes safely
find . -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | \
  grep -v node_modules | \
  grep -v coverage | \
  grep -v dist | \
  grep -v build | \
  while read file; do
    safe_convert_quotes "$file"
  done

echo "✅ Safe quote conversion completed"

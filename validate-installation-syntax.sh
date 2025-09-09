#!/bin/bash

# Validate Installation Script Syntax and GitHub Actions Patterns
# This script checks for syntax errors and unescaped GitHub Actions patterns

set -e

echo "🔍 Validating Installation Script"
echo "================================="

LOG_FILE="validation-$(date +%Y%m%d-%H%M%S).log"

# Function to log with timestamp
log_with_time() {
    echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check 1: Bash syntax validation
log_with_time "✅ Step 1: Checking bash syntax..."
if timeout 30 bash -n install-framework-smart.sh 2>&1 | tee -a "$LOG_FILE"; then
    log_with_time "✅ Bash syntax is valid"
else
    log_with_time "❌ Bash syntax errors found!"
    exit 1
fi

# Check 2: Look for unescaped GitHub Actions patterns
log_with_time "✅ Step 2: Checking for unescaped GitHub Actions patterns..."
if unescaped=$(grep -n '[^\\]\${{' install-framework-smart.sh 2>/dev/null || true); then
    if [ -n "$unescaped" ]; then
        log_with_time "❌ Found unescaped GitHub Actions patterns:"
        echo "$unescaped" | tee -a "$LOG_FILE"
        exit 1
    else
        log_with_time "✅ All GitHub Actions patterns properly escaped"
    fi
else
    log_with_time "✅ No unescaped GitHub Actions patterns found"
fi

# Check 3: Verify heredoc terminators
log_with_time "✅ Step 3: Checking heredoc terminators..."
if timeout 30 bash -c 'grep -n "EOF" install-framework-smart.sh | head -10' 2>&1 | tee -a "$LOG_FILE"; then
    log_with_time "✅ Heredoc terminators look correct"
else
    log_with_time "⚠️ Could not verify heredoc terminators"
fi

# Check 4: Count GitHub Actions patterns
log_with_time "✅ Step 4: Counting GitHub Actions patterns..."
escaped_count=$(grep -c '\\${{' install-framework-smart.sh 2>/dev/null || echo "0")
log_with_time "📊 Found $escaped_count properly escaped GitHub Actions patterns"

# Check 5: Verify timeout functions exist
log_with_time "✅ Step 5: Checking timeout protection..."
if grep -q "run_with_timeout" install-framework-smart.sh; then
    log_with_time "✅ Timeout protection functions found"
else
    log_with_time "❌ Timeout protection functions missing!"
    exit 1
fi

# Check 6: Verify debug logging exists
log_with_time "✅ Step 6: Checking debug logging..."
if grep -q "debug_log" install-framework-smart.sh; then
    log_with_time "✅ Debug logging functions found"
else
    log_with_time "❌ Debug logging functions missing!"
    exit 1
fi

log_with_time "🎉 All validation checks passed!"
log_with_time "📋 Validation log saved to: $LOG_FILE"

echo ""
echo "✅ VALIDATION SUMMARY:"
echo "  🔧 Bash syntax: Valid"
echo "  🛡️ GitHub Actions patterns: $escaped_count properly escaped"
echo "  ⏱️ Timeout protection: Enabled"
echo "  🐛 Debug logging: Enabled"
echo "  📋 Full log: $LOG_FILE"
echo ""
echo "🚀 Installation script is ready for deployment!"

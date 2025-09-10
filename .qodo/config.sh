#!/bin/bash
# Qodo AI Configuration
# This script configures Qodo AI for PR reviews
# Note: Qodo PR is open source and does not require an API token

# Repository configuration
export QODO_REPOSITORY="${GITHUB_REPOSITORY:-TheCreditPros/dev_framework_demo}"

# Review configuration
export QODO_REVIEW_DEPTH="comprehensive"
export QODO_SECURITY_FOCUS="high"
export QODO_CODE_QUALITY_CHECKS="enabled"
export QODO_PERFORMANCE_ANALYSIS="enabled"

# Output configuration
export QODO_OUTPUT_FORMAT="github_comment"
export QODO_VERBOSE_MODE="true"

echo "Qodo AI configured for repository: $QODO_REPOSITORY"
echo "Review depth: $QODO_REVIEW_DEPTH"
echo "Security focus: $QODO_SECURITY_FOCUS"
echo "Note: No API token required - Qodo PR is open source"

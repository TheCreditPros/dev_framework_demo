#!/bin/bash

# Deployment Script with Timeout Protection and Debug Logging
# This script will deploy changes and monitor GitHub Actions with proper error handling

set -e

# Configuration
export TIMEOUT_SECONDS=300  # 5 minutes per command
export DEBUG_MODE=true
export LOG_FILE="deployment-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Debug logging function
debug_log() {
    local message="[DEBUG $(date '+%H:%M:%S')] $1"
    echo -e "${BLUE}$message${NC}" | tee -a "$LOG_FILE"
}

# Error logging function
error_log() {
    local message="[ERROR $(date '+%H:%M:%S')] $1"
    echo -e "${RED}$message${NC}" | tee -a "$LOG_FILE"
}

# Success logging function
success_log() {
    local message="[SUCCESS $(date '+%H:%M:%S')] $1"
    echo -e "${GREEN}$message${NC}" | tee -a "$LOG_FILE"
}

# Warning logging function
warn_log() {
    local message="[WARN $(date '+%H:%M:%S')] $1"
    echo -e "${YELLOW}$message${NC}" | tee -a "$LOG_FILE"
}

# Timeout wrapper for commands
run_with_timeout() {
    local timeout_duration=$1
    shift
    local cmd="$*"

    debug_log "Running with ${timeout_duration}s timeout: $cmd"

    if command -v timeout >/dev/null 2>&1; then
        if timeout "$timeout_duration" bash -c "$cmd" 2>&1 | tee -a "$LOG_FILE"; then
            success_log "Command completed: $cmd"
            return 0
        else
            local exit_code=$?
            if [ $exit_code -eq 124 ]; then
                error_log "Command timed out after ${timeout_duration}s: $cmd"
            else
                error_log "Command failed with exit code $exit_code: $cmd"
            fi
            return $exit_code
        fi
    else
        warn_log "timeout command not available, running without timeout protection"
        if bash -c "$cmd" 2>&1 | tee -a "$LOG_FILE"; then
            success_log "Command completed: $cmd"
            return 0
        else
            local exit_code=$?
            error_log "Command failed with exit code $exit_code: $cmd"
            return $exit_code
        fi
    fi
}

# Cleanup function
cleanup_on_exit() {
    debug_log "Deployment script cleanup initiated"
    # Kill any background processes
    jobs -p | xargs -r kill -TERM 2>/dev/null || true
    sleep 2
    jobs -p | xargs -r kill -KILL 2>/dev/null || true
    debug_log "Cleanup completed"
}

# Set up signal handlers
trap cleanup_on_exit EXIT INT TERM

# Function to run pre-deployment workflow validation
run_pre_deployment_validation() {
    debug_log "Running pre-deployment workflow validation"

    # Check if Node.js is available for advanced validation
    if command -v node >/dev/null 2>&1; then
        debug_log "Node.js detected - running advanced workflow validation"

        # Check if pre-deployment validator exists
        if [ -f "scripts/pre-deployment-validator.js" ]; then
            debug_log "Running pre-deployment validator..."
            if ! run_with_timeout 120 "node scripts/pre-deployment-validator.js"; then
                error_log "Pre-deployment workflow validation failed"
                warn_log "This means your local workflows have issues that will cause deployment failures"
                warn_log "Fix the workflow issues before retrying deployment"
                return 1
            fi
            success_log "✅ Pre-deployment validation passed"
        else
            warn_log "Pre-deployment validator script not found - skipping advanced validation"
        fi
    else
        warn_log "Node.js not available - performing basic workflow validation"

        # Basic validation: check if workflows directory exists
        if [ ! -d ".github/workflows" ]; then
            error_log "Workflows directory .github/workflows not found"
            return 1
        fi

        # Check if there are any workflow files
        workflow_count=$(find .github/workflows -name "*.yml" -o -name "*.yaml" | wc -l)
        if [ "$workflow_count" -eq 0 ]; then
            error_log "No workflow files found in .github/workflows/"
            return 1
        fi

        debug_log "Found $workflow_count workflow files"

        # Basic YAML syntax check
        for workflow_file in .github/workflows/*.yml .github/workflows/*.yaml; do
            if [ -f "$workflow_file" ]; then
                if ! run_with_timeout 30 "python3 -c \"import yaml; yaml.safe_load(open('$workflow_file'))\" 2>/dev/null"; then
                    if ! run_with_timeout 30 "python3 -c \"import sys; import yaml; yaml.safe_load(sys.stdin)\" < \"$workflow_file\" 2>/dev/null"; then
                        error_log "Invalid YAML syntax in $workflow_file"
                        return 1
                    fi
                fi
            fi
        done

        success_log "✅ Basic workflow validation passed"
    fi

    return 0
}

# Function to record deployment in memory system
record_deployment_in_memory() {
    debug_log "Recording deployment in memory system"

    # Get deployment information
    local commit_hash=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    local branch_name=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    local environment="production"  # Default to production, can be parameterized

    # Check if Node.js and deployment memory script are available
    if command -v node >/dev/null 2>&1 && [ -f "scripts/deployment-memory.js" ]; then
        debug_log "Recording deployment: commit=$commit_hash, branch=$branch_name, environment=$environment"

        # Record the deployment
        if node scripts/deployment-memory.js record "$environment" 2>&1 | tee -a "$LOG_FILE"; then
            success_log "✅ Deployment recorded in memory system"
        else
            warn_log "⚠️ Failed to record deployment in memory system"
        fi
    else
        warn_log "Node.js or deployment memory script not available - skipping deployment recording"
    fi
}

# Main deployment function
main() {
    echo "🚀 Starting Deployment with Pre-Validation and Timeout Protection"
    echo "================================================================"
    debug_log "Deployment started in directory: $(pwd)"
    debug_log "Log file: $LOG_FILE"

    # Step 0: Pre-deployment workflow validation
    debug_log "Step 0: Pre-deployment workflow validation"
    if ! run_pre_deployment_validation; then
        error_log "Pre-deployment validation failed - deployment blocked"
        return 1
    fi

    # Step 1: Check git status
    debug_log "Step 1: Checking git status"
    if ! run_with_timeout 30 "git status --porcelain"; then
        error_log "Failed to check git status"
        return 1
    fi

    # Step 2: Add files
    debug_log "Step 2: Adding files to git"
    if ! run_with_timeout 60 "git add ."; then
        error_log "Failed to add files to git"
        return 1
    fi

    # Step 3: Commit changes
    debug_log "Step 3: Committing changes"
    local commit_msg="fix: resolve GitHub Actions syntax hanging and add timeout protection

🔧 CRITICAL FIXES:
- Fixed all GitHub Actions syntax \${{ }} escaping in heredocs
- Added timeout protection and debug logging to prevent hanging
- Protected npm install and long-running commands
- Added signal handlers for graceful cleanup

🛡️ DEPLOYMENT PROTECTION:
- 30-minute max script runtime
- 10-minute npm install timeout
- Debug logging with timestamps
- Automatic cleanup on exit/interrupt

✅ READY FOR PRODUCTION:
- Installation script hang-proof
- GitHub Actions workflows properly configured
- Complete security automation integrated"

    if ! run_with_timeout 60 "git commit -m \"$commit_msg\""; then
        warn_log "Commit may have failed or no changes to commit"
    fi

    # Step 4: Push changes
    debug_log "Step 4: Pushing changes to remote"
    if ! run_with_timeout 120 "git push"; then
        error_log "Failed to push changes"
        return 1
    fi

    # Record deployment in memory system
    record_deployment_in_memory

    success_log "Deployment completed successfully!"

    # Step 5: Monitor GitHub Actions
    debug_log "Step 5: Monitoring GitHub Actions"
    monitor_github_actions
}

# Function to monitor GitHub Actions using comprehensive monitoring system
monitor_github_actions() {
    debug_log "🚀 Starting Advanced GitHub Actions Post-Deployment Monitoring"

    # Check if Node.js is available for advanced monitoring
    if command -v node >/dev/null 2>&1; then
        debug_log "Node.js detected - using advanced monitoring system"

        # Wait for GitHub to register the push
        debug_log "Waiting 15 seconds for GitHub to process the push..."
        sleep 15

        # Start the virtuous cycle validation loop
        debug_log "Starting deployment validation loop..."
        if node scripts/deployment-validation-loop.js quick; then
            success_log "✅ Advanced monitoring completed successfully"
            return 0
        else
            warn_log "⚠️ Advanced monitoring detected issues - falling back to basic monitoring"
        fi
    else
        warn_log "Node.js not available - using basic GitHub CLI monitoring"
    fi

    # Fallback to basic monitoring
    debug_log "Using basic GitHub CLI monitoring"

    # Wait a moment for GitHub to register the push
    debug_log "Waiting 10 seconds for GitHub to process the push..."
    sleep 10

    # Check workflow runs
    debug_log "Checking workflow runs..."
    if ! run_with_timeout 60 "gh run list --limit 5"; then
        warn_log "Failed to list workflow runs - may need GitHub CLI authentication"
        return 1
    fi

    # Get the latest run ID
    debug_log "Getting latest workflow run..."
    local latest_run_id
    if latest_run_id=$(timeout 30 gh run list --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null); then
        debug_log "Latest run ID: $latest_run_id"

        if [ -n "$latest_run_id" ] && [ "$latest_run_id" != "null" ]; then
            # Monitor the run
            debug_log "Monitoring workflow run: $latest_run_id"
            monitor_workflow_run "$latest_run_id"
        else
            warn_log "No workflow runs found or run ID is null"
        fi
    else
        warn_log "Failed to get latest workflow run ID"
    fi
}

# Function to monitor a specific workflow run
monitor_workflow_run() {
    local run_id=$1
    debug_log "Monitoring workflow run: $run_id"

    local max_wait=1800  # 30 minutes max
    local wait_time=0
    local check_interval=30

    while [ $wait_time -lt $max_wait ]; do
        debug_log "Checking workflow status (${wait_time}s elapsed)..."

        local status conclusion
        if status=$(timeout 30 gh run view "$run_id" --json status --jq '.status' 2>/dev/null) && \
           conclusion=$(timeout 30 gh run view "$run_id" --json conclusion --jq '.conclusion' 2>/dev/null); then

            debug_log "Workflow status: $status, conclusion: $conclusion"

            case "$status" in
                "completed")
                    case "$conclusion" in
                        "success")
                            success_log "✅ Workflow completed successfully!"
                            run_with_timeout 60 "gh run view \"$run_id\""
                            return 0
                            ;;
                        "failure")
                            error_log "❌ Workflow failed!"
                            run_with_timeout 60 "gh run view \"$run_id\""
                            return 1
                            ;;
                        "cancelled")
                            warn_log "⚠️ Workflow was cancelled"
                            return 1
                            ;;
                        *)
                            warn_log "⚠️ Workflow completed with conclusion: $conclusion"
                            run_with_timeout 60 "gh run view \"$run_id\""
                            return 1
                            ;;
                    esac
                    ;;
                "in_progress"|"queued")
                    debug_log "Workflow still running... waiting ${check_interval}s"
                    sleep $check_interval
                    wait_time=$((wait_time + check_interval))
                    ;;
                *)
                    warn_log "Unknown workflow status: $status"
                    sleep $check_interval
                    wait_time=$((wait_time + check_interval))
                    ;;
            esac
        else
            warn_log "Failed to get workflow status, retrying..."
            sleep $check_interval
            wait_time=$((wait_time + check_interval))
        fi
    done

    error_log "Workflow monitoring timed out after ${max_wait}s"
    return 1
}

# Run main function
main "$@"
exit_code=$?

if [ $exit_code -eq 0 ]; then
    success_log "🎉 Deployment and monitoring completed successfully!"
else
    error_log "💥 Deployment or monitoring failed with exit code: $exit_code"
fi

debug_log "Full log available at: $LOG_FILE"
exit $exit_code

#!/bin/bash

# MS Teams Webhook Setup Script for AI-SDLC
# The Credit Pros - Development Team

set -euo pipefail

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Help function
show_help() {
    echo "MS Teams Webhook Setup for AI-SDLC"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --webhook-url URL    Set MS Teams webhook URL"
    echo "  --test              Test webhook connectivity"
    echo "  --help              Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  MS_TEAMS_WEBHOOK_URI    MS Teams webhook URL"
    echo ""
    echo "Setup Instructions:"
    echo "1. Go to your MS Teams channel"
    echo "2. Click '...' → 'Connectors'"
    echo "3. Add 'Incoming Webhook'"
    echo "4. Set name: 'AI-SDLC Notifications'"
    echo "5. Copy the webhook URL"
    echo "6. Run: $0 --webhook-url <URL>"
}

# Test webhook function
test_webhook() {
    local webhook_url="${1}"
    
    log_info "Testing MS Teams webhook connectivity..."
    
    # Create test payload
    local test_payload=$(cat <<EOF
{
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": "0076D7",
    "summary": "AI-SDLC Test Notification",
    "sections": [{
        "activityTitle": "🧪 AI-SDLC Webhook Test",
        "activitySubtitle": "Testing MS Teams integration for The Credit Pros",
        "facts": [{
            "name": "Test Status",
            "value": "✅ Connection Successful"
        }, {
            "name": "Timestamp",
            "value": "$(date -u +"%Y-%m-%d %H:%M:%S UTC")"
        }, {
            "name": "Environment",
            "value": "$(whoami)@$(hostname)"
        }],
        "markdown": true
    }]
}
EOF
    )
    
    # Send test message
    local response=$(curl -s -w "%{http_code}" -o /tmp/teams_response.txt \
        -H "Content-Type: application/json" \
        -d "${test_payload}" \
        "${webhook_url}")
    
    if [[ "${response}" == "200" ]]; then
        log_success "Webhook test successful! Check your MS Teams channel."
        return 0
    else
        log_error "Webhook test failed with HTTP ${response}"
        log_error "Response: $(cat /tmp/teams_response.txt 2>/dev/null || echo 'No response body')"
        return 1
    fi
}

# Setup webhook function
setup_webhook() {
    local webhook_url="${1}"
    
    log_info "Setting up MS Teams webhook for AI-SDLC..."
    
    # Validate webhook URL format
    if [[ ! "${webhook_url}" =~ ^https://.*\.webhook\.office\.com/webhookb2/ ]]; then
        log_error "Invalid MS Teams webhook URL format"
        log_info "Expected format: https://outlook.office.com/webhook/..."
        return 1
    fi
    
    # Test webhook connectivity
    if ! test_webhook "${webhook_url}"; then
        log_error "Webhook test failed. Please check the URL and try again."
        return 1
    fi
    
    # Add to GitHub secrets (if using GitHub)
    if [[ -d ".git" ]]; then
        log_info "Adding webhook to environment configuration..."
        
        # Create .env file if it doesn't exist
        if [[ ! -f ".env" ]]; then
            touch .env
            echo "# AI-SDLC Environment Variables" >> .env
        fi
        
        # Update or add webhook URL
        if grep -q "MS_TEAMS_WEBHOOK_URI" .env; then
            # Update existing entry (remove the actual URL for security)
            sed -i.bak 's/MS_TEAMS_WEBHOOK_URI=.*/MS_TEAMS_WEBHOOK_URI=<configured>/' .env
        else
            echo "" >> .env
            echo "# MS Teams Webhook for CI/CD notifications" >> .env
            echo "MS_TEAMS_WEBHOOK_URI=<configured>" >> .env
        fi
        
        log_success "Webhook configuration added to .env file"
        log_warning "⚠️  Remember to add the actual webhook URL to your CI/CD secrets:"
        echo ""
        echo "For GitHub Actions:"
        echo "  1. Go to Repository Settings → Secrets and variables → Actions"
        echo "  2. Add new secret: MS_TEAMS_WEBHOOK_URI"
        echo "  3. Value: ${webhook_url}"
        echo ""
        
        # Update git hooks to include MS Teams notifications
        setup_git_hooks_notifications
        
    else
        log_warning "Not in a git repository. Manual setup required."
    fi
    
    log_success "MS Teams webhook setup complete!"
}

# Setup git hooks with MS Teams notifications
setup_git_hooks_notifications() {
    log_info "Adding MS Teams notifications to git hooks..."
    
    # Create or update pre-push hook with MS Teams notification
    local pre_push_hook=".husky/pre-push"
    
    if [[ ! -f "${pre_push_hook}" ]]; then
        # Create new pre-push hook
        cat > "${pre_push_hook}" << 'EOF'
#!/bin/bash

# Pre-push hook with MS Teams notifications
# Notify team about pushes to main branches

branch_name=$(git symbolic-ref --short HEAD)
commit_hash=$(git rev-parse HEAD)
commit_message=$(git log -1 --pretty=%B)
author_name=$(git log -1 --pretty=%an)

# Only notify for main branches
if [[ "$branch_name" =~ ^(main|master|develop)$ ]]; then
    # Send MS Teams notification (if webhook is configured)
    if [[ -n "${MS_TEAMS_WEBHOOK_URI:-}" ]]; then
        payload=$(cat <<JSON
{
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": "0f314b",
    "summary": "Code Push to ${branch_name}",
    "sections": [{
        "activityTitle": "🚀 Code Push Notification",
        "activitySubtitle": "The Credit Pros - AI-SDLC",
        "facts": [{
            "name": "Branch",
            "value": "${branch_name}"
        }, {
            "name": "Author",
            "value": "${author_name}"
        }, {
            "name": "Commit",
            "value": "${commit_hash:0:8}"
        }, {
            "name": "Message",
            "value": "${commit_message}"
        }],
        "markdown": true
    }]
}
JSON
        )
        
        curl -s -H "Content-Type: application/json" \
             -d "${payload}" \
             "${MS_TEAMS_WEBHOOK_URI}" > /dev/null 2>&1 || true
    fi
fi
EOF
        chmod +x "${pre_push_hook}"
        log_success "Created pre-push hook with MS Teams notifications"
    else
        log_info "Pre-push hook already exists, skipping modification"
    fi
}

# Send deployment notification
send_deployment_notification() {
    local environment="${1:-staging}"
    local status="${2:-success}"
    local branch="${3:-$(git branch --show-current 2>/dev/null || echo 'unknown')}"
    local commit="${4:-$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')}"
    
    if [[ -z "${MS_TEAMS_WEBHOOK_URI:-}" ]]; then
        log_warning "MS_TEAMS_WEBHOOK_URI not set, skipping notification"
        return 0
    fi
    
    local theme_color="00ff00"  # Green for success
    local status_emoji="✅"
    
    if [[ "${status}" != "success" ]]; then
        theme_color="ff0000"  # Red for failure
        status_emoji="❌"
    fi
    
    local payload=$(cat <<EOF
{
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": "${theme_color}",
    "summary": "AI-SDLC Deployment ${status}",
    "sections": [{
        "activityTitle": "${status_emoji} AI-SDLC Deployment",
        "activitySubtitle": "The Credit Pros - ${environment} Environment",
        "facts": [{
            "name": "Environment",
            "value": "${environment}"
        }, {
            "name": "Status",
            "value": "${status}"
        }, {
            "name": "Branch",
            "value": "${branch}"
        }, {
            "name": "Commit",
            "value": "${commit}"
        }, {
            "name": "Timestamp",
            "value": "$(date -u +"%Y-%m-%d %H:%M:%S UTC")"
        }],
        "markdown": true
    }]
}
EOF
    )
    
    curl -s -H "Content-Type: application/json" \
         -d "${payload}" \
         "${MS_TEAMS_WEBHOOK_URI}" > /dev/null 2>&1 || true
    
    log_info "Deployment notification sent to MS Teams"
}

# Main function
main() {
    case "${1:-help}" in
        "--webhook-url")
            if [[ -z "${2:-}" ]]; then
                log_error "Webhook URL is required"
                echo "Usage: $0 --webhook-url <URL>"
                exit 1
            fi
            setup_webhook "${2}"
            ;;
        "--test")
            if [[ -z "${MS_TEAMS_WEBHOOK_URI:-}" ]]; then
                log_error "MS_TEAMS_WEBHOOK_URI environment variable not set"
                log_info "Set it with: export MS_TEAMS_WEBHOOK_URI='<your-webhook-url>'"
                exit 1
            fi
            test_webhook "${MS_TEAMS_WEBHOOK_URI}"
            ;;
        "--deploy-notify")
            send_deployment_notification "${2:-staging}" "${3:-success}" "${4:-}" "${5:-}"
            ;;
        "--help"|"help"|"")
            show_help
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
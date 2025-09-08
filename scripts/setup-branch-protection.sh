#!/bin/bash

# GitHub Branch Protection Setup Script
# Configures branch protection rules with required status checks for security enforcement

set -e

echo "🛡️ Setting up GitHub Branch Protection Rules"
echo "=============================================="

# Repository details
REPO="TheCreditPros/dev_framework_demo"
BRANCH="main"

echo "📋 Repository: $REPO"
echo "🌿 Branch: $BRANCH"

# Check if gh CLI is authenticated
if ! gh auth status >/dev/null 2>&1; then
    echo "❌ GitHub CLI not authenticated. Please run 'gh auth login' first."
    exit 1
fi

echo "✅ GitHub CLI authenticated"

# Configure branch protection rules
echo "🛡️ Configuring branch protection rules..."

gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/$REPO/branches/$BRANCH/protection" \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "🔍 SonarCloud PR Analysis / 🔍 SonarCloud PR Analysis",
      "🚀 Essential CI/CD / 🔍 Essential Quality Gates",
      "🚀 Essential CI/CD / 🔒 Essential Security Gates",
      "🤖 Qodo PR-Agent Review / review",
      "🤖 Dependabot Auto-Merge / 🤖 Auto-merge Dependabot PRs"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "require_last_push_approval": true,
    "bypass_pull_request_allowances": {
      "users": [],
      "teams": [],
      "apps": ["dependabot"]
    }
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}
EOF

echo "✅ Branch protection rules configured successfully!"

# Display current protection status
echo ""
echo "📊 Current Branch Protection Status:"
echo "===================================="

gh api \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/$REPO/branches/$BRANCH/protection" \
  --jq '{
    required_status_checks: .required_status_checks.contexts,
    required_reviews: .required_pull_request_reviews.required_approving_review_count,
    enforce_admins: .enforce_admins.enabled,
    dismiss_stale_reviews: .required_pull_request_reviews.dismiss_stale_reviews,
    require_conversation_resolution: .required_conversation_resolution.enabled
  }'

echo ""
echo "🎉 Branch protection setup complete!"
echo ""
echo "🔒 Security Features Enabled:"
echo "  ✅ Required status checks (strict mode)"
echo "  ✅ Required pull request reviews (1 approval)"
echo "  ✅ Dismiss stale reviews on new commits"
echo "  ✅ Require conversation resolution"
echo "  ✅ Block force pushes and deletions"
echo "  ✅ Dependabot bypass for auto-merge"
echo ""
echo "📋 Required Status Checks:"
echo "  🔍 SonarCloud PR Analysis"
echo "  🚀 Essential Quality Gates"
echo "  🔒 Essential Security Gates"
echo "  🤖 Qodo PR-Agent Review"
echo "  🤖 Dependabot Auto-Merge"
echo ""
echo "💡 Next Steps:"
echo "  1. Test with a new PR to verify all checks are enforced"
echo "  2. Verify Dependabot auto-merge works for security updates"
echo "  3. Confirm SonarCloud quality gates block failing PRs"
echo "  4. Validate Qodo PR-Agent triggers on security issues"

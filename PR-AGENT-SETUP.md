# PR-Agent Setup Guide

## Overview

PR-Agent is an AI-powered tool that automatically reviews pull requests, provides improvement suggestions, and helps maintain code quality standards.

## Installation

### Option 1: Global Installation (Recommended for CI/CD)

```bash
pip install pr-agent
```

### Option 2: NPM Package (For Node.js projects)

```bash
npm install --save-dev @codiumai/pr-agent
```

## Configuration

### 1. Set Environment Variables

Create a `.env` file in your project root:

```env
# Required
GITHUB_TOKEN=your_github_personal_access_token
OPENAI_KEY=your_openai_api_key

# Optional (for enterprise)
GITHUB_ENTERPRISE_URL=https://github.enterprise.com
PR_AGENT_MODEL=gpt-4  # or gpt-3.5-turbo
```

### 2. GitHub Token Setup

1. Go to GitHub → Settings → Developer Settings → Personal Access Tokens
2. Click "Generate new token (classic)"
3. Select scopes:
   - `repo` (full control)
   - `write:discussion` (for PR comments)
   - `read:org` (if using in organization)
4. Copy the token and add to `.env`

### 3. OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add to `.env` file

## Usage

### Manual PR Review

```bash
# Review a specific PR
PR_URL=https://github.com/org/repo/pull/123 npm run pr:review

# Describe PR changes
PR_URL=https://github.com/org/repo/pull/123 npm run pr:describe

# Get improvement suggestions
PR_URL=https://github.com/org/repo/pull/123 npm run pr:improve
```

### Available Scripts

```json
{
  "scripts": {
    "pr:review": "pr-agent review --pr_url=${PR_URL}",
    "pr:describe": "pr-agent describe --pr_url=${PR_URL}",
    "pr:improve": "pr-agent improve --pr_url=${PR_URL}",
    "pr:ask": "pr-agent ask --pr_url=${PR_URL} --question=\"${QUESTION}\"",
    "pr:update-changelog": "pr-agent update_changelog --pr_url=${PR_URL}",
    "pr:add-docs": "pr-agent add_documentation --pr_url=${PR_URL}",
    "pr:find-similar": "pr-agent find_similar_issue --pr_url=${PR_URL}",
    "pr:security-review": "pr-agent review --pr_url=${PR_URL} --extra_instructions=\"Focus on security vulnerabilities\"",
    "pr:compliance-review": "pr-agent review --pr_url=${PR_URL} --extra_instructions=\"Check FCRA compliance\""
  }
}
```

## GitHub Actions Integration

Create `.github/workflows/pr-agent.yml`:

```yaml
name: PR Agent

on:
  pull_request:
    types: [opened, synchronize, reopened]
  issue_comment:
    types: [created, edited]

jobs:
  pr-agent:
    runs-on: ubuntu-latest
    if: github.event.pull_request.draft == false

    steps:
      - name: PR Agent Review
        uses: Codium-ai/pr-agent@main
        env:
          OPENAI_KEY: ${{ secrets.OPENAI_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          pr_url: ${{ github.event.pull_request.html_url }}
          command: "review"

      - name: PR Agent Describe
        uses: Codium-ai/pr-agent@main
        env:
          OPENAI_KEY: ${{ secrets.OPENAI_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          pr_url: ${{ github.event.pull_request.html_url }}
          command: "describe"
```

## Interactive Commands in PRs

Once configured, you can use these commands in PR comments:

- `/review` - Trigger a code review
- `/describe` - Generate PR description
- `/improve` - Get improvement suggestions
- `/ask <question>` - Ask questions about the code
- `/update_changelog` - Update CHANGELOG.md
- `/add_docs` - Generate documentation
- `/help` - Show all available commands

## Configuration File

Create `.pr-agent.yaml` for custom settings:

```yaml
model:
  type: "gpt-4"
  temperature: 0.2

review:
  require_tests: true
  require_docs: true
  enable_security_check: true

describe:
  add_original_user_description: true
  generate_ai_title: true

improve:
  max_suggestions: 10
  include_best_practices: true

custom_prompts:
  review_prompt_extra: |
    Pay special attention to:
    - Security vulnerabilities
    - Performance implications
    - FCRA compliance for credit data
    - Error handling
    - Test coverage
```

## Troubleshooting

### Common Issues

1. **"GITHUB_TOKEN not found"**
   - Ensure token is in `.env` file
   - Check token has correct permissions

2. **"Rate limit exceeded"**
   - OpenAI: Check API usage limits
   - GitHub: Use token with higher rate limits

3. **"PR not found"**
   - Verify PR URL is correct
   - Ensure token has access to the repository

4. **"Model not available"**
   - Check OpenAI API key has access to GPT-4
   - Fallback to gpt-3.5-turbo if needed

### Testing Setup

```bash
# Test with a sample PR
export PR_URL=https://github.com/your-org/your-repo/pull/1
npm run pr:review

# Check configuration
pr-agent --help
```

## Best Practices

1. **Use in CI/CD**: Automate reviews on every PR
2. **Custom Instructions**: Tailor reviews to your standards
3. **Security Reviews**: Run separate security-focused reviews
4. **Incremental Adoption**: Start with describe, add review later
5. **Team Training**: Document your custom commands

## Cost Considerations

- GPT-4: ~$0.03 per 1K tokens
- GPT-3.5-turbo: ~$0.002 per 1K tokens
- Average PR review: 2-5K tokens
- Estimated cost: $0.06-$0.15 per PR with GPT-4

## Security Notes

- Never commit `.env` files
- Use GitHub Secrets for CI/CD
- Rotate tokens regularly
- Limit token permissions to minimum required
- Consider using GitHub Apps for production

## Support

- Documentation: https://github.com/Codium-ai/pr-agent
- Issues: https://github.com/Codium-ai/pr-agent/issues
- Discord: https://discord.gg/codium-ai

---

_Setup guide for AI-SDLC Framework v3.3.0_
_Last updated: 2025-08-27_

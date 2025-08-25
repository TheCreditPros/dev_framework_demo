#!/bin/bash

# API Key Setup Wizard for AI-SDLC Framework

echo "🔑 API Key Setup Wizard"
echo "======================="
echo

# Check if .env exists
if [[ ! -f ".env" ]]; then
    if [[ -f ".env.example" ]]; then
        cp .env.example .env
        echo "✅ Created .env from template"
    else
        # Create basic .env template
        cat > .env << 'ENVEOF'
# AI-SDLC Framework API Configuration

# OpenAI API for test generation (Required for AI features)
OPENAI_API_KEY=

# Qase API for test management (Optional)
QASE_API_KEY=
QASE_PROJECT_CODE=TCP

# GitHub token for PR automation (Optional)
GITHUB_TOKEN=

# SonarQube token for code analysis (Optional)
SONAR_TOKEN=
SONAR_PROJECT_KEY=

# Additional integrations
CODIUM_API_KEY=
ENVEOF
        echo "✅ Created basic .env template"
    fi
fi

# Interactive API key setup
echo "Would you like to configure API keys now? (y/n)"
read -r configure_apis

if [[ "$configure_apis" == "y" ]]; then
    echo
    echo "🤖 OpenAI API Key (for AI test generation)"
    echo "Get yours at: https://platform.openai.com/api-keys"
    read -p "Enter OpenAI API key (or press Enter to skip): " openai_key
    if [[ -n "$openai_key" ]]; then
        sed -i.bak "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$openai_key/" .env
        echo "✅ OpenAI API key configured"
    fi

    echo
    echo "🧪 Qase API Key (for test management)"
    echo "Get yours at: https://app.qase.io/user/api/token"
    read -p "Enter Qase API key (or press Enter to skip): " qase_key
    if [[ -n "$qase_key" ]]; then
        sed -i.bak "s/QASE_API_KEY=.*/QASE_API_KEY=$qase_key/" .env
        echo "✅ Qase API key configured"
    fi

    echo
    echo "🔍 SonarQube Token (for code analysis)"
    echo "Get yours from your SonarQube instance: User > My Account > Security > Tokens"
    read -p "Enter SonarQube token (or press Enter to skip): " sonar_token
    if [[ -n "$sonar_token" ]]; then
        sed -i.bak "s/SONAR_TOKEN=.*/SONAR_TOKEN=$sonar_token/" .env
        echo "✅ SonarQube token configured"
    fi
fi

echo
echo "🎉 API setup complete!"
echo "✅ Configuration saved to .env file"
echo "ℹ️  You can always edit .env manually to update API keys"
echo
echo "🧪 API Quality Gate Validation"
echo "=============================="
echo "The AI-SDLC Framework now includes comprehensive API quality gates:"
echo "  • API Documentation Validation (OpenAPI 3.0+)"
echo "  • Error Handling Consistency Validation"
echo "  • API Contract Testing"
echo "  • Multi-Step Process Analysis"
echo
echo "Run individual validations:"
echo "  npm run api:validate-docs     # Validate API documentation"
echo "  npm run api:validate-errors   # Validate error handling"
echo "  npm run api:test-contracts    # Test API contracts"
echo "  npm run api:analyze-processes # Analyze API processes"
echo
echo "Run all validations:"
echo "  npm run api:validate-all      # Run all API quality gates"
echo
echo "Integration with Graduated Setup Levels:"
echo "  • Minimal: Basic documentation validation"
echo "  • Standard: Full contract testing and error validation"
echo "  • Enterprise: Complete security and compliance validation"
echo
echo "Credit Repair Domain Compliance:"
echo "  • FCRA Section 604 permissible purpose validation"
echo "  • PII data protection and encryption"
echo "  • Audit trail logging for all credit data access"
echo "  • Credit score calculations (300-850 FICO range)"
echo
echo "Next steps:"
echo "  ./ai-sdlc validate    # Test your setup"
echo "  npm run ai:validate   # Run implementation tracker"
echo "  npm run api:validate-all # Run API quality gates"

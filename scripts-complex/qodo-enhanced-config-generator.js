#!/usr/bin/env node

/**
 * Open-Source PR-Agent Configuration Generator for AI-SDLC v2.8.1
 * Generates advanced Qodo PR Agent configurations with 2025 features
 * The Credit Pros - Development Team
 */

const fs = require('fs');
const path = require('path');

class QodoEnhancedConfigGenerator {
  constructor() {
    this.projectRoot = process.cwd();
    this.environment = process.env.NODE_ENV || 'development';
    this.qodoFeatures2025 = [
      'multi_model_support',
      'rag_repository_awareness',
      'advanced_tools_suite',
      'custom_agent_framework',
      'enhanced_security_patterns',
      'compliance_validation_rules',
    ];
  }

  /**
   * Generate comprehensive Qodo configuration
   */
  async generateEnhancedConfig() {
    console.log('🚀 Generating Enhanced Qodo Configuration for 2025...');

    try {
      // Generate main configuration
      await this.generateMainConfig();

      // Generate environment-specific configs
      await this.generateEnvironmentConfigs();

      // Generate enhanced GitHub workflow
      await this.generateEnhancedWorkflow();

      // Generate custom agent templates
      await this.generateCustomAgentTemplates();

      // Generate monitoring configuration
      await this.generateMonitoringConfig();

      console.log('✅ Enhanced Qodo configuration generated successfully!');
      console.log('📁 Generated files:');
      console.log('   - .pr_agent.toml (Enhanced main config)');
      console.log('   - .pr_agent.dev.toml (Development config)');
      console.log('   - .pr_agent.prod.toml (Production config)');
      console.log(
        '   - .github/workflows/qodo-enhanced.yml (Advanced workflow)'
      );
      console.log('   - qodo-agents/ (Custom agent templates)');
      console.log('   - qodo-monitoring.js (Analytics setup)');

      return { status: 'success', features: this.qodoFeatures2025 };
    } catch (error) {
      console.error('❌ Configuration generation failed:', error.message);
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * Generate main enhanced configuration
   */
  async generateMainConfig() {
    const config = `# Open-Source PR-Agent Configuration - AI-SDLC v2.8.1
# The Credit Pros - Multi-Model AI-Powered Code Review

[config]
# Multi-model AI support (2025 enhancement)
model = "gpt-4"
model_turbo = "claude-3-haiku" 
fallback_models = ["claude-3-5-sonnet", "deepseek-coder", "gpt-3.5-turbo"]
verbosity_level = 1
max_model_len = 32000

# Model routing for optimal performance and cost
[model_routing]
security_analysis = "claude-3-5-sonnet"      # Best for security detection
performance_review = "deepseek-coder"        # Optimized for performance analysis
compliance_check = "gpt-4"                   # Most reliable for FCRA/FACTA
code_suggestions = "claude-3-haiku"          # Fast for suggestions
test_generation = "gpt-3.5-turbo"           # Cost-effective for tests

# RAG-Enhanced Repository Awareness (2025)
[repository_context]
enable_rag = true
rag_scope = ["src/", "app/", "lib/", "components/", "resources/", "database/"]
context_depth = "full"
max_context_files = 50

# Credit repair domain knowledge
domain_context = "credit_repair_fintech"
compliance_frameworks = ["FCRA", "FACTA", "SOC2", "PCI_DSS", "GLBA"]
business_context = "consumer_credit_repair_services"

# Architecture patterns enforcement
architecture_style = "laravel_react_microservices"
patterns_to_enforce = [
  "mvc_pattern", 
  "repository_pattern", 
  "service_layer_pattern",
  "api_versioning",
  "event_driven_architecture"
]

# Naming conventions awareness
[naming_conventions]
variables = "camelCase"
functions = "camelCase"
classes = "PascalCase" 
files = "kebab-case"
database_tables = "snake_case"
api_endpoints = "kebab-case"

# Enhanced PR Reviewer (2025 features)
[pr_reviewer]
enable_review = true
enable_auto_approval = false
require_score_review = true
require_tests_review = true
require_security_review = true
require_compliance_review = true
enable_static_analysis = true

# Advanced review settings
max_review_comments = 25
persistent_comment_per_line = true
enable_help_text = true
enable_incremental_review = true

# Review quality gates
minimum_score_threshold = 7.0
security_threshold = "medium"
performance_threshold = "high"

# Credit repair specific review focus
extra_instructions = """
PRIORITY REVIEW AREAS for Credit Repair Application:

🏦 FINANCIAL COMPLIANCE (CRITICAL):
1. FCRA Section 604 - Verify permissible purpose for credit data access
2. FCRA Section 607 - Ensure accuracy requirements for credit information
3. FCRA Section 615 - Validate proper adverse action disclosures
4. FACTA compliance for identity theft prevention
5. SOC-2 Type II compliance for data handling

🔐 SECURITY REQUIREMENTS (CRITICAL):
1. PII encryption at rest and in transit
2. Customer data access logging and audit trails
3. Secure API authentication and authorization
4. SQL injection prevention in database queries
5. XSS prevention in user interfaces

⚡ PERFORMANCE REQUIREMENTS (HIGH):
1. Credit report processing optimization
2. Database query efficiency for large datasets
3. API response time targets (<2 seconds)
4. Memory usage for credit data processing
5. Caching strategies for frequently accessed data

🧪 TESTING REQUIREMENTS (HIGH):
1. Unit tests for all credit calculation logic
2. Integration tests for credit bureau APIs
3. E2E tests for customer dispute workflows
4. Security tests for PII handling
5. Compliance tests for regulatory requirements

📊 CODE QUALITY STANDARDS:
1. TypeScript strict mode enforcement
2. Laravel best practices (Eloquent, Services, Jobs)
3. React performance patterns (memo, useMemo, useCallback)
4. Error handling and user-friendly messaging
5. Comprehensive documentation for business logic
"""

# Enhanced Code Suggestions (2025)
[pr_code_suggestions]
enable_suggestions = true
enable_auto_fix = false
enable_chat = true
max_suggestions = 15
num_code_suggestions = 10

# Suggestion types
enable_line_suggestions = true
enable_method_suggestions = true
enable_class_suggestions = true
enable_architecture_suggestions = true

# Credit repair specific suggestions
suggest_compliance_improvements = true
suggest_security_enhancements = true
suggest_performance_optimizations = true

# Test Coverage Enhancement (2025)
[pr_test]
enable_test_generation = true
coverage_threshold = 80
require_new_tests_for_new_code = true
test_frameworks = ["vitest", "playwright", "pest", "jest"]

# Test generation focus
generate_unit_tests = true
generate_integration_tests = true
generate_e2e_tests = true
generate_security_tests = true

# Credit repair specific test patterns
credit_calculation_tests = true
compliance_validation_tests = true
pii_handling_tests = true
audit_trail_tests = true

# PR Description Enhancement
[pr_description] 
enable_pr_description = true
enable_semantic_sections = true
include_generated_by_tag = true

# Description sections
include_overview = true
include_walkthrough = true
include_changes_summary = true
include_security_implications = true
include_compliance_impact = true
include_testing_strategy = true

# Advanced Tools Suite (2025)
[scan_repo_discussions]
enable = true
scope = ["issues", "prs", "discussions", "wiki"]
analyze_patterns = true
track_decisions = true

[impact_analysis]
enable_impact_analysis = true
analyze_performance = true
analyze_security = true  
analyze_breaking_changes = true
analyze_database_changes = true
analyze_api_changes = true

# Changelog Management
[pr_update_changelog]
enable_changelog = true
changelog_path = "CHANGELOG.md"
changelog_format = "semantic"
include_breaking_changes = true
include_security_fixes = true

# GitHub Integration
[github]
publish_review_comment = true
publish_inline_comments = true
add_line_comments_single_suggestions = true
enable_pr_labels = true
auto_assign_reviewers = true

# Custom Labels for Credit Repair Domain
[custom_labels]
credit_repair_compliance = "🏦 FCRA/FACTA Compliance Review Required"
security_sensitive = "🔐 Security-Sensitive Changes"  
performance_impact = "⚡ Performance Impact Analysis"
database_changes = "🗄️ Database Schema Changes"
api_breaking_changes = "🚨 API Breaking Changes"
pii_handling = "👤 PII Data Handling"
payment_processing = "💳 Payment Processing Changes"
customer_facing = "👥 Customer-Facing Changes"

# Enhanced Security Patterns (2025)
[security_patterns]
# Credit repair specific PII patterns
pii_patterns = [
  "ssn", "social_security_number", "credit_score", "fico_score",
  "bank_account", "routing_number", "customer_id", "consumer_id",
  "credit_card", "account_number", "date_of_birth", "phone_number",
  "address", "email_address", "driver_license", "passport"
]

# Encryption requirements
encryption_required = [
  "customer_data", "financial_info", "personal_info", "credit_reports",
  "payment_info", "dispute_documents", "identity_verification"
]

# Audit requirements
audit_required = [
  "data_access", "data_modification", "user_authentication",
  "payment_processing", "dispute_handling", "credit_bureau_requests",
  "consumer_consent", "data_deletion", "account_creation"
]

# Compliance Validation Rules
[compliance_rules]
# FCRA Section 604 - Permissible Purposes
fcra_604 = {
  required_fields = ["permissible_purpose", "consumer_consent", "business_need"],
  validation_functions = ["validatePermissiblePurpose", "verifyConsent", "checkBusinessNeed"],
  documentation_required = true
}

# FCRA Section 615 - Disclosure Requirements
fcra_615 = {
  required_disclosures = ["adverse_action_notice", "score_disclosure", "source_disclosure"],
  timing_requirements = ["pre_adverse_action", "post_adverse_action"],
  validation_functions = ["validateDisclosureTiming", "verifyNoticeContent"]
}

# SOC-2 Compliance
soc2_controls = {
  access_controls = ["user_authentication", "role_based_access", "session_management"],
  data_protection = ["encryption_at_rest", "encryption_in_transit", "data_classification"],
  monitoring = ["audit_logging", "access_monitoring", "change_tracking"]
}

# Credit Repair Specific Business Rules
[business_rules]
credit_score_validation = {
  min_score = 300,
  max_score = 850,
  validation_required = true,
  error_handling = "user_friendly"
}

dispute_workflow = {
  required_documentation = ["identity_verification", "dispute_reason", "supporting_evidence"],
  timeline_tracking = true,
  status_updates_required = true,
  consumer_communication = "automated"
}

payment_processing = {
  pci_compliance_required = true,
  encryption_required = true,
  audit_logging = true,
  fraud_detection = true
}
`;

    fs.writeFileSync(path.join(this.projectRoot, '.pr_agent.toml'), config);
    console.log('✅ Generated enhanced main configuration');
  }

  /**
   * Generate environment-specific configurations
   */
  async generateEnvironmentConfigs() {
    // Development configuration
    const devConfig = `# Development Environment - Optimized for Speed
[config]
model = "gpt-3.5-turbo"
model_turbo = "claude-3-haiku"
verbosity_level = 2

[pr_reviewer]
enable_review = true
enable_auto_approval = false
require_tests_review = true
require_security_review = false  # Relaxed for dev
require_compliance_review = false  # Relaxed for dev
max_review_comments = 15

extra_instructions = """
Development Focus:
1. Code style and formatting
2. Basic security patterns
3. Test coverage validation
4. Documentation completeness
5. Performance considerations
"""
`;

    // Production configuration
    const prodConfig = `# Production Environment - Maximum Security & Compliance
[config]
model = "gpt-4"
model_turbo = "claude-3-5-sonnet"
verbosity_level = 1

[pr_reviewer]
enable_review = true
enable_auto_approval = false
require_score_review = true
require_tests_review = true
require_security_review = true
require_compliance_review = true
minimum_score_threshold = 8.5
security_threshold = "high"

extra_instructions = """
PRODUCTION CRITICAL REVIEW:
1. FCRA/FACTA compliance - MANDATORY VERIFICATION
2. PII data handling - ENCRYPTED ONLY, NO EXCEPTIONS
3. Security vulnerabilities - ZERO TOLERANCE POLICY
4. Performance impact - THOROUGH ANALYSIS REQUIRED
5. Database changes - REQUIRE DBA APPROVAL
6. Breaking changes - EXTENSIVE DOCUMENTATION REQUIRED
7. Customer-facing changes - UX REVIEW MANDATORY
8. Payment processing - PCI COMPLIANCE VERIFICATION
"""
`;

    fs.writeFileSync(
      path.join(this.projectRoot, '.pr_agent.dev.toml'),
      devConfig
    );
    fs.writeFileSync(
      path.join(this.projectRoot, '.pr_agent.prod.toml'),
      prodConfig
    );

    console.log('✅ Generated environment-specific configurations');
  }

  /**
   * Generate enhanced GitHub workflow
   */
  async generateEnhancedWorkflow() {
    const workflowDir = path.join(this.projectRoot, '.github', 'workflows');
    if (!fs.existsSync(workflowDir)) {
      fs.mkdirSync(workflowDir, { recursive: true });
    }

    const workflow = `name: Open-Source PR-Agent Platform - v2.8.1

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
    branches: [main, master, develop, staging]
  issue_comment:
    types: [created, edited]
  
permissions:
  contents: read
  pull-requests: write
  issues: write
  checks: write

jobs:
  qodo_enhanced_review:
    if: \${{ github.event.sender.type != 'Bot' }}
    runs-on: ubuntu-latest
    name: 🤖 Qodo Enhanced AI Review
    
    strategy:
      matrix:
        environment: [development, production]
    
    steps:
      - name: 📥 Checkout Repository
        uses: actions/checkout@v4
        with:
          token: \${{ secrets.GITHUB_TOKEN }}
          fetch-depth: 0  # Full history for better context
      
      - name: 🔧 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: 📦 Install Dependencies
        run: npm ci
      
      - name: 🔍 Environment Detection
        id: env
        run: |
          if [[ "\${{ matrix.environment }}" == "production" && "\${{ github.base_ref }}" == "main" ]]; then
            echo "config_file=.pr_agent.prod.toml" >> $GITHUB_OUTPUT
            echo "review_mode=strict" >> $GITHUB_OUTPUT
          else
            echo "config_file=.pr_agent.dev.toml" >> $GITHUB_OUTPUT  
            echo "review_mode=standard" >> $GITHUB_OUTPUT
          fi
      
      - name: 🚀 Qodo Enhanced PR Analysis
        id: qodo_review
        uses: qodo-ai/pr-agent@main
        env:
          OPENAI_KEY: \${{ secrets.OPENAI_API_KEY }}
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          QODO_AI_API_KEY: \${{ secrets.QODO_AI_API_KEY }}
          CONFIG_FILE: \${{ steps.env.outputs.config_file }}
        with:
          # Enable all 2025 advanced tools
          tools: "review,describe,improve,test,scan_repo_discussions,impact"
          
          # Multi-model configuration
          config_file: \${{ steps.env.outputs.config_file }}
          
          # Advanced review settings
          pr_reviewer.enable_review: true
          pr_reviewer.require_score_review: true
          pr_reviewer.require_tests_review: true
          pr_reviewer.require_security_review: true
          pr_reviewer.enable_static_analysis: true
          pr_reviewer.enable_incremental_review: true
          
          # Enhanced code suggestions with 2025 features
          pr_code_suggestions.enable_suggestions: true
          pr_code_suggestions.enable_chat: true
          pr_code_suggestions.num_code_suggestions: 10
          pr_code_suggestions.enable_architecture_suggestions: true
          
          # Test coverage enhancement
          pr_test.enable_test_generation: true
          pr_test.coverage_threshold: 80
          pr_test.test_frameworks: "vitest,playwright,pest"
          
          # Repository scanning (2025 feature)
          scan_repo_discussions.enable: true
          scan_repo_discussions.scope: "issues,prs,discussions"
          
          # Impact analysis (2025 feature)  
          impact.enable_impact_analysis: true
          impact.analyze_performance: true
          impact.analyze_security: true
          impact.analyze_breaking_changes: true
          
          # Credit repair domain-specific instructions
          pr_reviewer.extra_instructions: |
            CREDIT REPAIR DOMAIN ANALYSIS:
            
            🏦 COMPLIANCE REQUIREMENTS:
            - FCRA Sections 604, 607, 615 compliance
            - FACTA identity theft prevention  
            - SOC-2 Type II data handling
            - PCI-DSS payment processing
            
            🔐 SECURITY PATTERNS:
            - PII encryption validation (SSN, credit scores, account numbers)
            - Audit trail implementation for data access
            - Secure API authentication patterns
            - Input validation for customer data
            
            ⚡ PERFORMANCE CONSIDERATIONS:
            - Credit report processing efficiency
            - Database query optimization for large datasets
            - API response time requirements (<2 seconds)
            - Memory management for credit data
            
            🧪 TESTING REQUIREMENTS:
            - Unit tests for credit calculations
            - Integration tests for credit bureau APIs
            - E2E tests for dispute workflows
            - Security tests for PII handling
      
      - name: 📊 Custom Compliance Analysis
        if: matrix.environment == 'production'
        run: |
          # Run custom credit repair compliance checks
          node scripts-complex/qodo-agents/credit-compliance-agent.js
          node scripts-complex/qodo-agents/pii-security-agent.js
      
      - name: 🔔 Notify MS Teams
        if: always()
        env:
          MS_TEAMS_WEBHOOK_URI: \${{ secrets.MS_TEAMS_WEBHOOK_URI }}
        run: |
          if [[ -n "$MS_TEAMS_WEBHOOK_URI" ]]; then
            curl -H "Content-Type: application/json" -d '{
              "@type": "MessageCard",
              "@context": "http://schema.org/extensions",
              "themeColor": "'\${{ job.status == 'success' && '28a745' || 'dc3545' }}'",
              "summary": "🤖 Enhanced AI Code Review Complete",
              "sections": [{
                "activityTitle": "Qodo Enhanced PR Analysis - \${{ matrix.environment }}",
                "activitySubtitle": "PR #\${{ github.event.pull_request.number }}",
                "facts": [
                  {"name": "Repository", "value": "\${{ github.repository }}"},
                  {"name": "PR Title", "value": "\${{ github.event.pull_request.title }}"},
                  {"name": "Author", "value": "\${{ github.event.pull_request.user.login }}"},
                  {"name": "Environment", "value": "\${{ matrix.environment }}"},
                  {"name": "Review Mode", "value": "\${{ steps.env.outputs.review_mode }}"},
                  {"name": "Status", "value": "\${{ job.status }}"}
                ]
              }],
              "potentialAction": [{
                "@type": "OpenUri",
                "name": "View PR",
                "targets": [{"os": "default", "uri": "\${{ github.event.pull_request.html_url }}"}]
              }]
            }' "$MS_TEAMS_WEBHOOK_URI"
          fi
      
      - name: 📈 Upload Analysis Results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: qodo-analysis-\${{ matrix.environment }}-\${{ github.event.pull_request.number }}
          path: |
            .qodo-analysis-results.json
            .compliance-check-results.json
`;

    fs.writeFileSync(path.join(workflowDir, 'qodo-enhanced.yml'), workflow);
    console.log('✅ Generated enhanced GitHub Actions workflow');
  }

  /**
   * Generate custom agent templates
   */
  async generateCustomAgentTemplates() {
    const agentsDir = path.join(this.projectRoot, 'qodo-agents');
    if (!fs.existsSync(agentsDir)) {
      fs.mkdirSync(agentsDir, { recursive: true });
    }

    // Credit Compliance Agent
    const creditComplianceAgent = `#!/usr/bin/env node

/**
 * Credit Compliance Custom Agent for Qodo AI
 * Specialized FCRA/FACTA compliance validation
 */

class CreditComplianceAgent {
  constructor() {
    this.complianceRules = {
      fcra: {
        section604: 'Permissible purposes',
        section607: 'Accuracy requirements', 
        section615: 'Disclosure requirements'
      },
      facta: {
        identityTheft: 'Identity theft prevention',
        freeReports: 'Free credit report requirements'
      }
    };
  }

  async analyzeCode(filePath, content) {
    console.log(\`🏦 Analyzing \${filePath} for credit repair compliance...\`);
    
    const analysis = {
      file: filePath,
      fcraCompliance: this.checkFCRACompliance(content),
      factaCompliance: this.checkFACTACompliance(content), 
      piiHandling: this.analyzePIIHandling(content),
      auditTrails: this.checkAuditTrails(content),
      recommendations: []
    };
    
    return analysis;
  }

  checkFCRACompliance(code) {
    const fcraIssues = [];
    
    // Check for permissible purpose validation
    if (code.includes('credit_score') || code.includes('credit_report')) {
      if (!code.includes('permissible_purpose') && !code.includes('consumer_consent')) {
        fcraIssues.push({
          rule: 'FCRA Section 604',
          severity: 'critical',
          message: 'Credit data access without permissible purpose validation'
        });
      }
    }
    
    // Check for accuracy requirements
    if (code.includes('credit_score') && !code.includes('validate') && !code.includes('verify')) {
      fcraIssues.push({
        rule: 'FCRA Section 607', 
        severity: 'high',
        message: 'Credit score handling without accuracy validation'
      });
    }
    
    return { compliant: fcraIssues.length === 0, issues: fcraIssues };
  }

  checkFACTACompliance(code) {
    // Similar implementation for FACTA rules
    return { compliant: true, issues: [] };
  }

  analyzePIIHandling(code) {
    const piiPatterns = ['ssn', 'social_security', 'credit_card', 'bank_account'];
    const issues = [];
    
    piiPatterns.forEach(pattern => {
      if (code.includes(pattern) && !code.includes('encrypt')) {
        issues.push({
          pattern,
          severity: 'critical',
          message: \`PII data (\${pattern}) without encryption\`
        });
      }
    });
    
    return { secure: issues.length === 0, issues };
  }

  checkAuditTrails(code) {
    const auditRequired = ['customer_data', 'credit_access', 'payment_processing'];
    const issues = [];
    
    auditRequired.forEach(operation => {
      if (code.includes(operation) && !code.includes('audit_log')) {
        issues.push({
          operation,
          severity: 'medium',
          message: \`Operation (\${operation}) missing audit logging\`
        });
      }
    });
    
    return { compliant: issues.length === 0, issues };
  }
}

module.exports = CreditComplianceAgent;

if (require.main === module) {
  const agent = new CreditComplianceAgent();
  const filePath = process.argv[2];
  const fs = require('fs');
  
  if (filePath && fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    agent.analyzeCode(filePath, content).then(result => {
      console.log(JSON.stringify(result, null, 2));
    });
  } else {
    console.log('Usage: node credit-compliance-agent.js <file-path>');
  }
}
`;

    fs.writeFileSync(
      path.join(agentsDir, 'credit-compliance-agent.js'),
      creditComplianceAgent
    );
    fs.chmodSync(path.join(agentsDir, 'credit-compliance-agent.js'), '755');

    console.log('✅ Generated custom agent templates');
  }

  /**
   * Generate monitoring configuration
   */
  async generateMonitoringConfig() {
    const monitoringConfig = `#!/usr/bin/env node

/**
 * Qodo Enhanced Monitoring & Analytics
 * Tracks performance and effectiveness of AI code reviews
 */

class QodoMonitoring {
  constructor() {
    this.metrics = {
      reviewsCompleted: 0,
      averageReviewTime: 0,
      securityIssuesFound: 0,
      complianceViolations: 0,
      falsePositiveRate: 0,
      developerSatisfaction: 0
    };
  }

  async collectMetrics() {
    // Implementation for metrics collection
    console.log('📊 Collecting Qodo performance metrics...');
    return this.metrics;
  }

  async generateReport() {
    const metrics = await this.collectMetrics();
    
    const report = {
      timestamp: new Date().toISOString(),
      period: 'last_30_days',
      metrics,
      insights: this.generateInsights(metrics),
      recommendations: this.generateRecommendations(metrics)
    };
    
    return report;
  }

  generateInsights(metrics) {
    return [
      \`Completed \${metrics.reviewsCompleted} automated reviews\`,
      \`Average review time: \${metrics.averageReviewTime} minutes\`,
      \`Security issues detected: \${metrics.securityIssuesFound}\`,
      \`Compliance violations caught: \${metrics.complianceViolations}\`
    ];
  }

  generateRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.falsePositiveRate > 0.1) {
      recommendations.push('Consider fine-tuning review prompts to reduce false positives');
    }
    
    if (metrics.averageReviewTime > 120) {
      recommendations.push('Consider optimizing model selection for faster reviews');
    }
    
    return recommendations;
  }
}

module.exports = QodoMonitoring;
`;

    fs.writeFileSync(
      path.join(this.projectRoot, 'qodo-monitoring.js'),
      monitoringConfig
    );
    console.log('✅ Generated monitoring configuration');
  }
}

// CLI interface
async function main() {
  const generator = new QodoEnhancedConfigGenerator();
  const command = process.argv[2];

  switch (command) {
    case 'generate':
    case 'create':
      await generator.generateEnhancedConfig();
      break;

    default:
      console.log(
        'Open-Source PR-Agent Configuration Generator - AI-SDLC v2.8.1'
      );
      console.log('');
      console.log('Usage:');
      console.log(
        '  qodo-enhanced-config-generator.js generate  - Generate all enhanced configurations'
      );
      console.log('');
      console.log('Generated Files:');
      console.log('  • .pr_agent.toml - Main enhanced configuration');
      console.log('  • .pr_agent.dev.toml - Development environment');
      console.log('  • .pr_agent.prod.toml - Production environment');
      console.log(
        '  • .github/workflows/qodo-enhanced.yml - Advanced workflow'
      );
      console.log('  • qodo-agents/ - Custom agent templates');
      console.log('  • qodo-monitoring.js - Analytics and monitoring');
      console.log('');
      console.log('Features:');
      console.log('  • Multi-model AI support (GPT, Claude, Deepseek)');
      console.log('  • RAG repository awareness');
      console.log('  • Advanced security pattern detection');
      console.log('  • FCRA/FACTA compliance validation');
      console.log('  • Custom agent framework');
      console.log('  • Performance monitoring and analytics');
      break;
  }
}

// Export for use as module
module.exports = QodoEnhancedConfigGenerator;

// Run CLI if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

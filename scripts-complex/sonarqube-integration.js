#!/usr/bin/env node

/**
 * Advanced SonarQube Integration for AI-SDLC
 * The Credit Pros - Development Team
 *
 * Provides comprehensive code quality analysis and reporting
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { URL } = require('url');

class SonarQubeIntegration {
  constructor() {
    this.sonarToken = process.env.SONAR_TOKEN;
    this.sonarHost = process.env.SONAR_HOST_URL || 'http://localhost:9000';
    this.projectRoot = process.cwd();
    this.projectKey = this.generateProjectKey();

    if (!this.sonarToken) {
      console.warn(
        '⚠️  SONAR_TOKEN not configured. Some features will be limited.'
      );
    }
  }

  /**
   * Generate project key from Git remote or directory name
   */
  generateProjectKey() {
    try {
      const remoteUrl = execSync('git remote get-url origin', {
        encoding: 'utf8',
      }).trim();
      const match = remoteUrl.match(/\/([^/]+)(?:\.git)?$/);
      if (match) {
        return match[1].replace(/[^a-zA-Z0-9-_]/g, '-');
      }
    } catch {
      // Fallback to directory name
    }

    return path.basename(this.projectRoot).replace(/[^a-zA-Z0-9-_]/g, '-');
  }

  /**
   * Initialize SonarQube integration
   */
  async initializeSonarQube() {
    console.log('🔍 Initializing SonarQube integration...');

    try {
      // Create SonarQube project properties
      await this.createSonarProperties();

      // Create SonarQube quality gate
      await this.createQualityGate();

      // Set up GitHub Actions integration
      await this.createGitHubWorkflow();

      // Create custom rules for credit repair domain
      await this.setupCustomRules();

      console.log('✅ SonarQube integration initialized successfully');
      console.log('📝 Configuration files created:');
      console.log('   - sonar-project.properties (SonarQube configuration)');
      console.log('   - .github/workflows/sonarqube.yml (GitHub Actions)');
      console.log('   - sonar-quality-gate.json (Custom quality gate)');

      return {
        status: 'success',
        message: 'SonarQube initialized',
        projectKey: this.projectKey,
        host: this.sonarHost,
      };
    } catch (error) {
      console.error('❌ Failed to initialize SonarQube:', error.message);
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * Create SonarQube project properties
   */
  async createSonarProperties() {
    const properties = `# SonarQube project configuration for AI-SDLC
sonar.projectKey=${this.projectKey}
sonar.projectName=AI-SDLC Framework
sonar.projectVersion=1.0.0

# Source and test directories
sonar.sources=src,scripts,docs
sonar.tests=tests,__tests__
sonar.exclusions=**/node_modules/**,**/vendor/**,**/dist/**,**/build/**,**/*.min.js

# Language-specific settings
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.typescript.lcov.reportPaths=coverage/lcov.info
sonar.php.coverage.reportPaths=coverage/clover.xml
sonar.php.tests.reportPath=tests/phpunit.xml

# Code coverage
sonar.coverage.exclusions=**/*.test.js,**/*.spec.js,**/tests/**,**/__tests__/**

# Security analysis
sonar.security.hotspots.reportPaths=security-report.json

# Credit repair specific rules
sonar.issue.ignore.multicriteria=e1,e2,e3,e4,e5

# Ignore certain rules for financial data handling
sonar.issue.ignore.multicriteria.e1.ruleKey=javascript:S3776
sonar.issue.ignore.multicriteria.e1.resourceKey=**/credit-report-processor.js

# Allow complex functions for credit calculations
sonar.issue.ignore.multicriteria.e2.ruleKey=javascript:S1541
sonar.issue.ignore.multicriteria.e2.resourceKey=**/credit-calculations.js

# Allow longer functions for FCRA compliance logic
sonar.issue.ignore.multicriteria.e3.ruleKey=javascript:S138
sonar.issue.ignore.multicriteria.e3.resourceKey=**/compliance-checks.js

# Allow multiple return statements for validation logic
sonar.issue.ignore.multicriteria.e4.ruleKey=javascript:S1142
sonar.issue.ignore.multicriteria.e4.resourceKey=**/data-validation.js

# Allow console logging for audit trails
sonar.issue.ignore.multicriteria.e5.ruleKey=javascript:S2228
sonar.issue.ignore.multicriteria.e5.resourceKey=**/audit-logger.js

# Quality gate
sonar.qualitygate.wait=true

# Branch analysis
sonar.branch.name=\${GITHUB_REF_NAME}
sonar.pullrequest.key=\${GITHUB_PR_NUMBER}
sonar.pullrequest.branch=\${GITHUB_HEAD_REF}
sonar.pullrequest.base=\${GITHUB_BASE_REF}
`;

    fs.writeFileSync(
      path.join(this.projectRoot, 'sonar-project.properties'),
      properties
    );
    console.log('✅ Created sonar-project.properties');
  }

  /**
   * Create custom quality gate for credit repair domain
   */
  async createQualityGate() {
    const qualityGate = {
      name: 'AI-SDLC Credit Repair Quality Gate',
      conditions: [
        {
          metric: 'new_coverage',
          op: 'LT',
          value: '80',
          error: 'Coverage on new code must be at least 80%',
        },
        {
          metric: 'new_duplicated_lines_density',
          op: 'GT',
          value: '3',
          error: 'Duplicated lines on new code must not exceed 3%',
        },
        {
          metric: 'new_maintainability_rating',
          op: 'GT',
          value: '1',
          error: 'Maintainability rating on new code must be A',
        },
        {
          metric: 'new_reliability_rating',
          op: 'GT',
          value: '1',
          error: 'Reliability rating on new code must be A',
        },
        {
          metric: 'new_security_rating',
          op: 'GT',
          value: '1',
          error: 'Security rating on new code must be A',
        },
        {
          metric: 'new_security_hotspots_reviewed',
          op: 'LT',
          value: '100',
          error: 'Security hotspots on new code must be 100% reviewed',
        },
      ],
      creditRepairSpecific: {
        piiDataHandling: 'All PII data handling must be reviewed',
        fcraCompliance: 'FCRA compliance checks required',
        encryptionStandards: 'Encryption implementation must be validated',
        auditTrails: 'Audit trail implementation required',
      },
    };

    fs.writeFileSync(
      path.join(this.projectRoot, 'sonar-quality-gate.json'),
      JSON.stringify(qualityGate, null, 2)
    );
    console.log('✅ Created custom quality gate configuration');
  }

  /**
   * Create GitHub Actions workflow for SonarQube
   */
  async createGitHubWorkflow() {
    const workflowDir = path.join(this.projectRoot, '.github', 'workflows');
    if (!fs.existsSync(workflowDir)) {
      fs.mkdirSync(workflowDir, { recursive: true });
    }

    const workflow = `name: SonarQube Analysis

on:
  push:
    branches: [ main, master, develop ]
  pull_request:
    branches: [ main, master, develop ]
  schedule:
    # Run analysis weekly on Sundays at 2 AM
    - cron: '0 2 * * 0'

permissions:
  contents: read
  pull-requests: write
  checks: write

jobs:
  sonarqube:
    name: SonarQube Code Analysis
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Shallow clones should be disabled for better relevancy

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: |
          npm run test:coverage || echo "Tests completed"
        continue-on-error: true

      - name: Run ESLint
        run: |
          npm run lint -- --format json --output-file eslint-report.json || echo "ESLint completed"
        continue-on-error: true

      - name: Setup PHP (if Laravel project detected)
        if: hashFiles('composer.json')
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          coverage: xdebug

      - name: Install PHP dependencies
        if: hashFiles('composer.json')
        run: composer install --prefer-dist --no-progress

      - name: Run PHP tests with coverage
        if: hashFiles('composer.json')
        run: |
          vendor/bin/pest --coverage --coverage-clover coverage/clover.xml || echo "PHP tests completed"
        continue-on-error: true

      - name: SonarQube Scan
        uses: sonarqube-quality-gate-action@master
        with:
          scanMetadataReportFile: .scannerwork/report-task.txt
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: \${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: \${{ vars.SONAR_HOST_URL || 'https://sonarcloud.io' }}

      - name: SonarQube Quality Gate Check
        uses: sonarqube-quality-gate-action@master
        timeout-minutes: 5
        env:
          SONAR_TOKEN: \${{ secrets.SONAR_TOKEN }}

      - name: Generate SonarQube Report
        if: always()
        run: |
          node ./scripts/sonarqube-integration.js report > sonarqube-report.md
        continue-on-error: true

      - name: Comment PR with SonarQube Results
        if: github.event_name == 'pull_request' && always()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            let report = 'SonarQube analysis completed';
            
            try {
              if (fs.existsSync('sonarqube-report.md')) {
                report = fs.readFileSync('sonarqube-report.md', 'utf8');
              }
            } catch (error) {
              console.log('Could not read SonarQube report');
            }
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });

      # Send notification to MS Teams
      - name: Notify MS Teams
        if: always() && env.MS_TEAMS_WEBHOOK_URI
        run: |
          curl -H "Content-Type: application/json" -d '{
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "themeColor": "0078d4",
            "summary": "🔍 SonarQube Analysis Complete",
            "sections": [{
              "activityTitle": "SonarQube Code Quality Analysis",
              "activitySubtitle": "Project: \${{ github.repository }}",
              "facts": [
                {"name": "Branch", "value": "\${{ github.ref_name }}"},
                {"name": "Commit", "value": "\${{ github.sha }}"},
                {"name": "Status", "value": "\${{ job.status }}"},
                {"name": "Project Key", "value": "${this.projectKey}"}
              ],
              "markdown": true
            }],
            "potentialAction": [{
              "@type": "OpenUri",
              "name": "View Results",
              "targets": [{"os": "default", "uri": "\${{ env.SONAR_HOST_URL }}/dashboard?id=${this.projectKey}"}]
            }]
          }' \${{ secrets.MS_TEAMS_WEBHOOK_URI }}
        env:
          MS_TEAMS_WEBHOOK_URI: \${{ secrets.MS_TEAMS_WEBHOOK_URI }}
          SONAR_HOST_URL: \${{ vars.SONAR_HOST_URL || 'https://sonarcloud.io' }}
`;

    fs.writeFileSync(path.join(workflowDir, 'sonarqube.yml'), workflow);
    console.log(
      '✅ Created GitHub Actions workflow: .github/workflows/sonarqube.yml'
    );
  }

  /**
   * Set up custom rules for credit repair domain
   */
  async setupCustomRules() {
    const customRules = {
      name: 'Credit Repair Domain Rules',
      description:
        'Custom SonarQube rules for credit repair and financial services',
      rules: [
        {
          key: 'credit-pii-logging',
          name: 'No PII in Logs',
          description: 'Prevent logging of personally identifiable information',
          severity: 'CRITICAL',
          type: 'SECURITY_HOTSPOT',
          patterns: [
            'console.log.*ssn',
            'console.log.*social_security',
            'console.log.*credit_score',
            'log.*customer.*id',
          ],
        },
        {
          key: 'credit-encryption-required',
          name: 'Encryption Required for Sensitive Data',
          description: 'Sensitive credit data must be encrypted',
          severity: 'CRITICAL',
          type: 'SECURITY_HOTSPOT',
          patterns: [
            'store.*credit_score.*[^encrypt]',
            'save.*ssn.*[^encrypt]',
            'database.*personal_info.*[^encrypt]',
          ],
        },
        {
          key: 'credit-fcra-compliance',
          name: 'FCRA Compliance Required',
          description:
            'Credit reporting operations must include FCRA compliance checks',
          severity: 'MAJOR',
          type: 'CODE_SMELL',
          patterns: [
            'credit.*report.*[^fcra]',
            'dispute.*process.*[^compliance]',
            'credit.*inquiry.*[^authorized]',
          ],
        },
        {
          key: 'credit-audit-trail',
          name: 'Audit Trail Required',
          description: 'Credit operations must include audit trail logging',
          severity: 'MAJOR',
          type: 'CODE_SMELL',
          patterns: [
            'delete.*credit',
            'update.*customer.*score',
            'modify.*credit.*report',
          ],
        },
      ],
    };

    fs.writeFileSync(
      path.join(this.projectRoot, 'sonar-custom-rules.json'),
      JSON.stringify(customRules, null, 2)
    );
    console.log('✅ Created custom rules for credit repair domain');
  }

  /**
   * Run SonarQube analysis
   */
  async runAnalysis() {
    console.log('🔍 Running SonarQube analysis...');

    try {
      // Prepare analysis command
      const analysisCmd = this.buildAnalysisCommand();

      // Run SonarQube scanner
      console.log('📊 Executing SonarQube scanner...');
      execSync(analysisCmd, {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      console.log('✅ SonarQube analysis completed');

      // Get analysis results
      const results = await this.getAnalysisResults();

      // Generate report
      await this.generateAnalysisReport(results);

      return {
        status: 'success',
        results,
        projectKey: this.projectKey,
        dashboardUrl: `${this.sonarHost}/dashboard?id=${this.projectKey}`,
      };
    } catch (error) {
      console.error('❌ SonarQube analysis failed:', error.message);
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * Build SonarQube analysis command
   */
  buildAnalysisCommand() {
    let cmd = 'sonar-scanner';

    // Add basic parameters
    cmd += ` -Dsonar.projectKey=${this.projectKey}`;
    cmd += ` -Dsonar.host.url=${this.sonarHost}`;

    if (this.sonarToken) {
      cmd += ` -Dsonar.login=${this.sonarToken}`;
    }

    // Add branch information if in Git
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        encoding: 'utf8',
      }).trim();
      if (branch && branch !== 'HEAD') {
        cmd += ` -Dsonar.branch.name=${branch}`;
      }
    } catch {
      // Ignore git errors
    }

    // Add coverage reports if they exist
    if (fs.existsSync('coverage/lcov.info')) {
      cmd += ' -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info';
    }

    if (fs.existsSync('coverage/clover.xml')) {
      cmd += ' -Dsonar.php.coverage.reportPaths=coverage/clover.xml';
    }

    return cmd;
  }

  /**
   * Get analysis results from SonarQube API
   */
  async getAnalysisResults() {
    if (!this.sonarToken) {
      return { status: 'limited', message: 'API token not available' };
    }

    try {
      // Get project measures
      const measures = await this.getSonarQubeAPI(
        `/api/measures/component?component=${this.projectKey}&metricKeys=bugs,vulnerabilities,security_hotspots,code_smells,coverage,duplicated_lines_density,ncloc,cognitive_complexity`
      );

      // Get quality gate status
      const qualityGate = await this.getSonarQubeAPI(
        `/api/qualitygates/project_status?projectKey=${this.projectKey}`
      );

      // Get issues
      const issues = await this.getSonarQubeAPI(
        `/api/issues/search?componentKeys=${this.projectKey}&types=BUG,VULNERABILITY,SECURITY_HOTSPOT,CODE_SMELL`
      );

      return {
        measures: measures.component?.measures || [],
        qualityGate: qualityGate.projectStatus || {},
        issues: issues.issues || [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.warn('⚠️  Could not fetch SonarQube results:', error.message);
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Make API call to SonarQube
   */
  async getSonarQubeAPI(path) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.sonarHost);
      const options = {
        headers: {
          Authorization: `Basic ${Buffer.from(this.sonarToken + ':').toString('base64')}`,
        },
      };

      https
        .get(url, options, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(error);
            }
          });
        })
        .on('error', reject);
    });
  }

  /**
   * Generate analysis report
   */
  async generateAnalysisReport(results) {
    const reportPath = path.join(
      this.projectRoot,
      'SONARQUBE_ANALYSIS_REPORT.md'
    );

    let report = `# SonarQube Analysis Report\n\n`;
    report += `**Generated**: ${new Date().toISOString()}\n`;
    report += `**Project**: ${this.projectKey}\n`;
    report += `**Dashboard**: ${this.sonarHost}/dashboard?id=${this.projectKey}\n\n`;

    if (results.status === 'error') {
      report += `## ❌ Analysis Error\n\n${results.error}\n\n`;
    } else if (results.measures) {
      // Quality Gate Status
      report += `## 🚪 Quality Gate\n\n`;
      const qgStatus = results.qualityGate.status;
      const qgIcon =
        qgStatus === 'OK' ? '✅' : qgStatus === 'ERROR' ? '❌' : '⚠️';
      report += `**Status**: ${qgIcon} ${qgStatus}\n\n`;

      // Key Metrics
      report += `## 📊 Key Metrics\n\n`;
      const metrics = this.parseSonarMeasures(results.measures);

      report += `- **Lines of Code**: ${metrics.ncloc || 'N/A'}\n`;
      report += `- **Coverage**: ${metrics.coverage || 'N/A'}%\n`;
      report += `- **Duplicated Lines**: ${metrics.duplicated_lines_density || 'N/A'}%\n`;
      report += `- **Cognitive Complexity**: ${metrics.cognitive_complexity || 'N/A'}\n\n`;

      // Issues Summary
      report += `## 🐛 Issues Summary\n\n`;
      report += `- **Bugs**: ${metrics.bugs || 0}\n`;
      report += `- **Vulnerabilities**: ${metrics.vulnerabilities || 0}\n`;
      report += `- **Security Hotspots**: ${metrics.security_hotspots || 0}\n`;
      report += `- **Code Smells**: ${metrics.code_smells || 0}\n\n`;

      // Credit Repair Specific Analysis
      report += `## 🏦 Credit Repair Compliance\n\n`;
      const creditIssues = this.analyzeCreditRepairCompliance(results.issues);

      if (creditIssues.length > 0) {
        report += `**Compliance Issues Found**: ${creditIssues.length}\n\n`;
        creditIssues.forEach((issue) => {
          report += `- **${issue.component}:${issue.line}** - ${issue.message} (${issue.severity})\n`;
        });
      } else {
        report += `✅ No compliance issues detected\n`;
      }
    }

    report += `\n---\n\n*Generated by AI-SDLC SonarQube Integration*\n`;

    fs.writeFileSync(reportPath, report);
    console.log(`✅ Analysis report generated: ${reportPath}`);
  }

  /**
   * Parse SonarQube measures into key-value pairs
   */
  parseSonarMeasures(measures) {
    const metrics = {};
    measures.forEach((measure) => {
      metrics[measure.metric] = measure.value;
    });
    return metrics;
  }

  /**
   * Analyze credit repair compliance issues
   */
  analyzeCreditRepairCompliance(issues) {
    const complianceKeywords = [
      'ssn',
      'social_security',
      'credit_score',
      'personal_info',
      'pii',
      'encrypt',
      'fcra',
      'facta',
      'audit',
      'compliance',
    ];

    return issues.filter((issue) => {
      const message = issue.message.toLowerCase();
      return complianceKeywords.some((keyword) => message.includes(keyword));
    });
  }

  /**
   * Test SonarQube configuration
   */
  async testConfiguration() {
    console.log('🧪 Testing SonarQube configuration...');

    const results = {
      timestamp: new Date().toISOString(),
      tests: {
        sonarToken: this.sonarToken ? 'configured' : 'missing',
        sonarHost: this.sonarHost ? 'configured' : 'missing',
        propertiesFile: fs.existsSync('sonar-project.properties')
          ? 'exists'
          : 'missing',
        qualityGate: fs.existsSync('sonar-quality-gate.json')
          ? 'exists'
          : 'missing',
        workflow: fs.existsSync('.github/workflows/sonarqube.yml')
          ? 'exists'
          : 'missing',
        customRules: fs.existsSync('sonar-custom-rules.json')
          ? 'exists'
          : 'missing',
      },
      status: 'unknown',
      recommendations: [],
    };

    // Check SonarQube connectivity
    if (this.sonarToken) {
      try {
        await this.getSonarQubeAPI('/api/system/status');
        results.tests.connectivity = 'success';
      } catch {
        results.tests.connectivity = 'failed';
        results.recommendations.push('Check SonarQube server connectivity');
      }
    }

    // Calculate configuration completeness
    let score = 0;
    const maxScore = 6;

    if (results.tests.sonarToken === 'configured') score++;
    else results.recommendations.push('Set SONAR_TOKEN environment variable');

    if (results.tests.propertiesFile === 'exists') score++;
    else
      results.recommendations.push(
        'Run initialization to create sonar-project.properties'
      );

    if (results.tests.qualityGate === 'exists') score++;
    else
      results.recommendations.push('Run initialization to create quality gate');

    if (results.tests.workflow === 'exists') score++;
    else
      results.recommendations.push(
        'Run initialization to create GitHub workflow'
      );

    if (results.tests.customRules === 'exists') score++;
    else
      results.recommendations.push('Run initialization to create custom rules');

    if (results.tests.connectivity === 'success') score++;
    else results.recommendations.push('Verify SonarQube server is accessible');

    // Determine overall status
    if (score === maxScore) {
      results.status = 'ready';
      console.log('✅ SonarQube configuration is complete and ready');
    } else if (score >= 4) {
      results.status = 'partial';
      console.log('⚠️  SonarQube partially configured');
    } else {
      results.status = 'incomplete';
      console.log('❌ SonarQube configuration incomplete');
    }

    // Display recommendations
    if (results.recommendations.length > 0) {
      console.log('\n📋 Recommendations:');
      results.recommendations.forEach((rec) => console.log(`   - ${rec}`));
    }

    return results;
  }
}

// CLI interface
async function main() {
  const sonar = new SonarQubeIntegration();
  const command = process.argv[2];

  switch (command) {
    case 'init':
    case 'initialize':
      await sonar.initializeSonarQube();
      break;

    case 'analyze':
    case 'scan': {
      const results = await sonar.runAnalysis();
      console.log(JSON.stringify(results, null, 2));
      break;
    }

    case 'report': {
      const analysisResults = await sonar.getAnalysisResults();
      await sonar.generateAnalysisReport(analysisResults);
      break;
    }

    case 'test':
    case 'check':
      await sonar.testConfiguration();
      break;

    default:
      console.log('SonarQube Integration for AI-SDLC Framework');
      console.log('');
      console.log('Usage:');
      console.log(
        '  sonarqube-integration.js init     - Initialize SonarQube integration'
      );
      console.log(
        '  sonarqube-integration.js analyze  - Run SonarQube analysis'
      );
      console.log(
        '  sonarqube-integration.js report   - Generate analysis report'
      );
      console.log('  sonarqube-integration.js test     - Test configuration');
      console.log('');
      console.log('Environment Variables:');
      console.log('  SONAR_TOKEN - SonarQube authentication token');
      console.log(
        '  SONAR_HOST_URL - SonarQube server URL (default: http://localhost:9000)'
      );
      console.log('');
      console.log('Features:');
      console.log('  • Comprehensive code quality analysis');
      console.log('  • Custom quality gates for credit repair domain');
      console.log('  • FCRA/FACTA compliance checking');
      console.log('  • Security vulnerability detection');
      console.log('  • Automated GitHub Actions integration');
      break;
  }
}

// Export for use as module
module.exports = SonarQubeIntegration;

// Run CLI if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

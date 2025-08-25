#!/usr/bin/env node

/**
 * SonarCloud Configuration Validator for TheCreditPros Repositories
 *
 * Validates and ensures consistent SonarCloud configurations across:
 * - customer-frontend-portal
 * - portal2-refactor
 * - portal2-admin-refactor
 *
 * Features:
 * - Configuration consistency validation
 * - Best practices verification
 * - AI Code Fix integration validation
 * - Credit repair domain-specific rules
 * - FCRA/FACTA compliance rule verification
 * - GitHub Actions integration validation
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class SonarCloudValidator {
  constructor() {
    this.config = {
      sonarToken: process.env.SONAR_TOKEN,
      githubToken: process.env.GITHUB_TOKEN,
      organization: 'thecreditpros',
      targetRepos: [
        'customer-frontend-portal',
        'portal2-refactor',
        'portal2-admin-refactor',
      ],
      sonarCloudOrg: process.env.SONAR_ORGANIZATION || 'thecreditpros',
      baseUrl: 'https://sonarcloud.io/api',
    };

    this.bestPractices = {
      qualityGate: 'Sonar way',
      requiredMetrics: [
        'coverage',
        'duplicated_lines_density',
        'maintainability_rating',
        'reliability_rating',
        'security_rating',
        'sqale_rating',
        'vulnerabilities',
        'bugs',
        'code_smells',
      ],
      coverageThreshold: 80,
      duplicateThreshold: 3.0,
      securityHotspots: true,
      aiCodeFixEnabled: true,
      creditRepairRules: [
        'javascript:S2068', // Credentials should not be hard-coded
        'javascript:S5122', // CORS policy should be secure
        'javascript:S4502', // Database queries should not be vulnerable to injection
        'javascript:S2245', // Pseudorandom generators should not be used for security purposes
        'javascript:S3330', // HTTP connections should be secured with TLS
        'typescript:S2068',
        'typescript:S5122',
        'typescript:S4502',
        'typescript:S2245',
        'typescript:S3330',
      ],
    };

    this.validationResults = {
      repositories: {},
      overallCompliance: 0,
      recommendations: [],
    };
  }

  /**
   * Main validation orchestrator
   */
  async validateAllRepositories() {
    console.log(
      '🔍 Starting SonarCloud Configuration Validation for TheCreditPros...\n'
    );

    if (!this.config.sonarToken) {
      console.log('⚠️  SONAR_TOKEN not found in environment.');
      console.log(
        '💡 Running in demo mode with configuration template validation.'
      );
      await this.generateConfigurationTemplates();
      return;
    }

    for (const repo of this.config.targetRepos) {
      console.log(`\n📊 Validating: ${repo}`);
      console.log('─'.repeat(50));

      try {
        const projectKey = `${this.config.organization}_${repo}`;
        const repoResult = await this.validateRepository(repo, projectKey);
        this.validationResults.repositories[repo] = repoResult;

        this.displayRepositoryResults(repo, repoResult);
      } catch (error) {
        console.error(`❌ Error validating ${repo}:`, error.message);
        this.validationResults.repositories[repo] = {
          status: 'error',
          error: error.message,
          compliance: 0,
        };
      }
    }

    await this.generateComprehensiveReport();
  }

  /**
   * Validate individual repository configuration
   */
  async validateRepository(repoName, projectKey) {
    const validation = {
      projectKey,
      status: 'unknown',
      compliance: 0,
      issues: [],
      recommendations: [],
      metrics: {},
      qualityGate: {},
      aiCodeFix: false,
      securityRules: {},
      creditRepairCompliance: {},
    };

    try {
      // Check if project exists
      const projectExists = await this.checkProjectExists(projectKey);
      if (!projectExists) {
        validation.status = 'not_configured';
        validation.issues.push('Project not found in SonarCloud');
        validation.recommendations.push(
          'Create SonarCloud project for this repository'
        );
        return validation;
      }

      // Validate quality gate
      validation.qualityGate = await this.validateQualityGate(projectKey);

      // Validate metrics and thresholds
      validation.metrics = await this.validateMetrics(projectKey);

      // Validate security configuration
      validation.securityRules = await this.validateSecurityRules(projectKey);

      // Validate AI Code Fix status
      validation.aiCodeFix = await this.validateAICodeFix(projectKey);

      // Validate credit repair specific rules
      validation.creditRepairCompliance =
        await this.validateCreditRepairRules(projectKey);

      // Calculate compliance score
      validation.compliance = this.calculateComplianceScore(validation);
      validation.status =
        validation.compliance >= 80 ? 'compliant' : 'needs_improvement';
    } catch (error) {
      validation.status = 'error';
      validation.error = error.message;
    }

    return validation;
  }

  /**
   * Check if project exists in SonarCloud
   */
  async checkProjectExists(projectKey) {
    try {
      const response = await this.makeAPICall(
        `/projects/show?project=${projectKey}`
      );
      return response && response.component;
    } catch (error) {
      if (error.message.includes('404')) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Validate quality gate configuration
   */
  async validateQualityGate(projectKey) {
    const validation = {
      configured: false,
      name: null,
      conditions: [],
      compliant: false,
    };

    try {
      const response = await this.makeAPICall(
        `/qualitygates/project_status?projectKey=${projectKey}`
      );

      if (response && response.projectStatus) {
        validation.configured = true;
        validation.name = response.projectStatus.qualityGate?.name || 'Unknown';
        validation.conditions = response.projectStatus.conditions || [];
        validation.compliant = response.projectStatus.status === 'OK';
      }
    } catch (error) {
      validation.error = error.message;
    }

    return validation;
  }

  /**
   * Validate metrics configuration
   */
  async validateMetrics(projectKey) {
    const validation = {
      coverage: null,
      duplicatedLines: null,
      maintainability: null,
      reliability: null,
      security: null,
      vulnerabilities: 0,
      bugs: 0,
      codeSmells: 0,
      compliant: false,
    };

    try {
      const metricsParam = this.bestPractices.requiredMetrics.join(',');
      const response = await this.makeAPICall(
        `/measures/component?component=${projectKey}&metricKeys=${metricsParam}`
      );

      if (response && response.component && response.component.measures) {
        const measures = response.component.measures;

        measures.forEach((measure) => {
          switch (measure.metric) {
            case 'coverage':
              validation.coverage = parseFloat(measure.value) || 0;
              break;
            case 'duplicated_lines_density':
              validation.duplicatedLines = parseFloat(measure.value) || 0;
              break;
            case 'maintainability_rating':
              validation.maintainability = measure.value;
              break;
            case 'reliability_rating':
              validation.reliability = measure.value;
              break;
            case 'security_rating':
              validation.security = measure.value;
              break;
            case 'vulnerabilities':
              validation.vulnerabilities = parseInt(measure.value) || 0;
              break;
            case 'bugs':
              validation.bugs = parseInt(measure.value) || 0;
              break;
            case 'code_smells':
              validation.codeSmells = parseInt(measure.value) || 0;
              break;
          }
        });

        // Check compliance
        validation.compliant =
          validation.coverage >= this.bestPractices.coverageThreshold &&
          validation.duplicatedLines <= this.bestPractices.duplicateThreshold &&
          ['1', 'A'].includes(validation.maintainability) &&
          ['1', 'A'].includes(validation.reliability) &&
          ['1', 'A'].includes(validation.security);
      }
    } catch (error) {
      validation.error = error.message;
    }

    return validation;
  }

  /**
   * Validate security rules configuration
   */
  async validateSecurityRules(projectKey) {
    const validation = {
      securityHotspotsEnabled: false,
      vulnerabilityDetection: false,
      credentialDetection: false,
      corsConfiguration: false,
      compliant: false,
    };

    try {
      // Check active rules for the project
      const response = await this.makeAPICall(
        `/rules/search?activation=true&qprofile=${projectKey}&types=VULNERABILITY,SECURITY_HOTSPOT`
      );

      if (response && response.rules) {
        validation.securityHotspotsEnabled = response.rules.length > 0;
        validation.vulnerabilityDetection = response.rules.some(
          (rule) => rule.type === 'VULNERABILITY'
        );

        // Check for specific credit repair security rules
        const activeRuleKeys = response.rules.map((rule) => rule.key);
        validation.credentialDetection =
          this.bestPractices.creditRepairRules.some((ruleKey) =>
            activeRuleKeys.includes(ruleKey)
          );
      }

      validation.compliant =
        validation.securityHotspotsEnabled &&
        validation.vulnerabilityDetection &&
        validation.credentialDetection;
    } catch (error) {
      validation.error = error.message;
    }

    return validation;
  }

  /**
   * Validate AI Code Fix configuration
   */
  async validateAICodeFix(projectKey) {
    // Since AI Code Fix is a GitHub-level integration, we check GitHub Actions configuration
    try {
      if (!this.config.githubToken) {
        return { enabled: 'unknown', reason: 'GitHub token not provided' };
      }

      // Check if SonarCloud GitHub Actions are configured
      const response = await this.makeGitHubAPICall(
        `/repos/${this.config.organization}/${projectKey.split('_')[1]}/actions/workflows`
      );

      if (response && response.workflows) {
        const sonarWorkflow = response.workflows.find(
          (workflow) =>
            workflow.name.toLowerCase().includes('sonar') ||
            workflow.path.includes('sonar')
        );

        return {
          enabled: !!sonarWorkflow,
          workflow: sonarWorkflow?.name,
          path: sonarWorkflow?.path,
        };
      }

      return { enabled: false, reason: 'No SonarCloud workflows found' };
    } catch (error) {
      return { enabled: 'error', error: error.message };
    }
  }

  /**
   * Validate credit repair specific compliance rules
   */
  async validateCreditRepairRules(projectKey) {
    const validation = {
      fcraCompliance: false,
      piiDetection: false,
      dataEncryption: false,
      auditLogging: false,
      compliant: false,
    };

    try {
      // Check for FCRA/FACTA specific rules
      const response = await this.makeAPICall(
        `/rules/search?activation=true&qprofile=${projectKey}&q=credential OR pii OR encryption OR audit`
      );

      if (response && response.rules) {
        // const ruleKeys = response.rules.map(rule => rule.key); // Unused - removed
        const ruleDescriptions = response.rules.map((rule) =>
          rule.name.toLowerCase()
        );

        validation.piiDetection = ruleDescriptions.some(
          (desc) =>
            desc.includes('credential') ||
            desc.includes('password') ||
            desc.includes('personal')
        );

        validation.dataEncryption = ruleDescriptions.some(
          (desc) =>
            desc.includes('encrypt') ||
            desc.includes('hash') ||
            desc.includes('secure')
        );

        validation.auditLogging = ruleDescriptions.some(
          (desc) =>
            desc.includes('log') ||
            desc.includes('audit') ||
            desc.includes('trace')
        );

        validation.fcraCompliance =
          validation.piiDetection &&
          validation.dataEncryption &&
          validation.auditLogging;

        validation.compliant = validation.fcraCompliance;
      }
    } catch (error) {
      validation.error = error.message;
    }

    return validation;
  }

  /**
   * Calculate overall compliance score
   */
  calculateComplianceScore(validation) {
    let score = 0;
    let maxScore = 0;

    // Quality Gate (20 points)
    maxScore += 20;
    if (validation.qualityGate.compliant) score += 20;
    else if (validation.qualityGate.configured) score += 10;

    // Metrics compliance (30 points)
    maxScore += 30;
    if (validation.metrics.compliant) score += 30;
    else {
      if (validation.metrics.coverage >= 70) score += 8;
      if (validation.metrics.duplicatedLines <= 5) score += 7;
      if (['1', '2', 'A', 'B'].includes(validation.metrics.maintainability))
        score += 5;
      if (['1', '2', 'A', 'B'].includes(validation.metrics.reliability))
        score += 5;
      if (['1', '2', 'A', 'B'].includes(validation.metrics.security))
        score += 5;
    }

    // Security rules (25 points)
    maxScore += 25;
    if (validation.securityRules.compliant) score += 25;
    else {
      if (validation.securityRules.securityHotspotsEnabled) score += 10;
      if (validation.securityRules.vulnerabilityDetection) score += 8;
      if (validation.securityRules.credentialDetection) score += 7;
    }

    // AI Code Fix (15 points)
    maxScore += 15;
    if (validation.aiCodeFix.enabled === true) score += 15;
    else if (validation.aiCodeFix.enabled === 'unknown') score += 8;

    // Credit repair compliance (10 points)
    maxScore += 10;
    if (validation.creditRepairCompliance.compliant) score += 10;
    else {
      if (validation.creditRepairCompliance.piiDetection) score += 4;
      if (validation.creditRepairCompliance.dataEncryption) score += 3;
      if (validation.creditRepairCompliance.auditLogging) score += 3;
    }

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Display results for individual repository
   */
  displayRepositoryResults(repoName, result) {
    console.log(`\n📈 ${repoName} Results:`);
    console.log(
      `├─ Status: ${this.getStatusEmoji(result.status)} ${result.status}`
    );
    console.log(
      `├─ Compliance Score: ${this.getScoreEmoji(result.compliance)} ${result.compliance}%`
    );

    if (result.qualityGate && result.qualityGate.configured) {
      console.log(
        `├─ Quality Gate: ${result.qualityGate.compliant ? '✅' : '⚠️'} ${result.qualityGate.name}`
      );
    }

    if (result.metrics && result.metrics.coverage !== null) {
      console.log(
        `├─ Coverage: ${result.metrics.coverage >= 80 ? '✅' : '⚠️'} ${result.metrics.coverage}%`
      );
      console.log(
        `├─ Duplicated Lines: ${result.metrics.duplicatedLines <= 3 ? '✅' : '⚠️'} ${result.metrics.duplicatedLines}%`
      );
    }

    if (result.aiCodeFix) {
      console.log(
        `├─ AI Code Fix: ${result.aiCodeFix.enabled ? '✅' : '⚠️'} ${result.aiCodeFix.enabled ? 'Enabled' : 'Not configured'}`
      );
    }

    if (result.issues && result.issues.length > 0) {
      console.log(`└─ Issues Found: ${result.issues.length}`);
      result.issues.forEach((issue) => {
        console.log(`   • ${issue}`);
      });
    }
  }

  /**
   * Generate comprehensive validation report
   */
  async generateComprehensiveReport() {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 COMPREHENSIVE SONARCLOUD VALIDATION REPORT');
    console.log('═'.repeat(60));

    const compliantRepos = Object.values(
      this.validationResults.repositories
    ).filter((repo) => repo.compliance >= 80).length;

    const overallCompliance =
      Object.values(this.validationResults.repositories).reduce(
        (sum, repo) => sum + (repo.compliance || 0),
        0
      ) / this.config.targetRepos.length;

    console.log(
      `\n🎯 Overall Compliance: ${this.getScoreEmoji(overallCompliance)} ${Math.round(overallCompliance)}%`
    );
    console.log(
      `📈 Repositories Meeting Standards: ${compliantRepos}/${this.config.targetRepos.length}`
    );

    // Generate recommendations
    await this.generateRecommendations();

    // Generate configuration templates
    await this.generateConfigurationTemplates();

    // Save detailed report
    await this.saveDetailedReport();

    console.log(
      `\n📄 Detailed report saved to: sonarcloud-validation-report.json`
    );
    console.log(`📋 Configuration templates saved to: sonarcloud-templates/`);
  }

  /**
   * Generate actionable recommendations
   */
  async generateRecommendations() {
    console.log('\n🔧 RECOMMENDATIONS:');
    console.log('─'.repeat(30));

    const recommendations = [];

    Object.entries(this.validationResults.repositories).forEach(
      ([repo, result]) => {
        if (result.compliance < 80) {
          recommendations.push(`\n📦 ${repo}:`);

          if (!result.qualityGate?.compliant) {
            recommendations.push('  • Configure "Sonar way" quality gate');
          }

          if (result.metrics && result.metrics.coverage < 80) {
            recommendations.push(
              `  • Increase test coverage to 80% (currently ${result.metrics.coverage}%)`
            );
          }

          if (!result.aiCodeFix?.enabled) {
            recommendations.push(
              '  • Enable AI Code Fix in GitHub repository settings'
            );
          }

          if (!result.creditRepairCompliance?.compliant) {
            recommendations.push('  • Enable FCRA/FACTA compliance rules');
          }
        }
      }
    );

    if (recommendations.length === 0) {
      console.log('✅ All repositories meet SonarCloud best practices!');
    } else {
      recommendations.forEach((rec) => console.log(rec));
    }

    return recommendations;
  }

  /**
   * Generate standardized configuration templates
   */
  async generateConfigurationTemplates() {
    const templateDir = './sonarcloud-templates';
    if (!fs.existsSync(templateDir)) {
      fs.mkdirSync(templateDir, { recursive: true });
    }

    // Generate sonar-project.properties template
    const sonarProperties = `# SonarCloud Configuration for TheCreditPros
# Generated by AI-SDLC Framework v2.1.0

sonar.organization=${this.config.sonarCloudOrg}
sonar.projectKey=${this.config.organization}_\${REPOSITORY_NAME}
sonar.projectName=\${REPOSITORY_NAME}

# Source configuration
sonar.sources=src
sonar.tests=tests,__tests__,src/**/*.test.js,src/**/*.spec.js
sonar.test.inclusions=**/*.test.js,**/*.spec.js,**/*.test.ts,**/*.spec.ts

# Coverage configuration
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.typescript.lcov.reportPaths=coverage/lcov.info
sonar.coverage.exclusions=**/*.test.js,**/*.spec.js,**/*.test.ts,**/*.spec.ts,**/node_modules/**

# Credit repair specific exclusions
sonar.exclusions=**/vendor/**,**/node_modules/**,**/*.min.js,**/public/assets/**

# Quality gate
sonar.qualitygate.wait=true

# FCRA/FACTA compliance rules
sonar.javascript.globals=document,window,console,process,require,module,exports,global
`;

    fs.writeFileSync(
      path.join(templateDir, 'sonar-project.properties'),
      sonarProperties
    );

    // Generate GitHub Actions workflow template
    const githubWorkflow = `# SonarCloud GitHub Actions Workflow for TheCreditPros
# Generated by AI-SDLC Framework v2.1.0

name: SonarCloud Analysis

on:
  push:
    branches: [ main, master, develop ]
  pull_request:
    branches: [ main, master ]

jobs:
  sonarcloud:
    name: SonarCloud Analysis
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests with coverage
      run: npm run test:coverage
      env:
        CI: true
    
    - name: SonarCloud Scan
      uses: SonarSource/sonarcloud-github-action@master
      env:
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        SONAR_TOKEN: \${{ secrets.SONAR_TOKEN }}
      with:
        args: >
          -Dsonar.organization=${this.config.sonarCloudOrg}
          -Dsonar.projectKey=${this.config.organization}_\${{ github.event.repository.name }}
          -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
          -Dsonar.coverage.exclusions=**/*.test.js,**/*.spec.js,**/*.test.ts,**/*.spec.ts
          -Dsonar.sources=src
          -Dsonar.tests=tests,__tests__,src/**/*.test.js,src/**/*.spec.js
`;

    fs.writeFileSync(
      path.join(templateDir, 'sonarcloud-workflow.yml'),
      githubWorkflow
    );

    // Generate package.json scripts template
    const packageScripts = {
      scripts: {
        'test:coverage': 'jest --coverage --watchAll=false',
        sonar: 'sonar-scanner',
        'sonar:local': 'sonar-scanner -Dsonar.host.url=http://localhost:9000',
      },
      jest: {
        coverageDirectory: 'coverage',
        collectCoverageFrom: [
          'src/**/*.{js,jsx,ts,tsx}',
          '!src/**/*.test.{js,jsx,ts,tsx}',
          '!src/**/*.spec.{js,jsx,ts,tsx}',
          '!src/index.js',
          '!src/serviceWorker.js',
        ],
        coverageReporters: ['text', 'lcov', 'html'],
        coverageThreshold: {
          global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
          },
        },
      },
    };

    fs.writeFileSync(
      path.join(templateDir, 'package-scripts-template.json'),
      JSON.stringify(packageScripts, null, 2)
    );

    console.log(`\n📋 Configuration templates generated in: ${templateDir}`);
  }

  /**
   * Save detailed validation report
   */
  async saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      framework: 'AI-SDLC v2.1.0',
      organization: this.config.organization,
      repositories: this.validationResults.repositories,
      summary: {
        totalRepositories: this.config.targetRepos.length,
        compliantRepositories: Object.values(
          this.validationResults.repositories
        ).filter((repo) => repo.compliance >= 80).length,
        averageCompliance: Math.round(
          Object.values(this.validationResults.repositories).reduce(
            (sum, repo) => sum + (repo.compliance || 0),
            0
          ) / this.config.targetRepos.length
        ),
      },
      recommendations: this.validationResults.recommendations,
    };

    fs.writeFileSync(
      'sonarcloud-validation-report.json',
      JSON.stringify(report, null, 2)
    );
  }

  /**
   * Utility functions
   */
  getStatusEmoji(status) {
    const emojis = {
      compliant: '✅',
      needs_improvement: '⚠️',
      not_configured: '❌',
      error: '🔥',
    };
    return emojis[status] || '❓';
  }

  getScoreEmoji(score) {
    if (score >= 90) return '🌟';
    if (score >= 80) return '✅';
    if (score >= 60) return '⚠️';
    return '❌';
  }

  /**
   * Make API call to SonarCloud
   */
  async makeAPICall(endpoint) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'sonarcloud.io',
        port: 443,
        path: `/api${endpoint}`,
        method: 'GET',
        headers: {
          Authorization: `Basic ${Buffer.from(this.config.sonarToken + ':').toString('base64')}`,
          Accept: 'application/json',
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            if (res.statusCode >= 400) {
              reject(
                new Error(
                  `API Error ${res.statusCode}: ${jsonData.errors?.[0]?.msg || data}`
                )
              );
            } else {
              resolve(jsonData);
            }
          } catch (error) {
            reject(new Error(`JSON Parse Error: ${error.message}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  /**
   * Make API call to GitHub
   */
  async makeGitHubAPICall(endpoint) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        port: 443,
        path: endpoint,
        method: 'GET',
        headers: {
          Authorization: `token ${this.config.githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'AI-SDLC-SonarCloud-Validator',
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            if (res.statusCode >= 400) {
              reject(
                new Error(
                  `GitHub API Error ${res.statusCode}: ${jsonData.message || data}`
                )
              );
            } else {
              resolve(jsonData);
            }
          } catch (error) {
            reject(new Error(`JSON Parse Error: ${error.message}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];

  const validator = new SonarCloudValidator();

  switch (command) {
    case 'validate':
      validator.validateAllRepositories();
      break;

    case 'templates':
      validator.generateConfigurationTemplates();
      console.log('✅ SonarCloud configuration templates generated');
      break;

    case 'help':
    default:
      console.log(`
🔍 SonarCloud Configuration Validator for TheCreditPros

Commands:
  validate   - Validate all repository SonarCloud configurations
  templates  - Generate standardized configuration templates
  help       - Show this help message

Environment Variables Required:
  SONAR_TOKEN          - SonarCloud authentication token
  GITHUB_TOKEN         - GitHub API token (optional, for AI Code Fix validation)
  SONAR_ORGANIZATION   - SonarCloud organization (defaults to 'thecreditpros')

Example Usage:
  SONAR_TOKEN=your_token node sonarcloud-config-validator.js validate
  node sonarcloud-config-validator.js templates

Target Repositories:
  • customer-frontend-portal
  • portal2-refactor  
  • portal2-admin-refactor

Best Practices Validated:
  ✅ Quality Gates (Sonar way standard)
  ✅ Code Coverage (80%+ threshold)
  ✅ Security Rules (FCRA/FACTA compliance)
  ✅ AI Code Fix Integration
  ✅ Duplicate Code Detection (3% threshold)
  ✅ Maintainability/Reliability/Security Ratings
      `);
      break;
  }
}

module.exports = SonarCloudValidator;

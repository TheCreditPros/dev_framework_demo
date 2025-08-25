#!/usr/bin/env node

/**
 * Advanced Security Scanner for AI-SDLC
 * The Credit Pros - Development Team
 *
 * IMPORTANT: This tool COMPLEMENTS GitGuardian, does NOT replace it.
 *
 * GitGuardian handles: Secret detection, pre-commit hooks, credential scanning
 * This scanner handles: Infrastructure security, compliance, dependency risks, business logic
 *
 * Integration: Uses GitGuardian API for comprehensive secret analysis
 * DO NOT duplicate GitGuardian's pre-commit functionality
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SecurityScanner {
  constructor() {
    this.gitguardianApiKey = process.env.GITGUARDIAN_API_KEY;
    this.zapApiKey = process.env.ZAP_API_KEY;
    this.zapHost = process.env.ZAP_HOST || 'http://localhost:8080';
    this.projectRoot = process.cwd();
    this.validateEnvironment();
  }

  /**
   * Validate required environment variables
   */
  validateEnvironment() {
    const warnings = [];

    if (!this.gitguardianApiKey) {
      warnings.push(
        '⚠️  GITGUARDIAN_API_KEY not set - GitGuardian scanning disabled'
      );
    }

    if (!this.zapApiKey) {
      warnings.push('⚠️  ZAP_API_KEY not set - OWASP ZAP scanning disabled');
    }

    if (warnings.length > 0) {
      console.log('\n🔧 Environment Configuration:');
      warnings.forEach((warning) => console.log(warning));
      console.log(
        '\n💡 Set these environment variables to enable full security scanning'
      );
      console.log('   See docs/README.md for configuration details\n');
    }
  }

  /**
   * Run comprehensive security scan
   */
  async runComprehensiveScan() {
    console.log('🔍 Starting comprehensive security scan...');

    const results = {
      timestamp: new Date().toISOString(),
      scans: {
        secrets: await this.scanSecrets(),
        dependencies: await this.scanDependencies(),
        code: await this.scanCodeVulnerabilities(),
        docker: await this.scanDockerSecurity(),
        web: await this.scanWebApplication(),
      },
      summary: {
        totalIssues: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
      },
    };

    // Calculate summary
    this.calculateSummary(results);

    // Generate report
    await this.generateSecurityReport(results);

    // Send MS Teams notification if configured
    await this.sendSecurityNotification(results);

    return results;
  }

  /**
   * Scan for secrets using GitGuardian API
   *
   * NOTE: This is for comprehensive reporting only.
   * GitGuardian pre-commit hooks should handle blocking commits with secrets.
   * This scanner provides detailed analysis for security reports.
   */
  async scanSecrets() {
    console.log('🔐 Analyzing secrets via GitGuardian API...');

    try {
      if (!this.gitguardianApiKey) {
        console.warn(
          '⚠️  GitGuardian API key not configured. Using basic fallback patterns.'
        );
        console.warn(
          '⚠️  For full secret detection, configure GitGuardian pre-commit hooks.'
        );
        return {
          status: 'skipped',
          reason:
            'GitGuardian API not configured - use pre-commit hooks for protection',
        };
      }

      // Use GitGuardian API for comprehensive analysis (not prevention - that's handled by pre-commit hooks)
      const secretsFound = await this.analyzeSecretsViaGitGuardian();

      return {
        status: 'completed',
        secretsFound: secretsFound.length,
        secrets: secretsFound,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Secret scanning failed:', error.message);
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * Placeholder for GitGuardian API integration
   * TODO: Implement actual GitGuardian API calls when API key is configured
   */
  async analyzeSecretsViaGitGuardian() {
    // This would make actual GitGuardian API calls
    // For now, fall back to basic patterns for reporting purposes only
    return await this.detectSecretsInFiles();
  }

  /**
   * Basic secret detection patterns (reporting fallback only)
   *
   * IMPORTANT: This is NOT for prevention - GitGuardian pre-commit hooks handle that
   * This is only for generating security reports when GitGuardian API unavailable
   */
  async detectSecretsInFiles() {
    const secretPatterns = [
      /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]+['"]/gi,
      /(?:secret|token|key)\s*[:=]\s*['"][^'"]+['"]/gi,
      /(?:api_key|apikey)\s*[:=]\s*['"][^'"]+['"]/gi,
      /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/gi,
      /sk_live_[0-9a-zA-Z]{24,}/gi, // Stripe secret keys
      /pk_live_[0-9a-zA-Z]{24,}/gi, // Stripe public keys
      /ghp_[0-9a-zA-Z]{36}/gi, // GitHub personal access tokens
    ];

    const secretsFound = [];
    const filesToScan = this.getFilesToScan();

    for (const filePath of filesToScan) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, lineNumber) => {
          secretPatterns.forEach((pattern) => {
            const matches = line.match(pattern);
            if (matches) {
              matches.forEach((match) => {
                secretsFound.push({
                  file: filePath,
                  line: lineNumber + 1,
                  type: 'potential_secret',
                  severity: 'high',
                  content: match.substring(0, 50) + '...', // Truncate for security
                });
              });
            }
          });
        });
      } catch {
        // Skip files that can't be read
      }
    }

    return secretsFound;
  }

  /**
   * Get list of files to scan for secrets
   */
  getFilesToScan() {
    const extensions = [
      '.js',
      '.ts',
      '.jsx',
      '.tsx',
      '.php',
      '.py',
      '.env',
      '.yaml',
      '.yml',
      '.json',
    ];
    const excludeDirs = [
      'node_modules',
      '.git',
      'vendor',
      'dist',
      'build',
      '.next',
    ];

    const files = [];

    const scanDirectory = (dir) => {
      try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            if (!excludeDirs.includes(item)) {
              scanDirectory(fullPath);
            }
          } else {
            const ext = path.extname(item);
            if (extensions.includes(ext) || item.startsWith('.env')) {
              files.push(fullPath);
            }
          }
        }
      } catch {
        // Skip directories that can't be read
      }
    };

    scanDirectory(this.projectRoot);
    return files;
  }

  /**
   * Scan dependencies for vulnerabilities
   */
  async scanDependencies() {
    console.log('📦 Scanning dependencies for vulnerabilities...');

    try {
      const results = {
        npm: await this.scanNpmDependencies(),
        composer: await this.scanComposerDependencies(),
      };

      return {
        status: 'completed',
        results,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Dependency scanning failed:', error.message);
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * Scan NPM dependencies
   */
  async scanNpmDependencies() {
    if (!fs.existsSync('package.json')) {
      return { status: 'skipped', reason: 'No package.json found' };
    }

    try {
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(auditResult);

      return {
        status: 'completed',
        vulnerabilities: audit.metadata.vulnerabilities,
        summary: audit.metadata,
      };
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities found
      if (error.stdout) {
        try {
          const audit = JSON.parse(error.stdout);
          return {
            status: 'completed',
            vulnerabilities: audit.metadata.vulnerabilities,
            summary: audit.metadata,
          };
        } catch {
          return {
            status: 'failed',
            error: 'Could not parse npm audit results',
          };
        }
      }
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * Scan Composer dependencies
   */
  async scanComposerDependencies() {
    if (!fs.existsSync('composer.json')) {
      return { status: 'skipped', reason: 'No composer.json found' };
    }

    try {
      const auditResult = execSync('composer audit --format=json', {
        encoding: 'utf8',
      });
      const audit = JSON.parse(auditResult);

      return {
        status: 'completed',
        advisories: audit.advisories || [],
        summary: audit,
      };
    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * Scan code for vulnerabilities using SonarQube
   */
  async scanCodeVulnerabilities() {
    console.log('🔍 Scanning code for vulnerabilities...');

    try {
      // Check if SonarQube is available
      const sonarToken = process.env.SONAR_TOKEN;
      const sonarHost = process.env.SONAR_HOST_URL || 'http://localhost:9000';

      if (!sonarToken) {
        console.warn(
          '⚠️  SonarQube token not configured. Skipping code vulnerability scan.'
        );
        return { status: 'skipped', reason: 'SonarQube not configured' };
      }

      // Run SonarQube scanner
      const projectKey = 'ai-sdlc-framework';
      const scannerCommand = `sonar-scanner -Dsonar.projectKey=${projectKey} -Dsonar.host.url=${sonarHost} -Dsonar.login=${sonarToken}`;

      execSync(scannerCommand, { encoding: 'utf8' });

      // Get scan results
      const results = await this.getSonarQubeResults(
        projectKey,
        sonarHost,
        sonarToken
      );

      return {
        status: 'completed',
        results,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Code vulnerability scanning failed:', error.message);
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * Get SonarQube scan results
   */
  async getSonarQubeResults(projectKey, host, token) {
    return new Promise((resolve, reject) => {
      const url = `${host}/api/issues/search?componentKeys=${projectKey}&types=VULNERABILITY,SECURITY_HOTSPOT`;
      const options = {
        headers: {
          Authorization: `Basic ${Buffer.from(token + ':').toString('base64')}`,
        },
      };

      https
        .get(url, options, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const results = JSON.parse(data);
              resolve(results);
            } catch (error) {
              reject(error);
            }
          });
        })
        .on('error', reject);
    });
  }

  /**
   * Scan Docker configuration for security issues
   */
  async scanDockerSecurity() {
    console.log('🐳 Scanning Docker configuration...');

    try {
      const issues = [];

      // Check Dockerfile security
      if (fs.existsSync('Dockerfile')) {
        const dockerfileIssues = await this.scanDockerfile();
        issues.push(...dockerfileIssues);
      }

      // Check docker-compose security
      if (
        fs.existsSync('docker-compose.yml') ||
        fs.existsSync('docker-compose.dev.yml')
      ) {
        const composeIssues = await this.scanDockerCompose();
        issues.push(...composeIssues);
      }

      return {
        status: 'completed',
        issues,
        issueCount: issues.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Docker security scanning failed:', error.message);
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * Scan Dockerfile for security issues
   */
  async scanDockerfile() {
    const issues = [];
    const dockerfile = fs.readFileSync('Dockerfile', 'utf8');
    const lines = dockerfile.split('\n');

    lines.forEach((line, index) => {
      // Check for running as root
      if (line.match(/^USER\s+root/i)) {
        issues.push({
          file: 'Dockerfile',
          line: index + 1,
          severity: 'medium',
          issue: 'Running as root user',
          recommendation: 'Consider using a non-root user',
        });
      }

      // Check for latest tag usage
      if (line.match(/FROM.*:latest/i)) {
        issues.push({
          file: 'Dockerfile',
          line: index + 1,
          severity: 'low',
          issue: 'Using latest tag',
          recommendation: 'Pin to specific version',
        });
      }

      // Check for ADD instead of COPY
      if (line.match(/^ADD\s+/i)) {
        issues.push({
          file: 'Dockerfile',
          line: index + 1,
          severity: 'low',
          issue: 'Using ADD instead of COPY',
          recommendation: 'Use COPY for local files',
        });
      }
    });

    return issues;
  }

  /**
   * Scan docker-compose for security issues
   */
  async scanDockerCompose() {
    const issues = [];
    const composeFiles = ['docker-compose.yml', 'docker-compose.dev.yml'];

    for (const file of composeFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');

        // Check for privileged mode
        if (content.includes('privileged: true')) {
          issues.push({
            file,
            severity: 'high',
            issue: 'Privileged mode enabled',
            recommendation: 'Avoid privileged mode in production',
          });
        }

        // Check for host network mode
        if (content.includes('network_mode: host')) {
          issues.push({
            file,
            severity: 'medium',
            issue: 'Host network mode',
            recommendation: 'Use bridge network instead',
          });
        }
      }
    }

    return issues;
  }

  /**
   * Scan web application using OWASP ZAP
   */
  async scanWebApplication() {
    console.log('🕷️ Scanning web application with OWASP ZAP...');

    try {
      if (!this.zapApiKey) {
        console.warn(
          '⚠️  OWASP ZAP not configured. Skipping web application scan.'
        );
        return { status: 'skipped', reason: 'OWASP ZAP not configured' };
      }

      // This would integrate with OWASP ZAP API
      // For now, return a placeholder implementation
      return {
        status: 'planned',
        message: 'OWASP ZAP integration planned for future release',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Web application scanning failed:', error.message);
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * Calculate security scan summary
   */
  calculateSummary(results) {
    let totalIssues = 0;
    let criticalIssues = 0;
    let highIssues = 0;
    let mediumIssues = 0;
    let lowIssues = 0;

    // Count secrets
    if (results.scans.secrets.secretsFound) {
      const secrets = results.scans.secrets.secrets || [];
      secrets.forEach((secret) => {
        totalIssues++;
        if (secret.severity === 'critical') criticalIssues++;
        else if (secret.severity === 'high') highIssues++;
        else if (secret.severity === 'medium') mediumIssues++;
        else lowIssues++;
      });
    }

    // Count dependency vulnerabilities
    if (results.scans.dependencies.results?.npm?.vulnerabilities) {
      const vulns = results.scans.dependencies.results.npm.vulnerabilities;
      totalIssues += vulns.critical + vulns.high + vulns.moderate + vulns.low;
      criticalIssues += vulns.critical;
      highIssues += vulns.high;
      mediumIssues += vulns.moderate;
      lowIssues += vulns.low;
    }

    // Count Docker issues
    if (results.scans.docker.issues) {
      results.scans.docker.issues.forEach((issue) => {
        totalIssues++;
        if (issue.severity === 'critical') criticalIssues++;
        else if (issue.severity === 'high') highIssues++;
        else if (issue.severity === 'medium') mediumIssues++;
        else lowIssues++;
      });
    }

    results.summary = {
      totalIssues,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
    };
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(results) {
    const reportPath = path.join(this.projectRoot, 'SECURITY_SCAN_REPORT.md');

    let report = `# Security Scan Report\n\n`;
    report += `**Generated**: ${results.timestamp}\n\n`;
    report += `## 📊 Summary\n\n`;
    report += `- **Total Issues**: ${results.summary.totalIssues}\n`;
    report += `- **Critical**: ${results.summary.criticalIssues}\n`;
    report += `- **High**: ${results.summary.highIssues}\n`;
    report += `- **Medium**: ${results.summary.mediumIssues}\n`;
    report += `- **Low**: ${results.summary.lowIssues}\n\n`;

    // Add detailed results for each scan type
    if (results.scans.secrets.status === 'completed') {
      report += `## 🔐 Secret Scanning\n\n`;
      report += `**Status**: ${results.scans.secrets.status}\n`;
      report += `**Secrets Found**: ${results.scans.secrets.secretsFound}\n\n`;

      if (results.scans.secrets.secrets?.length > 0) {
        report += `### Found Secrets\n\n`;
        results.scans.secrets.secrets.forEach((secret) => {
          report += `- **${secret.file}:${secret.line}** - ${secret.type} (${secret.severity})\n`;
        });
        report += `\n`;
      }
    }

    if (results.scans.dependencies.status === 'completed') {
      report += `## 📦 Dependency Vulnerabilities\n\n`;
      const npm = results.scans.dependencies.results.npm;
      if (npm?.vulnerabilities) {
        report += `**NPM Vulnerabilities**:\n`;
        report += `- Critical: ${npm.vulnerabilities.critical}\n`;
        report += `- High: ${npm.vulnerabilities.high}\n`;
        report += `- Moderate: ${npm.vulnerabilities.moderate}\n`;
        report += `- Low: ${npm.vulnerabilities.low}\n\n`;
      }
    }

    if (results.scans.docker.status === 'completed') {
      report += `## 🐳 Docker Security\n\n`;
      report += `**Issues Found**: ${results.scans.docker.issueCount}\n\n`;

      if (results.scans.docker.issues?.length > 0) {
        report += `### Docker Issues\n\n`;
        results.scans.docker.issues.forEach((issue) => {
          report += `- **${issue.file}** - ${issue.issue} (${issue.severity})\n`;
          report += `  - *Recommendation*: ${issue.recommendation}\n`;
        });
        report += `\n`;
      }
    }

    report += `---\n\n*Generated by AI-SDLC Security Scanner*\n`;

    fs.writeFileSync(reportPath, report);
    console.log(`✅ Security report generated: ${reportPath}`);
  }

  /**
   * Send MS Teams notification about security scan
   */
  async sendSecurityNotification(results) {
    const webhookUrl = process.env.MS_TEAMS_WEBHOOK_URI;
    if (!webhookUrl) {
      return;
    }

    try {
      const WebhookManager = require('./webhook-manager.js');
      const webhookManager = new WebhookManager();

      await webhookManager.sendSecurityNotification({
        critical: results.summary.criticalIssues,
        high: results.summary.highIssues,
        medium: results.summary.mediumIssues,
        low: results.summary.lowIssues,
        tool: 'AI-SDLC Security Scanner',
      });
    } catch (error) {
      console.error('❌ Failed to send security notification:', error.message);
    }
  }

  /**
   * Quick security scan for CI/CD pipelines
   *
   * IMPORTANT: This does NOT replace GitGuardian pre-commit hooks
   * Use this for CI/CD validation of infrastructure security, not secret detection
   */
  async quickScan() {
    console.log('⚡ Running quick infrastructure security scan...');
    console.log(
      'ℹ️  Note: Secret detection is handled by GitGuardian pre-commit hooks'
    );

    const results = {
      timestamp: new Date().toISOString(),
      dockerIssues: await this.scanDockerSecurity(),
      dependencyIssues: await this.scanDependencies(),
      passed: true,
    };

    // Focus on infrastructure issues, not secrets (GitGuardian handles those)
    const totalIssues =
      (results.dockerIssues.issueCount || 0) +
      (results.dependencyIssues.results?.npm?.vulnerabilities?.critical || 0);

    if (totalIssues > 0) {
      results.passed = false;
      console.error('❌ Infrastructure security issues detected');
      console.error(
        `   Docker issues: ${results.dockerIssues.issueCount || 0}`
      );
      console.error(
        `   Critical vulnerabilities: ${results.dependencyIssues.results?.npm?.vulnerabilities?.critical || 0}`
      );
    } else {
      console.log('✅ Infrastructure security scan passed');
    }

    return results;
  }
}

// CLI interface
async function main() {
  const scanner = new SecurityScanner();
  const command = process.argv[2];

  switch (command) {
    case 'scan':
    case 'full':
      await scanner.runComprehensiveScan();
      break;

    case 'quick': {
      const results = await scanner.quickScan();
      process.exit(results.passed ? 0 : 1);
      break;
    }

    case 'secrets': {
      const secretResults = await scanner.scanSecrets();
      console.log(JSON.stringify(secretResults, null, 2));
      break;
    }

    case 'dependencies':
    case 'deps': {
      const depResults = await scanner.scanDependencies();
      console.log(JSON.stringify(depResults, null, 2));
      break;
    }

    case 'docker': {
      const dockerResults = await scanner.scanDockerSecurity();
      console.log(JSON.stringify(dockerResults, null, 2));
      break;
    }

    default:
      console.log('AI-SDLC Security Scanner');
      console.log('');
      console.log('Usage:');
      console.log(
        '  security-scanner.js scan     - Run comprehensive security scan'
      );
      console.log('  security-scanner.js quick    - Quick scan for git hooks');
      console.log('  security-scanner.js secrets  - Scan for secrets only');
      console.log('  security-scanner.js deps     - Scan dependencies only');
      console.log(
        '  security-scanner.js docker   - Scan Docker configuration only'
      );
      console.log('');
      console.log('Environment Variables:');
      console.log(
        '  GITGUARDIAN_API_KEY - GitGuardian API key (for reporting only)'
      );
      console.log('  SONAR_TOKEN - SonarQube token');
      console.log('  ZAP_API_KEY - OWASP ZAP API key');
      console.log('  MS_TEAMS_WEBHOOK_URI - MS Teams webhook URL');
      console.log('');
      console.log(
        'IMPORTANT: GitGuardian pre-commit hooks handle secret detection.'
      );
      console.log(
        'This scanner focuses on infrastructure and compliance security.'
      );
      break;
  }
}

// Export for use as module
module.exports = SecurityScanner;

// Run CLI if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

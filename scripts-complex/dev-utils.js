#!/usr/bin/env node

/**
 * Development Utilities for AI-SDLC
 * The Credit Pros - Development Team
 *
 * Collection of helpful development utilities
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DevUtils {
  constructor() {
    this.projectRoot = process.cwd();
  }

  /**
   * Generate development environment report
   */
  generateDevReport() {
    console.log('🔍 Generating development environment report...');

    const report = {
      timestamp: new Date().toISOString(),
      environment: this.getEnvironmentInfo(),
      project: this.getProjectInfo(),
      tools: this.getToolsInfo(),
      performance: this.getPerformanceInfo(),
      recommendations: this.getRecommendations(),
    };

    const reportPath = path.join(this.projectRoot, 'DEVELOPMENT_REPORT.md');
    const markdownReport = this.formatReportAsMarkdown(report);

    fs.writeFileSync(reportPath, markdownReport);
    console.log(`✅ Development report generated: ${reportPath}`);

    return report;
  }

  /**
   * Get environment information
   */
  getEnvironmentInfo() {
    const info = {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      uptime: `${Math.round(process.uptime())}s`,
    };

    // Check for additional tools
    const tools = ['npm', 'git', 'docker', 'php', 'composer'];
    tools.forEach((tool) => {
      try {
        const version = execSync(`${tool} --version`, {
          encoding: 'utf8',
          stdio: 'pipe',
        });
        info[tool] = version.split('\n')[0].trim();
      } catch {
        info[tool] = 'Not installed';
      }
    });

    return info;
  }

  /**
   * Get project information
   */
  getProjectInfo() {
    const info = {
      hasPackageJson: fs.existsSync('package.json'),
      hasComposerJson: fs.existsSync('composer.json'),
      hasArtisan: fs.existsSync('artisan'),
      hasDockerfile:
        fs.existsSync('Dockerfile') || fs.existsSync('docker-compose.yml'),
      hasGit: fs.existsSync('.git'),
      hasAISDLC: fs.existsSync('./ai-sdlc'),
    };

    // Get package.json info if available
    if (info.hasPackageJson) {
      try {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        info.packageName = pkg.name;
        info.packageVersion = pkg.version;
        info.dependencies = Object.keys(pkg.dependencies || {}).length;
        info.devDependencies = Object.keys(pkg.devDependencies || {}).length;
        info.scripts = Object.keys(pkg.scripts || {});
      } catch (error) {
        info.packageJsonError = error.message;
      }
    }

    // Get composer.json info if available
    if (info.hasComposerJson) {
      try {
        const composer = JSON.parse(fs.readFileSync('composer.json', 'utf8'));
        info.composerName = composer.name;
        info.composerVersion = composer.version || 'dev';
        info.phpDependencies = Object.keys(composer.require || {}).length;
        info.phpDevDependencies = Object.keys(
          composer['require-dev'] || {}
        ).length;
      } catch (error) {
        info.composerJsonError = error.message;
      }
    }

    return info;
  }

  /**
   * Get development tools information
   */
  getToolsInfo() {
    const tools = {
      vscode: {
        configured: fs.existsSync('.vscode'),
        hasSettings: fs.existsSync('.vscode/settings.json'),
        hasExtensions: fs.existsSync('.vscode/extensions.json'),
        hasLaunch: fs.existsSync('.vscode/launch.json'),
        hasTasks: fs.existsSync('.vscode/tasks.json'),
      },
      git: {
        configured: fs.existsSync('.git'),
        hasHooks: fs.existsSync('.husky'),
        hasIgnore: fs.existsSync('.gitignore'),
      },
      testing: {
        hasVitest: fs.existsSync('vitest.config.js'),
        hasPlaywright: fs.existsSync('playwright.config.js'),
        hasJest: fs.existsSync('jest.config.js'),
        hasPHPUnit: fs.existsSync('phpunit.xml'),
      },
      quality: {
        hasESLint:
          fs.existsSync('eslint.config.js') || fs.existsSync('.eslintrc.js'),
        hasPrettier: fs.existsSync('.prettierrc'),
        hasCommitlint: fs.existsSync('commitlint.config.js'),
      },
      docker: {
        hasDockerfile: fs.existsSync('Dockerfile'),
        hasCompose:
          fs.existsSync('docker-compose.yml') ||
          fs.existsSync('docker-compose.dev.yml'),
        hasDockerIgnore: fs.existsSync('.dockerignore'),
      },
    };

    return tools;
  }

  /**
   * Get performance information
   */
  getPerformanceInfo() {
    const perfInfo = {
      timestamp: new Date().toISOString(),
    };

    // Check for performance metrics file
    if (fs.existsSync('performance-metrics.json')) {
      try {
        const metrics = JSON.parse(
          fs.readFileSync('performance-metrics.json', 'utf8')
        );
        perfInfo.lastMetrics = metrics.timestamp;
        perfInfo.avgDuration = metrics.summary?.avgDuration;
        perfInfo.totalOperations = metrics.summary?.totalOperations;
      } catch (error) {
        perfInfo.metricsError = error.message;
      }
    }

    return perfInfo;
  }

  /**
   * Get recommendations based on current setup
   */
  getRecommendations() {
    const recommendations = [];
    const projectInfo = this.getProjectInfo();
    const toolsInfo = this.getToolsInfo();

    // Package.json recommendations
    if (!projectInfo.hasPackageJson) {
      recommendations.push({
        category: 'Setup',
        priority: 'high',
        message: 'Initialize package.json with npm init',
      });
    }

    // Git recommendations
    if (!toolsInfo.git.configured) {
      recommendations.push({
        category: 'Version Control',
        priority: 'high',
        message: 'Initialize Git repository with git init',
      });
    }

    if (!toolsInfo.git.hasHooks && toolsInfo.git.configured) {
      recommendations.push({
        category: 'Quality',
        priority: 'medium',
        message: 'Set up Git hooks with Husky for automated quality checks',
      });
    }

    // Testing recommendations
    if (!toolsInfo.testing.hasVitest && !toolsInfo.testing.hasJest) {
      recommendations.push({
        category: 'Testing',
        priority: 'medium',
        message: 'Set up testing framework (Vitest recommended)',
      });
    }

    if (!toolsInfo.testing.hasPlaywright) {
      recommendations.push({
        category: 'Testing',
        priority: 'low',
        message: 'Consider adding E2E testing with Playwright',
      });
    }

    // Quality recommendations
    if (!toolsInfo.quality.hasESLint) {
      recommendations.push({
        category: 'Quality',
        priority: 'medium',
        message: 'Set up ESLint for code quality',
      });
    }

    if (!toolsInfo.quality.hasPrettier) {
      recommendations.push({
        category: 'Quality',
        priority: 'low',
        message: 'Set up Prettier for code formatting',
      });
    }

    // VS Code recommendations
    if (!toolsInfo.vscode.configured) {
      recommendations.push({
        category: 'IDE',
        priority: 'low',
        message: 'Configure VS Code workspace settings',
      });
    }

    // Docker recommendations
    if (projectInfo.hasArtisan && !toolsInfo.docker.hasCompose) {
      recommendations.push({
        category: 'DevOps',
        priority: 'low',
        message: 'Consider Docker Compose for Laravel development environment',
      });
    }

    return recommendations;
  }

  /**
   * Format report as Markdown
   */
  formatReportAsMarkdown(report) {
    let markdown = `# Development Environment Report

**Generated:** ${report.timestamp}

## 🖥️ Environment Information

| Tool | Version |
|------|---------|
`;

    Object.entries(report.environment).forEach(([tool, version]) => {
      markdown += `| ${tool} | ${version} |\n`;
    });

    markdown += `
## 📦 Project Information

- **Package.json:** ${report.project.hasPackageJson ? '✅' : '❌'}
- **Composer.json:** ${report.project.hasComposerJson ? '✅' : '❌'}
- **Laravel Artisan:** ${report.project.hasArtisan ? '✅' : '❌'}
- **Docker:** ${report.project.hasDockerfile ? '✅' : '❌'}
- **Git Repository:** ${report.project.hasGit ? '✅' : '❌'}
- **AI-SDLC:** ${report.project.hasAISDLC ? '✅' : '❌'}
`;

    if (report.project.packageName) {
      markdown += `
### NPM Package Details
- **Name:** ${report.project.packageName}
- **Version:** ${report.project.packageVersion}
- **Dependencies:** ${report.project.dependencies}
- **Dev Dependencies:** ${report.project.devDependencies}
- **Scripts:** ${report.project.scripts.join(', ')}
`;
    }

    markdown += `
## 🔧 Development Tools

### VS Code
- **Configured:** ${report.tools.vscode.configured ? '✅' : '❌'}
- **Settings:** ${report.tools.vscode.hasSettings ? '✅' : '❌'}
- **Extensions:** ${report.tools.vscode.hasExtensions ? '✅' : '❌'}
- **Launch Config:** ${report.tools.vscode.hasLaunch ? '✅' : '❌'}
- **Tasks:** ${report.tools.vscode.hasTasks ? '✅' : '❌'}

### Testing
- **Vitest:** ${report.tools.testing.hasVitest ? '✅' : '❌'}
- **Playwright:** ${report.tools.testing.hasPlaywright ? '✅' : '❌'}
- **Jest:** ${report.tools.testing.hasJest ? '✅' : '❌'}
- **PHPUnit:** ${report.tools.testing.hasPHPUnit ? '✅' : '❌'}

### Quality Tools
- **ESLint:** ${report.tools.quality.hasESLint ? '✅' : '❌'}
- **Prettier:** ${report.tools.quality.hasPrettier ? '✅' : '❌'}
- **Commitlint:** ${report.tools.quality.hasCommitlint ? '✅' : '❌'}

### Docker
- **Dockerfile:** ${report.tools.docker.hasDockerfile ? '✅' : '❌'}
- **Compose:** ${report.tools.docker.hasCompose ? '✅' : '❌'}
- **Dockerignore:** ${report.tools.docker.hasDockerIgnore ? '✅' : '❌'}

## 🚀 Recommendations

`;

    report.recommendations.forEach((rec) => {
      const priority =
        rec.priority === 'high'
          ? '🔴'
          : rec.priority === 'medium'
            ? '🟡'
            : '🟢';
      markdown += `### ${priority} ${rec.category}
${rec.message}

`;
    });

    markdown += `
## 📊 Performance Information

`;
    if (report.performance.lastMetrics) {
      markdown += `- **Last Metrics:** ${report.performance.lastMetrics}
- **Average Duration:** ${report.performance.avgDuration}ms
- **Total Operations:** ${report.performance.totalOperations}
`;
    } else {
      markdown += `- **Performance Metrics:** Not available (run \`./ai-sdlc perf monitor\`)
`;
    }

    markdown += `
## 🛠️ Quick Actions

1. **Setup AI-SDLC:** \`./ai-sdlc init\`
2. **Validate Setup:** \`./ai-sdlc validate\`
3. **Monitor Performance:** \`./ai-sdlc perf monitor\`
4. **Optimize Workspace:** \`./ai-sdlc perf optimize\`
5. **Start Development:** \`./ai-sdlc serve\`

---
*Generated by AI-SDLC Development Utilities*
`;

    return markdown;
  }

  /**
   * Clean development artifacts
   */
  cleanDevArtifacts() {
    console.log('🧹 Cleaning development artifacts...');

    const artifactsToClean = [
      'node_modules/.cache',
      '.eslintcache',
      'coverage',
      'dist',
      'build',
      '*.log',
      'performance-metrics.json',
      'AI_SDLC_*.md',
    ];

    let cleaned = 0;

    artifactsToClean.forEach((pattern) => {
      try {
        if (fs.existsSync(pattern)) {
          if (fs.statSync(pattern).isDirectory()) {
            fs.rmSync(pattern, { recursive: true, force: true });
          } else {
            fs.unlinkSync(pattern);
          }
          cleaned++;
          console.log(`✅ Cleaned: ${pattern}`);
        }
      } catch (error) {
        console.log(`⚠️  Could not clean ${pattern}: ${error.message}`);
      }
    });

    console.log(`🎉 Cleaned ${cleaned} artifacts`);
  }

  /**
   * Check for updates
   */
  checkForUpdates() {
    console.log('🔍 Checking for updates...');

    const checks = [];

    // Check npm packages
    if (fs.existsSync('package.json')) {
      try {
        const result = execSync('npm outdated --json', {
          encoding: 'utf8',
          stdio: 'pipe',
        });
        const outdated = JSON.parse(result);
        checks.push({ type: 'npm', outdated });
      } catch (error) {
        // npm outdated returns exit code 1 when packages are outdated
        if (error.stdout) {
          try {
            const outdated = JSON.parse(error.stdout);
            checks.push({ type: 'npm', outdated });
          } catch {
            checks.push({
              type: 'npm',
              error: 'Could not parse npm outdated output',
            });
          }
        }
      }
    }

    // Check Composer packages
    if (fs.existsSync('composer.json')) {
      try {
        const result = execSync('composer outdated --format=json', {
          encoding: 'utf8',
          stdio: 'pipe',
        });
        const outdated = JSON.parse(result);
        checks.push({ type: 'composer', outdated });
      } catch (error) {
        checks.push({ type: 'composer', error: error.message });
      }
    }

    return checks;
  }
}

// CLI interface
async function main() {
  const devUtils = new DevUtils();
  const command = process.argv[2];

  switch (command) {
    case 'report':
      devUtils.generateDevReport();
      break;

    case 'clean':
      devUtils.cleanDevArtifacts();
      break;

    case 'updates': {
      const updates = devUtils.checkForUpdates();
      console.log('📦 Update Check Results:');
      updates.forEach((check) => {
        console.log(`\n${check.type.toUpperCase()}:`);
        if (check.error) {
          console.log(`❌ Error: ${check.error}`);
        } else if (Object.keys(check.outdated).length === 0) {
          console.log('✅ All packages up to date');
        } else {
          Object.entries(check.outdated).forEach(([pkg, info]) => {
            console.log(`📦 ${pkg}: ${info.current} → ${info.latest}`);
          });
        }
      });
      break;
    }

    default:
      console.log('AI-SDLC Development Utilities');
      console.log('');
      console.log('Usage:');
      console.log(
        '  dev-utils.js report   - Generate development environment report'
      );
      console.log('  dev-utils.js clean    - Clean development artifacts');
      console.log('  dev-utils.js updates  - Check for package updates');
      break;
  }
}

// Export for use as module
module.exports = DevUtils;

// Run CLI if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

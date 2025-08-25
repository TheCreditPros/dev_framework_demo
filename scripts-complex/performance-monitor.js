#!/usr/bin/env node

/**
 * Performance Monitor for AI-SDLC
 * The Credit Pros - Development Team
 *
 * Monitors and optimizes existing Laravel + React workflows
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { performance } = require('perf_hooks');

class PerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.startTime = performance.now();
    this.logFile = path.join(process.cwd(), 'performance-metrics.json');
  }

  /**
   * Record a performance metric
   */
  recordMetric(name, value, unit = 'ms', metadata = {}) {
    const metric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.metrics.push(metric);
    console.log(`📊 ${name}: ${value}${unit}`);
  }

  /**
   * Measure command execution time
   */
  async measureCommand(command, description) {
    console.log(`🔍 Measuring: ${description}`);
    const startTime = performance.now();

    try {
      const result = execSync(command, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      this.recordMetric(description, duration, 'ms', {
        command,
        success: true,
        outputLength: result.length,
      });

      return { success: true, duration, output: result };
    } catch (error) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      this.recordMetric(description, duration, 'ms', {
        command,
        success: false,
        error: error.message,
      });

      return { success: false, duration, error: error.message };
    }
  }

  /**
   * Monitor npm/yarn operations
   */
  async monitorPackageManager() {
    console.log('📦 Monitoring package manager performance...');

    // Check if package.json exists
    if (!fs.existsSync('package.json')) {
      console.log(
        '⚠️  No package.json found, skipping package manager monitoring'
      );
      return;
    }

    // Measure npm install speed
    if (fs.existsSync('package-lock.json')) {
      await this.measureCommand('npm ci --silent', 'npm ci');
    } else if (fs.existsSync('yarn.lock')) {
      await this.measureCommand('yarn install --silent', 'yarn install');
    }

    // Measure build time if build script exists
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (packageJson.scripts && packageJson.scripts.build) {
      await this.measureCommand('npm run build', 'build process');
    }

    // Measure test execution
    if (packageJson.scripts && packageJson.scripts.test) {
      await this.measureCommand('npm test', 'test execution');
    }

    // Measure linting
    if (packageJson.scripts && packageJson.scripts.lint) {
      await this.measureCommand('npm run lint', 'linting process');
    }
  }

  /**
   * Monitor Git operations
   */
  async monitorGitOperations() {
    console.log('🔄 Monitoring Git operations...');

    if (!fs.existsSync('.git')) {
      console.log('⚠️  Not a Git repository, skipping Git monitoring');
      return;
    }

    // Measure git status
    await this.measureCommand('git status --porcelain', 'git status');

    // Measure git log
    await this.measureCommand('git log --oneline -10', 'git log');

    // Measure git diff
    await this.measureCommand('git diff --name-only', 'git diff');
  }

  /**
   * Monitor Laravel operations (if Laravel project)
   */
  async monitorLaravelOperations() {
    console.log('🐘 Monitoring Laravel operations...');

    if (!fs.existsSync('artisan')) {
      console.log('⚠️  No Laravel artisan found, skipping Laravel monitoring');
      return;
    }

    // Measure Composer operations
    if (fs.existsSync('composer.json')) {
      await this.measureCommand(
        'composer validate --no-check-publish',
        'composer validate'
      );
    }

    // Measure Laravel cache operations
    await this.measureCommand('php artisan config:cache', 'config cache');
    await this.measureCommand('php artisan route:cache', 'route cache');
    await this.measureCommand('php artisan view:cache', 'view cache');
  }

  /**
   * Monitor AI-SDLC operations
   */
  async monitorAISDLCOperations() {
    console.log('🤖 Monitoring AI-SDLC operations...');

    if (fs.existsSync('./ai-sdlc')) {
      await this.measureCommand('./ai-sdlc status', 'ai-sdlc status');
      await this.measureCommand('./ai-sdlc validate', 'ai-sdlc validation');
    }

    if (fs.existsSync('./validate-ai-sdlc.sh')) {
      await this.measureCommand('./validate-ai-sdlc.sh', 'validation script');
    }
  }

  /**
   * Analyze and optimize based on metrics
   */
  analyzeAndOptimize() {
    console.log('\n📈 Performance Analysis & Optimization Recommendations:');
    console.log('='.repeat(60));

    // Sort metrics by duration (slowest first)
    const sortedMetrics = this.metrics
      .filter((m) => m.unit === 'ms')
      .sort((a, b) => b.value - a.value);

    console.log('\n🐌 Slowest Operations:');
    sortedMetrics.slice(0, 5).forEach((metric, index) => {
      console.log(`${index + 1}. ${metric.name}: ${metric.value}ms`);

      // Provide optimization suggestions
      this.suggestOptimizations(metric);
    });

    // Calculate total execution time
    const totalTime = performance.now() - this.startTime;
    console.log(`\n⏱️  Total monitoring time: ${Math.round(totalTime)}ms`);

    // Check for performance thresholds
    this.checkPerformanceThresholds();
  }

  /**
   * Suggest optimizations based on metric
   */
  suggestOptimizations(metric) {
    const suggestions = [];

    if (metric.name.includes('npm ci') && metric.value > 30000) {
      suggestions.push('💡 Consider using npm ci with --prefer-offline flag');
      suggestions.push('💡 Add .npmrc with cache configuration');
    }

    if (metric.name.includes('build process') && metric.value > 60000) {
      suggestions.push('💡 Enable build caching in webpack/vite');
      suggestions.push('💡 Consider code splitting for faster builds');
    }

    if (metric.name.includes('test execution') && metric.value > 30000) {
      suggestions.push('💡 Run tests in parallel with --parallel flag');
      suggestions.push('💡 Consider test sharding for large test suites');
    }

    if (metric.name.includes('linting process') && metric.value > 10000) {
      suggestions.push('💡 Enable ESLint caching with --cache flag');
      suggestions.push('💡 Configure lint-staged for incremental linting');
    }

    if (metric.name.includes('ai-sdlc validation') && metric.value > 15000) {
      suggestions.push('💡 Consider caching validation results');
      suggestions.push('💡 Run validations in parallel where possible');
    }

    suggestions.forEach((suggestion) => {
      console.log(`   ${suggestion}`);
    });
  }

  /**
   * Check performance thresholds and alert
   */
  checkPerformanceThresholds() {
    console.log('\n🚨 Performance Threshold Analysis:');

    const thresholds = {
      'npm ci': 30000,
      'build process': 60000,
      'test execution': 30000,
      'linting process': 10000,
      'ai-sdlc validation': 15000,
    };

    let alertsCount = 0;

    this.metrics.forEach((metric) => {
      Object.keys(thresholds).forEach((operation) => {
        if (
          metric.name.includes(operation) &&
          metric.value > thresholds[operation]
        ) {
          console.log(
            `⚠️  ${metric.name} exceeded threshold: ${metric.value}ms > ${thresholds[operation]}ms`
          );
          alertsCount++;
        }
      });
    });

    if (alertsCount === 0) {
      console.log('✅ All operations within acceptable performance thresholds');
    } else {
      console.log(
        `🔴 ${alertsCount} operations exceeded performance thresholds`
      );
    }
  }

  /**
   * Save metrics to file
   */
  saveMetrics() {
    const report = {
      timestamp: new Date().toISOString(),
      totalDuration: Math.round(performance.now() - this.startTime),
      metrics: this.metrics,
      summary: {
        totalOperations: this.metrics.length,
        avgDuration: Math.round(
          this.metrics.reduce(
            (sum, m) => sum + (m.unit === 'ms' ? m.value : 0),
            0
          ) / this.metrics.length
        ),
        slowestOperation: this.metrics.reduce(
          (slowest, current) =>
            current.value > slowest.value ? current : slowest,
          { value: 0 }
        ),
      },
    };

    fs.writeFileSync(this.logFile, JSON.stringify(report, null, 2));
    console.log(`\n💾 Performance metrics saved to: ${this.logFile}`);
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const reportPath = path.join(process.cwd(), 'PERFORMANCE_REPORT.md');

    let report = `# AI-SDLC Performance Report

**Generated:** ${new Date().toISOString()}
**Total Monitoring Time:** ${Math.round(performance.now() - this.startTime)}ms

## 📊 Performance Metrics

| Operation | Duration (ms) | Status |
|-----------|---------------|--------|
`;

    this.metrics.forEach((metric) => {
      const status = metric.metadata.success ? '✅' : '❌';
      report += `| ${metric.name} | ${metric.value} | ${status} |\n`;
    });

    report += `
## 🚀 Optimization Recommendations

`;

    // Add specific recommendations based on project type
    if (fs.existsSync('package.json')) {
      report += `### Frontend Optimizations
- Enable build caching in webpack/vite configuration
- Use code splitting for better load times
- Implement tree shaking to reduce bundle size
- Consider using npm ci --prefer-offline for faster installs

`;
    }

    if (fs.existsSync('artisan')) {
      report += `### Laravel Optimizations
- Enable OPcache in production
- Use Laravel's built-in caching mechanisms
- Optimize database queries with proper indexing
- Configure queue workers for background tasks

`;
    }

    report += `### General AI-SDLC Optimizations
- Cache validation results between runs
- Use parallel processing where possible
- Optimize git hooks to run only necessary checks
- Configure CI/CD pipeline for optimal performance

## 📈 Next Steps

1. Implement the suggested optimizations above
2. Monitor performance regularly with this script
3. Set up automated performance alerts
4. Track performance improvements over time

---
*Generated by AI-SDLC Performance Monitor*
`;

    fs.writeFileSync(reportPath, report);
    console.log(`📋 Performance report generated: ${reportPath}`);
  }

  /**
   * Run complete performance monitoring
   */
  async runFullMonitoring() {
    console.log('🚀 Starting comprehensive performance monitoring...');
    console.log('='.repeat(60));

    await this.monitorPackageManager();
    await this.monitorGitOperations();
    await this.monitorLaravelOperations();
    await this.monitorAISDLCOperations();

    this.analyzeAndOptimize();
    this.saveMetrics();
    this.generateReport();

    console.log('\n✅ Performance monitoring complete!');
  }
}

// CLI interface
async function main() {
  const monitor = new PerformanceMonitor();
  const command = process.argv[2];

  switch (command) {
    case 'monitor':
      await monitor.runFullMonitoring();
      break;

    case 'npm':
      await monitor.monitorPackageManager();
      monitor.saveMetrics();
      break;

    case 'git':
      await monitor.monitorGitOperations();
      monitor.saveMetrics();
      break;

    case 'laravel':
      await monitor.monitorLaravelOperations();
      monitor.saveMetrics();
      break;

    case 'ai-sdlc':
      await monitor.monitorAISDLCOperations();
      monitor.saveMetrics();
      break;

    default:
      console.log('AI-SDLC Performance Monitor');
      console.log('');
      console.log('Usage:');
      console.log(
        '  performance-monitor.js monitor    - Run complete performance monitoring'
      );
      console.log(
        '  performance-monitor.js npm        - Monitor npm/yarn operations'
      );
      console.log(
        '  performance-monitor.js git        - Monitor Git operations'
      );
      console.log(
        '  performance-monitor.js laravel    - Monitor Laravel operations'
      );
      console.log(
        '  performance-monitor.js ai-sdlc    - Monitor AI-SDLC operations'
      );
      break;
  }
}

// Export for use as module
module.exports = PerformanceMonitor;

// Run CLI if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

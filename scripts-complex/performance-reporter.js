#!/usr/bin/env node
/**
 * Performance Reporter for Playwright - AI-SDLC Framework
 * Collects and reports performance metrics for credit repair applications
 * The Credit Pros - Enterprise Performance Monitoring
 */

const fs = require('fs');
const path = require('path');

class PerformanceReporter {
  constructor(options = {}) {
    this.suite = null;
    this.results = [];
    this.metrics = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      totalDuration: 0,
      avgTestDuration: 0,
      performanceIssues: [],
      slowTests: [],
      memoryUsage: [],
      networkRequests: [],
    };
    this.startTime = Date.now();
    this.outputDir = options.outputDir || 'test-results';
    this.thresholds = {
      testDuration: 30000, // 30 seconds max per test
      networkTimeout: 5000, // 5 seconds for network requests
      memoryThreshold: 100 * 1024 * 1024, // 100MB memory threshold
      pageLoadTime: 3000, // 3 seconds max page load
    };
  }

  onBegin(config, suite) {
    this.suite = suite;
    console.log('📊 Performance monitoring started for AI-SDLC E2E tests');
    console.log(`   Test directory: ${config.testDir}`);
    console.log(`   Workers: ${config.workers}`);
    console.log(`   Retries: ${config.retries}`);
    console.log('');
  }

  onTestBegin(test, result) {
    this.metrics.totalTests++;
    result.startTime = Date.now();

    // Initialize test performance tracking
    result.performanceData = {
      networkRequests: [],
      memorySnapshots: [],
      pageLoadTimes: [],
      errors: [],
    };
  }

  onTestEnd(test, result) {
    const duration = Date.now() - result.startTime;
    result.duration = duration;

    // Update metrics based on test result
    switch (result.status) {
      case 'passed':
        this.metrics.passedTests++;
        break;
      case 'failed':
        this.metrics.failedTests++;
        break;
      case 'skipped':
        this.metrics.skippedTests++;
        break;
    }

    // Track slow tests
    if (duration > this.thresholds.testDuration) {
      this.metrics.slowTests.push({
        title: test.title,
        duration,
        threshold: this.thresholds.testDuration,
        file: test.location.file,
      });
    }

    // Analyze performance issues
    this.analyzeTestPerformance(test, result);

    this.results.push({
      title: test.title,
      status: result.status,
      duration,
      file: test.location.file,
      line: test.location.line,
      performanceData: result.performanceData,
      errors: result.errors,
    });
  }

  onEnd(_result) {
    const endTime = Date.now();
    this.metrics.totalDuration = endTime - this.startTime;
    this.metrics.avgTestDuration =
      this.metrics.totalDuration / Math.max(this.metrics.totalTests, 1);

    this.generatePerformanceReport();
    this.generateMetricsFile();
    this.checkPerformanceThresholds();

    console.log('📈 Performance Analysis Complete');
    console.log(`   Total Tests: ${this.metrics.totalTests}`);
    console.log(
      `   Passed: ${this.metrics.passedTests} | Failed: ${this.metrics.failedTests} | Skipped: ${this.metrics.skippedTests}`
    );
    console.log(
      `   Total Duration: ${(this.metrics.totalDuration / 1000).toFixed(2)}s`
    );
    console.log(
      `   Avg Test Duration: ${(this.metrics.avgTestDuration / 1000).toFixed(2)}s`
    );

    if (this.metrics.slowTests.length > 0) {
      console.log(`   ⚠️ Slow Tests: ${this.metrics.slowTests.length}`);
    }

    if (this.metrics.performanceIssues.length > 0) {
      console.log(
        `   🐌 Performance Issues: ${this.metrics.performanceIssues.length}`
      );
    }

    console.log(
      `   📄 Performance report: ${this.outputDir}/performance-report.html`
    );
  }

  analyzeTestPerformance(test, result) {
    const issues = [];

    // Check for slow tests
    if (result.duration > this.thresholds.testDuration) {
      issues.push({
        type: 'slow_test',
        severity: 'warning',
        message: `Test exceeded ${this.thresholds.testDuration}ms threshold`,
        actual: result.duration,
        threshold: this.thresholds.testDuration,
      });
    }

    // Credit repair specific performance checks
    if (
      test.title.toLowerCase().includes('credit') ||
      test.title.toLowerCase().includes('dispute') ||
      test.title.toLowerCase().includes('score')
    ) {
      // These are critical user-facing features, apply stricter thresholds
      const strictThreshold = this.thresholds.testDuration * 0.7;
      if (result.duration > strictThreshold) {
        issues.push({
          type: 'critical_feature_slow',
          severity: 'high',
          message: 'Critical credit repair feature is running slow',
          actual: result.duration,
          threshold: strictThreshold,
          impact: 'User experience degradation for credit repair workflows',
        });
      }
    }

    // Add issues to global tracking
    if (issues.length > 0) {
      this.metrics.performanceIssues.push({
        test: test.title,
        file: test.location.file,
        issues,
      });
    }
  }

  generatePerformanceReport() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const reportPath = path.join(this.outputDir, 'performance-report.html');
    const report = this.createHTMLReport();

    fs.writeFileSync(reportPath, report);
  }

  generateMetricsFile() {
    const metricsPath = path.join(this.outputDir, 'performance-metrics.json');
    const metrics = {
      timestamp: new Date().toISOString(),
      framework: 'AI-SDLC v2.8.1',
      domain: 'Credit Repair - The Credit Pros',
      summary: this.metrics,
      tests: this.results,
      thresholds: this.thresholds,
    };

    fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
  }

  checkPerformanceThresholds() {
    let thresholdViolations = 0;

    // Check overall performance
    if (this.metrics.avgTestDuration > this.thresholds.testDuration) {
      console.warn(
        `⚠️ Average test duration (${this.metrics.avgTestDuration}ms) exceeds threshold (${this.thresholds.testDuration}ms)`
      );
      thresholdViolations++;
    }

    // Check for too many slow tests
    const slowTestPercentage =
      (this.metrics.slowTests.length / this.metrics.totalTests) * 100;
    if (slowTestPercentage > 20) {
      console.warn(
        `⚠️ ${slowTestPercentage.toFixed(1)}% of tests are slow (>20% threshold)`
      );
      thresholdViolations++;
    }

    // Check critical credit repair features
    const criticalIssues = this.metrics.performanceIssues.filter((issue) =>
      issue.issues.some((i) => i.type === 'critical_feature_slow')
    );

    if (criticalIssues.length > 0) {
      console.error(
        `❌ ${criticalIssues.length} critical credit repair features have performance issues`
      );
      thresholdViolations++;
    }

    if (thresholdViolations > 0) {
      console.log(`\n💡 Performance recommendations:`);
      console.log(`   - Optimize slow-running tests`);
      console.log(`   - Review network request patterns`);
      console.log(`   - Consider parallel test execution`);
      console.log(`   - Monitor memory usage during tests`);
    }
  }

  createHTMLReport() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI-SDLC Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { color: #666; margin-top: 5px; }
        .slow-tests, .issues { margin-top: 30px; }
        .test-item { background: #fff3cd; padding: 10px; margin: 10px 0; border-left: 4px solid #ffc107; border-radius: 4px; }
        .issue-item { background: #f8d7da; padding: 10px; margin: 10px 0; border-left: 4px solid #dc3545; border-radius: 4px; }
        .timestamp { text-align: center; color: #666; margin-top: 30px; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 AI-SDLC Performance Report</h1>
            <p>Credit Repair Domain - The Credit Pros</p>
        </div>
        
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">${this.metrics.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${this.metrics.passedTests}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${this.metrics.failedTests}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${(this.metrics.totalDuration / 1000).toFixed(1)}s</div>
                <div class="metric-label">Total Duration</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${(this.metrics.avgTestDuration / 1000).toFixed(1)}s</div>
                <div class="metric-label">Avg Test Duration</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${this.metrics.slowTests.length}</div>
                <div class="metric-label">Slow Tests</div>
            </div>
        </div>

        ${
          this.metrics.slowTests.length > 0
            ? `
        <div class="slow-tests">
            <h2>⚠️ Slow Tests (>${this.thresholds.testDuration}ms)</h2>
            ${this.metrics.slowTests
              .map(
                (test) => `
                <div class="test-item">
                    <strong>${test.title}</strong><br>
                    Duration: ${test.duration}ms (threshold: ${test.threshold}ms)<br>
                    File: ${test.file}
                </div>
            `
              )
              .join('')}
        </div>
        `
            : ''
        }

        ${
          this.metrics.performanceIssues.length > 0
            ? `
        <div class="issues">
            <h2>🐌 Performance Issues</h2>
            ${this.metrics.performanceIssues
              .map(
                (item) => `
                <div class="issue-item">
                    <strong>${item.test}</strong><br>
                    File: ${item.file}<br>
                    Issues: ${item.issues.map((i) => i.message).join(', ')}
                </div>
            `
              )
              .join('')}
        </div>
        `
            : ''
        }

        <div class="timestamp">
            Generated: ${new Date().toLocaleString()}<br>
            AI-SDLC Framework v2.8.1 - Performance Monitoring
        </div>
    </div>
</body>
</html>`;
  }
}

module.exports = PerformanceReporter;

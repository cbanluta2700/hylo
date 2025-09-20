#!/usr/bin/env node

/**
 * Comprehensive Test Report Generator
 * Aggregates test results from multiple sources and generates comprehensive reports
 */

const fs = require('fs');
const path = require('path');

class TestReportGenerator {
  constructor() {
    this.reportData = {
      timestamp: new Date().toISOString(),
      git_sha: process.env['GITHUB_SHA'] || 'unknown',
      git_ref: process.env['GITHUB_REF'] || 'unknown',
      pr_number: process.env['GITHUB_PR_NUMBER'] || null,
      workflow_run_id: process.env['GITHUB_RUN_ID'] || 'unknown',
      summary: {
        total_tests: 0,
        passed_tests: 0,
        failed_tests: 0,
        skipped_tests: 0,
        success_rate: 0,
        total_duration: 0
      },
      test_suites: [],
      coverage: null,
      performance: null,
      quality_metrics: null,
      artifacts: []
    };
  }

  // Load unit test results from Vitest JSON output
  loadUnitTestResults(filePath = 'test-results/unit-test-results.json') {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Unit test results not found at: ${filePath}`);
      return;
    }

    try {
      const unitResults = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      const unitSuite = {
        name: 'Unit Tests',
        type: 'unit',
        status: unitResults.testResults?.every(r => r.status === 'passed') ? 'passed' : 'failed',
        tests: unitResults.testResults?.length || 0,
        passed: unitResults.testResults?.filter(r => r.status === 'passed').length || 0,
        failed: unitResults.testResults?.filter(r => r.status === 'failed').length || 0,
        skipped: unitResults.testResults?.filter(r => r.status === 'skipped').length || 0,
        duration: unitResults.runTime || 0,
        details: unitResults.testResults || []
      };

      this.reportData.test_suites.push(unitSuite);
      this.updateSummary(unitSuite);
      
      console.log(`✅ Loaded unit test results: ${unitSuite.passed}/${unitSuite.tests} passed`);
    } catch (error) {
      console.error(`❌ Failed to load unit test results: ${error.message}`);
    }
  }

  // Load integration test results
  loadIntegrationTestResults(filePath = 'test-results/integration-test-results.json') {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Integration test results not found at: ${filePath}`);
      return;
    }

    try {
      const integrationResults = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      const integrationSuite = {
        name: 'Integration Tests',
        type: 'integration',
        status: integrationResults.testResults?.every(r => r.status === 'passed') ? 'passed' : 'failed',
        tests: integrationResults.testResults?.length || 0,
        passed: integrationResults.testResults?.filter(r => r.status === 'passed').length || 0,
        failed: integrationResults.testResults?.filter(r => r.status === 'failed').length || 0,
        skipped: integrationResults.testResults?.filter(r => r.status === 'skipped').length || 0,
        duration: integrationResults.runTime || 0,
        details: integrationResults.testResults || []
      };

      this.reportData.test_suites.push(integrationSuite);
      this.updateSummary(integrationSuite);
      
      console.log(`✅ Loaded integration test results: ${integrationSuite.passed}/${integrationSuite.tests} passed`);
    } catch (error) {
      console.error(`❌ Failed to load integration test results: ${error.message}`);
    }
  }

  // Load performance test results
  loadPerformanceTestResults(filePath = 'performance-results/performance-metrics.json') {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Performance test results not found at: ${filePath}`);
      return;
    }

    try {
      const perfResults = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      this.reportData.performance = {
        timestamp: perfResults.timestamp,
        duration: perfResults.duration || 0,
        concurrent_users: perfResults.concurrent_users || 0,
        total_requests: perfResults.counters?.['http.requests'] || 0,
        request_rate: perfResults.rates?.['http.request_rate'] || 0,
        latency: {
          min: perfResults.latency?.min || 0,
          max: perfResults.latency?.max || 0,
          mean: perfResults.latency?.median || 0,
          p95: perfResults.latency?.p95 || 0,
          p99: perfResults.latency?.p99 || 0
        },
        errors: perfResults.errors || {},
        success_rate: this.calculatePerformanceSuccessRate(perfResults)
      };

      // Add performance as a test suite
      const perfSuite = {
        name: 'Performance Tests',
        type: 'performance',
        status: this.reportData.performance.success_rate > 90 ? 'passed' : 'failed',
        tests: 1,
        passed: this.reportData.performance.success_rate > 90 ? 1 : 0,
        failed: this.reportData.performance.success_rate > 90 ? 0 : 1,
        skipped: 0,
        duration: this.reportData.performance.duration,
        details: [`Performance test with ${this.reportData.performance.total_requests} requests`]
      };

      this.reportData.test_suites.push(perfSuite);
      this.updateSummary(perfSuite);
      
      console.log(`✅ Loaded performance test results: ${this.reportData.performance.success_rate.toFixed(2)}% success rate`);
    } catch (error) {
      console.error(`❌ Failed to load performance test results: ${error.message}`);
    }
  }

  // Load coverage results
  loadCoverageResults(filePath = 'coverage/coverage-summary.json') {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Coverage results not found at: ${filePath}`);
      return;
    }

    try {
      const coverageResults = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      this.reportData.coverage = {
        lines: coverageResults.total?.lines || { pct: 0 },
        functions: coverageResults.total?.functions || { pct: 0 },
        branches: coverageResults.total?.branches || { pct: 0 },
        statements: coverageResults.total?.statements || { pct: 0 }
      };
      
      console.log(`✅ Loaded coverage results: ${this.reportData.coverage.lines.pct}% line coverage`);
    } catch (error) {
      console.error(`❌ Failed to load coverage results: ${error.message}`);
    }
  }

  // Load quality metrics (ESLint, etc.)
  loadQualityMetrics(filePath = 'eslint-results.json') {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Quality metrics not found at: ${filePath}`);
      return;
    }

    try {
      const eslintResults = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      const totalErrors = eslintResults.reduce((sum, file) => sum + file.errorCount, 0);
      const totalWarnings = eslintResults.reduce((sum, file) => sum + file.warningCount, 0);
      const filesWithIssues = eslintResults.filter(file => file.errorCount > 0 || file.warningCount > 0).length;
      
      this.reportData.quality_metrics = {
        eslint: {
          total_files: eslintResults.length,
          files_with_issues: filesWithIssues,
          total_errors: totalErrors,
          total_warnings: totalWarnings,
          quality_score: this.calculateQualityScore(totalErrors, totalWarnings, eslintResults.length)
        }
      };
      
      console.log(`✅ Loaded quality metrics: ${totalErrors} errors, ${totalWarnings} warnings`);
    } catch (error) {
      console.error(`❌ Failed to load quality metrics: ${error.message}`);
    }
  }

  // Helper methods
  updateSummary(suite) {
    this.reportData.summary.total_tests += suite.tests;
    this.reportData.summary.passed_tests += suite.passed;
    this.reportData.summary.failed_tests += suite.failed;
    this.reportData.summary.skipped_tests += suite.skipped;
    this.reportData.summary.total_duration += suite.duration;
    this.reportData.summary.success_rate = 
      this.reportData.summary.total_tests > 0 
        ? (this.reportData.summary.passed_tests / this.reportData.summary.total_tests) * 100 
        : 0;
  }

  calculatePerformanceSuccessRate(perfResults) {
    const totalRequests = perfResults.counters?.['http.requests'] || 0;
    const totalErrors = Object.values(perfResults.errors || {}).reduce((sum, count) => sum + (count || 0), 0);
    
    if (totalRequests === 0) return 0;
    return ((totalRequests - totalErrors) / totalRequests) * 100;
  }

  calculateQualityScore(errors, warnings, totalFiles) {
    if (totalFiles === 0) return 100;
    
    const errorPenalty = errors * 10;
    const warningPenalty = warnings * 2;
    const totalPenalty = errorPenalty + warningPenalty;
    const maxPossiblePenalty = totalFiles * 20; // Arbitrary max penalty per file
    
    return Math.max(0, 100 - (totalPenalty / maxPossiblePenalty) * 100);
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n📊 Generating comprehensive test report...');
    
    // Load all available test results
    this.loadUnitTestResults();
    this.loadIntegrationTestResults();
    this.loadPerformanceTestResults();
    this.loadCoverageResults();
    this.loadQualityMetrics();
    
    // Determine overall status
    const overallStatus = this.determineOverallStatus();
    this.reportData.overall_status = overallStatus;
    
    return this.reportData;
  }

  determineOverallStatus() {
    const hasFailedTests = this.reportData.summary.failed_tests > 0;
    const lowCoverage = this.reportData.coverage && this.reportData.coverage.lines.pct < 80;
    const lowPerformance = this.reportData.performance && this.reportData.performance.success_rate < 90;
    const qualityIssues = this.reportData.quality_metrics && this.reportData.quality_metrics.eslint.total_errors > 0;
    
    if (hasFailedTests || qualityIssues) {
      return 'failed';
    } else if (lowCoverage || lowPerformance) {
      return 'warning';
    } else {
      return 'passed';
    }
  }

  // Generate HTML report
  generateHtmlReport(outputPath = 'test-results/comprehensive-report.html') {
    const html = this.generateHtmlContent();
    
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, html);
    console.log(`📄 HTML report generated: ${outputPath}`);
    
    return outputPath;
  }

  generateHtmlContent() {
    const status = this.reportData.overall_status;
    const statusColor = status === 'passed' ? '#22c55e' : status === 'warning' ? '#f59e0b' : '#ef4444';
    const statusIcon = status === 'passed' ? '✅' : status === 'warning' ? '⚠️' : '❌';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hylo Travel AI - Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .status { display: inline-flex; align-items: center; gap: 8px; font-size: 24px; font-weight: bold; color: ${statusColor}; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .card h3 { margin: 0 0 15px 0; color: #1f2937; }
        .metric { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .metric:last-child { border-bottom: none; }
        .metric-value { font-weight: bold; }
        .success { color: #22c55e; }
        .warning { color: #f59e0b; }
        .error { color: #ef4444; }
        .suite-status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .suite-passed { background: #dcfce7; color: #166534; }
        .suite-failed { background: #fecaca; color: #991b1b; }
        .progress-bar { width: 100%; height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; background: ${statusColor}; transition: width 0.3s ease; }
        .metadata { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 14px; color: #6b7280; }
        .metadata-item { background: #f9fafb; padding: 10px; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="status">${statusIcon} ${status.toUpperCase()}</div>
            <h1 style="margin: 10px 0; color: #1f2937;">Hylo Travel AI - Test Report</h1>
            <div class="metadata">
                <div class="metadata-item"><strong>Timestamp:</strong> ${new Date(this.reportData.timestamp).toLocaleString()}</div>
                <div class="metadata-item"><strong>Git SHA:</strong> ${this.reportData.git_sha.substring(0, 8)}</div>
                <div class="metadata-item"><strong>Git Ref:</strong> ${this.reportData.git_ref}</div>
                <div class="metadata-item"><strong>Run ID:</strong> ${this.reportData.workflow_run_id}</div>
            </div>
        </div>

        <div class="grid">
            <!-- Summary Card -->
            <div class="card">
                <h3>📊 Test Summary</h3>
                <div class="metric">
                    <span>Total Tests</span>
                    <span class="metric-value">${this.reportData.summary.total_tests}</span>
                </div>
                <div class="metric">
                    <span>Passed</span>
                    <span class="metric-value success">${this.reportData.summary.passed_tests}</span>
                </div>
                <div class="metric">
                    <span>Failed</span>
                    <span class="metric-value error">${this.reportData.summary.failed_tests}</span>
                </div>
                <div class="metric">
                    <span>Skipped</span>
                    <span class="metric-value warning">${this.reportData.summary.skipped_tests}</span>
                </div>
                <div class="metric">
                    <span>Success Rate</span>
                    <span class="metric-value">${this.reportData.summary.success_rate.toFixed(1)}%</span>
                </div>
                <div class="progress-bar" style="margin-top: 10px;">
                    <div class="progress-fill" style="width: ${this.reportData.summary.success_rate}%"></div>
                </div>
            </div>

            <!-- Test Suites -->
            <div class="card">
                <h3>🧪 Test Suites</h3>
                ${this.reportData.test_suites.map(suite => `
                    <div class="metric">
                        <div>
                            <span>${suite.name}</span>
                            <span class="suite-status suite-${suite.status}">${suite.status.toUpperCase()}</span>
                        </div>
                        <span class="metric-value">${suite.passed}/${suite.tests}</span>
                    </div>
                `).join('')}
            </div>

            ${this.reportData.coverage ? `
            <!-- Coverage -->
            <div class="card">
                <h3>📋 Coverage</h3>
                <div class="metric">
                    <span>Lines</span>
                    <span class="metric-value">${this.reportData.coverage.lines.pct}%</span>
                </div>
                <div class="metric">
                    <span>Functions</span>
                    <span class="metric-value">${this.reportData.coverage.functions.pct}%</span>
                </div>
                <div class="metric">
                    <span>Branches</span>
                    <span class="metric-value">${this.reportData.coverage.branches.pct}%</span>
                </div>
                <div class="metric">
                    <span>Statements</span>
                    <span class="metric-value">${this.reportData.coverage.statements.pct}%</span>
                </div>
            </div>
            ` : ''}

            ${this.reportData.performance ? `
            <!-- Performance -->
            <div class="card">
                <h3>🚀 Performance</h3>
                <div class="metric">
                    <span>Total Requests</span>
                    <span class="metric-value">${this.reportData.performance.total_requests}</span>
                </div>
                <div class="metric">
                    <span>Request Rate</span>
                    <span class="metric-value">${this.reportData.performance.request_rate.toFixed(1)} RPS</span>
                </div>
                <div class="metric">
                    <span>P95 Latency</span>
                    <span class="metric-value">${this.reportData.performance.latency.p95}ms</span>
                </div>
                <div class="metric">
                    <span>P99 Latency</span>
                    <span class="metric-value">${this.reportData.performance.latency.p99}ms</span>
                </div>
                <div class="metric">
                    <span>Success Rate</span>
                    <span class="metric-value">${this.reportData.performance.success_rate.toFixed(1)}%</span>
                </div>
            </div>
            ` : ''}

            ${this.reportData.quality_metrics ? `
            <!-- Quality -->
            <div class="card">
                <h3>🔍 Code Quality</h3>
                <div class="metric">
                    <span>ESLint Errors</span>
                    <span class="metric-value error">${this.reportData.quality_metrics.eslint.total_errors}</span>
                </div>
                <div class="metric">
                    <span>ESLint Warnings</span>
                    <span class="metric-value warning">${this.reportData.quality_metrics.eslint.total_warnings}</span>
                </div>
                <div class="metric">
                    <span>Files with Issues</span>
                    <span class="metric-value">${this.reportData.quality_metrics.eslint.files_with_issues}</span>
                </div>
                <div class="metric">
                    <span>Quality Score</span>
                    <span class="metric-value">${this.reportData.quality_metrics.eslint.quality_score.toFixed(1)}/100</span>
                </div>
            </div>
            ` : ''}
        </div>
    </div>
</body>
</html>`;
  }

  // Generate PR comment markdown
  generatePrComment() {
    const status = this.reportData.overall_status;
    const statusIcon = status === 'passed' ? '✅' : status === 'warning' ? '⚠️' : '❌';
    
    let comment = `## ${statusIcon} Test Results\n\n`;
    
    comment += `**Overall Status:** ${status.toUpperCase()}\n`;
    comment += `**Git SHA:** \`${this.reportData.git_sha.substring(0, 8)}\`\n`;
    comment += `**Timestamp:** ${new Date(this.reportData.timestamp).toLocaleString()}\n\n`;
    
    // Summary table
    comment += `### 📊 Summary\n\n`;
    comment += `| Metric | Value |\n`;
    comment += `|--------|-------|\n`;
    comment += `| Total Tests | ${this.reportData.summary.total_tests} |\n`;
    comment += `| Passed | ${this.reportData.summary.passed_tests} |\n`;
    comment += `| Failed | ${this.reportData.summary.failed_tests} |\n`;
    comment += `| Success Rate | ${this.reportData.summary.success_rate.toFixed(1)}% |\n\n`;
    
    // Test suites
    if (this.reportData.test_suites.length > 0) {
      comment += `### 🧪 Test Suites\n\n`;
      comment += `| Suite | Status | Tests | Passed | Failed |\n`;
      comment += `|-------|--------|-------|--------|---------|\n`;
      
      this.reportData.test_suites.forEach(suite => {
        const suiteIcon = suite.status === 'passed' ? '✅' : '❌';
        comment += `| ${suiteIcon} ${suite.name} | ${suite.status} | ${suite.tests} | ${suite.passed} | ${suite.failed} |\n`;
      });
      comment += `\n`;
    }
    
    // Coverage
    if (this.reportData.coverage) {
      comment += `### 📋 Coverage\n\n`;
      comment += `| Type | Coverage |\n`;
      comment += `|------|----------|\n`;
      comment += `| Lines | ${this.reportData.coverage.lines.pct}% |\n`;
      comment += `| Functions | ${this.reportData.coverage.functions.pct}% |\n`;
      comment += `| Branches | ${this.reportData.coverage.branches.pct}% |\n`;
      comment += `| Statements | ${this.reportData.coverage.statements.pct}% |\n\n`;
    }
    
    // Performance
    if (this.reportData.performance) {
      comment += `### 🚀 Performance\n\n`;
      comment += `| Metric | Value |\n`;
      comment += `|--------|-------|\n`;
      comment += `| Total Requests | ${this.reportData.performance.total_requests} |\n`;
      comment += `| Request Rate | ${this.reportData.performance.request_rate.toFixed(1)} RPS |\n`;
      comment += `| P95 Latency | ${this.reportData.performance.latency.p95}ms |\n`;
      comment += `| Success Rate | ${this.reportData.performance.success_rate.toFixed(1)}% |\n\n`;
    }
    
    // Quality metrics
    if (this.reportData.quality_metrics) {
      comment += `### 🔍 Code Quality\n\n`;
      comment += `| Metric | Value |\n`;
      comment += `|--------|-------|\n`;
      comment += `| ESLint Errors | ${this.reportData.quality_metrics.eslint.total_errors} |\n`;
      comment += `| ESLint Warnings | ${this.reportData.quality_metrics.eslint.total_warnings} |\n`;
      comment += `| Quality Score | ${this.reportData.quality_metrics.eslint.quality_score.toFixed(1)}/100 |\n\n`;
    }
    
    return comment;
  }

  // Save all reports
  saveReports() {
    const reportsDir = 'test-results';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Save JSON report
    const jsonPath = path.join(reportsDir, 'comprehensive-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(this.reportData, null, 2));
    console.log(`💾 JSON report saved: ${jsonPath}`);
    
    // Save HTML report
    const htmlPath = this.generateHtmlReport();
    
    // Save PR comment
    const prCommentPath = path.join(reportsDir, 'pr-comment.md');
    fs.writeFileSync(prCommentPath, this.generatePrComment());
    console.log(`💾 PR comment saved: ${prCommentPath}`);
    
    return {
      json: jsonPath,
      html: htmlPath,
      prComment: prCommentPath
    };
  }
}

// Main execution
async function main() {
  try {
    console.log('📊 Starting comprehensive test report generation...\n');
    
    const generator = new TestReportGenerator();
    const report = generator.generateReport();
    const reportPaths = generator.saveReports();
    
    console.log('\n📊 Test Report Summary:');
    console.log(`   Overall Status: ${report.overall_status.toUpperCase()}`);
    console.log(`   Total Tests: ${report.summary.total_tests}`);
    console.log(`   Success Rate: ${report.summary.success_rate.toFixed(1)}%`);
    console.log(`   Duration: ${(report.summary.total_duration / 1000).toFixed(1)} seconds`);
    
    console.log('\n📄 Generated Reports:');
    console.log(`   JSON: ${reportPaths.json}`);
    console.log(`   HTML: ${reportPaths.html}`);
    console.log(`   PR Comment: ${reportPaths.prComment}`);
    
    // Exit with appropriate code
    if (report.overall_status === 'failed') {
      console.log('\n❌ Tests failed!');
      process.exit(1);
    } else if (report.overall_status === 'warning') {
      console.log('\n⚠️  Tests passed with warnings');
      process.exit(0);
    } else {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Report generation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { TestReportGenerator };
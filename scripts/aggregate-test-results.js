#!/usr/bin/env node

/**
 * Test Results Aggregator
 * Collects and merges test results from various sources into a unified format
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TestResultsAggregator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      sources: [],
      aggregated: {
        unit_tests: null,
        integration_tests: null,
        performance_tests: null,
        e2e_tests: null,
        coverage: null,
        quality_metrics: null,
      },
      summary: {
        total_tests: 0,
        passed_tests: 0,
        failed_tests: 0,
        skipped_tests: 0,
        success_rate: 0,
        total_duration: 0,
      }
    };
  }

  // Ensure results directory exists
  ensureResultsDirectory() {
    const dirs = ['test-results', 'coverage', 'performance-results'];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });
  }

  // Run unit tests and capture results
  async runUnitTests() {
    console.log('🧪 Running unit tests...');
    
    try {
      const command = 'npm run test:unit -- --reporter=json --outputFile=test-results/unit-test-results.json --run';
      execSync(command, { stdio: 'inherit' });
      
      const results = this.loadJsonResults('test-results/unit-test-results.json');
      if (results) {
        this.results.aggregated.unit_tests = this.normalizeVitestResults(results, 'unit');
        this.results.sources.push('unit-test-results.json');
        console.log('✅ Unit tests completed');
      }
    } catch (error) {
      console.warn('⚠️  Unit tests failed or not available:', error.message);
      // Create minimal failure record
      this.results.aggregated.unit_tests = {
        name: 'Unit Tests',
        type: 'unit',
        status: 'failed',
        tests: 0,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: 0,
        error: error.message
      };
    }
  }

  // Run integration tests and capture results
  async runIntegrationTests() {
    console.log('🔗 Running integration tests...');
    
    try {
      const command = 'npm run test:integration -- --reporter=json --outputFile=test-results/integration-test-results.json --run';
      execSync(command, { stdio: 'inherit' });
      
      const results = this.loadJsonResults('test-results/integration-test-results.json');
      if (results) {
        this.results.aggregated.integration_tests = this.normalizeVitestResults(results, 'integration');
        this.results.sources.push('integration-test-results.json');
        console.log('✅ Integration tests completed');
      }
    } catch (error) {
      console.warn('⚠️  Integration tests failed or not available:', error.message);
      this.results.aggregated.integration_tests = {
        name: 'Integration Tests',
        type: 'integration',
        status: 'failed',
        tests: 0,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: 0,
        error: error.message
      };
    }
  }

  // Run performance tests
  async runPerformanceTests() {
    console.log('🚀 Running performance tests...');
    
    try {
      // Run Vitest performance tests
      const vitestCommand = 'npm run test:performance -- --reporter=json --outputFile=test-results/performance-vitest-results.json --run';
      execSync(vitestCommand, { stdio: 'inherit' });

      // Run Artillery load tests if available
      try {
        const artilleryCommand = 'npm run test:load';
        execSync(artilleryCommand, { stdio: 'inherit' });
      } catch (artilleryError) {
        console.warn('⚠️  Artillery load tests not available:', artilleryError.message);
      }

      // Load and merge performance results
      const vitestResults = this.loadJsonResults('test-results/performance-vitest-results.json');
      const loadResults = this.loadJsonResults('performance-results/performance-metrics.json');

      if (vitestResults || loadResults) {
        this.results.aggregated.performance_tests = this.mergePerformanceResults(vitestResults, loadResults);
        this.results.sources.push('performance-test-results.json');
        console.log('✅ Performance tests completed');
      }
    } catch (error) {
      console.warn('⚠️  Performance tests failed:', error.message);
      this.results.aggregated.performance_tests = {
        name: 'Performance Tests',
        type: 'performance',
        status: 'failed',
        tests: 0,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: 0,
        error: error.message
      };
    }
  }

  // Run E2E tests (if available)
  async runE2ETests() {
    console.log('🎭 Checking for E2E tests...');
    
    // Check if Playwright is configured
    const playwrightConfigExists = fs.existsSync('playwright.config.js') || fs.existsSync('playwright.config.ts');
    
    if (!playwrightConfigExists) {
      console.log('⏭️  E2E tests not configured, skipping...');
      return;
    }

    try {
      const command = 'npx playwright test --reporter=json > test-results/e2e-test-results.json';
      execSync(command, { stdio: 'pipe' });
      
      const results = this.loadJsonResults('test-results/e2e-test-results.json');
      if (results) {
        this.results.aggregated.e2e_tests = this.normalizePlaywrightResults(results);
        this.results.sources.push('e2e-test-results.json');
        console.log('✅ E2E tests completed');
      }
    } catch (error) {
      console.warn('⚠️  E2E tests failed:', error.message);
      this.results.aggregated.e2e_tests = {
        name: 'E2E Tests',
        type: 'e2e',
        status: 'failed',
        tests: 0,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: 0,
        error: error.message
      };
    }
  }

  // Generate coverage report
  async generateCoverage() {
    console.log('📋 Generating coverage report...');
    
    try {
      const command = 'npm run test:coverage -- --run';
      execSync(command, { stdio: 'inherit' });
      
      const coverageResults = this.loadJsonResults('coverage/coverage-summary.json');
      if (coverageResults) {
        this.results.aggregated.coverage = this.normalizeCoverageResults(coverageResults);
        this.results.sources.push('coverage-summary.json');
        console.log('✅ Coverage report generated');
      }
    } catch (error) {
      console.warn('⚠️  Coverage generation failed:', error.message);
    }
  }

  // Run quality checks
  async runQualityChecks() {
    console.log('🔍 Running quality checks...');
    
    try {
      // Run ESLint with JSON output
      const command = 'npx eslint . --format json --output-file eslint-results.json || true';
      execSync(command, { stdio: 'inherit' });
      
      const eslintResults = this.loadJsonResults('eslint-results.json');
      if (eslintResults) {
        this.results.aggregated.quality_metrics = this.normalizeESLintResults(eslintResults);
        this.results.sources.push('eslint-results.json');
        console.log('✅ Quality checks completed');
      }
    } catch (error) {
      console.warn('⚠️  Quality checks failed:', error.message);
    }
  }

  // Helper methods for loading and normalizing results
  loadJsonResults(filePath) {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`⚠️  Failed to parse ${filePath}:`, error.message);
      return null;
    }
  }

  normalizeVitestResults(results, type) {
    const testResults = results.testResults || [];
    const passed = testResults.filter(t => t.status === 'passed').length;
    const failed = testResults.filter(t => t.status === 'failed').length;
    const skipped = testResults.filter(t => t.status === 'skipped' || t.status === 'pending').length;
    const total = testResults.length;

    return {
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Tests`,
      type: type,
      status: failed > 0 ? 'failed' : 'passed',
      tests: total,
      passed: passed,
      failed: failed,
      skipped: skipped,
      duration: results.runTime || 0,
      details: testResults.map(test => ({
        name: test.title || test.name,
        status: test.status,
        duration: test.duration || 0,
        error: test.error || null
      }))
    };
  }

  normalizePlaywrightResults(results) {
    const tests = results.tests || [];
    const passed = tests.filter(t => t.outcome === 'passed').length;
    const failed = tests.filter(t => t.outcome === 'failed').length;
    const skipped = tests.filter(t => t.outcome === 'skipped').length;
    const total = tests.length;

    return {
      name: 'E2E Tests',
      type: 'e2e',
      status: failed > 0 ? 'failed' : 'passed',
      tests: total,
      passed: passed,
      failed: failed,
      skipped: skipped,
      duration: results.stats?.duration || 0,
      details: tests.map(test => ({
        name: test.title,
        status: test.outcome,
        duration: test.duration || 0,
        error: test.error || null
      }))
    };
  }

  mergePerformanceResults(vitestResults, loadResults) {
    let tests = 0, passed = 0, failed = 0, duration = 0;
    
    // Process Vitest performance results
    if (vitestResults) {
      const vitestNormalized = this.normalizeVitestResults(vitestResults, 'performance');
      tests += vitestNormalized.tests;
      passed += vitestNormalized.passed;
      failed += vitestNormalized.failed;
      duration += vitestNormalized.duration;
    }

    // Process load test results
    if (loadResults) {
      const successRate = this.calculatePerformanceSuccessRate(loadResults);
      tests += 1;
      if (successRate > 90) {
        passed += 1;
      } else {
        failed += 1;
      }
      duration += loadResults.duration || 0;
    }

    return {
      name: 'Performance Tests',
      type: 'performance',
      status: failed > 0 ? 'failed' : 'passed',
      tests: tests,
      passed: passed,
      failed: failed,
      skipped: 0,
      duration: duration,
      load_test_results: loadResults
    };
  }

  calculatePerformanceSuccessRate(perfResults) {
    const totalRequests = perfResults.counters?.['http.requests'] || 0;
    const totalErrors = Object.values(perfResults.errors || {}).reduce((sum, count) => sum + (count || 0), 0);
    
    if (totalRequests === 0) return 0;
    return ((totalRequests - totalErrors) / totalRequests) * 100;
  }

  normalizeCoverageResults(coverageResults) {
    const total = coverageResults.total || {};
    
    return {
      lines: {
        pct: total.lines?.pct || 0,
        covered: total.lines?.covered || 0,
        skipped: total.lines?.skipped || 0,
        total: total.lines?.total || 0
      },
      functions: {
        pct: total.functions?.pct || 0,
        covered: total.functions?.covered || 0,
        skipped: total.functions?.skipped || 0,
        total: total.functions?.total || 0
      },
      branches: {
        pct: total.branches?.pct || 0,
        covered: total.branches?.covered || 0,
        skipped: total.branches?.skipped || 0,
        total: total.branches?.total || 0
      },
      statements: {
        pct: total.statements?.pct || 0,
        covered: total.statements?.covered || 0,
        skipped: total.statements?.skipped || 0,
        total: total.statements?.total || 0
      }
    };
  }

  normalizeESLintResults(eslintResults) {
    const totalFiles = eslintResults.length;
    const totalErrors = eslintResults.reduce((sum, file) => sum + file.errorCount, 0);
    const totalWarnings = eslintResults.reduce((sum, file) => sum + file.warningCount, 0);
    const filesWithIssues = eslintResults.filter(file => file.errorCount > 0 || file.warningCount > 0).length;

    return {
      eslint: {
        total_files: totalFiles,
        files_with_issues: filesWithIssues,
        total_errors: totalErrors,
        total_warnings: totalWarnings,
        quality_score: this.calculateQualityScore(totalErrors, totalWarnings, totalFiles),
        details: eslintResults
          .filter(file => file.errorCount > 0 || file.warningCount > 0)
          .map(file => ({
            file: file.filePath,
            errors: file.errorCount,
            warnings: file.warningCount,
            messages: file.messages
          }))
      }
    };
  }

  calculateQualityScore(errors, warnings, totalFiles) {
    if (totalFiles === 0) return 100;
    
    const errorPenalty = errors * 10;
    const warningPenalty = warnings * 2;
    const totalPenalty = errorPenalty + warningPenalty;
    const maxPossiblePenalty = totalFiles * 20;
    
    return Math.max(0, 100 - (totalPenalty / maxPossiblePenalty) * 100);
  }

  // Calculate aggregate summary
  calculateSummary() {
    const testSuites = [
      this.results.aggregated.unit_tests,
      this.results.aggregated.integration_tests,
      this.results.aggregated.performance_tests,
      this.results.aggregated.e2e_tests
    ].filter(Boolean);

    this.results.summary = {
      total_tests: testSuites.reduce((sum, suite) => sum + (suite.tests || 0), 0),
      passed_tests: testSuites.reduce((sum, suite) => sum + (suite.passed || 0), 0),
      failed_tests: testSuites.reduce((sum, suite) => sum + (suite.failed || 0), 0),
      skipped_tests: testSuites.reduce((sum, suite) => sum + (suite.skipped || 0), 0),
      total_duration: testSuites.reduce((sum, suite) => sum + (suite.duration || 0), 0),
    };

    this.results.summary.success_rate = this.results.summary.total_tests > 0 
      ? (this.results.summary.passed_tests / this.results.summary.total_tests) * 100 
      : 0;
  }

  // Run all tests and generate aggregated results
  async runAll() {
    console.log('🚀 Starting comprehensive test suite...\n');
    
    this.ensureResultsDirectory();
    
    // Run all test suites
    await this.runUnitTests();
    await this.runIntegrationTests();
    await this.runPerformanceTests();
    await this.runE2ETests();
    
    // Generate reports
    await this.generateCoverage();
    await this.runQualityChecks();
    
    // Calculate summary
    this.calculateSummary();
    
    return this.results;
  }

  // Save aggregated results
  saveResults(outputPath = 'test-results/aggregated-results.json') {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
    console.log(`💾 Aggregated results saved: ${outputPath}`);
    
    return outputPath;
  }

  // Generate summary report
  generateSummaryReport() {
    console.log('\n📊 Test Execution Summary:');
    console.log('─'.repeat(50));
    
    const { summary } = this.results;
    console.log(`📈 Total Tests: ${summary.total_tests}`);
    console.log(`✅ Passed: ${summary.passed_tests}`);
    console.log(`❌ Failed: ${summary.failed_tests}`);
    console.log(`⏭️  Skipped: ${summary.skipped_tests}`);
    console.log(`📊 Success Rate: ${summary.success_rate.toFixed(1)}%`);
    console.log(`⏱️  Total Duration: ${(summary.total_duration / 1000).toFixed(1)}s`);
    
    console.log('\n🧪 Test Suite Results:');
    console.log('─'.repeat(50));
    
    const suites = [
      ['Unit Tests', this.results.aggregated.unit_tests],
      ['Integration Tests', this.results.aggregated.integration_tests],
      ['Performance Tests', this.results.aggregated.performance_tests],
      ['E2E Tests', this.results.aggregated.e2e_tests]
    ];

    suites.forEach(([name, suite]) => {
      if (suite) {
        const status = suite.status === 'passed' ? '✅' : '❌';
        console.log(`${status} ${name}: ${suite.passed}/${suite.tests} passed`);
      } else {
        console.log(`⏭️  ${name}: Not executed`);
      }
    });

    if (this.results.aggregated.coverage) {
      const coverage = this.results.aggregated.coverage;
      console.log('\n📋 Coverage Report:');
      console.log('─'.repeat(50));
      console.log(`Lines: ${coverage.lines.pct}%`);
      console.log(`Functions: ${coverage.functions.pct}%`);
      console.log(`Branches: ${coverage.branches.pct}%`);
      console.log(`Statements: ${coverage.statements.pct}%`);
    }

    if (this.results.aggregated.quality_metrics) {
      const quality = this.results.aggregated.quality_metrics.eslint;
      console.log('\n🔍 Quality Metrics:');
      console.log('─'.repeat(50));
      console.log(`ESLint Errors: ${quality.total_errors}`);
      console.log(`ESLint Warnings: ${quality.total_warnings}`);
      console.log(`Quality Score: ${quality.quality_score.toFixed(1)}/100`);
    }

    console.log('\n📄 Generated Sources:');
    console.log('─'.repeat(50));
    this.results.sources.forEach(source => {
      console.log(`📄 ${source}`);
    });
  }
}

// Main execution
async function main() {
  try {
    const aggregator = new TestResultsAggregator();
    const results = await aggregator.runAll();
    
    const outputPath = aggregator.saveResults();
    aggregator.generateSummaryReport();
    
    console.log(`\n✅ Test aggregation completed successfully!`);
    console.log(`📄 Results saved to: ${outputPath}`);
    
    // Exit with appropriate code
    if (results.summary.failed_tests > 0) {
      console.log('\n❌ Some tests failed!');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Test aggregation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { TestResultsAggregator };
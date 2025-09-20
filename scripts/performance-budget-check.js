#!/usr/bin/env node

/**
 * Performance Budget Check Script
 * Validates that performance metrics meet defined budgets and thresholds
 */

const fs = require('fs');
const path = require('path');

const PERFORMANCE_CONFIG_PATH = '.github/performance-config.yml';
const RESULTS_PATH = 'performance-results/performance-metrics.json';

// Default performance budgets (can be overridden by config)
const DEFAULT_BUDGETS = {
  response_time: {
    p50: 500,    // 500ms
    p75: 800,    // 800ms
    p90: 1200,   // 1.2s
    p95: 2000,   // 2s
    p99: 5000    // 5s
  },
  error_rates: {
    max_error_rate: 1.0,      // 1%
    max_timeout_rate: 0.5,    // 0.5%
    max_5xx_rate: 0.1         // 0.1%
  },
  throughput: {
    min_requests_per_sec: 10  // Minimum 10 RPS
  },
  resources: {
    max_cpu_usage: 80,        // 80%
    max_memory_usage: 85      // 85%
  }
};

async function loadConfig() {
  try {
    if (fs.existsSync(PERFORMANCE_CONFIG_PATH)) {
      const yaml = require('js-yaml');
      const configContent = fs.readFileSync(PERFORMANCE_CONFIG_PATH, 'utf8');
      const config = yaml.load(configContent);
      return config.performance?.thresholds || DEFAULT_BUDGETS.response_time;
    }
  } catch (error) {
    console.warn('Could not load performance config, using defaults:', error.message);
  }
  return DEFAULT_BUDGETS;
}

function loadPerformanceResults() {
  if (!fs.existsSync(RESULTS_PATH)) {
    console.error(`❌ Performance results not found at: ${RESULTS_PATH}`);
    console.log('Run performance tests first: npm run test:performance');
    process.exit(1);
  }

  try {
    const resultsContent = fs.readFileSync(RESULTS_PATH, 'utf8');
    return JSON.parse(resultsContent);
  } catch (error) {
    console.error('❌ Failed to parse performance results:', error.message);
    process.exit(1);
  }
}

function validateBudget(metrics, budgets) {
  const violations = [];
  const summary = {
    passed: 0,
    failed: 0,
    checks: []
  };

  // Response time budget checks
  if (budgets.response_time) {
    const checks = [
      { name: 'P50 Response Time', actual: metrics.latency?.median, budget: budgets.response_time.p50, unit: 'ms' },
      { name: 'P95 Response Time', actual: metrics.latency?.p95, budget: budgets.response_time.p95, unit: 'ms' },
      { name: 'P99 Response Time', actual: metrics.latency?.p99, budget: budgets.response_time.p99, unit: 'ms' }
    ];

    checks.forEach(check => {
      if (check.actual !== undefined && check.budget !== undefined) {
        const passed = check.actual <= check.budget;
        summary.checks.push({
          ...check,
          passed,
          message: `${check.name}: ${check.actual}${check.unit} (budget: ${check.budget}${check.unit})`
        });

        if (passed) {
          summary.passed++;
        } else {
          summary.failed++;
          violations.push(`${check.name} exceeded budget: ${check.actual}${check.unit} > ${check.budget}${check.unit}`);
        }
      }
    });
  }

  // Error rate budget checks
  if (budgets.error_rates && metrics.counters) {
    const totalRequests = metrics.counters['http.requests'] || 0;
    const errors = metrics.errors || {};
    const totalErrors = Object.values(errors).reduce((sum, count) => sum + (count || 0), 0);
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    const errorCheck = {
      name: 'Error Rate',
      actual: errorRate,
      budget: budgets.error_rates.max_error_rate,
      unit: '%',
      passed: errorRate <= budgets.error_rates.max_error_rate,
      message: `Error Rate: ${errorRate.toFixed(2)}% (budget: ${budgets.error_rates.max_error_rate}%)`
    };

    summary.checks.push(errorCheck);

    if (errorCheck.passed) {
      summary.passed++;
    } else {
      summary.failed++;
      violations.push(`Error rate exceeded budget: ${errorRate.toFixed(2)}% > ${budgets.error_rates.max_error_rate}%`);
    }
  }

  // Throughput budget checks
  if (budgets.throughput && metrics.rates) {
    const requestRate = metrics.rates['http.request_rate'] || 0;
    const throughputCheck = {
      name: 'Request Rate',
      actual: requestRate,
      budget: budgets.throughput.min_requests_per_sec,
      unit: ' RPS',
      passed: requestRate >= budgets.throughput.min_requests_per_sec,
      message: `Request Rate: ${requestRate} RPS (budget: min ${budgets.throughput.min_requests_per_sec} RPS)`
    };

    summary.checks.push(throughputCheck);

    if (throughputCheck.passed) {
      summary.passed++;
    } else {
      summary.failed++;
      violations.push(`Request rate below budget: ${requestRate} RPS < ${budgets.throughput.min_requests_per_sec} RPS`);
    }
  }

  return { violations, summary };
}

function generateReport(results, budgets, validation) {
  const report = {
    timestamp: new Date().toISOString(),
    budget_validation: {
      status: validation.violations.length === 0 ? 'PASSED' : 'FAILED',
      total_checks: validation.summary.passed + validation.summary.failed,
      passed_checks: validation.summary.passed,
      failed_checks: validation.summary.failed,
      violations: validation.violations
    },
    performance_metrics: {
      duration: results.duration,
      concurrent_users: results.concurrent_users,
      total_requests: results.counters?.['http.requests'] || 0,
      request_rate: results.rates?.['http.request_rate'] || 0,
      latency: results.latency,
      errors: results.errors
    },
    budget_details: budgets,
    detailed_checks: validation.summary.checks
  };

  const reportPath = 'performance-results/budget-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📊 Budget report saved to: ${reportPath}`);

  return report;
}

function printSummary(report) {
  console.log('\n📊 Performance Budget Validation Results');
  console.log('==========================================');

  const status = report.budget_validation.status;
  const statusIcon = status === 'PASSED' ? '✅' : '❌';
  
  console.log(`${statusIcon} Overall Status: ${status}`);
  console.log(`📈 Checks Passed: ${report.budget_validation.passed_checks}/${report.budget_validation.total_checks}`);

  if (report.budget_validation.violations.length > 0) {
    console.log('\n❌ Budget Violations:');
    report.budget_validation.violations.forEach((violation, index) => {
      console.log(`   ${index + 1}. ${violation}`);
    });
  }

  console.log('\n📋 Detailed Results:');
  report.detailed_checks.forEach(check => {
    const icon = check.passed ? '✅' : '❌';
    console.log(`   ${icon} ${check.message}`);
  });

  console.log('\n📊 Performance Summary:');
  console.log(`   Duration: ${report.performance_metrics.duration}s`);
  console.log(`   Concurrent Users: ${report.performance_metrics.concurrent_users}`);
  console.log(`   Total Requests: ${report.performance_metrics.total_requests}`);
  console.log(`   Request Rate: ${report.performance_metrics.request_rate} RPS`);
  console.log(`   P95 Latency: ${report.performance_metrics.latency?.p95}ms`);
  console.log(`   P99 Latency: ${report.performance_metrics.latency?.p99}ms`);
}

async function main() {
  try {
    console.log('🔍 Performance Budget Check Starting...\n');

    const budgets = await loadConfig();
    const results = loadPerformanceResults();
    const validation = validateBudget(results, budgets);
    const report = generateReport(results, budgets, validation);

    printSummary(report);

    // Exit with error code if budget validation failed
    if (report.budget_validation.status === 'FAILED') {
      console.log('\n❌ Performance budget validation failed!');
      process.exit(1);
    } else {
      console.log('\n✅ Performance budget validation passed!');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Performance budget check failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { validateBudget, loadConfig, DEFAULT_BUDGETS };
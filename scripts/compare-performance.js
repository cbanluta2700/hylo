#!/usr/bin/env node

/**
 * Performance Comparison Script
 * Compares current performance results against baseline for regression detection
 */

const fs = require('fs');
const path = require('path');

const CURRENT_RESULTS_PATH = 'performance-results/performance-metrics.json';
const BASELINE_PATH = 'performance-results/baseline-metrics.json';
const COMPARISON_REPORT_PATH = 'performance-results/comparison-report.json';

// Regression thresholds (percentage increases that trigger warnings/failures)
const REGRESSION_THRESHOLDS = {
  latency: {
    p50: { warning: 15, critical: 25 },    // 15% warning, 25% critical
    p95: { warning: 20, critical: 35 },    // 20% warning, 35% critical
    p99: { warning: 15, critical: 30 }     // 15% warning, 30% critical
  },
  throughput: {
    request_rate: { warning: -10, critical: -20 }  // 10% warning, 20% critical decrease
  },
  errors: {
    error_rate: { warning: 50, critical: 100 }     // 50% warning, 100% critical increase
  }
};

function loadResults() {
  const results = {};

  // Load current results
  if (!fs.existsSync(CURRENT_RESULTS_PATH)) {
    console.error(`❌ Current results not found at: ${CURRENT_RESULTS_PATH}`);
    console.log('Run performance tests first: npm run test:performance');
    process.exit(1);
  }

  try {
    results.current = JSON.parse(fs.readFileSync(CURRENT_RESULTS_PATH, 'utf8'));
  } catch (error) {
    console.error('❌ Failed to parse current results:', error.message);
    process.exit(1);
  }

  // Load baseline results
  if (!fs.existsSync(BASELINE_PATH)) {
    console.error(`❌ Baseline not found at: ${BASELINE_PATH}`);
    console.log('Create baseline first: npm run test:performance:baseline');
    process.exit(1);
  }

  try {
    results.baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  } catch (error) {
    console.error('❌ Failed to parse baseline:', error.message);
    process.exit(1);
  }

  return results;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((o, p) => o?.[p], obj);
}

function calculatePercentageChange(current, baseline) {
  if (!baseline || baseline === 0) return null;
  return ((current - baseline) / baseline) * 100;
}

function analyzeMetric(current, baseline, thresholds, metricName, isInverted = false) {
  const change = calculatePercentageChange(current, baseline);
  
  if (change === null) {
    return {
      name: metricName,
      current,
      baseline,
      change: null,
      changePercent: null,
      status: 'unknown',
      message: 'Unable to calculate change (baseline is 0 or missing)'
    };
  }

  // For inverted metrics (like request rate), we invert the change for evaluation
  const evaluationChange = isInverted ? -change : change;
  
  let status = 'pass';
  let message = 'Performance maintained';

  if (evaluationChange > thresholds.critical) {
    status = 'critical';
    message = `Critical regression detected (${change.toFixed(2)}% change)`;
  } else if (evaluationChange > thresholds.warning) {
    status = 'warning';
    message = `Performance regression warning (${change.toFixed(2)}% change)`;
  } else if (evaluationChange < -5) { // Improvement threshold
    status = 'improvement';
    message = `Performance improvement (${change.toFixed(2)}% change)`;
  }

  return {
    name: metricName,
    current,
    baseline,
    change,
    changePercent: change,
    status,
    message,
    thresholds
  };
}

function performComparison(results) {
  const current = results.current;
  const baseline = results.baseline.metrics || results.baseline;

  const comparison = {
    timestamp: new Date().toISOString(),
    current_sha: current.git_sha || 'unknown',
    baseline_sha: baseline.git_sha || 'unknown',
    baseline_timestamp: results.baseline.timestamp,
    metrics: {},
    summary: {
      total_checks: 0,
      passed: 0,
      warnings: 0,
      critical: 0,
      improvements: 0,
      regressions_detected: false
    }
  };

  // Compare latency metrics
  const latencyMetrics = [
    { path: 'latency.median', name: 'P50 Latency', unit: 'ms' },
    { path: 'latency.p95', name: 'P95 Latency', unit: 'ms' },
    { path: 'latency.p99', name: 'P99 Latency', unit: 'ms' }
  ];

  latencyMetrics.forEach(metric => {
    const currentVal = getNestedValue(current, metric.path);
    const baselineVal = getNestedValue(baseline, metric.path);
    
    if (currentVal !== undefined && baselineVal !== undefined) {
      const thresholds = REGRESSION_THRESHOLDS.latency[metric.path.split('.')[1]];
      const analysis = analyzeMetric(currentVal, baselineVal, thresholds, metric.name);
      
      comparison.metrics[metric.path] = {
        ...analysis,
        unit: metric.unit
      };
      
      comparison.summary.total_checks++;
      comparison.summary[analysis.status]++;
      
      if (analysis.status === 'critical' || analysis.status === 'warning') {
        comparison.summary.regressions_detected = true;
      }
    }
  });

  // Compare throughput metrics
  const requestRateMetrics = [
    { path: 'rates.http.request_rate', name: 'Request Rate', unit: 'RPS' }
  ];

  requestRateMetrics.forEach(metric => {
    const currentVal = getNestedValue(current, metric.path);
    const baselineVal = getNestedValue(baseline, metric.path);
    
    if (currentVal !== undefined && baselineVal !== undefined) {
      const thresholds = REGRESSION_THRESHOLDS.throughput.request_rate;
      const analysis = analyzeMetric(currentVal, baselineVal, thresholds, metric.name, true);
      
      comparison.metrics[metric.path] = {
        ...analysis,
        unit: metric.unit
      };
      
      comparison.summary.total_checks++;
      comparison.summary[analysis.status]++;
      
      if (analysis.status === 'critical' || analysis.status === 'warning') {
        comparison.summary.regressions_detected = true;
      }
    }
  });

  // Compare error rates
  const totalRequests = current.counters?.['http.requests'] || 0;
  const baselineTotalRequests = baseline.counters?.['http.requests'] || 0;
  
  if (totalRequests > 0 && baselineTotalRequests > 0) {
    const currentErrors = Object.values(current.errors || {}).reduce((sum, count) => sum + (count || 0), 0);
    const baselineErrors = Object.values(baseline.errors || {}).reduce((sum, count) => sum + (count || 0), 0);
    
    const currentErrorRate = (currentErrors / totalRequests) * 100;
    const baselineErrorRate = (baselineErrors / baselineTotalRequests) * 100;
    
    const thresholds = REGRESSION_THRESHOLDS.errors.error_rate;
    const analysis = analyzeMetric(currentErrorRate, baselineErrorRate, thresholds, 'Error Rate');
    
    comparison.metrics['errors.error_rate'] = {
      ...analysis,
      unit: '%'
    };
    
    comparison.summary.total_checks++;
    comparison.summary[analysis.status]++;
    
    if (analysis.status === 'critical' || analysis.status === 'warning') {
      comparison.summary.regressions_detected = true;
    }
  }

  return comparison;
}

function generateReport(comparison) {
  // Save detailed comparison report
  fs.writeFileSync(COMPARISON_REPORT_PATH, JSON.stringify(comparison, null, 2));

  // Create summary report for CI
  const summaryReport = {
    regression_detected: comparison.summary.regressions_detected,
    total_checks: comparison.summary.total_checks,
    critical_issues: comparison.summary.critical,
    warnings: comparison.summary.warnings,
    improvements: comparison.summary.improvements,
    status: comparison.summary.critical > 0 ? 'failed' : 
            comparison.summary.warnings > 0 ? 'warning' : 'passed',
    timestamp: comparison.timestamp
  };

  const summaryPath = 'performance-results/comparison-summary.json';
  fs.writeFileSync(summaryPath, JSON.stringify(summaryReport, null, 2));

  return { comparison, summary: summaryReport };
}

function printComparisonResults(comparison) {
  console.log('\n📊 Performance Comparison Results');
  console.log('================================');

  const summary = comparison.summary;
  const statusIcon = summary.regressions_detected ? '❌' : '✅';
  const status = summary.critical > 0 ? 'FAILED' : summary.warnings > 0 ? 'WARNING' : 'PASSED';
  
  console.log(`${statusIcon} Overall Status: ${status}`);
  console.log(`📋 Total Checks: ${summary.total_checks}`);
  
  if (summary.improvements > 0) {
    console.log(`🎉 Improvements: ${summary.improvements}`);
  }
  if (summary.warnings > 0) {
    console.log(`⚠️  Warnings: ${summary.warnings}`);
  }
  if (summary.critical > 0) {
    console.log(`🚨 Critical Issues: ${summary.critical}`);
  }

  console.log('\n📈 Detailed Comparison:');
  console.log(`   Baseline: ${new Date(comparison.baseline_timestamp).toLocaleString()}`);
  console.log(`   Current:  ${new Date(comparison.timestamp).toLocaleString()}`);

  console.log('\n📊 Metric Analysis:');
  Object.entries(comparison.metrics).forEach(([key, metric]) => {
    const statusIcons = {
      pass: '✅',
      improvement: '🎉',
      warning: '⚠️',
      critical: '🚨',
      unknown: '❓'
    };
    
    const icon = statusIcons[metric.status] || '❓';
    const changeStr = metric.changePercent !== null ? 
      `${metric.changePercent >= 0 ? '+' : ''}${metric.changePercent.toFixed(2)}%` : 
      'N/A';
    
    console.log(`   ${icon} ${metric.name}: ${metric.current}${metric.unit} (${changeStr})`);
    
    if (metric.status !== 'pass' && metric.status !== 'unknown') {
      console.log(`      ${metric.message}`);
      console.log(`      Baseline: ${metric.baseline}${metric.unit}`);
    }
  });
}

async function main() {
  try {
    console.log('🔍 Performance Comparison Starting...\n');

    // Ensure results directory exists
    const resultsDir = path.dirname(COMPARISON_REPORT_PATH);
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const results = loadResults();
    const comparison = performComparison(results);
    const reports = generateReport(comparison);

    printComparisonResults(comparison);

    console.log(`\n💾 Detailed report saved to: ${COMPARISON_REPORT_PATH}`);
    console.log(`📋 Summary report saved to: performance-results/comparison-summary.json`);

    // Set exit code based on results
    if (comparison.summary.critical > 0) {
      console.log('\n❌ Critical performance regressions detected!');
      process.exit(1);
    } else if (comparison.summary.warnings > 0) {
      console.log('\n⚠️  Performance warnings detected.');
      process.exit(0); // Don't fail CI for warnings
    } else {
      console.log('\n✅ No performance regressions detected.');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Performance comparison failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { performComparison, analyzeMetric, REGRESSION_THRESHOLDS };
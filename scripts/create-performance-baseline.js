#!/usr/bin/env node

/**
 * Performance Baseline Creation Script
 * Creates or updates performance baselines for regression detection
 */

const fs = require('fs');
const path = require('path');

const RESULTS_PATH = 'performance-results/performance-metrics.json';
const BASELINE_PATH = 'performance-results/baseline-metrics.json';
const BASELINE_HISTORY_PATH = 'performance-results/baseline-history.json';

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

function loadBaselineHistory() {
  if (!fs.existsSync(BASELINE_HISTORY_PATH)) {
    return [];
  }

  try {
    const historyContent = fs.readFileSync(BASELINE_HISTORY_PATH, 'utf8');
    return JSON.parse(historyContent);
  } catch (error) {
    console.warn('⚠️  Could not load baseline history, starting fresh:', error.message);
    return [];
  }
}

function calculateMovingAverage(history, metricPath, windowSize = 5) {
  const values = history
    .slice(-windowSize)
    .map(entry => getNestedValue(entry.metrics, metricPath))
    .filter(val => val !== undefined && val !== null);

  if (values.length === 0) return undefined;
  
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((o, p) => o?.[p], obj);
}

function createBaseline(currentResults, history) {
  const baseline = {
    timestamp: new Date().toISOString(),
    git_sha: process.env.GITHUB_SHA || 'unknown',
    git_ref: process.env.GITHUB_REF || 'unknown',
    creation_method: 'automated',
    source: 'performance-baseline-script',
    metrics: { ...currentResults }
  };

  // If we have sufficient history, use moving averages for more stable baselines
  if (history.length >= 3) {
    baseline.creation_method = 'moving_average';
    baseline.window_size = Math.min(history.length, 5);
    
    // Calculate moving averages for key metrics
    const avgMetrics = {
      'latency.median': calculateMovingAverage(history, 'latency.median'),
      'latency.p95': calculateMovingAverage(history, 'latency.p95'),
      'latency.p99': calculateMovingAverage(history, 'latency.p99'),
      'rates.http.request_rate': calculateMovingAverage(history, 'rates.http.request_rate')
    };

    // Update baseline metrics with averages where available
    Object.entries(avgMetrics).forEach(([path, avgValue]) => {
      if (avgValue !== undefined) {
        const pathParts = path.split('.');
        let target = baseline.metrics;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
          target = target[pathParts[i]];
        }
        
        target[pathParts[pathParts.length - 1]] = Math.round(avgValue * 100) / 100;
      }
    });

    console.log(`📊 Created baseline using ${baseline.window_size}-point moving average`);
  } else {
    console.log('📊 Created baseline from current results (insufficient history for moving average)');
  }

  return baseline;
}

function updateBaselineHistory(newBaseline, history) {
  // Add new baseline to history
  history.push({
    timestamp: newBaseline.timestamp,
    git_sha: newBaseline.git_sha,
    git_ref: newBaseline.git_ref,
    metrics: newBaseline.metrics
  });

  // Keep only the last 20 entries to prevent unlimited growth
  const maxHistorySize = 20;
  if (history.length > maxHistorySize) {
    history = history.slice(-maxHistorySize);
  }

  return history;
}

function generateReport(baseline, history, wasUpdated) {
  const report = {
    action: wasUpdated ? 'updated' : 'created',
    timestamp: new Date().toISOString(),
    baseline: {
      created: baseline.timestamp,
      git_sha: baseline.git_sha,
      git_ref: baseline.git_ref,
      method: baseline.creation_method,
      window_size: baseline.window_size
    },
    metrics: {
      p50_latency: baseline.metrics.latency?.median,
      p95_latency: baseline.metrics.latency?.p95,
      p99_latency: baseline.metrics.latency?.p99,
      request_rate: baseline.metrics.rates?.['http.request_rate'],
      total_requests: baseline.metrics.counters?.['http.requests']
    },
    history: {
      total_entries: history.length,
      oldest_entry: history.length > 0 ? history[0].timestamp : null,
      newest_entry: history.length > 0 ? history[history.length - 1].timestamp : null
    }
  };

  const reportPath = 'performance-results/baseline-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  return report;
}

function printSummary(report) {
  console.log('\n📊 Performance Baseline Summary');
  console.log('==============================');

  const actionIcon = report.action === 'created' ? '🆕' : '🔄';
  console.log(`${actionIcon} Baseline ${report.action}: ${report.baseline.created}`);
  console.log(`📋 Method: ${report.baseline.method}`);
  
  if (report.baseline.window_size) {
    console.log(`📊 Window size: ${report.baseline.window_size} measurements`);
  }

  console.log(`🔗 Git SHA: ${report.baseline.git_sha.substring(0, 8)}`);
  console.log(`🌿 Git Ref: ${report.baseline.git_ref}`);

  console.log('\n📈 Baseline Metrics:');
  console.log(`   P50 Latency: ${report.metrics.p50_latency}ms`);
  console.log(`   P95 Latency: ${report.metrics.p95_latency}ms`);
  console.log(`   P99 Latency: ${report.metrics.p99_latency}ms`);
  console.log(`   Request Rate: ${report.metrics.request_rate} RPS`);
  console.log(`   Total Requests: ${report.metrics.total_requests}`);

  console.log('\n📚 History:');
  console.log(`   Total Entries: ${report.history.total_entries}`);
  if (report.history.oldest_entry) {
    console.log(`   Oldest Entry: ${new Date(report.history.oldest_entry).toLocaleDateString()}`);
  }
  if (report.history.newest_entry) {
    console.log(`   Newest Entry: ${new Date(report.history.newest_entry).toLocaleDateString()}`);
  }
}

async function main() {
  try {
    console.log('📊 Creating Performance Baseline...\n');

    // Ensure results directory exists
    const resultsDir = path.dirname(BASELINE_PATH);
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const currentResults = loadPerformanceResults();
    const history = loadBaselineHistory();
    
    // Check if baseline already exists
    const existingBaseline = fs.existsSync(BASELINE_PATH);
    const action = existingBaseline ? 'updated' : 'created';

    const newBaseline = createBaseline(currentResults, history);
    const updatedHistory = updateBaselineHistory(newBaseline, history);

    // Save baseline and history
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(newBaseline, null, 2));
    fs.writeFileSync(BASELINE_HISTORY_PATH, JSON.stringify(updatedHistory, null, 2));

    const report = generateReport(newBaseline, updatedHistory, existingBaseline);
    printSummary(report);

    console.log(`\n✅ Performance baseline ${action} successfully!`);
    console.log(`💾 Baseline saved to: ${BASELINE_PATH}`);
    console.log(`📚 History saved to: ${BASELINE_HISTORY_PATH}`);

  } catch (error) {
    console.error('❌ Failed to create performance baseline:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createBaseline, calculateMovingAverage };
#!/usr/bin/env node

/**
 * Test Results Visualizer
 * Creates interactive HTML dashboards for test results
 */

const fs = require('fs');
const path = require('path');

class TestResultsVisualizer {
  constructor() {
    this.reportData = null;
  }

  loadTestReport(filePath = 'test-results/comprehensive-report.json') {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Test report not found at: ${filePath}`);
    }

    try {
      this.reportData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return this.reportData;
    } catch (error) {
      throw new Error(`Failed to parse test report: ${error.message}`);
    }
  }

  generateInteractiveDashboard() {
    const data = this.reportData;
    const status = data.overall_status;
    const statusColor = status === 'passed' ? '#22c55e' : status === 'warning' ? '#f59e0b' : '#ef4444';
    const statusIcon = status === 'passed' ? '✅' : status === 'warning' ? '⚠️' : '❌';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hylo Travel AI - Interactive Test Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            background: white;
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            margin-bottom: 24px;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: ${statusColor};
        }
        
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 28px;
            font-weight: bold;
            color: ${statusColor};
            margin-bottom: 16px;
        }
        
        .title {
            font-size: 36px;
            font-weight: 800;
            color: #1f2937;
            margin-bottom: 8px;
        }
        
        .subtitle {
            color: #6b7280;
            font-size: 18px;
        }
        
        .metadata-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-top: 24px;
        }
        
        .metadata-item {
            background: #f9fafb;
            padding: 16px;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
        }
        
        .metadata-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
        }
        
        .metadata-value {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 24px;
            margin-bottom: 24px;
        }
        
        .card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .card-header {
            padding: 24px 24px 16px 24px;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .card-title {
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 8px;
        }
        
        .card-subtitle {
            color: #6b7280;
            font-size: 14px;
        }
        
        .card-body {
            padding: 24px;
        }
        
        .chart-container {
            position: relative;
            height: 300px;
            margin-bottom: 16px;
        }
        
        .metric-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .metric-row:last-child {
            border-bottom: none;
        }
        
        .metric-label {
            font-size: 14px;
            color: #374151;
        }
        
        .metric-value {
            font-size: 16px;
            font-weight: 600;
        }
        
        .success { color: #22c55e; }
        .warning { color: #f59e0b; }
        .error { color: #ef4444; }
        .neutral { color: #6b7280; }
        
        .progress-ring {
            transform: rotate(-90deg);
        }
        
        .progress-ring-circle {
            transition: stroke-dashoffset 0.35s;
            transform-origin: 50% 50%;
        }
        
        .test-suite-item {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            transition: all 0.2s;
        }
        
        .test-suite-item:hover {
            border-color: #d1d5db;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .suite-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .suite-name {
            font-weight: 600;
            color: #1f2937;
        }
        
        .suite-status {
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .suite-passed { background: #dcfce7; color: #166534; }
        .suite-failed { background: #fecaca; color: #991b1b; }
        .suite-warning { background: #fef3c7; color: #92400e; }
        
        .suite-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
            gap: 8px;
            font-size: 12px;
            color: #6b7280;
        }
        
        .full-width {
            grid-column: 1 / -1;
        }
        
        .performance-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 16px;
        }
        
        .performance-metric {
            text-align: center;
            padding: 16px;
            background: #f9fafb;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
        }
        
        .performance-value {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 4px;
        }
        
        .performance-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        @media (max-width: 768px) {
            .dashboard-grid {
                grid-template-columns: 1fr;
            }
            
            .metadata-grid {
                grid-template-columns: 1fr;
            }
            
            .title {
                font-size: 28px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="status-badge">${statusIcon} ${status.toUpperCase()}</div>
            <h1 class="title">Hylo Travel AI Test Dashboard</h1>
            <p class="subtitle">Comprehensive test results and performance metrics</p>
            
            <div class="metadata-grid">
                <div class="metadata-item">
                    <div class="metadata-label">Timestamp</div>
                    <div class="metadata-value">${new Date(data.timestamp).toLocaleString()}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Git SHA</div>
                    <div class="metadata-value">${data.git_sha.substring(0, 8)}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Git Ref</div>
                    <div class="metadata-value">${data.git_ref}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Duration</div>
                    <div class="metadata-value">${(data.summary.total_duration / 1000).toFixed(1)}s</div>
                </div>
            </div>
        </div>

        <!-- Dashboard Grid -->
        <div class="dashboard-grid">
            <!-- Test Summary Card -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">📊 Test Summary</div>
                    <div class="card-subtitle">${data.summary.total_tests} tests executed</div>
                </div>
                <div class="card-body">
                    <div class="chart-container">
                        <canvas id="summaryChart"></canvas>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Success Rate</span>
                        <span class="metric-value success">${data.summary.success_rate.toFixed(1)}%</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Total Duration</span>
                        <span class="metric-value neutral">${(data.summary.total_duration / 1000).toFixed(1)}s</span>
                    </div>
                </div>
            </div>

            <!-- Test Suites Card -->
            <div class="card full-width">
                <div class="card-header">
                    <div class="card-title">🧪 Test Suites</div>
                    <div class="card-subtitle">${data.test_suites.length} test suites</div>
                </div>
                <div class="card-body">
                    ${data.test_suites.map(suite => `
                        <div class="test-suite-item">
                            <div class="suite-header">
                                <span class="suite-name">${suite.name}</span>
                                <span class="suite-status suite-${suite.status}">${suite.status}</span>
                            </div>
                            <div class="suite-stats">
                                <div><strong>${suite.tests}</strong> Total</div>
                                <div><strong>${suite.passed}</strong> Passed</div>
                                <div><strong>${suite.failed}</strong> Failed</div>
                                <div><strong>${(suite.duration / 1000).toFixed(1)}s</strong> Duration</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            ${data.coverage ? `
            <!-- Coverage Card -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">📋 Code Coverage</div>
                    <div class="card-subtitle">${data.coverage.lines.pct}% line coverage</div>
                </div>
                <div class="card-body">
                    <div class="chart-container">
                        <canvas id="coverageChart"></canvas>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Lines</span>
                        <span class="metric-value">${data.coverage.lines.pct}%</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Functions</span>
                        <span class="metric-value">${data.coverage.functions.pct}%</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Branches</span>
                        <span class="metric-value">${data.coverage.branches.pct}%</span>
                    </div>
                </div>
            </div>
            ` : ''}

            ${data.performance ? `
            <!-- Performance Card -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">🚀 Performance Metrics</div>
                    <div class="card-subtitle">${data.performance.success_rate.toFixed(1)}% success rate</div>
                </div>
                <div class="card-body">
                    <div class="performance-grid">
                        <div class="performance-metric">
                            <div class="performance-value">${data.performance.total_requests.toLocaleString()}</div>
                            <div class="performance-label">Requests</div>
                        </div>
                        <div class="performance-metric">
                            <div class="performance-value">${data.performance.request_rate.toFixed(0)}</div>
                            <div class="performance-label">RPS</div>
                        </div>
                        <div class="performance-metric">
                            <div class="performance-value">${data.performance.latency.p95}</div>
                            <div class="performance-label">P95 (ms)</div>
                        </div>
                        <div class="performance-metric">
                            <div class="performance-value">${data.performance.success_rate.toFixed(1)}%</div>
                            <div class="performance-label">Success</div>
                        </div>
                    </div>
                    <div class="chart-container" style="margin-top: 24px;">
                        <canvas id="performanceChart"></canvas>
                    </div>
                </div>
            </div>
            ` : ''}

            ${data.quality_metrics ? `
            <!-- Quality Card -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">🔍 Code Quality</div>
                    <div class="card-subtitle">ESLint analysis results</div>
                </div>
                <div class="card-body">
                    <div class="metric-row">
                        <span class="metric-label">Quality Score</span>
                        <span class="metric-value">${data.quality_metrics.eslint.quality_score.toFixed(1)}/100</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Errors</span>
                        <span class="metric-value error">${data.quality_metrics.eslint.total_errors}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Warnings</span>
                        <span class="metric-value warning">${data.quality_metrics.eslint.total_warnings}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Files with Issues</span>
                        <span class="metric-value">${data.quality_metrics.eslint.files_with_issues}/${data.quality_metrics.eslint.total_files}</span>
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
    </div>

    <script>
        // Summary Chart
        const summaryCtx = document.getElementById('summaryChart').getContext('2d');
        new Chart(summaryCtx, {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Failed', 'Skipped'],
                datasets: [{
                    data: [${data.summary.passed_tests}, ${data.summary.failed_tests}, ${data.summary.skipped_tests}],
                    backgroundColor: ['#22c55e', '#ef4444', '#f59e0b'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    }
                }
            }
        });

        ${data.coverage ? `
        // Coverage Chart
        const coverageCtx = document.getElementById('coverageChart').getContext('2d');
        new Chart(coverageCtx, {
            type: 'bar',
            data: {
                labels: ['Lines', 'Functions', 'Branches', 'Statements'],
                datasets: [{
                    label: 'Coverage %',
                    data: [${data.coverage.lines.pct}, ${data.coverage.functions.pct}, ${data.coverage.branches.pct}, ${data.coverage.statements.pct}],
                    backgroundColor: '#3b82f6',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        ` : ''}

        ${data.performance ? `
        // Performance Chart
        const performanceCtx = document.getElementById('performanceChart').getContext('2d');
        new Chart(performanceCtx, {
            type: 'line',
            data: {
                labels: ['Min', 'Mean', 'P95', 'P99', 'Max'],
                datasets: [{
                    label: 'Latency (ms)',
                    data: [${data.performance.latency.min}, ${data.performance.latency.mean}, ${data.performance.latency.p95}, ${data.performance.latency.p99}, ${data.performance.latency.max}],
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + 'ms';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        ` : ''}
    </script>
</body>
</html>`;
  }

  generateDashboard(outputPath = 'test-results/interactive-dashboard.html') {
    const html = this.generateInteractiveDashboard();
    
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, html);
    console.log(`📊 Interactive dashboard generated: ${outputPath}`);
    
    return outputPath;
  }
}

// Main execution
async function main() {
  try {
    console.log('📊 Generating interactive test dashboard...\n');
    
    const visualizer = new TestResultsVisualizer();
    const report = visualizer.loadTestReport();
    const dashboardPath = visualizer.generateDashboard();
    
    console.log('\n✅ Dashboard generated successfully!');
    console.log(`📊 Open in browser: ${dashboardPath}`);
    
  } catch (error) {
    console.error('❌ Dashboard generation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { TestResultsVisualizer };
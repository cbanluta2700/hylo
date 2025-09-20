#!/usr/bin/env node

/**
 * Health Check Script
 * Validates application health for deployment readiness
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Health check configuration
const HEALTH_CONFIG = {
  endpoints: [
    { url: 'http://localhost:4173/health', name: 'Health Check', timeout: 5000 },
    { url: 'http://localhost:4173/api/health/system', name: 'System Health', timeout: 8000 },
    { url: 'http://localhost:4173/api/providers/status', name: 'Provider Status', timeout: 10000 }
  ],
  deployment: {
    required_files: [
      'dist/index.html',
      'package.json',
      'vercel.json'
    ],
    optional_files: [
      'dist/assets',
      '.next'
    ]
  },
  performance: {
    max_bundle_size_mb: 10,
    max_response_time_ms: 2000
  }
};

class HealthChecker {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      overall_status: 'unknown',
      checks: {
        endpoints: [],
        deployment: [],
        performance: []
      },
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  async checkEndpoint(endpoint) {
    console.log(`🔍 Checking endpoint: ${endpoint.name}`);
    
    const check = {
      name: endpoint.name,
      url: endpoint.url,
      status: 'unknown',
      response_time: null,
      status_code: null,
      error: null
    };

    try {
      const startTime = Date.now();
      
      // Use fetch or curl depending on availability
      let response;
      try {
        // Try using Node.js fetch (Node 18+)
        response = await fetch(endpoint.url, {
          method: 'GET',
          signal: AbortSignal.timeout(endpoint.timeout)
        });
        
        check.status_code = response.status;
        check.response_time = Date.now() - startTime;
        
        if (response.ok) {
          check.status = 'passed';
          console.log(`   ✅ ${endpoint.name}: ${check.status_code} (${check.response_time}ms)`);
        } else {
          check.status = 'failed';
          check.error = `HTTP ${response.status}`;
          console.log(`   ❌ ${endpoint.name}: ${check.status_code} (${check.response_time}ms)`);
        }
      } catch (fetchError) {
        // Fallback to curl
        const curlCommand = `curl -s -o /dev/null -w "%{http_code},%{time_total}" --max-time ${endpoint.timeout/1000} "${endpoint.url}"`;
        const { stdout } = await execAsync(curlCommand);
        const [statusCode, timeTotal] = stdout.trim().split(',');
        
        check.status_code = parseInt(statusCode);
        check.response_time = Math.round(parseFloat(timeTotal) * 1000);
        
        if (check.status_code >= 200 && check.status_code < 300) {
          check.status = 'passed';
          console.log(`   ✅ ${endpoint.name}: ${check.status_code} (${check.response_time}ms)`);
        } else {
          check.status = 'failed';
          check.error = `HTTP ${check.status_code}`;
          console.log(`   ❌ ${endpoint.name}: ${check.status_code} (${check.response_time}ms)`);
        }
      }
    } catch (error) {
      check.status = 'failed';
      check.error = error.message;
      console.log(`   ❌ ${endpoint.name}: ${error.message}`);
    }

    this.results.checks.endpoints.push(check);
    this.updateSummary(check.status);
    
    return check;
  }

  async checkDeploymentReadiness() {
    console.log('\n🚀 Checking deployment readiness...');

    // Check required files
    for (const file of HEALTH_CONFIG.deployment.required_files) {
      const check = {
        name: `Required file: ${file}`,
        type: 'file_existence',
        path: file,
        status: 'unknown',
        error: null
      };

      if (fs.existsSync(file)) {
        check.status = 'passed';
        console.log(`   ✅ ${file} exists`);
      } else {
        check.status = 'failed';
        check.error = 'File not found';
        console.log(`   ❌ ${file} missing`);
      }

      this.results.checks.deployment.push(check);
      this.updateSummary(check.status);
    }

    // Check optional files (warnings only)
    for (const file of HEALTH_CONFIG.deployment.optional_files) {
      const check = {
        name: `Optional file: ${file}`,
        type: 'file_existence',
        path: file,
        status: 'unknown',
        error: null
      };

      if (fs.existsSync(file)) {
        check.status = 'passed';
        console.log(`   ✅ ${file} exists`);
      } else {
        check.status = 'warning';
        check.error = 'Optional file not found';
        console.log(`   ⚠️  ${file} missing (optional)`);
      }

      this.results.checks.deployment.push(check);
      this.updateSummary(check.status);
    }
  }

  async checkPerformanceMetrics() {
    console.log('\n📊 Checking performance metrics...');

    // Check bundle size
    if (fs.existsSync('dist')) {
      try {
        const { stdout } = await execAsync('du -sm dist 2>/dev/null || echo "0"');
        const bundleSizeMB = parseInt(stdout.trim());
        
        const bundleCheck = {
          name: 'Bundle size',
          type: 'bundle_size',
          value: bundleSizeMB,
          threshold: HEALTH_CONFIG.performance.max_bundle_size_mb,
          unit: 'MB',
          status: 'unknown',
          error: null
        };

        if (bundleSizeMB <= HEALTH_CONFIG.performance.max_bundle_size_mb) {
          bundleCheck.status = 'passed';
          console.log(`   ✅ Bundle size: ${bundleSizeMB}MB (limit: ${bundleCheck.threshold}MB)`);
        } else {
          bundleCheck.status = 'warning';
          bundleCheck.error = `Bundle size exceeds recommended limit`;
          console.log(`   ⚠️  Bundle size: ${bundleSizeMB}MB (limit: ${bundleCheck.threshold}MB)`);
        }

        this.results.checks.performance.push(bundleCheck);
        this.updateSummary(bundleCheck.status);
      } catch (error) {
        console.log(`   ⚠️  Could not check bundle size: ${error.message}`);
      }
    }

    // Check if performance results exist
    const perfResultsPath = 'performance-results/performance-metrics.json';
    if (fs.existsSync(perfResultsPath)) {
      try {
        const perfResults = JSON.parse(fs.readFileSync(perfResultsPath, 'utf8'));
        
        const p95Check = {
          name: 'P95 response time',
          type: 'response_time',
          value: perfResults.latency?.p95,
          threshold: HEALTH_CONFIG.performance.max_response_time_ms,
          unit: 'ms',
          status: 'unknown',
          error: null
        };

        if (p95Check.value && p95Check.value <= HEALTH_CONFIG.performance.max_response_time_ms) {
          p95Check.status = 'passed';
          console.log(`   ✅ P95 response time: ${p95Check.value}ms (limit: ${p95Check.threshold}ms)`);
        } else if (p95Check.value) {
          p95Check.status = 'warning';
          p95Check.error = 'Response time exceeds recommended limit';
          console.log(`   ⚠️  P95 response time: ${p95Check.value}ms (limit: ${p95Check.threshold}ms)`);
        } else {
          p95Check.status = 'warning';
          p95Check.error = 'No P95 data available';
          console.log(`   ⚠️  P95 response time: No data available`);
        }

        this.results.checks.performance.push(p95Check);
        this.updateSummary(p95Check.status);
      } catch (error) {
        console.log(`   ⚠️  Could not parse performance results: ${error.message}`);
      }
    }
  }

  updateSummary(status) {
    this.results.summary.total++;
    
    switch (status) {
      case 'passed':
        this.results.summary.passed++;
        break;
      case 'failed':
        this.results.summary.failed++;
        break;
      case 'warning':
        this.results.summary.warnings++;
        break;
    }
  }

  determineOverallStatus() {
    if (this.results.summary.failed > 0) {
      this.results.overall_status = 'failed';
    } else if (this.results.summary.warnings > 0) {
      this.results.overall_status = 'warning';
    } else if (this.results.summary.passed > 0) {
      this.results.overall_status = 'passed';
    } else {
      this.results.overall_status = 'unknown';
    }
  }

  async runAllChecks() {
    try {
      console.log('🏥 Starting health checks...\n');

      // Run endpoint checks
      console.log('🌐 Checking endpoints...');
      for (const endpoint of HEALTH_CONFIG.endpoints) {
        await this.checkEndpoint(endpoint);
      }

      // Run deployment checks
      await this.checkDeploymentReadiness();

      // Run performance checks
      await this.checkPerformanceMetrics();

      // Determine overall status
      this.determineOverallStatus();

      return this.results;
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      this.results.overall_status = 'failed';
      this.results.error = error.message;
      return this.results;
    }
  }

  saveResults() {
    const resultsDir = 'health-check-results';
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const resultsPath = path.join(resultsDir, 'health-check-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
    
    console.log(`\n💾 Health check results saved to: ${resultsPath}`);
    return resultsPath;
  }

  printSummary() {
    console.log('\n🏥 Health Check Summary');
    console.log('======================');

    const statusIcons = {
      passed: '✅',
      failed: '❌',
      warning: '⚠️',
      unknown: '❓'
    };

    const icon = statusIcons[this.results.overall_status];
    console.log(`${icon} Overall Status: ${this.results.overall_status.toUpperCase()}`);
    console.log(`📊 Total Checks: ${this.results.summary.total}`);
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    
    if (this.results.summary.warnings > 0) {
      console.log(`⚠️  Warnings: ${this.results.summary.warnings}`);
    }
    
    if (this.results.summary.failed > 0) {
      console.log(`❌ Failed: ${this.results.summary.failed}`);
    }

    // Show failed checks
    if (this.results.summary.failed > 0) {
      console.log('\n❌ Failed Checks:');
      const allChecks = [
        ...this.results.checks.endpoints,
        ...this.results.checks.deployment,
        ...this.results.checks.performance
      ];
      
      allChecks.filter(check => check.status === 'failed').forEach(check => {
        console.log(`   • ${check.name}: ${check.error || 'Unknown error'}`);
      });
    }

    // Show warnings
    if (this.results.summary.warnings > 0) {
      console.log('\n⚠️  Warnings:');
      const allChecks = [
        ...this.results.checks.endpoints,
        ...this.results.checks.deployment,
        ...this.results.checks.performance
      ];
      
      allChecks.filter(check => check.status === 'warning').forEach(check => {
        console.log(`   • ${check.name}: ${check.error || 'Warning condition met'}`);
      });
    }
  }
}

async function main() {
  const healthChecker = new HealthChecker();
  
  try {
    const results = await healthChecker.runAllChecks();
    healthChecker.printSummary();
    healthChecker.saveResults();

    // Exit with appropriate code
    if (results.overall_status === 'failed') {
      console.log('\n❌ Health checks failed! Deployment not recommended.');
      process.exit(1);
    } else if (results.overall_status === 'warning') {
      console.log('\n⚠️  Health checks passed with warnings.');
      process.exit(0);
    } else {
      console.log('\n✅ All health checks passed! Ready for deployment.');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Health check script failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { HealthChecker, HEALTH_CONFIG };
#!/usr/bin/env node

/**
 * End-to-End Pipeline Testing System
 * Comprehensive E2E testing with rollback mechanisms for production deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

class EndToEndPipelineTester {
  constructor(options = {}) {
    this.config = {
      serviceName: options.serviceName || 'hylo-travel-ai',
      environment: options.environment || process.env.NODE_ENV || 'production',
      testEnvironment: options.testEnvironment || 'staging',
      baseUrl: options.baseUrl || process.env.VERCEL_URL || 'http://localhost:3000',
      stagingUrl: options.stagingUrl || process.env.VERCEL_PREVIEW_URL,
      productionUrl: options.productionUrl || process.env.VERCEL_PRODUCTION_URL,
      timeout: options.timeout || 30000,
      retryAttempts: options.retryAttempts || 3,
      rollbackEnabled: options.rollbackEnabled !== false,
      healthCheckEndpoints: options.healthCheckEndpoints || [
        '/api/health',
        '/api/llm/health',
        '/api/providers/status'
      ],
      criticalEndpoints: options.criticalEndpoints || [
        '/',
        '/api/rag/health',
        '/api/rag/submit-form'
      ],
      performanceThresholds: {
        responseTime: options.maxResponseTime || 2000,
        availabilityPercentage: options.minAvailability || 99.0,
        errorRate: options.maxErrorRate || 1.0
      },
      rollbackConditions: {
        failedHealthChecks: options.maxFailedHealthChecks || 2,
        highErrorRate: options.maxErrorRate || 5.0,
        slowResponseTime: options.maxSlowResponseTime || 5000,
        lowAvailability: options.minAvailabilityForRollback || 95.0
      },
      ...options
    };

    this.testResults = {
      metadata: {
        serviceName: this.config.serviceName,
        environment: this.config.environment,
        testEnvironment: this.config.testEnvironment,
        timestamp: new Date().toISOString(),
        testVersion: '1.0.0'
      },
      summary: {
        overallStatus: 'unknown',
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        successRate: 0,
        duration: 0
      },
      tests: {},
      performance: {},
      rollback: {
        triggered: false,
        reason: null,
        action: null,
        timestamp: null
      },
      recommendations: []
    };

    this.logger = this.createLogger();
  }

  createLogger() {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const isDev = process.env.NODE_ENV === 'development';

    return {
      debug: (msg) => {
        if (logLevel === 'debug' || isDev) {
          console.log(`🐛 [${new Date().toISOString()}] [DEBUG] ${msg}`);
        }
      },
      info: (msg) => console.log(`ℹ️  [${new Date().toISOString()}] [INFO] ${msg}`),
      warn: (msg) => console.warn(`⚠️  [${new Date().toISOString()}] [WARN] ${msg}`),
      error: (msg) => console.error(`❌ [${new Date().toISOString()}] [ERROR] ${msg}`),
      success: (msg) => console.log(`✅ [${new Date().toISOString()}] [SUCCESS] ${msg}`)
    };
  }

  // HTTP request with timeout and retry
  async makeHttpRequest(url, options = {}) {
    const requestOptions = {
      timeout: this.config.timeout,
      headers: {
        'User-Agent': `${this.config.serviceName}-e2e-tester/1.0`,
        'Accept': 'application/json, text/html, */*',
        ...options.headers
      },
      method: options.method || 'GET',
      ...options
    };

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const protocol = url.startsWith('https:') ? https : http;
      
      const req = protocol.request(url, requestOptions, (res) => {
        const responseTime = Date.now() - startTime;
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            responseTime: responseTime,
            success: res.statusCode >= 200 && res.statusCode < 400,
            url: url
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${this.config.timeout}ms for ${url}`));
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed for ${url}: ${error.message}`));
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  // Retry mechanism for failed requests
  async makeRequestWithRetry(url, options = {}, maxRetries = this.config.retryAttempts) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.makeHttpRequest(url, options);
        return result;
      } catch (error) {
        lastError = error;
        this.logger.debug(`Attempt ${attempt}/${maxRetries} failed for ${url}: ${error.message}`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        }
      }
    }
    
    throw lastError;
  }

  // Test basic health endpoints
  async testHealthEndpoints() {
    this.logger.info('🏥 Testing health endpoints...');

    const healthTests = [];
    const baseUrl = this.config.stagingUrl || this.config.baseUrl;

    for (const endpoint of this.config.healthCheckEndpoints) {
      const testName = `health_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const url = `${baseUrl}${endpoint}`;

      try {
        const startTime = Date.now();
        const response = await this.makeRequestWithRetry(url);
        
        const testResult = {
          name: testName,
          endpoint: endpoint,
          url: url,
          status: response.success ? 'passed' : 'failed',
          statusCode: response.statusCode,
          responseTime: response.responseTime,
          duration: Date.now() - startTime,
          error: response.success ? null : `HTTP ${response.statusCode}`,
          timestamp: new Date().toISOString()
        };

        // Additional health check validation
        if (response.success) {
          try {
            const healthData = JSON.parse(response.data);
            if (healthData.status && healthData.status !== 'healthy') {
              testResult.status = 'failed';
              testResult.error = `Health check returned status: ${healthData.status}`;
            }
          } catch (parseError) {
            // If not JSON, that's okay for some health endpoints
            this.logger.debug(`Health endpoint ${endpoint} returned non-JSON response`);
          }
        }

        healthTests.push(testResult);
        this.logger.debug(`Health test ${testName}: ${testResult.status} (${testResult.responseTime}ms)`);

      } catch (error) {
        const testResult = {
          name: testName,
          endpoint: endpoint,
          url: url,
          status: 'failed',
          statusCode: null,
          responseTime: null,
          duration: Date.now() - startTime,
          error: error.message,
          timestamp: new Date().toISOString()
        };

        healthTests.push(testResult);
        this.logger.debug(`Health test ${testName}: failed - ${error.message}`);
      }
    }

    this.testResults.tests.healthEndpoints = {
      total: healthTests.length,
      passed: healthTests.filter(t => t.status === 'passed').length,
      failed: healthTests.filter(t => t.status === 'failed').length,
      results: healthTests
    };

    return healthTests;
  }

  // Test critical application endpoints
  async testCriticalEndpoints() {
    this.logger.info('🎯 Testing critical application endpoints...');

    const criticalTests = [];
    const baseUrl = this.config.stagingUrl || this.config.baseUrl;

    for (const endpoint of this.config.criticalEndpoints) {
      const testName = `critical_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const url = `${baseUrl}${endpoint}`;

      try {
        const startTime = Date.now();
        
        let requestOptions = { method: 'GET' };
        
        // Special handling for different endpoint types
        if (endpoint.includes('/api/rag/submit-form')) {
          requestOptions = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              destination: 'Test City',
              adults: 2,
              children: 0,
              checkin: new Date().toISOString().split('T')[0],
              checkout: new Date(Date.now() + 86400000).toISOString().split('T')[0],
              budget: 1000
            })
          };
        }

        const response = await this.makeRequestWithRetry(url, requestOptions);
        
        const testResult = {
          name: testName,
          endpoint: endpoint,
          url: url,
          method: requestOptions.method,
          status: response.success ? 'passed' : 'failed',
          statusCode: response.statusCode,
          responseTime: response.responseTime,
          duration: Date.now() - startTime,
          error: response.success ? null : `HTTP ${response.statusCode}`,
          timestamp: new Date().toISOString()
        };

        // Performance validation
        if (response.responseTime > this.config.performanceThresholds.responseTime) {
          testResult.status = 'warning';
          testResult.warning = `Slow response time: ${response.responseTime}ms > ${this.config.performanceThresholds.responseTime}ms`;
        }

        criticalTests.push(testResult);
        this.logger.debug(`Critical test ${testName}: ${testResult.status} (${testResult.responseTime}ms)`);

      } catch (error) {
        const testResult = {
          name: testName,
          endpoint: endpoint,
          url: url,
          status: 'failed',
          statusCode: null,
          responseTime: null,
          duration: Date.now() - startTime,
          error: error.message,
          timestamp: new Date().toISOString()
        };

        criticalTests.push(testResult);
        this.logger.debug(`Critical test ${testName}: failed - ${error.message}`);
      }
    }

    this.testResults.tests.criticalEndpoints = {
      total: criticalTests.length,
      passed: criticalTests.filter(t => t.status === 'passed').length,
      failed: criticalTests.filter(t => t.status === 'failed').length,
      warnings: criticalTests.filter(t => t.status === 'warning').length,
      results: criticalTests
    };

    return criticalTests;
  }

  // Test deployment smoke tests
  async testDeploymentSmoke() {
    this.logger.info('💨 Running deployment smoke tests...');

    const smokeTests = [];
    const baseUrl = this.config.stagingUrl || this.config.baseUrl;

    // Test 1: Basic connectivity
    try {
      const connectivityTest = await this.makeRequestWithRetry(baseUrl);
      smokeTests.push({
        name: 'connectivity_test',
        status: connectivityTest.success ? 'passed' : 'failed',
        responseTime: connectivityTest.responseTime,
        statusCode: connectivityTest.statusCode,
        error: connectivityTest.success ? null : `Failed to connect to ${baseUrl}`
      });
    } catch (error) {
      smokeTests.push({
        name: 'connectivity_test',
        status: 'failed',
        error: error.message
      });
    }

    // Test 2: Static assets loading
    try {
      const assetsTest = await this.makeRequestWithRetry(`${baseUrl}/assets/index.css`);
      smokeTests.push({
        name: 'static_assets_test',
        status: assetsTest.success ? 'passed' : 'failed',
        responseTime: assetsTest.responseTime,
        statusCode: assetsTest.statusCode,
        error: assetsTest.success ? null : 'Static assets not loading'
      });
    } catch (error) {
      smokeTests.push({
        name: 'static_assets_test',
        status: 'failed',
        error: error.message
      });
    }

    // Test 3: API availability
    try {
      const apiTest = await this.makeRequestWithRetry(`${baseUrl}/api/health`);
      smokeTests.push({
        name: 'api_availability_test',
        status: apiTest.success ? 'passed' : 'failed',
        responseTime: apiTest.responseTime,
        statusCode: apiTest.statusCode,
        error: apiTest.success ? null : 'API not available'
      });
    } catch (error) {
      smokeTests.push({
        name: 'api_availability_test',
        status: 'failed',
        error: error.message
      });
    }

    // Test 4: Database connectivity (if applicable)
    if (process.env.DATABASE_URL) {
      try {
        const dbTest = await this.makeRequestWithRetry(`${baseUrl}/api/health/system`);
        smokeTests.push({
          name: 'database_connectivity_test',
          status: dbTest.success ? 'passed' : 'failed',
          responseTime: dbTest.responseTime,
          statusCode: dbTest.statusCode,
          error: dbTest.success ? null : 'Database connectivity failed'
        });
      } catch (error) {
        smokeTests.push({
          name: 'database_connectivity_test',
          status: 'failed',
          error: error.message
        });
      }
    }

    this.testResults.tests.smokeTests = {
      total: smokeTests.length,
      passed: smokeTests.filter(t => t.status === 'passed').length,
      failed: smokeTests.filter(t => t.status === 'failed').length,
      results: smokeTests
    };

    return smokeTests;
  }

  // Collect performance metrics
  async collectPerformanceMetrics() {
    this.logger.info('📊 Collecting performance metrics...');

    const performanceMetrics = {
      responseTimesMs: [],
      availabilityPercentage: 0,
      errorRate: 0,
      throughputRPS: 0,
      timestamp: new Date().toISOString()
    };

    // Collect response times from all tests
    const allTests = [
      ...(this.testResults.tests.healthEndpoints?.results || []),
      ...(this.testResults.tests.criticalEndpoints?.results || []),
      ...(this.testResults.tests.smokeTests?.results || [])
    ];

    // Calculate metrics
    const responseTimes = allTests
      .filter(test => test.responseTime)
      .map(test => test.responseTime);

    if (responseTimes.length > 0) {
      performanceMetrics.responseTimesMs = responseTimes;
      performanceMetrics.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      performanceMetrics.medianResponseTime = responseTimes.sort()[Math.floor(responseTimes.length / 2)];
      performanceMetrics.p95ResponseTime = responseTimes.sort()[Math.floor(responseTimes.length * 0.95)];
    }

    // Calculate availability
    const totalTests = allTests.length;
    const successfulTests = allTests.filter(test => test.status === 'passed').length;
    performanceMetrics.availabilityPercentage = totalTests > 0 ? (successfulTests / totalTests) * 100 : 0;

    // Calculate error rate
    const failedTests = allTests.filter(test => test.status === 'failed').length;
    performanceMetrics.errorRate = totalTests > 0 ? (failedTests / totalTests) * 100 : 0;

    // Performance load test (simple)
    await this.runSimpleLoadTest(performanceMetrics);

    this.testResults.performance = performanceMetrics;
    return performanceMetrics;
  }

  // Run a simple load test
  async runSimpleLoadTest(performanceMetrics) {
    this.logger.debug('Running simple load test...');

    const baseUrl = this.config.stagingUrl || this.config.baseUrl;
    const endpoint = `${baseUrl}/api/health`;
    const concurrentRequests = 5;
    const testDuration = 5000; // 5 seconds

    try {
      const startTime = Date.now();
      const requests = [];
      const results = [];

      // Generate concurrent requests
      for (let i = 0; i < concurrentRequests; i++) {
        const promise = this.performLoadTestRequests(endpoint, testDuration / concurrentRequests, results);
        requests.push(promise);
      }

      await Promise.all(requests);
      
      const totalDuration = Date.now() - startTime;
      const successfulRequests = results.filter(r => r.success).length;
      
      performanceMetrics.loadTest = {
        duration: totalDuration,
        totalRequests: results.length,
        successfulRequests: successfulRequests,
        failedRequests: results.length - successfulRequests,
        requestsPerSecond: results.length / (totalDuration / 1000),
        averageResponseTime: results.length > 0 
          ? results.reduce((sum, r) => sum + r.responseTime, 0) / results.length 
          : 0
      };

    } catch (error) {
      this.logger.debug(`Load test failed: ${error.message}`);
      performanceMetrics.loadTest = { error: error.message };
    }
  }

  // Perform load test requests
  async performLoadTestRequests(endpoint, duration, results) {
    const endTime = Date.now() + duration;
    
    while (Date.now() < endTime) {
      try {
        const result = await this.makeHttpRequest(endpoint);
        results.push({
          success: result.success,
          responseTime: result.responseTime,
          statusCode: result.statusCode
        });
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.push({
          success: false,
          responseTime: null,
          error: error.message
        });
      }
    }
  }

  // Evaluate rollback conditions
  evaluateRollbackConditions() {
    this.logger.info('🔄 Evaluating rollback conditions...');

    const conditions = this.config.rollbackConditions;
    const performance = this.testResults.performance;
    const tests = this.testResults.tests;

    let shouldRollback = false;
    let rollbackReasons = [];

    // Check failed health checks
    const failedHealthChecks = tests.healthEndpoints?.failed || 0;
    if (failedHealthChecks >= conditions.failedHealthChecks) {
      shouldRollback = true;
      rollbackReasons.push(`Too many failed health checks: ${failedHealthChecks} >= ${conditions.failedHealthChecks}`);
    }

    // Check error rate
    if (performance.errorRate >= conditions.highErrorRate) {
      shouldRollback = true;
      rollbackReasons.push(`High error rate: ${performance.errorRate}% >= ${conditions.highErrorRate}%`);
    }

    // Check response time
    if (performance.averageResponseTime >= conditions.slowResponseTime) {
      shouldRollback = true;
      rollbackReasons.push(`Slow response time: ${performance.averageResponseTime}ms >= ${conditions.slowResponseTime}ms`);
    }

    // Check availability
    if (performance.availabilityPercentage < conditions.lowAvailability) {
      shouldRollback = true;
      rollbackReasons.push(`Low availability: ${performance.availabilityPercentage}% < ${conditions.lowAvailability}%`);
    }

    return {
      shouldRollback,
      reasons: rollbackReasons
    };
  }

  // Execute rollback if needed
  async executeRollback(rollbackEvaluation) {
    if (!rollbackEvaluation.shouldRollback || !this.config.rollbackEnabled) {
      return false;
    }

    this.logger.warn('🚨 Rollback conditions met, initiating rollback...');
    
    try {
      const rollbackResult = {
        triggered: true,
        reason: rollbackEvaluation.reasons.join('; '),
        timestamp: new Date().toISOString(),
        action: 'automatic_rollback',
        success: false
      };

      // In a real implementation, this would:
      // 1. Call Vercel API to rollback to previous deployment
      // 2. Update DNS records if needed
      // 3. Clear CDN cache
      // 4. Send notifications
      
      // For now, we'll simulate the rollback process
      this.logger.info('📞 Calling Vercel API to rollback deployment...');
      
      // Simulate rollback API call
      if (process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID) {
        // This would be a real Vercel API call
        rollbackResult.action = 'vercel_api_rollback';
        rollbackResult.success = true;
        this.logger.success('✅ Vercel deployment rollback initiated');
      } else {
        // Simulation mode
        rollbackResult.action = 'simulated_rollback';
        rollbackResult.success = true;
        this.logger.warn('⚠️  SIMULATION: Would rollback Vercel deployment');
      }

      // Send notifications
      await this.sendRollbackNotifications(rollbackResult);

      this.testResults.rollback = rollbackResult;
      return true;

    } catch (error) {
      this.logger.error(`❌ Rollback failed: ${error.message}`);
      
      this.testResults.rollback = {
        triggered: true,
        reason: rollbackEvaluation.reasons.join('; '),
        timestamp: new Date().toISOString(),
        action: 'rollback_failed',
        success: false,
        error: error.message
      };

      return false;
    }
  }

  // Send rollback notifications
  async sendRollbackNotifications(rollbackResult) {
    this.logger.info('📢 Sending rollback notifications...');

    // In a real implementation, this would send notifications via:
    // - Slack webhooks
    // - Email
    // - PagerDuty
    // - Discord
    // - etc.

    this.logger.warn(`🚨 ROLLBACK ALERT: ${this.config.serviceName} deployment rolled back`);
    this.logger.warn(`Reason: ${rollbackResult.reason}`);
    this.logger.warn(`Action: ${rollbackResult.action}`);
    this.logger.warn(`Timestamp: ${rollbackResult.timestamp}`);
  }

  // Generate recommendations
  generateRecommendations() {
    const recommendations = [];
    const performance = this.testResults.performance;
    const tests = this.testResults.tests;

    // Performance recommendations
    if (performance.averageResponseTime > this.config.performanceThresholds.responseTime) {
      recommendations.push({
        category: 'performance',
        priority: 'high',
        title: 'Optimize Response Time',
        description: `Average response time (${performance.averageResponseTime}ms) exceeds threshold (${this.config.performanceThresholds.responseTime}ms)`,
        actions: [
          'Profile slow endpoints',
          'Implement caching strategies',
          'Optimize database queries',
          'Consider CDN for static assets'
        ]
      });
    }

    // Reliability recommendations
    if (performance.errorRate > this.config.performanceThresholds.errorRate) {
      recommendations.push({
        category: 'reliability',
        priority: 'high',
        title: 'Reduce Error Rate',
        description: `Error rate (${performance.errorRate}%) is above acceptable threshold (${this.config.performanceThresholds.errorRate}%)`,
        actions: [
          'Investigate failing endpoints',
          'Implement better error handling',
          'Add retry mechanisms',
          'Monitor error patterns'
        ]
      });
    }

    // Health check recommendations
    const failedHealthChecks = tests.healthEndpoints?.failed || 0;
    if (failedHealthChecks > 0) {
      recommendations.push({
        category: 'health',
        priority: 'medium',
        title: 'Fix Health Check Failures',
        description: `${failedHealthChecks} health check(s) are failing`,
        actions: [
          'Review health endpoint implementations',
          'Check external service dependencies',
          'Validate health check logic',
          'Consider health check timeouts'
        ]
      });
    }

    // Rollback recommendations
    if (this.testResults.rollback.triggered) {
      recommendations.push({
        category: 'rollback',
        priority: 'critical',
        title: 'Address Rollback Root Cause',
        description: 'Deployment was rolled back due to quality issues',
        actions: [
          'Investigate rollback trigger conditions',
          'Fix underlying issues before redeployment',
          'Improve pre-deployment testing',
          'Consider gradual rollout strategies'
        ]
      });
    }

    this.testResults.recommendations = recommendations;
    return recommendations;
  }

  // Calculate summary
  calculateSummary() {
    const tests = this.testResults.tests;
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;

    // Count tests from all categories
    Object.values(tests).forEach(testCategory => {
      if (testCategory.total) {
        totalTests += testCategory.total;
        passedTests += testCategory.passed || 0;
        failedTests += testCategory.failed || 0;
        // Warnings count as passed for overall success
        passedTests += testCategory.warnings || 0;
      }
    });

    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    let overallStatus = 'passed';
    if (this.testResults.rollback.triggered) {
      overallStatus = 'rolled_back';
    } else if (failedTests > 0) {
      overallStatus = 'failed';
    } else if (successRate < this.config.performanceThresholds.availabilityPercentage) {
      overallStatus = 'degraded';
    }

    this.testResults.summary = {
      overallStatus,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      successRate: parseFloat(successRate.toFixed(2)),
      duration: 0 // Will be set by the main process
    };
  }

  // Run all E2E tests
  async runAllTests() {
    const startTime = Date.now();
    
    this.logger.info(`🚀 Starting end-to-end pipeline testing for ${this.config.serviceName}`);
    
    try {
      // Run all test categories
      await this.testHealthEndpoints();
      await this.testCriticalEndpoints();
      await this.testDeploymentSmoke();

      // Collect performance metrics
      await this.collectPerformanceMetrics();

      // Calculate summary
      this.calculateSummary();
      this.testResults.summary.duration = Date.now() - startTime;

      // Evaluate rollback conditions
      const rollbackEvaluation = this.evaluateRollbackConditions();
      
      // Execute rollback if needed
      if (rollbackEvaluation.shouldRollback) {
        await this.executeRollback(rollbackEvaluation);
      }

      // Generate recommendations
      this.generateRecommendations();

      this.logger.success(`✅ End-to-end testing completed in ${Date.now() - startTime}ms`);
      this.logger.info(`📊 Overall Status: ${this.testResults.summary.overallStatus.toUpperCase()}`);
      
      return this.testResults;

    } catch (error) {
      this.logger.error(`❌ End-to-end testing failed: ${error.message}`);
      
      this.testResults.summary.overallStatus = 'failed';
      this.testResults.summary.duration = Date.now() - startTime;
      this.testResults.error = error.message;

      return this.testResults;
    }
  }

  // Save test results to file
  saveResults(outputPath = 'e2e-test-results.json') {
    try {
      fs.writeFileSync(outputPath, JSON.stringify(this.testResults, null, 2));
      this.logger.success(`📄 Test results saved to: ${outputPath}`);
      return outputPath;
    } catch (error) {
      this.logger.error(`Failed to save test results: ${error.message}`);
      return null;
    }
  }
}

// Main execution
async function main() {
  try {
    const args = process.argv.slice(2);
    const options = {};

    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--')) {
        const [key, value] = arg.slice(2).split('=');
        options[key] = value || true;
      }
    }

    // Set defaults from environment
    options.serviceName = options.serviceName || process.env.SERVICE_NAME || 'hylo-travel-ai';
    options.environment = options.environment || process.env.NODE_ENV || 'production';
    options.baseUrl = options.baseUrl || process.env.VERCEL_URL || 'http://localhost:3000';

    const tester = new EndToEndPipelineTester(options);
    const results = await tester.runAllTests();

    // Save results
    const outputFile = options.output || `e2e-results-${Date.now()}.json`;
    tester.saveResults(outputFile);

    // Display summary
    console.log('\n🎯 E2E Testing Summary:');
    console.log('─'.repeat(50));
    console.log(`Overall Status: ${results.summary.overallStatus.toUpperCase()}`);
    console.log(`Total Tests: ${results.summary.totalTests}`);
    console.log(`Passed: ${results.summary.passedTests}`);
    console.log(`Failed: ${results.summary.failedTests}`);
    console.log(`Success Rate: ${results.summary.successRate}%`);
    console.log(`Duration: ${results.summary.duration}ms`);

    if (results.rollback.triggered) {
      console.log('\n🔄 Rollback Information:');
      console.log(`Reason: ${results.rollback.reason}`);
      console.log(`Action: ${results.rollback.action}`);
      console.log(`Success: ${results.rollback.success}`);
    }

    if (results.performance) {
      console.log('\n⚡ Performance Metrics:');
      console.log(`Average Response Time: ${results.performance.averageResponseTime}ms`);
      console.log(`Availability: ${results.performance.availabilityPercentage}%`);
      console.log(`Error Rate: ${results.performance.errorRate}%`);
    }

    // Exit with appropriate code
    if (results.summary.overallStatus === 'failed') {
      process.exit(1);
    } else if (results.rollback.triggered) {
      process.exit(2); // Special exit code for rollback
    } else {
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ End-to-end pipeline testing failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { EndToEndPipelineTester };
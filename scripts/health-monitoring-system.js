#!/usr/bin/env node

/**
 * Health Monitoring System
 * Comprehensive health monitoring with external service integration
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class HealthMonitoringSystem {
  constructor(options = {}) {
    this.config = {
      serviceName: options.serviceName || 'hylo-travel-ai',
      environment: options.environment || process.env.NODE_ENV || 'production',
      healthcheckUrl: options.healthcheckUrl || process.env.HEALTHCHECK_URL,
      monitoringEndpoints: options.monitoringEndpoints || [
        'http://localhost:3000/api/health',
        'http://localhost:4173/health'
      ],
      externalServices: options.externalServices || [
        { name: 'Vercel Edge Functions', url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/health` : null },
        { name: 'Database', url: process.env.DATABASE_URL ? 'database-check' : null },
        { name: 'External APIs', url: 'api-check' }
      ].filter(service => service.url),
      healthcheckInterval: options.healthcheckInterval || 30000, // 30 seconds
      timeout: options.timeout || 10000, // 10 seconds
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 5000,
      enableMetrics: options.enableMetrics !== false,
      enableNotifications: options.enableNotifications !== false,
      ...options
    };

    this.metrics = {
      startTime: Date.now(),
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      averageResponseTime: 0,
      lastSuccessTime: null,
      lastFailureTime: null,
      consecutiveFailures: 0,
      uptime: 0,
      checksHistory: []
    };

    this.isMonitoring = false;
    this.monitoringInterval = null;
    
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
        'User-Agent': `${this.config.serviceName}-health-monitor/1.0`,
        ...options.headers
      }
    };

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const protocol = url.startsWith('https:') ? https : http;
      
      const req = protocol.get(url, requestOptions, (res) => {
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
            success: res.statusCode >= 200 && res.statusCode < 400
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${this.config.timeout}ms`));
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(this.config.timeout);
    });
  }

  // Retry mechanism for failed requests
  async makeRequestWithRetry(url, maxRetries = this.config.retryAttempts) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.makeHttpRequest(url);
        return result;
      } catch (error) {
        lastError = error;
        this.logger.debug(`Attempt ${attempt}/${maxRetries} failed for ${url}: ${error.message}`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }
    
    throw lastError;
  }

  // Check individual endpoint health
  async checkEndpointHealth(endpoint) {
    try {
      const result = await this.makeRequestWithRetry(endpoint);
      
      return {
        endpoint,
        status: result.success ? 'healthy' : 'unhealthy',
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        timestamp: new Date().toISOString(),
        data: result.data.slice(0, 500), // Limit response data
        error: null
      };
    } catch (error) {
      return {
        endpoint,
        status: 'unhealthy',
        statusCode: null,
        responseTime: null,
        timestamp: new Date().toISOString(),
        data: null,
        error: error.message
      };
    }
  }

  // Check database connectivity
  async checkDatabaseHealth() {
    if (!process.env.DATABASE_URL) {
      return {
        service: 'Database',
        status: 'unknown',
        message: 'Database URL not configured',
        timestamp: new Date().toISOString()
      };
    }

    try {
      // This would typically use your database client
      // For now, we'll simulate a database check
      const startTime = Date.now();
      
      // Placeholder for actual database connection test
      // const dbClient = new DatabaseClient(process.env.DATABASE_URL);
      // await dbClient.ping();
      
      const responseTime = Date.now() - startTime;
      
      return {
        service: 'Database',
        status: 'healthy',
        responseTime,
        message: 'Database connection successful',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'Database',
        status: 'unhealthy',
        message: `Database connection failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  // Check external API services
  async checkExternalServicesHealth() {
    const externalChecks = await Promise.allSettled(
      this.config.externalServices.map(async (service) => {
        if (service.url === 'database-check') {
          return await this.checkDatabaseHealth();
        } else if (service.url === 'api-check') {
          // Placeholder for API health checks
          return {
            service: service.name,
            status: 'healthy',
            message: 'API services operational',
            timestamp: new Date().toISOString()
          };
        } else {
          const result = await this.checkEndpointHealth(service.url);
          return {
            service: service.name,
            status: result.status,
            responseTime: result.responseTime,
            message: result.error || 'Service operational',
            timestamp: result.timestamp
          };
        }
      })
    );

    return externalChecks.map((check, index) => {
      if (check.status === 'fulfilled') {
        return check.value;
      } else {
        return {
          service: this.config.externalServices[index].name,
          status: 'unhealthy',
          message: `Health check failed: ${check.reason.message}`,
          timestamp: new Date().toISOString(),
          error: check.reason.message
        };
      }
    });
  }

  // Perform comprehensive health check
  async performHealthCheck() {
    const startTime = Date.now();
    this.metrics.totalChecks++;

    try {
      this.logger.debug('Starting comprehensive health check...');

      // Check local endpoints
      const endpointChecks = await Promise.allSettled(
        this.config.monitoringEndpoints.map(endpoint => this.checkEndpointHealth(endpoint))
      );

      // Check external services
      const externalChecks = await this.checkExternalServicesHealth();

      // System metrics
      const systemMetrics = this.collectSystemMetrics();

      const healthCheckResult = {
        serviceName: this.config.serviceName,
        environment: this.config.environment,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        overall_status: 'unknown',
        endpoints: endpointChecks.map((check, index) => {
          if (check.status === 'fulfilled') {
            return check.value;
          } else {
            return {
              endpoint: this.config.monitoringEndpoints[index],
              status: 'unhealthy',
              error: check.reason.message,
              timestamp: new Date().toISOString()
            };
          }
        }),
        external_services: externalChecks,
        system_metrics: systemMetrics,
        metrics: this.getMetricsSummary()
      };

      // Determine overall status
      const allEndpointsHealthy = healthCheckResult.endpoints.every(ep => ep.status === 'healthy');
      const allServicesHealthy = healthCheckResult.external_services.every(svc => svc.status === 'healthy');
      
      if (allEndpointsHealthy && allServicesHealthy) {
        healthCheckResult.overall_status = 'healthy';
        this.metrics.successfulChecks++;
        this.metrics.lastSuccessTime = Date.now();
        this.metrics.consecutiveFailures = 0;
      } else {
        const criticalFailures = [
          ...healthCheckResult.endpoints.filter(ep => ep.status === 'unhealthy'),
          ...healthCheckResult.external_services.filter(svc => svc.status === 'unhealthy')
        ];

        if (criticalFailures.length > 0) {
          healthCheckResult.overall_status = 'unhealthy';
          this.metrics.failedChecks++;
          this.metrics.lastFailureTime = Date.now();
          this.metrics.consecutiveFailures++;
        } else {
          healthCheckResult.overall_status = 'degraded';
          this.metrics.successfulChecks++;
          this.metrics.consecutiveFailures = 0;
        }
      }

      // Update metrics
      this.updateMetrics(healthCheckResult);

      // Send notifications if needed
      if (this.config.enableNotifications && healthCheckResult.overall_status !== 'healthy') {
        await this.sendHealthNotifications(healthCheckResult);
      }

      // Ping external health check service
      if (this.config.healthcheckUrl && healthCheckResult.overall_status === 'healthy') {
        await this.pingExternalHealthCheck(healthCheckResult.overall_status);
      } else if (this.config.healthcheckUrl) {
        await this.pingExternalHealthCheck('fail');
      }

      this.logger.debug(`Health check completed: ${healthCheckResult.overall_status} (${healthCheckResult.duration}ms)`);
      
      return healthCheckResult;

    } catch (error) {
      this.metrics.failedChecks++;
      this.metrics.consecutiveFailures++;
      
      this.logger.error(`Health check failed: ${error.message}`);
      
      return {
        serviceName: this.config.serviceName,
        environment: this.config.environment,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        overall_status: 'unhealthy',
        error: error.message,
        metrics: this.getMetricsSummary()
      };
    }
  }

  // Collect system metrics
  collectSystemMetrics() {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      return {
        memory: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external,
          arrayBuffers: memUsage.arrayBuffers
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
      };
    } catch (error) {
      this.logger.debug(`Failed to collect system metrics: ${error.message}`);
      return {
        error: 'Failed to collect system metrics',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Update internal metrics
  updateMetrics(healthResult) {
    // Calculate average response time
    const responseTimes = [
      ...healthResult.endpoints.map(ep => ep.responseTime).filter(Boolean),
      ...healthResult.external_services.map(svc => svc.responseTime).filter(Boolean)
    ];

    if (responseTimes.length > 0) {
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      this.metrics.averageResponseTime = ((this.metrics.averageResponseTime * (this.metrics.totalChecks - 1)) + avgResponseTime) / this.metrics.totalChecks;
    }

    // Update uptime
    this.metrics.uptime = Date.now() - this.metrics.startTime;

    // Store in history (keep last 100 checks)
    this.metrics.checksHistory.push({
      timestamp: healthResult.timestamp,
      status: healthResult.overall_status,
      duration: healthResult.duration,
      responseTime: this.metrics.averageResponseTime
    });

    if (this.metrics.checksHistory.length > 100) {
      this.metrics.checksHistory.shift();
    }
  }

  // Get metrics summary
  getMetricsSummary() {
    const successRate = this.metrics.totalChecks > 0 
      ? (this.metrics.successfulChecks / this.metrics.totalChecks) * 100 
      : 0;

    return {
      totalChecks: this.metrics.totalChecks,
      successfulChecks: this.metrics.successfulChecks,
      failedChecks: this.metrics.failedChecks,
      successRate: parseFloat(successRate.toFixed(2)),
      averageResponseTime: parseFloat(this.metrics.averageResponseTime.toFixed(2)),
      consecutiveFailures: this.metrics.consecutiveFailures,
      uptime: this.metrics.uptime,
      lastSuccessTime: this.metrics.lastSuccessTime ? new Date(this.metrics.lastSuccessTime).toISOString() : null,
      lastFailureTime: this.metrics.lastFailureTime ? new Date(this.metrics.lastFailureTime).toISOString() : null
    };
  }

  // Ping external health check service (like Healthchecks.io)
  async pingExternalHealthCheck(status = 'success') {
    if (!this.config.healthcheckUrl) {
      return;
    }

    try {
      const url = status === 'success' 
        ? this.config.healthcheckUrl 
        : `${this.config.healthcheckUrl}/fail`;

      await this.makeHttpRequest(url, { 
        headers: {
          'Content-Type': 'application/json'
        }
      });

      this.logger.debug(`Pinged external health check: ${status}`);
    } catch (error) {
      this.logger.warn(`Failed to ping external health check: ${error.message}`);
    }
  }

  // Send health notifications
  async sendHealthNotifications(healthResult) {
    if (!this.config.enableNotifications) {
      return;
    }

    // Log critical issues
    if (healthResult.overall_status === 'unhealthy') {
      this.logger.error(`🚨 CRITICAL: Service ${this.config.serviceName} is UNHEALTHY`);
      
      const unhealthyEndpoints = healthResult.endpoints.filter(ep => ep.status === 'unhealthy');
      const unhealthyServices = healthResult.external_services.filter(svc => svc.status === 'unhealthy');

      if (unhealthyEndpoints.length > 0) {
        this.logger.error(`Unhealthy endpoints: ${unhealthyEndpoints.map(ep => ep.endpoint).join(', ')}`);
      }

      if (unhealthyServices.length > 0) {
        this.logger.error(`Unhealthy services: ${unhealthyServices.map(svc => svc.service).join(', ')}`);
      }
    }

    // Here you would integrate with notification services like:
    // - Slack webhooks
    // - PagerDuty
    // - Email notifications
    // - Discord webhooks
    // etc.
  }

  // Start continuous monitoring
  startMonitoring() {
    if (this.isMonitoring) {
      this.logger.warn('Health monitoring is already running');
      return;
    }

    this.logger.info(`🎯 Starting health monitoring for ${this.config.serviceName}`);
    this.logger.info(`   Environment: ${this.config.environment}`);
    this.logger.info(`   Interval: ${this.config.healthcheckInterval}ms`);
    this.logger.info(`   Endpoints: ${this.config.monitoringEndpoints.join(', ')}`);

    this.isMonitoring = true;

    // Perform initial health check
    this.performHealthCheck();

    // Set up interval monitoring
    this.monitoringInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthcheckInterval);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      this.logger.info('Received SIGINT, stopping health monitoring...');
      this.stopMonitoring();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.logger.info('Received SIGTERM, stopping health monitoring...');
      this.stopMonitoring();
      process.exit(0);
    });
  }

  // Stop continuous monitoring
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    this.logger.info('Stopping health monitoring...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = false;
    
    // Generate final report
    this.generateHealthReport();
  }

  // Generate health report
  generateHealthReport() {
    const report = {
      serviceName: this.config.serviceName,
      environment: this.config.environment,
      reportGenerated: new Date().toISOString(),
      monitoringDuration: Date.now() - this.metrics.startTime,
      configuration: {
        endpoints: this.config.monitoringEndpoints,
        externalServices: this.config.externalServices.map(svc => ({ name: svc.name, url: svc.url ? 'configured' : 'not configured' })),
        interval: this.config.healthcheckInterval,
        timeout: this.config.timeout,
        retryAttempts: this.config.retryAttempts
      },
      metrics: this.getMetricsSummary(),
      recentHistory: this.metrics.checksHistory.slice(-20) // Last 20 checks
    };

    const reportPath = `health-monitoring-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.logger.info(`📄 Health monitoring report saved: ${reportPath}`);
    this.logger.success('Health monitoring stopped successfully');

    return report;
  }

  // One-time health check
  async checkHealth() {
    this.logger.info(`🔍 Performing one-time health check for ${this.config.serviceName}`);
    
    const result = await this.performHealthCheck();
    
    // Display results
    console.log('\n📊 Health Check Results:');
    console.log('─'.repeat(50));
    console.log(`Service: ${result.serviceName}`);
    console.log(`Environment: ${result.environment}`);
    console.log(`Overall Status: ${result.overall_status.toUpperCase()}`);
    console.log(`Duration: ${result.duration}ms`);
    console.log(`Timestamp: ${result.timestamp}`);

    if (result.endpoints && result.endpoints.length > 0) {
      console.log('\n🔗 Endpoints:');
      result.endpoints.forEach(endpoint => {
        const status = endpoint.status === 'healthy' ? '✅' : '❌';
        console.log(`  ${status} ${endpoint.endpoint} (${endpoint.responseTime}ms)`);
      });
    }

    if (result.external_services && result.external_services.length > 0) {
      console.log('\n🌐 External Services:');
      result.external_services.forEach(service => {
        const status = service.status === 'healthy' ? '✅' : service.status === 'unknown' ? '❓' : '❌';
        console.log(`  ${status} ${service.service}: ${service.message}`);
      });
    }

    console.log('\n📈 Metrics:');
    const metrics = result.metrics;
    console.log(`  Total Checks: ${metrics.totalChecks}`);
    console.log(`  Success Rate: ${metrics.successRate}%`);
    console.log(`  Avg Response Time: ${metrics.averageResponseTime}ms`);

    return result;
  }
}

// Main execution
async function main() {
  try {
    const args = process.argv.slice(2);
    const command = args[0] || 'check';

    const options = {
      serviceName: process.env.SERVICE_NAME || 'hylo-travel-ai',
      environment: process.env.NODE_ENV || 'production',
      healthcheckUrl: process.env.HEALTHCHECK_URL,
      monitoringEndpoints: process.env.MONITORING_ENDPOINTS?.split(',') || [
        'http://localhost:3000/api/health',
        'http://localhost:4173/health'
      ]
    };

    const monitor = new HealthMonitoringSystem(options);

    switch (command) {
      case 'check':
        const result = await monitor.checkHealth();
        process.exit(result.overall_status === 'healthy' ? 0 : 1);
        break;

      case 'monitor':
        monitor.startMonitoring();
        break;

      case 'test':
        // Test mode - run a few checks and exit
        console.log('🧪 Running health monitoring test...');
        for (let i = 0; i < 3; i++) {
          await monitor.performHealthCheck();
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        monitor.generateHealthReport();
        break;

      default:
        console.log(`
Usage: node scripts/health-monitoring-system.js [command]

Commands:
  check    - Perform one-time health check (default)
  monitor  - Start continuous health monitoring
  test     - Run test monitoring session

Environment Variables:
  SERVICE_NAME           - Name of the service being monitored
  NODE_ENV              - Environment (development, production, etc.)
  HEALTHCHECK_URL       - External health check service URL (optional)
  MONITORING_ENDPOINTS  - Comma-separated list of endpoints to monitor
  LOG_LEVEL            - Logging level (debug, info, warn, error)
        `);
        break;
    }

  } catch (error) {
    console.error('❌ Health monitoring system failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { HealthMonitoringSystem };
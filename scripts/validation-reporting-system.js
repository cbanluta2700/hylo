#!/usr/bin/env node

/**
 * Comprehensive Validation Reporting System
 * Generates detailed validation reports for pipeline validation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ValidationReportingSystem {
  constructor(options = {}) {
    this.config = {
      serviceName: options.serviceName || 'hylo-travel-ai',
      environment: options.environment || process.env.NODE_ENV || 'production',
      outputDir: options.outputDir || 'pipeline-reports',
      reportFormat: options.reportFormat || 'both', // 'json', 'html', 'both'
      includeMetrics: options.includeMetrics !== false,
      includeHealthChecks: options.includeHealthChecks !== false,
      includeSecurityScans: options.includeSecurityScans !== false,
      includePerformanceMetrics: options.includePerformanceMetrics !== false,
      generateArtifacts: options.generateArtifacts !== false,
      ...options
    };

    this.reportData = {
      metadata: {
        serviceName: this.config.serviceName,
        environment: this.config.environment,
        timestamp: new Date().toISOString(),
        reportVersion: '1.0.0',
        generatedBy: 'ValidationReportingSystem'
      },
      summary: {
        overallStatus: 'unknown',
        totalValidations: 0,
        passedValidations: 0,
        failedValidations: 0,
        warningValidations: 0,
        successRate: 0,
        duration: 0
      },
      validations: {},
      metrics: {},
      recommendations: [],
      artifacts: {}
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

  // Initialize report directory
  initializeReportDirectory() {
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
      this.logger.debug(`Created report directory: ${this.config.outputDir}`);
    }
  }

  // Run deployment readiness validation and collect results
  async runDeploymentReadinessValidation() {
    this.logger.info('🔍 Running deployment readiness validation...');

    try {
      const validatorScript = path.join(__dirname, 'validate-deployment-readiness.js');
      if (!fs.existsSync(validatorScript)) {
        throw new Error('Deployment readiness validator not found');
      }

      const output = execSync(`node "${validatorScript}" --format=json`, {
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024 * 10 // 10MB
      });

      const validationResults = JSON.parse(output);
      
      this.reportData.validations.deploymentReadiness = {
        status: validationResults.overallStatus || 'unknown',
        results: validationResults.results || [],
        summary: validationResults.summary || {},
        duration: validationResults.duration || 0,
        timestamp: validationResults.timestamp || new Date().toISOString()
      };

      return validationResults;

    } catch (error) {
      this.logger.error(`Deployment readiness validation failed: ${error.message}`);
      
      this.reportData.validations.deploymentReadiness = {
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };

      return null;
    }
  }

  // Run health monitoring and collect results
  async runHealthMonitoring() {
    if (!this.config.includeHealthChecks) {
      return null;
    }

    this.logger.info('🏥 Running health monitoring checks...');

    try {
      const healthScript = path.join(__dirname, 'health-monitoring-system.js');
      if (!fs.existsSync(healthScript)) {
        this.logger.warn('Health monitoring system not found, skipping health checks');
        return null;
      }

      const output = execSync(`node "${healthScript}" check`, {
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024 * 5 // 5MB
      });

      // Parse health check results (assuming JSON output)
      let healthResults = null;
      try {
        // Try to extract JSON from output
        const jsonMatch = output.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          healthResults = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        this.logger.debug('Could not parse health check JSON, using raw output');
      }

      this.reportData.validations.healthChecks = {
        status: healthResults?.overall_status || 'unknown',
        results: healthResults || { rawOutput: output },
        timestamp: new Date().toISOString()
      };

      return healthResults;

    } catch (error) {
      this.logger.warn(`Health monitoring failed: ${error.message}`);
      
      this.reportData.validations.healthChecks = {
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };

      return null;
    }
  }

  // Run security scans
  async runSecurityScans() {
    if (!this.config.includeSecurityScans) {
      return null;
    }

    this.logger.info('🔒 Running security scans...');

    const securityResults = {
      npmAudit: null,
      dependencyCheck: null,
      eslintSecurity: null
    };

    try {
      // NPM Audit
      try {
        const npmAuditOutput = execSync('npm audit --json', {
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'ignore']
        });
        securityResults.npmAudit = JSON.parse(npmAuditOutput);
      } catch (auditError) {
        securityResults.npmAudit = { error: 'NPM audit failed or found vulnerabilities' };
      }

      // Dependency vulnerability check
      try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
        const dependencies = { 
          ...packageJson.dependencies, 
          ...packageJson.devDependencies 
        };

        securityResults.dependencyCheck = {
          totalDependencies: Object.keys(dependencies).length,
          dependencies: dependencies,
          timestamp: new Date().toISOString()
        };
      } catch (depError) {
        securityResults.dependencyCheck = { error: 'Could not analyze dependencies' };
      }

      // ESLint security rules (if available)
      try {
        const eslintOutput = execSync('npx eslint --format=json .', {
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'ignore']
        });
        const eslintResults = JSON.parse(eslintOutput);
        securityResults.eslintSecurity = {
          totalFiles: eslintResults.length,
          totalErrors: eslintResults.reduce((sum, file) => sum + file.errorCount, 0),
          totalWarnings: eslintResults.reduce((sum, file) => sum + file.warningCount, 0)
        };
      } catch (eslintError) {
        securityResults.eslintSecurity = { error: 'ESLint security scan unavailable' };
      }

      this.reportData.validations.securityScans = {
        status: this.determineSecurityStatus(securityResults),
        results: securityResults,
        timestamp: new Date().toISOString()
      };

      return securityResults;

    } catch (error) {
      this.logger.error(`Security scans failed: ${error.message}`);
      
      this.reportData.validations.securityScans = {
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };

      return null;
    }
  }

  // Determine security status from scan results
  determineSecurityStatus(securityResults) {
    if (securityResults.npmAudit?.error || 
        (securityResults.npmAudit?.metadata?.vulnerabilities?.total > 0)) {
      return 'warning';
    }

    if (securityResults.eslintSecurity?.totalErrors > 0) {
      return 'warning';
    }

    return 'passed';
  }

  // Collect performance metrics
  async collectPerformanceMetrics() {
    if (!this.config.includePerformanceMetrics) {
      return null;
    }

    this.logger.info('⚡ Collecting performance metrics...');

    try {
      const metrics = {
        buildMetrics: await this.collectBuildMetrics(),
        testMetrics: await this.collectTestMetrics(),
        bundleMetrics: await this.collectBundleMetrics(),
        systemMetrics: this.collectSystemMetrics()
      };

      this.reportData.metrics = metrics;
      return metrics;

    } catch (error) {
      this.logger.error(`Performance metrics collection failed: ${error.message}`);
      return null;
    }
  }

  // Collect build performance metrics
  async collectBuildMetrics() {
    try {
      const startTime = Date.now();
      
      // Try to get build info from package.json or build artifacts
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
      
      return {
        buildTime: Date.now() - startTime,
        nodeVersion: process.version,
        npmVersion: execSync('npm --version', { encoding: 'utf-8' }).trim(),
        scripts: Object.keys(packageJson.scripts || {}),
        dependencies: Object.keys(packageJson.dependencies || {}).length,
        devDependencies: Object.keys(packageJson.devDependencies || {}).length
      };
    } catch (error) {
      return { error: 'Could not collect build metrics' };
    }
  }

  // Collect test performance metrics
  async collectTestMetrics() {
    try {
      // Look for test results or run tests if needed
      const testResultsPath = 'test-results.json';
      
      if (fs.existsSync(testResultsPath)) {
        const testResults = JSON.parse(fs.readFileSync(testResultsPath, 'utf-8'));
        return testResults;
      }

      // If no test results file, try to run tests quickly
      try {
        const testOutput = execSync('npm test -- --reporter=json', {
          encoding: 'utf-8',
          timeout: 30000
        });
        return JSON.parse(testOutput);
      } catch (testError) {
        return { 
          error: 'Could not run tests or parse test results',
          message: testError.message
        };
      }

    } catch (error) {
      return { error: 'Could not collect test metrics' };
    }
  }

  // Collect bundle size metrics
  async collectBundleMetrics() {
    try {
      const distPath = 'dist';
      
      if (!fs.existsSync(distPath)) {
        return { error: 'Build dist directory not found' };
      }

      const bundleStats = this.analyzeBundleDirectory(distPath);
      return bundleStats;

    } catch (error) {
      return { error: 'Could not collect bundle metrics' };
    }
  }

  // Analyze bundle directory for size metrics
  analyzeBundleDirectory(dirPath) {
    const stats = {
      totalSize: 0,
      files: [],
      jsFiles: [],
      cssFiles: [],
      assetFiles: []
    };

    const analyzeFile = (filePath, relativePath) => {
      const fileStat = fs.statSync(filePath);
      const fileInfo = {
        path: relativePath,
        size: fileStat.size,
        sizeKB: Math.round(fileStat.size / 1024 * 100) / 100
      };

      stats.totalSize += fileStat.size;
      stats.files.push(fileInfo);

      const ext = path.extname(relativePath).toLowerCase();
      if (ext === '.js') {
        stats.jsFiles.push(fileInfo);
      } else if (ext === '.css') {
        stats.cssFiles.push(fileInfo);
      } else {
        stats.assetFiles.push(fileInfo);
      }
    };

    const walkDirectory = (dir, baseDir = '') => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(baseDir, item);
        
        if (fs.statSync(fullPath).isDirectory()) {
          walkDirectory(fullPath, relativePath);
        } else {
          analyzeFile(fullPath, relativePath);
        }
      }
    };

    walkDirectory(dirPath);

    // Calculate totals and add summary
    stats.totalSizeKB = Math.round(stats.totalSize / 1024 * 100) / 100;
    stats.totalSizeMB = Math.round(stats.totalSize / (1024 * 1024) * 100) / 100;
    stats.jsTotalSize = stats.jsFiles.reduce((sum, file) => sum + file.size, 0);
    stats.cssTotalSize = stats.cssFiles.reduce((sum, file) => sum + file.size, 0);
    
    return stats;
  }

  // Collect system performance metrics
  collectSystemMetrics() {
    try {
      const memUsage = process.memoryUsage();
      
      return {
        memory: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external,
          arrayBuffers: memUsage.arrayBuffers
        },
        cpu: process.cpuUsage(),
        uptime: process.uptime(),
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { error: 'Could not collect system metrics' };
    }
  }

  // Generate recommendations based on results
  generateRecommendations() {
    this.logger.info('💡 Generating recommendations...');

    const recommendations = [];

    // Deployment readiness recommendations
    if (this.reportData.validations.deploymentReadiness?.status !== 'passed') {
      recommendations.push({
        category: 'deployment',
        priority: 'high',
        title: 'Fix Deployment Readiness Issues',
        description: 'Address deployment readiness validation failures before proceeding with deployment',
        actions: [
          'Review failed validation results',
          'Fix any test failures',
          'Ensure all required environment variables are set',
          'Validate health check endpoints'
        ]
      });
    }

    // Health check recommendations
    if (this.reportData.validations.healthChecks?.status === 'unhealthy') {
      recommendations.push({
        category: 'health',
        priority: 'high',
        title: 'Address Health Check Failures',
        description: 'Service health checks are failing, indicating potential runtime issues',
        actions: [
          'Investigate unhealthy endpoints',
          'Check external service dependencies',
          'Verify system resource availability',
          'Review application logs'
        ]
      });
    }

    // Security recommendations
    if (this.reportData.validations.securityScans?.status === 'warning') {
      recommendations.push({
        category: 'security',
        priority: 'medium',
        title: 'Address Security Vulnerabilities',
        description: 'Security scans found potential vulnerabilities that should be addressed',
        actions: [
          'Review NPM audit results',
          'Update vulnerable dependencies',
          'Fix ESLint security warnings',
          'Consider dependency pinning'
        ]
      });
    }

    // Performance recommendations
    if (this.reportData.metrics?.bundleMetrics?.totalSizeMB > 5) {
      recommendations.push({
        category: 'performance',
        priority: 'medium',
        title: 'Optimize Bundle Size',
        description: 'Bundle size is large and may impact loading performance',
        actions: [
          'Analyze bundle composition',
          'Implement code splitting',
          'Remove unused dependencies',
          'Consider lazy loading for large components'
        ]
      });
    }

    this.reportData.recommendations = recommendations;
    return recommendations;
  }

  // Generate artifacts (charts, graphs, etc.)
  generateArtifacts() {
    if (!this.config.generateArtifacts) {
      return;
    }

    this.logger.info('📊 Generating report artifacts...');

    // Create artifacts directory
    const artifactsDir = path.join(this.config.outputDir, 'artifacts');
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }

    // Generate validation summary chart data
    const validationChartData = this.generateValidationChartData();
    fs.writeFileSync(
      path.join(artifactsDir, 'validation-summary.json'),
      JSON.stringify(validationChartData, null, 2)
    );

    // Generate performance metrics data
    if (this.reportData.metrics) {
      fs.writeFileSync(
        path.join(artifactsDir, 'performance-metrics.json'),
        JSON.stringify(this.reportData.metrics, null, 2)
      );
    }

    // Generate recommendations summary
    fs.writeFileSync(
      path.join(artifactsDir, 'recommendations.json'),
      JSON.stringify(this.reportData.recommendations, null, 2)
    );

    this.reportData.artifacts = {
      validationChart: 'artifacts/validation-summary.json',
      performanceMetrics: 'artifacts/performance-metrics.json',
      recommendations: 'artifacts/recommendations.json'
    };
  }

  // Generate validation chart data
  generateValidationChartData() {
    const validations = this.reportData.validations;
    const chartData = {
      summary: {
        total: this.reportData.summary.totalValidations,
        passed: this.reportData.summary.passedValidations,
        failed: this.reportData.summary.failedValidations,
        warning: this.reportData.summary.warningValidations
      },
      details: []
    };

    Object.entries(validations).forEach(([name, validation]) => {
      chartData.details.push({
        name: name,
        status: validation.status,
        duration: validation.duration || 0
      });
    });

    return chartData;
  }

  // Calculate overall summary
  calculateSummary() {
    const validations = this.reportData.validations;
    let totalValidations = 0;
    let passedValidations = 0;
    let failedValidations = 0;
    let warningValidations = 0;

    Object.values(validations).forEach(validation => {
      totalValidations++;
      
      switch (validation.status) {
        case 'passed':
        case 'healthy':
          passedValidations++;
          break;
        case 'failed':
        case 'unhealthy':
          failedValidations++;
          break;
        case 'warning':
        case 'degraded':
          warningValidations++;
          break;
      }
    });

    const successRate = totalValidations > 0 
      ? (passedValidations / totalValidations) * 100 
      : 0;

    let overallStatus = 'passed';
    if (failedValidations > 0) {
      overallStatus = 'failed';
    } else if (warningValidations > 0) {
      overallStatus = 'warning';
    }

    this.reportData.summary = {
      overallStatus,
      totalValidations,
      passedValidations,
      failedValidations,
      warningValidations,
      successRate: parseFloat(successRate.toFixed(2)),
      duration: 0 // Will be set by the main process
    };
  }

  // Generate JSON report
  generateJsonReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `validation-report-${timestamp}.json`;
    const filepath = path.join(this.config.outputDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(this.reportData, null, 2));
    
    this.logger.success(`📄 JSON report generated: ${filepath}`);
    return filepath;
  }

  // Generate HTML report
  generateHtmlReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `validation-report-${timestamp}.html`;
    const filepath = path.join(this.config.outputDir, filename);

    const htmlContent = this.generateHtmlContent();
    fs.writeFileSync(filepath, htmlContent);
    
    this.logger.success(`📄 HTML report generated: ${filepath}`);
    return filepath;
  }

  // Generate HTML content for report
  generateHtmlContent() {
    const data = this.reportData;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pipeline Validation Report - ${data.metadata.serviceName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .header h1 {
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 12px;
        }
        .status-passed { background: #d4edda; color: #155724; }
        .status-failed { background: #f8d7da; color: #721c24; }
        .status-warning { background: #fff3cd; color: #856404; }
        .grid {
            display: grid;
            gap: 20px;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        }
        .card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .card h2 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 18px;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .metric:last-child { border-bottom: none; }
        .validation-item {
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border-left: 4px solid;
        }
        .validation-passed { 
            background: #f8fff9; 
            border-left-color: #28a745; 
        }
        .validation-failed { 
            background: #fff8f8; 
            border-left-color: #dc3545; 
        }
        .validation-warning { 
            background: #fffdf7; 
            border-left-color: #ffc107; 
        }
        .recommendation {
            background: #f8f9fa;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border-left: 4px solid #6c757d;
        }
        .recommendation.high { border-left-color: #dc3545; }
        .recommendation.medium { border-left-color: #ffc107; }
        .recommendation.low { border-left-color: #28a745; }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            color: #666;
            font-size: 14px;
        }
        .json-link {
            background: #007bff;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            margin-top: 10px;
        }
        .json-link:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Pipeline Validation Report</h1>
            <p><strong>Service:</strong> ${data.metadata.serviceName}</p>
            <p><strong>Environment:</strong> ${data.metadata.environment}</p>
            <p><strong>Generated:</strong> ${data.metadata.timestamp}</p>
            <p><strong>Overall Status:</strong> 
                <span class="status-badge status-${data.summary.overallStatus}">${data.summary.overallStatus}</span>
            </p>
        </div>

        <div class="grid">
            <div class="card">
                <h2>📊 Summary</h2>
                <div class="metric">
                    <span>Total Validations:</span>
                    <span><strong>${data.summary.totalValidations}</strong></span>
                </div>
                <div class="metric">
                    <span>Passed:</span>
                    <span style="color: #28a745;"><strong>${data.summary.passedValidations}</strong></span>
                </div>
                <div class="metric">
                    <span>Failed:</span>
                    <span style="color: #dc3545;"><strong>${data.summary.failedValidations}</strong></span>
                </div>
                <div class="metric">
                    <span>Warnings:</span>
                    <span style="color: #ffc107;"><strong>${data.summary.warningValidations}</strong></span>
                </div>
                <div class="metric">
                    <span>Success Rate:</span>
                    <span><strong>${data.summary.successRate}%</strong></span>
                </div>
            </div>

            ${this.generateValidationsSectionHtml()}
            ${this.generateRecommendationsSectionHtml()}
            ${this.generateMetricsSectionHtml()}
        </div>

        <div class="footer">
            <p>Generated by ValidationReportingSystem v${data.metadata.reportVersion}</p>
            <a href="#" class="json-link" onclick="downloadJson()">📄 Download JSON Report</a>
        </div>
    </div>

    <script>
        function downloadJson() {
            const data = ${JSON.stringify(data, null, 2)};
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'validation-report.json';
            a.click();
            URL.revokeObjectURL(url);
        }
    </script>
</body>
</html>`;
  }

  // Generate validations section HTML
  generateValidationsSectionHtml() {
    const validations = this.reportData.validations;
    
    if (Object.keys(validations).length === 0) {
      return '<div class="card"><h2>🔍 Validations</h2><p>No validation results available.</p></div>';
    }

    let html = '<div class="card"><h2>🔍 Validations</h2>';
    
    Object.entries(validations).forEach(([name, validation]) => {
      const statusClass = `validation-${validation.status === 'healthy' ? 'passed' : validation.status}`;
      html += `
        <div class="validation-item ${statusClass}">
          <h3>${name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h3>
          <p><strong>Status:</strong> ${validation.status}</p>
          ${validation.duration ? `<p><strong>Duration:</strong> ${validation.duration}ms</p>` : ''}
          ${validation.error ? `<p><strong>Error:</strong> ${validation.error}</p>` : ''}
          ${validation.timestamp ? `<p><strong>Timestamp:</strong> ${validation.timestamp}</p>` : ''}
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  // Generate recommendations section HTML
  generateRecommendationsSectionHtml() {
    const recommendations = this.reportData.recommendations;
    
    if (!recommendations || recommendations.length === 0) {
      return '<div class="card"><h2>💡 Recommendations</h2><p>No recommendations available.</p></div>';
    }

    let html = '<div class="card"><h2>💡 Recommendations</h2>';
    
    recommendations.forEach(rec => {
      html += `
        <div class="recommendation ${rec.priority}">
          <h3>${rec.title}</h3>
          <p>${rec.description}</p>
          <p><strong>Priority:</strong> ${rec.priority}</p>
          <p><strong>Category:</strong> ${rec.category}</p>
          <ul>
            ${rec.actions.map(action => `<li>${action}</li>`).join('')}
          </ul>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  // Generate metrics section HTML
  generateMetricsSectionHtml() {
    const metrics = this.reportData.metrics;
    
    if (!metrics || Object.keys(metrics).length === 0) {
      return '<div class="card"><h2>📈 Metrics</h2><p>No metrics available.</p></div>';
    }

    let html = '<div class="card"><h2>📈 Performance Metrics</h2>';
    
    // Build metrics
    if (metrics.buildMetrics) {
      html += '<h3>Build Metrics</h3>';
      html += `<div class="metric"><span>Node Version:</span><span>${metrics.buildMetrics.nodeVersion}</span></div>`;
      html += `<div class="metric"><span>Dependencies:</span><span>${metrics.buildMetrics.dependencies}</span></div>`;
      html += `<div class="metric"><span>Dev Dependencies:</span><span>${metrics.buildMetrics.devDependencies}</span></div>`;
    }
    
    // Bundle metrics
    if (metrics.bundleMetrics && !metrics.bundleMetrics.error) {
      html += '<h3>Bundle Metrics</h3>';
      html += `<div class="metric"><span>Total Size:</span><span>${metrics.bundleMetrics.totalSizeMB} MB</span></div>`;
      html += `<div class="metric"><span>JS Files:</span><span>${metrics.bundleMetrics.jsFiles.length}</span></div>`;
      html += `<div class="metric"><span>CSS Files:</span><span>${metrics.bundleMetrics.cssFiles.length}</span></div>`;
    }
    
    html += '</div>';
    return html;
  }

  // Main report generation function
  async generateReport() {
    const startTime = Date.now();
    
    this.logger.info(`🚀 Starting comprehensive validation report generation for ${this.config.serviceName}`);
    
    try {
      // Initialize
      this.initializeReportDirectory();

      // Run all validations and collect data
      await this.runDeploymentReadinessValidation();
      await this.runHealthMonitoring();
      await this.runSecurityScans();
      await this.collectPerformanceMetrics();

      // Calculate summary
      this.calculateSummary();
      this.reportData.summary.duration = Date.now() - startTime;

      // Generate recommendations
      this.generateRecommendations();

      // Generate artifacts
      this.generateArtifacts();

      // Generate reports
      const reports = {};
      
      if (this.config.reportFormat === 'json' || this.config.reportFormat === 'both') {
        reports.json = this.generateJsonReport();
      }
      
      if (this.config.reportFormat === 'html' || this.config.reportFormat === 'both') {
        reports.html = this.generateHtmlReport();
      }

      this.logger.success(`✅ Validation report generation completed in ${Date.now() - startTime}ms`);
      this.logger.info(`📊 Overall Status: ${this.reportData.summary.overallStatus.toUpperCase()}`);
      this.logger.info(`📄 Reports generated: ${Object.values(reports).join(', ')}`);

      // Return summary for exit code determination
      return {
        success: true,
        status: this.reportData.summary.overallStatus,
        reports: reports,
        summary: this.reportData.summary
      };

    } catch (error) {
      this.logger.error(`❌ Report generation failed: ${error.message}`);
      
      return {
        success: false,
        error: error.message,
        summary: this.reportData.summary
      };
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
    options.outputDir = options.outputDir || 'pipeline-reports';

    const reportingSystem = new ValidationReportingSystem(options);
    const result = await reportingSystem.generateReport();

    if (result.success) {
      console.log('\n📋 Validation Summary:');
      console.log('─'.repeat(50));
      console.log(`Overall Status: ${result.status.toUpperCase()}`);
      console.log(`Total Validations: ${result.summary.totalValidations}`);
      console.log(`Success Rate: ${result.summary.successRate}%`);
      console.log(`Duration: ${result.summary.duration}ms`);
      
      if (result.reports) {
        console.log('\n📄 Generated Reports:');
        Object.entries(result.reports).forEach(([format, path]) => {
          console.log(`  ${format.toUpperCase()}: ${path}`);
        });
      }

      // Exit with appropriate code based on status
      process.exit(result.status === 'failed' ? 1 : 0);
    } else {
      console.error('❌ Report generation failed:', result.error);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Validation reporting system failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { ValidationReportingSystem };
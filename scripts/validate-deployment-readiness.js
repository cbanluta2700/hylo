#!/usr/bin/env node

/**
 * Deployment Readiness Validator
 * Comprehensive validation of deployment readiness across multiple dimensions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeploymentReadinessValidator {
  constructor(options = {}) {
    this.config = {
      environment: options.environment || process.env.NODE_ENV || 'production',
      requireTests: options.requireTests !== false,
      requireCoverage: options.requireCoverage !== false,
      minCoverageThreshold: options.minCoverageThreshold || 80,
      requireBuild: options.requireBuild !== false,
      requireSecurityScan: options.requireSecurityScan !== false,
      requireLinting: options.requireLinting !== false,
      requireHealthCheck: options.requireHealthCheck !== false,
      checkDependencies: options.checkDependencies !== false,
      validateEnvVars: options.validateEnvVars !== false,
      requiredEnvVars: options.requiredEnvVars || [],
      ...options
    };

    this.validationResults = {
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
      overall_status: 'unknown',
      validations: [],
      warnings: [],
      errors: [],
      summary: {
        total_checks: 0,
        passed_checks: 0,
        failed_checks: 0,
        warning_checks: 0,
        success_rate: 0
      }
    };

    this.logger = this.createLogger();
  }

  createLogger() {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const isDev = process.env.NODE_ENV === 'development';

    return {
      debug: (msg) => {
        if (logLevel === 'debug' || isDev) {
          console.log(`🐛 [DEBUG] ${msg}`);
        }
      },
      info: (msg) => console.log(`ℹ️  [INFO] ${msg}`),
      warn: (msg) => console.warn(`⚠️  [WARN] ${msg}`),
      error: (msg) => console.error(`❌ [ERROR] ${msg}`),
      success: (msg) => console.log(`✅ [SUCCESS] ${msg}`)
    };
  }

  // Add validation result
  addValidation(name, status, message, details = null, duration = 0) {
    const validation = {
      name,
      status, // 'passed', 'failed', 'warning'
      message,
      details,
      duration,
      timestamp: new Date().toISOString()
    };

    this.validationResults.validations.push(validation);
    this.validationResults.summary.total_checks++;

    switch (status) {
      case 'passed':
        this.validationResults.summary.passed_checks++;
        this.logger.success(`${name}: ${message}`);
        break;
      case 'failed':
        this.validationResults.summary.failed_checks++;
        this.validationResults.errors.push(`${name}: ${message}`);
        this.logger.error(`${name}: ${message}`);
        break;
      case 'warning':
        this.validationResults.summary.warning_checks++;
        this.validationResults.warnings.push(`${name}: ${message}`);
        this.logger.warn(`${name}: ${message}`);
        break;
    }

    // Update success rate
    this.validationResults.summary.success_rate = 
      this.validationResults.summary.total_checks > 0 
        ? (this.validationResults.summary.passed_checks / this.validationResults.summary.total_checks) * 100 
        : 0;
  }

  // Execute command with timeout and error handling
  executeCommand(command, timeout = 60000) {
    try {
      const startTime = Date.now();
      const result = execSync(command, {
        stdio: 'pipe',
        timeout,
        encoding: 'utf8'
      });
      const duration = Date.now() - startTime;
      return { success: true, output: result, duration, error: null };
    } catch (error) {
      const duration = Date.now() - Date.now();
      return { 
        success: false, 
        output: error.stdout || '', 
        duration,
        error: error.message || 'Command execution failed'
      };
    }
  }

  // Validate test suite execution
  async validateTestSuite() {
    if (!this.config.requireTests) {
      this.addValidation('Test Suite', 'warning', 'Test validation disabled', null, 0);
      return;
    }

    this.logger.info('Validating test suite execution...');
    
    // Check if test scripts exist
    if (!fs.existsSync('package.json')) {
      this.addValidation('Test Suite', 'failed', 'package.json not found');
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasTestScript = packageJson.scripts && (
      packageJson.scripts.test || 
      packageJson.scripts['test:unit'] || 
      packageJson.scripts['test:integration']
    );

    if (!hasTestScript) {
      this.addValidation('Test Suite', 'failed', 'No test scripts found in package.json');
      return;
    }

    // Run tests
    const testCommands = [
      packageJson.scripts['test:unit'] ? 'npm run test:unit' : null,
      packageJson.scripts['test:integration'] ? 'npm run test:integration' : null,
      packageJson.scripts.test ? 'npm test' : null
    ].filter(Boolean);

    let allTestsPassed = true;
    let totalDuration = 0;
    const testResults = [];

    for (const command of testCommands) {
      const result = this.executeCommand(command, 300000); // 5 minute timeout
      totalDuration += result.duration;
      
      if (result.success) {
        testResults.push({ command, success: true, output: result.output.slice(-500) });
      } else {
        testResults.push({ command, success: false, error: result.error });
        allTestsPassed = false;
      }
    }

    if (allTestsPassed) {
      this.addValidation(
        'Test Suite', 
        'passed', 
        `All tests passed in ${(totalDuration / 1000).toFixed(2)}s`,
        { commands: testCommands.length, results: testResults },
        totalDuration
      );
    } else {
      this.addValidation(
        'Test Suite', 
        'failed', 
        'One or more test suites failed',
        { results: testResults },
        totalDuration
      );
    }
  }

  // Validate code coverage requirements
  async validateCoverage() {
    if (!this.config.requireCoverage) {
      this.addValidation('Code Coverage', 'warning', 'Coverage validation disabled', null, 0);
      return;
    }

    this.logger.info('Validating code coverage...');

    // Check if coverage directory exists
    if (!fs.existsSync('coverage')) {
      const result = this.executeCommand('npm run test:coverage');
      if (!result.success) {
        this.addValidation('Code Coverage', 'failed', 'Failed to generate coverage report');
        return;
      }
    }

    // Read coverage summary
    const coverageSummaryPath = 'coverage/coverage-summary.json';
    if (!fs.existsSync(coverageSummaryPath)) {
      this.addValidation('Code Coverage', 'failed', 'Coverage summary not found');
      return;
    }

    try {
      const coverageData = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
      const linesCoverage = coverageData.total?.lines?.pct || 0;
      const functionsCoverage = coverageData.total?.functions?.pct || 0;
      const branchesCoverage = coverageData.total?.branches?.pct || 0;
      const statementsCoverage = coverageData.total?.statements?.pct || 0;

      const avgCoverage = (linesCoverage + functionsCoverage + branchesCoverage + statementsCoverage) / 4;
      
      const details = {
        lines: linesCoverage,
        functions: functionsCoverage,
        branches: branchesCoverage,
        statements: statementsCoverage,
        average: avgCoverage,
        threshold: this.config.minCoverageThreshold
      };

      if (avgCoverage >= this.config.minCoverageThreshold) {
        this.addValidation(
          'Code Coverage', 
          'passed', 
          `Coverage ${avgCoverage.toFixed(1)}% meets minimum threshold ${this.config.minCoverageThreshold}%`,
          details
        );
      } else {
        this.addValidation(
          'Code Coverage', 
          'failed', 
          `Coverage ${avgCoverage.toFixed(1)}% below minimum threshold ${this.config.minCoverageThreshold}%`,
          details
        );
      }
    } catch (error) {
      this.addValidation('Code Coverage', 'failed', `Failed to parse coverage data: ${error.message}`);
    }
  }

  // Validate build process
  async validateBuild() {
    if (!this.config.requireBuild) {
      this.addValidation('Build Process', 'warning', 'Build validation disabled', null, 0);
      return;
    }

    this.logger.info('Validating build process...');

    const result = this.executeCommand('npm run build', 600000); // 10 minute timeout

    if (result.success) {
      // Check if build artifacts exist
      const buildDirs = ['dist', 'build', '.next'];
      const existingBuildDir = buildDirs.find(dir => fs.existsSync(dir));

      if (existingBuildDir) {
        const buildStats = fs.statSync(existingBuildDir);
        this.addValidation(
          'Build Process', 
          'passed', 
          `Build completed successfully in ${(result.duration / 1000).toFixed(2)}s`,
          { 
            buildDir: existingBuildDir, 
            buildTime: buildStats.mtime,
            duration: result.duration
          },
          result.duration
        );
      } else {
        this.addValidation('Build Process', 'warning', 'Build completed but no artifacts found');
      }
    } else {
      this.addValidation(
        'Build Process', 
        'failed', 
        'Build process failed',
        { error: result.error, output: result.output.slice(-1000) },
        result.duration
      );
    }
  }

  // Validate security scanning
  async validateSecurity() {
    if (!this.config.requireSecurityScan) {
      this.addValidation('Security Scan', 'warning', 'Security validation disabled', null, 0);
      return;
    }

    this.logger.info('Validating security scan...');

    // Run npm audit
    const auditResult = this.executeCommand('npm audit --audit-level moderate');
    
    if (auditResult.success) {
      try {
        const auditJsonResult = this.executeCommand('npm audit --json');
        if (auditJsonResult.success) {
          const auditData = JSON.parse(auditJsonResult.output);
          const vulnerabilities = auditData.metadata?.vulnerabilities || {};
          const totalVulnerabilities = Object.values(vulnerabilities).reduce((sum, count) => sum + count, 0);

          if (totalVulnerabilities === 0) {
            this.addValidation('Security Scan', 'passed', 'No security vulnerabilities found');
          } else {
            const criticalCount = vulnerabilities.critical || 0;
            const highCount = vulnerabilities.high || 0;
            
            if (criticalCount > 0 || highCount > 10) {
              this.addValidation(
                'Security Scan', 
                'failed', 
                `Found ${totalVulnerabilities} vulnerabilities (${criticalCount} critical, ${highCount} high)`,
                vulnerabilities
              );
            } else {
              this.addValidation(
                'Security Scan', 
                'warning', 
                `Found ${totalVulnerabilities} low/moderate vulnerabilities`,
                vulnerabilities
              );
            }
          }
        } else {
          this.addValidation('Security Scan', 'passed', 'npm audit completed (unable to parse details)');
        }
      } catch (error) {
        this.addValidation('Security Scan', 'warning', 'Security scan completed but failed to parse results');
      }
    } else {
      this.addValidation('Security Scan', 'failed', 'Security scan failed', { error: auditResult.error });
    }
  }

  // Validate code linting
  async validateLinting() {
    if (!this.config.requireLinting) {
      this.addValidation('Code Linting', 'warning', 'Linting validation disabled', null, 0);
      return;
    }

    this.logger.info('Validating code linting...');

    const result = this.executeCommand('npm run lint');

    if (result.success) {
      this.addValidation('Code Linting', 'passed', 'Code linting passed');
    } else {
      // Try to get detailed lint results
      const jsonLintResult = this.executeCommand('npm run lint -- --format json');
      let details = null;

      if (jsonLintResult.success) {
        try {
          const lintResults = JSON.parse(jsonLintResult.output);
          const totalErrors = lintResults.reduce((sum, file) => sum + file.errorCount, 0);
          const totalWarnings = lintResults.reduce((sum, file) => sum + file.warningCount, 0);
          
          details = {
            totalFiles: lintResults.length,
            totalErrors,
            totalWarnings,
            filesWithIssues: lintResults.filter(f => f.errorCount > 0 || f.warningCount > 0).length
          };
        } catch (parseError) {
          this.logger.debug('Failed to parse lint JSON output');
        }
      }

      if (result.output.includes('error') || result.error.includes('error')) {
        this.addValidation(
          'Code Linting', 
          'failed', 
          'Code linting failed with errors',
          details
        );
      } else {
        this.addValidation(
          'Code Linting', 
          'warning', 
          'Code linting completed with warnings',
          details
        );
      }
    }
  }

  // Validate environment variables
  async validateEnvironmentVariables() {
    if (!this.config.validateEnvVars || this.config.requiredEnvVars.length === 0) {
      this.addValidation('Environment Variables', 'warning', 'Environment variable validation disabled', null, 0);
      return;
    }

    this.logger.info('Validating environment variables...');

    const missingVars = [];
    const presentVars = [];

    for (const envVar of this.config.requiredEnvVars) {
      if (process.env[envVar]) {
        presentVars.push(envVar);
      } else {
        missingVars.push(envVar);
      }
    }

    const details = {
      required: this.config.requiredEnvVars,
      present: presentVars,
      missing: missingVars,
      environment: this.config.environment
    };

    if (missingVars.length === 0) {
      this.addValidation(
        'Environment Variables', 
        'passed', 
        `All ${this.config.requiredEnvVars.length} required environment variables are present`,
        details
      );
    } else {
      this.addValidation(
        'Environment Variables', 
        'failed', 
        `Missing ${missingVars.length} required environment variables: ${missingVars.join(', ')}`,
        details
      );
    }
  }

  // Validate dependencies
  async validateDependencies() {
    if (!this.config.checkDependencies) {
      this.addValidation('Dependencies', 'warning', 'Dependency validation disabled', null, 0);
      return;
    }

    this.logger.info('Validating dependencies...');

    // Check if node_modules exists
    if (!fs.existsSync('node_modules')) {
      this.addValidation('Dependencies', 'failed', 'node_modules directory not found');
      return;
    }

    // Run npm ls to check dependency tree
    const lsResult = this.executeCommand('npm ls --depth=0');
    
    if (lsResult.success) {
      // Count dependencies
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const prodDeps = Object.keys(packageJson.dependencies || {}).length;
      const devDeps = Object.keys(packageJson.devDependencies || {}).length;

      this.addValidation(
        'Dependencies', 
        'passed', 
        `Dependency validation passed (${prodDeps} prod, ${devDeps} dev dependencies)`,
        { 
          productionDependencies: prodDeps, 
          developmentDependencies: devDeps,
          totalDependencies: prodDeps + devDeps
        }
      );
    } else {
      // Check for common issues
      if (lsResult.output.includes('UNMET DEPENDENCY') || lsResult.output.includes('missing')) {
        this.addValidation('Dependencies', 'failed', 'Missing or unmet dependencies detected');
      } else {
        this.addValidation('Dependencies', 'warning', 'Dependency tree validation completed with warnings');
      }
    }
  }

  // Validate health check endpoint
  async validateHealthCheck() {
    if (!this.config.requireHealthCheck) {
      this.addValidation('Health Check', 'warning', 'Health check validation disabled', null, 0);
      return;
    }

    this.logger.info('Validating health check endpoint...');

    // Check if health check endpoint exists in the code
    const healthCheckPaths = [
      'api/health',
      'src/health',
      'api/health.ts',
      'api/health.js',
      'api/health/route.ts',
      'api/health/route.js'
    ];

    const existingHealthCheck = healthCheckPaths.find(path => fs.existsSync(path));

    if (existingHealthCheck) {
      // Try to start the application and test health endpoint
      let serverProcess = null;
      try {
        // Start the server in background
        const { spawn } = require('child_process');
        serverProcess = spawn('npm', ['run', 'dev'], { 
          detached: false, 
          stdio: 'pipe' 
        });

        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Test health endpoint
        const healthCheckResult = this.executeCommand('curl -f http://localhost:3000/api/health || curl -f http://localhost:4173/health');
        
        if (healthCheckResult.success) {
          this.addValidation(
            'Health Check', 
            'passed', 
            'Health check endpoint responding correctly',
            { endpoint: existingHealthCheck, response: healthCheckResult.output.slice(0, 200) }
          );
        } else {
          this.addValidation(
            'Health Check', 
            'warning', 
            'Health check endpoint exists but not responding',
            { endpoint: existingHealthCheck }
          );
        }
      } catch (error) {
        this.addValidation(
          'Health Check', 
          'warning', 
          'Health check endpoint exists but unable to test',
          { endpoint: existingHealthCheck, error: error.message }
        );
      } finally {
        if (serverProcess) {
          serverProcess.kill();
        }
      }
    } else {
      this.addValidation('Health Check', 'failed', 'No health check endpoint found');
    }
  }

  // Validate TypeScript compilation
  async validateTypeScript() {
    if (!fs.existsSync('tsconfig.json')) {
      this.addValidation('TypeScript', 'warning', 'No TypeScript configuration found', null, 0);
      return;
    }

    this.logger.info('Validating TypeScript compilation...');

    const result = this.executeCommand('npm run type-check || npx tsc --noEmit');

    if (result.success) {
      this.addValidation('TypeScript', 'passed', 'TypeScript compilation successful');
    } else {
      // Count TypeScript errors
      const errorLines = result.output.split('\n').filter(line => line.includes('error TS'));
      const errorCount = errorLines.length;

      this.addValidation(
        'TypeScript', 
        'failed', 
        `TypeScript compilation failed with ${errorCount} errors`,
        { 
          errorCount, 
          errors: errorLines.slice(0, 10) // Show first 10 errors
        }
      );
    }
  }

  // Validate file permissions and structure
  async validateFileStructure() {
    this.logger.info('Validating file structure...');

    const criticalFiles = [
      'package.json',
      'README.md'
    ];

    const missingFiles = criticalFiles.filter(file => !fs.existsSync(file));
    const presentFiles = criticalFiles.filter(file => fs.existsSync(file));

    if (missingFiles.length === 0) {
      this.addValidation(
        'File Structure', 
        'passed', 
        'All critical files present',
        { criticalFiles: presentFiles }
      );
    } else {
      this.addValidation(
        'File Structure', 
        'warning', 
        `Missing files: ${missingFiles.join(', ')}`,
        { present: presentFiles, missing: missingFiles }
      );
    }
  }

  // Run all validations
  async runAllValidations() {
    this.logger.info(`🚀 Starting deployment readiness validation for ${this.config.environment} environment`);
    this.logger.info('─'.repeat(80));

    const startTime = Date.now();

    // Execute all validations
    await this.validateFileStructure();
    await this.validateTypeScript();
    await this.validateDependencies();
    await this.validateEnvironmentVariables();
    await this.validateLinting();
    await this.validateSecurity();
    await this.validateBuild();
    await this.validateTestSuite();
    await this.validateCoverage();
    await this.validateHealthCheck();

    const totalDuration = Date.now() - startTime;

    // Determine overall status
    this.validationResults.overall_status = this.determineOverallStatus();
    this.validationResults.duration = totalDuration;

    this.logger.info('─'.repeat(80));
    this.generateSummaryReport();

    return this.validationResults;
  }

  // Determine overall deployment readiness status
  determineOverallStatus() {
    const { failed_checks, warning_checks, passed_checks, total_checks } = this.validationResults.summary;

    if (failed_checks > 0) {
      return 'not_ready';
    } else if (warning_checks > total_checks * 0.3) { // More than 30% warnings
      return 'ready_with_warnings';
    } else if (passed_checks === total_checks) {
      return 'ready';
    } else {
      return 'ready_with_warnings';
    }
  }

  // Generate summary report
  generateSummaryReport() {
    const { overall_status, summary, duration } = this.validationResults;
    const statusIcon = overall_status === 'ready' ? '✅' : overall_status === 'ready_with_warnings' ? '⚠️' : '❌';
    
    this.logger.info(`\n${statusIcon} Deployment Readiness: ${overall_status.toUpperCase()}`);
    this.logger.info(`📊 Summary: ${summary.passed_checks}/${summary.total_checks} validations passed (${summary.success_rate.toFixed(1)}%)`);
    this.logger.info(`⏱️  Total Duration: ${(duration / 1000).toFixed(2)} seconds`);

    if (summary.failed_checks > 0) {
      this.logger.error(`\n❌ Failed Validations (${summary.failed_checks}):`);
      this.validationResults.errors.forEach(error => {
        this.logger.error(`   • ${error}`);
      });
    }

    if (summary.warning_checks > 0) {
      this.logger.warn(`\n⚠️  Warnings (${summary.warning_checks}):`);
      this.validationResults.warnings.forEach(warning => {
        this.logger.warn(`   • ${warning}`);
      });
    }

    if (overall_status === 'ready') {
      this.logger.success('\n🚀 Application is ready for deployment!');
    } else if (overall_status === 'ready_with_warnings') {
      this.logger.warn('\n⚠️  Application is ready for deployment but has warnings to address.');
    } else {
      this.logger.error('\n❌ Application is NOT ready for deployment. Please fix the issues above.');
    }
  }

  // Save validation results to file
  saveResults(outputPath = 'deployment-readiness-report.json') {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(this.validationResults, null, 2));
    this.logger.info(`📄 Validation report saved to: ${outputPath}`);
    
    return outputPath;
  }
}

// Main execution
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const environment = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || process.env.NODE_ENV || 'production';
    
    const options = {
      environment,
      requiredEnvVars: [
        'NODE_ENV',
        'DATABASE_URL',
        'API_URL'
      ].concat(process.env.REQUIRED_ENV_VARS?.split(',') || [])
    };

    const validator = new DeploymentReadinessValidator(options);
    const results = await validator.runAllValidations();
    
    const reportPath = validator.saveResults();
    
    // Exit with appropriate code
    if (results.overall_status === 'not_ready') {
      process.exit(1);
    } else if (results.overall_status === 'ready_with_warnings') {
      process.exit(0); // Allow deployment with warnings
    } else {
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Deployment readiness validation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { DeploymentReadinessValidator };
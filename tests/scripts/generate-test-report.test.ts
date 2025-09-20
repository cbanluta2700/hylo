import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// Since we can't import the JS module directly, we'll require it
const { TestReportGenerator } = require('../../scripts/generate-test-report.js');

describe('TestReportGenerator', () => {
  let generator: any;
  let tempDir: string;

  beforeEach(() => {
    generator = new TestReportGenerator();
    tempDir = 'test-temp';
    
    // Create temporary directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should initialize with default report data structure', () => {
      expect(generator.reportData).toBeDefined();
      expect(generator.reportData.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(generator.reportData.summary.total_tests).toBe(0);
      expect(generator.reportData.summary.success_rate).toBe(0);
      expect(generator.reportData.test_suites).toEqual([]);
    });

    it('should populate git metadata from environment variables', () => {
      const originalEnv = process.env;
      
      process.env['GITHUB_SHA'] = 'abc123def456';
      process.env['GITHUB_REF'] = 'refs/heads/main';
      process.env['GITHUB_RUN_ID'] = '12345';
      
      const newGenerator = new TestReportGenerator();
      
      expect(newGenerator.reportData.git_sha).toBe('abc123def456');
      expect(newGenerator.reportData.git_ref).toBe('refs/heads/main');
      expect(newGenerator.reportData.workflow_run_id).toBe('12345');
      
      process.env = originalEnv;
    });
  });

  describe('loadUnitTestResults', () => {
    it('should load valid unit test results', () => {
      const mockResults = {
        testResults: [
          { status: 'passed', title: 'Test 1', duration: 100 },
          { status: 'failed', title: 'Test 2', duration: 200 },
          { status: 'skipped', title: 'Test 3', duration: 0 }
        ],
        runTime: 500
      };

      const resultPath = path.join(tempDir, 'unit-test-results.json');
      fs.writeFileSync(resultPath, JSON.stringify(mockResults));

      generator.loadUnitTestResults(resultPath);

      expect(generator.reportData.test_suites).toHaveLength(1);
      const unitSuite = generator.reportData.test_suites[0];
      
      expect(unitSuite.name).toBe('Unit Tests');
      expect(unitSuite.type).toBe('unit');
      expect(unitSuite.tests).toBe(3);
      expect(unitSuite.passed).toBe(1);
      expect(unitSuite.failed).toBe(1);
      expect(unitSuite.skipped).toBe(1);
      expect(unitSuite.duration).toBe(500);
      expect(unitSuite.status).toBe('failed'); // Has failed tests
    });

    it('should handle missing unit test results file', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      generator.loadUnitTestResults('non-existent-file.json');
      
      expect(generator.reportData.test_suites).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unit test results not found'));
      
      consoleSpy.mockRestore();
    });

    it('should handle malformed JSON file', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const resultPath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(resultPath, 'invalid json content');

      generator.loadUnitTestResults(resultPath);

      expect(generator.reportData.test_suites).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to load unit test results'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('loadPerformanceTestResults', () => {
    it('should load valid performance test results', () => {
      const mockPerfResults = {
        timestamp: '2024-01-01T00:00:00Z',
        duration: 30000,
        concurrent_users: 10,
        counters: {
          'http.requests': 1000
        },
        rates: {
          'http.request_rate': 33.3
        },
        latency: {
          min: 50,
          max: 500,
          median: 120,
          p95: 200,
          p99: 400
        },
        errors: {
          'timeout': 5
        }
      };

      const resultPath = path.join(tempDir, 'performance-metrics.json');
      fs.writeFileSync(resultPath, JSON.stringify(mockPerfResults));

      generator.loadPerformanceTestResults(resultPath);

      expect(generator.reportData.performance).toBeDefined();
      expect(generator.reportData.performance.total_requests).toBe(1000);
      expect(generator.reportData.performance.request_rate).toBe(33.3);
      expect(generator.reportData.performance.latency.p95).toBe(200);
      expect(generator.reportData.performance.success_rate).toBeCloseTo(99.5); // 995/1000
      
      // Should also add performance suite
      const perfSuite = generator.reportData.test_suites.find((s: any) => s.type === 'performance');
      expect(perfSuite).toBeDefined();
      expect(perfSuite.status).toBe('passed'); // >90% success rate
    });

    it('should calculate performance success rate correctly', () => {
      const perfResults = {
        counters: { 'http.requests': 100 },
        errors: { 'timeout': 5, '5xx': 3 }
      };

      const successRate = generator.calculatePerformanceSuccessRate(perfResults);
      expect(successRate).toBe(92); // (100 - 8) / 100 * 100
    });

    it('should handle zero requests', () => {
      const perfResults = {
        counters: { 'http.requests': 0 },
        errors: {}
      };

      const successRate = generator.calculatePerformanceSuccessRate(perfResults);
      expect(successRate).toBe(0);
    });
  });

  describe('loadCoverageResults', () => {
    it('should load valid coverage results', () => {
      const mockCoverage = {
        total: {
          lines: { pct: 85.5, covered: 855, skipped: 10, total: 1000 },
          functions: { pct: 90.0, covered: 90, skipped: 0, total: 100 },
          branches: { pct: 75.0, covered: 30, skipped: 5, total: 40 },
          statements: { pct: 88.0, covered: 880, skipped: 0, total: 1000 }
        }
      };

      const resultPath = path.join(tempDir, 'coverage-summary.json');
      fs.writeFileSync(resultPath, JSON.stringify(mockCoverage));

      generator.loadCoverageResults(resultPath);

      expect(generator.reportData.coverage).toBeDefined();
      expect(generator.reportData.coverage.lines.pct).toBe(85.5);
      expect(generator.reportData.coverage.functions.pct).toBe(90.0);
      expect(generator.reportData.coverage.branches.pct).toBe(75.0);
      expect(generator.reportData.coverage.statements.pct).toBe(88.0);
    });
  });

  describe('loadQualityMetrics', () => {
    it('should load valid ESLint results', () => {
      const mockESLintResults = [
        {
          filePath: '/path/to/file1.ts',
          errorCount: 2,
          warningCount: 1,
          messages: []
        },
        {
          filePath: '/path/to/file2.ts',
          errorCount: 0,
          warningCount: 3,
          messages: []
        },
        {
          filePath: '/path/to/file3.ts',
          errorCount: 0,
          warningCount: 0,
          messages: []
        }
      ];

      const resultPath = path.join(tempDir, 'eslint-results.json');
      fs.writeFileSync(resultPath, JSON.stringify(mockESLintResults));

      generator.loadQualityMetrics(resultPath);

      expect(generator.reportData.quality_metrics).toBeDefined();
      const eslint = generator.reportData.quality_metrics.eslint;
      
      expect(eslint.total_files).toBe(3);
      expect(eslint.files_with_issues).toBe(2);
      expect(eslint.total_errors).toBe(2);
      expect(eslint.total_warnings).toBe(4);
      expect(eslint.quality_score).toBeGreaterThan(0);
    });

    it('should calculate quality score correctly', () => {
      const score1 = generator.calculateQualityScore(0, 0, 10); // Perfect score
      expect(score1).toBe(100);

      const score2 = generator.calculateQualityScore(5, 10, 10); // High penalty
      expect(score2).toBeLessThan(100);
      expect(score2).toBeGreaterThanOrEqual(0);
    });
  });

  describe('determineOverallStatus', () => {
    it('should return "failed" when tests fail', () => {
      generator.reportData.summary.failed_tests = 1;
      const status = generator.determineOverallStatus();
      expect(status).toBe('failed');
    });

    it('should return "failed" when quality issues exist', () => {
      generator.reportData.quality_metrics = {
        eslint: {
          total_errors: 1,
          total_warnings: 0,
          total_files: 1,
          files_with_issues: 1,
          quality_score: 90
        }
      };
      const status = generator.determineOverallStatus();
      expect(status).toBe('failed');
    });

    it('should return "warning" for low coverage', () => {
      generator.reportData.coverage = {
        lines: { pct: 70 },
        functions: { pct: 80 },
        branches: { pct: 75 },
        statements: { pct: 72 }
      };
      const status = generator.determineOverallStatus();
      expect(status).toBe('warning');
    });

    it('should return "warning" for low performance', () => {
      generator.reportData.performance = {
        success_rate: 85
      };
      const status = generator.determineOverallStatus();
      expect(status).toBe('warning');
    });

    it('should return "passed" when all criteria are met', () => {
      generator.reportData.summary.failed_tests = 0;
      generator.reportData.coverage = { lines: { pct: 85 } };
      generator.reportData.performance = { success_rate: 95 };
      generator.reportData.quality_metrics = {
        eslint: { total_errors: 0 }
      };
      
      const status = generator.determineOverallStatus();
      expect(status).toBe('passed');
    });
  });

  describe('generatePrComment', () => {
    beforeEach(() => {
      // Set up test data
      generator.reportData.overall_status = 'passed';
      generator.reportData.git_sha = 'abc123def456';
      generator.reportData.summary = {
        total_tests: 10,
        passed_tests: 9,
        failed_tests: 1,
        success_rate: 90
      };
      generator.reportData.test_suites = [
        {
          name: 'Unit Tests',
          status: 'passed',
          tests: 5,
          passed: 5,
          failed: 0
        }
      ];
    });

    it('should generate markdown PR comment', () => {
      const comment = generator.generatePrComment();
      
      expect(comment).toContain('## ✅ Test Results');
      expect(comment).toContain('**Overall Status:** PASSED');
      expect(comment).toContain('`abc123de`'); // Shortened SHA
      expect(comment).toContain('| Total Tests | 10 |');
      expect(comment).toContain('| Success Rate | 90.0% |');
      expect(comment).toContain('| ✅ Unit Tests |');
    });

    it('should include coverage information when available', () => {
      generator.reportData.coverage = {
        lines: { pct: 85 },
        functions: { pct: 90 },
        branches: { pct: 75 },
        statements: { pct: 88 }
      };

      const comment = generator.generatePrComment();
      
      expect(comment).toContain('### 📋 Coverage');
      expect(comment).toContain('| Lines | 85% |');
      expect(comment).toContain('| Functions | 90% |');
    });

    it('should include performance metrics when available', () => {
      generator.reportData.performance = {
        total_requests: 1000,
        request_rate: 50.5,
        latency: { p95: 200 },
        success_rate: 95.5
      };

      const comment = generator.generatePrComment();
      
      expect(comment).toContain('### 🚀 Performance');
      expect(comment).toContain('| Total Requests | 1000 |');
      expect(comment).toContain('| Request Rate | 50.5 RPS |');
      expect(comment).toContain('| Success Rate | 95.5% |');
    });
  });

  describe('generateReport', () => {
    it('should generate complete report with all sections', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const report = generator.generateReport();
      
      expect(report).toBe(generator.reportData);
      expect(report.overall_status).toBeDefined();
      expect(['passed', 'warning', 'failed']).toContain(report.overall_status);
      
      consoleSpy.mockRestore();
    });
  });

  describe('saveReports', () => {
    it('should save JSON, HTML, and PR comment reports', () => {
      generator.reportData.overall_status = 'passed';
      
      const reportPaths = generator.saveReports();
      
      expect(reportPaths.json).toContain('comprehensive-report.json');
      expect(reportPaths.html).toContain('comprehensive-report.html');
      expect(reportPaths.prComment).toContain('pr-comment.md');
      
      // Verify files exist
      expect(fs.existsSync(reportPaths.json)).toBe(true);
      expect(fs.existsSync(reportPaths.html)).toBe(true);
      expect(fs.existsSync(reportPaths.prComment)).toBe(true);
      
      // Verify JSON content
      const savedData = JSON.parse(fs.readFileSync(reportPaths.json, 'utf8'));
      expect(savedData.overall_status).toBe('passed');
      
      // Cleanup
      fs.unlinkSync(reportPaths.json);
      fs.unlinkSync(reportPaths.html);
      fs.unlinkSync(reportPaths.prComment);
      fs.rmdirSync('test-results');
    });
  });
});
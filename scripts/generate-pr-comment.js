#!/usr/bin/env node

/**
 * GitHub PR Comment Generator
 * Posts comprehensive test reports as PR comments
 */

const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

class GitHubPRCommentGenerator {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
    
    this.context = {
      owner: process.env.GITHUB_REPOSITORY?.split('/')[0],
      repo: process.env.GITHUB_REPOSITORY?.split('/')[1],
      pull_number: process.env.GITHUB_PR_NUMBER ? parseInt(process.env.GITHUB_PR_NUMBER) : null,
      sha: process.env.GITHUB_SHA,
      workflow_run_id: process.env.GITHUB_RUN_ID,
    };
  }

  // Validate GitHub context
  validateContext() {
    const required = ['owner', 'repo', 'pull_number', 'sha'];
    const missing = required.filter(key => !this.context[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required GitHub context: ${missing.join(', ')}`);
    }

    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }
  }

  // Load test report data
  loadTestReport(filePath = 'test-results/comprehensive-report.json') {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Test report not found at: ${filePath}`);
    }

    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      throw new Error(`Failed to parse test report: ${error.message}`);
    }
  }

  // Generate comprehensive PR comment
  generatePRComment(reportData) {
    const status = reportData.overall_status;
    const statusIcon = status === 'passed' ? '✅' : status === 'warning' ? '⚠️' : '❌';
    const statusColor = status === 'passed' ? '28a745' : status === 'warning' ? 'ffc107' : 'dc3545';
    
    let comment = `## ${statusIcon} Hylo Travel AI - Test Results\n\n`;
    
    // Status badge
    comment += `![${status}](https://img.shields.io/badge/Status-${status.toUpperCase()}-${statusColor}?style=for-the-badge)\n\n`;
    
    comment += `**🔗 Links:** `;
    comment += `[Workflow Run](https://github.com/${this.context.owner}/${this.context.repo}/actions/runs/${this.context.workflow_run_id}) | `;
    comment += `[Coverage Report](https://github.com/${this.context.owner}/${this.context.repo}/actions/runs/${this.context.workflow_run_id}#artifacts) | `;
    comment += `[Performance Metrics](https://github.com/${this.context.owner}/${this.context.repo}/actions/runs/${this.context.workflow_run_id}#artifacts)\n\n`;
    
    comment += `**📋 Metadata:**\n`;
    comment += `- **Commit:** \`${reportData.git_sha.substring(0, 8)}\`\n`;
    comment += `- **Timestamp:** ${new Date(reportData.timestamp).toLocaleString()}\n`;
    comment += `- **Duration:** ${(reportData.summary.total_duration / 1000).toFixed(1)}s\n\n`;
    
    // Test Summary with visual progress
    comment += `### 📊 Test Summary\n\n`;
    const successRate = reportData.summary.success_rate;
    const progressBar = this.generateProgressBar(successRate);
    
    comment += `<details open>\n`;
    comment += `<summary><strong>Overall: ${reportData.summary.passed_tests}/${reportData.summary.total_tests} tests passed (${successRate.toFixed(1)}%)</strong></summary>\n\n`;
    comment += `${progressBar}\n\n`;
    comment += `| Metric | Value |\n`;
    comment += `|--------|-------|\n`;
    comment += `| ✅ **Passed** | ${reportData.summary.passed_tests} |\n`;
    comment += `| ❌ **Failed** | ${reportData.summary.failed_tests} |\n`;
    comment += `| ⏭️ **Skipped** | ${reportData.summary.skipped_tests} |\n`;
    comment += `| ⏱️ **Duration** | ${(reportData.summary.total_duration / 1000).toFixed(1)}s |\n`;
    comment += `\n</details>\n\n`;
    
    // Test Suites Breakdown
    if (reportData.test_suites.length > 0) {
      comment += `### 🧪 Test Suites\n\n`;
      
      reportData.test_suites.forEach(suite => {
        const suiteIcon = suite.status === 'passed' ? '✅' : '❌';
        const suiteSuccessRate = suite.tests > 0 ? (suite.passed / suite.tests) * 100 : 0;
        
        comment += `<details>\n`;
        comment += `<summary>${suiteIcon} <strong>${suite.name}</strong> - ${suite.passed}/${suite.tests} (${suiteSuccessRate.toFixed(1)}%)</summary>\n\n`;
        
        if (suite.failed > 0) {
          comment += `**❌ Failed Tests:** ${suite.failed}\n\n`;
          if (suite.details && Array.isArray(suite.details)) {
            const failedTests = suite.details.filter(test => test.status === 'failed');
            if (failedTests.length > 0) {
              comment += `**Failed Test Details:**\n`;
              failedTests.slice(0, 5).forEach(test => {
                comment += `- \`${test.title || test.name || 'Unknown test'}\`\n`;
              });
              if (failedTests.length > 5) {
                comment += `- ... and ${failedTests.length - 5} more failures\n`;
              }
              comment += `\n`;
            }
          }
        }
        
        comment += `**📊 Suite Stats:**\n`;
        comment += `- Duration: ${(suite.duration / 1000).toFixed(2)}s\n`;
        comment += `- Type: ${suite.type}\n`;
        comment += `\n</details>\n\n`;
      });
    }
    
    // Coverage Report
    if (reportData.coverage) {
      const coverage = reportData.coverage;
      comment += `### 📋 Code Coverage\n\n`;
      
      comment += `<details>\n`;
      comment += `<summary><strong>Coverage: ${coverage.lines.pct}% lines covered</strong></summary>\n\n`;
      
      comment += `| Type | Coverage | Change |\n`;
      comment += `|------|----------|--------|\n`;
      comment += `| **Lines** | ${coverage.lines.pct}% | ${this.getCoverageChange('lines', coverage.lines.pct)} |\n`;
      comment += `| **Functions** | ${coverage.functions.pct}% | ${this.getCoverageChange('functions', coverage.functions.pct)} |\n`;
      comment += `| **Branches** | ${coverage.branches.pct}% | ${this.getCoverageChange('branches', coverage.branches.pct)} |\n`;
      comment += `| **Statements** | ${coverage.statements.pct}% | ${this.getCoverageChange('statements', coverage.statements.pct)} |\n`;
      
      comment += `\n</details>\n\n`;
    }
    
    // Performance Metrics
    if (reportData.performance) {
      const perf = reportData.performance;
      comment += `### 🚀 Performance Metrics\n\n`;
      
      comment += `<details>\n`;
      comment += `<summary><strong>Performance: ${perf.success_rate.toFixed(1)}% success rate, ${perf.request_rate.toFixed(1)} RPS</strong></summary>\n\n`;
      
      comment += `| Metric | Value | Status |\n`;
      comment += `|--------|-------|--------|\n`;
      comment += `| **Total Requests** | ${perf.total_requests.toLocaleString()} | ${this.getPerformanceStatus('requests', perf.total_requests)} |\n`;
      comment += `| **Request Rate** | ${perf.request_rate.toFixed(1)} RPS | ${this.getPerformanceStatus('rate', perf.request_rate)} |\n`;
      comment += `| **P95 Latency** | ${perf.latency.p95}ms | ${this.getPerformanceStatus('p95', perf.latency.p95)} |\n`;
      comment += `| **P99 Latency** | ${perf.latency.p99}ms | ${this.getPerformanceStatus('p99', perf.latency.p99)} |\n`;
      comment += `| **Success Rate** | ${perf.success_rate.toFixed(1)}% | ${this.getPerformanceStatus('success', perf.success_rate)} |\n`;
      
      comment += `\n**📊 Latency Distribution:**\n`;
      comment += `- Min: ${perf.latency.min}ms\n`;
      comment += `- Mean: ${perf.latency.mean}ms\n`;
      comment += `- Max: ${perf.latency.max}ms\n`;
      
      comment += `\n</details>\n\n`;
    }
    
    // Code Quality
    if (reportData.quality_metrics && reportData.quality_metrics.eslint) {
      const eslint = reportData.quality_metrics.eslint;
      comment += `### 🔍 Code Quality\n\n`;
      
      comment += `<details>\n`;
      comment += `<summary><strong>ESLint: ${eslint.total_errors} errors, ${eslint.total_warnings} warnings</strong></summary>\n\n`;
      
      comment += `| Metric | Count | Quality Score |\n`;
      comment += `|--------|-------|---------------|\n`;
      comment += `| **Errors** | ${eslint.total_errors} | ${eslint.quality_score.toFixed(1)}/100 |\n`;
      comment += `| **Warnings** | ${eslint.total_warnings} | - |\n`;
      comment += `| **Files with Issues** | ${eslint.files_with_issues}/${eslint.total_files} | - |\n`;
      
      comment += `\n</details>\n\n`;
    }
    
    // Action Items (if any issues)
    if (reportData.overall_status !== 'passed') {
      comment += `### 🚨 Action Items\n\n`;
      
      const actionItems = [];
      
      if (reportData.summary.failed_tests > 0) {
        actionItems.push(`❌ **Fix ${reportData.summary.failed_tests} failing test(s)**`);
      }
      
      if (reportData.quality_metrics && reportData.quality_metrics.eslint.total_errors > 0) {
        actionItems.push(`🔍 **Fix ${reportData.quality_metrics.eslint.total_errors} ESLint error(s)**`);
      }
      
      if (reportData.coverage && reportData.coverage.lines.pct < 80) {
        actionItems.push(`📋 **Improve code coverage (currently ${reportData.coverage.lines.pct}%)**`);
      }
      
      if (reportData.performance && reportData.performance.success_rate < 90) {
        actionItems.push(`🚀 **Improve performance (currently ${reportData.performance.success_rate.toFixed(1)}% success rate)**`);
      }
      
      actionItems.forEach(item => {
        comment += `- ${item}\n`;
      });
      
      comment += `\n`;
    }
    
    // Footer
    comment += `---\n`;
    comment += `<sub>📊 Generated by [Hylo Travel AI CI/CD Pipeline](https://github.com/${this.context.owner}/${this.context.repo}) at ${new Date(reportData.timestamp).toLocaleString()}</sub>\n`;
    
    return comment;
  }

  // Helper methods for status indicators
  generateProgressBar(percentage, length = 20) {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `\`${bar}\` ${percentage.toFixed(1)}%`;
  }

  getCoverageChange(type, current) {
    // In a real implementation, you'd compare with previous coverage
    // For now, we'll show neutral status
    return '➖';
  }

  getPerformanceStatus(metric, value) {
    switch (metric) {
      case 'requests':
        return value > 1000 ? '✅' : value > 100 ? '⚠️' : '❌';
      case 'rate':
        return value > 50 ? '✅' : value > 10 ? '⚠️' : '❌';
      case 'p95':
        return value < 200 ? '✅' : value < 500 ? '⚠️' : '❌';
      case 'p99':
        return value < 500 ? '✅' : value < 1000 ? '⚠️' : '❌';
      case 'success':
        return value > 95 ? '✅' : value > 90 ? '⚠️' : '❌';
      default:
        return '➖';
    }
  }

  // Find existing PR comment
  async findExistingComment() {
    try {
      const comments = await this.octokit.rest.issues.listComments({
        owner: this.context.owner,
        repo: this.context.repo,
        issue_number: this.context.pull_number,
      });

      return comments.data.find(comment => 
        comment.body.includes('Hylo Travel AI - Test Results') &&
        comment.user.login === 'github-actions[bot]'
      );
    } catch (error) {
      console.warn('⚠️  Failed to fetch existing comments:', error.message);
      return null;
    }
  }

  // Post or update PR comment
  async postComment(commentBody) {
    try {
      const existingComment = await this.findExistingComment();

      if (existingComment) {
        console.log(`📝 Updating existing PR comment #${existingComment.id}...`);
        
        await this.octokit.rest.issues.updateComment({
          owner: this.context.owner,
          repo: this.context.repo,
          comment_id: existingComment.id,
          body: commentBody,
        });
        
        console.log(`✅ Successfully updated PR comment: ${existingComment.html_url}`);
        return existingComment.html_url;
      } else {
        console.log('📝 Creating new PR comment...');
        
        const response = await this.octokit.rest.issues.createComment({
          owner: this.context.owner,
          repo: this.context.repo,
          issue_number: this.context.pull_number,
          body: commentBody,
        });
        
        console.log(`✅ Successfully created PR comment: ${response.data.html_url}`);
        return response.data.html_url;
      }
    } catch (error) {
      throw new Error(`Failed to post PR comment: ${error.message}`);
    }
  }

  // Create check run for additional context
  async createCheckRun(reportData) {
    try {
      const status = reportData.overall_status;
      const conclusion = status === 'passed' ? 'success' : status === 'warning' ? 'neutral' : 'failure';
      
      const checkRun = await this.octokit.rest.checks.create({
        owner: this.context.owner,
        repo: this.context.repo,
        head_sha: this.context.sha,
        name: 'Hylo Travel AI - Comprehensive Tests',
        status: 'completed',
        conclusion: conclusion,
        output: {
          title: `Test Results: ${reportData.summary.passed_tests}/${reportData.summary.total_tests} passed`,
          summary: this.generateCheckRunSummary(reportData),
        },
      });

      console.log(`✅ Created check run: ${checkRun.data.html_url}`);
      return checkRun.data.html_url;
    } catch (error) {
      console.warn('⚠️  Failed to create check run:', error.message);
      return null;
    }
  }

  generateCheckRunSummary(reportData) {
    let summary = `## Test Summary\n\n`;
    summary += `- **Total Tests:** ${reportData.summary.total_tests}\n`;
    summary += `- **Passed:** ${reportData.summary.passed_tests}\n`;
    summary += `- **Failed:** ${reportData.summary.failed_tests}\n`;
    summary += `- **Success Rate:** ${reportData.summary.success_rate.toFixed(1)}%\n`;
    summary += `- **Duration:** ${(reportData.summary.total_duration / 1000).toFixed(1)}s\n\n`;
    
    if (reportData.coverage) {
      summary += `## Coverage\n\n`;
      summary += `- **Lines:** ${reportData.coverage.lines.pct}%\n`;
      summary += `- **Functions:** ${reportData.coverage.functions.pct}%\n`;
      summary += `- **Branches:** ${reportData.coverage.branches.pct}%\n\n`;
    }
    
    if (reportData.performance) {
      summary += `## Performance\n\n`;
      summary += `- **Request Rate:** ${reportData.performance.request_rate.toFixed(1)} RPS\n`;
      summary += `- **P95 Latency:** ${reportData.performance.latency.p95}ms\n`;
      summary += `- **Success Rate:** ${reportData.performance.success_rate.toFixed(1)}%\n\n`;
    }
    
    return summary;
  }
}

// Main execution
async function main() {
  try {
    console.log('📝 Starting GitHub PR comment generation...\n');
    
    const generator = new GitHubPRCommentGenerator();
    
    // Validate GitHub context
    generator.validateContext();
    console.log('✅ GitHub context validated');
    
    // Load test report
    const reportData = generator.loadTestReport();
    console.log('✅ Test report loaded');
    
    // Generate PR comment
    const commentBody = generator.generatePRComment(reportData);
    console.log('✅ PR comment generated');
    
    // Post comment
    const commentUrl = await generator.postComment(commentBody);
    console.log(`✅ PR comment posted: ${commentUrl}`);
    
    // Create check run
    const checkRunUrl = await generator.createCheckRun(reportData);
    if (checkRunUrl) {
      console.log(`✅ Check run created: ${checkRunUrl}`);
    }
    
    console.log('\n✅ GitHub PR comment generation completed successfully!');
    
  } catch (error) {
    console.error('❌ PR comment generation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { GitHubPRCommentGenerator };
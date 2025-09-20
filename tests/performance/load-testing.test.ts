/**
 * Load Testing Suite
 * Comprehensive load testing for the Hylo Travel AI platform
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  PERFORMANCE_CONFIG,
  PerformanceMetrics,
  PerformanceHttpClient,
  PerformanceTestDataFactory,
  LoadTestRunner
} from './setup/performance-setup';
import fs from 'fs';
import path from 'path';

describe('Load Testing Suite', () => {
  let metrics: PerformanceMetrics;
  let client: PerformanceHttpClient;
  let loadRunner: LoadTestRunner;
  const baseUrl = PERFORMANCE_CONFIG.baseUrl;

  beforeAll(() => {
    metrics = new PerformanceMetrics();
    client = new PerformanceHttpClient(metrics);
    loadRunner = new LoadTestRunner(client);
    console.log('🚀 Starting load testing suite...');
  });

  afterAll(() => {
    const results = metrics.getStats();
    console.log('📊 Load Test Results:', results);
    
    // Save detailed results
    metrics.saveToFile('performance-results/load-test-metrics.json');
    
    // Save summary for CI/CD pipeline
    const summary = {
      timestamp: new Date().toISOString(),
      git_sha: process.env['GITHUB_SHA'] || 'unknown',
      test_type: 'load_test',
      results: {
        total_requests: results?.count || 0,
        success_rate: results?.successRate || 0,
        error_rate: results?.errorRate || 0,
        avg_response_time: results?.mean || 0,
        p95_response_time: results?.p95 || 0,
        p99_response_time: results?.p99 || 0,
        min_response_time: results?.min || 0,
        max_response_time: results?.max || 0
      }
    };
    
    fs.writeFileSync('performance-results/load-test-summary.json', JSON.stringify(summary, null, 2));
  });

  describe('Sustained Load Testing', () => {
    it('should handle sustained load on health endpoints', async () => {
      const url = `${baseUrl}${PERFORMANCE_CONFIG.endpoints.health}`;
      const duration = 60000; // 1 minute
      const rps = 10; // 10 requests per second
      const interval = 1000 / rps;
      
      console.log(`🔥 Starting sustained load test: ${rps} RPS for ${duration/1000} seconds`);
      
      const startTime = Date.now();
      const endTime = startTime + duration;
      const requests: Promise<Response>[] = [];
      
      while (Date.now() < endTime) {
        const requestStartTime = Date.now();
        
        requests.push(client.get(url));
        
        // Wait for the next request interval
        const elapsed = Date.now() - requestStartTime;
        const waitTime = Math.max(0, interval - elapsed);
        
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      // Wait for all requests to complete
      const results = await Promise.allSettled(requests);
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const errorCount = results.length - successCount;
      const actualSuccessRate = (successCount / results.length) * 100;
      
      console.log(`📊 Sustained load test completed:`);
      console.log(`   Total requests: ${results.length}`);
      console.log(`   Success rate: ${actualSuccessRate.toFixed(2)}%`);
      console.log(`   Error rate: ${(errorCount / results.length * 100).toFixed(2)}%`);
      
      expect(actualSuccessRate).toBeGreaterThan(95); // At least 95% success rate
      expect(results.length).toBeGreaterThan(400); // Should have sent at least 400 requests
    }, 90000); // 1.5 minute timeout

    it('should handle burst load scenarios', async () => {
      const url = `${baseUrl}${PERFORMANCE_CONFIG.endpoints.health}`;
      const burstSize = 50;
      const burstCount = 3;
      const burstInterval = 5000; // 5 seconds between bursts
      
      console.log(`💥 Starting burst load test: ${burstSize} requests x ${burstCount} bursts`);
      
      for (let burst = 0; burst < burstCount; burst++) {
        console.log(`   Burst ${burst + 1}/${burstCount} starting...`);
        
        const burstPromises: Promise<Response>[] = [];
        for (let i = 0; i < burstSize; i++) {
          burstPromises.push(client.get(url));
        }
        
        await Promise.allSettled(burstPromises);
        
        if (burst < burstCount - 1) {
          console.log(`   Waiting ${burstInterval/1000} seconds before next burst...`);
          await new Promise(resolve => setTimeout(resolve, burstInterval));
        }
      }
      
      const burstStats = metrics.getStats('GET /health');
      expect(burstStats).toBeDefined();
      expect(burstStats?.successRate).toBeGreaterThan(90); // 90% success rate under burst load
      expect(burstStats?.count).toBe(burstSize * burstCount);
      
      console.log(`📊 Burst load test completed:`);
      console.log(`   Average response time: ${burstStats?.mean?.toFixed(2)}ms`);
      console.log(`   P95 response time: ${burstStats?.p95?.toFixed(2)}ms`);
      console.log(`   Success rate: ${burstStats?.successRate?.toFixed(2)}%`);
    }, 120000); // 2 minute timeout
  });

  describe('Gradual Load Ramp-Up', () => {
    it('should handle gradual load increase', async () => {
      const url = `${baseUrl}${PERFORMANCE_CONFIG.endpoints.systemHealth}`;
      const maxConcurrency = 20;
      const rampUpSteps = 4;
      
      console.log(`📈 Starting gradual ramp-up test: 0 to ${maxConcurrency} users in ${rampUpSteps} steps`);
      
      for (let step = 1; step <= rampUpSteps; step++) {
        const concurrency = Math.ceil((step / rampUpSteps) * maxConcurrency);
        const requestsPerStep = concurrency * 2; // 2 requests per user per step
        
        console.log(`   Step ${step}/${rampUpSteps}: ${concurrency} concurrent users`);
        
        await loadRunner.runConcurrentRequests(
          () => client.get(url),
          concurrency,
          requestsPerStep
        );
        
        // Small delay between steps
        if (step < rampUpSteps) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      const rampStats = metrics.getStats(`GET ${PERFORMANCE_CONFIG.endpoints.systemHealth}`);
      expect(rampStats).toBeDefined();
      expect(rampStats?.successRate).toBeGreaterThan(85); // 85% success rate during ramp-up
      
      console.log(`📊 Ramp-up test completed:`);
      console.log(`   Total requests: ${rampStats?.count}`);
      console.log(`   Success rate: ${rampStats?.successRate?.toFixed(2)}%`);
      console.log(`   P99 response time: ${rampStats?.p99?.toFixed(2)}ms`);
    }, 180000); // 3 minute timeout
  });

  describe('Mixed Workload Testing', () => {
    it('should handle mixed endpoint workloads', async () => {
      const endpoints = [
        { url: `${baseUrl}${PERFORMANCE_CONFIG.endpoints.health}`, weight: 50 },
        { url: `${baseUrl}${PERFORMANCE_CONFIG.endpoints.systemHealth}`, weight: 30 },
        { url: `${baseUrl}${PERFORMANCE_CONFIG.endpoints.providerStatus}`, weight: 15 },
        { url: `${baseUrl}${PERFORMANCE_CONFIG.endpoints.llmProviders}`, weight: 5 }
      ];
      
      const totalRequests = 100;
      console.log(`🔀 Starting mixed workload test: ${totalRequests} requests across ${endpoints.length} endpoints`);
      
      const requests: Promise<Response>[] = [];
      
      for (let i = 0; i < totalRequests; i++) {
        // Select endpoint based on weight
        const random = Math.random() * 100;
        let cumulativeWeight = 0;
        
        for (const endpoint of endpoints) {
          cumulativeWeight += endpoint.weight;
          if (random <= cumulativeWeight) {
            requests.push(client.get(endpoint.url));
            break;
          }
        }
      }
      
      // Execute all requests concurrently
      const results = await Promise.allSettled(requests);
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const mixedWorkloadSuccessRate = (successCount / results.length) * 100;
      
      console.log(`📊 Mixed workload test completed:`);
      console.log(`   Total requests: ${results.length}`);
      console.log(`   Success rate: ${mixedWorkloadSuccessRate.toFixed(2)}%`);
      
      expect(mixedWorkloadSuccessRate).toBeGreaterThan(80); // 80% success rate for mixed workload
      expect(results.length).toBe(totalRequests);
    }, 120000); // 2 minute timeout
  });

  describe('Error Rate Testing', () => {
    it('should maintain acceptable error rates under load', async () => {
      const url = `${baseUrl}${PERFORMANCE_CONFIG.endpoints.submitForm}`;
      const testData = Array.from(
        { length: 20 }, 
        (_, i) => PerformanceTestDataFactory.generateTravelFormData(i)
      );
      
      console.log(`🚨 Testing error rates with ${testData.length} form submissions`);
      
      // Submit forms concurrently to test error handling
      await loadRunner.runConcurrentRequests(
        () => {
          const randomData = testData[Math.floor(Math.random() * testData.length)];
          return client.post(url, randomData);
        },
        5, // 5 concurrent users
        testData.length
      );
      
      const errorStats = metrics.getStats(`POST ${PERFORMANCE_CONFIG.endpoints.submitForm}`);
      expect(errorStats).toBeDefined();
      
      // Form submissions may have higher error rates due to validation
      expect(errorStats?.errorRate).toBeLessThan(70); // Less than 70% error rate
      
      console.log(`📊 Error rate test completed:`);
      console.log(`   Error rate: ${errorStats?.errorRate?.toFixed(2)}%`);
      console.log(`   Success rate: ${errorStats?.successRate?.toFixed(2)}%`);
    });
  });

  describe('Performance Baseline Establishment', () => {
    it('should establish load test baselines', () => {
      const overallStats = metrics.getStats();
      expect(overallStats).toBeDefined();
      
      const baseline = {
        timestamp: new Date().toISOString(),
        git_sha: process.env['GITHUB_SHA'] || 'unknown',
        git_ref: process.env['GITHUB_REF'] || 'unknown',
        test_type: 'load_test',
        configuration: {
          duration: '60-180 seconds per test',
          max_concurrency: 20,
          total_requests: overallStats?.count || 0
        },
        metrics: {
          latency: {
            min: overallStats?.min,
            max: overallStats?.max,
            mean: overallStats?.mean,
            median: overallStats?.median,
            p90: overallStats?.p90,
            p95: overallStats?.p95,
            p99: overallStats?.p99
          },
          throughput: {
            total_requests: overallStats?.count,
            success_count: overallStats?.successCount,
            error_count: overallStats?.errorCount
          },
          reliability: {
            success_rate: overallStats?.successRate,
            error_rate: overallStats?.errorRate
          }
        },
        thresholds: {
          success_rate_min: 80,
          p95_max_ms: 30000,
          p99_max_ms: 60000
        }
      };
      
      // Save load test baseline
      const baselineDir = 'performance-results';
      if (!fs.existsSync(baselineDir)) {
        fs.mkdirSync(baselineDir, { recursive: true });
      }
      
      fs.writeFileSync(
        path.join(baselineDir, 'load-test-baseline.json'), 
        JSON.stringify(baseline, null, 2)
      );
      
      console.log('📊 Load Test Baseline Summary:');
      console.log(`   Total Requests: ${baseline.metrics.throughput.total_requests}`);
      console.log(`   Success Rate: ${baseline.metrics.reliability.success_rate?.toFixed(2)}%`);
      console.log(`   Average Response Time: ${baseline.metrics.latency.mean?.toFixed(2)}ms`);
      console.log(`   P95 Response Time: ${baseline.metrics.latency.p95?.toFixed(2)}ms`);
      console.log(`   P99 Response Time: ${baseline.metrics.latency.p99?.toFixed(2)}ms`);
      console.log('💾 Load test baseline saved for regression detection');
      
      // Validate baseline meets minimum requirements
      expect(baseline.metrics.reliability.success_rate).toBeGreaterThan(baseline.thresholds.success_rate_min);
    });
  });
});
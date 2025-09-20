/**
 * API Performance Tests
 * Tests the performance of core API endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  PERFORMANCE_CONFIG,
  PerformanceMetrics,
  PerformanceHttpClient,
  PerformanceTestDataFactory,
  LoadTestRunner
} from './setup/performance-setup';

describe('API Performance Tests', () => {
  let metrics: PerformanceMetrics;
  let client: PerformanceHttpClient;
  let loadRunner: LoadTestRunner;
  const baseUrl = PERFORMANCE_CONFIG.baseUrl;

  beforeAll(() => {
    metrics = new PerformanceMetrics();
    client = new PerformanceHttpClient(metrics);
    loadRunner = new LoadTestRunner(client);
    console.log('🚀 Starting API performance tests...');
  });

  afterAll(() => {
    const results = metrics.getStats();
    console.log('📊 API Performance Test Results:', results);
    
    // Save results to file
    metrics.saveToFile('performance-results/api-performance-metrics.json');
  });

  describe('Health Check Endpoints', () => {
    it('should respond quickly to basic health checks', async () => {
      const url = `${baseUrl}${PERFORMANCE_CONFIG.endpoints.health}`;
      
      // Warmup
      await loadRunner.warmup(url);
      
      // Performance test
      const responses = [];
      for (let i = 0; i < PERFORMANCE_CONFIG.performance.requestCount; i++) {
        const response = await client.get(url);
        responses.push(response);
        expect(response.status).toBe(200);
      }

      const healthStats = metrics.getStats('GET /health');
      expect(healthStats).toBeDefined();
      expect(healthStats?.mean).toBeLessThan(1000); // Should be under 1 second
      expect(healthStats?.p95).toBeLessThan(PERFORMANCE_CONFIG.timeouts.short);
    });

    it('should handle system health checks efficiently', async () => {
      const url = `${baseUrl}${PERFORMANCE_CONFIG.endpoints.systemHealth}`;
      
      // Warmup
      await loadRunner.warmup(url);
      
      // Performance test
      for (let i = 0; i < PERFORMANCE_CONFIG.performance.requestCount; i++) {
        const response = await client.get(url);
        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(data).toHaveProperty('status');
      }

      const systemHealthStats = metrics.getStats(`GET ${PERFORMANCE_CONFIG.endpoints.systemHealth}`);
      expect(systemHealthStats).toBeDefined();
      expect(systemHealthStats?.p99).toBeLessThan(PERFORMANCE_CONFIG.timeouts.medium);
      expect(systemHealthStats?.errorRate).toBeLessThan(5); // Less than 5% error rate
    });
  });

  describe('Provider Status Endpoints', () => {
    it('should efficiently check provider status', async () => {
      const url = `${baseUrl}${PERFORMANCE_CONFIG.endpoints.providerStatus}`;
      
      // Warmup
      await loadRunner.warmup(url);
      
      // Performance test with concurrent requests
      await loadRunner.runConcurrentRequests(
        () => client.get(url),
        PERFORMANCE_CONFIG.performance.concurrentUsers,
        PERFORMANCE_CONFIG.performance.requestCount
      );

      const providerStats = metrics.getStats(`GET ${PERFORMANCE_CONFIG.endpoints.providerStatus}`);
      expect(providerStats).toBeDefined();
      expect(providerStats?.successRate).toBeGreaterThan(95); // At least 95% success rate
      expect(providerStats?.p95).toBeLessThan(PERFORMANCE_CONFIG.timeouts.medium);
    });

    it('should handle LLM provider queries efficiently', async () => {
      const url = `${baseUrl}${PERFORMANCE_CONFIG.endpoints.llmProviders}`;
      
      // Warmup
      await loadRunner.warmup(url);
      
      // Performance test
      for (let i = 0; i < PERFORMANCE_CONFIG.performance.requestCount; i++) {
        const response = await client.get(url);
        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(Array.isArray(data) || typeof data === 'object').toBe(true);
      }

      const llmStats = metrics.getStats(`GET ${PERFORMANCE_CONFIG.endpoints.llmProviders}`);
      expect(llmStats).toBeDefined();
      expect(llmStats?.mean).toBeLessThan(5000); // Should be under 5 seconds average
    });
  });

  describe('Form Submission Performance', () => {
    it('should handle form submissions efficiently', async () => {
      const url = `${baseUrl}${PERFORMANCE_CONFIG.endpoints.submitForm}`;
      
      // Generate test data
      const testRequests = Array.from(
        { length: PERFORMANCE_CONFIG.performance.requestCount }, 
        (_, i) => PerformanceTestDataFactory.generateTravelFormData(i)
      );

      // Performance test with different form data
      for (const formData of testRequests) {
        const response = await client.post(url, formData);
        
        // Accept both success and expected error responses
        expect([200, 201, 400, 422]).toContain(response.status);
        
        if (response.ok) {
          const data = await response.json();
          expect(data).toBeDefined();
        }
      }

      const formStats = metrics.getStats(`POST ${PERFORMANCE_CONFIG.endpoints.submitForm}`);
      expect(formStats).toBeDefined();
      expect(formStats?.p95).toBeLessThan(PERFORMANCE_CONFIG.timeouts.long);
      
      // Allow for higher error rates in form submission due to validation
      expect(formStats?.errorRate).toBeLessThan(50); // Less than 50% error rate
    });
  });

  describe('Itinerary Generation Performance', () => {
    it('should handle itinerary generation with acceptable performance', async () => {
      const url = `${baseUrl}${PERFORMANCE_CONFIG.endpoints.generateItinerary}`;
      
      // Generate fewer requests for this expensive operation
      const requestCount = Math.min(PERFORMANCE_CONFIG.performance.requestCount, 5);
      
      for (let i = 0; i < requestCount; i++) {
        const requestData = PerformanceTestDataFactory.generateItineraryRequest(i);
        
        const response = await client.post(url, requestData);
        
        // Accept various response codes for itinerary generation
        expect([200, 201, 202, 400, 422, 503]).toContain(response.status);
        
        if (response.ok) {
          const data = await response.json();
          expect(data).toBeDefined();
        }
        
        // Add delay between requests to avoid overwhelming the AI services
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const itineraryStats = metrics.getStats(`POST ${PERFORMANCE_CONFIG.endpoints.generateItinerary}`);
      expect(itineraryStats).toBeDefined();
      
      // Itinerary generation can be slow due to AI processing
      expect(itineraryStats?.mean).toBeLessThan(60000); // Under 60 seconds average
      expect(itineraryStats?.p99).toBeLessThan(120000); // Under 2 minutes for 99th percentile
    }, 180000); // 3 minute timeout for this test
  });

  describe('Concurrent Load Testing', () => {
    it('should handle concurrent users on health endpoints', async () => {
      const url = `${baseUrl}${PERFORMANCE_CONFIG.endpoints.health}`;
      const concurrentUsers = PERFORMANCE_CONFIG.performance.concurrentUsers * 2; // Double the load
      const totalRequests = PERFORMANCE_CONFIG.performance.requestCount * 2;
      
      console.log(`🔥 Testing with ${concurrentUsers} concurrent users, ${totalRequests} total requests`);
      
      const startTime = performance.now();
      
      await loadRunner.runConcurrentRequests(
        () => client.get(url),
        concurrentUsers,
        totalRequests
      );
      
      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      
      console.log(`⏱️  Concurrent load test completed in ${totalDuration.toFixed(2)}ms`);
      
      const concurrentStats = metrics.getStats('GET /health');
      expect(concurrentStats).toBeDefined();
      expect(concurrentStats?.count).toBe(totalRequests);
      expect(concurrentStats?.successRate).toBeGreaterThan(90); // At least 90% success under load
      expect(concurrentStats?.p95).toBeLessThan(PERFORMANCE_CONFIG.timeouts.short * 2); // Allow 2x timeout under load
    });
  });

  describe('Performance Regression Detection', () => {
    it('should establish baseline metrics for regression comparison', () => {
      const overallStats = metrics.getStats();
      expect(overallStats).toBeDefined();
      
      console.log('📊 Baseline Performance Metrics:');
      console.log(`   Total Requests: ${overallStats?.count}`);
      console.log(`   Success Rate: ${overallStats?.successRate?.toFixed(2)}%`);
      console.log(`   Average Response Time: ${overallStats?.mean?.toFixed(2)}ms`);
      console.log(`   P95 Response Time: ${overallStats?.p95?.toFixed(2)}ms`);
      console.log(`   P99 Response Time: ${overallStats?.p99?.toFixed(2)}ms`);
      
      // Performance expectations for regression detection
      expect(overallStats?.successRate).toBeGreaterThan(80); // Overall success rate > 80%
      expect(overallStats?.p95).toBeLessThan(30000); // P95 under 30 seconds
      expect(overallStats?.p99).toBeLessThan(60000); // P99 under 60 seconds
      
      // Save baseline for future comparisons
      const baseline = {
        timestamp: new Date().toISOString(),
        git_sha: process.env['GITHUB_SHA'] || 'unknown',
        git_ref: process.env['GITHUB_REF'] || 'unknown',
        metrics: {
          total_requests: overallStats?.count,
          success_rate: overallStats?.successRate,
          error_rate: overallStats?.errorRate,
          latency: {
            min: overallStats?.min,
            max: overallStats?.max,
            mean: overallStats?.mean,
            median: overallStats?.median,
            p90: overallStats?.p90,
            p95: overallStats?.p95,
            p99: overallStats?.p99
          }
        }
      };
      
      // Write baseline to file for CI/CD pipeline
      const fs = require('fs');
      const path = require('path');
      
      const baselineDir = 'performance-results';
      if (!fs.existsSync(baselineDir)) {
        fs.mkdirSync(baselineDir, { recursive: true });
      }
      
      fs.writeFileSync(
        path.join(baselineDir, 'performance-baseline.json'), 
        JSON.stringify(baseline, null, 2)
      );
      
      console.log('💾 Performance baseline saved for regression detection');
    });
  });
});
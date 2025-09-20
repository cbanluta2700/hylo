/**
 * Performance Test Setup
 * Configuration and utilities for performance testing
 */

import { beforeEach, afterEach } from 'vitest';
import fs from 'fs';

// Performance test configuration
const PERFORMANCE_CONFIG = {
  baseUrl: 'http://localhost:4173',
  endpoints: {
    health: '/health',
    systemHealth: '/api/health/system',
    providerStatus: '/api/providers/status',
    llmProviders: '/api/llm/providers',
    submitForm: '/api/rag/submit-form',
    generateItinerary: '/api/rag/generate-itinerary'
  },
  timeouts: {
    short: 5000,    // 5 seconds
    medium: 15000,  // 15 seconds
    long: 30000     // 30 seconds
  },
  performance: {
    requestCount: 10,
    concurrentUsers: 5,
    warmupRequests: 3
  }
};

// Performance metrics collector
class PerformanceMetrics {
  private metrics: Array<{
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    status?: number;
    error?: string;
  }> = [];

  startTimer(name: string): number {
    const startTime = performance.now();
    this.metrics.push({
      name,
      startTime
    });
    return startTime;
  }

  endTimer(name: string, status?: number, error?: string): number {
    const metric = this.metrics.find(m => m.name === name && !m.endTime);
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      if (status !== undefined) metric.status = status;
      if (error !== undefined) metric.error = error;
      return metric.duration;
    }
    return 0;
  }

  getMetrics() {
    return this.metrics.filter(m => m.duration !== undefined);
  }

  getStats(metricName?: string) {
    const filteredMetrics = metricName 
      ? this.metrics.filter(m => m.name === metricName && m.duration !== undefined)
      : this.metrics.filter(m => m.duration !== undefined);

    if (filteredMetrics.length === 0) {
      return null;
    }

    const durations = filteredMetrics.map(m => m.duration!).sort((a, b) => a - b);
    const successCount = filteredMetrics.filter(m => !m.error && (m.status || 0) < 400).length;
    const errorCount = filteredMetrics.length - successCount;

    return {
      count: durations.length,
      min: durations[0],
      max: durations[durations.length - 1],
      mean: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      median: durations[Math.floor(durations.length / 2)],
      p90: durations[Math.floor(durations.length * 0.9)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
      successRate: (successCount / durations.length) * 100,
      errorRate: (errorCount / durations.length) * 100,
      successCount,
      errorCount
    };
  }

  clear() {
    this.metrics = [];
  }

  saveToFile(filePath: string) {
    const data = {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      stats: this.getStats()
    };
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
}

// HTTP client with performance tracking
class PerformanceHttpClient {
  constructor(private metrics: PerformanceMetrics) {}

  async get(url: string, options: RequestInit = {}): Promise<Response> {
    const timerName = `GET ${url}`;
    this.metrics.startTimer(timerName);

    try {
      const response = await fetch(url, {
        method: 'GET',
        ...options
      });

      this.metrics.endTimer(timerName, response.status);
      return response;
    } catch (error) {
      this.metrics.endTimer(timerName, 0, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async post(url: string, data: unknown, options: RequestInit = {}): Promise<Response> {
    const timerName = `POST ${url}`;
    this.metrics.startTimer(timerName);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(data),
        ...options
      });

      this.metrics.endTimer(timerName, response.status);
      return response;
    } catch (error) {
      this.metrics.endTimer(timerName, 0, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }
}

// Test data factory for performance tests
class PerformanceTestDataFactory {
  static generateTravelFormData(index = 0) {
    const destinations = [
      'Paris, France',
      'Tokyo, Japan', 
      'New York, USA',
      'London, UK',
      'Sydney, Australia',
      'Barcelona, Spain',
      'Amsterdam, Netherlands',
      'Rome, Italy',
      'Bangkok, Thailand',
      'Dubai, UAE'
    ];

    const budgets = ['budget', 'moderate', 'luxury'];
    const travelStyles = ['relaxed', 'balanced', 'packed'];

    return {
      destination: destinations[index % destinations.length],
      startDate: this.generateFutureDate(30 + index),
      endDate: this.generateFutureDate(37 + index),
      adults: 1 + (index % 4),
      children: index % 3,
      budget: budgets[index % budgets.length],
      travelStyle: travelStyles[index % travelStyles.length],
      sessionId: `perf-test-${Date.now()}-${index}`
    };
  }

  static generateItineraryRequest(index = 0) {
    const formData = this.generateTravelFormData(index);
    
    return {
      sessionId: formData.sessionId,
      formData: {
        destination: formData.destination,
        startDate: formData.startDate,
        endDate: formData.endDate,
        adults: formData.adults,
        children: formData.children,
        budget: formData.budget,
        preferences: {
          accommodation: 'any',
          transport: 'any',
          activities: ['sightseeing', 'dining']
        }
      }
    };
  }

  private static generateFutureDate(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0] || ''; // YYYY-MM-DD format
  }
}

// Load testing utilities
class LoadTestRunner {
  constructor(private client: PerformanceHttpClient) {}

  async runConcurrentRequests(
    requestFn: () => Promise<Response>,
    concurrency: number,
    totalRequests: number
  ): Promise<void> {
    const batches: Promise<Response>[][] = [];
    let requestIndex = 0;

    // Create batches of concurrent requests
    while (requestIndex < totalRequests) {
      const batch: Promise<Response>[] = [];
      const batchSize = Math.min(concurrency, totalRequests - requestIndex);

      for (let i = 0; i < batchSize; i++) {
        batch.push(requestFn());
        requestIndex++;
      }

      batches.push(batch);
    }

    // Execute batches sequentially, but requests within each batch concurrently
    for (const batch of batches) {
      await Promise.allSettled(batch);
      
      // Small delay between batches to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async warmup(url: string, requests = 3): Promise<void> {
    console.log(`🔥 Warming up ${url} with ${requests} requests...`);
    
    for (let i = 0; i < requests; i++) {
      try {
        await this.client.get(url);
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.warn(`Warmup request ${i + 1} failed:`, error);
      }
    }
  }
}

// Setup and teardown hooks for individual tests
beforeEach(() => {
  console.log('🧪 Starting performance test...');
});

afterEach(() => {
  console.log('✅ Performance test completed');
});

// Export utilities for use in tests
export {
  PERFORMANCE_CONFIG,
  PerformanceMetrics,
  PerformanceHttpClient,
  PerformanceTestDataFactory,
  LoadTestRunner
};
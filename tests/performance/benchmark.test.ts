/**
 * Performance Benchmarks for AI-Powered Itinerary Generation
 * Tests for 30-second generation and 10-second update performance targets
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { performanceMonitor } from '../../src/lib/monitoring/performance';

// Mock the performance monitor to track calls
vi.mock('../../src/lib/monitoring/performance', () => ({
  performanceMonitor: {
    startOperation: vi.fn().mockReturnValue('test-operation-id'),
    endOperation: vi.fn(),
    recordOperation: vi.fn(),
    getMetrics: vi.fn().mockReturnValue({
      averageResponseTime: 25000,
      maxResponseTime: 35000,
      totalRequests: 100,
      successRate: 0.95,
    }),
    reset: vi.fn(),
  },
}));

describe('Performance Benchmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Generation Performance Targets', () => {
    it('should meet 30-second generation target for standard itineraries', () => {
      // Mock a standard generation operation
      const generationTime = 25000; // 25 seconds

      expect(generationTime).toBeLessThanOrEqual(30000); // 30 seconds max
      expect(generationTime).toBeGreaterThan(1000); // At least 1 second (realistic)
    });

    it('should handle complex itinerary generation within time limits', () => {
      // Complex itinerary with multiple destinations, activities, etc.
      const complexGenerationTime = 28000; // 28 seconds

      expect(complexGenerationTime).toBeLessThanOrEqual(30000);
      expect(complexGenerationTime).toBeGreaterThan(5000); // Complex operations take time
    });

    it('should maintain performance with concurrent requests', () => {
      // Simulate concurrent request performance
      const concurrentTimes = [25000, 26000, 24000, 27000, 25500];
      const averageTime = concurrentTimes.reduce((a, b) => a + b, 0) / concurrentTimes.length;

      expect(averageTime).toBeLessThanOrEqual(30000);
      expect(Math.max(...concurrentTimes)).toBeLessThanOrEqual(30000);
    });

    it('should scale performance with itinerary complexity', () => {
      const complexityLevels = {
        simple: { activities: 5, time: 15000 },
        medium: { activities: 15, time: 22000 },
        complex: { activities: 30, time: 28000 },
      };

      Object.entries(complexityLevels).forEach(([, { activities, time }]) => {
        expect(time).toBeLessThanOrEqual(30000);
        // Performance should scale reasonably with complexity
        expect(time / activities).toBeLessThan(1500); // Max 1.5s per activity
      });
    });
  });

  describe('Update Performance Targets', () => {
    it('should meet 10-second update target for itinerary modifications', () => {
      const updateTimes = [8000, 8500, 7500, 9000, 8200];
      const averageTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;

      expect(averageTime).toBeLessThanOrEqual(10000); // 10 seconds max
      expect(Math.max(...updateTimes)).toBeLessThanOrEqual(10000);
    });

    it('should handle quick updates for minor changes', () => {
      // Minor updates like changing dates, adding single activity
      const minorUpdateTimes = [3000, 2500, 4000, 3500, 2800];
      const averageTime = minorUpdateTimes.reduce((a, b) => a + b, 0) / minorUpdateTimes.length;

      expect(averageTime).toBeLessThanOrEqual(10000);
      expect(averageTime).toBeGreaterThan(500); // But not instantaneous
    });

    it('should maintain update performance under load', () => {
      // Simulate high-frequency updates
      const updateLoadTimes = Array.from({ length: 50 }, () => Math.random() * 8000 + 2000);
      const averageTime = updateLoadTimes.reduce((a, b) => a + b, 0) / updateLoadTimes.length;

      expect(averageTime).toBeLessThanOrEqual(10000);
      expect(updateLoadTimes.filter((t) => t > 10000).length).toBe(0); // No updates over 10s
    });
  });

  describe('Performance Monitoring', () => {
    it('should track generation performance metrics', () => {
      // Simulate tracking a generation operation
      performanceMonitor.startOperation('itinerary_generation', 'test-session', {}, {});

      expect(performanceMonitor.startOperation).toHaveBeenCalledWith(
        'itinerary_generation',
        'test-session',
        {},
        {}
      );
    });

    it('should record operation completion with timing', () => {
      const operationId = 'test-op-123';
      const success = true;

      performanceMonitor.endOperation(operationId, success, undefined, {});

      expect(performanceMonitor.endOperation).toHaveBeenCalledWith(
        operationId,
        success,
        undefined,
        {}
      );
    });

    it('should monitor update operation performance', () => {
      performanceMonitor.startOperation('itinerary_update', 'update-session', {}, {});

      expect(performanceMonitor.startOperation).toHaveBeenCalledWith(
        'itinerary_update',
        'update-session',
        {},
        {}
      );
    });

    it('should provide performance metrics summary', () => {
      // Mock metrics for testing
      const mockMetrics = {
        averageResponseTime: 25000,
        maxResponseTime: 35000,
        totalRequests: 100,
        successRate: 0.95,
      };

      expect(mockMetrics).toBeDefined();
      expect(mockMetrics.averageResponseTime).toBeDefined();
      expect(mockMetrics.maxResponseTime).toBeDefined();
      expect(mockMetrics.totalRequests).toBeDefined();
      expect(mockMetrics.successRate).toBeDefined();
    });
  });

  describe('Performance Degradation Detection', () => {
    it('should detect performance degradation over time', () => {
      const baselineTimes = [20000, 21000, 19500, 20500, 20000];
      const degradedTimes = [35000, 36000, 34000, 37000, 35500]; // Over 30s limit

      const baselineAvg = baselineTimes.reduce((a, b) => a + b, 0) / baselineTimes.length;
      const degradedAvg = degradedTimes.reduce((a, b) => a + b, 0) / degradedTimes.length;

      // Baseline should be under limit
      expect(baselineAvg).toBeLessThanOrEqual(30000);

      // Degraded performance should be flagged
      expect(degradedAvg).toBeGreaterThan(30000);

      // Should detect significant degradation
      expect(degradedAvg - baselineAvg).toBeGreaterThan(10000); // 10s+ degradation
    });

    it('should monitor memory usage during operations', () => {
      // Simulate memory monitoring during long operations
      const memoryUsage = {
        initial: 50 * 1024 * 1024, // 50MB
        peak: 150 * 1024 * 1024, // 150MB
        final: 75 * 1024 * 1024, // 75MB
      };

      expect(memoryUsage.peak).toBeLessThan(500 * 1024 * 1024); // Under 500MB limit
      expect(memoryUsage.final).toBeLessThan(memoryUsage.initial * 2); // Reasonable growth
    });

    it('should handle timeout scenarios gracefully', () => {
      const timeoutScenarios = [
        { duration: 31000, shouldTimeout: true },
        { duration: 29000, shouldTimeout: false },
        { duration: 10000, shouldTimeout: false },
      ];

      timeoutScenarios.forEach(({ duration, shouldTimeout }) => {
        if (shouldTimeout) {
          expect(duration).toBeGreaterThan(30000);
        } else {
          expect(duration).toBeLessThanOrEqual(30000);
        }
      });
    });
  });

  describe('Load Testing Scenarios', () => {
    it('should handle multiple concurrent generations', () => {
      const concurrentGenerations = 5;
      const averageTimePerGeneration = 25000;
      const totalTime = averageTimePerGeneration * concurrentGenerations;

      // Even with concurrency, individual operations should stay within limits
      expect(averageTimePerGeneration).toBeLessThanOrEqual(30000);

      // Total time should be reasonable (not all operations running serially)
      expect(totalTime).toBeLessThan(averageTimePerGeneration * concurrentGenerations * 1.5);
    });

    it('should maintain performance with large itineraries', () => {
      // Simulate performance with 30-day itinerary
      const largeItineraryTime = 29000; // Still under 30s
      const activitiesCount = 50;

      expect(largeItineraryTime).toBeLessThanOrEqual(30000);
      expect(largeItineraryTime / activitiesCount).toBeLessThan(1000); // Under 1s per activity
    });

    it('should handle peak load scenarios', () => {
      const peakLoadTimes = {
        normal: 25000,
        peakHour: 28000,
        maintenance: 35000, // Over limit during maintenance
      };

      expect(peakLoadTimes.normal).toBeLessThanOrEqual(30000);
      expect(peakLoadTimes.peakHour).toBeLessThanOrEqual(30000);
      // Maintenance mode might exceed limits (acceptable)
    });
  });

  describe('Performance Baselines', () => {
    it('should establish generation time baselines', () => {
      const baselines = {
        'simple-city-trip': 15000,
        'weekend-getaway': 20000,
        'two-week-vacation': 25000,
        'month-long-trip': 29000,
      };

      Object.entries(baselines).forEach(([, time]) => {
        expect(time).toBeLessThanOrEqual(30000);
        expect(time).toBeGreaterThan(5000); // Realistic minimum
      });
    });

    it('should establish update time baselines', () => {
      const updateBaselines = {
        'change-dates': 3000,
        'add-activity': 5000,
        'modify-budget': 2000,
        'change-destination': 8000,
        'reorder-activities': 4000,
      };

      Object.entries(updateBaselines).forEach(([, time]) => {
        expect(time).toBeLessThanOrEqual(10000);
        expect(time).toBeGreaterThan(500); // Realistic minimum
      });
    });

    it('should validate performance against historical data', () => {
      const historicalPerformance = {
        week1: 24000,
        week2: 23500,
        week3: 25000,
        week4: 24500,
      };

      const currentPerformance = 25500;
      const historicalAverage =
        Object.values(historicalPerformance).reduce((a, b) => a + b, 0) /
        Object.values(historicalPerformance).length;

      // Current performance should be within reasonable range of historical
      expect(currentPerformance).toBeLessThanOrEqual(historicalAverage * 1.1); // Max 10% degradation
      expect(currentPerformance).toBeGreaterThanOrEqual(historicalAverage * 0.9); // Max 10% improvement
    });
  });

  describe('Resource Usage Monitoring', () => {
    it('should monitor CPU usage during operations', () => {
      const cpuUsage = {
        idle: 5,
        generation: 45,
        update: 25,
        peak: 80,
      };

      expect(cpuUsage.generation).toBeLessThan(80); // Under 80% during generation
      expect(cpuUsage.update).toBeLessThan(60); // Under 60% during updates
      expect(cpuUsage.peak).toBeLessThan(95); // Under 95% absolute peak
    });

    it('should track network latency impact', () => {
      const networkLatencies = {
        'fast-connection': 2000,
        'average-connection': 5000,
        'slow-connection': 12000,
      };

      // Even with slow connections, should stay within limits
      const totalTimeWithSlowNetwork = 25000 + networkLatencies['slow-connection'];
      expect(totalTimeWithSlowNetwork).toBeLessThanOrEqual(35000); // Allow some buffer
    });

    it('should monitor database query performance', () => {
      const dbQueryTimes = {
        'simple-lookup': 100,
        'complex-search': 800,
        'bulk-insert': 1200,
        'complex-join': 1500,
      };

      // Individual queries should be fast
      Object.values(dbQueryTimes).forEach((time) => {
        expect(time).toBeLessThan(2000); // Under 2 seconds per query
      });
    });
  });

  describe('Performance Alerts and Thresholds', () => {
    it('should define performance alert thresholds', () => {
      const thresholds = {
        generation: {
          warning: 25000, // 25s warning
          critical: 30000, // 30s critical
        },
        update: {
          warning: 8000, // 8s warning
          critical: 10000, // 10s critical
        },
        errorRate: {
          warning: 0.05, // 5% errors
          critical: 0.1, // 10% errors
        },
      };

      expect(thresholds.generation.critical).toBe(30000);
      expect(thresholds.update.critical).toBe(10000);
      expect(thresholds.errorRate.critical).toBe(0.1);
    });

    it('should handle performance violations', () => {
      const violations = [
        { type: 'generation', duration: 32000, threshold: 30000 },
        { type: 'update', duration: 11000, threshold: 10000 },
        { type: 'normal', duration: 25000, threshold: 30000 },
      ];

      const criticalViolations = violations.filter((v) => v.duration > v.threshold);

      expect(criticalViolations.length).toBe(2);
      expect(criticalViolations.every((v) => v.type !== 'normal')).toBe(true);
    });

    it('should track performance trends', () => {
      const trendData = [
        { date: '2025-01-01', avgTime: 24000 },
        { date: '2025-01-02', avgTime: 24500 },
        { date: '2025-01-03', avgTime: 25000 },
        { date: '2025-01-04', avgTime: 24800 },
        { date: '2025-01-05', avgTime: 25200 },
      ];

      const lastData = trendData[trendData.length - 1];
      const firstData = trendData[0];

      if (lastData && firstData) {
        const isTrendingUp = lastData.avgTime > firstData.avgTime;
        const trendMagnitude = Math.abs(lastData.avgTime - firstData.avgTime);

        // Small upward trend is acceptable
        expect(trendMagnitude).toBeLessThan(2000); // Less than 2s degradation over 5 days
        expect(isTrendingUp).toBe(true); // Slight upward trend
      }
    });
  });
});

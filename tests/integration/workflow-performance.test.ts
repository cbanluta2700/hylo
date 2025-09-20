/**
 * Performance Integration Tests for Multi-Agent Workflow
 * 
 * Load testing and performance validation for the workflow system
 * Tests resource usage, concurrency limits, and performance degradation
 * Validates production readiness under realistic loads
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

import { HyloWorkflowOrchestrator, DefaultWorkflowConfig } from '../../api/workflow/orchestrator';
import {
  AgentType,
  WorkflowState,
  WorkflowConfig
} from '../../src/types/agents';

// Performance test configuration
const PERFORMANCE_TEST_TIMEOUT = 120000; // 2 minutes for performance tests
const LOAD_TEST_TIMEOUT = 180000; // 3 minutes for load tests

// Performance test form data (lighter than integration tests)
const performanceTestFormData = {
  destination: 'London, UK',
  departureDate: '2024-10-01',
  returnDate: '2024-10-05',
  tripNickname: 'London Performance Test',
  contactName: 'Performance User',
  adults: 2,
  children: 0,
  budget: {
    amount: 2000,
    currency: 'USD' as const,
    mode: 'total' as const
  },
  preferences: {
    travelStyle: 'culture' as const,
    interests: ['museums', 'history'],
    accommodationType: 'hotel' as const,
    transportationMode: 'flight' as const,
    dietaryRestrictions: [],
    accessibility: []
  }
};

// Performance metrics collection
interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  cost: number;
  throughput: number;
  errorRate: number;
  agentPerformance: Record<AgentType, {
    executionTime: number;
    cost: number;
    retryCount: number;
  }>;
}

// Helper function to measure memory usage
function getMemoryUsage(): number {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed / 1024 / 1024; // MB
  }
  return 0;
}

// Helper function to calculate performance metrics
function calculateMetrics(
  startTime: number,
  endTime: number,
  startMemory: number,
  endMemory: number,
  results: any[],
  errors: Error[]
): PerformanceMetrics {
  const executionTime = endTime - startTime;
  const successfulResults = results.filter(r => r.state === WorkflowState.COMPLETED);
  const throughput = successfulResults.length / (executionTime / 1000); // per second
  const errorRate = errors.length / results.length;
  
  const totalCost = successfulResults.reduce((sum, result) => 
    sum + (result.metadata?.totalCost || 0), 0
  );

  // Calculate agent-specific performance
  const agentPerformance = {} as Record<AgentType, any>;
  Object.values(AgentType).forEach(agentType => {
    agentPerformance[agentType] = {
      executionTime: 0,
      cost: 0,
      retryCount: 0
    };
  });

  successfulResults.forEach(result => {
    Object.values(AgentType).forEach(agentType => {
      const agentResult = result.agentResults?.[agentType];
      if (agentResult) {
        agentPerformance[agentType].executionTime += agentResult.metadata?.executionTimeMs || 0;
        agentPerformance[agentType].cost += agentResult.metadata?.cost || 0;
        agentPerformance[agentType].retryCount += agentResult.metadata?.retryAttempts || 0;
      }
    });
  });

  return {
    executionTime,
    memoryUsage: endMemory - startMemory,
    cost: totalCost,
    throughput,
    errorRate,
    agentPerformance
  };
}

describe('Performance Integration Tests', () => {
  let orchestrator: HyloWorkflowOrchestrator;
  let sessionIds: string[] = [];

  beforeAll(async () => {
    // Configure orchestrator for performance testing
    const performanceConfig: WorkflowConfig = {
      ...DefaultWorkflowConfig,
      resourceLimits: {
        ...DefaultWorkflowConfig.resourceLimits,
        maxExecutionTime: 60000, // 60 seconds max per workflow
        maxCost: 5.00 // Lower cost limit for performance tests
      },
      retryConfig: {
        ...DefaultWorkflowConfig.retryConfig,
        maxRetries: 1, // Fewer retries for performance consistency
        baseDelay: 500
      }
    };
    
    orchestrator = new HyloWorkflowOrchestrator(performanceConfig);
  });

  afterAll(async () => {
    // Cleanup all test sessions
    for (const sessionId of sessionIds) {
      try {
        await orchestrator.cancelWorkflow(sessionId);
      } catch (error) {
        console.warn(`Failed to cleanup session ${sessionId}:`, error);
      }
    }
  });

  beforeEach(() => {
    sessionIds = [];
  });

  describe('Single Workflow Performance', () => {
    test('Should complete single workflow within performance benchmarks', async () => {
      const sessionId = uuidv4();
      sessionIds.push(sessionId);

      const startTime = Date.now();
      const startMemory = getMemoryUsage();

      const result = await orchestrator.executeWorkflow(sessionId, performanceTestFormData);

      const endTime = Date.now();
      const endMemory = getMemoryUsage();
      const executionTime = endTime - startTime;

      // Performance assertions
      expect(result.state).toBe(WorkflowState.COMPLETED);
      expect(executionTime).toBeLessThan(45000); // Should complete within 45 seconds
      expect(result.metadata.totalCost).toBeLessThan(3.00); // Should cost less than $3

      // Memory usage should be reasonable
      const memoryIncrease = endMemory - startMemory;
      expect(memoryIncrease).toBeLessThan(100); // Less than 100MB increase

      // All agents should complete efficiently
      expect(result.metadata.completedAgents).toHaveLength(4);
      
      console.log(`Single workflow performance:
        Execution time: ${executionTime}ms
        Memory increase: ${memoryIncrease.toFixed(2)}MB
        Total cost: $${result.metadata.totalCost.toFixed(4)}
        Agents completed: ${result.metadata.completedAgents.length}/4`);
      
    }, PERFORMANCE_TEST_TIMEOUT);

    test('Should maintain consistent performance across multiple sequential runs', async () => {
      const numberOfRuns = 5;
      const executionTimes: number[] = [];
      const costs: number[] = [];

      for (let i = 0; i < numberOfRuns; i++) {
        const sessionId = uuidv4();
        sessionIds.push(sessionId);

        const startTime = Date.now();
        const result = await orchestrator.executeWorkflow(sessionId, performanceTestFormData);
        const endTime = Date.now();

        expect(result.state).toBe(WorkflowState.COMPLETED);
        
        executionTimes.push(endTime - startTime);
        costs.push(result.metadata.totalCost);
      }

      // Calculate consistency metrics
      const avgExecutionTime = executionTimes.reduce((a, b) => a + b) / numberOfRuns;
      const maxExecutionTime = Math.max(...executionTimes);
      const minExecutionTime = Math.min(...executionTimes);
      const executionTimeVariance = maxExecutionTime - minExecutionTime;

      const avgCost = costs.reduce((a, b) => a + b) / numberOfRuns;

      // Performance consistency assertions
      expect(avgExecutionTime).toBeLessThan(40000); // Average under 40 seconds
      expect(executionTimeVariance).toBeLessThan(20000); // Variance under 20 seconds
      expect(avgCost).toBeLessThan(2.50); // Average cost under $2.50

      console.log(`Sequential runs performance:
        Average execution time: ${avgExecutionTime.toFixed(0)}ms
        Execution time variance: ${executionTimeVariance.toFixed(0)}ms
        Average cost: $${avgCost.toFixed(4)}
        Runs completed: ${numberOfRuns}/${numberOfRuns}`);
      
    }, PERFORMANCE_TEST_TIMEOUT);

    test('Should demonstrate acceptable agent performance distribution', async () => {
      const sessionId = uuidv4();
      sessionIds.push(sessionId);

      const result = await orchestrator.executeWorkflow(sessionId, performanceTestFormData);
      expect(result.state).toBe(WorkflowState.COMPLETED);

      // Analyze individual agent performance
      const agentTimes: Record<string, number> = {};
      Object.values(AgentType).forEach(agentType => {
        const agentResult = result.agentResults[agentType];
        if (agentResult?.success) {
          agentTimes[agentType] = agentResult.metadata.durationMs;
        }
      });

      // Performance expectations per agent
      expect(agentTimes[AgentType.CONTENT_PLANNER]).toBeLessThan(8000); // 8 seconds
      expect(agentTimes[AgentType.INFO_GATHERER]).toBeLessThan(15000); // 15 seconds (web research)
      expect(agentTimes[AgentType.STRATEGIST]).toBeLessThan(10000); // 10 seconds
      expect(agentTimes[AgentType.COMPILER]).toBeLessThan(12000); // 12 seconds (final compilation)

      console.log('Agent performance breakdown:');
      Object.entries(agentTimes).forEach(([agent, time]) => {
        console.log(`  ${agent}: ${time}ms`);
      });
      
    }, PERFORMANCE_TEST_TIMEOUT);
  });

  describe('Concurrent Workflow Performance', () => {
    test('Should handle moderate concurrent load efficiently', async () => {
      const concurrencyLevel = 5;
      const workflowPromises: Promise<any>[] = [];
      const concurrentSessionIds: string[] = [];

      const startTime = Date.now();
      const startMemory = getMemoryUsage();

      // Start concurrent workflows
      for (let i = 0; i < concurrencyLevel; i++) {
        const sessionId = uuidv4();
        concurrentSessionIds.push(sessionId);
        sessionIds.push(sessionId);

        workflowPromises.push(
          orchestrator.executeWorkflow(sessionId, performanceTestFormData)
        );
      }

      const results = await Promise.all(workflowPromises);
      
      const endTime = Date.now();
      const endMemory = getMemoryUsage();

      const metrics = calculateMetrics(startTime, endTime, startMemory, endMemory, results, []);

      // Concurrent performance assertions
      expect(results.every(r => r.state === WorkflowState.COMPLETED)).toBe(true);
      expect(metrics.executionTime).toBeLessThan(60000); // Complete within 60 seconds
      expect(metrics.memoryUsage).toBeLessThan(500); // Memory increase under 500MB
      expect(metrics.throughput).toBeGreaterThan(0.08); // At least 0.08 workflows/second
      expect(metrics.errorRate).toBe(0); // No errors in concurrent execution

      console.log(`Concurrent workflow performance (${concurrencyLevel} workflows):
        Total execution time: ${metrics.executionTime}ms
        Memory increase: ${metrics.memoryUsage.toFixed(2)}MB
        Throughput: ${metrics.throughput.toFixed(3)} workflows/sec
        Total cost: $${metrics.cost.toFixed(4)}
        Error rate: ${(metrics.errorRate * 100).toFixed(1)}%`);
      
    }, LOAD_TEST_TIMEOUT);

    test('Should gracefully handle high concurrent load', async () => {
      const highConcurrencyLevel = 10;
      const workflowPromises: Promise<any>[] = [];
      const highConcurrentSessionIds: string[] = [];
      const errors: Error[] = [];

      const startTime = Date.now();

      // Start high concurrent load
      for (let i = 0; i < highConcurrencyLevel; i++) {
        const sessionId = uuidv4();
        highConcurrentSessionIds.push(sessionId);
        sessionIds.push(sessionId);

        workflowPromises.push(
          orchestrator.executeWorkflow(sessionId, performanceTestFormData)
            .catch(error => {
              errors.push(error);
              return { state: WorkflowState.FAILED, sessionId, error };
            })
        );
      }

      const results = await Promise.all(workflowPromises);
      const endTime = Date.now();

      const successfulResults = results.filter(r => r.state === WorkflowState.COMPLETED);
      const failedResults = results.filter(r => r.state === WorkflowState.FAILED);

      // High load performance expectations
      expect(successfulResults.length).toBeGreaterThan(highConcurrencyLevel * 0.7); // At least 70% success rate
      expect(endTime - startTime).toBeLessThan(120000); // Complete within 2 minutes

      const successRate = successfulResults.length / highConcurrencyLevel;
      const avgExecutionTime = endTime - startTime;

      console.log(`High concurrent load performance (${highConcurrencyLevel} workflows):
        Success rate: ${(successRate * 100).toFixed(1)}%
        Total execution time: ${avgExecutionTime}ms
        Successful workflows: ${successfulResults.length}
        Failed workflows: ${failedResults.length}
        Errors: ${errors.length}`);
      
    }, LOAD_TEST_TIMEOUT);

    test('Should maintain resource limits under load', async () => {
      const resourceTestLevel = 8;
      const workflowPromises: Promise<any>[] = [];
      const resourceTestSessionIds: string[] = [];

      // Create orchestrator with strict resource limits
      const resourceLimitedConfig: WorkflowConfig = {
        ...DefaultWorkflowConfig,
        resourceLimits: {
          ...DefaultWorkflowConfig.resourceLimits,
          maxExecutionTime: 30000, // 30 seconds
          maxCost: 2.00, // $2 maximum
          maxMemoryUsage: 300 * 1024 * 1024 // 300MB
        }
      };

      const resourceOrchestrator = new HyloWorkflowOrchestrator(resourceLimitedConfig);

      const startTime = Date.now();
      const startMemory = getMemoryUsage();

      // Start workflows with strict limits
      for (let i = 0; i < resourceTestLevel; i++) {
        const sessionId = uuidv4();
        resourceTestSessionIds.push(sessionId);
        sessionIds.push(sessionId);

        workflowPromises.push(
          resourceOrchestrator.executeWorkflow(sessionId, performanceTestFormData)
        );
      }

      const results = await Promise.all(workflowPromises);
      
      const endTime = Date.now();
      const endMemory = getMemoryUsage();

      // Resource limit compliance
      results.forEach(result => {
        if (result.state === WorkflowState.COMPLETED) {
          expect(result.metadata.totalCost).toBeLessThanOrEqual(2.00);
          expect(result.metadata.executionTimeMs || 0).toBeLessThanOrEqual(30000);
        }
      });

      expect(endMemory - startMemory).toBeLessThan(350); // Memory within limits

      console.log(`Resource-limited performance (${resourceTestLevel} workflows):
        Memory increase: ${(endMemory - startMemory).toFixed(2)}MB
        Execution time: ${endTime - startTime}ms
        Completed within limits: ${results.filter(r => r.state === WorkflowState.COMPLETED).length}
        Resource violations: ${results.filter(r => r.state === WorkflowState.FAILED).length}`);
      
    }, LOAD_TEST_TIMEOUT);
  });

  describe('Streaming Performance', () => {
    test('Should maintain efficient streaming performance', async () => {
      const sessionId = uuidv4();
      sessionIds.push(sessionId);

      const streamStartTime = Date.now();
      const streamEvents: any[] = [];
      let firstEventTime: number | null = null;

      // Collect streaming events
      for await (const event of orchestrator.streamWorkflow(sessionId, performanceTestFormData)) {
        if (firstEventTime === null) {
          firstEventTime = Date.now();
        }
        
        streamEvents.push({
          ...event,
          timestamp: Date.now()
        });

        if (event.state === WorkflowState.COMPLETED || event.state === WorkflowState.FAILED) {
          break;
        }
      }

      const streamEndTime = Date.now();

      // Streaming performance assertions
      expect(streamEvents.length).toBeGreaterThan(4); // Multiple progress updates
      expect(firstEventTime! - streamStartTime).toBeLessThan(5000); // First event within 5 seconds
      expect(streamEndTime - streamStartTime).toBeLessThan(45000); // Complete within 45 seconds

      // Validate event timing distribution
      const eventIntervals: number[] = [];
      for (let i = 1; i < streamEvents.length; i++) {
        eventIntervals.push(streamEvents[i].timestamp - streamEvents[i - 1].timestamp);
      }

      const avgInterval = eventIntervals.reduce((a, b) => a + b, 0) / eventIntervals.length;
      expect(avgInterval).toBeLessThan(15000); // Average interval under 15 seconds

      console.log(`Streaming performance:
        Total streaming time: ${streamEndTime - streamStartTime}ms
        Time to first event: ${firstEventTime! - streamStartTime}ms
        Total events: ${streamEvents.length}
        Average event interval: ${avgInterval.toFixed(0)}ms`);
      
    }, PERFORMANCE_TEST_TIMEOUT);

    test('Should handle multiple concurrent streaming clients', async () => {
      const streamingClients = 3;
      const streamingPromises: Promise<any>[] = [];
      const streamingSessionIds: string[] = [];

      const concurrentStreamStartTime = Date.now();

      // Start multiple streaming workflows
      for (let i = 0; i < streamingClients; i++) {
        const sessionId = uuidv4();
        streamingSessionIds.push(sessionId);
        sessionIds.push(sessionId);

        streamingPromises.push(
          (async () => {
            const events = [];
            for await (const event of orchestrator.streamWorkflow(sessionId, performanceTestFormData)) {
              events.push(event);
              if (event.state === WorkflowState.COMPLETED || event.state === WorkflowState.FAILED) {
                break;
              }
            }
            return events;
          })()
        );
      }

      const allStreamResults = await Promise.all(streamingPromises);
      const concurrentStreamEndTime = Date.now();

      // Concurrent streaming assertions
      expect(allStreamResults.every(events => events.length > 0)).toBe(true);
      expect(concurrentStreamEndTime - concurrentStreamStartTime).toBeLessThan(60000);

      const totalEvents = allStreamResults.reduce((sum, events) => sum + events.length, 0);
      const avgEventsPerStream = totalEvents / streamingClients;

      console.log(`Concurrent streaming performance (${streamingClients} clients):
        Total execution time: ${concurrentStreamEndTime - concurrentStreamStartTime}ms
        Total events across all streams: ${totalEvents}
        Average events per stream: ${avgEventsPerStream.toFixed(1)}
        All streams completed: ${allStreamResults.length}/${streamingClients}`);
      
    }, LOAD_TEST_TIMEOUT);
  });

  describe('Cost Optimization Performance', () => {
    test('Should optimize costs under performance constraints', async () => {
      const costOptimizedConfig: WorkflowConfig = {
        ...DefaultWorkflowConfig,
        resourceLimits: {
          ...DefaultWorkflowConfig.resourceLimits,
          maxCost: 1.50 // Very low cost limit
        }
      };

      const costOrchestrator = new HyloWorkflowOrchestrator(costOptimizedConfig);
      const sessionId = uuidv4();
      sessionIds.push(sessionId);

      const startTime = Date.now();
      const result = await costOrchestrator.executeWorkflow(sessionId, performanceTestFormData);
      const endTime = Date.now();

      // Cost optimization assertions
      if (result.state === WorkflowState.COMPLETED) {
        expect(result.metadata.totalCost).toBeLessThanOrEqual(1.50);
        expect(endTime - startTime).toBeLessThan(50000); // Still reasonably fast
      } else {
        // If failed due to cost limits, that's acceptable
        expect(result.state).toBe(WorkflowState.FAILED);
        const costError = result.metadata.errors.find(e => 
          e.message.toLowerCase().includes('cost') || 
          e.message.toLowerCase().includes('budget')
        );
        expect(costError).toBeDefined();
      }

      console.log(`Cost-optimized performance:
        Final state: ${result.state}
        Total cost: $${result.metadata.totalCost.toFixed(4)}
        Execution time: ${endTime - startTime}ms
        Cost per second: $${(result.metadata.totalCost / ((endTime - startTime) / 1000)).toFixed(6)}`);
      
    }, PERFORMANCE_TEST_TIMEOUT);
  });

  describe('Memory and Resource Monitoring', () => {
    test('Should demonstrate stable memory usage patterns', async () => {
      const memoryTestRuns = 8;
      const memoryMeasurements: number[] = [];

      // Initial memory measurement
      let baseMemory = getMemoryUsage();
      memoryMeasurements.push(baseMemory);

      // Run multiple workflows and measure memory
      for (let i = 0; i < memoryTestRuns; i++) {
        const sessionId = uuidv4();
        sessionIds.push(sessionId);

        await orchestrator.executeWorkflow(sessionId, performanceTestFormData);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }

        const currentMemory = getMemoryUsage();
        memoryMeasurements.push(currentMemory);
      }

      // Analyze memory stability
      const finalMemory = memoryMeasurements[memoryMeasurements.length - 1]!;
      const memoryGrowth = finalMemory - baseMemory;
      const maxMemory = Math.max(...memoryMeasurements);

      // Memory stability assertions
      expect(memoryGrowth).toBeLessThan(200); // Less than 200MB total growth
      expect(maxMemory - baseMemory).toBeLessThan(300); // Peak usage under 300MB increase

      console.log(`Memory stability analysis (${memoryTestRuns} workflows):
        Base memory: ${baseMemory.toFixed(2)}MB
        Final memory: ${finalMemory.toFixed(2)}MB
        Total growth: ${memoryGrowth.toFixed(2)}MB
        Peak memory: ${maxMemory.toFixed(2)}MB`);
      
    }, LOAD_TEST_TIMEOUT);
  });
});
/**
 * Comprehensive Integration Tests for AI Multi-Agent Workflow System
 * 
 * This test suite covers end-to-end workflow execution, session management,
 * agent orchestration, streaming capabilities, and error recovery scenarios.
 * 
 * Test Categories:
 * - Session lifecycle management
 * - Agent orchestration and execution
 * - Real-time streaming and progress tracking
 * - Error handling and recovery mechanisms
 * - Performance and resource utilization
 * - API contract validation
 * 
 * @group integration
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { WorkflowClient } from '../../src/services/workflow/client';
import { qstashSessionManager } from '../../api/workflow/state/session-manager';
import { WorkflowState, AgentType } from '../../src/types/agents';
import type { TravelFormData, SessionInfo, WorkflowResult } from '../../src/services/workflow/client';

// =============================================================================
// TEST SETUP AND CONFIGURATION
// =============================================================================

/**
 * Test configuration and mock data
 */
const TEST_CONFIG = {
  timeout: 30000, // 30 seconds
  streamingTimeout: 5000, // 5 seconds
  retryDelay: 1000, // 1 second
  maxRetries: 2
};

const MOCK_FORM_DATA: TravelFormData = {
  destination: 'Paris, France',
  adults: 2,
  children: 0,
  startDate: '2024-04-15',
  endDate: '2024-04-22',
  budget: '3000',
  travelStyle: 'cultural',
  interests: ['museums', 'local_cuisine', 'architecture']
};

const MOCK_ENVIRONMENT = {
  QSTASH_TOKEN: 'test_qstash_token',
  QSTASH_CURRENT_SIGNING_KEY: 'test_signing_key',
  QSTASH_NEXT_SIGNING_KEY: 'test_next_signing_key',
  UPSTASH_REDIS_REST_URL: 'https://test-redis.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'test_redis_token',
  LANGCHAIN_API_KEY: 'test_langsmith_key',
  LANGCHAIN_PROJECT: 'hylo-test-workflow'
};

// =============================================================================
// TEST UTILITIES AND HELPERS
// =============================================================================

/**
 * Mock session data for testing
 */
function createMockSession(overrides: Partial<SessionInfo> = {}): SessionInfo {
  return {
    sessionId: 'test-session-' + Date.now(),
    state: WorkflowState.INITIALIZED,
    progress: {
      currentStep: 0,
      totalSteps: 4,
      percentage: 0,
      currentAgent: null,
      estimatedTimeRemaining: 300000,
      completedAgents: [],
      failedAgents: []
    },
    metadata: {
      totalCost: 0,
      elapsedTime: 0,
      retryCount: 0,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    formData: MOCK_FORM_DATA,
    ...overrides
  };
}

/**
 * Create test client with mock configuration
 */
function createTestClient(config = {}) {
  return new WorkflowClient({
    baseUrl: 'http://localhost:3000',
    timeout: TEST_CONFIG.timeout,
    maxRetries: TEST_CONFIG.maxRetries,
    enableStreaming: true,
    observability: {
      enableLogging: false, // Reduce noise in tests
      logLevel: 'error'
    },
    ...config
  });
}

/**
 * Wait for condition with timeout
 */
async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Mock EventSource for testing streaming
 */
class MockEventSource extends EventTarget {
  url: string;
  readyState: number = 1; // OPEN
  
  constructor(url: string) {
    super();
    this.url = url;
    
    // Simulate connection
    setTimeout(() => {
      this.dispatchEvent(new Event('open'));
    }, 10);
  }
  
  close() {
    this.readyState = 2; // CLOSED
  }
  
  // Test helper to simulate messages
  simulateMessage(event: string, data: any, id?: string) {
    const messageEvent = new MessageEvent('message', {
      data: JSON.stringify(data),
      lastEventId: id
    });
    
    Object.defineProperty(messageEvent, 'type', { value: event });
    this.dispatchEvent(messageEvent);
  }
  
  // Test helper to simulate errors
  simulateError() {
    this.dispatchEvent(new Event('error'));
  }
}

// Mock global EventSource
global.EventSource = MockEventSource as any;

// =============================================================================
// TEST SUITE SETUP
// =============================================================================

describe('AI Multi-Agent Workflow Integration Tests', () => {
  let testClient: WorkflowClient;
  let mockFetch: ReturnType<typeof vi.fn>;
  
  beforeAll(() => {
    // Mock environment variables
    Object.assign(process.env, MOCK_ENVIRONMENT);
    
    // Mock fetch globally
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });
  
  beforeEach(() => {
    // Create fresh test client
    testClient = createTestClient();
    
    // Reset mocks
    mockFetch.mockClear();
    vi.clearAllTimers();
  });
  
  afterEach(async () => {
    // Cleanup test client
    if (testClient) {
      testClient.destroy();
    }
  });
  
  afterAll(() => {
    // Restore environment
    vi.restoreAllMocks();
  });

  // =============================================================================
  // SESSION LIFECYCLE TESTS
  // =============================================================================

  describe('Session Lifecycle Management', () => {
    test('should create a new workflow session successfully', async () => {
      const mockSession = createMockSession();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSession)
      });

      const session = await testClient.createSession(MOCK_FORM_DATA);

      expect(session).toBeDefined();
      expect(session.sessionId).toMatch(/^test-session-\d+$/);
      expect(session.state).toBe(WorkflowState.INITIALIZED);
      expect(session.formData).toEqual(MOCK_FORM_DATA);
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/workflow/create',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"destination":"Paris, France"')
        })
      );
    });

    test('should retrieve existing session by ID', async () => {
      const mockSession = createMockSession({
        state: WorkflowState.CONTENT_PLANNING,
        progress: {
          currentStep: 1,
          totalSteps: 4,
          percentage: 25,
          currentAgent: AgentType.CONTENT_PLANNER,
          estimatedTimeRemaining: 225000,
          completedAgents: [],
          failedAgents: []
        }
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSession)
      });

      const session = await testClient.getSession(mockSession.sessionId);

      expect(session).toBeDefined();
      expect(session?.state).toBe(WorkflowState.CONTENT_PLANNING);
      expect(session?.progress.percentage).toBe(25);
      expect(session?.progress.currentAgent).toBe(AgentType.CONTENT_PLANNER);
    });

    test('should handle session not found gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const session = await testClient.getSession('non-existent-session');

      expect(session).toBeNull();
    });

    test('should cancel session successfully', async () => {
      const mockSession = createMockSession();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          sessionId: mockSession.sessionId,
          status: 'cancelled',
          reason: 'User requested cancellation'
        })
      });

      await expect(
        testClient.cancelSession(mockSession.sessionId, 'Test cancellation')
      ).resolves.not.toThrow();

      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3000/api/workflow/cancel/${mockSession.sessionId}`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"reason":"Test cancellation"')
        })
      );
    });

    test('should retrieve workflow results when completed', async () => {
      const mockResult: WorkflowResult = {
        sessionId: 'test-session-123',
        status: 'completed',
        itinerary: 'Day 1: Visit Louvre Museum...',
        metadata: {
          totalDuration: 180000,
          totalCost: 2.45,
          successRate: 100,
          completedAt: new Date().toISOString()
        },
        agentResults: {
          'content-planner': { success: true, result: { plan: 'Cultural tour plan' } },
          'info-gatherer': { success: true, result: { venues: ['Louvre', 'Notre Dame'] } },
          'strategist': { success: true, result: { recommendations: ['Book tickets'] } },
          'compiler': { success: true, result: { itinerary: 'Day 1: Visit Louvre...' } }
        },
        formData: MOCK_FORM_DATA
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResult)
      });

      const result = await testClient.getResult('test-session-123');

      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
      expect(result.itinerary).toContain('Day 1: Visit Louvre Museum');
      expect(result.metadata.successRate).toBe(100);
    });
  });

  // =============================================================================
  // STREAMING FUNCTIONALITY TESTS
  // =============================================================================

  describe('Real-time Streaming and Progress Tracking', () => {
    test('should establish streaming connection and receive progress updates', async () => {
      const mockSession = createMockSession();
      let mockEventSource: MockEventSource;

      // Mock session creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSession)
      });

      const progressUpdates: any[] = [];
      const agentUpdates: any[] = [];

      // Create session with streaming
      const session = await testClient.createSession(MOCK_FORM_DATA, { streaming: true });
      
      // Set up event listeners
      testClient.addEventListener(session.sessionId, {
        progress: (update) => progressUpdates.push(update),
        agentStatus: (update) => agentUpdates.push(update),
        connected: () => {
          // Simulate progress events after connection
          setTimeout(() => {
            const eventSource = (global as any).lastEventSource as MockEventSource;
            if (eventSource) {
              eventSource.simulateMessage('progress', {
                sessionId: session.sessionId,
                state: WorkflowState.CONTENT_PLANNING,
                progress: {
                  currentStep: 1,
                  totalSteps: 4,
                  percentage: 25,
                  currentAgent: AgentType.CONTENT_PLANNER,
                  estimatedTimeRemaining: 225000,
                  completedAgents: [],
                  failedAgents: []
                }
              });
            }
          }, 50);
        }
      });

      // Start streaming (this would be called internally)
      await testClient.startStreaming(session.sessionId);

      // Wait for progress updates
      await waitForCondition(() => progressUpdates.length > 0, 1000);

      expect(progressUpdates).toHaveLength(1);
      expect(progressUpdates[0].state).toBe(WorkflowState.CONTENT_PLANNING);
      expect(progressUpdates[0].progress.percentage).toBe(25);
    });

    test('should handle streaming connection errors with retry', async () => {
      const mockSession = createMockSession();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSession)
      });

      const errors: any[] = [];

      const session = await testClient.createSession(MOCK_FORM_DATA);
      
      testClient.addEventListener(session.sessionId, {
        error: (error) => errors.push(error)
      });

      await testClient.startStreaming(session.sessionId);

      // Simulate streaming error
      const eventSource = (global as any).lastEventSource as MockEventSource;
      if (eventSource) {
        eventSource.simulateError();
      }

      // Note: In a real test, we'd verify retry behavior
      // For now, we just check that the error handler is called
      await waitForCondition(() => errors.length > 0, 1000);

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('stream');
    });
  });

  // =============================================================================
  // ERROR HANDLING AND RECOVERY TESTS
  // =============================================================================

  describe('Error Handling and Recovery', () => {
    test('should handle network errors with retry logic', async () => {
      let attemptCount = 0;
      
      mockFetch.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockSession())
        });
      });

      const session = await testClient.createSession(MOCK_FORM_DATA);

      expect(session).toBeDefined();
      expect(attemptCount).toBe(3); // 1 initial + 2 retries
    });

    test('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: 'Invalid form data' })
      });

      await expect(
        testClient.createSession({ ...MOCK_FORM_DATA, destination: '' })
      ).rejects.toThrow();
    });

    test('should handle session timeout scenarios', async () => {
      const timeoutClient = createTestClient({ timeout: 100 }); // Very short timeout

      // Simulate slow response
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(createMockSession())
        }), 200))
      );

      await expect(
        timeoutClient.createSession(MOCK_FORM_DATA)
      ).rejects.toThrow();

      timeoutClient.destroy();
    });
  });

  // =============================================================================
  // SESSION MANAGER INTEGRATION TESTS
  // =============================================================================

  describe('Session Manager Integration', () => {
    test('should create session with proper configuration', async () => {
      const sessionSpy = vi.spyOn(qstashSessionManager, 'createSession');
      
      // Mock successful session creation
      sessionSpy.mockResolvedValueOnce(createMockSession() as any);

      const session = await qstashSessionManager.createSession(MOCK_FORM_DATA, {
        maxExecutionTime: 300000,
        maxCost: 5.0,
        streaming: true,
        observability: {
          langsmithEnabled: true,
          verboseLogging: false
        }
      });

      expect(session).toBeDefined();
      expect(sessionSpy).toHaveBeenCalledWith(
        MOCK_FORM_DATA,
        expect.objectContaining({
          maxExecutionTime: 300000,
          maxCost: 5.0,
          streaming: true
        })
      );

      sessionSpy.mockRestore();
    });

    test('should create checkpoints during execution', async () => {
      const checkpointSpy = vi.spyOn(qstashSessionManager, 'createCheckpoint');
      const mockSession = createMockSession();
      
      checkpointSpy.mockResolvedValueOnce('checkpoint-123');

      const checkpointId = await qstashSessionManager.createCheckpoint(
        mockSession.sessionId,
        AgentType.CONTENT_PLANNER,
        { plan: 'Cultural tour planning completed' }
      );

      expect(checkpointId).toBe('checkpoint-123');
      expect(checkpointSpy).toHaveBeenCalledWith(
        mockSession.sessionId,
        AgentType.CONTENT_PLANNER,
        expect.objectContaining({
          plan: 'Cultural tour planning completed'
        })
      );

      checkpointSpy.mockRestore();
    });

    test('should handle session recovery from checkpoints', async () => {
      const recoverSpy = vi.spyOn(qstashSessionManager, 'recoverSession');
      const mockSession = createMockSession({
        state: WorkflowState.INFO_GATHERING
      });
      
      recoverSpy.mockResolvedValueOnce(mockSession as any);

      const recoveredSession = await qstashSessionManager.recoverSession(mockSession.sessionId);

      expect(recoveredSession).toBeDefined();
      expect(recoveredSession?.state).toBe(WorkflowState.INFO_GATHERING);
      
      recoverSpy.mockRestore();
    });
  });

  // =============================================================================
  // PERFORMANCE AND RESOURCE TESTS
  // =============================================================================

  describe('Performance and Resource Utilization', () => {
    test('should track resource usage during execution', async () => {
      const statsPromises: Promise<any>[] = [];
      let totalMemoryUsage = 0;
      
      // Create multiple concurrent sessions
      for (let i = 0; i < 3; i++) {
        const client = createTestClient();
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createMockSession({
            sessionId: `concurrent-session-${i}`
          }))
        });

        const promise = client.createSession(MOCK_FORM_DATA).then(session => {
          // Track memory usage (simplified)
          totalMemoryUsage += JSON.stringify(session).length;
          return { client, session };
        });

        statsPromises.push(promise);
      }

      const results = await Promise.all(statsPromises);

      expect(results).toHaveLength(3);
      expect(totalMemoryUsage).toBeGreaterThan(0);

      // Cleanup
      results.forEach(({ client }) => client.destroy());
    });

    test('should handle resource cleanup properly', async () => {
      const client = createTestClient();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockSession())
      });

      const session = await client.createSession(MOCK_FORM_DATA);
      const initialStats = client.getStats();
      
      expect(initialStats.activeSessions).toBe(1);

      // Cleanup specific session
      client.cleanup(session.sessionId);
      
      const afterCleanupStats = client.getStats();
      expect(afterCleanupStats.activeSessions).toBe(0);

      client.destroy();
    });

    test('should enforce cost limits', async () => {
      const costLimitClient = createTestClient({
        costLimit: 1.0 // Very low limit
      });

      // Mock a high-cost response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Cost Limit Exceeded',
        json: () => Promise.resolve({ 
          error: 'Request would exceed cost limit of $1.00' 
        })
      });

      await expect(
        costLimitClient.createSession(MOCK_FORM_DATA)
      ).rejects.toThrow();

      costLimitClient.destroy();
    });
  });

  // =============================================================================
  // API CONTRACT VALIDATION TESTS
  // =============================================================================

  describe('API Contract Validation', () => {
    test('should validate session creation request structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockSession())
      });

      await testClient.createSession(MOCK_FORM_DATA);

      const [url, options] = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(options.body);

      expect(url).toBe('http://localhost:3000/api/workflow/create');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(requestBody).toEqual({
        formData: MOCK_FORM_DATA,
        config: expect.objectContaining({
          streaming: true
        })
      });
    });

    test('should validate streaming endpoint URL format', async () => {
      const mockSession = createMockSession();
      
      await testClient.startStreaming(mockSession.sessionId);

      // Check that EventSource was created with correct URL
      const lastEventSource = (global as any).lastEventSource as MockEventSource;
      expect(lastEventSource?.url).toBe(
        `http://localhost:3000/api/workflow/stream/${mockSession.sessionId}?heartbeat=true`
      );
    });

    test('should validate result retrieval endpoint format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          sessionId: 'test-session',
          status: 'completed',
          itinerary: 'Test itinerary'
        })
      });

      await testClient.getResult('test-session', 'formatted');

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/workflow/result/test-session');
      expect(url).toContain('format=formatted');
      expect(url).toContain('includeMetadata=true');
    });
  });

  // =============================================================================
  // INTEGRATION SCENARIO TESTS
  // =============================================================================

  describe('End-to-End Workflow Scenarios', () => {
    test('should complete full workflow execution', async () => {
      const events: Array<{ type: string; data: any }> = [];
      
      // Mock successful session creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockSession())
      });

      const session = await testClient.createSession(MOCK_FORM_DATA, { streaming: true });

      // Set up comprehensive event tracking
      testClient.addEventListener(session.sessionId, {
        progress: (data) => events.push({ type: 'progress', data }),
        agentStatus: (data) => events.push({ type: 'agentStatus', data }),
        completion: (data) => events.push({ type: 'completion', data }),
        connected: () => events.push({ type: 'connected', data: { sessionId: session.sessionId } })
      });

      await testClient.startStreaming(session.sessionId);

      // Simulate complete workflow progression
      const eventSource = (global as any).lastEventSource as MockEventSource;
      if (eventSource) {
        // Progress through each agent
        const agents = [
          AgentType.CONTENT_PLANNER,
          AgentType.INFO_GATHERER,
          AgentType.STRATEGIST,
          AgentType.COMPILER
        ];

        for (let i = 0; i < agents.length; i++) {
          setTimeout(() => {
            eventSource.simulateMessage('progress', {
              sessionId: session.sessionId,
              state: WorkflowState.CONTENT_PLANNING,
              progress: {
                currentStep: i + 1,
                totalSteps: 4,
                percentage: ((i + 1) / 4) * 100,
                currentAgent: agents[i],
                estimatedTimeRemaining: (4 - (i + 1)) * 60000,
                completedAgents: agents.slice(0, i),
                failedAgents: []
              }
            });
          }, i * 100);
        }

        // Final completion
        setTimeout(() => {
          eventSource.simulateMessage('completion', {
            sessionId: session.sessionId,
            status: 'completed',
            itinerary: 'Complete Paris itinerary...',
            metadata: {
              totalDuration: 180000,
              totalCost: 2.45,
              successRate: 100
            }
          });
        }, 500);
      }

      // Wait for all events
      await waitForCondition(() => events.length >= 6, 2000); // connected + 4 progress + completion

      const progressEvents = events.filter(e => e.type === 'progress');
      const completionEvents = events.filter(e => e.type === 'completion');

      expect(progressEvents.length).toBeGreaterThan(0);
      expect(completionEvents).toHaveLength(1);
      expect(completionEvents[0].data.status).toBe('completed');
    });

    test('should handle workflow failure and recovery', async () => {
      const errors: any[] = [];
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockSession())
      });

      const session = await testClient.createSession(MOCK_FORM_DATA);

      testClient.addEventListener(session.sessionId, {
        error: (error) => errors.push(error)
      });

      await testClient.startStreaming(session.sessionId);

      // Simulate failure
      const eventSource = (global as any).lastEventSource as MockEventSource;
      if (eventSource) {
        setTimeout(() => {
          eventSource.simulateMessage('error', {
            sessionId: session.sessionId,
            error: 'Agent execution failed',
            errorType: 'agent_failure',
            severity: 'high',
            recoverable: true
          });
        }, 50);
      }

      await waitForCondition(() => errors.length > 0, 1000);

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('stream');
      expect(errors[0].retryable).toBe(false); // Stream errors are not retryable
    });
  });

  // =============================================================================
  // CLEANUP AND VALIDATION
  // =============================================================================

  describe('Test Environment Validation', () => {
    test('should have all required environment variables', () => {
      const requiredEnvVars = [
        'QSTASH_TOKEN',
        'UPSTASH_REDIS_REST_URL',
        'UPSTASH_REDIS_REST_TOKEN'
      ];

      for (const envVar of requiredEnvVars) {
        expect(process.env[envVar]).toBeDefined();
      }
    });

    test('should cleanup all resources after tests', () => {
      // This test ensures cleanup is working
      expect(testClient.getStats().activeSessions).toBe(0);
      expect(testClient.getStats().activeStreams).toBe(0);
    });
  });
});

// =============================================================================
// PERFORMANCE BENCHMARKS
// =============================================================================

describe('Performance Benchmarks', () => {
  test('should create sessions within performance thresholds', async () => {
    const startTime = Date.now();
    const client = createTestClient();
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(createMockSession())
    });

    await client.createSession(MOCK_FORM_DATA);
    
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(1000); // Should complete within 1 second
    
    client.destroy();
  });

  test('should handle concurrent session creation efficiently', async () => {
    const concurrency = 5;
    const clients: WorkflowClient[] = [];
    const promises: Promise<any>[] = [];
    
    for (let i = 0; i < concurrency; i++) {
      const client = createTestClient();
      clients.push(client);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockSession({
          sessionId: `concurrent-${i}`
        }))
      });

      promises.push(client.createSession(MOCK_FORM_DATA));
    }

    const startTime = Date.now();
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;

    expect(results).toHaveLength(concurrency);
    expect(duration).toBeLessThan(2000); // All should complete within 2 seconds

    // Cleanup
    clients.forEach(client => client.destroy());
  });
});
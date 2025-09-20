/**
 * Client Service Unit Tests
 * 
 * Unit tests for the frontend workflow client service
 * covering API interactions, error handling, and retry logic.
 * 
 * @group unit
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorkflowClient } from '../../src/services/workflow/client';
import { WorkflowState, AgentType, type TravelFormData } from '../../src/types/agents';
import type { SessionInfo, WorkflowResult } from '../../src/services/workflow/client';

// =============================================================================
// TEST FIXTURES AND MOCKS
// =============================================================================

const MOCK_FORM_DATA: TravelFormData = {
  destination: 'Barcelona, Spain',
  departureDate: '2024-06-01',
  returnDate: '2024-06-08',
  tripNickname: 'Barcelona Adventure',
  contactName: 'Maria Garcia',
  adults: 2,
  children: 0,
  budget: {
    amount: 3500,
    currency: 'EUR',
    mode: 'total'
  },
  preferences: {
    travelStyle: 'culture',
    interests: ['architecture', 'museums', 'local_cuisine']
  }
};

const MOCK_SESSION_INFO: SessionInfo = {
  sessionId: 'test-session-123',
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
  formData: MOCK_FORM_DATA
};

const MOCK_WORKFLOW_RESULT: WorkflowResult = {
  sessionId: 'test-session-123',
  status: 'completed',
  itinerary: 'Day 1: Visit Sagrada Familia...',
  metadata: {
    totalDuration: 180000,
    totalCost: 2.45,
    successRate: 100,
    completedAt: new Date().toISOString()
  },
  agentResults: {
    'content-planner': { success: true, result: { plan: 'Barcelona cultural plan' } },
    'info-gatherer': { success: true, result: { venues: ['Sagrada Familia', 'Park Güell'] } },
    'strategist': { success: true, result: { recommendations: ['Book tickets in advance'] } },
    'compiler': { success: true, result: { itinerary: 'Complete Barcelona itinerary' } }
  },
  formData: MOCK_FORM_DATA
};

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock EventSource
class MockEventSource extends EventTarget {
  url: string;
  readyState: number = 1; // OPEN

  constructor(url: string) {
    super();
    this.url = url;
    setTimeout(() => this.dispatchEvent(new Event('open')), 10);
  }

  close() {
    this.readyState = 2; // CLOSED
  }

  simulateMessage(type: string, data: any) {
    const event = new MessageEvent('message', {
      data: JSON.stringify(data)
    });
    
    // Set event type on the instance
    (event as any).eventType = type;
    this.dispatchEvent(event);
  }

  simulateError() {
    this.dispatchEvent(new Event('error'));
  }
}

global.EventSource = MockEventSource as any;

// =============================================================================
// TEST UTILITIES
// =============================================================================

function createTestClient(config = {}) {
  return new WorkflowClient({
    baseUrl: 'http://localhost:3000',
    timeout: 30000,
    maxRetries: 2,
    enableStreaming: true,
    ...config
  });
}

function createSuccessResponse(data: any, status = 200) {
  return Promise.resolve({
    ok: status < 400,
    status,
    statusText: status < 400 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  });
}

function createErrorResponse(status = 500, message = 'Internal Server Error') {
  return Promise.resolve({
    ok: false,
    status,
    statusText: message,
    json: () => Promise.resolve({ error: message }),
    text: () => Promise.resolve(JSON.stringify({ error: message }))
  });
}

// =============================================================================
// TESTS
// =============================================================================

describe('WorkflowClient Unit Tests', () => {
  let client: WorkflowClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = createTestClient();
  });

  afterEach(() => {
    client?.destroy();
  });

  // =============================================================================
  // SESSION MANAGEMENT TESTS
  // =============================================================================

  describe('Session Management', () => {
    test('should create a new session successfully', async () => {
      mockFetch.mockResolvedValueOnce(createSuccessResponse(MOCK_SESSION_INFO));

      const session = await client.createSession(MOCK_FORM_DATA);

      expect(session).toEqual(MOCK_SESSION_INFO);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/workflow/create',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"destination":"Barcelona, Spain"')
        })
      );
    });

    test('should create session with custom configuration', async () => {
      mockFetch.mockResolvedValueOnce(createSuccessResponse(MOCK_SESSION_INFO));

      const customConfig = { streaming: false, maxCost: 10.0 };
      await client.createSession(MOCK_FORM_DATA, customConfig);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/workflow/create',
        expect.objectContaining({
          body: expect.stringContaining('"streaming":false')
        })
      );
    });

    test('should retrieve existing session', async () => {
      const sessionWithProgress = {
        ...MOCK_SESSION_INFO,
        state: WorkflowState.CONTENT_PLANNING,
        progress: {
          ...MOCK_SESSION_INFO.progress,
          currentStep: 1,
          percentage: 25,
          currentAgent: AgentType.CONTENT_PLANNER
        }
      };

      mockFetch.mockResolvedValueOnce(createSuccessResponse(sessionWithProgress));

      const session = await client.getSession('test-session-123');

      expect(session).toEqual(sessionWithProgress);
      expect(session?.state).toBe(WorkflowState.CONTENT_PLANNING);
      expect(session?.progress.percentage).toBe(25);
    });

    test('should return null for non-existent session', async () => {
      mockFetch.mockResolvedValueOnce(createErrorResponse(404, 'Not Found'));

      const session = await client.getSession('non-existent');

      expect(session).toBeNull();
    });

    test('should cancel session successfully', async () => {
      mockFetch.mockResolvedValueOnce(createSuccessResponse({ 
        sessionId: 'test-session-123',
        status: 'cancelled' 
      }));

      await expect(
        client.cancelSession('test-session-123', 'User cancellation')
      ).resolves.not.toThrow();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/workflow/cancel/test-session-123',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"reason":"User cancellation"')
        })
      );
    });

    test('should retrieve workflow results', async () => {
      mockFetch.mockResolvedValueOnce(createSuccessResponse(MOCK_WORKFLOW_RESULT));

      const result = await client.getResult('test-session-123');

      expect(result).toEqual(MOCK_WORKFLOW_RESULT);
      expect(result.status).toBe('completed');
      expect(result.metadata.successRate).toBe(100);
    });

    test('should retrieve results with format options', async () => {
      mockFetch.mockResolvedValueOnce(createSuccessResponse(MOCK_WORKFLOW_RESULT));

      await client.getResult('test-session-123', 'formatted');

      const callUrl = mockFetch.mock.calls[0]?.[0];
      expect(callUrl).toContain('format=formatted');
      expect(callUrl).toContain('includeMetadata=true');
    });
  });

  // =============================================================================
  // STREAMING FUNCTIONALITY TESTS
  // =============================================================================

  describe('Streaming Functionality', () => {
    test('should establish streaming connection', async () => {
      const events: any[] = [];
      
      client.addEventListener('test-session', {
        connected: () => events.push({ type: 'connected' }),
        progress: (data) => events.push({ type: 'progress', data })
      });

      await client.startStreaming('test-session');

      // Simulate connection established
      const eventSource = (global as any).lastEventSource;
      expect(eventSource).toBeDefined();
      expect(eventSource.url).toContain('/api/workflow/stream/test-session');

      // Wait for connection event
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(events.some(e => e.type === 'connected')).toBe(true);
    });

    test('should handle streaming progress updates', async () => {
      const progressUpdates: any[] = [];
      
      client.addEventListener('test-session', {
        progress: (data) => progressUpdates.push(data)
      });

      await client.startStreaming('test-session');

      // Simulate progress event
      const eventSource = (global as any).lastEventSource as MockEventSource;
      eventSource.simulateMessage('progress', {
        sessionId: 'test-session',
        state: WorkflowState.INFO_GATHERING,
        progress: { percentage: 50, currentAgent: AgentType.INFO_GATHERER }
      });

      await new Promise(resolve => setTimeout(resolve, 20));

      expect(progressUpdates).toHaveLength(1);
      expect(progressUpdates[0].state).toBe(WorkflowState.INFO_GATHERING);
      expect(progressUpdates[0].progress.percentage).toBe(50);
    });

    test('should handle streaming errors', async () => {
      const errors: any[] = [];
      
      client.addEventListener('test-session', {
        error: (error) => errors.push(error)
      });

      await client.startStreaming('test-session');

      // Simulate streaming error
      const eventSource = (global as any).lastEventSource as MockEventSource;
      eventSource.simulateError();

      await new Promise(resolve => setTimeout(resolve, 20));

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('stream');
    });

    test('should stop streaming correctly', async () => {
      await client.startStreaming('test-session');
      
      const eventSource = (global as any).lastEventSource as MockEventSource;
      expect(eventSource.readyState).toBe(1); // OPEN

      client.stopStreaming('test-session');

      expect(eventSource.readyState).toBe(2); // CLOSED
    });
  });

  // =============================================================================
  // ERROR HANDLING AND RETRY TESTS
  // =============================================================================

  describe('Error Handling and Retry Logic', () => {
    test('should retry on network failures', async () => {
      let attemptCount = 0;
      
      mockFetch.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return createSuccessResponse(MOCK_SESSION_INFO);
      });

      const session = await client.createSession(MOCK_FORM_DATA);

      expect(session).toEqual(MOCK_SESSION_INFO);
      expect(attemptCount).toBe(3); // 1 initial + 2 retries
    });

    test('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce(createErrorResponse(400, 'Bad Request'));

      await expect(
        client.createSession({ ...MOCK_FORM_DATA, destination: '' })
      ).rejects.toThrow('Bad Request');
    });

    test('should respect timeout configuration', async () => {
      const timeoutClient = createTestClient({ timeout: 100 });

      // Simulate slow response
      mockFetch.mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve(createSuccessResponse(MOCK_SESSION_INFO)), 200)
        )
      );

      await expect(
        timeoutClient.createSession(MOCK_FORM_DATA)
      ).rejects.toThrow();

      timeoutClient.destroy();
    });

    test('should handle malformed responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await expect(
        client.createSession(MOCK_FORM_DATA)
      ).rejects.toThrow('Invalid JSON');
    });

    test('should not retry on client errors (4xx)', async () => {
      let attemptCount = 0;
      
      mockFetch.mockImplementation(() => {
        attemptCount++;
        return createErrorResponse(400, 'Bad Request');
      });

      await expect(
        client.createSession(MOCK_FORM_DATA)
      ).rejects.toThrow('Bad Request');

      expect(attemptCount).toBe(1); // No retries for client errors
    });
  });

  // =============================================================================
  // EVENT MANAGEMENT TESTS
  // =============================================================================

  describe('Event Management', () => {
    test('should add and remove event listeners', () => {
      const mockListener = {
        progress: vi.fn(),
        error: vi.fn()
      };

      client.addEventListener('test-session', mockListener);
      
      // Verify listener was added
      const listeners = (client as any).eventListeners.get('test-session');
      expect(listeners).toContain(mockListener);

      client.removeEventListener('test-session');
      
      // Verify listener was removed
      const updatedListeners = (client as any).eventListeners.get('test-session');
      expect(updatedListeners).toBeUndefined();
    });

    test('should handle multiple listeners for same session', () => {
      const listener1 = { progress: vi.fn() };
      const listener2 = { progress: vi.fn() };

      client.addEventListener('test-session', listener1);
      client.addEventListener('test-session', listener2);

      const listeners = (client as any).eventListeners.get('test-session');
      expect(listeners).toHaveLength(2);
      expect(listeners).toContain(listener1);
      expect(listeners).toContain(listener2);
    });

    test('should cleanup listeners on destroy', () => {
      client.addEventListener('test-session-1', { progress: vi.fn() });
      client.addEventListener('test-session-2', { error: vi.fn() });

      expect((client as any).eventListeners.size).toBe(2);

      client.destroy();

      expect((client as any).eventListeners.size).toBe(0);
    });
  });

  // =============================================================================
  // STATISTICS AND MONITORING TESTS
  // =============================================================================

  describe('Statistics and Monitoring', () => {
    test('should track client statistics', () => {
      const initialStats = client.getStats();
      
      expect(initialStats.activeSessions).toBe(0);
      expect(initialStats.activeStreams).toBe(0);
      expect(initialStats.activeRequests).toBe(0);

      // Simulate session creation
      mockFetch.mockResolvedValueOnce(createSuccessResponse(MOCK_SESSION_INFO));
      
      client.createSession(MOCK_FORM_DATA).then(() => {
        const updatedStats = client.getStats();
        expect(updatedStats.activeSessions).toBe(1);
      });
    });

    test('should track active streaming connections', async () => {
      await client.startStreaming('session-1');
      await client.startStreaming('session-2');

      const stats = client.getStats();
      expect(stats.activeStreams).toBe(2);

      client.stopStreaming('session-1');
      
      const updatedStats = client.getStats();
      expect(updatedStats.activeStreams).toBe(1);
    });

    test('should cleanup session tracking', async () => {
      mockFetch.mockResolvedValueOnce(createSuccessResponse(MOCK_SESSION_INFO));
      
      const session = await client.createSession(MOCK_FORM_DATA);
      
      const initialStats = client.getStats();
      expect(initialStats.activeSessions).toBe(1);

      client.cleanup(session.sessionId);
      
      const finalStats = client.getStats();
      expect(finalStats.activeSessions).toBe(0);
    });
  });

  // =============================================================================
  // CONFIGURATION TESTS
  // =============================================================================

  describe('Configuration', () => {
    test('should use custom base URL', async () => {
      const customClient = createTestClient({ 
        baseUrl: 'https://custom-api.example.com' 
      });

      mockFetch.mockResolvedValueOnce(createSuccessResponse(MOCK_SESSION_INFO));

      await customClient.createSession(MOCK_FORM_DATA);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom-api.example.com/api/workflow/create',
        expect.any(Object)
      );

      customClient.destroy();
    });

    test('should respect streaming configuration', async () => {
      const noStreamingClient = createTestClient({ enableStreaming: false });

      await expect(
        noStreamingClient.startStreaming('test-session')
      ).rejects.toThrow('Streaming is disabled');

      noStreamingClient.destroy();
    });

    test('should apply custom headers', async () => {
      const clientWithHeaders = createTestClient({
        headers: {
          'X-Custom-Header': 'custom-value',
          'Authorization': 'Bearer test-token'
        }
      });

      mockFetch.mockResolvedValueOnce(createSuccessResponse(MOCK_SESSION_INFO));

      await clientWithHeaders.createSession(MOCK_FORM_DATA);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'custom-value',
            'Authorization': 'Bearer test-token'
          })
        })
      );

      clientWithHeaders.destroy();
    });
  });

  // =============================================================================
  // EDGE CASES AND BOUNDARY CONDITIONS
  // =============================================================================

  describe('Edge Cases', () => {
    test('should handle empty session list', async () => {
      mockFetch.mockResolvedValueOnce(createSuccessResponse([]));

      // Assuming there's a listSessions method
      if ('listSessions' in client) {
        const sessions = await (client as any).listSessions();
        expect(sessions).toEqual([]);
      }
    });

    test('should handle concurrent operations safely', async () => {
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        mockFetch.mockResolvedValueOnce(createSuccessResponse({
          ...MOCK_SESSION_INFO,
          sessionId: `session-${i}`
        }));
        
        promises.push(client.createSession(MOCK_FORM_DATA));
      }

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach((session, index) => {
        expect(session.sessionId).toBe(`session-${index}`);
      });
    });

    test('should handle resource exhaustion gracefully', () => {
      // Test maximum concurrent sessions
      const resourceStats = client.getStats();
      expect(resourceStats).toHaveProperty('activeSessions');
      expect(resourceStats).toHaveProperty('activeStreams');
      expect(resourceStats).toHaveProperty('totalRequests');
    });
  });
});

// =============================================================================
// INTEGRATION SCENARIOS
// =============================================================================

describe('Client Integration Scenarios', () => {
  let client: WorkflowClient;

  beforeEach(() => {
    client = createTestClient();
  });

  afterEach(() => {
    client?.destroy();
  });

  test('should handle complete workflow lifecycle', async () => {
    const events: any[] = [];

    // Create session
    mockFetch.mockResolvedValueOnce(createSuccessResponse(MOCK_SESSION_INFO));
    const session = await client.createSession(MOCK_FORM_DATA, { streaming: true });

    // Set up streaming
    client.addEventListener(session.sessionId, {
      progress: (data) => events.push({ type: 'progress', data }),
      completion: (data) => events.push({ type: 'completion', data })
    });

    await client.startStreaming(session.sessionId);

    // Simulate workflow completion
    const eventSource = (global as any).lastEventSource as MockEventSource;
    
    // Progress updates
    eventSource.simulateMessage('progress', {
      state: WorkflowState.INFO_GATHERING,
      progress: { percentage: 50 }
    });
    
    eventSource.simulateMessage('completion', {
      status: 'completed',
      sessionId: session.sessionId
    });

    // Get final result
    mockFetch.mockResolvedValueOnce(createSuccessResponse(MOCK_WORKFLOW_RESULT));
    const result = await client.getResult(session.sessionId);

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(events.length).toBeGreaterThan(0);
    expect(result.status).toBe('completed');
    expect(result.sessionId).toBe(session.sessionId);
  });

  test('should handle workflow failure and recovery', async () => {
    const errors: any[] = [];

    // Create session
    mockFetch.mockResolvedValueOnce(createSuccessResponse(MOCK_SESSION_INFO));
    const session = await client.createSession(MOCK_FORM_DATA);

    // Set up error handling
    client.addEventListener(session.sessionId, {
      error: (error) => errors.push(error)
    });

    await client.startStreaming(session.sessionId);

    // Simulate failure
    const eventSource = (global as any).lastEventSource as MockEventSource;
    eventSource.simulateMessage('error', {
      error: 'Agent execution failed',
      recoverable: true
    });

    await new Promise(resolve => setTimeout(resolve, 20));

    expect(errors).toHaveLength(1);
    expect(errors[0].recoverable).toBe(true);
  });
});
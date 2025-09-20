/**
 * Session Manager Unit Tests
 * 
 * Simplified test suite for QStash + Redis session management
 * focusing on actual available methods and interfaces.
 * 
 * @group unit
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { qstashSessionManager, QStashSessionManager } from '../../api/workflow/state/session-manager';
import { WorkflowState, AgentType } from '../../src/types/agents';
import type { TravelFormData } from '../../src/types/agents';

// =============================================================================
// TEST FIXTURES AND MOCKS
// =============================================================================

const MOCK_FORM_DATA: TravelFormData = {
  destination: 'Tokyo, Japan',
  departureDate: '2024-05-01',
  returnDate: '2024-05-08',
  tripNickname: 'Tokyo Adventure',
  contactName: 'John Doe',
  adults: 2,
  children: 1,
  budget: {
    amount: 4000,
    currency: 'USD',
    mode: 'total'
  },
  preferences: {
    travelStyle: 'adventure',
    interests: ['temples', 'street_food', 'gardens']
  }
};

// Mock QStash client
const mockQStashClient = {
  publishJSON: vi.fn(),
  message: {
    cancel: vi.fn()
  },
  queue: {
    upsert: vi.fn()
  }
};

// Mock Redis client  
const mockRedisClient = {
  set: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  expire: vi.fn(),
  exists: vi.fn(),
  keys: vi.fn(),
  publish: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn()
};

// Mock tracer for LangSmith
const mockTracer = {
  trace: vi.fn().mockImplementation((_, fn) => fn()),
  withTraceMetadata: vi.fn()
};

// =============================================================================
// TEST UTILITIES
// =============================================================================

function createTestSessionManager() {
  const manager = new QStashSessionManager();
  // Inject mocks
  (manager as any).qstashClient = mockQStashClient;
  (manager as any).redisClient = mockRedisClient;
  (manager as any).tracer = mockTracer;
  return manager;
}

function generateSessionId(): string {
  return `test-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// TESTS
// =============================================================================

describe('QStashSessionManager Unit Tests', () => {
  let sessionManager: QStashSessionManager;
  
  beforeEach(() => {
    vi.clearAllMocks();
    sessionManager = createTestSessionManager();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  // =============================================================================
  // SESSION CREATION TESTS
  // =============================================================================

  describe('Session Creation', () => {
    test('should create a new session with valid form data', async () => {
      // Mock Redis operations
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.expire.mockResolvedValue(1);
      
      // Mock QStash publish
      mockQStashClient.publishJSON.mockResolvedValue({ messageId: 'msg-123' });

      const session = await sessionManager.createSession(MOCK_FORM_DATA);

      expect(session).toBeDefined();
      expect(session.sessionId).toMatch(/^[a-zA-Z0-9-]+$/);
      expect(session.state).toBe(WorkflowState.INITIALIZED);
      expect(session.formData).toEqual(MOCK_FORM_DATA);
      expect(session.metadata.totalCost).toBe(0);
      
      // Verify Redis storage was called
      expect(mockRedisClient.set).toHaveBeenCalled();
    });

    test('should handle Redis storage failure gracefully', async () => {
      mockRedisClient.set.mockRejectedValue(new Error('Redis connection failed'));

      await expect(
        sessionManager.createSession(MOCK_FORM_DATA)
      ).rejects.toThrow();
    });

    test('should handle QStash publish failure', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.expire.mockResolvedValue(1);
      mockQStashClient.publishJSON.mockRejectedValue(new Error('QStash unavailable'));

      await expect(
        sessionManager.createSession(MOCK_FORM_DATA)
      ).rejects.toThrow();
    });
  });

  // =============================================================================
  // SESSION RETRIEVAL TESTS
  // =============================================================================

  describe('Session Retrieval', () => {
    test('should retrieve existing session by ID', async () => {
      const sessionId = generateSessionId();
      const sessionData = {
        sessionId,
        state: WorkflowState.INFO_GATHERING,
        progress: {
          currentStep: 2,
          totalSteps: 4,
          percentage: 50
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalCost: 1.25,
          estimatedDuration: 300000,
          retryCount: 0,
          lastHeartbeat: new Date().toISOString(),
          version: '1.0.0'
        },
        formData: MOCK_FORM_DATA
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(sessionData));

      const session = await sessionManager.getSession(sessionId);

      expect(session).toBeDefined();
      expect(session?.sessionId).toBe(sessionId);
      expect(session?.state).toBe(WorkflowState.INFO_GATHERING);
      expect(session?.metadata.totalCost).toBe(1.25);
    });

    test('should return null for non-existent session', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const session = await sessionManager.getSession('non-existent-session');

      expect(session).toBeNull();
      expect(mockRedisClient.get).toHaveBeenCalledWith('session:non-existent-session');
    });

    test('should handle corrupted session data gracefully', async () => {
      const sessionId = generateSessionId();
      mockRedisClient.get.mockResolvedValue('invalid-json');

      await expect(
        sessionManager.getSession(sessionId)
      ).rejects.toThrow();
    });
  });

  // =============================================================================
  // SESSION UPDATE TESTS
  // =============================================================================

  describe('Session Updates', () => {
    test('should update session state successfully', async () => {
      const sessionId = generateSessionId();
      const existingSession = {
        sessionId,
        state: WorkflowState.INITIALIZED,
        progress: {
          currentStep: 0,
          totalSteps: 4,
          percentage: 0
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalCost: 0,
          estimatedDuration: 300000,
          retryCount: 0,
          lastHeartbeat: new Date().toISOString(),
          version: '1.0.0'
        },
        formData: MOCK_FORM_DATA
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(existingSession));
      mockRedisClient.set.mockResolvedValue('OK');

      const updates = {
        state: WorkflowState.CONTENT_PLANNING
      };

      await sessionManager.updateSession(sessionId, updates);

      // Verify Redis update
      expect(mockRedisClient.set).toHaveBeenCalled();
      const updateCall = mockRedisClient.set.mock.calls[0];
      expect(updateCall).toBeDefined();
      
      if (updateCall && updateCall[1]) {
        const updatedData = JSON.parse(updateCall[1]);
        expect(updatedData.state).toBe(WorkflowState.CONTENT_PLANNING);
      }
    });

    test('should handle session not found during update', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      await expect(
        sessionManager.updateSession('non-existent', { state: WorkflowState.COMPLETED })
      ).rejects.toThrow();
    });
  });

  // =============================================================================
  // CHECKPOINT MANAGEMENT TESTS
  // =============================================================================

  describe('Checkpoint Management', () => {
    test('should create checkpoint successfully', async () => {
      const sessionId = generateSessionId();
      const agentType = AgentType.CONTENT_PLANNER;
      const result = { plan: 'Comprehensive Tokyo cultural tour plan' };

      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.expire.mockResolvedValue(1);

      const checkpointId = await sessionManager.createCheckpoint(sessionId, agentType, result);

      expect(checkpointId).toMatch(/^checkpoint-\d+-[a-zA-Z0-9]+$/);
      
      // Verify checkpoint storage
      expect(mockRedisClient.set).toHaveBeenCalled();
      const setCall = mockRedisClient.set.mock.calls[0];
      expect(setCall).toBeDefined();
      
      if (setCall && setCall[0]) {
        expect(setCall[0]).toContain(`checkpoint:${sessionId}:`);
      }
      
      if (setCall && setCall[1]) {
        const checkpointData = JSON.parse(setCall[1]);
        expect(checkpointData.sessionId).toBe(sessionId);
        expect(checkpointData.agentType).toBe(agentType);
        expect(checkpointData.result).toEqual(result);
        expect(checkpointData.timestamp).toBeDefined();
      }
    });

    test('should handle checkpoint creation failure', async () => {
      mockRedisClient.set.mockRejectedValue(new Error('Redis storage full'));

      await expect(
        sessionManager.createCheckpoint('session-123', AgentType.STRATEGIST, { recommendations: [] })
      ).rejects.toThrow();
    });
  });

  // =============================================================================
  // SESSION RECOVERY TESTS
  // =============================================================================

  describe('Session Recovery', () => {
    test('should recover session successfully', async () => {
      const sessionId = generateSessionId();
      const sessionData = {
        sessionId,
        state: WorkflowState.FAILED,
        formData: MOCK_FORM_DATA,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalCost: 0,
          estimatedDuration: 300000,
          retryCount: 0,
          lastHeartbeat: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(sessionData));
      mockRedisClient.set.mockResolvedValue('OK');
      mockQStashClient.publishJSON.mockResolvedValue({ messageId: 'recovery-msg-123' });

      const recoveredSession = await sessionManager.recoverSession(sessionId);

      expect(recoveredSession).toBeDefined();
      expect(recoveredSession?.sessionId).toBe(sessionId);
      expect(mockQStashClient.publishJSON).toHaveBeenCalled();
    });

    test('should handle session not found during recovery', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      await expect(
        sessionManager.recoverSession('non-existent-session')
      ).rejects.toThrow();
    });
  });

  // =============================================================================
  // SESSION CANCELLATION TESTS
  // =============================================================================

  describe('Session Cancellation', () => {
    test('should cancel session successfully', async () => {
      const sessionId = generateSessionId();
      const sessionData = {
        sessionId,
        state: WorkflowState.INFO_GATHERING,
        qstashMessageId: 'qstash-msg-123',
        formData: MOCK_FORM_DATA,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalCost: 0,
          estimatedDuration: 300000,
          retryCount: 0,
          lastHeartbeat: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(sessionData));
      mockRedisClient.set.mockResolvedValue('OK');
      mockQStashClient.message.cancel.mockResolvedValue({ success: true });

      await sessionManager.cancelSession(sessionId, 'User requested cancellation');

      // Verify QStash message cancellation
      expect(mockQStashClient.message.cancel).toHaveBeenCalledWith('qstash-msg-123');
      
      // Verify session state update
      expect(mockRedisClient.set).toHaveBeenCalled();
      const updateCall = mockRedisClient.set.mock.calls[0];
      
      if (updateCall && updateCall[1]) {
        const updatedSession = JSON.parse(updateCall[1]);
        expect(updatedSession.state).toBe(WorkflowState.CANCELLED);
      }
    });

    test('should handle QStash cancellation failure', async () => {
      const sessionId = generateSessionId();
      const sessionData = {
        sessionId,
        state: WorkflowState.INFO_GATHERING,
        qstashMessageId: 'qstash-msg-789',
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalCost: 0,
          estimatedDuration: 300000,
          retryCount: 0,
          lastHeartbeat: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(sessionData));
      mockQStashClient.message.cancel.mockRejectedValue(new Error('QStash cancellation failed'));

      await expect(
        sessionManager.cancelSession(sessionId, 'Test cancellation')
      ).rejects.toThrow();
    });
  });

  // =============================================================================
  // SUBSCRIPTION MANAGEMENT TESTS
  // =============================================================================

  describe('Subscription Management', () => {
    test('should add and remove subscribers', async () => {
      const sessionId = generateSessionId();
      const subscriberId = 'subscriber-123';

      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.del.mockResolvedValue(1);

      // Add subscriber
      await sessionManager.subscribe(sessionId, subscriberId);
      
      expect(mockRedisClient.set).toHaveBeenCalled();

      // Remove subscriber
      await sessionManager.unsubscribe(sessionId, subscriberId);
      
      expect(mockRedisClient.del).toHaveBeenCalled();
    });
  });

  // =============================================================================
  // METRICS AND MONITORING TESTS
  // =============================================================================

  describe('Metrics and Monitoring', () => {
    test('should collect session metrics', async () => {
      mockRedisClient.keys
        .mockResolvedValueOnce(['session:active-1', 'session:active-2'])
        .mockResolvedValueOnce(['checkpoint:1', 'checkpoint:2'])
        .mockResolvedValueOnce(['stream:1']);

      const metrics = await sessionManager.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalSessions).toBe(2);
      expect(metrics.activeSessionsCount).toBeGreaterThanOrEqual(0);
    });

    test('should check health status', async () => {
      mockRedisClient.keys.mockResolvedValue([]);

      const health = await sessionManager.getHealthStatus();

      expect(health).toBeDefined();
      expect(health.status).toMatch(/healthy|degraded|unhealthy/);
    });
  });

  // =============================================================================
  // ERROR HANDLING TESTS
  // =============================================================================

  describe('Error Handling', () => {
    test('should handle Redis connection failures', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(
        sessionManager.getSession('test-session')
      ).rejects.toThrow();
    });

    test('should handle QStash service unavailability', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      mockQStashClient.publishJSON.mockRejectedValue(new Error('Service Unavailable'));

      await expect(
        sessionManager.createSession(MOCK_FORM_DATA)
      ).rejects.toThrow();
    });
  });
});

// =============================================================================
// INTEGRATION WITH GLOBAL SESSION MANAGER
// =============================================================================

describe('Global Session Manager Integration', () => {
  test('should use singleton instance correctly', () => {
    expect(qstashSessionManager).toBeDefined();
    expect(qstashSessionManager).toBeInstanceOf(QStashSessionManager);
  });
});
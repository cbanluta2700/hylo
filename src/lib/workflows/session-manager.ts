/**
 * WorkflowSession Redis Management
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility (Web APIs only)
 * - Type-safe development with Zod validation
 * - No Node.js built-ins
 *
 * Task: T020 - Implement WorkflowSession Redis management
 */

import { Redis } from '@upstash/redis';
import { TravelFormData } from '../../types/travel-form';

/**
 * WorkflowSession interface matching data-model.md specification
 */
export interface WorkflowSession {
  id: string; // UUID for tracking
  sessionId: string; // User session identifier
  requestId: string; // Individual generation request
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currentStage: 'architect' | 'gatherer' | 'specialist' | 'formatter' | 'complete';
  progress: number; // 0-100 percentage
  completedSteps: string[];
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  formData: TravelFormData;
}

/**
 * Redis client configuration for Edge Runtime
 * Uses user's specific Upstash Redis/KV configuration
 */
const getRedisClient = (): Redis => {
  const url = process.env['KV_REST_API_URL'];
  const token = process.env['KV_REST_API_TOKEN'];

  if (!url || !token) {
    throw new Error(
      'Upstash Redis/KV credentials not configured. Check KV_REST_API_URL and KV_REST_API_TOKEN'
    );
  }

  return new Redis({
    url,
    token,
  });
};

/**
 * Session manager for AI workflow state
 */
export class WorkflowSessionManager {
  private redis: Redis;
  private readonly SESSION_TTL = 3600; // 1 hour expiration
  private readonly SESSION_PREFIX = 'workflow:session:';

  constructor() {
    this.redis = getRedisClient();
  }

  /**
   * Create new workflow session
   * Atomic operation with expiration
   */
  async createSession(
    workflowId: string,
    sessionId: string,
    formData: TravelFormData
  ): Promise<WorkflowSession> {
    console.log('📁 [SessionManager] Creating new workflow session', {
      workflowId: workflowId.substring(0, 12) + '...',
      sessionId: sessionId.substring(0, 8) + '...',
      location: formData.location,
      travelers: `${formData.adults}+${formData.children}`,
      redisUrl: process.env['KV_REST_API_URL'] ? 'configured' : 'missing',
      redisToken: process.env['KV_REST_API_TOKEN'] ? 'configured' : 'missing',
    });

    const sessionKey = `${this.SESSION_PREFIX}${workflowId}`;
    console.log('📁 [SessionManager] Using session key:', sessionKey);

    const session: WorkflowSession = {
      id: workflowId,
      sessionId,
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      currentStage: 'architect',
      progress: 0,
      completedSteps: [],
      startedAt: new Date(),
      retryCount: 0,
      formData,
    };

    const key = `${this.SESSION_PREFIX}${workflowId}`;

    console.log('💾 [SessionManager] Prepared session for Redis storage', {
      workflowId: workflowId.substring(0, 12) + '...',
      redisKey: key,
      sessionTTL: `${this.SESSION_TTL}s`,
      sessionSize: JSON.stringify(session).length,
      sessionStatus: session.status,
      sessionStage: session.currentStage,
      sessionData: {
        location: session.formData.location,
        dates: `${session.formData.departDate} to ${session.formData.returnDate}`,
        adults: session.formData.adults,
        children: session.formData.children,
      },
    });

    console.log('💾 [46] Session Manager: Prepared session for Redis storage', {
      redisKey: key,
      sessionTTL: `${this.SESSION_TTL}s`,
      sessionSize: JSON.stringify(session).length,
    });

    try {
      // Atomic set with expiration
      const setResult = await this.redis.setex(key, this.SESSION_TTL, JSON.stringify(session));
      console.log(`✅ [SessionManager] Session created and stored in Redis`, {
        workflowId: workflowId.substring(0, 12) + '...',
        redisKey: key,
        setResult,
        ttl: this.SESSION_TTL,
        timestamp: new Date().toISOString(),
      });

      // Verify the session was actually stored
      const verifyResult = await this.redis.get(key);
      console.log(`🔍 [SessionManager] Session storage verification`, {
        workflowId: workflowId.substring(0, 12) + '...',
        stored: !!verifyResult,
        dataLength: verifyResult ? (verifyResult as string).length : 0,
      });

      return session;
    } catch (error) {
      console.error(`💥 [SessionManager] Failed to create session`, {
        workflowId: workflowId.substring(0, 12) + '...',
        redisKey: key,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        redisConnected: this.redis ? 'yes' : 'no',
      });
      throw new Error('Failed to create workflow session');
    }
  }

  /**
   * Retrieve workflow session by ID
   */
  async getSession(workflowId: string): Promise<WorkflowSession | null> {
    const key = `${this.SESSION_PREFIX}${workflowId}`;

    console.log(`🔍 [SessionManager] Retrieving session`, {
      workflowId: workflowId.substring(0, 12) + '...',
      redisKey: key,
      prefix: this.SESSION_PREFIX,
      timestamp: new Date().toISOString(),
    });

    try {
      console.log(`🔍 [SessionManager] Calling Redis GET for key: ${key}`);
      const sessionData = await this.redis.get(key);

      console.log(`🔍 [SessionManager] Redis GET result`, {
        workflowId: workflowId.substring(0, 12) + '...',
        hasData: !!sessionData,
        dataType: typeof sessionData,
        dataLength: sessionData ? (sessionData as string).length : 0,
        dataPreview: sessionData ? (sessionData as string).substring(0, 100) + '...' : null,
      });

      if (!sessionData) {
        console.log(`❌ [SessionManager] No session found in Redis`, {
          workflowId: workflowId.substring(0, 12) + '...',
          redisKey: key,
          searchedPrefix: this.SESSION_PREFIX,
        });

        // Try to list keys with similar patterns to debug
        try {
          const allKeys = await this.redis.keys('workflow:*');
          console.log(`🔍 [SessionManager] Available workflow keys in Redis:`, {
            totalKeys: allKeys.length,
            keys: allKeys.slice(0, 10), // Show first 10 keys
            ourKey: key,
            keyExists: allKeys.includes(key),
          });
        } catch (keysError) {
          console.log(`⚠️ [SessionManager] Could not list Redis keys:`, keysError);
        }

        return null;
      }

      console.log(`✅ [SessionManager] Found session data, parsing JSON`);
      const session = JSON.parse(sessionData as string) as WorkflowSession;

      // Parse dates back from JSON
      session.startedAt = new Date(session.startedAt);
      if (session.completedAt) {
        session.completedAt = new Date(session.completedAt);
      }

      console.log(`✅ [SessionManager] Successfully retrieved and parsed session`, {
        workflowId: workflowId.substring(0, 12) + '...',
        sessionId: session.sessionId.substring(0, 8) + '...',
        status: session.status,
        currentStage: session.currentStage,
        progress: session.progress,
        completedSteps: session.completedSteps,
        location: session.formData?.location,
        startedAt: session.startedAt?.toISOString(),
        completedAt: session.completedAt?.toISOString(),
      });

      return session;
    } catch (error) {
      console.error(`💥 [SessionManager] Failed to get session`, {
        workflowId: workflowId.substring(0, 12) + '...',
        redisKey: key,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      });
      return null;
    }
  }

  /**
   * Update workflow session progress
   * Atomic operation with progress validation
   */
  async updateProgress(
    workflowId: string,
    updates: {
      status?: WorkflowSession['status'];
      currentStage?: WorkflowSession['currentStage'];
      progress?: number;
      completedSteps?: string[];
      errorMessage?: string;
      retryCount?: number;
    }
  ): Promise<boolean> {
    console.log(`🔄 [SessionManager] Updating session progress`, {
      workflowId: workflowId.substring(0, 12) + '...',
      updates,
      timestamp: new Date().toISOString(),
    });

    const session = await this.getSession(workflowId);

    if (!session) {
      console.error(`❌ [SessionManager] Session not found for update`, {
        workflowId: workflowId.substring(0, 12) + '...',
        searchedKey: `${this.SESSION_PREFIX}${workflowId}`,
        updateAttempted: updates,
      });
      return false;
    }

    console.log(`✅ [SessionManager] Found existing session for update`, {
      workflowId: workflowId.substring(0, 12) + '...',
      currentStatus: session.status,
      currentStage: session.currentStage,
      currentProgress: session.progress,
      newUpdates: updates,
    });

    // Validate progress value
    if (updates.progress !== undefined && (updates.progress < 0 || updates.progress > 100)) {
      console.error(`❌ [SessionManager] Invalid progress value`, {
        workflowId: workflowId.substring(0, 12) + '...',
        invalidProgress: updates.progress,
        validRange: '0-100',
      });
      return false;
    }

    // Update session with new values
    const updatedSession: WorkflowSession = {
      ...session,
      ...updates,
      ...(updates.status === 'completed' && { completedAt: new Date() }),
    };

    const key = `${this.SESSION_PREFIX}${workflowId}`;

    console.log(`💾 [SessionManager] Saving updated session to Redis`, {
      workflowId: workflowId.substring(0, 12) + '...',
      redisKey: key,
      oldStatus: session.status,
      newStatus: updatedSession.status,
      oldStage: session.currentStage,
      newStage: updatedSession.currentStage,
      oldProgress: session.progress,
      newProgress: updatedSession.progress,
      completedSteps: updatedSession.completedSteps,
      completedAt: updatedSession.completedAt?.toISOString(),
    });

    try {
      const setResult = await this.redis.setex(
        key,
        this.SESSION_TTL,
        JSON.stringify(updatedSession)
      );
      console.log(`✅ [SessionManager] Session successfully updated`, {
        workflowId: workflowId.substring(0, 12) + '...',
        stage: updatedSession.currentStage,
        progress: updatedSession.progress + '%',
        status: updatedSession.status,
        setResult,
        ttl: this.SESSION_TTL,
      });
      return true;
    } catch (error) {
      console.error(`💥 [SessionManager] Failed to update session`, {
        workflowId: workflowId.substring(0, 12) + '...',
        redisKey: key,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      return false;
    }
  }

  /**
   * Mark workflow as completed
   */
  async completeSession(workflowId: string): Promise<boolean> {
    console.log(`🎉 [SessionManager] Completing workflow session`, {
      workflowId: workflowId.substring(0, 12) + '...',
      timestamp: new Date().toISOString(),
    });

    return this.updateProgress(workflowId, {
      status: 'completed',
      currentStage: 'complete',
      progress: 100,
    });
  }

  /**
   * Mark workflow as failed with error
   */
  async failSession(workflowId: string, errorMessage: string): Promise<boolean> {
    console.log(`💥 [SessionManager] Failing workflow session`, {
      workflowId: workflowId.substring(0, 12) + '...',
      errorMessage,
      timestamp: new Date().toISOString(),
    });

    const session = await this.getSession(workflowId);

    if (!session) {
      return false;
    }

    return this.updateProgress(workflowId, {
      status: 'failed',
      errorMessage,
      retryCount: session.retryCount + 1,
    });
  }

  /**
   * Delete workflow session
   * Used for cleanup or cancellation
   */
  async deleteSession(workflowId: string): Promise<boolean> {
    const key = `${this.SESSION_PREFIX}${workflowId}`;

    try {
      const deleted = await this.redis.del(key);
      console.log(`[WorkflowSession] Deleted session ${workflowId}`);
      return deleted > 0;
    } catch (error) {
      console.error(`[WorkflowSession] Failed to delete session ${workflowId}:`, error);
      return false;
    }
  }

  /**
   * Get sessions by user session ID
   * For user dashboard/history functionality
   */
  async getSessionsByUser(sessionId: string, limit: number = 10): Promise<WorkflowSession[]> {
    try {
      // Note: This is a simplified implementation
      // In production, consider using Redis secondary indexes or separate tracking
      const keys = await this.redis.keys(`${this.SESSION_PREFIX}*`);
      const sessions: WorkflowSession[] = [];

      for (const key of keys.slice(0, limit * 2)) {
        // Get more than needed to filter
        const sessionData = await this.redis.get(key);
        if (sessionData) {
          const session = JSON.parse(sessionData as string) as WorkflowSession;
          if (session.sessionId === sessionId) {
            session.startedAt = new Date(session.startedAt);
            if (session.completedAt) {
              session.completedAt = new Date(session.completedAt);
            }
            sessions.push(session);
          }
        }

        if (sessions.length >= limit) break;
      }

      return sessions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    } catch (error) {
      console.error(`[WorkflowSession] Failed to get sessions for user ${sessionId}:`, error);
      return [];
    }
  }
}

/**
 * Singleton instance for workflow session management
 * Edge Runtime compatible
 */
export const sessionManager = new WorkflowSessionManager();

/**
 * Utility function to generate workflow ID
 * Edge Runtime compatible UUID generation
 */
export const generateWorkflowId = (): string => {
  // Use crypto.randomUUID if available (modern Edge Runtime)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback UUID generation for older runtimes
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

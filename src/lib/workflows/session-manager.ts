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
import { TravelFormData } from '../../types/travel-form.js';

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
    console.log('📁 [45] Session Manager: Creating new workflow session', {
      workflowId: workflowId.substring(0, 12) + '...',
      sessionId: sessionId.substring(0, 8) + '...',
      location: formData.location,
      travelers: `${formData.adults}+${formData.children}`,
    });

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

    console.log('💾 [46] Session Manager: Prepared session for Redis storage', {
      redisKey: key,
      sessionTTL: `${this.SESSION_TTL}s`,
      sessionSize: JSON.stringify(session).length,
    });

    try {
      // Atomic set with expiration
      await this.redis.setex(key, this.SESSION_TTL, JSON.stringify(session));
      console.log(`✅ [47] Session Manager: Session created and stored`, {
        workflowId: workflowId.substring(0, 12) + '...',
        redisKey: key,
      });
      return session;
    } catch (error) {
      console.error(`💥 [48] Session Manager: Failed to create session`, {
        workflowId: workflowId.substring(0, 12) + '...',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to create workflow session');
    }
  }

  /**
   * Retrieve workflow session by ID
   */
  async getSession(workflowId: string): Promise<WorkflowSession | null> {
    const key = `${this.SESSION_PREFIX}${workflowId}`;

    try {
      const sessionData = await this.redis.get(key);

      if (!sessionData) {
        return null;
      }

      const session = JSON.parse(sessionData as string) as WorkflowSession;
      // Parse dates back from JSON
      session.startedAt = new Date(session.startedAt);
      if (session.completedAt) {
        session.completedAt = new Date(session.completedAt);
      }

      return session;
    } catch (error) {
      console.error(`[WorkflowSession] Failed to get session ${workflowId}:`, error);
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
    const session = await this.getSession(workflowId);

    if (!session) {
      console.error(`[WorkflowSession] Session ${workflowId} not found for update`);
      return false;
    }

    // Validate progress value
    if (updates.progress !== undefined && (updates.progress < 0 || updates.progress > 100)) {
      console.error(`[WorkflowSession] Invalid progress value: ${updates.progress}`);
      return false;
    }

    // Update session with new values
    const updatedSession: WorkflowSession = {
      ...session,
      ...updates,
      ...(updates.status === 'completed' && { completedAt: new Date() }),
    };

    const key = `${this.SESSION_PREFIX}${workflowId}`;

    try {
      await this.redis.setex(key, this.SESSION_TTL, JSON.stringify(updatedSession));
      console.log(
        `[WorkflowSession] Updated session ${workflowId} - Stage: ${updatedSession.currentStage}, Progress: ${updatedSession.progress}%`
      );
      return true;
    } catch (error) {
      console.error(`[WorkflowSession] Failed to update session ${workflowId}:`, error);
      return false;
    }
  }

  /**
   * Mark workflow as completed
   */
  async completeSession(workflowId: string): Promise<boolean> {
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

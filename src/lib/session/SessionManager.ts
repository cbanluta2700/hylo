/**
 * Session Manager for AI Workflow (T020)
 *
 * CONSTITUTIONAL COMPLIANCE:
 * - Principle I: Edge Runtime compatible (Redis via HTTP REST API)
 * - Principle V: Type-safe development with strict TypeScript
 *
 * Manages workflow session state using Upstash Redis for Edge Runtime compatibility
 */

import { Redis } from '@upstash/redis';
import { config } from '../config/env';

// Initialize Redis client with Edge Runtime compatibility
const redis = new Redis({
  url: config.redis.url,
  token: config.redis.token,
});

/**
 * Workflow Session Data Structure
 * Constitutional requirement: Type-safe development
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
  formData: any; // Will be properly typed when imported

  // Performance tracking
  stageTimings: Record<string, number>;
  totalProcessingTime?: number;

  // AI agent outputs for debugging
  agentOutputs: {
    architect?: any;
    gatherer?: any;
    specialist?: any;
    formatter?: any;
  };
}

/**
 * Session Manager Class
 * Constitutional requirement: Edge Runtime compatible operations
 */
export class SessionManager {
  private static readonly SESSION_PREFIX = 'workflow:session:';
  private static readonly TTL_SECONDS = 3600; // 1 hour expiration

  /**
   * Create a new workflow session
   */
  static async createSession(data: {
    sessionId: string;
    requestId: string;
    formData: any;
  }): Promise<WorkflowSession> {
    console.log('💾 [DEBUG-115] SessionManager creating new session', {
      sessionId: data.sessionId,
      requestId: data.requestId,
      hasFormData: !!data.formData,
      formDataLocation: data.formData?.location,
    });

    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🆔 [DEBUG-116] Generated workflow ID', { workflowId });

    const session: WorkflowSession = {
      id: workflowId,
      sessionId: data.sessionId,
      requestId: data.requestId,
      status: 'pending',
      currentStage: 'architect',
      progress: 0,
      completedSteps: [],
      startedAt: new Date(),
      retryCount: 0,
      formData: data.formData,
      stageTimings: {},
      agentOutputs: {},
    };

    const key = this.getSessionKey(workflowId);
    console.log('🔑 [DEBUG-117] Storing session in Redis', { key, ttlSeconds: this.TTL_SECONDS });

    // Store with TTL for automatic cleanup
    await redis.setex(key, this.TTL_SECONDS, JSON.stringify(session));
    console.log('✅ [DEBUG-118] Session stored successfully');

    return session;
  }

  /**
   * Get workflow session by ID
   */
  static async getSession(workflowId: string): Promise<WorkflowSession | null> {
    console.log('🔍 [DEBUG-119] SessionManager retrieving session', { workflowId });

    const key = this.getSessionKey(workflowId);
    const data = await redis.get(key);

    if (!data) {
      console.log('❌ [DEBUG-120] Session not found', { workflowId, key });
      return null;
    }

    console.log('✅ [DEBUG-121] Session retrieved successfully', {
      workflowId,
      hasData: !!data,
      dataType: typeof data,
    });

    try {
      const session = JSON.parse(data as string) as WorkflowSession;
      // Convert date strings back to Date objects
      session.startedAt = new Date(session.startedAt);
      if (session.completedAt) {
        session.completedAt = new Date(session.completedAt);
      }
      return session;
    } catch (error) {
      console.error('Failed to parse session data:', error);
      return null;
    }
  }

  /**
   * Update workflow session
   */
  static async updateSession(workflowId: string, updates: Partial<WorkflowSession>): Promise<void> {
    const session = await this.getSession(workflowId);
    if (!session) {
      throw new Error(`Session ${workflowId} not found`);
    }

    const updatedSession = {
      ...session,
      ...updates,
    };

    const key = this.getSessionKey(workflowId);
    await redis.setex(key, this.TTL_SECONDS, JSON.stringify(updatedSession));
  }

  /**
   * Update session progress and stage
   */
  static async updateProgress(
    workflowId: string,
    stage: WorkflowSession['currentStage'],
    progress: number,
    completedStep?: string
  ): Promise<void> {
    const session = await this.getSession(workflowId);
    if (!session) {
      throw new Error(`Session ${workflowId} not found`);
    }

    const updates: Partial<WorkflowSession> = {
      currentStage: stage,
      progress,
      status: progress === 100 ? 'completed' : 'processing',
    };

    if (completedStep) {
      updates.completedSteps = [...session.completedSteps, completedStep];
    }

    if (progress === 100) {
      updates.completedAt = new Date();
      updates.totalProcessingTime = Date.now() - session.startedAt.getTime();
    }

    await this.updateSession(workflowId, updates);
  }

  /**
   * Store agent output for debugging and chaining
   */
  static async storeAgentOutput(
    workflowId: string,
    agentType: 'architect' | 'gatherer' | 'specialist' | 'formatter',
    output: any,
    processingTime: number
  ): Promise<void> {
    const session = await this.getSession(workflowId);
    if (!session) {
      throw new Error(`Session ${workflowId} not found`);
    }

    const updates: Partial<WorkflowSession> = {
      agentOutputs: {
        ...session.agentOutputs,
        [agentType]: output,
      },
      stageTimings: {
        ...session.stageTimings,
        [agentType]: processingTime,
      },
    };

    await this.updateSession(workflowId, updates);
  }

  /**
   * Mark session as failed with error details
   */
  static async failSession(
    workflowId: string,
    error: {
      code: string;
      message: string;
      stage: string;
      details?: any;
    }
  ): Promise<void> {
    const session = await this.getSession(workflowId);
    if (!session) {
      throw new Error(`Session ${workflowId} not found`);
    }

    const updates: Partial<WorkflowSession> = {
      status: 'failed',
      errorMessage: `${error.code}: ${error.message}`,
      completedAt: new Date(),
      retryCount: session.retryCount + 1,
    };

    await this.updateSession(workflowId, updates);
  }

  /**
   * Clean up expired sessions (for maintenance)
   */
  static async cleanupExpiredSessions(): Promise<number> {
    // Redis TTL handles automatic cleanup, but this method can be used
    // for additional cleanup logic if needed
    try {
      const pattern = `${this.SESSION_PREFIX}*`;
      const keys = await redis.keys(pattern);

      let cleanedCount = 0;
      for (const key of keys) {
        const ttl = await redis.ttl(key);
        if (ttl <= 0) {
          await redis.del(key);
          cleanedCount++;
        }
      }

      return cleanedCount;
    } catch (error) {
      console.error('Session cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Get session statistics for monitoring
   */
  static async getSessionStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    try {
      const pattern = `${this.SESSION_PREFIX}*`;
      const keys = await redis.keys(pattern);

      const stats = {
        total: keys.length,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      };

      for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
          const session = JSON.parse(data as string) as WorkflowSession;
          stats[session.status]++;
        }
      }

      return stats;
    } catch (error) {
      console.error('Failed to get session stats:', error);
      return {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      };
    }
  }

  /**
   * Private helper to generate consistent session keys
   */
  private static getSessionKey(workflowId: string): string {
    return `${this.SESSION_PREFIX}${workflowId}`;
  }
}

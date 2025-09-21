/**
 * Workflow State Management
 * Redis-based state management for workflow persistence and recovery
 */

import { Redis } from '@upstash/redis';
import { config } from '../env';
import { WorkflowState, WorkflowError } from './inngest-config';
import { generateId } from '../smart-queries';

/**
 * Redis Configuration
 */
const redis = new Redis({
  url: config.upstash.redis.url,
  token: config.upstash.redis.token,
});

/**
 * State Management Configuration
 */
export const STATE_CONFIG = {
  // TTL settings (in seconds)
  WORKFLOW_TTL: 24 * 60 * 60, // 24 hours
  SESSION_TTL: 7 * 24 * 60 * 60, // 7 days
  CACHE_TTL: 60 * 60, // 1 hour

  // Key prefixes
  WORKFLOW_PREFIX: 'workflow:',
  SESSION_PREFIX: 'session:',
  CACHE_PREFIX: 'cache:',

  // Batch sizes
  MAX_BATCH_SIZE: 100,
  CLEANUP_BATCH_SIZE: 50,

  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,

  // Monitoring
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
} as const;

/**
 * Workflow State Manager
 * Handles persistence, retrieval, and management of workflow states
 */
export class WorkflowStateManager {
  private redis: Redis;

  constructor(redisInstance?: Redis) {
    this.redis = redisInstance || redis;
  }

  /**
   * Create a new workflow state
   */
  async createWorkflowState(
    sessionId: string,
    requestId: string,
    workflowType: string,
    initialData: any = {}
  ): Promise<WorkflowState> {
    const workflowId = generateId();
    const now = new Date().toISOString();

    const workflowState: WorkflowState = {
      workflowId,
      sessionId,
      status: 'pending',
      completedSteps: [],
      failedSteps: [],
      progress: 0,
      startedAt: now,
      updatedAt: now,
      errors: [],
      metadata: {
        workflowType,
        requestId,
        initialData,
        version: '1.0.0',
      },
    };

    await this.saveWorkflowState(workflowState);
    return workflowState;
  }

  /**
   * Get workflow state by ID
   */
  async getWorkflowState(workflowId: string): Promise<WorkflowState | null> {
    try {
      const key = this.getWorkflowKey(workflowId);
      const data = await this.redis.get(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data as string);
    } catch (error) {
      console.error('Error retrieving workflow state:', error);
      return null;
    }
  }

  /**
   * Get workflow state by session ID
   */
  async getWorkflowStateBySession(sessionId: string): Promise<WorkflowState | null> {
    try {
      const key = this.getSessionWorkflowKey(sessionId);
      const workflowId = await this.redis.get(key);

      if (!workflowId) {
        return null;
      }

      return this.getWorkflowState(workflowId as string);
    } catch (error) {
      console.error('Error retrieving workflow state by session:', error);
      return null;
    }
  }

  /**
   * Update workflow state
   */
  async updateWorkflowState(
    workflowId: string,
    updates: Partial<WorkflowState>
  ): Promise<WorkflowState | null> {
    try {
      const currentState = await this.getWorkflowState(workflowId);
      if (!currentState) {
        return null;
      }

      const updatedState: WorkflowState = {
        ...currentState,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await this.saveWorkflowState(updatedState);
      return updatedState;
    } catch (error) {
      console.error('Error updating workflow state:', error);
      return null;
    }
  }

  /**
   * Update workflow progress
   */
  async updateWorkflowProgress(
    workflowId: string,
    progress: number,
    currentStep?: string,
    completedSteps?: string[]
  ): Promise<boolean> {
    try {
      const updates: Partial<WorkflowState> = {
        progress: Math.min(100, Math.max(0, progress)),
        updatedAt: new Date().toISOString(),
      };

      if (currentStep) {
        updates.currentStep = currentStep;
      }

      if (completedSteps) {
        updates.completedSteps = completedSteps;
      }

      const result = await this.updateWorkflowState(workflowId, updates);
      return result !== null;
    } catch (error) {
      console.error('Error updating workflow progress:', error);
      return false;
    }
  }

  /**
   * Add error to workflow state
   */
  async addWorkflowError(
    workflowId: string,
    error: Omit<WorkflowError, 'timestamp'>
  ): Promise<boolean> {
    try {
      const currentState = await this.getWorkflowState(workflowId);
      if (!currentState) {
        return false;
      }

      const workflowError: WorkflowError = {
        ...error,
        timestamp: new Date().toISOString(),
      };

      const updatedErrors = [...currentState.errors, workflowError];

      await this.updateWorkflowState(workflowId, {
        errors: updatedErrors,
        status: error.recoverable ? currentState.status : 'failed',
      });

      return true;
    } catch (err) {
      console.error('Error adding workflow error:', err);
      return false;
    }
  }

  /**
   * Mark workflow as completed
   */
  async completeWorkflow(workflowId: string, result?: any): Promise<boolean> {
    try {
      const updates: Partial<WorkflowState> = {
        status: 'completed',
        progress: 100,
        updatedAt: new Date().toISOString(),
      };

      if (result) {
        updates.metadata = {
          ...((await this.getWorkflowState(workflowId))?.metadata || {}),
          result,
        };
      }

      const updatedState = await this.updateWorkflowState(workflowId, updates);
      return updatedState !== null;
    } catch (error) {
      console.error('Error completing workflow:', error);
      return false;
    }
  }

  /**
   * Mark workflow as failed
   */
  async failWorkflow(workflowId: string, error?: string): Promise<boolean> {
    try {
      const updates: Partial<WorkflowState> = {
        status: 'failed',
        updatedAt: new Date().toISOString(),
      };

      if (error) {
        updates.metadata = {
          ...((await this.getWorkflowState(workflowId))?.metadata || {}),
          failureReason: error,
        };
      }

      const updatedState = await this.updateWorkflowState(workflowId, updates);
      return updatedState !== null;
    } catch (err) {
      console.error('Error failing workflow:', err);
      return false;
    }
  }

  /**
   * Cancel workflow
   */
  async cancelWorkflow(workflowId: string): Promise<boolean> {
    try {
      const updates: Partial<WorkflowState> = {
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      };

      const updatedState = await this.updateWorkflowState(workflowId, updates);
      return updatedState !== null;
    } catch (error) {
      console.error('Error cancelling workflow:', error);
      return false;
    }
  }

  /**
   * Get all workflows for a session
   */
  async getSessionWorkflows(sessionId: string): Promise<WorkflowState[]> {
    try {
      const pattern = `${this.getWorkflowKey('*')}`;
      const keys = await this.redis.keys(pattern);

      const workflows: WorkflowState[] = [];
      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const workflow = JSON.parse(data as string);
          if (workflow.sessionId === sessionId) {
            workflows.push(workflow);
          }
        }
      }

      return workflows.sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
    } catch (error) {
      console.error('Error retrieving session workflows:', error);
      return [];
    }
  }

  /**
   * Clean up expired workflows
   */
  async cleanupExpiredWorkflows(): Promise<number> {
    try {
      const pattern = `${this.getWorkflowKey('*')}`;
      const keys = await this.redis.keys(pattern);
      let cleanedCount = 0;

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const workflow = JSON.parse(data as string);
          const age = Date.now() - new Date(workflow.startedAt).getTime();
          const maxAge = STATE_CONFIG.WORKFLOW_TTL * 1000;

          if (age > maxAge) {
            await this.redis.del(key);
            cleanedCount++;
          }
        }
      }

      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up expired workflows:', error);
      return 0;
    }
  }

  /**
   * Cache data with TTL
   */
  async setCache(key: string, data: any, ttl: number = STATE_CONFIG.CACHE_TTL): Promise<boolean> {
    try {
      const cacheKey = this.getCacheKey(key);
      const serializedData = JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
      });

      await this.redis.setex(cacheKey, ttl, serializedData);
      return true;
    } catch (error) {
      console.error('Error setting cache:', error);
      return false;
    }
  }

  /**
   * Get cached data
   */
  async getCache<T = any>(key: string): Promise<T | null> {
    try {
      const cacheKey = this.getCacheKey(key);
      const data = await this.redis.get(cacheKey);

      if (!data) {
        return null;
      }

      const parsed = JSON.parse(data as string);
      return parsed.data;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }

  /**
   * Delete cached data
   */
  async deleteCache(key: string): Promise<boolean> {
    try {
      const cacheKey = this.getCacheKey(key);
      await this.redis.del(cacheKey);
      return true;
    } catch (error) {
      console.error('Error deleting cache:', error);
      return false;
    }
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency?: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      await this.redis.ping();
      const latency = Date.now() - startTime;

      return {
        status: 'healthy',
        latency,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStats(): Promise<{
    totalWorkflows: number;
    activeWorkflows: number;
    completedWorkflows: number;
    failedWorkflows: number;
    averageCompletionTime: number;
  }> {
    try {
      const pattern = `${this.getWorkflowKey('*')}`;
      const keys = await this.redis.keys(pattern);

      let totalWorkflows = 0;
      let activeWorkflows = 0;
      let completedWorkflows = 0;
      let failedWorkflows = 0;
      let totalCompletionTime = 0;
      let completedCount = 0;

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const workflow = JSON.parse(data as string);
          totalWorkflows++;

          switch (workflow.status) {
            case 'running':
            case 'pending':
              activeWorkflows++;
              break;
            case 'completed':
              completedWorkflows++;
              if (workflow.startedAt && workflow.updatedAt) {
                const completionTime =
                  new Date(workflow.updatedAt).getTime() - new Date(workflow.startedAt).getTime();
                totalCompletionTime += completionTime;
                completedCount++;
              }
              break;
            case 'failed':
            case 'cancelled':
              failedWorkflows++;
              break;
          }
        }
      }

      const averageCompletionTime = completedCount > 0 ? totalCompletionTime / completedCount : 0;

      return {
        totalWorkflows,
        activeWorkflows,
        completedWorkflows,
        failedWorkflows,
        averageCompletionTime,
      };
    } catch (error) {
      console.error('Error getting workflow stats:', error);
      return {
        totalWorkflows: 0,
        activeWorkflows: 0,
        completedWorkflows: 0,
        failedWorkflows: 0,
        averageCompletionTime: 0,
      };
    }
  }

  /**
   * Private helper methods
   */

  private async saveWorkflowState(workflowState: WorkflowState): Promise<void> {
    try {
      const key = this.getWorkflowKey(workflowState.workflowId);
      const sessionKey = this.getSessionWorkflowKey(workflowState.sessionId);

      // Save workflow state
      await this.redis.setex(key, STATE_CONFIG.WORKFLOW_TTL, JSON.stringify(workflowState));

      // Save session -> workflow mapping
      await this.redis.setex(sessionKey, STATE_CONFIG.SESSION_TTL, workflowState.workflowId);
    } catch (error) {
      console.error('Error saving workflow state:', error);
      throw error;
    }
  }

  private getWorkflowKey(workflowId: string): string {
    return `${STATE_CONFIG.WORKFLOW_PREFIX}${workflowId}`;
  }

  private getSessionWorkflowKey(sessionId: string): string {
    return `${STATE_CONFIG.SESSION_PREFIX}${sessionId}:workflow`;
  }

  private getCacheKey(key: string): string {
    return `${STATE_CONFIG.CACHE_PREFIX}${key}`;
  }
}

/**
 * Singleton instance
 */
export const workflowStateManager = new WorkflowStateManager();

/**
 * Factory function for creating state managers
 */
export function createWorkflowStateManager(redisInstance?: Redis): WorkflowStateManager {
  return new WorkflowStateManager(redisInstance);
}

/**
 * Utility functions
 */

/**
 * Generate workflow ID with type prefix
 */
export function generateWorkflowId(type: string, sessionId: string): string {
  return `${type}_${generateId()}_${sessionId}`;
}

/**
 * Calculate workflow progress based on completed steps
 */
export function calculateWorkflowProgress(completedSteps: string[], totalSteps: number): number {
  if (totalSteps === 0) return 100;
  return Math.round((completedSteps.length / totalSteps) * 100);
}

/**
 * Estimate completion time based on current progress
 */
export function estimateCompletionTime(
  startedAt: string,
  currentProgress: number
): string | undefined {
  if (currentProgress <= 0) return undefined;

  const elapsed = Date.now() - new Date(startedAt).getTime();
  const estimatedTotal = elapsed / (currentProgress / 100);
  const remaining = estimatedTotal - elapsed;

  return new Date(Date.now() + remaining).toISOString();
}

/**
 * Check if workflow is expired
 */
export function isWorkflowExpired(
  startedAt: string,
  ttlSeconds: number = STATE_CONFIG.WORKFLOW_TTL
): boolean {
  const age = Date.now() - new Date(startedAt).getTime();
  return age > ttlSeconds * 1000;
}

/**
 * Export types
 */
export type { WorkflowState, WorkflowError };

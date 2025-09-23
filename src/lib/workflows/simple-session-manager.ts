/**
 * Simplified In-Memory Session Manager
 * Removes Redis dependency while maintaining session interface
 * Constitutional Requirements:
 * - Edge Runtime compatibility (Web APIs only)
 * - Type-safe development
 * - No Node.js built-ins
 */

import type { TravelFormData } from '../../types/travel-form.js';

/**
 * WorkflowSession interface matching data-model.md specification
 */
export interface WorkflowSession {
  id: string;
  sessionId: string;
  requestId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  currentStage: 'architect' | 'gatherer' | 'specialist' | 'formatter' | 'complete';
  progress: number;
  completedSteps: string[];
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  formData: TravelFormData;
  itineraryResult?: any;
}

/**
 * In-memory session storage (per Edge Runtime instance)
 * Sessions will persist for the lifetime of the Edge Runtime instance
 */
const sessionStore = new Map<string, WorkflowSession>();

/**
 * Simplified session manager without Redis dependency
 */
export class SimpleSessionManager {
  private readonly SESSION_PREFIX = 'workflow:session:';

  /**
   * Create new workflow session
   * Stores in memory only
   */
  async createSession(
    workflowId: string,
    sessionId: string,
    formData: TravelFormData
  ): Promise<WorkflowSession> {
    console.log('📁 [SimpleSessionManager] Creating new workflow session', {
      workflowId: workflowId.substring(0, 12) + '...',
      sessionId: sessionId.substring(0, 8) + '...',
      location: formData.location,
      travelers: `${formData.adults}+${formData.children}`,
      storage: 'in-memory',
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

    // Store in memory
    sessionStore.set(workflowId, session);

    console.log('✅ [SimpleSessionManager] Session created in memory', {
      workflowId: workflowId.substring(0, 12) + '...',
      status: session.status,
      stage: session.currentStage,
      timestamp: new Date().toISOString(),
      totalSessions: sessionStore.size,
    });

    return session;
  }

  /**
   * Retrieve workflow session by ID
   */
  async getSession(workflowId: string): Promise<WorkflowSession | null> {
    console.log(`🔍 [SimpleSessionManager] Retrieving session`, {
      workflowId: workflowId.substring(0, 12) + '...',
      storage: 'in-memory',
      timestamp: new Date().toISOString(),
    });

    const session = sessionStore.get(workflowId);

    if (!session) {
      console.log(`❌ [SimpleSessionManager] No session found`, {
        workflowId: workflowId.substring(0, 12) + '...',
        availableSessions: sessionStore.size,
        allKeys: Array.from(sessionStore.keys()).map((key) => key.substring(0, 12) + '...'),
      });
      return null;
    }

    console.log(`✅ [SimpleSessionManager] Successfully retrieved session`, {
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
  }

  /**
   * Update workflow session progress
   * In-memory update only
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
      itineraryResult?: any;
    }
  ): Promise<boolean> {
    const session = sessionStore.get(workflowId);

    if (!session) {
      console.error(`❌ [SimpleSessionManager] Cannot update - session not found`, {
        workflowId: workflowId.substring(0, 12) + '...',
      });
      return false;
    }

    // Apply updates
    const updatedSession = {
      ...session,
      ...updates,
      ...(updates.status === 'completed' && { completedAt: new Date() }),
    };

    sessionStore.set(workflowId, updatedSession);

    console.log('✅ [SimpleSessionManager] Session successfully updated', {
      workflowId: workflowId.substring(0, 12) + '...',
      oldStatus: session.status,
      newStatus: updatedSession.status,
      oldStage: session.currentStage,
      newStage: updatedSession.currentStage,
      oldProgress: session.progress,
      newProgress: updatedSession.progress,
      completedSteps: updatedSession.completedSteps,
      completedAt: updatedSession.completedAt?.toISOString(),
    });

    return true;
  }

  /**
   * Mark workflow as completed
   */
  async completeSession(workflowId: string, itineraryResult?: any): Promise<boolean> {
    return await this.updateProgress(workflowId, {
      status: 'completed',
      currentStage: 'complete',
      progress: 100,
      itineraryResult,
    });
  }

  /**
   * Mark workflow as failed with error
   */
  async failSession(workflowId: string, errorMessage: string): Promise<boolean> {
    const session = sessionStore.get(workflowId);
    if (!session) {
      return false;
    }

    return await this.updateProgress(workflowId, {
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
    const deleted = sessionStore.delete(workflowId);
    if (deleted) {
      console.log(`✅ [SimpleSessionManager] Deleted session ${workflowId.substring(0, 12)}...`);
    }
    return deleted;
  }

  /**
   * Get sessions by user session ID
   * For user dashboard/history functionality
   */
  async getSessionsByUser(sessionId: string, limit: number = 10): Promise<WorkflowSession[]> {
    const sessions = Array.from(sessionStore.values())
      .filter((session) => session.sessionId === sessionId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);

    return sessions;
  }

  /**
   * Get current memory stats (helpful for debugging)
   */
  getStats() {
    return {
      totalSessions: sessionStore.size,
      sessionKeys: Array.from(sessionStore.keys()).map((key) => key.substring(0, 12) + '...'),
      memoryUsage: process.memoryUsage ? process.memoryUsage() : 'not-available',
    };
  }

  /**
   * Clean up old sessions (optional maintenance)
   */
  async cleanup(maxAge: number = 3600000): Promise<number> {
    // 1 hour default
    const now = Date.now();
    let cleaned = 0;

    for (const [workflowId, session] of sessionStore.entries()) {
      const age = now - session.startedAt.getTime();
      if (age > maxAge && (session.status === 'completed' || session.status === 'failed')) {
        sessionStore.delete(workflowId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 [SimpleSessionManager] Cleaned up ${cleaned} old sessions`);
    }

    return cleaned;
  }
}

/**
 * Singleton instance for workflow session management
 * Edge Runtime compatible
 */
export const simpleSessionManager = new SimpleSessionManager();

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

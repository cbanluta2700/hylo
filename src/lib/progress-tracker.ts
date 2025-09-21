/**
 * Progress Tracking and Updates
 * Real-time progress tracking for itinerary generation workflows
 */

import { connectionManager } from '../../api/itinerary/live';
import { workflowStateManager } from './workflows/state-manager';

/**
 * Progress tracking configuration
 */
export const PROGRESS_CONFIG = {
  // Progress weights for different workflow stages
  WEIGHTS: {
    smartQueries: 5,
    architect: 20,
    gatherer: 30,
    specialist: 30,
    putter: 10,
    synthesis: 5,
  },

  // Update intervals (in milliseconds)
  UPDATE_INTERVAL: 1000, // 1 second
  HEARTBEAT_INTERVAL: 5000, // 5 seconds

  // Progress thresholds for notifications
  NOTIFICATION_THRESHOLDS: [10, 25, 50, 75, 90, 100],

  // Timeout settings
  PROGRESS_TIMEOUT: 300000, // 5 minutes
  STALE_THRESHOLD: 30000, // 30 seconds
} as const;

/**
 * Progress update types
 */
export enum ProgressUpdateType {
  WORKFLOW_STARTED = 'workflow_started',
  STEP_STARTED = 'step_started',
  STEP_COMPLETED = 'step_completed',
  AGENT_STARTED = 'agent_started',
  AGENT_COMPLETED = 'agent_completed',
  PROGRESS_UPDATE = 'progress_update',
  WORKFLOW_COMPLETED = 'workflow_completed',
  WORKFLOW_FAILED = 'workflow_failed',
  ERROR_OCCURRED = 'error_occurred',
}

/**
 * Progress update interface
 */
export interface ProgressUpdate {
  type: ProgressUpdateType;
  sessionId: string;
  workflowId: string;
  timestamp: string;
  data: {
    progress: number;
    currentStep?: string | undefined;
    message?: string | undefined;
    estimatedTimeRemaining?: number | undefined;
    agentType?: string | undefined;
    stepName?: string | undefined;
    error?: string | undefined;
    metadata?: Record<string, any> | undefined;
  };
}

/**
 * Progress tracker state
 */
interface ProgressTrackerState {
  sessionId: string;
  workflowId: string;
  startTime: Date;
  lastUpdate: Date;
  currentProgress: number;
  currentStep?: string;
  stepsCompleted: Set<string>;
  agentsActive: Set<string>;
  errors: Array<{ timestamp: Date; error: string; step?: string }>;
  metadata: Record<string, any>;
}

/**
 * Progress Tracker
 * Tracks and broadcasts real-time progress updates for itinerary generation
 */
export class ProgressTracker {
  private trackers: Map<string, ProgressTrackerState> = new Map();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Start tracking progress for a workflow
   */
  startTracking(
    sessionId: string,
    workflowId: string,
    initialMetadata: Record<string, any> = {}
  ): void {
    const state: ProgressTrackerState = {
      sessionId,
      workflowId,
      startTime: new Date(),
      lastUpdate: new Date(),
      currentProgress: 0,
      stepsCompleted: new Set(),
      agentsActive: new Set(),
      errors: [],
      metadata: initialMetadata,
    };

    this.trackers.set(workflowId, state);

    // Start periodic progress updates
    this.startProgressUpdates(workflowId);

    // Start heartbeat monitoring
    this.startHeartbeat(workflowId);

    // Send initial progress update
    this.sendProgressUpdate(workflowId, {
      type: ProgressUpdateType.WORKFLOW_STARTED,
      sessionId,
      workflowId,
      timestamp: new Date().toISOString(),
      data: {
        progress: 0,
        message: 'Starting itinerary generation...',
        metadata: initialMetadata,
      },
    });

    console.log(`Started progress tracking for workflow ${workflowId} in session ${sessionId}`);
  }

  /**
   * Update progress for a workflow step
   */
  updateStepProgress(
    workflowId: string,
    stepName: string,
    progress: number,
    message?: string,
    metadata?: Record<string, any>
  ): void {
    const state = this.trackers.get(workflowId);
    if (!state) return;

    state.lastUpdate = new Date();
    state.currentStep = stepName;

    // Calculate weighted progress
    const stepWeight =
      PROGRESS_CONFIG.WEIGHTS[stepName as keyof typeof PROGRESS_CONFIG.WEIGHTS] || 0;
    const previousStepsWeight = this.calculatePreviousStepsWeight(stepName);
    const stepProgress = (progress / 100) * stepWeight;
    state.currentProgress = Math.min(100, previousStepsWeight + stepProgress);

    // Send progress update
    this.sendProgressUpdate(workflowId, {
      type: ProgressUpdateType.STEP_STARTED,
      sessionId: state.sessionId,
      workflowId,
      timestamp: new Date().toISOString(),
      data: {
        progress: state.currentProgress,
        currentStep: stepName,
        message: message || `Processing ${stepName}...`,
        estimatedTimeRemaining: this.estimateTimeRemaining(state),
        metadata,
      },
    });

    // Check for notification thresholds
    this.checkNotificationThresholds(workflowId, state.currentProgress);
  }

  /**
   * Mark a step as completed
   */
  completeStep(
    workflowId: string,
    stepName: string,
    message?: string,
    metadata?: Record<string, any>
  ): void {
    const state = this.trackers.get(workflowId);
    if (!state) return;

    state.stepsCompleted.add(stepName);
    state.lastUpdate = new Date();

    // Calculate progress after step completion
    const stepWeight =
      PROGRESS_CONFIG.WEIGHTS[stepName as keyof typeof PROGRESS_CONFIG.WEIGHTS] || 0;
    const previousStepsWeight = this.calculatePreviousStepsWeight(stepName);
    state.currentProgress = Math.min(100, previousStepsWeight + stepWeight);

    // Send completion update
    this.sendProgressUpdate(workflowId, {
      type: ProgressUpdateType.STEP_COMPLETED,
      sessionId: state.sessionId,
      workflowId,
      timestamp: new Date().toISOString(),
      data: {
        progress: state.currentProgress,
        currentStep: stepName,
        message: message || `Completed ${stepName}`,
        estimatedTimeRemaining: this.estimateTimeRemaining(state),
        stepName,
        metadata,
      },
    });

    console.log(
      `Completed step ${stepName} for workflow ${workflowId}, progress: ${state.currentProgress}%`
    );
  }

  /**
   * Update agent progress
   */
  updateAgentProgress(
    workflowId: string,
    agentType: string,
    status: 'started' | 'running' | 'completed' | 'failed',
    progress?: number,
    message?: string,
    metadata?: Record<string, any>
  ): void {
    const state = this.trackers.get(workflowId);
    if (!state) return;

    state.lastUpdate = new Date();

    if (status === 'started') {
      state.agentsActive.add(agentType);
    } else if (status === 'completed' || status === 'failed') {
      state.agentsActive.delete(agentType);
    }

    const updateType =
      status === 'started'
        ? ProgressUpdateType.AGENT_STARTED
        : status === 'completed'
        ? ProgressUpdateType.AGENT_COMPLETED
        : ProgressUpdateType.PROGRESS_UPDATE;

    this.sendProgressUpdate(workflowId, {
      type: updateType,
      sessionId: state.sessionId,
      workflowId,
      timestamp: new Date().toISOString(),
      data: {
        progress: progress || state.currentProgress,
        currentStep: state.currentStep,
        message: message || `${agentType} agent ${status}`,
        agentType,
        estimatedTimeRemaining: this.estimateTimeRemaining(state),
        metadata,
      },
    });
  }

  /**
   * Report an error
   */
  reportError(
    workflowId: string,
    error: string,
    step?: string,
    metadata?: Record<string, any>
  ): void {
    const state = this.trackers.get(workflowId);
    if (!state) return;

    const errorEntry = {
      timestamp: new Date(),
      error,
      step,
    };

    state.errors.push(errorEntry);
    state.lastUpdate = new Date();

    // Send error notification
    this.sendProgressUpdate(workflowId, {
      type: ProgressUpdateType.ERROR_OCCURRED,
      sessionId: state.sessionId,
      workflowId,
      timestamp: new Date().toISOString(),
      data: {
        progress: state.currentProgress,
        currentStep: state.currentStep,
        message: `Error: ${error}`,
        error,
        stepName: step,
        estimatedTimeRemaining: this.estimateTimeRemaining(state),
        metadata,
      },
    });

    console.error(`Error in workflow ${workflowId}: ${error}`);
  }

  /**
   * Complete workflow tracking
   */
  completeTracking(workflowId: string, finalResult?: any, metadata?: Record<string, any>): void {
    const state = this.trackers.get(workflowId);
    if (!state) return;

    state.currentProgress = 100;
    state.lastUpdate = new Date();

    // Send completion notification
    this.sendProgressUpdate(workflowId, {
      type: ProgressUpdateType.WORKFLOW_COMPLETED,
      sessionId: state.sessionId,
      workflowId,
      timestamp: new Date().toISOString(),
      data: {
        progress: 100,
        message: 'Itinerary generation completed successfully!',
        estimatedTimeRemaining: 0,
        metadata: {
          ...metadata,
          totalTime: Date.now() - state.startTime.getTime(),
          errors: state.errors.length,
          finalResult,
        },
      },
    });

    // Clean up tracking
    this.stopTracking(workflowId);

    console.log(
      `Completed tracking for workflow ${workflowId}, total time: ${
        Date.now() - state.startTime.getTime()
      }ms`
    );
  }

  /**
   * Fail workflow tracking
   */
  failTracking(workflowId: string, error: string, metadata?: Record<string, any>): void {
    const state = this.trackers.get(workflowId);
    if (!state) return;

    state.lastUpdate = new Date();

    // Send failure notification
    this.sendProgressUpdate(workflowId, {
      type: ProgressUpdateType.WORKFLOW_FAILED,
      sessionId: state.sessionId,
      workflowId,
      timestamp: new Date().toISOString(),
      data: {
        progress: state.currentProgress,
        message: `Workflow failed: ${error}`,
        error,
        estimatedTimeRemaining: undefined,
        metadata: {
          ...metadata,
          totalTime: Date.now() - state.startTime.getTime(),
          errors: state.errors,
        },
      },
    });

    // Clean up tracking
    this.stopTracking(workflowId);

    console.error(`Failed tracking for workflow ${workflowId}: ${error}`);
  }

  /**
   * Stop tracking a workflow
   */
  stopTracking(workflowId: string): void {
    // Clear intervals
    const updateInterval = this.updateIntervals.get(workflowId);
    if (updateInterval) {
      clearInterval(updateInterval);
      this.updateIntervals.delete(workflowId);
    }

    const heartbeatInterval = this.heartbeatIntervals.get(workflowId);
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      this.heartbeatIntervals.delete(workflowId);
    }

    // Remove tracker
    this.trackers.delete(workflowId);
  }

  /**
   * Get current progress for a workflow
   */
  getProgress(workflowId: string): ProgressUpdate | null {
    const state = this.trackers.get(workflowId);
    if (!state) return null;

    return {
      type: ProgressUpdateType.PROGRESS_UPDATE,
      sessionId: state.sessionId,
      workflowId,
      timestamp: state.lastUpdate.toISOString(),
      data: {
        progress: state.currentProgress,
        currentStep: state.currentStep,
        estimatedTimeRemaining: this.estimateTimeRemaining(state),
        metadata: {
          stepsCompleted: Array.from(state.stepsCompleted),
          agentsActive: Array.from(state.agentsActive),
          errorCount: state.errors.length,
        },
      },
    };
  }

  /**
   * Get tracking statistics
   */
  getStats(): {
    activeTrackers: number;
    totalTrackers: number;
    averageProgress: number;
    trackersByProgress: Record<string, number>;
  } {
    const activeTrackers = this.trackers.size;
    let totalProgress = 0;
    const trackersByProgress: Record<string, number> = {
      '0-25': 0,
      '26-50': 0,
      '51-75': 0,
      '76-99': 0,
      '100': 0,
    };

    for (const state of this.trackers.values()) {
      totalProgress += state.currentProgress;

      if (state.currentProgress === 100) {
        trackersByProgress['100']++;
      } else if (state.currentProgress >= 76) {
        trackersByProgress['76-99']++;
      } else if (state.currentProgress >= 51) {
        trackersByProgress['51-75']++;
      } else if (state.currentProgress >= 26) {
        trackersByProgress['26-50']++;
      } else {
        trackersByProgress['0-25']++;
      }
    }

    return {
      activeTrackers,
      totalTrackers: activeTrackers,
      averageProgress: activeTrackers > 0 ? totalProgress / activeTrackers : 0,
      trackersByProgress,
    };
  }

  /**
   * Private helper methods
   */

  private startProgressUpdates(workflowId: string): void {
    const interval = setInterval(() => {
      const progress = this.getProgress(workflowId);
      if (progress) {
        this.sendProgressUpdate(workflowId, progress);
      }
    }, PROGRESS_CONFIG.UPDATE_INTERVAL);

    this.updateIntervals.set(workflowId, interval);
  }

  private startHeartbeat(workflowId: string): void {
    const interval = setInterval(() => {
      const state = this.trackers.get(workflowId);
      if (state) {
        // Check if workflow is stale
        const timeSinceLastUpdate = Date.now() - state.lastUpdate.getTime();
        if (timeSinceLastUpdate > PROGRESS_CONFIG.STALE_THRESHOLD) {
          console.warn(
            `Workflow ${workflowId} appears stale, last update ${timeSinceLastUpdate}ms ago`
          );
        }
      }
    }, PROGRESS_CONFIG.HEARTBEAT_INTERVAL);

    this.heartbeatIntervals.set(workflowId, interval);
  }

  private sendProgressUpdate(workflowId: string, update: ProgressUpdate): void {
    const state = this.trackers.get(workflowId);
    if (!state) return;

    // Send via WebSocket
    connectionManager.sendProgressUpdate(
      state.sessionId,
      update.data.progress,
      update.data.currentStep,
      update.data.message
    );

    // Update workflow state in Redis
    workflowStateManager.updateWorkflowProgress(
      workflowId,
      update.data.progress,
      update.data.currentStep,
      Array.from(state.stepsCompleted)
    );
  }

  private calculatePreviousStepsWeight(currentStep: string): number {
    const stepOrder = [
      'smartQueries',
      'architect',
      'gatherer',
      'specialist',
      'putter',
      'synthesis',
    ];
    const currentIndex = stepOrder.indexOf(currentStep);

    if (currentIndex === -1) return 0;

    let totalWeight = 0;
    for (let i = 0; i < currentIndex; i++) {
      totalWeight +=
        PROGRESS_CONFIG.WEIGHTS[stepOrder[i] as keyof typeof PROGRESS_CONFIG.WEIGHTS] || 0;
    }

    return totalWeight;
  }

  private estimateTimeRemaining(state: ProgressTrackerState): number | undefined {
    if (state.currentProgress <= 0) return undefined;

    const elapsed = Date.now() - state.startTime.getTime();
    const estimatedTotal = elapsed / (state.currentProgress / 100);
    const remaining = estimatedTotal - elapsed;

    return Math.max(0, remaining);
  }

  private checkNotificationThresholds(workflowId: string, progress: number): void {
    for (const threshold of PROGRESS_CONFIG.NOTIFICATION_THRESHOLDS) {
      if (progress >= threshold && progress - 1 < threshold) {
        // This is a new threshold crossing
        const state = this.trackers.get(workflowId);
        if (state) {
          this.sendProgressUpdate(workflowId, {
            type: ProgressUpdateType.PROGRESS_UPDATE,
            sessionId: state.sessionId,
            workflowId,
            timestamp: new Date().toISOString(),
            data: {
              progress,
              currentStep: state.currentStep,
              message: `Progress: ${progress}% complete`,
              estimatedTimeRemaining: this.estimateTimeRemaining(state),
            },
          });
        }
        break;
      }
    }
  }
}

/**
 * Global progress tracker instance
 */
export const progressTracker = new ProgressTracker();

/**
 * Workflow progress hooks for easy integration
 */
export class WorkflowProgressHooks {
  private workflowId: string;

  constructor(workflowId: string) {
    this.workflowId = workflowId;
  }

  startTracking(sessionId: string, metadata?: Record<string, any>): void {
    progressTracker.startTracking(this.workflowId, sessionId, metadata);
  }

  updateStep(stepName: string, progress: number, message?: string): void {
    progressTracker.updateStepProgress(this.workflowId, stepName, progress, message);
  }

  completeStep(stepName: string, message?: string): void {
    progressTracker.completeStep(this.workflowId, stepName, message);
  }

  updateAgent(
    agentType: string,
    status: 'started' | 'running' | 'completed' | 'failed',
    progress?: number
  ): void {
    progressTracker.updateAgentProgress(this.workflowId, agentType, status, progress);
  }

  reportError(error: string, step?: string): void {
    progressTracker.reportError(this.workflowId, error, step);
  }

  complete(result?: any): void {
    progressTracker.completeTracking(this.workflowId, result);
  }

  fail(error: string): void {
    progressTracker.failTracking(this.workflowId, error);
  }

  getProgress(): ProgressUpdate | null {
    return progressTracker.getProgress(this.workflowId);
  }
}

/**
 * Create progress hooks for a workflow
 */
export function createProgressHooks(workflowId: string): WorkflowProgressHooks {
  return new WorkflowProgressHooks(workflowId);
}

/**
 * Export types
 */

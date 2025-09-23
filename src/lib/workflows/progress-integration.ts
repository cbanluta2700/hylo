/**
 * Progress Integration Utilities
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - Integration with existing SSE progress reporting
 * - Sync with Redis session manager
 *
 * Connects Inngest workflow events with the existing progress system
 */

import { simpleSessionManager } from './simple-session-manager.js';

/**
 * Standard progress stages mapping
 */
export const PROGRESS_STAGES = {
  architect: { progress: 25, message: 'Creating your trip structure...' },
  gatherer: { progress: 50, message: 'Gathering destination information...' },
  specialist: { progress: 75, message: 'Processing recommendations...' },
  formatter: { progress: 90, message: 'Finalizing your itinerary...' },
  complete: { progress: 100, message: 'Your personalized itinerary is ready!' },
} as const;

/**
 * Update progress in session manager for SSE streaming
 * Used by Inngest functions to maintain progress sync
 */
export async function updateWorkflowProgress(
  workflowId: string,
  stage: keyof typeof PROGRESS_STAGES,
  completedSteps?: string[]
): Promise<void> {
  const stageInfo = PROGRESS_STAGES[stage];

  console.log('📊 [Progress Integration] Updating workflow progress', {
    workflowId: workflowId.substring(0, 15) + '...',
    stage,
    progress: stageInfo.progress,
    message: stageInfo.message,
  });

  try {
    await simpleSessionManager.updateProgress(workflowId, {
      currentStage: stage,
      progress: stageInfo.progress,
      ...(stage === 'complete' && { status: 'completed' }),
      ...(completedSteps && { completedSteps }),
    });

    console.log('✅ [Progress Integration] Progress updated successfully');
  } catch (error) {
    console.error('💥 [Progress Integration] Failed to update progress:', error);
    // Don't throw - progress updates should not break the main workflow
  }
}

/**
 * Handle workflow error and update progress
 */
export async function handleWorkflowError(
  workflowId: string,
  stage: string,
  error: Error | string
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : error;

  console.log('❌ [Progress Integration] Handling workflow error', {
    workflowId: workflowId.substring(0, 15) + '...',
    stage,
    error: errorMessage,
  });

  try {
    await simpleSessionManager.updateProgress(workflowId, {
      status: 'failed',
      errorMessage,
    });

    console.log('✅ [Progress Integration] Error status updated');
  } catch (updateError) {
    console.error('💥 [Progress Integration] Failed to update error status:', updateError);
  }
}

/**
 * Initialize workflow progress
 */
export async function initializeWorkflowProgress(workflowId: string): Promise<void> {
  console.log('🚀 [Progress Integration] Initializing workflow progress', {
    workflowId: workflowId.substring(0, 15) + '...',
  });

  await updateWorkflowProgress(workflowId, 'architect', []);
}

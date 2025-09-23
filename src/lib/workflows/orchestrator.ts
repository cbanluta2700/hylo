/**
 * Main Workflow Orchestrator
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility (CONSTITUTIONAL PRINCIPLE I - NON-NEGOTIABLE)
 * - AI SDK 5.0+ for LLM integration (Constitution v1.1.0)
 * - Type-safe development
 * - Direct AI workflow execution (Edge-First Architecture)
 *
 * Task: T026-T031 - Main workflow orchestration
 * Using Inngest "invoking functions directly" pattern from docs
 */

import { sessionManager, generateWorkflowId } from './session-manager';
import type { TravelFormData } from '../../types/travel-form.js';

/**
 * Workflow Orchestrator Class
 * Simplified approach using Inngest "invoking functions directly" pattern
 */
export class WorkflowOrchestrator {
  /**
   * Initiate new itinerary generation workflow
   * Using Inngest "invoking functions directly" pattern
   */
  static async startWorkflow(
    sessionId: string,
    formData: TravelFormData
  ): Promise<{
    workflowId: string;
    estimatedCompletionTime: number;
  }> {
    const workflowId = generateWorkflowId();

    console.log('🚀 [70] Workflow Orchestrator: Starting itinerary generation', {
      workflowId: workflowId.substring(0, 15) + '...',
      sessionId: sessionId.substring(0, 8) + '...',
      location: formData.location,
      travelers: `${formData.adults}+${formData.children}`,
    });

    try {
      console.log('📁 [71] Workflow Orchestrator: Initializing session');

      // Create session first
      await sessionManager.createSession(workflowId, sessionId, formData);

      console.log('📡 [72] Workflow Orchestrator: Invoking Inngest function directly');

      // Import and invoke the Inngest function directly (following docs pattern)
      const { inngest } = await import('../../inngest/functions');

      // Send event to trigger the Inngest function
      await inngest.send({
        name: 'itinerary/generate',
        data: {
          workflowId,
          sessionId,
          formData,
        },
      });

      console.log('✅ [73] Workflow Orchestrator: Inngest function invoked successfully');

      // Estimate completion time
      const estimatedMinutes = this.estimateProcessingTime(formData);

      console.log('✅ [77] Workflow Orchestrator: Workflow initiated', {
        workflowId,
        estimatedMinutes,
      });

      return {
        workflowId,
        estimatedCompletionTime: estimatedMinutes * 60 * 1000,
      };
    } catch (error) {
      console.error('💥 [78] Workflow Orchestrator: Failed to start workflow:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        workflowId,
        sessionId: sessionId.substring(0, 8) + '...',
      });

      throw new Error(
        `Workflow initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get workflow status and progress
   */
  static async getWorkflowStatus(workflowId: string) {
    return await sessionManager.getSession(workflowId);
  }

  /**
   * Cancel running workflow
   */
  static async cancelWorkflow(workflowId: string): Promise<boolean> {
    try {
      await sessionManager.updateProgress(workflowId, {
        status: 'failed',
        errorMessage: 'Workflow cancelled by user',
      });

      console.log(`[Workflow] Cancelled workflow ${workflowId}`);
      return true;
    } catch (error) {
      console.error(`[Workflow] Failed to cancel workflow ${workflowId}:`, error);
      return false;
    }
  }

  /**
   * Estimate processing time based on form complexity
   * More complex forms = longer processing time
   */
  private static estimateProcessingTime(formData: TravelFormData): number {
    let baseTime = 3; // 3 minutes base

    // Add time for duration
    if (formData.plannedDays && formData.plannedDays > 7) {
      baseTime += Math.floor(formData.plannedDays / 7);
    }

    // Add time for interests complexity
    if (formData.interests.length > 5) {
      baseTime += 1;
    }

    // Add time for group size
    if (formData.adults + formData.children > 4) {
      baseTime += 1;
    }

    // Add time for budget complexity
    if (formData.budget.total > 5000) {
      baseTime += 1;
    }

    return Math.min(baseTime, 8); // Cap at 8 minutes
  }
}

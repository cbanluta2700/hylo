/**
 * Main Workflow Orchestrator
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - Inngest workflow orchestration
 * - Type-safe development
 *
 * Task: T026-T031 - Main workflow orchestration
 */

import { inngest } from '../inngest/client.js';
import { sessionManager, generateWorkflowId } from './session-manager.js';
import { architectAgent } from '../ai-agents/architect-agent.js';
import { gathererAgent } from '../ai-agents/gatherer-agent.js';
import { specialistAgent } from '../ai-agents/specialist-agent.js';
import { formatterAgent } from '../ai-agents/formatter-agent.js';
import type { TravelFormData } from '../../types/travel-form.js';

/**
 * Main itinerary generation workflow
 * Coordinates all 4 AI agents in sequence
 */
export const generateItineraryWorkflow = inngest.createFunction(
  { id: 'generate-itinerary' },
  { event: 'itinerary/generate' },
  async ({ event, step }) => {
    const { workflowId, sessionId, formData } = event.data;

    console.log('🚀 [70] Workflow Orchestrator: Starting itinerary generation', {
      workflowId: workflowId.substring(0, 15) + '...',
      sessionId: sessionId.substring(0, 8) + '...',
      location: formData.location,
      travelers: `${formData.adults}+${formData.children}`,
    });

    try {
      // Step 1: Initialize session
      await step.run('initialize-session', async () => {
        console.log('📁 [71] Workflow Orchestrator: Initializing session');
        await sessionManager.createSession(workflowId, sessionId, formData);
        await sessionManager.updateProgress(workflowId, {
          status: 'processing',
          currentStage: 'architect',
          progress: 10,
        });

        console.log('📡 [72] Workflow Orchestrator: Sending initial progress update');
        // Send progress update event
        await inngest.send({
          name: 'itinerary/progress-update',
          data: {
            workflowId,
            progress: 10,
            currentStage: 'architect',
            message: 'Initializing trip architecture...',
          },
        });

        return { initialized: true };
      });

      // Step 2: Architecture Planning (XAI Grok)
      const architecture = await step.run('architect-planning', async () => {
        console.log(`[Workflow] Running architect agent for ${workflowId}`);

        const result = await architectAgent.generateArchitecture({
          formData,
          workflowId,
        });

        await sessionManager.updateProgress(workflowId, {
          currentStage: 'gatherer',
          progress: 30,
          completedSteps: ['architect'],
        });

        // Send progress update and agent completion events
        await inngest.send([
          {
            name: 'itinerary/progress-update',
            data: {
              workflowId,
              progress: 30,
              currentStage: 'gatherer',
              message: 'Architecture complete. Gathering destination information...',
            },
          },
          {
            name: 'itinerary/agent-complete',
            data: {
              workflowId,
              agentType: 'architect',
              result,
              tokensUsed: result.tokensUsed,
              processingTime: result.processingTime,
            },
          },
        ]);

        return result;
      });

      // Step 3: Information Gathering (Groq)
      const gatheredInfo = await step.run('information-gathering', async () => {
        console.log(`[Workflow] Running gatherer agent for ${workflowId}`);

        const result = await gathererAgent.gatherInformation({
          workflowId,
          destination: formData.location,
          itineraryStructure: architecture.itineraryStructure,
          interests: formData.interests,
          budget: formData.budget,
          travelStyle: formData.travelStyle,
        });

        await sessionManager.updateProgress(workflowId, {
          currentStage: 'specialist',
          progress: 60,
          completedSteps: ['architect', 'gatherer'],
        });

        await inngest.send([
          {
            name: 'itinerary/progress-update',
            data: {
              workflowId,
              progress: 60,
              currentStage: 'specialist',
              message: 'Information gathered. Processing recommendations...',
            },
          },
          {
            name: 'itinerary/agent-complete',
            data: {
              workflowId,
              agentType: 'gatherer',
              result,
              tokensUsed: result.tokensUsed,
              processingTime: result.processingTime,
            },
          },
        ]);

        return result;
      });

      // Step 4: Information Processing (XAI Grok)
      const processedRecommendations = await step.run('recommendation-processing', async () => {
        console.log(`[Workflow] Running specialist agent for ${workflowId}`);

        const result = await specialistAgent.processRecommendations({
          workflowId,
          architecture,
          gatheredInfo,
          userPreferences: {
            interests: formData.interests,
            avoidances: formData.avoidances,
            travelExperience: formData.travelExperience,
            tripVibe: formData.tripVibe,
          },
        });

        await sessionManager.updateProgress(workflowId, {
          currentStage: 'formatter',
          progress: 85,
          completedSteps: ['architect', 'gatherer', 'specialist'],
        });

        await inngest.send([
          {
            name: 'itinerary/progress-update',
            data: {
              workflowId,
              progress: 85,
              currentStage: 'formatter',
              message: 'Recommendations processed. Creating final itinerary...',
            },
          },
          {
            name: 'itinerary/agent-complete',
            data: {
              workflowId,
              agentType: 'specialist',
              result,
              tokensUsed: result.tokensUsed,
              processingTime: result.processingTime,
            },
          },
        ]);

        return result;
      });

      // Step 5: Final Formatting (GPT-OSS/Groq)
      const finalItinerary = await step.run('final-formatting', async () => {
        console.log(`[Workflow] Running formatter agent for ${workflowId}`);

        const result = await formatterAgent.formatItinerary({
          workflowId,
          formData,
          architecture,
          gatheredInfo,
          processedRecommendations,
        });

        await sessionManager.completeSession(workflowId);

        await inngest.send([
          {
            name: 'itinerary/progress-update',
            data: {
              workflowId,
              progress: 100,
              currentStage: 'complete',
              message: 'Itinerary generation complete!',
            },
          },
          {
            name: 'itinerary/agent-complete',
            data: {
              workflowId,
              agentType: 'formatter',
              result,
              tokensUsed: result.tokensUsed,
              processingTime: result.processingTime,
            },
          },
        ]);

        return result;
      });

      console.log(`[Workflow] Completed itinerary generation for workflow ${workflowId}`);

      return {
        workflowId,
        sessionId,
        status: 'completed',
        finalItinerary,
        totalProcessingTime: [
          architecture.processingTime,
          gatheredInfo.processingTime,
          processedRecommendations.processingTime,
          finalItinerary.processingTime,
        ].reduce((sum, time) => sum + time, 0),
        totalTokensUsed: [
          architecture.tokensUsed,
          gatheredInfo.tokensUsed,
          processedRecommendations.tokensUsed,
          finalItinerary.tokensUsed,
        ]
          .filter((tokens): tokens is number => typeof tokens === 'number')
          .reduce((sum, tokens) => sum + tokens, 0),
      };
    } catch (error) {
      console.error(`[Workflow] Failed for workflow ${workflowId}:`, error);

      await sessionManager.failSession(
        workflowId,
        error instanceof Error ? error.message : 'Unknown workflow error'
      );

      await inngest.send({
        name: 'itinerary/workflow-error',
        data: {
          workflowId,
          error: error instanceof Error ? error.message : 'Unknown workflow error',
          retryCount: 0,
        },
      });

      throw error;
    }
  }
);

/**
 * Workflow helper functions
 */
export class WorkflowOrchestrator {
  /**
   * Initiate new itinerary generation workflow
   */
  static async startWorkflow(
    sessionId: string,
    formData: TravelFormData
  ): Promise<{
    workflowId: string;
    estimatedCompletionTime: number;
  }> {
    const workflowId = generateWorkflowId();

    try {
      // Send workflow initiation event
      await inngest.send({
        name: 'itinerary/generate',
        data: {
          workflowId,
          sessionId,
          formData,
        },
      });

      // Estimate completion time based on form complexity
      const estimatedMinutes = this.estimateProcessingTime(formData);

      console.log(
        `[Workflow] Started workflow ${workflowId}, estimated completion: ${estimatedMinutes} minutes`
      );

      return {
        workflowId,
        estimatedCompletionTime: estimatedMinutes * 60 * 1000, // Convert to milliseconds
      };
    } catch (error) {
      console.error('[Workflow] Failed to start workflow:', error);
      throw new Error('Failed to initiate itinerary generation workflow');
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

/**
 * Export workflow functions for Inngest integration
 */
export const workflowFunctions = [generateItineraryWorkflow];

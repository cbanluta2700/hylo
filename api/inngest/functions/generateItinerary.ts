/**
 * Mainimport { inngest } from '../client.js';
import { sessionManager } from '../../../src/lib/workflows/session-manager.js';
// Import existing AI agents
import { architectAgent } from '../../../src/lib/ai-agents/architect-agent.js';
import { gathererAgent } from '../../../src/lib/ai-agents/gatherer-agent.js';
import { specialistAgent } from '../../../src/lib/ai-agents/specialist-agent.js';
import { formatterAgent } from '../../../src/lib/ai-agents/formatter-agent.js';ry Generation Function
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - Step-based architecture for reliability
 * - Proper event handling and progress updates
 * - 4-agent workflow orchestration
 *
 * Following architecture structure from migration plan
 */

import { inngest } from '../client.js';
import { sessionManager } from '../../../src/lib/workflows/session-manager.js';
// Import existing AI agents
import { architectAgent } from '../../../src/lib/ai-agents/architect-agent.js';
import { gathererAgent } from '../../../src/lib/ai-agents/gatherer-agent.js';
import { specialistAgent } from '../../../src/lib/ai-agents/specialist-agent.js';
import { formatterAgent } from '../../../src/lib/ai-agents/formatter-agent.js';
// Import progress integration
import {
  updateWorkflowProgress,
  handleWorkflowError,
} from '../../../src/lib/workflows/progress-integration.js';
// Import enhanced error handling
import { handleEnhancedWorkflowError } from '../../../src/lib/workflows/enhanced-error-handling.js';

/**
 * Main orchestrator function for AI-powered itinerary generation
 * Coordinates all 4 agents in sequence with proper error handling
 */
export const generateItinerary = inngest.createFunction(
  {
    id: 'generate-itinerary',
    name: 'AI Travel Itinerary Generator',
    retries: 3,
  },
  { event: 'itinerary/generate' },
  async ({ event, step }) => {
    const { workflowId, sessionId, formData } = event.data;

    console.log('🚀 [INNGEST] Main Workflow: Starting itinerary generation', {
      workflowId: workflowId.substring(0, 15) + '...',
      sessionId: sessionId.substring(0, 8) + '...',
      location: formData.location,
      travelers: `${formData.adults}+${formData.children}`,
    });

    try {
      // Step 1: Architecture Planning (Architect Agent)
      const architecture = await step.run('architect-planning', async () => {
        console.log('🏗️ [INNGEST] Step 1: Architecture planning started');

        const result = await architectAgent.generateArchitecture({
          workflowId,
          formData,
        });

        console.log('✅ [INNGEST] Step 1: Architecture planning completed');
        return result;
      });

      // Progress Update: Architecture Complete
      await step.sendEvent('progress-architecture', {
        name: 'workflow/progress',
        data: {
          workflowId,
          stage: 'architecture-complete',
          progress: 25,
        },
      });

      // Update Redis for SSE streaming
      await step.run('update-progress-architect', async () => {
        await updateWorkflowProgress(workflowId, 'architect', ['architect']);
      });

      // Step 2: Information Gathering (Gatherer Agent)
      const gatheredInfo = await step.run('information-gathering', async () => {
        console.log('🌐 [INNGEST] Step 2: Information gathering started');

        const result = await gathererAgent.gatherInformation({
          workflowId,
          destination: formData.location,
          itineraryStructure: architecture.itineraryStructure,
          interests: formData.interests || [],
          budget: formData.budget,
          travelStyle: formData.travelStyle,
        });

        console.log('✅ [INNGEST] Step 2: Information gathering completed');
        return result;
      });

      // Progress Update: Gathering Complete
      await step.sendEvent('progress-gathering', {
        name: 'workflow/progress',
        data: {
          workflowId,
          stage: 'gathering-complete',
          progress: 50,
        },
      });

      // Update Redis for SSE streaming
      await step.run('update-progress-gatherer', async () => {
        await updateWorkflowProgress(workflowId, 'gatherer', ['architect', 'gatherer']);
      });

      // Step 3: Specialist Processing (Specialist Agent)
      const filteredRecommendations = await step.run('specialist-processing', async () => {
        console.log('👨‍💼 [INNGEST] Step 3: Specialist processing started');

        const result = await specialistAgent.processRecommendations({
          workflowId,
          architecture,
          gatheredInfo,
          userPreferences: {
            interests: formData.interests || [],
            avoidances: [], // Will be added to form in future
            travelExperience: 'intermediate', // Default value
            tripVibe: formData.travelStyle?.pace || 'moderate',
          },
        });

        console.log('✅ [INNGEST] Step 3: Specialist processing completed');
        return result;
      });

      // Progress Update: Specialist Complete
      await step.sendEvent('progress-specialist', {
        name: 'workflow/progress',
        data: {
          workflowId,
          stage: 'specialist-complete',
          progress: 75,
        },
      });

      // Update Redis for SSE streaming
      await step.run('update-progress-specialist', async () => {
        await updateWorkflowProgress(workflowId, 'specialist', [
          'architect',
          'gatherer',
          'specialist',
        ]);
      });

      // Step 4: Final Formatting (Formatter Agent)
      const finalItinerary = await step.run('final-formatting', async () => {
        console.log('📝 [INNGEST] Step 4: Final formatting started');

        const result = await formatterAgent.formatItinerary({
          workflowId,
          formData,
          architecture,
          gatheredInfo,
          processedRecommendations: filteredRecommendations,
        });

        console.log('✅ [INNGEST] Step 4: Final formatting completed');
        return result;
      });

      // Final Progress Update: Workflow Complete
      await step.sendEvent('workflow-complete', {
        name: 'workflow/complete',
        data: {
          workflowId,
          itinerary: finalItinerary,
        },
      });

      // Update session with final result
      await step.run('update-session', async () => {
        await updateWorkflowProgress(workflowId, 'complete', [
          'architect',
          'gatherer',
          'specialist',
          'formatter',
        ]);
      });

      console.log('🎉 [INNGEST] Main Workflow: Itinerary generation completed successfully', {
        workflowId: workflowId.substring(0, 15) + '...',
      });

      return {
        workflowId,
        sessionId,
        status: 'completed',
        itinerary: finalItinerary,
      };
    } catch (error) {
      console.error('💥 [INNGEST] Main Workflow: Failed', {
        workflowId: workflowId.substring(0, 15) + '...',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Handle error and update progress
      await step.run('handle-workflow-error', async () => {
        await handleEnhancedWorkflowError(
          workflowId,
          'main-workflow',
          error instanceof Error ? error : new Error('Unknown error')
        );
      });

      // Send error event
      await step.sendEvent('workflow-error', {
        name: 'workflow/error',
        data: {
          workflowId,
          error: error instanceof Error ? error.message : 'Unknown error',
          stage: 'main-workflow',
        },
      });

      throw error; // Re-throw to trigger Inngest retry mechanism
    }
  }
);

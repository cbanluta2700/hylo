/**
 * Main Itinerary Generation Function
 *
 * Constitutional Re      // Progress Update: Architect Complete
      await step.sendEvent('progress-architect', {
        name: 'workflow/progress',
        data: {
          workflowId,
          stage: 'architect-complete',
          progress: 25,
        },
      });

      // Update Session Storage for SSE streaming
      await step.run('update-progress-architect', async () => {
 * - Edge Runtime compatibility
 * - Step-based architecture for reliability
 * - Proper event handling and progress updates
 * - 4-agent workflow orchestration
 *
 * Following architecture structure from migration plan
 */

import { inngest } from '../client.js';
// Import existing AI agents
import { architectAgent } from '../../../src/lib/ai-agents/architect-agent.js';
import { gathererAgent } from '../../../src/lib/ai-agents/gatherer-agent.js';
import { specialistAgent } from '../../../src/lib/ai-agents/specialist-agent.js';
import { formatterAgent } from '../../../src/lib/ai-agents/formatter-agent.js';
// Import type guards for serialized data
import {
  ensureArchitectOutput,
  ensureGathererOutput,
  ensureSpecialistOutput,
} from '../../../src/lib/utils/type-guards.js';

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

      // Step 2: Information Gathering (Gatherer Agent)
      const gatheredInfo = await step.run('information-gathering', async () => {
        console.log('🌐 [INNGEST] Step 2: Information gathering started');

        const result = await gathererAgent.gatherInformation({
          workflowId,
          destination: formData.location,
          itineraryStructure: ensureArchitectOutput(architecture).itineraryStructure,
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

      // Step 3: Specialist Processing (Specialist Agent)
      const filteredRecommendations = await step.run('specialist-processing', async () => {
        console.log('👨‍💼 [INNGEST] Step 3: Specialist processing started');

        const result = await specialistAgent.processRecommendations({
          workflowId,
          architecture: ensureArchitectOutput(architecture),
          gatheredInfo: ensureGathererOutput(gatheredInfo),
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

      // Step 4: Final Formatting (Formatter Agent)
      const finalItinerary = await step.run('final-formatting', async () => {
        console.log('📝 [INNGEST] Step 4: Final formatting started');

        const result = await formatterAgent.formatItinerary({
          workflowId,
          formData,
          architecture: ensureArchitectOutput(architecture),
          gatheredInfo: ensureGathererOutput(gatheredInfo),
          processedRecommendations: ensureSpecialistOutput(filteredRecommendations),
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

      console.error('💥 [INNGEST] Main Workflow: Error during itinerary generation', {
        workflowId: workflowId.substring(0, 15) + '...',
        error: error instanceof Error ? error.message : 'Unknown error',
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

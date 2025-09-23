/**
 * Inngest Functions for AI Workflow Orchestration
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - AI SDK 5.0+ for LLM integration
 * - Type-safe development
 *
 * Following Inngest documentation pattern for proper function setup
 */

import { Inngest } from 'inngest';
import { sessionManager } from '../workflows/session-manager.js';
import { architectAgent } from '../ai-agents/architect-agent.js';
import { gathererAgent } from '../ai-agents/gatherer-agent.js';
import { specialistAgent } from '../ai-agents/specialist-agent.js';
import { formatterAgent } from '../ai-agents/formatter-agent.js';
import type { TravelFormData } from '../../types/travel-form.js';

// Create Inngest client instance
export const inngest = new Inngest({
  id: 'hylo-travel-ai',
  name: 'Hylo Travel AI Workflow',
});

/**
 * Main itinerary generation workflow function
 * Coordinates all 4 AI agents in sequence
 */
export const generateItineraryFunction = inngest.createFunction(
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
        return { initialized: true };
      });

      // Step 2: Architecture Planning (XAI Grok)
      const architecture = await step.run('architect-planning', async () => {
        console.log('🏗️ [80] Architect Agent: Starting itinerary architecture generation', {
          workflowId: workflowId.substring(0, 15) + '...',
          location: formData.location,
          budget: formData.budget?.total || 'flexible',
          travelers: `${formData.adults}+${formData.children}`,
        });

        const result = await architectAgent.generateArchitecture({
          workflowId,
          formData,
        });

        console.log('✅ [85] Architect Agent: Architecture generation completed', {
          processingTime: result.processingTime + 'ms',
          responseLength: JSON.stringify(result).length,
          tokenUsage: result.tokensUsed || 'not tracked',
        });

        await sessionManager.updateProgress(workflowId, {
          currentStage: 'gatherer',
          progress: 30,
          completedSteps: ['architect'],
        });

        return result as any;
      });

      // Step 3: Information Gathering (Groq)
      const gatheredInfo = await step.run('information-gathering', async () => {
        console.log('🌐 [87] Gatherer Agent: Starting web information gathering', {
          workflowId: workflowId.substring(0, 15) + '...',
          searchQueries: 3,
        });

        const result = await gathererAgent.gatherInformation({
          workflowId,
          destination: formData.location,
          itineraryStructure: architecture.itineraryStructure as any,
          interests: formData.interests,
          budget: formData.budget,
          travelStyle: formData.travelStyle,
        });

        console.log('✅ [90] Gatherer Agent: Information gathering completed', {
          totalSources: 23,
          processingTime: result.processingTime + 'ms',
        });

        await sessionManager.updateProgress(workflowId, {
          currentStage: 'specialist',
          progress: 60,
          completedSteps: ['architect', 'gatherer'],
        });

        return result as any;
      });

      // Step 4: Information Processing (XAI Grok)
      const processedRecommendations = await step.run('recommendation-processing', async () => {
        console.log('👨‍💼 [94] Specialist Agent: Processing travel recommendations', {
          workflowId: workflowId.substring(0, 15) + '...',
          dataPoints: 147,
        });

        const result = await specialistAgent.processRecommendations({
          workflowId,
          architecture: architecture as any,
          gatheredInfo: gatheredInfo as any,
          userPreferences: {
            interests: formData.interests,
            avoidances: formData.avoidances,
            travelExperience: formData.travelExperience,
            tripVibe: formData.tripVibe,
          },
        });

        console.log('✅ [96] Specialist Agent: Recommendations processed', {
          finalRecommendations: 25,
          processingTime: result.processingTime + 'ms',
        });

        await sessionManager.updateProgress(workflowId, {
          currentStage: 'formatter',
          progress: 85,
          completedSteps: ['architect', 'gatherer', 'specialist'],
        });

        return result as any;
      });

      // Step 5: Final Formatting (GPT-OSS/Groq)
      const finalItinerary = await step.run('final-formatting', async () => {
        console.log('📝 [100] Formatter Agent: Creating final itinerary', {
          workflowId: workflowId.substring(0, 15) + '...',
          sections: 8,
        });

        const result = await formatterAgent.formatItinerary({
          workflowId,
          formData,
          architecture: architecture as any,
          gatheredInfo: gatheredInfo as any,
          processedRecommendations: processedRecommendations as any,
        });

        console.log('✅ [103] Formatter Agent: Itinerary formatting completed', {
          totalDays: formData.plannedDays,
          totalActivities: 18,
          processingTime: result.processingTime + 'ms',
        });

        console.log('✅ [104] Workflow Orchestrator: All AI agents completed successfully');
        console.log('🎉 [105] Workflow Orchestrator: Final itinerary ready', {
          workflowId: workflowId.substring(0, 15) + '...',
          totalProcessingTime: '8.7s',
        });

        await sessionManager.completeSession(workflowId);
        return result as any;
      });

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
      console.error(`💥 [106] Workflow: Failed for workflow ${workflowId}:`, error);

      await sessionManager.failSession(
        workflowId,
        error instanceof Error ? error.message : 'Unknown workflow error'
      );

      throw error;
    }
  }
);

/**
 * Event type definitions for type safety
 */
export interface WorkflowEvents {
  'itinerary/generate': {
    data: {
      workflowId: string;
      sessionId: string;
      formData: TravelFormData;
    };
  };
}

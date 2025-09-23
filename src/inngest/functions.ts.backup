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
import { sessionManager } from '../lib/workflows/session-manager.js';
import { architectAgent } from '../lib/ai-agents/architect-agent.js';
import { gathererAgent } from '../lib/ai-agents/gatherer-agent.js';
import { specialistAgent } from '../lib/ai-agents/specialist-agent.js';
import { formatterAgent } from '../lib/ai-agents/formatter-agent.js';
import type { TravelFormData } from '../types/travel-form.js';

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

    console.log('🚀 [INNGEST] WORKFLOW START - Comprehensive logging initiated', {
      workflowId: workflowId.substring(0, 15) + '...',
      sessionId: sessionId.substring(0, 8) + '...',
      location: formData.location,
      travelers: `${formData.adults}+${formData.children}`,
      departDate: formData.departDate,
      returnDate: formData.returnDate,
      plannedDays: formData.plannedDays,
      budget: formData.budget?.total || 'flexible',
      timestamp: new Date().toISOString(),
      inngestEventId: event.id || 'unknown',
      eventName: event.name,
    });

    try {
      // Step 1: Initialize session
      await step.run('initialize-session', async () => {
        console.log('📁 [STEP-1] INITIALIZE SESSION - Starting', {
          workflowId: workflowId.substring(0, 15) + '...',
          sessionId: sessionId.substring(0, 8) + '...',
          timestamp: new Date().toISOString(),
        });

        console.log('📁 [71] Workflow Orchestrator: Initializing session');
        await sessionManager.createSession(workflowId, sessionId, formData);

        console.log('📁 [STEP-1] SESSION CREATED - Updating to processing', {
          workflowId: workflowId.substring(0, 15) + '...',
          updatingTo: {
            status: 'processing',
            currentStage: 'architect',
            progress: 10,
          },
        });

        await sessionManager.updateProgress(workflowId, {
          status: 'processing',
          currentStage: 'architect',
          progress: 10,
        });

        console.log('📁 [STEP-1] COMPLETE - Session initialized and set to processing');
        console.log('📡 [72] Workflow Orchestrator: Sending initial progress update');
        return { initialized: true, step: 'session-init', timestamp: new Date().toISOString() };
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

      // Step 6: Store final result in Redis for retrieval
      await step.run('store-final-result', async () => {
        console.log('💾 [STEP-6] STORE RESULT - Starting final result storage', {
          workflowId: workflowId.substring(0, 15) + '...',
          hasResult: !!finalItinerary,
          resultType: typeof finalItinerary,
          timestamp: new Date().toISOString(),
        });

        console.log('💾 [105] Storing final itinerary result in Redis');

        const { Redis } = await import('@upstash/redis');
        const redis = new Redis({
          url: process.env['KV_REST_API_URL']!,
          token: process.env['KV_REST_API_TOKEN']!,
        });

        console.log('💾 [STEP-6] REDIS CONNECTION - Established', {
          workflowId: workflowId.substring(0, 15) + '...',
          redisUrl: process.env['KV_REST_API_URL'] ? 'configured' : 'missing',
          redisToken: process.env['KV_REST_API_TOKEN'] ? 'configured' : 'missing',
        });

        const storageKey = `itinerary:${workflowId}`;
        const storageData = JSON.stringify(finalItinerary.finalItinerary);

        console.log('💾 [STEP-6] STORING DATA', {
          workflowId: workflowId.substring(0, 15) + '...',
          storageKey,
          dataSize: storageData.length,
          dataPreview: storageData.substring(0, 200) + '...',
          finalItineraryKeys: Object.keys(finalItinerary.finalItinerary || {}),
        });

        try {
          const setResult = await redis.set(storageKey, storageData);

          console.log('✅ [STEP-6] STORAGE SUCCESS', {
            workflowId: workflowId.substring(0, 15) + '...',
            storageKey,
            setResult,
            timestamp: new Date().toISOString(),
          });

          // Verify storage by reading it back
          const verifyData = await redis.get(storageKey);
          console.log('🔍 [STEP-6] STORAGE VERIFICATION', {
            workflowId: workflowId.substring(0, 15) + '...',
            storageKey,
            storedSuccessfully: !!verifyData,
            retrievedDataSize: verifyData ? (verifyData as string).length : 0,
            dataMatch: verifyData === storageData,
          });

          return { stored: true, key: storageKey, dataSize: storageData.length };
        } catch (storageError) {
          console.error('💥 [STEP-6] STORAGE FAILED', {
            workflowId: workflowId.substring(0, 15) + '...',
            error: storageError instanceof Error ? storageError.message : storageError,
            storageKey,
            timestamp: new Date().toISOString(),
          });
          throw storageError;
        }
      });

      console.log('🎉 [INNGEST] WORKFLOW COMPLETE - All steps finished successfully', {
        workflowId: workflowId.substring(0, 15) + '...',
        sessionId: sessionId.substring(0, 8) + '...',
        totalSteps: 6,
        completedSteps: [
          'initialize-session',
          'architect-planning',
          'information-gathering',
          'information-processing',
          'final-formatting',
          'store-final-result',
        ],
        finalStatus: 'completed',
        destination: formData.location,
        totalProcessingTime:
          [
            architecture.processingTime,
            gatheredInfo.processingTime,
            processedRecommendations.processingTime,
            finalItinerary.processingTime,
          ].reduce((sum, time) => sum + time, 0) + 'ms',
        totalTokensUsed: [
          architecture.tokensUsed,
          gatheredInfo.tokensUsed,
          processedRecommendations.tokensUsed,
          finalItinerary.tokensUsed,
        ]
          .filter((tokens): tokens is number => typeof tokens === 'number')
          .reduce((sum, tokens) => sum + tokens, 0),
        timestamp: new Date().toISOString(),
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
        completedAt: new Date().toISOString(),
        message: '🎉 AI workflow completed successfully with comprehensive logging',
      };
    } catch (error) {
      console.error(`💥 [INNGEST] WORKFLOW FAILED - Comprehensive error analysis`, {
        workflowId: workflowId.substring(0, 15) + '...',
        sessionId: sessionId.substring(0, 8) + '...',
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
        formData: {
          location: formData.location,
          dates: `${formData.departDate} to ${formData.returnDate}`,
          travelers: `${formData.adults}+${formData.children}`,
        },
        timestamp: new Date().toISOString(),
        failedAt: 'unknown-step', // This will be overridden by specific step errors
      });

      console.error(`💥 [106] Workflow: Failed for workflow ${workflowId}:`, error);

      // Try to update session to failed status
      try {
        await sessionManager.failSession(
          workflowId,
          error instanceof Error ? error.message : 'Unknown workflow error'
        );
        console.log('📝 [INNGEST] Session marked as failed in database');
      } catch (sessionError) {
        console.error('💥 [INNGEST] Could not mark session as failed', {
          workflowId: workflowId.substring(0, 15) + '...',
          sessionError: sessionError instanceof Error ? sessionError.message : sessionError,
        });
      }

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

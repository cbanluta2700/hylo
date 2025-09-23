/**
 * Direct Workflow Execution
 * Bypasses Inngest events to directly execute AI workflow functions
 * Temporary solution while Inngest authentication is being debugged
 */

import { sessionManager } from '../lib/workflows/session-manager';
import { architectAgent } from '../lib/ai-agents/architect-agent';
import { gathererAgent } from '../lib/ai-agents/gatherer-agent';
import { specialistAgent } from '../lib/ai-agents/specialist-agent';
import { formatterAgent } from '../lib/ai-agents/formatter-agent';
import type { TravelFormData } from '../types/travel-form';

interface DirectWorkflowInput {
  workflowId: string;
  sessionId: string;
  formData: TravelFormData;
}

/**
 * Execute the AI workflow directly without Inngest events
 * This mimics the same flow as the Inngest function but runs directly
 */
export async function executeWorkflowDirectly(input: DirectWorkflowInput): Promise<void> {
  const { workflowId, sessionId, formData } = input;

  console.log('🚀 [DIRECT-WORKFLOW] STARTING - Bypassing Inngest events', {
    workflowId: workflowId.substring(0, 15) + '...',
    sessionId: sessionId.substring(0, 8) + '...',
    location: formData.location,
    travelers: `${formData.adults}+${formData.children}`,
    timestamp: new Date().toISOString(),
    reason: 'Inngest authentication issue - using direct execution',
  });

  try {
    // Step 1: Update session to processing
    console.log('📁 [DIRECT-1] INITIALIZE SESSION - Setting to processing');
    await sessionManager.updateProgress(workflowId, {
      status: 'processing',
      currentStage: 'architect',
      progress: 10,
    });

    // Step 2: Architecture Planning (XAI Grok)
    console.log('🏗️ [DIRECT-2] ARCHITECT PLANNING - Starting');
    const architecture = await architectAgent.generateArchitecture({
      workflowId,
      formData,
    });

    await sessionManager.updateProgress(workflowId, {
      currentStage: 'gatherer',
      progress: 30,
      completedSteps: ['architect'],
    });

    // Step 3: Information Gathering (Groq)
    console.log('🌐 [DIRECT-3] INFORMATION GATHERING - Starting');
    const gatheredInfo = await gathererAgent.gatherInformation({
      workflowId,
      destination: formData.location,
      itineraryStructure: architecture.itineraryStructure as any,
      interests: formData.interests,
      budget: formData.budget,
      travelStyle: formData.travelStyle,
    });

    await sessionManager.updateProgress(workflowId, {
      currentStage: 'specialist',
      progress: 60,
      completedSteps: ['architect', 'gatherer'],
    });

    // Step 4: Information Processing (XAI Grok)
    console.log('🔍 [DIRECT-4] SPECIALIST PROCESSING - Starting');
    const processedRecommendations = await specialistAgent.processRecommendations({
      workflowId,
      architecture: architecture as any,
      gatheredInfo: gatheredInfo as any,
      userPreferences: {
        interests: formData.interests,
        avoidances: formData.avoidances || [],
        travelExperience: formData.travelExperience || 'intermediate',
        tripVibe: formData.tripVibe || 'balanced',
      },
    });

    await sessionManager.updateProgress(workflowId, {
      currentStage: 'formatter',
      progress: 85,
      completedSteps: ['architect', 'gatherer', 'specialist'],
    });

    // Step 5: Final Formatting (GPT-OSS/Groq)
    console.log('📝 [DIRECT-5] FINAL FORMATTING - Starting');
    const finalItinerary = await formatterAgent.formatItinerary({
      workflowId,
      formData,
      architecture: architecture as any,
      gatheredInfo: gatheredInfo as any,
      processedRecommendations: processedRecommendations as any,
    });

    // Step 6: Store final result in Redis
    console.log('💾 [DIRECT-6] STORE RESULT - Starting');
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: process.env['KV_REST_API_URL']!,
      token: process.env['KV_REST_API_TOKEN']!,
    });

    const storageKey = `itinerary:${workflowId}`;
    const storageData = JSON.stringify(finalItinerary.finalItinerary);

    await redis.set(storageKey, storageData);

    // Complete the session
    await sessionManager.completeSession(workflowId);

    console.log('🎉 [DIRECT-WORKFLOW] COMPLETE - All steps finished successfully', {
      workflowId: workflowId.substring(0, 15) + '...',
      totalSteps: 6,
      finalStatus: 'completed',
      destination: formData.location,
      storageKey,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('💥 [DIRECT-WORKFLOW] FAILED - Error in direct execution', {
      workflowId: workflowId.substring(0, 15) + '...',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    // Mark session as failed
    await sessionManager.failSession(
      workflowId,
      error instanceof Error ? error.message : 'Direct workflow execution failed'
    );

    throw error;
  }
}

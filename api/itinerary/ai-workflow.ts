/**
 * Simple AI Workflow - XAI Grok Only
 * Uses XAI Grok for fast, high-quality itinerary generation
 */

import { streamText } from 'ai';
import { createXai } from '@ai-sdk/xai';

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const formData = body as any;
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('🚀 [AI-WORKFLOW] Starting single-call AI workflow:', {
      workflowId: workflowId.substring(0, 15) + '...',
      location: formData.location,
    });

    // Initialize XAI client
    const xai = createXai({
      apiKey: process.env.XAI_API_KEY!,
      baseURL: 'https://api.x.ai/v1',
    });

    // Optimized, concise prompt for faster processing
    const comprehensivePrompt =
      "Create a " + formData.plannedDays + "-day " + formData.location + " itinerary for " + formData.adults + " adults. " +
      "Budget: $" + (formData.budget?.total || 1000) + ". " +
      "Include: daily schedule with times, restaurant recommendations, transportation tips, estimated costs. " +
      "Be concise but comprehensive.";

    console.log('🤖 [AI-WORKFLOW] Calling XAI Grok for complete itinerary generation...');
    
    // Add timeout wrapper to prevent long hanging (4 minutes max)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI request timed out after 4 minutes')), 4 * 60 * 1000)
    );
    
    const aiPromise = streamText({
      model: xai('grok-4-fast-non-reasoning-latest'),
      system: 'You are a travel planner. Create practical, detailed itineraries with schedules, restaurants, and costs.',
      prompt: comprehensivePrompt,
      temperature: 0.7,
    });

    const result = await Promise.race([aiPromise, timeoutPromise]) as any;

    const itinerary = await result.text;
    console.log('✅ [AI-WORKFLOW] Complete itinerary generated:', itinerary?.slice(0, 200));

    if (!itinerary || itinerary.length < 100) {
      throw new Error('Generated itinerary is too short or empty');
    }

    return Response.json({
      success: true,
      workflowId,
      status: 'completed',
      completed: true,
      itinerary: {
        title: `${formData.location} Travel Itinerary`,
        destination: formData.location,
        duration: formData.plannedDays,
        travelers: formData.adults,
        content: itinerary,
        generatedBy: 'XAI Grok-4 Fast (Non-Reasoning)',
        completedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('❌ [AI-WORKFLOW] Error:', error);
    return Response.json(
      {
        success: false,
        error: 'AI workflow failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

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

    // Single comprehensive AI call using XAI Grok
    const comprehensivePrompt =
      "Create a complete " + formData.plannedDays + "-day travel itinerary for " + formData.location + ". " +
      "Travelers: " + formData.adults + " adults, " + (formData.children || 0) + " children. " +
      "Budget: $" + (formData.budget?.total || 1000) + ". " +
      "Interests: " + (formData.interests?.join(', ') || 'general sightseeing') + ". " +
      "Format as a complete, structured itinerary with: " +
      "1. Trip title and overview " +
      "2. Day-by-day detailed schedule with specific times " +
      "3. Specific restaurant recommendations with cuisine types " +
      "4. Transportation options and tips " +
      "5. Estimated daily costs breakdown " +
      "6. Packing suggestions for the season " +
      "7. Cultural tips and local customs " +
      "Make it comprehensive, practical, and ready to use.";

    console.log('🤖 [AI-WORKFLOW] Calling XAI Grok for complete itinerary generation...');
    
    const result = await streamText({
      model: xai('grok-2-latest'),
      system: 'You are an expert travel planner. Create comprehensive, detailed itineraries that are practical and actionable.',
      prompt: comprehensivePrompt,
      temperature: 0.7,
    });

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
        generatedBy: 'XAI Grok-2 Latest',
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

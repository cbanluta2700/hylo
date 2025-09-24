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
      plannedDays: formData.plannedDays,
      adults: formData.adults,
      budget: formData.budget,
    });

    // Extract and validate form data
    const location = formData.location || 'Unknown Destination';
    const plannedDays = formData.plannedDays || formData.duration || 3; // fallback to 3 days
    const adults = formData.adults || 2;
    const budget = formData.budget?.total || formData.budget || 1000;

    console.log('🔍 [AI-WORKFLOW] Extracted form data:', {
      location,
      plannedDays,
      adults,
      budget,
    });

    // Initialize XAI client
    const xai = createXai({
      apiKey: process.env.XAI_API_KEY!,
      baseURL: 'https://api.x.ai/v1',
    });

    // Optimized, concise prompt for faster processing with proper data
    const comprehensivePrompt =
      "Create a " + plannedDays + "-day travel itinerary for " + location + " for " + adults + " adults. " +
      "Budget: $" + budget + ". " +
      "Include: daily schedule with times, restaurant recommendations, transportation tips, estimated costs. " +
      "Make it specific to " + location + " and exactly " + plannedDays + " days. Be concise but comprehensive.";

    console.log('🤖 [AI-WORKFLOW] Using prompt:', comprehensivePrompt.substring(0, 150) + '...');
    
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
        title: `${location} Travel Itinerary (${plannedDays} Days)`,
        destination: location,
        duration: plannedDays,
        travelers: adults,
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

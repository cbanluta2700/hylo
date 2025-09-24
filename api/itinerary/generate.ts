import { streamText } from 'ai';
import { createXai } from '@ai-sdk/xai';

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  console.log('🚀 [GENERATE] Direct XAI workflow - bypassing corrupted ai-workflow.ts');

  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json() as any;
    const formData = body.formData || body; // Handle both nested and direct form data
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('🚀 [GENERATE] Starting XAI workflow:', {
      workflowId: workflowId.substring(0, 15) + '...',
      sessionId: body.sessionId,
      rawBodyKeys: Object.keys(body),
      location: formData.location,
      plannedDays: formData.plannedDays,
    });

    // Extract and validate form data with improved date calculation
    const location = formData.location || 'Unknown Destination';
    let plannedDays = formData.plannedDays;
    
    // Calculate days from dates if not provided
    if (!plannedDays && formData.departDate && formData.returnDate) {
      const startDate = new Date(formData.departDate);
      const endDate = new Date(formData.returnDate);
      const timeDiff = endDate.getTime() - startDate.getTime();
      plannedDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // Include both start and end days
      console.log('📅 [GENERATE] Calculated days from dates:', {
        departDate: formData.departDate,
        returnDate: formData.returnDate,
        calculatedDays: plannedDays
      });
    }
    
    plannedDays = plannedDays || 3;
    const adults = formData.adults || 2;
    const budget = formData.budget?.total || formData.budget || 1000;

    console.log('🔍 [GENERATE] Extracted form data:', {
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

    // Create optimized prompt with formatting instructions
    const comprehensivePrompt =
      `Create a ${plannedDays}-day travel itinerary for ${location} for ${adults} adults. ` +
      `Budget: $${budget}. ` +
      `FORMAT: Start directly with Day 1 (no overview). Use bullet points for activities with times. ` +
      `Include restaurant recommendations, transportation tips, estimated costs. ` +
      `End with "General Tips" section covering weather, money, culture, transportation, safety. ` +
      `Make it specific to ${location} and exactly ${plannedDays} days. Be practical and structured.`;

    console.log('🤖 [GENERATE] Using prompt:', comprehensivePrompt.substring(0, 150) + '...');
    
    const result = await streamText({
      model: xai('grok-4-fast-non-reasoning-latest'),
      system: 'You are a travel planner. Create practical, detailed itineraries with schedules, restaurants, and costs.',
      prompt: comprehensivePrompt,
      temperature: 0.7,
    });

    const itinerary = await result.text;
    console.log('✅ [GENERATE] Complete itinerary generated:', itinerary?.slice(0, 200));

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
    console.error('❌ [GENERATE] Error:', error);
    return Response.json({
      success: false,
      error: 'AI workflow failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

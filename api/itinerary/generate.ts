import { streamText } from 'ai';
import { createXai } from '@ai-sdk/xai';

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  console.log('🚀 [GENERATE] Streamlined XAI workflow - Single optimized generation');

  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json() as any;
    const formData = body.formData || body; // Handle both nested and direct form data
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('🚀 [GENERATE] Starting streamlined XAI workflow:', {
      workflowId: workflowId.substring(0, 15) + '...',
      location: formData.location,
      plannedDays: formData.plannedDays,
    });

    // Extract and validate form data with better date calculation
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
    const interests = formData.interests || [];

    console.log('🔍 [GENERATE] Extracted form data:', { location, plannedDays, adults, budget });

    // Initialize XAI client
    const xai = createXai({
      apiKey: process.env.XAI_API_KEY!,
      baseURL: 'https://api.x.ai/v1',
    });

    // Single optimized prompt for clean, parseable output
    const optimizedPrompt = `
Create a ${plannedDays}-day travel itinerary for ${location} for ${adults} adults with $${budget} budget.

REQUIREMENTS:
- Start directly with Day 1 (no overview or introduction)
- Format each day as: "Day X: [Title]" followed by activities
- Use bullet points for all activities with specific times
- Include costs, restaurants, and practical details
- End with "General Tips" section with travel advice

INTERESTS: ${interests.join(', ') || 'general sightseeing'}

FORMAT EXAMPLE:
Day 1: Arrival and [Theme]
• **9:00 AM - Activity**: Description with cost
• **12:00 PM - Lunch**: Restaurant name ($cost)
• **2:00 PM - Activity**: Description with details

Day 2: [Theme]
• **Morning activities**
• **Afternoon activities** 
• **Evening activities**

General Tips:
• Weather & Packing: [advice]
• Money & Budget: [advice]
• Culture & Etiquette: [advice]
• Transportation: [advice]
• Safety: [advice]

Keep it concise, practical, and ${location}-specific.
    `.trim();

    console.log('🤖 [GENERATE] Using optimized single-phase generation...');
    
    const result = await streamText({
      model: xai('grok-4-fast-non-reasoning-latest'),
      system: 'You are a travel planner. Create clean, structured itineraries with bullet points, specific times, costs, and practical tips. Start directly with Day 1, no introductions.',
      prompt: optimizedPrompt,
      temperature: 0.6,
    });

    const itinerary = await result.text;
    console.log('✅ [GENERATE] Itinerary generated, length:', itinerary?.length);

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
        generatedBy: 'XAI Grok-4 Fast (Optimized Single-Phase)',
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

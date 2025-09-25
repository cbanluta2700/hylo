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

    // Extract and validate form data with corrected date calculation
    const location = formData.location || 'Unknown Destination';
    let plannedDays = formData.plannedDays;
    
    // Always calculate from dates if available, override plannedDays
    if (formData.departDate && formData.returnDate) {
      const startDate = new Date(formData.departDate);
      const endDate = new Date(formData.returnDate);
      const timeDiff = endDate.getTime() - startDate.getTime();
      const calculatedDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // Include both start and end days
      
      // Use calculated days if it makes sense, otherwise use provided plannedDays
      if (calculatedDays > 0 && calculatedDays <= 30) {
        plannedDays = calculatedDays;
        console.log('📅 [GENERATE] Using calculated days from dates:', {
          departDate: formData.departDate,
          returnDate: formData.returnDate,
          calculatedDays: plannedDays,
          overridingPlannedDays: formData.plannedDays
        });
      }
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

    // Simplified prompt to avoid timeouts while ensuring 3 days
    const simplifiedPrompt = `
Create a ${plannedDays}-day travel itinerary for ${location} for ${adults} adults with $${budget} budget.

IMPORTANT: Generate exactly ${plannedDays} days (Day 1, Day 2, Day 3, etc.)

FORMAT:
Day 1: [Title]
• **9:00 AM - Activity**: Description with cost
• **12:00 PM - Lunch**: Restaurant, dish, price
• **2:00 PM - Activity**: Details with pricing
• **7:00 PM - Dinner**: Restaurant, cost

Day 2: [Title]
• **Morning/afternoon/evening activities** with times and costs

Day 3: [Title] (if ${plannedDays} >= 3)
• **Activities with times and costs**

General Tips:
• Weather & Packing: Essential items
• Money: Currency and payments
• Culture: Key etiquette
• Transport: Best options

Include specific costs in USD and restaurant names. Be concise but helpful.
    `.trim();

    console.log('🤖 [GENERATE] Using simplified generation to avoid timeouts...');
    
    const result = await streamText({
      model: xai('grok-4-fast-non-reasoning-latest'),
      system: 'You are a practical travel planner. Create concise itineraries with specific costs and restaurant names. Generate exactly the requested number of days.',
      prompt: simplifiedPrompt,
      temperature: 0.6,
    });

    // Add timeout protection
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Generation timeout after 45 seconds')), 45000)
    );

    const itinerary = await Promise.race([
      result.text,
      timeoutPromise
    ]) as string;
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
        generatedBy: 'XAI Grok-4 Fast (Simplified for Reliability)',
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

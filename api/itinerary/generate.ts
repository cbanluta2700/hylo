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

    // Balanced prompt - detailed but efficient for edge runtime
    const balancedPrompt = `
Create a ${plannedDays}-day travel itinerary for ${location} for ${adults} adults with $${budget} budget.

Trip: ${adults} adults, ${plannedDays} days, $${budget} USD, interests: ${interests.join(', ') || 'sightseeing'}

FORMAT (start with Day 1, no intro):

Day 1: [Theme]
• **9:00 AM - Activity**: Description with cost and tips
• **12:00 PM - Lunch**: Restaurant name, dish, price ($X)
• **2:00 PM - Activity**: Location, cost, what to expect  
• **5:00 PM - Activity**: Details with pricing
• **7:00 PM - Dinner**: Restaurant, specialties, cost
• **9:00 PM - Evening**: Activity or relaxation

Day 2: [Theme]  
• **Morning/Afternoon/Evening activities** with times, costs, details

Day 3: [Theme] (if applicable)
• **Activities with times and costs**

General Tips:
• Weather & Packing: Essential items for ${location}
• Money: Currency, payment methods, costs
• Culture: Key etiquette rules and customs
• Transport: Best options and costs
• Safety: Important precautions

Include specific costs in USD, restaurant names, and practical details. Keep it comprehensive but concise.
    `.trim();

    console.log('🤖 [GENERATE] Using balanced detailed generation...');
    
    const result = await streamText({
      model: xai('grok-4-fast-non-reasoning-latest'),
      system: 'You are a practical travel planner. Create detailed itineraries with specific costs, restaurant names, and useful tips. Be thorough but efficient.',
      prompt: balancedPrompt,
      temperature: 0.65,
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
        generatedBy: 'XAI Grok-4 Fast (Balanced Detailed)',
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

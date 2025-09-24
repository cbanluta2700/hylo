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

    // Enhanced single-phase prompt for comprehensive content
    const comprehensivePrompt = `
Create a detailed ${plannedDays}-day travel itinerary for ${location} for ${adults} adults with $${budget} budget.

TRAVELER PROFILE:
- Group: ${adults} adults
- Budget: $${budget} USD total
- Interests: ${interests.join(', ') || 'history, culture, food, sightseeing'}
- Duration: ${plannedDays} days

CONTENT REQUIREMENTS:
1. START directly with Day 1 (no overview paragraphs)
2. Each day should have 6-8 detailed activities with specific times
3. Include multiple restaurant recommendations per day
4. Provide specific costs in USD and local currency  
5. Add cultural context and historical background for major sites
6. Include shopping recommendations and local experiences
7. Suggest both day and evening activities
8. End with comprehensive "General Tips" section

DETAILED FORMAT for each day:
Day X: [Engaging Theme Title]
• **8:00 AM - Morning Activity**: Detailed description with specific location, entry cost ($X USD / ¥X), what to expect, and practical tips (2-3 sentences)
• **10:30 AM - Cultural Site**: Historical context, significance, visit duration, costs, and insider tips
• **12:30 PM - Lunch**: Specific restaurant name, signature dish, price range, ordering tips
• **2:00 PM - Afternoon Experience**: Detailed activity with costs, duration, and what makes it special
• **4:00 PM - Shopping/Local Culture**: Specific areas, what to buy, price ranges
• **6:30 PM - Dinner**: Restaurant recommendation with atmosphere, specialties, costs
• **8:30 PM - Evening Entertainment**: Nightlife, shows, or relaxing activities with costs
• **Daily Budget Summary**: Transport $X, Food $X, Activities $X, Shopping $X = Total $X

GENERAL TIPS (comprehensive):
• **Weather & Packing**: Seasonal advice, essential items, clothing recommendations
• **Money & Budget**: Currency, cards vs cash, tipping culture, cost-saving tips
• **Culture & Etiquette**: Important customs, dos and don'ts, social norms
• **Transportation**: Best apps, cards/passes, navigation tips, cost breakdowns
• **Safety & Health**: Emergency contacts, common concerns, health tips
• **Communication**: Language basics, useful apps, getting help
• **Food Culture**: Dining etiquette, must-try dishes, dietary restrictions help
• **Hidden Gems**: Local secrets, off-beaten-path recommendations

Make it comprehensive, engaging, and practical for ${location} specifically.
    `.trim();

    console.log('🤖 [GENERATE] Using enhanced comprehensive single-phase generation...');
    
    const result = await streamText({
      model: xai('grok-4-fast-non-reasoning-latest'),
      system: 'You are an expert travel planner who creates detailed, engaging itineraries. Provide comprehensive information with specific costs, cultural insights, and practical tips. Be thorough but well-organized.',
      prompt: comprehensivePrompt,
      temperature: 0.7,
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
        generatedBy: 'XAI Grok-4 Fast (Enhanced Comprehensive)',
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

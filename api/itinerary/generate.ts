import { streamText } from 'ai';
import { createXai } from '@ai-sdk/xai';

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  console.log('🚀 [GENERATE] Enhanced XAI workflow - Generate + Clean in 2 phases');

  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json() as any;
    const formData = body.formData || body; // Handle both nested and direct form data
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('🚀 [GENERATE] Starting enhanced XAI workflow:', {
      workflowId: workflowId.substring(0, 15) + '...',
      sessionId: body.sessionId,
      rawBodyKeys: Object.keys(body),
      location: formData.location,
      plannedDays: formData.plannedDays,
      departDate: formData.departDate,
      returnDate: formData.returnDate,
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
    const travelStyle = formData.travelStyle || {};
    const interests = formData.interests || [];
    const tripVibe = formData.tripVibe || 'adventure';
    const dinnerChoice = formData.dinnerChoice || 'local-spots';

    console.log('🔍 [GENERATE] Extracted form data:', {
      location,
      plannedDays,
      adults,
      budget,
      travelStyle,
      interests,
      tripVibe,
      dinnerChoice,
    });

    // Initialize XAI client
    const xai = createXai({
      apiKey: process.env.XAI_API_KEY!,
      baseURL: 'https://api.x.ai/v1',
    });

    // PHASE 1: Generate comprehensive itinerary with tips
    const phase1Prompt = `
Create a comprehensive ${plannedDays}-day travel itinerary for ${location} for ${adults} adults.

TRIP DETAILS:
- Destination: ${location}
- Duration: ${plannedDays} days
- Budget: $${budget} ${formData.budget?.currency || 'USD'}
- Travelers: ${adults} adults${formData.children ? `, ${formData.children} children` : ''}
- Travel Style: ${travelStyle.pace || 'moderate'} pace, ${travelStyle.accommodationType || 'mid-range'} accommodation
- Interests: ${interests.join(', ') || 'general tourism'}
- Trip Vibe: ${tripVibe}
- Dining Preference: ${dinnerChoice}

GENERATE COMPLETE ITINERARY INCLUDING:

1. DAILY ITINERARIES:
   - Day-by-day schedule with specific times
   - Restaurant recommendations with costs
   - Activity suggestions with entry fees
   - Transportation details between locations
   - Accommodation recommendations
   - Daily budget breakdown

2. COMPREHENSIVE TRAVEL TIPS:
   - Weather and packing advice specific to ${location}
   - Money and budget tips (currency, payment methods, cost-saving)
   - Cultural etiquette and local customs
   - Transportation recommendations (local transit, apps, cards)
   - Safety and health considerations
   - Food recommendations and dining culture
   - Shopping and souvenir suggestions
   - Communication tips (language, useful phrases, apps)

Make it detailed, practical, and specific to ${location} with exact costs in ${formData.budget?.currency || 'USD'}.
    `.trim();

    console.log('🤖 [GENERATE] Phase 1: Generating comprehensive content...');
    
    const phase1Result = await streamText({
      model: xai('grok-4-fast-non-reasoning-latest'),
      system: 'You are an expert travel planner. Create detailed, practical itineraries with schedules, costs, tips, and recommendations. Be specific and comprehensive.',
      prompt: phase1Prompt,
      temperature: 0.7,
    });

    const rawItinerary = await phase1Result.text;
    console.log('✅ [GENERATE] Phase 1 complete - Raw content length:', rawItinerary?.length);

    if (!rawItinerary || rawItinerary.length < 200) {
      throw new Error('Phase 1 generated content is too short');
    }

    if (!rawItinerary || rawItinerary.length < 200) {
      throw new Error('Phase 1 generated content is too short');
    }

    // PHASE 2: Clean and format the itinerary for better parsing
    const phase2Prompt = `
Take this travel itinerary and reformat it to be clean and easily parseable:

ORIGINAL CONTENT:
${rawItinerary}

REFORMAT REQUIREMENTS:
1. REMOVE overview/introduction paragraphs - start directly with Day 1
2. STRUCTURE daily itineraries as:
   - Day X: [Title/Theme]
   - Theme: [Brief description]
   - Morning section with bullet points
   - Afternoon section with bullet points  
   - Evening section with bullet points

3. EXTRACT all travel tips into a separate "General Tips" section at the end
4. USE bullet points for all activities (no numbered lists)
5. KEEP all costs, restaurant names, and specific details
6. REMOVE any redundant accommodation/transportation overviews
7. MAKE it mobile-friendly and scannable

Format activities as:
• **Time - Activity**: Description with costs and details

End with:
**General Tips**:
• Weather & Packing: [advice]
• Money & Budget: [advice]  
• Culture & Etiquette: [advice]
• Transportation: [advice]
• Safety & Health: [advice]
    `.trim();

    console.log('🤖 [GENERATE] Phase 2: Cleaning and formatting content...');
    
    const phase2Result = await streamText({
      model: xai('grok-4-fast-non-reasoning-latest'),
      system: 'You are a content formatter. Take raw travel content and make it clean, structured, and easily parseable with consistent formatting.',
      prompt: phase2Prompt,
      temperature: 0.3, // Lower temperature for consistent formatting
    });

    const cleanItinerary = await phase2Result.text;
    console.log('✅ [GENERATE] Phase 2 complete - Cleaned content length:', cleanItinerary?.length);

    if (!cleanItinerary || cleanItinerary.length < 100) {
      throw new Error('Phase 2 generated content is too short or empty');
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
        content: cleanItinerary,
        generatedBy: 'XAI Grok-4 Fast (2-Phase: Generate + Clean)',
        completedAt: new Date().toISOString(),
        phases: {
          phase1Length: rawItinerary.length,
          phase2Length: cleanItinerary.length,
          improvement: 'Cleaned and structured for better parsing'
        }
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

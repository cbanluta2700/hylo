/**
 * Generate Personalized Travel Tips - XAI Grok
 * Creates personalized travel tips based on form data and generated itinerary
 */

import { streamText } from 'ai';
import { createXai } from '@ai-sdk/xai';

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { formData, aiItinerary } = await request.json() as any;

    console.log('🎯 [TIPS-API] Starting personalized tips generation:', {
      location: formData?.location,
      duration: aiItinerary?.duration,
      travelers: formData?.adults,
      budget: formData?.budget?.total,
    });

    // Initialize XAI client
    const xai = createXai({
      apiKey: process.env.XAI_API_KEY!,
      baseURL: 'https://api.x.ai/v1',
    });

    // Create personalized tips prompt based on form data
    const tipsPrompt = `
Create personalized travel tips for this trip:

TRIP DETAILS:
- Destination: ${formData?.location || 'Unknown'}
- Duration: ${aiItinerary?.duration || formData?.plannedDays || '3'} days
- Travelers: ${formData?.adults || 2} adults${formData?.children ? `, ${formData.children} children` : ''}
- Budget: $${formData?.budget?.total || formData?.budget || '1000'} ${formData?.budget?.currency || 'USD'}
- Travel Style: ${formData?.travelStyle?.pace || 'moderate'} pace, ${formData?.travelStyle?.accommodationType || 'mid-range'} accommodation
- Interests: ${formData?.interests?.join(', ') || 'general tourism'}
- Flexible Budget: ${formData?.budget?.flexibility === 'flexible' || formData?.budget?.flexibility === 'very-flexible' ? 'Yes' : 'No'}
- Flexible Dates: ${formData?.flexibleDates ? 'Yes' : 'No'}

GENERATE 5-8 PERSONALIZED TIPS INCLUDING:
1. Money-saving tips specific to ${formData?.location}
2. Cultural etiquette and customs
3. Transportation recommendations
4. Packing suggestions for the climate/season
5. Safety and health considerations
6. Local food recommendations
7. Hidden gems or local secrets
8. Communication tips (language/apps)

Format: Use clear headings and bullet points. Keep each tip practical and actionable. Make it specific to their destination, budget, and travel style.
    `.trim();

    console.log('🤖 [TIPS-API] Generating tips with XAI Grok...');
    
    const result = await streamText({
      model: xai('grok-4-fast-non-reasoning-latest'),
      system: 'You are a knowledgeable travel expert who provides practical, personalized travel tips. Focus on actionable advice specific to the destination and traveler preferences.',
      prompt: tipsPrompt,
      temperature: 0.7,
    });

    const tips = await result.text;
    console.log('✅ [TIPS-API] Tips generated successfully:', tips?.slice(0, 200));

    if (!tips || tips.length < 50) {
      throw new Error('Generated tips are too short or empty');
    }

    return Response.json({
      success: true,
      tips,
      generatedBy: 'XAI Grok-4 Fast (Non-Reasoning)',
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ [TIPS-API] Error:', error);
    return Response.json(
      {
        success: false,
        error: 'Tips generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
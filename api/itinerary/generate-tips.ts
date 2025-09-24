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

    console.log('🎯 [TIPS-API] Checking if tips already included in itinerary:', {
      location: formData?.location,
      duration: aiItinerary?.duration,
      contentLength: aiItinerary?.content?.length,
      hasGeneralTips: aiItinerary?.content?.includes('General Tips'),
    });

    // Check if tips are already included in the itinerary
    if (aiItinerary?.content?.includes('General Tips') || aiItinerary?.content?.includes('Final Tips')) {
      console.log('✅ [TIPS-API] Tips already included in itinerary - skipping generation');
      return Response.json({
        success: true,
        tips: 'Tips already included in main itinerary',
        generatedBy: 'Extracted from main itinerary (2-phase generation)',
        generatedAt: new Date().toISOString(),
        skipped: true,
      });
    }

    // Initialize XAI client
    const xai = createXai({
      apiKey: process.env.XAI_API_KEY!,
      baseURL: 'https://api.x.ai/v1',
    });

    // Create personalized tips prompt based on form data
    const tipsPrompt = `
Create a CONCISE travel tips summary for this trip:

TRIP DETAILS:
- Destination: ${formData?.location || 'Unknown'}
- Duration: ${aiItinerary?.duration || formData?.plannedDays || '3'} days
- Travelers: ${formData?.adults || 2} adults${formData?.children ? `, ${formData.children} children` : ''}
- Budget: $${formData?.budget?.total || formData?.budget || '1000'} ${formData?.budget?.currency || 'USD'}
- Travel Style: ${formData?.travelStyle?.pace || 'moderate'} pace, ${formData?.travelStyle?.accommodationType || 'mid-range'} accommodation
- Interests: ${formData?.interests?.join(', ') || 'general tourism'}
- Trip Vibe: ${formData?.tripVibe || 'adventure'}
- Travel Experience: ${formData?.travelExperience || 'experienced'}
- Dining Preference: ${formData?.dinnerChoice || 'local-spots'}

CREATE A SIMPLE 5-POINT SUMMARY:
1. **Weather & Packing**: Brief climate info and essential items
2. **Money & Budget**: Currency, payment methods, cost-saving tip
3. **Culture & Etiquette**: 2-3 key cultural dos/don'ts
4. **Transportation**: Best way to get around locally  
5. **Safety & Health**: One key safety/health consideration

Keep each point to 1-2 sentences max. Be practical and destination-specific.
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
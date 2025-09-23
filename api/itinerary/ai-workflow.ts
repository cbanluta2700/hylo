/**
 * Direct AI SDK Workflow - No Inngest
 * Simple, reliable AI itinerary generation
 */

import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createXai } from '@ai-sdk/xai';

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const formData = body as any; // Simple casting for MVP
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('🚀 [AI-WORKFLOW] Starting direct AI workflow:', {
      workflowId: workflowId.substring(0, 15) + '...',
      location: formData.location,
    });

    // Initialize AI clients
    const xai = createXai({
      apiKey: process.env.XAI_API_KEY!,
      baseURL: 'https://api.x.ai/v1',
    });

    // Step 1: Architecture Planning with XAI Grok-4
    console.log('🏗️ [AI-WORKFLOW] Step 1: Architecture planning with XAI Grok-4');

    const architectureResult = await streamText({
      model: xai('grok-4-fast-reasoning-latest'),
      system: 'You are a travel architecture planner. Create a detailed travel plan structure.',
      prompt: `Create a ${formData.plannedDays}-day travel itinerary architecture for ${
        formData.location
      }. 
               Travelers: ${formData.adults} adults, ${formData.children || 0} children.
               Budget: $${formData.budget?.total || 1000}
               Interests: ${formData.interests?.join(', ') || 'general sightseeing'}
               
               Provide a structured daily plan with themes, timing, and logistics.`,
      temperature: 0.7,
    });

    const architecture = await architectureResult.text;
    console.log('✅ [AI-WORKFLOW] Step 1 completed');

    // Step 2: Information Gathering with OpenAI GPT-OSS-120B
    console.log('🌐 [AI-WORKFLOW] Step 2: Information gathering with OpenAI GPT-OSS-120B');

    const gatheringResult = await streamText({
      model: openai('gpt-oss-120b'),
      system: 'You are a travel research specialist. Find specific attractions and activities.',
      prompt: `Based on this architecture: ${architecture.slice(0, 500)}...
               
               Research and find specific:
               - Attractions and landmarks in ${formData.location}
               - Restaurants and local cuisine
               - Transportation options
               - Cultural activities
               - Practical travel tips
               
               Focus on ${formData.interests?.join(', ') || 'popular attractions'}.`,
      temperature: 0.6,
    });

    const gatheredInfo = await gatheringResult.text;
    console.log('✅ [AI-WORKFLOW] Step 2 completed');

    // Step 3: Specialist Processing with OpenAI GPT-OSS-120B
    console.log('👨‍💼 [AI-WORKFLOW] Step 3: Specialist curation with OpenAI GPT-OSS-120B');

    const specialistResult = await streamText({
      model: openai('gpt-oss-120b'),
      system: 'You are a travel specialist. Curate personalized recommendations.',
      prompt: `Architecture: ${architecture.slice(0, 300)}...
               Research: ${gatheredInfo.slice(0, 500)}...
               
               Curate the best recommendations for:
               - ${formData.adults} adults traveling to ${formData.location}
               - Budget: $${formData.budget?.total || 1000}
               - Interests: ${formData.interests?.join(', ') || 'general'}
               
               Select the most suitable activities, restaurants, and experiences.`,
      temperature: 0.5,
    });

    const curatedRecommendations = await specialistResult.text;
    console.log('✅ [AI-WORKFLOW] Step 3 completed');

    // Step 4: Final Formatting with XAI Grok-4 (non-reasoning)
    console.log('✨ [AI-WORKFLOW] Step 4: Final formatting with XAI Grok-4');

    const formattingResult = await streamText({
      model: xai('grok-4-fast-non-reasoning-latest'),
      system: 'You are a travel itinerary formatter. Create beautiful, structured itineraries.',
      prompt: `Create a final, beautifully formatted travel itinerary:
               
               Architecture: ${architecture.slice(0, 200)}...
               Research: ${gatheredInfo.slice(0, 200)}...  
               Recommendations: ${curatedRecommendations.slice(0, 300)}...
               
               Format as a complete itinerary with:
               - Trip title and summary
               - Day-by-day schedule with times
               - Restaurant recommendations
               - Transportation tips
               - Total estimated costs
               - Packing suggestions
               
               Location: ${formData.location}
               Duration: ${formData.plannedDays} days
               Travelers: ${formData.adults} adults`,
      temperature: 0.3,
    });

    const finalItinerary = await formattingResult.text;
    console.log('✅ [AI-WORKFLOW] Step 4 completed');

    // Return the complete itinerary
    console.log('🎉 [AI-WORKFLOW] Multi-AI workflow completed successfully!');

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
        content: finalItinerary,
        architecture,
        research: gatheredInfo,
        recommendations: curatedRecommendations,
        generatedBy: 'Multi-AI Pipeline (XAI Grok-4 + OpenAI GPT-OSS-120B)',
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

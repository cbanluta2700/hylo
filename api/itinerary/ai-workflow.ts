/**
 * Simple AI Workflow - XAI + Groq
 * XAI for architecture, Groq for refinement and formatting
 */

import { streamText } from 'ai';
import { groq } from '@ai-sdk/groq';
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
    let architecture = '';
    let architectureResult: any = null;
    try {
      const architecturePrompt =
        "Create a " + formData.plannedDays + "-day travel itinerary architecture for " + formData.location + ". " +
        "Travelers: " + formData.adults + " adults, " + (formData.children || 0) + " children. " +
        "Budget: $" + (formData.budget?.total || 1000) + ". " +
        "Interests: " + (formData.interests?.join(', ') || 'general sightseeing') + ". " +
        "Provide a structured daily plan with themes, timing, and logistics.";
      architectureResult = await streamText({
        model: xai('grok-4-fast-reasoning-latest'),
        system: 'You are a travel architecture planner. Create a detailed travel plan structure.',
        prompt: architecturePrompt,
        temperature: 0.7,
      });
      architecture = await architectureResult.text;
      console.log('✅ [AI-WORKFLOW] Step 1 completed:', architecture?.slice(0, 200));
    } catch (err) {
      console.error('❌ [AI-WORKFLOW] Step 1 AI SDK error:', err, architectureResult);
      return Response.json({ success: false, error: 'AI workflow failed', details: 'Step 1 (architecture) failed', sdkError: String(err), sdkResponse: architectureResult }, { status: 500 });
    }

    // Step 2: Information Gathering with OpenAI GPT-OSS-120B
    let gatheredInfo = '';
    let gatheringResult: any = null;
    try {
      const gatheringPrompt =
        "Based on this architecture: " + architecture.slice(0, 500) + "... " +
        "Research and find specific: " +
        "- Attractions and landmarks in " + formData.location + " " +
        "- Restaurants and local cuisine " +
        "- Transportation options " +
        "- Cultural activities " +
        "- Practical travel tips " +
        "Focus on " + (formData.interests?.join(', ') || 'popular attractions') + ".";
      gatheringResult = await streamText({
        model: groq('llama-3.3-70b-versatile'),
        system: 'You are a travel research specialist. Find specific attractions and activities.',
        prompt: gatheringPrompt,
        temperature: 0.6,
      });
      gatheredInfo = await gatheringResult.text;
      console.log('✅ [AI-WORKFLOW] Step 2 completed:', gatheredInfo?.slice(0, 200));
    } catch (err) {
      console.error('❌ [AI-WORKFLOW] Step 2 AI SDK error:', err, gatheringResult);
      return Response.json({ success: false, error: 'AI workflow failed', details: 'Step 2 (gathering) failed', sdkError: String(err), sdkResponse: gatheringResult }, { status: 500 });
    }

    // Step 3: Specialist Processing with OpenAI GPT-OSS-120B
    let curatedRecommendations = '';
    let specialistResult: any = null;
    try {
      const specialistPrompt =
        "Architecture: " + architecture.slice(0, 300) + "... " +
        "Research: " + gatheredInfo.slice(0, 500) + "... " +
        "Curate the best recommendations for: " +
        "- " + formData.adults + " adults traveling to " + formData.location + " " +
        "- Budget: $" + (formData.budget?.total || 1000) + " " +
        "- Interests: " + (formData.interests?.join(', ') || 'general') + " " +
        "Select the most suitable activities, restaurants, and experiences.";
      specialistResult = await streamText({
        model: groq('llama-3.3-70b-versatile'),
        system: 'You are a travel specialist. Curate personalized recommendations.',
        prompt: specialistPrompt,
        temperature: 0.5,
      });
      curatedRecommendations = await specialistResult.text;
      console.log('✅ [AI-WORKFLOW] Step 3 completed:', curatedRecommendations?.slice(0, 200));
    } catch (err) {
      console.error('❌ [AI-WORKFLOW] Step 3 AI SDK error:', err, specialistResult);
      return Response.json({ success: false, error: 'AI workflow failed', details: 'Step 3 (specialist) failed', sdkError: String(err), sdkResponse: specialistResult }, { status: 500 });
    }

    // Step 4: Final Formatting with XAI Grok-4 (non-reasoning)
    let finalItinerary = '';
    let formattingResult: any = null;
    try {
      const formattingPrompt =
        "Create a final, beautifully formatted travel itinerary: " +
        "Architecture: " + architecture.slice(0, 200) + "... " +
        "Research: " + gatheredInfo.slice(0, 200) + "... " +
        "Recommendations: " + curatedRecommendations.slice(0, 300) + "... " +
        "Format as a complete itinerary with: " +
        "- Trip title and summary " +
        "- Day-by-day schedule with times " +
        "- Restaurant recommendations " +
        "- Transportation tips " +
        "- Total estimated costs " +
        "- Packing suggestions " +
        "Location: " + formData.location + " " +
        "Duration: " + formData.plannedDays + " days " +
        "Travelers: " + formData.adults + " adults.";
      formattingResult = await streamText({
        model: xai('grok-4-fast-non-reasoning-latest'),
        system: 'You are a travel itinerary formatter. Create beautiful, structured itineraries.',
        prompt: formattingPrompt,
        temperature: 0.3,
      });
      finalItinerary = await formattingResult.text;
      console.log('✅ [AI-WORKFLOW] Step 4 completed:', finalItinerary?.slice(0, 200));
    } catch (err) {
      console.error('❌ [AI-WORKFLOW] Step 4 AI SDK error:', err, formattingResult);
      return Response.json({ success: false, error: 'AI workflow failed', details: 'Step 4 (formatting) failed', sdkError: String(err), sdkResponse: formattingResult }, { status: 500 });
    }

    // Return the complete itinerary
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

/**/**/**

 * Simple AI Workflow - XAI Grok Only

 */ * Simple AI Workflow - XAI Grok Only * Simple   try {



import { streamText } from 'ai'; * Uses XAI Grok for fast, high-quality itinerary generation    const body = await request.json() as any;

import { createXai } from '@ai-sdk/xai';

 */    const formData = body.formData || body; // Handle both nested and direct form data

export const config = { runtime: 'edge' };

    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export default async function handler(request: Request): Promise<Response> {

  if (request.method !== 'POST') {import { streamText } from 'ai';

    return Response.json({ error: 'Method not allowed' }, { status: 405 });

  }import { createXai } from '@ai-sdk/xai';    console.log('🚀 [AI-WORKFLOW] Starting single-call AI workflow:', {



  try {      workflowId: workflowId.substring(0, 15) + '...',

    const body = await request.json() as any;

    const formData = body.formData || body;export const config = { runtime: 'edge' };      sessionId: body.sessionId,

    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      rawBody: body,

    console.log('🚀 [AI-WORKFLOW] Starting single-call AI workflow:', {

      workflowId: workflowId.substring(0, 15) + '...',export default async function handler(request: Request): Promise<Response> {      location: formData.location,

      sessionId: body.sessionId,

      rawBodyKeys: Object.keys(body),  if (request.method !== 'POST') {      plannedDays: formData.plannedDays,

      location: formData.location,

      plannedDays: formData.plannedDays,    return Response.json({ error: 'Method not allowed' }, { status: 405 });      adults: formData.adults,

    });

  }      budget: formData.budget,

    const location = formData.location || 'Unknown Destination';

    const plannedDays = formData.plannedDays || 3;/**

    const adults = formData.adults || 2;

    const budget = formData.budget?.total || formData.budget || 1000;  try { * Simple AI Workflow - XAI Grok Only



    console.log('🔍 [AI-WORKFLOW] Extracted form data:', {    const body = await request.json() as any; * Uses XAI Grok for fast, high-quality itinerary generation

      location,

      plannedDays,    const formData = body.formData || body; // Handle both nested and direct form data */

      adults,

      budget,    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    });

import { streamText } from 'ai';

    const xai = createXai({

      apiKey: process.env.XAI_API_KEY!,    console.log('🚀 [AI-WORKFLOW] Starting single-call AI workflow:', {import { createXai } from '@ai-sdk/xai';

      baseURL: 'https://api.x.ai/v1',

    });      workflowId: workflowId.substring(0, 15) + '...',



    const comprehensivePrompt =      sessionId: body.sessionId,export const config = { runtime: 'edge' };

      `Create a ${plannedDays}-day travel itinerary for ${location} for ${adults} adults. ` +

      `Budget: $${budget}. ` +      rawBodyKeys: Object.keys(body),

      `Include: daily schedule with times, restaurant recommendations, transportation tips, estimated costs. ` +

      `Make it specific to ${location} and exactly ${plannedDays} days. Be concise but comprehensive.`;      location: formData.location,export default async function handler(request: Request): Promise<Response> {



    console.log('🤖 [AI-WORKFLOW] Using prompt:', comprehensivePrompt.substring(0, 150) + '...');      plannedDays: formData.plannedDays,  if (request.method !== 'POST') {

    

    const result = await streamText({      adults: formData.adults,    return Response.json({ error: 'Method not allowed' }, { status: 405 });

      model: xai('grok-4-fast-non-reasoning-latest'),

      system: 'You are a travel planner. Create practical, detailed itineraries with schedules, restaurants, and costs.',      budget: formData.budget,  }

      prompt: comprehensivePrompt,

      temperature: 0.7,    });

    });

  try {

    const itinerary = await result.text;

    console.log('✅ [AI-WORKFLOW] Complete itinerary generated:', itinerary?.slice(0, 200));    // Extract and validate form data    const body = await request.json() as any;



    if (!itinerary || itinerary.length < 100) {    const location = formData.location || 'Unknown Destination';    const formData = body.formData || body; // Handle both nested and direct form data

      throw new Error('Generated itinerary is too short or empty');

    }    const plannedDays = formData.plannedDays || formData.duration || 3; // fallback to 3 days    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;



    return Response.json({    const adults = formData.adults || 2;

      success: true,

      workflowId,    const budget = formData.budget?.total || formData.budget || 1000;    console.log('🚀 [AI-WORKFLOW] Starting single-call AI workflow:', {

      status: 'completed',

      completed: true,      workflowId: workflowId.substring(0, 15) + '...',

      itinerary: {

        title: `${location} Travel Itinerary (${plannedDays} Days)`,    console.log('🔍 [AI-WORKFLOW] Extracted form data:', {      sessionId: body.sessionId,

        destination: location,

        duration: plannedDays,      location,      rawBody: body,

        travelers: adults,

        content: itinerary,      plannedDays,      location: formData.location,

        generatedBy: 'XAI Grok-4 Fast (Non-Reasoning)',

        completedAt: new Date().toISOString(),      adults,      plannedDays: formData.plannedDays,

      },

    });      budget,      adults: formData.adults,



  } catch (error) {    });      budget: formData.budget,

    console.error('❌ [AI-WORKFLOW] Error:', error);

    return Response.json(    });

      {

        success: false,    // Initialize XAI client    });

        error: 'AI workflow failed',

        details: error instanceof Error ? error.message : 'Unknown error',    const xai = createXai({

      },

      { status: 500 }      apiKey: process.env.XAI_API_KEY!,    // Extract and validate form data

    );

  }      baseURL: 'https://api.x.ai/v1',    const location = formData.location || 'Unknown Destination';

}
    });    const plannedDays = formData.plannedDays || formData.duration || 3; // fallback to 3 days

    const adults = formData.adults || 2;

    // Optimized, concise prompt for faster processing with proper data    const budget = formData.budget?.total || formData.budget || 1000;

    const comprehensivePrompt =

      "Create a " + plannedDays + "-day travel itinerary for " + location + " for " + adults + " adults. " +    console.log('🔍 [AI-WORKFLOW] Extracted form data:', {

      "Budget: $" + budget + ". " +      location,

      "Include: daily schedule with times, restaurant recommendations, transportation tips, estimated costs. " +      plannedDays,

      "Make it specific to " + location + " and exactly " + plannedDays + " days. Be concise but comprehensive.";      adults,

      budget,

    console.log('🤖 [AI-WORKFLOW] Using prompt:', comprehensivePrompt.substring(0, 150) + '...');    });

    console.log('🤖 [AI-WORKFLOW] Calling XAI Grok for complete itinerary generation...');

        // Initialize XAI client

    // Add timeout wrapper to prevent long hanging (4 minutes max)    const xai = createXai({

    const timeoutPromise = new Promise((_, reject) =>       apiKey: process.env.XAI_API_KEY!,

      setTimeout(() => reject(new Error('AI request timed out after 4 minutes')), 4 * 60 * 1000)      baseURL: 'https://api.x.ai/v1',

    );    });

    

    const aiPromise = streamText({    // Optimized, concise prompt for faster processing with proper data

      model: xai('grok-4-fast-non-reasoning-latest'),    const comprehensivePrompt =

      system: 'You are a travel planner. Create practical, detailed itineraries with schedules, restaurants, and costs.',      "Create a " + plannedDays + "-day travel itinerary for " + location + " for " + adults + " adults. " +

      prompt: comprehensivePrompt,      "Budget: $" + budget + ". " +

      temperature: 0.7,      "Include: daily schedule with times, restaurant recommendations, transportation tips, estimated costs. " +

    });      "Make it specific to " + location + " and exactly " + plannedDays + " days. Be concise but comprehensive.";



    const result = await Promise.race([aiPromise, timeoutPromise]) as any;    console.log('🤖 [AI-WORKFLOW] Using prompt:', comprehensivePrompt.substring(0, 150) + '...');

    

    const itinerary = await result.text;    // Add timeout wrapper to prevent long hanging (4 minutes max)

    console.log('✅ [AI-WORKFLOW] Complete itinerary generated:', itinerary?.slice(0, 200));    const timeoutPromise = new Promise((_, reject) => 

      setTimeout(() => reject(new Error('AI request timed out after 4 minutes')), 4 * 60 * 1000)

    if (!itinerary || itinerary.length < 100) {    );

      throw new Error('Generated itinerary is too short or empty');    

    }    const aiPromise = streamText({

      model: xai('grok-4-fast-non-reasoning-latest'),

    return Response.json({      system: 'You are a travel planner. Create practical, detailed itineraries with schedules, restaurants, and costs.',

      success: true,      prompt: comprehensivePrompt,

      workflowId,      temperature: 0.7,

      status: 'completed',    });

      completed: true,

      itinerary: {    const result = await Promise.race([aiPromise, timeoutPromise]) as any;

        title: `${location} Travel Itinerary (${plannedDays} Days)`,

        destination: location,    const itinerary = await result.text;

        duration: plannedDays,    console.log('✅ [AI-WORKFLOW] Complete itinerary generated:', itinerary?.slice(0, 200));

        travelers: adults,

        content: itinerary,    if (!itinerary || itinerary.length < 100) {

        generatedBy: 'XAI Grok-4 Fast (Non-Reasoning)',      throw new Error('Generated itinerary is too short or empty');

        completedAt: new Date().toISOString(),    }

      },

    });    return Response.json({

      success: true,

  } catch (error) {      workflowId,

    console.error('❌ [AI-WORKFLOW] Error:', error);      status: 'completed',

    return Response.json(      completed: true,

      {      itinerary: {

        success: false,        title: `${location} Travel Itinerary (${plannedDays} Days)`,

        error: 'AI workflow failed',        destination: location,

        details: error instanceof Error ? error.message : 'Unknown error',        duration: plannedDays,

      },        travelers: adults,

      { status: 500 }        content: itinerary,

    );        generatedBy: 'XAI Grok-4 Fast (Non-Reasoning)',

  }        completedAt: new Date().toISOString(),

}      },
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

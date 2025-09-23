export const config = { runtime: 'edge' };

import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createXai } from '@ai-sdk/xai';

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = (await request.json()) as {
      workflowId: string;
      step: string;
      prompt: string;
      model: string;
    };

    const { workflowId, step, prompt, model } = body;

    console.log(`🔄 [AI-STREAM] Starting ${step} with ${model}`);

    // Initialize the appropriate AI client
    let aiClient;
    if (model.includes('grok')) {
      const xai = createXai({
        apiKey: process.env.XAI_API_KEY!,
        baseURL: 'https://api.x.ai/v1',
      });
      aiClient = xai(model);
    } else {
      aiClient = openai(model);
    }

    // Stream the AI response
    const result = streamText({
      model: aiClient,
      system: `You are a travel AI agent working on ${step}. Provide detailed, helpful responses.`,
      prompt: prompt,
      temperature: 0.7,
    });

    console.log(`🚀 [AI-STREAM] ${model} started for ${step}`);

    // Return the streaming response directly
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('❌ [AI-STREAM] Error:', error);
    return Response.json(
      {
        error: 'AI streaming failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

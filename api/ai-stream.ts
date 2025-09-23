export const config = { runtime: 'edge' };

import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createXai } from '@ai-sdk/xai';

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { workflowId, step, prompt, model } = await request.json();

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

    // Return streaming response
    return result.toDataStreamResponse({
      onStart: () => {
        console.log(`🚀 [AI-STREAM] ${model} started for ${step}`);
      },
      onToken: (token) => {
        console.log(`📝 [AI-STREAM] ${model}: ${token}`);
      },
      onCompletion: (completion) => {
        console.log(`✅ [AI-STREAM] ${model} completed ${step}:`, completion.slice(0, 100) + '...');
      },
    });
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

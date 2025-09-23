/**
 * Inngest API Endpoint for Vercel Edge Runtime
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - Proper Inngest webhook integration
 *
 * Following Inngest documentation pattern for API route setup
 */

import { serve } from 'inngest/express';
import { inngest, generateItineraryFunction } from '../../src/lib/inngest/functions.js';

// Runtime configuration for Vercel Edge
export const config = {
  runtime: 'edge',
};

// Create the Inngest serve handler
const inngestHandler = serve({
  client: inngest,
  functions: [generateItineraryFunction],
});

export default async function handler(request: Request): Promise<Response> {
  console.log('🎯 [146] Inngest Webhook: Request received', {
    method: request.method,
    url: request.url,
    timestamp: new Date().toISOString(),
  });

  try {
    // Convert Request to Express-like request for inngest serve
    const response = await inngestHandler(request as any, {} as any);

    console.log('✅ [147] Inngest Webhook: Handler executed successfully');

    return response;
  } catch (error) {
    console.error('💥 [148] Inngest Webhook: Handler failed:', error);

    return Response.json(
      {
        success: false,
        error: 'Inngest webhook handler failed',
        code: 'INNGEST_ERROR',
      },
      { status: 500 }
    );
  }
}

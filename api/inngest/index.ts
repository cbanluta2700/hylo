/**
 * Inngest API Route for Vercel Edge Runtime (TypeScript/Vite, NOT Next.js)
 * Manual handler since we're not using Next.js App Router
 */

import { inngest, generateItineraryFunction } from '../../src/inngest/functions.js';

// Edge Runtime configuration for Vercel
export const config = {
  runtime: 'edge',
};

// Manual Inngest handler for non-Next.js Vercel functions
export default async function handler(request: Request): Promise<Response> {
  console.log('🔌 [INNGEST] Handler called', {
    method: request.method,
    url: request.url,
    timestamp: new Date().toISOString(),
  });

  // For GET requests, return Inngest function registration
  if (request.method === 'GET') {
    return Response.json({
      functions: [
        {
          id: generateItineraryFunction.id,
          name: 'generate-itinerary',
          status: 'registered',
        },
      ],
      client: inngest.id,
      timestamp: new Date().toISOString(),
    });
  }

  // For POST requests, handle webhook from Inngest
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      console.log('📨 [INNGEST] Webhook received:', body);

      // This would typically be handled by Inngest's serve function
      // For now, return success to confirm webhook is accessible
      return Response.json({
        success: true,
        message: 'Webhook received',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('💥 [INNGEST] Webhook error:', error);
      return Response.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

/**
 * Simple Inngest webhook endpoint for Vercel Edge Runtime
 * Following constitutional Edge-First Architecture
 */

import { inngest } from '../../src/inngest/functions.js';

// Edge Runtime configuration
export const config = {
  runtime: 'edge',
};

// Simple webhook handler
export default async function handler(request: Request): Promise<Response> {
  console.log('🚀 [110] Inngest API: Request received', {
    method: request.method,
    url: request.url,
  });

  // Handle GET for registration
  if (request.method === 'GET') {
    return Response.json({
      message: 'Inngest endpoint active',
      client: inngest.id,
    });
  }

  // Handle POST for webhook
  if (request.method === 'POST') {
    return Response.json({
      status: 'received',
      message: 'Webhook acknowledged',
    });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

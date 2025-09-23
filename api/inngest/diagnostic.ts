/**
 * Inngest Diagnostic Endpoint
 * Check Inngest configuration and authentication
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  console.log('🔍 [Inngest-Diagnostic] Checking Inngest configuration');

  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    inngest: {
      hasEventKey: !!process.env.INNGEST_EVENT_KEY,
      hasSigningKey: !!process.env.INNGEST_SIGNING_KEY,
      eventKeyLength: process.env.INNGEST_EVENT_KEY?.length || 0,
      signingKeyLength: process.env.INNGEST_SIGNING_KEY?.length || 0,
      eventKeyPreview: process.env.INNGEST_EVENT_KEY?.substring(0, 10) + '...' || 'missing',
      signingKeyPreview: process.env.INNGEST_SIGNING_KEY?.substring(0, 10) + '...' || 'missing',
    },
    vercel: {
      hasVercelEnv: !!process.env.VERCEL,
      vercelEnv: process.env.VERCEL_ENV || 'unknown',
      region: process.env.VERCEL_REGION || 'unknown',
      url: process.env.VERCEL_URL || 'unknown',
    },
    redis: {
      hasKvUrl: !!process.env.KV_REST_API_URL,
      hasKvToken: !!process.env.KV_REST_API_TOKEN,
    },
  };

  console.log('🔍 [Inngest-Diagnostic] Results:', diagnostics);

  return Response.json(diagnostics, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
/**
 * Test routing endpoint to verify deployment
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  console.log('🧪 [TEST-ROUTING] Endpoint working!', {
    method: request.method,
    url: request.url,
    timestamp: new Date().toISOString(),
  });

  return Response.json({
    success: true,
    message: 'Test routing endpoint is working',
    method: request.method,
    timestamp: new Date().toISOString(),
    deployment: 'verified',
  });
}

export async function GET(request: Request) {
  return handler(request);
}

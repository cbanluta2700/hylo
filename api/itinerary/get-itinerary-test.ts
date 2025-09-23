/**
 * Simple test endpoint for get-itinerary
 * Following constitutional rule: Edge-First Architecture
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  console.log('🔍 [Get-Itinerary-Test] Handler called', {
    method: request.method,
    url: request.url,
  });

  if (request.method !== 'GET') {
    return Response.json({ success: false, error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const workflowId = url.searchParams.get('workflowId');

    console.log('🔍 [Get-Itinerary-Test] WorkflowId:', workflowId);

    if (!workflowId) {
      return Response.json(
        { success: false, error: 'workflowId parameter is required' },
        { status: 400 }
      );
    }

    // Simple test response without dependencies
    return Response.json({
      success: false,
      message: 'Test endpoint working - but workflow not implemented yet',
      workflowId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('💥 [Get-Itinerary-Test] Error:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handler(request);
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

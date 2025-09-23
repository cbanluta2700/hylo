export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return Response.json({ success: false, error: 'Method not allowed' }, { status: 405 });
  }

  const url = new URL(request.url);
  const workflowId = url.searchParams.get('workflowId');

  if (!workflowId) {
    return Response.json({ success: false, error: 'Workflow ID required' }, { status: 400 });
  }

  return Response.json({
    success: true,
    workflowId,
    status: 'processing',
    completed: false,
    itinerary: null,
  });
}

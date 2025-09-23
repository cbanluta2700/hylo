export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  console.log('?? [GENERATE] Direct AI workflow - no Inngest');

  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const formData = await request.json();
    console.log('?? [GENERATE] Calling AI workflow directly...');

    // Call AI workflow endpoint directly  
    const workflowUrl = new URL(request.url);
    workflowUrl.pathname = '/api/itinerary/ai-workflow';

    const response = await fetch(workflowUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    console.log('? [GENERATE] AI workflow completed!');
    
    return Response.json(result);
  } catch (error) {
    return Response.json({ success: false, error: 'AI workflow failed' }, { status: 500 });
  }
}

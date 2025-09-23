/**
 * Get Itinerary Results API Endpoint
 * Following constitutional rule: Edge-First Architecture - Web APIs only
 */
import { sessionManager } from '../../src/lib/workflows/session-manager';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  console.log('🔍 [Get-Itinerary] Handler called', {
    method: request.method,
    url: request.url,
  });

  if (request.method !== 'GET') {
    return Response.json({ success: false, error: 'Method not allowed' }, { status: 405 });
  }

  const startTime = Date.now();

  try {
    const url = new URL(request.url);
    const workflowId = url.searchParams.get('workflowId');

    console.log('🔍 [Get-Itinerary] WorkflowId:', workflowId);

    if (!workflowId) {
      return Response.json(
        { success: false, error: 'workflowId parameter is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 [Get-Itinerary] Checking status for workflow: ${workflowId}`);

    // Get session status
    const session = await sessionManager.getSession(workflowId);

    if (!session) {
      console.log(`❌ [Get-Itinerary] No session found for: ${workflowId}`);
      return Response.json(
        {
          success: false,
          error: 'Workflow not found',
          workflowId,
        },
        { status: 404 }
      );
    }

    // If completed, try to get the itinerary result
    if (session.status === 'completed') {
      try {
        const { Redis } = await import('@upstash/redis');
        const redis = new Redis({
          url: process.env['KV_REST_API_URL']!,
          token: process.env['KV_REST_API_TOKEN']!,
        });

        const itineraryData = await redis.get(`itinerary:${workflowId}`);
        const itinerary = itineraryData ? JSON.parse(itineraryData as string) : null;

        console.log(`✅ [Get-Itinerary] Workflow completed for: ${workflowId}`);
        return Response.json({
          success: true,
          workflowId,
          status: 'completed',
          progress: 100,
          itinerary: itinerary || {
            message: 'AI itinerary generation completed successfully!',
            destination: session.formData?.location || 'Unknown',
            status: 'Your personalized travel itinerary has been generated.',
          },
          processingTime: Date.now() - startTime,
        });
      } catch (error) {
        console.error(`💥 [Get-Itinerary] Error retrieving itinerary:`, error);
        return Response.json({
          success: true,
          workflowId,
          status: 'completed',
          progress: 100,
          itinerary: {
            message: 'AI itinerary generation completed successfully!',
            destination: session.formData?.location || 'Unknown',
            status: 'Your personalized travel itinerary has been generated.',
          },
          processingTime: Date.now() - startTime,
        });
      }
    }

    // If still processing or other status
    return Response.json({
      success: false,
      workflowId,
      status: session.status || 'processing',
      progress: session.progress || 25,
      currentStage: session.currentStage || 'architect',
      message: `AI ${session.currentStage || 'architect'} agent is working on your itinerary...`,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,
    });
  } catch (error) {
    console.error(`💥 [Get-Itinerary] Error:`, error);
    return Response.json(
      {
        success: false,
        error: 'Internal server error',
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * HTTP method exports for Vercel
 */
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

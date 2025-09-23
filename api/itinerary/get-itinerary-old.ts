/**
 * Get Itinerary Results API Endpoint
 * Following constitutional rule: Edge-First Architecture - Web APIs only
 */
import { sessionManager } from '../../src/lib/workflows/session-manager.js';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  // Add deployment verification logging
  console.log('🚀 [GET-ITINERARY] ENDPOINT ACTIVATED - Deployment verified', {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
  });

  if (request.method !== 'GET') {
    console.log('❌ [Get-Itinerary] Method not allowed:', request.method);
    return Response.json({ success: false, error: 'Method not allowed' }, { status: 405 });
  }

  const startTime = Date.now();

  try {
    const url = new URL(request.url);
    const workflowId = url.searchParams.get('workflowId');

    console.log('🔍 [Get-Itinerary] Request details:', {
      workflowId,
      searchParams: Object.fromEntries(url.searchParams),
      pathname: url.pathname,
    });

    if (!workflowId) {
      console.log('❌ [Get-Itinerary] Missing workflowId parameter');
      return Response.json(
        { success: false, error: 'workflowId parameter is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 [Get-Itinerary] Checking status for workflow: ${workflowId}`);

    // Test if sessionManager is accessible
    try {
      console.log('🧪 [Get-Itinerary] Testing sessionManager availability...');
      const session = await sessionManager.getSession(workflowId);
      console.log('🧪 [Get-Itinerary] SessionManager test result:', {
        sessionFound: !!session,
        sessionStatus: session?.status || 'not-found',
      });

      if (!session) {
        console.log(`❌ [Get-Itinerary] No session found for: ${workflowId}`);
        return Response.json(
          {
            success: false,
            error: 'Workflow not found',
            workflowId,
            debug: 'Session not found in storage',
          },
          { status: 404 }
        );
      }

      console.log(`✅ [Get-Itinerary] Session found`, {
        workflowId: workflowId.substring(0, 12) + '...',
        status: session.status,
        currentStage: session.currentStage,
        progress: session.progress,
      });

      // If completed, try to get the itinerary result
      if (session.status === 'completed') {
        console.log(`🎉 [Get-Itinerary] Workflow completed - retrieving results`);

        try {
          const { Redis } = await import('@upstash/redis');
          const redis = new Redis({
            url: process.env['KV_REST_API_URL']!,
            token: process.env['KV_REST_API_TOKEN']!,
          });

          const itineraryData = await redis.get(`itinerary:${workflowId}`);
          const itinerary = itineraryData ? JSON.parse(itineraryData as string) : null;

          console.log(`✅ [Get-Itinerary] Workflow completed for: ${workflowId}`, {
            hasItineraryData: !!itineraryData,
            itinerarySize: itineraryData ? (itineraryData as string).length : 0,
          });

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
          return Response.json(
            {
              success: false,
              error: 'Failed to retrieve completed itinerary',
              debug: error instanceof Error ? error.message : 'Redis access error',
              workflowId,
            },
            { status: 500 }
          );
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
    } catch (sessionError) {
      console.error('💥 [Get-Itinerary] SessionManager error:', sessionError);
      return Response.json(
        {
          success: false,
          error: 'Session manager unavailable',
          debug: sessionError instanceof Error ? sessionError.message : 'Unknown session error',
          workflowId,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`💥 [Get-Itinerary] Handler error:`, error);
    return Response.json(
      {
        success: false,
        error: 'Internal server error',
        debug: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

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

/**
 * Get Itinerary Results API Endpoint
 * Enhanced with comprehensive logging and error handling
 */
import { simpleSessionManager } from '../../src/lib/workflows/simple-session-manager.js';

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

    // Test if simpleSessionManager is accessible
    try {
      console.log('🧪 [Get-Itinerary] Testing simpleSessionManager availability...');
      const session = await simpleSessionManager.getSession(workflowId);
      console.log('🧪 [Get-Itinerary] SimpleSessionManager test result:', {
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
      console.error('💥 [Get-Itinerary] SimpleSessionManager error:', sessionError);
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

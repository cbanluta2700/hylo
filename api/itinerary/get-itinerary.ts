import { sessionManager } from '../../src/lib/workflows/session-manager.js';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return Response.json({ success: false, error: 'Method not allowed' }, { status: 405 });
  }

  const startTime = Date.now();

  try {
    const url = new URL(request.url);
    const workflowId = url.searchParams.get('workflowId');

    if (!workflowId) {
      return Response.json(
        { success: false, error: 'workflowId parameter is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 [Get-Itinerary] Checking status for workflow: ${workflowId}`);

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

    console.log(`📊 [Get-Itinerary] Session status:`, {
      workflowId,
      status: session.status,
      progress: session.progress || 0,
      currentStage: session.currentStage || 'unknown',
    });

    // If workflow is completed, return success (even without stored itinerary for now)
    if (session.status === 'completed') {
      console.log(`✅ [Get-Itinerary] Workflow completed for: ${workflowId}`);
      return Response.json({
        success: true,
        workflowId,
        status: 'completed',
        progress: 100,
        itinerary: {
          message: 'AI itinerary generation completed successfully!',
          destination: session.formData?.location || 'Unknown',
          status: 'Your personalized travel itinerary has been generated.',
          note: 'Full itinerary details are being processed for display.',
        },
        processingTime: Date.now() - startTime,
      });
    }

    // If workflow is still processing
    if (session.status === 'processing') {
      console.log(
        `⏳ [Get-Itinerary] Workflow still processing: ${workflowId} - Stage: ${session.currentStage}`
      );
      return Response.json({
        success: false,
        workflowId,
        status: 'processing',
        progress: session.progress || 25,
        currentStage: session.currentStage || 'architect',
        message: `AI ${session.currentStage} agent is working on your itinerary...`,
        estimatedTimeRemaining: 120000,
      });
    }

    // If workflow failed
    if (session.status === 'failed') {
      console.log(`💥 [Get-Itinerary] Workflow failed: ${workflowId}`);
      return Response.json(
        {
          success: false,
          workflowId,
          status: 'failed',
          error: session.errorMessage || 'Unknown error occurred',
          processingTime: Date.now() - startTime,
        },
        { status: 500 }
      );
    }

    // Default case for pending or unknown status
    console.log(`⌛ [Get-Itinerary] Workflow status: ${session.status} for: ${workflowId}`);
    return Response.json({
      success: false,
      workflowId,
      status: session.status || 'unknown',
      progress: session.progress || 0,
      currentStage: session.currentStage || 'architect',
      message: 'AI workflow is initializing...',
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

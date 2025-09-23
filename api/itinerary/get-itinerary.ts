/**/**

 * Get Itinerary API Endpoint * Get Itinerary API Endpoint

 * Simple version that integrates with session manager *

 */ * Constitutional Requirements:

 * - Vercel Edge Runtime only

import { sessionManager } from '../../src/lib/workflows/session-manager.js'; * - Type-safe development

 *

export const config = { * Task: T037 - Implement /api/itinerary/get-itinerary endpoint

  runtime: 'edge', */

};

import { WorkflowOrchestrator } from '../../src/lib/workflows/orchestrator.js';

export default async function handler(request: Request): Promise<Response> {

  if (request.method !== 'GET') {// Runtime configuration for Vercel Edge

    return Response.json({ success: false, error: 'Method not allowed' }, { status: 405 });export const config = {

  }  runtime: 'edge',

};

  const startTime = Date.now();

/**

  try { * Success response interface

    const url = new URL(request.url); */

    const workflowId = url.searchParams.get('workflowId');interface GetItineraryResponse {

  success: true;

    if (!workflowId) {  workflowId: string;

      return Response.json(  status: string;

        { success: false, error: 'workflowId parameter is required' },  progress: number;

        { status: 400 }  currentStage: string;

      );  itinerary?: any;

    }  estimatedTimeRemaining?: number;

}

    console.log(`🔍 [Get-Itinerary] Checking status for workflow: ${workflowId}`);

/**

    // Check session status * Error response interface

    const session = await sessionManager.getSession(workflowId); */

    interface ErrorResponse {

    if (!session) {  success: false;

      console.log(`❌ [Get-Itinerary] No session found for: ${workflowId}`);  error: string;

      return Response.json({  code?: string;

        success: false,}

        error: 'Workflow not found',

        workflowId/**

      }, { status: 404 }); * GET /api/itinerary/get-itinerary

    } * Retrieves itinerary status and results

 */

    console.log(`📊 [Get-Itinerary] Session status:`, {export default async function handler(request: Request): Promise<Response> {

      workflowId,  // Only allow GET method

      status: session.status,  if (request.method !== 'GET') {

      progress: session.progress || 0,    return Response.json(

      currentStage: session.currentStage || 'unknown'      {

    });        success: false,

        error: 'Method not allowed',

    // If workflow is completed, return the final itinerary        code: 'METHOD_NOT_ALLOWED',

    if (session.status === 'completed' && session.finalItinerary) {      } satisfies ErrorResponse,

      console.log(`✅ [Get-Itinerary] Returning completed itinerary for: ${workflowId}`);      { status: 405 }

      return Response.json({    );

        success: true,  }

        workflowId,

        status: 'completed',  const startTime = Date.now();

        progress: 100,

        itinerary: session.finalItinerary,  try {

        processingTime: Date.now() - startTime    const url = new URL(request.url);

      });    const workflowId = url.searchParams.get('workflowId');

    }

    if (!workflowId) {

    // If workflow is still processing      return Response.json(

    if (session.status === 'processing') {        {

      console.log(`⏳ [Get-Itinerary] Workflow still processing: ${workflowId}`);          success: false,

      return Response.json({          error: 'workflowId parameter is required',

        success: false,          code: 'MISSING_WORKFLOW_ID',

        workflowId,        } satisfies ErrorResponse,

        status: 'processing',        { status: 400 }

        progress: session.progress || 25,      );

        currentStage: session.currentStage || 'architect',    }

        message: 'AI agents are still working on your itinerary...',

        estimatedTimeRemaining: 120000    console.log(`[Get Itinerary API] Retrieving status for workflow ${workflowId}`);

      });

    }    // Get workflow status

    const workflowStatus = await WorkflowOrchestrator.getWorkflowStatus(workflowId);

    // If workflow failed

    if (session.status === 'failed') {    if (!workflowStatus) {

      console.log(`💥 [Get-Itinerary] Workflow failed: ${workflowId}`);      return Response.json(

      return Response.json({        {

        success: false,          success: false,

        workflowId,          error: 'Workflow not found',

        status: 'failed',          code: 'WORKFLOW_NOT_FOUND',

        error: session.error || 'Unknown error occurred',        } satisfies ErrorResponse,

        processingTime: Date.now() - startTime        { status: 404 }

      }, { status: 500 });      );

    }    }



    // Default case    const processingTime = Date.now() - startTime;

    console.log(`⌛ [Get-Itinerary] Default response for: ${workflowId}`);

    return Response.json({    // Calculate estimated time remaining

      success: false,    let estimatedTimeRemaining: number | undefined;

      workflowId,    if (workflowStatus.status === 'processing') {

      status: session.status || 'unknown',      const elapsed = Date.now() - workflowStatus.startedAt.getTime();

      progress: session.progress || 0,      const totalEstimated = 5 * 60 * 1000; // 5 minutes estimated total

      message: 'Checking workflow status...'      estimatedTimeRemaining = Math.max(0, totalEstimated - elapsed);

    });    }



  } catch (error) {    const response: GetItineraryResponse = {

    console.error(`💥 [Get-Itinerary] Error:`, error);      success: true,

    return Response.json({      workflowId: workflowStatus.id,

      success: false,      status: workflowStatus.status,

      error: 'Internal server error',      progress: workflowStatus.progress,

      processingTime: Date.now() - startTime      currentStage: workflowStatus.currentStage,

    }, { status: 500 });      ...(estimatedTimeRemaining !== undefined && { estimatedTimeRemaining }),

  }      // TODO: Include final itinerary when completed

}      // This would require storing the final result in Redis
    };

    console.log(
      `[Get Itinerary API] Status retrieved in ${processingTime}ms: ${workflowStatus.status}`
    );

    return Response.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Processing-Time': processingTime.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error('[Get Itinerary API] Error:', error);

    return Response.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      } satisfies ErrorResponse,
      {
        status: 500,
        headers: {
          'X-Processing-Time': processingTime.toString(),
        },
      }
    );
  }
}

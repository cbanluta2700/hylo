/**
 * Get Itinerary API Endpoint
 *
 * Constitutional Requirements:
 * - Vercel Edge Runtime only
 * - Type-safe development
 *
 * Task: T037 - Implement /api/itinerary/get-itinerary endpoint
 */

import { WorkflowOrchestrator } from '../../src/lib/workflows/orchestrator';

// Runtime configuration for Vercel Edge
export const config = {
  runtime: 'edge',
};

/**
 * Success response interface
 */
interface GetItineraryResponse {
  success: true;
  workflowId: string;
  status: string;
  progress: number;
  currentStage: string;
  itinerary?: any;
  estimatedTimeRemaining?: number;
}

/**
 * Error response interface
 */
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

/**
 * GET /api/itinerary/get-itinerary
 * Retrieves itinerary status and results
 */
export default async function handler(request: Request): Promise<Response> {
  // Only allow GET method
  if (request.method !== 'GET') {
    return Response.json(
      {
        success: false,
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED',
      } satisfies ErrorResponse,
      { status: 405 }
    );
  }

  const startTime = Date.now();

  try {
    const url = new URL(request.url);
    const workflowId = url.searchParams.get('workflowId');

    if (!workflowId) {
      return Response.json(
        {
          success: false,
          error: 'workflowId parameter is required',
          code: 'MISSING_WORKFLOW_ID',
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    console.log(`[Get Itinerary API] Retrieving status for workflow ${workflowId}`);

    // Get workflow status
    const workflowStatus = await WorkflowOrchestrator.getWorkflowStatus(workflowId);

    if (!workflowStatus) {
      return Response.json(
        {
          success: false,
          error: 'Workflow not found',
          code: 'WORKFLOW_NOT_FOUND',
        } satisfies ErrorResponse,
        { status: 404 }
      );
    }

    const processingTime = Date.now() - startTime;

    // Calculate estimated time remaining
    let estimatedTimeRemaining: number | undefined;
    if (workflowStatus.status === 'processing') {
      const elapsed = Date.now() - workflowStatus.startedAt.getTime();
      const totalEstimated = 5 * 60 * 1000; // 5 minutes estimated total
      estimatedTimeRemaining = Math.max(0, totalEstimated - elapsed);
    }

    const response: GetItineraryResponse = {
      success: true,
      workflowId: workflowStatus.id,
      status: workflowStatus.status,
      progress: workflowStatus.progress,
      currentStage: workflowStatus.currentStage,
      ...(estimatedTimeRemaining !== undefined && { estimatedTimeRemaining }),
      // TODO: Include final itinerary when completed
      // This would require storing the final result in Redis
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

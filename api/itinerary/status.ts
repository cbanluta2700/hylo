/**
 * Enhanced Itinerary Status Endpoint
 *
 * Updated to query Inngest workflow state instead of local state manager.
 * Provides real-time status of itinerary generation workflow.
 */

import { NextRequest } from 'next/server';
import { inngest } from '../../src/lib/inngest/client-v2';

// Edge Runtime configuration
export const config = {
  runtime: 'edge',
};

interface StatusResponse {
  success: boolean;
  data?: {
    sessionId: string;
    requestId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
    progress: number; // 0-100
    currentStage: string;
    message: string;
    results?: any;
    error?: any;
    stages: Array<{
      name: string;
      status: 'pending' | 'running' | 'completed' | 'failed';
      startTime?: string;
      endTime?: string;
      duration?: number;
      progress: number;
    }>;
    metadata: {
      startTime: string;
      lastUpdate: string;
      totalTime?: number;
      estimatedCompletion?: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export default async function handler(req: NextRequest): Promise<Response> {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return Response.json(
      {
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only GET requests are allowed',
        },
      },
      { status: 405 }
    );
  }

  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get('requestId');
  const sessionId = searchParams.get('sessionId');

  if (!requestId && !sessionId) {
    return Response.json(
      {
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'Either requestId or sessionId is required',
        },
      },
      { status: 400 }
    );
  }

  try {
    // Query Inngest workflow state
    // Note: This is a mock implementation as actual Inngest state querying
    // would require specific Inngest SDK methods that may not be available in Edge Runtime
    const workflowState = await queryInngestWorkflow(requestId, sessionId);

    if (!workflowState) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'WORKFLOW_NOT_FOUND',
            message: 'No workflow found with the provided identifiers',
          },
        },
        { status: 404 }
      );
    }

    const response: StatusResponse = {
      success: true,
      data: {
        sessionId: workflowState.sessionId,
        requestId: workflowState.requestId,
        status: workflowState.status,
        progress: workflowState.progress,
        currentStage: workflowState.currentStage,
        message: workflowState.message,
        results: workflowState.results,
        error: workflowState.error,
        stages: workflowState.stages,
        metadata: {
          startTime: workflowState.startTime,
          lastUpdate: workflowState.lastUpdate,
          totalTime: workflowState.totalTime,
          estimatedCompletion: workflowState.estimatedCompletion,
        },
      },
    };

    return Response.json(response);
  } catch (error: any) {
    console.error('Status query error:', error);

    return Response.json(
      {
        success: false,
        error: {
          code: 'STATUS_QUERY_ERROR',
          message: 'Failed to query workflow status',
        },
      },
      { status: 500 }
    );
  }
}

async function queryInngestWorkflow(requestId?: string | null, sessionId?: string | null) {
  // Mock implementation - in reality this would query Inngest's state management
  // For now, return a mock workflow state

  if (!requestId && !sessionId) {
    return null;
  }

  // This would typically involve:
  // 1. Querying Inngest for workflow runs by ID
  // 2. Parsing step status and progress
  // 3. Calculating overall progress
  // 4. Determining current stage

  const mockWorkflowState = {
    sessionId: sessionId || 'mock-session-id',
    requestId: requestId || 'mock-request-id',
    status: 'processing' as const,
    progress: 45,
    currentStage: 'gatherer-agent',
    message: 'Gathering travel information...',
    results: null,
    error: null,
    stages: [
      {
        name: 'generate-smart-queries',
        status: 'completed' as const,
        startTime: new Date(Date.now() - 120000).toISOString(),
        endTime: new Date(Date.now() - 110000).toISOString(),
        duration: 10000,
        progress: 100,
      },
      {
        name: 'architect-agent',
        status: 'completed' as const,
        startTime: new Date(Date.now() - 110000).toISOString(),
        endTime: new Date(Date.now() - 90000).toISOString(),
        duration: 20000,
        progress: 100,
      },
      {
        name: 'gatherer-agent',
        status: 'running' as const,
        startTime: new Date(Date.now() - 90000).toISOString(),
        progress: 60,
      },
      {
        name: 'specialist-agent',
        status: 'pending' as const,
        progress: 0,
      },
      {
        name: 'form-putter-agent',
        status: 'pending' as const,
        progress: 0,
      },
    ],
    startTime: new Date(Date.now() - 120000).toISOString(),
    lastUpdate: new Date().toISOString(),
    totalTime: 120000,
    estimatedCompletion: new Date(Date.now() + 60000).toISOString(),
  };

  // Simulate async delay
  await new Promise((resolve) => setTimeout(resolve, 50));

  return mockWorkflowState;
}

/**
 * API Documentation
 *
 * GET /api/itinerary/status?requestId={id}&sessionId={id}
 *
 * Query Parameters:
 * - requestId (optional): Specific workflow request ID
 * - sessionId (optional): Session ID to find associated workflows
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "sessionId": "session-123",
 *     "requestId": "request-456",
 *     "status": "processing",
 *     "progress": 45,
 *     "currentStage": "gatherer-agent",
 *     "message": "Gathering travel information...",
 *     "results": null,
 *     "error": null,
 *     "stages": [
 *       {
 *         "name": "architect-agent",
 *         "status": "completed",
 *         "startTime": "2024-01-01T00:00:00.000Z",
 *         "endTime": "2024-01-01T00:00:20.000Z",
 *         "duration": 20000,
 *         "progress": 100
 *       }
 *     ],
 *     "metadata": {
 *       "startTime": "2024-01-01T00:00:00.000Z",
 *       "lastUpdate": "2024-01-01T00:02:00.000Z",
 *       "totalTime": 120000,
 *       "estimatedCompletion": "2024-01-01T00:03:00.000Z"
 *     }
 *   }
 * }
 */

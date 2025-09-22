/**
 * Progress Tracking API Endpoint (T037)
 *
 * CONSTITUTIONAL COMPLIANCE:
 * - Principle I: Edge Runtime compatible (Server-Sent Events)
 * - Principle V: Type-safe development with Zod validation
 * - Principle IV: Code-Deploy-Debug with real-time progress updates
 *
 * GET /api/itinerary/progress/[workflowId]
 * Returns real-time progress updates via Server-Sent Events
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '../../../src/lib/session/SessionManager';

// Runtime configuration for Edge Functions
export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
): Promise<NextResponse> {
  console.log('📊 [DEBUG-135] Progress API endpoint called', {
    workflowId: params.workflowId,
    timestamp: new Date().toISOString(),
  });

  try {
    const workflowId = params.workflowId;

    if (!workflowId) {
      console.log('❌ [DEBUG-136] Missing workflow ID');
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 });
    }

    // Check if client wants Server-Sent Events
    const acceptHeader = request.headers.get('accept');
    const wantsEventStream = acceptHeader?.includes('text/event-stream');
    console.log('🔍 [DEBUG-137] Client request type', {
      acceptHeader,
      wantsEventStream,
      workflowId,
    });

    if (wantsEventStream) {
      // Return SSE stream for real-time updates
      return createEventStream(workflowId);
    } else {
      // Return current status as JSON
      return getCurrentStatus(workflowId);
    }
  } catch (error) {
    console.error('Progress API error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Get current workflow status as JSON response
 */
async function getCurrentStatus(workflowId: string): Promise<NextResponse> {
  const session = await SessionManager.getSession(workflowId);

  if (!session) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }

  const response = {
    workflowId: session.id,
    status: session.status,
    currentStage: session.currentStage,
    progress: session.progress,
    completedSteps: session.completedSteps,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    processingTime: session.totalProcessingTime,
    error: session.errorMessage,
  };

  return NextResponse.json(response, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
}

/**
 * Create Server-Sent Events stream for real-time updates
 * Constitutional requirement: Edge Runtime compatible streaming
 */
function createEventStream(workflowId: string): NextResponse {
  let isClosed = false;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'connected',
            workflowId,
            timestamp: Date.now(),
          })}\n\n`
        )
      );

      // Poll for updates every 2 seconds
      const pollInterval = setInterval(async () => {
        if (isClosed) {
          clearInterval(pollInterval);
          return;
        }

        try {
          const session = await SessionManager.getSession(workflowId);

          if (!session) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'error',
                  error: 'Workflow not found',
                  timestamp: Date.now(),
                })}\n\n`
              )
            );
            clearInterval(pollInterval);
            controller.close();
            return;
          }

          // Send progress update
          const progressData = {
            type: 'progress',
            workflowId: session.id,
            status: session.status,
            currentStage: session.currentStage,
            progress: session.progress,
            completedSteps: session.completedSteps,
            timestamp: Date.now(),
          };

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(progressData)}\n\n`));

          // Close stream if workflow is complete or failed
          if (session.status === 'completed' || session.status === 'failed') {
            const finalData = {
              type: 'complete',
              status: session.status,
              processingTime: session.totalProcessingTime,
              error: session.errorMessage,
              timestamp: Date.now(),
            };

            controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`));

            clearInterval(pollInterval);
            controller.close();
          }
        } catch (error) {
          console.error('SSE polling error:', error);

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: Date.now(),
              })}\n\n`
            )
          );

          clearInterval(pollInterval);
          controller.close();
        }
      }, 2000);

      // Handle client disconnect
      const cleanup = () => {
        isClosed = true;
        clearInterval(pollInterval);
        controller.close();
      };

      // Note: In Edge Runtime, we can't directly detect client disconnect
      // The stream will be cleaned up automatically after 5 minutes
      setTimeout(cleanup, 5 * 60 * 1000);
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept, Cache-Control',
    },
  });
}

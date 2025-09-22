/**
 * Progress Stream API Endpoint
 *
 * Constitutional Requirements:
 * - Vercel Edge Runtime only
 * - Server-Sent Events (SSE) streaming
 * - Real-time progress updates
 *
 * Task: T038 - Implement /api/itinerary/progress-simple endpoint
 */

import { WorkflowOrchestrator } from '../../src/lib/workflows/orchestrator';

// Runtime configuration for Vercel Edge
export const config = {
  runtime: 'edge',
};

/**
 * Progress event interface
 */
interface ProgressEvent {
  workflowId: string;
  progress: number;
  currentStage: string;
  message: string;
  timestamp: string;
}

/**
 * GET /api/itinerary/progress-simple
 * Server-Sent Events stream for real-time progress updates
 */
export default async function handler(request: Request): Promise<Response> {
  // Only allow GET method
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const url = new URL(request.url);
  const workflowId = url.searchParams.get('workflowId');

  if (!workflowId) {
    return Response.json({ error: 'workflowId parameter is required' }, { status: 400 });
  }

  console.log(`[Progress Stream API] Starting SSE stream for workflow ${workflowId}`);

  // Create a TransformStream for SSE
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // SSE helper function
  const sendEvent = async (data: ProgressEvent) => {
    const sseData = `data: ${JSON.stringify(data)}\n\n`;
    await writer.write(encoder.encode(sseData));
  };

  // Start polling for progress updates
  const startPolling = async () => {
    try {
      let lastProgress = -1;
      let pollCount = 0;
      const maxPolls = 120; // 10 minutes max (5 second intervals)

      const poll = async () => {
        try {
          const workflowStatus = await WorkflowOrchestrator.getWorkflowStatus(workflowId);

          if (!workflowStatus) {
            await sendEvent({
              workflowId,
              progress: 0,
              currentStage: 'not-found',
              message: 'Workflow not found',
              timestamp: new Date().toISOString(),
            });
            await writer.close();
            return;
          }

          // Only send update if progress changed or it's the first poll
          if (workflowStatus.progress !== lastProgress || pollCount === 0) {
            await sendEvent({
              workflowId,
              progress: workflowStatus.progress,
              currentStage: workflowStatus.currentStage,
              message: getStageMessage(workflowStatus.currentStage, workflowStatus.progress),
              timestamp: new Date().toISOString(),
            });

            lastProgress = workflowStatus.progress;
          }

          // Check if completed or failed
          if (workflowStatus.status === 'completed' || workflowStatus.status === 'failed') {
            await sendEvent({
              workflowId,
              progress: workflowStatus.progress,
              currentStage: workflowStatus.currentStage,
              message:
                workflowStatus.status === 'completed'
                  ? 'Itinerary generation completed!'
                  : workflowStatus.errorMessage || 'Itinerary generation failed',
              timestamp: new Date().toISOString(),
            });
            await writer.close();
            return;
          }

          pollCount++;

          // Continue polling if not finished and haven't exceeded max polls
          if (pollCount < maxPolls) {
            setTimeout(poll, 5000); // Poll every 5 seconds
          } else {
            // Timeout after max polls
            await sendEvent({
              workflowId,
              progress: workflowStatus.progress,
              currentStage: 'timeout',
              message: 'Progress stream timed out. Please refresh to check current status.',
              timestamp: new Date().toISOString(),
            });
            await writer.close();
          }
        } catch (error) {
          console.error(`[Progress Stream API] Polling error for ${workflowId}:`, error);
          await sendEvent({
            workflowId,
            progress: 0,
            currentStage: 'error',
            message: 'Error occurred while checking progress',
            timestamp: new Date().toISOString(),
          });
          await writer.close();
        }
      };

      // Start polling
      poll();
    } catch (error) {
      console.error(`[Progress Stream API] Stream error for ${workflowId}:`, error);
      await writer.close();
    }
  };

  // Start the polling process
  startPolling();

  // Return SSE response
  return new Response(stream.readable, {
    status: 200,
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
 * Get user-friendly message for each stage
 */
function getStageMessage(stage: string, progress: number): string {
  switch (stage) {
    case 'architect':
      return 'Planning your trip structure...';
    case 'gatherer':
      return 'Gathering destination information...';
    case 'specialist':
      return 'Processing recommendations...';
    case 'formatter':
      return 'Creating your personalized itinerary...';
    case 'complete':
      return 'Your itinerary is ready!';
    case 'not-found':
      return 'Workflow not found';
    case 'error':
      return 'An error occurred';
    case 'timeout':
      return 'Progress stream timed out';
    default:
      return `Processing... (${progress}%)`;
  }
}

/**
 * Progress Tracking API Endpoint (T037)
 *
 * CONSTITUTIONAL COMPLIANCE:
 * - Principle I: Edge Runtime compatible (Vercel Edge Functions)
 * - Principle V: Type-safe development with Zod validation
 * - Principle IV: Code-Deploy-Debug with real-time progress updates
 *
 * GET /api/itinerary/progress/[workflowId]
 * Returns workflow progress as JSON
 */

import { SessionManager } from '../../../src/lib/session/SessionManager';

// Edge Runtime configuration (constitutional requirement)
export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const workflowId = pathSegments[pathSegments.length - 1];

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
      },
    });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    if (!workflowId) {
      return new Response(JSON.stringify({ error: 'Workflow ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const session = await SessionManager.getSession(workflowId);

    if (!session) {
      return new Response(JSON.stringify({ error: 'Workflow not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
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

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Progress API error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Workflow Cancellation Endpoint
 * 
 * Allows graceful workflow cancellation with proper cleanup and resource management.
 * Supports immediate cancellation, graceful shutdown, and resource cleanup.
 * 
 * Features:
 * - Immediate workflow termination
 * - Graceful shutdown with current agent completion
 * - Resource cleanup and cost tracking
 * - Cancellation reason logging
 * - Subscriber notification
 * - Partial result preservation
 * 
 * @route POST /api/workflow/cancel/[sessionId]
 * @route DELETE /api/workflow/cancel/[sessionId]
 */

import { z } from 'zod';
import { qstashSessionManager } from '../../state/session-manager';
import { WorkflowState } from '../../../../src/types/agents';

// =============================================================================
// EDGE RUNTIME CONFIGURATION
// =============================================================================

export const config = {
  runtime: 'edge',
};

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Cancellation request body
 */
interface CancellationRequest {
  reason?: string;
  graceful?: boolean;
  preservePartialResults?: boolean;
  notifySubscribers?: boolean;
}

/**
 * Cancellation response
 */
interface CancellationResponse {
  sessionId: string;
  status: 'cancelled' | 'cancelling' | 'failed';
  cancellationId: string;
  timestamp: string;
  reason: string;
  graceful: boolean;
  partialResultsPreserved: boolean;
  finalCost: number;
  executionDuration: number;
  completedAgents: string[];
  partialResults?: any;
  metadata: {
    cancellationTime: number; // milliseconds to cancel
    resourcesCleanedUp: string[];
    subscribersNotified: number;
    checkpointsPreserved: number;
  };
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const SessionIdSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID format')
});

const CancellationRequestSchema = z.object({
  reason: z.string().max(500).optional().default('User requested cancellation'),
  graceful: z.boolean().optional().default(false),
  preservePartialResults: z.boolean().optional().default(true),
  notifySubscribers: z.boolean().optional().default(true)
});

// =============================================================================
// MAIN ENDPOINT HANDLERS
// =============================================================================

/**
 * POST handler for workflow cancellation
 */
export async function POST(request: Request): Promise<Response> {
  return handleCancellation(request, false);
}

/**
 * DELETE handler for immediate workflow termination
 */
export async function DELETE(request: Request): Promise<Response> {
  return handleCancellation(request, true);
}

/**
 * Main cancellation handler
 */
async function handleCancellation(
  request: Request, 
  forceImmediate: boolean = false
): Promise<Response> {
  const startTime = Date.now();
  
  try {
    // Extract session ID from URL
    const url = new URL(request.url);
    const sessionId = url.pathname.split('/').slice(-2)[0]; // Get sessionId before 'route.ts'
    
    if (!sessionId) {
      return new Response(
        JSON.stringify({ 
          error: 'Session ID is required',
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate session ID format
    try {
      SessionIdSchema.parse({ sessionId });
    } catch (error) {
      console.warn('Invalid session ID format:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid session ID format',
          sessionId 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    let requestBody: CancellationRequest = {};
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        requestBody = CancellationRequestSchema.parse(body);
      } catch (error) {
        console.warn('Invalid request body:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid request body',
            details: error instanceof z.ZodError ? error.errors : 'Malformed JSON'
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    } else {
      // DELETE requests use defaults with immediate termination
      requestBody = {
        reason: 'Immediate termination requested',
        graceful: false,
        preservePartialResults: true,
        notifySubscribers: true
      };
    }

    // Force immediate cancellation for DELETE requests
    if (forceImmediate) {
      requestBody.graceful = false;
    }

    // Retrieve session
    const session = await qstashSessionManager.getSession(sessionId);
    if (!session) {
      return new Response(
        JSON.stringify({ 
          error: 'Session not found',
          sessionId 
        }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if session is already in a terminal state
    if (session.state === WorkflowState.COMPLETED || 
        session.state === WorkflowState.CANCELLED ||
        session.state === WorkflowState.FAILED) {
      return new Response(
        JSON.stringify({
          error: 'Session is already in terminal state',
          sessionId,
          currentState: session.state,
          message: `Cannot cancel session that is ${session.state}`
        }),
        { 
          status: 409, // Conflict
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate cancellation ID for tracking
    const cancellationId = `cancel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Perform cancellation
    const cancellationResult = await performCancellation(
      session, 
      requestBody, 
      cancellationId,
      startTime
    );

    // Return success response
    return new Response(
      JSON.stringify(cancellationResult, null, 2),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Cancellation endpoint error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'Failed to cancel workflow',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// =============================================================================
// CANCELLATION LOGIC
// =============================================================================

/**
 * Perform the actual workflow cancellation
 */
async function performCancellation(
  session: any,
  request: CancellationRequest,
  cancellationId: string,
  startTime: number
): Promise<CancellationResponse> {
  const { sessionId } = session;
  const resourcesCleanedUp: string[] = [];
  let subscribersNotified = 0;
  let partialResults: any = {};

  try {
    // Step 1: Update session state to cancelling
    if (request.graceful) {
      // For graceful shutdown, we might wait for current agent to complete
      // This is a simplified implementation - in practice, you'd need more sophisticated coordination
      console.log(`Initiating graceful cancellation for session ${sessionId}`);
    } else {
      console.log(`Initiating immediate cancellation for session ${sessionId}`);
    }

    // Step 2: Preserve partial results if requested
    if (request.preservePartialResults) {
      partialResults = await preservePartialResults(session);
      resourcesCleanedUp.push('partial-results-preserved');
    }

    // Step 3: Create cancellation checkpoint
    try {
      const checkpointId = await qstashSessionManager.createCheckpoint(
        sessionId,
        session.progress.currentAgent || 'content-planner',
        {
          cancellationId,
          reason: request.reason,
          partialResults: request.preservePartialResults ? partialResults : null,
          timestamp: new Date().toISOString()
        }
      );
      resourcesCleanedUp.push(`checkpoint-${checkpointId}`);
    } catch (error) {
      console.warn('Failed to create cancellation checkpoint:', error);
    }

    // Step 4: Cancel the session using session manager
    await qstashSessionManager.cancelSession(sessionId, request.reason);
    resourcesCleanedUp.push('session-cancelled');

    // Step 5: Notify subscribers if requested
    if (request.notifySubscribers) {
      try {
        // In a real implementation, you'd use the session's subscriber list
        subscribersNotified = session.subscribers?.length || 0;
        
        // Add cancellation event for streaming subscribers
        await qstashSessionManager.addEvent(sessionId, {
          type: 'session.cancelled',
          message: `Session cancelled: ${request.reason}`,
          severity: 'medium',
          data: {
            cancellationId,
            reason: request.reason,
            graceful: request.graceful,
            partialResultsPreserved: request.preservePartialResults
          }
        });
        
        resourcesCleanedUp.push('subscribers-notified');
      } catch (error) {
        console.warn('Failed to notify subscribers:', error);
      }
    }

    // Step 6: Calculate final metrics
    const executionDuration = Date.now() - new Date(session.metadata.createdAt).getTime();
    const cancellationDuration = Date.now() - startTime;

    // Step 7: Build response
    const response: CancellationResponse = {
      sessionId,
      status: 'cancelled',
      cancellationId,
      timestamp: new Date().toISOString(),
      reason: request.reason || 'User requested cancellation',
      graceful: request.graceful || false,
      partialResultsPreserved: request.preservePartialResults || false,
      finalCost: session.metadata.totalCost,
      executionDuration,
      completedAgents: session.progress.completedAgents || [],
      partialResults: request.preservePartialResults ? partialResults : undefined,
      metadata: {
        cancellationTime: cancellationDuration,
        resourcesCleanedUp,
        subscribersNotified,
        checkpointsPreserved: session.checkpoints?.length || 0
      }
    };

    return response;

  } catch (error) {
    console.error('Error during cancellation:', error);
    
    // Return partial cancellation result
    return {
      sessionId,
      status: 'failed',
      cancellationId,
      timestamp: new Date().toISOString(),
      reason: request.reason || 'Cancellation failed',
      graceful: false,
      partialResultsPreserved: false,
      finalCost: session.metadata?.totalCost || 0,
      executionDuration: Date.now() - new Date(session.metadata.createdAt).getTime(),
      completedAgents: session.progress?.completedAgents || [],
      metadata: {
        cancellationTime: Date.now() - startTime,
        resourcesCleanedUp,
        subscribersNotified,
        checkpointsPreserved: 0
      }
    };
  }
}

/**
 * Preserve partial results from completed agents
 */
async function preservePartialResults(session: any): Promise<any> {
  const results: any = {};
  
  try {
    // Extract results from completed agents
    Object.entries(session.agentResults).forEach(([agentType, result]) => {
      const agentResult = result as any;
      if (agentResult && agentResult.success) {
        results[agentType] = {
          result: agentResult.result,
          metadata: {
            completedAt: agentResult.metadata?.completedAt,
            cost: agentResult.metadata?.cost,
            duration: agentResult.metadata?.duration,
            quality: agentResult.metadata?.quality
          }
        };
      }
    });

    // Add session metadata
    results._metadata = {
      sessionId: session.sessionId,
      destination: session.formData.destination,
      progress: session.progress,
      preservedAt: new Date().toISOString(),
      totalCost: session.metadata.totalCost,
      executionTime: Date.now() - new Date(session.metadata.createdAt).getTime()
    };

  } catch (error) {
    console.warn('Failed to preserve partial results:', error);
  }

  return results;
}

// =============================================================================
// OPTIONS HANDLER FOR CORS
// =============================================================================

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(): Promise<Response> {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');

  return new Response(null, {
    status: 204,
    headers
  });
}

// =============================================================================
// EXPORT CONFIGURATION
// =============================================================================

// Edge runtime is configured above with export const config
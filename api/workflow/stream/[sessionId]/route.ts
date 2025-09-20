/**
 * Server-Sent Events Streaming Endpoint for Workflow Progress
 * 
 * Provides real-time workflow progress updates, agent status, and completion notifications
 * using Server-Sent Events (SSE). Integrates with QStash Session Manager for live session data.
 * 
 * Features:
 * - Real-time progress streaming with SSE
 * - Agent execution status updates
 * - Cost tracking and time estimates
 * - Error handling and recovery notifications
 * - Automatic cleanup on connection close
 * - Heart beat monitoring for client connectivity
 * 
 * @route GET /api/workflow/stream/[sessionId]
 */

import { z } from 'zod';
import { qstashSessionManager } from '../../state/session-manager';
import { WorkflowState, AgentType } from '../../../../src/types/agents';

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
 * Server-Sent Event message types
 */
interface SSEMessage {
  id: string;
  event: string;
  data: any;
  retry?: number;
}

/**
 * Progress update event data
 */
interface ProgressUpdateData {
  sessionId: string;
  state: WorkflowState;
  progress: {
    currentStep: number;
    totalSteps: number;
    percentage: number;
    currentAgent: AgentType | null;
    estimatedTimeRemaining: number;
    completedAgents: AgentType[];
    failedAgents: AgentType[];
  };
  metadata: {
    totalCost: number;
    elapsedTime: number;
    retryCount: number;
    lastUpdated: string;
  };
}

/**
 * Agent status event data
 */
interface AgentStatusData {
  sessionId: string;
  agentType: AgentType;
  status: 'started' | 'in-progress' | 'completed' | 'failed';
  duration?: number;
  cost?: number;
  error?: string;
  result?: any;
}

/**
 * Error event data
 */
interface ErrorEventData {
  sessionId: string;
  error: string;
  errorType: 'agent_failure' | 'system_error' | 'timeout' | 'cost_limit_exceeded';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  retryCount: number;
  suggestedAction?: string;
}

/**
 * Completion event data
 */
interface CompletionEventData {
  sessionId: string;
  status: 'completed' | 'failed' | 'cancelled';
  finalResult?: any;
  totalDuration: number;
  totalCost: number;
  agentResults: Record<AgentType, any>;
  summary: {
    successfulAgents: number;
    failedAgents: number;
    totalRetries: number;
  };
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const SessionIdSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID format')
});

const QueryParamsSchema = z.object({
  heartbeat: z.string().optional().transform(val => val === 'true'),
  format: z.enum(['json', 'text']).optional().default('json')
});

// =============================================================================
// SSE UTILITY FUNCTIONS
// =============================================================================

/**
 * Format SSE message according to specification
 */
function formatSSEMessage(message: SSEMessage): string {
  let formatted = '';
  
  if (message.id) {
    formatted += `id: ${message.id}\n`;
  }
  
  if (message.event) {
    formatted += `event: ${message.event}\n`;
  }
  
  if (message.retry) {
    formatted += `retry: ${message.retry}\n`;
  }
  
  // Handle multi-line data
  const dataString = typeof message.data === 'string' ? 
    message.data : JSON.stringify(message.data);
  
  const dataLines = dataString.split('\n');
  for (const line of dataLines) {
    formatted += `data: ${line}\n`;
  }
  
  formatted += '\n'; // Required empty line to separate messages
  
  return formatted;
}

/**
 * Create SSE response headers
 */
function createSSEHeaders(): Headers {
  const headers = new Headers();
  headers.set('Content-Type', 'text/event-stream');
  headers.set('Cache-Control', 'no-cache');
  headers.set('Connection', 'keep-alive');
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET');
  headers.set('Access-Control-Allow-Headers', 'Cache-Control');
  return headers;
}

// =============================================================================
// MAIN ENDPOINT HANDLER
// =============================================================================

/**
 * GET handler for streaming workflow progress
 */
export default async function handler(request: Request): Promise<Response> {
  try {
    // Extract session ID from URL
    const url = new URL(request.url);
    const sessionId = url.pathname.split('/').pop();
    
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

    // Parse query parameters
    const queryParams = QueryParamsSchema.parse({
      heartbeat: url.searchParams.get('heartbeat'),
      format: url.searchParams.get('format')
    });

    // Verify session exists
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

    // Check if session is in a streamable state
    if (!session.config.streaming) {
      return new Response(
        JSON.stringify({ 
          error: 'Streaming not enabled for this session',
          sessionId 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const subscriberId = `sse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        let heartbeatInterval: NodeJS.Timeout | null = null;
        let sessionCheckInterval: NodeJS.Timeout | null = null;
        let isConnected = true;

        // Helper function to send SSE message
        const sendMessage = (message: SSEMessage) => {
          if (!isConnected) return;
          
          try {
            const formatted = formatSSEMessage(message);
            controller.enqueue(encoder.encode(formatted));
          } catch (error) {
            console.error('Failed to send SSE message:', error);
          }
        };

        // Register subscriber for real-time updates
        try {
          await qstashSessionManager.subscribe(sessionId, subscriberId);
          
          // Send initial connection confirmation
          sendMessage({
            id: `init-${Date.now()}`,
            event: 'connected',
            data: {
              sessionId,
              subscriberId,
              message: 'Connected to workflow stream',
              timestamp: new Date().toISOString()
            }
          });

          // Send current session state
          const currentSession = await qstashSessionManager.getSession(sessionId);
          if (currentSession) {
            const startTime = currentSession.metadata.startedAt ? 
              new Date(currentSession.metadata.startedAt).getTime() :
              new Date(currentSession.metadata.createdAt).getTime();
            
            const elapsedTime = Date.now() - startTime;
            
            const progressData: ProgressUpdateData = {
              sessionId,
              state: currentSession.state,
              progress: currentSession.progress,
              metadata: {
                totalCost: currentSession.metadata.totalCost,
                elapsedTime,
                retryCount: currentSession.metadata.retryCount,
                lastUpdated: currentSession.metadata.updatedAt
              }
            };

            sendMessage({
              id: `progress-${Date.now()}`,
              event: 'progress',
              data: progressData
            });

            // Send recent events
            const recentEvents = currentSession.events.slice(-5); // Last 5 events
            for (const event of recentEvents) {
              sendMessage({
                id: `event-${event.id}`,
                event: 'workflow-event',
                data: {
                  sessionId,
                  ...event
                }
              });
            }
          }

          // Setup heartbeat if requested
          if (queryParams.heartbeat) {
            heartbeatInterval = setInterval(() => {
              sendMessage({
                id: `heartbeat-${Date.now()}`,
                event: 'heartbeat',
                data: {
                  timestamp: new Date().toISOString(),
                  sessionId
                }
              });
            }, 30000); // Every 30 seconds
          }

          // Setup session monitoring for updates
          sessionCheckInterval = setInterval(async () => {
            if (!isConnected) return;

            try {
              const updatedSession = await qstashSessionManager.getSession(sessionId);
              if (!updatedSession) {
                sendMessage({
                  id: `error-${Date.now()}`,
                  event: 'error',
                  data: {
                    sessionId,
                    error: 'Session no longer exists',
                    errorType: 'system_error',
                    severity: 'high',
                    recoverable: false
                  } as ErrorEventData
                });
                return;
              }

              // Check for state changes and send updates
              if (updatedSession.metadata.updatedAt !== currentSession?.metadata.updatedAt) {
                const startTime = updatedSession.metadata.startedAt ? 
                  new Date(updatedSession.metadata.startedAt).getTime() :
                  new Date(updatedSession.metadata.createdAt).getTime();
                
                const elapsedTime = Date.now() - startTime;
                
                const progressData: ProgressUpdateData = {
                  sessionId,
                  state: updatedSession.state,
                  progress: updatedSession.progress,
                  metadata: {
                    totalCost: updatedSession.metadata.totalCost,
                    elapsedTime,
                    retryCount: updatedSession.metadata.retryCount,
                    lastUpdated: updatedSession.metadata.updatedAt
                  }
                };

                sendMessage({
                  id: `progress-${Date.now()}`,
                  event: 'progress',
                  data: progressData
                });

                // Check for completion
                if (updatedSession.state === WorkflowState.COMPLETED || 
                    updatedSession.state === WorkflowState.FAILED || 
                    updatedSession.state === WorkflowState.CANCELLED) {
                  
                  const completionData: CompletionEventData = {
                    sessionId,
                    status: updatedSession.state === WorkflowState.COMPLETED ? 'completed' :
                           updatedSession.state === WorkflowState.FAILED ? 'failed' : 'cancelled',
                    totalDuration: updatedSession.metadata.actualDuration || 0,
                    totalCost: updatedSession.metadata.totalCost,
                    agentResults: updatedSession.agentResults,
                    summary: {
                      successfulAgents: updatedSession.progress.completedAgents.length,
                      failedAgents: updatedSession.progress.failedAgents.length,
                      totalRetries: updatedSession.metadata.retryCount
                    }
                  };

                  sendMessage({
                    id: `completion-${Date.now()}`,
                    event: 'completion',
                    data: completionData
                  });

                  // Close connection after completion
                  setTimeout(() => {
                    if (controller) {
                      controller.close();
                    }
                  }, 2000); // 2 second delay for final message delivery
                }
              }

            } catch (error) {
              console.error('Session monitoring error:', error);
              sendMessage({
                id: `error-${Date.now()}`,
                event: 'error',
                data: {
                  sessionId,
                  error: 'Failed to monitor session updates',
                  errorType: 'system_error',
                  severity: 'medium',
                  recoverable: true
                } as ErrorEventData
              });
            }
          }, 2000); // Check every 2 seconds

        } catch (error) {
          console.error('Failed to setup SSE stream:', error);
          
          sendMessage({
            id: `error-${Date.now()}`,
            event: 'error',
            data: {
              sessionId,
              error: 'Failed to initialize stream',
              errorType: 'system_error',
              severity: 'critical',
              recoverable: false,
              suggestedAction: 'Refresh connection'
            } as ErrorEventData
          });

          controller.close();
        }

        // Cleanup function
        const cleanup = async () => {
          isConnected = false;
          
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
          }
          
          if (sessionCheckInterval) {
            clearInterval(sessionCheckInterval);
          }

          try {
            await qstashSessionManager.unsubscribe(sessionId, subscriberId);
          } catch (error) {
            console.warn('Failed to unsubscribe from session:', error);
          }
        };

        // Handle stream cancellation
        return cleanup;
      },

      cancel() {
        console.log(`SSE stream cancelled for session ${sessionId}`);
      }
    });

    // Return SSE response
    return new Response(stream, {
      headers: createSSEHeaders()
    });

  } catch (error) {
    console.error('SSE endpoint error:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request parameters',
          details: error.errors 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'Failed to initialize stream' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// =============================================================================
// EXPORT ROUTE CONFIGURATION
// =============================================================================

// Edge runtime is configured above with export const config
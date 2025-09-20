/**
 * Hylo Workflow State Management API
 * 
 * Vercel Edge Function for workflow state operations:
 * - GET: Retrieve workflow state and progress
 * - PUT: Update workflow configuration or pause/resume
 * - DELETE: Cancel workflow execution
 * 
 * Provides comprehensive session management with persistent state tracking
 */

import { z } from 'zod';
import { HyloWorkflowOrchestrator, DefaultWorkflowConfig } from '../orchestrator';
import { 
  WorkflowState,
  WorkflowConfig,
  AgentType,
  type WorkflowError
} from '../../../src/types/agents';

/**
 * State update request schema
 */
const StateUpdateRequestSchema = z.object({
  action: z.enum(['pause', 'resume', 'cancel', 'update-config']),
  config: z.object({
    resourceLimits: z.object({
      maxCost: z.number().optional(),
      maxExecutionTime: z.number().optional(),
      maxTokensPerAgent: z.number().optional()
    }).optional(),
    observability: z.object({
      langsmithEnabled: z.boolean().optional(),
      verboseLogging: z.boolean().optional()
    }).optional()
  }).optional()
});

/**
 * Workflow state response interface
 */
interface WorkflowStateResponse {
  success: boolean;
  sessionId: string;
  state: WorkflowState;
  progress: {
    currentStep: number;
    totalSteps: number;
    percentage: number;
    currentAgent?: AgentType;
    completedAgents: AgentType[];
  };
  metadata: {
    startedAt: string;
    currentAgentStartedAt?: string;
    totalCost: number;
    executionTimeMs?: number;
    errors: WorkflowError[];
  };
  agentResults?: Record<AgentType, any> | Partial<Record<AgentType, any>>;
  message?: string;
}

/**
 * Main Edge Function handler
 */
export default async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  
  // Extract session ID from URL path
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  const sessionId = pathSegments[pathSegments.length - 1];
  
  if (!sessionId || sessionId === 'route') {
    return new Response(JSON.stringify({
      success: false,
      message: 'Session ID is required in URL path'
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Validate session ID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Invalid session ID format'
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const orchestrator = new HyloWorkflowOrchestrator(DefaultWorkflowConfig);
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return await handleGetState(orchestrator, sessionId);
      case 'PUT':
        return await handleUpdateState(orchestrator, sessionId, req);
      case 'DELETE':
        return await handleCancelWorkflow(orchestrator, sessionId);
      default:
        return new Response(JSON.stringify({
          success: false,
          message: `Method ${req.method} not allowed`
        }), { 
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        });
    }
    
  } catch (error) {
    console.error('State management error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle GET request - retrieve workflow state
 */
async function handleGetState(
  orchestrator: HyloWorkflowOrchestrator,
  sessionId: string
): Promise<Response> {
  
  const state = await orchestrator.getWorkflowState(sessionId);
  
  if (!state) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Workflow session not found',
      sessionId
    }), { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Calculate execution time if started
  let executionTimeMs: number | undefined;
  if (state.metadata.startedAt) {
    executionTimeMs = state.state === WorkflowState.COMPLETED || 
                     state.state === WorkflowState.FAILED || 
                     state.state === WorkflowState.CANCELLED
      ? (state.metadata.startedAt ? Date.now() - state.metadata.startedAt.getTime() : 0)
      : Date.now() - state.metadata.startedAt.getTime();
  }
  
  const response: WorkflowStateResponse = {
    success: true,
    sessionId,
    state: state.state,
    progress: {
      currentStep: state.metadata.progress.currentStep,
      totalSteps: state.metadata.progress.totalSteps,
      percentage: state.metadata.progress.percentage,
      currentAgent: state.metadata.currentAgent,
      completedAgents: state.metadata.completedAgents
    },
    metadata: {
      startedAt: state.metadata.startedAt.toISOString(),
      currentAgentStartedAt: state.metadata.currentAgentStartedAt?.toISOString(),
      totalCost: state.metadata.totalCost,
      executionTimeMs,
      errors: state.metadata.errors
    },
    // Only include results for completed agents if workflow is successful
    agentResults: state.state === WorkflowState.COMPLETED 
      ? state.agentResults as Record<AgentType, any>
      : Object.entries(state.agentResults)
          .filter(([_, result]) => result?.success)
          .reduce((acc, [agent, result]) => ({ ...acc, [agent]: result }), {} as Record<AgentType, any>)
  };
  
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
      'X-Workflow-State': state.state,
      'X-Progress-Percentage': state.metadata.progress.percentage.toString()
    }
  });
}

/**
 * Handle PUT request - update workflow state or configuration
 */
async function handleUpdateState(
  orchestrator: HyloWorkflowOrchestrator,
  sessionId: string,
  req: Request
): Promise<Response> {
  
  // Check if workflow exists
  const currentState = await orchestrator.getWorkflowState(sessionId);
  if (!currentState) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Workflow session not found',
      sessionId
    }), { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Parse and validate request body
  const body = await req.json();
  const updateRequest = StateUpdateRequestSchema.parse(body);
  
  const { action, config } = updateRequest;
  
  switch (action) {
    case 'pause':
      return await handlePauseWorkflow(orchestrator, sessionId, currentState);
    
    case 'resume':
      return await handleResumeWorkflow(orchestrator, sessionId, currentState);
    
    case 'cancel':
      return await handleCancelWorkflow(orchestrator, sessionId);
    
    case 'update-config':
      return await handleUpdateConfig(orchestrator, sessionId, currentState, config);
    
    default:
      return new Response(JSON.stringify({
        success: false,
        message: `Unknown action: ${action}`
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

/**
 * Handle pause workflow request
 */
async function handlePauseWorkflow(
  orchestrator: HyloWorkflowOrchestrator,
  sessionId: string,
  currentState: any
): Promise<Response> {
  
  // Check if workflow can be paused
  if (currentState.state === WorkflowState.COMPLETED || 
      currentState.state === WorkflowState.FAILED || 
      currentState.state === WorkflowState.CANCELLED) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Cannot pause a completed workflow',
      sessionId,
      currentState: currentState.state
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // For now, we'll record the pause request but LangGraph doesn't have built-in pause
  // This would require implementing custom pause/resume logic
  return new Response(JSON.stringify({
    success: false,
    message: 'Workflow pause functionality not yet implemented',
    sessionId,
    note: 'LangGraph StateGraph does not support pause/resume out of the box'
  }), { 
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Handle resume workflow request
 */
async function handleResumeWorkflow(
  orchestrator: HyloWorkflowOrchestrator,
  sessionId: string,
  currentState: any
): Promise<Response> {
  
  return new Response(JSON.stringify({
    success: false,
    message: 'Workflow resume functionality not yet implemented',
    sessionId,
    note: 'LangGraph StateGraph does not support pause/resume out of the box'
  }), { 
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Handle cancel workflow request
 */
async function handleCancelWorkflow(
  orchestrator: HyloWorkflowOrchestrator,
  sessionId: string
): Promise<Response> {
  
  try {
    // Check if workflow exists
    const currentState = await orchestrator.getWorkflowState(sessionId);
    if (!currentState) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Workflow session not found',
        sessionId
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if already completed
    if (currentState.state === WorkflowState.COMPLETED || 
        currentState.state === WorkflowState.FAILED || 
        currentState.state === WorkflowState.CANCELLED) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Workflow is already in a terminal state',
        sessionId,
        state: currentState.state
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Cancel the workflow
    await orchestrator.cancelWorkflow(sessionId);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Workflow cancelled successfully',
      sessionId,
      state: WorkflowState.CANCELLED,
      cancelledAt: new Date().toISOString()
    }), { 
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
        'X-Workflow-State': WorkflowState.CANCELLED
      }
    });
    
  } catch (error) {
    console.error('Cancel workflow error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to cancel workflow',
      error: error instanceof Error ? error.message : 'Unknown error',
      sessionId
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle update configuration request
 */
async function handleUpdateConfig(
  orchestrator: HyloWorkflowOrchestrator,
  sessionId: string,
  currentState: any,
  configUpdates: any
): Promise<Response> {
  
  // Check if workflow is still active
  if (currentState.state === WorkflowState.COMPLETED || 
      currentState.state === WorkflowState.FAILED || 
      currentState.state === WorkflowState.CANCELLED) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Cannot update configuration for completed workflow',
      sessionId,
      currentState: currentState.state
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Configuration updates would require workflow restart in current implementation
  return new Response(JSON.stringify({
    success: false,
    message: 'Dynamic configuration updates not yet implemented',
    sessionId,
    note: 'Configuration changes require workflow restart',
    suggestion: 'Cancel current workflow and start a new one with updated configuration'
  }), { 
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * List all active workflow sessions (for debugging/admin)
 */
export async function handleListSessions(): Promise<Response> {
  // This would require a session registry implementation
  return new Response(JSON.stringify({
    success: false,
    message: 'Session listing not implemented',
    note: 'Would require persistent session registry'
  }), { 
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  });
}
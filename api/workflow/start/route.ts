/**
 * Hylo Workflow Start Endpoint
 * 
 * Vercel Edge Function for initiating multi-agent workflow execution
 * Supports both streaming and batch execution modes
 * 
 * Based on Vercel Edge Functions patterns from context7 research:
 * - Streaming API with ReadableStream for real-time progress updates
 * - Proper session management with UUID-based session IDs
 * - Comprehensive error handling and validation
 * - Cost tracking and resource limit enforcement
 */

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Import the orchestrator and types
import { HyloWorkflowOrchestrator, DefaultWorkflowConfig } from '../orchestrator';
import { 
  TravelFormDataSchema,
  WorkflowConfig,
  WorkflowState,
  AgentType,
  LLMProvider,
  type TravelFormData
} from '../../../src/types/agents';

/**
 * Request payload validation schema
 */
const WorkflowStartRequestSchema = z.object({
  formData: TravelFormDataSchema,
  config: z.object({
    streaming: z.boolean().optional().default(true),
    sessionId: z.string().uuid().optional(),
    resourceLimits: z.object({
      maxExecutionTime: z.number().optional(),
      maxCost: z.number().optional(),
      maxTokensPerAgent: z.number().optional()
    }).optional(),
    observability: z.object({
      langsmithEnabled: z.boolean().optional(),
      langsmithProject: z.string().optional(),
      verboseLogging: z.boolean().optional()
    }).optional()
  }).optional().default({})
});

type WorkflowStartRequest = z.infer<typeof WorkflowStartRequestSchema>;

/**
 * Response schema for non-streaming mode
 */
interface WorkflowStartResponse {
  success: boolean;
  sessionId: string;
  state: WorkflowState;
  message: string;
  data?: any;
  errors?: string[];
  metadata: {
    startedAt: string;
    totalCost: number;
    executionTimeMs?: number;
    completedAgents: AgentType[];
  };
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
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  
  // Handle GET requests for health check and session status
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Workflow API is operational',
        endpoint: '/api/workflow/start',
        version: '1.0.0',
        capabilities: [
          'streaming-execution',
          'batch-execution', 
          'session-management',
          'progress-tracking',
          'cost-tracking',
          'error-recovery'
        ]
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    try {
      // Create orchestrator to check session state
      const orchestrator = new HyloWorkflowOrchestrator(DefaultWorkflowConfig);
      const state = await orchestrator.getWorkflowState(sessionId);
      
      if (!state) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Session not found',
          sessionId
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({
        success: true,
        sessionId,
        state: state.state,
        progress: state.metadata.progress,
        totalCost: state.metadata.totalCost,
        completedAgents: state.metadata.completedAgents,
        errors: state.metadata.errors
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('Session check error:', error);
      return new Response(JSON.stringify({
        success: false,
        message: 'Failed to check session state',
        error: error instanceof Error ? error.message : 'Unknown error'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // Handle POST requests for workflow start
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      message: 'Method not allowed'
    }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Parse and validate request body
    const body = await req.json();
    const validatedRequest = WorkflowStartRequestSchema.parse(body);
    
    const { formData, config } = validatedRequest;
    
    // Generate session ID if not provided
    const sessionId = config.sessionId || uuidv4();
    
    // Merge config with defaults
    const workflowConfig: WorkflowConfig = {
      ...DefaultWorkflowConfig,
      streaming: config.streaming ?? true,
      // Merge resource limits
      resourceLimits: {
        ...DefaultWorkflowConfig.resourceLimits,
        ...config.resourceLimits
      },
      // Merge observability settings
      observability: {
        ...DefaultWorkflowConfig.observability,
        ...config.observability
      }
    };
    
    // Create orchestrator instance
    const orchestrator = new HyloWorkflowOrchestrator(workflowConfig);
    
    // Handle streaming vs batch execution
    if (workflowConfig.streaming) {
      return handleStreamingWorkflow(orchestrator, sessionId, formData, workflowConfig);
    } else {
      return handleBatchWorkflow(orchestrator, sessionId, formData, workflowConfig);
    }
    
  } catch (error) {
    console.error('Workflow start error:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid request data',
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
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
 * Handle streaming workflow execution with real-time updates
 */
async function handleStreamingWorkflow(
  orchestrator: HyloWorkflowOrchestrator,
  sessionId: string,
  formData: TravelFormData,
  config: WorkflowConfig
): Promise<Response> {
  
  // Create readable stream for streaming response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial response
        const initialEvent = {
          type: 'workflow-started',
          sessionId,
          timestamp: new Date().toISOString(),
          data: {
            state: WorkflowState.INITIALIZED,
            progress: { currentStep: 0, totalSteps: 4, percentage: 0 }
          }
        };
        
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify(initialEvent)}\n\n`)
        );
        
        // Stream workflow execution
        for await (const state of orchestrator.streamWorkflow(sessionId, formData, config)) {
          const event = {
            type: 'state-update',
            sessionId,
            timestamp: new Date().toISOString(),
            data: {
              state: state.state,
              currentAgent: state.metadata.currentAgent,
              progress: state.metadata.progress,
              completedAgents: state.metadata.completedAgents,
              totalCost: state.metadata.totalCost,
              errors: state.metadata.errors.slice(-3), // Only send recent errors
              // Send partial results for completed agents
              agentResults: Object.entries(state.agentResults)
                .filter(([_, result]) => result?.success)
                .reduce((acc, [agent, result]) => ({ ...acc, [agent]: result }), {})
            }
          };
          
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)
          );
          
          // Check if workflow is complete
          if (state.state === WorkflowState.COMPLETED || 
              state.state === WorkflowState.FAILED || 
              state.state === WorkflowState.CANCELLED) {
            
            const executionTime = state.metadata.startedAt 
              ? Date.now() - state.metadata.startedAt.getTime()
              : 0;
            
            const finalEvent = {
              type: 'workflow-completed',
              sessionId,
              timestamp: new Date().toISOString(),
              data: {
                state: state.state,
                success: state.state === WorkflowState.COMPLETED,
                totalCost: state.metadata.totalCost,
                executionTimeMs: executionTime,
                completedAgents: state.metadata.completedAgents,
                agentResults: state.agentResults,
                errors: state.metadata.errors
              }
            };
            
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify(finalEvent)}\n\n`)
            );
            break;
          }
        }
        
      } catch (error) {
        console.error('Streaming workflow error:', error);
        
        const errorEvent = {
          type: 'workflow-error',
          sessionId,
          timestamp: new Date().toISOString(),
          data: {
            error: error instanceof Error ? error.message : 'Unknown streaming error',
            state: WorkflowState.FAILED
          }
        };
        
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify(errorEvent)}\n\n`)
        );
      } finally {
        controller.close();
      }
    }
  });
  
  // Return streaming response with proper headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Session-ID': sessionId
    }
  });
}

/**
 * Handle batch workflow execution (non-streaming)
 */
async function handleBatchWorkflow(
  orchestrator: HyloWorkflowOrchestrator,
  sessionId: string,
  formData: TravelFormData,
  config: WorkflowConfig
): Promise<Response> {
  
  try {
    const startTime = Date.now();
    
    // Execute workflow
    const result = await orchestrator.executeWorkflow(sessionId, formData, config);
    
    const executionTimeMs = Date.now() - startTime;
    
    // Build response
    const response: WorkflowStartResponse = {
      success: result.state === WorkflowState.COMPLETED,
      sessionId,
      state: result.state,
      message: result.state === WorkflowState.COMPLETED 
        ? 'Workflow completed successfully'
        : 'Workflow failed or was cancelled',
      data: result.state === WorkflowState.COMPLETED 
        ? result.agentResults
        : undefined,
      errors: result.metadata.errors.map(error => error.message),
      metadata: {
        startedAt: result.metadata.startedAt.toISOString(),
        totalCost: result.metadata.totalCost,
        executionTimeMs,
        completedAgents: result.metadata.completedAgents
      }
    };
    
    return new Response(JSON.stringify(response), {
      status: response.success ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
        'X-Execution-Time': executionTimeMs.toString()
      }
    });
    
  } catch (error) {
    console.error('Batch workflow error:', error);
    
    const errorResponse: WorkflowStartResponse = {
      success: false,
      sessionId,
      state: WorkflowState.FAILED,
      message: 'Workflow execution failed',
      errors: [error instanceof Error ? error.message : 'Unknown execution error'],
      metadata: {
        startedAt: new Date().toISOString(),
        totalCost: 0,
        executionTimeMs: Date.now(),
        completedAgents: []
      }
    };
    
    return new Response(JSON.stringify(errorResponse), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId
      }
    });
  }
}
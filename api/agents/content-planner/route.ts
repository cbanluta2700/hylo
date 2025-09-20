/**
 * Content Planner Agent API Endpoint
 * Vercel Edge Function for the first agent in the multi-agent workflow
 * 
 * Analyzes user requirements and determines information gathering needs using LLM
 * with structured output validation.
 */

import { ContentPlannerAgent } from '../../../src/agents/base/BaseAgent';
import { 
  TravelFormDataSchema, 
  WorkflowContext, 
  WorkflowState, 
  AgentType,
  TravelFormData,
  RetryConfig,
  ResourceLimits,
  ObservabilityConfig
} from '../../../src/types/agents';
import { z } from 'zod';

// Configure Edge Runtime
export const runtime = 'edge';

// Create WorkflowContext schema
const WorkflowContextSchema = z.object({
  sessionId: z.string(),
  currentAgent: z.string(),
  previousAgent: z.string().nullable(),
  nextAgent: z.string().nullable(),
  startTime: z.string(),
  formData: TravelFormDataSchema,
  agentResults: z.record(z.any()),
  metadata: z.object({
    requestId: z.string(),
    userAgent: z.string(),
    timestamp: z.string()
  }).optional()
});

// Request validation schema
const ContentPlannerRequestSchema = z.object({
  formData: TravelFormDataSchema,
  context: WorkflowContextSchema.optional(),
  options: z.object({
    maxTokens: z.number().optional().default(4000),
    temperature: z.number().optional().default(0.2),
    timeout: z.number().optional().default(30000)
  }).optional().default({})
});

export async function POST(request: Request): Promise<Response> {
  const startTime = Date.now();
  
  try {
    // Parse and validate request body
    const rawBody = await request.json();
    const { formData, context, options } = ContentPlannerRequestSchema.parse(rawBody);

    // Initialize ContentPlanner agent
    const agent = new ContentPlannerAgent();

    // Create simplified workflow context for the agent
    const workflowContext: WorkflowContext = {
      sessionId: context?.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      formData,
      state: WorkflowState.CONTENT_PLANNING,
      agentResults: {
        [AgentType.CONTENT_PLANNER]: null,
        [AgentType.INFO_GATHERER]: null,
        [AgentType.STRATEGIST]: null,
        [AgentType.COMPILER]: null
      },
      messages: [],
      config: {
        streaming: false,
        providerChains: {
          [AgentType.CONTENT_PLANNER]: [],
          [AgentType.INFO_GATHERER]: [],
          [AgentType.STRATEGIST]: [],
          [AgentType.COMPILER]: []
        },
        retryConfig: {
          maxRetries: 3,
          baseDelay: 1000,
          backoffMultiplier: 2,
          maxDelay: 10000,
          retryableErrors: ['timeout', 'rate_limit', 'provider_error']
        },
        resourceLimits: {
          maxExecutionTime: options.timeout || 30000,
          maxCost: 1.0,
          maxTokensPerAgent: options.maxTokens || 4000,
          maxMemoryUsage: 512,
          maxConcurrentWorkflows: 1
        },
        observability: {
          langsmithEnabled: false,
          metricsEnabled: true,
          verboseLogging: false,
          tags: {
            agent: 'content-planner',
            session: context?.sessionId || 'unknown'
          }
        }
      },
      metadata: {
        startedAt: new Date(),
        totalCost: 0,
        metrics: {},
        errors: []
      }
    };

    // Execute agent with timeout protection
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Agent execution timeout')), options.timeout)
    );

    const agentPromise = agent.execute(workflowContext);
    const result = await Promise.race([agentPromise, timeoutPromise]) as any;

    // Calculate execution metrics
    const executionTime = Date.now() - startTime;

    // Prepare successful response
    const response = {
      success: true,
      agent: 'content_planner',
      executionTime,
      result,
      context: {
        ...workflowContext,
        agentResults: {
          ...workflowContext.agentResults,
          content_planner: result
        },
        nextAgent: result.nextAgent || 'info_gatherer'
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: agent.version,
        model: 'LLM-powered analysis',
        cost: workflowContext.metadata.totalCost
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Agent-Type': 'content-planner',
        'X-Execution-Time': executionTime.toString()
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    console.error('Content Planner Agent Error:', error);

    // Determine error type and response
    let status = 500;
    let errorType = 'INTERNAL_ERROR';
    let message = 'Internal server error';

    if (error instanceof z.ZodError) {
      status = 400;
      errorType = 'VALIDATION_ERROR';
      message = 'Invalid request data';
    } else if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        status = 408;
        errorType = 'TIMEOUT_ERROR';
        message = 'Agent execution timeout';
      } else if (error.message.includes('LLM provider')) {
        status = 503;
        errorType = 'LLM_ERROR';
        message = 'LLM service unavailable';
      } else {
        message = error.message;
      }
    }

    const errorResponse = {
      success: false,
      agent: 'content_planner',
      error: {
        type: errorType,
        message,
        details: error instanceof z.ZodError ? error.errors : undefined
      },
      executionTime,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: `error_${Date.now()}`
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Type': 'content-planner',
        'X-Error-Type': errorType
      }
    });
  }
}

// Handle unsupported methods
export async function GET(): Promise<Response> {
  return new Response(
    JSON.stringify({ error: 'Method not allowed. Use POST to execute the Content Planner agent.' }),
    { 
      status: 405, 
      headers: { 
        'Allow': 'POST',
        'Content-Type': 'application/json'
      } 
    }
  );
}

export async function PUT(): Promise<Response> {
  return new Response(
    JSON.stringify({ error: 'Method not allowed. Use POST to execute the Content Planner agent.' }),
    { 
      status: 405, 
      headers: { 
        'Allow': 'POST',
        'Content-Type': 'application/json'
      } 
    }
  );
}

export async function DELETE(): Promise<Response> {
  return new Response(
    JSON.stringify({ error: 'Method not allowed. Use POST to execute the Content Planner agent.' }),
    { 
      status: 405, 
      headers: { 
        'Allow': 'POST',
        'Content-Type': 'application/json'
      } 
    }
  );
}
/**
 * Strategist Agent API Endpoint
 * Vercel Edge Function for the third agent in the multi-agent workflow
 * 
 * Performs strategic analysis using RAG-enhanced context retrieval,
 * budget optimization and risk assessment.
 */

import { StrategistAgent } from '../../../src/agents/base/BaseAgent';
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

// Simplified context schema for API requests
const ApiContextSchema = z.object({
  sessionId: z.string(),
  currentAgent: z.string(),
  previousAgent: z.string().nullable(),
  nextAgent: z.string().nullable(),
  agentResults: z.record(z.any()),
  plannerData: z.any().optional(),
  gathererData: z.any().optional()
});

// Request validation schema
const StrategistRequestSchema = z.object({
  formData: TravelFormDataSchema,
  context: ApiContextSchema.optional(),
  plannerData: z.any().optional(),
  gathererData: z.any().optional(),
  options: z.object({
    maxTokens: z.number().optional().default(4000),
    temperature: z.number().optional().default(0.2),
    timeout: z.number().optional().default(40000)
  }).optional().default({})
});

export async function POST(request: Request): Promise<Response> {
  const startTime = Date.now();
  
  try {
    // Parse and validate request body
    const rawBody = await request.json();
    const { formData, context, plannerData, gathererData, options } = StrategistRequestSchema.parse(rawBody);

    // Initialize Strategist agent
    const agent = new StrategistAgent();

    // Create workflow context
    const workflowContext: WorkflowContext = {
      sessionId: context?.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      formData,
      state: WorkflowState.STRATEGIZING,
      agentResults: {
        [AgentType.CONTENT_PLANNER]: plannerData || context?.agentResults?.content_planner || null,
        [AgentType.INFO_GATHERER]: gathererData || context?.agentResults?.info_gatherer || null,
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
          retryableErrors: ['timeout', 'rate_limit', 'provider_error', 'vector_error']
        },
        resourceLimits: {
          maxExecutionTime: options.timeout || 40000,
          maxCost: 1.5, // Strategic analysis with RAG
          maxTokensPerAgent: options.maxTokens || 4000,
          maxMemoryUsage: 768,
          maxConcurrentWorkflows: 1
        },
        observability: {
          langsmithEnabled: false,
          metricsEnabled: true,
          verboseLogging: false,
          tags: {
            agent: 'strategist',
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
      agent: 'strategist',
      executionTime,
      result,
      context: {
        sessionId: workflowContext.sessionId,
        currentAgent: 'strategist',
        nextAgent: result.nextAgent || 'compiler',
        agentResults: {
          ...context?.agentResults,
          content_planner: plannerData,
          info_gatherer: gathererData,
          strategist: result
        }
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: agent.version,
        model: 'Strategic analysis + RAG',
        cost: workflowContext.metadata.totalCost,
        recommendations: result.recommendations?.length || 0,
        confidenceScore: result.confidenceScore || 0,
        budgetOptimization: {
          totalBudget: result.budgetOptimization?.totalBudget || 0,
          breakdown: result.budgetOptimization?.breakdown || {}
        },
        riskAssessment: result.riskAssessment?.overall || 'unknown'
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Agent-Type': 'strategist',
        'X-Execution-Time': executionTime.toString(),
        'X-Recommendations': (result.recommendations?.length || 0).toString(),
        'X-Confidence-Score': (result.confidenceScore || 0).toString()
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    console.error('Strategist Agent Error:', error);

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
      } else if (error.message.includes('vector')) {
        status = 503;
        errorType = 'VECTOR_ERROR';
        message = 'Vector database service unavailable';
      } else if (error.message.includes('LLM provider')) {
        status = 503;
        errorType = 'LLM_ERROR';
        message = 'LLM service unavailable';
      } else if (error.message.includes('insufficient data')) {
        status = 422;
        errorType = 'INSUFFICIENT_DATA';
        message = 'Insufficient data for strategic analysis';
      } else {
        message = error.message;
      }
    }

    const errorResponse = {
      success: false,
      agent: 'strategist',
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
        'X-Agent-Type': 'strategist',
        'X-Error-Type': errorType
      }
    });
  }
}

// Handle unsupported methods
export async function GET(): Promise<Response> {
  return new Response(
    JSON.stringify({ error: 'Method not allowed. Use POST to execute the Strategist agent.' }),
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
    JSON.stringify({ error: 'Method not allowed. Use POST to execute the Strategist agent.' }),
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
    JSON.stringify({ error: 'Method not allowed. Use POST to execute the Strategist agent.' }),
    { 
      status: 405, 
      headers: { 
        'Allow': 'POST',
        'Content-Type': 'application/json'
      } 
    }
  );
}
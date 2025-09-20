/**
 * Info Gatherer Agent API Endpoint
 * Vercel Edge Function for the second agent in the multi-agent workflow
 * 
 * Collects real-time web data using Upstash Vector integration and semantic search
 * for content structuring and embedding generation.
 */

import { InfoGathererAgent } from '../../../src/agents/base/BaseAgent';
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
  plannerData: z.any().optional()
});

// Request validation schema
const InfoGathererRequestSchema = z.object({
  formData: TravelFormDataSchema,
  context: ApiContextSchema.optional(),
  plannerData: z.any().optional(),
  options: z.object({
    maxTokens: z.number().optional().default(3000),
    temperature: z.number().optional().default(0.3),
    timeout: z.number().optional().default(45000) // Longer for data gathering
  }).optional().default({})
});

export async function POST(request: Request): Promise<Response> {
  const startTime = Date.now();
  
  try {
    // Parse and validate request body
    const rawBody = await request.json();
    const { formData, context, plannerData, options } = InfoGathererRequestSchema.parse(rawBody);

    // Initialize InfoGatherer agent
    const agent = new InfoGathererAgent();

    // Create workflow context
    const workflowContext: WorkflowContext = {
      sessionId: context?.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      formData,
      state: WorkflowState.INFO_GATHERING,
      agentResults: {
        [AgentType.CONTENT_PLANNER]: plannerData || context?.agentResults?.content_planner || null,
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
          retryableErrors: ['timeout', 'rate_limit', 'provider_error', 'vector_error']
        },
        resourceLimits: {
          maxExecutionTime: options.timeout || 45000,
          maxCost: 2.0, // Higher for web scraping and vector operations
          maxTokensPerAgent: options.maxTokens || 3000,
          maxMemoryUsage: 1024, // More memory for data processing
          maxConcurrentWorkflows: 1
        },
        observability: {
          langsmithEnabled: false,
          metricsEnabled: true,
          verboseLogging: false,
          tags: {
            agent: 'info-gatherer',
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
      agent: 'info_gatherer',
      executionTime,
      result,
      context: {
        sessionId: workflowContext.sessionId,
        currentAgent: 'info_gatherer',
        nextAgent: result.nextAgent || 'strategist',
        agentResults: {
          ...context?.agentResults,
          content_planner: plannerData,
          info_gatherer: result
        }
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: agent.version,
        model: 'Web data collection + Vector search',
        cost: workflowContext.metadata.totalCost,
        dataPoints: result.totalDataPoints || 0,
        vectorOperations: result.vectorOperations || 0
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Agent-Type': 'info-gatherer',
        'X-Execution-Time': executionTime.toString(),
        'X-Data-Points': (result.totalDataPoints || 0).toString()
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    console.error('Info Gatherer Agent Error:', error);

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
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        status = 503;
        errorType = 'NETWORK_ERROR';
        message = 'Network or web scraping error';
      } else {
        message = error.message;
      }
    }

    const errorResponse = {
      success: false,
      agent: 'info_gatherer',
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
        'X-Agent-Type': 'info-gatherer',
        'X-Error-Type': errorType
      }
    });
  }
}

// Handle unsupported methods
export async function GET(): Promise<Response> {
  return new Response(
    JSON.stringify({ error: 'Method not allowed. Use POST to execute the Info Gatherer agent.' }),
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
    JSON.stringify({ error: 'Method not allowed. Use POST to execute the Info Gatherer agent.' }),
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
    JSON.stringify({ error: 'Method not allowed. Use POST to execute the Info Gatherer agent.' }),
    { 
      status: 405, 
      headers: { 
        'Allow': 'POST',
        'Content-Type': 'application/json'
      } 
    }
  );
}
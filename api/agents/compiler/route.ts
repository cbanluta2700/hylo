/**
 * Compiler Agent API Endpoint
 * Vercel Edge Function for the fourth and final agent in the multi-agent workflow
 * 
 * Compiles all agent results into a comprehensive, structured itinerary
 * with proper formatting and finalization.
 */

import { CompilerAgent } from '../../../src/agents/base/BaseAgent';
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
  gathererData: z.any().optional(),
  strategistData: z.any().optional()
});

// Request validation schema
const CompilerRequestSchema = z.object({
  formData: TravelFormDataSchema,
  context: ApiContextSchema.optional(),
  plannerData: z.any().optional(),
  gathererData: z.any().optional(),
  strategistData: z.any().optional(),
  options: z.object({
    maxTokens: z.number().optional().default(6000),
    temperature: z.number().optional().default(0.1),
    timeout: z.number().optional().default(45000),
    format: z.enum(['markdown', 'json', 'html']).optional().default('markdown')
  }).optional().default({})
});

export async function POST(request: Request): Promise<Response> {
  const startTime = Date.now();
  
  try {
    // Parse and validate request body
    const rawBody = await request.json();
    const { formData, context, plannerData, gathererData, strategistData, options } = CompilerRequestSchema.parse(rawBody);

    // Initialize Compiler agent
    const agent = new CompilerAgent();

    // Create workflow context
    const workflowContext: WorkflowContext = {
      sessionId: context?.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      formData,
      state: WorkflowState.COMPILING,
      agentResults: {
        [AgentType.CONTENT_PLANNER]: plannerData || context?.agentResults?.content_planner || null,
        [AgentType.INFO_GATHERER]: gathererData || context?.agentResults?.info_gatherer || null,
        [AgentType.STRATEGIST]: strategistData || context?.agentResults?.strategist || null,
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
          retryableErrors: ['timeout', 'rate_limit', 'provider_error', 'compilation_error']
        },
        resourceLimits: {
          maxExecutionTime: options.timeout || 45000,
          maxCost: 2.0, // Final compilation with extensive processing
          maxTokensPerAgent: options.maxTokens || 6000,
          maxMemoryUsage: 1024,
          maxConcurrentWorkflows: 1
        },
        observability: {
          langsmithEnabled: false,
          metricsEnabled: true,
          verboseLogging: false,
          tags: {
            agent: 'compiler',
            session: context?.sessionId || 'unknown',
            format: options.format || 'markdown'
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

    // Extract itinerary sections for metadata
    const itinerary = result.itinerary || result.compiledItinerary || {};
    const dailyItinerary = itinerary.dailyItinerary || [];
    const tripTips = itinerary.tripTips || [];

    // Prepare successful response
    const response = {
      success: true,
      agent: 'compiler',
      executionTime,
      result,
      context: {
        sessionId: workflowContext.sessionId,
        currentAgent: 'compiler',
        nextAgent: null, // Final agent in the workflow
        agentResults: {
          ...context?.agentResults,
          content_planner: plannerData,
          info_gatherer: gathererData,
          strategist: strategistData,
          compiler: result
        }
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: agent.version,
        model: 'Final itinerary compilation',
        cost: workflowContext.metadata.totalCost,
        itinerary: {
          format: options.format || 'markdown',
          days: dailyItinerary.length,
          activitiesTotal: dailyItinerary.reduce((sum: number, day: any) => 
            sum + (day.activities?.length || 0), 0),
          tipsCount: tripTips.length,
          wordCount: JSON.stringify(itinerary).length,
          hasAccommodations: !!(itinerary.accommodations || itinerary.hotels),
          hasTransportation: !!(itinerary.transportation || itinerary.flights),
          hasBudgetBreakdown: !!(itinerary.budgetBreakdown || itinerary.budget)
        },
        compilation: {
          sourceAgents: Object.keys(workflowContext.agentResults).filter(
            key => workflowContext.agentResults[key as AgentType] !== null
          ),
          processingTime: result.processingTime || 0,
          qualityScore: result.qualityScore || 0,
          completenessScore: result.completenessScore || 0
        }
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Agent-Type': 'compiler',
        'X-Execution-Time': executionTime.toString(),
        'X-Itinerary-Days': dailyItinerary.length.toString(),
        'X-Activities-Total': dailyItinerary.reduce((sum: number, day: any) => 
          sum + (day.activities?.length || 0), 0).toString(),
        'X-Word-Count': JSON.stringify(itinerary).length.toString(),
        'X-Quality-Score': (result.qualityScore || 0).toString()
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    console.error('Compiler Agent Error:', error);

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
      } else if (error.message.includes('compilation')) {
        status = 500;
        errorType = 'COMPILATION_ERROR';
        message = 'Failed to compile itinerary';
      } else if (error.message.includes('LLM provider')) {
        status = 503;
        errorType = 'LLM_ERROR';
        message = 'LLM service unavailable';
      } else if (error.message.includes('incomplete data')) {
        status = 422;
        errorType = 'INCOMPLETE_DATA';
        message = 'Insufficient agent results for compilation';
      } else if (error.message.includes('format')) {
        status = 400;
        errorType = 'FORMAT_ERROR';
        message = 'Invalid output format requested';
      } else {
        message = error.message;
      }
    }

    const errorResponse = {
      success: false,
      agent: 'compiler',
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
        'X-Agent-Type': 'compiler',
        'X-Error-Type': errorType
      }
    });
  }
}

// Handle unsupported methods
export async function GET(): Promise<Response> {
  return new Response(
    JSON.stringify({ error: 'Method not allowed. Use POST to execute the Compiler agent.' }),
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
    JSON.stringify({ error: 'Method not allowed. Use POST to execute the Compiler agent.' }),
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
    JSON.stringify({ error: 'Method not allowed. Use POST to execute the Compiler agent.' }),
    { 
      status: 405, 
      headers: { 
        'Allow': 'POST',
        'Content-Type': 'application/json'
      } 
    }
  );
}
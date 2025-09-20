/**
 * Workflow Result Retrieval Endpoint
 * 
 * Retrieves completed workflow results with full itinerary data and execution metadata.
 * Supports both streaming and static result retrieval with comprehensive error handling.
 * 
 * Features:
 * - Full itinerary result retrieval
 * - Execution metadata and performance metrics
 * - Agent result aggregation and analysis
 * - Cost breakdown and resource utilization
 * - Error handling and partial result support
 * - JSON and formatted output options
 * 
 * @route GET /api/workflow/result/[sessionId]
 */

import { z } from 'zod';
import { qstashSessionManager } from '../../state/session-manager';
import { WorkflowState, AgentType, type AgentResult } from '../../../../src/types/agents';

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
 * Complete workflow result with all metadata
 */
interface WorkflowResult {
  sessionId: string;
  status: 'completed' | 'failed' | 'partial' | 'cancelled';
  itinerary?: string; // Final compiled itinerary
  agentResults: {
    contentPlanner?: AgentResult;
    infoGatherer?: AgentResult;
    strategist?: AgentResult;
    compiler?: AgentResult;
  };
  metadata: {
    totalDuration: number; // milliseconds
    totalCost: number; // USD
    totalTokens: number;
    successRate: number; // 0-100
    retryCount: number;
    createdAt: string;
    completedAt?: string;
    errorCount: number;
  };
  execution: {
    timeline: ExecutionTimelineEntry[];
    checkpoints: CheckpointSummary[];
    errors: ErrorSummary[];
    warnings: WarningSummary[];
  };
  performance: {
    agentPerformance: Record<AgentType, AgentPerformanceMetrics>;
    costBreakdown: CostBreakdown;
    resourceUtilization: ResourceUtilization;
  };
  formData: {
    destination: string;
    adults: number;
    children: number;
    startDate: string;
    endDate: string;
    budget?: string;
    travelStyle?: string;
    interests?: string[];
  };
}

/**
 * Execution timeline entry
 */
interface ExecutionTimelineEntry {
  timestamp: string;
  agentType: AgentType;
  event: 'started' | 'completed' | 'failed' | 'retry';
  duration?: number;
  cost?: number;
  details?: string;
}

/**
 * Checkpoint summary
 */
interface CheckpointSummary {
  id: string;
  agentType: AgentType;
  timestamp: string;
  progress: number;
  cost: number;
  success: boolean;
}

/**
 * Error summary
 */
interface ErrorSummary {
  id: string;
  timestamp: string;
  agentType?: AgentType;
  error: string;
  errorType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolution?: string;
}

/**
 * Warning summary
 */
interface WarningSummary {
  id: string;
  timestamp: string;
  agentType?: AgentType;
  message: string;
  type: 'performance' | 'cost' | 'quality' | 'timeout';
  impact: 'low' | 'medium' | 'high';
}

/**
 * Agent performance metrics
 */
interface AgentPerformanceMetrics {
  duration: number;
  cost: number;
  tokensUsed: number;
  retryCount: number;
  successRate: number;
  qualityScore?: number;
  errorCount: number;
}

/**
 * Cost breakdown
 */
interface CostBreakdown {
  totalCost: number;
  agentCosts: Record<AgentType, number>;
  serviceCosts: {
    llm: number;
    vectorSearch: number;
    webSearch: number;
    storage: number;
  };
  costEfficiency: number; // Cost per successful operation
}

/**
 * Resource utilization metrics
 */
interface ResourceUtilization {
  totalExecutionTime: number;
  peakMemoryUsage?: number;
  apiCallCount: number;
  cacheHitRate: number;
  parallelizationRatio: number;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const SessionIdSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID format')
});

const QueryParamsSchema = z.object({
  format: z.enum(['json', 'formatted', 'summary']).optional().default('json'),
  includeDetails: z.string().optional().transform(val => val === 'true'),
  includeMetadata: z.string().optional().transform(val => val !== 'false'),
  includeTimeline: z.string().optional().transform(val => val === 'true'),
  includePerformance: z.string().optional().transform(val => val === 'true')
});

// =============================================================================
// MAIN ENDPOINT HANDLER
// =============================================================================

/**
 * GET handler for workflow result retrieval
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
      format: url.searchParams.get('format'),
      includeDetails: url.searchParams.get('includeDetails'),
      includeMetadata: url.searchParams.get('includeMetadata'),
      includeTimeline: url.searchParams.get('includeTimeline'),
      includePerformance: url.searchParams.get('includePerformance')
    });

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

    // Check if session has results to return
    if (session.state === WorkflowState.INITIALIZED || 
        session.state === WorkflowState.CONTENT_PLANNING) {
      return new Response(
        JSON.stringify({ 
          error: 'Session has no results yet',
          sessionId,
          state: session.state,
          progress: session.progress.percentage
        }),
        { 
          status: 202, // Accepted but not ready
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Build result object
    const result = await buildWorkflowResult(session, queryParams);

    // Format response based on requested format
    switch (queryParams.format) {
      case 'formatted':
        return new Response(formatResultAsText(result), {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      
      case 'summary':
        return new Response(
          JSON.stringify(buildResultSummary(result)),
          { 
            headers: { 'Content-Type': 'application/json' }
          }
        );
      
      default: // json
        return new Response(
          JSON.stringify(result, null, 2),
          { 
            headers: { 'Content-Type': 'application/json' }
          }
        );
    }

  } catch (error) {
    console.error('Result retrieval endpoint error:', error);
    
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
        message: 'Failed to retrieve workflow result' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// =============================================================================
// RESULT BUILDING FUNCTIONS
// =============================================================================

/**
 * Build complete workflow result from session data
 */
async function buildWorkflowResult(
  session: any,
  options: any
): Promise<WorkflowResult> {
  // Determine status
  let status: 'completed' | 'failed' | 'partial' | 'cancelled';
  switch (session.state) {
    case WorkflowState.COMPLETED:
      status = 'completed';
      break;
    case WorkflowState.FAILED:
      status = 'failed';
      break;
    case WorkflowState.CANCELLED:
      status = 'cancelled';
      break;
    default:
      status = 'partial';
  }

  // Extract itinerary from compiler agent result
  let itinerary: string | undefined;
  if (session.agentResults[AgentType.COMPILER]?.result?.itinerary) {
    itinerary = session.agentResults[AgentType.COMPILER].result.itinerary;
  }

  // Calculate total duration
  const createdTime = new Date(session.metadata.createdAt).getTime();
  const completedTime = session.metadata.completedAt ? 
    new Date(session.metadata.completedAt).getTime() : Date.now();
  const totalDuration = completedTime - createdTime;

  // Calculate success rate
  const totalAgents = 4;
  const completedAgents = session.progress.completedAgents.length;
  const successRate = (completedAgents / totalAgents) * 100;

  // Count errors and calculate tokens
  let errorCount = 0;
  let totalTokens = 0;

  session.events.forEach((event: any) => {
    if (event.type === 'agent.failed' || event.severity === 'high' || event.severity === 'critical') {
      errorCount++;
    }
  });

  Object.values(session.agentResults).forEach((result: any) => {
    if (result?.metadata?.tokensUsed) {
      totalTokens += result.metadata.tokensUsed;
    }
  });

  // Build base result
  const result: WorkflowResult = {
    sessionId: session.sessionId,
    status,
    itinerary,
    agentResults: {
      contentPlanner: session.agentResults[AgentType.CONTENT_PLANNER],
      infoGatherer: session.agentResults[AgentType.INFO_GATHERER],
      strategist: session.agentResults[AgentType.STRATEGIST],
      compiler: session.agentResults[AgentType.COMPILER]
    },
    metadata: {
      totalDuration,
      totalCost: session.metadata.totalCost,
      totalTokens,
      successRate,
      retryCount: session.metadata.retryCount,
      createdAt: session.metadata.createdAt,
      completedAt: session.metadata.completedAt,
      errorCount
    },
    execution: {
      timeline: [],
      checkpoints: [],
      errors: [],
      warnings: []
    },
    performance: {
      agentPerformance: {} as Record<AgentType, AgentPerformanceMetrics>,
      costBreakdown: {
        totalCost: session.metadata.totalCost,
        agentCosts: {} as Record<AgentType, number>,
        serviceCosts: {
          llm: 0,
          vectorSearch: 0,
          webSearch: 0,
          storage: 0
        },
        costEfficiency: session.metadata.totalCost / Math.max(completedAgents, 1)
      },
      resourceUtilization: {
        totalExecutionTime: totalDuration,
        apiCallCount: 0,
        cacheHitRate: 0,
        parallelizationRatio: 0
      }
    },
    formData: {
      destination: session.formData.destination,
      adults: session.formData.adults,
      children: session.formData.children,
      startDate: session.formData.startDate,
      endDate: session.formData.endDate,
      budget: session.formData.budget,
      travelStyle: session.formData.travelStyle,
      interests: session.formData.interests
    }
  };

  // Add execution details if requested
  if (options.includeTimeline) {
    result.execution.timeline = buildExecutionTimeline(session);
  }

  if (options.includeDetails) {
    result.execution.checkpoints = buildCheckpointSummaries(session);
    result.execution.errors = buildErrorSummaries(session);
    result.execution.warnings = buildWarningSummaries(session);
  }

  // Add performance metrics if requested
  if (options.includePerformance) {
    result.performance.agentPerformance = buildAgentPerformanceMetrics(session);
    result.performance.costBreakdown = buildCostBreakdown(session);
    result.performance.resourceUtilization = buildResourceUtilization(session);
  }

  return result;
}

/**
 * Build execution timeline from session events
 */
function buildExecutionTimeline(session: any): ExecutionTimelineEntry[] {
  return session.events
    .filter((event: any) => 
      event.type.startsWith('agent.') || 
      event.type === 'session.started' ||
      event.type === 'session.completed'
    )
    .map((event: any) => {
      let eventType: 'started' | 'completed' | 'failed' | 'retry';
      if (event.type.includes('started')) {
        eventType = 'started';
      } else if (event.type.includes('completed')) {
        eventType = 'completed';
      } else if (event.type.includes('failed')) {
        eventType = 'failed';
      } else {
        eventType = 'retry';
      }

      return {
        timestamp: event.timestamp,
        agentType: event.agentType || AgentType.CONTENT_PLANNER,
        event: eventType,
        duration: event.data?.duration,
        cost: event.data?.cost,
        details: event.message
      };
    });
}

/**
 * Build checkpoint summaries
 */
function buildCheckpointSummaries(session: any): CheckpointSummary[] {
  return session.checkpoints.map((checkpoint: any) => ({
    id: checkpoint.id,
    agentType: checkpoint.agentType,
    timestamp: checkpoint.timestamp,
    progress: checkpoint.progress,
    cost: checkpoint.cost,
    success: true // Checkpoints are only created on success
  }));
}

/**
 * Build error summaries
 */
function buildErrorSummaries(session: any): ErrorSummary[] {
  return session.events
    .filter((event: any) => event.type === 'error' || event.severity === 'high' || event.severity === 'critical')
    .map((event: any) => ({
      id: event.id,
      timestamp: event.timestamp,
      agentType: event.agentType,
      error: event.message,
      errorType: event.data?.errorType || 'unknown',
      severity: event.severity,
      resolved: event.data?.resolved || false,
      resolution: event.data?.resolution
    }));
}

/**
 * Build warning summaries
 */
function buildWarningSummaries(session: any): WarningSummary[] {
  return session.events
    .filter((event: any) => event.type === 'warning' || event.severity === 'medium')
    .map((event: any) => ({
      id: event.id,
      timestamp: event.timestamp,
      agentType: event.agentType,
      message: event.message,
      type: event.data?.warningType || 'performance',
      impact: event.severity === 'medium' ? 'medium' : 'low'
    }));
}

/**
 * Build agent performance metrics
 */
function buildAgentPerformanceMetrics(session: any): Record<AgentType, AgentPerformanceMetrics> {
  const metrics = {} as Record<AgentType, AgentPerformanceMetrics>;

  Object.entries(session.agentResults).forEach(([agentType, result]: [string, any]) => {
    if (result) {
      metrics[agentType as AgentType] = {
        duration: result.metadata?.duration || 0,
        cost: result.metadata?.cost || 0,
        tokensUsed: result.metadata?.tokensUsed || 0,
        retryCount: result.metadata?.retryCount || 0,
        successRate: result.success ? 100 : 0,
        qualityScore: result.metadata?.qualityScore,
        errorCount: result.metadata?.errorCount || 0
      };
    }
  });

  return metrics;
}

/**
 * Build cost breakdown
 */
function buildCostBreakdown(session: any): CostBreakdown {
  const agentCosts = {} as Record<AgentType, number>;
  let totalLLMCost = 0;

  Object.entries(session.agentResults).forEach(([agentType, result]: [string, any]) => {
    if (result?.metadata?.cost) {
      agentCosts[agentType as AgentType] = result.metadata.cost;
      totalLLMCost += result.metadata.cost;
    }
  });

  return {
    totalCost: session.metadata.totalCost,
    agentCosts,
    serviceCosts: {
      llm: totalLLMCost,
      vectorSearch: 0, // Would be calculated from actual usage
      webSearch: 0,    // Would be calculated from actual usage
      storage: 0       // Would be calculated from actual usage
    },
    costEfficiency: session.metadata.totalCost / Math.max(session.progress.completedAgents.length, 1)
  };
}

/**
 * Build resource utilization metrics
 */
function buildResourceUtilization(session: any): ResourceUtilization {
  return {
    totalExecutionTime: session.metadata.actualDuration || 0,
    apiCallCount: session.events.filter((e: any) => e.type.includes('api')).length,
    cacheHitRate: 0,   // Would be calculated from cache metrics
    parallelizationRatio: 0 // Would be calculated from execution patterns
  };
}

/**
 * Format result as human-readable text
 */
function formatResultAsText(result: WorkflowResult): string {
  let formatted = `HYLO TRAVEL AI - WORKFLOW RESULT\n`;
  formatted += `=====================================\n\n`;
  
  formatted += `Session ID: ${result.sessionId}\n`;
  formatted += `Status: ${result.status.toUpperCase()}\n`;
  formatted += `Destination: ${result.formData.destination}\n`;
  formatted += `Travelers: ${result.formData.adults} adults`;
  if (result.formData.children > 0) {
    formatted += `, ${result.formData.children} children`;
  }
  formatted += `\n\n`;

  if (result.itinerary) {
    formatted += `GENERATED ITINERARY\n`;
    formatted += `===================\n\n`;
    formatted += result.itinerary;
    formatted += `\n\n`;
  }

  formatted += `EXECUTION SUMMARY\n`;
  formatted += `=================\n`;
  formatted += `Total Duration: ${Math.round(result.metadata.totalDuration / 1000)}s\n`;
  formatted += `Total Cost: $${result.metadata.totalCost.toFixed(4)}\n`;
  formatted += `Success Rate: ${result.metadata.successRate.toFixed(1)}%\n`;
  formatted += `Retry Count: ${result.metadata.retryCount}\n`;
  formatted += `Error Count: ${result.metadata.errorCount}\n\n`;

  return formatted;
}

/**
 * Build result summary for quick overview
 */
function buildResultSummary(result: WorkflowResult) {
  return {
    sessionId: result.sessionId,
    status: result.status,
    hasItinerary: !!result.itinerary,
    destination: result.formData.destination,
    duration: result.metadata.totalDuration,
    cost: result.metadata.totalCost,
    successRate: result.metadata.successRate,
    completedAgents: Object.keys(result.agentResults).filter(key => 
      result.agentResults[key as keyof typeof result.agentResults]?.success
    ),
    createdAt: result.metadata.createdAt,
    completedAt: result.metadata.completedAt
  };
}

// =============================================================================
// EXPORT CONFIGURATION
// =============================================================================

// Edge runtime is configured above with export const config
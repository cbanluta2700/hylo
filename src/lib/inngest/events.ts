/**
 * Inngest Event Taxonomy for Hylo Travel AI
 *
 * Defines all event types used in the Inngest workflow system
 * for itinerary generation and agent orchestration.
 */

// =============================================================================
// Core Itinerary Events
// =============================================================================

export interface ItineraryGenerateEvent {
  name: 'itinerary.generate';
  data: {
    sessionId: string;
    requestId: string;
    formData: EnhancedFormData;
    context: {
      userAgent?: string;
      clientIP?: string;
      timestamp: string;
    };
  };
}

export interface ItineraryUpdateEvent {
  name: 'itinerary.update';
  data: {
    sessionId: string;
    requestId: string;
    updates: Partial<EnhancedFormData>;
    context: {
      updateType: 'form_change' | 'user_edit' | 'ai_refinement';
      timestamp: string;
    };
  };
}

// =============================================================================
// Agent Step Events
// =============================================================================

export interface AgentStepStartedEvent {
  name: 'agent.step.started';
  data: {
    sessionId: string;
    requestId: string;
    agentName: 'architect' | 'gatherer' | 'specialist' | 'form-putter';
    stepName: string;
    input: any;
    timestamp: string;
  };
}

export interface AgentStepCompletedEvent {
  name: 'agent.step.completed';
  data: {
    sessionId: string;
    requestId: string;
    agentName: 'architect' | 'gatherer' | 'specialist' | 'form-putter';
    stepName: string;
    output: any;
    processingTime: number;
    tokensUsed?: number;
    cost?: number;
    timestamp: string;
  };
}

export interface AgentStepFailedEvent {
  name: 'agent.step.failed';
  data: {
    sessionId: string;
    requestId: string;
    agentName: 'architect' | 'gatherer' | 'specialist' | 'form-putter';
    stepName: string;
    error: {
      code: string;
      message: string;
      details?: any;
    };
    retryAttempt: number;
    timestamp: string;
  };
}

// =============================================================================
// Progress Events
// =============================================================================

export interface ProgressUpdateEvent {
  name: 'progress.update';
  data: {
    sessionId: string;
    requestId: string;
    stage: string;
    progress: number; // 0-100
    message: string;
    agentName?: string;
    estimatedTimeRemaining?: number;
    timestamp: string;
  };
}

// =============================================================================
// Search and Vector Events
// =============================================================================

export interface SearchOrchestrationEvent {
  name: 'search.orchestration';
  data: {
    sessionId: string;
    requestId: string;
    smartQueries: SmartQuery[];
    providers: ('tavily' | 'exa' | 'serp' | 'cruise-critic')[];
    context: {
      agentName: string;
      searchType: 'attractions' | 'hotels' | 'restaurants' | 'activities';
    };
    timestamp: string;
  };
}

export interface VectorOperationEvent {
  name: 'vector.operation';
  data: {
    sessionId: string;
    requestId: string;
    operation: 'store' | 'query' | 'similarity-search';
    vectorData: {
      embeddings?: number[];
      metadata?: any;
      query?: string;
      topK?: number;
    };
    timestamp: string;
  };
}

// =============================================================================
// Error and Recovery Events
// =============================================================================

export interface WorkflowErrorEvent {
  name: 'workflow.error';
  data: {
    sessionId: string;
    requestId: string;
    errorType: 'agent_failure' | 'timeout' | 'api_limit' | 'network_error';
    error: {
      code: string;
      message: string;
      details?: any;
      stack?: string;
    };
    recovery: {
      attempted: boolean;
      strategy: 'retry' | 'fallback' | 'skip_step';
      success?: boolean;
    };
    timestamp: string;
  };
}

export interface WorkflowRecoveryEvent {
  name: 'workflow.recovery';
  data: {
    sessionId: string;
    requestId: string;
    recoveryAction: 'retry_step' | 'fallback_agent' | 'skip_step';
    previousError: string;
    result: 'success' | 'failed';
    timestamp: string;
  };
}

// =============================================================================
// Completion Events
// =============================================================================

export interface ItineraryCompleteEvent {
  name: 'itinerary.complete';
  data: {
    sessionId: string;
    requestId: string;
    itinerary: GeneratedItinerary;
    metadata: {
      totalProcessingTime: number;
      agentsUsed: string[];
      tokensUsed: number;
      totalCost: number;
      qualityScore?: number;
    };
    timestamp: string;
  };
}

export interface WorkflowCompleteEvent {
  name: 'workflow.complete';
  data: {
    sessionId: string;
    requestId: string;
    status: 'success' | 'failed' | 'cancelled';
    result?: any;
    error?: any;
    statistics: {
      stepsCompleted: number;
      totalSteps: number;
      totalTime: number;
      retryCount: number;
    };
    timestamp: string;
  };
}

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Union type of all possible Inngest events
 */
export type InngestEvent =
  | ItineraryGenerateEvent
  | ItineraryUpdateEvent
  | AgentStepStartedEvent
  | AgentStepCompletedEvent
  | AgentStepFailedEvent
  | ProgressUpdateEvent
  | SearchOrchestrationEvent
  | VectorOperationEvent
  | WorkflowErrorEvent
  | WorkflowRecoveryEvent
  | ItineraryCompleteEvent
  | WorkflowCompleteEvent;

/**
 * Event name type for type-safe event handling
 */
export type EventName = InngestEvent['name'];

/**
 * Event data type helper
 */
export type EventData<T extends EventName> = Extract<InngestEvent, { name: T }>['data'];

// =============================================================================
// Event Constants
// =============================================================================

/**
 * Event name constants for use in function definitions
 */
export const EVENTS = {
  ITINERARY_GENERATE: 'itinerary.generate' as const,
  ITINERARY_UPDATE: 'itinerary.update' as const,
  AGENT_STEP_STARTED: 'agent.step.started' as const,
  AGENT_STEP_COMPLETED: 'agent.step.completed' as const,
  AGENT_STEP_FAILED: 'agent.step.failed' as const,
  PROGRESS_UPDATE: 'progress.update' as const,
  SEARCH_ORCHESTRATION: 'search.orchestration' as const,
  VECTOR_OPERATION: 'vector.operation' as const,
  WORKFLOW_ERROR: 'workflow.error' as const,
  WORKFLOW_RECOVERY: 'workflow.recovery' as const,
  ITINERARY_COMPLETE: 'itinerary.complete' as const,
  WORKFLOW_COMPLETE: 'workflow.complete' as const,
} as const;

// =============================================================================
// Utility Types for Imports
// =============================================================================

// Import required types
import type { EnhancedFormData } from '../../types/form-data';
import type { SmartQuery } from '../../types/smart-query';
import type { GeneratedItinerary } from '../../types/generated-itinerary';

export type { EnhancedFormData, SmartQuery, GeneratedItinerary };

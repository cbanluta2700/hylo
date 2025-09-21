/**
 * Inngest Workflow Configuration
 * Centralized configuration for all Inngest workflows and event handling
 */

import { Inngest } from 'inngest';
import { config } from '../env';

/**
 * Inngest Client Configuration
 */
export const inngest = new Inngest({
  id: 'hylo-itinerary-generator',
  eventKey: config.inngest.eventKey,
  signingKey: config.inngest.signingKey,
  env: process.env['NODE_ENV'] || 'development',
});

/**
 * Workflow Event Types
 */
export const WORKFLOW_EVENTS = {
  // Itinerary Generation Events
  ITINERARY_GENERATE_REQUESTED: 'itinerary.generate.requested',
  ITINERARY_GENERATE_STARTED: 'itinerary.generate.started',
  ITINERARY_GENERATE_COMPLETED: 'itinerary.generate.completed',
  ITINERARY_GENERATE_FAILED: 'itinerary.generate.failed',

  // Agent Events
  AGENT_ARCHITECT_COMPLETED: 'agent.architect.completed',
  AGENT_GATHERER_COMPLETED: 'agent.gatherer.completed',
  AGENT_SPECIALIST_COMPLETED: 'agent.specialist.completed',
  AGENT_PUTTER_COMPLETED: 'agent.putter.completed',

  // Form Events
  FORM_UPDATED: 'form.updated',
  FORM_UPDATE_PROCESSED: 'form.update.processed',
  FORM_VALIDATION_FAILED: 'form.validation.failed',

  // Search Events
  SEARCH_REQUESTED: 'search.requested',
  SEARCH_COMPLETED: 'search.completed',
  SEARCH_FAILED: 'search.failed',

  // Cache Events
  CACHE_VECTOR_STORED: 'cache.vector.stored',
  CACHE_VECTOR_SEARCHED: 'cache.vector.searched',
  CACHE_VECTOR_DELETED: 'cache.vector.deleted',

  // System Events
  SYSTEM_HEALTH_CHECK: 'system.health.check',
  SYSTEM_ERROR_OCCURRED: 'system.error.occurred',
  SYSTEM_MAINTENANCE_STARTED: 'system.maintenance.started',
} as const;

/**
 * Workflow Configuration Constants
 */
export const WORKFLOW_CONFIG = {
  // Timeouts (in milliseconds)
  STEP_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  WORKFLOW_TIMEOUT: 15 * 60 * 1000, // 15 minutes
  AGENT_TIMEOUT: 3 * 60 * 1000, // 3 minutes

  // Retry Configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  RETRY_BACKOFF_MULTIPLIER: 2,

  // Concurrency Limits
  MAX_CONCURRENT_WORKFLOWS: 10,
  MAX_CONCURRENT_AGENTS: 4,

  // Batch Sizes
  SEARCH_BATCH_SIZE: 5,
  CACHE_BATCH_SIZE: 10,

  // Quality Thresholds
  MIN_CONFIDENCE_THRESHOLD: 0.6,
  MIN_SIMILARITY_THRESHOLD: 0.7,
  MAX_ERROR_RATE: 0.1,

  // Cache TTL (in seconds)
  CACHE_TTL_SHORT: 300, // 5 minutes
  CACHE_TTL_MEDIUM: 3600, // 1 hour
  CACHE_TTL_LONG: 86400, // 24 hours
} as const;

/**
 * Event Payload Types
 */
export interface ItineraryGeneratePayload {
  formData: any;
  sessionId: string;
  requestId: string;
  userId?: string;
  preferences?: {
    language: string;
    currency: string;
    detailLevel: 'brief' | 'standard' | 'detailed';
  };
}

export interface AgentCompletedPayload {
  agentType: 'architect' | 'gatherer' | 'specialist' | 'putter';
  sessionId: string;
  requestId: string;
  result: any;
  confidence: number;
  processingTime: number;
  errors?: string[];
}

export interface FormUpdatePayload {
  formData: any;
  sessionId: string;
  field: string;
  value: any;
  userId?: string;
  timestamp: string;
}

export interface SearchRequestPayload {
  query: string;
  type: 'text' | 'image' | 'video' | 'news';
  sessionId: string;
  requestId: string;
  options?: {
    maxResults: number;
    language: string;
    region: string;
  };
}

export interface VectorCachePayload {
  operation: 'store' | 'search' | 'delete' | 'update';
  sessionId: string;
  requestId: string;
  data?: any;
  query?: any;
  namespace?: string;
}

/**
 * Workflow Step Configuration
 */
export interface WorkflowStepConfig {
  id: string;
  name: string;
  timeout: number;
  retries: number;
  dependencies?: string[];
  parallel?: boolean;
  critical?: boolean;
}

/**
 * Itinerary Generation Workflow Steps
 */
export const ITINERARY_WORKFLOW_STEPS: Record<string, WorkflowStepConfig> = {
  generateSmartQueries: {
    id: 'generate-smart-queries',
    name: 'Generate Smart Queries',
    timeout: WORKFLOW_CONFIG.STEP_TIMEOUT,
    retries: WORKFLOW_CONFIG.MAX_RETRIES,
    critical: true,
  },
  architectPlanning: {
    id: 'architect-planning',
    name: 'Itinerary Architect Planning',
    timeout: WORKFLOW_CONFIG.AGENT_TIMEOUT,
    retries: WORKFLOW_CONFIG.MAX_RETRIES,
    dependencies: ['generate-smart-queries'],
    critical: true,
  },
  gathererCollection: {
    id: 'gatherer-collection',
    name: 'Web Information Gathering',
    timeout: WORKFLOW_CONFIG.AGENT_TIMEOUT,
    retries: WORKFLOW_CONFIG.MAX_RETRIES,
    dependencies: ['architect-planning'],
    parallel: true,
  },
  specialistAnalysis: {
    id: 'specialist-analysis',
    name: 'Information Specialist Analysis',
    timeout: WORKFLOW_CONFIG.AGENT_TIMEOUT,
    retries: WORKFLOW_CONFIG.MAX_RETRIES,
    dependencies: ['architect-planning'],
    parallel: true,
  },
  putterFormatting: {
    id: 'putter-formatting',
    name: 'Form Putter Formatting',
    timeout: WORKFLOW_CONFIG.AGENT_TIMEOUT,
    retries: WORKFLOW_CONFIG.MAX_RETRIES,
    dependencies: ['gatherer-collection', 'specialist-analysis'],
    critical: true,
  },
  resultSynthesis: {
    id: 'result-synthesis',
    name: 'Result Synthesis',
    timeout: WORKFLOW_CONFIG.STEP_TIMEOUT,
    retries: WORKFLOW_CONFIG.MAX_RETRIES,
    dependencies: ['putter-formatting'],
    critical: true,
  },
};

/**
 * Form Update Workflow Steps
 */
export const FORM_UPDATE_WORKFLOW_STEPS: Record<string, WorkflowStepConfig> = {
  validateUpdate: {
    id: 'validate-update',
    name: 'Validate Form Update',
    timeout: WORKFLOW_CONFIG.STEP_TIMEOUT,
    retries: WORKFLOW_CONFIG.MAX_RETRIES,
    critical: true,
  },
  updateFormState: {
    id: 'update-form-state',
    name: 'Update Form State',
    timeout: WORKFLOW_CONFIG.STEP_TIMEOUT,
    retries: WORKFLOW_CONFIG.MAX_RETRIES,
    dependencies: ['validate-update'],
    critical: true,
  },
  triggerActions: {
    id: 'trigger-actions',
    name: 'Trigger Dependent Actions',
    timeout: WORKFLOW_CONFIG.STEP_TIMEOUT,
    retries: WORKFLOW_CONFIG.MAX_RETRIES,
    dependencies: ['update-form-state'],
    parallel: true,
  },
  sendNotifications: {
    id: 'send-notifications',
    name: 'Send Update Notifications',
    timeout: WORKFLOW_CONFIG.STEP_TIMEOUT,
    retries: WORKFLOW_CONFIG.MAX_RETRIES,
    dependencies: ['trigger-actions'],
  },
};

/**
 * Workflow Monitoring Configuration
 */
export const MONITORING_CONFIG = {
  // Metrics to track
  METRICS: {
    WORKFLOW_DURATION: 'workflow.duration',
    STEP_DURATION: 'step.duration',
    AGENT_CONFIDENCE: 'agent.confidence',
    ERROR_RATE: 'error.rate',
    CACHE_HIT_RATE: 'cache.hit_rate',
    SEARCH_SUCCESS_RATE: 'search.success_rate',
  },

  // Alert thresholds
  ALERTS: {
    WORKFLOW_TIMEOUT: WORKFLOW_CONFIG.WORKFLOW_TIMEOUT,
    HIGH_ERROR_RATE: 0.05, // 5%
    LOW_CONFIDENCE: 0.5,
    CACHE_MISS_RATE: 0.8, // 80%
  },

  // Logging levels
  LOG_LEVELS: {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
  },
} as const;

/**
 * Workflow Error Types
 */
export const WORKFLOW_ERRORS = {
  // Agent Errors
  AGENT_TIMEOUT: 'AGENT_TIMEOUT',
  AGENT_FAILED: 'AGENT_FAILED',
  AGENT_LOW_CONFIDENCE: 'AGENT_LOW_CONFIDENCE',

  // System Errors
  WORKFLOW_TIMEOUT: 'WORKFLOW_TIMEOUT',
  STEP_FAILED: 'STEP_FAILED',
  DEPENDENCY_FAILED: 'DEPENDENCY_FAILED',

  // Data Errors
  INVALID_INPUT: 'INVALID_INPUT',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  DATA_NOT_FOUND: 'DATA_NOT_FOUND',

  // External Service Errors
  SEARCH_FAILED: 'SEARCH_FAILED',
  CACHE_FAILED: 'CACHE_FAILED',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // Network Errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
} as const;

/**
 * Workflow Recovery Strategies
 */
export const RECOVERY_STRATEGIES = {
  [WORKFLOW_ERRORS.AGENT_TIMEOUT]: {
    strategy: 'retry',
    maxRetries: 2,
    backoffMs: 2000,
    fallback: 'skip_step',
  },
  [WORKFLOW_ERRORS.AGENT_FAILED]: {
    strategy: 'retry',
    maxRetries: 1,
    backoffMs: 5000,
    fallback: 'use_cached_result',
  },
  [WORKFLOW_ERRORS.SEARCH_FAILED]: {
    strategy: 'retry',
    maxRetries: 3,
    backoffMs: 1000,
    fallback: 'use_alternative_provider',
  },
  [WORKFLOW_ERRORS.CACHE_FAILED]: {
    strategy: 'retry',
    maxRetries: 2,
    backoffMs: 1000,
    fallback: 'disable_cache',
  },
} as const;

/**
 * Workflow State Types
 */
export interface WorkflowState {
  workflowId: string;
  sessionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep?: string;
  completedSteps: string[];
  failedSteps: string[];
  progress: number; // 0-100
  startedAt: string;
  updatedAt: string;
  estimatedCompletion?: string;
  errors: WorkflowError[];
  metadata: Record<string, any>;
}

export interface WorkflowError {
  stepId: string;
  errorType: string;
  message: string;
  timestamp: string;
  retryCount: number;
  recoverable: boolean;
}

/**
 * Utility Functions
 */

/**
 * Generate workflow ID
 */
export function generateWorkflowId(sessionId: string, type: string): string {
  return `wf_${type}_${sessionId}_${Date.now()}`;
}

/**
 * Generate step ID
 */
export function generateStepId(workflowId: string, stepName: string): string {
  return `step_${workflowId}_${stepName}`;
}

/**
 * Check if workflow is critical
 */
export function isCriticalWorkflow(workflowType: string): boolean {
  const criticalWorkflows = ['itinerary-generate', 'form-update'];
  return criticalWorkflows.includes(workflowType);
}

/**
 * Get workflow timeout
 */
export function getWorkflowTimeout(workflowType: string): number {
  switch (workflowType) {
    case 'itinerary-generate':
      return WORKFLOW_CONFIG.WORKFLOW_TIMEOUT;
    case 'form-update':
      return WORKFLOW_CONFIG.STEP_TIMEOUT;
    default:
      return WORKFLOW_CONFIG.STEP_TIMEOUT;
  }
}

/**
 * Calculate workflow progress
 */
export function calculateWorkflowProgress(completedSteps: string[], totalSteps: number): number {
  if (totalSteps === 0) return 100;
  return Math.round((completedSteps.length / totalSteps) * 100);
}

/**
 * Check if step can be executed
 */
export function canExecuteStep(stepConfig: WorkflowStepConfig, completedSteps: string[]): boolean {
  if (!stepConfig.dependencies) return true;

  return stepConfig.dependencies.every((dep) => completedSteps.includes(dep));
}

/**
 * Get next executable steps
 */
export function getNextSteps(
  workflowSteps: Record<string, WorkflowStepConfig>,
  completedSteps: string[]
): string[] {
  const nextSteps: string[] = [];

  for (const [stepId, stepConfig] of Object.entries(workflowSteps)) {
    if (!completedSteps.includes(stepId) && canExecuteStep(stepConfig, completedSteps)) {
      nextSteps.push(stepId);
    }
  }

  return nextSteps;
}

/**
 * Export configuration for use in workflows
 */

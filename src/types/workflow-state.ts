/**
 * Workflow State Entity
 * Type definitions for multi-agent workflow orchestration and state management
 */

export interface WorkflowState {
  workflowId: string;
  sessionId: string;
  currentStep: WorkflowStep;
  progress: ProgressIndicator;
  agentStates: Map<AgentType, AgentState>;
  realTimeUpdates: boolean;
  metadata: WorkflowMetadata;
}

export interface WorkflowStep {
  name: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  startTime?: string;
  endTime?: string;
  output?: any;
  error?: WorkflowError;
}

export interface ProgressIndicator {
  percentage: number; // 0-100
  currentPhase: string;
  message: string;
  estimatedCompletion?: string; // ISO timestamp
  stepsCompleted: number;
  totalSteps: number;
}

export type AgentType =
  | 'itinerary-architect'
  | 'web-gatherer'
  | 'information-specialist'
  | 'form-putter';

export interface AgentState {
  agentId: string;
  status: 'idle' | 'processing' | 'completed' | 'failed' | 'cancelled';
  currentTask?: string;
  progress: number; // 0-100
  lastActivity: string; // ISO timestamp
  retryCount: number;
  maxRetries: number;
  output?: any;
  error?: AgentError;
}

export interface WorkflowMetadata {
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number; // milliseconds
  totalAgents: number;
  activeAgents: number;
  failedAgents: number;
  orchestrationStrategy: string;
  priority: 'low' | 'normal' | 'high';
}

export interface WorkflowError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  recoverable: boolean;
  retryCount: number;
  maxRetries: number;
}

export interface AgentError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  taskId?: string;
  recoverable: boolean;
}

/**
 * Workflow Orchestration Interfaces
 */

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStepDefinition[];
  agents: AgentDefinition[];
  dependencies: WorkflowDependency[];
  timeout: number; // milliseconds
  retryPolicy: RetryPolicy;
}

export interface WorkflowStepDefinition {
  id: string;
  name: string;
  type: 'agent_task' | 'data_processing' | 'validation' | 'synthesis';
  agentType?: AgentType;
  dependencies: string[]; // Step IDs
  timeout: number; // milliseconds
  retryPolicy: RetryPolicy;
  inputMapping: InputMapping;
  outputMapping: OutputMapping;
}

export interface AgentDefinition {
  type: AgentType;
  capabilities: string[];
  priority: 'low' | 'normal' | 'high';
  timeout: number; // milliseconds
  retryPolicy: RetryPolicy;
  configuration: AgentConfiguration;
}

export interface AgentConfiguration {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: string[];
  promptTemplate?: string;
}

export interface WorkflowDependency {
  from: string; // Step ID
  to: string; // Step ID
  condition?: string; // Optional condition for execution
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
}

export interface InputMapping {
  source: 'form_data' | 'previous_step' | 'agent_output' | 'external_api';
  path: string;
  transformation?: string;
}

export interface OutputMapping {
  target: 'workflow_state' | 'agent_input' | 'final_result';
  path: string;
  format?: 'json' | 'text' | 'structured';
}

/**
 * Workflow Execution Interfaces
 */

export interface WorkflowExecution {
  workflowId: string;
  executionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number;
  currentStep?: string;
  completedSteps: string[];
  failedSteps: string[];
  agentExecutions: AgentExecution[];
  errors: WorkflowError[];
}

export interface AgentExecution {
  agentId: string;
  agentType: AgentType;
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  duration?: number;
  input: any;
  output?: any;
  error?: AgentError;
  retryCount: number;
}

/**
 * Real-Time Update Interfaces
 */

export interface RealTimeUpdate {
  workflowId: string;
  sessionId: string;
  type: 'progress' | 'agent_status' | 'step_complete' | 'error' | 'completion';
  timestamp: string;
  data: any;
  clientId?: string; // For targeted updates
}

export interface ProgressUpdate extends RealTimeUpdate {
  type: 'progress';
  data: {
    percentage: number;
    currentPhase: string;
    message: string;
    estimatedCompletion?: string;
  };
}

export interface AgentStatusUpdate extends RealTimeUpdate {
  type: 'agent_status';
  data: {
    agentType: AgentType;
    agentId: string;
    status: AgentState['status'];
    progress: number;
    currentTask?: string;
  };
}

export interface StepCompleteUpdate extends RealTimeUpdate {
  type: 'step_complete';
  data: {
    stepName: string;
    output: any;
    nextSteps: string[];
  };
}

export interface ErrorUpdate extends RealTimeUpdate {
  type: 'error';
  data: {
    error: WorkflowError;
    affectedSteps: string[];
    recoveryOptions?: string[];
  };
}

export interface CompletionUpdate extends RealTimeUpdate {
  type: 'completion';
  data: {
    finalResult: any;
    summary: WorkflowSummary;
  };
}

export interface WorkflowSummary {
  totalDuration: number;
  agentsUsed: AgentType[];
  stepsCompleted: number;
  errorsEncountered: number;
  costEstimate?: number;
  qualityScore?: number; // 0-1
}

/**
 * Validation Rules:
 * - expiresAt must be future timestamp
 * - progress.percentage between 0 and 100
 * - agentStates must include all required agents
 * - currentStep must be valid workflow step
 * - retryCount <= maxRetries
 * - confidence between 0 and 1
 * - reliability between 0 and 1
 */

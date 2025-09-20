/**
 * Core Agent Workflow Types for Hylo Multi-Agent Travel Planning System
 * 
 * This module defines the foundational TypeScript interfaces and types for the
 * four-agent workflow architecture: Content Planner → Info Gatherer → Strategist → Compiler
 * 
 * Based on LangChain.js v0.3+ patterns with LangGraph StateGraph integration
 */

import { BaseMessage } from "@langchain/core/messages";
import { z } from "zod";

// ============================================================================
// Core Agent Interface
// ============================================================================

/**
 * Base interface for all agents in the workflow
 * Extends LangChain's agent patterns with Hylo-specific requirements
 */
export interface Agent {
  /** Unique identifier for the agent type */
  readonly name: AgentType;
  
  /** Agent version for compatibility tracking */
  readonly version: string;
  
  /** Maximum execution timeout in milliseconds */
  readonly timeout: number;
  
  /** Cost budget per execution in USD */
  readonly maxCost: number;
  
  /** Execute the agent's primary function */
  execute(context: WorkflowContext): Promise<AgentResult>;
  
  /** Validate input before execution */
  validateInput(input: unknown): Promise<boolean>;
  
  /** Cleanup resources after execution */
  cleanup(): Promise<void>;
}

/**
 * Agent type enumeration for the four-agent workflow
 */
export enum AgentType {
  CONTENT_PLANNER = 'content-planner',
  INFO_GATHERER = 'info-gatherer', 
  STRATEGIST = 'strategist',
  COMPILER = 'compiler'
}

// ============================================================================
// Workflow Context & State Management
// ============================================================================

/**
 * Comprehensive context object passed between agents in the workflow
 * Contains all necessary data for each agent to perform its function
 */
export interface WorkflowContext {
  /** Unique session identifier for tracking */
  sessionId: string;
  
  /** Original form data from user */
  formData: TravelFormData;
  
  /** Current workflow state */
  state: WorkflowState;
  
  /** Accumulated results from previous agents */
  agentResults: Record<AgentType, AgentResult | null>;
  
  /** LangChain message history for conversation continuity */
  messages: BaseMessage[];
  
  /** Configuration settings for this workflow execution */
  config: WorkflowConfig;
  
  /** Runtime metadata and telemetry */
  metadata: WorkflowMetadata;
}

/**
 * Workflow state enumeration following LangGraph StateGraph patterns
 */
export enum WorkflowState {
  INITIALIZED = 'initialized',
  CONTENT_PLANNING = 'content-planning',
  INFO_GATHERING = 'info-gathering', 
  STRATEGIZING = 'strategizing',
  COMPILING = 'compiling',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Configuration object for workflow execution
 */
export interface WorkflowConfig {
  /** Enable streaming of intermediate results */
  streaming: boolean;
  
  /** Provider fallback chains for each agent */
  providerChains: Record<AgentType, LLMProvider[]>;
  
  /** Retry configuration */
  retryConfig: RetryConfig;
  
  /** Resource limits */
  resourceLimits: ResourceLimits;
  
  /** Observability settings */
  observability: ObservabilityConfig;
}

/**
 * Runtime metadata for workflow tracking
 */
export interface WorkflowMetadata {
  /** Workflow start timestamp */
  startedAt: Date;
  
  /** Current agent execution start time */
  currentAgentStartedAt?: Date;
  
  /** Total execution time in milliseconds */
  executionTimeMs?: number;
  
  /** Total cost incurred in USD */
  totalCost: number;
  
  /** LangSmith trace ID for observability */
  traceId?: string;
  
  /** Performance metrics */
  metrics: Record<string, number>;
  
  /** Error history */
  errors: WorkflowError[];
}

// ============================================================================
// Agent Result Interfaces
// ============================================================================

/**
 * Standard result interface returned by all agents
 */
export interface AgentResult {
  /** Agent that produced this result */
  agent: AgentType;
  
  /** Success status */
  success: boolean;
  
  /** Primary output data */
  data: unknown;
  
  /** Execution metadata */
  metadata: AgentExecutionMetadata;
  
  /** Any errors encountered */
  errors: AgentError[];
  
  /** Next agent recommendations */
  nextAgent?: AgentType;
  
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Execution metadata for individual agent runs
 */
export interface AgentExecutionMetadata {
  /** Execution start time */
  startedAt: Date;
  
  /** Execution end time */
  completedAt: Date;
  
  /** Execution duration in milliseconds */
  durationMs: number;
  
  /** Cost incurred for this execution */
  cost: number;
  
  /** LLM provider used */
  provider: LLMProvider;
  
  /** Tokens consumed */
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  
  /** Retry attempts made */
  retryAttempts: number;
  
  /** Agent version used */
  version: string;
}

// ============================================================================
// Input Data Schemas with Zod Validation
// ============================================================================

/**
 * Zod schema for travel form data validation
 * Matches the existing form structure from TripDetails components
 */
export const TravelFormDataSchema = z.object({
  // Trip Basic Information
  destination: z.string().min(2, "Destination is required"),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  tripNickname: z.string().min(1, "Trip nickname is required"),
  contactName: z.string().min(2, "Contact name is required"),
  
  // Travelers
  adults: z.number().int().min(1, "At least one adult required"),
  children: z.number().int().min(0, "Children count cannot be negative"),
  
  // Budget
  budget: z.object({
    amount: z.number().positive("Budget amount must be positive"),
    currency: z.enum(["USD", "EUR", "GBP", "JPY", "CAD", "AUD"]),
    mode: z.enum(["per-person", "total", "flexible"])
  }),
  
  // Preferences
  preferences: z.object({
    travelStyle: z.enum(["adventure", "culture", "relaxation", "family", "business", "budget", "luxury"]),
    interests: z.array(z.string()).min(1, "At least one interest required"),
    accommodationType: z.enum(["hotel", "hostel", "airbnb", "resort", "any"]).optional(),
    transportationMode: z.enum(["flight", "train", "car", "bus", "any"]).optional(),
    dietaryRestrictions: z.array(z.string()).optional(),
    accessibility: z.array(z.string()).optional()
  })
});

/**
 * TypeScript type derived from Zod schema
 */
export type TravelFormData = z.infer<typeof TravelFormDataSchema>;

// ============================================================================
// Supporting Types
// ============================================================================

/**
 * Supported LLM providers for agent execution
 */
export enum LLMProvider {
  GROQ = 'groq',
  CEREBRAS = 'cerebras', 
  GEMINI = 'gemini',
  OPENAI = 'openai' // Fallback option
}

/**
 * Retry configuration for agent execution
 */
export interface RetryConfig {
  /** Maximum retry attempts */
  maxRetries: number;
  
  /** Base delay between retries in milliseconds */
  baseDelay: number;
  
  /** Exponential backoff multiplier */
  backoffMultiplier: number;
  
  /** Maximum delay between retries */
  maxDelay: number;
  
  /** Retryable error types */
  retryableErrors: string[];
}

/**
 * Resource limits for workflow execution
 */
export interface ResourceLimits {
  /** Maximum total execution time in milliseconds */
  maxExecutionTime: number;
  
  /** Maximum cost per workflow in USD */
  maxCost: number;
  
  /** Maximum tokens per agent */
  maxTokensPerAgent: number;
  
  /** Maximum memory usage in MB */
  maxMemoryUsage: number;
  
  /** Maximum concurrent workflows */
  maxConcurrentWorkflows: number;
}

/**
 * Observability configuration
 */
export interface ObservabilityConfig {
  /** Enable LangSmith tracing */
  langsmithEnabled: boolean;
  
  /** LangSmith project name */
  langsmithProject?: string;
  
  /** Enable performance metrics */
  metricsEnabled: boolean;
  
  /** Enable detailed logging */
  verboseLogging: boolean;
  
  /** Custom tags for tracking */
  tags: Record<string, string>;
}

/**
 * Workflow error interface
 */
export interface WorkflowError {
  /** Error code */
  code: string;
  
  /** Human-readable error message */
  message: string;
  
  /** Agent that caused the error */
  agent?: AgentType;
  
  /** Error timestamp */
  timestamp: Date;
  
  /** Is this error retryable? */
  retryable: boolean;
  
  /** Stack trace for debugging */
  stack?: string;
  
  /** Additional error context */
  context?: Record<string, unknown>;
}

/**
 * Agent-specific error interface
 */
export interface AgentError {
  /** Error type */
  type: AgentErrorType;
  
  /** Error message */
  message: string;
  
  /** Error severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  /** Is this error recoverable? */
  recoverable: boolean;
  
  /** Suggested recovery action */
  suggestedAction?: string;
  
  /** Error details */
  details?: Record<string, unknown>;
}

/**
 * Agent error type enumeration
 */
export enum AgentErrorType {
  VALIDATION_ERROR = 'validation-error',
  EXECUTION_ERROR = 'execution-error',
  TIMEOUT_ERROR = 'timeout-error',
  RATE_LIMIT_ERROR = 'rate-limit-error',
  PROVIDER_ERROR = 'provider-error',
  NETWORK_ERROR = 'network-error',
  COST_LIMIT_ERROR = 'cost-limit-error',
  UNKNOWN_ERROR = 'unknown-error'
}

// ============================================================================
// Workflow Status & Progress Tracking
// ============================================================================

/**
 * Workflow status for external API consumers
 */
export interface WorkflowStatus {
  /** Session identifier */
  sessionId: string;
  
  /** Current workflow state */
  state: WorkflowState;
  
  /** Current agent being executed */
  currentAgent?: AgentType;
  
  /** Progress percentage (0-100) */
  progressPercentage: number;
  
  /** Estimated time remaining in milliseconds */
  estimatedTimeRemainingMs?: number;
  
  /** Completed agents */
  completedAgents: AgentType[];
  
  /** Failed agents */
  failedAgents: AgentType[];
  
  /** Last updated timestamp */
  updatedAt: Date;
  
  /** Human-readable status message */
  statusMessage: string;
  
  /** Any warnings or non-fatal errors */
  warnings: string[];
}

/**
 * Real-time streaming event for SSE
 */
export interface WorkflowStreamEvent {
  /** Event type */
  type: WorkflowEventType;
  
  /** Event data */
  data: unknown;
  
  /** Event timestamp */
  timestamp: Date;
  
  /** Session identifier */
  sessionId: string;
  
  /** Event sequence number */
  sequence: number;
}

/**
 * Workflow event types for streaming
 */
export enum WorkflowEventType {
  WORKFLOW_STARTED = 'workflow-started',
  WORKFLOW_PROGRESS = 'workflow-progress',
  WORKFLOW_COMPLETED = 'workflow-completed',
  WORKFLOW_FAILED = 'workflow-failed',
  WORKFLOW_CANCELLED = 'workflow-cancelled',
  AGENT_STARTED = 'agent-started',
  AGENT_PROGRESS = 'agent-progress',
  AGENT_COMPLETED = 'agent-completed',
  AGENT_FAILED = 'agent-failed',
  HEARTBEAT = 'heartbeat',
  ERROR = 'error'
}

// ============================================================================
// Type Guards and Validation Utilities
// ============================================================================

/**
 * Type guard to check if an object is a valid AgentResult
 */
export function isAgentResult(obj: unknown): obj is AgentResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'agent' in obj &&
    'success' in obj &&
    'data' in obj &&
    'metadata' in obj &&
    'errors' in obj &&
    'confidence' in obj
  );
}

/**
 * Type guard to check if an object is a valid WorkflowContext
 */
export function isWorkflowContext(obj: unknown): obj is WorkflowContext {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'sessionId' in obj &&
    'formData' in obj &&
    'state' in obj &&
    'agentResults' in obj &&
    'messages' in obj &&
    'config' in obj &&
    'metadata' in obj
  );
}

/**
 * Validate travel form data using Zod schema
 */
export function validateTravelFormData(data: unknown): TravelFormData {
  return TravelFormDataSchema.parse(data);
}

// ============================================================================
// Default Configurations
// ============================================================================

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 30000,
  retryableErrors: [
    'rate-limit-error',
    'network-error', 
    'timeout-error',
    'provider-error'
  ]
};

/**
 * Default resource limits
 */
export const DEFAULT_RESOURCE_LIMITS: ResourceLimits = {
  maxExecutionTime: 300000, // 5 minutes
  maxCost: 1.0, // $1 USD per workflow
  maxTokensPerAgent: 20000,
  maxMemoryUsage: 512, // 512 MB
  maxConcurrentWorkflows: 10
};

/**
 * Default provider chains for each agent
 */
export const DEFAULT_PROVIDER_CHAINS: Record<AgentType, LLMProvider[]> = {
  [AgentType.CONTENT_PLANNER]: [LLMProvider.GROQ, LLMProvider.CEREBRAS, LLMProvider.GEMINI],
  [AgentType.INFO_GATHERER]: [LLMProvider.GROQ, LLMProvider.CEREBRAS],
  [AgentType.STRATEGIST]: [LLMProvider.CEREBRAS, LLMProvider.GROQ, LLMProvider.GEMINI],
  [AgentType.COMPILER]: [LLMProvider.CEREBRAS, LLMProvider.GEMINI]
};

/**
 * Agent timeout configurations in milliseconds
 */
export const AGENT_TIMEOUTS: Record<AgentType, number> = {
  [AgentType.CONTENT_PLANNER]: 30000, // 30 seconds
  [AgentType.INFO_GATHERER]: 45000,   // 45 seconds (web scraping takes longer)
  [AgentType.STRATEGIST]: 30000,      // 30 seconds
  [AgentType.COMPILER]: 20000         // 20 seconds
};

/**
 * Agent cost budgets in USD
 */
export const AGENT_COST_BUDGETS: Record<AgentType, number> = {
  [AgentType.CONTENT_PLANNER]: 0.10, // $0.10
  [AgentType.INFO_GATHERER]: 0.30,   // $0.30 (most expensive due to web search)
  [AgentType.STRATEGIST]: 0.20,      // $0.20
  [AgentType.COMPILER]: 0.15         // $0.15
};
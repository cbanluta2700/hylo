/**
 * Inngest Agent Utilities
 *
 * Converts HTTP-based agent handlers to Inngest step functions.
 * Replaces api/agents/shared-handler.ts logic for internal workflow use.
 */

import type { AgentInput, AgentOutput } from '../../types/agent-responses';
import type { EnhancedFormData } from '../../types/form-data';
import { updateProgress } from './client-v2';

// =============================================================================
// Agent Response Interface (from shared-handler.ts)
// =============================================================================

export interface AgentResponse {
  success: boolean;
  output?: AgentOutput;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    agentVersion: string;
    processingTime: number;
    modelUsed: string;
    tokensUsed?: number;
    cost?: number;
  };
}

// =============================================================================
// Agent Step Wrapper Interface
// =============================================================================

export interface BaseAgent {
  processRequest(input: AgentInput): Promise<AgentResponse>;
}

export interface AgentStepConfig {
  agent: BaseAgent;
  stepName: string;
  agentName: 'architect' | 'gatherer' | 'specialist' | 'form-putter';
  timeout?: number;
  retries?: number;
}

export interface AgentStepResult {
  success: boolean;
  output?: AgentOutput;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    agentName: string;
    stepName: string;
    processingTime: number;
    modelUsed?: string;
    tokensUsed?: number;
    cost?: number;
    retryAttempt: number;
    timestamp: string;
  };
}

// =============================================================================
// Core Agent Step Wrapper
// =============================================================================

/**
 * Creates an Inngest step wrapper for any agent
 * Replaces the HTTP handler logic from shared-handler.ts
 */
export function createInngestAgentStep(config: AgentStepConfig) {
  return async (
    input: {
      formData: EnhancedFormData;
      context: any;
      sessionId: string;
      requestId: string;
    },
    retryAttempt: number = 1
  ): Promise<AgentStepResult> => {
    const startTime = Date.now();
    const { agent, stepName, agentName } = config;

    try {
      // Send progress update - step started
      await updateProgress(
        input.sessionId,
        input.requestId,
        `${agentName}-started`,
        getProgressForAgent(agentName, 'started'),
        `Starting ${agentName} agent...`,
        agentName
      );

      // Validate input (simplified from shared-handler.ts)
      const validationError = validateAgentInput(input.formData, input.context, agentName);
      if (validationError) {
        throw new Error(`Input validation failed: ${validationError.message}`);
      }

      // Prepare agent input
      const agentInput: AgentInput = {
        formData: input.formData,
        context: input.context,
      };

      // Process with agent
      const result = await agent.processRequest(agentInput);
      const processingTime = Date.now() - startTime;

      // Send progress update - step completed
      await updateProgress(
        input.sessionId,
        input.requestId,
        `${agentName}-completed`,
        getProgressForAgent(agentName, 'completed'),
        `${agentName} agent completed successfully`,
        agentName
      );

      // Return successful result
      return {
        success: true,
        output: result.output,
        metadata: {
          agentName,
          stepName,
          processingTime,
          modelUsed: result.metadata.modelUsed,
          ...(result.metadata.tokensUsed && { tokensUsed: result.metadata.tokensUsed }),
          ...(result.metadata.cost && { cost: result.metadata.cost }),
          retryAttempt,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      // Send progress update - step failed
      await updateProgress(
        input.sessionId,
        input.requestId,
        `${agentName}-failed`,
        getProgressForAgent(agentName, 'started'), // Don't advance progress on failure
        `${agentName} agent failed: ${error.message}`,
        agentName
      );

      return {
        success: false,
        error: {
          code: error.code || 'AGENT_ERROR',
          message: error.message || 'Unknown agent error',
          details: {
            stack: error.stack,
            agentName,
            stepName,
            retryAttempt,
          },
        },
        metadata: {
          agentName,
          stepName,
          processingTime,
          retryAttempt,
          timestamp: new Date().toISOString(),
        },
      };
    }
  };
}

// =============================================================================
// Input Validation (from shared-handler.ts)
// =============================================================================

interface ValidationError {
  message: string;
  status: number;
}

/**
 * Validates agent input - simplified from shared-handler.ts validation functions
 */
function validateAgentInput(
  formData: EnhancedFormData,
  context: any,
  agentName: string
): ValidationError | null {
  // Basic validation
  if (!formData) {
    return { message: 'formData is required', status: 400 };
  }

  if (!context) {
    return { message: 'context is required', status: 400 };
  }

  // Agent-specific validation
  switch (agentName) {
    case 'architect':
      return validateArchitectInput(formData, context);
    case 'gatherer':
      return validateGathererInput(formData, context);
    case 'specialist':
      return validateSpecialistInput(formData, context);
    case 'form-putter':
      return validateFormPutterInput(formData, context);
    default:
      return { message: `Unknown agent: ${agentName}`, status: 400 };
  }
}

function validateArchitectInput(formData: EnhancedFormData, context: any): ValidationError | null {
  if (!formData.destination) {
    return { message: 'Destination is required for architect agent', status: 400 };
  }
  if (!formData.duration) {
    return { message: 'Duration is required for architect agent', status: 400 };
  }
  return null;
}

function validateGathererInput(formData: EnhancedFormData, context: any): ValidationError | null {
  if (!formData.destination) {
    return { message: 'Destination is required for gatherer agent', status: 400 };
  }
  if (!context.smartQueries) {
    return { message: 'Smart queries are required for gatherer agent', status: 400 };
  }
  return null;
}

function validateSpecialistInput(formData: EnhancedFormData, context: any): ValidationError | null {
  if (!formData.destination) {
    return { message: 'Destination is required for specialist agent', status: 400 };
  }
  if (!context.architectResult && !context.gathererResult) {
    return { message: 'Previous agent results are required for specialist agent', status: 400 };
  }
  return null;
}

function validateFormPutterInput(formData: EnhancedFormData, context: any): ValidationError | null {
  if (!context.architectResult || !context.gathererResult || !context.specialistResult) {
    return {
      message: 'All previous agent results are required for form-putter agent',
      status: 400,
    };
  }
  return null;
}

// =============================================================================
// Progress Calculation
// =============================================================================

/**
 * Calculates progress percentage for each agent stage
 */
function getProgressForAgent(
  agentName: 'architect' | 'gatherer' | 'specialist' | 'form-putter',
  status: 'started' | 'completed'
): number {
  const progressMap = {
    architect: { started: 5, completed: 25 },
    gatherer: { started: 25, completed: 50 },
    specialist: { started: 50, completed: 75 },
    'form-putter': { started: 75, completed: 100 },
  };

  return progressMap[agentName][status];
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Creates parallel agent steps for concurrent execution
 */
export function createParallelAgentSteps(configs: AgentStepConfig[]) {
  return configs.map((config) => createInngestAgentStep(config));
}

/**
 * Creates sequential agent pipeline
 */
export function createSequentialAgentPipeline(configs: AgentStepConfig[]) {
  return async (initialInput: any) => {
    let currentInput = initialInput;
    const results: AgentStepResult[] = [];

    for (const config of configs) {
      const step = createInngestAgentStep(config);
      const result = await step(currentInput);
      results.push(result);

      if (!result.success) {
        throw new Error(`Agent ${config.agentName} failed: ${result.error?.message}`);
      }

      // Pass output to next agent
      currentInput = {
        ...currentInput,
        context: {
          ...currentInput.context,
          [`${config.agentName}Result`]: result.output,
        },
      };
    }

    return results;
  };
}

/**
 * Error recovery utility for failed agent steps
 */
export async function recoverFromAgentError(
  error: any,
  config: AgentStepConfig,
  input: any,
  retryAttempt: number
): Promise<AgentStepResult> {
  const maxRetries = config.retries || 2;

  if (retryAttempt <= maxRetries) {
    console.log(
      `Retrying ${config.agentName} agent (attempt ${retryAttempt + 1}/${maxRetries + 1})`
    );
    const step = createInngestAgentStep(config);
    return step(input, retryAttempt + 1);
  }

  // Max retries exceeded, return failure
  return {
    success: false,
    error: {
      code: 'MAX_RETRIES_EXCEEDED',
      message: `Agent ${config.agentName} failed after ${maxRetries} retries`,
      details: error,
    },
    metadata: {
      agentName: config.agentName,
      stepName: config.stepName,
      processingTime: 0,
      retryAttempt,
      timestamp: new Date().toISOString(),
    },
  };
}

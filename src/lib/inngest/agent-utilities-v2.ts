/**
 * Inngest Agent Utilities - Simplified Version
 *
 * Converts HTTP-based agent handlers to Inngest step functions.
 * Replaces api/agents/shared-handler.ts logic for internal workflow use.
 */

import type { AgentInput, AgentOutput } from '../../types/agent-responses';
import type { EnhancedFormData } from '../../types/form-data';
import { updateProgress } from './client-v2';

// =============================================================================
// Interfaces
// =============================================================================

export interface BaseAgent {
  processRequest(input: AgentInput): Promise<{
    success: boolean;
    output?: AgentOutput;
    error?: any;
    metadata: {
      agentVersion: string;
      processingTime: number;
      modelUsed: string;
      tokensUsed?: number;
      cost?: number;
    };
  }>;
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

export function createInngestAgentStep(
  agent: BaseAgent,
  agentName: 'architect' | 'gatherer' | 'specialist' | 'form-putter',
  stepName: string
) {
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

      // Basic validation
      if (!input.formData?.location) {
        throw new Error(`Location is required for ${agentName} agent`);
      }

      // Prepare agent input
      const agentInput: AgentInput = {
        formData: input.formData,
        context: input.context,
      };

      // Process with agent
      const result = await agent.processRequest(agentInput);
      const processingTime = Date.now() - startTime;

      if (!result.success) {
        throw new Error(result.error?.message || `${agentName} agent failed`);
      }

      // Send progress update - step completed
      await updateProgress(
        input.sessionId,
        input.requestId,
        `${agentName}-completed`,
        getProgressForAgent(agentName, 'completed'),
        `${agentName} agent completed successfully`,
        agentName
      );

      return {
        success: true,
        output: result.output,
        metadata: {
          agentName,
          stepName,
          processingTime,
          modelUsed: result.metadata.modelUsed,
          tokensUsed: result.metadata.tokensUsed,
          cost: result.metadata.cost,
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
        getProgressForAgent(agentName, 'started'),
        `${agentName} agent failed: ${error.message}`,
        agentName
      );

      return {
        success: false,
        error: {
          code: error.code || 'AGENT_ERROR',
          message: error.message || 'Unknown agent error',
          details: {
            agentName,
            stepName,
            retryAttempt,
            stack: error.stack,
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
// Progress Calculation
// =============================================================================

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

export async function executeAgentSequentially(
  agents: Array<{
    agent: BaseAgent;
    name: 'architect' | 'gatherer' | 'specialist' | 'form-putter';
    stepName: string;
  }>,
  initialInput: {
    formData: EnhancedFormData;
    context: any;
    sessionId: string;
    requestId: string;
  }
) {
  const results: AgentStepResult[] = [];
  let currentInput = initialInput;

  for (const { agent, name, stepName } of agents) {
    const step = createInngestAgentStep(agent, name, stepName);
    const result = await step(currentInput);
    results.push(result);

    if (!result.success) {
      throw new Error(`Agent ${name} failed: ${result.error?.message}`);
    }

    // Pass output to next agent
    currentInput = {
      ...currentInput,
      context: {
        ...currentInput.context,
        [`${name}Result`]: result.output,
      },
    };
  }

  return results;
}

export async function executeAgentsInParallel(
  agents: Array<{
    agent: BaseAgent;
    name: 'architect' | 'gatherer' | 'specialist' | 'form-putter';
    stepName: string;
  }>,
  input: {
    formData: EnhancedFormData;
    context: any;
    sessionId: string;
    requestId: string;
  }
) {
  const steps = agents.map(({ agent, name, stepName }) =>
    createInngestAgentStep(agent, name, stepName)(input)
  );

  return Promise.all(steps);
}

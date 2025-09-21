import { NextApiRequest, NextApiResponse } from 'next';
import { EnhancedFormData } from '../../src/types/form-data';
import { AgentInput, AgentOutput } from '../../src/types/agent-responses';

/**
 * Base Agent Interface
 */
export interface BaseAgent {
  processRequest(input: AgentInput): Promise<AgentResponse>;
}

/**
 * Agent Response Interface
 */
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

/**
 * Validation Error Interface
 */
export interface ValidationError {
  status: number;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Agent Endpoint Configuration
 */
export interface AgentEndpointConfig {
  agent: BaseAgent;
  endpoint: string;
  validateRequest: (formData: any, context: any) => ValidationError | null;
}

/**
 * Generic Agent Handler
 * Eliminates code duplication across agent endpoints
 */
export function createAgentHandler(config: AgentEndpointConfig) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only POST requests are allowed',
        },
      });
    }

    const startTime = Date.now();

    try {
      const { formData, context } = req.body;

      // Validate request
      const validationError = config.validateRequest(formData, context);
      if (validationError) {
        return res.status(validationError.status).json({
          ...validationError,
          timestamp: new Date().toISOString(),
        });
      }

      // Prepare agent input
      const agentInput: AgentInput = {
        formData: formData as EnhancedFormData,
        context: context || {},
      };

      // Process with agent
      const result = await config.agent.processRequest(agentInput);

      // Return response
      if (result.success) {
        return res.status(200).json({
          success: true,
          output: result.output,
          metadata: {
            ...result.metadata,
            processingTime: Date.now() - startTime,
            endpoint: config.endpoint,
          },
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error,
          metadata: {
            ...result.metadata,
            processingTime: Date.now() - startTime,
            endpoint: config.endpoint,
          },
        });
      }
    } catch (error) {
      console.error(`Error in ${config.endpoint} agent endpoint:`, error);

      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: `Failed to process ${config.endpoint} request`,
          details: process.env.NODE_ENV === 'development' ? error : undefined,
        },
        metadata: {
          processingTime: Date.now() - startTime,
          endpoint: config.endpoint,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
}

/**
 * Common Validation Functions
 */

/**
 * Validate basic form data requirements
 */
export function validateBasicFormData(formData: any): ValidationError | null {
  if (!formData) {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request body must include formData',
      },
    };
  }

  if (!formData.location || typeof formData.location !== 'string') {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'formData.location is required and must be a string',
      },
    };
  }

  if (!formData.adults || typeof formData.adults !== 'number' || formData.adults < 1) {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'formData.adults is required and must be a positive number',
      },
    };
  }

  return null;
}

/**
 * Validate context object
 */
export function validateContext(context: any): ValidationError | null {
  if (context && typeof context !== 'object') {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'context must be an object if provided',
      },
    };
  }

  return null;
}

/**
 * Validate gatherer-specific requirements
 */
export function validateGathererContext(context: any): ValidationError | null {
  if (context && context.queries) {
    if (!Array.isArray(context.queries)) {
      return {
        status: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'context.queries must be an array if provided',
        },
      };
    }

    for (const query of context.queries) {
      if (!query.query || typeof query.query !== 'string') {
        return {
          status: 400,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Each query must have a query string',
          },
        };
      }
    }
  }

  return null;
}

/**
 * Validate specialist-specific requirements
 */
export function validateSpecialistContext(context: any): ValidationError | null {
  if (context && context.previousResults) {
    if (!Array.isArray(context.previousResults)) {
      return {
        status: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'context.previousResults must be an array if provided',
        },
      };
    }
  }

  return null;
}

/**
 * Combined validation functions for each agent type
 */

export function validateArchitectRequest(formData: any, context: any): ValidationError | null {
  const formDataError = validateBasicFormData(formData);
  if (formDataError) return formDataError;

  const contextError = validateContext(context);
  if (contextError) return contextError;

  return null;
}

export function validateGathererRequest(formData: any, context: any): ValidationError | null {
  const formDataError = validateBasicFormData(formData);
  if (formDataError) return formDataError;

  const contextError = validateContext(context);
  if (contextError) return contextError;

  const gathererError = validateGathererContext(context);
  if (gathererError) return gathererError;

  return null;
}

export function validateSpecialistRequest(formData: any, context: any): ValidationError | null {
  const formDataError = validateBasicFormData(formData);
  if (formDataError) return formDataError;

  const contextError = validateContext(context);
  if (contextError) return contextError;

  const specialistError = validateSpecialistContext(context);
  if (specialistError) return specialistError;

  return null;
}

/**
 * Export types for use in agent endpoints
 */
export type { AgentInput, AgentOutput };

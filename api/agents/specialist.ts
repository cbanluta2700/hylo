import { NextApiRequest, NextApiResponse } from 'next';
import { informationSpecialist } from '../../src/lib/agents/specialist';
import {
  createAgentHandler,
  validateSpecialistRequest,
  type BaseAgent,
} from './shared-handler';

/**
 * POST /api/agents/specialist
 * Information Specialist Agent Endpoint
 *
 * This endpoint provides direct access to the Information Specialist agent
 * for deep analysis and cultural insights generation.
 *
 * Request Body:
 * {
 *   'formData': EnhancedFormData,
 *   'context': {
 *     'sessionId': string,
 *     'previousResults': any[],
 *     'stage': 'specialist'
 *   }
 * }
 *
 * Response:
 * {
 *   'success': boolean,
 *   'output': AgentOutput,
 *   'error': {...},
 *   'metadata': {...}
 * }
 */

// Cast the agent to BaseAgent interface for the shared handler
const specialistAgent = informationSpecialist as BaseAgent;

// Create handler using shared logic
export default createAgentHandler({
  agent: specialistAgent,
  endpoint: '/api/agents/specialist',
  validateRequest: validateSpecialistRequest,
});

/**
 * Export for testing purposes
 */
export { validateSpecialistRequest };
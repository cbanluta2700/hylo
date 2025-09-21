import { NextApiRequest, NextApiResponse } from 'next';
import { itineraryArchitect } from '../../src/lib/agents/architect';
import { createAgentHandler, validateArchitectRequest, type BaseAgent } from './shared-handler';

/**
 * POST /api/agents/architect
 * Itinerary Architect Agent Endpoint
 *
 * This endpoint provides direct access to the Itinerary Architect agent
 * for high-level itinerary planning and structure generation.
 *
 * Request Body:
 * {
 *   "formData": EnhancedFormData,
 *   "context": {
 *     "sessionId": string,
 *     "smartQueries": SmartQuery[],
 *     "stage": "architect"
 *   }
 * }
 *
 * Response:
 * {
 *   "success": boolean,
 *   "output": AgentOutput,
 *   "error": {...},
 *   "metadata": {...}
 * }
 */

// Cast the agent to BaseAgent interface for the shared handler
const architectAgent = itineraryArchitect as BaseAgent;

// Create handler using shared logic
export default createAgentHandler({
  agent: architectAgent,
  endpoint: '/api/agents/architect',
  validateRequest: validateArchitectRequest,
});

/**
 * Export for testing purposes
 */
export { validateArchitectRequest };

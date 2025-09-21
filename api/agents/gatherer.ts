import { NextApiRequest, NextApiResponse } from 'next';
import { webInformationGatherer } from '../../src/lib/agents/gatherer';
import { createAgentHandler, validateGathererRequest, type BaseAgent } from './shared-handler';

/**
 * POST /api/agents/gatherer
 * Web Information Gatherer Agent Endpoint
 *
 * This endpoint provides direct access to the Web Information Gatherer agent
 * for real-time travel data collection and synthesis.
 *
 * Request Body:
 * {
 *   "formData": EnhancedFormData,
 *   "context": {
 *     "sessionId": string,
 *     "smartQueries": SmartQuery[],
 *     "stage": "gatherer"
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
const gathererAgent = webInformationGatherer as BaseAgent;

// Create handler using shared logic
export default createAgentHandler({
  agent: gathererAgent,
  endpoint: '/api/agents/gatherer',
  validateRequest: validateGathererRequest,
});

/**
 * Export for testing purposes
 */
export { validateGathererRequest };

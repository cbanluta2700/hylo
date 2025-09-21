import { serve } from 'inngest/next';
import { inngest } from '../src/lib/inngest/client-v2';
import { inngestFunctions } from '../src/lib/inngest/functions';

/**
 * Enhanced Inngest API Handler
 *
 * Consolidated endpoint serving all Inngest workflows.
 * Replaces previous scattered approach with centralized orchestration.
 *
 * Functions included:
 * - itineraryWorkflow: Main 4-agent orchestration workflow
 * - Individual agent functions: architect, gatherer, specialist, form-putter
 * - progressTrackingFunction: Progress updates and WebSocket integration
 *
 * This single endpoint handles all workflow orchestration,
 * eliminating the need for separate agent HTTP endpoints.
 */
export default serve({
  client: inngest,
  functions: inngestFunctions,

  // Serve configuration
  streaming: true,

  // Development configuration
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',

  // Function registration
  landingPage: process.env.NODE_ENV === 'development',
});

/**
 * API Configuration for Vercel
 */
export const config = {
  runtime: 'edge',
  maxDuration: 300, // 5 minutes max for workflow completion
};

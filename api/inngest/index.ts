/**
 * Inngest Serve Handler
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - Standard inngest/express serve handler (not inngest/vercel)
 * - Proper function registration
 *
 * Following architecture structure from migration plan
 */

import { serve } from 'inngest/express';
import { inngest } from './client.js';

// Import all functions
import { generateItinerary } from './functions/generateItinerary.js';
import { architectAgent } from './functions/architectAgent.js';
import { gathererAgent } from './functions/gathererAgent.js';
import { specialistAgent } from './functions/specialistAgent.js';
import { formatterAgent } from './functions/formatterAgent.js';

/**
 * Serve all Inngest functions via Vercel Serverless Function
 * Available at /api/inngest endpoint
 */
export default serve({
  client: inngest,
  functions: [
    // Main workflow orchestrator
    generateItinerary,

    // Individual agent functions
    architectAgent,
    gathererAgent,
    specialistAgent,
    formatterAgent,
  ],
});

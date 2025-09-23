/**
 * Inngest Serve Handler
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - Vercel-specific serve handler for proper deployment
 * - Proper function registration
 *
 * Following architecture structure from migration plan
 */
import { serve } from 'inngest/express';
import { inngest } from './client';
// Import all functions
import { generateItinerary } from './functions/generateItinerary';
import { architectAgent } from './functions/architectAgent';
import { gathererAgent } from './functions/gathererAgent';
import { specialistAgent } from './functions/specialistAgent';
import { formatterAgent } from './functions/formatterAgent';
// That's it! Vercel handles the rest automatically
export default serve({
    client: inngest,
    functions: [
        generateItinerary,
        // Individual agent functions
        architectAgent,
        gathererAgent,
        specialistAgent,
        formatterAgent,
    ],
});

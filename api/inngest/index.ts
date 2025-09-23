/**
 * Inngest API Route for Vercel Edge Runtime
 * Following the exact Inngest documentation patterns
 */

import { serve } from 'inngest/next';
import { inngest, generateItineraryFunction } from '../../src/inngest/functions.js';

// Edge Runtime configuration for Vercel
export const config = {
  runtime: 'edge',
};

// Serve Inngest functions following Next.js App Router pattern
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateItineraryFunction, // Your travel itinerary function
  ],
});

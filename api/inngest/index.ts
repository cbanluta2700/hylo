import { serve } from 'inngest/express';
import { inngest } from './client';
import { generateItinerary } from './functions/generateItinerary';

export const config = {
  runtime: 'edge',
};

// Using EXPRESS pattern as explicitly requested
export default serve({
  client: inngest,
  functions: [generateItinerary],
});

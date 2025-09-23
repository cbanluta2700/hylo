import { serve } from 'inngest/next';
import { inngest } from './client';
import { generateItinerary } from './functions/generateItinerary';

export const config = {
  runtime: 'edge',
};

// Testing NEXT pattern to see if it fixes FUNCTION_INVOCATION_FAILED
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateItinerary],
});

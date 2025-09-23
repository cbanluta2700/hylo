import { serve } from 'inngest/express';
import { inngest } from './client';
import { generateItinerary } from './functions/generateItinerary';

export const config = {
  runtime: 'edge',
};

export default serve({
  client: inngest,
  functions: [generateItinerary],
});

import { Inngest } from 'inngest';
import { config } from '../env';

// Initialize Inngest client with environment configuration
export const inngest = new Inngest({
  id: 'hylo-itinerary-generator',
  eventKey: config.inngest.eventKey,
  signingKey: config.inngest.signingKey,
});

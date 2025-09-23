// src/inngest/functions.ts
import { Inngest } from 'inngest';

// Create a client to send and receive events
export const inngest = new Inngest({ id: 'hylo-travel-ai' });

export const generateItineraryFunction = inngest.createFunction(
  { id: 'generate-itinerary' },
  { event: 'itinerary/generate' },
  async ({ event, step }) => {
    await step.run('log-event-data', async () => {
      console.log('Received event:', event.data);
    });

    const { workflowId, sessionId, formData } = event.data;

    await step.run('process-itinerary', async () => {
      console.log(`🚀 Processing itinerary for ${formData.location}`);
      // AI agents will be called here
      return { status: 'completed', workflowId };
    });

    return 'Itinerary generation completed successfully!';
  }
);

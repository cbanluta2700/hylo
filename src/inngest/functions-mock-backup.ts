// src/inngest/functions.ts
import { Inngest } from 'inngest';
import { sessionManager } from '../lib/workflows/session-manager';

// Create a client to send and receive events
export const inngest = new Inngest({ id: 'hylo-travel-ai' });

export const generateItineraryFunction = inngest.createFunction(
  { id: 'generate-itinerary' },
  { event: 'itinerary/generate' },
  async ({ event, step }) => {
    console.log('📡 [Inngest] Received event:', event.data);

    const { workflowId, sessionId, formData } = event.data;

    // Step 1: Update session to processing
    await step.run('update-session-processing', async () => {
      console.log(`🔄 [Inngest] Updating session to processing: ${workflowId}`);
      await sessionManager.updateProgress(workflowId, {
        status: 'processing',
        currentStage: 'architect',
        progress: 10,
      });
      return { status: 'processing', stage: 'architect' };
    });

    // Step 2: Generate basic itinerary (simple mock for now)
    const itinerary = await step.run('generate-basic-itinerary', async () => {
      console.log(`🚀 [Inngest] Generating itinerary for ${formData.location}`);

      // Simple mock itinerary following constitutional rules
      return {
        destination: formData.location,
        duration: `${formData.adults || 1} adults for ${Math.ceil(
          (new Date(formData.returnDate).getTime() - new Date(formData.departDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )} days`,
        itinerary: [
          {
            day: 1,
            title: `Arrival in ${formData.location}`,
            activities: [
              'Check into hotel',
              'Explore local area',
              'Welcome dinner at local restaurant',
            ],
          },
          {
            day: 2,
            title: `Explore ${formData.location}`,
            activities: [
              'Visit main attractions',
              'Local cultural experience',
              'Traditional cuisine tasting',
            ],
          },
        ],
        generated: new Date().toISOString(),
        workflowId,
      };
    });

    // Step 3: Store result and update session to completed
    await step.run('update-session-completed', async () => {
      console.log(`✅ [Inngest] Updating session to completed: ${workflowId}`);

      // Store the itinerary result separately in Redis
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({
        url: process.env['KV_REST_API_URL']!,
        token: process.env['KV_REST_API_TOKEN']!,
      });

      await redis.set(`itinerary:${workflowId}`, JSON.stringify(itinerary));

      await sessionManager.updateProgress(workflowId, {
        status: 'completed',
        currentStage: 'complete',
        progress: 100,
      });

      return { status: 'completed', result: itinerary };
    });

    console.log(`🎉 [Inngest] Itinerary generation completed for: ${workflowId}`);
    return { success: true, workflowId, itinerary };
  }
);

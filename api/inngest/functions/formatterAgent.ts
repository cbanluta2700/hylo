/**
 * Formatter Agent Function
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - Fast processing for final output structuring
 * - Type-safe development
 *
 * Following architecture structure from migration plan
 */

import { inngest } from '../client.js';
import { formatItinerary } from '../../../src/lib/ai-clients/hylo-ai-clients.js';

/**
 * Individual Formatter Agent Function
 * Creates the final structured itinerary output
 */
export const formatterAgent = inngest.createFunction(
  {
    id: 'formatter-agent',
    name: 'Itinerary Formatter Agent',
    retries: 2,
  },
  { event: 'agent/formatter/start' },
  async ({ event, step }) => {
    const { workflowId, processedData, travelStyle } = event.data;

    console.log('📝 [INNGEST] Formatter Agent: Starting itinerary formatting', {
      workflowId: workflowId.substring(0, 15) + '...',
      travelStyle,
    });

    try {
      const formattedItinerary = await step.run('format-itinerary', async () => {
        return await formatItinerary(processedData, travelStyle);
      });

      // Send completion event
      await step.sendEvent('formatter-complete', {
        name: 'agent/formatter/complete',
        data: {
          workflowId,
          itinerary: formattedItinerary,
        },
      });

      console.log('✅ [INNGEST] Formatter Agent: Itinerary formatting completed');

      return {
        workflowId,
        agent: 'formatter',
        status: 'completed',
        itinerary: formattedItinerary,
      };
    } catch (error) {
      console.error('💥 [INNGEST] Formatter Agent: Failed', {
        workflowId: workflowId.substring(0, 15) + '...',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }
);

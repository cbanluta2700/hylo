/**
 * Gatherer Agent Function
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - High-speed processing for information collection
 * - Integration with existing search providers
 *
 * Following architecture structure from migration plan
 */

import { inngest } from '../client.js';
import { processGatheredInfo } from '../../../src/lib/ai-clients/hylo-ai-clients.js';

/**
 * Individual Gatherer Agent Function
 * Collects and processes travel information from various sources
 */
export const gathererAgent = inngest.createFunction(
  {
    id: 'gatherer-agent',
    name: 'Information Gatherer Agent',
    retries: 2,
  },
  { event: 'agent/gatherer/start' },
  async ({ event, step }) => {
    const { workflowId, destination, architecture } = event.data;

    console.log('🌐 [INNGEST] Gatherer Agent: Starting information gathering', {
      workflowId: workflowId.substring(0, 15) + '...',
      destination,
    });

    try {
      const gatheredInfo = await step.run('gather-information', async () => {
        // Placeholder: In Phase 2, this will integrate with existing gatherer agent
        const mockSearchResults = [
          { title: `Top attractions in ${destination}`, type: 'attraction', rating: 4.8 },
          { title: `Best restaurants in ${destination}`, type: 'dining', rating: 4.7 },
          { title: `Local culture in ${destination}`, type: 'culture', rating: 4.6 },
          { title: `Transportation options in ${destination}`, type: 'transport', rating: 4.5 },
        ];

        return await processGatheredInfo(mockSearchResults, destination);
      });

      // Send completion event
      await step.sendEvent('gatherer-complete', {
        name: 'agent/gatherer/complete',
        data: {
          workflowId,
          research: gatheredInfo,
        },
      });

      console.log('✅ [INNGEST] Gatherer Agent: Information gathering completed');

      return {
        workflowId,
        agent: 'gatherer',
        status: 'completed',
        research: gatheredInfo,
      };
    } catch (error) {
      console.error('💥 [INNGEST] Gatherer Agent: Failed', {
        workflowId: workflowId.substring(0, 15) + '...',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }
);

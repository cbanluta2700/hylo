/**
 * Architect Agent Function
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - XAI Grok for complex reasoning and trip structure planning
 * - Type-safe development
 *
 * Following architecture structure from migration plan
 */

import { inngest } from '../client.js';
import { architectAgent as architectAgentImpl } from '../../../src/lib/ai-agents/architect-agent.js';

/**
 * Individual Architect Agent Function
 * Can be invoked directly or as part of the main workflow
 */
export const architectAgent = inngest.createFunction(
  {
    id: 'architect-agent',
    name: 'Itinerary Architect Agent',
    retries: 2,
  },
  { event: 'agent/architect/start' },
  async ({ event, step }) => {
    const { workflowId, formData } = event.data;

    console.log('🏗️ [INNGEST] Architect Agent: Starting trip architecture planning', {
      workflowId: workflowId.substring(0, 15) + '...',
      location: formData.location,
    });

    try {
      const architecture = await step.run('generate-architecture', async () => {
        return await architectAgentImpl.generateArchitecture({
          workflowId,
          formData,
        });
      });

      // Send completion event
      await step.sendEvent('architect-complete', {
        name: 'agent/architect/complete',
        data: {
          workflowId,
          structure: architecture,
        },
      });

      console.log('✅ [INNGEST] Architect Agent: Trip architecture completed');

      return {
        workflowId,
        agent: 'architect',
        status: 'completed',
        structure: architecture,
      };
    } catch (error) {
      console.error('💥 [INNGEST] Architect Agent: Failed', {
        workflowId: workflowId.substring(0, 15) + '...',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }
);

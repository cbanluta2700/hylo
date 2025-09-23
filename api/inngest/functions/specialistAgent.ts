/**
 * Specialist Agent Function
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - XAI Grok for intelligent filtering and ranking
 * - Type-safe development
 *
 * Following architecture structure from migration plan
 */

import { inngest } from '../client.js';
import { filterRecommendations } from '../../../src/lib/ai-clients/hylo-ai-clients.js';

/**
 * Individual Specialist Agent Function
 * Filters and ranks recommendations based on user preferences
 */
export const specialistAgent = inngest.createFunction(
  {
    id: 'specialist-agent',
    name: 'Information Specialist Agent',
    retries: 2,
  },
  { event: 'agent/specialist/start' },
  async ({ event, step }) => {
    const { workflowId, gatheredData, preferences } = event.data;

    console.log('👨‍💼 [INNGEST] Specialist Agent: Starting recommendation filtering', {
      workflowId: workflowId.substring(0, 15) + '...',
      preferencesCount: preferences?.length || 0,
    });

    try {
      const filteredRecommendations = await step.run('filter-recommendations', async () => {
        // Mock recommendations for Phase 1
        const mockRecommendations = [
          { name: 'Central Park', type: 'attraction', rating: 4.8, category: 'outdoor' },
          { name: 'Metropolitan Museum', type: 'museum', rating: 4.7, category: 'culture' },
          { name: 'Brooklyn Bridge', type: 'landmark', rating: 4.6, category: 'sightseeing' },
          { name: 'High Line', type: 'park', rating: 4.5, category: 'outdoor' },
        ];

        return await filterRecommendations(mockRecommendations, preferences || []);
      });

      // Send completion event
      await step.sendEvent('specialist-complete', {
        name: 'agent/specialist/complete',
        data: {
          workflowId,
          recommendations: filteredRecommendations,
        },
      });

      console.log('✅ [INNGEST] Specialist Agent: Recommendation filtering completed');

      return {
        workflowId,
        agent: 'specialist',
        status: 'completed',
        recommendations: filteredRecommendations,
      };
    } catch (error) {
      console.error('💥 [INNGEST] Specialist Agent: Failed', {
        workflowId: workflowId.substring(0, 15) + '...',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }
);

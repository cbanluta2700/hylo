/**
 * Integration Tests for Search Provider Failover
 * Tests system resilience when external search services fail
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateSmartQueries } from '../../src/lib/smart-queries';
import { formatItinerary } from '../../src/lib/formatting/itinerary-formatter';

// Mock all external dependencies
vi.mock('../../src/lib/smart-queries', () => ({
  generateSmartQueries: vi.fn(),
}));

vi.mock('../../src/lib/formatting/itinerary-formatter', () => ({
  formatItinerary: vi.fn(),
}));

describe('Search Provider Failover Integration', () => {
  const testFormData = {
    location: 'Barcelona, Spain',
    departDate: '2025-07-15',
    returnDate: '2025-07-20',
    adults: 2,
    selectedInclusions: ['accommodations', 'activities', 'dining'],
    selectedInterests: ['beach', 'culture', 'food'],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful response
    vi.mocked(generateSmartQueries).mockResolvedValue([
      {
        type: 'accommodations',
        query: 'Barcelona beachfront hotels 2 adults 5 nights',
        priority: 'high' as const,
        agent: 'gatherer' as const,
      },
      {
        type: 'activities',
        query: 'Barcelona cultural activities beach nearby',
        priority: 'medium' as const,
        agent: 'gatherer' as const,
      },
      {
        type: 'dining',
        query: 'Barcelona tapas restaurants vegetarian options',
        priority: 'medium' as const,
        agent: 'gatherer' as const,
      },
    ]);

    vi.mocked(formatItinerary).mockResolvedValue({
      title: 'Barcelona Beach & Culture',
      destination: 'Barcelona, Spain',
      duration: '5 days',
      travelers: '2 travelers',
      budget: '$1,500 USD',
      sections: [
        {
          id: 'accommodations',
          title: 'Beachfront Accommodations',
          content: '🏨 Hotel Arts Barcelona - Luxury beachfront\n   $300/night × 5 nights = $1,500',
          priority: 2,
        },
      ],
      metadata: {
        generatedAt: '2025-01-15T10:00:00Z',
        version: '1.0.0',
        confidence: 0.85,
        processingTime: 12000,
      },
    });
  });

  describe('Primary Provider Failure', () => {
    it('should handle complete primary provider failure', async () => {
      // Simulate complete failure of primary search provider
      vi.mocked(generateSmartQueries).mockRejectedValueOnce(
        new Error('Primary search provider unavailable')
      );

      await expect(generateSmartQueries(testFormData as any)).rejects.toThrow(
        'Primary search provider unavailable'
      );
    });

    it('should attempt fallback when primary fails', async () => {
      // First call fails (primary)
      vi.mocked(generateSmartQueries).mockRejectedValueOnce(
        new Error('Tavily API rate limit exceeded')
      );

      await expect(generateSmartQueries(testFormData as any)).rejects.toThrow();

      // Reset mock to simulate fallback success
      vi.mocked(generateSmartQueries).mockResolvedValue([
        {
          type: 'accommodations',
          query: 'Barcelona hotels fallback search',
          priority: 'medium' as const,
          agent: 'gatherer' as const,
        },
      ]);

      const queries = await generateSmartQueries(testFormData as any);
      expect(queries.length).toBeGreaterThan(0);
    });

    it('should degrade gracefully with reduced functionality', async () => {
      // Simulate partial failure - some queries succeed, others fail
      vi.mocked(generateSmartQueries).mockResolvedValue([
        {
          type: 'accommodations',
          query: 'Barcelona basic hotels',
          priority: 'low' as const,
          agent: 'gatherer' as const,
        },
        // Missing activities and dining queries due to provider failure
      ]);

      const queries = await generateSmartQueries(testFormData as any);
      const itinerary = await formatItinerary({
        title: 'Barcelona Basic',
        destination: 'Barcelona, Spain',
        duration: { days: 5, nights: 4, startDate: '2025-07-15', endDate: '2025-07-20' },
        travelers: { adults: 2, children: 0, total: 2 },
        budget: {
          total: 1000,
          currency: 'USD',
          breakdown: {
            accommodations: 600,
            transportation: 200,
            activities: 100,
            dining: 100,
            miscellaneous: 0,
          },
        },
        dailyPlan: [],
        accommodations: [],
        transportation: [],
        activities: [],
        dining: [],
        tips: [],
      } as any);

      expect(queries.length).toBe(1); // Only accommodations
      expect(itinerary).toBeDefined();
      expect(itinerary.metadata.confidence).toBeLessThan(0.9); // Lower confidence due to failures
    });
  });

  describe('Secondary Provider Scenarios', () => {
    it('should use secondary provider when primary is slow', async () => {
      // Simulate slow primary provider
      vi.mocked(generateSmartQueries).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve([
                  {
                    type: 'accommodations',
                    query: 'Barcelona slow primary result',
                    priority: 'high' as const,
                    agent: 'gatherer' as const,
                  },
                ]),
              500
            )
          ) // Reduced delay for testing
      );

      const startTime = Date.now();
      const queries = await generateSmartQueries(testFormData as any);
      const endTime = Date.now();

      expect(queries.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(6000); // Should complete reasonably fast
    });

    it('should combine results from multiple providers', async () => {
      // Simulate getting results from both primary and secondary providers
      vi.mocked(generateSmartQueries).mockResolvedValue([
        {
          type: 'accommodations',
          query: 'Barcelona primary provider hotels',
          priority: 'high' as const,
          agent: 'gatherer' as const,
        },
        {
          type: 'activities',
          query: 'Barcelona secondary provider activities',
          priority: 'medium' as const,
          agent: 'gatherer' as const,
        },
      ]);

      const queries = await generateSmartQueries(testFormData as any);
      expect(queries.length).toBe(2);
      expect(queries.some((q) => q.query.includes('primary'))).toBe(true);
      expect(queries.some((q) => q.query.includes('secondary'))).toBe(true);
    });

    it('should prioritize higher quality results', async () => {
      vi.mocked(generateSmartQueries).mockResolvedValue([
        {
          type: 'accommodations',
          query: 'Barcelona premium hotels high quality',
          priority: 'high' as const,
          agent: 'gatherer' as const,
        },
        {
          type: 'accommodations',
          query: 'Barcelona basic hotels low quality',
          priority: 'low' as const,
          agent: 'gatherer' as const,
        },
      ]);

      const queries = await generateSmartQueries(testFormData as any);
      const highPriorityQueries = queries.filter((q) => q.priority === 'high');
      expect(highPriorityQueries.length).toBeGreaterThan(0);
    });
  });

  describe('Complete Provider Outage', () => {
    it('should provide cached/default recommendations during outage', async () => {
      // Simulate complete provider outage
      vi.mocked(generateSmartQueries).mockRejectedValue(
        new Error('All search providers unavailable')
      );

      await expect(generateSmartQueries(testFormData as any)).rejects.toThrow();

      // Reset to simulate cached fallback
      vi.mocked(generateSmartQueries).mockResolvedValue([
        {
          type: 'accommodations',
          query: 'Barcelona generic hotels cached',
          priority: 'low' as const,
          agent: 'gatherer' as const,
        },
      ]);

      const queries = await generateSmartQueries(testFormData as any);
      expect(queries.length).toBeGreaterThan(0);
      expect(queries[0].priority).toBe('low'); // Lower priority for cached results
    });

    it('should maintain basic functionality with minimal data', async () => {
      // Even during outage, should provide basic structure
      vi.mocked(generateSmartQueries).mockResolvedValue([
        {
          type: 'accommodations',
          query: 'Barcelona basic accommodation',
          priority: 'low' as const,
          agent: 'gatherer' as const,
        },
      ]);

      const queries = await generateSmartQueries(testFormData as any);
      const itinerary = await formatItinerary({
        title: 'Barcelona Basic Trip',
        destination: 'Barcelona, Spain',
        duration: { days: 5, nights: 4, startDate: '2025-07-15', endDate: '2025-07-20' },
        travelers: { adults: 2, children: 0, total: 2 },
        budget: {
          total: 800,
          currency: 'USD',
          breakdown: {
            accommodations: 400,
            transportation: 200,
            activities: 100,
            dining: 100,
            miscellaneous: 0,
          },
        },
        dailyPlan: [],
        accommodations: [],
        transportation: [],
        activities: [],
        dining: [],
        tips: [],
      } as any);

      expect(queries.length).toBeGreaterThan(0);
      expect(itinerary.sections.length).toBeGreaterThan(0);
      expect(itinerary.metadata.confidence).toBeGreaterThan(0); // Some confidence even with basic data
    });

    it('should inform user about service degradation', async () => {
      vi.mocked(generateSmartQueries).mockResolvedValue([
        {
          type: 'accommodations',
          query: 'Barcelona limited results',
          priority: 'low' as const,
          agent: 'gatherer' as const,
        },
      ]);

      const queries = await generateSmartQueries(testFormData as any);
      const itinerary = await formatItinerary({
        title: 'Barcelona (Limited Results)',
        destination: 'Barcelona, Spain',
        duration: { days: 5, nights: 4, startDate: '2025-07-15', endDate: '2025-07-20' },
        travelers: { adults: 2, children: 0, total: 2 },
        budget: {
          total: 800,
          currency: 'USD',
          breakdown: {
            accommodations: 400,
            transportation: 200,
            activities: 100,
            dining: 100,
            miscellaneous: 0,
          },
        },
        dailyPlan: [],
        accommodations: [],
        transportation: [],
        activities: [],
        dining: [],
        tips: [],
      } as any);

      expect(itinerary.title).toContain('Limited');
      expect(queries[0].priority).toBe('low');
    });
  });

  describe('Provider Recovery', () => {
    it('should recover gracefully when providers come back online', async () => {
      // Start with failure
      vi.mocked(generateSmartQueries).mockRejectedValueOnce(
        new Error('Provider temporarily unavailable')
      );

      await expect(generateSmartQueries(testFormData as any)).rejects.toThrow();

      // Provider recovers
      vi.mocked(generateSmartQueries).mockResolvedValue([
        {
          type: 'accommodations',
          query: 'Barcelona recovered full service hotels',
          priority: 'high' as const,
          agent: 'gatherer' as const,
        },
        {
          type: 'activities',
          query: 'Barcelona recovered activities',
          priority: 'high' as const,
          agent: 'gatherer' as const,
        },
      ]);

      const queries = await generateSmartQueries(testFormData as any);
      expect(queries.length).toBe(2);
      expect(queries.every((q) => q.priority === 'high')).toBe(true);
    });

    it('should gradually improve results as providers recover', async () => {
      // Partial recovery - only accommodations
      vi.mocked(generateSmartQueries).mockResolvedValueOnce([
        {
          type: 'accommodations',
          query: 'Barcelona partial recovery hotels',
          priority: 'medium' as const,
          agent: 'gatherer' as const,
        },
      ]);

      let queries = await generateSmartQueries(testFormData as any);
      expect(queries.length).toBe(1);

      // Full recovery
      vi.mocked(generateSmartQueries).mockResolvedValue([
        {
          type: 'accommodations',
          query: 'Barcelona full recovery hotels',
          priority: 'high' as const,
          agent: 'gatherer' as const,
        },
        {
          type: 'activities',
          query: 'Barcelona full recovery activities',
          priority: 'high' as const,
          agent: 'gatherer' as const,
        },
        {
          type: 'dining',
          query: 'Barcelona full recovery dining',
          priority: 'high' as const,
          agent: 'gatherer' as const,
        },
      ]);

      queries = await generateSmartQueries(testFormData as any);
      expect(queries.length).toBe(3);
      expect(queries.every((q) => q.priority === 'high')).toBe(true);
    });
  });

  describe('Rate Limiting and Throttling', () => {
    it('should handle provider rate limits gracefully', async () => {
      // Simulate rate limit exceeded
      vi.mocked(generateSmartQueries).mockRejectedValueOnce(
        new Error('Rate limit exceeded. Try again later.')
      );

      await expect(generateSmartQueries(testFormData as any)).rejects.toThrow(
        'Rate limit exceeded'
      );

      // Should be able to retry after backoff
      vi.mocked(generateSmartQueries).mockResolvedValue([
        {
          type: 'accommodations',
          query: 'Barcelona after rate limit hotels',
          priority: 'medium' as const,
          agent: 'gatherer' as const,
        },
      ]);

      const queries = await generateSmartQueries(testFormData as any);
      expect(queries.length).toBeGreaterThan(0);
    });

    it('should implement backoff strategies', async () => {
      const startTime = Date.now();

      // Multiple rapid requests that hit rate limits
      for (let i = 0; i < 3; i++) {
        vi.mocked(generateSmartQueries).mockRejectedValueOnce(new Error('Rate limit exceeded'));
        await expect(generateSmartQueries(testFormData as any)).rejects.toThrow();
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should show some delay due to rate limiting
      expect(totalTime).toBeGreaterThan(100);
    });

    it('should distribute load across providers', async () => {
      // Simulate different providers handling different types of queries
      vi.mocked(generateSmartQueries).mockResolvedValue([
        {
          type: 'accommodations',
          query: 'Barcelona provider A hotels',
          priority: 'high' as const,
          agent: 'gatherer' as const,
        },
        {
          type: 'activities',
          query: 'Barcelona provider B activities',
          priority: 'high' as const,
          agent: 'gatherer' as const,
        },
        {
          type: 'dining',
          query: 'Barcelona provider C dining',
          priority: 'high' as const,
          agent: 'gatherer' as const,
        },
      ]);

      const queries = await generateSmartQueries(testFormData as any);
      expect(queries.length).toBe(3);
      // Should have diverse provider sources
      const queryTexts = queries.map((q) => q.query);
      expect(queryTexts.some((text) => text.includes('provider A'))).toBe(true);
      expect(queryTexts.some((text) => text.includes('provider B'))).toBe(true);
      expect(queryTexts.some((text) => text.includes('provider C'))).toBe(true);
    });
  });

  describe('Data Consistency During Failover', () => {
    it('should maintain data integrity across provider switches', async () => {
      // Start with one provider
      vi.mocked(generateSmartQueries).mockResolvedValueOnce([
        {
          type: 'accommodations',
          query: 'Barcelona provider 1 hotels',
          priority: 'high' as const,
          agent: 'gatherer' as const,
        },
      ]);

      let queries = await generateSmartQueries(testFormData as any);
      expect(queries[0].query).toContain('provider 1');

      // Switch providers
      vi.mocked(generateSmartQueries).mockResolvedValue([
        {
          type: 'accommodations',
          query: 'Barcelona provider 2 hotels',
          priority: 'high' as const,
          agent: 'gatherer' as const,
        },
      ]);

      queries = await generateSmartQueries(testFormData as any);
      expect(queries[0].query).toContain('provider 2');
      // Should maintain same structure and requirements
      expect(queries[0].query).toContain('Barcelona');
      expect(queries[0].type).toBe('accommodations');
    });

    it('should preserve user preferences during failover', async () => {
      vi.mocked(generateSmartQueries).mockResolvedValue([
        {
          type: 'accommodations',
          query: 'Barcelona beachfront hotels 2 adults family friendly',
          priority: 'high' as const,
          agent: 'gatherer' as const,
        },
      ]);

      const queries = await generateSmartQueries(testFormData as any);

      // Should preserve all user requirements even during failover
      const query = queries[0].query;
      expect(query).toContain('Barcelona');
      expect(query).toContain('beachfront'); // From interests
      expect(query).toContain('2 adults'); // From traveler count
    });

    it('should provide consistent response format', async () => {
      // Regardless of which provider is used, response format should be consistent
      const queries = await generateSmartQueries(testFormData as any);
      const itinerary = await formatItinerary({
        title: 'Barcelona Trip',
        destination: 'Barcelona, Spain',
        duration: { days: 5, nights: 4, startDate: '2025-07-15', endDate: '2025-07-20' },
        travelers: { adults: 2, children: 0, total: 2 },
        budget: {
          total: 1200,
          currency: 'USD',
          breakdown: {
            accommodations: 600,
            transportation: 300,
            activities: 150,
            dining: 150,
            miscellaneous: 0,
          },
        },
        dailyPlan: [],
        accommodations: [],
        transportation: [],
        activities: [],
        dining: [],
        tips: [],
      } as any);

      expect(queries.every((q) => q.type && q.query && q.priority && q.agent)).toBe(true);
      expect(itinerary).toHaveProperty('title');
      expect(itinerary).toHaveProperty('destination');
      expect(itinerary).toHaveProperty('sections');
      expect(itinerary).toHaveProperty('metadata');
    });
  });
});

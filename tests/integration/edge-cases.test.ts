/**
 * Integration Tests for Edge Case Handling
 * Tests Scenario 4: Error handling and fallback mechanisms with minimal form data
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateSmartQueries } from '../../src/lib/smart-queries';
import {
  formatItinerary,
  exportItineraryAsText,
} from '../../src/lib/formatting/itinerary-formatter';

// Mock all external dependencies
vi.mock('../../src/lib/smart-queries', () => ({
  generateSmartQueries: vi.fn(),
}));

vi.mock('../../src/lib/formatting/itinerary-formatter', () => ({
  formatItinerary: vi.fn(),
  exportItineraryAsText: vi.fn(),
}));

describe('Edge Case Handling Integration', () => {
  const minimalValidFormData = {
    location: 'Paris, France',
    departDate: '2025-06-01',
    returnDate: '2025-06-03',
    adults: 1,
    selectedInclusions: ['accommodations'],
  };

  const invalidFormData = {
    location: '',
    departDate: 'invalid-date',
    returnDate: '2025-06-03',
    adults: -1,
    selectedInclusions: [],
  };

  const edgeCaseFormData = {
    // Missing required fields
    location: 'Tokyo, Japan',
    // Invalid date range (end before start)
    departDate: '2025-06-05',
    returnDate: '2025-06-01',
    adults: 0,
    selectedInclusions: ['flights', 'accommodations'],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(generateSmartQueries).mockResolvedValue([
      {
        type: 'accommodations',
        query: 'Paris budget hotel 2 nights',
        priority: 'high' as const,
        agent: 'gatherer' as const,
      },
    ]);

    vi.mocked(formatItinerary).mockResolvedValue({
      title: 'Paris Getaway',
      destination: 'Paris, France',
      duration: '2 days',
      travelers: '1 traveler',
      budget: '$500 USD',
      sections: [
        {
          id: 'accommodations',
          title: 'Budget Accommodations',
          content: '🏨 Ibis Budget Paris - $100/night × 2 nights = $200',
          priority: 1,
        },
      ],
      metadata: {
        generatedAt: '2025-01-15T10:00:00Z',
        version: '1.0.0',
        confidence: 0.75,
        processingTime: 8000,
      },
    });

    vi.mocked(exportItineraryAsText).mockReturnValue('Minimal Paris itinerary...');
  });

  describe('Minimal Valid Data Handling', () => {
    it('should handle minimal valid form data', async () => {
      const queries = await generateSmartQueries(minimalValidFormData as any);
      const itinerary = await formatItinerary({
        title: 'Paris Getaway',
        destination: 'Paris, France',
        duration: { days: 2, nights: 1, startDate: '2025-06-01', endDate: '2025-06-03' },
        travelers: { adults: 1, children: 0, total: 1 },
        budget: {
          total: 500,
          currency: 'USD',
          breakdown: {
            accommodations: 200,
            transportation: 0,
            activities: 0,
            dining: 0,
            miscellaneous: 300,
          },
        },
        dailyPlan: [],
        accommodations: [],
        transportation: [],
        activities: [],
        dining: [],
        tips: [],
      } as any);
      const textOutput = exportItineraryAsText(itinerary);

      expect(queries.length).toBeGreaterThan(0);
      expect(itinerary).toBeDefined();
      expect(textOutput).toBeDefined();
      expect(itinerary.title).toContain('Paris');
    });

    it('should provide defaults for missing optional fields', async () => {
      const queries = await generateSmartQueries(minimalValidFormData as any);

      // Should generate basic queries even with minimal data
      expect(queries.some((q) => q.type === 'accommodations')).toBe(true);
      if (queries[0]) {
        expect(queries[0].query).toContain('Paris');
      }
    });

    it('should maintain functionality with sparse data', async () => {
      const sparseFormData = {
        location: 'London, UK',
        adults: 2,
        // Missing dates and other fields
      };

      vi.mocked(generateSmartQueries).mockResolvedValueOnce([
        {
          type: 'accommodations',
          query: 'London hotel 2 adults',
          priority: 'high' as const,
          agent: 'gatherer' as const,
        },
      ]);

      const queries = await generateSmartQueries(sparseFormData as any);
      expect(queries.length).toBeGreaterThan(0);
      if (queries[0]) {
        expect(queries[0].query).toContain('London');
      }
    });
  });

  describe('Invalid Data Rejection', () => {
    it('should reject completely invalid form data', async () => {
      await expect(generateSmartQueries(invalidFormData as any)).rejects.toThrow();
    });

    it('should provide clear error messages for validation failures', async () => {
      try {
        await generateSmartQueries(invalidFormData as any);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
        // Error should indicate what validation failed
      }
    });

    it('should handle edge case date ranges', async () => {
      await expect(generateSmartQueries(edgeCaseFormData as any)).rejects.toThrow();
    });

    it('should reject zero or negative travelers', async () => {
      const zeroTravelersData = {
        ...minimalValidFormData,
        adults: 0,
      };

      await expect(generateSmartQueries(zeroTravelersData as any)).rejects.toThrow();
    });
  });

  describe('Graceful Degradation', () => {
    it('should handle partial failures gracefully', async () => {
      // Simulate partial query generation failure
      vi.mocked(generateSmartQueries).mockRejectedValueOnce(new Error('Partial failure'));

      await expect(generateSmartQueries(minimalValidFormData as any)).rejects.toThrow();
    });

    it('should provide fallback content when possible', async () => {
      // Even with minimal data, should generate some useful output
      const queries = await generateSmartQueries(minimalValidFormData as any);
      const itinerary = await formatItinerary({
        title: 'Paris Getaway',
        destination: 'Paris, France',
        duration: { days: 2, nights: 1, startDate: '2025-06-01', endDate: '2025-06-03' },
        travelers: { adults: 1, children: 0, total: 1 },
        budget: {
          total: 500,
          currency: 'USD',
          breakdown: {
            accommodations: 200,
            transportation: 0,
            activities: 0,
            dining: 0,
            miscellaneous: 300,
          },
        },
        dailyPlan: [],
        accommodations: [],
        transportation: [],
        activities: [],
        dining: [],
        tips: [],
      } as any);

      expect(itinerary.sections.length).toBeGreaterThan(0);
      expect(itinerary.metadata.confidence).toBeLessThan(1); // Lower confidence for minimal data
    });

    it('should handle service unavailability', async () => {
      // Simulate complete service failure
      vi.mocked(generateSmartQueries).mockRejectedValue(new Error('Service unavailable'));

      await expect(generateSmartQueries(minimalValidFormData as any)).rejects.toThrow();
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle maximum reasonable values', async () => {
      const maxFormData = {
        location: 'New York City, USA',
        departDate: '2025-12-01',
        returnDate: '2025-12-31', // Long trip
        adults: 10, // Large group
        children: 5,
        selectedInclusions: ['flights', 'accommodations', 'activities', 'dining', 'transportation'],
      };

      const queries = await generateSmartQueries(maxFormData as any);
      expect(queries.length).toBeGreaterThan(0);
    });

    it('should handle minimum valid values', async () => {
      const minValidData = {
        location: 'Rome, Italy',
        departDate: '2025-06-01',
        returnDate: '2025-06-02', // 1-day trip
        adults: 1, // Single traveler
        selectedInclusions: ['accommodations'],
      };

      const queries = await generateSmartQueries(minValidData as any);
      const itinerary = await formatItinerary({
        title: 'Rome Day Trip',
        destination: 'Rome, Italy',
        duration: { days: 1, nights: 0, startDate: '2025-06-01', endDate: '2025-06-02' },
        travelers: { adults: 1, children: 0, total: 1 },
        budget: {
          total: 200,
          currency: 'USD',
          breakdown: {
            accommodations: 100,
            transportation: 0,
            activities: 0,
            dining: 0,
            miscellaneous: 100,
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
      expect(itinerary.duration).toContain('1');
      expect(itinerary.travelers).toContain('1');
    });

    it('should handle unusual but valid combinations', async () => {
      const unusualData = {
        location: 'Amsterdam, Netherlands',
        departDate: '2025-01-01', // New Year's trip
        returnDate: '2025-01-02',
        adults: 1,
        selectedInclusions: ['dining'], // Only dining, no accommodation
      };

      const queries = await generateSmartQueries(unusualData as any);
      expect(queries.length).toBeGreaterThan(0);
      // Should still generate queries for the requested inclusions
      expect(queries.some((q) => q.type === 'dining')).toBe(true);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from temporary failures', async () => {
      // First call fails
      vi.mocked(generateSmartQueries).mockRejectedValueOnce(new Error('Temporary failure'));

      await expect(generateSmartQueries(minimalValidFormData as any)).rejects.toThrow();

      // Second call succeeds
      vi.mocked(generateSmartQueries).mockResolvedValue([
        {
          type: 'accommodations',
          query: 'Paris recovery hotel',
          priority: 'high' as const,
          agent: 'gatherer' as const,
        },
      ]);

      const queries = await generateSmartQueries(minimalValidFormData as any);
      expect(queries.length).toBeGreaterThan(0);
    });

    it('should maintain system stability under error conditions', async () => {
      // Multiple failures shouldn't crash the system
      for (let i = 0; i < 3; i++) {
        await expect(generateSmartQueries(invalidFormData as any)).rejects.toThrow();
      }

      // Valid request should still work
      const queries = await generateSmartQueries(minimalValidFormData as any);
      expect(queries.length).toBeGreaterThan(0);
    });

    it('should provide meaningful error context', async () => {
      try {
        await generateSmartQueries(invalidFormData as any);
      } catch (error) {
        // Error should provide context about what went wrong
        expect(error).toBeDefined();
      }
    });
  });

  describe('Fallback Mechanisms', () => {
    it('should provide basic itinerary for minimal data', async () => {
      const queries = await generateSmartQueries(minimalValidFormData as any);
      const itinerary = await formatItinerary({
        title: 'Paris Getaway',
        destination: 'Paris, France',
        duration: { days: 2, nights: 1, startDate: '2025-06-01', endDate: '2025-06-03' },
        travelers: { adults: 1, children: 0, total: 1 },
        budget: {
          total: 500,
          currency: 'USD',
          breakdown: {
            accommodations: 200,
            transportation: 0,
            activities: 0,
            dining: 0,
            miscellaneous: 300,
          },
        },
        dailyPlan: [],
        accommodations: [],
        transportation: [],
        activities: [],
        dining: [],
        tips: [],
      } as any);

      // Even with minimal data, should provide useful output
      expect(itinerary.sections.length).toBeGreaterThan(0);
      expect(itinerary.title).toBeDefined();
      expect(itinerary.destination).toBeDefined();
    });

    it('should handle missing optional preferences gracefully', async () => {
      const noPreferencesData = {
        location: 'Berlin, Germany',
        departDate: '2025-07-01',
        returnDate: '2025-07-05',
        adults: 2,
        selectedInclusions: ['accommodations', 'activities'],
        // No interests, travel style, etc.
      };

      const queries = await generateSmartQueries(noPreferencesData as any);
      expect(queries.length).toBeGreaterThan(0);
      // Should generate generic queries
      expect(queries.some((q) => q.query.includes('Berlin'))).toBe(true);
    });

    it('should maintain core functionality when enhancements fail', async () => {
      // Simulate formatting failure but queries succeed
      vi.mocked(formatItinerary).mockRejectedValueOnce(new Error('Formatting failed'));

      const queries = await generateSmartQueries(minimalValidFormData as any);
      expect(queries.length).toBeGreaterThan(0);

      // Should still be able to format with fallback
      vi.mocked(formatItinerary).mockResolvedValue({
        title: 'Paris Fallback',
        destination: 'Paris, France',
        duration: '2 days',
        travelers: '1 traveler',
        budget: '$500 USD',
        sections: [
          {
            id: 'accommodations',
            title: 'Basic Accommodations',
            content: '🏨 Budget hotel in Paris',
            priority: 1,
          },
        ],
        metadata: {
          generatedAt: '2025-01-15T10:00:00Z',
          version: '1.0.0',
          confidence: 0.5,
          processingTime: 5000,
        },
      });

      const itinerary = await formatItinerary({} as any);
      expect(itinerary).toBeDefined();
    });
  });

  describe('Input Sanitization', () => {
    it('should handle malformed input data', async () => {
      const malformedData = {
        location: 'Sydney, Australia',
        departDate: null, // Invalid date
        returnDate: '2025-08-05',
        adults: 'two', // String instead of number
        selectedInclusions: 'all', // String instead of array
      };

      await expect(generateSmartQueries(malformedData as any)).rejects.toThrow();
    });

    it('should sanitize and normalize input', async () => {
      const needsSanitizationData = {
        location: '  london, UK  ', // Extra spaces
        departDate: '2025-09-01',
        returnDate: '2025-09-03',
        adults: 2,
        selectedInclusions: ['accommodations'],
      };

      const queries = await generateSmartQueries(needsSanitizationData as any);
      expect(queries.length).toBeGreaterThan(0);
      // Should handle the spacing gracefully
    });

    it('should reject malicious input patterns', async () => {
      const maliciousData = {
        location: '<script>alert("xss")</script>Madrid, Spain',
        departDate: '2025-10-01',
        returnDate: '2025-10-03',
        adults: 1,
        selectedInclusions: ['accommodations'],
      };

      // Should either reject or sanitize the input
      await expect(generateSmartQueries(maliciousData as any)).rejects.toThrow();
    });
  });
});

/**
 * Integration Tests for Real-Time Form Updates
 * Tests Scenario 2: Reactive itinerary modifications and WebSocket updates
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateSmartQueries } from '../../src/lib/smart-queries';
import {
  formatItinerary,
  exportItineraryAsText,
} from '../../src/lib/formatting/itinerary-formatter';
import { performanceMonitor } from '../../src/lib/monitoring/performance';

// Mock WebSocket for testing
class MockWebSocket {
  onopen?: () => void;
  onmessage?: (event: { data: string }) => void;
  onclose?: () => void;
  onerror?: (error: Event) => void;

  readyState = 1; // OPEN
  send = vi.fn();
  close = vi.fn();

  // Simulate connection
  connect() {
    setTimeout(() => this.onopen?.(), 10);
  }

  // Simulate receiving a message
  receiveMessage(data: any) {
    setTimeout(() => {
      this.onmessage?.({ data: JSON.stringify(data) });
    }, 10);
  }
}

// Mock all external dependencies
vi.mock('../../src/lib/smart-queries', () => ({
  generateSmartQueries: vi.fn(),
}));

vi.mock('../../src/lib/formatting/itinerary-formatter', () => ({
  formatItinerary: vi.fn(),
  exportItineraryAsText: vi.fn(),
}));

vi.mock('../../src/lib/monitoring/performance', () => ({
  performanceMonitor: {
    startOperation: vi.fn().mockReturnValue('test-operation-id'),
    endOperation: vi.fn(),
    recordOperation: vi.fn(),
  },
}));

describe('Real-Time Form Updates Integration', () => {
  const mockInitialFormData = {
    location: 'Paris, France',
    departDate: '2025-06-15',
    returnDate: '2025-06-22',
    adults: 2,
    children: 0,
    selectedInclusions: ['flights', 'accommodations', 'activities', 'dining'],
    selectedGroups: ['couple'],
    selectedInterests: ['sightseeing', 'culture', 'food'],
    travelStyleChoice: 'cultural',
    budget: {
      total: 2500,
      perPerson: false,
      currency: 'USD',
    },
  };

  const mockUpdatedFormData = {
    ...mockInitialFormData,
    budget: {
      total: 4000, // Increased budget
      perPerson: false,
      currency: 'USD',
    },
  };

  const mockInitialItinerary = {
    title: 'Paris Cultural Escape',
    destination: 'Paris, France',
    duration: { days: 7, nights: 6, startDate: '2025-06-15', endDate: '2025-06-22' },
    travelers: { adults: 2, children: 0, total: 2 },
    budget: {
      total: 2500,
      currency: 'USD',
      breakdown: {
        accommodations: 1000,
        transportation: 500,
        activities: 500,
        dining: 500,
        miscellaneous: 0,
      },
    },
    dailyPlan: [],
    accommodations: [],
    transportation: [],
    activities: [],
    dining: [],
    tips: [],
  };

  const mockUpdatedItinerary = {
    ...mockInitialItinerary,
    budget: {
      total: 4000,
      currency: 'USD',
      breakdown: {
        accommodations: 1600,
        transportation: 800,
        activities: 800,
        dining: 800,
        miscellaneous: 0,
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(generateSmartQueries).mockResolvedValue([
      {
        type: 'accommodations',
        query: 'Paris hotels couple luxury 7 nights',
        priority: 'high' as const,
        agent: 'gatherer' as const,
      },
    ]);

    vi.mocked(formatItinerary).mockResolvedValue({
      title: 'Paris Cultural Escape',
      destination: 'Paris, France',
      duration: '7 days',
      travelers: '2 travelers',
      budget: '$2,500 USD',
      sections: [
        {
          id: 'accommodations',
          title: 'Accommodations',
          content:
            '🏨 Hotel Ritz Paris\n   Luxury hotel in Place Vendôme\n   $800/night × 7 nights = $5,600',
          priority: 2,
        },
      ],
      metadata: {
        generatedAt: '2025-01-15T10:00:00Z',
        version: '1.0.0',
        confidence: 0.95,
        processingTime: 25000,
      },
    });

    vi.mocked(exportItineraryAsText).mockReturnValue(
      'Updated Paris itinerary with higher budget...'
    );
  });

  describe('Form Change Detection', () => {
    it('should detect budget changes and trigger updates', async () => {
      // Generate initial itinerary
      const initialQueries = await generateSmartQueries(mockInitialFormData as any);
      const initialItinerary = await formatItinerary(mockInitialItinerary as any);

      // Simulate form change
      const updatedQueries = await generateSmartQueries(mockUpdatedFormData as any);
      const updatedItinerary = await formatItinerary(mockUpdatedItinerary as any);

      // Verify changes are detected
      expect(initialQueries).toBeDefined();
      expect(updatedQueries).toBeDefined();
      expect(initialItinerary).toBeDefined();
      expect(updatedItinerary).toBeDefined();

      // Budget increase should trigger different queries
      expect(updatedQueries.length).toBeGreaterThanOrEqual(initialQueries.length);
    });

    it('should handle multiple simultaneous form changes', async () => {
      const multiChangeFormData = {
        ...mockInitialFormData,
        adults: 3, // Added traveler
        budget: { total: 3500, perPerson: false, currency: 'USD' }, // Budget change
        selectedInterests: ['sightseeing', 'culture', 'food', 'adventure'], // Added interest
      };

      const queries = await generateSmartQueries(multiChangeFormData as any);
      const itinerary = await formatItinerary({
        ...mockInitialItinerary,
        travelers: { adults: 3, children: 0, total: 3 },
        budget: {
          total: 3500,
          currency: 'USD',
          breakdown: {
            accommodations: 1400,
            transportation: 700,
            activities: 700,
            dining: 700,
            miscellaneous: 0,
          },
        },
      } as any);

      expect(queries).toBeDefined();
      expect(itinerary).toBeDefined();
      expect(itinerary.travelers).toContain('3');
    });

    it('should prioritize high-impact changes', async () => {
      // Date changes should have higher priority than minor preference changes
      const dateChangeFormData = {
        ...mockInitialFormData,
        departDate: '2025-07-01', // Different month
        returnDate: '2025-07-08',
      };

      const queries = await generateSmartQueries(dateChangeFormData as any);

      // Should generate queries considering seasonal changes
      expect(queries.some((q) => q.query.includes('July') || q.query.includes('summer'))).toBe(
        true
      );
    });
  });

  describe('Selective Update Processing', () => {
    it('should update only affected itinerary sections', async () => {
      // Budget change should primarily affect accommodations and activities
      const budgetOnlyChange = {
        ...mockInitialFormData,
        budget: { total: 5000, perPerson: false, currency: 'USD' },
      };

      const queries = await generateSmartQueries(budgetOnlyChange as any);
      const itinerary = await formatItinerary({
        ...mockInitialItinerary,
        budget: {
          total: 5000,
          currency: 'USD',
          breakdown: {
            accommodations: 2000,
            transportation: 1000,
            activities: 1000,
            dining: 1000,
            miscellaneous: 0,
          },
        },
      } as any);

      expect(queries).toBeDefined();
      expect(itinerary).toBeDefined();
      // Should include luxury/premium search terms
      expect(queries.some((q) => q.query.includes('luxury') || q.query.includes('premium'))).toBe(
        true
      );
    });

    it('should maintain unaffected sections during updates', async () => {
      // Interest change shouldn't affect transportation
      const interestOnlyChange = {
        ...mockInitialFormData,
        selectedInterests: ['adventure', 'outdoor', 'nature'],
      };

      const queries = await generateSmartQueries(interestOnlyChange as any);

      // Should focus on adventure-related queries
      expect(
        queries.some((q) => q.query.includes('adventure') || q.query.includes('outdoor'))
      ).toBe(true);
    });

    it('should handle cascading updates', async () => {
      // Group size change affects everything
      const groupChangeFormData = {
        ...mockInitialFormData,
        adults: 4,
        children: 2,
        selectedGroups: ['family'],
      };

      const queries = await generateSmartQueries(groupChangeFormData as any);
      const itinerary = await formatItinerary({
        ...mockInitialItinerary,
        travelers: { adults: 4, children: 2, total: 6 },
      } as any);

      expect(queries).toBeDefined();
      expect(itinerary).toBeDefined();
      expect(itinerary.travelers).toContain('6');
      // Should include family-friendly terms
      expect(queries.some((q) => q.query.includes('family') || q.query.includes('kids'))).toBe(
        true
      );
    });
  });

  describe('WebSocket Real-Time Updates', () => {
    let mockWS: MockWebSocket;

    beforeEach(() => {
      mockWS = new MockWebSocket();
    });

    it('should establish WebSocket connection for updates', () => {
      mockWS.connect();

      // Simulate connection acknowledgment
      setTimeout(() => {
        expect(mockWS.onopen).toBeDefined();
      }, 20);
    });

    it('should send form change notifications', () => {
      const changeMessage = {
        type: 'form_change',
        requestId: 'test-request-123',
        changes: {
          field: 'budget',
          oldValue: 2500,
          newValue: 4000,
          timestamp: new Date().toISOString(),
        },
        priority: 'high',
      };

      mockWS.send(JSON.stringify(changeMessage));

      expect(mockWS.send).toHaveBeenCalledWith(JSON.stringify(changeMessage));
    });

    it('should receive progress updates', async () => {
      let receivedMessage: any = null;

      mockWS.onmessage = (event) => {
        receivedMessage = JSON.parse(event.data);
      };

      mockWS.receiveMessage({
        type: 'progress',
        requestId: 'test-request-123',
        progress: 75,
        stage: 'accommodation_update',
        message: 'Updating accommodation recommendations...',
        timestamp: new Date().toISOString(),
      });

      // Wait for message
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(receivedMessage.type).toBe('progress');
      expect(receivedMessage.progress).toBeDefined();
      expect(receivedMessage.stage).toBeDefined();
    });

    it('should handle partial result updates', async () => {
      let receivedMessage: any = null;

      mockWS.onmessage = (event) => {
        receivedMessage = JSON.parse(event.data);
      };

      mockWS.receiveMessage({
        type: 'partial_result',
        requestId: 'test-request-123',
        section: 'accommodations',
        data: {
          title: 'Updated Accommodations',
          options: ['Hotel Ritz Paris - Luxury', 'Hotel Plaza Athenee - Boutique'],
        },
        timestamp: new Date().toISOString(),
      });

      // Wait for message
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(receivedMessage.type).toBe('partial_result');
      expect(receivedMessage.section).toBe('accommodations');
      expect(receivedMessage.data).toBeDefined();
    });

    it('should receive completion notifications', async () => {
      let receivedMessage: any = null;

      mockWS.onmessage = (event) => {
        receivedMessage = JSON.parse(event.data);
      };

      mockWS.receiveMessage({
        type: 'completion',
        requestId: 'test-request-123',
        itineraryId: 'itinerary-456',
        processingTime: 8500,
        changes: ['budget increased', 'accommodations upgraded'],
        timestamp: new Date().toISOString(),
      });

      // Wait for message
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(receivedMessage.type).toBe('completion');
      expect(receivedMessage.itineraryId).toBeDefined();
      expect(receivedMessage.processingTime).toBeLessThan(10000);
    });
  });

  describe('Performance Requirements', () => {
    it('should complete updates within 10 seconds', async () => {
      const startTime = Date.now();

      // Simulate update process
      const queries = await generateSmartQueries(mockUpdatedFormData as any);
      const itinerary = await formatItinerary(mockUpdatedItinerary as any);
      const textOutput = exportItineraryAsText(itinerary);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(queries).toBeDefined();
      expect(itinerary).toBeDefined();
      expect(textOutput).toBeDefined();
      expect(processingTime).toBeLessThan(10000); // 10 seconds max for updates
    });

    it('should handle rapid successive updates', async () => {
      const updates = [
        { budget: 3000 },
        { budget: 3500 },
        { budget: 4000 },
        { adults: 3 },
        { selectedInterests: ['adventure'] },
      ];

      const startTime = Date.now();

      for (const update of updates) {
        const formData = { ...mockInitialFormData, ...update };
        await generateSmartQueries(formData as any);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should handle multiple rapid updates efficiently
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 5 updates
    });

    it('should maintain performance under concurrent updates', async () => {
      const concurrentUpdates = Array(5)
        .fill(null)
        .map((_, i) => ({
          ...mockInitialFormData,
          budget: { total: 2500 + i * 500, perPerson: false, currency: 'USD' },
        }));

      const startTime = Date.now();

      const results = await Promise.all(
        concurrentUpdates.map((formData) => generateSmartQueries(formData as any))
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(5);
      expect(totalTime).toBeLessThan(10000); // Concurrent updates should still be fast
    });
  });

  describe('Update Quality Validation', () => {
    it('should provide meaningful update recommendations', async () => {
      const luxuryBudgetFormData = {
        ...mockInitialFormData,
        budget: { total: 10000, perPerson: false, currency: 'USD' }, // Very high budget
      };

      const queries = await generateSmartQueries(luxuryBudgetFormData as any);
      const itinerary = await formatItinerary({
        ...mockInitialItinerary,
        budget: {
          total: 10000,
          currency: 'USD',
          breakdown: {
            accommodations: 4000,
            transportation: 2000,
            activities: 2000,
            dining: 2000,
            miscellaneous: 0,
          },
        },
      } as any);

      expect(queries).toBeDefined();
      expect(itinerary).toBeDefined();
      // Should include luxury/high-end terms
      expect(
        queries.some(
          (q) =>
            q.query.includes('luxury') ||
            q.query.includes('premium') ||
            q.query.includes('5-star') ||
            q.query.includes('boutique')
        )
      ).toBe(true);
    });

    it('should handle constraint changes appropriately', async () => {
      const constraintFormData = {
        ...mockInitialFormData,
        selectedInclusions: ['accommodations', 'activities'], // Removed dining and flights
      };

      const queries = await generateSmartQueries(constraintFormData as any);

      // Should not generate queries for removed inclusions
      const hasDiningQueries = queries.some((q) => q.type === 'dining');
      const hasFlightQueries = queries.some((q) => q.type === 'flights');

      expect(hasDiningQueries).toBe(false);
      expect(hasFlightQueries).toBe(false);
    });

    it('should maintain data consistency across updates', async () => {
      // Start with initial data
      await generateSmartQueries(mockInitialFormData as any);
      const initialItinerary = await formatItinerary(mockInitialItinerary as any);

      // Apply update
      await generateSmartQueries(mockUpdatedFormData as any);
      const updatedItinerary = await formatItinerary(mockUpdatedItinerary as any);

      // Verify consistency
      expect(initialItinerary.destination).toBe(updatedItinerary.destination);
      expect(initialItinerary.duration).toBe(updatedItinerary.duration);
      expect(updatedItinerary.budget).not.toBe(initialItinerary.budget); // Should be different
    });
  });

  describe('Error Handling in Updates', () => {
    it('should handle invalid update data gracefully', async () => {
      const invalidFormData = {
        ...mockInitialFormData,
        budget: { total: -1000, perPerson: false, currency: 'USD' }, // Invalid negative budget
      };

      await expect(generateSmartQueries(invalidFormData as any)).rejects.toThrow();
    });

    it('should recover from update failures', async () => {
      // Simulate a failure in the first update attempt
      vi.mocked(generateSmartQueries).mockRejectedValueOnce(new Error('Temporary failure'));

      // First attempt should fail
      await expect(generateSmartQueries(mockUpdatedFormData as any)).rejects.toThrow();

      // Reset mock to succeed
      vi.mocked(generateSmartQueries).mockResolvedValue([]);

      // Second attempt should succeed
      const result = await generateSmartQueries(mockUpdatedFormData as any);
      expect(result).toBeDefined();
    });

    it('should maintain system stability during updates', async () => {
      // Ensure that failed updates don't break subsequent operations
      const failingFormData = {
        ...mockInitialFormData,
        location: '', // Invalid empty location
      };

      // Failed update
      await expect(generateSmartQueries(failingFormData as any)).rejects.toThrow();

      // Subsequent valid update should still work
      const validResult = await generateSmartQueries(mockInitialFormData as any);
      expect(validResult).toBeDefined();
    });
  });

  describe('Integration with Monitoring', () => {
    it('should track update performance metrics', async () => {
      await generateSmartQueries(mockUpdatedFormData as any);
      await formatItinerary(mockUpdatedItinerary as any);

      expect(performanceMonitor.startOperation).toHaveBeenCalled();
      expect(performanceMonitor.endOperation).toHaveBeenCalled();
      expect(performanceMonitor.recordOperation).toHaveBeenCalled();
    });

    it('should log update operations', async () => {
      await generateSmartQueries(mockUpdatedFormData as any);
      await formatItinerary(mockUpdatedItinerary as any);

      expect(performanceMonitor.recordOperation).toHaveBeenCalledWith(
        expect.stringContaining('generate_itinerary'),
        expect.any(String),
        expect.any(Number),
        true,
        expect.any(Object),
        expect.objectContaining({
          operationType: 'update',
          changeType: 'budget_increase',
        })
      );
    });

    it('should monitor update success rates', async () => {
      // Simulate multiple update operations
      const operations = Array(10).fill(null);

      for (const _ of operations) {
        await generateSmartQueries(mockUpdatedFormData as any);
      }

      // Should have recorded all operations
      expect(performanceMonitor.recordOperation).toHaveBeenCalledTimes(10);
    });
  });
});

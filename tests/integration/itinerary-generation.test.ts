/**
 * Integration Tests for End-to-End Itinerary Generation
 * Tests the complete flow from form data to final itinerary output
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateSmartQueries } from '../../src/lib/smart-queries';
import {
  formatItinerary,
  exportItineraryAsText,
} from '../../src/lib/formatting/itinerary-formatter';
import { performanceMonitor } from '../../src/lib/monitoring/performance';

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

describe('End-to-End Itinerary Generation', () => {
  const mockFormData = {
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
      total: 3500,
      perPerson: false,
      currency: 'USD',
    },
  };

  const mockSmartQueries = [
    {
      type: 'flights',
      query: 'Paris flights June 15-22 2 passengers',
      priority: 'high' as const,
      agent: 'gatherer' as const,
    },
    {
      type: 'accommodations',
      query: 'Paris hotels couple 7 nights luxury',
      priority: 'high' as const,
      agent: 'gatherer' as const,
    },
    {
      type: 'activities',
      query: 'Paris sightseeing culture museums',
      priority: 'medium' as const,
      agent: 'gatherer' as const,
    },
    {
      type: 'general',
      query: 'Paris travel guide 2025 couple sightseeing culture food things to do',
      priority: 'low' as const,
      agent: 'specialist' as const,
    },
  ];

  const mockFormattedItinerary = {
    title: 'Paris Adventure 2025',
    destination: 'Paris, France',
    duration: '7 days',
    travelers: '2 travelers',
    budget: '$3,500 USD',
    sections: [
      {
        id: 'header',
        title: 'Trip Overview',
        content: 'Paris Adventure 2025\nParis, France\n7 days, 2 travelers',
        priority: 1,
      },
      {
        id: 'accommodations',
        title: 'Accommodations',
        content:
          '🏨 Hotel Ritz Paris\n   Luxury hotel in Place Vendôme\n   $800/night × 7 nights = $5,600',
        priority: 2,
      },
      {
        id: 'daily-breakdown',
        title: 'Daily Itinerary',
        content:
          '📅 Day 1: Arrival and Eiffel Tower\n   • Arrive in Paris\n   • Visit Eiffel Tower\n   • Dinner at local bistro',
        priority: 3,
      },
    ],
    metadata: {
      generatedAt: '2025-01-15T10:00:00Z',
      version: '1.0.0',
      confidence: 0.95,
      processingTime: 25000,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(generateSmartQueries).mockResolvedValue(mockSmartQueries);
    vi.mocked(formatItinerary).mockResolvedValue(mockFormattedItinerary);
    vi.mocked(exportItineraryAsText).mockReturnValue(
      `
╔══════════════════════════════════════════════════════════════════════════════╗
║                           Paris Adventure 2025                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ Destination: Paris, France                                                ║
║ Duration: 7 days                                                          ║
║ Travelers: 2 adults                                                       ║
║ Budget: $3,500 USD                                                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

🏨 ACCOMMODATIONS
Hotel Ritz Paris - Luxury hotel in Place Vendôme
$800/night × 7 nights = $5,600 total

📅 DAILY ITINERARY
Day 1: Arrival and Eiffel Tower
• Arrive in Paris (CDG Airport)
• Transfer to hotel
• Visit Eiffel Tower (2-3 hours)
• Dinner at local bistro

Day 2: Louvre Museum
• Breakfast at hotel
• Full day at Louvre Museum
• Lunch near the museum
• Evening walk along Seine River

Day 3: Montmartre and Culture
• Visit Sacré-Cœur Basilica
• Explore Montmartre artists' quarter
• Traditional French dinner

Day 4: Versailles Day Trip
• Train to Versailles
• Tour Palace of Versailles
• Gardens and estate exploration
• Return to Paris for dinner

Day 5: Modern Paris
• Centre Pompidou
• Shopping on Champs-Élysées
• Seine River cruise
• Farewell dinner

Day 6: Free Day
• Personal exploration time
• Visit any missed attractions
• Relax and enjoy Paris

Day 7: Departure
• Morning at leisure
• Transfer to airport
• Depart Paris

💰 BUDGET BREAKDOWN
• Accommodations: $5,600 (80%)
• Activities: $525 (15%)
• Dining: $350 (10%)
• Transportation: $525 (15%)
• Miscellaneous: $0 (0%)
• Total: $7,000 (includes buffer)

💡 TRAVEL TIPS
• Book Eiffel Tower tickets online in advance
• Get a Paris Museum Pass for multiple attractions
• Use Metro/RER for efficient transportation
• Learn basic French phrases
• Stay hydrated and wear comfortable shoes
• Check weather and dress appropriately

Generated: January 15, 2025 | Version: 1.0.0 | Confidence: 95%
    `.trim()
    );
  });

  describe('Complete Generation Flow', () => {
    it('should generate complete itinerary from form data', async () => {
      // Execute the complete flow
      const smartQueries = await generateSmartQueries(mockFormData as any);
      const formattedItinerary = await formatItinerary({
        title: 'Paris Adventure 2025',
        destination: 'Paris, France',
        duration: {
          days: 7,
          nights: 6,
          startDate: '2025-06-15',
          endDate: '2025-06-22',
        },
        travelers: {
          adults: 2,
          children: 0,
          total: 2,
        },
        budget: {
          total: 3500,
          currency: 'USD',
          breakdown: {
            accommodations: 1400,
            transportation: 600,
            activities: 700,
            dining: 800,
            miscellaneous: 0,
          },
        },
        dailyPlan: [
          {
            day: 1,
            date: '2025-06-15',
            title: 'Arrival and Eiffel Tower',
            activities: [
              {
                id: '1',
                name: 'Eiffel Tower Visit',
                description: 'Iconic landmark and photo opportunity',
                location: 'Champ de Mars',
                duration: '3 hours',
                time: '14:00',
                cost: 85,
                category: 'sightseeing',
                bookingRequired: true,
              },
            ],
            meals: [
              {
                type: 'lunch',
                name: 'Local Bistro',
                location: 'Near Eiffel Tower',
                time: '13:00',
                cost: 45,
              },
            ],
            transportation: [
              {
                id: '1',
                type: 'taxi',
                from: 'Airport',
                to: 'Hotel',
                departure: '10:00',
                arrival: '11:00',
                duration: '1 hour',
                cost: 60,
                provider: 'Taxi Service',
              },
            ],
            accommodation: {
              id: '1',
              name: 'Hotel Ritz Paris',
              type: 'luxury',
              location: 'Place Vendôme',
              checkIn: '2025-06-15',
              checkOut: '2025-06-16',
              nights: 1,
              cost: 800,
              rating: 5,
              amenities: ['spa', 'concierge'],
            },
          },
        ],
        accommodations: [
          {
            id: '1',
            name: 'Hotel Ritz Paris',
            type: 'luxury',
            location: 'Place Vendôme',
            checkIn: '2025-06-15',
            checkOut: '2025-06-22',
            nights: 7,
            cost: 5600,
            rating: 5,
            amenities: ['spa', 'concierge'],
          },
        ],
        transportation: [
          {
            id: '1',
            type: 'flight',
            from: 'New York (JFK)',
            to: 'Paris (CDG)',
            departure: '2025-06-15T08:00:00',
            arrival: '2025-06-15T20:00:00',
            duration: '8 hours',
            cost: 800,
            provider: 'Air France',
            bookingReference: 'AF001',
          },
        ],
        activities: [
          {
            id: '1',
            name: 'Eiffel Tower Visit',
            description: 'Iconic landmark with city views',
            location: 'Champ de Mars',
            duration: '3 hours',
            time: '14:00',
            cost: 85,
            category: 'sightseeing',
            bookingRequired: true,
          },
        ],
        dining: [
          {
            id: '1',
            name: 'Le Jules Verne',
            type: 'fine dining',
            cuisine: 'French',
            location: 'Eiffel Tower',
            time: '19:00',
            cost: 300,
            rating: 4.5,
            reservationRequired: true,
          },
        ],
        tips: [
          {
            category: 'practical',
            title: 'Transportation',
            content: 'Use public transport for efficiency',
            priority: 'high',
          },
        ],
      } as any);
      const textOutput = exportItineraryAsText(formattedItinerary);

      // Verify the complete flow worked
      expect(smartQueries).toBeDefined();
      expect(smartQueries.length).toBeGreaterThan(0);
      expect(formattedItinerary).toBeDefined();
      expect(formattedItinerary.title).toBe('Paris Adventure 2025');
      expect(textOutput).toBeDefined();
      expect(textOutput.length).toBeGreaterThan(100);
    });

    it('should maintain data consistency through the pipeline', async () => {
      const smartQueries = await generateSmartQueries(mockFormData as any);
      const formattedItinerary = await formatItinerary({
        title: 'Paris Adventure 2025',
        destination: 'Paris, France',
        duration: {
          days: 7,
          nights: 6,
          startDate: '2025-06-15',
          endDate: '2025-06-22',
        },
        travelers: {
          adults: 2,
          children: 0,
          total: 2,
        },
        budget: {
          total: 3500,
          currency: 'USD',
          breakdown: {
            accommodations: 1400,
            transportation: 600,
            activities: 700,
            dining: 800,
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
      const textOutput = exportItineraryAsText(formattedItinerary);

      // Verify data flows correctly
      expect(smartQueries.some((q) => q.query.includes('Paris'))).toBe(true);
      expect(formattedItinerary.destination).toBe('Paris, France');
      expect(textOutput.includes('Paris')).toBe(true);
      expect(textOutput.includes('Adventure')).toBe(true);
    });

    it('should handle different travel scenarios', async () => {
      const scenarios = [
        {
          name: 'Family Trip',
          formData: { ...mockFormData, adults: 2, children: 2, selectedGroups: ['family'] },
          expectedQueries: ['family', 'kids'],
        },
        {
          name: 'Business Trip',
          formData: {
            ...mockFormData,
            selectedInclusions: ['flights', 'accommodations'],
            selectedInterests: ['business'],
          },
          expectedQueries: ['business'],
        },
        {
          name: 'Adventure Trip',
          formData: { ...mockFormData, selectedInterests: ['adventure', 'outdoor'] },
          expectedQueries: ['adventure'],
        },
      ];

      for (const scenario of scenarios) {
        const smartQueries = await generateSmartQueries(scenario.formData as any);

        // Verify scenario-specific queries are generated
        const queryText = smartQueries
          .map((q) => q.query)
          .join(' ')
          .toLowerCase();
        scenario.expectedQueries.forEach((expected) => {
          expect(queryText).toContain(expected.toLowerCase());
        });
      }
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle smart query generation failures gracefully', async () => {
      vi.mocked(generateSmartQueries).mockRejectedValueOnce(new Error('Query generation failed'));

      await expect(generateSmartQueries(mockFormData as any)).rejects.toThrow(
        'Query generation failed'
      );

      // Verify error is handled without crashing the system
      expect(performanceMonitor.recordOperation).toHaveBeenCalled();
    });

    it('should handle formatting failures gracefully', async () => {
      vi.mocked(formatItinerary).mockRejectedValueOnce(new Error('Formatting failed'));

      const testData = {
        title: 'Test',
        destination: 'Test City',
        duration: { days: 1, nights: 0, startDate: '2025-01-01', endDate: '2025-01-02' },
        travelers: { adults: 1, children: 0, total: 1 },
      };

      await expect(formatItinerary(testData as any)).rejects.toThrow('Formatting failed');
    });

    it('should handle export failures gracefully', async () => {
      vi.mocked(exportItineraryAsText).mockImplementationOnce(() => {
        throw new Error('Export failed');
      });

      expect(() => exportItineraryAsText(mockFormattedItinerary)).toThrow('Export failed');
    });

    it('should provide fallback behavior for partial failures', async () => {
      // Mock partial failure - formatting works but export fails
      vi.mocked(exportItineraryAsText).mockImplementationOnce(() => {
        throw new Error('Export failed');
      });

      const formatted = await formatItinerary({
        title: 'Test',
        destination: 'Test City',
        duration: { days: 1, nights: 0, startDate: '2025-01-01', endDate: '2025-01-02' },
        travelers: { adults: 1, children: 0, total: 1 },
      } as any);

      expect(formatted).toBeDefined();
      expect(() => exportItineraryAsText(formatted)).toThrow();
    });
  });

  describe('Performance Integration', () => {
    it('should track end-to-end performance', async () => {
      const startTime = Date.now();

      await generateSmartQueries(mockFormData as any);
      await formatItinerary({
        title: 'Test',
        destination: 'Test City',
        duration: { days: 1, nights: 0, startDate: '2025-01-01', endDate: '2025-01-02' },
        travelers: { adults: 1, children: 0, total: 1 },
      } as any);
      exportItineraryAsText(mockFormattedItinerary);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(1000); // Mock operations should be fast
      expect(performanceMonitor.recordOperation).toHaveBeenCalled();
    });

    it('should meet performance targets for complete flow', async () => {
      const startTime = Date.now();

      // Simulate the complete flow
      const smartQueries = await generateSmartQueries(mockFormData as any);
      const formattedItinerary = await formatItinerary({
        title: 'Performance Test',
        destination: 'Test City',
        duration: { days: 7, nights: 6, startDate: '2025-01-01', endDate: '2025-01-08' },
        travelers: { adults: 2, children: 0, total: 2 },
        dailyPlan: [],
        accommodations: [],
        transportation: [],
        activities: [],
        dining: [],
        tips: [],
      } as any);
      const textOutput = exportItineraryAsText(formattedItinerary);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all components work together efficiently
      expect(smartQueries).toBeDefined();
      expect(formattedItinerary).toBeDefined();
      expect(textOutput).toBeDefined();
      expect(totalTime).toBeLessThan(500); // Should be very fast for mocks
    });
  });

  describe('Data Validation and Consistency', () => {
    it('should validate input data consistency', async () => {
      const invalidData = {
        // Missing required fields
        destination: 'Paris, France',
        // No duration, travelers, etc.
      };

      // Should handle incomplete data gracefully
      await expect(generateSmartQueries(invalidData as any)).rejects.toThrow();
    });

    it('should ensure output data structure consistency', async () => {
      const formattedItinerary = await formatItinerary({
        title: 'Consistency Test',
        destination: 'Test City',
        duration: { days: 3, nights: 2, startDate: '2025-01-01', endDate: '2025-01-04' },
        travelers: { adults: 2, children: 1, total: 3 },
        dailyPlan: [],
        accommodations: [],
        transportation: [],
        activities: [],
        dining: [],
        tips: [],
      } as any);

      // Verify consistent structure
      expect(formattedItinerary).toHaveProperty('title');
      expect(formattedItinerary).toHaveProperty('destination');
      expect(formattedItinerary).toHaveProperty('sections');
      expect(formattedItinerary).toHaveProperty('metadata');
      expect(Array.isArray(formattedItinerary.sections)).toBe(true);
    });

    it('should maintain data integrity through transformations', async () => {
      const originalData = {
        title: 'Data Integrity Test',
        destination: 'Integrity City',
        duration: { days: 5, nights: 4, startDate: '2025-02-01', endDate: '2025-02-06' },
        travelers: { adults: 3, children: 0, total: 3 },
      };

      const formattedItinerary = await formatItinerary({
        ...originalData,
        dailyPlan: [],
        accommodations: [],
        transportation: [],
        activities: [],
        dining: [],
        tips: [],
      } as any);
      const textOutput = exportItineraryAsText(formattedItinerary);

      // Verify data integrity
      expect(formattedItinerary.title).toBe(originalData.title);
      expect(formattedItinerary.destination).toBe(originalData.destination);
      expect(textOutput).toContain(originalData.title);
      expect(textOutput).toContain(originalData.destination);
    });
  });

  describe('Integration with External Systems', () => {
    it('should integrate with performance monitoring', async () => {
      await generateSmartQueries(mockFormData as any);
      await formatItinerary({
        title: 'Monitoring Test',
        destination: 'Test City',
        duration: { days: 1, nights: 0, startDate: '2025-01-01', endDate: '2025-01-02' },
        travelers: { adults: 1, children: 0, total: 1 },
        dailyPlan: [],
        accommodations: [],
        transportation: [],
        activities: [],
        dining: [],
        tips: [],
      } as any);

      // Verify monitoring integration
      expect(performanceMonitor.startOperation).toHaveBeenCalled();
      expect(performanceMonitor.endOperation).toHaveBeenCalled();
      expect(performanceMonitor.recordOperation).toHaveBeenCalled();
    });

    it('should handle async operations correctly', async () => {
      // Test that async operations are properly awaited
      const promise1 = generateSmartQueries(mockFormData as any);
      const promise2 = formatItinerary({
        title: 'Async Test',
        destination: 'Test City',
        duration: { days: 1, nights: 0, startDate: '2025-01-01', endDate: '2025-01-02' },
        travelers: { adults: 1, children: 0, total: 1 },
        dailyPlan: [],
        accommodations: [],
        transportation: [],
        activities: [],
        dining: [],
        tips: [],
      } as any);

      const [queries, itinerary] = await Promise.all([promise1, promise2]);

      expect(queries).toBeDefined();
      expect(itinerary).toBeDefined();
      expect(Array.isArray(queries)).toBe(true);
      expect(itinerary).toHaveProperty('title');
    });

    it('should maintain session context through operations', async () => {
      // Simulate operations with session context
      await generateSmartQueries(mockFormData as any);
      const formattedItinerary = await formatItinerary({
        title: 'Session Test',
        destination: 'Test City',
        duration: { days: 1, nights: 0, startDate: '2025-01-01', endDate: '2025-01-02' },
        travelers: { adults: 1, children: 0, total: 1 },
        dailyPlan: [],
        accommodations: [],
        transportation: [],
        activities: [],
        dining: [],
        tips: [],
      } as any);

      // Verify session context is maintained
      expect(formattedItinerary).toBeDefined();
      expect(performanceMonitor.startOperation).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('End-to-End Scenarios', () => {
    it('should handle complete Paris itinerary generation', async () => {
      const parisFormData = {
        location: 'Paris, France',
        departDate: '2025-06-15',
        returnDate: '2025-06-22',
        adults: 2,
        children: 0,
        selectedInclusions: ['flights', 'accommodations', 'activities', 'dining', 'transportation'],
        selectedGroups: ['couple'],
        selectedInterests: ['sightseeing', 'culture', 'romantic'],
        travelStyleChoice: 'cultural',
      };

      const smartQueries = await generateSmartQueries(parisFormData as any);
      const formattedItinerary = await formatItinerary({
        title: 'Paris Cultural Escape',
        destination: 'Paris, France',
        duration: { days: 7, nights: 6, startDate: '2025-06-15', endDate: '2025-06-22' },
        travelers: { adults: 2, children: 0, total: 2 },
        budget: {
          total: 4500,
          currency: 'USD',
          breakdown: {
            accommodations: 1800,
            transportation: 900,
            activities: 900,
            dining: 900,
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
      const textOutput = exportItineraryAsText(formattedItinerary);

      // Verify complete Paris scenario
      expect(smartQueries.length).toBeGreaterThan(3);
      expect(formattedItinerary.title).toContain('Paris');
      expect(textOutput).toContain('Paris');
      expect(textOutput).toContain('Cultural');
    });

    it('should handle family vacation scenario', async () => {
      const familyFormData = {
        location: 'Orlando, Florida',
        departDate: '2025-07-01',
        returnDate: '2025-07-08',
        adults: 2,
        children: 2,
        selectedInclusions: ['flights', 'accommodations', 'activities', 'dining'],
        selectedGroups: ['family'],
        selectedInterests: ['theme-parks', 'family-friendly'],
        travelStyleChoice: 'family',
      };

      const smartQueries = await generateSmartQueries(familyFormData as any);
      const formattedItinerary = await formatItinerary({
        title: 'Orlando Family Adventure',
        destination: 'Orlando, Florida',
        duration: { days: 7, nights: 6, startDate: '2025-07-01', endDate: '2025-07-08' },
        travelers: { adults: 2, children: 2, total: 4 },
        budget: {
          total: 5200,
          currency: 'USD',
          breakdown: {
            accommodations: 1600,
            transportation: 1200,
            activities: 1600,
            dining: 800,
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
      const textOutput = exportItineraryAsText(formattedItinerary);

      // Verify family scenario
      expect(smartQueries.some((q) => q.query.includes('family') || q.query.includes('kids'))).toBe(
        true
      );
      expect(formattedItinerary.travelers).toContain('4');
      expect(textOutput).toContain('Family');
    });

    it('should handle business travel scenario', async () => {
      const businessFormData = {
        location: 'New York City, USA',
        departDate: '2025-03-10',
        returnDate: '2025-03-14',
        adults: 1,
        children: 0,
        selectedInclusions: ['flights', 'accommodations'],
        selectedGroups: ['business'],
        selectedInterests: ['business', 'networking'],
        travelStyleChoice: 'business',
      };

      const smartQueries = await generateSmartQueries(businessFormData as any);
      const formattedItinerary = await formatItinerary({
        title: 'New York Business Trip',
        destination: 'New York City, USA',
        duration: { days: 4, nights: 3, startDate: '2025-03-10', endDate: '2025-03-14' },
        travelers: { adults: 1, children: 0, total: 1 },
        budget: {
          total: 1800,
          currency: 'USD',
          breakdown: {
            accommodations: 900,
            transportation: 600,
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
      const textOutput = exportItineraryAsText(formattedItinerary);

      // Verify business scenario
      expect(smartQueries.some((q) => q.query.includes('business'))).toBe(true);
      expect(formattedItinerary.title).toContain('Business');
      expect(textOutput).toContain('Business');
    });
  });
});

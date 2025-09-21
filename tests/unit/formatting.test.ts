/**
 * Unit Tests for Output Formatting
 * Basic test coverage for itinerary formatting functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  formatItinerary,
  exportItineraryAsText,
  exportItineraryAsMarkdown,
  exportItineraryAsJSON,
  type ItineraryData,
} from '../../src/lib/formatting/itinerary-formatter';
import {
  createBox,
  createSeparator,
  createProgressBar,
  createStatusIndicator,
} from '../../src/lib/formatting/box-formatter';
import { createSummary, createTable } from '../../src/lib/formatting/summary-formatter';
import { performanceMonitor } from '../../src/lib/monitoring/performance';

// Mock performance monitor
vi.mock('../../src/lib/monitoring/performance', () => ({
  performanceMonitor: {
    startOperation: vi.fn().mockReturnValue('test-metric-id'),
    endOperation: vi.fn(),
    recordOperation: vi.fn(),
  },
}));

describe('Output Formatting System', () => {
  let mockItineraryData: ItineraryData;

  beforeEach(() => {
    vi.clearAllMocks();

    mockItineraryData = {
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
          title: 'Arrival and City Exploration',
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
    };
  });

  describe('Itinerary Formatter', () => {
    it('should format complete itinerary data', async () => {
      const result = await formatItinerary(mockItineraryData);

      expect(result).toBeDefined();
      expect(result.title).toBe('Paris Adventure 2025');
      expect(result.sections).toBeInstanceOf(Array);
      expect(result.sections.length).toBeGreaterThan(0);
    });

    it('should handle minimal itinerary data', async () => {
      const minimalData: ItineraryData = {
        title: 'Simple Trip',
        destination: 'Test City',
        duration: {
          days: 1,
          nights: 0,
          startDate: '2025-01-01',
          endDate: '2025-01-02',
        },
        travelers: {
          adults: 1,
          children: 0,
          total: 1,
        },
      };

      const result = await formatItinerary(minimalData);

      expect(result).toBeDefined();
      expect(result.title).toBe('Simple Trip');
      expect(result.sections.length).toBeGreaterThan(0);
    });
  });

  describe('Export Functions', () => {
    let formattedItinerary: any;

    beforeEach(async () => {
      formattedItinerary = await formatItinerary(mockItineraryData);
    });

    it('should export as text format', () => {
      const text = exportItineraryAsText(formattedItinerary);

      expect(text).toBeDefined();
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(50);
      expect(text).toContain('Paris Adventure 2025');
    });

    it('should export as markdown format', () => {
      const markdown = exportItineraryAsMarkdown(formattedItinerary);

      expect(markdown).toBeDefined();
      expect(typeof markdown).toBe('string');
      expect(markdown.length).toBeGreaterThan(50);
      expect(markdown).toContain('# Paris Adventure 2025');
    });

    it('should export as JSON format', () => {
      const json = exportItineraryAsJSON(formattedItinerary);

      expect(json).toBeDefined();
      expect(typeof json).toBe('string');
      expect(() => JSON.parse(json)).not.toThrow();

      const parsed = JSON.parse(json);
      expect(parsed.title).toBe('Paris Adventure 2025');
    });
  });

  describe('Box Formatter', () => {
    it('should create basic boxes', () => {
      const content = 'Test Content';
      const box = createBox(content);

      expect(box).toBeDefined();
      expect(typeof box).toBe('string');
      expect(box).toContain('Test Content');
      expect(box).toContain('┌');
      expect(box).toContain('└');
    });

    it('should create boxes with titles', () => {
      const content = 'Box Content';
      const title = 'Test Title';
      const box = createBox(content, title);

      expect(box).toContain('Test Title');
      expect(box).toContain('Box Content');
    });

    it('should create separators', () => {
      const separator = createSeparator();

      expect(separator).toBeDefined();
      expect(separator.length).toBeGreaterThan(10);
    });

    it('should create progress bars', () => {
      const progress = createProgressBar(75, 100);

      expect(progress).toContain('75%');
      expect(progress).toContain('█');
    });

    it('should create status indicators', () => {
      const success = createStatusIndicator('success', 'Task completed');
      const error = createStatusIndicator('error', 'Task failed');

      expect(success).toContain('✓');
      expect(success).toContain('Task completed');
      expect(error).toContain('✗');
      expect(error).toContain('Task failed');
    });
  });

  describe('Summary Formatter', () => {
    it('should create trip summaries', () => {
      const summary = createSummary(mockItineraryData);

      expect(summary).toBeDefined();
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(20);
      expect(summary).toContain('Paris, France');
    });

    it('should create tables', () => {
      const columns = [
        { key: 'name', header: 'Name', width: 20 },
        { key: 'value', header: 'Value', width: 15 },
      ];

      const rows = [
        { name: 'Item 1', value: '100' },
        { name: 'Item 2', value: '200' },
      ];

      const table = createTable(columns, rows, {});

      expect(table).toBeDefined();
      expect(table).toContain('Name');
      expect(table).toContain('Value');
      expect(table).toContain('Item 1');
      expect(table).toContain('Item 2');
    });
  });

  describe('Performance and Monitoring', () => {
    it('should track formatting performance', async () => {
      await formatItinerary(mockItineraryData);

      expect(performanceMonitor.recordOperation).toHaveBeenCalledWith(
        expect.stringContaining('format_itinerary'),
        expect.any(String),
        expect.any(Number),
        true,
        expect.any(Object),
        expect.any(Object)
      );
    });
  });
});

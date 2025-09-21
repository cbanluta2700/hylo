/**
 * Unit Tests for Smart Query Generation
 * Comprehensive test coverage for query generation based on form data
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateSmartQueries, generateId } from '../../src/lib/smart-queries';
import { performanceMonitor } from '../../src/lib/monitoring/performance';

// Mock performance monitor
vi.mock('../../src/lib/monitoring/performance', () => ({
  performanceMonitor: {
    startOperation: vi.fn().mockReturnValue('test-metric-id'),
    endOperation: vi.fn(),
    recordOperation: vi.fn(),
  },
}));

describe('Smart Query Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Query Generation', () => {
    it('should generate basic queries for destinations', () => {
      const formData = {
        location: 'Paris, France',
        departDate: '2025-06-15',
        returnDate: '2025-06-22',
        adults: 2,
        children: 0,
        selectedInclusions: ['activities', 'accommodations'],
        selectedGroups: ['couple'],
        selectedInterests: ['sightseeing', 'culture'],
      };

      const result = generateSmartQueries(formData as any);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('query');
      expect(result[0]).toHaveProperty('priority');
      expect(result[0]).toHaveProperty('agent');
    });

    it('should generate specialized queries for different inclusions', () => {
      const inclusions = ['flights', 'accommodations', 'activities', 'dining', 'transportation'];

      inclusions.forEach((inclusion) => {
        const formData = {
          location: 'Tokyo, Japan',
          departDate: '2025-07-01',
          returnDate: '2025-07-08',
          adults: 2,
          children: 0,
          selectedInclusions: [inclusion],
          selectedGroups: ['couple'],
          selectedInterests: ['sightseeing'],
        };

        const result = generateSmartQueries(formData as any);

        expect(result.length).toBeGreaterThan(0);
        expect(result.some((query: any) => query.type === inclusion)).toBe(true);
      });
    });

    it('should handle different traveler compositions', () => {
      const travelerConfigs = [
        { adults: 1, children: 0, expectedInQuery: '1' },
        { adults: 2, children: 0, expectedInQuery: '2' },
        { adults: 4, children: 2, expectedInQuery: '6' },
      ];

      travelerConfigs.forEach(({ adults, children, expectedInQuery }) => {
        const formData = {
          location: 'Barcelona, Spain',
          departDate: '2025-08-01',
          returnDate: '2025-08-08',
          adults,
          children,
          selectedInclusions: ['accommodations'],
          selectedGroups: ['family'],
          selectedInterests: ['sightseeing'],
        };

        const result = generateSmartQueries(formData as any);
        const queryText = result.map((q: any) => q.query).join(' ');

        expect(queryText).toContain(expectedInQuery);
      });
    });

    it('should always include general travel guide query', () => {
      const formData = {
        location: 'Rome, Italy',
        departDate: '2025-09-01',
        returnDate: '2025-09-08',
        adults: 2,
        children: 0,
        selectedInclusions: [], // No specific inclusions
        selectedGroups: ['couple'],
        selectedInterests: ['culture'],
      };

      const result = generateSmartQueries(formData as any);

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((query: any) => query.type === 'general')).toBe(true);
    });

    it('should handle minimal form data gracefully', () => {
      const minimalFormData = {
        location: 'Berlin, Germany',
        departDate: '2025-10-01',
        returnDate: '2025-10-08',
        adults: 1,
        children: 0,
        // No selectedInclusions, selectedGroups, or selectedInterests
      };

      const result = generateSmartQueries(minimalFormData as any);

      expect(result.length).toBeGreaterThan(0);
      // Should include general query and some defaults
      expect(result.some((query: any) => query.type === 'general')).toBe(true);
    });

    it('should include special source for cruise queries', () => {
      const formData = {
        location: 'Miami, Florida',
        departDate: '2025-12-01',
        returnDate: '2025-12-08',
        adults: 2,
        children: 0,
        selectedInclusions: ['cruise'],
        selectedGroups: ['couple'],
        selectedInterests: ['relaxation'],
      };

      const result = generateSmartQueries(formData as any);

      const cruiseQuery = result.find((query: any) => query.type === 'cruise');
      expect(cruiseQuery).toBeDefined();
      expect(cruiseQuery?.specialSource).toContain('cruisecritic.com');
    });
  });

  describe('Query Properties', () => {
    it('should assign correct priorities to different query types', () => {
      const formData = {
        location: 'London, UK',
        departDate: '2025-05-01',
        returnDate: '2025-05-08',
        adults: 2,
        children: 0,
        selectedInclusions: ['flights', 'accommodations', 'activities', 'dining'],
        selectedGroups: ['couple'],
        selectedInterests: ['sightseeing'],
      };

      const result = generateSmartQueries(formData as any);

      const flightsQuery = result.find((query: any) => query.type === 'flights');
      const activitiesQuery = result.find((query: any) => query.type === 'activities');
      const generalQuery = result.find((query: any) => query.type === 'general');

      expect(flightsQuery?.priority).toBe('high');
      expect(activitiesQuery?.priority).toBe('medium');
      expect(generalQuery?.priority).toBe('low');
    });

    it('should assign queries to appropriate agents', () => {
      const formData = {
        location: 'Amsterdam, Netherlands',
        departDate: '2025-06-01',
        returnDate: '2025-06-08',
        adults: 2,
        children: 0,
        selectedInclusions: ['flights', 'accommodations', 'activities'],
        selectedGroups: ['couple'],
        selectedInterests: ['culture'],
      };

      const result = generateSmartQueries(formData as any);

      result.forEach((query: any) => {
        expect(['architect', 'gatherer', 'specialist', 'putter']).toContain(query.agent);
      });

      // Most queries should go to gatherer
      const gathererQueries = result.filter((query: any) => query.agent === 'gatherer');
      expect(gathererQueries.length).toBeGreaterThan(0);
    });

    it('should generate meaningful query strings', () => {
      const formData = {
        location: 'Prague, Czech Republic',
        departDate: '2025-07-01',
        returnDate: '2025-07-08',
        adults: 2,
        children: 0,
        selectedInclusions: ['accommodations'],
        selectedGroups: ['couple'],
        selectedInterests: ['history'],
      };

      const result = generateSmartQueries(formData as any);

      result.forEach((query: any) => {
        expect(query.query).toBeDefined();
        expect(typeof query.query).toBe('string');
        expect(query.query.length).toBeGreaterThan(10); // Meaningful length
        expect(query.query.toLowerCase()).toContain('prague');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty or invalid form data', () => {
      const invalidFormData = {
        location: '',
        departDate: '',
        returnDate: '',
        adults: 0,
        children: 0,
      };

      expect(() => {
        generateSmartQueries(invalidFormData as any);
      }).not.toThrow();

      const result = generateSmartQueries(invalidFormData as any);
      expect(result).toBeInstanceOf(Array);
    });

    it('should handle missing optional fields', () => {
      const incompleteFormData = {
        location: 'Vienna, Austria',
        adults: 1,
        // Missing departDate, returnDate, children, selectedInclusions, etc.
      };

      const result = generateSmartQueries(incompleteFormData as any);

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((query: any) => query.type === 'general')).toBe(true);
    });

    it('should handle extreme values gracefully', () => {
      const extremeFormData = {
        location: 'Test City',
        departDate: '2025-01-01',
        returnDate: '2025-12-31',
        adults: 100,
        children: 50,
        selectedInclusions: [
          'flights',
          'accommodations',
          'activities',
          'dining',
          'transportation',
          'cruise',
        ],
        selectedGroups: ['large group'],
        selectedInterests: ['everything'],
      };

      const result = generateSmartQueries(extremeFormData as any);

      expect(result.length).toBeGreaterThan(0);
      result.forEach((query: any) => {
        expect(query.query).toBeDefined();
        expect(query.query.length).toBeLessThan(1000); // Reasonable length
      });
    });
  });

  describe('ID Generation', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1).not.toBe(id2);
      expect(id1.length).toBeGreaterThan(0);
      expect(id2.length).toBeGreaterThan(0);
    });

    it('should generate valid UUID format', () => {
      const id = generateId();

      // Basic UUID v4 format check (8-4-4-4-12)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(id)).toBe(true);
    });
  });

  describe('Performance and Monitoring', () => {
    it('should track query generation performance', () => {
      const formData = {
        location: 'Sydney, Australia',
        departDate: '2025-11-01',
        returnDate: '2025-11-08',
        adults: 2,
        children: 0,
        selectedInclusions: ['activities'],
        selectedGroups: ['couple'],
        selectedInterests: ['adventure'],
      };

      generateSmartQueries(formData as any);

      expect(performanceMonitor.recordOperation).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Number),
        true,
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle performance monitoring failures gracefully', () => {
      vi.mocked(performanceMonitor.startOperation).mockReturnValueOnce('');

      const formData = {
        location: 'Rio de Janeiro, Brazil',
        departDate: '2025-12-01',
        returnDate: '2025-12-08',
        adults: 2,
        children: 0,
        selectedInclusions: ['dining'],
      };

      const result = generateSmartQueries(formData as any);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with complete form data', () => {
      const completeFormData = {
        location: 'New York City, USA',
        departDate: '2025-03-15',
        returnDate: '2025-03-22',
        adults: 3,
        children: 2,
        childrenAges: [5, 8],
        selectedInclusions: ['flights', 'accommodations', 'activities', 'dining'],
        selectedGroups: ['family'],
        selectedInterests: ['sightseeing', 'museums', 'food'],
        travelStyleChoice: 'cultural',
        inclusionPreferences: {
          flights: {
            departureAirports: ['JFK'],
            cabinClasses: ['economy'],
          },
          accommodations: {
            selectedTypes: ['hotels', 'boutique'],
            specialRequests: 'family rooms needed',
          },
        },
      };

      const result = generateSmartQueries(completeFormData as any);

      expect(result.length).toBeGreaterThan(3); // Multiple inclusions + general
      expect(result.some((query: any) => query.type === 'flights')).toBe(true);
      expect(result.some((query: any) => query.type === 'accommodations')).toBe(true);
      expect(result.some((query: any) => query.type === 'activities')).toBe(true);
      expect(result.some((query: any) => query.type === 'dining')).toBe(true);
      expect(result.some((query: any) => query.type === 'general')).toBe(true);
    });

    it('should adapt to different travel styles', () => {
      const travelStyles = ['cultural', 'adventure', 'relaxation', 'food', 'shopping'];

      travelStyles.forEach((style) => {
        const formData = {
          location: 'Bangkok, Thailand',
          departDate: '2025-02-01',
          returnDate: '2025-02-08',
          adults: 2,
          children: 0,
          selectedInclusions: ['activities', 'dining'],
          selectedGroups: ['couple'],
          selectedInterests: [style],
          travelStyleChoice: style,
        };

        const result = generateSmartQueries(formData as any);

        expect(result.length).toBeGreaterThan(0);
        const queryText = result
          .map((q: any) => q.query)
          .join(' ')
          .toLowerCase();
        expect(queryText).toContain(style.toLowerCase());
      });
    });
  });
});

import { describe, it, expect } from 'vitest';
import { testApi } from '../utils/test-api';
import { z } from 'zod';

// Contract test for POST /api/agents/gatherer
// Tests the agent gatherer endpoint contract

const AgentGathererRequestSchema = z.object({
  requestId: z.string().uuid(),
  itineraryStructure: z.object({
    destination: z.string(),
    duration: z.number().positive(),
    destinations: z.array(
      z.object({
        name: z.string(),
        type: z.enum(['primary', 'secondary', 'stopover']),
        duration: z.number().positive(),
      })
    ),
    travelDates: z.object({
      startDate: z.string(),
      endDate: z.string(),
    }),
  }),
  dataRequirements: z.object({
    categories: z.array(
      z.enum([
        'accommodation',
        'activities',
        'dining',
        'transportation',
        'weather',
        'events',
        'safety',
        'local_tips',
        'costs',
        'photos',
      ])
    ),
    priority: z.enum(['low', 'normal', 'high', 'urgent']),
    sources: z.array(z.enum(['web_search', 'apis', 'databases', 'user_generated'])).optional(),
  }),
  context: z.object({
    budget: z.object({
      total: z.number().positive(),
      currency: z.string(),
    }),
    travelerProfile: z.object({
      preferences: z.array(z.string()),
      restrictions: z.array(z.string()).optional(),
      groupSize: z.number().positive(),
    }),
    previousFindings: z.array(z.any()).optional(),
  }),
});

const AgentGathererResponseSchema = z.object({
  agentId: z.string().uuid(),
  requestId: z.string().uuid(),
  status: z.enum(['accepted', 'processing', 'completed', 'error']),
  gatheredData: z.object({
    accommodation: z
      .array(
        z.object({
          name: z.string(),
          type: z.string(),
          location: z.string(),
          priceRange: z.string(),
          rating: z.number().min(0).max(5).optional(),
          amenities: z.array(z.string()),
          bookingUrl: z.string().optional(),
          imageUrl: z.string().optional(),
        })
      )
      .optional(),
    activities: z
      .array(
        z.object({
          name: z.string(),
          category: z.string(),
          description: z.string(),
          duration: z.string(),
          price: z.number().optional(),
          bookingRequired: z.boolean(),
          bestTime: z.string().optional(),
          location: z.string(),
        })
      )
      .optional(),
    dining: z
      .array(
        z.object({
          name: z.string(),
          cuisine: z.string(),
          priceRange: z.string(),
          rating: z.number().min(0).max(5).optional(),
          location: z.string(),
          specialties: z.array(z.string()),
          reservations: z.boolean(),
        })
      )
      .optional(),
    transportation: z
      .array(
        z.object({
          type: z.string(),
          from: z.string(),
          to: z.string(),
          duration: z.string(),
          cost: z.number().optional(),
          frequency: z.string().optional(),
          bookingUrl: z.string().optional(),
        })
      )
      .optional(),
    weather: z
      .object({
        forecast: z.array(
          z.object({
            date: z.string(),
            condition: z.string(),
            temperature: z.object({
              min: z.number(),
              max: z.number(),
              unit: z.string(),
            }),
            precipitation: z.number().optional(),
          })
        ),
        seasonalInfo: z.string().optional(),
      })
      .optional(),
    localTips: z
      .array(
        z.object({
          category: z.string(),
          tip: z.string(),
          importance: z.enum(['low', 'medium', 'high']),
        })
      )
      .optional(),
  }),
  metadata: z.object({
    processingTime: z.number().positive(),
    sourcesUsed: z.array(z.string()),
    dataFreshness: z.object({
      lastUpdated: z.string(),
      nextUpdate: z.string().optional(),
    }),
    confidence: z.object({
      overall: z.number().min(0).max(1),
      byCategory: z.record(z.number().min(0).max(1)),
    }),
    warnings: z.array(z.string()).optional(),
  }),
  timestamp: z.string(),
});

const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

describe('POST /api/agents/gatherer', () => {
  describe('Request Validation', () => {
    it('should accept valid gatherer request', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryStructure: {
          destination: 'Paris, France',
          duration: 7,
          destinations: [
            {
              name: 'Paris',
              type: 'primary',
              duration: 7,
            },
          ],
          travelDates: {
            startDate: '2025-06-01',
            endDate: '2025-06-07',
          },
        },
        dataRequirements: {
          categories: ['accommodation', 'activities', 'dining'],
          priority: 'normal',
          sources: ['web_search', 'apis'],
        },
        context: {
          budget: {
            total: 3000,
            currency: 'USD',
          },
          travelerProfile: {
            preferences: ['cultural', 'foodie'],
            restrictions: ['vegetarian'],
            groupSize: 2,
          },
        },
      };

      const response = await testApi.post('/api/agents/gatherer').send(requestBody).expect(202);

      expect(response.body).toBeDefined();
      const responseBody = AgentGathererResponseSchema.parse(response.body);
      expect(responseBody.agentId).toBeDefined();
      expect(responseBody.requestId).toBe(requestBody.requestId);
      expect(['accepted', 'processing', 'completed']).toContain(responseBody.status);
    });

    it('should reject missing required fields', async () => {
      const invalidRequest = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        // Missing itineraryStructure and dataRequirements
      };

      const response = await testApi.post('/api/agents/gatherer').send(invalidRequest).expect(400);

      const responseBody = ErrorResponseSchema.parse(response.body);
      expect(responseBody.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid request ID format', async () => {
      const invalidRequest = {
        requestId: 'invalid-uuid',
        itineraryStructure: {
          destination: 'Paris, France',
          duration: 7,
          destinations: [{ name: 'Paris', type: 'primary', duration: 7 }],
          travelDates: { startDate: '2025-06-01', endDate: '2025-06-07' },
        },
        dataRequirements: {
          categories: ['accommodation'],
          priority: 'normal',
        },
        context: {
          budget: { total: 3000, currency: 'USD' },
          travelerProfile: { preferences: [], groupSize: 2 },
        },
      };

      const response = await testApi.post('/api/agents/gatherer').send(invalidRequest).expect(400);

      const responseBody = ErrorResponseSchema.parse(response.body);
      expect(responseBody.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid duration values', async () => {
      const invalidRequest = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryStructure: {
          destination: 'Paris, France',
          duration: -5, // Invalid negative duration
          destinations: [{ name: 'Paris', type: 'primary', duration: 7 }],
          travelDates: { startDate: '2025-06-01', endDate: '2025-06-07' },
        },
        dataRequirements: {
          categories: ['accommodation'],
          priority: 'normal',
        },
        context: {
          budget: { total: 3000, currency: 'USD' },
          travelerProfile: { preferences: [], groupSize: 2 },
        },
      };

      const response = await testApi.post('/api/agents/gatherer').send(invalidRequest).expect(400);

      const responseBody = ErrorResponseSchema.parse(response.body);
      expect(responseBody.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Response Format', () => {
    it('should return correct content type', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryStructure: {
          destination: 'Paris, France',
          duration: 7,
          destinations: [{ name: 'Paris', type: 'primary', duration: 7 }],
          travelDates: { startDate: '2025-06-01', endDate: '2025-06-07' },
        },
        dataRequirements: {
          categories: ['accommodation', 'activities'],
          priority: 'normal',
        },
        context: {
          budget: { total: 3000, currency: 'USD' },
          travelerProfile: { preferences: ['cultural'], groupSize: 2 },
        },
      };

      const response = await testApi.post('/api/agents/gatherer').send(requestBody).expect(202);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should include CORS headers', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryStructure: {
          destination: 'Paris, France',
          duration: 7,
          destinations: [{ name: 'Paris', type: 'primary', duration: 7 }],
          travelDates: { startDate: '2025-06-01', endDate: '2025-06-07' },
        },
        dataRequirements: {
          categories: ['accommodation'],
          priority: 'normal',
        },
        context: {
          budget: { total: 3000, currency: 'USD' },
          travelerProfile: { preferences: [], groupSize: 2 },
        },
      };

      const response = await testApi.post('/api/agents/gatherer').send(requestBody).expect(202);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });

  describe('Response Content', () => {
    it('should include gathered data by category', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryStructure: {
          destination: 'Paris, France',
          duration: 7,
          destinations: [{ name: 'Paris', type: 'primary', duration: 7 }],
          travelDates: { startDate: '2025-06-01', endDate: '2025-06-07' },
        },
        dataRequirements: {
          categories: ['accommodation', 'activities', 'dining'],
          priority: 'normal',
        },
        context: {
          budget: { total: 3000, currency: 'USD' },
          travelerProfile: { preferences: ['cultural', 'foodie'], groupSize: 2 },
        },
      };

      const response = await testApi.post('/api/agents/gatherer').send(requestBody).expect(202);

      const responseBody = AgentGathererResponseSchema.parse(response.body);

      // Validate gathered data structure
      expect(responseBody.gatheredData).toBeDefined();

      // Should include requested categories
      if (responseBody.gatheredData.accommodation) {
        expect(Array.isArray(responseBody.gatheredData.accommodation)).toBe(true);
        expect(responseBody.gatheredData.accommodation.length).toBeGreaterThan(0);
      }

      if (responseBody.gatheredData.activities) {
        expect(Array.isArray(responseBody.gatheredData.activities)).toBe(true);
        expect(responseBody.gatheredData.activities.length).toBeGreaterThan(0);
      }
    });

    it('should include comprehensive metadata', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryStructure: {
          destination: 'Paris, France',
          duration: 7,
          destinations: [{ name: 'Paris', type: 'primary', duration: 7 }],
          travelDates: { startDate: '2025-06-01', endDate: '2025-06-07' },
        },
        dataRequirements: {
          categories: ['accommodation'],
          priority: 'normal',
        },
        context: {
          budget: { total: 3000, currency: 'USD' },
          travelerProfile: { preferences: [], groupSize: 2 },
        },
      };

      const response = await testApi.post('/api/agents/gatherer').send(requestBody).expect(202);

      const responseBody = AgentGathererResponseSchema.parse(response.body);

      // Validate metadata
      expect(responseBody.metadata.processingTime).toBeGreaterThan(0);
      expect(Array.isArray(responseBody.metadata.sourcesUsed)).toBe(true);
      expect(responseBody.metadata.confidence.overall).toBeGreaterThanOrEqual(0);
      expect(responseBody.metadata.confidence.overall).toBeLessThanOrEqual(1);
      expect(typeof responseBody.metadata.dataFreshness.lastUpdated).toBe('string');
    });

    it('should handle different data categories', async () => {
      const categories = [
        ['accommodation'],
        ['activities'],
        ['dining'],
        ['transportation'],
        ['accommodation', 'activities', 'dining'],
      ];

      for (const categoryList of categories) {
        const requestBody = {
          requestId: '550e8400-e29b-41d4-a716-446655440000',
          itineraryStructure: {
            destination: 'Paris, France',
            duration: 7,
            destinations: [{ name: 'Paris', type: 'primary', duration: 7 }],
            travelDates: { startDate: '2025-06-01', endDate: '2025-06-07' },
          },
          dataRequirements: {
            categories: categoryList,
            priority: 'normal',
          },
          context: {
            budget: { total: 3000, currency: 'USD' },
            travelerProfile: { preferences: [], groupSize: 2 },
          },
        };

        const response = await testApi.post('/api/agents/gatherer').send(requestBody).expect(202);

        const responseBody = AgentGathererResponseSchema.parse(response.body);
        expect(responseBody.gatheredData).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryStructure: {
          destination: 'Paris, France',
          duration: 7,
          destinations: [{ name: 'Paris', type: 'primary', duration: 7 }],
          travelDates: { startDate: '2025-06-01', endDate: '2025-06-07' },
        },
        dataRequirements: {
          categories: ['accommodation'],
          priority: 'normal',
        },
        context: {
          budget: { total: 3000, currency: 'USD' },
          travelerProfile: { preferences: [], groupSize: 2 },
        },
      };

      await testApi
        .post('/api/agents/gatherer')
        .send(requestBody)
        .expect((res: any) => {
          expect([202, 500]).toContain(res.status);
        });
    });

    it('should handle malformed JSON', async () => {
      await testApi
        .post('/api/agents/gatherer')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect((res: any) => {
          expect([400, 500]).toContain(res.status);
        });
    });
  });

  describe('Business Logic', () => {
    it('should respect data category requirements', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryStructure: {
          destination: 'Paris, France',
          duration: 7,
          destinations: [{ name: 'Paris', type: 'primary', duration: 7 }],
          travelDates: { startDate: '2025-06-01', endDate: '2025-06-07' },
        },
        dataRequirements: {
          categories: ['accommodation', 'weather'],
          priority: 'high',
        },
        context: {
          budget: { total: 3000, currency: 'USD' },
          travelerProfile: {
            preferences: ['cultural'],
            groupSize: 2,
          },
        },
      };

      const response = await testApi.post('/api/agents/gatherer').send(requestBody).expect(202);

      const responseBody = AgentGathererResponseSchema.parse(response.body);

      // Should include requested categories
      expect(responseBody.gatheredData.accommodation).toBeDefined();
      expect(responseBody.gatheredData.weather).toBeDefined();

      // Should not include unrequested categories
      expect(responseBody.gatheredData.activities).toBeUndefined();
    });

    it('should handle different traveler preferences', async () => {
      const preferences = [
        ['cultural', 'historical'],
        ['foodie', 'local cuisine'],
        ['adventure', 'outdoor'],
        ['relaxation', 'spa'],
      ];

      for (const prefs of preferences) {
        const requestBody = {
          requestId: '550e8400-e29b-41d4-a716-446655440000',
          itineraryStructure: {
            destination: 'Paris, France',
            duration: 7,
            destinations: [{ name: 'Paris', type: 'primary', duration: 7 }],
            travelDates: { startDate: '2025-06-01', endDate: '2025-06-07' },
          },
          dataRequirements: {
            categories: ['activities', 'dining'],
            priority: 'normal',
          },
          context: {
            budget: { total: 3000, currency: 'USD' },
            travelerProfile: {
              preferences: prefs,
              groupSize: 2,
            },
          },
        };

        const response = await testApi.post('/api/agents/gatherer').send(requestBody).expect(202);

        const responseBody = AgentGathererResponseSchema.parse(response.body);
        expect(responseBody.gatheredData).toBeDefined();
      }
    });
  });
});

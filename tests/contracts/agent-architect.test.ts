import { describe, it, expect } from 'vitest';
import { testApi } from '../utils/test-api';
import { z } from 'zod';

// Contract test for POST /api/agents/architect
// Tests the agent architect endpoint contract

const AgentArchitectRequestSchema = z.object({
  requestId: z.string().uuid(),
  itineraryData: z.object({
    destination: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    travelers: z.object({
      adults: z.number().min(1),
      children: z.number().min(0),
      seniors: z.number().min(0),
    }),
    budget: z.object({
      total: z.number().positive(),
      currency: z.string(),
      flexibility: z.enum(['strict', 'moderate', 'flexible']),
    }),
    preferences: z.object({
      accommodation: z.array(z.string()),
      dining: z.array(z.string()),
      activities: z.array(z.string()),
      transportation: z.array(z.string()),
    }),
    travelStyle: z.string(),
    specialRequirements: z.array(z.string()).optional(),
  }),
  context: z.object({
    previousAgents: z.array(z.string()).optional(),
    constraints: z.array(z.string()).optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']),
  }),
});

const AgentArchitectResponseSchema = z.object({
  agentId: z.string().uuid(),
  requestId: z.string().uuid(),
  status: z.enum(['accepted', 'processing', 'completed', 'error']),
  itineraryStructure: z.object({
    duration: z.number().positive(),
    destinations: z.array(
      z.object({
        name: z.string(),
        type: z.enum(['primary', 'secondary', 'stopover']),
        duration: z.number().positive(),
        priority: z.enum(['high', 'medium', 'low']),
      })
    ),
    dailySchedule: z.array(
      z.object({
        day: z.number().positive(),
        theme: z.string(),
        activities: z.array(z.string()),
        meals: z.array(z.string()),
        accommodation: z.string().optional(),
      })
    ),
    transportation: z.object({
      segments: z.array(
        z.object({
          type: z.string(),
          from: z.string(),
          to: z.string(),
          duration: z.string(),
          cost: z.number().optional(),
        })
      ),
    }),
    budget: z.object({
      breakdown: z.object({
        accommodation: z.number(),
        activities: z.number(),
        dining: z.number(),
        transportation: z.number(),
        miscellaneous: z.number(),
      }),
      total: z.number(),
      confidence: z.number().min(0).max(1),
    }),
  }),
  metadata: z.object({
    processingTime: z.number().positive(),
    confidence: z.number().min(0).max(1),
    recommendations: z.array(z.string()),
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

describe('POST /api/agents/architect', () => {
  describe('Request Validation', () => {
    it('should accept valid architect request', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryData: {
          destination: 'Paris, France',
          startDate: '2025-06-01',
          endDate: '2025-06-07',
          travelers: {
            adults: 2,
            children: 0,
            seniors: 0,
          },
          budget: {
            total: 3000,
            currency: 'USD',
            flexibility: 'moderate',
          },
          preferences: {
            accommodation: ['boutique hotels', 'airbnb'],
            dining: ['local cuisine', 'fine dining'],
            activities: ['museums', 'walking tours'],
            transportation: ['metro', 'taxi'],
          },
          travelStyle: 'cultural',
          specialRequirements: ['vegetarian options'],
        },
        context: {
          previousAgents: [],
          constraints: ['budget conscious'],
          priority: 'normal',
        },
      };

      const response = await testApi.post('/api/agents/architect').send(requestBody).expect(202);

      expect(response.body).toBeDefined();
      const responseBody = AgentArchitectResponseSchema.parse(response.body);
      expect(responseBody.agentId).toBeDefined();
      expect(responseBody.requestId).toBe(requestBody.requestId);
      expect(['accepted', 'processing', 'completed']).toContain(responseBody.status);
    });

    it('should reject missing required fields', async () => {
      const invalidRequest = {
        // Missing required fields
        requestId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const response = await testApi.post('/api/agents/architect').send(invalidRequest).expect(400);

      const responseBody = ErrorResponseSchema.parse(response.body);
      expect(responseBody.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid request ID format', async () => {
      const invalidRequest = {
        requestId: 'invalid-uuid',
        itineraryData: {
          destination: 'Paris, France',
          startDate: '2025-06-01',
          endDate: '2025-06-07',
          travelers: { adults: 2, children: 0, seniors: 0 },
          budget: { total: 3000, currency: 'USD', flexibility: 'moderate' },
          preferences: {
            accommodation: ['hotel'],
            dining: ['restaurant'],
            activities: ['museum'],
            transportation: ['bus'],
          },
          travelStyle: 'cultural',
        },
        context: {
          priority: 'normal',
        },
      };

      const response = await testApi.post('/api/agents/architect').send(invalidRequest).expect(400);

      const responseBody = ErrorResponseSchema.parse(response.body);
      expect(responseBody.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid budget values', async () => {
      const invalidRequest = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryData: {
          destination: 'Paris, France',
          startDate: '2025-06-01',
          endDate: '2025-06-07',
          travelers: { adults: 2, children: 0, seniors: 0 },
          budget: {
            total: -100, // Invalid negative budget
            currency: 'USD',
            flexibility: 'moderate',
          },
          preferences: {
            accommodation: ['hotel'],
            dining: ['restaurant'],
            activities: ['museum'],
            transportation: ['bus'],
          },
          travelStyle: 'cultural',
        },
        context: {
          priority: 'normal',
        },
      };

      const response = await testApi.post('/api/agents/architect').send(invalidRequest).expect(400);

      const responseBody = ErrorResponseSchema.parse(response.body);
      expect(responseBody.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Response Format', () => {
    it('should return correct content type', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryData: {
          destination: 'Paris, France',
          startDate: '2025-06-01',
          endDate: '2025-06-07',
          travelers: { adults: 2, children: 0, seniors: 0 },
          budget: { total: 3000, currency: 'USD', flexibility: 'moderate' },
          preferences: {
            accommodation: ['hotel'],
            dining: ['restaurant'],
            activities: ['museum'],
            transportation: ['bus'],
          },
          travelStyle: 'cultural',
        },
        context: {
          priority: 'normal',
        },
      };

      const response = await testApi.post('/api/agents/architect').send(requestBody).expect(202);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should include CORS headers', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryData: {
          destination: 'Paris, France',
          startDate: '2025-06-01',
          endDate: '2025-06-07',
          travelers: { adults: 2, children: 0, seniors: 0 },
          budget: { total: 3000, currency: 'USD', flexibility: 'moderate' },
          preferences: {
            accommodation: ['hotel'],
            dining: ['restaurant'],
            activities: ['museum'],
            transportation: ['bus'],
          },
          travelStyle: 'cultural',
        },
        context: {
          priority: 'normal',
        },
      };

      const response = await testApi.post('/api/agents/architect').send(requestBody).expect(202);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });

  describe('Response Content', () => {
    it('should include complete itinerary structure', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryData: {
          destination: 'Paris, France',
          startDate: '2025-06-01',
          endDate: '2025-06-07',
          travelers: { adults: 2, children: 0, seniors: 0 },
          budget: { total: 3000, currency: 'USD', flexibility: 'moderate' },
          preferences: {
            accommodation: ['boutique hotels'],
            dining: ['local cuisine'],
            activities: ['museums', 'walking tours'],
            transportation: ['metro'],
          },
          travelStyle: 'cultural',
        },
        context: {
          priority: 'normal',
        },
      };

      const response = await testApi.post('/api/agents/architect').send(requestBody).expect(202);

      const responseBody = AgentArchitectResponseSchema.parse(response.body);

      // Validate itinerary structure
      expect(responseBody.itineraryStructure.duration).toBeGreaterThan(0);
      expect(responseBody.itineraryStructure.destinations.length).toBeGreaterThan(0);
      expect(responseBody.itineraryStructure.dailySchedule.length).toBeGreaterThan(0);

      // Validate budget breakdown
      expect(responseBody.itineraryStructure.budget.total).toBeGreaterThan(0);
      expect(responseBody.itineraryStructure.budget.confidence).toBeGreaterThanOrEqual(0);
      expect(responseBody.itineraryStructure.budget.confidence).toBeLessThanOrEqual(1);
    });

    it('should include agent metadata', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryData: {
          destination: 'Paris, France',
          startDate: '2025-06-01',
          endDate: '2025-06-07',
          travelers: { adults: 2, children: 0, seniors: 0 },
          budget: { total: 3000, currency: 'USD', flexibility: 'moderate' },
          preferences: {
            accommodation: ['hotel'],
            dining: ['restaurant'],
            activities: ['museum'],
            transportation: ['bus'],
          },
          travelStyle: 'cultural',
        },
        context: {
          priority: 'normal',
        },
      };

      const response = await testApi.post('/api/agents/architect').send(requestBody).expect(202);

      const responseBody = AgentArchitectResponseSchema.parse(response.body);

      // Validate metadata
      expect(responseBody.metadata.processingTime).toBeGreaterThan(0);
      expect(responseBody.metadata.confidence).toBeGreaterThanOrEqual(0);
      expect(responseBody.metadata.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(responseBody.metadata.recommendations)).toBe(true);
    });

    it('should handle different travel styles', async () => {
      const travelStyles = ['cultural', 'adventure', 'relaxation', 'foodie'];

      for (const style of travelStyles) {
        const requestBody = {
          requestId: '550e8400-e29b-41d4-a716-446655440000',
          itineraryData: {
            destination: 'Paris, France',
            startDate: '2025-06-01',
            endDate: '2025-06-07',
            travelers: { adults: 2, children: 0, seniors: 0 },
            budget: { total: 3000, currency: 'USD', flexibility: 'moderate' },
            preferences: {
              accommodation: ['hotel'],
              dining: ['restaurant'],
              activities: ['museum'],
              transportation: ['bus'],
            },
            travelStyle: style,
          },
          context: {
            priority: 'normal',
          },
        };

        const response = await testApi.post('/api/agents/architect').send(requestBody).expect(202);

        const responseBody = AgentArchitectResponseSchema.parse(response.body);
        expect(responseBody.itineraryStructure).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryData: {
          destination: 'Paris, France',
          startDate: '2025-06-01',
          endDate: '2025-06-07',
          travelers: { adults: 2, children: 0, seniors: 0 },
          budget: { total: 3000, currency: 'USD', flexibility: 'moderate' },
          preferences: {
            accommodation: ['hotel'],
            dining: ['restaurant'],
            activities: ['museum'],
            transportation: ['bus'],
          },
          travelStyle: 'cultural',
        },
        context: {
          priority: 'normal',
        },
      };

      // This should either return 202 (success) or 500 (server error - not implemented yet)
      await testApi
        .post('/api/agents/architect')
        .send(requestBody)
        .expect((res: any) => {
          expect([202, 500]).toContain(res.status);
        });
    });

    it('should handle malformed JSON', async () => {
      const response = await testApi
        .post('/api/agents/architect')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect((res: any) => {
          expect([400, 500]).toContain(res.status);
        });
    });
  });

  describe('Business Logic', () => {
    it('should respect budget constraints', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        itineraryData: {
          destination: 'Paris, France',
          startDate: '2025-06-01',
          endDate: '2025-06-07',
          travelers: { adults: 2, children: 0, seniors: 0 },
          budget: {
            total: 500, // Very low budget
            currency: 'USD',
            flexibility: 'strict',
          },
          preferences: {
            accommodation: ['hostel', 'budget hotel'],
            dining: ['street food', 'markets'],
            activities: ['free attractions'],
            transportation: ['public transport'],
          },
          travelStyle: 'budget',
        },
        context: {
          constraints: ['strict budget'],
          priority: 'normal',
        },
      };

      const response = await testApi.post('/api/agents/architect').send(requestBody).expect(202);

      const responseBody = AgentArchitectResponseSchema.parse(response.body);

      // Budget should be respected
      expect(responseBody.itineraryStructure.budget.total).toBeLessThanOrEqual(500);

      // Should include budget-focused recommendations
      expect(
        responseBody.metadata.recommendations.some(
          (rec: string) =>
            rec.toLowerCase().includes('budget') ||
            rec.toLowerCase().includes('saving') ||
            rec.toLowerCase().includes('affordable')
        )
      ).toBe(true);
    });

    it('should handle different traveler compositions', async () => {
      const travelerConfigs = [
        { adults: 1, children: 0, seniors: 0 }, // Solo traveler
        { adults: 2, children: 2, seniors: 0 }, // Family with kids
        { adults: 1, children: 0, seniors: 1 }, // Couple with senior
        { adults: 4, children: 0, seniors: 2 }, // Large group
      ];

      for (const travelers of travelerConfigs) {
        const requestBody = {
          requestId: '550e8400-e29b-41d4-a716-446655440000',
          itineraryData: {
            destination: 'Paris, France',
            startDate: '2025-06-01',
            endDate: '2025-06-07',
            travelers,
            budget: { total: 3000, currency: 'USD', flexibility: 'moderate' },
            preferences: {
              accommodation: ['hotel'],
              dining: ['restaurant'],
              activities: ['museum'],
              transportation: ['bus'],
            },
            travelStyle: 'cultural',
          },
          context: {
            priority: 'normal',
          },
        };

        const response = await testApi.post('/api/agents/architect').send(requestBody).expect(202);

        const responseBody = AgentArchitectResponseSchema.parse(response.body);
        expect(responseBody.itineraryStructure).toBeDefined();
      }
    });
  });
});

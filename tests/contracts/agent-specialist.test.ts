import { describe, it, expect } from 'vitest';
import { testApi } from '../utils/test-api';
import { z } from 'zod';

// Contract test for POST /api/agents/specialist
// Tests the agent specialist endpoint contract

const AgentSpecialistRequestSchema = z.object({
  requestId: z.string().uuid(),
  gatheredData: z.object({
    accommodation: z.array(z.any()).optional(),
    activities: z.array(z.any()).optional(),
    dining: z.array(z.any()).optional(),
    transportation: z.array(z.any()).optional(),
    weather: z.any().optional(),
    localTips: z.array(z.any()).optional(),
  }),
  specialization: z.enum([
    'cultural_expert',
    'food_specialist',
    'budget_advisor',
    'family_planner',
    'luxury_consultant',
    'adventure_guide',
    'wellness_expert',
    'business_traveler',
  ]),
  context: z.object({
    travelerProfile: z.object({
      preferences: z.array(z.string()),
      restrictions: z.array(z.string()).optional(),
      experience: z.enum(['first_time', 'experienced', 'expert']),
      groupComposition: z.object({
        adults: z.number(),
        children: z.number().optional(),
        seniors: z.number().optional(),
      }),
    }),
    tripGoals: z.array(z.string()),
    budget: z.object({
      total: z.number().positive(),
      currency: z.string(),
      flexibility: z.enum(['strict', 'moderate', 'flexible']),
    }),
    constraints: z.array(z.string()).optional(),
  }),
  focusAreas: z.array(
    z.enum([
      'accommodation_recommendations',
      'activity_curation',
      'dining_experiences',
      'transportation_planning',
      'itinerary_optimization',
      'budget_optimization',
      'local_insights',
      'safety_considerations',
    ])
  ),
});

const AgentSpecialistResponseSchema = z.object({
  agentId: z.string().uuid(),
  requestId: z.string().uuid(),
  status: z.enum(['accepted', 'processing', 'completed', 'error']),
  specialization: z.string(),
  recommendations: z.object({
    topPicks: z.array(
      z.object({
        category: z.string(),
        item: z.any(),
        reasoning: z.string(),
        confidence: z.number().min(0).max(1),
        priority: z.enum(['high', 'medium', 'low']),
      })
    ),
    itinerary: z.array(
      z.object({
        day: z.number().positive(),
        theme: z.string(),
        activities: z.array(
          z.object({
            name: z.string(),
            time: z.string(),
            duration: z.string(),
            location: z.string(),
            cost: z.number().optional(),
            booking: z.object({
              required: z.boolean(),
              url: z.string().optional(),
              notes: z.string().optional(),
            }),
            tips: z.array(z.string()).optional(),
          })
        ),
        dining: z.array(
          z.object({
            name: z.string(),
            type: z.string(),
            time: z.string(),
            reservation: z.boolean(),
            cost: z.string(),
            notes: z.string().optional(),
          })
        ),
        accommodation: z
          .object({
            name: z.string(),
            checkIn: z.string(),
            checkOut: z.string(),
            location: z.string(),
            amenities: z.array(z.string()),
            contact: z.string().optional(),
          })
          .optional(),
      })
    ),
    alternatives: z
      .array(
        z.object({
          category: z.string(),
          options: z.array(z.any()),
          criteria: z.string(),
        })
      )
      .optional(),
  }),
  insights: z.object({
    destination: z.object({
      highlights: z.array(z.string()),
      hidden_gems: z.array(z.string()),
      seasonal_considerations: z.array(z.string()),
      local_customs: z.array(z.string()),
    }),
    traveler: z.object({
      personalized_tips: z.array(z.string()),
      potential_challenges: z.array(z.string()),
      optimization_opportunities: z.array(z.string()),
    }),
    practical: z.object({
      transportation_tips: z.array(z.string()),
      safety_notes: z.array(z.string()),
      communication: z.array(z.string()),
      emergency_contacts: z.array(z.string()).optional(),
    }),
  }),
  metadata: z.object({
    processingTime: z.number().positive(),
    specialization_used: z.string(),
    data_sources: z.array(z.string()),
    confidence: z.object({
      overall: z.number().min(0).max(1),
      recommendations: z.number().min(0).max(1),
      insights: z.number().min(0).max(1),
    }),
    lastUpdated: z.string(),
    version: z.string(),
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

describe('POST /api/agents/specialist', () => {
  describe('Request Validation', () => {
    it('should accept valid specialist request', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        gatheredData: {
          accommodation: [
            { name: 'Hotel A', priceRange: '$$', rating: 4.5 },
            { name: 'Hotel B', priceRange: '$$$', rating: 4.8 },
          ],
          activities: [
            { name: 'Museum Visit', category: 'Cultural', price: 20 },
            { name: 'City Tour', category: 'Sightseeing', price: 35 },
          ],
        },
        specialization: 'cultural_expert',
        context: {
          travelerProfile: {
            preferences: ['cultural', 'historical'],
            experience: 'experienced',
            groupComposition: { adults: 2 },
          },
          tripGoals: ['cultural immersion', 'photography'],
          budget: {
            total: 3000,
            currency: 'USD',
            flexibility: 'moderate',
          },
        },
        focusAreas: ['activity_curation', 'itinerary_optimization'],
      };

      const response = await testApi.post('/api/agents/specialist').send(requestBody).expect(202);

      expect(response.body).toBeDefined();
      const responseBody = AgentSpecialistResponseSchema.parse(response.body);
      expect(responseBody.agentId).toBeDefined();
      expect(responseBody.requestId).toBe(requestBody.requestId);
      expect(['accepted', 'processing', 'completed']).toContain(responseBody.status);
    });

    it('should reject missing required fields', async () => {
      const invalidRequest = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        // Missing gatheredData, specialization, context, focusAreas
      };

      const response = await testApi
        .post('/api/agents/specialist')
        .send(invalidRequest)
        .expect(400);

      const responseBody = ErrorResponseSchema.parse(response.body);
      expect(responseBody.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid request ID format', async () => {
      const invalidRequest = {
        requestId: 'invalid-uuid',
        gatheredData: { accommodation: [] },
        specialization: 'cultural_expert',
        context: {
          travelerProfile: {
            preferences: [],
            experience: 'first_time',
            groupComposition: { adults: 1 },
          },
          tripGoals: ['sightseeing'],
          budget: { total: 2000, currency: 'USD', flexibility: 'moderate' },
        },
        focusAreas: ['activity_curation'],
      };

      const response = await testApi
        .post('/api/agents/specialist')
        .send(invalidRequest)
        .expect(400);

      const responseBody = ErrorResponseSchema.parse(response.body);
      expect(responseBody.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid specialization type', async () => {
      const invalidRequest = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        gatheredData: { accommodation: [] },
        specialization: 'invalid_specialization',
        context: {
          travelerProfile: {
            preferences: [],
            experience: 'first_time',
            groupComposition: { adults: 1 },
          },
          tripGoals: ['sightseeing'],
          budget: { total: 2000, currency: 'USD', flexibility: 'moderate' },
        },
        focusAreas: ['activity_curation'],
      };

      const response = await testApi
        .post('/api/agents/specialist')
        .send(invalidRequest)
        .expect(400);

      const responseBody = ErrorResponseSchema.parse(response.body);
      expect(responseBody.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Response Format', () => {
    it('should return correct content type', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        gatheredData: { accommodation: [], activities: [] },
        specialization: 'cultural_expert',
        context: {
          travelerProfile: {
            preferences: ['cultural'],
            experience: 'experienced',
            groupComposition: { adults: 2 },
          },
          tripGoals: ['cultural immersion'],
          budget: { total: 3000, currency: 'USD', flexibility: 'moderate' },
        },
        focusAreas: ['activity_curation'],
      };

      const response = await testApi.post('/api/agents/specialist').send(requestBody).expect(202);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should include CORS headers', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        gatheredData: { accommodation: [] },
        specialization: 'food_specialist',
        context: {
          travelerProfile: {
            preferences: ['foodie'],
            experience: 'first_time',
            groupComposition: { adults: 2 },
          },
          tripGoals: ['culinary exploration'],
          budget: { total: 2500, currency: 'USD', flexibility: 'flexible' },
        },
        focusAreas: ['dining_experiences'],
      };

      const response = await testApi.post('/api/agents/specialist').send(requestBody).expect(202);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });

  describe('Response Content', () => {
    it('should include comprehensive recommendations', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        gatheredData: {
          accommodation: [
            {
              name: 'Cultural Hotel',
              priceRange: '$$',
              rating: 4.5,
              amenities: ['Cultural tours'],
            },
          ],
          activities: [
            { name: 'Museum Tour', category: 'Cultural', price: 25 },
            { name: 'Historical Walk', category: 'Cultural', price: 15 },
          ],
        },
        specialization: 'cultural_expert',
        context: {
          travelerProfile: {
            preferences: ['cultural', 'historical'],
            experience: 'experienced',
            groupComposition: { adults: 2 },
          },
          tripGoals: ['cultural immersion', 'learning'],
          budget: { total: 3000, currency: 'USD', flexibility: 'moderate' },
        },
        focusAreas: ['activity_curation', 'itinerary_optimization'],
      };

      const response = await testApi.post('/api/agents/specialist').send(requestBody).expect(202);

      const responseBody = AgentSpecialistResponseSchema.parse(response.body);

      // Validate recommendations structure
      expect(responseBody.recommendations.topPicks).toBeDefined();
      expect(Array.isArray(responseBody.recommendations.topPicks)).toBe(true);
      expect(responseBody.recommendations.itinerary).toBeDefined();
      expect(Array.isArray(responseBody.recommendations.itinerary)).toBe(true);

      // Validate insights structure
      expect(responseBody.insights.destination).toBeDefined();
      expect(responseBody.insights.traveler).toBeDefined();
      expect(responseBody.insights.practical).toBeDefined();
    });

    it('should include detailed metadata', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        gatheredData: { accommodation: [], activities: [] },
        specialization: 'budget_advisor',
        context: {
          travelerProfile: {
            preferences: ['budget'],
            experience: 'first_time',
            groupComposition: { adults: 2 },
          },
          tripGoals: ['affordable travel'],
          budget: { total: 1500, currency: 'USD', flexibility: 'strict' },
        },
        focusAreas: ['budget_optimization'],
      };

      const response = await testApi.post('/api/agents/specialist').send(requestBody).expect(202);

      const responseBody = AgentSpecialistResponseSchema.parse(response.body);

      // Validate metadata
      expect(responseBody.metadata.processingTime).toBeGreaterThan(0);
      expect(responseBody.metadata.specialization_used).toBeDefined();
      expect(Array.isArray(responseBody.metadata.data_sources)).toBe(true);
      expect(responseBody.metadata.confidence.overall).toBeGreaterThanOrEqual(0);
      expect(responseBody.metadata.confidence.overall).toBeLessThanOrEqual(1);
      expect(typeof responseBody.metadata.lastUpdated).toBe('string');
    });

    it('should handle different specializations', async () => {
      const specializations = [
        'cultural_expert',
        'food_specialist',
        'budget_advisor',
        'family_planner',
      ];

      for (const spec of specializations) {
        const requestBody = {
          requestId: '550e8400-e29b-41d4-a716-446655440000',
          gatheredData: { accommodation: [], activities: [] },
          specialization: spec,
          context: {
            travelerProfile: {
              preferences: ['general'],
              experience: 'first_time',
              groupComposition: { adults: 2 },
            },
            tripGoals: ['enjoyable trip'],
            budget: { total: 2500, currency: 'USD', flexibility: 'moderate' },
          },
          focusAreas: ['itinerary_optimization'],
        };

        const response = await testApi.post('/api/agents/specialist').send(requestBody).expect(202);

        const responseBody = AgentSpecialistResponseSchema.parse(response.body);
        expect(responseBody.specialization).toBe(spec);
        expect(responseBody.recommendations).toBeDefined();
        expect(responseBody.insights).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        gatheredData: { accommodation: [] },
        specialization: 'cultural_expert',
        context: {
          travelerProfile: {
            preferences: [],
            experience: 'first_time',
            groupComposition: { adults: 1 },
          },
          tripGoals: ['sightseeing'],
          budget: { total: 2000, currency: 'USD', flexibility: 'moderate' },
        },
        focusAreas: ['activity_curation'],
      };

      await testApi
        .post('/api/agents/specialist')
        .send(requestBody)
        .expect((res: any) => {
          expect([202, 500]).toContain(res.status);
        });
    });

    it('should handle malformed JSON', async () => {
      await testApi
        .post('/api/agents/specialist')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect((res: any) => {
          expect([400, 500]).toContain(res.status);
        });
    });
  });

  describe('Business Logic', () => {
    it('should tailor recommendations to specialization', async () => {
      const testCases = [
        {
          specialization: 'cultural_expert',
          expectedFocus: 'cultural activities',
          preferences: ['cultural', 'historical'],
        },
        {
          specialization: 'food_specialist',
          expectedFocus: 'dining experiences',
          preferences: ['foodie', 'local cuisine'],
        },
        {
          specialization: 'budget_advisor',
          expectedFocus: 'cost optimization',
          preferences: ['budget', 'affordable'],
        },
      ];

      for (const testCase of testCases) {
        const requestBody = {
          requestId: '550e8400-e29b-41d4-a716-446655440000',
          gatheredData: {
            activities: [{ name: 'Generic Activity', category: 'General', price: 30 }],
            dining: [{ name: 'Generic Restaurant', cuisine: 'General', priceRange: '$$' }],
          },
          specialization: testCase.specialization,
          context: {
            travelerProfile: {
              preferences: testCase.preferences,
              experience: 'experienced',
              groupComposition: { adults: 2 },
            },
            tripGoals: ['personalized experience'],
            budget: { total: 2500, currency: 'USD', flexibility: 'moderate' },
          },
          focusAreas: ['activity_curation', 'dining_experiences'],
        };

        const response = await testApi.post('/api/agents/specialist').send(requestBody).expect(202);

        const responseBody = AgentSpecialistResponseSchema.parse(response.body);
        expect(responseBody.specialization).toBe(testCase.specialization);
        expect(responseBody.recommendations.topPicks.length).toBeGreaterThan(0);
      }
    });

    it('should respect focus areas', async () => {
      const requestBody = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        gatheredData: {
          accommodation: [{ name: 'Hotel', priceRange: '$$', rating: 4.0 }],
          activities: [{ name: 'Activity', category: 'General', price: 25 }],
          dining: [{ name: 'Restaurant', cuisine: 'General', priceRange: '$$' }],
        },
        specialization: 'cultural_expert',
        context: {
          travelerProfile: {
            preferences: ['cultural'],
            experience: 'experienced',
            groupComposition: { adults: 2 },
          },
          tripGoals: ['cultural experience'],
          budget: { total: 3000, currency: 'USD', flexibility: 'moderate' },
        },
        focusAreas: ['activity_curation'], // Only focus on activities
      };

      const response = await testApi.post('/api/agents/specialist').send(requestBody).expect(202);

      const responseBody = AgentSpecialistResponseSchema.parse(response.body);

      // Should prioritize activity recommendations
      const activityPicks = responseBody.recommendations.topPicks.filter((pick: any) =>
        pick.category.toLowerCase().includes('activit')
      );
      expect(activityPicks.length).toBeGreaterThan(0);
    });

    it('should handle different traveler profiles', async () => {
      const profiles = [
        { adults: 1, experience: 'first_time', preferences: ['solo', 'exploration'] },
        {
          adults: 2,
          children: 2,
          experience: 'experienced',
          preferences: ['family', 'educational'],
        },
        { adults: 2, seniors: 1, experience: 'expert', preferences: ['comfortable', 'cultural'] },
      ];

      for (const profile of profiles) {
        const requestBody = {
          requestId: '550e8400-e29b-41d4-a716-446655440000',
          gatheredData: { accommodation: [], activities: [] },
          specialization: 'family_planner',
          context: {
            travelerProfile: {
              preferences: profile.preferences,
              experience: profile.experience,
              groupComposition: {
                adults: profile.adults,
                children: profile.children || 0,
                seniors: profile.seniors || 0,
              },
            },
            tripGoals: ['enjoyable trip'],
            budget: { total: 3000, currency: 'USD', flexibility: 'moderate' },
          },
          focusAreas: ['itinerary_optimization'],
        };

        const response = await testApi.post('/api/agents/specialist').send(requestBody).expect(202);

        const responseBody = AgentSpecialistResponseSchema.parse(response.body);
        expect(responseBody.recommendations.itinerary).toBeDefined();
        expect(responseBody.insights.traveler.personalized_tips).toBeDefined();
      }
    });
  });
});

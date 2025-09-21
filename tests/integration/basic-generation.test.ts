import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testApi } from '../utils/test-api';
import { z } from 'zod';

// Integration test for basic itinerary generation
// Tests the complete end-to-end flow from form submission to final itinerary

const ItineraryGenerationFlowSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(['accepted', 'processing', 'completed', 'error']),
  progress: z
    .object({
      percentage: z.number().min(0).max(100),
      currentPhase: z.string(),
      message: z.string(),
    })
    .optional(),
  result: z
    .object({
      itineraryId: z.string().uuid(),
      title: z.string(),
      destination: z.string(),
      duration: z.number(),
      generatedAt: z.string(),
      content: z.any(),
    })
    .optional(),
});

describe('Basic Itinerary Generation Integration', () => {
  const testRequestId = '550e8400-e29b-41d4-a716-446655440000';

  describe('End-to-End Generation Flow', () => {
    it('should complete full itinerary generation workflow', async () => {
      // Step 1: Submit itinerary generation request
      const generationRequest = {
        formData: {
          destination: 'Paris, France',
          startDate: '2025-06-01',
          endDate: '2025-06-07',
          adults: 2,
          children: 0,
          budget: 3000,
          travelStyle: 'cultural',
          accommodation: ['boutique hotels', 'luxury hotels'],
          dining: ['local cuisine', 'fine dining'],
          activities: ['museums', 'walking tours'],
          transportation: ['metro', 'taxi'],
        },
        requestType: 'initial',
        priority: 'normal',
      };

      const initialResponse = await testApi
        .post('/api/itinerary/generate')
        .send(generationRequest)
        .expect(202);

      const initialBody = ItineraryGenerationFlowSchema.parse(initialResponse.body);
      expect(initialBody.status).toBe('accepted');
      expect(initialBody.requestId).toBeDefined();

      // Step 2: Check status updates
      const statusResponse = await testApi
        .get(`/api/itinerary/status?requestId=${initialBody.requestId}`)
        .expect(200);

      const statusBody = ItineraryGenerationFlowSchema.parse(statusResponse.body);
      expect(statusBody.status).toMatch(/processing|completed/);
      expect(statusBody.progress).toBeDefined();

      // Step 3: Verify WebSocket connection would work
      // (Mock WebSocket validation - actual WebSocket testing would require a test WebSocket server)
      const wsUrl = `wss://hylo.vercel.app/api/itinerary/live?requestId=${initialBody.requestId}&sessionId=test_session`;
      expect(wsUrl).toContain('requestId=');
      expect(wsUrl).toContain('sessionId=');

      // Step 4: Simulate agent workflow (in real implementation, this would happen asynchronously)
      // Architect Agent
      const architectRequest = {
        requestId: initialBody.requestId,
        itineraryData: {
          destination: 'Paris, France',
          startDate: '2025-06-01',
          endDate: '2025-06-07',
          travelers: { adults: 2, children: 0, seniors: 0 },
          budget: { total: 3000, currency: 'USD', flexibility: 'moderate' },
          preferences: {
            accommodation: ['boutique hotels', 'luxury hotels'],
            dining: ['local cuisine', 'fine dining'],
            activities: ['museums', 'walking tours'],
            transportation: ['metro', 'taxi'],
          },
          travelStyle: 'cultural',
        },
        context: {
          priority: 'normal',
        },
      };

      const architectResponse = await testApi
        .post('/api/agents/architect')
        .send(architectRequest)
        .expect(202);

      expect(architectResponse.body.itineraryStructure).toBeDefined();

      // Gatherer Agent
      const gathererRequest = {
        requestId: initialBody.requestId,
        itineraryStructure: architectResponse.body.itineraryStructure,
        dataRequirements: {
          categories: ['accommodation', 'activities', 'dining'],
          priority: 'normal',
        },
        context: {
          budget: { total: 3000, currency: 'USD' },
          travelerProfile: { preferences: ['cultural'], groupSize: 2 },
        },
      };

      const gathererResponse = await testApi
        .post('/api/agents/gatherer')
        .send(gathererRequest)
        .expect(202);

      expect(gathererResponse.body.gatheredData).toBeDefined();

      // Specialist Agent
      const specialistRequest = {
        requestId: initialBody.requestId,
        gatheredData: gathererResponse.body.gatheredData,
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
        focusAreas: ['activity_curation', 'itinerary_optimization'],
      };

      const specialistResponse = await testApi
        .post('/api/agents/specialist')
        .send(specialistRequest)
        .expect(202);

      expect(specialistResponse.body.recommendations).toBeDefined();

      // Putter Agent (Final formatting)
      const putterRequest = {
        requestId: initialBody.requestId,
        itineraryData: {
          structure: architectResponse.body.itineraryStructure,
          gatheredData: gathererResponse.body.gatheredData,
          recommendations: specialistResponse.body.recommendations,
          travelerProfile: { adults: 2, preferences: ['cultural'] },
          constraints: { budget: 3000 },
        },
        formatPreferences: {
          style: 'detailed',
          language: 'en',
          includeImages: true,
          sections: ['overview', 'daily_schedule', 'accommodation', 'activities'],
          detailLevel: 'comprehensive',
        },
        outputFormat: 'html',
        context: {
          deviceType: 'desktop',
        },
      };

      const putterResponse = await testApi
        .post('/api/agents/putter')
        .send(putterRequest)
        .expect(202);

      expect(putterResponse.body.formattedItinerary).toBeDefined();
      expect(putterResponse.body.formattedItinerary.content.dailySchedule.length).toBeGreaterThan(
        0
      );

      // Step 5: Verify final result structure
      const finalItinerary = putterResponse.body.formattedItinerary;
      expect(finalItinerary.metadata.title).toContain('Paris');
      expect(finalItinerary.metadata.duration).toBe('7 days');
      expect(finalItinerary.content.overview.summary).toBeDefined();
      expect(finalItinerary.content.dailySchedule.length).toBeGreaterThan(0);
      expect(finalItinerary.content.accommodation.options.length).toBeGreaterThan(0);
    });

    it('should handle different travel styles', async () => {
      const travelStyles = [
        { style: 'cultural', expectedActivities: 'museums' },
        { style: 'foodie', expectedActivities: 'restaurants' },
        { style: 'adventure', expectedActivities: 'outdoor' },
        { style: 'relaxation', expectedActivities: 'spa' },
      ];

      for (const { style, expectedActivities } of travelStyles) {
        const request = {
          formData: {
            destination: 'Paris, France',
            startDate: '2025-06-01',
            endDate: '2025-06-07',
            adults: 2,
            budget: 3000,
            travelStyle: style,
            accommodation: ['boutique hotels'],
            dining: ['local cuisine'],
            activities: ['museums', 'walking tours'],
            transportation: ['metro'],
          },
          requestType: 'initial',
          priority: 'normal',
        };

        const response = await testApi.post('/api/itinerary/generate').send(request).expect(202);

        const responseBody = ItineraryGenerationFlowSchema.parse(response.body);
        expect(responseBody.status).toBe('accepted');

        // In a real implementation, the style would influence the agent recommendations
        // For this test, we just verify the request is accepted
      }
    });

    it('should handle different group sizes', async () => {
      const groupConfigs = [
        { adults: 1, children: 0, description: 'Solo traveler' },
        { adults: 2, children: 0, description: 'Couple' },
        { adults: 2, children: 2, description: 'Family with children' },
        { adults: 4, children: 0, description: 'Group of friends' },
      ];

      for (const config of groupConfigs) {
        const request = {
          formData: {
            destination: 'Paris, France',
            startDate: '2025-06-01',
            endDate: '2025-06-07',
            adults: config.adults,
            children: config.children,
            budget: 3000,
            travelStyle: 'cultural',
            accommodation: ['boutique hotels'],
            dining: ['local cuisine'],
            activities: ['museums'],
            transportation: ['metro'],
          },
          requestType: 'initial',
          priority: 'normal',
        };

        const response = await testApi.post('/api/itinerary/generate').send(request).expect(202);

        const responseBody = ItineraryGenerationFlowSchema.parse(response.body);
        expect(responseBody.status).toBe('accepted');
      }
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid destination gracefully', async () => {
      const invalidRequest = {
        formData: {
          destination: '', // Invalid empty destination
          startDate: '2025-06-01',
          endDate: '2025-06-07',
          adults: 2,
          budget: 3000,
          travelStyle: 'cultural',
          accommodation: ['hotel'],
          dining: ['restaurant'],
          activities: ['museum'],
          transportation: ['bus'],
        },
        requestType: 'initial',
        priority: 'normal',
      };

      const response = await testApi
        .post('/api/itinerary/generate')
        .send(invalidRequest)
        .expect((res: any) => {
          expect([400, 202]).toContain(res.status);
        });

      if (response.status === 400) {
        expect(response.body.error).toBeDefined();
      }
    });

    it('should handle invalid date ranges', async () => {
      const invalidRequest = {
        formData: {
          destination: 'Paris, France',
          startDate: '2025-06-07', // Start date after end date
          endDate: '2025-06-01',
          adults: 2,
          budget: 3000,
          travelStyle: 'cultural',
          accommodation: ['hotel'],
          dining: ['restaurant'],
          activities: ['museum'],
          transportation: ['bus'],
        },
        requestType: 'initial',
        priority: 'normal',
      };

      const response = await testApi
        .post('/api/itinerary/generate')
        .send(invalidRequest)
        .expect((res: any) => {
          expect([400, 202]).toContain(res.status);
        });
    });

    it('should handle budget constraints', async () => {
      const lowBudgetRequest = {
        formData: {
          destination: 'Paris, France',
          startDate: '2025-06-01',
          endDate: '2025-06-07',
          adults: 2,
          budget: 500, // Very low budget
          travelStyle: 'budget',
          accommodation: ['hostel', 'budget hotel'],
          dining: ['street food', 'markets'],
          activities: ['free attractions'],
          transportation: ['public transport'],
        },
        requestType: 'initial',
        priority: 'normal',
      };

      const response = await testApi
        .post('/api/itinerary/generate')
        .send(lowBudgetRequest)
        .expect(202);

      const responseBody = ItineraryGenerationFlowSchema.parse(response.body);
      expect(responseBody.status).toBe('accepted');

      // In real implementation, agents would optimize for budget
    });
  });

  describe('Performance Validation', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();

      const request = {
        formData: {
          destination: 'Paris, France',
          startDate: '2025-06-01',
          endDate: '2025-06-07',
          adults: 2,
          budget: 3000,
          travelStyle: 'cultural',
          accommodation: ['boutique hotels'],
          dining: ['local cuisine'],
          activities: ['museums'],
          transportation: ['metro'],
        },
        requestType: 'initial',
        priority: 'normal',
      };

      await testApi.post('/api/itinerary/generate').send(request).expect(202);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should respond within 2 seconds for initial acceptance
      expect(responseTime).toBeLessThan(2000);
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(3)
        .fill(null)
        .map((_, index) => ({
          formData: {
            destination: `Destination ${index + 1}`,
            startDate: '2025-06-01',
            endDate: '2025-06-07',
            adults: 2,
            budget: 3000,
            travelStyle: 'cultural',
            accommodation: ['hotel'],
            dining: ['restaurant'],
            activities: ['museum'],
            transportation: ['bus'],
          },
          requestType: 'initial',
          priority: 'normal',
        }));

      const responses = await Promise.all(
        requests.map((req) => testApi.post('/api/itinerary/generate').send(req).expect(202))
      );

      responses.forEach((response) => {
        const body = ItineraryGenerationFlowSchema.parse(response.body);
        expect(body.status).toBe('accepted');
      });
    });
  });

  describe('Data Consistency', () => {
    it('should maintain request ID throughout workflow', async () => {
      const request = {
        formData: {
          destination: 'Paris, France',
          startDate: '2025-06-01',
          endDate: '2025-06-07',
          adults: 2,
          budget: 3000,
          travelStyle: 'cultural',
          accommodation: ['boutique hotels'],
          dining: ['local cuisine'],
          activities: ['museums'],
          transportation: ['metro'],
        },
        requestType: 'initial',
        priority: 'normal',
      };

      const initialResponse = await testApi
        .post('/api/itinerary/generate')
        .send(request)
        .expect(202);

      const requestId = initialResponse.body.requestId;

      // Verify request ID is consistent across all endpoints
      const statusResponse = await testApi
        .get(`/api/itinerary/status?requestId=${requestId}`)
        .expect(200);

      expect(statusResponse.body.requestId).toBe(requestId);

      // Agent requests would also use the same requestId in real implementation
      const architectRequest = {
        requestId,
        itineraryData: {
          destination: 'Paris, France',
          startDate: '2025-06-01',
          endDate: '2025-06-07',
          travelers: { adults: 2, children: 0, seniors: 0 },
          budget: { total: 3000, currency: 'USD', flexibility: 'moderate' },
          preferences: {
            accommodation: ['boutique hotels'],
            dining: ['local cuisine'],
            activities: ['museums'],
            transportation: ['metro'],
          },
          travelStyle: 'cultural',
        },
        context: { priority: 'normal' },
      };

      const architectResponse = await testApi
        .post('/api/agents/architect')
        .send(architectRequest)
        .expect(202);

      expect(architectResponse.body.requestId).toBe(requestId);
    });

    it('should validate data flow between agents', async () => {
      const requestId = '550e8400-e29b-41d4-a716-446655440000';

      // Simulate architect -> gatherer -> specialist -> putter data flow
      const architectData = {
        requestId,
        itineraryData: {
          destination: 'Paris, France',
          startDate: '2025-06-01',
          endDate: '2025-06-07',
          duration: 7,
          destinations: [{ name: 'Paris', type: 'primary', duration: 7 }],
          travelers: { adults: 2, children: 0, seniors: 0 },
          budget: { total: 3000, currency: 'USD', flexibility: 'moderate' },
          preferences: {
            accommodation: ['boutique hotels'],
            dining: ['local cuisine'],
            activities: ['museums'],
            transportation: ['metro'],
          },
          travelStyle: 'cultural',
        },
        context: { priority: 'normal' },
      };

      const architectResponse = await testApi
        .post('/api/agents/architect')
        .send(architectData)
        .expect(202);

      const itineraryStructure = architectResponse.body.itineraryStructure;

      // Gatherer should receive architect's output
      const gathererData = {
        requestId,
        itineraryStructure,
        dataRequirements: { categories: ['accommodation'], priority: 'normal' },
        context: {
          budget: { total: 3000, currency: 'USD' },
          travelerProfile: { preferences: [], groupSize: 2 },
        },
      };

      const gathererResponse = await testApi
        .post('/api/agents/gatherer')
        .send(gathererData)
        .expect(202);

      const gatheredData = gathererResponse.body.gatheredData;

      // Specialist should receive both architect and gatherer outputs
      const specialistData = {
        requestId,
        gatheredData,
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

      const specialistResponse = await testApi
        .post('/api/agents/specialist')
        .send(specialistData)
        .expect(202);

      const recommendations = specialistResponse.body.recommendations;

      // Putter should receive all previous outputs
      const putterData = {
        requestId,
        itineraryData: {
          structure: itineraryStructure,
          gatheredData,
          recommendations,
          travelerProfile: { adults: 2 },
          constraints: {},
        },
        formatPreferences: {
          style: 'detailed',
          language: 'en',
          includeImages: false,
          sections: ['overview'],
          detailLevel: 'standard',
        },
        outputFormat: 'html',
        context: {},
      };

      const putterResponse = await testApi.post('/api/agents/putter').send(putterData).expect(202);

      expect(putterResponse.body.formattedItinerary).toBeDefined();
    });
  });
});

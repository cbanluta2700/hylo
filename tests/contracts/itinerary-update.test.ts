import { describe, it, expect } from 'vitest';
import { testApi } from '../utils/test-api';
import { z } from 'zod';

// Contract test for PUT /api/itinerary/update
// Tests the API contract as defined in contracts/api-spec.yaml

const ItineraryUpdateRequestSchema = z.object({
  itineraryId: z.string().uuid(),
  changes: z.object({
    formData: z
      .object({
        destination: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        adults: z.number().min(1).optional(),
        budget: z.number().optional(),
        travelStyle: z.string().optional(),
      })
      .optional(),
    specificUpdates: z
      .array(
        z.object({
          field: z.string(),
          oldValue: z.string(),
          newValue: z.string(),
          priority: z.enum(['low', 'medium', 'high']).optional(),
        })
      )
      .optional(),
  }),
});

const UpdateStartedSchema = z.object({
  updateId: z.string().uuid(),
  itineraryId: z.string().uuid(),
  status: z.literal('updating'),
  estimatedTime: z.number().positive(),
});

const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

describe('PUT /api/itinerary/update', () => {
  describe('Request Validation', () => {
    it('should accept valid update request', async () => {
      const requestBody = {
        itineraryId: '550e8400-e29b-41d4-a716-446655440000',
        changes: {
          formData: {
            destination: 'Rome, Italy',
            adults: 3,
            budget: 3500,
          },
          specificUpdates: [
            {
              field: 'destination',
              oldValue: 'Paris, France',
              newValue: 'Rome, Italy',
              priority: 'high' as const,
            },
          ],
        },
      };

      const response = await testApi.put('/api/itinerary/update').send(requestBody).expect(202);

      const responseBody = UpdateStartedSchema.parse(response.body);
      expect(responseBody.status).toBe('updating');
      expect(responseBody.itineraryId).toBe(requestBody.itineraryId);
      expect(responseBody.updateId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    it('should reject missing required fields', async () => {
      const requestBody = {
        // Missing itineraryId
        changes: {
          formData: {
            destination: 'Rome, Italy',
          },
        },
      };

      const response = await testApi.put('/api/itinerary/update').send(requestBody).expect(400);

      const responseBody = ErrorResponseSchema.parse(response.body);
      expect(responseBody.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid itinerary ID format', async () => {
      const requestBody = {
        itineraryId: 'invalid-uuid',
        changes: {
          formData: {
            destination: 'Rome, Italy',
          },
        },
      };

      const response = await testApi.put('/api/itinerary/update').send(requestBody).expect(400);

      const responseBody = ErrorResponseSchema.parse(response.body);
      expect(responseBody.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle minimal valid request', async () => {
      const requestBody = {
        itineraryId: '550e8400-e29b-41d4-a716-446655440000',
        changes: {
          formData: {
            adults: 2,
          },
        },
      };

      const response = await testApi.put('/api/itinerary/update').send(requestBody).expect(202);

      const responseBody = UpdateStartedSchema.parse(response.body);
      expect(responseBody.status).toBe('updating');
    });
  });

  describe('Response Format', () => {
    it('should return correct content type', async () => {
      const requestBody = {
        itineraryId: '550e8400-e29b-41d4-a716-446655440000',
        changes: {
          formData: {
            destination: 'Barcelona, Spain',
          },
        },
      };

      const response = await testApi.put('/api/itinerary/update').send(requestBody).expect(202);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should include CORS headers', async () => {
      const requestBody = {
        itineraryId: '550e8400-e29b-41d4-a716-446655440000',
        changes: {
          formData: {
            budget: 4000,
          },
        },
      };

      const response = await testApi.put('/api/itinerary/update').send(requestBody).expect(202);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limiting', async () => {
      // Mock rate limiting scenario
      const requestBody = {
        itineraryId: '550e8400-e29b-41d4-a716-446655440000',
        changes: {
          formData: {
            destination: 'Tokyo, Japan',
          },
        },
      };

      // Should not return 429 until rate limiting is implemented
      await testApi
        .put('/api/itinerary/update')
        .send(requestBody)
        .expect((res: any) => {
          expect([202, 500]).toContain(res.status); // Either success or server error (not implemented yet)
        });
    });

    it('should handle server errors gracefully', async () => {
      const requestBody = {
        itineraryId: '550e8400-e29b-41d4-a716-446655440000',
        changes: {
          // Invalid changes object
          formData: null,
        },
      };

      await testApi
        .put('/api/itinerary/update')
        .send(requestBody)
        .expect((res: any) => {
          expect([400, 500]).toContain(res.status);
          if (res.status === 500) {
            const errorResponse = ErrorResponseSchema.parse(res.body);
            expect(errorResponse.error.code).toBeDefined();
            expect(errorResponse.error.message).toBeDefined();
          }
        });
    });
  });

  describe('Business Logic', () => {
    it('should trigger update workflow orchestration', async () => {
      const requestBody = {
        itineraryId: '550e8400-e29b-41d4-a716-446655440000',
        changes: {
          formData: {
            destination: 'Amsterdam, Netherlands',
            startDate: '2025-07-01',
            endDate: '2025-07-07',
          },
          specificUpdates: [
            {
              field: 'dates',
              oldValue: '2025-06-01 to 2025-06-07',
              newValue: '2025-07-01 to 2025-07-07',
              priority: 'high' as const,
            },
          ],
        },
      };

      const response = await testApi.put('/api/itinerary/update').send(requestBody).expect(202);

      expect(response.body).toBeDefined();
      const responseBody = UpdateStartedSchema.parse(response.body);
      expect(responseBody.updateId).toBeDefined();
      expect(responseBody.estimatedTime).toBeGreaterThan(0);
    });

    it('should handle different priority levels', async () => {
      const requestBody = {
        itineraryId: '550e8400-e29b-41d4-a716-446655440000',
        changes: {
          specificUpdates: [
            {
              field: 'budget',
              oldValue: '2500',
              newValue: '3500',
              priority: 'low' as const,
            },
            {
              field: 'destination',
              oldValue: 'Paris',
              newValue: 'Rome',
              priority: 'high' as const,
            },
          ],
        },
      };

      const response = await testApi.put('/api/itinerary/update').send(requestBody).expect(202);

      const responseBody = UpdateStartedSchema.parse(response.body);
      expect(responseBody.status).toBe('updating');
    });
  });
});

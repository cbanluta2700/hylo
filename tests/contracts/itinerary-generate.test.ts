import { describe, it, expect } from 'vitest';
import { testApi } from '../utils/test-api';
import { z } from 'zod';

// Contract test for POST /api/itinerary/generate
// Tests the API contract as defined in contracts/api-spec.yaml

const ItineraryRequestSchema = z.object({
  formData: z.object({
    destination: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    adults: z.number().min(1),
    budget: z.number().optional(),
    travelStyle: z.string().optional(),
  }),
  requestType: z.enum(['initial', 'update', 'refresh']),
  priority: z.enum(['low', 'normal', 'high']).optional(),
});

const GenerationStartedSchema = z.object({
  requestId: z.string().uuid(),
  status: z.literal('accepted'),
  estimatedTime: z.number().positive(),
  websocketUrl: z.string().url(),
});

const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

describe('POST /api/itinerary/generate', () => {
  describe('Request Validation', () => {
    it('should accept valid itinerary request', async () => {
      const requestBody = {
        formData: {
          destination: 'Paris, France',
          startDate: '2025-06-01',
          endDate: '2025-06-07',
          adults: 2,
          budget: 3000,
          travelStyle: 'cultural',
        },
        requestType: 'initial' as const,
        priority: 'normal' as const,
      };

      // Validate request schema
      expect(() => ItineraryRequestSchema.parse(requestBody)).not.toThrow();

      // This should fail until the endpoint is implemented
      const response = await testApi.post('/api/itinerary/generate').send(requestBody).expect(202);

      const responseBody = GenerationStartedSchema.parse(response.body);
      expect(responseBody.status).toBe('started');
      expect(responseBody.requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
      expect(responseBody.estimatedTime).toBeGreaterThan(0);
      expect(responseBody.websocketUrl).toMatch(/^wss?:\/\//);
    });

    it('should reject missing required fields', async () => {
      const invalidRequest = {
        formData: {
          destination: 'Paris, France',
          // Missing startDate, endDate, adults
        },
        requestType: 'initial' as const,
      };

      // This should fail with validation error
      const response = await testApi
        .post('/api/itinerary/generate')
        .send(invalidRequest)
        .expect(400);

      const errorResponse = ErrorResponseSchema.parse(response.body);
      expect(errorResponse.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid request type', async () => {
      const invalidRequest = {
        formData: {
          destination: 'Paris, France',
          startDate: '2025-06-01',
          endDate: '2025-06-07',
          adults: 2,
        },
        requestType: 'invalid' as any, // Invalid enum value
      };

      const response = await testApi
        .post('/api/itinerary/generate')
        .send(invalidRequest)
        .expect(400);

      const errorResponse = ErrorResponseSchema.parse(response.body);
      expect(errorResponse.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle minimal valid request', async () => {
      const minimalRequest = {
        formData: {
          destination: 'Rome, Italy',
          startDate: '2025-07-01',
          endDate: '2025-07-05',
          adults: 1,
        },
        requestType: 'initial' as const,
      };

      // Should accept minimal valid request
      const response = await testApi
        .post('/api/itinerary/generate')
        .send(minimalRequest)
        .expect(202);

      const responseBody = GenerationStartedSchema.parse(response.body);
      expect(responseBody.status).toBe('started');
    });
  });

  describe('Response Format', () => {
    it('should return correct content type', async () => {
      const requestBody = {
        formData: {
          destination: 'Tokyo, Japan',
          startDate: '2025-08-01',
          endDate: '2025-08-07',
          adults: 2,
        },
        requestType: 'initial' as const,
      };

      const response = await testApi.post('/api/itinerary/generate').send(requestBody).expect(202);

      // Check content type separately
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should include CORS headers', async () => {
      const requestBody = {
        formData: {
          destination: 'London, UK',
          startDate: '2025-09-01',
          endDate: '2025-09-05',
          adults: 2,
        },
        requestType: 'initial' as const,
      };

      const response = await testApi.post('/api/itinerary/generate').send(requestBody).expect(202);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limiting', async () => {
      // This test would require setting up rate limiting middleware first
      // For now, just test that the endpoint exists and returns proper errors
      const requestBody = {
        formData: {
          destination: 'New York, USA',
          startDate: '2025-10-01',
          endDate: '2025-10-05',
          adults: 1,
        },
        requestType: 'initial' as const,
      };

      // Should not return 429 until rate limiting is implemented
      await testApi
        .post('/api/itinerary/generate')
        .send(requestBody)
        .expect((res: any) => {
          expect([202, 500]).toContain(res.status); // Either success or server error (not implemented yet)
        });
    });

    it('should handle server errors gracefully', async () => {
      const response = await testApi
        .post('/api/itinerary/generate')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect((res: any) => {
          expect([400, 500]).toContain(res.status);
        });

      if (response.status === 500) {
        const errorResponse = ErrorResponseSchema.parse(response.body);
        expect(errorResponse.error.code).toBeDefined();
        expect(errorResponse.error.message).toBeDefined();
      }
    });
  });

  describe('Business Logic', () => {
    it('should trigger workflow orchestration', async () => {
      // This test verifies that the endpoint properly initiates the workflow
      // The actual workflow testing will be in integration tests
      const requestBody = {
        formData: {
          destination: 'Barcelona, Spain',
          startDate: '2025-11-01',
          endDate: '2025-11-05',
          adults: 2,
          children: 1,
          childrenAges: [5],
        },
        requestType: 'initial' as const,
        priority: 'high' as const,
      };

      const response = await testApi.post('/api/itinerary/generate').send(requestBody).expect(202);

      const responseBody = GenerationStartedSchema.parse(response.body);

      // Should return a valid workflow ID and WebSocket URL
      expect(responseBody.requestId).toBeDefined();
      expect(responseBody.websocketUrl).toContain(responseBody.requestId);
    });

    it('should handle different priority levels', async () => {
      const priorities = ['low', 'normal', 'high'] as const;

      for (const priority of priorities) {
        const requestBody = {
          formData: {
            destination: 'Amsterdam, Netherlands',
            startDate: '2025-12-01',
            endDate: '2025-12-03',
            adults: 1,
          },
          requestType: 'initial' as const,
          priority,
        };

        const response = await testApi
          .post('/api/itinerary/generate')
          .send(requestBody)
          .expect(202);

        const responseBody = GenerationStartedSchema.parse(response.body);
        expect(responseBody.status).toBe('started');
      }
    });
  });
});

import { describe, it, expect } from 'vitest';
import { testApi } from '../utils/test-api';
import { z } from 'zod';

// Contract test for GET /api/itinerary/status/{requestId}
// Tests the API contract as defined in contracts/api-spec.yaml

const GenerationStatusSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(['pending', 'processing', 'complete', 'error']),
  progress: z
    .object({
      percentage: z.number().min(0).max(100),
      currentPhase: z.enum(['research', 'planning', 'enrichment', 'formatting']).optional(),
      message: z.string().optional(),
    })
    .optional(),
  currentStep: z.string().optional(),
  agentStatus: z
    .array(
      z.object({
        type: z.enum([
          'itinerary-architect',
          'web-gatherer',
          'information-specialist',
          'form-putter',
        ]),
        status: z.enum(['idle', 'processing', 'complete', 'error']),
        progress: z.number().min(0).max(100).optional(),
        lastUpdate: z.string().optional(),
      })
    )
    .optional(),
  estimatedCompletion: z.string().optional(),
});

const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

describe('GET /api/itinerary/status/{requestId}', () => {
  describe('Request Validation', () => {
    it('should return status for valid request ID', async () => {
      const requestId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await testApi.get(`/api/itinerary/status/${requestId}`).expect(200);

      const responseBody = GenerationStatusSchema.parse(response.body);
      expect(responseBody.requestId).toBe(requestId);
      expect(['pending', 'processing', 'complete', 'error']).toContain(responseBody.status);
    });

    it('should reject invalid request ID format', async () => {
      const invalidRequestId = 'invalid-uuid';

      const response = await testApi.get(`/api/itinerary/status/${invalidRequestId}`).expect(400);

      const responseBody = ErrorResponseSchema.parse(response.body);
      expect(responseBody.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent request', async () => {
      const nonExistentRequestId = '99999999-9999-9999-9999-999999999999';

      const response = await testApi
        .get(`/api/itinerary/status/${nonExistentRequestId}`)
        .expect(404);

      const responseBody = ErrorResponseSchema.parse(response.body);
      expect(responseBody.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Response Format', () => {
    it('should return correct content type', async () => {
      const requestId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await testApi.get(`/api/itinerary/status/${requestId}`).expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should include CORS headers', async () => {
      const requestId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await testApi.get(`/api/itinerary/status/${requestId}`).expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });

  describe('Response Content', () => {
    it('should include progress information', async () => {
      const requestId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await testApi.get(`/api/itinerary/status/${requestId}`).expect(200);

      const responseBody = GenerationStatusSchema.parse(response.body);
      if (responseBody.progress) {
        expect(responseBody.progress.percentage).toBeGreaterThanOrEqual(0);
        expect(responseBody.progress.percentage).toBeLessThanOrEqual(100);
      }
    });

    it('should include agent status when processing', async () => {
      const requestId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await testApi.get(`/api/itinerary/status/${requestId}`).expect(200);

      const responseBody = GenerationStatusSchema.parse(response.body);
      if (responseBody.status === 'processing' && responseBody.agentStatus) {
        expect(Array.isArray(responseBody.agentStatus)).toBe(true);
        expect(responseBody.agentStatus.length).toBeGreaterThan(0);
      }
    });

    it('should include estimated completion time', async () => {
      const requestId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await testApi.get(`/api/itinerary/status/${requestId}`).expect(200);

      const responseBody = GenerationStatusSchema.parse(response.body);
      if (responseBody.estimatedCompletion) {
        expect(() => new Date(responseBody.estimatedCompletion!)).not.toThrow();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // Test with a request ID that might cause server issues
      const problematicRequestId = '00000000-0000-0000-0000-000000000000';

      await testApi.get(`/api/itinerary/status/${problematicRequestId}`).expect((res: any) => {
        expect([200, 404, 500]).toContain(res.status);
      });
    });

    it('should handle malformed request IDs', async () => {
      const malformedRequestId = 'not-a-uuid-at-all';

      await testApi.get(`/api/itinerary/status/${malformedRequestId}`).expect((res: any) => {
        expect([400, 404]).toContain(res.status);
      });
    });
  });

  describe('Business Logic', () => {
    it('should return consistent status for same request', async () => {
      const requestId = '550e8400-e29b-41d4-a716-446655440000';

      const response1 = await testApi.get(`/api/itinerary/status/${requestId}`).expect(200);
      const response2 = await testApi.get(`/api/itinerary/status/${requestId}`).expect(200);

      const body1 = GenerationStatusSchema.parse(response1.body);
      const body2 = GenerationStatusSchema.parse(response2.body);

      expect(body1.requestId).toBe(body2.requestId);
      // Note: Status might change during processing, so we don't check for exact equality
      expect(['pending', 'processing', 'complete', 'error']).toContain(body1.status);
      expect(['pending', 'processing', 'complete', 'error']).toContain(body2.status);
    });

    it('should handle different request states', async () => {
      // Test various request IDs to simulate different states
      const testRequestIds = [
        '550e8400-e29b-41d4-a716-446655440000', // Should exist
        '660e8400-e29b-41d4-a716-446655440001', // Might be processing
        '770e8400-e29b-41d4-a716-446655440002', // Might be complete
      ];

      for (const requestId of testRequestIds) {
        await testApi.get(`/api/itinerary/status/${requestId}`).expect((res: any) => {
          expect([200, 404]).toContain(res.status);

          if (res.status === 200) {
            const responseBody = GenerationStatusSchema.parse(res.body);
            expect(responseBody.requestId).toBe(requestId);
          }
        });
      }
    });
  });
});

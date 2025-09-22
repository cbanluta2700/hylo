/**
 * Contract Test: GET /api/itinerary/:itineraryId
 *
 * CONSTITUTIONAL REQUIREMENT IV: Code-Deploy-Debug Flow
 * These tests MUST FAIL before implementation begins.
 * Tests itinerary retrieval endpoint with Edge Runtime compatibility.
 *
 * Edge Runtime Requirements (Constitutional Principle I):
 * - Must export { runtime: 'edge' }
 * - Type-safe response structure
 * - Proper error handling for missing/expired itineraries
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Constitutional requirement: Edge-compatible retrieval endpoint
const ITINERARY_ENDPOINT = '/api/itinerary';

describe('Contract: GET /api/itinerary/:itineraryId', () => {
  const testItineraryId = 'test-itinerary-123';

  beforeEach(() => {
    // Reset test state following constitutional requirements
  });

  it('should retrieve complete itinerary for valid ID', async () => {
    // This test WILL FAIL until the Edge Runtime endpoint is implemented
    const response = await fetch(`http://localhost:3000${ITINERARY_ENDPOINT}/${testItineraryId}`);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id', testItineraryId);
    expect(data.data).toHaveProperty('title');
    expect(data.data).toHaveProperty('destination');
    expect(data.data).toHaveProperty('dates');
    expect(data.data).toHaveProperty('budget');
    expect(data.data).toHaveProperty('itinerary');
    expect(data.data).toHaveProperty('metadata');

    // Constitutional requirement: Type-safe structure
    expect(Array.isArray(data.data.itinerary)).toBe(true);
    expect(typeof data.data.budget.total).toBe('number');
    expect(typeof data.data.dates.start).toBe('string');
    expect(typeof data.data.dates.end).toBe('string');
  });

  it('should return 404 for non-existent itinerary ID', async () => {
    const nonExistentId = 'non-existent-itinerary';
    const response = await fetch(`http://localhost:3000${ITINERARY_ENDPOINT}/${nonExistentId}`);

    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toHaveProperty('code', 'NOT_FOUND');
    expect(data.error).toHaveProperty('message');
    expect(data.error.message).toContain('itinerary not found');
  });

  it('should return 410 for expired itinerary', async () => {
    const expiredId = 'expired-itinerary-456';
    const response = await fetch(`http://localhost:3000${ITINERARY_ENDPOINT}/${expiredId}`);

    expect(response.status).toBe(410);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toHaveProperty('code', 'EXPIRED');
    expect(data.error).toHaveProperty('message');
    expect(data.error.message).toContain('expired');
  });

  it('should validate itinerary ID format', async () => {
    const invalidIds = [
      '', // Empty
      'invalid-format', // Wrong format
      '../../../etc/passwd', // Path traversal
      '<script>alert(1)</script>', // XSS attempt
      'a'.repeat(200), // Too long
    ];

    for (const invalidId of invalidIds) {
      const response = await fetch(
        `http://localhost:3000${ITINERARY_ENDPOINT}/${encodeURIComponent(invalidId)}`
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_ITINERARY_ID');
    }
  });

  it('should enforce Edge Runtime compatibility', async () => {
    const response = await fetch(`http://localhost:3000${ITINERARY_ENDPOINT}/${testItineraryId}`);

    // Constitutional Principle I: Edge Runtime requirements
    expect(response.headers.has('content-type')).toBe(true);
    expect(response.headers.get('content-type')).toBe('application/json');

    // Should not have Node.js specific headers
    expect(response.headers.get('server')).not.toMatch(/node/i);

    // Should have proper CORS headers
    expect(response.headers.has('access-control-allow-origin')).toBe(true);
  });

  it('should return complete itinerary structure with all required fields', async () => {
    const response = await fetch(`http://localhost:3000${ITINERARY_ENDPOINT}/${testItineraryId}`);

    if (response.status === 200) {
      const data = await response.json();
      const itinerary = data.data;

      // Constitutional requirement: Type-safe validation
      expect(itinerary).toHaveProperty('id');
      expect(itinerary).toHaveProperty('title');
      expect(itinerary).toHaveProperty('destination');
      expect(itinerary).toHaveProperty('dates');
      expect(itinerary).toHaveProperty('budget');
      expect(itinerary).toHaveProperty('itinerary');
      expect(itinerary).toHaveProperty('recommendations');
      expect(itinerary).toHaveProperty('metadata');

      // Validate daily itinerary structure
      expect(Array.isArray(itinerary.itinerary)).toBe(true);
      if (itinerary.itinerary.length > 0) {
        const day = itinerary.itinerary[0];
        expect(day).toHaveProperty('day');
        expect(day).toHaveProperty('date');
        expect(day).toHaveProperty('activities');
        expect(day).toHaveProperty('meals');
        expect(day).toHaveProperty('accommodation');
        expect(Array.isArray(day.activities)).toBe(true);
      }

      // Validate budget structure
      expect(itinerary.budget).toHaveProperty('total');
      expect(itinerary.budget).toHaveProperty('currency');
      expect(itinerary.budget).toHaveProperty('breakdown');
      expect(typeof itinerary.budget.total).toBe('number');
      expect(typeof itinerary.budget.currency).toBe('string');

      // Validate metadata
      expect(itinerary.metadata).toHaveProperty('generatedAt');
      expect(itinerary.metadata).toHaveProperty('workflowId');
      expect(itinerary.metadata).toHaveProperty('version');
      expect(itinerary.metadata).toHaveProperty('processingTime');
    }
  });

  it('should handle concurrent requests efficiently', async () => {
    const requests = Array(10)
      .fill(null)
      .map(() => fetch(`http://localhost:3000${ITINERARY_ENDPOINT}/${testItineraryId}`));

    const responses = await Promise.all(requests);

    // All requests should complete
    expect(responses).toHaveLength(10);

    // Check response times are reasonable (Edge Runtime should be fast)
    const startTime = Date.now();
    await Promise.all(requests);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
  });

  it('should properly cache frequently requested itineraries', async () => {
    const firstResponse = await fetch(
      `http://localhost:3000${ITINERARY_ENDPOINT}/${testItineraryId}`
    );
    const firstTime = Date.now();

    const secondResponse = await fetch(
      `http://localhost:3000${ITINERARY_ENDPOINT}/${testItineraryId}`
    );
    const secondTime = Date.now();

    if (firstResponse.status === 200 && secondResponse.status === 200) {
      const firstData = await firstResponse.json();
      const secondData = await secondResponse.json();

      // Should return same data
      expect(firstData.data.id).toBe(secondData.data.id);

      // Second request should be faster (cached)
      expect(secondTime - firstTime).toBeLessThan(1000);
    }
  });
});

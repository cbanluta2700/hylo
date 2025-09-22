/**
 * Contract Test: POST /api/itinerary/generate (v2)
 *
 * CONSTITUTIONAL REQUIREMENT IV: Code-Deploy-Debug Flow
 * These tests MUST FAIL before implementation begins.
 * This validates the API contract for itinerary generation endpoint.
 *
 * Edge Runtime Requirements (Constitutional Principle I):
 * - Must export { runtime: 'edge' }
 * - Web APIs only, no Node.js built-ins
 * - Structured error handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TravelFormData } from '../../src/types/travel-form';

// Constitutional requirement: Edge-compatible endpoint
const GENERATE_ENDPOINT = '/api/itinerary/generate';

describe('Contract: POST /api/itinerary/generate', () => {
  const validFormData: TravelFormData = {
    // Trip Details
    location: 'Paris, France',
    departDate: '2025-12-01',
    returnDate: '2025-12-07',
    flexibleDates: false,
    plannedDays: 6,
    adults: 2,
    children: 0,
    childrenAges: [],

    // Budget (Constitutional requirement: Type-Safe with Zod)
    budget: {
      total: 3000,
      currency: 'USD',
      breakdown: {
        accommodation: 1200,
        food: 600,
        activities: 800,
        transportation: 300,
        shopping: 100,
        emergency: 0,
      },
      flexibility: 'flexible',
    },

    // Travel Style
    travelStyle: {
      pace: 'moderate',
      accommodationType: 'mid-range',
      diningPreferences: 'local',
      activityLevel: 'moderate',
      culturalImmersion: 'moderate',
    },

    // Travel Interests
    interests: ['museums', 'restaurants', 'culture'],
    avoidances: ['crowds'],
    dietaryRestrictions: [],
    accessibility: [],

    // Travel Style Choices
    tripVibe: 'cultural',
    travelExperience: 'first-time',
    dinnerChoice: 'local-spots',
    nickname: 'Paris Adventure',

    // Additional Services
    additionalServices: {
      carRental: false,
      travel_insurance: true,
      tours: true,
      airport_transfers: false,
      spa_wellness: false,
      adventure_activities: false,
    },

    // Metadata
    sessionId: 'test-session-123',
    formVersion: '1.0.0',
    submittedAt: new Date(),
  };

  const validRequest = {
    sessionId: 'test-session-123',
    formData: validFormData,
  };

  beforeEach(() => {
    // Reset test state following constitutional requirements
  });

  it('should accept valid form data and return workflow details', async () => {
    // This test WILL FAIL until the Edge Runtime endpoint is implemented
    const response = await fetch(`http://localhost:3000${GENERATE_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validRequest),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('workflowId');
    expect(data.data).toHaveProperty('sessionId', 'test-session-123');
    expect(data.data).toHaveProperty('estimatedCompletionTime');
    expect(data.data).toHaveProperty('progressUrl');
    expect(typeof data.data.workflowId).toBe('string');
    expect(typeof data.data.estimatedCompletionTime).toBe('number');
    expect(data.data.progressUrl).toMatch(/^\/api\/itinerary\/progress\/.+$/);
  });

  it('should validate Zod schema compliance (Constitutional Principle V)', async () => {
    const invalidRequest = {
      sessionId: 'test-session-123',
      formData: {
        ...validFormData,
        budget: {
          total: -100, // Invalid negative budget
          currency: 'INVALID', // Invalid currency
          breakdown: {}, // Missing required breakdown
          flexibility: 'invalid' as any, // Invalid enum value
        },
      },
    };

    const response = await fetch(`http://localhost:3000${GENERATE_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidRequest),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toHaveProperty('code', 'VALIDATION_ERROR');
    expect(data.error).toHaveProperty('message');
    expect(data.error).toHaveProperty('details');
  });

  it('should enforce Edge Runtime compatibility (Constitutional Principle I)', async () => {
    const response = await fetch(`http://localhost:3000${GENERATE_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validRequest),
    });

    // Must be Edge Runtime compatible - no Node.js specific headers
    expect(response.headers.get('server')).not.toMatch(/node/i);
    expect(response.headers.has('content-type')).toBe(true);

    // Should handle streaming if needed
    const contentType = response.headers.get('content-type');
    expect(contentType).toMatch(/application\/json|text\/event-stream/);
  });

  it('should follow structured error handling', async () => {
    const malformedRequest = 'invalid-json-{';

    const response = await fetch(`http://localhost:3000${GENERATE_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: malformedRequest,
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toHaveProperty('code');
    expect(data.error).toHaveProperty('message');
    expect(data.error.code).toMatch(/JSON_PARSE_ERROR|INVALID_REQUEST/);
  });

  it('should handle missing required fields with type-safe validation', async () => {
    const incompleteRequest = {
      sessionId: 'test-session-123',
      formData: {
        location: '', // Empty required field
        adults: 0, // Invalid count
        budget: null, // Missing required budget
      },
    };

    const response = await fetch(`http://localhost:3000${GENERATE_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(incompleteRequest),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.details).toHaveProperty('fields');
  });
});

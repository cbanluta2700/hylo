/**
 * Contract Test: POST /api/itinerary/generate
 *
 * CRITICAL: These tests MUST FAIL before implementation begins.
 * This validates the API contract for itinerary generation endpoint.
 *
 * Requirements from api-contracts.md:
 * - Edge Runtime compatible
 * - Validates TravelFormData input
 * - Returns workflowId and progressUrl
 * - Handles validation errors properly
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TravelFormData } from '../../src/types/travel-form';

// Mock API endpoint for contract testing
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

    // Budget Information
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

    // Travel Preferences
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
    // Reset any test state
  });

  it('should accept valid form data and return workflow details', async () => {
    // This test will FAIL until the endpoint is implemented
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

  it('should reject requests with missing sessionId', async () => {
    const invalidRequest = {
      formData: validFormData,
      // Missing sessionId
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
    expect(data.error).toHaveProperty('code');
    expect(data.error).toHaveProperty('message');
    expect(data.error.message).toContain('sessionId');
  });

  it('should reject requests with invalid form data', async () => {
    const invalidRequest = {
      sessionId: 'test-session-123',
      formData: {
        // Missing required fields
        location: '', // Empty location should fail
        budget: -100, // Negative budget should fail
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
    expect(data.error).toHaveProperty('code');
    expect(data.error).toHaveProperty('message');
    expect(data.error.code).toMatch(/VALIDATION_ERROR|INVALID_INPUT/);
  });

  it('should reject requests with malformed JSON', async () => {
    const response = await fetch(`http://localhost:3000${GENERATE_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid-json-{',
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toHaveProperty('message');
  });

  it('should handle missing required budget fields', async () => {
    const invalidRequest = {
      sessionId: 'test-session-123',
      formData: {
        ...validFormData,
        budget: undefined,
        currency: undefined,
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
    expect(data.error.message).toMatch(/budget|currency/i);
  });

  it('should handle Edge Runtime environment correctly', async () => {
    // This test verifies the endpoint uses Edge Runtime
    const response = await fetch(`http://localhost:3000${GENERATE_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validRequest),
    });

    // Edge Runtime specific headers should be present
    expect(response.headers.has('content-type')).toBe(true);
    // Edge Runtime should not include Node.js specific headers
    expect(response.headers.get('server')).not.toMatch(/node/i);
  });
});

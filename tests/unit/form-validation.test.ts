import { describe, it, expect } from 'vitest';
import { TravelFormDataSchema, validateTravelFormData } from '@/schemas/ai-workflow-schemas';

const validFormData = {
  location: 'Paris',
  departDate: '2025-10-01',
  returnDate: '2025-10-10',
  flexibleDates: false,
  plannedDays: 9,
  adults: 2,
  children: 1,
  childrenAges: [7],
  budget: {
    total: 5000,
    currency: 'USD',
    breakdown: {
      accommodation: 2000,
      food: 1000,
      activities: 1000,
      transportation: 500,
      shopping: 400,
      emergency: 100,
    },
    flexibility: 'flexible',
  },
  travelStyle: {
    pace: 'moderate',
    accommodationType: 'mid-range',
    diningPreferences: 'local',
    activityLevel: 'moderate',
    culturalImmersion: 'deep',
  },
  interests: ['art', 'food'],
  avoidances: ['crowds'],
  dietaryRestrictions: ['vegetarian'],
  accessibility: [],
  tripVibe: 'romantic',
  travelExperience: 'experienced',
  dinnerChoice: 'local-spots',
  nickname: 'Anniversary',
  additionalServices: {
    carRental: false,
    travel_insurance: true,
    tours: true,
    airport_transfers: true,
    spa_wellness: false,
    adventure_activities: false,
  },
  sessionId: '123e4567-e89b-12d3-a456-426614174000',
  formVersion: '1.0.0',
  submittedAt: '2025-09-23T12:00:00.000Z',
};

describe('TravelFormDataSchema', () => {
  it('validates correct form data', () => {
    const result = TravelFormDataSchema.safeParse(validFormData);
    expect(result.success).toBe(true);
  });

  it('fails on missing required fields', () => {
    const invalidData = { ...validFormData };
    delete invalidData.location;
    const result = TravelFormDataSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('fails on invalid date range', () => {
    const invalidData = { ...validFormData, departDate: '2025-10-10', returnDate: '2025-10-01' };
    const result = TravelFormDataSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('fails on malformed childrenAges', () => {
    const invalidData = { ...validFormData, children: 2, childrenAges: [7] };
    const result = TravelFormDataSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('validates cross-field logic for plannedDays', () => {
    const data = { ...validFormData, plannedDays: undefined };
    const result = TravelFormDataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

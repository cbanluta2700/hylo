import { TravelFormData } from '@/types/travel-form';
import { FormData } from '@/components/TripDetails/types';

/**
 * Converts existing FormData from App.tsx to TravelFormData for AI workflow
 * Maps all form sections to the unified interface
 */
export function transformExistingFormDataToWorkflow(formData: FormData): TravelFormData {
  const result = {
    // Trip Details
    location: formData.location,
    departDate: formData.departDate,
    returnDate: formData.returnDate || '',
    flexibleDates: formData.flexibleDates,
    plannedDays: formData.plannedDays || undefined,
    adults: typeof formData.adults === 'string' ? parseInt(formData.adults) || 0 : formData.adults,
    children:
      typeof formData.children === 'string' ? parseInt(formData.children) || 0 : formData.children,
    childrenAges: formData.childrenAges || undefined,

    // Budget Information
    budget: {
      total:
        typeof formData.budget === 'string' ? parseFloat(formData.budget) || 0 : formData.budget,
      currency: formData.currency || 'USD',
      breakdown: {
        accommodation: Math.round(
          (typeof formData.budget === 'string'
            ? parseFloat(formData.budget) || 0
            : formData.budget) * 0.4
        ), // 40%
        food: Math.round(
          (typeof formData.budget === 'string'
            ? parseFloat(formData.budget) || 0
            : formData.budget) * 0.25
        ), // 25%
        activities: Math.round(
          (typeof formData.budget === 'string'
            ? parseFloat(formData.budget) || 0
            : formData.budget) * 0.2
        ), // 20%
        transportation: Math.round(
          (typeof formData.budget === 'string'
            ? parseFloat(formData.budget) || 0
            : formData.budget) * 0.1
        ), // 10%
        shopping: Math.round(
          (typeof formData.budget === 'string'
            ? parseFloat(formData.budget) || 0
            : formData.budget) * 0.03
        ), // 3%
        emergency: Math.round(
          (typeof formData.budget === 'string'
            ? parseFloat(formData.budget) || 0
            : formData.budget) * 0.02
        ), // 2%
      },
      flexibility: formData.flexibleBudget ? 'very-flexible' : 'strict',
    },

    // Travel Preferences (map from existing travel style data)
    travelStyle: {
      pace: 'moderate', // default
      accommodationType: 'mid-range', // default
      diningPreferences: 'mixed', // default
      activityLevel: 'moderate', // default
      culturalImmersion: 'moderate', // default
    },

    // Travel Interests & Groups
    interests: formData.selectedInterests || [],
    avoidances: [], // not in existing form
    dietaryRestrictions: [], // not in existing form
    accessibility: [], // not in existing form

    // Travel Style Choices
    tripVibe: formData.travelStyleAnswers?.['vibes']?.[0] || 'adventure',
    travelExperience:
      (formData.travelStyleAnswers?.['experience']?.[0] as
        | 'first-time'
        | 'experienced'
        | 'expert') || 'experienced',
    dinnerChoice:
      (formData.travelStyleAnswers?.['dinnerChoices']?.[0] as
        | 'fine-dining'
        | 'local-spots'
        | 'street-food'
        | 'mixed') || 'local-spots',
    nickname: formData.travelStyleAnswers?.['tripNickname'] || formData.tripNickname || undefined,

    // Additional Services (defaults)
    additionalServices: {
      carRental: false,
      travel_insurance: false,
      tours: false,
      airport_transfers: false,
      spa_wellness: false,
      adventure_activities: false,
    },

    // Metadata
    sessionId: undefined,
    formVersion: '1.0.0',
    submittedAt: undefined,
  };

  return result as any;
}

/**
 * Converts TravelFormData to AI agent input format
 * Handles currency conversions, date formatting, and sanitization
 */
export function transformFormDataForWorkflow(formData: TravelFormData) {
  // Format dates to ISO strings
  const departDateISO = new Date(formData.departDate).toISOString();
  const returnDateISO = formData.returnDate
    ? new Date(formData.returnDate).toISOString()
    : undefined;

  // Currency conversion (stub: assumes USD, extend as needed)
  const currency = formData.budget.currency || 'USD';

  // Sanitize interests and avoidances
  const interests = formData.interests.map((i) => i.trim()).filter(Boolean);
  const avoidances = formData.avoidances.map((a) => a.trim()).filter(Boolean);

  // Calculate trip duration if not provided
  let plannedDays = formData.plannedDays;
  if (!plannedDays && returnDateISO) {
    const depart = new Date(formData.departDate);
    const returnD = new Date(formData.returnDate!);
    plannedDays = Math.ceil((returnD.getTime() - depart.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Prepare agent input with enhanced data
  const result = {
    ...formData,
    departDate: departDateISO,
    returnDate: returnDateISO,
    plannedDays,
    budget: {
      ...formData.budget,
      currency,
    },
    interests,
    avoidances,
    // Enhanced travel context
    travelContext: {
      groupSize: formData.adults + formData.children,
      hasChildren: formData.children > 0,
      budgetPerDay: Math.round(formData.budget.total / (plannedDays || 1)),
      preferredPace: formData.travelStyle.pace,
    },
  };

  return result;
}

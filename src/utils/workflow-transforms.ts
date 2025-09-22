import { TravelFormData } from '@/types/travel-form';
import { FormData } from '@/components/TripDetails/types';

// Helper functions to map form text values to enum values
function mapTravelExperienceToEnum(
  value: string | undefined
): 'first-time' | 'experienced' | 'expert' {
  if (!value) return 'experienced';
  const lower = value.toLowerCase();
  if (lower.includes("haven't") || lower.includes('new') || lower.includes('first'))
    return 'first-time';
  if (lower.includes('expert') || lower.includes('extensively') || lower.includes('many times'))
    return 'expert';
  return 'experienced';
}

function mapDinnerChoiceToEnum(
  value: string | undefined
): 'fine-dining' | 'local-spots' | 'street-food' | 'mixed' {
  if (!value) return 'local-spots';
  const lower = value.toLowerCase();
  if (lower.includes('michelin') || lower.includes('fine') || lower.includes('upscale'))
    return 'fine-dining';
  if (lower.includes('street') || lower.includes('food truck') || lower.includes('hawker'))
    return 'street-food';
  if (lower.includes('mix') || lower.includes('variety') || lower.includes('both')) return 'mixed';
  return 'local-spots';
}

function mapTripVibeToEnum(value: string | undefined): string {
  if (!value) return 'adventure';
  const lower = value.toLowerCase();
  if (lower.includes('up-for-anything')) return 'adventure';
  if (lower.includes('romantic')) return 'romantic';
  if (lower.includes('cultural')) return 'cultural';
  if (lower.includes('relaxed') || lower.includes('chill')) return 'relaxed';
  return value; // Return original if no mapping found
}

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
    // Use UI default values when state is empty
    adults:
      typeof formData.adults === 'string'
        ? parseInt(formData.adults) || (formData.adults === '' ? 2 : 0)
        : formData.adults || 2,
    children:
      typeof formData.children === 'string'
        ? parseInt(formData.children) || (formData.children === '' ? 0 : 0)
        : formData.children || 0,
    childrenAges: formData.childrenAges || undefined,

    // Budget Information
    budget: {
      total: formData.flexibleBudget
        ? 5000 // Use average budget when flexible
        : typeof formData.budget === 'string'
        ? parseFloat(formData.budget) || (formData.budget === '' ? 5000 : 0)
        : formData.budget || 5000,
      currency: formData.currency || 'USD',
      breakdown: (() => {
        const budgetAmount = formData.flexibleBudget
          ? 5000 // Use average for flexible budget
          : typeof formData.budget === 'string'
          ? parseFloat(formData.budget) || (formData.budget === '' ? 5000 : 0)
          : formData.budget || 5000;
        return {
          accommodation: Math.round(budgetAmount * 0.4), // 40%
          food: Math.round(budgetAmount * 0.25), // 25%
          activities: Math.round(budgetAmount * 0.2), // 20%
          transportation: Math.round(budgetAmount * 0.1), // 10%
          shopping: Math.round(budgetAmount * 0.03), // 3%
          emergency: Math.round(budgetAmount * 0.02), // 2%
        };
      })(),
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

    // Travel Style Choices (map full text to enum values)
    tripVibe: mapTripVibeToEnum(formData.travelStyleAnswers?.['vibes']?.[0]) || 'adventure',
    travelExperience:
      mapTravelExperienceToEnum(formData.travelStyleAnswers?.['experience']?.[0]) || 'experienced',
    dinnerChoice:
      mapDinnerChoiceToEnum(formData.travelStyleAnswers?.['dinnerChoices']?.[0]) || 'local-spots',
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

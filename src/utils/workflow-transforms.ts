import { TravelFormData } from '../types/travel-form';
import { FormData } from '../components/TripDetails/types';

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

// Helper functions to map travel style answers to enums
function mapTravelStyleToPace(answers: any): 'slow' | 'moderate' | 'fast' {
  if (!answers) return 'moderate';
  const vibes = answers.vibes || [];
  const sampleDays = answers.sampleDays || [];
  
  // Look for pace indicators in vibes or sample day preferences
  const allText = [...vibes, ...sampleDays].join(' ').toLowerCase();
  if (allText.includes('slow') || allText.includes('relaxed') || allText.includes('leisurely')) return 'slow';
  if (allText.includes('fast') || allText.includes('packed') || allText.includes('intensive')) return 'fast';
  return 'moderate';
}

function mapTravelStyleToAccommodation(answers: any): 'budget' | 'mid-range' | 'luxury' | 'mixed' {
  if (!answers) return 'mid-range';
  // This would need specific budget/accommodation questions to map properly
  return 'mid-range';
}

function mapTravelStyleToDining(answers: any): 'local' | 'international' | 'mixed' {
  if (!answers) return 'mixed';
  const dinnerChoices = answers.dinnerChoices || [];
  const allText = dinnerChoices.join(' ').toLowerCase();
  if (allText.includes('local') || allText.includes('traditional')) return 'local';
  if (allText.includes('international') || allText.includes('familiar')) return 'international';
  return 'mixed';
}

function mapTravelStyleToActivity(answers: any): 'low' | 'moderate' | 'high' {
  if (!answers) return 'moderate';
  const vibes = answers.vibes || [];
  const sampleDays = answers.sampleDays || [];
  
  const allText = [...vibes, ...sampleDays].join(' ').toLowerCase();
  if (allText.includes('adventure') || allText.includes('active') || allText.includes('hiking')) return 'high';
  if (allText.includes('relaxed') || allText.includes('chill') || allText.includes('spa')) return 'low';
  return 'moderate';
}

function mapTravelStyleToCultural(answers: any): 'minimal' | 'moderate' | 'deep' {
  if (!answers) return 'moderate';
  const vibes = answers.vibes || [];
  const interests = answers.interests || [];
  
  const allText = [...vibes, ...interests].join(' ').toLowerCase();
  if (allText.includes('deep') || allText.includes('immersion') || allText.includes('authentic')) return 'deep';
  if (allText.includes('minimal') || allText.includes('surface')) return 'minimal';
  return 'moderate';
}

/**
 * Converts existing FormData from App.tsx to TravelFormData for AI workflow
 * Maps all form sections to the unified interface
 */
export function transformExistingFormDataToWorkflow(formData: FormData): TravelFormData {
  const result = {
    // Trip Details with proper string handling
    location: (formData.location || '').trim() || undefined,
    departDate: formData.departDate || '',
    returnDate: formData.returnDate || '',
    flexibleDates: Boolean(formData.flexibleDates),
    plannedDays: formData.plannedDays || undefined,
    // Simplified traveler count conversion with proper defaults
    adults: (() => {
      if (typeof formData.adults === 'number') return Math.max(1, formData.adults);
      if (typeof formData.adults === 'string') {
        const parsed = parseInt(formData.adults);
        return isNaN(parsed) ? 2 : Math.max(1, parsed);
      }
      return 2; // Default fallback
    })(),
    children: (() => {
      if (typeof formData.children === 'number') return Math.max(0, formData.children);
      if (typeof formData.children === 'string') {
        const parsed = parseInt(formData.children);
        return isNaN(parsed) ? 0 : Math.max(0, parsed);
      }
      return 0; // Default fallback
    })(),
    childrenAges: formData.childrenAges || undefined,

    // Budget Information with robust parsing
    budget: {
      total: (() => {
        if (formData.flexibleBudget) return 5000; // Default when flexible
        if (typeof formData.budget === 'number') return Math.max(100, formData.budget);
        if (typeof formData.budget === 'string') {
          const parsed = parseFloat(formData.budget);
          return isNaN(parsed) ? 5000 : Math.max(100, parsed);
        }
        return 5000; // Default fallback
      })(),
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
      pace: mapTravelStyleToPace(formData.travelStyleAnswers) || 'moderate',
      accommodationType: mapTravelStyleToAccommodation(formData.travelStyleAnswers) || 'mid-range', 
      diningPreferences: mapTravelStyleToDining(formData.travelStyleAnswers) || 'mixed',
      activityLevel: mapTravelStyleToActivity(formData.travelStyleAnswers) || 'moderate',
      culturalImmersion: mapTravelStyleToCultural(formData.travelStyleAnswers) || 'moderate',
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
    nickname: formData.travelStyleAnswers?.['tripNickname']?.[0] || formData.tripNickname || undefined,
    name: formData.contactName || undefined,

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
  // Format dates to ISO strings - handle flexible dates with empty strings
  const departDateISO =
    formData.departDate && formData.departDate !== ''
      ? new Date(formData.departDate).toISOString()
      : undefined;
  const returnDateISO =
    formData.returnDate && formData.returnDate !== ''
      ? new Date(formData.returnDate).toISOString()
      : undefined;

  // Currency conversion (stub: assumes USD, extend as needed)
  const currency = formData.budget.currency || 'USD';

  // Sanitize interests and avoidances
  const interests = formData.interests.map((i: string) => i.trim()).filter(Boolean);
  const avoidances = formData.avoidances.map((a: string) => a.trim()).filter(Boolean);

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

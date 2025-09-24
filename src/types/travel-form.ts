
/**
 * Travel Form Data Types for AI Workflow Integration
 *
 * Constitutional Requirement: Component Composition Pattern with BaseFormProps
 * Extends existing FormData with AI workflow requirements
 */

/**
 * Unified Travel Form Data Interface
 * Aggregates data from all existing form components
 */
export interface TravelFormData {
  // Trip Details
  location: string;
  departDate: string;
  returnDate?: string;
  flexibleDates: boolean;
  plannedDays?: number;
  adults: number;
  children: number;
  childrenAges?: number[];

  // Budget Information
  budget: {
    total: number;
    currency: string;
    breakdown: {
      accommodation: number;
      food: number;
      activities: number;
      transportation: number;
      shopping: number;
      emergency: number;
    };
    flexibility: 'strict' | 'flexible' | 'very-flexible';
  };

  // Travel Preferences
  travelStyle: {
    pace: 'slow' | 'moderate' | 'fast';
    accommodationType: 'budget' | 'mid-range' | 'luxury' | 'mixed';
    diningPreferences: 'local' | 'international' | 'mixed';
    activityLevel: 'low' | 'moderate' | 'high';
    culturalImmersion: 'minimal' | 'moderate' | 'deep';
  };

  // Travel Interests
  interests: string[];
  avoidances: string[];
  dietaryRestrictions: string[];
  accessibility: string[];

  // Travel Style Choices
  tripVibe: string;
  travelExperience: 'first-time' | 'experienced' | 'expert';
  dinnerChoice: 'fine-dining' | 'local-spots' | 'street-food' | 'mixed';
  nickname?: string;
  name?: string;

  // Additional Services
  additionalServices: {
    carRental: boolean;
    travel_insurance: boolean;
    tours: boolean;
    airport_transfers: boolean;
    spa_wellness: boolean;
    adventure_activities: boolean;
  };

  // Metadata
  sessionId?: string;
  formVersion: string;
  submittedAt?: Date;
}

/**
 * Form Section Data Types
 */
export interface TripDetailsData {
  location: string;
  departDate: string;
  returnDate?: string;
  flexibleDates: boolean;
  plannedDays?: number;
  adults: number;
  children: number;
  childrenAges?: number[];
}

export interface BudgetData {
  total: number;
  currency: string;
  breakdown: {
    accommodation: number;
    food: number;
    activities: number;
    transportation: number;
    shopping: number;
    emergency: number;
  };
  flexibility: 'strict' | 'flexible' | 'very-flexible';
}

export interface TravelPreferencesData {
  pace: 'slow' | 'moderate' | 'fast';
  accommodationType: 'budget' | 'mid-range' | 'luxury' | 'mixed';
  diningPreferences: 'local' | 'international' | 'mixed';
  activityLevel: 'low' | 'moderate' | 'high';
  culturalImmersion: 'minimal' | 'moderate' | 'deep';
}

export interface TravelStyleData {
  tripVibe: string;
  travelExperience: 'first-time' | 'experienced' | 'expert';
  dinnerChoice: 'fine-dining' | 'local-spots' | 'street-food' | 'mixed';
  nickname?: string;
}

/**
 * Form Validation State
 */
export interface FormValidationState {
  isValid: boolean;
  errors: Record<string, string[]>;
  completedSections: string[];
  requiredSections: string[];
  completionPercentage: number;
}

/**
 * Form Aggregation Result
 */
export interface FormAggregationResult {
  data: TravelFormData;
  validation: FormValidationState;
  missingFields: string[];
  warnings: string[];
}

/**
 * Base Form Props Interface (Constitutional Requirement)
 * All form components must implement this pattern
 */
export interface BaseFormProps<T = any> {
  data?: T;
  onFormChange: (section: string, data: T) => void;
  errors?: Record<string, string[]>;
  className?: string;
}

/**
 * Form Section Status
 */
export type FormSectionStatus = 'not-started' | 'in-progress' | 'completed' | 'error';

/**
 * Form Progress Tracking
 */
export interface FormProgress {
  sections: Record<string, FormSectionStatus>;
  overallProgress: number;
  isComplete: boolean;
  canSubmit: boolean;
}

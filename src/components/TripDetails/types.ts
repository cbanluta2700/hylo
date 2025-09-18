// src/components/TripDetails/types.ts
import { TripDetailsFormData, tripDetailsSchema } from '../../schemas/formSchemas';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
export type BudgetMode = 'total' | 'per-person';

// Use the validated FormData from schemas
export type FormData = TripDetailsFormData & {
  // Additional fields for new components
  selectedGroups?: string[];
  selectedInterests?: string[];
  selectedInclusions?: string[];
  customGroupText?: string;
  customInterestsText?: string;
  customInclusionsText?: string;
  inclusionPreferences?: Record<string, any>;
};

// Travel Group interfaces
export interface TravelGroup {
  id: string;
  label: string;
  emoji: string;
}

// Travel Interest interfaces
export interface TravelInterest {
  id: string;
  label: string;
  emoji: string;
}

// Itinerary Inclusion interfaces
export interface ItineraryInclusion {
  id: string;
  label: string;
  emoji: string;
}

export interface InclusionPreferencesMap {
  [inclusionId: string]: Record<string, any> | undefined;
}

// Extended BaseFormProps for new components
export interface ExtendedFormProps extends BaseFormProps {
  // Travel Group specific props
  selectedGroups?: string[];
  onGroupSelectionChange?: (groups: string[]) => void;
  customGroupText?: string;
  onGroupTextChange?: (text: string) => void;

  // Travel Interests specific props
  selectedInterests?: string[];
  onInterestSelectionChange?: (interests: string[]) => void;
  customInterestsText?: string;
  onInterestTextChange?: (text: string) => void;

  // Itinerary Inclusions specific props
  selectedInclusions?: string[];
  onInclusionSelectionChange?: (inclusions: string[]) => void;
  customInclusionsText?: string;
  onInclusionTextChange?: (text: string) => void;
  inclusionPreferences?: InclusionPreferencesMap;
  onInclusionPreferencesChange?: (prefs: InclusionPreferencesMap) => void;
}

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  fieldErrors: Record<string, string>;
}

export interface BaseFormProps {
  formData: FormData;
  onFormChange: (data: Partial<FormData>) => void;
}

// Export schema for validation
export { tripDetailsSchema };

// Constants
export const YEAR_THRESHOLD = 50;
export const YEAR_BASE_1900 = 1900;
export const YEAR_BASE_2000 = 2000;
export const MAX_BUDGET = 10000;
export const BUDGET_STEP = 250;
export const MIN_ADULTS = 1;
export const MIN_CHILDREN = 0;
export const MAX_CHILD_AGE = 17;
export const MAX_PLANNED_DAYS = 31;
export const UNSELECTED_AGE = -1;

export const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
};

// Travel Group options constants
export const TRAVEL_GROUPS: TravelGroup[] = [
  { id: 'family', label: 'Family', emoji: '🧑‍🧑‍🧒‍🧒' },
  { id: 'couple', label: 'Couple', emoji: '👩‍❤️‍👨' },
  { id: 'solo', label: 'Solo', emoji: '🥾' },
  { id: 'friends', label: 'Friends', emoji: '👯' },
  { id: 'large-group', label: 'Large\nGroup', emoji: '🚌' },
  { id: 'extended', label: 'Extended\nFamily', emoji: '🏘️' },
  { id: 'business', label: 'Business\nAssociates', emoji: '💼' },
  { id: 'other', label: 'Other', emoji: '✨' },
];

// Travel Interest options constants
export const TRAVEL_INTERESTS: TravelInterest[] = [
  { id: 'beach', label: 'Beach', emoji: '🏖️' },
  { id: 'culture', label: 'Culture', emoji: '🛕' },
  { id: 'history', label: 'History', emoji: '📜' },
  { id: 'food', label: 'Food', emoji: '🍜' },
  { id: 'drinks', label: 'Drinks', emoji: '🍷' },
  { id: 'nature', label: 'Nature', emoji: '🌲' },
  { id: 'relaxation', label: 'Relaxation', emoji: '🍹' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'nightlife', label: 'Nightlife', emoji: '🕺' },
  { id: 'arts', label: 'Arts &\nEntertainment', emoji: '🎭' },
  { id: 'museums', label: 'Museums &\nExhibitions', emoji: '🖼️' },
  { id: 'zoos', label: 'Zoos &\nAquariums', emoji: '🦁' },
  { id: 'kids', label: 'Kid-friendly', emoji: '👧' },
  { id: 'theme-parks', label: 'Theme\nParks', emoji: '🎢' },
  { id: 'sports', label: 'Sporting\nEvents', emoji: '⚽️' },
  { id: 'wellness', label: 'Health &\nWellness', emoji: '🧘' },
  { id: 'classes', label: 'Classes', emoji: '🧑‍🍳' },
  { id: 'digital-detox', label: 'Digital\ndetox', emoji: '📵' },
  { id: 'volunteering', label: 'Volunteering', emoji: '🤝' },
  { id: 'other', label: 'Other', emoji: '✨' },
];

// Itinerary Inclusion options constants
export const ITINERARY_INCLUSIONS: ItineraryInclusion[] = [
  { id: 'flights', label: 'Flights', emoji: '✈️' },
  { id: 'accommodations', label: 'Accommodations', emoji: '🏨' },
  { id: 'rental-car', label: 'Rental Car', emoji: '🚗' },
  { id: 'activities', label: 'Activities & Tours', emoji: '🛶' },
  { id: 'dining', label: 'Dining', emoji: '🍽️' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🪇' },
  { id: 'nature', label: 'Nature', emoji: '🌲' },
  { id: 'train', label: 'Train Tickets', emoji: '🚆' },
  { id: 'cruise', label: 'Cruise', emoji: '🛳️' },
  { id: 'other', label: 'Other', emoji: '✨' },
];

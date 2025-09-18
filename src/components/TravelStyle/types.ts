// src/components/TravelStyle/types.ts

// Import the main FormData type
import { FormData } from '../TripDetails/types';

// Base props interface for TravelStyle components
export interface BaseStyleFormProps {
  formData: FormData;
  onFormChange: (data: Partial<FormData>) => void;
}

// Sample day activity options
export const SAMPLE_DAYS = [
  'Beach day with relaxation and water activities',
  'Cultural exploration - museums, historical sites, local markets',
  'Adventure activities - hiking, biking, outdoor sports',
  'Food and drink experiences - cooking classes, wine tasting, local cuisine',
  'Shopping and entertainment - markets, shows, nightlife',
  'Nature and wildlife - parks, zoos, scenic drives',
  'Wellness and relaxation - spa, yoga, meditation',
  'Social activities - meeting locals, group events, volunteering',
];

// Dinner choice options
export const DINNER_OPTIONS = [
  'Fine dining restaurant',
  'Casual local eatery',
  'Street food or food truck',
  'Cooking class or food tour',
  'Picnic or beach dinner',
  'Room service or hotel dining',
  'Bar or pub with small plates',
  'Home-cooked meal or Airbnb kitchen',
];

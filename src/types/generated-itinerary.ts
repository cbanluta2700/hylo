/**
 * Generated Itinerary Entity
 * Complete itinerary structure with all recommendations
 */

export interface GeneratedItinerary {
  id: string;
  title: string;
  summary: string;
  totalDuration: number; // days
  estimatedCost: {
    min: number;
    max: number;
    currency: string;
  };
  days: DayPlan[];
  recommendations: {
    accommodation: AccommodationRecommendation[];
    dining: DiningRecommendation[];
    activities: ActivityRecommendation[];
    transportation: TransportationRecommendation[];
  };
  metadata: {
    generatedAt: string;
    lastUpdated: string;
    version: string;
    agentContributions: AgentContribution[];
  };
}

/**
 * Supporting Types for Generated Itinerary
 */

export interface DayPlan {
  day: number;
  date: string; // YYYY-MM-DD
  theme?: string;
  timeline: TimelineItem[];
  notes?: string;
}

export interface TimelineItem {
  time: string; // HH:MM format
  duration: number; // minutes
  activity: ActivityDetails;
  location: LocationDetails;
  cost?: CostEstimate;
}

export interface ActivityDetails {
  name: string;
  description: string;
  category: string;
  bookingRequired?: boolean;
  bookingUrl?: string;
}

export interface LocationDetails {
  name: string;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface CostEstimate {
  amount: number;
  currency: string;
  type: 'estimated' | 'fixed';
  perPerson?: boolean;
}

export interface AccommodationRecommendation {
  id: string;
  name: string;
  type: string;
  rating?: number;
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  location: LocationDetails;
  amenities: string[];
  bookingUrl?: string;
  description: string;
}

export interface DiningRecommendation {
  id: string;
  name: string;
  cuisine: string;
  priceRange: string;
  rating?: number;
  location: LocationDetails;
  specialties?: string[];
  bookingUrl?: string;
  description: string;
}

export interface ActivityRecommendation {
  id: string;
  name: string;
  category: string;
  duration: number; // minutes
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  location: LocationDetails;
  bookingRequired?: boolean;
  bookingUrl?: string;
  description: string;
}

export interface TransportationRecommendation {
  id: string;
  type: string;
  provider: string;
  route: string;
  duration: number; // minutes
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  bookingUrl?: string;
  description: string;
}

export interface AgentContribution {
  agentType: AgentType;
  agentId: string;
  contribution: string;
  confidence: number;
  timestamp: string;
}

export type AgentType =
  | 'itinerary-architect'
  | 'web-gatherer'
  | 'information-specialist'
  | 'form-putter';

/**
 * Validation Rules:
 * - days array length must match totalDuration
 * - timeline items must not overlap within day
 * - estimatedCost.min <= estimatedCost.max
 * - date format validation (YYYY-MM-DD)
 */

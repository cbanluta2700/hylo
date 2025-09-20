/**
 * Itinerary Types for Hylo Multi-Agent Travel Planning System
 * 
 * This module defines comprehensive TypeScript interfaces for travel itinerary
 * data structures, ensuring type safety and consistency across the multi-agent
 * workflow system. These types align with the required output format from the
 * agent workflow specification.
 */

import { z } from "zod";
import { AgentType } from "./agents.js";

// ===== Core Itinerary Types =====

/**
 * Trip summary information
 */
export interface TripSummary {
  /** User-friendly trip nickname */
  nickname: string;
  
  /** Trip duration */
  dates: {
    start: string; // ISO 8601 date format
    end: string;   // ISO 8601 date format
  };
  
  /** Number of travelers */
  travelers: {
    adults: number;
    children: number;
  };
  
  /** Budget information */
  budget: {
    amount: number;
    mode: "per-person" | "total" | "flexible";
  };
  
  /** Trip destination */
  destination: string;
  
  /** Trip duration in days (computed) */
  duration?: number;
}

/**
 * Contact information for personalized trip
 */
export interface TripContact {
  contactName: string;
}

/**
 * Activity information for daily itinerary
 */
export interface ItineraryActivity {
  /** Activity start time */
  time: string;
  
  /** Activity duration in minutes */
  duration: number;
  
  /** Activity title */
  title: string;
  
  /** Detailed description */
  description: string;
  
  /** Location name or address */
  location: string;
  
  /** Estimated cost (optional) */
  cost?: number;
  
  /** Activity category */
  type: "activity" | "meal" | "transport" | "accommodation" | "rest";
  
  /** Additional metadata */
  metadata?: {
    bookingRequired?: boolean;
    bookingUrl?: string;
    alternativeOptions?: string[];
    difficultyLevel?: "easy" | "moderate" | "challenging";
    weatherDependent?: boolean;
  };
}

/**
 * Daily itinerary structure
 */
export interface DailyItinerary {
  /** Day number (1-indexed) */
  day: number;
  
  /** Date for this day */
  date: string; // ISO 8601 date format
  
  /** Day of the week */
  dayOfWeek: string;
  
  /** Activities for this day */
  activities: ItineraryActivity[];
  
  /** Daily budget estimate */
  dailyBudget?: {
    total: number;
    breakdown: {
      accommodation: number;
      food: number;
      activities: number;
      transport: number;
    };
  };
  
  /** Weather forecast for the day */
  weather?: {
    temperature: { high: number; low: number; unit: "celsius" | "fahrenheit" };
    conditions: string;
    precipitation: number;
  };
}

/**
 * Travel tips organized by category
 */
export interface TravelTips {
  /** Packing recommendations */
  packing: string[];
  
  /** Cultural insights and etiquette */
  cultural: string[];
  
  /** Practical travel information */
  practical: string[];
  
  /** Safety recommendations */
  safety: string[];
  
  /** Budgeting tips */
  budgeting: string[];
}

/**
 * Metadata about itinerary generation
 */
export interface ItineraryMetadata {
  /** Timestamp when itinerary was generated */
  generatedAt: string; // ISO 8601 timestamp
  
  /** Agents used in generation process */
  agentsUsed: AgentType[];
  
  /** Confidence score (0-1) */
  confidence: number;
  
  /** Information sources used */
  sources: string[];
  
  /** Processing time in milliseconds */
  processingTime?: number;
  
  /** Token usage by agent */
  tokenUsage?: Record<AgentType, number>;
  
  /** Version of the workflow used */
  workflowVersion?: string;
}

/**
 * Complete compiled itinerary output
 * This is the final format returned by the Content Compiler agent
 */
export interface CompiledItineraryOutput {
  /** TRIP SUMMARY section */
  tripSummary: TripSummary;
  
  /** "Prepared for" contact section */
  preparedFor: TripContact;
  
  /** DAILY ITINERARY section - day-by-day activities */
  dailyItinerary: DailyItinerary[];
  
  /** TIPS FOR YOUR TRIP section */
  tipsForTrip: TravelTips;
  
  /** Generation metadata */
  metadata: ItineraryMetadata;
}

// ===== Alternative Format Types =====

/**
 * Simplified activity for quick overview
 */
export interface SimpleActivity {
  time: string;
  title: string;
  location: string;
  duration: number;
}

/**
 * Condensed daily summary
 */
export interface DayOverview {
  day: number;
  date: string;
  highlights: string[];
  totalActivities: number;
  estimatedCost: number;
}

/**
 * Executive summary of the trip
 */
export interface TripOverview {
  tripSummary: TripSummary;
  dayOverviews: DayOverview[];
  totalEstimatedCost: number;
  keyHighlights: string[];
}

// ===== Validation and Processing Types =====

/**
 * Itinerary validation result
 */
export interface ItineraryValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // Quality score 0-100
}

/**
 * Itinerary export options
 */
export interface ItineraryExportOptions {
  format: "pdf" | "json" | "markdown" | "calendar";
  includeMetadata: boolean;
  includeWeather: boolean;
  includeBudget: boolean;
  customizations?: {
    logoUrl?: string;
    brandColor?: string;
    footerText?: string;
  };
}

// ===== Zod Validation Schemas =====

/**
 * Zod schema for trip summary validation
 */
export const TripSummarySchema = z.object({
  nickname: z.string().min(1, "Trip nickname is required"),
  dates: z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
  }),
  travelers: z.object({
    adults: z.number().min(1, "At least one adult required"),
    children: z.number().min(0, "Children count cannot be negative")
  }),
  budget: z.object({
    amount: z.number().positive("Budget amount must be positive"),
    mode: z.enum(["per-person", "total", "flexible"])
  }),
  destination: z.string().min(1, "Destination is required"),
  duration: z.number().optional()
});

/**
 * Zod schema for itinerary activity validation
 */
export const ItineraryActivitySchema = z.object({
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  duration: z.number().positive("Duration must be positive"),
  title: z.string().min(1, "Activity title is required"),
  description: z.string().min(1, "Activity description is required"),
  location: z.string().min(1, "Activity location is required"),
  cost: z.number().optional(),
  type: z.enum(["activity", "meal", "transport", "accommodation", "rest"]),
  metadata: z.object({
    bookingRequired: z.boolean().optional(),
    bookingUrl: z.string().url().optional(),
    alternativeOptions: z.array(z.string()).optional(),
    difficultyLevel: z.enum(["easy", "moderate", "challenging"]).optional(),
    weatherDependent: z.boolean().optional()
  }).optional()
});

/**
 * Zod schema for daily itinerary validation
 */
export const DailyItinerarySchema = z.object({
  day: z.number().positive("Day must be positive"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  dayOfWeek: z.string().min(1, "Day of week is required"),
  activities: z.array(ItineraryActivitySchema).min(1, "At least one activity required"),
  dailyBudget: z.object({
    total: z.number().positive(),
    breakdown: z.object({
      accommodation: z.number().min(0),
      food: z.number().min(0),
      activities: z.number().min(0),
      transport: z.number().min(0)
    })
  }).optional(),
  weather: z.object({
    temperature: z.object({
      high: z.number(),
      low: z.number(),
      unit: z.enum(["celsius", "fahrenheit"])
    }),
    conditions: z.string(),
    precipitation: z.number().min(0).max(100)
  }).optional()
});

/**
 * Zod schema for complete itinerary validation
 */
export const CompiledItineraryOutputSchema = z.object({
  tripSummary: TripSummarySchema,
  preparedFor: z.object({
    contactName: z.string().min(1, "Contact name is required")
  }),
  dailyItinerary: z.array(DailyItinerarySchema).min(1, "At least one day required"),
  tipsForTrip: z.object({
    packing: z.array(z.string()),
    cultural: z.array(z.string()),
    practical: z.array(z.string()),
    safety: z.array(z.string()),
    budgeting: z.array(z.string())
  }),
  metadata: z.object({
    generatedAt: z.string(),
    agentsUsed: z.array(z.enum(["content-planner", "info-gatherer", "strategist", "compiler"])),
    confidence: z.number().min(0).max(1),
    sources: z.array(z.string()),
    processingTime: z.number().optional(),
    tokenUsage: z.record(z.number()).optional(),
    workflowVersion: z.string().optional()
  })
});

// ===== Utility Functions =====

/**
 * Validate compiled itinerary output
 */
export function validateItinerary(data: unknown): CompiledItineraryOutput {
  const validated = CompiledItineraryOutputSchema.parse(data);
  return validated as CompiledItineraryOutput;
}

/**
 * Calculate trip duration from dates
 */
export function calculateTripDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Generate day overview from daily itinerary
 */
export function generateDayOverview(daily: DailyItinerary): DayOverview {
  const totalCost = daily.activities.reduce((sum, activity) => sum + (activity.cost || 0), 0);
  const highlights = daily.activities
    .filter(activity => activity.type === "activity")
    .slice(0, 3)
    .map(activity => activity.title);

  return {
    day: daily.day,
    date: daily.date,
    highlights,
    totalActivities: daily.activities.length,
    estimatedCost: totalCost
  };
}

// ===== Default Configurations =====

/**
 * Default travel tips structure
 */
export const DEFAULT_TRAVEL_TIPS: TravelTips = {
  packing: [
    "Pack layers for varying weather conditions",
    "Bring comfortable walking shoes",
    "Don't forget travel adapters and chargers"
  ],
  cultural: [
    "Research local customs and etiquette",
    "Learn basic phrases in the local language",
    "Respect religious and cultural sites"
  ],
  practical: [
    "Keep digital and physical copies of important documents",
    "Download offline maps and translation apps",
    "Notify banks of travel plans"
  ],
  safety: [
    "Share your itinerary with someone at home",
    "Keep emergency contacts easily accessible",
    "Purchase travel insurance"
  ],
  budgeting: [
    "Set aside extra funds for unexpected expenses",
    "Use local ATMs for better exchange rates",
    "Track daily spending to stay within budget"
  ]
};

/**
 * Default itinerary metadata
 */
export const DEFAULT_METADATA: Omit<ItineraryMetadata, 'generatedAt' | 'agentsUsed' | 'confidence' | 'sources'> = {
  processingTime: 0,
  tokenUsage: {
    "content-planner": 0,
    "info-gatherer": 0,
    "strategist": 0,
    "compiler": 0
  },
  workflowVersion: "1.0.0"
};
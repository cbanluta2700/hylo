import { TripDetailsFormData } from '../schemas/formSchemas';

/**
 * Enhanced Form Data Interface
 * Extends existing TripDetailsFormData with AI-specific preferences and generation context
 */
export interface EnhancedFormData extends TripDetailsFormData {
  // AI-specific preferences
  aiPreferences?: {
    creativityLevel: 'conservative' | 'balanced' | 'adventurous';
    localInsights: boolean;
    realTimeUpdates: boolean;
    contentDepth: 'basic' | 'detailed' | 'comprehensive';
  };

  // Generation context
  generationId?: string;
  previousItineraries?: string[]; // References to past generations
  sessionId: string;
}

/**
 * Validation Rules for EnhancedFormData:
 * - All existing TripDetailsFormData validation rules apply
 * - creativityLevel defaults to 'balanced'
 * - sessionId must be UUID v4 format
 * - previousItineraries max 5 references
 *
 * State Transitions:
 * - draft → validating → generating → complete → archived
 */

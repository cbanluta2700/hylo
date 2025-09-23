/**
 * Hylo AI Clients - Enhanced Setup for Inngest Workflow
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - XAI Grok integration for reasoning tasks
 * - Type-safe development
 *
 * Following architecture structure from migration plan
 */
import type { TravelFormData } from '../../types/travel-form.js';
/**
 * XAI Grok model instances for different tasks
 * Following the existing provider configuration
 */
export declare const grokModel: import("@ai-sdk/provider").LanguageModelV2;
export declare const grokFastModel: import("@ai-sdk/provider").LanguageModelV2;
/**
 * Helper function for generating travel itinerary architecture
 * Used by: Architect Agent in the 4-agent workflow
 */
export declare const generateTravelArchitecture: (formData: TravelFormData) => Promise<string>;
/**
 * Helper function for intelligent recommendation filtering
 * Used by: Specialist Agent for ranking and filtering
 */
export declare const filterRecommendations: (recommendations: any[], preferences: string[], budget?: any) => Promise<string>;
/**
 * Helper function for itinerary formatting
 * Used by: Formatter Agent for final output structuring
 */
export declare const formatItinerary: (rawData: any, travelStyle: string) => Promise<string>;
/**
 * Helper function for gathering web information
 * Used by: Gatherer Agent for research and information collection
 */
export declare const processGatheredInfo: (searchResults: any[], location: string) => Promise<string>;
/**
 * Validate AI providers are available
 * Edge Runtime compatible validation
 */
export declare const validateAIProviders: () => boolean;

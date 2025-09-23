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

import { xai } from '@ai-sdk/xai';
import type { TravelFormData } from '../../types/travel-form.js';

/**
 * XAI Grok model instances for different tasks
 * Following the existing provider configuration
 */
export const grokModel = xai('grok-beta');
export const grokFastModel = xai('grok-4-fast-reasoning'); // For speed-critical tasks

/**
 * Helper function for generating travel itinerary architecture
 * Used by: Architect Agent in the 4-agent workflow
 */
export const generateTravelArchitecture = async (formData: TravelFormData): Promise<string> => {
  const { generateText } = await import('ai');

  const { text: architecture } = await generateText({
    model: grokModel,
    prompt: `Generate detailed travel itinerary architecture for ${formData.location} with ${
      formData.adults
    } adults, ${formData.children} children, budget ${
      formData.budget?.total || 'flexible'
    }, travel style: ${
      formData.travelStyle
    }. Include day-by-day structure, key activities, and accommodation recommendations.`,
    temperature: 0.7, // Creative planning
  });

  return architecture;
};

/**
 * Helper function for intelligent recommendation filtering
 * Used by: Specialist Agent for ranking and filtering
 */
export const filterRecommendations = async (
  recommendations: any[],
  preferences: string[],
  budget?: any
): Promise<string> => {
  const { generateText } = await import('ai');

  const budgetConstraint = budget ? `budget: ${budget.total || budget}` : 'flexible budget';

  const { text: filtered } = await generateText({
    model: grokModel,
    prompt: `Filter and rank these travel recommendations based on preferences: ${preferences.join(
      ', '
    )} and ${budgetConstraint}. Recommendations: ${JSON.stringify(recommendations)}`,
    temperature: 0.4, // Balanced for reasoning and consistency
  });

  return filtered;
};

/**
 * Helper function for itinerary formatting
 * Used by: Formatter Agent for final output structuring
 */
export const formatItinerary = async (rawData: any, travelStyle: string): Promise<string> => {
  const { generateText } = await import('ai');

  const { text: formatted } = await generateText({
    model: grokFastModel, // Use faster model for formatting
    prompt: `Format this travel data into a beautiful, well-structured itinerary with ${travelStyle} style. Data: ${JSON.stringify(
      rawData
    )}`,
    temperature: 0.3, // Low temperature for consistent formatting
  });

  return formatted;
};

/**
 * Helper function for gathering web information
 * Used by: Gatherer Agent for research and information collection
 */
export const processGatheredInfo = async (
  searchResults: any[],
  location: string
): Promise<string> => {
  const { generateText } = await import('ai');

  const { text: processed } = await generateText({
    model: grokFastModel, // Fast processing for large data
    prompt: `Process and synthesize this travel information for ${location}: ${JSON.stringify(
      searchResults
    )}. Extract key insights, activities, and recommendations.`,
    temperature: 0.5, // Moderate creativity for synthesis
  });

  return processed;
};

/**
 * Validate AI providers are available
 * Edge Runtime compatible validation
 */
export const validateAIProviders = (): boolean => {
  const requiredKeys = ['XAI_API_KEY'];
  const missing = requiredKeys.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`[AI Clients] Missing API keys: ${missing.join(', ')}`);
    return false;
  }

  return true;
};

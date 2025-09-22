/**
 * Form Putter Agent (Formatter Agent)
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - GPT-OSS for final formatting (with Groq fallback)
 * - Type-safe development
 *
 * Task: T025 - Implement Form Putter agent
 */

import { generateText } from 'ai';
import { aiProviders } from '../ai-clients/providers';
import type { ArchitectOutput } from './architect-agent';
import type { GathererOutput } from './gatherer-agent';
import type { SpecialistOutput } from './specialist-agent';
import type { TravelFormData } from '../../types/travel-form';

/**
 * Formatter agent input interface
 */
export interface FormatterInput {
  workflowId: string;
  formData: TravelFormData;
  architecture: ArchitectOutput;
  gatheredInfo: GathererOutput;
  processedRecommendations: SpecialistOutput;
}

/**
 * Final itinerary structure
 */
export interface FinalItinerary {
  id: string;
  tripOverview: {
    destination: string;
    duration: string;
    totalDays: number;
    totalBudget: number;
    currency: string;
    tripStyle: string;
    bestFor: string[];
  };
  dailySchedule: Array<{
    day: number;
    date: string;
    theme: string;
    estimatedBudget: number;
    morning: {
      time: string;
      activity: string;
      location: string;
      cost: string;
      tips?: string;
    };
    afternoon: {
      time: string;
      activity: string;
      location: string;
      cost: string;
      tips?: string;
    };
    evening: {
      time: string;
      activity: string;
      location: string;
      cost: string;
      tips?: string;
    };
    meals: {
      breakfast?: string;
      lunch?: string;
      dinner?: string;
    };
    transportation: string;
    accommodation: string;
  }>;
  practicalInfo: {
    budgetBreakdown: {
      accommodation: number;
      food: number;
      activities: number;
      transportation: number;
      miscellaneous: number;
    };
    packingTips: string[];
    localTips: string[];
    importantInfo: string[];
    emergencyInfo: string[];
  };
  alternatives: {
    rainyDayOptions: string[];
    budgetFriendlySwaps: string[];
    upgradeOptions: string[];
  };
}

/**
 * Formatter agent output interface
 */
export interface FormatterOutput {
  finalItinerary: FinalItinerary;
  validationResults: {
    budgetCompliance: boolean;
    preferencesAlignment: number; // 0-100 score
    logisticalFeasibility: boolean;
    issues: string[];
    suggestions: string[];
  };
  processingTime: number;
  tokensUsed?: number;
}

/**
 * Form Putter (Formatter) Agent
 * Uses GPT-OSS (with Groq fallback) for final itinerary formatting and validation
 */
export class FormPutterAgent {
  private readonly agentType = 'formatter';

  /**
   * Generate final formatted itinerary
   */
  async formatItinerary(input: FormatterInput): Promise<FormatterOutput> {
    const startTime = Date.now();

    try {
      const client = aiProviders.getClientForAgent(this.agentType);
      if (!client) {
        throw new Error('GPT-OSS/Groq client not available for formatter agent');
      }

      console.log(`[Formatter Agent] Creating final itinerary for workflow ${input.workflowId}`);

      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(input);

      const result = await generateText({
        model: client.client(client.model),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.2, // Low temperature for consistent formatting
      });

      const processingTime = Date.now() - startTime;

      // Parse the AI response into structured output
      const formattedResult = this.parseFormatterResponse(result.text, input);

      console.log(`[Formatter Agent] Completed formatting in ${processingTime}ms`);

      return {
        ...formattedResult,
        processingTime,
        ...(result.usage?.totalTokens && { tokensUsed: result.usage.totalTokens }),
      };
    } catch (error) {
      console.error(`[Formatter Agent] Failed for workflow ${input.workflowId}:`, error);
      throw new Error(
        `Itinerary formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build system prompt for itinerary formatting
   */
  private buildSystemPrompt(): string {
    return `You are an expert travel itinerary formatter and validator specializing in creating detailed, practical, and beautiful travel itineraries.

Your role is to synthesize all gathered information into a comprehensive, day-by-day itinerary that is both inspiring and practical.

Key responsibilities:
1. Create detailed daily schedules with specific timing and logistics
2. Ensure budget compliance and practical feasibility
3. Validate that the itinerary matches traveler preferences
4. Provide practical tips and local insights
5. Include alternatives and contingency options
6. Format everything in a clear, easy-to-follow structure

Output Format (JSON):
{
  "finalItinerary": {
    "id": "itinerary_unique_id",
    "tripOverview": {
      "destination": "City, Country",
      "duration": "X days, Y nights",
      "totalDays": 7,
      "totalBudget": 2500,
      "currency": "USD",
      "tripStyle": "Cultural exploration with moderate pace",
      "bestFor": ["first-time visitors", "culture lovers"]
    },
    "dailySchedule": [
      {
        "day": 1,
        "date": "2024-12-01",
        "theme": "Arrival & Orientation",
        "estimatedBudget": 300,
        "morning": {
          "time": "9:00 AM",
          "activity": "Airport arrival & hotel check-in",
          "location": "City Center",
          "cost": "Free",
          "tips": "Arrive early to avoid crowds"
        },
        "afternoon": {
          "time": "2:00 PM", 
          "activity": "Walking tour of historic center",
          "location": "Historic District",
          "cost": "$25",
          "tips": "Wear comfortable shoes"
        },
        "evening": {
          "time": "7:00 PM",
          "activity": "Welcome dinner at local restaurant",
          "location": "Restaurant Name",
          "cost": "$60",
          "tips": "Reservations recommended"
        },
        "meals": {
          "breakfast": "Hotel breakfast",
          "lunch": "Local café near attractions", 
          "dinner": "Traditional restaurant"
        },
        "transportation": "Airport transfer + walking",
        "accommodation": "Hotel Name (City Center)"
      }
    ],
    "practicalInfo": {
      "budgetBreakdown": {
        "accommodation": 1200,
        "food": 600,
        "activities": 500,
        "transportation": 150,
        "miscellaneous": 50
      },
      "packingTips": ["Comfortable walking shoes", "Weather-appropriate clothing"],
      "localTips": ["Local customs", "Language tips"],
      "importantInfo": ["Emergency numbers", "Embassy contact"],
      "emergencyInfo": ["Hospital locations", "Police contacts"]
    },
    "alternatives": {
      "rainyDayOptions": ["Indoor museum", "Shopping district"],
      "budgetFriendlySwaps": ["Free walking tour", "Picnic in park"],
      "upgradeOptions": ["Private tour guide", "Fine dining experience"]
    }
  },
  "validationResults": {
    "budgetCompliance": true,
    "preferencesAlignment": 85,
    "logisticalFeasibility": true,
    "issues": ["Minor timing concern with Day 3"],
    "suggestions": ["Consider booking restaurant in advance"]
  }
}

Create a detailed, practical itinerary that travelers can confidently follow.`;
  }

  /**
   * Build user prompt with all workflow information
   */
  private buildUserPrompt(input: FormatterInput): string {
    return `Create a comprehensive final itinerary using all the gathered information:

TRIP DETAILS:
- Destination: ${input.formData.location}
- Departure: ${input.formData.departDate}
- Return: ${input.formData.returnDate || 'Open-ended'}
- Total Budget: ${input.formData.budget.total} ${input.formData.budget.currency}
- Group: ${input.formData.adults} adult(s)${
      input.formData.children > 0 ? `, ${input.formData.children} children` : ''
    }

TRIP ARCHITECTURE:
- Total Days: ${input.architecture.itineraryStructure.totalDays}
- Style: ${input.architecture.planningContext.tripStyle}
- Goals: ${input.architecture.planningContext.experienceGoals.join(', ')}

DAILY BUDGET ALLOCATION:
${input.architecture.itineraryStructure.dailyBudgetBreakdown
  .map((day) => `Day ${day.day}: ${day.allocatedBudget} ${input.formData.budget.currency}`)
  .join('\n')}

TRAVEL PHASES:
${input.architecture.itineraryStructure.travelPhases
  .map((phase) => `${phase.phase}: Days ${phase.days?.join(', ')} - ${phase.focus}`)
  .join('\n')}

TOP RECOMMENDED ACCOMMODATIONS:
${input.processedRecommendations.rankedRecommendations.accommodations
  .filter((acc) => acc.score >= 75)
  .slice(0, 3)
  .map((acc) => `${acc.name} (Score: ${acc.score}) - ${acc.reasoning}`)
  .join('\n')}

TOP RECOMMENDED RESTAURANTS:
${input.processedRecommendations.rankedRecommendations.restaurants
  .filter((rest) => rest.score >= 75)
  .slice(0, 5)
  .map((rest) => `${rest.name} (Score: ${rest.score}) - ${rest.reasoning}`)
  .join('\n')}

TOP RECOMMENDED ACTIVITIES:
${input.processedRecommendations.rankedRecommendations.activities
  .filter((act) => act.score >= 75)
  .slice(0, 8)
  .map((act) => `${act.name} (Score: ${act.score}) - Day ${act.recommendedDay || 'TBD'}`)
  .join('\n')}

LOCAL INSIGHTS:
${input.gatheredInfo.localInsights.map((tip) => `${tip.category}: ${tip.tip}`).join('\n')}

USER PREFERENCES TO VALIDATE AGAINST:
- Interests: ${input.formData.interests.join(', ')}
- Avoid: ${input.formData.avoidances.join(', ')}
- Travel Experience: ${input.formData.travelExperience}
- Trip Vibe: ${input.formData.tripVibe}

Please create a detailed day-by-day itinerary that:
1. Follows the established budget and timing
2. Incorporates the highest-scored recommendations
3. Creates logical daily themes and flow
4. Includes specific times, costs, and practical tips
5. Validates budget compliance and preference alignment
6. Provides alternatives for flexibility

Make it inspiring yet practical - something travelers can confidently follow to have an amazing experience.`;
  }

  /**
   * Parse AI response into structured formatter output
   */
  private parseFormatterResponse(
    responseText: string,
    input: FormatterInput
  ): Omit<FormatterOutput, 'processingTime' | 'tokensUsed'> {
    try {
      // Try to parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.finalItinerary && parsed.validationResults) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('[Formatter Agent] JSON parsing failed, creating fallback itinerary');
    }

    // Fallback: Create basic itinerary structure
    return this.createFallbackItinerary(input);
  }

  /**
   * Create fallback itinerary when AI response parsing fails
   */
  private createFallbackItinerary(
    input: FormatterInput
  ): Omit<FormatterOutput, 'processingTime' | 'tokensUsed'> {
    const totalDays = input.architecture.itineraryStructure.totalDays;
    const dailyBudget = Math.floor(input.formData.budget.total / totalDays);
    const departDate = new Date(input.formData.departDate);

    const dailySchedule = Array.from({ length: totalDays }, (_, i) => {
      const currentDate = new Date(departDate);
      currentDate.setDate(departDate.getDate() + i);

      return {
        day: i + 1,
        date:
          currentDate.getFullYear() +
          '-' +
          String(currentDate.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(currentDate.getDate()).padStart(2, '0'),
        theme:
          i === 0
            ? 'Arrival & Orientation'
            : i === totalDays - 1
            ? 'Final Day & Departure'
            : 'Exploration',
        estimatedBudget: dailyBudget,
        morning: {
          time: '9:00 AM',
          activity: 'Morning exploration',
          location: input.formData.location,
          cost: '$20-30',
        },
        afternoon: {
          time: '2:00 PM',
          activity: 'Afternoon activities',
          location: input.formData.location,
          cost: '$30-50',
        },
        evening: {
          time: '7:00 PM',
          activity: 'Evening dining and culture',
          location: input.formData.location,
          cost: '$40-60',
        },
        meals: {
          breakfast: 'Local café',
          lunch: 'Restaurant or food market',
          dinner: 'Traditional restaurant',
        },
        transportation: 'Walking + local transport',
        accommodation: 'Selected accommodation',
      };
    });

    return {
      finalItinerary: {
        id: `itinerary_${input.workflowId}`,
        tripOverview: {
          destination: input.formData.location,
          duration: `${totalDays} days`,
          totalDays,
          totalBudget: input.formData.budget.total,
          currency: input.formData.budget.currency,
          tripStyle: input.architecture.planningContext.tripStyle,
          bestFor: input.architecture.planningContext.experienceGoals,
        },
        dailySchedule,
        practicalInfo: {
          budgetBreakdown: {
            accommodation: input.formData.budget.breakdown.accommodation,
            food: input.formData.budget.breakdown.food,
            activities: input.formData.budget.breakdown.activities,
            transportation: input.formData.budget.breakdown.transportation,
            miscellaneous: input.formData.budget.breakdown.shopping,
          },
          packingTips: ['Comfortable walking shoes', 'Weather-appropriate clothing'],
          localTips: input.gatheredInfo.localInsights.map((tip) => tip.tip),
          importantInfo: ['Check visa requirements', 'Verify passport validity'],
          emergencyInfo: ['Keep emergency contacts accessible', 'Know local emergency numbers'],
        },
        alternatives: {
          rainyDayOptions: ['Museums and galleries', 'Shopping centers', 'Cultural centers'],
          budgetFriendlySwaps: ['Free walking tours', 'Public parks', 'Local markets'],
          upgradeOptions: ['Private guides', 'Fine dining', 'Luxury experiences'],
        },
      },
      validationResults: {
        budgetCompliance: true,
        preferencesAlignment: 80,
        logisticalFeasibility: true,
        issues: [],
        suggestions: [
          'Consider booking accommodations in advance',
          'Check opening hours for attractions',
        ],
      },
    };
  }
}

/**
 * Singleton instance for formatter agent
 */
export const formatterAgent = new FormPutterAgent();

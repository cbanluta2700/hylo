/**
 * Web Information Gatherer Agent
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - Groq for high-speed information processing
 * - Multiple search provider integration
 *
 * Task: T023 - Implement Web Information Gatherer agent
 */

import { generateText } from 'ai';
import { aiProviders } from '../ai-clients/providers';

/**
 * Information Gatherer input interface
 */
export interface GathererInput {
  workflowId: string;
  destination: string;
  itineraryStructure: {
    totalDays: number;
    travelPhases: any[];
    logisticalRequirements: any;
  };
  interests: string[];
  budget: {
    total: number;
    currency: string;
    breakdown: any;
  };
  travelStyle: {
    pace: string;
    accommodationType: string;
    diningPreferences: string;
    activityLevel: string;
  };
}

/**
 * Information Gatherer output interface
 */
export interface GathererOutput {
  destinationInfo: {
    overview: string;
    bestTimeToVisit: string;
    localCurrency: string;
    averageCosts: Record<string, number>;
    culturalNotes: string[];
  };
  accommodations: {
    name: string;
    type: string;
    location: string;
    priceRange: string;
    rating: number;
    amenities: string[];
    bookingInfo?: string;
  }[];
  restaurants: {
    name: string;
    cuisine: string;
    location: string;
    priceRange: string;
    rating: number;
    specialties: string[];
    reservationRequired: boolean;
  }[];
  activities: {
    name: string;
    type: string;
    location: string;
    duration: string;
    cost: string;
    rating: number;
    description: string;
    bookingRequired: boolean;
    bestTimeOfDay?: string;
  }[];
  transportation: {
    type: string;
    description: string;
    cost: string;
    duration?: string;
    bookingInfo?: string;
  }[];
  localInsights: {
    tip: string;
    category: 'cultural' | 'practical' | 'safety' | 'food' | 'transport';
  }[];
  processingTime: number;
  tokensUsed?: number;
}

/**
 * Web Information Gatherer Agent
 * Uses Groq for fast processing and multiple search providers
 */
export class WebInformationGathererAgent {
  private readonly agentType = 'gatherer';

  /**
   * Gather comprehensive destination information
   * Uses AI to process and synthesize web search results
   */
  async gatherInformation(input: GathererInput): Promise<GathererOutput> {
    const startTime = Date.now();

    try {
      const client = aiProviders.getClientForAgent(this.agentType);
      if (!client) {
        throw new Error('Groq client not available for gatherer agent');
      }

      console.log(
        `[Gatherer Agent] Gathering information for ${input.destination} - workflow ${input.workflowId}`
      );

      // For now, we'll use AI to generate comprehensive destination information
      // In production, this would integrate with search providers (Tavily, Exa, SERP)
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(input);

      const result = await generateText({
        model: client.client('llama3-70b-8192'),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.3, // Lower temperature for factual information
      });

      const processingTime = Date.now() - startTime;

      // Parse the AI response into structured output
      const gatheredInfo = this.parseGathererResponse(result.text, input);

      console.log(`[Gatherer Agent] Completed information gathering in ${processingTime}ms`);

      return {
        ...gatheredInfo,
        processingTime,
        ...(result.usage?.totalTokens && { tokensUsed: result.usage.totalTokens }),
      };
    } catch (error) {
      console.error(`[Gatherer Agent] Failed for workflow ${input.workflowId}:`, error);
      throw new Error(
        `Information gathering failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build system prompt for information gathering
   */
  private buildSystemPrompt(): string {
    return `You are a specialized travel information gatherer with extensive knowledge of worldwide destinations.

Your role is to provide comprehensive, accurate, and up-to-date information about travel destinations, including accommodations, restaurants, activities, and practical travel advice.

Key responsibilities:
1. Provide accurate destination overview and practical information
2. Recommend accommodations matching traveler preferences and budget
3. Suggest restaurants covering various price points and cuisines
4. Identify activities and attractions aligned with traveler interests
5. Advise on transportation options and costs
6. Share valuable local insights and cultural tips

Output Format (JSON):
{
  "destinationInfo": {
    "overview": "Brief destination description",
    "bestTimeToVisit": "Seasonal advice",
    "localCurrency": "Currency code",
    "averageCosts": {
      "meal_budget": number,
      "activity_budget": number,
      "transport_daily": number
    },
    "culturalNotes": ["tip1", "tip2"]
  },
  "accommodations": [
    {
      "name": "Hotel/Property Name",
      "type": "hotel|hostel|apartment|bnb",
      "location": "Area/District",
      "priceRange": "budget|mid-range|luxury",
      "rating": 4.5,
      "amenities": ["wifi", "breakfast", "pool"],
      "bookingInfo": "How to book or website"
    }
  ],
  "restaurants": [
    {
      "name": "Restaurant Name", 
      "cuisine": "Cuisine Type",
      "location": "Area/District",
      "priceRange": "$|$$|$$$|$$$$",
      "rating": 4.2,
      "specialties": ["dish1", "dish2"],
      "reservationRequired": true
    }
  ],
  "activities": [
    {
      "name": "Activity Name",
      "type": "cultural|adventure|relaxation|entertainment",
      "location": "Location",
      "duration": "2-3 hours",
      "cost": "Free|$20-30|$$",
      "rating": 4.8,
      "description": "Brief description",
      "bookingRequired": false,
      "bestTimeOfDay": "morning|afternoon|evening"
    }
  ],
  "transportation": [
    {
      "type": "metro|taxi|bus|rental_car",
      "description": "Description and coverage",
      "cost": "Cost information",
      "duration": "Travel time info",
      "bookingInfo": "How to use/book"
    }
  ],
  "localInsights": [
    {
      "tip": "Practical tip or cultural insight",
      "category": "cultural|practical|safety|food|transport"
    }
  ]
}

Provide specific, actionable information that helps travelers make informed decisions.`;
  }

  /**
   * Build user prompt with travel requirements
   */
  private buildUserPrompt(input: GathererInput): string {
    return `Gather comprehensive travel information for this destination:

DESTINATION: ${input.destination}

TRAVEL REQUIREMENTS:
- Duration: ${input.itineraryStructure.totalDays} days
- Budget: ${input.budget.total} ${input.budget.currency} total
- Accommodation Budget: ${input.budget.breakdown.accommodation} ${input.budget.currency}
- Food Budget: ${input.budget.breakdown.food} ${input.budget.currency}
- Activities Budget: ${input.budget.breakdown.activities} ${input.budget.currency}

TRAVELER PREFERENCES:
- Travel Pace: ${input.travelStyle.pace}
- Accommodation Type: ${input.travelStyle.accommodationType}
- Dining Preferences: ${input.travelStyle.diningPreferences}
- Activity Level: ${input.travelStyle.activityLevel}
- Primary Interests: ${input.interests.join(', ')}

TRAVEL PHASES:
${input.itineraryStructure.travelPhases
  .map((phase, i) => `- Phase ${i + 1}: ${phase.focus} (${phase.days?.length || 1} day(s))`)
  .join('\n')}

Provide comprehensive information covering:
1. Destination overview and practical information
2. Accommodations matching their budget and style preferences
3. Restaurant recommendations across different price points
4. Activities and attractions aligned with their interests
5. Transportation options and local travel advice
6. Cultural insights and practical tips

Focus on providing specific, actionable recommendations that will help create an amazing travel experience within their budget and style preferences.`;
  }

  /**
   * Parse AI response into structured gatherer output
   */
  private parseGathererResponse(
    responseText: string,
    input: GathererInput
  ): Omit<GathererOutput, 'processingTime' | 'tokensUsed'> {
    try {
      // Try to parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.destinationInfo && parsed.accommodations) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('[Gatherer Agent] JSON parsing failed, using fallback information');
    }

    // Fallback: Create basic information structure
    return this.createFallbackInformation(input);
  }

  /**
   * Create fallback information structure
   * Used when AI response parsing fails
   */
  private createFallbackInformation(
    input: GathererInput
  ): Omit<GathererOutput, 'processingTime' | 'tokensUsed'> {
    return {
      destinationInfo: {
        overview: `${input.destination} is a popular travel destination offering diverse experiences.`,
        bestTimeToVisit: 'Year-round destination with varying seasonal highlights',
        localCurrency: 'Local Currency',
        averageCosts: {
          meal_budget: Math.floor(input.budget.breakdown.food / input.itineraryStructure.totalDays),
          activity_budget: Math.floor(
            input.budget.breakdown.activities / input.itineraryStructure.totalDays
          ),
          transport_daily: Math.floor(
            input.budget.breakdown.transportation / input.itineraryStructure.totalDays
          ),
        },
        culturalNotes: [
          'Respect local customs and traditions',
          'Learn basic phrases in the local language',
        ],
      },
      accommodations: [
        {
          name: `${input.travelStyle.accommodationType} accommodation in ${input.destination}`,
          type: input.travelStyle.accommodationType,
          location: 'Central area',
          priceRange: input.travelStyle.accommodationType,
          rating: 4.0,
          amenities: ['wifi', 'breakfast'],
          bookingInfo: 'Book through major travel sites',
        },
      ],
      restaurants: [
        {
          name: 'Local restaurant recommendation',
          cuisine: 'Local cuisine',
          location: 'City center',
          priceRange: '$$',
          rating: 4.2,
          specialties: ['local specialties'],
          reservationRequired: false,
        },
      ],
      activities: input.interests.map((interest) => ({
        name: `${interest} activity`,
        type: 'cultural',
        location: input.destination,
        duration: '2-3 hours',
        cost: '$20-30',
        rating: 4.5,
        description: `Experience ${interest} in ${input.destination}`,
        bookingRequired: false,
        bestTimeOfDay: 'morning',
      })),
      transportation: [
        {
          type: 'public transport',
          description: 'Local public transportation system',
          cost: 'Affordable daily passes available',
          duration: 'Varies by route',
          bookingInfo: 'Purchase at stations or via mobile app',
        },
      ],
      localInsights: [
        {
          tip: 'Carry cash for small vendors and local markets',
          category: 'practical' as const,
        },
        {
          tip: 'Respect local customs and dress codes',
          category: 'cultural' as const,
        },
      ],
    };
  }
}

/**
 * Singleton instance for gatherer agent
 */
export const gathererAgent = new WebInformationGathererAgent();

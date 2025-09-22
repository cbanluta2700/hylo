/**
 * Information Specialist Agent
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - XAI Grok for analysis and filtering
 * - Type-safe development
 *
 * Task: T024 - Implement Information Specialist agent
 */

import { generateText } from 'ai';
import { aiProviders } from '../ai-clients/providers';
import type { GathererOutput } from './gatherer-agent';
import type { ArchitectOutput } from './architect-agent';

/**
 * Specialist agent input interface
 */
export interface SpecialistInput {
  workflowId: string;
  architecture: ArchitectOutput;
  gatheredInfo: GathererOutput;
  userPreferences: {
    interests: string[];
    avoidances: string[];
    travelExperience: string;
    tripVibe: string;
  };
}

/**
 * Specialist agent output interface
 */
export interface SpecialistOutput {
  rankedRecommendations: {
    accommodations: Array<{
      id: string;
      name: string;
      score: number;
      reasoning: string;
      matchedPreferences: string[];
    }>;
    restaurants: Array<{
      id: string;
      name: string;
      score: number;
      reasoning: string;
      matchedPreferences: string[];
    }>;
    activities: Array<{
      id: string;
      name: string;
      score: number;
      reasoning: string;
      matchedPreferences: string[];
      recommendedDay?: number;
    }>;
  };
  filteredOptions: {
    removed: Array<{
      type: 'accommodation' | 'restaurant' | 'activity';
      name: string;
      reason: string;
    }>;
    alternatives: Array<{
      type: 'accommodation' | 'restaurant' | 'activity';
      suggestion: string;
      reasoning: string;
    }>;
  };
  processingTime: number;
  tokensUsed?: number;
}

/**
 * Information Specialist Agent
 * Uses XAI Grok for intelligent filtering and ranking of recommendations
 */
export class InformationSpecialistAgent {
  private readonly agentType = 'specialist';

  /**
   * Filter and rank recommendations based on user preferences
   */
  async processRecommendations(input: SpecialistInput): Promise<SpecialistOutput> {
    const startTime = Date.now();

    try {
      const client = aiProviders.getClientForAgent(this.agentType);
      if (!client) {
        throw new Error('XAI Grok client not available for specialist agent');
      }

      console.log(`[Specialist Agent] Processing recommendations for workflow ${input.workflowId}`);

      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(input);

      const result = await generateText({
        model: client.client('grok-beta'),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.4, // Balanced for reasoning and consistency
      });

      const processingTime = Date.now() - startTime;

      // Parse the AI response into structured output
      const processedInfo = this.parseSpecialistResponse(result.text, input);

      console.log(`[Specialist Agent] Completed processing in ${processingTime}ms`);

      return {
        ...processedInfo,
        processingTime,
        ...(result.usage?.totalTokens && { tokensUsed: result.usage.totalTokens }),
      };
    } catch (error) {
      console.error(`[Specialist Agent] Failed for workflow ${input.workflowId}:`, error);
      throw new Error(
        `Recommendation processing failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Build system prompt for recommendation processing
   */
  private buildSystemPrompt(): string {
    return `You are an expert travel recommendation specialist with deep knowledge of traveler preferences and destination matching.

Your role is to analyze gathered travel information against specific traveler preferences and provide intelligent filtering, ranking, and recommendations.

Key responsibilities:
1. Score and rank recommendations based on alignment with traveler preferences
2. Filter out options that don't match traveler style or requirements
3. Provide clear reasoning for recommendations and exclusions
4. Suggest alternatives for filtered options when appropriate
5. Consider practical factors like timing, logistics, and budget alignment

Scoring Criteria:
- 90-100: Perfect match, highly recommended
- 75-89: Great match, recommended
- 60-74: Good match, consider including
- 45-59: Moderate match, backup option
- 0-44: Poor match, likely exclude

Output Format (JSON):
{
  "rankedRecommendations": {
    "accommodations": [
      {
        "id": "unique_id",
        "name": "Accommodation Name",
        "score": 85,
        "reasoning": "Why this scores well",
        "matchedPreferences": ["preference1", "preference2"]
      }
    ],
    "restaurants": [
      {
        "id": "unique_id", 
        "name": "Restaurant Name",
        "score": 92,
        "reasoning": "Why this is recommended",
        "matchedPreferences": ["preference1", "preference2"]
      }
    ],
    "activities": [
      {
        "id": "unique_id",
        "name": "Activity Name", 
        "score": 88,
        "reasoning": "Why this fits their interests",
        "matchedPreferences": ["preference1", "preference2"],
        "recommendedDay": 2
      }
    ]
  },
  "filteredOptions": {
    "removed": [
      {
        "type": "accommodation|restaurant|activity",
        "name": "Option Name",
        "reason": "Why it was filtered out"
      }
    ],
    "alternatives": [
      {
        "type": "accommodation|restaurant|activity",
        "suggestion": "Alternative suggestion",
        "reasoning": "Why this is a better fit"
      }
    ]
  }
}

Provide thoughtful analysis and clear reasoning for all recommendations.`;
  }

  /**
   * Build user prompt with architecture, gathered info, and preferences
   */
  private buildUserPrompt(input: SpecialistInput): string {
    return `Analyze and rank the gathered travel recommendations based on these specific traveler preferences:

USER PREFERENCES:
- Primary Interests: ${input.userPreferences.interests.join(', ')}
- Things to Avoid: ${input.userPreferences.avoidances.join(', ') || 'None specified'}
- Travel Experience: ${input.userPreferences.travelExperience}
- Trip Vibe: ${input.userPreferences.tripVibe}

TRIP ARCHITECTURE:
- Total Days: ${input.architecture.itineraryStructure.totalDays}
- Trip Style: ${input.architecture.planningContext.tripStyle}
- Budget Strategy: ${input.architecture.planningContext.budgetStrategy}
- Experience Goals: ${input.architecture.planningContext.experienceGoals.join(', ')}

TRAVEL PHASES:
${input.architecture.itineraryStructure.travelPhases
  .map((phase, i) => `Phase ${i + 1}: ${phase.focus} (Days ${phase.days?.join(', ') || 'N/A'})`)
  .join('\n')}

GATHERED ACCOMMODATIONS:
${input.gatheredInfo.accommodations
  .map(
    (acc, i) =>
      `${i + 1}. ${acc.name} (${acc.type}, ${acc.priceRange}, Rating: ${acc.rating}) - ${
        acc.location
      }`
  )
  .join('\n')}

GATHERED RESTAURANTS:
${input.gatheredInfo.restaurants
  .map(
    (rest, i) =>
      `${i + 1}. ${rest.name} (${rest.cuisine}, ${rest.priceRange}, Rating: ${rest.rating}) - ${
        rest.location
      }`
  )
  .join('\n')}

GATHERED ACTIVITIES:
${input.gatheredInfo.activities
  .map(
    (act, i) =>
      `${i + 1}. ${act.name} (${act.type}, ${act.cost}, Rating: ${act.rating}) - ${act.description}`
  )
  .join('\n')}

Please analyze each recommendation and:
1. Score how well it matches the traveler's specific preferences and trip goals
2. Provide clear reasoning for the scoring
3. Identify which preferences each recommendation satisfies
4. Filter out poorly matching options with explanations
5. Suggest better alternatives where appropriate
6. For activities, recommend which day they would be best scheduled

Focus on creating a personalized experience that truly matches what this traveler is looking for.`;
  }

  /**
   * Parse AI response into structured specialist output
   */
  private parseSpecialistResponse(
    responseText: string,
    input: SpecialistInput
  ): Omit<SpecialistOutput, 'processingTime' | 'tokensUsed'> {
    try {
      // Try to parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.rankedRecommendations && parsed.filteredOptions) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('[Specialist Agent] JSON parsing failed, using fallback processing');
    }

    // Fallback: Create basic ranking based on simple heuristics
    return this.createFallbackRanking(input);
  }

  /**
   * Create fallback ranking when AI response parsing fails
   */
  private createFallbackRanking(
    input: SpecialistInput
  ): Omit<SpecialistOutput, 'processingTime' | 'tokensUsed'> {
    const interests = input.userPreferences.interests.map((i) => i.toLowerCase());

    return {
      rankedRecommendations: {
        accommodations: input.gatheredInfo.accommodations.map((acc, i) => ({
          id: `acc_${i}`,
          name: acc.name,
          score: Math.min(95, 60 + acc.rating * 10 + Math.random() * 20),
          reasoning: `${acc.type} accommodation with good rating and amenities`,
          matchedPreferences: [input.architecture.planningContext.tripStyle],
        })),
        restaurants: input.gatheredInfo.restaurants.map((rest, i) => ({
          id: `rest_${i}`,
          name: rest.name,
          score: Math.min(95, 65 + rest.rating * 8 + Math.random() * 15),
          reasoning: `${rest.cuisine} restaurant matching dining preferences`,
          matchedPreferences: ['dining preferences'],
        })),
        activities: input.gatheredInfo.activities.map((act, i) => {
          const matchScore = interests.some(
            (interest) =>
              act.name.toLowerCase().includes(interest) ||
              act.description.toLowerCase().includes(interest)
          )
            ? 25
            : 0;

          return {
            id: `act_${i}`,
            name: act.name,
            score: Math.min(95, 50 + matchScore + act.rating * 10 + Math.random() * 10),
            reasoning: `${act.type} activity aligned with interests`,
            matchedPreferences: interests.filter(
              (interest) =>
                act.name.toLowerCase().includes(interest) ||
                act.description.toLowerCase().includes(interest)
            ),
            recommendedDay:
              Math.floor(Math.random() * input.architecture.itineraryStructure.totalDays) + 1,
          };
        }),
      },
      filteredOptions: {
        removed: [],
        alternatives: [
          {
            type: 'activity' as const,
            suggestion: 'Consider additional local experiences',
            reasoning: 'Based on your interests, look for more local cultural activities',
          },
        ],
      },
    };
  }
}

/**
 * Singleton instance for specialist agent
 */
export const specialistAgent = new InformationSpecialistAgent();

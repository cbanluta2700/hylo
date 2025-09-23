/**
 * Itinerary Architect Agent
 *
 * Constitutional Requirement  async execute(input: ArchitectInput): Promise<ArchitectOutput> {
    console.log('🏗️ [80] Architect Agent: Starting itinerary architecture generation', {
      workflowId: input.workflowId.substring(0, 15) + '...',
      location: input.formData.location,
      budget: input.formData.budget.total,
      travelers: `${input.formData.adults}+${input.formData.children}`
    });

    const startTime = Date.now();

    try {
      const client = aiProviders.getClientForAgent(this.agentType);
      if (!client) {
        console.error('❌ [81] Architect Agent: XAI Grok client not available');
        throw new Error('XAI Grok client not available for architect agent');
      }

      console.log('🤖 [82] Architect Agent: XAI Grok client acquired');

      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(input.formData);

      console.log('📝 [83] Architect Agent: Prompts prepared', {
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length,
        includesLocation: userPrompt.includes(input.formData.location)
      });

      console.log(`🔄 [84] Architect Agent: Generating architecture for workflow ${input.workflowId.substring(0, 15)}...`); Runtime compatibility
 * - Type-safe development with Zod validation
 * - XAI Grok-4-Fast-Reasoning for complex planning
 *
 * Task: T022 - Implement Itinerary Architect agent
 */

import { generateText } from 'ai';
import { aiProviders } from '../ai-clients/providers.js';
import { TravelFormData } from '../../types/travel-form.js';

/**
 * Architect agent input interface
 */
export interface ArchitectInput {
  formData: TravelFormData;
  workflowId: string;
}

/**
 * Architect agent output interface
 * Creates the structural framework for the itinerary
 */
export interface ArchitectOutput {
  itineraryStructure: {
    totalDays: number;
    dailyBudgetBreakdown: {
      day: number;
      allocatedBudget: number;
      plannedCategories: string[];
    }[];
    travelPhases: {
      phase: string;
      days: number[];
      focus: string;
      priorities: string[];
    }[];
    logisticalRequirements: {
      transportation: string[];
      accommodation: string[];
      reservationNeeds: string[];
    };
  };
  planningContext: {
    tripStyle: string;
    budgetStrategy: string;
    timeOptimization: string;
    experienceGoals: string[];
  };
  processingTime: number;
  tokensUsed?: number;
}

/**
 * Itinerary Architect Agent
 * Uses XAI Grok for complex reasoning and trip structure planning
 */
export class ItineraryArchitectAgent {
  private readonly agentType = 'architect';

  /**
   * Generate trip structure and framework
   * Creates the foundation for all other agents to build upon
   */
  async generateArchitecture(input: ArchitectInput): Promise<ArchitectOutput> {
    console.log('🏗️ [80] Architect Agent: Starting itinerary architecture generation', {
      workflowId: input.workflowId.substring(0, 15) + '...',
      location: input.formData.location,
      budget: input.formData.budget.total,
      travelers: `${input.formData.adults}+${input.formData.children}`,
    });

    const startTime = Date.now();

    try {
      const client = aiProviders.getClientForAgent(this.agentType);
      if (!client) {
        console.error('❌ [81] Architect Agent: XAI Grok client not available');
        throw new Error('XAI Grok client not available for architect agent');
      }

      console.log('🤖 [82] Architect Agent: XAI Grok client acquired');

      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(input.formData);

      console.log('📝 [83] Architect Agent: Prompts prepared', {
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length,
        includesLocation: userPrompt.includes(input.formData.location),
      });

      console.log(
        `🔄 [84] Architect Agent: Generating architecture for workflow ${input.workflowId.substring(
          0,
          15
        )}...`
      );

      const result = await generateText({
        model: client.client('grok-beta'),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.7,
      });

      const processingTime = Date.now() - startTime;

      // Parse the AI response into structured output
      const architecture = this.parseArchitectureResponse(result.text, input.formData);

      console.log(`[Architect Agent] Completed in ${processingTime}ms`);

      return {
        ...architecture,
        processingTime,
        ...(result.usage?.totalTokens && { tokensUsed: result.usage.totalTokens }),
      };
    } catch (error) {
      console.error(`[Architect Agent] Failed for workflow ${input.workflowId}:`, error);
      throw new Error(
        `Architecture generation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Build system prompt for architecture planning
   */
  private buildSystemPrompt(): string {
    return `You are an expert travel itinerary architect specializing in creating comprehensive trip frameworks.

Your role is to analyze travel preferences and create a detailed structural foundation that other agents will use to populate with specific activities, restaurants, and accommodations.

Key responsibilities:
1. Analyze the traveler's style, budget, and preferences
2. Create a logical day-by-day framework with budget allocation
3. Identify travel phases (arrival, exploration, experiences, departure)
4. Determine logistical requirements and timing constraints
5. Set priorities for each phase based on traveler preferences

Output Format (JSON):
{
  "itineraryStructure": {
    "totalDays": number,
    "dailyBudgetBreakdown": [
      {
        "day": number,
        "allocatedBudget": number,
        "plannedCategories": ["accommodation", "food", "activities", "transportation"]
      }
    ],
    "travelPhases": [
      {
        "phase": "arrival" | "exploration" | "experiences" | "departure",
        "days": [day_numbers],
        "focus": "brief_description",
        "priorities": ["priority1", "priority2"]
      }
    ],
    "logisticalRequirements": {
      "transportation": ["type1", "type2"],
      "accommodation": ["type1", "type2"],
      "reservationNeeds": ["item1", "item2"]
    }
  },
  "planningContext": {
    "tripStyle": "description",
    "budgetStrategy": "description", 
    "timeOptimization": "description",
    "experienceGoals": ["goal1", "goal2"]
  }
}

Be specific, practical, and aligned with the traveler's stated preferences and constraints.`;
  }

  /**
   * Build user prompt with travel form data
   */
  private buildUserPrompt(formData: TravelFormData): string {
    const departDate = new Date(formData.departDate);
    const returnDate = formData.returnDate ? new Date(formData.returnDate) : null;
    const totalDays =
      formData.plannedDays ||
      (returnDate
        ? Math.ceil((returnDate.getTime() - departDate.getTime()) / (1000 * 60 * 60 * 24))
        : 7);

    return `Plan the architectural framework for this trip:

DESTINATION & TIMING:
- Location: ${formData.location}
- Departure: ${formData.departDate}
- Return: ${formData.returnDate || 'Open-ended'}
- Duration: ${totalDays} days
- Group: ${formData.adults} adult(s)${
      formData.children > 0 ? `, ${formData.children} child(ren)` : ''
    }

BUDGET INFORMATION:
- Total Budget: ${formData.budget.total} ${formData.budget.currency}
- Accommodation: ${formData.budget.breakdown.accommodation} ${formData.budget.currency}
- Food: ${formData.budget.breakdown.food} ${formData.budget.currency}  
- Activities: ${formData.budget.breakdown.activities} ${formData.budget.currency}
- Transportation: ${formData.budget.breakdown.transportation} ${formData.budget.currency}
- Flexibility: ${formData.budget.flexibility}

TRAVEL STYLE & PREFERENCES:
- Pace: ${formData.travelStyle.pace}
- Accommodation Type: ${formData.travelStyle.accommodationType}
- Dining Preferences: ${formData.travelStyle.diningPreferences}
- Activity Level: ${formData.travelStyle.activityLevel}
- Cultural Immersion: ${formData.travelStyle.culturalImmersion}

INTERESTS & ACTIVITIES:
- Primary Interests: ${formData.interests.join(', ')}
- Things to Avoid: ${formData.avoidances.join(', ') || 'None specified'}
- Dietary Restrictions: ${formData.dietaryRestrictions.join(', ') || 'None'}
- Trip Vibe: ${formData.tripVibe}
- Experience Level: ${formData.travelExperience}
- Dinner Preference: ${formData.dinnerChoice}

ADDITIONAL SERVICES:
${
  Object.entries(formData.additionalServices)
    .filter(([_, value]) => value)
    .map(([service, _]) => `- ${service.replace('_', ' ')}: Requested`)
    .join('\n') || '- No additional services requested'
}

Create a comprehensive architectural framework that maximizes their experience within budget constraints while respecting their travel style and preferences.`;
  }

  /**
   * Parse AI response into structured architecture output
   */
  private parseArchitectureResponse(
    responseText: string,
    formData: TravelFormData
  ): Omit<ArchitectOutput, 'processingTime' | 'tokensUsed'> {
    try {
      // Try to parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.itineraryStructure && parsed.planningContext) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('[Architect Agent] JSON parsing failed, using fallback structure');
    }

    // Fallback: Create structured response from form data
    return this.createFallbackArchitecture(formData);
  }

  /**
   * Create fallback architecture structure
   * Used when AI response parsing fails
   */
  private createFallbackArchitecture(
    formData: TravelFormData
  ): Omit<ArchitectOutput, 'processingTime' | 'tokensUsed'> {
    const totalDays = formData.plannedDays || 7;
    const dailyBudget = Math.floor(formData.budget.total / totalDays);

    const dailyBudgetBreakdown = Array.from({ length: totalDays }, (_, i) => ({
      day: i + 1,
      allocatedBudget: dailyBudget,
      plannedCategories: ['accommodation', 'food', 'activities', 'transportation'],
    }));

    const travelPhases = [
      {
        phase: 'arrival' as const,
        days: [1],
        focus: 'Settle in and explore immediate area',
        priorities: ['accommodation', 'orientation', 'local food'],
      },
      {
        phase: 'exploration' as const,
        days: Array.from({ length: Math.max(1, totalDays - 2) }, (_, i) => i + 2),
        focus: 'Main activities and experiences',
        priorities: formData.interests.slice(0, 3),
      },
      {
        phase: 'departure' as const,
        days: [totalDays],
        focus: 'Final experiences and departure preparation',
        priorities: ['departure logistics', 'final shopping'],
      },
    ];

    return {
      itineraryStructure: {
        totalDays,
        dailyBudgetBreakdown,
        travelPhases,
        logisticalRequirements: {
          transportation: ['airport transfer', 'local transport'],
          accommodation: [formData.travelStyle.accommodationType],
          reservationNeeds: ['restaurant bookings', 'activity tickets'],
        },
      },
      planningContext: {
        tripStyle: `${formData.travelStyle.pace} pace with ${formData.travelStyle.culturalImmersion} cultural immersion`,
        budgetStrategy: `${formData.budget.flexibility} budget approach`,
        timeOptimization: `${formData.travelStyle.activityLevel} activity level`,
        experienceGoals: formData.interests.slice(0, 4),
      },
    };
  }
}

/**
 * Singleton instance for architect agent
 */
export const architectAgent = new ItineraryArchitectAgent();

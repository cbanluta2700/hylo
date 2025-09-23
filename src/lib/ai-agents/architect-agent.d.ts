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
export declare class ItineraryArchitectAgent {
    private readonly agentType;
    /**
     * Generate trip structure and framework
     * Creates the foundation for all other agents to build upon
     */
    generateArchitecture(input: ArchitectInput): Promise<ArchitectOutput>;
    /**
     * Build system prompt for architecture planning
     */
    private buildSystemPrompt;
    /**
     * Build user prompt with travel form data
     */
    private buildUserPrompt;
    /**
     * Parse AI response into structured architecture output
     */
    private parseArchitectureResponse;
    /**
     * Create fallback architecture structure
     * Used when AI response parsing fails
     */
    private createFallbackArchitecture;
}
/**
 * Singleton instance for architect agent
 */
export declare const architectAgent: ItineraryArchitectAgent;

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
import type { GathererOutput } from './gatherer-agent.js';
import type { ArchitectOutput } from './architect-agent.js';
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
export declare class InformationSpecialistAgent {
    private readonly agentType;
    /**
     * Filter and rank recommendations based on user preferences
     */
    processRecommendations(input: SpecialistInput): Promise<SpecialistOutput>;
    /**
     * Build system prompt for recommendation processing
     */
    private buildSystemPrompt;
    /**
     * Build user prompt with architecture, gathered info, and preferences
     */
    private buildUserPrompt;
    /**
     * Parse AI response into structured specialist output
     */
    private parseSpecialistResponse;
    /**
     * Create fallback ranking when AI response parsing fails
     */
    private createFallbackRanking;
}
/**
 * Singleton instance for specialist agent
 */
export declare const specialistAgent: InformationSpecialistAgent;

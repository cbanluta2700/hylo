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
import type { ArchitectOutput } from './architect-agent.js';
import type { GathererOutput } from './gatherer-agent.js';
import type { SpecialistOutput } from './specialist-agent.js';
import type { TravelFormData } from '../../types/travel-form.js';
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
        preferencesAlignment: number;
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
export declare class FormPutterAgent {
    private readonly agentType;
    /**
     * Generate final formatted itinerary
     */
    formatItinerary(input: FormatterInput): Promise<FormatterOutput>;
    /**
     * Build system prompt for itinerary formatting
     */
    private buildSystemPrompt;
    /**
     * Build user prompt with all workflow information
     */
    private buildUserPrompt;
    /**
     * Parse AI response into structured formatter output
     */
    private parseFormatterResponse;
    /**
     * Create fallback itinerary when AI response parsing fails
     */
    private createFallbackItinerary;
}
/**
 * Singleton instance for formatter agent
 */
export declare const formatterAgent: FormPutterAgent;

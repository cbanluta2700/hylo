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
export declare class WebInformationGathererAgent {
    private readonly agentType;
    /**
     * Gather comprehensive destination information
     * Uses AI to process and synthesize web search results
     */
    gatherInformation(input: GathererInput): Promise<GathererOutput>;
    /**
     * Build system prompt for information gathering
     */
    private buildSystemPrompt;
    /**
     * Build user prompt with travel requirements
     */
    private buildUserPrompt;
    /**
     * Parse AI response into structured gatherer output
     */
    private parseGathererResponse;
    /**
     * Create fallback information structure
     * Used when AI response parsing fails
     */
    private createFallbackInformation;
}
/**
 * Singleton instance for gatherer agent
 */
export declare const gathererAgent: WebInformationGathererAgent;

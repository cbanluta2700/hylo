/**
 * Simplified Info Gatherer Agent for Unit Testing
 * 
 * This is a minimal implementation of the InfoGathererAgent that focuses on
 * core functionality and proper TypeScript typing for unit testing.
 */

import { 
  Agent, 
  AgentResult, 
  WorkflowContext,
  AgentType,
  WorkflowConfig,
  AgentError,
  AgentExecutionMetadata,
  LLMProvider,
  AgentErrorType
} from "../../../src/types/agents.js";

/**
 * Minimal Gathered Information Repository for testing
 */
interface MinimalGatheredInformationRepository {
  accommodations: Array<{
    name: string;
    type: string;
    rating: number;
    priceRange: string;
  }>;
  activities: Array<{
    name: string;
    category: string;
    duration: string;
    pricing: string;
  }>;
  restaurants: Array<{
    name: string;
    cuisine: string;
    rating: number;
    priceRange: string;
  }>;
  transportation: {
    airports: Array<{ code: string; name: string; }>;
    publicTransport: { types: string[]; };
    rideshare: { available: boolean; providers: string[]; };
  };
  weather: {
    destination: string;
    forecast: Array<{ date: string; temperature: string; conditions: string; }>;
  };
  safety: {
    overallRating: number;
    recommendations: string[];
  };
  searchMetadata: {
    queriesExecuted: number;
    sourcesAccessed: string[];
    informationCompleteness: number;
    lastUpdated: Date;
  };
}

/**
 * Info Gatherer Agent - Simple Implementation
 */
export class InfoGathererAgent implements Agent {
  readonly name: AgentType = AgentType.INFO_GATHERER;
  readonly version = "1.0.0";
  readonly timeout = 30000; // 30 seconds
  readonly maxCost = 2.00; // $2.00 USD (higher due to web scraping)
  
  private config: WorkflowConfig;
  
  constructor(config: WorkflowConfig) {
    this.config = config;
  }
  
  /**
   * Execute information gathering
   */
  async execute(context: WorkflowContext): Promise<AgentResult> {
    const startTime = new Date();
    const errors: AgentError[] = [];
    
    try {
      // Validate that we have planning context from previous agent
      const planningContext = context.agentResults[AgentType.CONTENT_PLANNER]?.data;
      if (!planningContext) {
        throw new Error("No content planning context available from previous agent");
      }
      
      // Simulate information gathering based on destination
      const destination = context.formData.destination;
      const travelStyle = context.formData.preferences.travelStyle;
      
      // Create minimal gathered information repository
      const gatheredInfo: MinimalGatheredInformationRepository = {
        accommodations: this.gatherAccommodationInfo(destination, travelStyle),
        activities: this.gatherActivityInfo(destination, travelStyle),
        restaurants: this.gatherRestaurantInfo(destination),
        transportation: this.gatherTransportationInfo(destination),
        weather: this.gatherWeatherInfo(destination),
        safety: this.gatherSafetyInfo(destination),
        searchMetadata: {
          queriesExecuted: 8,
          sourcesAccessed: ['booking.com', 'tripadvisor.com', 'localguides.com', 'weather.com'],
          informationCompleteness: 0.85,
          lastUpdated: new Date()
        }
      };
      
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startTime.getTime();
      
      const metadata: AgentExecutionMetadata = {
        startedAt: startTime,
        completedAt,
        durationMs,
        cost: 0.15, // Simulated cost for web scraping
        provider: LLMProvider.GROQ,
        tokens: {
          input: 500,
          output: 1200,
          total: 1700
        },
        retryAttempts: 0,
        version: this.version
      };
      
      return {
        agent: AgentType.INFO_GATHERER,
        success: true,
        data: gatheredInfo,
        metadata,
        errors,
        nextAgent: AgentType.STRATEGIST,
        confidence: 0.85
      };
      
    } catch (error) {
      const agentError: AgentError = {
        type: AgentErrorType.EXECUTION_ERROR,
        message: error instanceof Error ? error.message : "Information gathering failed",
        severity: 'medium',
        recoverable: true,
        suggestedAction: 'Retry with different search parameters',
        details: {
          destination: context.formData?.destination || 'unknown',
          phase: 'info-gathering'
        }
      };
      
      errors.push(agentError);
      
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startTime.getTime();
      
      const metadata: AgentExecutionMetadata = {
        startedAt: startTime,
        completedAt,
        durationMs,
        cost: 0,
        provider: LLMProvider.GROQ,
        tokens: { input: 0, output: 0, total: 0 },
        retryAttempts: 0,
        version: this.version
      };
      
      return {
        agent: AgentType.INFO_GATHERER,
        success: false,
        data: null,
        metadata,
        errors,
        confidence: 0
      };
    }
  }
  
  /**
   * Validate input from previous agent
   */
  async validateInput(input: unknown): Promise<boolean> {
    try {
      // For this agent, we need a WorkflowContext with planning results
      const context = input as WorkflowContext;
      
      if (!context || typeof context !== 'object') {
        return false;
      }
      
      // Check if we have form data
      if (!context.formData || !context.formData.destination) {
        return false;
      }
      
      // Check if we have planning context from previous agent
      const planningResult = context.agentResults?.[AgentType.CONTENT_PLANNER];
      if (!planningResult || !planningResult.success) {
        return false;
      }
      
      return true;
      
    } catch {
      return false;
    }
  }
  
  /**
   * Cleanup resources after execution
   */
  async cleanup(): Promise<void> {
    // No resources to cleanup for this simplified agent
    return Promise.resolve();
  }
  
  /**
   * Gather accommodation information (simulated)
   */
  private gatherAccommodationInfo(destination: string, travelStyle: string) {
    const baseAccommodations = [
      { name: `${destination} Grand Hotel`, type: 'hotel', rating: 4.2, priceRange: '$$' },
      { name: `Central ${destination} Hostel`, type: 'hostel', rating: 3.8, priceRange: '$' },
      { name: `${destination} Luxury Resort`, type: 'resort', rating: 4.8, priceRange: '$$$' }
    ];
    
    // Filter based on travel style
    if (travelStyle === 'budget') {
      return baseAccommodations.filter(acc => acc.priceRange === '$');
    } else if (travelStyle === 'luxury') {
      return baseAccommodations.filter(acc => acc.priceRange === '$$$');
    }
    
    return baseAccommodations;
  }
  
  /**
   * Gather activity information (simulated)
   */
  private gatherActivityInfo(destination: string, travelStyle: string) {
    const baseActivities = [
      { name: `${destination} City Tour`, category: 'sightseeing', duration: '3 hours', pricing: '$30' },
      { name: `${destination} Museum Visit`, category: 'culture', duration: '2 hours', pricing: '$15' },
      { name: `${destination} Food Tour`, category: 'culinary', duration: '4 hours', pricing: '$65' },
      { name: `Adventure ${destination} Experience`, category: 'adventure', duration: '6 hours', pricing: '$120' }
    ];
    
    // Filter based on travel style
    if (travelStyle === 'culture') {
      return baseActivities.filter(act => act.category === 'culture' || act.category === 'sightseeing');
    } else if (travelStyle === 'adventure') {
      return baseActivities.filter(act => act.category === 'adventure' || act.category === 'sightseeing');
    }
    
    return baseActivities;
  }
  
  /**
   * Gather restaurant information (simulated)
   */
  private gatherRestaurantInfo(destination: string) {
    return [
      { name: `Traditional ${destination} Cuisine`, cuisine: 'local', rating: 4.3, priceRange: '$$' },
      { name: `${destination} Fine Dining`, cuisine: 'international', rating: 4.7, priceRange: '$$$' },
      { name: `Street Food ${destination}`, cuisine: 'street food', rating: 4.0, priceRange: '$' }
    ];
  }
  
  /**
   * Gather transportation information (simulated)
   */
  private gatherTransportationInfo(destination: string) {
    return {
      airports: [
        { code: 'XYZ', name: `${destination} International Airport` }
      ],
      publicTransport: {
        types: ['metro', 'bus', 'tram']
      },
      rideshare: {
        available: true,
        providers: ['Uber', 'Lyft', 'Local Taxi']
      }
    };
  }
  
  /**
   * Gather weather information (simulated)
   */
  private gatherWeatherInfo(destination: string) {
    return {
      destination,
      forecast: [
        { date: '2024-03-01', temperature: '22°C', conditions: 'Partly Cloudy' },
        { date: '2024-03-02', temperature: '24°C', conditions: 'Sunny' },
        { date: '2024-03-03', temperature: '21°C', conditions: 'Light Rain' }
      ]
    };
  }
  
  /**
   * Gather safety information (simulated)
   */
  private gatherSafetyInfo(destination: string) {
    return {
      overallRating: 4.2,
      recommendations: [
        'Stay aware of surroundings in crowded areas',
        'Keep valuables secure',
        `${destination} is generally safe for tourists`
      ]
    };
  }
}
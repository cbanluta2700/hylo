/**
 * Simplified Content Planner Agent for Unit Testing
 * 
 * This is a minimal implementation of the ContentPlannerAgent that focuses on
 * core functionality and proper TypeScript typing for unit testing.
 */

import { z } from "zod";
import { 
  Agent, 
  AgentResult, 
  TravelFormData, 
  WorkflowContext,
  AgentType,
  WorkflowConfig,
  AgentError,
  AgentExecutionMetadata,
  LLMProvider,
  AgentErrorType
} from "../../../src/types/agents.js";

/**
 * Minimal Content Planning Context for testing
 */
interface MinimalContentPlanningContext {
  destination: {
    primary: string;
    currency: {
      code: string;
    };
  };
  travelDates: {
    departure: Date;
    return: Date;
    duration: number;
  };
  travelers: {
    adults: number;
    children: number;
    total: number;
  };
  budget: {
    amount: number;
    currency: string;
    mode: string;
    breakdown: {
      accommodation: number;
      foodAndDining: number;
      activities: number;
    };
  };
  preferences: {
    travelStyle: string;
  };
  searchQueries: Array<{
    id: string;
    query: string;
  }>;
  informationRequirements: {
    accommodations: any[];
    activities: any[];
  };
  priorities: {
    high: string[];
    timeAllocation: Record<string, number>;
  };
}

/**
 * Content Planner Agent - Simple Implementation
 */
export class ContentPlannerAgent implements Agent {
  readonly name: AgentType = AgentType.CONTENT_PLANNER;
  readonly version = "1.0.0";
  readonly timeout = 30000; // 30 seconds
  readonly maxCost = 0.50; // $0.50 USD
  
  private config: WorkflowConfig;
  
  constructor(config: WorkflowConfig) {
    this.config = config;
  }
  
  /**
   * Execute content planning analysis
   */
  async execute(context: WorkflowContext): Promise<AgentResult> {
    const startTime = new Date();
    const errors: AgentError[] = [];
    
    try {
      // Validate input
      const isValid = await this.validateInput(context.formData);
      if (!isValid) {
        throw new Error("Invalid form data provided");
      }
      
      // Calculate duration
      const departure = new Date(context.formData.departureDate);
      const returnDate = new Date(context.formData.returnDate);
      const duration = Math.ceil((returnDate.getTime() - departure.getTime()) / (1000 * 60 * 60 * 24));
      
      // Create minimal content planning context
      const contentContext: MinimalContentPlanningContext = {
        destination: {
          primary: context.formData.destination,
          currency: {
            code: context.formData.budget.currency
          }
        },
        travelDates: {
          departure,
          return: returnDate,
          duration
        },
        travelers: {
          adults: context.formData.adults,
          children: context.formData.children,
          total: context.formData.adults + context.formData.children
        },
        budget: {
          amount: context.formData.budget.amount,
          currency: context.formData.budget.currency,
          mode: context.formData.budget.mode,
          breakdown: {
            accommodation: Math.round(context.formData.budget.amount * 0.4),
            foodAndDining: Math.round(context.formData.budget.amount * 0.25),
            activities: Math.round(context.formData.budget.amount * 0.25)
          }
        },
        preferences: {
          travelStyle: context.formData.preferences.travelStyle
        },
        searchQueries: [
          {
            id: 'query_1',
            query: `${context.formData.destination} travel guide`
          },
          {
            id: 'query_2', 
            query: `things to do in ${context.formData.destination}`
          }
        ],
        informationRequirements: {
          accommodations: [],
          activities: []
        },
        priorities: {
          high: ['destination_info', 'accommodation'],
          timeAllocation: {
            accommodation: 25,
            activities: 35,
            dining: 20,
            transportation: 10,
            practical: 10
          }
        }
      };
      
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startTime.getTime();
      
      const metadata: AgentExecutionMetadata = {
        startedAt: startTime,
        completedAt,
        durationMs,
        cost: 0.01, // Fixed low cost for rule-based analysis
        provider: LLMProvider.CEREBRAS,
        tokens: {
          input: 0,
          output: 0,
          total: 0
        },
        retryAttempts: 0,
        version: this.version
      };
      
      return {
        agent: AgentType.CONTENT_PLANNER,
        success: true,
        data: contentContext,
        metadata,
        errors,
        nextAgent: AgentType.INFO_GATHERER,
        confidence: 0.8
      };
      
    } catch (error) {
      const agentError: AgentError = {
        type: AgentErrorType.EXECUTION_ERROR,
        message: error instanceof Error ? error.message : "Content planning failed",
        timestamp: new Date(),
        retryable: true,
        details: {
          destination: context.formData?.destination || 'unknown'
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
        provider: LLMProvider.CEREBRAS,
        tokens: { input: 0, output: 0, total: 0 },
        retryAttempts: 0,
        version: this.version
      };
      
      return {
        agent: AgentType.CONTENT_PLANNER,
        success: false,
        data: null,
        metadata,
        errors,
        confidence: 0
      };
    }
  }
  
  /**
   * Validate input form data
   */
  async validateInput(input: unknown): Promise<boolean> {
    try {
      const formData = input as TravelFormData;
      
      // Basic validation checks
      if (!formData || typeof formData !== 'object') {
        return false;
      }
      
      if (!formData.destination || formData.destination.length < 2) {
        return false;
      }
      
      if (!formData.adults || formData.adults < 1) {
        return false;
      }
      
      if (!formData.departureDate || !formData.returnDate) {
        return false;
      }
      
      // Date validation
      const departure = new Date(formData.departureDate);
      const returnDate = new Date(formData.returnDate);
      
      if (departure >= returnDate) {
        return false;
      }
      
      // Don't enforce future dates in tests
      return true;
      
    } catch {
      return false;
    }
  }
  
  /**
   * Cleanup resources after execution
   */
  async cleanup(): Promise<void> {
    // No resources to cleanup for this agent
    return Promise.resolve();
  }
}
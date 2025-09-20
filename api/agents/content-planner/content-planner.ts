/**
 * Content Planner Agent Base Class for Hylo Multi-Agent Travel Planning System
 * 
 * This module defines the base class for the Content Planner agent, which is responsible
 * for analyzing travel form data and identifying information needs for the trip. It serves
 * as the first agent in the multi-agent workflow, processing user requirements and creating
 * structured planning context for subsequent agents.
 * 
 * Based on existing codebase patterns with TypeScript, Zod validation, and structured content analysis.
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
import { 
  ContentPlanningContext
} from "../../../src/types/workflow.js";
import {
  DestinationType,
  Season,
  TouristSeason,
  TravelPattern,
  TravelExperience,
  GroupType
} from "../../../src/types/workflow.js";

// ===== Content Planning Schemas =====

/**
 * Zod schema for information needs identification
 */
export const InformationNeedsSchema = z.object({
  accommodationRequirements: z.object({
    needed: z.boolean(),
    priority: z.enum(["high", "medium", "low"]),
    specificRequirements: z.array(z.string()),
    priceRange: z.string().optional(),
    location: z.string().optional()
  }),
  
  restaurantAndFood: z.object({
    needed: z.boolean(),
    priority: z.enum(["high", "medium", "low"]),
    cuisinePreferences: z.array(z.string()),
    dietaryRestrictions: z.array(z.string()),
    priceRange: z.string().optional(),
    mealTypes: z.array(z.enum(["breakfast", "lunch", "dinner", "snacks"]))
  }),
  
  activitiesAndAttractions: z.object({
    needed: z.boolean(),
    priority: z.enum(["high", "medium", "low"]),
    interestCategories: z.array(z.string()),
    physicalRequirements: z.array(z.string()),
    timePreferences: z.array(z.string()),
    budgetConstraints: z.string().optional()
  }),
  
  transportation: z.object({
    needed: z.boolean(),
    priority: z.enum(["high", "medium", "low"]),
    localTransport: z.boolean(),
    airportTransfers: z.boolean(),
    carRental: z.boolean(),
    publicTransit: z.boolean()
  }),
  
  practicalInformation: z.object({
    needed: z.boolean(),
    priority: z.enum(["high", "medium", "low"]),
    weatherForecast: z.boolean(),
    culturalInfo: z.boolean(),
    safetyInfo: z.boolean(),
    currencyAndCosts: z.boolean(),
    localEvents: z.boolean()
  }),
  
  specialRequirements: z.object({
    accessibility: z.array(z.string()),
    familyFriendly: z.boolean(),
    businessTravel: z.boolean(),
    celebrations: z.array(z.string()),
    customRequests: z.array(z.string())
  })
});

/**
 * Zod schema for content planning output
 */
export const ContentPlanningOutputSchema = z.object({
  tripAnalysis: z.object({
    destination: z.string(),
    duration: z.number().positive(),
    travelerCount: z.number().positive(),
    tripPurpose: z.enum(["leisure", "business", "family", "romantic", "adventure", "cultural", "mixed"]),
    budgetCategory: z.enum(["budget", "mid-range", "luxury", "flexible"]),
    seasonalConsiderations: z.array(z.string())
  }),
  
  informationNeeds: InformationNeedsSchema,
  
  researchPriorities: z.array(z.object({
    category: z.string(),
    priority: z.enum(["high", "medium", "low"]),
    questions: z.array(z.string()),
    searchQueries: z.array(z.string())
  })),
  
  contentStrategy: z.object({
    recommendedSources: z.array(z.string()),
    searchKeywords: z.array(z.string()),
    informationDepth: z.enum(["basic", "detailed", "comprehensive"]),
    timeAllocation: z.record(z.string(), z.number())
  }),
  
  qualityMetrics: z.object({
    completenessScore: z.number().min(0).max(1),
    specificityScore: z.number().min(0).max(1),
    feasibilityScore: z.number().min(0).max(1),
    confidenceLevel: z.number().min(0).max(1)
  })
});

// ===== Content Planner Agent Class =====

/**
 * Content Planner Agent - First agent in the multi-agent workflow
 * 
 * Responsibilities:
 * - Analyze travel form data and extract key requirements
 * - Identify specific information needs for the trip
 * - Create structured context for subsequent agents
 * - Prioritize research areas based on trip characteristics
 * - Generate targeted search queries for information gathering
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
      
      // Generate content planning context
      const planningOutput = await this.generateContentPlan(context.formData);
      
      // Create content planning context
      const contentContext: ContentPlanningContext = {
        destination: {
          primary: planningOutput.tripAnalysis.destination,
          type: DestinationType.CITY, // Default, could be enhanced
          geography: {
            country: "", // To be enhanced
            region: "", // To be enhanced
            continent: "", // To be enhanced
            coordinates: { latitude: 0, longitude: 0 }, // To be enhanced
            timezone: "" // To be enhanced
          },
          characteristics: [], // To be enhanced
          seasonality: {
            season: Season.SPRING, // Default
            weather: { temperature: { min: 0, max: 0 }, conditions: [] },
            touristSeason: TouristSeason.SHOULDER,
            events: []
          },
          languages: ["English"], // Default
          currency: {
            code: context.formData.budget.currency,
            name: context.formData.budget.currency,
            symbol: "$" // Default
          }
        },
        travelDates: {
          departure: new Date(context.formData.departureDate),
          return: new Date(context.formData.returnDate),
          duration: planningOutput.tripAnalysis.duration,
          pattern: TravelPattern.ROUND_TRIP,
          dayOfWeekFactors: [],
          holidays: []
        },
        travelers: {
          adults: context.formData.adults,
          children: context.formData.children,
          total: planningOutput.tripAnalysis.travelerCount,
          ageGroups: {},
          specialNeeds: context.formData.preferences.accessibility || [],
          travelExperience: TravelExperience.INTERMEDIATE,
          groupType: context.formData.children > 0 ? GroupType.FAMILY : GroupType.COUPLE,
          planningStyle: "structured"
        },
        budget: {
          amount: context.formData.budget.amount,
          currency: formData.budget.currency,
          mode: formData.budget.mode,
          breakdown: {
            accommodation: Math.round(formData.budget.amount * 0.4),
            food: Math.round(formData.budget.amount * 0.25),
            activities: Math.round(formData.budget.amount * 0.25),
            transport: Math.round(formData.budget.amount * 0.1)
          },
          flexibility: formData.budget.mode === "flexible" ? 0.3 : 0.1,
          priorityAreas: ["accommodation", "activities"]
        },
        preferences: {
          travelStyle: formData.preferences.travelStyle,
          interests: formData.preferences.interests,
          accommodationType: formData.preferences.accommodationType || "any",
          transportMode: formData.preferences.transportationMode || "any",
          dietaryRestrictions: formData.preferences.dietaryRestrictions || [],
          accessibility: formData.preferences.accessibility || [],
          pace: "moderate",
          groupDynamic: formData.children > 0 ? "family" : "adult"
        },
        informationRequirements: this.createInformationRequirements(planningOutput),
        searchQueries: this.generateSearchQueries(planningOutput).map((query, index) => ({
          id: `query_${index}`,
          query,
          category: this.categorizeQuery(query),
          priority: index < 5 ? "high" : "medium",
          expectedSources: ["official", "reviews", "blogs"]
        })),
        priorities: {
          high: planningOutput.researchPriorities
            .filter(p => p.priority === "high")
            .map(p => p.category),
          medium: planningOutput.researchPriorities
            .filter(p => p.priority === "medium")
            .map(p => p.category),
          low: planningOutput.researchPriorities
            .filter(p => p.priority === "low")
            .map(p => p.category),
          timeAllocation: planningOutput.contentStrategy.timeAllocation
        }
      };
      
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startTime.getTime();
      
      const metadata: AgentExecutionMetadata = {
        startedAt: startTime,
        completedAt,
        durationMs,
        cost: this.estimateExecutionCost(context.formData),
        provider: LLMProvider.OPENAI, // Default provider, though not actually used for this rule-based agent
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
        confidence: planningOutput.qualityMetrics.confidenceLevel
      };
      
    } catch (error) {
      const agentError: AgentError = {
        code: "CONTENT_PLANNING_ERROR",
        message: error instanceof Error ? error.message : "Content planning failed",
        timestamp: new Date(),
        retryable: true,
        details: {
          destination: context.formData.destination,
          duration: this.calculateDuration(
            context.formData.departureDate, 
            context.formData.returnDate
          )
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
        tokensUsed: 0,
        model: "internal-analysis",
        providerId: "content-planner-v1"
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
      if (!formData.destination || formData.destination.length < 2) {
        return false;
      }
      
      if (formData.adults < 1) {
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
      
      if (departure < new Date()) {
        return false; // Cannot plan for past dates
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
    // No resources to cleanup for this agent
    return Promise.resolve();
  }
  
  /**
   * Generate structured content plan using rule-based analysis
   */
  private async generateContentPlan(
    formData: TravelFormData
  ): Promise<z.infer<typeof ContentPlanningOutputSchema>> {
    const duration = this.calculateDuration(formData.departureDate, formData.returnDate);
    const travelerCount = formData.adults + formData.children;
    
    // Analyze trip purpose from travel style and interests
    const tripPurpose = this.analyzeTripPurpose(formData);
    const budgetCategory = this.analyzeBudgetCategory(formData);
    const seasonalConsiderations = this.getSeasonalConsiderations(
      formData.destination, 
      formData.departureDate
    );
    
    // Generate information needs based on form data
    const informationNeeds = this.analyzeInformationNeeds(formData);
    
    // Create research priorities
    const researchPriorities = this.createResearchPriorities(formData, informationNeeds);
    
    // Define content strategy
    const contentStrategy = this.createContentStrategy(formData, duration, travelerCount);
    
    // Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(formData);
    
    return {
      tripAnalysis: {
        destination: formData.destination,
        duration,
        travelerCount,
        tripPurpose,
        budgetCategory,
        seasonalConsiderations
      },
      informationNeeds,
      researchPriorities,
      contentStrategy,
      qualityMetrics
    };
  }
  
  /**
   * Analyze trip purpose from form data
   */
  private analyzeTripPurpose(formData: TravelFormData): "leisure" | "business" | "family" | "romantic" | "adventure" | "cultural" | "mixed" {
    const travelStyle = formData.preferences.travelStyle;
    const hasChildren = formData.children > 0;
    const isCouple = formData.adults === 2 && formData.children === 0;
    
    if (hasChildren) return "family";
    if (isCouple && ["luxury", "relaxation"].includes(travelStyle)) return "romantic";
    if (travelStyle === "adventure") return "adventure";
    if (travelStyle === "culture") return "cultural";
    if (travelStyle === "business") return "business";
    
    return "leisure";
  }
  
  /**
   * Analyze budget category from form data
   */
  private analyzeBudgetCategory(formData: TravelFormData): "budget" | "mid-range" | "luxury" | "flexible" {
    const budgetMode = formData.budget.mode;
    const budgetAmount = formData.budget.amount;
    const travelStyle = formData.preferences.travelStyle;
    
    if (budgetMode === "flexible") return "flexible";
    if (travelStyle === "luxury") return "luxury";
    if (travelStyle === "budget") return "budget";
    
    // Simple heuristic based on per-person daily budget
    const duration = this.calculateDuration(formData.departureDate, formData.returnDate);
    const travelerCount = formData.adults + formData.children;
    const dailyPerPerson = budgetAmount / (duration * travelerCount);
    
    if (dailyPerPerson < 100) return "budget";
    if (dailyPerPerson > 300) return "luxury";
    return "mid-range";
  }
  
  /**
   * Get seasonal considerations for destination
   */
  private getSeasonalConsiderations(destination: string, departureDate: string): string[] {
    const month = new Date(departureDate).getMonth(); // 0-11
    const considerations: string[] = [];
    
    // Simple seasonal logic (would be enhanced with real destination data)
    if (month >= 11 || month <= 2) { // Winter months
      considerations.push("Winter season - check weather conditions");
      considerations.push("Pack warm clothing");
      considerations.push("Check for seasonal closures");
    } else if (month >= 6 && month <= 8) { // Summer months
      considerations.push("Summer season - expect crowds");
      considerations.push("Book accommodations early");
      considerations.push("Consider heat and sun protection");
    } else if (month >= 3 && month <= 5) { // Spring
      considerations.push("Spring season - pleasant weather expected");
      considerations.push("Good time for outdoor activities");
    } else { // Fall
      considerations.push("Fall season - beautiful colors expected");
      considerations.push("Check local harvest/festival seasons");
    }
    
    return considerations;
  }
  
  /**
   * Analyze information needs from form data
   */
  private analyzeInformationNeeds(formData: TravelFormData): z.infer<typeof InformationNeedsSchema> {
    const hasChildren = formData.children > 0;
    const dietaryRestrictions = formData.preferences.dietaryRestrictions || [];
    const accessibility = formData.preferences.accessibility || [];
    const interests = formData.preferences.interests || [];
    
    return {
      accommodationRequirements: {
        needed: true,
        priority: "high",
        specificRequirements: hasChildren ? ["family-friendly", "child-safe"] : [],
        priceRange: this.getBudgetRange(formData.budget),
        location: "city center or tourist area"
      },
      
      restaurantAndFood: {
        needed: true,
        priority: "medium",
        cuisinePreferences: interests.filter(i => i.includes("food") || i.includes("cuisine")),
        dietaryRestrictions,
        priceRange: this.getBudgetRange(formData.budget),
        mealTypes: ["breakfast", "lunch", "dinner"]
      },
      
      activitiesAndAttractions: {
        needed: true,
        priority: "high",
        interestCategories: interests,
        physicalRequirements: accessibility,
        timePreferences: [],
        budgetConstraints: this.getBudgetRange(formData.budget)
      },
      
      transportation: {
        needed: true,
        priority: "medium",
        localTransport: true,
        airportTransfers: true,
        carRental: formData.preferences.transportationMode === "car",
        publicTransit: true
      },
      
      practicalInformation: {
        needed: true,
        priority: "medium",
        weatherForecast: true,
        culturalInfo: true,
        safetyInfo: true,
        currencyAndCosts: true,
        localEvents: true
      },
      
      specialRequirements: {
        accessibility,
        familyFriendly: hasChildren,
        businessTravel: formData.preferences.travelStyle === "business",
        celebrations: [],
        customRequests: []
      }
    };
  }
  
  /**
   * Get budget range string from budget object
   */
  private getBudgetRange(budget: TravelFormData['budget']): string {
    if (budget.mode === "flexible") return "flexible";
    
    const amount = budget.amount;
    if (amount < 1000) return "budget";
    if (amount < 5000) return "mid-range";
    return "luxury";
  }
  
  /**
   * Create research priorities from information needs
   */
  private createResearchPriorities(
    formData: TravelFormData,
    needs: z.infer<typeof InformationNeedsSchema>
  ): Array<{
    category: string;
    priority: "high" | "medium" | "low";
    questions: string[];
    searchQueries: string[];
  }> {
    const priorities = [];
    
    if (needs.accommodationRequirements.needed) {
      priorities.push({
        category: "Accommodation",
        priority: needs.accommodationRequirements.priority,
        questions: [
          `What are the best ${needs.accommodationRequirements.priceRange} accommodations in ${formData.destination}?`,
          "Which areas are safest and most convenient for tourists?",
          "What amenities are typically included?"
        ],
        searchQueries: [
          `best hotels ${formData.destination} ${needs.accommodationRequirements.priceRange}`,
          `${formData.destination} accommodation reviews 2024`,
          `where to stay ${formData.destination}`
        ]
      });
    }
    
    if (needs.activitiesAndAttractions.needed) {
      priorities.push({
        category: "Activities & Attractions",
        priority: needs.activitiesAndAttractions.priority,
        questions: [
          `What are the must-see attractions in ${formData.destination}?`,
          "Which activities align with our interests?",
          "What are the costs and time requirements?"
        ],
        searchQueries: [
          `top attractions ${formData.destination}`,
          `things to do ${formData.destination}`,
          ...needs.activitiesAndAttractions.interestCategories.map(
            interest => `${interest} activities ${formData.destination}`
          )
        ]
      });
    }
    
    if (needs.restaurantAndFood.needed) {
      priorities.push({
        category: "Dining & Food",
        priority: needs.restaurantAndFood.priority,
        questions: [
          `What are the best restaurants in ${formData.destination}?`,
          "Where can we find authentic local cuisine?",
          "Are there good options for our dietary restrictions?"
        ],
        searchQueries: [
          `best restaurants ${formData.destination}`,
          `local cuisine ${formData.destination}`,
          ...needs.restaurantAndFood.dietaryRestrictions.map(
            restriction => `${restriction} restaurants ${formData.destination}`
          )
        ]
      });
    }
    
    return priorities;
  }
  
  /**
   * Create content strategy
   */
  private createContentStrategy(
    formData: TravelFormData,
    duration: number,
    travelerCount: number
  ): {
    recommendedSources: string[];
    searchKeywords: string[];
    informationDepth: "basic" | "detailed" | "comprehensive";
    timeAllocation: Record<string, number>;
  } {
    const complexity = duration * 0.2 + travelerCount * 0.1;
    const informationDepth = complexity > 1.5 ? "comprehensive" : complexity > 0.8 ? "detailed" : "basic";
    
    return {
      recommendedSources: [
        "Official tourism websites",
        "Travel guidebooks",
        "Recent travel blogs",
        "Review platforms",
        "Local event calendars"
      ],
      searchKeywords: [
        formData.destination,
        "travel guide",
        "attractions",
        "restaurants",
        "hotels",
        formData.preferences.travelStyle,
        ...formData.preferences.interests
      ],
      informationDepth,
      timeAllocation: {
        "accommodation": 25,
        "activities": 35,
        "dining": 20,
        "transportation": 10,
        "practical": 10
      }
    };
  }
  
  /**
   * Calculate quality metrics
   */
  private calculateQualityMetrics(formData: TravelFormData): {
    completenessScore: number;
    specificityScore: number;
    feasibilityScore: number;
    confidenceLevel: number;
  } {
    // Completeness based on provided form data
    let completeness = 0.5; // Base score
    if (formData.preferences.interests.length > 0) completeness += 0.2;
    if (formData.preferences.accommodationType) completeness += 0.1;
    if (formData.preferences.transportationMode) completeness += 0.1;
    if (formData.preferences.dietaryRestrictions?.length) completeness += 0.1;
    
    // Specificity based on detail level
    const specificity = Math.min(
      0.5 + (formData.preferences.interests.length * 0.1) + 
      (formData.destination.length > 10 ? 0.2 : 0.1),
      1.0
    );
    
    // Feasibility based on realistic constraints
    const budget = formData.budget.amount;
    const duration = this.calculateDuration(formData.departureDate, formData.returnDate);
    const feasibility = budget > (duration * 50) ? 0.9 : 0.7; // Basic feasibility check
    
    // Overall confidence
    const confidenceLevel = (completeness + specificity + feasibility) / 3;
    
    return {
      completenessScore: Math.min(completeness, 1.0),
      specificityScore: Math.min(specificity, 1.0),
      feasibilityScore: Math.min(feasibility, 1.0),
      confidenceLevel: Math.min(confidenceLevel, 1.0)
    };
  }
  
  /**
   * Generate search queries from planning output
   */
  private generateSearchQueries(planningOutput: z.infer<typeof ContentPlanningOutputSchema>): string[] {
    const queries: string[] = [];
    
    // Base destination queries
    queries.push(`${planningOutput.tripAnalysis.destination} travel guide ${new Date().getFullYear()}`);
    queries.push(`best things to do ${planningOutput.tripAnalysis.destination}`);
    
    // Research priority queries
    planningOutput.researchPriorities.forEach(priority => {
      queries.push(...priority.searchQueries.slice(0, 2)); // Limit per category
    });
    
    return queries.slice(0, 12); // Limit total queries
  }
  
  /**
   * Create information needs structure from planning output
   */
  private createInformationNeedsFromOutput(
    planningOutput: z.infer<typeof ContentPlanningOutputSchema>
  ): ContentPlanningContext['informationNeeds'] {
    // For now, return a basic structure
    // In a full implementation, this would transform the structured needs
    return {
      accommodations: [],
      restaurants: [],
      activities: [],
      transportation: {
        airports: [],
        publicTransport: { types: [], ticketPricing: {}, coverage: "" },
        rideshare: { available: false, providers: [], estimatedCosts: {} },
        carRental: { available: false, providers: [], averageDailyCost: 0, parkingInfo: "" },
        walkability: { score: 0, description: "" }
      },
      weather: { destination: planningOutput.tripAnalysis.destination, forecast: [], packingTips: [] },
      events: [],
      safety: {
        overallRating: 0,
        categories: { pettyTheft: 0, violentCrime: 0, scams: 0, naturalHazards: 0, healthRisks: 0 },
        recommendations: [],
        emergencyContacts: { police: "", medical: "", tourism: "" },
        areas: { safe: [], caution: [], avoid: [] }
      },
      culture: {
        customs: [], etiquette: [], language: { primary: "", common: [], phrases: {} },
        tipping: { expected: false, amounts: {} },
        dress: { general: "", religious: "", formal: "" }, holidays: []
      },
      practical: {
        currency: { code: "", symbol: "", exchangeRate: 0 },
        electricity: { voltage: 0, plugType: [] },
        timeZone: { name: "", offset: "", dst: false },
        internet: { wifiAvailability: "", mobileData: "", costs: {} },
        visa: { required: false }
      },
      pricing: {
        accommodation: { budget: {}, mid: {}, luxury: {} },
        food: { streetFood: {}, casual: {}, fineDining: {} },
        activities: { free: [], budget: {}, premium: {} },
        transport: { local: {}, intercity: {}, international: {} },
        dailyBudget: { backpacker: 0, midRange: 0, luxury: 0 }
      }
    };
  }
  
  /**
   * Calculate complexity score
   */
  private calculateComplexity(planningOutput: z.infer<typeof ContentPlanningOutputSchema>): number {
    let complexity = 0;
    
    // Duration factor
    complexity += Math.min(planningOutput.tripAnalysis.duration * 0.1, 0.4);
    
    // Traveler count factor
    complexity += Math.min(planningOutput.tripAnalysis.travelerCount * 0.05, 0.2);
    
    // Special requirements factor
    const specialReqs = planningOutput.informationNeeds.specialRequirements;
    if (specialReqs.accessibility.length > 0) complexity += 0.2;
    if (specialReqs.familyFriendly) complexity += 0.1;
    if (specialReqs.businessTravel) complexity += 0.1;
    
    return Math.min(complexity, 1.0);
  }
  
  /**
   * Calculate trip duration in days
   */
  private calculateDuration(departureDate: string, returnDate: string): number {
    const start = new Date(departureDate);
    const end = new Date(returnDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Estimate execution cost
   */
  private estimateExecutionCost(formData: TravelFormData): number {
    // Fixed cost for rule-based analysis (no LLM usage)
    return 0.01; // $0.01 USD
  }
  
  /**
   * Estimate token usage
   */
  private estimateTokenUsage(formData: TravelFormData): number {
    // No tokens used for rule-based analysis
    return 0;
  }
}

// ===== Factory and Utility Functions =====

/**
 * Create a new Content Planner agent instance
 */
export function createContentPlannerAgent(config: WorkflowConfig): ContentPlannerAgent {
  return new ContentPlannerAgent(config);
}

/**
 * Validate content planning output
 */
export function validateContentPlanningOutput(data: unknown): z.infer<typeof ContentPlanningOutputSchema> {
  return ContentPlanningOutputSchema.parse(data);
}
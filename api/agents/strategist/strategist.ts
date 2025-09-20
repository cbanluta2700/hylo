/**
 * Planning Strategist Agent Base Class for Hylo Multi-Agent Travel Planning System
 * 
 * This module defines the base class for the Planning Strategist agent, which is responsible
 * for processing the gathered information from the Info Gatherer and generating strategic
 * travel recommendations. It analyzes the collected data, identifies optimal travel patterns,
 * and provides strategic planning insights for itinerary compilation.
 * 
 * The strategist uses rule-based analysis and optimization algorithms to create the best
 * travel strategies based on user preferences, budget constraints, and gathered information.
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
  ContentPlanningContext,
  GatheredInformationRepository,
  StrategicPlanningResult
} from "../../../src/types/workflow.js";

// ===== Strategic Planning Schemas =====

/**
 * Zod schema for travel optimization preferences
 */
export const TravelOptimizationSchema = z.object({
  primaryGoal: z.enum(["budget", "experience", "comfort", "discovery", "relaxation"]),
  timeAllocation: z.object({
    activities: z.number().min(0).max(1), // Percentage of time for activities
    relaxation: z.number().min(0).max(1), // Percentage for relaxation
    exploration: z.number().min(0).max(1), // Percentage for exploration
    flexibility: z.number().min(0).max(1)  // Buffer time percentage
  }),
  preferences: z.object({
    pacePreference: z.enum(["slow", "moderate", "fast"]),
    experienceDepth: z.enum(["surface", "moderate", "deep"]),
    crowdTolerance: z.enum(["avoid", "neutral", "embrace"]),
    adventureLevel: z.enum(["conservative", "moderate", "adventurous"])
  })
});

/**
 * Zod schema for strategic recommendation
 */
export const StrategicRecommendationSchema = z.object({
  id: z.string(),
  type: z.enum(["accommodation", "activity", "dining", "transportation", "timing", "budget", "practical"]),
  priority: z.enum(["critical", "high", "medium", "low"]),
  title: z.string(),
  description: z.string(),
  reasoning: z.string(),
  
  impact: z.object({
    budget: z.enum(["negative", "neutral", "positive"]),
    experience: z.enum(["negative", "neutral", "positive"]), 
    time: z.enum(["saves", "neutral", "requires"]),
    comfort: z.enum(["decreases", "neutral", "increases"])
  }),
  
  implementation: z.object({
    difficulty: z.enum(["easy", "moderate", "hard"]),
    timeRequired: z.string(),
    dependencies: z.array(z.string()),
    alternatives: z.array(z.string())
  }),
  
  metadata: z.object({
    confidence: z.number().min(0).max(1),
    source: z.string(),
    lastUpdated: z.date(),
    applicabilityScore: z.number().min(0).max(1)
  })
});

/**
 * Zod schema for strategic planning output
 */
export const StrategicPlanningOutputSchema = z.object({
  sessionId: z.string(),
  destination: z.string(),
  planningSession: z.object({
    startTime: z.date(),
    endTime: z.date(),
    analysisDepth: z.enum(["basic", "standard", "comprehensive"]),
    dataQuality: z.number().min(0).max(1),
    strategicFocus: z.array(z.string())
  }),
  
  travelStrategy: z.object({
    overallApproach: z.enum(["structured", "flexible", "mixed"]),
    recommendedPace: z.enum(["relaxed", "moderate", "intensive"]),
    focusAreas: z.array(z.string()),
    avoidanceFactors: z.array(z.string()),
    
    budgetStrategy: z.object({
      allocation: z.object({
        accommodation: z.number().min(0).max(1),
        dining: z.number().min(0).max(1),
        activities: z.number().min(0).max(1),
        transportation: z.number().min(0).max(1),
        miscellaneous: z.number().min(0).max(1)
      }),
      savingOpportunities: z.array(z.string()),
      splurgeRecommendations: z.array(z.string())
    }),
    
    timeStrategy: z.object({
      idealDuration: z.string(),
      minimumDuration: z.string(),
      peakTimes: z.array(z.string()),
      avoidTimes: z.array(z.string()),
      flexibilityRecommendations: z.array(z.string())
    })
  }),
  
  recommendations: z.array(StrategicRecommendationSchema),
  
  itineraryBlueprint: z.object({
    structure: z.object({
      recommendedDays: z.number(),
      activitiesPerDay: z.number(),
      restDays: z.number(),
      bufferTime: z.number()
    }),
    
    dailyTemplates: z.array(z.object({
      dayType: z.enum(["arrival", "full", "departure", "rest", "adventure", "cultural"]),
      suggestedActivities: z.number(),
      energyLevel: z.enum(["low", "medium", "high"]),
      flexibility: z.number().min(0).max(1),
      notes: z.string()
    })),
    
    sequencing: z.object({
      logicalFlow: z.array(z.string()),
      dependencies: z.array(z.object({
        prerequisite: z.string(),
        dependent: z.string(),
        reason: z.string()
      })),
      flexibilityPoints: z.array(z.string())
    })
  }),
  
  riskAssessment: z.object({
    identifiedRisks: z.array(z.object({
      type: z.enum(["weather", "season", "capacity", "budget", "logistical", "safety"]),
      description: z.string(),
      likelihood: z.enum(["low", "medium", "high"]),
      impact: z.enum(["low", "medium", "high"]),
      mitigation: z.array(z.string())
    })),
    contingencyPlans: z.array(z.string()),
    flexibilityFactors: z.array(z.string())
  }),
  
  qualityMetrics: z.object({
    strategicAlignment: z.number().min(0).max(1),
    feasibilityScore: z.number().min(0).max(1),
    optimizationLevel: z.number().min(0).max(1),
    personalizationScore: z.number().min(0).max(1)
  }),
  
  processingStatistics: z.object({
    informationProcessed: z.number(),
    recommendationsGenerated: z.number(),
    strategicAnalysisTime: z.number(),
    optimizationIterations: z.number(),
    confidence: z.number().min(0).max(1)
  })
});

// ===== Planning Strategist Agent Class =====

/**
 * Planning Strategist Agent - Third agent in the multi-agent workflow
 * 
 * Responsibilities:
 * - Analyze gathered information for strategic insights
 * - Generate travel strategy based on user preferences and constraints
 * - Create strategic recommendations for optimal travel experience
 * - Design itinerary blueprint for content compilation
 * - Perform risk assessment and contingency planning
 * - Optimize resource allocation and time management
 */
export class PlanningStrategistAgent implements Agent {
  readonly name: AgentType = AgentType.STRATEGIST;
  readonly version = "1.0.0";
  readonly timeout = 90000; // 1.5 minutes for strategic analysis
  readonly maxCost = 1.50; // $1.50 USD for analysis processing
  
  private config: WorkflowConfig;
  
  constructor(config: WorkflowConfig) {
    this.config = config;
  }
  
  /**
   * Execute strategic planning process
   */
  async execute(context: WorkflowContext): Promise<AgentResult> {
    const startTime = new Date();
    const errors: AgentError[] = [];
    const sessionId = this.generateSessionId();
    
    try {
      // Validate input
      const isValid = await this.validateInput(context);
      if (!isValid) {
        throw new Error("Invalid context provided for strategic planning");
      }
      
      // Extract information repository from previous agent result
      const infoGathererResult = context.agentResults[AgentType.INFO_GATHERER];
      if (!infoGathererResult || !infoGathererResult.success) {
        throw new Error("Information Gatherer results are required");
      }
      
      const informationRepository = infoGathererResult.data as GatheredInformationRepository;
      if (!informationRepository) {
        throw new Error("Information repository is required from Info Gatherer");
      }
      
      // Generate strategic planning output
      const strategicPlan = await this.generateStrategicPlan(
        informationRepository,
        context.formData,
        sessionId
      );
      
      // Create strategic planning result for workflow state  
      const strategicPlanningResult: StrategicPlanningResult = {
        recommendations: strategicPlan,
        confidence: strategicPlan.processingStatistics.confidence,
        processingTimeMs: strategicPlan.processingStatistics.strategicAnalysisTime
      };
      
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startTime.getTime();
      
      const metadata: AgentExecutionMetadata = {
        startedAt: startTime,
        completedAt,
        durationMs,
        cost: this.calculateStrategicPlanningCost(strategicPlan.processingStatistics),
        provider: LLMProvider.CEREBRAS, // Using Cerebras for strategic analysis
        tokens: {
          input: this.estimateTokenUsage(informationRepository, "input"),
          output: this.estimateTokenUsage(strategicPlan, "output"),
          total: this.estimateTokenUsage(informationRepository, "input") + this.estimateTokenUsage(strategicPlan, "output")
        },
        retryAttempts: 0,
        version: this.version
      };
      
      return {
        agent: AgentType.STRATEGIST,
        success: true,
        data: strategicPlanningResult,
        metadata,
        errors,
        nextAgent: AgentType.COMPILER,
        confidence: strategicPlanningResult.confidence
      };
      
    } catch (error) {
      const agentError: AgentError = {
        type: AgentErrorType.EXECUTION_ERROR,
        message: error instanceof Error ? error.message : "Strategic planning failed",
        severity: "high",
        recoverable: true,
        suggestedAction: "Retry with simplified analysis or fallback to template-based strategy",
        details: {
          destination: context.formData.destination,
          sessionId,
          timestamp: new Date()
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
        agent: AgentType.STRATEGIST,
        success: false,
        data: null,
        metadata,
        errors,
        confidence: 0
      };
    }
  }
  
  /**
   * Validate input context
   */
  async validateInput(input: unknown): Promise<boolean> {
    try {
      const context = input as WorkflowContext;
      
      if (!context.formData?.destination) {
        return false;
      }
      
      if (!context.agentResults[AgentType.INFO_GATHERER]) {
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
    return Promise.resolve();
  }
  
  /**
   * Generate strategic travel plan (mock implementation)
   * In a real implementation, this would use advanced analytics and optimization algorithms
   */
  private async generateStrategicPlan(
    informationRepository: GatheredInformationRepository,
    formData: TravelFormData,
    sessionId: string
  ): Promise<z.infer<typeof StrategicPlanningOutputSchema>> {
    const startTime = new Date();
    
    // Analyze user preferences and constraints
    const optimization = this.analyzeUserOptimization(formData);
    
    // Generate travel strategy
    const travelStrategy = await this.generateTravelStrategy(informationRepository, formData, optimization);
    
    // Generate strategic recommendations
    const recommendations = await this.generateStrategicRecommendations(
      informationRepository,
      formData,
      travelStrategy
    );
    
    // Design itinerary blueprint
    const itineraryBlueprint = await this.designItineraryBlueprint(
      informationRepository,
      formData,
      travelStrategy,
      recommendations
    );
    
    // Perform risk assessment
    const riskAssessment = await this.performRiskAssessment(
      informationRepository,
      formData,
      travelStrategy
    );
    
    const endTime = new Date();
    const analysisTime = endTime.getTime() - startTime.getTime();
    
    return {
      sessionId,
      destination: formData.destination, // Use form destination instead
      planningSession: {
        startTime,
        endTime,
        analysisDepth: "comprehensive",
        dataQuality: informationRepository.quality?.coverage || 0.8, // Use quality.coverage instead
        strategicFocus: this.identifyStrategicFocus(formData, travelStrategy)
      },
      travelStrategy,
      recommendations,
      itineraryBlueprint,
      riskAssessment,
      qualityMetrics: {
        strategicAlignment: this.calculateStrategicAlignment(travelStrategy, formData),
        feasibilityScore: this.calculateFeasibilityScore(recommendations, formData),
        optimizationLevel: this.calculateOptimizationLevel(travelStrategy, optimization),
        personalizationScore: this.calculatePersonalizationScore(recommendations, formData)
      },
      processingStatistics: {
        informationProcessed: this.countProcessedInformation(informationRepository),
        recommendationsGenerated: recommendations.length,
        strategicAnalysisTime: analysisTime,
        optimizationIterations: 3, // Mock iterations
        confidence: this.calculateOverallConfidence(travelStrategy, recommendations)
      }
    };
  }
  
  /**
   * Analyze user optimization preferences from form data
   */
  private analyzeUserOptimization(formData: TravelFormData): z.infer<typeof TravelOptimizationSchema> {
    // Rule-based analysis of user preferences
    const budgetLevel = this.analyzeBudgetLevel(formData.budget);
    const groupSize = (formData.adults || 1) + (formData.children || 0);
    const travelStyle = formData.preferences.travelStyle;
    
    let primaryGoal: "budget" | "experience" | "comfort" | "discovery" | "relaxation" = "experience";
    
    if (budgetLevel === "low") primaryGoal = "budget";
    else if (travelStyle === "luxury") primaryGoal = "comfort";
    else if (travelStyle === "adventure") primaryGoal = "discovery";
    else if (travelStyle === "relaxation") primaryGoal = "relaxation";
    
    const timeAllocation = this.calculateTimeAllocation(travelStyle, groupSize);
    const preferences = this.deriveUserPreferences(formData, travelStyle);
    
    return {
      primaryGoal,
      timeAllocation,
      preferences
    };
  }
  
  /**
   * Generate comprehensive travel strategy
   */
  private async generateTravelStrategy(
    informationRepository: GatheredInformationRepository,
    formData: TravelFormData,
    optimization: z.infer<typeof TravelOptimizationSchema>
  ) {
    const budgetStrategy = this.generateBudgetStrategy(formData, informationRepository, optimization);
    const timeStrategy = this.generateTimeStrategy(formData, informationRepository, optimization);
    
    return {
      overallApproach: this.determineOverallApproach(optimization, formData) as "structured" | "flexible" | "mixed",
      recommendedPace: this.determineRecommendedPace(optimization.preferences.pacePreference) as "relaxed" | "moderate" | "intensive",
      focusAreas: this.identifyFocusAreas(formData, informationRepository),
      avoidanceFactors: this.identifyAvoidanceFactors(formData, informationRepository),
      budgetStrategy,
      timeStrategy
    };
  }
  
  /**
   * Generate strategic recommendations based on analysis
   */
  private async generateStrategicRecommendations(
    informationRepository: GatheredInformationRepository,
    formData: TravelFormData,
    travelStrategy: any
  ): Promise<z.infer<typeof StrategicRecommendationSchema>[]> {
    const recommendations: z.infer<typeof StrategicRecommendationSchema>[] = [];
    
    // Accommodation recommendations
    const accommodationRecs = this.generateAccommodationRecommendations(
      informationRepository.accommodations, // Use direct property
      formData,
      travelStrategy
    );
    recommendations.push(...accommodationRecs);
    
    // Activity recommendations  
    const activityRecs = this.generateActivityRecommendations(
      informationRepository.attractions, // Use attractions instead of activities
      formData,
      travelStrategy
    );
    recommendations.push(...activityRecs);
    
    // Budget optimization recommendations
    const budgetRecs = this.generateBudgetRecommendations(formData, travelStrategy);
    recommendations.push(...budgetRecs);
    
    // Timing recommendations
    const timingRecs = this.generateTimingRecommendations(formData, informationRepository);
    recommendations.push(...timingRecs);
    
    return recommendations;
  }
  
  /**
   * Design comprehensive itinerary blueprint
   */
  private async designItineraryBlueprint(
    informationRepository: GatheredInformationRepository,
    formData: TravelFormData,
    travelStrategy: any,
    recommendations: z.infer<typeof StrategicRecommendationSchema>[]
  ) {
    const tripDuration = this.calculateTripDuration(formData);
    const dailyTemplates = this.createDailyTemplates(tripDuration, travelStrategy);
    const sequencing = this.createSequencing(recommendations, informationRepository);
    
    return {
      structure: {
        recommendedDays: tripDuration,
        activitiesPerDay: this.calculateActivitiesPerDay(travelStrategy, tripDuration),
        restDays: Math.floor(tripDuration / 7), // One rest day per week
        bufferTime: 0.2 // 20% buffer time
      },
      dailyTemplates,
      sequencing
    };
  }
  
  /**
   * Perform comprehensive risk assessment
   */
  private async performRiskAssessment(
    informationRepository: GatheredInformationRepository,
    formData: TravelFormData,
    travelStrategy: any
  ) {
    const identifiedRisks = [
      {
        type: "weather" as const,
        description: "Potential weather disruptions during travel period",
        likelihood: "medium" as const,
        impact: "medium" as const,
        mitigation: ["Check weather forecasts", "Pack appropriate clothing", "Have indoor alternatives"]
      },
      {
        type: "budget" as const,
        description: "Potential budget overruns in high-cost destination",
        likelihood: "medium" as const,
        impact: "high" as const,
        mitigation: ["Set daily spending limits", "Track expenses", "Have budget buffer"]
      },
      {
        type: "capacity" as const,
        description: "Popular attractions may have limited availability",
        likelihood: "high" as const,
        impact: "medium" as const,
        mitigation: ["Book in advance", "Have backup options", "Consider off-peak times"]
      }
    ];
    
    const contingencyPlans = [
      "Alternative indoor activities for bad weather",
      "Budget-friendly restaurant alternatives",
      "Flexible booking policies where possible",
      "Emergency contact information for local services"
    ];
    
    const flexibilityFactors = [
      "Flexible accommodation check-in/out times",
      "Cancellable activity bookings",
      "Multiple transportation options",
      "Local contact for assistance"
    ];
    
    return {
      identifiedRisks,
      contingencyPlans,
      flexibilityFactors
    };
  }
  
  // ===== Helper Methods =====
  
  private generateSessionId(): string {
    return `strategic_planning_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
  
  private analyzeBudgetLevel(budget: { amount: number; currency: string; mode: string }): "low" | "medium" | "high" {
    const amount = budget.amount;
    
    // Per-person daily budget thresholds
    if (budget.mode === "per-person") {
      if (amount < 100) return "low";
      if (amount > 300) return "high";
      return "medium";
    }
    
    // Total budget thresholds (assuming 7-day trip)
    const dailyPerPerson = amount / 7 / 2; // Assuming 2 people average
    if (dailyPerPerson < 100) return "low";
    if (dailyPerPerson > 300) return "high";
    return "medium";
  }
  
  private calculateTimeAllocation(travelStyle: string, groupSize: number): any {
    // Base allocation depends on travel style
    let baseAllocation = {
      activities: 0.6,
      relaxation: 0.2,
      exploration: 0.15,
      flexibility: 0.05
    };
    
    // Adjust for travel style
    if (travelStyle === "luxury") {
      baseAllocation.relaxation += 0.1;
      baseAllocation.activities -= 0.1;
    } else if (travelStyle === "adventure") {
      baseAllocation.activities += 0.1;
      baseAllocation.exploration += 0.1;
      baseAllocation.relaxation -= 0.2;
    }
    
    // Adjust for group size (larger groups need more flexibility)
    if (groupSize > 4) {
      baseAllocation.flexibility += 0.05;
      baseAllocation.activities -= 0.05;
    }
    
    return baseAllocation;
  }
  
  private deriveUserPreferences(formData: TravelFormData, travelStyle: string): any {
    return {
      pacePreference: travelStyle === "luxury" ? "slow" : 
                    travelStyle === "adventure" ? "fast" : "moderate",
      experienceDepth: travelStyle === "cultural" ? "deep" : "moderate",
      crowdTolerance: travelStyle === "luxury" ? "avoid" : "neutral",
      adventureLevel: travelStyle === "adventure" ? "adventurous" : 
                     travelStyle === "luxury" ? "conservative" : "moderate"
    };
  }
  
  private generateBudgetStrategy(formData: TravelFormData, info: GatheredInformationRepository, opt: any) {
    return {
      allocation: {
        accommodation: 0.35,
        dining: 0.25,
        activities: 0.25,
        transportation: 0.10,
        miscellaneous: 0.05
      },
      savingOpportunities: [
        "Book accommodations with kitchen facilities",
        "Take advantage of free walking tours",
        "Use public transportation",
        "Look for restaurant lunch specials"
      ],
      splurgeRecommendations: [
        "One high-end dining experience",
        "Premium accommodation for key nights",
        "Guided tour of main attraction"
      ]
    };
  }
  
  private generateTimeStrategy(formData: TravelFormData, info: GatheredInformationRepository, opt: any) {
    const duration = this.calculateTripDuration(formData);
    
    return {
      idealDuration: `${duration} days`,
      minimumDuration: `${Math.max(3, duration - 2)} days`,
      peakTimes: ["10:00-12:00", "14:00-17:00"],
      avoidTimes: ["12:00-14:00 (lunch rush)", "18:00-20:00 (dinner rush)"],
      flexibilityRecommendations: [
        "Keep first and last days light",
        "Build in buffer time between activities",
        "Have backup indoor options"
      ]
    };
  }
  
  private calculateTripDuration(formData: TravelFormData): number {
    if (formData.departureDate && formData.returnDate) {
      const start = new Date(formData.departureDate);
      const end = new Date(formData.returnDate);
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }
    return 7; // Default 7-day trip
  }
  
  private determineOverallApproach(optimization: any, formData: TravelFormData): string {
    if (optimization.preferences.pacePreference === "slow") return "flexible";
    if (optimization.preferences.pacePreference === "fast") return "structured";
    return "mixed";
  }
  
  private determineRecommendedPace(pacePreference: string): string {
    switch (pacePreference) {
      case "slow": return "relaxed";
      case "fast": return "intensive";
      default: return "moderate";
    }
  }
  
  private identifyFocusAreas(formData: TravelFormData, info: GatheredInformationRepository): string[] {
    const focusAreas = ["cultural experiences", "local cuisine"];
    
    if (formData.preferences.interests?.includes("adventure")) focusAreas.push("outdoor activities");
    if (formData.preferences.interests?.includes("history")) focusAreas.push("historical sites");
    if (formData.preferences.interests?.includes("food")) focusAreas.push("culinary experiences");
    
    return focusAreas;
  }
  
  private identifyAvoidanceFactors(formData: TravelFormData, info: GatheredInformationRepository): string[] {
    const avoidances = ["tourist traps", "overcrowded areas during peak hours"];
    
    if (formData.budget.mode === "per-person" && formData.budget.amount < 100) {
      avoidances.push("overpriced attractions");
    }
    
    return avoidances;
  }
  
  private identifyStrategicFocus(formData: TravelFormData, strategy: any): string[] {
    return ["experience optimization", "budget efficiency", "time management"];
  }
  
  // ===== Recommendation Generators =====
  
  private generateAccommodationRecommendations(accommodations: any[], formData: TravelFormData, strategy: any) {
    const recommendations: z.infer<typeof StrategicRecommendationSchema>[] = [];
    
    const topAccommodation = accommodations.sort((a, b) => (b.rating?.overall || 0) - (a.rating?.overall || 0))[0];
    
    if (topAccommodation) {
      recommendations.push({
        id: `acc_${Date.now()}`,
        type: "accommodation",
        priority: "high",
        title: `Stay at ${topAccommodation.name}`,
        description: `Strategic location with excellent amenities`,
        reasoning: "Optimal balance of location, amenities, and value based on your preferences",
        impact: {
          budget: "neutral",
          experience: "positive",
          time: "saves",
          comfort: "increases"
        },
        implementation: {
          difficulty: "easy",
          timeRequired: "15 minutes to book",
          dependencies: [],
          alternatives: ["Alternative hotels in same area", "Different neighborhoods"]
        },
        metadata: {
          confidence: topAccommodation.rating?.overall || 0.5,
          source: "info-gatherer-analysis",
          lastUpdated: new Date(),
          applicabilityScore: 0.9
        }
      });
    }
    
    return recommendations;
  }
  
  private generateActivityRecommendations(attractions: any[], formData: TravelFormData, strategy: any) {
    const recommendations: z.infer<typeof StrategicRecommendationSchema>[] = [];
    
    const topActivity = attractions.sort((a, b) => (b.rating?.overall || 0) - (a.rating?.overall || 0))[0];
    
    if (topActivity) {
      recommendations.push({
        id: `act_${Date.now()}`,
        type: "activity",
        priority: "high",
        title: `Experience ${topActivity.name}`,
        description: topActivity.description,
        reasoning: "Highly rated activity that matches your interests and schedule",
        impact: {
          budget: "neutral",
          experience: "positive",
          time: "neutral",
          comfort: "neutral"
        },
        implementation: {
          difficulty: "easy",
          timeRequired: `${topActivity.visitDuration?.recommended || 2}-3 hours`,
          dependencies: [],
          alternatives: ["Similar activities in the area"]
        },
        metadata: {
          confidence: topActivity.rating?.overall || 0.5,
          source: "info-gatherer-analysis",
          lastUpdated: new Date(),
          applicabilityScore: 0.85
        }
      });
    }
    
    return recommendations;
  }
  
  private generateBudgetRecommendations(formData: TravelFormData, strategy: any) {
    return [
      {
        id: `budget_${Date.now()}`,
        type: "budget" as const,
        priority: "medium" as const,
        title: "Optimize Daily Spending",
        description: "Set daily budget limits to avoid overspending",
        reasoning: "Systematic budget tracking helps maintain financial discipline",
        impact: {
          budget: "positive" as const,
          experience: "neutral" as const,
          time: "neutral" as const,
          comfort: "neutral" as const
        },
        implementation: {
          difficulty: "easy" as const,
          timeRequired: "5 minutes daily",
          dependencies: ["budget tracking app", "daily spending plan"],
          alternatives: ["cash envelope method", "expense tracking spreadsheet"]
        },
        metadata: {
          confidence: 0.8,
          source: "strategic-analysis",
          lastUpdated: new Date(),
          applicabilityScore: 0.9
        }
      }
    ];
  }
  
  private generateTimingRecommendations(formData: TravelFormData, info: GatheredInformationRepository) {
    return [
      {
        id: `timing_${Date.now()}`,
        type: "timing" as const,
        priority: "medium" as const,
        title: "Avoid Peak Hours at Popular Attractions",
        description: "Visit major attractions early morning or late afternoon",
        reasoning: "Reduces crowds and wait times while improving photo opportunities",
        impact: {
          budget: "neutral" as const,
          experience: "positive" as const,
          time: "saves" as const,
          comfort: "increases" as const
        },
        implementation: {
          difficulty: "easy" as const,
          timeRequired: "Schedule adjustment",
          dependencies: ["attraction opening hours", "transportation schedule"],
          alternatives: ["off-season visit", "guided tour with skip-the-line access"]
        },
        metadata: {
          confidence: 0.85,
          source: "strategic-analysis",
          lastUpdated: new Date(),
          applicabilityScore: 0.95
        }
      }
    ];
  }
  
  // ===== Blueprint Creation Methods =====
  
  private createDailyTemplates(duration: number, strategy: any) {
    const templates = [];
    
    for (let day = 1; day <= duration; day++) {
      let dayType: "arrival" | "full" | "departure" | "rest" | "adventure" | "cultural";
      let energyLevel: "low" | "medium" | "high";
      let suggestedActivities: number;
      
      if (day === 1) {
        dayType = "arrival";
        energyLevel = "low";
        suggestedActivities = 1;
      } else if (day === duration) {
        dayType = "departure";
        energyLevel = "low";
        suggestedActivities = 1;
      } else if (day % 7 === 0) {
        dayType = "rest";
        energyLevel = "low";
        suggestedActivities = 2;
      } else if (day % 2 === 0) {
        dayType = "cultural";
        energyLevel = "medium";
        suggestedActivities = 3;
      } else {
        dayType = "adventure";
        energyLevel = "high";
        suggestedActivities = 4;
      }
      
      templates.push({
        dayType,
        suggestedActivities,
        energyLevel,
        flexibility: strategy.overallApproach === "flexible" ? 0.8 : 0.5,
        notes: `Day ${day} template - ${dayType} focus`
      });
    }
    
    return templates;
  }
  
  private createSequencing(recommendations: any[], info: GatheredInformationRepository) {
    return {
      logicalFlow: [
        "arrival-and-orientation",
        "major-attractions",
        "cultural-experiences",
        "local-exploration",
        "departure-preparation"
      ],
      dependencies: [
        {
          prerequisite: "accommodation-check-in",
          dependent: "first-meal",
          reason: "Need base before exploring dining options"
        },
        {
          prerequisite: "major-attraction-visit",
          dependent: "souvenir-shopping",
          reason: "Better understanding of local culture enhances shopping choices"
        }
      ],
      flexibilityPoints: [
        "restaurant-timing",
        "indoor-activity-alternatives",
        "transportation-options",
        "rest-day-positioning"
      ]
    };
  }
  
  // ===== Calculation Methods =====
  
  private calculateActivitiesPerDay(strategy: any, duration: number): number {
    const baseActivities = strategy.recommendedPace === "intensive" ? 4 :
                          strategy.recommendedPace === "relaxed" ? 2 : 3;
    
    // Adjust for trip duration
    if (duration <= 3) return baseActivities + 1; // Pack more into short trips
    if (duration >= 14) return baseActivities - 1; // More relaxed for long trips
    
    return baseActivities;
  }
  
  private calculateStrategicPlanningCost(stats: any): number {
    const baseCost = 0.50; // Base cost for strategic analysis
    const perRecommendationCost = 0.05;
    const optimizationCost = stats.optimizationIterations * 0.10;
    
    return baseCost + (stats.recommendationsGenerated * perRecommendationCost) + optimizationCost;
  }
  
  private estimateTokenUsage(data: any, type: "input" | "output"): number {
    if (type === "input") {
      return 2000; // Information repository processing
    } else {
      return 3500; // Strategic plan output
    }
  }
  
  // ===== Quality Assessment Methods =====
  
  private calculateStrategicAlignment(strategy: any, formData: TravelFormData): number {
    // Mock calculation - in reality would analyze alignment with user preferences
    return 0.85;
  }
  
  private calculateFeasibilityScore(recommendations: any[], formData: TravelFormData): number {
    // Mock calculation - in reality would assess practical feasibility
    return 0.8;
  }
  
  private calculateOptimizationLevel(strategy: any, optimization: any): number {
    // Mock calculation - in reality would measure optimization effectiveness
    return 0.75;
  }
  
  private calculatePersonalizationScore(recommendations: any[], formData: TravelFormData): number {
    // Mock calculation - in reality would assess personalization quality
    return 0.9;
  }
  
  private calculateOverallConfidence(strategy: any, recommendations: any[]): number {
    // Mock calculation - in reality would assess overall confidence in strategic plan
    return 0.82;
  }
  
  private countProcessedInformation(info: GatheredInformationRepository): number {
    return (info.accommodations?.length || 0) +
           (info.restaurants?.length || 0) +
           (info.attractions?.length || 0) +
           (info.events?.length || 0);
  }
  
  // ===== Extraction Methods for Context Creation =====
  
  private extractTimeOptimization(timeStrategy: any): any {
    return {
      peakAvoidance: timeStrategy.avoidTimes,
      optimalTiming: timeStrategy.peakTimes,
      flexibilityBuffer: 0.2,
      sequenceOptimization: "logical-flow-based"
    };
  }
  
  private extractExperienceOptimization(recommendations: any[]): any {
    return {
      prioritizedExperiences: recommendations
        .filter(r => r.priority === "high")
        .map(r => r.title),
      qualityFactors: ["authenticity", "uniqueness", "accessibility"],
      balanceStrategy: "quality-over-quantity",
      personalizationLevel: "high"
    };
  }
}

// ===== Factory and Utility Functions =====

/**
 * Create a new Planning Strategist agent instance
 */
export function createPlanningStrategistAgent(config: WorkflowConfig): PlanningStrategistAgent {
  return new PlanningStrategistAgent(config);
}

/**
 * Validate strategic planning output
 */
export function validateStrategicPlanningOutput(data: unknown): z.infer<typeof StrategicPlanningOutputSchema> {
  return StrategicPlanningOutputSchema.parse(data);
}

/**
 * Create mock optimization preferences for testing
 */
export function createMockOptimizationPreferences(): z.infer<typeof TravelOptimizationSchema> {
  return {
    primaryGoal: "experience",
    timeAllocation: {
      activities: 0.6,
      relaxation: 0.2,
      exploration: 0.15,
      flexibility: 0.05
    },
    preferences: {
      pacePreference: "moderate",
      experienceDepth: "moderate",
      crowdTolerance: "neutral",
      adventureLevel: "moderate"
    }
  };
}
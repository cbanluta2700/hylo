/**
 * Simplified Planning Strategist Agent for Unit Testing
 * 
 * This is a minimal implementation of the PlanningStrategistAgent that focuses on
 * strategic analysis functionality and proper TypeScript typing for unit testing.
 */

import { 
  Agent,
  AgentType,
  AgentResult, 
  AgentError,
  AgentErrorType,
  WorkflowContext, 
  WorkflowConfig,
  LLMProvider
} from '../../../src/types/agents';

// Simplified types for testing
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface BudgetAllocation {
  accommodation: number;
  transportation: number;
  food: number;
  activities: number;
  miscellaneous: number;
}

interface TravelRecommendation {
  category: string;
  priority: number;
  rationale: string;
  estimatedCost: number;
  alternatives: string[];
  riskFactors: string[];
  confidence: number;
}

// Minimal interfaces for strategic planning context
interface MinimalStrategicAnalysis {
  budgetOptimization: {
    totalBudget: number;
    currency: string;
    allocation: BudgetAllocation;
    recommendations: Array<{
      category: keyof BudgetAllocation;
      suggestedAmount: number;
      reasoning: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  };
  riskAssessment: {
    overallRisk: RiskLevel;
    factors: Array<{
      type: 'weather' | 'political' | 'health' | 'financial' | 'transportation';
      level: RiskLevel;
      description: string;
      mitigation: string;
    }>;
    recommendations: string[];
  };
  travelRecommendations: {
    accommodationStrategy: TravelRecommendation;
    transportationStrategy: TravelRecommendation;
    activityPrioritization: Array<{
      activity: string;
      priority: number;
      reasoning: string;
      estimatedCost: number;
      timeRequired: string;
    }>;
    restaurantStrategy: {
      budgetBreakdown: { breakfast: number; lunch: number; dinner: number; };
      recommendations: Array<{
        mealType: 'breakfast' | 'lunch' | 'dinner';
        suggestion: string;
        budgetRange: string;
      }>;
    };
  };
  optimization: {
    timeManagement: {
      dailyScheduleStructure: string;
      travelTimeBuffer: number;
      restPeriods: string[];
    };
    costSaving: {
      strategies: string[];
      potentialSavings: number;
      tradeoffs: string[];
    };
    experienceEnhancement: {
      mustVisit: string[];
      hiddenGems: string[];
      culturalInsights: string[];
    };
  };
  metadata: {
    analysisDepth: 'basic' | 'detailed' | 'comprehensive';
    confidenceScore: number;
    lastUpdated: Date;
    strategicPriorities: string[];
  };
}

export class PlanningStrategistAgent implements Agent {
  readonly name = AgentType.STRATEGIST;
  readonly version = '1.0.0';
  readonly timeout = 30000;
  readonly maxCost = 2.00;
  
  private config: WorkflowConfig;
  
  constructor(config: WorkflowConfig) {
    this.config = config;
  }

  async execute(context: WorkflowContext): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      // Validate required context from previous agents
      const isValidInput = await this.validateInput(context);
      if (!isValidInput) {
        return this.createErrorResult([{
          type: AgentErrorType.VALIDATION_ERROR,
          message: 'Invalid planning strategist context - missing content planning and information gathering results',
          severity: 'high',
          recoverable: false,
          details: {
            destination: context.formData?.destination,
            hasContentPlanning: !!context.agentResults?.[AgentType.CONTENT_PLANNER]?.success,
            hasInformationGathering: !!context.agentResults?.[AgentType.INFO_GATHERER]?.success
          }
        }]);
      }

      // Extract context from previous agents
      const contentPlanningResult = context.agentResults[AgentType.CONTENT_PLANNER]!;
      const informationGatheringResult = context.agentResults[AgentType.INFO_GATHERER]!;
      
      // Generate strategic analysis
      const strategicAnalysis = await this.generateStrategicAnalysis(
        context,
        contentPlanningResult.data,
        informationGatheringResult.data
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      return {
        agent: AgentType.STRATEGIST,
        success: true,
        data: strategicAnalysis,
        metadata: {
          startedAt: new Date(startTime),
          completedAt: new Date(endTime),
          durationMs: executionTime,
          cost: Math.max(this.calculateCost(executionTime), 0.001), // Minimum cost
          provider: LLMProvider.CEREBRAS,
          tokens: { input: 2000, output: 1500, total: 3500 },
          retryAttempts: 0,
          version: this.version
        },
        errors: [],
        nextAgent: AgentType.COMPILER,
        confidence: this.calculateConfidence(strategicAnalysis)
      };

    } catch (error) {
      return this.createErrorResult([{
        type: AgentErrorType.EXECUTION_ERROR,
        message: `Strategic analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high',
        recoverable: true,
        details: { 
          destination: context.formData?.destination,
          error: error instanceof Error ? error.stack : String(error)
        }
      }]);
    }
  }

  async validateInput(context: WorkflowContext): Promise<boolean> {
    if (!context.formData) {
      return false;
    }

    if (!context.formData.destination || !context.formData.budget) {
      return false;
    }

    if (!context.agentResults?.[AgentType.CONTENT_PLANNER]?.success) {
      return false;
    }

    if (!context.agentResults?.[AgentType.INFO_GATHERER]?.success) {
      return false;
    }

    return true;
  }

  private async generateStrategicAnalysis(
    context: WorkflowContext,
    planningData: any,
    gatheringData: any
  ): Promise<MinimalStrategicAnalysis> {
    const { formData } = context;
    
    // Budget optimization analysis
    const budgetOptimization = this.analyzeBudgetOptimization(formData.budget, gatheringData);
    
    // Risk assessment
    const riskAssessment = this.assessRisks(formData, gatheringData);
    
    // Travel recommendations
    const travelRecommendations = this.generateTravelRecommendations(formData, gatheringData);
    
    // Optimization strategies
    const optimization = this.generateOptimizationStrategies(formData, gatheringData);

    return {
      budgetOptimization,
      riskAssessment,
      travelRecommendations,
      optimization,
      metadata: {
        analysisDepth: 'detailed',
        confidenceScore: 0.85,
        lastUpdated: new Date(),
        strategicPriorities: ['budget_optimization', 'risk_mitigation', 'experience_enhancement']
      }
    };
  }

  private analyzeBudgetOptimization(budget: any, gatheringData: any): MinimalStrategicAnalysis['budgetOptimization'] {
    const totalBudget = budget.amount;
    const currency = budget.currency || 'USD';
    
    // Standard budget allocation percentages
    const allocation: BudgetAllocation = {
      accommodation: totalBudget * 0.35,
      transportation: totalBudget * 0.25,
      food: totalBudget * 0.20,
      activities: totalBudget * 0.15,
      miscellaneous: totalBudget * 0.05
    };

    const recommendations = [
      {
        category: 'accommodation' as keyof BudgetAllocation,
        suggestedAmount: allocation.accommodation,
        reasoning: 'Based on destination pricing and travel style preferences',
        priority: 'high' as const
      },
      {
        category: 'food' as keyof BudgetAllocation,
        suggestedAmount: allocation.food,
        reasoning: 'Balanced mix of local dining experiences and budget-friendly options',
        priority: 'medium' as const
      },
      {
        category: 'activities' as keyof BudgetAllocation,
        suggestedAmount: allocation.activities,
        reasoning: 'Prioritized based on stated interests and must-see attractions',
        priority: 'high' as const
      }
    ];

    return {
      totalBudget,
      currency,
      allocation,
      recommendations
    };
  }

  private assessRisks(formData: any, gatheringData: any): MinimalStrategicAnalysis['riskAssessment'] {
    const riskFactors = [
      {
        type: 'weather' as const,
        level: 'low' as RiskLevel,
        description: 'Favorable weather conditions expected for travel dates',
        mitigation: 'Pack appropriate clothing for seasonal variations'
      },
      {
        type: 'transportation' as const,
        level: 'medium' as RiskLevel,
        description: 'Peak season may affect availability and pricing',
        mitigation: 'Book transportation in advance and have backup options'
      },
      {
        type: 'financial' as const,
        level: 'low' as RiskLevel,
        description: 'Currency exchange rates are stable',
        mitigation: 'Monitor exchange rates and use reputable exchange services'
      }
    ];

    return {
      overallRisk: 'low',
      factors: riskFactors,
      recommendations: [
        'Purchase comprehensive travel insurance',
        'Keep emergency contacts and embassy information handy',
        'Maintain backup payment methods',
        'Stay informed about local conditions'
      ]
    };
  }

  private generateTravelRecommendations(formData: any, gatheringData: any): MinimalStrategicAnalysis['travelRecommendations'] {
    const travelStyle = formData.preferences?.travelStyle || 'balanced';
    
    const accommodationStrategy: TravelRecommendation = {
      category: 'accommodation',
      priority: 1,
      rationale: `${travelStyle} style accommodation matching budget and preferences`,
      estimatedCost: formData.budget.amount * 0.35,
      alternatives: ['hotel', 'boutique', 'traditional'],
      riskFactors: ['availability', 'location'],
      confidence: 0.8
    };

    const transportationStrategy: TravelRecommendation = {
      category: 'transportation',
      priority: 2,
      rationale: 'Efficient transport options balancing cost and convenience',
      estimatedCost: formData.budget.amount * 0.25,
      alternatives: ['train', 'bus', 'taxi'],
      riskFactors: ['delays', 'pricing'],
      confidence: 0.75
    };

    const activityPrioritization = [
      {
        activity: 'Cultural Sites Visit',
        priority: 1,
        reasoning: 'Aligns with stated interests and destination highlights',
        estimatedCost: 150,
        timeRequired: '4-6 hours per site'
      },
      {
        activity: 'Local Food Experience',
        priority: 2,
        reasoning: 'Essential cultural immersion opportunity',
        estimatedCost: 100,
        timeRequired: '2-3 hours per experience'
      },
      {
        activity: 'Neighborhood Exploration',
        priority: 3,
        reasoning: 'Cost-effective way to experience local culture',
        estimatedCost: 50,
        timeRequired: '3-4 hours per area'
      }
    ];

    const restaurantStrategy = {
      budgetBreakdown: {
        breakfast: formData.budget.amount * 0.06,
        lunch: formData.budget.amount * 0.07,
        dinner: formData.budget.amount * 0.07
      },
      recommendations: [
        {
          mealType: 'breakfast' as const,
          suggestion: 'Mix of hotel breakfast and local cafes',
          budgetRange: '$10-15 per person'
        },
        {
          mealType: 'lunch' as const,
          suggestion: 'Local restaurants and street food',
          budgetRange: '$15-25 per person'
        },
        {
          mealType: 'dinner' as const,
          suggestion: 'Fine dining experiences and traditional cuisine',
          budgetRange: '$25-40 per person'
        }
      ]
    };

    return {
      accommodationStrategy,
      transportationStrategy,
      activityPrioritization,
      restaurantStrategy
    };
  }

  private generateOptimizationStrategies(formData: any, gatheringData: any): MinimalStrategicAnalysis['optimization'] {
    return {
      timeManagement: {
        dailyScheduleStructure: 'Morning activities, afternoon rest, evening experiences',
        travelTimeBuffer: 30, // minutes
        restPeriods: ['13:00-15:00', '19:00-20:00']
      },
      costSaving: {
        strategies: [
          'Book activities in advance for discounts',
          'Use public transportation',
          'Mix expensive and budget dining options',
          'Consider city passes for multiple attractions'
        ],
        potentialSavings: formData.budget.amount * 0.15,
        tradeoffs: [
          'Less flexibility with advance bookings',
          'More planning required',
          'Some comfort sacrifices for budget options'
        ]
      },
      experienceEnhancement: {
        mustVisit: ['Primary cultural sites', 'Traditional markets', 'Scenic viewpoints'],
        hiddenGems: ['Local neighborhoods', 'Small family restaurants', 'Artisan workshops'],
        culturalInsights: [
          'Learn basic local phrases',
          'Understand tipping customs',
          'Respect dress codes at religious sites'
        ]
      }
    };
  }

  private calculateCost(executionTimeMs: number): number {
    // Strategic analysis cost calculation
    const baseRate = 0.003; // per second
    const seconds = Math.max(executionTimeMs / 1000, 0.1); // Minimum of 0.1 seconds
    return Math.round((baseRate * seconds) * 1000) / 1000; // Round to 3 decimal places
  }

  private calculateConfidence(analysis: MinimalStrategicAnalysis): number {
    const budgetConfidence = analysis.budgetOptimization.recommendations.length > 0 ? 0.9 : 0.5;
    const riskConfidence = analysis.riskAssessment.factors.length >= 3 ? 0.8 : 0.6;
    const recommendationConfidence = analysis.travelRecommendations.activityPrioritization.length > 0 ? 0.85 : 0.5;
    
    return (budgetConfidence + riskConfidence + recommendationConfidence) / 3;
  }

  private createErrorResult(errors: AgentError[]): AgentResult {
    return {
      agent: AgentType.STRATEGIST,
      success: false,
      data: null,
      metadata: {
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 0,
        cost: 0,
        provider: LLMProvider.CEREBRAS,
        tokens: { input: 0, output: 0, total: 0 },
        retryAttempts: 0,
        version: this.version
      },
      errors,
      nextAgent: undefined,
      confidence: 0
    };
  }

  async cleanup(): Promise<void> {
    // Cleanup strategic analysis resources
  }
}
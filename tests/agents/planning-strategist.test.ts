import { describe, test, expect, beforeEach } from 'vitest';
import { mock, MockProxy, mockClear } from 'vitest-mock-extended';
import { PlanningStrategistAgent } from '../../api/agents/planning-strategist/planning-strategist-simple';
import { 
  TravelFormData, 
  WorkflowContext,
  WorkflowConfig,
  AgentType,
  WorkflowState,
  LLMProvider,
  AgentResult,
  BudgetAllocation,
  RiskLevel
} from '../../src/types/agents';

// Minimal type for testing Strategic Analysis output
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
    accommodationStrategy: any;
    transportationStrategy: any;
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

describe('PlanningStrategistAgent', () => {
  let agent: PlanningStrategistAgent;
  let mockContext: MockProxy<WorkflowContext>;
  let config: WorkflowConfig;
  let sampleFormData: TravelFormData;
  let mockPlanningResult: AgentResult;
  let mockGatheringResult: AgentResult;

  beforeEach(() => {
    config = {
      streaming: false,
      providerChains: {
        [AgentType.CONTENT_PLANNER]: [LLMProvider.CEREBRAS, LLMProvider.GEMINI],
        [AgentType.INFO_GATHERER]: [LLMProvider.GROQ, LLMProvider.CEREBRAS],
        [AgentType.STRATEGIST]: [LLMProvider.CEREBRAS, LLMProvider.GEMINI],
        [AgentType.COMPILER]: [LLMProvider.GEMINI, LLMProvider.CEREBRAS]
      },
      retryConfig: {
        maxRetries: 3,
        baseDelay: 1000,
        backoffMultiplier: 2,
        maxDelay: 10000,
        retryableErrors: ['RATE_LIMIT', 'TIMEOUT', 'TEMPORARY_FAILURE']
      },
      resourceLimits: {
        maxExecutionTime: 30000,
        maxCost: 2.00,
        maxTokensPerAgent: 8000,
        maxMemoryUsage: 512,
        maxConcurrentWorkflows: 5
      },
      observability: {
        langsmithEnabled: true,
        metricsEnabled: true,
        verboseLogging: false,
        tags: { test: 'planning-strategist' }
      }
    };

    sampleFormData = {
      destination: 'Barcelona, Spain',
      departureDate: '2024-05-15',
      returnDate: '2024-05-22',
      tripNickname: 'Barcelona Cultural Adventure',
      contactName: 'Alex Johnson',
      adults: 2,
      children: 1,
      budget: {
        amount: 4500,
        currency: 'USD',
        mode: 'total'
      },
      preferences: {
        travelStyle: 'culture',
        interests: ['architecture', 'museums', 'local cuisine'],
        accommodationType: 'boutique',
        transportationMode: 'metro',
        dietaryRestrictions: [],
        accessibility: []
      }
    };

    // Mock successful planning result from content planner
    mockPlanningResult = {
      agent: AgentType.CONTENT_PLANNER,
      success: true,
      data: {
        destination: { primary: 'Barcelona, Spain' },
        travelDates: { duration: 7 },
        travelers: { total: 3 },
        budget: { amount: 4500 }
      },
      metadata: {
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 1200,
        cost: 0.012,
        provider: LLMProvider.CEREBRAS,
        tokens: { input: 0, output: 0, total: 0 },
        retryAttempts: 0,
        version: '1.0.0'
      },
      errors: [],
      nextAgent: AgentType.INFO_GATHERER,
      confidence: 0.85
    };

    // Mock successful gathering result from info gatherer
    mockGatheringResult = {
      agent: AgentType.INFO_GATHERER,
      success: true,
      data: {
        accommodations: [
          { name: 'Barcelona Boutique Hotel', type: 'boutique', rating: 4.5, priceRange: '$$' }
        ],
        activities: [
          { name: 'Sagrada Familia', category: 'architecture', duration: '3 hours', pricing: '€26' }
        ],
        restaurants: [
          { name: 'Cal Pep', cuisine: 'Catalan', rating: 4.7, priceRange: '$$' }
        ],
        transportation: {
          airports: [{ code: 'BCN', name: 'Barcelona-El Prat Airport' }],
          publicTransport: { types: ['metro', 'bus', 'tram'] }
        }
      },
      metadata: {
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 2500,
        cost: 0.025,
        provider: LLMProvider.GROQ,
        tokens: { input: 0, output: 0, total: 0 },
        retryAttempts: 0,
        version: '1.0.0'
      },
      errors: [],
      nextAgent: AgentType.STRATEGIST,
      confidence: 0.8
    };

    mockContext = mock<WorkflowContext>();
    mockContext.sessionId = 'test-session-789';
    mockContext.formData = sampleFormData;
    mockContext.state = WorkflowState.STRATEGIC_PLANNING;
    mockContext.agentResults = {
      [AgentType.CONTENT_PLANNER]: mockPlanningResult,
      [AgentType.INFO_GATHERER]: mockGatheringResult,
      [AgentType.STRATEGIST]: null,
      [AgentType.COMPILER]: null
    };
    mockContext.messages = [];
    mockContext.config = config;
    mockContext.metadata = {
      startedAt: new Date(),
      totalCost: 0.037,
      metrics: {},
      errors: []
    };

    agent = new PlanningStrategistAgent(config);
    mockClear(mockContext);
  });

  describe('constructor', () => {
    test('should initialize with correct agent name', () => {
      expect(agent.name).toBe(AgentType.STRATEGIST);
    });

    test('should initialize with provided configuration', () => {
      expect(agent.version).toBe('1.0.0');
      expect(agent.timeout).toBe(30000);
      expect(agent.maxCost).toBe(2.00);
    });
  });

  describe('execute method', () => {
    test('should return successful AgentResult with StrategicAnalysis', async () => {
      const result = await agent.execute(mockContext);

      expect(result).toBeDefined();
      expect(result.agent).toBe(AgentType.STRATEGIST);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.nextAgent).toBe(AgentType.COMPILER);
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should generate budget optimization analysis', async () => {
      const result = await agent.execute(mockContext);
      
      const analysis = result.data as MinimalStrategicAnalysis;
      expect(analysis.budgetOptimization).toBeDefined();
      expect(analysis.budgetOptimization.totalBudget).toBe(4500);
      expect(analysis.budgetOptimization.currency).toBe('USD');
      expect(analysis.budgetOptimization.allocation).toBeDefined();
      expect(analysis.budgetOptimization.recommendations.length).toBeGreaterThan(0);
    });

    test('should calculate correct budget allocation percentages', async () => {
      const result = await agent.execute(mockContext);
      
      const analysis = result.data as MinimalStrategicAnalysis;
      const allocation = analysis.budgetOptimization.allocation;
      
      expect(allocation.accommodation).toBe(4500 * 0.35); // 35%
      expect(allocation.transportation).toBe(4500 * 0.25); // 25%
      expect(allocation.food).toBe(4500 * 0.20); // 20%
      expect(allocation.activities).toBe(4500 * 0.15); // 15%
      expect(allocation.miscellaneous).toBe(4500 * 0.05); // 5%
    });

    test('should generate risk assessment with multiple factors', async () => {
      const result = await agent.execute(mockContext);
      
      const analysis = result.data as MinimalStrategicAnalysis;
      expect(analysis.riskAssessment).toBeDefined();
      expect(analysis.riskAssessment.overallRisk).toBeDefined();
      expect(analysis.riskAssessment.factors.length).toBeGreaterThan(0);
      expect(analysis.riskAssessment.recommendations.length).toBeGreaterThan(0);
    });

    test('should include weather, transportation, and financial risk factors', async () => {
      const result = await agent.execute(mockContext);
      
      const analysis = result.data as MinimalStrategicAnalysis;
      const riskTypes = analysis.riskAssessment.factors.map(factor => factor.type);
      
      expect(riskTypes).toContain('weather');
      expect(riskTypes).toContain('transportation');
      expect(riskTypes).toContain('financial');
    });

    test('should generate comprehensive travel recommendations', async () => {
      const result = await agent.execute(mockContext);
      
      const analysis = result.data as MinimalStrategicAnalysis;
      const recommendations = analysis.travelRecommendations;
      
      expect(recommendations.accommodationStrategy).toBeDefined();
      expect(recommendations.transportationStrategy).toBeDefined();
      expect(recommendations.activityPrioritization.length).toBeGreaterThan(0);
      expect(recommendations.restaurantStrategy).toBeDefined();
    });

    test('should prioritize activities based on interests and costs', async () => {
      const result = await agent.execute(mockContext);
      
      const analysis = result.data as MinimalStrategicAnalysis;
      const activities = analysis.travelRecommendations.activityPrioritization;
      
      expect(activities[0]).toHaveProperty('activity');
      expect(activities[0]).toHaveProperty('priority');
      expect(activities[0]).toHaveProperty('reasoning');
      expect(activities[0]).toHaveProperty('estimatedCost');
      expect(activities[0]).toHaveProperty('timeRequired');
      
      // Should be sorted by priority (lower number = higher priority)
      expect(activities[0].priority).toBeLessThanOrEqual(activities[1].priority);
    });

    test('should generate restaurant strategy with budget breakdown', async () => {
      const result = await agent.execute(mockContext);
      
      const analysis = result.data as MinimalStrategicAnalysis;
      const restaurantStrategy = analysis.travelRecommendations.restaurantStrategy;
      
      expect(restaurantStrategy.budgetBreakdown.breakfast).toBeGreaterThan(0);
      expect(restaurantStrategy.budgetBreakdown.lunch).toBeGreaterThan(0);
      expect(restaurantStrategy.budgetBreakdown.dinner).toBeGreaterThan(0);
      expect(restaurantStrategy.recommendations.length).toBe(3);
    });

    test('should include optimization strategies', async () => {
      const result = await agent.execute(mockContext);
      
      const analysis = result.data as MinimalStrategicAnalysis;
      const optimization = analysis.optimization;
      
      expect(optimization.timeManagement).toBeDefined();
      expect(optimization.costSaving).toBeDefined();
      expect(optimization.experienceEnhancement).toBeDefined();
    });

    test('should calculate potential cost savings', async () => {
      const result = await agent.execute(mockContext);
      
      const analysis = result.data as MinimalStrategicAnalysis;
      const costSaving = analysis.optimization.costSaving;
      
      expect(costSaving.potentialSavings).toBe(4500 * 0.15); // 15% of budget
      expect(costSaving.strategies.length).toBeGreaterThan(0);
      expect(costSaving.tradeoffs.length).toBeGreaterThan(0);
    });

    test('should provide experience enhancement recommendations', async () => {
      const result = await agent.execute(mockContext);
      
      const analysis = result.data as MinimalStrategicAnalysis;
      const enhancement = analysis.optimization.experienceEnhancement;
      
      expect(enhancement.mustVisit.length).toBeGreaterThan(0);
      expect(enhancement.hiddenGems.length).toBeGreaterThan(0);
      expect(enhancement.culturalInsights.length).toBeGreaterThan(0);
    });

    test('should include analysis metadata', async () => {
      const result = await agent.execute(mockContext);
      
      const analysis = result.data as MinimalStrategicAnalysis;
      const metadata = analysis.metadata;
      
      expect(metadata.analysisDepth).toBe('detailed');
      expect(metadata.confidenceScore).toBeGreaterThan(0);
      expect(metadata.lastUpdated).toBeInstanceOf(Date);
      expect(metadata.strategicPriorities.length).toBeGreaterThan(0);
    });

    test('should handle different travel styles', async () => {
      mockContext.formData.preferences.travelStyle = 'luxury';
      
      const result = await agent.execute(mockContext);
      
      const analysis = result.data as MinimalStrategicAnalysis;
      expect(analysis.budgetOptimization.totalBudget).toBe(4500);
      expect(analysis.travelRecommendations.accommodationStrategy.rationale).toContain('luxury');
    });

    test('should adjust recommendations for different budget amounts', async () => {
      mockContext.formData.budget.amount = 8000;
      
      const result = await agent.execute(mockContext);
      
      const analysis = result.data as MinimalStrategicAnalysis;
      expect(analysis.budgetOptimization.totalBudget).toBe(8000);
      expect(analysis.budgetOptimization.allocation.accommodation).toBe(8000 * 0.35);
    });

    test('should handle budget travel style with appropriate cost strategies', async () => {
      mockContext.formData.preferences.travelStyle = 'budget';
      mockContext.formData.budget.amount = 2000;
      
      const result = await agent.execute(mockContext);
      
      const analysis = result.data as MinimalStrategicAnalysis;
      expect(analysis.optimization.costSaving.strategies.length).toBeGreaterThan(0);
      expect(analysis.optimization.costSaving.potentialSavings).toBe(2000 * 0.15);
    });
  });

  describe('validateInput method', () => {
    test('should validate correct WorkflowContext with required agent results', async () => {
      const isValid = await agent.validateInput(mockContext);
      expect(isValid).toBe(true);
    });

    test('should reject context without form data', async () => {
      const invalidContext = { ...mockContext };
      (invalidContext as any).formData = undefined;
      
      const isValid = await agent.validateInput(invalidContext);
      expect(isValid).toBe(false);
    });

    test('should reject context without destination', async () => {
      mockContext.formData.destination = '';
      
      const isValid = await agent.validateInput(mockContext);
      expect(isValid).toBe(false);
    });

    test('should reject context without budget information', async () => {
      (mockContext.formData as any).budget = undefined;
      
      const isValid = await agent.validateInput(mockContext);
      expect(isValid).toBe(false);
    });

    test('should reject context without content planning results', async () => {
      mockContext.agentResults[AgentType.CONTENT_PLANNER] = null;
      
      const isValid = await agent.validateInput(mockContext);
      expect(isValid).toBe(false);
    });

    test('should reject context with failed content planning', async () => {
      mockContext.agentResults[AgentType.CONTENT_PLANNER]!.success = false;
      
      const isValid = await agent.validateInput(mockContext);
      expect(isValid).toBe(false);
    });

    test('should reject context without information gathering results', async () => {
      mockContext.agentResults[AgentType.INFO_GATHERER] = null;
      
      const isValid = await agent.validateInput(mockContext);
      expect(isValid).toBe(false);
    });

    test('should reject context with failed information gathering', async () => {
      mockContext.agentResults[AgentType.INFO_GATHERER]!.success = false;
      
      const isValid = await agent.validateInput(mockContext);
      expect(isValid).toBe(false);
    });
  });

  describe('error handling', () => {
    test('should handle execution errors gracefully', async () => {
      mockContext.agentResults[AgentType.CONTENT_PLANNER] = null;
      
      const result = await agent.execute(mockContext);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.data).toBeNull();
      expect(result.confidence).toBe(0);
    });

    test('should set correct error details for validation failures', async () => {
      mockContext.agentResults[AgentType.INFO_GATHERER] = null;
      
      const result = await agent.execute(mockContext);
      
      expect(result.errors.length).toBeGreaterThan(0);
      if (result.errors[0]) {
        expect(result.errors[0].message).toContain('Invalid planning strategist context');
        expect(result.errors[0].details).toBeDefined();
        if (result.errors[0].details) {
          expect(result.errors[0].details['destination']).toBe('Barcelona, Spain');
          expect(result.errors[0].details['hasInformationGathering']).toBe(false);
        }
      }
    });
  });

  describe('confidence calculation', () => {
    test('should calculate confidence based on analysis completeness', async () => {
      const result = await agent.execute(mockContext);
      
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.confidence).toBeLessThanOrEqual(1.0);
    });

    test('should have higher confidence with complete data', async () => {
      const result = await agent.execute(mockContext);
      
      const analysis = result.data as MinimalStrategicAnalysis;
      expect(analysis.metadata.confidenceScore).toBe(0.85);
      expect(result.confidence).toBeGreaterThan(0.75);
    });
  });

  describe('cost calculation', () => {
    test('should calculate execution cost based on processing time', async () => {
      const result = await agent.execute(mockContext);
      
      expect(result.metadata.cost).toBeGreaterThan(0);
      expect(result.metadata.cost).toBeLessThan(0.1); // Reasonable cost limit
    });

    test('should track token usage', async () => {
      const result = await agent.execute(mockContext);
      
      expect(result.metadata.tokens.input).toBeGreaterThan(0);
      expect(result.metadata.tokens.output).toBeGreaterThan(0);
      expect(result.metadata.tokens.total).toBe(
        result.metadata.tokens.input + result.metadata.tokens.output
      );
    });
  });

  describe('cleanup method', () => {
    test('should cleanup without errors', async () => {
      await expect(agent.cleanup()).resolves.toBeUndefined();
    });
  });

  describe('integration with workflow context', () => {
    test('should properly utilize data from previous agents', async () => {
      const result = await agent.execute(mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const analysis = result.data as MinimalStrategicAnalysis;
      expect(analysis.budgetOptimization.totalBudget).toBe(
        mockContext.formData.budget.amount
      );
    });

    test('should prepare data for content compiler agent', async () => {
      const result = await agent.execute(mockContext);
      
      expect(result.nextAgent).toBe(AgentType.COMPILER);
      expect(result.success).toBe(true);
      
      const analysis = result.data as MinimalStrategicAnalysis;
      expect(analysis.travelRecommendations).toBeDefined();
      expect(analysis.optimization).toBeDefined();
    });
  });
});
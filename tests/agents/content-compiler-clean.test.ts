import { describe, test, expect, beforeEach } from 'vitest';
import { ContentCompilerAgent } from '../../api/agents/content-compiler/content-compiler-simple.js';
import { 
  AgentType, 
  LLMProvider, 
  WorkflowState,
  type WorkflowContext,
  type AgentResult
} from '../../src/types/agents.js';

describe('ContentCompilerAgent', () => {
  let agent: ContentCompilerAgent;
  let mockContext: WorkflowContext;

  beforeEach(() => {
    agent = new ContentCompilerAgent({
      streaming: false,
      providerChains: {
        [AgentType.CONTENT_PLANNER]: [LLMProvider.CEREBRAS],
        [AgentType.INFO_GATHERER]: [LLMProvider.GROQ],
        [AgentType.STRATEGIST]: [LLMProvider.GEMINI],
        [AgentType.COMPILER]: [LLMProvider.GEMINI]
      },
      retryConfig: {
        maxRetries: 3,
        initialDelayMs: 1000,
        backoffFactor: 2,
        maxDelayMs: 10000
      },
      resourceLimits: {
        maxCostPerAgent: 2.00,
        maxDurationMs: 30000,
        maxTokens: 10000
      },
      observability: {
        tracing: false,
        metrics: false,
        langsmithKey: undefined
      }
    });

    // Create valid mock context
    mockContext = {
      sessionId: 'test-session-123',
      state: WorkflowState.COMPILING,
      formData: {
        destination: 'Paris, France',
        departureDate: '2024-06-15',
        returnDate: '2024-06-17',
        tripNickname: 'Paris Adventure',
        contactName: 'Sarah Davis',
        adults: 2,
        children: 0,
        budget: {
          amount: 5000,
          currency: 'USD',
          mode: 'total'
        },
        preferences: {
          travelStyle: 'culture',
          interests: ['museums', 'food', 'history']
        }
      },
      agentResults: {
        [AgentType.CONTENT_PLANNER]: {
          agent: AgentType.CONTENT_PLANNER,
          success: true,
          data: { contentPlan: { objectives: ['Cultural exploration'] } },
          metadata: {
            startedAt: new Date(),
            completedAt: new Date(),
            durationMs: 1200,
            cost: 0.003,
            provider: LLMProvider.CEREBRAS,
            tokens: { input: 400, output: 300, total: 700 },
            retryAttempts: 0,
            version: '1.0.0'
          },
          confidence: 0.9,
          errors: []
        },
        [AgentType.INFO_GATHERER]: {
          agent: AgentType.INFO_GATHERER,
          success: true,
          data: { venues: [], accommodations: [], transportation: {} },
          metadata: {
            startedAt: new Date(),
            completedAt: new Date(),
            durationMs: 2100,
            cost: 0.005,
            provider: LLMProvider.GROQ,
            tokens: { input: 800, output: 1200, total: 2000 },
            retryAttempts: 0,
            version: '1.0.0'
          },
          confidence: 0.85,
          errors: []
        },
        [AgentType.STRATEGIST]: {
          agent: AgentType.STRATEGIST,
          success: true,
          data: { strategicPlan: { dailySchedule: [] }, budgetOptimization: { totalBudget: 5000 } },
          metadata: {
            startedAt: new Date(),
            completedAt: new Date(),
            durationMs: 1800,
            cost: 0.008,
            provider: LLMProvider.GEMINI,
            tokens: { input: 1000, output: 800, total: 1800 },
            retryAttempts: 0,
            version: '1.0.0'
          },
          confidence: 0.88,
          errors: []
        },
        [AgentType.COMPILER]: null
      },
      messages: [],
      config: {
        streaming: false,
        providerChains: {
          [AgentType.CONTENT_PLANNER]: [LLMProvider.CEREBRAS],
          [AgentType.INFO_GATHERER]: [LLMProvider.GROQ], 
          [AgentType.STRATEGIST]: [LLMProvider.GEMINI],
          [AgentType.COMPILER]: [LLMProvider.GEMINI]
        },
        retryConfig: {
          maxRetries: 3,
          initialDelayMs: 1000,
          backoffFactor: 2,
          maxDelayMs: 10000
        },
        resourceLimits: {
          maxCostPerAgent: 2.00,
          maxDurationMs: 30000,
          maxTokens: 10000
        },
        observability: {
          tracing: false,
          metrics: false,
          langsmithKey: undefined
        }
      },
      metadata: {
        startedAt: new Date(Date.now() - 30000),
        totalCost: 0.016,
        metrics: {},
        errors: []
      }
    };
  });

  describe('execute method', () => {
    test('should successfully compile comprehensive itinerary', async () => {
      const result = await agent.execute(mockContext);
      
      expect(result.success).toBe(true);
      expect(result.agent).toBe(AgentType.COMPILER);
      expect(result.data).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.errors).toHaveLength(0);
    });

    test('should generate complete trip summary', async () => {
      const result = await agent.execute(mockContext);
      
      const itinerary = result.data as any;
      expect(itinerary.tripSummary).toBeDefined();
      expect(itinerary.tripSummary.nickname).toBe('Paris Adventure');
      expect(itinerary.tripSummary.destination).toBe('Paris, France');
      expect(itinerary.tripSummary.dates.departure).toBe('2024-06-15');
      expect(itinerary.tripSummary.dates.return).toBe('2024-06-17');
      expect(itinerary.tripSummary.dates.duration).toBe(3);
      expect(itinerary.tripSummary.travelers.total).toBe(2);
      expect(itinerary.tripSummary.budget.total).toBe(5000);
    });

    test('should generate detailed daily itinerary', async () => {
      const result = await agent.execute(mockContext);
      
      const itinerary = result.data as any;
      expect(itinerary.dailyItinerary).toBeDefined();
      expect(itinerary.dailyItinerary).toHaveLength(2);
      
      const day1 = itinerary.dailyItinerary[0];
      expect(day1?.day).toBe(1);
      expect(day1?.theme).toBe('Historic Paris Discovery');
      expect(day1?.activities).toBeDefined();
      expect(day1?.meals).toBeDefined();
      expect(day1?.transportation).toBeDefined();
      expect(day1?.dailyBudgetUsed).toBeGreaterThan(0);
    });

    test('should include comprehensive travel tips', async () => {
      const result = await agent.execute(mockContext);
      
      const itinerary = result.data as any;
      expect(itinerary.travelTips).toBeDefined();
      expect(itinerary.travelTips.budgetSaving).toHaveLength(3);
      expect(itinerary.travelTips.localCustoms).toHaveLength(3);
      expect(itinerary.travelTips.safety).toHaveLength(3);
      expect(itinerary.travelTips.transportation).toHaveLength(2);
      expect(itinerary.travelTips.dining).toHaveLength(3);
      expect(itinerary.travelTips.shopping).toHaveLength(2);
      expect(itinerary.travelTips.photography).toHaveLength(2);
      expect(itinerary.travelTips.seasonal).toHaveLength(2);
    });

    test('should provide emergency information', async () => {
      const result = await agent.execute(mockContext);
      
      const itinerary = result.data as any;
      expect(itinerary.emergencyInfo).toBeDefined();
      expect(itinerary.emergencyInfo.localEmergencyNumber).toBe('112');
      expect(itinerary.emergencyInfo.embassy.name).toContain('Embassy');
      expect(itinerary.emergencyInfo.nearestHospital).toBeDefined();
      expect(itinerary.emergencyInfo.importantNotes).toHaveLength(3);
    });

    test('should generate comprehensive packing list', async () => {
      const result = await agent.execute(mockContext);
      
      const itinerary = result.data as any;
      expect(itinerary.packingList).toBeDefined();
      expect(itinerary.packingList.essentials).toHaveLength(4);
      expect(itinerary.packingList.clothingRecommendations).toHaveLength(4);
      expect(itinerary.packingList.electronics).toHaveLength(3);
      expect(itinerary.packingList.documents).toHaveLength(4);
      expect(itinerary.packingList.healthAndSafety).toHaveLength(3);
      expect(itinerary.packingList.seasonalItems).toHaveLength(2);
    });

    test('should calculate metadata correctly', async () => {
      const result = await agent.execute(mockContext);
      
      const itinerary = result.data as any;
      expect(itinerary.metadata).toBeDefined();
      expect(itinerary.metadata.compilationScore).toBe(0.92);
      expect(itinerary.metadata.optimizationLevel).toBe('premium');
      expect(new Date(itinerary.metadata.generatedAt)).toBeInstanceOf(Date);
    });

    test('should adjust for different traveler counts', async () => {
      mockContext.formData.adults = 4;
      
      const result = await agent.execute(mockContext);
      
      const itinerary = result.data as any;
      expect(itinerary.tripSummary.travelers.adults).toBe(4);
      expect(itinerary.tripSummary.travelers.total).toBe(4);
    });

    test('should adjust for different budget amounts', async () => {
      mockContext.formData.budget.amount = 8000;
      
      const result = await agent.execute(mockContext);
      
      const itinerary = result.data as any;
      expect(itinerary.tripSummary.budget.total).toBe(8000);
      expect(itinerary.dailyItinerary[0]?.dailyBudgetUsed).toBeGreaterThan(1000);
    });
  });

  describe('validateInput method', () => {
    test('should validate correct WorkflowContext with all agent results', async () => {
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

    test('should reject context without departure date', async () => {
      mockContext.formData.departureDate = '';
      
      const isValid = await agent.validateInput(mockContext);
      expect(isValid).toBe(false);
    });

    test('should reject context without return date', async () => {
      mockContext.formData.returnDate = '';
      
      const isValid = await agent.validateInput(mockContext);
      expect(isValid).toBe(false);
    });

    test('should reject context without content planning results', async () => {
      mockContext.agentResults[AgentType.CONTENT_PLANNER] = null;
      
      const isValid = await agent.validateInput(mockContext);
      expect(isValid).toBe(false);
    });

    test('should reject context without strategic planning results', async () => {
      mockContext.agentResults[AgentType.STRATEGIST] = null;
      
      const isValid = await agent.validateInput(mockContext);
      expect(isValid).toBe(false);
    });
  });

  describe('error handling', () => {
    test('should handle execution errors gracefully', async () => {
      mockContext.agentResults[AgentType.STRATEGIST] = null;
      
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
        expect(result.errors[0].message).toContain('Invalid content compiler context');
      }
    });
  });

  describe('confidence calculation', () => {
    test('should calculate high confidence for complete itinerary', async () => {
      const result = await agent.execute(mockContext);
      
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.confidence).toBeLessThanOrEqual(1.0);
    });

    test('should have confidence correlate with itinerary completeness', async () => {
      const result = await agent.execute(mockContext);
      
      const itinerary = result.data as any;
      expect(itinerary.metadata.compilationScore).toBe(0.92);
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('cost calculation', () => {
    test('should calculate execution cost based on processing time', async () => {
      const result = await agent.execute(mockContext);
      
      expect(result.metadata.cost).toBeGreaterThan(0);
      expect(result.metadata.cost).toBeLessThan(0.1);
    });

    test('should use Gemini as primary provider', async () => {
      const result = await agent.execute(mockContext);
      
      expect(result.metadata.provider).toBe(LLMProvider.GEMINI);
    });

    test('should track higher token usage for compilation', async () => {
      const result = await agent.execute(mockContext);
      
      expect(result.metadata.tokens.input).toBe(3000);
      expect(result.metadata.tokens.output).toBe(2500);
      expect(result.metadata.tokens.total).toBe(5500);
    });
  });

  describe('cleanup method', () => {
    test('should cleanup without errors', async () => {
      await expect(agent.cleanup()).resolves.toBeUndefined();
    });
  });

  describe('integration with workflow context', () => {
    test('should properly utilize data from all previous agents', async () => {
      const result = await agent.execute(mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const itinerary = result.data as any;
      
      // Uses planning data
      expect(itinerary.tripSummary.destination).toBe('Paris, France');
      
      // Uses strategist data
      expect(itinerary.tripSummary.budget.total).toBe(5000);
    });

    test('should be the final agent in the workflow', async () => {
      const result = await agent.execute(mockContext);
      
      expect(result.nextAgent).toBeUndefined();
      expect(result.success).toBe(true);
    });

    test('should produce comprehensive final output', async () => {
      const result = await agent.execute(mockContext);
      
      const itinerary = result.data as any;
      
      // Should have all required sections
      expect(itinerary.tripSummary).toBeDefined();
      expect(itinerary.dailyItinerary).toBeDefined();
      expect(itinerary.travelTips).toBeDefined();
      expect(itinerary.emergencyInfo).toBeDefined();
      expect(itinerary.packingList).toBeDefined();
      expect(itinerary.metadata).toBeDefined();
      
      // Should be ready for end-user consumption
      expect(itinerary.tripSummary.preparedFor).toBe('Sarah Davis');
      expect(itinerary.metadata.optimizationLevel).toBe('premium');
    });
  });
});
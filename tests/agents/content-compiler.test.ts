import { describe, test, expect, beforeEach } from 'vitest';
import { ContentCompilerAgent } from '../../api/agents/content-compiler/content-compiler-simple.js';
import { 
  AgentType, 
  LLMProvider, 
  WorkflowState,
  type WorkflowContext,
  type AgentResult
} from '../../src/types/agents.js';

// Minimal types for testing ContentCompiler output
interface MinimalCompiledItinerary {
  tripSummary: {
    nickname: string;
    destination: string;
    dates: {
      departure: string;
      return: string;
      duration: number;
    };
    travelers: {
      adults: number;
      children: number;
      total: number;
    };
    budget: {
      total: number;
      mode: string;
      optimizationLevel: string;
    };
    preparedFor: string;
  };
  dailyItinerary: Array<{
    day: number;
    date: string;
    theme: string;
    activities: Array<{
      time: string;
      name: string;
      category: string;
      estimatedCost: number;
    }>;
    meals: Array<{
      time: string;
      type: string;
      name: string;
      estimatedCost: number;
    }>;
    transportation: Array<{
      time: string;
      mode: string;
      route: string;
      estimatedCost: number;
    }>;
    dailyBudgetUsed: number;
    notes: string[];
  }>;
  travelTips: {
    budgetSaving: string[];
    localCustoms: string[];
    safety: string[];
    transportation: string[];
    dining: string[];
    shopping: string[];
    photography: string[];
    seasonal: string[];
  };
  emergencyInfo: {
    localEmergencyNumber: string;
    embassy: {
      name: string;
      phone: string;
      address: string;
    };
    nearestHospital: string;
    importantNotes: string[];
  };
  packingList: {
    essentials: string[];
    clothingRecommendations: string[];
    electronics: string[];
    documents: string[];
    healthAndSafety: string[];
    seasonalItems: string[];
  };
  metadata: {
    generatedAt: string;
    compilationScore: number;
    optimizationLevel: string;
  };
}

describe('ContentCompilerAgent', () => {
  let agent: ContentCompilerAgent;
  let mockContext: WorkflowContext;
  let mockPlannerResult: AgentResult;
  let mockGathererResult: AgentResult;
  let mockStrategistResult: AgentResult;

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
        maxAttempts: 3,
        initialDelay: 1000,
        backoffMultiplier: 2.0,
        maxDelay: 10000
      },
      resourceLimits: {
        maxCostPerSession: 5.00,
        maxExecutionTimeMs: 300000,
        maxTokensPerAgent: 10000
      },
      observability: {
        enableTracing: false,
        enableMetrics: false,
        langsmithApiKey: undefined
      }
    });

    // Mock Content Planner Result
    mockPlannerResult = {
      agent: AgentType.CONTENT_PLANNER,
      success: true,
      data: {
        contentPlan: {
          objectives: ['Cultural exploration', 'Historic sites', 'Local cuisine'],
          targetAudience: 'Adult couple seeking cultural enrichment',
          keyTopics: ['museums', 'restaurants', 'landmarks', 'neighborhoods']
        }
      },
      metadata: {
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 1200,
        cost: 0.003,
        provider: LLMProvider.CEREBRAS,
        tokens: { input: 400, output: 300, total: 700 },
        model: 'llama-3.1-8b-instant'
      },
      confidence: 0.9,
      errors: []
    };

    // Mock Info Gatherer Result
    mockGathererResult = {
      agent: AgentType.INFO_GATHERER,
      success: true,
      data: {
        venues: [
          {
            name: 'Louvre Museum',
            type: 'museum',
            rating: 4.8,
            priceRange: '€15-€25',
            recommendedDuration: '3-4 hours',
            bestTimeToVisit: 'Morning or late afternoon',
            location: '1st arrondissement'
          },
          {
            name: 'Eiffel Tower',
            type: 'landmark',
            rating: 4.6,
            priceRange: '€29-€46',
            recommendedDuration: '2-3 hours',
            bestTimeToVisit: 'Sunset',
            location: '7th arrondissement'
          }
        ],
        accommodations: [
          {
            name: 'Hotel des Arts',
            type: 'hotel',
            rating: 4.2,
            priceRange: '€120-€180',
            neighborhood: 'Montmartre',
            amenities: ['WiFi', 'Breakfast', 'Concierge']
          }
        ],
        transportation: {
          publicTransit: {
            system: 'Metro/RER',
            dailyPass: '€7.50',
            coverage: 'Excellent city-wide coverage'
          },
          rideshare: {
            available: true,
            averageCost: '€8-€15 per ride'
          }
        },
        localTips: [
          'Many museums are free on first Sunday of each month',
          'Restaurants typically close between lunch and dinner',
          'Tipping 10% is standard in restaurants'
        ]
      },
      metadata: {
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 2100,
        cost: 0.005,
        provider: LLMProvider.GROQ,
        tokens: { input: 800, output: 1200, total: 2000 }
      },
      confidence: 0.85,
      errors: []
    };

    // Mock Strategist Result
    mockStrategistResult = {
      agentType: AgentType.STRATEGIST,
      success: true,
      data: {
        strategicPlan: {
          dailySchedule: [
            {
              day: 1,
              theme: 'Historic Paris Discovery',
              priority: 'high',
              activities: ['Louvre Museum morning visit', 'Seine river walk', 'Eiffel Tower sunset'],
              budgetAllocation: 150,
              logisticalNotes: ['Book Louvre tickets in advance', 'Metro day pass recommended']
            },
            {
              day: 2,
              theme: 'Cultural Immersion',
              priority: 'medium',
              activities: ['Montmartre exploration', 'Local market visit', 'Cooking class'],
              budgetAllocation: 120,
              logisticalNotes: ['Early morning start for markets', 'Comfortable walking shoes']
            }
          ]
        },
        budgetOptimization: {
          totalBudget: 5000,
          dailyAverage: 250,
          priorityAreas: ['accommodation', 'dining', 'activities'],
          savingOpportunities: ['Free museum days', 'Local markets', 'Walking tours']
        }
      },
      metadata: {
        provider: LLMProvider.GEMINI,
        cost: 0.008,
        executionTime: 1800,
        tokens: { input: 1000, output: 800, total: 1800 }
      },
      confidence: 0.88,
      errors: []
    };

    // Mock Workflow Context
    mockContext = {
      sessionId: 'test-session-123',
      workflowState: WorkflowState.COMPILING,
      formData: {
        destination: 'Paris, France',
        departureDate: '2024-06-15',
        returnDate: '2024-06-17',
        adults: 2,
        children: 0,
        budget: {
          amount: 5000,
          mode: 'total'
        },
        accommodations: {
          type: 'hotel',
          preferences: ['central_location', 'modern_amenities']
        },
        preferences: {
          interests: ['culture', 'history', 'food'],
          pace: 'moderate',
          style: 'premium'
        }
      },
      agentResults: {
        [AgentType.CONTENT_PLANNER]: mockPlannerResult,
        [AgentType.INFO_GATHERER]: mockGathererResult,
        [AgentType.STRATEGIST]: mockStrategistResult,
        [AgentType.CONTENT_COMPILER]: null
      },
      metadata: {
        startTime: Date.now() - 30000,
        currentStep: 4,
        totalSteps: 4
      }
    };
  });

  describe('execute method', () => {
    test('should successfully compile comprehensive itinerary', async () => {
      const result = await agent.execute(mockContext);
      
      expect(result.success).toBe(true);
      expect(result.agentType).toBe(AgentType.CONTENT_COMPILER);
      expect(result.data).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.errors).toHaveLength(0);
    });

    test('should generate complete trip summary', async () => {
      const result = await agent.execute(mockContext);
      
      const itinerary = result.data as MinimalCompiledItinerary;
      expect(itinerary.tripSummary).toBeDefined();
      expect(itinerary.tripSummary.nickname).toBe('Paris Cultural Adventure');
      expect(itinerary.tripSummary.destination).toBe('Paris, France');
      expect(itinerary.tripSummary.dates.departure).toBe('2024-06-15');
      expect(itinerary.tripSummary.dates.return).toBe('2024-06-17');
      expect(itinerary.tripSummary.dates.duration).toBe(3);
      expect(itinerary.tripSummary.travelers.total).toBe(2);
      expect(itinerary.tripSummary.budget.total).toBe(5000);
    });

    test('should generate detailed daily itinerary', async () => {
      const result = await agent.execute(mockContext);
      
      const itinerary = result.data as MinimalCompiledItinerary;
      expect(itinerary.dailyItinerary).toBeDefined();
      expect(itinerary.dailyItinerary).toHaveLength(3);
      
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
      
      const itinerary = result.data as MinimalCompiledItinerary;
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
      
      const itinerary = result.data as MinimalCompiledItinerary;
      expect(itinerary.emergencyInfo).toBeDefined();
      expect(itinerary.emergencyInfo.localEmergencyNumber).toBe('112');
      expect(itinerary.emergencyInfo.embassy.name).toContain('Embassy');
      expect(itinerary.emergencyInfo.nearestHospital).toBeDefined();
      expect(itinerary.emergencyInfo.importantNotes).toHaveLength(3);
    });

    test('should generate comprehensive packing list', async () => {
      const result = await agent.execute(mockContext);
      
      const itinerary = result.data as MinimalCompiledItinerary;
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
      
      const itinerary = result.data as MinimalCompiledItinerary;
      expect(itinerary.metadata).toBeDefined();
      expect(itinerary.metadata.compilationScore).toBe(0.92);
      expect(itinerary.metadata.optimizationLevel).toBe('premium');
      expect(new Date(itinerary.metadata.generatedAt)).toBeInstanceOf(Date);
    });

    test('should adjust for different traveler counts', async () => {
      mockContext.formData.adults = 4;
      
      const result = await agent.execute(mockContext);
      
      const itinerary = result.data as MinimalCompiledItinerary;
      expect(itinerary.tripSummary.travelers.adults).toBe(4);
      expect(itinerary.tripSummary.travelers.total).toBe(4);
    });

    test('should adjust for different budget amounts', async () => {
      mockContext.formData.budget.amount = 8000;
      (mockStrategistResult.data as any).budgetOptimization.totalBudget = 8000;
      
      const result = await agent.execute(mockContext);
      
      const itinerary = result.data as MinimalCompiledItinerary;
      expect(itinerary.tripSummary.budget.total).toBe(8000);
      expect(itinerary.dailyItinerary[0]?.dailyBudgetUsed).toBeGreaterThan(1000);
    });

    test('should include food interests in recommendations', async () => {
      mockContext.formData.preferences.interests = ['food', 'wine'];
      
      const result = await agent.execute(mockContext);
      
      const itinerary = result.data as MinimalCompiledItinerary;
      expect(itinerary.dailyItinerary[0]?.notes.some((note: string) => 
        note.toLowerCase().includes('food') || note.toLowerCase().includes('specialties')
      )).toBe(true);
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

    test('should reject context without strategic planning results', async () => {
      mockContext.agentResults[AgentType.STRATEGIST] = null;
      
      const isValid = await agent.validateInput(mockContext);
      expect(isValid).toBe(false);
    });

    test('should reject context with failed strategic planning', async () => {
      mockContext.agentResults[AgentType.STRATEGIST]!.success = false;
      
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
        expect(result.errors[0].details).toBeDefined();
        if (result.errors[0].details) {
          expect(result.errors[0].details['destination']).toBe('Paris, France');
          expect(result.errors[0].details['hasInformationGathering']).toBe(false);
        }
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
      
      const itinerary = result.data as MinimalCompiledItinerary;
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
      
      const itinerary = result.data as MinimalCompiledItinerary;
      
      // Uses planning data
      expect(itinerary.tripSummary.destination).toBe('Paris, France');
      
      // Uses gathering data
      expect(itinerary.dailyItinerary[0]?.activities.some((activity: any) => 
        activity.name.includes('Exploration') || activity.name.includes('Experience')
      )).toBe(true);
      
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
      
      const itinerary = result.data as MinimalCompiledItinerary;
      
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
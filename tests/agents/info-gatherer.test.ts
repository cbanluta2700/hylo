import { describe, test, expect, beforeEach } from 'vitest';
import { mock, MockProxy, mockClear } from 'vitest-mock-extended';
import { InfoGathererAgent } from '../../api/agents/info-gatherer/info-gatherer-simple';
import { 
  TravelFormData, 
  WorkflowContext,
  WorkflowConfig,
  AgentType,
  WorkflowState,
  LLMProvider,
  AgentResult
} from '../../src/types/agents';

// Minimal type for testing InfoGatherer output
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

describe('InfoGathererAgent', () => {
  let agent: InfoGathererAgent;
  let mockContext: MockProxy<WorkflowContext>;
  let config: WorkflowConfig;
  let sampleFormData: TravelFormData;
  let mockPlanningResult: AgentResult;

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
        tags: { test: 'info-gatherer' }
      }
    };

    sampleFormData = {
      destination: 'Tokyo, Japan',
      departureDate: '2024-04-01',
      returnDate: '2024-04-07',
      tripNickname: 'Tokyo Cherry Blossom Trip',
      contactName: 'Jane Smith',
      adults: 2,
      children: 0,
      budget: {
        amount: 3500,
        currency: 'USD',
        mode: 'total'
      },
      preferences: {
        travelStyle: 'culture',
        interests: ['temples', 'gardens', 'food'],
        accommodationType: 'hotel',
        transportationMode: 'train',
        dietaryRestrictions: [],
        accessibility: []
      }
    };

    // Mock successful planning result from previous agent
    mockPlanningResult = {
      agent: AgentType.CONTENT_PLANNER,
      success: true,
      data: {
        destination: { primary: 'Tokyo, Japan' },
        travelDates: { duration: 6 },
        travelers: { total: 2 },
        budget: { amount: 3500 }
      },
      metadata: {
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 1000,
        cost: 0.01,
        provider: LLMProvider.CEREBRAS,
        tokens: { input: 0, output: 0, total: 0 },
        retryAttempts: 0,
        version: '1.0.0'
      },
      errors: [],
      nextAgent: AgentType.INFO_GATHERER,
      confidence: 0.8
    };

    mockContext = mock<WorkflowContext>();
    mockContext.sessionId = 'test-session-456';
    mockContext.formData = sampleFormData;
    mockContext.state = WorkflowState.INFO_GATHERING;
    mockContext.agentResults = {
      [AgentType.CONTENT_PLANNER]: mockPlanningResult,
      [AgentType.INFO_GATHERER]: null,
      [AgentType.STRATEGIST]: null,
      [AgentType.COMPILER]: null
    };
    mockContext.messages = [];
    mockContext.config = config;
    mockContext.metadata = {
      startedAt: new Date(),
      totalCost: 0.01,
      metrics: {},
      errors: []
    };

    agent = new InfoGathererAgent(config);
    mockClear(mockContext);
  });

  describe('constructor', () => {
    test('should initialize with correct agent name', () => {
      expect(agent.name).toBe(AgentType.INFO_GATHERER);
    });

    test('should initialize with provided configuration', () => {
      expect(agent.version).toBe('1.0.0');
      expect(agent.timeout).toBe(30000);
      expect(agent.maxCost).toBe(2.00);
    });
  });

  describe('execute method', () => {
    test('should return successful AgentResult with GatheredInformationRepository', async () => {
      const result = await agent.execute(mockContext);

      // Basic result structure assertions
      expect(result).toBeDefined();
      expect(result.agent).toBe(AgentType.INFO_GATHERER);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.nextAgent).toBe(AgentType.STRATEGIST);
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should gather accommodation information correctly', async () => {
      const result = await agent.execute(mockContext);
      
      const gatheredInfo = result.data as MinimalGatheredInformationRepository;
      expect(gatheredInfo.accommodations).toBeDefined();
      expect(gatheredInfo.accommodations.length).toBeGreaterThan(0);
      expect(gatheredInfo.accommodations[0]).toHaveProperty('name');
      expect(gatheredInfo.accommodations[0]).toHaveProperty('type');
      expect(gatheredInfo.accommodations[0]).toHaveProperty('rating');
      expect(gatheredInfo.accommodations[0]).toHaveProperty('priceRange');
    });

    test('should gather activity information based on travel style', async () => {
      const result = await agent.execute(mockContext);
      
      const gatheredInfo = result.data as MinimalGatheredInformationRepository;
      expect(gatheredInfo.activities).toBeDefined();
      expect(gatheredInfo.activities.length).toBeGreaterThan(0);
      
      // For culture travel style, should include cultural activities
      const culturalActivities = gatheredInfo.activities.filter(
        (activity: any) => activity.category === 'culture' || activity.category === 'sightseeing'
      );
      expect(culturalActivities.length).toBeGreaterThan(0);
    });

    test('should gather restaurant information', async () => {
      const result = await agent.execute(mockContext);
      
      const gatheredInfo = result.data as MinimalGatheredInformationRepository;
      expect(gatheredInfo.restaurants).toBeDefined();
      expect(gatheredInfo.restaurants.length).toBeGreaterThan(0);
      expect(gatheredInfo.restaurants[0]).toHaveProperty('name');
      expect(gatheredInfo.restaurants[0]).toHaveProperty('cuisine');
      expect(gatheredInfo.restaurants[0]).toHaveProperty('rating');
    });

    test('should gather transportation information', async () => {
      const result = await agent.execute(mockContext);
      
      const gatheredInfo = result.data as MinimalGatheredInformationRepository;
      expect(gatheredInfo.transportation).toBeDefined();
      expect(gatheredInfo.transportation.airports).toBeDefined();
      expect(gatheredInfo.transportation.publicTransport.types).toBeDefined();
      expect(gatheredInfo.transportation.rideshare.available).toBeDefined();
    });

    test('should gather weather information', async () => {
      const result = await agent.execute(mockContext);
      
      const gatheredInfo = result.data as MinimalGatheredInformationRepository;
      expect(gatheredInfo.weather).toBeDefined();
      expect(gatheredInfo.weather.destination).toBe('Tokyo, Japan');
      expect(gatheredInfo.weather.forecast).toBeDefined();
      expect(gatheredInfo.weather.forecast.length).toBeGreaterThan(0);
    });

    test('should gather safety information', async () => {
      const result = await agent.execute(mockContext);
      
      const gatheredInfo = result.data as MinimalGatheredInformationRepository;
      expect(gatheredInfo.safety).toBeDefined();
      expect(gatheredInfo.safety.overallRating).toBeGreaterThan(0);
      expect(gatheredInfo.safety.recommendations).toBeDefined();
      expect(gatheredInfo.safety.recommendations.length).toBeGreaterThan(0);
    });

    test('should include search metadata', async () => {
      const result = await agent.execute(mockContext);
      
      const gatheredInfo = result.data as MinimalGatheredInformationRepository;
      expect(gatheredInfo.searchMetadata).toBeDefined();
      expect(gatheredInfo.searchMetadata.queriesExecuted).toBeGreaterThan(0);
      expect(gatheredInfo.searchMetadata.sourcesAccessed.length).toBeGreaterThan(0);
      expect(gatheredInfo.searchMetadata.informationCompleteness).toBeGreaterThan(0);
      expect(gatheredInfo.searchMetadata.lastUpdated).toBeInstanceOf(Date);
    });

    test('should handle different travel styles', async () => {
      // Test with adventure travel style
      mockContext.formData.preferences.travelStyle = 'adventure';
      
      const result = await agent.execute(mockContext);
      
      const gatheredInfo = result.data as MinimalGatheredInformationRepository;
      const adventureActivities = gatheredInfo.activities.filter(
        (activity: any) => activity.category === 'adventure'
      );
      expect(adventureActivities.length).toBeGreaterThan(0);
    });

    test('should handle budget travel style filtering', async () => {
      // Test with budget travel style
      mockContext.formData.preferences.travelStyle = 'budget';
      
      const result = await agent.execute(mockContext);
      
      const gatheredInfo = result.data as MinimalGatheredInformationRepository;
      const budgetAccommodations = gatheredInfo.accommodations.filter(
        (acc: any) => acc.priceRange === '$'
      );
      expect(budgetAccommodations.length).toBeGreaterThan(0);
    });

    test('should handle luxury travel style filtering', async () => {
      // Test with luxury travel style
      mockContext.formData.preferences.travelStyle = 'luxury';
      
      const result = await agent.execute(mockContext);
      
      const gatheredInfo = result.data as MinimalGatheredInformationRepository;
      const luxuryAccommodations = gatheredInfo.accommodations.filter(
        (acc: any) => acc.priceRange === '$$$'
      );
      expect(luxuryAccommodations.length).toBeGreaterThan(0);
    });
  });

  describe('validateInput method', () => {
    test('should validate correct WorkflowContext with planning results', async () => {
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

    test('should reject context without planning results', async () => {
      mockContext.agentResults[AgentType.CONTENT_PLANNER] = null;
      
      const isValid = await agent.validateInput(mockContext);
      expect(isValid).toBe(false);
    });

    test('should reject context with failed planning results', async () => {
      mockContext.agentResults[AgentType.CONTENT_PLANNER]!.success = false;
      
      const isValid = await agent.validateInput(mockContext);
      expect(isValid).toBe(false);
    });
  });

  describe('error handling', () => {
    test('should handle execution errors gracefully', async () => {
      // Mock context without planning results to trigger error
      mockContext.agentResults[AgentType.CONTENT_PLANNER] = null;
      
      const result = await agent.execute(mockContext);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.data).toBeNull();
      expect(result.confidence).toBe(0);
    });

    test('should set correct error details', async () => {
      mockContext.agentResults[AgentType.CONTENT_PLANNER] = null;
      
      const result = await agent.execute(mockContext);
      
      expect(result.errors.length).toBeGreaterThan(0);
      if (result.errors[0]) {
        expect(result.errors[0].message).toContain('No content planning context available');
        expect(result.errors[0].details).toBeDefined();
        if (result.errors[0].details) {
          expect(result.errors[0].details['destination']).toBe('Tokyo, Japan');
        }
      }
    });
  });

  describe('cleanup method', () => {
    test('should cleanup without errors', async () => {
      await expect(agent.cleanup()).resolves.toBeUndefined();
    });
  });

  describe('integration with workflow context', () => {
    test('should properly utilize planning context from previous agent', async () => {
      const result = await agent.execute(mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      // Should have processed the destination from the planning context
      const gatheredInfo = result.data as MinimalGatheredInformationRepository;
      expect(gatheredInfo.weather.destination).toBe('Tokyo, Japan');
    });

    test('should handle different destinations correctly', async () => {
      mockContext.formData.destination = 'Barcelona, Spain';
      
      const result = await agent.execute(mockContext);
      
      const gatheredInfo = result.data as MinimalGatheredInformationRepository;
      expect(gatheredInfo.weather.destination).toBe('Barcelona, Spain');
      if (gatheredInfo.accommodations.length > 0) {
        expect(gatheredInfo.accommodations[0]?.name).toContain('Barcelona');
      }
    });
  });
});
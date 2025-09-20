import { describe, test, expect, beforeEach } from 'vitest';
import { mock, MockProxy, mockClear } from 'vitest-mock-extended';
import { ContentPlannerAgent } from '../../api/agents/content-planner/content-planner-simple';
import { 
  TravelFormData, 
  WorkflowContext,
  WorkflowConfig,
  AgentType,
  WorkflowState,
  LLMProvider
} from '../../src/types/agents';

// Minimal type for testing
interface MinimalContentPlanningContext {
  destination: {
    primary: string;
    currency: { code: string; };
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
  };
  searchQueries: Array<{
    id: string;
    query: string;
  }>;
}

describe('ContentPlannerAgent', () => {
  let agent: ContentPlannerAgent;
  let mockContext: MockProxy<WorkflowContext>;
  let config: WorkflowConfig;
  let sampleFormData: TravelFormData;

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
        maxCost: 0.50,
        maxTokensPerAgent: 8000,
        maxMemoryUsage: 512,
        maxConcurrentWorkflows: 5
      },
      observability: {
        langsmithEnabled: true,
        metricsEnabled: true,
        verboseLogging: false,
        tags: { test: 'content-planner' }
      }
    };

    sampleFormData = {
      destination: 'Paris, France',
      departureDate: '2024-03-01',
      returnDate: '2024-03-05',
      tripNickname: 'Paris Spring Trip',
      contactName: 'John Doe',
      adults: 2,
      children: 0,
      budget: {
        amount: 2000,
        currency: 'USD',
        mode: 'total'
      },
      preferences: {
        travelStyle: 'culture',
        interests: ['museums', 'architecture'],
        accommodationType: 'hotel',
        transportationMode: 'flight',
        dietaryRestrictions: [],
        accessibility: []
      }
    };

    mockContext = mock<WorkflowContext>();
    mockContext.sessionId = 'test-session-123';
    mockContext.formData = sampleFormData;
    mockContext.state = WorkflowState.CONTENT_PLANNING;
    mockContext.agentResults = {
      [AgentType.CONTENT_PLANNER]: null,
      [AgentType.INFO_GATHERER]: null,
      [AgentType.STRATEGIST]: null,
      [AgentType.COMPILER]: null
    };
    mockContext.messages = [];
    mockContext.config = config;
    mockContext.metadata = {
      startedAt: new Date(),
      totalCost: 0,
      metrics: {},
      errors: []
    };

    agent = new ContentPlannerAgent(config);
    mockClear(mockContext);
  });

  describe('constructor', () => {
    test('should initialize with correct agent name', () => {
      expect(agent.name).toBe(AgentType.CONTENT_PLANNER);
    });

    test('should initialize with provided configuration', () => {
      expect(agent.version).toBe('1.0.0');
      expect(agent.timeout).toBe(30000);
      expect(agent.maxCost).toBe(0.50);
    });
  });

  describe('execute method', () => {
    test('should return successful AgentResult with ContentPlanningContext', async () => {
      const result = await agent.execute(mockContext);

      // Basic result structure assertions
      expect(result).toBeDefined();
      expect(result.agent).toBe(AgentType.CONTENT_PLANNER);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.nextAgent).toBe(AgentType.INFO_GATHERER);
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should analyze destination correctly', async () => {
      const result = await agent.execute(mockContext);
      
      const planningContext = result.data as MinimalContentPlanningContext;
      expect(planningContext.destination.primary).toBe('Paris, France');
      expect(planningContext.destination.currency.code).toBe('USD');
    });

    test('should calculate trip duration correctly', async () => {
      const result = await agent.execute(mockContext);
      
      const planningContext = result.data as MinimalContentPlanningContext;
      expect(planningContext.travelDates.duration).toBe(4); // March 1-5 = 4 days
      expect(planningContext.travelDates.departure).toBeInstanceOf(Date);
      expect(planningContext.travelDates.return).toBeInstanceOf(Date);
    });

    test('should count travelers correctly', async () => {
      const result = await agent.execute(mockContext);
      
      const planningContext = result.data as MinimalContentPlanningContext;
      expect(planningContext.travelers.adults).toBe(2);
      expect(planningContext.travelers.children).toBe(0);
      expect(planningContext.travelers.total).toBe(2);
    });

    test('should process budget correctly', async () => {
      const result = await agent.execute(mockContext);
      
      const planningContext = result.data as MinimalContentPlanningContext;
      expect(planningContext.budget.amount).toBe(2000);
      expect(planningContext.budget.currency).toBe('USD');
      expect(planningContext.budget.mode).toBe('total');
    });

    test('should generate search queries', async () => {
      const result = await agent.execute(mockContext);
      
      const planningContext = result.data as MinimalContentPlanningContext;
      expect(planningContext.searchQueries).toBeDefined();
      expect(planningContext.searchQueries.length).toBeGreaterThan(0);
      expect(planningContext.searchQueries.some((q: any) => q.query.includes('Paris'))).toBe(true);
    });
  });

  describe('validateInput method', () => {
    test('should validate correct form data', async () => {
      const isValid = await agent.validateInput(sampleFormData);
      expect(isValid).toBe(true);
    });

    test('should reject missing destination', async () => {
      const invalidData = { ...sampleFormData, destination: '' };
      const isValid = await agent.validateInput(invalidData);
      expect(isValid).toBe(false);
    });

    test('should reject invalid adult count', async () => {
      const invalidData = { ...sampleFormData, adults: 0 };
      const isValid = await agent.validateInput(invalidData);
      expect(isValid).toBe(false);
    });
  });

  describe('cleanup method', () => {
    test('should cleanup without errors', async () => {
      await expect(agent.cleanup()).resolves.toBeUndefined();
    });
  });
});
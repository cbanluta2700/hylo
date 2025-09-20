/**
 * Tests for Mock LLM Providers
 * Validates realistic response generation, provider fallback chains, and cost tracking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  MockGroqProvider,
  MockCerebrasProvider,
  MockGoogleProvider,
  MockProviderChain,
  createMockLLMEnvironment,
  TravelItineraryResponseGenerator
} from './llm-providers.js';
import { travelFormFactory } from '../factories/form-data-factory.js';

describe('Mock LLM Providers', () => {
  describe('MockGroqProvider', () => {
    let provider: MockGroqProvider;

    beforeEach(() => {
      provider = new MockGroqProvider();
    });

    it('should generate realistic travel planning responses', async () => {
      const formData = travelFormFactory.build();
      const messages = [{ role: 'user', content: 'Plan my trip' }];
      
      const response = await provider.chat(messages, { 
        agent: 'content-planner',
        formData 
      });

      expect(response.id).toMatch(/^groq-/);
      expect(response.choices[0].message.content).toContain('Travel Content Planning Analysis');
      expect(response.choices[0].message.content).toContain(formData.destination || '');
      expect(response.usage.total_tokens).toBeGreaterThan(0);
      expect(response.cost).toBeDefined();
      expect(response.cost!.total_cost).toBeGreaterThan(0);
    });

    it('should support streaming responses', async () => {
      const messages = [{ role: 'user', content: 'Create an itinerary' }];
      const chunks: string[] = [];
      
      for await (const chunk of provider.stream(messages, { agent: 'content-compiler' })) {
        if (chunk.choices[0]?.delta?.content) {
          chunks.push(chunk.choices[0].delta.content);
        }
      }

      expect(chunks.length).toBeGreaterThan(1);
      const fullContent = chunks.join('');
      expect(fullContent).toContain('Travel Itinerary');
      expect(fullContent.length).toBeGreaterThan(100);
    }, 10000);

    it('should track call counts and costs', async () => {
      expect(provider.getCallCount()).toBe(0);
      
      const messages = [{ role: 'user', content: 'Test' }];
      const response = await provider.chat(messages);
      
      expect(provider.getCallCount()).toBe(1);
      expect(response.cost?.total_cost).toBeLessThan(1); // Should be cost-effective
    });

    it('should simulate realistic failures', async () => {
      provider.setSuccessRate(0); // Force failures
      
      const messages = [{ role: 'user', content: 'Test' }];
      
      await expect(provider.chat(messages)).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('Provider-specific Response Generation', () => {
    let formData: any;

    beforeEach(() => {
      formData = travelFormFactory.build({
        destination: 'Paris, France',
        adults: 2,
        children: 1,
        budget: 3000,
        budgetType: 'total',
        travelStyle: ['family-friendly', 'cultural']
      });
    });

    it('should generate content planner responses', () => {
      const response = TravelItineraryResponseGenerator.generateContentPlannerResponse(formData);
      
      expect(response).toContain('Travel Content Planning Analysis for Paris, France');
      expect(response).toContain('3 travelers');
      expect(response).toContain('Required Real-time Information');
      expect(response).toContain('Information Gathering Priority');
    });

    it('should generate info gatherer responses', () => {
      const response = TravelItineraryResponseGenerator.generateInfoGathererResponse(formData);
      
      expect(response).toContain('Real-time Information Gathered for Paris, France');
      expect(response).toContain('Weather & Climate Information');
      expect(response).toContain('Transportation Information');
      expect(response).toContain('Accommodation Options');
    });

    it('should generate strategist responses', () => {
      const response = TravelItineraryResponseGenerator.generateStrategistResponse(formData);
      
      expect(response).toContain('Strategic Travel Recommendations for Paris, France');
      expect(response).toContain('Budget Optimization Strategy');
      expect(response).toContain('**Total Budget**: $3000');
      expect(response).toContain('Activity Prioritization');
    });

    it('should generate complete itinerary', () => {
      const response = TravelItineraryResponseGenerator.generateContentCompilerResponse(formData);
      
      expect(response).toContain('Paris, France Travel Itinerary');
      expect(response).toContain('TRIP SUMMARY');
      expect(response).toContain('DAILY ITINERARY');
      expect(response).toContain('TIPS FOR YOUR TRIP');
      expect(response).toContain('2 adults + 1 child');
    });
  });

  describe('MockProviderChain', () => {
    let chain: MockProviderChain;

    beforeEach(() => {
      chain = new MockProviderChain();
    });

    it('should execute successful request with first provider', async () => {
      const request = 'Generate travel plan';
      const options = { agent: 'content-planner', formData: travelFormFactory.build() };
      
      // Force Groq to succeed for this test
      const mockEnv = createMockLLMEnvironment();
      mockEnv.groq.setSuccessRate(1.0);
      
      const result = await mockEnv.chain.executeWithFallback(request, options);
      
      expect(result.provider).toBe('groq'); // Should use first priority provider
      expect(result.response).toBeDefined();
      expect(result.attempts).toHaveLength(1);
      expect(result.attempts[0].success).toBe(true);
    });

    it('should fallback to secondary providers on failure', async () => {
      const mockEnv = createMockLLMEnvironment();
      mockEnv.simulateProviderFailure('groq', true);
      
      const request = 'Generate travel plan';
      const options = { agent: 'content-planner', formData: travelFormFactory.build() };
      
      const result = await mockEnv.chain.executeWithFallback(request, options);
      
      expect(['cerebras', 'google']).toContain(result.provider);
      expect(result.attempts.length).toBeGreaterThan(1);
      expect(result.attempts[0].success).toBe(false); // First attempt failed
      expect(result.attempts.some((a: any) => a.success)).toBe(true); // At least one succeeded
    });

    it('should track performance metrics across providers', async () => {
      const mockEnv = createMockLLMEnvironment();
      
      await mockEnv.chain.executeWithFallback('Test request 1', { agent: 'content-planner' });
      await mockEnv.chain.executeWithFallback('Test request 2', { agent: 'strategist' });
      
      const metrics = mockEnv.getPerformanceMetrics();
      
      expect(metrics.totalAttempts).toBeGreaterThanOrEqual(2);
      expect(metrics.successfulAttempts).toBeGreaterThan(0);
      expect(metrics.averageLatency).toBeGreaterThan(0);
      expect(metrics.totalCost).toBeGreaterThan(0);
    });
  });

  describe('Cost and Performance Simulation', () => {
    it('should simulate realistic cost differences between providers', async () => {
      const mockEnv = createMockLLMEnvironment();
      const formData = travelFormFactory.build();
      
      // Ensure providers succeed for this test
      mockEnv.groq.setSuccessRate(1.0);
      mockEnv.google.setSuccessRate(1.0);
      
      const groqResponse = await mockEnv.groq.chat([{ role: 'user', content: 'Test' }], { formData });
      const googleResponse = await mockEnv.google.generateContent({ prompt: 'Test', formData });
      
      // Groq should be cheaper (cost multiplier 0.5 vs 1.0)
      expect(groqResponse.cost!.total_cost).toBeLessThan(googleResponse.cost!.total_cost);
    });

    it('should simulate realistic latency differences', async () => {
      const mockEnv = createMockLLMEnvironment();
      
      const start1 = Date.now();
      await mockEnv.cerebras.generate('Test'); // Fastest provider
      const cerebrasLatency = Date.now() - start1;
      
      const start2 = Date.now();
      await mockEnv.google.generateContent({ prompt: 'Test' }); // Slowest provider
      const googleLatency = Date.now() - start2;
      
      // Note: These are simulated delays, so we just check they're reasonable
      expect(cerebrasLatency).toBeGreaterThan(50); // At least 50ms
      expect(googleLatency).toBeGreaterThan(cerebrasLatency); // Google should be slower
    });
  });

  describe('Integration with Test Environment', () => {
    it('should provide comprehensive mock environment', () => {
      const mockEnv = createMockLLMEnvironment();
      
      expect(mockEnv.groq).toBeInstanceOf(MockGroqProvider);
      expect(mockEnv.cerebras).toBeInstanceOf(MockCerebrasProvider);
      expect(mockEnv.google).toBeInstanceOf(MockGoogleProvider);
      expect(mockEnv.chain).toBeInstanceOf(MockProviderChain);
      
      expect(typeof mockEnv.resetAllMocks).toBe('function');
      expect(typeof mockEnv.simulateProviderFailure).toBe('function');
      expect(typeof mockEnv.getTotalCosts).toBe('function');
      expect(typeof mockEnv.getPerformanceMetrics).toBe('function');
    });

    it('should reset all mocks correctly', async () => {
      const mockEnv = createMockLLMEnvironment();
      
      // Ensure providers succeed for this test
      mockEnv.groq.setSuccessRate(1.0);
      mockEnv.cerebras.setSuccessRate(1.0);
      
      // Make some calls
      await mockEnv.groq.chat([{ role: 'user', content: 'Test' }]);
      await mockEnv.cerebras.generate('Test');
      
      expect(mockEnv.groq.getCallCount()).toBe(1);
      expect(mockEnv.cerebras.getCallCount()).toBe(1);
      
      mockEnv.resetAllMocks();
      
      expect(mockEnv.groq.getCallCount()).toBe(0);
      expect(mockEnv.cerebras.getCallCount()).toBe(0);
    });
  });
});
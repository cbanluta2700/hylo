/**
 * Unit Tests for Agent Prompt Engineering
 * Comprehensive test coverage for prompt generation, interpolation, validation, and response parsing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AgentPromptsRegistry,
  agentPromptsRegistry,
  interpolatePrompt,
  validatePromptVariables,
  estimateTokenCount,
} from '../../src/lib/agent-prompts';
import { performanceMonitor } from '../../src/lib/monitoring/performance';

// Mock performance monitor
vi.mock('../../src/lib/monitoring/performance', () => ({
  performanceMonitor: {
    startOperation: vi.fn().mockReturnValue('test-metric-id'),
    endOperation: vi.fn(),
    recordOperation: vi.fn(),
  },
}));

describe('Agent Prompt Engineering', () => {
  let registry: AgentPromptsRegistry;

  beforeEach(() => {
    vi.clearAllMocks();
    registry = new AgentPromptsRegistry();
  });

  describe('AgentPromptsRegistry', () => {
    it('should initialize with all agent types', () => {
      const agentTypes = [
        'itinerary-architect',
        'web-gatherer',
        'information-specialist',
        'form-putter',
      ] as const;

      agentTypes.forEach((agentType) => {
        const prompt = registry.getPrompt(agentType);
        expect(prompt).toBeDefined();
        expect(prompt.systemPrompt).toBeDefined();
        expect(prompt.userPromptTemplate).toBeDefined();
        expect(prompt.responseFormat).toBeDefined();
        expect(prompt.validationRules).toBeInstanceOf(Array);
        expect(prompt.parsingInstructions).toBeDefined();
      });
    });

    it('should throw error for unknown agent type', () => {
      expect(() => {
        registry.getPrompt('unknown-agent' as any);
      }).toThrow('No prompt found for agent type: unknown-agent');
    });

    it('should return consistent prompts for same agent type', () => {
      const prompt1 = registry.getPrompt('itinerary-architect');
      const prompt2 = registry.getPrompt('itinerary-architect');

      expect(prompt1).toEqual(prompt2);
      expect(prompt1.systemPrompt).toBe(prompt2.systemPrompt);
      expect(prompt1.userPromptTemplate).toBe(prompt2.userPromptTemplate);
    });
  });

  describe('Prompt Interpolation', () => {
    it('should interpolate simple variables', () => {
      const template = 'Hello {{name}}, welcome to {{location}}!';
      const variables = { name: 'John', location: 'Paris' };

      const result = interpolatePrompt(template, variables);

      expect(result).toBe('Hello John, welcome to Paris!');
    });

    it('should handle missing variables gracefully', () => {
      const template = 'Hello {{name}}, welcome to {{location}}!';
      const variables = { name: 'John' }; // missing location

      const result = interpolatePrompt(template, variables);

      expect(result).toBe('Hello John, welcome to {{location}}!');
    });

    it('should interpolate complex variables', () => {
      const template =
        'Plan a {{duration}}-day trip for {{adults}} adults and {{children}} children to {{destination}} with interests in {{interests}}.';
      const variables = {
        duration: 7,
        adults: 2,
        children: 1,
        destination: 'Tokyo, Japan',
        interests: 'culture, food, technology',
      };

      const result = interpolatePrompt(template, variables);

      expect(result).toBe(
        'Plan a 7-day trip for 2 adults and 1 children to Tokyo, Japan with interests in culture, food, technology.'
      );
    });

    it('should handle array variables', () => {
      const template = 'Interests: {{interests}}';
      const variables = {
        interests: ['sightseeing', 'museums', 'food'],
      };

      const result = interpolatePrompt(template, variables);

      expect(result).toBe('Interests: sightseeing,museums,food');
    });

    it('should handle nested object variables', () => {
      const template =
        'Budget: {{budget.total}} {{budget.currency}} per {{budget.perPerson ? "person" : "total"}}';
      const variables = {
        budget: {
          total: 5000,
          currency: 'USD',
          perPerson: false,
        },
      };

      const result = interpolatePrompt(template, variables);

      expect(result).toBe('Budget: 5000 USD per total');
    });

    it('should escape special characters in variable values', () => {
      const template = 'Search for: {{query}}';
      const variables = {
        query: 'restaurants with "special" menus & offers',
      };

      const result = interpolatePrompt(template, variables);

      expect(result).toBe('Search for: restaurants with "special" menus & offers');
    });
  });

  describe('Variable Validation', () => {
    it('should return errors for missing variables', () => {
      const template = 'Hello {{name}}, welcome to {{location}}!';
      const variables = {}; // missing both variables

      const errors = validatePromptVariables(template, variables);

      expect(errors).toHaveLength(2);
      expect(errors).toContain('Missing variable: name');
      expect(errors).toContain('Missing variable: location');
    });

    it('should return empty array when all variables are present', () => {
      const template = 'Hello {{name}}, welcome to {{location}}!';
      const variables = { name: 'John', location: 'Paris' };

      const errors = validatePromptVariables(template, variables);

      expect(errors).toHaveLength(0);
    });

    it('should handle optional variables', () => {
      const template = 'Hello {{name}}, welcome to {{location}}! {{note}}';
      const variables = { name: 'John', location: 'Paris' }; // note is optional

      const errors = validatePromptVariables(template, variables);

      expect(errors).toHaveLength(0); // note is not required
    });

    it('should handle templates without variables', () => {
      const template = 'Hello world, this is a static message!';
      const variables = {};

      const errors = validatePromptVariables(template, variables);

      expect(errors).toHaveLength(0);
    });

    it('should handle duplicate variable names', () => {
      const template = 'Hello {{name}}, {{name}} again!';
      const variables = { name: 'John' };

      const errors = validatePromptVariables(template, variables);

      expect(errors).toHaveLength(0); // Should not report duplicates as errors
    });

    it('should handle malformed variable syntax', () => {
      const template = 'Hello {name}, welcome to {{location!';
      const variables = { name: 'John', location: 'Paris' };

      const errors = validatePromptVariables(template, variables);

      expect(errors).toHaveLength(1);
      expect(errors).toContain('Missing variable: location');
      // {name} is not recognized as a variable
    });
  });

  describe('Token Estimation', () => {
    it('should estimate tokens for simple text', () => {
      const text = 'Hello world';
      const tokens = estimateTokenCount(text);

      expect(tokens).toBeGreaterThan(0);
      expect(typeof tokens).toBe('number');
    });

    it('should estimate more tokens for longer text', () => {
      const shortText = 'Hello';
      const longText =
        'This is a much longer piece of text that should require more tokens to process.';

      const shortTokens = estimateTokenCount(shortText);
      const longTokens = estimateTokenCount(longText);

      expect(longTokens).toBeGreaterThan(shortTokens);
    });

    it('should handle empty strings', () => {
      const tokens = estimateTokenCount('');

      expect(tokens).toBe(0);
    });

    it('should handle special characters', () => {
      const text = 'Hello 🌍 with émojis and spëcial chärs!';
      const tokens = estimateTokenCount(text);

      expect(tokens).toBeGreaterThan(0);
    });

    it('should estimate tokens proportionally to text length', () => {
      const text1 = 'a';
      const text2 = 'a b c d e f g h i j k l m n o p q r s t u v w x y z';

      const tokens1 = estimateTokenCount(text1);
      const tokens2 = estimateTokenCount(text2);

      // Should be roughly proportional (allowing for tokenization overhead)
      expect(tokens2).toBeGreaterThan(tokens1);
      expect(tokens2 / tokens1).toBeLessThan(10); // Reasonable upper bound
    });
  });

  describe('Response Parsing', () => {
    it('should parse valid architect responses', () => {
      const mockResponse = JSON.stringify({
        itinerary: {
          title: 'Paris Adventure',
          days: [
            {
              day: 1,
              activities: ['Visit Eiffel Tower', 'Seine River cruise'],
              meals: ['Lunch at local bistro'],
            },
          ],
        },
        metadata: {
          totalCost: 2500,
          difficulty: 'easy',
        },
      });

      const result = registry.parseResponse('itinerary-architect', mockResponse);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.validationErrors).toHaveLength(0);
      expect(result.metadata.agentType).toBe('itinerary-architect');
      expect(result.metadata.parsingTime).toBeGreaterThan(0);
    });

    it('should handle invalid JSON responses', () => {
      const invalidResponse = 'This is not JSON at all!';

      const result = registry.parseResponse('web-gatherer', invalidResponse);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.confidence).toBe(0);
      expect(result.validationErrors).toHaveLength(1);
      expect(result.validationErrors[0]).toContain('parsing');
    });

    it('should validate parsed data against rules', () => {
      const invalidItinerary = JSON.stringify({
        itinerary: {
          // Missing required title
          days: [],
        },
        metadata: {},
      });

      const result = registry.parseResponse('itinerary-architect', invalidItinerary);

      expect(result.success).toBe(false);
      expect(result.validationErrors.length).toBeGreaterThan(0);
    });

    it('should calculate confidence based on validation', () => {
      const completeResponse = JSON.stringify({
        itinerary: {
          title: 'Complete Trip',
          days: [
            {
              day: 1,
              activities: ['Activity 1', 'Activity 2'],
              meals: ['Breakfast', 'Lunch', 'Dinner'],
            },
          ],
        },
        metadata: {
          totalCost: 1500,
          difficulty: 'medium',
        },
      });

      const incompleteResponse = JSON.stringify({
        itinerary: {
          title: 'Incomplete Trip',
          days: [],
        },
      });

      const completeResult = registry.parseResponse('itinerary-architect', completeResponse);
      const incompleteResult = registry.parseResponse('itinerary-architect', incompleteResponse);

      expect(completeResult.confidence).toBeGreaterThan(incompleteResult.confidence);
    });

    it('should parse gatherer responses with search results', () => {
      const gathererResponse = JSON.stringify({
        results: [
          {
            title: 'Eiffel Tower',
            description: 'Iconic landmark in Paris',
            url: 'https://example.com/eiffel',
            relevanceScore: 0.95,
          },
        ],
        totalFound: 1,
        searchQuery: 'Paris landmarks',
      });

      const result = registry.parseResponse('web-gatherer', gathererResponse);

      expect(result.success).toBe(true);
      expect(result.data.results).toBeDefined();
      expect(result.data.results).toHaveLength(1);
    });

    it('should handle specialist analysis responses', () => {
      const specialistResponse = JSON.stringify({
        analysis: {
          destination: 'Paris',
          bestTimeToVisit: 'Spring or Fall',
          crowdLevel: 'High',
          budget: 'Medium-High',
          highlights: ['Eiffel Tower', 'Louvre', 'Notre Dame'],
        },
        recommendations: ['Book tickets in advance', 'Use public transport'],
        confidence: 0.88,
      });

      const result = registry.parseResponse('information-specialist', specialistResponse);

      expect(result.success).toBe(true);
      expect(result.data.analysis).toBeDefined();
      expect(result.data.recommendations).toHaveLength(2);
    });

    it('should parse putter form generation responses', () => {
      const putterResponse = JSON.stringify({
        formData: {
          destination: 'Paris, France',
          duration: { days: 7, nights: 6 },
          travelers: { adults: 2, children: 0 },
          budget: { total: 3000, currency: 'USD' },
          preferences: {
            accommodation: '4-star hotel',
            transportation: 'public transport',
          },
        },
        validation: {
          isComplete: true,
          missingFields: [],
          suggestions: [],
        },
      });

      const result = registry.parseResponse('form-putter', putterResponse);

      expect(result.success).toBe(true);
      expect(result.data.formData).toBeDefined();
      expect(result.data.validation.isComplete).toBe(true);
    });
  });

  describe('Performance and Monitoring', () => {
    it('should track parsing performance', () => {
      const response = JSON.stringify({ test: 'data' });

      registry.parseResponse('itinerary-architect', response);

      expect(performanceMonitor.recordOperation).toHaveBeenCalledWith(
        expect.stringContaining('parse_response'),
        expect.any(String),
        expect.any(Number),
        true,
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle parsing errors gracefully', () => {
      const malformedResponse = '{ invalid json: }';

      expect(() => {
        registry.parseResponse('web-gatherer', malformedResponse);
      }).not.toThrow();

      const result = registry.parseResponse('web-gatherer', malformedResponse);
      expect(result.success).toBe(false);
      expect(result.validationErrors.length).toBeGreaterThan(0);
    });

    it('should measure parsing time accurately', () => {
      const response = JSON.stringify({
        itinerary: {
          title: 'Test Trip',
          days: [{ day: 1, activities: ['Test activity'] }],
        },
        metadata: { totalCost: 1000 },
      });

      const result = registry.parseResponse('itinerary-architect', response);

      expect(result.metadata.parsingTime).toBeGreaterThanOrEqual(0);
      expect(typeof result.metadata.parsingTime).toBe('number');
    });
  });

  describe('Global Registry Instance', () => {
    it('should provide a global registry instance', () => {
      expect(agentPromptsRegistry).toBeDefined();
      expect(agentPromptsRegistry).toBeInstanceOf(AgentPromptsRegistry);
    });

    it('should be ready to use immediately', () => {
      const prompt = agentPromptsRegistry.getPrompt('itinerary-architect');
      expect(prompt).toBeDefined();
      expect(prompt.systemPrompt).toBeDefined();
    });

    it('should be a singleton instance', () => {
      // This is harder to test directly, but we can verify it works consistently
      const prompt1 = agentPromptsRegistry.getPrompt('web-gatherer');
      const prompt2 = agentPromptsRegistry.getPrompt('web-gatherer');

      expect(prompt1).toEqual(prompt2);
    });
  });

  describe('Error Handling', () => {
    it('should handle null/undefined responses', () => {
      const result = registry.parseResponse('information-specialist', '');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.validationErrors.length).toBeGreaterThan(0);
    });

    it('should handle extremely large responses', () => {
      const largeResponse = JSON.stringify({
        data: 'x'.repeat(10000), // 10KB of data
      });

      expect(() => {
        registry.parseResponse('form-putter', largeResponse);
      }).not.toThrow();
    });

    it('should handle responses with unexpected structure', () => {
      const unexpectedResponse = JSON.stringify({
        completely: 'unexpected',
        structure: [1, 2, 3],
        with: { nested: { objects: true } },
      });

      const result = registry.parseResponse('itinerary-architect', unexpectedResponse);

      // Should not crash, but likely fail validation
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should provide meaningful error messages', () => {
      const invalidResponse = JSON.stringify({});

      const result = registry.parseResponse('itinerary-architect', invalidResponse);

      expect(result.success).toBe(false);
      result.validationErrors.forEach((error) => {
        expect(error).toBeDefined();
        expect(typeof error).toBe('string');
        expect(error.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Integration and Compatibility', () => {
    it('should work with all agent types', () => {
      const agentTypes = [
        'itinerary-architect',
        'web-gatherer',
        'information-specialist',
        'form-putter',
      ] as const;

      agentTypes.forEach((agentType) => {
        const prompt = registry.getPrompt(agentType);
        expect(prompt).toBeDefined();

        // Test with minimal valid response for each type
        const minimalResponse = JSON.stringify(
          agentType === 'itinerary-architect'
            ? {
                itinerary: { title: 'Test', days: [] },
                metadata: {},
              }
            : agentType === 'web-gatherer'
            ? {
                results: [],
                totalFound: 0,
              }
            : agentType === 'information-specialist'
            ? {
                analysis: {},
                recommendations: [],
              }
            : {
                // form-putter
                formData: {},
                validation: { isComplete: false, missingFields: [] },
              }
        );

        const result = registry.parseResponse(agentType, minimalResponse);
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
      });
    });

    it('should maintain backward compatibility', () => {
      // Test that existing functionality still works
      const prompt = registry.getPrompt('itinerary-architect');
      expect(prompt.systemPrompt).toContain('itinerary');
      expect(prompt.userPromptTemplate).toContain('{{');
    });

    it('should handle version compatibility', () => {
      const response = JSON.stringify({
        itinerary: { title: 'Test' },
        metadata: {},
        version: '0.9.0', // Older version
      });

      const result = registry.parseResponse('itinerary-architect', response);

      expect(result.metadata.formatVersion).toBe('1.0.0'); // Current version
      expect(result).toBeDefined(); // Should still work
    });
  });
});

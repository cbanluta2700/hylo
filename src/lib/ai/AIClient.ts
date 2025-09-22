/**
 * AI Provider Client (T021)
 *
 * CONSTITUTIONAL COMPLIANCE:
 * - Principle I: Edge Runtime compatible (HTTP-based AI providers)
 * - Principle V: Type-safe development with strict interfaces
 *
 * Centralized AI provider interface supporting X.AI (Grok) and Groq for 4-agent system
 */

import { config } from '../config/env';

/**
 * Unified AI Response Interface
 * Constitutional requirement: Type-safe development
 */
export interface AIResponse {
  content: string;
  model: string;
  usage?:
    | {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
      }
    | undefined; // Explicit undefined for strict mode
  finishReason: 'stop' | 'length' | 'error';
  processingTime: number;
}

/**
 * AI Request Configuration
 */
export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

/**
 * AI Provider Abstract Base Class
 * Constitutional requirement: Component composition pattern
 */
abstract class AIProvider {
  abstract name: string;
  abstract models: string[];

  abstract chat(request: AIRequest): Promise<AIResponse>;

  protected handleError(error: any, provider: string): never {
    console.error(`${provider} AI error:`, error);
    throw new Error(`${provider} AI service unavailable: ${error.message || 'Unknown error'}`);
  }
}

/**
 * X.AI (Grok) Provider Implementation
 * Primary reasoning model for complex analysis tasks
 */
class XAIProvider extends AIProvider {
  name = 'X.AI';
  models = ['grok-4-fast-reasoning', 'grok-3'];

  private readonly apiKey = config.ai.xai.apiKey;
  private readonly baseUrl = 'https://api.x.ai/v1/chat/completions';

  async chat(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const payload = {
        model: request.model || config.ai.xai.model,
        messages: [
          ...(request.systemPrompt
            ? [
                {
                  role: 'system' as const,
                  content: request.systemPrompt,
                },
              ]
            : []),
          {
            role: 'user' as const,
            content: request.prompt,
          },
        ],
        max_tokens: request.maxTokens || 4000,
        temperature: request.temperature || 0.7,
        stream: false, // Edge Runtime compatibility
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        content: data.choices[0]?.message?.content || '',
        model: data.model || payload.model,
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens || 0,
              completionTokens: data.usage.completion_tokens || 0,
              totalTokens: data.usage.total_tokens || 0,
            }
          : undefined,
        finishReason: data.choices[0]?.finish_reason === 'stop' ? 'stop' : 'length',
        processingTime,
      };
    } catch (error) {
      this.handleError(error, 'X.AI');
    }
  }
}

/**
 * Groq Provider Implementation
 * High-speed processing for rapid iteration tasks
 */
class GroqProvider extends AIProvider {
  name = 'Groq';
  models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

  private readonly apiKey = config.ai.groq.apiKey;
  private readonly baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  async chat(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const payload = {
        model: request.model || 'llama-3.3-70b-versatile',
        messages: [
          ...(request.systemPrompt
            ? [
                {
                  role: 'system' as const,
                  content: request.systemPrompt,
                },
              ]
            : []),
          {
            role: 'user' as const,
            content: request.prompt,
          },
        ],
        max_tokens: request.maxTokens || 4000,
        temperature: request.temperature || 0.7,
        stream: false, // Edge Runtime compatibility
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        content: data.choices[0]?.message?.content || '',
        model: data.model || payload.model,
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens || 0,
              completionTokens: data.usage.completion_tokens || 0,
              totalTokens: data.usage.total_tokens || 0,
            }
          : undefined,
        finishReason: data.choices[0]?.finish_reason === 'stop' ? 'stop' : 'length',
        processingTime,
      };
    } catch (error) {
      this.handleError(error, 'Groq');
    }
  }
}

/**
 * AI Client with Provider Fallback
 * Constitutional requirement: Edge Runtime resilience
 */
export class AIClient {
  private providers: AIProvider[];

  constructor() {
    this.providers = [
      new XAIProvider(), // Primary provider
      new GroqProvider(), // Fallback provider
    ];
  }

  /**
   * Make AI request with automatic provider fallback
   * Prioritizes X.AI for reasoning, falls back to Groq for speed
   */
  async chat(request: AIRequest, preferredProvider?: 'xai' | 'groq'): Promise<AIResponse> {
    // Determine provider order based on preference
    let orderedProviders = [...this.providers];

    if (preferredProvider === 'groq') {
      orderedProviders = orderedProviders.reverse();
    }

    let lastError: Error | null = null;

    for (const provider of orderedProviders) {
      try {
        console.log(`Attempting AI request with ${provider.name}...`);
        const response = await provider.chat(request);
        console.log(`✓ ${provider.name} responded in ${response.processingTime}ms`);
        return response;
      } catch (error) {
        console.warn(`✗ ${provider.name} failed:`, error);
        lastError = error as Error;
        continue;
      }
    }

    // If all providers failed
    throw new Error(
      `All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Get provider capabilities for routing decisions
   */
  getProviders(): Array<{ name: string; models: string[] }> {
    return this.providers.map((p) => ({
      name: p.name,
      models: p.models,
    }));
  }

  /**
   * Health check for all providers
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};

    const testRequest: AIRequest = {
      prompt: 'Respond with just "OK"',
      maxTokens: 10,
      temperature: 0,
    };

    for (const provider of this.providers) {
      try {
        await provider.chat(testRequest);
        health[provider.name] = true;
      } catch {
        health[provider.name] = false;
      }
    }

    return health;
  }
}

/**
 * Global AI client instance
 * Constitutional requirement: Edge Runtime singleton pattern
 */
export const aiClient = new AIClient();

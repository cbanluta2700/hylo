/**
 * Comprehensive LLM Provider Manager with Fallback Chains
 * Implements robust provider selection, fallback mechanisms, and retry logic
 * Based on Context7 LangChain fallback patterns and reliability best practices
 */

import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";

export interface LLMProvider {
  name: string;
  model: BaseChatModel;
  priority: number;
  maxTokens: number;
  costPerToken: number;
  timeout: number;
  available: boolean;
  lastChecked?: Date;
  errorCount: number;
  successCount: number;
}

export interface LLMRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  structuredOutput?: z.ZodSchema<any>;
  timeout?: number;
  retries?: number;
  fallbackToAll?: boolean;
}

export interface LLMResponse {
  content: string;
  provider: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  latency: number;
  metadata: {
    model: string;
    temperature: number;
    timestamp: string;
    attempt: number;
    fallbacksUsed: string[];
  };
}

export class LLMProviderManager {
  private providers: Map<string, LLMProvider> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isHealthCheckRunning = false;

  constructor() {
    this.initializeProviders();
    this.startHealthChecks();
  }

  /**
   * Initialize all available LLM providers with fallback hierarchy
   */
  private initializeProviders(): void {
    // Primary Provider: Groq (fastest, most cost-effective)
    if (process.env['GROQ_API_KEY']) {
      const groqProvider: LLMProvider = {
        name: 'groq',
        model: new ChatGroq({
          apiKey: process.env['GROQ_API_KEY'],
          model: "llama-3.1-70b-versatile",
          temperature: 0.2,
          maxTokens: 4000,
          timeout: 30000, // 30 seconds
        }),
        priority: 1,
        maxTokens: 8000,
        costPerToken: 0.00000059, // Groq pricing
        timeout: 30000,
        available: true,
        errorCount: 0,
        successCount: 0
      };
      this.providers.set('groq', groqProvider);
    }

    // Secondary Provider: Google Gemini (good balance of speed/quality)
    if (process.env['GOOGLE_API_KEY']) {
      const geminiProvider: LLMProvider = {
        name: 'gemini',
        model: new ChatGoogleGenerativeAI({
          apiKey: process.env['GOOGLE_API_KEY'],
          model: "gemini-1.5-flash",
          temperature: 0.2,
          maxOutputTokens: 8000,
        }),
        priority: 2,
        maxTokens: 32000,
        costPerToken: 0.000001, // Gemini pricing
        timeout: 45000,
        available: true,
        errorCount: 0,
        successCount: 0
      };
      this.providers.set('gemini', geminiProvider);
    }

    // Tertiary Provider: OpenAI (highest quality, most expensive)
    if (process.env['OPENAI_API_KEY']) {
      const openaiProvider: LLMProvider = {
        name: 'openai',
        model: new ChatOpenAI({
          apiKey: process.env['OPENAI_API_KEY'],
          model: "gpt-4o-mini",
          temperature: 0.2,
          maxTokens: 4000,
          timeout: 60000,
        }),
        priority: 3,
        maxTokens: 128000,
        costPerToken: 0.00000015, // GPT-4o-mini pricing
        timeout: 60000,
        available: true,
        errorCount: 0,
        successCount: 0
      };
      this.providers.set('openai', openaiProvider);
    }

    console.log(`LLM Provider Manager initialized with ${this.providers.size} providers`);
  }

  /**
   * Get the best available provider based on priority and health
   */
  private getBestProvider(maxTokens?: number): LLMProvider | null {
    const availableProviders = Array.from(this.providers.values())
      .filter(provider => provider.available)
      .filter(provider => !maxTokens || provider.maxTokens >= maxTokens)
      .sort((a, b) => {
        // Sort by priority first, then by success rate
        const priorityDiff = a.priority - b.priority;
        if (priorityDiff !== 0) return priorityDiff;
        
        const aSuccessRate = a.successCount / Math.max(a.successCount + a.errorCount, 1);
        const bSuccessRate = b.successCount / Math.max(b.successCount + b.errorCount, 1);
        return bSuccessRate - aSuccessRate;
      });

    return availableProviders[0] || null;
  }

  /**
   * Get fallback provider chain
   */
  private getFallbackChain(excludeProvider?: string, maxTokens?: number): LLMProvider[] {
    return Array.from(this.providers.values())
      .filter(provider => provider.available)
      .filter(provider => provider.name !== excludeProvider)
      .filter(provider => !maxTokens || provider.maxTokens >= maxTokens)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Execute LLM request with comprehensive fallback strategy
   */
  public async execute(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    const fallbacksUsed: string[] = [];
    let lastError: Error | null = null;

    // Get primary provider
    const primaryProvider = this.getBestProvider(request.maxTokens);
    if (!primaryProvider) {
      throw new Error('No available LLM providers');
    }

    // Build fallback chain
    const fallbackProviders = request.fallbackToAll 
      ? this.getFallbackChain(undefined, request.maxTokens)
      : [primaryProvider];

    // Try each provider in sequence
    for (let attempt = 0; attempt < fallbackProviders.length; attempt++) {
      const provider = fallbackProviders[attempt];
      
      try {
        const response = await this.executeWithProvider(
          provider, 
          request, 
          attempt + 1,
          fallbacksUsed
        );
        
        // Update success metrics
        provider.successCount++;
        
        return {
          ...response,
          latency: Date.now() - startTime,
          metadata: {
            ...response.metadata,
            attempt: attempt + 1,
            fallbacksUsed
          }
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        provider.errorCount++;
        fallbacksUsed.push(provider.name);
        
        // Mark provider as unavailable if too many consecutive errors
        if (provider.errorCount > 5 && provider.successCount === 0) {
          provider.available = false;
          console.warn(`Provider ${provider.name} marked as unavailable due to repeated failures`);
        }
        
        // If not the last provider, continue to fallback
        if (attempt < fallbackProviders.length - 1) {
          console.warn(`Provider ${provider.name} failed, trying fallback: ${lastError.message}`);
          continue;
        }
      }
    }

    // All providers failed
    throw new Error(`All LLM providers failed. Last error: ${lastError?.message || 'Unknown'}`);
  }

  /**
   * Execute request with a specific provider
   */
  private async executeWithProvider(
    provider: LLMProvider,
    request: LLMRequest,
    attempt: number,
    fallbacksUsed: string[]
  ): Promise<Omit<LLMResponse, 'latency'>> {
    const startTime = Date.now();

    try {
      // Configure model for this request
      const configuredModel = this.configureModel(provider, request);
      
      let response;
      let inputTokens = Math.ceil(request.prompt.length / 4); // Rough estimate
      
      if (request.structuredOutput) {
        // Use structured output
        const structuredLLM = configuredModel.withStructuredOutput(request.structuredOutput);
        response = await Promise.race([
          structuredLLM.invoke([new HumanMessage(request.prompt)]),
          this.createTimeoutPromise(request.timeout || provider.timeout)
        ]);
      } else {
        // Regular text output
        response = await Promise.race([
          configuredModel.invoke([new HumanMessage(request.prompt)]),
          this.createTimeoutPromise(request.timeout || provider.timeout)
        ]);
      }

      const content = typeof response === 'string' ? response : response.content || JSON.stringify(response);
      const outputTokens = Math.ceil(content.length / 4); // Rough estimate
      const totalTokens = inputTokens + outputTokens;

      return {
        content,
        provider: provider.name,
        tokens: {
          input: inputTokens,
          output: outputTokens,
          total: totalTokens
        },
        cost: totalTokens * provider.costPerToken,
        metadata: {
          model: this.getModelName(provider),
          temperature: request.temperature || 0.2,
          timestamp: new Date().toISOString(),
          attempt,
          fallbacksUsed: [...fallbacksUsed]
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      throw new Error(`Provider ${provider.name} failed after ${duration}ms: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Configure model with request-specific parameters
   */
  private configureModel(provider: LLMProvider, request: LLMRequest): BaseChatModel {
    const baseModel = provider.model;
    
    // Create a new instance with updated parameters if needed
    if (request.temperature !== undefined || request.maxTokens !== undefined) {
      if (provider.name === 'groq') {
        return new ChatGroq({
          apiKey: process.env['GROQ_API_KEY'],
          model: "llama-3.1-70b-versatile",
          temperature: request.temperature ?? 0.2,
          maxTokens: Math.min(request.maxTokens ?? 4000, provider.maxTokens),
          timeout: request.timeout || provider.timeout,
        });
      } else if (provider.name === 'gemini') {
        return new ChatGoogleGenerativeAI({
          apiKey: process.env['GOOGLE_API_KEY'],
          model: "gemini-1.5-flash",
          temperature: request.temperature ?? 0.2,
          maxOutputTokens: Math.min(request.maxTokens ?? 8000, provider.maxTokens),
        });
      } else if (provider.name === 'openai') {
        return new ChatOpenAI({
          apiKey: process.env['OPENAI_API_KEY'],
          model: "gpt-4o-mini",
          temperature: request.temperature ?? 0.2,
          maxTokens: Math.min(request.maxTokens ?? 4000, provider.maxTokens),
          timeout: request.timeout || provider.timeout,
        });
      }
    }

    return baseModel;
  }

  /**
   * Create timeout promise for race conditions
   */
  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);
    });
  }

  /**
   * Get model name from provider
   */
  private getModelName(provider: LLMProvider): string {
    switch (provider.name) {
      case 'groq': return 'llama-3.1-70b-versatile';
      case 'gemini': return 'gemini-1.5-flash';
      case 'openai': return 'gpt-4o-mini';
      default: return 'unknown';
    }
  }

  /**
   * Start health checks for all providers
   */
  private startHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      if (this.isHealthCheckRunning) return;
      
      this.isHealthCheckRunning = true;
      await this.performHealthChecks();
      this.isHealthCheckRunning = false;
    }, 60000); // Check every minute
  }

  /**
   * Perform health checks on all providers
   */
  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises = Array.from(this.providers.values()).map(async (provider) => {
      try {
        const testRequest: LLMRequest = {
          prompt: "Respond with 'OK' if you can receive this message.",
          maxTokens: 10,
          temperature: 0,
          timeout: 10000 // 10 second timeout for health checks
        };

        await this.executeWithProvider(provider, testRequest, 1, []);
        
        if (!provider.available) {
          provider.available = true;
          console.log(`Provider ${provider.name} is now available`);
        }
        
        provider.lastChecked = new Date();

      } catch (error) {
        console.warn(`Health check failed for ${provider.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Don't immediately mark as unavailable due to health check failure
        // Let actual usage errors accumulate first
      }
    });

    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * Get provider statistics
   */
  public getProviderStats(): { [key: string]: any } {
    const stats: { [key: string]: any } = {};
    
    for (const [name, provider] of this.providers.entries()) {
      const total = provider.successCount + provider.errorCount;
      stats[name] = {
        available: provider.available,
        priority: provider.priority,
        successCount: provider.successCount,
        errorCount: provider.errorCount,
        successRate: total > 0 ? (provider.successCount / total) : 0,
        lastChecked: provider.lastChecked,
        maxTokens: provider.maxTokens,
        costPerToken: provider.costPerToken,
        timeout: provider.timeout
      };
    }
    
    return stats;
  }

  /**
   * Reset provider statistics
   */
  public resetStats(): void {
    for (const provider of this.providers.values()) {
      provider.successCount = 0;
      provider.errorCount = 0;
      provider.available = true;
    }
  }

  /**
   * Manually set provider availability
   */
  public setProviderAvailability(providerName: string, available: boolean): void {
    const provider = this.providers.get(providerName);
    if (provider) {
      provider.available = available;
      console.log(`Provider ${providerName} availability set to: ${available}`);
    }
  }

  /**
   * Get list of available providers
   */
  public getAvailableProviders(): string[] {
    return Array.from(this.providers.values())
      .filter(provider => provider.available)
      .sort((a, b) => a.priority - b.priority)
      .map(provider => provider.name);
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    console.log('LLM Provider Manager cleaned up');
  }
}

// Singleton instance for global use
let providerManagerInstance: LLMProviderManager | null = null;

export function getLLMProviderManager(): LLMProviderManager {
  if (!providerManagerInstance) {
    providerManagerInstance = new LLMProviderManager();
  }
  return providerManagerInstance;
}

// Cleanup function for graceful shutdown
export function cleanupLLMProviderManager(): void {
  if (providerManagerInstance) {
    providerManagerInstance.cleanup();
    providerManagerInstance = null;
  }
}
/**
 * AI Provider Client Setup
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility (no Node.js built-ins)
 * - Type-safe development with strict TypeScript
 * - Multi-LLM provider approach for resilience
 *
 * Task: T021 - Create AI provider client setup
 */
/**
 * AI Provider configuration interface
 */
export interface AIProviderConfig {
    apiKey: string;
    model: string;
    maxTokens?: number;
    temperature?: number;
    timeout?: number;
}
/**
 * AI Provider client interface for type safety
 */
export interface AIProviderClient {
    provider: 'xai' | 'groq' | 'gpt-oss';
    model: string;
    client: any;
    isAvailable: boolean;
}
/**
 * AI Providers Manager
 * Manages multiple LLM providers with failover support
 */
export declare class AIProvidersManager {
    private providers;
    private initialized;
    constructor();
    /**
     * Initialize all AI provider clients
     * Edge Runtime compatible initialization
     */
    private initialize;
    /**
     * Get client for specific provider
     */
    getProvider(provider: 'xai' | 'groq' | 'gpt-oss'): AIProviderClient | null;
    /**
     * Get client for specific agent type
     * Maps agents to optimal LLM providers
     */
    getClientForAgent(agentType: 'architect' | 'gatherer' | 'specialist' | 'formatter'): AIProviderClient | null;
    /**
     * Check if providers are ready
     */
    isReady(): boolean;
    /**
     * Get available providers list
     */
    getAvailableProviders(): string[];
    /**
     * Health check for all providers
     */
    healthCheck(): Promise<Record<string, boolean>>;
    /**
     * Retry logic for failed AI requests
     * Constitutional requirement: graceful error handling
     */
    withRetry<T>(operation: () => Promise<T>, maxRetries?: number, delay?: number): Promise<T>;
}
/**
 * Singleton instance for AI providers
 * Edge Runtime compatible
 */
export declare const aiProviders: AIProvidersManager;
/**
 * Environment validation for AI providers
 * Ensures required API keys are configured
 */
export declare const validateAIProviders: () => boolean;

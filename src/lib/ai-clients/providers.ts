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

import { createXai } from '@ai-sdk/xai';
import { createGroq } from '@ai-sdk/groq';

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
  client: any; // Will be typed according to each provider's SDK
  isAvailable: boolean;
}

/**
 * XAI Grok client setup
 * Used for: Itinerary Architect and Information Specialist agents
 */
const createXaiClient = (): AIProviderClient | null => {
  const apiKey = process.env['XAI_API_KEY'];

  if (!apiKey) {
    console.warn('[AI Provider] XAI API key not configured');
    return null;
  }

  try {
    const xai = createXai({
      apiKey,
      // Configure for Edge Runtime
      baseURL: 'https://api.x.ai/v1',
    });

    return {
      provider: 'xai',
      model: 'grok-beta', // XAI Grok-4-Fast-Reasoning equivalent
      client: xai,
      isAvailable: true,
    };
  } catch (error) {
    console.error('[AI Provider] Failed to initialize XAI client:', error);
    return {
      provider: 'xai',
      model: 'grok-beta',
      client: null,
      isAvailable: false,
    };
  }
};

/**
 * Groq client setup
 * Used for: Web Information Gatherer agent (high-speed processing)
 */
const createGroqClient = (): AIProviderClient | null => {
  const apiKey = process.env['GROQ_API_KEY'];

  if (!apiKey) {
    console.warn('[AI Provider] Groq API key not configured');
    return null;
  }

  try {
    const groq = createGroq({
      apiKey,
      // Configure for Edge Runtime compatibility
      baseURL: 'https://api.groq.com/openai/v1',
    });

    return {
      provider: 'groq',
      model: 'llama3-70b-8192', // Groq Compound equivalent for fast processing
      client: groq,
      isAvailable: true,
    };
  } catch (error) {
    console.error('[AI Provider] Failed to initialize Groq client:', error);
    return {
      provider: 'groq',
      model: 'llama3-70b-8192',
      client: null,
      isAvailable: false,
    };
  }
};

/**
 * GPT-OSS client setup (placeholder)
 * Used for: Form Putter agent (formatting and final output)
 *
 * Note: This would connect to an open-source GPT endpoint
 * For now, we'll use Groq as fallback until GPT-OSS endpoint is configured
 */
const createGptOssClient = (): AIProviderClient | null => {
  const endpoint = process.env['GPT_OSS_ENDPOINT'];
  const apiKey = process.env['GPT_OSS_API_KEY'];

  if (!endpoint || !apiKey) {
    console.warn('[AI Provider] GPT-OSS endpoint not configured, using Groq fallback');
    return createGroqClient(); // Fallback to Groq
  }

  // TODO: Implement GPT-OSS client when endpoint is available
  console.log('[AI Provider] GPT-OSS client configuration pending');
  return createGroqClient(); // Fallback to Groq for now
};

/**
 * AI Providers Manager
 * Manages multiple LLM providers with failover support
 */
export class AIProvidersManager {
  private providers: Map<string, AIProviderClient> = new Map();
  private initialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize all AI provider clients
   * Edge Runtime compatible initialization
   */
  private initialize(): void {
    console.log('🤖 [50] AI Providers: Starting initialization of all providers');

    try {
      // Initialize XAI Grok client
      console.log('🔧 [51] AI Providers: Initializing XAI Grok client');
      const xaiClient = createXaiClient();
      if (xaiClient) {
        this.providers.set('xai', xaiClient);
        console.log('✅ [52] AI Providers: XAI Grok client initialized');
      } else {
        console.log('⚠️ [53] AI Providers: XAI Grok client not available (missing API key)');
      }

      // Initialize Groq client
      console.log('🔧 [54] AI Providers: Initializing Groq client');
      const groqClient = createGroqClient();
      if (groqClient) {
        this.providers.set('groq', groqClient);
        console.log('✅ [55] AI Providers: Groq client initialized');
      } else {
        console.log('⚠️ [56] AI Providers: Groq client not available (missing API key)');
      }

      // Initialize GPT-OSS client (or fallback)
      console.log('🔧 [57] AI Providers: Initializing GPT-OSS client');
      const gptOssClient = createGptOssClient();
      if (gptOssClient) {
        this.providers.set('gpt-oss', gptOssClient);
        console.log('✅ [58] AI Providers: GPT-OSS client initialized');
      } else {
        console.log('⚠️ [59] AI Providers: GPT-OSS client not available (missing API key)');
      }

      this.initialized = true;
      console.log(`🎉 [60] AI Providers: Initialization completed`, {
        totalProviders: this.providers.size,
        providers: Array.from(this.providers.keys()),
      });
    } catch (error) {
      console.error('💥 [61] AI Providers: Initialization failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        providersInitialized: this.providers.size,
      });
      this.initialized = false;
    }
  }

  /**
   * Get client for specific provider
   */
  getProvider(provider: 'xai' | 'groq' | 'gpt-oss'): AIProviderClient | null {
    const client = this.providers.get(provider);

    if (!client) {
      console.error(`[AI Provider] Provider ${provider} not available`);
      return null;
    }

    if (!client.isAvailable) {
      console.error(`[AI Provider] Provider ${provider} is not available`);
      return null;
    }

    return client;
  }

  /**
   * Get client for specific agent type
   * Maps agents to optimal LLM providers
   */
  getClientForAgent(
    agentType: 'architect' | 'gatherer' | 'specialist' | 'formatter'
  ): AIProviderClient | null {
    const providerMap: Record<string, 'xai' | 'groq' | 'gpt-oss'> = {
      architect: 'xai', // XAI Grok for reasoning and planning
      gatherer: 'groq', // Groq for fast information processing
      specialist: 'xai', // XAI Grok for analysis and filtering
      formatter: 'gpt-oss', // GPT-OSS for formatting (fallback to Groq)
    };

    const provider = providerMap[agentType];
    if (!provider) {
      console.error(`[AI Provider] No provider mapped for agent type: ${agentType}`);
      return null;
    }

    return this.getProvider(provider);
  }

  /**
   * Check if providers are ready
   */
  isReady(): boolean {
    return this.initialized && this.providers.size > 0;
  }

  /**
   * Get available providers list
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys()).filter((key) => this.providers.get(key)?.isAvailable);
  }

  /**
   * Health check for all providers
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};

    for (const [key, client] of this.providers) {
      try {
        // Simple availability check - providers initialized and have valid configuration
        health[key] = client.isAvailable && client.client !== null;
      } catch (error) {
        console.error(`[AI Provider] Health check failed for ${key}:`, error);
        health[key] = false;
      }
    }

    return health;
  }

  /**
   * Retry logic for failed AI requests
   * Constitutional requirement: graceful error handling
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`[AI Provider] Attempt ${attempt}/${maxRetries} failed:`, error);

        if (attempt < maxRetries) {
          // Exponential backoff delay
          await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }
}

/**
 * Singleton instance for AI providers
 * Edge Runtime compatible
 */
export const aiProviders = new AIProvidersManager();

/**
 * Environment validation for AI providers
 * Ensures required API keys are configured
 */
export const validateAIProviders = (): boolean => {
  const requiredKeys = ['XAI_API_KEY', 'GROQ_API_KEY'];
  const missing = requiredKeys.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`[AI Provider] Missing required environment variables: ${missing.join(', ')}`);
    return false;
  }

  console.log('[AI Provider] All required API keys configured');
  return true;
};

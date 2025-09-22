/**
 * Environment Configuration for AI-Powered Itinerary Generation
 *
 * Centralized environment variable management with validation
 * Compatible with Vercel Edge Runtime
 */

import { z } from 'zod';

// Environment variable schema for validation
const envSchema = z.object({
  // AI Provider API Keys
  XAI_API_KEY: z.string().min(1, 'XAI API key is required'),
  GROQ_API_KEY: z.string().min(1, 'Groq API key is required'),

  // Workflow Orchestration
  INNGEST_EVENT_KEY: z.string().min(1, 'Inngest signing key is required'),
  INNGEST_SIGNING_KEY: z.string().optional(), // Alternative name used in some configs

  // State Management (Upstash Redis)
  UPSTASH_REDIS_REST_URL: z.string().url('Invalid Upstash Redis URL'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'Upstash Redis token is required'),

  // Vector Storage (Upstash Vector)
  UPSTASH_VECTOR_REST_URL: z.string().url('Invalid Upstash Vector URL'),
  UPSTASH_VECTOR_REST_TOKEN: z.string().min(1, 'Upstash Vector token is required'),

  // Search Providers
  TAVILY_API_KEY: z.string().min(1, 'Tavily API key is required'),
  EXA_API_KEY: z.string().min(1, 'Exa API key is required'),
  SERP_API_KEY: z.string().min(1, 'SERP API key is required'),

  // Frontend Configuration (Public)
  NEXT_PUBLIC_WS_URL: z.string().url('Invalid WebSocket URL').optional(),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Type for validated environment
export type Env = z.infer<typeof envSchema>;

/**
 * Validate and get environment variables
 * Edge Runtime compatible - uses process.env directly
 */
function getEnv(): Env {
  try {
    // In Edge Runtime, process.env is available but limited
    const env = {
      XAI_API_KEY: process.env.XAI_API_KEY,
      GROQ_API_KEY: process.env.GROQ_API_KEY,
      INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY || process.env.INNGEST_SIGNING_KEY,
      INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
      UPSTASH_VECTOR_REST_URL: process.env.UPSTASH_VECTOR_REST_URL,
      UPSTASH_VECTOR_REST_TOKEN: process.env.UPSTASH_VECTOR_REST_TOKEN,
      TAVILY_API_KEY: process.env.TAVILY_API_KEY,
      EXA_API_KEY: process.env.EXA_API_KEY,
      SERP_API_KEY: process.env.SERP_API_KEY,
      NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
      NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
    };

    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => err.path.join('.'));
      throw new Error(
        `Missing or invalid environment variables: ${missingVars.join(', ')}\n` +
          'Please check your .env.local file or Vercel environment configuration.'
      );
    }
    throw error;
  }
}

// Export validated environment variables
export const env = getEnv();

/**
 * Configuration constants derived from environment
 */
export const config = {
  // AI Providers
  ai: {
    xai: {
      apiKey: env.XAI_API_KEY,
      model: 'grok-4-fast-reasoning', // Primary reasoning model
    },
    groq: {
      apiKey: env.GROQ_API_KEY,
      model: 'compound', // High-speed processing model
    },
    // Note: GPT-OSS integration will be added when available
  },

  // Workflow orchestration
  inngest: {
    signingKey: env.INNGEST_EVENT_KEY,
    isDev: env.NODE_ENV === 'development',
  },

  // State management
  redis: {
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
    // TTL configurations
    workflowTTL: 60 * 60, // 1 hour for workflow sessions
    itineraryTTL: 60 * 60 * 24 * 7, // 7 days for completed itineraries
    agentTTL: 60 * 60 * 24, // 24 hours for agent debug data
  },

  // Vector storage
  vector: {
    url: env.UPSTASH_VECTOR_REST_URL,
    token: env.UPSTASH_VECTOR_REST_TOKEN,
    dimensions: 1536, // OpenAI embedding dimensions
  },

  // Search providers
  search: {
    tavily: {
      apiKey: env.TAVILY_API_KEY,
      maxResults: 10,
    },
    exa: {
      apiKey: env.EXA_API_KEY,
      maxResults: 15,
    },
    serp: {
      apiKey: env.SERP_API_KEY,
      maxResults: 20,
    },
  },

  // Application settings
  app: {
    wsUrl: env.NEXT_PUBLIC_WS_URL,
    isDev: env.NODE_ENV === 'development',
    isProd: env.NODE_ENV === 'production',
  },

  // Performance limits
  limits: {
    maxWorkflowTime: 5 * 60 * 1000, // 5 minutes in milliseconds
    maxAgentTime: 30 * 1000, // 30 seconds per agent
    maxRetries: 3,
    rateLimit: {
      requestsPerHour: 100,
      generationsPerHour: 5,
    },
  },
} as const;

/**
 * Development environment validation helper
 */
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  try {
    envSchema.parse(process.env);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((err) => `${err.path.join('.')}: ${err.message}`),
      };
    }
    return { isValid: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Edge Runtime safe environment access
 * Use this in API routes that need specific env vars
 */
export function getEnvVar(key: keyof Env): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

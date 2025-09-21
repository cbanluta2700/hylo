import { z } from 'zod';

// Environment variable schema validation
const envSchema = z.object({
  // AI/LLM Services
  XAI_API_KEY: z.string().min(1, 'XAI_API_KEY is required'),
  GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required'),

  // Search Services
  TAVILY_API_KEY: z.string().min(1, 'TAVILY_API_KEY is required'),
  EXA_API_KEY: z.string().min(1, 'EXA_API_KEY is required'),
  SERP_API_KEY: z.string().min(1, 'SERP_API_KEY is required'),

  // Infrastructure
  UPSTASH_VECTOR_REST_URL: z.string().url('UPSTASH_VECTOR_REST_URL must be a valid URL'),
  UPSTASH_VECTOR_REST_TOKEN: z.string().min(1, 'UPSTASH_VECTOR_REST_TOKEN is required'),
  UPSTASH_REDIS_REST_URL: z.string().url('UPSTASH_REDIS_REST_URL must be a valid URL'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'UPSTASH_REDIS_REST_TOKEN is required'),

  // Workflow Orchestration
  INNGEST_EVENT_KEY: z.string().min(1, 'INNGEST_EVENT_KEY is required'),
  INNGEST_SIGNING_KEY: z.string().min(1, 'INNGEST_SIGNING_KEY is required'),

  // Application
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

// Export validated environment variables
export const config = {
  // AI/LLM Services
  xai: {
    apiKey: env.XAI_API_KEY,
  },
  groq: {
    apiKey: env.GROQ_API_KEY,
  },

  // Search Services
  tavily: {
    apiKey: env.TAVILY_API_KEY,
  },
  exa: {
    apiKey: env.EXA_API_KEY,
  },
  serp: {
    apiKey: env.SERP_API_KEY,
  },

  // Infrastructure
  upstash: {
    vector: {
      url: env.UPSTASH_VECTOR_REST_URL,
      token: env.UPSTASH_VECTOR_REST_TOKEN,
    },
    redis: {
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    },
  },

  // Workflow Orchestration
  inngest: {
    eventKey: env.INNGEST_EVENT_KEY,
    signingKey: env.INNGEST_SIGNING_KEY,
  },

  // Application
  app: {
    url: env.NEXT_PUBLIC_APP_URL,
    isDev: env.NODE_ENV === 'development',
    isProd: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
  },

  auth: {
    secret: env.NEXTAUTH_SECRET,
  },
} as const;

// Type-safe environment configuration
export type Config = typeof config;

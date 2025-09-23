/**
 * QStash Client Configuration for AI Workflow Orchestration
 * Console Log Numbers: [40-44]
 * Constitutional Requirements: Edge Runtime compatible, Web APIs only
 */

import { Client } from '@upstash/qstash';

// Edge Runtime compatible environment variable access
const getQStashToken = (): string => {
  const token = process.env['QSTASH_TOKEN'];
  if (!token) {
    console.log('[40] ❌ QSTASH_TOKEN environment variable not found');
    throw new Error('QSTASH_TOKEN environment variable is required');
  }
  console.log('[41] ✅ QStash token configured');
  return token;
};

// Initialize QStash client with Edge Runtime compatibility
export const createQStashClient = (): Client => {
  try {
    console.log('[42] 🔧 Initializing QStash client...');

    const token = getQStashToken();
    const client = new Client({ token });

    console.log('[43] ✅ QStash client initialized successfully');
    return client;
  } catch (error) {
    console.log('[44] ❌ Failed to initialize QStash client:', error);
    throw error;
  }
};

// Singleton instance for reuse across the application
let qstashClientInstance: Client | null = null;

export const getQStashClient = (): Client => {
  if (!qstashClientInstance) {
    qstashClientInstance = createQStashClient();
  }
  return qstashClientInstance;
};

// Edge Runtime configuration validation
export const validateQStashEnvironment = (): boolean => {
  try {
    const token = process.env['QSTASH_TOKEN'];

    if (!token) {
      console.log('[40] ❌ QStash validation failed: Missing QSTASH_TOKEN');
      return false;
    }

    if (token.length < 10) {
      console.log('[40] ❌ QStash validation failed: Invalid token format');
      return false;
    }

    console.log('[41] ✅ QStash environment validation passed');
    return true;
  } catch (error) {
    console.log('[44] ❌ QStash environment validation error:', error);
    return false;
  }
};

// Development/Production environment handling
export const getQStashConfig = () => {
  const isDevelopment = process.env['NODE_ENV'] === 'development';

  return {
    token: getQStashToken(),
    baseURL: process.env['QSTASH_BASE_URL'] || 'https://qstash.upstash.io',
    environment: isDevelopment ? 'development' : 'production',
    retries: isDevelopment ? 1 : 3,
    timeout: isDevelopment ? 30000 : 60000, // 30s dev, 60s prod
  };
};

export default getQStashClient;

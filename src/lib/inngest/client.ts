/**
 * Inngest Client Configuration for AI Workflow Orchestration
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility (no Node.js built-ins)
 * - Type-safe development with strict TypeScript
 * - Environment variable security patterns
 *
 * Task: T019 - Create Inngest client configuration
 */

import { Inngest } from 'inngest';

/**
 * Environment configuration for Inngest
 * Must be compatible with Vercel Edge Runtime
 */
const getInngestConfig = () => {
  // Check for required environment variables
  const eventKey = process.env['INNGEST_EVENT_KEY'];
  const isDevelopment = process.env['NODE_ENV'] === 'development';

  if (!eventKey && !isDevelopment) {
    throw new Error('INNGEST_EVENT_KEY is required for production deployment');
  }

  return {
    id: 'hylo-travel-ai',
    name: 'Hylo Travel AI Workflow',
    ...(eventKey && { eventKey }), // Only include if defined
    isDev: isDevelopment,
    // Configure for Edge Runtime compatibility
    isProduction: process.env['NODE_ENV'] === 'production',
    baseUrl: process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000',
  };
};

/**
 * Inngest client instance
 * Configured for Edge Runtime deployment on Vercel
 */
export const inngest = new Inngest(getInngestConfig());

/**
 * Event types for AI workflow orchestration
 * Type-safe event definitions following constitutional requirements
 */
export interface WorkflowEvents {
  'itinerary/generate': {
    data: {
      workflowId: string;
      sessionId: string;
      formData: any; // Will be replaced with TravelFormData import
    };
  };
  'itinerary/agent-complete': {
    data: {
      workflowId: string;
      agentType: 'architect' | 'gatherer' | 'specialist' | 'formatter';
      result: any;
      tokensUsed?: number;
      processingTime: number;
    };
  };
  'itinerary/progress-update': {
    data: {
      workflowId: string;
      progress: number;
      currentStage: 'architect' | 'gatherer' | 'specialist' | 'formatter' | 'complete';
      message?: string;
    };
  };
  'itinerary/workflow-error': {
    data: {
      workflowId: string;
      error: string;
      agentType?: string;
      retryCount: number;
    };
  };
}

/**
 * Inngest configuration validation
 * Ensures Edge Runtime compatibility
 */
export const validateInngestConfig = (): boolean => {
  try {
    console.log('🔧 [40] Inngest Client: Starting configuration validation');
    const config = getInngestConfig();

    // Verify required configuration exists
    if (!config.id || !config.name) {
      console.error('❌ [41] Inngest Client: Missing required configuration', {
        hasId: !!config.id,
        hasName: !!config.name,
      });
      return false;
    }

    // Verify production requirements
    if (config.isProduction && !config.eventKey) {
      console.error('❌ [42] Inngest Client: Event key required for production');
      return false;
    }

    console.log('✅ [43] Inngest Client: Configuration validated successfully', {
      id: config.id,
      name: config.name,
      isProduction: config.isProduction,
      hasEventKey: !!config.eventKey,
    });
    return true;
  } catch (error) {
    console.error('💥 [44] Inngest Client: Configuration validation failed', error);
    return false;
  }
};

/**
 * Development helper for Inngest client
 * Only available in development mode
 */
export const getInngestDevInfo = () => {
  const config = getInngestConfig();

  if (!config.isDev) {
    return null;
  }

  return {
    clientId: config.id,
    baseUrl: config.baseUrl,
    eventKey: config.eventKey ? 'configured' : 'not configured',
    isProduction: config.isProduction,
  };
};

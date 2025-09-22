/**
 * Inngest Client Configuration (T019)
 *
 * CONSTITUTIONAL COMPLIANCE:
 * - Principle I: Edge Runtime compatible
 * - Principle V: Type-safe development with strict TypeScript
 *
 * This initializes the Inngest client for AI workflow orchestration
 * with proper Edge Runtime compatibility and event signing.
 */

import { Inngest } from 'inngest';

// Constitutional requirement: Environment variable validation
const INNGEST_EVENT_KEY = process.env.INNGEST_EVENT_KEY;
const INNGEST_SIGNING_KEY = process.env.INNGEST_SIGNING_KEY;

if (!INNGEST_EVENT_KEY) {
  throw new Error('INNGEST_EVENT_KEY is required but not configured');
}

// Create Inngest client with Edge Runtime compatibility
export const inngest = new Inngest({
  id: 'hylo-travel-ai',
  name: 'Hylo Travel AI Workflow',

  // Constitutional requirement: Edge Runtime environment handling
  eventKey: INNGEST_EVENT_KEY,

  // Development vs production environment handling
  env: process.env.NODE_ENV === 'production' ? 'production' : 'development',

  // Edge Runtime compatible configuration
  isDev: process.env.NODE_ENV !== 'production',

  // Signing key for webhook security (production only)
  ...(INNGEST_SIGNING_KEY &&
    process.env.NODE_ENV === 'production' && {
      signingKey: INNGEST_SIGNING_KEY,
    }),

  // Edge Runtime compatible logger
  logger: {
    info: (msg: string, extra?: any) => console.info(`[Inngest] ${msg}`, extra),
    warn: (msg: string, extra?: any) => console.warn(`[Inngest] ${msg}`, extra),
    error: (msg: string, extra?: any) => console.error(`[Inngest] ${msg}`, extra),
    debug: (msg: string, extra?: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[Inngest] ${msg}`, extra);
      }
    },
  },
});

/**
 * Event Types for AI Workflow
 * Constitutional requirement: Type-safe development
 */
export interface WorkflowEvents {
  'itinerary/generation.requested': {
    workflowId: string;
    sessionId: string;
    formData: any; // Will be properly typed when imported from travel-form.ts
    requestedAt: string;
  };

  'itinerary/agent.started': {
    workflowId: string;
    agentType: 'architect' | 'gatherer' | 'specialist' | 'formatter';
    input: any;
    startedAt: string;
  };

  'itinerary/agent.completed': {
    workflowId: string;
    agentType: 'architect' | 'gatherer' | 'specialist' | 'formatter';
    output: any;
    processingTime: number;
    completedAt: string;
  };

  'itinerary/agent.failed': {
    workflowId: string;
    agentType: 'architect' | 'gatherer' | 'specialist' | 'formatter';
    error: {
      code: string;
      message: string;
      details?: any;
    };
    retryAttempt: number;
    failedAt: string;
  };

  'itinerary/generation.completed': {
    workflowId: string;
    itineraryId: string;
    processingTime: number;
    completedAt: string;
  };

  'itinerary/generation.failed': {
    workflowId: string;
    error: {
      code: string;
      message: string;
      stage: string;
      details?: any;
    };
    finalAttempt: boolean;
    failedAt: string;
  };
}

/**
 * Helper function to send events with type safety
 * Constitutional requirement: Type-safe development
 */
export async function sendWorkflowEvent<T extends keyof WorkflowEvents>(
  eventName: T,
  data: WorkflowEvents[T]
): Promise<void> {
  console.log('🔄 [DEBUG-122] Inngest sending workflow event', {
    eventName,
    hasData: !!data,
    dataKeys: typeof data === 'object' && data ? Object.keys(data) : [],
  });

  try {
    await inngest.send({
      name: eventName,
      data,
    });
    console.log('✅ [DEBUG-123] Inngest event sent successfully', { eventName });
  } catch (error) {
    console.error(`❌ [DEBUG-124] Failed to send Inngest event ${eventName}:`, error);
    // Don't throw - events are fire-and-forget for resilience
  }
}

/**
 * Batch send multiple events efficiently
 * Edge Runtime compatible batch processing
 */
export async function sendWorkflowEvents(
  events: Array<{
    name: keyof WorkflowEvents;
    data: WorkflowEvents[keyof WorkflowEvents];
  }>
): Promise<void> {
  try {
    await inngest.send(events);
  } catch (error) {
    console.error('Failed to send batch Inngest events:', error);
    // Don't throw - events are fire-and-forget for resilience
  }
}

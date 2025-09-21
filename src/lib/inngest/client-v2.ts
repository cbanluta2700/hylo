import { Inngest } from 'inngest';
import { config } from '../env';
import type { InngestEvent } from './events';

/**
 * Enhanced Inngest Client for Hylo Travel AI
 *
 * Configured for production-grade workflow orchestration with:
 * - Type-safe event handling
 * - Progress tracking integration
 * - Error recovery and resilience
 * - Performance optimization for travel AI workloads
 */
export const inngest = new Inngest({
  id: 'hylo-itinerary-generator',
  eventKey: config.inngest.eventKey,
  signingKey: config.inngest.signingKey,

  // Production configuration
  isDev: process.env.NODE_ENV === 'development',
});

/**
 * Environment-specific configurations
 */
export const inngestConfig = {
  // Development configuration
  development: {
    logLevel: 'debug' as const,
    timeout: 300000, // 5 minutes for development
    maxRetries: 2,
  },

  // Production configuration
  production: {
    logLevel: 'info' as const,
    timeout: 180000, // 3 minutes for production
    maxRetries: 3,
  },

  // Current environment config
  current:
    process.env.NODE_ENV === 'production'
      ? {
          logLevel: 'info' as const,
          timeout: 180000,
          maxRetries: 3,
        }
      : {
          logLevel: 'debug' as const,
          timeout: 300000,
          maxRetries: 2,
        },
};

/**
 * Utility function for sending events with type safety
 */
export async function sendEvent<T extends InngestEvent['name']>(
  eventName: T,
  data: Extract<InngestEvent, { name: T }>['data']
) {
  return inngest.send({
    name: eventName,
    data,
    timestamp: Date.now(),
    v: '1.0.0', // Event schema version
  } as any); // Type assertion for now
}

/**
 * Utility for bulk event sending
 */
export async function sendEvents(
  events: Array<{
    name: InngestEvent['name'];
    data: any;
  }>
) {
  return inngest.send(
    events.map((event) => ({
      ...event,
      timestamp: Date.now(),
      v: '1.0.0',
    }))
  );
}

/**
 * Progress tracking utility
 */
export async function updateProgress(
  sessionId: string,
  requestId: string,
  stage: string,
  progress: number,
  message: string,
  agentName?: string
) {
  return sendEvent('progress.update', {
    sessionId,
    requestId,
    stage,
    progress,
    message,
    ...(agentName && { agentName }),
    timestamp: new Date().toISOString(),
  });
}

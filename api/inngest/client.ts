/**
 * Inngest Client Configuration
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - Type-safe development with comprehensive event schemas
 * - Following architecture structure from migration plan
 *
 * Phase 1: Foundation Setup
 */

import { EventSchemas, Inngest } from 'inngest';
import type { TravelFormData } from '../../src/types/travel-form.js';

/**
 * Comprehensive event schema for the 4-agent AI workflow
 * Following the architecture structure from migration plan
 */
type WorkflowEvents = {
  // Main workflow trigger
  'itinerary/generate': {
    data: {
      workflowId: string;
      sessionId: string;
      formData: TravelFormData;
    };
  };

  // Agent start events (for individual agent invocation)
  'agent/architect/start': {
    data: {
      workflowId: string;
      formData: TravelFormData;
    };
  };

  'agent/gatherer/start': {
    data: {
      workflowId: string;
      destination: string;
      architecture: any;
    };
  };

  'agent/specialist/start': {
    data: {
      workflowId: string;
      gatheredData: any;
      preferences: string[];
    };
  };

  'agent/formatter/start': {
    data: {
      workflowId: string;
      processedData: any;
      travelStyle: string;
    };
  };

  // Agent completion events
  'agent/architect/complete': {
    data: {
      workflowId: string;
      structure: any; // Will be properly typed with TripStructure
    };
  };

  'agent/gatherer/complete': {
    data: {
      workflowId: string;
      research: any; // Will be properly typed with ResearchData
    };
  };

  'agent/specialist/complete': {
    data: {
      workflowId: string;
      recommendations: any; // Will be properly typed with RecommendationData
    };
  };

  'agent/formatter/complete': {
    data: {
      workflowId: string;
      itinerary: any; // Will be properly typed with FormattedItinerary
    };
  };

  // Progress and status events
  'workflow/progress': {
    data: {
      workflowId: string;
      stage: string;
      progress: number;
    };
  };

  'workflow/error': {
    data: {
      workflowId: string;
      error: string;
      stage: string;
    };
  };

  'workflow/complete': {
    data: {
      workflowId: string;
      itinerary: any; // Final itinerary output
    };
  };
};

/**
 * Create and export the Inngest client
 * Configured for Hylo Travel AI with full type safety
 */
export const inngest = new Inngest({
  id: 'hylo-travel-ai',
  name: 'Hylo Travel AI Workflow',
  schemas: new EventSchemas().fromRecord<WorkflowEvents>(),
});

/**
 * Export event types for use in functions
 */
export type { WorkflowEvents };

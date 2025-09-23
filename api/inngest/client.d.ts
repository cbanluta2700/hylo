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
    'itinerary/generate': {
        data: {
            workflowId: string;
            sessionId: string;
            formData: TravelFormData;
        };
    };
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
    'agent/architect/complete': {
        data: {
            workflowId: string;
            structure: any;
        };
    };
    'agent/gatherer/complete': {
        data: {
            workflowId: string;
            research: any;
        };
    };
    'agent/specialist/complete': {
        data: {
            workflowId: string;
            recommendations: any;
        };
    };
    'agent/formatter/complete': {
        data: {
            workflowId: string;
            itinerary: any;
        };
    };
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
            itinerary: any;
        };
    };
};
/**
 * Create and export the Inngest client
 * Configured for Hylo Travel AI with full type safety
 */
export declare const inngest: Inngest<{
    id: string;
    name: string;
    schemas: EventSchemas<{
        "inngest/function.failed": {
            data: {
                function_id: string;
                run_id: string;
                error: import("inngest").JsonError;
                event: import("inngest").EventPayload<any>;
            };
            name: "inngest/function.failed";
        };
        "inngest/function.invoked": {
            data?: any;
            id?: string;
            ts?: number;
            user?: any;
            v?: string;
            name: "inngest/function.invoked";
        };
        "inngest/function.finished": {
            data: {
                function_id: string;
                run_id: string;
                correlation_id?: string;
            } & ({
                error: import("inngest").JsonError;
            } | {
                result: unknown;
            });
            name: "inngest/function.finished";
        };
        "inngest/function.cancelled": {
            data: {
                function_id: string;
                run_id: string;
                correlation_id?: string;
            };
            name: "inngest/function.cancelled";
        };
        "inngest/scheduled.timer": {
            data: {
                cron: string;
            };
            id: string;
            ts?: number;
            user?: any;
            v?: string;
            name: "inngest/scheduled.timer";
        };
        "itinerary/generate": {
            name: "itinerary/generate";
            id?: string;
            ts?: number;
            user?: any;
            v?: string;
            data: {
                workflowId: string;
                sessionId: string;
                formData: TravelFormData;
            };
        };
        "agent/architect/start": {
            name: "agent/architect/start";
            id?: string;
            ts?: number;
            user?: any;
            v?: string;
            data: {
                workflowId: string;
                formData: TravelFormData;
            };
        };
        "agent/gatherer/start": {
            name: "agent/gatherer/start";
            id?: string;
            ts?: number;
            user?: any;
            v?: string;
            data: {
                workflowId: string;
                destination: string;
                architecture: any;
            };
        };
        "agent/specialist/start": {
            name: "agent/specialist/start";
            id?: string;
            ts?: number;
            user?: any;
            v?: string;
            data: {
                workflowId: string;
                gatheredData: any;
                preferences: string[];
            };
        };
        "agent/formatter/start": {
            name: "agent/formatter/start";
            id?: string;
            ts?: number;
            user?: any;
            v?: string;
            data: {
                workflowId: string;
                processedData: any;
                travelStyle: string;
            };
        };
        "agent/architect/complete": {
            name: "agent/architect/complete";
            id?: string;
            ts?: number;
            user?: any;
            v?: string;
            data: {
                workflowId: string;
                structure: any;
            };
        };
        "agent/gatherer/complete": {
            name: "agent/gatherer/complete";
            id?: string;
            ts?: number;
            user?: any;
            v?: string;
            data: {
                workflowId: string;
                research: any;
            };
        };
        "agent/specialist/complete": {
            name: "agent/specialist/complete";
            id?: string;
            ts?: number;
            user?: any;
            v?: string;
            data: {
                workflowId: string;
                recommendations: any;
            };
        };
        "agent/formatter/complete": {
            name: "agent/formatter/complete";
            id?: string;
            ts?: number;
            user?: any;
            v?: string;
            data: {
                workflowId: string;
                itinerary: any;
            };
        };
        "workflow/progress": {
            name: "workflow/progress";
            id?: string;
            ts?: number;
            user?: any;
            v?: string;
            data: {
                workflowId: string;
                stage: string;
                progress: number;
            };
        };
        "workflow/error": {
            name: "workflow/error";
            id?: string;
            ts?: number;
            user?: any;
            v?: string;
            data: {
                workflowId: string;
                error: string;
                stage: string;
            };
        };
        "workflow/complete": {
            name: "workflow/complete";
            id?: string;
            ts?: number;
            user?: any;
            v?: string;
            data: {
                workflowId: string;
                itinerary: any;
            };
        };
    }>;
}>;
/**
 * Export event types for use in functions
 */
export type { WorkflowEvents };

/**
 * Formatter Agent Function
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - Fast processing for final output structuring
 * - Type-safe development
 *
 * Following architecture structure from migration plan
 */
/**
 * Individual Formatter Agent Function
 * Creates the final structured itinerary output
 */
export declare const formatterAgent: import("inngest").InngestFunction<Omit<import("inngest").InngestFunction.Options<import("inngest").Inngest<{
    id: string;
    name: string;
    schemas: import("inngest").EventSchemas<{
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
                formData: import("../../../src/types/travel-form.js").TravelFormData;
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
                formData: import("../../../src/types/travel-form.js").TravelFormData;
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
}>, import("inngest").InngestMiddleware.Stack, [{
    event: "agent/formatter/start";
}], import("inngest").Handler<import("inngest").Inngest<{
    id: string;
    name: string;
    schemas: import("inngest").EventSchemas<{
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
                formData: import("../../../src/types/travel-form.js").TravelFormData;
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
                formData: import("../../../src/types/travel-form.js").TravelFormData;
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
}>, "agent/formatter/start", {
    error: Error;
    event: import("inngest").FailureEventPayload<{
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
    }>;
    logger: import("inngest/middleware/logger.js").Logger;
}>>, "triggers">, ({ event, step }: import("inngest").Context<import("inngest").Inngest<{
    id: string;
    name: string;
    schemas: import("inngest").EventSchemas<{
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
                formData: import("../../../src/types/travel-form.js").TravelFormData;
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
                formData: import("../../../src/types/travel-form.js").TravelFormData;
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
}>, "agent/formatter/start", {
    logger: import("inngest/middleware/logger.js").Logger;
}>) => Promise<{
    workflowId: string;
    agent: string;
    status: string;
    itinerary: string;
}>, import("inngest").Handler<import("inngest").Inngest<{
    id: string;
    name: string;
    schemas: import("inngest").EventSchemas<{
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
                formData: import("../../../src/types/travel-form.js").TravelFormData;
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
                formData: import("../../../src/types/travel-form.js").TravelFormData;
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
}>, "agent/formatter/start", {
    error: Error;
    event: import("inngest").FailureEventPayload<{
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
    }>;
    logger: import("inngest/middleware/logger.js").Logger;
}>, import("inngest").Inngest<{
    id: string;
    name: string;
    schemas: import("inngest").EventSchemas<{
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
                formData: import("../../../src/types/travel-form.js").TravelFormData;
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
                formData: import("../../../src/types/travel-form.js").TravelFormData;
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
}>, import("inngest").InngestMiddleware.Stack, [{
    event: "agent/formatter/start";
}]>;

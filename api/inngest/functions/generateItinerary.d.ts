/**
 * Mainimport { inngest } from '../client.js';
import { sessionManager } from '../../../src/lib/workflows/session-manager.js';
// Import existing AI agents
import { architectAgent } from '../../../src/lib/ai-agents/architect-agent.js';
import { gathererAgent } from '../../../src/lib/ai-agents/gatherer-agent.js';
import { specialistAgent } from '../../../src/lib/ai-agents/specialist-agent.js';
import { formatterAgent } from '../../../src/lib/ai-agents/formatter-agent.js';ry Generation Function
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - Step-based architecture for reliability
 * - Proper event handling and progress updates
 * - 4-agent workflow orchestration
 *
 * Following architecture structure from migration plan
 */
/**
 * Main orchestrator function for AI-powered itinerary generation
 * Coordinates all 4 agents in sequence with proper error handling
 */
export declare const generateItinerary: import("inngest").InngestFunction<Omit<import("inngest").InngestFunction.Options<import("inngest").Inngest<{
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
    event: "itinerary/generate";
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
}>, "itinerary/generate", {
    error: Error;
    event: import("inngest").FailureEventPayload<{
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
}>, "itinerary/generate", {
    logger: import("inngest/middleware/logger.js").Logger;
}>) => Promise<{
    workflowId: string;
    sessionId: string;
    status: string;
    itinerary: {
        processingTime?: number;
        tokensUsed?: number;
        finalItinerary?: {
            id?: string;
            alternatives?: {
                rainyDayOptions?: string[];
                budgetFriendlySwaps?: string[];
                upgradeOptions?: string[];
            };
            tripOverview?: {
                destination?: string;
                duration?: string;
                totalDays?: number;
                tripStyle?: string;
                totalBudget?: number;
                currency?: string;
                bestFor?: string[];
            };
            dailySchedule?: {
                date?: string;
                day?: number;
                accommodation?: string;
                transportation?: string;
                morning?: {
                    location?: string;
                    time?: string;
                    activity?: string;
                    cost?: string;
                    tips?: string;
                };
                theme?: string;
                estimatedBudget?: number;
                afternoon?: {
                    location?: string;
                    time?: string;
                    activity?: string;
                    cost?: string;
                    tips?: string;
                };
                evening?: {
                    location?: string;
                    time?: string;
                    activity?: string;
                    cost?: string;
                    tips?: string;
                };
                meals: unknown;
            }[];
            practicalInfo?: {
                budgetBreakdown?: {
                    accommodation?: number;
                    food?: number;
                    activities?: number;
                    transportation?: number;
                    miscellaneous?: number;
                };
                packingTips?: string[];
                localTips?: string[];
                importantInfo?: string[];
                emergencyInfo?: string[];
            };
        };
        validationResults?: {
            issues?: string[];
            budgetCompliance?: boolean;
            preferencesAlignment?: number;
            logisticalFeasibility?: boolean;
            suggestions?: string[];
        };
    };
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
}>, "itinerary/generate", {
    error: Error;
    event: import("inngest").FailureEventPayload<{
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
    event: "itinerary/generate";
}]>;

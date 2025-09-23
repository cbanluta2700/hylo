/**
 * Progress Integration Utilities
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - Integration with existing SSE progress reporting
 * - Sync with Redis session manager
 *
 * Connects Inngest workflow events with the existing progress system
 */
/**
 * Standard progress stages mapping
 */
export declare const PROGRESS_STAGES: {
    readonly architect: {
        readonly progress: 25;
        readonly message: "Creating your trip structure...";
    };
    readonly gatherer: {
        readonly progress: 50;
        readonly message: "Gathering destination information...";
    };
    readonly specialist: {
        readonly progress: 75;
        readonly message: "Processing recommendations...";
    };
    readonly formatter: {
        readonly progress: 90;
        readonly message: "Finalizing your itinerary...";
    };
    readonly complete: {
        readonly progress: 100;
        readonly message: "Your personalized itinerary is ready!";
    };
};
/**
 * Update progress in session manager for SSE streaming
 * Used by Inngest functions to maintain progress sync
 */
export declare function updateWorkflowProgress(workflowId: string, stage: keyof typeof PROGRESS_STAGES, completedSteps?: string[]): Promise<void>;
/**
 * Handle workflow error and update progress
 */
export declare function handleWorkflowError(workflowId: string, stage: string, error: Error | string): Promise<void>;
/**
 * Initialize workflow progress
 */
export declare function initializeWorkflowProgress(workflowId: string): Promise<void>;

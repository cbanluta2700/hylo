/**
 * Enhanced Error Handling Integration for Inngest Workflows
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - Integration with existing ErrorBoundary system
 * - Progressive enhancement with graceful degradation
 * - Observable operations with monitoring
 *
 * Connects Inngest workflow errors with the existing error handling infrastructure
 */
/**
 * Workflow error categories
 */
export declare enum WorkflowErrorType {
    VALIDATION = "validation",
    NETWORK = "network",
    AI_PROVIDER = "ai_provider",
    TIMEOUT = "timeout",
    SYSTEM = "system",
    RATE_LIMIT = "rate_limit"
}
/**
 * Enhanced error information for workflow errors
 */
export interface WorkflowError {
    type: WorkflowErrorType;
    stage: string;
    message: string;
    originalError: Error;
    retryable: boolean;
    userMessage: string;
    recoveryActions: string[];
}
/**
 * Classify and enhance workflow errors
 */
export declare function classifyWorkflowError(error: Error, stage: string): WorkflowError;
/**
 * Handle workflow errors with comprehensive error reporting
 */
export declare function handleEnhancedWorkflowError(workflowId: string, stage: string, error: Error): Promise<void>;
/**
 * Create user-friendly error responses for API endpoints
 */
export declare function createErrorResponse(workflowError: WorkflowError, workflowId: string): Response;
/**
 * Determine if an error should trigger automatic retry
 */
export declare function shouldRetryError(workflowError: WorkflowError): boolean;

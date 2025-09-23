/**
 * WorkflowSession Redis Management
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility (Web APIs only)
 * - Type-safe development with Zod validation
 * - No Node.js built-ins
 *
 * Task: T020 - Implement WorkflowSession Redis management
 */
import type { TravelFormData } from '../../types/travel-form.js';
/**
 * WorkflowSession interface matching data-model.md specification
 */
export interface WorkflowSession {
    id: string;
    sessionId: string;
    requestId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    currentStage: 'architect' | 'gatherer' | 'specialist' | 'formatter' | 'complete';
    progress: number;
    completedSteps: string[];
    startedAt: Date;
    completedAt?: Date;
    errorMessage?: string;
    retryCount: number;
    formData: TravelFormData;
}
/**
 * Session manager for AI workflow state
 */
export declare class WorkflowSessionManager {
    private redis;
    private readonly SESSION_TTL;
    private readonly SESSION_PREFIX;
    constructor();
    /**
     * Create new workflow session
     * Atomic operation with expiration
     */
    createSession(workflowId: string, sessionId: string, formData: TravelFormData): Promise<WorkflowSession>;
    /**
     * Retrieve workflow session by ID
     */
    getSession(workflowId: string): Promise<WorkflowSession | null>;
    /**
     * Update workflow session progress
     * Atomic operation with progress validation
     */
    updateProgress(workflowId: string, updates: {
        status?: WorkflowSession['status'];
        currentStage?: WorkflowSession['currentStage'];
        progress?: number;
        completedSteps?: string[];
        errorMessage?: string;
        retryCount?: number;
    }): Promise<boolean>;
    /**
     * Mark workflow as completed
     */
    completeSession(workflowId: string): Promise<boolean>;
    /**
     * Mark workflow as failed with error
     */
    failSession(workflowId: string, errorMessage: string): Promise<boolean>;
    /**
     * Delete workflow session
     * Used for cleanup or cancellation
     */
    deleteSession(workflowId: string): Promise<boolean>;
    /**
     * Get sessions by user session ID
     * For user dashboard/history functionality
     */
    getSessionsByUser(sessionId: string, limit?: number): Promise<WorkflowSession[]>;
}
/**
 * Singleton instance for workflow session management
 * Edge Runtime compatible
 */
export declare const sessionManager: WorkflowSessionManager;
/**
 * Utility function to generate workflow ID
 * Edge Runtime compatible UUID generation
 */
export declare const generateWorkflowId: () => string;

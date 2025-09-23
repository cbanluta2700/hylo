/**
 * Main Workflow Orchestrator
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility (CONSTITUTIONAL PRINCIPLE I - NON-NEGOTIABLE)
 * - AI SDK 5.0+ for LLM integration (Constitution v1.1.0)
 * - Type-safe development
 * - Direct AI workflow execution (Edge-First Architecture)
 *
 * Task: T026-T031 - Main workflow orchestration
 * Using Inngest "invoking functions directly" pattern from docs
 */
import type { TravelFormData } from '../../types/travel-form.js';
export declare class WorkflowOrchestrator {
    /**
     * Initiate new itinerary generation workflow
     * Using Inngest "invoking functions directly" pattern
     */
    static startWorkflow(sessionId: string, formData: TravelFormData): Promise<{
        workflowId: string;
        estimatedCompletionTime: number;
    }>;
    /**
     * Get workflow status and progress
     */
    static getWorkflowStatus(workflowId: string): Promise<import("./session-manager.js").WorkflowSession>;
    /**
     * Cancel running workflow
     */
    static cancelWorkflow(workflowId: string): Promise<boolean>;
    /**
     * Estimate processing time based on form complexity
     * More complex forms = longer processing time
     */
    private static estimateProcessingTime;
}

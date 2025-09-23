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

import { simpleSessionManager } from './simple-session-manager.js';

/**
 * Workflow error categories
 */
export enum WorkflowErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  AI_PROVIDER = 'ai_provider',
  TIMEOUT = 'timeout',
  SYSTEM = 'system',
  RATE_LIMIT = 'rate_limit',
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
export function classifyWorkflowError(error: Error, stage: string): WorkflowError {
  let errorType = WorkflowErrorType.SYSTEM;
  let retryable = true;
  let userMessage = 'An unexpected error occurred. Our team has been notified.';
  let recoveryActions = ['Try again in a few moments', 'Refresh the page'];

  // Network errors
  if (
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('timeout')
  ) {
    errorType = WorkflowErrorType.NETWORK;
    userMessage = 'Unable to connect to our AI services. Please check your internet connection.';
    recoveryActions = [
      'Check your internet connection',
      'Try again in a few moments',
      'Contact support if the issue persists',
    ];
  }

  // AI Provider errors
  else if (
    error.message.includes('API key') ||
    error.message.includes('unauthorized') ||
    error.message.includes('quota') ||
    error.message.includes('rate limit')
  ) {
    errorType = WorkflowErrorType.AI_PROVIDER;
    retryable = error.message.includes('rate limit');
    userMessage = retryable
      ? "Our AI services are experiencing high demand. We'll automatically retry in a moment."
      : "There's an issue with our AI services. Our team has been notified.";
    recoveryActions = retryable
      ? ["Please wait, we'll automatically retry", 'Try again in a few minutes']
      : ['Contact support for assistance', 'Try again later'];
  }

  // Validation errors
  else if (
    error.message.includes('validation') ||
    error.message.includes('invalid') ||
    stage === 'validation'
  ) {
    errorType = WorkflowErrorType.VALIDATION;
    retryable = false;
    userMessage =
      'There was an issue with your travel preferences. Please check your form and try again.';
    recoveryActions = [
      'Review your travel form for any missing or invalid information',
      'Make sure all required fields are filled out',
      'Try submitting again',
    ];
  }

  // Timeout errors
  else if (error.message.includes('timeout') || error.message.includes('timed out')) {
    errorType = WorkflowErrorType.TIMEOUT;
    userMessage =
      'The AI took longer than expected to process your request. This sometimes happens with complex itineraries.';
    recoveryActions = [
      'Try again - simpler requests typically process faster',
      'Consider reducing the number of destinations or activities',
      'Contact support if you continue to experience timeouts',
    ];
  }

  return {
    type: errorType,
    stage,
    message: error.message,
    originalError: error,
    retryable,
    userMessage,
    recoveryActions,
  };
}

/**
 * Handle workflow errors with comprehensive error reporting
 */
export async function handleEnhancedWorkflowError(
  workflowId: string,
  stage: string,
  error: Error
): Promise<void> {
  const workflowError = classifyWorkflowError(error, stage);

  console.error('💥 [Enhanced Error Handler] Workflow error occurred', {
    workflowId: workflowId.substring(0, 15) + '...',
    stage,
    errorType: workflowError.type,
    retryable: workflowError.retryable,
    userMessage: workflowError.userMessage,
    originalError: error.message,
  });

  try {
    // Update session with detailed error information
    await simpleSessionManager.updateProgress(workflowId, {
      status: 'failed',
      errorMessage: workflowError.userMessage,
    });

    // Send to monitoring in production
    if (typeof process !== 'undefined' && process.env?.['NODE_ENV'] === 'production') {
      await sendErrorToMonitoring(workflowId, workflowError);
    }

    console.log('✅ [Enhanced Error Handler] Error status updated successfully');
  } catch (updateError) {
    console.error('💥 [Enhanced Error Handler] Failed to update error status:', updateError);
  }
}

/**
 * Send error reports to monitoring service
 */
async function sendErrorToMonitoring(
  workflowId: string,
  workflowError: WorkflowError
): Promise<void> {
  try {
    const errorReport = {
      workflowId,
      type: 'inngest_workflow_error',
      errorType: workflowError.type,
      stage: workflowError.stage,
      message: workflowError.message,
      retryable: workflowError.retryable,
      timestamp: new Date().toISOString(),
      context: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
    };

    // Send to monitoring endpoint
    await fetch('/api/monitoring/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorReport),
    });
  } catch (monitoringError) {
    console.error('Failed to send error to monitoring:', monitoringError);
    // Don't throw - monitoring failures shouldn't break error handling
  }
}

/**
 * Create user-friendly error responses for API endpoints
 */
export function createErrorResponse(workflowError: WorkflowError, workflowId: string): Response {
  return Response.json(
    {
      success: false,
      error: workflowError.userMessage,
      errorType: workflowError.type,
      retryable: workflowError.retryable,
      recoveryActions: workflowError.recoveryActions,
      workflowId,
      timestamp: new Date().toISOString(),
    },
    {
      status: workflowError.retryable ? 503 : 400,
    }
  );
}

/**
 * Determine if an error should trigger automatic retry
 */
export function shouldRetryError(workflowError: WorkflowError): boolean {
  return (
    workflowError.retryable &&
    (workflowError.type === WorkflowErrorType.NETWORK ||
      workflowError.type === WorkflowErrorType.RATE_LIMIT ||
      workflowError.type === WorkflowErrorType.TIMEOUT)
  );
}

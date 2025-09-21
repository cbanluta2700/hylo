/**
 * API Error Handling Middleware
 * Comprehensive error handling for Vercel Edge Runtime API routes
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Error types for different failure scenarios
 */
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Structured error interface
 */
export interface ApiError {
  type: ErrorType;
  message: string;
  code: string;
  statusCode: number;
  severity: ErrorSeverity;
  details?: any;
  context?: {
    userId?: string;
    sessionId?: string;
    requestId: string;
    endpoint: string;
    method: string;
    timestamp: string;
    userAgent?: string;
    ip?: string;
  };
  stack?: string;
  cause?: Error;
  retryable: boolean;
  suggestedAction?: string;
}

/**
 * Error response interface
 */
export interface ErrorResponse {
  success: false;
  error: {
    type: ErrorType;
    message: string;
    code: string;
    details?: any;
    requestId: string;
    timestamp: string;
    retryable: boolean;
    suggestedAction?: string;
  };
}

/**
 * Success response interface
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  metadata?: {
    requestId: string;
    processingTime: number;
    cached?: boolean;
    version: string;
  };
}

/**
 * Error configuration
 */
export const ERROR_CONFIG = {
  // Error type mappings
  ERROR_TYPES: {
    [ErrorType.VALIDATION_ERROR]: {
      statusCode: 400,
      severity: ErrorSeverity.MEDIUM,
      retryable: false,
      userMessage: 'Please check your input and try again.',
    },
    [ErrorType.AUTHENTICATION_ERROR]: {
      statusCode: 401,
      severity: ErrorSeverity.HIGH,
      retryable: false,
      userMessage: 'Please log in and try again.',
    },
    [ErrorType.AUTHORIZATION_ERROR]: {
      statusCode: 403,
      severity: ErrorSeverity.HIGH,
      retryable: false,
      userMessage: 'You do not have permission to perform this action.',
    },
    [ErrorType.NOT_FOUND_ERROR]: {
      statusCode: 404,
      severity: ErrorSeverity.LOW,
      retryable: false,
      userMessage: 'The requested resource was not found.',
    },
    [ErrorType.RATE_LIMIT_ERROR]: {
      statusCode: 429,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      userMessage: 'Too many requests. Please try again later.',
    },
    [ErrorType.EXTERNAL_API_ERROR]: {
      statusCode: 502,
      severity: ErrorSeverity.HIGH,
      retryable: true,
      userMessage: 'External service temporarily unavailable. Please try again.',
    },
    [ErrorType.AI_SERVICE_ERROR]: {
      statusCode: 503,
      severity: ErrorSeverity.HIGH,
      retryable: true,
      userMessage: 'AI service temporarily unavailable. Please try again.',
    },
    [ErrorType.DATABASE_ERROR]: {
      statusCode: 503,
      severity: ErrorSeverity.CRITICAL,
      retryable: true,
      userMessage: 'Database temporarily unavailable. Please try again.',
    },
    [ErrorType.CACHE_ERROR]: {
      statusCode: 503,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      userMessage: 'Cache service temporarily unavailable.',
    },
    [ErrorType.NETWORK_ERROR]: {
      statusCode: 503,
      severity: ErrorSeverity.HIGH,
      retryable: true,
      userMessage: 'Network connection issue. Please try again.',
    },
    [ErrorType.TIMEOUT_ERROR]: {
      statusCode: 504,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      userMessage: 'Request timed out. Please try again.',
    },
    [ErrorType.CONFIGURATION_ERROR]: {
      statusCode: 500,
      severity: ErrorSeverity.CRITICAL,
      retryable: false,
      userMessage: 'Service configuration error. Please contact support.',
    },
    [ErrorType.INTERNAL_ERROR]: {
      statusCode: 500,
      severity: ErrorSeverity.CRITICAL,
      retryable: false,
      userMessage: 'An unexpected error occurred. Please try again.',
    },
    [ErrorType.UNKNOWN_ERROR]: {
      statusCode: 500,
      severity: ErrorSeverity.CRITICAL,
      retryable: false,
      userMessage: 'An unknown error occurred. Please try again.',
    },
  },

  // Error handling settings
  LOG_ERRORS: true,
  INCLUDE_STACK_IN_RESPONSE: false, // Never in production
  MAX_ERROR_DETAILS_LENGTH: 1000,
  REQUEST_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second

  // Monitoring settings
  ALERT_THRESHOLDS: {
    [ErrorSeverity.LOW]: 100, // per hour
    [ErrorSeverity.MEDIUM]: 50, // per hour
    [ErrorSeverity.HIGH]: 10, // per hour
    [ErrorSeverity.CRITICAL]: 1, // per hour
  },
} as const;

/**
 * Error Handler Class
 * Centralized error handling for API routes
 */
export class ErrorHandler {
  private requestId: string;
  private startTime: number;

  constructor(requestId?: string) {
    this.requestId = requestId || this.generateRequestId();
    this.startTime = Date.now();
  }

  /**
   * Handle errors in API routes
   */
  handleError(
    error: unknown,
    request: NextRequest,
    context?: {
      userId?: string;
      sessionId?: string;
      additionalContext?: any;
    }
  ): NextResponse<ErrorResponse> {
    const apiError = this.classifyError(error, request, context);
    this.logError(apiError);

    // Check if we should alert
    this.checkAlertThresholds(apiError);

    return this.createErrorResponse(apiError);
  }

  /**
   * Create success response
   */
  createSuccessResponse<T>(
    data: T,
    metadata?: SuccessResponse['metadata']
  ): NextResponse<SuccessResponse<T>> {
    const processingTime = Date.now() - this.startTime;

    const response: SuccessResponse<T> = {
      success: true,
      data,
      metadata: {
        requestId: this.requestId,
        processingTime,
        version: '1.0.0',
        ...metadata,
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Request-ID': this.requestId,
        'X-Processing-Time': processingTime.toString(),
      },
    });
  }

  /**
   * Wrap async route handlers with error handling
   */
  wrapHandler<T extends any[], R>(
    handler: (...args: T) => Promise<R> | R,
    request: NextRequest,
    context?: {
      userId?: string;
      sessionId?: string;
      additionalContext?: any;
    }
  ): (...args: T) => Promise<NextResponse> {
    return async (...args: T) => {
      try {
        const result = await handler(...args);
        return this.createSuccessResponse(result);
      } catch (error) {
        return this.handleError(error, request, context);
      }
    };
  }

  /**
   * Classify and structure errors
   */
  private classifyError(
    error: unknown,
    request: NextRequest,
    context?: {
      userId?: string;
      sessionId?: string;
      additionalContext?: any;
    }
  ): ApiError {
    let type = ErrorType.UNKNOWN_ERROR;
    let message = 'An unknown error occurred';
    let code = 'UNKNOWN_ERROR';
    let statusCode = 500;
    let severity = ErrorSeverity.CRITICAL;
    let retryable = false;
    let suggestedAction: string | undefined;
    let details: any;

    // Classify the error
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // Validation errors
      if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
        type = ErrorType.VALIDATION_ERROR;
        message = 'Invalid input data';
        code = 'VALIDATION_FAILED';
      }
      // Authentication errors
      else if (errorMessage.includes('unauthorized') || errorMessage.includes('auth')) {
        type = ErrorType.AUTHENTICATION_ERROR;
        message = 'Authentication required';
        code = 'AUTHENTICATION_FAILED';
      }
      // Not found errors
      else if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        type = ErrorType.NOT_FOUND_ERROR;
        message = 'Resource not found';
        code = 'RESOURCE_NOT_FOUND';
      }
      // Timeout errors
      else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        type = ErrorType.TIMEOUT_ERROR;
        message = 'Request timed out';
        code = 'REQUEST_TIMEOUT';
        retryable = true;
        suggestedAction = 'Try again in a few moments';
      }
      // Network errors
      else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        type = ErrorType.NETWORK_ERROR;
        message = 'Network connection error';
        code = 'NETWORK_ERROR';
        retryable = true;
      }
      // Rate limit errors
      else if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
        type = ErrorType.RATE_LIMIT_ERROR;
        message = 'Rate limit exceeded';
        code = 'RATE_LIMIT_EXCEEDED';
        retryable = true;
        suggestedAction = 'Wait before making more requests';
      }
      // External API errors
      else if (errorMessage.includes('api') || errorMessage.includes('external')) {
        type = ErrorType.EXTERNAL_API_ERROR;
        message = 'External service error';
        code = 'EXTERNAL_API_ERROR';
        retryable = true;
      }
      // AI service errors
      else if (
        errorMessage.includes('ai') ||
        errorMessage.includes('openai') ||
        errorMessage.includes('groq')
      ) {
        type = ErrorType.AI_SERVICE_ERROR;
        message = 'AI service temporarily unavailable';
        code = 'AI_SERVICE_ERROR';
        retryable = true;
      }
      // Database errors
      else if (
        errorMessage.includes('database') ||
        errorMessage.includes('db') ||
        errorMessage.includes('redis')
      ) {
        type = ErrorType.DATABASE_ERROR;
        message = 'Database service error';
        code = 'DATABASE_ERROR';
        retryable = true;
      }
      // Cache errors
      else if (errorMessage.includes('cache') || errorMessage.includes('upstash')) {
        type = ErrorType.CACHE_ERROR;
        message = 'Cache service error';
        code = 'CACHE_ERROR';
        retryable = true;
      }
      // Configuration errors
      else if (errorMessage.includes('config') || errorMessage.includes('environment')) {
        type = ErrorType.CONFIGURATION_ERROR;
        message = 'Configuration error';
        code = 'CONFIGURATION_ERROR';
      }
      // Default to internal error
      else {
        type = ErrorType.INTERNAL_ERROR;
        message = 'Internal server error';
        code = 'INTERNAL_ERROR';
      }

      details = {
        originalMessage: error.message,
        name: error.name,
        ...context?.additionalContext,
      };
    }

    // Get configuration for this error type
    const config = ERROR_CONFIG.ERROR_TYPES[type];
    statusCode = config.statusCode;
    severity = config.severity;
    retryable = config.retryable;
    suggestedAction = suggestedAction || config.userMessage;

    return {
      type,
      message,
      code,
      statusCode,
      severity,
      details,
      context: {
        userId: context?.userId,
        sessionId: context?.sessionId,
        requestId: this.requestId,
        endpoint: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent') || undefined,
        ip: this.getClientIP(request),
      },
      stack:
        ERROR_CONFIG.INCLUDE_STACK_IN_RESPONSE && error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error : undefined,
      retryable,
      suggestedAction,
    };
  }

  /**
   * Create error response
   */
  private createErrorResponse(apiError: ApiError): NextResponse<ErrorResponse> {
    const response: ErrorResponse = {
      success: false,
      error: {
        type: apiError.type,
        message: apiError.message,
        code: apiError.code,
        details: this.sanitizeDetails(apiError.details),
        requestId: this.requestId,
        timestamp: apiError.context!.timestamp,
        retryable: apiError.retryable,
        suggestedAction: apiError.suggestedAction,
      },
    };

    return NextResponse.json(response, {
      status: apiError.statusCode,
      headers: {
        'X-Request-ID': this.requestId,
        'X-Error-Type': apiError.type,
        'X-Error-Code': apiError.code,
        'Retry-After': apiError.retryable ? '60' : undefined,
      },
    });
  }

  /**
   * Log error with appropriate level
   */
  private logError(apiError: ApiError): void {
    if (!ERROR_CONFIG.LOG_ERRORS) return;

    const logData = {
      level: this.getLogLevel(apiError.severity),
      message: apiError.message,
      error: {
        type: apiError.type,
        code: apiError.code,
        statusCode: apiError.statusCode,
        severity: apiError.severity,
        retryable: apiError.retryable,
        context: apiError.context,
        details: apiError.details,
        stack: apiError.stack,
      },
    };

    switch (apiError.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('[CRITICAL ERROR]', logData);
        break;
      case ErrorSeverity.HIGH:
        console.error('[HIGH ERROR]', logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('[MEDIUM ERROR]', logData);
        break;
      case ErrorSeverity.LOW:
      default:
        console.info('[LOW ERROR]', logData);
        break;
    }
  }

  /**
   * Check if error should trigger alerts
   */
  private checkAlertThresholds(apiError: ApiError): void {
    // This would typically integrate with a monitoring service
    // For now, just log critical errors
    if (apiError.severity === ErrorSeverity.CRITICAL) {
      console.error('[ALERT] Critical error detected:', {
        type: apiError.type,
        code: apiError.code,
        requestId: this.requestId,
        context: apiError.context,
      });
    }
  }

  /**
   * Sanitize error details for response
   */
  private sanitizeDetails(details: any): any {
    if (!details) return undefined;

    // Remove sensitive information
    const sanitized = { ...details };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.apiKey;
    delete sanitized.secret;

    // Limit size
    const detailsString = JSON.stringify(sanitized);
    if (detailsString.length > ERROR_CONFIG.MAX_ERROR_DETAILS_LENGTH) {
      return { message: 'Error details too large to include' };
    }

    return sanitized;
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string | undefined {
    return (
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'
    )
      .split(',')[0]
      .trim();
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get log level from severity
   */
  private getLogLevel(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'error';
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'info';
    }
  }
}

/**
 * Global error handler instance
 */
export const errorHandler = new ErrorHandler();

/**
 * Convenience functions for common error handling patterns
 */

/**
 * Create a validation error
 */
export function createValidationError(message: string, details?: any): ApiError {
  return {
    type: ErrorType.VALIDATION_ERROR,
    message,
    code: 'VALIDATION_ERROR',
    statusCode: 400,
    severity: ErrorSeverity.MEDIUM,
    details,
    context: {
      requestId: 'unknown',
      endpoint: 'unknown',
      method: 'unknown',
      timestamp: new Date().toISOString(),
    },
    retryable: false,
  };
}

/**
 * Create a not found error
 */
export function createNotFoundError(resource: string): ApiError {
  return {
    type: ErrorType.NOT_FOUND_ERROR,
    message: `${resource} not found`,
    code: 'NOT_FOUND',
    statusCode: 404,
    severity: ErrorSeverity.LOW,
    context: {
      requestId: 'unknown',
      endpoint: 'unknown',
      method: 'unknown',
      timestamp: new Date().toISOString(),
    },
    retryable: false,
  };
}

/**
 * Create a timeout error
 */
export function createTimeoutError(operation: string): ApiError {
  return {
    type: ErrorType.TIMEOUT_ERROR,
    message: `${operation} timed out`,
    code: 'TIMEOUT',
    statusCode: 504,
    severity: ErrorSeverity.MEDIUM,
    context: {
      requestId: 'unknown',
      endpoint: 'unknown',
      method: 'unknown',
      timestamp: new Date().toISOString(),
    },
    retryable: true,
    suggestedAction: 'Try again in a few moments',
  };
}

/**
 * Wrap route handler with error handling
 */
export function withErrorHandler<T extends any[], R>(handler: (...args: T) => Promise<R> | R) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const errorHandler = new ErrorHandler();
    return errorHandler.wrapHandler(handler, request)(request, ...args);
  };
}

/**
 * Export types
 */
export type { ApiError, ErrorResponse, SuccessResponse };

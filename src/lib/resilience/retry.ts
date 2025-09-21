/**
 * Agent Timeout and Retry Mechanisms
 * Intelligent retry logic with exponential backoff and circuit breaker patterns
 */

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  // Retry policies by operation type
  POLICIES: {
    AI_AGENT: {
      maxAttempts: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffMultiplier: 2,
      jitter: true,
      timeout: 60000, // 60 seconds per attempt
    },
    SEARCH_PROVIDER: {
      maxAttempts: 2,
      baseDelay: 500, // 0.5 seconds
      maxDelay: 10000, // 10 seconds
      backoffMultiplier: 1.5,
      jitter: true,
      timeout: 15000, // 15 seconds per attempt
    },
    CACHE_OPERATION: {
      maxAttempts: 1,
      baseDelay: 100, // 0.1 seconds
      maxDelay: 1000, // 1 second
      backoffMultiplier: 2,
      jitter: false,
      timeout: 5000, // 5 seconds per attempt
    },
    DATABASE_OPERATION: {
      maxAttempts: 2,
      baseDelay: 200, // 0.2 seconds
      maxDelay: 5000, // 5 seconds
      backoffMultiplier: 2,
      jitter: true,
      timeout: 10000, // 10 seconds per attempt
    },
    EXTERNAL_API: {
      maxAttempts: 2,
      baseDelay: 1000, // 1 second
      maxDelay: 20000, // 20 seconds
      backoffMultiplier: 2,
      jitter: true,
      timeout: 30000, // 30 seconds per attempt
    },
  },

  // Circuit breaker settings
  CIRCUIT_BREAKER: {
    failureThreshold: 5, // failures before opening
    recoveryTimeout: 60000, // 1 minute before trying again
    monitoringPeriod: 60000, // 1 minute window for failure counting
  },

  // Global settings
  ENABLE_CIRCUIT_BREAKER: true,
  ENABLE_METRICS: true,
  LOG_RETRY_ATTEMPTS: true,
} as const;

/**
 * Retry policy interface
 */
export interface RetryPolicy {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  timeout: number;
}

/**
 * Retry attempt information
 */
export interface RetryAttempt {
  attempt: number;
  maxAttempts: number;
  delay: number;
  timeout: number;
  error?: Error;
  startTime: number;
  endTime?: number;
}

/**
 * Retry result
 */
export interface RetryResult<T> {
  success: boolean;
  result?: T;
  attempts: RetryAttempt[];
  totalDuration: number;
  finalError?: Error;
  circuitBreakerOpened?: boolean;
}

/**
 * Circuit breaker state
 */
export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open',
}

/**
 * Circuit breaker metrics
 */
export interface CircuitBreakerMetrics {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  nextAttemptTime?: number;
}

/**
 * Operation type for retry policies
 */
export type OperationType =
  | 'AI_AGENT'
  | 'SEARCH_PROVIDER'
  | 'CACHE_OPERATION'
  | 'DATABASE_OPERATION'
  | 'EXTERNAL_API';

/**
 * Retry Manager
 * Handles retry logic with exponential backoff and circuit breaker patterns
 */
export class RetryManager {
  private circuitBreakers: Map<string, CircuitBreakerMetrics> = new Map();
  private metrics: Map<string, { attempts: number; successes: number; failures: number }> =
    new Map();

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationType: OperationType,
    operationKey?: string,
    customPolicy?: Partial<RetryPolicy>
  ): Promise<RetryResult<T>> {
    const policy = { ...RETRY_CONFIG.POLICIES[operationType], ...customPolicy };
    const key = operationKey || operationType;
    const attempts: RetryAttempt[] = [];
    const startTime = Date.now();

    // Check circuit breaker
    if (RETRY_CONFIG.ENABLE_CIRCUIT_BREAKER && this.isCircuitBreakerOpen(key)) {
      return {
        success: false,
        attempts,
        totalDuration: Date.now() - startTime,
        circuitBreakerOpened: true,
        finalError: new Error(`Circuit breaker is open for ${key}`),
      };
    }

    for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
      const attemptStartTime = Date.now();
      const delay = this.calculateDelay(attempt, policy);
      const timeout = policy.timeout;

      // Wait for delay (skip for first attempt)
      if (attempt > 1 && delay > 0) {
        await this.delay(delay);
      }

      const attemptInfo: RetryAttempt = {
        attempt,
        maxAttempts: policy.maxAttempts,
        delay,
        timeout,
        startTime: attemptStartTime,
      };

      try {
        // Execute with timeout
        const result = await this.executeWithTimeout(operation, timeout);

        attemptInfo.endTime = Date.now();

        // Success - update circuit breaker and metrics
        this.recordSuccess(key);
        this.updateMetrics(key, true);

        attempts.push(attemptInfo);

        if (RETRY_CONFIG.LOG_RETRY_ATTEMPTS) {
          console.log(`[RETRY] Success on attempt ${attempt}/${policy.maxAttempts} for ${key}`);
        }

        return {
          success: true,
          result,
          attempts,
          totalDuration: Date.now() - startTime,
        };
      } catch (error) {
        attemptInfo.endTime = Date.now();
        attemptInfo.error = error instanceof Error ? error : new Error(String(error));

        attempts.push(attemptInfo);

        // Check if error is retryable
        if (!this.isRetryableError(error, operationType)) {
          if (RETRY_CONFIG.LOG_RETRY_ATTEMPTS) {
            console.log(
              `[RETRY] Non-retryable error on attempt ${attempt}/${policy.maxAttempts} for ${key}:`,
              error
            );
          }
          break;
        }

        // Record failure for circuit breaker
        this.recordFailure(key);

        // Log retry attempt
        if (RETRY_CONFIG.LOG_RETRY_ATTEMPTS) {
          console.log(
            `[RETRY] Attempt ${attempt}/${policy.maxAttempts} failed for ${key}, retrying in ${delay}ms:`,
            error
          );
        }

        // If this was the last attempt, don't continue
        if (attempt === policy.maxAttempts) {
          this.updateMetrics(key, false);
          break;
        }
      }
    }

    // All attempts failed
    const finalError =
      attempts[attempts.length - 1]?.error || new Error('All retry attempts failed');

    return {
      success: false,
      attempts,
      totalDuration: Date.now() - startTime,
      finalError,
    };
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(operation: () => Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout)
      ),
    ]);
  }

  /**
   * Calculate delay for retry attempt using exponential backoff
   */
  private calculateDelay(attempt: number, policy: RetryPolicy): number {
    if (attempt === 1) return 0; // No delay for first attempt

    const exponentialDelay = policy.baseDelay * Math.pow(policy.backoffMultiplier, attempt - 2);
    const delay = Math.min(exponentialDelay, policy.maxDelay);

    // Add jitter if enabled
    if (policy.jitter) {
      const jitter = delay * 0.1 * Math.random(); // 10% jitter
      return Math.floor(delay + jitter);
    }

    return Math.floor(delay);
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown, operationType: OperationType): boolean {
    if (!(error instanceof Error)) return false;

    const errorMessage = error.message.toLowerCase();

    // Network and timeout errors are generally retryable
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('ECONNRESET') ||
      errorMessage.includes('ENOTFOUND')
    ) {
      return true;
    }

    // Rate limit errors are retryable with backoff
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
      return true;
    }

    // Service unavailable errors are retryable
    if (
      errorMessage.includes('service unavailable') ||
      errorMessage.includes('temporarily unavailable') ||
      errorMessage.includes('502') ||
      errorMessage.includes('503') ||
      errorMessage.includes('504')
    ) {
      return true;
    }

    // For AI agents, retry on specific errors
    if (operationType === 'AI_AGENT') {
      if (
        errorMessage.includes('overloaded') ||
        errorMessage.includes('capacity') ||
        errorMessage.includes('try again')
      ) {
        return true;
      }
    }

    // For external APIs, retry on server errors
    if (operationType === 'EXTERNAL_API') {
      if (errorMessage.includes('500') || errorMessage.includes('internal server error')) {
        return true;
      }
    }

    // Default to not retryable for unknown errors
    return false;
  }

  /**
   * Circuit breaker methods
   */

  private isCircuitBreakerOpen(key: string): boolean {
    const breaker = this.circuitBreakers.get(key);
    if (!breaker) return false;

    switch (breaker.state) {
      case CircuitState.OPEN:
        // Check if we should transition to half-open
        if (breaker.nextAttemptTime && Date.now() >= breaker.nextAttemptTime) {
          breaker.state = CircuitState.HALF_OPEN;
          return false;
        }
        return true;

      case CircuitState.HALF_OPEN:
        return false;

      case CircuitState.CLOSED:
      default:
        return false;
    }
  }

  private recordSuccess(key: string): void {
    const breaker = this.getOrCreateBreaker(key);

    breaker.successCount++;
    breaker.lastSuccessTime = Date.now();

    // Reset failure count on success
    breaker.failureCount = 0;

    // Close circuit if it was half-open
    if (breaker.state === CircuitState.HALF_OPEN) {
      breaker.state = CircuitState.CLOSED;
    }
  }

  private recordFailure(key: string): void {
    const breaker = this.getOrCreateBreaker(key);

    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();

    // Check if we should open the circuit
    if (breaker.failureCount >= RETRY_CONFIG.CIRCUIT_BREAKER.failureThreshold) {
      breaker.state = CircuitState.OPEN;
      breaker.nextAttemptTime = Date.now() + RETRY_CONFIG.CIRCUIT_BREAKER.recoveryTimeout;
    }
  }

  private getOrCreateBreaker(key: string): CircuitBreakerMetrics {
    let breaker = this.circuitBreakers.get(key);
    if (!breaker) {
      breaker = {
        state: CircuitState.CLOSED,
        failureCount: 0,
        successCount: 0,
      };
      this.circuitBreakers.set(key, breaker);
    }
    return breaker;
  }

  /**
   * Metrics methods
   */

  private updateMetrics(key: string, success: boolean): void {
    if (!RETRY_CONFIG.ENABLE_METRICS) return;

    let metric = this.metrics.get(key);
    if (!metric) {
      metric = { attempts: 0, successes: 0, failures: 0 };
      this.metrics.set(key, metric);
    }

    metric.attempts++;
    if (success) {
      metric.successes++;
    } else {
      metric.failures++;
    }
  }

  /**
   * Get retry statistics
   */
  getRetryStatistics(): {
    circuitBreakers: Map<string, CircuitBreakerMetrics>;
    metrics: Map<
      string,
      { attempts: number; successes: number; failures: number; successRate: number }
    >;
  } {
    const enhancedMetrics = new Map<
      string,
      { attempts: number; successes: number; failures: number; successRate: number }
    >();

    for (const [key, metric] of this.metrics) {
      const successRate = metric.attempts > 0 ? metric.successes / metric.attempts : 0;
      enhancedMetrics.set(key, {
        ...metric,
        successRate,
      });
    }

    return {
      circuitBreakers: new Map(this.circuitBreakers),
      metrics: enhancedMetrics,
    };
  }

  /**
   * Reset circuit breaker for a key
   */
  resetCircuitBreaker(key: string): void {
    this.circuitBreakers.delete(key);
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers(): void {
    this.circuitBreakers.clear();
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Health check for retry system
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    circuitBreakersOpen: number;
    totalOperations: number;
    overallSuccessRate: number;
  }> {
    const stats = this.getRetryStatistics();
    const circuitBreakersOpen = Array.from(stats.circuitBreakers.values()).filter(
      (cb) => cb.state === CircuitState.OPEN
    ).length;

    const totalOperations = Array.from(stats.metrics.values()).reduce(
      (sum, metric) => sum + metric.attempts,
      0
    );

    const weightedSuccessRate =
      Array.from(stats.metrics.values()).reduce(
        (sum, metric) => sum + metric.successRate * metric.attempts,
        0
      ) / Math.max(totalOperations, 1);

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (circuitBreakersOpen > 0) {
      status = 'degraded';
    }

    if (weightedSuccessRate < 0.5 || circuitBreakersOpen > 2) {
      status = 'unhealthy';
    }

    return {
      status,
      circuitBreakersOpen,
      totalOperations,
      overallSuccessRate: weightedSuccessRate,
    };
  }
}

/**
 * Global retry manager instance
 */
export const retryManager = new RetryManager();

/**
 * Convenience functions for common retry operations
 */

/**
 * Execute AI agent operation with retry
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationType: OperationType,
  operationKey?: string,
  customPolicy?: Partial<RetryPolicy>
): Promise<RetryResult<T>> {
  return retryManager.executeWithRetry(operation, operationType, operationKey, customPolicy);
}

/**
 * Execute AI agent with automatic retry
 */
export async function executeAIAgentWithRetry<T>(
  agentOperation: () => Promise<T>,
  agentName: string
): Promise<RetryResult<T>> {
  return retryManager.executeWithRetry(agentOperation, 'AI_AGENT', `agent_${agentName}`, {
    maxAttempts: 3,
    timeout: 60000, // 60 seconds for AI operations
  });
}

/**
 * Execute search provider with retry
 */
export async function executeSearchWithRetry<T>(
  searchOperation: () => Promise<T>,
  providerName: string
): Promise<RetryResult<T>> {
  return retryManager.executeWithRetry(
    searchOperation,
    'SEARCH_PROVIDER',
    `search_${providerName}`,
    {
      maxAttempts: 2,
      timeout: 15000, // 15 seconds for search operations
    }
  );
}

/**
 * Execute external API call with retry
 */
export async function executeAPIWithRetry<T>(
  apiOperation: () => Promise<T>,
  apiName: string
): Promise<RetryResult<T>> {
  return retryManager.executeWithRetry(apiOperation, 'EXTERNAL_API', `api_${apiName}`, {
    maxAttempts: 2,
    timeout: 30000, // 30 seconds for API operations
  });
}

/**
 * Get retry statistics
 */
export function getRetryStatistics() {
  return retryManager.getRetryStatistics();
}

/**
 * Reset circuit breaker
 */
export function resetCircuitBreaker(key: string): void {
  retryManager.resetCircuitBreaker(key);
}

/**
 * Export types
 */

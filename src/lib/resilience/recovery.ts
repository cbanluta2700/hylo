/**
 * Workflow Error Recovery
 * Intelligent recovery strategies for multi-agent workflow failures
 */

import { retryManager } from './retry';
import { ProviderFailover } from './failover';
import { ErrorHandler } from '../middleware/error-handler';

/**
 * Recovery configuration
 */
export const RECOVERY_CONFIG = {
  // Recovery strategies
  STRATEGIES: {
    AGENT_FAILURE: {
      maxRecoveryAttempts: 2,
      fallbackAgents: true,
      degradeFunctionality: true,
      partialResults: true,
    },
    PROVIDER_FAILURE: {
      maxRecoveryAttempts: 3,
      switchProviders: true,
      reduceQuality: true,
      cacheFallback: true,
    },
    WORKFLOW_FAILURE: {
      maxRecoveryAttempts: 1,
      restartWorkflow: true,
      skipFailedSteps: true,
      useDefaults: true,
    },
    SYSTEM_FAILURE: {
      maxRecoveryAttempts: 0, // No recovery for system failures
      gracefulShutdown: true,
      notifyAdmins: true,
    },
  },

  // Recovery timeouts
  TIMEOUTS: {
    AGENT_RECOVERY: 30000, // 30 seconds
    PROVIDER_RECOVERY: 45000, // 45 seconds
    WORKFLOW_RECOVERY: 60000, // 1 minute
    SYSTEM_RECOVERY: 0, // No recovery
  },

  // Recovery priorities
  PRIORITIES: {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4,
  },

  // Fallback data sources
  FALLBACK_SOURCES: {
    CACHE: 'cache',
    DEFAULTS: 'defaults',
    MOCK_DATA: 'mock',
    STATIC_CONTENT: 'static',
  },
} as const;

/**
 * Recovery strategy type
 */
export type RecoveryStrategy =
  | 'AGENT_FAILURE'
  | 'PROVIDER_FAILURE'
  | 'WORKFLOW_FAILURE'
  | 'SYSTEM_FAILURE';

/**
 * Recovery context
 */
export interface RecoveryContext {
  workflowId: string;
  stepId: string;
  operationType: string;
  attemptNumber: number;
  maxAttempts: number;
  error: Error;
  previousResults?: any[];
  workflowState?: any;
  startTime: number;
}

/**
 * Recovery result
 */
export interface RecoveryResult {
  success: boolean;
  recovered: boolean;
  result?: any;
  fallbackUsed?: string;
  degraded: boolean;
  attempts: number;
  duration: number;
  nextAction?: 'continue' | 'retry' | 'fail' | 'restart';
  error?: Error;
  warnings?: string[];
}

/**
 * Recovery action
 */
export interface RecoveryAction {
  type: 'retry' | 'fallback' | 'degrade' | 'skip' | 'restart' | 'fail';
  priority: number;
  description: string;
  execute: (context: RecoveryContext) => Promise<RecoveryResult>;
  canExecute: (context: RecoveryContext) => boolean;
}

/**
 * Workflow Recovery Manager
 * Handles intelligent recovery from workflow failures
 */
export class WorkflowRecoveryManager {
  private errorHandler: ErrorHandler;
  private providerFailover: ProviderFailover | undefined;
  private recoveryActions: Map<RecoveryStrategy, RecoveryAction[]> = new Map();

  constructor(providerFailover?: ProviderFailover) {
    this.errorHandler = new ErrorHandler();
    this.providerFailover = providerFailover;
    this.initializeRecoveryActions();
  }

  /**
   * Attempt to recover from a workflow failure
   */
  async attemptRecovery(
    context: RecoveryContext,
    strategy: RecoveryStrategy = 'WORKFLOW_FAILURE'
  ): Promise<RecoveryResult> {
    const startTime = Date.now();
    const config = RECOVERY_CONFIG.STRATEGIES[strategy];
    const actions = this.recoveryActions.get(strategy) || [];

    // Check if recovery is allowed
    if (context.attemptNumber >= config.maxRecoveryAttempts) {
      return {
        success: false,
        recovered: false,
        degraded: false,
        attempts: context.attemptNumber,
        duration: Date.now() - startTime,
        nextAction: 'fail',
        error: new Error(`Max recovery attempts (${config.maxRecoveryAttempts}) exceeded`),
      };
    }

    // Try recovery actions in priority order
    for (const action of actions) {
      if (!action.canExecute(context)) continue;

      try {
        console.log(
          `[RECOVERY] Attempting ${action.type} recovery for ${context.workflowId}:${context.stepId}`
        );

        const result = await this.executeWithTimeout(
          () => action.execute(context),
          (() => {
            const timeoutKey = strategy.replace(
              '_FAILURE',
              '_RECOVERY'
            ) as keyof typeof RECOVERY_CONFIG.TIMEOUTS;
            return RECOVERY_CONFIG.TIMEOUTS[timeoutKey] || 30000;
          })()
        );

        if (result.success) {
          console.log(`[RECOVERY] Recovery successful for ${context.workflowId}:${context.stepId}`);
          return {
            ...result,
            attempts: context.attemptNumber + 1,
            duration: Date.now() - startTime,
          };
        }
      } catch (error) {
        console.warn(`[RECOVERY] Recovery action ${action.type} failed:`, error);
        // Continue to next action
      }
    }

    // All recovery actions failed
    return {
      success: false,
      recovered: false,
      degraded: false,
      attempts: context.attemptNumber + 1,
      duration: Date.now() - startTime,
      nextAction: 'fail',
      error: new Error(`All recovery strategies failed for ${strategy}`),
    };
  }

  /**
   * Initialize recovery actions for each strategy
   */
  private initializeRecoveryActions(): void {
    // Agent failure recovery
    this.recoveryActions.set('AGENT_FAILURE', [
      {
        type: 'retry',
        priority: RECOVERY_CONFIG.PRIORITIES.HIGH,
        description: 'Retry agent operation with backoff',
        canExecute: (ctx) => ctx.attemptNumber < 3,
        execute: async (ctx) => {
          // Use retry manager for agent operations
          const retryResult = await retryManager.executeWithRetry(
            () => this.retryAgentOperation(ctx),
            'AI_AGENT',
            `agent_${ctx.operationType}`,
            { maxAttempts: 1, timeout: 30000 }
          );

          return {
            success: retryResult.success,
            recovered: retryResult.success,
            result: retryResult.result,
            degraded: false,
            attempts: retryResult.attempts.length,
            duration: retryResult.totalDuration,
            nextAction: retryResult.success ? 'continue' : 'fail',
          };
        },
      },
      {
        type: 'fallback',
        priority: RECOVERY_CONFIG.PRIORITIES.MEDIUM,
        description: 'Use fallback agent or cached results',
        canExecute: () => true,
        execute: async (ctx) => {
          const fallbackResult = await this.useFallbackAgent(ctx);
          return {
            success: !!fallbackResult,
            recovered: !!fallbackResult,
            result: fallbackResult,
            fallbackUsed: 'fallback_agent',
            degraded: true,
            attempts: 1,
            duration: 0,
            nextAction: fallbackResult ? 'continue' : 'fail',
            warnings: ['Used fallback agent - results may be less accurate'],
          };
        },
      },
      {
        type: 'degrade',
        priority: RECOVERY_CONFIG.PRIORITIES.LOW,
        description: 'Continue with partial results',
        canExecute: (ctx) => !!ctx.previousResults && ctx.previousResults.length > 0,
        execute: async (ctx) => {
          return {
            success: true,
            recovered: true,
            result: ctx.previousResults,
            degraded: true,
            attempts: 1,
            duration: 0,
            nextAction: 'continue',
            warnings: ['Continuing with partial results - some data may be missing'],
          };
        },
      },
    ]);

    // Provider failure recovery
    this.recoveryActions.set('PROVIDER_FAILURE', [
      {
        type: 'retry',
        priority: RECOVERY_CONFIG.PRIORITIES.HIGH,
        description: 'Retry with different provider',
        canExecute: () => !!this.providerFailover,
        execute: async (ctx) => {
          if (!this.providerFailover) {
            throw new Error('Provider failover not configured');
          }

          // This would need to be implemented based on the specific provider operation
          // For now, return a mock successful recovery
          return {
            success: true,
            recovered: true,
            result: { fallback: true, provider: 'fallback_provider' },
            degraded: false,
            attempts: 1,
            duration: 0,
            nextAction: 'continue',
          };
        },
      },
      {
        type: 'fallback',
        priority: RECOVERY_CONFIG.PRIORITIES.MEDIUM,
        description: 'Use cached data or defaults',
        canExecute: () => true,
        execute: async (ctx) => {
          const cachedResult = await this.useCachedData(ctx);
          return {
            success: !!cachedResult,
            recovered: !!cachedResult,
            result: cachedResult,
            fallbackUsed: RECOVERY_CONFIG.FALLBACK_SOURCES.CACHE,
            degraded: true,
            attempts: 1,
            duration: 0,
            nextAction: cachedResult ? 'continue' : 'fail',
            warnings: ['Using cached data - may not be current'],
          };
        },
      },
    ]);

    // Workflow failure recovery
    this.recoveryActions.set('WORKFLOW_FAILURE', [
      {
        type: 'restart',
        priority: RECOVERY_CONFIG.PRIORITIES.HIGH,
        description: 'Restart workflow from beginning',
        canExecute: (ctx) => ctx.attemptNumber === 1,
        execute: async (ctx) => {
          // This would trigger a workflow restart
          return {
            success: true,
            recovered: true,
            result: { restarted: true, workflowId: ctx.workflowId },
            degraded: false,
            attempts: 1,
            duration: 0,
            nextAction: 'restart',
          };
        },
      },
      {
        type: 'skip',
        priority: RECOVERY_CONFIG.PRIORITIES.MEDIUM,
        description: 'Skip failed step and continue',
        canExecute: (ctx) => ctx.stepId !== 'critical_step', // Don't skip critical steps
        execute: async (ctx) => {
          return {
            success: true,
            recovered: true,
            result: { skipped: ctx.stepId, continued: true },
            degraded: true,
            attempts: 1,
            duration: 0,
            nextAction: 'continue',
            warnings: [`Skipped step ${ctx.stepId} - workflow may be incomplete`],
          };
        },
      },
      {
        type: 'degrade',
        priority: RECOVERY_CONFIG.PRIORITIES.LOW,
        description: 'Use default values for missing data',
        canExecute: () => true,
        execute: async (ctx) => {
          const defaultResult = this.useDefaultValues(ctx);
          return {
            success: true,
            recovered: true,
            result: defaultResult,
            fallbackUsed: RECOVERY_CONFIG.FALLBACK_SOURCES.DEFAULTS,
            degraded: true,
            attempts: 1,
            duration: 0,
            nextAction: 'continue',
            warnings: ['Using default values - results may be generic'],
          };
        },
      },
    ]);

    // System failure recovery (minimal)
    this.recoveryActions.set('SYSTEM_FAILURE', [
      {
        type: 'fail',
        priority: RECOVERY_CONFIG.PRIORITIES.CRITICAL,
        description: 'System failure - no recovery possible',
        canExecute: () => true,
        execute: async (ctx) => {
          // Log critical error and prepare for graceful shutdown
          console.error('[SYSTEM FAILURE] Critical system error:', ctx.error);
          return {
            success: false,
            recovered: false,
            degraded: false,
            attempts: 1,
            duration: 0,
            nextAction: 'fail',
            error: ctx.error,
          };
        },
      },
    ]);
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(operation: () => Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Recovery operation timed out after ${timeout}ms`)),
          timeout
        )
      ),
    ]);
  }

  /**
   * Retry agent operation (placeholder implementation)
   */
  private async retryAgentOperation(context: RecoveryContext): Promise<any> {
    // This would implement the actual agent retry logic
    // For now, simulate a successful retry
    await this.delay(1000); // Simulate network delay
    return { retried: true, agent: context.operationType };
  }

  /**
   * Use fallback agent (placeholder implementation)
   */
  private async useFallbackAgent(_context: RecoveryContext): Promise<any> {
    // This would implement fallback agent logic
    // For now, return mock fallback data
    await this.delay(500);
    return {
      fallback: true,
      agent: 'fallback_agent',
      data: 'Fallback agent response',
    };
  }

  /**
   * Use cached data (placeholder implementation)
   */
  private async useCachedData(_context: RecoveryContext): Promise<any> {
    // This would check cache for similar previous results
    // For now, return mock cached data
    await this.delay(200);
    return {
      cached: true,
      timestamp: new Date().toISOString(),
      data: 'Cached response data',
    };
  }

  /**
   * Use default values (placeholder implementation)
   */
  private useDefaultValues(context: RecoveryContext): any {
    // Return default values based on operation type
    switch (context.operationType) {
      case 'itinerary_generation':
        return {
          title: 'Default Travel Itinerary',
          destination: 'Unknown Destination',
          duration: { days: 7, nights: 6 },
          overview: 'A default travel itinerary has been generated.',
          highlights: ['Default highlight 1', 'Default highlight 2'],
        };
      case 'search':
        return {
          results: [],
          message: 'No search results available',
        };
      default:
        return {
          default: true,
          operation: context.operationType,
          message: 'Default response generated',
        };
    }
  }

  /**
   * Determine recovery strategy based on error
   */
  determineRecoveryStrategy(error: Error, _operationType: string): RecoveryStrategy {
    const errorMessage = error.message.toLowerCase();

    // System-level failures
    if (
      errorMessage.includes('out of memory') ||
      errorMessage.includes('database connection') ||
      errorMessage.includes('configuration')
    ) {
      return 'SYSTEM_FAILURE';
    }

    // Agent failures
    if (
      errorMessage.includes('agent') ||
      errorMessage.includes('ai service') ||
      errorMessage.includes('model')
    ) {
      return 'AGENT_FAILURE';
    }

    // Provider failures
    if (
      errorMessage.includes('provider') ||
      errorMessage.includes('search') ||
      errorMessage.includes('api')
    ) {
      return 'PROVIDER_FAILURE';
    }

    // Default to workflow failure
    return 'WORKFLOW_FAILURE';
  }

  /**
   * Create recovery context from error
   */
  createRecoveryContext(
    workflowId: string,
    stepId: string,
    operationType: string,
    error: Error,
    attemptNumber: number = 1,
    previousResults?: any[],
    workflowState?: any
  ): RecoveryContext {
    return {
      workflowId,
      stepId,
      operationType,
      attemptNumber,
      maxAttempts: RECOVERY_CONFIG.STRATEGIES.WORKFLOW_FAILURE.maxRecoveryAttempts,
      error,
      previousResults,
      workflowState,
      startTime: Date.now(),
    };
  }

  /**
   * Get recovery statistics
   */
  getRecoveryStatistics(): {
    totalRecoveries: number;
    successfulRecoveries: number;
    failedRecoveries: number;
    averageRecoveryTime: number;
    recoveryRate: number;
  } {
    // This would track actual recovery metrics
    // For now, return mock statistics
    return {
      totalRecoveries: 0,
      successfulRecoveries: 0,
      failedRecoveries: 0,
      averageRecoveryTime: 0,
      recoveryRate: 0,
    };
  }

  /**
   * Health check for recovery system
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    recoveryStrategiesAvailable: number;
    lastRecoveryAttempt?: number;
    error?: string;
  }> {
    try {
      const strategiesAvailable = this.recoveryActions.size;
      const hasRequiredStrategies = strategiesAvailable >= 3; // At least 3 strategies

      if (!hasRequiredStrategies) {
        return {
          status: 'unhealthy',
          recoveryStrategiesAvailable: strategiesAvailable,
          error: 'Insufficient recovery strategies configured',
        };
      }

      // Test a simple recovery action
      const testContext: RecoveryContext = {
        workflowId: 'health_check',
        stepId: 'test_step',
        operationType: 'test',
        attemptNumber: 1,
        maxAttempts: 1,
        error: new Error('Test error'),
        startTime: Date.now(),
      };

      await this.attemptRecovery(testContext, 'WORKFLOW_FAILURE');

      return {
        status: 'healthy',
        recoveryStrategiesAvailable: strategiesAvailable,
        lastRecoveryAttempt: Date.now(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        recoveryStrategiesAvailable: this.recoveryActions.size,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Global workflow recovery manager instance
 */
export const workflowRecoveryManager = new WorkflowRecoveryManager();

/**
 * Convenience functions for common recovery operations
 */

/**
 * Attempt workflow recovery
 */
export async function attemptWorkflowRecovery(
  context: RecoveryContext,
  strategy?: RecoveryStrategy
): Promise<RecoveryResult> {
  const recoveryStrategy =
    strategy ||
    workflowRecoveryManager.determineRecoveryStrategy(context.error, context.operationType);
  return workflowRecoveryManager.attemptRecovery(context, recoveryStrategy);
}

/**
 * Create recovery context
 */
export function createRecoveryContext(
  workflowId: string,
  stepId: string,
  operationType: string,
  error: Error,
  attemptNumber?: number,
  previousResults?: any[],
  workflowState?: any
): RecoveryContext {
  return workflowRecoveryManager.createRecoveryContext(
    workflowId,
    stepId,
    operationType,
    error,
    attemptNumber,
    previousResults,
    workflowState
  );
}

/**
 * Determine recovery strategy
 */
export function determineRecoveryStrategy(error: Error, operationType: string): RecoveryStrategy {
  return workflowRecoveryManager.determineRecoveryStrategy(error, operationType);
}

/**
 * Get recovery statistics
 */
export function getRecoveryStatistics() {
  return workflowRecoveryManager.getRecoveryStatistics();
}

/**
 * Export types
 */

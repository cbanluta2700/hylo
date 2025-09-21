/**
 * Search Provider Failover Logic
 * Intelligent failover and load balancing across multiple search providers
 */

import { SearchProvider, SearchRequest, SearchResultItem } from '../types/search-providers';

/**
 * Search query interface for failover operations
 */
export interface SearchQuery {
  query: string;
  type: 'text' | 'image' | 'structured' | 'neural';
  limit?: number;
  timeout?: number;
  options?: any;
}

/**
 * Search result interface for failover operations
 */
export type SearchResult = SearchResultItem;

/**
 * Provider health status
 */
export enum ProviderStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  MAINTENANCE = 'maintenance',
}

/**
 * Provider health metrics
 */
export interface ProviderHealth {
  provider: string;
  status: ProviderStatus;
  responseTime: number;
  successRate: number;
  errorCount: number;
  lastError?: string;
  lastSuccess: Date;
  lastFailure: Date;
  consecutiveFailures: number;
  totalRequests: number;
  totalErrors: number;
  averageResponseTime: number;
  circuitBreakerState: 'closed' | 'open' | 'half-open';
  lastHealthCheck: Date;
}

/**
 * Failover configuration
 */
export const FAILOVER_CONFIG = {
  // Health check settings
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
  HEALTH_CHECK_TIMEOUT: 5000, // 5 seconds
  MAX_CONSECUTIVE_FAILURES: 3,
  CIRCUIT_BREAKER_TIMEOUT: 60000, // 1 minute

  // Load balancing settings
  LOAD_BALANCE_STRATEGY: 'weighted-round-robin' as
    | 'round-robin'
    | 'weighted-round-robin'
    | 'least-loaded',
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  BACKOFF_MULTIPLIER: 2,

  // Provider weights (higher = more preferred)
  PROVIDER_WEIGHTS: {
    tavily: 100,
    exa: 90,
    serp: 80,
    'cruise-critic': 70,
  },

  // Fallback settings
  ENABLE_FALLBACK: true,
  FALLBACK_TIMEOUT: 10000, // 10 seconds
  MIN_PROVIDERS_REQUIRED: 1,

  // Quality thresholds
  MIN_SUCCESS_RATE: 0.8, // 80%
  MAX_RESPONSE_TIME: 5000, // 5 seconds
  MIN_RESULTS_REQUIRED: 1,
} as const;

/**
 * Failover strategy interface
 */
export interface FailoverStrategy {
  selectProvider(providers: SearchProvider[], query: SearchQuery): Promise<SearchProvider | null>;
  updateHealth(provider: string, success: boolean, responseTime: number, error?: string): void;
  getHealthStatus(): Map<string, ProviderHealth>;
}

/**
 * Search provider failover manager
 */
export class ProviderFailover implements FailoverStrategy {
  private healthMap: Map<string, ProviderHealth> = new Map();
  private providers: SearchProvider[] = [];
  private healthCheckInterval: NodeJS.Timeout | undefined;
  private isInitialized = false;

  constructor(providers: SearchProvider[]) {
    this.providers = providers;
    this.initializeHealthTracking();
    this.startHealthChecks();
  }

  /**
   * Initialize health tracking for all providers
   */
  private initializeHealthTracking(): void {
    for (const provider of this.providers) {
      this.healthMap.set(provider.name, {
        provider: provider.name,
        status: ProviderStatus.HEALTHY,
        responseTime: 0,
        successRate: 1.0,
        errorCount: 0,
        lastSuccess: new Date(),
        lastFailure: new Date(0),
        consecutiveFailures: 0,
        totalRequests: 0,
        totalErrors: 0,
        averageResponseTime: 0,
        circuitBreakerState: 'closed',
        lastHealthCheck: new Date(),
      });
    }
    this.isInitialized = true;
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, FAILOVER_CONFIG.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Stop health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * Select the best available provider for a query
   */
  async selectProvider(
    providers: SearchProvider[],
    query: SearchQuery
  ): Promise<SearchProvider | null> {
    if (!this.isInitialized) {
      throw new Error('ProviderFailover not initialized');
    }

    const availableProviders = this.getAvailableProviders(providers);

    if (availableProviders.length === 0) {
      console.warn('No healthy providers available for query:', query);
      return null;
    }

    switch (FAILOVER_CONFIG.LOAD_BALANCE_STRATEGY) {
      case 'weighted-round-robin':
        return this.selectWeightedRoundRobin(availableProviders);
      case 'least-loaded':
        return this.selectLeastLoaded(availableProviders);
      case 'round-robin':
      default:
        return this.selectRoundRobin(availableProviders);
    }
  }

  /**
   * Update provider health after a request
   */
  updateHealth(providerName: string, success: boolean, responseTime: number, error?: string): void {
    const health = this.healthMap.get(providerName);
    if (!health) return;

    health.totalRequests++;
    health.averageResponseTime =
      (health.averageResponseTime * (health.totalRequests - 1) + responseTime) /
      health.totalRequests;

    if (success) {
      health.lastSuccess = new Date();
      health.consecutiveFailures = 0;
      health.circuitBreakerState = 'closed';
      health.responseTime = responseTime;
    } else {
      health.lastFailure = new Date();
      health.consecutiveFailures++;
      health.totalErrors++;
      health.lastError = error || 'Unknown error';

      // Update circuit breaker
      if (health.consecutiveFailures >= FAILOVER_CONFIG.MAX_CONSECUTIVE_FAILURES) {
        health.circuitBreakerState = 'open';
        health.status = ProviderStatus.UNHEALTHY;
      }
    }

    // Update success rate
    health.successRate = (health.totalRequests - health.totalErrors) / health.totalRequests;

    // Update overall status
    this.updateProviderStatus(health);
  }

  /**
   * Get health status for all providers
   */
  getHealthStatus(): Map<string, ProviderHealth> {
    return new Map(this.healthMap);
  }

  /**
   * Execute search with automatic failover
   */
  async executeWithFailover(
    query: SearchQuery,
    providers: SearchProvider[]
  ): Promise<{ results: SearchResult[]; provider: string; attempts: number }> {
    let attempts = 0;
    let lastError: string | undefined;

    while (attempts < FAILOVER_CONFIG.MAX_RETRIES) {
      attempts++;

      const provider = await this.selectProvider(providers, query);
      if (!provider) {
        throw new Error(
          `No available providers after ${attempts} attempts. Last error: ${lastError}`
        );
      }

      try {
        const startTime = Date.now();
        const results = await this.executeWithTimeout(
          provider,
          query,
          FAILOVER_CONFIG.FALLBACK_TIMEOUT
        );
        const responseTime = Date.now() - startTime;

        this.updateHealth(provider.name, true, responseTime);

        return {
          results,
          provider: provider.name,
          attempts,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        lastError = errorMessage;

        this.updateHealth(provider.name, false, 0, errorMessage);

        // Wait before retry with exponential backoff
        if (attempts < FAILOVER_CONFIG.MAX_RETRIES) {
          const delay =
            FAILOVER_CONFIG.RETRY_DELAY *
            Math.pow(FAILOVER_CONFIG.BACKOFF_MULTIPLIER, attempts - 1);
          await this.delay(delay);
        }
      }
    }

    throw new Error(`All providers failed after ${attempts} attempts. Last error: ${lastError}`);
  }

  /**
   * Get available (healthy) providers
   */
  private getAvailableProviders(providers: SearchProvider[]): SearchProvider[] {
    return providers.filter((provider) => {
      const health = this.healthMap.get(provider.name);
      if (!health) return false;

      // Check circuit breaker
      if (health.circuitBreakerState === 'open') {
        // Check if circuit breaker should transition to half-open
        const timeSinceLastFailure = Date.now() - health.lastFailure.getTime();
        if (timeSinceLastFailure > FAILOVER_CONFIG.CIRCUIT_BREAKER_TIMEOUT) {
          health.circuitBreakerState = 'half-open';
        } else {
          health.status = ProviderStatus.UNHEALTHY;
          return false;
        }
      }

      // Allow half-open state for testing
      if (health.circuitBreakerState === 'half-open') {
        return true;
      }

      // Check health status
      return health.status === ProviderStatus.HEALTHY || health.status === ProviderStatus.DEGRADED;
    });
  }

  /**
   * Select provider using weighted round-robin
   */
  private selectWeightedRoundRobin(providers: SearchProvider[]): SearchProvider {
    // Calculate weights based on health and preferences
    const weightedProviders = providers.map((provider) => {
      const health = this.healthMap.get(provider.name)!;
      const baseWeight =
        FAILOVER_CONFIG.PROVIDER_WEIGHTS[
          provider.name as keyof typeof FAILOVER_CONFIG.PROVIDER_WEIGHTS
        ] || 50;

      // Adjust weight based on health
      let healthMultiplier = 1.0;
      if (health.status === ProviderStatus.DEGRADED) {
        healthMultiplier = 0.7;
      }

      // Adjust weight based on response time
      const responseTimeMultiplier = Math.max(
        0.5,
        Math.min(1.5, FAILOVER_CONFIG.MAX_RESPONSE_TIME / Math.max(health.averageResponseTime, 100))
      );

      return {
        provider,
        weight: baseWeight * healthMultiplier * responseTimeMultiplier,
      };
    });

    // Sort by weight (descending)
    weightedProviders.sort((a, b) => b.weight - a.weight);

    // Return the highest weighted provider
    return weightedProviders[0]?.provider || providers[0];
  }

  /**
   * Select provider using round-robin
   */
  private selectRoundRobin(providers: SearchProvider[]): SearchProvider {
    // Simple round-robin - in a real implementation, you'd track the last used provider
    return providers[0];
  }

  /**
   * Select least loaded provider
   */
  private selectLeastLoaded(providers: SearchProvider[]): SearchProvider {
    let bestProvider = providers[0];
    let bestLoad = Infinity;

    for (const provider of providers) {
      const health = this.healthMap.get(provider.name)!;
      const load = health.averageResponseTime * (1 - health.successRate);

      if (load < bestLoad) {
        bestLoad = load;
        bestProvider = provider;
      }
    }

    return bestProvider;
  }

  /**
   * Execute provider search with timeout
   */
  private async executeWithTimeout(
    provider: SearchProvider,
    query: SearchQuery,
    timeout: number
  ): Promise<SearchResult[]> {
    return Promise.race([
      provider.search(query),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Provider ${provider.name} timed out after ${timeout}ms`)),
          timeout
        )
      ),
    ]);
  }

  /**
   * Perform health checks on all providers
   */
  private async performHealthChecks(): Promise<void> {
    for (const provider of this.providers) {
      try {
        const health = this.healthMap.get(provider.name)!;
        const startTime = Date.now();

        // Perform a lightweight health check
        await this.performProviderHealthCheck(provider);

        const responseTime = Date.now() - startTime;
        this.updateHealth(provider.name, true, responseTime);
        health.lastHealthCheck = new Date();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Health check failed';
        this.updateHealth(provider.name, false, 0, errorMessage);
      }
    }
  }

  /**
   * Perform health check on a specific provider
   */
  private async performProviderHealthCheck(provider: SearchProvider): Promise<void> {
    // Create a minimal test query
    const testQuery: SearchQuery = {
      query: 'test health check',
      type: 'text',
      limit: 1,
      timeout: FAILOVER_CONFIG.HEALTH_CHECK_TIMEOUT,
    };

    await this.executeWithTimeout(provider, testQuery, FAILOVER_CONFIG.HEALTH_CHECK_TIMEOUT);
  }

  /**
   * Update provider status based on health metrics
   */
  private updateProviderStatus(health: ProviderHealth): void {
    // Check circuit breaker
    if (health.circuitBreakerState === 'open') {
      // Check if circuit breaker should transition to half-open
      const timeSinceLastFailure = Date.now() - health.lastFailure.getTime();
      if (timeSinceLastFailure > FAILOVER_CONFIG.CIRCUIT_BREAKER_TIMEOUT) {
        health.circuitBreakerState = 'half-open';
      } else {
        health.status = ProviderStatus.UNHEALTHY;
        return;
      }
    }

    // Determine status based on metrics
    if (health.successRate < FAILOVER_CONFIG.MIN_SUCCESS_RATE) {
      health.status = ProviderStatus.UNHEALTHY;
    } else if (health.averageResponseTime > FAILOVER_CONFIG.MAX_RESPONSE_TIME) {
      health.status = ProviderStatus.DEGRADED;
    } else {
      health.status = ProviderStatus.HEALTHY;
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get failover statistics
   */
  getStatistics(): {
    totalProviders: number;
    healthyProviders: number;
    degradedProviders: number;
    unhealthyProviders: number;
    averageResponseTime: number;
    overallSuccessRate: number;
  } {
    const healthValues = Array.from(this.healthMap.values());

    const healthy = healthValues.filter((h) => h.status === ProviderStatus.HEALTHY).length;
    const degraded = healthValues.filter((h) => h.status === ProviderStatus.DEGRADED).length;
    const unhealthy = healthValues.filter((h) => h.status === ProviderStatus.UNHEALTHY).length;

    const totalRequests = healthValues.reduce((sum, h) => sum + h.totalRequests, 0);
    const totalErrors = healthValues.reduce((sum, h) => sum + h.totalErrors, 0);
    const avgResponseTime =
      healthValues.reduce((sum, h) => sum + h.averageResponseTime, 0) / healthValues.length;

    return {
      totalProviders: healthValues.length,
      healthyProviders: healthy,
      degradedProviders: degraded,
      unhealthyProviders: unhealthy,
      averageResponseTime: avgResponseTime || 0,
      overallSuccessRate: totalRequests > 0 ? (totalRequests - totalErrors) / totalRequests : 1.0,
    };
  }
}

/**
 * Global failover instance factory
 */
export function createProviderFailover(providers: SearchProvider[]): ProviderFailover {
  return new ProviderFailover(providers);
}

/**
 * Convenience functions for common failover operations
 */

/**
 * Execute search with failover
 */
export async function executeWithFailover(
  query: SearchQuery,
  providers: SearchProvider[],
  failoverManager?: ProviderFailover
): Promise<{ results: SearchResult[]; provider: string; attempts: number }> {
  const manager = failoverManager || createProviderFailover(providers);
  return manager.executeWithFailover(query, providers);
}

/**
 * Get provider health status
 */
export function getProviderHealth(failoverManager: ProviderFailover): Map<string, ProviderHealth> {
  return failoverManager.getHealthStatus();
}

/**
 * Check if providers are available
 */
export function areProvidersAvailable(
  providers: SearchProvider[],
  failoverManager: ProviderFailover
): boolean {
  const available = failoverManager['getAvailableProviders'](providers);
  return available.length >= FAILOVER_CONFIG.MIN_PROVIDERS_REQUIRED;
}

/**
 * Export types
 */

/**
 * Performance Monitoring
 * Response time monitoring and performance tracking for AI-powered travel planning
 */

import { ErrorHandler } from '../middleware/error-handler';

/**
 * Performance configuration
 */
export const PERFORMANCE_CONFIG = {
  // Response time targets (milliseconds)
  TARGETS: {
    ITINERARY_GENERATION: 30000, // 30 seconds
    ITINERARY_UPDATE: 10000, // 10 seconds
    SEARCH_QUERY: 5000, // 5 seconds
    AGENT_RESPONSE: 15000, // 15 seconds
    CACHE_OPERATION: 1000, // 1 second
    VECTOR_SEARCH: 2000, // 2 seconds
  },

  // Performance thresholds for alerts
  ALERT_THRESHOLDS: {
    P50: 0.8, // 80% of target time
    P95: 1.2, // 120% of target time
    P99: 1.5, // 150% of target time
  },

  // Monitoring settings
  ENABLE_METRICS: true,
  METRICS_RETENTION: 86400000, // 24 hours in milliseconds
  SAMPLING_RATE: 1.0, // Sample 100% of requests
  BUCKET_SIZE: 1000, // 1 second buckets for histograms

  // Performance degradation detection
  DEGRADATION_THRESHOLD: 1.5, // 50% increase triggers alert
  DEGRADATION_WINDOW: 300000, // 5 minutes window

  // Slow query detection
  SLOW_QUERY_THRESHOLD: 10000, // 10 seconds
  VERY_SLOW_QUERY_THRESHOLD: 30000, // 30 seconds
} as const;

/**
 * Performance metric types
 */
export enum MetricType {
  RESPONSE_TIME = 'response_time',
  AGENT_LATENCY = 'agent_latency',
  SEARCH_LATENCY = 'search_latency',
  CACHE_LATENCY = 'cache_latency',
  VECTOR_LATENCY = 'vector_latency',
  MEMORY_USAGE = 'memory_usage',
  CPU_USAGE = 'cpu_usage',
  ERROR_RATE = 'error_rate',
}

/**
 * Operation types for performance tracking
 */
export type OperationType =
  | 'itinerary_generation'
  | 'itinerary_update'
  | 'search_query'
  | 'agent_response'
  | 'cache_operation'
  | 'vector_search'
  | 'api_request'
  | 'workflow_execution';

/**
 * Performance metric data
 */
export interface PerformanceMetric {
  id: string;
  operationType: OperationType;
  operationId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  errorType?: string;
  metadata: {
    userId?: string;
    sessionId?: string;
    agentName?: string;
    providerName?: string;
    queryComplexity?: number;
    resultCount?: number;
    cacheHit?: boolean;
    retryCount?: number;
    [key: string]: any;
  };
  tags: Record<string, string>;
}

/**
 * Performance statistics
 */
export interface PerformanceStats {
  operationType: OperationType;
  timeRange: {
    start: number;
    end: number;
  };
  count: number;
  successCount: number;
  errorCount: number;
  averageDuration: number;
  medianDuration: number;
  p95Duration: number;
  p99Duration: number;
  minDuration: number;
  maxDuration: number;
  percentiles: {
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  errorRate: number;
  throughput: number; // operations per second
}

/**
 * Performance alert
 */
export interface PerformanceAlert {
  id: string;
  type: 'slow_response' | 'high_error_rate' | 'performance_degradation' | 'target_exceeded';
  severity: 'low' | 'medium' | 'high' | 'critical';
  operationType: OperationType;
  message: string;
  details: {
    currentValue: number;
    threshold: number;
    target: number;
    timeRange: { start: number; end: number };
    affectedOperations: number;
  };
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
}

/**
 * Performance Monitor
 * Tracks response times and performance metrics for the travel planning system
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private isEnabled = PERFORMANCE_CONFIG.ENABLE_METRICS;

  /**
   * Start tracking a performance metric
   */
  startOperation(
    operationType: OperationType,
    operationId: string,
    metadata: Partial<PerformanceMetric['metadata']> = {},
    tags: Record<string, string> = {}
  ): string {
    if (!this.isEnabled) return '';

    const metricId = this.generateMetricId();
    const metric: PerformanceMetric = {
      id: metricId,
      operationType,
      operationId,
      startTime: Date.now(),
      success: false,
      metadata,
      tags: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        ...tags,
      },
    };

    this.metrics.push(metric);
    this.cleanupOldMetrics();

    return metricId;
  }

  /**
   * End tracking a performance metric
   */
  endOperation(
    metricId: string,
    success: boolean = true,
    errorType?: string,
    additionalMetadata: Partial<PerformanceMetric['metadata']> = {}
  ): void {
    if (!this.isEnabled || !metricId) return;

    const metric = this.metrics.find((m) => m.id === metricId);
    if (!metric) return;

    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;
    metric.success = success;
    metric.errorType = errorType;
    Object.assign(metric.metadata, additionalMetadata);

    // Check for performance violations
    this.checkPerformanceViolations(metric);

    // Log slow operations
    this.logSlowOperations(metric);
  }

  /**
   * Record a complete operation in one call
   */
  recordOperation(
    operationType: OperationType,
    operationId: string,
    duration: number,
    success: boolean = true,
    metadata: Partial<PerformanceMetric['metadata']> = {},
    tags: Record<string, string> = {}
  ): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      id: this.generateMetricId(),
      operationType,
      operationId,
      startTime: Date.now() - duration,
      endTime: Date.now(),
      duration,
      success,
      metadata,
      tags: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        ...tags,
      },
    };

    this.metrics.push(metric);
    this.cleanupOldMetrics();
    this.checkPerformanceViolations(metric);
    this.logSlowOperations(metric);
  }

  /**
   * Get performance statistics for an operation type
   */
  getPerformanceStats(
    operationType: OperationType,
    timeRangeMinutes: number = 60
  ): PerformanceStats | null {
    const now = Date.now();
    const timeRangeMs = timeRangeMinutes * 60 * 1000;
    const startTime = now - timeRangeMs;

    const relevantMetrics = this.metrics.filter(
      (m) =>
        m.operationType === operationType && m.startTime >= startTime && m.duration !== undefined
    );

    if (relevantMetrics.length === 0) return null;

    const durations = relevantMetrics.map((m) => m.duration!).sort((a, b) => a - b);
    const successCount = relevantMetrics.filter((m) => m.success).length;
    const errorCount = relevantMetrics.length - successCount;

    return {
      operationType,
      timeRange: { start: startTime, end: now },
      count: relevantMetrics.length,
      successCount,
      errorCount,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      medianDuration: this.calculatePercentile(durations, 50),
      p95Duration: this.calculatePercentile(durations, 95),
      p99Duration: this.calculatePercentile(durations, 99),
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      percentiles: {
        p50: this.calculatePercentile(durations, 50),
        p75: this.calculatePercentile(durations, 75),
        p90: this.calculatePercentile(durations, 90),
        p95: this.calculatePercentile(durations, 95),
        p99: this.calculatePercentile(durations, 99),
      },
      errorRate: errorCount / relevantMetrics.length,
      throughput: relevantMetrics.length / (timeRangeMs / 1000), // ops per second
    };
  }

  /**
   * Get all performance statistics
   */
  getAllPerformanceStats(timeRangeMinutes: number = 60): Map<OperationType, PerformanceStats> {
    const stats = new Map<OperationType, PerformanceStats>();

    // Get all operation types that have metrics
    const operationTypes = [...new Set(this.metrics.map((m) => m.operationType))];

    for (const operationType of operationTypes) {
      const stat = this.getPerformanceStats(operationType, timeRangeMinutes);
      if (stat) {
        stats.set(operationType, stat);
      }
    }

    return stats;
  }

  /**
   * Check if operation meets performance targets
   */
  checkPerformanceTarget(
    operationType: OperationType,
    duration: number
  ): {
    meetsTarget: boolean;
    target: number;
    deviation: number;
    severity: 'good' | 'warning' | 'critical';
  } {
    const target =
      PERFORMANCE_CONFIG.TARGETS[
        operationType.toUpperCase() as keyof typeof PERFORMANCE_CONFIG.TARGETS
      ];

    if (!target) {
      return { meetsTarget: true, target: 0, deviation: 0, severity: 'good' };
    }

    const deviation = (duration - target) / target;
    const meetsTarget = duration <= target;

    let severity: 'good' | 'warning' | 'critical' = 'good';
    if (deviation > PERFORMANCE_CONFIG.ALERT_THRESHOLDS.P95) {
      severity = 'critical';
    } else if (deviation > PERFORMANCE_CONFIG.ALERT_THRESHOLDS.P50) {
      severity = 'warning';
    }

    return { meetsTarget, target, deviation, severity };
  }

  /**
   * Get active performance alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter((alert) => !alert.resolved);
  }

  /**
   * Resolve a performance alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(timeRangeMinutes: number = 60): {
    overall: {
      totalOperations: number;
      successRate: number;
      averageResponseTime: number;
      p95ResponseTime: number;
    };
    byOperationType: Map<
      OperationType,
      {
        count: number;
        successRate: number;
        averageDuration: number;
        targetCompliance: number;
      }
    >;
    alerts: PerformanceAlert[];
    recommendations: string[];
  } {
    const allStats = this.getAllPerformanceStats(timeRangeMinutes);
    const activeAlerts = this.getActiveAlerts();

    let totalOperations = 0;
    let totalSuccessful = 0;
    let weightedAverageDuration = 0;
    const allDurations: number[] = [];

    const byOperationType = new Map<
      OperationType,
      {
        count: number;
        successRate: number;
        averageDuration: number;
        targetCompliance: number;
      }
    >();

    for (const [operationType, stats] of allStats) {
      totalOperations += stats.count;
      totalSuccessful += stats.successCount;
      weightedAverageDuration += stats.averageDuration * stats.count;

      // Collect all durations for p95 calculation
      const operationMetrics = this.metrics.filter(
        (m) =>
          m.operationType === operationType &&
          m.duration !== undefined &&
          m.startTime >= Date.now() - timeRangeMinutes * 60 * 1000
      );
      allDurations.push(...operationMetrics.map((m) => m.duration!));

      // Calculate target compliance
      const target =
        PERFORMANCE_CONFIG.TARGETS[
          operationType.toUpperCase() as keyof typeof PERFORMANCE_CONFIG.TARGETS
        ];
      const targetCompliance = target
        ? stats.p95Duration <= target
          ? 1
          : target / stats.p95Duration
        : 1;

      byOperationType.set(operationType, {
        count: stats.count,
        successRate: stats.successCount / stats.count,
        averageDuration: stats.averageDuration,
        targetCompliance,
      });
    }

    const overall = {
      totalOperations,
      successRate: totalOperations > 0 ? totalSuccessful / totalOperations : 0,
      averageResponseTime: totalOperations > 0 ? weightedAverageDuration / totalOperations : 0,
      p95ResponseTime: this.calculatePercentile(
        allDurations.sort((a, b) => a - b),
        95
      ),
    };

    const recommendations = this.generateRecommendations(allStats, activeAlerts);

    return {
      overall,
      byOperationType,
      alerts: activeAlerts,
      recommendations,
    };
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(): {
    metrics: PerformanceMetric[];
    stats: Map<OperationType, PerformanceStats>;
    alerts: PerformanceAlert[];
    timestamp: number;
  } {
    return {
      metrics: [...this.metrics],
      stats: this.getAllPerformanceStats(),
      alerts: [...this.alerts],
      timestamp: Date.now(),
    };
  }

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check for performance violations and create alerts
   */
  private checkPerformanceViolations(metric: PerformanceMetric): void {
    if (!metric.duration) return;

    const targetCheck = this.checkPerformanceTarget(metric.operationType, metric.duration);

    // Create alert for target violations
    if (!targetCheck.meetsTarget && targetCheck.severity === 'critical') {
      this.createAlert({
        type: 'target_exceeded',
        severity: 'high',
        operationType: metric.operationType,
        message: `${metric.operationType} exceeded performance target by ${(
          targetCheck.deviation * 100
        ).toFixed(1)}%`,
        details: {
          currentValue: metric.duration,
          threshold: targetCheck.target * PERFORMANCE_CONFIG.ALERT_THRESHOLDS.P99,
          target: targetCheck.target,
          timeRange: { start: metric.startTime, end: metric.endTime! },
          affectedOperations: 1,
        },
      });
    }

    // Check for performance degradation
    this.checkPerformanceDegradation(metric);
  }

  /**
   * Check for performance degradation trends
   */
  private checkPerformanceDegradation(currentMetric: PerformanceMetric): void {
    if (!currentMetric.duration) return;

    const windowStart = Date.now() - PERFORMANCE_CONFIG.DEGRADATION_WINDOW;
    const recentMetrics = this.metrics.filter(
      (m) =>
        m.operationType === currentMetric.operationType &&
        m.startTime >= windowStart &&
        m.duration &&
        m.id !== currentMetric.id
    );

    if (recentMetrics.length < 5) return; // Need minimum sample size

    const recentAvg = recentMetrics.reduce((sum, m) => sum + m.duration!, 0) / recentMetrics.length;
    const degradation = currentMetric.duration / recentAvg;

    if (degradation >= PERFORMANCE_CONFIG.DEGRADATION_THRESHOLD) {
      this.createAlert({
        type: 'performance_degradation',
        severity: 'medium',
        operationType: currentMetric.operationType,
        message: `${currentMetric.operationType} performance degraded by ${(
          degradation * 100 -
          100
        ).toFixed(1)}%`,
        details: {
          currentValue: currentMetric.duration,
          threshold: recentAvg * PERFORMANCE_CONFIG.DEGRADATION_THRESHOLD,
          target: recentAvg,
          timeRange: { start: windowStart, end: Date.now() },
          affectedOperations: recentMetrics.length + 1,
        },
      });
    }
  }

  /**
   * Log slow operations
   */
  private logSlowOperations(metric: PerformanceMetric): void {
    if (!metric.duration) return;

    if (metric.duration >= PERFORMANCE_CONFIG.VERY_SLOW_QUERY_THRESHOLD) {
      console.error(
        `[PERFORMANCE] Very slow operation: ${metric.operationType} took ${metric.duration}ms`,
        {
          operationId: metric.operationId,
          metadata: metric.metadata,
          tags: metric.tags,
        }
      );
    } else if (metric.duration >= PERFORMANCE_CONFIG.SLOW_QUERY_THRESHOLD) {
      console.warn(
        `[PERFORMANCE] Slow operation: ${metric.operationType} took ${metric.duration}ms`,
        {
          operationId: metric.operationId,
          metadata: metric.metadata,
        }
      );
    }
  }

  /**
   * Create a performance alert
   */
  private createAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp' | 'resolved'>): void {
    // Check if similar alert already exists
    const existingAlert = this.alerts.find(
      (a) =>
        !a.resolved &&
        a.type === alertData.type &&
        a.operationType === alertData.operationType &&
        Date.now() - a.timestamp < 300000 // 5 minutes
    );

    if (existingAlert) return; // Don't create duplicate alerts

    const alert: PerformanceAlert = {
      id: this.generateAlertId(),
      ...alertData,
      timestamp: Date.now(),
      resolved: false,
    };

    this.alerts.push(alert);

    // Log the alert
    console.warn(`[PERFORMANCE ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`, {
      alertId: alert.id,
      operationType: alert.operationType,
      details: alert.details,
    });
  }

  /**
   * Generate recommendations based on performance data
   */
  private generateRecommendations(
    stats: Map<OperationType, PerformanceStats>,
    alerts: PerformanceAlert[]
  ): string[] {
    const recommendations: string[] = [];

    for (const [operationType, stat] of stats) {
      // Check target compliance
      const target =
        PERFORMANCE_CONFIG.TARGETS[
          operationType.toUpperCase() as keyof typeof PERFORMANCE_CONFIG.TARGETS
        ];
      if (target && stat.p95Duration > target) {
        const exceedance = (((stat.p95Duration - target) / target) * 100).toFixed(1);
        recommendations.push(
          `${operationType}: P95 response time exceeds target by ${exceedance}% (${stat.p95Duration}ms vs ${target}ms target)`
        );
      }

      // Check error rates
      if (stat.errorRate > 0.05) {
        // 5% error rate
        recommendations.push(
          `${operationType}: High error rate of ${(stat.errorRate * 100).toFixed(
            1
          )}% - investigate failures`
        );
      }

      // Check throughput
      if (stat.throughput < 0.1) {
        // Less than 0.1 ops/sec
        recommendations.push(
          `${operationType}: Low throughput of ${stat.throughput.toFixed(
            2
          )} ops/sec - consider optimization`
        );
      }
    }

    // Add alert-based recommendations
    for (const alert of alerts) {
      switch (alert.type) {
        case 'slow_response':
          recommendations.push(
            `Optimize ${alert.operationType} operations - currently ${(
              (alert.details.currentValue / alert.details.target) *
              100
            ).toFixed(1)}% over target`
          );
          break;
        case 'performance_degradation':
          recommendations.push(
            `Investigate performance degradation in ${alert.operationType} - check for bottlenecks`
          );
          break;
        case 'high_error_rate':
          recommendations.push(
            `Address error rate issues in ${alert.operationType} - ${(
              alert.details.currentValue * 100
            ).toFixed(1)}% errors`
          );
          break;
      }
    }

    return recommendations;
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;

    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return sortedArray[lower];
    }

    const weight = index - lower;
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  /**
   * Generate unique metric ID
   */
  private generateMetricId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - PERFORMANCE_CONFIG.METRICS_RETENTION;
    this.metrics = this.metrics.filter((m) => m.startTime > cutoffTime);

    // Also cleanup old resolved alerts (keep for 1 hour)
    const alertCutoffTime = Date.now() - 3600000;
    this.alerts = this.alerts.filter((a) => !a.resolved || a.resolvedAt! > alertCutoffTime);
  }

  /**
   * Health check for performance monitoring
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metricsCollected: number;
    activeAlerts: number;
    averageResponseTime: number;
    error?: string;
  }> {
    try {
      const summary = this.getPerformanceSummary(5); // Last 5 minutes
      const activeAlerts = this.getActiveAlerts();

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

      // Check for critical alerts
      const criticalAlerts = activeAlerts.filter((a) => a.severity === 'critical');
      if (criticalAlerts.length > 0) {
        status = 'unhealthy';
      } else if (activeAlerts.length > 2) {
        status = 'degraded';
      }

      // Check overall performance
      if (summary.overall.totalOperations > 0) {
        const targetCompliance =
          summary.byOperationType.size > 0
            ? Array.from(summary.byOperationType.values()).reduce(
                (sum, op) => sum + op.targetCompliance,
                0
              ) / summary.byOperationType.size
            : 1;

        if (targetCompliance < 0.7) {
          // Less than 70% target compliance
          status = 'degraded';
        }
      }

      return {
        status,
        metricsCollected: this.metrics.length,
        activeAlerts: activeAlerts.length,
        averageResponseTime: summary.overall.averageResponseTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        metricsCollected: this.metrics.length,
        activeAlerts: this.alerts.filter((a) => !a.resolved).length,
        averageResponseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Convenience functions for common performance monitoring operations
 */

/**
 * Start timing an operation
 */
export function startTiming(
  operationType: OperationType,
  operationId: string,
  metadata?: Partial<PerformanceMetric['metadata']>,
  tags?: Record<string, string>
): string {
  return performanceMonitor.startOperation(operationType, operationId, metadata, tags);
}

/**
 * End timing an operation
 */
export function endTiming(
  metricId: string,
  success: boolean = true,
  errorType?: string,
  additionalMetadata?: Partial<PerformanceMetric['metadata']>
): void {
  performanceMonitor.endOperation(metricId, success, errorType, additionalMetadata);
}

/**
 * Record a complete operation
 */
export function recordTiming(
  operationType: OperationType,
  operationId: string,
  duration: number,
  success: boolean = true,
  metadata?: Partial<PerformanceMetric['metadata']>,
  tags?: Record<string, string>
): void {
  performanceMonitor.recordOperation(operationType, operationId, duration, success, metadata, tags);
}

/**
 * Get performance statistics
 */
export function getPerformanceStats(
  operationType: OperationType,
  timeRangeMinutes?: number
): PerformanceStats | null {
  return performanceMonitor.getPerformanceStats(operationType, timeRangeMinutes);
}

/**
 * Check performance target compliance
 */
export function checkPerformanceTarget(operationType: OperationType, duration: number) {
  return performanceMonitor.checkPerformanceTarget(operationType, duration);
}

/**
 * Get performance summary
 */
export function getPerformanceSummary(timeRangeMinutes?: number) {
  return performanceMonitor.getPerformanceSummary(timeRangeMinutes);
}

/**
 * Export performance metrics
 */
export function exportPerformanceMetrics() {
  return performanceMonitor.exportMetrics();
}

/**
 * Export types
 */
export type { PerformanceMetric, PerformanceStats, PerformanceAlert };

/**
 * Agent Execution Metrics
 * Comprehensive monitoring and analytics for AI agent performance
 */

import { performanceMonitor, PerformanceMetric } from './performance';

/**
 * Agent metrics configuration
 */
export const AGENT_METRICS_CONFIG = {
  // Agent performance targets
  TARGETS: {
    ARCHITECT: {
      maxResponseTime: 20000, // 20 seconds
      minSuccessRate: 0.95, // 95%
      maxTokenUsage: 8000, // tokens
    },
    GATHERER: {
      maxResponseTime: 15000, // 15 seconds
      minSuccessRate: 0.9, // 90%
      maxTokenUsage: 6000, // tokens
    },
    SPECIALIST: {
      maxResponseTime: 18000, // 18 seconds
      minSuccessRate: 0.92, // 92%
      maxTokenUsage: 7000, // tokens
    },
    PUTTER: {
      maxResponseTime: 12000, // 12 seconds
      minSuccessRate: 0.98, // 98%
      maxTokenUsage: 4000, // tokens
    },
  },

  // Quality metrics
  QUALITY_THRESHOLDS: {
    MIN_CONFIDENCE_SCORE: 0.7,
    MIN_RELEVANCE_SCORE: 0.75,
    MAX_HALLUCINATION_RATE: 0.05,
  },

  // Cost monitoring
  COST_THRESHOLDS: {
    MAX_COST_PER_REQUEST: 0.1, // $0.10 per request
    MAX_MONTHLY_COST: 1000, // $1000 per month
  },

  // Monitoring settings
  ENABLE_DETAILED_LOGGING: true,
  METRICS_RETENTION_HOURS: 24,
  ALERT_THRESHOLDS: {
    CONSECUTIVE_FAILURES: 3,
    SUCCESS_RATE_DROP: 0.1, // 10% drop
    RESPONSE_TIME_INCREASE: 1.5, // 50% increase
  },
} as const;

/**
 * Agent types
 */
export type AgentType = 'architect' | 'gatherer' | 'specialist' | 'putter';

/**
 * Agent execution phases
 */
export enum AgentPhase {
  INITIALIZATION = 'initialization',
  PROMPT_PREPARATION = 'prompt_preparation',
  API_CALL = 'api_call',
  RESPONSE_PARSING = 'response_parsing',
  VALIDATION = 'validation',
  COMPLETION = 'completion',
}

/**
 * Agent execution metric
 */
export interface AgentExecutionMetric {
  id: string;
  agentType: AgentType;
  agentName: string;
  executionId: string;
  sessionId: string;
  userId?: string;

  // Timing metrics
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  phaseDurations: Record<AgentPhase, number>;

  // Success/failure metrics
  success: boolean;
  errorType?: string;
  errorMessage?: string;
  retryCount: number;

  // Quality metrics
  confidenceScore?: number;
  relevanceScore?: number;
  hallucinationDetected: boolean;
  outputQuality: 'excellent' | 'good' | 'acceptable' | 'poor' | 'unusable';

  // Token and cost metrics
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;

  // Content metrics
  inputLength: number;
  outputLength: number;
  structuredOutput: boolean;

  // Context metrics
  temperature: number;
  model: string;
  provider: string;

  // Business metrics
  queryComplexity: number;
  resultUtility: number;
  userSatisfaction?: number;

  // Metadata
  tags: Record<string, string>;
  customMetrics: Record<string, any>;
}

/**
 * Agent performance summary
 */
export interface AgentPerformanceSummary {
  agentType: AgentType;
  timeRange: {
    start: number;
    end: number;
  };

  // Volume metrics
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;

  // Performance metrics
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;

  // Quality metrics
  averageConfidenceScore: number;
  averageRelevanceScore: number;
  hallucinationRate: number;
  qualityDistribution: Record<string, number>;

  // Cost metrics
  totalTokensUsed: number;
  totalCost: number;
  averageCostPerExecution: number;
  costEfficiency: number; // utility per dollar

  // Success metrics
  successRate: number;
  averageRetries: number;
  errorRateByType: Record<string, number>;

  // Trend metrics
  performanceTrend: 'improving' | 'stable' | 'degrading';
  qualityTrend: 'improving' | 'stable' | 'degrading';
  costTrend: 'increasing' | 'stable' | 'decreasing';
}

/**
 * Agent alert types
 */
export enum AgentAlertType {
  HIGH_ERROR_RATE = 'high_error_rate',
  SLOW_RESPONSE_TIME = 'slow_response_time',
  LOW_CONFIDENCE = 'low_confidence',
  HIGH_COST = 'high_cost',
  QUALITY_DEGRADATION = 'quality_degradation',
  HALLUCINATION_SPIKE = 'hallucination_spike',
  CONSECUTIVE_FAILURES = 'consecutive_failures',
}

/**
 * Agent alert
 */
export interface AgentAlert {
  id: string;
  type: AgentAlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  agentType: AgentType;
  message: string;
  details: {
    currentValue: number;
    threshold: number;
    timeRange: { start: number; end: number };
    affectedExecutions: number;
  };
  recommendations: string[];
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
}

/**
 * Agent Metrics Collector
 * Collects and analyzes AI agent execution metrics
 */
export class AgentMetricsCollector {
  private metrics: AgentExecutionMetric[] = [];
  private alerts: AgentAlert[] = [];
  private consecutiveFailures: Map<AgentType, number> = new Map();

  /**
   * Start tracking an agent execution
   */
  startAgentExecution(
    agentType: AgentType,
    agentName: string,
    executionId: string,
    sessionId: string,
    userId?: string,
    tags: Record<string, string> = {}
  ): string {
    const metricId = this.generateMetricId();
    const metric: AgentExecutionMetric = {
      id: metricId,
      agentType,
      agentName,
      executionId,
      sessionId,
      userId,
      startTime: Date.now(),
      phaseDurations: {
        [AgentPhase.INITIALIZATION]: 0,
        [AgentPhase.PROMPT_PREPARATION]: 0,
        [AgentPhase.API_CALL]: 0,
        [AgentPhase.RESPONSE_PARSING]: 0,
        [AgentPhase.VALIDATION]: 0,
        [AgentPhase.COMPLETION]: 0,
      },
      success: false,
      retryCount: 0,
      hallucinationDetected: false,
      outputQuality: 'unusable',
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
      inputLength: 0,
      outputLength: 0,
      structuredOutput: false,
      temperature: 0.7,
      model: 'unknown',
      provider: 'unknown',
      queryComplexity: 1,
      resultUtility: 0,
      tags,
      customMetrics: {},
    };

    this.metrics.push(metric);
    this.cleanupOldMetrics();

    return metricId;
  }

  /**
   * Record phase completion
   */
  recordPhaseCompletion(
    metricId: string,
    phase: AgentPhase,
    duration: number,
    metadata?: Partial<AgentExecutionMetric>
  ): void {
    const metric = this.metrics.find((m) => m.id === metricId);
    if (!metric) return;

    metric.phaseDurations[phase] = duration;

    if (metadata) {
      Object.assign(metric, metadata);
    }
  }

  /**
   * Complete agent execution
   */
  completeAgentExecution(
    metricId: string,
    success: boolean,
    finalMetadata: Partial<AgentExecutionMetric> = {}
  ): void {
    const metric = this.metrics.find((m) => m.id === metricId);
    if (!metric) return;

    metric.endTime = Date.now();
    metric.totalDuration = metric.endTime - metric.startTime;
    metric.success = success;

    // Apply final metadata
    Object.assign(metric, finalMetadata);

    // Calculate derived metrics
    this.calculateDerivedMetrics(metric);

    // Update consecutive failures tracking
    this.updateConsecutiveFailures(metric);

    // Check for alerts
    this.checkAgentAlerts(metric);

    // Log performance data
    this.logAgentPerformance(metric);
  }

  /**
   * Record agent failure
   */
  recordAgentFailure(
    metricId: string,
    errorType: string,
    errorMessage: string,
    retryCount: number = 0
  ): void {
    const metric = this.metrics.find((m) => m.id === metricId);
    if (!metric) return;

    metric.success = false;
    metric.errorType = errorType;
    metric.errorMessage = errorMessage;
    metric.retryCount = retryCount;
    metric.endTime = Date.now();
    metric.totalDuration = metric.endTime - metric.startTime;

    this.updateConsecutiveFailures(metric);
    this.checkAgentAlerts(metric);
  }

  /**
   * Get performance summary for an agent type
   */
  getAgentPerformanceSummary(
    agentType: AgentType,
    timeRangeHours: number = 24
  ): AgentPerformanceSummary | null {
    const now = Date.now();
    const timeRangeMs = timeRangeHours * 60 * 60 * 1000;
    const startTime = now - timeRangeMs;

    const relevantMetrics = this.metrics.filter(
      (m) => m.agentType === agentType && m.startTime >= startTime && m.endTime
    );

    if (relevantMetrics.length === 0) return null;

    const successfulMetrics = relevantMetrics.filter((m) => m.success);
    const failedMetrics = relevantMetrics.filter((m) => !m.success);

    // Calculate timing metrics
    const responseTimes = relevantMetrics
      .map((m) => m.totalDuration!)
      .filter((d) => d > 0)
      .sort((a, b) => a - b);

    // Calculate quality metrics
    const confidenceScores = successfulMetrics
      .map((m) => m.confidenceScore)
      .filter((score) => score !== undefined) as number[];

    const relevanceScores = successfulMetrics
      .map((m) => m.relevanceScore)
      .filter((score) => score !== undefined) as number[];

    const hallucinationCount = successfulMetrics.filter((m) => m.hallucinationDetected).length;

    // Calculate cost metrics
    const totalTokens = relevantMetrics.reduce((sum, m) => sum + m.totalTokens, 0);
    const totalCost = relevantMetrics.reduce((sum, m) => sum + m.estimatedCost, 0);

    // Calculate quality distribution
    const qualityDistribution: Record<string, number> = {};
    successfulMetrics.forEach((m) => {
      qualityDistribution[m.outputQuality] = (qualityDistribution[m.outputQuality] || 0) + 1;
    });

    // Calculate error rate by type
    const errorRateByType: Record<string, number> = {};
    failedMetrics.forEach((m) => {
      if (m.errorType) {
        errorRateByType[m.errorType] = (errorRateByType[m.errorType] || 0) + 1;
      }
    });

    // Calculate trends (simplified)
    const recentMetrics = relevantMetrics.filter((m) => m.startTime >= now - timeRangeMs / 2);
    const olderMetrics = relevantMetrics.filter((m) => m.startTime < now - timeRangeMs / 2);

    const recentAvgTime =
      recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + (m.totalDuration || 0), 0) / recentMetrics.length
        : 0;
    const olderAvgTime =
      olderMetrics.length > 0
        ? olderMetrics.reduce((sum, m) => sum + (m.totalDuration || 0), 0) / olderMetrics.length
        : 0;

    let performanceTrend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (olderAvgTime > 0) {
      const ratio = recentAvgTime / olderAvgTime;
      if (ratio < 0.9) performanceTrend = 'improving';
      else if (ratio > 1.1) performanceTrend = 'degrading';
    }

    return {
      agentType,
      timeRange: { start: startTime, end: now },
      totalExecutions: relevantMetrics.length,
      successfulExecutions: successfulMetrics.length,
      failedExecutions: failedMetrics.length,
      averageResponseTime:
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      medianResponseTime: this.calculatePercentile(responseTimes, 50),
      p95ResponseTime: this.calculatePercentile(responseTimes, 95),
      p99ResponseTime: this.calculatePercentile(responseTimes, 99),
      averageConfidenceScore:
        confidenceScores.length > 0
          ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length
          : 0,
      averageRelevanceScore:
        relevanceScores.length > 0
          ? relevanceScores.reduce((sum, score) => sum + score, 0) / relevanceScores.length
          : 0,
      hallucinationRate:
        successfulMetrics.length > 0 ? hallucinationCount / successfulMetrics.length : 0,
      qualityDistribution,
      totalTokensUsed: totalTokens,
      totalCost,
      averageCostPerExecution: relevantMetrics.length > 0 ? totalCost / relevantMetrics.length : 0,
      costEfficiency:
        totalCost > 0
          ? relevantMetrics.reduce((sum, m) => sum + m.resultUtility, 0) / totalCost
          : 0,
      successRate:
        relevantMetrics.length > 0 ? successfulMetrics.length / relevantMetrics.length : 0,
      averageRetries:
        relevantMetrics.reduce((sum, m) => sum + m.retryCount, 0) / relevantMetrics.length,
      errorRateByType,
      performanceTrend,
      qualityTrend: 'stable', // Would need more complex calculation
      costTrend: 'stable', // Would need more complex calculation
    };
  }

  /**
   * Get all agent performance summaries
   */
  getAllAgentPerformanceSummaries(
    timeRangeHours: number = 24
  ): Map<AgentType, AgentPerformanceSummary> {
    const summaries = new Map<AgentType, AgentPerformanceSummary>();

    const agentTypes: AgentType[] = ['architect', 'gatherer', 'specialist', 'putter'];
    for (const agentType of agentTypes) {
      const summary = this.getAgentPerformanceSummary(agentType, timeRangeHours);
      if (summary) {
        summaries.set(agentType, summary);
      }
    }

    return summaries;
  }

  /**
   * Get active agent alerts
   */
  getActiveAlerts(): AgentAlert[] {
    return this.alerts.filter((alert) => !alert.resolved);
  }

  /**
   * Resolve an agent alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
    }
  }

  /**
   * Get agent recommendations
   */
  getAgentRecommendations(): string[] {
    const recommendations: string[] = [];
    const summaries = this.getAllAgentPerformanceSummaries(24);

    for (const [agentType, summary] of summaries) {
      const targets =
        AGENT_METRICS_CONFIG.TARGETS[
          agentType.toUpperCase() as keyof typeof AGENT_METRICS_CONFIG.TARGETS
        ];

      // Performance recommendations
      if (summary.p95ResponseTime > targets.maxResponseTime) {
        recommendations.push(
          `${agentType}: Response time exceeds target (${summary.p95ResponseTime}ms > ${targets.maxResponseTime}ms)`
        );
      }

      // Success rate recommendations
      if (summary.successRate < targets.minSuccessRate) {
        recommendations.push(
          `${agentType}: Success rate below target (${(summary.successRate * 100).toFixed(1)}% < ${(
            targets.minSuccessRate * 100
          ).toFixed(1)}%)`
        );
      }

      // Cost recommendations
      if (
        summary.averageCostPerExecution > AGENT_METRICS_CONFIG.COST_THRESHOLDS.MAX_COST_PER_REQUEST
      ) {
        recommendations.push(
          `${agentType}: Cost per execution too high ($${summary.averageCostPerExecution.toFixed(
            3
          )} > $${AGENT_METRICS_CONFIG.COST_THRESHOLDS.MAX_COST_PER_REQUEST})`
        );
      }

      // Quality recommendations
      if (
        summary.hallucinationRate > AGENT_METRICS_CONFIG.QUALITY_THRESHOLDS.MAX_HALLUCINATION_RATE
      ) {
        recommendations.push(
          `${agentType}: High hallucination rate (${(summary.hallucinationRate * 100).toFixed(1)}%)`
        );
      }
    }

    return recommendations;
  }

  /**
   * Export agent metrics for analysis
   */
  exportAgentMetrics(): {
    metrics: AgentExecutionMetric[];
    summaries: Map<AgentType, AgentPerformanceSummary>;
    alerts: AgentAlert[];
    timestamp: number;
  } {
    return {
      metrics: [...this.metrics],
      summaries: this.getAllAgentPerformanceSummaries(),
      alerts: [...this.alerts],
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate derived metrics for an execution
   */
  private calculateDerivedMetrics(metric: AgentExecutionMetric): void {
    // Calculate total tokens
    metric.totalTokens = metric.promptTokens + metric.completionTokens;

    // Estimate cost (simplified calculation)
    const costPerToken = 0.00002; // Example rate
    metric.estimatedCost = metric.totalTokens * costPerToken;

    // Determine output quality based on various factors
    metric.outputQuality = this.assessOutputQuality(metric);
  }

  /**
   * Assess output quality based on metrics
   */
  private assessOutputQuality(metric: AgentExecutionMetric): AgentExecutionMetric['outputQuality'] {
    if (!metric.success) return 'unusable';

    let score = 0;

    // Confidence score contribution
    if (
      metric.confidenceScore &&
      metric.confidenceScore >= AGENT_METRICS_CONFIG.QUALITY_THRESHOLDS.MIN_CONFIDENCE_SCORE
    ) {
      score += 25;
    }

    // Relevance score contribution
    if (
      metric.relevanceScore &&
      metric.relevanceScore >= AGENT_METRICS_CONFIG.QUALITY_THRESHOLDS.MIN_RELEVANCE_SCORE
    ) {
      score += 25;
    }

    // No hallucination detected
    if (!metric.hallucinationDetected) {
      score += 20;
    }

    // Structured output
    if (metric.structuredOutput) {
      score += 15;
    }

    // Result utility
    if (metric.resultUtility > 0.7) {
      score += 15;
    }

    // Determine quality level
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'acceptable';
    if (score >= 40) return 'poor';
    return 'unusable';
  }

  /**
   * Update consecutive failures tracking
   */
  private updateConsecutiveFailures(metric: AgentExecutionMetric): void {
    const current = this.consecutiveFailures.get(metric.agentType) || 0;

    if (metric.success) {
      this.consecutiveFailures.set(metric.agentType, 0);
    } else {
      this.consecutiveFailures.set(metric.agentType, current + 1);
    }
  }

  /**
   * Check for agent alerts
   */
  private checkAgentAlerts(metric: AgentExecutionMetric): void {
    const targets =
      AGENT_METRICS_CONFIG.TARGETS[
        metric.agentType.toUpperCase() as keyof typeof AGENT_METRICS_CONFIG.TARGETS
      ];

    // Check consecutive failures
    const consecutiveFailures = this.consecutiveFailures.get(metric.agentType) || 0;
    if (consecutiveFailures >= AGENT_METRICS_CONFIG.ALERT_THRESHOLDS.CONSECUTIVE_FAILURES) {
      this.createAlert({
        type: AgentAlertType.CONSECUTIVE_FAILURES,
        severity: 'high',
        agentType: metric.agentType,
        message: `${metric.agentType} has ${consecutiveFailures} consecutive failures`,
        details: {
          currentValue: consecutiveFailures,
          threshold: AGENT_METRICS_CONFIG.ALERT_THRESHOLDS.CONSECUTIVE_FAILURES,
          timeRange: { start: Date.now() - 3600000, end: Date.now() }, // Last hour
          affectedExecutions: consecutiveFailures,
        },
        recommendations: [
          'Check agent configuration and API keys',
          'Review recent changes to agent prompts',
          'Consider switching to backup agent model',
        ],
      });
    }

    // Check response time
    if (
      metric.totalDuration &&
      metric.totalDuration >
        targets.maxResponseTime * AGENT_METRICS_CONFIG.ALERT_THRESHOLDS.RESPONSE_TIME_INCREASE
    ) {
      this.createAlert({
        type: AgentAlertType.SLOW_RESPONSE_TIME,
        severity: 'medium',
        agentType: metric.agentType,
        message: `${metric.agentType} response time is ${Math.round(
          (metric.totalDuration / targets.maxResponseTime) * 100
        )}% over target`,
        details: {
          currentValue: metric.totalDuration,
          threshold: targets.maxResponseTime,
          timeRange: { start: metric.startTime, end: metric.endTime! },
          affectedExecutions: 1,
        },
        recommendations: [
          'Optimize agent prompts for conciseness',
          'Consider using faster model variant',
          'Check for API rate limiting issues',
        ],
      });
    }

    // Check confidence score
    if (
      metric.confidenceScore &&
      metric.confidenceScore < AGENT_METRICS_CONFIG.QUALITY_THRESHOLDS.MIN_CONFIDENCE_SCORE
    ) {
      this.createAlert({
        type: AgentAlertType.LOW_CONFIDENCE,
        severity: 'medium',
        agentType: metric.agentType,
        message: `${
          metric.agentType
        } confidence score below threshold (${metric.confidenceScore.toFixed(2)})`,
        details: {
          currentValue: metric.confidenceScore,
          threshold: AGENT_METRICS_CONFIG.QUALITY_THRESHOLDS.MIN_CONFIDENCE_SCORE,
          timeRange: { start: metric.startTime, end: metric.endTime! },
          affectedExecutions: 1,
        },
        recommendations: [
          'Review and improve agent prompts',
          'Consider adding more context or examples',
          'Validate training data quality',
        ],
      });
    }

    // Check cost
    if (metric.estimatedCost > AGENT_METRICS_CONFIG.COST_THRESHOLDS.MAX_COST_PER_REQUEST) {
      this.createAlert({
        type: AgentAlertType.HIGH_COST,
        severity: 'low',
        agentType: metric.agentType,
        message: `${
          metric.agentType
        } execution cost exceeds threshold ($${metric.estimatedCost.toFixed(4)})`,
        details: {
          currentValue: metric.estimatedCost,
          threshold: AGENT_METRICS_CONFIG.COST_THRESHOLDS.MAX_COST_PER_REQUEST,
          timeRange: { start: metric.startTime, end: metric.endTime! },
          affectedExecutions: 1,
        },
        recommendations: [
          'Optimize prompts to reduce token usage',
          'Consider using smaller model variants',
          'Implement response caching where appropriate',
        ],
      });
    }
  }

  /**
   * Create an agent alert
   */
  private createAlert(alertData: Omit<AgentAlert, 'id' | 'timestamp' | 'resolved'>): void {
    // Check if similar alert already exists and is unresolved
    const existingAlert = this.alerts.find(
      (a) =>
        !a.resolved &&
        a.type === alertData.type &&
        a.agentType === alertData.agentType &&
        Date.now() - a.timestamp < 1800000 // 30 minutes
    );

    if (existingAlert) return; // Don't create duplicate alerts

    const alert: AgentAlert = {
      id: this.generateAlertId(),
      ...alertData,
      timestamp: Date.now(),
      resolved: false,
    };

    this.alerts.push(alert);

    // Log the alert
    console.warn(`[AGENT ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`, {
      alertId: alert.id,
      agentType: alert.agentType,
      details: alert.details,
      recommendations: alert.recommendations,
    });
  }

  /**
   * Log agent performance data
   */
  private logAgentPerformance(metric: AgentExecutionMetric): void {
    if (!AGENT_METRICS_CONFIG.ENABLE_DETAILED_LOGGING) return;

    const logData = {
      agentType: metric.agentType,
      executionId: metric.executionId,
      success: metric.success,
      duration: metric.totalDuration,
      tokens: metric.totalTokens,
      cost: metric.estimatedCost,
      quality: metric.outputQuality,
      confidence: metric.confidenceScore,
      retries: metric.retryCount,
    };

    if (metric.success) {
      console.info(`[AGENT METRICS] ${metric.agentType} execution completed`, logData);
    } else {
      console.error(`[AGENT METRICS] ${metric.agentType} execution failed`, {
        ...logData,
        errorType: metric.errorType,
        errorMessage: metric.errorMessage,
      });
    }
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
    return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `agent_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - AGENT_METRICS_CONFIG.METRICS_RETENTION_HOURS * 60 * 60 * 1000;
    this.metrics = this.metrics.filter((m) => m.startTime > cutoffTime);

    // Also cleanup old resolved alerts (keep for 1 hour)
    const alertCutoffTime = Date.now() - 3600000;
    this.alerts = this.alerts.filter((a) => !a.resolved || a.resolvedAt! > alertCutoffTime);
  }

  /**
   * Health check for agent metrics
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metricsCollected: number;
    activeAlerts: number;
    averageSuccessRate: number;
    error?: string;
  }> {
    try {
      const summaries = this.getAllAgentPerformanceSummaries(1); // Last hour
      const activeAlerts = this.getActiveAlerts();

      let totalExecutions = 0;
      let totalSuccessful = 0;

      for (const summary of summaries.values()) {
        totalExecutions += summary.totalExecutions;
        totalSuccessful += summary.successfulExecutions;
      }

      const averageSuccessRate = totalExecutions > 0 ? totalSuccessful / totalExecutions : 1.0;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

      // Check for critical alerts
      const criticalAlerts = activeAlerts.filter((a) => a.severity === 'critical');
      if (criticalAlerts.length > 0) {
        status = 'unhealthy';
      } else if (activeAlerts.length > 0) {
        status = 'degraded';
      }

      // Check overall success rate
      if (averageSuccessRate < 0.8) {
        // Less than 80% success rate
        status = 'degraded';
      }

      return {
        status,
        metricsCollected: this.metrics.length,
        activeAlerts: activeAlerts.length,
        averageSuccessRate,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        metricsCollected: this.metrics.length,
        activeAlerts: this.alerts.filter((a) => !a.resolved).length,
        averageSuccessRate: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Global agent metrics collector instance
 */
export const agentMetricsCollector = new AgentMetricsCollector();

/**
 * Convenience functions for common agent metrics operations
 */

/**
 * Start tracking agent execution
 */
export function startAgentExecution(
  agentType: AgentType,
  agentName: string,
  executionId: string,
  sessionId: string,
  userId?: string,
  tags?: Record<string, string>
): string {
  return agentMetricsCollector.startAgentExecution(
    agentType,
    agentName,
    executionId,
    sessionId,
    userId,
    tags
  );
}

/**
 * Record phase completion
 */
export function recordAgentPhase(
  metricId: string,
  phase: AgentPhase,
  duration: number,
  metadata?: Partial<AgentExecutionMetric>
): void {
  agentMetricsCollector.recordPhaseCompletion(metricId, phase, duration, metadata);
}

/**
 * Complete agent execution
 */
export function completeAgentExecution(
  metricId: string,
  success: boolean,
  finalMetadata?: Partial<AgentExecutionMetric>
): void {
  agentMetricsCollector.completeAgentExecution(metricId, success, finalMetadata);
}

/**
 * Record agent failure
 */
export function recordAgentFailure(
  metricId: string,
  errorType: string,
  errorMessage: string,
  retryCount?: number
): void {
  agentMetricsCollector.recordAgentFailure(metricId, errorType, errorMessage, retryCount);
}

/**
 * Get agent performance summary
 */
export function getAgentPerformanceSummary(
  agentType: AgentType,
  timeRangeHours?: number
): AgentPerformanceSummary | null {
  return agentMetricsCollector.getAgentPerformanceSummary(agentType, timeRangeHours);
}

/**
 * Get agent recommendations
 */
export function getAgentRecommendations(): string[] {
  return agentMetricsCollector.getAgentRecommendations();
}

/**
 * Export agent metrics
 */
export function exportAgentMetrics() {
  return agentMetricsCollector.exportAgentMetrics();
}

/**
 * Export types
 */
export type { AgentExecutionMetric, AgentPerformanceSummary, AgentAlert };

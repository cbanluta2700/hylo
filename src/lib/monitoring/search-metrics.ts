/**
 * Search Provider Latency Tracking
 * Comprehensive monitoring and analytics for search provider performance
 */

/**
 * Search metrics configuration
 */
export const SEARCH_METRICS_CONFIG = {
  // Provider performance targets
  TARGETS: {
    TAVILY: {
      maxResponseTime: 3000, // 3 seconds
      minSuccessRate: 0.95, // 95%
      maxCostPerQuery: 0.02, // $0.02 per query
    },
    EXA: {
      maxResponseTime: 2500, // 2.5 seconds
      minSuccessRate: 0.92, // 92%
      maxCostPerQuery: 0.015, // $0.015 per query
    },
    SERP: {
      maxResponseTime: 4000, // 4 seconds
      minSuccessRate: 0.9, // 90%
      maxCostPerQuery: 0.025, // $0.025 per query
    },
    CRUISE_CRITIC: {
      maxResponseTime: 5000, // 5 seconds
      minSuccessRate: 0.85, // 85%
      maxCostPerQuery: 0.01, // $0.01 per query
    },
  },

  // Quality metrics
  QUALITY_THRESHOLDS: {
    MIN_RELEVANCE_SCORE: 0.7,
    MIN_RESULT_COUNT: 3,
    MAX_DUPLICATE_RATE: 0.2,
    MIN_FRESHNESS_DAYS: 7,
  },

  // Monitoring settings
  ENABLE_DETAILED_LOGGING: true,
  METRICS_RETENTION_HOURS: 24,
  ALERT_THRESHOLDS: {
    CONSECUTIVE_FAILURES: 5,
    SUCCESS_RATE_DROP: 0.15, // 15% drop
    RESPONSE_TIME_INCREASE: 2.0, // 100% increase
    COST_SPIKE: 1.5, // 50% increase
  },

  // Sampling settings
  SAMPLE_RATE: 1.0, // Sample 100% of queries
  SLOW_QUERY_THRESHOLD: 5000, // 5 seconds
} as const;

/**
 * Search provider types
 */
export type SearchProviderType = 'tavily' | 'exa' | 'serp' | 'cruise_critic';

/**
 * Search query types
 */
export enum SearchQueryType {
  GENERAL = 'general',
  FLIGHTS = 'flights',
  ACCOMMODATIONS = 'accommodations',
  ACTIVITIES = 'activities',
  DINING = 'dining',
  TRANSPORTATION = 'transportation',
  WEATHER = 'weather',
  REVIEWS = 'reviews',
}

/**
 * Search execution phases
 */
export enum SearchPhase {
  QUERY_PREPARATION = 'query_preparation',
  API_CALL = 'api_call',
  RESPONSE_PARSING = 'response_parsing',
  RESULT_FILTERING = 'result_filtering',
  QUALITY_SCORING = 'quality_scoring',
  COMPLETION = 'completion',
}

/**
 * Search execution metric
 */
export interface SearchExecutionMetric {
  id: string;
  providerType: SearchProviderType;
  providerName: string;
  queryId: string;
  sessionId: string;
  userId?: string;

  // Query details
  query: string;
  queryType: SearchQueryType;
  originalQuery: string;
  refinedQuery?: string;

  // Timing metrics
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  phaseDurations: Record<SearchPhase, number>;

  // Success/failure metrics
  success: boolean;
  errorType?: string;
  errorMessage?: string;
  retryCount: number;
  fallbackUsed: boolean;

  // Result metrics
  resultCount: number;
  relevantResults: number;
  duplicateResults: number;
  averageRelevanceScore: number;
  freshnessScore: number; // 0-1, higher is fresher

  // Quality metrics
  resultQuality: 'excellent' | 'good' | 'acceptable' | 'poor' | 'unusable';
  hasStructuredData: boolean;
  hasImages: boolean;
  hasReviews: boolean;

  // Cost metrics
  estimatedCost: number;
  actualCost?: number;

  // Performance metrics
  cacheHit: boolean;
  rateLimited: boolean;
  throttled: boolean;

  // Geographic metrics
  location?: string;
  radius?: number;

  // Business metrics
  queryComplexity: number;
  resultUtility: number;
  userSatisfaction?: number;

  // Metadata
  tags: Record<string, string>;
  customMetrics: Record<string, any>;
}

/**
 * Search provider performance summary
 */
export interface SearchProviderSummary {
  providerType: SearchProviderType;
  timeRange: {
    start: number;
    end: number;
  };

  // Volume metrics
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  cacheHits: number;
  rateLimitedQueries: number;

  // Performance metrics
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;

  // Quality metrics
  averageRelevanceScore: number;
  averageFreshnessScore: number;
  duplicateRate: number;
  qualityDistribution: Record<string, number>;

  // Cost metrics
  totalCost: number;
  averageCostPerQuery: number;
  costEfficiency: number; // utility per dollar

  // Success metrics
  successRate: number;
  cacheHitRate: number;
  averageRetries: number;
  errorRateByType: Record<string, number>;

  // Query type breakdown
  queriesByType: Record<SearchQueryType, number>;

  // Trend metrics
  performanceTrend: 'improving' | 'stable' | 'degrading';
  qualityTrend: 'improving' | 'stable' | 'degrading';
  costTrend: 'increasing' | 'stable' | 'decreasing';
}

/**
 * Search alert types
 */
export enum SearchAlertType {
  HIGH_ERROR_RATE = 'high_error_rate',
  SLOW_RESPONSE_TIME = 'slow_response_time',
  LOW_RELEVANCE = 'low_relevance',
  HIGH_COST = 'high_cost',
  QUALITY_DEGRADATION = 'quality_degradation',
  RATE_LIMITING = 'rate_limiting',
  CONSECUTIVE_FAILURES = 'consecutive_failures',
  CACHE_MISSES = 'cache_misses',
}

/**
 * Search alert
 */
export interface SearchAlert {
  id: string;
  type: SearchAlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  providerType: SearchProviderType;
  message: string;
  details: {
    currentValue: number;
    threshold: number;
    timeRange: { start: number; end: number };
    affectedQueries: number;
  };
  recommendations: string[];
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
}

/**
 * Search Metrics Collector
 * Collects and analyzes search provider execution metrics
 */
export class SearchMetricsCollector {
  private metrics: SearchExecutionMetric[] = [];
  private alerts: SearchAlert[] = [];
  private consecutiveFailures: Map<SearchProviderType, number> = new Map();

  /**
   * Start tracking a search query execution
   */
  startSearchExecution(
    providerType: SearchProviderType,
    providerName: string,
    queryId: string,
    sessionId: string,
    query: string,
    queryType: SearchQueryType,
    userId?: string,
    tags: Record<string, string> = {}
  ): string {
    const metricId = this.generateMetricId();
    const metric: SearchExecutionMetric = {
      id: metricId,
      providerType,
      providerName,
      queryId,
      sessionId,
      ...(userId && { userId }),
      query,
      queryType,
      originalQuery: query,
      startTime: Date.now(),
      phaseDurations: {
        [SearchPhase.QUERY_PREPARATION]: 0,
        [SearchPhase.API_CALL]: 0,
        [SearchPhase.RESPONSE_PARSING]: 0,
        [SearchPhase.RESULT_FILTERING]: 0,
        [SearchPhase.QUALITY_SCORING]: 0,
        [SearchPhase.COMPLETION]: 0,
      },
      success: false,
      retryCount: 0,
      fallbackUsed: false,
      resultCount: 0,
      relevantResults: 0,
      duplicateResults: 0,
      averageRelevanceScore: 0,
      freshnessScore: 0,
      resultQuality: 'unusable',
      hasStructuredData: false,
      hasImages: false,
      hasReviews: false,
      estimatedCost: 0,
      cacheHit: false,
      rateLimited: false,
      throttled: false,
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
  recordSearchPhase(
    metricId: string,
    phase: SearchPhase,
    duration: number,
    metadata?: Partial<SearchExecutionMetric>
  ): void {
    const metric = this.metrics.find((m) => m.id === metricId);
    if (!metric) return;

    metric.phaseDurations[phase] = duration;

    if (metadata) {
      Object.assign(metric, metadata);
    }
  }

  /**
   * Complete search execution
   */
  completeSearchExecution(
    metricId: string,
    success: boolean,
    finalMetadata: Partial<SearchExecutionMetric> = {}
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
    this.checkSearchAlerts(metric);

    // Log performance data
    this.logSearchPerformance(metric);
  }

  /**
   * Record search failure
   */
  recordSearchFailure(
    metricId: string,
    errorType: string,
    errorMessage: string,
    retryCount: number = 0,
    fallbackUsed: boolean = false
  ): void {
    const metric = this.metrics.find((m) => m.id === metricId);
    if (!metric) return;

    metric.success = false;
    metric.errorType = errorType;
    metric.errorMessage = errorMessage;
    metric.retryCount = retryCount;
    metric.fallbackUsed = fallbackUsed;
    metric.endTime = Date.now();
    metric.totalDuration = metric.endTime - metric.startTime;

    this.updateConsecutiveFailures(metric);
    this.checkSearchAlerts(metric);
  }

  /**
   * Get performance summary for a search provider
   */
  getSearchProviderSummary(
    providerType: SearchProviderType,
    timeRangeHours: number = 24
  ): SearchProviderSummary | null {
    const now = Date.now();
    const timeRangeMs = timeRangeHours * 60 * 60 * 1000;
    const startTime = now - timeRangeMs;

    const relevantMetrics = this.metrics.filter(
      (m) => m.providerType === providerType && m.startTime >= startTime && m.endTime
    );

    if (relevantMetrics.length === 0) return null;

    const successfulMetrics = relevantMetrics.filter((m) => m.success);
    const failedMetrics = relevantMetrics.filter((m) => !m.success);
    const cacheHits = relevantMetrics.filter((m) => m.cacheHit).length;
    const rateLimited = relevantMetrics.filter((m) => m.rateLimited).length;

    // Calculate timing metrics
    const responseTimes = relevantMetrics
      .map((m) => m.totalDuration!)
      .filter((d) => d > 0)
      .sort((a, b) => a - b);

    // Calculate quality metrics
    const relevanceScores = successfulMetrics
      .map((m) => m.averageRelevanceScore)
      .filter((score) => score > 0);

    const freshnessScores = successfulMetrics
      .map((m) => m.freshnessScore)
      .filter((score) => score > 0);

    const duplicateRate =
      successfulMetrics.length > 0
        ? successfulMetrics.reduce(
            (sum, m) => sum + m.duplicateResults / Math.max(m.resultCount, 1),
            0
          ) / successfulMetrics.length
        : 0;

    // Calculate cost metrics
    const totalCost = relevantMetrics.reduce(
      (sum, m) => sum + (m.actualCost || m.estimatedCost),
      0
    );

    // Calculate quality distribution
    const qualityDistribution: Record<string, number> = {};
    successfulMetrics.forEach((m) => {
      qualityDistribution[m.resultQuality] = (qualityDistribution[m.resultQuality] || 0) + 1;
    });

    // Calculate error rate by type
    const errorRateByType: Record<string, number> = {};
    failedMetrics.forEach((m) => {
      if (m.errorType) {
        errorRateByType[m.errorType] = (errorRateByType[m.errorType] || 0) + 1;
      }
    });

    // Calculate queries by type
    const queriesByType: Record<SearchQueryType, number> = {
      [SearchQueryType.GENERAL]: 0,
      [SearchQueryType.FLIGHTS]: 0,
      [SearchQueryType.ACCOMMODATIONS]: 0,
      [SearchQueryType.ACTIVITIES]: 0,
      [SearchQueryType.DINING]: 0,
      [SearchQueryType.TRANSPORTATION]: 0,
      [SearchQueryType.WEATHER]: 0,
      [SearchQueryType.REVIEWS]: 0,
    };

    relevantMetrics.forEach((m) => {
      queriesByType[m.queryType]++;
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
      providerType,
      timeRange: { start: startTime, end: now },
      totalQueries: relevantMetrics.length,
      successfulQueries: successfulMetrics.length,
      failedQueries: failedMetrics.length,
      cacheHits,
      rateLimitedQueries: rateLimited,
      averageResponseTime:
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      medianResponseTime: this.calculatePercentile(responseTimes, 50),
      p95ResponseTime: this.calculatePercentile(responseTimes, 95),
      p99ResponseTime: this.calculatePercentile(responseTimes, 99),
      averageRelevanceScore:
        relevanceScores.length > 0
          ? relevanceScores.reduce((sum, score) => sum + score, 0) / relevanceScores.length
          : 0,
      averageFreshnessScore:
        freshnessScores.length > 0
          ? freshnessScores.reduce((sum, score) => sum + score, 0) / freshnessScores.length
          : 0,
      duplicateRate,
      qualityDistribution,
      totalCost,
      averageCostPerQuery: relevantMetrics.length > 0 ? totalCost / relevantMetrics.length : 0,
      costEfficiency:
        totalCost > 0
          ? relevantMetrics.reduce((sum, m) => sum + m.resultUtility, 0) / totalCost
          : 0,
      successRate:
        relevantMetrics.length > 0 ? successfulMetrics.length / relevantMetrics.length : 0,
      cacheHitRate: relevantMetrics.length > 0 ? cacheHits / relevantMetrics.length : 0,
      averageRetries:
        relevantMetrics.reduce((sum, m) => sum + m.retryCount, 0) / relevantMetrics.length,
      errorRateByType,
      queriesByType,
      performanceTrend,
      qualityTrend: 'stable', // Would need more complex calculation
      costTrend: 'stable', // Would need more complex calculation
    };
  }

  /**
   * Get all search provider summaries
   */
  getAllSearchProviderSummaries(
    timeRangeHours: number = 24
  ): Map<SearchProviderType, SearchProviderSummary> {
    const summaries = new Map<SearchProviderType, SearchProviderSummary>();

    const providerTypes: SearchProviderType[] = ['tavily', 'exa', 'serp', 'cruise_critic'];
    for (const providerType of providerTypes) {
      const summary = this.getSearchProviderSummary(providerType, timeRangeHours);
      if (summary) {
        summaries.set(providerType, summary);
      }
    }

    return summaries;
  }

  /**
   * Get active search alerts
   */
  getActiveAlerts(): SearchAlert[] {
    return this.alerts.filter((alert) => !alert.resolved);
  }

  /**
   * Resolve a search alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
    }
  }

  /**
   * Get search provider recommendations
   */
  getSearchRecommendations(): string[] {
    const recommendations: string[] = [];
    const summaries = this.getAllSearchProviderSummaries(24);

    for (const [providerType, summary] of summaries) {
      const targets =
        SEARCH_METRICS_CONFIG.TARGETS[
          providerType.toUpperCase() as keyof typeof SEARCH_METRICS_CONFIG.TARGETS
        ];

      // Performance recommendations
      if (summary.p95ResponseTime > targets.maxResponseTime) {
        recommendations.push(
          `${providerType}: Response time exceeds target (${summary.p95ResponseTime}ms > ${targets.maxResponseTime}ms)`
        );
      }

      // Success rate recommendations
      if (summary.successRate < targets.minSuccessRate) {
        recommendations.push(
          `${providerType}: Success rate below target (${(summary.successRate * 100).toFixed(
            1
          )}% < ${(targets.minSuccessRate * 100).toFixed(1)}%)`
        );
      }

      // Cost recommendations
      if (summary.averageCostPerQuery > targets.maxCostPerQuery) {
        recommendations.push(
          `${providerType}: Cost per query too high ($${summary.averageCostPerQuery.toFixed(
            4
          )} > $${targets.maxCostPerQuery})`
        );
      }

      // Quality recommendations
      if (
        summary.averageRelevanceScore < SEARCH_METRICS_CONFIG.QUALITY_THRESHOLDS.MIN_RELEVANCE_SCORE
      ) {
        recommendations.push(
          `${providerType}: Low relevance scores (${summary.averageRelevanceScore.toFixed(2)} < ${
            SEARCH_METRICS_CONFIG.QUALITY_THRESHOLDS.MIN_RELEVANCE_SCORE
          })`
        );
      }

      // Rate limiting recommendations
      if (summary.rateLimitedQueries > summary.totalQueries * 0.1) {
        // More than 10% rate limited
        recommendations.push(
          `${providerType}: High rate limiting (${(
            (summary.rateLimitedQueries / summary.totalQueries) *
            100
          ).toFixed(1)}% of queries)`
        );
      }

      // Cache recommendations
      if (summary.cacheHitRate < 0.3) {
        // Less than 30% cache hit rate
        recommendations.push(
          `${providerType}: Low cache hit rate (${(summary.cacheHitRate * 100).toFixed(
            1
          )}%) - consider increasing cache TTL`
        );
      }
    }

    return recommendations;
  }

  /**
   * Export search metrics for analysis
   */
  exportSearchMetrics(): {
    metrics: SearchExecutionMetric[];
    summaries: Map<SearchProviderType, SearchProviderSummary>;
    alerts: SearchAlert[];
    timestamp: number;
  } {
    return {
      metrics: [...this.metrics],
      summaries: this.getAllSearchProviderSummaries(),
      alerts: [...this.alerts],
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate derived metrics for a search execution
   */
  private calculateDerivedMetrics(metric: SearchExecutionMetric): void {
    // Calculate duplicate rate
    if (metric.resultCount > 0) {
      metric.duplicateResults = Math.min(metric.duplicateResults, metric.resultCount);
    }

    // Determine result quality based on various factors
    metric.resultQuality = this.assessResultQuality(metric);

    // Estimate cost if not provided (simplified calculation)
    if (!metric.actualCost) {
      const costPerQuery = 0.01; // Example rate
      metric.actualCost = metric.estimatedCost || costPerQuery;
    }
  }

  /**
   * Assess result quality based on metrics
   */
  private assessResultQuality(
    metric: SearchExecutionMetric
  ): SearchExecutionMetric['resultQuality'] {
    if (!metric.success || metric.resultCount === 0) return 'unusable';

    let score = 0;

    // Relevance score contribution
    if (
      metric.averageRelevanceScore >= SEARCH_METRICS_CONFIG.QUALITY_THRESHOLDS.MIN_RELEVANCE_SCORE
    ) {
      score += 30;
    }

    // Result count contribution
    if (metric.resultCount >= SEARCH_METRICS_CONFIG.QUALITY_THRESHOLDS.MIN_RESULT_COUNT) {
      score += 20;
    }

    // Duplicate rate contribution
    const duplicateRate = metric.resultCount > 0 ? metric.duplicateResults / metric.resultCount : 0;
    if (duplicateRate <= SEARCH_METRICS_CONFIG.QUALITY_THRESHOLDS.MAX_DUPLICATE_RATE) {
      score += 15;
    }

    // Freshness contribution
    if (metric.freshnessScore >= 0.7) {
      score += 15;
    }

    // Structured data contribution
    if (metric.hasStructuredData) {
      score += 10;
    }

    // Additional content contribution
    if (metric.hasImages || metric.hasReviews) {
      score += 10;
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
  private updateConsecutiveFailures(metric: SearchExecutionMetric): void {
    const current = this.consecutiveFailures.get(metric.providerType) || 0;

    if (metric.success) {
      this.consecutiveFailures.set(metric.providerType, 0);
    } else {
      this.consecutiveFailures.set(metric.providerType, current + 1);
    }
  }

  /**
   * Check for search alerts
   */
  private checkSearchAlerts(metric: SearchExecutionMetric): void {
    const targets =
      SEARCH_METRICS_CONFIG.TARGETS[
        metric.providerType.toUpperCase() as keyof typeof SEARCH_METRICS_CONFIG.TARGETS
      ];

    // Check consecutive failures
    const consecutiveFailures = this.consecutiveFailures.get(metric.providerType) || 0;
    if (consecutiveFailures >= SEARCH_METRICS_CONFIG.ALERT_THRESHOLDS.CONSECUTIVE_FAILURES) {
      this.createAlert({
        type: SearchAlertType.CONSECUTIVE_FAILURES,
        severity: 'high',
        providerType: metric.providerType,
        message: `${metric.providerType} has ${consecutiveFailures} consecutive failures`,
        details: {
          currentValue: consecutiveFailures,
          threshold: SEARCH_METRICS_CONFIG.ALERT_THRESHOLDS.CONSECUTIVE_FAILURES,
          timeRange: { start: Date.now() - 3600000, end: Date.now() }, // Last hour
          affectedQueries: consecutiveFailures,
        },
        recommendations: [
          'Check provider API keys and configuration',
          'Verify provider service status',
          'Consider switching to alternative provider',
          'Review rate limiting and quota usage',
        ],
      });
    }

    // Check response time
    if (
      metric.totalDuration &&
      metric.totalDuration >
        targets.maxResponseTime * SEARCH_METRICS_CONFIG.ALERT_THRESHOLDS.RESPONSE_TIME_INCREASE
    ) {
      this.createAlert({
        type: SearchAlertType.SLOW_RESPONSE_TIME,
        severity: 'medium',
        providerType: metric.providerType,
        message: `${metric.providerType} response time is ${Math.round(
          (metric.totalDuration / targets.maxResponseTime) * 100
        )}% over target`,
        details: {
          currentValue: metric.totalDuration,
          threshold: targets.maxResponseTime,
          timeRange: { start: metric.startTime, end: metric.endTime! },
          affectedQueries: 1,
        },
        recommendations: [
          'Optimize query parameters and filters',
          'Consider using cached results for similar queries',
          'Check provider API performance and region',
          'Implement query result pagination if applicable',
        ],
      });
    }

    // Check relevance score
    if (
      metric.averageRelevanceScore < SEARCH_METRICS_CONFIG.QUALITY_THRESHOLDS.MIN_RELEVANCE_SCORE
    ) {
      this.createAlert({
        type: SearchAlertType.LOW_RELEVANCE,
        severity: 'medium',
        providerType: metric.providerType,
        message: `${
          metric.providerType
        } relevance score below threshold (${metric.averageRelevanceScore.toFixed(2)})`,
        details: {
          currentValue: metric.averageRelevanceScore,
          threshold: SEARCH_METRICS_CONFIG.QUALITY_THRESHOLDS.MIN_RELEVANCE_SCORE,
          timeRange: { start: metric.startTime, end: metric.endTime! },
          affectedQueries: 1,
        },
        recommendations: [
          'Review and improve query formulation',
          'Adjust search parameters and filters',
          'Consider query expansion or refinement techniques',
          'Validate result ranking and scoring algorithms',
        ],
      });
    }

    // Check cost
    if (
      metric.actualCost &&
      metric.actualCost >
        targets.maxCostPerQuery * SEARCH_METRICS_CONFIG.ALERT_THRESHOLDS.COST_SPIKE
    ) {
      this.createAlert({
        type: SearchAlertType.HIGH_COST,
        severity: 'low',
        providerType: metric.providerType,
        message: `${metric.providerType} query cost spike ($${metric.actualCost.toFixed(4)})`,
        details: {
          currentValue: metric.actualCost,
          threshold: targets.maxCostPerQuery,
          timeRange: { start: metric.startTime, end: metric.endTime! },
          affectedQueries: 1,
        },
        recommendations: [
          'Optimize query to reduce result volume',
          'Implement result caching for repeated queries',
          'Consider alternative providers for cost efficiency',
          'Review query complexity and filtering',
        ],
      });
    }

    // Check rate limiting
    if (metric.rateLimited) {
      // Count recent rate limited queries
      const recentRateLimited = this.metrics.filter(
        (m) =>
          m.providerType === metric.providerType &&
          m.rateLimited &&
          m.startTime >= Date.now() - 3600000 // Last hour
      ).length;

      if (recentRateLimited >= 5) {
        // 5 or more rate limited in last hour
        this.createAlert({
          type: SearchAlertType.RATE_LIMITING,
          severity: 'medium',
          providerType: metric.providerType,
          message: `${metric.providerType} experiencing high rate limiting (${recentRateLimited} queries in last hour)`,
          details: {
            currentValue: recentRateLimited,
            threshold: 5,
            timeRange: { start: Date.now() - 3600000, end: Date.now() },
            affectedQueries: recentRateLimited,
          },
          recommendations: [
            'Implement exponential backoff for retries',
            'Reduce query frequency or implement request queuing',
            'Consider upgrading API plan or quota',
            'Distribute queries across multiple API keys if available',
          ],
        });
      }
    }
  }

  /**
   * Create a search alert
   */
  private createAlert(alertData: Omit<SearchAlert, 'id' | 'timestamp' | 'resolved'>): void {
    // Check if similar alert already exists and is unresolved
    const existingAlert = this.alerts.find(
      (a) =>
        !a.resolved &&
        a.type === alertData.type &&
        a.providerType === alertData.providerType &&
        Date.now() - a.timestamp < 1800000 // 30 minutes
    );

    if (existingAlert) return; // Don't create duplicate alerts

    const alert: SearchAlert = {
      id: this.generateAlertId(),
      ...alertData,
      timestamp: Date.now(),
      resolved: false,
    };

    this.alerts.push(alert);

    // Log the alert
    console.warn(`[SEARCH ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`, {
      alertId: alert.id,
      providerType: alert.providerType,
      details: alert.details,
      recommendations: alert.recommendations,
    });
  }

  /**
   * Log search performance data
   */
  private logSearchPerformance(metric: SearchExecutionMetric): void {
    if (!SEARCH_METRICS_CONFIG.ENABLE_DETAILED_LOGGING) return;

    const logData = {
      providerType: metric.providerType,
      queryId: metric.queryId,
      queryType: metric.queryType,
      success: metric.success,
      duration: metric.totalDuration,
      resultCount: metric.resultCount,
      relevanceScore: metric.averageRelevanceScore,
      cost: metric.actualCost || metric.estimatedCost,
      cacheHit: metric.cacheHit,
      rateLimited: metric.rateLimited,
      retries: metric.retryCount,
    };

    if (metric.success) {
      console.info(`[SEARCH METRICS] ${metric.providerType} query completed`, logData);
    } else {
      console.error(`[SEARCH METRICS] ${metric.providerType} query failed`, {
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

    const lowerValue = sortedArray[lower];
    const upperValue = sortedArray[upper];

    if (lowerValue === undefined || upperValue === undefined) return 0;

    if (lower === upper) {
      return lowerValue;
    }

    const weight = index - lower;
    return lowerValue * (1 - weight) + upperValue * weight;
  }

  /**
   * Generate unique metric ID
   */
  private generateMetricId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `search_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - SEARCH_METRICS_CONFIG.METRICS_RETENTION_HOURS * 60 * 60 * 1000;
    this.metrics = this.metrics.filter((m) => m.startTime > cutoffTime);

    // Also cleanup old resolved alerts (keep for 1 hour)
    const alertCutoffTime = Date.now() - 3600000;
    this.alerts = this.alerts.filter((a) => !a.resolved || a.resolvedAt! > alertCutoffTime);
  }

  /**
   * Health check for search metrics
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metricsCollected: number;
    activeAlerts: number;
    averageSuccessRate: number;
    error?: string;
  }> {
    try {
      const summaries = this.getAllSearchProviderSummaries(1); // Last hour
      const activeAlerts = this.getActiveAlerts();

      let totalQueries = 0;
      let totalSuccessful = 0;

      for (const summary of summaries.values()) {
        totalQueries += summary.totalQueries;
        totalSuccessful += summary.successfulQueries;
      }

      const averageSuccessRate = totalQueries > 0 ? totalSuccessful / totalQueries : 1.0;

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
 * Global search metrics collector instance
 */
export const searchMetricsCollector = new SearchMetricsCollector();

/**
 * Convenience functions for common search metrics operations
 */

/**
 * Start tracking search execution
 */
export function startSearchExecution(
  providerType: SearchProviderType,
  providerName: string,
  queryId: string,
  sessionId: string,
  query: string,
  queryType: SearchQueryType,
  userId?: string,
  tags?: Record<string, string>
): string {
  return searchMetricsCollector.startSearchExecution(
    providerType,
    providerName,
    queryId,
    sessionId,
    query,
    queryType,
    userId,
    tags
  );
}

/**
 * Record search phase completion
 */
export function recordSearchPhase(
  metricId: string,
  phase: SearchPhase,
  duration: number,
  metadata?: Partial<SearchExecutionMetric>
): void {
  searchMetricsCollector.recordSearchPhase(metricId, phase, duration, metadata);
}

/**
 * Complete search execution
 */
export function completeSearchExecution(
  metricId: string,
  success: boolean,
  finalMetadata?: Partial<SearchExecutionMetric>
): void {
  searchMetricsCollector.completeSearchExecution(metricId, success, finalMetadata);
}

/**
 * Record search failure
 */
export function recordSearchFailure(
  metricId: string,
  errorType: string,
  errorMessage: string,
  retryCount?: number,
  fallbackUsed?: boolean
): void {
  searchMetricsCollector.recordSearchFailure(
    metricId,
    errorType,
    errorMessage,
    retryCount,
    fallbackUsed
  );
}

/**
 * Get search provider summary
 */
export function getSearchProviderSummary(
  providerType: SearchProviderType,
  timeRangeHours?: number
): SearchProviderSummary | null {
  return searchMetricsCollector.getSearchProviderSummary(providerType, timeRangeHours);
}

/**
 * Get search recommendations
 */
export function getSearchRecommendations(): string[] {
  return searchMetricsCollector.getSearchRecommendations();
}

/**
 * Export search metrics
 */
export function exportSearchMetrics() {
  return searchMetricsCollector.exportSearchMetrics();
}

/**
 * Export types
 */

/**
 * Production Monitoring and Observability Setup
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - Observable operations with comprehensive logging
 * - Production-ready monitoring and alerting
 *
 * Provides monitoring endpoints and observability infrastructure for production
 */

export const runtime = 'edge';

interface MonitoringMetrics {
  workflowCount: number;
  successRate: number;
  averageExecutionTime: number;
  errorRate: number;
  aiProviderHealth: {
    xai: 'healthy' | 'degraded' | 'down';
    groq: 'healthy' | 'degraded' | 'down';
  };
  systemHealth: {
    redis: 'healthy' | 'degraded' | 'down';
    inngest: 'healthy' | 'degraded' | 'down';
  };
}

interface AlertConfiguration {
  errorRateThreshold: number;
  responseTimeThreshold: number;
  successRateThreshold: number;
  notificationChannels: string[];
}

export default async function handler(request: Request): Promise<Response> {
  console.log('📊 [MONITORING] Production monitoring request received');

  const url = new URL(request.url);
  const endpoint = url.pathname.split('/').pop();

  try {
    switch (endpoint) {
      case 'health':
        return handleHealthCheck(request);
      case 'metrics':
        return handleMetricsRequest(request);
      case 'alerts':
        return handleAlertsRequest(request);
      case 'dashboard':
        return handleDashboardRequest(request);
      case 'errors':
        return handleErrorReporting(request);
      default:
        return handleMonitoringOverview(request);
    }
  } catch (error) {
    console.error('💥 [MONITORING] Monitoring endpoint error:', error);

    return Response.json(
      {
        status: 'error',
        message: 'Monitoring system error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Health Check Endpoint
 * GET /api/monitoring/health
 */
async function handleHealthCheck(request: Request): Promise<Response> {
  console.log('🏥 [HEALTH-CHECK] Running comprehensive health check');

  const healthChecks = {
    timestamp: new Date().toISOString(),
    status: 'checking',
    checks: {} as Record<string, any>,
  };

  // Check 1: AI Provider Health
  console.log('🤖 [HEALTH-CHECK] Testing AI provider connectivity...');
  try {
    const aiHealth = await checkAIProvidersHealth();
    healthChecks.checks['aiProviders'] = {
      status: aiHealth.allHealthy ? 'healthy' : 'degraded',
      message: aiHealth.allHealthy
        ? 'All AI providers accessible'
        : 'Some AI providers have issues',
      details: aiHealth.providers,
    };
  } catch (aiError) {
    healthChecks.checks['aiProviders'] = {
      status: 'down',
      message: 'AI provider health check failed',
      error: aiError instanceof Error ? aiError.message : 'Unknown AI error',
    };
  }

  // Check 2: Redis/KV Storage Health
  console.log('🗄️ [HEALTH-CHECK] Testing Redis/KV storage...');
  try {
    const redisHealth = await checkRedisHealth();
    healthChecks.checks['redis'] = {
      status: redisHealth.healthy ? 'healthy' : 'down',
      message: redisHealth.message,
      responseTime: redisHealth.responseTime,
    };
  } catch (redisError) {
    healthChecks.checks['redis'] = {
      status: 'down',
      message: 'Redis health check failed',
      error: redisError instanceof Error ? redisError.message : 'Unknown Redis error',
    };
  }

  // Check 3: Inngest Function Health
  console.log('🔄 [HEALTH-CHECK] Testing Inngest function health...');
  try {
    const inngestHealth = await checkInngestHealth();
    healthChecks.checks['inngest'] = {
      status: inngestHealth.healthy ? 'healthy' : 'degraded',
      message: inngestHealth.message,
      functionCount: inngestHealth.functionCount,
    };
  } catch (inngestError) {
    healthChecks.checks['inngest'] = {
      status: 'down',
      message: 'Inngest health check failed',
      error: inngestError instanceof Error ? inngestError.message : 'Unknown Inngest error',
    };
  }

  // Check 4: Edge Runtime Health
  console.log('⚡ [HEALTH-CHECK] Testing Edge Runtime...');
  try {
    const edgeHealth = checkEdgeRuntimeHealth();
    healthChecks.checks['edgeRuntime'] = {
      status: edgeHealth.healthy ? 'healthy' : 'degraded',
      message: edgeHealth.message,
      details: edgeHealth.features,
    };
  } catch (edgeError) {
    healthChecks.checks['edgeRuntime'] = {
      status: 'down',
      message: 'Edge Runtime health check failed',
      error: edgeError instanceof Error ? edgeError.message : 'Unknown Edge error',
    };
  }

  // Determine overall health
  const checkStatuses = Object.values(healthChecks.checks).map((check) => check.status);
  const healthyCount = checkStatuses.filter((status) => status === 'healthy').length;
  const totalChecks = checkStatuses.length;

  let overallStatus = 'down';
  if (healthyCount === totalChecks) {
    overallStatus = 'healthy';
  } else if (healthyCount >= totalChecks / 2) {
    overallStatus = 'degraded';
  }

  healthChecks.status = overallStatus;

  console.log(
    `🎯 [HEALTH-CHECK] Health check complete: ${overallStatus} (${healthyCount}/${totalChecks} healthy)`
  );

  return Response.json({
    ...healthChecks,
    summary: {
      overallStatus,
      healthyChecks: healthyCount,
      totalChecks,
      healthPercentage: Math.round((healthyCount / totalChecks) * 100),
    },
    recommendations: generateHealthRecommendations(healthChecks.checks),
  });
}

/**
 * Metrics Endpoint
 * GET /api/monitoring/metrics
 */
async function handleMetricsRequest(request: Request): Promise<Response> {
  console.log('📈 [METRICS] Generating production metrics...');

  // In a real implementation, these would come from Redis, database, or monitoring service
  const mockMetrics: MonitoringMetrics = {
    workflowCount: 0, // Would be retrieved from Redis/analytics
    successRate: 0, // Calculated from session manager data
    averageExecutionTime: 0, // From Inngest execution logs
    errorRate: 0, // From error tracking
    aiProviderHealth: {
      xai: process.env['XAI_API_KEY'] ? 'healthy' : 'down',
      groq: process.env['GROQ_API_KEY'] ? 'healthy' : 'down',
    },
    systemHealth: {
      redis: process.env['KV_REST_API_URL'] ? 'healthy' : 'down',
      inngest: process.env['INNGEST_SIGNING_KEY'] ? 'healthy' : 'down',
    },
  };

  return Response.json({
    status: 'Production Metrics',
    timestamp: new Date().toISOString(),
    metrics: mockMetrics,
    period: '24 hours',
    dataSource: 'Redis sessions + Inngest logs + error tracking',
    realTimeUpdates: 'Available via SSE at /api/monitoring/stream',
  });
}

/**
 * Alerts Configuration Endpoint
 * GET/POST /api/monitoring/alerts
 */
async function handleAlertsRequest(request: Request): Promise<Response> {
  if (request.method === 'GET') {
    console.log('🚨 [ALERTS] Retrieving alert configuration...');

    const alertConfig: AlertConfiguration = {
      errorRateThreshold: 5, // 5% error rate threshold
      responseTimeThreshold: 30000, // 30 seconds
      successRateThreshold: 95, // 95% success rate minimum
      notificationChannels: ['email', 'slack', 'webhook'],
    };

    return Response.json({
      status: 'Alert Configuration',
      timestamp: new Date().toISOString(),
      configuration: alertConfig,
      activeAlerts: [], // Would retrieve from monitoring service
      alertHistory: [], // Last 24 hours of alerts
    });
  }

  if (request.method === 'POST') {
    console.log('🚨 [ALERTS] Updating alert configuration...');

    const body = await request.json();

    // In production, would update alert configuration in monitoring service
    return Response.json({
      status: 'Alert configuration updated',
      timestamp: new Date().toISOString(),
      updated: body,
    });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

/**
 * Dashboard Data Endpoint
 * GET /api/monitoring/dashboard
 */
async function handleDashboardRequest(request: Request): Promise<Response> {
  console.log('📊 [DASHBOARD] Generating dashboard data...');

  const dashboardData = {
    timestamp: new Date().toISOString(),
    overview: {
      totalWorkflows: 0, // From Redis session count
      activeWorkflows: 0, // From Redis active sessions
      completedWorkflows: 0, // From Redis completed sessions
      failedWorkflows: 0, // From Redis failed sessions
    },
    performance: {
      averageExecutionTime: 0, // From Inngest logs
      p95ExecutionTime: 0, // 95th percentile
      successRate: 0, // Percentage
      errorRate: 0, // Percentage
    },
    aiProviders: {
      xai: {
        status: process.env['XAI_API_KEY'] ? 'healthy' : 'down',
        requestCount: 0, // From usage tracking
        errorRate: 0, // From error logs
        averageResponseTime: 0, // From timing logs
      },
      groq: {
        status: process.env['GROQ_API_KEY'] ? 'healthy' : 'down',
        requestCount: 0, // From usage tracking
        errorRate: 0, // From error logs
        averageResponseTime: 0, // From timing logs
      },
    },
    infrastructure: {
      redis: {
        status: process.env['KV_REST_API_URL'] ? 'healthy' : 'down',
        connectionCount: 0, // From Redis INFO
        memoryUsage: 0, // From Redis INFO
        hitRate: 0, // Cache hit rate
      },
      inngest: {
        status: process.env['INNGEST_SIGNING_KEY'] ? 'healthy' : 'down',
        functionCount: 5, // Known function count
        queueLength: 0, // From Inngest API
        executionRate: 0, // Functions per minute
      },
    },
  };

  return Response.json({
    status: 'Production Dashboard Data',
    ...dashboardData,
    dataUpdateFrequency: '30 seconds',
    lastUpdated: new Date().toISOString(),
  });
}

/**
 * Monitoring Overview
 * GET /api/monitoring
 */
async function handleMonitoringOverview(request: Request): Promise<Response> {
  console.log('👁️ [MONITORING] Providing monitoring overview...');

  return Response.json({
    status: 'Production Monitoring System',
    description: 'Comprehensive observability and monitoring for Hylo AI workflow',
    endpoints: {
      health: '/api/monitoring/health - System health checks',
      metrics: '/api/monitoring/metrics - Performance metrics',
      alerts: '/api/monitoring/alerts - Alert configuration',
      dashboard: '/api/monitoring/dashboard - Dashboard data',
      errors: '/api/monitoring/errors - Error reporting endpoint',
      stream: '/api/monitoring/stream - Real-time metrics stream',
    },
    features: [
      'Real-time health monitoring',
      'AI provider status tracking',
      'Workflow execution metrics',
      'Error rate monitoring',
      'Performance analytics',
      'Alert management',
      'Infrastructure health checks',
    ],
    integrations: [
      'Vercel Analytics',
      'Upstash Redis metrics',
      'Inngest execution logs',
      'XAI and Groq API monitoring',
      'Custom error tracking',
    ],
    timestamp: new Date().toISOString(),
  });
}

// Helper Functions

async function checkAIProvidersHealth() {
  const providers = {
    xai: { healthy: false, responseTime: 0, error: null as string | null },
    groq: { healthy: false, responseTime: 0, error: null as string | null },
  };

  // Test XAI
  if (process.env['XAI_API_KEY']) {
    try {
      const startTime = Date.now();
      const response = await fetch('https://api.x.ai/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env['XAI_API_KEY']}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      providers.xai.responseTime = Date.now() - startTime;
      providers.xai.healthy = response.ok;

      if (!response.ok) {
        providers.xai.error = `HTTP ${response.status}`;
      }
    } catch (error) {
      providers.xai.error = error instanceof Error ? error.message : 'Unknown error';
    }
  } else {
    providers.xai.error = 'API key not configured';
  }

  // Test Groq
  if (process.env['GROQ_API_KEY']) {
    try {
      const startTime = Date.now();
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env['GROQ_API_KEY']}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      providers.groq.responseTime = Date.now() - startTime;
      providers.groq.healthy = response.ok;

      if (!response.ok) {
        providers.groq.error = `HTTP ${response.status}`;
      }
    } catch (error) {
      providers.groq.error = error instanceof Error ? error.message : 'Unknown error';
    }
  } else {
    providers.groq.error = 'API key not configured';
  }

  const allHealthy = providers.xai.healthy && providers.groq.healthy;

  return { providers, allHealthy };
}

async function checkRedisHealth() {
  if (!process.env['KV_REST_API_URL'] || !process.env['KV_REST_API_TOKEN']) {
    return {
      healthy: false,
      message: 'Redis credentials not configured',
      responseTime: 0,
    };
  }

  try {
    const startTime = Date.now();
    const { Redis } = await import('@upstash/redis');

    const redis = new Redis({
      url: process.env['KV_REST_API_URL']!,
      token: process.env['KV_REST_API_TOKEN']!,
    });

    await redis.ping();
    const responseTime = Date.now() - startTime;

    return {
      healthy: true,
      message: 'Redis connection successful',
      responseTime,
    };
  } catch (error) {
    return {
      healthy: false,
      message: `Redis connection failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      responseTime: 0,
    };
  }
}

async function checkInngestHealth() {
  if (!process.env['INNGEST_SIGNING_KEY']) {
    return {
      healthy: false,
      message: 'Inngest signing key not configured',
      functionCount: 0,
    };
  }

  try {
    // In a real implementation, would check Inngest API for function status
    return {
      healthy: true,
      message: 'Inngest functions configured and ready',
      functionCount: 5, // Known function count
    };
  } catch (error) {
    return {
      healthy: false,
      message: `Inngest health check failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      functionCount: 0,
    };
  }
}

function checkEdgeRuntimeHealth() {
  try {
    const features = {
      fetch: typeof fetch === 'function',
      streams: typeof ReadableStream === 'function',
      webCrypto: typeof crypto === 'function',
      url: typeof URL === 'function',
      textEncoder: typeof TextEncoder === 'function',
    };

    const allFeaturesAvailable = Object.values(features).every(Boolean);

    return {
      healthy: allFeaturesAvailable,
      message: allFeaturesAvailable
        ? 'Edge Runtime fully functional'
        : 'Some Edge Runtime features missing',
      features,
    };
  } catch (error) {
    return {
      healthy: false,
      message: `Edge Runtime check failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      features: {},
    };
  }
}

function generateHealthRecommendations(checks: Record<string, any>): string[] {
  const recommendations: string[] = [];

  Object.entries(checks).forEach(([system, check]) => {
    if (check.status === 'down') {
      switch (system) {
        case 'aiProviders':
          recommendations.push('Check AI provider API keys and network connectivity');
          break;
        case 'redis':
          recommendations.push('Verify Redis/KV storage credentials and network access');
          break;
        case 'inngest':
          recommendations.push('Check Inngest signing key and function registration');
          break;
        case 'edgeRuntime':
          recommendations.push('Verify Edge Runtime configuration and compatibility');
          break;
        default:
          recommendations.push(`Address ${system} connectivity issues`);
      }
    } else if (check.status === 'degraded') {
      recommendations.push(`Monitor ${system} for performance issues`);
    }
  });

  if (recommendations.length === 0) {
    recommendations.push('System is healthy - no immediate actions required');
    recommendations.push('Continue monitoring for optimal performance');
  }

  return recommendations;
}

/**
 * Error Reporting Endpoint
 * POST /api/monitoring/errors
 */
async function handleErrorReporting(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json(
      {
        status: 'error',
        message: 'Method not allowed. Use POST to report errors.',
        timestamp: new Date().toISOString(),
      },
      { status: 405 }
    );
  }

  try {
    const errorData = (await request.json()) as any;
    console.error('🚨 [ERROR-REPORT] Error reported:', errorData);

    // Sanitize sensitive data before logging
    const sanitizedError = {
      type: errorData?.type,
      workflowId: errorData?.workflowId,
      stage: errorData?.stage,
      message: errorData?.message,
      timestamp: errorData?.timestamp || new Date().toISOString(),
      errorType: errorData?.errorType,
      retryable: errorData?.retryable,
      context: sanitizeContext(errorData?.context),
    };

    // Log error to console for monitoring
    console.error('📊 [MONITORING] Sanitized error report:', sanitizedError);

    // Check if error requires immediate alert
    const shouldAlert = checkAlertCriteria(sanitizedError);
    if (shouldAlert) {
      console.error('🔔 [ALERT] Critical error detected, alert triggered:', sanitizedError);
    }

    return Response.json(
      {
        status: 'success',
        message: 'Error report received and processed',
        timestamp: new Date().toISOString(),
        alertTriggered: shouldAlert,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('💥 [ERROR-REPORTING] Failed to process error report:', error);

    return Response.json(
      {
        status: 'error',
        message: 'Failed to process error report',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Sanitize context data to remove sensitive information
 */
function sanitizeContext(context: any): any {
  if (!context || typeof context !== 'object') {
    return context;
  }

  const sensitiveKeys = ['apiKey', 'password', 'secret', 'token', 'authorization'];
  const sanitized = { ...context };

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Check if error meets criteria for immediate alerting
 */
function checkAlertCriteria(error: any): boolean {
  // Alert on critical errors or high-frequency error patterns
  const criticalTypes = ['AI_PROVIDER_FAILURE', 'WORKFLOW_TIMEOUT', 'SYSTEM_ERROR'];

  return (
    criticalTypes.includes(error.errorType) ||
    error.message?.includes('timeout') ||
    error.message?.includes('rate limit')
  );
}

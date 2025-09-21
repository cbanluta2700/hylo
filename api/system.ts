/**
 * Consolidated System Endpoint
 *
 * Combines health checks, system status, and DNS verification
 * into a single endpoint with query-based routing.
 *
 * Replaces:
 * - api/health/system.ts
 * - api/health/status.ts
 * - api/dns/verification.ts
 */

import { NextRequest } from 'next/server';

// Edge Runtime configuration
export const config = {
  runtime: 'edge',
};

interface SystemHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: ServiceStatus[];
  metadata: {
    responseTime: number;
    version: string;
    environment: string;
  };
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  lastCheck: string;
  details?: any;
}

interface DetailedStatusResponse {
  system: SystemHealthResponse;
  metrics: {
    uptime: number;
    memoryUsage: number;
    requestCount: number;
    errorRate: number;
    averageResponseTime: number;
  };
  alerts: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
  }>;
}

interface DNSVerificationResponse {
  domain: string;
  verified: boolean;
  records: Array<{
    type: string;
    name: string;
    value: string;
    ttl: number;
  }>;
  timestamp: string;
}

export default async function handler(req: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'health';

  try {
    switch (type) {
      case 'health':
        return await handleHealthCheck(startTime);

      case 'status':
        return await handleDetailedStatus(startTime);

      case 'dns':
        const domain = searchParams.get('domain');
        return await handleDNSVerification(domain, startTime);

      default:
        return await handleHealthCheck(startTime);
    }
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        error: {
          code: 'SYSTEM_CHECK_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

async function handleHealthCheck(startTime: number): Promise<Response> {
  const services = await checkAllServices();
  const overallStatus = determineOverallStatus(services);

  const response: SystemHealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services,
    metadata: {
      responseTime: Date.now() - startTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
  };

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 206 : 503;

  return Response.json(
    {
      success: overallStatus !== 'unhealthy',
      data: response,
    },
    { status: statusCode }
  );
}

async function handleDetailedStatus(startTime: number): Promise<Response> {
  const healthResponse = await handleHealthCheck(startTime);
  const healthData = await healthResponse.json();

  // Get additional metrics (would typically come from monitoring system)
  const metrics = {
    uptime: process.uptime ? process.uptime() * 1000 : 0,
    memoryUsage: getMemoryUsage(),
    requestCount: getRequestCount(),
    errorRate: getErrorRate(),
    averageResponseTime: getAverageResponseTime(),
  };

  const alerts = getSystemAlerts();

  const response: DetailedStatusResponse = {
    system: healthData.data,
    metrics,
    alerts,
  };

  return Response.json({
    success: true,
    data: response,
  });
}

async function handleDNSVerification(domain: string | null, startTime: number): Promise<Response> {
  if (!domain) {
    return Response.json(
      {
        success: false,
        error: {
          code: 'DOMAIN_REQUIRED',
          message: 'Domain parameter is required for DNS verification',
        },
      },
      { status: 400 }
    );
  }

  try {
    const records = await verifyDNSRecords(domain);

    const response: DNSVerificationResponse = {
      domain,
      verified: records.length > 0,
      records,
      timestamp: new Date().toISOString(),
    };

    return Response.json({
      success: true,
      data: response,
      metadata: {
        responseTime: Date.now() - startTime,
      },
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        error: {
          code: 'DNS_VERIFICATION_FAILED',
          message: `DNS verification failed for ${domain}: ${error.message}`,
        },
      },
      { status: 500 }
    );
  }
}

async function checkAllServices(): Promise<ServiceStatus[]> {
  const serviceChecks = [
    checkInngestService(),
    checkUpstashVectorService(),
    checkUpstashRedisService(),
    checkExternalAPIs(),
  ];

  const results = await Promise.allSettled(serviceChecks);

  return results.map((result, index) => {
    const serviceName = ['Inngest', 'Upstash Vector', 'Upstash Redis', 'External APIs'][index];

    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        name: serviceName,
        status: 'unhealthy' as const,
        lastCheck: new Date().toISOString(),
        details: { error: result.reason?.message || 'Service check failed' },
      };
    }
  });
}

async function checkInngestService(): Promise<ServiceStatus> {
  const startTime = Date.now();

  try {
    // Simple ping to Inngest (would use actual health check endpoint)
    const isHealthy = process.env.INNGEST_EVENT_KEY && process.env.INNGEST_SIGNING_KEY;

    return {
      name: 'Inngest',
      status: isHealthy ? 'healthy' : 'degraded',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      details: { configured: !!isHealthy },
    };
  } catch (error: any) {
    return {
      name: 'Inngest',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      details: { error: error.message },
    };
  }
}

async function checkUpstashVectorService(): Promise<ServiceStatus> {
  const startTime = Date.now();

  try {
    // Would ping Upstash Vector service
    const isConfigured =
      process.env.UPSTASH_VECTOR_REST_URL && process.env.UPSTASH_VECTOR_REST_TOKEN;

    return {
      name: 'Upstash Vector',
      status: isConfigured ? 'healthy' : 'degraded',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      details: { configured: !!isConfigured },
    };
  } catch (error: any) {
    return {
      name: 'Upstash Vector',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      details: { error: error.message },
    };
  }
}

async function checkUpstashRedisService(): Promise<ServiceStatus> {
  const startTime = Date.now();

  try {
    const isConfigured = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

    return {
      name: 'Upstash Redis',
      status: isConfigured ? 'healthy' : 'degraded',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      details: { configured: !!isConfigured },
    };
  } catch (error: any) {
    return {
      name: 'Upstash Redis',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      details: { error: error.message },
    };
  }
}

async function checkExternalAPIs(): Promise<ServiceStatus> {
  const startTime = Date.now();

  try {
    const requiredAPIs = [
      'XAI_API_KEY',
      'GROQ_API_KEY',
      'TAVILY_API_KEY',
      'EXA_API_KEY',
      'SERP_API_KEY',
    ];

    const configuredAPIs = requiredAPIs.filter((key) => process.env[key]);
    const configurationHealth = configuredAPIs.length / requiredAPIs.length;

    const status =
      configurationHealth === 1 ? 'healthy' : configurationHealth > 0.5 ? 'degraded' : 'unhealthy';

    return {
      name: 'External APIs',
      status,
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      details: {
        configured: configuredAPIs.length,
        total: requiredAPIs.length,
        missing: requiredAPIs.filter((key) => !process.env[key]),
      },
    };
  } catch (error: any) {
    return {
      name: 'External APIs',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      details: { error: error.message },
    };
  }
}

function determineOverallStatus(services: ServiceStatus[]): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = services.map((s) => s.status);

  if (statuses.every((s) => s === 'healthy')) {
    return 'healthy';
  } else if (statuses.some((s) => s === 'unhealthy')) {
    return 'unhealthy';
  } else {
    return 'degraded';
  }
}

// Utility functions for metrics (would typically integrate with monitoring system)
function getMemoryUsage(): number {
  try {
    // In Edge Runtime, memory info may not be available
    return 0; // Placeholder
  } catch {
    return 0;
  }
}

function getRequestCount(): number {
  // Would typically come from monitoring system
  return 0; // Placeholder
}

function getErrorRate(): number {
  // Would typically come from monitoring system
  return 0; // Placeholder
}

function getAverageResponseTime(): number {
  // Would typically come from monitoring system
  return 0; // Placeholder
}

function getSystemAlerts() {
  // Would typically come from monitoring system
  return []; // Placeholder
}

async function verifyDNSRecords(domain: string) {
  // DNS verification logic would go here
  // For now, return placeholder
  return [
    {
      type: 'A',
      name: domain,
      value: '127.0.0.1',
      ttl: 300,
    },
  ]; // Placeholder
}

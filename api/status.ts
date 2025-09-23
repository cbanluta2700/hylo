/**
 * API Status Dashboard Endpoint
 *
 * Provides detailed status information for all API endpoints
 * Used for monitoring and debugging API health
 */

export const config = {
  runtime: 'edge',
};

interface ApiEndpointStatus {
  endpoint: string;
  name: string;
  description: string;
  status: 'online' | 'offline' | 'degraded' | 'unknown';
  lastChecked: string;
  responseTime?: number;
  statusCode?: number;
  error?: string;
  dependencies?: string[];
}

interface ApiStatusResponse {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  totalEndpoints: number;
  healthyEndpoints: number;
  endpoints: ApiEndpointStatus[];
}

/**
 * Test a single API endpoint
 */
async function testEndpoint(
  baseUrl: string,
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  testData?: any
): Promise<ApiEndpointStatus> {
  const startTime = Date.now();
  const fullUrl = `${baseUrl}${endpoint}`;

  const endpointInfo = getEndpointInfo(endpoint);

  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (method === 'POST' && testData) {
      options.body = JSON.stringify(testData);
    }

    // Use Promise.race for timeout instead of AbortSignal.timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 10000);
    });

    const fetchPromise = fetch(fullUrl, options);
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    const responseTime = Date.now() - startTime;

    let status: 'online' | 'offline' | 'degraded' = 'online';
    if (response.status >= 500) {
      status = 'offline';
    } else if (response.status >= 400) {
      status = 'degraded';
    }

    return {
      ...endpointInfo,
      endpoint,
      status,
      lastChecked: new Date().toISOString(),
      responseTime,
      statusCode: response.status,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      ...endpointInfo,
      endpoint,
      status: 'offline',
      lastChecked: new Date().toISOString(),
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get endpoint information
 */
function getEndpointInfo(
  endpoint: string
): Omit<ApiEndpointStatus, 'endpoint' | 'status' | 'lastChecked'> {
  const endpointMap: Record<
    string,
    Omit<ApiEndpointStatus, 'endpoint' | 'status' | 'lastChecked'>
  > = {
    '/api/health': {
      name: 'Health Check',
      description: 'System health monitoring and diagnostics',
      dependencies: ['Environment Variables', 'Edge Runtime'],
    },
    '/api/validate-env': {
      name: 'Environment Validation',
      description: 'Validates all required environment variables and external service connectivity',
      dependencies: ['AI Providers', 'Redis', 'Vector DB', 'Search Providers'],
    },
    '/api/inngest': {
      name: 'Inngest Integration',
      description: 'Workflow orchestration system status',
      dependencies: ['Inngest Service', 'Environment Variables'],
    },
    '/api/itinerary/generate': {
      name: 'Generate Itinerary',
      description: 'Main endpoint for starting AI-powered itinerary generation',
      dependencies: ['Form Validation', 'Workflow Session', 'Inngest', 'Redis'],
    },
    '/api/itinerary/get-itinerary': {
      name: 'Get Itinerary',
      description: 'Retrieves completed itinerary results',
      dependencies: ['Redis', 'Workflow Session'],
    },
    '/api/itinerary/progress-simple': {
      name: 'Progress Updates',
      description: 'Server-sent events for real-time workflow progress',
      dependencies: ['Redis', 'SSE Support'],
    },
    '/api/inngest/webhook': {
      name: 'Inngest Webhook',
      description: 'Handles workflow execution callbacks from Inngest',
      dependencies: ['Inngest Authentication', 'Workflow Processing'],
    },
  };

  return (
    endpointMap[endpoint] || {
      name: endpoint
        .replace('/api/', '')
        .replace(/\//g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      description: 'API endpoint',
      dependencies: [],
    }
  );
}

/**
 * Main status check handler
 */
export default async function handler(req: Request): Promise<Response> {
  console.log('📊 API Status Dashboard - Starting comprehensive check');

  const url = new URL(req.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  try {
    const endpoints: ApiEndpointStatus[] = [];

    // Core system endpoints
    const coreEndpoints = [
      { path: '/api/health', method: 'GET' as const },
      { path: '/api/validate-env', method: 'GET' as const },
      { path: '/api/inngest', method: 'GET' as const },
    ];

    // Itinerary workflow endpoints
    const workflowEndpoints = [
      {
        path: '/api/itinerary/generate',
        method: 'POST' as const,
        testData: {
          sessionId: 'health-check-session-123',
          formData: {
            location: 'test-health-check',
            departDate: '2025-10-01',
            returnDate: '2025-10-05',
            budget: 1000,
            adults: 2,
            flexibleDates: false,
          },
        },
      },
      { path: '/api/itinerary/get-itinerary?workflowId=health-check-test', method: 'GET' as const },
      { path: '/api/itinerary/progress-simple', method: 'GET' as const },
    ];

    // Integration endpoints
    const integrationEndpoints = [
      { path: '/api/inngest/webhook', method: 'POST' as const, testData: { test: true } },
    ];

    const allEndpoints = [...coreEndpoints, ...workflowEndpoints, ...integrationEndpoints];

    console.log(`📡 Testing ${allEndpoints.length} API endpoints...`);

    // Test all endpoints
    for (const endpointConfig of allEndpoints) {
      const { path, method } = endpointConfig;
      const testData = 'testData' in endpointConfig ? endpointConfig.testData : undefined;

      console.log(`🔍 Testing ${method} ${path}...`);
      try {
        const result = await testEndpoint(baseUrl, path, method, testData);
        endpoints.push(result);
        console.log(
          `${
            result.status === 'online' ? '✅' : result.status === 'degraded' ? '⚠️' : '❌'
          } ${path}: ${result.statusCode || 'ERROR'} (${result.responseTime}ms)`
        );
      } catch (error) {
        console.log(`💥 Error testing ${path}:`, error);
        endpoints.push({
          ...getEndpointInfo(path),
          endpoint: path,
          status: 'offline',
          lastChecked: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Test failed',
        });
      }
    }

    // Calculate overall health
    const healthyCount = endpoints.filter((ep) => ep.status === 'online').length;
    const degradedCount = endpoints.filter((ep) => ep.status === 'degraded').length;
    const offlineCount = endpoints.filter((ep) => ep.status === 'offline').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (offlineCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    }

    const response: ApiStatusResponse = {
      overall,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      totalEndpoints: endpoints.length,
      healthyEndpoints: healthyCount,
      endpoints: endpoints.sort((a, b) => a.endpoint.localeCompare(b.endpoint)),
    };

    console.log(`🎯 API Status Summary: ${overall.toUpperCase()}`);
    console.log(`📊 ${healthyCount} healthy, ${degradedCount} degraded, ${offlineCount} offline`);

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'X-Total-Endpoints': endpoints.length.toString(),
        'X-Healthy-Endpoints': healthyCount.toString(),
        'X-Overall-Status': overall,
      },
    });
  } catch (error) {
    console.error('💥 API Status check failed:', error);

    const errorResponse: ApiStatusResponse = {
      overall: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      totalEndpoints: 0,
      healthyEndpoints: 0,
      endpoints: [],
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export async function GET(req: Request) {
  return handler(req);
}

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

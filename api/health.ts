/**
 * Health Check Endpoint for AI-Powered Itinerary Generation
 *
 * Verifies Edge Runtime compatibility and environment configuration
 * Constitutional requirement: All API endpoints must use Edge Runtime
 *
 * Compatible with Vercel Edge Runtime and Web APIs
 */

// Export Edge Runtime configuration (constitutional requirement)
export const config = {
  runtime: 'edge',
};

/**
 * API endpoint health status
 */
interface ApiEndpointHealth {
  endpoint: string;
  status: 'healthy' | 'unhealthy' | 'not-tested';
  responseTime?: number;
  statusCode?: number;
  error?: string;
}

/**
 * Health check response interface
 */
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    edgeRuntime: boolean;
    environmentVariables: boolean;
    aiProviders: boolean;
    stateManagement: boolean;
    searchProviders: boolean;
    apiEndpoints: boolean;
  };
  apiEndpoints?: ApiEndpointHealth[];
  details?: {
    missingVars?: string[];
    errors?: string[];
  };
}

/**
 * Test API endpoint health
 */
async function testApiEndpoint(
  baseUrl: string,
  endpoint: string,
  testMethod: 'GET' | 'POST' = 'GET',
  testData?: any
): Promise<ApiEndpointHealth> {
  const startTime = Date.now();
  const fullUrl = `${baseUrl}${endpoint}`;

  try {
    const options: RequestInit = {
      method: testMethod,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (testMethod === 'POST' && testData) {
      options.body = JSON.stringify(testData);
    }

    const response = await fetch(fullUrl, options);
    const responseTime = Date.now() - startTime;

    return {
      endpoint,
      status: response.status < 400 ? 'healthy' : 'unhealthy',
      responseTime,
      statusCode: response.status,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      endpoint,
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check all API endpoints health
 */
async function checkApiEndpoints(
  baseUrl: string
): Promise<{ success: boolean; endpoints: ApiEndpointHealth[] }> {
  console.log('🔍 Testing API endpoints health...');

  const endpoints: ApiEndpointHealth[] = [];

  // Test basic endpoints
  const basicEndpoints = [
    { path: '/api/validate-env', method: 'GET' as const },
    { path: '/api/inngest', method: 'GET' as const },
  ];

  for (const { path, method } of basicEndpoints) {
    console.log(`📡 Testing ${method} ${path}...`);
    const result = await testApiEndpoint(baseUrl, path, method);
    endpoints.push(result);
    console.log(
      `${result.status === 'healthy' ? '✅' : '❌'} ${path}: ${result.statusCode} (${
        result.responseTime
      }ms)`
    );
  }

  // Test itinerary endpoints with proper test data
  const itineraryEndpoints = [
    {
      path: '/api/itinerary/generate',
      method: 'POST' as const,
      testData: {
        location: 'test-location',
        departDate: '2025-10-01',
        returnDate: '2025-10-05',
        budget: 1000,
        adults: 2,
        flexibleDates: false,
      },
    },
    { path: '/api/itinerary/get-itinerary?workflowId=test-id', method: 'GET' as const },
    { path: '/api/itinerary/progress-simple', method: 'GET' as const },
  ];

  for (const { path, method, testData } of itineraryEndpoints) {
    console.log(`📡 Testing ${method} ${path}...`);
    const result = await testApiEndpoint(baseUrl, path, method, testData);
    endpoints.push(result);
    console.log(
      `${result.status === 'healthy' ? '✅' : '❌'} ${path}: ${result.statusCode || 'ERROR'} (${
        result.responseTime
      }ms)${result.error ? ` - ${result.error}` : ''}`
    );
  }

  const allHealthy = endpoints.every((ep) => ep.status === 'healthy');

  console.log(`🎯 API endpoints health: ${allHealthy ? '✅ ALL HEALTHY' : '❌ SOME UNHEALTHY'}`);
  console.log(
    `📊 Summary: ${endpoints.filter((ep) => ep.status === 'healthy').length}/${
      endpoints.length
    } endpoints healthy`
  );

  return {
    success: allHealthy,
    endpoints,
  };
}

/**
 * Check environment variables availability
 */
function checkEnvironmentVariables(): { success: boolean; missing: string[] } {
  const required = [
    'XAI_API_KEY',
    'GROQ_API_KEY',
    'INNGEST_EVENT_KEY',
    // User's specific Upstash Redis/KV configuration
    'KV_REST_API_URL',
    'KV_REST_API_TOKEN',
    // Upstash Vector Database
    'UPSTASH_VECTOR_REST_URL',
    'UPSTASH_VECTOR_REST_TOKEN',
    'TAVILY_API_KEY',
    'EXA_API_KEY',
    'SERP_API_KEY',
  ];

  const missing: string[] = [];

  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  return {
    success: missing.length === 0,
    missing,
  };
}

/**
 * Verify Edge Runtime environment
 */
function checkEdgeRuntime(): boolean {
  // In Edge Runtime, these should be undefined
  const nodeBuiltins = [
    typeof require,
    typeof process.platform,
    typeof process.arch,
    typeof __dirname,
    typeof __filename,
  ];

  // Check if Web APIs are available (Edge Runtime feature)
  const webApis = [
    typeof fetch,
    typeof Request,
    typeof Response,
    typeof Headers,
    typeof URL,
    typeof crypto,
  ];

  // All Node.js built-ins should be undefined or restricted
  const nodeBuiltinsRestricted = nodeBuiltins.every(
    (type) => type === 'undefined' || type === 'object'
  );

  // All Web APIs should be available
  const webApisAvailable = webApis.every((type) => type === 'function' || type === 'object');

  return nodeBuiltinsRestricted && webApisAvailable;
}

/**
 * GET /api/health - Health check endpoint
 * Web API compatible handler for Vercel Edge Runtime
 */
export default async function handler(req: Request): Promise<Response> {
  const startTime = Date.now();

  // DEBUG: Log endpoint activation
  console.log('🏥 Health Check Endpoint - ACTIVATED');
  console.log('📊 Request details:', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
    userAgent: req.headers.get('user-agent')?.substring(0, 50) + '...',
  });

  // Extract base URL for API endpoint testing
  const url = new URL(req.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  try {
    console.log('🔍 Starting health checks...');

    // Perform health checks
    const edgeRuntimeCheck = checkEdgeRuntime();
    console.log('⚡ Edge Runtime check:', edgeRuntimeCheck ? '✅ PASS' : '❌ FAIL');

    const envCheck = checkEnvironmentVariables();
    console.log('🔧 Environment variables check:', {
      success: envCheck.success ? '✅ PASS' : '❌ FAIL',
      missing: envCheck.missing.length,
      missingVars: envCheck.missing,
    });

    // AI providers check (basic - just verify keys exist)
    const aiProvidersCheck = Boolean(process.env.XAI_API_KEY && process.env.GROQ_API_KEY);
    console.log('🤖 AI providers check:', aiProvidersCheck ? '✅ PASS' : '❌ FAIL', {
      xaiKey: process.env.XAI_API_KEY ? 'SET' : 'MISSING',
      groqKey: process.env.GROQ_API_KEY ? 'SET' : 'MISSING',
    });

    // State management check (Redis/Vector URLs exist)
    const stateManagementCheck = Boolean(
      process.env.KV_REST_API_URL &&
        process.env.KV_REST_API_TOKEN &&
        process.env.UPSTASH_VECTOR_REST_URL &&
        process.env.UPSTASH_VECTOR_REST_TOKEN
    );
    console.log('🗄️ State management check:', stateManagementCheck ? '✅ PASS' : '❌ FAIL', {
      kvUrl: process.env.KV_REST_API_URL ? 'SET' : 'MISSING',
      kvToken: process.env.KV_REST_API_TOKEN ? 'SET' : 'MISSING',
      vectorUrl: process.env.UPSTASH_VECTOR_REST_URL ? 'SET' : 'MISSING',
      vectorToken: process.env.UPSTASH_VECTOR_REST_TOKEN ? 'SET' : 'MISSING',
    });

    // Search providers check (API keys exist)
    const searchProvidersCheck = Boolean(
      process.env.TAVILY_API_KEY && process.env.EXA_API_KEY && process.env.SERP_API_KEY
    );
    console.log('🔍 Search providers check:', searchProvidersCheck ? '✅ PASS' : '❌ FAIL', {
      tavilyKey: process.env.TAVILY_API_KEY ? 'SET' : 'MISSING',
      exaKey: process.env.EXA_API_KEY ? 'SET' : 'MISSING',
      serpKey: process.env.SERP_API_KEY ? 'SET' : 'MISSING',
    });

    // API endpoints health check
    console.log('🔍 Starting API endpoints health check...');
    const apiEndpointsCheck = await checkApiEndpoints(baseUrl);
    console.log('📡 API endpoints check:', apiEndpointsCheck.success ? '✅ PASS' : '❌ FAIL');

    // Overall health status
    const allChecksPass =
      edgeRuntimeCheck &&
      envCheck.success &&
      aiProvidersCheck &&
      stateManagementCheck &&
      searchProvidersCheck &&
      apiEndpointsCheck.success;

    console.log('🎯 Overall health status:', allChecksPass ? '✅ HEALTHY' : '❌ UNHEALTHY');

    const response: HealthCheckResponse = {
      status: allChecksPass ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'unknown',
      checks: {
        edgeRuntime: edgeRuntimeCheck,
        environmentVariables: envCheck.success,
        aiProviders: aiProvidersCheck,
        stateManagement: stateManagementCheck,
        searchProviders: searchProvidersCheck,
        apiEndpoints: apiEndpointsCheck.success,
      },
      apiEndpoints: apiEndpointsCheck.endpoints,
    };

    // Add details if there are issues
    if (!allChecksPass) {
      console.log('⚠️ Health check issues detected');
      response.details = {
        missingVars: envCheck.missing,
        errors: [],
      };

      if (!edgeRuntimeCheck) {
        response.details.errors?.push('Edge Runtime environment not detected');
        console.log('❌ Edge Runtime not detected');
      }
      if (!aiProvidersCheck) {
        response.details.errors?.push('AI provider API keys missing');
        console.log('❌ AI provider keys missing');
      }
      if (!stateManagementCheck) {
        response.details.errors?.push('State management configuration incomplete');
        console.log('❌ State management config incomplete');
      }
      if (!searchProvidersCheck) {
        response.details.errors?.push('Search provider API keys missing');
        console.log('❌ Search provider keys missing');
      }
      if (!apiEndpointsCheck.success) {
        const unhealthyEndpoints = apiEndpointsCheck.endpoints
          .filter((ep) => ep.status === 'unhealthy')
          .map((ep) => ep.endpoint);
        response.details.errors?.push(`Unhealthy API endpoints: ${unhealthyEndpoints.join(', ')}`);
        console.log('❌ API endpoints unhealthy:', unhealthyEndpoints);
      }
    } else {
      console.log('🎉 All health checks PASSED!');
    }

    const processingTime = Date.now() - startTime;
    console.log('⏱️ Health check completed in:', processingTime + 'ms');

    return new Response(JSON.stringify(response), {
      status: allChecksPass ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'X-Response-Time': `${processingTime}ms`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Edge-Runtime': 'true',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('💥 Health check FAILED with error:', error);
    console.error('🔍 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 500) : 'No stack trace',
      processingTime: processingTime + 'ms',
    });

    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'unknown',
      checks: {
        edgeRuntime: false,
        environmentVariables: false,
        aiProviders: false,
        stateManagement: false,
        searchProviders: false,
        apiEndpoints: false,
      },
      details: {
        errors: [`Health check error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Edge-Runtime': 'true',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

/**
 * Handle HTTP method routing
 */
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

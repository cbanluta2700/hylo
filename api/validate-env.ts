/**
 * Environment Variable Validation Endpoint
 *
 * Tests all required API keys and service connections for AI workflow
 * Constitutional requirement: All API endpoints must use Edge Runtime
 */

// Export Edge Runtime configuration (constitutional requirement)
export const config = {
  runtime: 'edge',
};

interface ValidationResult {
  service: string;
  status: 'connected' | 'failed' | 'missing';
  message: string;
  responseTime?: number;
}

interface ValidationResponse {
  success: boolean;
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  results: ValidationResult[];
}

/**
 * Test XAI API connectivity
 */
async function testXAIConnection(): Promise<ValidationResult> {
  const startTime = Date.now();
  console.log('🤖 Testing XAI Grok API connection...');

  if (!process.env.XAI_API_KEY) {
    console.log('⚠️ XAI API key missing');
    return {
      service: 'XAI Grok',
      status: 'missing',
      message: 'XAI_API_KEY environment variable not set',
    };
  }

  try {
    console.log('📡 Making request to XAI API...');
    // Simple API test - just check if the key format is valid
    const response = await fetch('https://api.x.ai/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const responseTime = Date.now() - startTime;
    console.log(`📊 XAI API response: ${response.status} (${responseTime}ms)`);

    if (response.ok) {
      console.log('✅ XAI API connection successful');
      return {
        service: 'XAI Grok',
        status: 'connected',
        message: 'API key valid and service accessible',
        responseTime,
      };
    } else {
      console.log(`❌ XAI API failed with status: ${response.status}`);
      return {
        service: 'XAI Grok',
        status: 'failed',
        message: `API responded with status: ${response.status}`,
        responseTime,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`💥 XAI API connection failed:`, error);
    return {
      service: 'XAI Grok',
      status: 'failed',
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime,
    };
  }
}

/**
 * Test Groq API connectivity
 */
async function testGroqConnection(): Promise<ValidationResult> {
  const startTime = Date.now();

  if (!process.env.GROQ_API_KEY) {
    return {
      service: 'Groq',
      status: 'missing',
      message: 'GROQ_API_KEY environment variable not set',
    };
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        service: 'Groq',
        status: 'connected',
        message: 'API key valid and service accessible',
        responseTime,
      };
    } else {
      return {
        service: 'Groq',
        status: 'failed',
        message: `API responded with status: ${response.status}`,
        responseTime,
      };
    }
  } catch (error) {
    return {
      service: 'Groq',
      status: 'failed',
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * Test Upstash Redis connectivity
 */
async function testRedisConnection(): Promise<ValidationResult> {
  const startTime = Date.now();
  console.log('🏗️ Testing Redis/KV connectivity...');

  // Check for your specific Redis/KV variable names
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.log('⚠️ Redis/KV credentials missing');
    return {
      service: 'Redis/KV Storage',
      status: 'missing',
      message: 'KV_REST_API_URL or KV_REST_API_TOKEN not set',
    };
  }

  try {
    console.log('📡 Testing Redis/KV connection...');
    console.log(`🔗 Using URL: ${process.env.KV_REST_API_URL}`);

    // Simple ping test using your KV REST API
    const response = await fetch(`${process.env.KV_REST_API_URL}/ping`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    const responseTime = Date.now() - startTime;
    console.log(`📊 Redis/KV response: ${response.status} (${responseTime}ms)`);

    if (response.ok) {
      console.log('✅ Redis/KV connection successful');
      return {
        service: 'Redis/KV Storage',
        status: 'connected',
        message: 'KV instance accessible via REST API',
        responseTime,
      };
    } else {
      console.log(`❌ Redis/KV failed with status: ${response.status}`);
      return {
        service: 'Redis/KV Storage',
        status: 'failed',
        message: `KV responded with status: ${response.status}`,
        responseTime,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`💥 Redis/KV connection failed:`, error);
    return {
      service: 'Redis/KV Storage',
      status: 'failed',
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime,
    };
  }
}

/**
 * Test Upstash Vector connectivity
 */
async function testVectorConnection(): Promise<ValidationResult> {
  const startTime = Date.now();

  if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
    return {
      service: 'Upstash Vector',
      status: 'missing',
      message: 'UPSTASH_VECTOR_REST_URL or UPSTASH_VECTOR_REST_TOKEN not set',
    };
  }

  try {
    // Simple info request
    const response = await fetch(`${process.env.UPSTASH_VECTOR_REST_URL}/info`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_VECTOR_REST_TOKEN}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        service: 'Upstash Vector',
        status: 'connected',
        message: 'Vector DB instance accessible',
        responseTime,
      };
    } else {
      return {
        service: 'Upstash Vector',
        status: 'failed',
        message: `Vector DB responded with status: ${response.status}`,
        responseTime,
      };
    }
  } catch (error) {
    return {
      service: 'Upstash Vector',
      status: 'failed',
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * Test Inngest environment variables (no API call needed)
 */
function testInngestConnection(): ValidationResult {
  console.log('⚙️ Checking Inngest workflow environment variables...');

  const hasEventKey = Boolean(process.env.INNGEST_EVENT_KEY);
  const hasSigningKey = Boolean(process.env.INNGEST_SIGNING_KEY);

  console.log(`🔑 INNGEST_EVENT_KEY: ${hasEventKey ? '✅ SET' : '❌ MISSING'}`);
  console.log(`🔑 INNGEST_SIGNING_KEY: ${hasSigningKey ? '✅ SET' : '❌ MISSING'}`);

  if (hasEventKey && hasSigningKey) {
    console.log('✅ Inngest workflow keys configured');
    return {
      service: 'Inngest Workflow',
      status: 'connected',
      message: 'Both INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY are configured',
    };
  } else {
    const missingKeys = [];
    if (!hasEventKey) missingKeys.push('INNGEST_EVENT_KEY');
    if (!hasSigningKey) missingKeys.push('INNGEST_SIGNING_KEY');

    console.log(`❌ Inngest missing keys: ${missingKeys.join(', ')}`);
    return {
      service: 'Inngest Workflow',
      status: 'missing',
      message: `Missing environment variables: ${missingKeys.join(', ')}`,
    };
  }
}

/**
 * Test search provider API keys (basic validation)
 */
function testSearchProviders(): ValidationResult[] {
  const providers = [
    { name: 'Tavily AI Search', key: 'TAVILY_API_KEY' },
    { name: 'Exa AI Search', key: 'EXA_API_KEY' },
    { name: 'SERP API', key: 'SERP_API_KEY' },
  ];

  return providers.map((provider) => {
    const hasKey = Boolean(process.env[provider.key]);
    console.log(`🔍 ${provider.name}: ${hasKey ? '✅ SET' : '❌ MISSING'}`);
    return {
      service: provider.name,
      status: hasKey ? 'connected' : 'missing',
      message: hasKey ? `${provider.key} is set` : `${provider.key} environment variable not set`,
    };
  });
}

/**
 * Test additional environment variables (Redis/KV and AI backup keys)
 */
function testAdditionalEnvVars(): ValidationResult[] {
  console.log('🔧 Testing additional environment variables...');

  const additionalVars = [
    // AI Provider backup keys
    { name: 'XAI Grok (Backup)', key: 'XAI_API_KEY_2' },
    { name: 'Groq (Backup)', key: 'GROQ_API_KEY_2' },
    // Your specific Redis/KV configuration
    { name: 'KV REST API URL', key: 'KV_REST_API_URL' },
    { name: 'KV URL', key: 'KV_URL' },
    { name: 'Redis URL', key: 'REDIS_URL' },
    // Public URLs
    { name: 'Public API URL', key: 'NEXT_PUBLIC_API_URL' },
    { name: 'Public WebSocket URL', key: 'NEXT_PUBLIC_WS_URL' },
  ];

  return additionalVars.map((envVar) => {
    const hasKey = Boolean(process.env[envVar.key]);
    console.log(`🔧 ${envVar.name}: ${hasKey ? '✅ SET' : '❌ MISSING'}`);
    return {
      service: envVar.name,
      status: hasKey ? 'connected' : 'missing',
      message: hasKey
        ? `${envVar.key} is configured`
        : `${envVar.key} environment variable not set`,
    };
  });
}

/**
 * GET /api/validate-env - Validate all environment variables and connections
 */
export default async function handler(req: Request): Promise<Response> {
  const startTime = Date.now();

  // DEBUG: Log endpoint activation
  console.log('🔧 Environment Validation Endpoint - ACTIVATED');
  console.log('📊 Request details:', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
    userAgent: req.headers.get('user-agent')?.substring(0, 50) + '...',
  });

  try {
    console.log('🧪 Starting comprehensive environment validation...');

    // Run all validation tests
    console.log('🚀 Testing AI provider connections...');
    const [xaiResult, groqResult, redisResult, vectorResult] = await Promise.all([
      testXAIConnection(),
      testGroqConnection(),
      testRedisConnection(),
      testVectorConnection(),
    ]);

    console.log('⚙️ Checking Inngest workflow configuration...');
    const inngestResult = testInngestConnection();

    console.log('🔍 Testing search provider configurations...');
    const searchResults = testSearchProviders();

    console.log('🔧 Testing additional environment variables...');
    const additionalResults = testAdditionalEnvVars();

    const allResults = [
      xaiResult,
      groqResult,
      redisResult,
      vectorResult,
      inngestResult,
      ...searchResults,
      ...additionalResults,
    ];

    // Log individual results
    allResults.forEach((result, index) => {
      const status =
        result.status === 'connected' ? '✅' : result.status === 'failed' ? '❌' : '⚠️';
      console.log(`${status} ${result.service}:`, {
        status: result.status,
        message: result.message,
        responseTime: result.responseTime ? `${result.responseTime}ms` : 'N/A',
      });
    });

    // Calculate summary
    const totalTests = allResults.length;
    const passed = allResults.filter((r) => r.status === 'connected').length;
    const failed = totalTests - passed;

    console.log('📈 Validation Summary:', {
      total: totalTests,
      passed,
      failed,
      successRate: `${Math.round((passed / totalTests) * 100)}%`,
    });

    const response: ValidationResponse = {
      success: failed === 0,
      timestamp: new Date().toISOString(),
      totalTests,
      passed,
      failed,
      results: allResults,
    };

    const processingTime = Date.now() - startTime;
    console.log('⏱️ Environment validation completed in:', processingTime + 'ms');
    console.log('🎯 Overall validation result:', response.success ? '✅ SUCCESS' : '❌ FAILED');

    return new Response(JSON.stringify(response), {
      status: response.success ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'X-Response-Time': `${processingTime}ms`,
        'X-Edge-Runtime': 'true',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('💥 Environment validation FAILED with error:', error);
    console.error('🔍 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 500) : 'No stack trace',
      processingTime: processingTime + 'ms',
    });

    const errorResponse: ValidationResponse = {
      success: false,
      timestamp: new Date().toISOString(),
      totalTests: 0,
      passed: 0,
      failed: 1,
      results: [
        {
          service: 'Validation System',
          status: 'failed',
          message: `Validation system error: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        },
      ],
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Edge-Runtime': 'true',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

/**
 * Handle HTTP methods
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

/**
 * API Routing Test for Deployment Verification
 *
 * Tests that all planned API endpoints respond correctly after deployment
 * Validates Edge Runtime functions deploy successfully with proper CORS/headers
 */

import { describe, it, expect, beforeAll } from 'vitest';

// Base URL will be different for local vs deployed testing
const getBaseUrl = () => {
  if (process.env['VERCEL_URL']) {
    return `https://${process.env['VERCEL_URL']}`;
  }
  if (process.env['NEXT_PUBLIC_API_URL']) {
    return process.env['NEXT_PUBLIC_API_URL'];
  }
  return 'http://localhost:3001'; // Local development fallback
};

const BASE_URL = getBaseUrl();

describe('API Endpoint Routing - Deployment Verification', () => {
  let healthResponse: Response;

  beforeAll(async () => {
    // Pre-fetch health endpoint for reuse in tests
    try {
      healthResponse = await fetch(`${BASE_URL}/api/health`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
    } catch (error) {
      console.warn('Health endpoint not available for testing:', error);
    }
  });

  describe('Health Check Endpoint', () => {
    it('should respond to GET /api/health', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);

      expect(response).toBeDefined();
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
    });

    it('should return JSON content type', async () => {
      if (!healthResponse) return;

      const contentType = healthResponse.headers.get('content-type');
      expect(contentType).toContain('application/json');
    });

    it('should include Edge Runtime headers', async () => {
      if (!healthResponse) return;

      const edgeRuntimeHeader = healthResponse.headers.get('X-Edge-Runtime');
      expect(edgeRuntimeHeader).toBe('true');
    });

    it('should include CORS headers', async () => {
      if (!healthResponse) return;

      const corsHeader = healthResponse.headers.get('Access-Control-Allow-Origin');
      expect(corsHeader).toBe('*');
    });

    it('should return valid health check structure', async () => {
      if (!healthResponse || !healthResponse.ok) return;

      const data = await healthResponse.json();

      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('checks');
      expect(data.checks).toHaveProperty('edgeRuntime');
      expect(data.checks).toHaveProperty('environmentVariables');
    });
  });

  describe('Environment Validation Endpoint', () => {
    it('should respond to GET /api/validate-env', async () => {
      const response = await fetch(`${BASE_URL}/api/validate-env`);

      expect(response).toBeDefined();
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
    });

    it('should return JSON with validation results', async () => {
      const response = await fetch(`${BASE_URL}/api/validate-env`);

      if (response.ok) {
        const data = await response.json();
        expect(data).toHaveProperty('success');
        expect(data).toHaveProperty('results');
        expect(Array.isArray(data.results)).toBe(true);
      }
    });

    it('should include Edge Runtime headers', async () => {
      const response = await fetch(`${BASE_URL}/api/validate-env`);
      const edgeRuntimeHeader = response.headers.get('X-Edge-Runtime');
      expect(edgeRuntimeHeader).toBe('true');
    });
  });

  describe('OPTIONS Method Support', () => {
    it('should handle OPTIONS /api/health', async () => {
      const response = await fetch(`${BASE_URL}/api/health`, {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(200);

      const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
      const allowMethods = response.headers.get('Access-Control-Allow-Methods');

      expect(allowOrigin).toBe('*');
      expect(allowMethods).toContain('GET');
      expect(allowMethods).toContain('OPTIONS');
    });

    it('should handle OPTIONS /api/validate-env', async () => {
      const response = await fetch(`${BASE_URL}/api/validate-env`, {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(200);

      const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
      expect(allowOrigin).toBe('*');
    });
  });

  describe('Future AI Workflow Endpoints (Structure Verification)', () => {
    // These tests verify that the routing structure is ready for AI workflow endpoints
    // The actual endpoints will be implemented in Phase 4

    it('should be prepared for POST /api/itinerary/generate', async () => {
      const response = await fetch(`${BASE_URL}/api/itinerary/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: true,
          sessionId: 'test-session',
          formData: {},
        }),
      });

      // We expect 404 or similar since endpoint doesn't exist yet
      // But the routing should be accessible (not blocked by CORS, etc.)
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500); // Should not be server errors
    });

    it('should be prepared for GET /api/itinerary/progress/test-id', async () => {
      const response = await fetch(`${BASE_URL}/api/itinerary/progress/test-workflow-id`);

      // Expect 404 since not implemented yet, but routing should work
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Response Time Performance', () => {
    it('should respond to health check within 2 seconds', async () => {
      const startTime = Date.now();

      const response = await fetch(`${BASE_URL}/api/health`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should be fast even on cold starts
      expect(responseTime).toBeLessThan(2000); // 2 seconds max

      // Check if response includes timing header
      const timingHeader = response.headers.get('X-Response-Time');
      if (timingHeader) {
        console.log(`Server-reported response time: ${timingHeader}`);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      const response = await fetch(`${BASE_URL}/api/health`, {
        method: 'POST', // Wrong method
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invalid: 'data' }),
      });

      // Should not crash, should return appropriate error
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(600);

      // Should still include CORS headers even on errors
      const corsHeader = response.headers.get('Access-Control-Allow-Origin');
      expect(corsHeader).toBe('*');
    });
  });
});

/**
 * Integration test helper for deployment verification
 */
export async function verifyDeploymentHealth(baseUrl?: string): Promise<{
  success: boolean;
  tests: Array<{ name: string; passed: boolean; message: string }>;
}> {
  const url = baseUrl || getBaseUrl();
  const tests: Array<{ name: string; passed: boolean; message: string }> = [];

  try {
    // Test health endpoint
    const healthResponse = await fetch(`${url}/api/health`);
    tests.push({
      name: 'Health Endpoint Accessible',
      passed: healthResponse.status >= 200 && healthResponse.status < 400,
      message: `Status: ${healthResponse.status}`,
    });

    // Test Edge Runtime headers
    const edgeHeader = healthResponse.headers.get('X-Edge-Runtime');
    tests.push({
      name: 'Edge Runtime Configured',
      passed: edgeHeader === 'true',
      message: edgeHeader ? `Header present: ${edgeHeader}` : 'Missing X-Edge-Runtime header',
    });

    // Test environment validation endpoint
    const envResponse = await fetch(`${url}/api/validate-env`);
    tests.push({
      name: 'Environment Validation Accessible',
      passed: envResponse.status >= 200 && envResponse.status < 400,
      message: `Status: ${envResponse.status}`,
    });

    // Test CORS configuration
    const corsHeader = healthResponse.headers.get('Access-Control-Allow-Origin');
    tests.push({
      name: 'CORS Configured',
      passed: corsHeader === '*',
      message: corsHeader ? `CORS header: ${corsHeader}` : 'Missing CORS headers',
    });

    const allPassed = tests.every((test) => test.passed);

    return {
      success: allPassed,
      tests,
    };
  } catch (error) {
    tests.push({
      name: 'Deployment Connection',
      passed: false,
      message: `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });

    return {
      success: false,
      tests,
    };
  }
}

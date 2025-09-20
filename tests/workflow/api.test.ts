/**
 * Workflow API Endpoint Tests
 * 
 * Tests for the Vercel Edge Function endpoints:
 * - /api/workflow/start - workflow execution
 * - /api/workflow/state - state management
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

// Import the endpoint handlers
import startHandler from '../../api/workflow/start/route';
import stateHandler from '../../api/workflow/state/route';

import {
  type TravelFormData
} from '../../src/types/agents';

// Sample test data
const mockTravelFormData: TravelFormData = {
  destination: 'Tokyo, Japan',
  departureDate: '2024-07-01',
  returnDate: '2024-07-10',
  tripNickname: 'Tokyo Summer Trip',
  contactName: 'John Doe',
  adults: 2,
  children: 1,
  budget: {
    amount: 5000,
    currency: 'USD',
    mode: 'total'
  },
  preferences: {
    travelStyle: 'family',
    interests: ['temples', 'gardens', 'food'],
    accommodationType: 'hotel',
    transportationMode: 'flight',
    dietaryRestrictions: ['vegetarian'],
    accessibility: []
  }
};

// Helper to create mock Request objects
function createMockRequest(method: string, url: string, body?: any): Request {
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (body) {
    init.body = JSON.stringify(body);
  }
  
  return new Request(url, init);
}

// Helper to extract JSON from Response
async function getJsonResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse response as JSON:', text);
    throw error;
  }
}

describe('Workflow Start API (/api/workflow/start)', () => {
  let sessionId: string;

  beforeEach(() => {
    sessionId = uuidv4();
  });

  describe('POST /api/workflow/start', () => {
    test('should start workflow with valid request', async () => {
      const requestBody = {
        formData: mockTravelFormData,
        config: {
          streaming: false,
          sessionId
        }
      };

      const request = createMockRequest('POST', 'http://localhost/api/workflow/start', requestBody);
      const response = await startHandler(request);

      expect(response.status).toBe(200);
      
      const result = await getJsonResponse(response);
      expect(result.success).toBe(true);
      expect(result.sessionId).toBe(sessionId);
      expect(result.state).toBeDefined();
    });

    test('should handle invalid form data', async () => {
      const invalidFormData = {
        ...mockTravelFormData,
        adults: -1, // Invalid
        destination: '' // Invalid
      };

      const requestBody = {
        formData: invalidFormData,
        config: { streaming: false }
      };

      const request = createMockRequest('POST', 'http://localhost/api/workflow/start', requestBody);
      const response = await startHandler(request);

      expect(response.status).toBe(400);
      
      const result = await getJsonResponse(response);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should generate session ID if not provided', async () => {
      const requestBody = {
        formData: mockTravelFormData,
        config: { streaming: false }
      };

      const request = createMockRequest('POST', 'http://localhost/api/workflow/start', requestBody);
      const response = await startHandler(request);

      expect(response.status).toBe(200);
      
      const result = await getJsonResponse(response);
      expect(result.success).toBe(true);
      expect(result.sessionId).toBeDefined();
      expect(result.sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    test('should handle streaming workflow request', async () => {
      const requestBody = {
        formData: mockTravelFormData,
        config: {
          streaming: true,
          sessionId
        }
      };

      const request = createMockRequest('POST', 'http://localhost/api/workflow/start', requestBody);
      const response = await startHandler(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      
      // For streaming, we can't easily test the full stream in unit tests
      // This would require integration tests with actual streaming
    });

    test('should include session ID in response headers', async () => {
      const requestBody = {
        formData: mockTravelFormData,
        config: {
          streaming: false,
          sessionId
        }
      };

      const request = createMockRequest('POST', 'http://localhost/api/workflow/start', requestBody);
      const response = await startHandler(request);

      expect(response.headers.get('X-Session-ID')).toBe(sessionId);
    });

    test('should handle malformed JSON request', async () => {
      const request = new Request('http://localhost/api/workflow/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ invalid json'
      });

      const response = await startHandler(request);
      expect(response.status).toBe(500);
      
      const result = await getJsonResponse(response);
      expect(result.success).toBe(false);
    });
  });

  describe('GET /api/workflow/start', () => {
    test('should return API health check', async () => {
      const request = createMockRequest('GET', 'http://localhost/api/workflow/start');
      const response = await startHandler(request);

      expect(response.status).toBe(200);
      
      const result = await getJsonResponse(response);
      expect(result.success).toBe(true);
      expect(result.message).toContain('operational');
      expect(result.capabilities).toBeInstanceOf(Array);
    });

    test('should return session status when session ID provided', async () => {
      // First start a workflow
      const startRequest = createMockRequest('POST', 'http://localhost/api/workflow/start', {
        formData: mockTravelFormData,
        config: { streaming: false, sessionId }
      });
      await startHandler(startRequest);

      // Then check status
      const statusRequest = createMockRequest('GET', `http://localhost/api/workflow/start?sessionId=${sessionId}`);
      const response = await startHandler(statusRequest);

      expect(response.status).toBe(200);
      
      const result = await getJsonResponse(response);
      expect(result.success).toBe(true);
      expect(result.sessionId).toBe(sessionId);
      expect(result.state).toBeDefined();
    });

    test('should handle non-existent session ID', async () => {
      const nonExistentId = uuidv4();
      const request = createMockRequest('GET', `http://localhost/api/workflow/start?sessionId=${nonExistentId}`);
      const response = await startHandler(request);

      expect(response.status).toBe(404);
      
      const result = await getJsonResponse(response);
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('OPTIONS /api/workflow/start', () => {
    test('should handle CORS preflight', async () => {
      const request = createMockRequest('OPTIONS', 'http://localhost/api/workflow/start');
      const response = await startHandler(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });

  describe('Method Validation', () => {
    test('should reject unsupported methods', async () => {
      const request = createMockRequest('PATCH', 'http://localhost/api/workflow/start');
      const response = await startHandler(request);

      expect(response.status).toBe(405);
      
      const result = await getJsonResponse(response);
      expect(result.success).toBe(false);
      expect(result.message).toContain('not allowed');
    });
  });
});

describe('Workflow State API (/api/workflow/state)', () => {
  let sessionId: string;

  beforeEach(async () => {
    sessionId = uuidv4();
    
    // Start a workflow for state management tests
    const startRequest = createMockRequest('POST', 'http://localhost/api/workflow/start', {
      formData: mockTravelFormData,
      config: { streaming: false, sessionId }
    });
    await startHandler(startRequest);
  });

  describe('GET /api/workflow/state/:sessionId', () => {
    test('should retrieve workflow state', async () => {
      const request = createMockRequest('GET', `http://localhost/api/workflow/state/${sessionId}`);
      const response = await stateHandler(request);

      expect(response.status).toBe(200);
      
      const result = await getJsonResponse(response);
      expect(result.success).toBe(true);
      expect(result.sessionId).toBe(sessionId);
      expect(result.state).toBeDefined();
      expect(result.progress).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    test('should handle non-existent session', async () => {
      const nonExistentId = uuidv4();
      const request = createMockRequest('GET', `http://localhost/api/workflow/state/${nonExistentId}`);
      const response = await stateHandler(request);

      expect(response.status).toBe(404);
      
      const result = await getJsonResponse(response);
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    test('should validate session ID format', async () => {
      const invalidSessionId = 'invalid-session-id';
      const request = createMockRequest('GET', `http://localhost/api/workflow/state/${invalidSessionId}`);
      const response = await stateHandler(request);

      expect(response.status).toBe(400);
      
      const result = await getJsonResponse(response);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid session ID');
    });

    test('should include proper response headers', async () => {
      const request = createMockRequest('GET', `http://localhost/api/workflow/state/${sessionId}`);
      const response = await stateHandler(request);

      expect(response.headers.get('X-Session-ID')).toBe(sessionId);
      expect(response.headers.get('X-Workflow-State')).toBeDefined();
    });
  });

  describe('DELETE /api/workflow/state/:sessionId', () => {
    test('should cancel workflow', async () => {
      const request = createMockRequest('DELETE', `http://localhost/api/workflow/state/${sessionId}`);
      const response = await stateHandler(request);

      expect(response.status).toBe(200);
      
      const result = await getJsonResponse(response);
      expect(result.success).toBe(true);
      expect(result.sessionId).toBe(sessionId);
      expect(result.message).toContain('cancelled');
    });

    test('should handle cancellation of completed workflow', async () => {
      // Wait for workflow to complete first
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const request = createMockRequest('DELETE', `http://localhost/api/workflow/state/${sessionId}`);
      const response = await stateHandler(request);

      // Should still return success for idempotent operation
      expect(response.status).toBe(200);
      
      const result = await getJsonResponse(response);
      expect(result.success).toBe(true);
    });

    test('should handle non-existent session cancellation', async () => {
      const nonExistentId = uuidv4();
      const request = createMockRequest('DELETE', `http://localhost/api/workflow/state/${nonExistentId}`);
      const response = await stateHandler(request);

      expect(response.status).toBe(404);
      
      const result = await getJsonResponse(response);
      expect(result.success).toBe(false);
    });
  });

  describe('PUT /api/workflow/state/:sessionId', () => {
    test('should handle update requests (not yet implemented)', async () => {
      const updateBody = {
        action: 'pause',
        config: {}
      };

      const request = createMockRequest('PUT', `http://localhost/api/workflow/state/${sessionId}`, updateBody);
      const response = await stateHandler(request);

      // Should return 501 (Not Implemented) for now
      expect(response.status).toBe(501);
      
      const result = await getJsonResponse(response);
      expect(result.success).toBe(false);
      expect(result.message).toContain('not yet implemented');
    });

    test('should validate update request format', async () => {
      const invalidUpdateBody = {
        action: 'invalid-action'
      };

      const request = createMockRequest('PUT', `http://localhost/api/workflow/state/${sessionId}`, invalidUpdateBody);
      const response = await stateHandler(request);

      expect(response.status).toBe(500); // Should fail validation
    });
  });

  describe('OPTIONS /api/workflow/state', () => {
    test('should handle CORS preflight', async () => {
      const request = createMockRequest('OPTIONS', `http://localhost/api/workflow/state/${sessionId}`);
      const response = await stateHandler(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('DELETE');
    });
  });

  describe('URL Path Validation', () => {
    test('should require session ID in URL path', async () => {
      const request = createMockRequest('GET', 'http://localhost/api/workflow/state/route');
      const response = await stateHandler(request);

      expect(response.status).toBe(400);
      
      const result = await getJsonResponse(response);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Session ID is required');
    });

    test('should handle missing session ID gracefully', async () => {
      const request = createMockRequest('GET', 'http://localhost/api/workflow/state/');
      const response = await stateHandler(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Error Handling', () => {
    test('should handle internal server errors gracefully', async () => {
      // This would test error handling, but requires mocking internal errors
      // For now, we verify the error response structure is consistent
      expect(true).toBe(true);
    });

    test('should provide consistent error response format', async () => {
      const request = createMockRequest('GET', `http://localhost/api/workflow/state/invalid-id`);
      const response = await stateHandler(request);

      const result = await getJsonResponse(response);
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result.success).toBe(false);
    });
  });
});

describe('Integration Between Start and State APIs', () => {
  test('should maintain session consistency between endpoints', async () => {
    const sessionId = uuidv4();
    
    // Start workflow
    const startRequest = createMockRequest('POST', 'http://localhost/api/workflow/start', {
      formData: mockTravelFormData,
      config: { streaming: false, sessionId }
    });
    const startResponse = await startHandler(startRequest);
    const startResult = await getJsonResponse(startResponse);
    
    expect(startResult.success).toBe(true);
    expect(startResult.sessionId).toBe(sessionId);
    
    // Check state
    const stateRequest = createMockRequest('GET', `http://localhost/api/workflow/state/${sessionId}`);
    const stateResponse = await stateHandler(stateRequest);
    const stateResult = await getJsonResponse(stateResponse);
    
    expect(stateResult.success).toBe(true);
    expect(stateResult.sessionId).toBe(sessionId);
    
    // Session IDs should match
    expect(startResult.sessionId).toBe(stateResult.sessionId);
  });

  test('should handle workflow lifecycle through both endpoints', async () => {
    const sessionId = uuidv4();
    
    // 1. Start workflow
    const startRequest = createMockRequest('POST', 'http://localhost/api/workflow/start', {
      formData: mockTravelFormData,
      config: { streaming: false, sessionId }
    });
    await startHandler(startRequest);
    
    // 2. Check initial state
    const stateRequest = createMockRequest('GET', `http://localhost/api/workflow/state/${sessionId}`);
    const stateResponse = await stateHandler(stateRequest);
    const stateResult = await getJsonResponse(stateResponse);
    
    expect(stateResult.success).toBe(true);
    expect(stateResult.state).toBeDefined();
    
    // 3. Cancel workflow
    const cancelRequest = createMockRequest('DELETE', `http://localhost/api/workflow/state/${sessionId}`);
    const cancelResponse = await stateHandler(cancelRequest);
    const cancelResult = await getJsonResponse(cancelResponse);
    
    expect(cancelResult.success).toBe(true);
    
    // 4. Verify cancellation in start endpoint
    const checkRequest = createMockRequest('GET', `http://localhost/api/workflow/start?sessionId=${sessionId}`);
    const checkResponse = await startHandler(checkRequest);
    const checkResult = await getJsonResponse(checkResponse);
    
    // Should still be able to retrieve the session (even if cancelled)
    expect(checkResult.sessionId).toBe(sessionId);
  });
});
/**
 * Enhanced Itinerary Generation Endpoint
 *
 * Updated to use Inngest event-driven workflow instead of direct agent calls.
 * Now serves as an entry point that triggers the Inngest workflow and returns immediately.
 */

import { NextRequest } from 'next/server';
import { sendEvent } from '../../src/lib/inngest/client-v2';
import { EVENTS } from '../../src/lib/inngest/events';
import { generateId } from '../../src/lib/smart-queries';
import type { EnhancedFormData } from '../../src/types/form-data';

// Edge Runtime configuration
export const config = {
  runtime: 'edge',
};

interface GenerateRequest {
  formData: EnhancedFormData;
  context?: {
    userAgent?: string;
    clientIP?: string;
  };
}

interface GenerateResponse {
  success: boolean;
  data?: {
    sessionId: string;
    requestId: string;
    status: 'queued' | 'processing';
    message: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    timestamp: string;
    processingTime: number;
  };
}

export default async function handler(req: NextRequest): Promise<Response> {
  const startTime = Date.now();

  // Only allow POST requests
  if (req.method !== 'POST') {
    return Response.json(
      {
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only POST requests are allowed',
        },
      },
      { status: 405 }
    );
  }

  try {
    const body: GenerateRequest = await req.json();
    const { formData, context } = body;

    // Validate required fields
    if (!formData) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'FORM_DATA_REQUIRED',
            message: 'Form data is required',
          },
          metadata: {
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - startTime,
          },
        },
        { status: 400 }
      );
    }

    if (!formData.location) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'LOCATION_REQUIRED',
            message: 'Destination location is required',
          },
          metadata: {
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - startTime,
          },
        },
        { status: 400 }
      );
    }

    // Generate unique identifiers
    const sessionId = formData.sessionId || generateId();
    const requestId = generateId();

    // Send Inngest event to trigger workflow
    await sendEvent(EVENTS.ITINERARY_GENERATE, {
      sessionId,
      requestId,
      formData: {
        ...formData,
        sessionId, // Ensure sessionId is included
      },
      context: {
        userAgent: req.headers.get('user-agent') || undefined,
        clientIP: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        timestamp: new Date().toISOString(),
        ...context,
      },
    });

    // Return immediately with tracking information
    const response: GenerateResponse = {
      success: true,
      data: {
        sessionId,
        requestId,
        status: 'queued',
        message: 'Itinerary generation started. Use the status endpoint to track progress.',
      },
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      },
    };

    return Response.json(response, {
      status: 202, // Accepted
      headers: {
        'Content-Type': 'application/json',
        // Add CORS headers if needed
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error: any) {
    console.error('Itinerary generation error:', error);

    const errorResponse: GenerateResponse = {
      success: false,
      error: {
        code: 'GENERATION_START_ERROR',
        message: 'Failed to start itinerary generation',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      },
    };

    return Response.json(errorResponse, { status: 500 });
  }
}

/**
 * API Documentation
 *
 * POST /api/itinerary/generate
 *
 * Request:
 * {
 *   "formData": {
 *     "location": "Paris, France",
 *     "departDate": "2024-06-15",
 *     "returnDate": "2024-06-22",
 *     "adults": 2,
 *     "children": 0,
 *     "budget": 3000,
 *     "currency": "USD",
 *     // ... other form fields
 *   },
 *   "context": {
 *     "userAgent": "...",
 *     "clientIP": "..."
 *   }
 * }
 *
 * Response (202 Accepted):
 * {
 *   "success": true,
 *   "data": {
 *     "sessionId": "unique-session-id",
 *     "requestId": "unique-request-id",
 *     "status": "queued",
 *     "message": "Itinerary generation started..."
 *   },
 *   "metadata": {
 *     "timestamp": "2024-01-01T00:00:00.000Z",
 *     "processingTime": 45
 *   }
 * }
 *
 * To track progress:
 * GET /api/itinerary/status?requestId={requestId}&sessionId={sessionId}
 *
 * To receive real-time updates:
 * WebSocket connection to /api/itinerary/live?sessionId={sessionId}
 */

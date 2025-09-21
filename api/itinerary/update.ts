/**
 * Itinerary Update Endpoint
 *
 * Handles itinerary modification requests via Inngest events.
 * Supports partial updates, regeneration, and preference changes.
 */

import { NextRequest } from 'next/server';
import { inngest } from '../../src/lib/inngest/client-v2';
import { EVENTS } from '../../src/lib/inngest/events';

// Edge Runtime configuration
export const config = {
  runtime: 'edge',
};

/**
 * Update request types
 */
interface UpdateRequest {
  sessionId: string;
  updateType: 'preferences' | 'regenerate' | 'partial' | 'optimize';
  updateData: {
    preferences?: Record<string, any>;
    sectionToRegenerate?: string;
    optimizationCriteria?: string[];
    additionalRequirements?: string;
  };
  metadata?: {
    userAgent?: string;
    timestamp?: string;
    version?: string;
  };
}

/**
 * Main update handler
 */
export default async function handler(req: NextRequest): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Method not allowed. Use POST.',
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  try {
    // Parse request body
    const body: UpdateRequest = await req.json();

    // Validate required fields
    if (!body.sessionId || !body.updateType) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: sessionId, updateType',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Generate request ID for tracking
    const requestId = `update-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    // Send update event to Inngest workflow
    await inngest.send({
      name: EVENTS.ITINERARY_UPDATE,
      data: {
        sessionId: body.sessionId,
        requestId,
        updateType: body.updateType,
        updateData: body.updateData,
        metadata: {
          ...body.metadata,
          timestamp: new Date().toISOString(),
          requestedAt: Date.now(),
        },
      },
    });

    // Return immediate response (202 Accepted)
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Update request queued for processing',
        data: {
          sessionId: body.sessionId,
          requestId,
          status: 'processing',
          estimatedTime: '30-60 seconds',
        },
      }),
      {
        status: 202,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Update endpoint error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'UPDATE_REQUEST_ERROR',
          message: error.message || 'Failed to process update request',
          timestamp: new Date().toISOString(),
        },
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

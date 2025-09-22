/**
 * Generate Itinerary API Endpoint (T036)
 *
 * CONSTITUTIONAL COMPLIANCE:
 * - Principle I: Edge Runtime compatible (Vercel Edge Functions)
 * - Principle V: Type-safe development with Zod validation
 * - Principle IV: Code-Deploy-Debug with comprehensive error handling
 *
 * POST /api/itinerary/generate
 * Initiates AI workflow and returns workflowId for progress tracking
 */

import { z } from 'zod';
import { inngest, sendWorkflowEvent } from '../../src/lib/inngest/client';
import { SessionManager } from '../../src/lib/session/SessionManager';
import { travelFormSchema } from '../../src/schemas/formSchemas';

// Edge Runtime configuration (constitutional requirement)
export const config = {
  runtime: 'edge',
};

/**
 * Request validation schema
 * Constitutional requirement: Type-safe API boundaries
 */
const generateRequestSchema = z.object({
  formData: travelFormSchema,
  sessionId: z.string().min(1, 'Session ID is required'),
});

/**
 * Response schema for type safety
 */
const generateResponseSchema = z.object({
  workflowId: z.string(),
  status: z.literal('initiated'),
  estimatedTime: z.number(),
  progressUrl: z.string(),
});

export default async function handler(request: Request): Promise<Response> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (request.method !== 'POST') {
    console.log('❌ [DEBUG-105] Invalid method attempted', { method: request.method });
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('📥 [DEBUG-106] Processing generate itinerary request');

    // Parse and validate request body
    const body = await request.json();
    console.log('🔍 [DEBUG-107] Request body parsed', {
      hasFormData: !!body.formData,
      hasSessionId: !!body.sessionId,
      bodyKeys: Object.keys(body),
    });

    const validation = generateRequestSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ [DEBUG-108] Validation failed', {
        errors: validation.error.errors,
        errorCount: validation.error.errors.length,
      });
      return new Response(
        JSON.stringify({
          error: 'Invalid request data',
          details: validation.error.errors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { formData, sessionId } = validation.data;
    console.log('✅ [DEBUG-109] Request validation successful', {
      sessionId,
      location: formData.location,
      hasAllRequiredFields: !!(formData.location && formData.departDate && formData.returnDate),
    });

    // Generate unique request ID
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🆔 [DEBUG-110] Generated request ID', { requestId, sessionId });

    // Create workflow session
    console.log('💾 [DEBUG-111] Creating workflow session');
    const session = await SessionManager.createSession({
      sessionId,
      requestId,
      formData,
    });
    console.log('✅ [DEBUG-112] Workflow session created', {
      workflowId: session.id,
      sessionId: session.sessionId,
      status: session.status,
    });

    // Send Inngest event to start AI workflow
    console.log('🔄 [DEBUG-113] Sending workflow event to Inngest', {
      eventName: 'itinerary/generation.requested',
      workflowId: session.id,
    });
    await sendWorkflowEvent('itinerary/generation.requested', {
      workflowId: session.id,
      sessionId: validation.data.sessionId,
      formData,
      requestedAt: new Date().toISOString(),
    });
    console.log('✅ [DEBUG-114] Workflow event sent successfully');

    // Construct progress tracking URL
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const progressUrl = `${baseUrl}/api/itinerary/progress/${session.id}`;

    // Estimate processing time based on complexity
    const estimatedTime = estimateProcessingTime(formData);

    const response = generateResponseSchema.parse({
      workflowId: session.id,
      status: 'initiated' as const,
      estimatedTime,
      progressUrl,
    });

    console.log(`✅ Initiated workflow ${session.id} for session ${validation.data.sessionId}`);
    return new Response(JSON.stringify(response), {
      status: 202, // Accepted - processing asynchronously
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Generate itinerary API error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'GENERATION_FAILED',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Estimate processing time based on trip complexity
 * Constitutional requirement: User experience consistency
 */
function estimateProcessingTime(formData: any): number {
  let baseTime = 60; // 1 minute base time

  // Add time based on trip duration
  baseTime += formData.plannedDays * 15; // 15 seconds per day

  // Add time for complex preferences
  if (formData.interests && formData.interests.length > 5) {
    baseTime += 30;
  }

  if (formData.avoidances && formData.avoidances.length > 0) {
    baseTime += 20;
  }

  if (formData.accessibility && formData.accessibility.length > 0) {
    baseTime += 25;
  }

  // Cap at 5 minutes maximum
  return Math.min(baseTime, 300);
}

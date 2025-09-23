/**
 * Pure Inngest Itinerary Generation API
 *
 * Simple approach:
 * 1. Receive form data
 * 2. Trigger Inngest workflow
 * 3. Return immediately with workflow ID
 * 4. Let Inngest handle everything else
 *
 * NO polling, NO sessions, NO Redis complexity!
 */

import { inngest } from '../inngest/client.js';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  console.log('🚀 [GENERATE-SIMPLE] Pure Inngest generation started');

  if (request.method !== 'POST') {
    return Response.json({ success: false, error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const formData = body as any; // Simple casting - Inngest will handle validation

    console.log('📝 [GENERATE-SIMPLE] Form data received:', {
      location: formData?.location || 'Unknown',
      travelers: `${formData?.adults || 0} adults, ${formData?.children || 0} children`,
    }); // Generate simple workflow ID
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('🔧 [GENERATE-DEBUG] About to call inngest.send with:', {
      name: 'itinerary/generate',
      workflowId,
      formDataLocation: formData.location,
    });

    // Trigger Inngest workflow - let Inngest handle everything!
    const inngestResult = await inngest.send({
      name: 'itinerary/generate',
      data: {
        workflowId,
        sessionId: workflowId, // Use same ID for compatibility
        formData,
      },
    });

    console.log('🔧 [GENERATE-DEBUG] Inngest.send result:', inngestResult);
    console.log('✅ [GENERATE-SIMPLE] Inngest workflow triggered:', workflowId);

    // Return immediately - no polling needed!
    return Response.json({
      success: true,
      workflowId,
      status: 'processing',
      message: 'AI itinerary generation started. Please wait...',
      estimatedTime: '2-3 minutes',
    });
  } catch (error) {
    console.error('💥 [GENERATE-SIMPLE] Error:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to start itinerary generation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

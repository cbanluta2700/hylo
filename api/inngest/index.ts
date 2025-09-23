/**
 * Corrected Inngest Handler for TypeScript + Vercel Edge Functions
 * Properly routes Inngest events to our direct workflow execution
 */

import { inngest, generateItineraryFunction } from '../../src/inngest/functions.js';

// Edge Runtime configuration for Vercel
export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  console.log('🔌 [INNGEST-CORRECTED] Processing request', {
    method: request.method,
    url: request.url,
    timestamp: new Date().toISOString(),
  });

  try {
    // Handle GET requests - return function registration info
    if (request.method === 'GET') {
      console.log('📋 [INNGEST-CORRECTED] Registration request');

      return Response.json({
        status: 'ready',
        functions: [
          {
            id: 'generate-itinerary',
            name: 'AI Itinerary Generation Function',
            triggers: [{ event: 'itinerary/generate' }],
            status: 'registered',
          },
        ],
        client: {
          id: inngest.id,
          name: 'hylo-travel-ai',
        },
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        keys: {
          eventKey: process.env.INNGEST_EVENT_KEY ? 'configured' : 'missing',
          signingKey: process.env.INNGEST_SIGNING_KEY ? 'configured' : 'missing',
        },
      });
    }

    // Handle POST requests - this is where Inngest sends webhooks when events are triggered
    if (request.method === 'POST') {
      console.log('⚡ [INNGEST-CORRECTED] Webhook received');

      const requestBody = await request.json();
      console.log('📨 [INNGEST-CORRECTED] Webhook body:', {
        hasEvent: !!requestBody.event,
        eventName: requestBody.event?.name,
        eventId: requestBody.event?.id,
        hasData: !!requestBody.event?.data,
      });

      // Check if this is our itinerary generation event
      if (requestBody.event?.name === 'itinerary/generate') {
        console.log('🎯 [INNGEST-CORRECTED] Processing itinerary/generate event');

        try {
          const { workflowId, sessionId, formData } = requestBody.event.data;

          console.log('📋 [INNGEST-CORRECTED] Event data extracted:', {
            workflowId: workflowId?.substring(0, 15) + '...',
            sessionId: sessionId?.substring(0, 8) + '...',
            location: formData?.location,
          });

          // Import and execute the direct workflow
          const { executeWorkflowDirectly } = await import('../../src/inngest/direct-workflow.js');

          // Execute workflow in background (don't await to avoid timeout)
          executeWorkflowDirectly({
            workflowId,
            sessionId,
            formData,
          }).catch((error: Error) => {
            console.error('💥 [INNGEST-CORRECTED] Direct workflow execution failed:', error);
          });

          console.log('✅ [INNGEST-CORRECTED] Direct workflow execution initiated');

          // Return success to Inngest immediately
          return Response.json({
            success: true,
            message: 'Event processed, workflow initiated',
            workflowId,
            timestamp: new Date().toISOString(),
          });
        } catch (processingError) {
          console.error('💥 [INNGEST-CORRECTED] Event processing failed:', processingError);
          return Response.json(
            {
              success: false,
              error: 'Event processing failed',
              details: processingError instanceof Error ? processingError.message : 'Unknown error',
            },
            { status: 500 }
          );
        }
      }

      // For other events, just acknowledge
      return Response.json({
        success: true,
        message: 'Event acknowledged',
        timestamp: new Date().toISOString(),
      });
    }

    // Handle PUT requests (Inngest registration/sync)
    if (request.method === 'PUT') {
      console.log('🔧 [INNGEST-CORRECTED] Registration/sync request');
      return Response.json({
        success: true,
        message: 'Registration/sync acknowledged',
        timestamp: new Date().toISOString(),
      });
    }

    return Response.json({ error: 'Method not allowed', method: request.method }, { status: 405 });
  } catch (error) {
    console.error('💥 [INNGEST-CORRECTED] Handler error:', error);
    return Response.json(
      {
        success: false,
        error: 'Inngest handler failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

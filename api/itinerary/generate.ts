/**
 * Generate Itinerary API Endpoint
 *
 * Constitutional Requirements:
 * - Vercel Edge Runtime only
 * - Zod v    console.log('✅ [28] API Generate: Request validated successfully', { 
      sessionId: sessionId.substring(0, 8) + '...',
      location: formData.location,
      travelers: `${formData.adults || 0} adults, ${formData.children || 0} children`,
      dates: `${formData.departDate} to ${formData.returnDate}`
    });ion at API boundaries
 * - Structured error handling
 *
 * Task: T036 - Implement /api/itinerary/generate endpoint
 */

import { z } from 'zod';
import { WorkflowOrchestrator } from '../../src/lib/workflows/orchestrator';
import { TravelFormDataSchema } from '../../src/schemas/ai-workflow-schemas';

// Runtime configuration for Vercel Edge
export const config = {
  runtime: 'edge',
};

/**
 * Request validation schema
 */
const generateRequestSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  formData: TravelFormDataSchema,
});

/**
 * Success response schema
 */
interface GenerateResponse {
  success: true;
  workflowId: string;
  estimatedCompletionTime: number;
  message: string;
}

/**
 * Error response schema
 */
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

/**
 * POST /api/itinerary/generate
 * Initiates AI workflow for itinerary generation
 */
export default async function handler(request: Request): Promise<Response> {
  console.log('🚀 [21] API Generate: Request received', {
    method: request.method,
    url: request.url,
    timestamp: new Date().toISOString(),
  });

  // Only allow POST method
  if (request.method !== 'POST') {
    console.log('❌ [22] API Generate: Method not allowed', { method: request.method });
    return Response.json(
      {
        success: false,
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED',
      } satisfies ErrorResponse,
      { status: 405 }
    );
  }

  const startTime = Date.now();
  console.log('⏱️ [23] API Generate: Processing started', { startTime });

  try {
    // Parse request body
    const body = await request.json().catch(() => null);

    console.log('📝 [24] API Generate: Request body parsed', {
      hasBody: !!body,
      bodyKeys: body ? Object.keys(body) : [],
    });

    if (!body) {
      console.log('❌ [25] API Generate: Invalid JSON in request body');
      return Response.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON',
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    // Validate request data
    const validation = generateRequestSchema.safeParse(body);

    console.log('🔍 [26] API Generate: Request validation', {
      success: validation.success,
      hasSessionId: !!body.sessionId,
      hasFormData: !!body.formData,
    });

    if (!validation.success) {
      console.error('❌ [27] API Generate: Validation failed', validation.error.format());
      return Response.json(
        {
          success: false,
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: validation.error.format(),
        } as ErrorResponse & { details: any },
        { status: 400 }
      );
    }

    const { sessionId, formData } = validation.data;

    console.log('✅ [28] API Generate: Request validated successfully', {
      sessionId: sessionId.substring(0, 8) + '...',
      location: (formData as any).location,
      travelers: `${(formData as any).adults || 0} adults, ${
        (formData as any).children || 0
      } children`,
      dates: `${(formData as any).departDate} to ${(formData as any).returnDate}`,
    });

    // Convert string dates to Date objects for TravelFormData compatibility
    const processedFormData = {
      ...(formData as any),
      departDate: (formData as any).departDate,
      returnDate: (formData as any).returnDate,
      submittedAt: (formData as any).submittedAt
        ? new Date((formData as any).submittedAt)
        : new Date(),
    };

    console.log('🔄 [29] API Generate: Form data processed', {
      submittedAt: processedFormData.submittedAt,
      formDataKeys: Object.keys(processedFormData),
    });

    console.log(`🚀 [30] API Generate: Starting workflow for session ${sessionId}`);

    // Initiate workflow
    const workflowResult = await WorkflowOrchestrator.startWorkflow(sessionId, processedFormData);
    const processingTime = Date.now() - startTime;

    console.log(`✅ [31] API Generate: Workflow initiated successfully`, {
      workflowId: workflowResult.workflowId,
      processingTime: `${processingTime}ms`,
      estimatedCompletion: `${workflowResult.estimatedCompletionTime}ms`,
    });

    // Success response
    const response: GenerateResponse = {
      success: true,
      workflowId: workflowResult.workflowId,
      estimatedCompletionTime: workflowResult.estimatedCompletionTime,
      message: 'Itinerary generation started successfully',
    };

    console.log('🎉 [32] API Generate: Success response prepared', {
      workflowId: response.workflowId,
      estimatedTime: response.estimatedCompletionTime,
      totalProcessingTime: `${processingTime}ms`,
    });

    return Response.json(response, {
      status: 202, // Accepted - processing will continue asynchronously
      headers: {
        'Content-Type': 'application/json',
        'X-Processing-Time': processingTime.toString(),
        'X-Workflow-Id': workflowResult.workflowId,
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error('💥 [33] API Generate: Error caught', {
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime: `${processingTime}ms`,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle specific error types
    if (error instanceof Error) {
      console.log('🔍 [34] API Generate: Error analysis', {
        errorType: error.constructor.name,
        isInngestError: error.message.includes('Inngest'),
        isWorkflowError: error.message.includes('workflow'),
        isAIError: error.message.includes('provider') || error.message.includes('AI'),
      });

      // Inngest or workflow initialization errors
      if (error.message.includes('Inngest') || error.message.includes('workflow')) {
        console.log('🚧 [35] API Generate: Workflow service error detected');
        return Response.json(
          {
            success: false,
            error: 'Workflow service temporarily unavailable',
            code: 'SERVICE_UNAVAILABLE',
          } satisfies ErrorResponse,
          {
            status: 503,
            headers: {
              'X-Processing-Time': processingTime.toString(),
            },
          }
        );
      }

      // AI provider errors
      if (error.message.includes('provider') || error.message.includes('AI')) {
        console.log('🤖 [36] API Generate: AI service error detected');
        return Response.json(
          {
            success: false,
            error: 'AI services temporarily unavailable',
            code: 'AI_SERVICE_ERROR',
          } satisfies ErrorResponse,
          {
            status: 503,
            headers: {
              'X-Processing-Time': processingTime.toString(),
            },
          }
        );
      }
    }

    // Generic server error
    return Response.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      } satisfies ErrorResponse,
      {
        status: 500,
        headers: {
          'X-Processing-Time': processingTime.toString(),
        },
      }
    );
  }
}

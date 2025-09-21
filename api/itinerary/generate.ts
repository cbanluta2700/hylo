import { NextApiRequest, NextApiResponse } from 'next';
import { itineraryArchitect } from '../../src/lib/agents/architect';
import { webInformationGatherer } from '../../src/lib/agents/gatherer';
import { informationSpecialist } from '../../src/lib/agents/specialist';
import { formPutter } from '../../src/lib/agents/form-putter';
import { generateSmartQueries, generateId } from '../../src/lib/smart-queries';
import { EnhancedFormData } from '../../src/types/form-data';
import { AgentInput } from '../../src/types/agent-responses';

/**
 * POST /api/itinerary/generate
 * Main orchestration endpoint for AI-powered itinerary generation
 *
 * This endpoint coordinates multiple AI agents to create comprehensive travel itineraries:
 * 1. Itinerary Architect - High-level planning and structure
 * 2. Web Information Gatherer - Real-time data collection
 * 3. Information Specialist - Deep analysis and insights
 * 4. Form Putter - Professional formatting and presentation
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests are allowed',
      },
    });
  }

  const startTime = Date.now();
  const requestId = generateId();
  const sessionId = generateId();

  try {
    const { formData } = req.body;

    // Enhanced validation with detailed error messages
    const validationError = validateItineraryRequest(formData);
    if (validationError) {
      return res.status(validationError.status).json({
        error: validationError.error,
        requestId,
        timestamp: new Date().toISOString(),
      });
    }

    // Generate smart queries for information gathering
    const smartQueries = generateSmartQueries(formData as EnhancedFormData);

    // Start asynchronous itinerary generation
    const generationPromise = orchestrateItineraryGeneration(
      formData as EnhancedFormData,
      smartQueries,
      sessionId,
      requestId
    );

    // Don't await - return immediately with tracking info
    generationPromise.catch((error) => {
      console.error('Background itinerary generation failed:', error);
      // Could send notification or update status here
    });

    // Return workflow tracking info
    return res.status(202).json({
      requestId,
      sessionId,
      status: 'processing',
      message: 'Itinerary generation started successfully',
      estimatedTime: '30-60 seconds',
      progress: {
        current: 0,
        total: 4, // 4 agent stages
        stages: [
          'Analyzing preferences',
          'Gathering information',
          'Deep analysis',
          'Formatting results',
        ],
      },
      websocketUrl: `${
        process.env['NEXT_PUBLIC_APP_URL']?.replace('http', 'ws') || 'ws://localhost:3000'
      }/api/itinerary/live?requestId=${requestId}&sessionId=${sessionId}`,
      pollingUrl: `/api/itinerary/status?requestId=${requestId}&sessionId=${sessionId}`,
    });
  } catch (error) {
    console.error('Error in itinerary generation:', error);

    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to start itinerary generation',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      requestId,
      sessionId,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Orchestrate the complete itinerary generation process
 */
async function orchestrateItineraryGeneration(
  formData: EnhancedFormData,
  smartQueries: any[],
  sessionId: string,
  requestId: string
): Promise<any> {
  const results: any = {
    sessionId,
    requestId,
    stages: [],
    final: null,
    errors: [],
  };

  try {
    // Stage 1: Itinerary Architect - High-level planning
    console.log(`[${requestId}] Starting itinerary architect phase...`);
    const architectInput: AgentInput = {
      formData,
      context: {
        sessionId,
        smartQueries,
        stage: 'architect',
      },
    };

    const architectResult = await itineraryArchitect.processRequest(architectInput);
    results.stages.push({
      stage: 'architect',
      status: architectResult.success ? 'completed' : 'failed',
      result: architectResult,
      timestamp: new Date().toISOString(),
    });

    if (!architectResult.success) {
      throw new Error(`Architect phase failed: ${architectResult.error?.message}`);
    }

    // Stage 2: Web Information Gatherer - Data collection
    console.log(`[${requestId}] Starting information gathering phase...`);
    const gathererInput: AgentInput = {
      formData,
      context: {
        sessionId,
        previousResults: [architectResult],
        stage: 'gatherer',
      },
    };

    const gathererResult = await webInformationGatherer.processRequest(gathererInput);
    results.stages.push({
      stage: 'gatherer',
      status: gathererResult.success ? 'completed' : 'failed',
      result: gathererResult,
      timestamp: new Date().toISOString(),
    });

    if (!gathererResult.success) {
      console.warn(`[${requestId}] Gatherer phase failed, continuing with available data`);
      results.errors.push({
        stage: 'gatherer',
        error: gathererResult.error,
        timestamp: new Date().toISOString(),
      });
    }

    // Stage 3: Information Specialist - Deep analysis
    console.log(`[${requestId}] Starting specialist analysis phase...`);
    const specialistInput: AgentInput = {
      formData,
      context: {
        sessionId,
        previousResults: [architectResult, gathererResult],
        stage: 'specialist',
      },
    };

    const specialistResult = await informationSpecialist.processRequest(specialistInput);
    results.stages.push({
      stage: 'specialist',
      status: specialistResult.success ? 'completed' : 'failed',
      result: specialistResult,
      timestamp: new Date().toISOString(),
    });

    if (!specialistResult.success) {
      console.warn(`[${requestId}] Specialist phase failed, continuing with basic analysis`);
      results.errors.push({
        stage: 'specialist',
        error: specialistResult.error,
        timestamp: new Date().toISOString(),
      });
    }

    // Stage 4: Form Putter - Professional formatting
    console.log(`[${requestId}] Starting formatting phase...`);
    const putterInput: AgentInput = {
      formData,
      context: {
        sessionId,
        previousResults: [architectResult, gathererResult, specialistResult],
        stage: 'putter',
      },
    };

    const putterResult = await formPutter.processRequest(putterInput);
    results.stages.push({
      stage: 'putter',
      status: putterResult.success ? 'completed' : 'failed',
      result: putterResult,
      timestamp: new Date().toISOString(),
    });

    if (!putterResult.success) {
      throw new Error(`Putter phase failed: ${putterResult.error?.message}`);
    }

    // Synthesize final result
    results.final = {
      itinerary: putterResult.output?.data,
      metadata: {
        generatedAt: new Date().toISOString(),
        processingTime: Date.now() - Date.now(), // Would be passed from main handler
        agentVersions: {
          architect: architectResult.metadata?.agentVersion,
          gatherer: gathererResult.metadata?.agentVersion,
          specialist: specialistResult.metadata?.agentVersion,
          putter: putterResult.metadata?.agentVersion,
        },
        confidence: calculateOverallConfidence([
          architectResult,
          gathererResult,
          specialistResult,
          putterResult,
        ]),
      },
      stages: results.stages,
      errors: results.errors,
    };

    console.log(`[${requestId}] Itinerary generation completed successfully`);

    // TODO: Store results in cache/database for retrieval
    // TODO: Send completion notification

    return results;
  } catch (error) {
    console.error(`[${requestId}] Itinerary generation failed:`, error);
    results.final = null;
    results.errors.push({
      stage: 'orchestration',
      error: {
        code: 'ORCHESTRATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown orchestration error',
      },
      timestamp: new Date().toISOString(),
    });

    throw error;
  }
}

/**
 * Validate itinerary generation request
 */
function validateItineraryRequest(formData: any): { status: number; error: any } | null {
  if (!formData) {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request body must include formData',
      },
    };
  }

  if (!formData.location || typeof formData.location !== 'string') {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'formData.location is required and must be a string',
      },
    };
  }

  if (!formData.adults || typeof formData.adults !== 'number' || formData.adults < 1) {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'formData.adults is required and must be a positive number',
      },
    };
  }

  if (formData.children && (typeof formData.children !== 'number' || formData.children < 0)) {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'formData.children must be a non-negative number if provided',
      },
    };
  }

  // Validate budget if provided
  if (
    formData.budget !== undefined &&
    (typeof formData.budget !== 'number' || formData.budget <= 0)
  ) {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'formData.budget must be a positive number if provided',
      },
    };
  }

  // Validate dates if provided
  if (formData.departDate) {
    const departDate = new Date(formData.departDate);
    if (isNaN(departDate.getTime())) {
      return {
        status: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'formData.departDate must be a valid date string',
        },
      };
    }
  }

  if (formData.returnDate) {
    const returnDate = new Date(formData.returnDate);
    if (isNaN(returnDate.getTime())) {
      return {
        status: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'formData.returnDate must be a valid date string',
        },
      };
    }
  }

  // Validate date range
  if (formData.departDate && formData.returnDate) {
    const departDate = new Date(formData.departDate);
    const returnDate = new Date(formData.returnDate);

    if (returnDate <= departDate) {
      return {
        status: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Return date must be after departure date',
        },
      };
    }

    const diffTime = Math.abs(returnDate.getTime() - departDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 90) {
      return {
        status: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Trip duration cannot exceed 90 days',
        },
      };
    }
  }

  return null; // No validation errors
}

/**
 * Calculate overall confidence from all agent results
 */
function calculateOverallConfidence(agentResults: any[]): number {
  const successfulResults = agentResults.filter((result) => result.success);

  if (successfulResults.length === 0) return 0;

  const avgConfidence =
    successfulResults.reduce((sum, result) => {
      return sum + (result.output?.confidence || 0);
    }, 0) / successfulResults.length;

  // Weight by completion rate
  const completionRate = successfulResults.length / agentResults.length;

  return Math.min(1.0, avgConfidence * completionRate);
}

/**
 * Export for testing purposes
 */
export { orchestrateItineraryGeneration, validateItineraryRequest, calculateOverallConfidence };

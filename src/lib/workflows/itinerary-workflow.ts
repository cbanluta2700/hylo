/**
 * Intelligent Itinerary Workflow
 * Complete workflow orchestration for AI-powered itinerary generation
 */

import { inngest } from './inngest-config';
import { ITINERARY_WORKFLOW_STEPS, WORKFLOW_CONFIG } from './inngest-config';
import { itineraryArchitect } from '../agents/architect';
import { webInformationGatherer } from '../agents/gatherer';
import { informationSpecialist } from '../agents/specialist';
import { formPutter } from '../agents/form-putter';
import { generateSmartQueries } from '../smart-queries';
import { EnhancedFormData } from '../../types/form-data';
import { AgentInput } from '../../types/agent-responses';

/**
 * Intelligent Itinerary Generation Workflow
 * Orchestrates the complete multi-agent itinerary generation process
 */
export const intelligentItineraryWorkflow = inngest.createFunction(
  {
    id: 'intelligent-itinerary-workflow',
    retries: WORKFLOW_CONFIG.MAX_RETRIES,
  },
  { event: 'itinerary.generate.requested' },
  async ({ event, step, logger }) => {
    const { formData, sessionId, requestId, userId, preferences } = event.data;

    logger.info('Starting intelligent itinerary workflow', {
      sessionId,
      requestId,
      userId,
      destination: formData?.location,
    });

    // Step 1: Generate Smart Queries
    const smartQueries = await step.run(
      ITINERARY_WORKFLOW_STEPS['generateSmartQueries'].id,
      async () => {
        logger.info('Generating smart queries', { sessionId, requestId });

        const queries = generateSmartQueries(formData as EnhancedFormData);

        logger.info('Smart queries generated', {
          sessionId,
          requestId,
          queryCount: queries.length,
        });

        return queries;
      }
    );

    // Step 2: Itinerary Architect - High-level Planning
    const architectResult = await step.run(
      ITINERARY_WORKFLOW_STEPS['architectPlanning']?.id || 'architect-planning',
      async () => {
        logger.info('Running itinerary architect', { sessionId, requestId });

        const input: AgentInput = {
          formData: formData as EnhancedFormData,
          context: {
            sessionId,
            smartQueries,
            stage: 'architect',
          },
        };

        const result = await itineraryArchitect.processRequest(input);

        if (!result.success) {
          logger.error('Architect failed', {
            sessionId,
            requestId,
            error: result.error?.message,
          });
          throw new Error(`Architect phase failed: ${result.error?.message}`);
        }

        logger.info('Architect completed successfully', {
          sessionId,
          requestId,
          confidence: result.output?.confidence,
          processingTime: result.output?.processingTime,
        });

        return result;
      }
    );

    // Step 3: Web Information Gatherer - Parallel with Specialist
    const gathererResult = await step.run(
      ITINERARY_WORKFLOW_STEPS['gathererCollection']?.id || 'gatherer-collection',
      async () => {
        logger.info('Running web information gatherer', { sessionId, requestId });

        const input: AgentInput = {
          formData: formData as EnhancedFormData,
          context: {
            sessionId,
            previousResults: [architectResult],
            stage: 'gatherer',
          },
        };

        const result = await webInformationGatherer.processRequest(input);

        if (!result.success) {
          logger.warn('Gatherer failed, continuing with limited data', {
            sessionId,
            requestId,
            error: result.error?.message,
          });
          // Don't throw - allow workflow to continue with partial data
          return result;
        }

        logger.info('Gatherer completed successfully', {
          sessionId,
          requestId,
          confidence: result.output?.confidence,
          processingTime: result.output?.processingTime,
        });

        return result;
      }
    );

    // Step 4: Information Specialist - Parallel Analysis
    const specialistResult = await step.run(
      ITINERARY_WORKFLOW_STEPS['specialistAnalysis']?.id || 'specialist-analysis',
      async () => {
        logger.info('Running information specialist', { sessionId, requestId });

        const input: AgentInput = {
          formData: formData as EnhancedFormData,
          context: {
            sessionId,
            previousResults: [architectResult],
            stage: 'specialist',
          },
        };

        const result = await informationSpecialist.processRequest(input);

        if (!result.success) {
          logger.warn('Specialist failed, continuing with basic analysis', {
            sessionId,
            requestId,
            error: result.error?.message,
          });
          // Don't throw - allow workflow to continue with basic analysis
          return result;
        }

        logger.info('Specialist completed successfully', {
          sessionId,
          requestId,
          confidence: result.output?.confidence,
          processingTime: result.output?.processingTime,
        });

        return result;
      }
    );

    // Step 5: Form Putter - Professional Formatting
    const putterResult = await step.run(
      ITINERARY_WORKFLOW_STEPS['putterFormatting']?.id || 'putter-formatting',
      async () => {
        logger.info('Running form putter', { sessionId, requestId });

        const input: AgentInput = {
          formData: formData as EnhancedFormData,
          context: {
            sessionId,
            previousResults: [architectResult, gathererResult, specialistResult],
            stage: 'putter',
          },
        };

        const result = await formPutter.processRequest(input);

        if (!result.success) {
          logger.error('Putter failed', {
            sessionId,
            requestId,
            error: result.error?.message,
          });
          throw new Error(`Putter phase failed: ${result.error?.message}`);
        }

        logger.info('Putter completed successfully', {
          sessionId,
          requestId,
          confidence: result.output?.confidence,
          processingTime: result.output?.processingTime,
        });

        return result;
      }
    );

    // Step 6: Result Synthesis and Final Processing
    const finalResult = await step.run(
      ITINERARY_WORKFLOW_STEPS['resultSynthesis']?.id || 'result-synthesis',
      async () => {
        logger.info('Synthesizing final results', { sessionId, requestId });

        const synthesis = synthesizeWorkflowResults({
          architect: architectResult,
          gatherer: gathererResult,
          specialist: specialistResult,
          putter: putterResult,
        });

        const finalItinerary = {
          itinerary: putterResult.output?.data,
          metadata: {
            sessionId,
            requestId,
            generatedAt: new Date().toISOString(),
            userId,
            preferences,
            agentVersions: {
              architect: architectResult.metadata?.agentVersion,
              gatherer: gathererResult.metadata?.agentVersion,
              specialist: specialistResult.metadata?.agentVersion,
              putter: putterResult.metadata?.agentVersion,
            },
            confidence: synthesis.overallConfidence,
            processingTime: synthesis.totalProcessingTime,
            stages: synthesis.stageResults,
            quality: synthesis.qualityMetrics,
          },
          errors: synthesis.errors,
          warnings: synthesis.warnings,
        };

        logger.info('Result synthesis completed', {
          sessionId,
          requestId,
          overallConfidence: synthesis.overallConfidence,
          totalProcessingTime: synthesis.totalProcessingTime,
          errorCount: synthesis.errors.length,
        });

        return finalItinerary;
      }
    );

    // Send completion notification
    // TODO: Fix sendEvent syntax
    // await step.sendEvent('itinerary.generate.completed', {
    //   data: {
    //     sessionId,
    //     requestId,
    //     userId,
    //     result: finalResult,
    //     completedAt: new Date().toISOString(),
    //   },
    // });

    logger.info('Intelligent itinerary workflow completed successfully', {
      sessionId,
      requestId,
      totalProcessingTime: finalResult.metadata.processingTime,
      overallConfidence: finalResult.metadata.confidence,
    });

    return finalResult;
  }
);

/**
 * Workflow Result Synthesis
 */
interface WorkflowResults {
  architect: any;
  gatherer: any;
  specialist: any;
  putter: any;
}

interface SynthesisResult {
  overallConfidence: number;
  totalProcessingTime: number;
  stageResults: any[];
  qualityMetrics: any;
  errors: any[];
  warnings: any[];
}

/**
 * Synthesize results from all workflow stages
 */
function synthesizeWorkflowResults(results: WorkflowResults): SynthesisResult {
  const stageResults = [
    {
      stage: 'architect',
      status: results.architect.success ? 'completed' : 'failed',
      confidence: results.architect.output?.confidence || 0,
      processingTime: results.architect.output?.processingTime || 0,
      timestamp: new Date().toISOString(),
    },
    {
      stage: 'gatherer',
      status: results.gatherer.success ? 'completed' : 'failed',
      confidence: results.gatherer.output?.confidence || 0,
      processingTime: results.gatherer.output?.processingTime || 0,
      timestamp: new Date().toISOString(),
    },
    {
      stage: 'specialist',
      status: results.specialist.success ? 'completed' : 'failed',
      confidence: results.specialist.output?.confidence || 0,
      processingTime: results.specialist.output?.processingTime || 0,
      timestamp: new Date().toISOString(),
    },
    {
      stage: 'putter',
      status: results.putter.success ? 'completed' : 'failed',
      confidence: results.putter.output?.confidence || 0,
      processingTime: results.putter.output?.processingTime || 0,
      timestamp: new Date().toISOString(),
    },
  ];

  // Calculate overall confidence
  const successfulStages = stageResults.filter((stage) => stage.status === 'completed');
  const overallConfidence =
    successfulStages.length > 0
      ? successfulStages.reduce((sum, stage) => sum + stage.confidence, 0) / successfulStages.length
      : 0;

  // Calculate total processing time
  const totalProcessingTime = stageResults.reduce((sum, stage) => sum + stage.processingTime, 0);

  // Collect errors and warnings
  const errors: any[] = [];
  const warnings: any[] = [];

  if (!results.architect.success) {
    errors.push({
      stage: 'architect',
      type: 'critical',
      message: results.architect.error?.message || 'Architect failed',
      timestamp: new Date().toISOString(),
    });
  }

  if (!results.gatherer.success) {
    warnings.push({
      stage: 'gatherer',
      type: 'non-critical',
      message: results.gatherer.error?.message || 'Gatherer failed, using limited data',
      timestamp: new Date().toISOString(),
    });
  }

  if (!results.specialist.success) {
    warnings.push({
      stage: 'specialist',
      type: 'non-critical',
      message: results.specialist.error?.message || 'Specialist failed, using basic analysis',
      timestamp: new Date().toISOString(),
    });
  }

  if (!results.putter.success) {
    errors.push({
      stage: 'putter',
      type: 'critical',
      message: results.putter.error?.message || 'Putter failed',
      timestamp: new Date().toISOString(),
    });
  }

  // Quality metrics
  const qualityMetrics = {
    completionRate: successfulStages.length / stageResults.length,
    averageConfidence: overallConfidence,
    totalProcessingTime,
    errorCount: errors.length,
    warningCount: warnings.length,
    dataCompleteness: calculateDataCompleteness(results),
    consistencyScore: calculateConsistencyScore(results),
  };

  return {
    overallConfidence,
    totalProcessingTime,
    stageResults,
    qualityMetrics,
    errors,
    warnings,
  };
}

/**
 * Calculate data completeness score
 */
function calculateDataCompleteness(results: WorkflowResults): number {
  let completeness = 0;
  let totalChecks = 0;

  // Check architect output
  if (results.architect.success && results.architect.output?.data) {
    completeness += 1;
    totalChecks += 1;

    const architectData = results.architect.output.data;
    if (architectData.itineraryStructure) completeness += 0.5;
    if (architectData.dayPlans?.length > 0) completeness += 0.5;
    totalChecks += 1;
  } else {
    totalChecks += 1;
  }

  // Check gatherer output
  if (results.gatherer.success && results.gatherer.output?.data) {
    completeness += 1;
    totalChecks += 1;

    const gathererData = results.gatherer.output.data;
    if (gathererData.information?.attractions?.length > 0) completeness += 0.3;
    if (gathererData.information?.weather) completeness += 0.3;
    if (gathererData.information?.safety) completeness += 0.4;
    totalChecks += 1;
  } else {
    totalChecks += 1;
  }

  // Check specialist output
  if (results.specialist.success && results.specialist.output?.data) {
    completeness += 1;
    totalChecks += 1;

    const specialistData = results.specialist.output.data;
    if (specialistData.analyses?.length > 0) completeness += 0.5;
    if (specialistData.overallAssessment) completeness += 0.5;
    totalChecks += 1;
  } else {
    totalChecks += 1;
  }

  // Check putter output
  if (results.putter.success && results.putter.output?.data) {
    completeness += 1;
    totalChecks += 1;

    const putterData = results.putter.output.data;
    if (putterData.document?.sections?.length > 0) completeness += 0.5;
    if (putterData.metadata) completeness += 0.5;
    totalChecks += 1;
  } else {
    totalChecks += 1;
  }

  return totalChecks > 0 ? completeness / totalChecks : 0;
}

/**
 * Calculate consistency score across agents
 */
function calculateConsistencyScore(results: WorkflowResults): number {
  // This would analyze consistency between agent outputs
  // For now, return a basic score based on successful completions
  const successfulStages = [
    results.architect.success,
    results.gatherer.success,
    results.specialist.success,
    results.putter.success,
  ].filter(Boolean).length;

  return successfulStages / 4; // Normalize to 0-1
}

/**
 * Export for use in other modules
 */

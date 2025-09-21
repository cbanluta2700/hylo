/**
 * Inngest Functions - Main Workflow Definitions
 *
 *       // Step 3: Execute Gatherer Agent (can run in parallel with architect)
      const gathererResult = await step.run('gatherer-agent', async () => {
        const gathererStep = createInngestAgentStep(
          webInformationGatherer, // Removed type assertion
          'gatherer',
          'gatherer-agent'
        );nt functions consolidated into Inngest workflows.
 * Replaces individual agent endpoints with orchestrated workflow.
 */

import { inngest } from './client-v2';
import { EVENTS } from './events';

// Import existing agents
import { itineraryArchitect } from '../agents/architect';
import { webInformationGatherer } from '../agents/gatherer';
import { informationSpecialist } from '../agents/specialist';
import { formPutter } from '../agents/form-putter';
import { generateSmartQueries } from '../smart-queries';

// Import utilities
import { createInngestAgentStep } from './agent-utilities-v2';
import type { EnhancedFormData } from '../../types/form-data';

// =============================================================================
// Main Itinerary Generation Workflow
// =============================================================================

export const itineraryWorkflow = inngest.createFunction(
  {
    id: 'itinerary-generation',
    name: 'Complete Itinerary Generation Workflow',
    retries: 3,
  },
  { event: EVENTS.ITINERARY_GENERATE },
  async ({ event, step }) => {
    const { sessionId, requestId, formData } = event.data;

    try {
      // Step 1: Generate Smart Queries
      const smartQueries = await step.run('generate-smart-queries', async () => {
        console.log('Generating smart queries for:', formData.location);
        return generateSmartQueries(formData);
      });

      // Step 2: Execute Architect Agent
      const architectResult = await step.run('architect-agent', async () => {
        const architectStep = createInngestAgentStep(
          itineraryArchitect, // Removed type assertion - let TypeScript infer
          'architect',
          'architect-agent'
        );

        return architectStep({
          formData,
          context: { sessionId, smartQueries, stage: 'architect' },
          sessionId,
          requestId,
        });
      });

      if (!architectResult.success) {
        throw new Error(`Architect agent failed: ${architectResult.error?.message}`);
      }

      // Step 3: Execute Gatherer Agent (can run in parallel with architect in future)
      const gathererResult = await step.run('gatherer-agent', async () => {
        const gathererStep = createInngestAgentStep(
          webInformationGatherer, // Removed type assertion
          'gatherer',
          'gatherer-agent'
        );

        return gathererStep({
          formData,
          context: {
            sessionId,
            smartQueries,
            architectResult: architectResult.output,
            stage: 'gatherer',
          },
          sessionId,
          requestId,
        });
      });

      if (!gathererResult.success) {
        throw new Error(`Gatherer agent failed: ${gathererResult.error?.message}`);
      }

      // Step 4: Execute Specialist Agent (depends on architect + gatherer)
      const specialistResult = await step.run('specialist-agent', async () => {
        const specialistStep = createInngestAgentStep(
          informationSpecialist, // Removed type assertion
          'specialist',
          'specialist-agent'
        );

        return specialistStep({
          formData,
          context: {
            sessionId,
            smartQueries,
            architectResult: architectResult.output,
            gathererResult: gathererResult.output,
            stage: 'specialist',
          },
          sessionId,
          requestId,
        });
      });

      if (!specialistResult.success) {
        throw new Error(`Specialist agent failed: ${specialistResult.error?.message}`);
      }

      // Step 5: Execute Form Putter Agent (final formatting)
      const formPutterResult = await step.run('form-putter-agent', async () => {
        const formPutterStep = createInngestAgentStep(
          formPutter, // Removed type assertion
          'form-putter',
          'form-putter-agent'
        );

        return formPutterStep({
          formData,
          context: {
            sessionId,
            architectResult: architectResult.output,
            gathererResult: gathererResult.output,
            specialistResult: specialistResult.output,
            stage: 'form-putter',
          },
          sessionId,
          requestId,
        });
      });

      if (!formPutterResult.success) {
        throw new Error(`Form putter agent failed: ${formPutterResult.error?.message}`);
      }

      // Step 6: Send completion event
      await step.sendEvent('send-completion-event', {
        name: EVENTS.ITINERARY_COMPLETE,
        data: {
          sessionId,
          requestId,
          itinerary: formPutterResult.output,
          metadata: {
            totalProcessingTime:
              architectResult.metadata.processingTime +
              gathererResult.metadata.processingTime +
              specialistResult.metadata.processingTime +
              formPutterResult.metadata.processingTime,
            agentsUsed: ['architect', 'gatherer', 'specialist', 'form-putter'],
            tokensUsed:
              (architectResult.metadata.tokensUsed || 0) +
              (gathererResult.metadata.tokensUsed || 0) +
              (specialistResult.metadata.tokensUsed || 0) +
              (formPutterResult.metadata.tokensUsed || 0),
            totalCost:
              (architectResult.metadata.cost || 0) +
              (gathererResult.metadata.cost || 0) +
              (specialistResult.metadata.cost || 0) +
              (formPutterResult.metadata.cost || 0),
          },
          timestamp: new Date().toISOString(),
        },
      });

      // Return final result
      return {
        success: true,
        sessionId,
        requestId,
        itinerary: formPutterResult.output,
        metadata: {
          totalProcessingTime:
            architectResult.metadata.processingTime +
            gathererResult.metadata.processingTime +
            specialistResult.metadata.processingTime +
            formPutterResult.metadata.processingTime,
          agentsUsed: ['architect', 'gatherer', 'specialist', 'form-putter'],
          tokensUsed:
            (architectResult.metadata.tokensUsed || 0) +
            (gathererResult.metadata.tokensUsed || 0) +
            (specialistResult.metadata.tokensUsed || 0) +
            (formPutterResult.metadata.tokensUsed || 0),
          totalCost:
            (architectResult.metadata.cost || 0) +
            (gathererResult.metadata.cost || 0) +
            (specialistResult.metadata.cost || 0) +
            (formPutterResult.metadata.cost || 0),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      // Send error event
      await step.sendEvent('send-error-event', {
        name: EVENTS.WORKFLOW_ERROR,
        data: {
          sessionId,
          requestId,
          errorType: 'agent_failure',
          error: {
            code: error.code || 'WORKFLOW_ERROR',
            message: error.message,
            details: error,
          },
          recovery: {
            attempted: false,
            strategy: 'retry',
          },
          timestamp: new Date().toISOString(),
        },
      });

      throw error; // Re-throw for Inngest retry mechanism
    }
  }
);

// =============================================================================
// Individual Agent Functions (for direct access if needed)
// =============================================================================

export const architectAgentFunction = inngest.createFunction(
  {
    id: 'architect-agent',
    name: 'Itinerary Architect Agent',
    retries: 2,
  },
  { event: 'agent.architect.process' },
  async ({ event, step }) => {
    const { formData, context, sessionId, requestId } = event.data;

    const architectStep = createInngestAgentStep(
      itineraryArchitect, // Removed type assertion
      'architect',
      'architect-process'
    );

    return step.run('process-architect', () =>
      architectStep({ formData, context, sessionId, requestId })
    );
  }
);

export const gathererAgentFunction = inngest.createFunction(
  {
    id: 'gatherer-agent',
    name: 'Web Information Gatherer Agent',
    retries: 2,
  },
  { event: 'agent.gatherer.process' },
  async ({ event, step }) => {
    const { formData, context, sessionId, requestId } = event.data;

    const gathererStep = createInngestAgentStep(
      webInformationGatherer, // Removed type assertion
      'gatherer',
      'gatherer-process'
    );

    return step.run('process-gatherer', () =>
      gathererStep({ formData, context, sessionId, requestId })
    );
  }
);

export const specialistAgentFunction = inngest.createFunction(
  {
    id: 'specialist-agent',
    name: 'Information Specialist Agent',
    retries: 2,
  },
  { event: 'agent.specialist.process' },
  async ({ event, step }) => {
    const { formData, context, sessionId, requestId } = event.data;

    const specialistStep = createInngestAgentStep(
      informationSpecialist, // Removed type assertion
      'specialist',
      'specialist-process'
    );

    return step.run('process-specialist', () =>
      specialistStep({ formData, context, sessionId, requestId })
    );
  }
);

export const formPutterAgentFunction = inngest.createFunction(
  {
    id: 'form-putter-agent',
    name: 'Form Putter Agent',
    retries: 2,
  },
  { event: 'agent.form-putter.process' },
  async ({ event, step }) => {
    const { formData, context, sessionId, requestId } = event.data;

    const formPutterStep = createInngestAgentStep(
      formPutter, // Removed type assertion
      'form-putter',
      'form-putter-process'
    );

    return step.run('process-form-putter', () =>
      formPutterStep({ formData, context, sessionId, requestId })
    );
  }
);

// =============================================================================
// Progress Tracking Function
// =============================================================================

export const progressTrackingFunction = inngest.createFunction(
  {
    id: 'progress-tracking',
    name: 'Progress Tracking and Updates',
  },
  { event: EVENTS.PROGRESS_UPDATE },
  async ({ event, step }) => {
    const { sessionId, requestId, stage, progress, message, agentName } = event.data;

    // Here you could:
    // 1. Store progress in database
    // 2. Send WebSocket updates
    // 3. Trigger external notifications
    // 4. Update monitoring dashboards

    console.log(`Progress Update [${sessionId}]: ${stage} - ${progress}% - ${message}`);

    return {
      success: true,
      sessionId,
      requestId,
      stage,
      progress,
      message,
      agentName,
      timestamp: new Date().toISOString(),
    };
  }
);

// =============================================================================
// Export all functions for registration
// =============================================================================

export const inngestFunctions = [
  itineraryWorkflow,
  architectAgentFunction,
  gathererAgentFunction,
  specialistAgentFunction,
  formPutterAgentFunction,
  progressTrackingFunction,
];

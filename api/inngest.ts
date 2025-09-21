import { serve } from 'inngest/next';
import { inngest } from '../src/lib/inngest/client';
import { itineraryArchitect } from '../src/lib/agents/architect';
import { webInformationGatherer } from '../src/lib/agents/gatherer';
import { informationSpecialist } from '../src/lib/agents/specialist';
import { formPutter } from '../src/lib/agents/form-putter';
import { generateSmartQueries } from '../src/lib/smart-queries';
import { EnhancedFormData } from '../src/types/form-data';
import { AgentInput } from '../src/types/agent-responses';

/**
 * Inngest Workflow Handler
 * Orchestrates the multi-agent itinerary generation workflow
 */

// Workflow: Generate Itinerary
export const generateItineraryWorkflow = inngest.createFunction(
  { id: 'generate-itinerary-workflow' },
  { event: 'itinerary.generate.requested' },
  async ({ event, step }) => {
    const { formData, sessionId, requestId } = event.data;

    console.log(`[${requestId}] Starting itinerary generation workflow for session ${sessionId}`);

    // Step 1: Generate smart queries
    const smartQueries = await step.run('generate-smart-queries', async () => {
      console.log(`[${requestId}] Generating smart queries...`);
      return generateSmartQueries(formData as EnhancedFormData);
    });

    // Step 2: Itinerary Architect - High-level planning
    const architectResult = await step.run('itinerary-architect', async () => {
      console.log(`[${requestId}] Running itinerary architect...`);

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
        throw new Error(`Architect failed: ${result.error?.message}`);
      }

      return result;
    });

    // Step 3: Web Information Gatherer - Data collection (parallel with specialist prep)
    const gathererResult = await step.run('web-information-gatherer', async () => {
      console.log(`[${requestId}] Running web information gatherer...`);

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
        console.warn(`[${requestId}] Gatherer failed, continuing with limited data`);
        return result; // Don't throw, allow workflow to continue
      }

      return result;
    });

    // Step 4: Information Specialist - Deep analysis
    const specialistResult = await step.run('information-specialist', async () => {
      console.log(`[${requestId}] Running information specialist...`);

      const input: AgentInput = {
        formData: formData as EnhancedFormData,
        context: {
          sessionId,
          previousResults: [architectResult, gathererResult],
          stage: 'specialist',
        },
      };

      const result = await informationSpecialist.processRequest(input);

      if (!result.success) {
        console.warn(`[${requestId}] Specialist failed, continuing with basic analysis`);
        return result; // Don't throw, allow workflow to continue
      }

      return result;
    });

    // Step 5: Form Putter - Professional formatting
    const putterResult = await step.run('form-putter', async () => {
      console.log(`[${requestId}] Running form putter...`);

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
        throw new Error(`Putter failed: ${result.error?.message}`);
      }

      return result;
    });

    // Step 6: Synthesize final result
    const finalResult = await step.run('synthesize-results', async () => {
      console.log(`[${requestId}] Synthesizing final results...`);

      return {
        itinerary: putterResult.output?.data,
        metadata: {
          sessionId,
          requestId,
          generatedAt: new Date().toISOString(),
          agentVersions: {
            architect: architectResult.metadata?.agentVersion,
            gatherer: gathererResult.metadata?.agentVersion,
            specialist: specialistResult.metadata?.agentVersion,
            putter: putterResult.metadata?.agentVersion,
          },
          confidence: calculateWorkflowConfidence([
            architectResult,
            gathererResult,
            specialistResult,
            putterResult,
          ]),
          stages: [
            {
              stage: 'architect',
              status: architectResult.success ? 'completed' : 'failed',
              timestamp: new Date().toISOString(),
            },
            {
              stage: 'gatherer',
              status: gathererResult.success ? 'completed' : 'failed',
              timestamp: new Date().toISOString(),
            },
            {
              stage: 'specialist',
              status: specialistResult.success ? 'completed' : 'failed',
              timestamp: new Date().toISOString(),
            },
            {
              stage: 'putter',
              status: putterResult.success ? 'completed' : 'failed',
              timestamp: new Date().toISOString(),
            },
          ],
        },
        errors: [
          ...(architectResult.success
            ? []
            : [{ stage: 'architect', error: architectResult.error }]),
          ...(gathererResult.success ? [] : [{ stage: 'gatherer', error: gathererResult.error }]),
          ...(specialistResult.success
            ? []
            : [{ stage: 'specialist', error: specialistResult.error }]),
          ...(putterResult.success ? [] : [{ stage: 'putter', error: putterResult.error }]),
        ].filter((error) => error.error),
      };
    });

    console.log(`[${requestId}] Itinerary generation workflow completed successfully`);

    // Send completion event
    // TODO: Fix sendEvent syntax
    // await step.sendEvent('itinerary.generate.completed', {
    //   data: {
    //     sessionId,
    //     requestId,
    //     result: finalResult,
    //   },
    // });

    return finalResult;
  }
);

// Workflow: Form Update Handler
export const formUpdateWorkflow = inngest.createFunction(
  { id: 'form-update-workflow' },
  { event: 'form.updated' },
  async ({ event, step }) => {
    const { formData, sessionId, field, value } = event.data;

    console.log(`[${sessionId}] Processing form update for field: ${field}`);

    // Step 1: Validate form update
    const validation = await step.run('validate-form-update', async () => {
      return validateFormField(formData, field, value);
    });

    if (!validation.valid) {
      throw new Error(`Invalid form update: ${validation.error}`);
    }

    // Step 2: Update form state
    const updatedFormData = await step.run('update-form-state', async () => {
      return { ...formData, [field]: value };
    });

    // Step 3: Trigger dependent actions
    const dependentActions = await step.run('trigger-dependent-actions', async () => {
      return getDependentActions(field, updatedFormData);
    });

    // Send update notifications
    // TODO: Fix sendEvent syntax
    // await step.sendEvent('form.update.processed', {
    //   data: {
    //     sessionId,
    //     field,
    //     value,
    //     updatedFormData,
    //     dependentActions,
    //     timestamp: new Date().toISOString(),
    //   },
    // });

    return {
      sessionId,
      field,
      value,
      updatedFormData,
      dependentActions,
      processedAt: new Date().toISOString(),
    };
  }
);

/**
 * Helper Functions
 */

function calculateWorkflowConfidence(agentResults: any[]): number {
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

function validateFormField(
  formData: any,
  field: string,
  value: any
): { valid: boolean; error?: string } {
  // Basic validation logic
  switch (field) {
    case 'location':
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        return { valid: false, error: 'Location is required and must be a non-empty string' };
      }
      break;

    case 'adults':
      if (!Number.isInteger(value) || value < 1 || value > 20) {
        return { valid: false, error: 'Adults must be an integer between 1 and 20' };
      }
      break;

    case 'children':
      if (value !== undefined && (!Number.isInteger(value) || value < 0 || value > 20)) {
        return { valid: false, error: 'Children must be an integer between 0 and 20 if provided' };
      }
      break;

    case 'budget':
      if (value !== undefined && (typeof value !== 'number' || value <= 0 || value > 100000)) {
        return { valid: false, error: 'Budget must be a number between 1 and 100,000 if provided' };
      }
      break;

    case 'departDate':
    case 'returnDate':
      if (value && !(value instanceof Date) && isNaN(Date.parse(value))) {
        return { valid: false, error: `${field} must be a valid date` };
      }
      break;
  }

  return { valid: true };
}

function getDependentActions(field: string, formData: any): string[] {
  const actions: string[] = [];

  switch (field) {
    case 'location':
      actions.push('update-weather-info');
      actions.push('update-transport-options');
      actions.push('update-local-attractions');
      break;

    case 'departDate':
    case 'returnDate':
      actions.push('recalculate-duration');
      actions.push('update-seasonal-info');
      break;

    case 'adults':
    case 'children':
      actions.push('recalculate-group-size');
      actions.push('update-accommodation-options');
      break;

    case 'budget':
      actions.push('recalculate-cost-estimates');
      actions.push('update-budget-allocations');
      break;
  }

  return actions;
}

/**
 * Export the serve function for Next.js API routes
 */
export default serve({
  client: inngest,
  functions: [generateItineraryWorkflow, formUpdateWorkflow],
});

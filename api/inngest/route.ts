import { serve } from 'inngest/next';
import { inngest } from '../../src/lib/inngest/client';
import { itineraryArchitect } from '../../src/lib/agents/architect';
import { webInformationGatherer } from '../../src/lib/agents/gatherer';
import { informationSpecialist } from '../../src/lib/agents/specialist';
import { formPutter } from '../../src/lib/agents/form-putter';
import { generateSmartQueries } from '../../src/lib/smart-queries';
import { EnhancedFormData } from '../../src/types/form-data';
import { AgentInput } from '../../src/types/agent-responses';

/**
 * Inngest API Route Handler
 * Handles Inngest webhook requests for workflow processing
 *
 * This endpoint serves as the webhook handler for Inngest events,
 * processing workflow steps and coordinating agent execution.
 */

// Re-export the serve function from the main inngest handler
export { default } from '../inngest';

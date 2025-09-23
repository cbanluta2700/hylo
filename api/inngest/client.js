/**
 * Inngest Client Configuration
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - Type-safe development with comprehensive event schemas
 * - Following architecture structure from migration plan
 *
 * Phase 1: Foundation Setup
 */
import { EventSchemas, Inngest } from 'inngest';
/**
 * Create and export the Inngest client
 * Configured for Hylo Travel AI with full type safety
 */
export var inngest = new Inngest({
    id: 'hylo-travel-ai',
    name: 'Hylo Travel AI Workflow',
    schemas: new EventSchemas().fromRecord(),
});

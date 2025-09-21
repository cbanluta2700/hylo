/**
 * Form Update Workflow
 * Real-time form update processing and validation
 */

import { inngest } from './inngest-config';
import { FORM_UPDATE_WORKFLOW_STEPS, WORKFLOW_CONFIG } from './inngest-config';

/**
 * Form Update Workflow
 * Handles real-time form updates with validation and dependent actions
 */
export const formUpdateWorkflow = inngest.createFunction(
  {
    id: 'form-update-workflow',
    retries: WORKFLOW_CONFIG.MAX_RETRIES,
  },
  { event: 'form.updated' },
  async ({ event, step, logger }) => {
    const { formData, sessionId, field, value, userId } = event.data;

    logger.info('Starting form update workflow', {
      sessionId,
      field,
      userId,
    });

    // Step 1: Validate Form Update
    const validation = await step.run(
      FORM_UPDATE_WORKFLOW_STEPS['validateUpdate']?.id || 'validate-update',
      async () => {
        logger.info('Validating form update', { sessionId, field });

        const result = validateFormField(formData, field, value);

        if (!result.valid) {
          logger.warn('Form validation failed', {
            sessionId,
            field,
            error: result.error,
          });
          throw new Error(`Validation failed: ${result.error}`);
        }

        logger.info('Form validation passed', { sessionId, field });
        return result;
      }
    );

    // Step 2: Update Form State
    const updatedFormData = await step.run(
      FORM_UPDATE_WORKFLOW_STEPS['updateFormState']?.id || 'update-form-state',
      async () => {
        logger.info('Updating form state', { sessionId, field });

        const newFormData = { ...formData, [field]: value };

        logger.info('Form state updated', {
          sessionId,
          field,
          hasValue: value !== undefined && value !== null,
        });

        return newFormData;
      }
    );

    // Step 3: Trigger Dependent Actions
    const dependentActions = await step.run(
      FORM_UPDATE_WORKFLOW_STEPS['triggerActions']?.id || 'trigger-actions',
      async () => {
        logger.info('Triggering dependent actions', { sessionId, field });

        const actions = getDependentActions(field, updatedFormData);

        // Execute dependent actions
        for (const action of actions) {
          try {
            await executeDependentAction(action, updatedFormData, sessionId);
            logger.info('Dependent action executed', { sessionId, action });
          } catch (error) {
            logger.warn('Dependent action failed', {
              sessionId,
              action,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            // Continue with other actions even if one fails
          }
        }

        logger.info('Dependent actions completed', {
          sessionId,
          actionCount: actions.length,
        });

        return actions;
      }
    );

    // Step 4: Send Update Notifications
    await step.run(
      FORM_UPDATE_WORKFLOW_STEPS['sendNotifications']?.id || 'send-notifications',
      async () => {
        logger.info('Sending update notifications', { sessionId, field });

        // Send real-time notification via WebSocket
        await sendRealtimeNotification(sessionId, {
          type: 'form_update',
          field,
          value,
          validation,
          dependentActions,
          timestamp: new Date().toISOString(),
        });

        logger.info('Update notifications sent', { sessionId, field });
      }
    );

    // Calculate form completion status
    const completionStatus = calculateFormCompletion(updatedFormData);

    logger.info('Form update workflow completed', {
      sessionId,
      field,
      completionPercentage: completionStatus.percentage,
      completionStatus: completionStatus.status,
    });

    return {
      sessionId,
      field,
      value,
      updatedFormData,
      dependentActions,
      validation,
      completionStatus,
      processedAt: new Date().toISOString(),
    };
  }
);

/**
 * Validate form field update
 */
function validateFormField(
  formData: any,
  field: string,
  value: any
): { valid: boolean; error?: string } {
  switch (field) {
    case 'location':
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        return { valid: false, error: 'Location is required and must be a non-empty string' };
      }
      if (value.length > 100) {
        return { valid: false, error: 'Location must be less than 100 characters' };
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
      // Additional validation for date ranges
      if (field === 'returnDate' && formData.departDate && value) {
        const departDate = new Date(formData.departDate);
        const returnDate = new Date(value);
        if (returnDate <= departDate) {
          return { valid: false, error: 'Return date must be after departure date' };
        }
        const diffTime = Math.abs(returnDate.getTime() - departDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 90) {
          return { valid: false, error: 'Trip duration cannot exceed 90 days' };
        }
      }
      break;

    case 'selectedInterests':
      if (value !== undefined && !Array.isArray(value)) {
        return { valid: false, error: 'Selected interests must be an array if provided' };
      }
      if (value && value.length > 10) {
        return { valid: false, error: 'Cannot select more than 10 interests' };
      }
      break;

    case 'travelStyleChoice':
      const validStyles = ['budget', 'comfort', 'luxury', 'adventure', 'cultural', 'relaxation'];
      if (value && !validStyles.includes(value)) {
        return { valid: false, error: `Travel style must be one of: ${validStyles.join(', ')}` };
      }
      break;

    case 'tripNickname':
      if (value && typeof value !== 'string') {
        return { valid: false, error: 'Trip nickname must be a string if provided' };
      }
      if (value && value.length > 50) {
        return { valid: false, error: 'Trip nickname must be less than 50 characters' };
      }
      break;

    default:
      // Allow unknown fields but validate they're not null/undefined inappropriately
      if (value === null && !isNullableField(field)) {
        return { valid: false, error: `${field} cannot be null` };
      }
  }

  return { valid: true };
}

/**
 * Check if a field can be null
 */
function isNullableField(field: string): boolean {
  const nullableFields = [
    'children',
    'budget',
    'returnDate',
    'selectedInterests',
    'travelStyleChoice',
    'tripNickname',
    'notes',
  ];
  return nullableFields.includes(field);
}

/**
 * Get dependent actions for a field update
 */
function getDependentActions(field: string, formData: any): string[] {
  const actions: string[] = [];

  switch (field) {
    case 'location':
      actions.push('update-weather-info');
      actions.push('update-transport-options');
      actions.push('update-local-attractions');
      actions.push('update-currency-info');
      actions.push('update-visa-requirements');
      break;

    case 'departDate':
    case 'returnDate':
      actions.push('recalculate-duration');
      actions.push('update-seasonal-info');
      actions.push('update-availability-check');
      if (formData.location) {
        actions.push('update-weather-forecast');
      }
      break;

    case 'adults':
    case 'children':
      actions.push('recalculate-group-size');
      actions.push('update-accommodation-options');
      actions.push('update-transportation-capacity');
      actions.push('update-budget-estimates');
      break;

    case 'budget':
      actions.push('recalculate-cost-estimates');
      actions.push('update-budget-allocations');
      actions.push('filter-accommodation-options');
      actions.push('filter-activity-options');
      break;

    case 'selectedInterests':
      actions.push('update-activity-recommendations');
      actions.push('update-itinerary-suggestions');
      actions.push('filter-relevant-attractions');
      break;

    case 'travelStyleChoice':
      actions.push('update-accommodation-preferences');
      actions.push('update-transportation-preferences');
      actions.push('update-activity-filtering');
      break;
  }

  return actions;
}

/**
 * Execute dependent action
 */
async function executeDependentAction(
  action: string,
  _formData: any,
  sessionId: string
): Promise<void> {
  // Mock implementation - would integrate with actual services
  console.log(`Executing dependent action: ${action} for session ${sessionId}`);

  switch (action) {
    case 'update-weather-info':
      // Would call weather service
      await mockAsyncOperation('weather-update', 100);
      break;

    case 'update-transport-options':
      // Would call transportation service
      await mockAsyncOperation('transport-update', 150);
      break;

    case 'update-local-attractions':
      // Would call attractions service
      await mockAsyncOperation('attractions-update', 200);
      break;

    case 'recalculate-duration':
      // Would recalculate trip duration
      await mockAsyncOperation('duration-calculation', 50);
      break;

    case 'update-seasonal-info':
      // Would update seasonal information
      await mockAsyncOperation('seasonal-update', 100);
      break;

    case 'recalculate-group-size':
      // Would recalculate group size metrics
      await mockAsyncOperation('group-size-calculation', 50);
      break;

    case 'update-budget-estimates':
      // Would update budget estimates
      await mockAsyncOperation('budget-estimation', 100);
      break;

    default:
      // Unknown action - log but don't fail
      console.warn(`Unknown dependent action: ${action}`);
  }
}

/**
 * Send real-time notification via WebSocket
 */
async function sendRealtimeNotification(sessionId: string, notification: any): Promise<void> {
  // Mock implementation - would send via WebSocket
  console.log(`Sending real-time notification for session ${sessionId}:`, notification);

  // In a real implementation, this would:
  // 1. Find the WebSocket connection for the session
  // 2. Send the notification payload
  // 3. Handle connection errors gracefully
}

/**
 * Calculate form completion status
 */
function calculateFormCompletion(formData: any): {
  percentage: number;
  completedFields: string[];
  missingFields: string[];
  status: 'incomplete' | 'basic' | 'detailed' | 'complete';
} {
  const requiredFields = ['location', 'adults'];
  const recommendedFields = [
    'departDate',
    'returnDate',
    'budget',
    'selectedInterests',
    'travelStyleChoice',
  ];
  const optionalFields = ['children', 'tripNickname', 'notes'];

  const completedFields: string[] = [];
  const missingFields: string[] = [];

  // Check required fields
  for (const field of requiredFields) {
    if (formData[field] !== undefined && formData[field] !== null && formData[field] !== '') {
      completedFields.push(field);
    } else {
      missingFields.push(field);
    }
  }

  // Check recommended fields
  for (const field of recommendedFields) {
    if (formData[field] !== undefined && formData[field] !== null && formData[field] !== '') {
      completedFields.push(field);
    } else {
      missingFields.push(field);
    }
  }

  // Check optional fields
  for (const field of optionalFields) {
    if (formData[field] !== undefined && formData[field] !== null && formData[field] !== '') {
      completedFields.push(field);
    }
  }

  const totalFields = requiredFields.length + recommendedFields.length;
  const completedCount =
    completedFields.length - optionalFields.filter((f) => completedFields.includes(f)).length;
  const percentage = Math.round((completedCount / totalFields) * 100);

  let status: 'incomplete' | 'basic' | 'detailed' | 'complete';
  if (percentage < 25) status = 'incomplete';
  else if (percentage < 50) status = 'basic';
  else if (percentage < 75) status = 'detailed';
  else status = 'complete';

  return {
    percentage,
    completedFields,
    missingFields,
    status,
  };
}

/**
 * Mock async operation for demonstration
 */
async function mockAsyncOperation(_operation: string, delay: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Export for use in other modules
 */

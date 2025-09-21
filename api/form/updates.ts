import { NextApiRequest, NextApiResponse } from 'next';
import { inngest } from '../../src/lib/inngest/client';
import { generateId } from '../../src/lib/smart-queries';
import { EnhancedFormData } from '../../src/types/form-data';

/**
 * POST /api/form/updates
 * Real-time form updates and polling endpoint
 *
 * This endpoint handles real-time form updates and provides polling
 * capabilities for tracking form changes and triggering dependent actions.
 *
 * Request Body:
 * {
 *   "formData": EnhancedFormData,
 *   "sessionId": string,
 *   "field": string,
 *   "value": any,
 *   "triggerActions": boolean
 * }
 *
 * Response:
 * {
 *   "success": boolean,
 *   "updateId": string,
 *   "sessionId": string,
 *   "field": string,
 *   "value": any,
 *   "dependentActions": string[],
 *   "validation": {...},
 *   "timestamp": string
 * }
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
  const updateId = generateId();

  try {
    const { formData, sessionId, field, value, triggerActions = true } = req.body;

    // Validate request
    const validationError = validateFormUpdateRequest(formData, sessionId, field, value);
    if (validationError) {
      return res.status(validationError.status).json({
        error: validationError.error,
        updateId,
        timestamp: new Date().toISOString(),
      });
    }

    // Validate the field update
    const fieldValidation = validateFieldUpdate(formData, field, value);
    if (!fieldValidation.valid) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: fieldValidation.error,
        },
        updateId,
        field,
        value,
        validation: fieldValidation,
        timestamp: new Date().toISOString(),
      });
    }

    // Update form data
    const updatedFormData = { ...formData, [field]: value };

    // Determine dependent actions
    const dependentActions = getDependentActions(field, updatedFormData);

    // Trigger workflow if requested
    if (triggerActions && dependentActions.length > 0) {
      try {
        // Send form update event to Inngest
        await inngest.send({
          name: 'form.updated',
          data: {
            formData: updatedFormData,
            sessionId: sessionId || generateId(),
            field,
            value,
            updateId,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (workflowError) {
        console.warn('Failed to trigger workflow:', workflowError);
        // Continue without workflow - don't fail the request
      }
    }

    // Calculate form completion status
    const completionStatus = calculateFormCompletion(updatedFormData);

    // Return successful response
    return res.status(200).json({
      success: true,
      updateId,
      sessionId: sessionId || generateId(),
      field,
      value,
      updatedFormData,
      dependentActions,
      validation: fieldValidation,
      completionStatus,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Error in form updates endpoint:', error);

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process form update',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      updateId,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,
    });
  }
}

/**
 * Validate form update request
 */
function validateFormUpdateRequest(
  formData: any,
  sessionId: any,
  field: any,
  value: any
): { status: number; error: any } | null {
  if (!formData || typeof formData !== 'object') {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'formData is required and must be an object',
      },
    };
  }

  if (!field || typeof field !== 'string') {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'field is required and must be a string',
      },
    };
  }

  if (value === undefined) {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'value is required (can be null for clearing fields)',
      },
    };
  }

  // sessionId is optional but should be a string if provided
  if (sessionId !== undefined && typeof sessionId !== 'string') {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'sessionId must be a string if provided',
      },
    };
  }

  return null; // No validation errors
}

/**
 * Validate field update
 */
function validateFieldUpdate(
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
 * Export for testing purposes
 */
export {
  validateFormUpdateRequest,
  validateFieldUpdate,
  getDependentActions,
  calculateFormCompletion,
  isNullableField,
};

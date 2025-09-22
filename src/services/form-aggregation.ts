import { TravelFormData, FormAggregationResult, FormValidationState } from '@/types/travel-form';
import { validateTravelFormData, formatValidationErrors } from '@/schemas/ai-workflow-schemas';

/**
 * Aggregates data from all form components into a unified TravelFormData object
 * Handles optional fields and applies defaults
 * Returns validation state and warnings
 */
export function aggregateFormData(sections: Partial<TravelFormData>): FormAggregationResult {
  console.log('📝 [1] Form Aggregation: Starting form data aggregation', {
    sectionsKeys: Object.keys(sections),
  });

  // Merge all form sections into a single object
  const data: TravelFormData = {
    ...sections,
    // Defaults for optional fields
    plannedDays: sections.plannedDays ?? undefined,
    childrenAges: sections.childrenAges ?? [],
    nickname: sections.nickname ?? '',
    sessionId: sections.sessionId ?? undefined,
    formVersion: sections.formVersion ?? '1.0.0',
    submittedAt: sections.submittedAt ?? undefined,
  } as TravelFormData;

  console.log('📝 [2] Form Aggregation: Aggregated travel form data', data);

  // Validate aggregated data
  const validationResult = validateTravelFormData(data);
  let validation: FormValidationState;
  let missingFields: string[] = [];
  let warnings: string[] = [];

  console.log('📝 [3] Form Aggregation: Validation result', { success: validationResult.success });

  if (!validationResult.success) {
    validation = {
      isValid: false,
      errors: formatValidationErrors(validationResult.error),
      completedSections: [],
      requiredSections: [],
      completionPercentage: 0,
    };
    missingFields = Object.keys(validation.errors);
    warnings.push('Some required fields are missing or invalid.');
    console.log('📝 [4] Form Aggregation: Validation failed', { missingFields, warnings });
  } else {
    validation = {
      isValid: true,
      errors: {},
      completedSections: Object.keys(sections),
      requiredSections: [],
      completionPercentage: 100,
    };
    console.log('📝 [5] Form Aggregation: Validation successful', {
      completedSections: validation.completedSections,
    });
  }

  return {
    data,
    validation,
    missingFields,
    warnings,
  };
}

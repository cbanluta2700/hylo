import { TravelFormData, FormAggregationResult, FormValidationState } from '@/types/travel-form';
import { validateTravelFormData, formatValidationErrors } from '@/schemas/ai-workflow-schemas';

/**
 * Aggregates data from all form components into a unified TravelFormData object
 * Handles optional fields and applies defaults
 * Returns validation state and warnings
 */
export function aggregateFormData(sections: Partial<TravelFormData>): FormAggregationResult {
  // 🔥 HARD-CODED CONSOLE LOGS FOR VERCEL DEPLOYMENT
  console.log('🔥 VERCEL AUDIT: Form aggregation starting...');
  console.log('📊 VERCEL AUDIT: Input sections:', sections);

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

  console.log('📝 VERCEL AUDIT: Aggregated data:', data);

  // Validate aggregated data
  const validationResult = validateTravelFormData(data);
  let validation: FormValidationState;
  let missingFields: string[] = [];
  let warnings: string[] = [];

  if (!validationResult.success) {
    console.log('❌ VERCEL AUDIT: Validation failed:', validationResult.error);
    validation = {
      isValid: false,
      errors: formatValidationErrors(validationResult.error),
      completedSections: [],
      requiredSections: [],
      completionPercentage: 0,
    };
    missingFields = Object.keys(validation.errors);
    warnings.push('Some required fields are missing or invalid.');
  } else {
    console.log('✅ VERCEL AUDIT: Validation passed!');
    validation = {
      isValid: true,
      errors: {},
      completedSections: Object.keys(sections),
      requiredSections: [],
      completionPercentage: 100,
    };
  }

  const result = {
    data,
    validation,
    missingFields,
    warnings,
  };

  console.log('🚀 VERCEL AUDIT: Aggregation result:', result);
  return result;
}

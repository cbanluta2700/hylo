// Preference Modal Validation Schema
// Constitutional compliance: Edge-compatible, type-safe, observable

import { z } from 'zod';

// Define InclusionType locally since the original type file is missing
export type InclusionType =
  | 'flights'
  | 'accommodations'
  | 'rental-car'
  | 'activities'
  | 'dining'
  | 'entertainment'
  | 'train-tickets';

// Inclusion type schema
export const InclusionTypeSchema = z.enum([
  'flights',
  'accommodations',
  'rental-car',
  'activities',
  'dining',
  'entertainment',
  'train-tickets',
  'travel-insurance',
]);

// Base preference data schema
export const BasePreferenceDataSchema = z.object({
  other: z.string().optional(),
});

// Accommodation preferences schema
export const AccommodationPreferencesSchema = BasePreferenceDataSchema.extend({
  types: z.array(z.string()).min(1, 'Select at least one accommodation type'),
  budgetRange: z
    .object({
      min: z.number().min(0),
      max: z.number().min(1),
    })
    .refine((data) => data.max > data.min, {
      message: 'Maximum budget must be greater than minimum',
    }),
  location: z.string().optional(),
  amenities: z.array(z.string()),
  accessibility: z.array(z.string()),
});

// Rental car preferences schema
export const RentalCarPreferencesSchema = BasePreferenceDataSchema.extend({
  vehicleTypes: z.array(z.string()).min(1, 'Select at least one vehicle type'),
  transmission: z.enum(['automatic', 'manual', 'no-preference']),
  features: z.array(z.string()),
  insurance: z
    .object({
      level: z.enum(['basic', 'comprehensive', 'premium']),
      addOns: z.array(z.string()),
    })
    .optional(),
});

// Flight preferences schema
export const FlightPreferencesSchema = BasePreferenceDataSchema.extend({
  seatClass: z.enum(['economy', 'premium-economy', 'business', 'first']),
  airlines: z.array(z.string()),
  maxLayovers: z.number().min(0).max(5),
  departureTimePreference: z.enum(['morning', 'afternoon', 'evening', 'no-preference']),
});

// Activity preferences schema
export const ActivityPreferencesSchema = BasePreferenceDataSchema.extend({
  types: z.array(z.string()).min(1, 'Select at least one activity type'),
  intensity: z.enum(['low', 'moderate', 'high', 'mixed']),
  group: z.enum(['individual', 'small-group', 'large-group', 'no-preference']),
  duration: z.enum(['half-day', 'full-day', 'multi-day', 'flexible']),
});

// Generic preference data schema
export const GenericPreferenceDataSchema = z.record(z.any());

// Union preference data schema
export const PreferenceDataSchema = z.union([
  AccommodationPreferencesSchema,
  RentalCarPreferencesSchema,
  FlightPreferencesSchema,
  ActivityPreferencesSchema,
  GenericPreferenceDataSchema,
]);

// Preference modal state schema
export const PreferenceModalStateSchema = z.object({
  isOpen: z.boolean(),
  inclusionType: InclusionTypeSchema,
  canInteract: z.boolean(),
  focusedElement: z.string().optional(),
  formData: z.record(z.any()),
  validationErrors: z.record(z.string()),
  showOtherInput: z.boolean(),
  otherInputValue: z.string(),
  multiSelectValues: z.array(z.string()),
  returnFocusTo: z.any().optional(), // HTMLElement
  trapFocus: z.boolean(),
});

// Preference modal props schema
export const PreferenceModalPropsSchema = z.object({
  isOpen: z.boolean(),
  onClose: z.function().returns(z.void()),
  inclusionType: InclusionTypeSchema,
  initialData: z.record(z.any()).optional(),
  onDataChange: z.function().args(z.record(z.any())).returns(z.void()),
  onSubmit: z.function().args(z.record(z.any())).returns(z.void()),
  enableInteractionFixes: z.boolean().optional(),
  enableOtherInput: z.boolean().optional(),
  enableMultiSelect: z.boolean().optional(),
  multiSelectFields: z.array(z.string()).optional(),
  enableFocusTrap: z.boolean().optional(),
  ariaLabelledBy: z.string().optional(),
  className: z.string().optional(),
  overlayClassName: z.string().optional(),
  contentClassName: z.string().optional(),
});

// Preference field validation schema
export const PreferenceFieldValidationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.any().optional(), // RegExp
  custom: z.function().optional(),
});

// Preference field schema
export const PreferenceFieldSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.enum(['text', 'select', 'multi-select', 'checkbox', 'radio', 'range', 'textarea']),
  options: z
    .union([z.array(z.string()), z.array(z.object({ value: z.string(), label: z.string() }))])
    .optional(),
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
  validation: PreferenceFieldValidationSchema.optional(),
});

// Preference modal config schema
export const PreferenceModalConfigSchema = z.object({
  inclusionType: InclusionTypeSchema,
  title: z.string(),
  description: z.string().optional(),
  fields: z.array(PreferenceFieldSchema),
  validationSchema: z.any(), // ZodSchema
  enableOtherInput: z.boolean(),
  multiSelectFields: z.array(z.string()),
});

// Validation functions
export const validatePreferenceData = (
  data: Record<string, any>,
  inclusionType: InclusionType
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  try {
    switch (inclusionType) {
      case 'accommodations':
        AccommodationPreferencesSchema.parse(data);
        break;
      case 'rental-car':
        RentalCarPreferencesSchema.parse(data);
        break;
      case 'flights':
        FlightPreferencesSchema.parse(data);
        break;
      case 'activities':
        ActivityPreferencesSchema.parse(data);
        break;
      default:
        GenericPreferenceDataSchema.parse(data);
    }

    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
    }

    return { isValid: false, errors };
  }
};

export const validateRequiredFields = (
  data: Record<string, any>,
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } => {
  const missingFields = requiredFields.filter((field) => {
    const value = data[field];
    return (
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0)
    );
  });

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};

export const validateMultiSelectField = (
  values: string[],
  options: string[],
  minSelections = 0,
  maxSelections = Infinity
): { isValid: boolean; message?: string } => {
  if (values.length < minSelections) {
    return {
      isValid: false,
      message: `Select at least ${minSelections} option${minSelections > 1 ? 's' : ''}`,
    };
  }

  if (values.length > maxSelections) {
    return {
      isValid: false,
      message: `Select no more than ${maxSelections} option${maxSelections > 1 ? 's' : ''}`,
    };
  }

  // Check if all values are valid options
  const invalidValues = values.filter((value) => !options.includes(value));
  if (invalidValues.length > 0) {
    return {
      isValid: false,
      message: `Invalid options: ${invalidValues.join(', ')}`,
    };
  }

  return { isValid: true };
};

export const validateOtherInput = (
  value: string,
  maxLength = 200
): { isValid: boolean; message?: string } => {
  if (value.length > maxLength) {
    return {
      isValid: false,
      message: `Text cannot exceed ${maxLength} characters`,
    };
  }

  // Basic content validation
  const hasValidContent = value.trim().length > 0;
  if (!hasValidContent) {
    return {
      isValid: false,
      message: 'Please provide additional details',
    };
  }

  return { isValid: true };
};

// Performance validation
export const validateModalPerformance = (openTime: number, interactionTime: number): boolean => {
  return openTime < 100 && interactionTime < 50; // Open < 100ms, interactions < 50ms
};

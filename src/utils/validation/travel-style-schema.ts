// Travel Style Validation Schema
// Constitutional compliance: Edge-compatible, type-safe, observable

import { z } from 'zod';
import { TravelStyleChoice } from '../../types/travel-style-choice';

// Travel style choice schema
export const TravelStyleChoiceSchema = z.enum(['answer-questions', 'skip-ahead', 'not-selected']);

// Travel style data schema
export const TravelStyleDataSchema = z.object({
  experience: z.array(z.string()).min(1, 'Select at least one travel experience'),
  vibes: z.array(z.string()).min(1, 'Select at least one travel vibe'),
  sampleDays: z.array(z.string()).min(1, 'Select at least one sample day activity'),
  dinnerChoices: z.array(z.string()).min(1, 'Select at least one dining preference'),
  customTexts: z.record(z.string()),
});

// Partial travel style data for preservation
export const PartialTravelStyleDataSchema = z.object({
  experience: z.array(z.string()).optional(),
  vibes: z.array(z.string()).optional(),
  sampleDays: z.array(z.string()).optional(),
  dinnerChoices: z.array(z.string()).optional(),
  customTexts: z.record(z.string()).optional(),
});

// Travel style state schema
export const TravelStyleStateSchema = z.object({
  showSelectionButtons: z.boolean(),
  userChoice: TravelStyleChoiceSchema,
  showAllSections: z.boolean(),
  completedSections: z.array(z.string()),
  canSkipToNickname: z.boolean(),
  navigationPath: z.array(
    z.object({
      step: z.string(),
      timestamp: z.number(),
      choice: TravelStyleChoiceSchema.optional(),
    })
  ),
  preservedData: PartialTravelStyleDataSchema,
  isDirty: z.boolean(),
});

// Travel style props schema
export const TravelStylePropsSchema = z.object({
  onChoiceSelect: z.function().args(TravelStyleChoiceSchema).returns(z.void()),
  onSkipToNickname: z.function().returns(z.void()),
  onComplete: z.function().args(TravelStyleDataSchema).returns(z.void()),
  initialChoice: TravelStyleChoiceSchema.optional(),
  preservedData: PartialTravelStyleDataSchema.optional(),
  enableProgressTracking: z.boolean().optional(),
  allowBackNavigation: z.boolean().optional(),
  validateOnStepChange: z.boolean().optional(),
  choiceButtonTexts: z
    .object({
      answerQuestions: z.string(),
      skipAhead: z.string(),
    })
    .optional(),
  className: z.string().optional(),
  buttonClassName: z.string().optional(),
  sectionClassName: z.string().optional(),
});

// Travel style section schema
export const TravelStyleSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  fields: z.array(
    z.object({
      name: z.string(),
      label: z.string(),
      type: z.enum(['multi-select', 'single-select', 'text', 'textarea']),
      options: z
        .union([
          z.array(z.string()),
          z.array(
            z.object({
              value: z.string(),
              label: z.string(),
              description: z.string().optional(),
            })
          ),
        ])
        .optional(),
      placeholder: z.string().optional(),
      validation: z
        .object({
          minSelections: z.number().optional(),
          maxSelections: z.number().optional(),
          maxLength: z.number().optional(),
          required: z.boolean().optional(),
        })
        .optional(),
      customizable: z.boolean().optional(),
    })
  ),
  required: z.boolean(),
  order: z.number(),
});

// Travel style progress schema
export const TravelStyleProgressSchema = z.object({
  sectionsCompleted: z.number().min(0),
  totalSections: z.number().min(1),
  completionPercentage: z.number().min(0).max(100),
  estimatedTimeRemaining: z.number().min(0).optional(),
  currentSection: z.string().optional(),
});

// Validation functions
export const validateTravelStyleData = (
  data: Partial<Record<keyof z.infer<typeof TravelStyleDataSchema>, string[]>>
): { isValid: boolean; errors: Record<string, string>; completionPercentage: number } => {
  const errors: Record<string, string> = {};
  const requiredSections = ['experience', 'vibes', 'sampleDays', 'dinnerChoices'];
  let completedSections = 0;

  requiredSections.forEach((section) => {
    const value = data[section as keyof typeof data];
    if (!value || value.length === 0) {
      errors[section] = `Please select at least one ${section
        .replace(/([A-Z])/g, ' $1')
        .toLowerCase()}`;
    } else {
      completedSections++;
    }
  });

  const completionPercentage = (completedSections / requiredSections.length) * 100;
  const isValid = Object.keys(errors).length === 0;

  return { isValid, errors, completionPercentage };
};

export const validateSectionData = (
  data: string[],
  minSelections = 1,
  maxSelections = Infinity
): { isValid: boolean; message?: string } => {
  if (data.length < minSelections) {
    return {
      isValid: false,
      message: `Select at least ${minSelections} option${minSelections > 1 ? 's' : ''}`,
    };
  }

  if (data.length > maxSelections) {
    return {
      isValid: false,
      message: `Select no more than ${maxSelections} option${maxSelections > 1 ? 's' : ''}`,
    };
  }

  return { isValid: true };
};

export const validateCustomText = (
  value: string,
  maxLength = 100
): { isValid: boolean; message?: string } => {
  if (value.length > maxLength) {
    return {
      isValid: false,
      message: `Text cannot exceed ${maxLength} characters`,
    };
  }

  if (value.trim().length < 3) {
    return {
      isValid: false,
      message: 'Please provide at least 3 characters',
    };
  }

  return { isValid: true };
};

export const validateProgressTracking = (
  completedSections: string[],
  totalSections: string[]
): { isValid: boolean; progress: z.infer<typeof TravelStyleProgressSchema> } => {
  const sectionsCompleted = completedSections.length;
  const totalSectionsCount = totalSections.length;
  const completionPercentage =
    totalSectionsCount > 0 ? (sectionsCompleted / totalSectionsCount) * 100 : 0;

  // Estimate remaining time (2 minutes per remaining section)
  const remainingSections = totalSectionsCount - sectionsCompleted;
  const estimatedTimeRemaining = remainingSections * 2 * 60 * 1000; // in milliseconds

  const progress: z.infer<typeof TravelStyleProgressSchema> = {
    sectionsCompleted,
    totalSections: totalSectionsCount,
    completionPercentage,
    estimatedTimeRemaining: estimatedTimeRemaining > 0 ? estimatedTimeRemaining : undefined,
    currentSection:
      completedSections.length < totalSections.length
        ? totalSections[completedSections.length]
        : undefined,
  };

  return {
    isValid: true,
    progress,
  };
};

export const validateNavigationPath = (
  path: Array<{ step: string; timestamp: number; choice?: TravelStyleChoice }>
): { isValid: boolean; canGoBack: boolean; currentStep?: string } => {
  if (path.length === 0) {
    return { isValid: true, canGoBack: false };
  }

  // Check if timestamps are in order
  for (let i = 1; i < path.length; i++) {
    if (path[i]!.timestamp < path[i - 1]!.timestamp) {
      return { isValid: false, canGoBack: false };
    }
  }

  const currentStep = path[path.length - 1]?.step;
  const canGoBack = path.length > 1;

  return {
    isValid: true,
    canGoBack,
    ...(currentStep && { currentStep }),
  };
};

export const validateDataPreservation = (
  data: Partial<z.infer<typeof TravelStyleDataSchema>>
): { isValid: boolean; preservedFields: string[]; totalFields: number } => {
  const allFields = ['experience', 'vibes', 'sampleDays', 'dinnerChoices', 'customTexts'];
  const preservedFields = allFields.filter((field) => {
    const value = data[field as keyof typeof data];
    return value && (Array.isArray(value) ? value.length > 0 : Object.keys(value).length > 0);
  });

  return {
    isValid: true,
    preservedFields,
    totalFields: allFields.length,
  };
};

// Performance validation
export const validateTravelStylePerformance = (
  transitionTime: number,
  interactionTime: number
): boolean => {
  return transitionTime < 100 && interactionTime < 50; // Transitions < 100ms, interactions < 50ms
};

// Common travel style options (for validation)
export const VALID_EXPERIENCE_OPTIONS = [
  'cultural',
  'adventure',
  'relaxation',
  'culinary',
  'historical',
  'nature',
  'urban',
  'beach',
  'mountains',
  'wildlife',
];

export const VALID_VIBE_OPTIONS = [
  'relaxed',
  'adventure',
  'luxury',
  'budget',
  'romantic',
  'family',
  'solo',
  'group',
  'spontaneous',
  'planned',
];

export const VALID_SAMPLE_DAY_OPTIONS = [
  'museum-visits',
  'outdoor-activities',
  'food-tours',
  'shopping',
  'historical-sites',
  'beach-time',
  'nightlife',
  'spa-relaxation',
];

export const VALID_DINNER_OPTIONS = [
  'fine-dining',
  'local-cuisine',
  'street-food',
  'vegetarian',
  'seafood',
  'international',
  'casual',
  'romantic',
];

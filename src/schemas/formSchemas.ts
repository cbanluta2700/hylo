import { z } from 'zod';

// Base schemas for reusability
const currencyEnum = z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']);
const budgetModeEnum = z.enum(['total', 'per-person']); // T002: Added budget mode enum
const travelStyleEnum = z.enum(['answer-questions', 'skip-to-details', 'not-selected']);

// Trip Details Schema with enhanced validation
export const tripDetailsSchema = z
  .object({
    location: z
      .string()
      .min(1, 'Location is required')
      .max(100, 'Location must be less than 100 characters'),

    departDate: z
      .string()
      .min(1, 'Departure date is required')
      .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),

    returnDate: z
      .string()
      .optional()
      .refine((date) => !date || !isNaN(Date.parse(date)), 'Invalid date format'),

    flexibleDates: z.boolean().default(false),

    plannedDays: z
      .number()
      .min(1, 'Must be at least 1 day')
      .max(31, 'Cannot exceed 31 days')
      .optional(),

    adults: z.number().min(1, 'At least 1 adult required').max(10, 'Maximum 10 adults'),

    children: z.number().min(0, 'Cannot be negative').max(10, 'Maximum 10 children'),

    childrenAges: z
      .array(z.number().min(0, 'Age cannot be negative').max(17, 'Age cannot exceed 17'))
      .optional(),

    budget: z
      .number()
      .min(0, 'Budget cannot be negative')
      .max(10000, 'Budget cannot exceed $10,000'),

    currency: currencyEnum.default('USD'),

    flexibleBudget: z.boolean().default(false),

    // T002: Enhanced budget configuration
    budgetMode: budgetModeEnum.default('total'),

    accommodationOther: z.string().max(500, 'Description too long').optional(),

    rentalCarPreferences: z.array(z.string()).max(5, 'Maximum 5 preferences').optional(),

    travelStyleChoice: travelStyleEnum.default('not-selected'),

    travelStyleAnswers: z.record(z.any()).optional(),

    // T002: Enhanced selection fields
    selectedGroups: z.array(z.string()).optional(),
    customGroupText: z.string().max(200, 'Custom group text too long').optional(),
    selectedInterests: z.array(z.string()).optional(),
    customInterestsText: z.string().max(200, 'Custom interest text too long').optional(),
    selectedInclusions: z.array(z.string()).optional(),
    customInclusionsText: z.string().max(200, 'Custom inclusion text too long').optional(),
    inclusionPreferences: z.record(z.any()).optional(),
    
    // T002: Travel style comprehensive data
    travelExperience: z.array(z.string()).optional(),
    tripVibes: z.array(z.string()).optional(),
    customVibeText: z.string().max(200, 'Custom vibe text too long').optional(),
    sampleDays: z.array(z.string()).optional(),
    dinnerPreferences: z.array(z.string()).optional(),
    
    // T002: Simplified contact information
    tripNickname: z.string().max(100, 'Trip nickname too long').optional(),
    contactName: z.string().max(50, 'Contact name too long').optional(),
    contactEmail: z.string().email('Invalid email format').optional(),
  })
  .superRefine((data, ctx) => {
    // Cross-field validation for children ages
    const childrenCount = data.children || 0;
    if (childrenCount > 0) {
      if (!data.childrenAges || data.childrenAges.length !== childrenCount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Number of children ages must match number of children',
          path: ['childrenAges'],
        });
      }
    }
  });

// Travel Interests Schema with conditional validation
export const travelInterestsSchema = z
  .object({
    selectedInterests: z
      .array(z.string())
      .min(1, 'Please select at least one interest')
      .max(10, 'Maximum 10 interests'),

    otherText: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.selectedInterests.includes('other')) {
        return data.otherText && data.otherText.trim().length >= 10;
      }
      return true;
    },
    {
      message: 'Please provide at least 10 characters for other interests',
      path: ['otherText'],
    }
  );

// Accommodation Preferences Schema
export const accommodationPreferencesSchema = z.object({
  accommodationTypes: z.array(z.string()).min(1, 'Select at least one accommodation type'),
  otherAccommodationType: z.string().max(500, 'Description too long').optional(),
  specialRequests: z.string().max(500, 'Description too long').optional(),
});

// Rental Car Preferences Schema
export const rentalCarPreferencesSchema = z.object({
  vehicleTypes: z.array(z.string()).min(1, 'Select at least one vehicle type'),
  specialRequirements: z.string().max(300, 'Requirements description too long').optional(),
});

// Travel Style Group Schema
export const travelStyleGroupSchema = z.object({
  experience: z.array(z.string()).min(1, 'Select at least one travel experience'),
  vibes: z.array(z.string()).min(1, 'Select at least one travel vibe'),
  sampleDays: z.array(z.string()).min(1, 'Select at least one sample day activity'),
  dinnerChoices: z.array(z.string()).min(1, 'Select at least one dining preference'),
  tripNickname: z
    .string()
    .min(3, 'Nickname must be at least 3 characters')
    .max(50, 'Nickname must be less than 50 characters'),
});

// Type exports with proper inference
export type TripDetailsFormData = z.infer<typeof tripDetailsSchema>;
export type TravelInterestsFormData = z.infer<typeof travelInterestsSchema>;
export type AccommodationPreferencesFormData = z.infer<typeof accommodationPreferencesSchema>;
export type RentalCarPreferencesFormData = z.infer<typeof rentalCarPreferencesSchema>;
export type TravelStyleGroupData = z.infer<typeof travelStyleGroupSchema>;

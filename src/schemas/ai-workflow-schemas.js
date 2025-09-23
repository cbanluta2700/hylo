/**
 * AI Workflow Validation Schemas
 *
 * Zod schemas for AI workflow data validation
 * Constitutional Requirement: Type-Safe Development with Zod validation at API boundaries
 */
import { z } from 'zod';
/**
 * Trip Details Validation Schema
 */
var TripDetailsSchema = z
    .object({
    location: z
        .string()
        .min(2, 'Location must be at least 2 characters')
        .max(100, 'Location cannot exceed 100 characters'),
    departDate: z.string().refine(function (date) { return !isNaN(Date.parse(date)); }, 'Invalid departure date'),
    returnDate: z
        .string()
        .refine(function (date) { return !isNaN(Date.parse(date)); }, 'Invalid return date')
        .optional(),
    flexibleDates: z.boolean(),
    plannedDays: z
        .number()
        .int('Planned days must be a whole number')
        .min(1, 'Trip must be at least 1 day')
        .max(365, 'Trip cannot exceed 365 days')
        .optional(),
    adults: z
        .number()
        .int('Number of adults must be a whole number')
        .min(1, 'At least 1 adult is required')
        .max(20, 'Cannot exceed 20 adults'),
    children: z
        .number()
        .int('Number of children must be a whole number')
        .min(0, 'Number of children cannot be negative')
        .max(20, 'Cannot exceed 20 children'),
    childrenAges: z.array(z.number().int().min(0).max(17)).optional(),
})
    .refine(function (data) {
    // If returnDate is provided, it must be after departDate
    if (data.returnDate) {
        var depart = new Date(data.departDate);
        var returnD = new Date(data.returnDate);
        return returnD > depart;
    }
    return true;
}, {
    message: 'Return date must be after departure date',
    path: ['returnDate'],
})
    .refine(function (data) {
    // If children > 0, childrenAges array must be provided and match count
    if (data.children > 0) {
        return data.childrenAges && data.childrenAges.length === data.children;
    }
    return true;
}, {
    message: 'Children ages must be provided when children count is greater than 0',
    path: ['childrenAges'],
});
/**
 * Budget Validation Schema
 */
var BudgetSchema = z
    .object({
    total: z
        .number()
        .min(0, 'Total budget cannot be negative') // Allow 0 for flexible budgets
        .max(1000000, 'Budget cannot exceed $1,000,000'),
    currency: z
        .string()
        .length(3, 'Currency must be 3-character code (e.g., USD, EUR)')
        .regex(/^[A-Z]{3}$/, 'Currency must be uppercase 3-letter code'),
    breakdown: z.object({
        accommodation: z.number().min(0, 'Accommodation budget cannot be negative'),
        food: z.number().min(0, 'Food budget cannot be negative'),
        activities: z.number().min(0, 'Activities budget cannot be negative'),
        transportation: z.number().min(0, 'Transportation budget cannot be negative'),
        shopping: z.number().min(0, 'Shopping budget cannot be negative'),
        emergency: z.number().min(0, 'Emergency budget cannot be negative'),
    }),
    flexibility: z.enum(['strict', 'flexible', 'very-flexible']),
})
    .refine(function (data) {
    // Breakdown should approximately sum to total (within 10% tolerance)
    var sum = Object.values(data.breakdown).reduce(function (a, b) { return a + b; }, 0);
    var tolerance = data.total * 0.1;
    return Math.abs(sum - data.total) <= tolerance;
}, {
    message: 'Budget breakdown should approximately sum to total budget',
    path: ['breakdown'],
});
/**
 * Travel Style Validation Schema
 */
var TravelStyleSchema = z.object({
    pace: z.enum(['slow', 'moderate', 'fast']),
    accommodationType: z.enum(['budget', 'mid-range', 'luxury', 'mixed']),
    diningPreferences: z.enum(['local', 'international', 'mixed']),
    activityLevel: z.enum(['low', 'moderate', 'high']),
    culturalImmersion: z.enum(['minimal', 'moderate', 'deep']),
});
/**
 * Travel Preferences Validation Schema
 */
var TravelPreferencesSchema = z.object({
    interests: z.array(z.string().min(1).max(50)).max(20, 'Cannot have more than 20 interests'),
    avoidances: z.array(z.string().min(1).max(50)).max(10, 'Cannot have more than 10 avoidances'),
    dietaryRestrictions: z
        .array(z.string().min(1).max(50))
        .max(10, 'Cannot have more than 10 dietary restrictions'),
    accessibility: z
        .array(z.string().min(1).max(100))
        .max(10, 'Cannot have more than 10 accessibility requirements'),
});
/**
 * Main Travel Form Data Validation Schema
 */
export var TravelFormDataSchema = z
    .object({
    // Trip Details
    location: z.string().min(2).max(100),
    departDate: z.string().refine(function (date) {
        // Allow empty string for flexible dates - will be handled by cross-validation
        if (date === '')
            return true;
        return !isNaN(Date.parse(date));
    }, 'Invalid departure date'),
    returnDate: z
        .string()
        .refine(function (date) {
        // Allow empty string for flexible dates or optional return
        if (!date || date === '')
            return true;
        return !isNaN(Date.parse(date));
    }, 'Invalid return date')
        .optional(),
    flexibleDates: z.boolean(),
    plannedDays: z.number().int().min(1).max(365).optional(),
    adults: z.number().int().min(1).max(20),
    children: z.number().int().min(0).max(20),
    childrenAges: z.array(z.number().int().min(0).max(17)).optional(),
    // Budget
    budget: BudgetSchema,
    // Travel Style
    travelStyle: TravelStyleSchema,
    // Preferences
    interests: z.array(z.string().min(1).max(50)).max(20),
    avoidances: z.array(z.string().min(1).max(50)).max(10),
    dietaryRestrictions: z.array(z.string().min(1).max(50)).max(10),
    accessibility: z.array(z.string().min(1).max(100)).max(10),
    // Style Choices
    tripVibe: z.string().min(3).max(50),
    travelExperience: z.enum(['first-time', 'experienced', 'expert']),
    dinnerChoice: z.enum(['fine-dining', 'local-spots', 'street-food', 'mixed']),
    nickname: z.string().min(1).max(30).optional(),
    // Additional Services
    additionalServices: z.object({
        carRental: z.boolean(),
        travel_insurance: z.boolean(),
        tours: z.boolean(),
        airport_transfers: z.boolean(),
        spa_wellness: z.boolean(),
        adventure_activities: z.boolean(),
    }), // Metadata
    sessionId: z.string().uuid().optional(),
    formVersion: z.string().min(1, 'Form version is required'),
    submittedAt: z
        .string()
        .refine(function (date) { return !date || !isNaN(Date.parse(date)); }, 'Invalid submittedAt date')
        .optional(),
})
    .refine(function (data) {
    // For flexible dates, require plannedDays
    if (data.flexibleDates) {
        return data.plannedDays && data.plannedDays > 0;
    }
    // For fixed dates, require valid departure date
    if (!data.departDate || data.departDate === '') {
        return false;
    }
    // Validate return date is after depart date (only for fixed dates with both dates)
    if (data.returnDate && data.returnDate !== '') {
        var depart = new Date(data.departDate);
        var returnD = new Date(data.returnDate);
        return returnD > depart;
    }
    return true;
}, {
    message: 'For flexible dates, plannedDays is required. For fixed dates, valid departure date is required and return date must be after departure date',
    path: ['departDate'],
})
    .refine(function (data) {
    // Validate children ages match children count
    if (data.children > 0) {
        return data.childrenAges && data.childrenAges.length === data.children;
    }
    return true;
}, {
    message: 'Children ages must be provided when children count is greater than 0',
    path: ['childrenAges'],
})
    .refine(function (data) {
    // Skip planned days calculation for flexible dates with empty date fields
    if (data.flexibleDates && (!data.departDate || data.departDate === '')) {
        return true;
    }
    // Cross-field validation: if planned days is not provided, calculate from dates
    if (!data.plannedDays &&
        data.returnDate &&
        data.returnDate !== '' &&
        data.departDate &&
        data.departDate !== '') {
        var depart = new Date(data.departDate);
        var returnD = new Date(data.returnDate);
        var calculatedDays = Math.ceil((returnD.getTime() - depart.getTime()) / (1000 * 60 * 60 * 24));
        return calculatedDays > 0 && calculatedDays <= 365;
    }
    return true;
}, {
    message: 'Invalid date range for trip duration',
    path: ['plannedDays'],
});
/**
 * Workflow Request Schema (for API endpoints)
 */
export var WorkflowRequestSchema = z.object({
    sessionId: z.string().uuid('Invalid session ID format'),
    formData: TravelFormDataSchema,
});
/**
 * Form Section Schemas (for incremental validation)
 */
export var FormSectionSchemas = {
    tripDetails: TripDetailsSchema,
    budget: BudgetSchema,
    travelStyle: TravelStyleSchema,
    preferences: TravelPreferencesSchema,
};
/**
 * Validation Helper Functions
 */
export function validateFormSection(section, data) {
    var schema = FormSectionSchemas[section];
    return schema.safeParse(data);
}
export function validateTravelFormData(data) {
    return TravelFormDataSchema.safeParse(data);
}
export function validateWorkflowRequest(data) {
    return WorkflowRequestSchema.safeParse(data);
}
/**
 * Error Message Formatter
 */
export function formatValidationErrors(error) {
    var formatted = {};
    for (var _i = 0, _a = error.errors; _i < _a.length; _i++) {
        var issue = _a[_i];
        var path = issue.path.join('.');
        if (!formatted[path]) {
            formatted[path] = [];
        }
        formatted[path].push(issue.message);
    }
    return formatted;
}

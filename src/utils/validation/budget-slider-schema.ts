// Budget Slider Validation Schema
// Constitutional compliance: Edge-compatible, type-safe, observable

import { z } from 'zod';
import { Currency, BudgetMode } from '../../components/TripDetails/types';

// Budget value schema
export const BudgetValueSchema = z
  .number()
  .min(0, 'Budget must be positive')
  .max(1000000, 'Budget seems unreasonably high')
  .int('Budget must be a whole number');

// Currency schema
export const CurrencySchema = z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']);

// Budget mode schema
export const BudgetModeSchema = z.enum(['total', 'per-person']);

// Budget slider state schema
export const BudgetSliderStateSchema = z.object({
  value: BudgetValueSchema,
  displayValue: z.string(),
  currency: CurrencySchema,
  min: z.number().min(0),
  max: z.number().min(1),
  step: z.number().min(1),
  isDragging: z.boolean(),
  isHovered: z.boolean(),
  isFlexible: z.boolean(),
  flexibleLabel: z.string(),
  lastUpdateTime: z.number(),
  updatePending: z.boolean(),
});

// Budget slider props schema
export const BudgetSliderPropsSchema = z.object({
  value: BudgetValueSchema,
  onChange: z.function().args(z.number()).returns(z.void()),
  min: z.number().min(0).optional(),
  max: z.number().min(1).optional(),
  step: z.number().min(1).optional(),
  currency: CurrencySchema.optional(),
  enableRealTimeSync: z.boolean().optional(),
  showFlexibleToggle: z.boolean().optional(),
  flexibleMode: z.boolean().optional(),
  showCurrencySelector: z.boolean().optional(),
  showBudgetModeToggle: z.boolean().optional(),
  budgetMode: BudgetModeSchema.optional(),
  debounceMs: z.number().min(0).max(1000).optional(),
  enablePerformanceMonitoring: z.boolean().optional(),
  className: z.string().optional(),
  sliderClassName: z.string().optional(),
  displayClassName: z.string().optional(),
});

// Budget range schema
export const BudgetRangeSchema = z
  .object({
    min: BudgetValueSchema,
    max: BudgetValueSchema,
    step: z.number().min(1),
    defaultValue: BudgetValueSchema,
    currency: CurrencySchema,
    suggestions: z.array(BudgetValueSchema).optional(),
  })
  .refine((data) => data.max > data.min, {
    message: 'Maximum budget must be greater than minimum',
    path: ['max'],
  })
  .refine((data) => data.defaultValue >= data.min && data.defaultValue <= data.max, {
    message: 'Default value must be within min/max range',
    path: ['defaultValue'],
  });

// Validation functions
export const validateBudgetValue = (
  value: number,
  min = 0,
  max = 1000000
): { isValid: boolean; message?: string } => {
  try {
    BudgetValueSchema.parse(value);

    if (value < min) {
      return { isValid: false, message: `Budget must be at least ${min}` };
    }

    if (value > max) {
      return { isValid: false, message: `Budget cannot exceed ${max}` };
    }

    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        message: error.errors[0]?.message || 'Invalid budget value',
      };
    }
    return { isValid: false, message: 'Validation error' };
  }
};

export const validateBudgetRange = (
  min: number,
  max: number,
  step: number,
  defaultValue: number
): { isValid: boolean; message?: string } => {
  try {
    BudgetRangeSchema.parse({ min, max, step, defaultValue, currency: 'USD' });
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        message: error.errors[0]?.message || 'Invalid budget range',
      };
    }
    return { isValid: false, message: 'Range validation error' };
  }
};

// Currency formatting validation
export const validateCurrencyFormat = (
  amount: number,
  currency: Currency
): { isValid: boolean; formatted?: string } => {
  try {
    CurrencySchema.parse(currency);
    BudgetValueSchema.parse(amount);

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    return {
      isValid: true,
      formatted: formatter.format(amount),
    };
  } catch (error) {
    return { isValid: false };
  }
};

// Budget mode calculation validation
export const validateBudgetModeCalculation = (
  amount: number,
  mode: BudgetMode,
  travelers: number
): { isValid: boolean; result?: number; message?: string } => {
  try {
    BudgetValueSchema.parse(amount);
    BudgetModeSchema.parse(mode);

    if (travelers < 1 || travelers > 20) {
      return { isValid: false, message: 'Number of travelers must be between 1 and 20' };
    }

    if (mode === 'per-person') {
      const total = amount * travelers;
      if (total > 1000000) {
        return { isValid: false, message: 'Total budget exceeds maximum limit' };
      }
      return { isValid: true, result: total };
    } else {
      const perPerson = amount / travelers;
      return { isValid: true, result: perPerson };
    }
  } catch (error) {
    return { isValid: false, message: 'Calculation validation error' };
  }
};

// Performance validation
export const validateBudgetSliderPerformance = (updateLatency: number): boolean => {
  return updateLatency < 50; // Must update within 50ms
};

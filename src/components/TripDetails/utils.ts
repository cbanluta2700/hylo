// src/components/TripDetails/utils.ts
import {
  YEAR_THRESHOLD,
  YEAR_BASE_1900,
  YEAR_BASE_2000,
  tripDetailsSchema,
  FormData,
  ValidationResult,
} from './types';

export const dateUtils = {
  parseMMDDYY: (dateStr: string): Date | null => {
    if (!dateStr) return null;

    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;

    const month = parseInt(parts[0] || '0') - 1; // Month is 0-indexed
    const day = parseInt(parts[1] || '0');
    let year = parseInt(parts[2] || '0');

    // Convert 2-digit year to 4-digit year
    if (year < YEAR_THRESHOLD) {
      year += YEAR_BASE_2000;
    } else if (year < 100) {
      year += YEAR_BASE_1900;
    }

    const date = new Date(year, month, day);
    // Validate the date
    if (isNaN(date.getTime())) return null;

    return date;
  },

  formatToMMDDYY: (date: Date): string => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
  },

  convertToInputFormat: (dateStr: string): string => {
    if (!dateStr) return '';

    const date = dateUtils.parseMMDDYY(dateStr);
    if (!date) return '';

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  },

  getTodayString: (): string => {
    return new Date().toISOString().split('T')[0] || '';
  },

  calculateDaysBetween: (startDate: string, endDate: string): number | null => {
    const start = dateUtils.parseMMDDYY(startDate);
    const end = dateUtils.parseMMDDYY(endDate);

    if (!start || !end) return null;

    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return daysDiff > 0 ? daysDiff : null;
  },

  isReturnDateValid: (departDate: string, returnDate: string): boolean => {
    const depart = dateUtils.parseMMDDYY(departDate);
    const returnD = dateUtils.parseMMDDYY(returnDate);

    if (!depart || !returnD) return false;

    // Return date must be at least one day after departure date
    return returnD.getTime() > depart.getTime();
  },
};

// Validation utilities
export const validationUtils = {
  /**
   * Validates form data using Zod schema
   */
  validateFormData: (data: Partial<FormData>): ValidationResult => {
    try {
      tripDetailsSchema.parse(data);
      return {
        isValid: true,
        errors: {},
        fieldErrors: {},
      };
    } catch (error: any) {
      const fieldErrors: Record<string, string> = {};
      const errors: Record<string, string[]> = {};

      if (error.errors) {
        error.errors.forEach((err: any) => {
          const path = err.path.join('.');
          const message = err.message;

          fieldErrors[path] = message;
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(message);
        });
      }

      return {
        isValid: false,
        errors,
        fieldErrors,
      };
    }
  },

  /**
   * Validates a specific field
   */
  validateField: (
    fieldName: string,
    value: any,
    formData: Partial<FormData>
  ): { isValid: boolean; errors: string[] } => {
    try {
      // Create a partial object with just this field for validation
      const testData = { ...formData, [fieldName]: value };
      tripDetailsSchema.parse(testData);
      return { isValid: true, errors: [] };
    } catch (error: any) {
      const errors: string[] = [];
      if (error.errors) {
        error.errors.forEach((err: any) => {
          if (err.path.includes(fieldName)) {
            errors.push(err.message);
          }
        });
      }
      return { isValid: errors.length === 0, errors };
    }
  },

  /**
   * Real-time validation helper for form inputs
   */
  debounceValidation: (callback: () => void, delay = 300) => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(callback, delay);
    };
  },
};

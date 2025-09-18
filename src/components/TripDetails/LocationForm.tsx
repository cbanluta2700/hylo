// src/components/TripDetails/LocationForm.tsx
import React, { useState, useCallback } from 'react';
import { BaseFormProps } from './types';
import { validationUtils } from './utils';

const LocationForm: React.FC<BaseFormProps> = ({
  formData,
  onFormChange,
  validationErrors,
  onValidation,
}) => {
  const [isValidating, setIsValidating] = useState(false);

  const validateLocation = useCallback(
    validationUtils.debounceValidation(() => {
      if (formData.location) {
        const result = validationUtils.validateField('location', formData.location, formData);
        onValidation?.('location', result.isValid, result.errors);
      }
      setIsValidating(false);
    }),
    [formData, onValidation]
  );

  const handleLocationChange = (value: string) => {
    onFormChange({ location: value });

    // Trigger validation
    if (onValidation) {
      setIsValidating(true);
      validateLocation();
    }
  };

  const hasError = validationErrors?.['location'];
  const isEmpty = !formData.location?.trim();

  return (
    <div className="bg-form-box rounded-[36px] p-6 border-3 border-gray-200">
      <h3 className="text-xl font-bold text-primary uppercase tracking-wide mb-4 font-raleway">
        LOCATION(S)
      </h3>
      <div className="space-y-2">
        <input
          type="text"
          placeholder='Example: "New York", "Thailand", "Spain and Portugal"'
          value={formData.location || ''}
          onChange={(e) => handleLocationChange(e.target.value)}
          className={`w-full px-4 py-3 border-3 rounded-[10px] focus:ring-2 focus:border-primary transition-all duration-200 bg-white placeholder-gray-500 font-bold font-raleway text-base ${
            hasError
              ? 'border-red-500 focus:ring-red-200 text-red-600'
              : 'border-primary focus:ring-primary text-primary'
          }`}
          aria-label="Trip location"
          aria-invalid={!!hasError}
          aria-describedby={hasError ? 'location-error' : undefined}
        />

        {/* Validation feedback */}
        {hasError && (
          <p
            id="location-error"
            className="text-sm text-red-600 font-bold font-raleway mt-1 flex items-center"
            role="alert"
          >
            <span className="mr-1">⚠️</span>
            {hasError}
          </p>
        )}

        {isValidating && <p className="text-sm text-blue-600 font-raleway mt-1">Validating...</p>}

        {/* Success indicator */}
        {!isEmpty && !hasError && !isValidating && (
          <p className="text-sm text-green-600 font-bold font-raleway mt-1 flex items-center">
            <span className="mr-1">✓</span>
            Location looks good!
          </p>
        )}
      </div>
    </div>
  );
};

export default LocationForm;

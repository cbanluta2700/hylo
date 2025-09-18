// src/components/TripDetails/index.tsx
import React, { useCallback, useState, useEffect } from 'react';
import LocationForm from './LocationForm';
import DatesForm from './DatesForm';
import TravelersForm from './TravelersForm';
import BudgetForm from './BudgetForm';
import TravelGroupSelector from './TravelGroupSelector';
import TravelInterests from './TravelInterests';
import ItineraryInclusions from './ItineraryInclusions';
import { FormData } from './types';
import { validationUtils } from './utils';

interface TripDetailsProps {
  formData: FormData;
  onFormChange: (data: FormData) => void;
  enableValidation?: boolean;
  showAdditionalForms?: boolean;
}

const TripDetails: React.FC<TripDetailsProps> = ({
  formData,
  onFormChange,
  enableValidation = true,
  showAdditionalForms = false,
}) => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Validate entire form when data changes
  useEffect(() => {
    if (enableValidation) {
      const result = validationUtils.validateFormData(formData);
      setValidationErrors(result.fieldErrors);
      setIsFormValid(result.isValid);
    }
  }, [formData, enableValidation]);

  const handleFormUpdate = useCallback(
    (updates: Partial<FormData>) => {
      const newFormData = { ...formData, ...updates };
      onFormChange(newFormData);
    },
    [formData, onFormChange]
  );

  const handleValidation = useCallback((field: string, _isValid: boolean, errors?: string[]) => {
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      if (errors && errors.length > 0 && errors[0]) {
        newErrors[field] = errors[0];
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
  }, []);

  const baseProps = {
    formData,
    onFormChange: handleFormUpdate,
    ...(enableValidation && {
      validationErrors,
      onValidation: handleValidation,
    }),
  };

  return (
    <div className="space-y-6">
      {/* Validation Summary */}
      {enableValidation && Object.keys(validationErrors).length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-bold text-red-800 font-raleway">
                Please fix the following issues:
              </h3>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside font-raleway">
                {Object.entries(validationErrors).map(([field, error]) =>
                  error ? (
                    <li key={field}>
                      <span className="capitalize">{field.replace(/([A-Z])/g, ' $1')}</span>:{' '}
                      {error}
                    </li>
                  ) : null
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Form validation success indicator */}
      {enableValidation && isFormValid && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-green-400">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-bold text-green-800 font-raleway">
                All trip details are valid and ready!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Location Box */}
      <LocationForm {...baseProps} />

      {/* Dates and Travelers Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DatesForm {...baseProps} />
        <TravelersForm {...baseProps} />
      </div>

      {/* Budget Box */}
      <BudgetForm {...baseProps} />

      {/* Additional Forms - Can be conditionally rendered */}
      {showAdditionalForms && (
        <>
          {/* Travel Group Selector */}
          <TravelGroupSelector {...baseProps} />

          {/* Travel Interests */}
          <TravelInterests {...baseProps} />

          {/* Itinerary Inclusions */}
          <ItineraryInclusions {...baseProps} />
        </>
      )}
    </div>
  );
};

export default TripDetails;

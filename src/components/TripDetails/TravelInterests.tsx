// src/components/TripDetails/TravelInterests.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { BaseFormProps, TRAVEL_INTERESTS } from './types';

const TravelInterests: React.FC<BaseFormProps> = ({
  formData,
  onFormChange,
  validationErrors,
  onValidation,
}) => {
  const [localOtherText, setLocalOtherText] = useState(formData.customInterestsText || '');

  // Extract interest selections from formData
  const selectedInterests = formData.selectedInterests || [];

  // Derive visibility: show when 'other' is selected
  const showOtherInput = selectedInterests.includes('other');

  useEffect(() => {
    setLocalOtherText(formData.customInterestsText || '');
  }, [formData.customInterestsText]);

  const validateInterests = useCallback(() => {
    if (onValidation) {
      // Basic validation - at least one interest should be selected
      const isValid = selectedInterests.length > 0;
      const errors = isValid ? [] : ['Please select at least one travel interest'];
      onValidation('selectedInterests', isValid, errors);
    }
  }, [selectedInterests, onValidation]);

  const toggleInterest = useCallback(
    (interestId: string) => {
      let newSelection: string[];

      if (interestId === 'other') {
        const willShow = !selectedInterests.includes('other');

        if (willShow) {
          newSelection = [...selectedInterests, 'other'];
        } else {
          // Removing other: remove from selection & clear text
          newSelection = selectedInterests.filter((id) => id !== 'other');
          setLocalOtherText('');
          onFormChange({
            selectedInterests: newSelection,
            customInterestsText: '',
          });
          // Validate after change
          setTimeout(validateInterests, 100);
          return;
        }
      } else {
        newSelection = selectedInterests.includes(interestId)
          ? selectedInterests.filter((id) => id !== interestId)
          : [...selectedInterests, interestId];
      }

      onFormChange({ selectedInterests: newSelection });

      // Validate after change
      setTimeout(validateInterests, 100);
    },
    [selectedInterests, onFormChange, validateInterests]
  );

  const handleOtherTextChange = useCallback(
    (text: string) => {
      setLocalOtherText(text);
      onFormChange({ customInterestsText: text });
    },
    [onFormChange]
  );

  const hasError = validationErrors?.['selectedInterests'];

  return (
    <div className="bg-form-box rounded-[36px] p-6 border-3 border-gray-200">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-primary uppercase tracking-wide mb-1 font-raleway">
          TRAVEL INTERESTS
        </h3>
        <p className="text-primary font-bold font-raleway text-xs">
          Select all that apply to this trip
        </p>
        {hasError && (
          <p
            className="text-sm text-red-600 font-bold font-raleway mt-2 flex items-center"
            role="alert"
          >
            <span className="mr-1">⚠️</span>
            {hasError}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {TRAVEL_INTERESTS.map((option) => {
          const isSelected = selectedInterests.includes(option.id);

          return (
            <button
              key={option.id}
              onClick={() => toggleInterest(option.id)}
              className={`
                h-24 p-3 rounded-[10px] border-3 transition-all duration-200 hover:scale-105 hover:shadow-lg flex flex-col items-center justify-center space-y-2
                ${
                  isSelected
                    ? 'border-primary bg-primary text-white shadow-md'
                    : hasError
                    ? 'border-red-500 bg-[#ece8de] hover:border-primary hover:shadow-md text-primary'
                    : 'border-primary bg-[#ece8de] hover:border-primary hover:shadow-md text-primary'
                }
              `}
              aria-label={`Toggle ${option.label} interest`}
              aria-pressed={isSelected}
            >
              <span className="text-xl">{option.emoji}</span>
              <span
                className={`text-xs font-bold text-center leading-tight font-raleway whitespace-pre-line ${
                  isSelected ? 'text-white' : hasError ? 'text-red-600' : 'text-primary'
                }`}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected count display */}
      {selectedInterests.length > 0 && (
        <div className="bg-[#ece8de] border-3 border-primary rounded-[10px] p-3 text-center mt-4">
          <span className="text-primary font-bold font-raleway text-sm">
            Selected: {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Other Input Field */}
      {showOtherInput && (
        <div className="bg-primary/10 rounded-[10px] p-4 border-3 border-primary/20 mt-4">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-xl">✨</span>
            <label className="block text-primary font-bold text-base font-raleway">Other</label>
          </div>
          <label className="block text-primary font-bold mb-3 text-sm font-raleway">
            What other interests should be part of your itinerary?
          </label>
          <textarea
            value={localOtherText}
            onChange={(e) => handleOtherTextChange(e.target.value)}
            placeholder="Include anything that will help us customize your itinerary"
            className="w-full px-4 py-3 border-3 border-primary rounded-[10px] focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-primary bg-[#ece8de] resize-none font-raleway font-bold text-sm"
            rows={3}
            aria-label="Describe other interests"
          />
        </div>
      )}

      {/* Success indicator */}
      {selectedInterests.length > 0 && !hasError && (
        <div className="mt-3 text-center">
          <span className="text-sm text-green-600 font-bold font-raleway flex items-center justify-center">
            <span className="mr-1">✓</span>
            Travel interests look good!
          </span>
        </div>
      )}
    </div>
  );
};

export default TravelInterests;

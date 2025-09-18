// src/components/TripDetails/TravelGroupSelector.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { BaseFormProps, TRAVEL_GROUPS } from './types';

const TravelGroupSelector: React.FC<BaseFormProps> = ({
  formData,
  onFormChange,
  validationErrors,
  onValidation,
}) => {
  const [localOtherText, setLocalOtherText] = useState(formData.customGroupText || '');
  const [showOtherInput, setShowOtherInput] = useState(false);

  // Extract group selections from formData
  const selectedGroups = formData.selectedGroups || [];

  useEffect(() => {
    setLocalOtherText(formData.customGroupText || '');
    setShowOtherInput(selectedGroups.includes('other'));
  }, [formData.customGroupText, selectedGroups]);

  const validateGroups = useCallback(() => {
    if (onValidation) {
      // Basic validation - at least one group should be selected
      const isValid = selectedGroups.length > 0;
      const errors = isValid ? [] : ['Please select at least one travel group'];
      onValidation('selectedGroups', isValid, errors);
    }
  }, [selectedGroups, onValidation]);

  const toggleGroup = useCallback(
    (groupId: string) => {
      let newSelection: string[];

      if (groupId === 'other') {
        const willShow = !showOtherInput;
        setShowOtherInput(willShow);

        if (willShow) {
          if (!selectedGroups.includes('other')) {
            newSelection = [...selectedGroups, 'other'];
          } else {
            newSelection = selectedGroups;
          }
        } else {
          newSelection = selectedGroups.filter((id) => id !== 'other');
          setLocalOtherText('');
          onFormChange({
            selectedGroups: newSelection,
            customGroupText: '',
          });
          // Validate after change
          setTimeout(validateGroups, 100);
          return;
        }
      } else {
        newSelection = selectedGroups.includes(groupId)
          ? selectedGroups.filter((id) => id !== groupId)
          : [...selectedGroups, groupId];
      }

      onFormChange({ selectedGroups: newSelection });

      // Validate after change
      setTimeout(validateGroups, 100);
    },
    [selectedGroups, showOtherInput, onFormChange, validateGroups]
  );

  const handleOtherTextChange = useCallback(
    (text: string) => {
      setLocalOtherText(text);
      onFormChange({ customGroupText: text });
    },
    [onFormChange]
  );

  const hasError = validationErrors?.['selectedGroups'];

  return (
    <div className="bg-form-box rounded-[36px] p-6 border-3 border-gray-200">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-primary uppercase tracking-wide mb-1 font-raleway">
          TRAVEL GROUP
        </h3>
        <p className="text-primary font-bold font-raleway text-xs">Select all that apply</p>
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {TRAVEL_GROUPS.map((option) => {
          const isSelected = selectedGroups.includes(option.id);

          return (
            <button
              key={option.id}
              onClick={() => toggleGroup(option.id)}
              className={`
                h-24 p-4 rounded-[10px] border-3 transition-all duration-200 hover:scale-105 flex flex-col items-center justify-center space-y-2
                ${
                  isSelected
                    ? 'border-primary bg-primary text-white shadow-md'
                    : hasError
                    ? 'border-red-500 bg-[#ece8de] hover:border-primary hover:shadow-md text-primary'
                    : 'border-primary bg-[#ece8de] hover:border-primary hover:shadow-md text-primary'
                }
              `}
              aria-label={`Toggle ${option.label} travel group`}
              aria-pressed={isSelected}
            >
              <span className="text-2xl">{option.emoji}</span>
              <span
                className={`text-base font-bold text-center leading-tight font-raleway whitespace-pre-line ${
                  isSelected ? 'text-white' : hasError ? 'text-red-600' : 'text-primary'
                }`}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* No counter display - REMOVED */}

      {/* Other Input Field */}
      {showOtherInput && (
        <div className="bg-primary/10 rounded-[10px] p-4 border-3 border-primary/20 mt-4">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-xl">✨</span>
            <label className="block text-primary font-bold text-base font-raleway">Other</label>
          </div>
          <label className="block text-primary font-bold mb-3 text-sm font-raleway">
            Tell us more about your travel group
          </label>
          <textarea
            value={localOtherText}
            onChange={(e) => handleOtherTextChange(e.target.value)}
            placeholder="Example: Group dynamics, how you know each other, why you're traveling together, etc."
            className="w-full px-4 py-3 border-3 border-primary rounded-[10px] focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-primary bg-[#ece8de] resize-none font-raleway font-bold"
            rows={3}
            aria-label="Describe your travel group"
          />
        </div>
      )}

      {/* Success indicator */}
      {selectedGroups.length > 0 && !hasError && (
        <div className="mt-3 text-center">
          <span className="text-sm text-green-600 font-bold font-raleway flex items-center justify-center">
            <span className="mr-1">✓</span>
            Travel group selections look good!
          </span>
        </div>
      )}
    </div>
  );
};

export default TravelGroupSelector;

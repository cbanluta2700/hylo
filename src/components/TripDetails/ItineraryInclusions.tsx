// src/components/TripDetails/ItineraryInclusions.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { BaseFormProps, ITINERARY_INCLUSIONS } from './types';

const ItineraryInclusions: React.FC<BaseFormProps> = ({
  formData,
  onFormChange,
  validationErrors,
  onValidation,
}) => {
  const [localOtherText, setLocalOtherText] = useState(formData.customInclusionsText || '');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // Extract inclusion selections from formData
  const selectedInclusions = formData.selectedInclusions || [];
  const inclusionPreferences = formData.inclusionPreferences || {};

  // Derive visibility: show when 'other' is selected
  const showOtherInput = selectedInclusions.includes('other');

  useEffect(() => {
    setLocalOtherText(formData.customInclusionsText || '');
  }, [formData.customInclusionsText]);

  const validateInclusions = useCallback(() => {
    if (onValidation) {
      // Basic validation - at least one inclusion should be selected
      const isValid = selectedInclusions.length > 0;
      const errors = isValid ? [] : ['Please select at least one itinerary inclusion'];
      onValidation('selectedInclusions', isValid, errors);
    }
  }, [selectedInclusions, onValidation]);

  const toggleSection = useCallback((inclusionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(inclusionId) ? prev.filter((id) => id !== inclusionId) : [...prev, inclusionId]
    );
  }, []);

  const toggleInclusion = useCallback(
    (inclusionId: string) => {
      let newSelection: string[];

      if (inclusionId === 'other') {
        const willShow = !selectedInclusions.includes('other');

        if (willShow) {
          newSelection = [...selectedInclusions, 'other'];
        } else {
          // Removing other: remove from selection & clear text
          newSelection = selectedInclusions.filter((id) => id !== 'other');
          setLocalOtherText('');
          onFormChange({
            selectedInclusions: newSelection,
            customInclusionsText: '',
          });
          // Validate after change
          setTimeout(validateInclusions, 100);
          return;
        }
      } else {
        const isCurrentlySelected = selectedInclusions.includes(inclusionId);

        if (isCurrentlySelected) {
          newSelection = selectedInclusions.filter((id) => id !== inclusionId);
          // Clear preferences for this inclusion when deselected
          const newPreferences = { ...inclusionPreferences };
          delete newPreferences[inclusionId];
          onFormChange({
            selectedInclusions: newSelection,
            inclusionPreferences: newPreferences,
          });
        } else {
          newSelection = [...selectedInclusions, inclusionId];
          onFormChange({ selectedInclusions: newSelection });
        }

        // Validate after change
        setTimeout(validateInclusions, 100);
        return;
      }

      onFormChange({ selectedInclusions: newSelection });

      // Validate after change
      setTimeout(validateInclusions, 100);
    },
    [selectedInclusions, inclusionPreferences, onFormChange, validateInclusions]
  );

  const updatePreference = useCallback(
    (inclusionId: string, key: string, value: any) => {
      const newPreferences = {
        ...inclusionPreferences,
        [inclusionId]: {
          ...(inclusionPreferences[inclusionId] || {}),
          [key]: value,
        },
      };
      onFormChange({ inclusionPreferences: newPreferences });
    },
    [inclusionPreferences, onFormChange]
  );

  const handleOtherTextChange = useCallback(
    (text: string) => {
      setLocalOtherText(text);
      onFormChange({ customInclusionsText: text });
    },
    [onFormChange]
  );

  const renderBasicPreferences = (inclusionId: string) => {
    if (!selectedInclusions.includes(inclusionId)) return null;

    const isExpanded = expandedSections.includes(inclusionId);
    const option = ITINERARY_INCLUSIONS.find((opt) => opt.id === inclusionId);

    if (!option || inclusionId === 'other') return null;

    return (
      <div className="mt-3 border-3 border-primary rounded-[10px] overflow-hidden">
        <button
          onClick={() => toggleSection(inclusionId)}
          className="w-full px-4 py-3 bg-[#ece8de] flex items-center justify-between hover:bg-primary/10 transition-colors duration-200"
          aria-expanded={isExpanded}
          aria-controls={`${inclusionId}-preferences`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-xl">{option.emoji}</span>
            <span className="font-bold text-primary font-raleway text-base">
              {option.label} Preferences
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-primary" />
          ) : (
            <ChevronDown className="h-5 w-5 text-primary" />
          )}
        </button>

        {isExpanded && (
          <div id={`${inclusionId}-preferences`} className="p-4 bg-white">
            <div className="space-y-3">
              <div>
                <label className="block text-primary font-bold mb-2 font-raleway text-sm">
                  Special requests or preferences
                </label>
                <textarea
                  value={inclusionPreferences[inclusionId]?.notes || ''}
                  onChange={(e) => updatePreference(inclusionId, 'notes', e.target.value)}
                  placeholder={`Any specific preferences for ${option.label.toLowerCase()}...`}
                  className="w-full px-3 py-2 border-3 border-primary rounded-[10px] focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-primary bg-[#ece8de] resize-none font-raleway font-bold text-sm"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-primary font-bold mb-2 font-raleway text-sm">
                  Budget level
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Budget $', 'Mid-range $$', 'Luxury $$$', 'Ultra-luxury $$$$'].map((level) => (
                    <button
                      key={level}
                      onClick={() => updatePreference(inclusionId, 'budgetLevel', level)}
                      className={`px-3 py-1 rounded-[10px] border-2 transition-all duration-200 font-bold font-raleway text-xs ${
                        inclusionPreferences[inclusionId]?.budgetLevel === level
                          ? 'border-primary bg-primary text-white'
                          : 'border-primary bg-[#ece8de] text-primary hover:bg-primary hover:text-white'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const hasError = validationErrors?.['selectedInclusions'];

  return (
    <div className="bg-form-box rounded-[36px] p-6 border-3 border-gray-200">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-primary uppercase tracking-wide mb-1 font-raleway">
          ITINERARY INCLUSIONS
        </h3>
        <p className="text-primary font-bold font-raleway text-xs">
          What should be included in your itinerary?
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {ITINERARY_INCLUSIONS.map((option) => {
          const isSelected = selectedInclusions.includes(option.id);

          return (
            <button
              key={option.id}
              onClick={() => toggleInclusion(option.id)}
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
              aria-label={`Toggle ${option.label} inclusion`}
              aria-pressed={isSelected}
            >
              <span className="text-xl">{option.emoji}</span>
              <span
                className={`text-xs font-bold text-center leading-tight font-raleway ${
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

      {/* Preferences for selected inclusions */}
      {selectedInclusions.filter((id) => id !== 'other').length > 0 && (
        <div className="mt-4 space-y-3">
          {selectedInclusions
            .filter((id) => id !== 'other')
            .map((inclusionId) => renderBasicPreferences(inclusionId))}
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
            What else should we include in your itinerary?
          </label>
          <textarea
            value={localOtherText}
            onChange={(e) => handleOtherTextChange(e.target.value)}
            placeholder="Describe any other inclusions or special requirements..."
            className="w-full px-4 py-3 border-3 border-primary rounded-[10px] focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-primary bg-[#ece8de] resize-none font-raleway font-bold text-sm"
            rows={3}
            aria-label="Describe other inclusions"
          />
        </div>
      )}

      {/* Success indicator */}
      {selectedInclusions.length > 0 && !hasError && (
        <div className="mt-3 text-center">
          <span className="text-sm text-green-600 font-bold font-raleway flex items-center justify-center">
            <span className="mr-1">✓</span>
            Itinerary inclusions look good!
          </span>
        </div>
      )}
    </div>
  );
};

export default ItineraryInclusions;

// src/components/TripDetails/index.tsx
import React, { useCallback } from 'react';
import LocationForm from './LocationForm';
import DatesForm from './DatesForm';
import TravelersForm from './TravelersForm';
import BudgetForm from './BudgetForm';
import TravelGroupSelector from './TravelGroupSelector';
import TravelInterests from './TravelInterests';
import ItineraryInclusions from './ItineraryInclusions';
import { FormData } from './types';

interface TripDetailsProps {
  formData: FormData;
  onFormChange: (data: FormData) => void;
  showAdditionalForms?: boolean;
}

const TripDetails: React.FC<TripDetailsProps> = ({
  formData,
  onFormChange,
  showAdditionalForms = false,
}) => {
  const handleFormUpdate = useCallback(
    (updates: Partial<FormData>) => {
      onFormChange({ ...formData, ...updates });
    },
    [formData, onFormChange]
  );

  // Simple props without validation
  const baseProps = {
    formData,
    onFormChange: handleFormUpdate,
  };

  return (
    <div className="space-y-6">
      {/* No validation summary - REMOVED */}

      {/* Location Box */}
      <LocationForm {...baseProps} />

      {/* Dates and Travelers Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DatesForm {...baseProps} />
        <TravelersForm {...baseProps} />
      </div>

      {/* Budget Box */}
      <BudgetForm {...baseProps} />

      {/* Additional Forms */}
      {showAdditionalForms && (
        <>
          <TravelGroupSelector {...baseProps} />
          <TravelInterests {...baseProps} />
          <ItineraryInclusions {...baseProps} />
        </>
      )}
    </div>
  );
};

export default TripDetails;

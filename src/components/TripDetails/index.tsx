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
  // 🔥 HARD-CODED CONSOLE LOGS FOR VERCEL DEPLOYMENT
  console.log('🔥 VERCEL AUDIT: TripDetails rendered with formData:', formData);

  const handleFormUpdate = useCallback(
    (updates: Partial<FormData>) => {
      console.log('🔥 VERCEL AUDIT: TripDetails updates:', updates);
      const newData = { ...formData, ...updates };
      console.log('🔥 VERCEL AUDIT: TripDetails new formData:', newData);
      onFormChange(newData);
    },
    [formData, onFormChange]
  );

  const baseProps = {
    formData,
    onFormChange: handleFormUpdate,
  };

  return (
    <div className="space-y-6">
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

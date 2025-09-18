// src/components/TripDetails/LocationForm.tsx
import React from 'react';
import { BaseFormProps } from './types';

const LocationForm: React.FC<BaseFormProps> = ({ formData, onFormChange }) => {
  const handleLocationChange = (value: string) => {
    onFormChange({ location: value });
  };

  return (
    <div className="bg-form-box rounded-[36px] p-6 border-3 border-gray-200">
      <h3 className="text-xl font-bold text-primary uppercase tracking-wide mb-4 font-raleway">
        LOCATION(S)
      </h3>
      <input
        type="text"
        placeholder='Example: "New York", "Thailand", "Spain and Portugal"'
        value={formData.location || ''}
        onChange={(e) => handleLocationChange(e.target.value)}
        className="w-full px-4 py-3 border-3 rounded-[10px] focus:ring-2 focus:border-primary transition-all duration-200 bg-white placeholder-gray-500 font-bold font-raleway text-base border-primary"
        aria-label="Trip location"
      />
      {/* No validation messages */}
    </div>
  );
};

export default LocationForm;

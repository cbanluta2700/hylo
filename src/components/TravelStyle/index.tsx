import React from 'react';
import TravelExperience from './TravelExperience';
import SampleDays from './SampleDays';
import DinnerChoice from './DinnerChoice';
import TripNickname from './TripNickname';
import { TravelStyleFormData } from './types';

interface TravelStyleProps {
  formData: TravelStyleFormData;
  onFormChange: (data: TravelStyleFormData) => void;
}

const TravelStyle: React.FC<TravelStyleProps> = ({ formData, onFormChange }) => {
  const handleFormUpdate = (updates: Partial<TravelStyleFormData>) => {
    onFormChange({ ...formData, ...updates });
  };

  const baseProps = {
    formData,
    onFormChange: handleFormUpdate,
  };

  return (
    <div className="space-y-6">
      {/* Travel Experience */}
      <div className="bg-form-box rounded-[36px] p-6 border-3 border-gray-200">
        <h3 className="text-xl font-bold text-primary uppercase tracking-wide mb-4 font-raleway">
          TRAVEL EXPERIENCE
        </h3>
        <p className="text-primary mb-4 font-raleway text-sm">Select all that apply</p>
        <TravelExperience {...baseProps} />
      </div>

      {/* Trip Vibe - Temporarily Disabled */}
      <div className="bg-form-box rounded-[36px] p-6 border-3 border-gray-200">
        <h3 className="text-xl font-bold text-primary uppercase tracking-wide mb-4 font-raleway">
          TRIP VIBE
        </h3>
        <p className="text-primary mb-4 font-raleway text-sm">Coming soon...</p>
      </div>

      {/* Sample Days */}
      <div className="bg-form-box rounded-[36px] p-6 border-3 border-gray-200">
        <h3 className="text-xl font-bold text-primary uppercase tracking-wide mb-4 font-raleway">
          SAMPLE DAY ACTIVITIES
        </h3>
        <SampleDays {...baseProps} />
      </div>

      {/* Dinner Choice */}
      <div className="bg-form-box rounded-[36px] p-6 border-3 border-gray-200">
        <h3 className="text-xl font-bold text-primary uppercase tracking-wide mb-4 font-raleway">
          DINING PREFERENCES
        </h3>
        <DinnerChoice {...baseProps} />
      </div>

      {/* Trip Nickname */}
      <div className="bg-form-box rounded-[36px] p-6 border-3 border-gray-200">
        <h3 className="text-xl font-bold text-primary uppercase tracking-wide mb-4 font-raleway">
          TRIP NICKNAME
        </h3>
        <TripNickname {...baseProps} />
      </div>
    </div>
  );
};

export default TravelStyle;

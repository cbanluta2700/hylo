import React from 'react';
import TravelExperience from './TravelStyle/TravelExperience';
import TripVibe from './TravelStyle/TripVibe';
import SampleDays from './TravelStyle/SampleDays';
import DinnerChoice from './TravelStyle/DinnerChoice';
import TripNickname from './TravelStyle/TripNickname';

interface TravelStyleGroupProps {
  onFormChange: (data: any) => void;
  formData?: any;
}

export const TravelStyleGroup: React.FC<TravelStyleGroupProps> = ({ onFormChange, formData }) => {
  const handleExperienceChange = (experience: string[]) => {
    onFormChange?.({
      ...formData,
      travelStyleAnswers: {
        ...formData?.travelStyleAnswers,
        experience,
      },
    });
  };

  const handleVibeChange = (vibes: string[]) => {
    onFormChange?.({
      ...formData,
      travelStyleAnswers: {
        ...formData?.travelStyleAnswers,
        vibes,
      },
    });
  };

  const handleVibeOtherChange = (vibesOther: string) => {
    onFormChange?.({
      ...formData,
      travelStyleAnswers: {
        ...formData?.travelStyleAnswers,
        vibesOther,
      },
    });
  };

  const handleSampleDaysChange = (sampleDays: string[]) => {
    onFormChange?.({
      ...formData,
      travelStyleAnswers: {
        ...formData?.travelStyleAnswers,
        sampleDays,
      },
    });
  };

  const handleDinnerChoiceChange = (dinnerChoices: string[]) => {
    onFormChange?.({
      ...formData,
      travelStyleAnswers: {
        ...formData?.travelStyleAnswers,
        dinnerChoices,
      },
    });
  };

  const handleTripNicknameChange = (tripNickname: string) => {
    onFormChange?.({
      ...formData,
      travelStyleAnswers: {
        ...formData?.travelStyleAnswers,
        tripNickname,
      },
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-primary font-raleway mb-2">
          Travel Style Preferences
        </h2>
        <p className="text-gray-600">Let's customize your trip experience</p>
      </div>

      <TravelExperience
        selectedExperience={formData?.travelStyleAnswers?.experience || []}
        onSelectionChange={handleExperienceChange}
      />

      <TripVibe
        selectedVibes={formData?.travelStyleAnswers?.vibes || []}
        onSelectionChange={handleVibeChange}
        otherText={formData?.travelStyleAnswers?.vibesOther || ''}
        onOtherTextChange={handleVibeOtherChange}
      />

      <SampleDays
        formData={formData}
        onFormChange={onFormChange}
      />

      <DinnerChoice
        formData={formData}
        onFormChange={onFormChange}
      />

      <TripNickname
        formData={formData}
        onFormChange={onFormChange}
      />
    </div>
  );
};

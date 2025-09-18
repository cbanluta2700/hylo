import React from 'react';
import { BaseStyleFormProps, EXPERIENCE_OPTIONS } from './types';

const TravelExperience: React.FC<BaseStyleFormProps> = ({ formData, onFormChange }) => {
  const selectedExperience = formData.experience || [];

  const toggleExperience = (id: string) => {
    const newSelection = selectedExperience.includes(id)
      ? selectedExperience.filter((e) => e !== id)
      : [...selectedExperience, id];
    onFormChange({ experience: newSelection });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {EXPERIENCE_OPTIONS.map((option) => {
        const isSelected = selectedExperience.includes(option.id);
        return (
          <button
            key={option.id}
            onClick={() => toggleExperience(option.id)}
            className={`
              p-4 rounded-[10px] border-2 text-left transition-all duration-200
              ${
                isSelected
                  ? 'border-primary bg-primary text-white'
                  : 'border-primary bg-white text-primary hover:bg-primary/10'
              }
            `}
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{option.emoji}</span>
              <span className="font-bold">{option.text}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default TravelExperience;

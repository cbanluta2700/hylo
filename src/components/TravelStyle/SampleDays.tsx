import React from 'react';
import { BaseStyleFormProps, SAMPLE_DAYS } from './types';

const SampleDays: React.FC<BaseStyleFormProps> = ({ formData, onFormChange }) => {
  const selectedDays = formData.sampleDays || [];

  const toggleDay = (day: string) => {
    const newSelection = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    onFormChange({ sampleDays: newSelection });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-bold text-primary font-raleway">
        Select activities that sound appealing for a sample day:
      </h4>
      <div className="space-y-3">
        {SAMPLE_DAYS.map((day, index) => {
          const isSelected = selectedDays.includes(day);
          return (
            <button
              key={index}
              onClick={() => toggleDay(day)}
              className={`
                w-full p-4 rounded-[10px] border-2 text-left transition-all duration-200
                ${
                  isSelected
                    ? 'border-primary bg-primary text-white'
                    : 'border-primary bg-[#ece8de] hover:bg-primary/10 text-primary'
                }
              `}
            >
              <span className="font-bold">{day}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SampleDays;

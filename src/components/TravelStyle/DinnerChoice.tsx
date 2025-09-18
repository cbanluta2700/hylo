import React from 'react';
import { BaseStyleFormProps, DINNER_OPTIONS } from './types';

const DinnerChoice: React.FC<BaseStyleFormProps> = ({ formData, onFormChange }) => {
  const selectedChoices = formData.dinnerChoices || [];

  const toggleChoice = (choice: string) => {
    const newSelection = selectedChoices.includes(choice)
      ? selectedChoices.filter((c) => c !== choice)
      : [...selectedChoices, choice];
    onFormChange({ dinnerChoices: newSelection });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-bold text-primary font-raleway">What sounds good for dinner?</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DINNER_OPTIONS.map((option, index) => {
          const isSelected = selectedChoices.includes(option);
          return (
            <button
              key={index}
              onClick={() => toggleChoice(option)}
              className={`
                p-4 rounded-[10px] border-2 text-left transition-all duration-200
                ${
                  isSelected
                    ? 'border-primary bg-primary text-white'
                    : 'border-primary bg-[#ece8de] hover:bg-primary/10 text-primary'
                }
              `}
            >
              <span className="font-bold">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DinnerChoice;

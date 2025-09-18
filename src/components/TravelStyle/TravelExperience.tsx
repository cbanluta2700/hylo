import React from 'react';

interface TravelExperienceProps {
  selectedExperience: string[];
  onSelectionChange: (experience: string[]) => void;
}

const TravelExperience: React.FC<TravelExperienceProps> = ({
  selectedExperience,
  onSelectionChange,
}) => {
  const experienceOptions = [
    { text: "Haven't traveled much", emoji: '🌱' },
    { text: 'Some in-country travel', emoji: '🚘' },
    { text: 'Travel to another country', emoji: '🛩️' },
    { text: 'Travel to multiple countries', emoji: '🌏' },
    { text: 'Avid traveler(s) to a variety of countries', emoji: '🧳' },
    { text: 'Comfortable in new places', emoji: '🧭' },
    { text: 'Nervous or rusty traveler(s)', emoji: '😟' },
    { text: 'Varying levels of experience', emoji: '💺' },
  ];

  const toggleExperience = (experience: string) => {
    const newSelection = selectedExperience.includes(experience)
      ? selectedExperience.filter((item) => item !== experience)
      : [...selectedExperience, experience];
    onSelectionChange(newSelection);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {experienceOptions.map((option) => {
          const isSelected = selectedExperience.includes(option.text);

          return (
            <button
              key={option.text}
              onClick={() => toggleExperience(option.text)}
              className={`
                p-4 rounded-[10px] border-2 text-left transition-all duration-200 hover:scale-105 flex items-center space-x-3
                ${
                  isSelected
                    ? 'border-primary bg-primary text-white shadow-md'
                    : 'border-primary bg-[#ece8de] hover:border-primary hover:shadow-md text-primary'
                }
              `}
            >
              <span className="text-xl">{option.emoji}</span>
              <span
                className={`font-bold font-raleway text-sm ${
                  isSelected ? 'text-white' : 'text-primary'
                }`}
              >
                {option.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TravelExperience;

import React from 'react';

interface DinnerChoiceProps {
  selectedChoice: string[];
  onSelectionChange: (choices: string[]) => void;
}

const DinnerChoice: React.FC<DinnerChoiceProps> = ({
  selectedChoice,
  onSelectionChange,
}) => {
  const dinnerOptions = [
    {
      text: 'We have a reservation at a Michelin-starred restaurant',
      emoji: '⭐️',
    },
    { text: "Let's sample some local street food vendors", emoji: '🍖' },
    { text: "We'll just keep it easy and eat at the hotel", emoji: '🏩' },
    { text: "Let's wander and see where we end up", emoji: '🥟' },
    { text: "Whatever works—I'm not a big food person", emoji: '🤷‍♀️' },
    {
      text: 'Find a food truck roundup so everyone can get what they like',
      emoji: '🌮',
    },
    {
      text: "See what the McDonald's menu is like in this country",
      emoji: '🍟',
    },
    { text: 'Grab some groceries and cook our own dinner', emoji: '🥘' },
  ];

  const toggleChoice = (choice: string) => {
    const newSelection = selectedChoice.includes(choice)
      ? selectedChoice.filter((item) => item !== choice)
      : [...selectedChoice, choice];
    onSelectionChange(newSelection);
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-xl font-bold text-primary uppercase tracking-wide mb-1 font-raleway">
          You just landed and are starving.
          <br />
          Where are you having dinner?
        </h4>
        <p className="text-primary font-bold font-raleway text-xs">
          Select all that apply for this group
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {dinnerOptions.map((option) => {
          const isSelected = selectedChoice.includes(option.text);

          return (
            <button
              key={option.text}
              onClick={() => toggleChoice(option.text)}
              className={`
                p-4 rounded-[10px] border-2 text-left transition-all duration-200 hover:scale-105 flex items-center space-x-3
                ${
                  isSelected
                    ? 'border-primary bg-primary text-white shadow-md'
                    : 'border-primary bg-[#ece8de] hover:border-primary hover:shadow-md text-primary'
                }
              `}
            >
              <span className="text-xl flex-shrink-0">{option.emoji}</span>
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

export default DinnerChoice;

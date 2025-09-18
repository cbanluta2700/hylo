import React from 'react';

interface SampleDaysProps {
  selectedDays: string[];
  onSelectionChange: (days: string[]) => void;
}

const SampleDays: React.FC<SampleDaysProps> = ({
  selectedDays,
  onSelectionChange,
}) => {
  const sampleDayOptions = [
    {
      text: 'Get picked up for a guided tour full of landmarks, history, and meeting fellow travelers',
      emoji: '🚐',
    },
    {
      text: 'Wander around at our our own pace to eat, shop, take pictures, and see what else is going on',
      emoji: '📸',
    },
    {
      text: "After a leisurely breakfast, we're headed to the pool or beach to relax with a good book",
      emoji: '👙',
    },
    {
      text: "We're going ziplining in the morning and taking a cooking class in the afternoon",
      emoji: '🧑‍🍳',
    },
    {
      text: 'We want to see how the locals live and be immersed in the culture',
      emoji: '🏟️',
    },
    {
      text: 'We want to be as active as possible so we have to squeeze in a hike',
      emoji: '🥾',
    },
    {
      text: 'Visit a beautiful winery, distillery, or cocktail tasting',
      emoji: '🍷',
    },
    { text: 'Take it easy during the day, party all night', emoji: '🥳' },
  ];

  const toggleDay = (day: string) => {
    const newSelection = selectedDays.includes(day)
      ? selectedDays.filter((item) => item !== day)
      : [...selectedDays, day];
    onSelectionChange(newSelection);
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-xl font-bold text-primary uppercase tracking-wide mb-1 font-raleway">
          Which of these sample travel days are you drawn to?
        </h4>
        <p className="text-primary font-bold font-raleway text-xs">
          Select all that apply for this group
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {sampleDayOptions.map((option) => {
          const isSelected = selectedDays.includes(option.text);

          return (
            <button
              key={option.text}
              onClick={() => toggleDay(option.text)}
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

export default SampleDays;

import React from 'react';

interface TripVibeProps {
  selectedVibes: string[];
  onSelectionChange: (vibes: string[]) => void;
  /** Controlled custom vibe description */
  otherText: string;
  /** Handler for custom vibe text changes */
  onOtherTextChange: (value: string) => void;
  /** Optional externally supplied visibility for the other text box */
  showOther?: boolean;
  /** Callback when user toggles Other */
  onToggleOther?: (visible: boolean) => void;
}

const TripVibe: React.FC<TripVibeProps> = ({
  selectedVibes,
  onSelectionChange,
  otherText,
  onOtherTextChange,
  showOther,
  onToggleOther,
}) => {
  const derivedShowOther =
    typeof showOther === 'boolean' ? showOther : selectedVibes.includes('other');

  const vibeOptions = [
    { id: 'up-for-anything', text: 'Up for anything', emoji: '🎊' },
    { id: 'relax-recharge', text: 'Relax & recharge', emoji: '🧘' },
    { id: 'be-in-the-action', text: 'Be in the action', emoji: '🎬' },
    { id: 'go-with-the-flow', text: 'Go with the flow', emoji: '🕺' },
    { id: 'wander-get-lost', text: 'Wander & get lost', emoji: '🧭' },
    { id: 'follow-detailed-plan', text: 'Follow a detailed plan', emoji: '✅' },
    { id: 'maximize-time', text: 'Go-go-go to maximize time', emoji: '🏃‍♀️' },
    { id: 'food-is-half-fun', text: 'Food is half the fun', emoji: '🍱' },
    { id: 'need-variety', text: 'Need a lot of variety', emoji: '📸' },
    { id: 'immersed-local-culture', text: 'Immersed in local culture', emoji: '💃' },
    { id: 'classic-tourist', text: 'Classic tourist spots & experiences', emoji: '🗽' },
    { id: 'unique-offbeat', text: 'Unique or offbeat experiences', emoji: '🔮' },
    { id: 'learn-grow', text: 'Learn and grow', emoji: '🧠' },
    { id: 'reconnect-group', text: 'Reconnect as a group', emoji: '⛓️' },
    { id: 'escape-everyday', text: 'An escape from everyday life', emoji: '🍹' },
    { id: 'other', text: 'Other', emoji: '✨' },
  ];

  const toggleVibe = (id: string) => {
    if (id === 'other') {
      const willShow = !derivedShowOther;
      if (willShow) {
        if (!selectedVibes.includes('other')) {
          onSelectionChange([...selectedVibes, 'other']);
        }
      } else {
        onSelectionChange(selectedVibes.filter((v) => v !== 'other'));
        onOtherTextChange('');
      }
      onToggleOther?.(willShow);
      return;
    }
    const newSelection = selectedVibes.includes(id)
      ? selectedVibes.filter((v) => v !== id)
      : [...selectedVibes, id];
    onSelectionChange(newSelection);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {vibeOptions.map((option) => {
          const isSelected = selectedVibes.includes(option.id);

          return (
            <button
              key={option.id}
              onClick={() => toggleVibe(option.id)}
              className={`
                p-4 rounded-[10px] border-2 text-center transition-all duration-200 hover:scale-105 flex flex-col items-center space-y-2
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

      {/* Other Input Field */}
      {derivedShowOther && (
        <div className="bg-primary/10 rounded-[10px] p-4 border border-primary/20 mt-4">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-xl">✨</span>
            <label className="block text-primary font-bold text-base font-raleway">Other</label>
          </div>
          <label className="block text-primary font-bold mb-3 text-sm font-raleway">
            What other vibe(s) do you want for this trip?
          </label>
          <textarea
            value={otherText}
            onChange={(e) => onOtherTextChange(e.target.value)}
            placeholder="Example: We want down time to laugh and reminisce about the good old days"
            className="w-full px-4 py-3 border-3 border-[#406170] rounded-[10px] focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-primary bg-[#ece8de] resize-none font-raleway font-bold text-sm"
            rows={3}
          />
        </div>
      )}
    </div>
  );
};

export default TripVibe;

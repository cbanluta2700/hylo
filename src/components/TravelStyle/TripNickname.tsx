import React from 'react';
import { BaseStyleFormProps } from './types';

const TripNickname: React.FC<BaseStyleFormProps> = ({ formData, onFormChange }) => {
  const handleNicknameChange = (value: string) => {
    onFormChange({ nickname: value });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-bold text-primary font-raleway">
        Give your trip a nickname (optional)
      </h4>
      <p className="text-primary text-sm">Something fun to remember this trip by!</p>
      <input
        type="text"
        value={formData.nickname || ''}
        onChange={(e) => handleNicknameChange(e.target.value)}
        placeholder="e.g., 'Girls Weekend in Paris', 'Family Adventure'"
        className="w-full px-4 py-3 border-3 border-primary rounded-[10px] focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-primary bg-[#ece8de] font-raleway font-bold"
      />
    </div>
  );
};

export default TripNickname;

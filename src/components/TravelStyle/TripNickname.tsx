import React from 'react';

interface TripNicknameProps {
  tripNickname: string;
  onNicknameChange: (nickname: string) => void;
  contactInfo: any;
  onContactChange: (info: any) => void;
}

const TripNickname: React.FC<TripNicknameProps> = ({
  tripNickname,
  onNicknameChange,
  contactInfo,
  onContactChange,
}) => {
  const handleInputChange = (field: string, value: string) => {
    onContactChange({ ...contactInfo, [field]: value });
  };

  const handleSubscribeChange = (checked: boolean) => {
    onContactChange({ ...contactInfo, subscribe: checked });
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-bold text-primary uppercase tracking-wide mb-2 font-raleway">
          Trip Nickname
        </h4>
      </div>

      <input
        type="text"
        placeholder={`Example: "Girls' trip to Mexico", "Southeast Asia 50th anniversary extravaganza!"`}
        value={tripNickname}
        onChange={(e) => onNicknameChange(e.target.value)}
        className="w-full px-4 py-3 border-2 border-primary rounded-[10px] focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-primary bg-white placeholder-gray-500 font-raleway font-bold"
      />

      {/* Contact Information */}
      <div className="space-y-4 pt-4 border-t border-gray-300">
        <div>
          <label className="block text-primary font-bold mb-2 font-raleway text-lg">
            Your Name
          </label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={contactInfo.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-4 py-3 border-2 border-primary rounded-[10px] focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-primary bg-white font-raleway font-bold"
          />
        </div>

        <div>
          <label className="block text-primary font-bold mb-1 font-raleway text-lg">
            Email
          </label>
          <p
            className="text-xs font-bold font-raleway mb-2"
            style={{ color: '#406170' }}
          >
            We'll use this to send you your itinerary
          </p>
          <input
            type="email"
            placeholder="your@email.com"
            value={contactInfo.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-4 py-3 border-2 border-primary rounded-[10px] focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-primary bg-white font-raleway font-bold"
          />
        </div>

        {/* Subscribe Switch */}
        <div className="flex items-center">
          <label className="relative inline-flex items-center cursor-pointer mr-3">
            <input
              type="checkbox"
              checked={contactInfo.subscribe !== false}
              onChange={(e) => handleSubscribeChange(e.target.checked)}
              className="sr-only peer"
            />
            <div
              className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-5 after:w-5 after:transition-all peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 ${
                contactInfo.subscribe !== false
                  ? 'bg-primary border-primary after:bg-white after:border-[#ece8de] after:border'
                  : 'bg-[#ece8de] border-primary border-2 after:bg-primary after:border-[#ece8de] after:border-2'
              }`}
            ></div>
          </label>
          <span className="text-primary font-bold font-raleway text-sm">
            Subscribe to HYLO TRAVEL emails for tips, deals, hacks, and more.
            See our Privacy Policy.
          </span>
        </div>
      </div>
    </div>
  );
};

export default TripNickname;

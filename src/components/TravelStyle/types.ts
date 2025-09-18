export interface TravelStyleFormData {
  experience?: string[];
  vibes?: string[];
  sampleDays?: string[];
  dinnerChoices?: string[];
  nickname?: string;
  customVibesText?: string;
}

export interface BaseStyleFormProps {
  formData: TravelStyleFormData;
  onFormChange: (data: Partial<TravelStyleFormData>) => void;
}

// Experience options
export const EXPERIENCE_OPTIONS = [
  { id: 'this-is-one-first-trip-together', text: 'This is our first trip together', emoji: '✈️' },
  {
    id: 'traveled-together-comfortably',
    text: 'We have traveled together comfortably',
    emoji: '🗺️',
  },
  { id: 'wanderlust-and-explore', text: 'We have a wanderlust and love to explore', emoji: '🌍' },
  { id: 'stick-to-known-favorites', text: 'We like to stick to our known favorites', emoji: '⭐' },
];

// Vibe options
export const VIBE_OPTIONS = [
  { id: 'up-for-anything', text: 'Up for anything', emoji: '🎊' },
  { id: 'relax-recharge', text: 'Relax & recharge', emoji: '🧘' },
  { id: 'be-in-the-action', text: 'Be in the action', emoji: '🎬' },
  { id: 'go-with-the-flow', text: 'Go with the flow', emoji: '🕺' },
  { id: 'planned-schedule', text: 'Have a planned schedule', emoji: '📅' },
  { id: 'other', text: 'Other', emoji: '💭' },
];

// Sample days options
export const SAMPLE_DAYS = [
  'We want to do all the touristy things',
  'Check out museums or local shops',
  'We want to see how the locals live',
  'We want to be as active as possible',
  'Visit a beautiful winery or distillery',
  'Take it easy during the day, party all night',
];

// Dinner options
export const DINNER_OPTIONS = [
  'Fine dining',
  'Local cuisine',
  'Street food',
  'Casual dining',
  'Room service',
];

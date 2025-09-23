/**
 * ItineraryDisplay Component
 *
 * Constitutional Requirements:
 * - Design tokens: bg-form-box (#ece8de), rounded-[36px]
 * - BaseFormProps pattern for consis        <DetailBox 
          title="Prepared for:" 
          content={`Name: ${formData.nickname || 'Traveler'}`} 
        />y
 * - Type-safe development
 *
 * Task: T040 - Enhanced ItineraryDisplay component with custom layout
 */

import React from 'react';
import { Download, Mail, MapPin, AlertCircle, Plane, Hotel } from 'lucide-react';
import ResilientLoading from './ResilientLoading';
import type { FinalItinerary } from '../lib/ai-agents/formatter-agent';
import type { TravelFormData } from '../types/travel-form';

/**
 * Base form props interface following constitutional pattern
 */
interface BaseFormProps {
  className?: string;
  onFormChange?: (data: any) => void;
}

/**
 * ItineraryDisplay component props
 */
interface ItineraryDisplayProps extends BaseFormProps {
  itinerary?: FinalItinerary;
  formData?: TravelFormData | null;
  isLoading: boolean;
  error?: string;
  workflowId?: string;
}

/**
 * Section Header Component (like 🌏 TRIP DETAILS style)
 */
const SectionHeader: React.FC<{ icon?: string; title: string }> = ({ icon, title }) => (
  <div className="bg-form-box rounded-[36px] p-6 shadow-lg border border-gray-200 mb-6">
    <h2 className="text-2xl font-bold text-primary font-raleway flex items-center">
      {icon && <span className="mr-3">{icon}</span>}
      {title}
    </h2>
  </div>
);

/**
 * Trip Details Container Component
 */
const TripDetailsContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">{children}</div>
);

/**
 * Detail Box Component
 */
const DetailBox: React.FC<{ title: string; content: string }> = ({ title, content }) => (
  <div className="bg-white border border-gray-300 rounded-lg p-4">
    <h3 className="font-bold text-gray-800 text-sm mb-2">{title}</h3>
    <p className="text-gray-700 text-sm">{content}</p>
  </div>
);

/**
 * Daily Itinerary Container Component
 */
const DailyContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6">{children}</div>
);

/**
 * Tips Container Component
 */
const TipsContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white border border-gray-300 rounded-lg p-6">{children}</div>
);

/**
 * Format date helper
 */
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'Not specified';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * ItineraryDisplay Component
 */
const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({
  formData,
  isLoading,
  error,
  className = '',
}) => {
  if (isLoading) {
    return (
      <ResilientLoading
        isLoading={isLoading}
        loadingMessage="Creating your perfect travel experience..."
        timeoutMessage="Our AI agents are working hard on your personalized itinerary. High demand may be causing delays."
        timeoutDuration={45000}
        onTimeout={() => {
          console.log('Itinerary generation timeout detected');
        }}
        className="bg-form-box rounded-[36px] shadow-lg border border-gray-200"
      />
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-[36px] p-6 shadow-lg animate-slideIn">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <div>
            <h3 className="text-lg font-bold text-red-800 font-raleway">
              Oops! Something went wrong
            </h3>
            <p className="text-red-600 font-raleway mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-[36px] p-6 shadow-lg">
        <p className="text-yellow-700">No travel data available to display.</p>
      </div>
    );
  }

  return (
    <div className={`animate-expandIn space-y-6 ${className}`}>
      {/* 1st Section: YOUR PERSONALIZED ITINERARY */}
      <SectionHeader title="YOUR PERSONALIZED ITINERARY" />

      {/* 2nd Section: TRIP SUMMARY */}
      <SectionHeader title={`TRIP SUMMARY | "${formData.nickname || 'My Amazing Trip'}"`} />

      {/* 3rd Section: Trip Details Grid */}
      <TripDetailsContainer>
        <DetailBox title="Destination" content={formData.location || 'Not specified'} />
        <DetailBox
          title="Dates"
          content={`${formatDate(formData.departDate)} – ${formatDate(formData.returnDate)}`}
        />
        <DetailBox
          title="Travelers"
          content={`${formData.adults} adults${
            formData.children
              ? `, ${formData.children} child${formData.children > 1 ? 'ren' : ''}`
              : ''
          }`}
        />
        <DetailBox
          title="Budget"
          content={`Currency: ${formData.budget?.currency || 'USD'}  Amount: ${
            formData.budget?.total || 'Not specified'
          }  Mode: ${formData.budget?.flexibility === 'flexible' ? 'flexible' : 'strict'}`}
        />
        <DetailBox title="Prepared for:" content={`Name: ${formData.nickname || 'Traveler'}`} />
      </TripDetailsContainer>

      {/* 4th Section: Map Placeholder */}
      <div className="bg-gray-100 rounded-lg p-8 text-center border border-gray-300">
        <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Map of {formData.location} (placeholder)</p>
      </div>

      {/* 5th Section: DAILY ITINERARY */}
      <SectionHeader icon="🗓️" title="DAILY ITINERARY" />

      {/* Daily Schedule - Day 1 Example */}
      <SectionHeader title="Day 1 | Wed, Jun 14 | Fly to Italy" />
      <DailyContainer>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Plane className="h-5 w-5 text-blue-500 mt-1" />
            <div>
              <h4 className="font-bold text-gray-800 mb-2">Flight recommendation:</h4>
              <div className="space-y-2 text-gray-700">
                <p>
                  <strong>Delta Airlines &gt;</strong>
                </p>
                <p>7:10 am SEA (Seattle) ⟶ 3:56 pm JFK (New York) | Travel time: 5h 36m</p>
                <p>1h 4m layover</p>
                <p>5:00 pm JFK ⟶ 7:55 am MCO (Rome) | Travel time: 8h 55m</p>
                <p>
                  <em>Note: this flight lands on Tuesday, June 15th</em>
                </p>
              </div>
            </div>
          </div>
        </div>
      </DailyContainer>

      {/* Daily Schedule - Day 2 Example */}
      <SectionHeader title="Day 2 | Thurs, Jun 15 | Welcome to Rome!" />
      <DailyContainer>
        <div className="space-y-4">
          <p className="text-gray-700">
            Welcome to Rome! After arriving at Leonardo da Vinci International Airport (FCO), make
            your way to your hotel in the city center via taxi or train.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Hotel className="h-5 w-5 text-blue-500 mt-1" />
              <div>
                <h4 className="font-bold text-gray-800 mb-2">Accommodation recommendations:</h4>
                <p className="text-sm text-gray-600 mb-2">Click links to view details and book</p>
                <div className="space-y-1 text-gray-700">
                  <p>Boutique Hotel: Hotel Artemide &gt;</p>
                  <p>AirBnB: Spanish Square Condo &gt;</p>
                  <p>Quirky or unique local stay: Casa Monti Roma &gt;</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-gray-700">
              Rest at your hotel, grab a bite to eat close by, and visit some of the shops or
              historical landmarks in the area.
            </p>

            <h4 className="font-bold text-gray-800 mt-4 mb-2">Activities</h4>
            <ul className="text-gray-700 space-y-1">
              <li>Check in and refresh at your hotel</li>
              <li>Take a leisurely stroll to the Trevi Fountain (15 min walk)</li>
              <li>
                Take your time checking out shops, historical landmarks, and eateries along the way.
              </li>
              <li>Enjoy dinner at a local trattoria in the historic center</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <h4 className="font-bold text-blue-800 mb-2">💡 Travel Tip</h4>
            <p className="text-blue-700 text-sm">
              Purchase a Roma Pass &gt; for your stay to get free public transportation and entry to
              many attractions.
            </p>
          </div>
        </div>
      </DailyContainer>

      {/* Daily Schedule - Day 3 Example */}
      <SectionHeader title="Day 3 | Fri, Jun 16 | Vatican City & Roman Forum" />
      <DailyContainer>
        <div className="space-y-4">
          <p className="text-gray-700">
            Today you'll explore the wonders of Vatican City and ancient Rome, a truly fascinating
            and history-rich experience.
          </p>

          <div>
            <h4 className="font-bold text-gray-800 mb-2">Morning</h4>
            <ul className="text-gray-700 space-y-1 ml-4">
              <li>
                Breakfast at hotel (if you book Hotel Artemide or Casa Monti Roma); otherwise find a
                local cafe or restaurant
              </li>
              <li>
                Skip-the-line guided tour &gt; of Vatican Museums, Sistine Chapel & St. Peter's
                Basilica (9:00 AM)
              </li>
              <li>Light lunch near Vatican City</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-800 mb-2">Afternoon</h4>
            <ul className="text-gray-700 space-y-1 ml-4">
              <li>Visit the Colosseum and Roman Forum (2:00 PM guided tour)</li>
              <li>Explore Palatine Hill</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <h4 className="font-bold text-green-800 mb-2">Dining recommendation</h4>
            <p className="text-green-700 text-sm">
              Make a dinner reservation at Armando al Pantheon &gt; - Traditional Roman cuisine near
              the Pantheon
            </p>
          </div>
        </div>
      </DailyContainer>

      {/* 3rd to the last section: TIPS FOR YOUR TRIP */}
      <SectionHeader icon="💡" title="TIPS FOR YOUR TRIP" />

      {/* 2nd to the last section: Based on your trip answers */}
      <SectionHeader title="Based on your trip answers, travel group, location, etc." />

      {/* Last section: Tips Container */}
      <TipsContainer>
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-gray-800 mb-2">Start Early, Nap Midday:</h4>
            <p className="text-gray-700 text-sm">
              Sightsee in the morning when it's cooler, then head back for a rest after lunch (like
              the locals do). Even adults will appreciate the downtime.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-800 mb-2">Hydrate Constantly:</h4>
            <p className="text-gray-700 text-sm">
              June can get hot—bring refillable water bottles. Rome especially has free water
              fountains (called nasoni) with cold, drinkable water.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-800 mb-2">Stroller Advice:</h4>
            <p className="text-gray-700 text-sm">
              We recommend you don't bring a stroller—Italy's cobblestone streets are no joke—but if
              you must, we recommend a lightweight, foldable stroller with good wheels.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-800 mb-2">Gelato is Your Friend:</h4>
            <p className="text-gray-700 text-sm">
              It's a reward, a bribe, a cool-down, and a cultural experience all in one.
            </p>
          </div>

          <div className="mt-6">
            <h4 className="font-bold text-gray-800 mb-3">What to Pack</h4>
            <ul className="text-gray-700 text-sm space-y-1">
              <li>Lightweight clothes, hats, and sunblock</li>
              <li>Power adapter for European plugs (Type C, F, or L)</li>
              <li>Small toys or activities for meals and downtime</li>
              <li>Baby wipes (always handy in transit or with messy gelato!)</li>
            </ul>
          </div>
        </div>
      </TipsContainer>

      {/* Action Buttons */}
      <div className="bg-form-box rounded-[36px] p-6 shadow-lg border border-gray-200 animate-slideIn mt-8">
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => {
              const element = document.createElement('a');
              const file = new Blob(['Your itinerary content here'], { type: 'text/plain' });
              element.href = URL.createObjectURL(file);
              element.download = 'my-travel-itinerary.txt';
              document.body.appendChild(element);
              element.click();
              document.body.removeChild(element);
            }}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-[36px] hover:bg-primary-dark transition-all duration-200 font-raleway font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Download className="h-5 w-5" />
            <span>Download Itinerary</span>
          </button>
          <button
            onClick={() => {
              const subject = encodeURIComponent('My Personalized Travel Itinerary');
              const body = encodeURIComponent('Your itinerary content here');
              window.open(`mailto:?subject=${subject}&body=${body}`);
            }}
            className="flex items-center justify-center space-x-2 px-6 py-3 border-2 border-primary text-primary rounded-[36px] hover:bg-primary hover:text-white transition-all duration-200 font-raleway font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Mail className="h-5 w-5" />
            <span>Email to Myself</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItineraryDisplay;

/**
 * ItineraryDisplay Component
 *
 * Constitutional Requirements:
 * - Design tokens: bg-form-box (#ece8de), rounded-[36px]
 * - BaseFormProps pattern for consistency
 * - Type-safe development
 *
 * Task: T040 - Enhanced ItineraryDisplay component
 */

import React from 'react';
import {
  Download,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  CheckCircle,
  User,
  AlertCircle,
} from 'lucide-react';
import ResilientLoading from './ResilientLoading';
import type { FinalItinerary } from '../lib/ai-agents/formatter-agent';

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
  isLoading: boolean;
  error?: string;
  workflowId?: string;
}

/**
 * ItineraryDisplay Component
 * Constitutional design: bg-form-box, rounded-[36px], consistent typography
 */
const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({
  itinerary,
  isLoading,
  error,
  workflowId,
  className = '',
  onFormChange,
}) => {
  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([itinerary], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'my-travel-itinerary.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('My Personalized Travel Itinerary');
    const body = encodeURIComponent(itinerary);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const formatItinerary = (text: string) => {
    // Split the text into sections
    const sections = text.split(/(?=🌟|📅|🏨|🍽️|🚗|💰|🎒|📱|✨)/);

    return sections.map((section, index) => {
      if (!section.trim()) return null;

      // Check if this is a major section header
      const isHeader =
        section.startsWith('🌟') ||
        section.startsWith('📅') ||
        section.startsWith('🏨') ||
        section.startsWith('🍽️') ||
        section.startsWith('🚗') ||
        section.startsWith('💰') ||
        section.startsWith('🎒') ||
        section.startsWith('📱') ||
        section.startsWith('✨');

      if (isHeader) {
        const lines = section.split('\n');
        const headerLine = lines[0];
        const content = lines.slice(1).join('\n');

        return (
          <div
            key={index}
            className="mb-8 animate-slideIn"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <h3 className="text-xl font-bold text-primary mb-4 pb-2 border-b-2 border-primary/20">
              {headerLine}
            </h3>
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {formatContent(content)}
            </div>
          </div>
        );
      }

      return (
        <div
          key={index}
          className="whitespace-pre-wrap text-gray-700 leading-relaxed mb-4 animate-slideIn"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {formatContent(section)}
        </div>
      );
    });
  };

  const formatContent = (content: string) => {
    // Format bold text (text between **)
    let formatted = content.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="text-primary font-bold">$1</strong>'
    );

    // Format bullet points
    formatted = formatted.replace(/^- /gm, '• ');

    // Format time patterns (e.g., 9:00 AM)
    formatted = formatted.replace(
      /\b(\d{1,2}:\d{2}\s*[AP]M)\b/g,
      '<span class="text-[#f68854] font-bold">$1</span>'
    );

    // Format money amounts
    formatted = formatted.replace(/\$[\d,]+/g, '<span class="text-green-600 font-bold">$&</span>');

    return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <div className="animate-expandIn">
      <div className="space-y-6">
        {/* Loading State with Timeout Handling */}
        {isLoading && (
          <ResilientLoading
            isLoading={isLoading}
            loadingMessage="Creating your perfect travel experience..."
            timeoutMessage="Our AI agents are working hard on your personalized itinerary. High demand may be causing delays."
            timeoutDuration={45000} // 45 seconds for travel planning
            onTimeout={() => {
              console.log('Itinerary generation timeout detected');
            }}
            className="bg-form-box rounded-[36px] shadow-lg border border-gray-200"
          />
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border-2 border-red-200 rounded-[36px] p-6 shadow-lg animate-slideIn">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-800 font-raleway">
                  Oops! Something went wrong
                </h3>
                <p className="text-red-600 font-raleway mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success State - No fixed container, content expands naturally */}
        {itinerary && !isLoading && !error && (
          <>
            {/* Header Section */}
            <div className="bg-form-box rounded-[36px] p-6 shadow-lg border border-gray-200 animate-slideIn">
              <div className="text-center border-b-2 border-primary/20 pb-4">
                <h2 className="text-2xl font-bold text-primary font-raleway flex items-center justify-center">
                  <MapPin className="h-6 w-6 mr-2" />
                  Your Personalized Itinerary
                  <span className="ml-2">✨</span>
                </h2>
              </div>

              {/* Success Message */}
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mt-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <p className="text-green-700 font-bold font-raleway">
                    Your personalized itinerary is ready!
                  </p>
                </div>
              </div>
            </div>

            {/* Itinerary Content - Each section in its own card, expanding naturally */}
            <div className="space-y-4">
              {itinerary.split(/(?=🌟|📅|🏨|🍽️|🚗|💰|🎒|📱|✨)/).map((section, index) => {
                if (!section.trim()) return null;

                const lines = section.split('\n');
                const headerLine = lines[0];
                const content = lines.slice(1).join('\n');

                // Check if this section has an emoji header
                const hasEmojiHeader = /^[🌟📅🏨🍽️🚗💰🎒📱✨]/.test(section);

                if (hasEmojiHeader) {
                  return (
                    <div
                      key={index}
                      className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md animate-slideIn"
                      style={{ animationDelay: `${index * 150}ms` }}
                    >
                      <h3 className="text-xl font-bold text-primary mb-4 pb-2 border-b-2 border-primary/20">
                        {headerLine}
                      </h3>
                      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                        {formatContent(content)}
                      </div>
                    </div>
                  );
                }

                // For non-header content
                return (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md animate-slideIn"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {formatContent(section)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div
              className="bg-form-box rounded-[36px] p-6 shadow-lg border border-gray-200 animate-slideIn"
              style={{ animationDelay: '300ms' }}
            >
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-[36px] hover:bg-primary-dark transition-all duration-200 font-raleway font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Download className="h-5 w-5" />
                  <span>Download Itinerary</span>
                </button>
                <button
                  onClick={handleEmail}
                  className="flex items-center justify-center space-x-2 px-6 py-3 border-2 border-primary text-primary rounded-[36px] hover:bg-primary hover:text-white transition-all duration-200 font-raleway font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Mail className="h-5 w-5" />
                  <span>Email to Myself</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ItineraryDisplay;

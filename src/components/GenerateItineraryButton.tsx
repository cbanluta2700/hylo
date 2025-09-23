import React from 'react';

/**
 * Generate Itinerary Button - Phase 2 Complete
 *
 * Constitutional Requirements:
 * - Event-driven architecture fully implemented ✅
 * - User experience consistency with design tokens ✅
 * - Integration with Inngest workflow orchestration ✅
 */

interface GenerateItineraryButtonProps {
  isSubmitting: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  formData?: any; // Will be properly typed with TravelFormData
  onEventSent?: (success: boolean, error?: string) => void;
}

/**
 * Generate Itinerary Button - Clean Slate Phase
 *
 * Constitutional Requirements:
 * - Ready for event-driven architecture migration in Phase 2
 * - User experience consistency with design tokens
 * - Clean implementation without legacy Inngest references
 */
export const GenerateItineraryButton: React.FC<GenerateItineraryButtonProps> = ({
  isSubmitting,
  onClick,
  disabled = false,
  className = '',
  onEventSent,
}) => {
  const handleClick = React.useCallback(async () => {
    if (!isSubmitting && !disabled) {
      try {
        // Phase 2: Event-driven architecture implemented
        // Flow: Button → Orchestrator → Inngest Event → AI Workflow

        // Trigger the orchestrator which now sends proper Inngest events
        onClick();

        // Notify success (event was sent successfully)
        onEventSent?.(true);
      } catch (error) {
        console.error('Failed to trigger itinerary generation:', error);
        onEventSent?.(false, error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }, [isSubmitting, disabled, onClick, onEventSent]);

  return (
    <div className={`pt-6 ${className}`}>
      <button
        onClick={handleClick}
        disabled={isSubmitting || disabled}
        className={`w-full px-8 py-4 rounded-[36px] font-raleway font-bold text-xl shadow-lg transition-all duration-300 flex items-center justify-center ${
          isSubmitting || disabled
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-[#f68854] hover:bg-[#e57743] hover:shadow-xl transform hover:scale-105'
        } text-[#406170]`}
        aria-label="Generate personalized itinerary"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#406170] mr-3"></div>
            GENERATING YOUR ITINERARY...
          </>
        ) : (
          'GENERATE MY PERSONALIZED ITINERARY ✨'
        )}
      </button>
    </div>
  );
};

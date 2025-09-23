/**
 * Ultra-Simple Itinerary Display - Pure Inngest Version
 *
 * NO polling, NO sessions, NO Redis complexity!
 * Just show loading state and let user know Inngest is processing.
 */

import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import ResilientLoading from './ResilientLoading';
import type { TravelFormData } from '../types/travel-form';

interface ItineraryDisplayProps {
  formData?: TravelFormData | null;
  isLoading: boolean;
  error?: string;
  workflowId?: string;
  className?: string;
}

const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({
  formData,
  isLoading,
  error,
  workflowId,
  className = '',
}) => {
  console.log('🎯 [AI-Display-Simple] Component state:', {
    isLoading,
    hasFormData: !!formData,
    workflowId: workflowId?.substring(0, 15) + '...',
  });

  // Show error state
  if (error) {
    return (
      <div className={`${className} p-6`}>
        <div className="bg-red-50 border border-red-200 rounded-[36px] p-8 text-center">
          <div className="text-red-600 text-xl font-bold mb-4">Generation Failed</div>
          <div className="text-red-700">{error}</div>
          <div className="mt-4 text-sm text-red-600">
            Please try again or contact support if the issue persists.
          </div>
        </div>
      </div>
    );
  }

  // Show loading state with Inngest processing info
  if (isLoading && workflowId) {
    return (
      <div className={`${className} p-6`}>
        <div className="bg-form-box rounded-[36px] p-8 text-center border border-gray-200">
          <ResilientLoading isLoading={true} />

          <div className="mt-6">
            <h3 className="text-2xl font-bold text-primary font-raleway mb-4">
              <span className="text-[#f9dd8b]">AI AGENTS</span> CRAFTING YOUR ITINERARY
            </h3>

            <div className="text-gray-700 space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span>Estimated completion: 2-3 minutes</span>
              </div>

              <div className="text-sm text-gray-600">
                Workflow ID: {workflowId?.substring(0, 20)}...
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                <h4 className="font-bold text-yellow-800 mb-2">Inngest Processing</h4>
                <div className="text-yellow-700 text-sm space-y-1">
                  <div>🏗️ Architect Agent: Planning your trip structure</div>
                  <div>📚 Gatherer Agent: Researching destinations</div>
                  <div>👨‍💼 Specialist Agent: Curating recommendations</div>
                  <div>✨ Formatter Agent: Creating final itinerary</div>
                </div>
              </div>

              <div className="text-xs text-gray-500 mt-4">
                Your itinerary will be ready shortly. No need to refresh the page.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No data to display yet
  if (!formData) {
    return (
      <div className={`${className} p-6`}>
        <div className="bg-form-box rounded-[36px] p-8 text-center border border-gray-200">
          <div className="text-gray-600">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-bold font-raleway mb-2">Ready to Generate</h3>
            <p>
              Fill out the travel form and click generate to create your personalized itinerary.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // This would be where completed itineraries are shown
  // For now, just show that we received the form data
  return (
    <div className={`${className} p-6`}>
      <div className="bg-form-box rounded-[36px] p-8 border border-gray-200">
        <h3 className="text-2xl font-bold text-primary font-raleway mb-4">Form Data Received</h3>
        <div className="text-gray-700">
          <p>
            <strong>Destination:</strong> {formData.location}
          </p>
          <p>
            <strong>Dates:</strong> {formData.departDate} to {formData.returnDate}
          </p>
          <p>
            <strong>Travelers:</strong> {formData.adults} adults
            {formData.children > 0 ? `, ${formData.children} children` : ''}
          </p>
          {formData.budget?.total && (
            <p>
              <strong>Budget:</strong> ${formData.budget.total}
            </p>
          )}
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Click "Generate My Personalized Itinerary" to start the AI workflow.
        </div>
      </div>
    </div>
  );
};

export default ItineraryDisplay;

/**
 * MINIMAL APP - Pure Inngest, No Complexity
 * Just form → API → Inngest workflow
 */

import { useState } from 'react';
import TripDetails from './components/TripDetails';
import { FormData } from './components/TripDetails/types';
import ItineraryDisplaySimple from './components/ItineraryDisplaySimple';

function App() {
  // Basic form state
  const [formData, setFormData] = useState<FormData>({
    location: '',
    departDate: '',
    returnDate: '',
    flexibleDates: false,
    adults: 2,
    children: 0,
    childrenAges: [],
    budget: 5000,
    currency: 'USD',
    flexibleBudget: false,
    budgetMode: 'total',
    travelStyleChoice: 'not-selected',
    travelStyleAnswers: {},
    selectedGroups: [],
    selectedInterests: [],
    selectedInclusions: [],
    customGroupText: '',
    customInterestsText: '',
    customInclusionsText: '',
    inclusionPreferences: {},
  });

  // Simple workflow state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [workflowId, setWorkflowId] = useState('');

  // ULTRA-SIMPLE generate function
  const handleGenerateItinerary = async () => {
    console.log('🚀 [MINIMAL] Starting simple generation');

    setIsGenerating(true);
    setGenerationError('');
    setWorkflowId('');

    try {
      const response = await fetch('/api/itinerary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData), // Send raw form data
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      setWorkflowId((result as any)?.workflowId || 'unknown');
    } catch (error) {
      console.error('💥 [MINIMAL] Error:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed');
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary">
      <header className="bg-primary border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold font-raleway">
            <span className="text-[#ece8de]">HYLO </span>
            <span className="text-[#f9dd8b]">TRAVEL AI</span>
          </h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Form */}
            <div className="space-y-6">
              <TripDetails formData={formData} onFormChange={setFormData} />

              {/* Simple generate button */}
              <div className="bg-form-box rounded-[36px] p-6 text-center">
                <button
                  onClick={handleGenerateItinerary}
                  disabled={isGenerating || !formData.location}
                  className="bg-[#f9dd8b] text-primary px-8 py-4 rounded-[24px] font-bold text-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating...' : 'Generate My Itinerary'}
                </button>
                {generationError && (
                  <div className="mt-4 text-red-600 text-sm">{generationError}</div>
                )}
              </div>
            </div>

            {/* Right: Display */}
            <div>
              <ItineraryDisplaySimple
                formData={formData as any}
                isLoading={isGenerating}
                error={generationError}
                workflowId={workflowId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

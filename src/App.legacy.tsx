import { useState, useRef } from 'react';
import { TravelFormData, AgentLog } from './services/groqService';
import TripDetails from './components/TripDetails';
import { FormData } from './components/TripDetails/types';
import ConditionalTravelStyle from './components/ConditionalTravelStyle';
import { TravelStyleChoice } from './types/travel-style-choice';
import ItineraryDisplay from './components/ItineraryDisplay';
import BehindTheScenes from './components/BehindTheScenes';
import AIErrorBoundary from './components/AIErrorBoundary';
import HealthMonitor from './components/HealthMonitor';

function App() {
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
    budgetMode: 'total', // Add the missing budgetMode property
    travelStyleChoice: 'not-selected',
    travelStyleAnswers: {},
    // Additional fields for new components
    selectedGroups: [],
    selectedInterests: [],
    selectedInclusions: [],
    customGroupText: '',
    customInterestsText: '',
    customInclusionsText: '',
    inclusionPreferences: {},
  });
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [selectedSampleDays, setSelectedSampleDays] = useState<string[]>([]);
  const [dinnerChoices, setDinnerChoices] = useState<string[]>([]);
  const [tripNickname, setTripNickname] = useState<string>('');
  const [contactInfo, setContactInfo] = useState({});
  
  // Travel style choice state management
  const [travelStyleChoice, setTravelStyleChoice] = useState<TravelStyleChoice>(TravelStyleChoice.NOT_SELECTED);

  // Custom text inputs for "other" options (remaining for travel style components)
  const [customVibesText, setCustomVibesText] = useState<string>('');

  const [generatedItinerary, setGeneratedItinerary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string>('');
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const itineraryRef = useRef<HTMLDivElement>(null);

  // Handle travel style choice selection
  const handleTravelStyleChoice = (choice: TravelStyleChoice) => {
    setTravelStyleChoice(choice);
  };

  const handleGenerateItinerary = async () => {
    setIsGenerating(true);
    setGenerationError('');
    setGeneratedItinerary(''); // Clear previous itinerary
    setAgentLogs([]); // Clear previous logs

    try {
      // Instead of calling AI/LLM, display the gathered form data organized by form sections
      const organizedFormData = {
        "1. Destination & Dates": {
          "destination": formData.location,
          "departureDate": formData.departDate,
          "returnDate": formData.returnDate,
          "flexibleDates": formData.flexibleDates,
          ...(formData.flexibleDates && formData.plannedDays && {
            "plannedDays": formData.plannedDays
          })
        },
        "2. Travelers": {
          "adults": formData.adults,
          "children": formData.children,
          "childrenAges": formData.childrenAges
        },
        "3. Budget": {
          "flexibleBudget": formData.flexibleBudget,
          ...(formData.flexibleBudget ? {
            "budgetNote": "User indicated budget is flexible - specific amount not relevant"
          } : {
            "amount": formData.budget,
            "currency": formData.currency,
            "budgetMode": formData.budgetMode
          })
        },
        "4. Travel Group": {
          "selectedGroups": formData.selectedGroups,
          "customGroupText": formData.customGroupText
        },
        "5. Travel Interests": {
          "selectedInterests": formData.selectedInterests,
          "customInterestsText": formData.customInterestsText
        },
        "6. Itinerary Inclusions": {
          "selectedInclusions": formData.selectedInclusions,
          "customInclusionsText": formData.customInclusionsText,
          "inclusionPreferences": formData.inclusionPreferences
        },
        "7. Travel Style Questions": {
          "travelStyleChoice": travelStyleChoice,
          "experience": formData.travelStyleAnswers?.['experience'] || [],
          "vibes": formData.travelStyleAnswers?.['vibes'] || [],
          "vibesOther": formData.travelStyleAnswers?.['vibesOther'],
          "sampleDays": formData.travelStyleAnswers?.['sampleDays'] || [],
          "dinnerChoices": formData.travelStyleAnswers?.['dinnerChoices'] || []
        },
        "8. Contact & Trip Details": {
          "tripNickname": formData.travelStyleAnswers?.['tripNickname'] || tripNickname,
          "contactName": (formData as any)?.contactInfo?.name || (contactInfo as any)?.name || '',
          "contactEmail": (formData as any)?.contactInfo?.email || (contactInfo as any)?.email || ''
        }
      };

      const debugItinerary = `
# 📋 Complete Form Data Review

${Object.entries(organizedFormData).map(([sectionTitle, sectionData]) => `
## ${sectionTitle}
\`\`\`json
${JSON.stringify(sectionData, null, 2)}
\`\`\`
`).join('')}

---

**Note**: This is a debug view showing all collected form data organized by form sections. AI/LLM functionality has been temporarily disabled.

## Raw Complete Data Object
\`\`\`json
${JSON.stringify(organizedFormData, null, 2)}
\`\`\`
      `;

      setGeneratedItinerary(debugItinerary);
      setAgentLogs([{
        agentId: 0,
        agentName: 'Form Data Collector',
        model: 'Debug Mode',
        timestamp: new Date().toISOString(),
        input: 'Form data collection request',
        output: 'Successfully gathered all form fields',
        decisions: ['Form data collected', 'AI/LLM functionality disabled for debugging']
      }]);

      // Smooth scroll to the itinerary after a short delay
      setTimeout(() => {
        itineraryRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    } catch (error) {
      console.error('Error displaying form data:', error);
      setGenerationError(
        'Sorry, we encountered an error displaying the form data. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Prepare form data for behind the scenes view
  const completeFormData: TravelFormData = {
    tripDetails: formData,
    groups: formData.selectedGroups || [],
    interests: formData.selectedInterests || [],
    inclusions: formData.selectedInclusions || [],
    experience: selectedExperience,
    vibes: selectedVibes,
    sampleDays: selectedSampleDays,
    dinnerChoices: dinnerChoices,
    nickname: tripNickname,
    contact: contactInfo,
  };

  return (
    <div className="min-h-screen bg-primary py-8 font-raleway">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Trip Details Header - Full Width No Rounded Corners */}
          <div className="bg-trip-details text-primary py-4 px-6 shadow-lg -mx-4 sm:-mx-6 lg:-mx-8 2xl:-mx-16">
            <div className="flex items-center justify-center space-x-3">
              <span className="text-3xl">🌏</span>
              <h1 className="text-2xl font-bold tracking-wide text-primary font-raleway">
                TRIP DETAILS
              </h1>
            </div>
          </div>

          {/* Trip Details Form - Unified with all form components */}
          <TripDetails formData={formData} onFormChange={setFormData} showAdditionalForms={true} />

          {/* ConditionalTravelStyle - Handles choice-based travel style display */}
          <ConditionalTravelStyle
            choice={travelStyleChoice}
            onChoiceChange={handleTravelStyleChoice}
            formData={formData}
            onFormChange={setFormData}
            selectedExperience={selectedExperience}
            onExperienceChange={setSelectedExperience}
            selectedVibes={selectedVibes}
            onVibeChange={setSelectedVibes}
            customVibesText={customVibesText}
            onCustomVibesChange={setCustomVibesText}
            selectedSampleDays={selectedSampleDays}
            onSampleDaysChange={setSelectedSampleDays}
            dinnerChoices={dinnerChoices}
            onDinnerChoicesChange={setDinnerChoices}
            tripNickname={tripNickname}
            onTripNicknameChange={setTripNickname}
            contactInfo={contactInfo}
            onContactChange={setContactInfo}
            disabled={isGenerating}
            onGenerateItinerary={handleGenerateItinerary}
            isGenerating={isGenerating}
          />

          {/* Itinerary Results Section - Directly below the travel style */}
          <div ref={itineraryRef}>
            {(isGenerating || generatedItinerary || generationError) && (
              <AIErrorBoundary
                enableRecovery={true}
                maxRetries={2}
                onError={(error, errorInfo) => {
                  console.error('AI Error Boundary caught error:', error, errorInfo);
                  setGenerationError(
                    'Our AI service encountered an error. Please try again or refresh the page.'
                  );
                }}
                className="w-full"
              >
                <ItineraryDisplay
                  itinerary={generatedItinerary}
                  isLoading={isGenerating}
                  error={generationError}
                />
              </AIErrorBoundary>
            )}
          </div>
        </div>
      </main>

      {/* Behind the Scenes Component */}
      <BehindTheScenes
        formData={completeFormData}
        agentLogs={agentLogs}
        isProcessing={isGenerating}
      />

      {/* System Health Monitor - Only show during development or when there are issues */}
      {(process.env['NODE_ENV'] === 'development' || generationError) && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <HealthMonitor showDetails={process.env['NODE_ENV'] === 'development'} className="mt-6" />
        </div>
      )}
    </div>
  );
}

export default App;

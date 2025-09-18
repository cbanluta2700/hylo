import { useState, useRef } from 'react';
import { generateItinerary, TravelFormData, AgentLog } from './services/groqService';
import TripDetails from './components/TripDetails';
import { FormData } from './components/TripDetails/types';
import TravelExperience from './components/TravelStyle/TravelExperience';
import TripVibe from './components/TravelStyle/TripVibe';
import SampleDays from './components/TravelStyle/SampleDays';
import DinnerChoice from './components/TravelStyle/DinnerChoice';
import TripNickname from './components/TravelStyle/TripNickname';
import ItineraryDisplay from './components/ItineraryDisplay';
import BehindTheScenes from './components/BehindTheScenes';
import AIErrorBoundary from './components/AIErrorBoundary';
import HealthMonitor from './components/HealthMonitor';
import { GenerateItineraryButton } from './components/GenerateItineraryButton';

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

  // Custom text inputs for "other" options (remaining for travel style components)
  const [customVibesText, setCustomVibesText] = useState<string>('');

  const [generatedItinerary, setGeneratedItinerary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string>('');
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const itineraryRef = useRef<HTMLDivElement>(null);

  const handleGenerateItinerary = async () => {
    const travelData: TravelFormData = {
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

    setIsGenerating(true);
    setGenerationError('');
    setGeneratedItinerary(''); // Clear previous itinerary
    setAgentLogs([]); // Clear previous logs

    try {
      const result = await generateItinerary(travelData, (logs) => {
        setAgentLogs(logs);
      });

      setGeneratedItinerary(result.itinerary);
      setAgentLogs(result.logs);

      // Smooth scroll to the itinerary after a short delay
      setTimeout(() => {
        itineraryRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    } catch (error) {
      console.error('Error generating itinerary:', error);
      setGenerationError(
        'Sorry, we encountered an error generating your itinerary. Please try again.'
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

          {/* Travel Style Header - Full Width No Rounded Corners */}
          <div className="bg-trip-details text-primary py-4 px-6 shadow-lg -mx-4 sm:-mx-6 lg:-mx-8 2xl:-mx-16">
            <div className="flex items-center justify-center space-x-3">
              <span className="text-3xl">🌏</span>
              <h2 className="text-2xl font-bold tracking-wide text-primary font-raleway">
                TRAVEL STYLE
              </h2>
            </div>
          </div>

          {/* Travel Style Description */}
          <div className="text-center py-4">
            <p className="text-primary leading-relaxed text-sm font-bold font-raleway">
              <span style={{ color: '#ece8de' }}>
                The next few questions are optional, but answering them helps us understand you and
                create an even more personalized itinerary.
              </span>{' '}
              <span style={{ color: '#f9dd8b' }} className="font-bold">
                Answer them with this group and trip in mind.
              </span>
            </p>
          </div>

          {/* Travel Experience */}
          <div className="bg-form-box rounded-[36px] p-6 shadow-lg border border-gray-200">
            <div className="space-y-3 mb-6">
              <h4 className="text-xl font-bold text-primary uppercase tracking-wide mb-1 font-raleway">
                What is your group's level of travel experience?
              </h4>
              <p className="text-primary font-bold font-raleway text-xs">Select all that apply</p>
            </div>
            <TravelExperience
              selectedExperience={selectedExperience}
              onSelectionChange={setSelectedExperience}
            />
          </div>

          {/* Trip Vibe */}
          <div className="bg-form-box rounded-[36px] p-6 shadow-lg border border-gray-200">
            <div className="space-y-3 mb-6">
              <h4 className="text-xl font-bold text-primary uppercase tracking-wide mb-1 font-raleway">
                What do you want the "vibe" of this trip to be?
              </h4>
              <p className="text-primary font-bold font-raleway text-xs">Select all that apply</p>
            </div>
            <TripVibe
              selectedVibes={selectedVibes}
              onSelectionChange={setSelectedVibes}
              otherText={customVibesText}
              onOtherTextChange={setCustomVibesText}
            />
          </div>

          {/* Sample Days */}
          <div className="bg-form-box rounded-[36px] p-6 shadow-lg border border-gray-200">
            <SampleDays
              selectedDays={selectedSampleDays}
              onSelectionChange={setSelectedSampleDays}
            />
          </div>

          {/* Dinner Choice */}
          <div className="bg-form-box rounded-[36px] p-6 shadow-lg border border-gray-200">
            <DinnerChoice selectedChoice={dinnerChoices} onSelectionChange={setDinnerChoices} />
          </div>

          {/* Trip Nickname with Contact Info */}
          <div className="bg-form-box rounded-[36px] p-6 shadow-lg border border-gray-200">
            <TripNickname
              tripNickname={tripNickname}
              onNicknameChange={setTripNickname}
              contactInfo={contactInfo}
              onContactChange={setContactInfo}
            />
          </div>

          {/* Generate Button */}
          <GenerateItineraryButton isSubmitting={isGenerating} onClick={handleGenerateItinerary} />

          {/* Itinerary Results Section - Directly below the button */}
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

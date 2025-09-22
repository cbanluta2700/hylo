import { useState, useRef, useEffect } from 'react';
import TripDetails from './components/TripDetails';
import { FormData } from './components/TripDetails/types';
import ConditionalTravelStyle from './components/ConditionalTravelStyle';
import { TravelStyleChoice } from './types/travel-style-choice';
import ItineraryDisplay from './components/ItineraryDisplay';

function App() {
  const [formData, setFormData] = useState<FormData>({
    location: '',
    departDate: '',
    returnDate: '',
    flexibleDates: false,
    adults: 0, // Removed default value of 2
    children: 0, // Keep 0 as default (no children by default is reasonable)
    childrenAges: [],
    budget: 0, // Removed default value of 5000
    currency: 'USD', // Required by Currency type, but budget is 0
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

  // 🔍 HARD-CODED CONSOLE LOGS FOR VERCEL DEPLOYMENT
  const loggedSetFormData = (newFormData: FormData | ((prev: FormData) => FormData)) => {
    console.log('🔥 VERCEL AUDIT: Form data changing...');
    if (typeof newFormData === 'function') {
      setFormData((prev) => {
        const result = newFormData(prev);
        console.log('📝 VERCEL AUDIT: Form data updated (functional):', result);
        console.log('📊 VERCEL AUDIT: Key form fields:', {
          location: result.location,
          dates: `${result.departDate} → ${result.returnDate}`,
          travelers: `${result.adults} adults, ${result.children} children`,
          budget: `${result.currency} ${result.budget}`,
          groups: result.selectedGroups,
          interests: result.selectedInterests,
          travelStyleAnswers: result.travelStyleAnswers,
        });
        return result;
      });
    } else {
      console.log('📝 VERCEL AUDIT: Form data updated (direct):', newFormData);
      console.log('📊 VERCEL AUDIT: Key form fields:', {
        location: newFormData.location,
        dates: `${newFormData.departDate} → ${newFormData.returnDate}`,
        travelers: `${newFormData.adults} adults, ${newFormData.children} children`,
        budget: `${newFormData.currency} ${newFormData.budget}`,
        groups: newFormData.selectedGroups,
        interests: newFormData.selectedInterests,
        travelStyleAnswers: newFormData.travelStyleAnswers,
      });
      setFormData(newFormData);
    }
  };

  // Travel style choice state management
  const [travelStyleChoice, setTravelStyleChoice] = useState<TravelStyleChoice>(
    TravelStyleChoice.NOT_SELECTED
  );

  // Custom text inputs for "other" options (remaining for travel style components)
  const [customVibesText, setCustomVibesText] = useState<string>('');

  const [generatedItinerary, setGeneratedItinerary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string>('');
  const itineraryRef = useRef<HTMLDivElement>(null);

  // 🔍 PHASE 3 AUDIT: Monitor form data changes
  useEffect(() => {
    console.log('📝 Form data updated:', {
      location: formData.location,
      dates: { departDate: formData.departDate, returnDate: formData.returnDate },
      travelers: { adults: formData.adults, children: formData.children },
      budget: {
        amount: formData.budget,
        currency: formData.currency,
        flexible: formData.flexibleBudget,
      },
      groups: formData.selectedGroups,
      interests: formData.selectedInterests,
      travelStyleAnswers: formData.travelStyleAnswers,
    });
  }, [formData]);

  // Test API endpoints on app load
  useEffect(() => {
    const testAPIs = async () => {
      console.log('🚀 Testing API endpoints...');

      try {
        // Test health endpoint
        console.log('📞 Calling /api/health...');
        const healthResponse = await fetch('/api/health');
        const healthData = await healthResponse.json();
        console.log('🏥 Health endpoint response:', healthData);

        // Test environment validation endpoint
        console.log('📞 Calling /api/validate-env...');
        const envResponse = await fetch('/api/validate-env');
        const envData = await envResponse.json();
        console.log('🔧 Environment validation response:', envData);
      } catch (error) {
        console.error('❌ API call failed:', error);
      }
    };

    testAPIs();
  }, []);

  // Handle travel style choice selection
  const handleTravelStyleChoice = (choice: TravelStyleChoice) => {
    setTravelStyleChoice(choice);
  };

  const handleGenerateItinerary = async () => {
    setIsGenerating(true);
    setGenerationError('');
    setGeneratedItinerary(''); // Clear previous itinerary

    // 🔍 PHASE 3 AUDIT: Log existing form data structure
    console.group('📋 PHASE 3 AUDIT: Form Data Analysis');
    console.log('📊 Raw FormData from state:', formData);
    console.log('🎯 Travel Style Choice:', travelStyleChoice);
    console.log('🎪 Additional State:', {
      selectedExperience,
      selectedVibes,
      selectedSampleDays,
      dinnerChoices,
      tripNickname,
      contactInfo,
      customVibesText,
    });

    // Test our transformation functions
    try {
      const { transformExistingFormDataToWorkflow, transformFormDataForWorkflow } = await import(
        './utils/workflow-transforms'
      );
      const { validateTravelFormData } = await import('./schemas/ai-workflow-schemas');

      console.log('🔄 Testing form data transformation...');
      const transformedData = transformExistingFormDataToWorkflow(formData);
      console.log('✅ Transformed TravelFormData:', transformedData);

      const validationResult = validateTravelFormData(transformedData);
      console.log('🔍 Validation Result:', validationResult);
      console.log('🔍 VERCEL AUDIT: Validation details:', {
        success: validationResult.success,
        flexibleDates: transformedData.flexibleDates,
        departDate: transformedData.departDate,
        returnDate: transformedData.returnDate,
        hasErrors: !validationResult.success ? validationResult.error.errors : 'none',
      });

      if (validationResult.success) {
        console.log('✅ Validation passed! Data is valid for AI workflow');
        const workflowData = transformFormDataForWorkflow(transformedData);
        console.log('🚀 Final AI Workflow Data:', workflowData);
      } else {
        console.error('❌ Validation failed:', validationResult.error);
      }
    } catch (error) {
      console.error('❌ Transformation error:', error);
    }
    console.groupEnd();

    try {
      // Instead of calling AI/LLM, display the gathered form data organized by form sections
      const organizedFormData = {
        '1. Destination & Dates': {
          destination: formData.location,
          departureDate: formData.departDate,
          returnDate: formData.returnDate,
          flexibleDates: formData.flexibleDates,
          ...(formData.flexibleDates &&
            formData.plannedDays && {
              plannedDays: formData.plannedDays,
            }),
        },
        '2. Travelers': {
          adults: formData.adults,
          children: formData.children,
          childrenAges: formData.childrenAges,
        },
        '3. Budget': {
          flexibleBudget: formData.flexibleBudget,
          ...(formData.flexibleBudget
            ? {
                budgetNote: 'User indicated budget is flexible - specific amount not relevant',
              }
            : {
                amount: formData.budget,
                currency: formData.currency,
                budgetMode: formData.budgetMode,
              }),
        },
        '4. Travel Group': {
          selectedGroups: formData.selectedGroups,
          customGroupText: formData.customGroupText,
        },
        '5. Travel Interests': {
          selectedInterests: formData.selectedInterests,
          customInterestsText: formData.customInterestsText,
        },
        '6. Itinerary Inclusions': {
          selectedInclusions: formData.selectedInclusions,
          customInclusionsText: formData.customInclusionsText,
          inclusionPreferences: formData.inclusionPreferences,
        },
        '7. Travel Style Questions': {
          travelStyleChoice: travelStyleChoice,
          experience: formData.travelStyleAnswers?.['experience'] || [],
          vibes: formData.travelStyleAnswers?.['vibes'] || [],
          vibesOther: formData.travelStyleAnswers?.['vibesOther'],
          sampleDays: formData.travelStyleAnswers?.['sampleDays'] || [],
          dinnerChoices: formData.travelStyleAnswers?.['dinnerChoices'] || [],
        },
        '8. Contact & Trip Details': {
          tripNickname: formData.travelStyleAnswers?.['tripNickname'] || tripNickname,
          contactName: (formData as any)?.contactInfo?.name || (contactInfo as any)?.name || '',
          contactEmail: (formData as any)?.contactInfo?.email || (contactInfo as any)?.email || '',
        },
      };

      const debugItinerary = `
# 📋 Complete Form Data Review

${Object.entries(organizedFormData)
  .map(
    ([sectionTitle, sectionData]) => `
## ${sectionTitle}
\`\`\`json
${JSON.stringify(sectionData, null, 2)}
\`\`\`
`
  )
  .join('')}

---

**Note**: This is a debug view showing all collected form data organized by form sections. AI/LLM functionality has been temporarily disabled.

## Raw Complete Data Object
\`\`\`json
${JSON.stringify(organizedFormData, null, 2)}
\`\`\`
      `;

      setGeneratedItinerary(debugItinerary);

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

  return (
    <div className="min-h-screen bg-primary py-8 font-raleway">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Debug Panel - Only in development */}
          {process.env['NODE_ENV'] === 'development' && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
              <p className="font-bold">🔧 Debug Panel</p>
              <div className="mt-2 space-x-2">
                <button
                  onClick={async () => {
                    console.log('🧪 Manual API test...');
                    try {
                      const response = await fetch('/api/health');
                      const data = await response.json();
                      console.log('🏥 Health check result:', data);
                      alert(`Health check: ${data.status} - Check console for details`);
                    } catch (error) {
                      console.error('❌ Health check failed:', error);
                      alert('Health check failed - Check console');
                    }
                  }}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  Test Health API
                </button>
                <button
                  onClick={async () => {
                    console.log('🧪 Manual env validation test...');
                    try {
                      const response = await fetch('/api/validate-env');
                      const data = await response.json();
                      console.log('🔧 Environment validation result:', data);
                      alert(
                        `Env validation: ${data.success ? 'Success' : 'Failed'} - Check console`
                      );
                    } catch (error) {
                      console.error('❌ Env validation failed:', error);
                      alert('Env validation failed - Check console');
                    }
                  }}
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                >
                  Test Env API
                </button>
              </div>
            </div>
          )}

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
          <TripDetails
            formData={formData}
            onFormChange={loggedSetFormData}
            showAdditionalForms={true}
          />

          {/* ConditionalTravelStyle - Handles choice-based travel style display */}
          <ConditionalTravelStyle
            choice={travelStyleChoice}
            onChoiceChange={handleTravelStyleChoice}
            formData={formData}
            onFormChange={loggedSetFormData}
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
              <ItineraryDisplay
                itinerary={generatedItinerary}
                isLoading={isGenerating}
                error={generationError}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

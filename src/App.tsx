import { useState, useRef, useEffect } from 'react';
import TripDetails from './components/TripDetails';
import { FormData } from './components/TripDetails/types';
import ConditionalTravelStyle from './components/ConditionalTravelStyle';
import { TravelStyleChoice } from './types/travel-style-choice';
import ItineraryDisplayDirect from './components/ItineraryDisplayDirect';
import type { TravelFormData } from './types/travel-form';
import { AIDevtools } from '@ai-sdk-tools/devtools';

function App() {
  const [formData, setFormData] = useState<FormData>({
    location: '',
    departDate: '',
    returnDate: '',
    flexibleDates: false,
    adults: 2, // Empty string instead of number
    children: 0, // Empty string instead of number
    childrenAges: [],
    budget: 5000, // Empty string instead of number
    currency: 'USD', // Empty string instead of Currency type
    flexibleBudget: false,
    budgetMode: 'total', // Empty string instead of BudgetMode type
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
  const [transformedFormData, setTransformedFormData] = useState<TravelFormData | null>(null);

  // Clean form data setter without logging (logs only on Generate button click)
  const loggedSetFormData = (newFormData: FormData | ((prev: FormData) => FormData)) => {
    if (typeof newFormData === 'function') {
      setFormData(newFormData);
    } else {
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
  const [workflowId, setWorkflowId] = useState<string>('');
  const itineraryRef = useRef<HTMLDivElement>(null);

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
      
      // Enhanced form data with trip nickname and contact info
      const enhancedFormData = {
        ...formData,
        tripNickname,
        contactInfo,
        travelStyleAnswers: {
          ...formData.travelStyleAnswers,
          tripNickname: [tripNickname],
          contactInfo: [contactInfo],
          experience: selectedExperience,
          vibes: selectedVibes,
          sampleDays: selectedSampleDays,
          dinnerChoices: dinnerChoices,
        }
      };
      
      const transformedData = transformExistingFormDataToWorkflow(enhancedFormData);
      console.log('✅ Transformed TravelFormData:', transformedData);
      console.log('🔍 CRITICAL: Planned days calculation:', {
        originalPlannedDays: formData.plannedDays,
        transformedPlannedDays: transformedData.plannedDays,
        departDate: formData.departDate,
        returnDate: formData.returnDate,
        transformedDepartDate: transformedData.departDate,
        transformedReturnDate: transformedData.returnDate,
      });

      const validationResult = validateTravelFormData(transformedData);
      console.log('🔍 Validation Result:', validationResult);
      console.log('🔍 VERCEL AUDIT: Validation details:', {
        success: validationResult.success,
        flexibleDates: transformedData.flexibleDates,
        departDate: transformedData.departDate,
        returnDate: transformedData.returnDate,
        hasErrors: !validationResult.success ? validationResult.error.errors : 'none',
      });

      // Store transformed data for ItineraryDisplay component
      setTransformedFormData(transformedData);

      if (validationResult.success) {
        console.log('✅ Validation passed! Data is valid for AI workflow');
        const workflowData = transformFormDataForWorkflow(transformedData);
        console.log('🚀 Final AI Workflow Data:', workflowData);

        // 🚀 Phase 4: Call the actual API endpoint to trigger AI workflow
        console.log('🎯 [6] App: Calling /api/itinerary/generate to trigger Phase 4 workflow');

        try {
          const apiResponse = await fetch('/api/itinerary/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              formData: workflowData,
            }),
          });

          console.log('📡 [7] App: API response received', {
            status: apiResponse.status,
            statusText: apiResponse.statusText,
          });

          if (!apiResponse.ok) {
            const errorData = (await apiResponse.json()) as { error?: string };
            console.error('❌ [8] App: API error response', errorData);
            throw new Error(`API Error: ${errorData.error || 'Unknown error'}`);
          }

          const result = (await apiResponse.json()) as {
            success: boolean;
            workflowId: string;
            status: string;
            completed: boolean;
            itinerary?: any;
          };
          console.log('✅ [9] App: AI workflow initiated successfully', result);

          // Store the workflow ID
          setWorkflowId(result.workflowId);

          // If the workflow completed immediately with an itinerary, store it
          if (result.success && result.completed && result.itinerary) {
            console.log('🎉 [9B] App: Itinerary generated immediately!', result.itinerary);
            setGeneratedItinerary(result.itinerary);
          } else {
            // Show processing message if still working
            setGeneratedItinerary(`Processing... Workflow ID: ${result.workflowId}`);
          }
        } catch (apiError) {
          console.error('💥 [10] App: Failed to call AI workflow API', apiError);
          throw apiError;
        }
      } else {
        console.error('❌ Validation failed:', validationResult.error);
        console.error('❌ Form validation details:', {
          location: transformedData.location || 'MISSING',
          adults: transformedData.adults || 'MISSING/INVALID',
          children: transformedData.children,
          departDate: transformedData.departDate || 'MISSING',
          returnDate: transformedData.returnDate || 'MISSING',
          formDataAdults: formData.adults,
          formDataAdultsType: typeof formData.adults,
        });

        // Show validation error to user
        setGenerationError(`
❌ Form validation failed. Please check:

**Required fields missing or invalid:**
${Object.entries(validationResult.error.flatten().fieldErrors)
  .map(([field, errors]) => `• ${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
  .join('\n')}

**Current form data:**
• Location: "${formData.location}" ${formData.location ? '✅' : '❌ Required'}
• Adults: "${formData.adults}" (Type: ${typeof formData.adults}) ${
          formData.adults && typeof formData.adults === 'number' && formData.adults > 0
            ? '✅'
            : '❌ Must be a number > 0'
        }
• Children: "${formData.children}" ${
          typeof formData.children === 'number'
            ? '✅'
            : '⚠️ Optional but must be number if provided'
        }
• Departure: "${formData.departDate}" ${formData.departDate ? '✅' : '❌ Required'}
• Return: "${formData.returnDate}" ${formData.returnDate ? '✅' : '❌ Required'}

Please fill in all required fields with valid values and try again.
        `);
        throw new Error('Form validation failed - see details above');
      }
    } catch (error) {
      console.error('❌ Error during form processing or API call:', error);
      setGenerationError(`
❌ **Error generating itinerary:**

${error instanceof Error ? error.message : 'Unknown error occurred'}

**Troubleshooting:**
1. Check that all form fields are filled correctly
2. Ensure your internet connection is working
3. Try refreshing the page and filling the form again
4. Check the browser console for detailed error logs

**Need help?** Check the console logs above for more technical details.
      `);
    }
    console.groupEnd();

    setIsGenerating(false);
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
                      const data = (await response.json()) as { status?: string };
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
                      const data = (await response.json()) as { success?: boolean };
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
              <ItineraryDisplayDirect
                formData={transformedFormData}
                isLoading={isGenerating}
                error={generationError}
                aiItinerary={generatedItinerary}
              />
            )}
          </div>
        </div>
      </main>
      
      {/* AI SDK Tools for debugging AI workflows */}
      {process.env.NODE_ENV === 'development' && (
        <AIDevtools 
          config={{
            position: "bottom",
            height: 400
          }}
        />
      )}
    </div>
  );
}

export default App;

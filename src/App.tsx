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
    adults: '', // Empty string instead of number
    children: '', // Empty string instead of number
    childrenAges: [],
    budget: '', // Empty string instead of number
    currency: '', // Empty string instead of Currency type
    flexibleBudget: false,
    budgetMode: '', // Empty string instead of BudgetMode type
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
            const errorData = await apiResponse.json();
            console.error('❌ [8] App: API error response', errorData);
            throw new Error(`API Error: ${errorData.error || 'Unknown error'}`);
          }

          const result = await apiResponse.json();
          console.log('✅ [9] App: AI workflow initiated successfully', result);

          setGeneratedItinerary(`
# 🎉 AI Itinerary Generation Started!

Your personalized itinerary is being generated using our advanced AI agents:

## 🚀 Workflow Status
- **Workflow ID**: ${result.workflowId}
- **Estimated Completion**: ${Math.round(result.estimatedCompletionTime / 1000)} seconds
- **Status**: ${result.message}

## 🤖 AI Agent Pipeline
1. **🏗️ Architect Agent** - Designing your trip structure
2. **🌐 Gatherer Agent** - Collecting destination information  
3. **👨‍💼 Specialist Agent** - Processing recommendations
4. **📝 Formatter Agent** - Creating your final itinerary

Check your browser console to see the complete Phase 4 AI workflow logs (numbers 21-99)!

---
*Your itinerary will be displayed here once the AI agents complete processing.*
          `);
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

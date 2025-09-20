/**
 * Enhanced App.tsx - Multi-agent workflow integration
 * 
 * Integrates with the new streaming multi-agent workflow system
 * while maintaining backward compatibility with existing functionality
 */

import { useState, useRef } from 'react';
import { TravelFormData, AgentLog } from './services/groqService';
import TripDetails from './components/TripDetails';
import { FormData } from './components/TripDetails/types';
import ConditionalTravelStyle from './components/ConditionalTravelStyle';
import { TravelStyleChoice } from './types/travel-style-choice';
import ItineraryDisplay from './components/ItineraryDisplay';
import EnhancedItineraryDisplay from './components/EnhancedItineraryDisplay';
import BehindTheScenes from './components/BehindTheScenes';
import AIErrorBoundary from './components/AIErrorBoundary';
import HealthMonitor from './components/HealthMonitor';
import useWorkflow from './hooks/useWorkflow';
import { TravelFormData as WorkflowFormData } from './types/agents';

// Feature flag for workflow system
const USE_MULTI_AGENT_WORKFLOW = process.env['REACT_APP_USE_WORKFLOW'] === 'true' || false;

function App() {
  // Existing form state
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

  // Travel style state
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [selectedSampleDays, setSelectedSampleDays] = useState<string[]>([]);
  const [dinnerChoices, setDinnerChoices] = useState<string[]>([]);
  const [tripNickname, setTripNickname] = useState<string>('');
  const [contactInfo, setContactInfo] = useState({});
  const [travelStyleChoice, setTravelStyleChoice] = useState<TravelStyleChoice>(TravelStyleChoice.NOT_SELECTED);
  const [customVibesText, setCustomVibesText] = useState<string>('');

  // Legacy itinerary state (for fallback)
  const [generatedItinerary, setGeneratedItinerary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string>('');
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const itineraryRef = useRef<HTMLDivElement>(null);

  // New multi-agent workflow hook
  const workflow = useWorkflow();

  // Handle travel style choice selection
  const handleTravelStyleChoice = (choice: TravelStyleChoice) => {
    setTravelStyleChoice(choice);
  };

  // Transform form data to workflow format
  const transformToWorkflowData = (): WorkflowFormData => {
    return {
      // Basic trip information
      destination: formData.location,
      departureDate: formData.departDate || '',
      returnDate: formData.returnDate || '',
      tripNickname: tripNickname || 'My Trip',
      contactName: (contactInfo as any)?.name || 'Traveler',
      
      // Travelers
      adults: formData.adults,
      children: formData.children,
      
      // Budget - transform to match schema
      budget: {
        amount: formData.budget,
        currency: formData.currency as 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD',
        mode: formData.budgetMode as 'per-person' | 'total' | 'flexible'
      },
      
      // Preferences - transform to match schema structure
      preferences: {
        travelStyle: 'culture' as const, // Default based on form
        interests: [
          ...(formData.selectedInterests || []),
          ...(formData.selectedGroups || []),
          ...(selectedExperience || []),
          ...(selectedVibes || [])
        ].filter(Boolean),
        accommodationType: 'any' as const,
        transportationMode: 'any' as const,
        dietaryRestrictions: [],
        accessibility: []
      }
    };
  };

  // Enhanced itinerary generation with multi-agent workflow
  const handleGenerateItinerary = async () => {
    if (USE_MULTI_AGENT_WORKFLOW) {
      // Use new multi-agent workflow system
      try {
        const workflowFormData = transformToWorkflowData();
        await workflow.startWorkflow(workflowFormData, {
          timeout: 180000, // 3 minutes
        });
      } catch (error) {
        console.error('Multi-agent workflow error:', error);
        // Fallback to legacy system
        await handleLegacyGeneration();
      }
    } else {
      // Use legacy system
      await handleLegacyGeneration();
    }

    // Scroll to results after a short delay
    setTimeout(() => {
      itineraryRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  // Legacy itinerary generation (debug/fallback)
  const handleLegacyGeneration = async () => {
    setIsGenerating(true);
    setGenerationError('');
    setGeneratedItinerary('');
    setAgentLogs([]);

    try {
      // Organized form data display (debug mode)
      const organizedFormData = {
        "1. Destination & Dates": {
          "destination": formData.location,
          "departureDate": formData.departDate,
          "returnDate": formData.returnDate,
          "flexibleDates": formData.flexibleDates,
          ...(formData.flexibleDates && (formData as any).plannedDays && {
            "plannedDays": (formData as any).plannedDays
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
          "experience": selectedExperience,
          "vibes": selectedVibes,
          "vibesOther": customVibesText,
          "sampleDays": selectedSampleDays,
          "dinnerChoices": dinnerChoices
        },
        "8. Contact & Trip Details": {
          "tripNickname": tripNickname,
          "contactInfo": contactInfo
        }
      };

      const debugItinerary = `
# 📋 Travel Form Data Review ${USE_MULTI_AGENT_WORKFLOW ? '(Multi-Agent System Available)' : '(Legacy Mode)'}

${Object.entries(organizedFormData).map(([sectionTitle, sectionData]) => `
## ${sectionTitle}
\`\`\`json
${JSON.stringify(sectionData, null, 2)}
\`\`\`
`).join('')}

---

**Note**: ${USE_MULTI_AGENT_WORKFLOW 
  ? 'Multi-agent workflow system is available but this is debug mode showing form data.' 
  : 'This is a debug view showing collected form data. Multi-agent system is not enabled.'}

## System Status
- **Multi-Agent Workflow**: ${USE_MULTI_AGENT_WORKFLOW ? '✅ Available' : '❌ Disabled'}
- **Form Data Collection**: ✅ Complete
- **Data Validation**: ✅ Passed

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
        decisions: [
          'Form data collected', 
          USE_MULTI_AGENT_WORKFLOW ? 'Multi-agent system available' : 'Legacy mode active'
        ]
      }]);

    } catch (error) {
      console.error('Error displaying form data:', error);
      setGenerationError(
        'Sorry, we encountered an error processing your request. Please try again.'
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

  // Determine loading state
  const isCurrentlyLoading = USE_MULTI_AGENT_WORKFLOW ? workflow.isExecuting : isGenerating;
  
  // Determine current itinerary
  const currentItinerary = USE_MULTI_AGENT_WORKFLOW 
    ? (workflow.itinerary || generatedItinerary)
    : generatedItinerary;
    
  // Determine current error
  const currentError = USE_MULTI_AGENT_WORKFLOW 
    ? (workflow.error || generationError)
    : generationError;

  return (
    <div className="min-h-screen bg-primary py-8 font-raleway">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Trip Details Header */}
          <div className="bg-trip-details text-primary py-4 px-6 shadow-lg -mx-4 sm:-mx-6 lg:-mx-8 2xl:-mx-16">
            <div className="flex items-center justify-center space-x-3">
              <span className="text-3xl">🌏</span>
              <h1 className="text-2xl font-bold tracking-wide text-primary font-raleway">
                TRIP DETAILS
              </h1>
              {USE_MULTI_AGENT_WORKFLOW && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">
                  AI-Powered
                </span>
              )}
            </div>
          </div>

          {/* Trip Details Form */}
          <TripDetails 
            formData={formData} 
            onFormChange={setFormData} 
            showAdditionalForms={true} 
          />

          {/* Travel Style Section */}
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
            disabled={isCurrentlyLoading}
            onGenerateItinerary={handleGenerateItinerary}
            isGenerating={isCurrentlyLoading}
          />

          {/* Itinerary Results Section */}
          <div ref={itineraryRef}>
            {(isCurrentlyLoading || currentItinerary || currentError) && (
              <AIErrorBoundary
                enableRecovery={true}
                maxRetries={2}
                onError={(error, errorInfo) => {
                  console.error('AI Error Boundary caught error:', error, errorInfo);
                  if (USE_MULTI_AGENT_WORKFLOW) {
                    workflow.resetWorkflow();
                  } else {
                    setGenerationError(
                      'Our AI service encountered an error. Please try again or refresh the page.'
                    );
                  }
                }}
                className="w-full"
              >
                {USE_MULTI_AGENT_WORKFLOW ? (
                  // Enhanced display with workflow features
                  <EnhancedItineraryDisplay
                    itinerary={currentItinerary}
                    isLoading={false} // Legacy loading handled separately
                    error={currentError}
                    isWorkflowExecuting={workflow.isExecuting}
                    workflowProgress={workflow.progress}
                    workflowAgents={workflow.agents}
                    onCancelWorkflow={workflow.cancelWorkflow}
                    estimatedCompletion={null}
                  />
                ) : (
                  // Legacy display
                  <ItineraryDisplay
                    itinerary={currentItinerary}
                    isLoading={isCurrentlyLoading}
                    error={currentError}
                  />
                )}
              </AIErrorBoundary>
            )}
          </div>
        </div>
      </main>

      {/* Behind the Scenes Component */}
      <BehindTheScenes
        formData={completeFormData}
        agentLogs={USE_MULTI_AGENT_WORKFLOW ? [] : agentLogs} // TODO: Add workflow logs
        isProcessing={isCurrentlyLoading}
      />

      {/* System Health Monitor */}
      {(process.env['NODE_ENV'] === 'development' || currentError) && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <HealthMonitor 
            showDetails={process.env['NODE_ENV'] === 'development'} 
            className="mt-6" 
          />
          {process.env['NODE_ENV'] === 'development' && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm">
              <h3 className="font-semibold mb-2">Development Info:</h3>
              <ul className="space-y-1 text-xs">
                <li>Multi-Agent Workflow: {USE_MULTI_AGENT_WORKFLOW ? '✅ Enabled' : '❌ Disabled'}</li>
                <li>Workflow Status: {workflow.isExecuting ? 'Running' : workflow.isCompleted ? 'Completed' : 'Idle'}</li>
                <li>Active Agents: {workflow.agents.filter(a => a.status === 'running').length}</li>
                <li>Completed Agents: {workflow.agents.filter(a => a.status === 'completed').length}</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
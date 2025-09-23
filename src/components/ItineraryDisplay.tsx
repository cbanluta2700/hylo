import React, { useState, useEffect } from 'react';
import { Download, Mail, MapPin, AlertCircle, Clock } from 'lucide-react';
import ResilientLoading from './ResilientLoading';
import type { TravelFormData } from '../types/travel-form';

interface BaseFormProps {
  className?: string;
  onFormChange?: (data: any) => void;
}

interface ItineraryDisplayProps extends BaseFormProps {
  formData?: TravelFormData | null;
  isLoading: boolean;
  error?: string;
  workflowId?: string;
}

const PersonalizedItineraryTitle: React.FC = () => (
  <div className="text-center mb-6">
    <h1 className="text-3xl font-bold font-raleway">
      <span className="text-[#ece8de]">YOUR </span>
      <span className="text-[#f9dd8b]">PERSONALIZED </span>
      <span className="text-[#ece8de]">ITINERARY</span>
    </h1>
  </div>
);

const SectionHeader: React.FC<{ icon?: string; title: string; centered?: boolean }> = ({
  icon,
  title,
  centered = false,
}) => (
  <div className="bg-form-box rounded-[36px] p-6 shadow-lg border border-gray-200 mb-6">
    <h2
      className={`text-2xl font-bold text-primary font-raleway flex items-center ${
        centered ? 'justify-center' : ''
      }`}
    >
      {icon && <span className="mr-3">{icon}</span>}
      {title}
    </h2>
  </div>
);

const DayHeader: React.FC<{ title: string }> = ({ title }) => (
  <h2 className="text-xl font-bold font-raleway text-[#ece8de] mb-4">{title}</h2>
);

const TripDetailsContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">{children}</div>
);

const DetailBox: React.FC<{ title: string; content: string }> = ({ title, content }) => (
  <div className="bg-white border border-gray-300 rounded-lg p-4 text-center">
    <h3 className="font-bold text-gray-800 text-sm mb-2 font-raleway uppercase tracking-wide">
      {title}
    </h3>
    <p className="text-gray-700 text-sm font-raleway">{content}</p>
  </div>
);

const DailyContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-form-box border border-gray-300 rounded-lg p-6 mb-6">{children}</div>
);

const TipsContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white border border-gray-300 rounded-lg p-6">{children}</div>
);

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'Not specified';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const calculateBudgetPerPerson = (budget: any, adults: number, children: number) => {
  if (!budget || !budget.total) return 'Not specified';
  const totalTravelers = adults + children;
  if (totalTravelers === 0) return 'Not specified';
  const perPersonAmount = Math.round(budget.total / totalTravelers);
  return `${perPersonAmount} ${budget.currency || 'USD'} per person`;
};

const getDynamicColumns = (dayCount: number): string => {
  if (dayCount <= 2) return 'grid-cols-1 md:grid-cols-2';
  if (dayCount <= 3) return 'grid-cols-1 md:grid-cols-3';
  if (dayCount <= 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
  return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
};

const useAIItinerary = (workflowId?: string) => {
  const [aiItinerary, setAiItinerary] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [aiProgress, setAiProgress] = useState<any>(null);

  useEffect(() => {
    if (!workflowId) return;

    let pollAttempts = 0;
    const maxAttempts = 20; // Maximum polling attempts

    const pollForResults = async () => {
      setIsPolling(true);
      pollAttempts++;

      try {
        console.log(
          `🔍 [AI-Display] Polling attempt ${pollAttempts}/${maxAttempts} for results:`,
          workflowId
        );

        // Test route first
        try {
          const testResponse = await fetch('/api/itinerary/test-routing');
          console.log('🧪 [AI-Display] Test routing response:', await testResponse.text());
        } catch (testError) {
          console.log('🧪 [AI-Display] Test routing failed:', testError);
        }

        const response = await fetch(`/api/itinerary/get-itinerary?workflowId=${workflowId}`);
        console.log('📊 [AI-Display] Response status:', response.status);

        if (response.status === 404) {
          console.error('❌ [AI-Display] 404 Error - Endpoint not found');
          setErrorCount((prev) => prev + 1);

          // After 3 consecutive 404s, stop polling
          if (errorCount >= 3) {
            console.error('❌ [AI-Display] Too many 404 errors, stopping polling');
            setIsPolling(false);
            return;
          }

          setTimeout(pollForResults, 5000);
          return;
        }

        if (response.ok) {
          const result = (await response.json()) as {
            success?: boolean;
            itinerary?: any;
            aiProgress?: any;
            completed?: boolean;
          };
          console.log('📊 [AI-Display] Polling result:', result);

          // Update AI progress information
          if (result.aiProgress) {
            setAiProgress(result.aiProgress);
          }

          if (result.success && result.completed && result.itinerary) {
            setAiItinerary(result.itinerary);
            setIsPolling(false);
            return;
          }
        }

        // Continue polling if we haven't hit max attempts
        if (pollAttempts < maxAttempts) {
          setTimeout(pollForResults, 6000); // Poll every 6 seconds
        } else {
          console.error('❌ [AI-Display] Max polling attempts reached');
          setIsPolling(false);
        }
      } catch (error) {
        console.error('❌ [AI-Display] Polling error:', error);
        setTimeout(pollForResults, 8000);
        if (pollAttempts >= maxAttempts) {
          setIsPolling(false);
        }
      }
    };

    pollForResults();
  }, [workflowId, errorCount]);

  return { aiItinerary, isPolling, aiProgress };
};

const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({
  formData,
  isLoading,
  error,
  workflowId,
  className = '',
}) => {
  const { aiItinerary, isPolling, aiProgress } = useAIItinerary(workflowId);

  console.log('🎯 [AI-Display] Component state:', {
    isLoading,
    isPolling,
    hasFormData: !!formData,
    hasAiItinerary: !!aiItinerary,
    workflowId,
    error,
  });

  if (isLoading || isPolling) {
    const progressMessage = aiProgress
      ? `${aiProgress.description} (${aiProgress.aiModel})`
      : 'Our AI agents are crafting your perfect travel experience...';

    const stepInfo = aiProgress
      ? `Step ${
          aiProgress.stage === 'architect'
            ? '1'
            : aiProgress.stage === 'gatherer'
            ? '2'
            : aiProgress.stage === 'specialist'
            ? '3'
            : '4'
        }/4: ${aiProgress.step}`
      : 'Initializing AI workflow...';

    return (
      <div className="bg-form-box rounded-[36px] shadow-lg border border-gray-200 p-8">
        <ResilientLoading
          isLoading={true}
          loadingMessage={progressMessage}
          timeoutMessage={stepInfo}
          timeoutDuration={240000}
          onTimeout={() => console.log('AI workflow timeout')}
          className="mb-6"
        />

        {aiProgress && (
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">🤖 {aiProgress.aiModel}</span>
              <span className="text-sm text-gray-500">
                {Math.round(aiProgress.progress)}% complete
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${aiProgress.progress}%` }}
              ></div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">{aiProgress.description}</p>
              <p className="text-xs text-gray-500 mt-1">Current Stage: {aiProgress.step}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-[36px] p-6 shadow-lg animate-slideIn">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <div>
            <h3 className="text-lg font-bold text-red-800 font-raleway">AI Generation Error</h3>
            <p className="text-red-600 font-raleway mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-[36px] p-6 shadow-lg">
        <p className="text-yellow-700 font-raleway">No travel data available.</p>
      </div>
    );
  }

  const totalDays = aiItinerary?.dailySchedule?.length || formData.plannedDays || 3;
  const dynamicColumns = getDynamicColumns(totalDays);

  return (
    <div className={`animate-expandIn space-y-6 ${className}`}>
      <PersonalizedItineraryTitle />

      <SectionHeader
        title={`TRIP SUMMARY | "${
          formData.nickname || aiItinerary?.tripOverview?.destination || 'Amazing Trip'
        }"`}
        centered={true}
      />

      <TripDetailsContainer>
        <DetailBox
          title="Destination"
          content={aiItinerary?.tripOverview?.destination || formData.location || 'Not specified'}
        />
        <DetailBox
          title="Dates"
          content={`${formatDate(formData.departDate)} – ${formatDate(formData.returnDate)}`}
        />
        <DetailBox
          title="Travelers"
          content={`${formData.adults} adults${
            formData.children ? `, ${formData.children} children` : ''
          }`}
        />
        <DetailBox
          title="Budget"
          content={calculateBudgetPerPerson(formData.budget, formData.adults, formData.children)}
        />
        <DetailBox title="Prepared for" content={formData.nickname || 'Traveler'} />
      </TripDetailsContainer>

      <div className="bg-gray-100 rounded-lg p-8 text-center border border-gray-300">
        <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-medium font-raleway">
          Map of {aiItinerary?.tripOverview?.destination || formData.location}
        </p>
      </div>

      <SectionHeader icon="🗓️" title="DAILY ITINERARY" />

      <div className={`grid ${dynamicColumns} gap-6`}>
        {aiItinerary?.dailySchedule?.map((day: any) => (
          <div key={day.day}>
            <DayHeader title={`Day ${day.day} | ${formatDate(day.date)} | ${day.theme}`} />
            <DailyContainer>
              <div className="space-y-4">
                {day.morning && (
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2 font-raleway flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-blue-500" />
                      Morning ({day.morning.time})
                    </h4>
                    <div className="text-gray-700 text-sm font-raleway">
                      <p>
                        <strong>{day.morning.activity}</strong>
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{day.morning.location}</p>
                      <p className="text-xs text-green-600 mt-1">Cost: {day.morning.cost}</p>
                      {day.morning.tips && (
                        <p className="text-xs text-blue-600 mt-1">💡 {day.morning.tips}</p>
                      )}
                    </div>
                  </div>
                )}

                {day.afternoon && (
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2 font-raleway flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-orange-500" />
                      Afternoon ({day.afternoon.time})
                    </h4>
                    <div className="text-gray-700 text-sm font-raleway">
                      <p>
                        <strong>{day.afternoon.activity}</strong>
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{day.afternoon.location}</p>
                      <p className="text-xs text-green-600 mt-1">Cost: {day.afternoon.cost}</p>
                      {day.afternoon.tips && (
                        <p className="text-xs text-blue-600 mt-1">💡 {day.afternoon.tips}</p>
                      )}
                    </div>
                  </div>
                )}

                {day.evening && (
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2 font-raleway flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-purple-500" />
                      Evening ({day.evening.time})
                    </h4>
                    <div className="text-gray-700 text-sm font-raleway">
                      <p>
                        <strong>{day.evening.activity}</strong>
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{day.evening.location}</p>
                      <p className="text-xs text-green-600 mt-1">Cost: {day.evening.cost}</p>
                      {day.evening.tips && (
                        <p className="text-xs text-blue-600 mt-1">💡 {day.evening.tips}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                  <p className="text-green-800 text-sm font-raleway font-bold">
                    Day Budget: ${day.estimatedBudget}
                  </p>
                </div>
              </div>
            </DailyContainer>
          </div>
        )) || (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500 font-raleway">
              {aiProgress
                ? `🤖 ${aiProgress.aiModel} is ${aiProgress.description.toLowerCase()}`
                : '🤖 AI is generating your personalized itinerary...'}
            </p>
            {aiProgress && (
              <p className="text-xs text-gray-400 mt-2">
                Progress: {Math.round(aiProgress.progress)}% • {aiProgress.step}
              </p>
            )}
          </div>
        )}
      </div>

      <SectionHeader icon="💡" title="TIPS FOR YOUR TRIP" />
      <SectionHeader
        title={`Based on your interests in ${formData.interests?.join(', ')} for ${
          aiItinerary?.tripOverview?.destination || formData.location
        }`}
      />

      <TipsContainer>
        <div className="space-y-4">
          {aiItinerary?.practicalInfo?.localTips?.map((tip: string, index: number) => (
            <div key={index}>
              <h4 className="font-bold text-gray-800 mb-2 font-raleway">Tip {index + 1}:</h4>
              <p className="text-gray-700 text-sm font-raleway">{tip}</p>
            </div>
          )) || (
            <p className="text-gray-500 font-raleway">
              {aiProgress && aiProgress.stage === 'specialist'
                ? `🤖 ${aiProgress.aiModel} is curating personalized tips...`
                : '🤖 AI is generating personalized tips...'}
            </p>
          )}

          {aiItinerary?.practicalInfo?.packingTips && (
            <div className="mt-6">
              <h4 className="font-bold text-gray-800 mb-3 font-raleway">What to Pack</h4>
              <ul className="text-gray-700 text-sm space-y-1">
                {aiItinerary.practicalInfo.packingTips.map((item: string, index: number) => (
                  <li key={index} className="font-raleway">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </TipsContainer>

      <div className="bg-form-box rounded-[36px] p-6 shadow-lg border border-gray-200 animate-slideIn mt-8">
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => {
              const element = document.createElement('a');
              const content = aiItinerary
                ? JSON.stringify(aiItinerary, null, 2)
                : 'Itinerary generating...';
              const file = new Blob([content], {
                type: aiItinerary ? 'application/json' : 'text/plain',
              });
              element.href = URL.createObjectURL(file);
              element.download = `${formData.location}-itinerary.${aiItinerary ? 'json' : 'txt'}`;
              document.body.appendChild(element);
              element.click();
              document.body.removeChild(element);
            }}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-[36px] hover:bg-primary-dark transition-all duration-200 font-raleway font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Download className="h-5 w-5" />
            <span>Download Itinerary</span>
          </button>
          <button
            onClick={() => {
              const subject = encodeURIComponent('My AI-Generated Travel Itinerary');
              const body = encodeURIComponent(
                `Check out my personalized ${
                  aiItinerary?.tripOverview?.destination || formData.location
                } itinerary!`
              );
              window.open(`mailto:?subject=${subject}&body=${body}`);
            }}
            className="flex items-center justify-center space-x-2 px-6 py-3 border-2 border-primary text-primary rounded-[36px] hover:bg-primary hover:text-white transition-all duration-200 font-raleway font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Mail className="h-5 w-5" />
            <span>Share Itinerary</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItineraryDisplay;

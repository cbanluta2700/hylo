/**
 * Enhanced ItineraryDisplay - Multi-agent workflow integration
 * 
 * Updated to work with the new streaming multi-agent workflow system
 * Maintains existing visual design while adding workflow progress features
 */

import React, { useState, useEffect } from 'react';
import { Download, Mail, MapPin, Clock, DollarSign, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import ResilientLoading from './ResilientLoading';
import WorkflowProgressModal from './WorkflowProgressModal';
import { WorkflowProgress, AgentStatus } from '../services/workflow/WorkflowService';
import { useProgressPercentage, useEstimatedCompletion } from '../hooks/useWorkflow';

interface EnhancedItineraryDisplayProps {
  // Legacy props (maintained for compatibility)
  itinerary: string;
  isLoading: boolean;
  error?: string;
  
  // New workflow props
  isWorkflowExecuting?: boolean;
  workflowProgress?: WorkflowProgress | null;
  workflowAgents?: AgentStatus[];
  onCancelWorkflow?: () => void;
  
  // Enhanced features
  showProgressModal?: boolean;
  estimatedCompletion?: string | null;
}

const EnhancedItineraryDisplay: React.FC<EnhancedItineraryDisplayProps> = ({
  itinerary,
  isLoading: legacyLoading = false,
  error,
  isWorkflowExecuting = false,
  workflowProgress,
  workflowAgents = [],
  onCancelWorkflow,
  showProgressModal = true,
  estimatedCompletion
}) => {
  const [showModal, setShowModal] = useState(false);
  
  // Determine if we're using the new workflow system or legacy loading
  const isLoading = legacyLoading || isWorkflowExecuting;
  
  // Calculate progress percentage
  const progressPercentage = useProgressPercentage(workflowProgress);
  const estimatedTime = useEstimatedCompletion(workflowProgress) || estimatedCompletion;

  // Auto-show modal when workflow starts
  useEffect(() => {
    if (isWorkflowExecuting && showProgressModal) {
      setShowModal(true);
    }
  }, [isWorkflowExecuting, showProgressModal]);

  // Auto-hide modal when workflow completes
  useEffect(() => {
    if (!isWorkflowExecuting && showModal) {
      const timer = setTimeout(() => setShowModal(false), 2000); // Delay to show completion
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isWorkflowExecuting, showModal]);

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([itinerary], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'my-travel-itinerary.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('My Personalized Travel Itinerary');
    const body = encodeURIComponent(itinerary);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleCancelWorkflow = () => {
    onCancelWorkflow?.();
    setShowModal(false);
  };

  const formatItinerary = (text: string) => {
    // Split the text into sections
    const sections = text.split(/(?=🌟|📅|🏨|🍽️|🚗|💰|🎒|📱|✨)/);

    return sections.map((section, index) => {
      if (!section.trim()) return null;

      // Check if this is a major section header
      const isHeader =
        section.startsWith('🌟') ||
        section.startsWith('📅') ||
        section.startsWith('🏨') ||
        section.startsWith('🍽️') ||
        section.startsWith('🚗') ||
        section.startsWith('💰') ||
        section.startsWith('🎒') ||
        section.startsWith('📱') ||
        section.startsWith('✨');

      if (isHeader) {
        const lines = section.split('\n');
        const headerLine = lines[0];
        const content = lines.slice(1).join('\n');

        return (
          <div
            key={index}
            className="mb-8 animate-slideIn"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <h3 className="text-xl font-bold text-primary mb-4 pb-2 border-b-2 border-primary/20">
              {headerLine}
            </h3>
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {formatContent(content)}
            </div>
          </div>
        );
      }

      return (
        <div
          key={index}
          className="whitespace-pre-wrap text-gray-700 leading-relaxed mb-4 animate-slideIn"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {formatContent(section)}
        </div>
      );
    });
  };

  const formatContent = (content: string) => {
    // Format bold text (text between **)
    let formatted = content.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="text-primary font-bold">$1</strong>'
    );

    // Format bullet points
    formatted = formatted.replace(/^- /gm, '• ');

    // Format time patterns (e.g., 9:00 AM)
    formatted = formatted.replace(
      /\b(\d{1,2}:\d{2}\s*[AP]M)\b/g,
      '<span class="text-[#f68854] font-bold">$1</span>'
    );

    // Format money amounts
    formatted = formatted.replace(/\$[\d,]+/g, '<span class="text-green-600 font-bold">$&</span>');

    return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <div className="animate-expandIn">
      <div className="space-y-6">
        {/* Loading State - Enhanced with Workflow Progress */}
        {isLoading && (
          <>
            {isWorkflowExecuting && workflowProgress ? (
              // New multi-agent workflow loading
              <div className="bg-form-box rounded-[36px] shadow-lg border border-gray-200 p-6">
                <div className="text-center border-b-2 border-primary/20 pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-primary font-raleway flex items-center justify-center">
                    <MapPin className="h-6 w-6 mr-2" />
                    AI Agents Creating Your Itinerary
                    <span className="ml-2">🤖</span>
                  </h2>
                </div>

                {/* Workflow Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      {workflowProgress.currentAgent} Agent Active
                    </span>
                    <span className="text-sm text-gray-600">
                      {progressPercentage}% Complete
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-primary to-[#f68854] h-full transition-all duration-1000 ease-out"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  
                  {estimatedTime && (
                    <div className="flex items-center justify-center mt-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      {estimatedTime} remaining
                    </div>
                  )}
                </div>

                {/* Quick Agent Status */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {workflowAgents.map((agent) => (
                    <div key={agent.id} className="text-center">
                      <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                        agent.status === 'completed' ? 'bg-green-500' :
                        agent.status === 'running' ? 'bg-blue-500 animate-pulse' :
                        agent.status === 'error' ? 'bg-red-500' : 'bg-gray-300'
                      }`} />
                      <div className="text-xs text-gray-600">{agent.name}</div>
                    </div>
                  ))}
                </div>

                {/* Show Detailed Progress Button */}
                <div className="text-center mt-6">
                  <button
                    onClick={() => setShowModal(true)}
                    className="text-primary hover:text-primary-dark underline text-sm font-semibold"
                  >
                    View Detailed Progress
                  </button>
                </div>
              </div>
            ) : (
              // Legacy loading fallback
              <ResilientLoading
                isLoading={isLoading}
                loadingMessage="Creating your perfect travel experience..."
                timeoutMessage="Our AI agents are working hard on your personalized itinerary. High demand may be causing delays."
                timeoutDuration={45000}
                onTimeout={() => {
                  console.log('Itinerary generation timeout detected');
                }}
                className="bg-form-box rounded-[36px] shadow-lg border border-gray-200"
              />
            )}
          </>
        )}

        {/* Error State - Enhanced for Workflow Errors */}
        {error && !isLoading && (
          <div className="bg-red-50 border-2 border-red-200 rounded-[36px] p-6 shadow-lg animate-slideIn">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-800 font-raleway">
                  {isWorkflowExecuting ? 'Workflow Error' : 'Oops! Something went wrong'}
                </h3>
                <p className="text-red-600 font-raleway mt-1">{error}</p>
                {isWorkflowExecuting && (
                  <p className="text-red-500 text-sm mt-2">
                    One of our AI agents encountered an issue. Please try again.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success State - Enhanced with Workflow Completion */}
        {itinerary && !isLoading && !error && (
          <>
            {/* Header Section */}
            <div className="bg-form-box rounded-[36px] p-6 shadow-lg border border-gray-200 animate-slideIn">
              <div className="text-center border-b-2 border-primary/20 pb-4">
                <h2 className="text-2xl font-bold text-primary font-raleway flex items-center justify-center">
                  <MapPin className="h-6 w-6 mr-2" />
                  Your Personalized Itinerary
                  <span className="ml-2">✨</span>
                </h2>
              </div>

              {/* Success Message - Enhanced for Workflow */}
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mt-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="text-green-700 font-bold font-raleway">
                      Your personalized itinerary is ready!
                    </p>
                    {isWorkflowExecuting === false && workflowAgents.length > 0 && (
                      <p className="text-green-600 text-sm mt-1">
                        Created by our team of {workflowAgents.filter(a => a.status === 'completed').length} AI agents
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Itinerary Content - Maintains existing design */}
            <div className="space-y-4">
              {itinerary.split(/(?=🌟|📅|🏨|🍽️|🚗|💰|🎒|📱|✨)/).map((section, index) => {
                if (!section.trim()) return null;

                const lines = section.split('\n');
                const headerLine = lines[0];
                const content = lines.slice(1).join('\n');

                // Check if this section has an emoji header
                const hasEmojiHeader = /^[🌟📅🏨🍽️🚗💰🎒📱✨]/.test(section);

                if (hasEmojiHeader) {
                  return (
                    <div
                      key={index}
                      className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md animate-slideIn"
                      style={{ animationDelay: `${index * 150}ms` }}
                    >
                      <h3 className="text-xl font-bold text-primary mb-4 pb-2 border-b-2 border-primary/20">
                        {headerLine}
                      </h3>
                      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                        {formatContent(content)}
                      </div>
                    </div>
                  );
                }

                // For non-header content
                return (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md animate-slideIn"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {formatContent(section)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons - Maintains existing design */}
            <div
              className="bg-form-box rounded-[36px] p-6 shadow-lg border border-gray-200 animate-slideIn"
              style={{ animationDelay: '300ms' }}
            >
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-[36px] hover:bg-primary-dark transition-all duration-200 font-raleway font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Download className="h-5 w-5" />
                  <span>Download Itinerary</span>
                </button>
                <button
                  onClick={handleEmail}
                  className="flex items-center justify-center space-x-2 px-6 py-3 border-2 border-primary text-primary rounded-[36px] hover:bg-primary hover:text-white transition-all duration-200 font-raleway font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Mail className="h-5 w-5" />
                  <span>Email to Myself</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Workflow Progress Modal */}
        <WorkflowProgressModal
          isOpen={showModal}
          progress={workflowProgress}
          agents={workflowAgents}
          onCancel={handleCancelWorkflow}
          estimatedCompletion={estimatedTime}
        />
      </div>
    </div>
  );
};

export default EnhancedItineraryDisplay;
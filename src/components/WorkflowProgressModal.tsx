/**
 * WorkflowProgressModal - Real-time workflow execution progress display
 * 
 * Shows streaming updates from the multi-agent system with agent status indicators
 * Based on latest LangGraph streaming patterns from Context7 MCP server
 */

import React, { useEffect, useState } from 'react';
import { X, Clock, CheckCircle, AlertCircle, Loader2, Brain, Search, Target, FileText } from 'lucide-react';
import { WorkflowProgress, AgentStatus } from '../services/workflow/WorkflowService';

interface WorkflowProgressModalProps {
  isOpen: boolean;
  progress: WorkflowProgress | null;
  agents: AgentStatus[];
  onCancel: () => void;
  estimatedCompletion?: string | null;
  className?: string;
}

export const WorkflowProgressModal: React.FC<WorkflowProgressModalProps> = ({
  isOpen,
  progress,
  agents,
  onCancel,
  estimatedCompletion,
  className = ''
}) => {
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'active' | 'exit'>('enter');

  useEffect(() => {
    if (isOpen) {
      setAnimationPhase('enter');
      const timer = setTimeout(() => setAnimationPhase('active'), 100);
      return () => clearTimeout(timer);
    } else {
      setAnimationPhase('exit');
      return undefined;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Agent icon mapping
  const getAgentIcon = (agentName: string) => {
    switch (agentName) {
      case 'ContentPlanner': return Brain;
      case 'InfoGatherer': return Search;
      case 'Strategist': return Target;
      case 'Compiler': return FileText;
      default: return Loader2;
    }
  };

  // Agent description mapping
  const getAgentDescription = (agentName: string) => {
    switch (agentName) {
      case 'ContentPlanner': 
        return 'Analyzing your travel preferences and requirements';
      case 'InfoGatherer': 
        return 'Collecting real-time destination information and recommendations';
      case 'Strategist': 
        return 'Optimizing your itinerary for the best experience within budget';
      case 'Compiler': 
        return 'Assembling your personalized travel itinerary';
      default: 
        return 'Processing...';
    }
  };

  // Status color mapping
  const getStatusColor = (status: AgentStatus['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'running': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Status icon mapping  
  const getStatusIcon = (status: AgentStatus['status']) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'running': return Loader2;
      case 'error': return AlertCircle;
      default: return Clock;
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    const seconds = Math.round(duration / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${className}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          animationPhase === 'active' ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={onCancel}
      />

      {/* Modal */}
      <div 
        role="dialog"
        aria-labelledby="workflow-progress-title"
        aria-describedby="workflow-progress-description"
        className={`
          relative bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto
          transform transition-all duration-300 ease-out
          ${animationPhase === 'active' 
            ? 'scale-100 opacity-100' 
            : 'scale-95 opacity-0'
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 
              id="workflow-progress-title"
              className="text-2xl font-bold text-primary font-raleway"
            >
              Creating Your Personalized Itinerary
            </h2>
            <p 
              id="workflow-progress-description"
              className="text-gray-600 mt-1"
            >
              Our AI agents are working together to plan your perfect trip
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Cancel workflow"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Overall Progress */}
        {progress && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">
                Overall Progress
              </span>
              <span className="text-sm text-gray-600">
                Step {progress.currentStep} of {progress.totalSteps}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-primary to-[#f68854] h-full transition-all duration-1000 ease-out"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
              <span>{progress.progress}% complete</span>
              <div className="flex items-center space-x-4">
                {progress.currentAgent && progress.currentAgent !== 'Unknown' && (
                  <span className="text-primary font-medium">
                    {progress.currentAgent}
                  </span>
                )}
                {estimatedCompletion && (
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {estimatedCompletion}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Agent Status Cards */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Agent Status</h3>
          
          {agents.map((agent) => {
            const IconComponent = getAgentIcon(agent.name);
            const StatusIcon = getStatusIcon(agent.status);
            const statusColor = getStatusColor(agent.status);
            
            return (
              <div 
                key={agent.id}
                className={`
                  p-4 rounded-xl border-2 transition-all duration-500
                  ${statusColor}
                  ${agent.status === 'running' ? 'animate-pulse' : ''}
                `}
              >
                <div className="flex items-start space-x-4">
                  {/* Agent Icon */}
                  <div className="flex-shrink-0">
                    <IconComponent 
                      className={`h-8 w-8 ${
                        agent.status === 'running' ? 'animate-spin' : ''
                      }`} 
                    />
                  </div>
                  
                  {/* Agent Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold">
                        {agent.name}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <StatusIcon className="h-5 w-5" />
                        <span className="text-sm font-medium capitalize">
                          {agent.status}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm mt-1 opacity-80">
                      {getAgentDescription(agent.name)}
                    </p>
                    
                    {/* Timing Information */}
                    <div className="flex items-center space-x-4 mt-2 text-xs">
                      {agent.startTime && (
                        <span>
                          Started: {new Date(agent.startTime).toLocaleTimeString()}
                        </span>
                      )}
                      {agent.duration && (
                        <span>
                          Duration: {formatDuration(agent.duration)}
                        </span>
                      )}
                    </div>
                    
                    {/* Error Message */}
                    {agent.error && (
                      <div className="mt-2 p-2 bg-red-100 rounded text-red-700 text-sm">
                        Error: {agent.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Powered by advanced AI agents working in harmony
            </div>
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowProgressModal;
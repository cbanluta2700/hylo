/**
 * Real-Time Itinerary Generation Progress
 * Simple progress indicator for AI workflow
 */

import React, { useState, useEffect } from 'react';

interface ItineraryProgressProps {
  workflowId: string;
  formData: any;
}

export function ItineraryProgress({ workflowId, formData }: ItineraryProgressProps) {
  const [currentPhase, setCurrentPhase] = useState<
    'architect' | 'gatherer' | 'specialist' | 'formatter'
  >('architect');
  const [progress, setProgress] = useState(0);

  const phases = ['architect', 'gatherer', 'specialist', 'formatter'];

  // Simulate progress updates (in real app, this would poll the API)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        const newProgress = prev + 2;

        // Update phase based on progress
        if (newProgress > 25 && currentPhase === 'architect') {
          setCurrentPhase('gatherer');
        } else if (newProgress > 50 && currentPhase === 'gatherer') {
          setCurrentPhase('specialist');
        } else if (newProgress > 75 && currentPhase === 'specialist') {
          setCurrentPhase('formatter');
        }

        return newProgress;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPhase]);

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'architect':
        return '🏗️';
      case 'gatherer':
        return '🌐';
      case 'specialist':
        return '👨‍💼';
      case 'formatter':
        return '📝';
      default:
        return '🤖';
    }
  };

  const getPhaseTitle = (phase: string) => {
    switch (phase) {
      case 'architect':
        return 'Planning Structure';
      case 'gatherer':
        return 'Gathering Info';
      case 'specialist':
        return 'Processing Ideas';
      case 'formatter':
        return 'Final Touches';
      default:
        return 'Processing';
    }
  };

  return (
    <div className="space-y-6 bg-form-box rounded-[36px] p-6 shadow-lg border border-gray-200">
      <div className="text-center">
        <h3 className="text-xl font-bold font-raleway mb-2">
          Creating Your {formData.location || 'Travel'} Adventure...
        </h3>
        <p className="text-gray-600 text-sm">Workflow ID: {workflowId.substring(0, 8)}...</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-primary rounded-full h-3 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="text-center text-sm text-gray-600">{progress}% Complete</div>

      {/* Phase Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {phases.map((phase) => {
          const isActive = currentPhase === phase;
          const isCompleted = phases.indexOf(currentPhase) > phases.indexOf(phase);

          return (
            <div
              key={phase}
              className={`p-4 rounded-lg text-center transition-all duration-300 ${
                isActive
                  ? 'bg-blue-100 border-2 border-blue-300 scale-105'
                  : isCompleted
                  ? 'bg-green-100 border border-green-300'
                  : 'bg-gray-100 border border-gray-300'
              }`}
            >
              <div className={`text-2xl mb-2 ${isActive ? 'animate-bounce' : ''}`}>
                {getPhaseIcon(phase)}
              </div>
              <div className="text-sm font-medium font-raleway">{getPhaseTitle(phase)}</div>
              {isActive && <div className="text-xs text-blue-600 mt-1">Processing...</div>}
              {isCompleted && <div className="text-xs text-green-600 mt-1">✓ Complete</div>}
            </div>
          );
        })}
      </div>

      {/* Current Status */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-bold text-gray-800 mb-2 font-raleway flex items-center">
          <span className="mr-2">{getPhaseIcon(currentPhase)}</span>
          {getPhaseTitle(currentPhase)}
        </h4>
        <p className="text-gray-600 text-sm">
          {currentPhase === 'architect' && 'Designing your trip structure and daily themes...'}
          {currentPhase === 'gatherer' &&
            'Collecting destination information and local insights...'}
          {currentPhase === 'specialist' &&
            'Processing recommendations and creating personalized suggestions...'}
          {currentPhase === 'formatter' && 'Finalizing your itinerary with all the details...'}
        </p>
      </div>
    </div>
  );
}

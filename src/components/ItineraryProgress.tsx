/**
 * Real-Time Itinerary Generation with AI SDK React
 *
 * This component demonstrates how to integrate AI SDK React hooks
 * for real-time progress updates during AI workflow execution
 */

import React, { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

interface ItineraryProgressProps {
  workflowId: string;
  formData: any;
}

export function ItineraryProgress({ workflowId, formData }: ItineraryProgressProps) {
  const [currentPhase, setCurrentPhase] = useState('architect');

  const { messages, sendMessage, isLoading } = useChat({
    id: `itinerary-${workflowId}`,
    transport: new DefaultChatTransport({
      api: '/api/ai-progress',
    }),
    onMessage: (message) => {
      // Parse AI agent progress updates
      if (message.content.includes('🏗️ Architect Agent:')) {
        setCurrentPhase('gatherer');
      } else if (message.content.includes('🌐 Gatherer Agent:')) {
        setCurrentPhase('specialist');
      } else if (message.content.includes('👨‍💼 Specialist Agent:')) {
        setCurrentPhase('formatter');
      }
    },
    onFinish: ({ message }) => {
      console.log('✅ Itinerary generation completed:', message);
    },
  });

  // Start the AI progress stream
  useEffect(() => {
    sendMessage({
      text: `Generate itinerary for ${formData.location}`,
      parts: [
        {
          type: 'text',
          text: JSON.stringify({ workflowId, formData }),
        },
      ],
    });
  }, [workflowId]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Creating Your Italy Adventure...</h3>

      {/* Phase Progress */}
      <div className="flex space-x-4">
        {['architect', 'gatherer', 'specialist', 'formatter'].map((phase) => (
          <div
            key={phase}
            className={`flex-1 p-3 rounded-lg ${
              currentPhase === phase
                ? 'bg-blue-100'
                : phases.indexOf(currentPhase) > phases.indexOf(phase)
                ? 'bg-green-100'
                : 'bg-gray-100'
            }`}
          >
            {phase === 'architect' && '🏗️ Planning Structure'}
            {phase === 'gatherer' && '🌐 Gathering Info'}
            {phase === 'specialist' && '👨‍💼 Processing Ideas'}
            {phase === 'formatter' && '📝 Final Touches'}
          </div>
        ))}
      </div>

      {/* Live AI Messages */}
      <div className="h-64 overflow-y-auto bg-gray-50 p-4 rounded-lg">
        {messages.map((message, index) => (
          <div key={index} className="mb-2">
            <div className="text-sm text-gray-600">
              {message.parts.map((part, i) => {
                if (part.type === 'text') {
                  return <div key={i}>{part.text}</div>;
                }
                return null;
              })}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">AI agents working...</span>
          </div>
        )}
      </div>
    </div>
  );
}

const phases = ['architect', 'gatherer', 'specialist', 'formatter'];

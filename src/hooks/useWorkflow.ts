/**
 * useWorkflow - React hook for managing multi-agent workflow execution
 * 
 * Provides streaming workflow execution with real-time progress updates
 * Based on latest LangGraph patterns from Context7 MCP server
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { TravelFormData } from '../types/agents';
import {
  WorkflowService,
  WorkflowProgress,
  AgentStatus,
  WorkflowResult,
  StreamingWorkflowOptions
} from '../services/workflow/WorkflowService';
import { MockWorkflowService } from '../services/workflow/MockWorkflowService';

// Use mock service in development when API is not available
const USE_MOCK_SERVICE = process.env['NODE_ENV'] === 'development';

export interface UseWorkflowState {
  // Execution state
  isExecuting: boolean;
  isCompleted: boolean;
  error: string | null;
  
  // Progress tracking
  progress: WorkflowProgress | null;
  agents: AgentStatus[];
  
  // Results
  itinerary: string | null;
  metadata: Record<string, any> | null;
  
  // Control methods
  startWorkflow: (formData: TravelFormData, options?: StreamingWorkflowOptions) => Promise<void>;
  cancelWorkflow: () => void;
  resetWorkflow: () => void;
  
  // Real-time updates
  lastAgentUpdate: AgentStatus | null;
  lastProgressUpdate: WorkflowProgress | null;
}

export function useWorkflow(): UseWorkflowState {
  // Core state
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Progress state
  const [progress, setProgress] = useState<WorkflowProgress | null>(null);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  
  // Results state
  const [itinerary, setItinerary] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Record<string, any> | null>(null);
  
  // Real-time update state
  const [lastAgentUpdate, setLastAgentUpdate] = useState<AgentStatus | null>(null);
  const [lastProgressUpdate, setLastProgressUpdate] = useState<WorkflowProgress | null>(null);
  
  // Service instance ref - use mock in development
  const workflowServiceRef = useRef(
    USE_MOCK_SERVICE 
      ? new MockWorkflowService() 
      : new WorkflowService()
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      workflowServiceRef.current.cancelWorkflow();
    };
  }, []);

  // Progress callback handler
  const handleProgress = useCallback((progressUpdate: WorkflowProgress) => {
    setProgress(progressUpdate);
    setLastProgressUpdate(progressUpdate);
    setAgents(progressUpdate.agents);
  }, []);

  // Agent status callback handler
  const handleAgentStatus = useCallback((agent: AgentStatus) => {
    setLastAgentUpdate(agent);
    
    // Update agents array
    setAgents(currentAgents => {
      const updatedAgents = [...currentAgents];
      const existingIndex = updatedAgents.findIndex(a => a.id === agent.id);
      
      if (existingIndex >= 0) {
        updatedAgents[existingIndex] = agent;
      } else {
        updatedAgents.push(agent);
      }
      
      return updatedAgents;
    });
  }, []);

  // Error callback handler
  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setIsExecuting(false);
    console.error('Workflow execution error:', errorMessage);
  }, []);

  // Completion callback handler
  const handleComplete = useCallback((result: WorkflowResult) => {
    setIsExecuting(false);
    setIsCompleted(true);
    
    if (result.success) {
      setItinerary(result.itinerary || null);
      setMetadata(result.metadata || null);
      setError(null);
    } else {
      setError(result.error || 'Unknown completion error');
    }
  }, []);

  // Main workflow execution method
  const startWorkflow = useCallback(async (
    formData: TravelFormData,
    options: StreamingWorkflowOptions = {}
  ) => {
    try {
      // Reset state
      setIsExecuting(true);
      setIsCompleted(false);
      setError(null);
      setProgress(null);
      setAgents([]);
      setItinerary(null);
      setMetadata(null);
      setLastAgentUpdate(null);
      setLastProgressUpdate(null);

      // Set up streaming options with our callbacks
      const streamingOptions: StreamingWorkflowOptions = {
        onProgress: handleProgress,
        onAgentStatus: handleAgentStatus,
        onError: handleError,
        onComplete: handleComplete,
        ...options // Allow override of defaults
      };

      // Start streaming workflow
      const result = await workflowServiceRef.current.startStreamingWorkflow(
        formData,
        streamingOptions
      );

      // Handle successful completion (if not already handled by onComplete)
      if (result && !isCompleted) {
        setItinerary(result);
        setIsCompleted(true);
        setIsExecuting(false);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown workflow error';
      handleError(errorMessage);
    }
  }, [handleProgress, handleAgentStatus, handleError, handleComplete, isCompleted]);

  // Cancel workflow execution
  const cancelWorkflow = useCallback(() => {
    workflowServiceRef.current.cancelWorkflow();
    setIsExecuting(false);
    setError('Workflow cancelled by user');
  }, []);

  // Reset workflow state
  const resetWorkflow = useCallback(() => {
    workflowServiceRef.current.cancelWorkflow();
    
    setIsExecuting(false);
    setIsCompleted(false);
    setError(null);
    setProgress(null);
    setAgents([]);
    setItinerary(null);
    setMetadata(null);
    setLastAgentUpdate(null);
    setLastProgressUpdate(null);
  }, []);

  // Return hook interface
  return {
    // State
    isExecuting,
    isCompleted,
    error,
    progress,
    agents,
    itinerary,
    metadata,
    lastAgentUpdate,
    lastProgressUpdate,
    
    // Methods
    startWorkflow,
    cancelWorkflow,
    resetWorkflow
  };
}

// Additional utility hook for agent-specific status
export function useAgentStatus(agentName: string, agents: AgentStatus[]): AgentStatus | null {
  return agents.find(agent => agent.name === agentName) || null;
}

// Utility hook for progress percentage calculation
export function useProgressPercentage(progress: WorkflowProgress | null): number {
  if (!progress) return 0;
  return Math.max(0, Math.min(100, progress.progress));
}

// Utility hook for estimated completion time
export function useEstimatedCompletion(progress: WorkflowProgress | null): string | null {
  if (!progress?.estimatedTimeRemaining) return null;
  
  const minutes = Math.ceil(progress.estimatedTimeRemaining / 60000);
  if (minutes <= 1) return 'Less than a minute';
  if (minutes < 60) return `About ${minutes} minutes`;
  
  const hours = Math.ceil(minutes / 60);
  return `About ${hours} hour${hours > 1 ? 's' : ''}`;
}

export default useWorkflow;
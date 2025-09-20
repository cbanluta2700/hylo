/**
 * React Workflow Hooks
 * 
 * React integration hooks for the workflow system, managing state, subscriptions,
 * and real-time updates. Provides a React-friendly interface for workflow sessions
 * with automatic cleanup and state synchronization.
 * 
 * Features:
 * - Workflow session management
 * - Real-time progress updates
 * - Automatic error handling and retry
 * - React state synchronization
 * - Automatic cleanup on unmount
 * - TypeScript support with proper typing
 * 
 * @module WorkflowHooks
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { WorkflowClient } from '../services/workflow/client';
import type {
  SessionInfo,
  WorkflowResult,
  ProgressUpdate,
  AgentStatusUpdate,
  WorkflowError,
  EventListeners,
  SessionCreationOptions,
  WorkflowClientConfig
} from '../services/workflow/client';
import { WorkflowState, AgentType, type TravelFormData } from '../types/agents';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Workflow session hook state
 */
export interface WorkflowSessionState {
  session: SessionInfo | null;
  result: WorkflowResult | null;
  isLoading: boolean;
  isStreaming: boolean;
  error: WorkflowError | null;
  progress: {
    percentage: number;
    currentAgent: AgentType | null;
    estimatedTimeRemaining: number;
    completedAgents: AgentType[];
    failedAgents: AgentType[];
  };
  metadata: {
    totalCost: number;
    elapsedTime: number;
    retryCount: number;
    lastUpdated: string;
  };
}

/**
 * Workflow session hook actions
 */
export interface WorkflowSessionActions {
  createSession: (formData: TravelFormData, options?: Partial<SessionCreationOptions>) => Promise<void>;
  cancelSession: (reason?: string, graceful?: boolean) => Promise<void>;
  getResult: (format?: 'json' | 'formatted' | 'summary') => Promise<void>;
  retry: () => Promise<void>;
  clearError: () => void;
  refresh: () => Promise<void>;
}

/**
 * Workflow session hook return value
 */
export type UseWorkflowSessionReturn = WorkflowSessionState & WorkflowSessionActions;

/**
 * Hook options
 */
export interface UseWorkflowSessionOptions {
  autoStart?: boolean;
  enableStreaming?: boolean;
  enableAutoRetry?: boolean;
  retryDelay?: number;
  maxRetries?: number;
  onProgress?: (progress: ProgressUpdate) => void;
  onAgentStatus?: (status: AgentStatusUpdate) => void;
  onError?: (error: WorkflowError) => void;
  onComplete?: (result: WorkflowResult) => void;
  clientConfig?: Partial<WorkflowClientConfig>;
}

/**
 * Multiple sessions management state
 */
export interface MultiSessionState {
  sessions: Record<string, WorkflowSessionState>;
  activeSessions: string[];
  completedSessions: string[];
  failedSessions: string[];
}

/**
 * Multiple sessions management actions
 */
export interface MultiSessionActions {
  createSession: (formData: TravelFormData, options?: Partial<SessionCreationOptions>) => Promise<string>;
  getSession: (sessionId: string) => WorkflowSessionState | null;
  cancelSession: (sessionId: string, reason?: string) => Promise<void>;
  removeSession: (sessionId: string) => void;
  clearAll: () => void;
  getStats: () => { total: number; active: number; completed: number; failed: number };
}

/**
 * Multiple sessions hook return value
 */
export type UseMultipleWorkflowSessionsReturn = MultiSessionState & MultiSessionActions;

// =============================================================================
// PRIMARY WORKFLOW SESSION HOOK
// =============================================================================

/**
 * Main hook for managing a single workflow session
 */
export function useWorkflowSession(options: UseWorkflowSessionOptions = {}): UseWorkflowSessionReturn {
  // Configuration
  const {
    autoStart = false,
    enableStreaming = true,
    enableAutoRetry = true,
    retryDelay = 2000,
    maxRetries = 3,
    onProgress,
    onAgentStatus,
    onError,
    onComplete,
    clientConfig = {}
  } = options;

  // State
  const [state, setState] = useState<WorkflowSessionState>({
    session: null,
    result: null,
    isLoading: false,
    isStreaming: false,
    error: null,
    progress: {
      percentage: 0,
      currentAgent: null,
      estimatedTimeRemaining: 0,
      completedAgents: [],
      failedAgents: []
    },
    metadata: {
      totalCost: 0,
      elapsedTime: 0,
      retryCount: 0,
      lastUpdated: new Date().toISOString()
    }
  });

  // Refs
  const clientRef = useRef<WorkflowClient | null>(null);
  const retryCountRef = useRef(0);
  const lastFormDataRef = useRef<TravelFormData | null>(null);
  const lastOptionsRef = useRef<Partial<SessionCreationOptions> | null>(null);
  const mountedRef = useRef(true);

  // Initialize client
  useEffect(() => {
    clientRef.current = new WorkflowClient(clientConfig);
    
    return () => {
      mountedRef.current = false;
      if (clientRef.current) {
        clientRef.current.destroy();
      }
    };
  }, []);

  // Update state helper
  const updateState = useCallback((updates: Partial<WorkflowSessionState>) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  // Error handler
  const handleError = useCallback((error: WorkflowError) => {
    updateState({ error, isLoading: false });
    onError?.(error);

    // Auto retry if enabled and retryable
    if (enableAutoRetry && error.retryable && retryCountRef.current < maxRetries) {
      setTimeout(() => {
        if (mountedRef.current && lastFormDataRef.current) {
          retryCountRef.current++;
          createSession(lastFormDataRef.current, lastOptionsRef.current || {});
        }
      }, retryDelay * Math.pow(2, retryCountRef.current));
    }
  }, [enableAutoRetry, maxRetries, retryDelay, onError]);

  // Progress handler
  const handleProgress = useCallback((progressUpdate: ProgressUpdate) => {
    updateState({
      progress: progressUpdate.progress,
      metadata: progressUpdate.metadata,
      session: state.session ? {
        ...state.session,
        state: progressUpdate.state,
        progress: progressUpdate.progress,
        metadata: progressUpdate.metadata
      } : null
    });
    onProgress?.(progressUpdate);
  }, [state.session, onProgress]);

  // Agent status handler
  const handleAgentStatus = useCallback((agentUpdate: AgentStatusUpdate) => {
    onAgentStatus?.(agentUpdate);
  }, [onAgentStatus]);

  // Completion handler
  const handleCompletion = useCallback((result: WorkflowResult) => {
    let resultState: WorkflowState;
    if (result.status === 'completed') {
      resultState = WorkflowState.COMPLETED;
    } else if (result.status === 'failed') {
      resultState = WorkflowState.FAILED;
    } else if (result.status === 'cancelled') {
      resultState = WorkflowState.CANCELLED;
    } else {
      resultState = WorkflowState.FAILED;
    }

    updateState({
      result,
      isLoading: false,
      isStreaming: false,
      session: state.session ? {
        ...state.session,
        state: resultState
      } : null
    });
    onComplete?.(result);
    retryCountRef.current = 0; // Reset retry count on completion
  }, [state.session, onComplete]);

  // Create session
  const createSession = useCallback(async (
    formData: TravelFormData,
    sessionOptions: Partial<SessionCreationOptions> = {}
  ): Promise<void> => {
    if (!clientRef.current) return;

    try {
      updateState({
        isLoading: true,
        error: null,
        session: null,
        result: null
      });

      // Store for retry
      lastFormDataRef.current = formData;
      lastOptionsRef.current = sessionOptions;

      // Create session
      const session = await clientRef.current.createSession(formData, {
        streaming: enableStreaming,
        ...sessionOptions
      });

      updateState({
        session,
        isLoading: false,
        isStreaming: enableStreaming,
        progress: session.progress,
        metadata: session.metadata
      });

      // Set up event listeners if streaming
      if (enableStreaming) {
        const eventListeners: EventListeners = {
          progress: handleProgress,
          agentStatus: handleAgentStatus,
          error: handleError,
          completion: handleCompletion,
          connected: () => {
            updateState({ isStreaming: true });
          },
          disconnected: () => {
            updateState({ isStreaming: false });
          }
        };

        clientRef.current.addEventListener(session.sessionId, eventListeners);
      }

      retryCountRef.current = 0; // Reset retry count on success

    } catch (error) {
      handleError(error as WorkflowError);
    }
  }, [enableStreaming, handleProgress, handleAgentStatus, handleError, handleCompletion]);

  // Cancel session
  const cancelSession = useCallback(async (
    reason: string = 'User cancelled',
    graceful: boolean = false
  ): Promise<void> => {
    if (!clientRef.current || !state.session) return;

    try {
      updateState({ isLoading: true, error: null });
      
      await clientRef.current.cancelSession(state.session.sessionId, reason, graceful);
      
      updateState({
        isLoading: false,
        isStreaming: false,
        session: state.session ? {
          ...state.session,
          state: WorkflowState.CANCELLED
        } : null
      });

    } catch (error) {
      handleError(error as WorkflowError);
    }
  }, [state.session, handleError]);

  // Get result
  const getResult = useCallback(async (
    format: 'json' | 'formatted' | 'summary' = 'json'
  ): Promise<void> => {
    if (!clientRef.current || !state.session) return;

    try {
      updateState({ isLoading: true, error: null });
      
      const result = await clientRef.current.getResult(state.session.sessionId, format);
      
      updateState({
        result,
        isLoading: false
      });

    } catch (error) {
      handleError(error as WorkflowError);
    }
  }, [state.session, handleError]);

  // Retry
  const retry = useCallback(async (): Promise<void> => {
    if (lastFormDataRef.current) {
      retryCountRef.current = 0;
      await createSession(lastFormDataRef.current, lastOptionsRef.current || {});
    }
  }, [createSession]);

  // Clear error
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, []);

  // Refresh session
  const refresh = useCallback(async (): Promise<void> => {
    if (!clientRef.current || !state.session) return;

    try {
      const session = await clientRef.current.getSession(state.session.sessionId);
      if (session) {
        updateState({
          session,
          progress: session.progress,
          metadata: session.metadata
        });
      }
    } catch (error) {
      handleError(error as WorkflowError);
    }
  }, [state.session, handleError]);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && lastFormDataRef.current && !state.session && !state.isLoading) {
      createSession(lastFormDataRef.current, lastOptionsRef.current || {});
    }
  }, [autoStart, createSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current && state.session) {
        clientRef.current.cleanup(state.session.sessionId);
      }
    };
  }, [state.session]);

  return {
    ...state,
    createSession,
    cancelSession,
    getResult,
    retry,
    clearError,
    refresh
  };
}

// =============================================================================
// MULTIPLE SESSIONS HOOK
// =============================================================================

/**
 * Hook for managing multiple workflow sessions
 */
export function useMultipleWorkflowSessions(
  clientConfig: Partial<WorkflowClientConfig> = {}
): UseMultipleWorkflowSessionsReturn {
  const [sessions, setSessions] = useState<Record<string, WorkflowSessionState>>({});
  const clientRef = useRef<WorkflowClient | null>(null);
  const mountedRef = useRef(true);

  // Initialize client
  useEffect(() => {
    clientRef.current = new WorkflowClient(clientConfig);
    
    return () => {
      mountedRef.current = false;
      if (clientRef.current) {
        clientRef.current.destroy();
      }
    };
  }, []);

  // Update session state
  const updateSessionState = useCallback((sessionId: string, updates: Partial<WorkflowSessionState>) => {
    if (mountedRef.current) {
      setSessions(prev => {
        const existingSession = prev[sessionId];
        if (!existingSession) return prev;
        
        return {
          ...prev,
          [sessionId]: {
            ...existingSession,
            ...updates
          }
        };
      });
    }
  }, []);

  // Create session
  const createSession = useCallback(async (
    formData: TravelFormData,
    options: Partial<SessionCreationOptions> = {}
  ): Promise<string> => {
    if (!clientRef.current) throw new Error('Client not initialized');

    const sessionId = `temp-${Date.now()}`;
    
    // Initialize session state
    updateSessionState(sessionId, {
      session: null,
      result: null,
      isLoading: true,
      isStreaming: false,
      error: null,
      progress: {
        percentage: 0,
        currentAgent: null,
        estimatedTimeRemaining: 0,
        completedAgents: [],
        failedAgents: []
      },
      metadata: {
        totalCost: 0,
        elapsedTime: 0,
        retryCount: 0,
        lastUpdated: new Date().toISOString()
      }
    });

    try {
      const session = await clientRef.current.createSession(formData, options);
      
      // Update with real session ID and data
      setSessions(prev => {
        const { [sessionId]: tempSession, ...rest } = prev;
        const newSessionState: WorkflowSessionState = {
          session,
          result: null,
          isLoading: false,
          isStreaming: false,
          error: null,
          progress: session.progress,
          metadata: session.metadata
        };
        
        return {
          ...rest,
          [session.sessionId]: newSessionState
        };
      });

      return session.sessionId;

    } catch (error) {
      updateSessionState(sessionId, {
        error: error as WorkflowError,
        isLoading: false
      });
      throw error;
    }
  }, []);

  // Get session
  const getSession = useCallback((sessionId: string): WorkflowSessionState | null => {
    return sessions[sessionId] || null;
  }, [sessions]);

  // Cancel session
  const cancelSession = useCallback(async (
    sessionId: string,
    reason: string = 'User cancelled'
  ): Promise<void> => {
    if (!clientRef.current) return;

    try {
      await clientRef.current.cancelSession(sessionId, reason);
      updateSessionState(sessionId, {
        session: sessions[sessionId]?.session ? {
          ...sessions[sessionId].session!,
          state: WorkflowState.CANCELLED
        } : null
      });
    } catch (error) {
      updateSessionState(sessionId, {
        error: error as WorkflowError
      });
    }
  }, [sessions]);

  // Remove session
  const removeSession = useCallback((sessionId: string) => {
    if (clientRef.current) {
      clientRef.current.cleanup(sessionId);
    }
    setSessions(prev => {
      const { [sessionId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  // Clear all sessions
  const clearAll = useCallback(() => {
    Object.keys(sessions).forEach(sessionId => {
      if (clientRef.current) {
        clientRef.current.cleanup(sessionId);
      }
    });
    setSessions({});
  }, [sessions]);

  // Get stats
  const getStats = useCallback(() => {
    const sessionStates = Object.values(sessions);
    return {
      total: sessionStates.length,
      active: sessionStates.filter(s => 
        s.session?.state && [
          WorkflowState.INITIALIZED,
          WorkflowState.CONTENT_PLANNING,
          WorkflowState.INFO_GATHERING,
          WorkflowState.STRATEGIZING,
          WorkflowState.COMPILING
        ].includes(s.session.state)
      ).length,
      completed: sessionStates.filter(s => s.session?.state === WorkflowState.COMPLETED).length,
      failed: sessionStates.filter(s => s.session?.state === WorkflowState.FAILED).length
    };
  }, [sessions]);

  // Computed values
  const activeSessions = useMemo(() => 
    Object.keys(sessions).filter(id => {
      const session = sessions[id];
      if (!session?.session?.state) return false;
      
      return [
        WorkflowState.INITIALIZED,
        WorkflowState.CONTENT_PLANNING,
        WorkflowState.INFO_GATHERING,
        WorkflowState.STRATEGIZING,
        WorkflowState.COMPILING
      ].includes(session.session.state);
    }), [sessions]);

  const completedSessions = useMemo(() =>
    Object.keys(sessions).filter(id => 
      sessions[id]?.session?.state === WorkflowState.COMPLETED
    ), [sessions]);

  const failedSessions = useMemo(() =>
    Object.keys(sessions).filter(id => 
      sessions[id]?.session?.state === WorkflowState.FAILED
    ), [sessions]);

  return {
    sessions,
    activeSessions,
    completedSessions,
    failedSessions,
    createSession,
    getSession,
    cancelSession,
    removeSession,
    clearAll,
    getStats
  };
}

// =============================================================================
// CONVENIENCE HOOKS
// =============================================================================

/**
 * Hook for tracking workflow progress
 */
export function useWorkflowProgress(sessionId: string | null) {
  const [progress, setProgress] = useState({
    percentage: 0,
    currentAgent: null as AgentType | null,
    estimatedTimeRemaining: 0,
    completedAgents: [] as AgentType[],
    failedAgents: [] as AgentType[]
  });

  const clientRef = useRef<WorkflowClient | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    clientRef.current = new WorkflowClient();
    
    const eventListeners = {
      progress: (progressUpdate: ProgressUpdate) => {
        setProgress(progressUpdate.progress);
      }
    };

    clientRef.current.addEventListener(sessionId, eventListeners);

    return () => {
      if (clientRef.current) {
        clientRef.current.removeEventListener(sessionId);
        clientRef.current.destroy();
      }
    };
  }, [sessionId]);

  return progress;
}

/**
 * Hook for monitoring workflow status
 */
export function useWorkflowStatus(sessionId: string | null) {
  const [status, setStatus] = useState<{
    state: WorkflowState | null;
    isActive: boolean;
    isComplete: boolean;
    hasFailed: boolean;
    isCancelled: boolean;
  }>({
    state: null,
    isActive: false,
    isComplete: false,
    hasFailed: false,
    isCancelled: false
  });

  const clientRef = useRef<WorkflowClient | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    clientRef.current = new WorkflowClient();
    
    const eventListeners = {
      progress: (progressUpdate: ProgressUpdate) => {
        const state = progressUpdate.state;
        setStatus({
          state,
          isActive: [
            WorkflowState.CONTENT_PLANNING,
            WorkflowState.INFO_GATHERING,
            WorkflowState.STRATEGIZING,
            WorkflowState.COMPILING
          ].includes(state),
          isComplete: state === WorkflowState.COMPLETED,
          hasFailed: state === WorkflowState.FAILED,
          isCancelled: state === WorkflowState.CANCELLED
        });
      }
    };

    clientRef.current.addEventListener(sessionId, eventListeners);

    return () => {
      if (clientRef.current) {
        clientRef.current.removeEventListener(sessionId);
        clientRef.current.destroy();
      }
    };
  }, [sessionId]);

  return status;
}

export default useWorkflowSession;
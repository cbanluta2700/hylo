/**
 * Real-Time Features Integration Hook
 * React hook for integrating real-time features into components
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { connectionManager, MessageType, ConnectionState } from '../../api/itinerary/live';
import { progressTracker, createProgressHooks } from '../lib/progress-tracker';
import {
  routeProgressUpdate,
  routeAgentUpdate,
  routeErrorNotification,
  routeCompletionNotification,
} from '../lib/message-router';
import { workflowStateManager } from '../lib/workflows/state-manager';

/**
 * Connection status interface
 */
export interface ConnectionStatus {
  state: ConnectionState;
  connected: boolean;
  reconnecting: boolean;
  error?: string;
  lastHeartbeat?: Date;
  connectionTime?: Date;
}

/**
 * Progress data interface
 */
export interface ProgressData {
  progress: number;
  currentStep?: string;
  message?: string;
  estimatedTimeRemaining?: number;
  agentType?: string;
  stepName?: string;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Agent status interface
 */
export interface AgentStatus {
  agentType: string;
  status: 'idle' | 'starting' | 'running' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

/**
 * Workflow status interface
 */
export interface WorkflowStatus {
  workflowId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentStep?: string;
  startedAt?: string;
  estimatedCompletion?: string;
  errors: Array<{
    timestamp: Date;
    error: string;
    step?: string;
  }>;
}

/**
 * Real-time hook options
 */
export interface UseRealtimeOptions {
  sessionId: string;
  workflowId?: string;
  userId?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  onProgressUpdate?: (progress: ProgressData) => void;
  onAgentUpdate?: (agent: AgentStatus) => void;
  onWorkflowComplete?: (result: any) => void;
  onError?: (error: string, details?: any) => void;
  onConnectionChange?: (status: ConnectionStatus) => void;
}

/**
 * Real-time hook return interface
 */
export interface UseRealtimeReturn {
  // Connection status
  connectionStatus: ConnectionStatus;

  // Workflow status
  workflowStatus: WorkflowStatus;

  // Agent statuses
  agentStatuses: Record<string, AgentStatus>;

  // Progress data
  currentProgress: ProgressData | null;

  // Connection methods
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;

  // Message sending methods
  sendProgressUpdate: (
    progress: number,
    message?: string,
    metadata?: Record<string, any>
  ) => Promise<void>;
  sendAgentUpdate: (
    agentType: string,
    status: AgentStatus['status'],
    progress?: number,
    message?: string
  ) => Promise<void>;
  sendError: (error: string, details?: any) => Promise<void>;
  sendCompletion: (result: any) => Promise<void>;

  // Subscription methods
  subscribe: (topics: string[]) => void;
  unsubscribe: (topics: string[]) => void;

  // Utility methods
  isConnected: boolean;
  getConnectionStats: () => any;
  getProgressStats: () => any;
}

/**
 * Real-time features integration hook
 */
export function useRealtime(options: UseRealtimeOptions): UseRealtimeReturn {
  const {
    sessionId,
    workflowId,
    autoConnect = true,
    reconnectAttempts = 3,
    reconnectInterval = 5000,
    heartbeatInterval = 30000,
    onProgressUpdate,
    onAgentUpdate,
    onWorkflowComplete,
    onError,
    onConnectionChange,
  } = options;

  // State management
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    state: ConnectionState.DISCONNECTED,
    connected: false,
    reconnecting: false,
  });

  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>({
    status: 'pending',
    progress: 0,
    errors: [],
  });

  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({});
  const [currentProgress, setCurrentProgress] = useState<ProgressData | null>(null);

  // Refs for managing connections and timers
  const connectionRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressHooksRef = useRef(createProgressHooks(workflowId || ''));
  const reconnectCountRef = useRef(0);

  // Connection status update handler
  const updateConnectionStatus = useCallback(
    (status: Partial<ConnectionStatus>) => {
      setConnectionStatus((prev) => {
        const newStatus = { ...prev, ...status };
        onConnectionChange?.(newStatus);
        return newStatus;
      });
    },
    [onConnectionChange]
  );

  // Progress update handler
  const handleProgressUpdate = useCallback(
    (progress: ProgressData) => {
      setCurrentProgress(progress);
      onProgressUpdate?.(progress);
    },
    [onProgressUpdate]
  );

  // Agent update handler
  const handleAgentUpdate = useCallback(
    (agentType: string, status: AgentStatus['status'], progress?: number, message?: string) => {
      setAgentStatuses((prev) => ({
        ...prev,
        [agentType]: {
          agentType,
          status,
          progress,
          message,
          startTime: status === 'starting' ? new Date() : prev[agentType]?.startTime,
          endTime: status === 'completed' || status === 'failed' ? new Date() : undefined,
        },
      }));

      onAgentUpdate?.({
        agentType,
        status,
        progress,
        message,
      });
    },
    [onAgentUpdate]
  );

  // Workflow status update handler
  const handleWorkflowStatusUpdate = useCallback((status: Partial<WorkflowStatus>) => {
    setWorkflowStatus((prev) => ({ ...prev, ...status }));
  }, []);

  // Error handler
  const handleError = useCallback(
    (error: string, details?: any) => {
      console.error('Real-time error:', error, details);
      onError?.(error, details);
    },
    [onError]
  );

  // Connection methods
  const connect = useCallback(async (): Promise<void> => {
    if (connectionStatus.connected) return;

    try {
      updateConnectionStatus({
        state: ConnectionState.CONNECTING,
        reconnecting: false,
      });

      // Create WebSocket connection URL
      const protocol =
        typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
      const url = `${protocol}//${host}/api/itinerary/live?sessionId=${sessionId}`;

      const ws = new WebSocket(url);

      ws.onopen = () => {
        updateConnectionStatus({
          state: ConnectionState.CONNECTED,
          connected: true,
          connectionTime: new Date(),
        });

        // Start heartbeat
        startHeartbeat();

        // Reset reconnect count
        reconnectCountRef.current = 0;

        console.log(`Connected to real-time service for session ${sessionId}`);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case MessageType.PROGRESS_UPDATE:
              handleProgressUpdate(message.payload);
              break;

            case MessageType.AGENT_UPDATE:
              handleAgentUpdate(
                message.payload.agentType,
                message.payload.status,
                message.payload.progress,
                message.payload.message
              );
              break;

            case MessageType.WORKFLOW_STATUS:
              handleWorkflowStatusUpdate(message.payload);
              break;

            case MessageType.COMPLETION_NOTIFICATION:
              onWorkflowComplete?.(message.payload.result);
              break;

            case MessageType.ERROR_NOTIFICATION:
              handleError(message.payload.error, message.payload.details);
              break;

            case MessageType.HEARTBEAT_ACK:
              updateConnectionStatus({
                lastHeartbeat: new Date(),
              });
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        updateConnectionStatus({
          state: ConnectionState.DISCONNECTED,
          connected: false,
        });

        stopHeartbeat();

        // Attempt reconnection if not manually disconnected
        if (reconnectCountRef.current < reconnectAttempts) {
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        updateConnectionStatus({
          state: ConnectionState.ERROR,
          error: 'WebSocket connection error',
        });

        handleError('WebSocket connection error', error);
      };

      connectionRef.current = ws;
    } catch (error) {
      updateConnectionStatus({
        state: ConnectionState.ERROR,
        error: 'Failed to establish connection',
      });

      handleError('Failed to establish connection', error);
      throw error;
    }
  }, [
    sessionId,
    connectionStatus.connected,
    reconnectAttempts,
    updateConnectionStatus,
    handleProgressUpdate,
    handleAgentUpdate,
    handleWorkflowStatusUpdate,
    handleError,
    onWorkflowComplete,
  ]);

  const disconnect = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }

    stopHeartbeat();
    clearReconnectTimeout();

    updateConnectionStatus({
      state: ConnectionState.DISCONNECTED,
      connected: false,
    });
  }, [updateConnectionStatus]);

  const reconnect = useCallback(async (): Promise<void> => {
    disconnect();
    reconnectCountRef.current = 0;
    await connect();
  }, [disconnect, connect]);

  // Heartbeat management
  const startHeartbeat = useCallback(() => {
    heartbeatIntervalRef.current = setInterval(() => {
      if (connectionRef.current && connectionRef.current.readyState === WebSocket.OPEN) {
        connectionRef.current.send(
          JSON.stringify({
            type: MessageType.HEARTBEAT,
            id: `hb_${Date.now()}`,
            timestamp: new Date().toISOString(),
            payload: {},
          })
        );
      }
    }, heartbeatInterval);
  }, [heartbeatInterval]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Reconnection management
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) return;

    reconnectCountRef.current++;
    updateConnectionStatus({
      state: ConnectionState.RECONNECTING,
      reconnecting: true,
    });

    reconnectTimeoutRef.current = setTimeout(async () => {
      reconnectTimeoutRef.current = null;
      try {
        await connect();
      } catch (error) {
        if (reconnectCountRef.current < reconnectAttempts) {
          scheduleReconnect();
        } else {
          updateConnectionStatus({
            state: ConnectionState.ERROR,
            error: 'Failed to reconnect after maximum attempts',
            reconnecting: false,
          });
        }
      }
    }, reconnectInterval);
  }, [reconnectAttempts, reconnectInterval, updateConnectionStatus, connect]);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Message sending methods
  const sendProgressUpdate = useCallback(
    async (progress: number, message?: string, metadata?: Record<string, any>): Promise<void> => {
      if (workflowId) {
        await routeProgressUpdate(sessionId, workflowId, progress, message, metadata);
      }
    },
    [sessionId, workflowId]
  );

  const sendAgentUpdate = useCallback(
    async (
      agentType: string,
      status: AgentStatus['status'],
      progress?: number,
      message?: string
    ): Promise<void> => {
      if (workflowId) {
        // Map status to the expected values for routeAgentUpdate
        const mappedStatus =
          status === 'starting' ? 'started' : status === 'running' ? 'started' : status;
        await routeAgentUpdate(
          sessionId,
          workflowId,
          agentType,
          mappedStatus as 'started' | 'completed' | 'failed',
          progress,
          message
        );
      }
    },
    [sessionId, workflowId]
  );

  const sendError = useCallback(
    async (error: string, details?: any): Promise<void> => {
      if (workflowId) {
        await routeErrorNotification(sessionId, workflowId, error, details);
      }
    },
    [sessionId, workflowId]
  );

  const sendCompletion = useCallback(
    async (result: any): Promise<void> => {
      if (workflowId) {
        await routeCompletionNotification(sessionId, workflowId, result);
      }
    },
    [sessionId, workflowId]
  );

  // Subscription methods
  const subscribe = useCallback((topics: string[]) => {
    if (connectionRef.current && connectionRef.current.readyState === WebSocket.OPEN) {
      connectionRef.current.send(
        JSON.stringify({
          type: MessageType.SUBSCRIBE,
          id: `sub_${Date.now()}`,
          timestamp: new Date().toISOString(),
          payload: { topics },
        })
      );
    }
  }, []);

  const unsubscribe = useCallback((topics: string[]) => {
    if (connectionRef.current && connectionRef.current.readyState === WebSocket.OPEN) {
      connectionRef.current.send(
        JSON.stringify({
          type: MessageType.UNSUBSCRIBE,
          id: `unsub_${Date.now()}`,
          timestamp: new Date().toISOString(),
          payload: { topics },
        })
      );
    }
  }, []);

  // Utility methods
  const getConnectionStats = useCallback(() => {
    return connectionManager.getStats();
  }, []);

  const getProgressStats = useCallback(() => {
    return progressTracker.getStats();
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Initialize progress tracking
  useEffect(() => {
    if (workflowId) {
      progressHooksRef.current = createProgressHooks(workflowId);

      // Load initial workflow status
      workflowStateManager.getWorkflowStateBySession(sessionId).then((state) => {
        if (state) {
          handleWorkflowStatusUpdate({
            workflowId: state.workflowId,
            status: state.status,
            progress: state.progress,
            currentStep: state.currentStep,
            startedAt: state.startedAt,
            estimatedCompletion: state.estimatedCompletion,
            errors: state.errors.map((err) => ({
              timestamp: new Date(err.timestamp),
              error: err.message,
              step: err.stepId,
            })),
          });
        }
      });
    }
  }, [workflowId, sessionId, handleWorkflowStatusUpdate]);

  return {
    // Status
    connectionStatus,
    workflowStatus,
    agentStatuses,
    currentProgress,

    // Connection methods
    connect,
    disconnect,
    reconnect,

    // Message sending methods
    sendProgressUpdate,
    sendAgentUpdate,
    sendError,
    sendCompletion,

    // Subscription methods
    subscribe,
    unsubscribe,

    // Utility methods
    isConnected: connectionStatus.connected,
    getConnectionStats,
    getProgressStats,
  };
}

/**
 * Hook for tracking workflow progress
 */
export function useWorkflowProgress(sessionId: string, workflowId?: string) {
  const realtime = useRealtime({
    sessionId,
    workflowId,
    autoConnect: true,
  });

  return {
    progress: realtime.currentProgress,
    workflowStatus: realtime.workflowStatus,
    isConnected: realtime.isConnected,
    sendProgressUpdate: realtime.sendProgressUpdate,
  };
}

/**
 * Hook for tracking agent statuses
 */
export function useAgentTracking(sessionId: string, workflowId?: string) {
  const realtime = useRealtime({
    sessionId,
    workflowId,
    autoConnect: true,
  });

  return {
    agentStatuses: realtime.agentStatuses,
    sendAgentUpdate: realtime.sendAgentUpdate,
    isConnected: realtime.isConnected,
  };
}

/**
 * Hook for real-time error monitoring
 */
export function useRealtimeErrors(sessionId: string, workflowId?: string) {
  const [errors, setErrors] = useState<Array<{ timestamp: Date; error: string; details?: any }>>(
    []
  );

  const realtime = useRealtime({
    sessionId,
    workflowId,
    autoConnect: true,
    onError: (error, details) => {
      setErrors((prev) => [
        ...prev,
        {
          timestamp: new Date(),
          error,
          details,
        },
      ]);
    },
  });

  return {
    errors,
    clearErrors: () => setErrors([]),
    isConnected: realtime.isConnected,
  };
}

/**
 * Export types
 */

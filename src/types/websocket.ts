/**
 * WebSocket Message Types
 * Type definitions for real-time communication between client and server
 */

export interface WebSocketMessage {
  type: MessageType;
  id: string; // Unique message ID
  timestamp: string; // ISO timestamp
  sessionId: string;
  workflowId?: string;
  data: any;
}

export type MessageType =
  | 'connection_ack'
  | 'subscribe'
  | 'unsubscribe'
  | 'progress_update'
  | 'agent_status_update'
  | 'step_complete'
  | 'error'
  | 'completion'
  | 'heartbeat'
  | 'ping'
  | 'pong';

/**
 * Connection Messages
 */

export interface ConnectionAckMessage extends WebSocketMessage {
  type: 'connection_ack';
  data: {
    connectionId: string;
    serverVersion: string;
    supportedFeatures: string[];
    heartbeatInterval: number; // milliseconds
  };
}

export interface SubscribeMessage extends WebSocketMessage {
  type: 'subscribe';
  data: {
    workflowId: string;
    updateTypes: MessageType[];
    filter?: SubscriptionFilter;
  };
}

export interface SubscriptionFilter {
  agentTypes?: string[];
  stepNames?: string[];
  minProgress?: number;
  maxProgress?: number;
}

export interface UnsubscribeMessage extends WebSocketMessage {
  type: 'unsubscribe';
  data: {
    workflowId: string;
    reason?: string;
  };
}

/**
 * Progress and Status Messages
 */

export interface ProgressUpdateMessage extends WebSocketMessage {
  type: 'progress_update';
  data: {
    percentage: number; // 0-100
    currentPhase: string;
    message: string;
    estimatedCompletion?: string; // ISO timestamp
    stepsCompleted: number;
    totalSteps: number;
  };
}

export interface AgentStatusUpdateMessage extends WebSocketMessage {
  type: 'agent_status_update';
  data: {
    agentType: string;
    agentId: string;
    status: 'idle' | 'processing' | 'completed' | 'failed' | 'cancelled';
    progress: number; // 0-100
    currentTask?: string;
    lastActivity: string; // ISO timestamp
    retryCount: number;
    maxRetries: number;
  };
}

export interface StepCompleteMessage extends WebSocketMessage {
  type: 'step_complete';
  data: {
    stepName: string;
    stepId: string;
    output: any;
    duration: number; // milliseconds
    nextSteps: string[];
    agentContributions?: AgentContribution[];
  };
}

export interface AgentContribution {
  agentType: string;
  agentId: string;
  contribution: string;
  confidence: number;
}

/**
 * Error and Completion Messages
 */

export interface ErrorMessage extends WebSocketMessage {
  type: 'error';
  data: {
    error: WebSocketError;
    affectedSteps: string[];
    recoveryOptions?: RecoveryOption[];
    canRetry: boolean;
  };
}

export interface WebSocketError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  recoverable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RecoveryOption {
  type: 'retry' | 'skip' | 'alternative_agent' | 'manual_intervention';
  description: string;
  parameters?: any;
}

export interface CompletionMessage extends WebSocketMessage {
  type: 'completion';
  data: {
    finalResult: any;
    summary: CompletionSummary;
    duration: number; // milliseconds
    costEstimate?: number;
    qualityScore?: number; // 0-1
  };
}

export interface CompletionSummary {
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  agentsUsed: string[];
  errorsEncountered: number;
  warnings: string[];
}

/**
 * Heartbeat and Connection Messages
 */

export interface HeartbeatMessage extends WebSocketMessage {
  type: 'heartbeat';
  data: {
    serverTime: string; // ISO timestamp
    activeConnections: number;
    systemLoad: number; // 0-1
  };
}

export interface PingMessage extends WebSocketMessage {
  type: 'ping';
  data: {
    timestamp: string;
  };
}

export interface PongMessage extends WebSocketMessage {
  type: 'pong';
  data: {
    timestamp: string;
    serverTime: string;
  };
}

/**
 * WebSocket Connection Management
 */

export interface WebSocketConnection {
  id: string;
  sessionId: string;
  connectedAt: string;
  lastActivity: string;
  subscriptions: WebSocketSubscription[];
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

export interface WebSocketSubscription {
  workflowId: string;
  updateTypes: MessageType[];
  filter?: SubscriptionFilter;
  subscribedAt: string;
  lastUpdate?: string;
}

/**
 * Client-Side Message Handlers
 */

export interface MessageHandler<T extends WebSocketMessage = WebSocketMessage> {
  messageType: MessageType;
  handle: (message: T) => void | Promise<void>;
}

export interface MessageHandlerRegistry {
  register: <T extends WebSocketMessage>(handler: MessageHandler<T>) => void;
  unregister: (messageType: MessageType) => void;
  handle: (message: WebSocketMessage) => void | Promise<void>;
}

/**
 * WebSocket Configuration
 */

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  heartbeatInterval: number; // milliseconds
  reconnectInterval: number; // milliseconds
  maxReconnectAttempts: number;
  connectionTimeout: number; // milliseconds
  messageTimeout: number; // milliseconds
}

export interface WebSocketClient {
  connect: (config: WebSocketConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  send: (message: WebSocketMessage) => void;
  subscribe: (workflowId: string, filter?: SubscriptionFilter) => void;
  unsubscribe: (workflowId: string) => void;
  onMessage: (handler: (message: WebSocketMessage) => void) => void;
  onError: (handler: (error: Event) => void) => void;
  onClose: (handler: (event: CloseEvent) => void) => void;
}

/**
 * Validation Rules:
 * - percentage between 0 and 100
 * - progress between 0 and 100
 * - confidence between 0 and 1
 * - qualityScore between 0 and 1
 * - systemLoad between 0 and 1
 * - timestamp must be valid ISO format
 * - sessionId must be UUID v4 format
 * - workflowId must be valid format
 */

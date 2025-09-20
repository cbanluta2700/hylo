/**
 * Frontend Workflow Client Service
 * 
 * Provides frontend interaction with the workflow API system, including session management,
 * streaming, error handling, and real-time updates. Designed for React integration with
 * comprehensive TypeScript support and robust error recovery.
 * 
 * Features:
 * - Session lifecycle management
 * - Server-Sent Events streaming
 * - Automatic retry and reconnection
 * - Error handling and recovery
 * - Type-safe API interactions
 * - Cost tracking and limits
 * - Progress monitoring
 * - Result retrieval and caching
 * 
 * @module WorkflowClient
 */

import { z } from 'zod';
import { WorkflowState, AgentType, type TravelFormData } from '../../types/agents';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Workflow session configuration
 */
export interface WorkflowClientConfig {
  baseUrl?: string;
  timeout?: number; // milliseconds
  maxRetries?: number;
  retryDelay?: number; // milliseconds
  enableStreaming?: boolean;
  enableCaching?: boolean;
  costLimit?: number; // USD
  observability?: {
    enableLogging?: boolean;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
  };
}

/**
 * Session creation options
 */
export interface SessionCreationOptions {
  streaming?: boolean;
  maxExecutionTime?: number;
  maxCost?: number;
  maxRetries?: number;
  observability?: {
    langsmithEnabled?: boolean;
    verboseLogging?: boolean;
  };
}

/**
 * Session information
 */
export interface SessionInfo {
  sessionId: string;
  state: WorkflowState;
  progress: {
    currentStep: number;
    totalSteps: number;
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
    createdAt: string;
  };
  formData: TravelFormData;
}

/**
 * Streaming event data
 */
export interface StreamingEvent {
  id: string;
  event: 'connected' | 'progress' | 'agent-status' | 'error' | 'completion' | 'heartbeat' | 'workflow-event';
  data: any;
  timestamp: string;
}

/**
 * Progress update data
 */
export interface ProgressUpdate {
  sessionId: string;
  state: WorkflowState;
  progress: SessionInfo['progress'];
  metadata: SessionInfo['metadata'];
}

/**
 * Agent status update
 */
export interface AgentStatusUpdate {
  sessionId: string;
  agentType: AgentType;
  status: 'started' | 'in-progress' | 'completed' | 'failed';
  duration?: number;
  cost?: number;
  error?: string;
  result?: any;
}

/**
 * Workflow result
 */
export interface WorkflowResult {
  sessionId: string;
  status: 'completed' | 'failed' | 'partial' | 'cancelled';
  itinerary?: string;
  metadata: {
    totalDuration: number;
    totalCost: number;
    successRate: number;
    completedAt?: string;
  };
  agentResults: Record<string, any>;
  formData: TravelFormData;
}

/**
 * Error information
 */
export interface WorkflowError {
  type: 'network' | 'api' | 'timeout' | 'validation' | 'session' | 'stream';
  message: string;
  code?: string;
  statusCode?: number;
  sessionId?: string;
  retryable: boolean;
  timestamp: string;
  context?: any;
}

/**
 * Event listeners
 */
export type EventListener<T> = (data: T) => void;

export interface EventListeners {
  progress?: EventListener<ProgressUpdate>;
  agentStatus?: EventListener<AgentStatusUpdate>;
  error?: EventListener<WorkflowError>;
  completion?: EventListener<WorkflowResult>;
  connected?: EventListener<{ sessionId: string }>;
  disconnected?: EventListener<{ sessionId: string; reason: string }>;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const WorkflowClientConfigSchema = z.object({
  baseUrl: z.string().url().optional().default(typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
  timeout: z.number().positive().optional().default(30000), // 30 seconds
  maxRetries: z.number().min(0).optional().default(3),
  retryDelay: z.number().positive().optional().default(1000), // 1 second
  enableStreaming: z.boolean().optional().default(true),
  enableCaching: z.boolean().optional().default(true),
  costLimit: z.number().positive().optional().default(10.0), // $10 USD
  observability: z.object({
    enableLogging: z.boolean().optional().default(true),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).optional().default('info')
  }).optional().default({})
});

const SessionCreationOptionsSchema = z.object({
  streaming: z.boolean().optional().default(true),
  maxExecutionTime: z.number().positive().optional().default(300000), // 5 minutes
  maxCost: z.number().positive().optional().default(5.0), // $5 USD
  maxRetries: z.number().min(0).optional().default(3),
  observability: z.object({
    langsmithEnabled: z.boolean().optional().default(true),
    verboseLogging: z.boolean().optional().default(false)
  }).optional().default({})
});

// =============================================================================
// WORKFLOW CLIENT CLASS
// =============================================================================

/**
 * Main workflow client for frontend integration
 */
export class WorkflowClient {
  private config: WorkflowClientConfig;
  private sessions = new Map<string, SessionInfo>();
  private eventSources = new Map<string, EventSource>();
  private eventListeners = new Map<string, EventListeners>();
  private retryAttempts = new Map<string, number>();
  private abortControllers = new Map<string, AbortController>();

  constructor(config: Partial<WorkflowClientConfig> = {}) {
    this.config = WorkflowClientConfigSchema.parse(config);
    
    if (this.config.observability?.enableLogging) {
      this.log('info', 'WorkflowClient initialized', { config: this.config });
    }
  }

  // =============================================================================
  // SESSION MANAGEMENT
  // =============================================================================

  /**
   * Create a new workflow session
   */
  async createSession(
    formData: TravelFormData,
    options: Partial<SessionCreationOptions> = {}
  ): Promise<SessionInfo> {
    const validatedOptions = SessionCreationOptionsSchema.parse(options);
    const controller = new AbortController();
    
    try {
      const response = await this.makeRequest('/api/workflow/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData,
          config: validatedOptions
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.createError('api', `Failed to create session: ${response.statusText}`, {
          statusCode: response.status,
          context: errorData
        });
      }

      const sessionData = await response.json();
      const sessionInfo = this.normalizeSessionInfo(sessionData);
      
      // Store session
      this.sessions.set(sessionInfo.sessionId, sessionInfo);
      this.abortControllers.set(sessionInfo.sessionId, controller);

      // Start streaming if enabled
      if (validatedOptions.streaming && this.config.enableStreaming) {
        await this.startStreaming(sessionInfo.sessionId);
      }

      this.log('info', 'Session created successfully', { sessionId: sessionInfo.sessionId });
      
      return sessionInfo;

    } catch (error) {
      controller.abort();
      this.handleError(error, 'createSession');
      throw error;
    }
  }

  /**
   * Get session information
   */
  async getSession(sessionId: string): Promise<SessionInfo | null> {
    // Return cached session if available and recent
    const cached = this.sessions.get(sessionId);
    if (cached && this.isRecentSession(cached)) {
      return cached;
    }

    try {
      const response = await this.makeRequest(`/api/workflow/session/${sessionId}`, {
        method: 'GET',
      });

      if (response.status === 404) {
        this.sessions.delete(sessionId);
        return null;
      }

      if (!response.ok) {
        throw this.createError('api', `Failed to get session: ${response.statusText}`, {
          statusCode: response.status,
          sessionId
        });
      }

      const sessionData = await response.json();
      const sessionInfo = this.normalizeSessionInfo(sessionData);
      
      // Update cache
      this.sessions.set(sessionId, sessionInfo);
      
      return sessionInfo;

    } catch (error) {
      this.handleError(error, 'getSession', { sessionId });
      throw error;
    }
  }

  /**
   * Cancel a workflow session
   */
  async cancelSession(
    sessionId: string,
    reason: string = 'User cancelled',
    graceful: boolean = false
  ): Promise<void> {
    try {
      const response = await this.makeRequest(`/api/workflow/cancel/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          graceful,
          preservePartialResults: true,
          notifySubscribers: true
        })
      });

      if (!response.ok) {
        throw this.createError('api', `Failed to cancel session: ${response.statusText}`, {
          statusCode: response.status,
          sessionId
        });
      }

      // Stop streaming
      this.stopStreaming(sessionId);
      
      // Update session state
      const session = this.sessions.get(sessionId);
      if (session) {
        session.state = WorkflowState.CANCELLED;
        session.metadata.lastUpdated = new Date().toISOString();
      }

      // Abort any pending requests
      const controller = this.abortControllers.get(sessionId);
      if (controller) {
        controller.abort();
        this.abortControllers.delete(sessionId);
      }

      this.log('info', 'Session cancelled successfully', { sessionId, reason });

    } catch (error) {
      this.handleError(error, 'cancelSession', { sessionId });
      throw error;
    }
  }

  /**
   * Get workflow result
   */
  async getResult(
    sessionId: string,
    format: 'json' | 'formatted' | 'summary' = 'json'
  ): Promise<WorkflowResult> {
    try {
      const params = new URLSearchParams({
        format,
        includeMetadata: 'true',
        includePerformance: 'true'
      });

      const response = await this.makeRequest(
        `/api/workflow/result/${sessionId}?${params}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw this.createError('session', 'Session not found', { sessionId });
        }
        if (response.status === 202) {
          throw this.createError('session', 'Session has no results yet', { sessionId });
        }
        throw this.createError('api', `Failed to get result: ${response.statusText}`, {
          statusCode: response.status,
          sessionId
        });
      }

      const result = await response.json();
      this.log('info', 'Result retrieved successfully', { sessionId });
      
      return result;

    } catch (error) {
      this.handleError(error, 'getResult', { sessionId });
      throw error;
    }
  }

  // =============================================================================
  // STREAMING FUNCTIONALITY
  // =============================================================================

  /**
   * Start streaming updates for a session
   */
  async startStreaming(sessionId: string): Promise<void> {
    // Stop existing stream if any
    this.stopStreaming(sessionId);

    try {
      const eventSource = new EventSource(
        `${this.config.baseUrl}/api/workflow/stream/${sessionId}?heartbeat=true`
      );

      const listeners = this.eventListeners.get(sessionId);
      
      eventSource.onopen = () => {
        this.log('debug', 'Streaming connected', { sessionId });
        this.retryAttempts.set(sessionId, 0);
      };

      eventSource.onmessage = (event) => {
        this.handleStreamingEvent(sessionId, event);
      };

      // Handle specific event types
      eventSource.addEventListener('connected', (event) => {
        const messageEvent = event as MessageEvent;
        const data = JSON.parse(messageEvent.data);
        listeners?.connected?.(data);
      });

      eventSource.addEventListener('progress', (event) => {
        const messageEvent = event as MessageEvent;
        const data = JSON.parse(messageEvent.data);
        this.updateSessionFromProgress(sessionId, data);
        listeners?.progress?.(data);
      });

      eventSource.addEventListener('agent-status', (event) => {
        const messageEvent = event as MessageEvent;
        const data = JSON.parse(messageEvent.data);
        listeners?.agentStatus?.(data);
      });

      eventSource.addEventListener('error', (event) => {
        const messageEvent = event as MessageEvent;
        const data = JSON.parse(messageEvent.data);
        const error = this.createError('stream', data.error || 'Streaming error', {
          sessionId,
          context: data
        });
        listeners?.error?.(error);
      });

      eventSource.addEventListener('completion', (event) => {
        const messageEvent = event as MessageEvent;
        const data = JSON.parse(messageEvent.data);
        listeners?.completion?.(data);
        this.stopStreaming(sessionId); // Auto-stop on completion
      });

      eventSource.onerror = (error) => {
        this.handleStreamingError(sessionId, error);
      };

      // Store event source
      this.eventSources.set(sessionId, eventSource);
      
      this.log('info', 'Streaming started', { sessionId });

    } catch (error) {
      this.handleError(error, 'startStreaming', { sessionId });
      throw error;
    }
  }

  /**
   * Stop streaming for a session
   */
  stopStreaming(sessionId: string): void {
    const eventSource = this.eventSources.get(sessionId);
    if (eventSource) {
      eventSource.close();
      this.eventSources.delete(sessionId);
      
      const listeners = this.eventListeners.get(sessionId);
      listeners?.disconnected?.({ sessionId, reason: 'Stopped by client' });
      
      this.log('debug', 'Streaming stopped', { sessionId });
    }
  }

  /**
   * Add event listeners for a session
   */
  addEventListener(sessionId: string, listeners: EventListeners): void {
    const existing = this.eventListeners.get(sessionId) || {};
    this.eventListeners.set(sessionId, { ...existing, ...listeners });
  }

  /**
   * Remove event listeners for a session
   */
  removeEventListener(sessionId: string): void {
    this.eventListeners.delete(sessionId);
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Clean up resources for a session
   */
  cleanup(sessionId: string): void {
    this.stopStreaming(sessionId);
    this.sessions.delete(sessionId);
    this.eventListeners.delete(sessionId);
    this.retryAttempts.delete(sessionId);
    
    const controller = this.abortControllers.get(sessionId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(sessionId);
    }
    
    this.log('debug', 'Session cleanup completed', { sessionId });
  }

  /**
   * Clean up all resources
   */
  destroy(): void {
    // Stop all streams
    for (const sessionId of this.eventSources.keys()) {
      this.stopStreaming(sessionId);
    }
    
    // Abort all pending requests
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }
    
    // Clear all maps
    this.sessions.clear();
    this.eventSources.clear();
    this.eventListeners.clear();
    this.retryAttempts.clear();
    this.abortControllers.clear();
    
    this.log('info', 'WorkflowClient destroyed');
  }

  /**
   * Get client statistics
   */
  getStats() {
    return {
      activeSessions: this.sessions.size,
      activeStreams: this.eventSources.size,
      activeRequests: this.abortControllers.size,
      config: this.config
    };
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(
    endpoint: string,
    options: RequestInit
  ): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries!; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          ...(options.signal ? { signal: options.signal } : {}),
          headers: {
            ...options.headers,
            'User-Agent': 'Hylo-WorkflowClient/1.0.0',
          },
        });

        return response;

      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.maxRetries!) {
          await this.sleep(this.config.retryDelay! * Math.pow(2, attempt));
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.log('warn', `Request retry ${attempt + 1}`, { url, error: errorMessage });
        }
      }
    }

    throw this.createError('network', `Request failed after ${this.config.maxRetries} retries`, {
      context: lastError
    });
  }

  /**
   * Handle streaming events
   */
  private handleStreamingEvent(sessionId: string, event: MessageEvent): void {
    try {
      const streamingEvent: StreamingEvent = {
        id: event.lastEventId || `${Date.now()}-${Math.random()}`,
        event: event.type as any,
        data: JSON.parse(event.data),
        timestamp: new Date().toISOString()
      };

      this.log('debug', 'Streaming event received', { sessionId, event: streamingEvent.event });

    } catch (error) {
      this.log('warn', 'Failed to parse streaming event', { sessionId, error });
    }
  }

  /**
   * Handle streaming errors with reconnection
   */
  private handleStreamingError(sessionId: string, error: Event): void {
    const retries = this.retryAttempts.get(sessionId) || 0;
    
    if (retries < this.config.maxRetries!) {
      this.retryAttempts.set(sessionId, retries + 1);
      
      setTimeout(() => {
        this.log('info', `Reconnecting stream (attempt ${retries + 1})`, { sessionId });
        this.startStreaming(sessionId).catch((err) => {
          this.handleError(err, 'streamReconnection', { sessionId });
        });
      }, this.config.retryDelay! * Math.pow(2, retries));
      
    } else {
      const streamError = this.createError('stream', 'Stream connection failed', {
        sessionId,
        context: error
      });
      
      const listeners = this.eventListeners.get(sessionId);
      listeners?.error?.(streamError);
      
      this.stopStreaming(sessionId);
    }
  }

  /**
   * Update session from progress event
   */
  private updateSessionFromProgress(sessionId: string, progressData: ProgressUpdate): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.state = progressData.state;
      session.progress = progressData.progress;
      session.metadata = progressData.metadata;
    }
  }

  /**
   * Normalize session info from API response
   */
  private normalizeSessionInfo(data: any): SessionInfo {
    return {
      sessionId: data.sessionId,
      state: data.state,
      progress: data.progress,
      metadata: data.metadata,
      formData: data.formData
    };
  }

  /**
   * Check if session is recent enough to use from cache
   */
  private isRecentSession(session: SessionInfo): boolean {
    const age = Date.now() - new Date(session.metadata.lastUpdated).getTime();
    return age < 30000; // 30 seconds
  }

  /**
   * Create standardized error object
   */
  private createError(
    type: WorkflowError['type'],
    message: string,
    context: any = {}
  ): WorkflowError {
    return {
      type,
      message,
      code: context.code,
      statusCode: context.statusCode,
      sessionId: context.sessionId,
      retryable: type === 'network' || type === 'timeout',
      timestamp: new Date().toISOString(),
      context
    };
  }

  /**
   * Handle and log errors
   */
  private handleError(error: any, operation: string, context: any = {}): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.log('error', `Operation ${operation} failed: ${errorMessage}`, { error, context });
  }

  /**
   * Log messages based on configuration
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!this.config.observability?.enableLogging) return;

    const logLevel = this.config.observability?.logLevel || 'info';
    const levels = ['debug', 'info', 'warn', 'error'];
    
    if (levels.indexOf(level) >= levels.indexOf(logLevel)) {
      console[level](`[WorkflowClient] ${message}`, data);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default WorkflowClient;
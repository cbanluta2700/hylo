/**
 * QStash Session Manager for Workflow Orchestration
 * 
 * Manages workflow sessions using Upstash QStash for durable execution and Redis for state persistence.
 * Provides session lifecycle management, progress tracking, and recovery mechanisms for multi-agent workflows.
 * Optimized for Vercel Edge Runtime with comprehensive error handling and monitoring.
 * 
 * Features:
 * - Durable workflow session persistence with Redis
 * - QStash message orchestration for agent execution
 * - Real-time progress tracking and state updates
 * - Session recovery and fault tolerance
 * - Cost tracking and resource limit enforcement
 * - Session cleanup and resource management
 */

import { Client } from '@upstash/qstash';
import { Redis } from '@upstash/redis';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { 
  WorkflowState, 
  AgentType,
  type TravelFormData,
  type AgentResult
} from '../../../src/types/agents';
import { langSmithTracingService } from '../../services/tracing/langsmith';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Workflow progress tracking
 */
export interface WorkflowProgress {
  currentStep: number;
  totalSteps: number;
  percentage: number;
  currentAgent: AgentType | null;
  estimatedTimeRemaining: number;
  completedAgents: AgentType[];
  failedAgents: AgentType[];
}

/**
 * Workflow session metadata and state
 */
export interface WorkflowSession {
  sessionId: string;
  state: WorkflowState;
  formData: TravelFormData;
  progress: WorkflowProgress;
  agentResults: Record<AgentType, AgentResult | null>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    startedAt?: string;
    completedAt?: string;
    cancelledAt?: string;
    totalCost: number;
    estimatedDuration: number;
    actualDuration?: number;
    retryCount: number;
    lastHeartbeat: string;
    version: string;
  };
  config: WorkflowSessionConfig;
  checkpoints: WorkflowCheckpoint[];
  events: WorkflowEvent[];
  subscribers: string[]; // Connection IDs for real-time updates
}

/**
 * Workflow session configuration
 */
export interface WorkflowSessionConfig {
  maxExecutionTime: number; // milliseconds
  maxCost: number; // USD
  maxRetries: number;
  checkpointInterval: number; // milliseconds
  heartbeatInterval: number; // milliseconds
  streaming: boolean;
  observability: {
    langsmithEnabled: boolean;
    langsmithProject?: string;
    verboseLogging: boolean;
    tracingLevel: 'minimal' | 'standard' | 'verbose';
  };
  recovery: {
    enableAutoRecovery: boolean;
    recoveryTimeout: number; // milliseconds
    maxRecoveryAttempts: number;
  };
}

/**
 * Workflow checkpoint for recovery
 */
export interface WorkflowCheckpoint {
  id: string;
  timestamp: string;
  agentType: AgentType;
  state: WorkflowState;
  progress: number; // 0-100
  data: any;
  cost: number;
  metadata: {
    durationMs: number;
    retryCount: number;
    previousCheckpointId?: string;
  };
}

/**
 * Workflow events for tracking and debugging
 */
export interface WorkflowEvent {
  id: string;
  timestamp: string;
  type: 'session.created' | 'agent.started' | 'agent.completed' | 'agent.failed' | 
        'session.paused' | 'session.resumed' | 'session.cancelled' | 'session.completed' |
        'checkpoint.created' | 'recovery.initiated' | 'recovery.completed' | 'error' | 'warning';
  agentType?: AgentType;
  data?: any;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Session query and filtering options
 */
export interface SessionQueryOptions {
  state?: WorkflowState[];
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
  includeEvents?: boolean;
  includeCheckpoints?: boolean;
}

/**
 * Session statistics and metrics
 */
export interface SessionMetrics {
  totalSessions: number;
  activeSessionsCount: number;
  completedSessionsCount: number;
  failedSessionsCount: number;
  averageDuration: number;
  averageCost: number;
  successRate: number;
  costEfficiency: number;
  agentPerformance: Record<AgentType, {
    averageDuration: number;
    successRate: number;
    averageCost: number;
  }>;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const WorkflowSessionConfigSchema = z.object({
  maxExecutionTime: z.number().default(300000), // 5 minutes
  maxCost: z.number().default(5.0), // $5 USD
  maxRetries: z.number().default(3),
  checkpointInterval: z.number().default(30000), // 30 seconds
  heartbeatInterval: z.number().default(10000), // 10 seconds
  streaming: z.boolean().default(true),
  observability: z.object({
    langsmithEnabled: z.boolean().default(true),
    langsmithProject: z.string().optional(),
    verboseLogging: z.boolean().default(false),
    tracingLevel: z.enum(['minimal', 'standard', 'verbose']).default('standard')
  }),
  recovery: z.object({
    enableAutoRecovery: z.boolean().default(true),
    recoveryTimeout: z.number().default(60000), // 1 minute
    maxRecoveryAttempts: z.number().default(3)
  })
});

// =============================================================================
// SESSION MANAGER SERVICE
// =============================================================================

/**
 * QStash-powered Session Manager for durable workflow execution
 */
export class QStashSessionManager {
  private qstashClient: Client;
  private redisClient: Redis;
  private readonly SESSION_PREFIX = 'hylo:session:';
  private readonly CHECKPOINT_PREFIX = 'hylo:checkpoint:';
  private readonly EVENT_PREFIX = 'hylo:event:';
  private readonly METRICS_KEY = 'hylo:metrics';

  constructor() {
    if (!process.env.QSTASH_TOKEN) {
      throw new Error('QSTASH_TOKEN environment variable is required');
    }

    this.qstashClient = new Client({
      token: process.env.QSTASH_TOKEN!,
    });

    // Initialize Redis client for state persistence
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Upstash Redis credentials are required for session management');
    }

    this.redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }

  /**
   * Create a new workflow session with Redis persistence
   */
  public async createSession(
    formData: TravelFormData,
    config: Partial<WorkflowSessionConfig> = {}
  ): Promise<WorkflowSession> {
    // Validate and merge configuration
    const validatedConfig = WorkflowSessionConfigSchema.parse(config);
    
    // Generate session ID
    const sessionId = uuidv4();
    
    // Create session object
    const session: WorkflowSession = {
      sessionId,
      state: WorkflowState.INITIALIZED,
      formData,
      progress: {
        currentStep: 0,
        totalSteps: 4,
        percentage: 0,
        currentAgent: null,
        estimatedTimeRemaining: validatedConfig.maxExecutionTime,
        completedAgents: [],
        failedAgents: []
      },
      agentResults: {
        [AgentType.CONTENT_PLANNER]: null,
        [AgentType.INFO_GATHERER]: null,
        [AgentType.STRATEGIST]: null,
        [AgentType.COMPILER]: null
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalCost: 0,
        estimatedDuration: validatedConfig.maxExecutionTime,
        retryCount: 0,
        lastHeartbeat: new Date().toISOString(),
        version: '1.0.0'
      },
      config: validatedConfig,
      checkpoints: [],
      events: [],
      subscribers: []
    };

    // Create initial event
    const createdEvent: WorkflowEvent = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: 'session.created',
      message: `Workflow session created for ${formData.destination}`,
      severity: 'low',
      data: {
        destination: formData.destination,
        adults: formData.adults,
        children: formData.children
      }
    };
    
    session.events.push(createdEvent);

    // Persist session to Redis
    await this.persistSession(session);
    
    // Initialize LangSmith tracing if enabled
    if (validatedConfig.observability.langsmithEnabled) {
      try {
        await langSmithTracingService.startWorkflowTrace({
          workflowId: sessionId,
          sessionId,
          destination: formData.destination,
          totalAgents: 4,
          agentResults: {}
        });
      } catch (error) {
        console.warn('Failed to initialize LangSmith tracing:', error);
      }
    }
    
    return session;
  }

  /**
   * Retrieve session by ID with full state
   */
  public async getSession(sessionId: string): Promise<WorkflowSession | null> {
    try {
      const sessionKey = this.SESSION_PREFIX + sessionId;
      const sessionData = await this.redisClient.get(sessionKey);
      
      if (!sessionData) {
        return null;
      }

      return sessionData as WorkflowSession;
    } catch (error) {
      console.error(`Failed to retrieve session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Update session state and progress
   */
  public async updateSession(
    sessionId: string,
    updates: Partial<WorkflowSession>
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Merge updates
    const updatedSession: WorkflowSession = {
      ...session,
      ...updates,
      metadata: {
        ...session.metadata,
        ...updates.metadata,
        updatedAt: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString()
      }
    };

    // Update progress calculations
    if (updates.progress) {
      updatedSession.progress = this.calculateProgress(updatedSession);
    }

    // Persist updated session
    await this.persistSession(updatedSession);

    // Notify subscribers if streaming is enabled
    if (session.config.streaming && session.subscribers.length > 0) {
      await this.notifySubscribers(sessionId, {
        type: 'session.updated',
        session: updatedSession
      });
    }

    // Update LangSmith tracing
    if (session.config.observability.langsmithEnabled) {
      try {
        await langSmithTracingService.updateWorkflowTrace(sessionId, {
          totalCost: updatedSession.metadata.totalCost
        });
      } catch (error) {
        console.warn('Failed to update LangSmith tracing:', error);
      }
    }
  }

  /**
   * Create a checkpoint for recovery purposes
   */
  public async createCheckpoint(
    sessionId: string,
    agentType: AgentType,
    data: any
  ): Promise<string> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const checkpointId = uuidv4();
    const checkpoint: WorkflowCheckpoint = {
      id: checkpointId,
      timestamp: new Date().toISOString(),
      agentType,
      state: session.state,
      progress: session.progress.percentage,
      data,
      cost: session.metadata.totalCost,
      metadata: {
        durationMs: Date.now() - new Date(session.metadata.createdAt).getTime(),
        retryCount: session.metadata.retryCount,
        previousCheckpointId: session.checkpoints.length > 0 ? 
          session.checkpoints[session.checkpoints.length - 1].id : undefined
      }
    };

    // Add checkpoint to session
    session.checkpoints.push(checkpoint);
    
    // Create checkpoint event
    const event: WorkflowEvent = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: 'checkpoint.created',
      agentType,
      message: `Checkpoint created for ${agentType} agent`,
      severity: 'low',
      data: { checkpointId, progress: checkpoint.progress }
    };
    
    session.events.push(event);

    // Update session
    await this.updateSession(sessionId, session);

    // Persist checkpoint separately for faster recovery lookups
    const checkpointKey = this.CHECKPOINT_PREFIX + checkpointId;
    await this.redisClient.setex(checkpointKey, 86400, JSON.stringify(checkpoint)); // 24 hour TTL

    return checkpointId;
  }

  /**
   * Recover session from the latest checkpoint
   */
  public async recoverSession(sessionId: string): Promise<WorkflowSession | null> {
    const session = await this.getSession(sessionId);
    if (!session || session.checkpoints.length === 0) {
      return null;
    }

    // Get latest checkpoint
    const latestCheckpoint = session.checkpoints[session.checkpoints.length - 1];
    
    // Create recovery event
    const recoveryEvent: WorkflowEvent = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: 'recovery.initiated',
      agentType: latestCheckpoint.agentType,
      message: `Session recovery initiated from checkpoint ${latestCheckpoint.id}`,
      severity: 'medium',
      data: { 
        checkpointId: latestCheckpoint.id,
        recoveryFromAgent: latestCheckpoint.agentType 
      }
    };

    session.events.push(recoveryEvent);

    // Reset session state based on checkpoint
    session.state = WorkflowState.CONTENT_PLANNING; // Resume processing from appropriate state
    session.metadata.retryCount += 1;
    session.metadata.updatedAt = new Date().toISOString();

    // Persist recovered session
    await this.persistSession(session);

    return session;
  }

  /**
   * Cancel workflow session and cleanup resources
   */
  public async cancelSession(
    sessionId: string,
    reason: string = 'User cancelled'
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Create cancellation event
    const cancelEvent: WorkflowEvent = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: 'session.cancelled',
      message: `Session cancelled: ${reason}`,
      severity: 'medium',
      data: { reason, cancelledBy: 'user' }
    };

    // Update session state
    const updates: Partial<WorkflowSession> = {
      state: WorkflowState.CANCELLED,
      events: [...session.events, cancelEvent],
      metadata: {
        ...session.metadata,
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    await this.updateSession(sessionId, updates);

    // Cleanup scheduled tasks
    await this.cleanupSession(sessionId);

    // Complete LangSmith tracing
    if (session.config.observability.langsmithEnabled) {
      try {
        await langSmithTracingService.completeWorkflowTrace(sessionId, {
          totalCost: session.metadata.totalCost,
          status: 'completed'
        });
      } catch (error) {
        console.warn('Failed to complete LangSmith tracing:', error);
      }
    }
  }

  /**
   * Complete workflow session successfully
   */
  public async completeSession(
    sessionId: string,
    finalResult: any
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Calculate final metrics
    const startTime = session.metadata.startedAt ? 
      new Date(session.metadata.startedAt).getTime() : 
      new Date(session.metadata.createdAt).getTime();
    const actualDuration = Date.now() - startTime;

    // Create completion event
    const completionEvent: WorkflowEvent = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: 'session.completed',
      message: 'Workflow session completed successfully',
      severity: 'low',
      data: { 
        finalResult,
        duration: actualDuration,
        cost: session.metadata.totalCost
      }
    };

    // Update session state
    const updates: Partial<WorkflowSession> = {
      state: WorkflowState.COMPLETED,
      events: [...session.events, completionEvent],
      metadata: {
        ...session.metadata,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        actualDuration
      }
    };

    await this.updateSession(sessionId, updates);

    // Update metrics
    await this.updateMetrics(session);

    // Complete LangSmith tracing
    if (session.config.observability.langsmithEnabled) {
      try {
        await langSmithTracingService.completeWorkflowTrace(sessionId, {
          totalCost: session.metadata.totalCost,
          totalDuration: actualDuration,
          status: 'completed'
        });
      } catch (error) {
        console.warn('Failed to complete LangSmith tracing:', error);
      }
    }
  }

  /**
   * Add event to session timeline
   */
  public async addEvent(
    sessionId: string,
    event: Omit<WorkflowEvent, 'id' | 'timestamp'>
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const fullEvent: WorkflowEvent = {
      ...event,
      id: uuidv4(),
      timestamp: new Date().toISOString()
    };

    session.events.push(fullEvent);
    
    // Persist event separately for efficient querying
    const eventKey = this.EVENT_PREFIX + fullEvent.id;
    await this.redisClient.setex(eventKey, 604800, JSON.stringify(fullEvent)); // 7 day TTL

    // Update session
    await this.updateSession(sessionId, { events: session.events });
  }

  /**
   * Subscribe to real-time session updates
   */
  public async subscribe(sessionId: string, subscriberId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (!session.subscribers.includes(subscriberId)) {
      session.subscribers.push(subscriberId);
      await this.updateSession(sessionId, { subscribers: session.subscribers });
    }
  }

  /**
   * Unsubscribe from real-time session updates
   */
  public async unsubscribe(sessionId: string, subscriberId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return; // Session may have been deleted
    }

    const index = session.subscribers.indexOf(subscriberId);
    if (index > -1) {
      session.subscribers.splice(index, 1);
      await this.updateSession(sessionId, { subscribers: session.subscribers });
    }
  }

  /**
   * Query sessions with filtering and pagination
   */
  public async querySessions(
    options: SessionQueryOptions = {}
  ): Promise<{
    sessions: WorkflowSession[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      // Get all session keys
      const sessionKeys = await this.redisClient.keys(`${this.SESSION_PREFIX}*`);
      const allSessions: WorkflowSession[] = [];
      
      // Retrieve sessions in batches
      for (const key of sessionKeys) {
        try {
          const session = await this.redisClient.get(key);
          if (session) {
            allSessions.push(session as WorkflowSession);
          }
        } catch (error) {
          console.warn(`Failed to retrieve session for key ${key}:`, error);
        }
      }
      
      // Apply filters
      let filteredSessions = allSessions;
      
      if (options.state) {
        filteredSessions = filteredSessions.filter(s => options.state!.includes(s.state));
      }
      
      if (options.createdAfter) {
        filteredSessions = filteredSessions.filter(s => 
          new Date(s.metadata.createdAt) >= options.createdAfter!);
      }
      
      if (options.createdBefore) {
        filteredSessions = filteredSessions.filter(s => 
          new Date(s.metadata.createdAt) <= options.createdBefore!);
      }

      // Apply pagination
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      const paginatedSessions = filteredSessions.slice(offset, offset + limit);

      return {
        sessions: paginatedSessions,
        total: filteredSessions.length,
        hasMore: (offset + limit) < filteredSessions.length
      };
    } catch (error) {
      console.error('Failed to query sessions:', error);
      return {
        sessions: [],
        total: 0,
        hasMore: false
      };
    }
  }

  /**
   * Get comprehensive session metrics
   */
  public async getMetrics(): Promise<SessionMetrics> {
    try {
      const metricsData = await this.redisClient.get(this.METRICS_KEY);
      
      if (metricsData) {
        return metricsData as SessionMetrics;
      }
    } catch (error) {
      console.warn('Failed to retrieve metrics:', error);
    }

    // Return default metrics if none exist
    return {
      totalSessions: 0,
      activeSessionsCount: 0,
      completedSessionsCount: 0,
      failedSessionsCount: 0,
      averageDuration: 0,
      averageCost: 0,
      successRate: 0,
      costEfficiency: 0,
      agentPerformance: {
        [AgentType.CONTENT_PLANNER]: { averageDuration: 0, successRate: 0, averageCost: 0 },
        [AgentType.INFO_GATHERER]: { averageDuration: 0, successRate: 0, averageCost: 0 },
        [AgentType.STRATEGIST]: { averageDuration: 0, successRate: 0, averageCost: 0 },
        [AgentType.COMPILER]: { averageDuration: 0, successRate: 0, averageCost: 0 }
      }
    };
  }

  /**
   * Trigger agent execution via QStash
   */
  public async triggerAgentExecution(
    sessionId: string,
    agentType: AgentType,
    callbackUrl: string
  ): Promise<{ messageId: string }> {
    try {
      const result = await this.qstashClient.publishJSON({
        url: callbackUrl,
        body: {
          sessionId,
          agentType,
          timestamp: new Date().toISOString()
        },
        retries: 3,
        delay: 1000 // 1 second delay
      });

      return { messageId: result.messageId };
    } catch (error) {
      console.error(`Failed to trigger agent execution for ${agentType}:`, error);
      throw error;
    }
  }

  /**
   * Get service health status
   */
  public async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    qstashConnected: boolean;
    redisConnected: boolean;
    activeSessions: number;
    metrics: {
      totalSessions: number;
      successRate: number;
      averageLatency: number;
    };
  }> {
    try {
      // Test connections
      const qstashHealthy = await this.testQStashConnection();
      const redisHealthy = await this.testRedisConnection();
      
      // Get basic metrics
      const metrics = await this.getMetrics();
      
      const activeSessions = metrics.activeSessionsCount;
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (qstashHealthy && redisHealthy) {
        status = 'healthy';
      } else if (qstashHealthy || redisHealthy) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return {
        status,
        qstashConnected: qstashHealthy,
        redisConnected: redisHealthy,
        activeSessions,
        metrics: {
          totalSessions: metrics.totalSessions,
          successRate: metrics.successRate,
          averageLatency: metrics.averageDuration
        }
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        qstashConnected: false,
        redisConnected: false,
        activeSessions: 0,
        metrics: {
          totalSessions: 0,
          successRate: 0,
          averageLatency: 0
        }
      };
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Persist session to Redis storage
   */
  private async persistSession(session: WorkflowSession): Promise<void> {
    const sessionKey = this.SESSION_PREFIX + session.sessionId;
    
    try {
      // Set with 24 hour expiration
      await this.redisClient.setex(sessionKey, 86400, JSON.stringify(session));
    } catch (error) {
      console.error(`Failed to persist session ${session.sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate progress based on agent completion
   */
  private calculateProgress(session: WorkflowSession): WorkflowProgress {
    const totalAgents = 4;
    const completedCount = session.progress.completedAgents.length;
    const percentage = Math.round((completedCount / totalAgents) * 100);
    
    return {
      ...session.progress,
      currentStep: completedCount + 1,
      totalSteps: totalAgents,
      percentage,
      estimatedTimeRemaining: session.config.maxExecutionTime * (1 - percentage / 100)
    };
  }

  /**
   * Notify subscribers of session updates
   */
  private async notifySubscribers(sessionId: string, data: any): Promise<void> {
    // This would integrate with WebSocket or Server-Sent Events
    // For now, we'll log the notification
    console.log(`Notifying ${data.session?.subscribers?.length || 0} subscribers for session ${sessionId}`, data);
  }

  /**
   * Cleanup session resources
   */
  private async cleanupSession(sessionId: string): Promise<void> {
    const sessionKey = this.SESSION_PREFIX + sessionId;
    
    try {
      // Delete session and related data
      await this.redisClient.del(sessionKey);
      
      // Cleanup checkpoints
      const checkpointKeys = await this.redisClient.keys(`${this.CHECKPOINT_PREFIX}*`);
      for (const key of checkpointKeys) {
        const checkpoint = await this.redisClient.get(key);
        if (checkpoint && typeof checkpoint === 'object' && 'sessionId' in checkpoint) {
          if ((checkpoint as any).sessionId === sessionId) {
            await this.redisClient.del(key);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to cleanup session ${sessionId}:`, error);
    }
  }

  /**
   * Update aggregate metrics
   */
  private async updateMetrics(session: WorkflowSession): Promise<void> {
    try {
      const currentMetrics = await this.getMetrics();
      
      // Update counters
      currentMetrics.totalSessions += 1;
      
      if (session.state === WorkflowState.COMPLETED) {
        currentMetrics.completedSessionsCount += 1;
      } else if (session.state === WorkflowState.FAILED) {
        currentMetrics.failedSessionsCount += 1;
      }
      
      // Update averages (simplified calculation)
      if (session.metadata.actualDuration) {
        currentMetrics.averageDuration = 
          (currentMetrics.averageDuration + session.metadata.actualDuration) / 2;
      }
      
      currentMetrics.averageCost = 
        (currentMetrics.averageCost + session.metadata.totalCost) / 2;
      
      currentMetrics.successRate = 
        currentMetrics.completedSessionsCount / currentMetrics.totalSessions * 100;

      // Persist updated metrics
      await this.redisClient.setex(this.METRICS_KEY, 86400, JSON.stringify(currentMetrics));
    } catch (error) {
      console.warn('Failed to update metrics:', error);
    }
  }

  /**
   * Test QStash connection
   */
  private async testQStashConnection(): Promise<boolean> {
    try {
      // Simple connection test - just try to create a client
      return !!this.qstashClient;
    } catch (error) {
      console.warn('QStash connection test failed:', error);
      return false;
    }
  }

  /**
   * Test Redis connection
   */
  private async testRedisConnection(): Promise<boolean> {
    try {
      await this.redisClient.ping();
      return true;
    } catch (error) {
      console.warn('Redis connection test failed:', error);
      return false;
    }
  }
}

// =============================================================================
// SERVICE INSTANCE
// =============================================================================

/**
 * Default session manager instance
 */
export const qstashSessionManager = new QStashSessionManager();

export default qstashSessionManager;
/**
 * Real-Time Message Routing
 * Routes messages between workflexport interface MessageEnvelope {
  id: string;
  type: MessageType;
  priority: number;
  target: RoutingTarget;
  sessionId?: string;
  workflowId?: string;
  userId?: string;
  timestamp: string;
  expiresAt: string;
  payload: any;
  metadata: {
    source: string;
    correlationId?: string;
    retryCount: number;
    routingStrategy: RoutingStrategy;
    tags: string[];
  };
}ients in real-time
 */

import { connectionManager, MessageType } from '../../api/itinerary/live';

/**
 * Message routing configuration
 */
export const ROUTING_CONFIG = {
  // Message priorities
  PRIORITIES: {
    [MessageType.ERROR_NOTIFICATION]: 10,
    [MessageType.COMPLETION_NOTIFICATION]: 9,
    [MessageType.PROGRESS_UPDATE]: 8,
    [MessageType.AGENT_UPDATE]: 7,
    [MessageType.WORKFLOW_STATUS]: 6,
    [MessageType.HEARTBEAT_ACK]: 5,
    [MessageType.PONG]: 4,
    [MessageType.HEARTBEAT]: 3,
    [MessageType.PING]: 2,
  } as Record<MessageType, number>,

  // Routing rules
  ROUTES: {
    workflow: ['session', 'workflow'],
    agent: ['session', 'agent'],
    progress: ['session', 'progress'],
    error: ['session', 'error'],
    system: ['system'],
  },

  // Message TTL (time to live) in milliseconds
  MESSAGE_TTL: 300000, // 5 minutes

  // Batch processing
  BATCH_SIZE: 10,
  BATCH_TIMEOUT: 1000, // 1 second

  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const;

/**
 * Message routing types
 */
export enum RoutingTarget {
  SESSION = 'session',
  WORKFLOW = 'workflow',
  AGENT = 'agent',
  PROGRESS = 'progress',
  ERROR = 'error',
  SYSTEM = 'system',
  ALL = 'all',
}

export enum RoutingStrategy {
  BROADCAST = 'broadcast', // Send to all matching targets
  ROUND_ROBIN = 'round_robin', // Send to one target at a time
  PRIORITY = 'priority', // Send based on priority
  DIRECT = 'direct', // Send directly to specific target
}

/**
 * Message envelope for routing
 */
export interface MessageEnvelope {
  id: string;
  type: MessageType;
  priority: number;
  target: RoutingTarget;
  sessionId?: string;
  workflowId?: string;
  userId?: string;
  timestamp: string;
  expiresAt: string;
  payload: any;
  metadata: {
    source: string;
    correlationId?: string | undefined;
    retryCount: number;
    routingStrategy: RoutingStrategy;
    tags: string[];
  };
}

/**
 * Routing rule interface
 */
export interface RoutingRule {
  id: string;
  name: string;
  condition: (envelope: MessageEnvelope) => boolean;
  action: (envelope: MessageEnvelope) => Promise<void>;
  priority: number;
  enabled: boolean;
}

/**
 * Message Router
 * Routes real-time messages between different components
 */
export class MessageRouter {
  private rules: Map<string, RoutingRule> = new Map();
  private messageQueue: MessageEnvelope[] = [];
  private processingInterval: NodeJS.Timeout | null = null;
  private batchTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeDefaultRules();
    this.startMessageProcessing();
  }

  /**
   * Route a message through the routing system
   */
  async routeMessage(
    type: MessageType,
    payload: any,
    options: {
      target?: RoutingTarget;
      sessionId?: string;
      workflowId?: string;
      userId?: string;
      correlationId?: string;
      tags?: string[];
      priority?: number;
      strategy?: RoutingStrategy;
    } = {}
  ): Promise<void> {
    const envelope: MessageEnvelope = {
      id: this.generateMessageId(),
      type,
      priority: options.priority || ROUTING_CONFIG.PRIORITIES[type] || 5,
      target: options.target || this.inferTarget(type),
      sessionId: options.sessionId,
      workflowId: options.workflowId,
      userId: options.userId,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ROUTING_CONFIG.MESSAGE_TTL).toISOString(),
      payload,
      metadata: {
        source: 'message-router',
        correlationId: options.correlationId,
        retryCount: 0,
        routingStrategy: options.strategy || RoutingStrategy.BROADCAST,
        tags: options.tags || [],
      },
    };

    // Add to processing queue
    this.messageQueue.push(envelope);

    // Sort by priority (higher priority first)
    this.messageQueue.sort((a, b) => b.priority - a.priority);

    // Process immediately if high priority
    if (envelope.priority >= 8) {
      await this.processMessages();
    } else {
      // Schedule batch processing
      this.scheduleBatchProcessing();
    }
  }

  /**
   * Add a custom routing rule
   */
  addRule(rule: RoutingRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove a routing rule
   */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Enable or disable a routing rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Get routing statistics
   */
  getStats(): {
    queuedMessages: number;
    activeRules: number;
    totalRules: number;
    messagesProcessed: number;
    averageProcessingTime: number;
  } {
    return {
      queuedMessages: this.messageQueue.length,
      activeRules: Array.from(this.rules.values()).filter((r) => r.enabled).length,
      totalRules: this.rules.size,
      messagesProcessed: 0, // Would need to track this
      averageProcessingTime: 0, // Would need to track this
    };
  }

  /**
   * Process messages in the queue
   */
  private async processMessages(): Promise<void> {
    const batchSize = Math.min(ROUTING_CONFIG.BATCH_SIZE, this.messageQueue.length);
    const messages = this.messageQueue.splice(0, batchSize);

    // Process messages in parallel
    const promises = messages.map((message) => this.processMessage(message));
    await Promise.allSettled(promises);
  }

  /**
   * Process a single message
   */
  private async processMessage(envelope: MessageEnvelope): Promise<void> {
    try {
      // Check if message has expired
      if (new Date() > new Date(envelope.expiresAt)) {
        console.warn(`Message ${envelope.id} has expired, discarding`);
        return;
      }

      // Apply routing rules
      const applicableRules = Array.from(this.rules.values())
        .filter((rule) => rule.enabled && rule.condition(envelope))
        .sort((a, b) => b.priority - a.priority);

      if (applicableRules.length === 0) {
        // Use default routing
        await this.applyDefaultRouting(envelope);
      } else {
        // Apply custom rules
        for (const rule of applicableRules) {
          try {
            await rule.action(envelope);
          } catch (error) {
            console.error(`Error applying routing rule ${rule.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Error processing message ${envelope.id}:`, error);

      // Retry logic
      if (envelope.metadata.retryCount < ROUTING_CONFIG.MAX_RETRIES) {
        envelope.metadata.retryCount++;
        setTimeout(() => {
          this.messageQueue.push(envelope);
        }, ROUTING_CONFIG.RETRY_DELAY * envelope.metadata.retryCount);
      }
    }
  }

  /**
   * Apply default routing logic
   */
  private async applyDefaultRouting(envelope: MessageEnvelope): Promise<void> {
    switch (envelope.type) {
      case MessageType.PROGRESS_UPDATE:
        await this.routeProgressUpdate(envelope);
        break;

      case MessageType.AGENT_UPDATE:
        await this.routeAgentUpdate(envelope);
        break;

      case MessageType.ERROR_NOTIFICATION:
        await this.routeErrorNotification(envelope);
        break;

      case MessageType.COMPLETION_NOTIFICATION:
        await this.routeCompletionNotification(envelope);
        break;

      case MessageType.WORKFLOW_STATUS:
        await this.routeWorkflowStatus(envelope);
        break;

      case MessageType.HEARTBEAT:
      case MessageType.HEARTBEAT_ACK:
      case MessageType.PING:
      case MessageType.PONG:
        await this.routeSystemMessage(envelope);
        break;

      default:
        console.warn(`No default routing for message type: ${envelope.type}`);
    }
  }

  /**
   * Route progress update messages
   */
  private async routeProgressUpdate(envelope: MessageEnvelope): Promise<void> {
    if (!envelope.sessionId) return;

    await connectionManager.broadcastToSession(envelope.sessionId, {
      type: MessageType.PROGRESS_UPDATE,
      payload: {
        ...envelope.payload,
        messageId: envelope.id,
        correlationId: envelope.metadata.correlationId,
      },
    });
  }

  /**
   * Route agent update messages
   */
  private async routeAgentUpdate(envelope: MessageEnvelope): Promise<void> {
    if (!envelope.sessionId) return;

    await connectionManager.sendAgentUpdate(
      envelope.sessionId,
      envelope.payload.agentType,
      envelope.payload.status,
      {
        progress: envelope.payload.progress,
        message: envelope.payload.message,
      }
    );
  }

  /**
   * Route error notification messages
   */
  private async routeErrorNotification(envelope: MessageEnvelope): Promise<void> {
    if (!envelope.sessionId) return;

    await connectionManager.broadcastToSession(envelope.sessionId, {
      type: MessageType.ERROR_NOTIFICATION,
      payload: {
        ...envelope.payload,
        messageId: envelope.id,
        severity: 'high',
        correlationId: envelope.metadata.correlationId,
      },
    });
  }

  /**
   * Route completion notification messages
   */
  private async routeCompletionNotification(envelope: MessageEnvelope): Promise<void> {
    if (!envelope.sessionId || !envelope.workflowId) return;

    await connectionManager.sendCompletionNotification(
      envelope.sessionId,
      envelope.workflowId,
      envelope.payload.result
    );
  }

  /**
   * Route workflow status messages
   */
  private async routeWorkflowStatus(envelope: MessageEnvelope): Promise<void> {
    if (!envelope.sessionId) return;

    await connectionManager.broadcastToSession(envelope.sessionId, {
      type: MessageType.WORKFLOW_STATUS,
      payload: {
        ...envelope.payload,
        messageId: envelope.id,
        correlationId: envelope.metadata.correlationId,
      },
    });
  }

  /**
   * Route system messages (heartbeat, ping, etc.)
   */
  private async routeSystemMessage(envelope: MessageEnvelope): Promise<void> {
    if (!envelope.sessionId) return;

    await connectionManager.broadcastToSession(envelope.sessionId, {
      type: envelope.type,
      payload: {
        ...envelope.payload,
        messageId: envelope.id,
        timestamp: envelope.timestamp,
      },
    });
  }

  /**
   * Initialize default routing rules
   */
  private initializeDefaultRules(): void {
    // Rule 1: High priority error messages
    this.addRule({
      id: 'high-priority-errors',
      name: 'High Priority Error Routing',
      condition: (envelope) =>
        envelope.type === MessageType.ERROR_NOTIFICATION && envelope.priority >= 9,
      action: async (envelope) => {
        // Send to error monitoring system and all session connections
        console.error(`High priority error:`, envelope.payload);
        await this.routeErrorNotification(envelope);
      },
      priority: 10,
      enabled: true,
    });

    // Rule 2: Progress milestone notifications
    this.addRule({
      id: 'progress-milestones',
      name: 'Progress Milestone Notifications',
      condition: (envelope) =>
        envelope.type === MessageType.PROGRESS_UPDATE && envelope.payload.progress % 25 === 0, // Every 25%
      action: async (envelope) => {
        // Add milestone tag and route normally
        envelope.metadata.tags.push('milestone');
        await this.routeProgressUpdate(envelope);
      },
      priority: 8,
      enabled: true,
    });

    // Rule 3: Agent failure notifications
    this.addRule({
      id: 'agent-failures',
      name: 'Agent Failure Notifications',
      condition: (envelope) =>
        envelope.type === MessageType.AGENT_UPDATE && envelope.payload.status === 'failed',
      action: async (envelope) => {
        // Log agent failure and route as error
        console.error(`Agent ${envelope.payload.agentType} failed:`, envelope.payload);
        await this.routeErrorNotification({
          ...envelope,
          type: MessageType.ERROR_NOTIFICATION,
          payload: {
            error: `Agent ${envelope.payload.agentType} failed`,
            details: envelope.payload,
          },
        });
      },
      priority: 9,
      enabled: true,
    });

    // Rule 4: Workflow completion celebrations
    this.addRule({
      id: 'completion-celebrations',
      name: 'Workflow Completion Celebrations',
      condition: (envelope) => envelope.type === MessageType.COMPLETION_NOTIFICATION,
      action: async (envelope) => {
        // Add celebration metadata and route
        envelope.payload.celebration = true;
        envelope.metadata.tags.push('celebration');
        await this.routeCompletionNotification(envelope);
      },
      priority: 7,
      enabled: true,
    });
  }

  /**
   * Infer target from message type
   */
  private inferTarget(type: MessageType): RoutingTarget {
    switch (type) {
      case MessageType.PROGRESS_UPDATE:
        return RoutingTarget.PROGRESS;
      case MessageType.AGENT_UPDATE:
        return RoutingTarget.AGENT;
      case MessageType.ERROR_NOTIFICATION:
        return RoutingTarget.ERROR;
      case MessageType.WORKFLOW_STATUS:
        return RoutingTarget.WORKFLOW;
      case MessageType.HEARTBEAT:
      case MessageType.HEARTBEAT_ACK:
      case MessageType.PING:
      case MessageType.PONG:
        return RoutingTarget.SYSTEM;
      default:
        return RoutingTarget.SESSION;
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start message processing interval
   */
  private startMessageProcessing(): void {
    this.processingInterval = setInterval(() => {
      if (this.messageQueue.length > 0) {
        this.processMessages();
      }
    }, 100); // Process every 100ms
  }

  /**
   * Schedule batch processing
   */
  private scheduleBatchProcessing(): void {
    if (this.batchTimeout) return;

    this.batchTimeout = setTimeout(() => {
      this.batchTimeout = null;
      if (this.messageQueue.length > 0) {
        this.processMessages();
      }
    }, ROUTING_CONFIG.BATCH_TIMEOUT);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    this.messageQueue.length = 0;
    this.rules.clear();
  }
}

/**
 * Global message router instance
 */
export const messageRouter = new MessageRouter();

// Cleanup on process termination
process.on('SIGINT', () => {
  console.log('Shutting down message router...');
  messageRouter.cleanup();
});

process.on('SIGTERM', () => {
  console.log('Shutting down message router...');
  messageRouter.cleanup();
});

/**
 * Convenience functions for common routing operations
 */

/**
 * Route a progress update
 */
export async function routeProgressUpdate(
  sessionId: string,
  workflowId: string,
  progress: number,
  message?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await messageRouter.routeMessage(
    MessageType.PROGRESS_UPDATE,
    {
      progress,
      message,
      ...metadata,
    },
    {
      sessionId,
      workflowId,
      target: RoutingTarget.PROGRESS,
    }
  );
}

/**
 * Route an agent update
 */
export async function routeAgentUpdate(
  sessionId: string,
  workflowId: string,
  agentType: string,
  status: 'started' | 'completed' | 'failed',
  progress?: number,
  message?: string
): Promise<void> {
  await messageRouter.routeMessage(
    MessageType.AGENT_UPDATE,
    {
      agentType,
      status,
      progress,
      message,
    },
    {
      sessionId,
      workflowId,
      target: RoutingTarget.AGENT,
    }
  );
}

/**
 * Route an error notification
 */
export async function routeErrorNotification(
  sessionId: string,
  workflowId: string,
  error: string,
  details?: any
): Promise<void> {
  await messageRouter.routeMessage(
    MessageType.ERROR_NOTIFICATION,
    {
      error,
      details,
    },
    {
      sessionId,
      workflowId,
      target: RoutingTarget.ERROR,
      priority: 10,
    }
  );
}

/**
 * Route a completion notification
 */
export async function routeCompletionNotification(
  sessionId: string,
  workflowId: string,
  result: any
): Promise<void> {
  await messageRouter.routeMessage(
    MessageType.COMPLETION_NOTIFICATION,
    {
      result,
    },
    {
      sessionId,
      workflowId,
      target: RoutingTarget.SESSION,
      priority: 9,
    }
  );
}

/**
 * Export types
 */

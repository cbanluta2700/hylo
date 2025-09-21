/**
 * WebSocket Connection Handler for Real-Time Itinerary Updates
 * Provides live progress tracking and real-time communication for itinerary generation
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import { workflowStateManager } from '../../src/lib/workflows/state-manager';
import { WORKFLOW_EVENTS } from '../../src/lib/workflows/inngest-config';

/**
 * WebSocket connection states
 */
enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

/**
 * Client connection information
 */
interface ClientConnection {
  id: string;
  sessionId: string;
  userId?: string;
  websocket: WebSocket;
  state: ConnectionState;
  connectedAt: Date;
  lastHeartbeat: Date;
  subscriptions: Set<string>;
  metadata: {
    userAgent?: string;
    ip?: string;
    connectionCount: number;
  };
}

/**
 * Message types for WebSocket communication
 */
enum MessageType {
  // Client to Server
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  HEARTBEAT = 'heartbeat',
  PING = 'ping',

  // Server to Client
  PROGRESS_UPDATE = 'progress_update',
  WORKFLOW_STATUS = 'workflow_status',
  AGENT_UPDATE = 'agent_update',
  ERROR_NOTIFICATION = 'error_notification',
  COMPLETION_NOTIFICATION = 'completion_notification',
  HEARTBEAT_ACK = 'heartbeat_ack',
  PONG = 'pong',
}

/**
 * WebSocket message interface
 */
interface WebSocketMessage {
  type: MessageType;
  id: string;
  timestamp: string;
  payload: any;
}

/**
 * WebSocket Connection Manager
 * Manages WebSocket connections and real-time communication
 */
class WebSocketConnectionManager {
  private connections: Map<string, ClientConnection> = new Map();
  private sessionConnections: Map<string, Set<string>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeatMonitoring();
    this.startConnectionCleanup();
  }

  /**
   * Handle new WebSocket connection
   */
  async handleConnection(
    websocket: WebSocket,
    request: IncomingMessage,
    sessionId: string,
    userId?: string
  ): Promise<void> {
    const clientId = this.generateClientId();
    const clientIP = this.extractClientIP(request);
    const userAgent = request.headers['user-agent'];

    const connection: ClientConnection = {
      id: clientId,
      sessionId,
      userId,
      websocket,
      state: ConnectionState.CONNECTED,
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
      subscriptions: new Set(['session', 'workflow']),
      metadata: {
        userAgent,
        ip: clientIP,
        connectionCount: 1,
      },
    };

    // Store connection
    this.connections.set(clientId, connection);

    // Add to session connections
    if (!this.sessionConnections.has(sessionId)) {
      this.sessionConnections.set(sessionId, new Set());
    }
    this.sessionConnections.get(sessionId)!.add(clientId);

    // Set up event handlers
    websocket.on('message', (data: Buffer) => this.handleMessage(clientId, data));
    websocket.on('close', () => this.handleDisconnection(clientId));
    websocket.on('error', (error: Error) => this.handleError(clientId, error));
    websocket.on('pong', () => this.handlePong(clientId));

    // Send welcome message
    this.sendMessage(clientId, {
      type: MessageType.HEARTBEAT_ACK,
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      payload: {
        message: 'Connected to Hylo itinerary service',
        sessionId,
        clientId,
        connectionTime: connection.connectedAt.toISOString(),
      },
    });

    // Send initial status
    await this.sendInitialStatus(clientId, sessionId);

    console.log(`WebSocket connection established: ${clientId} for session ${sessionId}`);
  }

  /**
   * Handle incoming WebSocket message
   */
  private async handleMessage(clientId: string, data: Buffer): Promise<void> {
    try {
      const connection = this.connections.get(clientId);
      if (!connection) return;

      const message: WebSocketMessage = JSON.parse(data.toString());

      switch (message.type) {
        case MessageType.SUBSCRIBE:
          this.handleSubscribe(connection, message.payload);
          break;

        case MessageType.UNSUBSCRIBE:
          this.handleUnsubscribe(connection, message.payload);
          break;

        case MessageType.HEARTBEAT:
        case MessageType.PING:
          this.handleHeartbeat(connection);
          break;

        default:
          console.warn(`Unknown message type: ${message.type} from client ${clientId}`);
      }
    } catch (error) {
      console.error(`Error handling message from client ${clientId}:`, error);
      this.sendErrorMessage(clientId, 'Invalid message format');
    }
  }

  /**
   * Handle subscription request
   */
  private handleSubscribe(connection: ClientConnection, payload: any): void {
    const { topics } = payload;
    if (Array.isArray(topics)) {
      topics.forEach((topic: string) => {
        connection.subscriptions.add(topic);
      });
    }

    this.sendMessage(connection.id, {
      type: MessageType.HEARTBEAT_ACK,
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      payload: {
        message: 'Subscribed to topics',
        topics: Array.from(connection.subscriptions),
      },
    });
  }

  /**
   * Handle unsubscription request
   */
  private handleUnsubscribe(connection: ClientConnection, payload: any): void {
    const { topics } = payload;
    if (Array.isArray(topics)) {
      topics.forEach((topic: string) => {
        connection.subscriptions.delete(topic);
      });
    }

    this.sendMessage(connection.id, {
      type: MessageType.HEARTBEAT_ACK,
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      payload: {
        message: 'Unsubscribed from topics',
        topics: Array.from(connection.subscriptions),
      },
    });
  }

  /**
   * Handle heartbeat/ping
   */
  private handleHeartbeat(connection: ClientConnection): void {
    connection.lastHeartbeat = new Date();

    this.sendMessage(connection.id, {
      type: MessageType.HEARTBEAT_ACK,
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      payload: {
        message: 'Heartbeat acknowledged',
        serverTime: new Date().toISOString(),
      },
    });
  }

  /**
   * Handle pong response
   */
  private handlePong(clientId: string): void {
    const connection = this.connections.get(clientId);
    if (connection) {
      connection.lastHeartbeat = new Date();
    }
  }

  /**
   * Handle WebSocket disconnection
   */
  private handleDisconnection(clientId: string): void {
    const connection = this.connections.get(clientId);
    if (!connection) return;

    connection.state = ConnectionState.DISCONNECTED;

    // Remove from session connections
    const sessionConnections = this.sessionConnections.get(connection.sessionId);
    if (sessionConnections) {
      sessionConnections.delete(clientId);
      if (sessionConnections.size === 0) {
        this.sessionConnections.delete(connection.sessionId);
      }
    }

    // Remove connection
    this.connections.delete(clientId);

    console.log(`WebSocket connection closed: ${clientId} for session ${connection.sessionId}`);
  }

  /**
   * Handle WebSocket error
   */
  private handleError(clientId: string, error: Error): void {
    console.error(`WebSocket error for client ${clientId}:`, error);

    const connection = this.connections.get(clientId);
    if (connection) {
      connection.state = ConnectionState.ERROR;
      this.sendErrorMessage(clientId, 'Connection error occurred');
    }
  }

  /**
   * Send initial status to new connection
   */
  private async sendInitialStatus(clientId: string, sessionId: string): Promise<void> {
    try {
      const workflowState = await workflowStateManager.getWorkflowStateBySession(sessionId);

      if (workflowState) {
        this.sendMessage(clientId, {
          type: MessageType.WORKFLOW_STATUS,
          id: this.generateMessageId(),
          timestamp: new Date().toISOString(),
          payload: {
            workflowId: workflowState.workflowId,
            status: workflowState.status,
            progress: workflowState.progress,
            currentStep: workflowState.currentStep,
            startedAt: workflowState.startedAt,
            estimatedCompletion: workflowState.estimatedCompletion,
          },
        });
      }
    } catch (error) {
      console.error(`Error sending initial status to client ${clientId}:`, error);
    }
  }

  /**
   * Broadcast message to all connections for a session
   */
  async broadcastToSession(
    sessionId: string,
    message: Omit<WebSocketMessage, 'id' | 'timestamp'>
  ): Promise<void> {
    const sessionConnections = this.sessionConnections.get(sessionId);
    if (!sessionConnections) return;

    const fullMessage: WebSocketMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
    };

    for (const clientId of sessionConnections) {
      this.sendMessage(clientId, fullMessage);
    }
  }

  /**
   * Send message to specific client
   */
  private sendMessage(clientId: string, message: WebSocketMessage): void {
    const connection = this.connections.get(clientId);
    if (!connection || connection.websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      connection.websocket.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Error sending message to client ${clientId}:`, error);
    }
  }

  /**
   * Send error message to client
   */
  private sendErrorMessage(clientId: string, errorMessage: string): void {
    this.sendMessage(clientId, {
      type: MessageType.ERROR_NOTIFICATION,
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      payload: {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Send progress update to session
   */
  async sendProgressUpdate(
    sessionId: string,
    progress: number,
    currentStep?: string,
    message?: string
  ): Promise<void> {
    await this.broadcastToSession(sessionId, {
      type: MessageType.PROGRESS_UPDATE,
      payload: {
        progress,
        currentStep,
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Send agent update to session
   */
  async sendAgentUpdate(
    sessionId: string,
    agentType: string,
    status: 'started' | 'completed' | 'failed',
    data?: any
  ): Promise<void> {
    await this.broadcastToSession(sessionId, {
      type: MessageType.AGENT_UPDATE,
      payload: {
        agentType,
        status,
        data,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Send completion notification to session
   */
  async sendCompletionNotification(
    sessionId: string,
    workflowId: string,
    result: any
  ): Promise<void> {
    await this.broadcastToSession(sessionId, {
      type: MessageType.COMPLETION_NOTIFICATION,
      payload: {
        workflowId,
        result,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeatMonitoring(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeoutThreshold = 30000; // 30 seconds

      for (const [clientId, connection] of this.connections) {
        if (now - connection.lastHeartbeat.getTime() > timeoutThreshold) {
          console.warn(`Client ${clientId} heartbeat timeout, terminating connection`);
          connection.websocket.terminate();
          this.handleDisconnection(clientId);
        }
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Start connection cleanup
   */
  private startConnectionCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      // Clean up any stale connections
      for (const [clientId, connection] of this.connections) {
        if (
          connection.websocket.readyState === WebSocket.CLOSED ||
          connection.websocket.readyState === WebSocket.CLOSING
        ) {
          this.handleDisconnection(clientId);
        }
      }
    }, 30000); // Clean up every 30 seconds
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract client IP address
   */
  private extractClientIP(request: IncomingMessage): string | undefined {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded && typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }

    const realIP = request.headers['x-real-ip'];
    if (realIP && typeof realIP === 'string') {
      return realIP;
    }

    return request.socket?.remoteAddress;
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    activeSessions: number;
    connectionsPerSession: Record<string, number>;
  } {
    const connectionsPerSession: Record<string, number> = {};

    for (const [sessionId, connections] of this.sessionConnections) {
      connectionsPerSession[sessionId] = connections.size;
    }

    return {
      totalConnections: this.connections.size,
      activeSessions: this.sessionConnections.size,
      connectionsPerSession,
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Close all connections
    for (const connection of this.connections.values()) {
      connection.websocket.terminate();
    }

    this.connections.clear();
    this.sessionConnections.clear();
  }
}

// Global connection manager instance
const connectionManager = new WebSocketConnectionManager();

// Cleanup on process termination
process.on('SIGINT', () => {
  console.log('Shutting down WebSocket connection manager...');
  connectionManager.cleanup();
});

process.on('SIGTERM', () => {
  console.log('Shutting down WebSocket connection manager...');
  connectionManager.cleanup();
});

/**
 * WebSocket API Handler
 * Next.js API route for WebSocket connections
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests for WebSocket upgrade
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET requests are allowed for WebSocket connections',
      },
    });
  }

  // Validate session ID
  const sessionId = req.query.sessionId as string;
  if (!sessionId) {
    return res.status(400).json({
      error: {
        code: 'MISSING_SESSION_ID',
        message: 'sessionId query parameter is required',
      },
    });
  }

  // Validate session ID format
  if (!sessionId.startsWith('session_') || sessionId.length < 20) {
    return res.status(400).json({
      error: {
        code: 'INVALID_SESSION_ID',
        message: 'Invalid sessionId format',
      },
    });
  }

  // Get user ID from headers (optional)
  const userId = req.headers['x-user-id'] as string | undefined;

  // Check if WebSocket is supported
  if (!res.socket) {
    return res.status(500).json({
      error: {
        code: 'WEBSOCKET_NOT_SUPPORTED',
        message: 'WebSocket connections are not supported on this server',
      },
    });
  }

  // Upgrade to WebSocket connection
  const wss = getWebSocketServer();

  wss.handleUpgrade(req as any, req.socket as Duplex, Buffer.alloc(0), (ws: WebSocket) => {
    connectionManager.handleConnection(ws, req, sessionId, userId);
  });
}

/**
 * Get or create WebSocket server
 */
let wss: WebSocketServer | null = null;

function getWebSocketServer(): WebSocketServer {
  if (!wss) {
    wss = new WebSocketServer({ noServer: true });

    // Handle server-level errors
    wss.on('error', (error: Error) => {
      console.error('WebSocket server error:', error);
    });
  }

  return wss;
}

/**
 * Export connection manager for use in other modules
 */
export { connectionManager, MessageType, ConnectionState };
export type { WebSocketMessage, ClientConnection };

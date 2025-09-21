# WebSocket API Contract: Real-Time Itinerary Updates

**Version**: 1.0.0  
**Protocol**: WebSocket  
**Base URL**: `wss://hylo.vercel.app/api/itinerary/live`

## Connection

### URL Format

```
wss://hylo.vercel.app/api/itinerary/live?requestId={requestId}&sessionId={sessionId}
```

### Query Parameters

- `requestId` (required): UUID of the itinerary request
- `sessionId` (required): User session identifier
- `token` (optional): Authentication token for user-specific features

### Connection Events

```typescript
// Client connects
interface ConnectionMessage {
  type: 'connection';
  status: 'connected' | 'authenticated' | 'error';
  requestId: string;
  sessionId: string;
  timestamp: string;
}

// Server acknowledges connection
interface ConnectionAck {
  type: 'connection_ack';
  status: 'ready';
  subscriptions: string[];
  heartbeatInterval: number; // seconds
}
```

## Message Types

### 1. Progress Updates

```typescript
interface ProgressUpdate {
  type: 'progress';
  requestId: string;
  progress: {
    percentage: number; // 0-100
    phase: 'research' | 'planning' | 'enrichment' | 'formatting';
    message: string;
    details?: string[];
  };
  timestamp: string;
}
```

### 2. Agent Status Updates

```typescript
interface AgentStatusUpdate {
  type: 'agent_status';
  requestId: string;
  agent: {
    type: 'itinerary-architect' | 'web-gatherer' | 'information-specialist' | 'form-putter';
    status: 'started' | 'processing' | 'completed' | 'error';
    progress: number; // 0-100
    message?: string;
    data?: any; // Agent-specific output preview
  };
  timestamp: string;
}
```

### 3. Partial Results

```typescript
interface PartialResult {
  type: 'partial_result';
  requestId: string;
  section: 'accommodation' | 'activities' | 'dining' | 'transportation' | 'timeline';
  data: any; // Section-specific data structure
  confidence: number; // 0-1
  timestamp: string;
}
```

### 4. Form Change Reactions

```typescript
interface FormChangeReaction {
  type: 'form_change';
  requestId: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
    impact: 'low' | 'medium' | 'high';
  }[];
  affectedSections: string[];
  updateEstimate: number; // seconds
  timestamp: string;
}
```

### 5. Completion Notice

```typescript
interface CompletionNotice {
  type: 'completion';
  requestId: string;
  status: 'success' | 'error';
  itineraryId?: string; // Present on success
  error?: {
    code: string;
    message: string;
    details: string[];
  };
  finalResult?: {
    processingTime: number;
    confidence: number;
    agentContributions: AgentContribution[];
  };
  timestamp: string;
}
```

### 6. Error Messages

```typescript
interface ErrorMessage {
  type: 'error';
  requestId?: string;
  error: {
    code: string;
    message: string;
    details?: string[];
    severity: 'warning' | 'error' | 'critical';
  };
  timestamp: string;
}
```

### 7. Heartbeat

```typescript
interface Heartbeat {
  type: 'heartbeat';
  timestamp: string;
}

interface HeartbeatResponse {
  type: 'heartbeat_response';
  timestamp: string;
}
```

## Client-Initiated Messages

### 1. Subscribe to Updates

```typescript
interface SubscribeMessage {
  type: 'subscribe';
  requestId: string;
  subscriptions: Array<'progress' | 'agents' | 'partial_results' | 'form_changes'>;
}
```

### 2. Form Change Notifications

```typescript
interface FormChangeNotification {
  type: 'form_changed';
  requestId: string;
  changes: {
    field: string;
    value: any;
    priority: 'low' | 'medium' | 'high';
  }[];
  trigger: 'user_input' | 'validation' | 'auto_complete';
  timestamp: string;
}
```

### 3. Request Agent Focus

```typescript
interface AgentFocusRequest {
  type: 'agent_focus';
  requestId: string;
  agentType: 'itinerary-architect' | 'web-gatherer' | 'information-specialist' | 'form-putter';
  priority: 'low' | 'high';
  context?: string;
}
```

## Connection Management

### Authentication Flow

1. Client connects with `sessionId` and optional `token`
2. Server validates session and returns `connection_ack`
3. Client sends `subscribe` message with desired update types
4. Server begins streaming relevant updates

### Heartbeat Protocol

- Server sends heartbeat every 30 seconds
- Client must respond within 10 seconds
- Missing 3 consecutive heartbeats triggers disconnection
- Reconnection with same `requestId` resumes from last known state

### Error Handling

```typescript
// Connection errors
interface ConnectionError {
  type: 'connection_error';
  code: 'INVALID_SESSION' | 'REQUEST_NOT_FOUND' | 'RATE_LIMITED' | 'UNAUTHORIZED';
  message: string;
  retryAfter?: number; // seconds
}

// Automatic reconnection strategy
const reconnectConfig = {
  maxRetries: 5,
  baseDelay: 1000, // ms
  maxDelay: 30000, // ms
  backoffMultiplier: 2,
};
```

## Rate Limiting

### Connection Limits

- Max 5 concurrent connections per session
- Max 100 messages per minute per connection
- Form change notifications limited to 1 per second

### Message Priorities

- `error`: Always delivered immediately
- `completion`: High priority, delivered within 100ms
- `progress`: Medium priority, throttled to 2/second
- `partial_result`: Low priority, throttled to 1/second
- `heartbeat`: System priority, not counted in limits

## Example Usage

### TypeScript Client Implementation

```typescript
class HyloWebSocket {
  private ws: WebSocket;
  private requestId: string;
  private sessionId: string;

  constructor(requestId: string, sessionId: string) {
    this.requestId = requestId;
    this.sessionId = sessionId;
    this.connect();
  }

  private connect() {
    const url = `wss://hylo.vercel.app/api/itinerary/live?requestId=${this.requestId}&sessionId=${this.sessionId}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.subscribe(['progress', 'agents', 'partial_results']);
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = (event) => {
      if (!event.wasClean) {
        this.reconnect();
      }
    };
  }

  private subscribe(types: string[]) {
    this.send({
      type: 'subscribe',
      requestId: this.requestId,
      subscriptions: types,
    });
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case 'progress':
        this.onProgress(message);
        break;
      case 'agent_status':
        this.onAgentStatus(message);
        break;
      case 'partial_result':
        this.onPartialResult(message);
        break;
      case 'completion':
        this.onCompletion(message);
        break;
      case 'error':
        this.onError(message);
        break;
      case 'heartbeat':
        this.sendHeartbeatResponse();
        break;
    }
  }

  public notifyFormChange(changes: any[]) {
    this.send({
      type: 'form_changed',
      requestId: this.requestId,
      changes,
      trigger: 'user_input',
      timestamp: new Date().toISOString(),
    });
  }

  private send(message: any) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  // Event handlers to be implemented by consumer
  public onProgress = (message: ProgressUpdate) => {};
  public onAgentStatus = (message: AgentStatusUpdate) => {};
  public onPartialResult = (message: PartialResult) => {};
  public onCompletion = (message: CompletionNotice) => {};
  public onError = (message: ErrorMessage) => {};
}
```

---

**Security Considerations**:

- All connections require valid session IDs
- Rate limiting prevents abuse
- Sensitive data excluded from partial results
- Connection logs for debugging and monitoring

**Performance**:

- Message compression for large payloads
- Selective subscriptions to reduce bandwidth
- Graceful degradation when WebSocket unavailable
- Automatic cleanup of stale connections

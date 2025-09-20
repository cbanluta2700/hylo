# Hylo AI Workflow API Documentation

## Overview

The Hylo AI Workflow API provides endpoints for multi-agent travel itinerary generation using LangGraph StateGraph orchestration. All endpoints run on Vercel Edge Runtime with streaming support and comprehensive error handling.

## Base URL

- **Production**: `https://your-app.vercel.app/api`
- **Development**: `http://localhost:5173/api`

## Authentication

Most endpoints require API key authentication:

```bash
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

## Core Endpoints

### Workflow Management

#### Start Workflow
**POST** `/workflow/start`

Initiates a new multi-agent workflow for travel itinerary generation.

**Request Body:**
```typescript
interface WorkflowStartRequest {
  formData: {
    destination: string;
    startDate: string; // ISO 8601 format
    endDate: string;   // ISO 8601 format
    adults: number;
    children: number;
    budget: {
      amount: number;
      currency: string; // ISO 4217 codes
      type: 'per-person' | 'total' | 'flexible';
    };
    accommodationType: 'hotel' | 'airbnb' | 'hostel' | 'resort' | 'any';
    travelStyle: 'adventure' | 'relaxation' | 'cultural' | 'foodie' | 'budget' | 'luxury';
    interests: string[];
    specialRequests?: string;
  };
  options?: {
    enableStreaming: boolean;
    priority: 'low' | 'normal' | 'high';
    timeout: number; // seconds, max 300
  };
}
```

**Response (Streaming):**
```typescript
interface WorkflowProgressUpdate {
  sessionId: string;
  status: 'initializing' | 'planning' | 'gathering' | 'strategizing' | 'compiling' | 'completed' | 'error';
  currentAgent: 'content-planner' | 'info-gatherer' | 'strategist' | 'compiler' | null;
  progress: number; // 0-100
  message: string;
  timestamp: string; // ISO 8601
  data?: any; // Agent-specific data
}
```

**Success Response (Final):**
```typescript
interface WorkflowResult {
  sessionId: string;
  status: 'completed';
  result: {
    tripSummary: {
      nickname: string;
      dates: string;
      travelers: string;
      budget: string;
    };
    preparedFor: string;
    dailyItinerary: Array<{
      day: number;
      date: string;
      activities: Array<{
        time: string;
        activity: string;
        location: string;
        duration: string;
        cost?: string;
        notes?: string;
      }>;
    }>;
    tipsForYourTrip: string[];
  };
  metadata: {
    processingTime: number; // milliseconds
    agentsInvolved: string[];
    totalCost: number; // LLM API costs
  };
}
```

**Error Response:**
```typescript
interface WorkflowError {
  sessionId?: string;
  status: 'error';
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

#### Get Workflow Status
**GET** `/workflow/status/{sessionId}`

Retrieves current status of an active workflow.

**Parameters:**
- `sessionId` (string): Workflow session identifier

**Response:**
```typescript
interface WorkflowStatus {
  sessionId: string;
  status: 'initializing' | 'planning' | 'gathering' | 'strategizing' | 'compiling' | 'completed' | 'error' | 'cancelled';
  currentAgent: string | null;
  progress: number;
  startTime: string;
  estimatedCompletion?: string;
  message: string;
}
```

#### Cancel Workflow
**DELETE** `/workflow/cancel/{sessionId}`

Cancels an active workflow session.

**Parameters:**
- `sessionId` (string): Workflow session identifier

**Response:**
```typescript
interface CancellationResponse {
  sessionId: string;
  status: 'cancelled';
  message: string;
  timestamp: string;
}
```

### Individual Agent Endpoints

#### Content Planner Agent
**POST** `/agents/content-planner`

Analyzes travel requirements and creates information gathering plan.

**Request Body:**
```typescript
interface ContentPlanRequest {
  formData: TripFormData;
  context?: {
    previousPlans?: any[];
    userPreferences?: Record<string, any>;
  };
}
```

**Response:**
```typescript
interface ContentPlanResult {
  plan: {
    informationNeeds: string[];
    researchQueries: string[];
    priority: 'high' | 'medium' | 'low';
  };
  nextAgent: 'info-gatherer';
  reasoning: string;
}
```

#### Website Info Gatherer Agent
**POST** `/agents/info-gatherer`

Collects real-time web data using advanced search and scraping.

**Request Body:**
```typescript
interface InfoGathererRequest {
  queries: string[];
  destination: string;
  context: {
    dateRange: string;
    budget: string;
    interests: string[];
  };
}
```

**Response:**
```typescript
interface InfoGathererResult {
  gatheredInfo: Array<{
    query: string;
    source: string;
    content: string;
    relevanceScore: number;
    timestamp: string;
  }>;
  summary: string;
  nextAgent: 'strategist';
}
```

#### Planning Strategist Agent
**POST** `/agents/strategist`

Processes gathered information and creates strategic recommendations.

**Request Body:**
```typescript
interface StrategistRequest {
  gatheredInfo: InfoGathererResult['gatheredInfo'];
  originalRequest: TripFormData;
  constraints: {
    budget: number;
    timeframe: string;
    groupSize: number;
  };
}
```

**Response:**
```typescript
interface StrategistResult {
  strategy: {
    dailyThemes: string[];
    budgetAllocation: Record<string, number>;
    logisticsNotes: string[];
  };
  recommendations: Array<{
    category: string;
    suggestion: string;
    reasoning: string;
  }>;
  nextAgent: 'compiler';
}
```

#### Content Compiler Agent
**POST** `/agents/compiler`

Assembles final structured itinerary from all agent inputs.

**Request Body:**
```typescript
interface CompilerRequest {
  originalRequest: TripFormData;
  contentPlan: ContentPlanResult;
  gatheredInfo: InfoGathererResult;
  strategy: StrategistResult;
}
```

**Response:**
```typescript
interface CompilerResult {
  itinerary: WorkflowResult['result'];
  metadata: {
    confidence: number;
    alternatives: number;
    sourcesUsed: string[];
  };
}
```

## System Endpoints

### Health Checks

#### System Health
**GET** `/health/system`

Returns overall system health status.

**Response:**
```typescript
interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    llmProviders: 'up' | 'down';
    vectorStore: 'up' | 'down';
    workflow: 'up' | 'down';
  };
  metrics: {
    uptime: number;
    activeWorkflows: number;
    responseTime: number;
  };
}
```

#### LLM Providers Status
**GET** `/providers/status`

Checks status of all LLM providers.

**Response:**
```typescript
interface ProvidersStatus {
  providers: Array<{
    name: 'cerebras' | 'google' | 'groq';
    status: 'available' | 'limited' | 'unavailable';
    latency: number;
    rateLimits: {
      remaining: number;
      resetTime: string;
    };
  }>;
  recommendation: string; // Which provider to use
}
```

### RAG System (Legacy)

#### Submit Form (Traditional)
**POST** `/rag/submit-form`

Traditional RAG-based itinerary generation (legacy endpoint).

**Request Body:**
```typescript
interface RAGFormRequest {
  formData: TripFormData;
  options?: {
    model: 'cerebras' | 'google' | 'groq';
    temperature: number; // 0-2
  };
}
```

**Response:**
```typescript
interface RAGResult {
  itinerary: string; // Markdown formatted
  processingTime: number;
  model: string;
  timestamp: string;
}
```

## Error Codes

### HTTP Status Codes

- `200` - Success
- `202` - Accepted (for async operations)
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (invalid API key)
- `402` - Payment Required (quota exceeded)
- `403` - Forbidden (feature disabled)
- `404` - Not Found (invalid endpoint)
- `408` - Request Timeout (workflow timeout)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error
- `502` - Bad Gateway (LLM provider error)
- `503` - Service Unavailable (maintenance)

### Custom Error Codes

```typescript
interface ErrorCode {
  WORKFLOW_TIMEOUT: 'WF001';
  INVALID_FORM_DATA: 'WF002';
  AGENT_FAILURE: 'WF003';
  LLM_QUOTA_EXCEEDED: 'WF004';
  VECTOR_STORE_ERROR: 'WF005';
  NETWORK_ERROR: 'WF006';
  VALIDATION_ERROR: 'WF007';
  SESSION_EXPIRED: 'WF008';
  RATE_LIMITED: 'WF009';
  FEATURE_DISABLED: 'WF010';
}
```

## Rate Limits

### Default Limits

- **Free Tier**: 10 workflows/hour, 100 agent calls/hour
- **Premium Tier**: 100 workflows/hour, 1000 agent calls/hour
- **Enterprise**: Custom limits

### Headers

Rate limit information is returned in response headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Type: workflow
```

## Streaming Implementation

### Server-Sent Events (SSE)

Workflow endpoints use SSE for real-time updates:

```javascript
const eventSource = new EventSource('/api/workflow/start', {
  method: 'POST',
  body: JSON.stringify(requestData)
});

eventSource.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('Progress:', update.progress);
};

eventSource.addEventListener('complete', (event) => {
  const result = JSON.parse(event.data);
  console.log('Final result:', result);
});
```

### WebSocket Alternative

For advanced real-time features:

```javascript
const ws = new WebSocket('wss://your-app.vercel.app/api/workflow/stream');
ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  handleWorkflowUpdate(update);
};
```

## SDK Integration

### JavaScript/TypeScript

```typescript
import { HyloWorkflowClient } from '@hylo/sdk';

const client = new HyloWorkflowClient({
  apiKey: process.env.HYLO_API_KEY,
  baseUrl: 'https://your-app.vercel.app/api'
});

// Start workflow with streaming
const workflow = await client.startWorkflow(formData, {
  onProgress: (update) => console.log(update),
  onComplete: (result) => console.log('Done:', result),
  onError: (error) => console.error(error)
});
```

### Python

```python
from hylo_sdk import WorkflowClient

client = WorkflowClient(
    api_key=os.getenv('HYLO_API_KEY'),
    base_url='https://your-app.vercel.app/api'
)

# Synchronous workflow
result = client.start_workflow(form_data)

# Asynchronous with callbacks
async def handle_progress(update):
    print(f"Progress: {update.progress}%")

await client.start_workflow_async(
    form_data,
    on_progress=handle_progress
)
```

## Testing

### Test Endpoints

Development environment provides test endpoints:

```bash
# Test workflow with mock data
curl -X POST https://your-app.vercel.app/api/test/workflow \
  -H "Content-Type: application/json" \
  -d '{"scenario": "basic_trip", "duration": "fast"}'

# Simulate agent failures
curl -X POST https://your-app.vercel.app/api/test/agent-failure \
  -H "Content-Type: application/json" \
  -d '{"agent": "info-gatherer", "errorType": "timeout"}'
```

### Integration Examples

#### Complete Workflow Test

```bash
curl -X POST https://your-app.vercel.app/api/workflow/start \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "destination": "Paris, France",
      "startDate": "2025-10-01",
      "endDate": "2025-10-07",
      "adults": 2,
      "children": 0,
      "budget": {
        "amount": 3000,
        "currency": "USD",
        "type": "total"
      },
      "accommodationType": "hotel",
      "travelStyle": "cultural",
      "interests": ["museums", "architecture", "cuisine"]
    },
    "options": {
      "enableStreaming": true,
      "priority": "normal"
    }
  }'
```

## Security

### API Key Management

- Generate keys in dashboard
- Rotate keys regularly
- Use environment variables
- Monitor usage patterns

### Input Validation

All endpoints validate input using Zod schemas:

```typescript
const formDataSchema = z.object({
  destination: z.string().min(3).max(100),
  startDate: z.string().datetime(),
  adults: z.number().min(1).max(20),
  // ... additional validations
});
```

### Rate Limiting

Implement rate limiting based on:
- API key tier
- Endpoint type
- User location
- Time window

## Support

For API support and questions:

- **Documentation**: [API Reference](https://docs.hylo.app/api)
- **Support Email**: api-support@hylo.app
- **Status Page**: [status.hylo.app](https://status.hylo.app)
- **Community**: [Discord](https://discord.gg/hylo)

---

*Last Updated: September 20, 2025 | API Version: 2.0.0*
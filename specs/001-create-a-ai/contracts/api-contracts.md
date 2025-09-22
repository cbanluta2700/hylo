# API Contracts: AI-Powered Itinerary Generation

**Feature**: AI workflow that generates and displays itineraries based on user form data  
**Date**: 2025-09-23  
**Branch**: 001-create-a-ai

## API Endpoints

### 1. POST /api/itinerary/generate

**Purpose**: Initiate AI workflow to generate travel itinerary  
**Edge Function**: Yes (`export const config = { runtime: 'edge' }`)

**Request**:

```typescript
interface GenerateItineraryRequest {
  sessionId: string;
  formData: TravelFormData;
}
```

**Response**:

```typescript
interface GenerateItineraryResponse {
  success: true;
  data: {
    workflowId: string;
    sessionId: string;
    estimatedCompletionTime: number; // seconds
    progressUrl: string; // SSE endpoint for progress
  };
} | {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

**Status Codes**:

- `200`: Workflow initiated successfully
- `400`: Invalid form data or missing required fields
- `429`: Rate limit exceeded
- `500`: Internal server error

### 2. GET /api/itinerary/progress/:workflowId

**Purpose**: Server-Sent Events stream for real-time workflow progress  
**Edge Function**: Yes (streaming compatible)

**Request**: No body, workflowId in URL parameter

**Response Stream**:

```typescript
interface ProgressEvent {
  event: 'progress' | 'complete' | 'error';
  data: {
    workflowId: string;
    progress: number; // 0-100
    currentStage: 'architect' | 'gatherer' | 'specialist' | 'formatter' | 'complete';
    completedSteps: string[];
    message?: string;
    error?: string;
  };
}
```

**Headers**:

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### 3. GET /api/itinerary/:itineraryId

**Purpose**: Retrieve generated itinerary by ID  
**Edge Function**: Yes

**Request**: No body, itineraryId in URL parameter

**Response**:

```typescript
interface GetItineraryResponse {
  success: true;
  data: GeneratedItinerary;
} | {
  success: false;
  error: {
    code: 'NOT_FOUND' | 'EXPIRED' | 'SERVER_ERROR';
    message: string;
  };
}
```

**Status Codes**:

- `200`: Itinerary found and returned
- `404`: Itinerary not found or expired
- `500`: Internal server error

### 4. POST /api/itinerary/regenerate

**Purpose**: Regenerate itinerary with modifications  
**Edge Function**: Yes

**Request**:

```typescript
interface RegenerateItineraryRequest {
  sessionId: string;
  originalWorkflowId: string;
  formData: TravelFormData; // Modified form data
  preferences?: {
    keepAccommodation?: boolean;
    keepTransportation?: boolean;
    modifyDays?: number[];
  };
}
```

**Response**: Same as `/generate` endpoint

### 5. GET /api/itinerary/status/:workflowId

**Purpose**: Get current workflow status (non-streaming)  
**Edge Function**: Yes

**Request**: No body, workflowId in URL parameter

**Response**:

```typescript
interface WorkflowStatusResponse {
  success: true;
  data: {
    workflowId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    currentStage: string;
    completedSteps: string[];
    errorMessage?: string;
    itineraryId?: string; // Available when completed
  };
} | {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
```

### 6. POST /api/inngest/webhook

**Purpose**: Inngest webhook endpoint for AI workflow execution  
**Edge Function**: Yes  
**Internal**: True (not exposed to frontend)

**Request**: Inngest standard webhook format

**Response**: Standard webhook acknowledgment

## Error Handling

### Standard Error Response

```typescript
interface APIErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}
```

### Error Codes

| Code                  | Description                    | HTTP Status |
| --------------------- | ------------------------------ | ----------- |
| `INVALID_REQUEST`     | Malformed request data         | 400         |
| `VALIDATION_ERROR`    | Form data validation failed    | 400         |
| `RATE_LIMITED`        | Too many requests              | 429         |
| `WORKFLOW_NOT_FOUND`  | Workflow ID not found          | 404         |
| `ITINERARY_NOT_FOUND` | Itinerary not found or expired | 404         |
| `AI_SERVICE_ERROR`    | AI provider service error      | 503         |
| `WORKFLOW_TIMEOUT`    | Workflow exceeded time limit   | 504         |
| `INTERNAL_ERROR`      | Unexpected server error        | 500         |

## Authentication & Security

**Session Management**: Cookie-based sessions for workflow tracking  
**Rate Limiting**: 5 generations per hour per IP  
**Input Validation**: Zod schema validation on all endpoints  
**CORS**: Configured for frontend domain only  
**API Keys**: Server-side only, never exposed to client

## Performance Specifications

| Endpoint        | Target Response Time      | Rate Limit         |
| --------------- | ------------------------- | ------------------ |
| `/generate`     | <500ms                    | 5/hour per IP      |
| `/progress`     | <100ms initial, streaming | N/A                |
| `/status`       | <200ms                    | 30/minute          |
| `/:itineraryId` | <300ms                    | 100/hour           |
| `/regenerate`   | <500ms                    | 2/hour per session |

## Monitoring & Observability

**Metrics Tracked**:

- Request latency per endpoint
- Error rates by error code
- Workflow completion rates
- AI agent execution times
- Token usage per request

**Logging**:

- Request/response logging with sanitized PII
- Workflow state transitions
- AI agent performance metrics
- Error stack traces (server-side only)

# Data Model: AI-Powered Personalized Itinerary Generation

**Date**: September 20, 2025  
**Feature**: 001-ai-powered-personalized  
**Status**: Complete

## Entity Overview

This document defines the data structures and relationships for the AI-powered itinerary generation system, extending existing form data with AI-specific entities and workflow management.

## Core Entities

### 1. Enhanced Form Data

```typescript
interface EnhancedFormData extends FormData {
  // AI-specific preferences
  aiPreferences?: {
    creativityLevel: 'conservative' | 'balanced' | 'adventurous';
    localInsights: boolean;
    realTimeUpdates: boolean;
    contentDepth: 'basic' | 'detailed' | 'comprehensive';
  };

  // Generation context
  generationId?: string;
  previousItineraries?: string[]; // References to past generations
  sessionId: string;
}
```

**Validation Rules**:

- All existing FormData validation rules apply
- creativityLevel defaults to 'balanced'
- sessionId must be UUID v4 format
- previousItineraries max 5 references

**State Transitions**:

- draft → validating → generating → complete → archived

### 2. Itinerary Request & Response

```typescript
interface ItineraryRequest {
  id: string; // UUID v4
  userId?: string; // Optional user identification
  formData: EnhancedFormData;
  requestType: 'initial' | 'update' | 'refresh';
  priority: 'low' | 'normal' | 'high';
  metadata: {
    timestamp: string; // ISO 8601
    userAgent?: string;
    source: 'web' | 'api';
  };
}

interface ItineraryResponse {
  id: string;
  requestId: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  itinerary?: GeneratedItinerary;
  error?: ErrorDetails;
  metadata: {
    processingTime: number; // milliseconds
    agentsUsed: AgentType[];
    confidence: number; // 0-1 scale
    sources: SourceAttribution[];
  };
}
```

**Validation Rules**:

- requestId must reference valid ItineraryRequest
- processingTime must be positive integer
- confidence must be between 0 and 1
- sources required for transparency

### 3. Generated Itinerary

```typescript
interface GeneratedItinerary {
  id: string;
  title: string;
  summary: string;
  totalDuration: number; // days
  estimatedCost: {
    min: number;
    max: number;
    currency: string;
  };
  days: DayPlan[];
  recommendations: {
    accommodation: AccommodationRecommendation[];
    dining: DiningRecommendation[];
    activities: ActivityRecommendation[];
    transportation: TransportationRecommendation[];
  };
  metadata: {
    generatedAt: string;
    lastUpdated: string;
    version: string;
    agentContributions: AgentContribution[];
  };
}

interface DayPlan {
  day: number;
  date: string; // YYYY-MM-DD
  theme?: string;
  timeline: TimelineItem[];
  notes?: string;
}

interface TimelineItem {
  time: string; // HH:MM format
  duration: number; // minutes
  activity: ActivityDetails;
  location: LocationDetails;
  cost?: CostEstimate;
}
```

**Validation Rules**:

- days array length must match totalDuration
- timeline items must not overlap within day
- estimatedCost.min <= estimatedCost.max
- date format validation (YYYY-MM-DD)

### 4. Agent Task Management

```typescript
interface AgentTask {
  id: string;
  type: AgentType;
  workflowId: string;
  request: ItineraryRequest;
  status: TaskStatus;
  input: AgentInput;
  output?: AgentOutput;
  metadata: {
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    retryCount: number;
    maxRetries: number;
  };
}

type AgentType = 'itinerary-architect' | 'web-gatherer' | 'information-specialist' | 'form-putter';

type TaskStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

interface AgentInput {
  formData: EnhancedFormData;
  context?: AgentContext;
  dependencies?: string[]; // Task IDs this depends on
}

interface AgentOutput {
  data: any; // Agent-specific output format
  confidence: number;
  sources: SourceAttribution[];
  processingTime: number;
  recommendations?: string[];
}
```

**Validation Rules**:

- workflowId must reference valid workflow
- retryCount <= maxRetries (default 3)
- dependencies must reference existing tasks
- confidence between 0 and 1

### 5. Search & Research Data

```typescript
interface SearchResult {
  id: string;
  query: string;
  provider: 'tavily' | 'exa';
  results: SearchItem[];
  metadata: {
    searchedAt: string;
    processingTime: number;
    totalResults: number;
  };
}

interface SearchItem {
  url: string;
  title: string;
  snippet: string;
  relevanceScore: number;
  source: string;
  publishedDate?: string;
}

interface ContentExtract {
  id: string;
  sourceUrl: string;
  extractedAt: string;
  content: {
    text: string;
    images?: ImageReference[];
    structured?: StructuredData;
  };
  metadata: {
    wordCount: number;
    language: string;
    reliability: number; // 0-1 scale
  };
}
```

**Validation Rules**:

- relevanceScore between 0 and 1
- URL format validation for sourceUrl
- wordCount must be positive integer
- reliability between 0 and 1

### 6. Session & State Management

```typescript
interface UserSession {
  id: string; // Session UUID
  userId?: string; // Optional authenticated user
  formData: Partial<EnhancedFormData>;
  generationHistory: ItineraryReference[];
  preferences: SessionPreferences;
  metadata: {
    createdAt: string;
    lastActiveAt: string;
    expiresAt: string;
    ipAddress?: string;
  };
}

interface GenerationState {
  workflowId: string;
  sessionId: string;
  currentStep: WorkflowStep;
  progress: ProgressIndicator;
  agentStates: Map<AgentType, AgentState>;
  realTimeUpdates: boolean;
}

interface WorkflowStep {
  name: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  startTime?: string;
  endTime?: string;
  output?: any;
}
```

**Validation Rules**:

- expiresAt must be future timestamp
- progress.percentage between 0 and 100
- agentStates must include all required agents
- currentStep must be valid workflow step

## Data Relationships

```
EnhancedFormData 1:N ItineraryRequest
ItineraryRequest 1:1 ItineraryResponse
ItineraryResponse 1:1 GeneratedItinerary
ItineraryRequest 1:N AgentTask
AgentTask N:M SearchResult (via agent execution)
SearchResult 1:N ContentExtract
UserSession 1:N ItineraryRequest
GenerationState 1:1 ItineraryRequest
```

## Vector Embeddings Schema

```typescript
interface ItineraryEmbedding {
  id: string;
  itineraryId: string;
  vectorData: number[]; // 1536 dimensions (OpenAI compatible)
  metadata: {
    destination: string;
    duration: number;
    budget: string;
    travelStyle: string;
    interests: string[];
    createdAt: string;
  };
}

interface SimilarityQuery {
  vector: number[];
  filters?: EmbeddingFilters;
  topK: number; // Default 5
  threshold?: number; // Minimum similarity score
}
```

## State Transitions

### Itinerary Generation Workflow

```
draft → validating → researching → planning → enriching → formatting → complete
                   ↓
                error → retry (max 3) → failed
```

### Agent Task Lifecycle

```
queued → processing → completed
       ↓           ↘
     failed      cancelled
       ↓
    retry (if retryCount < maxRetries)
```

### Session Management

```
created → active → idle (30min) → expired (24h) → archived
```

## Performance Considerations

### Indexing Strategy

- Primary keys: All entity IDs
- Foreign keys: workflowId, sessionId, requestId
- Composite indexes: (userId, createdAt), (status, priority)
- Vector indexes: Embedding similarity search

### Caching Strategy

- Redis: Session state, generation progress
- Vector cache: Similar itinerary lookups
- CDN: Static recommendation content
- Memory: Frequent form validation schemas

### Data Retention

- Active sessions: 24 hours
- Completed itineraries: 30 days (anonymous), 1 year (authenticated)
- Agent logs: 7 days
- Vector embeddings: 90 days
- Error logs: 30 days

---

**Entity Count**: 10 core entities + 8 supporting interfaces  
**Relationships**: 7 primary relationships defined  
**Next Phase**: API contract generation based on these entities

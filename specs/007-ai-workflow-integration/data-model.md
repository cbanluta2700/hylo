# Data Model: AI Multi-Agent Workflow for Itinerary Generation

**Feature**: 007-ai-workflow-integration  
**Date**: September 19, 2025  
**Status**: Complete

## Core Entities

### 1. AgentWorkflowSession
**Purpose**: Represents a single multi-agent collaboration instance tracking state, progress, and results across all four agent roles.

**Attributes**:
- `sessionId`: Unique identifier for the workflow session
- `status`: Current workflow status (pending, processing, completed, failed, cancelled)
- `progress`: Percentage completion (0-100)
- `currentAgent`: Which agent is currently processing (content_planner, info_gatherer, strategist, compiler)
- `formData`: Original trip details from user form
- `startTime`: Workflow initiation timestamp
- `endTime`: Workflow completion timestamp
- `totalCost`: Accumulated AI operation costs
- `errorHistory`: Array of errors encountered during processing

**State Transitions**:
```
pending → processing → completed
pending → processing → failed
processing → cancelled
```

**Validation Rules**:
- sessionId must be unique UUID v4
- status must be valid enum value
- progress must be 0-100 integer
- formData must contain required trip fields

### 2. ContentPlanningContext
**Purpose**: Contains strategic decisions about itinerary structure, themes, and content organization made by the Content Planner agent.

**Attributes**:
- `sessionId`: Reference to parent workflow session
- `analysisResult`: Structured analysis of user preferences and requirements
- `informationNeeds`: Array of specific data points required from web search
- `themeSelection`: Primary travel themes identified (adventure, culture, relaxation, etc.)
- `contentStructure`: Planned organization of final itinerary
- `priorityList`: Ordered list of user priorities (budget, time, activities, etc.)
- `planningStrategy`: Strategic approach determined for this trip

**Relationships**:
- Belongs to one AgentWorkflowSession
- Referenced by GatheredInformationRepository for targeted search

**Validation Rules**:
- analysisResult must contain destination, dates, travelers, budget analysis
- informationNeeds array must have at least 1 item
- themeSelection must be from predefined travel theme enum

### 3. GatheredInformationRepository
**Purpose**: Stores real-time data collected by the Website Info Gatherer, including source attribution and freshness timestamps.

**Attributes**:
- `sessionId`: Reference to parent workflow session
- `searchQueries`: Array of queries executed for information gathering
- `webSources`: Array of source URLs and extraction timestamps
- `extractedData`: Structured data extracted from web sources
- `embeddingVectors`: Vector representations for semantic search
- `relevanceScores`: Relevance ratings for gathered information
- `dataFreshness`: Timestamps indicating how current the information is
- `gatheringCost`: Cost incurred for information gathering operations

**Relationships**:
- Belongs to one AgentWorkflowSession
- Uses ContentPlanningContext informationNeeds as search criteria
- Feeds into StrategicPlanningFramework for analysis

**Validation Rules**:
- webSources must include valid URLs and extraction timestamps
- extractedData must be structured JSON with required fields
- relevanceScores must be 0-1 float values

### 4. StrategicPlanningFramework
**Purpose**: Encompasses the logical travel flow, timing decisions, and optimization recommendations from the Planning Strategist.

**Attributes**:
- `sessionId`: Reference to parent workflow session
- `travelFlow`: Day-by-day logical sequence of activities
- `timingOptimizations`: Recommendations for optimal timing of activities
- `logisticalConsiderations`: Transportation, accommodation, and practical advice
- `budgetAllocation`: Strategic budget distribution across trip components
- `riskAssessments`: Identified potential issues and mitigation strategies
- `alternativeOptions`: Backup plans and alternative activity suggestions

**Relationships**:
- Belongs to one AgentWorkflowSession
- Processes GatheredInformationRepository data
- Provides input to CompiledItineraryOutput

**Validation Rules**:
- travelFlow must cover all planned trip days
- budgetAllocation must not exceed total available budget
- timingOptimizations must include specific time recommendations

### 5. CompiledItineraryOutput
**Purpose**: The final structured travel plan that integrates contributions from all agents into a user-ready format.

**Attributes**:
- `sessionId`: Reference to parent workflow session
- `tripSummary`: Formatted trip overview with nickname, dates, travelers, budget
- `preparedFor`: Contact name from original form
- `dailyItinerary`: Array of daily activity plans with specific structure
- `tipsSection`: Curated travel tips and recommendations
- `generationMetadata`: Information about the generation process
- `formattingVersion`: Version of output format used
- `compilationCost`: Cost for final compilation and formatting

**Structure Requirements**:
```typescript
interface CompiledItineraryOutput {
  tripSummary: {
    nickname: string;
    dates: {
      departure?: string;
      return?: string;
      plannedDays?: number;
    };
    travelers: {
      adults: number;
      children?: number;
    };
    budget: {
      amount: number;
      currency: string;
      mode: 'per-person' | 'total' | 'flexible';
    };
  };
  preparedFor: string;
  dailyItinerary: Array<{
    day: number;
    date: string;
    activities: Array<{
      time: string;
      activity: string;
      location: string;
      notes?: string;
    }>;
  }>;
  tipsSection: {
    title: "TIPS FOR YOUR TRIP";
    tips: Array<{
      category: string;
      tip: string;
    }>;
  };
}
```

**Validation Rules**:
- tripSummary must include all required fields
- dailyItinerary must have entries for each planned day
- tipsSection must contain at least 3 travel tips

### 6. AgentCommunicationProtocol
**Purpose**: Defines how agents share information, coordinate decisions, and handle inter-agent dependencies.

**Attributes**:
- `sessionId`: Reference to parent workflow session
- `messageHistory`: Chronological log of inter-agent communications
- `dataExchanges`: Structured data passed between agents
- `coordinationState`: Current coordination status between agents
- `dependencyMap`: Map of which agents depend on others' outputs
- `communicationCost`: Cost of coordination operations

**Message Structure**:
```typescript
interface AgentMessage {
  fromAgent: 'content_planner' | 'info_gatherer' | 'strategist' | 'compiler';
  toAgent: 'content_planner' | 'info_gatherer' | 'strategist' | 'compiler';
  messageType: 'data_request' | 'data_response' | 'status_update' | 'error_report';
  payload: Record<string, any>;
  timestamp: string;
  messageId: string;
}
```

**Validation Rules**:
- All agent names must be from predefined enum
- messageType must be valid communication type
- payload must be valid JSON structure

### 7. WorkflowExecutionTrace
**Purpose**: Detailed logging of agent activities, decisions, and performance metrics for monitoring and improvement.

**Attributes**:
- `sessionId`: Reference to parent workflow session
- `executionSteps`: Chronological log of all workflow steps
- `performanceMetrics`: Timing, cost, and efficiency measurements
- `errorLog`: Detailed error information and recovery actions
- `agentMetrics`: Individual agent performance data
- `resourceUsage`: Token consumption, API calls, and resource utilization
- `qualityMetrics`: Output quality indicators and user satisfaction

**Performance Tracking**:
```typescript
interface PerformanceMetrics {
  totalExecutionTime: number;    // milliseconds
  agentExecutionTimes: Record<string, number>;
  tokenUsage: {
    totalTokens: number;
    costPerAgent: Record<string, number>;
  };
  apiCalls: {
    totalCalls: number;
    callsPerService: Record<string, number>;
  };
  errorRate: number;             // percentage
  retryCount: number;
}
```

**Validation Rules**:
- performanceMetrics must include timing data for all agents
- resourceUsage must track token consumption per operation
- errorLog must include error type, message, and recovery action

## Relationships Diagram

```
AgentWorkflowSession (1) → (1) ContentPlanningContext
AgentWorkflowSession (1) → (1) GatheredInformationRepository  
AgentWorkflowSession (1) → (1) StrategicPlanningFramework
AgentWorkflowSession (1) → (1) CompiledItineraryOutput
AgentWorkflowSession (1) → (1) AgentCommunicationProtocol
AgentWorkflowSession (1) → (1) WorkflowExecutionTrace

ContentPlanningContext (1) → (1) GatheredInformationRepository
GatheredInformationRepository (1) → (1) StrategicPlanningFramework  
StrategicPlanningFramework (1) → (1) CompiledItineraryOutput
```

## Storage Strategy

**Session State**: Redis/Upstash for temporary workflow state  
**Vector Data**: Upstash Vector for embeddings and semantic search  
**Execution Traces**: LangSmith for monitoring and analytics  
**Final Results**: PostgreSQL for persistence and user history

## Data Lifecycle

1. **Session Creation**: AgentWorkflowSession initialized with form data
2. **Content Planning**: ContentPlanningContext created with analysis
3. **Information Gathering**: GatheredInformationRepository populated with web data
4. **Strategic Planning**: StrategicPlanningFramework created with recommendations
5. **Compilation**: CompiledItineraryOutput generated in required format
6. **Cleanup**: Temporary data removed after completion (24-hour retention)
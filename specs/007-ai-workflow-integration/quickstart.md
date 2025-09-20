# Quickstart: AI Multi-Agent Workflow Integration

**Feature**: 007-ai-workflow-integration  
**Date**: September 19, 2025  
**Prerequisites**: Completed research.md and data-model.md

## Development Setup

### 1. Environment Configuration

Add these environment variables to your `.env.local`:

```bash
# AI Providers
CEREBRAS_API_KEY=your_cerebras_key
GROQ_API_KEY=your_groq_key
GOOGLE_API_KEY=your_gemini_key
JINA_API_KEY=your_jina_key

# Vector Database
UPSTASH_VECTOR_REST_URL=your_upstash_vector_url
UPSTASH_VECTOR_REST_TOKEN=your_upstash_vector_token
QDRANT_URL=your_qdrant_url  # Alternative vector store
QDRANT_API_KEY=your_qdrant_key

# Workflow Orchestration
QSTASH_URL=your_qstash_url
QSTASH_TOKEN=your_qstash_token

# Observability
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
LANGCHAIN_API_KEY=your_langsmith_key
LANGCHAIN_PROJECT=hylo-ai-workflow

# Rate Limiting & Monitoring
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### 2. Install Dependencies

```bash
npm install @langchain/core @langchain/community @langchain/groq
npm install @upstash/vector @upstash/qstash @upstash/redis
npm install @cerebras/cerebras_cloud_sdk @google/generative-ai
npm install langsmith zod uuid
```

### 3. Project Structure Setup

Create the following directories:
```bash
mkdir -p api/agents/{content-planner,info-gatherer,strategist,compiler}
mkdir -p api/workflow/{orchestration,state}
mkdir -p src/components/AgentWorkflow
mkdir -p src/services/agents
mkdir -p src/types/agents
mkdir -p tests/agents/{unit,integration,contract}
```

## Quick Start Implementation

### 1. Basic Agent Interface

Create `src/types/agents.ts`:
```typescript
// Base agent interface
export interface Agent {
  id: string;
  name: string;
  process(input: any, context: WorkflowContext): Promise<AgentResult>;
}

// Workflow context shared between agents
export interface WorkflowContext {
  sessionId: string;
  formData: TripFormData;
  state: WorkflowState;
  config: AgentConfig;
}

// Agent result with standardized output
export interface AgentResult {
  success: boolean;
  data: any;
  metadata: {
    cost: number;
    processingTime: number;
    tokensUsed: number;
  };
  nextAgent?: string;
}

// Workflow state management
export interface WorkflowState {
  currentAgent: string;
  progress: number;
  agentResults: Record<string, AgentResult>;
  errors: Array<WorkflowError>;
}
```

### 2. Content Planner Agent

Create `api/agents/content-planner/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ContentPlannerAgent } from './content-planner';
import { validateWorkflowInput } from '../../../utils/validation';

export async function POST(request: NextRequest) {
  try {
    const input = await request.json();
    const validation = validateWorkflowInput(input);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error },
        { status: 400 }
      );
    }

    const agent = new ContentPlannerAgent();
    const result = await agent.process(input.formData, input.context);

    return NextResponse.json({
      success: true,
      data: result,
      agent: 'content_planner',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Content Planner error:', error);
    return NextResponse.json(
      { error: 'Content planning failed', message: error.message },
      { status: 500 }
    );
  }
}
```

### 3. Workflow Orchestration

Create `api/workflow/orchestration/langgraph.ts`:
```typescript
import { StateGraph } from '@langchain/langgraph';
import { ContentPlannerAgent } from '../../agents/content-planner';
import { InfoGathererAgent } from '../../agents/info-gatherer';
import { StrategistAgent } from '../../agents/strategist';
import { CompilerAgent } from '../../agents/compiler';

export class MultiAgentWorkflow {
  private graph: StateGraph;

  constructor() {
    this.graph = new StateGraph({
      channels: {
        formData: 'object',
        planningContext: 'object',
        gatheredInfo: 'object',
        strategy: 'object',
        finalItinerary: 'object',
        errors: 'array'
      }
    });

    this.setupAgents();
    this.setupRouting();
  }

  private setupAgents() {
    // Add agent nodes
    this.graph.addNode('content_planner', new ContentPlannerAgent());
    this.graph.addNode('info_gatherer', new InfoGathererAgent());
    this.graph.addNode('strategist', new StrategistAgent());
    this.graph.addNode('compiler', new CompilerAgent());
  }

  private setupRouting() {
    // Define agent execution flow
    this.graph.addEdge('START', 'content_planner');
    
    // Conditional routing based on content planner output
    this.graph.addConditionalEdges(
      'content_planner',
      this.shouldGatherInfo,
      {
        'gather_info': 'info_gatherer',
        'skip_gathering': 'strategist'
      }
    );

    this.graph.addEdge('info_gatherer', 'strategist');
    this.graph.addEdge('strategist', 'compiler');
    this.graph.addEdge('compiler', 'END');
  }

  private shouldGatherInfo(state: any): string {
    // Decide if web information gathering is needed
    const needsWebInfo = state.planningContext?.informationNeeds?.length > 0;
    return needsWebInfo ? 'gather_info' : 'skip_gathering';
  }

  async execute(formData: TripFormData): Promise<CompiledItineraryOutput> {
    const initialState = {
      formData,
      planningContext: null,
      gatheredInfo: null,
      strategy: null,
      finalItinerary: null,
      errors: []
    };

    const result = await this.graph.invoke(initialState);
    return result.finalItinerary;
  }
}
```

### 4. Main Workflow Endpoint

Create `api/agents/workflow/start/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { MultiAgentWorkflow } from '../orchestration/langgraph';
import { v4 as uuidv4 } from 'uuid';
import { QStashClient } from '@upstash/qstash';

const qstash = new QStashClient({
  token: process.env.QSTASH_TOKEN!
});

export async function POST(request: NextRequest) {
  try {
    const { formData, options = {} } = await request.json();
    const sessionId = uuidv4();

    // For quick start: Direct execution (production will use QStash)
    if (process.env.NODE_ENV === 'development') {
      const workflow = new MultiAgentWorkflow();
      const result = await workflow.execute(formData);

      return NextResponse.json({
        sessionId,
        status: 'completed',
        result,
        estimatedCompletionTime: 0
      });
    }

    // Production: Queue workflow execution
    await qstash.publishJSON({
      url: `${process.env.VERCEL_URL}/api/workflow/execute`,
      body: {
        sessionId,
        formData,
        options
      }
    });

    return NextResponse.json({
      sessionId,
      status: 'processing',
      estimatedCompletionTime: 30,
      streamUrl: `/api/agents/workflow/${sessionId}/stream`
    });

  } catch (error) {
    console.error('Workflow start error:', error);
    return NextResponse.json(
      { error: 'Failed to start workflow', message: error.message },
      { status: 500 }
    );
  }
}
```

### 5. Frontend Integration

Create `src/hooks/useAgentWorkflow.ts`:
```typescript
import { useState, useCallback } from 'react';
import { TripFormData } from '../types/forms';
import { WorkflowStatusResponse, ItineraryResult } from '../types/agents';

export function useAgentWorkflow() {
  const [status, setStatus] = useState<WorkflowStatusResponse | null>(null);
  const [result, setResult] = useState<ItineraryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startWorkflow = useCallback(async (formData: TripFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/agents/workflow/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData })
      });

      if (!response.ok) {
        throw new Error('Failed to start workflow');
      }

      const data = await response.json();
      
      if (data.status === 'completed') {
        // Development mode: immediate result
        setResult(data.result);
        setStatus({ ...data, progress: 100 });
      } else {
        // Production mode: poll for status
        setStatus(data);
        pollWorkflowStatus(data.sessionId);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Workflow failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const pollWorkflowStatus = useCallback(async (sessionId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/agents/workflow/${sessionId}/status`);
        const statusData = await response.json();
        
        setStatus(statusData);

        if (statusData.status === 'completed') {
          // Fetch final result
          const resultResponse = await fetch(`/api/agents/workflow/${sessionId}/result`);
          const resultData = await resultResponse.json();
          setResult(resultData);
        } else if (statusData.status === 'processing') {
          // Continue polling
          setTimeout(poll, 2000);
        }
      } catch (err) {
        setError('Failed to get workflow status');
      }
    };

    poll();
  }, []);

  return {
    startWorkflow,
    status,
    result,
    loading,
    error
  };
}
```

## Testing Strategy

### 1. Contract Tests

Create `tests/agents/contract/workflow-api.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { testApiContract } from '../../utils/contract-testing';

describe('Workflow API Contract', () => {
  it('should start workflow with valid form data', async () => {
    const validFormData = {
      destination: 'Paris',
      departureDate: '2025-10-01',
      adults: 2,
      contactName: 'John Doe',
      budget: {
        amount: 5000,
        currency: 'USD',
        mode: 'total'
      }
    };

    const response = await testApiContract('/api/agents/workflow/start', {
      method: 'POST',
      body: { formData: validFormData }
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('sessionId');
    expect(response.data).toHaveProperty('status');
  });

  it('should reject invalid form data', async () => {
    const invalidFormData = {
      destination: '',  // Required field empty
      adults: 0         // Invalid value
    };

    const response = await testApiContract('/api/agents/workflow/start', {
      method: 'POST',
      body: { formData: invalidFormData }
    });

    expect(response.status).toBe(400);
    expect(response.data).toHaveProperty('error');
  });
});
```

### 2. Integration Tests

Create `tests/agents/integration/multi-agent-workflow.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { MultiAgentWorkflow } from '../../../api/workflow/orchestration/langgraph';

describe('Multi-Agent Workflow Integration', () => {
  it('should complete full workflow with all agents', async () => {
    const formData = {
      destination: 'Tokyo',
      departureDate: '2025-11-01',
      returnDate: '2025-11-07',
      adults: 2,
      contactName: 'Test User',
      budget: {
        amount: 3000,
        currency: 'USD',
        mode: 'total'
      }
    };

    const workflow = new MultiAgentWorkflow();
    const result = await workflow.execute(formData);

    // Verify required output structure
    expect(result).toHaveProperty('tripSummary');
    expect(result).toHaveProperty('preparedFor', 'Test User');
    expect(result).toHaveProperty('dailyItinerary');
    expect(result).toHaveProperty('tipsSection');

    // Verify daily itinerary covers all days
    expect(result.dailyItinerary).toHaveLength(7);
    
    // Verify tips section format
    expect(result.tipsSection.title).toBe('TIPS FOR YOUR TRIP');
    expect(result.tipsSection.tips.length).toBeGreaterThan(0);
  });
});
```

## Next Steps

1. **Run Contract Tests**: `npm test tests/agents/contract`
2. **Implement Base Agents**: Start with ContentPlannerAgent stub
3. **Set up LangGraph**: Configure StateGraph with basic routing
4. **Add Vector Integration**: Connect Upstash Vector for embeddings
5. **Implement Streaming**: Add Server-Sent Events for real-time updates

## Common Issues & Solutions

**Issue**: Edge Function timeout (30s limit)  
**Solution**: Use QStash for long-running workflows, implement streaming responses

**Issue**: Vector database connection in Edge Runtime  
**Solution**: Use Upstash Vector with HTTP API instead of persistent connections

**Issue**: LangChain memory usage  
**Solution**: Implement streaming and chunk processing, clear unused objects

**Issue**: High AI costs during development  
**Solution**: Use mock agents for testing, implement cost tracking with alerts

## Performance Targets

- **Initial Response**: <2s for workflow start
- **Agent Processing**: <10s per agent
- **Total Workflow**: <30s end-to-end
- **Streaming Latency**: <500ms for status updates
- **Memory Usage**: <100MB per workflow session
- **Cost**: <$0.50 per itinerary generation
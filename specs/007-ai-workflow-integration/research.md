# Research: AI Multi-Agent Workflow for Itinerary Generation

**Feature**: 007-ai-workflow-integration  
**Date**: September 19, 2025  
**Status**: Complete

## Research Findings

### 1. LangGraph StateGraph for Multi-Agent Coordination

**Decision**: Use LangGraph StateGraph with conditional routing and parallel execution  
**Rationale**: 
- Native support for complex agent workflows with state management
- Built-in error handling and retry mechanisms
- Conditional routing between agents based on intermediate results
- Seamless integration with LangChain ecosystem

**Implementation Pattern**:
```python
# StateGraph with 4 agent nodes
workflow = StateGraph({
    "content_planner": ContentPlannerAgent,
    "info_gatherer": InfoGathererAgent, 
    "strategist": StrategyPlannerAgent,
    "compiler": ContentCompilerAgent
})

# Conditional routing based on agent outputs
workflow.add_conditional_edges(
    "content_planner",
    decide_info_needs,
    ["info_gatherer", "strategist"]  # Skip info gathering if not needed
)
```

**Alternatives Considered**:
- Custom orchestration with direct API calls (rejected: more complex error handling)
- LangChain LCEL chains (rejected: limited state management for multi-agent)

### 2. Jina Embeddings with Upstash Vector Integration

**Decision**: Use Jina AI `jina-embeddings-v2-base-en` model with Upstash Vector  
**Rationale**:
- Optimized for English text with good travel domain performance
- 768-dimensional embeddings suitable for travel content
- Upstash Vector provides Redis-compatible vector operations
- Native Edge Runtime support with low latency

**Configuration**:
```typescript
// Jina embeddings configuration
const jinaEmbeddings = new JinaEmbeddings({
  apiKey: process.env.JINA_API_KEY,
  model: "jina-embeddings-v2-base-en",
  dimensions: 768
});

// Upstash Vector integration
const vectorStore = new UpstashVectorStore({
  index: upstashIndex,
  embeddings: jinaEmbeddings
});
```

**Alternatives Considered**:
- OpenAI embeddings (rejected: higher cost, external dependency)
- Qdrant cloud (rejected: additional service complexity)

### 3. Groq Compound Models for Web Information Gathering

**Decision**: Use Groq's `mixtral-8x7b-32768` for web information extraction  
**Rationale**:
- High context window (32k tokens) for processing web content
- Fast inference speed suitable for real-time information gathering
- Good performance on information extraction tasks
- Cost-effective for high-volume operations

**Usage Pattern**:
```typescript
const groqClient = new GroqClient({
  apiKey: process.env.GROQ_API_KEY
});

// Compound model for information extraction
const infoGatherer = groqClient.chat.completions.create({
  model: "mixtral-8x7b-32768",
  messages: [
    {
      role: "system", 
      content: "Extract travel information from web content..."
    }
  ],
  temperature: 0.1  // Low temperature for factual extraction
});
```

**Alternatives Considered**:
- GPT-4 for web analysis (rejected: cost prohibitive for real-time gathering)
- Claude for information extraction (rejected: rate limits)

### 4. LangChain Text Splitter for Travel Content

**Decision**: Use `RecursiveCharacterTextSplitter` with travel-optimized parameters  
**Rationale**:
- Preserves semantic boundaries in travel content
- Configurable chunk size and overlap for optimal retrieval
- Handles various content types (articles, reviews, guides)

**Configuration**:
```typescript
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,        // Optimal for travel content
  chunkOverlap: 200,      // Preserve context between chunks
  separators: ["\n\n", "\n", ". ", " "],  // Travel content separators
});
```

**Alternatives Considered**:
- TokenTextSplitter (rejected: doesn't preserve semantic boundaries)
- Custom travel content splitter (rejected: unnecessary complexity)

### 5. Upstash QStash for Workflow Orchestration

**Decision**: Use Upstash QStash for long-running workflow management  
**Rationale**:
- Handles Edge Function 30-second timeout limitations
- Built-in retry mechanisms for failed agent calls
- Message queuing for asynchronous agent communication
- Native Vercel integration

**Implementation**:
```typescript
import { Client } from "@upstash/qstash";

const qstash = new Client({
  token: process.env.QSTASH_TOKEN,
});

// Queue agent workflow steps
await qstash.publishJSON({
  url: `${process.env.VERCEL_URL}/api/agents/workflow/step`,
  body: {
    sessionId,
    agentType: "content_planner",
    input: formData
  },
  delay: 0  // Immediate execution
});
```

**Alternatives Considered**:
- Vercel Cron Jobs (rejected: not suitable for dynamic workflows)
- Redis Pub/Sub (rejected: requires additional infrastructure)

### 6. Agent Error Handling and Fallback Strategies

**Decision**: Implement graceful degradation with multiple fallback levels  
**Rationale**:
- Ensures itinerary generation even with partial agent failures
- Maintains user experience during service outages
- Cost optimization by falling back to simpler models

**Fallback Chain**:
1. **Primary**: Full multi-agent workflow (Cerebras → Groq → Gemini)
2. **Fallback 1**: Skip web info gathering, use cached/static data
3. **Fallback 2**: Single-agent generation with best available model
4. **Fallback 3**: Basic template-based itinerary

**Implementation**:
```typescript
try {
  return await fullMultiAgentWorkflow(formData);
} catch (error) {
  logger.warn("Multi-agent workflow failed", { error });
  try {
    return await fallbackStaticGeneration(formData);
  } catch (fallbackError) {
    logger.error("All workflows failed", { fallbackError });
    return generateBasicItinerary(formData);
  }
}
```

### 7. Performance Optimization for Edge Runtime

**Decision**: Implement streaming responses with progressive enhancement  
**Rationale**:
- Provides immediate user feedback during long workflows
- Optimizes for Edge Function timeout constraints
- Allows partial results if workflow is interrupted

**Streaming Pattern**:
```typescript
// Server-Sent Events for real-time updates
const stream = new ReadableStream({
  start(controller) {
    // Send progress updates as agents complete
    controller.enqueue(`data: ${JSON.stringify({
      status: 'content_planning_complete',
      progress: 25
    })}\n\n`);
  }
});

return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  }
});
```

## Implementation Decisions Summary

| Component | Technology | Reasoning |
|-----------|------------|-----------|
| Agent Coordination | LangGraph StateGraph | Native multi-agent support, error handling |
| Embeddings | Jina AI v2-base-en | Travel domain optimization, cost-effective |
| Vector Storage | Upstash Vector | Edge Runtime compatibility, Redis API |
| Web Info Gathering | Groq Mixtral-8x7b | High context window, fast inference |
| Text Processing | LangChain RecursiveCharacterTextSplitter | Semantic boundary preservation |
| Workflow Orchestration | Upstash QStash | Timeout handling, async coordination |
| Error Handling | Multi-level fallback chain | Graceful degradation, reliability |
| Performance | Streaming responses | Real-time feedback, timeout resilience |

## Next Phase Dependencies

All research questions resolved. Ready for Phase 1 design with:
- Agent interface definitions
- Workflow state management
- API contract specifications
- Integration patterns documented
# Research: AI-Powered Itinerary Generation Workflow

**Feature**: AI workflow that generates and displays itineraries based on user form data  
**Research Date**: 2025-09-23  
**Branch**: 001-create-a-ai

## Research Findings

### 1. AI Service Integration Choice

**Decision**: Multi-LLM provider approach with 4 specialized agents  
**Rationale**:

- Different LLMs excel at different tasks (reasoning vs information gathering vs formatting)
- Redundancy prevents single-point-of-failure for AI services
- Cost optimization through task-specific model selection
- Performance optimization through parallel processing capabilities

**Alternatives Considered**:

- Single OpenAI GPT-4 provider: Rejected due to cost and single-point-of-failure
- Single Groq provider: Rejected due to limited reasoning capabilities for complex planning
- Anthropic Claude only: Rejected due to rate limiting and cost concerns

**Selected Providers**:

- **XAI Grok (@ai-sdk/xai 2.0.20)**: Fast reasoning for architecture and specialization tasks
- **Groq (@ai-sdk/groq 2.0.20)**: High-speed compound processing for information gathering
- **GPT-OSS-20B**: Open-source option for form processing and formatting

### 2. Workflow Orchestration Platform

**Decision**: Inngest 3.41.0 for AI workflow orchestration  
**Rationale**:

- Native Edge Runtime compatibility with Vercel
- Built-in retry logic and error handling for AI service failures
- Step-based workflow tracking for progress updates
- Automatic scaling and queue management
- Type-safe function definitions with TypeScript

**Alternatives Considered**:

- AWS Step Functions: Rejected due to vendor lock-in and Edge Runtime incompatibility
- Custom queue system: Rejected due to complexity and maintenance overhead
- Vercel Functions + Redis: Rejected due to lack of built-in retry/error handling

### 3. State Management & Real-time Updates

**Decision**: Upstash Redis + Server-Sent Events (SSE) pattern  
**Rationale**:

- Upstash Redis provides Edge Runtime compatible state storage
- SSE works better than WebSocket for one-way progress updates
- Redis key expiration handles cleanup automatically
- Cost-effective scaling with serverless Redis

**Alternatives Considered**:

- Traditional WebSockets: Rejected due to Edge Runtime connection limitations
- Local state only: Rejected due to loss of progress on page refresh
- Database storage: Rejected due to overkill for temporary workflow state

### 4. Search Integration for Travel Data

**Decision**: Multi-provider search approach (Tavily + Exa + SERP)  
**Rationale**:

- Tavily excels at travel-specific information
- Exa provides high-quality semantic search
- SERP as fallback for general queries
- Multiple sources ensure comprehensive data coverage

**Alternatives Considered**:

- Google Search API only: Rejected due to rate limits and cost
- Web scraping: Rejected due to legal concerns and reliability
- Static travel database: Rejected due to outdated information

### 5. Vector Storage for Embeddings

**Decision**: Upstash Vector for embeddings storage  
**Rationale**:

- Edge Runtime compatibility
- Serverless scaling model
- Built-in similarity search capabilities
- Cost-effective for travel recommendation use case

**Alternatives Considered**:

- Pinecone: Rejected due to higher cost for small scale
- Weaviate: Rejected due to self-hosting complexity
- Local embeddings: Rejected due to Edge Runtime memory constraints

### 6. Deployment & Environment Configuration

**Decision**: Vercel deployment with environment-specific API key management  
**Rationale**:

- Native Edge Runtime support
- Automatic HTTPS and CDN
- Environment variable management
- Maximum 10 serverless functions constraint requires careful API design

**Environment Variables Required**:

```
XAI_API_KEY=<xai-grok-api-key>
GROQ_API_KEY=<groq-api-key>
INNGEST_EVENT_KEY=<inngest-signing-key>
UPSTASH_REDIS_REST_URL=<redis-rest-endpoint>
UPSTASH_REDIS_REST_TOKEN=<redis-auth-token>
UPSTASH_VECTOR_REST_URL=<vector-db-endpoint>
UPSTASH_VECTOR_REST_TOKEN=<vector-auth-token>
TAVILY_API_KEY=<travel-search-key>
EXA_API_KEY=<semantic-search-key>
SERP_API_KEY=<general-search-key>
NEXT_PUBLIC_WS_URL=<websocket-endpoint>
```

## Implementation Strategy

### Phase Breakdown Validation

**Phase 1**: Dependencies and Environment Setup ✅

- Install AI SDK packages, Inngest, Upstash clients
- Configure environment variables in Vercel
- Verify Edge Runtime compatibility

**Phase 2**: Vite Configuration and Deployment Test ✅

- Update Vite config for Edge Runtime compatibility
- Deploy to Vercel staging
- Verify environment variables accessibility

**Phase 3**: Form Data Integration ✅

- Create unified form data aggregation
- Implement form validation with existing schemas
- Test data flow from forms to AI workflow trigger

**Phase 4**: Inngest Workflow Implementation ✅

- Design 4-agent workflow orchestration
- Implement Redis state management
- Add real-time progress tracking via SSE

**Phase 5**: Itinerary Display ✅

- Create itinerary presentation components
- Implement loading states and error handling
- Add regeneration capabilities

## Risk Mitigation

**API Rate Limiting**: Multiple provider fallbacks, rate limiting in Redis  
**Cost Management**: Usage monitoring, request capping, efficient prompt design  
**Error Handling**: Comprehensive error boundaries, graceful degradation  
**Performance**: Streaming responses, progress indicators, caching strategies  
**Security**: API key management, request validation, sanitization

## Success Criteria

- [ ] All 4 AI agents successfully process form data
- [ ] Real-time progress updates display to users
- [ ] Generated itineraries match user preferences and constraints
- [ ] System handles failures gracefully with retry mechanisms
- [ ] Deployment stays within Vercel's 10 serverless function limit
- [ ] Response times under 30 seconds for complete itinerary generation
- [ ] Cost per itinerary generation under $0.50

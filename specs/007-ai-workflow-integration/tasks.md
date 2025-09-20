# Tasks: AI Multi-Agent Workflow for Itinerary Generation

**Input**: Design documents from `/specs/007-ai-workflow-integration/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/workflow-api.json, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   ✅ Extracted: TypeScript/React, LangChain/LangGraph, Vercel Edge Functions, multi-agent architecture
2. Load optional design documents:
   ✅ data-model.md: 7 entities → model and service tasks
   ✅ contracts/: workflow-api.json → 5 API endpoints → contract test tasks
   ✅ research.md: LangGraph StateGraph, Upstash Vector, Jina embeddings decisions → setup tasks
3. Generate tasks by category:
   ✅ Setup: project init, dependencies, agent structure
   ✅ Tests: contract tests, integration tests for multi-agent workflow
   ✅ Core: TypeScript types, agent implementations, workflow orchestration
   ✅ Integration: vector database, streaming, observability
   ✅ Polish: performance tests, documentation, deployment
4. Apply task rules:
   ✅ Different files = mark [P] for parallel (agent implementations, contract tests)
   ✅ Same file = sequential (shared types, orchestration)
   ✅ Tests before implementation (TDD compliance)
5. Number tasks sequentially (T001-T045)
6. Generate dependency graph with agent workflow priorities
7. Create parallel execution examples for agent development
8. Validate task completeness:
   ✅ All 5 API contracts have tests
   ✅ All 7 entities have model tasks
   ✅ All 4 agents have implementation tasks
9. Return: SUCCESS (45 tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- All file paths are absolute for the Hylo repository structure

## Path Conventions
**Web application structure** (React frontend + Vercel Edge Functions backend):
- Backend: `api/` at repository root
- Frontend: `src/` at repository root
- Tests: `tests/` at repository root

## Phase 3.1: Setup & Dependencies
- [ ] T001 Install multi-agent workflow dependencies: @langchain/core, @langchain/community, @langchain/groq, @upstash/vector, @upstash/qstash, @cerebras/cerebras_cloud_sdk, @google/generative-ai, langsmith, uuid
- [ ] T002 Create agent directory structure: api/agents/{content-planner,info-gatherer,strategist,compiler}/, api/workflow/{orchestration,state}/, src/components/AgentWorkflow/, src/services/agents/, tests/agents/{unit,integration,contract}/
- [ ] T003 [P] Configure environment variables for AI providers in .env.local (Cerebras, Groq, Gemini, Jina, Upstash Vector, QStash, LangSmith)
- [ ] T004 [P] Update TypeScript configuration for LangChain imports and Edge Runtime compatibility

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests [P] - API Endpoint Validation
- [ ] T005 [P] Contract test POST /api/agents/workflow/start in tests/agents/contract/workflow-start.test.ts
- [ ] T006 [P] Contract test GET /api/agents/workflow/{sessionId}/status in tests/agents/contract/workflow-status.test.ts  
- [ ] T007 [P] Contract test GET /api/agents/workflow/{sessionId}/stream in tests/agents/contract/workflow-stream.test.ts
- [ ] T008 [P] Contract test GET /api/agents/workflow/{sessionId}/result in tests/agents/contract/workflow-result.test.ts
- [ ] T009 [P] Contract test POST /api/agents/workflow/{sessionId}/cancel in tests/agents/contract/workflow-cancel.test.ts

### Integration Tests [P] - Multi-Agent Workflow Scenarios
- [ ] T010 [P] Integration test complete multi-agent workflow execution in tests/agents/integration/full-workflow.test.ts
- [ ] T011 [P] Integration test agent failure recovery and graceful degradation in tests/agents/integration/error-handling.test.ts
- [ ] T012 [P] Integration test real-time streaming and progress updates in tests/agents/integration/streaming.test.ts
- [ ] T013 [P] Integration test itinerary output format validation in tests/agents/integration/output-format.test.ts

### Unit Tests [P] - Agent Communication and State Management
- [ ] T014 [P] Unit test agent communication protocol in tests/agents/unit/agent-communication.test.ts
- [ ] T015 [P] Unit test workflow state transitions in tests/agents/unit/workflow-state.test.ts
- [ ] T016 [P] Unit test LangGraph StateGraph configuration in tests/agents/unit/langgraph-config.test.ts

## Phase 3.3: Core Types & Interfaces (ONLY after tests are failing)

### TypeScript Type Definitions [P]
- [ ] T017 [P] Create agent workflow types in src/types/agents.ts (Agent, WorkflowContext, AgentResult, WorkflowState interfaces)
- [ ] T018 [P] Create workflow session types in src/types/workflow.ts (AgentWorkflowSession, ContentPlanningContext, GatheredInformationRepository entities)
- [ ] T019 [P] Create itinerary output types in src/types/itinerary.ts (CompiledItineraryOutput, TripSummary, DailyItinerary structures)

### Agent Interface Implementations [P]
- [ ] T020 [P] Content Planner agent base class in api/agents/content-planner/content-planner.ts
- [ ] T021 [P] Website Info Gatherer agent base class in api/agents/info-gatherer/info-gatherer.ts  
- [ ] T022 [P] Planning Strategist agent base class in api/agents/strategist/strategist.ts
- [ ] T023 [P] Content Compiler agent base class in api/agents/compiler/compiler.ts

## Phase 3.4: Agent Implementations & API Endpoints

### Individual Agent Route Handlers
- [ ] T024 POST /api/agents/content-planner/route.ts endpoint with form data analysis and information needs identification
- [ ] T025 POST /api/agents/info-gatherer/route.ts endpoint with Groq-based web information gathering via LangChain + vector embeddings
- [ ] T026 POST /api/agents/strategist/route.ts endpoint with strategic planning and travel flow optimization
- [ ] T027 POST /api/agents/compiler/route.ts endpoint with structured itinerary compilation in required format

### Workflow Orchestration Core
- [ ] T028 LangGraph StateGraph configuration in api/workflow/orchestration/langgraph.ts with 4-agent coordination and conditional routing
- [ ] T029 Workflow state management in api/workflow/state/session-manager.ts with Redis/Upstash state persistence
- [ ] T030 POST /api/agents/workflow/start/route.ts main workflow endpoint with QStash integration for long-running processes

### Additional Workflow Endpoints  
- [ ] T031 GET /api/agents/workflow/[sessionId]/status/route.ts for progress tracking and agent status
- [ ] T032 GET /api/agents/workflow/[sessionId]/stream/route.ts for Server-Sent Events real-time updates
- [ ] T033 GET /api/agents/workflow/[sessionId]/result/route.ts for final itinerary retrieval
- [ ] T034 POST /api/agents/workflow/[sessionId]/cancel/route.ts for workflow cancellation and cleanup

## Phase 3.5: Vector Database & Embeddings Integration

### Vector Database Services [P]
- [ ] T035 [P] Upstash Vector integration service in api/rag/vectorstore/upstash-vector.ts with embeddings storage and retrieval
- [ ] T036 [P] Jina embeddings service in api/rag/embeddings/jina-embeddings.ts with travel content optimization
- [ ] T037 [P] LangChain text splitter configuration in api/rag/embeddings/text-splitter.ts for web content processing

### Web Search Integration
- [ ] T038 Real-time web search service in api/search/web-search.ts compatible with Edge Runtime constraints
- [ ] T039 Content extraction and validation service in api/search/content-extractor.ts with sanitization and source attribution

## Phase 3.6: Frontend Integration

### React Components [P]
- [ ] T040 [P] Agent workflow progress component in src/components/AgentWorkflow/WorkflowProgress.tsx with real-time status updates
- [ ] T041 [P] Enhanced itinerary display component in src/components/AgentWorkflow/EnhancedItinerary.tsx with structured output formatting

### Frontend Services [P]  
- [ ] T042 [P] Workflow client service in src/services/agents/workflow-client.ts with API integration and error handling
- [ ] T043 [P] Real-time streaming hook in src/hooks/useAgentWorkflow.ts with Server-Sent Events and status polling

## Phase 3.7: Polish & Observability
- [ ] T044 [P] LangSmith tracing integration in api/workflow/observability/tracing.ts with cost tracking and performance metrics
- [ ] T045 [P] Performance optimization and bundle size validation with <200KB target and Edge Runtime memory constraints

## Dependencies

### Critical TDD Dependencies
- All Tests (T005-T016) MUST complete and FAIL before ANY implementation (T017-T045)
- Types (T017-T019) before Agent Implementations (T020-T023)
- Agent Base Classes (T020-T023) before Route Handlers (T024-T027)

### Agent Workflow Dependencies
- T028 LangGraph Config blocks T030 Main Workflow Endpoint
- T029 Session Manager blocks T031 Status Endpoint, T032 Stream Endpoint
- T035-T037 Vector Services block T025 Info Gatherer Implementation
- T038-T039 Web Search blocks T025 Info Gatherer Implementation

### Frontend Dependencies  
- T017-T019 Types block T042-T043 Frontend Services
- T030-T034 API Endpoints block T042 Workflow Client
- T042 Workflow Client blocks T040-T041 React Components

### Integration Dependencies
- T028-T029 Core Orchestration before T044 Observability
- All Core Implementation (T017-T039) before Polish (T044-T045)

## Parallel Execution Examples

### Phase 3.2: Contract Tests (All Independent)
```bash
# Launch T005-T009 together:
Task: "Contract test POST /api/agents/workflow/start in tests/agents/contract/workflow-start.test.ts"
Task: "Contract test GET /api/agents/workflow/{sessionId}/status in tests/agents/contract/workflow-status.test.ts"
Task: "Contract test GET /api/agents/workflow/{sessionId}/stream in tests/agents/contract/workflow-stream.test.ts"
Task: "Contract test GET /api/agents/workflow/{sessionId}/result in tests/agents/contract/workflow-result.test.ts"
Task: "Contract test POST /api/agents/workflow/{sessionId}/cancel in tests/agents/contract/workflow-cancel.test.ts"
```

### Phase 3.2: Integration Tests (All Independent)
```bash
# Launch T010-T013 together:
Task: "Integration test complete multi-agent workflow execution in tests/agents/integration/full-workflow.test.ts"
Task: "Integration test agent failure recovery and graceful degradation in tests/agents/integration/error-handling.test.ts"
Task: "Integration test real-time streaming and progress updates in tests/agents/integration/streaming.test.ts"
Task: "Integration test itinerary output format validation in tests/agents/integration/output-format.test.ts"
```

### Phase 3.3: TypeScript Types (All Independent)
```bash
# Launch T017-T019 together:
Task: "Create agent workflow types in src/types/agents.ts"
Task: "Create workflow session types in src/types/workflow.ts"
Task: "Create itinerary output types in src/types/itinerary.ts"
```

### Phase 3.3: Agent Base Classes (All Independent)
```bash
# Launch T020-T023 together:
Task: "Content Planner agent base class in api/agents/content-planner/content-planner.ts"
Task: "Website Info Gatherer agent base class in api/agents/info-gatherer/info-gatherer.ts"
Task: "Planning Strategist agent base class in api/agents/strategist/strategist.ts"
Task: "Content Compiler agent base class in api/agents/compiler/compiler.ts"
```

### Phase 3.5: Vector Database Services (All Independent)
```bash
# Launch T035-T037 together:
Task: "Upstash Vector integration service in api/rag/vectorstore/upstash-vector.ts"
Task: "Jina embeddings service in api/rag/embeddings/jina-embeddings.ts"
Task: "LangChain text splitter configuration in api/rag/embeddings/text-splitter.ts"
```

## Notes
- [P] tasks target different files with no shared dependencies
- All contract tests MUST fail before implementation begins (TDD compliance)
- Agent implementations follow the workflow: Content Planner → Info Gatherer → Strategist → Compiler
- Edge Runtime constraints require streaming responses and timeout handling
- Cost tracking enforced throughout with $10/day budget limit
- LangSmith tracing provides observability for all agent operations

## Task Generation Rules Applied

### From Contracts (workflow-api.json):
- 5 API endpoints → 5 contract test tasks (T005-T009) [P]
- 5 API endpoints → 5 implementation tasks (T030-T034)

### From Data Model:
- 7 entities → Type definition tasks (T017-T019) [P]
- 4 agents → Base class tasks (T020-T023) [P]
- 4 agents → Route handler tasks (T024-T027)

### From User Stories (quickstart.md):
- Complete workflow scenario → Integration test (T010)
- Error handling scenario → Integration test (T011)
- Streaming scenario → Integration test (T012)
- Output format scenario → Integration test (T013)

### Ordering Applied:
- Setup (T001-T004) → Tests (T005-T016) → Types (T017-T019) → Agents (T020-T027) → Orchestration (T028-T034) → Integration (T035-T039) → Frontend (T040-T043) → Polish (T044-T045)

## Validation Checklist ✅

- [x] All 5 contracts have corresponding test tasks (T005-T009)
- [x] All 7 entities have model/type tasks (T017-T019)
- [x] All tests come before implementation (T005-T016 before T017-T045)
- [x] Parallel tasks truly independent (different files, no shared dependencies)
- [x] Each task specifies exact file path with absolute repository paths
- [x] No [P] task modifies same file as another [P] task
- [x] Multi-agent workflow priorities maintained (Content Planner → Info Gatherer → Strategist → Compiler)
- [x] TDD compliance enforced with failing tests before implementation
- [x] Constitutional requirements satisfied (Edge-first, Type-safe, Observable, Cost-conscious)
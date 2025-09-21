# Tasks: AI-Powered Personalized Itinerary Generation

**Input**: Design documents from `/specs/001-ai-powered-personalized/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → Extract: TypeScript, React, Inngest, xAI/Groq, Upstash Vector/Redis, Vercel Edge
   → Structure: Web application (frontend + backend API)
2. Load design documents:
   → data-model.md: 12 entities → model creation tasks
   → contracts/: 2 files → contract test tasks
   → research.md: 8 serverless functions, multi-agent architecture
   → quickstart.md: 5 test scenarios
3. Generate tasks by category:
   → Setup: dependencies, environment, structure
   → Tests: contract tests, integration tests (TDD)
   → Core: agents, serverless functions, orchestration
   → Integration: workflows, caching, real-time
   → Polish: performance, monitoring, docs
4. Apply task rules:
   → Different files = [P] for parallel
   → Same file = sequential
   → Tests before implementation (TDD)
5. 8 serverless functions + 4 agents + WebSocket + 5 test scenarios
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup & Environment

- [x] T001 Create serverless API structure with 8 functions in `api/` directory
- [x] T002 Install AI/LLM dependencies: @ai-sdk/xai, groq-sdk, inngest, @tavily/core, exa-js
- [x] T003 [P] Configure environment variables for 11 services (XAI, Groq, Tavily, Exa, SERP, Upstash Vector/Redis, Inngest)
- [x] T004 [P] Setup TypeScript configuration for Vercel Edge Runtime compatibility
- [x] T005 [P] Configure linting rules for multi-agent architecture patterns

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests

- [x] T006 [P] Contract test POST /api/itinerary/generate in `tests/contracts/itinerary-generate.test.ts`
- [x] T007 [P] Contract test PUT /api/itinerary/update in `tests/contracts/itinerary-update.test.ts`
- [x] T008 [P] Contract test GET /api/itinerary/status in `tests/contracts/itinerary-status.test.ts`
- [x] T009 [P] Contract test WebSocket /api/itinerary/live in `tests/contracts/websocket-live.test.ts`
- [x] T010 [P] Contract test POST /api/agents/architect in `tests/contracts/agent-architect.test.ts`
- [x] T011 [P] Contract test POST /api/agents/gatherer in `tests/contracts/agent-gatherer.test.ts`
- [x] T012 [P] Contract test POST /api/agents/specialist in `tests/contracts/agent-specialist.test.ts`
- [x] T013 [P] Contract test POST /api/agents/putter in `tests/contracts/agent-putter.test.ts`

### Integration Tests

- [x] T014 [P] Integration test: Basic itinerary generation (Scenario 1) in `tests/integration/basic-generation.test.ts`
- [x] T015 [P] Integration test: Real-time form updates (Scenario 2) in `tests/integration/realtime-updates.test.ts`
- [x] T016 [P] Integration test: Multi-agent workflow orchestration in `tests/integration/workflow-orchestration.test.ts`
- [x] T017 [P] Integration test: Edge case handling (minimal form data) in `tests/integration/edge-cases.test.ts`
- [x] T018 [P] Integration test: Search provider failover in `tests/integration/provider-failover.test.ts`

## Phase 3.3: Data Models & Core Types (ONLY after tests are failing)

- [x] T019 [P] EnhancedFormData interface in `src/types/form-data.ts`
- [x] T020 [P] ItineraryRequest/Response interfaces in `src/types/itinerary.ts`
- [x] T021 [P] GeneratedItinerary entity in `src/types/generated-itinerary.ts`
- [x] T022 [P] SmartQuery interface in `src/types/smart-query.ts`
- [x] T023 [P] AgentResponse interfaces in `src/types/agent-responses.ts`
- [x] T024 [P] SearchProvider interfaces in `src/types/search-providers.ts`
- [x] T025 [P] WorkflowState entity in `src/types/workflow-state.ts`
- [x] T026 [P] WebSocket message types in `src/types/websocket.ts`

## Phase 3.4: Smart Query System

- [x] T027 generateSmartQueries function in `src/lib/smart-queries.ts`
- [x] T028 [P] Query template builders (flights, accommodations, activities, etc.) in `src/lib/query-templates.ts`
- [x] T029 [P] Edge case handling for incomplete form data in `src/lib/fallback-handlers.ts`
- [x] T030 distributeQueries function for agent assignment in `src/lib/query-distribution.ts`

## Phase 3.5: Search Provider Integration

- [x] T031 [P] SERP API integration in `src/lib/providers/serp.ts`
- [x] T032 [P] Tavily search integration in `src/lib/providers/tavily.ts`
- [x] T033 [P] Exa neural search integration in `src/lib/providers/exa.ts`
- [x] T034 [P] CruiseCritic scraping implementation in `src/lib/providers/cruise-critic.ts`
- [x] T035 Multi-provider search orchestration in `src/lib/search-orchestrator.ts`

## Phase 3.6: AI Agents Implementation

- [x] T036 [P] Itinerary Architect agent with Grok-4-Fast-Reasoning in `src/lib/agents/architect.ts`
- [x] T037 [P] Web Information Gatherer agent with Groq Compound in `src/lib/agents/gatherer.ts`
- [x] T038 [P] Information Specialist agent with Grok-4-Fast-Reasoning in `src/lib/agents/specialist.ts`
- [x] T039 [P] Form Putter agent with GPT-OSS-20B in `src/lib/agents/form-putter.ts`
- [x] T040 Agent prompt engineering and response parsing in `src/lib/agent-prompts.ts`

## Phase 3.7: Serverless Functions

- [x] T041 [P] POST /api/itinerary/generate - Main orchestration endpoint
- [x] T042 [P] POST /api/agents/architect - Itinerary structure planning
- [x] T043 [P] POST /api/agents/gatherer - Real-time travel data collection
- [x] T044 [P] POST /api/agents/specialist - Cultural insights generation
- [x] T045 POST /api/inngest - Workflow handler (depends on workflow setup)
- [x] T046 [P] POST /api/form/updates - Real-time form updates & polling
- [x] T047 [P] POST /api/search/providers - Unified search interface
- [x] T048 [P] POST /api/cache/vector - Vector similarity caching

## Phase 3.8: Workflow Orchestration

- [x] T049 Inngest workflow configuration in `src/lib/workflows/inngest-config.ts`
- [x] T050 intelligentItineraryWorkflow with smart queries in `src/lib/workflows/itinerary-workflow.ts`
- [x] T051 [P] formUpdateWorkflow for real-time updates in `src/lib/workflows/form-workflow.ts`
- [x] T052 [P] Multi-agent result synthesis in `src/lib/workflows/synthesis.ts`
- [x] T053 Workflow state management with Upstash Redis in `src/lib/workflows/state-manager.ts`

## Phase 3.9: Real-Time Features

- [x] T054 WebSocket connection handler in `api/itinerary/live.ts`
- [x] T055 Progress tracking and updates in `src/lib/progress-tracker.ts`
- [x] T056 Real-time message routing in `src/lib/message-router.ts`
- [x] T057 Integration of real-time features in `src/hooks/useRealtime.ts`

## Phase 3.10: Vector Caching & Storage

- [x] T058 [P] Upstash Vector integration in `src/lib/vector/upstash-client.ts`
- [x] T059 [P] Itinerary similarity matching in `src/lib/vector/similarity-search.ts`
- [x] T060 [P] Session state caching with Redis in `src/lib/cache/session-cache.ts`
- [x] T061 Embedding generation for form data in `src/lib/vector/embeddings.ts`

## Phase 3.11: Output Format & Synthesis

- [x] T062 Structured itinerary formatting in `src/lib/formatting/itinerary-formatter.ts`
- [x] T063 [P] ASCII art box generation for content blocks in `src/lib/formatting/box-formatter.ts`
- [x] T064 [P] Trip summary table generation in `src/lib/formatting/summary-formatter.ts`
- [x] T065 [P] Daily itinerary section builder in `src/lib/formatting/daily-formatter.ts`
- [x] T066 Result synthesis combining all agent outputs in `src/lib/synthesis/result-combiner.ts`

## Phase 3.12: Error Handling & Resilience

- [x] T067 [P] API error handling middleware in `src/lib/middleware/error-handler.ts`
- [x] T068 [P] Search provider failover logic in `src/lib/resilience/failover.ts`
- [x] T069 [P] Agent timeout and retry mechanisms in `src/lib/resilience/retry.ts`
- [x] T070 [P] Workflow error recovery in `src/lib/resilience/recovery.ts`

## Phase 3.13: Performance & Monitoring

- [x] T071 [P] Response time monitoring (<30s generation, <10s updates) in `src/lib/monitoring/performance.ts`
- [x] T072 [P] Agent execution metrics in `src/lib/monitoring/agent-metrics.ts`
- [x] T073 [P] Search provider latency tracking in `src/lib/monitoring/search-metrics.ts`
- [x] T074 [P] Memory usage optimization for Edge Runtime in `src/lib/optimization/memory.ts`

## Phase 3.14: Polish & Documentation

- [x] T075 [P] Unit tests for smart query generation in `tests/unit/smart-queries.test.ts`
- [x] T076 [P] Unit tests for agent prompt engineering in `tests/unit/agent-prompts.test.ts`
- [x] T077 [P] Unit tests for output formatting in `tests/unit/formatting.test.ts`
- [x] T078 [P] Performance benchmarks for 30s/10s targets in `tests/performance/benchmark.test.ts`
- [x] T079 [P] API documentation updates in `docs/api-integration.md`
- [x] T080 [P] Multi-agent architecture documentation in `docs/agents-architecture.md`
- [x] T081 Remove code duplication across agent implementations
- [x] T082 Run manual testing scenarios from quickstart.md

## Dependencies

### Critical Path

- Setup (T001-T005) → Tests (T006-T018) → Models (T019-T026) → Core Logic
- Tests MUST fail before any implementation begins
- T027-T030 (Smart Queries) blocks T041 (main endpoint)
- T031-T035 (Search Providers) blocks T042-T044 (agent endpoints)
- T036-T040 (Agents) blocks T045 (Inngest workflow)
- T049-T053 (Workflows) blocks T050 (main workflow)
- All core implementation before integration and polish

### Parallel Execution Groups

```
Group 1 - Contract Tests (can run together):
T006: Contract test POST /api/itinerary/generate
T007: Contract test PUT /api/itinerary/update
T008: Contract test GET /api/itinerary/status
T009: Contract test WebSocket /api/itinerary/live

Group 2 - Data Models (can run together):
T019: EnhancedFormData interface
T020: ItineraryRequest/Response interfaces
T021: GeneratedItinerary entity
T022: SmartQuery interface

Group 3 - Search Providers (can run together):
T031: SERP API integration
T032: Tavily search integration
T033: Exa neural search integration
T034: CruiseCritic scraping

Group 4 - AI Agents (can run together):
T036: Itinerary Architect agent
T037: Web Information Gatherer agent
T038: Information Specialist agent
T039: Form Putter agent

Group 5 - Serverless Functions (can run together after agents ready):
T041: /api/itinerary/generate
T042: /api/agents/architect
T043: /api/agents/gatherer
T044: /api/agents/specialist
T046: /api/form/updates
T047: /api/search/providers
T048: /api/cache/vector
```

## Parallel Example Commands

```bash
# Launch Group 1 contract tests:
Task: "Contract test POST /api/itinerary/generate in tests/contracts/itinerary-generate.test.ts"
Task: "Contract test PUT /api/itinerary/update in tests/contracts/itinerary-update.test.ts"
Task: "Contract test GET /api/itinerary/status in tests/contracts/itinerary-status.test.ts"
Task: "Contract test WebSocket /api/itinerary/live in tests/contracts/websocket-live.test.ts"
```

## Notes

- **[P]** tasks target different files with no dependencies
- Verify all tests fail before implementing corresponding functionality
- Multi-agent system requires careful orchestration - test workflows thoroughly
- 8 serverless functions must stay within Vercel's limits
- Real-time features require WebSocket stability testing
- Vector similarity search critical for performance
- All external API calls need proper error handling and fallbacks

## Task Generation Rules

- Each contract file → contract test task marked [P]
- Each entity in data-model → model creation task marked [P]
- Each serverless function → implementation task (sequential if shared dependencies)
- Each integration scenario → integration test marked [P]
- Different files = parallel [P], same file = sequential
- TDD: tests before implementation always

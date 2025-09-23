# Tasks: AI-Powered Itinerary Generation Workflow

**Input**: Design documents from `/specs/001-create-a-ai/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → Tech stack: React 18.3.1 + TypeScript 5.5.3 + Vite + Upstash QStash/Workflow 2.7.9
   → Backend: Vercel Edge Functions (max 10 functions)
   → AI: Multi-LLM (XAI Grok + Groq + GPT-OSS) with 4-agent workflow
   → Search: Upstash Search for destination data + vector similarity
2. Load design documents:
   → data-model.md: 8 entities (WorkflowSession, TravelFormData, etc.)
   → contracts/: 6 API endpoints with Edge Runtime config
   → research.md: AI providers, Redis + QStash pattern, Upstash Search integration
3. Generate tasks by 5-phase implementation plan:
   → Phase 1: Dependencies & Environment Setup
   → Phase 2: Vite Configuration & Deployment
   → Phase 3: Form Data Integration
   → Phase 4: Upstash QStash AI Workflow Implementation
   → Phase 5: Itinerary Display Components
4. Apply constitutional requirements:
   → Edge Runtime compatibility (no Node.js built-ins)
   → Component composition with BaseFormProps pattern
   → Code-Deploy-Debug workflow with rapid iteration
5. Number tasks sequentially (T001-T042)
6. Mark [P] for parallel execution (different files, no dependencies)
7. Validate: All contracts tested, all entities modeled, all Edge compatible
8. Return: SUCCESS (42 tasks ready for 5-phase execution)
```

## Data Flow Numbering System **[Console Log Numbers]**

**Phase 3 → Phase 4 Data Flow Tracking:**

- **[1-5]** Form Aggregation & Validation (Phase 3 → Phase 4 bridge)
- **[21-39]** API Request Processing (`/api/itinerary/generate`)
- **[40-49]** Infrastructure Initialization (QStash, Redis, Search, AI Providers)
- **[50-69]** AI Provider Setup & Management
- **[70-79]** QStash Workflow Orchestration & Progress
- **[80-99]** AI Agent Execution (Architect, Gatherer, Specialist, Formatter)
- **[100-150]** Supporting Systems (Vector, Upstash Search, Monitoring, API endpoints)

**Usage**: These numbers appear in console.log statements to track data flow from form submission through AI workflow completion.

````

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **File paths**: All paths are absolute, following Hylo project structure
- **Edge Runtime**: All API functions must export `{ runtime: 'edge' }`

## Phase 1: Dependencies & Environment Setup

### T001-T008: Core Dependencies & Configuration

- [x] T001 [P] Install AI SDK packages for multi-LLM integration
  ```bash
  npm install @ai-sdk/xai@2.0.20 @ai-sdk/groq@2.0.20
````

- [x] T002 [P] Install Upstash QStash workflow orchestration package

  ```bash
  npm install @upstash/qstash@2.7.9
  ```

- [x] T003 [P] Install Upstash Redis, Vector, and Search clients for state management

  ```bash
  npm install @upstash/redis @upstash/vector @upstash/search
  ```

- [x] T004 [P] Install search provider integrations

  ```bash
  npm install exa-js serpapi tavily
  ```

- [x] T005 [P] Configure environment variables in `src/lib/config/env.ts`

  - XAI_API_KEY, GROQ_API_KEY for AI providers
  - QSTASH_URL, QSTASH_TOKEN for workflow orchestration
  - UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN for state storage
  - UPSTASH_VECTOR_REST_URL, UPSTASH_VECTOR_REST_TOKEN for embeddings
  - UPSTASH_SEARCH_REST_URL, UPSTASH_SEARCH_REST_TOKEN for destination search
  - TAVILY_API_KEY, EXA_API_KEY, SERP_API_KEY for external search

- [x] T006 [P] Update TypeScript config for strict mode compliance in `tsconfig.json`

  - Enable strict mode as required by constitution
  - Configure paths for new AI workflow modules

- [x] T007 [P] Create Edge Runtime compatibility validation script in `scripts/validate-edge.ts`

  - Check for Node.js built-ins usage
  - Validate all API functions export edge runtime config

- [x] T008 Update Vercel configuration in `vercel.json`
  - Add function timeout configurations for AI workflow endpoints
  - Configure environment variables for production deployment

## Phase 2: Vite Configuration & Deployment Test

### T009-T013: Build Configuration & Deployment Verification

- [x] T009 Configure Vite for Edge Runtime optimization in `vite.config.ts`

  - Add build optimizations for AI SDK packages
  - Configure proper bundling for Vercel Edge Functions
  - Ensure no Node.js polyfills are included

- [x] T010 [P] Create deployment health check endpoint in `api/health.ts`

  - Verify Edge Runtime compatibility
  - Test environment variable accessibility
  - Export proper Edge Runtime configuration

- [x] T011 Deploy to Vercel staging environment

  ```bash
  git push origin main  # Automatic deployment via Vercel integration
  ```

- [x] T012 [P] Create environment variable validation script in `api/validate-env.ts`

  - Test all required API keys are accessible
  - Verify Redis and Vector DB connections
  - Check AI provider API connectivity

- [x] T013 [P] Verify API endpoint routing works in `tests/deployment/api-routing.test.ts`
  - Test all planned API endpoints respond correctly
  - Validate Edge Runtime functions deploy successfully
  - Ensure proper CORS and headers configuration

## Phase 3: Form Data Integration

### T014-T018: Data Aggregation & Validation

- [x] T014 [P] Create unified TravelFormData interface in `src/types/travel-form.ts`

  - Extend existing FormData with AI workflow requirements
  - Include all form sections: location, dates, budget, preferences
  - Add validation rules for AI processing

- [x] T015 [P] Implement Zod validation schema in `src/schemas/ai-workflow-schemas.ts`

  - Create TravelFormDataSchema with cross-field validation
  - Add WorkflowRequestSchema for API inputs
  - Include error handling for malformed data

- [x] T016 [P] Create form data aggregation service in `src/services/form-aggregation.ts` **[1-5]**

  - Collect data from all existing form components
  - Transform to AI workflow compatible format
  - Handle optional fields and defaults

- [x] T017 [P] Implement form-to-workflow data transformation in `src/utils/workflow-transforms.ts` **[6-10]**

  - Convert form data to AI agent input format
  - Handle currency conversions and date formatting
  - Sanitize and validate user inputs

- [x] T018 [P] Create form data validation tests in `tests/unit/form-validation.test.ts`
  - Test Zod schema validation with various input combinations
  - Verify cross-field validation rules
  - Test edge cases and malformed data handling

## Phase 4: Upstash QStash AI Workflow Implementation

### T019-T031: 4-Agent Workflow System

- [ ] T019 [P] Create QStash client configuration in `src/lib/qstash/client.ts` **[40-44]**

  - Initialize QStash Client with URL and token
  - Configure Edge Runtime compatibility
  - Set up development/production environment handling

- [ ] T020 [P] Implement WorkflowSession Redis management in `src/lib/workflows/session-manager.ts` **[45-48]**

  - Create, update, and retrieve workflow state from Redis
  - Handle session expiration and cleanup
  - Implement progress tracking with atomic updates

- [ ] T021 [P] Create AI provider client setup in `src/lib/ai-clients/providers.ts` **[50-61]**

  - Initialize XAI Grok client for reasoning tasks
  - Set up Groq client for information gathering
  - Configure GPT-OSS client for form processing
  - Add error handling and retry logic

- [ ] T022 [P] Implement Itinerary Architect agent in `src/lib/ai-agents/architect-agent.ts` **[80-86]**

  - Create trip structure and framework planning
  - Use XAI Grok-4-Fast-Reasoning model
  - Generate daily schedule templates and budget allocation

- [ ] T023 [P] Implement Web Information Gatherer agent with Upstash Search in `src/lib/ai-agents/gatherer-agent.ts` **[87-93]**

  - Search and collect destination data using Tavily/Exa/SERP
  - Use Upstash Search for cached destination information
  - Use Groq Compound model for fast information processing
  - Store results in Upstash Search for future queries

- [ ] T024 [P] Implement Information Specialist agent in `src/lib/ai-agents/specialist-agent.ts` **[94-99]**

  - Process and refine gathered travel data
  - Use XAI Grok-4-Fast-Reasoning for data analysis
  - Filter and rank recommendations based on user preferences

- [ ] T025 [P] Implement Form Putter agent in `src/lib/ai-agents/formatter-agent.ts` **[100-105]**

  - Format final itinerary output using GPT-OSS-20B
  - Structure data according to GeneratedItinerary interface
  - Ensure proper budget calculations and feasibility

- [ ] T026 [P] Create main QStash workflow orchestration in `src/lib/workflows/orchestrator.ts` **[70-79]**

  - Coordinate all 4 AI agents using QStash HTTP calls
  - Update Redis state at each step
  - Handle agent failures with retry logic
  - Emit progress events for real-time updates

- [ ] T027 [P] Implement Server-Sent Events for progress updates in `api/itinerary/progress-simple.ts` **[106-110]**

  - Stream workflow progress to frontend
  - Connect Redis state changes to SSE events
  - Handle client disconnections gracefully

- [ ] T028 [P] Create workflow error handling in `src/lib/workflows/orchestrator.ts` **[75-79]**

  - Comprehensive error boundaries for AI failures
  - Retry logic for transient service issues
  - Graceful degradation strategies

- [ ] T029 [P] Implement Upstash Search integration in `src/lib/search/destination-search.ts` **[88-92]**

  - Store destination data in Upstash Search index
  - Enable semantic similarity search for recommendations
  - Cache frequently searched destinations
  - Integrate with external search providers as fallback

- [ ] T030 [P] Create vector storage for embeddings in `src/lib/vector/VectorStorageManager.ts` **[111-115]**

  - Store and retrieve travel destination embeddings
  - Enable similarity search for recommendations
  - Optimize for fast retrieval during AI processing

- [ ] T031 [P] Implement workflow monitoring and logging in `src/lib/workflows/orchestrator.ts` **[76-79]**
  - Track AI agent performance metrics
  - Log token usage and costs
  - Monitor workflow success rates

### T032-T035: API Endpoint Implementation

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [ ] T032 [P] Contract test POST /api/itinerary/generate in `tests/contract/generate-itinerary.test.ts` **[116-120]**

  - Test request/response schema validation
  - Verify QStash workflow initiation logic
  - Ensure proper error handling for invalid inputs

- [ ] T033 [P] Contract test GET /api/itinerary/progress/:workflowId in `tests/contract/progress-stream.test.ts` **[121-125]**

  - Test Server-Sent Events stream format
  - Verify progress update broadcasting
  - Ensure proper connection handling

- [ ] T034 [P] Contract test GET /api/itinerary/:itineraryId in `tests/contract/get-itinerary.test.ts` **[126-130]**

  - Test itinerary retrieval and formatting
  - Verify data structure compliance
  - Ensure proper 404 handling for missing itineraries

- [ ] T035 [P] Integration test complete QStash workflow in `tests/contract/end-to-end-workflow.test.ts` **[131-135]**
  - Test full form submission to itinerary generation
  - Verify all 4 AI agents execute correctly via QStash
  - Validate real-time progress updates

### T036-T039: Core API Implementation (ONLY after tests are failing)

- [ ] T036 Implement POST /api/itinerary/generate endpoint in `api/itinerary/generate.ts` **[21-37]**

  - Validate TravelFormData using Zod schemas
  - Create WorkflowSession in Redis
  - Trigger QStash workflow with form data
  - Export Edge Runtime configuration

- [ ] T037 Implement GET /api/itinerary/progress/[workflowId].ts for SSE streaming **[136-140]**

  - Stream workflow progress updates from Redis
  - Handle client connections and disconnections
  - Ensure proper SSE headers and formatting

- [ ] T038 Implement GET /api/itinerary/get-itinerary.ts for result retrieval **[141-145]**

  - Retrieve completed itinerary from Redis/storage
  - Format according to GeneratedItinerary interface
  - Handle expiration and not-found cases

- [ ] T039 Implement QStash webhook endpoint for workflow callbacks in `api/qstash/webhook.ts` **[146-150]**
  - Handle QStash workflow execution callbacks
  - Ensure proper authentication and validation
  - Export Edge Runtime configuration

## Phase 5: Itinerary Display Components

### T040-T042: Frontend Integration & Display

- [ ] T040 [P] Create itinerary display components in `src/components/ItineraryDisplay/`

  - GeneratedItineraryView component with daily breakdown
  - ActivityCard, MealCard, AccommodationCard sub-components
  - Follow BaseFormProps pattern and design tokens
  - Use bg-form-box (#ece8de) and rounded-[36px] styling

- [ ] T041 [P] Implement real-time progress tracking in `src/components/WorkflowProgress/`

  - ProgressBar component with live updates
  - WorkflowStatus component showing current AI agent
  - Error handling for workflow failures
  - Loading states and progress animations

- [ ] T042 [P] Create itinerary regeneration functionality in `src/components/ItineraryActions/`
  - RegenerateButton component for new attempts
  - ModifyPreferences component for adjustments
  - Integration with existing form state management
  - Follow constitutional component composition patterns

## Dependencies

**Phase 1 → Phase 2**: Dependencies and environment setup must complete before deployment testing

**Phase 2 → Phase 3**: Deployment verification must succeed before form integration

**Phase 3 → Phase 4**: Form data integration must be complete before AI workflow implementation

**Phase 4 → Phase 5**: AI workflow must be functional before frontend display components

**Within Phase 4**:

- T019-T021 (setup) → T022-T025 (agents) → T026 (orchestration)
- T032-T035 (tests) → T036-T039 (API implementation)
- T027-T031 can run parallel with agent development

**Edge Runtime Constraint**: All API endpoints (T036-T039) must export `{ runtime: 'edge' }`

## Parallel Execution Examples

### Phase 1 - Dependencies (T001-T004 together):

```bash
Task: "Install AI SDK packages for multi-LLM integration"
Task: "Install Inngest workflow orchestration package"
Task: "Install Upstash Redis and Vector clients for state management"
Task: "Install search provider integrations"
```

### Phase 4 - AI Agents (T022-T025 together):

```bash
Task: "Implement Itinerary Architect agent in src/lib/ai-agents/architect-agent.ts"
Task: "Implement Web Information Gatherer agent in src/lib/ai-agents/gatherer-agent.ts"
Task: "Implement Information Specialist agent in src/lib/ai-agents/specialist-agent.ts"
Task: "Implement Form Putter agent in src/lib/ai-agents/formatter-agent.ts"
```

### Phase 4 - Contract Tests (T032-T035 together):

```bash
Task: "Contract test POST /api/itinerary/generate in tests/contract/generate-itinerary.test.ts"
Task: "Contract test GET /api/itinerary/progress/:workflowId in tests/contract/progress-stream.test.ts"
Task: "Contract test GET /api/itinerary/:itineraryId in tests/contract/get-itinerary.test.ts"
Task: "Integration test complete workflow in tests/integration/end-to-end-workflow.test.ts"
```

## Constitutional Compliance Validation

**Edge-First Architecture**:

- [ ] All API endpoints (T036-T039) export `{ runtime: 'edge' }`
- [ ] No Node.js built-ins used in any implementation
- [ ] Edge Runtime validation script (T007) passes

**Component Composition Pattern**:

- [ ] All React components (T040-T042) follow BaseFormProps interface
- [ ] Form state flows through parent onFormChange pattern
- [ ] Types centralized in shared files

**User Experience Consistency**:

- [ ] All form components use `bg-form-box (#ece8de)` and `rounded-[36px]`
- [ ] Consistent Tailwind CSS classes across components
- [ ] No visual pattern deviations

**Code-Deploy-Debug Flow**:

- [ ] Each phase includes deployment verification (T011, etc.)
- [ ] Real-world validation through production testing
- [ ] Rapid iteration with performance monitoring

**Type-Safe Development**:

- [ ] TypeScript strict mode enabled (T006)
- [ ] Zod schemas for all API boundaries (T015)
- [ ] No any types in implementation

## Validation Checklist

_GATE: Must pass before task execution begins_

- [x] All contracts have corresponding tests (T032-T035)
- [x] All entities have model/service tasks (T014-T031)
- [x] All tests come before implementation (T032-T035 → T036-T039)
- [x] Parallel tasks truly independent (different files, no shared state)
- [x] Each task specifies exact file path and implementation details
- [x] No task modifies same file as another [P] task
- [x] Edge Runtime compatibility maintained throughout
- [x] 10 serverless function limit respected (6 API endpoints planned)
- [x] Constitutional requirements integrated into all phases

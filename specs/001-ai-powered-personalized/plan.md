# Implementation Plan: AI-Powered Personalized Itinerary Generation

**Branch**: `001-ai-powered-personalized` | **Date**: September 20, 2025 | **Spec**: [link](./spec.md)
**Input**: Feature specification from `/specs/001-ai-powered-personalized/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → ✅ Feature spec loaded successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → ✅ Project Type: Web Application (React + TypeScript frontend + Vercel Edge Functions backend)
   → ✅ Structure Decision: Option 2 (Web application with frontend/backend separation)
3. Fill the Constitution Check section based on the content of the constitution document.
   → ✅ Constitution requirements analyzed
4. Evaluate Constitution Check section below
   → ✅ No violations detected in proposed approach
   → Update Progress Tracking: Initial Constitution Check ✅
5. Execute Phase 0 → research.md
   → ✅ All NEEDS CLARIFICATION resolved through Context7 MCP research
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file
7. Re-evaluate Constitution Check section
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach
9. STOP - Ready for /tasks command
```

## Summary

AI-powered itinerary generation system that transforms existing form data from Hylo's trip details into personalized travel recommendations using multi-agent LLM workflow. Real-time updates when form fields change, leveraging xAI Grok, Groq models for generation, Upstash Vector for embeddings/caching, Inngest for workflow orchestration, and Tavily/Exa for web research.

## Technical Context

**Language/Version**: TypeScript 5.5.3, React 18.3.1, Node.js 18+  
**Primary Dependencies**: Inngest (workflow orchestration), Upstash Vector (embeddings/cache), xAI SDK (@ai-sdk/xai), Groq SDK, Tavily JS (@tavily/core), Exa JS  
**Storage**: Upstash Vector (embeddings), Upstash Redis (sessions), Vercel KV (form state)  
**Testing**: Vitest 3.2.4, React Testing Library 16.3.0  
**Target Platform**: Vercel Edge Runtime, serverless deployment  
**Project Type**: Web application (frontend + backend API)  
**Performance Goals**: 30s itinerary generation, 10s real-time updates, <3s UI responsiveness  
**Constraints**: Vercel Edge Runtime 50MB memory, 10s execution limit per function, Context7 MCP required for all patterns  
**Scale/Scope**: 1000+ concurrent users, multi-agent workflows, real-time form reactivity

**User-Provided Context**: Vercel deployment with 4-role workflow: "Itinerary Architect & Content Planner", "Web Information Gatherer", "Information Specialist", "Form Putter". Multi-LLM integration (xAI, Groq), web search via Tavily/Exa, Inngest orchestration, Upstash Vector storage.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

✅ **High-Quality Code**: TDD approach with comprehensive testing, TypeScript strict mode  
✅ **User-Centric Value**: Direct enhancement of travel planning UX, real-time personalization  
✅ **Seamless Integration**: Builds on existing React Hook Form + Zod validation patterns  
✅ **Context7 MCP Integration**: All dependencies researched through Context7 MCP server  
✅ **Tech Stack Consistency**: Maintains React 18.3.1, TypeScript 5.5.3, Vite, Tailwind stack  
✅ **Platform Compatibility**: Designed for Vercel Edge Runtime deployment

## Project Structure

### Documentation (this feature)

```
specs/001-ai-powered-personalized/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
# Option 2: Web application (detected: React frontend + Vercel Edge Functions backend)
api/
├── itinerary/
│   ├── generate.ts          # Main itinerary generation endpoint
│   └── update.ts           # Real-time update endpoint
├── agents/
│   ├── architect.ts        # Itinerary Architect & Content Planner
│   ├── gatherer.ts         # Web Information Gatherer
│   ├── specialist.ts       # Information Specialist
│   └── putter.ts          # Form Putter
├── workflows/
│   ├── inngest.ts         # Inngest client configuration
│   └── functions/         # Inngest workflow functions
├── services/
│   ├── upstash.ts         # Vector & Redis services
│   ├── search.ts          # Tavily/Exa integration
│   └── llm.ts            # xAI/Groq model services
└── types/
    └── agents.ts          # Agent-specific types

src/
├── components/
│   ├── ItineraryGeneration/    # New itinerary UI components
│   ├── TripDetails/           # Enhanced existing components
│   └── shared/               # Shared UI components
├── hooks/
│   ├── useItineraryGeneration.ts  # Real-time generation hook
│   └── useFormReactivity.ts      # Form change detection
├── services/
│   ├── api.ts                    # Frontend API client
│   └── websocket.ts             # Real-time updates client
└── types/
    ├── itinerary.ts             # Itinerary data types
    └── agents.ts               # Shared agent types

tests/
├── api/                        # Edge function tests
├── components/                 # React component tests
├── integration/               # End-to-end workflow tests
└── agents/                   # Agent behavior tests
```

**Structure Decision**: Option 2 (Web application) - React frontend with Vercel Edge Functions backend

## Phase 0: Outline & Research

**Research completed through Context7 MCP server:**

1. **Inngest Integration**: Serverless workflow orchestration for multi-agent systems

   - TypeScript SDK with Next.js adapter support
   - `step.run()` for reliable task execution
   - Event-driven architecture for form reactivity
   - Background process support for long-running generations

2. **Upstash Vector**: Serverless vector database for embeddings and caching

   - TypeScript SDK with Vercel Edge Runtime compatibility
   - Automatic embedding generation or custom model support
   - Similarity search for recommendation enhancement
   - Redis backend for session management

3. **xAI API**: Grok models for advanced reasoning and code generation

   - Vercel AI SDK integration (`@ai-sdk/xai`)
   - `grok-4` for complex itinerary planning
   - Tool/function calling capabilities
   - Image analysis for destination research

4. **Groq API**: High-speed inference for real-time updates

   - TypeScript SDK with serverless optimization
   - Ultra-fast model responses for form reactivity
   - Multiple model options for different agent roles
   - Streaming support for progress indicators

5. **Tavily Search**: AI-optimized web search for travel information

   - TypeScript SDK (`@tavily/core`)
   - Search, extract, crawl, and map APIs
   - Up to 20 URLs per extraction request
   - Natural language instruction support

6. **Exa Search**: AI-focused search for precise travel content
   - TypeScript SDK with neural and keyword search
   - Content retrieval and similarity finding
   - Optimized for LLM consumption
   - Advanced filtering and live crawling

**Output**: research.md with all technical decisions documented

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Extract entities from feature spec** → `data-model.md`:

   - FormData (enhanced with AI preferences)
   - ItineraryRequest, ItineraryResponse
   - AgentTask, AgentResult
   - SearchResult, ContentExtract
   - UserSession, GenerationState

2. **Generate API contracts** from functional requirements:

   - POST /api/itinerary/generate - Initial generation
   - PUT /api/itinerary/update - Real-time updates
   - GET /api/itinerary/status - Progress tracking
   - WebSocket /api/itinerary/live - Real-time notifications
   - Output OpenAPI schema to `/contracts/`

3. **Generate contract tests** from contracts:

   - One test file per endpoint
   - Request/response schema validation
   - Agent workflow integration tests
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:

   - Form completion → generation flow
   - Real-time update scenarios
   - Multi-agent coordination tests
   - Error handling and fallback tests

5. **Update agent file incrementally**:
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot`
   - Add Inngest, Upstash, xAI, Groq, Tavily, Exa patterns
   - Update with multi-agent workflow context
   - Keep under 150 lines for token efficiency

**Output**: data-model.md, /contracts/\*, failing tests, quickstart.md, .github/copilot-instructions.md

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P]
- Each agent → agent implementation task
- Each workflow → Inngest function task
- Integration tasks for multi-agent coordination

**Ordering Strategy**:

- TDD order: Tests before implementation
- Dependency order: Models → Services → Agents → Workflows → UI
- Infrastructure setup: Upstash, Inngest configuration first
- Parallel agent development after core infrastructure
- Mark [P] for parallel execution (independent agent tasks)

**Estimated Output**: 35-40 numbered, ordered tasks in tasks.md

**Multi-Agent Task Categories**:

1. Infrastructure Setup (Upstash, Inngest, API routes)
2. Core Models and Types (FormData, Itinerary schemas)
3. Agent Implementation (4 agents in parallel)
4. Workflow Orchestration (Inngest functions)
5. Frontend Integration (React components, hooks)
6. Real-time Features (WebSocket, form reactivity)
7. Testing & Validation (E2E multi-agent tests)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_No violations detected - all approaches align with constitutional principles_

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---

_Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`_

# Implementation Plan: AI-Powered Itinerary Generation Workflow

**Branch**: `001-create-a-ai` | **Date**: 2025-09-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-create-a-ai/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

AI-powered itinerary generation system that processes comprehensive travel form data (location, dates, budget, preferences, travel style) through a 4-agent multi-LLM workflow to generate personalized day-by-day travel itineraries. Integration uses Inngest for AI workflow orchestration, Upstash Redis for state management, WebSocket/SSE for real-time progress updates, and multiple LLM providers (XAI Grok, Groq, GPT) for specialized tasks. Implementation follows Edge-first architecture deployed on Vercel with Vite frontend.

## Technical Context

**Language/Version**: TypeScript 5.5.3 (strict mode enforced per constitution)  
**Primary Dependencies**: React 18.3.1 + Vite + Tailwind CSS 3.4.1 + React Hook Form 7.62.0 + Zod 3.25.76 + Lucide React 0.344.0  
**Backend**: Vercel Edge Functions (Edge Runtime only) - Maximum 10 serverless functions  
**AI/Workflow**: Inngest 3.41.0 for AI workflow orchestration  
**Testing**: Vitest 3.2.4 + React Testing Library (deployment-focused testing)  
**State Management**: Upstash Redis for session/state management  
**Real-time**: WebSocket/Server-Sent Events for progress updates  
**AI Providers**:

- XAI Grok (@ai-sdk/xai 2.0.20)
- Groq (@ai-sdk/groq 2.0.20)
- GPT-OSS-20B for form processing
  **Vector Storage**: Upstash Vector for embeddings storage  
  **Search Providers**: Tavily, Exa, SERP for web information gathering  
  **Validation**: Zod schemas with React Hook Form integration  
  **Target Platform**: Vercel Edge Runtime (Web APIs only, no Node.js built-ins)  
  **Project Type**: web (frontend + Edge Functions backend)  
  **Performance Goals**: Edge runtime compatibility, <200ms API response times  
  **Constraints**: Vercel Edge Runtime limitations, max 10 serverless functions, no file system access, streaming responses required  
  **Scale/Scope**: Travel itinerary application with AI-powered 4-agent workflow system

**4-Agent Multi-LLM Architecture**:

1. **Itinerary Architect** (XAI Grok-4-Fast-Reasoning) - Plan structure & framework
2. **Web Information Gatherer** (Groq Compound) - Search & collect destination data
3. **Information Specialist** (XAI Grok-4-Fast-Reasoning) - Process & refine data
4. **Form Putter** (GPT-OSS-20B) - Format final itinerary output

**Redis + WebSocket + Inngest Integration Pattern**:

- Redis stores workflow state & progress tracking
- WebSocket/SSE streams real-time updates to frontend
- Inngest orchestrates AI agent workflow with progress updates

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**I. Edge-First Architecture**: ✅ **PASS**

- [x] All API endpoints use Vercel Edge Runtime (`export const config = { runtime: 'edge' }`)
- [x] No Node.js built-ins or file system access (using Web APIs, Upstash Redis cloud storage)
- [x] Web APIs only for HTTP, streaming, environment variables
- [x] TypeScript strict mode enabled

**II. Component Composition Pattern**: ✅ **PASS**

- [x] React components follow BaseFormProps interface pattern (existing codebase compliance)
- [x] Form state flows through parent onFormChange pattern (existing implementation)
- [x] Types centralized in shared types.ts files (existing structure)
- [x] Single responsibility principle maintained (AI workflow separation)

**III. User Experience Consistency**: ✅ **PASS**

- [x] Form components use design tokens: `bg-form-box (#ece8de)`, `rounded-[36px]` (existing design system)
- [x] Consistent Tailwind CSS classes across components
- [x] No visual pattern deviations without documented justification

**IV. Code-Deploy-Debug Implementation Flow**: ✅ **PASS**

- [x] Implementation follows CODE → DEPLOY → DEBUG cycle (5-phase plan structure)
- [x] Phase-based development approach (no traditional TDD)
- [x] Real-world validation through deployment testing (Vercel focus)
- [x] Rapid iteration with production feedback

**V. Type-Safe Development**: ✅ **PASS**

- [x] TypeScript strict mode with no any types
- [x] Zod schemas for runtime validation at API boundaries
- [x] React Hook Form integration with type-safe validation (existing)
- [x] Comprehensive FormData interfaces

**Constitutional Violations Found**: None - all requirements met within Edge Runtime constraints and existing architectural patterns.

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: [DEFAULT to Option 1 unless Technical Context indicates web/mobile app]

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:

   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Extract entities from feature spec** → `data-model.md`:

   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:

   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:

   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:

   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/\*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

Based on the 5-phase user-specified implementation plan:

**Phase 1 Tasks (Dependencies & Environment)**:

- Install AI SDK packages (@ai-sdk/xai, @ai-sdk/groq)
- Install Inngest 3.41.0 for workflow orchestration
- Install Upstash Redis and Vector clients
- Configure environment variables in Vercel
- Set up search provider integrations (Tavily, Exa, SERP)
- Verify Edge Runtime compatibility for all dependencies

**Phase 2 Tasks (Vite Configuration & Deployment)**:

- Update Vite config for Edge Runtime optimization
- Configure build settings for multi-LLM integration
- Deploy to Vercel staging environment
- Test environment variable accessibility in Edge functions
- Verify API endpoint routing works correctly

**Phase 3 Tasks (Form Data Integration)**:

- Create unified form data aggregation service
- Implement TravelFormData TypeScript interfaces
- Add Zod validation for AI workflow inputs
- Create form-to-workflow data transformation
- Test complete form data flow to AI trigger

**Phase 4 Tasks (Inngest Workflow Implementation)**:

- Design 4-agent workflow orchestration system
- Implement XAI Grok Architect agent
- Implement Groq Web Information Gatherer agent
- Implement XAI Grok Information Specialist agent
- Implement GPT Form Putter agent
- Add Redis state management for workflow tracking
- Implement Server-Sent Events for real-time progress
- Add error handling and retry logic
- Create workflow monitoring and logging

**Phase 5 Tasks (Itinerary Display)**:

- Create GeneratedItinerary React components
- Implement real-time loading states with progress
- Add itinerary presentation with daily breakdown
- Create error boundaries for AI failures
- Implement regeneration functionality
- Add responsive design for mobile/desktop

**Ordering Strategy**:

1. **Dependencies First**: Environment setup and package installation
2. **Infrastructure**: Vite config and deployment verification
3. **Data Flow**: Form integration before AI processing
4. **Core Workflow**: AI agents and orchestration
5. **User Interface**: Display components last

**Parallel Execution Opportunities** [P]:

- AI agent implementations can be developed in parallel
- Frontend components can be built while backend is in progress
- Environment setup tasks are independent
- Testing can run parallel to implementation

**Estimated Output**: 35-40 numbered, ordered tasks with clear dependencies and 5-phase organization

**Edge Runtime Constraints**:

- All tasks must ensure Vercel Edge compatibility
- Maximum 10 serverless functions limit requires careful API design
- Memory and execution time limits must be considered
- No Node.js built-ins allowed in any implementation

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |

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
- [ ] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_

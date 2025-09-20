# GitHub Copilot Instructions - Hylo Travel AI Platform

##```
src/
├── co## Key File Locations
```
src/
├── compone## Key File Locations
```
src/
├── components/TripDetails/
│   ├── TravelersForm.tsx              # Main target for centering
│   └── PreferenceModals/              # Modal styling targets
│       ├── AccommodationPreferences.tsx
│       └── RentalCarPreferences.tsx
├── types/                             # TypeScript interfaces
├── hooks/                             # Custom React hooks  
└── utils/validation/                  # Zod schemas

api/                                   # Edge functions
tests/                                 # Test files
specs/007-ai-workflow-integration/     # Current feature docs
```
│   ├── TravelersForm.tsx              # Main target for centering
│   └── PreferenceModals/              # Modal styling targets
│       ├── AccommodationPreferences.tsx
│       └── RentalCarPreferences.tsx
├── types/                             # TypeScript interfaces
├── hooks/                             # Custom React hooks  
└── utils/validation/                  # Zod schemas

api/                                   # Edge functions
tests/                                 # Test files
specs/005-update-trip-details/         # Current feature docs
```── ConditionalTravelStyle.tsx    # Primary target for container styling
│   ├── TravelStyleChoice.tsx         # May need button styling review
│   └── GenerateItineraryButton.tsx   # For duplicate removal
├── types/
│   └── travel-style-choice.ts        # Type definitions (no changes)
└── App.tsx                           # Container styling integration

api/                                   # Edge functions
tests/                                 # Test files
specs/004-fix-travel-style/           # Current feature docs
```t
Hylo is a travel planning platform using React + TypeScript frontend with Vercel Edge Functions backend. Multi-agent AI system for personalized itinerary generation.

## Current Stack
- **Frontend**: React 18.3.1, TypeScript 5.5.3, Vite, Tailwind CSS 3.4.1
- **Forms**: React Hook Form 7.62.0 + Zod 3.25.76 validation
- **Icons**: Lucide React 0.344.0
- **Testing**: Vitest 3.2.4 + React Testing Library 16.3.0
- **AI**: Cerebras, Google Gemini, Groq SDK integrations
- **Backend**: Vercel Edge Functions, LangSmith tracing

## Architecture Patterns
- **TDD**: Tests before implementation (required)
- **Type Safety**: TypeScript strict mode, Zod runtime validation
- **Edge-First**: All APIs run on Vercel Edge Runtime  
- **Component-Based**: Functional React components with hooks
- **Multi-Agent**: LLM orchestration for travel planning

## Code Style
- **Components**: PascalCase, functional with TypeScript interfaces
- **Files**: Use existing file structure in src/components/TripDetails/
- **Styling**: Tailwind utilities, design tokens (primary, border-primary)
- **Forms**: React Hook Form patterns with Zod schemas
- **Tests**: .test.tsx files, React Testing Library patterns

## Current Feature: AI Multi-Agent Workflow Integration (Branch: 007-ai-workflow-integration)
**Context**: Implementing a sophisticated multi-agent AI workflow system for enhanced travel itinerary generation using four specialized agents.

**Agent Workflow Architecture**:
- `Content Planner`: Analyzes form data and identifies required real-time web information
- `Website Info Gatherer`: Uses Groq compound models for real-time data collection via LangChain + Vector DB + Jina embeddings
- `Planning Strategist`: Processes gathered information for strategic recommendations
- `Content Compiler`: Assembles final structured itinerary output

**Technical Stack Integration**:
- **Orchestration**: LangGraph StateGraph for agent coordination
- **Vector Pipeline**: LangChain → Text Splitter → Jina Embeddings → Upstash Vector/Qdrant
- **LLM Providers**: Groq (info gathering), Cerebras, Google Gemini with fallback chains
- **Workflow Management**: Upstash QStash for long-running processes
- **Observability**: LangSmith tracing for agent workflows
- **Parallel Processing**: LangChain RunnableParallel for concurrent operations

**Required Output Format**:
- **TRIP SUMMARY**: Trip nickname, dates, travelers, budget (with mode: per-person/total/flexible)
- **Prepared for**: Contact name section
- **DAILY ITINERARY**: Day-by-day activities with duration based on trip dates
- **TIPS FOR YOUR TRIP**: Travel recommendations section

**Implementation Requirements**:
- All agents run on Vercel Edge Functions with 30s timeout handling
- Contract tests for agent communication protocols
- Streaming responses for real-time workflow progress
- Graceful degradation with multi-level fallback strategies
- Cost tracking and budget enforcement per agent operation
- Vector embeddings for travel content semantic search

**Key File Structure**:
```
api/agents/                           # Individual agent implementations
├── content-planner/route.ts         # Content planning agent endpoint
├── info-gatherer/route.ts           # Web information gathering
├── strategist/route.ts              # Strategic planning agent  
└── compiler/route.ts                # Content compilation agent

api/workflow/                         # Workflow orchestration
├── orchestration/langgraph.ts       # LangGraph StateGraph setup
├── start/route.ts                   # Main workflow endpoint
└── state/                           # Session state management

src/components/AgentWorkflow/         # Frontend workflow components
src/services/agents/                  # Agent service clients
src/types/agents.ts                  # Agent and workflow TypeScript types
tests/agents/                        # Agent contract and integration tests
```

**Constitutional Compliance**:
- TDD approach with contract tests for all agent interactions
- Multi-agent orchestration aligns with constitutional AI principles
- Edge-first architecture with streaming and timeout handling
- Cost-conscious design with provider optimization and budget limits

## Constitutional Requirements
- **TDD Mandatory**: Write failing tests first
- **TypeScript Strict**: No any types, proper interfaces
- **Performance**: No additional re-renders, maintain <2s API response
- **Accessibility**: Preserve ARIA labels, keyboard navigation
- **Cost Conscious**: No impact on LLM costs for UI changes

## Recent Changes (Keep Updated)
1. **2025-09-19**: AI Multi-Agent Workflow integration specification and planning completed
2. **2025-09-19**: LangGraph StateGraph architecture designed with 4-agent coordination
3. **2025-09-19**: Vector pipeline with Jina embeddings and Upstash Vector integration planned
4. **Feature Focus**: Multi-agent AI orchestration for enhanced itinerary generation with real-time web data

## Key File Locations
```
src/
â”œâ”€â”€ components/TripDetails/
â”‚   â”œâ”€â”€ TravelersForm.tsx              # Main target for centering
â”‚   â””â”€â”€ PreferenceModals/              # Modal styling targets
â”‚       â”œâ”€â”€ AccommodationPreferences.tsx
â”‚       â””â”€â”€ RentalCarPreferences.tsx
â”œâ”€â”€ types/                             # TypeScript interfaces
â”œâ”€â”€ hooks/                             # Custom React hooks  
â””â”€â”€ utils/validation/                  # Zod schemas

api/                                   # Edge functions
tests/                                 # Test files
specs/001-ui-improvements-for/         # Current feature docs
```

## Avoid
- Adding new dependencies for UI-only changes
- Breaking existing TypeScript interfaces
- Changing component prop structures
- Impacting AI/LLM functionality
- Modifying API contracts for frontend changes
- Using inline styles instead of Tailwind
- Removing accessibility features

## When Suggesting Code
1. **Show TypeScript interfaces** for component props
2. **Include Tailwind classes** in examples  
3. **Provide test examples** using React Testing Library
4. **Maintain existing patterns** from codebase
5. **Consider responsive design** (mobile, tablet, desktop)
6. **Preserve functionality** while improving visuals

## Example Pattern
```typescript
// Preferred component pattern
interface TravelersFormProps extends BaseFormProps {
  formData: { adults: number; children: number };
  onFormChange: (data: Partial<FormData>) => void;
}

const TravelersForm: React.FC<TravelersFormProps> = ({ formData, onFormChange }) => {
  const totalTravelers = formData.adults + formData.children;
  
  return (
    <div className="text-center border-4 border-primary p-4 font-raleway font-bold">
      Total travelers: {totalTravelers}
    </div>
  );
};
```

*Last Updated: 2025-09-19 | Current Feature: Trip Details Enhancements | Constitution v2.0.0*


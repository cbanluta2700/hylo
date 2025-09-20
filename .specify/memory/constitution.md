<!--
Sync Impact Report:
- Version change: none → 1.0.0 (Initial constitution creation)
- Added principles: High-Quality Code, User-Centric Value, Seamless Integration, Context7 MCP Integration, Tech Stack Consistency, Platform Compatibility
- Added sections: Development Workflow, Quality Gates
- Templates requiring updates: ✅ all templates will be validated for alignment
- Follow-up TODOs: none
-->

# Hylo Travel AI Platform Constitution

## Core Principles

### I. High-Quality Code
All code MUST meet rigorous quality standards through comprehensive testing, clear documentation, and adherence to established patterns. Every component must be self-contained, independently testable, and follow TypeScript best practices. Code reviews are mandatory for all changes, with emphasis on maintainability, performance, and security. Quality gates include type checking, linting, unit tests (>80% coverage), and integration tests for all user-facing features.

**Rationale**: High-quality code reduces technical debt, improves maintainability, and ensures reliable user experiences in a complex multi-agent AI system.

### II. User-Centric Value
Every feature MUST directly enhance user experience in travel planning. Development decisions prioritize user needs over technical convenience. All user interfaces must be responsive, accessible, and intuitive. Performance benchmarks require <3s initial load times and <1s interaction responses. User feedback loops are integrated into the development process through analytics and testing.

**Rationale**: User-centric development ensures the AI travel platform delivers tangible value and maintains competitive advantage through superior user experience.

### III. Seamless Integration
All components MUST integrate seamlessly within the existing React + TypeScript + Vite architecture. APIs must follow established patterns using Vercel Edge Functions. State management must align with existing React Hook Form + Zod validation patterns. New features require integration tests demonstrating compatibility with the multi-agent AI workflow.

**Rationale**: Seamless integration prevents architecture drift, reduces debugging complexity, and maintains system reliability across the sophisticated AI orchestration.

### IV. Context7 MCP Integration (NON-NEGOTIABLE)
Context7 MCP Server MUST be the primary source for all code patterns, dependencies, and architectural decisions. Before implementing any new functionality, consult Context7 for pre-vetted, high-quality patterns. All AI model integrations (Cerebras, Google Gemini, Groq) must follow Context7 established practices. Custom implementations are only permitted when Context7 patterns are unavailable.

**Rationale**: Context7 provides battle-tested patterns that prevent reinventing solutions and ensures consistency across the AI-powered travel platform.

### V. Tech Stack Consistency
All development MUST strictly adhere to dependencies and versions defined in `package.json`. No additional dependencies without explicit approval and version compatibility verification. The established stack (React 18.3.1, TypeScript 5.5.3, LangGraph StateGraph, Upstash Vector, etc.) is non-negotiable. Version updates require comprehensive regression testing across the multi-agent workflow.

**Rationale**: Consistency prevents dependency conflicts, ensures CI/CD reliability, and maintains the complex AI orchestration system's stability.

### VI. Platform Compatibility
Every output MUST be fully runnable and deployable on the lovable.dev platform following established conventions. All code must be compatible with Vercel Edge Runtime constraints. Environment variables must follow the established pattern in `vercel.json`. Deployment scripts must maintain compatibility with the platform's build and runtime requirements.

**Rationale**: Platform compatibility ensures reliable deployments and prevents environment-specific issues that could disrupt the travel planning service.

## Development Workflow

All development MUST follow the established workflow patterns:
- Feature development begins with Context7 MCP Server consultation for proven patterns
- Component development follows React + TypeScript + Hook Form + Zod validation standards
- AI agent integrations use LangGraph StateGraph with proper error handling and fallback mechanisms
- Real-time data integration leverages Upstash Vector for caching and performance optimization
- All APIs implement proper streaming progress tracking for multi-agent workflow transparency

## Quality Gates

Before any code deployment, the following gates MUST pass:
- TypeScript compilation with zero errors (`npm run type-check`)
- ESLint validation with zero violations (`npm run lint`) 
- Unit test coverage >80% (`npm run test:coverage`)
- Integration tests for multi-agent workflows (`npm run test:integration`)
- Performance benchmarks within established budgets (`npm run test:performance`)
- Vercel deployment validation (`npm run validate:deployment`)
- Context7 MCP Server pattern compliance verification

## Governance

This Constitution supersedes all other development practices and guidelines. All pull requests and code reviews MUST verify compliance with these principles before approval. Any deviation requires explicit justification and architectural review.

Amendment procedure:
- Proposed changes require documentation of impact assessment
- Major principle changes require stakeholder approval
- All amendments must include migration plan for existing code
- Version increments follow semantic versioning: MAJOR for principle removals/redefinitions, MINOR for additions/expansions, PATCH for clarifications

Compliance review expectations:
- Weekly architecture reviews ensure adherence to Context7 MCP patterns
- Monthly tech stack audits verify dependency consistency
- Quarterly platform compatibility assessments validate lovable.dev deployment requirements
- All team members must reference this Constitution for runtime development guidance

**Version**: 1.0.0 | **Ratified**: 2025-09-20 | **Last Amended**: 2025-09-20
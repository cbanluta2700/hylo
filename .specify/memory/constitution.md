<!--
Sync Impact Report:
- Version change: none → 1.0.0 (initial constitution creation)
- New constitution with 5 core principles
- Added sections: Vercel Edge Compatibility, Code->Deploy->Debug Workflow
- Templates requiring updates: plan-template.md, spec-template.md, tasks-template.md (pending)
- Follow-up TODOs: None
-->

# Hylo Travel AI Constitution

## Core Principles

### I. Edge-First Architecture (NON-NEGOTIABLE)

All functionality MUST be compatible with Vercel Edge Runtime. No Node.js-specific APIs, no file system access, no synchronous blocking operations. Edge functions use Web APIs only. TypeScript strict mode enforced. All API endpoints export `{ runtime: 'edge' }` config and use standardized error handling with structured logging.

**Rationale**: Ensures global performance, cost efficiency, and deployment reliability while maintaining maximum compatibility with Vercel's infrastructure.

### II. Component Composition Pattern

React components follow strict composition pattern: BaseFormProps interface for all forms, shared types in centralized types.ts, validation through useFormValidation hook. Components are modular, reusable, and maintain single responsibility. Form state flows unidirectionally through parent components using onFormChange pattern.

**Rationale**: Maintains code consistency, enables rapid development through reusable patterns, and ensures predictable data flow for complex form interactions.

### III. User Experience Consistency

All form components use identical design tokens: `bg-form-box (#ece8de)` background, `rounded-[36px]` corners, `border-3 border-gray-200`, consistent padding and typography. Tailwind CSS classes enforce design system. No deviation from established visual patterns without justification.

**Rationale**: Creates cohesive user experience, maintains brand consistency, and reduces cognitive load through predictable interface patterns.

### IV. Code-Deploy-Debug Implementation Flow

Development follows rapid implementation cycle: CODE (implement feature) → DEPLOY (Vercel deployment) → DEBUG (test in production). No traditional TDD - instead validate through deployment testing. Phase-based implementation with immediate deployment feedback. Real-world validation over isolated testing.

**Rationale**: Optimized for existing codebase evolution, reduces development overhead, and provides immediate production feedback for faster iteration.

### V. Type-Safe Development with Zod Validation

All data structures use TypeScript with strict typing. Zod schemas for runtime validation at API boundaries. FormData interfaces centralized and comprehensive. React Hook Form integration with type-safe validation. No any types except for verified third-party integrations.

**Rationale**: Prevents runtime errors, enables confident refactoring, and provides excellent developer experience with autocompletion and type checking.

## Vercel Edge Compatibility Requirements

All code MUST comply with Vercel Edge Runtime limitations: No Node.js built-ins, no file system access, no native modules, streaming responses for large data. API endpoints use standardized error handling, CORS configuration, and request/response patterns. Environment variables accessed through secure patterns.

**Technology Stack Constraints**: React 18.3.1 + TypeScript 5.5.3 + Vite for frontend. Vercel Edge Functions for all API endpoints. Inngest 3.41.0 for async workflows. All dependencies must be Edge Runtime compatible.

## Code-Deploy-Debug Workflow Standards

**Implementation Phases**: 1) Implement (rapid feature development), 2) Debug (deployment testing), 3) Test (production validation). No isolated unit testing requirements - focus on integration testing through real deployment scenarios.

**Quality Gates**: Deployment must succeed, basic functionality verified in staging, error boundaries handle edge cases. Performance monitoring through Edge Runtime observability. User feedback incorporated through rapid iteration cycles.

**Progressive Enhancement**: Features work with basic functionality first, enhanced experience for modern browsers, graceful degradation for edge cases. All forms functional without JavaScript as baseline.

## Governance

This constitution supersedes all other development practices and architectural decisions. All feature implementations, code reviews, and architectural changes must verify compliance with these principles.

**Amendment Process**: Requires documentation of breaking changes, migration plan for existing code, and approval through formal review process. Version increments follow semantic versioning for constitutional changes.

**Enforcement**: All pull requests must pass constitutional compliance check. Complexity additions require explicit justification against simplicity principle. Use `.specify/templates/` for runtime development guidance and ensure all generated artifacts align with constitutional requirements.

**Version**: 1.0.0 | **Ratified**: 2025-09-23 | **Last Amended**: 2025-09-23

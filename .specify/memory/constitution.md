# Hylo Constitution

## Core Principles

### I. Edge-First Architecture

Every LLM interaction must be routed through Vercel Edge Functions for security and performance. No API keys or sensitive operations in client-side code. All AI orchestration happens at the edge with proper authentication and rate limiting.

### II. Multi-LLM Resilience

Implement intelligent routing with automatic fallbacks across Cerebras (complex tasks), Google Gemini (balanced operations), and Groq (specialized/code tasks). Every LLM call must have at least two fallback options. API key rotation is mandatory to maximize free tier usage.

### III. Observable AI Operations

All LLM interactions must be traced through LangSmith for debugging and optimization. Every API call requires structured logging including: model used, tokens consumed, latency, complexity rating, and fallback chain executed. Cost tracking per operation is non-negotiable.

### IV. Type-Safe Development

Strict TypeScript throughout the entire codebase. All API responses must have defined interfaces. Runtime validation with Zod for external data. No `any` types allowed except in exceptional, documented cases. LangChain.js types must be properly extended, not bypassed.

### V. Progressive Enhancement

Core functionality must work even if some LLM providers fail. UI must gracefully handle loading, error, and degraded states. Implement streaming responses where possible for better UX. Cache aggressively but invalidate intelligently.

### VI. Cost-Conscious Design

Free tier limits must be respected through intelligent caching, request batching, and complexity-based routing. Track usage per provider and implement automatic throttling before limits. Optimize prompts for token efficiency without sacrificing quality.

### VII. Security by Default

All environment variables must be properly scoped in Vercel. Implement rate limiting on all API routes. Input sanitization is mandatory for all user-provided content. CORS must be explicitly configured, never wildcarded.

## Development Standards

### Testing Requirements

- Unit tests for all utility functions and LLM routing logic
- Integration tests for API routes with mocked LLM responses
- E2E tests for critical user journeys
- Minimum 80% code coverage for non-UI logic
- All tests must pass before deployment

### Performance Targets

- Edge Function cold start: < 150ms
- LLM response streaming start: < 2 seconds
- Page load (LCP): < 2.5 seconds
- Bundle size: < 200KB for initial load
- API route timeout: 30 seconds max

### Deployment Pipeline

- All commits to main auto-deploy to production
- PR previews required for all changes
- Environment variables managed through Vercel Dashboard
- Rollback strategy must be documented
- Zero-downtime deployments only

## Quality Gates

### Code Review Checklist

- TypeScript types properly defined
- Error handling implemented
- Loading states present
- Fallback logic tested
- Environment variables not exposed
- LangChain tracing enabled
- Cost implications documented

### Pre-Deployment Verification

- All tests passing
- Bundle size analyzed
- Security scan completed
- API rate limits configured
- Monitoring alerts set up
- Documentation updated
- Changelog entry added

### Production Monitoring

- LangSmith traces reviewed daily
- API usage tracked per provider
- Error rates < 1%
- Response times within SLA
- Cost tracking automated
- User feedback loop active

## Governance

The Hylo Constitution supersedes all development practices and architectural decisions. Any amendments require:

1. Documentation of the proposed change
2. Impact analysis on existing code
3. Migration plan if breaking changes
4. Team consensus on implementation

All pull requests must verify constitutional compliance before merge. Violations must be justified with explicit exemption documentation. Use `/docs/DEVELOPMENT_GUIDE.md` for day-to-day development guidance.

Technical decisions should prioritize in order:

1. Security (no exposed keys)
2. Reliability (fallback chains)
3. Performance (edge optimization)
4. Cost (free tier management)
5. Developer Experience

**Version**: 1.0.0 | **Ratified**: 2025-09-16 | **Last Amended**: 2025-09-16

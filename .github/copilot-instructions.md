# GitHub Copilot Instructions for Hylo Travel AI Platform

## Constitution Reference

**This document follows the HYLO Travel AI Platform Constitution v2.0.0**
Focus on rapid implementation with post-production quality checks.

## Core Principles

### I. Edge-First Architecture (Constitutional)

- All API endpoints MUST run on Vercel Edge Runtime
- NO Node.js APIs - Edge Runtime only
- NO client-side API keys - server-side secrets management
- Progressive enhancement with graceful degradation

### II. Multi-Agent AI Orchestration (Constitutional)

- Implement pipeline: Data Gatherer → Information Gatherer → Planning Strategist → Content Compiler
- Use intelligent LLM provider routing based on complexity
- Maintain fallback chains: Cerebras → Gemini → Groq
- Integrate real-time web search for current information

### III. Rapid Development Focus

- **CODE FIRST**: Implement working solutions quickly
- Polish and optimize after functionality works
- Use existing patterns and components
- Save successful patterns for reuse

### IV. Observable AI Operations (Constitutional)

- Include LangSmith tracing in LLM calls
- Track costs per operation
- Monitor performance metrics
- Implement structured logging
- Add health monitoring endpoints

### V. Type-Safe Development (Constitutional)

- Use TypeScript with practical type safety
- Implement Zod schemas for API validation
- Share type definitions between client and server
- Fix type issues during polish phase

## TODO Checklist - Rapid Implementation

### MANDATORY: Simple TODO for Speed

When implementing ANY feature, use this streamlined checklist:

## TODO: [Feature Name] - Rapid Implementation

### Implementation Sprint

- [ ] Check existing patterns to copy
- [ ] Implement core functionality
- [ ] Ensure Edge Runtime compatibility
- [ ] Add basic error handling
- [ ] Make it work first

### Polish Phase (After Working)

- [ ] Add proper TypeScript types
- [ ] Implement Zod validation
- [ ] Add LangSmith tracing
- [ ] Optimize performance
- [ ] Clean up code structure

`

## Technical Standards (Simplified)

### Frontend Stack

typescript
// Use these tools - no debates
{
framework: "React 18+",
language: "TypeScript",
build: "Vite",
styling: "Tailwind CSS",
forms: "React Hook Form + Zod",
state: "useState/useReducer",
icons: "Lucide React"
}

### Backend Stack

typescript
// Edge Runtime essentials
{
runtime: "Vercel Edge Functions",
providers: ["Cerebras", "Gemini", "Groq"],
observability: "LangSmith",
validation: "Zod schemas",
search: "Web search service"
}

## Code Pattern Library

### 1. Edge Function Quick Template

typescript
// Copy-paste Edge function starter
export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
const corsHeaders = {
'Access-Control-Allow-Origin': '\*',
'Access-Control-Allow-Methods': 'POST, OPTIONS',
'Access-Control-Allow-Headers': 'Content-Type',
};

if (req.method === 'OPTIONS') {
return new Response(null, { status: 200, headers: corsHeaders });
}

try {
const input = await req.json();
// TODO: Add your logic here

    const result = {}; // Your implementation

    return new Response(JSON.stringify(result), {
      headers: corsHeaders,
    });

} catch (error) {
return new Response(
JSON.stringify({
error: error.message,
}),
{
status: 500,
headers: corsHeaders,
}
);
}
}

### 2. Component Quick Template

typescript
// Copy-paste React component starter
export function Component({ props }: Props) {
const [state, setState] = useState();

// TODO: Implement component logic

return <div className="p-4">{/_ Component UI _/}</div>;
}

### 3. Form Component Template

typescript
// React Hook Form quick start
export function FormComponent() {
const {
register,
handleSubmit,
formState: { errors },
} = useForm();

const onSubmit = (data) => {
// TODO: Handle form submission
};

return (
<form onSubmit={handleSubmit(onSubmit)}>
<input {...register('field')} />
<button type="submit">Submit</button>
</form>
);
}

## MCP Context Integration

### Using MCP for Code Snippets

When you need to save useful patterns:

## Save to MCP Context

1. Create snippet document in context
2. Tag with: #pattern #reusable #[component-type]
3. Include working example
4. Note any dependencies

### Example MCP Usage

typescript
// When finding a good pattern, save it:
// mcp:create-document "edge-function-with-streaming.md"
// Tag: #edge #streaming #pattern

// Later retrieve with:
// mcp:search "edge streaming"

## Current Enhancement Focus

### Active Work: UI/UX Improvements

Priority tasks for rapid implementation:

1. **Date Input Enhancement**

   - Add date picker library
   - Wire up to form
   - Polish styling later

2. **Budget Slider**

   - Fix tracking indicator
   - Add flexible budget toggle
   - Optimize after working

3. **Preference Modal**
   - Enable all checkboxes/radios
   - Add conditional fields
   - Polish UX after functional

## Development Commands

### Speed-Focused Workflow

bash

# Rapid development

npm run dev:full # Start coding immediately

# After implementation

npm run build # Check if it builds
npm run preview # Test the build

# Polish phase

npm run lint:fix # Auto-fix issues
npm run type-check # Fix type errors

## Implementation Priorities

### Speed First Checklist

## Rapid Dev Priority

1. [ ] Make it work
2. [ ] Make it correct
3. [ ] Make it fast
4. [ ] Make it pretty

## Common Quick Fixes

### Fast Solutions Library

## Quick Fix Patterns

### CORS Issues

- Add corsHeaders to all responses
- Handle OPTIONS requests

### Type Errors

- Use 'any' temporarily, fix in polish
- @ts-ignore for urgent deploys

### API Failures

- Add try-catch wrapper
- Return error with status 500

### State Issues

- Use useState for simple state
- Add useEffect for side effects

## AI Assistant Usage

### Rapid Request Format

Need: [specific feature]

Requirements:

- Edge Runtime compatible
- Basic error handling
- Return JSON response

No need for:

- Tests right now
- Perfect types
- Full validation

### Example Speed Request

Create API endpoint for user preferences:

- Accept user ID and preferences object
- Save to database
- Return success/error
- Edge function format

## Code Snippet Library

Save these patterns for reuse:

### API Client Pattern

typescript
// Reusable API caller
async function apiCall(endpoint: string, data: any) {
const response = await fetch(`/api/${endpoint}`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(data),
});
return response.json();
}

### Error Boundary Pattern

typescript
// Quick error handling wrapper
function withErrorHandling(fn: Function) {
return async (...args: any[]) => {
try {
return await fn(...args);
} catch (error) {
console.error(error);
return { error: error.message };
}
};
}

### State Management Pattern

typescript
// Simple state hook
function useSimpleState(initial: any) {
const [state, setState] = useState(initial);
const update = (updates: any) => setState({ ...state, ...updates });
return [state, update];
}

## Project Structure (Simplified)

src/
├── components/ # React components
├── services/ # Business logic
├── api/ # API client code
├── types/ # TypeScript types
├── hooks/ # Custom hooks
└── utils/ # Helpers

api/ # Edge functions
├── [endpoint]/ # API routes

**Version**: 2.1.0 | **Focus**: Rapid Implementation | **Updated**: 2025-01-20

---

_Remember: Ship working code fast, polish iteratively. Save good patterns to MCP context for reuse._

This refined version:

1. **Removes all testing requirements** - no test creation or review
2. **Emphasizes rapid code production** with "code first" mentality
3. **Simplifies TODO checklists** to focus on implementation
4. **Adds MCP context integration** for saving useful patterns
5. **Provides copy-paste templates** for common patterns
6. **Moves quality checks to polish phase** after functionality works
7. **Includes quick fix patterns** for common issues
8. **Streamlines requirements** to essentials only

The focus is now entirely on shipping working code quickly, with quality improvements happening after the feature is functional.This refined version:

1. **Removes all testing requirements** - no test creation or review
2. **Emphasizes rapid code production** with "code first" mentality
3. **Simplifies TODO checklists** to focus on implementation
4. **Adds MCP context integration** for saving useful patterns
5. **Provides copy-paste templates** for common patterns
6. **Moves quality checks to polish phase** after functionality works
7. **Includes quick fix patterns** for common issues
8. **Streamlines requirements** to essentials only

The focus is now entirely on shipping working code quickly, with quality improvements happening after the feature is functional.

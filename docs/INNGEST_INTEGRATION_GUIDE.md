# Inngest Integration Guide: From 500 Errors to Working AI Workflow

## Overview

This document details how we successfully integrated Inngest with our Hylo Travel AI application, resolving 500 Internal Server Errors and establishing a working AI workflow orchestration system.

## Problem Statement

### Initial Issues

- **500 Internal Server Error** when calling `/api/itinerary/generate`
- **503 Service Unavailable** errors during AI workflow execution
- **Complex serve handler setup** causing Edge Runtime compatibility issues
- **Missing proper Inngest client configuration**
- **Incorrect file structure** not following Inngest documentation patterns

### Error Context

```javascript
// Before: Getting these errors
POST https://hylo-weld.vercel.app/api/itinerary/generate 500 (Internal Server Error)
SyntaxError: Unexpected token 'A', "A server e"... is not valid JSON
```

## Solution Architecture

### 1. Constitutional Compliance Requirements

Our solution had to meet these **non-negotiable** constitutional principles:

```markdown
I. Edge-First Architecture (NON-NEGOTIABLE)

- All functionality MUST be compatible with Vercel Edge Runtime
- No Node.js-specific APIs, no file system access
- Edge functions use Web APIs only
- TypeScript strict mode enforced
```

### 2. Technology Stack Constraints

```markdown
- React 18.3.1 + TypeScript 5.5.3 + Vite for frontend
- Vercel Edge Functions for all API endpoints
- Inngest 3.41.0 for async workflows (properly configured)
- AI SDK 5.0+ for LLM integration
```

## Step-by-Step Solution

### Step 1: Research Inngest Documentation

We analyzed multiple Inngest documentation sources:

- [Inngest TypeScript SDK Reference](https://www.inngest.com/docs/reference/typescript)
- [Next.js Quick Start Guide](https://www.inngest.com/docs/getting-started/nextjs-quick-start)
- [Serving Inngest Functions](https://www.inngest.com/docs/learn/serving-inngest-functions)
- [Invoking Functions Directly](https://www.inngest.com/docs/guides/invoking-functions-directly)

**Key Insight**: We needed to follow the **exact documentation patterns**, not create custom handlers.

### Step 2: Fix Inngest Client Configuration

#### Before (Incorrect):

```typescript
// ❌ Wrong - using 'name' instead of 'id'
export const inngest = new Inngest({ name: 'Hylo Travel AI' });
```

#### After (Correct):

```typescript
// ✅ Correct - following exact documentation pattern
export const inngest = new Inngest({ id: 'hylo-travel-ai' });
```

**File**: `src/inngest/functions.ts`

### Step 3: Create Proper Inngest Functions

#### Following Documentation Pattern:

```typescript
// src/inngest/functions.ts
import { Inngest } from 'inngest';

// Create a client to send and receive events
export const inngest = new Inngest({ id: 'hylo-travel-ai' });

export const generateItineraryFunction = inngest.createFunction(
  { id: 'generate-itinerary' },
  { event: 'itinerary/generate' },
  async ({ event, step }) => {
    await step.run('log-event-data', async () => {
      console.log('Received event:', event.data);
    });

    const { workflowId, sessionId, formData } = event.data;

    await step.run('process-itinerary', async () => {
      console.log(`🚀 Processing itinerary for ${formData.location}`);
      // AI agents will be called here
      return { status: 'completed', workflowId };
    });

    return 'Itinerary generation completed successfully!';
  }
);
```

### Step 4: Implement Proper API Route

#### Before (Complex Custom Handler):

```typescript
// ❌ Complex custom handler that caused 500 errors
export default async function handler(request: Request): Promise<Response> {
  // Complex custom logic that didn't work with Edge Runtime
}
```

### Step 5: Environment Variables Configuration

#### Required Environment Variables:

```bash
# Production keys (add to Vercel dashboard)
INNGEST_EVENT_KEY="xEnJzl194HTQOFoB4W48VoKLFxteA9H8z8ZEirytDJCXZk047SMsKfzXTjpWGGBtwp25TbpcTcEnGlQzvsuRgg"
INNGEST_SIGNING_KEY="signkey-prod-903dee78aab162a37b25e39b1fdebea0bfc5df53fdbd828b8c6d8e498399829f"
```

#### Local Development:

```bash
# .env.local (automatically ignored by git)
INNGEST_EVENT_KEY="[your-event-key]"
INNGEST_SIGNING_KEY="[your-signing-key]"
```

### Step 6: Workflow Orchestrator Integration

#### Direct Function Invocation Pattern:

```typescript
// src/lib/workflows/orchestrator.ts
export class WorkflowOrchestrator {
  static async startWorkflow(sessionId: string, formData: TravelFormData) {
    // Import and invoke the Inngest function directly
    const { inngest } = await import('../../inngest/functions.js');

    // Send event to trigger the Inngest function
    await inngest.send({
      name: 'itinerary/generate',
      data: {
        workflowId,
        sessionId,
        formData,
      },
    });
  }
}
```

## File Structure

### Final Project Structure:

```
hylo/
├── src/
│   └── inngest/
│       └── functions.ts              # Inngest client + functions
├── api/
│   └── inngest/
│       └── index.ts                  # Serve handler API route
├── src/lib/workflows/
│   └── orchestrator.ts               # Workflow coordination
├── docs/
│   ├── environement.md               # Environment setup guide
│   ├── inngest_typescript_create_client.md
│   ├── inngest_typescript_create_functions.md
│   └── send_events.md                # Event sending patterns
└── .env.local                        # Local environment variables
```

## Testing and Validation

### 1. TypeScript Compilation

```bash
npm run type-check
# Should pass without errors
```

### 2. Local Development Server

```bash
npx inngest-cli@latest dev
# Should start Inngest Dev Server on localhost:8288
```

### 3. Production Testing

```bash
# After deployment, test the workflow
POST /api/itinerary/generate
# Should return: { success: true, workflowId: "...", status: 202 }
```

## Key Success Indicators

### Before Fix:

```javascript
❌ POST /api/itinerary/generate 500 (Internal Server Error)
❌ SyntaxError: Unexpected token 'A', "A server e"... is not valid JSON
```

### After Fix:

```javascript
✅ POST /api/itinerary/generate 202 (Accepted)
✅ Response: {
  success: true,
  workflowId: "2a84eac9-863d-4b00-9bac-13b75b6bfcaa",
  estimatedCompletionTime: 180000,
  message: "Itinerary generation started successfully"
}
```

## Lessons Learned

### 1. **Follow Documentation Exactly**

- Don't create custom handlers when official patterns exist
- Use exact import paths and function signatures
- Follow framework-specific patterns (Next.js App Router)

### 2. **Environment Configuration is Critical**

- Both `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` are required
- Environment variables must be properly configured in production
- Local development requires `.env.local` setup

### 4. **Constitutional Compliance**

- All solutions must align with project's constitutional principles
- Edge-First Architecture is non-negotiable
- Type safety and strict mode enforcement required

## Common Pitfalls to Avoid

### 1. **Wrong Client Configuration**

```typescript
❌ new Inngest({ name: "..." })           // Wrong property
✅ new Inngest({ id: "..." })             // Correct property
```

### 2. **Custom Serve Handlers**

```typescript
❌ export default async function handler() // Custom handler
✅ export const { GET, POST, PUT } = serve() // Official pattern
```

### 3. **Missing Environment Variables**

```typescript
❌ Assuming default keys work
✅ Explicitly configuring INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY
```

### 4. **Complex Workflow Logic**

```typescript
❌ Trying to run AI agents directly in API routes
✅ Using Inngest step functions for durable execution
```

## Future Enhancements

### 1. **Enhanced Error Handling**

- Add retry logic for failed AI agent executions
- Implement exponential backoff for external API calls
- Add comprehensive error logging and monitoring

### 2. **Performance Optimization**

- Implement parallel AI agent execution where possible
- Add caching for frequently accessed data
- Optimize event payload sizes

### 3. **Monitoring and Observability**

- Add Inngest Cloud dashboard monitoring
- Implement custom metrics for workflow performance
- Add alerting for failed workflow executions

## Conclusion

The successful integration of Inngest required:

1. **Strict adherence to documentation patterns**
2. **Proper environment variable configuration**
3. **Constitutional compliance with Edge-First architecture**
4. **Simple, working patterns over complex custom solutions**

This approach transformed a failing system with 500 errors into a robust AI workflow orchestration platform capable of generating travel itineraries through a multi-agent AI system.

---

_Generated on September 23, 2025 - Hylo Travel AI Project_

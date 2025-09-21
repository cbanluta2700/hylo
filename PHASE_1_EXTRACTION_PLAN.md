# 🔧 PHASE 1: SHARED UTILITIES & EXTRACTION PLAN

**Date**: September 21, 2025  
**Analysis**: Identification of reusable logic and extraction strategy  
**Purpose**: Plan for converting HTTP handlers to Inngest functions

---

## 🛠️ **SHARED UTILITIES ANALYSIS**

### **CRITICAL SHARED LOGIC (api/agents/shared-handler.ts):**

#### **HTTP Handler Factory (286 lines):**

```typescript
// MAIN FUNCTION TO EXTRACT:
export function createAgentHandler(config: AgentEndpointConfig) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    // 1. Method validation (POST only)
    // 2. Request body parsing
    // 3. Input validation using config.validateRequest()
    // 4. Agent input preparation
    // 5. Agent processing with config.agent.processRequest()
    // 6. Response formatting
    // 7. Error handling with try/catch
    // 8. Timing metrics
  };
}

// INTERFACES TO EXTRACT:
interface BaseAgent {
  processRequest(input: AgentInput): Promise<AgentResponse>;
}
interface AgentResponse {
  success;
  output;
  error;
  metadata;
}
interface AgentEndpointConfig {
  agent;
  endpoint;
  validateRequest;
}
```

#### **Validation Functions (4 specialized validators):**

```typescript
export function validateArchitectRequest(formData: any, context: any): ValidationError | null;
export function validateGathererRequest(formData: any, context: any): ValidationError | null;
export function validateSpecialistRequest(formData: any, context: any): ValidationError | null;
export function validateFormPutterRequest(formData: any, context: any): ValidationError | null;
```

### **EXTRACTED UTILITIES TARGET:**

#### **New Location: `src/lib/inngest/agent-utilities.ts`**

```typescript
// Convert HTTP handler to Inngest step wrapper
export function createInngestAgentStep(agent: BaseAgent, stepName: string) {
  return async (input: AgentInput) => {
    const startTime = Date.now();

    try {
      const result = await agent.processRequest(input);

      return {
        ...result,
        metadata: {
          ...result.metadata,
          processingTime: Date.now() - startTime,
          stepName,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AGENT_ERROR',
          message: error.message,
          details: error,
        },
        metadata: {
          processingTime: Date.now() - startTime,
          stepName,
          failed: true,
        },
      };
    }
  };
}
```

---

## 📊 **WORKFLOW ORCHESTRATION UTILITIES**

### **Current Orchestration Logic (api/itinerary/generate.ts):**

#### **Sequential Agent Execution Pattern:**

```typescript
// LOGIC TO EXTRACT (Approx. 150 lines):
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Request validation
  // 2. Smart query generation
  // 3. Sequential agent calls:
  //    - itineraryArchitect(input)
  //    - webInformationGatherer(input)
  //    - informationSpecialist(input)
  //    - formPutter(input)
  // 4. Result aggregation
  // 5. Response formatting
}
```

#### **Target: Inngest Workflow Pattern:**

```typescript
// New Location: Enhanced api/inngest.ts
export const itineraryWorkflow = inngest.createFunction(
  { id: 'itinerary-generation' },
  { event: 'itinerary.generate' },
  async ({ event, step }) => {
    const { formData, sessionId, requestId } = event.data;

    // Generate smart queries (parallel execution possible)
    const smartQueries = await step.run('generate-queries', async () => {
      return generateSmartQueries(formData);
    });

    // Agent execution (can be parallel or sequential based on needs)
    const [architectResult, gathererResult] = await Promise.all([
      step.run('architect-agent', () =>
        createInngestAgentStep(
          itineraryArchitect,
          'architect'
        )({
          formData,
          context: { sessionId, smartQueries, stage: 'architect' },
        })
      ),
      step.run('gatherer-agent', () =>
        createInngestAgentStep(
          webInformationGatherer,
          'gatherer'
        )({
          formData,
          context: { sessionId, smartQueries, stage: 'gatherer' },
        })
      ),
    ]);

    // Specialist depends on previous results
    const specialistResult = await step.run('specialist-agent', () =>
      createInngestAgentStep(
        informationSpecialist,
        'specialist'
      )({
        formData,
        context: {
          sessionId,
          smartQueries,
          architectResult: architectResult.output,
          gathererResult: gathererResult.output,
          stage: 'specialist',
        },
      })
    );

    // Final formatting
    const finalResult = await step.run('form-putter-agent', () =>
      createInngestAgentStep(
        formPutter,
        'form-putter'
      )({
        formData,
        context: {
          sessionId,
          architectResult: architectResult.output,
          gathererResult: gathererResult.output,
          specialistResult: specialistResult.output,
          stage: 'form-putter',
        },
      })
    );

    return {
      success: true,
      sessionId,
      requestId,
      itinerary: finalResult.output,
      metadata: {
        totalProcessingTime:
          architectResult.metadata.processingTime +
          gathererResult.metadata.processingTime +
          specialistResult.metadata.processingTime +
          finalResult.metadata.processingTime,
        agentsUsed: ['architect', 'gatherer', 'specialist', 'form-putter'],
        timestamp: new Date().toISOString(),
      },
    };
  }
);
```

---

## 🌐 **STATE MANAGEMENT UTILITIES**

### **Current State Query Logic (api/itinerary/status.ts):**

```typescript
// LOGIC TO EXTRACT (Approx. 80 lines):
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Query parameter extraction
  // 2. State manager querying
  // 3. Progress calculation
  // 4. Response formatting
}
```

### **Target: Inngest State Queries:**

```typescript
// Enhanced api/itinerary/status.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { requestId, sessionId } = req.query;

  try {
    // Query Inngest state directly
    const workflowRun = await inngest.getWorkflowRun(requestId as string);

    return res.status(200).json({
      success: true,
      status: workflowRun.status,
      progress: calculateProgress(workflowRun.steps),
      currentStage: getCurrentStage(workflowRun.steps),
      results: workflowRun.output,
      error: workflowRun.error,
      metadata: {
        startTime: workflowRun.startedAt,
        lastUpdate: workflowRun.updatedAt,
        stepsCompleted: workflowRun.steps.filter((s) => s.status === 'completed').length,
        totalSteps: workflowRun.steps.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'STATE_QUERY_ERROR',
        message: 'Failed to query workflow state',
        details: error.message,
      },
    });
  }
}
```

---

## 📡 **WEBSOCKET INTEGRATION UTILITIES**

### **Current WebSocket Logic (api/itinerary/live.ts):**

```typescript
// LOGIC TO ENHANCE (Keep endpoint, improve Inngest integration):
// 1. WebSocket connection management
// 2. Inngest event listening
// 3. Progress broadcasting
// 4. Connection state tracking
```

### **Target: Inngest + WebSocket Integration:**

```typescript
// Enhanced api/itinerary/live.ts with better Inngest integration
import { inngest } from '../../src/lib/inngest/client';

// Add Inngest event listeners for progress updates
inngest.on('itinerary.step.started', (event) => {
  broadcastToConnectedClients(event.sessionId, {
    type: 'progress',
    step: event.stepName,
    status: 'started',
    progress: calculateStepProgress(event.stepName),
  });
});

inngest.on('itinerary.step.completed', (event) => {
  broadcastToConnectedClients(event.sessionId, {
    type: 'progress',
    step: event.stepName,
    status: 'completed',
    progress: calculateStepProgress(event.stepName),
    result: event.output,
  });
});
```

---

## 🔧 **INFRASTRUCTURE CONSOLIDATION UTILITIES**

### **Health Check Consolidation:**

#### **Current: Multiple Endpoints**

```typescript
api/health/system.ts  → System health checks
api/health/status.ts  → Detailed service status
```

#### **Target: Single Consolidated Endpoint**

```typescript
// New api/system.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { type = 'health' } = req.query;

  switch (type) {
    case 'health':
      return systemHealthCheck(req, res);
    case 'status':
      return detailedStatusCheck(req, res);
    case 'dns':
      return dnsVerificationCheck(req, res);
    default:
      return systemHealthCheck(req, res);
  }
}
```

### **Cache Operations Consolidation:**

#### **Current: Vector-specific endpoint**

```typescript
api/cache/vector.ts → Vector operations only
```

#### **Target: General cache endpoint**

```typescript
// New api/cache.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { operation, type = 'vector' } = req.body;

  switch (type) {
    case 'vector':
      return handleVectorOperation(operation, req.body);
    case 'session':
      return handleSessionCache(operation, req.body);
    default:
      return handleVectorOperation(operation, req.body);
  }
}
```

---

## 📋 **EXTRACTION IMPLEMENTATION PLAN**

### **PHASE 2.1: Agent Utilities Extraction**

```typescript
// Create: src/lib/inngest/agent-utilities.ts
✅ Extract createAgentHandler logic → createInngestAgentStep
✅ Extract validation functions → internal utilities
✅ Extract interfaces → type definitions
✅ Add error handling wrappers
✅ Add timing and metrics
```

### **PHASE 2.2: Workflow Consolidation**

```typescript
// Enhance: api/inngest.ts
✅ Merge logic from api/itinerary/generate.ts
✅ Merge logic from api/inngest/route.ts
✅ Create master itinerary workflow function
✅ Add parallel execution patterns
✅ Add progress tracking integration
```

### **PHASE 2.3: State Management Enhancement**

```typescript
// Update: api/itinerary/status.ts
✅ Replace workflowStateManager with Inngest state queries
✅ Add direct Inngest workflow run queries
✅ Enhance progress calculation
✅ Maintain API compatibility
```

### **PHASE 3: Infrastructure Consolidation**

```typescript
// Create: api/system.ts
✅ Consolidate health check endpoints
✅ Add DNS verification
✅ Add query-based routing

// Create: api/cache.ts
✅ Consolidate vector operations
✅ Add general caching support
✅ Maintain backward compatibility
```

---

## 🎯 **SHARED UTILITY BENEFITS**

### **CODE REDUCTION:**

- **Agent endpoints**: 4 endpoints → 0 (logic moves to Inngest)
- **Workflow handlers**: 286 lines of shared logic → reusable utilities
- **Duplicate imports**: 10+ duplicate dependencies → single workflow
- **Error handling**: 4 identical patterns → 1 shared implementation

### **PERFORMANCE GAINS:**

- **Cold starts**: Multiple function cold starts → single workflow execution
- **Memory efficiency**: Shared agent instances → better resource utilization
- **Request latency**: HTTP calls between functions → internal function calls
- **Error resilience**: Individual retry logic → Inngest built-in retry

### **MAINTAINABILITY:**

- **Single source of truth**: All agent orchestration in one workflow
- **Consistent error handling**: Shared patterns across all agents
- **Centralized monitoring**: Single workflow to monitor vs 4 separate endpoints
- **Type safety**: Shared interfaces ensure consistency

---

## ✅ **PHASE 1 COMPLETE: EXTRACTION PLAN READY**

### **P1.3 COMPLETE**: Shared utilities identified

### **P1.4 COMPLETE**: Extraction plan created

**Total Progress**: 8/8 Phase 1 tasks ✅ **COMPLETE**

### **MAJOR DISCOVERIES:**

1. **286 lines** of reusable HTTP handler logic in shared-handler.ts
2. **Triple duplication** in Inngest-related endpoints (generate, inngest, inngest/route)
3. **Clear path** for agent consolidation into single workflow
4. **Infrastructure consolidation** opportunities (health + cache endpoints)

### **READY FOR PHASE 2**: 🚀 **INNGEST CORE SETUP**

**Next Steps**: Begin creating Inngest foundation and migrating agents

**Status**: 🟢 **PHASE 1 SUCCESS** - Comprehensive extraction plan ready

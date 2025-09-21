# 📊 PHASE 1: FUNCTION EXPORTS DOCUMENTATION

**Date**: September 21, 2025  
**Analysis**: Complete documentation of all 16 API endpoint exports  
**Purpose**: Understand current architecture before Inngest migration

---

## 🤖 **AGENT ENDPOINTS (4 Functions)**

### **1. `/api/agents/architect.ts`**

- **Default Export**: `createAgentHandler()` result
- **Method**: POST
- **Dependencies**:
  - `src/lib/agents/architect.ts` → `itineraryArchitect`
  - `./shared-handler.ts` → `createAgentHandler`, `validateArchitectRequest`
- **Request Interface**: `{ formData: EnhancedFormData, context: { sessionId, smartQueries, stage } }`
- **Response Interface**: `AgentResponse`
- **Logic to Extract**: Request validation, agent invocation, response formatting

### **2. `/api/agents/gatherer.ts`**

- **Default Export**: `createAgentHandler()` result
- **Method**: POST
- **Dependencies**:
  - `src/lib/agents/gatherer.ts` → `webInformationGatherer`
  - `./shared-handler.ts` → `createAgentHandler`, `validateGathererRequest`
- **Request Interface**: `{ formData: EnhancedFormData, context: { sessionId, smartQueries, stage } }`
- **Response Interface**: `AgentResponse`
- **Logic to Extract**: Search orchestration, web information gathering

### **3. `/api/agents/specialist.ts`**

- **Default Export**: `createAgentHandler()` result
- **Method**: POST
- **Dependencies**:
  - `src/lib/agents/specialist.ts` → `informationSpecialist`
  - `./shared-handler.ts` → `createAgentHandler`, `validateSpecialistRequest`
- **Request Interface**: `{ formData: EnhancedFormData, context: { sessionId, smartQueries, stage } }`
- **Response Interface**: `AgentResponse`
- **Logic to Extract**: Cultural insights, specialist analysis

### **4. `/api/agents/shared-handler.ts`** ⚡ **UTILITY**

- **Exports**: `createAgentHandler`, `validateArchitectRequest`, `validateGathererRequest`, etc.
- **Purpose**: Shared HTTP handling logic for all agents
- **Key Functions**:
  - `createAgentHandler({ agent, endpoint, validateRequest })`
  - Request validation functions
  - Error handling middleware
  - Response formatting
- **Logic to Extract**: ALL - becomes internal Inngest utilities

---

## 🗂️ **CORE API ENDPOINTS (4 Functions)**

### **5. `/api/itinerary/generate.ts`**

- **Default Export**: Next.js API handler function
- **Method**: POST
- **Dependencies**:
  - `src/lib/workflows/itinerary-workflow.ts` → `intelligentItineraryWorkflow`
  - `src/lib/smart-queries.ts` → `generateSmartQueries`
- **Request Interface**: `{ formData: EnhancedFormData, sessionId, requestId }`
- **Response Interface**: `{ success: boolean, data: { sessionId, requestId, status }, metadata }`
- **Logic to Extract**: Workflow triggering (convert to Inngest events)

### **6. `/api/itinerary/status.ts`**

- **Default Export**: Next.js API handler function
- **Method**: GET
- **Dependencies**:
  - `src/lib/workflows/state-manager.ts` → `workflowStateManager`
- **Query Params**: `requestId`, `sessionId`
- **Response Interface**: `{ status, progress, stage, results, error }`
- **Logic to Extract**: State querying (convert to Inngest state queries)

### **7. `/api/itinerary/update.ts`**

- **Default Export**: Next.js API handler function
- **Method**: PUT
- **Dependencies**:
  - `src/lib/workflows/form-workflow.ts` → `formUpdateWorkflow`
- **Request Interface**: `{ requestId, updates, formData }`
- **Response Interface**: `{ success, updatedItinerary, metadata }`
- **Logic to Extract**: Update processing (convert to Inngest events)

### **8. `/api/itinerary/live.ts`**

- **Default Export**: WebSocket handler function
- **Method**: WebSocket
- **Dependencies**:
  - `src/lib/progress-tracker.ts` → `progressTracker`
  - `src/lib/message-router.ts` → `messageRouter`
- **Protocol**: WebSocket with custom message types
- **Logic to Extract**: Connection management, progress broadcasting

---

## 🔄 **WORKFLOW ENDPOINTS (4 Functions)**

### **9. `/api/inngest.ts`**

- **Default Export**: Inngest serve handler
- **Method**: GET/POST/PUT
- **Dependencies**:
  - `src/lib/workflows/inngest-config.ts` → `inngest` client
  - All workflow functions
- **Current Role**: Inngest webhook handler
- **Logic to Extract**: Expand to include all agent functions

### **10. `/api/inngest/route.ts`**

- **Default Export**: Inngest routing handler
- **Method**: GET/POST
- **Dependencies**:
  - `../inngest.ts` → routing logic
- **Purpose**: Additional Inngest routing
- **Logic to Extract**: Merge into main inngest.ts

### **11. `/api/form/updates.ts`**

- **Default Export**: Form update handler
- **Method**: POST
- **Dependencies**:
  - `src/lib/workflows/form-workflow.ts` → `formUpdateWorkflow`
- **Request Interface**: `{ sessionId, formData, updates }`
- **Response Interface**: `{ success, processedUpdates }`
- **Logic to Extract**: Form processing (keep as separate endpoint)

### **12. `/api/search/providers.ts`**

- **Default Export**: Search orchestration handler
- **Method**: POST
- **Dependencies**:
  - `src/lib/search-orchestrator.ts` → `searchOrchestrator`
  - All provider implementations
- **Request Interface**: `{ queries: SmartQuery[], providers: string[] }`
- **Response Interface**: `{ results: SearchResponse[], metadata }`
- **Logic to Extract**: Move to Inngest gatherer agent

---

## 💾 **INFRASTRUCTURE ENDPOINTS (4 Functions)**

### **13. `/api/cache/vector.ts`**

- **Default Export**: Vector operations handler
- **Method**: POST
- **Dependencies**:
  - `src/lib/vector/upstash-client.ts` → `UpstashVectorClient`
  - `src/lib/vector/similarity-search.ts` → similarity functions
- **Request Interface**: `{ operation: 'store'|'query', data, metadata }`
- **Response Interface**: `{ success, results, similarity_scores }`
- **Logic to Extract**: Consolidate to `/api/cache.ts`

### **14. `/api/health/system.ts`**

- **Default Export**: System health handler
- **Method**: GET
- **Dependencies**:
  - `src/api/utils/healthChecks.ts` → health check functions
- **Response Interface**: `{ status: 'healthy'|'degraded', services: ServiceStatus[] }`
- **Logic to Extract**: Consolidate to `/api/system.ts`

### **15. `/api/health/status.ts`**

- **Default Export**: Detailed status handler
- **Method**: GET
- **Dependencies**:
  - Various service status checks
- **Response Interface**: `{ timestamp, services, metrics, alerts }`
- **Logic to Extract**: Consolidate to `/api/system.ts`

### **16. `/api/dns/verification.ts`** (Missing from current files)

- **Status**: Referenced in plan but not found in current implementation
- **Expected**: DNS verification for deployment
- **Action**: May need to create or is consolidated elsewhere

---

## 📋 **KEY DEPENDENCIES IDENTIFIED**

### **SHARED UTILITIES (Keep):**

```typescript
// Agent Libraries (move to Inngest functions)
src/lib/agents/architect.ts
src/lib/agents/gatherer.ts
src/lib/agents/specialist.ts
src/lib/agents/form-putter.ts

// Workflow Libraries (enhance for Inngest)
src/lib/workflows/inngest-config.ts
src/lib/workflows/itinerary-workflow.ts
src/lib/workflows/state-manager.ts

// Search & Vector (keep as utilities)
src/lib/search-orchestrator.ts
src/lib/vector/upstash-client.ts
src/lib/providers/ (all providers)
```

### **HTTP HANDLERS (Extract & Convert):**

```typescript
// Shared Agent Logic
api/agents/shared-handler.ts → Internal Inngest utilities

// Workflow Triggering
api/itinerary/generate.ts → Inngest event sending
api/itinerary/update.ts → Inngest event sending

// State Management
api/itinerary/status.ts → Inngest state querying
api/itinerary/live.ts → WebSocket + Inngest progress
```

---

## 🎯 **EXTRACTION STRATEGY**

### **PHASE 2 PRIORITIES:**

1. **Agent Handler Logic** → Inngest function wrappers
2. **Workflow Triggering** → Inngest event patterns
3. **State Management** → Inngest state queries
4. **Progress Tracking** → Inngest + WebSocket integration

### **CONSOLIDATION PLAN:**

- **Agents**: 4 endpoints → 1 Inngest workflow
- **Infrastructure**: 4 endpoints → 2 consolidated endpoints
- **Workflows**: 4 endpoints → 1 main Inngest handler

---

## ✅ **P1.1 COMPLETE: FUNCTION EXPORTS DOCUMENTED**

**Next Steps**:

- P1.2: Map dependencies between files
- P1.3: Identify shared utilities
- P1.4: Create extraction plan

**Status**: 🟢 **ON TRACK** - Detailed analysis complete

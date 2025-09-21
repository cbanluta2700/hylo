# 🚀 INNGEST ARCHITECTURE REFACTORING PLAN

**Date**: September 21, 2025  
**Objective**: Transform 16-function architecture to optimal 8-function Inngest-based architecture  
**Target**: Vercel deployment compliance with proper Inngest workflow patterns

---

## 📊 **1. CURRENT WORKSPACE FILE ANALYSIS**

### **EXISTING API STRUCTURE (16 Functions)**

**Core API Functions (4):**

```
api/itinerary/generate.ts     ✅ KEEP (Entry point)
api/itinerary/status.ts       ✅ KEEP (Status queries)
api/itinerary/update.ts       ✅ KEEP (Update triggers)
api/itinerary/live.ts         ✅ KEEP (WebSocket)
```

**Agent Functions (4) - TO BE REFACTORED:**

```
api/agents/architect.ts       ❌ DELETE (Move to Inngest)
api/agents/gatherer.ts        ❌ DELETE (Move to Inngest)
api/agents/specialist.ts      ❌ DELETE (Move to Inngest)
api/agents/shared-handler.ts  ❌ DELETE (Move to Inngest utilities)
```

**Workflow Functions (4) - TO BE CONSOLIDATED:**

```
api/inngest.ts                🔄 TRANSFORM (Main workflow handler)
api/inngest/route.ts          ❌ DELETE (Merge into inngest.ts)
api/form/updates.ts           ✅ KEEP (External form processing)
api/search/providers.ts       ❌ DELETE (Move to Inngest)
```

**Infrastructure Functions (4) - TO BE CONSOLIDATED:**

```
api/cache/vector.ts           🔄 CONSOLIDATE (Move to api/cache.ts)
api/health/system.ts          🔄 CONSOLIDATE (Move to api/system.ts)
api/health/status.ts          🔄 CONSOLIDATE (Move to api/system.ts)
api/dns/verification.ts       🔄 CONSOLIDATE (Move to api/system.ts)
```

### **SUPPORTING LIBRARY STRUCTURE (86 Files)**

**Agent Libraries (Will be used in Inngest):**

```
src/lib/agents/architect.ts      🔄 KEEP (Use in Inngest functions)
src/lib/agents/gatherer.ts       🔄 KEEP (Use in Inngest functions)
src/lib/agents/specialist.ts     🔄 KEEP (Use in Inngest functions)
src/lib/agents/form-putter.ts    🔄 KEEP (Use in Inngest functions)
src/lib/agent-prompts.ts         🔄 KEEP (Agent utilities)
```

**Workflow Libraries:**

```
src/lib/workflows/inngest-config.ts      🔄 KEEP (Main config)
src/lib/workflows/itinerary-workflow.ts  🔄 TRANSFORM (Main workflow)
src/lib/workflows/form-workflow.ts       🔄 KEEP
src/lib/workflows/synthesis.ts           🔄 KEEP
src/lib/workflows/state-manager.ts       🔄 KEEP
```

**Search & Vector Libraries (Keep as utilities):**

```
src/lib/providers/             ✅ KEEP (Used by Inngest functions)
src/lib/search-orchestrator.ts ✅ KEEP (Used by Inngest functions)
src/lib/vector/                ✅ KEEP (Used by Inngest functions)
```

---

## 🗑️ **2. FILES TO BE DELETED**

### **API ENDPOINTS TO DELETE (8 files):**

```
❌ api/agents/architect.ts
❌ api/agents/gatherer.ts
❌ api/agents/specialist.ts
❌ api/agents/shared-handler.ts
❌ api/inngest/route.ts
❌ api/search/providers.ts
❌ api/cache/vector.ts
❌ api/health/system.ts
❌ api/health/status.ts
❌ api/dns/verification.ts
```

### **REFACTORING STRATEGY FOR DELETED FILES:**

#### **Agent Endpoints → Inngest Functions**

- **Logic extracted** from HTTP handlers
- **Converted to** Inngest function format
- **Integrated into** single `/api/inngest.ts` workflow

#### **Infrastructure Endpoints → Consolidated**

- **Health/DNS logic** moved to `/api/system.ts`
- **Cache logic** moved to `/api/cache.ts`
- **HTTP handlers** simplified to single consolidated endpoint

---

## 📁 **3. NEW FOLDER STRUCTURE GUIDELINES**

### **OPTIMAL 8-FUNCTION API STRUCTURE:**

```
api/
├── itinerary/
│   ├── generate.ts           # Entry point (triggers Inngest)
│   ├── status.ts            # Status queries
│   ├── update.ts            # Update triggers
│   └── live.ts              # WebSocket updates
├── inngest.ts               # 🔥 MAIN WORKFLOW (all agents here)
├── form/
│   └── updates.ts           # Form processing
├── cache.ts                 # 🔄 NEW: Consolidated caching
├── system.ts                # 🔄 NEW: Health/DNS consolidated
└── tsconfig.json
```

### **SUPPORTING LIBRARY STRUCTURE:**

```
src/lib/
├── inngest/                 # 🔥 INNGEST CORE
│   ├── client.ts           # Inngest client config
│   ├── functions.ts        # All workflow functions
│   └── events.ts           # Event type definitions
├── agents/                 # AI AGENTS (used by Inngest)
│   ├── architect.ts
│   ├── gatherer.ts
│   ├── specialist.ts
│   └── form-putter.ts
├── workflows/              # WORKFLOW UTILITIES
│   ├── orchestration.ts   # Main workflow logic
│   ├── progress.ts        # Progress tracking
│   └── state-manager.ts   # State management
├── providers/             # SEARCH PROVIDERS
├── vector/                # VECTOR OPERATIONS
├── formatting/           # OUTPUT FORMATTING
└── utils/                # SHARED UTILITIES
```

---

## 🎯 **4. IMPLEMENTATION PHASES**

### **PHASE 1: PREPARATION & ANALYSIS** (Day 1)

**P1.1 - File Inventory & Backup**

- [ ] Create backup of current implementation
- [ ] Document all existing function exports
- [ ] Map dependencies between files
- [ ] Identify shared utilities

**P1.2 - Library Extraction**

- [ ] Extract reusable logic from agent endpoints
- [ ] Extract reusable logic from infrastructure endpoints
- [ ] Create utility functions for common operations
- [ ] Ensure all dependencies are mapped

### **PHASE 2: INNGEST CORE SETUP** (Day 2)

**P2.1 - Create Inngest Foundation**

- [ ] Create `src/lib/inngest/client.ts` with proper configuration
- [ ] Create `src/lib/inngest/events.ts` with event taxonomy
- [ ] Create `src/lib/inngest/functions.ts` structure

**P2.2 - Agent Migration to Inngest**

- [ ] Convert `architect` endpoint → Inngest function
- [ ] Convert `gatherer` endpoint → Inngest function
- [ ] Convert `specialist` endpoint → Inngest function
- [ ] Convert `form-putter` endpoint → Inngest function

**P2.3 - Main Workflow Creation**

- [ ] Create master `itineraryWorkflow` function
- [ ] Implement parallel agent execution
- [ ] Add progress tracking integration
- [ ] Add error handling and retries

### **PHASE 3: ENDPOINT CONSOLIDATION** (Day 3)

**P3.1 - Infrastructure Consolidation**

- [ ] Create `/api/system.ts` (health + DNS)
- [ ] Create `/api/cache.ts` (vector operations)
- [ ] Test consolidated endpoints
- [ ] Remove old infrastructure endpoints

**P3.2 - Workflow Integration**

- [ ] Update `/api/inngest.ts` with all functions
- [ ] Remove `/api/inngest/route.ts`
- [ ] Remove `/api/search/providers.ts`
- [ ] Integrate search orchestration into Inngest

**P3.3 - Entry Point Updates**

- [ ] Update `/api/itinerary/generate.ts` to use events
- [ ] Update form endpoints to use events
- [ ] Update status endpoints to query Inngest state

### **PHASE 4: TESTING & VALIDATION** (Day 4)

**P4.1 - Local Development Testing**

- [ ] Set up Inngest Dev Server
- [ ] Test all workflow functions locally
- [ ] Validate event flow end-to-end
- [ ] Test error scenarios and retries

**P4.2 - Integration Testing**

- [ ] Test client-side integration
- [ ] Validate WebSocket updates
- [ ] Test parallel agent execution
- [ ] Verify progress tracking

**P4.3 - Performance Validation**

- [ ] Benchmark new vs old architecture
- [ ] Validate Vercel deployment limits
- [ ] Test cold start performance
- [ ] Validate memory usage

### **PHASE 5: DEPLOYMENT & CLEANUP** (Day 5)

**P5.1 - Final Cleanup**

- [ ] Remove all deleted endpoint files
- [ ] Update package.json scripts
- [ ] Update documentation
- [ ] Clean up unused imports

**P5.2 - Client Updates**

- [ ] Update frontend to use event patterns
- [ ] Update API calls for consolidated endpoints
- [ ] Test user experience end-to-end

**P5.3 - Production Deployment**

- [ ] Deploy to Vercel staging
- [ ] Validate 8-function limit compliance
- [ ] Test production workflows
- [ ] Monitor performance metrics

---

## 🎯 **5. IMPLEMENTATION GUIDELINES**

### **EVENT-DRIVEN PATTERNS**

**✅ DO:**

```typescript
// Trigger workflow via event
await inngest.send({
  name: 'itinerary.generate',
  data: { formData, sessionId, requestId },
});

// Define workflow function
export const itineraryWorkflow = inngest.createFunction(
  { id: 'itinerary-generation' },
  { event: 'itinerary.generate' },
  async ({ event, step }) => {
    // All agents execute here internally
  }
);
```

**❌ DON'T:**

```typescript
// Don't make HTTP calls between functions
const response = await fetch('/api/agents/architect');

// Don't create separate endpoints for workflow steps
export default async function architectHandler() {}
```

### **PARALLEL EXECUTION PATTERNS**

```typescript
// Execute multiple agents in parallel
const [architectResult, gathererResult] = await Promise.all([
  step.run('architect', () => architectAgent(data)),
  step.run('gatherer', () => gathererAgent(data)),
]);

// Then execute dependent steps
const specialistResult = await step.run('specialist', () =>
  specialistAgent(architectResult, gathererResult)
);
```

### **PROGRESS TRACKING PATTERNS**

```typescript
// Update progress at each step
await step.run('update-progress', async () => {
  await progressTracker.update(sessionId, {
    stage: 'architect-complete',
    progress: 25,
    message: 'High-level planning complete',
  });
});
```

---

## 📊 **6. PHASE TRACKING CHECKLIST**

### **PHASE 1: PREPARATION** ⏳

- [ ] File inventory complete
- [ ] Dependency mapping done
- [ ] Backup created
- [ ] Extraction plan ready

### **PHASE 2: INNGEST CORE** ⏳

- [ ] Inngest client configured
- [ ] Events defined
- [ ] Agents migrated
- [ ] Main workflow created

### **PHASE 3: CONSOLIDATION** ⏳

- [ ] Infrastructure consolidated
- [ ] Endpoints updated
- [ ] Old files removed
- [ ] Integration complete

### **PHASE 4: TESTING** ⏳

- [ ] Local testing complete
- [ ] Integration verified
- [ ] Performance validated
- [ ] Error handling tested

### **PHASE 5: DEPLOYMENT** ⏳

- [ ] Cleanup complete
- [ ] Client updated
- [ ] Production deployed
- [ ] Monitoring active

---

## 🎯 **SUCCESS METRICS**

### **DEPLOYMENT COMPLIANCE**

- ✅ **Function count**: 8 functions (down from 16)
- ✅ **Vercel limits**: Under all deployment constraints
- ✅ **Bundle size**: Optimized for Edge Runtime

### **PERFORMANCE TARGETS**

- ✅ **Cold start reduction**: Single workflow vs multiple functions
- ✅ **Execution time**: <30s for full itinerary generation
- ✅ **Parallel efficiency**: Multiple agents executing simultaneously
- ✅ **Error resilience**: Built-in retry and recovery

### **ARCHITECTURE QUALITY**

- ✅ **Event-driven**: Proper Inngest usage patterns
- ✅ **State management**: Persistent workflow state
- ✅ **Observability**: Built-in monitoring and logging
- ✅ **Maintainability**: Single workflow file vs 16 functions

**EXPECTED COMPLETION**: 5 days for full refactoring  
**RISK LEVEL**: Medium (major architecture change)  
**SUCCESS PROBABILITY**: High (research-backed approach)

---

**STATUS**: ⏳ **READY FOR PHASE 1 EXECUTION**

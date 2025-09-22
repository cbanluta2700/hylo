# Hylo Travel AI - Debug Flow Map (Phase 3 → Phase 4)

## Debug Log Flow: Data Journey from Form to AI Workflow

This document maps the complete data flow from form submission to AI itinerary generation, with numbered debug logs for comprehensive tracking.

### 📊 **Debug Flow Overview**

```
FORM SUBMISSION → VALIDATION → SESSION CREATION → AI WORKFLOW → PROGRESS TRACKING → RESULT DELIVERY
```

---

## 🔄 **Phase 3: Form Data Processing** (DEBUG-100 to DEBUG-103)

### **100-101: Form Transformation**

- **Location**: `src/utils/workflow-transforms.ts`
- **Function**: `transformExistingFormDataToWorkflow()`
- **Purpose**: Convert React form data to AI-compatible format

```typescript
🔄 [DEBUG-100] Starting form data transformation to AI workflow format
✅ [DEBUG-101] Form data transformation completed
```

**Data Structure After 101**:

```javascript
{
  location: "Paris, France",
  departDate: "2024-03-15",
  returnDate: "2024-03-22",
  budget: { total: 3000, currency: "USD", breakdown: {...} },
  travelContext: { groupSize: 2, budgetPerDay: 428 }
}
```

### **102-103: Form Aggregation & Validation**

- **Location**: `src/services/form-aggregation.ts`
- **Function**: `aggregateFormData()`
- **Purpose**: Aggregate and validate all form sections

```typescript
📝 [DEBUG-102] Starting form data aggregation
🔍 [DEBUG-103] Form data aggregation validation
```

**Data Structure After 103**:

- Zod-validated `TravelFormData`
- All required fields confirmed
- Ready for API submission

---

## 🚀 **Phase 4: API Gateway & Session Management** (DEBUG-104 to DEBUG-124)

### **104-109: API Request Processing**

- **Location**: `api/itinerary/generate.ts`
- **Function**: `handler()`
- **Purpose**: Handle POST request and validate input

```typescript
🚀 [DEBUG-104] API Generate endpoint called
📥 [DEBUG-106] Processing generate itinerary request
🔍 [DEBUG-107] Request body parsed
❌ [DEBUG-108] Validation failed (if errors)
✅ [DEBUG-109] Request validation successful
```

### **110-118: Session Creation**

- **Location**: `src/lib/session/SessionManager.ts`
- **Function**: `createSession()`
- **Purpose**: Create Redis-backed workflow session

```typescript
🆔 [DEBUG-110] Generated request ID
💾 [DEBUG-111] Creating workflow session
💾 [DEBUG-115] SessionManager creating new session
🆔 [DEBUG-116] Generated workflow ID
🔑 [DEBUG-117] Storing session in Redis
✅ [DEBUG-118] Session stored successfully
✅ [DEBUG-112] Workflow session created
```

**Session Data Structure After 118**:

```javascript
{
  id: "wf_1695456789_abc123def",
  sessionId: "user_session_456",
  status: "pending",
  currentStage: "architect",
  progress: 0,
  formData: { /* transformed form data */ }
}
```

### **113-114, 119-124: Workflow Event Dispatch**

- **Location**: `src/lib/inngest/client.ts`
- **Function**: `sendWorkflowEvent()`
- **Purpose**: Trigger Inngest AI workflow

```typescript
🔄 [DEBUG-113] Sending workflow event to Inngest
🔄 [DEBUG-122] Inngest sending workflow event
✅ [DEBUG-123] Inngest event sent successfully
✅ [DEBUG-114] Workflow event sent successfully
🔍 [DEBUG-119] SessionManager retrieving session
❌ [DEBUG-120] Session not found (if not found)
✅ [DEBUG-121] Session retrieved successfully
```

---

## 🤖 **Phase 4: AI Agent Workflow Execution** (DEBUG-125 to DEBUG-134)

### **125-127: Travel Architect Agent**

- **Location**: `src/lib/agents/AgentWorkflow.ts`
- **Function**: `execute()` → `TravelArchitect.execute()`
- **Purpose**: Create trip structure and framework

```typescript
🏗️ [DEBUG-125] Starting 4-Agent Workflow...
1️⃣ [DEBUG-126] Executing Travel Architect...
✅ [DEBUG-127] Travel Architect completed
```

**Agent Output After 127**:

```javascript
{
  success: true,
  data: {
    tripStructure: { days: 7, themes: ["culture", "food"] },
    budgetAllocation: { accommodation: 40%, activities: 35% },
    dailySchedule: [/* template for each day */]
  },
  processingTime: 2340
}
```

### **128-129: Information Gatherer Agent**

- **Location**: `src/lib/search/SearchClient.ts` + `AgentWorkflow.ts`
- **Purpose**: Collect destination data using search providers

```typescript
2️⃣ [DEBUG-128] Executing Information Gatherer...
✅ [DEBUG-129] Information Gatherer completed
```

### **130-131: Travel Specialist Agent**

- **Purpose**: Process and refine gathered travel data

```typescript
3️⃣ [DEBUG-130] Executing Travel Specialist...
✅ [DEBUG-131] Travel Specialist completed
```

### **132-134: Content Formatter Agent**

- **Purpose**: Format final itinerary output

```typescript
4️⃣ [DEBUG-132] Executing Content Formatter...
✅ [DEBUG-133] Content Formatter completed
✅ [DEBUG-134] 4-Agent Workflow completed successfully
```

---

## 📊 **Phase 4: Progress Tracking & Result Delivery** (DEBUG-135 to DEBUG-141)

### **135-137: Progress API**

- **Location**: `api/itinerary/progress/[workflowId].ts`
- **Purpose**: Server-Sent Events for real-time progress

```typescript
📊 [DEBUG-135] Progress API endpoint called
❌ [DEBUG-136] Missing workflow ID (if error)
🔍 [DEBUG-137] Client request type
```

### **138-141: Itinerary Retrieval**

- **Location**: `api/itinerary/get-itinerary.ts`
- **Purpose**: Retrieve completed itinerary

```typescript
📋 [DEBUG-138] Get Itinerary API endpoint called
🔍 [DEBUG-139] Extracting itinerary ID
❌ [DEBUG-140] Missing itinerary ID (if error)
🔄 [DEBUG-141] Processing itinerary retrieval
```

---

## 🎯 **Complete Data Flow Sequence**

### **Successful Request Flow** (Happy Path):

```
100 → 101 → 102 → 103 → 104 → 106 → 107 → 109 → 110 → 111 → 115 → 116 → 117 → 118 → 112 → 113 → 122 → 123 → 114 → 125 → 126 → 127 → 128 → 129 → 130 → 131 → 132 → 133 → 134
```

### **Error Handling Points**:

- **DEBUG-108**: Form validation failures
- **DEBUG-120**: Session not found
- **DEBUG-124**: Inngest event failures
- **DEBUG-136**: Missing workflow ID
- **DEBUG-140**: Missing itinerary ID

### **Performance Monitoring**:

- Agent processing times captured at each completion log
- Total workflow time in DEBUG-134
- Session creation time in DEBUG-118
- API response times implicit in timestamp logs

---

## 🔍 **Debug Usage Examples**

### **Monitoring a Complete Request**:

```bash
# Filter logs for a specific workflow
grep "wf_1695456789_abc123def" application.log

# Track form data transformation
grep "DEBUG-10[0-3]" application.log

# Monitor AI agent execution
grep "DEBUG-1[2-3][0-9]" application.log
```

### **Performance Analysis**:

```bash
# Extract processing times
grep "processingTime\|completed" application.log

# Monitor session creation flow
grep "DEBUG-11[0-8]" application.log
```

### **Error Debugging**:

```bash
# Check validation failures
grep "DEBUG-108\|❌" application.log

# Monitor session issues
grep "DEBUG-120\|Session not found" application.log
```

---

## 📈 **Constitutional Compliance**

✅ **Edge-First Architecture**: All logs use Edge Runtime compatible `console.log`  
✅ **Type-Safe Development**: Debug objects include type information  
✅ **Code-Deploy-Debug Flow**: Comprehensive logging enables production debugging  
✅ **User Experience Consistency**: Numbered sequence provides clear flow visibility  
✅ **Component Composition Pattern**: Logs follow data flow through composed components

This debug system enables complete request tracing from form submission (Phase 3) through AI workflow completion (Phase 4), supporting the constitutional Code-Deploy-Debug principle for production troubleshooting.

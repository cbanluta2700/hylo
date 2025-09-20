# Hylo AI Workflow - Troubleshooting Guide

## Overview

This comprehensive troubleshooting guide covers common issues, debugging procedures, and solutions for the Hylo AI Workflow Integration. It includes diagnostic steps, error codes, performance optimization, and recovery procedures.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Common Issues & Solutions](#common-issues--solutions)
3. [Error Code Reference](#error-code-reference)
4. [Performance Troubleshooting](#performance-troubleshooting)
5. [Agent-Specific Issues](#agent-specific-issues)
6. [Streaming & Real-Time Issues](#streaming--real-time-issues)
7. [API & Backend Issues](#api--backend-issues)
8. [Frontend & React Issues](#frontend--react-issues)
9. [Deployment & Infrastructure](#deployment--infrastructure)
10. [Monitoring & Debugging Tools](#monitoring--debugging-tools)

---

## Quick Diagnostics

### System Health Check

Run these commands to quickly assess system health:

```bash
# Check system health
curl https://your-app.vercel.app/api/health/system

# Check LLM providers
curl https://your-app.vercel.app/api/providers/status

# Check workflow system
curl https://your-app.vercel.app/api/workflow/health

# Test basic workflow
curl -X POST https://your-app.vercel.app/api/test/workflow \
  -H "Content-Type: application/json" \
  -d '{"scenario": "basic_trip", "duration": "fast"}'
```

### Environment Variables Check

```bash
# Verify critical environment variables
node -e "
const required = [
  'CEREBRAS_API_KEY',
  'GOOGLE_GENAI_API_KEY', 
  'GROQ_API_KEY',
  'UPSTASH_VECTOR_REST_URL',
  'UPSTASH_VECTOR_REST_TOKEN',
  'LANGSMITH_API_KEY'
];
const missing = required.filter(key => !process.env[key]);
if (missing.length) {
  console.log('❌ Missing environment variables:', missing.join(', '));
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set');
}
"
```

### Log Analysis Quick Commands

```bash
# View recent errors (if using PM2 or similar)
tail -f logs/error.log | grep -E "(ERROR|FATAL)"

# Check application logs
tail -f logs/combined.log | grep -E "(workflow|agent|stream)"

# Monitor performance
tail -f logs/performance.log | grep -E "(slow|timeout|memory)"
```

---

## Common Issues & Solutions

### 1. Workflow Fails to Start

**Symptoms:**
- API returns 500 error on workflow start
- Frontend shows "Failed to start workflow"
- No progress updates received

**Diagnostic Steps:**

```bash
# Check API endpoint directly
curl -X POST https://your-app.vercel.app/api/workflow/start \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "destination": "Test City",
      "startDate": "2025-12-01",
      "endDate": "2025-12-07",
      "adults": 2,
      "children": 0,
      "budget": {"amount": 1000, "currency": "USD", "type": "total"},
      "accommodationType": "hotel",
      "travelStyle": "cultural",
      "interests": ["museums"]
    }
  }' -v
```

**Common Causes & Solutions:**

1. **Missing API Keys**
   ```bash
   # Solution: Check and set environment variables
   export CEREBRAS_API_KEY="your-key"
   export GOOGLE_GENAI_API_KEY="your-key"
   export GROQ_API_KEY="your-key"
   ```

2. **Invalid Form Data**
   ```typescript
   // Solution: Validate form data before submission
   import { TripFormDataSchema } from './schemas';
   
   try {
     TripFormDataSchema.parse(formData);
   } catch (error) {
     console.error('Invalid form data:', error);
   }
   ```

3. **Database Connection Issues**
   ```bash
   # Solution: Check vector database connection
   curl -H "Authorization: Bearer $UPSTASH_VECTOR_REST_TOKEN" \
     "$UPSTASH_VECTOR_REST_URL/info"
   ```

### 2. Streaming Stops or Hangs

**Symptoms:**
- Progress updates stop at a specific percentage
- Frontend shows "Connecting..." indefinitely
- Browser network tab shows pending request

**Diagnostic Steps:**

```javascript
// Debug streaming in browser console
const testStream = async () => {
  const response = await fetch('/api/workflow/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      formData: /* your test data */,
      options: { enableStreaming: true }
    })
  });
  
  const reader = response.body.getReader();
  let chunks = 0;
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      console.log(`Stream completed after ${chunks} chunks`);
      break;
    }
    
    console.log(`Chunk ${++chunks}:`, new TextDecoder().decode(value));
  }
};

testStream();
```

**Solutions:**

1. **Edge Function Timeout**
   ```typescript
   // In api/workflow/start/route.ts
   export const config = {
     runtime: 'edge',
     maxDuration: 300, // Increase timeout to 5 minutes
   };
   ```

2. **Memory Leak in Streaming**
   ```typescript
   // Solution: Proper cleanup
   const createCleanStream = () => {
     let cleanup: (() => void) | null = null;
     
     return new ReadableStream({
       start(controller) {
         cleanup = setupWorkflowStream(controller);
       },
       cancel() {
         cleanup?.();
       }
     });
   };
   ```

3. **Network Issues**
   ```typescript
   // Solution: Add connection recovery
   const retryableStream = async (url: string, options: any) => {
     let retries = 3;
     
     while (retries > 0) {
       try {
         return await fetch(url, options);
       } catch (error) {
         retries--;
         if (retries === 0) throw error;
         await new Promise(resolve => setTimeout(resolve, 1000));
       }
     }
   };
   ```

### 3. Agent Execution Failures

**Symptoms:**
- Workflow fails at specific agent (e.g., "Info Gatherer failed")
- Error messages about LLM API failures
- Partial results with missing agent data

**Diagnostic Commands:**

```bash
# Test individual agents
curl -X POST https://your-app.vercel.app/api/agents/content-planner \
  -H "Content-Type: application/json" \
  -d '{"formData": /* test data */}'

curl -X POST https://your-app.vercel.app/api/agents/info-gatherer \
  -H "Content-Type: application/json" \
  -d '{"queries": ["Paris attractions"], "destination": "Paris"}'
```

**Solutions:**

1. **LLM Provider Failures**
   ```typescript
   // Solution: Implement fallback chain
   const executeWithFallback = async (prompt: string) => {
     const providers = [
       () => cerebrasClient.invoke(prompt),
       () => googleClient.invoke(prompt),
       () => groqClient.invoke(prompt),
     ];
     
     for (const provider of providers) {
       try {
         return await provider();
       } catch (error) {
         console.warn('Provider failed, trying next:', error);
       }
     }
     
     throw new Error('All providers failed');
   };
   ```

2. **Rate Limiting**
   ```typescript
   // Solution: Add rate limiting and backoff
   class RateLimiter {
     private requests: number[] = [];
     
     async waitIfNeeded(requestsPerMinute: number = 60) {
       const now = Date.now();
       this.requests = this.requests.filter(t => now - t < 60000);
       
       if (this.requests.length >= requestsPerMinute) {
         const oldestRequest = Math.min(...this.requests);
         const waitTime = 60000 - (now - oldestRequest);
         await new Promise(resolve => setTimeout(resolve, waitTime));
       }
       
       this.requests.push(now);
     }
   }
   ```

### 4. High Memory Usage

**Symptoms:**
- Server crashes with "out of memory" errors
- Slow performance during workflow execution
- Edge function timeout errors

**Diagnostic Tools:**

```typescript
// Memory monitoring utility
class MemoryMonitor {
  static logMemoryUsage(context: string) {
    const usage = process.memoryUsage();
    console.log(`[${context}] Memory Usage:`, {
      heap: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`,
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    });
  }
  
  static async executeWithMemoryTracking<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    this.logMemoryUsage(`${context} - Start`);
    
    try {
      const result = await operation();
      this.logMemoryUsage(`${context} - Success`);
      return result;
    } catch (error) {
      this.logMemoryUsage(`${context} - Error`);
      throw error;
    } finally {
      if (global.gc) {
        global.gc();
        this.logMemoryUsage(`${context} - After GC`);
      }
    }
  }
}
```

**Solutions:**

1. **Streaming Optimization**
   ```typescript
   // Solution: Process data in chunks
   const processInChunks = async function* <T>(
     items: T[],
     processor: (chunk: T[]) => Promise<any>,
     chunkSize: number = 5
   ) {
     for (let i = 0; i < items.length; i += chunkSize) {
       const chunk = items.slice(i, i + chunkSize);
       yield await processor(chunk);
       
       // Allow garbage collection
       if (global.gc) global.gc();
     }
   };
   ```

2. **Object Cleanup**
   ```typescript
   // Solution: Explicit cleanup
   class WorkflowSession {
     private resources: any[] = [];
     
     addResource(resource: any) {
       this.resources.push(resource);
     }
     
     cleanup() {
       this.resources.forEach(resource => {
         if (resource.cleanup) resource.cleanup();
         if (resource.destroy) resource.destroy();
         if (resource.abort) resource.abort();
       });
       this.resources = [];
     }
   }
   ```

---

## Error Code Reference

### Workflow Error Codes

| Code | Name | Description | Solution |
|------|------|-------------|----------|
| WF001 | WORKFLOW_TIMEOUT | Workflow exceeded maximum execution time | Increase timeout limits, optimize agent processing |
| WF002 | INVALID_FORM_DATA | Form data validation failed | Check form schema, validate inputs |
| WF003 | AGENT_FAILURE | Specific agent execution failed | Check agent logs, verify LLM providers |
| WF004 | LLM_QUOTA_EXCEEDED | LLM API quota or rate limit hit | Upgrade plan, implement rate limiting |
| WF005 | VECTOR_STORE_ERROR | Vector database operation failed | Check connection, verify credentials |
| WF006 | NETWORK_ERROR | Network connectivity issue | Check internet connection, retry logic |
| WF007 | VALIDATION_ERROR | Runtime data validation failed | Check data schemas, update validators |
| WF008 | SESSION_EXPIRED | Workflow session timed out | Restart workflow, check session management |
| WF009 | RATE_LIMITED | API rate limit exceeded | Implement backoff, reduce request frequency |
| WF010 | FEATURE_DISABLED | Requested feature is disabled | Check feature flags, enable in configuration |

### HTTP Status Code Mapping

```typescript
const errorStatusMapping = {
  WF001: 408, // Request Timeout
  WF002: 400, // Bad Request
  WF003: 502, // Bad Gateway (upstream failure)
  WF004: 402, // Payment Required
  WF005: 503, // Service Unavailable
  WF006: 502, // Bad Gateway
  WF007: 400, // Bad Request
  WF008: 401, // Unauthorized (expired)
  WF009: 429, // Too Many Requests
  WF010: 403, // Forbidden
};
```

---

## Performance Troubleshooting

### Slow Workflow Execution

**Benchmarking Tools:**

```typescript
class PerformanceBenchmark {
  private static timers: Map<string, number> = new Map();
  
  static start(label: string) {
    this.timers.set(label, Date.now());
  }
  
  static end(label: string): number {
    const start = this.timers.get(label);
    if (!start) return 0;
    
    const duration = Date.now() - start;
    console.log(`⏱️ ${label}: ${duration}ms`);
    this.timers.delete(label);
    return duration;
  }
  
  static async measure<T>(label: string, operation: () => Promise<T>): Promise<T> {
    this.start(label);
    try {
      return await operation();
    } finally {
      this.end(label);
    }
  }
}

// Usage in workflow
const result = await PerformanceBenchmark.measure(
  "Content Planner Agent",
  () => contentPlannerAgent(state)
);
```

**Optimization Strategies:**

1. **Parallel Agent Execution**
   ```typescript
   // When agents can run independently
   const parallelResults = await Promise.allSettled([
     executeAgent("agent1", state),
     executeAgent("agent2", state),
     executeAgent("agent3", state),
   ]);
   ```

2. **Caching Strategy**
   ```typescript
   class WorkflowCache {
     private static cache = new Map<string, any>();
     private static TTL = 10 * 60 * 1000; // 10 minutes
     
     static async getOrCompute<T>(
       key: string,
       computer: () => Promise<T>
     ): Promise<T> {
       const cached = this.cache.get(key);
       if (cached && Date.now() - cached.timestamp < this.TTL) {
         return cached.data;
       }
       
       const data = await computer();
       this.cache.set(key, { data, timestamp: Date.now() });
       return data;
     }
   }
   ```

### Memory Optimization

```typescript
// Streaming with backpressure
class BackpressureStream {
  private buffer: any[] = [];
  private maxBufferSize = 10;
  
  async writeWithBackpressure(data: any, writer: WritableStreamDefaultWriter) {
    this.buffer.push(data);
    
    if (this.buffer.length >= this.maxBufferSize) {
      await this.flush(writer);
    }
  }
  
  private async flush(writer: WritableStreamDefaultWriter) {
    while (this.buffer.length > 0) {
      const chunk = this.buffer.shift();
      await writer.write(chunk);
    }
  }
}
```

---

## Agent-Specific Issues

### Content Planner Agent

**Common Issues:**
1. **Incomplete analysis of form data**
2. **Poor query generation**
3. **Missing context information**

**Debugging:**

```typescript
// Debug Content Planner
const debugContentPlanner = async (formData: TripFormData) => {
  console.log("📋 Content Planner Debug:");
  console.log("Input:", JSON.stringify(formData, null, 2));
  
  try {
    const result = await contentPlannerAgent({ formData } as WorkflowState);
    console.log("Output:", JSON.stringify(result, null, 2));
    
    // Validate output structure
    if (!result.contentPlan?.informationNeeds?.length) {
      console.warn("⚠️ No information needs generated");
    }
    
    if (!result.contentPlan?.researchQueries?.length) {
      console.warn("⚠️ No research queries generated");
    }
    
  } catch (error) {
    console.error("❌ Content Planner Error:", error);
  }
};
```

### Info Gatherer Agent

**Common Issues:**
1. **Web scraping failures**
2. **Rate limiting from search APIs**
3. **Irrelevant information gathering**

**Debugging:**

```typescript
// Debug Info Gatherer
const debugInfoGatherer = async (queries: string[]) => {
  console.log("🔍 Info Gatherer Debug:");
  
  for (const query of queries) {
    console.log(`Processing query: ${query}`);
    
    try {
      // Test web scraping
      const webResults = await webScraping(query);
      console.log(`Web results: ${webResults.length} items`);
      
      // Test vector search
      const vectorResults = await vectorSearch(query);
      console.log(`Vector results: ${vectorResults.length} items`);
      
      // Test relevance scoring
      const relevanceScore = calculateRelevance(webResults, vectorResults);
      console.log(`Relevance score: ${relevanceScore}`);
      
    } catch (error) {
      console.error(`❌ Query failed: ${query}`, error);
    }
  }
};
```

### Planning Strategist Agent

**Common Issues:**
1. **Poor budget allocation**
2. **Unrealistic time planning**
3. **Missing logistical considerations**

**Debugging:**

```typescript
// Debug Planning Strategist
const debugStrategist = async (gatheredInfo: GatheredInfo) => {
  console.log("📊 Planning Strategist Debug:");
  
  // Check information quality
  const infoQuality = analyzeInfoQuality(gatheredInfo);
  console.log("Information quality metrics:", infoQuality);
  
  // Test budget allocation
  const budgetAllocation = allocateBudget(gatheredInfo);
  console.log("Budget allocation:", budgetAllocation);
  
  // Validate daily themes
  const dailyThemes = generateDailyThemes(gatheredInfo);
  console.log("Daily themes:", dailyThemes);
};
```

### Content Compiler Agent

**Common Issues:**
1. **Incomplete itinerary assembly**
2. **Poor formatting**
3. **Missing required sections**

**Debugging:**

```typescript
// Debug Content Compiler
const debugCompiler = async (allAgentData: any) => {
  console.log("📝 Content Compiler Debug:");
  
  // Validate input completeness
  const requiredFields = ['contentPlan', 'gatheredInfo', 'strategy'];
  const missing = requiredFields.filter(field => !allAgentData[field]);
  
  if (missing.length) {
    console.error("❌ Missing required fields:", missing);
    return;
  }
  
  // Test itinerary generation
  try {
    const itinerary = await generateItinerary(allAgentData);
    
    // Validate output structure
    const validation = validateItineraryStructure(itinerary);
    console.log("Itinerary validation:", validation);
    
  } catch (error) {
    console.error("❌ Compilation failed:", error);
  }
};
```

---

## Streaming & Real-Time Issues

### Connection Drops

**Detection:**

```typescript
// Connection health monitoring
class StreamHealthMonitor {
  private lastHeartbeat = Date.now();
  private heartbeatInterval: NodeJS.Timeout;
  
  startMonitoring(stream: ReadableStream) {
    this.heartbeatInterval = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat;
      
      if (timeSinceLastHeartbeat > 30000) { // 30 seconds
        console.warn("Stream appears to be dead, attempting reconnection");
        this.attemptReconnection();
      }
    }, 10000); // Check every 10 seconds
  }
  
  recordHeartbeat() {
    this.lastHeartbeat = Date.now();
  }
  
  private attemptReconnection() {
    // Implement reconnection logic
  }
}
```

### Streaming Performance Issues

**Solutions:**

```typescript
// Optimized streaming implementation
class OptimizedWorkflowStream {
  private buffer: any[] = [];
  private bufferSize = 0;
  private maxBufferSize = 64 * 1024; // 64KB
  
  async enqueueUpdate(update: WorkflowUpdate, controller: ReadableStreamDefaultController) {
    const serialized = JSON.stringify(update);
    const size = new Blob([serialized]).size;
    
    // If adding this update would exceed buffer, flush first
    if (this.bufferSize + size > this.maxBufferSize && this.buffer.length > 0) {
      await this.flush(controller);
    }
    
    this.buffer.push(serialized);
    this.bufferSize += size;
    
    // Flush if buffer is getting full
    if (this.bufferSize > this.maxBufferSize * 0.8) {
      await this.flush(controller);
    }
  }
  
  private async flush(controller: ReadableStreamDefaultController) {
    if (this.buffer.length === 0) return;
    
    const combined = this.buffer.join('\n');
    controller.enqueue(new TextEncoder().encode(`data: ${combined}\n\n`));
    
    this.buffer = [];
    this.bufferSize = 0;
  }
}
```

---

## API & Backend Issues

### Edge Function Timeouts

**Diagnosis:**

```bash
# Check function execution time
curl -w "@curl-format.txt" -X POST https://your-app.vercel.app/api/workflow/start

# Create curl-format.txt with:
echo "
     time_namelookup:  %{time_namelookup}s
        time_connect:  %{time_connect}s
     time_appconnect:  %{time_appconnect}s
    time_pretransfer:  %{time_pretransfer}s
       time_redirect:  %{time_redirect}s
  time_starttransfer:  %{time_starttransfer}s
                     ----------
          time_total:  %{time_total}s
" > curl-format.txt
```

**Solutions:**

```typescript
// Timeout-aware execution
class TimeoutManager {
  static async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    timeoutMessage = "Operation timed out"
  ): Promise<T> {
    let timeoutId: NodeJS.Timeout;
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMs);
    });
    
    try {
      const result = await Promise.race([operation(), timeoutPromise]);
      clearTimeout(timeoutId!);
      return result;
    } catch (error) {
      clearTimeout(timeoutId!);
      throw error;
    }
  }
}

// Usage in Edge Function
export default async function handler(req: Request) {
  return TimeoutManager.executeWithTimeout(
    () => processWorkflow(req),
    280000, // 4 minutes 40 seconds (under 5 min limit)
    "Workflow execution timed out"
  );
}
```

### Database Connection Issues

**Vector Database Troubleshooting:**

```typescript
// Vector DB health check
const testVectorDatabase = async () => {
  try {
    // Test connection
    const info = await upstashVector.info();
    console.log("✅ Vector DB connected:", info);
    
    // Test query
    const testQuery = await upstashVector.query({
      vector: new Array(768).fill(0.1),
      topK: 1,
    });
    console.log("✅ Query test passed:", testQuery.length);
    
  } catch (error) {
    console.error("❌ Vector DB error:", error);
    
    // Check specific error types
    if (error.message.includes("401")) {
      console.error("Authentication failed - check UPSTASH_VECTOR_REST_TOKEN");
    } else if (error.message.includes("404")) {
      console.error("Database not found - check UPSTASH_VECTOR_REST_URL");
    } else if (error.message.includes("timeout")) {
      console.error("Connection timeout - check network connectivity");
    }
  }
};
```

---

## Frontend & React Issues

### Component Rendering Issues

**Debug Hooks:**

```typescript
// Debug useWorkflow hook
export const useWorkflowDebug = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  const startWorkflow = useCallback(async (formData, options) => {
    const startTime = Date.now();
    setDebugInfo(prev => ({ ...prev, startTime, status: 'starting' }));
    
    try {
      // Your workflow logic here
      const result = await actualStartWorkflow(formData, options);
      
      setDebugInfo(prev => ({
        ...prev,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        status: 'completed',
        result
      }));
      
      return result;
    } catch (error) {
      setDebugInfo(prev => ({
        ...prev,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        status: 'error',
        error: error.message
      }));
      throw error;
    }
  }, []);
  
  return { startWorkflow, debugInfo };
};
```

### State Management Issues

```typescript
// Debug React state updates
const useStateDebugger = <T>(state: T, name: string) => {
  const prevState = useRef<T>();
  
  useEffect(() => {
    if (prevState.current !== state) {
      console.log(`${name} state changed:`, {
        from: prevState.current,
        to: state,
        timestamp: new Date().toISOString(),
      });
      prevState.current = state;
    }
  }, [state, name]);
};

// Usage
const MyComponent = () => {
  const [workflowState, setWorkflowState] = useState(initialState);
  useStateDebugger(workflowState, 'WorkflowState');
  
  // Component logic...
};
```

---

## Deployment & Infrastructure

### Build Issues

```bash
# Debug build process
npm run build -- --verbose

# Check for TypeScript errors
npx tsc --noEmit

# Analyze bundle size
npm run build && npx webpack-bundle-analyzer dist/static/js/*.js
```

### Environment Variable Issues

```bash
# Validate environment in deployed app
curl https://your-app.vercel.app/api/debug/env-check

# Create debug endpoint (remove in production)
# api/debug/env-check.ts
export default function handler() {
  const requiredVars = [
    'CEREBRAS_API_KEY',
    'GOOGLE_GENAI_API_KEY',
    'GROQ_API_KEY',
    'UPSTASH_VECTOR_REST_URL',
    'UPSTASH_VECTOR_REST_TOKEN',
  ];
  
  const status = requiredVars.map(varName => ({
    name: varName,
    set: !!process.env[varName],
    length: process.env[varName]?.length || 0,
  }));
  
  return Response.json({ status });
}
```

---

## Monitoring & Debugging Tools

### Custom Debugging Utilities

```typescript
// Comprehensive debug logger
class DebugLogger {
  private static isEnabled = process.env.DEBUG === 'true';
  
  static workflow(sessionId: string, message: string, data?: any) {
    if (!this.isEnabled) return;
    
    console.log(`🔄 [WORKFLOW:${sessionId}] ${message}`, data || '');
  }
  
  static agent(agentName: string, message: string, data?: any) {
    if (!this.isEnabled) return;
    
    const emoji = {
      'content_planner': '📋',
      'info_gatherer': '🔍',
      'strategist': '📊',
      'compiler': '📝'
    }[agentName] || '🤖';
    
    console.log(`${emoji} [${agentName.toUpperCase()}] ${message}`, data || '');
  }
  
  static performance(operation: string, duration: number, metadata?: any) {
    if (!this.isEnabled) return;
    
    const emoji = duration > 5000 ? '🐌' : duration > 2000 ? '⚠️' : '⚡';
    console.log(`${emoji} [PERF] ${operation}: ${duration}ms`, metadata || '');
  }
  
  static error(context: string, error: Error, metadata?: any) {
    console.error(`❌ [ERROR:${context}]`, {
      message: error.message,
      stack: error.stack,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Health Monitoring Dashboard

```typescript
// Create a debug dashboard endpoint
// api/debug/dashboard.ts
export default async function handler() {
  const health = {
    system: await checkSystemHealth(),
    agents: await checkAgentHealth(),
    database: await checkDatabaseHealth(),
    providers: await checkProviderHealth(),
    performance: await getPerformanceMetrics(),
  };
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head><title>Hylo Debug Dashboard</title></head>
    <body>
      <h1>Hylo AI Workflow Debug Dashboard</h1>
      <pre>${JSON.stringify(health, null, 2)}</pre>
      <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);
      </script>
    </body>
    </html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
```

---

## Recovery Procedures

### Workflow Recovery

```typescript
// Workflow state recovery
class WorkflowRecovery {
  static async recoverFromCheckpoint(sessionId: string): Promise<WorkflowState> {
    try {
      // Attempt to load from checkpoint
      const checkpoint = await loadCheckpoint(sessionId);
      if (checkpoint) {
        console.log(`✅ Recovered workflow from checkpoint: ${sessionId}`);
        return checkpoint;
      }
    } catch (error) {
      console.warn(`⚠️ Checkpoint recovery failed: ${sessionId}`, error);
    }
    
    // Fallback to initial state
    return createInitialState();
  }
  
  static async saveCheckpoint(sessionId: string, state: WorkflowState) {
    try {
      await saveCheckpoint(sessionId, state);
    } catch (error) {
      console.error(`❌ Failed to save checkpoint: ${sessionId}`, error);
    }
  }
}
```

### Service Recovery

```bash
#!/bin/bash
# recovery-script.sh

echo "🔧 Starting Hylo recovery procedures..."

# 1. Check system health
echo "Checking system health..."
curl -f https://your-app.vercel.app/api/health/system || echo "❌ System health check failed"

# 2. Restart services if needed
echo "Checking if services need restart..."
# Add service restart logic here

# 3. Clear problematic sessions
echo "Clearing stuck sessions..."
curl -X DELETE https://your-app.vercel.app/api/workflow/cleanup/stuck

# 4. Verify recovery
echo "Verifying recovery..."
curl -f https://your-app.vercel.app/api/test/workflow \
  -H "Content-Type: application/json" \
  -d '{"scenario": "recovery_test"}' && echo "✅ Recovery successful"

echo "🎉 Recovery procedures completed"
```

---

## Getting Help

### Support Channels

1. **GitHub Issues**: [Report bugs and feature requests](https://github.com/cbanluta2700/hylo/issues)
2. **Documentation**: [Full documentation](https://docs.hylo.app)
3. **Community**: [Discord server](https://discord.gg/hylo)
4. **Email Support**: support@hylo.app

### Information to Include in Bug Reports

```markdown
## Bug Report Template

### Environment
- Node.js version: 
- Deployment platform: 
- Browser (if frontend issue): 

### Error Details
- Error code: 
- Error message: 
- Stack trace: 

### Steps to Reproduce
1. 
2. 
3. 

### Expected Behavior

### Actual Behavior

### Additional Context
- Form data used: 
- Session ID: 
- Timestamp: 
- Logs: 
```

### Diagnostic Information Collection

```bash
# Run this to collect diagnostic information
cat > collect-diagnostics.sh << 'EOF'
#!/bin/bash
echo "Collecting Hylo diagnostic information..."

mkdir -p diagnostics
cd diagnostics

# System info
echo "Node version: $(node --version)" > system-info.txt
echo "NPM version: $(npm --version)" >> system-info.txt
echo "OS: $(uname -a)" >> system-info.txt

# Application health
curl -s https://your-app.vercel.app/api/health/system > health-check.json

# Recent logs (if accessible)
tail -n 100 ../logs/error.log > recent-errors.log 2>/dev/null
tail -n 100 ../logs/combined.log > recent-logs.log 2>/dev/null

# Package info
cp ../package.json package.json

echo "Diagnostic information collected in ./diagnostics/"
EOF

chmod +x collect-diagnostics.sh
./collect-diagnostics.sh
```

---

*Last Updated: September 20, 2025 | Troubleshooting Guide v2.0.0*
*For additional support, visit our [documentation](https://docs.hylo.app) or [contact support](mailto:support@hylo.app)*
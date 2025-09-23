# Phase 3: Development Server Validation Guide

## 🚀 **Step 1: Start Inngest Development Server**

### Prerequisites

Ensure you have the Inngest CLI installed:

```bash
npm install -g @inngest/cli
```

### Start the Development Server

```bash
# In your project root directory
cd C:\Users\User\Documents\FinalForm\hylo

# Start Inngest dev server (this will scan for functions)
npx inngest-cli@latest dev
```

### Expected Output

You should see:

```
✓ Inngest dev server ready at http://localhost:8288
✓ Found functions at http://localhost:3000/api/inngest
✓ Discovered 5 functions:
  - generate-itinerary (Main orchestrator)
  - architect-agent (Trip structure planning)
  - gatherer-agent (Information collection)
  - specialist-agent (Recommendation processing)
  - formatter-agent (Final itinerary formatting)
```

## 🔍 **Step 2: Validate Function Registration**

### Access Inngest Dashboard

1. Open browser to: `http://localhost:8288`
2. Navigate to **Functions** tab
3. Verify all 5 functions are listed and active

### Check Function Endpoints

```bash
# Test function discovery endpoint
curl http://localhost:3000/api/inngest

# Expected response: Function registration data
```

### Function Registration Checklist

- [ ] `generate-itinerary` function appears
- [ ] `architect-agent` function appears
- [ ] `gatherer-agent` function appears
- [ ] `specialist-agent` function appears
- [ ] `formatter-agent` function appears
- [ ] All functions show "Active" status
- [ ] No import errors in console

## 🧪 **Step 3: Test Function Triggering**

### Trigger Main Workflow

```bash
# Send test event to trigger workflow
curl -X POST http://localhost:3000/api/inngest \
  -H "Content-Type: application/json" \
  -d '{
    "name": "itinerary/generate",
    "data": {
      "workflowId": "test-dev-server-123",
      "sessionId": "dev-session-456",
      "formData": {
        "location": "Paris",
        "adults": 2,
        "children": 0,
        "departDate": "2024-06-15",
        "returnDate": "2024-06-22",
        "interests": ["culture", "food"],
        "budget": { "total": 2000 },
        "travelStyle": { "pace": "moderate" }
      }
    }
  }'
```

### Monitor Execution

1. Watch Inngest dashboard for execution logs
2. Check function execution order: Main → Architect → Gatherer → Specialist → Formatter
3. Verify each step completes successfully

## 🔧 **Step 4: Test Individual Agents**

### Test Architect Agent

```bash
curl -X POST http://localhost:3000/api/inngest \
  -H "Content-Type: application/json" \
  -d '{
    "name": "agent/architect/start",
    "data": {
      "workflowId": "test-architect-789",
      "formData": {
        "location": "London",
        "adults": 2,
        "children": 0,
        "budget": { "total": 1500 }
      }
    }
  }'
```

### Expected Results

- [ ] Architect agent triggers and completes
- [ ] XAI Grok API call succeeds
- [ ] Architecture data is generated
- [ ] Progress updates appear in logs

## ⚠️ **Common Issues & Solutions**

### Functions Not Discovered

```bash
# Check your serve handler exports correctly
# File: api/inngest/index.ts should export default serve()
```

### Import Errors

```bash
# Ensure all imports use .js extensions for Edge Runtime
# File: api/inngest/functions/*.ts
import { something } from '../client.js';  ✅
import { something } from '../client';     ❌
```

### Environment Variables Not Found

```bash
# Check .env.local has required variables
XAI_API_KEY=your_key_here
INNGEST_SIGNING_KEY=your_key_here
KV_REST_API_URL=your_redis_url
KV_REST_API_TOKEN=your_redis_token
```

### TypeScript Errors

```bash
# Run type check to identify issues
npm run type-check
```

## ✅ **Validation Success Criteria**

### Development Server Ready When:

- [ ] Inngest dev server starts without errors
- [ ] All 5 functions register successfully
- [ ] Functions appear in dashboard as "Active"
- [ ] Test events trigger function execution
- [ ] AI agents complete successfully with real API calls
- [ ] Progress updates work correctly
- [ ] No TypeScript or import errors

### Next Steps After Success:

1. ✅ Development server validation complete
2. 🔄 Proceed to Production Deployment Testing
3. 🚀 Deploy to Vercel staging environment
4. 🧪 Run end-to-end production tests

## 🆘 **Troubleshooting Commands**

```bash
# Check Inngest function discovery
curl http://localhost:3000/api/inngest

# Validate environment variables
npm run validate-env

# Check TypeScript compilation
npm run type-check

# Test individual function imports
node -e "import('./api/inngest/functions/generateItinerary.js')"

# Check Redis connection
node -e "
  import { sessionManager } from './src/lib/workflows/session-manager.js';
  sessionManager.getSession('test').then(console.log);
"
```

---

**Ready to validate your development server setup? Follow this guide step by step! 🚀**

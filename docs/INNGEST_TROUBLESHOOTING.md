# Inngest Troubleshooting Quick Reference

## Common Issues & Solutions

### 🔥 **500 Internal Server Error**

#### Symptoms:

```javascript
POST /api/itinerary/generate 500 (Internal Server Error)
SyntaxError: Unexpected token 'A', "A server e"... is not valid JSON
```

#### Solutions:

1. **Check Inngest Client Configuration**:

   ```typescript
   ✅ export const inngest = new Inngest({ id: "your-app-id" });
   ❌ export const inngest = new Inngest({ name: "your-app-name" });
   ```

2. **Verify API Route Handler**:

   ```typescript
   // api/inngest/index.ts
   ✅ export const { GET, POST, PUT } = serve({ client, functions });
   ❌ export default async function handler(request) { ... }
   ```

3. **Check Environment Variables**:
   ```bash
   INNGEST_EVENT_KEY="your-event-key"
   INNGEST_SIGNING_KEY="your-signing-key"
   ```

### 🔥 **503 Service Unavailable**

#### Symptoms:

```javascript
POST /api/itinerary/generate 503 (Service Unavailable)
```

#### Solutions:

1. **Verify Inngest Function Registration**:

   ```typescript
   // Make sure function is exported and included in serve()
   export const { GET, POST, PUT } = serve({
     client: inngest,
     functions: [yourFunction], // ← Must include your function here
   });
   ```

2. **Check Function Event Names**:

   ```typescript
   // Function definition
   {
     event: 'itinerary/generate';
   }

   // Event sending
   inngest.send({ name: 'itinerary/generate' }); // ← Must match exactly
   ```

### 🔥 **Edge Runtime Compatibility Issues**

#### Symptoms:

```
Error: Module not compatible with Edge Runtime
```

#### Solutions:

1. **Use Correct Inngest Import**:

   ```typescript
   ✅ import { serve } from "inngest/next";
   ❌ import { serve } from "inngest/express";
   ```

2. **Add Edge Runtime Config**:
   ```typescript
   export const config = {
     runtime: 'edge',
   };
   ```

### 🔥 **Environment Variable Issues**

#### Symptoms:

```
Error: Missing required environment variable
```

#### Solutions:

1. **Local Development** (`.env.local`):

   ```bash
   INNGEST_EVENT_KEY="your-development-key"
   INNGEST_SIGNING_KEY="your-signing-key"
   ```

2. **Production** (Vercel Dashboard):
   - Go to Project Settings → Environment Variables
   - Add both `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`
   - Redeploy after adding variables

### 🔥 **Function Not Triggering**

#### Symptoms:

```
Event sent but function doesn't execute
```

#### Solutions:

1. **Check Event Name Matching**:

   ```typescript
   // Function listens for
   {
     event: 'my/event';
   }

   // Send event with exact same name
   inngest.send({ name: 'my/event' });
   ```

2. **Verify Function Export**:

   ```typescript
   // Must export the function
   export const myFunction = inngest.createFunction(...)

   // And include in serve
   serve({ client, functions: [myFunction] })
   ```

## Quick Diagnostic Checklist

### ✅ **Before Deployment**

- [ ] Inngest client uses `{ id: "app-name" }`
- [ ] Function event names match exactly
- [ ] API route exports `{ GET, POST, PUT }`
- [ ] Environment variables configured
- [ ] TypeScript compilation passes (`npm run type-check`)

### ✅ **After Deployment**

- [ ] Environment variables added to hosting platform
- [ ] API route accessible at `/api/inngest`
- [ ] Function appears in Inngest dashboard
- [ ] Test event triggers function execution

## Debug Commands

### Local Testing:

```bash
# Start Inngest dev server
npx inngest-cli@latest dev

# Check TypeScript compilation
npm run type-check

# Test API endpoint locally
curl -X GET http://localhost:3000/api/inngest
```

### Production Testing:

```bash
# Test API endpoint
curl -X GET https://your-app.vercel.app/api/inngest

# Check function registration
curl -X POST https://your-app.vercel.app/api/inngest -H "Content-Type: application/json" -d '{}'
```

## Success Indicators

### ✅ **Working Setup**:

```javascript
// API Response (202 Accepted)
{
  success: true,
  workflowId: "uuid-here",
  estimatedCompletionTime: 180000,
  message: "Workflow started successfully"
}
```

### ✅ **Console Logs**:

```
🚀 [70] Workflow Orchestrator: Starting itinerary generation
📁 [71] Workflow Orchestrator: Initializing session
📡 [72] Workflow Orchestrator: Invoking Inngest function directly
✅ [73] Workflow Orchestrator: Inngest function invoked successfully
```

## Emergency Fixes

### 🚨 **Quick Fix for 500 Errors**:

1. Revert to basic Inngest setup
2. Use exact documentation patterns
3. Remove custom handlers
4. Add environment variables
5. Redeploy

### 🚨 **Quick Fix for Missing Events**:

1. Check event name spelling
2. Verify function is in serve() array
3. Confirm environment variables exist
4. Test with simple function first

---

_Last Updated: September 23, 2025_

# Phase 1 Development Setup Instructions

## 📋 Prerequisites

The following dependencies are already installed per tasks.md:

- ✅ `inngest@3.41.0`
- ✅ `@ai-sdk/xai@2.0.20`
- ✅ `ai` package

## 🔧 Environment Variables Setup

### Development (.env.local)

```bash
# Copy these to your .env.local file
XAI_API_KEY=your_xai_api_key_here
INNGEST_SIGNING_KEY=your_inngest_signing_key
INNGEST_EVENT_KEY=your_inngest_signing_key  # Alternative name
```

### Production (Vercel Dashboard)

```bash
# Configure these in Vercel environment variables:
XAI_API_KEY → @xai-api-key
INNGEST_SIGNING_KEY → @inngest-signing-key
GROQ_API_KEY → @groq-api-key
KV_REST_API_URL → @kv-rest-api-url
KV_REST_API_TOKEN → @kv-rest-api-token
```

## 🚀 Development Server Setup

### Terminal 1: Run Inngest CLI

```bash
# Install Inngest CLI if not already installed
npm install -g @inngest/cli

# Start Inngest development server
npx inngest-cli@latest dev
```

### Terminal 2: Run Your Application

```bash
# Start Vite development server
npm run dev
```

## 📡 Endpoints Available

After setup, the following endpoints will be available:

- **Main App**: `http://localhost:5173`
- **Inngest Functions**: `http://localhost:3000/api/inngest`
- **Inngest Dashboard**: `http://localhost:8288` (Inngest dev server)

## 🧪 Function Testing

### Trigger Main Workflow

```typescript
import { inngest } from '../api/inngest/client';

await inngest.send({
  name: 'itinerary/generate',
  data: {
    workflowId: 'test-workflow-' + Date.now(),
    sessionId: 'test-session-' + Date.now(),
    formData: {
      location: 'Paris',
      adults: 2,
      children: 0,
      interests: ['culture', 'food'],
      travelStyle: { pace: 'moderate' },
      budget: { total: 2000 },
    },
  },
});
```

### Trigger Individual Agents

```typescript
// Test Architect Agent
await inngest.send({
  name: 'agent/architect/start',
  data: {
    workflowId: 'test-architect-' + Date.now(),
    formData: { location: 'Paris', adults: 2, children: 0 },
  },
});

// Test Gatherer Agent
await inngest.send({
  name: 'agent/gatherer/start',
  data: {
    workflowId: 'test-gatherer-' + Date.now(),
    destination: 'Paris',
    architecture: { days: 5 },
  },
});
```

## 📊 Validation Checklist

- [ ] Inngest dev server starts without errors
- [ ] Functions appear in Inngest dashboard
- [ ] Main workflow can be triggered
- [ ] Individual agents can be invoked
- [ ] Events are processed successfully
- [ ] Progress updates work correctly
- [ ] Error handling works as expected

## 🔍 Troubleshooting

### Common Issues

1. **Functions not appearing in dashboard**

   - Check that all imports in `api/inngest/index.ts` are correct
   - Verify all function files exist and export correctly

2. **Environment variable issues**

   - Ensure `.env.local` exists with proper values
   - Check XAI_API_KEY is valid

3. **TypeScript errors**
   - Run `npm run type-check` to identify issues
   - Ensure all imports have `.js` extensions for Edge Runtime

### Debug Commands

```bash
# Check environment variables
npm run validate-env

# Type check the entire project
npm run type-check

# Check function registration
curl http://localhost:3000/api/inngest
```

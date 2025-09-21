# 🚀 PRODUCTION DEPLOYMENT GUIDE

## Phase 5: Environment Variables Setup

### Required Environment Variables for Vercel Deployment:

```bash
# AI/LLM Services
XAI_API_KEY=your_xai_grok_api_key
GROQ_API_KEY=your_groq_api_key

# Search Services
TAVILY_API_KEY=your_tavily_search_key
EXA_API_KEY=your_exa_search_key
SERP_API_KEY=your_serp_google_search_key

# Infrastructure (Upstash)
UPSTASH_VECTOR_REST_URL=your_upstash_vector_url
UPSTASH_VECTOR_REST_TOKEN=your_upstash_vector_token
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Workflow Orchestration (Inngest)
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

# Application
NEXTAUTH_SECRET=your_nextauth_secret_32_chars_min
NEXT_PUBLIC_APP_URL=https://your-vercel-deployment.vercel.app

# Node Environment
NODE_ENV=production
```

## Deployment Commands:

1. **Check build readiness:**

```bash
npm run type-check
npm run build
```

2. **Deploy to Vercel:**

```bash
vercel --prod
```

3. **Set environment variables (if not set via Vercel dashboard):**

```bash
vercel env add XAI_API_KEY production
vercel env add GROQ_API_KEY production
# ... repeat for all variables
```

## Post-Deployment Verification:

1. **Check all functions deployed:**

   - Visit: https://your-app.vercel.app/api/system
   - Verify: 8 functions active

2. **Test Inngest webhook:**

   - Visit: https://your-app.vercel.app/api/inngest
   - Verify: Inngest can register functions

3. **Test itinerary generation:**
   - POST to: https://your-app.vercel.app/api/itinerary/generate
   - Verify: 202 response with session tracking

## Architecture Deployed:

```
8 Edge Functions Total:
├── api/inngest.ts (6 internal Inngest functions)
├── api/itinerary/generate.ts (Event-driven entry)
├── api/itinerary/status.ts (Workflow queries)
├── api/itinerary/update.ts (Update operations)
├── api/itinerary/live.ts (WebSocket progress)
├── api/form/updates.ts (Form processing)
├── api/cache.ts (Consolidated caching)
└── api/system.ts (Health/DNS/status)
```

## Success Metrics:

- ✅ All 8 functions under Vercel limit
- ✅ Event-driven workflow active
- ✅ Immediate 202 responses
- ✅ Real-time progress tracking
- ✅ 50% function count reduction achieved

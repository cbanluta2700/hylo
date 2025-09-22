# Quickstart Guide: AI-Powered Itinerary Generation

**Feature**: AI workflow that generates and displays itineraries based on user form data  
**Date**: 2025-09-23  
**Branch**: 001-create-a-ai

## Overview

This quickstart guide demonstrates the complete AI-powered itinerary generation workflow from form submission to itinerary display. The system uses a 4-agent multi-LLM approach with real-time progress tracking.

## Prerequisites

### Environment Setup

1. **Node.js & Dependencies**:

   ```bash
   # Ensure Node.js 18+ is installed
   node --version

   # Install required dependencies
   npm install @ai-sdk/xai@2.0.20 @ai-sdk/groq@2.0.20
   npm install inngest@3.41.0 @upstash/redis @upstash/vector
   npm install vitest@3.2.4 @testing-library/react
   ```

2. **Environment Variables**:

   ```bash
   # Create .env.local file with required API keys
   XAI_API_KEY=xai-your-api-key-here
   GROQ_API_KEY=gsk_your-groq-key-here
   INNGEST_EVENT_KEY=your-inngest-signing-key
   UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-redis-token
   UPSTASH_VECTOR_REST_URL=https://your-vector.upstash.io
   UPSTASH_VECTOR_REST_TOKEN=your-vector-token
   TAVILY_API_KEY=tvly-your-api-key
   EXA_API_KEY=your-exa-api-key
   SERP_API_KEY=your-serp-api-key
   NEXT_PUBLIC_WS_URL=wss://your-app.vercel.app
   ```

3. **Vercel Configuration**:
   ```json
   // vercel.json
   {
     "functions": {
       "api/itinerary/generate.ts": { "maxDuration": 30 },
       "api/itinerary/progress/[workflowId].ts": { "maxDuration": 300 },
       "api/inngest/webhook.ts": { "maxDuration": 60 }
     },
     "env": {
       "INNGEST_SIGNING_KEY": "@inngest-signing-key",
       "XAI_API_KEY": "@xai-api-key",
       "GROQ_API_KEY": "@groq-api-key"
     }
   }
   ```

## Quick Test Scenarios

### Scenario 1: Basic Tokyo Trip Generation

**User Story**: "As a couple, I want to generate a 5-day Tokyo itinerary with a $3000 budget focusing on culture and food"

**Test Steps**:

1. **Fill Form Data**:

   ```typescript
   const testFormData = {
     location: 'Tokyo, Japan',
     departDate: '2025-12-15',
     returnDate: '2025-12-20',
     flexibleDates: false,
     adults: 2,
     children: 0,
     budget: 3000,
     currency: 'USD',
     budgetMode: 'total',
     selectedInterests: ['culture', 'food', 'temples'],
     tripVibes: ['authentic', 'relaxed'],
     dinnerPreferences: ['local-cuisine', 'mid-range'],
   };
   ```

2. **Submit Generation Request**:

   ```bash
   curl -X POST http://localhost:3000/api/itinerary/generate \
     -H "Content-Type: application/json" \
     -d '{
       "sessionId": "test-session-123",
       "formData": { ... }
     }'
   ```

3. **Expected Response**:

   ```json
   {
     "success": true,
     "data": {
       "workflowId": "wf_abc123...",
       "sessionId": "test-session-123",
       "estimatedCompletionTime": 45,
       "progressUrl": "/api/itinerary/progress/wf_abc123..."
     }
   }
   ```

4. **Monitor Progress**:

   ```javascript
   // Frontend JavaScript
   const eventSource = new EventSource('/api/itinerary/progress/wf_abc123');
   eventSource.onmessage = (event) => {
     const progress = JSON.parse(event.data);
     console.log(`Progress: ${progress.progress}% - Stage: ${progress.currentStage}`);
   };
   ```

5. **Verify Completion**:

   ```bash
   # Check final status
   curl http://localhost:3000/api/itinerary/status/wf_abc123

   # Get generated itinerary
   curl http://localhost:3000/api/itinerary/{itineraryId}
   ```

**Expected Results**:

- ✅ 5-day itinerary generated
- ✅ Daily budgets sum to ~$3000
- ✅ Cultural activities (temples, museums) included
- ✅ Food recommendations match preferences
- ✅ All activities are geographically feasible

### Scenario 2: Family Trip with Children

**User Story**: "As a family with 2 kids (ages 8, 12), generate a 7-day London itinerary with kid-friendly activities, budget $4000"

**Test Steps**:

1. **Form Data**:

   ```typescript
   const familyFormData = {
     location: 'London, UK',
     departDate: '2025-08-01',
     returnDate: '2025-08-08',
     adults: 2,
     children: 2,
     childrenAges: [8, 12],
     budget: 4000,
     currency: 'USD',
     budgetMode: 'total',
     selectedInterests: ['museums', 'parks', 'family-activities'],
     selectedInclusions: ['family-friendly-restaurants', 'public-transport'],
   };
   ```

2. **Validation Checks**:
   - All activities marked as age-appropriate for children
   - Restaurants include kid-friendly options
   - Physical requirements are "low" or "medium"
   - Transportation includes family-friendly options

**Expected Results**:

- ✅ Kid-friendly activities prioritized
- ✅ Family restaurants recommended
- ✅ Reasonable walking distances
- ✅ Educational + fun activity mix

### Scenario 3: Budget Backpacker Trip

**User Story**: "Solo backpacker wants 10-day Southeast Asia multi-city trip, $1200 budget, flexible dates"

**Test Steps**:

1. **Form Data**:
   ```typescript
   const backpackerFormData = {
     location: 'Bangkok, Thailand + Ho Chi Minh City, Vietnam',
     departDate: '2025-11-01',
     flexibleDates: true,
     adults: 1,
     children: 0,
     budget: 1200,
     currency: 'USD',
     budgetMode: 'total',
     selectedInterests: ['street-food', 'temples', 'backpacker-culture'],
     tripVibes: ['adventurous', 'budget-conscious'],
     selectedInclusions: ['hostel-accommodation', 'local-transport'],
   };
   ```

**Expected Results**:

- ✅ Budget accommodations (hostels, guesthouses)
- ✅ Street food and budget dining options
- ✅ Multi-city transportation included
- ✅ Total cost under $1200

## Performance Validation

### Response Time Tests

```bash
# Test API response times
time curl -X POST http://localhost:3000/api/itinerary/generate

# Expected: < 500ms initial response
# Expected: < 60s total workflow completion
# Expected: < 100ms progress updates
```

### Load Testing

```bash
# Simple load test with curl
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/itinerary/generate &
done

# Expected: Rate limiting kicks in after 5 requests
# Expected: Graceful error handling
```

## Error Scenario Testing

### 1. Invalid Form Data

```bash
curl -X POST http://localhost:3000/api/itinerary/generate \
  -d '{"sessionId": "test", "formData": {"budget": -100}}'

# Expected: 400 Bad Request with validation errors
```

### 2. AI Service Failure

```bash
# Temporarily disable API keys to test error handling
unset XAI_API_KEY
npm run dev

# Expected: Graceful fallback or clear error message
```

### 3. Workflow Timeout

```bash
# Test with extremely complex request that might timeout
curl -X POST http://localhost:3000/api/itinerary/generate \
  -d '{
    "sessionId": "timeout-test",
    "formData": {
      "location": "Multiple cities across 20 countries",
      "plannedDays": 365
    }
  }'

# Expected: Timeout error after 5 minutes
```

## Manual Testing Checklist

### Frontend Integration

- [ ] Form submission triggers API call
- [ ] Progress bar updates in real-time
- [ ] Loading states display correctly
- [ ] Error messages are user-friendly
- [ ] Generated itinerary renders properly
- [ ] Regeneration functionality works

### Backend Workflow

- [ ] All 4 AI agents execute in sequence
- [ ] Redis state updates correctly
- [ ] Progress events stream properly
- [ ] Final itinerary is well-formatted
- [ ] Error boundaries handle failures

### Edge Cases

- [ ] Same-day departure/return dates
- [ ] Zero budget specified
- [ ] Invalid destination names
- [ ] Network connectivity issues
- [ ] API rate limit exceeded

## Deployment Verification

1. **Deploy to Vercel Staging**:

   ```bash
   npm run build
   vercel --prebuilt
   ```

2. **Test in Production Environment**:

   ```bash
   # Test with production API keys
   curl -X POST https://your-app.vercel.app/api/itinerary/generate
   ```

3. **Monitor Vercel Functions**:
   - Check function logs in Vercel dashboard
   - Verify Edge Runtime compatibility
   - Monitor cold start performance

## Success Criteria

**Functional Requirements**:

- ✅ End-to-end workflow completes successfully
- ✅ Generated itineraries match user preferences
- ✅ Real-time progress updates work
- ✅ Error handling gracefully manages failures
- ✅ All Edge Runtime constraints met

**Performance Requirements**:

- ✅ API responds within 500ms
- ✅ Complete workflow finishes within 60 seconds
- ✅ Progress updates have <100ms latency
- ✅ Memory usage stays within Edge Runtime limits

**Quality Requirements**:

- ✅ Itineraries are realistic and feasible
- ✅ Budget calculations are accurate
- ✅ Geographic constraints are respected
- ✅ AI recommendations are relevant and helpful

## Next Steps

After successful quickstart validation:

1. **Run full test suite**: `npm run test`
2. **Deploy to production**: `npm run deploy:prod`
3. **Set up monitoring**: Configure error tracking and performance monitoring
4. **User acceptance testing**: Get feedback from real travel planning scenarios

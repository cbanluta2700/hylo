# Quickstart Guide: AI-Powered Itinerary Generation

**Feature**: 001-ai-powered-personalized  
**Target Audience**: Developers, QA Engineers, Product Managers  
**Estimated Time**: 15-20 minutes

## Overview

This quickstart demonstrates the complete AI-powered itinerary generation workflow, from form submission through multi-agent processing to real-time updates.

## Prerequisites

### Required Environment Variables

```bash
# LLM Services
XAI_API_KEY=xai-your-key-here
GROQ_API_KEY=gsk_your-groq-key

# Search Services
TAVILY_API_KEY=tvly-your-tavily-key
EXA_API_KEY=your-exa-key
SERP_API_KEY=03e23c05a5e2ea27f55cd5329ddae880afbf01ccbb259fbb9ef9bbe1925f388c

# Infrastructure
UPSTASH_VECTOR_REST_URL=https://your-vector-db.upstash.io
UPSTASH_VECTOR_REST_TOKEN=your-vector-token
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Workflow Orchestration
INNGEST_EVENT_KEY=your-inngest-key
INNGEST_SIGNING_KEY=your-signing-key

# Application
NEXTAUTH_SECRET=your-nextauth-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Local Development Setup

```bash
# Install dependencies
npm install

# Verify environment
npm run env:check

# Start development server
npm run dev

# Start Inngest dev server (separate terminal)
npx inngest-cli dev
```

## Test Scenarios

### Scenario 1: Basic Itinerary Generation

**Purpose**: Verify end-to-end generation workflow  
**Expected Time**: 30 seconds

#### Steps:

1. **Submit Form Data**

```bash
curl -X POST http://localhost:3000/api/itinerary/generate \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "destination": "Paris, France",
      "startDate": "2025-06-01",
      "endDate": "2025-06-05",
      "adults": 2,
      "budget": 2500,
      "travelStyle": "cultural",
      "interests": ["museums", "food", "architecture"],
      "aiPreferences": {
        "creativityLevel": "balanced",
        "localInsights": true,
        "realTimeUpdates": true,
        "contentDepth": "detailed"
      },
      "sessionId": "test-session-001"
    },
    "requestType": "initial",
    "priority": "normal"
  }'
```

2. **Expected Response**

```json
{
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "started",
  "estimatedTime": 25,
  "websocketUrl": "ws://localhost:3000/api/itinerary/live?requestId=550e8400-e29b-41d4-a716-446655440000"
}
```

3. **Monitor Progress**

```bash
# Check status
curl http://localhost:3000/api/itinerary/status/550e8400-e29b-41d4-a716-446655440000
```

4. **Verify Completion**

```bash
# Get final itinerary (after ~30 seconds)
curl http://localhost:3000/api/itinerary/550e8400-e29b-41d4-a716-446655440000
```

#### Success Criteria:

- ✅ Request accepted with 202 status
- ✅ Progress updates show each agent phase
- ✅ Complete itinerary generated within 30 seconds
- ✅ Response includes 4-day timeline with activities
- ✅ All agent contributions present in metadata

### Scenario 2: Real-Time Form Updates

**Purpose**: Test reactive itinerary modifications  
**Expected Time**: 10 seconds per update

#### Steps:

1. **Generate Initial Itinerary** (use Scenario 1)

2. **Submit Budget Change**

```bash
curl -X PUT http://localhost:3000/api/itinerary/update \
  -H "Content-Type: application/json" \
  -d '{
    "itineraryId": "generated-itinerary-id",
    "changes": {
      "formData": {
        "budget": 4000
      },
      "specificUpdates": [{
        "field": "budget",
        "oldValue": "2500",
        "newValue": "4000",
        "priority": "high"
      }]
    }
  }'
```

3. **Monitor WebSocket Updates**

```javascript
// Connect to WebSocket for real-time updates
const ws = new WebSocket(
  'ws://localhost:3000/api/itinerary/live?requestId=550e8400-e29b-41d4-a716-446655440000'
);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Real-time update:', message);
};
```

#### Success Criteria:

- ✅ Budget change triggers selective updates
- ✅ WebSocket receives `form_change` message
- ✅ Accommodation recommendations upgrade to luxury
- ✅ Activity suggestions include premium options
- ✅ Update completes within 10 seconds

### Scenario 3: Multi-Agent Workflow Validation

**Purpose**: Verify each agent's contribution  
**Expected Time**: 30 seconds

#### Steps:

1. **Submit Complex Request**

```bash
curl -X POST http://localhost:3000/api/itinerary/generate \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "destination": "Tokyo, Japan",
      "startDate": "2025-09-15",
      "endDate": "2025-09-22",
      "adults": 2,
      "children": 1,
      "budget": 5000,
      "travelStyle": "adventure",
      "interests": ["technology", "anime", "traditional culture", "food"],
      "dietaryRestrictions": ["vegetarian"],
      "accessibility": ["wheelchair"],
      "aiPreferences": {
        "creativityLevel": "adventurous",
        "localInsights": true,
        "contentDepth": "comprehensive"
      }
    },
    "requestType": "initial",
    "priority": "high"
  }'
```

2. **Verify Agent Execution**

```bash
# Monitor agent status
curl http://localhost:3000/api/agents/status

# Check individual contributions in final result
curl http://localhost:3000/api/itinerary/{itinerary-id}
```

#### Success Criteria:

- ✅ **Itinerary Architect**: Creates 7-day structure with themes
- ✅ **Web Gatherer**: Finds current pricing and availability
- ✅ **Information Specialist**: Adds cultural context and local insights
- ✅ **Form Putter**: Handles dietary and accessibility requirements
- ✅ All agents complete successfully with confidence > 0.8

### Scenario 4: Error Handling & Fallbacks

**Purpose**: Test system resilience  
**Expected Time**: 15 seconds

#### Steps:

1. **Submit Invalid Data**

```bash
curl -X POST http://localhost:3000/api/itinerary/generate \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "destination": "",
      "startDate": "2025-13-45",
      "adults": -1,
      "budget": "invalid"
    }
  }'
```

2. **Expected Error Response**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid form data provided",
    "details": [
      "destination: cannot be empty",
      "startDate: invalid date format",
      "adults: must be positive integer",
      "budget: must be numeric"
    ]
  },
  "timestamp": "2025-09-20T15:30:00Z"
}
```

3. **Test Service Degradation**

```bash
# Temporarily disable external APIs to test fallbacks
# Should gracefully degrade with cached recommendations
```

#### Success Criteria:

- ✅ Input validation prevents invalid requests
- ✅ Clear error messages for all validation failures
- ✅ System maintains functionality when external APIs fail
- ✅ Cached/default recommendations provided as fallback

## WebSocket Testing

### Real-Time Update Flow

1. **Connect to WebSocket**

```javascript
const ws = new WebSocket(
  'ws://localhost:3000/api/itinerary/live?requestId=test-001&sessionId=session-001'
);

// Handle connection
ws.onopen = () => {
  console.log('Connected to real-time updates');

  // Subscribe to all update types
  ws.send(
    JSON.stringify({
      type: 'subscribe',
      requestId: 'test-001',
      subscriptions: ['progress', 'agents', 'partial_results', 'form_changes'],
    })
  );
};

// Handle messages
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(`[${message.type}]`, message);
};
```

2. **Expected Message Sequence**

```
1. connection_ack - WebSocket ready
2. progress - Initial processing (0%)
3. agent_status - Web Gatherer started
4. progress - Research phase (25%)
5. partial_result - Accommodation options found
6. agent_status - Itinerary Architect started
7. progress - Planning phase (50%)
8. partial_result - Daily schedule draft
9. agent_status - Information Specialist started
10. progress - Enrichment phase (75%)
11. partial_result - Cultural insights added
12. agent_status - Form Putter validation
13. progress - Formatting phase (100%)
14. completion - Final itinerary ready
```

## Performance Validation

### Benchmarks to Verify

```bash
# Generation time
time curl -X POST http://localhost:3000/api/itinerary/generate -d @test-data.json

# Update responsiveness
time curl -X PUT http://localhost:3000/api/itinerary/update -d @update-data.json

# Concurrent requests
ab -n 100 -c 10 -T application/json -p test-data.json http://localhost:3000/api/itinerary/generate
```

**Expected Performance**:

- Initial generation: < 30 seconds
- Real-time updates: < 10 seconds
- UI responsiveness: < 3 seconds
- Concurrent capacity: 10 requests/second

## Troubleshooting

### Common Issues

1. **Generation Timeout**

   - Check agent status: `GET /api/agents/status`
   - Verify API keys in environment
   - Monitor Inngest dashboard for workflow errors

2. **WebSocket Connection Failed**

   - Verify `requestId` and `sessionId` are valid UUIDs
   - Check rate limiting (max 5 connections per session)
   - Try polling fallback endpoint

3. **Poor Recommendations Quality**

   - Check agent confidence scores in metadata
   - Verify search services returning results
   - Review form data completeness

4. **Real-Time Updates Not Working**
   - Confirm WebSocket subscription sent
   - Check form change detection triggers
   - Monitor message rate limits (1/second for form changes)

### Debug Commands

```bash
# Check service health
curl http://localhost:3000/api/agents/status

# View Inngest workflow logs
open https://app.inngest.com/apps/hylo/functions

# Monitor Redis state
redis-cli -u $UPSTASH_REDIS_REST_URL KEYS "*session*"

# Check Vector embeddings
curl -X GET $UPSTASH_VECTOR_REST_URL/query \
  -H "Authorization: Bearer $UPSTASH_VECTOR_REST_TOKEN"
```

## Acceptance Criteria

### ✅ Functional Requirements Validation

- [x] FR-001: Generate personalized itineraries from form data
- [x] FR-002: Complete generation within 30 seconds
- [x] FR-003: Real-time updates within 10 seconds
- [x] FR-004: Include accommodation, dining, activities, transportation
- [x] FR-005: Respect budget constraints
- [x] FR-006: Handle special preferences and restrictions
- [x] FR-007: Provide alternatives when needed
- [x] FR-008: Multi-LLM integration (xAI + Groq)
- [x] FR-009: Web research integration (Tavily + Exa)
- [x] FR-010: Handle concurrent requests
- [x] FR-011: Store generated itineraries
- [x] FR-012: Fallback when services unavailable
- [x] FR-013: Validate form completeness
- [x] FR-014: Show progress indicators
- [x] FR-015: Save, modify, and share itineraries

### ✅ Technical Requirements

- [x] TypeScript strict mode compilation
- [x] React Hook Form integration
- [x] Zod validation schemas
- [x] Vercel Edge Runtime compatibility
- [x] WebSocket real-time communication
- [x] Multi-agent workflow orchestration
- [x] Vector similarity caching
- [x] Error handling and fallbacks

---

**Next Steps**: After successful quickstart validation, proceed to `/tasks` command for implementation task generation.

**Support**: For issues during quickstart execution, check the troubleshooting section or review agent logs in Inngest dashboard.

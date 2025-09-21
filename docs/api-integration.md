# API Integration Documentation

## Overview

This document provides comprehensive documentation for the Hylo Travel AI Platform API integrations, including agent endpoints, data formats, authentication, and usage examples.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Endpoints](#api-endpoints)
3. [Data Models](#data-models)
4. [Authentication](#authentication)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Monitoring & Observability](#monitoring--observability)
8. [Integration Examples](#integration-examples)

## Architecture Overview

The Hylo Travel AI Platform uses a multi-agent architecture with the following components:

- **Itinerary Architect**: Plans overall trip structure and flow
- **Web Information Gatherer**: Collects real-time travel data from web sources
- **Information Specialist**: Analyzes and synthesizes travel information
- **Form Data Putter**: Structures and validates form data for AI consumption

### Request Flow

```
Client Request → Edge Function → Agent Orchestration → AI Processing → Response
```

### Data Flow

```
Form Data → Smart Queries → Agent Processing → Synthesis → Formatted Output
```

## API Endpoints

### Base URL

```
https://your-project.vercel.app/api
```

### Itinerary Generation

#### POST `/api/itinerary/generate`

Generates a complete travel itinerary based on user form data.

**Request Body:**

```typescript
{
  "title": "Paris Adventure 2025",
  "destination": "Paris, France",
  "duration": {
    "days": 7,
    "nights": 6,
    "startDate": "2025-06-15",
    "endDate": "2025-06-22"
  },
  "travelers": {
    "adults": 2,
    "children": 0,
    "total": 2
  },
  "budget": {
    "total": 3500,
    "currency": "USD",
    "breakdown": {
      "accommodations": 1400,
      "transportation": 600,
      "activities": 700,
      "dining": 800,
      "miscellaneous": 0
    }
  },
  "preferences": {
    "accommodations": ["luxury", "boutique"],
    "transportation": ["public", "taxi"],
    "activities": ["sightseeing", "culture"],
    "dining": ["local", "fine"]
  },
  "constraints": {
    "accessibility": false,
    "dietary": [],
    "budgetFlexibility": "medium"
  }
}
```

**Response:**

```typescript
{
  "success": true,
  "data": {
    "id": "itinerary_12345",
    "title": "Paris Adventure 2025",
    "destination": "Paris, France",
    "duration": "7 days",
    "travelers": "2 travelers",
    "budget": "$3,500 USD",
    "sections": [
      {
        "id": "header",
        "title": "Trip Overview",
        "content": "Paris Adventure 2025\nParis, France\n7 days, 2 travelers",
        "priority": 1
      },
      {
        "id": "accommodations",
        "title": "Accommodations",
        "content": "🏨 Hotel Ritz Paris\n   Luxury hotel in Place Vendôme\n   $800/night × 7 nights = $5,600",
        "priority": 2
      }
    ],
    "metadata": {
      "generatedAt": "2025-01-15T10:00:00Z",
      "version": "1.0.0",
      "confidence": 0.95,
      "processingTime": 25000
    }
  },
  "processingTime": 25000
}
```

**Error Response:**

```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid destination format",
    "details": {
      "field": "destination",
      "value": "",
      "expected": "City, Country format"
    }
  },
  "processingTime": 150
}
```

### Agent Endpoints

#### POST `/api/agents/architect`

Direct access to the Itinerary Architect agent.

**Request Body:**

```typescript
{
  "query": "Plan a 7-day cultural trip to Paris for 2 adults",
  "context": {
    "destination": "Paris, France",
    "duration": 7,
    "travelers": 2,
    "budget": 3500
  },
  "format": "structured"
}
```

#### POST `/api/agents/gatherer`

Direct access to the Web Information Gatherer agent.

**Request Body:**

```typescript
{
  "queries": [
    {
      "query": "Paris hotels luxury couple 7 nights",
      "type": "accommodations",
      "priority": "high"
    }
  ],
  "sources": ["booking.com", "hotels.com"],
  "maxResults": 10
}
```

#### POST `/api/agents/specialist`

Direct access to the Information Specialist agent.

**Request Body:**

```typescript
{
  "topic": "Paris travel guide 2025",
  "analysis": "best time to visit, crowd levels, budget breakdown",
  "context": {
    "season": "summer",
    "groupSize": 2,
    "interests": ["culture", "food"]
  }
}
```

#### POST `/api/agents/putter`

Direct access to the Form Data Putter agent.

**Request Body:**

```typescript
{
  "formData": {
    "destination": "Paris, France",
    "dates": "2025-06-15 to 2025-06-22",
    "travelers": "2 adults",
    "budget": "$3500"
  },
  "validation": true,
  "enhancement": true
}
```

### Health Check

#### GET `/api/health`

Returns the health status of the API and its dependencies.

**Response:**

```typescript
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "ai_providers": {
      "cerebras": "healthy",
      "google_gemini": "healthy",
      "groq": "healthy"
    },
    "external_apis": {
      "serpapi": "healthy",
      "weather_api": "healthy"
    }
  },
  "metrics": {
    "uptime": "99.9%",
    "average_response_time": 2500,
    "total_requests": 15420
  }
}
```

### Metrics

#### GET `/api/metrics`

Returns performance and usage metrics (admin only).

**Response:**

```typescript
{
  "period": "24h",
  "requests": {
    "total": 15420,
    "successful": 15200,
    "failed": 220,
    "average_response_time": 2500
  },
  "agents": {
    "architect": { "requests": 3855, "avg_time": 28000 },
    "gatherer": { "requests": 7710, "avg_time": 3200 },
    "specialist": { "requests": 1928, "avg_time": 4500 },
    "putter": { "requests": 1927, "avg_time": 1800 }
  },
  "errors": {
    "rate": 0.014,
    "by_type": {
      "VALIDATION_ERROR": 120,
      "AI_PROVIDER_ERROR": 45,
      "NETWORK_ERROR": 35,
      "TIMEOUT_ERROR": 20
    }
  }
}
```

## Data Models

### Core Types

#### ItineraryRequest

```typescript
interface ItineraryRequest {
  title: string;
  destination: string;
  duration: {
    days: number;
    nights: number;
    startDate: string;
    endDate: string;
  };
  travelers: {
    adults: number;
    children: number;
    total: number;
  };
  budget?: {
    total: number;
    currency: string;
    breakdown?: {
      accommodations: number;
      transportation: number;
      activities: number;
      dining: number;
      miscellaneous: number;
    };
  };
  preferences?: {
    accommodations?: string[];
    transportation?: string[];
    activities?: string[];
    dining?: string[];
  };
  constraints?: {
    accessibility?: boolean;
    dietary?: string[];
    budgetFlexibility?: 'low' | 'medium' | 'high';
  };
}
```

#### ItineraryResponse

```typescript
interface ItineraryResponse {
  success: boolean;
  data?: {
    id: string;
    title: string;
    destination: string;
    duration: string;
    travelers: string;
    budget: string;
    sections: FormattedSection[];
    metadata: {
      generatedAt: string;
      version: string;
      confidence: number;
      processingTime: number;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  processingTime: number;
}
```

#### FormattedSection

```typescript
interface FormattedSection {
  id: string;
  title: string;
  content: string;
  priority: number;
  collapsible?: boolean;
  metadata?: Record<string, any>;
}
```

### Agent Types

#### AgentQuery

```typescript
interface AgentQuery {
  id: string;
  type: 'flights' | 'accommodations' | 'activities' | 'dining' | 'general';
  query: string;
  priority: 'high' | 'medium' | 'low';
  agent: 'architect' | 'gatherer' | 'specialist' | 'putter';
  context?: Record<string, any>;
  maxResults?: number;
}
```

#### AgentResponse

```typescript
interface AgentResponse {
  success: boolean;
  data?: any;
  confidence: number;
  processingTime: number;
  metadata: {
    agentType: string;
    queryId: string;
    sources?: string[];
    tokensUsed?: number;
  };
}
```

## Authentication

### API Key Authentication

Include your API key in the request headers:

```
Authorization: Bearer your-api-key-here
X-API-Key: your-api-key-here
```

### Rate Limiting

- **Free Tier**: 100 requests/day
- **Pro Tier**: 10,000 requests/day
- **Enterprise**: Unlimited

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Error Handling

### Error Codes

| Code                   | Description                | HTTP Status |
| ---------------------- | -------------------------- | ----------- |
| `VALIDATION_ERROR`     | Invalid request data       | 400         |
| `AUTHENTICATION_ERROR` | Invalid or missing API key | 401         |
| `AUTHORIZATION_ERROR`  | Insufficient permissions   | 403         |
| `NOT_FOUND_ERROR`      | Resource not found         | 404         |
| `RATE_LIMIT_ERROR`     | Rate limit exceeded        | 429         |
| `AI_PROVIDER_ERROR`    | AI service unavailable     | 502         |
| `NETWORK_ERROR`        | External service error     | 502         |
| `TIMEOUT_ERROR`        | Request timeout            | 504         |
| `INTERNAL_ERROR`       | Server error               | 500         |

### Error Response Format

```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid destination format",
    "details": {
      "field": "destination",
      "expected": "City, Country format",
      "received": "Paris"
    },
    "suggestion": "Please provide destination in 'City, Country' format"
  },
  "processingTime": 150
}
```

## Rate Limiting

### Limits by Endpoint

| Endpoint                  | Free Tier | Pro Tier  | Enterprise |
| ------------------------- | --------- | --------- | ---------- |
| `/api/itinerary/generate` | 10/day    | 1000/day  | Unlimited  |
| `/api/agents/*`           | 50/day    | 5000/day  | Unlimited  |
| `/api/health`             | Unlimited | Unlimited | Unlimited  |
| `/api/metrics`            | 10/day    | 100/day   | Unlimited  |

### Burst Limits

- **Burst Limit**: 10 requests per minute
- **Sustained Limit**: Distributed evenly across the time window

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
Retry-After: 60
```

## Monitoring & Observability

### Logging

All API requests are logged with the following information:

- Request ID
- Timestamp
- Endpoint
- Response time
- Status code
- User agent
- IP address (anonymized)

### Metrics

Key metrics tracked:

- **Request Volume**: Total requests per endpoint per hour
- **Response Times**: P50, P95, P99 percentiles
- **Error Rates**: By endpoint and error type
- **AI Usage**: Tokens consumed, model usage
- **Resource Usage**: Memory, CPU utilization

### Alerts

Automated alerts for:

- Error rate > 5%
- Response time > 30 seconds (generation), > 10 seconds (updates)
- AI provider failures
- Rate limit violations

## Integration Examples

### JavaScript/Node.js

```javascript
const generateItinerary = async (formData) => {
  const response = await fetch('/api/itinerary/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API Error: ${error.error.message}`);
  }

  return await response.json();
};

// Usage
const itinerary = await generateItinerary({
  title: 'Paris Trip',
  destination: 'Paris, France',
  duration: { days: 7, nights: 6, startDate: '2025-06-15', endDate: '2025-06-22' },
  travelers: { adults: 2, children: 0, total: 2 },
  budget: { total: 3500, currency: 'USD' },
});
```

### Python

```python
import requests
import json

def generate_itinerary(form_data, api_key):
    url = "https://your-project.vercel.app/api/itinerary/generate"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    response = requests.post(url, headers=headers, data=json.dumps(form_data))

    if response.status_code != 200:
        error = response.json()
        raise Exception(f"API Error: {error['error']['message']}")

    return response.json()

# Usage
itinerary = generate_itinerary({
    "title": "Paris Trip",
    "destination": "Paris, France",
    "duration": {
        "days": 7,
        "nights": 6,
        "startDate": "2025-06-15",
        "endDate": "2025-06-22"
    },
    "travelers": {
        "adults": 2,
        "children": 0,
        "total": 2
    },
    "budget": {
        "total": 3500,
        "currency": "USD"
    }
}, "your-api-key")
```

### cURL

```bash
curl -X POST "https://your-project.vercel.app/api/itinerary/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "title": "Paris Trip",
    "destination": "Paris, France",
    "duration": {
      "days": 7,
      "nights": 6,
      "startDate": "2025-06-15",
      "endDate": "2025-06-22"
    },
    "travelers": {
      "adults": 2,
      "children": 0,
      "total": 2
    },
    "budget": {
      "total": 3500,
      "currency": "USD"
    }
  }'
```

### React Hook

```typescript
import { useState, useCallback } from 'react';

interface UseItineraryGenerationOptions {
  apiKey: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const useItineraryGeneration = ({
  apiKey,
  onSuccess,
  onError,
}: UseItineraryGenerationOptions) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateItinerary = useCallback(
    async (formData: any) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/itinerary/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Generation failed');
        }

        onSuccess?.(data);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [apiKey, onSuccess, onError]
  );

  return { generateItinerary, loading, error };
};

// Usage in component
const MyComponent = () => {
  const { generateItinerary, loading, error } = useItineraryGeneration({
    apiKey: 'your-api-key',
    onSuccess: (data) => console.log('Itinerary generated:', data),
    onError: (error) => console.error('Generation failed:', error),
  });

  const handleGenerate = async () => {
    try {
      await generateItinerary({
        title: 'Paris Trip',
        destination: 'Paris, France',
        duration: { days: 7, nights: 6, startDate: '2025-06-15', endDate: '2025-06-22' },
        travelers: { adults: 2, children: 0, total: 2 },
        budget: { total: 3500, currency: 'USD' },
      });
    } catch (err) {
      // Error already handled by hook
    }
  };

  return (
    <button onClick={handleGenerate} disabled={loading}>
      {loading ? 'Generating...' : 'Generate Itinerary'}
    </button>
  );
};
```

## Webhook Integration

For asynchronous processing or real-time updates:

```typescript
// Setup webhook endpoint
app.post('/webhooks/itinerary-updates', (req, res) => {
  const { event, data } = req.body;

  switch (event) {
    case 'itinerary.generated':
      // Handle successful generation
      updateUI(data.itinerary);
      break;
    case 'itinerary.failed':
      // Handle generation failure
      showError(data.error);
      break;
    case 'itinerary.progress':
      // Handle progress updates
      updateProgress(data.progress);
      break;
  }

  res.status(200).send('OK');
});

// Register webhook
await fetch('/api/webhooks/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    url: 'https://your-app.com/webhooks/itinerary-updates',
    events: ['itinerary.generated', 'itinerary.failed', 'itinerary.progress'],
  }),
});
```

## Best Practices

### Request Optimization

1. **Batch Requests**: Combine multiple related queries into single requests
2. **Caching**: Cache frequently requested data (hotel lists, activity catalogs)
3. **Compression**: Use gzip compression for large payloads
4. **Pagination**: Use pagination for large result sets

### Error Handling

1. **Retry Logic**: Implement exponential backoff for transient errors
2. **Circuit Breakers**: Implement circuit breakers for failing services
3. **Fallbacks**: Provide fallback responses for degraded service states
4. **Monitoring**: Monitor error rates and alert on anomalies

### Performance

1. **Connection Pooling**: Reuse connections to reduce latency
2. **Async Processing**: Use async processing for long-running operations
3. **Caching Strategy**: Implement multi-level caching (memory, Redis, CDN)
4. **Load Balancing**: Distribute load across multiple instances

### Security

1. **Input Validation**: Validate all inputs on client and server
2. **Rate Limiting**: Implement proper rate limiting
3. **Authentication**: Use secure authentication mechanisms
4. **Encryption**: Encrypt sensitive data in transit and at rest

## Troubleshooting

### Common Issues

#### High Response Times

**Symptoms**: Requests taking longer than 30 seconds

**Causes**:

- AI provider rate limiting
- Large query complexity
- Network latency
- Resource constraints

**Solutions**:

- Reduce query complexity
- Implement request queuing
- Use faster AI models
- Optimize network routing

#### Rate Limit Errors

**Symptoms**: 429 status codes

**Causes**:

- Exceeding plan limits
- Burst traffic
- API key issues

**Solutions**:

- Implement request throttling
- Upgrade plan
- Use request queuing
- Verify API key

#### Validation Errors

**Symptoms**: 400 status codes with validation messages

**Causes**:

- Invalid data format
- Missing required fields
- Incorrect field types

**Solutions**:

- Check API documentation
- Validate data before sending
- Use proper data types
- Handle error messages

#### AI Provider Errors

**Symptoms**: 502 status codes

**Causes**:

- AI service outages
- Model unavailability
- Token limits exceeded

**Solutions**:

- Implement retry logic
- Use fallback providers
- Monitor provider status
- Reduce token usage

## Support

### Getting Help

1. **Documentation**: Check this API documentation first
2. **Status Page**: Check https://status.hylo.ai for service status
3. **Community**: Join our Discord community for peer support
4. **Support Ticket**: Create a ticket at https://support.hylo.ai

### Contact Information

- **Email**: api-support@hylo.ai
- **Discord**: https://discord.gg/hylo
- **Status Page**: https://status.hylo.ai
- **Documentation**: https://docs.hylo.ai

---

_Last Updated: September 21, 2025_
_Version: 1.0.0_

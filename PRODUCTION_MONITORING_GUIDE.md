# Production Monitoring and Observability Guide

## 📊 **Monitoring Endpoints**

### Health Monitoring

```bash
# System health check
GET /api/monitoring/health
# Response: Overall system health + individual component status

# Comprehensive metrics
GET /api/monitoring/metrics
# Response: Workflow counts, success rates, performance metrics

# Real-time dashboard data
GET /api/monitoring/dashboard
# Response: Live performance data for monitoring dashboards
```

### Alert Management

```bash
# View alert configuration
GET /api/monitoring/alerts

# Update alert thresholds
POST /api/monitoring/alerts
Content-Type: application/json
{
  "errorRateThreshold": 5,
  "responseTimeThreshold": 30000,
  "successRateThreshold": 95
}
```

### Error Reporting

```bash
# Report errors (used internally by system)
POST /api/monitoring/errors
Content-Type: application/json
{
  "type": "workflow_error",
  "message": "Error description",
  "workflowId": "wf_123...",
  "timestamp": "2024-07-15T12:00:00Z"
}
```

## 🔍 **Key Metrics Tracked**

### Workflow Performance

- **Total Workflows**: Complete workflow execution count
- **Success Rate**: Percentage of workflows completing successfully
- **Average Execution Time**: Mean time from start to completion
- **Error Rate**: Percentage of workflows failing
- **Active Workflows**: Currently processing workflows

### AI Provider Health

- **XAI Grok API**: Response time, success rate, error types
- **Groq API**: Response time, success rate, error types
- **Fallback Usage**: When secondary providers are used

### Infrastructure Health

- **Redis/KV Storage**: Connection status, response time, memory usage
- **Inngest Functions**: Function count, queue length, execution rate
- **Edge Runtime**: Feature availability, compatibility checks

### Error Monitoring

- **Error Categories**: Network, AI Provider, Validation, Timeout, System
- **Error Distribution**: By stage (architect, gatherer, specialist, formatter)
- **Recovery Success**: Automatic retry and recovery rates

## 🚨 **Alert Configuration**

### Default Alert Thresholds

```typescript
{
  errorRateThreshold: 5,      // Alert if >5% error rate
  responseTimeThreshold: 30000, // Alert if >30 seconds average
  successRateThreshold: 95,   // Alert if <95% success rate
  notificationChannels: ['email', 'slack', 'webhook']
}
```

### Alert Scenarios

- **High Error Rate**: >5% of workflows failing
- **Slow Performance**: Average execution time >30 seconds
- **AI Provider Down**: Primary or secondary API unavailable
- **Infrastructure Issues**: Redis connectivity problems
- **Function Failures**: Inngest function execution errors

## 📈 **Production Dashboards**

### Real-Time Dashboard

Access comprehensive monitoring dashboard with:

- Live workflow status and progress
- AI provider health indicators
- Performance metrics and trends
- Error rates and recovery statistics
- Infrastructure status overview

### Key Performance Indicators (KPIs)

1. **Workflow Success Rate**: Target >95%
2. **Average Response Time**: Target <20 seconds
3. **AI Provider Uptime**: Target >99.9%
4. **Error Recovery Rate**: Target >90%
5. **User Satisfaction**: Based on completion rates

## 🔧 **Operational Procedures**

### Health Check Routine

```bash
# Daily health verification
curl https://your-domain.vercel.app/api/monitoring/health

# Expected healthy response:
{
  "status": "healthy",
  "summary": {
    "overallStatus": "healthy",
    "healthyChecks": 4,
    "totalChecks": 4,
    "healthPercentage": 100
  }
}
```

### Performance Monitoring

```bash
# Weekly performance review
curl https://your-domain.vercel.app/api/monitoring/metrics

# Monitor for:
# - Success rate trends
# - Response time increases
# - Error pattern changes
# - AI provider performance
```

### Incident Response

1. **Alert Received**: Check `/api/monitoring/health` for status
2. **Component Down**: Follow specific recovery procedures:
   - **AI Provider**: Verify API keys, check provider status
   - **Redis**: Check Upstash console, verify credentials
   - **Inngest**: Check function registration and execution logs
3. **Recovery Actions**: Document and update procedures

## 🛠️ **Troubleshooting Guide**

### Common Issues

#### AI Provider Errors

```bash
# Symptoms: High error rates in architect/specialist stages
# Check: XAI API key validity
curl -H "Authorization: Bearer $XAI_API_KEY" https://api.x.ai/v1/models

# Check: Groq API key validity
curl -H "Authorization: Bearer $GROQ_API_KEY" https://api.groq.com/openai/v1/models

# Solutions:
# - Verify API keys in Vercel dashboard
# - Check provider status pages
# - Implement temporary rate limiting
```

#### Redis Connection Issues

```bash
# Symptoms: Session creation/retrieval failures
# Check: Redis connectivity
curl -H "Authorization: Bearer $KV_REST_API_TOKEN" "$KV_REST_API_URL/ping"

# Solutions:
# - Verify Upstash Redis credentials
# - Check network connectivity
# - Review Redis memory usage
```

#### Inngest Function Problems

```bash
# Symptoms: Workflows not starting or stalling
# Check: Function registration
curl https://your-domain.vercel.app/api/inngest

# Solutions:
# - Verify INNGEST_SIGNING_KEY
# - Check Inngest dashboard for errors
# - Review function execution logs
```

#### Performance Degradation

```bash
# Symptoms: Slow response times, timeouts
# Check: Current performance metrics
curl https://your-domain.vercel.app/api/monitoring/metrics

# Solutions:
# - Analyze slowest workflow stages
# - Check AI provider response times
# - Review Redis latency
# - Consider load balancing strategies
```

## 📋 **Monitoring Checklist**

### Daily Operations

- [ ] Review overnight health check results
- [ ] Check error rate trends (target <2%)
- [ ] Verify AI provider response times
- [ ] Monitor workflow completion rates
- [ ] Review alert notifications

### Weekly Analysis

- [ ] Analyze performance trends
- [ ] Review error patterns and types
- [ ] Check infrastructure utilization
- [ ] Update alert thresholds if needed
- [ ] Document any incidents and resolutions

### Monthly Review

- [ ] Comprehensive performance analysis
- [ ] Capacity planning assessment
- [ ] Alert configuration optimization
- [ ] Documentation updates
- [ ] Team training on new procedures

## 🔗 **Integration Points**

### Vercel Analytics

- Access via Vercel dashboard
- Function execution metrics
- Edge Runtime performance data
- Geographic usage patterns

### Upstash Redis Console

- Memory usage tracking
- Connection analytics
- Performance metrics
- Data structure insights

### Inngest Dashboard

- Function execution logs
- Event processing metrics
- Error tracking and debugging
- Queue management

### AI Provider Consoles

- **XAI Console**: Usage analytics, rate limits
- **Groq Console**: Request metrics, performance data

---

## 🆘 **Emergency Contacts and Procedures**

### Escalation Path

1. **Level 1**: Automated alerts and monitoring
2. **Level 2**: On-call developer response
3. **Level 3**: Team lead and infrastructure support
4. **Level 4**: External provider support contacts

### Support Resources

- **Vercel Support**: https://vercel.com/support
- **Inngest Support**: https://inngest.com/support
- **Upstash Support**: https://upstash.com/support
- **XAI Support**: https://console.x.ai/support
- **Groq Support**: https://console.groq.com/support

**Monitor continuously, respond quickly, improve constantly! 📊**

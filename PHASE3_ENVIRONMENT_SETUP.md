# Phase 3: Environment Configuration & Production Setup Guide

## 🔐 **Required Environment Variables**

### Production Environment Variables Checklist

#### **AI Provider APIs**

```bash
# XAI Grok API (Primary reasoning model)
XAI_API_KEY=xai-your-api-key-here

# Groq API (Fast inference model)
GROQ_API_KEY=gsk_your-groq-api-key-here
```

#### **Inngest Workflow Engine**

```bash
# Inngest signing key for webhook security
INNGEST_SIGNING_KEY=signkey_your-inngest-signing-key
```

#### **Redis/KV Storage (Upstash)**

```bash
# Upstash Redis REST API URL
KV_REST_API_URL=https://your-region-redis.upstash.io

# Upstash Redis REST API token
KV_REST_API_TOKEN=your-upstash-redis-token
```

#### **Optional Environment Variables**

```bash
# Node environment (auto-set by Vercel)
NODE_ENV=production

# Vercel environment (auto-set by Vercel)
VERCEL_ENV=production

# Additional API keys for future expansion
OPENAI_API_KEY=sk-your-openai-key (optional)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key (optional)
```

## 🚀 **Vercel Production Setup**

### Step 1: Environment Variables in Vercel Dashboard

1. **Navigate to Vercel Dashboard**

   - Go to: https://vercel.com/dashboard
   - Select your project: `hylo`

2. **Add Environment Variables**
   - Go to **Settings** → **Environment Variables**
   - Add each variable above with their production values
   - Set **Environment**: `Production`, `Preview`, `Development` (check all)

### Step 2: API Key Setup Instructions

#### **XAI Grok API Key**

1. Visit: https://console.x.ai/
2. Create account or sign in
3. Navigate to **API Keys** section
4. Create new API key for production
5. Copy key starting with `xai-`

#### **Groq API Key**

1. Visit: https://console.groq.com/
2. Create account or sign in
3. Go to **API Keys** section
4. Generate new API key
5. Copy key starting with `gsk_`

#### **Inngest Signing Key**

1. Visit: https://app.inngest.com/
2. Sign in to your account
3. Go to **Settings** → **Keys**
4. Copy your signing key starting with `signkey_`

#### **Upstash Redis Setup**

1. Visit: https://console.upstash.com/
2. Create account or sign in
3. Create new Redis database:
   - **Name**: `hylo-production`
   - **Region**: Choose closest to your users
   - **Type**: Pay as you go (recommended)
4. Copy **REST API URL** and **REST API Token**

### Step 3: Vercel Deployment Configuration

#### **vercel.json Configuration**

```json
{
  "functions": {
    "api/inngest/index.ts": {
      "maxDuration": 300
    },
    "api/itinerary/*.ts": {
      "maxDuration": 60
    }
  },
  "rewrites": [
    {
      "source": "/api/inngest",
      "destination": "/api/inngest/index"
    }
  ]
}
```

#### **Deployment Commands**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to preview (staging)
vercel deploy

# Deploy to production
vercel deploy --prod

# Check deployment status
vercel ls
```

## 🧪 **Environment Validation Endpoints**

### Test Environment Setup

```bash
# Test development environment
curl https://your-domain.vercel.app/api/test/dev-server-validation

# Test production environment
curl https://your-domain.vercel.app/api/test/production-validation

# Test environment variables
curl https://your-domain.vercel.app/api/validate-env
```

### Expected Validation Results

```json
{
  "status": "✅ PRODUCTION READY",
  "summary": {
    "total": 6,
    "passed": 6,
    "warnings": 0,
    "failed": 0,
    "readinessPercentage": 100
  }
}
```

## ⚠️ **Common Environment Issues & Solutions**

### Issue: XAI API Key Invalid

```bash
# Error: "XAI API key not found or invalid"
# Solution:
1. Check key format starts with 'xai-'
2. Verify key is active in XAI console
3. Test key with curl:
curl -H "Authorization: Bearer xai-your-key" https://api.x.ai/v1/models
```

### Issue: Redis Connection Failed

```bash
# Error: "Redis connection failed"
# Solution:
1. Verify URL format: https://region-name-12345.upstash.io
2. Check token is not URL-encoded
3. Test connection:
curl -H "Authorization: Bearer your-token" "your-redis-url/ping"
```

### Issue: Inngest Functions Not Registering

```bash
# Error: "No functions discovered"
# Solution:
1. Check INNGEST_SIGNING_KEY is set
2. Verify /api/inngest endpoint returns function list
3. Check Inngest dashboard: https://app.inngest.com/
```

### Issue: Edge Runtime Import Errors

```bash
# Error: "Cannot use require() in Edge Runtime"
# Solution:
1. Ensure all imports use .js extensions
2. Check for Node.js built-ins usage
3. Use dynamic imports for heavy modules
```

## 📊 **Production Monitoring Setup**

### Vercel Analytics

```bash
# Enable in Vercel dashboard:
# Settings → Analytics → Enable
```

### Error Monitoring

```typescript
// Automatic error reporting configured in:
// - api/monitoring/errors endpoint
// - Enhanced error handling system
// - ErrorBoundary components
```

### Performance Monitoring

```bash
# Monitor through:
# - Vercel Functions dashboard
# - Inngest execution logs
# - Redis/KV metrics in Upstash console
```

## ✅ **Production Readiness Checklist**

### Before Deployment

- [ ] All environment variables set in Vercel dashboard
- [ ] API keys tested and validated
- [ ] Redis database created and accessible
- [ ] Inngest account configured with signing key
- [ ] vercel.json configuration updated
- [ ] TypeScript compilation passes
- [ ] All validation endpoints return success

### After Deployment

- [ ] Functions register correctly in Inngest dashboard
- [ ] Test workflow with real API calls
- [ ] Progress reporting works via SSE
- [ ] Error handling triggers correctly
- [ ] Performance metrics look healthy
- [ ] User-facing functionality works end-to-end

### Production Health Checks

```bash
# Run these after deployment:
curl https://your-domain.vercel.app/api/health
curl https://your-domain.vercel.app/api/status
curl https://your-domain.vercel.app/api/test/production-validation
```

---

## 🆘 **Troubleshooting Commands**

```bash
# Check Vercel logs
vercel logs your-deployment-url

# Test environment variables locally
vercel env ls

# Pull production environment to local
vercel env pull .env.local

# Check function build output
vercel build

# Test Edge Runtime locally
vercel dev --debug
```

## 📞 **Support Resources**

- **Vercel Docs**: https://vercel.com/docs
- **Inngest Docs**: https://inngest.com/docs
- **XAI Console**: https://console.x.ai/
- **Groq Console**: https://console.groq.com/
- **Upstash Console**: https://console.upstash.com/

---

**Ready to deploy to production? Follow this guide step by step! 🚀**

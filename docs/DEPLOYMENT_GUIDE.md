# Hylo Deployment Configuration Guide

## Overview

This guide covers complete deployment configuration for the Hylo Travel AI Platform, including environment setup, infrastructure requirements, feature flags, and production considerations.

## Environment Variables

### Core Configuration

Create a `.env.local` file (development) or configure in your deployment platform:

```bash
# ==========================================
# CORE APPLICATION SETTINGS
# ==========================================

# Application Environment
NODE_ENV=production
APP_VERSION=2.0.0
APP_URL=https://your-app.vercel.app

# Debug and Logging
DEBUG=false
VERBOSE_LOGGING=false
LOG_LEVEL=info

# ==========================================
# AI PROVIDER CONFIGURATIONS
# ==========================================

# Cerebras (Primary LLM Provider)
CEREBRAS_API_KEY=your_cerebras_api_key_here
CEREBRAS_BASE_URL=https://api.cerebras.ai/v1
CEREBRAS_MODEL=llama3.1-70b
CEREBRAS_TIMEOUT=30000

# Google Gemini (Secondary Provider)
GOOGLE_GENAI_API_KEY=your_google_gemini_api_key_here
GOOGLE_MODEL=gemini-pro
GOOGLE_TEMPERATURE=0.7
GOOGLE_MAX_TOKENS=4096

# Groq (Info Gathering Specialist)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=mixtral-8x7b-32768
GROQ_MAX_TOKENS=32768
GROQ_TEMPERATURE=0.1

# ==========================================
# VECTOR DATABASE & EMBEDDINGS
# ==========================================

# Upstash Vector (Primary)
UPSTASH_VECTOR_REST_URL=https://your-vector-db.upstash.io
UPSTASH_VECTOR_REST_TOKEN=your_upstash_vector_token
UPSTASH_VECTOR_INDEX_NAME=hylo-travel-embeddings

# Qdrant (Alternative Vector Store)
QDRANT_URL=https://your-qdrant-instance.qdrant.tech
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION=travel_knowledge

# Jina Embeddings
JINA_API_KEY=your_jina_api_key
JINA_MODEL=jina-embeddings-v2-base-en
JINA_DIMENSIONS=768

# ==========================================
# LANGGRAPH & WORKFLOW ORCHESTRATION
# ==========================================

# LangGraph Configuration
LANGGRAPH_API_URL=https://api.langgraph.com
LANGGRAPH_API_KEY=your_langgraph_api_key
LANGGRAPH_TIMEOUT=300000

# LangSmith Tracing
LANGSMITH_API_KEY=your_langsmith_api_key
LANGSMITH_PROJECT=hylo-travel-workflows
LANGSMITH_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com

# Upstash QStash (Background Jobs)
QSTASH_URL=https://qstash-apac-northeast1-1.upstash.io/v2/publish
QSTASH_TOKEN=your_qstash_token
QSTASH_CURRENT_SIGNING_KEY=your_signing_key
QSTASH_NEXT_SIGNING_KEY=your_next_signing_key

# ==========================================
# FEATURE FLAGS & CAPABILITIES
# ==========================================

# AI Workflow Features
ENABLE_AI_WORKFLOW=true
ENABLE_STREAMING=true
ENABLE_MULTI_AGENT=true
ENABLE_WEB_SCRAPING=true
ENABLE_VECTOR_SEARCH=true

# Performance Features
ENABLE_CACHING=true
ENABLE_COMPRESSION=true
ENABLE_CDN=true
ENABLE_EDGE_FUNCTIONS=true

# Monitoring & Observability
ENABLE_LANGSMITH_TRACING=true
ENABLE_ERROR_REPORTING=true
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_COST_TRACKING=true

# Development Features (disable in production)
ENABLE_DEBUG_PANEL=false
ENABLE_MOCK_AGENTS=false
ENABLE_TEST_ENDPOINTS=false

# ==========================================
# SECURITY & RATE LIMITING
# ==========================================

# API Security
API_SECRET_KEY=your_secure_api_secret_key
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_32_byte_encryption_key

# Rate Limiting
RATE_LIMIT_WORKFLOWS_PER_HOUR=100
RATE_LIMIT_AGENTS_PER_HOUR=1000
RATE_LIMIT_WINDOW_MS=3600000

# CORS Configuration
ALLOWED_ORIGINS=https://your-domain.com,https://admin.your-domain.com
CORS_CREDENTIALS=true

# ==========================================
# DATABASE & STORAGE
# ==========================================

# Session Storage
SESSION_STORE_URL=redis://localhost:6379
SESSION_SECRET=your_session_secret
SESSION_MAX_AGE=86400000

# File Storage (Optional)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=hylo-travel-assets

# ==========================================
# MONITORING & ANALYTICS
# ==========================================

# Error Reporting
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=2.0.0

# Analytics
GOOGLE_ANALYTICS_ID=GA4-XXXXXXXXX
MIXPANEL_TOKEN=your_mixpanel_token

# Performance Monitoring
NEW_RELIC_LICENSE_KEY=your_new_relic_key
NEW_RELIC_APP_NAME=Hylo Travel AI

# ==========================================
# THIRD-PARTY INTEGRATIONS
# ==========================================

# External APIs
WEATHER_API_KEY=your_weather_api_key
CURRENCY_API_KEY=your_currency_api_key
MAPS_API_KEY=your_google_maps_api_key

# Email Service
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@your-domain.com

# Payment Processing (if applicable)
STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
```

## Deployment Platforms

### Vercel (Recommended)

#### 1. Project Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

#### 2. Environment Configuration

```bash
# Set environment variables via CLI
vercel env add CEREBRAS_API_KEY production
vercel env add GOOGLE_GENAI_API_KEY production
vercel env add GROQ_API_KEY production
# ... continue for all variables
```

Or use the Vercel Dashboard:
1. Go to your project dashboard
2. Navigate to Settings > Environment Variables
3. Add all variables with appropriate environments

#### 3. Deployment Configuration

**vercel.json**:
```json
{
  "version": 2,
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "functions": {
    "api/**/*.ts": {
      "runtime": "edge",
      "regions": ["iad1", "fra1", "hkg1"],
      "maxDuration": 300
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://your-domain.com"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "X-Requested-With, Content-Type, Authorization"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/docs",
      "destination": "/api/docs",
      "permanent": true
    }
  ],
  "crons": [
    {
      "path": "/api/health/system",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

#### 4. Deploy

```bash
# Deploy to production
vercel --prod

# Deploy with specific build command
vercel --prod --build-env NODE_ENV=production
```

### AWS (Alternative)

#### 1. Infrastructure as Code

**aws-deployment.yaml** (CloudFormation):
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Hylo Travel AI Platform Infrastructure'

Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues: [development, staging, production]

Resources:
  # API Gateway
  HyloAPI:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub 'hylo-api-${Environment}'
      Description: 'Hylo Travel AI API'
      EndpointConfiguration:
        Types: [EDGE]

  # Lambda Functions
  WorkflowFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'hylo-workflow-${Environment}'
      Runtime: nodejs18.x
      Handler: index.handler
      Code:
        ZipFile: |
          // Lambda deployment code
      Environment:
        Variables:
          NODE_ENV: !Ref Environment
          CEREBRAS_API_KEY: !Ref CerebrasApiKey
          # ... other environment variables

  # DynamoDB for session storage
  SessionTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'hylo-sessions-${Environment}'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: sessionId
          AttributeType: S
      KeySchema:
        - AttributeName: sessionId
          KeyType: HASH
      TimeToLiveSpecification:
        AttributeName: ttl
        Enabled: true

  # CloudFront Distribution
  CDN:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - DomainName: !Sub '${HyloAPI}.execute-api.${AWS::Region}.amazonaws.com'
            Id: api-origin
            CustomOriginConfig:
              HTTPPort: 443
              OriginProtocolPolicy: https-only
        DefaultCacheBehavior:
          TargetOriginId: api-origin
          ViewerProtocolPolicy: redirect-to-https
          CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad
```

#### 2. Deployment Script

```bash
#!/bin/bash
# deploy-aws.sh

set -e

ENVIRONMENT=${1:-production}
REGION=${2:-us-east-1}

echo "Deploying Hylo to AWS in $ENVIRONMENT environment..."

# Build application
npm run build

# Package for AWS Lambda
zip -r deployment.zip dist/ api/ node_modules/ package.json

# Deploy CloudFormation stack
aws cloudformation deploy \
  --template-file aws-deployment.yaml \
  --stack-name hylo-$ENVIRONMENT \
  --parameter-overrides Environment=$ENVIRONMENT \
  --capabilities CAPABILITY_IAM \
  --region $REGION

# Update Lambda function
aws lambda update-function-code \
  --function-name hylo-workflow-$ENVIRONMENT \
  --zip-file fileb://deployment.zip \
  --region $REGION

echo "Deployment completed!"
```

### Docker Deployment

#### Dockerfile

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ src/
COPY api/ api/
COPY public/ public/
COPY index.html ./

# Build application
RUN npm run build

# Production image
FROM node:18-alpine AS runtime

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/api ./api

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S hylo -u 1001

# Set ownership
RUN chown -R hylo:nodejs /app
USER hylo

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health/system || exit 1

# Start application
CMD ["node", "api/server.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  hylo-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - CEREBRAS_API_KEY=${CEREBRAS_API_KEY}
      - GOOGLE_GENAI_API_KEY=${GOOGLE_GENAI_API_KEY}
      - GROQ_API_KEY=${GROQ_API_KEY}
    depends_on:
      - redis
      - postgres
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: hylo
      POSTGRES_USER: hylo
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - hylo-app
    restart: unless-stopped

volumes:
  redis_data:
  postgres_data:
```

## Infrastructure Requirements

### Minimum Requirements

**Development:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 10GB
- Network: 100 Mbps

**Production:**
- CPU: 4 cores
- RAM: 8GB
- Storage: 50GB SSD
- Network: 1 Gbps
- CDN: CloudFlare or AWS CloudFront

### Recommended Specifications

**High Availability Setup:**
- Load balancer (2+ instances)
- Database: Managed service (RDS, Upstash)
- Cache: Redis cluster
- CDN: Global distribution
- Monitoring: Full observability stack

### Scaling Considerations

```typescript
// Auto-scaling configuration
interface ScalingConfig {
  minInstances: 2;
  maxInstances: 10;
  targetCPUUtilization: 70;
  targetMemoryUtilization: 80;
  scaleUpCooldown: 300; // seconds
  scaleDownCooldown: 600; // seconds
  
  // Workflow-specific scaling
  maxConcurrentWorkflows: 50;
  queueThreshold: 100;
  agentTimeout: 300;
}
```

## Security Configuration

### SSL/TLS Setup

```bash
# Generate SSL certificate (Let's Encrypt)
certbot certonly --webroot -w /var/www/html -d your-domain.com

# Or use managed certificates (Vercel/Cloudflare)
# Automatically handled in managed platforms
```

### Environment Security

```bash
# Encrypt sensitive environment variables
echo "sensitive_value" | openssl enc -aes-256-cbc -base64 -k "$ENCRYPTION_KEY"

# Use secret management
aws secretsmanager create-secret \
  --name "hylo/production/api-keys" \
  --description "Production API keys for Hylo" \
  --secret-string '{"cerebras":"key","google":"key","groq":"key"}'
```

### Network Security

**nginx.conf** (if using Nginx):
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Monitoring Setup

### Health Checks

```typescript
// api/health/deployment.ts
export default async function handler(req: Request) {
  const checks = {
    database: await checkDatabase(),
    llmProviders: await checkLLMProviders(),
    vectorStore: await checkVectorStore(),
    cache: await checkCache(),
    fileSystem: await checkFileSystem(),
    externalAPIs: await checkExternalAPIs(),
  };

  const allHealthy = Object.values(checks).every(check => check.status === 'healthy');

  return Response.json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
    version: process.env.APP_VERSION,
    environment: process.env.NODE_ENV,
  }, {
    status: allHealthy ? 200 : 503
  });
}
```

### Logging Configuration

```typescript
// utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'hylo-travel-ai',
    version: process.env.APP_VERSION 
  },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Performance Monitoring

```typescript
// middleware/metrics.ts
export function metricsMiddleware(req: Request, res: Response, next: Function) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route?.path || req.path;
    
    // Send metrics to monitoring service
    sendMetric('http_request_duration_ms', duration, {
      method: req.method,
      route,
      status: res.statusCode,
      environment: process.env.NODE_ENV,
    });
    
    // Log slow requests
    if (duration > 2000) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration,
        userAgent: req.get('User-Agent'),
      });
    }
  });
  
  next();
}
```

## Backup & Recovery

### Database Backup

```bash
#!/bin/bash
# backup.sh

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups/hylo"
S3_BUCKET="hylo-backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump $DATABASE_URL > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

# Backup uploaded files
tar -czf "$BACKUP_DIR/files_backup_$TIMESTAMP.tar.gz" /app/uploads

# Upload to S3
aws s3 cp "$BACKUP_DIR/db_backup_$TIMESTAMP.sql" "s3://$S3_BUCKET/database/"
aws s3 cp "$BACKUP_DIR/files_backup_$TIMESTAMP.tar.gz" "s3://$S3_BUCKET/files/"

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $TIMESTAMP"
```

### Disaster Recovery Plan

1. **Data Recovery**: Restore from latest backup
2. **Service Recovery**: Deploy from known good state
3. **Configuration Recovery**: Restore environment variables
4. **DNS Recovery**: Update DNS records if needed
5. **Monitoring Recovery**: Restart monitoring services

## CI/CD Pipeline

### GitHub Actions

**.github/workflows/deploy.yml**:
```yaml
name: Deploy Hylo

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: npm
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
        env:
          CI: true
      
      - name: Run build
        run: npm run build

  deploy-staging:
    if: github.ref == 'refs/heads/staging'
    needs: test
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          scope: ${{ secrets.TEAM_ID }}

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.TEAM_ID }}
```

## Troubleshooting

### Common Deployment Issues

1. **Build Failures**: Check environment variables and dependencies
2. **API Timeouts**: Increase timeout limits in platform configuration
3. **Memory Issues**: Monitor memory usage and increase limits
4. **Rate Limiting**: Configure appropriate rate limits for your tier

### Debug Commands

```bash
# Check deployment status
vercel ls
vercel inspect your-deployment-url

# View logs
vercel logs your-deployment-url --follow

# Test API endpoints
curl -X GET https://your-app.vercel.app/api/health/system

# Check environment variables
vercel env ls
```

---

*Last Updated: September 20, 2025 | Deployment Guide v2.0.0*
# 🔧 ENVIRONMENT VARIABLES CLARIFICATION & ALTERNATIVES

**Updated**: September 22, 2025  
**Your Questions Answered**: XAI/GROQ keys, Upstash services, NextAuth alternatives

---

## 🔑 **1. MULTIPLE API KEYS FOR XAI & GROQ**

**Good news!** You can absolutely use 2 keys for load balancing and redundancy.

### **Option A: Modify env.ts for Multiple Keys**

```typescript
// In src/lib/env.ts, change from single to multiple keys:

// From:
XAI_API_KEY: z.string().min(1, 'XAI_API_KEY is required'),
GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required'),

// To:
XAI_API_KEY_1: z.string().min(1, 'XAI_API_KEY_1 is required'),
XAI_API_KEY_2: z.string().min(1, 'XAI_API_KEY_2 is required'),
GROQ_API_KEY_1: z.string().min(1, 'GROQ_API_KEY_1 is required'),
GROQ_API_KEY_2: z.string().min(1, 'GROQ_API_KEY_2 is required'),
```

### **Option B: Comma-Separated Keys (Simpler)**

Keep single variables but use comma-separated values:

```bash
# Environment Variables (Vercel Dashboard)
XAI_API_KEY=key1,key2
GROQ_API_KEY=key1,key2
```

Then in your code, split them:

```typescript
const xaiKeys = env.XAI_API_KEY.split(',');
const groqKeys = env.GROQ_API_KEY.split(',');
```

**Recommendation**: Use Option B - it's simpler and requires no code changes.

---

## 🚀 **2. UPSTASH SERVICES: QStash vs Redis**

**Your Question**: You have QStash/Workflow, why do you need Redis?

### **Different Services, Different Purposes:**

| Service    | Purpose        | Used For                              |
| ---------- | -------------- | ------------------------------------- |
| **QStash** | Queue/Workflow | Task scheduling, delayed jobs         |
| **Redis**  | Cache/State    | Session data, workflow state, caching |

### **In Your Architecture:**

**Redis is used for:**

- **Workflow State Management**: Storing Inngest workflow progress
- **Session Storage**: User session data between API calls
- **Caching**: Vector search results, API responses
- **Progress Tracking**: Real-time progress updates

**QStash could be used for:**

- Background job scheduling (not currently implemented)
- Delayed task execution

### **Options:**

#### **Option A: Keep Both (Recommended)**

- Use Redis for state/cache (critical for workflow)
- Keep QStash for future background jobs

#### **Option B: Redis Alternatives**

If you don't want Redis, you could replace it with:

- **Vercel KV** (Redis-compatible)
- **Database storage** (slower but works)
- **In-memory storage** (development only)

#### **Option C: Remove Redis Requirements**

Remove state management features (but this reduces functionality):

```typescript
// You'd need to modify state-manager.ts to not use Redis
// This would make the workflow stateless
```

**Recommendation**: Use Upstash Redis (free tier available) - it's needed for the workflow state management to work properly.

---

## 🔐 **3. NEXTAUTH_SECRET ISSUE**

**Great catch!** NextAuth is NOT actually used in your codebase.

### **Current Status:**

- ❌ No NextAuth package in package.json
- ❌ No authentication implementation
- ❌ NEXTAUTH_SECRET is defined but not used
- ✅ Can be safely removed or replaced

### **Solutions:**

#### **Option A: Remove NextAuth Requirement (Simplest)**

**1. Remove from env.ts:**

```typescript
// Remove this line:
// NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),

// And this:
// auth: {
//   secret: env.NEXTAUTH_SECRET,
// },
```

**2. Update environment variables** (remove NEXTAUTH_SECRET)

#### **Option B: Replace with Generic Secret**

```typescript
// In env.ts, change to:
APP_SECRET: z.string().min(32, 'APP_SECRET must be at least 32 characters'),

// Usage:
app: {
  secret: env.APP_SECRET,
  // ... other config
}
```

#### **Option C: Generate a Placeholder Secret**

If you want to keep it for future use:

```bash
# Generate a random 32-character secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Use this value as NEXTAUTH_SECRET
```

**Recommendation**: Use Option A (remove it) since NextAuth isn't implemented.

---

## 🌍 **UPDATED ENVIRONMENT VARIABLES LIST**

### **Required (10 variables):**

```bash
# AI Services (4 - with your 2-key setup)
XAI_API_KEY=key1,key2
GROQ_API_KEY=key1,key2

# Search Services (3)
TAVILY_API_KEY=your_tavily_key
EXA_API_KEY=your_exa_key
SERP_API_KEY=your_serp_key

# Infrastructure (4)
UPSTASH_VECTOR_REST_URL=your_vector_url
UPSTASH_VECTOR_REST_TOKEN=your_vector_token
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Inngest (2)
INNGEST_EVENT_KEY=your_event_key
INNGEST_SIGNING_KEY=your_signing_key
```

### **Optional (1 variable):**

```bash
# Only if you keep NextAuth references
NEXTAUTH_SECRET=any_32_char_string_here_for_future_use
```

---

## 🛠️ **IMPLEMENTATION STEPS**

### **Step 1: Set Up Upstash Redis (Free)**

1. Go to [upstash.com](https://upstash.com)
2. Create Redis database (free tier: 10K commands/day)
3. Copy REST URL and TOKEN

### **Step 2: Configure Environment Variables**

Set the 10-12 variables above in Vercel dashboard

### **Step 3: Optional Code Changes**

If you want to remove NextAuth dependency, modify `src/lib/env.ts`

---

## ✅ **SUMMARY**

**Your Questions Answered:**

1. **✅ Multiple API Keys**: Use comma-separated values in single variables
2. **✅ Upstash Redis**: Needed for workflow state (different from QStash)
3. **✅ NextAuth**: Not actually used - can remove requirement

**Total Environment Variables**: 10-12 (depending on NextAuth decision)
**Upstash Services Needed**: Redis (for state) + Vector (for search)
**Time to Configure**: ~10 minutes

The architecture will work great with your setup! 🚀

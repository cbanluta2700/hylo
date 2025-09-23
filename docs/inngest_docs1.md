For your Vite + TypeScript application with Inngest to be deployed on Vercel, the folder structure needs to accommodate both the frontend and the serverless functions for your backend logic. The key is placing your API and Inngest functions within the `/api` directory, which Vercel automatically recognizes and deploys as serverless functions.

Here is a recommended structure that aligns with Vercel's expectations and promotes good organization.

### 📁 Project Structure for Vercel Deployment

The following structure separates your frontend source code from your backend API logic. Vercel will build the Vite app from the root and deploy each file inside `/api` as an individual serverless function.

```
my-ai-app/
├── api/                          # Vercel Serverless Functions directory
│   └── inngest/                  # Inngest functions endpoint
│       ├── index.ts              # Serves Inngest functions via `serve`
│       ├── client.ts             # Inngest client instance and event types
│       └── functions/            # Individual Inngest functions
│           └── generateSummary.ts
├── src/                          # Vite frontend source code
│   ├── components/
│   ├── pages/
│   ├── lib/                      # Utility libraries and AI clients
│   │   └── ai-clients.ts
│   ├── App.tsx
│   └── main.ts
├── public/                       # Static assets for the frontend
├── vite.config.ts               # Vite configuration, likely with `@` alias for `src/`
└── vercel.json                  # Vercel deployment configuration
```

### 📝 Key Configuration Files

To make this structure work, you need to correctly configure two essential files.

**1. `vercel.json`**
This file tells Vercel how to handle your project. Since your frontend and backend are combined, you need to specify that Vercel should not use a framework default and should instead rely on your configuration.

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.ts",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

**2. `vite.config.ts`**
Configure path aliases to keep your imports clean.

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 💡 How to Invoke Your Inngest Functions

With the structure above, your Inngest endpoint will be available at `/api/inngest`. You can trigger your functions in two main ways:

- **Sending Events from Your App**: Use the Inngest client to send events from your frontend or API routes.
  ```typescript
  // Example from within your React app
  import { inngest } from '../api/inngest/client';

  const triggerSummary = () => {
    inngest.send({
      name: 'doc.created',
      data: { docId: '123', text: '...' },
    });
  };
  ```

Based on your request, I've put together the complete code files for your Inngest setup with Vercel and XAI Grok. The structure below includes the four key files you'll need.

### 📁 File Structure

```
api/
└── inngest/
    ├── index.ts              # Serves functions to Vercel
    ├── client.ts             # Inngest client and event types
    └── functions/
        └── generateSummary.ts # Your AI workflow function
src/
└── lib/
    └── ai-clients.ts         # XAI Grok client setup
```

### 💻 Code Implementation

Here are the complete code examples for each file.

#### 1. `./api/inngest/client.ts`

This file defines your Inngest client and the types of events it will handle.

```typescript
import { EventSchemas, Inngest } from 'inngest';

// 1. Define your event types for full type-safety
type Events = {
  'doc.created': {
    data: {
      docId: string;
      text: string;
    };
  };
  'doc.summary.generated': {
    data: {
      docId: string;
      summary: string;
    };
  };
};

// 2. Create and export the Inngest client
export const inngest = new Inngest({
  id: 'my-ai-app',
  schemas: new EventSchemas().fromRecord<Events>(),
});
```

#### 2. `./src/lib/ai-clients.ts`

This file sets up the XAI Grok client using Vercel's AI SDK.

```typescript
import { xai } from '@ai-sdk/xai';

// Create the Grok model instance
// Get your API key from https://console.x.ai/ and set it as XAI_API_KEY in your .env file
export const grokModel = xai('grok-3-mini'); // You can use other models like 'grok-3-latest'

// Optional: Helper function for generating summaries
export const generateSummaryWithAI = async (text: string): Promise<string> => {
  const { generateText } = await import('ai'); // Dynamic import can help with tree-shaking

  const { text: summary } = await generateText({
    model: grokModel,
    prompt: `Please provide a concise summary of the following text: ${text}`,
  });

  return summary;
};
```

#### 3. `./api/inngest/functions/generateSummary.ts`

This is your core AI workflow function, triggered by an event and using the step tool for reliability.

```typescript
import { inngest } from '../client';
import { generateSummaryWithAI } from '../../../../src/lib/ai-clients'; // Adjust path based on your structure

export const generateSummary = inngest.createFunction(
  // Function configuration
  {
    id: 'generate-doc-summary',
    name: 'Generate Document Summary',
    retries: 3, // Will retry failed steps up to 3 times
  },
  // Function trigger: starts when a 'doc.created' event is sent
  { event: 'doc.created' },
  // Function handler: contains the step-by-step logic
  async ({ event, step }) => {
    const { docId, text } = event.data;

    // Step 1: Generate the summary using AI. step.run makes this operation durable and retriable.
    const summary = await step.run('generate-ai-summary', async () => {
      return await generateSummaryWithAI(text);
    });

    // Step 2: Send a new event announcing the summary is ready.
    // Using step.sendEvent ensures the event is sent even if the function fails after this point.
    await step.sendEvent('publish-summary', {
      name: 'doc.summary.generated',
      data: {
        docId,
        summary,
      },
    });

    return { message: 'Summary generated successfully', docId, summary };
  }
);
```

#### 4. `./api/inngest/index.ts`

This file creates the API endpoint that Inngest calls to trigger your functions on Vercel.

```typescript
import { serve } from 'inngest/vercel'; // Important: Use the Vercel serve handler
import { inngest } from './client';
import { generateSummary } from './functions/generateSummary';

// Serve your functions via a Vercel Serverless Function at /api/inngest
export default serve({
  client: inngest,
  functions: [
    generateSummary,
    // You can add more functions here as you create them
  ],
});

// This endpoint will now handle GET, POST, and PUT requests from Inngest
```

### 🔧 Key Configuration Steps

To make this work, you'll need to:

1.  **Install Dependencies**: Make sure these packages are installed:

    ```bash
    npm install inngest @ai-sdk/xai ai
    ```

2.  **Set Environment Variables**: Create a `.env.local` file with your XAI API key:

    ```bash
    XAI_API_KEY='your_xai_api_key_here'
    ```

3.  **Run the Dev Server**: Use the Inngest CLI to develop and test locally:
    ```bash
    npx inngest-cli@latest dev
    ```

### 🚀 Triggering Your Workflow

To start the AI summary workflow, send a `doc.created` event from anywhere in your application:

```typescript
import { inngest } from '../api/inngest/client';

await inngest.send({
  name: 'doc.created',
  data: {
    docId: 'doc_123',
    text: 'The full text of your document goes here...',
  },
});
```

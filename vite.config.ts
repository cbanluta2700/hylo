import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Explicitly define all API keys for Vercel compatibility
      // Note: Vercel doesn't use .env files, these are defined in Vercel dashboard
      'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV || mode),
      'process.env.XAI_API_KEY': JSON.stringify(env.XAI_API_KEY),
      'process.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY),
      'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
      'process.env.TAVILY_API_KEY': JSON.stringify(env.TAVILY_API_KEY),
      'process.env.EXA_API_KEY': JSON.stringify(env.EXA_API_KEY),
      'process.env.SERP_API_KEY': JSON.stringify(env.SERP_API_KEY),
      'process.env.UPSTASH_VECTOR_REST_URL': JSON.stringify(env.UPSTASH_VECTOR_REST_URL),
      'process.env.UPSTASH_VECTOR_REST_TOKEN': JSON.stringify(env.UPSTASH_VECTOR_REST_TOKEN),
      'process.env.UPSTASH_REDIS_REST_URL': JSON.stringify(env.UPSTASH_REDIS_REST_URL),
      'process.env.UPSTASH_REDIS_REST_TOKEN': JSON.stringify(env.UPSTASH_REDIS_REST_TOKEN),
      'process.env.KV_REST_API_TOKEN': JSON.stringify(env.KV_REST_API_TOKEN),
      'process.env.KV_REST_API_READ_ONLY_TOKEN': JSON.stringify(env.KV_REST_API_READ_ONLY_TOKEN),
      'process.env.INNGEST_EVENT_KEY': JSON.stringify(env.INNGEST_EVENT_KEY),
      'process.env.INNGEST_SIGNING_KEY': JSON.stringify(env.INNGEST_SIGNING_KEY),
      'process.env.NEXTAUTH_SECRET': JSON.stringify(env.NEXTAUTH_SECRET),
      'process.env.NEXT_PUBLIC_API_URL': JSON.stringify(env.NEXT_PUBLIC_API_URL),
      'process.env.NEXT_PUBLIC_WS_URL': JSON.stringify(env.NEXT_PUBLIC_WS_URL),
      'process.env.NEXT_PUBLIC_API_URL_DEV': JSON.stringify(env.NEXT_PUBLIC_API_URL_DEV),
      'process.env.NEXT_PUBLIC_WS_URL_DEV': JSON.stringify(env.NEXT_PUBLIC_WS_URL_DEV),
      'process.env.VERCEL': JSON.stringify(env.VERCEL),
      'process.env.VERCEL_ENV': JSON.stringify(env.VERCEL_ENV),
      'process.env.VERCEL_URL': JSON.stringify(env.VERCEL_URL),
      'process.env.VERCEL_REGION': JSON.stringify(env.VERCEL_REGION),
      'process.env.VERCEL_GIT_COMMIT_SHA': JSON.stringify(env.VERCEL_GIT_COMMIT_SHA),
      'process.env.VERCEL_DEPLOYMENT_ID': JSON.stringify(env.VERCEL_DEPLOYMENT_ID),
    },
    optimizeDeps: {
    exclude: ['lucide-react'],
    include: [
      // Pre-bundle AI SDK packages for better performance
      '@ai-sdk/xai',
      '@ai-sdk/groq',
      'inngest',
      '@upstash/redis',
      '@upstash/vector',
      'tavily',
      'exa-js',
      'serpapi',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/tests': path.resolve(__dirname, './tests'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/lib/ai-clients': path.resolve(__dirname, './src/lib/ai-clients'),
      '@/lib/ai-agents': path.resolve(__dirname, './src/lib/ai-agents'),
      '@/lib/workflows': path.resolve(__dirname, './src/lib/workflows'),
      '@/lib/inngest': path.resolve(__dirname, './src/lib/inngest'),
      '@/lib/config': path.resolve(__dirname, './src/lib/config'),
      '@/schemas': path.resolve(__dirname, './src/schemas'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/utils/test-helpers.tsx'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.git', '.cache'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/utils/test-helpers.ts',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        'dist/',
      ],
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  build: {
    // Optimize for Edge Runtime compatibility
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      external: [
        // Don't bundle Node.js built-ins (they're not available in Edge Runtime anyway)
        'fs',
        'path',
        'os',
        'crypto',
        'http',
        'https',
        'stream',
        'buffer',
        'child_process',
        'cluster',
        'events',
        'util',
        'zlib',
      ],
      output: {
        manualChunks: {
          // Separate AI SDK packages into their own chunks
          'ai-providers': ['@ai-sdk/xai', '@ai-sdk/groq'],
          workflow: ['inngest'],
          storage: ['@upstash/redis', '@upstash/vector'],
          search: ['tavily', 'exa-js', 'serpapi'],
          // Keep existing chunks
          vendor: ['react', 'react-dom'],
          lucide: ['lucide-react'],
        },
      },
    },
    // Ensure smaller bundles for faster Edge Function cold starts
    chunkSizeWarningLimit: 1000, // Increased for AI packages
  },
});

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables.
  // Use `''` as the third parameter to load all env vars, not just VITE_ prefixed ones.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // 'define' variables for client-side access
    // ONLY include environment variables that are needed on the frontend.
    // In Vite, these must be explicitly defined and will be available as `import.meta.env.*`.
    // Vercel-specific env vars are automatically handled on the server, so no need to define here.
    define: {
      // Explicitly define all API keys for Vercel compatibility
      // Note: Vercel doesn't use .env files, these are defined in Vercel dashboard
      'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV || mode),
      // XAI API Keys (primary + backup)
      'process.env.XAI_API_KEY': JSON.stringify(env.XAI_API_KEY),
      'process.env.XAI_API_KEY_2': JSON.stringify(env.XAI_API_KEY_2),
      // GROQ API Keys (primary + backup)
      'process.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY),
      'process.env.GROQ_API_KEY_2': JSON.stringify(env.GROQ_API_KEY_2),
      // Search Provider APIs
      'process.env.TAVILY_API_KEY': JSON.stringify(env.TAVILY_API_KEY),
      'process.env.EXA_API_KEY': JSON.stringify(env.EXA_API_KEY),
      'process.env.SERP_API_KEY': JSON.stringify(env.SERP_API_KEY),
      // Inngest Workflow Configuration
      'process.env.INNGEST_EVENT_KEY': JSON.stringify(env.INNGEST_EVENT_KEY),
      'process.env.INNGEST_SIGNING_KEY': JSON.stringify(env.INNGEST_SIGNING_KEY),
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
    // Aliases for better import paths
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
    // Vitest testing setup (if you are using it)
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/utils/test-helpers.tsx'],
      include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
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
    // Local development server proxy for API requests
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3001', // Target the local Vercel dev server (port 3001)
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''), // Rewrite to match Vercel function path
        },
      },
    },
    // Build optimizations for the Vite frontend
    build: {
      target: 'esnext',
      outDir: 'dist',
      minify: 'terser',
    },
  };
});

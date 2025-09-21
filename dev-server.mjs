/**
 * Development API Server for Hylo
 *
 * Serves API routes during development, including our new Inngest endpoint.
 * This allows proper testing of the consolidated architecture.
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3001;

// Initialize Next.js app with API routes
const app = next({
  dev,
  hostname,
  port,
  dir: '.',
  conf: {
    // Configure for API-only serving
    pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
    experimental: {
      serverComponentsExternalPackages: ['inngest'],
    },
    // Enable API routes
    api: {
      externalResolver: true,
    },
  },
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);

      // Add CORS headers for development
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // Log API requests for debugging
      if (parsedUrl.pathname.startsWith('/api/')) {
        console.log(`[API] ${req.method} ${parsedUrl.pathname}`);
      }

      // Handle request with Next.js
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log('> API endpoints available:');
      console.log('  - POST /api/itinerary/generate (Event-driven)');
      console.log('  - GET  /api/itinerary/status');
      console.log('  - POST /api/inngest (Workflow handler)');
      console.log('  - GET  /api/system (Health/DNS/Status)');
      console.log('  - POST /api/cache (Vector/Session/General)');
      console.log('');
      console.log('> Inngest functions registered:');
      console.log('  - itinerary-generation (Master workflow)');
      console.log('  - architect-agent');
      console.log('  - gatherer-agent');
      console.log('  - specialist-agent');
      console.log('  - form-putter-agent');
      console.log('  - progress-tracking');
    });
});

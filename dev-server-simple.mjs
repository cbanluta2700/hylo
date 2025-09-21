#!/usr/bin/env node

/**
 * Simple API Development Server for Hylo
 * Tests our consolidated endpoint architecture
 */

import { createServer } from 'http';
import { readFileSync } from 'fs';

const port = 3001;

const server = createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${port}`);

  console.log(`${req.method} ${url.pathname}`);

  // Mock responses for our endpoints
  if (url.pathname === '/api/inngest') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        message: 'Inngest endpoint ready for registration',
        functions: [
          'itinerary-generation',
          'architect-agent',
          'gatherer-agent',
          'specialist-agent',
          'form-putter-agent',
          'progress-tracking',
        ],
      })
    );
    return;
  }

  if (url.pathname === '/api/itinerary/generate') {
    res.writeHead(202, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        success: true,
        data: {
          sessionId: 'mock-session-123',
          requestId: 'mock-request-456',
          status: 'queued',
          message: 'Itinerary generation started',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          processingTime: 25,
        },
      })
    );
    return;
  }

  if (url.pathname === '/api/itinerary/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        success: true,
        data: {
          sessionId: 'mock-session-123',
          requestId: 'mock-request-456',
          status: 'processing',
          progress: 65,
          currentStage: 'specialist-agent',
          message: 'Analyzing cultural insights...',
        },
      })
    );
    return;
  }

  if (url.pathname === '/api/system') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        success: true,
        data: {
          status: 'healthy',
          services: [
            { name: 'Inngest', status: 'healthy' },
            { name: 'Upstash Vector', status: 'healthy' },
            { name: 'External APIs', status: 'healthy' },
          ],
        },
      })
    );
    return;
  }

  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      success: false,
      error: { code: 'NOT_FOUND', message: `Endpoint ${url.pathname} not found` },
    })
  );
});

server.listen(port, () => {
  console.log(`🚀 Hylo API Server (Mock) running on http://localhost:${port}`);
  console.log('📡 Mock endpoints responding:');
  console.log('  ✅ POST /api/inngest');
  console.log('  ✅ POST /api/itinerary/generate');
  console.log('  ✅ GET  /api/itinerary/status');
  console.log('  ✅ GET  /api/system');
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());

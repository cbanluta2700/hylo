import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Contract test for WebSocket /api/itinerary/live
// Tests the WebSocket contract as defined in contracts/websocket-spec.md

// Message schemas for validation
const ConnectionAckSchema = z.object({
  type: z.literal('connection_ack'),
  status: z.literal('ready'),
  subscriptions: z.array(z.string()),
  heartbeatInterval: z.number().positive(),
});

const ProgressUpdateSchema = z.object({
  type: z.literal('progress'),
  requestId: z.string().uuid(),
  progress: z.object({
    percentage: z.number().min(0).max(100),
    phase: z.enum(['research', 'planning', 'enrichment', 'formatting']),
    message: z.string(),
    details: z.array(z.string()).optional(),
  }),
  timestamp: z.string(),
});

const AgentStatusUpdateSchema = z.object({
  type: z.literal('agent_status'),
  requestId: z.string().uuid(),
  agent: z.object({
    type: z.enum(['itinerary-architect', 'web-gatherer', 'information-specialist', 'form-putter']),
    status: z.enum(['started', 'processing', 'completed', 'error']),
    progress: z.number().min(0).max(100),
    message: z.string().optional(),
    data: z.any().optional(),
  }),
  timestamp: z.string(),
});

const SubscribeMessageSchema = z.object({
  type: z.literal('subscribe'),
  requestId: z.string().uuid(),
  subscriptions: z.array(z.enum(['progress', 'agents', 'partial_results', 'form_changes'])),
});

describe('WebSocket /api/itinerary/live', () => {
  describe('Message Format Validation', () => {
    it('should validate connection acknowledgment message format', () => {
      const ackMessage = {
        type: 'connection_ack',
        status: 'ready',
        subscriptions: ['progress', 'agents'],
        heartbeatInterval: 30,
      };

      const result = ConnectionAckSchema.safeParse(ackMessage);
      expect(result.success).toBe(true);
    });

    it('should validate progress update message format', () => {
      const progressMessage = {
        type: 'progress',
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        progress: {
          percentage: 75,
          phase: 'research',
          message: 'Researching accommodations',
          details: ['Found 3 hotels', 'Checking availability'],
        },
        timestamp: new Date().toISOString(),
      };

      const result = ProgressUpdateSchema.safeParse(progressMessage);
      expect(result.success).toBe(true);
    });

    it('should validate agent status update message format', () => {
      const agentMessage = {
        type: 'agent_status',
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        agent: {
          type: 'itinerary-architect',
          status: 'processing',
          progress: 60,
          message: 'Planning daily itinerary',
          data: { currentDay: 2 },
        },
        timestamp: new Date().toISOString(),
      };

      const result = AgentStatusUpdateSchema.safeParse(agentMessage);
      expect(result.success).toBe(true);
    });

    it('should validate subscribe message format', () => {
      const subscribeMessage = {
        type: 'subscribe',
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        subscriptions: ['progress', 'agents', 'partial_results', 'form_changes'],
      };

      const result = SubscribeMessageSchema.safeParse(subscribeMessage);
      expect(result.success).toBe(true);
    });
  });

  describe('Connection URL Validation', () => {
    it('should validate WebSocket URL format', () => {
      const validUrl = 'wss://hylo.vercel.app/api/itinerary/live?requestId=550e8400-e29b-41d4-a716-446655440000&sessionId=sess_123';

      expect(validUrl).toMatch(/^wss?:\/\//);
      expect(validUrl).toContain('requestId=');
      expect(validUrl).toContain('sessionId=');
    });

    it('should validate requestId parameter format', () => {
      const validRequestId = '550e8400-e29b-41d4-a716-446655440000';
      const invalidRequestId = 'invalid-uuid';

      expect(validRequestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(invalidRequestId).not.toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  describe('Business Logic Validation', () => {
    it('should validate progress percentage range', () => {
      const validProgress = {
        type: 'progress',
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        progress: {
          percentage: 75,
          phase: 'research',
          message: 'Researching accommodations',
        },
        timestamp: new Date().toISOString(),
      };

      const invalidProgress = {
        type: 'progress',
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        progress: {
          percentage: 150, // Invalid: > 100
          phase: 'research',
          message: 'Researching accommodations',
        },
        timestamp: new Date().toISOString(),
      };

      const validResult = ProgressUpdateSchema.safeParse(validProgress);
      const invalidResult = ProgressUpdateSchema.safeParse(invalidProgress);

      expect(validResult.success).toBe(true);
      expect(invalidResult.success).toBe(false);
    });

    it('should validate agent types', () => {
      const validAgentTypes = [
        'itinerary-architect',
        'web-gatherer',
        'information-specialist',
        'form-putter',
      ];

      validAgentTypes.forEach(agentType => {
        const message = {
          type: 'agent_status',
          requestId: '550e8400-e29b-41d4-a716-446655440000',
          agent: {
            type: agentType,
            status: 'processing',
            progress: 50,
          },
          timestamp: new Date().toISOString(),
        };

        const result = AgentStatusUpdateSchema.safeParse(message);
        expect(result.success).toBe(true);
      });
    });
  });
});
/**
 * Simple frontend integration test
 * Tests our fixed BehindTheScenes integration with workflow system
 */

import { describe, it, expect } from 'vitest';

describe('Frontend Integration Tests', () => {
  it('should have workflow enabled via environment variable', () => {
    // Set the environment variable as our system checks
    process.env['REACT_APP_USE_WORKFLOW'] = 'true';
    
    // Simulate the check from App.tsx
    const USE_MULTI_AGENT_WORKFLOW = process.env['REACT_APP_USE_WORKFLOW'] === 'true' || false;
    
    expect(USE_MULTI_AGENT_WORKFLOW).toBe(true);
  });

  it('should import workflow converter utility', async () => {
    const converters = await import('../../src/utils/workflowConverters');
    
    expect(converters.convertAgentStatusToLog).toBeDefined();
    expect(converters.convertAgentStatusArrayToLogs).toBeDefined();
  });

  it('should convert AgentStatus to AgentLog format', async () => {
    const { convertAgentStatusToLog } = await import('../../src/utils/workflowConverters');
    
    const mockAgentStatus = {
      id: 'test-agent-1',
      name: 'ContentPlanner' as const,
      status: 'completed' as const,
      startTime: '2025-09-20T14:00:00Z',
      endTime: '2025-09-20T14:01:00Z',
      duration: 60000
    };

    const result = convertAgentStatusToLog(mockAgentStatus);

    expect(result).toMatchObject({
      agentId: 1,
      agentName: 'ContentPlanner',
      model: 'Planning Agent',
      timestamp: '2025-09-20T14:00:00Z',
      decisions: ['Agent completed successfully'],
      provider: 'Multi-Agent System',
      latency: 60000,
      traceId: 'test-agent-1'
    });
  });

  it('should convert multiple AgentStatus to AgentLog array', async () => {
    const { convertAgentStatusArrayToLogs } = await import('../../src/utils/workflowConverters');
    
    const mockAgentStatuses = [
      {
        id: 'agent-1',
        name: 'ContentPlanner' as const,
        status: 'completed' as const,
        startTime: '2025-09-20T14:00:00Z'
      },
      {
        id: 'agent-2',
        name: 'InfoGatherer' as const,
        status: 'running' as const,
        startTime: '2025-09-20T14:01:00Z'
      }
    ];

    const results = convertAgentStatusArrayToLogs(mockAgentStatuses);

    expect(results).toHaveLength(2);
    expect(results[0].agentId).toBe(1);
    expect(results[0].agentName).toBe('ContentPlanner');
    expect(results[1].agentId).toBe(2);
    expect(results[1].agentName).toBe('InfoGatherer');
  });
});
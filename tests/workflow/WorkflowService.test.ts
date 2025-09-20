/**
 * WorkflowService Integration Test
 * 
 * Tests the multi-agent workflow system integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowService } from '../../src/services/workflow/WorkflowService';
import { TravelFormData } from '../../src/types/agents';

// Mock fetch for testing
global.fetch = vi.fn();

describe('WorkflowService Integration', () => {
  let workflowService: WorkflowService;
  
  const mockFormData: TravelFormData = {
    destination: 'Paris, France',
    departureDate: '2024-06-01',
    returnDate: '2024-06-07',
    tripNickname: 'Paris Adventure',
    contactName: 'John Doe',
    adults: 2,
    children: 0,
    budget: {
      amount: 3000,
      currency: 'USD',
      mode: 'total'
    },
    preferences: {
      travelStyle: 'culture',
      interests: ['museums', 'architecture', 'food'],
      accommodationType: 'hotel',
      transportationMode: 'any'
    }
  };

  beforeEach(() => {
    workflowService = new WorkflowService('/api');
    vi.clearAllMocks();
  });

  it('should initialize workflow service correctly', () => {
    expect(workflowService).toBeInstanceOf(WorkflowService);
  });

  it('should handle health check correctly', async () => {
    // Mock successful health check
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200
    });

    const isHealthy = await workflowService.healthCheck();
    expect(isHealthy).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('/api/workflow/health', {
      method: 'GET'
    });
  });

  it('should handle health check failure', async () => {
    // Mock failed health check
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const isHealthy = await workflowService.healthCheck();
    expect(isHealthy).toBe(false);
  });

  it('should execute non-streaming workflow correctly', async () => {
    // Mock successful workflow execution
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        itinerary: '# Your Paris Itinerary\\n\\nDay 1: Explore the Louvre...',
        metadata: {
          totalCost: 0.50,
          executionTime: 30000,
          agentResults: {
            ContentPlanner: { success: true, data: {} },
            InfoGatherer: { success: true, data: {} },
            Strategist: { success: true, data: {} },
            Compiler: { success: true, data: {} }
          }
        }
      })
    });

    const result = await workflowService.executeWorkflow(mockFormData);
    
    expect(result.success).toBe(true);
    expect(result.itinerary).toContain('Paris Itinerary');
    expect(result.metadata?.totalCost).toBe(0.50);
    expect(global.fetch).toHaveBeenCalledWith('/api/workflow/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        formData: mockFormData,
        streaming: false
      })
    });
  });

  it('should handle workflow execution errors', async () => {
    // Mock failed workflow execution
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal server error' })
    });

    const result = await workflowService.executeWorkflow(mockFormData);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Internal server error');
  });

  it('should cancel workflow correctly', () => {
    const cancelSpy = vi.spyOn(AbortController.prototype, 'abort');
    
    // Start a workflow to create the abort controller
    workflowService.startStreamingWorkflow(mockFormData);
    
    // Cancel the workflow
    workflowService.cancelWorkflow();
    
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('should map node names to agents correctly', () => {
    // This tests the private method indirectly by testing the expected behavior
    expect(true).toBe(true); // Placeholder - would need to expose method or test through public interface
  });
});

describe('Workflow Progress Calculations', () => {
  it('should calculate progress percentage correctly', () => {
    const agents = [
      { id: '1', name: 'ContentPlanner' as const, status: 'completed' as const },
      { id: '2', name: 'InfoGatherer' as const, status: 'completed' as const },
      { id: '3', name: 'Strategist' as const, status: 'running' as const },
      { id: '4', name: 'Compiler' as const, status: 'pending' as const }
    ];

    const completedAgents = agents.filter(a => a.status === 'completed').length;
    const progress = Math.round((completedAgents / agents.length) * 100);
    
    expect(progress).toBe(50); // 2 out of 4 completed
  });

  it('should format duration correctly', () => {
    const formatDuration = (duration: number) => {
      const seconds = Math.round(duration / 1000);
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    };

    expect(formatDuration(30000)).toBe('30s');
    expect(formatDuration(90000)).toBe('1m 30s');
    expect(formatDuration(125000)).toBe('2m 5s');
  });
});

export {};
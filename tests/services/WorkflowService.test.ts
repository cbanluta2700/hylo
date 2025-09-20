import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkflowService, WorkflowProgress, StreamingWorkflowOptions } from '../../src/services/workflow/WorkflowService';
import { TravelFormData } from '../../src/types/agents';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock ReadableStream for streaming tests
const mockReadableStream = vi.fn().mockImplementation(() => {
  return {
    getReader: vi.fn().mockReturnValue({
      read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
      releaseLock: vi.fn(),
    }),
    cancel: vi.fn(),
    locked: false,
    pipeThrough: vi.fn(),
    pipeTo: vi.fn(),
    tee: vi.fn(),
  };
});

// Mock global ReadableStream
Object.defineProperty(global, 'ReadableStream', {
  writable: true,
  value: mockReadableStream,
});

describe('WorkflowService', () => {
  let workflowService: WorkflowService;
  const mockFormData: TravelFormData = {
    destination: 'Paris, France',
    departureDate: '2024-03-01',
    returnDate: '2024-03-07',
    tripNickname: 'Paris Adventure',
    contactName: 'John Doe',
    adults: 2,
    children: 0,
    budget: {
      amount: 5000,
      currency: 'USD',
      mode: 'total' as const
    },
    preferences: {
      travelStyle: 'culture',
      interests: ['museums', 'food', 'architecture']
    }
  };

  beforeEach(() => {
    workflowService = new WorkflowService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeWorkflow', () => {
    it('should execute workflow and return result', async () => {
      const expectedResult = {
        success: true,
        itinerary: 'Generated Paris itinerary',
        metadata: {
          totalCost: 100,
          executionTime: 5000,
          agentResults: {}
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(expectedResult),
      });

      const result = await workflowService.executeWorkflow(mockFormData);

      expect(mockFetch).toHaveBeenCalledWith('/api/workflow/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData: mockFormData,
          streaming: false
        }),
      });

      expect(result).toEqual(expectedResult);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        workflowService.executeWorkflow(mockFormData)
      ).rejects.toThrow('Network error');
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      await expect(
        workflowService.executeWorkflow(mockFormData)
      ).rejects.toThrow('Server error');
    });
  });

  describe('startStreamingWorkflow', () => {
    it('should handle streaming workflow with progress updates', async () => {
      const mockStreamData = [
        'data: {"type":"values","timestamp":"2024-01-01T00:00:00Z","data":{"currentStep":1,"totalSteps":4,"currentAgent":"ContentPlanner","progress":25,"agents":[]}}\n\n',
        'data: {"type":"values","timestamp":"2024-01-01T00:01:00Z","data":{"currentStep":2,"totalSteps":4,"currentAgent":"InfoGatherer","progress":50,"agents":[]}}\n\n',
        'data: {"type":"custom","timestamp":"2024-01-01T00:02:00Z","data":{"type":"result","itinerary":"Final itinerary"}}\n\n'
      ];

      let streamIndex = 0;
      const mockReader = {
        read: vi.fn().mockImplementation(() => {
          if (streamIndex < mockStreamData.length) {
            const value = new TextEncoder().encode(mockStreamData[streamIndex]);
            streamIndex++;
            return Promise.resolve({ done: false, value });
          }
          return Promise.resolve({ done: true, value: undefined });
        }),
        releaseLock: vi.fn(),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const progressUpdates: WorkflowProgress[] = [];
      const options: StreamingWorkflowOptions = {
        onProgress: (progress: WorkflowProgress) => {
          progressUpdates.push(progress);
        },
        onComplete: vi.fn(),
      };

      const sessionId = await workflowService.startStreamingWorkflow(mockFormData, options);

      expect(sessionId).toMatch(/^workflow-\d+-\w+$/);
      expect(progressUpdates).toHaveLength(2);
      
      if (progressUpdates[0]) {
        expect(progressUpdates[0].currentAgent).toBe('ContentPlanner');
        expect(progressUpdates[0].progress).toBe(25);
      }
      
      if (progressUpdates[1]) {
        expect(progressUpdates[1].currentAgent).toBe('InfoGatherer');
        expect(progressUpdates[1].progress).toBe(50);
      }
      
      expect(options.onComplete).toHaveBeenCalledWith({
        success: true,
        itinerary: 'Final itinerary'
      });
    });

    it('should handle streaming errors', async () => {
      const mockReader = {
        read: vi.fn().mockRejectedValue(new Error('Stream read error')),
        releaseLock: vi.fn(),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const options: StreamingWorkflowOptions = {
        onError: vi.fn(),
      };

      await expect(
        workflowService.startStreamingWorkflow(mockFormData, options)
      ).rejects.toThrow('Stream read error');

      expect(mockReader.releaseLock).toHaveBeenCalled();
      expect(options.onError).toHaveBeenCalledWith('Stream read error');
    });

    it('should handle timeout', async () => {
      const mockReader = {
        read: vi.fn().mockImplementation(() => {
          // Simulate a stream that never completes
          return new Promise(() => {});
        }),
        releaseLock: vi.fn(),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const options: StreamingWorkflowOptions = {
        onError: vi.fn(),
        timeout: 100, // Very short timeout
      };

      await expect(
        workflowService.startStreamingWorkflow(mockFormData, options)
      ).rejects.toThrow();

      expect(options.onError).toHaveBeenCalledWith('Workflow timeout exceeded');
    });

    it('should handle malformed streaming data gracefully', async () => {
      const mockStreamData = [
        'data: invalid json\n\n',
        'data: {"type":"values","data":{"currentStep":1,"totalSteps":4,"currentAgent":"ContentPlanner","progress":25,"agents":[]}}\n\n',
        'data: {"type":"custom","data":{"type":"result","itinerary":"Success"}}\n\n'
      ];

      let streamIndex = 0;
      const mockReader = {
        read: vi.fn().mockImplementation(() => {
          if (streamIndex < mockStreamData.length) {
            const value = new TextEncoder().encode(mockStreamData[streamIndex]);
            streamIndex++;
            return Promise.resolve({ done: false, value });
          }
          return Promise.resolve({ done: true, value: undefined });
        }),
        releaseLock: vi.fn(),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const progressUpdates: WorkflowProgress[] = [];
      const options: StreamingWorkflowOptions = {
        onProgress: (progress: WorkflowProgress) => {
          progressUpdates.push(progress);
        },
        onComplete: vi.fn(),
      };

      const sessionId = await workflowService.startStreamingWorkflow(mockFormData, options);

      expect(sessionId).toMatch(/^workflow-\d+-\w+$/);
      // Should receive the valid progress update, ignoring the malformed data
      expect(progressUpdates).toHaveLength(1);
      
      if (progressUpdates[0]) {
        expect(progressUpdates[0].currentAgent).toBe('ContentPlanner');
      }
      
      expect(options.onComplete).toHaveBeenCalledWith({
        success: true,
        itinerary: 'Success'
      });
    });
  });

  describe('cancelWorkflow', () => {
    it('should cancel ongoing workflow', () => {
      const mockAbortController = {
        abort: vi.fn(),
        signal: { aborted: false },
      };
      
      // Mock AbortController
      vi.spyOn(global, 'AbortController').mockImplementation(() => mockAbortController as any);

      const mockReader = {
        read: vi.fn().mockImplementation(() => {
          return new Promise(() => {}); // Never resolves
        }),
        releaseLock: vi.fn(),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      // Start streaming workflow (don't await)
      workflowService.startStreamingWorkflow(mockFormData);

      // Cancel workflow
      workflowService.cancelWorkflow();

      expect(mockAbortController.abort).toHaveBeenCalled();
    });
  });

  describe('data validation and error handling', () => {
    it('should handle missing response body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        body: null,
      });

      await expect(
        workflowService.startStreamingWorkflow(mockFormData)
      ).rejects.toThrow('Streaming not supported');
    });

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid form data' }),
      });

      await expect(
        workflowService.startStreamingWorkflow(mockFormData)
      ).rejects.toThrow('Invalid form data');
    });

    it('should generate unique session IDs', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn().mockResolvedValue({ done: true }),
            releaseLock: vi.fn(),
          }),
        },
      });

      const sessionId1 = await workflowService.startStreamingWorkflow(mockFormData);
      const sessionId2 = await workflowService.startStreamingWorkflow(mockFormData);

      expect(sessionId1).not.toBe(sessionId2);
      expect(sessionId1).toMatch(/^workflow-\d+-\w+$/);
      expect(sessionId2).toMatch(/^workflow-\d+-\w+$/);
    });
  });
});
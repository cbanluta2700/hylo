/**
 * WorkflowService - Frontend client for multi-agent workflow API
 * 
 * Integrates with the LangGraph-based multi-agent system using streaming capabilities
 * Based on latest LangGraph.js patterns from Context7 MCP server
 */

import { TravelFormData } from '../../types/agents';

// Workflow Event Types based on LangGraph streaming patterns
export interface WorkflowEvent {
  type: 'values' | 'updates' | 'debug' | 'custom';
  timestamp: string;
  step?: number;
  data: any;
}

export interface AgentStatus {
  id: string;
  name: 'ContentPlanner' | 'InfoGatherer' | 'Strategist' | 'Compiler';
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: string;
  endTime?: string;
  duration?: number;
  error?: string;
}

export interface WorkflowProgress {
  currentStep: number;
  totalSteps: number;
  currentAgent: string;
  progress: number; // 0-100
  agents: AgentStatus[];
  estimatedTimeRemaining?: number;
}

export interface WorkflowResult {
  success: boolean;
  itinerary?: string;
  metadata?: {
    totalCost: number;
    executionTime: number;
    agentResults: Record<string, any>;
  };
  error?: string;
}

export interface StreamingWorkflowOptions {
  onProgress?: (progress: WorkflowProgress) => void;
  onAgentStatus?: (agent: AgentStatus) => void;
  onError?: (error: string) => void;
  onComplete?: (result: WorkflowResult) => void;
  streamMode?: ('values' | 'updates' | 'debug' | 'custom')[];
  timeout?: number; // milliseconds
}

export class WorkflowService {
  private baseUrl: string;
  private abortController: AbortController | null = null;
  
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Start streaming workflow execution with real-time progress updates
   * Based on LangGraph streaming patterns from Context7
   */
  async startStreamingWorkflow(
    formData: TravelFormData,
    options: StreamingWorkflowOptions = {}
  ): Promise<string> {
    this.abortController = new AbortController();

    const {
      onProgress,
      onAgentStatus,
      onError,
      onComplete,
      streamMode = ['values', 'debug'],
      timeout = 120000 // 2 minutes default
    } = options;

    try {
      // Generate unique session ID for workflow tracking
      const sessionId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await fetch(`${this.baseUrl}/workflow/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData,
          sessionId,
          streamMode,
          streaming: true
        }),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Streaming not supported');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      // Initialize progress tracking
      const agentStatuses: Record<string, AgentStatus> = {
        'ContentPlanner': { id: '1', name: 'ContentPlanner', status: 'pending' },
        'InfoGatherer': { id: '2', name: 'InfoGatherer', status: 'pending' },
        'Strategist': { id: '3', name: 'Strategist', status: 'pending' },
        'Compiler': { id: '4', name: 'Compiler', status: 'pending' }
      };

      let currentStep = 0;
      let finalItinerary = '';

      // Set timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          this.abortController?.abort();
          onError?.('Workflow timeout exceeded');
          reject(new Error('Workflow timeout exceeded'));
        }, timeout);
      });

      try {
        // Race between streaming and timeout
        await Promise.race([
          (async () => {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) break;

              // Decode and buffer streaming data
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || ''; // Keep incomplete line in buffer

              for (const line of lines) {
                if (line.trim() === '' || !line.startsWith('data: ')) continue;

                try {
                  const data = JSON.parse(line.replace('data: ', ''));
                  
                  // Process different event types based on LangGraph patterns
                  if (data.type === 'values') {
                    // Full state values after each step
                    this.handleValuesEvent(data, agentStatuses, onProgress, onAgentStatus);
                    
                  } else if (data.type === 'debug') {
                    // Debug events for task tracking
                    this.handleDebugEvent(data, agentStatuses, onAgentStatus);
                    
                  } else if (data.type === 'updates') {
                    // State updates from agents
                    this.handleUpdatesEvent(data, agentStatuses);
                    
                  } else if (data.type === 'complete') {
                    // Final completion event
                    finalItinerary = data.result?.itinerary || '';
                    
                    onComplete?.({
                      success: true,
                      itinerary: finalItinerary,
                      metadata: data.metadata
                    });
                    
                    break;
                    
                  } else if (data.type === 'custom' && data.data?.type === 'result') {
                    // Custom completion event (test compatibility)
                    finalItinerary = data.data?.itinerary || '';
                    
                    onComplete?.({
                      success: true,
                      itinerary: finalItinerary,
                      metadata: data.metadata
                    });
                    
                    break;
                    
                  } else if (data.type === 'error') {
                    // Error event
                    throw new Error(data.error || 'Workflow execution failed');
                  }
                  
                  currentStep = data.step || currentStep;
                  
                } catch (parseError) {
                  console.warn('Failed to parse streaming data:', parseError);
                }
              }
            }
          })(),
          timeoutPromise
        ]);
      } finally {
        reader.releaseLock();
      }

      return sessionId;

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message === 'Workflow timeout exceeded') {
          onError?.('Workflow timeout exceeded');
        } else {
          onError?.(error.message);
        }
        throw error;
      }
      
      const errorMsg = 'Unknown workflow error';
      onError?.(errorMsg);
      throw new Error(errorMsg);
    }
  }

  /**
   * Handle LangGraph 'values' events - full state after each step
   */
  private handleValuesEvent(
    data: any,
    agentStatuses: Record<string, AgentStatus>,
    onProgress?: (progress: WorkflowProgress) => void,
    onAgentStatus?: (agent: AgentStatus) => void
  ) {
    const { currentAgent, step, progress: dataProgress } = data.data || {};
    
    if (currentAgent && agentStatuses[currentAgent]) {
      const agent = agentStatuses[currentAgent];
      if (agent.status === 'pending') {
        agent.status = 'running';
        agent.startTime = new Date().toISOString();
        onAgentStatus?.(agent);
      }
    }

    // Use progress from data if available, otherwise calculate it
    let progress;
    if (dataProgress !== undefined) {
      progress = dataProgress;
    } else {
      const totalAgents = Object.keys(agentStatuses).length;
      const completedAgents = Object.values(agentStatuses).filter(a => a.status === 'completed').length;
      progress = Math.round((completedAgents / totalAgents) * 100);
    }

    onProgress?.({
      currentStep: step || 0,
      totalSteps: 4, // 4 agents
      currentAgent: currentAgent || 'Unknown',
      progress,
      agents: Object.values(agentStatuses)
    });
  }

  /**
   * Handle LangGraph 'debug' events - detailed execution tracking
   */
  private handleDebugEvent(
    data: any,
    agentStatuses: Record<string, AgentStatus>,
    onAgentStatus?: (agent: AgentStatus) => void
  ) {
    const { type, payload } = data;
    
    if (type === 'task' && payload?.name) {
      // Task started
      const agentName = this.mapNodeNameToAgent(payload.name);
      if (agentName && agentStatuses[agentName]) {
        const agent = agentStatuses[agentName];
        agent.status = 'running';
        agent.startTime = new Date().toISOString();
        onAgentStatus?.(agent);
      }
      
    } else if (type === 'task_result' && payload?.name) {
      // Task completed
      const agentName = this.mapNodeNameToAgent(payload.name);
      if (agentName && agentStatuses[agentName]) {
        const agent = agentStatuses[agentName];
        agent.status = 'completed';
        agent.endTime = new Date().toISOString();
        
        if (agent.startTime) {
          agent.duration = Date.parse(agent.endTime) - Date.parse(agent.startTime);
        }
        
        onAgentStatus?.(agent);
      }
    }
  }

  /**
   * Handle LangGraph 'updates' events - state changes
   */
  private handleUpdatesEvent(
    data: any,
    agentStatuses: Record<string, AgentStatus>
  ) {
    // Updates contain partial state changes from agents
    const updates = data.payload || {};
    
    // Extract agent information from updates
    Object.keys(updates).forEach(key => {
      const agentName = this.mapNodeNameToAgent(key);
      if (agentName && agentStatuses[agentName]) {
        const agent = agentStatuses[agentName];
        if (agent.status === 'running') {
          // Agent is making progress
          const now = new Date().toISOString();
          agent.endTime = now;
        }
      }
    });
  }

  /**
   * Map LangGraph node names to agent names
   */
  private mapNodeNameToAgent(nodeName: string): string | null {
    const mapping: Record<string, string> = {
      'content_planner': 'ContentPlanner',
      'content-planner': 'ContentPlanner',
      'info_gatherer': 'InfoGatherer', 
      'info-gatherer': 'InfoGatherer',
      'strategist': 'Strategist',
      'compiler': 'Compiler'
    };
    
    return mapping[nodeName.toLowerCase()] || null;
  }

  /**
   * Cancel ongoing workflow execution
   */
  cancelWorkflow(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Non-streaming workflow execution (fallback)
   */
  async executeWorkflow(formData: TravelFormData): Promise<WorkflowResult> {
    const response = await fetch(`${this.baseUrl}/workflow/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        formData,
        streaming: false
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      itinerary: result.itinerary,
      metadata: result.metadata
    };
  }

  /**
   * Health check for workflow API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/workflow/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get workflow status by session ID
   */
  async getWorkflowStatus(sessionId: string): Promise<WorkflowProgress | null> {
    try {
      const response = await fetch(`${this.baseUrl}/workflow/status/${sessionId}`);
      if (!response.ok) return null;
      
      return await response.json();
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const workflowService = new WorkflowService();
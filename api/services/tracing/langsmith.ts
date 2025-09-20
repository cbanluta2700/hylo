/**
 * LangSmith Tracing Service for AI Multi-Agent Workflow
 * Provides comprehensive tracing, monitoring, and debugging capabilities
 * for the Hylo travel planning agent workflow system.
 */

import { Client } from 'langsmith';

/**
 * Configuration for LangSmith client
 */
interface LangSmithConfig {
  apiKey: string;
  projectName: string;
  apiUrl?: string;
  timeout?: number;
}

/**
 * Trace data for agent execution
 */
interface AgentTraceData {
  agentName: string;
  agentVersion: string;
  operation: string;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  metadata?: Record<string, any>;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'started' | 'completed' | 'failed';
  error?: string;
  cost?: number;
  tokensUsed?: number;
}

/**
 * Workflow trace data for complete multi-agent execution
 */
interface WorkflowTraceData {
  workflowId: string;
  sessionId: string;
  destination: string;
  totalAgents: number;
  completedAgents: number;
  failedAgents: number;
  totalCost: number;
  totalTokens: number;
  totalDuration: number;
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  agentResults: Record<string, any>;
}

/**
 * Service interaction trace (web search, vector operations, etc.)
 */
interface ServiceTraceData {
  serviceName: string;
  operation: string;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'started' | 'completed' | 'failed';
  error?: string;
  cost?: number;
  tokensUsed?: number;
  metadata?: Record<string, any>;
}

/**
 * LangSmith tracing service for comprehensive workflow monitoring
 */
export class LangSmithTracingService {
  private client: Client | null = null;
  private isInitialized = false;
  private config: LangSmithConfig;
  private activeTraces = new Map<string, any>();

  constructor(config?: Partial<LangSmithConfig>) {
    this.config = {
      apiKey: process.env.LANGCHAIN_API_KEY || '',
      projectName: process.env.LANGCHAIN_PROJECT || 'hylo-travel-ai-workflow',
      apiUrl: process.env.LANGCHAIN_ENDPOINT || 'https://api.smith.langchain.com',
      timeout: 30000,
      ...config
    };
  }

  /**
   * Initialize LangSmith client
   */
  async initialize(): Promise<boolean> {
    try {
      if (!this.config.apiKey) {
        console.warn('LangSmith API key not found. Tracing will be disabled.');
        return false;
      }

      this.client = new Client({
        apiKey: this.config.apiKey,
        apiUrl: this.config.apiUrl,
      });

      // Verify connection by creating a test run
      const testStartTime = Date.now();
      await this.client.createRun({
        name: 'langsmith-init-test',
        run_type: 'chain',
        inputs: { test: true },
        project_name: this.config.projectName,
        start_time: testStartTime,
        end_time: testStartTime + 100,
      });

      this.isInitialized = true;
      console.log(`LangSmith tracing initialized for project: ${this.config.projectName}`);
      return true;

    } catch (error) {
      console.error('Failed to initialize LangSmith tracing:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Start tracing a complete workflow execution
   */
  async startWorkflowTrace(workflowData: Omit<WorkflowTraceData, 'status' | 'startTime' | 'completedAgents' | 'failedAgents' | 'totalCost' | 'totalTokens' | 'totalDuration'>): Promise<string | null> {
    if (!this.isInitialized || !this.client) {
      console.warn('LangSmith not initialized, skipping workflow trace');
      return null;
    }

    try {
      const traceId = `workflow-${workflowData.workflowId}-${Date.now()}`;
      const startTime = Date.now();

      await this.client.createRun({
        id: traceId,
        name: `Travel AI Workflow - ${workflowData.destination}`,
        run_type: 'chain',
        inputs: {
          destination: workflowData.destination,
          sessionId: workflowData.sessionId,
          totalAgents: workflowData.totalAgents
        },
        project_name: this.config.projectName,
        start_time: startTime,
        extra: {
          workflowId: workflowData.workflowId,
          destination: workflowData.destination,
          totalAgents: workflowData.totalAgents,
          tags: ['workflow', 'multi-agent', 'travel-planning']
        }
      });

      // Store in active traces
      this.activeTraces.set(traceId, {
        ...workflowData,
        status: 'started',
        startTime,
        completedAgents: 0,
        failedAgents: 0,
        totalCost: 0,
        totalTokens: 0,
        totalDuration: 0,
        agentResults: {}
      });

      console.log(`Started workflow trace: ${traceId}`);
      return traceId;

    } catch (error) {
      console.error('Failed to start workflow trace:', error);
      return null;
    }
  }

  /**
   * Update workflow trace with progress
   */
  async updateWorkflowTrace(traceId: string, updates: Partial<WorkflowTraceData>): Promise<boolean> {
    if (!this.isInitialized || !this.client || !traceId) {
      return false;
    }

    try {
      const existingTrace = this.activeTraces.get(traceId);
      if (!existingTrace) {
        console.warn(`Workflow trace ${traceId} not found in active traces`);
        return false;
      }

      const updatedTrace = { ...existingTrace, ...updates };
      this.activeTraces.set(traceId, updatedTrace);

      // Update the run in LangSmith
      await this.client.updateRun(traceId, {
        extra: {
          ...updatedTrace,
          lastUpdated: new Date().toISOString()
        }
      });

      console.log(`Updated workflow trace: ${traceId}`);
      return true;

    } catch (error) {
      console.error('Failed to update workflow trace:', error);
      return false;
    }
  }

  /**
   * Complete workflow trace
   */
  async completeWorkflowTrace(traceId: string, finalData: Partial<WorkflowTraceData>): Promise<boolean> {
    if (!this.isInitialized || !this.client || !traceId) {
      return false;
    }

    try {
      const existingTrace = this.activeTraces.get(traceId);
      if (!existingTrace) {
        console.warn(`Workflow trace ${traceId} not found in active traces`);
        return false;
      }

      const endTime = Date.now();
      const completedTrace = {
        ...existingTrace,
        ...finalData,
        endTime,
        totalDuration: endTime - existingTrace.startTime,
        status: finalData.status || 'completed'
      };

      // Complete the run in LangSmith
      await this.client.updateRun(traceId, {
        end_time: endTime,
        outputs: {
          agentResults: completedTrace.agentResults,
          totalCost: completedTrace.totalCost,
          totalTokens: completedTrace.totalTokens,
          completedAgents: completedTrace.completedAgents,
          failedAgents: completedTrace.failedAgents
        },
        extra: completedTrace
      });

      // Remove from active traces
      this.activeTraces.delete(traceId);

      console.log(`Completed workflow trace: ${traceId}`);
      return true;

    } catch (error) {
      console.error('Failed to complete workflow trace:', error);
      return false;
    }
  }

  /**
   * Start tracing an individual agent execution
   */
  async startAgentTrace(workflowTraceId: string | null, agentData: Omit<AgentTraceData, 'status' | 'startTime'>): Promise<string | null> {
    if (!this.isInitialized || !this.client) {
      console.warn('LangSmith not initialized, skipping agent trace');
      return null;
    }

    try {
      const traceId = `agent-${agentData.agentName}-${Date.now()}`;
      const startTime = Date.now();

      await this.client.createRun({
        id: traceId,
        name: `${agentData.agentName} Agent - ${agentData.operation}`,
        run_type: 'tool',
        inputs: agentData.inputs,
        project_name: this.config.projectName,
        parent_run_id: workflowTraceId || undefined,
        start_time: startTime,
        extra: {
          agentName: agentData.agentName,
          agentVersion: agentData.agentVersion,
          operation: agentData.operation,
          metadata: agentData.metadata,
          tags: ['agent', agentData.agentName, agentData.operation]
        }
      });

      console.log(`Started agent trace: ${traceId} (${agentData.agentName})`);
      return traceId;

    } catch (error) {
      console.error('Failed to start agent trace:', error);
      return null;
    }
  }

  /**
   * Complete agent trace
   */
  async completeAgentTrace(traceId: string, outputs: Record<string, any>, metadata?: { cost?: number; tokensUsed?: number; status?: 'completed' | 'failed'; error?: string }): Promise<boolean> {
    if (!this.isInitialized || !this.client || !traceId) {
      return false;
    }

    try {
      const endTime = new Date();
      
      await this.client.updateRun(traceId, {
        end_time: endTime.getTime(),
        outputs,
        error: metadata?.error,
        extra: {
          cost: metadata?.cost,
          tokensUsed: metadata?.tokensUsed,
          status: metadata?.status || 'completed',
          completedAt: endTime.toISOString()
        }
      });

      console.log(`Completed agent trace: ${traceId}`);
      return true;

    } catch (error) {
      console.error('Failed to complete agent trace:', error);
      return false;
    }
  }

  /**
   * Start tracing a service interaction (web search, vector operations, etc.)
   */
  async startServiceTrace(parentTraceId: string | null, serviceData: Omit<ServiceTraceData, 'status' | 'startTime'>): Promise<string | null> {
    if (!this.isInitialized || !this.client) {
      return null;
    }

    try {
      const traceId = `service-${serviceData.serviceName}-${Date.now()}`;
      const startTime = Date.now();

      await this.client.createRun({
        id: traceId,
        name: `${serviceData.serviceName} - ${serviceData.operation}`,
        run_type: 'tool',
        inputs: serviceData.inputs,
        project_name: this.config.projectName,
        parent_run_id: parentTraceId || undefined,
        start_time: startTime,
        extra: {
          serviceName: serviceData.serviceName,
          operation: serviceData.operation,
          metadata: serviceData.metadata,
          tags: ['service', serviceData.serviceName, serviceData.operation]
        }
      });

      return traceId;

    } catch (error) {
      console.error('Failed to start service trace:', error);
      return null;
    }
  }

  /**
   * Complete service trace
   */
  async completeServiceTrace(traceId: string, outputs: Record<string, any>, metadata?: { cost?: number; tokensUsed?: number; status?: 'completed' | 'failed'; error?: string }): Promise<boolean> {
    if (!this.isInitialized || !this.client || !traceId) {
      return false;
    }

    try {
      const endTime = new Date();
      
      await this.client.updateRun(traceId, {
        end_time: endTime.getTime(),
        outputs,
        error: metadata?.error,
        extra: {
          cost: metadata?.cost,
          tokensUsed: metadata?.tokensUsed,
          status: metadata?.status || 'completed',
          completedAt: endTime.toISOString()
        }
      });

      return true;

    } catch (error) {
      console.error('Failed to complete service trace:', error);
      return false;
    }
  }

  /**
   * Log an error with full context
   */
  async logError(error: Error, context: Record<string, any>, parentTraceId?: string): Promise<void> {
    if (!this.isInitialized || !this.client) {
      console.error('Error (LangSmith unavailable):', error, context);
      return;
    }

    try {
      const currentTime = Date.now();
      await this.client.createRun({
        name: `Error: ${error.name}`,
        run_type: 'tool',
        inputs: context,
        outputs: { error: error.message, stack: error.stack },
        project_name: this.config.projectName,
        parent_run_id: parentTraceId,
        start_time: currentTime,
        end_time: currentTime,
        error: error.message,
        extra: {
          errorType: error.constructor.name,
          context,
          timestamp: new Date().toISOString()
        }
      });

    } catch (traceError) {
      console.error('Failed to log error to LangSmith:', traceError);
      console.error('Original error:', error, context);
    }
  }

  /**
   * Get workflow statistics
   */
  getWorkflowStats(traceId: string): WorkflowTraceData | null {
    return this.activeTraces.get(traceId) || null;
  }

  /**
   * Check if tracing is available and healthy
   */
  isHealthy(): boolean {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Get configuration info
   */
  getConfig(): { projectName: string; isInitialized: boolean; hasApiKey: boolean } {
    return {
      projectName: this.config.projectName,
      isInitialized: this.isInitialized,
      hasApiKey: Boolean(this.config.apiKey)
    };
  }
}

// Export singleton instance
export const langSmithTracingService = new LangSmithTracingService();

// Export types for use by other services
export type { AgentTraceData, WorkflowTraceData, ServiceTraceData, LangSmithConfig };
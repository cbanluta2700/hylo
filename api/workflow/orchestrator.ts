/**
 * LangGraph StateGraph Workflow Orchestration for Hylo Multi-Agent System
 * 
 * This module implements the core workflow orchestration using LangGraph StateGraph
 * to manage the 4-agent pipeline: ContentPlanner → InfoGatherer → PlanningStrategist → ContentCompilerAgent
 * 
 * Based on latest LangGraph patterns from context7 research:
 * - Custom multi-agent workflow with sequential handoffs
 * - StateGraph with proper edge management and conditional routing
 * - Command objects for agent navigation and state updates
 * - Comprehensive error handling and timeout management
 */

import { StateGraph, START, END, Annotation, Command } from "@langchain/langgraph";
import { MemorySaver, InMemoryStore } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

// Import our simplified agents for testing
import { ContentPlannerAgent } from '../agents/content-planner/content-planner-simple';
import { InfoGathererAgent } from '../agents/info-gatherer/info-gatherer-simple';
import { PlanningStrategistAgent } from '../agents/planning-strategist/planning-strategist-simple';
import { ContentCompilerAgent } from '../agents/content-compiler/content-compiler-simple';

// Import types
import {
  AgentType,
  WorkflowState,
  WorkflowConfig,
  LLMProvider,
  type WorkflowContext,
  type AgentResult,
  type TravelFormData,
  type WorkflowError
} from '../../src/types/agents.js';

/**
 * Extended WorkflowContext for LangGraph StateGraph
 * Includes LangChain messages and state management capabilities
 */
export const WorkflowStateAnnotation = Annotation.Root({
  // Core workflow data
  sessionId: Annotation<string>,
  state: Annotation<WorkflowState>,
  formData: Annotation<TravelFormData>,
  config: Annotation<WorkflowConfig>,
  
  // Agent execution results
  agentResults: Annotation<Record<AgentType, AgentResult | null>>,
  
  // LangChain message history for conversation continuity
  messages: Annotation<BaseMessage[]>,
  
  // Workflow metadata and progress tracking
  metadata: Annotation<{
    startedAt: Date;
    currentAgent?: AgentType;
    currentAgentStartedAt?: Date;
    totalCost: number;
    errors: WorkflowError[];
    completedAgents: AgentType[];
    progress: {
      currentStep: number;
      totalSteps: number;
      percentage: number;
    };
  }>,
  
  // Control flow management
  nextAgent: Annotation<AgentType | null>,
  shouldContinue: Annotation<boolean>,
  errorRecovery: Annotation<{
    retryCount: number;
    maxRetries: number;
    lastError?: WorkflowError;
  }>
});

/**
 * Workflow orchestration class using LangGraph StateGraph
 */
export class HyloWorkflowOrchestrator {
  private graph: any;
  private agents: Record<AgentType, any>;
  private config: WorkflowConfig;
  private checkpointer: MemorySaver;
  private store: InMemoryStore;

  constructor(config: WorkflowConfig) {
    this.config = config;
    this.checkpointer = new MemorySaver();
    this.store = new InMemoryStore();
    
    // Initialize all agents with the workflow config
    this.agents = {
      [AgentType.CONTENT_PLANNER]: new ContentPlannerAgent(config),
      [AgentType.INFO_GATHERER]: new InfoGathererAgent(config),
      [AgentType.STRATEGIST]: new PlanningStrategistAgent(config),
      [AgentType.COMPILER]: new ContentCompilerAgent(config)
    };

    // Build the StateGraph workflow
    this.graph = this.buildWorkflow();
  }

  /**
   * Build the LangGraph StateGraph workflow with proper agent sequencing
   */
  private buildWorkflow() {
    const workflow = new StateGraph(WorkflowStateAnnotation)
      // Add all agent nodes
      .addNode("content_planner", this.contentPlannerNode.bind(this))
      .addNode("info_gatherer", this.infoGathererNode.bind(this))
      .addNode("strategist", this.strategistNode.bind(this))
      .addNode("compiler", this.compilerNode.bind(this))
      .addNode("error_handler", this.errorHandlerNode.bind(this))
      .addNode("finalizer", this.finalizerNode.bind(this))
      
      // Define the sequential workflow edges
      .addEdge(START, "content_planner")
      .addConditionalEdges("content_planner", this.routeFromContentPlanner.bind(this))
      .addConditionalEdges("info_gatherer", this.routeFromInfoGatherer.bind(this))
      .addConditionalEdges("strategist", this.routeFromStrategist.bind(this))
      .addConditionalEdges("compiler", this.routeFromCompiler.bind(this))
      .addConditionalEdges("error_handler", this.routeFromErrorHandler.bind(this))
      .addEdge("finalizer", END);

    // Compile with checkpointing for state persistence
    return workflow.compile({ 
      checkpointer: this.checkpointer, 
      store: this.store 
    });
  }

  /**
   * Content Planner Agent Node
   */
  private async contentPlannerNode(state: typeof WorkflowStateAnnotation.State) {
    const startTime = Date.now();
    
    try {
      // Update state to indicate we're starting content planning
      const updatedState = {
        ...state,
        state: WorkflowState.CONTENT_PLANNING,
        metadata: {
          ...state.metadata,
          currentAgent: AgentType.CONTENT_PLANNER,
          currentAgentStartedAt: new Date(startTime),
          progress: {
            currentStep: 1,
            totalSteps: 4,
            percentage: 25
          }
        }
      };

      // Create WorkflowContext for the agent
      const context: WorkflowContext = this.buildAgentContext(updatedState);
      
      // Execute the Content Planner agent
      const result = await this.agents[AgentType.CONTENT_PLANNER].execute(context);
      
      // Calculate execution time and cost
      const executionTime = Date.now() - startTime;
      const updatedCost = state.metadata.totalCost + result.metadata.cost;

      return new Command({
        update: {
          agentResults: {
            ...state.agentResults,
            [AgentType.CONTENT_PLANNER]: result
          },
          metadata: {
            ...updatedState.metadata,
            totalCost: updatedCost,
            completedAgents: [...state.metadata.completedAgents, AgentType.CONTENT_PLANNER]
          },
          nextAgent: result.success ? AgentType.INFO_GATHERER : null,
          shouldContinue: result.success,
          errorRecovery: {
            ...state.errorRecovery,
            retryCount: result.success ? 0 : state.errorRecovery.retryCount + 1
          }
        },
        goto: result.success ? "info_gatherer" : "error_handler"
      });
      
    } catch (error) {
      return this.handleAgentError(state, AgentType.CONTENT_PLANNER, error as Error);
    }
  }

  /**
   * Info Gatherer Agent Node
   */
  private async infoGathererNode(state: typeof WorkflowStateAnnotation.State) {
    const startTime = Date.now();
    
    try {
      const updatedState = {
        ...state,
        state: WorkflowState.INFO_GATHERING,
        metadata: {
          ...state.metadata,
          currentAgent: AgentType.INFO_GATHERER,
          currentAgentStartedAt: new Date(startTime),
          progress: {
            currentStep: 2,
            totalSteps: 4,
            percentage: 50
          }
        }
      };

      const context: WorkflowContext = this.buildAgentContext(updatedState);
      const result = await this.agents[AgentType.INFO_GATHERER].execute(context);
      
      const updatedCost = state.metadata.totalCost + result.metadata.cost;

      return new Command({
        update: {
          agentResults: {
            ...state.agentResults,
            [AgentType.INFO_GATHERER]: result
          },
          metadata: {
            ...updatedState.metadata,
            totalCost: updatedCost,
            completedAgents: [...state.metadata.completedAgents, AgentType.INFO_GATHERER]
          },
          nextAgent: result.success ? AgentType.STRATEGIST : null,
          shouldContinue: result.success,
          errorRecovery: {
            ...state.errorRecovery,
            retryCount: result.success ? 0 : state.errorRecovery.retryCount + 1
          }
        },
        goto: result.success ? "strategist" : "error_handler"
      });
      
    } catch (error) {
      return this.handleAgentError(state, AgentType.INFO_GATHERER, error as Error);
    }
  }

  /**
   * Planning Strategist Agent Node
   */
  private async strategistNode(state: typeof WorkflowStateAnnotation.State) {
    const startTime = Date.now();
    
    try {
      const updatedState = {
        ...state,
        state: WorkflowState.STRATEGIZING,
        metadata: {
          ...state.metadata,
          currentAgent: AgentType.STRATEGIST,
          currentAgentStartedAt: new Date(startTime),
          progress: {
            currentStep: 3,
            totalSteps: 4,
            percentage: 75
          }
        }
      };

      const context: WorkflowContext = this.buildAgentContext(updatedState);
      const result = await this.agents[AgentType.STRATEGIST].execute(context);
      
      const updatedCost = state.metadata.totalCost + result.metadata.cost;

      return new Command({
        update: {
          agentResults: {
            ...state.agentResults,
            [AgentType.STRATEGIST]: result
          },
          metadata: {
            ...updatedState.metadata,
            totalCost: updatedCost,
            completedAgents: [...state.metadata.completedAgents, AgentType.STRATEGIST]
          },
          nextAgent: result.success ? AgentType.COMPILER : null,
          shouldContinue: result.success,
          errorRecovery: {
            ...state.errorRecovery,
            retryCount: result.success ? 0 : state.errorRecovery.retryCount + 1
          }
        },
        goto: result.success ? "compiler" : "error_handler"
      });
      
    } catch (error) {
      return this.handleAgentError(state, AgentType.STRATEGIST, error as Error);
    }
  }

  /**
   * Content Compiler Agent Node (Final Agent)
   */
  private async compilerNode(state: typeof WorkflowStateAnnotation.State) {
    const startTime = Date.now();
    
    try {
      const updatedState = {
        ...state,
        state: WorkflowState.COMPILING,
        metadata: {
          ...state.metadata,
          currentAgent: AgentType.COMPILER,
          currentAgentStartedAt: new Date(startTime),
          progress: {
            currentStep: 4,
            totalSteps: 4,
            percentage: 100
          }
        }
      };

      const context: WorkflowContext = this.buildAgentContext(updatedState);
      const result = await this.agents[AgentType.COMPILER].execute(context);
      
      const updatedCost = state.metadata.totalCost + result.metadata.cost;

      return new Command({
        update: {
          agentResults: {
            ...state.agentResults,
            [AgentType.COMPILER]: result
          },
          state: result.success ? WorkflowState.COMPLETED : WorkflowState.FAILED,
          metadata: {
            ...updatedState.metadata,
            totalCost: updatedCost,
            completedAgents: [...state.metadata.completedAgents, AgentType.COMPILER]
          },
          nextAgent: null,
          shouldContinue: false,
          errorRecovery: {
            ...state.errorRecovery,
            retryCount: result.success ? 0 : state.errorRecovery.retryCount + 1
          }
        },
        goto: result.success ? "finalizer" : "error_handler"
      });
      
    } catch (error) {
      return this.handleAgentError(state, AgentType.COMPILER, error as Error);
    }
  }

  /**
   * Error Handler Node for managing failures and retries
   */
  private async errorHandlerNode(state: typeof WorkflowStateAnnotation.State) {
    const { errorRecovery, metadata } = state;
    
    // Check if we've exceeded max retries
    if (errorRecovery.retryCount >= errorRecovery.maxRetries) {
      return new Command({
        update: {
          state: WorkflowState.FAILED,
          shouldContinue: false,
          metadata: {
            ...metadata,
            errors: [
              ...metadata.errors,
              {
                type: 'WORKFLOW_FAILED',
                message: `Workflow failed after ${errorRecovery.maxRetries} retry attempts`,
                severity: 'high',
                recoverable: false,
                timestamp: new Date(),
                details: { 
                  lastError: errorRecovery.lastError,
                  currentAgent: metadata.currentAgent 
                }
              }
            ]
          }
        },
        goto: "finalizer"
      });
    }

    // Implement retry logic based on current agent
    const currentAgent = metadata.currentAgent;
    if (currentAgent) {
      return new Command({
        update: {
          metadata: {
            ...metadata,
            errors: [
              ...metadata.errors,
              {
                type: 'AGENT_RETRY',
                message: `Retrying ${currentAgent} (attempt ${errorRecovery.retryCount + 1})`,
                severity: 'medium',
                recoverable: true,
                timestamp: new Date(),
                details: { retryCount: errorRecovery.retryCount + 1 }
              }
            ]
          }
        },
        goto: this.getAgentNodeName(currentAgent)
      });
    }

    // If no current agent, fail the workflow
    return new Command({
      update: {
        state: WorkflowState.FAILED,
        shouldContinue: false
      },
      goto: "finalizer"
    });
  }

  /**
   * Finalizer Node for workflow cleanup and completion
   */
  private async finalizerNode(state: typeof WorkflowStateAnnotation.State) {
    // Cleanup all agents
    await Promise.all(
      Object.values(this.agents).map(agent => agent.cleanup())
    );

    // Final state update
    return {
      ...state,
      metadata: {
        ...state.metadata,
        completedAt: new Date(),
        totalExecutionTime: Date.now() - state.metadata.startedAt.getTime()
      }
    };
  }

  // Routing Functions for Conditional Edges

  private routeFromContentPlanner(state: typeof WorkflowStateAnnotation.State) {
    const result = state.agentResults[AgentType.CONTENT_PLANNER];
    return result?.success ? "info_gatherer" : "error_handler";
  }

  private routeFromInfoGatherer(state: typeof WorkflowStateAnnotation.State) {
    const result = state.agentResults[AgentType.INFO_GATHERER];
    return result?.success ? "strategist" : "error_handler";
  }

  private routeFromStrategist(state: typeof WorkflowStateAnnotation.State) {
    const result = state.agentResults[AgentType.STRATEGIST];
    return result?.success ? "compiler" : "error_handler";
  }

  private routeFromCompiler(state: typeof WorkflowStateAnnotation.State) {
    const result = state.agentResults[AgentType.COMPILER];
    return result?.success ? "finalizer" : "error_handler";
  }

  private routeFromErrorHandler(state: typeof WorkflowStateAnnotation.State) {
    if (state.errorRecovery.retryCount >= state.errorRecovery.maxRetries) {
      return "finalizer";
    }
    return state.metadata.currentAgent ? this.getAgentNodeName(state.metadata.currentAgent!) : "finalizer";
  }

  // Helper Methods

  private buildAgentContext(state: typeof WorkflowStateAnnotation.State): WorkflowContext {
    return {
      sessionId: state.sessionId,
      state: state.state,
      formData: state.formData,
      agentResults: state.agentResults,
      messages: state.messages,
      config: state.config,
      metadata: {
        startedAt: state.metadata.startedAt,
        currentAgentStartedAt: state.metadata.currentAgentStartedAt,
        totalCost: state.metadata.totalCost,
        errors: state.metadata.errors,
        metrics: {}
      }
    };
  }

  private handleAgentError(
    state: typeof WorkflowStateAnnotation.State, 
    agentType: AgentType, 
    error: Error
  ) {
    const workflowError: WorkflowError = {
      code: 'AGENT_EXECUTION_ERROR',
      message: `${agentType} failed: ${error.message}`,
      agent: agentType,
      timestamp: new Date(),
      retryable: true,
      stack: error.stack,
      context: { agentType, error: error.stack }
    };

    return new Command({
      update: {
        metadata: {
          ...state.metadata,
          errors: [...state.metadata.errors, workflowError]
        },
        errorRecovery: {
          ...state.errorRecovery,
          retryCount: state.errorRecovery.retryCount + 1,
          lastError: workflowError
        }
      },
      goto: "error_handler"
    });
  }

  private getAgentNodeName(agentType: AgentType): string {
    const nodeMap: Record<AgentType, string> = {
      [AgentType.CONTENT_PLANNER]: "content_planner",
      [AgentType.INFO_GATHERER]: "info_gatherer", 
      [AgentType.STRATEGIST]: "strategist",
      [AgentType.COMPILER]: "compiler"
    };
    return nodeMap[agentType];
  }

  /**
   * Execute the complete workflow
   */
  async executeWorkflow(
    sessionId: string,
    formData: TravelFormData,
    config?: Partial<WorkflowConfig>
  ): Promise<typeof WorkflowStateAnnotation.State> {
    // Initialize workflow state
    const initialState: typeof WorkflowStateAnnotation.State = {
      sessionId,
      state: WorkflowState.INITIALIZED,
      formData,
      config: { ...this.config, ...config },
      agentResults: {
        [AgentType.CONTENT_PLANNER]: null,
        [AgentType.INFO_GATHERER]: null,
        [AgentType.STRATEGIST]: null,
        [AgentType.COMPILER]: null
      },
      messages: [],
      metadata: {
        startedAt: new Date(),
        totalCost: 0,
        errors: [],
        completedAgents: [],
        progress: {
          currentStep: 0,
          totalSteps: 4,
          percentage: 0
        }
      },
      nextAgent: null,
      shouldContinue: true,
      errorRecovery: {
        retryCount: 0,
        maxRetries: 3
      }
    };

    // Execute the workflow graph
    const result = await this.graph.invoke(initialState, {
      configurable: { 
        thread_id: sessionId,
        checkpoint_id: `${sessionId}-${Date.now()}`
      }
    });

    return result;
  }

  /**
   * Stream workflow execution with progress updates
   */
  async* streamWorkflow(
    sessionId: string,
    formData: TravelFormData,
    config?: Partial<WorkflowConfig>
  ): AsyncGenerator<typeof WorkflowStateAnnotation.State, void, unknown> {
    // Initialize workflow state
    const initialState: typeof WorkflowStateAnnotation.State = {
      sessionId,
      state: WorkflowState.INITIALIZED,
      formData,
      config: { ...this.config, ...config },
      agentResults: {
        [AgentType.CONTENT_PLANNER]: null,
        [AgentType.INFO_GATHERER]: null,
        [AgentType.STRATEGIST]: null,
        [AgentType.COMPILER]: null
      },
      messages: [],
      metadata: {
        startedAt: new Date(),
        totalCost: 0,
        errors: [],
        completedAgents: [],
        progress: {
          currentStep: 0,
          totalSteps: 4,
          percentage: 0
        }
      },
      nextAgent: null,
      shouldContinue: true,
      errorRecovery: {
        retryCount: 0,
        maxRetries: 3
      }
    };

    // Stream the workflow execution
    for await (const step of this.graph.stream(initialState, {
      configurable: { 
        thread_id: sessionId,
        checkpoint_id: `${sessionId}-${Date.now()}`
      }
    })) {
      yield step;
    }
  }

  /**
   * Get workflow state for a session
   */
  async getWorkflowState(sessionId: string): Promise<typeof WorkflowStateAnnotation.State | null> {
    try {
      const state = await this.checkpointer.get({
        configurable: { thread_id: sessionId }
      });
      return (state?.channel_values as typeof WorkflowStateAnnotation.State) || null;
    } catch (error) {
      console.error(`Failed to get workflow state for session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Cancel a running workflow
   */
  async cancelWorkflow(sessionId: string): Promise<void> {
    // Update state to cancelled
    const currentState = await this.getWorkflowState(sessionId);
    if (currentState) {
      currentState.state = WorkflowState.CANCELLED;
      currentState.shouldContinue = false;
    }
    
    // Cleanup all agents
    await Promise.all(
      Object.values(this.agents).map(agent => agent.cleanup())
    );
  }
}

// Export default workflow configuration
export const DefaultWorkflowConfig: WorkflowConfig = {
  streaming: true,
  providerChains: {
    [AgentType.CONTENT_PLANNER]: [LLMProvider.CEREBRAS, LLMProvider.GEMINI],
    [AgentType.INFO_GATHERER]: [LLMProvider.GROQ, LLMProvider.CEREBRAS],
    [AgentType.STRATEGIST]: [LLMProvider.GEMINI, LLMProvider.CEREBRAS],
    [AgentType.COMPILER]: [LLMProvider.GEMINI, LLMProvider.GROQ]
  },
  retryConfig: {
    maxRetries: 3,
    baseDelay: 1000,
    backoffMultiplier: 2,
    maxDelay: 30000,
    retryableErrors: ['TIMEOUT', 'RATE_LIMIT', 'TEMPORARY_ERROR']
  },
  resourceLimits: {
    maxExecutionTime: 300000,  // 5 minutes
    maxCost: 10.00,
    maxTokensPerAgent: 10000,
    maxMemoryUsage: 512,  // 512 MB
    maxConcurrentWorkflows: 10
  },
  observability: {
    langsmithEnabled: true,
    langsmithProject: 'hylo-workflow',
    metricsEnabled: true,
    verboseLogging: true,
    tags: { version: '1.0.0', environment: 'production' }
  }
};
/**
 * LangGraph StateGraph Implementation for Multi-Agent Workflow
 * 
 * This file implements the LangGraph StateGraph orchestration for the four-agent workflow.
 * It manages agent transitions, state persistence, and command-based handoffs.
 * 
 * Architecture:
 * - LangGraph StateGraph with Annotation-based state management
 * - Command-based agent transitions following latest patterns
 * - Agent factory integration for dynamic agent creation
 * - Error handling and timeout management
 * 
 * Based on Context7 LangGraph patterns with TypeScript integration.
 */

import { StateGraph, Annotation, Command } from "@langchain/langgraph";
import { BaseMessage, AIMessage } from "@langchain/core/messages";
import { AgentType, WorkflowContext, AgentResult, WorkflowState } from "../../types/agents";
import { BaseAgent, AgentFactory } from "./BaseAgent";

// =============================================================================
// LANGGRAPH STATE ANNOTATION
// =============================================================================

/**
 * LangGraph state annotation for the multi-agent workflow
 * Based on latest LangGraph patterns with message accumulation
 */
export const WorkflowStateAnnotation = Annotation.Root({
  // Core workflow identification
  sessionId: Annotation<string>,
  
  // Workflow status and progress
  currentAgent: Annotation<AgentType>,
  workflowState: Annotation<WorkflowState>({
    default: () => WorkflowState.INITIALIZED
  }),
  
  // Agent communication via messages (LangGraph standard pattern)
  messages: Annotation<BaseMessage[]>({
    reducer: (current: BaseMessage[], update: BaseMessage | BaseMessage[]) => {
      const newMessages = Array.isArray(update) ? update : [update];
      return current.concat(newMessages);
    },
    default: () => []
  }),
  
  // Workflow context data
  context: Annotation<WorkflowContext | null>({
    default: () => null
  }),
  
  // Agent results storage
  agentResults: Annotation<Record<AgentType, AgentResult | null>>({
    reducer: (current: Record<AgentType, AgentResult | null>, update: Record<AgentType, AgentResult | null>) => {
      return { ...current, ...update };
    },
    default: () => ({
      [AgentType.CONTENT_PLANNER]: null,
      [AgentType.INFO_GATHERER]: null,
      [AgentType.STRATEGIST]: null,
      [AgentType.COMPILER]: null
    })
  }),
  
  // Error tracking
  hasErrors: Annotation<boolean>({
    default: () => false
  }),
  
  // Final result
  finalResult: Annotation<any | null>({
    default: () => null
  })
});

// Type inference for the workflow state
export type WorkflowGraphState = typeof WorkflowStateAnnotation.State;

// =============================================================================
// AGENT NODE FUNCTIONS
// =============================================================================

/**
 * Content Planner node function for LangGraph
 */
async function contentPlannerNode(state: WorkflowGraphState): Promise<Partial<WorkflowGraphState> | Command> {
  try {
    if (!state.context) {
      throw new Error('Workflow context is missing');
    }

    const agent = AgentFactory.getAgent(AgentType.CONTENT_PLANNER);
    const result = await agent.execute(state.context);
    
    // Update context with the result
    const updatedContext: WorkflowContext = {
      ...state.context,
      state: WorkflowState.INFO_GATHERING,
      agentResults: {
        ...state.context.agentResults,
        [AgentType.CONTENT_PLANNER]: result
      }
    };

    if (result.success) {
      // Continue to info gatherer
      return new Command({
        update: {
          currentAgent: AgentType.INFO_GATHERER,
          workflowState: WorkflowState.INFO_GATHERING,
          context: updatedContext,
          agentResults: {
            [AgentType.CONTENT_PLANNER]: result
          },
          messages: [new AIMessage({
            content: `Content Planner completed successfully. Found ${result.data?.informationNeeds?.length || 0} information needs.`,
            additional_kwargs: { agent: AgentType.CONTENT_PLANNER }
          })]
        },
        goto: AgentType.INFO_GATHERER
      });
    } else {
      // End workflow on failure
      return new Command({
        update: {
          workflowState: WorkflowState.FAILED,
          hasErrors: true,
          messages: [new AIMessage({
            content: `Content Planner failed: ${result.errors.map(e => e.message).join(', ')}`,
            additional_kwargs: { agent: AgentType.CONTENT_PLANNER }
          })]
        },
        goto: '__end__'
      });
    }
  } catch (error) {
    return new Command({
      update: {
        workflowState: WorkflowState.FAILED,
        hasErrors: true,
        messages: [new AIMessage({
          content: `Content Planner error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          additional_kwargs: { agent: AgentType.CONTENT_PLANNER }
        })]
      },
      goto: '__end__'
    });
  }
}

/**
 * Info Gatherer node function for LangGraph
 */
async function infoGathererNode(state: WorkflowGraphState): Promise<Partial<WorkflowGraphState> | Command> {
  try {
    if (!state.context) {
      throw new Error('Workflow context is missing');
    }

    const agent = AgentFactory.getAgent(AgentType.INFO_GATHERER);
    const result = await agent.execute(state.context);
    
    // Update context with the result
    const updatedContext: WorkflowContext = {
      ...state.context,
      state: WorkflowState.STRATEGIZING,
      agentResults: {
        ...state.context.agentResults,
        [AgentType.INFO_GATHERER]: result
      }
    };

    if (result.success) {
      // Continue to strategist
      return new Command({
        update: {
          currentAgent: AgentType.STRATEGIST,
          workflowState: WorkflowState.STRATEGIZING,
          context: updatedContext,
          agentResults: {
            [AgentType.INFO_GATHERER]: result
          },
          messages: [new AIMessage({
            content: `Info Gatherer completed successfully. Collected data from ${result.data?.sources?.length || 0} sources.`,
            additional_kwargs: { agent: AgentType.INFO_GATHERER }
          })]
        },
        goto: AgentType.STRATEGIST
      });
    } else {
      // End workflow on failure
      return new Command({
        update: {
          workflowState: WorkflowState.FAILED,
          hasErrors: true,
          messages: [new AIMessage({
            content: `Info Gatherer failed: ${result.errors.map(e => e.message).join(', ')}`,
            additional_kwargs: { agent: AgentType.INFO_GATHERER }
          })]
        },
        goto: '__end__'
      });
    }
  } catch (error) {
    return new Command({
      update: {
        workflowState: WorkflowState.FAILED,
        hasErrors: true,
        messages: [new AIMessage({
          content: `Info Gatherer error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          additional_kwargs: { agent: AgentType.INFO_GATHERER }
        })]
      },
      goto: '__end__'
    });
  }
}

/**
 * Strategist node function for LangGraph
 */
async function strategistNode(state: WorkflowGraphState): Promise<Partial<WorkflowGraphState> | Command> {
  try {
    if (!state.context) {
      throw new Error('Workflow context is missing');
    }

    const agent = AgentFactory.getAgent(AgentType.STRATEGIST);
    const result = await agent.execute(state.context);
    
    // Update context with the result
    const updatedContext: WorkflowContext = {
      ...state.context,
      state: WorkflowState.COMPILING,
      agentResults: {
        ...state.context.agentResults,
        [AgentType.STRATEGIST]: result
      }
    };

    if (result.success) {
      // Continue to compiler
      return new Command({
        update: {
          currentAgent: AgentType.COMPILER,
          workflowState: WorkflowState.COMPILING,
          context: updatedContext,
          agentResults: {
            [AgentType.STRATEGIST]: result
          },
          messages: [new AIMessage({
            content: `Strategist completed successfully. Generated ${result.data?.recommendations?.length || 0} recommendations.`,
            additional_kwargs: { agent: AgentType.STRATEGIST }
          })]
        },
        goto: AgentType.COMPILER
      });
    } else {
      // End workflow on failure
      return new Command({
        update: {
          workflowState: WorkflowState.FAILED,
          hasErrors: true,
          messages: [new AIMessage({
            content: `Strategist failed: ${result.errors.map(e => e.message).join(', ')}`,
            additional_kwargs: { agent: AgentType.STRATEGIST }
          })]
        },
        goto: '__end__'
      });
    }
  } catch (error) {
    return new Command({
      update: {
        workflowState: WorkflowState.FAILED,
        hasErrors: true,
        messages: [new AIMessage({
          content: `Strategist error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          additional_kwargs: { agent: AgentType.STRATEGIST }
        })]
      },
      goto: '__end__'
    });
  }
}

/**
 * Compiler node function for LangGraph
 */
async function compilerNode(state: WorkflowGraphState): Promise<Partial<WorkflowGraphState> | Command> {
  try {
    if (!state.context) {
      throw new Error('Workflow context is missing');
    }

    const agent = AgentFactory.getAgent(AgentType.COMPILER);
    const result = await agent.execute(state.context);

    if (result.success) {
      // Complete workflow successfully
      return new Command({
        update: {
          workflowState: WorkflowState.COMPLETED,
          finalResult: result.data,
          agentResults: {
            [AgentType.COMPILER]: result
          },
          messages: [new AIMessage({
            content: `Compiler completed successfully. Generated itinerary with ${result.data?.sections?.length || 0} sections.`,
            additional_kwargs: { agent: AgentType.COMPILER }
          })]
        },
        goto: '__end__'
      });
    } else {
      // End workflow on failure
      return new Command({
        update: {
          workflowState: WorkflowState.FAILED,
          hasErrors: true,
          finalResult: null,
          agentResults: {
            [AgentType.COMPILER]: result
          },
          messages: [new AIMessage({
            content: `Compiler failed: ${result.errors.map(e => e.message).join(', ')}`,
            additional_kwargs: { agent: AgentType.COMPILER }
          })]
        },
        goto: '__end__'
      });
    }
  } catch (error) {
    return new Command({
      update: {
        workflowState: WorkflowState.FAILED,
        hasErrors: true,
        finalResult: null,
        messages: [new AIMessage({
          content: `Compiler error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          additional_kwargs: { agent: AgentType.COMPILER }
        })]
      },
      goto: '__end__'
    });
  }
}

// =============================================================================
// LANGGRAPH WORKFLOW BUILDER
// =============================================================================

/**
 * Creates the LangGraph StateGraph for the multi-agent workflow
 */
export function createWorkflowGraph(): StateGraph<typeof WorkflowStateAnnotation> {
  const graph = new StateGraph(WorkflowStateAnnotation)
    // Add all agent nodes
    .addNode(AgentType.CONTENT_PLANNER, contentPlannerNode, {
      ends: [AgentType.INFO_GATHERER, '__end__']
    })
    .addNode(AgentType.INFO_GATHERER, infoGathererNode, {
      ends: [AgentType.STRATEGIST, '__end__']
    })
    .addNode(AgentType.STRATEGIST, strategistNode, {
      ends: [AgentType.COMPILER, '__end__']
    })
    .addNode(AgentType.COMPILER, compilerNode, {
      ends: ['__end__']
    })
    // Set the workflow entry point
    .addEdge('__start__', AgentType.CONTENT_PLANNER);

  return graph;
}

/**
 * Compiles the workflow graph and returns a runnable
 */
export function compileWorkflowGraph() {
  return createWorkflowGraph().compile();
}

// =============================================================================
// WORKFLOW EXECUTION UTILITIES
// =============================================================================

/**
 * Utility class for workflow execution and management
 */
export class WorkflowExecutor {
  private static compiledGraph: ReturnType<typeof compileWorkflowGraph> | null = null;

  /**
   * Gets or creates the compiled workflow graph
   */
  static getCompiledGraph() {
    if (!this.compiledGraph) {
      this.compiledGraph = compileWorkflowGraph();
    }
    return this.compiledGraph;
  }

  /**
   * Executes the complete workflow with the given context
   */
  static async executeWorkflow(context: WorkflowContext): Promise<WorkflowGraphState> {
    const graph = this.getCompiledGraph();
    
    const initialState: Partial<WorkflowGraphState> = {
      sessionId: context.sessionId,
      currentAgent: AgentType.CONTENT_PLANNER,
      workflowState: WorkflowState.CONTENT_PLANNING,
      context,
      messages: [],
      agentResults: {
        [AgentType.CONTENT_PLANNER]: null,
        [AgentType.INFO_GATHERER]: null,
        [AgentType.STRATEGIST]: null,
        [AgentType.COMPILER]: null
      },
      hasErrors: false,
      finalResult: null
    };

    try {
      const finalState = await graph.invoke(initialState);
      return finalState;
    } catch (error) {
      console.error('Workflow execution failed:', error);
      throw error;
    }
  }

  /**
   * Streams the workflow execution with real-time updates
   */
  static async* streamWorkflow(context: WorkflowContext): AsyncGenerator<WorkflowGraphState> {
    const graph = this.getCompiledGraph();
    
    const initialState: Partial<WorkflowGraphState> = {
      sessionId: context.sessionId,
      currentAgent: AgentType.CONTENT_PLANNER,
      workflowState: WorkflowState.CONTENT_PLANNING,
      context,
      messages: [],
      agentResults: {
        [AgentType.CONTENT_PLANNER]: null,
        [AgentType.INFO_GATHERER]: null,
        [AgentType.STRATEGIST]: null,
        [AgentType.COMPILER]: null
      },
      hasErrors: false,
      finalResult: null
    };

    try {
      for await (const chunk of graph.stream(initialState)) {
        yield chunk;
      }
    } catch (error) {
      console.error('Workflow streaming failed:', error);
      throw error;
    }
  }

  /**
   * Validates that a workflow context is ready for execution
   */
  static validateWorkflowContext(context: WorkflowContext): boolean {
    if (!context.sessionId || !context.formData) {
      return false;
    }

    // Validate required form data fields
    const requiredFields = ['destination', 'adults', 'children', 'departureDate', 'returnDate', 'budget'];
    for (const field of requiredFields) {
      if (!context.formData[field as keyof typeof context.formData]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Resets the compiled graph (useful for testing)
   */
  static resetGraph(): void {
    this.compiledGraph = null;
    AgentFactory.clearCache();
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  WorkflowStateAnnotation,
  contentPlannerNode,
  infoGathererNode,
  strategistNode,
  compilerNode
};
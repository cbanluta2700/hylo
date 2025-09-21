/**
 * Query Distribution System
 * Intelligently assigns queries to appropriate agents based on content and context
 */

import { SmartQuery, QueryDistribution, AgentAssignment } from '../types/smart-query';
import { EnhancedFormData } from '../types/form-data';

/**
 * Query Distribution Strategy
 */
export interface DistributionStrategy {
  name: string;
  description: string;
  assignQueries: (queries: SmartQuery[], context: QueryContext) => AgentAssignment[];
}

/**
 * Query Context for Distribution
 */
export interface QueryContext {
  formData: EnhancedFormData;
  agentCapabilities?: AgentCapabilities;
  workflowConstraints?: WorkflowConstraints;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Agent Capabilities and Constraints
 */
export interface AgentCapabilities {
  architect: {
    maxQueries: number;
    supportedTypes: string[];
    processingTime: number; // estimated seconds per query
  };
  gatherer: {
    maxQueries: number;
    supportedTypes: string[];
    processingTime: number;
  };
  specialist: {
    maxQueries: number;
    supportedTypes: string[];
    processingTime: number;
  };
  putter: {
    maxQueries: number;
    supportedTypes: string[];
    processingTime: number;
  };
}

export interface WorkflowConstraints {
  maxConcurrentAgents: number;
  maxTotalProcessingTime: number; // seconds
  priorityThresholds: {
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * Default Agent Capabilities
 */
const DEFAULT_AGENT_CAPABILITIES: AgentCapabilities = {
  architect: {
    maxQueries: 5,
    supportedTypes: ['general', 'itinerary', 'planning'],
    processingTime: 30,
  },
  gatherer: {
    maxQueries: 10,
    supportedTypes: ['flights', 'accommodations', 'transportation', 'weather', 'cruises'],
    processingTime: 15,
  },
  specialist: {
    maxQueries: 8,
    supportedTypes: ['activities', 'dining', 'cultural', 'safety', 'local'],
    processingTime: 20,
  },
  putter: {
    maxQueries: 3,
    supportedTypes: ['formatting', 'synthesis', 'final'],
    processingTime: 25,
  },
};

/**
 * Distribute queries to agents based on intelligent assignment
 */
export function distributeQueries(queries: SmartQuery[], context: QueryContext): QueryDistribution {
  const strategy = selectDistributionStrategy(queries, context);
  const assignments = strategy.assignQueries(queries, context);

  return {
    queries,
    agentAssignments: assignments,
    workflowId: generateWorkflowId(),
    metadata: {
      totalQueries: queries.length,
      distributionStrategy: strategy.name,
      estimatedProcessingTime: calculateEstimatedProcessingTime(assignments),
    },
  };
}

/**
 * Select appropriate distribution strategy based on query characteristics
 */
function selectDistributionStrategy(
  queries: SmartQuery[],
  context: QueryContext
): DistributionStrategy {
  const queryCount = queries.length;
  const highPriorityCount = queries.filter((q) => q.priority === 'high').length;
  const agentCapabilities = context.agentCapabilities || DEFAULT_AGENT_CAPABILITIES;

  // Strategy selection logic
  if (queryCount <= 3) {
    return new SimpleDistributionStrategy(agentCapabilities);
  } else if (highPriorityCount > queryCount * 0.6) {
    return new PriorityBasedDistributionStrategy();
  } else if (queryCount > 10) {
    return new LoadBalancedDistributionStrategy(agentCapabilities);
  } else {
    return new BalancedDistributionStrategy(agentCapabilities);
  }
}

/**
 * Simple Distribution Strategy - For small query sets
 */
class SimpleDistributionStrategy implements DistributionStrategy {
  name = 'simple';
  description = 'Simple assignment for small query sets';

  constructor(private capabilities: AgentCapabilities) {}

  assignQueries(queries: SmartQuery[], _context: QueryContext): AgentAssignment[] {
    const assignments: AgentAssignment[] = [];
    const agentQueries: Record<string, SmartQuery[]> = {
      architect: [],
      gatherer: [],
      specialist: [],
      putter: [],
    };

    // Simple assignment based on query type
    for (const query of queries) {
      const agentType = query.agent;
      const maxQueries = this.capabilities[agentType as keyof AgentCapabilities].maxQueries;
      if (agentQueries[agentType]!.length < maxQueries) {
        agentQueries[agentType]!.push(query);
      } else {
        // Fallback to gatherer if agent is full
        agentQueries['gatherer']!.push(query);
      }
    }

    // Create assignments
    for (const [agentType, queries] of Object.entries(agentQueries)) {
      if (queries.length > 0) {
        assignments.push({
          agentType: agentType as any,
          queries,
          priority: determineAgentPriority(queries),
        });
      }
    }

    return assignments;
  }
}

/**
 * Priority-Based Distribution Strategy - For high-priority queries
 */
class PriorityBasedDistributionStrategy implements DistributionStrategy {
  name = 'priority-based';
  description = 'Prioritizes high-priority queries with dedicated agents';

  assignQueries(queries: SmartQuery[], _context: QueryContext): AgentAssignment[] {
    const assignments: AgentAssignment[] = [];

    // Separate by priority
    const highPriority = queries.filter((q) => q.priority === 'high');
    const mediumPriority = queries.filter((q) => q.priority === 'medium');
    const lowPriority = queries.filter((q) => q.priority === 'low');

    // Assign high priority queries first
    if (highPriority.length > 0) {
      assignments.push({
        agentType: 'gatherer',
        queries: highPriority.filter((q) => q.agent === 'gatherer'),
        priority: 'high',
      });
      assignments.push({
        agentType: 'specialist',
        queries: highPriority.filter((q) => q.agent === 'specialist'),
        priority: 'high',
      });
    }

    // Assign remaining queries
    const remainingQueries = [...mediumPriority, ...lowPriority];
    if (remainingQueries.length > 0) {
      assignments.push({
        agentType: 'architect',
        queries: remainingQueries.filter((q) => q.agent === 'architect'),
        priority: 'medium',
      });
      assignments.push({
        agentType: 'putter',
        queries: remainingQueries.filter((q) => q.agent === 'putter'),
        priority: 'low',
      });
    }

    return assignments.filter((a) => a.queries.length > 0);
  }
}

/**
 * Load-Balanced Distribution Strategy - For large query sets
 */
class LoadBalancedDistributionStrategy implements DistributionStrategy {
  name = 'load-balanced';
  description = 'Balances load across all available agents';

  constructor(private capabilities: AgentCapabilities) {}

  assignQueries(queries: SmartQuery[], context: QueryContext): AgentAssignment[] {
    const assignments: AgentAssignment[] = [];
    const agentLoad: Record<string, number> = {
      architect: 0,
      gatherer: 0,
      specialist: 0,
      putter: 0,
    };

    // Sort queries by priority (high first)
    const sortedQueries = [...queries].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    for (const query of sortedQueries) {
      const preferredAgent = query.agent;
      let assignedAgent = preferredAgent;

      // Find least loaded agent that can handle this query type
      if (
        agentLoad[preferredAgent] >=
        this.capabilities[preferredAgent as keyof AgentCapabilities].maxQueries
      ) {
        const availableAgents = Object.keys(agentLoad).filter(
          (agent) =>
            agentLoad[agent] < this.capabilities[agent as keyof AgentCapabilities].maxQueries &&
            this.capabilities[agent as keyof AgentCapabilities].supportedTypes.includes(query.type)
        );

        if (availableAgents.length > 0) {
          assignedAgent = availableAgents.reduce((minAgent, agent) =>
            agentLoad[agent] < agentLoad[minAgent] ? agent : minAgent
          );
        }
      }

      agentLoad[assignedAgent]++;
    }

    // Create assignments from load distribution
    for (const [agentType, load] of Object.entries(agentLoad)) {
      if (load > 0) {
        const agentQueries = sortedQueries.filter((_, index) => {
          // This is a simplified mapping - in practice, you'd track which queries went to which agent
          return true; // Placeholder logic
        });

        assignments.push({
          agentType: agentType as any,
          queries: agentQueries,
          priority: determineAgentPriority(agentQueries),
        });
      }
    }

    return assignments;
  }
}

/**
 * Balanced Distribution Strategy - Default strategy
 */
class BalancedDistributionStrategy implements DistributionStrategy {
  name = 'balanced';
  description = 'Balanced distribution across all agents';

  constructor(private capabilities: AgentCapabilities) {}

  assignQueries(queries: SmartQuery[], context: QueryContext): AgentAssignment[] {
    const assignments: AgentAssignment[] = [];
    const agentQueries: Record<string, SmartQuery[]> = {
      architect: [],
      gatherer: [],
      specialist: [],
      putter: [],
    };

    // Group queries by preferred agent
    for (const query of queries) {
      const agentType = query.agent;
      agentQueries[agentType].push(query);
    }

    // Balance load by moving queries from overloaded agents
    this.balanceLoad(agentQueries);

    // Create assignments
    for (const [agentType, queries] of Object.entries(agentQueries)) {
      if (queries.length > 0) {
        assignments.push({
          agentType: agentType as any,
          queries,
          priority: determineAgentPriority(queries),
        });
      }
    }

    return assignments;
  }

  private balanceLoad(agentQueries: Record<string, SmartQuery[]>): void {
    const agentTypes = Object.keys(agentQueries);

    for (const agentType of agentTypes) {
      const maxQueries = this.capabilities[agentType as keyof AgentCapabilities].maxQueries;
      const currentQueries = agentQueries[agentType];

      if (currentQueries.length > maxQueries) {
        const overflow = currentQueries.splice(maxQueries);

        // Redistribute overflow to other agents
        for (const overflowQuery of overflow) {
          const targetAgent = this.findBestTargetAgent(overflowQuery, agentQueries);
          if (targetAgent) {
            agentQueries[targetAgent].push(overflowQuery);
          }
        }
      }
    }
  }

  private findBestTargetAgent(
    query: SmartQuery,
    agentQueries: Record<string, SmartQuery[]>
  ): string | null {
    const candidates = Object.keys(agentQueries).filter(
      (agent) =>
        agent !== query.agent &&
        agentQueries[agent].length <
          this.capabilities[agent as keyof AgentCapabilities].maxQueries &&
        this.capabilities[agent as keyof AgentCapabilities].supportedTypes.includes(query.type)
    );

    if (candidates.length === 0) return null;

    // Return agent with lowest current load
    return candidates.reduce((best, agent) =>
      agentQueries[agent].length < agentQueries[best].length ? agent : best
    );
  }
}

/**
 * Utility Functions
 */

function determineAgentPriority(queries: SmartQuery[]): 'high' | 'medium' | 'low' {
  const highCount = queries.filter((q) => q.priority === 'high').length;
  const mediumCount = queries.filter((q) => q.priority === 'medium').length;

  if (highCount > queries.length * 0.5) return 'high';
  if (mediumCount > queries.length * 0.5) return 'medium';
  return 'low';
}

function calculateEstimatedProcessingTime(assignments: AgentAssignment[]): number {
  let totalTime = 0;

  for (const assignment of assignments) {
    const agentType = assignment.agentType;
    const queryCount = assignment.queries.length;
    const processingTimePerQuery = DEFAULT_AGENT_CAPABILITIES[agentType].processingTime;

    totalTime += queryCount * processingTimePerQuery;
  }

  return totalTime;
}

function generateWorkflowId(): string {
  return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Advanced Distribution Features
 */

/**
 * Optimize query distribution for parallel processing
 */
export function optimizeForParallelProcessing(distribution: QueryDistribution): QueryDistribution {
  const assignments = distribution.agentAssignments;

  // Sort assignments by estimated processing time (longest first)
  assignments.sort((a, b) => {
    const timeA = calculateAssignmentProcessingTime(a);
    const timeB = calculateAssignmentProcessingTime(b);
    return timeB - timeA;
  });

  return {
    ...distribution,
    agentAssignments: assignments,
  };
}

/**
 * Calculate processing time for a single assignment
 */
function calculateAssignmentProcessingTime(assignment: AgentAssignment): number {
  const agentType = assignment.agentType;
  const queryCount = assignment.queries.length;
  return queryCount * DEFAULT_AGENT_CAPABILITIES[agentType].processingTime;
}

/**
 * Validate query distribution
 */
export function validateDistribution(distribution: QueryDistribution): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check total queries match
  const totalAssignedQueries = distribution.agentAssignments.reduce(
    (sum, assignment) => sum + assignment.queries.length,
    0
  );

  if (totalAssignedQueries !== distribution.queries.length) {
    errors.push('Total assigned queries does not match original query count');
  }

  // Check agent capacity
  for (const assignment of distribution.agentAssignments) {
    const agentType = assignment.agentType;
    const maxQueries = DEFAULT_AGENT_CAPABILITIES[agentType].maxQueries;

    if (assignment.queries.length > maxQueries) {
      warnings.push(
        `${agentType} agent overloaded: ${assignment.queries.length}/${maxQueries} queries`
      );
    }
  }

  // Check for empty assignments
  const emptyAssignments = distribution.agentAssignments.filter((a) => a.queries.length === 0);
  if (emptyAssignments.length > 0) {
    warnings.push(`${emptyAssignments.length} agent assignments are empty`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validation Rules:
 * - Total assigned queries must equal original query count
 * - No agent should exceed their maximum query capacity
 * - All query types should be supported by assigned agents
 * - Workflow ID should be unique and properly formatted
 * - Estimated processing time should be reasonable
 */

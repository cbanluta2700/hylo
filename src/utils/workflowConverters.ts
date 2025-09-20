/**
 * Workflow Data Converters
 * Converts between different agent data formats for compatibility
 */

import { AgentStatus } from '../services/workflow/WorkflowService';

// BehindTheScenes AgentLog interface (local copy to avoid circular imports)
interface AgentLog {
  agentId: number;
  agentName: string;
  model: string;
  timestamp: string;
  input: any;
  output: any;
  searchQueries?: string[];
  decisions?: string[];
  provider?: string;
  latency?: number;
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
  cost?: number;
  complexity?: string;
  fallbackChain?: string[];
  traceId?: string;
  reasoning?: string;
}

/**
 * Convert AgentStatus from workflow to AgentLog format for BehindTheScenes
 */
export function convertAgentStatusToLog(agent: AgentStatus): AgentLog {
  // Map agent names to numeric IDs for BehindTheScenes display
  const agentIdMap: Record<AgentStatus['name'], number> = {
    'ContentPlanner': 1,
    'InfoGatherer': 2,
    'Strategist': 3,
    'Compiler': 4,
  };

  // Map agent names to model descriptions
  const modelMap: Record<AgentStatus['name'], string> = {
    'ContentPlanner': 'Planning Agent',
    'InfoGatherer': 'Research Agent',
    'Strategist': 'Strategy Agent',
    'Compiler': 'Content Agent',
  };

  // Generate decisions based on agent status
  const decisions: string[] = [];
  
  switch (agent.status) {
    case 'pending':
      decisions.push('Agent queued for execution');
      break;
    case 'running':
      decisions.push('Agent processing request');
      break;
    case 'completed':
      decisions.push('Agent completed successfully');
      break;
    case 'error':
      decisions.push('Agent encountered error');
      if (agent.error) {
        decisions.push(`Error: ${agent.error}`);
      }
      break;
  }

  return {
    agentId: agentIdMap[agent.name] || 0,
    agentName: agent.name,
    model: modelMap[agent.name] || 'AI Agent',
    timestamp: agent.startTime || new Date().toISOString(),
    input: 'Travel form data and context',
    output: agent.status === 'completed' ? 'Processing completed' : 
            agent.status === 'error' ? 'Processing failed' : 
            'Processing in progress',
    decisions,
    provider: 'Multi-Agent System',
    latency: agent.duration || 0,
    tokens: {
      input: 0, // These would come from actual LLM responses
      output: 0,
      total: 0,
    },
    complexity: agent.status === 'error' ? 'High' : 'Medium',
    traceId: agent.id,
    reasoning: `${agent.name} agent execution`,
  };
}

/**
 * Convert array of AgentStatus to array of AgentLog
 */
export function convertAgentStatusArrayToLogs(agents: AgentStatus[]): AgentLog[] {
  return agents.map(convertAgentStatusToLog);
}
/**
 * Agent Progress Component - Real-time visualization of multi-agent workflow
 * Provides live updates on agent execution status, progress indicators, and performance metrics
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Activity, 
  Zap, 
  Database,
  Search,
  Brain,
  FileText,
  TrendingUp,
  Timer,
  DollarSign
} from 'lucide-react';

/**
 * Agent execution status and progress data
 */
export interface AgentStatus {
  name: string;
  displayName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  startTime?: number;
  endTime?: number;
  duration?: number;
  cost?: number;
  tokensUsed?: number;
  error?: string;
  currentOperation?: string;
  operationProgress?: number; // 0-100
  metadata?: {
    vectorOperations?: number;
    searchQueries?: number;
    embeddingCount?: number;
    dataPointsGathered?: number;
  };
}

/**
 * Overall workflow progress data
 */
export interface WorkflowProgress {
  sessionId: string;
  workflowId: string;
  destination: string;
  status: 'initializing' | 'running' | 'completed' | 'failed';
  currentAgent: string | null;
  totalAgents: number;
  completedAgents: number;
  failedAgents: number;
  overallProgress: number; // 0-100
  totalCost: number;
  totalTokens: number;
  totalDuration: number;
  estimatedTimeRemaining?: number;
  agents: AgentStatus[];
  errors?: string[];
}

/**
 * Props for AgentProgress component
 */
interface AgentProgressProps {
  workflowProgress: WorkflowProgress;
  className?: string;
  showDetailedMetrics?: boolean;
  onAgentClick?: (agentName: string) => void;
  isRealTimeUpdate?: boolean;
}

/**
 * Icon mapping for each agent type
 */
const AGENT_ICONS = {
  'content-planner': Brain,
  'info-gatherer': Search,
  'strategist': TrendingUp,
  'compiler': FileText
};

/**
 * Color mapping for status indicators
 */
const STATUS_COLORS = {
  pending: 'text-gray-400 bg-gray-100',
  running: 'text-blue-600 bg-blue-100',
  completed: 'text-green-600 bg-green-100',
  failed: 'text-red-600 bg-red-100'
};

/**
 * Progress bar colors
 */
const PROGRESS_COLORS = {
  pending: 'bg-gray-200',
  running: 'bg-blue-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500'
};

/**
 * AgentProgress Component - Displays real-time multi-agent workflow progress
 */
export const AgentProgress: React.FC<AgentProgressProps> = ({
  workflowProgress,
  className = '',
  showDetailedMetrics = true,
  onAgentClick,
  isRealTimeUpdate = true
}) => {
  const [animatedProgress, setAnimatedProgress] = useState<Record<string, number>>({});
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Animate progress changes
  useEffect(() => {
    const newAnimatedProgress: Record<string, number> = {};
    workflowProgress.agents.forEach(agent => {
      newAnimatedProgress[agent.name] = agent.progress;
    });
    
    setAnimatedProgress(newAnimatedProgress);
    setLastUpdate(Date.now());
  }, [workflowProgress.agents]);

  /**
   * Format duration in human readable format
   */
  const formatDuration = useCallback((milliseconds: number): string => {
    if (milliseconds < 1000) return `${milliseconds}ms`;
    if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`;
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }, []);

  /**
   * Format cost in USD
   */
  const formatCost = useCallback((cost: number): string => {
    return `$${cost.toFixed(4)}`;
  }, []);

  /**
   * Format number with commas
   */
  const formatNumber = useCallback((num: number): string => {
    return num.toLocaleString();
  }, []);

  /**
   * Get status icon for agent
   */
  const getStatusIcon = useCallback((status: AgentStatus['status']) => {
    switch (status) {
      case 'pending': return Clock;
      case 'running': return Activity;
      case 'completed': return CheckCircle;
      case 'failed': return AlertCircle;
    }
  }, []);

  /**
   * Calculate estimated time remaining
   */
  const calculateEstimatedTime = useCallback((agent: AgentStatus): string => {
    if (agent.status !== 'running' || !agent.startTime || agent.progress === 0) {
      return '—';
    }
    
    const elapsed = Date.now() - agent.startTime;
    const progressRate = agent.progress / 100;
    const totalEstimated = elapsed / progressRate;
    const remaining = totalEstimated - elapsed;
    
    return remaining > 0 ? formatDuration(remaining) : '—';
  }, [formatDuration]);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Workflow Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Zap className={`w-5 h-5 ${workflowProgress.status === 'running' ? 'text-blue-500 animate-pulse' : 'text-gray-500'}`} />
            <h3 className="text-lg font-semibold text-gray-900">
              AI Workflow Progress
            </h3>
          </div>
          {workflowProgress.status === 'running' && (
            <div className="flex items-center space-x-1 text-sm text-blue-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
          )}
        </div>
        
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">
            {workflowProgress.destination}
          </div>
          <div className="text-xs text-gray-500">
            {workflowProgress.completedAgents} / {workflowProgress.totalAgents} agents completed
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-medium text-gray-900">
            {workflowProgress.overallProgress.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-500 h-3 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${workflowProgress.overallProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Workflow Summary Metrics */}
      {showDetailedMetrics && (
        <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Timer className="w-4 h-4 text-gray-500 mr-1" />
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {formatDuration(workflowProgress.totalDuration)}
            </div>
            <div className="text-xs text-gray-500">Duration</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <DollarSign className="w-4 h-4 text-gray-500 mr-1" />
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCost(workflowProgress.totalCost)}
            </div>
            <div className="text-xs text-gray-500">Cost</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Zap className="w-4 h-4 text-gray-500 mr-1" />
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {formatNumber(workflowProgress.totalTokens)}
            </div>
            <div className="text-xs text-gray-500">Tokens</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Database className="w-4 h-4 text-gray-500 mr-1" />
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {workflowProgress.agents.reduce((sum, agent) => 
                sum + (agent.metadata?.vectorOperations || 0), 0
              )}
            </div>
            <div className="text-xs text-gray-500">Vector Ops</div>
          </div>
        </div>
      )}

      {/* Individual Agent Progress */}
      <div className="space-y-4">
        {workflowProgress.agents.map((agent) => {
          const StatusIcon = getStatusIcon(agent.status);
          const AgentIcon = AGENT_ICONS[agent.name as keyof typeof AGENT_ICONS] || Brain;
          
          return (
            <div 
              key={agent.name}
              className={`p-4 border border-gray-200 rounded-lg transition-all duration-300 hover:shadow-sm ${
                onAgentClick ? 'cursor-pointer hover:bg-gray-50' : ''
              }`}
              onClick={() => onAgentClick?.(agent.name)}
            >
              {/* Agent Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${STATUS_COLORS[agent.status]}`}>
                    <AgentIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{agent.displayName}</h4>
                    {agent.currentOperation && agent.status === 'running' && (
                      <p className="text-sm text-gray-600">{agent.currentOperation}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <StatusIcon className={`w-5 h-5 ${STATUS_COLORS[agent.status].split(' ')[0]}`} />
                  <span className={`text-sm font-medium capitalize ${STATUS_COLORS[agent.status].split(' ')[0]}`}>
                    {agent.status}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm font-medium">{agent.progress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ease-out ${PROGRESS_COLORS[agent.status]}`}
                    style={{ width: `${animatedProgress[agent.name] || agent.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Agent Metrics */}
              {showDetailedMetrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="ml-1 font-medium">
                      {agent.duration ? formatDuration(agent.duration) : 
                       agent.status === 'running' && agent.startTime ? 
                       formatDuration(Date.now() - agent.startTime) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">ETA:</span>
                    <span className="ml-1 font-medium">
                      {calculateEstimatedTime(agent)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Cost:</span>
                    <span className="ml-1 font-medium">
                      {agent.cost ? formatCost(agent.cost) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tokens:</span>
                    <span className="ml-1 font-medium">
                      {agent.tokensUsed ? formatNumber(agent.tokensUsed) : '—'}
                    </span>
                  </div>
                </div>
              )}

              {/* Detailed Metadata for Info Gatherer */}
              {agent.name === 'info-gatherer' && agent.metadata && showDetailedMetrics && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Search Queries:</span>
                      <span className="ml-1 font-medium">
                        {agent.metadata.searchQueries || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Embeddings:</span>
                      <span className="ml-1 font-medium">
                        {agent.metadata.embeddingCount || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Vector Ops:</span>
                      <span className="ml-1 font-medium">
                        {agent.metadata.vectorOperations || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Data Points:</span>
                      <span className="ml-1 font-medium">
                        {agent.metadata.dataPointsGathered || 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {agent.error && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <strong>Error:</strong> {agent.error}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Workflow Errors */}
      {workflowProgress.errors && workflowProgress.errors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2">Workflow Errors</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {workflowProgress.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Last Update Timestamp */}
      {isRealTimeUpdate && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Last updated: {new Date(lastUpdate).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default AgentProgress;
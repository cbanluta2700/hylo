/**
 * Smart Query System Types
 * Interfaces for intelligent query generation and agent task distribution
 */

export interface SmartQuery {
  type: string;
  query: string;
  priority: 'high' | 'medium' | 'low';
  agent: 'architect' | 'gatherer' | 'specialist' | 'putter';
  specialSource?: string;
}

export interface QueryTemplate {
  id: string;
  category: string;
  template: string;
  variables: string[];
  agent: 'architect' | 'gatherer' | 'specialist' | 'putter';
  priority: 'high' | 'medium' | 'low';
}

export interface QueryDistribution {
  queries: SmartQuery[];
  agentAssignments: AgentAssignment[];
  workflowId: string;
  metadata: {
    totalQueries: number;
    distributionStrategy: string;
    estimatedProcessingTime: number;
  };
}

export interface AgentAssignment {
  agentType: 'architect' | 'gatherer' | 'specialist' | 'putter';
  queries: SmartQuery[];
  priority: 'high' | 'medium' | 'low';
  dependencies?: string[]; // Query IDs this depends on
}

export interface QueryContext {
  formData: any; // EnhancedFormData
  userPreferences?: UserPreferences;
  previousQueries?: SmartQuery[];
  sessionId: string;
}

export interface UserPreferences {
  language: string;
  currency: string;
  detailLevel: 'basic' | 'detailed' | 'comprehensive';
  sources: string[]; // Preferred data sources
}

export interface QueryResult {
  queryId: string;
  agentId: string;
  result: any;
  confidence: number;
  processingTime: number;
  sources: SourceReference[];
  timestamp: string;
}

export interface SourceReference {
  type: 'search' | 'api' | 'database';
  provider?: string;
  url?: string;
  reliability: number; // 0-1 scale
}

/**
 * Query Generation Functions
 */

export interface QueryGenerator {
  generateQueries(context: QueryContext): SmartQuery[];
  validateQuery(query: SmartQuery): boolean;
  prioritizeQueries(queries: SmartQuery[]): SmartQuery[];
}

export interface QueryTemplateEngine {
  render(template: QueryTemplate, context: QueryContext): string;
  validateTemplate(template: QueryTemplate): boolean;
  getAvailableTemplates(): QueryTemplate[];
}

/**
 * Validation Rules:
 * - query must be non-empty string
 * - priority must be valid enum value
 * - agent must be valid agent type
 * - confidence must be between 0 and 1
 * - reliability must be between 0 and 1
 */

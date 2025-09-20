// Types for the main App component after removing AI/LLM functionality

export interface TravelFormData {
  tripDetails: any;
  groups: string[];
  interests: string[];
  inclusions: string[];
  experience: string[];
  vibes: string[];
  sampleDays: string[];
  dinnerChoices: string[];
  nickname: string;
  contact: any;
}

export interface AgentLog {
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

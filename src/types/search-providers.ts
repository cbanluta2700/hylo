/**
 * Search Provider Interfaces
 * Type definitions for external search and data collection services
 */

export interface SearchProvider {
  name: string;
  type: 'search' | 'scraping' | 'api';
  capabilities: ProviderCapability[];
  rateLimits: RateLimit;
  supportedQueries: QueryType[];
}

export interface ProviderCapability {
  type: 'web_search' | 'content_extraction' | 'image_search' | 'news_search' | 'neural_search';
  maxResults: number;
  supportsFiltering: boolean;
  supportsSorting: boolean;
}

export type QueryType = 'text' | 'image' | 'structured' | 'neural';

export interface RateLimit {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  concurrentRequests: number;
}

/**
 * Search Request/Response Interfaces
 */

export interface SearchRequest {
  query: string;
  type: QueryType;
  provider: string;
  options?: SearchOptions;
  context?: SearchContext;
}

export interface SearchOptions {
  maxResults?: number;
  includeImages?: boolean;
  includeNews?: boolean;
  dateRange?: DateRange;
  language?: string;
  region?: string;
  safeSearch?: boolean;
}

export interface DateRange {
  from: string; // ISO date
  to: string; // ISO date
}

export interface SearchContext {
  userLocation?: string;
  userPreferences?: UserSearchPreferences;
  previousQueries?: string[];
  sessionId: string;
}

export interface UserSearchPreferences {
  language: string;
  region: string;
  contentTypes: string[];
  qualityThreshold: number; // 0-1
}

export interface SearchResponse {
  query: string;
  provider: string;
  results: SearchResultItem[];
  metadata: SearchMetadata;
  errors?: SearchError[];
}

export interface SearchResultItem {
  id: string;
  title: string;
  url: string;
  snippet: string;
  content?: string;
  publishedDate?: string;
  author?: string;
  source: string;
  relevanceScore: number; // 0-1
  images?: ImageResult[];
  structuredData?: any;
}

export interface ImageResult {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  thumbnail?: string;
}

export interface SearchMetadata {
  totalResults: number;
  searchTime: number; // milliseconds
  provider: string;
  queryType: QueryType;
  timestamp: string;
  cacheHit?: boolean;
  cost?: number; // API cost in USD
}

export interface SearchError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
}

/**
 * Provider-Specific Interfaces
 */

export interface TavilyProvider extends SearchProvider {
  name: 'tavily';
  capabilities: [
    {
      type: 'web_search';
      maxResults: 20;
      supportsFiltering: true;
      supportsSorting: true;
    },
    {
      type: 'content_extraction';
      maxResults: 5;
      supportsFiltering: false;
      supportsSorting: false;
    }
  ];
}

export interface ExaProvider extends SearchProvider {
  name: 'exa';
  capabilities: [
    {
      type: 'web_search';
      maxResults: 10;
      supportsFiltering: true;
      supportsSorting: true;
    },
    {
      type: 'neural_search';
      maxResults: 10;
      supportsFiltering: true;
      supportsSorting: false;
    }
  ];
}

export interface SERPProvider extends SearchProvider {
  name: 'serp';
  capabilities: [
    {
      type: 'web_search';
      maxResults: 100;
      supportsFiltering: true;
      supportsSorting: true;
    }
  ];
}

export interface CruiseCriticProvider extends SearchProvider {
  name: 'cruise-critic';
  type: 'scraping';
  capabilities: [
    {
      type: 'content_extraction';
      maxResults: 50;
      supportsFiltering: true;
      supportsSorting: false;
    }
  ];
}

/**
 * Content Extraction Interfaces
 */

export interface ContentExtractionRequest {
  url: string;
  provider: string;
  options?: ExtractionOptions;
}

export interface ExtractionOptions {
  includeImages: boolean;
  includeMetadata: boolean;
  maxContentLength?: number;
  format: 'text' | 'html' | 'markdown';
}

export interface ContentExtractionResponse {
  url: string;
  title: string;
  content: string;
  images?: ImageResult[];
  metadata: ContentMetadata;
  extractedAt: string;
}

export interface ContentMetadata {
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
  wordCount: number;
  language: string;
  tags?: string[];
  description?: string;
}

/**
 * Provider Management Interfaces
 */

export interface ProviderManager {
  providers: SearchProvider[];
  getProvider(name: string): SearchProvider | undefined;
  getProvidersByCapability(capability: string): SearchProvider[];
  executeSearch(request: SearchRequest): Promise<SearchResponse>;
  executeExtraction(request: ContentExtractionRequest): Promise<ContentExtractionResponse>;
}

export interface ProviderHealth {
  provider: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number; // milliseconds
  errorRate: number; // 0-1
  lastChecked: string;
  consecutiveFailures: number;
}

export interface ProviderMetrics {
  provider: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  totalCost: number;
  period: string; // e.g., '24h', '7d'
}

/**
 * Validation Rules:
 * - relevanceScore between 0 and 1
 * - qualityThreshold between 0 and 1
 * - errorRate between 0 and 1
 * - URL format validation for sourceUrl
 * - wordCount must be positive integer
 * - reliability between 0 and 1
 */

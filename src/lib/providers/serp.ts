/**
 * SERP API Integration
 * Google Search Results API integration for web search functionality
 */

import {
  SearchProvider,
  SearchRequest,
  SearchResponse,
  SearchResultItem,
  SearchMetadata,
  SearchError,
} from '../../types/search-providers';

/**
 * SERP API Provider Implementation
 */
export class SerpProvider implements SearchProvider {
  name = 'serp';
  type = 'search' as const;
  capabilities = [
    {
      type: 'web_search' as const,
      maxResults: 100,
      supportsFiltering: true,
      supportsSorting: true,
    },
  ];
  rateLimits = {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    concurrentRequests: 5,
  };
  supportedQueries: ('text' | 'image' | 'structured' | 'neural')[] = ['text', 'structured'];

  private apiKey: string;
  private baseUrl = 'https://serpapi.com/search';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env['SERP_API_KEY'] || '';
    if (!this.apiKey) {
      throw new Error('SERP API key is required');
    }
  }

  /**
   * Execute a search query
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    const startTime = Date.now();

    try {
      const params = this.buildSearchParams(request);
      const response = await this.makeRequest(params);
      const results = this.parseResults(response);

      const metadata: SearchMetadata = {
        totalResults: results.length,
        searchTime: Date.now() - startTime,
        provider: 'serp',
        queryType: request.type,
        timestamp: new Date().toISOString(),
      };

      return {
        query: request.query,
        provider: 'serp',
        results,
        metadata,
      };
    } catch (error) {
      const searchError: SearchError = {
        code: 'SERP_API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown SERP API error',
        retryable: this.isRetryableError(error),
      };

      return {
        query: request.query,
        provider: 'serp',
        results: [],
        metadata: {
          totalResults: 0,
          searchTime: Date.now() - startTime,
          provider: 'serp',
          queryType: request.type,
          timestamp: new Date().toISOString(),
        },
        errors: [searchError],
      };
    }
  }

  /**
   * Build search parameters for SERP API
   */
  private buildSearchParams(request: SearchRequest): Record<string, string> {
    const params: Record<string, string> = {
      api_key: this.apiKey,
      q: request.query,
      engine: 'google',
      num: '10', // Default results per page
    };

    // Add location if specified
    if (request.options?.region) {
      params['location'] = request.options.region;
    }

    // Add language if specified
    if (request.options?.language) {
      params['hl'] = request.options.language;
      params['gl'] = request.options.language.split('-')[1] || 'us';
    }

    // Add date range if specified
    if (request.options?.dateRange) {
      const { from, to } = request.options.dateRange;
      params['tbs'] = `cdr:1,cd_min:${from},cd_max:${to}`;
    }

    // Add safe search
    if (request.options?.safeSearch !== false) {
      params['safe'] = 'active';
    }

    // Add result count
    if (request.options?.maxResults) {
      params['num'] = Math.min(request.options.maxResults, 100).toString();
    }

    return params;
  }

  /**
   * Make HTTP request to SERP API
   */
  private async makeRequest(params: Record<string, string>): Promise<any> {
    const url = new URL(this.baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Hylo-AI-Travel-Planner/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`SERP API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Parse SERP API response into standardized format
   */
  private parseResults(response: any): SearchResultItem[] {
    const results: SearchResultItem[] = [];

    // Parse organic results
    if (response.organic_results) {
      for (const item of response.organic_results) {
        results.push({
          id: `serp_${item.position}_${Date.now()}`,
          title: item.title || '',
          url: item.link || '',
          snippet: item.snippet || '',
          publishedDate: item.date || undefined,
          source: item.displayed_link || new URL(item.link).hostname,
          relevanceScore: this.calculateRelevanceScore(item),
        });
      }
    }

    // Parse answer box if present
    if (response.answer_box) {
      const answerBox = response.answer_box;
      results.unshift({
        id: `serp_answer_${Date.now()}`,
        title: answerBox.title || 'Answer',
        url: answerBox.link || '',
        snippet: answerBox.snippet || answerBox.answer || '',
        source: answerBox.displayed_link || 'google.com',
        relevanceScore: 1.0, // Answer box is highly relevant
      });
    }

    // Parse knowledge panel if present
    if (response.knowledge_graph) {
      const kg = response.knowledge_graph;
      results.unshift({
        id: `serp_knowledge_${Date.now()}`,
        title: kg.title || 'Knowledge Panel',
        url: kg.website || '',
        snippet: kg.description || '',
        source: 'google.com',
        relevanceScore: 0.9,
      });
    }

    return results;
  }

  /**
   * Calculate relevance score based on SERP position and other factors
   */
  private calculateRelevanceScore(item: any): number {
    let score = 1.0;

    // Position-based scoring (higher positions = higher relevance)
    if (item.position !== undefined) {
      score = Math.max(0.1, 1.0 - item.position * 0.1);
    }

    // Boost for featured snippets
    if (item.snippet && item.snippet.length > 200) {
      score *= 1.2;
    }

    // Boost for results with dates (more current information)
    if (item.date) {
      score *= 1.1;
    }

    return Math.min(1.0, score);
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('rate limit') ||
        message.includes('502') ||
        message.includes('503') ||
        message.includes('504')
      );
    }
    return false;
  }

  /**
   * Get provider health status
   */
  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency: number;
    errorRate: number;
  }> {
    const startTime = Date.now();

    try {
      // Simple health check query
      const testQuery = 'test';
      const params = {
        api_key: this.apiKey,
        q: testQuery,
        engine: 'google',
        num: '1',
      };

      await this.makeRequest(params);
      const latency = Date.now() - startTime;

      return {
        status: latency < 2000 ? 'healthy' : 'degraded',
        latency,
        errorRate: 0,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        errorRate: 1,
      };
    }
  }
}

/**
 * Factory function to create SERP provider instance
 */
export function createSerpProvider(apiKey?: string): SerpProvider {
  return new SerpProvider(apiKey);
}

/**
 * Default SERP provider instance
 */
export const serpProvider = createSerpProvider();

/**
 * Validation Rules:
 * - API key must be provided and valid
 * - Query must be non-empty string
 * - Response must be parsed into standardized format
 * - Errors must be properly categorized and marked as retryable/non-retryable
 * - Relevance scores must be between 0 and 1
 */

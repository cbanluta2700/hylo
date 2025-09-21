/**
 * Exa Neural Search Integration
 * AI-powered neural search with semantic understanding
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
 * Exa API Provider Implementation
 */
export class ExaProvider implements SearchProvider {
  name = 'exa';
  type = 'search' as const;
  capabilities = [
    {
      type: 'web_search' as const,
      maxResults: 10,
      supportsFiltering: true,
      supportsSorting: true,
    },
    {
      type: 'neural_search' as const,
      maxResults: 10,
      supportsFiltering: true,
      supportsSorting: false,
    },
  ];
  rateLimits = {
    requestsPerMinute: 20,
    requestsPerHour: 200,
    requestsPerDay: 500,
    concurrentRequests: 2,
  };
  supportedQueries: ('text' | 'image' | 'structured' | 'neural')[] = ['text', 'neural'];

  private apiKey: string;
  private baseUrl = 'https://api.exa.ai/search';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env['EXA_API_KEY'] || '';
    if (!this.apiKey) {
      throw new Error('Exa API key is required');
    }
  }

  /**
   * Execute a search query
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    const startTime = Date.now();

    try {
      const payload = this.buildSearchPayload(request);
      const response = await this.makeRequest(payload);
      const results = this.parseResults(response);

      const metadata: SearchMetadata = {
        totalResults: results.length,
        searchTime: Date.now() - startTime,
        provider: 'exa',
        queryType: request.type,
        timestamp: new Date().toISOString(),
      };

      return {
        query: request.query,
        provider: 'exa',
        results,
        metadata,
      };
    } catch (error) {
      const searchError: SearchError = {
        code: 'EXA_API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown Exa API error',
        retryable: this.isRetryableError(error),
      };

      return {
        query: request.query,
        provider: 'exa',
        results: [],
        metadata: {
          totalResults: 0,
          searchTime: Date.now() - startTime,
          provider: 'exa',
          queryType: request.type,
          timestamp: new Date().toISOString(),
        },
        errors: [searchError],
      };
    }
  }

  /**
   * Build search payload for Exa API
   */
  private buildSearchPayload(request: SearchRequest): any {
    const payload: any = {
      query: request.query,
      numResults: Math.min(request.options?.maxResults || 10, 10),
      includeDomains: [],
      excludeDomains: [],
    };

    // Use neural search for better semantic understanding
    if (
      request.type === 'neural' ||
      request.context?.userPreferences?.contentTypes?.includes('neural')
    ) {
      payload['useNeuralSearch'] = true;
      payload['neuralSearchType'] = 'semantic';
    }

    // Add content type filtering
    if (request.context?.userPreferences?.contentTypes) {
      payload['contents'] = this.mapContentTypesToContents(
        request.context.userPreferences.contentTypes
      );
    }

    // Add date filtering
    if (request.options?.dateRange) {
      payload['startDate'] = request.options.dateRange.from;
      payload['endDate'] = request.options.dateRange.to;
    }

    // Add location context
    if (request.context?.userLocation) {
      payload['geolocation'] = request.context.userLocation;
    }

    // Add language preference
    if (request.options?.language) {
      payload['language'] = request.options.language;
    }

    return payload;
  }

  /**
   * Make HTTP request to Exa API
   */
  private async makeRequest(payload: any): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-api-key': this.apiKey,
        'User-Agent': 'Hylo-AI-Travel-Planner/1.0',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Exa API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Parse Exa API response into standardized format
   */
  private parseResults(response: any): SearchResultItem[] {
    const results: SearchResultItem[] = [];

    if (response.results) {
      for (const item of response.results) {
        const result: SearchResultItem = {
          id: item.id || `exa_${Date.now()}_${Math.random()}`,
          title: item.title || '',
          url: item.url || '',
          snippet: item.snippet || item.text || '',
          publishedDate: item.publishedDate || item.date || undefined,
          source: item.source || item.domain || new URL(item.url).hostname,
          relevanceScore: item.score || this.calculateRelevanceScore(item),
        };

        // Add structured data if available
        if (item.structuredData) {
          result.structuredData = item.structuredData;
        }

        results.push(result);
      }
    }

    return results;
  }

  /**
   * Calculate relevance score for Exa results
   */
  private calculateRelevanceScore(item: any): number {
    let score = 0.6; // Base score for neural search

    // Boost for neural search confidence
    if (item.neuralScore !== undefined) {
      score = Math.max(0.3, Math.min(1.0, item.neuralScore));
    }

    // Boost for semantic relevance
    if (item.semanticScore !== undefined) {
      score = (score + item.semanticScore) / 2;
    }

    // Boost for authoritative sources
    if (this.isAuthoritativeSource(item.source || item.domain || item.url)) {
      score += 0.1;
    }

    // Boost for recent content
    if (item.publishedDate || item.date) {
      const publishedDate = item.publishedDate || item.date;
      const daysSincePublished = this.calculateDaysSincePublished(publishedDate);
      if (daysSincePublished <= 7) {
        score += 0.1;
      } else if (daysSincePublished <= 30) {
        score += 0.05;
      }
    }

    return Math.min(1.0, score);
  }

  /**
   * Map content types to Exa contents parameter
   */
  private mapContentTypesToContents(contentTypes: string[]): any {
    const contents: any = {};

    for (const type of contentTypes) {
      switch (type.toLowerCase()) {
        case 'news':
          contents['type'] = 'news';
          break;
        case 'blog':
          contents['type'] = 'blog';
          break;
        case 'academic':
          contents['type'] = 'academic';
          break;
        case 'travel':
          contents['subtype'] = 'travel';
          break;
        case 'review':
          contents['subtype'] = 'review';
          break;
      }
    }

    return contents;
  }

  /**
   * Calculate days since published date
   */
  private calculateDaysSincePublished(publishedDate: string): number {
    try {
      const published = new Date(publishedDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - published.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 365; // Default to old content if date parsing fails
    }
  }

  /**
   * Check if source is authoritative
   */
  private isAuthoritativeSource(source: string): boolean {
    const authoritativeDomains = [
      'wikipedia.org',
      'tripadvisor.com',
      'booking.com',
      'expedia.com',
      'lonelyplanet.com',
      'fodors.com',
      'frommers.com',
      'wikitravel.org',
      'travelandleisure.com',
      'natgeo.com',
      'bbc.com',
      'cnn.com',
      'nytimes.com',
    ];

    try {
      const domain = new URL(source).hostname.toLowerCase();
      return authoritativeDomains.some((authDomain) => domain.includes(authDomain));
    } catch {
      return false;
    }
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
        message.includes('504') ||
        message.includes('429')
      ); // Too Many Requests
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
      const testPayload = {
        query: 'test',
        numResults: 1,
      };

      await this.makeRequest(testPayload);
      const latency = Date.now() - startTime;

      return {
        status: latency < 1000 ? 'healthy' : 'degraded',
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

  /**
   * Advanced neural search with semantic understanding
   */
  async neuralSearch(
    query: string,
    options?: {
      semanticContext?: string;
      intent?: string;
      domain?: string;
    }
  ): Promise<SearchResponse> {
    const startTime = Date.now();

    try {
      const payload = {
        query,
        numResults: 10,
        useNeuralSearch: true,
        neuralSearchType: 'semantic',
        semanticContext: options?.semanticContext,
        intent: options?.intent,
        domain: options?.domain,
      };

      const response = await this.makeRequest(payload);
      const results = this.parseResults(response);

      const metadata: SearchMetadata = {
        totalResults: results.length,
        searchTime: Date.now() - startTime,
        provider: 'exa',
        queryType: 'neural',
        timestamp: new Date().toISOString(),
      };

      return {
        query,
        provider: 'exa',
        results,
        metadata,
      };
    } catch (error) {
      const searchError: SearchError = {
        code: 'EXA_NEURAL_SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'Neural search failed',
        retryable: this.isRetryableError(error),
      };

      return {
        query,
        provider: 'exa',
        results: [],
        metadata: {
          totalResults: 0,
          searchTime: Date.now() - startTime,
          provider: 'exa',
          queryType: 'neural',
          timestamp: new Date().toISOString(),
        },
        errors: [searchError],
      };
    }
  }

  /**
   * Find similar content using neural embeddings
   */
  async findSimilar(url: string, options?: { numResults?: number }): Promise<SearchResponse> {
    const startTime = Date.now();

    try {
      const payload = {
        url,
        numResults: options?.numResults || 5,
        useNeuralSearch: true,
        neuralSearchType: 'similarity',
      };

      const response = await this.makeRequest(payload);
      const results = this.parseResults(response);

      const metadata: SearchMetadata = {
        totalResults: results.length,
        searchTime: Date.now() - startTime,
        provider: 'exa',
        queryType: 'neural',
        timestamp: new Date().toISOString(),
      };

      return {
        query: `Similar to: ${url}`,
        provider: 'exa',
        results,
        metadata,
      };
    } catch (error) {
      const searchError: SearchError = {
        code: 'EXA_SIMILARITY_ERROR',
        message: error instanceof Error ? error.message : 'Similarity search failed',
        retryable: this.isRetryableError(error),
      };

      return {
        query: `Similar to: ${url}`,
        provider: 'exa',
        results: [],
        metadata: {
          totalResults: 0,
          searchTime: Date.now() - startTime,
          provider: 'exa',
          queryType: 'neural',
          timestamp: new Date().toISOString(),
        },
        errors: [searchError],
      };
    }
  }
}

/**
 * Factory function to create Exa provider instance
 */
export function createExaProvider(apiKey?: string): ExaProvider {
  return new ExaProvider(apiKey);
}

/**
 * Default Exa provider instance
 */
export const exaProvider = createExaProvider();

/**
 * Validation Rules:
 * - API key must be provided and valid
 * - Query must be non-empty string
 * - Maximum 10 results per query for neural search
 * - Neural search requires semantic context for best results
 * - Relevance scores must be between 0 and 1
 * - Error handling must distinguish between API and neural search errors
 */

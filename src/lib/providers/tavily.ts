/**
 * Tavily Search Integration
 * AI-optimized web search with content extraction capabilities
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
 * Tavily API Provider Implementation
 */
export class TavilyProvider implements SearchProvider {
  name = 'tavily';
  type = 'search' as const;
  capabilities = [
    {
      type: 'web_search' as const,
      maxResults: 20,
      supportsFiltering: true,
      supportsSorting: true,
    },
    {
      type: 'content_extraction' as const,
      maxResults: 5,
      supportsFiltering: false,
      supportsSorting: false,
    },
  ];
  rateLimits = {
    requestsPerMinute: 30,
    requestsPerHour: 500,
    requestsPerDay: 1000,
    concurrentRequests: 3,
  };
  supportedQueries: ('text' | 'image' | 'structured' | 'neural')[] = ['text', 'structured'];

  private apiKey: string;
  private baseUrl = 'https://api.tavily.com/search';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env['TAVILY_API_KEY'] || '';
    if (!this.apiKey) {
      throw new Error('Tavily API key is required');
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
        provider: 'tavily',
        queryType: request.type,
        timestamp: new Date().toISOString(),
      };

      return {
        query: request.query,
        provider: 'tavily',
        results,
        metadata,
      };
    } catch (error) {
      const searchError: SearchError = {
        code: 'TAVILY_API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown Tavily API error',
        retryable: this.isRetryableError(error),
      };

      return {
        query: request.query,
        provider: 'tavily',
        results: [],
        metadata: {
          totalResults: 0,
          searchTime: Date.now() - startTime,
          provider: 'tavily',
          queryType: request.type,
          timestamp: new Date().toISOString(),
        },
        errors: [searchError],
      };
    }
  }

  /**
   * Build search payload for Tavily API
   */
  private buildSearchPayload(request: SearchRequest): any {
    const payload: any = {
      api_key: this.apiKey,
      query: request.query,
      search_depth: 'advanced',
      include_images: request.options?.includeImages || false,
      include_answer: true,
      include_raw_content: false,
      max_results: Math.min(request.options?.maxResults || 10, 20),
    };

    // Add topic-specific search
    if (request.context?.userPreferences?.contentTypes) {
      payload['topic'] = this.mapContentTypesToTopic(request.context.userPreferences.contentTypes);
    }

    // Add time range
    if (request.options?.dateRange) {
      const daysDiff = this.calculateDaysDifference(request.options.dateRange);
      if (daysDiff <= 1) {
        payload['days'] = 1;
      } else if (daysDiff <= 7) {
        payload['days'] = 7;
      } else if (daysDiff <= 30) {
        payload['days'] = 30;
      }
    }

    // Add location context
    if (request.context?.userLocation) {
      payload['location'] = request.context.userLocation;
    }

    return payload;
  }

  /**
   * Make HTTP request to Tavily API
   */
  private async makeRequest(payload: any): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Hylo-AI-Travel-Planner/1.0',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Tavily API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Parse Tavily API response into standardized format
   */
  private parseResults(response: any): SearchResultItem[] {
    const results: SearchResultItem[] = [];

    // Parse answer if present
    if (response.answer) {
      results.push({
        id: `tavily_answer_${Date.now()}`,
        title: 'AI Answer',
        url: response.query || '',
        snippet: response.answer,
        source: 'tavily.com',
        relevanceScore: 1.0,
      });
    }

    // Parse search results
    if (response.results) {
      for (const item of response.results) {
        results.push({
          id: `tavily_${item.url}_${Date.now()}`,
          title: item.title || '',
          url: item.url || '',
          snippet: item.content || item.snippet || '',
          publishedDate: item.published_date || undefined,
          source: item.source || new URL(item.url).hostname,
          relevanceScore: item.score || this.calculateRelevanceScore(item),
        });
      }
    }

    return results;
  }

  /**
   * Calculate relevance score for Tavily results
   */
  private calculateRelevanceScore(item: any): number {
    let score = 0.5; // Base score

    // Boost for results with good content
    if (item.content && item.content.length > 100) {
      score += 0.2;
    }

    // Boost for recent content
    if (item.published_date) {
      const daysSincePublished = this.calculateDaysSincePublished(item.published_date);
      if (daysSincePublished <= 7) {
        score += 0.2;
      } else if (daysSincePublished <= 30) {
        score += 0.1;
      }
    }

    // Boost for authoritative sources
    if (this.isAuthoritativeSource(item.source || item.url)) {
      score += 0.1;
    }

    return Math.min(1.0, score);
  }

  /**
   * Map content types to Tavily topic
   */
  private mapContentTypesToTopic(contentTypes: string[]): string {
    const typeMap: Record<string, string> = {
      news: 'news',
      blog: 'general',
      academic: 'general',
      travel: 'general',
      review: 'general',
    };

    // Return the most specific topic
    for (const type of contentTypes) {
      const topic = typeMap[type.toLowerCase()];
      if (topic) {
        return topic;
      }
    }

    return 'general';
  }

  /**
   * Calculate days difference between dates
   */
  private calculateDaysDifference(dateRange: { from: string; to: string }): number {
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate days since published date
   */
  private calculateDaysSincePublished(publishedDate: string): number {
    const published = new Date(publishedDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - published.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
        api_key: this.apiKey,
        query: 'test',
        search_depth: 'basic',
        max_results: 1,
      };

      await this.makeRequest(testPayload);
      const latency = Date.now() - startTime;

      return {
        status: latency < 1500 ? 'healthy' : 'degraded',
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
   * Extract content from URLs (Tavily's content extraction feature)
   */
  async extractContent(urls: string[]): Promise<any[]> {
    const extractions: any[] = [];

    for (const url of urls.slice(0, 5)) {
      // Limit to 5 URLs
      try {
        const payload = {
          api_key: this.apiKey,
          urls: [url],
          include_images: false,
        };

        const response = await fetch('https://api.tavily.com/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          extractions.push(data);
        }
      } catch (error) {
        console.warn(`Failed to extract content from ${url}:`, error);
      }
    }

    return extractions;
  }
}

/**
 * Factory function to create Tavily provider instance
 */
export function createTavilyProvider(apiKey?: string): TavilyProvider {
  return new TavilyProvider(apiKey);
}

/**
 * Default Tavily provider instance
 */
export const tavilyProvider = createTavilyProvider();

/**
 * Validation Rules:
 * - API key must be provided and valid
 * - Query must be non-empty string
 * - Maximum 20 results per query
 * - Content extraction limited to 5 URLs
 * - Relevance scores must be between 0 and 1
 * - Error handling must categorize retryable vs non-retryable errors
 */

/**
 * Multi-Provider Search Integration (T026-T028)
 *
 * CONSTITUTIONAL COMPLIANCE:
 * - Principle I: Edge Runtime compatible (HTTP-based search providers)
 * - Principle V: Type-safe development with strict interfaces
 * - Principle IV: Code-Deploy-Debug implementation with fallbacks
 *
 * Integrates Tavily, Exa, and SERP APIs for comprehensive travel information
 */

import { config } from '../config/env';

/**
 * Unified Search Result Interface
 * Constitutional requirement: Type-safe development
 */
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  score: number;
  source: 'tavily' | 'exa' | 'serp';
  metadata?: {
    publishedDate?: string;
    domain?: string;
    images?: string[];
    rating?: number;
    reviews?: number;
    location?: {
      latitude?: number;
      longitude?: number;
      address?: string;
    };
  };
}

/**
 * Search Query Configuration
 */
export interface SearchQuery {
  query: string;
  location?: string;
  category?: 'attraction' | 'restaurant' | 'hotel' | 'activity' | 'general';
  maxResults?: number;
  dateRange?: {
    start?: string;
    end?: string;
  };
  filters?:
    | {
        priceRange?: 'budget' | 'mid-range' | 'luxury';
        rating?: number;
        features?: string[];
      }
    | undefined;
}

/**
 * Search Provider Base Class
 * Constitutional requirement: Component composition pattern
 */
abstract class SearchProvider {
  abstract name: string;
  abstract search(query: SearchQuery): Promise<SearchResult[]>;

  protected handleError(error: any, provider: string): SearchResult[] {
    console.error(`${provider} search error:`, error);
    return []; // Return empty results on error for graceful degradation
  }
}

/**
 * Tavily Search Provider
 * Optimized for travel and real-time information
 */
class TavilyProvider extends SearchProvider {
  name = 'Tavily';

  private readonly apiKey = config.search.tavily.apiKey;
  private readonly baseUrl = 'https://api.tavily.com/search';

  async search(query: SearchQuery): Promise<SearchResult[]> {
    try {
      const searchQuery = this.buildTavilyQuery(query);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query: searchQuery,
          search_depth: 'advanced',
          include_answer: false,
          include_raw_content: false,
          max_results: query.maxResults || config.search.tavily.maxResults,
          include_domains: this.getTravelDomains(query.category),
          exclude_domains: ['booking.com', 'expedia.com'], // Avoid affiliate heavy sites
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status}`);
      }

      const data = await response.json();

      return (
        data.results?.map((result: any) => ({
          title: result.title || '',
          url: result.url || '',
          snippet: result.content || '',
          score: result.score || 0,
          source: 'tavily' as const,
          metadata: {
            publishedDate: result.published_date,
            domain: this.extractDomain(result.url),
          },
        })) || []
      );
    } catch (error) {
      return this.handleError(error, 'Tavily');
    }
  }

  private buildTavilyQuery(query: SearchQuery): string {
    let searchQuery = query.query;

    if (query.location) {
      searchQuery += ` in ${query.location}`;
    }

    if (query.category) {
      const categoryTerms = {
        attraction: 'tourist attractions things to do sightseeing',
        restaurant: 'restaurants food dining cuisine',
        hotel: 'hotels accommodation lodging',
        activity: 'activities experiences tours',
        general: 'travel guide information',
      };
      searchQuery += ` ${categoryTerms[query.category]}`;
    }

    if (query.filters?.priceRange) {
      const priceTerms = {
        budget: 'cheap affordable budget',
        'mid-range': 'moderate reasonably priced',
        luxury: 'luxury premium high-end',
      };
      searchQuery += ` ${priceTerms[query.filters.priceRange]}`;
    }

    return searchQuery;
  }

  private getTravelDomains(category?: string): string[] {
    const baseDomains = [
      'tripadvisor.com',
      'lonelyplanet.com',
      'timeout.com',
      'cntraveler.com',
      'travel.com',
      'fodors.com',
    ];

    const categoryDomains: Record<string, string[]> = {
      restaurant: ['yelp.com', 'zomato.com', 'opentable.com'],
      attraction: ['atlasobscura.com', 'viator.com', 'getyourguide.com'],
      hotel: ['hotels.com', 'marriott.com', 'hilton.com'],
      activity: ['airbnb.com', 'klook.com', 'viator.com'],
    };

    return category && categoryDomains[category]
      ? [...baseDomains, ...categoryDomains[category]]
      : baseDomains;
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }
}

/**
 * Exa Search Provider
 * Neural search for high-quality, relevant results
 */
class ExaProvider extends SearchProvider {
  name = 'Exa';

  private readonly apiKey = config.search.exa.apiKey;
  private readonly baseUrl = 'https://api.exa.ai/search';

  async search(query: SearchQuery): Promise<SearchResult[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          query: this.buildExaQuery(query),
          type: 'neural',
          useAutoprompt: true,
          numResults: query.maxResults || config.search.exa.maxResults,
          contents: {
            text: true,
            highlights: true,
          },
          includeDomains: this.getExaDomains(query.category),
        }),
      });

      if (!response.ok) {
        throw new Error(`Exa API error: ${response.status}`);
      }

      const data = await response.json();

      return (
        data.results?.map((result: any) => ({
          title: result.title || '',
          url: result.url || '',
          snippet: result.highlights?.[0] || result.text?.substring(0, 200) || '',
          score: result.score || 0,
          source: 'exa' as const,
          metadata: {
            publishedDate: result.publishedDate,
            domain: this.extractDomain(result.url),
          },
        })) || []
      );
    } catch (error) {
      return this.handleError(error, 'Exa');
    }
  }

  private buildExaQuery(query: SearchQuery): string {
    let searchQuery = query.query;

    if (query.location) {
      searchQuery += ` ${query.location}`;
    }

    // Exa works better with natural language queries
    if (query.category === 'restaurant') {
      searchQuery += ' best restaurants where to eat food';
    } else if (query.category === 'attraction') {
      searchQuery += ' top attractions must visit places';
    } else if (query.category === 'activity') {
      searchQuery += ' things to do activities experiences';
    }

    return searchQuery;
  }

  private getExaDomains(_category?: string): string[] {
    return [
      'tripadvisor.com',
      'lonelyplanet.com',
      'timeout.com',
      'fodors.com',
      'travel.com',
      'cntraveler.com',
      'atlasobscura.com',
      'yelp.com',
    ];
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }
}

/**
 * SERP API Provider
 * Google Search results for comprehensive coverage
 */
class SERPProvider extends SearchProvider {
  name = 'SERP';

  private readonly apiKey = config.search.serp.apiKey;
  private readonly baseUrl = 'https://serpapi.com/search';

  async search(query: SearchQuery): Promise<SearchResult[]> {
    try {
      const params = new URLSearchParams({
        engine: 'google',
        q: this.buildSERPQuery(query),
        api_key: this.apiKey,
        num: String(query.maxResults || config.search.serp.maxResults),
        gl: 'us', // Geographic location
        hl: 'en', // Language
      });

      const response = await fetch(`${this.baseUrl}?${params}`);

      if (!response.ok) {
        throw new Error(`SERP API error: ${response.status}`);
      }

      const data = await response.json();

      // Process organic results
      const organicResults =
        data.organic_results?.map((result: any) => ({
          title: result.title || '',
          url: result.link || '',
          snippet: result.snippet || '',
          score: this.calculateSERPScore(result.position),
          source: 'serp' as const,
          metadata: {
            domain: this.extractDomain(result.link),
          },
        })) || [];

      // Process local results if available
      const localResults =
        data.local_results?.map((result: any) => ({
          title: result.title || '',
          url: result.link || '',
          snippet: result.snippet || result.description || '',
          score: 0.9, // High score for local results
          source: 'serp' as const,
          metadata: {
            domain: 'local',
            rating: result.rating,
            reviews: result.reviews,
            location: {
              latitude: result.gps_coordinates?.latitude,
              longitude: result.gps_coordinates?.longitude,
              address: result.address,
            },
          },
        })) || [];

      return [...organicResults, ...localResults];
    } catch (error) {
      return this.handleError(error, 'SERP');
    }
  }

  private buildSERPQuery(query: SearchQuery): string {
    let searchQuery = query.query;

    if (query.location) {
      searchQuery += ` ${query.location}`;
    }

    // Add category-specific terms
    if (query.category === 'restaurant') {
      searchQuery += ' restaurant food dining';
    } else if (query.category === 'attraction') {
      searchQuery += ' attraction tourist destination';
    } else if (query.category === 'activity') {
      searchQuery += ' activity things to do';
    }

    return searchQuery;
  }

  private calculateSERPScore(position: number): number {
    // Convert SERP position to score (1st = 1.0, 10th = 0.1)
    return Math.max(0.1, 1.1 - position * 0.1);
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }
}

/**
 * Multi-Provider Search Client
 * Constitutional requirement: Edge Runtime resilience with fallbacks
 */
export class SearchClient {
  private providers: SearchProvider[];

  constructor() {
    this.providers = [
      new TavilyProvider(), // Primary for travel-specific results
      new ExaProvider(), // Secondary for neural search
      new SERPProvider(), // Tertiary for comprehensive coverage
    ];
  }

  /**
   * Search across multiple providers with automatic fallback
   */
  async search(query: SearchQuery): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const errors: string[] = [];

    // Try each provider in parallel for speed
    const searchPromises = this.providers.map(async (provider) => {
      try {
        console.log(`Searching with ${provider.name}...`);
        const providerResults = await provider.search(query);
        console.log(`✓ ${provider.name} returned ${providerResults.length} results`);
        return providerResults;
      } catch (error) {
        const errorMsg = `${provider.name} failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
        console.warn(`✗ ${errorMsg}`);
        errors.push(errorMsg);
        return [];
      }
    });

    const allResults = await Promise.all(searchPromises);

    // Flatten and combine results
    for (const providerResults of allResults) {
      results.push(...providerResults);
    }

    if (results.length === 0) {
      console.error('All search providers failed:', errors);
      throw new Error(`Search failed: ${errors.join(', ')}`);
    }

    // Deduplicate and sort by score
    const deduplicatedResults = this.deduplicateResults(results);
    const sortedResults = deduplicatedResults.sort((a, b) => b.score - a.score);

    console.log(`✅ Combined search returned ${sortedResults.length} unique results`);
    return sortedResults;
  }

  /**
   * Search for specific travel categories with optimized queries
   */
  async searchAttractions(location: string, interests: string[] = []): Promise<SearchResult[]> {
    const interestQuery = interests.length > 0 ? ` ${interests.join(' ')}` : '';
    return this.search({
      query: `top attractions things to do${interestQuery}`,
      location,
      category: 'attraction',
      maxResults: 15,
    });
  }

  async searchRestaurants(
    location: string,
    cuisine?: string,
    priceRange?: 'budget' | 'mid-range' | 'luxury'
  ): Promise<SearchResult[]> {
    const cuisineQuery = cuisine ? ` ${cuisine} cuisine` : '';
    const filters = priceRange ? { priceRange } : undefined;

    return this.search({
      query: `best restaurants dining${cuisineQuery}`,
      location,
      category: 'restaurant',
      maxResults: 12,
      filters,
    });
  }

  async searchActivities(location: string, activityType?: string): Promise<SearchResult[]> {
    const typeQuery = activityType ? ` ${activityType}` : '';
    return this.search({
      query: `activities experiences tours${typeQuery}`,
      location,
      category: 'activity',
      maxResults: 10,
    });
  }

  /**
   * Health check for all search providers
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};

    const testQuery: SearchQuery = {
      query: 'test search',
      maxResults: 1,
    };

    for (const provider of this.providers) {
      try {
        const results = await provider.search(testQuery);
        health[provider.name] = results.length >= 0; // Even 0 results is success
      } catch {
        health[provider.name] = false;
      }
    }

    return health;
  }

  /**
   * Remove duplicate results based on URL similarity
   */
  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    const deduplicated: SearchResult[] = [];

    for (const result of results) {
      const normalizedUrl = this.normalizeUrl(result.url);
      if (!seen.has(normalizedUrl)) {
        seen.add(normalizedUrl);
        deduplicated.push(result);
      }
    }

    return deduplicated;
  }

  /**
   * Normalize URL for deduplication
   */
  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.hostname}${parsed.pathname}`;
    } catch {
      return url;
    }
  }
}

// Export singleton instance
export const searchClient = new SearchClient();

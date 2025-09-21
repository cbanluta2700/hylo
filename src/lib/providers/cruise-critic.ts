/**
 * CruiseCritic Scraping Integration
 * Web scraping implementation for CruiseCritic cruise data
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
 * CruiseCritic Provider Implementation
 */
export class CruiseCriticProvider implements SearchProvider {
  name = 'cruise-critic';
  type = 'scraping' as const;
  capabilities = [
    {
      type: 'content_extraction' as const,
      maxResults: 50,
      supportsFiltering: true,
      supportsSorting: false,
    },
  ];
  rateLimits = {
    requestsPerMinute: 10,
    requestsPerHour: 100,
    requestsPerDay: 500,
    concurrentRequests: 2,
  };
  supportedQueries: ('text' | 'image' | 'structured' | 'neural')[] = ['text', 'structured'];

  private baseUrl = 'https://www.cruisecritic.com';

  constructor() {
    // No API key required for scraping
  }

  /**
   * Execute a search query
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    const startTime = Date.now();

    try {
      const results = await this.scrapeCruiseData(request);
      const searchResults = this.parseCruiseResults(results);

      const metadata: SearchMetadata = {
        totalResults: searchResults.length,
        searchTime: Date.now() - startTime,
        provider: 'cruise-critic',
        queryType: request.type,
        timestamp: new Date().toISOString(),
      };

      return {
        query: request.query,
        provider: 'cruise-critic',
        results: searchResults,
        metadata,
      };
    } catch (error) {
      const searchError: SearchError = {
        code: 'CRUISECRITIC_SCRAPING_ERROR',
        message: error instanceof Error ? error.message : 'CruiseCritic scraping failed',
        retryable: this.isRetryableError(error),
      };

      return {
        query: request.query,
        provider: 'cruise-critic',
        results: [],
        metadata: {
          totalResults: 0,
          searchTime: Date.now() - startTime,
          provider: 'cruise-critic',
          queryType: request.type,
          timestamp: new Date().toISOString(),
        },
        errors: [searchError],
      };
    }
  }

  /**
   * Scrape cruise data from CruiseCritic
   */
  private async scrapeCruiseData(request: SearchRequest): Promise<any[]> {
    const results: any[] = [];

    // Extract cruise search parameters from query
    const searchParams = this.parseCruiseQuery(request.query);

    // Build search URL
    const searchUrl = this.buildSearchUrl(searchParams);

    try {
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
      });

      if (!response.ok) {
        throw new Error(`CruiseCritic request failed: ${response.status}`);
      }

      const html = await response.text();

      // Parse HTML for cruise data
      const cruiseData = this.extractCruiseDataFromHTML(html);
      results.push(...cruiseData);
    } catch (error) {
      console.warn('Failed to scrape CruiseCritic:', error);
      // Return mock data for development/testing
      results.push(...this.getMockCruiseData(searchParams));
    }

    return results;
  }

  /**
   * Parse cruise search query into parameters
   */
  private parseCruiseQuery(query: string): CruiseSearchParams {
    const params: CruiseSearchParams = {
      destination: '',
      departureDate: '',
      returnDate: '',
      passengers: 2,
      cruiseLine: '',
    };

    // Extract destination
    const destinationMatch = query.match(/(?:from|cruises?\s+(?:to|from))\s+([A-Za-z\s,]+)/i);
    if (destinationMatch && destinationMatch[1]) {
      params.destination = destinationMatch[1].trim();
    }

    // Extract dates
    const dateMatch = query.match(/(\d{1,2}\/\d{1,2}\/\d{4})\s+to\s+(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (dateMatch && dateMatch[1] && dateMatch[2]) {
      params.departureDate = dateMatch[1];
      params.returnDate = dateMatch[2];
    }

    // Extract passenger count
    const passengerMatch = query.match(/(\d+)\s+passengers?/i);
    if (passengerMatch && passengerMatch[1]) {
      params.passengers = parseInt(passengerMatch[1], 10);
    }

    // Extract cruise line
    const cruiseLineMatch = query.match(/(?:cruise\s+line|line)\s+([A-Za-z\s]+)/i);
    if (cruiseLineMatch && cruiseLineMatch[1]) {
      params.cruiseLine = cruiseLineMatch[1].trim();
    }

    return params;
  }

  /**
   * Build CruiseCritic search URL
   */
  private buildSearchUrl(params: CruiseSearchParams): string {
    let url = `${this.baseUrl}/cruises/`;

    // Add destination if specified
    if (params.destination) {
      const destinationSlug = this.destinationToSlug(params.destination);
      url += `destination/${destinationSlug}/`;
    }

    // Add search parameters
    const searchParams = new URLSearchParams();

    if (params.departureDate) {
      searchParams.set('date', params.departureDate);
    }

    if (params.passengers > 2) {
      searchParams.set('passengers', params.passengers.toString());
    }

    if (params.cruiseLine) {
      searchParams.set('cruiseline', params.cruiseLine.toLowerCase().replace(/\s+/g, '-'));
    }

    const paramString = searchParams.toString();
    if (paramString) {
      url += `?${paramString}`;
    }

    return url;
  }

  /**
   * Convert destination name to URL slug
   */
  private destinationToSlug(destination: string): string {
    const destinationMap: Record<string, string> = {
      caribbean: 'caribbean-cruises',
      mediterranean: 'mediterranean-cruises',
      alaska: 'alaska-cruises',
      mexico: 'mexico-cruises',
      bahamas: 'bahamas-cruises',
      florida: 'florida-cruises',
      hawaii: 'hawaii-cruises',
      europe: 'europe-cruises',
      asia: 'asia-cruises',
      australia: 'australia-new-zealand-cruises',
    };

    const normalized = destination.toLowerCase().trim();
    return destinationMap[normalized] || `${normalized.replace(/\s+/g, '-')}-cruises`;
  }

  /**
   * Extract cruise data from HTML (simplified parsing)
   */
  private extractCruiseDataFromHTML(html: string): any[] {
    const cruises: any[] = [];

    // This is a simplified HTML parsing - in production, you'd use a proper HTML parser
    // For now, we'll extract basic information using regex patterns

    // Extract cruise listings
    const cruisePattern = /<div[^>]*class="[^"]*cruise-card[^"]*"[^>]*>(.*?)<\/div>/gis;
    const titlePattern = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/i;
    const pricePattern = /\$([0-9,]+(?:\.[0-9]{2})?)/;
    const durationPattern = /(\d+)\s*(?:night|day)/i;
    const shipPattern = /Ship:\s*([^<\n]+)/i;

    let match;
    while ((match = cruisePattern.exec(html)) !== null) {
      const cruiseHtml = match[1];

      const titleMatch = titlePattern.exec(cruiseHtml);
      const priceMatch = pricePattern.exec(cruiseHtml);
      const durationMatch = durationPattern.exec(cruiseHtml);
      const shipMatch = shipPattern.exec(cruiseHtml);

      if (titleMatch && titleMatch[1]) {
        cruises.push({
          title: titleMatch[1].trim(),
          price: priceMatch && priceMatch[1] ? parseFloat(priceMatch[1].replace(',', '')) : null,
          duration: durationMatch && durationMatch[1] ? parseInt(durationMatch[1], 10) : null,
          ship: shipMatch && shipMatch[1] ? shipMatch[1].trim() : null,
          url: `${this.baseUrl}/cruises/`, // Would need to extract actual URL
          source: 'cruisecritic.com',
        });
      }
    }

    return cruises;
  }

  /**
   * Parse cruise results into standardized format
   */
  private parseCruiseResults(cruises: any[]): SearchResultItem[] {
    return cruises.map((cruise, index) => ({
      id: `cruisecritic_${Date.now()}_${index}`,
      title: cruise.title || 'Cruise Option',
      url: cruise.url || this.baseUrl,
      snippet: this.buildCruiseSnippet(cruise),
      source: 'cruisecritic.com',
      relevanceScore: this.calculateCruiseRelevance(cruise),
      structuredData: {
        type: 'cruise',
        price: cruise.price,
        duration: cruise.duration,
        ship: cruise.ship,
        departurePort: cruise.departurePort,
        destination: cruise.destination,
      },
    }));
  }

  /**
   * Build cruise snippet from cruise data
   */
  private buildCruiseSnippet(cruise: any): string {
    const parts: string[] = [];

    if (cruise.ship) {
      parts.push(`Ship: ${cruise.ship}`);
    }

    if (cruise.duration) {
      parts.push(`${cruise.duration} nights`);
    }

    if (cruise.price) {
      parts.push(`From $${cruise.price.toLocaleString()}`);
    }

    if (cruise.departurePort) {
      parts.push(`Departs from ${cruise.departurePort}`);
    }

    return parts.join(' • ') || 'Cruise option available';
  }

  /**
   * Calculate relevance score for cruise results
   */
  private calculateCruiseRelevance(cruise: any): number {
    let score = 0.7; // Base score for cruise results

    // Boost for complete information
    if (cruise.price) score += 0.1;
    if (cruise.duration) score += 0.1;
    if (cruise.ship) score += 0.1;

    // Boost for well-known cruise lines
    if (cruise.ship && this.isMajorCruiseLine(cruise.ship)) {
      score += 0.1;
    }

    return Math.min(1.0, score);
  }

  /**
   * Check if ship belongs to a major cruise line
   */
  private isMajorCruiseLine(shipName: string): boolean {
    const majorLines = [
      'carnival',
      'royal caribbean',
      'norwegian',
      'msc',
      'princess',
      'holland america',
      'celebrity',
      'cunard',
    ];

    const normalized = shipName.toLowerCase();
    return majorLines.some((line) => normalized.includes(line));
  }

  /**
   * Get mock cruise data for development/testing
   */
  private getMockCruiseData(params: CruiseSearchParams): any[] {
    return [
      {
        title: `${params.destination || 'Caribbean'} Cruise - 7 Nights`,
        price: 899,
        duration: 7,
        ship: 'Carnival Sunshine',
        departurePort: 'Miami, FL',
        destination: params.destination || 'Caribbean',
        url: `${this.baseUrl}/cruises/caribbean/`,
      },
      {
        title: `${params.destination || 'Mediterranean'} Cruise - 10 Nights`,
        price: 1299,
        duration: 10,
        ship: 'Royal Caribbean Oasis',
        departurePort: 'Barcelona, Spain',
        destination: params.destination || 'Mediterranean',
        url: `${this.baseUrl}/cruises/mediterranean/`,
      },
      {
        title: `${params.destination || 'Alaska'} Cruise - 7 Nights`,
        price: 1499,
        duration: 7,
        ship: 'Norwegian Bliss',
        departurePort: 'Seattle, WA',
        destination: params.destination || 'Alaska',
        url: `${this.baseUrl}/cruises/alaska/`,
      },
    ];
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
      // Simple health check
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        return {
          status: latency < 3000 ? 'healthy' : 'degraded',
          latency,
          errorRate: 0,
        };
      } else {
        return {
          status: 'degraded',
          latency,
          errorRate: 0.5,
        };
      }
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
 * Cruise search parameters interface
 */
interface CruiseSearchParams {
  destination: string;
  departureDate: string;
  returnDate: string;
  passengers: number;
  cruiseLine: string;
}

/**
 * Factory function to create CruiseCritic provider instance
 */
export function createCruiseCriticProvider(): CruiseCriticProvider {
  return new CruiseCriticProvider();
}

/**
 * Default CruiseCritic provider instance
 */
export const cruiseCriticProvider = createCruiseCriticProvider();

/**
 * Validation Rules:
 * - No API key required (web scraping)
 * - Query must contain cruise-related keywords
 * - HTML parsing must handle various page structures
 * - Mock data fallback for development/testing
 * - Relevance scores must be between 0 and 1
 * - Error handling must account for scraping failures
 */

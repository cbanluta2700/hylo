/**
 * Tavily Web Search Service for Travel Information Gathering
 * Provides real-time web search capabilities using Tavily API
 * Optimized for travel content discovery and information retrieval
 */

// Travel-specific search topics
export enum TravelSearchTopic {
  GENERAL = 'general',
  NEWS = 'news',
  FINANCE = 'finance',
  TRAVEL = 'travel',
}

// Search depth options
export enum SearchDepth {
  BASIC = 'basic',
  ADVANCED = 'advanced',
}

// Time range options for filtering results
export enum TimeRange {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

// Search result interface
interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  rawContent?: string;
  publishedDate?: string;
  favicon?: string;
}

// Image result interface
interface TavilyImageResult {
  url: string;
  description?: string;
}

// Full search response interface
interface TavilySearchResponse {
  query: string;
  results: TavilySearchResult[];
  responseTime: number;
  answer?: string;
  images?: (string | TavilyImageResult)[];
}

// Search options interface
interface TavilySearchOptions {
  searchDepth?: SearchDepth;
  topic?: TravelSearchTopic;
  timeRange?: TimeRange;
  maxResults?: number;
  chunksPerSource?: number;
  includeImages?: boolean;
  includeImageDescriptions?: boolean;
  includeAnswer?: boolean | 'basic' | 'advanced';
  includeRawContent?: boolean;
  includeDomains?: string[];
  excludeDomains?: string[];
  country?: string;
  timeout?: number;
}

// Travel-specific search parameters
interface TravelSearchOptions extends TavilySearchOptions {
  destination?: string;
  travelType?: 'flights' | 'hotels' | 'restaurants' | 'activities' | 'attractions';
  priceRange?: 'budget' | 'mid-range' | 'luxury';
}

/**
 * Tavily Web Search Service for Travel Content Discovery
 * Provides intelligent web search capabilities for travel information gathering
 */
export class TavilyWebSearchService {
  private apiKey: string;
  private baseUrl = 'https://api.tavily.com';
  private isInitialized = false;
  private defaultTimeout = 60;

  // Travel-specific domain lists
  private travelDomains = [
    'booking.com',
    'expedia.com',
    'tripadvisor.com',
    'airbnb.com',
    'hotels.com',
    'kayak.com',
    'skyscanner.com',
    'lonelyplanet.com',
    'fodors.com',
    'frommers.com',
    'nationalgeographic.com',
    'timeout.com',
    'yelp.com',
  ];

  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY!;
  }

  /**
   * Initialize the service and validate API key
   */
  async initialize(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('TAVILY_API_KEY environment variable is required');
    }

    try {
      // Test API key with a simple search request
      await this.search('test search', { 
        maxResults: 1, 
        timeout: 10 
      });
      
      this.isInitialized = true;
      console.log('Tavily Web Search service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Tavily Web Search service:', error);
      throw new Error(`Web search service initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if service is ready for operations
   */
  isReady(): boolean {
    return this.isInitialized && !!this.apiKey;
  }

  /**
   * Perform a web search using Tavily API
   * @param query Search query
   * @param options Search configuration options
   * @returns Promise resolving to search results
   */
  async search(
    query: string,
    options: TavilySearchOptions = {}
  ): Promise<TavilySearchResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const {
      searchDepth = SearchDepth.BASIC,
      topic = TravelSearchTopic.GENERAL,
      timeRange,
      maxResults = 5,
      chunksPerSource = 3,
      includeImages = false,
      includeImageDescriptions = false,
      includeAnswer = false,
      includeRawContent = false,
      includeDomains = [],
      excludeDomains = [],
      country,
      timeout = this.defaultTimeout,
    } = options;

    try {
      const requestBody = {
        query,
        search_depth: searchDepth,
        topic,
        max_results: maxResults,
        include_images: includeImages,
        include_image_descriptions: includeImageDescriptions,
        include_answer: includeAnswer,
        include_raw_content: includeRawContent,
        include_domains: includeDomains,
        exclude_domains: excludeDomains,
        timeout,
        ...(timeRange && { time_range: timeRange }),
        ...(country && { country }),
        ...(searchDepth === SearchDepth.ADVANCED && { chunks_per_source: chunksPerSource }),
      };

      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tavily API error: ${response.status} ${errorText}`);
      }

      const data: TavilySearchResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error performing web search:', error);
      throw new Error(`Web search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search for travel-specific information
   * @param query Travel search query
   * @param options Travel-specific search options
   * @returns Promise resolving to travel search results
   */
  async searchTravel(
    query: string,
    options: TravelSearchOptions = {}
  ): Promise<TavilySearchResponse> {
    const {
      destination,
      travelType,
      priceRange,
      ...searchOptions
    } = options;

    // Enhance query with travel context
    let enhancedQuery = query;
    if (destination) {
      enhancedQuery += ` in ${destination}`;
    }
    if (travelType) {
      enhancedQuery += ` ${travelType}`;
    }
    if (priceRange) {
      enhancedQuery += ` ${priceRange}`;
    }

    // Use travel-focused domains by default
    const travelSearchOptions: TavilySearchOptions = {
      ...searchOptions,
      topic: TravelSearchTopic.TRAVEL,
      includeDomains: [
        ...this.travelDomains,
        ...(searchOptions.includeDomains || []),
      ],
      maxResults: searchOptions.maxResults || 10, // More results for travel searches
      includeImages: searchOptions.includeImages !== false, // Include images by default
      includeAnswer: searchOptions.includeAnswer || 'basic', // Include basic answer
    };

    return this.search(enhancedQuery, travelSearchOptions);
  }

  /**
   * Search for destination information
   * @param destination Destination name
   * @param queryType Type of information to search for
   * @returns Promise resolving to destination information
   */
  async searchDestination(
    destination: string,
    queryType: 'attractions' | 'restaurants' | 'hotels' | 'activities' | 'weather' | 'overview' = 'overview'
  ): Promise<TavilySearchResponse> {
    const queryMap = {
      attractions: `best attractions and sights to see in ${destination}`,
      restaurants: `best restaurants and dining in ${destination}`,
      hotels: `best hotels and accommodations in ${destination}`,
      activities: `best activities and things to do in ${destination}`,
      weather: `weather and climate information for ${destination}`,
      overview: `travel guide and information about ${destination}`,
    };

    return this.searchTravel(queryMap[queryType], {
      destination,
      searchDepth: SearchDepth.ADVANCED,
      maxResults: 8,
      includeImages: true,
      includeImageDescriptions: true,
      includeAnswer: 'advanced',
    });
  }

  /**
   * Search for real-time travel information (flights, prices, etc.)
   * @param query Real-time travel query
   * @param options Search options
   * @returns Promise resolving to real-time travel information
   */
  async searchRealTime(
    query: string,
    options: TravelSearchOptions = {}
  ): Promise<TavilySearchResponse> {
    return this.searchTravel(query, {
      ...options,
      timeRange: TimeRange.WEEK, // Focus on recent information
      topic: TravelSearchTopic.NEWS, // Use news topic for real-time data
      searchDepth: SearchDepth.ADVANCED,
      maxResults: options.maxResults || 15,
      includeAnswer: 'advanced',
    });
  }

  /**
   * Search for travel news and updates
   * @param destination Optional destination filter
   * @param timeRange Time range for news
   * @returns Promise resolving to travel news
   */
  async searchTravelNews(
    destination?: string,
    timeRange: TimeRange = TimeRange.WEEK
  ): Promise<TavilySearchResponse> {
    let query = 'travel news updates';
    if (destination) {
      query += ` ${destination}`;
    }

    return this.search(query, {
      topic: TravelSearchTopic.NEWS,
      timeRange,
      searchDepth: SearchDepth.ADVANCED,
      maxResults: 10,
      includeImages: true,
      includeAnswer: 'basic',
    });
  }

  /**
   * Extract content from specific URLs
   * @param urls Array of URLs to extract content from
   * @returns Promise resolving to extracted content
   */
  async extractContent(urls: string[]): Promise<{
    results: Array<{ url: string; rawContent: string }>;
    failedResults: string[];
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (urls.length > 20) {
      throw new Error('Maximum 20 URLs allowed per extraction request');
    }

    try {
      const response = await fetch(`${this.baseUrl}/extract`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ urls }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tavily extract API error: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error extracting content:', error);
      throw new Error(`Content extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get comprehensive travel information for a destination
   * @param destination Destination name
   * @param interests Array of interest categories
   * @returns Promise resolving to comprehensive travel information
   */
  async getComprehensiveTravelInfo(
    destination: string,
    interests: string[] = ['attractions', 'restaurants', 'hotels', 'activities']
  ): Promise<{
    destination: string;
    overview: TavilySearchResponse;
    categories: Record<string, TavilySearchResponse>;
    totalResults: number;
  }> {
    const overview = await this.searchDestination(destination, 'overview');
    const categories: Record<string, TavilySearchResponse> = {};

    // Search for each interest category
    for (const interest of interests) {
      if (['attractions', 'restaurants', 'hotels', 'activities'].includes(interest)) {
        categories[interest] = await this.searchDestination(
          destination,
          interest as 'attractions' | 'restaurants' | 'hotels' | 'activities'
        );
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const totalResults = overview.results.length + 
      Object.values(categories).reduce((sum, cat) => sum + cat.results.length, 0);

    return {
      destination,
      overview,
      categories,
      totalResults,
    };
  }

  /**
   * Search with automatic query enhancement for travel contexts
   * @param query Original query
   * @param context Travel context information
   * @returns Promise resolving to enhanced search results
   */
  async searchWithContext(
    query: string,
    context: {
      destination?: string;
      budget?: string;
      travelStyle?: string;
      duration?: string;
      interests?: string[];
    }
  ): Promise<TavilySearchResponse> {
    let enhancedQuery = query;

    // Add context to query
    if (context.destination) {
      enhancedQuery += ` in ${context.destination}`;
    }
    if (context.budget) {
      enhancedQuery += ` ${context.budget} budget`;
    }
    if (context.travelStyle) {
      enhancedQuery += ` ${context.travelStyle} travel`;
    }
    if (context.duration) {
      enhancedQuery += ` ${context.duration} trip`;
    }
    if (context.interests && context.interests.length > 0) {
      enhancedQuery += ` interested in ${context.interests.join(', ')}`;
    }

    return this.searchTravel(enhancedQuery, {
      searchDepth: SearchDepth.ADVANCED,
      maxResults: 12,
      includeImages: true,
      includeImageDescriptions: true,
      includeAnswer: 'advanced',
    });
  }
}

// Singleton instance for service-wide usage
export const tavilyWebSearchService = new TavilyWebSearchService();

// Export types for use in other modules
export type {
  TavilySearchResult,
  TavilyImageResult,
  TavilySearchResponse,
  TavilySearchOptions,
  TravelSearchOptions,
};
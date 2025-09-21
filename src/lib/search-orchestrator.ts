/**
 * Multi-Provider Search Orchestrator
 * Coordinates search across multiple providers for optimal results
 */

import {
  SearchRequest,
  SearchResponse,
  SearchResultItem,
  SearchMetadata,
  SearchError,
} from '../types/search-providers';
import { createSerpProvider } from './providers/serp';
import { createTavilyProvider } from './providers/tavily';
import { createExaProvider } from './providers/exa';
import { createCruiseCriticProvider } from './providers/cruise-critic';

/**
 * Search Orchestrator Configuration
 */
export interface OrchestratorConfig {
  providers: {
    serp?: boolean;
    tavily?: boolean;
    exa?: boolean;
    cruiseCritic?: boolean;
  };
  strategy: 'parallel' | 'sequential' | 'fallback';
  timeout: number; // milliseconds
  maxResults: number;
  deduplication: boolean;
  ranking: 'relevance' | 'diversity' | 'recency';
}

/**
 * Provider Health Status
 */
export interface ProviderStatus {
  name: string;
  healthy: boolean;
  latency: number;
  errorRate: number;
  lastChecked: string;
}

/**
 * Search Orchestrator
 */
export class SearchOrchestrator {
  private providers: Map<string, any> = new Map();
  private config: OrchestratorConfig;
  private providerStatus: Map<string, ProviderStatus> = new Map();

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = {
      providers: {
        serp: true,
        tavily: true,
        exa: false, // Neural search is more expensive
        cruiseCritic: false, // Only for cruise queries
      },
      strategy: 'parallel',
      timeout: 10000,
      maxResults: 20,
      deduplication: true,
      ranking: 'relevance',
      ...config,
    };

    this.initializeProviders();
  }

  /**
   * Initialize search providers
   */
  private initializeProviders(): void {
    if (this.config.providers.serp) {
      this.providers.set('serp', createSerpProvider());
    }

    if (this.config.providers.tavily) {
      this.providers.set('tavily', createTavilyProvider());
    }

    if (this.config.providers.exa) {
      this.providers.set('exa', createExaProvider());
    }

    if (this.config.providers.cruiseCritic) {
      this.providers.set('cruise-critic', createCruiseCriticProvider());
    }
  }

  /**
   * Execute orchestrated search across multiple providers
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    const startTime = Date.now();
    const allResults: SearchResultItem[] = [];
    const allErrors: SearchError[] = [];

    // Determine which providers to use based on query content
    const selectedProviders = this.selectProviders(request);

    if (selectedProviders.length === 0) {
      return this.createEmptyResponse(request, startTime, 'No suitable providers available');
    }

    try {
      if (this.config.strategy === 'parallel') {
        const results = await this.executeParallelSearch(request, selectedProviders);
        allResults.push(...results.results);
        allErrors.push(...results.errors);
      } else if (this.config.strategy === 'sequential') {
        const results = await this.executeSequentialSearch(request, selectedProviders);
        allResults.push(...results.results);
        allErrors.push(...results.errors);
      } else if (this.config.strategy === 'fallback') {
        const results = await this.executeFallbackSearch(request, selectedProviders);
        allResults.push(...results.results);
        allErrors.push(...results.errors);
      }

      // Process and rank results
      const processedResults = this.processResults(allResults);

      const metadata: SearchMetadata = {
        totalResults: processedResults.length,
        searchTime: Date.now() - startTime,
        provider: 'orchestrator',
        queryType: request.type,
        timestamp: new Date().toISOString(),
      };

      return {
        query: request.query,
        provider: 'orchestrator',
        results: processedResults,
        metadata,
        ...(allErrors.length > 0 && { errors: allErrors }),
      };
    } catch (error) {
      const searchError: SearchError = {
        code: 'ORCHESTRATOR_ERROR',
        message: error instanceof Error ? error.message : 'Search orchestration failed',
        retryable: true,
      };

      return {
        query: request.query,
        provider: 'orchestrator',
        results: [],
        metadata: {
          totalResults: 0,
          searchTime: Date.now() - startTime,
          provider: 'orchestrator',
          queryType: request.type,
          timestamp: new Date().toISOString(),
        },
        errors: [searchError],
      };
    }
  }

  /**
   * Select appropriate providers based on query content
   */
  private selectProviders(request: SearchRequest): string[] {
    const selected: string[] = [];
    const query = request.query.toLowerCase();

    // Cruise-specific queries
    if (query.includes('cruise') || query.includes('cruisecritic')) {
      if (this.providers.has('cruise-critic')) {
        selected.push('cruise-critic');
      }
    }

    // Neural search queries
    if (request.type === 'neural' || query.includes('neural') || query.includes('semantic')) {
      if (this.providers.has('exa')) {
        selected.push('exa');
      }
    }

    // General web search
    if (selected.length === 0) {
      if (this.providers.has('tavily')) {
        selected.push('tavily'); // Prefer Tavily for general search
      }
      if (this.providers.has('serp')) {
        selected.push('serp'); // Fallback to SERP
      }
    }

    return selected;
  }

  /**
   * Execute parallel search across providers
   */
  private async executeParallelSearch(
    request: SearchRequest,
    providers: string[]
  ): Promise<{ results: SearchResultItem[]; errors: SearchError[] }> {
    const promises = providers.map((providerName) =>
      this.executeProviderSearch(providerName, request)
    );

    const results = await Promise.allSettled(promises);
    const allResults: SearchResultItem[] = [];
    const allErrors: SearchError[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allResults.push(...result.value.results);
        if (result.value.errors) {
          allErrors.push(...result.value.errors);
        }
      } else {
        allErrors.push({
          code: `PROVIDER_${providers[index]?.toUpperCase()}_ERROR`,
          message: `Provider ${providers[index]} failed: ${result.reason}`,
          retryable: true,
        });
      }
    });

    return { results: allResults, errors: allErrors };
  }

  /**
   * Execute sequential search with fallback
   */
  private async executeSequentialSearch(
    request: SearchRequest,
    providers: string[]
  ): Promise<{ results: SearchResultItem[]; errors: SearchError[] }> {
    const allResults: SearchResultItem[] = [];
    const allErrors: SearchError[] = [];

    for (const providerName of providers) {
      try {
        const response = await this.executeProviderSearch(providerName, request);
        allResults.push(...response.results);
        if (response.errors) {
          allErrors.push(...response.errors);
        }

        // If we got good results, we can stop here
        if (response.results.length >= this.config.maxResults / 2) {
          break;
        }
      } catch (error) {
        allErrors.push({
          code: `PROVIDER_${providerName.toUpperCase()}_ERROR`,
          message: `Provider ${providerName} failed: ${error}`,
          retryable: true,
        });
      }
    }

    return { results: allResults, errors: allErrors };
  }

  /**
   * Execute fallback search (try providers in order until success)
   */
  private async executeFallbackSearch(
    request: SearchRequest,
    providers: string[]
  ): Promise<{ results: SearchResultItem[]; errors: SearchError[] }> {
    const allErrors: SearchError[] = [];

    for (const providerName of providers) {
      try {
        const response = await this.executeProviderSearch(providerName, request);

        if (response.results.length > 0) {
          return { results: response.results, errors: response.errors || [] };
        }

        if (response.errors) {
          allErrors.push(...response.errors);
        }
      } catch (error) {
        allErrors.push({
          code: `PROVIDER_${providerName.toUpperCase()}_ERROR`,
          message: `Provider ${providerName} failed: ${error}`,
          retryable: true,
        });
      }
    }

    return { results: [], errors: allErrors };
  }

  /**
   * Execute search on a specific provider
   */
  private async executeProviderSearch(
    providerName: string,
    request: SearchRequest
  ): Promise<SearchResponse> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Search timeout')), this.config.timeout);
    });

    // Race between the search and timeout
    return Promise.race([provider.search(request), timeoutPromise]);
  }

  /**
   * Process and rank search results
   */
  private processResults(results: SearchResultItem[]): SearchResultItem[] {
    let processedResults = [...results];

    // Deduplicate results if enabled
    if (this.config.deduplication) {
      processedResults = this.deduplicateResults(processedResults);
    }

    // Rank results based on strategy
    switch (this.config.ranking) {
      case 'relevance':
        processedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
        break;
      case 'recency':
        processedResults.sort((a, b) => {
          const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
          const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'diversity':
        processedResults = this.rankByDiversity(processedResults);
        break;
    }

    // Limit results
    return processedResults.slice(0, this.config.maxResults);
  }

  /**
   * Remove duplicate results based on URL similarity
   */
  private deduplicateResults(results: SearchResultItem[]): SearchResultItem[] {
    const seen = new Set<string>();
    const deduplicated: SearchResultItem[] = [];

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
      const urlObj = new URL(url);
      // Remove query parameters and fragments for better deduplication
      return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
    } catch {
      return url;
    }
  }

  /**
   * Rank results by diversity (different sources)
   */
  private rankByDiversity(results: SearchResultItem[]): SearchResultItem[] {
    const sourceGroups: Map<string, SearchResultItem[]> = new Map();

    // Group by source
    for (const result of results) {
      const source = result.source;
      if (!sourceGroups.has(source)) {
        sourceGroups.set(source, []);
      }
      sourceGroups.get(source)!.push(result);
    }

    // Interleave results from different sources
    const ranked: SearchResultItem[] = [];
    const maxPerSource = Math.ceil(this.config.maxResults / sourceGroups.size);

    while (ranked.length < this.config.maxResults) {
      let added = false;

      for (const [source, sourceResults] of sourceGroups) {
        if (
          sourceResults.length > 0 &&
          ranked.filter((r) => r.source === source).length < maxPerSource
        ) {
          const result = sourceResults.shift()!;
          ranked.push(result);
          added = true;
        }
      }

      if (!added) break;
    }

    return ranked;
  }

  /**
   * Create empty response for error cases
   */
  private createEmptyResponse(
    request: SearchRequest,
    startTime: number,
    errorMessage: string
  ): SearchResponse {
    const searchError: SearchError = {
      code: 'NO_PROVIDERS_AVAILABLE',
      message: errorMessage,
      retryable: false,
    };

    return {
      query: request.query,
      provider: 'orchestrator',
      results: [],
      metadata: {
        totalResults: 0,
        searchTime: Date.now() - startTime,
        provider: 'orchestrator',
        queryType: request.type,
        timestamp: new Date().toISOString(),
      },
      errors: [searchError],
    };
  }

  /**
   * Get health status of all providers
   */
  async getHealthStatus(): Promise<ProviderStatus[]> {
    const statuses: ProviderStatus[] = [];

    for (const [name, provider] of this.providers) {
      try {
        const health = await provider.getHealth();
        const status: ProviderStatus = {
          name,
          healthy: health.status === 'healthy',
          latency: health.latency,
          errorRate: health.errorRate,
          lastChecked: new Date().toISOString(),
        };
        statuses.push(status);
        this.providerStatus.set(name, status);
      } catch (error) {
        const status: ProviderStatus = {
          name,
          healthy: false,
          latency: 0,
          errorRate: 1,
          lastChecked: new Date().toISOString(),
        };
        statuses.push(status);
        this.providerStatus.set(name, status);
      }
    }

    return statuses;
  }

  /**
   * Update orchestrator configuration
   */
  updateConfig(config: Partial<OrchestratorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): OrchestratorConfig {
    return { ...this.config };
  }
}

/**
 * Factory function to create search orchestrator
 */
export function createSearchOrchestrator(config?: Partial<OrchestratorConfig>): SearchOrchestrator {
  return new SearchOrchestrator(config);
}

/**
 * Default search orchestrator instance
 */
export const searchOrchestrator = createSearchOrchestrator();

/**
 * Validation Rules:
 * - At least one provider must be configured
 * - Timeout must be reasonable (1000-30000ms)
 * - Max results must be between 1 and 100
 * - Strategy must be one of the supported types
 * - Provider health checks must be performed regularly
 * - Results must be properly deduplicated and ranked
 */

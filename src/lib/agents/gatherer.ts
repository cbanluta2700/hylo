/**
 * Web Information Gatherer Agent
 * Collects and synthesizes web information using Groq Compound
 */

import { AgentInput, AgentOutput } from '../../types/agent-responses';
import { EnhancedFormData } from '../../types/form-data';
import { searchOrchestrator } from '../search-orchestrator';
import { SmartQuery } from '../../types/smart-query';

/**
 * Gatherer Agent Configuration
 */
export interface GathererConfig {
  model: 'groq-compound';
  temperature: number;
  maxTokens: number;
  searchDepth: 'basic' | 'comprehensive' | 'exhaustive';
  maxSources: number;
  synthesisMethod: 'consensus' | 'weighted' | 'hierarchical';
}

/**
 * Default configuration for the Gatherer agent
 */
const DEFAULT_GATHERER_CONFIG: GathererConfig = {
  model: 'groq-compound',
  temperature: 0.1, // Low temperature for factual information gathering
  maxTokens: 3000,
  searchDepth: 'comprehensive',
  maxSources: 15,
  synthesisMethod: 'weighted',
};

/**
 * Information Source with credibility scoring
 */
export interface InformationSource {
  url: string;
  title: string;
  content: string;
  credibilityScore: number;
  sourceType: 'official' | 'news' | 'blog' | 'review' | 'social' | 'academic';
  publicationDate?: string;
  author?: string;
  relevanceScore: number;
}

/**
 * Synthesized Information Result
 */
export interface SynthesizedInfo {
  topic: string;
  summary: string;
  keyFacts: string[];
  sources: InformationSource[];
  confidence: number;
  lastUpdated: string;
  categories: string[];
}

/**
 * Web Information Gatherer Agent
 */
export class WebInformationGathererAgent {
  private config: GathererConfig;

  constructor(config: Partial<GathererConfig> = {}) {
    this.config = { ...DEFAULT_GATHERER_CONFIG, ...config };
  }

  /**
   * Process information gathering request
   */
  async processRequest(input: AgentInput): Promise<{
    success: boolean;
    output?: AgentOutput;
    error?: any;
    metadata: any;
  }> {
    const startTime = Date.now();

    try {
      // Validate input
      this.validateInput(input);

      // Generate search queries based on form data
      const searchQueries = this.generateSearchQueries(input.formData);

      // Execute searches and gather information
      const rawInformation = await this.gatherInformation(searchQueries);

      // Synthesize and validate information
      const synthesizedInfo = await this.synthesizeInformation(rawInformation, input.formData);

      // Create agent output
      const output: AgentOutput = {
        data: synthesizedInfo,
        confidence: this.calculateOverallConfidence(synthesizedInfo),
        sources: this.extractSourceAttributions(synthesizedInfo),
        processingTime: Date.now() - startTime,
        recommendations: this.generateInformationRecommendations(synthesizedInfo),
      };

      return {
        success: true,
        output,
        metadata: {
          agentVersion: '1.0.0',
          processingTime: Date.now() - startTime,
          modelUsed: this.config.model,
          sourcesProcessed: rawInformation.length,
          informationSynthesized: synthesizedInfo.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GATHERER_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown gatherer error',
          details: {
            input,
            timestamp: new Date().toISOString(),
          },
        },
        metadata: {
          agentVersion: '1.0.0',
          processingTime: Date.now() - startTime,
          modelUsed: this.config.model,
        },
      };
    }
  }

  /**
   * Generate search queries based on form data
   */
  private generateSearchQueries(formData: EnhancedFormData): SmartQuery[] {
    const queries: SmartQuery[] = [];
    const destination = formData.location;
    const interests = formData.selectedInterests || [];

    // Core destination information
    queries.push({
      query: `${destination} travel guide 2025 tourist information`,
      type: 'general',
      agent: 'gatherer',
      priority: 'high',
    });

    // Weather and best time to visit
    queries.push({
      query: `${destination} weather best time to visit climate`,
      type: 'weather',
      agent: 'gatherer',
      priority: 'high',
    });

    // Safety and health information
    queries.push({
      query: `${destination} safety health travel advisories`,
      type: 'safety',
      agent: 'gatherer',
      priority: 'medium',
    });

    // Transportation options
    queries.push({
      id: `dest_${Date.now()}_transport`,
      query: `${destination} transportation getting around public transport`,
      type: 'transportation',
      agent: 'gatherer',
      priority: 'medium',
      context: {
        category: 'transportation',
        requiredInfo: ['public_transport', 'taxi_services', 'car_rental'],
      },
    });

    // Interest-specific queries
    for (const interest of interests.slice(0, 3)) {
      // Limit to top 3 interests
      queries.push({
        id: `interest_${Date.now()}_${interest}`,
        query: `${destination} ${interest} activities attractions experiences`,
        type: 'activities',
        agent: 'gatherer',
        priority: 'medium',
        context: {
          category: 'interest_specific',
          interest,
          requiredInfo: ['top_attractions', 'experiences', 'booking_info'],
        },
      });
    }

    // Accommodation information
    queries.push({
      id: `dest_${Date.now()}_accommodation`,
      query: `${destination} accommodation hotels types price ranges`,
      type: 'accommodations',
      agent: 'gatherer',
      priority: 'low',
      context: {
        category: 'accommodation',
        requiredInfo: ['hotel_types', 'price_ranges', 'popular_areas'],
      },
    });

    // Dining information
    queries.push({
      id: `dest_${Date.now()}_dining`,
      query: `${destination} restaurants food cuisine local specialties`,
      type: 'dining',
      agent: 'gatherer',
      priority: 'low',
      context: {
        category: 'dining',
        requiredInfo: ['cuisine_types', 'price_ranges', 'popular_restaurants'],
      },
    });

    return queries;
  }

  /**
   * Gather information from multiple sources
   */
  private async gatherInformation(queries: SmartQuery[]): Promise<InformationSource[]> {
    const allSources: InformationSource[] = [];

    // Process queries in batches to respect rate limits
    const batchSize = 3;
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      const batchPromises = batch.map((query) => this.searchSingleQuery(query));

      try {
        const batchResults = await Promise.allSettled(batchPromises);

        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            allSources.push(...result.value);
          } else {
            console.warn('Query failed:', result.reason);
          }
        }
      } catch (error) {
        console.warn('Batch processing failed:', error);
      }

      // Small delay between batches to be respectful to APIs
      if (i + batchSize < queries.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return allSources.slice(0, this.config.maxSources);
  }

  /**
   * Search for a single query
   */
  private async searchSingleQuery(query: SmartQuery): Promise<InformationSource[]> {
    try {
      const searchRequest = {
        query: query.query,
        type: 'text' as const,
        provider: 'orchestrator',
        options: {
          maxResults: 5,
        },
      };

      const searchResponse = await searchOrchestrator.search(searchRequest);

      return searchResponse.results.map((result) => ({
        url: result.url,
        title: result.title,
        content: result.snippet,
        credibilityScore: this.calculateCredibilityScore(result.source),
        sourceType: this.classifySourceType(result.source),
        publicationDate: result.publishedDate,
        relevanceScore: result.relevanceScore,
      }));
    } catch (error) {
      console.warn(`Search failed for query "${query.query}":`, error);
      return [];
    }
  }

  /**
   * Synthesize information from multiple sources
   */
  private async synthesizeInformation(
    sources: InformationSource[],
    formData: EnhancedFormData
  ): Promise<SynthesizedInfo[]> {
    const synthesized: SynthesizedInfo[] = [];
    const categories = this.identifyCategories(sources);

    for (const category of categories) {
      const categorySources = sources.filter((source) =>
        this.isSourceRelevantToCategory(source, category)
      );

      if (categorySources.length > 0) {
        const synthesizedInfo = await this.synthesizeCategory(category, categorySources, formData);
        synthesized.push(synthesizedInfo);
      }
    }

    return synthesized;
  }

  /**
   * Identify information categories from sources
   */
  private identifyCategories(sources: InformationSource[]): string[] {
    const categories = new Set<string>();

    for (const source of sources) {
      // Extract categories from content and context
      if (
        source.content.toLowerCase().includes('weather') ||
        source.content.toLowerCase().includes('climate')
      ) {
        categories.add('weather');
      }
      if (
        source.content.toLowerCase().includes('safety') ||
        source.content.toLowerCase().includes('health')
      ) {
        categories.add('safety');
      }
      if (
        source.content.toLowerCase().includes('transport') ||
        source.content.toLowerCase().includes('getting around')
      ) {
        categories.add('transportation');
      }
      if (
        source.content.toLowerCase().includes('attractions') ||
        source.content.toLowerCase().includes('sightseeing')
      ) {
        categories.add('attractions');
      }
      if (
        source.content.toLowerCase().includes('restaurant') ||
        source.content.toLowerCase().includes('food')
      ) {
        categories.add('dining');
      }
      if (
        source.content.toLowerCase().includes('hotel') ||
        source.content.toLowerCase().includes('accommodation')
      ) {
        categories.add('accommodation');
      }
    }

    return Array.from(categories);
  }

  /**
   * Check if source is relevant to category
   */
  private isSourceRelevantToCategory(source: InformationSource, category: string): boolean {
    const content = source.content.toLowerCase();

    switch (category) {
      case 'weather':
        return (
          content.includes('weather') ||
          content.includes('climate') ||
          content.includes('temperature') ||
          content.includes('rain')
        );
      case 'safety':
        return (
          content.includes('safety') ||
          content.includes('health') ||
          content.includes('advisory') ||
          content.includes('warning')
        );
      case 'transportation':
        return (
          content.includes('transport') ||
          content.includes('taxi') ||
          content.includes('bus') ||
          content.includes('train')
        );
      case 'attractions':
        return (
          content.includes('attractions') ||
          content.includes('sightseeing') ||
          content.includes('museum') ||
          content.includes('park')
        );
      case 'dining':
        return (
          content.includes('restaurant') ||
          content.includes('food') ||
          content.includes('cuisine') ||
          content.includes('dining')
        );
      case 'accommodation':
        return (
          content.includes('hotel') ||
          content.includes('accommodation') ||
          content.includes('lodging') ||
          content.includes('stay')
        );
      default:
        return true;
    }
  }

  /**
   * Synthesize information for a specific category
   */
  private async synthesizeCategory(
    category: string,
    sources: InformationSource[],
    formData: EnhancedFormData
  ): Promise<SynthesizedInfo> {
    // Sort sources by credibility and relevance
    const sortedSources = sources.sort((a, b) => {
      const scoreA = (a.credibilityScore + a.relevanceScore) / 2;
      const scoreB = (b.credibilityScore + b.relevanceScore) / 2;
      return scoreB - scoreA;
    });

    // Extract key facts from top sources
    const keyFacts = this.extractKeyFacts(sortedSources, category);

    // Generate summary
    const summary = this.generateCategorySummary(category, keyFacts, formData);

    return {
      topic: category,
      summary,
      keyFacts,
      sources: sortedSources.slice(0, 5), // Top 5 sources
      confidence: this.calculateCategoryConfidence(sortedSources),
      lastUpdated: new Date().toISOString(),
      categories: [category],
    };
  }

  /**
   * Extract key facts from sources
   */
  private extractKeyFacts(sources: InformationSource[], category: string): string[] {
    const facts: string[] = [];
    const seenFacts = new Set<string>();

    for (const source of sources.slice(0, 3)) {
      // Use top 3 sources
      const sourceFacts = this.extractFactsFromContent(source.content, category);

      for (const fact of sourceFacts) {
        if (!seenFacts.has(fact) && facts.length < 5) {
          facts.push(fact);
          seenFacts.add(fact);
        }
      }
    }

    return facts;
  }

  /**
   * Extract facts from content based on category
   */
  private extractFactsFromContent(content: string, category: string): string[] {
    const facts: string[] = [];
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 10);

    for (const sentence of sentences.slice(0, 3)) {
      const trimmed = sentence.trim();
      if (this.isFactRelevantToCategory(trimmed, category)) {
        facts.push(trimmed);
      }
    }

    return facts;
  }

  /**
   * Check if fact is relevant to category
   */
  private isFactRelevantToCategory(fact: string, category: string): boolean {
    const lowerFact = fact.toLowerCase();

    switch (category) {
      case 'weather':
        return (
          lowerFact.includes('weather') ||
          lowerFact.includes('temperature') ||
          lowerFact.includes('rain') ||
          lowerFact.includes('sunny')
        );
      case 'safety':
        return (
          lowerFact.includes('safety') ||
          lowerFact.includes('health') ||
          lowerFact.includes('advisory') ||
          lowerFact.includes('warning')
        );
      case 'transportation':
        return (
          lowerFact.includes('transport') ||
          lowerFact.includes('taxi') ||
          lowerFact.includes('bus') ||
          lowerFact.includes('train')
        );
      default:
        return fact.length > 20; // General relevance check
    }
  }

  /**
   * Generate category summary
   */
  private generateCategorySummary(
    category: string,
    keyFacts: string[],
    formData: EnhancedFormData
  ): string {
    const destination = formData.location;

    switch (category) {
      case 'weather':
        return `Current weather information for ${destination} including seasonal patterns and best times to visit.`;
      case 'safety':
        return `Safety and health information for travelers to ${destination}, including local advisories and precautions.`;
      case 'transportation':
        return `Transportation options and getting around information for ${destination}.`;
      case 'attractions':
        return `Key attractions and sightseeing opportunities in ${destination}.`;
      case 'dining':
        return `Dining and culinary information for ${destination}.`;
      case 'accommodation':
        return `Accommodation options and recommendations for ${destination}.`;
      default:
        return `General information about ${destination} for travelers.`;
    }
  }

  /**
   * Calculate credibility score for a source
   */
  private calculateCredibilityScore(sourceUrl: string): number {
    let score = 0.5; // Base score

    const url = sourceUrl.toLowerCase();

    // Official government sources
    if (url.includes('.gov') || url.includes('official')) {
      score += 0.4;
    }

    // Reputable news sources
    if (
      url.includes('bbc.com') ||
      url.includes('cnn.com') ||
      url.includes('nytimes.com') ||
      url.includes('reuters.com')
    ) {
      score += 0.3;
    }

    // Travel-specific reputable sources
    if (
      url.includes('tripadvisor.com') ||
      url.includes('lonelyplanet.com') ||
      url.includes('fodors.com') ||
      url.includes('frommers.com')
    ) {
      score += 0.3;
    }

    // Academic or educational sources
    if (url.includes('.edu') || url.includes('wikipedia.org')) {
      score += 0.2;
    }

    // Social media or user-generated content (lower credibility)
    if (
      url.includes('twitter.com') ||
      url.includes('facebook.com') ||
      url.includes('instagram.com') ||
      url.includes('reddit.com')
    ) {
      score -= 0.2;
    }

    return Math.max(0.1, Math.min(1.0, score));
  }

  /**
   * Classify source type
   */
  private classifySourceType(sourceUrl: string): InformationSource['sourceType'] {
    const url = sourceUrl.toLowerCase();

    if (url.includes('.gov') || url.includes('official')) {
      return 'official';
    }
    if (url.includes('news') || url.includes('bbc.com') || url.includes('cnn.com')) {
      return 'news';
    }
    if (url.includes('blog') || url.includes('wordpress.com') || url.includes('blogspot.com')) {
      return 'blog';
    }
    if (url.includes('tripadvisor.com') || url.includes('yelp.com')) {
      return 'review';
    }
    if (url.includes('twitter.com') || url.includes('facebook.com')) {
      return 'social';
    }
    if (url.includes('.edu') || url.includes('wikipedia.org')) {
      return 'academic';
    }

    return 'blog'; // Default
  }

  /**
   * Calculate category confidence
   */
  private calculateCategoryConfidence(sources: InformationSource[]): number {
    if (sources.length === 0) return 0;

    const avgCredibility =
      sources.reduce((sum, source) => sum + source.credibilityScore, 0) / sources.length;
    const avgRelevance =
      sources.reduce((sum, source) => sum + source.relevanceScore, 0) / sources.length;
    const sourceCount = Math.min(sources.length / 3, 1); // Bonus for multiple sources

    return Math.min(1.0, ((avgCredibility + avgRelevance) / 2) * sourceCount);
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(synthesizedInfo: SynthesizedInfo[]): number {
    if (synthesizedInfo.length === 0) return 0;

    const avgConfidence =
      synthesizedInfo.reduce((sum, info) => sum + info.confidence, 0) / synthesizedInfo.length;
    return Math.min(1.0, avgConfidence);
  }

  /**
   * Extract source attributions
   */
  private extractSourceAttributions(synthesizedInfo: SynthesizedInfo[]): any[] {
    const attributions: any[] = [];

    for (const info of synthesizedInfo) {
      for (const source of info.sources) {
        attributions.push({
          url: source.url,
          title: source.title,
          credibilityScore: source.credibilityScore,
          sourceType: source.sourceType,
          relevanceScore: source.relevanceScore,
        });
      }
    }

    return attributions;
  }

  /**
   * Generate information recommendations
   */
  private generateInformationRecommendations(synthesizedInfo: SynthesizedInfo[]): string[] {
    const recommendations: string[] = [];

    const hasWeather = synthesizedInfo.some((info) => info.topic === 'weather');
    const hasSafety = synthesizedInfo.some((info) => info.topic === 'safety');
    const hasTransport = synthesizedInfo.some((info) => info.topic === 'transportation');

    if (!hasWeather) {
      recommendations.push('Consider checking current weather conditions closer to travel date');
    }

    if (!hasSafety) {
      recommendations.push('Review official travel advisories for health and safety information');
    }

    if (!hasTransport) {
      recommendations.push('Research transportation options for getting around the destination');
    }

    if (recommendations.length === 0) {
      recommendations.push('Information gathering is comprehensive for planned activities');
    }

    return recommendations;
  }

  /**
   * Validate input
   */
  private validateInput(input: AgentInput): void {
    if (!input.formData) {
      throw new Error('Form data is required for information gathering');
    }

    if (!input.formData.location) {
      throw new Error('Destination location is required');
    }
  }
}

/**
 * Factory function to create Web Information Gatherer agent
 */
export function createWebInformationGatherer(
  config?: Partial<GathererConfig>
): WebInformationGathererAgent {
  return new WebInformationGathererAgent(config);
}

/**
 * Default Web Information Gatherer instance
 */
export const webInformationGatherer = createWebInformationGatherer();

/**
 * Validation Rules:
 * - Form data must include destination location
 * - Search queries must be generated based on form data
 * - Information sources must be credibility-scored
 * - Synthesized information must include confidence metrics
 * - Source attributions must be properly tracked
 * - Error handling must account for search failures
 */

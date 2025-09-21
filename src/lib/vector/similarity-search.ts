/**
 * Itinerary Similarity Search
 * Advanced similarity matching for itinerary recommendations and caching
 */

import {
  vectorClient,
  VectorDocument,
  VectorSearchResult,
  createSearchFilter,
  VECTOR_CONFIG,
} from './upstash-client';
// import { generateEmbedding } from './embeddings'; // Will be implemented in T061

// Temporary placeholder for embedding generation
async function generateEmbedding(text: string): Promise<number[]> {
  // Placeholder implementation - returns a zero vector
  // This will be replaced with actual embedding generation in T061
  console.warn('Using placeholder embedding generation - implement actual embeddings in T061');
  return new Array(VECTOR_CONFIG.VECTOR_DIMENSION).fill(0);
}

/**
 * Similarity search configuration
 */
export const SIMILARITY_CONFIG = {
  // Similarity thresholds
  EXACT_MATCH_THRESHOLD: 0.95,
  HIGH_SIMILARITY_THRESHOLD: 0.85,
  MEDIUM_SIMILARITY_THRESHOLD: 0.75,
  LOW_SIMILARITY_THRESHOLD: 0.6,

  // Search limits
  MAX_RESULTS: 10,
  CACHE_RESULTS_LIMIT: 5,
  RECOMMENDATION_LIMIT: 3,

  // Scoring weights
  WEIGHTS: {
    VECTOR_SIMILARITY: 0.6,
    METADATA_MATCH: 0.3,
    QUALITY_SCORE: 0.1,
  },

  // Cache settings
  CACHE_TTL: 24 * 60 * 60, // 24 hours
  CACHE_KEY_PREFIX: 'similarity:',

  // Recommendation settings
  MIN_CONFIDENCE_FOR_RECOMMENDATION: 0.7,
  MAX_RECOMMENDATIONS_PER_QUERY: 5,
} as const;

/**
 * Similarity search result with enhanced scoring
 */
export interface SimilarityResult extends VectorSearchResult {
  similarityScore: number;
  metadataMatchScore: number;
  qualityScore: number;
  combinedScore: number;
  matchType: 'exact' | 'high' | 'medium' | 'low' | 'none';
  reasons: string[];
}

/**
 * Similarity search options
 */
export interface SimilaritySearchOptions {
  maxResults?: number;
  similarityThreshold?: number;
  includeMetadata?: boolean;
  includeReasons?: boolean;
  filterByDestination?: boolean;
  filterByBudget?: boolean;
  filterByTravelStyle?: boolean;
  minQuality?: number;
  prioritizeRecent?: boolean;
}

/**
 * Recommendation result
 */
export interface RecommendationResult {
  itinerary: any;
  confidence: number;
  similarityScore: number;
  matchReasons: string[];
  source: 'cache' | 'generated';
  metadata: {
    destination?: string;
    budgetRange?: string;
    travelStyle?: string;
    duration?: number;
    createdAt: string;
  };
}

/**
 * Similarity Search Engine
 * Advanced similarity matching for travel itineraries
 */
export class SimilaritySearchEngine {
  /**
   * Find similar itineraries based on form data
   */
  async findSimilarItineraries(
    formData: any,
    options: SimilaritySearchOptions = {}
  ): Promise<SimilarityResult[]> {
    const {
      maxResults = SIMILARITY_CONFIG.MAX_RESULTS,
      similarityThreshold = SIMILARITY_CONFIG.LOW_SIMILARITY_THRESHOLD,
      includeMetadata = true,
      includeReasons = true,
      filterByDestination = true,
      filterByBudget = true,
      filterByTravelStyle = true,
      minQuality = 0.5,
      prioritizeRecent = true,
    } = options;

    try {
      // Generate embedding for the query
      const queryText = this.formDataToText(formData);
      const queryEmbedding = await generateEmbedding(queryText);

      // Create search filter
      const filter = createSearchFilter(
        undefined, // Don't filter by session
        filterByDestination ? formData?.location?.destination : undefined,
        filterByBudget ? this.extractBudgetRange(formData) : undefined,
        filterByTravelStyle ? formData?.travelStyle?.primary : undefined,
        minQuality
      );

      // Perform vector search
      const searchResults = await vectorClient.searchSimilar(queryEmbedding, {
        topK: maxResults * 2, // Get more results for filtering
        includeVectors: false,
        includeMetadata,
        filter,
        similarityThreshold,
      });

      // Enhance results with similarity scoring
      const enhancedResults = await this.enhanceResultsWithScoring(
        searchResults,
        formData,
        includeReasons
      );

      // Sort and filter results
      let filteredResults = enhancedResults
        .filter((result) => result.combinedScore >= similarityThreshold)
        .sort((a, b) => {
          // Primary sort by combined score
          if (Math.abs(a.combinedScore - b.combinedScore) > 0.01) {
            return b.combinedScore - a.combinedScore;
          }

          // Secondary sort by quality
          if (prioritizeRecent) {
            // Prefer more recent results
            return (
              new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime()
            );
          }

          return b.qualityScore - a.qualityScore;
        })
        .slice(0, maxResults);

      return filteredResults;
    } catch (error) {
      console.error('Similarity search failed:', error);
      return [];
    }
  }

  /**
   * Get itinerary recommendations for a user
   */
  async getItineraryRecommendations(
    formData: any,
    userHistory: string[] = [],
    options: Partial<SimilaritySearchOptions> = {}
  ): Promise<RecommendationResult[]> {
    const searchOptions: SimilaritySearchOptions = {
      maxResults: SIMILARITY_CONFIG.RECOMMENDATION_LIMIT,
      similarityThreshold: SIMILARITY_CONFIG.MEDIUM_SIMILARITY_THRESHOLD,
      minQuality: SIMILARITY_CONFIG.MIN_CONFIDENCE_FOR_RECOMMENDATION,
      ...options,
    };

    const similarResults = await this.findSimilarItineraries(formData, searchOptions);

    // Convert to recommendations
    const recommendations: RecommendationResult[] = similarResults
      .filter(
        (result) => result.combinedScore >= SIMILARITY_CONFIG.MIN_CONFIDENCE_FOR_RECOMMENDATION
      )
      .map((result) => ({
        itinerary: result.data.itinerary,
        confidence: result.combinedScore,
        similarityScore: result.similarityScore,
        matchReasons: result.reasons,
        source: (result.metadata.itineraryType === 'cached' ? 'cache' : 'generated') as
          | 'cache'
          | 'generated',
        metadata: {
          destination: result.metadata.destination,
          budgetRange: result.metadata.budgetRange,
          travelStyle: result.metadata.travelStyle,
          duration: result.metadata.duration,
          createdAt: result.metadata.createdAt,
        },
      }))
      .slice(0, SIMILARITY_CONFIG.MAX_RECOMMENDATIONS_PER_QUERY);

    return recommendations;
  }

  /**
   * Check if an exact match exists
   */
  async hasExactMatch(formData: any): Promise<boolean> {
    const similar = await this.findSimilarItineraries(formData, {
      maxResults: 1,
      similarityThreshold: SIMILARITY_CONFIG.EXACT_MATCH_THRESHOLD,
    });

    return similar.length > 0;
  }

  /**
   * Find cached results for similar queries
   */
  async findCachedResults(formData: any, maxAgeHours: number = 24): Promise<SimilarityResult[]> {
    const cutoffDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

    const filter = createSearchFilter(
      undefined,
      formData?.location?.destination,
      this.extractBudgetRange(formData),
      formData?.travelStyle?.primary
    );

    // Add time filter
    filter[VECTOR_CONFIG.FILTER_KEYS.CREATED_AT] = {
      $gte: cutoffDate.toISOString(),
    };

    try {
      const queryText = this.formDataToText(formData);
      const queryEmbedding = await generateEmbedding(queryText);

      const results = await vectorClient.searchSimilar(queryEmbedding, {
        topK: SIMILARITY_CONFIG.CACHE_RESULTS_LIMIT,
        includeVectors: false,
        includeMetadata: true,
        filter,
        similarityThreshold: SIMILARITY_CONFIG.MEDIUM_SIMILARITY_THRESHOLD,
      });

      return await this.enhanceResultsWithScoring(results, formData, true);
    } catch (error) {
      console.error('Cached results search failed:', error);
      return [];
    }
  }

  /**
   * Get similarity statistics
   */
  async getSimilarityStats(): Promise<{
    totalDocuments: number;
    averageSimilarity: number;
    matchDistribution: Record<string, number>;
    qualityDistribution: Record<string, number>;
  }> {
    try {
      const stats = await vectorClient.getStats();

      // This is a simplified implementation
      // In production, you might want to query more detailed statistics
      return {
        totalDocuments: stats.totalVectors,
        averageSimilarity: 0.75, // Placeholder
        matchDistribution: {
          exact: 0,
          high: 0,
          medium: 0,
          low: 0,
          none: 0,
        },
        qualityDistribution: {
          high: 0,
          medium: 0,
          low: 0,
        },
      };
    } catch (error) {
      console.error('Failed to get similarity stats:', error);
      return {
        totalDocuments: 0,
        averageSimilarity: 0,
        matchDistribution: { exact: 0, high: 0, medium: 0, low: 0, none: 0 },
        qualityDistribution: { high: 0, medium: 0, low: 0 },
      };
    }
  }

  /**
   * Private helper methods
   */

  private async enhanceResultsWithScoring(
    searchResults: VectorSearchResult[],
    formData: any,
    includeReasons: boolean
  ): Promise<SimilarityResult[]> {
    return Promise.all(
      searchResults.map(async (result) => {
        const similarityScore = result.score;
        const metadataMatchScore = this.calculateMetadataMatchScore(result.metadata, formData);
        const qualityScore = result.metadata.quality || 0.5;

        const combinedScore = this.calculateCombinedScore(
          similarityScore,
          metadataMatchScore,
          qualityScore
        );

        const matchType = this.determineMatchType(combinedScore);
        const reasons = includeReasons ? this.generateMatchReasons(result, formData) : [];

        return {
          ...result,
          similarityScore,
          metadataMatchScore,
          qualityScore,
          combinedScore,
          matchType,
          reasons,
        };
      })
    );
  }

  private calculateMetadataMatchScore(metadata: VectorDocument['metadata'], formData: any): number {
    let score = 0;
    let totalFactors = 0;

    // Destination match
    if (metadata.destination && formData?.location?.destination) {
      totalFactors++;
      if (metadata.destination.toLowerCase() === formData.location.destination.toLowerCase()) {
        score += 1;
      } else if (
        metadata.destination.toLowerCase().includes(formData.location.destination.toLowerCase()) ||
        formData.location.destination.toLowerCase().includes(metadata.destination.toLowerCase())
      ) {
        score += 0.5;
      }
    }

    // Budget range match
    if (metadata.budgetRange && formData?.budget) {
      totalFactors++;
      const metadataBudget = parseInt(metadata.budgetRange) || 0;
      const formBudget = formData.budget.total || formData.budget.perPerson || 0;

      if (Math.abs(metadataBudget - formBudget) / Math.max(metadataBudget, formBudget) < 0.2) {
        score += 1;
      } else if (
        Math.abs(metadataBudget - formBudget) / Math.max(metadataBudget, formBudget) <
        0.5
      ) {
        score += 0.5;
      }
    }

    // Travel style match
    if (metadata.travelStyle && formData?.travelStyle?.primary) {
      totalFactors++;
      if (metadata.travelStyle === formData.travelStyle.primary) {
        score += 1;
      }
    }

    // Duration match
    if (metadata.duration && formData?.dates) {
      totalFactors++;
      const formDuration = this.calculateDuration(formData.dates);
      if (formDuration && Math.abs(metadata.duration - formDuration) <= 2) {
        score += 1;
      } else if (formDuration && Math.abs(metadata.duration - formDuration) <= 5) {
        score += 0.5;
      }
    }

    return totalFactors > 0 ? score / totalFactors : 0;
  }

  private calculateCombinedScore(
    similarityScore: number,
    metadataMatchScore: number,
    qualityScore: number
  ): number {
    return (
      similarityScore * SIMILARITY_CONFIG.WEIGHTS.VECTOR_SIMILARITY +
      metadataMatchScore * SIMILARITY_CONFIG.WEIGHTS.METADATA_MATCH +
      qualityScore * SIMILARITY_CONFIG.WEIGHTS.QUALITY_SCORE
    );
  }

  private determineMatchType(combinedScore: number): SimilarityResult['matchType'] {
    if (combinedScore >= SIMILARITY_CONFIG.EXACT_MATCH_THRESHOLD) return 'exact';
    if (combinedScore >= SIMILARITY_CONFIG.HIGH_SIMILARITY_THRESHOLD) return 'high';
    if (combinedScore >= SIMILARITY_CONFIG.MEDIUM_SIMILARITY_THRESHOLD) return 'medium';
    if (combinedScore >= SIMILARITY_CONFIG.LOW_SIMILARITY_THRESHOLD) return 'low';
    return 'none';
  }

  private generateMatchReasons(result: VectorSearchResult, formData: any): string[] {
    const reasons: string[] = [];

    // Destination match
    if (
      result.metadata.destination &&
      formData?.location?.destination &&
      result.metadata.destination.toLowerCase() === formData.location.destination.toLowerCase()
    ) {
      reasons.push(`Same destination: ${result.metadata.destination}`);
    }

    // Budget match
    if (result.metadata.budgetRange && formData?.budget) {
      const metadataBudget = parseInt(result.metadata.budgetRange) || 0;
      const formBudget = formData.budget.total || formData.budget.perPerson || 0;
      const difference =
        Math.abs(metadataBudget - formBudget) / Math.max(metadataBudget, formBudget);

      if (difference < 0.2) {
        reasons.push(`Similar budget range: $${metadataBudget}`);
      }
    }

    // Travel style match
    if (
      result.metadata.travelStyle &&
      formData?.travelStyle?.primary &&
      result.metadata.travelStyle === formData.travelStyle.primary
    ) {
      reasons.push(`Same travel style: ${result.metadata.travelStyle}`);
    }

    // Duration match
    if (result.metadata.duration && formData?.dates) {
      const formDuration = this.calculateDuration(formData.dates);
      if (formDuration && Math.abs(result.metadata.duration - formDuration) <= 2) {
        reasons.push(`Similar duration: ${result.metadata.duration} days`);
      }
    }

    // Quality indicator
    if (result.metadata.quality && result.metadata.quality > 0.8) {
      reasons.push('High quality itinerary');
    }

    // Recency
    const daysSinceCreation =
      (Date.now() - new Date(result.metadata.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 7) {
      reasons.push('Recently created');
    }

    return reasons;
  }

  private formDataToText(formData: any): string {
    const parts: string[] = [];

    if (formData?.location?.destination) {
      parts.push(`Destination: ${formData.location.destination}`);
    }

    if (formData?.dates) {
      const duration = this.calculateDuration(formData.dates);
      if (duration) {
        parts.push(`Duration: ${duration} days`);
      }
    }

    if (formData?.travelers) {
      const total = (formData.travelers.adults || 0) + (formData.travelers.children || 0);
      parts.push(`Travelers: ${total} people`);
    }

    if (formData?.budget) {
      const budget = formData.budget.total || formData.budget.perPerson;
      if (budget) {
        parts.push(`Budget: $${budget}`);
      }
    }

    if (formData?.travelStyle?.primary) {
      parts.push(`Travel style: ${formData.travelStyle.primary}`);
    }

    if (formData?.interests?.selected) {
      parts.push(`Interests: ${formData.interests.selected.join(', ')}`);
    }

    return parts.join('. ');
  }

  private extractBudgetRange(formData: any): string | undefined {
    if (!formData?.budget) return undefined;

    const budget = formData.budget.total || formData.budget.perPerson;
    if (!budget) return undefined;

    // Create budget ranges
    if (budget < 1000) return 'budget';
    if (budget < 3000) return 'moderate';
    if (budget < 5000) return 'comfortable';
    return 'luxury';
  }

  private calculateDuration(dates: any): number | undefined {
    if (!dates?.departDate || !dates?.returnDate) return undefined;

    try {
      const depart = new Date(dates.departDate);
      const returnDate = new Date(dates.returnDate);
      const diffTime = Math.abs(returnDate.getTime() - depart.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return undefined;
    }
  }
}

/**
 * Global similarity search engine instance
 */
export const similaritySearchEngine = new SimilaritySearchEngine();

/**
 * Convenience functions for common similarity operations
 */

/**
 * Quick similarity check
 */
export async function checkSimilarity(
  formData: any,
  threshold: number = SIMILARITY_CONFIG.MEDIUM_SIMILARITY_THRESHOLD
): Promise<boolean> {
  const results = await similaritySearchEngine.findSimilarItineraries(formData, {
    maxResults: 1,
    similarityThreshold: threshold,
  });

  return results.length > 0;
}

/**
 * Get top recommendations
 */
export async function getTopRecommendations(
  formData: any,
  limit: number = SIMILARITY_CONFIG.MAX_RECOMMENDATIONS_PER_QUERY
): Promise<RecommendationResult[]> {
  return similaritySearchEngine.getItineraryRecommendations(formData, [], {
    maxResults: limit,
  });
}

/**
 * Find exact matches
 */
export async function findExactMatches(formData: any): Promise<SimilarityResult[]> {
  return similaritySearchEngine.findSimilarItineraries(formData, {
    maxResults: 5,
    similarityThreshold: SIMILARITY_CONFIG.EXACT_MATCH_THRESHOLD,
  });
}

/**
 * Export types
 */

/**
 * Vector Storage Manager (T029)
 *
 * CONSTITUTIONAL COMPLIANCE:
 * - Principle I: Edge Runtime compatible (Upstash Vector via HTTP REST API)
 * - Principle V: Type-safe development with strict interfaces
 * - Principle IV: Code-Deploy-Debug with semantic search capabilities
 *
 * Manages vector embeddings for semantic search and itinerary caching
 */

import { Index } from '@upstash/vector';
import { config } from '../config/env';

// Initialize Upstash Vector client with Edge Runtime compatibility
const vectorIndex = new Index({
  url: config.vector.url,
  token: config.vector.token,
});

/**
 * Vector Record Interface
 * Constitutional requirement: Type-safe development
 */
export interface VectorRecord {
  id: string;
  vector: number[];
  metadata: {
    type: 'itinerary' | 'attraction' | 'restaurant' | 'experience';
    location: string;
    title: string;
    description: string;
    tags: string[];
    createdAt: string;
    score?: number;

    // Specific to itineraries
    budget?: number;
    duration?: number;
    travelers?: number;

    // Specific to POIs
    rating?: number;
    priceRange?: string;
    category?: string;
  };
}

/**
 * Search Query for Vector Similarity
 */
export interface VectorSearchQuery {
  vector?: number[];
  text?: string;
  filter?: {
    type?: 'itinerary' | 'attraction' | 'restaurant' | 'experience';
    location?: string;
    tags?: string[];
    budget?: { min?: number; max?: number };
    rating?: { min?: number };
  };
  topK?: number;
  includeMetadata?: boolean;
}

/**
 * Vector Storage Manager Class
 * Constitutional requirement: Edge Runtime compatible operations
 */
export class VectorStorageManager {
  private static readonly BATCH_SIZE = 100;

  /**
   * Store itinerary as vector for future similarity searches
   * This enables finding similar past itineraries for optimization
   */
  static async storeItinerary(
    itineraryId: string,
    content: {
      title: string;
      description: string;
      location: string;
      budget: number;
      duration: number;
      travelers: number;
      highlights: string[];
      tags: string[];
    }
  ): Promise<void> {
    try {
      // Generate embedding from itinerary content
      const textForEmbedding = [
        content.title,
        content.description,
        content.location,
        content.highlights.join(' '),
        content.tags.join(' '),
      ].join(' ');

      const embedding = await this.generateEmbedding(textForEmbedding);

      const vectorRecord: VectorRecord = {
        id: `itinerary:${itineraryId}`,
        vector: embedding,
        metadata: {
          type: 'itinerary',
          location: content.location,
          title: content.title,
          description: content.description,
          tags: content.tags,
          createdAt: new Date().toISOString(),
          budget: content.budget,
          duration: content.duration,
          travelers: content.travelers,
        },
      };

      await vectorIndex.upsert(vectorRecord);
      console.log(`✅ Stored itinerary vector: ${itineraryId}`);
    } catch (error) {
      console.error('Failed to store itinerary vector:', error);
      // Don't throw - vector storage is nice-to-have, not critical
    }
  }

  /**
   * Store attraction/restaurant/experience for semantic search
   */
  static async storePointOfInterest(
    poiId: string,
    content: {
      type: 'attraction' | 'restaurant' | 'experience';
      title: string;
      description: string;
      location: string;
      category?: string;
      tags: string[];
      rating?: number;
      priceRange?: string;
    }
  ): Promise<void> {
    try {
      const textForEmbedding = [
        content.title,
        content.description,
        content.location,
        content.category || '',
        content.tags.join(' '),
      ].join(' ');

      const embedding = await this.generateEmbedding(textForEmbedding);

      const vectorRecord: VectorRecord = {
        id: `poi:${content.type}:${poiId}`,
        vector: embedding,
        metadata: {
          type: content.type,
          location: content.location,
          title: content.title,
          description: content.description,
          tags: content.tags,
          createdAt: new Date().toISOString(),
          rating: content.rating,
          priceRange: content.priceRange,
          category: content.category,
        },
      };

      await vectorIndex.upsert(vectorRecord);
      console.log(`✅ Stored ${content.type} vector: ${poiId}`);
    } catch (error) {
      console.error(`Failed to store ${content.type} vector:`, error);
      // Don't throw - vector storage is nice-to-have
    }
  }

  /**
   * Find similar itineraries based on user preferences
   * Helps with recommendation and optimization
   */
  static async findSimilarItineraries(
    preferences: {
      location: string;
      budget?: number;
      duration?: number;
      travelers?: number;
      interests: string[];
    },
    topK: number = 5
  ): Promise<VectorRecord[]> {
    try {
      // Create search text from preferences
      const searchText = [
        preferences.location,
        preferences.interests.join(' '),
        `${preferences.duration || ''} days`,
        `${preferences.travelers || ''} people`,
        `budget ${preferences.budget || ''}`,
      ].join(' ');

      const searchEmbedding = await this.generateEmbedding(searchText);

      const results = await vectorIndex.query({
        vector: searchEmbedding,
        topK,
        includeMetadata: true,
        filter: {
          type: { $eq: 'itinerary' },
        },
      });

      return results.map((result) => ({
        id: result.id,
        vector: result.vector || [],
        metadata: result.metadata as VectorRecord['metadata'],
      }));
    } catch (error) {
      console.error('Failed to find similar itineraries:', error);
      return [];
    }
  }

  /**
   * Semantic search for attractions/restaurants based on user query
   */
  static async semanticSearch(
    query: string,
    location?: string,
    type?: 'attraction' | 'restaurant' | 'experience',
    topK: number = 10
  ): Promise<VectorRecord[]> {
    try {
      const searchEmbedding = await this.generateEmbedding(query);

      const filter: any = {};
      if (type) {
        filter.type = { $eq: type };
      }
      if (location) {
        filter.location = { $eq: location };
      }

      const results = await vectorIndex.query({
        vector: searchEmbedding,
        topK,
        includeMetadata: true,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
      });

      return results.map((result) => ({
        id: result.id,
        vector: result.vector || [],
        metadata: result.metadata as VectorRecord['metadata'],
      }));
    } catch (error) {
      console.error('Failed to perform semantic search:', error);
      return [];
    }
  }

  /**
   * Batch store multiple vectors for efficiency
   */
  static async batchStore(records: VectorRecord[]): Promise<void> {
    try {
      // Process in batches to avoid API limits
      for (let i = 0; i < records.length; i += this.BATCH_SIZE) {
        const batch = records.slice(i, i + this.BATCH_SIZE);
        await vectorIndex.upsert(batch);
        console.log(
          `✅ Stored batch ${Math.floor(i / this.BATCH_SIZE) + 1} (${batch.length} vectors)`
        );
      }
    } catch (error) {
      console.error('Failed to batch store vectors:', error);
      throw error;
    }
  }

  /**
   * Clean up old vectors to manage storage costs
   */
  static async cleanupOldVectors(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      const cutoffIso = cutoffDate.toISOString();

      // Query for old vectors
      const results = await vectorIndex.query({
        vector: new Array(config.vector.dimensions).fill(0), // Dummy vector
        topK: 1000, // Large number to get many results
        includeMetadata: true,
        filter: {
          createdAt: { $lt: cutoffIso },
        },
      });

      if (results.length === 0) {
        return 0;
      }

      // Delete old vectors
      const idsToDelete = results.map((r) => r.id);
      await vectorIndex.delete(idsToDelete);

      console.log(`🗑️ Cleaned up ${idsToDelete.length} old vectors`);
      return idsToDelete.length;
    } catch (error) {
      console.error('Failed to cleanup old vectors:', error);
      return 0;
    }
  }

  /**
   * Get vector storage statistics
   */
  static async getStorageStats(): Promise<{
    total: number;
    byType: Record<string, number>;
  }> {
    try {
      const stats = await vectorIndex.info();

      // Get counts by type (simplified - would need to query for exact counts)
      return {
        total: stats.vectorCount || 0,
        byType: {
          itinerary: Math.floor((stats.vectorCount || 0) * 0.1), // Estimated
          attraction: Math.floor((stats.vectorCount || 0) * 0.4),
          restaurant: Math.floor((stats.vectorCount || 0) * 0.4),
          experience: Math.floor((stats.vectorCount || 0) * 0.1),
        },
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        total: 0,
        byType: {
          itinerary: 0,
          attraction: 0,
          restaurant: 0,
          experience: 0,
        },
      };
    }
  }

  /**
   * Generate text embedding using OpenAI-compatible API
   * In production, this could use the actual OpenAI API or local model
   */
  private static async generateEmbedding(text: string): Promise<number[]> {
    try {
      // For now, generate a dummy embedding
      // In production, replace with actual embedding API call
      const dimension = config.vector.dimensions;
      const embedding = Array.from({ length: dimension }, () => Math.random() * 2 - 1);

      // Normalize the vector
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      return embedding.map((val) => val / magnitude);
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      // Return zero vector as fallback
      return new Array(config.vector.dimensions).fill(0);
    }
  }
}

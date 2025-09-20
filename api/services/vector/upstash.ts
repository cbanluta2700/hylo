import { Index } from '@upstash/vector';

// Vector metadata for travel-related content
interface TravelVectorMetadata {
  type: 'destination' | 'activity' | 'accommodation' | 'restaurant' | 'transport';
  location?: string;
  category?: string;
  price_range?: 'budget' | 'mid-range' | 'luxury';
  rating?: number;
  source_url?: string;
  last_updated?: string;
  relevance_score?: number;
}

interface VectorSearchResult {
  id: string;
  score: number;
  metadata: TravelVectorMetadata;
  content: string;
}

interface VectorUpsertData {
  id: string;
  vector: number[];
  metadata: TravelVectorMetadata;
  content: string;
}

/**
 * Upstash Vector Database Service for Travel Content Semantic Search
 * Handles vector storage, retrieval, and semantic search for travel-related information
 */
export class UpstashVectorService {
  private index: Index<TravelVectorMetadata>;
  private isInitialized = false;

  constructor() {
    // Initialize Upstash Vector client with environment credentials
    this.index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL!,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
    });
  }

  /**
   * Initialize the vector service and verify connection
   */
  async initialize(): Promise<void> {
    try {
      // Test connection with info query
      await this.index.info();
      this.isInitialized = true;
      console.log('Upstash Vector service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Upstash Vector service:', error);
      throw new Error(`Vector service initialization failed: ${error.message}`);
    }
  }

  /**
   * Check if service is ready for operations
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Upsert travel content vectors into the database
   * @param vectors Array of vector data to upsert
   * @returns Promise resolving to upsert result
   */
  async upsertVectors(vectors: VectorUpsertData[]): Promise<{ upserted: number }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const vectorsToUpsert = vectors.map(({ id, vector, metadata, content }) => ({
        id,
        vector,
        metadata: {
          ...metadata,
          content,
          last_updated: new Date().toISOString(),
        },
      }));

      const result = await this.index.upsert(vectorsToUpsert);
      
      console.log(`Successfully upserted ${vectors.length} vectors to Upstash`);
      return { upserted: vectors.length };
    } catch (error) {
      console.error('Error upserting vectors:', error);
      throw new Error(`Vector upsert failed: ${error.message}`);
    }
  }

  /**
   * Perform semantic search for travel content
   * @param queryVector Query embedding vector
   * @param topK Number of results to return (default: 10)
   * @param filter Optional metadata filter
   * @returns Promise resolving to search results
   */
  async searchSimilar(
    queryVector: number[],
    topK: number = 10,
    filter?: Partial<TravelVectorMetadata>
  ): Promise<VectorSearchResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const searchOptions: any = {
        vector: queryVector,
        topK,
        includeMetadata: true,
        includeVectors: false,
      };

      // Add filter if provided
      if (filter && Object.keys(filter).length > 0) {
        searchOptions.filter = this.buildMetadataFilter(filter);
      }

      const results = await this.index.query(searchOptions);

      return results.map((result: any) => ({
        id: result.id,
        score: result.score,
        metadata: result.metadata,
        content: result.metadata.content || '',
      }));
    } catch (error) {
      console.error('Error performing vector search:', error);
      throw new Error(`Vector search failed: ${error.message}`);
    }
  }

  /**
   * Search for travel content by location and type
   * @param queryVector Query embedding vector
   * @param location Target location filter
   * @param contentType Type of content to search for
   * @param topK Number of results to return
   * @returns Promise resolving to filtered search results
   */
  async searchByLocationAndType(
    queryVector: number[],
    location?: string,
    contentType?: TravelVectorMetadata['type'],
    topK: number = 10
  ): Promise<VectorSearchResult[]> {
    const filter: Partial<TravelVectorMetadata> = {};
    
    if (location) {
      filter.location = location;
    }
    
    if (contentType) {
      filter.type = contentType;
    }

    return this.searchSimilar(queryVector, topK, filter);
  }

  /**
   * Get vector by ID
   * @param id Vector ID to retrieve
   * @returns Promise resolving to vector data or null if not found
   */
  async getVectorById(id: string): Promise<VectorSearchResult | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = await this.index.fetch([id], { includeMetadata: true });
      
      if (result.length === 0) {
        return null;
      }

      const vector = result[0];
      return {
        id: vector.id,
        score: 1.0, // Perfect match for direct fetch
        metadata: vector.metadata,
        content: vector.metadata.content || '',
      };
    } catch (error) {
      console.error('Error fetching vector by ID:', error);
      throw new Error(`Vector fetch failed: ${error.message}`);
    }
  }

  /**
   * Delete vectors by IDs
   * @param ids Array of vector IDs to delete
   * @returns Promise resolving to deletion result
   */
  async deleteVectors(ids: string[]): Promise<{ deleted: number }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await this.index.delete(ids);
      
      console.log(`Successfully deleted ${ids.length} vectors from Upstash`);
      return { deleted: ids.length };
    } catch (error) {
      console.error('Error deleting vectors:', error);
      throw new Error(`Vector deletion failed: ${error.message}`);
    }
  }

  /**
   * Get database statistics
   * @returns Promise resolving to database info
   */
  async getDatabaseInfo(): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      return await this.index.info();
    } catch (error) {
      console.error('Error getting database info:', error);
      throw new Error(`Database info retrieval failed: ${error.message}`);
    }
  }

  /**
   * Reset/clear the entire vector database (use with caution)
   * @returns Promise resolving to reset result
   */
  async resetDatabase(): Promise<{ reset: boolean }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await this.index.reset();
      
      console.log('Vector database reset successfully');
      return { reset: true };
    } catch (error) {
      console.error('Error resetting database:', error);
      throw new Error(`Database reset failed: ${error.message}`);
    }
  }

  /**
   * Build metadata filter for search queries
   * @param filter Partial metadata filter object
   * @returns Formatted filter string for Upstash
   */
  private buildMetadataFilter(filter: Partial<TravelVectorMetadata>): string {
    const conditions: string[] = [];

    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'string') {
          conditions.push(`${key} = '${value}'`);
        } else if (typeof value === 'number') {
          conditions.push(`${key} = ${value}`);
        }
      }
    });

    return conditions.join(' AND ');
  }
}

// Singleton instance for service-wide usage
export const upstashVectorService = new UpstashVectorService();

// Export types for use in other modules
export type {
  TravelVectorMetadata,
  VectorSearchResult,
  VectorUpsertData,
};
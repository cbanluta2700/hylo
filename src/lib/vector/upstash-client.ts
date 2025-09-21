/**
 * Upstash Vector Database Client
 * High-performance vector storage and retrieval for AI-powered travel planning
 */

import { Index, QueryResult } from '@upstash/vector';
import { config } from '../env';
import { generateId } from '../smart-queries';

/**
 * Vector configuration constants
 */
export const VECTOR_CONFIG = {
  // Index settings
  INDEX_NAME: 'hylo-itineraries',
  VECTOR_DIMENSION: 1536, // OpenAI text-embedding-ada-002 dimension
  METRIC: 'cosine' as const,

  // Query settings
  DEFAULT_TOP_K: 5,
  MAX_TOP_K: 20,
  SIMILARITY_THRESHOLD: 0.7,

  // Batch operations
  BATCH_SIZE: 100,
  MAX_BATCH_SIZE: 500,

  // TTL settings (in seconds)
  DEFAULT_TTL: 7 * 24 * 60 * 60, // 7 days
  CACHE_TTL: 24 * 60 * 60, // 24 hours

  // Metadata filters
  FILTER_KEYS: {
    SESSION_ID: 'sessionId',
    WORKFLOW_ID: 'workflowId',
    USER_ID: 'userId',
    CREATED_AT: 'createdAt',
    ITINERARY_TYPE: 'itineraryType',
    DESTINATION: 'destination',
    BUDGET_RANGE: 'budgetRange',
    TRAVEL_STYLE: 'travelStyle',
    DURATION: 'duration',
  } as const,

  // Performance settings
  QUERY_TIMEOUT: 5000, // 5 seconds
  CONNECTION_POOL_SIZE: 10,
} as const;

/**
 * Vector document interface
 */
export interface VectorDocument {
  id: string;
  vector: number[];
  metadata: {
    sessionId: string;
    workflowId?: string;
    userId?: string;
    createdAt: string;
    itineraryType: 'generated' | 'cached' | 'template';
    destination?: string;
    budgetRange?: string;
    travelStyle?: string;
    duration?: number;
    tags?: string[];
    quality?: number;
    version?: string;
  };
  data: {
    itinerary: any;
    formData?: any;
    confidence?: number;
    processingTime?: number;
  };
}

/**
 * Query options interface
 */
export interface VectorQueryOptions {
  topK?: number;
  includeVectors?: boolean;
  includeMetadata?: boolean;
  filter?: Record<string, any>;
  similarityThreshold?: number;
  timeout?: number;
}

/**
 * Search result interface
 */
export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: VectorDocument['metadata'];
  data: VectorDocument['data'];
  vector?: number[];
}

/**
 * Batch operation result
 */
export interface BatchOperationResult {
  successful: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
  duration: number;
}

/**
 * Upstash Vector Client
 * Client for managing vector operations with Upstash Vector
 */
export class UpstashVectorClient {
  private index: Index;
  private initialized: boolean = false;

  constructor() {
    this.index = new Index({
      url: config.upstash.vector.url,
      token: config.upstash.vector.token,
      cache: 'no-cache', // Disable caching for real-time operations
    });
  }

  /**
   * Initialize the vector index
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if index exists, create if not
      const indexInfo = await this.index.info();

      if (!indexInfo) {
        await this.createIndex();
      }

      this.initialized = true;
      console.log(`Vector index '${VECTOR_CONFIG.INDEX_NAME}' initialized successfully`);
    } catch (error) {
      console.error('Failed to initialize vector index:', error);
      throw new Error(
        `Vector initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create the vector index
   */
  private async createIndex(): Promise<void> {
    try {
      await this.index.upsert([
        {
          id: 'init',
          vector: new Array(VECTOR_CONFIG.VECTOR_DIMENSION).fill(0),
          metadata: {
            type: 'initialization',
            createdAt: new Date().toISOString(),
          },
        },
      ]);

      // Remove the initialization vector
      await this.index.delete(['init']);

      console.log(`Vector index '${VECTOR_CONFIG.INDEX_NAME}' created successfully`);
    } catch (error) {
      console.error('Failed to create vector index:', error);
      throw error;
    }
  }

  /**
   * Store a vector document
   */
  async storeDocument(document: Omit<VectorDocument, 'id'>): Promise<string> {
    await this.ensureInitialized();

    const docId = generateId();
    const fullDocument: VectorDocument = {
      id: docId,
      ...document,
    };

    try {
      await this.index.upsert([this.documentToVectorFormat(fullDocument)]);
      console.log(`Stored vector document: ${docId}`);
      return docId;
    } catch (error) {
      console.error(`Failed to store document ${docId}:`, error);
      throw new Error(
        `Document storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Store multiple vector documents in batch
   */
  async storeDocuments(
    documents: Array<Omit<VectorDocument, 'id'>>
  ): Promise<BatchOperationResult> {
    await this.ensureInitialized();

    const startTime = Date.now();
    const results: BatchOperationResult = {
      successful: 0,
      failed: 0,
      errors: [],
      duration: 0,
    };

    // Process in batches to avoid payload size limits
    for (let i = 0; i < documents.length; i += VECTOR_CONFIG.BATCH_SIZE) {
      const batch = documents.slice(i, i + VECTOR_CONFIG.BATCH_SIZE);
      const batchDocuments = batch.map((doc) => {
        const docId = generateId();
        return {
          id: docId,
          ...doc,
        } as VectorDocument;
      });

      try {
        const vectors = batchDocuments.map((doc) => this.documentToVectorFormat(doc));
        await this.index.upsert(vectors);

        results.successful += batchDocuments.length;
        console.log(`Stored batch of ${batchDocuments.length} vector documents`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.failed += batch.length;
        results.errors.push(
          ...batchDocuments.map((doc) => ({
            id: doc.id,
            error: errorMessage,
          }))
        );

        console.error(`Failed to store batch:`, error);
      }
    }

    results.duration = Date.now() - startTime;
    return results;
  }

  /**
   * Search for similar vectors
   */
  async searchSimilar(
    queryVector: number[],
    options: VectorQueryOptions = {}
  ): Promise<VectorSearchResult[]> {
    await this.ensureInitialized();

    const {
      topK = VECTOR_CONFIG.DEFAULT_TOP_K,
      includeVectors = false,
      includeMetadata = true,
      filter,
      similarityThreshold = VECTOR_CONFIG.SIMILARITY_THRESHOLD,
      timeout = VECTOR_CONFIG.QUERY_TIMEOUT,
    } = options;

    try {
      const queryOptions: any = {
        topK: Math.min(topK, VECTOR_CONFIG.MAX_TOP_K),
        includeVectors,
        includeMetadata,
        timeout,
      };

      if (filter) {
        queryOptions.filter = filter;
      }

      const results = await this.index.query({
        vector: queryVector,
        ...queryOptions,
      });

      // Filter by similarity threshold and convert results
      return results
        .filter((result) => result.score >= similarityThreshold)
        .map((result) => this.queryResultToSearchResult(result));
    } catch (error) {
      console.error('Vector search failed:', error);
      throw new Error(
        `Vector search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Search by metadata filters
   */
  async searchByMetadata(
    filter: Record<string, any>,
    options: Omit<VectorQueryOptions, 'filter'> = {}
  ): Promise<VectorSearchResult[]> {
    await this.ensureInitialized();

    const {
      topK = VECTOR_CONFIG.DEFAULT_TOP_K,
      includeVectors = false,
      includeMetadata = true,
      timeout = VECTOR_CONFIG.QUERY_TIMEOUT,
    } = options;

    try {
      // Use a dummy vector for metadata-only search
      const dummyVector = new Array(VECTOR_CONFIG.VECTOR_DIMENSION).fill(0);

      const results = await this.index.query({
        vector: dummyVector,
        topK: Math.min(topK, VECTOR_CONFIG.MAX_TOP_K),
        includeVectors,
        includeMetadata,
        filter,
        timeout,
      });

      return results.map((result) => this.queryResultToSearchResult(result));
    } catch (error) {
      console.error('Metadata search failed:', error);
      throw new Error(
        `Metadata search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(id: string): Promise<VectorDocument | null> {
    await this.ensureInitialized();

    try {
      const result = await this.index.fetch([id]);
      if (result.length === 0 || !result[0]) {
        return null;
      }

      return this.vectorFormatToDocument(result[0]);
    } catch (error) {
      console.error(`Failed to get document ${id}:`, error);
      return null;
    }
  }

  /**
   * Get multiple documents by IDs
   */
  async getDocuments(ids: string[]): Promise<VectorDocument[]> {
    await this.ensureInitialized();

    try {
      const results = await this.index.fetch(ids);
      return results
        .filter((result) => result !== null)
        .map((result) => this.vectorFormatToDocument(result!));
    } catch (error) {
      console.error(`Failed to get documents:`, error);
      return [];
    }
  }

  /**
   * Update a document
   */
  async updateDocument(id: string, updates: Partial<VectorDocument>): Promise<boolean> {
    await this.ensureInitialized();

    try {
      // Get existing document
      const existing = await this.getDocument(id);
      if (!existing) {
        return false;
      }

      // Merge updates
      const updated: VectorDocument = {
        ...existing,
        ...updates,
        metadata: {
          ...existing.metadata,
          ...updates.metadata,
        },
        data: {
          ...existing.data,
          ...updates.data,
        },
      };

      await this.index.upsert([this.documentToVectorFormat(updated)]);
      console.log(`Updated vector document: ${id}`);
      return true;
    } catch (error) {
      console.error(`Failed to update document ${id}:`, error);
      return false;
    }
  }

  /**
   * Delete documents by IDs
   */
  async deleteDocuments(ids: string[]): Promise<BatchOperationResult> {
    await this.ensureInitialized();

    const startTime = Date.now();
    const results: BatchOperationResult = {
      successful: 0,
      failed: 0,
      errors: [],
      duration: 0,
    };

    try {
      await this.index.delete(ids);
      results.successful = ids.length;
      console.log(`Deleted ${ids.length} vector documents`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.failed = ids.length;
      results.errors = ids.map((id) => ({ id, error: errorMessage }));
      console.error('Failed to delete documents:', error);
    }

    results.duration = Date.now() - startTime;
    return results;
  }

  /**
   * Get index statistics
   */
  async getStats(): Promise<{
    totalVectors: number;
    dimension: number;
    metric: string;
    lastUpdated?: string;
  }> {
    await this.ensureInitialized();

    try {
      const info = await this.index.info();
      return {
        totalVectors: info?.vectorCount || 0,
        dimension: VECTOR_CONFIG.VECTOR_DIMENSION,
        metric: VECTOR_CONFIG.METRIC,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get index stats:', error);
      return {
        totalVectors: 0,
        dimension: VECTOR_CONFIG.VECTOR_DIMENSION,
        metric: VECTOR_CONFIG.METRIC,
      };
    }
  }

  /**
   * Clear all vectors (dangerous operation)
   */
  async clearIndex(): Promise<boolean> {
    await this.ensureInitialized();

    try {
      // Get all vector IDs (this is a simplified approach)
      // In production, you might want to use a more efficient method
      const dummyVector = new Array(VECTOR_CONFIG.VECTOR_DIMENSION).fill(0);
      const allResults = await this.index.query({
        vector: dummyVector,
        topK: 10000, // Large number to get most vectors
        includeMetadata: false,
        includeVectors: false,
      });

      if (allResults.length > 0) {
        const ids = allResults.map((result) => result.id);
        await this.index.delete(ids);
      }

      console.log('Vector index cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear index:', error);
      return false;
    }
  }

  /**
   * Health check for the vector service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency?: number;
    error?: string;
    stats?: any;
  }> {
    const startTime = Date.now();

    try {
      const stats = await this.getStats();
      const latency = Date.now() - startTime;

      return {
        status: 'healthy',
        latency,
        stats,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Private helper methods
   */

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private documentToVectorFormat(doc: VectorDocument): any {
    return {
      id: doc.id,
      vector: doc.vector,
      metadata: {
        ...doc.metadata,
        // Ensure metadata is serializable
        createdAt: doc.metadata.createdAt,
        tags: doc.metadata.tags || [],
      },
      data: doc.data,
    };
  }

  private vectorFormatToDocument(vectorFormat: any): VectorDocument {
    return {
      id: vectorFormat.id,
      vector: vectorFormat.vector,
      metadata: {
        ...vectorFormat.metadata,
        tags: vectorFormat.metadata.tags || [],
      },
      data: vectorFormat.data || {},
    };
  }

  private queryResultToSearchResult(result: QueryResult): VectorSearchResult {
    return {
      id: result.id,
      score: result.score,
      metadata: result.metadata as VectorDocument['metadata'],
      data: (result as any).data || {},
      vector: result.vector,
    };
  }
}

/**
 * Global vector client instance
 */
export const vectorClient = new UpstashVectorClient();

/**
 * Utility functions for vector operations
 */

/**
 * Create a vector document from itinerary data
 */
export function createItineraryDocument(
  itinerary: any,
  formData: any,
  embedding: number[],
  metadata: Partial<VectorDocument['metadata']> = {}
): Omit<VectorDocument, 'id'> {
  return {
    vector: embedding,
    metadata: {
      sessionId: metadata.sessionId || 'unknown',
      workflowId: metadata.workflowId,
      userId: metadata.userId,
      createdAt: new Date().toISOString(),
      itineraryType: metadata.itineraryType || 'generated',
      destination: formData?.location?.destination,
      budgetRange: formData?.budget?.total ? `${formData.budget.total}` : undefined,
      travelStyle: formData?.travelStyle?.primary,
      duration: formData?.dates ? calculateDuration(formData.dates) : undefined,
      tags: metadata.tags || [],
      quality: metadata.quality || 0.8,
      version: metadata.version || '1.0.0',
    },
    data: {
      itinerary,
      formData,
      confidence: metadata.quality || 0.8,
      processingTime: metadata.processingTime,
    },
  };
}

/**
 * Calculate trip duration in days
 */
function calculateDuration(dates: any): number | undefined {
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

/**
 * Create filter for similarity search
 */
export function createSearchFilter(
  sessionId?: string,
  destination?: string,
  budgetRange?: string,
  travelStyle?: string,
  minQuality?: number
): Record<string, any> {
  const filter: Record<string, any> = {};

  if (sessionId) {
    filter[VECTOR_CONFIG.FILTER_KEYS.SESSION_ID] = sessionId;
  }

  if (destination) {
    filter[VECTOR_CONFIG.FILTER_KEYS.DESTINATION] = destination;
  }

  if (budgetRange) {
    filter[VECTOR_CONFIG.FILTER_KEYS.BUDGET_RANGE] = budgetRange;
  }

  if (travelStyle) {
    filter[VECTOR_CONFIG.FILTER_KEYS.TRAVEL_STYLE] = travelStyle;
  }

  if (minQuality !== undefined) {
    filter.quality = { $gte: minQuality };
  }

  return filter;
}

/**
 * Export types
 */
export type { VectorDocument, VectorQueryOptions, VectorSearchResult, BatchOperationResult };

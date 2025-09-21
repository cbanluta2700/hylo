/**
 * Embedding Generation for Travel Itineraries
 * OpenAI text-embedding-ada-002 integration for vectorizing travel data
 */

import OpenAI from 'openai';
import { config } from '../env';

/**
 * Embedding configuration constants
 */
export const EMBEDDING_CONFIG = {
  // OpenAI settings
  MODEL: 'text-embedding-ada-002',
  DIMENSION: 1536,
  MAX_TOKENS: 8191, // Maximum tokens per request
  BATCH_SIZE: 100, // Maximum texts per request

  // Processing settings
  CHUNK_SIZE: 1000, // Characters per chunk for long texts
  OVERLAP_SIZE: 200, // Characters of overlap between chunks
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second

  // Caching settings
  CACHE_TTL: 24 * 60 * 60, // 24 hours
  CACHE_KEY_PREFIX: 'embedding:',

  // Rate limiting
  REQUESTS_PER_MINUTE: 3000, // OpenAI tier limits
  CONCURRENT_REQUESTS: 10,

  // Quality settings
  MIN_TEXT_LENGTH: 10,
  MAX_TEXT_LENGTH: 10000,
} as const;

/**
 * Embedding result interface
 */
export interface EmbeddingResult {
  embedding: number[];
  text: string;
  tokens: number;
  model: string;
  createdAt: string;
  processingTime: number;
}

/**
 * Batch embedding result interface
 */
export interface BatchEmbeddingResult {
  results: EmbeddingResult[];
  totalTokens: number;
  totalProcessingTime: number;
  successful: number;
  failed: number;
  errors: Array<{ text: string; error: string }>;
}

/**
 * Embedding cache entry interface
 */
export interface EmbeddingCacheEntry {
  embedding: number[];
  text: string;
  hash: string;
  createdAt: string;
  model: string;
  tokens: number;
}

/**
 * Embedding Generator
 * Handles text embedding generation using OpenAI's API
 */
export class EmbeddingGenerator {
  private openai: OpenAI;
  private requestQueue: Array<() => Promise<any>> = [];
  private processing: boolean = false;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
      maxRetries: EMBEDDING_CONFIG.MAX_RETRIES,
    });
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    const startTime = Date.now();

    // Validate input
    this.validateText(text);

    // Check cache first
    const cached = await this.getCachedEmbedding(text);
    if (cached) {
      return {
        embedding: cached.embedding,
        text: cached.text,
        tokens: cached.tokens,
        model: cached.model,
        createdAt: cached.createdAt,
        processingTime: Date.now() - startTime,
      };
    }

    try {
      // Clean and prepare text
      const cleanText = this.cleanText(text);

      // Generate embedding
      const response = await this.openai.embeddings.create({
        model: EMBEDDING_CONFIG.MODEL,
        input: cleanText,
        encoding_format: 'float',
      });

      const result: EmbeddingResult = {
        embedding: response.data[0].embedding,
        text: cleanText,
        tokens: response.usage?.total_tokens || 0,
        model: EMBEDDING_CONFIG.MODEL,
        createdAt: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      };

      // Cache the result
      await this.cacheEmbedding(result);

      return result;
    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw new Error(
        `Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateEmbeddings(texts: string[]): Promise<BatchEmbeddingResult> {
    const startTime = Date.now();
    const results: EmbeddingResult[] = [];
    const errors: Array<{ text: string; error: string }> = [];

    // Validate all texts
    const validTexts = texts.filter((text) => {
      try {
        this.validateText(text);
        return true;
      } catch (error) {
        errors.push({
          text,
          error: error instanceof Error ? error.message : 'Validation failed',
        });
        return false;
      }
    });

    if (validTexts.length === 0) {
      return {
        results: [],
        totalTokens: 0,
        totalProcessingTime: Date.now() - startTime,
        successful: 0,
        failed: errors.length,
        errors,
      };
    }

    // Process in batches
    for (let i = 0; i < validTexts.length; i += EMBEDDING_CONFIG.BATCH_SIZE) {
      const batch = validTexts.slice(i, i + EMBEDDING_CONFIG.BATCH_SIZE);
      const batchResults = await this.processBatch(batch);

      results.push(...batchResults.results);
      errors.push(...batchResults.errors);
    }

    return {
      results,
      totalTokens: results.reduce((sum, r) => sum + r.tokens, 0),
      totalProcessingTime: Date.now() - startTime,
      successful: results.length,
      failed: errors.length,
      errors,
    };
  }

  /**
   * Generate embedding for travel form data
   */
  async generateFormDataEmbedding(formData: any): Promise<EmbeddingResult> {
    const textRepresentation = this.formDataToText(formData);
    return this.generateEmbedding(textRepresentation);
  }

  /**
   * Generate embedding for itinerary data
   */
  async generateItineraryEmbedding(itinerary: any): Promise<EmbeddingResult> {
    const textRepresentation = this.itineraryToText(itinerary);
    return this.generateEmbedding(textRepresentation);
  }

  /**
   * Compare two texts using their embeddings (cosine similarity)
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  /**
   * Get embedding statistics
   */
  async getEmbeddingStats(): Promise<{
    totalEmbeddings: number;
    cacheHitRate: number;
    averageProcessingTime: number;
    totalTokensUsed: number;
    model: string;
  }> {
    // This would typically query a database or cache for statistics
    // For now, return placeholder values
    return {
      totalEmbeddings: 0, // Would be tracked in production
      cacheHitRate: 0, // Would be calculated from cache hits/misses
      averageProcessingTime: 0, // Would be averaged from actual timings
      totalTokensUsed: 0, // Would be accumulated from API usage
      model: EMBEDDING_CONFIG.MODEL,
    };
  }

  /**
   * Health check for embedding service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency?: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // Simple health check with a short text
      await this.generateEmbedding('test');
      const latency = Date.now() - startTime;

      return {
        status: 'healthy',
        latency,
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

  private async processBatch(texts: string[]): Promise<BatchEmbeddingResult> {
    const startTime = Date.now();
    const results: EmbeddingResult[] = [];
    const errors: Array<{ text: string; error: string }> = [];

    try {
      // Clean texts
      const cleanTexts = texts.map((text) => this.cleanText(text));

      // Check cache for each text
      const uncachedTexts: string[] = [];
      const cachedResults: EmbeddingResult[] = [];

      for (const text of cleanTexts) {
        const cached = await this.getCachedEmbedding(text);
        if (cached) {
          cachedResults.push({
            embedding: cached.embedding,
            text: cached.text,
            tokens: cached.tokens,
            model: cached.model,
            createdAt: cached.createdAt,
            processingTime: 0, // Cached, so no processing time
          });
        } else {
          uncachedTexts.push(text);
        }
      }

      // Generate embeddings for uncached texts
      if (uncachedTexts.length > 0) {
        const response = await this.openai.embeddings.create({
          model: EMBEDDING_CONFIG.MODEL,
          input: uncachedTexts,
          encoding_format: 'float',
        });

        // Process results
        for (let i = 0; i < uncachedTexts.length; i++) {
          const text = uncachedTexts[i];
          const embedding = response.data[i]?.embedding;

          if (embedding) {
            const result: EmbeddingResult = {
              embedding,
              text,
              tokens: Math.ceil(text.length / 4), // Rough token estimation
              model: EMBEDDING_CONFIG.MODEL,
              createdAt: new Date().toISOString(),
              processingTime: Date.now() - startTime,
            };

            results.push(result);
            await this.cacheEmbedding(result);
          } else {
            errors.push({
              text,
              error: 'No embedding returned from API',
            });
          }
        }
      }

      // Combine cached and new results
      const allResults = [...cachedResults, ...results];

      return {
        results: allResults,
        totalTokens: allResults.reduce((sum, r) => sum + r.tokens, 0),
        totalProcessingTime: Date.now() - startTime,
        successful: allResults.length,
        failed: errors.length,
        errors,
      };
    } catch (error) {
      // If batch fails, mark all texts as failed
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const batchErrors = texts.map((text) => ({
        text,
        error: errorMessage,
      }));

      return {
        results: [],
        totalTokens: 0,
        totalProcessingTime: Date.now() - startTime,
        successful: 0,
        failed: batchErrors.length,
        errors: batchErrors,
      };
    }
  }

  private validateText(text: string): void {
    if (!text || typeof text !== 'string') {
      throw new Error('Text must be a non-empty string');
    }

    if (text.length < EMBEDDING_CONFIG.MIN_TEXT_LENGTH) {
      throw new Error(`Text must be at least ${EMBEDDING_CONFIG.MIN_TEXT_LENGTH} characters long`);
    }

    if (text.length > EMBEDDING_CONFIG.MAX_TEXT_LENGTH) {
      throw new Error(`Text must be at most ${EMBEDDING_CONFIG.MAX_TEXT_LENGTH} characters long`);
    }
  }

  private cleanText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?-]/g, '') // Remove special characters except basic punctuation
      .substring(0, EMBEDDING_CONFIG.MAX_TEXT_LENGTH);
  }

  private formDataToText(formData: any): string {
    const parts: string[] = [];

    // Location
    if (formData?.location?.destination) {
      parts.push(`Destination: ${formData.location.destination}`);
    }

    // Dates
    if (formData?.dates) {
      const duration = this.calculateDuration(formData.dates);
      if (duration) {
        parts.push(`Trip duration: ${duration} days`);
      }
    }

    // Travelers
    if (formData?.travelers) {
      const total = (formData.travelers.adults || 0) + (formData.travelers.children || 0);
      parts.push(`Travelers: ${total} people`);
    }

    // Budget
    if (formData?.budget) {
      const budget = formData.budget.total || formData.budget.perPerson;
      if (budget) {
        parts.push(`Budget: $${budget}`);
      }
    }

    // Travel style
    if (formData?.travelStyle?.primary) {
      parts.push(`Travel style: ${formData.travelStyle.primary}`);
    }

    // Interests
    if (formData?.interests?.selected) {
      parts.push(`Interests: ${formData.interests.selected.join(', ')}`);
    }

    // Accommodations
    if (formData?.accommodations?.preferences) {
      parts.push(`Accommodation preferences: ${formData.accommodations.preferences.join(', ')}`);
    }

    // Dining
    if (formData?.dining?.preferences) {
      parts.push(`Dining preferences: ${formData.dining.preferences.join(', ')}`);
    }

    return parts.join('. ');
  }

  private itineraryToText(itinerary: any): string {
    const parts: string[] = [];

    // Basic info
    if (itinerary?.title) {
      parts.push(`Itinerary: ${itinerary.title}`);
    }

    // Duration
    if (itinerary?.duration) {
      parts.push(`Duration: ${itinerary.duration} days`);
    }

    // Destination
    if (itinerary?.destination) {
      parts.push(`Destination: ${itinerary.destination}`);
    }

    // Activities and highlights
    if (itinerary?.highlights) {
      parts.push(`Highlights: ${itinerary.highlights.join(', ')}`);
    }

    // Accommodations
    if (itinerary?.accommodations) {
      const accText = itinerary.accommodations
        .map((acc: any) => `${acc.name} in ${acc.location}`)
        .join(', ');
      parts.push(`Accommodations: ${accText}`);
    }

    // Daily activities
    if (itinerary?.days) {
      const activities = itinerary.days.flatMap(
        (day: any) => day.activities?.map((act: any) => act.name) || []
      );
      if (activities.length > 0) {
        parts.push(`Activities: ${activities.slice(0, 10).join(', ')}`);
      }
    }

    return parts.join('. ');
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

  private async getCachedEmbedding(text: string): Promise<EmbeddingCacheEntry | null> {
    // This would typically check a cache (Redis, etc.)
    // For now, return null to always generate fresh embeddings
    return null;
  }

  private async cacheEmbedding(result: EmbeddingResult): Promise<void> {
    // This would typically store in cache (Redis, etc.)
    // For now, just log that we would cache
    console.log(`Would cache embedding for text: ${result.text.substring(0, 50)}...`);
  }
}

/**
 * Global embedding generator instance
 */
export const embeddingGenerator = new EmbeddingGenerator();

/**
 * Convenience functions for common embedding operations
 */

/**
 * Generate embedding for text
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  return embeddingGenerator.generateEmbedding(text);
}

/**
 * Generate embeddings for multiple texts
 */
export async function generateEmbeddings(texts: string[]): Promise<BatchEmbeddingResult> {
  return embeddingGenerator.generateEmbeddings(texts);
}

/**
 * Generate embedding for form data
 */
export async function generateFormDataEmbedding(formData: any): Promise<EmbeddingResult> {
  return embeddingGenerator.generateFormDataEmbedding(formData);
}

/**
 * Generate embedding for itinerary
 */
export async function generateItineraryEmbedding(itinerary: any): Promise<EmbeddingResult> {
  return embeddingGenerator.generateItineraryEmbedding(itinerary);
}

/**
 * Calculate similarity between two embeddings
 */
export function calculateSimilarity(embedding1: number[], embedding2: number[]): number {
  return embeddingGenerator.calculateSimilarity(embedding1, embedding2);
}

/**
 * Export types
 */
export type { EmbeddingResult, BatchEmbeddingResult, EmbeddingCacheEntry };

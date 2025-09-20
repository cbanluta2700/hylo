import { TravelVectorMetadata } from '../vector/upstash';

// Jina AI API configuration
const JINA_API_BASE = 'https://api.jina.ai';
const JINA_API_VERSION = 'v1';

// Embedding models available in Jina AI
export enum JinaEmbeddingModel {
  JINA_EMBEDDINGS_V3 = 'jina-embeddings-v3',
  JINA_EMBEDDINGS_V4 = 'jina-embeddings-v4',
  JINA_CLIP_V2 = 'jina-clip-v2',
}

// Embedding tasks for optimization
export enum EmbeddingTask {
  RETRIEVAL_QUERY = 'retrieval.query',
  RETRIEVAL_PASSAGE = 'retrieval.passage',
  TEXT_MATCHING = 'text-matching',
  CLASSIFICATION = 'classification',
  CODE_QUERY = 'code.query',
  CODE_PASSAGE = 'code.passage',
}

// Embedding format options
export enum EmbeddingType {
  FLOAT = 'float',
  BASE64 = 'base64',
  BINARY = 'binary',
  UBINARY = 'ubinary',
}

interface JinaEmbeddingRequest {
  model: JinaEmbeddingModel;
  input: string[];
  embedding_type?: EmbeddingType;
  task?: EmbeddingTask;
  dimensions?: number;
  normalized?: boolean;
  late_chunking?: boolean;
  truncate?: boolean;
}

interface JinaEmbeddingResponse {
  data: Array<{
    embedding: number[];
  }>;
  usage: {
    total_tokens: number;
  };
}

interface EmbeddingResult {
  embedding: number[];
  tokens_used: number;
  model: JinaEmbeddingModel;
  task?: EmbeddingTask;
}

interface BatchEmbeddingResult {
  embeddings: number[][];
  total_tokens: number;
  model: JinaEmbeddingModel;
  task?: EmbeddingTask;
}

/**
 * Jina AI Embeddings Service for Travel Content
 * Provides text-to-vector conversion using Jina AI's state-of-the-art embedding models
 */
export class JinaEmbeddingsService {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: JinaEmbeddingModel;
  private isInitialized = false;

  constructor() {
    this.apiKey = process.env.JINA_API_KEY!;
    this.baseUrl = `${JINA_API_BASE}/${JINA_API_VERSION}`;
    this.defaultModel = JinaEmbeddingModel.JINA_EMBEDDINGS_V4; // Latest model
  }

  /**
   * Initialize the service and validate API key
   */
  async initialize(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('JINA_API_KEY environment variable is required');
    }

    try {
      // Test API key with a simple embedding request
      await this.embedText('test', {
        model: JinaEmbeddingModel.JINA_EMBEDDINGS_V3,
        dimensions: 100, // Small dimension for testing
      });
      
      this.isInitialized = true;
      console.log('Jina Embeddings service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Jina Embeddings service:', error);
      throw new Error(`Embeddings service initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if service is ready for operations
   */
  isReady(): boolean {
    return this.isInitialized && !!this.apiKey;
  }

  /**
   * Generate embedding for a single text input
   * @param text Text to embed
   * @param options Embedding options
   * @returns Promise resolving to embedding result
   */
  async embedText(
    text: string,
    options: {
      model?: JinaEmbeddingModel;
      task?: EmbeddingTask;
      dimensions?: number;
      normalized?: boolean;
    } = {}
  ): Promise<EmbeddingResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const model = options.model || this.defaultModel;
    const task = options.task || EmbeddingTask.RETRIEVAL_PASSAGE;

    try {
      const requestBody: JinaEmbeddingRequest = {
        model,
        input: [text],
        embedding_type: EmbeddingType.FLOAT,
        task,
        truncate: true,
        ...(options.dimensions && { dimensions: options.dimensions }),
        ...(options.normalized && { normalized: options.normalized }),
      };

      const response = await fetch(`${this.baseUrl}/embeddings`, {
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
        throw new Error(`Jina API error: ${response.status} ${errorText}`);
      }

      const data: JinaEmbeddingResponse = await response.json();

      if (!data.data || data.data.length === 0) {
        throw new Error('No embedding data returned from Jina API');
      }

      return {
        embedding: data.data[0].embedding,
        tokens_used: data.usage.total_tokens,
        model,
        task,
      };
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate embeddings for multiple text inputs (batch processing)
   * @param texts Array of texts to embed
   * @param options Embedding options
   * @returns Promise resolving to batch embedding results
   */
  async embedTexts(
    texts: string[],
    options: {
      model?: JinaEmbeddingModel;
      task?: EmbeddingTask;
      dimensions?: number;
      normalized?: boolean;
      batchSize?: number;
    } = {}
  ): Promise<BatchEmbeddingResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const model = options.model || this.defaultModel;
    const task = options.task || EmbeddingTask.RETRIEVAL_PASSAGE;
    const batchSize = options.batchSize || 100; // Process in batches to avoid API limits

    const allEmbeddings: number[][] = [];
    let totalTokens = 0;

    // Process in batches
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      try {
        const requestBody: JinaEmbeddingRequest = {
          model,
          input: batch,
          embedding_type: EmbeddingType.FLOAT,
          task,
          truncate: true,
          ...(options.dimensions && { dimensions: options.dimensions }),
          ...(options.normalized && { normalized: options.normalized }),
        };

        const response = await fetch(`${this.baseUrl}/embeddings`, {
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
          throw new Error(`Jina API error: ${response.status} ${errorText}`);
        }

        const data: JinaEmbeddingResponse = await response.json();

        if (!data.data || data.data.length === 0) {
          throw new Error(`No embedding data returned for batch ${i / batchSize + 1}`);
        }

        // Extract embeddings from response
        const batchEmbeddings = data.data.map(item => item.embedding);
        allEmbeddings.push(...batchEmbeddings);
        totalTokens += data.usage.total_tokens;

      } catch (error) {
        console.error(`Error processing batch ${i / batchSize + 1}:`, error);
        throw new Error(`Batch embedding failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      embeddings: allEmbeddings,
      total_tokens: totalTokens,
      model,
      task,
    };
  }

  /**
   * Generate query embedding optimized for search
   * @param query Search query text
   * @param options Embedding options
   * @returns Promise resolving to query embedding
   */
  async embedQuery(
    query: string,
    options: {
      model?: JinaEmbeddingModel;
      dimensions?: number;
    } = {}
  ): Promise<EmbeddingResult> {
    return this.embedText(query, {
      ...options,
      task: EmbeddingTask.RETRIEVAL_QUERY,
    });
  }

  /**
   * Generate passage embedding optimized for document storage
   * @param passage Document/passage text
   * @param options Embedding options
   * @returns Promise resolving to passage embedding
   */
  async embedPassage(
    passage: string,
    options: {
      model?: JinaEmbeddingModel;
      dimensions?: number;
    } = {}
  ): Promise<EmbeddingResult> {
    return this.embedText(passage, {
      ...options,
      task: EmbeddingTask.RETRIEVAL_PASSAGE,
    });
  }

  /**
   * Generate embeddings for travel content with metadata
   * @param travelContent Travel content texts
   * @param metadata Corresponding metadata for each content
   * @returns Promise resolving to embeddings with metadata
   */
  async embedTravelContent(
    travelContent: string[],
    metadata: TravelVectorMetadata[]
  ): Promise<Array<{ 
    embedding: number[]; 
    metadata: TravelVectorMetadata; 
    content: string;
    tokens_used: number;
  }>> {
    if (travelContent.length !== metadata.length) {
      throw new Error('Content and metadata arrays must have the same length');
    }

    const batchResult = await this.embedTexts(travelContent, {
      task: EmbeddingTask.RETRIEVAL_PASSAGE,
      normalized: true, // Normalize for better similarity search
    });

    return batchResult.embeddings.map((embedding, index) => ({
      embedding,
      metadata: metadata[index],
      content: travelContent[index],
      tokens_used: Math.ceil(batchResult.total_tokens / travelContent.length), // Approximate per-item usage
    }));
  }

  /**
   * Get the embedding dimensions for a specific model
   * @param model Jina embedding model
   * @returns Number of dimensions
   */
  getModelDimensions(model: JinaEmbeddingModel): number {
    switch (model) {
      case JinaEmbeddingModel.JINA_EMBEDDINGS_V3:
      case JinaEmbeddingModel.JINA_CLIP_V2:
        return 1024;
      case JinaEmbeddingModel.JINA_EMBEDDINGS_V4:
        return 2048;
      default:
        return 1024; // Default fallback
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   * @param embedding1 First embedding vector
   * @param embedding2 Second embedding vector
   * @returns Cosine similarity score (-1 to 1)
   */
  static calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      magnitude1 += embedding1[i] ** 2;
      magnitude2 += embedding2[i] ** 2;
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Get token count estimate for text
   * @param text Input text
   * @returns Estimated token count
   */
  static estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }
}

// Singleton instance for service-wide usage
export const jinaEmbeddingsService = new JinaEmbeddingsService();

// Export types for use in other modules
export type {
  EmbeddingResult,
  BatchEmbeddingResult,
};
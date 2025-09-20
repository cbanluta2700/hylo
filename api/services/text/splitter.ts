import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { TokenTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';

/**
 * Text splitting strategies for different content types
 */
export enum SplittingStrategy {
  RECURSIVE_CHARACTER = 'recursive_character',
  TOKEN_BASED = 'token_based',
  SEMANTIC = 'semantic',
  MARKDOWN = 'markdown',
  CODE = 'code',
}

/**
 * Content types for specialized text splitting
 */
export enum ContentType {
  GENERAL_TEXT = 'general_text',
  TRAVEL_CONTENT = 'travel_content',
  WEB_CONTENT = 'web_content',
  MARKDOWN = 'markdown',
  CODE = 'code',
  DOCUMENTATION = 'documentation',
}

/**
 * Configuration interface for text splitting
 */
interface TextSplitterConfig {
  strategy: SplittingStrategy;
  chunkSize: number;
  chunkOverlap: number;
  keepSeparator?: boolean;
  separators?: string[];
  lengthFunction?: (text: string) => number;
  encodingName?: string;
}

/**
 * Specialized configurations for different content types
 */
interface ContentTypeConfig {
  [ContentType.GENERAL_TEXT]: TextSplitterConfig;
  [ContentType.TRAVEL_CONTENT]: TextSplitterConfig;
  [ContentType.WEB_CONTENT]: TextSplitterConfig;
  [ContentType.MARKDOWN]: TextSplitterConfig;
  [ContentType.CODE]: TextSplitterConfig;
  [ContentType.DOCUMENTATION]: TextSplitterConfig;
}

/**
 * Document chunk with metadata
 */
interface DocumentChunk {
  content: string;
  metadata: Record<string, any>;
  chunkIndex: number;
  totalChunks: number;
  sourceType: ContentType;
  originalLength: number;
  chunkLength: number;
}

/**
 * Splitting result with statistics
 */
interface SplittingResult {
  chunks: DocumentChunk[];
  totalChunks: number;
  averageChunkSize: number;
  strategy: SplittingStrategy;
  contentType: ContentType;
  processingTime: number;
  originalTextLength: number;
}

/**
 * LangChain Text Splitter Service for Travel Content Processing
 * Provides intelligent document chunking for various content types
 * Optimized for RAG applications and semantic search
 */
export class LangChainTextSplitterService {
  private isInitialized = false;
  
  // Default configurations for different content types
  private readonly contentConfigs: ContentTypeConfig = {
    [ContentType.GENERAL_TEXT]: {
      strategy: SplittingStrategy.RECURSIVE_CHARACTER,
      chunkSize: 1000,
      chunkOverlap: 200,
      keepSeparator: true,
      separators: ['\n\n', '\n', '. ', ' ', ''],
    },
    
    [ContentType.TRAVEL_CONTENT]: {
      strategy: SplittingStrategy.RECURSIVE_CHARACTER,
      chunkSize: 800,
      chunkOverlap: 150,
      keepSeparator: true,
      separators: [
        '\n\n',          // Paragraph breaks
        '\n',            // Line breaks
        '. ',            // Sentence endings
        '! ',            // Exclamation sentences
        '? ',            // Question sentences
        '; ',            // Semicolon breaks
        ', ',            // Comma breaks
        ' ',             // Word boundaries
        '',              // Character level
      ],
    },
    
    [ContentType.WEB_CONTENT]: {
      strategy: SplittingStrategy.RECURSIVE_CHARACTER,
      chunkSize: 1200,
      chunkOverlap: 200,
      keepSeparator: true,
      separators: [
        '\n\n',          // Paragraph breaks
        '\n',            // Line breaks
        '</p>',          // HTML paragraph tags
        '</div>',        // HTML div tags
        '</section>',    // HTML section tags
        '. ',            // Sentence endings
        ' ',             // Word boundaries
        '',              // Character level
      ],
    },
    
    [ContentType.MARKDOWN]: {
      strategy: SplittingStrategy.RECURSIVE_CHARACTER,
      chunkSize: 1000,
      chunkOverlap: 100,
      keepSeparator: true,
      separators: [
        '\n## ',         // H2 headers
        '\n### ',        // H3 headers
        '\n#### ',       // H4 headers
        '\n\n',          // Paragraph breaks
        '\n',            // Line breaks
        '. ',            // Sentence endings
        ' ',             // Word boundaries
        '',              // Character level
      ],
    },
    
    [ContentType.CODE]: {
      strategy: SplittingStrategy.RECURSIVE_CHARACTER,
      chunkSize: 600,
      chunkOverlap: 100,
      keepSeparator: true,
      separators: [
        '\nclass ',      // Class definitions
        '\nfunction ',   // Function definitions
        '\nconst ',      // Const declarations
        '\nlet ',        // Let declarations
        '\nvar ',        // Var declarations
        '\n\n',          // Empty lines
        '\n',            // Line breaks
        ' ',             // Word boundaries
        '',              // Character level
      ],
    },
    
    [ContentType.DOCUMENTATION]: {
      strategy: SplittingStrategy.RECURSIVE_CHARACTER,
      chunkSize: 1500,
      chunkOverlap: 200,
      keepSeparator: true,
      separators: [
        '\n# ',          // H1 headers
        '\n## ',         // H2 headers
        '\n### ',        // H3 headers
        '\n\n',          // Paragraph breaks
        '\n',            // Line breaks
        '. ',            // Sentence endings
        ' ',             // Word boundaries
        '',              // Character level
      ],
    },
  };

  constructor() {
    // Service initialization
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    try {
      // Test basic functionality
      const testSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 100,
        chunkOverlap: 20,
      });
      
      await testSplitter.splitText('This is a test text to verify the service is working correctly.');
      
      this.isInitialized = true;
      console.log('LangChain Text Splitter service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize LangChain Text Splitter service:', error);
      throw new Error(`Text splitter service initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if service is ready for operations
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Split text using recursive character splitter
   * @param text Text to split
   * @param config Splitter configuration
   * @returns Promise resolving to split text array
   */
  async splitTextRecursive(
    text: string,
    config: Partial<TextSplitterConfig> = {}
  ): Promise<string[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const finalConfig = {
      chunkSize: 1000,
      chunkOverlap: 200,
      keepSeparator: true,
      separators: ['\n\n', '\n', '. ', ' ', ''],
      ...config,
    };

    try {
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: finalConfig.chunkSize,
        chunkOverlap: finalConfig.chunkOverlap,
        separators: finalConfig.separators,
        keepSeparator: finalConfig.keepSeparator,
        ...(finalConfig.lengthFunction && { lengthFunction: finalConfig.lengthFunction }),
      });

      return await splitter.splitText(text);
    } catch (error) {
      console.error('Error splitting text recursively:', error);
      throw new Error(`Recursive text splitting failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Split text using token-based splitter
   * @param text Text to split
   * @param config Splitter configuration
   * @returns Promise resolving to split text array
   */
  async splitTextByTokens(
    text: string,
    config: Partial<TextSplitterConfig> = {}
  ): Promise<string[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const finalConfig = {
      chunkSize: 500,
      chunkOverlap: 50,
      encodingName: 'cl100k_base' as const,
      ...config,
    };

    try {
      const splitter = new TokenTextSplitter({
        chunkSize: finalConfig.chunkSize,
        chunkOverlap: finalConfig.chunkOverlap,
        encodingName: finalConfig.encodingName as any,
      });

      return await splitter.splitText(text);
    } catch (error) {
      console.error('Error splitting text by tokens:', error);
      throw new Error(`Token-based text splitting failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Split documents using LangChain document interface
   * @param documents Documents to split
   * @param config Splitter configuration
   * @returns Promise resolving to split documents
   */
  async splitDocuments(
    documents: Document[],
    config: Partial<TextSplitterConfig> = {}
  ): Promise<Document[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const finalConfig = {
      chunkSize: 1000,
      chunkOverlap: 200,
      keepSeparator: true,
      separators: ['\n\n', '\n', '. ', ' ', ''],
      ...config,
    };

    try {
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: finalConfig.chunkSize,
        chunkOverlap: finalConfig.chunkOverlap,
        separators: finalConfig.separators,
        keepSeparator: finalConfig.keepSeparator,
      });

      return await splitter.splitDocuments(documents);
    } catch (error) {
      console.error('Error splitting documents:', error);
      throw new Error(`Document splitting failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Split text based on content type with optimized configuration
   * @param text Text to split
   * @param contentType Type of content
   * @param customConfig Custom configuration overrides
   * @returns Promise resolving to splitting result
   */
  async splitByContentType(
    text: string,
    contentType: ContentType = ContentType.GENERAL_TEXT,
    customConfig: Partial<TextSplitterConfig> = {}
  ): Promise<SplittingResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = performance.now();
    const originalLength = text.length;

    // Get content-specific configuration
    const baseConfig = this.contentConfigs[contentType];
    const finalConfig = { ...baseConfig, ...customConfig };

    try {
      let chunks: string[];

      switch (finalConfig.strategy) {
        case SplittingStrategy.TOKEN_BASED:
          chunks = await this.splitTextByTokens(text, finalConfig);
          break;
        
        case SplittingStrategy.RECURSIVE_CHARACTER:
        default:
          chunks = await this.splitTextRecursive(text, finalConfig);
          break;
      }

      // Create document chunks with metadata
      const documentChunks: DocumentChunk[] = chunks.map((chunk, index) => ({
        content: chunk,
        metadata: {
          contentType,
          strategy: finalConfig.strategy,
          chunkIndex: index,
          totalChunks: chunks.length,
          originalLength,
          chunkLength: chunk.length,
          chunkSize: finalConfig.chunkSize,
          chunkOverlap: finalConfig.chunkOverlap,
        },
        chunkIndex: index,
        totalChunks: chunks.length,
        sourceType: contentType,
        originalLength,
        chunkLength: chunk.length,
      }));

      const processingTime = performance.now() - startTime;
      const averageChunkSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0) / chunks.length;

      return {
        chunks: documentChunks,
        totalChunks: chunks.length,
        averageChunkSize,
        strategy: finalConfig.strategy,
        contentType,
        processingTime,
        originalTextLength: originalLength,
      };
    } catch (error) {
      console.error('Error splitting text by content type:', error);
      throw new Error(`Content-type splitting failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Split travel content with specialized handling
   * @param travelText Travel-related text content
   * @param customConfig Custom configuration overrides
   * @returns Promise resolving to optimized travel content chunks
   */
  async splitTravelContent(
    travelText: string,
    customConfig: Partial<TextSplitterConfig> = {}
  ): Promise<SplittingResult> {
    // Enhanced separators for travel content
    const travelOptimizedConfig: Partial<TextSplitterConfig> = {
      chunkSize: 800,
      chunkOverlap: 150,
      separators: [
        '\n\n',          // Paragraph breaks
        '\n',            // Line breaks
        '. ',            // Sentence endings
        '! ',            // Exclamation sentences
        '? ',            // Question sentences
        '; ',            // Semicolon breaks
        ', ',            // Comma breaks
        ' - ',           // List items with dashes
        ' • ',           // Bullet points
        ' ',             // Word boundaries
        '',              // Character level
      ],
      ...customConfig,
    };

    return this.splitByContentType(
      travelText,
      ContentType.TRAVEL_CONTENT,
      travelOptimizedConfig
    );
  }

  /**
   * Split web scraped content with HTML-aware processing
   * @param webContent Web scraped content
   * @param customConfig Custom configuration overrides
   * @returns Promise resolving to web content chunks
   */
  async splitWebContent(
    webContent: string,
    customConfig: Partial<TextSplitterConfig> = {}
  ): Promise<SplittingResult> {
    // Clean HTML tags first
    const cleanedContent = this.cleanHtmlContent(webContent);
    
    const webOptimizedConfig: Partial<TextSplitterConfig> = {
      chunkSize: 1200,
      chunkOverlap: 200,
      ...customConfig,
    };

    return this.splitByContentType(
      cleanedContent,
      ContentType.WEB_CONTENT,
      webOptimizedConfig
    );
  }

  /**
   * Create documents from text chunks with metadata
   * @param text Original text
   * @param contentType Type of content
   * @param additionalMetadata Additional metadata to include
   * @returns Promise resolving to LangChain documents
   */
  async createDocuments(
    text: string,
    contentType: ContentType = ContentType.GENERAL_TEXT,
    additionalMetadata: Record<string, any> = {}
  ): Promise<Document[]> {
    const splittingResult = await this.splitByContentType(text, contentType);

    return splittingResult.chunks.map((chunk, index) => new Document({
      pageContent: chunk.content,
      metadata: {
        ...chunk.metadata,
        ...additionalMetadata,
        source: 'text_splitter',
        timestamp: new Date().toISOString(),
      },
    }));
  }

  /**
   * Batch split multiple texts efficiently
   * @param texts Array of texts to split
   * @param contentType Content type for all texts
   * @param customConfig Custom configuration
   * @returns Promise resolving to batch splitting results
   */
  async batchSplit(
    texts: string[],
    contentType: ContentType = ContentType.GENERAL_TEXT,
    customConfig: Partial<TextSplitterConfig> = {}
  ): Promise<SplittingResult[]> {
    const results: SplittingResult[] = [];

    // Process texts in parallel with concurrency limit
    const concurrency = 5;
    for (let i = 0; i < texts.length; i += concurrency) {
      const batch = texts.slice(i, i + concurrency);
      const batchPromises = batch.map(text => 
        this.splitByContentType(text, contentType, customConfig)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Get optimal configuration for a content type
   * @param contentType Type of content
   * @returns Configuration object
   */
  getContentTypeConfig(contentType: ContentType): TextSplitterConfig {
    return { ...this.contentConfigs[contentType] };
  }

  /**
   * Update configuration for a content type
   * @param contentType Content type to update
   * @param newConfig New configuration
   */
  updateContentTypeConfig(
    contentType: ContentType,
    newConfig: Partial<TextSplitterConfig>
  ): void {
    this.contentConfigs[contentType] = {
      ...this.contentConfigs[contentType],
      ...newConfig,
    };
  }

  /**
   * Clean HTML content by removing tags and normalizing whitespace
   * @param htmlContent HTML content to clean
   * @returns Cleaned text content
   */
  private cleanHtmlContent(htmlContent: string): string {
    // Remove HTML tags
    let cleaned = htmlContent.replace(/<[^>]*>/g, ' ');
    
    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // Remove extra spaces
    cleaned = cleaned.trim();
    
    return cleaned;
  }

  /**
   * Calculate estimated token count for text
   * @param text Text to analyze
   * @returns Estimated token count
   */
  estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Get splitting statistics for debugging and optimization
   * @param text Text to analyze
   * @param contentType Content type
   * @returns Promise resolving to analysis statistics
   */
  async analyzeSplitting(
    text: string,
    contentType: ContentType = ContentType.GENERAL_TEXT
  ): Promise<{
    originalLength: number;
    estimatedTokens: number;
    config: TextSplitterConfig;
    estimatedChunks: number;
    recommendedChunkSize: number;
  }> {
    const config = this.getContentTypeConfig(contentType);
    const originalLength = text.length;
    const estimatedTokens = this.estimateTokenCount(text);
    const estimatedChunks = Math.ceil(originalLength / (config.chunkSize - config.chunkOverlap));
    
    // Recommend chunk size based on content length
    let recommendedChunkSize = config.chunkSize;
    if (originalLength < 1000) {
      recommendedChunkSize = Math.min(500, config.chunkSize);
    } else if (originalLength > 10000) {
      recommendedChunkSize = Math.max(1500, config.chunkSize);
    }

    return {
      originalLength,
      estimatedTokens,
      config,
      estimatedChunks,
      recommendedChunkSize,
    };
  }
}

// Singleton instance for service-wide usage
export const langChainTextSplitterService = new LangChainTextSplitterService();

// Export types for use in other modules
export type {
  TextSplitterConfig,
  DocumentChunk,
  SplittingResult,
};
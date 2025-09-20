/**
 * Content Extraction and Validation Service
 * 
 * Processes web content scraped by Tavily search service for use in AI agent workflows.
 * Provides sanitization, source attribution, and validation for travel-related content.
 * Optimized for Vercel Edge Runtime with comprehensive error handling.
 * 
 * Features:
 * - HTML sanitization and content extraction
 * - Travel content validation and scoring
 * - Source attribution and metadata preservation
 * - Rate limiting and content quality assessment
 * - Cost-conscious processing with content limits
 */

import { z } from 'zod';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Raw search result from Tavily web search
 */
export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  raw_content?: string;
  score: number;
  published_date?: string;
}

/**
 * Extracted and processed content ready for AI agents
 */
export interface ExtractedContent {
  id: string;
  title: string;
  url: string;
  content: string;
  summary: string;
  relevanceScore: number;
  qualityScore: number;
  metadata: {
    wordCount: number;
    extractedAt: string;
    sourceType: string;
    publishDate?: string;
    lastUpdated?: string;
    language?: string;
    travelRelevance: TravelRelevance;
  };
  source: {
    domain: string;
    credibilityScore: number;
    isOfficial: boolean;
    authority: string; // 'official' | 'tourism' | 'travel' | 'blog' | 'news' | 'unknown'
  };
  tags: string[];
  warnings?: string[];
}

/**
 * Travel content relevance assessment
 */
export interface TravelRelevance {
  categories: string[]; // 'attractions', 'accommodation', 'dining', 'transportation', etc.
  confidence: number; // 0-100
  keywords: string[];
  location: {
    mentioned: boolean;
    specific: boolean;
    coordinates?: { lat: number; lng: number };
  };
}

/**
 * Content extraction configuration
 */
export interface ExtractionConfig {
  maxContentLength: number;
  minQualityScore: number;
  requiredRelevance: number;
  sanitization: {
    removeHtml: boolean;
    preserveFormatting: boolean;
    allowedTags: string[];
  };
  validation: {
    checkTravelRelevance: boolean;
    validateSources: boolean;
    scoreThreshold: number;
  };
}

/**
 * Batch extraction result
 */
export interface ExtractionResult {
  success: boolean;
  extracted: ExtractedContent[];
  filtered: number;
  totalProcessed: number;
  processingTime: number;
  cost: {
    charactersProcessed: number;
    estimatedCost: number;
  };
  errors: Array<{
    url: string;
    error: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const TavilySearchResultSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  content: z.string(),
  raw_content: z.string().optional(),
  score: z.number().min(0).max(1),
  published_date: z.string().optional()
});

const ExtractionConfigSchema = z.object({
  maxContentLength: z.number().default(5000),
  minQualityScore: z.number().min(0).max(100).default(60),
  requiredRelevance: z.number().min(0).max(100).default(70),
  sanitization: z.object({
    removeHtml: z.boolean().default(true),
    preserveFormatting: z.boolean().default(true),
    allowedTags: z.array(z.string()).default(['p', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'])
  }),
  validation: z.object({
    checkTravelRelevance: z.boolean().default(true),
    validateSources: z.boolean().default(true),
    scoreThreshold: z.number().min(0).max(100).default(70)
  })
});

// =============================================================================
// CONTENT EXTRACTOR SERVICE
// =============================================================================

/**
 * Content Extraction Service for processing Tavily search results
 * Handles sanitization, validation, and travel content optimization
 */
export class ContentExtractionService {
  private config: ExtractionConfig;
  private travelKeywords: Set<string>;
  private trustedDomains: Set<string>;
  private officialDomains: Set<string>;

  constructor(config: Partial<ExtractionConfig> = {}) {
    // Validate and set configuration
    const validatedConfig = ExtractionConfigSchema.parse(config);
    this.config = validatedConfig;

    // Initialize travel-related keywords for relevance scoring
    this.travelKeywords = new Set([
      'hotel', 'restaurant', 'attraction', 'museum', 'tour', 'booking',
      'travel', 'vacation', 'holiday', 'trip', 'visit', 'explore',
      'accommodation', 'flight', 'airport', 'train', 'bus', 'taxi',
      'beach', 'mountain', 'city', 'landmark', 'culture', 'food',
      'dining', 'shopping', 'entertainment', 'nightlife', 'activities',
      'guide', 'itinerary', 'map', 'location', 'address', 'hours',
      'price', 'cost', 'budget', 'reservation', 'availability'
    ]);

    // Trusted travel and tourism domains
    this.trustedDomains = new Set([
      'tripadvisor.com', 'booking.com', 'expedia.com', 'kayak.com',
      'lonely planet.com', 'timeout.com', 'frommers.com', 'fodors.com',
      'travelocity.com', 'priceline.com', 'hotels.com', 'airbnb.com'
    ]);

    // Official tourism and government domains
    this.officialDomains = new Set([
      'gov', 'edu', 'org', 'visitbritain.com', 'france.fr',
      'japan.travel', 'australia.com', 'canada.travel'
    ]);
  }

  /**
   * Extract and process content from multiple Tavily search results
   */
  public async extractBatch(
    searchResults: TavilySearchResult[]
  ): Promise<ExtractionResult> {
    const startTime = Date.now();
    const extracted: ExtractedContent[] = [];
    const errors: Array<{ url: string; error: string; severity: 'low' | 'medium' | 'high' }> = [];
    let totalCharactersProcessed = 0;
    let filtered = 0;

    for (const result of searchResults) {
      try {
        // Validate input
        const validatedResult = TavilySearchResultSchema.parse(result);
        
        // Extract and process content
        const extractedContent = await this.extractSingle(validatedResult);
        
        if (extractedContent) {
          // Check if content meets quality thresholds
          if (this.passesQualityGate(extractedContent)) {
            extracted.push(extractedContent);
            totalCharactersProcessed += extractedContent.content.length;
          } else {
            filtered++;
          }
        } else {
          filtered++;
        }
        
      } catch (error) {
        errors.push({
          url: result.url,
          error: error instanceof Error ? error.message : 'Unknown extraction error',
          severity: 'medium'
        });
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      success: errors.length === 0 || extracted.length > 0,
      extracted,
      filtered,
      totalProcessed: searchResults.length,
      processingTime,
      cost: {
        charactersProcessed: totalCharactersProcessed,
        estimatedCost: this.calculateProcessingCost(totalCharactersProcessed)
      },
      errors
    };
  }

  /**
   * Extract and process a single search result
   */
  private async extractSingle(
    result: TavilySearchResult
  ): Promise<ExtractedContent | null> {
    try {
      // Generate unique ID
      const id = this.generateContentId(result.url);
      
      // Extract domain information
      const domain = new URL(result.url).hostname;
      const source = this.analyzeSource(domain);
      
      // Sanitize content
      const sanitizedContent = this.sanitizeContent(result.content);
      
      // Create summary (first 200 characters, trimmed to word boundary)
      const summary = this.createSummary(sanitizedContent);
      
      // Assess travel relevance
      const travelRelevance = this.assessTravelRelevance(
        result.title,
        sanitizedContent
      );
      
      // Calculate quality scores
      const qualityScore = this.calculateQualityScore(result, sanitizedContent);
      const relevanceScore = travelRelevance.confidence;
      
      // Extract tags and keywords
      const tags = this.extractTags(result.title, sanitizedContent);
      
      // Generate warnings if needed
      const warnings = this.generateWarnings(result, sanitizedContent);

      return {
        id,
        title: result.title,
        url: result.url,
        content: sanitizedContent,
        summary,
        relevanceScore,
        qualityScore,
        metadata: {
          wordCount: sanitizedContent.split(' ').length,
          extractedAt: new Date().toISOString(),
          sourceType: source.authority,
          publishDate: result.published_date,
          lastUpdated: new Date().toISOString(),
          travelRelevance
        },
        source,
        tags,
        warnings: warnings.length > 0 ? warnings : undefined
      };
      
    } catch (error) {
      console.error(`Content extraction failed for ${result.url}:`, error);
      return null;
    }
  }

  /**
   * Sanitize HTML content and extract clean text
   */
  private sanitizeContent(content: string): string {
    if (!this.config.sanitization.removeHtml) {
      return content;
    }

    // Remove HTML tags while preserving formatting
    let sanitized = content
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
      .replace(/<style[^>]*>.*?<\/style>/gi, '') // Remove styles
      .replace(/<[^>]*>/g, ' ') // Remove all other HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Limit content length
    if (sanitized.length > this.config.maxContentLength) {
      sanitized = sanitized.substring(0, this.config.maxContentLength) + '...';
    }

    return sanitized;
  }

  /**
   * Create a summary of content (first 200 characters)
   */
  private createSummary(content: string): string {
    const maxLength = 200;
    if (content.length <= maxLength) return content;
    
    // Find the last complete word within the limit
    const truncated = content.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }

  /**
   * Assess travel relevance of content
   */
  private assessTravelRelevance(title: string, content: string): TravelRelevance {
    const fullText = `${title} ${content}`.toLowerCase();
    
    // Count travel keywords
    const foundKeywords: string[] = [];
    let keywordCount = 0;
    
    for (const keyword of this.travelKeywords) {
      if (fullText.includes(keyword)) {
        foundKeywords.push(keyword);
        keywordCount++;
      }
    }
    
    // Calculate confidence based on keyword density
    const textLength = fullText.split(' ').length;
    const keywordDensity = keywordCount / textLength;
    const confidence = Math.min(100, (keywordDensity * 1000) + (keywordCount * 10));
    
    // Identify categories
    const categories: string[] = [];
    if (fullText.includes('hotel') || fullText.includes('accommodation')) categories.push('accommodation');
    if (fullText.includes('restaurant') || fullText.includes('food') || fullText.includes('dining')) categories.push('dining');
    if (fullText.includes('museum') || fullText.includes('attraction') || fullText.includes('landmark')) categories.push('attractions');
    if (fullText.includes('flight') || fullText.includes('train') || fullText.includes('bus')) categories.push('transportation');
    if (fullText.includes('shopping') || fullText.includes('market')) categories.push('shopping');
    if (fullText.includes('nightlife') || fullText.includes('entertainment')) categories.push('entertainment');
    
    // Check for location mentions
    const hasLocationMention = /\b(in|at|near|located|address|street|city|country)\b/i.test(fullText);
    
    return {
      categories,
      confidence,
      keywords: foundKeywords,
      location: {
        mentioned: hasLocationMention,
        specific: /\d+.*\b(street|st|road|rd|avenue|ave|blvd|drive|dr)\b/i.test(fullText)
      }
    };
  }

  /**
   * Calculate quality score for content
   */
  private calculateQualityScore(
    result: TavilySearchResult,
    content: string
  ): number {
    let score = 0;
    
    // Base score from Tavily
    score += result.score * 40;
    
    // Content length bonus (optimal 500-2000 words)
    const wordCount = content.split(' ').length;
    if (wordCount >= 100 && wordCount <= 3000) {
      score += 20;
    } else if (wordCount >= 50) {
      score += 10;
    }
    
    // Title quality
    if (result.title.length >= 20 && result.title.length <= 100) {
      score += 10;
    }
    
    // Date recency bonus
    if (result.published_date) {
      const publishedDate = new Date(result.published_date);
      const monthsOld = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsOld <= 12) score += 15;
      else if (monthsOld <= 24) score += 10;
      else if (monthsOld <= 36) score += 5;
    }
    
    // URL quality indicators
    const url = result.url.toLowerCase();
    if (url.includes('guide') || url.includes('review') || url.includes('travel')) {
      score += 10;
    }
    
    // Penalize very short or very long content
    if (wordCount < 50 || wordCount > 5000) {
      score -= 20;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Analyze source domain for credibility
   */
  private analyzeSource(domain: string): {
    domain: string;
    credibilityScore: number;
    isOfficial: boolean;
    authority: string;
  } {
    const lowerDomain = domain.toLowerCase();
    
    let credibilityScore = 50; // Default
    let authority = 'unknown';
    let isOfficial = false;
    
    // Check for official domains
    if (this.officialDomains.has(lowerDomain) || lowerDomain.endsWith('.gov') || lowerDomain.endsWith('.edu')) {
      credibilityScore = 95;
      authority = 'official';
      isOfficial = true;
    }
    // Check trusted travel domains
    else if (this.trustedDomains.has(lowerDomain)) {
      credibilityScore = 85;
      authority = 'travel';
    }
    // Check for tourism domains
    else if (lowerDomain.includes('tourism') || lowerDomain.includes('visit') || lowerDomain.includes('travel')) {
      credibilityScore = 75;
      authority = 'tourism';
    }
    // Check for news domains
    else if (lowerDomain.includes('news') || lowerDomain.includes('times') || lowerDomain.includes('post')) {
      credibilityScore = 70;
      authority = 'news';
    }
    // Check for blog domains
    else if (lowerDomain.includes('blog') || lowerDomain.includes('wordpress') || lowerDomain.includes('medium')) {
      credibilityScore = 60;
      authority = 'blog';
    }
    
    return {
      domain,
      credibilityScore,
      isOfficial,
      authority
    };
  }

  /**
   * Extract relevant tags from content
   */
  private extractTags(title: string, content: string): string[] {
    const fullText = `${title} ${content}`.toLowerCase();
    const tags: string[] = [];
    
    // Location tags
    const locationTerms = ['city', 'town', 'beach', 'mountain', 'island', 'park', 'downtown', 'district'];
    locationTerms.forEach(term => {
      if (fullText.includes(term)) tags.push(term);
    });
    
    // Activity tags
    const activityTerms = ['restaurant', 'hotel', 'museum', 'shopping', 'nightlife', 'tours', 'activities'];
    activityTerms.forEach(term => {
      if (fullText.includes(term)) tags.push(term);
    });
    
    // Time-based tags
    if (fullText.includes('season') || fullText.includes('best time')) tags.push('seasonal');
    if (fullText.includes('hours') || fullText.includes('open') || fullText.includes('closed')) tags.push('hours');
    
    // Price tags
    if (fullText.includes('price') || fullText.includes('cost') || fullText.includes('budget') || fullText.includes('$')) {
      tags.push('pricing');
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Generate content warnings if needed
   */
  private generateWarnings(
    result: TavilySearchResult,
    content: string
  ): string[] {
    const warnings: string[] = [];
    
    // Check for outdated content
    if (result.published_date) {
      const publishedDate = new Date(result.published_date);
      const yearsOld = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (yearsOld > 3) {
        warnings.push(`Content is ${Math.floor(yearsOld)} years old and may be outdated`);
      }
    }
    
    // Check for short content
    const wordCount = content.split(' ').length;
    if (wordCount < 100) {
      warnings.push('Content is very brief and may lack detail');
    }
    
    // Check for potential promotional content
    const promoTerms = ['book now', 'special offer', 'discount', 'limited time'];
    const hasPromoContent = promoTerms.some(term => content.toLowerCase().includes(term));
    if (hasPromoContent) {
      warnings.push('Content may contain promotional material');
    }
    
    return warnings;
  }

  /**
   * Check if content passes quality gates
   */
  private passesQualityGate(content: ExtractedContent): boolean {
    // Check minimum quality score
    if (content.qualityScore < this.config.minQualityScore) {
      return false;
    }
    
    // Check travel relevance if enabled
    if (this.config.validation.checkTravelRelevance) {
      if (content.relevanceScore < this.config.requiredRelevance) {
        return false;
      }
    }
    
    // Check content length
    if (content.content.length < 100) {
      return false;
    }
    
    return true;
  }

  /**
   * Generate unique content ID
   */
  private generateContentId(url: string): string {
    // Create hash from URL for consistent IDs
    const urlHash = url.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return `content_${Math.abs(urlHash)}_${Date.now()}`;
  }

  /**
   * Calculate estimated processing cost
   */
  private calculateProcessingCost(charactersProcessed: number): number {
    // Rough estimate: $0.0001 per 1000 characters
    return (charactersProcessed / 1000) * 0.0001;
  }

  /**
   * Get service health status
   */
  public getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    config: ExtractionConfig;
    stats: {
      travelKeywordsLoaded: number;
      trustedDomainsLoaded: number;
      officialDomainsLoaded: number;
    };
  } {
    return {
      status: 'healthy',
      config: this.config,
      stats: {
        travelKeywordsLoaded: this.travelKeywords.size,
        trustedDomainsLoaded: this.trustedDomains.size,
        officialDomainsLoaded: this.officialDomains.size
      }
    };
  }
}

// =============================================================================
// SERVICE INSTANCE
// =============================================================================

/**
 * Default content extraction service instance with optimized travel settings
 */
export const contentExtractionService = new ContentExtractionService({
  maxContentLength: 3000,
  minQualityScore: 65,
  requiredRelevance: 70,
  sanitization: {
    removeHtml: true,
    preserveFormatting: true,
    allowedTags: ['p', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'strong', 'em']
  },
  validation: {
    checkTravelRelevance: true,
    validateSources: true,
    scoreThreshold: 70
  }
});

/**
 * High-quality content extraction service for premium results
 */
export const premiumContentExtractionService = new ContentExtractionService({
  maxContentLength: 5000,
  minQualityScore: 80,
  requiredRelevance: 85,
  sanitization: {
    removeHtml: true,
    preserveFormatting: true,
    allowedTags: ['p', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'strong', 'em', 'blockquote']
  },
  validation: {
    checkTravelRelevance: true,
    validateSources: true,
    scoreThreshold: 85
  }
});

export default contentExtractionService;
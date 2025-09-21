import { NextApiRequest, NextApiResponse } from 'next';
import { searchOrchestrator } from '../../src/lib/search-orchestrator';
import { generateId } from '../../src/lib/smart-queries';

/**
 * POST /api/search/providers
 * Unified search interface endpoint
 *
 * This endpoint provides a unified interface for searching across multiple
 * search providers and data sources, with intelligent result aggregation
 * and ranking.
 *
 * Request Body:
 * {
 *   "query": string,
 *   "type": "text" | "image" | "video" | "news",
 *   "providers": string[], // Optional: specific providers to use
 *   "options": {
 *     "maxResults": number,
 *     "language": string,
 *     "region": string,
 *     "safeSearch": boolean,
 *     "freshness": "day" | "week" | "month" | "year"
 *   }
 * }
 *
 * Response:
 * {
 *   "success": boolean,
 *   "searchId": string,
 *   "query": string,
 *   "results": SearchResult[],
 *   "metadata": {...},
 *   "processingTime": number
 * }
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests are allowed',
      },
    });
  }

  const startTime = Date.now();
  const searchId = generateId();

  try {
    const { query, type = 'text', providers, options = {} } = req.body;

    // Validate request
    const validationError = validateSearchRequest(query, type, providers, options);
    if (validationError) {
      return res.status(validationError.status).json({
        error: validationError.error,
        searchId,
        timestamp: new Date().toISOString(),
      });
    }

    // Prepare search request
    const searchRequest = {
      query: query.trim(),
      type,
      provider: providers?.[0] || 'orchestrator', // Use first provider or default to orchestrator
      options: {
        maxResults: options.maxResults || 10,
        language: options.language || 'en',
        region: options.region || 'us',
        safeSearch: options.safeSearch !== false, // Default to true
        freshness: options.freshness || 'month',
        ...options,
      },
    };

    // Execute search
    const searchResponse = await searchOrchestrator.search(searchRequest);

    // Process and enhance results
    const processedResults = processSearchResults(searchResponse.results, searchRequest);

    // Calculate search metadata
    const metadata = {
      searchId,
      query: searchRequest.query,
      type: searchRequest.type,
      providersUsed: providers || ['orchestrator'],
      totalResults: processedResults.length,
      searchTime: Date.now() - startTime,
      resultQuality: calculateResultQuality(processedResults),
      freshness: searchRequest.options.freshness,
      language: searchRequest.options.language,
      region: searchRequest.options.region,
    };

    // Return successful response
    return res.status(200).json({
      success: true,
      searchId,
      query: searchRequest.query,
      results: processedResults,
      metadata,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in search providers endpoint:', error);

    return res.status(500).json({
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: 'Failed to execute search',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      searchId,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Validate search request
 */
function validateSearchRequest(
  query: any,
  type: any,
  providers: any,
  options: any
): { status: number; error: any } | null {
  if (!query || typeof query !== 'string') {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'query is required and must be a string',
      },
    };
  }

  if (query.trim().length === 0) {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'query cannot be empty',
      },
    };
  }

  if (query.length > 500) {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'query must be less than 500 characters',
      },
    };
  }

  const validTypes = ['text', 'image', 'video', 'news'];
  if (type && !validTypes.includes(type)) {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: `type must be one of: ${validTypes.join(', ')}`,
      },
    };
  }

  if (providers && !Array.isArray(providers)) {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'providers must be an array if provided',
      },
    };
  }

  if (providers && providers.length > 5) {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Cannot specify more than 5 providers',
      },
    };
  }

  if (options && typeof options !== 'object') {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'options must be an object if provided',
      },
    };
  }

  // Validate options.maxResults
  if (options?.maxResults !== undefined) {
    if (
      !Number.isInteger(options.maxResults) ||
      options.maxResults < 1 ||
      options.maxResults > 50
    ) {
      return {
        status: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'maxResults must be an integer between 1 and 50',
        },
      };
    }
  }

  // Validate options.freshness
  const validFreshness = ['day', 'week', 'month', 'year'];
  if (options?.freshness && !validFreshness.includes(options.freshness)) {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: `freshness must be one of: ${validFreshness.join(', ')}`,
      },
    };
  }

  return null; // No validation errors
}

/**
 * Process and enhance search results
 */
function processSearchResults(results: any[], searchRequest: any): any[] {
  return results.map((result, index) => ({
    id: `${searchRequest.query}_${index}_${Date.now()}`,
    title: result.title || 'Untitled',
    url: result.url || '',
    snippet: result.snippet || result.content || '',
    source: result.source || 'unknown',
    publishedDate: result.publishedDate || result.date,
    relevanceScore: result.relevanceScore || calculateRelevanceScore(result, searchRequest),
    credibilityScore: calculateCredibilityScore(result.source),
    type: searchRequest.type,
    metadata: {
      position: index + 1,
      searchQuery: searchRequest.query,
      provider: result.provider || searchRequest.provider,
      language: searchRequest.options?.language,
      region: searchRequest.options?.region,
    },
    // Add additional processing
    processedAt: new Date().toISOString(),
    isRelevant: isResultRelevant(result, searchRequest),
    categories: categorizeResult(result),
    sentiment: analyzeSentiment(result.snippet || result.content || ''),
  }));
}

/**
 * Calculate relevance score for a result
 */
function calculateRelevanceScore(result: any, searchRequest: any): number {
  let score = 0.5; // Base score

  const title = (result.title || '').toLowerCase();
  const snippet = (result.snippet || result.content || '').toLowerCase();
  const query = searchRequest.query.toLowerCase();

  // Title relevance
  if (title.includes(query)) {
    score += 0.3;
  }

  // Snippet relevance
  if (snippet.includes(query)) {
    score += 0.2;
  }

  // Exact phrase match bonus
  const queryWords = query.split(' ').filter((word: string) => word.length > 2);
  const exactMatches = queryWords.filter(
    (word: string) => title.includes(word) || snippet.includes(word)
  ).length;
  score += (exactMatches / queryWords.length) * 0.2;

  // Recency bonus
  if (result.publishedDate) {
    const publishedDate = new Date(result.publishedDate);
    const daysSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSincePublished < 7) score += 0.1;
    else if (daysSincePublished < 30) score += 0.05;
  }

  return Math.min(1.0, Math.max(0.0, score));
}

/**
 * Calculate credibility score for a source
 */
function calculateCredibilityScore(source: string): number {
  if (!source) return 0.5;

  const sourceLower = source.toLowerCase();

  // High credibility sources
  if (sourceLower.includes('.gov') || sourceLower.includes('government')) return 0.9;
  if (sourceLower.includes('wikipedia.org')) return 0.8;
  if (sourceLower.includes('bbc') || sourceLower.includes('cnn') || sourceLower.includes('reuters'))
    return 0.85;

  // Medium credibility sources
  if (sourceLower.includes('.edu') || sourceLower.includes('university')) return 0.75;
  if (sourceLower.includes('tripadvisor') || sourceLower.includes('booking.com')) return 0.7;
  if (sourceLower.includes('lonelyplanet') || sourceLower.includes('fodors')) return 0.75;

  // Low credibility sources
  if (sourceLower.includes('blogspot') || sourceLower.includes('wordpress.com')) return 0.4;

  return 0.6; // Default medium credibility
}

/**
 * Check if result is relevant to the search
 */
function isResultRelevant(result: any, searchRequest: any): boolean {
  const relevanceScore = calculateRelevanceScore(result, searchRequest);
  return relevanceScore > 0.3; // Threshold for relevance
}

/**
 * Categorize search result
 */
function categorizeResult(result: any): string[] {
  const categories: string[] = [];
  const title = (result.title || '').toLowerCase();
  const snippet = (result.snippet || result.content || '').toLowerCase();

  // Travel-related categories
  if (title.includes('hotel') || snippet.includes('accommodation')) {
    categories.push('accommodation');
  }

  if (title.includes('restaurant') || snippet.includes('food') || snippet.includes('dining')) {
    categories.push('dining');
  }

  if (
    title.includes('attraction') ||
    snippet.includes('sightseeing') ||
    snippet.includes('tourist')
  ) {
    categories.push('attractions');
  }

  if (
    title.includes('transport') ||
    snippet.includes('travel') ||
    snippet.includes('getting around')
  ) {
    categories.push('transportation');
  }

  if (title.includes('weather') || snippet.includes('climate') || snippet.includes('season')) {
    categories.push('weather');
  }

  if (title.includes('safety') || snippet.includes('security') || snippet.includes('health')) {
    categories.push('safety');
  }

  // Default category
  if (categories.length === 0) {
    categories.push('general');
  }

  return categories;
}

/**
 * Analyze sentiment of content
 */
function analyzeSentiment(content: string): 'positive' | 'negative' | 'neutral' {
  if (!content) return 'neutral';

  const positiveWords = [
    'excellent',
    'amazing',
    'wonderful',
    'great',
    'fantastic',
    'beautiful',
    'recommend',
    'best',
  ];
  const negativeWords = [
    'terrible',
    'awful',
    'horrible',
    'worst',
    'dangerous',
    'expensive',
    'overrated',
    'disappointing',
  ];

  const contentLower = content.toLowerCase();

  const positiveCount = positiveWords.filter((word) => contentLower.includes(word)).length;
  const negativeCount = negativeWords.filter((word) => contentLower.includes(word)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

/**
 * Calculate overall result quality
 */
function calculateResultQuality(results: any[]): {
  averageRelevance: number;
  averageCredibility: number;
  diversityScore: number;
  recencyScore: number;
} {
  if (results.length === 0) {
    return {
      averageRelevance: 0,
      averageCredibility: 0,
      diversityScore: 0,
      recencyScore: 0,
    };
  }

  const totalRelevance = results.reduce((sum, result) => sum + (result.relevanceScore || 0), 0);
  const totalCredibility = results.reduce((sum, result) => sum + (result.credibilityScore || 0), 0);

  // Calculate source diversity
  const sources = results.map((r) => r.source).filter(Boolean);
  const uniqueSources = new Set(sources);
  const diversityScore = uniqueSources.size / sources.length;

  // Calculate recency score
  const recentResults = results.filter((result) => {
    if (!result.publishedDate) return false;
    const publishedDate = new Date(result.publishedDate);
    const daysSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSincePublished < 30; // Within last 30 days
  });
  const recencyScore = recentResults.length / results.length;

  return {
    averageRelevance: totalRelevance / results.length,
    averageCredibility: totalCredibility / results.length,
    diversityScore,
    recencyScore,
  };
}

/**
 * Export for testing purposes
 */
export {
  validateSearchRequest,
  processSearchResults,
  calculateRelevanceScore,
  calculateCredibilityScore,
  isResultRelevant,
  categorizeResult,
  analyzeSentiment,
  calculateResultQuality,
};

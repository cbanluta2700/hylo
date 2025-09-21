/**
 * Consolidated Cache Endpoint
 *
 * Combines vector operations, session caching, and general cache management
 * into a single endpoint with operation-based routing.
 *
 * Replaces:
 * - api/cache/vector.ts
 * - Future session cache endpoints
 * - General caching needs
 */

import { NextRequest } from 'next/server';

// Edge Runtime configuration
export const config = {
  runtime: 'edge',
};

interface CacheRequest {
  operation: 'store' | 'query' | 'delete' | 'update' | 'similarity-search' | 'clear';
  type: 'vector' | 'session' | 'general';
  data?: {
    id?: string;
    content?: string;
    metadata?: any;
    vector?: number[];
    key?: string;
    value?: any;
    ttl?: number;
  };
  query?: {
    text?: string;
    vector?: number[];
    limit?: number;
    threshold?: number;
    filters?: any;
    sessionId?: string;
    keys?: string[];
  };
  options?: {
    namespace?: string;
    ttl?: number;
    indexType?: 'cosine' | 'euclidean' | 'dotproduct';
  };
}

interface CacheResponse {
  success: boolean;
  operation: string;
  type: string;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    responseTime: number;
    timestamp: string;
    itemsAffected?: number;
  };
}

export default async function handler(req: NextRequest) {
  const startTime = Date.now();

  if (req.method !== 'POST') {
    return Response.json(
      {
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only POST requests are allowed',
        },
      },
      { status: 405 }
    );
  }

  try {
    const body: CacheRequest = await req.json();
    const { operation, type = 'vector' } = body;

    let result;

    switch (type) {
      case 'vector':
        result = await handleVectorOperation(body, startTime);
        break;

      case 'session':
        result = await handleSessionCache(body, startTime);
        break;

      case 'general':
        result = await handleGeneralCache(body, startTime);
        break;

      default:
        throw new Error(`Unknown cache type: ${type}`);
    }

    return Response.json(result);
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        operation: 'error',
        type: 'unknown',
        error: {
          code: 'CACHE_OPERATION_ERROR',
          message: error.message,
          details: error,
        },
        metadata: {
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

async function handleVectorOperation(
  request: CacheRequest,
  startTime: number
): Promise<CacheResponse> {
  const { operation, data, query, options } = request;

  try {
    let result;

    switch (operation) {
      case 'store':
        result = await storeVectorData(data, options);
        break;

      case 'query':
      case 'similarity-search':
        result = await queryVectorData(query, options);
        break;

      case 'update':
        result = await updateVectorData(data, options);
        break;

      case 'delete':
        result = await deleteVectorData(data, options);
        break;

      case 'clear':
        result = await clearVectorNamespace(options?.namespace);
        break;

      default:
        throw new Error(`Unknown vector operation: ${operation}`);
    }

    return {
      success: true,
      operation,
      type: 'vector',
      data: result,
      metadata: {
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        itemsAffected: Array.isArray(result) ? result.length : 1,
      },
    };
  } catch (error: any) {
    throw new Error(`Vector operation failed: ${error.message}`);
  }
}

async function handleSessionCache(
  request: CacheRequest,
  startTime: number
): Promise<CacheResponse> {
  const { operation, data, query } = request;

  try {
    let result;

    switch (operation) {
      case 'store':
        result = await storeSessionData(data);
        break;

      case 'query':
        result = await querySessionData(query);
        break;

      case 'update':
        result = await updateSessionData(data);
        break;

      case 'delete':
        result = await deleteSessionData(data);
        break;

      case 'clear':
        result = await clearSessionData(query?.sessionId);
        break;

      default:
        throw new Error(`Unknown session operation: ${operation}`);
    }

    return {
      success: true,
      operation,
      type: 'session',
      data: result,
      metadata: {
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    throw new Error(`Session cache operation failed: ${error.message}`);
  }
}

async function handleGeneralCache(
  request: CacheRequest,
  startTime: number
): Promise<CacheResponse> {
  const { operation, data, query } = request;

  try {
    let result;

    switch (operation) {
      case 'store':
        result = await storeGeneralData(data);
        break;

      case 'query':
        result = await queryGeneralData(query);
        break;

      case 'update':
        result = await updateGeneralData(data);
        break;

      case 'delete':
        result = await deleteGeneralData(data);
        break;

      case 'clear':
        result = await clearGeneralCache();
        break;

      default:
        throw new Error(`Unknown general cache operation: ${operation}`);
    }

    return {
      success: true,
      operation,
      type: 'general',
      data: result,
      metadata: {
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    throw new Error(`General cache operation failed: ${error.message}`);
  }
}

// =============================================================================
// Vector Operations Implementation
// =============================================================================

async function storeVectorData(data: any, options: any) {
  // Integration with Upstash Vector
  const vectorClient = getVectorClient();

  if (!data?.content && !data?.vector) {
    throw new Error('Either content or vector is required for storage');
  }

  // Generate vector from content if not provided
  let vector = data.vector;
  if (!vector && data.content) {
    vector = await generateEmbedding(data.content);
  }

  const record = {
    id: data.id || generateId(),
    vector,
    metadata: {
      ...data.metadata,
      content: data.content,
      timestamp: new Date().toISOString(),
      namespace: options?.namespace || 'default',
    },
  };

  // Store in Upstash Vector (mock implementation)
  return await vectorClient.upsert([record]);
}

async function queryVectorData(query: any, options: any) {
  const vectorClient = getVectorClient();

  let queryVector = query?.vector;
  if (!queryVector && query?.text) {
    queryVector = await generateEmbedding(query.text);
  }

  if (!queryVector) {
    throw new Error('Either vector or text query is required');
  }

  const searchOptions = {
    vector: queryVector,
    topK: query?.limit || 5,
    includeMetadata: true,
    includeValues: false,
    namespace: options?.namespace || 'default',
    filter: query?.filters,
  };

  // Query Upstash Vector (mock implementation)
  const results = await vectorClient.query(searchOptions);

  // Filter by similarity threshold if provided
  if (query?.threshold) {
    return results.matches?.filter((match: any) => match.score >= query.threshold) || [];
  }

  return results.matches || [];
}

async function updateVectorData(data: any, options: any) {
  // Update is essentially a store operation with existing ID
  if (!data?.id) {
    throw new Error('ID is required for update operations');
  }

  return await storeVectorData(data, options);
}

async function deleteVectorData(data: any, options: any) {
  const vectorClient = getVectorClient();

  if (!data?.id) {
    throw new Error('ID is required for delete operations');
  }

  // Delete from Upstash Vector (mock implementation)
  return await vectorClient.delete([data.id], options?.namespace || 'default');
}

async function clearVectorNamespace(namespace?: string) {
  const vectorClient = getVectorClient();

  // Clear entire namespace (mock implementation)
  return await vectorClient.deleteAll(namespace || 'default');
}

// =============================================================================
// Session Cache Operations Implementation
// =============================================================================

async function storeSessionData(data: any) {
  const redisClient = getRedisClient();

  if (!data?.key || !data?.value) {
    throw new Error('Both key and value are required for session storage');
  }

  const ttl = data.ttl || 3600; // 1 hour default
  const sessionKey = `session:${data.key}`;

  // Store in Upstash Redis (mock implementation)
  return await redisClient.setex(sessionKey, ttl, JSON.stringify(data.value));
}

async function querySessionData(query: any) {
  const redisClient = getRedisClient();

  if (query?.sessionId) {
    // Get all keys for a session
    const pattern = `session:${query.sessionId}:*`;
    const keys = await redisClient.keys(pattern);
    const values = await Promise.all(
      keys.map((key) =>
        redisClient.get(key).then((val) => ({ key, value: JSON.parse(val || 'null') }))
      )
    );
    return values.filter((item) => item.value !== null);
  } else if (query?.keys) {
    // Get specific keys
    const sessionKeys = query.keys.map((key: string) => `session:${key}`);
    const values = await Promise.all(
      sessionKeys.map((key) =>
        redisClient.get(key).then((val) => ({ key, value: JSON.parse(val || 'null') }))
      )
    );
    return values.filter((item) => item.value !== null);
  } else {
    throw new Error('Either sessionId or keys are required for session queries');
  }
}

async function updateSessionData(data: any) {
  // Update is essentially a store operation
  return await storeSessionData(data);
}

async function deleteSessionData(data: any) {
  const redisClient = getRedisClient();

  if (!data?.key) {
    throw new Error('Key is required for session deletion');
  }

  const sessionKey = `session:${data.key}`;
  return await redisClient.del(sessionKey);
}

async function clearSessionData(sessionId?: string) {
  const redisClient = getRedisClient();

  if (sessionId) {
    // Clear specific session
    const pattern = `session:${sessionId}:*`;
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      return await redisClient.del(...keys);
    }
    return 0;
  } else {
    // Clear all sessions (dangerous operation)
    const keys = await redisClient.keys('session:*');
    if (keys.length > 0) {
      return await redisClient.del(...keys);
    }
    return 0;
  }
}

// =============================================================================
// General Cache Operations Implementation
// =============================================================================

async function storeGeneralData(data: any) {
  const redisClient = getRedisClient();

  if (!data?.key || !data?.value) {
    throw new Error('Both key and value are required for general storage');
  }

  const ttl = data.ttl || 1800; // 30 minutes default
  const cacheKey = `cache:${data.key}`;

  return await redisClient.setex(cacheKey, ttl, JSON.stringify(data.value));
}

async function queryGeneralData(query: any) {
  const redisClient = getRedisClient();

  if (query?.keys) {
    const cacheKeys = query.keys.map((key: string) => `cache:${key}`);
    const values = await Promise.all(
      cacheKeys.map((key) =>
        redisClient.get(key).then((val) => ({ key, value: JSON.parse(val || 'null') }))
      )
    );
    return values.filter((item) => item.value !== null);
  } else {
    throw new Error('Keys are required for general cache queries');
  }
}

async function updateGeneralData(data: any) {
  return await storeGeneralData(data);
}

async function deleteGeneralData(data: any) {
  const redisClient = getRedisClient();

  if (!data?.key) {
    throw new Error('Key is required for general cache deletion');
  }

  const cacheKey = `cache:${data.key}`;
  return await redisClient.del(cacheKey);
}

async function clearGeneralCache() {
  const redisClient = getRedisClient();

  const keys = await redisClient.keys('cache:*');
  if (keys.length > 0) {
    return await redisClient.del(...keys);
  }
  return 0;
}

// =============================================================================
// Client Utilities (Mock implementations for now)
// =============================================================================

function getVectorClient() {
  // Would return actual Upstash Vector client
  return {
    upsert: async (records: any) => ({ upsertedCount: records.length }),
    query: async (options: any) => ({ matches: [] }),
    delete: async (ids: string[], namespace: string) => ({ deletedCount: ids.length }),
    deleteAll: async (namespace: string) => ({ deletedCount: 0 }),
  };
}

function getRedisClient() {
  // Would return actual Upstash Redis client
  return {
    setex: async (key: string, ttl: number, value: string) => 'OK',
    get: async (key: string) => null,
    keys: async (pattern: string) => [],
    del: async (...keys: string[]) => keys.length,
  };
}

async function generateEmbedding(text: string): Promise<number[]> {
  // Would use actual embedding service (Jina.ai)
  return new Array(1536).fill(0).map(() => Math.random()); // Mock 1536-dim vector
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

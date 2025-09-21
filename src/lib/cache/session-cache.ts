/**
 * Session State Caching
 * Redis-based caching for session state and temporary data
 */

import { Redis } from '@upstash/redis';
import { config } from '../env';

/**
 * Cache configuration constants
 */
const CACHE_PREFIX = 'hylo:';
const SESSION_PREFIX = 'session:';
const WORKFLOW_PREFIX = 'workflow:';
const VECTOR_PREFIX = 'vector:';
const TEMP_PREFIX = 'temp:';

export const CACHE_CONFIG = {
  // Redis connection settings
  KEY_PREFIX: CACHE_PREFIX,
  SESSION_PREFIX,
  WORKFLOW_PREFIX,
  VECTOR_PREFIX,
  TEMP_PREFIX,

  // TTL settings (in seconds)
  SESSION_TTL: 24 * 60 * 60, // 24 hours
  WORKFLOW_TTL: 7 * 24 * 60 * 60, // 7 days
  VECTOR_CACHE_TTL: 60 * 60, // 1 hour
  TEMP_TTL: 15 * 60, // 15 minutes

  // Cache keys
  KEYS: {
    SESSION_DATA: (sessionId: string) => `${CACHE_PREFIX}${SESSION_PREFIX}${sessionId}`,
    WORKFLOW_STATE: (workflowId: string) => `${CACHE_PREFIX}${WORKFLOW_PREFIX}${workflowId}`,
    VECTOR_RESULTS: (queryHash: string) => `${CACHE_PREFIX}${VECTOR_PREFIX}results:${queryHash}`,
    TEMP_DATA: (key: string) => `${CACHE_PREFIX}${TEMP_PREFIX}${key}`,
    USER_SESSIONS: (userId: string) => `${CACHE_PREFIX}user:${userId}:sessions`,
    ACTIVE_WORKFLOWS: `${CACHE_PREFIX}active:workflows`,
    CACHE_STATS: `${CACHE_PREFIX}stats:cache`,
  },

  // Batch operations
  BATCH_SIZE: 100,
  MAX_CONCURRENT_OPERATIONS: 10,

  // Cleanup settings
  CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
  EXPIRED_KEY_LIMIT: 1000,
} as const;

/**
 * Cache entry interface
 */
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  ttl?: number;
  createdAt: string;
  updatedAt: string;
  accessCount: number;
  lastAccessed?: string;
}

/**
 * Session data interface
 */
export interface SessionData {
  sessionId: string;
  userId?: string;
  formData: any;
  workflowId?: string;
  progress: number;
  status: 'active' | 'completed' | 'expired';
  createdAt: string;
  updatedAt: string;
  metadata: {
    userAgent?: string;
    ip?: string;
    deviceType?: string;
    source?: string;
  };
}

/**
 * Cache statistics interface
 */
export interface CacheStats {
  totalKeys: number;
  memoryUsage: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  lastCleanup: string;
  keyDistribution: Record<string, number>;
}

/**
 * Session Cache Manager
 * Redis-based caching for session state and temporary data
 */
export class SessionCacheManager {
  private redis: Redis;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.redis = new Redis({
      url: config.upstash.redis.url,
      token: config.upstash.redis.token,
    });

    this.startCleanupInterval();
  }

  /**
   * Store session data
   */
  async storeSessionData(sessionData: SessionData): Promise<boolean> {
    try {
      const key = CACHE_CONFIG.KEYS.SESSION_DATA(sessionData.sessionId);
      const entry: CacheEntry<SessionData> = {
        key,
        value: sessionData,
        ttl: CACHE_CONFIG.SESSION_TTL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        accessCount: 0,
      };

      await this.redis.setex(key, CACHE_CONFIG.SESSION_TTL, JSON.stringify(entry));

      // Add to user's session list
      if (sessionData.userId) {
        await this.addUserSession(sessionData.userId, sessionData.sessionId);
      }

      console.log(`Stored session data: ${sessionData.sessionId}`);
      return true;
    } catch (error) {
      console.error(`Failed to store session data ${sessionData.sessionId}:`, error);
      return false;
    }
  }

  /**
   * Get session data
   */
  async getSessionData(sessionId: string): Promise<SessionData | null> {
    try {
      const key = CACHE_CONFIG.KEYS.SESSION_DATA(sessionId);
      const data = await this.redis.get(key);

      if (!data) return null;

      const entry: CacheEntry<SessionData> = JSON.parse(data as string);

      // Update access statistics
      await this.updateAccessStats(key, entry);

      return entry.value;
    } catch (error) {
      console.error(`Failed to get session data ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Update session data
   */
  async updateSessionData(sessionId: string, updates: Partial<SessionData>): Promise<boolean> {
    try {
      const existing = await this.getSessionData(sessionId);
      if (!existing) return false;

      const updated: SessionData = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      return this.storeSessionData(updated);
    } catch (error) {
      console.error(`Failed to update session data ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Delete session data
   */
  async deleteSessionData(sessionId: string): Promise<boolean> {
    try {
      const key = CACHE_CONFIG.KEYS.SESSION_DATA(sessionId);
      await this.redis.del(key);

      // Remove from user's session list
      const sessionData = await this.getSessionData(sessionId);
      if (sessionData?.userId) {
        await this.removeUserSession(sessionData.userId, sessionId);
      }

      console.log(`Deleted session data: ${sessionId}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete session data ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      const key = CACHE_CONFIG.KEYS.USER_SESSIONS(userId);
      const sessionIds = await this.redis.smembers(key);

      if (sessionIds.length === 0) return [];

      const sessions: SessionData[] = [];
      for (const sessionId of sessionIds) {
        const session = await this.getSessionData(sessionId);
        if (session) {
          sessions.push(session);
        }
      }

      return sessions.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      console.error(`Failed to get user sessions for ${userId}:`, error);
      return [];
    }
  }

  /**
   * Store workflow state in cache
   */
  async storeWorkflowState(workflowId: string, state: any, ttl?: number): Promise<boolean> {
    try {
      const key = CACHE_CONFIG.KEYS.WORKFLOW_STATE(workflowId);
      const entry: CacheEntry = {
        key,
        value: state,
        ttl: ttl || CACHE_CONFIG.WORKFLOW_TTL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        accessCount: 0,
      };

      await this.redis.setex(key, ttl || CACHE_CONFIG.WORKFLOW_TTL, JSON.stringify(entry));

      // Add to active workflows set
      await this.redis.sadd(CACHE_CONFIG.KEYS.ACTIVE_WORKFLOWS, workflowId);

      console.log(`Stored workflow state: ${workflowId}`);
      return true;
    } catch (error) {
      console.error(`Failed to store workflow state ${workflowId}:`, error);
      return false;
    }
  }

  /**
   * Get workflow state from cache
   */
  async getWorkflowState(workflowId: string): Promise<any | null> {
    try {
      const key = CACHE_CONFIG.KEYS.WORKFLOW_STATE(workflowId);
      const data = await this.redis.get(key);

      if (!data) return null;

      const entry: CacheEntry = JSON.parse(data as string);

      // Update access statistics
      await this.updateAccessStats(key, entry);

      return entry.value;
    } catch (error) {
      console.error(`Failed to get workflow state ${workflowId}:`, error);
      return null;
    }
  }

  /**
   * Delete workflow state
   */
  async deleteWorkflowState(workflowId: string): Promise<boolean> {
    try {
      const key = CACHE_CONFIG.KEYS.WORKFLOW_STATE(workflowId);
      await this.redis.del(key);

      // Remove from active workflows set
      await this.redis.srem(CACHE_CONFIG.KEYS.ACTIVE_WORKFLOWS, workflowId);

      console.log(`Deleted workflow state: ${workflowId}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete workflow state ${workflowId}:`, error);
      return false;
    }
  }

  /**
   * Cache vector search results
   */
  async cacheVectorResults(queryHash: string, results: any[], ttl?: number): Promise<boolean> {
    try {
      const key = CACHE_CONFIG.KEYS.VECTOR_RESULTS(queryHash);
      const entry: CacheEntry = {
        key,
        value: results,
        ttl: ttl || CACHE_CONFIG.VECTOR_CACHE_TTL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        accessCount: 0,
      };

      await this.redis.setex(key, ttl || CACHE_CONFIG.VECTOR_CACHE_TTL, JSON.stringify(entry));
      return true;
    } catch (error) {
      console.error(`Failed to cache vector results for ${queryHash}:`, error);
      return false;
    }
  }

  /**
   * Get cached vector results
   */
  async getCachedVectorResults(queryHash: string): Promise<any[] | null> {
    try {
      const key = CACHE_CONFIG.KEYS.VECTOR_RESULTS(queryHash);
      const data = await this.redis.get(key);

      if (!data) return null;

      const entry: CacheEntry = JSON.parse(data as string);

      // Update access statistics
      await this.updateAccessStats(key, entry);

      return entry.value;
    } catch (error) {
      console.error(`Failed to get cached vector results for ${queryHash}:`, error);
      return null;
    }
  }

  /**
   * Store temporary data
   */
  async storeTempData(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const cacheKey = CACHE_CONFIG.KEYS.TEMP_DATA(key);
      const entry: CacheEntry = {
        key: cacheKey,
        value,
        ttl: ttl || CACHE_CONFIG.TEMP_TTL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        accessCount: 0,
      };

      await this.redis.setex(cacheKey, ttl || CACHE_CONFIG.TEMP_TTL, JSON.stringify(entry));
      return true;
    } catch (error) {
      console.error(`Failed to store temp data ${key}:`, error);
      return false;
    }
  }

  /**
   * Get temporary data
   */
  async getTempData(key: string): Promise<any | null> {
    try {
      const cacheKey = CACHE_CONFIG.KEYS.TEMP_DATA(key);
      const data = await this.redis.get(cacheKey);

      if (!data) return null;

      const entry: CacheEntry = JSON.parse(data as string);
      return entry.value;
    } catch (error) {
      console.error(`Failed to get temp data ${key}:`, error);
      return null;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      // Simplified stats - Redis info might not be available in all environments
      const keys = await this.redis.keys(`${CACHE_CONFIG.KEY_PREFIX}*`);

      const keyDistribution: Record<string, number> = {};
      for (const key of keys.slice(0, 100)) {
        // Sample first 100 keys
        const type = key.split(':')[1] || 'unknown';
        keyDistribution[type] = (keyDistribution[type] || 0) + 1;
      }

      // Get stored stats if available
      const storedStats = await this.redis.get(CACHE_CONFIG.KEYS.CACHE_STATS);
      const parsedStats = storedStats ? JSON.parse(storedStats as string) : {};

      return {
        totalKeys: keys.length,
        memoryUsage: 0, // Placeholder - Redis info not available
        hitRate: parsedStats.hitRate || 0,
        missRate: parsedStats.missRate || 0,
        evictionCount: 0, // Placeholder - Redis info not available
        lastCleanup: parsedStats.lastCleanup || new Date().toISOString(),
        keyDistribution,
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        totalKeys: 0,
        memoryUsage: 0,
        hitRate: 0,
        missRate: 0,
        evictionCount: 0,
        lastCleanup: new Date().toISOString(),
        keyDistribution: {},
      };
    }
  }

  /**
   * Clear expired keys
   */
  async cleanupExpiredKeys(): Promise<number> {
    try {
      // Redis automatically expires keys, but we can manually clean up
      // This is a simplified cleanup - in production you might want more sophisticated cleanup
      const keys = await this.redis.keys(`${CACHE_CONFIG.KEY_PREFIX}*`);
      let cleanedCount = 0;

      for (const key of keys.slice(0, CACHE_CONFIG.EXPIRED_KEY_LIMIT)) {
        try {
          const ttl = await this.redis.ttl(key);
          if (ttl === -2) {
            // Key doesn't exist
            cleanedCount++;
          }
        } catch {
          // Ignore errors for individual keys
        }
      }

      // Update cleanup timestamp
      await this.redis.set(
        CACHE_CONFIG.KEYS.CACHE_STATS,
        JSON.stringify({
          lastCleanup: new Date().toISOString(),
        })
      );

      console.log(`Cleaned up ${cleanedCount} expired keys`);
      return cleanedCount;
    } catch (error) {
      console.error('Failed to cleanup expired keys:', error);
      return 0;
    }
  }

  /**
   * Clear all cache data (dangerous operation)
   */
  async clearAllCache(): Promise<boolean> {
    try {
      const keys = await this.redis.keys(`${CACHE_CONFIG.KEY_PREFIX}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      console.log(`Cleared ${keys.length} cache keys`);
      return true;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }

  /**
   * Health check for cache service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency?: number;
    error?: string;
    stats?: CacheStats;
  }> {
    const startTime = Date.now();

    try {
      await this.redis.ping();
      const stats = await this.getCacheStats();
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

  private async addUserSession(userId: string, sessionId: string): Promise<void> {
    const key = CACHE_CONFIG.KEYS.USER_SESSIONS(userId);
    await this.redis.sadd(key, sessionId);
    await this.redis.expire(key, CACHE_CONFIG.SESSION_TTL);
  }

  private async removeUserSession(userId: string, sessionId: string): Promise<void> {
    const key = CACHE_CONFIG.KEYS.USER_SESSIONS(userId);
    await this.redis.srem(key, sessionId);
  }

  private async updateAccessStats(key: string, entry: CacheEntry): Promise<void> {
    try {
      entry.accessCount++;
      entry.lastAccessed = new Date().toISOString();

      // Update the entry in Redis with new access stats
      await this.redis.setex(key, entry.ttl || CACHE_CONFIG.SESSION_TTL, JSON.stringify(entry));
    } catch (error) {
      // Don't fail the main operation for stats update
      console.warn(`Failed to update access stats for ${key}:`, error);
    }
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanupExpiredKeys();
      } catch (error) {
        console.error('Cleanup interval failed:', error);
      }
    }, CACHE_CONFIG.CLEANUP_INTERVAL);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

/**
 * Global cache manager instance
 */
export const sessionCacheManager = new SessionCacheManager();

/**
 * Convenience functions for common caching operations
 */

/**
 * Cache session data
 */
export async function cacheSessionData(sessionData: SessionData): Promise<boolean> {
  return sessionCacheManager.storeSessionData(sessionData);
}

/**
 * Get cached session data
 */
export async function getCachedSessionData(sessionId: string): Promise<SessionData | null> {
  return sessionCacheManager.getSessionData(sessionId);
}

/**
 * Cache workflow state
 */
export async function cacheWorkflowState(
  workflowId: string,
  state: any,
  ttl?: number
): Promise<boolean> {
  return sessionCacheManager.storeWorkflowState(workflowId, state, ttl);
}

/**
 * Get cached workflow state
 */
export async function getCachedWorkflowState(workflowId: string): Promise<any | null> {
  return sessionCacheManager.getWorkflowState(workflowId);
}

/**
 * Cache vector search results
 */
export async function cacheVectorSearchResults(
  queryHash: string,
  results: any[],
  ttl?: number
): Promise<boolean> {
  return sessionCacheManager.cacheVectorResults(queryHash, results, ttl);
}

/**
 * Get cached vector search results
 */
export async function getCachedVectorSearchResults(queryHash: string): Promise<any[] | null> {
  return sessionCacheManager.getCachedVectorResults(queryHash);
}

/**
 * Export types
 */

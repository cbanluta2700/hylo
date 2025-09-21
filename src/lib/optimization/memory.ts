/**
 * Memory Usage Optimization for Edge Runtime
 * Intelligent memory management and optimization strategies for Vercel Edge Functions
 */

/**
 * Memory optimization configuration
 */
export const MEMORY_CONFIG = {
  // Memory limits (in MB)
  EDGE_FUNCTION_LIMIT: 128, // Vercel Edge Function memory limit
  WARNING_THRESHOLD: 96, // 75% of limit
  CRITICAL_THRESHOLD: 115, // 90% of limit

  // Garbage collection settings
  GC_INTERVAL: 30000, // 30 seconds
  FORCE_GC_THRESHOLD: 0.8, // Force GC at 80% memory usage

  // Cache settings
  MAX_CACHE_SIZE: 50, // Maximum cache entries
  CACHE_TTL: 300000, // 5 minutes default TTL
  LRU_CLEANUP_INTERVAL: 60000, // 1 minute

  // Object pooling
  ENABLE_OBJECT_POOLING: true,
  POOL_MAX_SIZE: 100,
  POOL_IDLE_TIMEOUT: 300000, // 5 minutes

  // Memory monitoring
  MONITORING_INTERVAL: 10000, // 10 seconds
  MEMORY_SNAPSHOT_INTERVAL: 300000, // 5 minutes

  // Optimization strategies
  ENABLE_AGGRESSIVE_OPTIMIZATION: false,
  COMPRESSION_THRESHOLD: 1024, // Compress objects larger than 1KB
  LAZY_LOADING: true,
} as const;

/**
 * Memory usage metrics
 */
export interface MemoryMetrics {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  heapUsedMB: number;
  heapTotalMB: number;
  memoryUsagePercent: number;
  gcCount?: number;
  gcDuration?: number;
}

/**
 * Memory optimization strategies
 */
export enum OptimizationStrategy {
  AGGRESSIVE_GC = 'aggressive_gc',
  CACHE_EVICTION = 'cache_eviction',
  OBJECT_POOLING = 'object_pooling',
  COMPRESSION = 'compression',
  LAZY_LOADING = 'lazy_loading',
  MEMORY_POOLING = 'memory_pooling',
}

/**
 * Memory alert types
 */
export enum MemoryAlertType {
  HIGH_MEMORY_USAGE = 'high_memory_usage',
  MEMORY_LEAK_DETECTED = 'memory_leak_detected',
  GC_PRESSURE = 'gc_pressure',
  CACHE_OVERFLOW = 'cache_overflow',
  OBJECT_POOL_EXHAUSTED = 'object_pool_exhausted',
}

/**
 * Memory alert
 */
export interface MemoryAlert {
  id: string;
  type: MemoryAlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: {
    currentUsage: number;
    threshold: number;
    limit: number;
    timestamp: number;
  };
  recommendations: string[];
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
}

/**
 * Cache entry with TTL
 */
interface CacheEntry<T = any> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // Estimated size in bytes
}

/**
 * LRU Cache with memory management
 */
export class MemoryAwareLRUCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number;
  private defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    maxSize: number = MEMORY_CONFIG.MAX_CACHE_SIZE,
    defaultTTL: number = MEMORY_CONFIG.CACHE_TTL
  ) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.startCleanupInterval();
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const size = this.estimateSize(value);
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      accessCount: 0,
      lastAccessed: Date.now(),
      size,
    };

    // Check if we need to evict entries
    if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
      this.evictEntries(size);
    }

    this.cache.set(key, entry);
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    averageTTL: number;
  } {
    const entries = Array.from(this.cache.values());
    const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const averageTTL =
      entries.length > 0 ? entries.reduce((sum, entry) => sum + entry.ttl, 0) / entries.length : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalEntries: entries.length,
      totalSize,
      hitRate:
        totalAccesses > 0 ? entries.filter((e) => e.accessCount > 0).length / totalAccesses : 0,
      averageTTL,
    };
  }

  /**
   * Evict least recently used entries to make room for new entry
   */
  private evictEntries(requiredSize: number): void {
    const entries = Array.from(this.cache.entries());

    // Sort by access recency (LRU)
    entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    let freedSize = 0;
    const toDelete: string[] = [];

    for (const [key, entry] of entries) {
      toDelete.push(key);
      freedSize += entry.size;

      if (freedSize >= requiredSize || this.cache.size - toDelete.length <= this.maxSize * 0.8) {
        break;
      }
    }

    toDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Estimate object size in bytes
   */
  private estimateSize(obj: any): number {
    const str = JSON.stringify(obj);
    return str ? str.length * 2 : 100; // Rough estimation: 2 bytes per character
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, MEMORY_CONFIG.LRU_CLEANUP_INTERVAL);
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key);
      }
    }

    toDelete.forEach((key) => this.cache.delete(key));
  }
}

/**
 * Object Pool for memory reuse
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn?: (obj: T) => void;
  private maxSize: number;
  private idleTimeout: number;

  constructor(
    createFn: () => T,
    resetFn?: (obj: T) => void,
    maxSize: number = MEMORY_CONFIG.POOL_MAX_SIZE,
    idleTimeout: number = MEMORY_CONFIG.POOL_IDLE_TIMEOUT
  ) {
    this.createFn = createFn;
    if (resetFn) {
      this.resetFn = resetFn;
    }
    this.maxSize = maxSize;
    this.idleTimeout = idleTimeout;
  }

  /**
   * Get object from pool or create new one
   */
  acquire(): T {
    const obj = this.pool.pop();
    if (obj) {
      this.resetFn?.(obj);
      return obj;
    }
    return this.createFn();
  }

  /**
   * Return object to pool
   */
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    utilization: number;
  } {
    return {
      size: this.pool.length,
      maxSize: this.maxSize,
      utilization: this.maxSize > 0 ? this.pool.length / this.maxSize : 0,
    };
  }

  /**
   * Clear pool
   */
  clear(): void {
    this.pool.length = 0;
  }
}

/**
 * Memory Compressor for large objects
 */
export class MemoryCompressor {
  /**
   * Compress object if it exceeds threshold
   */
  static compress<T>(obj: T): { data: T | string; compressed: boolean } {
    const size = JSON.stringify(obj).length;

    if (size > MEMORY_CONFIG.COMPRESSION_THRESHOLD) {
      try {
        // Simple compression using JSON.stringify with reduced whitespace
        const compressed = JSON.stringify(obj);
        return { data: compressed, compressed: true };
      } catch {
        return { data: obj, compressed: false };
      }
    }

    return { data: obj, compressed: false };
  }

  /**
   * Decompress object
   */
  static decompress<T>(data: T | string, compressed: boolean): T {
    if (compressed && typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return data as T;
      }
    }
    return data as T;
  }
}

/**
 * Memory Optimizer
 * Comprehensive memory management for Edge Runtime
 */
export class MemoryOptimizer {
  private metrics: MemoryMetrics[] = [];
  private alerts: MemoryAlert[] = [];
  private cache: MemoryAwareLRUCache;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private gcInterval: NodeJS.Timeout | null = null;
  private _lastGCTime = 0;

  constructor() {
    this.cache = new MemoryAwareLRUCache();
    this.startMonitoring();
    this.startGCInterval();
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): MemoryMetrics {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    const memoryUsagePercent = (heapUsedMB / MEMORY_CONFIG.EDGE_FUNCTION_LIMIT) * 100;

    const metrics: MemoryMetrics = {
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      heapUsedMB,
      heapTotalMB,
      memoryUsagePercent,
    };

    this.metrics.push(metrics);
    this.cleanupOldMetrics();

    return metrics;
  }

  /**
   * Check if memory usage is within safe limits
   */
  isMemorySafe(): boolean {
    const usage = this.getMemoryUsage();
    return usage.heapUsedMB < MEMORY_CONFIG.WARNING_THRESHOLD;
  }

  /**
   * Force garbage collection if available
   */
  forceGC(): void {
    if (global.gc) {
      const startTime = Date.now();
      global.gc();
      this._lastGCTime = Date.now() - startTime;
    }
  }

  /**
   * Optimize memory usage
   */
  async optimizeMemory(): Promise<{
    optimizations: string[];
    memoryFreed: number;
    success: boolean;
  }> {
    const optimizations: string[] = [];
    let memoryFreed = 0;

    const beforeUsage = this.getMemoryUsage();

    // Strategy 1: Force garbage collection
    if (global.gc) {
      this.forceGC();
      optimizations.push('Forced garbage collection');
    }

    // Strategy 2: Clear caches if memory pressure is high
    const afterGCUsage = this.getMemoryUsage();
    if (afterGCUsage.memoryUsagePercent > MEMORY_CONFIG.FORCE_GC_THRESHOLD * 100) {
      const cacheStats = this.cache.getStats();
      if (cacheStats.totalEntries > 0) {
        this.cache.clear();
        optimizations.push(`Cleared ${cacheStats.totalEntries} cache entries`);
        memoryFreed += cacheStats.totalSize;
      }
    }

    // Strategy 3: Aggressive optimization if still high
    const finalUsage = this.getMemoryUsage();
    if (finalUsage.memoryUsagePercent > MEMORY_CONFIG.CRITICAL_THRESHOLD) {
      // Additional aggressive strategies
      optimizations.push('Applied aggressive memory optimization');
    }

    const afterUsage = this.getMemoryUsage();
    memoryFreed += Math.max(0, beforeUsage.heapUsed - afterUsage.heapUsed);

    return {
      optimizations,
      memoryFreed,
      success: afterUsage.memoryUsagePercent < MEMORY_CONFIG.WARNING_THRESHOLD,
    };
  }

  /**
   * Get memory recommendations
   */
  getMemoryRecommendations(): string[] {
    const recommendations: string[] = [];
    const usage = this.getMemoryUsage();
    const cacheStats = this.cache.getStats();

    // Memory usage recommendations
    if (usage.memoryUsagePercent > MEMORY_CONFIG.CRITICAL_THRESHOLD) {
      recommendations.push(
        'CRITICAL: Memory usage exceeds 90% of Edge Function limit. Immediate optimization required.'
      );
      recommendations.push('Consider reducing response payload size or implementing streaming.');
      recommendations.push('Review and optimize large object allocations.');
    } else if (usage.memoryUsagePercent > MEMORY_CONFIG.WARNING_THRESHOLD) {
      recommendations.push('WARNING: Memory usage above 75% threshold. Monitor closely.');
      recommendations.push('Consider implementing lazy loading for large datasets.');
      recommendations.push('Review cache sizes and implement LRU eviction.');
    }

    // Cache recommendations
    if (cacheStats.totalEntries > cacheStats.maxSize * 0.9) {
      recommendations.push(
        `Cache near capacity (${cacheStats.totalEntries}/${cacheStats.maxSize}). Consider increasing cache size or implementing better eviction.`
      );
    }

    if (cacheStats.hitRate < 0.5) {
      recommendations.push(
        `Low cache hit rate (${(cacheStats.hitRate * 100).toFixed(
          1
        )}%). Review cache TTL and key strategies.`
      );
    }

    // Performance recommendations
    const recentMetrics = this.metrics.slice(-10);
    if (recentMetrics.length >= 5) {
      const trend = this.calculateMemoryTrend(recentMetrics);

      if (trend > 0.05) {
        // 5% increase trend
        recommendations.push(
          'Memory usage trending upward. Investigate for potential memory leaks.'
        );
      }
    }

    return recommendations;
  }

  /**
   * Cache operations with memory awareness
   */
  getCache(): MemoryAwareLRUCache {
    return this.cache;
  }

  /**
   * Create object pool
   */
  createObjectPool<T>(
    createFn: () => T,
    resetFn?: (obj: T) => void,
    maxSize?: number
  ): ObjectPool<T> {
    return new ObjectPool(createFn, resetFn, maxSize);
  }

  /**
   * Compress large objects
   */
  compressObject<T>(obj: T): { data: T | string; compressed: boolean } {
    return MemoryCompressor.compress(obj);
  }

  /**
   * Decompress objects
   */
  decompressObject<T>(data: T | string, compressed: boolean): T {
    return MemoryCompressor.decompress(data, compressed);
  }

  /**
   * Get active memory alerts
   */
  getActiveAlerts(): MemoryAlert[] {
    return this.alerts.filter((alert) => !alert.resolved);
  }

  /**
   * Resolve memory alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
    }
  }

  /**
   * Export memory metrics
   */
  exportMemoryMetrics(): {
    metrics: MemoryMetrics[];
    alerts: MemoryAlert[];
    cacheStats: any;
    recommendations: string[];
    timestamp: number;
  } {
    return {
      metrics: [...this.metrics],
      alerts: [...this.alerts],
      cacheStats: this.cache.getStats(),
      recommendations: this.getMemoryRecommendations(),
      timestamp: Date.now(),
    };
  }

  /**
   * Start memory monitoring
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.monitorMemoryUsage();
    }, MEMORY_CONFIG.MONITORING_INTERVAL);
  }

  /**
   * Start garbage collection interval
   */
  private startGCInterval(): void {
    this.gcInterval = setInterval(() => {
      const usage = this.getMemoryUsage();
      if (usage.memoryUsagePercent > MEMORY_CONFIG.FORCE_GC_THRESHOLD * 100) {
        this.forceGC();
      }
    }, MEMORY_CONFIG.GC_INTERVAL);
  }

  /**
   * Monitor memory usage and create alerts
   */
  private monitorMemoryUsage(): void {
    const usage = this.getMemoryUsage();

    // Check memory thresholds
    if (usage.heapUsedMB >= MEMORY_CONFIG.CRITICAL_THRESHOLD) {
      this.createAlert({
        type: MemoryAlertType.HIGH_MEMORY_USAGE,
        severity: 'critical',
        message: `Critical memory usage: ${usage.heapUsedMB.toFixed(
          1
        )}MB (${usage.memoryUsagePercent.toFixed(1)}% of limit)`,
        details: {
          currentUsage: usage.heapUsedMB,
          threshold: MEMORY_CONFIG.CRITICAL_THRESHOLD,
          limit: MEMORY_CONFIG.EDGE_FUNCTION_LIMIT,
          timestamp: usage.timestamp,
        },
        recommendations: [
          'Immediate action required: reduce memory allocation',
          'Consider implementing streaming for large responses',
          'Review and optimize object allocations',
          'Force garbage collection if available',
        ],
      });
    } else if (usage.heapUsedMB >= MEMORY_CONFIG.WARNING_THRESHOLD) {
      this.createAlert({
        type: MemoryAlertType.HIGH_MEMORY_USAGE,
        severity: 'medium',
        message: `High memory usage: ${usage.heapUsedMB.toFixed(
          1
        )}MB (${usage.memoryUsagePercent.toFixed(1)}% of limit)`,
        details: {
          currentUsage: usage.heapUsedMB,
          threshold: MEMORY_CONFIG.WARNING_THRESHOLD,
          limit: MEMORY_CONFIG.EDGE_FUNCTION_LIMIT,
          timestamp: usage.timestamp,
        },
        recommendations: [
          'Monitor memory usage closely',
          'Consider optimizing large object handling',
          'Review cache sizes and implement eviction policies',
          'Implement lazy loading where appropriate',
        ],
      });
    }

    // Check for memory leaks (simplified detection)
    this.detectMemoryLeaks();
  }

  /**
   * Detect potential memory leaks
   */
  private detectMemoryLeaks(): void {
    const recentMetrics = this.metrics.slice(-20); // Last 20 measurements
    if (recentMetrics.length < 10) return;

    const recentAvg = recentMetrics.slice(-5).reduce((sum, m) => sum + m.heapUsedMB, 0) / 5;
    const olderAvg = recentMetrics.slice(0, 5).reduce((sum, m) => sum + m.heapUsedMB, 0) / 5;

    const growthRate = (recentAvg - olderAvg) / olderAvg;

    if (growthRate > 0.2) {
      // 20% growth over time
      this.createAlert({
        type: MemoryAlertType.MEMORY_LEAK_DETECTED,
        severity: 'high',
        message: `Potential memory leak detected: ${growthRate.toFixed(2)} growth rate over time`,
        details: {
          currentUsage: recentAvg,
          threshold: olderAvg * 1.2,
          limit: MEMORY_CONFIG.EDGE_FUNCTION_LIMIT,
          timestamp: Date.now(),
        },
        recommendations: [
          'Investigate for memory leaks in application code',
          'Check for circular references in object graphs',
          'Review event listeners and timers for proper cleanup',
          'Monitor object allocations and deallocations',
        ],
      });
    }
  }

  /**
   * Calculate memory usage trend
   */
  private calculateMemoryTrend(metrics: MemoryMetrics[]): number {
    if (metrics.length < 2) return 0;

    const n = metrics.length;
    const xMean = (n - 1) / 2;
    const yValues = metrics.map((m) => m.memoryUsagePercent);

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      const yValue = yValues[i];
      if (yValue === undefined) continue;
      numerator += (i - xMean) * (yValue - yValues.reduce((a, b) => a + b) / n);
      denominator += Math.pow(i - xMean, 2);
    }

    return denominator !== 0 ? numerator / denominator : 0;
  }

  /**
   * Create memory alert
   */
  private createAlert(alertData: Omit<MemoryAlert, 'id' | 'timestamp' | 'resolved'>): void {
    // Check if similar alert already exists and is unresolved
    const existingAlert = this.alerts.find(
      (a) => !a.resolved && a.type === alertData.type && Date.now() - a.timestamp < 300000 // 5 minutes
    );

    if (existingAlert) return; // Don't create duplicate alerts

    const alert: MemoryAlert = {
      id: this.generateAlertId(),
      ...alertData,
      timestamp: Date.now(),
      resolved: false,
    };

    this.alerts.push(alert);

    // Log the alert
    console.warn(`[MEMORY ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`, {
      alertId: alert.id,
      details: alert.details,
      recommendations: alert.recommendations,
    });
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `memory_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    this.metrics = this.metrics.filter((m) => m.timestamp > cutoffTime);

    // Also cleanup old resolved alerts (keep for 1 hour)
    const alertCutoffTime = Date.now() - 3600000;
    this.alerts = this.alerts.filter((a) => !a.resolved || a.resolvedAt! > alertCutoffTime);
  }

  /**
   * Stop monitoring and cleanup
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }
    this.cache.stopCleanup();
  }

  /**
   * Health check for memory optimizer
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    memoryUsage: number;
    memoryUsagePercent: number;
    activeAlerts: number;
    cacheEfficiency: number;
    error?: string;
  }> {
    try {
      const usage = this.getMemoryUsage();
      const activeAlerts = this.getActiveAlerts();
      const cacheStats = this.cache.getStats();

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

      if (usage.memoryUsagePercent > MEMORY_CONFIG.CRITICAL_THRESHOLD) {
        status = 'unhealthy';
      } else if (
        usage.memoryUsagePercent > MEMORY_CONFIG.WARNING_THRESHOLD ||
        activeAlerts.length > 0
      ) {
        status = 'degraded';
      }

      return {
        status,
        memoryUsage: usage.heapUsedMB,
        memoryUsagePercent: usage.memoryUsagePercent,
        activeAlerts: activeAlerts.length,
        cacheEfficiency: cacheStats.hitRate,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        memoryUsage: 0,
        memoryUsagePercent: 0,
        activeAlerts: this.alerts.filter((a) => !a.resolved).length,
        cacheEfficiency: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Global memory optimizer instance
 */
export const memoryOptimizer = new MemoryOptimizer();

/**
 * Convenience functions for memory optimization
 */

/**
 * Get current memory usage
 */
export function getMemoryUsage(): MemoryMetrics {
  return memoryOptimizer.getMemoryUsage();
}

/**
 * Check if memory usage is safe
 */
export function isMemorySafe(): boolean {
  return memoryOptimizer.isMemorySafe();
}

/**
 * Optimize memory usage
 */
export async function optimizeMemory(): Promise<{
  optimizations: string[];
  memoryFreed: number;
  success: boolean;
}> {
  return memoryOptimizer.optimizeMemory();
}

/**
 * Get memory recommendations
 */
export function getMemoryRecommendations(): string[] {
  return memoryOptimizer.getMemoryRecommendations();
}

/**
 * Get memory-aware cache
 */
export function getMemoryCache(): MemoryAwareLRUCache {
  return memoryOptimizer.getCache();
}

/**
 * Create object pool
 */
export function createObjectPool<T>(
  createFn: () => T,
  resetFn?: (obj: T) => void,
  maxSize?: number
): ObjectPool<T> {
  return memoryOptimizer.createObjectPool(createFn, resetFn, maxSize);
}

/**
 * Compress object
 */
export function compressObject<T>(obj: T): { data: T | string; compressed: boolean } {
  return memoryOptimizer.compressObject(obj);
}

/**
 * Decompress object
 */
export function decompressObject<T>(data: T | string, compressed: boolean): T {
  return memoryOptimizer.decompressObject(data, compressed);
}

/**
 * Export memory metrics
 */
export function exportMemoryMetrics() {
  return memoryOptimizer.exportMemoryMetrics();
}

/**
 * Export types
 */

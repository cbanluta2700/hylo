import { beforeEach, afterEach } from 'vitest';
import { faker } from '@faker-js/faker';

/**
 * Database Testing Utilities for AI Multi-Agent Workflow Integration
 * 
 * Provides comprehensive database mocking, session management, and cleanup utilities
 * for testing the multi-agent AI travel planning system with proper isolation and state management.
 * 
 * Features:
 * - Session store mocking with realistic travel session data
 * - Vector database mock utilities for LangChain embeddings
 * - Redis cache simulation and clearing
 * - Database connection health checks
 * - Travel workflow state management
 */

// ==============================================
// Types and Interfaces
// ==============================================

export interface TravelSession {
  id: string;
  userId?: string;
  formData?: Record<string, any>;
  workflowState: 'planning' | 'gathering' | 'strategizing' | 'compiling' | 'completed' | 'error';
  agentOutputs: {
    contentPlanner?: string;
    infoGatherer?: Array<{ url: string; content: string; relevance: number }>;
    strategist?: string;
    contentCompiler?: string;
  };
  vectorEmbeddings?: Array<{ content: string; embedding: number[]; metadata: Record<string, any> }>;
  cost: {
    total: number;
    breakdown: { [provider: string]: number };
  };
  timestamps: {
    created: Date;
    lastUpdated: Date;
    completed?: Date;
  };
  metadata: Record<string, any>;
}

export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    source?: string;
    url?: string;
    relevance?: number;
    travelCategory?: 'accommodation' | 'activities' | 'dining' | 'transportation' | 'general';
    destination?: string;
    lastUpdated?: Date;
  };
}

export interface DatabaseHealth {
  connected: boolean;
  latency: number;
  lastCheck: Date;
  version?: string;
  errors?: string[];
}

export interface CacheEntry {
  key: string;
  value: any;
  ttl: number; // Time to live in seconds
  created: Date;
}

// ==============================================
// Mock Session Store
// ==============================================

export class MockSessionStore {
  private sessions: Map<string, TravelSession> = new Map();
  private connectionHealth: DatabaseHealth = {
    connected: true,
    latency: faker.number.int({ min: 10, max: 100 }),
    lastCheck: new Date()
  };

  constructor() {
    this.initializeWithSampleSessions();
  }

  private initializeWithSampleSessions(): void {
    // Add some realistic sample sessions for testing
    const sampleSessions: Partial<TravelSession>[] = [
      {
        id: 'session-1',
        userId: 'user-123',
        workflowState: 'completed',
        formData: {
          destination: 'Paris, France',
          startDate: '2024-06-15',
          endDate: '2024-06-20',
          adults: 2,
          children: 0,
          budget: 3000,
          travelStyle: 'cultural'
        }
      },
      {
        id: 'session-2',
        userId: 'user-456',
        workflowState: 'strategizing',
        formData: {
          destination: 'Tokyo, Japan',
          startDate: '2024-07-01',
          endDate: '2024-07-10',
          adults: 1,
          children: 1,
          budget: 5000,
          travelStyle: 'adventure'
        }
      }
    ];

    sampleSessions.forEach(session => {
      this.sessions.set(session.id!, this.createRealisticSession(session));
    });
  }

  private createRealisticSession(partial: Partial<TravelSession>): TravelSession {
    const now = new Date();
    return {
      id: partial.id || faker.string.uuid(),
      userId: partial.userId || faker.string.uuid(),
      formData: partial.formData || {},
      workflowState: partial.workflowState || 'planning',
      agentOutputs: {
        ...(partial.workflowState !== 'planning' && { contentPlanner: faker.lorem.paragraphs(2) }),
        ...(partial.workflowState === 'completed' && {
          infoGatherer: [
            {
              url: faker.internet.url(),
              content: faker.lorem.paragraphs(1),
              relevance: faker.number.float({ min: 0.7, max: 1.0, fractionDigits: 2 })
            }
          ]
        }),
        ...(['strategizing', 'compiling', 'completed'].includes(partial.workflowState!) && { 
          strategist: faker.lorem.paragraphs(3) 
        }),
        ...(partial.workflowState === 'completed' && { 
          contentCompiler: faker.lorem.paragraphs(5) 
        })
      },
      vectorEmbeddings: partial.workflowState === 'completed' ? this.generateMockEmbeddings() : [],
      cost: {
        total: faker.number.float({ min: 0.05, max: 2.50, fractionDigits: 4 }),
        breakdown: {
          groq: faker.number.float({ min: 0.01, max: 0.50, fractionDigits: 4 }),
          cerebras: faker.number.float({ min: 0.005, max: 0.30, fractionDigits: 4 }),
          google: faker.number.float({ min: 0.02, max: 1.00, fractionDigits: 4 })
        }
      },
      timestamps: {
        created: faker.date.past(),
        lastUpdated: now,
        ...(partial.workflowState === 'completed' && { completed: faker.date.recent() })
      },
      metadata: {
        userAgent: faker.internet.userAgent(),
        ipAddress: faker.internet.ip(),
        sessionVersion: '2.1.0'
      }
    };
  }

  private generateMockEmbeddings(): Array<{ content: string; embedding: number[]; metadata: Record<string, any> }> {
    const embeddings = [];
    const count = faker.number.int({ min: 3, max: 8 });
    
    for (let i = 0; i < count; i++) {
      embeddings.push({
        content: faker.lorem.paragraph(),
        embedding: Array.from({ length: 1536 }, () => faker.number.float({ min: -1, max: 1, fractionDigits: 6 })),
        metadata: {
          source: faker.internet.url(),
          travelCategory: faker.helpers.arrayElement(['accommodation', 'activities', 'dining', 'transportation', 'general']),
          relevance: faker.number.float({ min: 0.6, max: 1.0, fractionDigits: 3 })
        }
      });
    }
    
    return embeddings;
  }

  // Session Management Methods
  async createSession(sessionData: Partial<TravelSession>): Promise<TravelSession> {
    await this.simulateDelay();
    const session = this.createRealisticSession(sessionData);
    this.sessions.set(session.id, session);
    return session;
  }

  async getSession(sessionId: string): Promise<TravelSession | null> {
    await this.simulateDelay();
    return this.sessions.get(sessionId) || null;
  }

  async updateSession(sessionId: string, updates: Partial<TravelSession>): Promise<TravelSession | null> {
    await this.simulateDelay();
    const existing = this.sessions.get(sessionId);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      timestamps: {
        ...existing.timestamps,
        lastUpdated: new Date()
      }
    };
    
    this.sessions.set(sessionId, updated);
    return updated;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    await this.simulateDelay();
    return this.sessions.delete(sessionId);
  }

  async listSessions(userId?: string, limit: number = 10): Promise<TravelSession[]> {
    await this.simulateDelay();
    let sessions = Array.from(this.sessions.values());
    
    if (userId) {
      sessions = sessions.filter(s => s.userId === userId);
    }
    
    return sessions
      .sort((a, b) => b.timestamps.created.getTime() - a.timestamps.created.getTime())
      .slice(0, limit);
  }

  // Workflow State Management
  async updateWorkflowState(sessionId: string, state: TravelSession['workflowState'], agentOutput?: { agent: string; content: any }): Promise<boolean> {
    await this.simulateDelay();
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.workflowState = state;
    session.timestamps.lastUpdated = new Date();

    if (agentOutput) {
      (session.agentOutputs as any)[agentOutput.agent] = agentOutput.content;
    }

    if (state === 'completed') {
      session.timestamps.completed = new Date();
    }

    return true;
  }

  // Health and Utilities
  async checkHealth(): Promise<DatabaseHealth> {
    const start = Date.now();
    await this.simulateDelay();
    const latency = Date.now() - start;

    this.connectionHealth = {
      connected: true,
      latency,
      lastCheck: new Date(),
      version: '1.0.0-mock'
    };

    return this.connectionHealth;
  }

  async clearAllSessions(): Promise<number> {
    const count = this.sessions.size;
    this.sessions.clear();
    this.initializeWithSampleSessions(); // Keep sample data for consistent testing
    return count;
  }

  getSessionCount(): number {
    return this.sessions.size;
  }

  private async simulateDelay(): Promise<void> {
    const delay = faker.number.int({ min: 10, max: 50 });
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// ==============================================
// Mock Vector Database
// ==============================================

export class MockVectorDatabase {
  private documents: Map<string, VectorDocument> = new Map();
  private collections: Map<string, Set<string>> = new Map();
  private isConnected: boolean = true;

  constructor() {
    this.initializeWithSampleDocuments();
  }

  private initializeWithSampleDocuments(): void {
    const sampleDocs: Partial<VectorDocument>[] = [
      {
        content: 'Best restaurants in Paris for authentic French cuisine',
        metadata: {
          travelCategory: 'dining',
          destination: 'Paris, France',
          relevance: 0.95
        }
      },
      {
        content: 'Top cultural attractions and museums in Tokyo',
        metadata: {
          travelCategory: 'activities',
          destination: 'Tokyo, Japan',
          relevance: 0.88
        }
      },
      {
        content: 'Family-friendly accommodations with pools in Barcelona',
        metadata: {
          travelCategory: 'accommodation',
          destination: 'Barcelona, Spain',
          relevance: 0.92
        }
      }
    ];

    sampleDocs.forEach(doc => {
      const fullDoc = this.createRealisticDocument(doc);
      this.documents.set(fullDoc.id, fullDoc);
    });
  }

  private createRealisticDocument(partial: Partial<VectorDocument>): VectorDocument {
    return {
      id: partial.id || faker.string.uuid(),
      content: partial.content || faker.lorem.paragraph(),
      embedding: this.generateMockEmbedding(),
      metadata: {
        source: faker.internet.url(),
        url: faker.internet.url(),
        relevance: faker.number.float({ min: 0.6, max: 1.0, fractionDigits: 3 }),
        travelCategory: faker.helpers.arrayElement(['accommodation', 'activities', 'dining', 'transportation', 'general']),
        destination: faker.location.city() + ', ' + faker.location.country(),
        lastUpdated: new Date(),
        ...partial.metadata
      }
    };
  }

  private generateMockEmbedding(): number[] {
    // Generate realistic 1536-dimensional embedding (OpenAI ada-002 format)
    return Array.from({ length: 1536 }, () => faker.number.float({ min: -1, max: 1, fractionDigits: 6 }));
  }

  // Vector Database Methods
  async addDocument(content: string, metadata: Record<string, any> = {}, collection: string = 'default'): Promise<VectorDocument> {
    await this.simulateDelay();
    const document = this.createRealisticDocument({ content, metadata });
    
    this.documents.set(document.id, document);
    
    if (!this.collections.has(collection)) {
      this.collections.set(collection, new Set());
    }
    this.collections.get(collection)!.add(document.id);
    
    return document;
  }

  async searchSimilar(_queryEmbedding: number[], topK: number = 5, threshold: number = 0.7): Promise<Array<{ document: VectorDocument; similarity: number }>> {
    await this.simulateDelay();
    
    const results: Array<{ document: VectorDocument; similarity: number }> = [];
    
    for (const doc of this.documents.values()) {
      // Simulate cosine similarity calculation
      const similarity = faker.number.float({ min: threshold, max: 1.0, fractionDigits: 3 });
      
      if (similarity >= threshold) {
        results.push({ document: doc, similarity });
      }
    }
    
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  async searchByText(query: string, topK: number = 5): Promise<Array<{ document: VectorDocument; score: number }>> {
    await this.simulateDelay();
    
    const results: Array<{ document: VectorDocument; score: number }> = [];
    const queryLower = query.toLowerCase();
    
    for (const doc of this.documents.values()) {
      const contentLower = doc.content.toLowerCase();
      let score = 0;
      
      // Simple text matching score
      if (contentLower.includes(queryLower)) {
        score = 0.9;
      } else {
        const queryWords = queryLower.split(' ');
        const matchedWords = queryWords.filter(word => contentLower.includes(word)).length;
        score = matchedWords / queryWords.length;
      }
      
      if (score > 0.3) {
        results.push({ document: doc, score });
      }
    }
    
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  async getDocument(documentId: string): Promise<VectorDocument | null> {
    await this.simulateDelay();
    return this.documents.get(documentId) || null;
  }

  async deleteDocument(documentId: string): Promise<boolean> {
    await this.simulateDelay();
    const deleted = this.documents.delete(documentId);
    
    // Remove from all collections
    for (const docIds of this.collections.values()) {
      docIds.delete(documentId);
    }
    
    return deleted;
  }

  async clearCollection(collectionName: string = 'default'): Promise<number> {
    const docIds = this.collections.get(collectionName);
    if (!docIds) return 0;
    
    const count = docIds.size;
    
    for (const docId of docIds) {
      this.documents.delete(docId);
    }
    
    docIds.clear();
    return count;
  }

  async clearAllDocuments(): Promise<number> {
    const count = this.documents.size;
    this.documents.clear();
    this.collections.clear();
    this.initializeWithSampleDocuments();
    return count;
  }

  // Connection Management
  async connect(): Promise<void> {
    await this.simulateDelay();
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    await this.simulateDelay();
    this.isConnected = false;
  }

  async checkHealth(): Promise<DatabaseHealth> {
    const start = Date.now();
    await this.simulateDelay();
    const latency = Date.now() - start;

    return {
      connected: this.isConnected,
      latency,
      lastCheck: new Date(),
      version: '2.0.0-mock'
    };
  }

  getDocumentCount(): number {
    return this.documents.size;
  }

  getCollections(): string[] {
    return Array.from(this.collections.keys());
  }

  private async simulateDelay(): Promise<void> {
    const delay = faker.number.int({ min: 20, max: 100 });
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// ==============================================
// Mock Redis Cache
// ==============================================

export class MockRedisCache {
  private cache: Map<string, CacheEntry> = new Map();
  private isConnected: boolean = true;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupInterval();
    this.initializeWithSampleData();
  }

  private initializeWithSampleData(): void {
    // Add some sample cache entries
    this.setSync('travel:destinations:popular', ['Paris', 'Tokyo', 'New York', 'London'], 3600);
    this.setSync('workflow:agents:status', { contentPlanner: 'active', infoGatherer: 'active' }, 1800);
    this.setSync('user:session:abc123', { userId: 'user-456', lastActivity: new Date().toISOString() }, 7200);
  }

  private startCleanupInterval(): void {
    // Clean up expired entries every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 30000);
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      const expirationTime = entry.created.getTime() + (entry.ttl * 1000);
      if (now > expirationTime) {
        this.cache.delete(key);
      }
    }
  }

  private setSync(key: string, value: any, ttl: number = 3600): void {
    this.cache.set(key, {
      key,
      value: JSON.parse(JSON.stringify(value)), // Deep clone
      ttl,
      created: new Date()
    });
  }

  // Redis Cache Methods
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.simulateDelay();
    this.setSync(key, value, ttl);
  }

  async get<T = any>(key: string): Promise<T | null> {
    await this.simulateDelay();
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    const now = Date.now();
    const expirationTime = entry.created.getTime() + (entry.ttl * 1000);
    
    if (now > expirationTime) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value as T;
  }

  async delete(key: string): Promise<boolean> {
    await this.simulateDelay();
    return this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    await this.simulateDelay();
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    
    // Check if expired
    const now = Date.now();
    const expirationTime = entry.created.getTime() + (entry.ttl * 1000);
    
    if (now > expirationTime) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    await this.simulateDelay();
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    
    entry.ttl = ttl;
    entry.created = new Date(); // Reset creation time
    return true;
  }

  async keys(pattern: string = '*'): Promise<string[]> {
    await this.simulateDelay();
    
    if (pattern === '*') {
      return Array.from(this.cache.keys());
    }
    
    // Simple pattern matching (supports basic * wildcard)
    const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  async flushAll(): Promise<number> {
    await this.simulateDelay();
    const count = this.cache.size;
    this.cache.clear();
    this.initializeWithSampleData();
    return count;
  }

  async flushPattern(pattern: string): Promise<number> {
    const keysToDelete = await this.keys(pattern);
    
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
    
    return keysToDelete.length;
  }

  // Travel-specific cache helpers
  async cacheSessionData(sessionId: string, sessionData: TravelSession, ttl: number = 3600): Promise<void> {
    await this.set(`session:${sessionId}`, sessionData, ttl);
  }

  async getCachedSessionData(sessionId: string): Promise<TravelSession | null> {
    return await this.get<TravelSession>(`session:${sessionId}`);
  }

  async cacheAgentResponse(sessionId: string, agent: string, response: any, ttl: number = 1800): Promise<void> {
    await this.set(`agent:${agent}:${sessionId}`, response, ttl);
  }

  async getCachedAgentResponse<T = any>(sessionId: string, agent: string): Promise<T | null> {
    return await this.get<T>(`agent:${agent}:${sessionId}`);
  }

  // Connection and Health
  async connect(): Promise<void> {
    await this.simulateDelay();
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    await this.simulateDelay();
    this.isConnected = false;
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  async checkHealth(): Promise<DatabaseHealth> {
    const start = Date.now();
    await this.simulateDelay();
    const latency = Date.now() - start;

    return {
      connected: this.isConnected,
      latency,
      lastCheck: new Date(),
      version: '7.0-mock'
    };
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  private async simulateDelay(): Promise<void> {
    const delay = faker.number.int({ min: 5, max: 25 });
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // Cleanup for tests
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// ==============================================
// Database Test Environment
// ==============================================

export interface DatabaseTestEnvironment {
  sessionStore: MockSessionStore;
  vectorDb: MockVectorDatabase;
  redis: MockRedisCache;
  
  // Helper functions
  resetAllDatabases: () => Promise<void>;
  checkAllHealth: () => Promise<{ sessions: DatabaseHealth; vector: DatabaseHealth; redis: DatabaseHealth }>;
  simulateNetworkFailure: (duration?: number) => Promise<void>;
  getSystemStatus: () => Promise<{ totalSessions: number; totalDocuments: number; cacheSize: number }>;
}

export const createDatabaseTestEnvironment = (): DatabaseTestEnvironment => {
  const sessionStore = new MockSessionStore();
  const vectorDb = new MockVectorDatabase();
  const redis = new MockRedisCache();

  return {
    sessionStore,
    vectorDb,
    redis,
    
    resetAllDatabases: async () => {
      await sessionStore.clearAllSessions();
      await vectorDb.clearAllDocuments();
      await redis.flushAll();
    },
    
    checkAllHealth: async () => {
      const [sessions, vector, redisHealth] = await Promise.all([
        sessionStore.checkHealth(),
        vectorDb.checkHealth(),
        redis.checkHealth()
      ]);
      
      return { sessions, vector, redis: redisHealth };
    },
    
    simulateNetworkFailure: async (duration: number = 1000) => {
      // Simulate temporary disconnection
      await sessionStore.checkHealth(); // Will show connected: false after disconnect
      await vectorDb.disconnect();
      await redis.disconnect();
      
      return new Promise<void>(resolve => {
        setTimeout(async () => {
          await vectorDb.connect();
          await redis.connect();
          resolve();
        }, duration);
      });
    },
    
    getSystemStatus: async () => {
      return {
        totalSessions: sessionStore.getSessionCount(),
        totalDocuments: vectorDb.getDocumentCount(),
        cacheSize: redis.getCacheSize()
      };
    }
  };
};

// ==============================================
// Vitest Integration Helpers
// ==============================================

/**
 * Sets up database utilities for Vitest testing with automatic cleanup
 */
export const setupDatabaseTestSuite = () => {
  let dbEnv: DatabaseTestEnvironment;

  beforeEach(async () => {
    dbEnv = createDatabaseTestEnvironment();
  });

  afterEach(async () => {
    if (dbEnv) {
      await dbEnv.resetAllDatabases();
      dbEnv.redis.destroy(); // Clean up intervals
    }
  });

  return () => dbEnv;
};

/**
 * Travel workflow test data factory for database testing
 */
export const createTravelWorkflowTestData = () => {
  return {
    formData: {
      destination: faker.location.city() + ', ' + faker.location.country(),
      startDate: faker.date.future().toISOString().split('T')[0],
      endDate: faker.date.future().toISOString().split('T')[0],
      adults: faker.number.int({ min: 1, max: 4 }),
      children: faker.number.int({ min: 0, max: 3 }),
      budget: faker.number.int({ min: 1000, max: 10000 }),
      budgetType: faker.helpers.arrayElement(['total', 'per-person', 'flexible']),
      travelStyle: faker.helpers.arrayElement(['cultural', 'adventure', 'relaxation', 'business', 'family'])
    },
    
    sessionStates: {
      planning: 'planning' as const,
      gathering: 'gathering' as const,
      strategizing: 'strategizing' as const,
      compiling: 'compiling' as const,
      completed: 'completed' as const,
      error: 'error' as const
    },
    
    agentResponses: {
      contentPlanner: () => `Content planning analysis for ${faker.location.city()}:\n\n${faker.lorem.paragraphs(2)}`,
      infoGatherer: () => Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => ({
        url: faker.internet.url(),
        content: faker.lorem.paragraph(),
        relevance: faker.number.float({ min: 0.7, max: 1.0, fractionDigits: 2 })
      })),
      strategist: () => `Strategic recommendations:\n\n${faker.lorem.paragraphs(3)}`,
      contentCompiler: () => `Complete Travel Itinerary:\n\n${faker.lorem.paragraphs(5)}`
    }
  };
};

// Export everything for easy importing
export * from './database-utils';
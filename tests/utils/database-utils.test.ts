import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  MockSessionStore, 
  MockVectorDatabase, 
  MockRedisCache, 
  createDatabaseTestEnvironment,
  setupDatabaseTestSuite,
  createTravelWorkflowTestData,
  type TravelSession
} from '../utils/database-utils';
import { faker } from '@faker-js/faker';

describe('Database Utilities', () => {
  describe('MockSessionStore', () => {
    let sessionStore: MockSessionStore;

    beforeEach(() => {
      sessionStore = new MockSessionStore();
    });

    it('should create and retrieve travel sessions', async () => {
      const sessionData = {
        userId: 'test-user',
        formData: {
          destination: 'Paris, France',
          startDate: '2024-06-15',
          endDate: '2024-06-20',
          adults: 2,
          budget: 3000
        },
        workflowState: 'planning' as const
      };

      const session = await sessionStore.createSession(sessionData);
      
      expect(session).toBeDefined();
      expect(session.id).toBeTruthy();
      expect(session.userId).toBe('test-user');
      expect(session.formData?.['destination']).toBe('Paris, France');
      expect(session.workflowState).toBe('planning');
      expect(session.timestamps.created).toBeInstanceOf(Date);

      const retrieved = await sessionStore.getSession(session.id);
      expect(retrieved).toEqual(session);
    });

    it('should update session workflow state and agent outputs', async () => {
      const session = await sessionStore.createSession({ 
        workflowState: 'planning',
        userId: 'test-user' 
      });

      const success = await sessionStore.updateWorkflowState(
        session.id, 
        'gathering',
        { agent: 'contentPlanner', content: 'Content planning complete' }
      );

      expect(success).toBe(true);

      const updated = await sessionStore.getSession(session.id);
      expect(updated?.workflowState).toBe('gathering');
      expect((updated?.agentOutputs as any).contentPlanner).toBe('Content planning complete');
    });

    it('should list sessions for specific user', async () => {
      const userId = 'test-user-123';
      
      // Create multiple sessions
      await sessionStore.createSession({ userId, workflowState: 'planning' });
      await sessionStore.createSession({ userId, workflowState: 'completed' });
      await sessionStore.createSession({ userId: 'other-user', workflowState: 'planning' });

      const userSessions = await sessionStore.listSessions(userId);
      
      expect(userSessions).toHaveLength(2);
      expect(userSessions.every(s => s.userId === userId)).toBe(true);
    });

    it('should complete workflow and set completion timestamp', async () => {
      const session = await sessionStore.createSession({ workflowState: 'compiling' });

      await sessionStore.updateWorkflowState(session.id, 'completed');
      
      const completed = await sessionStore.getSession(session.id);
      expect(completed?.workflowState).toBe('completed');
      expect(completed?.timestamps.completed).toBeInstanceOf(Date);
    });

    it('should clear all sessions while maintaining samples', async () => {
      const initialCount = sessionStore.getSessionCount();
      expect(initialCount).toBeGreaterThan(0); // Should have sample data

      await sessionStore.createSession({ userId: 'test' });
      expect(sessionStore.getSessionCount()).toBe(initialCount + 1);

      const cleared = await sessionStore.clearAllSessions();
      expect(cleared).toBe(initialCount + 1);
      expect(sessionStore.getSessionCount()).toBe(initialCount); // Samples restored
    });

    it('should report health status', async () => {
      const health = await sessionStore.checkHealth();
      
      expect(health.connected).toBe(true);
      expect(health.latency).toBeGreaterThan(0);
      expect(health.lastCheck).toBeInstanceOf(Date);
      expect(health.version).toBe('1.0.0-mock');
    });
  });

  describe('MockVectorDatabase', () => {
    let vectorDb: MockVectorDatabase;

    beforeEach(() => {
      vectorDb = new MockVectorDatabase();
    });

    it('should add and retrieve documents', async () => {
      const content = 'Best restaurants in Tokyo for sushi lovers';
      const metadata = {
        travelCategory: 'dining',
        destination: 'Tokyo, Japan',
        relevance: 0.95
      };

      const document = await vectorDb.addDocument(content, metadata);
      
      expect(document.id).toBeTruthy();
      expect(document.content).toBe(content);
      expect(document.embedding).toHaveLength(1536);
      expect(document.metadata.travelCategory).toBe('dining');

      const retrieved = await vectorDb.getDocument(document.id);
      expect(retrieved).toEqual(document);
    });

    it('should search documents by text with scoring', async () => {
      await vectorDb.addDocument('Best Paris restaurants for romantic dinners', {
        travelCategory: 'dining',
        destination: 'Paris, France'
      });
      
      await vectorDb.addDocument('Top Tokyo sushi bars and authentic experiences', {
        travelCategory: 'dining',
        destination: 'Tokyo, Japan'
      });

      const results = await vectorDb.searchByText('Paris restaurants');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.score).toBeGreaterThan(0.5);
      expect(results[0]?.document.content).toContain('Paris');
    });

    it('should search similar documents with embeddings', async () => {
      await vectorDb.addDocument('Travel guide for cultural attractions', {
        travelCategory: 'activities'
      });

      const queryEmbedding = Array.from({ length: 1536 }, () => faker.number.float({ min: -1, max: 1 }));
      const results = await vectorDb.searchSimilar(queryEmbedding, 3, 0.7);
      
      expect(Array.isArray(results)).toBe(true);
      results.forEach(result => {
        expect(result.similarity).toBeGreaterThanOrEqual(0.7);
        expect(result.document).toHaveProperty('id');
        expect(result.document).toHaveProperty('embedding');
      });
    });

    it('should manage collections and document organization', async () => {
      await vectorDb.addDocument('Paris hotel recommendations', {}, 'hotels');
      await vectorDb.addDocument('Tokyo restaurant guide', {}, 'restaurants');
      await vectorDb.addDocument('Barcelona activities list', {}, 'hotels');

      const collections = vectorDb.getCollections();
      expect(collections).toContain('hotels');
      expect(collections).toContain('restaurants');

      const clearedCount = await vectorDb.clearCollection('hotels');
      expect(clearedCount).toBe(2);
    });

    it('should handle connection state management', async () => {
      let health = await vectorDb.checkHealth();
      expect(health.connected).toBe(true);

      await vectorDb.disconnect();
      health = await vectorDb.checkHealth();
      expect(health.connected).toBe(false);

      await vectorDb.connect();
      health = await vectorDb.checkHealth();
      expect(health.connected).toBe(true);
    });

    it('should delete documents and update collections', async () => {
      const doc = await vectorDb.addDocument('Temporary document');
      const initialCount = vectorDb.getDocumentCount();

      const deleted = await vectorDb.deleteDocument(doc.id);
      expect(deleted).toBe(true);
      expect(vectorDb.getDocumentCount()).toBe(initialCount - 1);

      const retrieved = await vectorDb.getDocument(doc.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('MockRedisCache', () => {
    let redis: MockRedisCache;

    beforeEach(() => {
      redis = new MockRedisCache();
    });

    afterEach(() => {
      redis.destroy(); // Clean up intervals
    });

    it('should set and get cache values with TTL', async () => {
      const key = 'test:session:123';
      const value = { userId: 'user-456', data: 'test' };

      await redis.set(key, value, 3600);
      
      const retrieved = await redis.get(key);
      expect(retrieved).toEqual(value);

      const exists = await redis.exists(key);
      expect(exists).toBe(true);
    });

    it('should handle cache expiration', async () => {
      const key = 'expiring:key';
      const value = 'temporary data';

      // Set with very short TTL (1 second)
      await redis.set(key, value, 1);
      
      let retrieved = await redis.get(key);
      expect(retrieved).toBe(value);

      // Wait for expiration and check
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      retrieved = await redis.get(key);
      expect(retrieved).toBeNull();
      
      const exists = await redis.exists(key);
      expect(exists).toBe(false);
    });

    it('should search keys with patterns', async () => {
      await redis.set('testsession:user1', { data: 'user1' });
      await redis.set('testsession:user2', { data: 'user2' });
      await redis.set('workflow:agent1', { status: 'active' });

      const sessionKeys = await redis.keys('testsession:*');
      expect(sessionKeys).toHaveLength(2);
      expect(sessionKeys.every(key => key.startsWith('testsession:'))).toBe(true);

      const allKeys = await redis.keys('*');
      expect(allKeys.length).toBeGreaterThanOrEqual(6); // Including sample data + test data
    });

    it('should manage travel-specific cache operations', async () => {
      const sessionId = 'sess-123';
      const sessionData = {
        id: sessionId,
        userId: 'user-456',
        workflowState: 'completed' as const,
        formData: { destination: 'Paris' },
        agentOutputs: {},
        cost: { total: 0, breakdown: {} },
        timestamps: { created: new Date(), lastUpdated: new Date() },
        metadata: {}
      } as TravelSession;

      await redis.cacheSessionData(sessionId, sessionData, 3600);
      
      const cachedSession = await redis.getCachedSessionData(sessionId);
      expect(cachedSession?.userId).toBe('user-456');
      expect(cachedSession?.formData?.['destination']).toBe('Paris');

      // Cache agent response
      await redis.cacheAgentResponse(sessionId, 'strategist', { plan: 'Detailed plan' });
      
      const agentResponse = await redis.getCachedAgentResponse(sessionId, 'strategist');
      expect(agentResponse?.plan).toBe('Detailed plan');
    });

    it('should flush cache patterns and all data', async () => {
      await redis.set('testsession:1', { data: '1' });
      await redis.set('testsession:2', { data: '2' });
      await redis.set('workflow:1', { data: 'w1' });

      const sessionCount = await redis.flushPattern('testsession:*');
      expect(sessionCount).toBe(2);

      const remainingKeys = await redis.keys('testsession:*');
      expect(remainingKeys).toHaveLength(0);

      const workflowKeys = await redis.keys('workflow:*');
      expect(workflowKeys.length).toBeGreaterThan(0); // Should still exist

      const totalCleared = await redis.flushAll();
      expect(totalCleared).toBeGreaterThan(0);
    });

    it('should update TTL and manage expiration', async () => {
      const key = 'ttl:test';
      await redis.set(key, 'data', 3600);

      const updated = await redis.expire(key, 7200);
      expect(updated).toBe(true);

      const exists = await redis.exists(key);
      expect(exists).toBe(true);
    });

    it('should report health and connection status', async () => {
      let health = await redis.checkHealth();
      expect(health.connected).toBe(true);
      expect(health.latency).toBeGreaterThan(0);
      expect(health.version).toBe('7.0-mock');

      await redis.disconnect();
      health = await redis.checkHealth();
      expect(health.connected).toBe(false);

      await redis.connect();
      health = await redis.checkHealth();
      expect(health.connected).toBe(true);
    });
  });

  describe('Database Test Environment Integration', () => {
    let dbEnv: ReturnType<typeof createDatabaseTestEnvironment>;

    beforeEach(() => {
      dbEnv = createDatabaseTestEnvironment();
    });

    afterEach(() => {
      dbEnv.redis.destroy();
    });

    it('should provide integrated database environment', () => {
      expect(dbEnv.sessionStore).toBeInstanceOf(MockSessionStore);
      expect(dbEnv.vectorDb).toBeInstanceOf(MockVectorDatabase);
      expect(dbEnv.redis).toBeInstanceOf(MockRedisCache);
      
      expect(typeof dbEnv.resetAllDatabases).toBe('function');
      expect(typeof dbEnv.checkAllHealth).toBe('function');
      expect(typeof dbEnv.getSystemStatus).toBe('function');
    });

    it('should reset all databases simultaneously', async () => {
      // Add test data to all databases
      await dbEnv.sessionStore.createSession({ userId: 'test' });
      await dbEnv.vectorDb.addDocument('test content');
      await dbEnv.redis.set('test:key', 'value');

      const initialStatus = await dbEnv.getSystemStatus();
      expect(initialStatus.totalSessions).toBeGreaterThan(0);
      expect(initialStatus.totalDocuments).toBeGreaterThan(0);
      expect(initialStatus.cacheSize).toBeGreaterThan(0);

      await dbEnv.resetAllDatabases();

      const resetStatus = await dbEnv.getSystemStatus();
      // Should have sample data but test data cleared
      expect(resetStatus.totalSessions).toBeGreaterThan(0);
      expect(resetStatus.totalDocuments).toBeGreaterThan(0);
      expect(resetStatus.cacheSize).toBeGreaterThan(0);
    });

    it('should check health status across all databases', async () => {
      const health = await dbEnv.checkAllHealth();
      
      expect(health.sessions.connected).toBe(true);
      expect(health.vector.connected).toBe(true);
      expect(health.redis.connected).toBe(true);
      
      expect(health.sessions.latency).toBeGreaterThan(0);
      expect(health.vector.latency).toBeGreaterThan(0);
      expect(health.redis.latency).toBeGreaterThan(0);
    });

    it('should simulate network failure and recovery', async () => {
      const healthBefore = await dbEnv.checkAllHealth();
      expect(healthBefore.vector.connected).toBe(true);
      expect(healthBefore.redis.connected).toBe(true);

      // Simulate failure for 500ms
      const failurePromise = dbEnv.simulateNetworkFailure(500);
      
      // Check status during failure (should be disconnected)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Wait for recovery
      await failurePromise;
      
      const healthAfter = await dbEnv.checkAllHealth();
      expect(healthAfter.vector.connected).toBe(true);
      expect(healthAfter.redis.connected).toBe(true);
    });

    it('should provide comprehensive system status', async () => {
      const status = await dbEnv.getSystemStatus();
      
      expect(typeof status.totalSessions).toBe('number');
      expect(typeof status.totalDocuments).toBe('number');
      expect(typeof status.cacheSize).toBe('number');
      
      expect(status.totalSessions).toBeGreaterThan(0);
      expect(status.totalDocuments).toBeGreaterThan(0);
      expect(status.cacheSize).toBeGreaterThan(0);
    });
  });

  describe('Travel Workflow Test Data Factory', () => {
    it('should generate realistic travel form data', () => {
      const testData = createTravelWorkflowTestData();
      
      expect(testData.formData.destination).toMatch(/^.+, .+$/); // City, Country format
      expect(testData.formData.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // ISO date
      expect(testData.formData.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(testData.formData.adults).toBeGreaterThanOrEqual(1);
      expect(testData.formData.adults).toBeLessThanOrEqual(4);
      expect(testData.formData.budget).toBeGreaterThanOrEqual(1000);
      expect(['total', 'per-person', 'flexible']).toContain(testData.formData.budgetType);
      expect(['cultural', 'adventure', 'relaxation', 'business', 'family']).toContain(testData.formData.travelStyle);
    });

    it('should provide session states and agent response factories', () => {
      const testData = createTravelWorkflowTestData();
      
      expect(testData.sessionStates).toHaveProperty('planning');
      expect(testData.sessionStates).toHaveProperty('completed');
      expect(testData.sessionStates.planning).toBe('planning');
      
      expect(typeof testData.agentResponses.contentPlanner).toBe('function');
      expect(typeof testData.agentResponses.strategist).toBe('function');
      
      const plannerResponse = testData.agentResponses.contentPlanner();
      expect(plannerResponse).toContain('Content planning analysis');
      
      const gathererData = testData.agentResponses.infoGatherer();
      expect(Array.isArray(gathererData)).toBe(true);
      expect(gathererData.length).toBeGreaterThanOrEqual(2);
      expect(gathererData[0]).toHaveProperty('url');
      expect(gathererData[0]).toHaveProperty('relevance');
    });
  });

  describe('Vitest Integration with Database Test Suite', () => {
    const getDatabaseEnvironment = setupDatabaseTestSuite();

    it('should automatically provide fresh database environment', async () => {
      const dbEnv = getDatabaseEnvironment();
      
      expect(dbEnv).toBeDefined();
      expect(dbEnv.sessionStore).toBeInstanceOf(MockSessionStore);
      
      // Add some data
      await dbEnv.sessionStore.createSession({ userId: 'test-auto' });
      expect(dbEnv.sessionStore.getSessionCount()).toBeGreaterThan(2); // 2 samples + 1 test
    });

    it('should provide clean environment for each test', async () => {
      const dbEnv = getDatabaseEnvironment();
      
      // This should be a fresh environment (previous test data cleared)
      const initialSessions = await dbEnv.sessionStore.listSessions('test-auto');
      expect(initialSessions).toHaveLength(0); // Should not have data from previous test
      
      // But should still have sample data
      expect(dbEnv.sessionStore.getSessionCount()).toBeGreaterThan(0);
    });
  });
});

// Integration test for complete travel workflow
describe('Complete Travel Workflow Database Integration', () => {
  const getDatabaseEnvironment = setupDatabaseTestSuite();

  it('should support complete multi-agent workflow with database persistence', async () => {
    const dbEnv = getDatabaseEnvironment();
    const testData = createTravelWorkflowTestData();

    // 1. Create initial session (Content Planner phase)
    const session = await dbEnv.sessionStore.createSession({
      userId: 'workflow-test-user',
      formData: testData.formData,
      workflowState: 'planning'
    });

    expect(session.workflowState).toBe('planning');

    // 2. Update to Info Gatherer phase with vector data
    const webContent = [
      'Best restaurants in ' + testData.formData.destination,
      'Top attractions and activities',
      'Transportation options and tips'
    ];

    const vectorDocs = await Promise.all(
      webContent.map(content => 
        dbEnv.vectorDb.addDocument(content, {
          travelCategory: 'activities',
          destination: testData.formData.destination,
          relevance: faker.number.float({ min: 0.8, max: 1.0, fractionDigits: 2 })
        })
      )
    );

    await dbEnv.sessionStore.updateWorkflowState(
      session.id,
      'gathering',
      { 
        agent: 'infoGatherer', 
        content: vectorDocs.map(doc => ({ 
          url: faker.internet.url(), 
          content: doc.content, 
          relevance: doc.metadata.relevance 
        }))
      }
    );

    // Cache the gathered information
    await dbEnv.redis.cacheAgentResponse(
      session.id, 
      'infoGatherer', 
      { documents: vectorDocs.map(d => d.id) },
      3600
    );

    // 3. Update to Strategist phase
    const strategistResponse = testData.agentResponses.strategist();
    await dbEnv.sessionStore.updateWorkflowState(
      session.id,
      'strategizing',
      { agent: 'strategist', content: strategistResponse }
    );

    // 4. Complete workflow with Content Compiler
    const finalItinerary = testData.agentResponses.contentCompiler();
    await dbEnv.sessionStore.updateWorkflowState(
      session.id,
      'completed',
      { agent: 'contentCompiler', content: finalItinerary }
    );

    // 5. Verify complete workflow state
    const finalSession = await dbEnv.sessionStore.getSession(session.id);
    expect(finalSession?.workflowState).toBe('completed');
    expect(finalSession?.timestamps.completed).toBeInstanceOf(Date);
    expect((finalSession?.agentOutputs as any).strategist).toBe(strategistResponse);
    expect((finalSession?.agentOutputs as any).contentCompiler).toBe(finalItinerary);

    // 6. Verify vector search works with gathered data
    const searchResults = await dbEnv.vectorDb.searchByText(testData.formData.destination);
    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults[0]?.document.metadata.destination).toBe(testData.formData.destination);

    // 7. Verify cached data is accessible
    const cachedInfo = await dbEnv.redis.getCachedAgentResponse(session.id, 'infoGatherer');
    expect(cachedInfo?.documents).toHaveLength(3);

    // 8. Verify system status reflects the workflow
    const systemStatus = await dbEnv.getSystemStatus();
    expect(systemStatus.totalDocuments).toBeGreaterThanOrEqual(6); // 3 samples + 3 added
    expect(systemStatus.cacheSize).toBeGreaterThan(3); // Sample data + workflow cache
  });
});
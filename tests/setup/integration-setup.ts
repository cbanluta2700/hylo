/**
 * Integration Test Setup
 * 
 * // Setup function that r// Cleanup function that runs after each test file
afterEach(async () => {
  console.log(`🧹 Cleaning up integration test environment`);
  
  try {efore each test file
beforeEach(async () => {
  console.log(`🧪 Setting up integration test environment`);
  
  // Reset test resources trackingfile runs before each integration test file
 * It sets up test-specific mocks, environment variables, and utilities
 */

import { beforeEach, afterEach, vi } from 'vitest';

// Global test configuration
const TEST_CONFIG = {
  timeout: {
    default: 30000,
    integration: 60000,
    performance: 120000
  },
  retries: {
    default: 1,
    flaky: 2
  },
  cleanup: {
    sessions: true,
    mockData: true,
    tempFiles: true
  }
};

// Track test resources for cleanup
let testResources: {
  sessionIds: string[];
  mockServers: any[];
  tempFiles: string[];
  timers: NodeJS.Timeout[];
} = {
  sessionIds: [],
  mockServers: [],
  tempFiles: [],
  timers: []
};

// Setup function that runs before each test file
beforeEach(async () => {
  console.log(`🧪 Setting up integration test: ${expect.getState().currentTestName || 'unknown'}`);
  
  // Reset test resources tracking
  resetTestResources();
  
  // Setup test environment variables
  setupTestEnvironment();
  
  // Setup global mocks
  await setupGlobalMocks();
  
  // Setup performance monitoring for individual tests
  setupPerformanceMonitoring();
  
  // Setup automatic cleanup mechanisms
  setupAutomaticCleanup();
});

// Cleanup function that runs after each test file
afterEach(async () => {
  console.log(`🧹 Cleaning up integration test: ${expect.getState().currentTestName || 'unknown'}`);
  
  try {
    // Cleanup test sessions
    await cleanupTestSessions();
    
    // Cleanup mock servers
    await cleanupMockServers();
    
    // Cleanup temporary files
    await cleanupTempFiles();
    
    // Clear timers
    clearTestTimers();
    
    // Restore all mocks
    vi.restoreAllMocks();
    
  } catch (error) {
    console.warn('⚠️  Warning: Failed to cleanup some test resources:', error);
    // Don't throw in cleanup to avoid masking test failures
  }
});

/**
 * Reset test resources tracking
 */
function resetTestResources(): void {
  testResources = {
    sessionIds: [],
    mockServers: [],
    tempFiles: [],
    timers: []
  };
}

/**
 * Setup test-specific environment variables
 */
function setupTestEnvironment(): void {
  // Ensure test mode
  process.env['NODE_ENV'] = 'test';
  process.env['VITEST_INTEGRATION'] = 'true';
  
  // Set test-specific API endpoints
  process.env['VITE_API_BASE_URL'] = 'http://localhost:3000/api';
  
  // Enable test debugging if requested
  if (process.env['VERBOSE_TESTING'] === 'true') {
    process.env['DEBUG'] = '*';
  }
  
  // Set test timeouts
  process.env['VITE_TEST_TIMEOUT'] = TEST_CONFIG.timeout.default.toString();
  process.env['VITE_INTEGRATION_TEST_TIMEOUT'] = TEST_CONFIG.timeout.integration.toString();
}

/**
 * Setup global mocks for integration tests
 */
async function setupGlobalMocks(): Promise<void> {
  // Mock external API calls if not in real integration mode
  if (process.env['ENABLE_MOCK_AGENTS'] !== 'false') {
    await setupLLMProviderMocks();
    await setupExternalServiceMocks();
  }
  
  // Mock browser APIs if needed
  setupBrowserAPIMocks();
  
  // Setup mock timers if needed for time-dependent tests
  if (process.env['MOCK_TIMERS'] === 'true') {
    vi.useFakeTimers();
  }
}

/**
 * Setup LLM provider mocks for consistent testing
 */
async function setupLLMProviderMocks(): Promise<void> {
  // Mock Groq API
  vi.mock('@groq/sdk', () => ({
    default: class MockGroq {
      chat = {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: 'Mock Groq response' } }],
            usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 }
          })
        }
      };
    }
  }));
  
  // Mock Cerebras API (similar pattern)
  // Mock Google Gemini API (similar pattern)
}

/**
 * Setup external service mocks
 */
async function setupExternalServiceMocks(): Promise<void> {
  // Mock Jina Reader API
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (url.includes('jina.ai')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ content: 'Mock web content' }),
        text: () => Promise.resolve('Mock web content')
      });
    }
    
    // Default mock response
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve('')
    });
  });
}

/**
 * Setup browser API mocks
 */
function setupBrowserAPIMocks(): void {
  // Mock EventSource for SSE testing
  (global as any).EventSource = vi.fn().mockImplementation(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    close: vi.fn(),
    readyState: 1,
    CONNECTING: 0,
    OPEN: 1,
    CLOSED: 2
  }));
  
  // Mock WebSocket if needed
  (global as any).WebSocket = vi.fn().mockImplementation(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    send: vi.fn(),
    close: vi.fn(),
    readyState: 1,
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
  }));
}

/**
 * Setup performance monitoring for individual tests
 */
function setupPerformanceMonitoring(): void {
  if (process.env['ENABLE_PERFORMANCE_MONITORING'] === 'true') {
    // Initialize performance monitoring for the current test
    const testName = expect.getState().currentTestName || 'unknown';
    console.time(`⏱️  ${testName}`);
    
    // Track memory usage at start
    const initialMemory = process.memoryUsage();
    (global as any).__testStartMemory = initialMemory;
  }
}

/**
 * Setup automatic cleanup mechanisms
 */
function setupAutomaticCleanup(): void {
  // Register session cleanup
  const originalSessionCreate = (global as any).sessionCreate;
  (global as any).sessionCreate = (sessionId: string) => {
    testResources.sessionIds.push(sessionId);
    return originalSessionCreate?.(sessionId);
  };
  
  // Register mock server cleanup
  const originalServerCreate = (global as any).createMockServer;
  (global as any).createMockServer = (server: any) => {
    testResources.mockServers.push(server);
    return originalServerCreate?.(server);
  };
  
  // Note: Skipping setTimeout override to avoid compatibility issues
  // Tests should manually track and cleanup timers if needed
}

/**
 * Cleanup test sessions
 */
async function cleanupTestSessions(): Promise<void> {
  if (testResources.sessionIds.length === 0) return;
  
  console.log(`🗑️  Cleaning up ${testResources.sessionIds.length} test sessions...`);
  
  for (const sessionId of testResources.sessionIds) {
    try {
      // Attempt to cancel/cleanup each session
      // This would call the actual cleanup API
      await fetch(`${process.env['VITE_API_BASE_URL']}/workflow/state`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      }).catch(() => {}); // Ignore cleanup errors
    } catch (error) {
      console.warn(`Failed to cleanup session ${sessionId}:`, error);
    }
  }
  
  testResources.sessionIds = [];
}

/**
 * Cleanup mock servers
 */
async function cleanupMockServers(): Promise<void> {
  if (testResources.mockServers.length === 0) return;
  
  console.log(`🔧 Shutting down ${testResources.mockServers.length} mock servers...`);
  
  for (const server of testResources.mockServers) {
    try {
      if (server && typeof server.close === 'function') {
        await server.close();
      }
    } catch (error) {
      console.warn('Failed to close mock server:', error);
    }
  }
  
  testResources.mockServers = [];
}

/**
 * Cleanup temporary files
 */
async function cleanupTempFiles(): Promise<void> {
  if (testResources.tempFiles.length === 0) return;
  
  console.log(`📁 Cleaning up ${testResources.tempFiles.length} temporary files...`);
  
  // File cleanup logic would go here
  testResources.tempFiles = [];
}

/**
 * Clear test timers
 */
function clearTestTimers(): void {
  if (testResources.timers.length === 0) return;
  
  console.log(`⏰ Clearing ${testResources.timers.length} test timers...`);
  
  for (const timer of testResources.timers) {
    try {
      clearTimeout(timer);
    } catch (error) {
      console.warn('Failed to clear timer:', error);
    }
  }
  
  testResources.timers = [];
}

/**
 * Utility functions for tests
 */

// Export utility functions for use in tests
export const testUtils = {
  /**
   * Create a test session ID and register it for cleanup
   */
  createTestSession(): string {
    const sessionId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    testResources.sessionIds.push(sessionId);
    return sessionId;
  },
  
  /**
   * Wait for a condition to be true with timeout
   */
  async waitFor(condition: () => boolean | Promise<boolean>, timeoutMs = 10000): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      if (await condition()) return;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Condition not met within ${timeoutMs}ms`);
  },
  
  /**
   * Create mock data for testing
   */
  createMockFormData(overrides: any = {}): any {
    return {
      destination: 'Test Destination',
      departureDate: '2024-10-01',
      returnDate: '2024-10-05',
      tripNickname: 'Test Trip',
      contactName: 'Test User',
      adults: 2,
      children: 0,
      budget: {
        amount: 2000,
        currency: 'USD' as const,
        mode: 'total' as const
      },
      preferences: {
        travelStyle: 'culture' as const,
        interests: ['museums', 'history'],
        accommodationType: 'hotel' as const,
        transportationMode: 'flight' as const,
        dietaryRestrictions: [],
        accessibility: []
      },
      ...overrides
    };
  },
  
  /**
   * Get current test configuration
   */
  getTestConfig() {
    return TEST_CONFIG;
  }
};

// Make test utilities available globally
(global as any).testUtils = testUtils;
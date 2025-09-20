import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // Test files
    include: [
      'tests/performance/**/*.test.{js,ts}',
      'tests/load/**/*.test.{js,ts}'
    ],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'tests/unit/**',
      'tests/integration/**'
    ],

    // Test environment
    environment: 'node',
    
    // Global setup and teardown
    globalSetup: ['tests/performance/setup/global-setup.ts'],
    
    // Test timeout (performance tests can take longer)
    testTimeout: 60000, // 60 seconds
    hookTimeout: 30000, // 30 seconds
    
    // Reporters
    reporters: [
      'verbose',
      'json',
      ['html', { outputFile: 'test-results/performance-report.html' }]
    ],
    
    // Output configuration
    outputFile: 'test-results/performance-results.json',
    
    // Coverage (optional for performance tests)
    coverage: {
      enabled: false,
      provider: 'v8'
    },

    // Pool configuration for better resource management
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },

    // Performance-specific configuration
    maxConcurrency: 1, // Run performance tests sequentially to avoid resource conflicts
    sequence: {
      shuffle: false // Keep tests in order for consistent results
    },

    // Setup files
    setupFiles: [
      'tests/performance/setup/performance-setup.ts'
    ]
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@tests': resolve(__dirname, 'tests'),
      '@performance': resolve(__dirname, 'tests/performance'),
      '@scripts': resolve(__dirname, 'scripts')
    }
  },

  // Define constants for tests
  define: {
    'import.meta.env.VITE_APP_MODE': '"performance"',
    'import.meta.env.VITE_PERFORMANCE_TEST': 'true'
  }
})
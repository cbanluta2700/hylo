/**
 * Vitest Configuration for Integration Testing
 * 
 * Specialized configuration for running integration tests with proper
 * environment setup, timeout handling, and test isolation
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Environment configuration
    environment: 'node',
    
    // Test file patterns for integration tests
    include: [
      'tests/integration/**/*.test.ts',
      'tests/e2e/**/*.test.ts',
      'tests/performance/**/*.test.ts'
    ],
    
    // Exclude unit tests and other test files
    exclude: [
      'tests/unit/**/*',
      'tests/components/**/*',
      'tests/utils/**/*',
      'node_modules/**/*',
      'dist/**/*'
    ],
    
    // Test execution configuration
    testTimeout: 60000, // 60 seconds for integration tests
    hookTimeout: 30000, // 30 seconds for setup/teardown
    teardownTimeout: 15000, // 15 seconds for cleanup
    
    // Concurrency configuration
    maxConcurrency: 5, // Limit concurrent tests to avoid resource conflicts
    
    // Reporter configuration
    reporters: [
      'verbose',
      'junit',
      'json',
      'html'
    ],
    
    // Output configuration
    outputFile: {
      junit: './test-results/integration-junit.xml',
      json: './test-results/integration-results.json',
      html: './test-results/integration-report.html'
    },
    
    // Coverage configuration for integration tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/integration',
      include: [
        'api/**/*.ts',
        'src/services/**/*.ts',
        'src/types/**/*.ts'
      ],
      exclude: [
        'tests/**/*',
        'node_modules/**/*',
        'dist/**/*',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.ts'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 75,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Global setup and teardown
    globalSetup: './tests/setup/global-setup.ts',
    
    // Setup files run before each test file
    setupFiles: [
      './tests/setup/integration-setup.ts'
    ],
    
    // Environment variables
    env: {
      NODE_ENV: 'test',
      VITEST_INTEGRATION: 'true'
    },
    
    // Test isolation
    isolate: true,
    
    // Pool configuration for better resource management
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        isolate: true
      }
    },
    
    // Retry configuration for flaky tests
    retry: 1,
    
    // Test sequencing for integration tests
    sequence: {
      concurrent: false, // Run integration tests sequentially
      shuffle: false // Keep consistent order
    },
    
    // File watching (disabled for CI/CD)
    watch: false,
    
    // Cache configuration
    cache: {
      dir: './node_modules/.vitest-integration'
    }
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@api': path.resolve(__dirname, './api'),
      '@tests': path.resolve(__dirname, './tests'),
      '@types': path.resolve(__dirname, './src/types')
    }
  },
  
  // Define configuration for environment variables
  define: {
    'process.env.VITEST': 'true',
    'process.env.NODE_ENV': '"test"'
  },
  
  // ESBuild configuration for TypeScript
  esbuild: {
    target: 'node18',
    format: 'esm'
  }
});
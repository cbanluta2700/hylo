import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'tests'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['api/**/*.ts', 'src/lib/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        URLSearchParams: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      // Multi-agent architecture patterns
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',

      // Error handling for AI agents
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',
      '@typescript-eslint/prefer-promise-reject-errors': 'error',

      // Performance for edge functions
      'no-unused-vars': 'error',
      'no-unreachable': 'error',
      'no-duplicate-imports': 'error',

      // Security for AI integrations
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // Edge runtime compatibility
      'no-restricted-globals': 'off', // Allow Node.js globals in edge functions
      'no-process-env': 'off', // Environment variables are allowed

      // Agent-specific patterns
      '@typescript-eslint/no-misused-promises': 'error', // Ensure proper async handling in agents
      '@typescript-eslint/require-await': 'off', // Allow non-async functions that return promises

      // Workflow orchestration
      '@typescript-eslint/no-confusing-void-expression': 'error', // Clear void vs Promise<void>

      // Search provider integrations
      '@typescript-eslint/no-unnecessary-type-assertion': 'error', // Type safety for API responses

      // Vector operations
      '@typescript-eslint/no-unsafe-assignment': 'error', // Safe vector operations
      '@typescript-eslint/no-unsafe-member-access': 'error', // Safe property access

      // WebSocket handling
      '@typescript-eslint/no-mixed-enums': 'error', // Consistent message types
    },
  },
  {
    // Agent-specific files
    files: ['src/lib/agents/**/*.ts'],
    rules: {
      // Agents should handle errors gracefully
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Allow agents to have complex logic
      'max-lines-per-function': 'off',
      complexity: ['warn', 15],
    },
  },
  {
    // Workflow files
    files: ['src/lib/workflows/**/*.ts'],
    rules: {
      // Workflows can be complex
      'max-lines-per-function': 'off',
      complexity: ['warn', 20],
      // Ensure proper step handling
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  {
    // Search provider files
    files: ['src/lib/providers/**/*.ts'],
    rules: {
      // External API calls need error handling
      '@typescript-eslint/no-floating-promises': 'error',
      // Allow flexible API response handling
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  }
);

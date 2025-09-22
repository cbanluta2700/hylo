/**
 * Edge Runtime Compatibility Validation Script
 *
 * Validates that all API endpoints and dependencies are compatible with Vercel Edge Runtime
 * Constitutional requirement: All code must be Edge Runtime compatible
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Node.js built-ins that are NOT available in Edge Runtime
const FORBIDDEN_NODE_BUILTINS = [
  // File system
  'fs',
  'fs/promises',
  'path',
  // Child processes
  'child_process',
  'cluster',
  // Operating system
  'os',
  'process',
  // Networking (use fetch instead)
  'http',
  'https',
  'net',
  'dgram',
  // Streams (limited support)
  'stream',
  'zlib',
  // Utilities
  'util',
  'events',
  'buffer',
  // Crypto (use Web Crypto API)
  'crypto',
  // Worker threads
  'worker_threads',
  // Others
  'readline',
  'repl',
  'tty',
  'vm',
];

// Edge Runtime APIs that ARE available
const ALLOWED_EDGE_APIS = [
  // Web APIs
  'fetch',
  'Request',
  'Response',
  'Headers',
  'URL',
  'URLSearchParams',
  'setTimeout',
  'clearTimeout',
  'setInterval',
  'clearInterval',
  'console',
  'JSON',
  // Crypto
  'crypto.subtle',
  'crypto.randomUUID',
  // Encoding
  'TextEncoder',
  'TextDecoder',
  'btoa',
  'atob',
  // Streams (limited)
  'ReadableStream',
  'WritableStream',
  'TransformStream',
];

interface ValidationResult {
  file: string;
  issues: string[];
  hasEdgeConfig: boolean;
}

interface ValidationSummary {
  totalFiles: number;
  validFiles: number;
  filesWithIssues: number;
  issues: ValidationResult[];
  success: boolean;
}

/**
 * Check if a file contains forbidden Node.js built-ins
 */
function checkForNodeBuiltins(filePath: string, content: string): string[] {
  const issues: string[] = [];

  // Check for require() statements with forbidden modules
  const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  let match;
  while ((match = requireRegex.exec(content)) !== null) {
    const moduleName = match[1];
    if (FORBIDDEN_NODE_BUILTINS.includes(moduleName)) {
      issues.push(`Uses forbidden Node.js built-in via require(): ${moduleName}`);
    }
  }

  // Check for import statements with forbidden modules
  const importRegex = /(?:import.*from\s+['"`]([^'"`]+)['"`]|import\s+['"`]([^'"`]+)['"`])/g;
  while ((match = importRegex.exec(content)) !== null) {
    const moduleName = match[1] || match[2];
    if (FORBIDDEN_NODE_BUILTINS.includes(moduleName)) {
      issues.push(`Uses forbidden Node.js built-in via import: ${moduleName}`);
    }
  }

  // Check for direct usage of process (except process.env)
  const processRegex = /\bprocess\.(?!env\b)\w+/g;
  while ((match = processRegex.exec(content)) !== null) {
    issues.push(`Uses forbidden process API: ${match[0]}`);
  }

  // Check for __dirname or __filename
  if (content.includes('__dirname')) {
    issues.push('Uses __dirname (not available in Edge Runtime)');
  }
  if (content.includes('__filename')) {
    issues.push('Uses __filename (not available in Edge Runtime)');
  }

  return issues;
}

/**
 * Check if API endpoint has proper Edge Runtime configuration
 */
function checkEdgeConfig(filePath: string, content: string): boolean {
  // Look for export const config = { runtime: 'edge' }
  const edgeConfigRegex = /export\s+const\s+config\s*=\s*{\s*runtime:\s*['"`]edge['"`]/;
  return edgeConfigRegex.test(content);
}

/**
 * Recursively find all TypeScript and JavaScript files
 */
function findCodeFiles(dir: string, extensions = ['.ts', '.tsx', '.js', '.jsx']): string[] {
  const files: string[] = [];

  try {
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules, .git, .next, etc.
        if (!['node_modules', '.git', '.next', 'dist', 'build', '.vercel'].includes(item)) {
          files.push(...findCodeFiles(fullPath, extensions));
        }
      } else if (stat.isFile()) {
        const ext = extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error);
  }

  return files;
}

/**
 * Validate a single file for Edge Runtime compatibility
 */
function validateFile(filePath: string): ValidationResult {
  const content = readFileSync(filePath, 'utf-8');
  const issues = checkForNodeBuiltins(filePath, content);

  // Check if this is an API endpoint (in api/ directory)
  const isApiEndpoint = filePath.includes('/api/') && filePath.endsWith('.ts');
  let hasEdgeConfig = false;

  if (isApiEndpoint) {
    hasEdgeConfig = checkEdgeConfig(filePath, content);
    if (!hasEdgeConfig) {
      issues.push(
        'API endpoint missing Edge Runtime configuration: export const config = { runtime: "edge" }'
      );
    }
  }

  return {
    file: filePath.replace(PROJECT_ROOT, '').replace(/\\/g, '/'),
    issues,
    hasEdgeConfig: isApiEndpoint ? hasEdgeConfig : true, // Non-API files don't need config
  };
}

/**
 * Main validation function
 */
function validateEdgeCompatibility(): ValidationSummary {
  console.log('🔍 Validating Edge Runtime compatibility...\n');

  // Find all code files
  const codeFiles = [
    ...findCodeFiles(join(PROJECT_ROOT, 'src')),
    ...findCodeFiles(join(PROJECT_ROOT, 'api')),
  ];

  console.log(`Found ${codeFiles.length} code files to validate\n`);

  // Validate each file
  const results: ValidationResult[] = [];
  let validFiles = 0;

  for (const file of codeFiles) {
    const result = validateFile(file);
    results.push(result);

    if (result.issues.length === 0) {
      validFiles++;
    }
  }

  // Generate summary
  const filesWithIssues = results.filter((r) => r.issues.length > 0);
  const summary: ValidationSummary = {
    totalFiles: codeFiles.length,
    validFiles,
    filesWithIssues: filesWithIssues.length,
    issues: filesWithIssues,
    success: filesWithIssues.length === 0,
  };

  return summary;
}

/**
 * Print validation results
 */
function printResults(summary: ValidationSummary): void {
  console.log('📊 Edge Runtime Compatibility Results');
  console.log('=====================================\n');

  console.log(`✅ Total files validated: ${summary.totalFiles}`);
  console.log(`✅ Files without issues: ${summary.validFiles}`);
  console.log(`❌ Files with issues: ${summary.filesWithIssues}\n`);

  if (summary.issues.length > 0) {
    console.log('🚨 Issues found:\n');

    for (const result of summary.issues) {
      console.log(`📄 ${result.file}`);
      for (const issue of result.issues) {
        console.log(`   ❌ ${issue}`);
      }
      console.log();
    }

    console.log('💡 How to fix these issues:');
    console.log('- Replace Node.js built-ins with Web APIs or Edge-compatible alternatives');
    console.log('- Add "export const config = { runtime: \'edge\' }" to API endpoints');
    console.log('- Use environment variables instead of process APIs');
    console.log('- Use fetch() instead of http/https modules');
    console.log('- Use Web Crypto API instead of Node.js crypto module\n');
  } else {
    console.log('🎉 All files are Edge Runtime compatible!\n');
  }

  console.log('📋 Edge Runtime Guidelines:');
  console.log('- Use Web APIs: fetch, URL, Headers, Response, Request');
  console.log('- Environment: process.env only');
  console.log('- No file system access');
  console.log('- No Node.js built-in modules');
  console.log('- Export edge config in API routes\n');
}

/**
 * CLI execution
 */
function main(): void {
  const summary = validateEdgeCompatibility();
  printResults(summary);

  // Exit with appropriate code
  process.exit(summary.success ? 0 : 1);
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateEdgeCompatibility, ValidationSummary, ValidationResult };

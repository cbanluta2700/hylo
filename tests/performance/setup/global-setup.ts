/**
 * Global Performance Test Setup
 * Configures the environment for performance testing
 */

import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

let appProcess: ChildProcess | null = null;
const APP_PORT = 4173;
const HEALTH_CHECK_URL = `http://localhost:${APP_PORT}/health`;

// Ensure results directories exist
const setupDirectories = () => {
  const dirs = [
    'test-results',
    'performance-results',
    'health-check-results'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Start the application for testing
const startApplication = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting application for performance testing...');

    // Build the application first
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'pipe',
      shell: process.platform === 'win32'
    });

    buildProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Build failed with code ${code}`));
        return;
      }

      // Start preview server
      appProcess = spawn('npm', ['run', 'preview'], {
        stdio: 'pipe',
        shell: process.platform === 'win32',
        env: {
          ...process.env,
          PORT: APP_PORT.toString()
        }
      });

      if (!appProcess) {
        reject(new Error('Failed to start application process'));
        return;
      }

      appProcess.stdout?.on('data', (data) => {
        console.log(`App stdout: ${data}`);
      });

      appProcess.stderr?.on('data', (data) => {
        console.error(`App stderr: ${data}`);
      });

      appProcess.on('error', (error) => {
        reject(new Error(`Failed to start application: ${error.message}`));
      });

      // Wait for application to be ready
      const checkHealth = async (attempts = 30): Promise<void> => {
        try {
          const response = await fetch(HEALTH_CHECK_URL);
          if (response.ok) {
            console.log('✅ Application is ready for testing');
            resolve();
          } else {
            throw new Error(`Health check failed: ${response.status}`);
          }
        } catch (error) {
          if (attempts > 0) {
            console.log(`⏳ Waiting for application... (${attempts} attempts remaining)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return checkHealth(attempts - 1);
          } else {
            reject(new Error('Application failed to start within timeout'));
          }
        }
      };

      // Give the server a moment to start
      setTimeout(() => checkHealth(), 3000);
    });

    buildProcess.on('error', (error) => {
      reject(new Error(`Build process error: ${error.message}`));
    });
  });
};

// Stop the application
const stopApplication = (): void => {
  if (appProcess) {
    console.log('🛑 Stopping application...');
    appProcess.kill('SIGTERM');
    
    // Force kill after 10 seconds if graceful shutdown fails
    setTimeout(() => {
      if (appProcess && !appProcess.killed) {
        console.log('🔨 Force killing application...');
        appProcess.kill('SIGKILL');
      }
    }, 10000);

    appProcess = null;
  }
};

// Global setup hook
export const setup = async () => {
  console.log('🔧 Setting up performance test environment...');
  
  setupDirectories();
  await startApplication();
  
  // Warm up the application
  console.log('🔥 Warming up application...');
  for (let i = 0; i < 5; i++) {
    try {
      await fetch(`http://localhost:${APP_PORT}/api/health/system`);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.warn(`Warmup request ${i + 1} failed:`, error);
    }
  }
  
  console.log('✅ Performance test environment ready');
};

// Global teardown hook
export const teardown = async () => {
  console.log('🧹 Cleaning up performance test environment...');
  
  stopApplication();
  
  // Clean up any temporary files if needed
  // (Keep performance results for analysis)
  
  console.log('✅ Performance test cleanup complete');
};

// Export for use in beforeAll/afterAll hooks
export default setup;
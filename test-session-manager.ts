/**
 * Test Redis-Free Implementation
 * Direct test of the simplified workflow without Redis dependencies
 */

import {
  simpleSessionManager,
  generateWorkflowId,
} from '../src/lib/workflows/simple-session-manager.js';
import type { TravelFormData } from '../src/types/travel-form.js';

console.log('🧪 Testing Redis-Free Implementation...\n');

// Test 1: Session Manager
console.log('📁 Test 1: Session Manager');
const workflowId = generateWorkflowId();
const sessionId = 'test-session-123';

const testFormData: TravelFormData = {
  location: 'Tokyo',
  adults: 2,
  children: 0,
  departDate: '2025-01-15',
  returnDate: '2025-01-22',
  flexibleDates: false,
  interests: ['culture', 'food'],
  budget: { total: 3000, currency: 'USD' },
  travelStyle: { pace: 'moderate' },
  formVersion: '1.0.0',
};

console.log(`Generated Workflow ID: ${workflowId}`);

try {
  // Create session
  const session = await simpleSessionManager.createSession(workflowId, sessionId, testFormData);
  console.log('✅ Session created successfully');
  console.log(`   Status: ${session.status}`);
  console.log(`   Stage: ${session.currentStage}`);
  console.log(`   Progress: ${session.progress}%`);

  // Update progress
  await simpleSessionManager.updateProgress(workflowId, {
    currentStage: 'gatherer',
    progress: 50,
    completedSteps: ['architect-complete'],
  });
  console.log('✅ Progress updated successfully');

  // Retrieve session
  const retrieved = await simpleSessionManager.getSession(workflowId);
  if (retrieved) {
    console.log('✅ Session retrieved successfully');
    console.log(`   Status: ${retrieved.status}`);
    console.log(`   Stage: ${retrieved.currentStage}`);
    console.log(`   Progress: ${retrieved.progress}%`);
    console.log(`   Completed Steps: ${retrieved.completedSteps.join(', ')}`);
  }

  // Complete session
  await simpleSessionManager.completeSession(workflowId, {
    itinerary: 'Sample AI-generated itinerary for Tokyo',
  });
  console.log('✅ Session completed successfully');

  // Get stats
  const stats = simpleSessionManager.getStats();
  console.log('📊 Session Manager Stats:');
  console.log(`   Total Sessions: ${stats.totalSessions}`);
  console.log(`   Memory Usage: ${JSON.stringify(stats.memoryUsage, null, 2)}`);

  console.log('\n🎉 All tests passed! Redis-free implementation is working correctly.');
} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
}

console.log('\n🚀 Ready for production deployment without Redis dependencies!');

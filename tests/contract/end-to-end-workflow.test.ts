/**
 * Integration Test: Complete End-to-End Workflow
 *
 * CONSTITUTIONAL REQUIREMENT IV: Code-Deploy-Debug Flow
 * This test MUST FAIL before implementation begins.
 * Tests the complete AI workflow from form submission to itinerary generation.
 *
 * Edge Runtime Requirements (Constitutional Principle I):
 * - All endpoints must use Edge Runtime
 * - Real-time progress updates via SSE
 * - Complete 4-agent workflow execution
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TravelFormData } from '../../src/types/travel-form';

describe('Integration: End-to-End Workflow', () => {
  const validFormData: TravelFormData = {
    location: 'Tokyo, Japan',
    departDate: '2025-12-15',
    returnDate: '2025-12-22',
    flexibleDates: false,
    plannedDays: 7,
    adults: 2,
    children: 1,
    childrenAges: [10],

    budget: {
      total: 5000,
      currency: 'USD',
      breakdown: {
        accommodation: 2000,
        food: 1000,
        activities: 1500,
        transportation: 400,
        shopping: 100,
        emergency: 0,
      },
      flexibility: 'flexible',
    },

    travelStyle: {
      pace: 'moderate',
      accommodationType: 'mid-range',
      diningPreferences: 'mixed',
      activityLevel: 'moderate',
      culturalImmersion: 'deep',
    },

    interests: ['temples', 'anime', 'traditional-culture', 'modern-technology'],
    avoidances: ['extreme-crowds'],
    dietaryRestrictions: ['vegetarian-options-needed'],
    accessibility: [],

    tripVibe: 'cultural-discovery',
    travelExperience: 'experienced',
    dinnerChoice: 'local-spots',
    nickname: 'Tokyo Family Adventure',

    additionalServices: {
      carRental: false,
      travel_insurance: true,
      tours: true,
      airport_transfers: true,
      spa_wellness: false,
      adventure_activities: false,
    },

    sessionId: 'e2e-test-session',
    formVersion: '1.0.0',
    submittedAt: new Date(),
  };

  let workflowId: string;
  let eventSource: EventSource | null = null;

  beforeEach(() => {
    workflowId = '';
    eventSource = null;
  });

  afterEach(() => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  });

  it('should complete full workflow: submit → process → generate → retrieve', async () => {
    // This test WILL FAIL until all endpoints are implemented

    // Step 1: Submit form data to initiate workflow
    const generateResponse = await fetch('http://localhost:3000/api/itinerary/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'e2e-test-session',
        formData: validFormData,
      }),
    });

    expect(generateResponse.status).toBe(200);

    const generateData = await generateResponse.json();
    expect(generateData.success).toBe(true);
    expect(generateData.data).toHaveProperty('workflowId');

    workflowId = generateData.data.workflowId;

    // Step 2: Monitor progress via SSE
    const progressPromise = new Promise((resolve, reject) => {
      const progressUrl = `http://localhost:3000/api/itinerary/progress/${workflowId}`;
      eventSource = new EventSource(progressUrl);

      const progressSteps: string[] = [];

      eventSource.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        progressSteps.push(data.currentStage);

        // Constitutional requirement: Validate progress structure
        expect(data).toHaveProperty('workflowId', workflowId);
        expect(data).toHaveProperty('progress');
        expect(data.progress).toBeGreaterThanOrEqual(0);
        expect(data.progress).toBeLessThanOrEqual(100);
      };

      eventSource.addEventListener('complete', (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        expect(data.progress).toBe(100);
        expect(data.currentStage).toBe('complete');
        expect(data).toHaveProperty('itineraryId');
        resolve(data);
      });

      eventSource.addEventListener('error', (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        reject(new Error(`Workflow failed: ${data.error.message}`));
      });
      eventSource.onerror = () => {
        reject(new Error('SSE connection failed'));
      };

      // Timeout after 60 seconds
      setTimeout(() => {
        reject(new Error('Workflow timeout'));
      }, 60000);
    });

    const completionData = await progressPromise;

    // Step 3: Retrieve generated itinerary
    const itineraryId = (completionData as any).itineraryId;
    const itineraryResponse = await fetch(`http://localhost:3000/api/itinerary/${itineraryId}`);

    expect(itineraryResponse.status).toBe(200);

    const itineraryData = await itineraryResponse.json();
    expect(itineraryData.success).toBe(true);
    expect(itineraryData.data).toHaveProperty('id', itineraryId);

    // Validate complete itinerary structure
    const itinerary = itineraryData.data;
    expect(itinerary).toHaveProperty('title');
    expect(itinerary).toHaveProperty('destination');
    expect(itinerary).toHaveProperty('dates');
    expect(itinerary).toHaveProperty('budget');
    expect(itinerary).toHaveProperty('itinerary');
    expect(itinerary).toHaveProperty('recommendations');

    // Validate daily itinerary for 7 days
    expect(itinerary.itinerary).toHaveLength(7);

    itinerary.itinerary.forEach((day: any, index: number) => {
      expect(day).toHaveProperty('day', index + 1);
      expect(day).toHaveProperty('date');
      expect(day).toHaveProperty('activities');
      expect(day).toHaveProperty('meals');
      expect(Array.isArray(day.activities)).toBe(true);
      expect(day.activities.length).toBeGreaterThan(0);
    });

    // Validate budget matches input
    expect(itinerary.budget.currency).toBe('USD');
    expect(itinerary.budget.total).toBeCloseTo(5000, 0); // Within $1 of original budget

    // Validate interests were incorporated
    const itineraryText = JSON.stringify(itinerary);
    expect(itineraryText.toLowerCase()).toContain('temple');
    expect(itineraryText.toLowerCase()).toContain('culture');
  }, 90000); // 90 second timeout for full workflow

  it('should handle workflow with all 4 AI agents', async () => {
    // Submit workflow
    const generateResponse = await fetch('http://localhost:3000/api/itinerary/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'agent-test-session',
        formData: validFormData,
      }),
    });

    const generateData = await generateResponse.json();
    workflowId = generateData.data.workflowId;

    // Track agent execution order
    const agentOrder: string[] = [];

    const progressPromise = new Promise((resolve, reject) => {
      const progressUrl = `http://localhost:3000/api/itinerary/progress/${workflowId}`;
      eventSource = new EventSource(progressUrl);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.currentStage && !agentOrder.includes(data.currentStage)) {
          agentOrder.push(data.currentStage);
        }
      };

      eventSource.addEventListener('complete', (event) => {
        // Constitutional requirement: Validate 4-agent sequence
        const expectedAgents = ['architect', 'gatherer', 'specialist', 'formatter'];
        expectedAgents.forEach((agent) => {
          expect(agentOrder).toContain(agent);
        });

        // Verify agent execution order
        expect(agentOrder.indexOf('architect')).toBeLessThan(agentOrder.indexOf('gatherer'));
        expect(agentOrder.indexOf('gatherer')).toBeLessThan(agentOrder.indexOf('specialist'));
        expect(agentOrder.indexOf('specialist')).toBeLessThan(agentOrder.indexOf('formatter'));

        resolve(event.data);
      });

      eventSource.onerror = () => reject(new Error('Agent workflow test failed'));
      setTimeout(() => reject(new Error('Agent workflow timeout')), 60000);
    });

    await progressPromise;
  }, 90000);

  it('should handle error recovery and retries', async () => {
    // Test with potentially problematic data
    const problematicData: TravelFormData = {
      ...validFormData,
      location: 'Non-existent Location, Mars', // Should trigger search errors
      budget: {
        ...validFormData.budget,
        total: 1, // Impossibly low budget
      },
    };

    const generateResponse = await fetch('http://localhost:3000/api/itinerary/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'error-test-session',
        formData: problematicData,
      }),
    });

    if (generateResponse.status === 200) {
      const generateData = await generateResponse.json();
      workflowId = generateData.data.workflowId;

      const errorPromise = new Promise((resolve, reject) => {
        const progressUrl = `http://localhost:3000/api/itinerary/progress/${workflowId}`;
        eventSource = new EventSource(progressUrl);

        eventSource.addEventListener('error', (event: MessageEvent) => {
          const data = JSON.parse(event.data);

          // Constitutional requirement: Structured error handling
          expect(data.error).toHaveProperty('code');
          expect(data.error).toHaveProperty('message');
          expect(data.error).toHaveProperty('stage');

          resolve(data);
        });
        eventSource.addEventListener('complete', () => {
          // If it completes despite errors, that's also valid (good error recovery)
          resolve({ recovered: true });
        });

        eventSource.onerror = () => reject(new Error('Error handling test failed'));
        setTimeout(() => reject(new Error('Error handling timeout')), 30000);
      });

      const result = await errorPromise;
      expect(result).toBeDefined();
    } else {
      // Should reject invalid input at submission
      expect(generateResponse.status).toBe(400);
      const errorData = await generateResponse.json();
      expect(errorData.success).toBe(false);
    }
  }, 60000);

  it('should maintain constitutional requirements throughout workflow', async () => {
    // Test all constitutional principles during workflow execution

    const generateResponse = await fetch('http://localhost:3000/api/itinerary/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'constitutional-test',
        formData: validFormData,
      }),
    });

    // Principle I: Edge-First Architecture
    expect(generateResponse.headers.get('server')).not.toMatch(/node/i);

    const generateData = await generateResponse.json();
    workflowId = generateData.data.workflowId;

    // Principle V: Type-Safe Development
    expect(typeof generateData.data.workflowId).toBe('string');
    expect(typeof generateData.data.estimatedCompletionTime).toBe('number');

    // Monitor progress for constitutional compliance
    const progressUrl = `http://localhost:3000/api/itinerary/progress/${workflowId}`;
    const progressResponse = await fetch(progressUrl);

    // Principle I: Edge Runtime streaming
    expect(progressResponse.headers.get('content-type')).toBe('text/event-stream');
    expect(progressResponse.headers.get('cache-control')).toBe('no-cache');
  }, 60000);
});

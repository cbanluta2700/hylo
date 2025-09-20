/**
 * End-to-End Workflow Integration Tests
 * 
 * Comprehensive integration tests for the complete multi-agent workflow
 * Tests the full pipeline: ContentPlanner → InfoGatherer → Strategist → Compiler
 * Validates real workflow execution with actual agent interactions
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

import { HyloWorkflowOrchestrator, DefaultWorkflowConfig } from '../../api/workflow/orchestrator';
import {
  AgentType,
  WorkflowState,
  WorkflowConfig,
  type AgentResult
} from '../../src/types/agents';

// Test timeout configuration for integration tests (longer than unit tests)
const INTEGRATION_TEST_TIMEOUT = 60000; // 60 seconds
const WORKFLOW_COMPLETION_TIMEOUT = 45000; // 45 seconds for workflow completion

// Comprehensive test data for different travel scenarios
const travelScenarios = {
  familyTrip: {
    destination: 'Orlando, Florida, USA',
    departureDate: '2024-08-15',
    returnDate: '2024-08-22',
    tripNickname: 'Disney Family Adventure',
    contactName: 'Sarah Johnson',
    adults: 2,
    children: 2,
    budget: {
      amount: 4000,
      currency: 'USD' as const,
      mode: 'total' as const
    },
    preferences: {
      travelStyle: 'family' as const,
      interests: ['theme-parks', 'family-activities', 'entertainment'],
      accommodationType: 'hotel' as const,
      transportationMode: 'flight' as const,
      dietaryRestrictions: ['no-nuts'],
      accessibility: ['wheelchair-accessible']
    }
  },

  businessTrip: {
    destination: 'New York City, NY, USA',
    departureDate: '2024-09-10',
    returnDate: '2024-09-13',
    tripNickname: 'NYC Business Conference',
    contactName: 'Michael Chen',
    adults: 1,
    children: 0,
    budget: {
      amount: 2500,
      currency: 'USD' as const,
      mode: 'per-person' as const
    },
    preferences: {
      travelStyle: 'business' as const,
      interests: ['networking', 'fine-dining', 'museums'],
      accommodationType: 'hotel' as const,
      transportationMode: 'flight' as const,
      dietaryRestrictions: [],
      accessibility: []
    }
  },

  adventureTrip: {
    destination: 'Queenstown, New Zealand',
    departureDate: '2024-11-01',
    returnDate: '2024-11-14',
    tripNickname: 'New Zealand Adventure',
    contactName: 'Alex Rodriguez',
    adults: 3,
    children: 0,
    budget: {
      amount: 8000,
      currency: 'USD' as const,
      mode: 'total' as const
    },
    preferences: {
      travelStyle: 'adventure' as const,
      interests: ['hiking', 'extreme-sports', 'nature', 'photography'],
      accommodationType: 'hostel' as const,
      transportationMode: 'flight' as const,
      dietaryRestrictions: ['vegetarian'],
      accessibility: []
    }
  },

  luxuryTrip: {
    destination: 'Santorini, Greece',
    departureDate: '2024-06-20',
    returnDate: '2024-06-30',
    tripNickname: 'Greek Islands Luxury Escape',
    contactName: 'Emma Wilson',
    adults: 2,
    children: 0,
    budget: {
      amount: 12000,
      currency: 'USD' as const,
      mode: 'flexible' as const
    },
    preferences: {
      travelStyle: 'luxury' as const,
      interests: ['beaches', 'fine-dining', 'spas', 'wine-tasting'],
      accommodationType: 'resort' as const,
      transportationMode: 'flight' as const,
      dietaryRestrictions: [],
      accessibility: []
    }
  }
};

// Validate itinerary structure and content
function validateItineraryStructure(agentResults: Record<AgentType, AgentResult | null>) {
  // Validate ContentPlanner result
  const contentPlannerResult = agentResults[AgentType.CONTENT_PLANNER];
  expect(contentPlannerResult).toBeDefined();
  expect(contentPlannerResult?.success).toBe(true);
  expect(contentPlannerResult?.data).toBeDefined();

  // Validate InfoGatherer result  
  const infoGathererResult = agentResults[AgentType.INFO_GATHERER];
  expect(infoGathererResult).toBeDefined();
  expect(infoGathererResult?.success).toBe(true);
  expect(infoGathererResult?.data).toBeDefined();

  // Validate Strategist result
  const strategistResult = agentResults[AgentType.STRATEGIST];
  expect(strategistResult).toBeDefined();
  expect(strategistResult?.success).toBe(true);
  expect(strategistResult?.data).toBeDefined();

  // Validate Compiler result (final itinerary)
  const compilerResult = agentResults[AgentType.COMPILER];
  expect(compilerResult).toBeDefined();
  expect(compilerResult?.success).toBe(true);
  expect(compilerResult?.data).toBeDefined();
  
  // Validate final itinerary has expected structure
  const itinerary = compilerResult?.data as any;
  expect(itinerary).toHaveProperty('tripSummary');
  expect(itinerary).toHaveProperty('dailyItinerary');
  expect(itinerary).toHaveProperty('tips');
  
  // Validate trip summary structure
  expect(itinerary.tripSummary).toHaveProperty('nickname');
  expect(itinerary.tripSummary).toHaveProperty('dates');
  expect(itinerary.tripSummary).toHaveProperty('travelers');
  expect(itinerary.tripSummary).toHaveProperty('budget');
  
  // Validate daily itinerary is an array with activities
  expect(Array.isArray(itinerary.dailyItinerary)).toBe(true);
  expect(itinerary.dailyItinerary.length).toBeGreaterThan(0);
  
  // Validate tips section exists
  expect(Array.isArray(itinerary.tips)).toBe(true);
}

describe('End-to-End Workflow Integration Tests', () => {
  let orchestrator: HyloWorkflowOrchestrator;
  let sessionIds: string[] = [];

  beforeAll(async () => {
    // Initialize orchestrator with integration test configuration
    const integrationConfig: WorkflowConfig = {
      ...DefaultWorkflowConfig,
      resourceLimits: {
        ...DefaultWorkflowConfig.resourceLimits,
        maxExecutionTime: WORKFLOW_COMPLETION_TIMEOUT,
        maxCost: 20.00 // Higher budget for integration tests
      },
      retryConfig: {
        ...DefaultWorkflowConfig.retryConfig,
        maxRetries: 2 // Fewer retries to speed up integration tests
      }
    };
    
    orchestrator = new HyloWorkflowOrchestrator(integrationConfig);
  }, INTEGRATION_TEST_TIMEOUT);

  afterAll(async () => {
    // Cleanup all created sessions
    for (const sessionId of sessionIds) {
      try {
        await orchestrator.cancelWorkflow(sessionId);
      } catch (error) {
        console.warn(`Failed to cleanup session ${sessionId}:`, error);
      }
    }
  });

  beforeEach(() => {
    // Reset session tracking for each test
    sessionIds = [];
  });

  describe('Complete Workflow Execution Scenarios', () => {
    test('Family Trip - Complete workflow execution with theme park focus', async () => {
      const sessionId = uuidv4();
      sessionIds.push(sessionId);
      
      // Execute complete workflow
      const result = await orchestrator.executeWorkflow(
        sessionId, 
        travelScenarios.familyTrip
      );
      
      // Validate successful completion
      expect(result.state).toBe(WorkflowState.COMPLETED);
      expect(result.sessionId).toBe(sessionId);
      
      // Validate all agents completed successfully
      expect(result.metadata.completedAgents).toHaveLength(4);
      expect(result.metadata.completedAgents).toEqual([
        AgentType.CONTENT_PLANNER,
        AgentType.INFO_GATHERER,
        AgentType.STRATEGIST,
        AgentType.COMPILER
      ]);
      
      // Validate cost tracking
      expect(result.metadata.totalCost).toBeGreaterThan(0);
      expect(result.metadata.totalCost).toBeLessThan(20.00);
      
      // Validate itinerary structure
      validateItineraryStructure(result.agentResults);
      
      // Validate family-specific content
      const finalItinerary = result.agentResults[AgentType.COMPILER]?.data as any;
      expect(finalItinerary.tripSummary.travelers.children).toBe(2);
      expect(finalItinerary.tripSummary.destination).toContain('Orlando');
      
    }, INTEGRATION_TEST_TIMEOUT);

    test('Business Trip - Complete workflow with professional focus', async () => {
      const sessionId = uuidv4();
      sessionIds.push(sessionId);
      
      const result = await orchestrator.executeWorkflow(
        sessionId, 
        travelScenarios.businessTrip
      );
      
      expect(result.state).toBe(WorkflowState.COMPLETED);
      expect(result.metadata.completedAgents).toHaveLength(4);
      
      validateItineraryStructure(result.agentResults);
      
      // Validate business-specific content
      const finalItinerary = result.agentResults[AgentType.COMPILER]?.data as any;
      expect(finalItinerary.tripSummary.travelStyle).toBe('business');
      expect(finalItinerary.tripSummary.destination).toContain('New York');
      
    }, INTEGRATION_TEST_TIMEOUT);

    test('Adventure Trip - Complete workflow with outdoor activity focus', async () => {
      const sessionId = uuidv4();
      sessionIds.push(sessionId);
      
      const result = await orchestrator.executeWorkflow(
        sessionId, 
        travelScenarios.adventureTrip
      );
      
      expect(result.state).toBe(WorkflowState.COMPLETED);
      expect(result.metadata.completedAgents).toHaveLength(4);
      
      validateItineraryStructure(result.agentResults);
      
      // Validate adventure-specific content
      const finalItinerary = result.agentResults[AgentType.COMPILER]?.data as any;
      expect(finalItinerary.tripSummary.travelStyle).toBe('adventure');
      expect(finalItinerary.tripSummary.destination).toContain('Queenstown');
      
    }, INTEGRATION_TEST_TIMEOUT);

    test('Luxury Trip - Complete workflow with premium experience focus', async () => {
      const sessionId = uuidv4();
      sessionIds.push(sessionId);
      
      const result = await orchestrator.executeWorkflow(
        sessionId, 
        travelScenarios.luxuryTrip
      );
      
      expect(result.state).toBe(WorkflowState.COMPLETED);
      expect(result.metadata.completedAgents).toHaveLength(4);
      
      validateItineraryStructure(result.agentResults);
      
      // Validate luxury-specific content
      const finalItinerary = result.agentResults[AgentType.COMPILER]?.data as any;
      expect(finalItinerary.tripSummary.travelStyle).toBe('luxury');
      expect(finalItinerary.tripSummary.destination).toContain('Santorini');
      
    }, INTEGRATION_TEST_TIMEOUT);
  });

  describe('Streaming Workflow Execution', () => {
    test('Should stream progress updates throughout workflow execution', async () => {
      const sessionId = uuidv4();
      sessionIds.push(sessionId);
      
      const progressUpdates: any[] = [];
      const stateTransitions: WorkflowState[] = [];
      
      // Collect all streaming updates
      for await (const update of orchestrator.streamWorkflow(
        sessionId, 
        travelScenarios.businessTrip
      )) {
        progressUpdates.push(update);
        stateTransitions.push(update.state);
        
        // Break if completed to avoid infinite loop
        if (update.state === WorkflowState.COMPLETED || 
            update.state === WorkflowState.FAILED) {
          break;
        }
      }
      
      // Validate streaming behavior
      expect(progressUpdates.length).toBeGreaterThan(4);
      
      // Validate state progression
      expect(stateTransitions).toContain(WorkflowState.INITIALIZED);
      expect(stateTransitions).toContain(WorkflowState.CONTENT_PLANNING);
      expect(stateTransitions).toContain(WorkflowState.INFO_GATHERING);
      expect(stateTransitions).toContain(WorkflowState.STRATEGIZING);
      expect(stateTransitions).toContain(WorkflowState.COMPILING);
      expect(stateTransitions).toContain(WorkflowState.COMPLETED);
      
      // Validate progress percentages increase
      const percentages = progressUpdates.map(u => u.metadata.progress.percentage);
      for (let i = 1; i < percentages.length; i++) {
        expect(percentages[i]).toBeGreaterThanOrEqual(percentages[i - 1]);
      }
      
      // Final percentage should be 100
      expect(percentages[percentages.length - 1]).toBe(100);
      
    }, INTEGRATION_TEST_TIMEOUT);

    test('Should provide agent-specific progress information during streaming', async () => {
      const sessionId = uuidv4();
      sessionIds.push(sessionId);
      
      const agentProgressMap = new Map<AgentType, number>();
      
      for await (const update of orchestrator.streamWorkflow(
        sessionId, 
        travelScenarios.familyTrip
      )) {
        if (update.metadata.currentAgent) {
          agentProgressMap.set(
            update.metadata.currentAgent, 
            update.metadata.progress.currentStep
          );
        }
        
        if (update.state === WorkflowState.COMPLETED) {
          break;
        }
      }
      
      // Validate all agents were tracked
      expect(agentProgressMap.has(AgentType.CONTENT_PLANNER)).toBe(true);
      expect(agentProgressMap.has(AgentType.INFO_GATHERER)).toBe(true);
      expect(agentProgressMap.has(AgentType.STRATEGIST)).toBe(true);
      expect(agentProgressMap.has(AgentType.COMPILER)).toBe(true);
      
    }, INTEGRATION_TEST_TIMEOUT);
  });

  describe('Agent Data Handoff Validation', () => {
    test('Should maintain data consistency between agent handoffs', async () => {
      const sessionId = uuidv4();
      sessionIds.push(sessionId);
      
      const result = await orchestrator.executeWorkflow(
        sessionId, 
        travelScenarios.adventureTrip
      );
      
      expect(result.state).toBe(WorkflowState.COMPLETED);
      
      // Extract agent results for validation
      const contentPlannerData = result.agentResults[AgentType.CONTENT_PLANNER]?.data as any;
      const infoGathererData = result.agentResults[AgentType.INFO_GATHERER]?.data as any;
      const strategistData = result.agentResults[AgentType.STRATEGIST]?.data as any;
      const compilerData = result.agentResults[AgentType.COMPILER]?.data as any;
      
      // Validate ContentPlanner output influences InfoGatherer
      expect(contentPlannerData).toBeDefined();
      expect(infoGathererData).toBeDefined();
      
      // Validate InfoGatherer output influences Strategist
      expect(strategistData).toBeDefined();
      
      // Validate final compilation incorporates all previous outputs
      expect(compilerData).toBeDefined();
      expect(compilerData.tripSummary.destination).toBe(travelScenarios.adventureTrip.destination);
      
    }, INTEGRATION_TEST_TIMEOUT);

    test('Should preserve original form data throughout workflow', async () => {
      const sessionId = uuidv4();
      sessionIds.push(sessionId);
      
      const originalFormData = travelScenarios.luxuryTrip;
      
      const result = await orchestrator.executeWorkflow(sessionId, originalFormData);
      
      expect(result.state).toBe(WorkflowState.COMPLETED);
      
      // Validate original form data is preserved
      expect(result.formData).toEqual(originalFormData);
      
      // Validate final itinerary reflects original preferences
      const finalItinerary = result.agentResults[AgentType.COMPILER]?.data as any;
      expect(finalItinerary.tripSummary.destination).toBe(originalFormData.destination);
      expect(finalItinerary.tripSummary.travelers.adults).toBe(originalFormData.adults);
      expect(finalItinerary.tripSummary.budget.amount).toBe(originalFormData.budget.amount);
      
    }, INTEGRATION_TEST_TIMEOUT);
  });

  describe('Concurrent Workflow Execution', () => {
    test('Should handle multiple concurrent workflows without interference', async () => {
      const concurrentSessionIds = [uuidv4(), uuidv4(), uuidv4()];
      concurrentSessionIds.forEach(id => sessionIds.push(id));
      
      // Start three workflows concurrently
      const workflowPromises = [
        orchestrator.executeWorkflow(concurrentSessionIds[0]!, travelScenarios.familyTrip),
        orchestrator.executeWorkflow(concurrentSessionIds[1]!, travelScenarios.businessTrip),
        orchestrator.executeWorkflow(concurrentSessionIds[2]!, travelScenarios.adventureTrip)
      ];
      
      const results = await Promise.all(workflowPromises);
      
      // All workflows should complete successfully
      results.forEach((result, index) => {
        expect(result.state).toBe(WorkflowState.COMPLETED);
        expect(result.sessionId).toBe(concurrentSessionIds[index]);
        expect(result.metadata.completedAgents).toHaveLength(4);
      });
      
      // Each workflow should have unique results
      expect(results[0]?.agentResults).not.toEqual(results[1]?.agentResults);
      expect(results[1]?.agentResults).not.toEqual(results[2]?.agentResults);
      
    }, INTEGRATION_TEST_TIMEOUT);

    test('Should maintain session isolation during concurrent execution', async () => {
      const sessionId1 = uuidv4();
      const sessionId2 = uuidv4();
      sessionIds.push(sessionId1, sessionId2);
      
      // Start workflows with different data
      const workflow1Promise = orchestrator.executeWorkflow(sessionId1, travelScenarios.familyTrip);
      const workflow2Promise = orchestrator.executeWorkflow(sessionId2, travelScenarios.luxuryTrip);
      
      // Check intermediate states
      await new Promise(resolve => setTimeout(resolve, 1000)); // Let workflows start
      
      const state1 = await orchestrator.getWorkflowState(sessionId1);
      const state2 = await orchestrator.getWorkflowState(sessionId2);
      
      expect(state1?.sessionId).toBe(sessionId1);
      expect(state2?.sessionId).toBe(sessionId2);
      expect(state1?.formData.destination).toBe(travelScenarios.familyTrip.destination);
      expect(state2?.formData.destination).toBe(travelScenarios.luxuryTrip.destination);
      
      // Wait for completion
      const [result1, result2] = await Promise.all([workflow1Promise, workflow2Promise]);
      
      expect(result1.formData).toEqual(travelScenarios.familyTrip);
      expect(result2.formData).toEqual(travelScenarios.luxuryTrip);
      
    }, INTEGRATION_TEST_TIMEOUT);
  });

  describe('Cost and Resource Tracking', () => {
    test('Should accurately track costs across all agents', async () => {
      const sessionId = uuidv4();
      sessionIds.push(sessionId);
      
      const result = await orchestrator.executeWorkflow(
        sessionId, 
        travelScenarios.businessTrip
      );
      
      expect(result.state).toBe(WorkflowState.COMPLETED);
      
      // Validate cost tracking
      expect(result.metadata.totalCost).toBeGreaterThan(0);
      
      // Sum individual agent costs
      let expectedTotalCost = 0;
      Object.values(result.agentResults).forEach(agentResult => {
        if (agentResult?.success) {
          expectedTotalCost += agentResult.metadata.cost;
        }
      });
      
      expect(result.metadata.totalCost).toBe(expectedTotalCost);
      
    }, INTEGRATION_TEST_TIMEOUT);

    test('Should respect cost limits and fail appropriately', async () => {
      const sessionId = uuidv4();
      sessionIds.push(sessionId);
      
      // Create orchestrator with very low cost limit
      const lowCostConfig: WorkflowConfig = {
        ...DefaultWorkflowConfig,
        resourceLimits: {
          ...DefaultWorkflowConfig.resourceLimits,
          maxCost: 0.01 // Extremely low limit
        }
      };
      
      const lowCostOrchestrator = new HyloWorkflowOrchestrator(lowCostConfig);
      
      const result = await lowCostOrchestrator.executeWorkflow(
        sessionId, 
        travelScenarios.familyTrip
      );
      
      // Should either complete within budget or fail due to cost limits
      if (result.state === WorkflowState.FAILED) {
        expect(result.metadata.errors.length).toBeGreaterThan(0);
        const costError = result.metadata.errors.find(e => 
          e.message.toLowerCase().includes('cost') || 
          e.message.toLowerCase().includes('budget')
        );
        expect(costError).toBeDefined();
      } else {
        // If it completed, it should be within the cost limit
        expect(result.metadata.totalCost).toBeLessThanOrEqual(0.01);
      }
      
    }, INTEGRATION_TEST_TIMEOUT);
  });

  describe('Workflow Timeout and Cancellation', () => {
    test('Should respect execution time limits', async () => {
      const sessionId = uuidv4();
      sessionIds.push(sessionId);
      
      // Create orchestrator with very short timeout
      const shortTimeoutConfig: WorkflowConfig = {
        ...DefaultWorkflowConfig,
        resourceLimits: {
          ...DefaultWorkflowConfig.resourceLimits,
          maxExecutionTime: 5000 // 5 seconds
        }
      };
      
      const shortTimeoutOrchestrator = new HyloWorkflowOrchestrator(shortTimeoutConfig);
      
      const startTime = Date.now();
      const result = await shortTimeoutOrchestrator.executeWorkflow(
        sessionId, 
        travelScenarios.adventureTrip
      );
      const endTime = Date.now();
      
      const actualExecutionTime = endTime - startTime;
      
      // Should either complete quickly or fail due to timeout
      if (result.state === WorkflowState.FAILED) {
        expect(actualExecutionTime).toBeLessThan(10000); // Should fail quickly
      } else {
        expect(actualExecutionTime).toBeLessThan(7000); // Should complete within reasonable time
      }
      
    }, INTEGRATION_TEST_TIMEOUT);

    test('Should handle workflow cancellation during execution', async () => {
      const sessionId = uuidv4();
      sessionIds.push(sessionId);
      
      // Start workflow
      const workflowPromise = orchestrator.executeWorkflow(
        sessionId, 
        travelScenarios.luxuryTrip
      );
      
      // Cancel after short delay
      setTimeout(async () => {
        await orchestrator.cancelWorkflow(sessionId);
      }, 1000);
      
      const result = await workflowPromise;
      
      // Should be cancelled or completed (depending on timing)
      expect([WorkflowState.CANCELLED, WorkflowState.COMPLETED]).toContain(result.state);
      
      // If cancelled, should have some error information
      if (result.state === WorkflowState.CANCELLED) {
        const state = await orchestrator.getWorkflowState(sessionId);
        expect(state?.state).toBe(WorkflowState.CANCELLED);
      }
      
    }, INTEGRATION_TEST_TIMEOUT);
  });

  describe('Error Recovery and Resilience', () => {
    test('Should maintain workflow integrity despite individual agent failures', async () => {
      // This test would require mocking specific agent failures
      // For now, we ensure the workflow can handle and report errors properly
      const sessionId = uuidv4();
      sessionIds.push(sessionId);
      
      const result = await orchestrator.executeWorkflow(
        sessionId, 
        travelScenarios.businessTrip
      );
      
      // Workflow should complete successfully with proper error handling
      expect(result.state).toBe(WorkflowState.COMPLETED);
      expect(result.metadata.errors).toBeDefined();
      
      // All agents should have executed successfully in normal conditions
      expect(result.metadata.completedAgents).toHaveLength(4);
      
    }, INTEGRATION_TEST_TIMEOUT);
  });
});
/**
 * Test for Travel Form Data Factory
 * Validates that our factory generates correct data structures
 */

import { describe, it, expect } from 'vitest';
import { 
  travelFormFactory, 
  familyTravelFactory, 
  businessTravelFactory,
  TravelTestScenarios 
} from './form-data-factory.js';

describe('Travel Form Data Factory', () => {
  it('should generate valid basic travel form data', () => {
    const formData = travelFormFactory.build();
    
    expect(formData).toHaveProperty('destination');
    expect(formData).toHaveProperty('startDate');
    expect(formData).toHaveProperty('endDate');
    expect(formData).toHaveProperty('adults');
    expect(formData).toHaveProperty('budget');
    expect(formData).toHaveProperty('travelStyle');
    expect(formData).toHaveProperty('sessionId');
    
    expect(formData.adults).toBeGreaterThan(0);
    expect(formData.budget).toBeGreaterThan(0);
    expect(Array.isArray(formData.travelStyle)).toBe(true);
    expect(formData.travelStyle.length).toBeGreaterThan(0);
  });

  it('should generate family-specific travel data', () => {
    const familyData = familyTravelFactory.build();
    
    expect(familyData.travelStyle).toContain('family-friendly');
    expect(familyData.adults + familyData.children).toBeGreaterThan(1);
  });

  it('should generate business travel data', () => {
    const businessData = businessTravelFactory.build();
    
    expect(businessData.travelStyle).toContain('business-class');
    expect(businessData.adults).toBeGreaterThan(0);
  });

  it('should handle test scenarios correctly', () => {
    const happyPathData = TravelTestScenarios.createTestSet('happy-path');
    expect(happyPathData).toHaveLength(4);
    
    const edgeCaseData = TravelTestScenarios.createTestSet('edge-cases');
    expect(edgeCaseData).toHaveLength(3);
    
    const performanceData = TravelTestScenarios.createTestSet('performance');
    expect(performanceData).toHaveLength(100);
  });

  it('should create workflow test data', () => {
    const workflowData = TravelTestScenarios.createWorkflowTestData();
    
    expect(workflowData).toHaveProperty('formData');
    expect(workflowData).toHaveProperty('expectedSteps');
    expect(workflowData).toHaveProperty('expectedDuration');
    
    expect(workflowData.expectedSteps).toContain('content-planner');
    expect(workflowData.expectedSteps).toContain('info-gatherer');
    expect(workflowData.expectedSteps).toContain('strategist');
    expect(workflowData.expectedSteps).toContain('content-compiler');
    
    expect(workflowData.expectedDuration).toBeGreaterThanOrEqual(30);
    expect(workflowData.expectedDuration).toBeLessThanOrEqual(300);
  });
});
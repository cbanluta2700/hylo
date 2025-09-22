import {
  transformExistingFormDataToWorkflow,
  transformFormDataForWorkflow,
} from '../src/utils/workflow-transforms';
import { validateTravelFormData } from '../src/schemas/ai-workflow-schemas';
import { FormData } from '../src/components/TripDetails/types';

/**
 * Test script to validate Phase 3 form data transformation
 * Run with: npx tsx tests/test-form-transformation.ts
 */

// Sample form data that mimics what App.tsx produces
const sampleFormData: FormData = {
  // Basic trip details
  location: 'Paris, France',
  departDate: '2025-10-15',
  returnDate: '2025-10-22',
  flexibleDates: false,
  plannedDays: 7,
  adults: 2,
  children: 1,
  childrenAges: [8],

  // Budget
  budget: 5000,
  currency: 'USD',
  flexibleBudget: false,
  budgetMode: 'total',

  // Travel style
  travelStyleChoice: 'answer-questions',
  travelStyleAnswers: {
    experience: ['experienced'],
    vibes: ['romantic', 'cultural'],
    vibesOther: '',
    sampleDays: ['museum-day'],
    dinnerChoices: ['local-spots'],
    tripNickname: 'Paris Anniversary',
  },

  // Additional selections
  selectedGroups: ['couple'],
  selectedInterests: ['art', 'food', 'history'],
  selectedInclusions: ['museums', 'restaurants'],
  customGroupText: '',
  customInterestsText: '',
  customInclusionsText: '',
  inclusionPreferences: {},

  // Optional fields
  tripNickname: 'Paris Anniversary',
  contactName: 'John Doe',
  contactEmail: 'john@example.com',
} as FormData;

async function testTransformation() {
  console.group('🧪 PHASE 3 TRANSFORMATION TEST');

  try {
    console.log('📊 Input FormData:', sampleFormData);

    // Step 1: Transform existing FormData to TravelFormData
    console.log('\n🔄 Step 1: Transforming FormData to TravelFormData...');
    const travelFormData = transformExistingFormDataToWorkflow(sampleFormData);
    console.log('✅ Transformed TravelFormData:', travelFormData);

    // Step 2: Validate the transformed data
    console.log('\n🔍 Step 2: Validating TravelFormData...');
    const validationResult = validateTravelFormData(travelFormData);

    if (validationResult.success) {
      console.log('✅ Validation passed!');
      console.log('📋 Valid data:', validationResult.data);

      // Step 3: Transform for AI workflow
      console.log('\n🚀 Step 3: Transforming for AI workflow...');
      const workflowData = transformFormDataForWorkflow(travelFormData);
      console.log('✅ AI Workflow Data:', workflowData);

      console.log('\n🎉 All transformations successful!');
    } else {
      console.error('❌ Validation failed!');
      console.error('🐛 Validation errors:', validationResult.error.errors);
    }
  } catch (error) {
    console.error('💥 Transformation error:', error);
  }

  console.groupEnd();
}

// Run the test
testTransformation();

export { testTransformation };

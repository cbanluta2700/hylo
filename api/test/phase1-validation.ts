/**
 * Phase 1 Validation Test
 *
 * Simple test to validate the new Inngest implementation
 * Constitutional Requirements: Edge Runtime compatibility
 */

export const runtime = 'edge';

export default async function handler(request: Request): Promise<Response> {
  console.log('🧪 [PHASE1-TEST] Validation test started');

  try {
    // Test 1: Import Inngest client
    const { inngest } = await import('../inngest/client.js');
    console.log('✅ [PHASE1-TEST] Inngest client imported successfully');

    // Test 2: Import AI clients
    const { validateAIProviders } = await import('../../src/lib/ai-clients/hylo-ai-clients.js');
    const aiValid = validateAIProviders();
    console.log(`✅ [PHASE1-TEST] AI providers validation: ${aiValid ? 'PASS' : 'FAIL'}`);

    // Test 3: Import main function
    const { generateItinerary } = await import('../inngest/functions/generateItinerary.js');
    console.log('✅ [PHASE1-TEST] Main function imported successfully');

    // Test 4: Import all agent functions
    const { architectAgent } = await import('../inngest/functions/architectAgent.js');
    const { gathererAgent } = await import('../inngest/functions/gathererAgent.js');
    const { specialistAgent } = await import('../inngest/functions/specialistAgent.js');
    const { formatterAgent } = await import('../inngest/functions/formatterAgent.js');
    console.log('✅ [PHASE1-TEST] All agent functions imported successfully');

    // Test 5: Check environment variables
    const requiredEnvVars = ['XAI_API_KEY', 'INNGEST_SIGNING_KEY'];
    const envStatus = requiredEnvVars.map((key) => ({
      key,
      status: process.env[key] ? 'SET' : 'MISSING',
    }));

    console.log('✅ [PHASE1-TEST] Environment variables checked');

    return Response.json({
      status: 'Phase 1 Implementation Valid',
      timestamp: new Date().toISOString(),
      tests: {
        inngestClient: '✅ PASS',
        aiProviders: aiValid ? '✅ PASS' : '❌ FAIL',
        mainFunction: '✅ PASS',
        agentFunctions: '✅ PASS',
        environmentVariables: envStatus,
      },
      functions: {
        main: 'generateItinerary',
        agents: ['architectAgent', 'gathererAgent', 'specialistAgent', 'formatterAgent'],
      },
      endpoints: {
        inngestHandler: '/api/inngest',
        validation: '/api/test/phase1-validation',
      },
      nextSteps: [
        'Start Inngest dev server: npx inngest-cli@latest dev',
        'Test function registration: GET /api/inngest',
        'Trigger workflow: POST /api/inngest with itinerary/generate event',
      ],
    });
  } catch (error) {
    console.error('💥 [PHASE1-TEST] Validation failed:', error);

    return Response.json(
      {
        status: 'Phase 1 Implementation Failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

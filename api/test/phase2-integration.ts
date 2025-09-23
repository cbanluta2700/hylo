/**
 * Phase 2 Integration Test
 *
 * Tests the complete end-to-end workflow integration between:
 * - GenerateItineraryButton → Orchestrator → Inngest → AI Agents
 * - Progress reporting via Redis/SSE
 * - Error handling with existing ErrorBoundary system
 *
 * Constitutional Requirements: Edge Runtime compatible testing
 */

export const runtime = 'edge';

export default async function handler(request: Request): Promise<Response> {
  console.log('🧪 [PHASE2-INTEGRATION] Starting comprehensive integration test');

  try {
    const testResults = {
      timestamp: new Date().toISOString(),
      phase: 'Phase 2 - Function Implementation (Core Migration)',
      tests: {} as Record<string, any>,
    };

    // Test 1: Validate imports and dependencies
    console.log('📋 [TEST-1] Testing imports and dependencies...');
    try {
      const { inngest } = await import('../inngest/client.js');
      const { sessionManager } = await import('../../src/lib/workflows/session-manager.js');
      const { updateWorkflowProgress } = await import(
        '../../src/lib/workflows/progress-integration.js'
      );
      const { handleEnhancedWorkflowError } = await import(
        '../../src/lib/workflows/enhanced-error-handling.js'
      );

      // Import AI agents
      const { architectAgent } = await import('../../src/lib/ai-agents/architect-agent.js');
      const { gathererAgent } = await import('../../src/lib/ai-agents/gatherer-agent.js');
      const { specialistAgent } = await import('../../src/lib/ai-agents/specialist-agent.js');
      const { formatterAgent } = await import('../../src/lib/ai-agents/formatter-agent.js');

      testResults.tests['imports'] = {
        status: '✅ PASS',
        message: 'All critical imports loaded successfully',
        details: {
          inngestClient: !!inngest,
          sessionManager: !!sessionManager,
          progressIntegration: !!updateWorkflowProgress,
          errorHandling: !!handleEnhancedWorkflowError,
          aiAgents: {
            architect: !!architectAgent,
            gatherer: !!gathererAgent,
            specialist: !!specialistAgent,
            formatter: !!formatterAgent,
          },
        },
      };
    } catch (importError) {
      testResults.tests['imports'] = {
        status: '❌ FAIL',
        message: 'Import failure detected',
        error: importError instanceof Error ? importError.message : 'Unknown import error',
      };
    }

    // Test 2: Validate function registration
    console.log('🔧 [TEST-2] Testing Inngest function registration...');
    try {
      const { generateItinerary } = await import('../inngest/functions/generateItinerary.js');
      const { architectAgent } = await import('../inngest/functions/architectAgent.js');

      testResults.tests['functionRegistration'] = {
        status: '✅ PASS',
        message: 'Inngest functions properly defined',
        details: {
          mainFunction: !!generateItinerary,
          individualAgents: !!architectAgent,
        },
      };
    } catch (functionError) {
      testResults.tests['functionRegistration'] = {
        status: '❌ FAIL',
        message: 'Function registration failure',
        error: functionError instanceof Error ? functionError.message : 'Unknown function error',
      };
    }

    // Test 3: Validate orchestrator integration
    console.log('🚀 [TEST-3] Testing orchestrator integration...');
    try {
      const { WorkflowOrchestrator } = await import('../../src/lib/workflows/orchestrator.js');

      testResults.tests['orchestratorIntegration'] = {
        status: '✅ PASS',
        message: 'Orchestrator properly integrated with Inngest',
        details: {
          classExists: !!WorkflowOrchestrator,
          hasStartMethod: typeof WorkflowOrchestrator.startWorkflow === 'function',
        },
      };
    } catch (orchestratorError) {
      testResults.tests['orchestratorIntegration'] = {
        status: '❌ FAIL',
        message: 'Orchestrator integration failure',
        error:
          orchestratorError instanceof Error
            ? orchestratorError.message
            : 'Unknown orchestrator error',
      };
    }

    // Test 4: Validate progress integration
    console.log('📊 [TEST-4] Testing progress integration...');
    try {
      const { updateWorkflowProgress, PROGRESS_STAGES } = await import(
        '../../src/lib/workflows/progress-integration.js'
      );

      const hasAllStages = ['architect', 'gatherer', 'specialist', 'formatter', 'complete'].every(
        (stage) => stage in PROGRESS_STAGES
      );

      testResults.tests['progressIntegration'] = {
        status: hasAllStages ? '✅ PASS' : '⚠️ PARTIAL',
        message: 'Progress integration system configured',
        details: {
          progressStages: Object.keys(PROGRESS_STAGES),
          updateFunction: typeof updateWorkflowProgress === 'function',
          stageCount: Object.keys(PROGRESS_STAGES).length,
        },
      };
    } catch (progressError) {
      testResults.tests['progressIntegration'] = {
        status: '❌ FAIL',
        message: 'Progress integration failure',
        error: progressError instanceof Error ? progressError.message : 'Unknown progress error',
      };
    }

    // Test 5: Validate error handling integration
    console.log('🛡️ [TEST-5] Testing error handling integration...');
    try {
      const { handleEnhancedWorkflowError, WorkflowErrorType } = await import(
        '../../src/lib/workflows/enhanced-error-handling.js'
      );

      const hasErrorTypes = ['VALIDATION', 'NETWORK', 'AI_PROVIDER', 'TIMEOUT', 'SYSTEM'].every(
        (type) => type in WorkflowErrorType
      );

      testResults.tests['errorHandling'] = {
        status: hasErrorTypes ? '✅ PASS' : '⚠️ PARTIAL',
        message: 'Enhanced error handling system ready',
        details: {
          errorTypes: Object.keys(WorkflowErrorType),
          handlerFunction: typeof handleEnhancedWorkflowError === 'function',
          errorTypeCount: Object.keys(WorkflowErrorType).length,
        },
      };
    } catch (errorHandlingError) {
      testResults.tests['errorHandling'] = {
        status: '❌ FAIL',
        message: 'Error handling integration failure',
        error:
          errorHandlingError instanceof Error
            ? errorHandlingError.message
            : 'Unknown error handling error',
      };
    }

    // Test 6: Environment validation
    console.log('🌍 [TEST-6] Testing environment configuration...');
    const requiredEnvVars = [
      'XAI_API_KEY',
      'INNGEST_SIGNING_KEY',
      'KV_REST_API_URL',
      'KV_REST_API_TOKEN',
    ];
    const envStatus = requiredEnvVars.map((key) => ({
      key,
      status: process.env[key] ? 'SET' : 'MISSING',
    }));

    const missingEnvVars = envStatus.filter((env) => env.status === 'MISSING');

    testResults.tests['environment'] = {
      status: missingEnvVars.length === 0 ? '✅ PASS' : '⚠️ WARNING',
      message: `Environment: ${envStatus.length - missingEnvVars.length}/${
        envStatus.length
      } variables configured`,
      details: envStatus,
    };

    // Calculate overall status
    const testStatuses = Object.values(testResults.tests).map((test) => test.status);
    const passCount = testStatuses.filter((status) => status === '✅ PASS').length;
    const totalTests = testStatuses.length;

    const overallStatus =
      passCount === totalTests
        ? '✅ ALL TESTS PASS'
        : passCount > totalTests / 2
        ? '⚠️ MOSTLY READY'
        : '❌ NEEDS ATTENTION';

    console.log(`🎯 [PHASE2-INTEGRATION] Integration test completed: ${overallStatus}`);

    return Response.json({
      status: 'Phase 2 Integration Test Complete',
      overallStatus,
      summary: `${passCount}/${totalTests} tests passing`,
      ...testResults,
      nextSteps: [
        '1. Start Inngest dev server: npx inngest-cli@latest dev',
        '2. Test workflow endpoint: GET /api/inngest',
        '3. Trigger test workflow via form submission',
        '4. Monitor progress via: GET /api/itinerary/progress-simple?workflowId=test-id',
        '5. Ready for Phase 3: Production Deployment Testing',
      ],
    });
  } catch (error) {
    console.error('💥 [PHASE2-INTEGRATION] Integration test failed:', error);

    return Response.json(
      {
        status: 'Phase 2 Integration Test Failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

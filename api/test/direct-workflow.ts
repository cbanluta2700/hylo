/**
 * Test endpoint to verify deployment and direct workflow
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  console.log('🧪 [Test-Direct] Testing direct workflow execution');

  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Test importing the direct workflow
    const { executeWorkflowDirectly } = await import('../../../src/inngest/direct-workflow.js');

    console.log('✅ [Test-Direct] Successfully imported direct workflow function');

    // Test the session manager
    const { sessionManager } = await import('../../../src/lib/workflows/session-manager.js');

    console.log('✅ [Test-Direct] Successfully imported session manager');

    return Response.json({
      success: true,
      message: 'Direct workflow imports successful',
      timestamp: new Date().toISOString(),
      importsWorking: true,
    });
  } catch (error) {
    console.error('💥 [Test-Direct] Import failed:', error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        importsWorking: false,
      },
      { status: 500 }
    );
  }
}

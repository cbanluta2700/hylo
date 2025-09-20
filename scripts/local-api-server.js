/**
 * Local Development API Server
 * 
 * Simple Express server to run the workflow API endpoints locally
 * for testing and development purposes.
 */

import express from 'express';
import cors from 'cors';
import { HyloWorkflowOrchestrator, DefaultWorkflowConfig } from '../api/workflow/orchestrator.js';
import { TravelFormDataSchema } from '../src/types/agents.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'hylo-workflow-api',
    version: '1.0.0'
  });
});

// Workflow start endpoint
app.post('/api/workflow/start', async (req, res) => {
  try {
    console.log('🚀 Workflow start request received:', {
      formData: req.body.formData ? 'Present' : 'Missing',
      sessionId: req.body.sessionId,
      streaming: req.body.streaming
    });

    // Validate request body
    const validation = TravelFormDataSchema.safeParse(req.body.formData);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form data',
        errors: validation.error.errors
      });
    }

    const { formData, sessionId, streaming = false } = req.body;
    
    // Create workflow orchestrator
    const orchestrator = new HyloWorkflowOrchestrator(DefaultWorkflowConfig);
    
    if (streaming) {
      // Set up streaming response
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      // Start workflow with streaming
      const workflowSessionId = sessionId || `local-${Date.now()}`;
      
      try {
        // Send initial event
        res.write(`event: workflow-started\ndata: ${JSON.stringify({
          sessionId: workflowSessionId,
          state: 'initializing',
          message: 'Workflow started'
        })}\n\n`);

        // Execute workflow (this is a simplified version for local testing)
        const result = await orchestrator.executeWorkflow(validation.data, workflowSessionId);
        
        // Send progress events
        res.write(`event: agent-progress\ndata: ${JSON.stringify({
          agent: 'ContentPlanner',
          status: 'completed',
          progress: 25
        })}\n\n`);

        res.write(`event: agent-progress\ndata: ${JSON.stringify({
          agent: 'InfoGatherer', 
          status: 'completed',
          progress: 50
        })}\n\n`);

        res.write(`event: agent-progress\ndata: ${JSON.stringify({
          agent: 'Strategist',
          status: 'completed', 
          progress: 75
        })}\n\n`);

        res.write(`event: agent-progress\ndata: ${JSON.stringify({
          agent: 'Compiler',
          status: 'completed',
          progress: 100
        })}\n\n`);

        // Send completion event
        res.write(`event: workflow-completed\ndata: ${JSON.stringify({
          success: result.success,
          itinerary: result.itinerary,
          sessionId: workflowSessionId,
          metadata: result.metadata
        })}\n\n`);

        res.end();
        
      } catch (error) {
        res.write(`event: error\ndata: ${JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error'
        })}\n\n`);
        res.end();
      }
      
    } else {
      // Non-streaming response
      const workflowSessionId = sessionId || `local-${Date.now()}`;
      const result = await orchestrator.executeWorkflow(validation.data, workflowSessionId);
      
      res.json({
        success: result.success,
        sessionId: workflowSessionId,
        state: result.success ? 'completed' : 'failed',
        message: result.success ? 'Workflow completed successfully' : 'Workflow failed',
        data: result.itinerary,
        metadata: result.metadata
      });
    }

  } catch (error) {
    console.error('Workflow execution error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Workflow state endpoint
app.get('/api/workflow/state', async (req, res) => {
  const { sessionId } = req.query;
  
  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: 'sessionId query parameter required'
    });
  }

  try {
    const orchestrator = new HyloWorkflowOrchestrator(DefaultWorkflowConfig);
    const state = await orchestrator.getWorkflowState(sessionId);
    
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      sessionId,
      state: state.state,
      progress: state.metadata.progress,
      totalCost: state.metadata.totalCost,
      completedAgents: state.metadata.completedAgents,
      errors: state.metadata.errors
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get workflow state',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Local Hylo Workflow API Server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔄 Workflow endpoint: http://localhost:${PORT}/api/workflow/start`);
});
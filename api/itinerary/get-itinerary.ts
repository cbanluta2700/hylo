export const config = { runtime: 'edge' };

// Simulate AI workflow progress for demonstration
const getAIProgress = (workflowId: string) => {
  const elapsed = Date.now() - parseInt(workflowId.split('_')[1]);
  const minutes = elapsed / 60000;

  if (minutes < 0.5) {
    return {
      stage: 'architect',
      aiModel: 'XAI Grok-4-fast-reasoning-latest',
      step: 'Architecture Planning',
      description: '🏗️ Deep reasoning to design your optimal trip structure',
      progress: Math.min(25, (minutes / 0.5) * 25),
    };
  } else if (minutes < 1.5) {
    return {
      stage: 'gatherer',
      aiModel: 'OpenAI GPT-OSS-120B (Groq)',
      step: 'Information Gathering',
      description: '🌐 High-speed research of destinations and attractions',
      progress: 25 + Math.min(25, ((minutes - 0.5) / 1.0) * 25),
    };
  } else if (minutes < 2.5) {
    return {
      stage: 'specialist',
      aiModel: 'OpenAI GPT-OSS-120B (Groq)',
      step: 'Specialist Processing',
      description: '👨‍💼 Lightning-fast curation of personalized recommendations',
      progress: 50 + Math.min(25, ((minutes - 1.5) / 1.0) * 25),
    };
  } else if (minutes < 3.5) {
    return {
      stage: 'formatter',
      aiModel: 'XAI Grok-4-fast-non-reasoning-latest',
      step: 'Final Formatting',
      description: '✨ Rapid creation of your beautiful itinerary',
      progress: 75 + Math.min(25, ((minutes - 2.5) / 1.0) * 25),
    };
  } else {
    // Mock completion for demonstration
    return {
      stage: 'completed',
      aiModel: 'Multi-AI Pipeline Complete',
      step: 'Generation Complete',
      description: '🎉 Your personalized itinerary is ready!',
      progress: 100,
      completed: true,
    };
  }
};

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return Response.json({ success: false, error: 'Method not allowed' }, { status: 405 });
  }

  const url = new URL(request.url);
  const workflowId = url.searchParams.get('workflowId');

  if (!workflowId) {
    return Response.json({ success: false, error: 'Workflow ID required' }, { status: 400 });
  }

  const aiProgress = getAIProgress(workflowId);

  console.log(
    `🤖 [GET-ITINERARY] AI Progress: ${aiProgress.stage} - ${aiProgress.aiModel} - ${aiProgress.progress}%`
  );

  if (aiProgress.completed) {
    // Return a mock completed itinerary
    return Response.json({
      success: true,
      workflowId,
      status: 'completed',
      completed: true,
      aiProgress,
      itinerary: {
        title: 'Amazing Japan Adventure',
        destination: 'Japan',
        summary: 'A 4-day personalized itinerary crafted by AI agents',
        days: [
          {
            day: 1,
            title: 'Tokyo Exploration',
            activities: [
              { time: '9:00 AM', activity: 'Visit Senso-ji Temple', location: 'Asakusa' },
              { time: '12:00 PM', activity: 'Lunch at Tsukiji Outer Market', location: 'Tsukiji' },
              { time: '3:00 PM', activity: 'Explore Shibuya Crossing', location: 'Shibuya' },
            ],
          },
        ],
        tips: ['Learn basic Japanese phrases', 'Get a JR Pass', 'Try local street food'],
        generatedBy: 'Hylo Multi-AI Pipeline (XAI Grok-4 + OpenAI GPT-OSS-120B)',
        completedAt: new Date().toISOString(),
      },
    });
  }

  return Response.json({
    success: true,
    workflowId,
    status: 'processing',
    completed: false,
    aiProgress,
    itinerary: null,
    estimatedTimeRemaining: Math.max(0, 210000 - (Date.now() - parseInt(workflowId.split('_')[1]))),
  });
}

/**
 * Mock Workflow Service for Local Development
 * 
 * Simulates the workflow API locally without requiring a backend server
 */

import { TravelFormData } from '../../types/agents';
import { WorkflowProgress, AgentStatus, WorkflowResult, StreamingWorkflowOptions } from './WorkflowService';

export class MockWorkflowService {
  private baseUrl: string;
  private abortController: AbortController | null = null;
  
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Mock streaming workflow execution with simulated agent progress
   */
  async startStreamingWorkflow(
    formData: TravelFormData,
    options: StreamingWorkflowOptions = {}
  ): Promise<string> {
    console.log('🎭 Mock Workflow Service: Starting workflow simulation');
    console.log('📝 Form Data:', formData);

    const {
      onProgress,
      onAgentStatus,
      onError,
      onComplete,
      timeout = 120000
    } = options;

    // Simulate agents
    const agents = [
      { id: '1', name: 'ContentPlanner' as const },
      { id: '2', name: 'InfoGatherer' as const },
      { id: '3', name: 'Strategist' as const },
      { id: '4', name: 'Compiler' as const }
    ];

    try {
      // Simulate workflow execution with progress updates
      for (let i = 0; i < agents.length; i++) {
        const agent = agents[i]!; // Safe assertion - array is statically defined
        const progress = ((i + 1) / agents.length) * 100;
        
        // Start agent
        const agentStatus: AgentStatus = {
          id: agent.id,
          name: agent.name,
          status: 'running',
          startTime: new Date().toISOString()
        };

        onAgentStatus?.(agentStatus);
        
        const workflowProgress: WorkflowProgress = {
          currentStep: i + 1,
          totalSteps: agents.length,
          currentAgent: agent.name,
          progress,
          agents: agents.slice(0, i + 1).map((a, idx): AgentStatus => ({
            id: a.id,
            name: a.name,
            status: idx < i ? 'completed' : 'running',
            startTime: new Date().toISOString(),
            ...(idx < i && {
              endTime: new Date().toISOString(),
              duration: Math.random() * 3000 + 1000
            })
          })),
          estimatedTimeRemaining: (agents.length - i - 1) * 2000
        };

        onProgress?.(workflowProgress);

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

        // Complete agent
        const completedAgentStatus: AgentStatus = {
          ...agentStatus,
          status: 'completed',
          endTime: new Date().toISOString(),
          duration: Math.random() * 3000 + 1000
        };

        onAgentStatus?.(completedAgentStatus);
      }

      // Generate mock itinerary based on form data
      const mockItinerary = this.generateMockItinerary(formData);

      // Final completion
      const result: WorkflowResult = {
        success: true,
        itinerary: mockItinerary,
        metadata: {
          totalCost: Math.random() * 2 + 0.5,
          executionTime: agents.length * 2000 + Math.random() * 2000,
          agentResults: {
            ContentPlanner: { analysis: 'Travel plans analyzed', queries: ['hotels', 'activities'] },
            InfoGatherer: { data: 'Destination information gathered', sources: 3 },
            Strategist: { strategy: 'Optimal itinerary strategy created' },
            Compiler: { itinerary: 'Final itinerary compiled' }
          }
        }
      };

      onComplete?.(result);
      
      return mockItinerary;

    } catch (error) {
      console.error('Mock workflow error:', error);
      onError?.(error instanceof Error ? error.message : 'Mock workflow failed');
      throw error;
    }
  }

  /**
   * Generate mock itinerary based on form data
   */
  private generateMockItinerary(formData: TravelFormData): string {
    const destination = formData.destination || 'Your Destination';
    const adults = formData.adults || 2;
    const children = formData.children || 0;
    const departureDate = formData.departureDate || 'TBD';
    const returnDate = formData.returnDate || 'TBD';

    return `# 🌍 **${destination} Travel Itinerary**

## **TRIP SUMMARY**
- **Trip Nickname**: AI-Generated Adventure
- **Dates**: ${departureDate} to ${returnDate}
- **Travelers**: ${adults} adult(s)${children > 0 ? `, ${children} children` : ''}
- **Budget**: Flexible (AI-optimized recommendations)

**Prepared for**: Your Personalized Journey

---

## **DAILY ITINERARY**

### **Day 1: Arrival & Exploration**
- **Morning**: Arrive at ${destination}
- **Afternoon**: Check into recommended accommodation
- **Evening**: Welcome dinner at local restaurant
- **Duration**: Full day orientation

### **Day 2: Cultural Discovery**
- **Morning**: Historic district walking tour
- **Afternoon**: Local museum or cultural site
- **Evening**: Traditional entertainment experience
- **Duration**: 8 hours of activities

### **Day 3: Adventure & Activities**
- **Morning**: Outdoor adventure activity
- **Afternoon**: Local market exploration
- **Evening**: Sunset viewing experience
- **Duration**: Full day adventure

### **Day 4: Relaxation & Departure**
- **Morning**: Leisure time and souvenir shopping
- **Afternoon**: Check out and departure preparation
- **Evening**: Departure
- **Duration**: Half day activities

---

## **TIPS FOR YOUR TRIP**

### **🎯 Travel Recommendations**
- **Best Time to Visit**: Year-round destination
- **Local Transportation**: Recommended apps and services
- **Currency**: Local currency exchange tips
- **Language**: Basic phrases and translation apps

### **🍽️ Dining Suggestions**
- **Must-Try Dishes**: Local specialties
- **Recommended Restaurants**: AI-curated selection
- **Dietary Accommodations**: Available options
- **Food Safety**: Important guidelines

### **🏨 Accommodation Notes**
- **Booking Tips**: Best platforms and timing
- **Location Preferences**: Central vs. local neighborhoods  
- **Amenities**: What to look for
- **Budget Options**: Range of choices

### **📱 Technology & Apps**
- **Navigation**: Google Maps offline downloads
- **Translation**: Google Translate camera feature
- **Weather**: Local weather apps
- **Emergency**: Important contact numbers

---

*✨ This itinerary was generated using advanced AI agents that analyzed your preferences, current travel trends, and real-time destination information to create a personalized experience.*

**Generated by**: Hylo AI Multi-Agent Workflow System  
**Processing Time**: ${Math.round(Math.random() * 10 + 5)} seconds  
**Agents Used**: ContentPlanner → InfoGatherer → Strategist → Compiler`;
  }

  /**
   * Cancel workflow execution
   */
  cancelWorkflow(): void {
    console.log('🛑 Mock Workflow Service: Canceling workflow');
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Reset workflow state
   */
  resetWorkflow(): void {
    console.log('🔄 Mock Workflow Service: Resetting workflow');
    this.abortController = null;
  }
}
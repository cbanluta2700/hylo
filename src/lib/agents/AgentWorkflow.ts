/**
 * 4-Agent AI Workflow System (T022-T025)
 *
 * CONSTITUTIONAL COMPLIANCE:
 * - Principle I: Edge Runtime compatible (HTTP-based agents)
 * - Principle V: Type-safe development with strict interfaces
 * - Principle IV: Code-Deploy-Debug flow implementation
 *
 * Implements the 4-agent system: Architect → Gatherer → Specialist → Formatter
 */

import { aiClient, AIRequest } from '../ai/AIClient';
import { TravelFormData } from '../../types/travel-form';

/**
 * Base Agent Interface
 * Constitutional requirement: Component composition pattern
 */
interface Agent {
  name: string;
  description: string;
  execute(input: any): Promise<AgentOutput>;
}

/**
 * Agent Output Structure
 * Constitutional requirement: Type-safe development
 */
export interface AgentOutput {
  agentName: string;
  processingTime: number;
  success: boolean;
  data: any;
  error?: string;
  metadata?: {
    model?: string | undefined;
    tokensUsed?: number | undefined;
    confidence?: number | undefined;
  };
}

/**
 * Agent 1: Travel Architect
 * Analyzes travel preferences and creates comprehensive travel requirements
 */
export class TravelArchitect implements Agent {
  name = 'Travel Architect';
  description = 'Analyzes travel preferences and creates a comprehensive travel blueprint';

  async execute(formData: TravelFormData): Promise<AgentOutput> {
    const startTime = Date.now();

    try {
      const systemPrompt = `You are an expert Travel Architect AI. Your role is to analyze travel form data and create a comprehensive travel requirements blueprint.

RESPONSIBILITIES:
1. Analyze traveler preferences, budget, and constraints
2. Identify key travel themes and priorities  
3. Create detailed day-by-day structure recommendations
4. Define search parameters for attractions and experiences
5. Establish quality standards and filtering criteria

OUTPUT FORMAT (JSON):
{
  "travelProfile": {
    "travelers": { "adults": number, "children": number, "ages": number[] },
    "duration": number,
    "budget": { "total": number, "daily": number, "category": string },
    "pace": string,
    "priorities": string[]
  },
  "dailyStructure": {
    "days": [
      {
        "day": number,
        "theme": string,
        "structure": { "morning": string, "afternoon": string, "evening": string },
        "budgetAllocation": { "activities": number, "food": number, "transport": number }
      }
    ]
  },
  "searchCriteria": {
    "attractions": { "types": string[], "keywords": string[], "exclusions": string[] },
    "restaurants": { "cuisines": string[], "priceRange": string, "features": string[] },
    "experiences": { "categories": string[], "difficulty": string, "duration": string }
  },
  "qualityStandards": {
    "minRating": number,
    "reviewThreshold": number,
    "preferredSources": string[]
  }
}

Be extremely thorough and analytical. Consider cultural context, seasonal factors, and practical logistics.`;

      const prompt = `Analyze this travel request and create a comprehensive blueprint:

**Destination:** ${formData.location}
**Duration:** ${formData.plannedDays} days (${formData.departDate} to ${formData.returnDate})
**Travelers:** ${formData.adults} adults, ${formData.children} children ${
        formData.childrenAges && formData.childrenAges.length > 0
          ? `(ages: ${formData.childrenAges.join(', ')})`
          : ''
      }
**Budget:** ${formData.budget.currency} ${formData.budget.total} total
**Travel Style:** ${JSON.stringify(formData.travelStyle, null, 2)}
**Interests:** ${formData.interests.join(', ')}
**Avoid:** ${formData.avoidances.join(', ')}
**Dietary:** ${formData.dietaryRestrictions.join(', ')}
**Accessibility:** ${formData.accessibility.join(', ')}
**Trip Vibe:** ${formData.tripVibe}
**Experience Level:** ${formData.travelExperience}
**Dining Preference:** ${formData.dinnerChoice}
**Additional Services:** ${JSON.stringify(formData.additionalServices, null, 2)}`;

      const request: AIRequest = {
        systemPrompt,
        prompt,
        maxTokens: 4000,
        temperature: 0.3, // Lower temperature for structured analysis
      };

      const response = await aiClient.chat(request, 'xai'); // Use X.AI for deep reasoning

      let architectureData;
      try {
        architectureData = JSON.parse(response.content);
      } catch (parseError) {
        // Fallback: Extract JSON from response if wrapped in text
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          architectureData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse architecture JSON response');
        }
      }

      return {
        agentName: this.name,
        processingTime: Date.now() - startTime,
        success: true,
        data: architectureData,
        metadata: {
          model: response.model,
          tokensUsed: response.usage?.totalTokens,
          confidence: 0.9, // High confidence for structured analysis
        },
      };
    } catch (error) {
      console.error('Travel Architect error:', error);
      return {
        agentName: this.name,
        processingTime: Date.now() - startTime,
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown architecture error',
      };
    }
  }
}

/**
 * Agent 2: Information Gatherer
 * Searches for attractions, restaurants, and experiences based on architect's requirements
 */
export class InformationGatherer implements Agent {
  name = 'Information Gatherer';
  description =
    'Searches and collects detailed information about attractions, restaurants, and experiences';

  async execute(architectureBlueprint: any): Promise<AgentOutput> {
    const startTime = Date.now();

    try {
      // This agent would integrate with search providers (Tavily, Exa, SERP)
      // For now, implementing the AI-based gathering approach

      const systemPrompt = `You are an expert Information Gatherer AI. Your role is to find and organize detailed information about travel destinations based on architecture requirements.

RESPONSIBILITIES:
1. Generate comprehensive lists of attractions, restaurants, and experiences
2. Include specific details: names, addresses, hours, prices, ratings
3. Organize by day/theme according to the architecture blueprint
4. Ensure all recommendations meet quality standards
5. Provide backup options and alternatives

Use your extensive knowledge to provide real, accurate information. If unsure about specific details, indicate with "verify:" prefix.

OUTPUT FORMAT (JSON):
{
  "attractions": [
    {
      "name": string,
      "type": string,
      "description": string,
      "location": { "address": string, "coordinates": [lat, lng] },
      "details": { "hours": string, "price": string, "duration": string },
      "rating": number,
      "reviews": number,
      "tags": string[],
      "recommendedDay": number
    }
  ],
  "restaurants": [
    {
      "name": string,
      "cuisine": string,
      "priceRange": string,
      "location": { "address": string, "coordinates": [lat, lng] },
      "specialties": string[],
      "rating": number,
      "mealType": string,
      "recommendedDay": number
    }
  ],
  "experiences": [
    {
      "name": string,
      "category": string,
      "description": string,
      "provider": string,
      "details": { "duration": string, "price": string, "includes": string[] },
      "rating": number,
      "difficulty": string,
      "recommendedDay": number
    }
  ],
  "logistics": {
    "transportation": { "options": string[], "costs": string[], "recommendations": string },
    "accommodation": { "areas": string[], "types": string[], "priceRanges": string[] },
    "practicalTips": string[]
  }
}`;

      const prompt = `Based on this travel architecture blueprint, gather comprehensive information:

${JSON.stringify(architectureBlueprint, null, 2)}

Find detailed information for:
1. Top attractions matching the themes and interests
2. Restaurants covering all meal types and price points
3. Unique experiences and activities
4. Transportation and logistics information

Focus on high-quality, well-reviewed options that match the traveler profile.`;

      const request: AIRequest = {
        systemPrompt,
        prompt,
        maxTokens: 6000,
        temperature: 0.4, // Balanced creativity and accuracy
      };

      const response = await aiClient.chat(request, 'groq'); // Use Groq for fast data gathering

      let gatheringData;
      try {
        gatheringData = JSON.parse(response.content);
      } catch (parseError) {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          gatheringData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse gathering JSON response');
        }
      }

      return {
        agentName: this.name,
        processingTime: Date.now() - startTime,
        success: true,
        data: gatheringData,
        metadata: {
          model: response.model,
          tokensUsed: response.usage?.totalTokens,
          confidence: 0.8, // Good confidence for information gathering
        },
      };
    } catch (error) {
      console.error('Information Gatherer error:', error);
      return {
        agentName: this.name,
        processingTime: Date.now() - startTime,
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown gathering error',
      };
    }
  }
}

/**
 * Agent 3: Travel Specialist
 * Optimizes selections and creates day-by-day itinerary with logistics
 */
export class TravelSpecialist implements Agent {
  name = 'Travel Specialist';
  description = 'Optimizes selections and creates detailed day-by-day itinerary with logistics';

  async execute(input: { architecture: any; gatheredData: any }): Promise<AgentOutput> {
    const startTime = Date.now();

    try {
      const systemPrompt = `You are an expert Travel Specialist AI. Your role is to create optimized, detailed day-by-day itineraries with perfect logistics.

RESPONSIBILITIES:
1. Select best attractions/restaurants from gathered data based on architecture requirements
2. Optimize geographical routing and timing
3. Create detailed day-by-day schedules with time slots
4. Include transportation between locations
5. Add backup plans and alternative options
6. Ensure budget adherence and realistic timing

OUTPUT FORMAT (JSON):
{
  "itinerary": [
    {
      "day": number,
      "date": string,
      "theme": string,
      "schedule": [
        {
          "time": string,
          "activity": string,
          "location": { "name": string, "address": string, "coordinates": [lat, lng] },
          "duration": string,
          "cost": string,
          "description": string,
          "tips": string[],
          "transport": { "method": string, "duration": string, "cost": string }
        }
      ],
      "meals": {
        "breakfast": { "name": string, "location": string, "cost": string },
        "lunch": { "name": string, "location": string, "cost": string },
        "dinner": { "name": string, "location": string, "cost": string }
      },
      "dailyBudget": { "activities": number, "food": number, "transport": number, "total": number },
      "alternatives": { "rainPlan": string[], "budgetOptions": string[] }
    }
  ],
  "summary": {
    "totalCost": number,
    "highlights": string[],
    "essentialTips": string[],
    "packingList": string[]
  }
}`;

      const prompt = `Create an optimized day-by-day itinerary using this information:

**ARCHITECTURE BLUEPRINT:**
${JSON.stringify(input.architecture, null, 2)}

**GATHERED INFORMATION:**
${JSON.stringify(input.gatheredData, null, 2)}

Create a perfect itinerary that:
- Optimizes travel time and reduces backtracking
- Respects the daily themes from architecture
- Stays within budget constraints
- Provides realistic timing with buffer time
- Includes transportation details between locations
- Offers alternatives for weather/budget considerations`;

      const request: AIRequest = {
        systemPrompt,
        prompt,
        maxTokens: 8000,
        temperature: 0.2, // Low temperature for precise logistics
      };

      const response = await aiClient.chat(request, 'xai'); // Use X.AI for complex optimization

      let itineraryData;
      try {
        itineraryData = JSON.parse(response.content);
      } catch (parseError) {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          itineraryData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse specialist JSON response');
        }
      }

      return {
        agentName: this.name,
        processingTime: Date.now() - startTime,
        success: true,
        data: itineraryData,
        metadata: {
          model: response.model,
          tokensUsed: response.usage?.totalTokens,
          confidence: 0.95, // Very high confidence for optimized itinerary
        },
      };
    } catch (error) {
      console.error('Travel Specialist error:', error);
      return {
        agentName: this.name,
        processingTime: Date.now() - startTime,
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown specialist error',
      };
    }
  }
}

/**
 * Agent 4: Content Formatter
 * Formats the final itinerary into user-friendly presentation
 */
export class ContentFormatter implements Agent {
  name = 'Content Formatter';
  description = 'Formats the final itinerary into beautiful, user-friendly presentation';

  async execute(itineraryData: any): Promise<AgentOutput> {
    const startTime = Date.now();

    try {
      const systemPrompt = `You are an expert Content Formatter AI. Your role is to transform technical itinerary data into beautiful, engaging, user-friendly content.

RESPONSIBILITIES:
1. Create compelling descriptions and narratives
2. Format content for optimal readability
3. Add helpful icons, emojis, and visual elements
4. Ensure consistent tone and style
5. Include practical information clearly
6. Create engaging section headers and summaries

OUTPUT FORMAT (JSON):
{
  "title": string,
  "subtitle": string,
  "overview": {
    "description": string,
    "highlights": string[],
    "bestFor": string[],
    "totalCost": string,
    "duration": string
  },
  "dailyItinerary": [
    {
      "day": number,
      "title": string,
      "theme": string,
      "description": string,
      "schedule": [
        {
          "time": string,
          "title": string,
          "description": string,
          "location": string,
          "cost": string,
          "tips": string[],
          "icon": string
        }
      ],
      "meals": {
        "breakfast": { "name": string, "description": string, "cost": string },
        "lunch": { "name": string, "description": string, "cost": string },
        "dinner": { "name": string, "description": string, "cost": string }
      },
      "dayTotal": string
    }
  ],
  "practicalInfo": {
    "budgetBreakdown": { "accommodation": string, "food": string, "activities": string, "transport": string },
    "essentialTips": string[],
    "packingList": string[],
    "localEtiquette": string[],
    "emergencyInfo": string[]
  },
  "alternatives": {
    "rainDayOptions": string[],
    "budgetFriendly": string[],
    "splurgeOptions": string[]
  }
}`;

      const prompt = `Transform this technical itinerary data into beautiful, engaging user content:

${JSON.stringify(itineraryData, null, 2)}

Create content that:
- Uses engaging, enthusiastic language
- Includes helpful emojis and icons
- Provides clear practical information
- Tells a story about the travel experience
- Is easy to scan and read
- Feels personal and inspiring`;

      const request: AIRequest = {
        systemPrompt,
        prompt,
        maxTokens: 6000,
        temperature: 0.6, // Higher creativity for engaging content
      };

      const response = await aiClient.chat(request, 'groq'); // Use Groq for fast formatting

      let formattedData;
      try {
        formattedData = JSON.parse(response.content);
      } catch (parseError) {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          formattedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse formatter JSON response');
        }
      }

      return {
        agentName: this.name,
        processingTime: Date.now() - startTime,
        success: true,
        data: formattedData,
        metadata: {
          model: response.model,
          tokensUsed: response.usage?.totalTokens,
          confidence: 0.9, // High confidence for formatting
        },
      };
    } catch (error) {
      console.error('Content Formatter error:', error);
      return {
        agentName: this.name,
        processingTime: Date.now() - startTime,
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown formatting error',
      };
    }
  }
}

/**
 * 4-Agent Workflow Orchestrator
 * Constitutional requirement: Edge Runtime compatible orchestration
 */
export class AgentWorkflow {
  private agents: {
    architect: TravelArchitect;
    gatherer: InformationGatherer;
    specialist: TravelSpecialist;
    formatter: ContentFormatter;
  };

  constructor() {
    this.agents = {
      architect: new TravelArchitect(),
      gatherer: new InformationGatherer(),
      specialist: new TravelSpecialist(),
      formatter: new ContentFormatter(),
    };
  }

  /**
   * Execute the complete 4-agent workflow
   * Constitutional requirement: Code-Deploy-Debug implementation flow
   */
  async execute(formData: TravelFormData): Promise<{
    success: boolean;
    result?: any;
    error?: string;
    processingTime: number;
    agentOutputs: Record<string, AgentOutput>;
  }> {
    const startTime = Date.now();
    const agentOutputs: Record<string, AgentOutput> = {};

    try {
      console.log('🏗️ [DEBUG-125] Starting 4-Agent Workflow...', {
        location: formData.location,
        startTime: new Date().toISOString(),
      });
      console.log('🏗️ Starting 4-Agent Workflow...');

      // Agent 1: Travel Architect
      console.log('1️⃣ [DEBUG-126] Executing Travel Architect...');
      console.log('1️⃣ Executing Travel Architect...');
      const architectOutput = await this.agents.architect.execute(formData);
      agentOutputs['architect'] = architectOutput;
      console.log('✅ [DEBUG-127] Travel Architect completed', {
        success: architectOutput.success,
        hasData: !!architectOutput.data,
        processingTime: architectOutput.processingTime,
      });

      if (!architectOutput.success) {
        throw new Error(`Architect failed: ${architectOutput.error}`);
      }

      // Agent 2: Information Gatherer
      console.log('2️⃣ [DEBUG-128] Executing Information Gatherer...');
      console.log('2️⃣ Executing Information Gatherer...');
      const gathererOutput = await this.agents.gatherer.execute(architectOutput.data);
      agentOutputs['gatherer'] = gathererOutput;
      console.log('✅ [DEBUG-129] Information Gatherer completed', {
        success: gathererOutput.success,
        processingTime: gathererOutput.processingTime,
      });

      if (!gathererOutput.success) {
        throw new Error(`Gatherer failed: ${gathererOutput.error}`);
      }

      // Agent 3: Travel Specialist
      console.log('3️⃣ [DEBUG-130] Executing Travel Specialist...');
      console.log('3️⃣ Executing Travel Specialist...');
      const specialistOutput = await this.agents.specialist.execute({
        architecture: architectOutput.data,
        gatheredData: gathererOutput.data,
      });
      agentOutputs['specialist'] = specialistOutput;
      console.log('✅ [DEBUG-131] Travel Specialist completed', {
        success: specialistOutput.success,
        processingTime: specialistOutput.processingTime,
      });

      if (!specialistOutput.success) {
        throw new Error(`Specialist failed: ${specialistOutput.error}`);
      }

      // Agent 4: Content Formatter
      console.log('4️⃣ [DEBUG-132] Executing Content Formatter...');
      console.log('4️⃣ Executing Content Formatter...');
      const formatterOutput = await this.agents.formatter.execute(specialistOutput.data);
      agentOutputs['formatter'] = formatterOutput;
      console.log('✅ [DEBUG-133] Content Formatter completed', {
        success: formatterOutput.success,
        processingTime: formatterOutput.processingTime,
      });

      if (!formatterOutput.success) {
        throw new Error(`Formatter failed: ${formatterOutput.error}`);
      }

      const totalTime = Date.now() - startTime;
      console.log(`✅ [DEBUG-134] 4-Agent Workflow completed successfully in ${totalTime}ms`);
      console.log(`✅ 4-Agent Workflow completed in ${totalTime}ms`);

      return {
        success: true,
        result: formatterOutput.data,
        processingTime: totalTime,
        agentOutputs,
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`❌ 4-Agent Workflow failed after ${totalTime}ms:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown workflow error',
        processingTime: totalTime,
        agentOutputs,
      };
    }
  }
}

// Export singleton instance
export const agentWorkflow = new AgentWorkflow();

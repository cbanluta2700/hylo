/**
 * Simplified Content Compiler Agent for Unit Testing
 * 
 * This is a minimal implementation of the ContentCompilerAgent that focuses on
 * itinerary compilation functionality and proper TypeScript typing for unit testing.
 */

import { 
  Agent,
  AgentType,
  AgentResult, 
  AgentError,
  AgentErrorType,
  WorkflowContext, 
  WorkflowConfig,
  LLMProvider
} from '../../../src/types/agents';

// Simplified types for testing
interface DayItinerary {
  day: number;
  date: string;
  theme: string;
  activities: Array<{
    time: string;
    name: string;
    category: string;
    duration: string;
    cost: number;
    location: string;
    description: string;
    tips: string[];
  }>;
  meals: Array<{
    time: string;
    type: 'breakfast' | 'lunch' | 'dinner';
    restaurant: string;
    cuisine: string;
    estimatedCost: number;
    reservation: boolean;
  }>;
  transportation: Array<{
    time: string;
    from: string;
    to: string;
    method: string;
    duration: string;
    cost: number;
  }>;
  accommodation: {
    name: string;
    checkIn?: string;
    checkOut?: string;
    totalCost: number;
  };
  dailyBudgetUsed: number;
  notes: string[];
}

interface TravelTips {
  general: string[];
  cultural: string[];
  safety: string[];
  budgeting: string[];
  transportation: string[];
  dining: string[];
  shopping: string[];
  communication: string[];
}

// Final compiled itinerary output
interface MinimalCompiledItinerary {
  tripSummary: {
    nickname: string;
    destination: string;
    dates: {
      departure: string;
      return: string;
      duration: number;
    };
    travelers: {
      adults: number;
      children: number;
      total: number;
    };
    budget: {
      total: number;
      currency: string;
      mode: 'per-person' | 'total' | 'flexible';
      used: number;
      remaining: number;
    };
    preparedFor: string;
  };
  dailyItinerary: DayItinerary[];
  travelTips: TravelTips;
  emergencyInfo: {
    contacts: Array<{
      type: string;
      name: string;
      phone: string;
    }>;
    importantAddresses: Array<{
      type: string;
      name: string;
      address: string;
    }>;
    healthAndSafety: string[];
  };
  packingList: {
    essentials: string[];
    clothing: string[];
    electronics: string[];
    documents: string[];
    optional: string[];
  };
  metadata: {
    generatedAt: Date;
    totalActivities: number;
    totalRestaurants: number;
    averageDailyCost: number;
    compilationScore: number;
    optimizationLevel: 'basic' | 'standard' | 'premium';
  };
}

export class ContentCompilerAgent implements Agent {
  readonly name = AgentType.COMPILER;
  readonly version = '1.0.0';
  readonly timeout = 30000;
  readonly maxCost = 2.00;
  
  private config: WorkflowConfig;
  
  constructor(config: WorkflowConfig) {
    this.config = config;
  }

  async execute(context: WorkflowContext): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      // Validate required context from all previous agents
      const isValidInput = await this.validateInput(context);
      if (!isValidInput) {
        return this.createErrorResult([{
          type: AgentErrorType.VALIDATION_ERROR,
          message: 'Invalid content compiler context - missing results from previous agents',
          severity: 'high',
          recoverable: false,
          details: {
            destination: context.formData?.destination,
            hasContentPlanning: !!context.agentResults?.[AgentType.CONTENT_PLANNER]?.success,
            hasInformationGathering: !!context.agentResults?.[AgentType.INFO_GATHERER]?.success,
            hasStrategicPlanning: !!context.agentResults?.[AgentType.STRATEGIST]?.success
          }
        }]);
      }

      // Extract context from all previous agents
      const planningResult = context.agentResults[AgentType.CONTENT_PLANNER]!;
      const gatheringResult = context.agentResults[AgentType.INFO_GATHERER]!;
      const strategistResult = context.agentResults[AgentType.STRATEGIST]!;
      
      // Compile final itinerary
      const compiledItinerary = await this.compileItinerary(
        context,
        planningResult.data,
        gatheringResult.data,
        strategistResult.data
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      return {
        agent: AgentType.COMPILER,
        success: true,
        data: compiledItinerary,
        metadata: {
          startedAt: new Date(startTime),
          completedAt: new Date(endTime),
          durationMs: executionTime,
          cost: Math.max(this.calculateCost(executionTime), 0.001),
          provider: LLMProvider.GEMINI,
          tokens: { input: 3000, output: 2500, total: 5500 },
          retryAttempts: 0,
          version: this.version
        },
        errors: [],
        nextAgent: undefined, // Final agent
        confidence: this.calculateConfidence(compiledItinerary)
      };

    } catch (error) {
      return this.createErrorResult([{
        type: AgentErrorType.EXECUTION_ERROR,
        message: `Itinerary compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high',
        recoverable: true,
        details: { 
          destination: context.formData?.destination,
          error: error instanceof Error ? error.stack : String(error)
        }
      }]);
    }
  }

  async validateInput(context: WorkflowContext): Promise<boolean> {
    if (!context.formData) {
      return false;
    }

    if (!context.formData.destination || !context.formData.departureDate || !context.formData.returnDate) {
      return false;
    }

    // Require all previous agent results
    if (!context.agentResults?.[AgentType.CONTENT_PLANNER]?.success) {
      return false;
    }

    if (!context.agentResults?.[AgentType.INFO_GATHERER]?.success) {
      return false;
    }

    if (!context.agentResults?.[AgentType.STRATEGIST]?.success) {
      return false;
    }

    return true;
  }

  private async compileItinerary(
    context: WorkflowContext,
    planningData: any,
    gatheringData: any,
    strategistData: any
  ): Promise<MinimalCompiledItinerary> {
    const { formData } = context;
    
    // Create trip summary
    const tripSummary = this.createTripSummary(formData, strategistData);
    
    // Generate daily itinerary
    const dailyItinerary = this.generateDailyItinerary(formData, gatheringData, strategistData);
    
    // Compile travel tips
    const travelTips = this.compileTravelTips(formData, gatheringData, strategistData);
    
    // Create emergency info
    const emergencyInfo = this.createEmergencyInfo(formData, gatheringData);
    
    // Generate packing list
    const packingList = this.createPackingList(formData, gatheringData);
    
    // Calculate metadata
    const metadata = this.calculateMetadata(dailyItinerary, strategistData);

    return {
      tripSummary,
      dailyItinerary,
      travelTips,
      emergencyInfo,
      packingList,
      metadata
    };
  }

  private createTripSummary(formData: any, strategistData: any): MinimalCompiledItinerary['tripSummary'] {
    const departureDate = new Date(formData.departureDate);
    const returnDate = new Date(formData.returnDate);
    const duration = Math.ceil((returnDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const totalBudget = strategistData?.budgetOptimization?.totalBudget || formData.budget.amount;
    const budgetUsed = totalBudget * 0.85; // Assume 85% utilization

    return {
      nickname: formData.tripNickname || `${formData.destination} Adventure`,
      destination: formData.destination,
      dates: {
        departure: formData.departureDate,
        return: formData.returnDate,
        duration: duration
      },
      travelers: {
        adults: formData.adults || 2,
        children: formData.children || 0,
        total: (formData.adults || 2) + (formData.children || 0)
      },
      budget: {
        total: totalBudget,
        currency: formData.budget.currency || 'USD',
        mode: formData.budget.mode || 'total',
        used: budgetUsed,
        remaining: totalBudget - budgetUsed
      },
      preparedFor: formData.contactName || 'Traveler'
    };
  }

  private generateDailyItinerary(formData: any, gatheringData: any, strategistData: any): DayItinerary[] {
    const departureDate = new Date(formData.departureDate);
    const returnDate = new Date(formData.returnDate);
    const duration = Math.ceil((returnDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const itinerary: DayItinerary[] = [];
    
    for (let i = 0; i < duration; i++) {
      const currentDate = new Date(departureDate);
      currentDate.setDate(currentDate.getDate() + i);
      
      const dayItinerary: DayItinerary = {
        day: i + 1,
        date: currentDate.toISOString().split('T')[0],
        theme: this.getDayTheme(i, duration, formData.preferences?.travelStyle),
        activities: this.generateDayActivities(i, gatheringData, strategistData),
        meals: this.generateDayMeals(i, gatheringData, strategistData),
        transportation: this.generateDayTransportation(i, gatheringData),
        accommodation: this.getDayAccommodation(i, gatheringData, strategistData),
        dailyBudgetUsed: this.calculateDailyBudget(strategistData, duration),
        notes: this.generateDayNotes(i, formData, gatheringData)
      };
      
      itinerary.push(dayItinerary);
    }
    
    return itinerary;
  }

  private getDayTheme(day: number, totalDays: number, travelStyle?: string): string {
    if (day === 0) return 'Arrival & Orientation';
    if (day === totalDays - 1) return 'Departure & Reflection';
    
    const themes = [
      'Cultural Exploration',
      'Local Experiences',
      'Adventure & Activities',
      'Relaxation & Leisure',
      'Food & Dining',
      'Historical Discovery',
      'Nature & Outdoors'
    ];
    
    if (travelStyle === 'culture') {
      return day % 2 === 0 ? 'Cultural Exploration' : 'Historical Discovery';
    }
    
    return themes[day % themes.length];
  }

  private generateDayActivities(day: number, gatheringData: any, strategistData: any) {
    const activities = gatheringData?.activities || [];
    const recommendations = strategistData?.travelRecommendations?.activityPrioritization || [];
    
    return [
      {
        time: '09:00',
        name: recommendations[0]?.activity || activities[0]?.name || 'Morning Exploration',
        category: activities[0]?.category || 'sightseeing',
        duration: '3 hours',
        cost: recommendations[0]?.estimatedCost || 25,
        location: `${gatheringData?.destination || 'City Center'}`,
        description: 'Start your day with this must-see attraction',
        tips: ['Arrive early to avoid crowds', 'Bring comfortable walking shoes']
      },
      {
        time: '14:00',
        name: recommendations[1]?.activity || activities[1]?.name || 'Afternoon Experience',
        category: activities[1]?.category || 'culture',
        duration: '2 hours',
        cost: recommendations[1]?.estimatedCost || 15,
        location: 'Local District',
        description: 'Immerse yourself in local culture and traditions',
        tips: ['Perfect for photos', 'Learn some local history']
      }
    ];
  }

  private generateDayMeals(day: number, gatheringData: any, strategistData: any) {
    const restaurants = gatheringData?.restaurants || [];
    const mealStrategy = strategistData?.travelRecommendations?.restaurantStrategy;
    
    return [
      {
        time: '08:00',
        type: 'breakfast' as const,
        restaurant: restaurants[0]?.name || 'Local Cafe',
        cuisine: restaurants[0]?.cuisine || 'Local',
        estimatedCost: mealStrategy?.budgetBreakdown?.breakfast || 12,
        reservation: false
      },
      {
        time: '13:00',
        type: 'lunch' as const,
        restaurant: restaurants[1]?.name || 'Traditional Restaurant',
        cuisine: restaurants[1]?.cuisine || 'Traditional',
        estimatedCost: mealStrategy?.budgetBreakdown?.lunch || 25,
        reservation: false
      },
      {
        time: '19:00',
        type: 'dinner' as const,
        restaurant: restaurants[2]?.name || 'Fine Dining',
        cuisine: restaurants[2]?.cuisine || 'Contemporary',
        estimatedCost: mealStrategy?.budgetBreakdown?.dinner || 45,
        reservation: true
      }
    ];
  }

  private generateDayTransportation(day: number, gatheringData: any) {
    const transport = gatheringData?.transportation;
    
    return [
      {
        time: '08:30',
        from: 'Hotel',
        to: 'Morning Activity',
        method: transport?.publicTransport?.types?.[0] || 'metro',
        duration: '15 minutes',
        cost: 3
      },
      {
        time: '17:30',
        from: 'Afternoon Activity',
        to: 'Hotel',
        method: transport?.publicTransport?.types?.[0] || 'metro',
        duration: '20 minutes',
        cost: 3
      }
    ];
  }

  private getDayAccommodation(day: number, gatheringData: any, strategistData: any) {
    const accommodations = gatheringData?.accommodations || [];
    const strategy = strategistData?.travelRecommendations?.accommodationStrategy;
    
    return {
      name: accommodations[0]?.name || 'Hotel Central',
      totalCost: strategy?.estimatedCost || 120
    };
  }

  private calculateDailyBudget(strategistData: any, duration: number): number {
    const totalBudget = strategistData?.budgetOptimization?.totalBudget || 2000;
    return Math.round((totalBudget * 0.85) / duration); // 85% of budget distributed daily
  }

  private generateDayNotes(day: number, formData: any, gatheringData: any): string[] {
    const notes = [
      'Check weather forecast in the morning',
      'Keep emergency contacts handy',
      'Stay hydrated and take breaks'
    ];
    
    if (formData.preferences?.interests?.includes('food')) {
      notes.push('Try local specialties and street food');
    }
    
    if (day === 0) {
      notes.push('Get familiar with local transportation');
    }
    
    return notes;
  }

  private compileTravelTips(formData: any, gatheringData: any, strategistData: any): TravelTips {
    const optimization = strategistData?.optimization;
    const riskAssessment = strategistData?.riskAssessment;
    
    return {
      general: [
        'Download offline maps before traveling',
        'Keep copies of important documents',
        'Learn basic local phrases',
        ...(optimization?.experienceEnhancement?.culturalInsights || [])
      ],
      cultural: [
        'Respect local customs and traditions',
        'Dress appropriately for religious sites',
        'Be mindful of tipping practices',
        'Observe local dining etiquette'
      ],
      safety: [
        'Stay aware of your surroundings',
        'Keep valuables in hotel safe',
        'Use reputable transportation services',
        ...(riskAssessment?.recommendations || [])
      ],
      budgeting: [
        'Track daily expenses',
        'Keep some cash for local vendors',
        'Compare prices before making purchases',
        ...(optimization?.costSaving?.strategies || [])
      ],
      transportation: [
        'Book tickets in advance when possible',
        'Allow extra time for connections',
        'Keep transportation apps downloaded',
        'Validate tickets where required'
      ],
      dining: [
        'Make reservations for popular restaurants',
        'Try local markets for authentic food',
        'Be cautious with street food if you have a sensitive stomach',
        'Ask about ingredients if you have allergies'
      ],
      shopping: [
        'Compare prices at different vendors',
        'Learn basic bargaining phrases',
        'Keep receipts for tax refunds',
        'Check customs regulations before buying'
      ],
      communication: [
        'Download translation apps',
        'Save important phrases in local language',
        'Get a local SIM card or international plan',
        'Know emergency numbers'
      ]
    };
  }

  private createEmergencyInfo(formData: any, gatheringData: any) {
    return {
      contacts: [
        { type: 'Emergency Services', name: 'Local Emergency', phone: '911/112' },
        { type: 'Embassy', name: 'US Embassy', phone: '+1-xxx-xxx-xxxx' },
        { type: 'Travel Insurance', name: 'Insurance Provider', phone: '+1-xxx-xxx-xxxx' }
      ],
      importantAddresses: [
        { type: 'Hotel', name: 'Accommodation', address: 'Hotel address' },
        { type: 'Hospital', name: 'Nearest Hospital', address: 'Hospital address' },
        { type: 'Airport', name: gatheringData?.transportation?.airports?.[0]?.name || 'Main Airport', address: 'Airport address' }
      ],
      healthAndSafety: [
        'Carry a first aid kit',
        'Keep emergency cash separate',
        'Inform someone of your daily plans',
        'Know location of nearest hospital'
      ]
    };
  }

  private createPackingList(formData: any, gatheringData: any) {
    const weather = gatheringData?.weather;
    
    return {
      essentials: [
        'Passport and visa',
        'Travel insurance documents',
        'Credit cards and cash',
        'Phone charger',
        'Medications',
        'Emergency contacts list'
      ],
      clothing: [
        'Comfortable walking shoes',
        'Weather-appropriate clothing',
        'Formal outfit for dining',
        'Swimwear (if applicable)',
        'Light jacket or sweater'
      ],
      electronics: [
        'Phone and charger',
        'Camera',
        'Power adapter',
        'Portable battery',
        'Headphones'
      ],
      documents: [
        'Passport/ID',
        'Travel insurance',
        'Hotel confirmations',
        'Flight tickets',
        'Emergency contact info'
      ],
      optional: [
        'Travel guidebook',
        'Daypack for excursions',
        'Travel pillow',
        'Reusable water bottle',
        'Snacks for travel'
      ]
    };
  }

  private calculateMetadata(dailyItinerary: DayItinerary[], strategistData: any) {
    const totalActivities = dailyItinerary.reduce((sum, day) => sum + day.activities.length, 0);
    const totalRestaurants = dailyItinerary.reduce((sum, day) => sum + day.meals.length, 0);
    const averageDailyCost = dailyItinerary.reduce((sum, day) => sum + day.dailyBudgetUsed, 0) / dailyItinerary.length;
    
    return {
      generatedAt: new Date(),
      totalActivities,
      totalRestaurants,
      averageDailyCost: Math.round(averageDailyCost),
      compilationScore: 0.92, // High compilation score
      optimizationLevel: 'premium' as const
    };
  }

  private calculateCost(executionTimeMs: number): number {
    const baseRate = 0.004; // Slightly higher for final compilation
    const seconds = Math.max(executionTimeMs / 1000, 0.1);
    return Math.round((baseRate * seconds) * 1000) / 1000;
  }

  private calculateConfidence(itinerary: MinimalCompiledItinerary): number {
    const activityCount = itinerary.dailyItinerary.reduce((sum, day) => sum + day.activities.length, 0);
    const tipsCount = Object.values(itinerary.travelTips).flat().length;
    const completenessScore = Math.min(1.0, (activityCount * 0.1) + (tipsCount * 0.01));
    
    return Math.max(0.8, completenessScore); // High confidence for compilation
  }

  private createErrorResult(errors: AgentError[]): AgentResult {
    return {
      agent: AgentType.COMPILER,
      success: false,
      data: null,
      metadata: {
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 0,
        cost: 0,
        provider: LLMProvider.GEMINI,
        tokens: { input: 0, output: 0, total: 0 },
        retryAttempts: 0,
        version: this.version
      },
      errors,
      nextAgent: undefined,
      confidence: 0
    };
  }

  async cleanup(): Promise<void> {
    // Cleanup compilation resources
  }
}
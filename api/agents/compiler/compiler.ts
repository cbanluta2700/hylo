/**
 * Content Compiler Agent Base Class for Hylo Multi-Agent Travel Planning System
 * 
 * This module defines the base class for the Content Compiler agent, which is responsible
 * for assembling all previous agent outputs into the final structured itinerary format.
 * It takes strategic planning recommendations and gathered information to create the
 * complete travel itinerary with the required TRIP SUMMARY, DAILY ITINERARY, and TIPS sections.
 * 
 * The compiler uses template-based assembly with intelligent scheduling algorithms to
 * create coherent, practical, and engaging travel itineraries.
 */

import { z } from "zod";
import { 
  Agent, 
  AgentResult, 
  TravelFormData, 
  WorkflowContext,
  AgentType,
  WorkflowConfig,
  AgentError,
  AgentExecutionMetadata,
  LLMProvider,
  AgentErrorType
} from "../../../src/types/agents.js";
import { 
  GatheredInformationRepository,
  StrategicPlanningResult,
  CompiledItineraryOutput
} from "../../../src/types/workflow.js";

// ===== Content Compilation Schemas =====

/**
 * Zod schema for daily activity
 */
export const DailyActivitySchema = z.object({
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  duration: z.number().min(15, "Minimum 15 minutes").max(720, "Maximum 12 hours"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
  cost: z.number().min(0).optional(),
  type: z.enum(["activity", "meal", "transport", "accommodation"]),
  notes: z.string().optional(),
  bookingInfo: z.object({
    required: z.boolean(),
    url: z.string().url().optional(),
    phone: z.string().optional(),
    advanceBooking: z.string().optional()
  }).optional()
});

/**
 * Zod schema for daily itinerary
 */
export const DailyItinerarySchema = z.object({
  day: z.number().int().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  theme: z.string().optional(),
  overview: z.string(),
  activities: z.array(DailyActivitySchema).min(1, "At least one activity required"),
  totalCost: z.number().min(0),
  walkingDistance: z.number().min(0), // in kilometers
  travelTime: z.number().min(0), // in minutes
  energyLevel: z.enum(["low", "medium", "high"]),
  flexibility: z.number().min(0).max(1), // 0-1 flexibility rating
  weatherConsiderations: z.array(z.string()).optional(),
  alternatives: z.array(z.string()).optional()
});

/**
 * Zod schema for travel tips
 */
export const TravelTipsSchema = z.object({
  packing: z.array(z.string()).min(1, "At least one packing tip required"),
  cultural: z.array(z.string()).min(1, "At least one cultural tip required"),  
  practical: z.array(z.string()).min(1, "At least one practical tip required"),
  safety: z.array(z.string()).min(1, "At least one safety tip required"),
  budgeting: z.array(z.string()).min(1, "At least one budgeting tip required"),
  transportation: z.array(z.string()).optional(),
  dining: z.array(z.string()).optional(),
  emergency: z.array(z.string()).optional()
});

/**
 * Zod schema for complete compiled itinerary
 */
export const CompiledItinerarySchema = z.object({
  tripSummary: z.object({
    nickname: z.string().min(1, "Trip nickname is required"),
    destination: z.string().min(1, "Destination is required"),
    dates: z.object({
      start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD"),
      end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be YYYY-MM-DD")
    }),
    duration: z.number().int().min(1, "Duration must be at least 1 day"),
    travelers: z.object({
      adults: z.number().int().min(1, "At least one adult required"),
      children: z.number().int().min(0, "Children count cannot be negative")
    }),
    budget: z.object({
      amount: z.number().positive("Budget amount must be positive"),
      currency: z.string().min(3).max(3, "Currency must be 3 characters"),
      mode: z.enum(["per-person", "total", "flexible"])
    }),
    travelStyle: z.string(),
    highlights: z.array(z.string()).max(5, "Maximum 5 highlights")
  }),
  
  preparedFor: z.object({
    contactName: z.string().min(1, "Contact name is required"),
    preparedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
  }),
  
  dailyItinerary: z.array(DailyItinerarySchema).min(1, "At least one day required"),
  
  tipsForTrip: TravelTipsSchema,
  
  appendix: z.object({
    importantContacts: z.object({
      emergency: z.string(),
      medical: z.string(),
      tourism: z.string().optional(),
      accommodation: z.string().optional()
    }),
    transportation: z.object({
      airports: z.array(z.string()),
      publicTransport: z.array(z.string()),
      rideshare: z.array(z.string()),
      carRental: z.array(z.string()).optional()
    }),
    bookingReferences: z.array(z.object({
      type: z.string(),
      name: z.string(), 
      reference: z.string(),
      contact: z.string()
    })).optional()
  }).optional(),
  
  metadata: z.object({
    generatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, "ISO datetime required"),
    agentsUsed: z.array(z.enum(["content-planner", "info-gatherer", "strategist", "compiler"])),
    confidence: z.number().min(0).max(1),
    sources: z.array(z.string()),
    version: z.string(),
    totalProcessingTime: z.number().min(0) // in milliseconds
  })
});

// ===== Content Compiler Agent Class =====

/**
 * Content Compiler Agent - Final agent in the multi-agent workflow
 * 
 * Responsibilities:
 * - Assemble final itinerary from all previous agent outputs
 * - Create coherent daily schedules with optimal timing
 * - Generate comprehensive travel tips and practical information
 * - Apply intelligent scheduling algorithms for activity sequencing
 * - Ensure budget adherence and practical feasibility
 * - Format output according to specification requirements
 */
export class ContentCompilerAgent implements Agent {
  readonly name: AgentType = AgentType.COMPILER;
  readonly version = "1.0.0";
  readonly timeout = 60000; // 1 minute for compilation
  readonly maxCost = 0.75; // $0.75 USD for compilation processing
  
  private config: WorkflowConfig;
  
  constructor(config: WorkflowConfig) {
    this.config = config;
  }
  
  /**
   * Execute content compilation process
   */
  async execute(context: WorkflowContext): Promise<AgentResult> {
    const startTime = new Date();
    const errors: AgentError[] = [];
    
    try {
      // Validate input
      const isValid = await this.validateInput(context);
      if (!isValid) {
        throw new Error("Invalid context provided for content compilation");
      }
      
      // Extract previous agent results
      const infoGathererResult = context.agentResults[AgentType.INFO_GATHERER];
      const strategistResult = context.agentResults[AgentType.STRATEGIST];
      
      if (!infoGathererResult?.success || !strategistResult?.success) {
        throw new Error("Both Info Gatherer and Strategist results are required");
      }
      
      const informationRepository = infoGathererResult.data as GatheredInformationRepository;
      const strategicPlan = strategistResult.data as StrategicPlanningResult;
      
      // Compile final itinerary
      const compiledItinerary = await this.compileItinerary(
        context.formData,
        informationRepository,
        strategicPlan
      );
      
      // Validate compiled itinerary
      const validatedItinerary = CompiledItinerarySchema.parse(compiledItinerary);
      
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startTime.getTime();
      
      const metadata: AgentExecutionMetadata = {
        startedAt: startTime,
        completedAt,
        durationMs,
        cost: this.calculateCompilationCost(validatedItinerary),
        provider: LLMProvider.CEREBRAS, // Using Cerebras for final compilation
        tokens: {
          input: this.estimateTokenUsage("input", [informationRepository, strategicPlan]),
          output: this.estimateTokenUsage("output", validatedItinerary),
          total: this.estimateTokenUsage("input", [informationRepository, strategicPlan]) + 
                 this.estimateTokenUsage("output", validatedItinerary)
        },
        retryAttempts: 0,
        version: this.version
      };
      
      return {
        agent: AgentType.COMPILER,
        success: true,
        data: validatedItinerary,
        metadata,
        errors,
        confidence: validatedItinerary.metadata.confidence
      };
      
    } catch (error) {
      const agentError: AgentError = {
        type: AgentErrorType.EXECUTION_ERROR,
        message: error instanceof Error ? error.message : "Content compilation failed",
        severity: "high",
        recoverable: true,
        suggestedAction: "Retry with simplified compilation or fallback to template",
        details: {
          destination: context.formData.destination,
          timestamp: new Date()
        }
      };
      
      errors.push(agentError);
      
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startTime.getTime();
      
      const metadata: AgentExecutionMetadata = {
        startedAt: startTime,
        completedAt,
        durationMs,
        cost: 0,
        provider: LLMProvider.CEREBRAS,
        tokens: { input: 0, output: 0, total: 0 },
        retryAttempts: 0,
        version: this.version
      };
      
      return {
        agent: AgentType.COMPILER,
        success: false,
        data: null,
        metadata,
        errors,
        confidence: 0
      };
    }
  }
  
  /**
   * Validate input context
   */
  async validateInput(input: unknown): Promise<boolean> {
    try {
      const context = input as WorkflowContext;
      
      if (!context.formData?.destination) {
        return false;
      }
      
      if (!context.agentResults[AgentType.INFO_GATHERER]?.success) {
        return false;
      }
      
      if (!context.agentResults[AgentType.STRATEGIST]?.success) {
        return false;
      }
      
      return true;
      
    } catch {
      return false;
    }
  }
  
  /**
   * Cleanup resources after execution
   */
  async cleanup(): Promise<void> {
    return Promise.resolve();
  }
  
  /**
   * Compile complete itinerary from all agent outputs
   */
  private async compileItinerary(
    formData: TravelFormData,
    informationRepository: GatheredInformationRepository,
    strategicPlan: StrategicPlanningResult
  ): Promise<z.infer<typeof CompiledItinerarySchema>> {
    
    // Calculate trip duration
    const startDate = new Date(formData.departureDate);
    const endDate = new Date(formData.returnDate);
    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Generate trip summary
    const tripSummary = this.generateTripSummary(formData, durationDays, informationRepository);
    
    // Generate daily itinerary
    const dailyItinerary = this.generateDailyItinerary(
      formData,
      informationRepository,
      strategicPlan,
      startDate,
      durationDays
    );
    
    // Generate travel tips
    const tipsForTrip = this.generateTravelTips(
      formData,
      informationRepository,
      strategicPlan
    );
    
    // Generate appendix
    const appendix = this.generateAppendix(informationRepository);
    
    // Create metadata
    const metadata = this.generateMetadata(formData, [
      AgentType.CONTENT_PLANNER,
      AgentType.INFO_GATHERER, 
      AgentType.STRATEGIST,
      AgentType.COMPILER
    ]);
    
    return {
      tripSummary,
      preparedFor: {
        contactName: formData.contactName,
        preparedAt: new Date().toISOString().split('T')[0]
      },
      dailyItinerary,
      tipsForTrip,
      appendix,
      metadata
    };
  }
  
  /**
   * Generate trip summary section
   */
  private generateTripSummary(
    formData: TravelFormData,
    duration: number,
    info: GatheredInformationRepository
  ) {
    return {
      nickname: formData.tripNickname,
      destination: formData.destination,
      dates: {
        start: formData.departureDate,
        end: formData.returnDate
      },
      duration,
      travelers: {
        adults: formData.adults,
        children: formData.children
      },
      budget: {
        amount: formData.budget.amount,
        currency: formData.budget.currency,
        mode: formData.budget.mode
      },
      travelStyle: formData.preferences.travelStyle,
      highlights: this.generateTripHighlights(info, formData.preferences.interests)
    };
  }
  
  /**
   * Generate daily itinerary with intelligent scheduling
   */
  private generateDailyItinerary(
    formData: TravelFormData,
    info: GatheredInformationRepository,
    strategicPlan: StrategicPlanningResult,
    startDate: Date,
    duration: number
  ): z.infer<typeof DailyItinerarySchema>[] {
    
    const dailyItinerary: z.infer<typeof DailyItinerarySchema>[] = [];
    
    for (let day = 1; day <= duration; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (day - 1));
      
      const dayItinerary = this.generateSingleDayItinerary(
        day,
        currentDate,
        formData,
        info,
        strategicPlan,
        duration
      );
      
      dailyItinerary.push(dayItinerary);
    }
    
    return dailyItinerary;
  }
  
  /**
   * Generate single day itinerary with activity scheduling
   */
  private generateSingleDayItinerary(
    dayNumber: number,
    date: Date,
    formData: TravelFormData,
    info: GatheredInformationRepository,
    strategicPlan: StrategicPlanningResult,
    totalDays: number
  ): z.infer<typeof DailyItinerarySchema> {
    
    const dateString = date.toISOString().split('T')[0];
    
    // Determine day type
    let dayType: string;
    let energyLevel: "low" | "medium" | "high";
    let activitiesCount: number;
    
    if (dayNumber === 1) {
      dayType = "arrival";
      energyLevel = "low";
      activitiesCount = 2;
    } else if (dayNumber === totalDays) {
      dayType = "departure";
      energyLevel = "low"; 
      activitiesCount = 1;
    } else if (dayNumber % 7 === 0) {
      dayType = "rest";
      energyLevel = "medium";
      activitiesCount = 3;
    } else {
      dayType = dayNumber % 2 === 0 ? "cultural" : "adventure";
      energyLevel = "high";
      activitiesCount = 4;
    }
    
    // Generate activities for the day
    const activities = this.generateDayActivities(
      dayType,
      activitiesCount,
      info,
      formData,
      dayNumber === 1,
      dayNumber === totalDays
    );
    
    // Calculate day statistics
    const totalCost = activities.reduce((sum, activity) => sum + (activity.cost || 0), 0);
    const walkingDistance = this.calculateWalkingDistance(activities);
    const travelTime = this.calculateTravelTime(activities);
    
    return {
      day: dayNumber,
      date: dateString,
      theme: this.generateDayTheme(dayType, formData.preferences.travelStyle),
      overview: this.generateDayOverview(dayType, activities, formData.destination),
      activities,
      totalCost,
      walkingDistance,
      travelTime,
      energyLevel,
      flexibility: dayType === "rest" ? 0.8 : 0.5,
      weatherConsiderations: this.generateWeatherConsiderations(info.weather, date),
      alternatives: this.generateDayAlternatives(dayType, info)
    };
  }
  
  /**
   * Generate activities for a specific day
   */
  private generateDayActivities(
    dayType: string,
    count: number,
    info: GatheredInformationRepository,
    formData: TravelFormData,
    isArrival: boolean,
    isDeparture: boolean
  ): z.infer<typeof DailyActivitySchema>[] {
    
    const activities: z.infer<typeof DailyActivitySchema>[] = [];
    let currentTime = isArrival ? "14:00" : "09:00"; // Start later on arrival day
    
    // Always include meals
    if (!isArrival) {
      activities.push(this.createMealActivity("09:00", "breakfast", info.restaurants[0], 60));
      currentTime = "10:30";
    }
    
    // Add main activities
    for (let i = 0; i < count; i++) {
      const activity = this.selectActivity(dayType, i, info, formData);
      const duration = this.getActivityDuration(activity.type);
      
      activities.push({
        time: currentTime,
        duration,
        title: activity.title,
        description: activity.description,
        location: activity.location,
        cost: activity.cost,
        type: activity.type,
        notes: activity.notes,
        bookingInfo: activity.bookingInfo
      });
      
      // Update time for next activity (add duration + travel time)
      currentTime = this.addMinutesToTime(currentTime, duration + 30);
    }
    
    // Add lunch
    const lunchTime = this.findLunchTime(activities);
    activities.push(this.createMealActivity(lunchTime, "lunch", info.restaurants[1] || info.restaurants[0], 90));
    
    // Add dinner if not departure day
    if (!isDeparture) {
      activities.push(this.createMealActivity("19:00", "dinner", info.restaurants[2] || info.restaurants[0], 120));
    }
    
    // Sort activities by time
    return activities.sort((a, b) => a.time.localeCompare(b.time));
  }
  
  /**
   * Generate travel tips section
   */
  private generateTravelTips(
    formData: TravelFormData,
    info: GatheredInformationRepository,
    strategicPlan: StrategicPlanningResult
  ): z.infer<typeof TravelTipsSchema> {
    
    return {
      packing: this.generatePackingTips(formData, info),
      cultural: this.generateCulturalTips(info.culture),
      practical: this.generatePracticalTips(info.practical),
      safety: this.generateSafetyTips(info.safety),
      budgeting: this.generateBudgetingTips(formData, strategicPlan),
      transportation: this.generateTransportationTips(info.transportation),
      dining: this.generateDiningTips(info.restaurants, formData.preferences),
      emergency: this.generateEmergencyTips(info)
    };
  }
  
  // ===== Helper Methods =====
  
  private generateTripHighlights(info: GatheredInformationRepository, interests: string[]): string[] {
    const highlights: string[] = [];
    
    // Add top attractions
    if (info.attractions?.length > 0) {
      highlights.push(`Visit ${info.attractions[0].name}`);
    }
    
    // Add cuisine highlight
    if (info.restaurants?.length > 0) {
      highlights.push(`Experience local ${info.restaurants[0].cuisine || 'cuisine'}`);
    }
    
    // Add cultural highlight
    if (info.culture?.customs?.length > 0) {
      highlights.push(`Discover local culture and customs`);
    }
    
    // Add interest-based highlights
    if (interests.includes("adventure")) {
      highlights.push("Adventure activities and outdoor experiences");
    }
    
    if (interests.includes("history")) {
      highlights.push("Rich historical sites and heritage");
    }
    
    return highlights.slice(0, 5);
  }
  
  private generateDayTheme(dayType: string, travelStyle: string): string {
    const themes: Record<string, string> = {
      "arrival": "Arrival and Orientation",
      "departure": "Departure and Reflection",
      "rest": "Relaxation and Local Life",
      "cultural": "Cultural Immersion",
      "adventure": "Adventure and Discovery"
    };
    
    return themes[dayType] || "Exploration and Discovery";
  }
  
  private generateDayOverview(dayType: string, activities: any[], destination: string): string {
    const activityCount = activities.filter(a => a.type === "activity").length;
    
    switch (dayType) {
      case "arrival":
        return `Welcome to ${destination}! Start with a gentle introduction to the city, get oriented, and enjoy your first taste of local culture.`;
      case "departure":
        return `Final day in ${destination}. Time for last-minute shopping, reflection, and preparing for departure.`;
      case "rest":
        return `A more relaxed pace today with ${activityCount} activities, allowing time to soak in the local atmosphere and recharge.`;
      case "cultural":
        return `Dive deep into ${destination}'s rich culture with ${activityCount} immersive experiences and cultural sites.`;
      case "adventure":
        return `An action-packed day with ${activityCount} exciting activities showcasing the best of ${destination}'s adventure offerings.`;
      default:
        return `A full day of exploration in ${destination} with ${activityCount} carefully selected activities.`;
    }
  }
  
  private selectActivity(dayType: string, index: number, info: GatheredInformationRepository, formData: TravelFormData) {
    // Mock activity selection - in reality would use strategic plan recommendations
    const attractions = info.attractions || [];
    const restaurants = info.restaurants || [];
    
    const activityTypes: Record<string, string[]> = {
      "arrival": ["accommodation", "activity", "meal"],
      "departure": ["activity", "transport"],  
      "rest": ["activity", "meal", "activity"],
      "cultural": ["activity", "activity", "meal", "activity"],
      "adventure": ["activity", "transport", "activity", "meal"]
    };
    
    const types = activityTypes[dayType] || ["activity"];
    const activityType = types[Math.min(index, types.length - 1)];
    
    if (activityType === "activity" && attractions.length > 0) {
      const attraction = attractions[index % attractions.length];
      return {
        title: `Visit ${attraction.name}`,
        description: attraction.description || `Explore this popular ${attraction.type} attraction`,
        location: attraction.location?.address || formData.destination,
        cost: attraction.pricing?.adult || 25,
        type: "activity" as const,
        notes: `Duration: ${attraction.visitDuration?.recommended || 2} hours`,
        bookingInfo: {
          required: attraction.pricing?.adult ? true : false,
          advanceBooking: "Recommended during peak season"
        }
      };
    }
    
    // Default activity
    return {
      title: "Local Exploration",
      description: "Discover the neighborhood and local culture",
      location: formData.destination,
      cost: 0,
      type: "activity" as const,
      notes: "Self-guided exploration"
    };
  }
  
  private createMealActivity(time: string, mealType: string, restaurant: any, duration: number) {
    return {
      time,
      duration,
      title: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} at ${restaurant?.name || 'Local Restaurant'}`,
      description: restaurant?.cuisine ? `Enjoy ${restaurant.cuisine.join(', ')} cuisine` : `Traditional local ${mealType}`,
      location: restaurant?.location?.address || "City Center", 
      cost: restaurant?.pricing?.average || (mealType === "breakfast" ? 15 : mealType === "lunch" ? 25 : 45),
      type: "meal" as const,
      notes: restaurant?.specialties?.join(', ') || `Popular local ${mealType} spot`,
      bookingInfo: {
        required: false,
        phone: restaurant?.contact?.phone
      }
    };
  }
  
  private getActivityDuration(type: string): number {
    const durations: Record<string, number> = {
      "activity": 120, // 2 hours
      "meal": 90,      // 1.5 hours  
      "transport": 30, // 30 minutes
      "accommodation": 60 // 1 hour
    };
    
    return durations[type] || 120;
  }
  
  private addMinutesToTime(timeStr: string, minutes: number): string {
    const [hours, mins] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }
  
  private findLunchTime(activities: any[]): string {
    // Find gap around lunch time (12:00-14:00)
    const lunchWindow = ["12:00", "12:30", "13:00", "13:30"];
    
    for (const time of lunchWindow) {
      const conflict = activities.some(activity => 
        Math.abs(this.timeToMinutes(activity.time) - this.timeToMinutes(time)) < 60
      );
      if (!conflict) return time;
    }
    
    return "13:00"; // Default lunch time
  }
  
  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  private calculateWalkingDistance(activities: any[]): number {
    // Mock calculation - estimate 0.5km between activities
    return Math.max(0, (activities.length - 1) * 0.5);
  }
  
  private calculateTravelTime(activities: any[]): number {
    // Mock calculation - 15 minutes between activities
    return Math.max(0, (activities.length - 1) * 15);
  }
  
  private generateWeatherConsiderations(weather: any, date: Date): string[] {
    return [
      "Check local weather forecast before heading out",
      "Pack layers for changing conditions",
      "Bring umbrella or rain protection"
    ];
  }
  
  private generateDayAlternatives(dayType: string, info: GatheredInformationRepository): string[] {
    return [
      "Indoor museum visits if weather is poor",
      "Local shopping and cafe culture",
      "Extended time at accommodation for rest"
    ];
  }
  
  // ===== Travel Tips Generation =====
  
  private generatePackingTips(formData: TravelFormData, info: GatheredInformationRepository): string[] {
    return [
      "Pack comfortable walking shoes for city exploration",
      "Bring layers for changing weather conditions",
      "Pack light rain jacket or umbrella",
      "Don't forget phone charger and universal adapter",
      "Bring daypack for daily excursions"
    ];
  }
  
  private generateCulturalTips(culture: any): string[] {
    return culture?.customs || [
      "Learn basic local greetings and thank you",
      "Respect local customs and traditions",
      "Dress appropriately for religious sites",
      "Be patient with cultural differences",
      "Try to speak some of the local language"
    ];
  }
  
  private generatePracticalTips(practical: any): string[] {
    return [
      `Local currency is ${practical?.currency?.code || 'available at ATMs'}`,
      "Keep copies of important documents",
      "Register with local embassy if staying long-term", 
      "Download offline maps and translation apps",
      "Keep emergency contact information handy"
    ];
  }
  
  private generateSafetyTips(safety: any): string[] {
    return safety?.recommendations || [
      "Stay aware of your surroundings",
      "Keep valuables secure and out of sight",
      "Use official transportation services", 
      "Stay in well-lit areas at night",
      "Trust your instincts if something feels wrong"
    ];
  }
  
  private generateBudgetingTips(formData: TravelFormData, strategicPlan: any): string[] {
    return [
      `Track daily spending against your ${formData.budget.currency} ${formData.budget.amount} budget`,
      "Look for lunch specials and early bird dinner offers",
      "Take advantage of free walking tours and activities",
      "Use public transportation instead of taxis when possible",
      "Set aside 10-15% buffer for unexpected expenses"
    ];
  }
  
  private generateTransportationTips(transportation: any): string[] {
    return [
      "Purchase local transit cards for better rates",
      "Download local transportation apps",
      "Plan your routes in advance",
      "Allow extra time for connections",
      "Keep small bills for taxi rides"
    ];
  }
  
  private generateDiningTips(restaurants: any[], preferences: any): string[] {
    const tips = [
      "Make reservations for dinner at popular restaurants",
      "Try local specialties and street food",
      "Ask locals for their favorite hidden gems"
    ];
    
    if (preferences.dietaryRestrictions?.length > 0) {
      tips.push("Learn key phrases for dietary restrictions in local language");
    }
    
    return tips;
  }
  
  private generateEmergencyTips(info: GatheredInformationRepository): string[] {
    return [
      "Save emergency numbers in your phone",
      "Know location of nearest hospital and pharmacy",
      "Keep emergency cash in separate location",
      "Have backup copies of passport and ID",
      "Register with your country's embassy"
    ];
  }
  
  // ===== Appendix and Metadata Generation =====
  
  private generateAppendix(info: GatheredInformationRepository) {
    return {
      importantContacts: {
        emergency: "911 or local emergency number",
        medical: "Local medical services",
        tourism: "Tourist information hotline",
        accommodation: "Hotel concierge or accommodation contact"
      },
      transportation: {
        airports: info.transportation?.airports?.map(a => `${a.name} (${a.code})`) || ["Main Airport"],
        publicTransport: ["Metro", "Bus", "Tram", "Taxi"],
        rideshare: ["Uber", "Local rideshare services"],
        carRental: ["Major car rental companies at airport"]
      }
    };
  }
  
  private generateMetadata(formData: TravelFormData, agentsUsed: AgentType[]): any {
    return {
      generatedAt: new Date().toISOString(),
      agentsUsed: agentsUsed.map(agent => agent.replace('_', '-')),
      confidence: 0.85, // Overall confidence score
      sources: [
        "Official tourism websites",
        "Travel review platforms", 
        "Local guide recommendations",
        "Current weather and event data"
      ],
      version: "1.0.0",
      totalProcessingTime: 180000 // Mock 3 minutes processing time
    };
  }
  
  // ===== Cost and Token Estimation =====
  
  private calculateCompilationCost(itinerary: any): number {
    const baseCost = 0.25;
    const perDayCost = itinerary.dailyItinerary.length * 0.05;
    const perActivityCost = itinerary.dailyItinerary.reduce((sum: number, day: any) => 
      sum + day.activities.length * 0.02, 0
    );
    
    return baseCost + perDayCost + perActivityCost;
  }
  
  private estimateTokenUsage(type: "input" | "output", data: any): number {
    if (type === "input") {
      return Array.isArray(data) ? 3000 : 1500; // Input from previous agents
    } else {
      return 4000; // Comprehensive itinerary output
    }
  }
}

// ===== Factory and Utility Functions =====

/**
 * Create a new Content Compiler agent instance
 */
export function createContentCompilerAgent(config: WorkflowConfig): ContentCompilerAgent {
  return new ContentCompilerAgent(config);
}

/**
 * Validate compiled itinerary output
 */
export function validateCompiledItinerary(data: unknown): z.infer<typeof CompiledItinerarySchema> {
  return CompiledItinerarySchema.parse(data);
}

/**
 * Create mock daily activity for testing
 */
export function createMockDailyActivity(): z.infer<typeof DailyActivitySchema> {
  return {
    time: "10:00",
    duration: 120,
    title: "City Walking Tour",
    description: "Guided tour of historic city center",
    location: "Main Square",
    cost: 25,
    type: "activity",
    notes: "Wear comfortable walking shoes",
    bookingInfo: {
      required: true,
      advanceBooking: "24 hours recommended"
    }
  };
}

/**
 * Create mock travel tips for testing
 */
export function createMockTravelTips(): z.infer<typeof TravelTipsSchema> {
  return {
    packing: ["Comfortable walking shoes", "Weather appropriate clothing"],
    cultural: ["Learn basic greetings", "Respect local customs"],
    practical: ["Keep copies of documents", "Download offline maps"],
    safety: ["Stay aware of surroundings", "Use official transportation"],
    budgeting: ["Track daily expenses", "Look for lunch specials"]
  };
}
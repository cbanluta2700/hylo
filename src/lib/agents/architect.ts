/**
 * Itinerary Architect Agent
 * High-level planning and itinerary architecture using Grok-      // Generate comprehensive itinerary plan
      const itineraryPlan = await this.generateItineraryPlan(input);

      // Create agent output
      const output: AgentOutput = {
        data: itineraryPlan,
        confidence: this.calculateConfidence(itineraryPlan),
        sources: [], // Will be populated by gatherer agent
        process  private getDayIntensity(_day: number, _totalDays: number, _pace: string): string {
    return 'Moderate';
  }

  private assignDayTheme(_day: number, _totalDays: number, _pace: string): string {
    const themes = [
      'Arrival and Discovery',
      'Cultural Immersion',
      'Adventure and Exploration',
      'Relaxation and Reflection',
      'Culinary Journey',
      'Nature and Outdoors',
      'Local Experiences',
    ];

    return themes[0] || 'General Activities';
  } - startTime,
        recommendations: this.generateRecommendations(input.formData, []).map(r => r.category),
      };oning
 */

import { AgentInput, AgentOutput } from '../../types/agent-responses';
import { EnhancedFormData } from '../../types/form-data';
import { searchOrchestrator } from '../search-orchestrator';

/**
 * Agent Response type for architect
 */
export interface AgentResponse {
  success: boolean;
  output?: AgentOutput;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    agentVersion: string;
    processingTime: number;
    modelUsed: string;
  };
}

/**
 * Itinerary Architect Agent Configuration
 */
export interface ArchitectConfig {
  model: 'grok-4-fast-reasoning';
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  planningDepth: 'basic' | 'detailed' | 'comprehensive';
}

/**
 * Default configuration for the Architect agent
 */
const DEFAULT_ARCHITECT_CONFIG: ArchitectConfig = {
  model: 'grok-4-fast-reasoning',
  temperature: 0.3, // Lower temperature for more consistent planning
  maxTokens: 4000,
  systemPrompt: `You are the Itinerary Architect, a master travel planner specializing in creating comprehensive, personalized travel itineraries.

Your role is to:
1. Analyze traveler preferences, constraints, and goals
2. Design high-level itinerary structure and flow
3. Identify key destinations and activities
4. Create logical day-by-day progression
5. Ensure balance between must-see attractions and relaxation
6. Consider practical logistics (transportation, timing, costs)
7. Adapt to group composition and special needs
8. Provide clear rationale for all planning decisions

Always consider:
- Travel party composition (families, couples, groups)
- Time constraints and pacing preferences
- Budget considerations
- Accessibility and mobility needs
- Weather and seasonal factors
- Local customs and peak tourist times
- Transportation logistics between destinations

Structure your response as a comprehensive itinerary plan with:
- Executive summary of the trip concept
- Day-by-day breakdown with key activities
- Transportation and logistics overview
- Budget allocation recommendations
- Risk mitigation and contingency plans
- Personalization notes based on traveler preferences`,
  planningDepth: 'comprehensive',
};

/**
 * Itinerary Architect Agent
 */
export class ItineraryArchitectAgent {
  private config: ArchitectConfig;

  constructor(config: Partial<ArchitectConfig> = {}) {
    this.config = { ...DEFAULT_ARCHITECT_CONFIG, ...config };
  }

  /**
   * Process itinerary planning request
   */
  async processRequest(input: AgentInput): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      // Validate input
      this.validateInput(input);

      // Generate comprehensive itinerary plan
      const itineraryPlan = await this.generateItineraryPlan(input);

      // Create agent output
      const output: AgentOutput = {
        data: itineraryPlan,
        confidence: this.calculateConfidence(itineraryPlan),
        sources: [], // Will be populated by gatherer agent
        processingTime: Date.now() - startTime,
        recommendations: this.generateRecommendations(input.formData, []).map((r) => r.category),
      };

      return {
        success: true,
        output,
        metadata: {
          agentVersion: '1.0.0',
          processingTime: Date.now() - startTime,
          modelUsed: this.config.model,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ARCHITECT_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown architect error',
          details: {
            input: input,
            timestamp: new Date().toISOString(),
          },
        },
        metadata: {
          agentVersion: '1.0.0',
          processingTime: Date.now() - startTime,
          modelUsed: this.config.model,
        },
      };
    }
  }

  /**
   * Generate comprehensive itinerary plan
   */
  private async generateItineraryPlan(input: AgentInput): Promise<any> {
    const { formData, context } = input;

    // Analyze traveler profile and preferences
    const travelerAnalysis = this.analyzeTravelerProfile(formData);

    // Research destination information
    const destinationResearch = await this.researchDestination(formData.location);

    // Generate high-level itinerary structure
    const itineraryStructure = this.createItineraryStructure(formData, travelerAnalysis);

    // Plan day-by-day activities
    const dayPlans = this.planDayByDayActivities(formData, itineraryStructure, destinationResearch);

    // Calculate logistics and transportation
    const logistics = this.planLogistics(formData, dayPlans);

    // Estimate budget allocation
    const budget = this.estimateBudget(formData, dayPlans, logistics);

    // Create comprehensive itinerary plan
    return {
      executiveSummary: this.createExecutiveSummary(formData, travelerAnalysis),
      travelerProfile: travelerAnalysis,
      itineraryStructure,
      dayPlans,
      logistics,
      budget,
      recommendations: this.generateRecommendations(formData, dayPlans),
      contingencies: this.identifyContingencies(formData, dayPlans),
      metadata: {
        generatedAt: new Date().toISOString(),
        planningDepth: this.config.planningDepth,
        confidence: this.calculatePlanConfidence(dayPlans),
      },
    };
  }

  /**
   * Analyze traveler profile and preferences
   */
  private analyzeTravelerProfile(formData: EnhancedFormData): any {
    const groupSize = formData.adults + (formData.children || 0);
    const hasChildren = (formData.children || 0) > 0;
    const hasSeniors = formData.adults > 0; // Simplified - could be enhanced with age data

    return {
      groupComposition: {
        adults: formData.adults,
        children: formData.children || 0,
        total: groupSize,
        childAges: formData.childrenAges,
      },
      travelStyle: this.inferTravelStyle(formData),
      interests: formData.selectedInterests || [],
      groupType: formData.selectedGroups?.[0] || 'general',
      specialConsiderations: {
        hasChildren,
        hasSeniors,
        mobilityNeeds: this.assessMobilityNeeds(formData),
        dietaryRestrictions: this.inferDietaryNeeds(formData),
      },
      budget: {
        level: this.categorizeBudget(formData.budget),
        flexibility: formData.flexibleBudget || false,
      },
    };
  }

  /**
   * Research destination information using search providers
   */
  private async researchDestination(destination: string): Promise<any> {
    try {
      // Use search orchestrator to gather destination information
      const searchRequest = {
        query: `${destination} travel guide 2025 tourist attractions weather best time to visit`,
        type: 'text' as const,
        provider: 'orchestrator',
        options: {
          maxResults: 10,
        },
      };

      const searchResponse = await searchOrchestrator.search(searchRequest);

      return {
        attractions: this.extractAttractions(searchResponse.results),
        weather: this.extractWeatherInfo(searchResponse.results),
        bestTimeToVisit: this.extractBestTimeInfo(searchResponse.results),
        practicalInfo: this.extractPracticalInfo(searchResponse.results),
        sources: searchResponse.results.map((r) => r.source),
      };
    } catch (error) {
      // Fallback to basic destination info
      return {
        attractions: ['Major tourist sites', 'Local markets', 'Cultural landmarks'],
        weather: 'Typical seasonal weather',
        bestTimeToVisit: 'Shoulder season recommended',
        practicalInfo: 'Standard travel preparations',
        sources: ['fallback'],
      };
    }
  }

  /**
   * Create high-level itinerary structure
   */
  private createItineraryStructure(formData: EnhancedFormData, travelerAnalysis: any): any {
    const totalDays = this.calculateTotalDays(formData);
    const pace = this.determinePace(travelerAnalysis, totalDays);

    return {
      totalDays,
      pace,
      structure: {
        arrival: 'Day 1: Arrival and acclimation',
        exploration: `Days 2-${totalDays - 1}: Main exploration and activities`,
        departure: `Day ${totalDays}: Departure day`,
      },
      focusAreas: this.determineFocusAreas(formData, travelerAnalysis),
      progression: this.createProgressionPlan(totalDays, pace),
    };
  }

  /**
   * Plan day-by-day activities
   */
  private planDayByDayActivities(formData: EnhancedFormData, structure: any, research: any): any[] {
    const dayPlans: any[] = [];
    const totalDays = structure.totalDays;

    for (let day = 1; day <= totalDays; day++) {
      const dayPlan = {
        day,
        theme: this.assignDayTheme(day, totalDays, structure.pace),
        activities: this.selectActivitiesForDay(day, formData, research, structure),
        meals: this.planMealsForDay(day, formData),
        transportation: this.planDayTransportation(day, formData),
        rest: this.scheduleRestTime(day, structure.pace),
        flexibility: this.addFlexibilityBuffer(day, structure.pace),
      };

      dayPlans.push(dayPlan);
    }

    return dayPlans;
  }

  /**
   * Plan logistics and transportation
   */
  private planLogistics(formData: EnhancedFormData, dayPlans: any[]): any {
    return {
      arrival: {
        airport: this.recommendArrivalAirport(formData.location),
        transportation: 'Airport transfer to accommodation',
        timing: 'Morning arrival recommended',
      },
      internal: {
        transportation: this.planInternalTransportation(dayPlans),
        transfers: this.identifyTransportationNeeds(dayPlans),
      },
      departure: {
        timing: 'Flexible departure based on flight time',
        transportation: 'Transfer to airport',
      },
      reservations: {
        required: this.identifyRequiredReservations(dayPlans),
        recommended: this.identifyRecommendedReservations(dayPlans),
      },
    };
  }

  /**
   * Estimate budget allocation
   */
  private estimateBudget(formData: EnhancedFormData, _dayPlans: any[], _logistics: any): any {
    const baseBudget = formData.budget;
    const groupSize = formData.adults + (formData.children || 0);

    return {
      total: baseBudget,
      breakdown: {
        accommodation: baseBudget * 0.4,
        activities: baseBudget * 0.25,
        transportation: baseBudget * 0.2,
        meals: baseBudget * 0.1,
        miscellaneous: baseBudget * 0.05,
      },
      perPerson: baseBudget / groupSize,
      dailyAverage: baseBudget / this.calculateTotalDays(formData),
      contingencies: baseBudget * 0.1,
    };
  }

  /**
   * Helper methods for itinerary planning
   */

  private inferTravelStyle(formData: EnhancedFormData): string {
    const interests = formData.selectedInterests || [];
    const travelStyle = formData.travelStyleChoice;

    if (travelStyle && travelStyle !== 'not-selected') {
      return travelStyle;
    }

    // Infer from interests
    if (interests.some((i) => i.toLowerCase().includes('adventure'))) {
      return 'adventure';
    }
    if (interests.some((i) => i.toLowerCase().includes('culture'))) {
      return 'cultural';
    }
    if (interests.some((i) => i.toLowerCase().includes('relax'))) {
      return 'relaxation';
    }

    return 'balanced';
  }

  private assessMobilityNeeds(formData: EnhancedFormData): string[] {
    const needs: string[] = [];
    const hasChildren = (formData.children || 0) > 0;

    if (hasChildren) {
      needs.push('Family-friendly activities');
      needs.push('Shorter walking distances');
    }

    // Could be enhanced with more detailed accessibility information
    return needs;
  }

  private inferDietaryNeeds(_formData: EnhancedFormData): string[] {
    // This could be enhanced with more detailed dietary preference detection
    return [];
  }

  private categorizeBudget(budget: number): string {
    if (budget >= 5000) return 'luxury';
    if (budget >= 3000) return 'premium';
    if (budget >= 1500) return 'moderate';
    return 'budget';
  }

  private calculateTotalDays(formData: EnhancedFormData): number {
    if (formData.plannedDays) {
      return formData.plannedDays;
    }

    if (formData.departDate && formData.returnDate) {
      const depart = new Date(formData.departDate);
      const returnD = new Date(formData.returnDate);
      const diffTime = Math.abs(returnD.getTime() - depart.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return 7; // Default 7-day trip
  }

  private determinePace(analysis: any, totalDays: number): string {
    if (totalDays <= 3) return 'intensive';
    if (totalDays <= 7) return 'moderate';
    if (analysis.specialConsiderations.hasChildren) return 'relaxed';
    return 'balanced';
  }

  private determineFocusAreas(_formData: EnhancedFormData, _analysis: any): string[] {
    const areas: string[] = [];

    // Default focus areas - could be enhanced with actual analysis
    areas.push('General sightseeing');

    return areas;
  }

  private createProgressionPlan(totalDays: number, pace: string): any {
    // Create a logical progression through the destination
    const progression = [];

    for (let day = 1; day <= totalDays; day++) {
      progression.push({
        day,
        focus: this.getDayFocus(day, totalDays, pace),
        intensity: this.getDayIntensity(day, totalDays, pace),
      });
    }

    return progression;
  }

  private getDayFocus(day: number, totalDays: number, pace: string): string {
    if (day === 1) return 'Arrival and orientation';
    if (day === totalDays) return 'Final activities and departure';
    if (pace === 'intensive') return 'Full exploration';
    return 'Balanced activities';
  }

  private getDayIntensity(day: number, totalDays: number, pace: string): string {
    if (pace === 'relaxed') return 'Light';
    if (pace === 'intensive') return 'High';
    return 'Moderate';
  }

  private assignDayTheme(day: number, totalDays: number, pace: string): string {
    const themes = [
      'Arrival and Discovery',
      'Cultural Immersion',
      'Adventure and Exploration',
      'Relaxation and Reflection',
      'Culinary Journey',
      'Nature and Outdoors',
      'Local Experiences',
    ];

    return themes[(day - 1) % themes.length];
  }

  private selectActivitiesForDay(
    day: number,
    formData: EnhancedFormData,
    research: any,
    structure: any
  ): any[] {
    // Select appropriate activities based on day, interests, and research
    const activities: any[] = [];
    const interests = formData.selectedInterests || [];

    // Add 2-4 activities per day based on pace
    const activityCount = structure.pace === 'intensive' ? 4 : structure.pace === 'relaxed' ? 2 : 3;

    for (let i = 0; i < activityCount; i++) {
      activities.push({
        time: this.getActivityTime(i),
        type: this.selectActivityType(interests, research),
        description: `Activity ${i + 1} for day ${day}`,
        duration: '2-3 hours',
      });
    }

    return activities;
  }

  private getActivityTime(index: number): string {
    const times = ['Morning', 'Mid-morning', 'Afternoon', 'Evening'];
    return times[index] || 'Flexible';
  }

  private selectActivityType(interests: string[], research: any): string {
    if (interests.some((i) => i.toLowerCase().includes('culture'))) {
      return 'Cultural';
    }
    if (interests.some((i) => i.toLowerCase().includes('nature'))) {
      return 'Nature';
    }
    return 'General';
  }

  private planMealsForDay(day: number, formData: EnhancedFormData): any[] {
    return [
      { type: 'Breakfast', location: 'Hotel/Local cafe', notes: 'Included/Local options' },
      { type: 'Lunch', location: 'Local restaurant', notes: 'Try local cuisine' },
      { type: 'Dinner', location: 'Recommended restaurant', notes: 'Based on preferences' },
    ];
  }

  private planDayTransportation(day: number, formData: EnhancedFormData): any {
    return {
      method: 'Walking/Taxi/Rideshare',
      notes: 'Flexible transportation options available',
      estimatedCost: 'Moderate',
    };
  }

  private scheduleRestTime(day: number, pace: string): any {
    if (pace === 'intensive') {
      return { duration: '1-2 hours', timing: 'Afternoon break' };
    }
    return { duration: '2-3 hours', timing: 'Afternoon relaxation' };
  }

  private addFlexibilityBuffer(day: number, pace: string): any {
    return {
      duration: pace === 'intensive' ? '1 hour' : '2 hours',
      purpose: 'Contingency and spontaneous activities',
    };
  }

  private recommendArrivalAirport(destination: string): string {
    // This could be enhanced with actual airport data
    return `Nearest major airport to ${destination}`;
  }

  private planInternalTransportation(dayPlans: any[]): any {
    return {
      primary: 'Taxi/Rideshare services',
      alternatives: ['Public transportation', 'Walking', 'Tours'],
      recommendations: 'Use reputable services with fixed pricing',
    };
  }

  private identifyTransportationNeeds(dayPlans: any[]): any[] {
    return [
      { type: 'Airport transfer', required: true, booking: 'Advance recommended' },
      { type: 'Local transportation', required: true, booking: 'As needed' },
    ];
  }

  private identifyRequiredReservations(dayPlans: any[]): any[] {
    return [
      { type: 'Accommodation', priority: 'High', timeline: 'Immediate' },
      { type: 'Airport transfer', priority: 'Medium', timeline: 'Advance' },
    ];
  }

  private identifyRecommendedReservations(dayPlans: any[]): any[] {
    return [
      { type: 'Popular attractions', priority: 'Medium', timeline: '1-2 weeks advance' },
      { type: 'Restaurants', priority: 'Low', timeline: 'Day of or 1 day advance' },
    ];
  }

  private createExecutiveSummary(formData: EnhancedFormData, analysis: any): string {
    const destination = formData.location;
    const duration = this.calculateTotalDays(formData);
    const groupSize = analysis.groupComposition.total;
    const style = analysis.travelStyle;

    return `${duration}-day ${style} trip to ${destination} for ${groupSize} travelers, focusing on ${analysis.interests.join(
      ', '
    )}. This itinerary balances ${analysis.focusAreas.join(
      ' and '
    )} with relaxation time, considering the group's ${
      analysis.specialConsiderations.hasChildren ? 'family needs' : 'preferences'
    }.`;
  }

  private generateRecommendations(formData: EnhancedFormData, dayPlans: any[]): any[] {
    const recommendations: any[] = [];

    recommendations.push({
      category: 'Packing',
      items: this.generatePackingRecommendations(formData),
    });

    recommendations.push({
      category: 'Health & Safety',
      items: this.generateHealthRecommendations(formData),
    });

    recommendations.push({
      category: 'Local Tips',
      items: this.generateLocalTips(formData),
    });

    return recommendations;
  }

  private generatePackingRecommendations(formData: EnhancedFormData): string[] {
    const recommendations: string[] = [];
    const duration = this.calculateTotalDays(formData);
    const hasChildren = (formData.children || 0) > 0;

    recommendations.push('Comfortable walking shoes');
    recommendations.push('Weather-appropriate clothing');

    if (duration > 7) {
      recommendations.push('Laundry bag or services');
    }

    if (hasChildren) {
      recommendations.push('Child essentials (snacks, entertainment)');
    }

    return recommendations;
  }

  private generateHealthRecommendations(formData: EnhancedFormData): string[] {
    return [
      'Travel insurance recommended',
      'Check health requirements for destination',
      'Stay hydrated and use sunscreen',
      'Keep important medications accessible',
    ];
  }

  private generateLocalTips(formData: EnhancedFormData): string[] {
    return [
      'Learn basic local phrases',
      'Carry small denomination currency',
      'Respect local customs and dress codes',
      'Use reputable transportation services',
    ];
  }

  private identifyContingencies(formData: EnhancedFormData, dayPlans: any[]): any[] {
    return [
      {
        scenario: 'Weather disruption',
        impact: 'Activity changes',
        mitigation: 'Have indoor alternatives planned',
      },
      {
        scenario: 'Transportation delay',
        impact: 'Schedule changes',
        mitigation: 'Build flexibility into daily plans',
      },
      {
        scenario: 'Health issue',
        impact: 'Activity modification',
        mitigation: 'Know location of medical facilities',
      },
    ];
  }

  private calculatePlanConfidence(dayPlans: any[]): number {
    // Calculate confidence based on plan completeness and research quality
    let confidence = 0.8; // Base confidence

    if (dayPlans.length > 0) confidence += 0.1;
    if (dayPlans.some((d) => d.activities.length > 0)) confidence += 0.1;

    return Math.min(1.0, confidence);
  }

  private calculateConfidence(plan: any): number {
    return plan.metadata?.confidence || 0.8;
  }

  private estimateTokens(plan: any): number {
    // Rough estimation based on content length
    const contentString = JSON.stringify(plan);
    return Math.ceil(contentString.length / 4); // ~4 characters per token
  }

  private validateInput(input: AgentInput): void {
    if (!input.formData) {
      throw new Error('Form data is required for itinerary planning');
    }

    if (!input.formData.location) {
      throw new Error('Destination location is required');
    }

    if (!input.sessionId) {
      throw new Error('Session ID is required');
    }
  }

  // Research helper methods
  private extractAttractions(results: any[]): string[] {
    return results
      .filter(
        (r) =>
          r.snippet.toLowerCase().includes('attraction') ||
          r.snippet.toLowerCase().includes('sightseeing')
      )
      .map((r) => r.title)
      .slice(0, 5);
  }

  private extractWeatherInfo(results: any[]): any {
    const weatherResult = results.find(
      (r) =>
        r.snippet.toLowerCase().includes('weather') || r.snippet.toLowerCase().includes('climate')
    );

    return weatherResult
      ? {
          description: weatherResult.snippet,
          source: weatherResult.source,
        }
      : { description: 'Typical seasonal weather', source: 'general' };
  }

  private extractBestTimeInfo(results: any[]): any {
    const timeResult = results.find(
      (r) =>
        r.snippet.toLowerCase().includes('best time') ||
        r.snippet.toLowerCase().includes('shoulder season')
    );

    return timeResult
      ? {
          description: timeResult.snippet,
          source: timeResult.source,
        }
      : { description: 'Shoulder season generally recommended', source: 'general' };
  }

  private extractPracticalInfo(results: any[]): any {
    return {
      currency: 'Local currency information',
      language: 'Common local languages',
      safety: 'General safety information',
    };
  }
}

/**
 * Factory function to create Itinerary Architect agent
 */
export function createItineraryArchitect(
  config?: Partial<ArchitectConfig>
): ItineraryArchitectAgent {
  return new ItineraryArchitectAgent(config);
}

/**
 * Default Itinerary Architect instance
 */
export const itineraryArchitect = createItineraryArchitect();

/**
 * Validation Rules:
 * - Form data must include destination location
 * - Session ID is required for tracking
 * - Itinerary plan must include day-by-day breakdown
 * - Budget estimates must be realistic
 * - Contingency plans must be identified
 * - Confidence scores must be between 0 and 1
 */

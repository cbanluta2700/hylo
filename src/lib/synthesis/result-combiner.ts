/**
 * Result Synthesis - Combining All Agent Outputs
 * Intelligent synthesis of multi-agent AI responses into cohesive travel itineraries
 */

import { itineraryFormatter, ItineraryData } from '../formatting/itinerary-formatter';
import { summaryFormatter } from '../formatting/summary-formatter';
import { dailyFormatter } from '../formatting/daily-formatter';

/**
 * Agent output interfaces
 */
export interface ArchitectOutput {
  title: string;
  destination: string;
  duration: {
    days: number;
    nights: number;
  };
  travelers: {
    adults: number;
    children: number;
  };
  overview: string;
  highlights: string[];
  budget: {
    total: number;
    currency: string;
    breakdown: {
      accommodations: number;
      transportation: number;
      activities: number;
      dining: number;
      miscellaneous: number;
    };
  };
  themes: string[];
  confidence: number;
}

export interface GathererOutput {
  destination: string;
  currentAttractions: Array<{
    name: string;
    description: string;
    category: string;
    rating?: number;
    estimatedCost?: number;
    bestTime?: string;
    duration?: string;
  }>;
  accommodations: Array<{
    name: string;
    type: string;
    location: string;
    rating?: number;
    priceRange: string;
    amenities: string[];
    description?: string;
  }>;
  dining: Array<{
    name: string;
    cuisine: string;
    priceRange: string;
    rating?: number;
    location: string;
    specialties?: string[];
  }>;
  transportation: Array<{
    type: string;
    from: string;
    to: string;
    providers: string[];
    estimatedCost: number;
    duration: string;
  }>;
  practicalInfo: {
    bestTimeToVisit: string;
    currency: string;
    language: string;
    timeZone: string;
    visaRequirements?: string;
    healthSafety?: string[];
  };
  sources: Array<{
    url: string;
    title: string;
    credibility: number;
    lastUpdated: string;
  }>;
}

export interface SpecialistOutput {
  destination: string;
  expertInsights: Array<{
    category: string;
    title: string;
    content: string;
    priority: 'high' | 'medium' | 'low';
    source?: string;
  }>;
  localExperiences: Array<{
    name: string;
    description: string;
    authenticRating: number; // 1-10 scale
    cost: number;
    duration: string;
    bestFor: string[];
    insiderTips: string[];
  }>;
  seasonalConsiderations: {
    currentSeason: string;
    weather: string;
    crowds: string;
    pricing: string;
    recommendations: string[];
  };
  culturalNotes: Array<{
    aspect: string;
    importance: 'high' | 'medium' | 'low';
    description: string;
    doAndDont: string[];
  }>;
  hiddenGems: Array<{
    name: string;
    description: string;
    whySpecial: string;
    accessDifficulty: 'easy' | 'medium' | 'hard';
    cost: number;
  }>;
}

export interface PutterOutput {
  destination: string;
  formData: any; // Original form data
  preferences: {
    budget: {
      total: number;
      flexibility: 'strict' | 'moderate' | 'flexible';
      priorities: string[];
    };
    travelStyle: string[];
    interests: string[];
    dietaryRestrictions: string[];
    accessibilityNeeds: string[];
    groupComposition: {
      adults: number;
      children: number;
      ages?: number[];
    };
  };
  constraints: {
    dates: {
      start: string;
      end: string;
      flexibility: number; // days
    };
    timeConstraints: string[];
    physicalLimitations: string[];
  };
  personalization: {
    mustInclude: string[];
    avoid: string[];
    specialRequests: string[];
  };
}

/**
 * Synthesis configuration
 */
export const SYNTHESIS_CONFIG = {
  // Quality thresholds
  MIN_CONFIDENCE_THRESHOLD: 0.7,
  MAX_PROCESSING_TIME: 30000, // 30 seconds

  // Content limits
  MAX_ACTIVITIES_PER_DAY: 4,
  MAX_DAILY_PLANS: 14, // 2 weeks max
  MAX_ACCOMMODATIONS: 3,
  MAX_DINING_RECOMMENDATIONS: 8,

  // Scoring weights
  WEIGHTS: {
    ARCHITECT: 0.4,
    GATHERER: 0.3,
    SPECIALIST: 0.2,
    PUTTER: 0.1,
  },

  // Default values
  DEFAULT_CURRENCY: 'USD',
  DEFAULT_LANGUAGE: 'English',
  DEFAULT_TIMEZONE: 'UTC',

  // Synthesis phases
  PHASES: {
    VALIDATION: 'validation',
    MERGE: 'merge',
    ENRICHMENT: 'enrichment',
    OPTIMIZATION: 'optimization',
    FINALIZATION: 'finalization',
  },
} as const;

/**
 * Synthesis result interface
 */
export interface SynthesisResult {
  success: boolean;
  itinerary?: ItineraryData;
  confidence: number;
  processingTime: number;
  errors: string[];
  warnings: string[];
  metadata: {
    agentsUsed: string[];
    sourcesCount: number;
    synthesisVersion: string;
    qualityScore: number;
  };
}

/**
 * Result Combiner
 * Synthesizes outputs from multiple AI agents into cohesive travel itineraries
 */
export class ResultCombiner {
  /**
   * Combine all agent outputs into a complete itinerary
   */
  async synthesizeItinerary(
    architect: ArchitectOutput,
    gatherer: GathererOutput,
    specialist: SpecialistOutput,
    putter: PutterOutput
  ): Promise<SynthesisResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Phase 1: Validation
      const validation = this.validateInputs(architect, gatherer, specialist, putter);
      if (!validation.valid) {
        errors.push(...validation.errors);
        return this.createErrorResult(errors, startTime);
      }

      // Phase 2: Merge core data
      const merged = this.mergeCoreData(architect, gatherer, specialist, putter);

      // Phase 3: Enrich with specialist insights
      const enriched = this.enrichWithSpecialistData(merged, specialist, putter);

      // Phase 4: Optimize and personalize
      const optimized = this.optimizeForPreferences(enriched, putter);

      // Phase 5: Finalize and validate
      const finalized = this.finalizeItinerary(optimized, putter);

      // Calculate confidence and quality scores
      const confidence = this.calculateConfidence(architect, gatherer, specialist, putter);
      const qualityScore = this.calculateQualityScore(finalized, putter);

      return {
        success: true,
        itinerary: finalized,
        confidence,
        processingTime: Date.now() - startTime,
        errors: [],
        warnings,
        metadata: {
          agentsUsed: ['architect', 'gatherer', 'specialist', 'putter'],
          sourcesCount: gatherer.sources?.length || 0,
          synthesisVersion: '1.0.0',
          qualityScore,
        },
      };
    } catch (error) {
      errors.push(`Synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return this.createErrorResult(errors, startTime);
    }
  }

  /**
   * Validate all agent inputs
   */
  private validateInputs(
    architect: ArchitectOutput,
    gatherer: GathererOutput,
    specialist: SpecialistOutput,
    putter: PutterOutput
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate architect output
    if (!architect.title || !architect.destination) {
      errors.push('Architect output missing required fields: title or destination');
    }
    if (architect.confidence < SYNTHESIS_CONFIG.MIN_CONFIDENCE_THRESHOLD) {
      errors.push(`Architect confidence too low: ${architect.confidence}`);
    }

    // Validate gatherer output
    if (!gatherer.destination || gatherer.currentAttractions.length === 0) {
      errors.push('Gatherer output missing destination or attractions data');
    }

    // Validate specialist output
    if (!specialist.destination || specialist.expertInsights.length === 0) {
      errors.push('Specialist output missing destination or insights');
    }

    // Validate putter output
    if (!putter.preferences || !putter.constraints) {
      errors.push('Putter output missing preferences or constraints');
    }

    // Cross-validate destinations
    const destinations = [architect.destination, gatherer.destination, specialist.destination];
    if (!destinations.every((d) => d === destinations[0])) {
      errors.push('Agent outputs have inconsistent destinations');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Merge core data from all agents
   */
  private mergeCoreData(
    architect: ArchitectOutput,
    gatherer: GathererOutput,
    specialist: SpecialistOutput,
    putter: PutterOutput
  ): Partial<ItineraryData> {
    const destination = architect.destination;

    return {
      title: architect.title,
      destination,
      duration: {
        days: architect.duration.days,
        nights: architect.duration.nights,
        startDate: putter.constraints.dates.start,
        endDate: putter.constraints.dates.end,
      },
      travelers: architect.travelers,
      overview: architect.overview,
      highlights: architect.highlights,
      budget: {
        total: architect.budget.total,
        breakdown: architect.budget.breakdown,
        currency: architect.budget.currency,
        perPerson: Math.round(
          architect.budget.total / (architect.travelers.adults + architect.travelers.children)
        ),
      },
    };
  }

  /**
   * Enrich itinerary with specialist insights
   */
  private enrichWithSpecialistData(
    baseItinerary: Partial<ItineraryData>,
    specialist: SpecialistOutput,
    putter: PutterOutput
  ): Partial<ItineraryData> {
    // Create daily plans based on specialist insights and preferences
    const dailyPlans = this.createDailyPlans(baseItinerary, specialist, putter);

    // Extract tips from specialist insights
    const tips = specialist.expertInsights
      .filter((insight) => insight.category === 'tips' || insight.category === 'advice')
      .map((insight) => ({
        category: insight.category,
        title: insight.title,
        content: insight.content,
        priority: insight.priority,
      }));

    // Add cultural notes as additional tips
    const culturalTips = specialist.culturalNotes.map((note) => ({
      category: 'cultural',
      title: note.aspect,
      content: `${note.description}\n\nDo's and Don'ts:\n${note.doAndDont.join('\n')}`,
      priority: note.importance,
    }));

    return {
      ...baseItinerary,
      dailyPlan: dailyPlans,
      tips: [...(baseItinerary.tips || []), ...tips, ...culturalTips],
      notes: specialist.seasonalConsiderations.recommendations.join('\n'),
    };
  }

  /**
   * Optimize itinerary for user preferences
   */
  private optimizeForPreferences(
    enrichedItinerary: Partial<ItineraryData>,
    putter: PutterOutput
  ): Partial<ItineraryData> {
    // Filter activities based on interests
    if (enrichedItinerary.dailyPlan) {
      enrichedItinerary.dailyPlan = enrichedItinerary.dailyPlan.map((day) => ({
        ...day,
        activities: day.activities.filter((activity) =>
          this.matchesUserInterests(activity, putter.preferences.interests)
        ),
      }));
    }

    // Adjust budget based on flexibility
    if (enrichedItinerary.budget && putter.preferences.budget.flexibility !== 'strict') {
      const adjustment = putter.preferences.budget.flexibility === 'flexible' ? 1.1 : 1.05;
      enrichedItinerary.budget.total = Math.round(enrichedItinerary.budget.total * adjustment);
    }

    // Add personalization notes
    const personalizationNotes = [
      `Personalized for: ${putter.preferences.travelStyle.join(', ')}`,
      `Interests: ${putter.preferences.interests.join(', ')}`,
      putter.preferences.dietaryRestrictions.length > 0
        ? `Dietary considerations: ${putter.preferences.dietaryRestrictions.join(', ')}`
        : '',
      putter.personalization.mustInclude.length > 0
        ? `Must include: ${putter.personalization.mustInclude.join(', ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    enrichedItinerary.notes = [enrichedItinerary.notes, personalizationNotes]
      .filter(Boolean)
      .join('\n\n');

    return enrichedItinerary;
  }

  /**
   * Finalize and validate the complete itinerary
   */
  private finalizeItinerary(
    optimizedItinerary: Partial<ItineraryData>,
    putter: PutterOutput
  ): ItineraryData {
    // Ensure all required fields are present
    const finalized: ItineraryData = {
      title: optimizedItinerary.title || 'Custom Travel Itinerary',
      destination: optimizedItinerary.destination || 'Unknown Destination',
      duration: optimizedItinerary.duration || {
        days: 7,
        nights: 6,
        startDate: putter.constraints.dates.start,
        endDate: putter.constraints.dates.end,
      },
      travelers: optimizedItinerary.travelers || { adults: 2, children: 0, total: 2 },
      overview: optimizedItinerary.overview || 'A wonderful travel experience awaits!',
      highlights: optimizedItinerary.highlights || [],
      dailyPlan: optimizedItinerary.dailyPlan || [],
      accommodations: optimizedItinerary.accommodations || [],
      transportation: optimizedItinerary.transportation || [],
      activities: optimizedItinerary.activities || [],
      dining: optimizedItinerary.dining || [],
      budget: optimizedItinerary.budget || {
        total: 0,
        breakdown: {
          accommodations: 0,
          transportation: 0,
          activities: 0,
          dining: 0,
          miscellaneous: 0,
        },
        currency: SYNTHESIS_CONFIG.DEFAULT_CURRENCY,
      },
      tips: optimizedItinerary.tips || [],
      notes: optimizedItinerary.notes || '',
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      confidence: 0.8,
      processingTime: 0,
    };

    return finalized;
  }

  /**
   * Create daily plans from agent data
   */
  private createDailyPlans(
    baseItinerary: Partial<ItineraryData>,
    specialist: SpecialistOutput,
    putter: PutterOutput
  ): any[] {
    const days = baseItinerary.duration?.days || 7;
    const dailyPlans = [];

    // Get available activities from specialist
    const availableActivities = [
      ...specialist.localExperiences,
      // Could also include gatherer attractions here
    ];

    // Distribute activities across days
    for (let day = 1; day <= Math.min(days, SYNTHESIS_CONFIG.MAX_DAILY_PLANS); day++) {
      const dayActivities = this.selectActivitiesForDay(
        availableActivities,
        day,
        putter.preferences.interests,
        SYNTHESIS_CONFIG.MAX_ACTIVITIES_PER_DAY
      );

      dailyPlans.push({
        day,
        date: this.calculateDate(baseItinerary.duration?.startDate || '', day - 1),
        title: `Day ${day}: ${this.generateDayTitle(
          dayActivities,
          baseItinerary.destination || ''
        )}`,
        activities: dayActivities.map((activity) => ({
          id: `activity-${day}-${activity.name.replace(/\s+/g, '-').toLowerCase()}`,
          name: activity.name,
          description: activity.description,
          location: 'TBD', // Would be enriched from gatherer data
          duration: activity.duration,
          cost: activity.cost,
          category: activity.bestFor[0] || 'general',
          rating: activity.authenticRating,
        })),
        meals: this.generateMealsForDay(day, putter.preferences.dietaryRestrictions),
        transportation: [], // Would be populated from gatherer data
        accommodation: day === 1 ? {} : undefined, // Only on first day typically
        notes: this.generateDayNotes(day, specialist.seasonalConsiderations),
      });
    }

    return dailyPlans;
  }

  /**
   * Select appropriate activities for a specific day
   */
  private selectActivitiesForDay(
    availableActivities: any[],
    day: number,
    userInterests: string[],
    maxActivities: number
  ): any[] {
    // Filter by user interests
    const matchingActivities = availableActivities.filter((activity) =>
      activity.bestFor.some((interest: string) =>
        userInterests.some(
          (userInterest) =>
            userInterest.toLowerCase().includes(interest.toLowerCase()) ||
            interest.toLowerCase().includes(userInterest.toLowerCase())
        )
      )
    );

    // If not enough matching activities, add some general ones
    const selectedActivities = matchingActivities.slice(0, maxActivities);
    if (selectedActivities.length < maxActivities) {
      const generalActivities = availableActivities
        .filter((activity) => !matchingActivities.includes(activity))
        .slice(0, maxActivities - selectedActivities.length);
      selectedActivities.push(...generalActivities);
    }

    return selectedActivities;
  }

  /**
   * Generate meals for a day
   */
  private generateMealsForDay(day: number, dietaryRestrictions: string[]): any[] {
    const meals = [
      { type: 'breakfast', time: '08:00', name: 'Hotel Breakfast' },
      { type: 'lunch', time: '13:00', name: 'Local Restaurant' },
      { type: 'dinner', time: '19:00', name: 'Recommended Dining' },
    ];

    if (dietaryRestrictions.length > 0) {
      meals.forEach((meal) => {
        meal.notes = `Consider dietary restrictions: ${dietaryRestrictions.join(', ')}`;
      });
    }

    return meals;
  }

  /**
   * Calculate date for a specific day offset
   */
  private calculateDate(startDate: string, dayOffset: number): string {
    try {
      const date = new Date(startDate);
      date.setDate(date.getDate() + dayOffset);
      return date.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Generate a descriptive title for the day
   */
  private generateDayTitle(activities: any[], destination: string): string {
    if (activities.length === 0) return `Exploring ${destination}`;

    const mainActivity = activities[0];
    if (activities.length === 1) {
      return mainActivity.name;
    }

    return `${mainActivity.name} & More`;
  }

  /**
   * Generate contextual notes for the day
   */
  private generateDayNotes(day: number, seasonalInfo: any): string {
    const notes = [];

    if (day === 1) {
      notes.push('Arrival day - Take it easy and adjust to the time zone');
    }

    if (seasonalInfo.weather) {
      notes.push(`Weather: ${seasonalInfo.weather}`);
    }

    if (seasonalInfo.crowds) {
      notes.push(`Crowds: ${seasonalInfo.crowds}`);
    }

    return notes.join('. ');
  }

  /**
   * Check if activity matches user interests
   */
  private matchesUserInterests(activity: any, userInterests: string[]): boolean {
    if (userInterests.length === 0) return true;

    return activity.bestFor.some((interest: string) =>
      userInterests.some(
        (userInterest) =>
          userInterest.toLowerCase().includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(userInterest.toLowerCase())
      )
    );
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(
    architect: ArchitectOutput,
    gatherer: GathererOutput,
    specialist: SpecialistOutput,
    putter: PutterOutput
  ): number {
    const weights = SYNTHESIS_CONFIG.WEIGHTS;

    const architectScore = architect.confidence * weights.ARCHITECT;
    const gathererScore =
      (gatherer.sources?.length || 0) > 0 ? 0.9 * weights.GATHERER : 0.7 * weights.GATHERER;
    const specialistScore =
      specialist.expertInsights.length > 0 ? 0.85 * weights.SPECIALIST : 0.6 * weights.SPECIALIST;
    const putterScore = putter.preferences ? 0.95 * weights.PUTTER : 0.8 * weights.PUTTER;

    return Math.min(1.0, architectScore + gathererScore + specialistScore + putterScore);
  }

  /**
   * Calculate quality score for the final itinerary
   */
  private calculateQualityScore(itinerary: ItineraryData, putter: PutterOutput): number {
    let score = 0;
    let maxScore = 0;

    // Content completeness (40 points)
    maxScore += 40;
    if (itinerary.overview) score += 10;
    if (itinerary.highlights && itinerary.highlights.length > 0) score += 10;
    if (itinerary.dailyPlan && itinerary.dailyPlan.length > 0) score += 10;
    if (itinerary.budget && itinerary.budget.total > 0) score += 10;

    // Personalization (30 points)
    maxScore += 30;
    const interests = putter.preferences.interests;
    if (interests.length > 0) {
      const matchedActivities = itinerary.dailyPlan?.flatMap((day) => day.activities) || [];
      const interestMatches = matchedActivities.filter((activity) =>
        this.matchesUserInterests(activity, interests)
      ).length;
      score += Math.min(30, (interestMatches / Math.max(1, matchedActivities.length)) * 30);
    }

    // Practicality (20 points)
    maxScore += 20;
    if (itinerary.accommodations && itinerary.accommodations.length > 0) score += 7;
    if (itinerary.transportation && itinerary.transportation.length > 0) score += 7;
    if (itinerary.dining && itinerary.dining.length > 0) score += 6;

    // Quality (10 points)
    maxScore += 10;
    if (itinerary.tips && itinerary.tips.length > 0) score += 5;
    if (itinerary.confidence && itinerary.confidence > 0.8) score += 5;

    return maxScore > 0 ? score / maxScore : 0;
  }

  /**
   * Create error result
   */
  private createErrorResult(errors: string[], startTime: number): SynthesisResult {
    return {
      success: false,
      confidence: 0,
      processingTime: Date.now() - startTime,
      errors,
      warnings: [],
      metadata: {
        agentsUsed: [],
        sourcesCount: 0,
        synthesisVersion: '1.0.0',
        qualityScore: 0,
      },
    };
  }

  /**
   * Get synthesis statistics
   */
  async getSynthesisStats(): Promise<{
    totalSyntheses: number;
    averageConfidence: number;
    averageProcessingTime: number;
    successRate: number;
    commonErrors: string[];
  }> {
    // This would typically query a database or cache for statistics
    return {
      totalSyntheses: 0, // Would be tracked in production
      averageConfidence: 0, // Would be calculated from actual syntheses
      averageProcessingTime: 0, // Would be averaged from actual timings
      successRate: 0, // Would be calculated from success/failure rates
      commonErrors: [], // Would be aggregated from error logs
    };
  }

  /**
   * Health check for synthesis service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency?: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // Simple health check with mock data
      const mockArchitect: ArchitectOutput = {
        title: 'Test Itinerary',
        destination: 'Test City',
        duration: { days: 3, nights: 2 },
        travelers: { adults: 2, children: 0 },
        overview: 'Test overview',
        highlights: ['Test highlight'],
        budget: {
          total: 1000,
          currency: 'USD',
          breakdown: {
            accommodations: 400,
            transportation: 200,
            activities: 200,
            dining: 150,
            miscellaneous: 50,
          },
        },
        themes: ['test'],
        confidence: 0.9,
      };

      const result = await this.synthesizeItinerary(
        mockArchitect,
        {} as GathererOutput,
        {} as SpecialistOutput,
        {} as PutterOutput
      );

      const latency = Date.now() - startTime;

      return {
        status: 'healthy',
        latency,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Global result combiner instance
 */
export const resultCombiner = new ResultCombiner();

/**
 * Convenience functions for common synthesis operations
 */

/**
 * Synthesize complete itinerary from agent outputs
 */
export async function synthesizeItinerary(
  architect: ArchitectOutput,
  gatherer: GathererOutput,
  specialist: SpecialistOutput,
  putter: PutterOutput
): Promise<SynthesisResult> {
  return resultCombiner.synthesizeItinerary(architect, gatherer, specialist, putter);
}

/**
 * Format synthesized itinerary as text
 */
export async function formatSynthesizedItinerary(result: SynthesisResult): Promise<string> {
  if (!result.success || !result.itinerary) {
    return `Synthesis failed:\n${result.errors.join('\n')}`;
  }

  const formatted = await itineraryFormatter.formatItinerary(result.itinerary);
  return itineraryFormatter.exportAsText(formatted);
}

/**
 * Export types
 */
export type { ArchitectOutput, GathererOutput, SpecialistOutput, PutterOutput, SynthesisResult };

/**
 * Type guards and converters for serialized data
 * Handles Inngest JsonifyObject type conversions
 */
import type { ArchitectOutput } from '../ai-agents/architect-agent.js';
import type { GathererOutput } from '../ai-agents/gatherer-agent.js';
import type { SpecialistOutput } from '../ai-agents/specialist-agent.js';

/**
 * Convert JsonifyObject architecture to proper ArchitectOutput
 */
export function ensureArchitectOutput(data: any): ArchitectOutput {
  return {
    itineraryStructure: {
      totalDays: data.itineraryStructure?.totalDays || 0,
      dailyBudgetBreakdown: data.itineraryStructure?.dailyBudgetBreakdown || [],
      travelPhases: data.itineraryStructure?.travelPhases || [],
      logisticalRequirements: data.itineraryStructure?.logisticalRequirements || {
        transportation: [],
        accommodation: [],
        reservationNeeds: [],
      },
    },
    planningContext: data.planningContext || {
      tripStyle: '',
      budgetStrategy: '',
      timeOptimization: '',
      experienceGoals: [],
    },
    processingTime: data.processingTime || 0,
    tokensUsed: data.tokensUsed,
  };
}

/**
 * Convert JsonifyObject gatherer data to proper GathererOutput
 */
export function ensureGathererOutput(data: any): GathererOutput {
  return {
    destinationInfo: {
      overview: data.destinationInfo?.overview || '',
      bestTimeToVisit: data.destinationInfo?.bestTimeToVisit || '',
      localCurrency: data.destinationInfo?.localCurrency || '',
      averageCosts: data.destinationInfo?.averageCosts || {},
      culturalNotes: data.destinationInfo?.culturalNotes || [],
    },
    accommodations: data.accommodations || [],
    restaurants: data.restaurants || [],
    activities: data.activities || [],
    transportation: data.transportation || {},
    localInsights: data.localInsights || [],
    processingTime: data.processingTime || 0,
    tokensUsed: data.tokensUsed,
  };
}

/**
 * Convert JsonifyObject specialist data to proper SpecialistOutput
 */
export function ensureSpecialistOutput(data: any): SpecialistOutput {
  return {
    rankedRecommendations: {
      activities: (data.rankedRecommendations?.activities || []).map((activity: any) => ({
        id: activity.id || '',
        name: activity.name || '',
        score: activity.score || 0,
        reasoning: activity.reasoning || '',
        matchedPreferences: activity.matchedPreferences || [],
        recommendedDay: activity.recommendedDay,
      })),
      accommodations: (data.rankedRecommendations?.accommodations || []).map((acc: any) => ({
        id: acc.id || '',
        name: acc.name || '',
        score: acc.score || 0,
        reasoning: acc.reasoning || '',
        matchedPreferences: acc.matchedPreferences || [],
      })),
      restaurants: (data.rankedRecommendations?.restaurants || []).map((rest: any) => ({
        id: rest.id || '',
        name: rest.name || '',
        score: rest.score || 0,
        reasoning: rest.reasoning || '',
        matchedPreferences: rest.matchedPreferences || [],
      })),
    },
    filteredOptions: {
      removed: data.filteredOptions?.removed || [],
      alternatives: data.filteredOptions?.alternatives || [],
    },
    processingTime: data.processingTime || 0,
    tokensUsed: data.tokensUsed,
  };
}

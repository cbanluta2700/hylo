import { v4 as uuidv4 } from 'uuid';
import { EnhancedFormData } from '../types/form-data';
import { SmartQuery } from '../types/smart-query';

/**
 * Generates smart queries based on form data for multi-agent processing
 * Adapts to incomplete form data and provides fallback queries
 */
export function generateSmartQueries(formData: EnhancedFormData): SmartQuery[] {
  const { location, departDate, returnDate, adults, children, childrenAges } = formData;
  const groupSize = adults + children;
  const hasChildren = children > 0;
  const childAges = childrenAges?.join(', ') || '';

  // Defensive handling for optional sections - users may skip Travel Style entirely
  const groupType = formData.selectedGroups?.[0] || 'travelers';
  const interests = formData.selectedInterests?.join(' ') || 'sightseeing tourism';

  // Handle cases where user skips to trip nickname without travel style
  const hasMinimalData =
    !formData.travelStyleChoice || formData.travelStyleChoice === 'not-selected';
  const fallbackInterests = hasMinimalData ? 'popular attractions must-see places' : interests;

  // Specialized query templates based on actual user selections
  const queryTemplates = {
    flights: () => {
      const origin =
        formData.inclusionPreferences?.['flights']?.departureAirports || 'nearest airport';
      const cabinClass = formData.inclusionPreferences?.['flights']?.cabinClasses?.join(' ') || '';
      return {
        type: 'flights',
        query:
          `${origin} to ${location} flights ${departDate} ${returnDate} ${groupSize} passengers ${cabinClass}`.trim(),
        priority: 'high' as const,
        agent: 'gatherer' as const,
      };
    },

    accommodations: () => {
      const hotelTypes =
        formData.inclusionPreferences?.['accommodations']?.selectedTypes?.join(' ') || 'hotels';
      const specialRequests =
        formData.inclusionPreferences?.['accommodations']?.specialRequests || '';
      const familyNeeds = hasChildren ? `family rooms ${childAges} year old` : '';
      return {
        type: 'accommodations',
        query:
          `${location} ${hotelTypes} ${departDate} ${returnDate} ${groupSize} guests ${specialRequests} ${familyNeeds}`.trim(),
        priority: 'high' as const,
        agent: 'gatherer' as const,
      };
    },

    activities: () => {
      return {
        type: 'activities',
        query:
          `${location} ${fallbackInterests} ${groupType} activities ${departDate} ${groupSize} people`.trim(),
        priority: 'high' as const,
        agent: 'specialist' as const,
      };
    },

    dining: () => {
      // Multiple fallback layers for dining preferences
      const diningPreference =
        formData.travelStyleAnswers?.['dinnerChoices']?.[0] || // Travel style choice
        formData.selectedInterests?.find((i) => i.toLowerCase().includes('food')) || // Food-related interest
        formData.selectedInterests?.find((i) => i.toLowerCase().includes('culinary')) || // Culinary interest
        'local cuisine restaurants'; // Ultimate fallback

      return {
        type: 'dining',
        query: `${location} ${diningPreference} ${groupSize} people reservations`.trim(),
        priority: 'medium' as const,
        agent: 'specialist' as const,
      };
    },

    cruise: () => ({
      type: 'cruise',
      query: `cruises from ${location} ${departDate} ${returnDate} ${groupSize} passengers`,
      priority: 'high' as const,
      agent: 'gatherer' as const,
      // Special handling for cruise data
      specialSource:
        'https://www.cruisecritic.com/find-a-cruise/destination-' + encodeURIComponent(location),
    }),

    transportation: () => ({
      type: 'transportation',
      query:
        `${location} local transportation ${groupType} ${groupSize} people getting around public transit taxi`.trim(),
      priority: 'medium' as const,
      agent: 'gatherer' as const,
    }),

    general: () => {
      // Adaptive general query based on available data
      const travelContext = hasMinimalData
        ? `first time visitors essential guide`
        : `${groupType} group ${fallbackInterests}`;

      return {
        type: 'general',
        query: `${location} travel guide 2025 ${travelContext} things to do`.trim(),
        priority: 'low' as const,
        agent: 'specialist' as const,
      };
    },
  };

  // Generate queries only for selected inclusions + always include general
  const selectedQueries = (formData.selectedInclusions || [])
    .filter((inclusion) => queryTemplates[inclusion as keyof typeof queryTemplates])
    .map((inclusion) => queryTemplates[inclusion as keyof typeof queryTemplates]());

  // Always add general travel guide - works even with minimal form data
  selectedQueries.push(queryTemplates.general());

  // If user has minimal selections, add default essential queries
  if (hasMinimalData && selectedQueries.length <= 1) {
    selectedQueries.push(queryTemplates.activities());
    if (formData.adults >= 2) {
      selectedQueries.push(queryTemplates.dining());
    }
  }

  return selectedQueries;
}

/**
 * Generates a unique session ID for tracking
 */
export function generateId(): string {
  return uuidv4();
}

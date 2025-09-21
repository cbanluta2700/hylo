/**
 * Query Template Builders
 * Reusable query templates for different travel categories and agent types
 */

import { SmartQuery, QueryTemplate, QueryContext } from '../types/smart-query';

/**
 * Query Template Registry
 * Pre-defined templates for different travel categories
 */
export const QUERY_TEMPLATES: Record<string, QueryTemplate> = {
  // Flight-related queries
  flights: {
    id: 'flights-basic',
    category: 'transportation',
    template:
      '{{origin}} to {{destination}} flights {{departDate}} {{returnDate}} {{passengers}} passengers {{cabinClass}}',
    variables: ['origin', 'destination', 'departDate', 'returnDate', 'passengers', 'cabinClass'],
    agent: 'gatherer',
    priority: 'high',
  },

  flights_flexible: {
    id: 'flights-flexible',
    category: 'transportation',
    template:
      '{{destination}} flights from {{nearbyAirports}} {{departDate}} ±3 days {{passengers}} passengers {{cabinClass}}',
    variables: ['destination', 'nearbyAirports', 'departDate', 'passengers', 'cabinClass'],
    agent: 'gatherer',
    priority: 'medium',
  },

  // Accommodation-related queries
  hotels: {
    id: 'hotels-standard',
    category: 'accommodation',
    template:
      '{{destination}} {{hotelTypes}} {{checkIn}} {{checkOut}} {{guests}} guests {{specialRequests}}',
    variables: ['destination', 'hotelTypes', 'checkIn', 'checkOut', 'guests', 'specialRequests'],
    agent: 'gatherer',
    priority: 'high',
  },

  hotels_family: {
    id: 'hotels-family',
    category: 'accommodation',
    template:
      '{{destination}} family hotels with {{children}} children ages {{childAges}} {{checkIn}} {{checkOut}}',
    variables: ['destination', 'children', 'childAges', 'checkIn', 'checkOut'],
    agent: 'gatherer',
    priority: 'high',
  },

  // Activity-related queries
  activities: {
    id: 'activities-general',
    category: 'activities',
    template:
      '{{destination}} {{interests}} activities for {{groupType}} {{groupSize}} people {{dates}}',
    variables: ['destination', 'interests', 'groupType', 'groupSize', 'dates'],
    agent: 'specialist',
    priority: 'high',
  },

  activities_cultural: {
    id: 'activities-cultural',
    category: 'activities',
    template:
      '{{destination}} cultural experiences museums historical sites art galleries {{groupSize}} people',
    variables: ['destination', 'groupSize'],
    agent: 'specialist',
    priority: 'medium',
  },

  activities_adventure: {
    id: 'activities-adventure',
    category: 'activities',
    template:
      '{{destination}} adventure activities hiking outdoor sports {{groupSize}} people {{skillLevel}}',
    variables: ['destination', 'groupSize', 'skillLevel'],
    agent: 'specialist',
    priority: 'medium',
  },

  // Dining-related queries
  dining: {
    id: 'dining-general',
    category: 'dining',
    template:
      '{{destination}} {{cuisineType}} restaurants reservations for {{groupSize}} people {{dietaryRestrictions}}',
    variables: ['destination', 'cuisineType', 'groupSize', 'dietaryRestrictions'],
    agent: 'specialist',
    priority: 'medium',
  },

  dining_fine: {
    id: 'dining-fine',
    category: 'dining',
    template:
      '{{destination}} fine dining restaurants romantic dinner spots {{groupSize}} people reservations',
    variables: ['destination', 'groupSize'],
    agent: 'specialist',
    priority: 'medium',
  },

  // Transportation-related queries
  transportation: {
    id: 'transportation-local',
    category: 'transportation',
    template:
      '{{destination}} local transportation options public transit taxi rideshare {{groupSize}} people',
    variables: ['destination', 'groupSize'],
    agent: 'gatherer',
    priority: 'medium',
  },

  transportation_airport: {
    id: 'transportation-airport',
    category: 'transportation',
    template:
      '{{destination}} airport transfer options from {{airport}} to hotels {{groupSize}} people',
    variables: ['destination', 'airport', 'groupSize'],
    agent: 'gatherer',
    priority: 'high',
  },

  // Cruise-related queries
  cruises: {
    id: 'cruises-general',
    category: 'cruises',
    template:
      'cruises from {{destination}} {{departDate}} {{returnDate}} {{passengers}} passengers {{cruiseLine}}',
    variables: ['destination', 'departDate', 'returnDate', 'passengers', 'cruiseLine'],
    agent: 'gatherer',
    priority: 'high',
  },

  // General travel information
  travel_guide: {
    id: 'travel-guide',
    category: 'general',
    template: '{{destination}} travel guide 2025 {{groupType}} {{interests}} essential information',
    variables: ['destination', 'groupType', 'interests'],
    agent: 'specialist',
    priority: 'low',
  },

  weather: {
    id: 'weather-info',
    category: 'general',
    template:
      '{{destination}} weather forecast {{dates}} temperature precipitation best time to visit',
    variables: ['destination', 'dates'],
    agent: 'gatherer',
    priority: 'medium',
  },

  safety: {
    id: 'safety-info',
    category: 'general',
    template:
      '{{destination}} safety information travel advisories health precautions {{groupType}}',
    variables: ['destination', 'groupType'],
    agent: 'specialist',
    priority: 'high',
  },
};

/**
 * Query Template Engine
 * Renders templates with form data context
 */
export class QueryTemplateEngine {
  /**
   * Render a query template with form data
   */
  static render(template: QueryTemplate, context: QueryContext): string {
    let query = template.template;

    // Extract variables from context
    const variables = this.extractVariables(context);

    // Replace template variables
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      query = query.replace(new RegExp(placeholder, 'g'), value || '');
    }

    return query.trim();
  }

  /**
   * Extract variables from form data context
   */
  private static extractVariables(context: QueryContext): Record<string, string> {
    const { formData } = context;
    const groupSize = formData.adults + (formData.children || 0);
    const childAges = formData.childrenAges?.join(', ') || '';

    return {
      // Basic travel info
      destination: formData.location,
      departDate: formData.departDate,
      returnDate: formData.returnDate || '',
      dates: `${formData.departDate}${formData.returnDate ? ` to ${formData.returnDate}` : ''}`,
      checkIn: formData.departDate,
      checkOut: formData.returnDate || '',

      // Group information
      passengers: groupSize.toString(),
      guests: groupSize.toString(),
      groupSize: groupSize.toString(),
      adults: formData.adults.toString(),
      children: (formData.children || 0).toString(),
      childAges,

      // Preferences and selections
      groupType: formData.selectedGroups?.[0] || 'travelers',
      interests: formData.selectedInterests?.join(' ') || 'sightseeing tourism',
      hotelTypes:
        formData.inclusionPreferences?.['accommodations']?.selectedTypes?.join(' ') || 'hotels',
      specialRequests: formData.inclusionPreferences?.['accommodations']?.specialRequests || '',
      cabinClass: formData.inclusionPreferences?.['flights']?.cabinClasses?.join(' ') || '',
      origin:
        formData.inclusionPreferences?.['flights']?.departureAirports?.[0] || 'nearest airport',
      nearbyAirports:
        formData.inclusionPreferences?.['flights']?.departureAirports?.join(' or ') ||
        'major airports',

      // Travel style and dining
      cuisineType:
        formData.travelStyleAnswers?.['dinnerChoices']?.[0] ||
        formData.selectedInterests?.find((i: string) => i.toLowerCase().includes('food')) ||
        'local cuisine',
      dietaryRestrictions: '', // Could be expanded based on form data

      // Cruise information
      cruiseLine: 'major cruise lines',

      // Safety and practical
      skillLevel: 'beginner to intermediate', // Could be determined from form data
    };
  }

  /**
   * Validate a query template
   */
  static validateTemplate(template: QueryTemplate): boolean {
    try {
      // Check required fields
      if (!template.id || !template.template || !template.variables) {
        return false;
      }

      // Check template has all required variables
      const templateVars = template.template.match(/\{\{(\w+)\}\}/g) || [];
      const uniqueVars = [...new Set(templateVars.map((v) => v.slice(2, -2)))];

      // All template variables should be declared
      return uniqueVars.every((v) => template.variables.includes(v));
    } catch {
      return false;
    }
  }

  /**
   * Get available templates by category
   */
  static getTemplatesByCategory(category: string): QueryTemplate[] {
    return Object.values(QUERY_TEMPLATES).filter((template) => template.category === category);
  }

  /**
   * Get templates by agent type
   */
  static getTemplatesByAgent(
    agent: 'architect' | 'gatherer' | 'specialist' | 'putter'
  ): QueryTemplate[] {
    return Object.values(QUERY_TEMPLATES).filter((template) => template.agent === agent);
  }

  /**
   * Get all available templates
   */
  static getAllTemplates(): QueryTemplate[] {
    return Object.values(QUERY_TEMPLATES);
  }
}

/**
 * Query Builder Functions
 * High-level functions for building queries from templates
 */

export function buildFlightQueries(context: QueryContext): SmartQuery[] {
  const templates = QueryTemplateEngine.getTemplatesByCategory('transportation').filter((t) =>
    t.template.includes('flight')
  );

  return templates.map((template) => ({
    type: template.category,
    query: QueryTemplateEngine.render(template, context),
    priority: template.priority,
    agent: template.agent,
  }));
}

export function buildAccommodationQueries(context: QueryContext): SmartQuery[] {
  const templates = QueryTemplateEngine.getTemplatesByCategory('accommodation');
  const { formData } = context;
  const hasChildren = (formData.children || 0) > 0;

  // Filter templates based on form data
  const relevantTemplates = hasChildren
    ? templates.filter((t) => t.id.includes('family'))
    : templates.filter((t) => !t.id.includes('family'));

  return relevantTemplates.map((template) => ({
    type: template.category,
    query: QueryTemplateEngine.render(template, context),
    priority: template.priority,
    agent: template.agent,
  }));
}

export function buildActivityQueries(context: QueryContext): SmartQuery[] {
  const templates = QueryTemplateEngine.getTemplatesByCategory('activities');
  const { formData } = context;

  // Select templates based on interests
  const interests = formData.selectedInterests || [];
  let relevantTemplates = [templates.find((t) => t.id === 'activities-general')!];

  if (
    interests.some(
      (i: string) => i.toLowerCase().includes('culture') || i.toLowerCase().includes('museum')
    )
  ) {
    relevantTemplates.push(templates.find((t) => t.id === 'activities-cultural')!);
  }

  if (
    interests.some(
      (i: string) => i.toLowerCase().includes('adventure') || i.toLowerCase().includes('hiking')
    )
  ) {
    relevantTemplates.push(templates.find((t) => t.id === 'activities-adventure')!);
  }

  return relevantTemplates.filter(Boolean).map((template) => ({
    type: template.category,
    query: QueryTemplateEngine.render(template, context),
    priority: template.priority,
    agent: template.agent,
  }));
}

export function buildDiningQueries(context: QueryContext): SmartQuery[] {
  const templates = QueryTemplateEngine.getTemplatesByCategory('dining');
  const { formData } = context;

  // Select templates based on dining preferences
  const dinnerChoices = formData.travelStyleAnswers?.['dinnerChoices'] || [];
  let relevantTemplates = [templates.find((t) => t.id === 'dining-general')!];

  if (
    dinnerChoices.some(
      (choice: string) =>
        choice.toLowerCase().includes('fine') || choice.toLowerCase().includes('romantic')
    )
  ) {
    relevantTemplates.push(templates.find((t) => t.id === 'dining-fine')!);
  }

  return relevantTemplates.filter(Boolean).map((template) => ({
    type: template.category,
    query: QueryTemplateEngine.render(template, context),
    priority: template.priority,
    agent: template.agent,
  }));
}

/**
 * Validation Rules:
 * - Template variables must be declared in variables array
 * - Template must have valid id, category, and agent
 * - Context must contain formData
 * - Rendered queries should not be empty
 */

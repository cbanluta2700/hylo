/**
 * Fallback Handlers for Incomplete Form Data
 * Handles edge cases and provides sensible defaults when form data is incomplete
 */

import { EnhancedFormData } from '../types/form-data';
import { SmartQuery, QueryContext } from '../types/smart-query';

/**
 * Form Data Completeness Assessment
 */
export interface FormCompleteness {
  score: number; // 0-1 scale
  missingFields: string[];
  completenessLevel: 'minimal' | 'basic' | 'good' | 'comprehensive';
  recommendations: string[];
}

/**
 * Assess form data completeness
 */
export function assessFormCompleteness(formData: EnhancedFormData): FormCompleteness {
  const missingFields: string[] = [];
  let score = 0;
  const maxScore = 10;

  // Required fields (2 points each)
  if (!formData.location || formData.location.trim() === '') {
    missingFields.push('destination');
  } else {
    score += 2;
  }

  if (!formData.departDate) {
    missingFields.push('departure date');
  } else {
    score += 2;
  }

  if (formData.adults < 1) {
    missingFields.push('number of adults');
  } else {
    score += 2;
  }

  // Optional but important fields (1 point each)
  if (!formData.returnDate) {
    missingFields.push('return date');
  } else {
    score += 1;
  }

  if (!formData.selectedInterests || formData.selectedInterests.length === 0) {
    missingFields.push('travel interests');
  } else {
    score += 1;
  }

  if (!formData.selectedGroups || formData.selectedGroups.length === 0) {
    missingFields.push('group type');
  } else {
    score += 1;
  }

  if (!formData.budget || formData.budget <= 0) {
    missingFields.push('budget');
  } else {
    score += 1;
  }

  // Determine completeness level
  const normalizedScore = score / maxScore;
  let completenessLevel: FormCompleteness['completenessLevel'];
  let recommendations: string[] = [];

  if (normalizedScore >= 0.8) {
    completenessLevel = 'comprehensive';
    recommendations = ['Great! Your form is very complete.'];
  } else if (normalizedScore >= 0.6) {
    completenessLevel = 'good';
    recommendations = ['Consider adding more details for better recommendations.'];
  } else if (normalizedScore >= 0.3) {
    completenessLevel = 'basic';
    recommendations = [
      'Add travel interests for more personalized recommendations.',
      'Include budget information for better price matching.',
      'Specify group type for appropriate activity suggestions.',
    ];
  } else {
    completenessLevel = 'minimal';
    recommendations = [
      'Please provide destination and dates for basic recommendations.',
      'Add number of travelers for appropriate suggestions.',
      'Include interests and budget when possible for better results.',
    ];
  }

  return {
    score: normalizedScore,
    missingFields,
    completenessLevel,
    recommendations,
  };
}

/**
 * Generate fallback queries for minimal form data
 */
export function generateFallbackQueries(formData: EnhancedFormData): SmartQuery[] {
  const queries: SmartQuery[] = [];
  const completeness = assessFormCompleteness(formData);

  // Always provide basic travel guide
  if (formData.location) {
    queries.push({
      type: 'general',
      query: `${formData.location} travel guide 2025 essential information`,
      priority: 'low',
      agent: 'specialist',
    });
  }

  // Add basic queries based on available data
  if (completeness.completenessLevel === 'minimal') {
    if (formData.location) {
      queries.push({
        type: 'activities',
        query: `${formData.location} popular attractions tourist destinations`,
        priority: 'medium',
        agent: 'gatherer',
      });
    }
  } else if (completeness.completenessLevel === 'basic') {
    // Add more specific queries for basic completeness
    if (formData.location && formData.departDate) {
      const groupSize = formData.adults + (formData.children || 0);
      queries.push({
        type: 'accommodations',
        query: `${formData.location} hotels accommodations ${formData.departDate} ${groupSize} people`,
        priority: 'high',
        agent: 'gatherer',
      });
    }
  }

  return queries;
}

/**
 * Enhance incomplete form data with sensible defaults
 */
export function enhanceFormData(formData: EnhancedFormData): EnhancedFormData {
  const enhanced = { ...formData };

  // Add default values for missing optional fields
  if (!enhanced.returnDate && enhanced.departDate) {
    // Default to 7-day trip if no return date
    const departDate = new Date(enhanced.departDate);
    const returnDate = new Date(departDate);
    returnDate.setDate(returnDate.getDate() + 7);
    enhanced.returnDate = returnDate.toISOString().split('T')[0];
  }

  if (!enhanced.selectedInterests || enhanced.selectedInterests.length === 0) {
    enhanced.selectedInterests = ['sightseeing', 'tourism'];
  }

  if (!enhanced.selectedGroups || enhanced.selectedGroups.length === 0) {
    enhanced.selectedGroups = ['travelers'];
  }

  if (!enhanced.budget || enhanced.budget <= 0) {
    enhanced.budget = 3000; // Default budget
    enhanced.currency = enhanced.currency || 'USD';
  }

  if (!enhanced.children) {
    enhanced.children = 0;
  }

  if (!enhanced.childrenAges) {
    enhanced.childrenAges = [];
  }

  // Add AI preferences defaults
  if (!enhanced.aiPreferences) {
    enhanced.aiPreferences = {
      creativityLevel: 'balanced',
      localInsights: true,
      realTimeUpdates: true,
      contentDepth: 'detailed',
    };
  }

  // Add session ID if missing
  if (!enhanced.sessionId) {
    enhanced.sessionId = generateSessionId();
  }

  return enhanced;
}

/**
 * Generate contextual queries based on form completeness
 */
export function generateContextualQueries(context: QueryContext): SmartQuery[] {
  const { formData } = context;
  const completeness = assessFormCompleteness(formData);
  const queries: SmartQuery[] = [];

  // Base queries that work with any level of completeness
  if (formData.location) {
    queries.push({
      type: 'general',
      query: `${formData.location} travel guide 2025`,
      priority: 'low',
      agent: 'specialist',
    });

    // Weather information is always useful
    if (formData.departDate) {
      queries.push({
        type: 'weather',
        query: `${formData.location} weather forecast ${formData.departDate}`,
        priority: 'medium',
        agent: 'gatherer',
      });
    }
  }

  // Add queries based on completeness level
  switch (completeness.completenessLevel) {
    case 'minimal':
      queries.push(...generateMinimalQueries(formData));
      break;
    case 'basic':
      queries.push(...generateBasicQueries(formData));
      break;
    case 'good':
      queries.push(...generateGoodQueries(formData));
      break;
    case 'comprehensive':
      queries.push(...generateComprehensiveQueries(formData));
      break;
  }

  return queries;
}

/**
 * Generate queries for minimal form data
 */
function generateMinimalQueries(formData: EnhancedFormData): SmartQuery[] {
  const queries: SmartQuery[] = [];

  if (formData.location) {
    // Basic attraction search
    queries.push({
      type: 'activities',
      query: `${formData.location} top attractions must-see places`,
      priority: 'high',
      agent: 'gatherer',
    });

    // Local transportation
    queries.push({
      type: 'transportation',
      query: `${formData.location} getting around public transportation`,
      priority: 'medium',
      agent: 'gatherer',
    });
  }

  return queries;
}

/**
 * Generate queries for basic form data
 */
function generateBasicQueries(formData: EnhancedFormData): SmartQuery[] {
  const queries: SmartQuery[] = [];
  const groupSize = formData.adults + (formData.children || 0);

  if (formData.location && formData.departDate) {
    // Accommodation search
    queries.push({
      type: 'accommodations',
      query: `${formData.location} hotels accommodations ${formData.departDate} ${groupSize} people`,
      priority: 'high',
      agent: 'gatherer',
    });

    // Basic activities
    const interests = formData.selectedInterests?.join(' ') || 'sightseeing';
    queries.push({
      type: 'activities',
      query: `${formData.location} ${interests} activities ${groupSize} people`,
      priority: 'high',
      agent: 'specialist',
    });
  }

  return queries;
}

/**
 * Generate queries for good form data
 */
function generateGoodQueries(formData: EnhancedFormData): SmartQuery[] {
  const queries: SmartQuery[] = [];
  const groupSize = formData.adults + (formData.children || 0);
  const interests = formData.selectedInterests?.join(' ') || 'sightseeing';
  const groupType = formData.selectedGroups?.[0] || 'travelers';

  if (formData.location && formData.departDate && formData.returnDate) {
    // More specific accommodation
    queries.push({
      type: 'accommodations',
      query: `${formData.location} ${groupType} hotels ${formData.departDate} to ${formData.returnDate} ${groupSize} people`,
      priority: 'high',
      agent: 'gatherer',
    });

    // Dining recommendations
    queries.push({
      type: 'dining',
      query: `${formData.location} restaurants ${interests} dining ${groupSize} people`,
      priority: 'medium',
      agent: 'specialist',
    });

    // Transportation between dates
    queries.push({
      type: 'transportation',
      query: `${formData.location} transportation options ${groupType} ${formData.departDate} to ${formData.returnDate}`,
      priority: 'medium',
      agent: 'gatherer',
    });
  }

  return queries;
}

/**
 * Generate queries for comprehensive form data
 */
function generateComprehensiveQueries(formData: EnhancedFormData): SmartQuery[] {
  const queries: SmartQuery[] = [];
  const groupSize = formData.adults + (formData.children || 0);
  const interests = formData.selectedInterests?.join(' ') || 'sightseeing';
  const groupType = formData.selectedGroups?.[0] || 'travelers';

  // All comprehensive queries
  if (formData.location && formData.departDate && formData.returnDate) {
    // Detailed accommodation with preferences
    const hotelPrefs =
      formData.inclusionPreferences?.['accommodations']?.selectedTypes?.join(' ') || 'hotels';
    queries.push({
      type: 'accommodations',
      query: `${formData.location} ${hotelPrefs} for ${groupType} ${formData.departDate} to ${formData.returnDate} ${groupSize} people`,
      priority: 'high',
      agent: 'gatherer',
    });

    // Specific dining based on preferences
    const diningPrefs = formData.travelStyleAnswers?.['dinnerChoices']?.[0] || 'local cuisine';
    queries.push({
      type: 'dining',
      query: `${formData.location} ${diningPrefs} restaurants reservations ${groupSize} people`,
      priority: 'medium',
      agent: 'specialist',
    });

    // Flight information if available
    if (formData.inclusionPreferences?.['flights']?.departureAirports) {
      const origin = formData.inclusionPreferences['flights'].departureAirports[0];
      queries.push({
        type: 'flights',
        query: `${origin} to ${formData.location} flights ${formData.departDate} ${groupSize} passengers`,
        priority: 'high',
        agent: 'gatherer',
      });
    }

    // Cultural/interest-specific activities
    queries.push({
      type: 'activities',
      query: `${formData.location} ${interests} experiences ${groupType} ${formData.departDate} to ${formData.returnDate}`,
      priority: 'high',
      agent: 'specialist',
    });

    // Safety and practical information
    queries.push({
      type: 'safety',
      query: `${formData.location} travel safety health precautions ${groupType}`,
      priority: 'high',
      agent: 'specialist',
    });
  }

  return queries;
}

/**
 * Validate enhanced form data
 */
export function validateEnhancedFormData(formData: EnhancedFormData): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!formData.location || formData.location.trim() === '') {
    errors.push('Destination is required');
  }

  if (!formData.departDate) {
    errors.push('Departure date is required');
  }

  if (!formData.adults || formData.adults < 1) {
    errors.push('At least 1 adult is required');
  }

  if (!formData.sessionId) {
    errors.push('Session ID is required');
  }

  // Optional field warnings
  if (!formData.returnDate) {
    warnings.push('Return date not specified - assuming 7-day trip');
  }

  if (!formData.selectedInterests || formData.selectedInterests.length === 0) {
    warnings.push('No travel interests specified - using general recommendations');
  }

  if (!formData.budget || formData.budget <= 0) {
    warnings.push('Budget not specified - using default pricing');
  }

  // Cross-field validation
  if (formData.children && formData.children > 0) {
    if (!formData.childrenAges || formData.childrenAges.length !== formData.children) {
      errors.push('Children ages must be specified for each child');
    }
  }

  if (formData.returnDate && formData.departDate) {
    const depart = new Date(formData.departDate);
    const returnD = new Date(formData.returnDate);
    if (returnD <= depart) {
      errors.push('Return date must be after departure date');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validation Rules:
 * - Form completeness score between 0 and 1
 * - Missing fields array should be populated based on actual missing data
 * - Enhanced form data should have sensible defaults for all optional fields
 * - Validation should catch cross-field inconsistencies
 * - Session ID should be unique and properly formatted
 */

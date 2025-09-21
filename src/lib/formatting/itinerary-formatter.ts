/**
 * Structured Itinerary Formatting
 * Comprehensive formatting system for AI-generated travel itineraries
 */

import { boxFormatter } from './box-formatter';
import { summaryFormatter } from './summary-formatter';
import { dailyFormatter } from './daily-formatter';

/**
 * Itinerary formatting configuration
 */
export const ITINERARY_CONFIG = {
  // Layout settings
  MAX_LINE_LENGTH: 80,
  BOX_WIDTH: 78,
  SECTION_SPACING: 2,

  // Content structure
  SECTIONS: {
    HEADER: 'header',
    SUMMARY: 'summary',
    OVERVIEW: 'overview',
    DAILY_BREAKDOWN: 'daily-breakdown',
    ACCOMMODATIONS: 'accommodations',
    TRANSPORTATION: 'transportation',
    ACTIVITIES: 'activities',
    DINING: 'dining',
    BUDGET: 'budget',
    TIPS: 'tips',
    FOOTER: 'footer',
  },

  // Styling
  BOX_STYLES: {
    HEADER: 'double',
    SUMMARY: 'single',
    OVERVIEW: 'single',
    DAILY_BREAKDOWN: 'double',
    ACCOMMODATIONS: 'single',
    TRANSPORTATION: 'single',
    ACTIVITIES: 'single',
    DINING: 'single',
    BUDGET: 'single',
    TIPS: 'single',
    FOOTER: 'double',
  },

  // Content markers
  MARKERS: {
    DAY: '📅',
    LOCATION: '📍',
    TIME: '🕐',
    ACTIVITY: '🎯',
    FOOD: '🍽️',
    HOTEL: '🏨',
    TRANSPORT: '🚗',
    MONEY: '💰',
    TIP: '💡',
    WARNING: '⚠️',
    CHECK: '✅',
    STAR: '⭐',
  },

  // Formatting options
  INCLUDE_EMOJIS: true,
  INCLUDE_BOXES: true,
  COMPACT_MODE: false,
  RICH_TEXT: true,
} as const;

/**
 * Formatted itinerary interface
 */
export interface FormattedItinerary {
  title: string;
  destination: string;
  duration: string;
  travelers: string;
  budget: string;
  sections: FormattedSection[];
  metadata: {
    generatedAt: string;
    version: string;
    confidence: number;
    processingTime: number;
  };
}

/**
 * Formatted section interface
 */
export interface FormattedSection {
  id: string;
  title: string;
  content: string;
  priority: number;
  collapsible?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Itinerary data interface
 */
export interface ItineraryData {
  // Basic info
  title: string;
  destination: string;
  duration: {
    days: number;
    nights: number;
    startDate: string;
    endDate: string;
  };
  travelers: {
    adults: number;
    children: number;
    total: number;
  };

  // Content sections
  overview?: string;
  highlights?: string[];
  dailyPlan?: DailyPlan[];
  accommodations?: Accommodation[];
  transportation?: Transportation[];
  activities?: Activity[];
  dining?: Dining[];
  budget?: BudgetInfo;
  tips?: Tip[];
  notes?: string;

  // Metadata
  generatedAt?: string;
  version?: string;
  confidence?: number;
  processingTime?: number;
}

/**
 * Daily plan interface
 */
export interface DailyPlan {
  day: number;
  date: string;
  title: string;
  theme?: string;
  activities: Activity[];
  meals: Meal[];
  transportation?: Transportation[];
  accommodation?: Accommodation;
  notes?: string;
}

/**
 * Activity interface
 */
export interface Activity {
  id: string;
  name: string;
  description: string;
  location: string;
  duration: string;
  time?: string;
  cost?: number;
  bookingRequired?: boolean;
  category: string;
  rating?: number;
  reviews?: number;
}

/**
 * Accommodation interface
 */
export interface Accommodation {
  id: string;
  name: string;
  type: string;
  location: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  cost: number;
  rating?: number;
  amenities: string[];
  description?: string;
  bookingUrl?: string;
}

/**
 * Transportation interface
 */
export interface Transportation {
  id: string;
  type: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration: string;
  cost: number;
  provider: string;
  bookingReference?: string;
  notes?: string;
}

/**
 * Dining interface
 */
export interface Dining {
  id: string;
  name: string;
  type: string;
  cuisine: string;
  location: string;
  time: string;
  cost: number;
  rating?: number;
  reservationRequired?: boolean;
  description?: string;
}

/**
 * Meal interface
 */
export interface Meal {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  location: string;
  time: string;
  cost?: number;
  notes?: string;
}

/**
 * Budget info interface
 */
export interface BudgetInfo {
  total: number;
  breakdown: {
    accommodations: number;
    transportation: number;
    activities: number;
    dining: number;
    miscellaneous: number;
  };
  currency: string;
  perPerson?: number;
  notes?: string;
}

/**
 * Tip interface
 */
export interface Tip {
  category: string;
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Itinerary Formatter
 * Main formatter class for creating structured, beautiful itineraries
 */
export class ItineraryFormatter {
  private config: typeof ITINERARY_CONFIG;

  constructor(config?: Partial<typeof ITINERARY_CONFIG>) {
    this.config = { ...ITINERARY_CONFIG, ...config };
  }

  /**
   * Format complete itinerary
   */
  async formatItinerary(data: ItineraryData): Promise<FormattedItinerary> {
    const sections: FormattedSection[] = [];

    // Header section
    sections.push(this.formatHeader(data));

    // Summary section
    sections.push(this.formatSummary(data));

    // Overview section
    if (data.overview) {
      sections.push(this.formatOverview(data));
    }

    // Daily breakdown
    if (data.dailyPlan && data.dailyPlan.length > 0) {
      sections.push(await this.formatDailyBreakdown(data));
    }

    // Accommodations
    if (data.accommodations && data.accommodations.length > 0) {
      sections.push(this.formatAccommodations(data));
    }

    // Transportation
    if (data.transportation && data.transportation.length > 0) {
      sections.push(this.formatTransportation(data));
    }

    // Activities
    if (data.activities && data.activities.length > 0) {
      sections.push(this.formatActivities(data));
    }

    // Dining
    if (data.dining && data.dining.length > 0) {
      sections.push(this.formatDining(data));
    }

    // Budget
    if (data.budget) {
      sections.push(this.formatBudget(data));
    }

    // Tips
    if (data.tips && data.tips.length > 0) {
      sections.push(this.formatTips(data));
    }

    // Footer
    sections.push(this.formatFooter(data));

    return {
      title: data.title,
      destination: data.destination,
      duration: `${data.duration.days} days, ${data.duration.nights} nights`,
      travelers: `${data.travelers.total} travelers (${data.travelers.adults} adults, ${data.travelers.children} children)`,
      budget: data.budget ? `${data.budget.currency}${data.budget.total}` : 'Not specified',
      sections: sections.sort((a, b) => a.priority - b.priority),
      metadata: {
        generatedAt: data.generatedAt || new Date().toISOString(),
        version: data.version || '1.0.0',
        confidence: data.confidence || 0.8,
        processingTime: data.processingTime || 0,
      },
    };
  }

  /**
   * Format header section
   */
  private formatHeader(data: ItineraryData): FormattedSection {
    const content = [
      `🎯 ${data.title}`,
      `📍 ${data.destination}`,
      `📅 ${data.duration.days} Days, ${data.duration.nights} Nights`,
      `👥 ${data.travelers.total} Travelers`,
      data.budget ? `💰 ${data.budget.currency}${data.budget.total} Total Budget` : '',
    ]
      .filter(Boolean)
      .join('\n');

    return {
      id: this.config.SECTIONS.HEADER,
      title: 'Trip Overview',
      content: this.config.INCLUDE_BOXES
        ? boxFormatter.createBox(content, 'Trip Overview', this.config.BOX_STYLES.HEADER)
        : content,
      priority: 1,
    };
  }

  /**
   * Format summary section
   */
  private formatSummary(data: ItineraryData): FormattedSection {
    const summary = summaryFormatter.createSummary(data);

    return {
      id: this.config.SECTIONS.SUMMARY,
      title: 'Trip Summary',
      content: this.config.INCLUDE_BOXES
        ? boxFormatter.createBox(summary, 'Trip Summary', this.config.BOX_STYLES.SUMMARY)
        : summary,
      priority: 2,
    };
  }

  /**
   * Format overview section
   */
  private formatOverview(data: ItineraryData): FormattedSection {
    return {
      id: this.config.SECTIONS.OVERVIEW,
      title: 'Trip Overview',
      content: this.config.INCLUDE_BOXES
        ? boxFormatter.createBox(data.overview!, 'Trip Overview', this.config.BOX_STYLES.OVERVIEW)
        : data.overview!,
      priority: 3,
    };
  }

  /**
   * Format daily breakdown
   */
  private async formatDailyBreakdown(data: ItineraryData): Promise<FormattedSection> {
    const dailyContent = await dailyFormatter.formatDailyPlans(data.dailyPlan!);

    return {
      id: this.config.SECTIONS.DAILY_BREAKDOWN,
      title: 'Daily Itinerary',
      content: this.config.INCLUDE_BOXES
        ? boxFormatter.createBox(
            dailyContent,
            'Daily Itinerary',
            this.config.BOX_STYLES.DAILY_BREAKDOWN
          )
        : dailyContent,
      priority: 4,
    };
  }

  /**
   * Format accommodations section
   */
  private formatAccommodations(data: ItineraryData): FormattedSection {
    const content = data
      .accommodations!.map((acc) => {
        const amenities = acc.amenities.slice(0, 5).join(', ');
        const rating = acc.rating ? ` ⭐${acc.rating}/5` : '';

        return [
          `🏨 ${acc.name}${rating}`,
          `📍 ${acc.location}`,
          `📅 ${acc.checkIn} - ${acc.checkOut} (${acc.nights} nights)`,
          `💰 ${data.budget?.currency || '$'}${acc.cost}`,
          acc.amenities.length > 0 ? `✨ ${amenities}` : '',
          acc.description ? `📝 ${acc.description}` : '',
        ]
          .filter(Boolean)
          .join('\n');
      })
      .join('\n\n');

    return {
      id: this.config.SECTIONS.ACCOMMODATIONS,
      title: 'Accommodations',
      content: this.config.INCLUDE_BOXES
        ? boxFormatter.createBox(content, 'Accommodations', this.config.BOX_STYLES.ACCOMMODATIONS)
        : content,
      priority: 5,
    };
  }

  /**
   * Format transportation section
   */
  private formatTransportation(data: ItineraryData): FormattedSection {
    const content = data
      .transportation!.map((trans) =>
        [
          `🚗 ${trans.type}: ${trans.from} → ${trans.to}`,
          `🕐 ${trans.departure} - ${trans.arrival} (${trans.duration})`,
          `💰 ${data.budget?.currency || '$'}${trans.cost}`,
          `🏢 ${trans.provider}`,
          trans.bookingReference ? `📋 Booking: ${trans.bookingReference}` : '',
          trans.notes ? `📝 ${trans.notes}` : '',
        ]
          .filter(Boolean)
          .join('\n')
      )
      .join('\n\n');

    return {
      id: this.config.SECTIONS.TRANSPORTATION,
      title: 'Transportation',
      content: this.config.INCLUDE_BOXES
        ? boxFormatter.createBox(content, 'Transportation', this.config.BOX_STYLES.TRANSPORTATION)
        : content,
      priority: 6,
    };
  }

  /**
   * Format activities section
   */
  private formatActivities(data: ItineraryData): FormattedSection {
    const content = data
      .activities!.map((activity) => {
        const rating = activity.rating ? ` ⭐${activity.rating}/5` : '';
        const reviews = activity.reviews ? ` (${activity.reviews} reviews)` : '';

        return [
          `🎯 ${activity.name}${rating}${reviews}`,
          `📍 ${activity.location}`,
          `🕐 ${activity.time || 'Flexible timing'} - ${activity.duration}`,
          activity.cost ? `💰 ${data.budget?.currency || '$'}${activity.cost}` : '',
          `🏷️ ${activity.category}`,
          activity.bookingRequired ? '📋 Booking required' : '✅ No booking needed',
          `📝 ${activity.description}`,
        ]
          .filter(Boolean)
          .join('\n');
      })
      .join('\n\n');

    return {
      id: this.config.SECTIONS.ACTIVITIES,
      title: 'Activities & Attractions',
      content: this.config.INCLUDE_BOXES
        ? boxFormatter.createBox(
            content,
            'Activities & Attractions',
            this.config.BOX_STYLES.ACTIVITIES
          )
        : content,
      priority: 7,
    };
  }

  /**
   * Format dining section
   */
  private formatDining(data: ItineraryData): FormattedSection {
    const content = data
      .dining!.map((dining) => {
        const rating = dining.rating ? ` ⭐${dining.rating}/5` : '';

        return [
          `🍽️ ${dining.name}${rating}`,
          `🏷️ ${dining.type} - ${dining.cuisine}`,
          `📍 ${dining.location}`,
          `🕐 ${dining.time}`,
          `💰 ${data.budget?.currency || '$'}${dining.cost}`,
          dining.reservationRequired ? '📋 Reservation recommended' : '✅ Walk-in available',
          dining.description ? `📝 ${dining.description}` : '',
        ]
          .filter(Boolean)
          .join('\n');
      })
      .join('\n\n');

    return {
      id: this.config.SECTIONS.DINING,
      title: 'Dining & Cuisine',
      content: this.config.INCLUDE_BOXES
        ? boxFormatter.createBox(content, 'Dining & Cuisine', this.config.BOX_STYLES.DINING)
        : content,
      priority: 8,
    };
  }

  /**
   * Format budget section
   */
  private formatBudget(data: ItineraryData): FormattedSection {
    const budget = data.budget!;
    const currency = budget.currency;

    const content = [
      `💰 Total Budget: ${currency}${budget.total}`,
      budget.perPerson ? `👤 Per Person: ${currency}${budget.perPerson}` : '',
      '',
      'Breakdown:',
      `🏨 Accommodations: ${currency}${budget.breakdown.accommodations}`,
      `🚗 Transportation: ${currency}${budget.breakdown.transportation}`,
      `🎯 Activities: ${currency}${budget.breakdown.activities}`,
      `🍽️ Dining: ${currency}${budget.breakdown.dining}`,
      `📦 Miscellaneous: ${currency}${budget.breakdown.miscellaneous}`,
      '',
      budget.notes ? `📝 ${budget.notes}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    return {
      id: this.config.SECTIONS.BUDGET,
      title: 'Budget Breakdown',
      content: this.config.INCLUDE_BOXES
        ? boxFormatter.createBox(content, 'Budget Breakdown', this.config.BOX_STYLES.BUDGET)
        : content,
      priority: 9,
    };
  }

  /**
   * Format tips section
   */
  private formatTips(data: ItineraryData): FormattedSection {
    const tips = data.tips!.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    const content = tips
      .map((tip) => {
        const marker = tip.priority === 'high' ? '⚠️' : tip.priority === 'medium' ? '💡' : 'ℹ️';
        return `${marker} ${tip.title}\n${tip.content}`;
      })
      .join('\n\n');

    return {
      id: this.config.SECTIONS.TIPS,
      title: 'Travel Tips & Advice',
      content: this.config.INCLUDE_BOXES
        ? boxFormatter.createBox(content, 'Travel Tips & Advice', this.config.BOX_STYLES.TIPS)
        : content,
      priority: 10,
    };
  }

  /**
   * Format footer section
   */
  private formatFooter(data: ItineraryData): FormattedSection {
    const generatedAt = new Date(data.generatedAt || Date.now());
    const content = [
      `Generated on ${generatedAt.toLocaleDateString()} at ${generatedAt.toLocaleTimeString()}`,
      `Version ${data.version || '1.0.0'}`,
      `Confidence: ${Math.round((data.confidence || 0.8) * 100)}%`,
      data.processingTime ? `Processing time: ${data.processingTime}ms` : '',
      '',
      '🎉 Safe travels and enjoy your adventure!',
    ]
      .filter(Boolean)
      .join('\n');

    return {
      id: this.config.SECTIONS.FOOTER,
      title: 'Footer',
      content: this.config.INCLUDE_BOXES
        ? boxFormatter.createBox(content, '', this.config.BOX_STYLES.FOOTER)
        : content,
      priority: 11,
    };
  }

  /**
   * Export itinerary as plain text
   */
  exportAsText(itinerary: FormattedItinerary): string {
    return itinerary.sections
      .map(
        (section) => `${section.title}\n${'='.repeat(section.title.length)}\n\n${section.content}`
      )
      .join('\n\n' + '='.repeat(80) + '\n\n');
  }

  /**
   * Export itinerary as markdown
   */
  exportAsMarkdown(itinerary: FormattedItinerary): string {
    return itinerary.sections
      .map((section) => `## ${section.title}\n\n${section.content}`)
      .join('\n\n---\n\n');
  }

  /**
   * Export itinerary as JSON
   */
  exportAsJSON(itinerary: FormattedItinerary): string {
    return JSON.stringify(itinerary, null, 2);
  }
}

/**
 * Global itinerary formatter instance
 */
export const itineraryFormatter = new ItineraryFormatter();

/**
 * Convenience functions for common formatting operations
 */

/**
 * Format itinerary data
 */
export async function formatItinerary(data: ItineraryData): Promise<FormattedItinerary> {
  return itineraryFormatter.formatItinerary(data);
}

/**
 * Export formatted itinerary as text
 */
export function exportItineraryAsText(itinerary: FormattedItinerary): string {
  return itineraryFormatter.exportAsText(itinerary);
}

/**
 * Export formatted itinerary as markdown
 */
export function exportItineraryAsMarkdown(itinerary: FormattedItinerary): string {
  return itineraryFormatter.exportAsMarkdown(itinerary);
}

/**
 * Export formatted itinerary as JSON
 */
export function exportItineraryAsJSON(itinerary: FormattedItinerary): string {
  return itineraryFormatter.exportAsJSON(itinerary);
}

/**
 * Export types
 */
export type {
  FormattedItinerary,
  FormattedSection,
  ItineraryData,
  DailyPlan,
  Activity,
  Accommodation,
  Transportation,
  Dining,
  Meal,
  BudgetInfo,
  Tip,
};

/**
 * Daily Itinerary Section Builder
 * Formats daily plans and activities into structured, readable sections
 */

import { boxFormatter } from './box-formatter';
import { DailyPlan, Activity, Meal, Accommodation, Transportation } from './itinerary-formatter';

/**
 * Daily formatting configuration
 */
export const DAILY_CONFIG = {
  // Time formatting
  TIME_FORMAT: 'HH:MM',
  DATE_FORMAT: 'MMM DD, YYYY',

  // Section markers
  DAY_MARKER: '📅',
  MORNING_MARKER: '🌅',
  AFTERNOON_MARKER: '☀️',
  EVENING_MARKER: '🌙',
  ACTIVITY_MARKER: '🎯',
  MEAL_MARKER: '🍽️',
  TRANSPORT_MARKER: '🚗',
  HOTEL_MARKER: '🏨',

  // Layout settings
  MAX_ACTIVITIES_PER_DAY: 6,
  MAX_DESCRIPTION_LENGTH: 150,
  INDENT_SIZE: 2,

  // Time slots
  TIME_SLOTS: {
    MORNING: { start: 6, end: 12, label: 'Morning' },
    AFTERNOON: { start: 12, end: 18, label: 'Afternoon' },
    EVENING: { start: 18, end: 24, label: 'Evening' },
    NIGHT: { start: 0, end: 6, label: 'Night' },
  },

  // Styling
  DAY_HEADER_STYLE: 'double',
  ACTIVITY_STYLE: 'single',
  MEAL_STYLE: 'single',
} as const;

/**
 * Daily Formatter
 * Creates beautifully formatted daily itinerary sections
 */
export class DailyFormatter {
  /**
   * Format all daily plans
   */
  async formatDailyPlans(dailyPlans: DailyPlan[]): Promise<string> {
    if (!dailyPlans || dailyPlans.length === 0) {
      return 'No daily itinerary available.';
    }

    const formattedDays: string[] = [];

    for (const plan of dailyPlans) {
      const dayContent = await this.formatDailyPlan(plan);
      formattedDays.push(dayContent);
    }

    return formattedDays.join('\n\n' + '='.repeat(80) + '\n\n');
  }

  /**
   * Format a single daily plan
   */
  async formatDailyPlan(plan: DailyPlan): Promise<string> {
    const sections: string[] = [];

    // Day header
    sections.push(this.formatDayHeader(plan));

    // Morning activities
    const morningActivities = this.filterActivitiesByTime(plan.activities, 'MORNING');
    if (morningActivities.length > 0) {
      sections.push(this.formatTimeSlot(plan, morningActivities, 'MORNING'));
    }

    // Afternoon activities
    const afternoonActivities = this.filterActivitiesByTime(plan.activities, 'AFTERNOON');
    if (afternoonActivities.length > 0) {
      sections.push(this.formatTimeSlot(plan, afternoonActivities, 'AFTERNOON'));
    }

    // Evening activities
    const eveningActivities = this.filterActivitiesByTime(plan.activities, 'EVENING');
    if (eveningActivities.length > 0) {
      sections.push(this.formatTimeSlot(plan, eveningActivities, 'EVENING'));
    }

    // Meals
    if (plan.meals && plan.meals.length > 0) {
      sections.push(this.formatMeals(plan.meals));
    }

    // Transportation
    if (plan.transportation && plan.transportation.length > 0) {
      sections.push(this.formatTransportation(plan.transportation));
    }

    // Accommodation
    if (plan.accommodation) {
      sections.push(this.formatAccommodation(plan.accommodation));
    }

    // Notes
    if (plan.notes) {
      sections.push(this.formatNotes(plan.notes));
    }

    return sections.join('\n\n');
  }

  /**
   * Format day header
   */
  private formatDayHeader(plan: DailyPlan): string {
    const date = new Date(plan.date);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const header = `${DAILY_CONFIG.DAY_MARKER} Day ${plan.day}: ${plan.title}\n${formattedDate}`;

    if (plan.theme) {
      return `${header}\nTheme: ${plan.theme}`;
    }

    return header;
  }

  /**
   * Format activities for a specific time slot
   */
  private formatTimeSlot(
    plan: DailyPlan,
    activities: Activity[],
    timeSlot: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT'
  ): string {
    const slotConfig = DAILY_CONFIG.TIME_SLOTS[timeSlot];
    const marker = this.getTimeSlotMarker(timeSlot);

    let content = `${marker} ${slotConfig.label} Activities\n`;

    // Limit activities per time slot
    const limitedActivities = activities.slice(0, DAILY_CONFIG.MAX_ACTIVITIES_PER_DAY);

    for (const activity of limitedActivities) {
      content += this.formatActivity(activity);
    }

    if (activities.length > DAILY_CONFIG.MAX_ACTIVITIES_PER_DAY) {
      const remaining = activities.length - DAILY_CONFIG.MAX_ACTIVITIES_PER_DAY;
      content += `\n${' '.repeat(DAILY_CONFIG.INDENT_SIZE)}+ ${remaining} more activities...`;
    }

    return content;
  }

  /**
   * Format a single activity
   */
  private formatActivity(activity: Activity): string {
    const indent = ' '.repeat(DAILY_CONFIG.INDENT_SIZE);
    let content = `\n${indent}${DAILY_CONFIG.ACTIVITY_MARKER} ${activity.name}`;

    if (activity.time) {
      content += ` (${activity.time})`;
    }

    content += `\n${indent}${' '.repeat(DAILY_CONFIG.INDENT_SIZE)}${activity.location}`;

    if (activity.duration) {
      content += ` • ${activity.duration}`;
    }

    if (activity.cost !== undefined) {
      const costText = activity.cost === 0 ? 'Free' : `$${activity.cost}`;
      content += ` • ${costText}`;
    }

    if (activity.rating) {
      content += ` • ${activity.rating}⭐`;
    }

    if (activity.description) {
      const truncatedDesc = this.truncateText(
        activity.description,
        DAILY_CONFIG.MAX_DESCRIPTION_LENGTH
      );
      content += `\n${indent}${' '.repeat(DAILY_CONFIG.INDENT_SIZE)}${truncatedDesc}`;
    }

    if (activity.bookingRequired) {
      content += `\n${indent}${' '.repeat(DAILY_CONFIG.INDENT_SIZE)}📋 Booking required`;
    }

    return content;
  }

  /**
   * Format meals for the day
   */
  private formatMeals(meals: Meal[]): string {
    const mealGroups = this.groupMealsByType(meals);
    let content = `${DAILY_CONFIG.MEAL_MARKER} Meals\n`;

    for (const [type, mealList] of Object.entries(mealGroups)) {
      content += `\n${' '.repeat(DAILY_CONFIG.INDENT_SIZE)}${this.capitalizeFirst(type)}:`;

      for (const meal of mealList) {
        content += `\n${' '.repeat(DAILY_CONFIG.INDENT_SIZE * 2)}${meal.name}`;

        if (meal.location) {
          content += ` at ${meal.location}`;
        }

        if (meal.time) {
          content += ` (${meal.time})`;
        }

        if (meal.cost) {
          content += ` • $${meal.cost}`;
        }

        if (meal.notes) {
          content += `\n${' '.repeat(DAILY_CONFIG.INDENT_SIZE * 3)}${meal.notes}`;
        }
      }
    }

    return content;
  }

  /**
   * Format transportation for the day
   */
  private formatTransportation(transportation: Transportation[]): string {
    let content = `${DAILY_CONFIG.TRANSPORT_MARKER} Transportation\n`;

    for (const trans of transportation) {
      content += `\n${' '.repeat(DAILY_CONFIG.INDENT_SIZE)}${trans.type}: ${trans.from} → ${
        trans.to
      }`;

      if (trans.departure && trans.arrival) {
        content += `\n${' '.repeat(DAILY_CONFIG.INDENT_SIZE * 2)}${trans.departure} - ${
          trans.arrival
        } (${trans.duration})`;
      }

      content += `\n${' '.repeat(DAILY_CONFIG.INDENT_SIZE * 2)}${trans.provider} • $${trans.cost}`;

      if (trans.bookingReference) {
        content += ` • Booking: ${trans.bookingReference}`;
      }

      if (trans.notes) {
        content += `\n${' '.repeat(DAILY_CONFIG.INDENT_SIZE * 2)}${trans.notes}`;
      }
    }

    return content;
  }

  /**
   * Format accommodation for the day
   */
  private formatAccommodation(accommodation: Accommodation): string {
    let content = `${DAILY_CONFIG.HOTEL_MARKER} Accommodation\n`;

    content += `\n${' '.repeat(DAILY_CONFIG.INDENT_SIZE)}${accommodation.name}`;

    if (accommodation.rating) {
      content += ` (${accommodation.rating}⭐)`;
    }

    content += `\n${' '.repeat(DAILY_CONFIG.INDENT_SIZE)}${accommodation.location}`;
    content += `\n${' '.repeat(DAILY_CONFIG.INDENT_SIZE)}${accommodation.checkIn} - ${
      accommodation.checkOut
    } (${accommodation.nights} nights)`;
    content += `\n${' '.repeat(DAILY_CONFIG.INDENT_SIZE)}$$${accommodation.cost}`;

    if (accommodation.amenities && accommodation.amenities.length > 0) {
      const amenities = accommodation.amenities.slice(0, 5).join(', ');
      content += `\n${' '.repeat(DAILY_CONFIG.INDENT_SIZE)}Amenities: ${amenities}`;
    }

    if (accommodation.description) {
      const truncatedDesc = this.truncateText(
        accommodation.description,
        DAILY_CONFIG.MAX_DESCRIPTION_LENGTH
      );
      content += `\n${' '.repeat(DAILY_CONFIG.INDENT_SIZE)}${truncatedDesc}`;
    }

    return content;
  }

  /**
   * Format notes for the day
   */
  private formatNotes(notes: string): string {
    return `📝 Notes\n\n${' '.repeat(DAILY_CONFIG.INDENT_SIZE)}${notes}`;
  }

  /**
   * Filter activities by time slot
   */
  private filterActivitiesByTime(
    activities: Activity[],
    timeSlot: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT'
  ): Activity[] {
    const slotConfig = DAILY_CONFIG.TIME_SLOTS[timeSlot];

    return activities.filter((activity) => {
      if (!activity.time) return timeSlot === 'MORNING'; // Default to morning if no time specified

      const time = this.parseTime(activity.time);
      if (!time) return false;

      return time >= slotConfig.start && time < slotConfig.end;
    });
  }

  /**
   * Get marker for time slot
   */
  private getTimeSlotMarker(timeSlot: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT'): string {
    switch (timeSlot) {
      case 'MORNING':
        return DAILY_CONFIG.MORNING_MARKER;
      case 'AFTERNOON':
        return DAILY_CONFIG.AFTERNOON_MARKER;
      case 'EVENING':
        return DAILY_CONFIG.EVENING_MARKER;
      case 'NIGHT':
        return '🌙';
      default:
        return DAILY_CONFIG.ACTIVITY_MARKER;
    }
  }

  /**
   * Group meals by type
   */
  private groupMealsByType(meals: Meal[]): Record<string, Meal[]> {
    const groups: Record<string, Meal[]> = {};

    for (const meal of meals) {
      const type = meal.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type]!.push(meal);
    }

    return groups;
  }

  /**
   * Parse time string to hours
   */
  private parseTime(timeStr: string): number | null {
    const match = timeStr.match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)?$/i);
    if (!match) return null;

    let hours = parseInt(match[1]!);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const ampm = match[3]?.toLowerCase();

    if (ampm === 'pm' && hours !== 12) {
      hours += 12;
    } else if (ampm === 'am' && hours === 12) {
      hours = 0;
    }

    return hours + minutes / 60;
  }

  /**
   * Truncate text to specified length
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;

    const truncated = text.substring(0, maxLength - 3);
    return truncated + '...';
  }

  /**
   * Capitalize first letter
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Create a day summary box
   */
  createDaySummaryBox(plan: DailyPlan): string {
    const activityCount = plan.activities?.length || 0;
    const mealCount = plan.meals?.length || 0;
    const transportCount = plan.transportation?.length || 0;

    const summary = [
      `Day ${plan.day}: ${plan.title}`,
      `Activities: ${activityCount}`,
      `Meals: ${mealCount}`,
      `Transportation: ${transportCount}`,
    ].join('\n');

    return boxFormatter.createBox(summary, `Day ${plan.day} Summary`, 'single');
  }

  /**
   * Create activity timeline
   */
  createActivityTimeline(plan: DailyPlan): string {
    const activities = plan.activities || [];
    if (activities.length === 0) return '';

    const sortedActivities = activities
      .filter((act) => act.time)
      .sort((a, b) => {
        const timeA = this.parseTime(a.time!) || 0;
        const timeB = this.parseTime(b.time!) || 0;
        return timeA - timeB;
      });

    let timeline = `📅 Day ${plan.day} Timeline\n\n`;

    for (const activity of sortedActivities) {
      timeline += `${activity.time} - ${activity.name}\n`;
      timeline += `   📍 ${activity.location}\n`;

      if (activity.duration) {
        timeline += `   ⏱️ ${activity.duration}\n`;
      }

      timeline += '\n';
    }

    return timeline.trim();
  }
}

/**
 * Global daily formatter instance
 */
export const dailyFormatter = new DailyFormatter();

/**
 * Convenience functions for common daily formatting operations
 */

/**
 * Format daily plans
 */
export async function formatDailyPlans(dailyPlans: DailyPlan[]): Promise<string> {
  return dailyFormatter.formatDailyPlans(dailyPlans);
}

/**
 * Format single daily plan
 */
export async function formatDailyPlan(plan: DailyPlan): Promise<string> {
  return dailyFormatter.formatDailyPlan(plan);
}

/**
 * Create day summary box
 */
export function createDaySummaryBox(plan: DailyPlan): string {
  return dailyFormatter.createDaySummaryBox(plan);
}

/**
 * Create activity timeline
 */
export function createActivityTimeline(plan: DailyPlan): string {
  return dailyFormatter.createActivityTimeline(plan);
}

/**
 * Export types
 */
export type { DailyPlan, Activity, Meal, Accommodation, Transportation };

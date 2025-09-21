/**
 * Form Putter Agent
 * Final itinerary formatting and presentation using GPT-OSS-20B
 */

import { AgentInput, AgentOutput } from '../../types/agent-responses';
import { EnhancedFormData } from '../../types/form-data';

/**
 * Form Putter Agent Configuration
 */
export interface FormPutterConfig {
  model: 'gpt-oss-20b';
  temperature: number;
  maxTokens: number;
  formattingStyle: 'narrative' | 'structured' | 'bullet' | 'timeline';
  detailLevel: 'brief' | 'standard' | 'detailed' | 'comprehensive';
  language: string;
  includeImages: boolean;
}

/**
 * Formatted Itinerary Output
 */
export interface FormattedItinerary {
  title: string;
  summary: string;
  overview: ItineraryOverview;
  dailyPlans: DailyPlan[];
  practicalInfo: PracticalInformation;
  metadata: ItineraryMetadata;
}

/**
 * Itinerary Overview
 */
export interface ItineraryOverview {
  destination: string;
  duration: number;
  travelDates: {
    start: string;
    end: string;
  };
  totalCost: CostBreakdown;
  highlights: string[];
  bestTime: string;
}

/**
 * Daily Plan
 */
export interface DailyPlan {
  day: number;
  date: string;
  theme: string;
  activities: Activity[];
  meals: Meal[];
  transportation: Transportation[];
  accommodation?: Accommodation;
  notes?: string[];
}

/**
 * Activity in Daily Plan
 */
export interface Activity {
  time: string;
  duration: string;
  name: string;
  description: string;
  location: string;
  cost?: CostEstimate;
  bookingRequired?: boolean;
  tips?: string[];
}

/**
 * Meal in Daily Plan
 */
export interface Meal {
  time: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recommendation: string;
  location?: string;
  cost?: CostEstimate;
  dietaryNotes?: string[];
}

/**
 * Transportation in Daily Plan
 */
export interface Transportation {
  time: string;
  type: string;
  from: string;
  to: string;
  duration: string;
  cost?: CostEstimate;
  bookingReference?: string;
}

/**
 * Accommodation
 */
export interface Accommodation {
  name: string;
  type: string;
  location: string;
  checkIn: string;
  checkOut: string;
  cost: CostEstimate;
  amenities: string[];
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
}

/**
 * Cost Estimate
 */
export interface CostEstimate {
  amount: number;
  currency: string;
  type: 'estimated' | 'fixed' | 'range';
  notes?: string;
}

/**
 * Cost Breakdown
 */
export interface CostBreakdown {
  accommodation: CostEstimate;
  activities: CostEstimate;
  transportation: CostEstimate;
  meals: CostEstimate;
  miscellaneous: CostEstimate;
  total: CostEstimate;
}

/**
 * Practical Information
 */
export interface PracticalInformation {
  visaRequirements: string[];
  healthAndSafety: string[];
  packingList: string[];
  localTips: string[];
  emergencyContacts: EmergencyContact[];
  transportationTips: string[];
  currencyAndPayments: string[];
}

/**
 * Emergency Contact
 */
export interface EmergencyContact {
  type: string;
  name: string;
  phone: string;
  hours?: string;
  language?: string;
}

/**
 * Itinerary Metadata
 */
export interface ItineraryMetadata {
  generatedAt: string;
  version: string;
  generator: string;
  confidence: number;
  customizationNotes: string[];
}

/**
 * Form Putter Agent
 */
export class FormPutterAgent {
  private config: FormPutterConfig;

  constructor(config: Partial<FormPutterConfig> = {}) {
    this.config = {
      model: 'gpt-oss-20b',
      temperature: 0.3, // Lower temperature for consistent formatting
      maxTokens: 4000,
      formattingStyle: 'structured',
      detailLevel: 'standard',
      language: 'en',
      includeImages: false,
      ...config,
    };
  }

  /**
   * Process itinerary formatting request
   */
  async processRequest(input: AgentInput): Promise<{
    success: boolean;
    output?: AgentOutput;
    error?: any;
    metadata: any;
  }> {
    const startTime = Date.now();

    try {
      // Validate input
      this.validateInput(input);

      // Format the itinerary based on agent outputs
      const formattedItinerary = await this.formatItinerary(input);

      // Create agent output
      const output: AgentOutput = {
        data: formattedItinerary,
        confidence: this.calculateFormattingConfidence(formattedItinerary),
        sources: [], // Sources are embedded in the formatted content
        processingTime: Date.now() - startTime,
        recommendations: this.generateFormattingRecommendations(),
      };

      return {
        success: true,
        output,
        metadata: {
          agentVersion: '1.0.0',
          processingTime: Date.now() - startTime,
          modelUsed: this.config.model,
          formattingStyle: this.config.formattingStyle,
          detailLevel: this.config.detailLevel,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PUTTER_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown putter error',
          details: {
            input,
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
   * Format the complete itinerary
   */
  private async formatItinerary(input: AgentInput): Promise<FormattedItinerary> {
    const formData = input.formData;

    // Create itinerary overview
    const overview = this.createItineraryOverview(formData);

    // Create daily plans
    const dailyPlans = this.createDailyPlans(formData);

    // Create practical information
    const practicalInfo = this.createPracticalInformation(formData);

    // Create metadata
    const metadata = this.createItineraryMetadata();

    return {
      title: this.generateItineraryTitle(formData),
      summary: this.generateItinerarySummary(formData, overview),
      overview,
      dailyPlans,
      practicalInfo,
      metadata,
    };
  }

  /**
   * Generate itinerary title
   */
  private generateItineraryTitle(formData: EnhancedFormData): string {
    const destination = formData.location;
    const duration = this.calculateDuration(formData);
    const groupSize = formData.adults + (formData.children || 0);

    let title = `${duration}-Day ${destination} Adventure`;

    if (groupSize > 2) {
      title = `${duration}-Day ${destination} Trip for ${groupSize}`;
    }

    const interests = formData.selectedInterests || [];
    if (interests.length > 0) {
      const primaryInterest = interests[0];
      title += ` - ${primaryInterest.charAt(0).toUpperCase() + primaryInterest.slice(1)} Focus`;
    }

    return title;
  }

  /**
   * Generate itinerary summary
   */
  private generateItinerarySummary(
    formData: EnhancedFormData,
    overview: ItineraryOverview
  ): string {
    const destination = formData.location;
    const duration = overview.duration;
    const groupSize = formData.adults + (formData.children || 0);

    let summary = `This ${duration}-day itinerary takes you to ${destination}, featuring `;

    if (overview.highlights.length > 0) {
      summary += overview.highlights.slice(0, 3).join(', ');
    }

    summary += `. Perfect for ${
      groupSize > 2 ? 'groups' : 'couples/families'
    }, this trip balances adventure, culture, and relaxation.`;

    if (formData.budget) {
      summary += ` Total estimated cost: $${formData.budget.toLocaleString()}.`;
    }

    return summary;
  }

  /**
   * Create itinerary overview
   */
  private createItineraryOverview(formData: EnhancedFormData): ItineraryOverview {
    const destination = formData.location;
    const duration = this.calculateDuration(formData);

    return {
      destination,
      duration,
      travelDates: {
        start: formData.departDate || 'TBD',
        end: formData.returnDate || 'TBD',
      },
      totalCost: this.createCostBreakdown(formData),
      highlights: this.generateHighlights(formData),
      bestTime: this.determineBestTime(formData),
    };
  }

  /**
   * Create cost breakdown
   */
  private createCostBreakdown(formData: EnhancedFormData): CostBreakdown {
    const budget = formData.budget || 0;
    const currency = 'USD'; // Could be made configurable

    return {
      accommodation: {
        amount: budget * 0.4,
        currency,
        type: 'estimated',
        notes: 'Based on mid-range hotels',
      },
      activities: {
        amount: budget * 0.25,
        currency,
        type: 'estimated',
        notes: 'Entrance fees and tours',
      },
      transportation: {
        amount: budget * 0.2,
        currency,
        type: 'estimated',
        notes: 'Local transport and transfers',
      },
      meals: {
        amount: budget * 0.1,
        currency,
        type: 'estimated',
        notes: 'Restaurant meals',
      },
      miscellaneous: {
        amount: budget * 0.05,
        currency,
        type: 'estimated',
        notes: 'Tips, souvenirs, etc.',
      },
      total: {
        amount: budget,
        currency,
        type: 'estimated',
        notes: 'Total estimated cost',
      },
    };
  }

  /**
   * Generate highlights
   */
  private generateHighlights(formData: EnhancedFormData): string[] {
    const highlights: string[] = [];
    const interests = formData.selectedInterests || [];

    // Add interest-based highlights
    for (const interest of interests.slice(0, 3)) {
      highlights.push(`${interest.charAt(0).toUpperCase() + interest.slice(1)} experiences`);
    }

    // Add destination-specific highlights
    highlights.push(`Explore ${formData.location}`);
    highlights.push('Local cuisine and culture');

    return highlights;
  }

  /**
   * Determine best time to visit
   */
  private determineBestTime(formData: EnhancedFormData): string {
    // This could be enhanced with actual seasonal data
    const destination = formData.location.toLowerCase();

    if (destination.includes('caribbean') || destination.includes('mexico')) {
      return 'December to April (dry season)';
    }

    if (destination.includes('europe')) {
      return 'May to September (summer season)';
    }

    if (destination.includes('asia')) {
      return 'November to February (dry season)';
    }

    return 'Shoulder season (avoid peak tourist times)';
  }

  /**
   * Create daily plans
   */
  private createDailyPlans(formData: EnhancedFormData): DailyPlan[] {
    const duration = this.calculateDuration(formData);
    const dailyPlans: DailyPlan[] = [];

    for (let day = 1; day <= duration; day++) {
      const dailyPlan = this.createDailyPlan(day, formData);
      dailyPlans.push(dailyPlan);
    }

    return dailyPlans;
  }

  /**
   * Create a single daily plan
   */
  private createDailyPlan(day: number, formData: EnhancedFormData): DailyPlan {
    const totalDays = this.calculateDuration(formData);
    const interests = formData.selectedInterests || [];

    return {
      day,
      date: this.calculateDateForDay(day, formData),
      theme: this.assignDayTheme(day, totalDays),
      activities: this.createDayActivities(day, interests),
      meals: this.createDayMeals(day),
      transportation: this.createDayTransportation(day, totalDays),
      accommodation: day < totalDays ? this.createAccommodation() : undefined,
      notes: this.generateDayNotes(day, totalDays),
    };
  }

  /**
   * Calculate date for a specific day
   */
  private calculateDateForDay(day: number, formData: EnhancedFormData): string {
    if (formData.departDate) {
      const departDate = new Date(formData.departDate);
      const targetDate = new Date(departDate);
      targetDate.setDate(departDate.getDate() + day - 1);
      return targetDate.toISOString().split('T')[0];
    }

    return `Day ${day}`;
  }

  /**
   * Assign theme for the day
   */
  private assignDayTheme(day: number, totalDays: number): string {
    if (day === 1) return 'Arrival and Exploration';
    if (day === totalDays) return 'Final Day and Departure';
    if (day === Math.ceil(totalDays / 2)) return 'Highlights and Relaxation';

    const themes = [
      'Cultural Immersion',
      'Adventure and Activities',
      'Nature and Outdoors',
      'Local Cuisine',
      'Historical Sites',
      'Markets and Shopping',
      'Relaxation Day',
    ];

    return themes[(day - 1) % themes.length];
  }

  /**
   * Create activities for the day
   */
  private createDayActivities(day: number, interests: string[]): Activity[] {
    const activities: Activity[] = [];

    // Morning activity
    activities.push({
      time: '09:00',
      duration: '3 hours',
      name: `Morning Activity - Day ${day}`,
      description: 'Explore local attractions and culture',
      location: 'City Center',
      cost: {
        amount: 25,
        currency: 'USD',
        type: 'estimated',
      },
      bookingRequired: false,
      tips: ['Wear comfortable shoes', 'Bring water'],
    });

    // Afternoon activity
    activities.push({
      time: '14:00',
      duration: '2 hours',
      name: `Afternoon Activity - Day ${day}`,
      description: 'Continue exploration with different focus',
      location: 'Nearby Area',
      cost: {
        amount: 20,
        currency: 'USD',
        type: 'estimated',
      },
      bookingRequired: false,
      tips: ['Check weather forecast'],
    });

    return activities;
  }

  /**
   * Create meals for the day
   */
  private createDayMeals(day: number): Meal[] {
    return [
      {
        time: '08:00',
        type: 'breakfast',
        recommendation: 'Hotel breakfast or local cafe',
        cost: {
          amount: 15,
          currency: 'USD',
          type: 'estimated',
        },
      },
      {
        time: '13:00',
        type: 'lunch',
        recommendation: 'Local restaurant with traditional cuisine',
        cost: {
          amount: 25,
          currency: 'USD',
          type: 'estimated',
        },
        dietaryNotes: ['Vegetarian options available'],
      },
      {
        time: '19:00',
        type: 'dinner',
        recommendation: 'Recommended restaurant with local specialties',
        cost: {
          amount: 40,
          currency: 'USD',
          type: 'estimated',
        },
      },
    ];
  }

  /**
   * Create transportation for the day
   */
  private createDayTransportation(day: number, totalDays: number): Transportation[] {
    const transportation: Transportation[] = [];

    if (day === 1) {
      // Arrival transportation
      transportation.push({
        time: 'Upon arrival',
        type: 'Airport transfer',
        from: 'Airport',
        to: 'Hotel',
        duration: '45 minutes',
        cost: {
          amount: 30,
          currency: 'USD',
          type: 'estimated',
        },
      });
    }

    // Daily transportation
    transportation.push({
      time: 'Throughout day',
      type: 'Local transport',
      from: 'Hotel',
      to: 'Activities',
      duration: 'As needed',
      cost: {
        amount: 10,
        currency: 'USD',
        type: 'estimated',
      },
    });

    return transportation;
  }

  /**
   * Create accommodation
   */
  private createAccommodation(): Accommodation {
    return {
      name: 'Sample Hotel',
      type: 'Mid-range hotel',
      location: 'City Center',
      checkIn: '15:00',
      checkOut: '11:00',
      cost: {
        amount: 120,
        currency: 'USD',
        type: 'estimated',
        notes: 'Per night',
      },
      amenities: ['WiFi', 'Breakfast included', 'Air conditioning', 'Room service'],
      contactInfo: {
        phone: '+1-555-0123',
        email: 'info@samplehotel.com',
        website: 'www.samplehotel.com',
      },
    };
  }

  /**
   * Generate day notes
   */
  private generateDayNotes(day: number, totalDays: number): string[] {
    const notes: string[] = [];

    if (day === 1) {
      notes.push('Allow time to recover from jet lag');
      notes.push('Get oriented with the local area');
    }

    if (day === totalDays) {
      notes.push('Pack and prepare for departure');
      notes.push('Last chance for souvenirs');
    }

    notes.push('Stay hydrated throughout the day');
    notes.push('Keep important documents secure');

    return notes;
  }

  /**
   * Create practical information
   */
  private createPracticalInformation(formData: EnhancedFormData): PracticalInformation {
    return {
      visaRequirements: this.generateVisaRequirements(formData),
      healthAndSafety: this.generateHealthAndSafety(formData),
      packingList: this.generatePackingList(formData),
      localTips: this.generateLocalTips(formData),
      emergencyContacts: this.generateEmergencyContacts(),
      transportationTips: this.generateTransportationTips(),
      currencyAndPayments: this.generateCurrencyAndPayments(formData),
    };
  }

  /**
   * Generate visa requirements
   */
  private generateVisaRequirements(formData: EnhancedFormData): string[] {
    // This could be enhanced with actual visa requirement data
    return [
      'Check visa requirements for your nationality',
      'Most Western countries allow 90 days visa-free',
      'Keep passport valid for at least 6 months',
      'Make copies of important documents',
    ];
  }

  /**
   * Generate health and safety information
   */
  private generateHealthAndSafety(formData: EnhancedFormData): string[] {
    return [
      'Travel insurance recommended',
      'Check CDC recommendations for destination',
      'Keep important medications in carry-on',
      'Know location of nearest hospital',
      'Stay aware of surroundings in tourist areas',
    ];
  }

  /**
   * Generate packing list
   */
  private generatePackingList(formData: EnhancedFormData): string[] {
    const packingList: string[] = [
      'Passport and travel documents',
      'Credit cards and some cash',
      'Comfortable walking shoes',
      'Weather-appropriate clothing',
      'Adapter for local electrical outlets',
      'Sunscreen and hat',
      'Reusable water bottle',
    ];

    const hasChildren = (formData.children || 0) > 0;
    if (hasChildren) {
      packingList.push('Child essentials (snacks, entertainment)');
    }

    return packingList;
  }

  /**
   * Generate local tips
   */
  private generateLocalTips(formData: EnhancedFormData): string[] {
    return [
      'Learn a few basic local phrases',
      'Carry small denomination currency',
      'Respect local customs and dress codes',
      'Try local street food from reputable vendors',
      'Use official taxis or rideshares',
      'Keep valuables secure',
    ];
  }

  /**
   * Generate emergency contacts
   */
  private generateEmergencyContacts(): EmergencyContact[] {
    return [
      {
        type: 'Police',
        name: 'Local Police',
        phone: '911',
        hours: '24/7',
      },
      {
        type: 'Medical',
        name: 'Hospital',
        phone: '+1-555-0199',
        hours: '24/7',
      },
      {
        type: 'Embassy',
        name: 'US Embassy',
        phone: '+1-555-0100',
        hours: 'Business hours',
        language: 'English',
      },
    ];
  }

  /**
   * Generate transportation tips
   */
  private generateTransportationTips(): string[] {
    return [
      'Use reputable taxi services or rideshares',
      'Download offline maps',
      'Keep transportation apps ready',
      'Know the location of your accommodation',
      'Have hotel address in local language',
    ];
  }

  /**
   * Generate currency and payments information
   */
  private generateCurrencyAndPayments(formData: EnhancedFormData): string[] {
    return [
      'Credit cards widely accepted',
      'Carry some local currency for small purchases',
      'Check for ATM fees',
      'Inform bank of travel plans',
      'Use contactless payments where available',
    ];
  }

  /**
   * Create itinerary metadata
   */
  private createItineraryMetadata(): ItineraryMetadata {
    return {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      generator: 'Hylo AI Travel Assistant',
      confidence: 0.85,
      customizationNotes: [
        'Itinerary customized based on your preferences',
        'Costs are estimates and may vary',
        'Booking recommendations are suggestions',
      ],
    };
  }

  /**
   * Calculate formatting confidence
   */
  private calculateFormattingConfidence(itinerary: FormattedItinerary): number {
    // Calculate confidence based on completeness of information
    let confidence = 0.8;

    if (itinerary.dailyPlans.length > 0) confidence += 0.1;
    if (itinerary.practicalInfo.visaRequirements.length > 0) confidence += 0.05;
    if (itinerary.practicalInfo.emergencyContacts.length > 0) confidence += 0.05;

    return Math.min(1.0, confidence);
  }

  /**
   * Generate formatting recommendations
   */
  private generateFormattingRecommendations(): string[] {
    return [
      'Review and customize activities based on your interests',
      'Check current prices and availability',
      'Book popular attractions in advance',
      'Confirm transportation arrangements',
      'Update contact information as needed',
    ];
  }

  /**
   * Calculate duration helper
   */
  private calculateDuration(formData: EnhancedFormData): number {
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

  /**
   * Validate input
   */
  private validateInput(input: AgentInput): void {
    if (!input.formData) {
      throw new Error('Form data is required for itinerary formatting');
    }

    if (!input.formData.location) {
      throw new Error('Destination location is required');
    }
  }
}

/**
 * Factory function to create Form Putter agent
 */
export function createFormPutter(config?: Partial<FormPutterConfig>): FormPutterAgent {
  return new FormPutterAgent(config);
}

/**
 * Default Form Putter instance
 */
export const formPutter = createFormPutter();

/**
 * Validation Rules:
 * - Form data must include destination location
 * - Itinerary must include daily plans for all days
 * - Cost estimates must be realistic and clearly marked
 * - Practical information must be comprehensive
 * - Emergency contacts must be accurate and current
 * - Formatting must be consistent and readable
 * - All dates and times must be properly formatted
 */

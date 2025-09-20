/**
 * Comprehensive Test Data Factories for Hylo Travel Form Data
 * Generates realistic, scenario-specific test data for travel planning forms
 * 
 * Features:
 * - Scenario-based factories (family, business, adventure, luxury)
 * - Edge case generators for robustness testing
 * - Integration with travel style preferences
 * - Cost-aware data generation
 * - Realistic date range handling
 */

import { faker } from '@faker-js/faker';

// Base interfaces for type safety
export interface TravelFormData {
  destination: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  budget: number;
  budgetType: 'per-person' | 'total' | 'flexible';
  travelStyle: string[];
  accommodation?: {
    type: string;
    preferences: string[];
  };
  transportation?: {
    flightClass?: string;
    rentalCar?: boolean;
    preferences: string[];
  };
  activities?: string[];
  dietaryRestrictions?: string[];
  accessibilityNeeds?: string[];
  sessionId?: string;
}

export interface TravelScenarioConfig {
  destinationType: 'international' | 'domestic' | 'local';
  duration: 'short' | 'medium' | 'long';
  groupSize: 'solo' | 'couple' | 'family' | 'large-group';
  budgetRange: 'budget' | 'mid-range' | 'luxury' | 'premium';
  travelPurpose: 'leisure' | 'business' | 'adventure' | 'romantic' | 'family' | 'cultural';
}

// Generator classes for cyclic and random data
export class CycleGenerator<T> {
  private items: T[];
  private index: number = 0;

  constructor(items: T[]) {
    this.items = items;
  }

  next(): T {
    const item = this.items[this.index];
    this.index = (this.index + 1) % this.items.length;
    return item;
  }

  reset(): void {
    this.index = 0;
  }
}

export class SampleGenerator<T> {
  private items: T[];
  private lastItem?: T;

  constructor(items: T[]) {
    this.items = items;
  }

  next(): T {
    if (this.items.length === 0) {
      throw new Error('SampleGenerator cannot generate from empty array');
    }
    
    let item: T;
    do {
      item = faker.helpers.arrayElement(this.items);
    } while (item === this.lastItem && this.items.length > 1);
    
    this.lastItem = item;
    return item;
  }
}

// Destination data organized by type and region
const DESTINATIONS = {
  international: {
    europe: ['Paris, France', 'London, United Kingdom', 'Rome, Italy', 'Barcelona, Spain', 'Amsterdam, Netherlands', 'Vienna, Austria', 'Prague, Czech Republic'],
    asia: ['Tokyo, Japan', 'Bangkok, Thailand', 'Seoul, South Korea', 'Singapore', 'Bali, Indonesia', 'Mumbai, India', 'Manila, Philippines'],
    americas: ['Mexico City, Mexico', 'Buenos Aires, Argentina', 'Rio de Janeiro, Brazil', 'Vancouver, Canada', 'Toronto, Canada'],
    oceania: ['Sydney, Australia', 'Melbourne, Australia', 'Auckland, New Zealand'],
    africa: ['Cape Town, South Africa', 'Marrakech, Morocco', 'Cairo, Egypt']
  },
  domestic: {
    cities: ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Miami, FL', 'San Francisco, CA', 'Seattle, WA', 'Austin, TX', 'Denver, CO'],
    national_parks: ['Yellowstone National Park', 'Yosemite National Park', 'Grand Canyon National Park', 'Zion National Park', 'Glacier National Park'],
    beach: ['Myrtle Beach, SC', 'Key West, FL', 'Outer Banks, NC', 'Martha\'s Vineyard, MA', 'Napa Valley, CA']
  },
  local: ['Downtown Area', 'Historic District', 'Waterfront', 'Arts Quarter', 'University District']
};

const TRAVEL_STYLES = {
  family: ['family-friendly', 'educational', 'theme-parks', 'outdoor-activities', 'interactive-museums'],
  business: ['business-class', 'city-center', 'conference-facilities', 'networking', 'efficient-transport'],
  adventure: ['outdoor-adventure', 'hiking', 'extreme-sports', 'nature-exploration', 'wildlife-viewing'],
  luxury: ['luxury-accommodations', 'fine-dining', 'spa-wellness', 'premium-transport', 'exclusive-experiences'],
  romantic: ['romantic-settings', 'couples-activities', 'fine-dining', 'sunset-views', 'intimate-experiences'],
  cultural: ['historical-sites', 'museums', 'local-culture', 'art-galleries', 'traditional-cuisine'],
  leisure: ['sightseeing', 'relaxation', 'local-tours', 'shopping', 'restaurants']
};

const ACCOMMODATION_TYPES = {
  budget: ['hostel', 'budget-hotel', 'guesthouse', 'motel'],
  'mid-range': ['3-star-hotel', '4-star-hotel', 'boutique-hotel', 'apartment-rental'],
  luxury: ['5-star-hotel', 'luxury-resort', 'villa-rental', 'premium-suite'],
  family: ['family-hotel', 'apartment-rental', 'resort-with-kids-club', 'vacation-rental']
};

const BUDGET_RANGES = {
  budget: { min: 500, max: 1500 },
  'mid-range': { min: 1500, max: 3500 },
  luxury: { min: 3500, max: 8000 },
  premium: { min: 8000, max: 20000 }
};

// Base Factory Class
export class TravelFormFactory {
  constructor() {
    // Removed unused generators for now
  }

  /**
   * Generate a complete form data object with realistic values
   */
  build(overrides: Partial<TravelFormData> = {}, scenario?: TravelScenarioConfig): TravelFormData {
    const config = scenario || this.generateRandomScenario();
    const dates = this.generateDateRange(config.duration);
    const groupConfig = this.generateGroupConfig(config.groupSize);
    const budget = this.generateBudget(config.budgetRange, groupConfig.adults + groupConfig.children);
    
    const baseData: TravelFormData = {
      destination: this.selectDestination(config.destinationType),
      startDate: dates.startDate,
      endDate: dates.endDate,
      adults: groupConfig.adults,
      children: groupConfig.children,
      budget: budget.amount,
      budgetType: budget.type,
      travelStyle: this.selectTravelStyle(config.travelPurpose),
      accommodation: this.generateAccommodation(config.budgetRange, config.travelPurpose) || {
        type: 'hotel',
        preferences: []
      },
      transportation: this.generateTransportation(config.budgetRange, config.destinationType) || {
        preferences: []
      },
      activities: this.generateActivities(config.travelPurpose),
      dietaryRestrictions: faker.helpers.maybe(() => this.generateDietaryRestrictions(), { probability: 0.3 }) || [],
      accessibilityNeeds: faker.helpers.maybe(() => this.generateAccessibilityNeeds(), { probability: 0.2 }) || [],
      sessionId: faker.string.uuid()
    };

    return { ...baseData, ...overrides };
  }

  /**
   * Generate multiple form data objects
   */
  batch(count: number, scenarios?: TravelScenarioConfig[]): TravelFormData[] {
    return Array.from({ length: count }, (_, index) => {
      const scenario = scenarios?.[index] || this.generateRandomScenario();
      return this.build({}, scenario);
    });
  }

  /**
   * Generate edge case scenarios for robustness testing
   */
  buildEdgeCase(type: 'minimum' | 'maximum' | 'invalid' | 'boundary'): Partial<TravelFormData> {
    switch (type) {
      case 'minimum':
        return {
          adults: 1,
          children: 0,
          budget: 100,
          budgetType: 'total',
          startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
          endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
          travelStyle: ['budget-friendly']
        };
      
      case 'maximum':
        return {
          adults: 10,
          children: 8,
          budget: 50000,
          budgetType: 'total',
          startDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
          endDate: new Date(Date.now() + (365 + 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
          travelStyle: ['luxury-accommodations', 'fine-dining', 'premium-transport', 'exclusive-experiences', 'spa-wellness']
        };
      
      case 'boundary':
        return {
          adults: 1,
          children: 1,
          budget: 999,
          budgetType: 'per-person',
          startDate: new Date().toISOString().split('T')[0]!,
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
          travelStyle: ['business-class', 'family-friendly']
        };
      
      case 'invalid':
        return {
          adults: 0, // Invalid
          children: -1, // Invalid
          budget: -500, // Invalid
          startDate: '2020-01-01', // Past date
          endDate: '2019-12-31', // End before start
          destination: '', // Empty
          travelStyle: [] // Empty array
        };
      
      default:
        return this.build();
    }
  }

  private generateRandomScenario(): TravelScenarioConfig {
    return {
      destinationType: faker.helpers.arrayElement(['international', 'domestic', 'local']),
      duration: faker.helpers.arrayElement(['short', 'medium', 'long']),
      groupSize: faker.helpers.arrayElement(['solo', 'couple', 'family', 'large-group']),
      budgetRange: faker.helpers.arrayElement(['budget', 'mid-range', 'luxury', 'premium']),
      travelPurpose: faker.helpers.arrayElement(['leisure', 'business', 'adventure', 'romantic', 'family', 'cultural'])
    };
  }

  private selectDestination(type: 'international' | 'domestic' | 'local'): string {
    if (type === 'local') {
      return faker.helpers.arrayElement(DESTINATIONS.local);
    }
    
    const destinationOptions = DESTINATIONS[type];
    const region = faker.helpers.objectKey(destinationOptions);
    return faker.helpers.arrayElement(destinationOptions[region as keyof typeof destinationOptions]);
  }

  private selectTravelStyle(purpose: string): string[] {
    const baseStyles = TRAVEL_STYLES[purpose as keyof typeof TRAVEL_STYLES] || TRAVEL_STYLES.leisure;
    const styleCount = faker.number.int({ min: 1, max: Math.min(3, baseStyles.length) });
    return faker.helpers.arrayElements(baseStyles, styleCount);
  }

  private generateDateRange(duration: 'short' | 'medium' | 'long'): { startDate: string; endDate: string } {
    const daysFromNow = faker.number.int({ min: 7, max: 365 });
    const startDate = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
    
    let tripDuration: number;
    switch (duration) {
      case 'short':
        tripDuration = faker.number.int({ min: 2, max: 4 });
        break;
      case 'medium':
        tripDuration = faker.number.int({ min: 5, max: 14 });
        break;
      case 'long':
        tripDuration = faker.number.int({ min: 15, max: 30 });
        break;
    }
    
    const endDate = new Date(startDate.getTime() + tripDuration * 24 * 60 * 60 * 1000);
    
    return {
      startDate: startDate.toISOString().split('T')[0]!,
      endDate: endDate.toISOString().split('T')[0]!
    };
  }

  private generateGroupConfig(size: 'solo' | 'couple' | 'family' | 'large-group'): { adults: number; children: number } {
    switch (size) {
      case 'solo':
        return { adults: 1, children: 0 };
      case 'couple':
        return { adults: 2, children: 0 };
      case 'family':
        return {
          adults: faker.number.int({ min: 1, max: 2 }),
          children: faker.number.int({ min: 1, max: 3 })
        };
      case 'large-group':
        return {
          adults: faker.number.int({ min: 4, max: 8 }),
          children: faker.number.int({ min: 0, max: 4 })
        };
    }
  }

  private generateBudget(range: string, totalTravelers: number): { amount: number; type: 'per-person' | 'total' | 'flexible' } {
    const budgetRange = BUDGET_RANGES[range as keyof typeof BUDGET_RANGES];
    const budgetType = faker.helpers.arrayElement(['per-person', 'total', 'flexible']);
    
    let amount: number;
    if (budgetType === 'per-person') {
      amount = faker.number.int({ min: budgetRange.min / totalTravelers, max: budgetRange.max / totalTravelers });
    } else {
      amount = faker.number.int(budgetRange);
    }
    
    return { amount, type: budgetType };
  }

  private generateAccommodation(budgetRange: string, purpose: string): TravelFormData['accommodation'] {
    const accommodationTypes = ACCOMMODATION_TYPES[purpose as keyof typeof ACCOMMODATION_TYPES] || 
                               ACCOMMODATION_TYPES[budgetRange as keyof typeof ACCOMMODATION_TYPES] || 
                               ACCOMMODATION_TYPES['mid-range'];
    
    const preferences = [];
    if (faker.datatype.boolean({ probability: 0.7 })) {
      preferences.push(...faker.helpers.arrayElements([
        'wifi', 'breakfast-included', 'pool', 'gym', 'spa', 'pet-friendly', 
        'non-smoking', 'air-conditioning', 'parking', 'room-service'
      ], faker.number.int({ min: 1, max: 3 })));
    }

    return {
      type: faker.helpers.arrayElement(accommodationTypes),
      preferences
    };
  }

  private generateTransportation(budgetRange: string, destinationType: string): TravelFormData['transportation'] {
    const needsFlight = destinationType === 'international' || faker.datatype.boolean({ probability: 0.6 });
    const needsRentalCar = faker.datatype.boolean({ probability: 0.4 });
    
    const flightClasses = budgetRange === 'luxury' || budgetRange === 'premium' 
      ? ['business', 'first'] 
      : budgetRange === 'mid-range' 
        ? ['economy', 'premium-economy'] 
        : ['economy'];
    
    const preferences = [];
    if (faker.datatype.boolean({ probability: 0.5 })) {
      preferences.push(...faker.helpers.arrayElements([
        'direct-flights', 'flexible-dates', 'seat-preference', 'meal-preference',
        'early-checkin', 'priority-boarding', 'extra-legroom'
      ], faker.number.int({ min: 1, max: 2 })));
    }

    const result: TravelFormData['transportation'] = {
      preferences
    };

    if (needsFlight) {
      result.flightClass = faker.helpers.arrayElement(flightClasses);
    }

    if (needsRentalCar) {
      result.rentalCar = needsRentalCar;
    }

    return result;
  }

  private generateActivities(purpose: string): string[] {
    const activityOptions = {
      leisure: ['sightseeing', 'shopping', 'restaurants', 'local-tours', 'relaxation'],
      business: ['conferences', 'meetings', 'networking-events', 'city-tours'],
      adventure: ['hiking', 'water-sports', 'extreme-sports', 'wildlife-viewing', 'outdoor-activities'],
      romantic: ['couples-activities', 'romantic-dinners', 'sunset-tours', 'spa-treatments'],
      family: ['theme-parks', 'museums', 'interactive-experiences', 'outdoor-fun', 'educational-tours'],
      cultural: ['historical-sites', 'art-galleries', 'local-culture', 'traditional-performances', 'cooking-classes']
    };
    
    const activities = activityOptions[purpose as keyof typeof activityOptions] || activityOptions.leisure;
    return faker.helpers.arrayElements(activities, faker.number.int({ min: 1, max: 3 }));
  }

  private generateDietaryRestrictions(): string[] {
    return faker.helpers.arrayElements([
      'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-allergy', 
      'shellfish-allergy', 'halal', 'kosher', 'low-sodium', 'diabetic'
    ], faker.number.int({ min: 1, max: 2 }));
  }

  private generateAccessibilityNeeds(): string[] {
    return faker.helpers.arrayElements([
      'wheelchair-accessible', 'mobility-assistance', 'visual-impairment-support', 
      'hearing-impairment-support', 'service-animal-accommodation'
    ], faker.number.int({ min: 1, max: 2 }));
  }
}

// Specialized Factory Classes for Different Scenarios
export class FamilyTravelFactory extends TravelFormFactory {
  override build(overrides: Partial<TravelFormData> = {}): TravelFormData {
    const scenario: TravelScenarioConfig = {
      destinationType: faker.helpers.arrayElement(['domestic', 'international']),
      duration: faker.helpers.arrayElement(['medium', 'long']),
      groupSize: 'family',
      budgetRange: faker.helpers.arrayElement(['mid-range', 'luxury']),
      travelPurpose: 'family'
    };
    
    return super.build({
      travelStyle: ['family-friendly', 'educational', 'theme-parks'],
      ...overrides
    }, scenario);
  }
}

export class BusinessTravelFactory extends TravelFormFactory {
  override build(overrides: Partial<TravelFormData> = {}): TravelFormData {
    const scenario: TravelScenarioConfig = {
      destinationType: faker.helpers.arrayElement(['domestic', 'international']),
      duration: 'short',
      groupSize: faker.helpers.arrayElement(['solo', 'couple']),
      budgetRange: faker.helpers.arrayElement(['mid-range', 'luxury']),
      travelPurpose: 'business'
    };
    
    return super.build({
      travelStyle: ['business-class', 'city-center', 'efficient-transport'],
      ...overrides
    }, scenario);
  }
}

export class AdventureTravelFactory extends TravelFormFactory {
  override build(overrides: Partial<TravelFormData> = {}): TravelFormData {
    const scenario: TravelScenarioConfig = {
      destinationType: faker.helpers.arrayElement(['international', 'domestic']),
      duration: faker.helpers.arrayElement(['medium', 'long']),
      groupSize: faker.helpers.arrayElement(['solo', 'couple', 'large-group']),
      budgetRange: faker.helpers.arrayElement(['budget', 'mid-range']),
      travelPurpose: 'adventure'
    };
    
    return super.build({
      travelStyle: ['outdoor-adventure', 'hiking', 'nature-exploration'],
      ...overrides
    }, scenario);
  }
}

export class LuxuryTravelFactory extends TravelFormFactory {
  override build(overrides: Partial<TravelFormData> = {}): TravelFormData {
    const scenario: TravelScenarioConfig = {
      destinationType: 'international',
      duration: faker.helpers.arrayElement(['medium', 'long']),
      groupSize: faker.helpers.arrayElement(['couple', 'family']),
      budgetRange: faker.helpers.arrayElement(['luxury', 'premium']),
      travelPurpose: faker.helpers.arrayElement(['leisure', 'romantic'])
    };
    
    return super.build({
      travelStyle: ['luxury-accommodations', 'fine-dining', 'premium-transport', 'exclusive-experiences'],
      ...overrides
    }, scenario);
  }
}

// Factory instances for easy consumption
export const travelFormFactory = new TravelFormFactory();
export const familyTravelFactory = new FamilyTravelFactory();
export const businessTravelFactory = new BusinessTravelFactory();
export const adventureTravelFactory = new AdventureTravelFactory();
export const luxuryTravelFactory = new LuxuryTravelFactory();

// Utility functions for test scenarios
export const TravelTestScenarios = {
  /**
   * Generate data for specific test scenarios
   */
  createTestSet(scenario: 'happy-path' | 'edge-cases' | 'error-cases' | 'performance'): TravelFormData[] {
    switch (scenario) {
      case 'happy-path':
        return [
          familyTravelFactory.build(),
          businessTravelFactory.build(),
          adventureTravelFactory.build(),
          luxuryTravelFactory.build()
        ];
      
      case 'edge-cases':
        return [
          travelFormFactory.build(travelFormFactory.buildEdgeCase('minimum')),
          travelFormFactory.build(travelFormFactory.buildEdgeCase('maximum')),
          travelFormFactory.build(travelFormFactory.buildEdgeCase('boundary'))
        ];
      
      case 'error-cases':
        return [
          travelFormFactory.build(travelFormFactory.buildEdgeCase('invalid'))
        ];
      
      case 'performance':
        return travelFormFactory.batch(100);
      
      default:
        return [travelFormFactory.build()];
    }
  },

  /**
   * Create data for concurrent testing scenarios
   */
  createConcurrentTestData(sessionCount: number = 5): TravelFormData[][] {
    return Array.from({ length: sessionCount }, () => [
      travelFormFactory.build(),
      travelFormFactory.build(),
      travelFormFactory.build()
    ]);
  },

  /**
   * Create realistic workflow progression data
   */
  createWorkflowTestData(): {
    formData: TravelFormData;
    expectedSteps: string[];
    expectedDuration: number;
  } {
    const formData = travelFormFactory.build();
    const baseSteps = ['content-planner', 'info-gatherer', 'strategist', 'content-compiler'];
    
    // Estimate duration based on complexity
    const complexity = (formData.adults + formData.children) * formData.travelStyle.length;
    const expectedDuration = Math.max(30, Math.min(300, complexity * 15)); // 30s to 5min
    
    return {
      formData,
      expectedSteps: baseSteps,
      expectedDuration
    };
  }
};
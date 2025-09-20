/**
 * Mock LLM Providers for Testing
 * Comprehensive mocking of Groq, Cerebras, and Google Gemini APIs
 * 
 * Features:
 * - Realistic response generation
 * - Provider fallback chain testing
 * - Cost tracking simulation
 * - Response time simulation
 * - Streaming support
 * - Error condition simulation
 */

import { vi } from 'vitest';
import { faker } from '@faker-js/faker';

// Base interfaces for LLM responses
export interface LLMResponse {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  choices: Array<{
    index: number;
    message: {
      role: 'assistant' | 'system' | 'user';
      content: string;
    };
    finish_reason: 'stop' | 'length' | 'content_filter' | 'function_call';
  }>;
  cost?: {
    input_cost: number;
    output_cost: number;
    total_cost: number;
  };
}

export interface StreamingChunk {
  id: string;
  model: string;
  created: number;
  choices: Array<{
    index: number;
    delta: {
      role?: 'assistant';
      content?: string;
    };
    finish_reason?: 'stop' | 'length' | 'content_filter';
  }>;
}

export interface LLMError {
  error: {
    message: string;
    type: string;
    code?: string;
    status?: number;
  };
}

export interface ProviderConfig {
  baseDelay: number; // Base response delay in ms
  successRate: number; // 0-1 probability of success
  costMultiplier: number; // Cost factor for this provider
  models: string[];
  maxTokens: number;
  supportedFeatures: {
    streaming: boolean;
    functionCalling: boolean;
    imageInput: boolean;
  };
}

// Provider configurations
const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  groq: {
    baseDelay: 800, // Fast inference
    successRate: 0.98,
    costMultiplier: 0.5, // Generally cheaper
    models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'llama-3.2-90b-text-preview'],
    maxTokens: 32768,
    supportedFeatures: {
      streaming: true,
      functionCalling: true,
      imageInput: false
    }
  },
  cerebras: {
    baseDelay: 600, // Very fast
    successRate: 0.97,
    costMultiplier: 0.3, // Very cost-effective
    models: ['llama3.1-70b', 'llama3.1-8b'],
    maxTokens: 8192,
    supportedFeatures: {
      streaming: true,
      functionCalling: false,
      imageInput: false
    }
  },
  google: {
    baseDelay: 1200, // Slower but comprehensive
    successRate: 0.99,
    costMultiplier: 1.0, // Standard pricing
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
    maxTokens: 1000000,
    supportedFeatures: {
      streaming: true,
      functionCalling: true,
      imageInput: true
    }
  }
};

// Mock response generators
export class TravelItineraryResponseGenerator {
  static generateContentPlannerResponse(formData: any): string {
    const destination = formData.destination || 'your destination';
    const duration = this.calculateDays(formData.startDate, formData.endDate);
    const travelers = formData.adults + (formData.children || 0);
    
    return `# Travel Content Planning Analysis for ${destination}

Based on your ${duration}-day trip for ${travelers} travelers, I've identified the following information requirements:

## Required Real-time Information:
1. **Current Weather & Seasonal Considerations**: ${destination} weather patterns, seasonal activities, packing recommendations
2. **Local Events & Festivals**: Upcoming events during ${formData.startDate} to ${formData.endDate}
3. **Transportation Options**: Flight prices, local transportation, rental car availability
4. **Accommodation Availability**: Hotels, resorts, vacation rentals in your budget range ($${formData.budget})
5. **Activity Pricing & Availability**: Current rates for tours, attractions, restaurants

## Information Gathering Priority:
- HIGH: Weather, transportation, accommodation
- MEDIUM: Activities, dining, local events  
- LOW: Shopping, optional experiences

Proceeding to gather this information through web research...`;
  }

  static generateInfoGathererResponse(formData: any): string {
    const destination = formData.destination || 'your destination';
    
    return `# Real-time Information Gathered for ${destination}

## Weather & Climate Information:
- **Current Season**: ${faker.helpers.arrayElement(['Spring', 'Summer', 'Fall', 'Winter'])} weather conditions
- **Temperature Range**: ${faker.number.int({min: 60, max: 85})}°F - ${faker.number.int({min: 70, max: 90})}°F
- **Precipitation**: ${faker.number.int({min: 0, max: 30})}% chance of rain
- **Recommended Clothing**: ${faker.helpers.arrayElement(['Light layers', 'Warm clothing', 'Summer attire', 'Rain gear recommended'])}

## Transportation Information:
- **Flight Prices**: $${faker.number.int({min: 300, max: 1200})} - $${faker.number.int({min: 800, max: 2000})} (${formData.transportation?.flightClass || 'economy'} class)
- **Local Transportation**: ${faker.helpers.arrayElement(['Metro system available', 'Taxi/rideshare recommended', 'Rental car suggested', 'Walking-friendly area'])}
- **Airport Transfer**: $${faker.number.int({min: 25, max: 80})} average cost

## Accommodation Options:
- **Budget Range**: $${faker.number.int({min: 80, max: 150})}/night - $${faker.number.int({min: 200, max: 400})}/night
- **Availability**: ${faker.helpers.arrayElement(['High availability', 'Limited availability', 'Peak season - book early'])}
- **Recommended Areas**: ${faker.helpers.arrayElements(['Downtown', 'Historic District', 'Waterfront', 'Arts Quarter'], 2).join(', ')}

## Current Events & Activities:
- **Local Festivals**: ${faker.helpers.arrayElement(['Food & Wine Festival', 'Music Festival', 'Art Exhibition', 'Cultural Celebration'])} during your visit
- **Popular Attractions**: ${faker.number.int({min: 15, max: 45})} major attractions available
- **Dining Scene**: ${faker.number.int({min: 200, max: 800})} restaurants, average meal cost $${faker.number.int({min: 25, max: 75})}

This information will now be processed for strategic recommendations...`;
  }

  static generateStrategistResponse(formData: any): string {
    const destination = formData.destination || 'your destination';
    const budget = formData.budget || 2000;
    
    return `# Strategic Travel Recommendations for ${destination}

## Budget Optimization Strategy:
**Total Budget**: $${budget} (${formData.budgetType || 'total'})
**Recommended Allocation**:
- Accommodation (40%): $${Math.round(budget * 0.4)}
- Activities & Tours (25%): $${Math.round(budget * 0.25)}
- Dining (20%): $${Math.round(budget * 0.2)}
- Transportation (10%): $${Math.round(budget * 0.1)}
- Emergency Buffer (5%): $${Math.round(budget * 0.05)}

## Timing & Logistics Strategy:
- **Best arrival time**: ${faker.helpers.arrayElement(['Morning flights for full first day', 'Afternoon arrival to avoid rush', 'Evening arrival for next-day start'])}
- **Optimal duration**: Your ${this.calculateDays(formData.startDate, formData.endDate)}-day trip allows for ${faker.helpers.arrayElement(['relaxed exploration', 'comprehensive coverage', 'in-depth experience'])}
- **Peak times to avoid**: ${faker.helpers.arrayElements(['Weekday rush hours', 'Weekend crowds', 'Lunch hour queues'], 2).join(', ')}

## Activity Prioritization:
**Must-Do (Top Priority)**:
${this.generateActivityList('must-do', formData.travelStyle)}

**Should-Do (If Time Permits)**:
${this.generateActivityList('should-do', formData.travelStyle)}

**Could-Do (Flexible Options)**:
${this.generateActivityList('could-do', formData.travelStyle)}

## Risk Mitigation:
- **Weather backup plans**: Indoor alternatives identified
- **Budget overrun protection**: 15% buffer recommended  
- **Health & safety**: Travel insurance and local emergency contacts
- **Booking strategy**: Reserve key activities in advance, keep 30% flexible

Proceeding to compile final itinerary with these strategic considerations...`;
  }

  static generateContentCompilerResponse(formData: any): string {
    const destination = formData.destination || 'Amazing Destination';
    const duration = this.calculateDays(formData.startDate, formData.endDate);
    const travelers = formData.adults + (formData.children || 0);
    
    return `# ${destination} Travel Itinerary

## TRIP SUMMARY
**Trip Nickname**: ${this.generateTripNickname(destination, formData.travelStyle)}
**Travel Dates**: ${formData.startDate} to ${formData.endDate} (${duration} days)
**Travelers**: ${formData.adults} adult${formData.adults > 1 ? 's' : ''}${formData.children ? ` + ${formData.children} child${formData.children > 1 ? 'ren' : ''}` : ''}
**Budget**: $${formData.budget} (${formData.budgetType})

## Prepared for:
*[Your personalized itinerary created by Hylo Travel AI]*

## DAILY ITINERARY

${this.generateDailyItinerary(duration, destination, formData)}

## TIPS FOR YOUR TRIP

### 💰 Budget Tips:
- Download local payment apps for better exchange rates
- Look for lunch specials and happy hour deals
- Consider city tourism cards for attraction discounts

### 🌤️ Weather Preparation:
- Pack layers for temperature changes
- ${faker.helpers.arrayElement(['Bring rain gear', 'Pack sun protection', 'Include warm clothing', 'Light, breathable fabrics recommended'])}
- Check weather forecast 48 hours before departure

### 🚗 Transportation:
- ${faker.helpers.arrayElement(['Metro day passes offer best value', 'Rideshare apps are reliable', 'Walking is encouraged in city center', 'Rental car recommended for flexibility'])}
- Download offline maps before arrival
- Allow extra time during peak hours

### 🍽️ Dining Recommendations:
- Make reservations for popular restaurants 2-3 days ahead
- Try local specialties: ${faker.helpers.arrayElements(['Street food markets', 'Local coffee shops', 'Traditional restaurants', 'Fusion cuisine'], 2).join(', ')}
- Dietary restrictions: Most restaurants accommodate special requests with advance notice

### 📱 Essential Apps:
- ${faker.helpers.arrayElements(['Local transport app', 'Weather app', 'Translation app', 'Restaurant booking app', 'Navigation app'], 3).join(', ')}

### 🎟️ Booking Tips:
- Book popular attractions online to skip lines
- Check for group discounts if traveling with ${travelers} people
- Consider flexible booking options for unpredictable weather

---

*Have an amazing trip! This itinerary was generated using real-time data and personalized to your preferences by Hylo's AI travel planning system.*`;
  }

  private static calculateDays(startDate: string, endDate: string): number {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      return faker.number.int({ min: 3, max: 10 });
    }
  }

  private static generateTripNickname(destination: string, travelStyle: string[]): string {
    const destinationShort = destination.split(',')[0] || destination;
    const styleKeywords = {
      'family-friendly': ['Family', 'Adventure'],
      'luxury': ['Luxury', 'Premium'],
      'business': ['Executive', 'Professional'],
      'adventure': ['Adventure', 'Explorer'],
      'cultural': ['Cultural', 'Heritage'],
      'romantic': ['Romantic', 'Couples']
    };
    
    const primaryStyle = travelStyle?.[0] || 'adventure';
    const keywords = styleKeywords[primaryStyle as keyof typeof styleKeywords] || ['Great'];
    const keyword = faker.helpers.arrayElement(keywords);
    
    return `${keyword} ${destinationShort} ${faker.helpers.arrayElement(['Getaway', 'Journey', 'Adventure', 'Experience'])}`;
  }

  private static generateActivityList(priority: 'must-do' | 'should-do' | 'could-do', travelStyle?: string[]): string {
    const activities = {
      'must-do': [
        'Visit iconic landmark',
        'Take guided city tour',
        'Try signature local cuisine',
        'Explore main cultural district'
      ],
      'should-do': [
        'Visit local museum',
        'Take scenic photography tour',
        'Experience local nightlife',
        'Shop at traditional markets'
      ],
      'could-do': [
        'Day trip to nearby town',
        'Cooking class experience',
        'Spa treatment',
        'Local artisan workshop'
      ]
    };

    return faker.helpers.arrayElements(activities[priority], faker.number.int({ min: 2, max: 4 }))
      .map((activity, index) => `${index + 1}. ${activity}`)
      .join('\n');
  }

  private static generateDailyItinerary(duration: number, destination: string, formData: any): string {
    return Array.from({ length: duration }, (_, index) => {
      const dayNumber = index + 1;
      const activities = this.generateDayActivities(dayNumber, duration, formData.travelStyle);
      
      return `### Day ${dayNumber} - ${this.generateDayTheme(dayNumber, duration)}
${activities}
**Estimated Cost**: $${faker.number.int({ min: 80, max: 250 })} per person
**Travel Time**: ${faker.number.int({ min: 30, max: 120 })} minutes total
`;
    }).join('\n');
  }

  private static generateDayTheme(day: number, totalDays: number): string {
    if (day === 1) return 'Arrival & Orientation';
    if (day === totalDays) return 'Final Exploration & Departure';
    
    const themes = [
      'Cultural Immersion',
      'Adventure & Activities',
      'Local Experiences',
      'Relaxation & Leisure',
      'Hidden Gems Discovery',
      'Food & Dining Tour'
    ];
    
    return faker.helpers.arrayElement(themes);
  }

  private static generateDayActivities(day: number, totalDays: number, travelStyle?: string[]): string {
    const timeSlots = ['**Morning (9:00-12:00)**:', '**Afternoon (12:00-17:00)**:', '**Evening (17:00-21:00)**:'];
    
    return timeSlots.map(slot => {
      const activity = faker.helpers.arrayElement([
        'Guided tour of historic district',
        'Visit to local museum or gallery',
        'Outdoor activity or nature walk',
        'Shopping at local markets',
        'Dining at recommended restaurant',
        'Cultural performance or show',
        'Relaxation at hotel or spa',
        'Photography session at scenic spots'
      ]);
      
      return `${slot} ${activity}`;
    }).join('\n');
  }
}

// Mock provider classes
export class MockGroqProvider {
  private config: ProviderConfig;
  private callCount: number = 0;

  constructor() {
    this.config = PROVIDER_CONFIGS.groq;
  }

  async chat(messages: any[], options: any = {}): Promise<LLMResponse> {
    this.callCount++;
    await this.simulateDelay();

    if (!this.shouldSucceed()) {
      throw this.generateError('rate_limit_exceeded', 'Rate limit exceeded. Please try again later.');
    }

    const content = this.generateContent(messages, options);
    const usage = this.calculateUsage(content, messages);

    return {
      id: `groq-${faker.string.uuid()}`,
      model: options.model || faker.helpers.arrayElement(this.config.models),
      created: Math.floor(Date.now() / 1000),
      usage,
      cost: this.calculateCost(usage),
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content
        },
        finish_reason: 'stop'
      }]
    };
  }

  async *stream(messages: any[], options: any = {}): AsyncGenerator<StreamingChunk> {
    await this.simulateDelay();

    if (!this.shouldSucceed()) {
      throw this.generateError('rate_limit_exceeded', 'Rate limit exceeded during streaming.');
    }

    const content = this.generateContent(messages, options);
    const chunks = this.splitIntoChunks(content);
    const id = `groq-stream-${faker.string.uuid()}`;

    for (let i = 0; i < chunks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, faker.number.int({ min: 20, max: 100 })));
      
      yield {
        id,
        model: options.model || faker.helpers.arrayElement(this.config.models),
        created: Math.floor(Date.now() / 1000),
        choices: [{
          index: 0,
          delta: {
            role: i === 0 ? 'assistant' : undefined,
            content: chunks[i]
          },
          finish_reason: i === chunks.length - 1 ? 'stop' : undefined
        }]
      };
    }
  }

  private generateContent(messages: any[], options: any): string {
    const lastMessage = messages[messages.length - 1];
    const context = lastMessage?.content || '';

    // Check if this looks like a travel planning request
    if (context.includes('content-planner') || context.includes('planning') || options.agent === 'content-planner') {
      return TravelItineraryResponseGenerator.generateContentPlannerResponse(options.formData || {});
    }
    
    if (context.includes('info-gatherer') || context.includes('research') || options.agent === 'info-gatherer') {
      return TravelItineraryResponseGenerator.generateInfoGathererResponse(options.formData || {});
    }
    
    if (context.includes('strategist') || context.includes('strategy') || options.agent === 'strategist') {
      return TravelItineraryResponseGenerator.generateStrategistResponse(options.formData || {});
    }
    
    if (context.includes('content-compiler') || context.includes('itinerary') || options.agent === 'content-compiler') {
      return TravelItineraryResponseGenerator.generateContentCompilerResponse(options.formData || {});
    }

    // Fallback generic travel response
    return `# Travel Planning Response

Based on your request, I've analyzed the following:

${faker.lorem.paragraphs(3, '\n\n')}

Key recommendations:
1. ${faker.lorem.sentence()}
2. ${faker.lorem.sentence()}  
3. ${faker.lorem.sentence()}

This information should help you plan your perfect trip!`;
  }

  private calculateUsage(content: string, messages: any[]) {
    const promptTokens = messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0) / 4;
    const completionTokens = content.length / 4;
    
    return {
      prompt_tokens: Math.round(promptTokens),
      completion_tokens: Math.round(completionTokens),
      total_tokens: Math.round(promptTokens + completionTokens)
    };
  }

  private calculateCost(usage: any) {
    const inputCost = usage.prompt_tokens * 0.00005 * this.config.costMultiplier; // $0.05 per 1K tokens
    const outputCost = usage.completion_tokens * 0.00008 * this.config.costMultiplier; // $0.08 per 1K tokens
    
    return {
      input_cost: parseFloat(inputCost.toFixed(6)),
      output_cost: parseFloat(outputCost.toFixed(6)),
      total_cost: parseFloat((inputCost + outputCost).toFixed(6))
    };
  }

  private async simulateDelay(): Promise<void> {
    const delay = this.config.baseDelay + faker.number.int({ min: -200, max: 400 });
    await new Promise(resolve => setTimeout(resolve, Math.max(100, delay)));
  }

  private shouldSucceed(): boolean {
    return Math.random() < this.config.successRate;
  }

  setSuccessRate(rate: number): void {
    this.config.successRate = rate;
  }

  private generateError(type: string, message: string): Error {
    const error = new Error(message);
    (error as any).type = type;
    (error as any).code = `groq_${type}`;
    (error as any).status = type === 'rate_limit_exceeded' ? 429 : 500;
    return error;
  }

  private splitIntoChunks(content: string): string[] {
    const words = content.split(' ');
    const chunks: string[] = [];
    const chunkSize = faker.number.int({ min: 3, max: 8 });
    
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' ') + (i + chunkSize < words.length ? ' ' : ''));
    }
    
    return chunks;
  }

  // Test utilities
  getCallCount(): number {
    return this.callCount;
  }

  resetCallCount(): void {
    this.callCount = 0;
  }
}

export class MockCerebrasProvider {
  private config: ProviderConfig;
  private callCount: number = 0;

  constructor() {
    this.config = PROVIDER_CONFIGS['cerebras']!;
  }

  async generate(prompt: string, options: any = {}): Promise<LLMResponse> {
    this.callCount++;
    await this.simulateDelay();

    if (!this.shouldSucceed()) {
      throw this.generateError('service_unavailable', 'Cerebras service temporarily unavailable.');
    }

    const content = this.generateContent(prompt, options);
    const usage = this.calculateUsage(content, prompt);

    return {
      id: `cerebras-${faker.string.uuid()}`,
      model: options.model || faker.helpers.arrayElement(this.config.models),
      created: Math.floor(Date.now() / 1000),
      usage,
      cost: this.calculateCost(usage),
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content
        },
        finish_reason: 'stop'
      }]
    };
  }

  private generateContent(_prompt: string, options: any = {}): string {
    // Similar logic to Groq but tailored for Cerebras
    if (options.agent === 'content-planner') {
      return TravelItineraryResponseGenerator.generateContentPlannerResponse(options.formData || {});
    }
    
    return `# Cerebras Response

${faker.lorem.paragraphs(2, '\n\n')}

Analysis: ${faker.lorem.sentence()}`;
  }

  private calculateUsage(content: string, prompt: string) {
    const promptTokens = Math.round(prompt.length / 4);
    const completionTokens = Math.round(content.length / 4);
    
    return {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens
    };
  }

  private calculateCost(usage: any) {
    const inputCost = usage.prompt_tokens * 0.00003 * this.config.costMultiplier;
    const outputCost = usage.completion_tokens * 0.00005 * this.config.costMultiplier;
    
    return {
      input_cost: parseFloat(inputCost.toFixed(6)),
      output_cost: parseFloat(outputCost.toFixed(6)),
      total_cost: parseFloat((inputCost + outputCost).toFixed(6))
    };
  }

  private async simulateDelay(): Promise<void> {
    const delay = this.config.baseDelay + faker.number.int({ min: -150, max: 300 });
    await new Promise(resolve => setTimeout(resolve, Math.max(50, delay)));
  }

  private shouldSucceed(): boolean {
    return Math.random() < this.config.successRate;
  }

  getCallCount(): number {
    return this.callCount;
  }

  resetCallCount(): void {
    this.callCount = 0;
  }

  setSuccessRate(rate: number): void {
    this.config.successRate = rate;
  }

  private generateError(type: string, message: string): Error {
    const error = new Error(message);
    (error as any).type = type;
    (error as any).code = `cerebras_${type}`;
    (error as any).status = 503;
    return error;
  }
}

export class MockGoogleProvider {
  private config: ProviderConfig;
  private callCount: number = 0;

  constructor() {
    this.config = PROVIDER_CONFIGS['google']!;
  }

  async generateContent(request: any): Promise<LLMResponse> {
    this.callCount++;
    await this.simulateDelay();

    if (!this.shouldSucceed()) {
      throw this.generateError('quota_exceeded', 'Google AI quota exceeded for this project.');
    }

    const prompt = request.contents?.[0]?.parts?.[0]?.text || request.prompt || '';
    const content = this.generateContentPrivate(prompt, request);
    const usage = this.calculateUsage(content, prompt);

    return {
      id: `google-${faker.string.uuid()}`,
      model: request.model || faker.helpers.arrayElement(this.config.models),
      created: Math.floor(Date.now() / 1000),
      usage,
      cost: this.calculateCost(usage),
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content
        },
        finish_reason: 'stop'
      }]
    };
  }

  private generateContentPrivate(_prompt: string, options: any = {}): string {
    if (options.agent === 'strategist') {
      return TravelItineraryResponseGenerator.generateStrategistResponse(options.formData || {});
    }
    
    if (options.agent === 'content-compiler') {
      return TravelItineraryResponseGenerator.generateContentCompilerResponse(options.formData || {});
    }

    return `# Google Gemini Analysis

${faker.lorem.paragraphs(3, '\n\n')}

Recommendations:
- ${faker.lorem.sentence()}
- ${faker.lorem.sentence()}
- ${faker.lorem.sentence()}`;
  }

  private calculateUsage(content: string, prompt: string) {
    const promptTokens = Math.round(prompt.length / 3.5); // Google uses different tokenization
    const completionTokens = Math.round(content.length / 3.5);
    
    return {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens
    };
  }

  private calculateCost(usage: any) {
    const inputCost = usage.prompt_tokens * 0.00006 * this.config.costMultiplier;
    const outputCost = usage.completion_tokens * 0.00012 * this.config.costMultiplier;
    
    return {
      input_cost: parseFloat(inputCost.toFixed(6)),
      output_cost: parseFloat(outputCost.toFixed(6)),
      total_cost: parseFloat((inputCost + outputCost).toFixed(6))
    };
  }

  private async simulateDelay(): Promise<void> {
    const delay = this.config.baseDelay + faker.number.int({ min: -300, max: 600 });
    await new Promise(resolve => setTimeout(resolve, Math.max(200, delay)));
  }

  private shouldSucceed(): boolean {
    return Math.random() < this.config.successRate;
  }

  getCallCount(): number {
    return this.callCount;
  }

  resetCallCount(): void {
    this.callCount = 0;
  }

  setSuccessRate(rate: number): void {
    this.config.successRate = rate;
  }

  private generateError(type: string, message: string): Error {
    const error = new Error(message);
    (error as any).type = type;
    (error as any).code = `google_${type}`;
    (error as any).status = type === 'quota_exceeded' ? 429 : 500;
    return error;
  }
}

// Fallback chain simulator
export class MockProviderChain {
  private providers: Array<{ name: string; provider: any; priority: number }>;
  private attempts: Array<{ provider: string; success: boolean; latency: number; cost?: number }> = [];

  constructor() {
    this.providers = [
      { name: 'groq', provider: new MockGroqProvider(), priority: 1 },
      { name: 'cerebras', provider: new MockCerebrasProvider(), priority: 2 },
      { name: 'google', provider: new MockGoogleProvider(), priority: 3 }
    ].sort((a, b) => a.priority - b.priority);
  }

  async executeWithFallback(request: any, options: any = {}): Promise<{ response: LLMResponse; provider: string; attempts: typeof this.attempts }> {
    this.attempts = [];
    
    for (const { name, provider } of this.providers) {
      const startTime = Date.now();
      
      try {
        let response: LLMResponse;
        
        if (name === 'groq') {
          response = await provider.chat([{ role: 'user', content: request }], options);
        } else if (name === 'cerebras') {
          response = await provider.generate(request, options);
        } else {
          response = await provider.generateContent({ prompt: request, ...options });
        }
        
        const latency = Date.now() - startTime;
        this.attempts.push({ 
          provider: name, 
          success: true, 
          latency,
          ...(response.cost?.total_cost !== undefined && { cost: response.cost.total_cost })
        });
        
        return { response, provider: name, attempts: [...this.attempts] };
      } catch (error) {
        const latency = Date.now() - startTime;
        this.attempts.push({ provider: name, success: false, latency });
        
        console.warn(`Provider ${name} failed:`, error);
      }
    }
    
    throw new Error('All providers failed');
  }

  getAttempts(): typeof this.attempts {
    return [...this.attempts];
  }

  resetAttempts(): void {
    this.attempts = [];
  }
}

// Vitest mock helpers
export const createMockLLMEnvironment = () => {
  const groq = new MockGroqProvider();
  const cerebras = new MockCerebrasProvider();
  const google = new MockGoogleProvider();
  const chain = new MockProviderChain();

  return {
    // Individual providers
    groq,
    cerebras,
    google,
    chain,
    
    // Helper functions
    resetAllMocks: () => {
      groq.resetCallCount();
      cerebras.resetCallCount();
      google.resetCallCount();
      chain.resetAttempts();
    },
    
    simulateProviderFailure: (providerName: 'groq' | 'cerebras' | 'google', shouldFail: boolean = true) => {
      const provider = { groq, cerebras, google }[providerName];
      const config = PROVIDER_CONFIGS[providerName];
      if (config) {
        provider.setSuccessRate(shouldFail ? 0 : config.successRate);
      }
    },
    
    getTotalCosts: () => {
      const attempts = chain.getAttempts();
      return attempts.reduce((sum, attempt) => sum + (attempt.cost || 0), 0);
    },
    
    getPerformanceMetrics: () => {
      const attempts = chain.getAttempts();
      return {
        totalAttempts: attempts.length,
        successfulAttempts: attempts.filter(a => a.success).length,
        averageLatency: attempts.reduce((sum, a) => sum + a.latency, 0) / attempts.length,
        totalCost: attempts.reduce((sum, a) => sum + (a.cost || 0), 0)
      };
    }
  };
};
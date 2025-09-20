/**
 * Workflow Session Types for Hylo Multi-Agent Travel Planning System
 * 
 * This module defines session management, state persistence, and workflow context
 * storage types for the multi-agent workflow system. It integrates with Upstash Redis
 * for state persistence and LangChain's memory management patterns.
 * 
 * Based on LangChain.js memory patterns with Upstash Redis integration
 */

import { BaseMessage } from "@langchain/core/messages";
import { z } from "zod";
import { 
  AgentType, 
  AgentResult, 
  WorkflowState, 
  WorkflowConfig,
  TravelFormData 
} from "./agents.js";

// ===== Core Information Types =====

/**
 * Accommodation information structure
 */
export interface AccommodationInfo {
  name: string;
  type: "hotel" | "resort" | "apartment" | "hostel" | "vacation_rental";
  rating: number;
  priceRange: string;
  location: {
    address: string;
    coordinates?: { lat: number; lng: number };
    walkingDistanceToCenter?: number;
  };
  amenities: string[];
  availability: {
    dates: string[];
    pricing: Record<string, number>;
  };
  reviews: {
    rating: number;
    count: number;
    highlights: string[];
  };
  bookingUrls: string[];
}

/**
 * Restaurant information structure
 */
export interface RestaurantInfo {
  name: string;
  cuisine: string[];
  rating: number;
  priceRange: "$" | "$$" | "$$$" | "$$$$";
  location: {
    address: string;
    coordinates?: { lat: number; lng: number };
    neighborhood: string;
  };
  hours: Record<string, string>;
  specialties: string[];
  dietaryOptions: string[];
  reservationRequired: boolean;
  reviews: {
    rating: number;
    count: number;
    highlights: string[];
  };
}

/**
 * Transportation information structure
 */
export interface TransportationInfo {
  airports: Array<{
    code: string;
    name: string;
    distance: number;
    transportOptions: string[];
  }>;
  publicTransport: {
    types: string[];
    ticketPricing: Record<string, number>;
    coverage: string;
  };
  rideshare: {
    available: boolean;
    providers: string[];
    estimatedCosts: Record<string, string>;
  };
  carRental: {
    available: boolean;
    providers: string[];
    averageDailyCost: number;
    parkingInfo: string;
  };
  walkability: {
    score: number;
    description: string;
  };
}

/**
 * Weather forecast information
 */
export interface WeatherForecast {
  destination: string;
  forecast: Array<{
    date: string;
    temperature: {
      high: number;
      low: number;
      unit: "celsius" | "fahrenheit";
    };
    conditions: string;
    precipitation: {
      chance: number;
      type?: string;
    };
    recommendations: string[];
  }>;
  packingTips: string[];
}

/**
 * Event information structure
 */
export interface EventInfo {
  name: string;
  type: "festival" | "concert" | "exhibition" | "sports" | "cultural" | "seasonal";
  dates: {
    start: string;
    end: string;
  };
  location: {
    venue: string;
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  description: string;
  ticketing: {
    required: boolean;
    pricing?: Record<string, number>;
    availability?: string;
  };
  popularity: number;
  tags: string[];
}

/**
 * Safety information structure
 */
export interface SafetyInfo {
  overallRating: number;
  categories: {
    pettyTheft: number;
    violentCrime: number;
    scams: number;
    naturalHazards: number;
    healthRisks: number;
  };
  recommendations: string[];
  emergencyContacts: {
    police: string;
    medical: string;
    tourism: string;
  };
  areas: {
    safe: string[];
    caution: string[];
    avoid: string[];
  };
}

/**
 * Cultural information structure
 */
export interface CulturalInfo {
  customs: string[];
  etiquette: string[];
  language: {
    primary: string;
    common: string[];
    phrases: Record<string, string>;
  };
  tipping: {
    expected: boolean;
    amounts: Record<string, string>;
  };
  dress: {
    general: string;
    religious: string;
    formal: string;
  };
  holidays: Array<{
    name: string;
    date: string;
    impact: string;
  }>;
}

/**
 * Practical travel information
 */
export interface PracticalInfo {
  currency: {
    code: string;
    symbol: string;
    exchangeRate: number;
  };
  electricity: {
    voltage: number;
    plugType: string[];
  };
  timeZone: {
    name: string;
    offset: string;
    dst: boolean;
  };
  internet: {
    wifiAvailability: string;
    mobileData: string;
    costs: Record<string, number>;
  };
  visa: {
    required: boolean;
    type?: string;
    duration?: string;
    cost?: number;
  };
}

/**
 * Pricing information structure
 */
export interface PricingInfo {
  accommodation: {
    budget: Record<string, number>;
    mid: Record<string, number>;
    luxury: Record<string, number>;
  };
  food: {
    streetFood: Record<string, number>;
    casual: Record<string, number>;
    fineDining: Record<string, number>;
  };
  activities: {
    free: string[];
    budget: Record<string, number>;
    premium: Record<string, number>;
  };
  transport: {
    local: Record<string, number>;
    intercity: Record<string, number>;
    international: Record<string, number>;
  };
  dailyBudget: {
    backpacker: number;
    midRange: number;
    luxury: number;
  };
}

/**
 * Compiled itinerary output structure
 */
export interface CompiledItineraryOutput {
  tripSummary: {
    nickname: string;
    dates: { start: string; end: string };
    travelers: { adults: number; children: number };
    budget: {
      amount: number;
      mode: "per-person" | "total" | "flexible";
    };
  };
  preparedFor: {
    contactName: string;
  };
  dailyItinerary: Array<{
    day: number;
    date: string;
    activities: Array<{
      time: string;
      duration: number;
      title: string;
      description: string;
      location: string;
      cost?: number;
      type: "activity" | "meal" | "transport" | "accommodation";
    }>;
  }>;
  tipsForTrip: {
    packing: string[];
    cultural: string[];
    practical: string[];
    safety: string[];
    budgeting: string[];
  };
  metadata: {
    generatedAt: string;
    agentsUsed: AgentType[];
    confidence: number;
    sources: string[];
  };
}

// ============================================================================
// Session Management Interfaces
// ============================================================================

/**
 * Core workflow session interface
 * Manages the complete state of a multi-agent workflow execution
 */
export interface AgentWorkflowSession {
  /** Unique session identifier (UUID v4) */
  sessionId: string;
  
  /** User identifier (for multi-tenancy) */
  userId?: string;
  
  /** Session metadata */
  metadata: SessionMetadata;
  
  /** Current workflow state */
  workflowState: WorkflowState;
  
  /** Original form data */
  formData: TravelFormData;
  
  /** Workflow configuration */
  config: WorkflowConfig;
  
  /** Agent execution contexts */
  agentContexts: Record<AgentType, AgentExecutionContext>;
  
  /** LangChain message history */
  messageHistory: BaseMessage[];
  
  /** Accumulated agent results */
  results: AgentWorkflowResults;
  
  /** Session persistence configuration */
  persistence: SessionPersistenceConfig;
  
  /** Runtime performance metrics */
  performance: SessionPerformanceMetrics;
}

/**
 * Session metadata for tracking and management
 */
export interface SessionMetadata {
  /** Session creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
  
  /** Session expiration timestamp */
  expiresAt: Date;
  
  /** Session TTL in seconds */
  ttl: number;
  
  /** Client information */
  clientInfo: {
    userAgent?: string;
    ipAddress?: string;
    origin?: string;
  };
  
  /** Session tags for categorization */
  tags: Record<string, string>;
  
  /** Session priority level */
  priority: SessionPriority;
  
  /** Session status */
  status: SessionStatus;
}

/**
 * Session priority levels
 */
export enum SessionPriority {
  LOW = 'low',
  NORMAL = 'normal', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Session status enumeration
 */
export enum SessionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

// ============================================================================
// Agent Execution Context
// ============================================================================

/**
 * Individual agent execution context within a workflow session
 */
export interface AgentExecutionContext {
  /** Agent type */
  agent: AgentType;
  
  /** Execution state */
  state: AgentExecutionState;
  
  /** Execution attempts history */
  attempts: AgentExecutionAttempt[];
  
  /** Current attempt number */
  currentAttempt: number;
  
  /** Agent-specific configuration */
  config: AgentConfig;
  
  /** Input data for this agent */
  input: unknown;
  
  /** Output data from this agent */
  output: AgentResult | null;
  
  /** Execution timeline */
  timeline: AgentExecutionTimeline;
  
  /** Resource usage tracking */
  resourceUsage: AgentResourceUsage;
  
  /** Dependencies from other agents */
  dependencies: AgentDependency[];
}

/**
 * Agent execution state
 */
export enum AgentExecutionState {
  PENDING = 'pending',
  INITIALIZING = 'initializing',
  RUNNING = 'running',
  RETRYING = 'retrying',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMED_OUT = 'timed_out'
}

/**
 * Individual agent execution attempt
 */
export interface AgentExecutionAttempt {
  /** Attempt number (1-based) */
  attemptNumber: number;
  
  /** Attempt start time */
  startedAt: Date;
  
  /** Attempt end time */
  completedAt?: Date;
  
  /** Attempt duration in milliseconds */
  durationMs?: number;
  
  /** Attempt result */
  result: AgentResult | null;
  
  /** Error information if failed */
  error?: {
    code: string;
    message: string;
    stack?: string;
    retryable: boolean;
  };
  
  /** LLM provider used for this attempt */
  provider: string;
  
  /** Cost incurred for this attempt */
  cost: number;
  
  /** Tokens consumed */
  tokens: {
    input: number;
    output: number;
    total: number;
  };
}

/**
 * Agent-specific configuration
 */
export interface AgentConfig {
  /** LLM provider chain for fallbacks */
  providerChain: string[];
  
  /** Timeout in milliseconds */
  timeout: number;
  
  /** Maximum retry attempts */
  maxRetries: number;
  
  /** Cost budget for this agent */
  costBudget: number;
  
  /** Custom prompt template */
  promptTemplate?: string;
  
  /** Model parameters */
  modelParams: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
  
  /** Agent-specific feature flags */
  features: Record<string, boolean>;
}

/**
 * Agent execution timeline tracking
 */
export interface AgentExecutionTimeline {
  /** Queue entry time */
  queuedAt: Date;
  
  /** Execution start time */
  startedAt?: Date;
  
  /** First response time */
  firstResponseAt?: Date;
  
  /** Execution completion time */
  completedAt?: Date;
  
  /** Total time in queue (ms) */
  queueTimeMs?: number;
  
  /** Total execution time (ms) */
  executionTimeMs?: number;
  
  /** Time to first response (ms) */
  timeToFirstResponseMs?: number;
}

/**
 * Agent resource usage tracking
 */
export interface AgentResourceUsage {
  /** Total cost incurred (USD) */
  totalCost: number;
  
  /** Total tokens consumed */
  totalTokens: number;
  
  /** Memory usage peak (MB) */
  peakMemoryUsage: number;
  
  /** CPU time consumed (ms) */
  cpuTimeMs: number;
  
  /** Network requests made */
  networkRequests: number;
  
  /** External API calls */
  apiCalls: Record<string, number>;
}

/**
 * Agent dependency tracking
 */
export interface AgentDependency {
  /** Dependency agent type */
  dependsOn: AgentType;
  
  /** Dependency type */
  type: DependencyType;
  
  /** Is this a required dependency? */
  required: boolean;
  
  /** Dependency satisfaction status */
  satisfied: boolean;
  
  /** When was this dependency satisfied? */
  satisfiedAt?: Date;
}

/**
 * Dependency types
 */
export enum DependencyType {
  OUTPUT_DATA = 'output-data',
  STATE_CHANGE = 'state-change',
  RESOURCE_AVAILABILITY = 'resource-availability',
  EXECUTION_COMPLETION = 'execution-completion'
}

// ============================================================================
// Content Planning Context
// ============================================================================

/**
 * Content Planning Context for the Content Planner Agent
 * Contains form analysis results and information requirements
 */
export interface ContentPlanningContext {
  /** Analyzed destination information */
  destination: DestinationAnalysis;
  
  /** Travel date analysis */
  travelDates: TravelDateAnalysis;
  
  /** Traveler group analysis */
  travelers: TravelerGroupAnalysis;
  
  /** Budget analysis */
  budget: BudgetAnalysis;
  
  /** Preference analysis */
  preferences: PreferenceAnalysis;
  
  /** Information requirements for next agent */
  informationRequirements: InformationRequirement[];
  
  /** Search queries for web information gathering */
  searchQueries: SearchQuery[];
  
  /** Priority matrix for information gathering */
  priorities: PriorityMatrix;
}

/**
 * Destination analysis results
 */
export interface DestinationAnalysis {
  /** Primary destination */
  primary: string;
  
  /** Destination type classification */
  type: DestinationType;
  
  /** Geographic information */
  geography: {
    country: string;
    region?: string;
    continent: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    timezone: string;
  };
  
  /** Destination characteristics */
  characteristics: string[];
  
  /** Seasonal considerations */
  seasonality: SeasonalInfo;
  
  /** Language information */
  languages: string[];
  
  /** Currency information */
  currency: {
    code: string;
    name: string;
    symbol: string;
  };
}

/**
 * Destination type classification
 */
export enum DestinationType {
  CITY = 'city',
  REGION = 'region',
  COUNTRY = 'country',
  NATURAL_AREA = 'natural-area',
  CULTURAL_SITE = 'cultural-site',
  RESORT_AREA = 'resort-area',
  MULTIPLE_DESTINATIONS = 'multiple-destinations'
}

/**
 * Seasonal information for destination
 */
export interface SeasonalInfo {
  /** Season during travel dates */
  season: Season;
  
  /** Weather expectations */
  weather: WeatherInfo;
  
  /** Tourist season classification */
  touristSeason: TouristSeason;
  
  /** Seasonal events and festivals */
  events: SeasonalEvent[];
}

/**
 * Season enumeration
 */
export enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  FALL = 'fall',
  WINTER = 'winter',
  DRY_SEASON = 'dry-season',
  WET_SEASON = 'wet-season'
}

/**
 * Weather information
 */
export interface WeatherInfo {
  /** Expected temperature range */
  temperatureRange: {
    min: number;
    max: number;
    unit: 'celsius' | 'fahrenheit';
  };
  
  /** Precipitation expectations */
  precipitation: {
    probability: number;
    type: string[];
  };
  
  /** Weather conditions */
  conditions: string[];
}

/**
 * Tourist season classification
 */
export enum TouristSeason {
  PEAK = 'peak',
  HIGH = 'high', 
  SHOULDER = 'shoulder',
  LOW = 'low',
  OFF = 'off'
}

/**
 * Seasonal events
 */
export interface SeasonalEvent {
  /** Event name */
  name: string;
  
  /** Event type */
  type: string;
  
  /** Event dates */
  dates: {
    start: string;
    end: string;
  };
  
  /** Event significance */
  significance: 'major' | 'moderate' | 'minor';
}

/**
 * Travel date analysis
 */
export interface TravelDateAnalysis {
  /** Departure date */
  departure: Date;
  
  /** Return date */
  return: Date;
  
  /** Trip duration in days */
  duration: number;
  
  /** Travel pattern */
  pattern: TravelPattern;
  
  /** Day of week considerations */
  dayOfWeekFactors: DayOfWeekFactor[];
  
  /** Holiday considerations */
  holidays: HolidayInfo[];
}

/**
 * Travel pattern types
 */
export enum TravelPattern {
  SHORT_GETAWAY = 'short-getaway',    // 1-3 days
  WEEKEND_TRIP = 'weekend-trip',      // 2-4 days
  WEEK_VACATION = 'week-vacation',    // 5-10 days
  EXTENDED_STAY = 'extended-stay',    // 11+ days
  BUSINESS_TRIP = 'business-trip',    // Variable
  MULTI_DESTINATION = 'multi-destination'
}

/**
 * Day of week factors
 */
export interface DayOfWeekFactor {
  /** Day of week */
  day: string;
  
  /** Impact on travel (pricing, crowds, etc.) */
  impact: 'positive' | 'neutral' | 'negative';
  
  /** Explanation */
  reason: string;
}

/**
 * Holiday information
 */
export interface HolidayInfo {
  /** Holiday name */
  name: string;
  
  /** Holiday date */
  date: Date;
  
  /** Holiday type */
  type: 'national' | 'religious' | 'cultural' | 'international';
  
  /** Impact on travel */
  travelImpact: 'high' | 'medium' | 'low';
  
  /** Countries/regions affected */
  scope: string[];
}

/**
 * Traveler group analysis
 */
export interface TravelerGroupAnalysis {
  /** Total number of travelers */
  total: number;
  
  /** Adults count */
  adults: number;
  
  /** Children count */
  children: number;
  
  /** Group type classification */
  groupType: GroupType;
  
  /** Group dynamics considerations */
  dynamics: GroupDynamics;
  
  /** Special requirements */
  specialRequirements: string[];
}

/**
 * Group type classification
 */
export enum GroupType {
  SOLO = 'solo',
  COUPLE = 'couple',
  FAMILY_YOUNG_KIDS = 'family-young-kids',
  FAMILY_TEENS = 'family-teens',
  FRIENDS = 'friends',
  EXTENDED_FAMILY = 'extended-family',
  BUSINESS_GROUP = 'business-group',
  MIXED_GROUP = 'mixed-group'
}

/**
 * Group dynamics information
 */
export interface GroupDynamics {
  /** Activity level compatibility */
  activityLevel: 'low' | 'moderate' | 'high' | 'mixed';
  
  /** Interest alignment */
  interestAlignment: 'high' | 'moderate' | 'diverse';
  
  /** Budget alignment */
  budgetAlignment: 'aligned' | 'mixed' | 'disparate';
  
  /** Planning style */
  planningStyle: 'structured' | 'flexible' | 'spontaneous';
}

/**
 * Budget analysis results
 */
export interface BudgetAnalysis {
  /** Budget amount */
  amount: number;
  
  /** Currency */
  currency: string;
  
  /** Budget mode */
  mode: 'per-person' | 'total' | 'flexible';
  
  /** Budget level classification */
  level: BudgetLevel;
  
  /** Budget breakdown estimates */
  breakdown: BudgetBreakdown;
  
  /** Budget constraints */
  constraints: BudgetConstraint[];
}

/**
 * Budget level classification
 */
export enum BudgetLevel {
  ULTRA_BUDGET = 'ultra-budget',
  BUDGET = 'budget',
  MODERATE = 'moderate', 
  COMFORTABLE = 'comfortable',
  LUXURY = 'luxury',
  ULTRA_LUXURY = 'ultra-luxury'
}

/**
 * Budget breakdown by category
 */
export interface BudgetBreakdown {
  /** Accommodation percentage */
  accommodation: number;
  
  /** Transportation percentage */
  transportation: number;
  
  /** Food & dining percentage */
  foodAndDining: number;
  
  /** Activities & attractions percentage */
  activities: number;
  
  /** Shopping & souvenirs percentage */
  shopping: number;
  
  /** Miscellaneous expenses percentage */
  miscellaneous: number;
  
  /** Emergency buffer percentage */
  emergency: number;
}

/**
 * Budget constraints
 */
export interface BudgetConstraint {
  /** Constraint type */
  type: 'hard-limit' | 'soft-limit' | 'preference';
  
  /** Category affected */
  category: string;
  
  /** Constraint value */
  value: number | string;
  
  /** Constraint description */
  description: string;
}

/**
 * Preference analysis results
 */
export interface PreferenceAnalysis {
  /** Travel style analysis */
  travelStyle: TravelStyleAnalysis;
  
  /** Interest categorization */
  interests: InterestCategory[];
  
  /** Accommodation preferences */
  accommodation: AccommodationPreferences;
  
  /** Transportation preferences */
  transportation: TransportationPreferences;
  
  /** Dining preferences */
  dining: DiningPreferences;
  
  /** Activity preferences */
  activities: ActivityPreferences;
}

/**
 * Travel style analysis
 */
export interface TravelStyleAnalysis {
  /** Primary travel style */
  primary: string;
  
  /** Style characteristics */
  characteristics: string[];
  
  /** Compatible styles */
  compatible: string[];
  
  /** Style implications */
  implications: StyleImplication[];
}

/**
 * Style implications
 */
export interface StyleImplication {
  /** Aspect affected */
  aspect: string;
  
  /** Implication description */
  implication: string;
  
  /** Priority level */
  priority: 'high' | 'medium' | 'low';
}

/**
 * Interest categorization
 */
export interface InterestCategory {
  /** Category name */
  category: string;
  
  /** Specific interests */
  interests: string[];
  
  /** Priority level */
  priority: number;
  
  /** Related categories */
  related: string[];
}

/**
 * Accommodation preferences
 */
export interface AccommodationPreferences {
  /** Preferred types */
  types: string[];
  
  /** Required amenities */
  requiredAmenities: string[];
  
  /** Preferred amenities */
  preferredAmenities: string[];
  
  /** Location preferences */
  locationPreferences: string[];
  
  /** Price sensitivity */
  priceSensitivity: 'very-high' | 'high' | 'moderate' | 'low';
}

/**
 * Transportation preferences
 */
export interface TransportationPreferences {
  /** Preferred modes */
  modes: string[];
  
  /** Comfort requirements */
  comfortRequirements: string[];
  
  /** Time vs cost preference */
  timeVsCost: 'time-priority' | 'balanced' | 'cost-priority';
  
  /** Environmental considerations */
  environmental: boolean;
}

/**
 * Dining preferences
 */
export interface DiningPreferences {
  /** Cuisine interests */
  cuisines: string[];
  
  /** Dining styles */
  styles: string[];
  
  /** Dietary restrictions */
  restrictions: string[];
  
  /** Budget allocation */
  budgetAllocation: 'minimal' | 'moderate' | 'significant';
  
  /** Experience priority */
  experiencePriority: boolean;
}

/**
 * Activity preferences
 */
export interface ActivityPreferences {
  /** Activity types */
  types: string[];
  
  /** Activity level */
  level: 'relaxed' | 'moderate' | 'active' | 'extreme';
  
  /** Indoor vs outdoor preference */
  indoorOutdoor: 'indoor' | 'outdoor' | 'balanced';
  
  /** Group vs solo activities */
  groupSolo: 'group' | 'solo' | 'mixed';
  
  /** Cultural vs leisure balance */
  culturalLeisure: 'cultural' | 'leisure' | 'balanced';
}

// ============================================================================
// Information Requirements & Search Queries
// ============================================================================

/**
 * Information requirement for web data gathering
 */
export interface InformationRequirement {
  /** Requirement category */
  category: InformationCategory;
  
  /** Specific requirement */
  requirement: string;
  
  /** Priority level (1-10) */
  priority: number;
  
  /** Required vs optional */
  required: boolean;
  
  /** Data sources to check */
  sources: string[];
  
  /** Acceptance criteria */
  acceptanceCriteria: string[];
}

/**
 * Information categories for data gathering
 */
export enum InformationCategory {
  ATTRACTIONS = 'attractions',
  ACCOMMODATIONS = 'accommodations',
  RESTAURANTS = 'restaurants',
  TRANSPORTATION = 'transportation',
  WEATHER = 'weather',
  EVENTS = 'events',
  SAFETY = 'safety',
  CULTURE = 'culture',
  PRACTICAL_INFO = 'practical-info',
  PRICES = 'prices'
}

/**
 * Search query for web information gathering
 */
export interface SearchQuery {
  /** Query string */
  query: string;
  
  /** Query type */
  type: SearchQueryType;
  
  /** Target information */
  target: InformationCategory;
  
  /** Expected result type */
  expectedResultType: 'factual' | 'listing' | 'review' | 'comparison';
  
  /** Search parameters */
  parameters: SearchParameters;
  
  /** Quality criteria */
  qualityCriteria: QualityCriteria;
}

/**
 * Search query types
 */
export enum SearchQueryType {
  GENERAL_INFO = 'general-info',
  SPECIFIC_VENUE = 'specific-venue',
  COMPARISON = 'comparison',
  CURRENT_CONDITIONS = 'current-conditions',
  PRICING = 'pricing',
  REVIEWS = 'reviews',
  PRACTICAL_INFO = 'practical-info'
}

/**
 * Search parameters
 */
export interface SearchParameters {
  /** Geographic scope */
  geoScope: string;
  
  /** Time relevance */
  timeRelevance: 'current' | 'seasonal' | 'historical';
  
  /** Language preferences */
  languages: string[];
  
  /** Source quality requirements */
  sourceQuality: 'any' | 'verified' | 'authoritative';
  
  /** Recency requirements */
  recency: 'any' | 'recent' | 'current-year';
}

/**
 * Quality criteria for search results
 */
export interface QualityCriteria {
  /** Minimum relevance score */
  minRelevance: number;
  
  /** Required information completeness */
  completeness: number;
  
  /** Source authority requirements */
  sourceAuthority: 'any' | 'moderate' | 'high';
  
  /** Fact verification requirements */
  factVerification: boolean;
  
  /** Bias detection requirements */
  biasDetection: boolean;
}

/**
 * Priority matrix for information gathering
 */
export interface PriorityMatrix {
  /** High priority items */
  high: InformationRequirement[];
  
  /** Medium priority items */
  medium: InformationRequirement[];
  
  /** Low priority items */
  low: InformationRequirement[];
  
  /** Dependencies between items */
  dependencies: PriorityDependency[];
}

/**
 * Priority dependency
 */
export interface PriorityDependency {
  /** Item that depends */
  dependent: string;
  
  /** Item that is depended on */
  dependency: string;
  
  /** Dependency type */
  type: 'blocks' | 'enhances' | 'validates';
}

// ============================================================================
// Gathered Information Repository
// ============================================================================

/**
 * Gathered Information Repository for the Info Gatherer Agent
 * Contains structured web data collected for travel planning
 */
export interface GatheredInformationRepository {
  /** Repository metadata */
  metadata: RepositoryMetadata;
  
  /** Attraction information */
  attractions: AttractionInfo[];
  
  /** Accommodation information */
  accommodations: AccommodationInfo[];
  
  /** Restaurant information */
  restaurants: RestaurantInfo[];
  
  /** Transportation information */
  transportation: TransportationInfo;
  
  /** Weather information */
  weather: WeatherForecast;
  
  /** Event information */
  events: EventInfo[];
  
  /** Safety information */
  safety: SafetyInfo;
  
  /** Cultural information */
  culture: CulturalInfo;
  
  /** Practical information */
  practical: PracticalInfo;
  
  /** Pricing information */
  pricing: PricingInfo;
  
  /** Data quality metrics */
  quality: DataQualityMetrics;
}

/**
 * Repository metadata
 */
export interface RepositoryMetadata {
  /** Data collection timestamp */
  collectedAt: Date;
  
  /** Data sources used */
  sources: DataSource[];
  
  /** Collection duration */
  collectionDurationMs: number;
  
  /** Success rate */
  successRate: number;
  
  /** Data freshness */
  freshness: 'current' | 'recent' | 'stale';
  
  /** Coverage completeness */
  coverage: number;
}

/**
 * Data source information
 */
export interface DataSource {
  /** Source name */
  name: string;
  
  /** Source URL */
  url: string;
  
  /** Source type */
  type: 'official' | 'commercial' | 'community' | 'review' | 'news';
  
  /** Source reliability */
  reliability: number;
  
  /** Data extracted */
  dataExtracted: string[];
  
  /** Extraction timestamp */
  extractedAt: Date;
}

/**
 * Attraction information
 */
export interface AttractionInfo {
  /** Attraction name */
  name: string;
  
  /** Attraction type */
  type: string;
  
  /** Location */
  location: LocationInfo;
  
  /** Description */
  description: string;
  
  /** Opening hours */
  openingHours: OperatingHours;
  
  /** Pricing */
  pricing: PriceInfo;
  
  /** Rating */
  rating: RatingInfo;
  
  /** Visit duration */
  visitDuration: DurationInfo;
  
  /** Best time to visit */
  bestTimeToVisit: TimeRecommendation;
  
  /** Accessibility information */
  accessibility: AccessibilityInfo;
  
  /** Photos/media */
  media: MediaInfo[];
  
  /** Reviews summary */
  reviews: ReviewSummary;
}

/**
 * Location information
 */
export interface LocationInfo {
  /** Address */
  address: string;
  
  /** Coordinates */
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  
  /** District/area */
  district?: string;
  
  /** Transportation access */
  transportAccess: string[];
  
  /** Nearby landmarks */
  nearbyLandmarks: string[];
}

/**
 * Operating hours
 */
export interface OperatingHours {
  /** Regular hours by day */
  regular: Record<string, string>;
  
  /** Special hours */
  special?: SpecialHours[];
  
  /** Seasonal variations */
  seasonal?: SeasonalHours[];
  
  /** Holiday hours */
  holidays?: HolidayHours[];
}

/**
 * Special hours
 */
export interface SpecialHours {
  /** Date or date range */
  date: string;
  
  /** Hours for this date */
  hours: string;
  
  /** Reason for special hours */
  reason: string;
}

/**
 * Seasonal hours
 */
export interface SeasonalHours {
  /** Season name */
  season: string;
  
  /** Hours during this season */
  hours: Record<string, string>;
  
  /** Date range */
  dateRange: {
    start: string;
    end: string;
  };
}

/**
 * Holiday hours
 */
export interface HolidayHours {
  /** Holiday name */
  holiday: string;
  
  /** Hours (or "closed") */
  hours: string;
  
  /** Holiday date */
  date: string;
}

/**
 * Price information
 */
export interface PriceInfo {
  /** Currency */
  currency: string;
  
  /** Adult price */
  adult?: number;
  
  /** Child price */
  child?: number;
  
  /** Student price */
  student?: number;
  
  /** Senior price */
  senior?: number;
  
  /** Group discounts */
  groupDiscounts?: GroupDiscount[];
  
  /** Free admission conditions */
  freeAdmission?: string[];
  
  /** Price notes */
  notes?: string[];
}

/**
 * Group discount information
 */
export interface GroupDiscount {
  /** Minimum group size */
  minSize: number;
  
  /** Discount percentage */
  discount: number;
  
  /** Special conditions */
  conditions?: string[];
}

/**
 * Rating information
 */
export interface RatingInfo {
  /** Overall rating */
  overall: number;
  
  /** Rating scale */
  scale: number;
  
  /** Number of reviews */
  reviewCount: number;
  
  /** Rating breakdown */
  breakdown?: Record<string, number>;
  
  /** Rating source */
  source: string;
}

/**
 * Duration information
 */
export interface DurationInfo {
  /** Minimum duration */
  min: number;
  
  /** Maximum duration */
  max: number;
  
  /** Recommended duration */
  recommended: number;
  
  /** Duration unit */
  unit: 'minutes' | 'hours' | 'days';
  
  /** Duration notes */
  notes?: string[];
}

/**
 * Time recommendation
 */
export interface TimeRecommendation {
  /** Best time of day */
  timeOfDay: string[];
  
  /** Best days of week */
  daysOfWeek: string[];
  
  /** Best months */
  months: string[];
  
  /** Reasons */
  reasons: string[];
  
  /** Avoid times */
  avoid?: {
    times: string[];
    reasons: string[];
  };
}

/**
 * Accessibility information
 */
export interface AccessibilityInfo {
  /** Wheelchair accessible */
  wheelchairAccessible: boolean;
  
  /** Accessibility features */
  features: string[];
  
  /** Accessibility notes */
  notes?: string[];
  
  /** Contact for accessibility */
  contact?: string;
}

/**
 * Media information
 */
export interface MediaInfo {
  /** Media type */
  type: 'image' | 'video' | 'virtual-tour';
  
  /** Media URL */
  url: string;
  
  /** Caption */
  caption?: string;
  
  /** Credit */
  credit?: string;
  
  /** Alternative text */
  alt?: string;
}

/**
 * Review summary
 */
export interface ReviewSummary {
  /** Total reviews */
  total: number;
  
  /** Average rating */
  averageRating: number;
  
  /** Recent rating trend */
  trend: 'improving' | 'stable' | 'declining';
  
  /** Common positive themes */
  positiveThemes: string[];
  
  /** Common negative themes */
  negativeThemes: string[];
  
  /** Sample reviews */
  sampleReviews: ReviewSample[];
}

/**
 * Review sample
 */
export interface ReviewSample {
  /** Review text snippet */
  text: string;
  
  /** Review rating */
  rating: number;
  
  /** Review date */
  date: string;
  
  /** Reviewer type */
  reviewerType: 'solo' | 'couple' | 'family' | 'business' | 'group';
}

// Continue with similar detailed interfaces for AccommodationInfo, RestaurantInfo, etc...
// This file is getting quite long, so I'll include the essential structures and 
// create additional type files as needed.

// ============================================================================
// Session Persistence Configuration
// ============================================================================

/**
 * Session persistence configuration for Upstash Redis integration
 */
export interface SessionPersistenceConfig {
  /** Storage backend type */
  backend: PersistenceBackend;
  
  /** Redis configuration */
  redis: RedisConfig;
  
  /** Serialization options */
  serialization: SerializationConfig;
  
  /** Compression options */
  compression: CompressionConfig;
  
  /** Backup options */
  backup: BackupConfig;
}

/**
 * Persistence backend options
 */
export enum PersistenceBackend {
  UPSTASH_REDIS = 'upstash-redis',
  MEMORY = 'memory',
  POSTGRES = 'postgres',
  DYNAMODB = 'dynamodb'
}

/**
 * Redis configuration
 */
export interface RedisConfig {
  /** Redis URL */
  url: string;
  
  /** Redis token/password */
  token: string;
  
  /** Key prefix for sessions */
  keyPrefix: string;
  
  /** Default TTL in seconds */
  defaultTtl: number;
  
  /** Connection pool size */
  poolSize?: number;
  
  /** Connection timeout */
  connectTimeout?: number;
  
  /** Command timeout */
  commandTimeout?: number;
}

/**
 * Serialization configuration
 */
export interface SerializationConfig {
  /** Serialization format */
  format: 'json' | 'msgpack' | 'protobuf';
  
  /** Compression enabled */
  compression: boolean;
  
  /** Schema validation */
  validation: boolean;
  
  /** Version tracking */
  versioning: boolean;
}

/**
 * Compression configuration
 */
export interface CompressionConfig {
  /** Compression algorithm */
  algorithm: 'gzip' | 'brotli' | 'lz4';
  
  /** Compression level */
  level: number;
  
  /** Minimum size to compress */
  minSize: number;
}

/**
 * Backup configuration
 */
export interface BackupConfig {
  /** Backup enabled */
  enabled: boolean;
  
  /** Backup frequency */
  frequency: 'never' | 'hourly' | 'daily' | 'weekly';
  
  /** Backup retention */
  retention: number;
  
  /** Backup location */
  location: string;
}

// ============================================================================
// Performance Metrics
// ============================================================================

/**
 * Session performance metrics
 */
export interface SessionPerformanceMetrics {
  /** Workflow metrics */
  workflow: WorkflowPerformanceMetrics;
  
  /** Agent metrics by type */
  agents: Record<AgentType, AgentPerformanceMetrics>;
  
  /** Resource metrics */
  resources: ResourcePerformanceMetrics;
  
  /** Quality metrics */
  quality: QualityPerformanceMetrics;
}

/**
 * Workflow performance metrics
 */
export interface WorkflowPerformanceMetrics {
  /** Total execution time */
  totalExecutionTimeMs: number;
  
  /** Time to first result */
  timeToFirstResultMs: number;
  
  /** Throughput (workflows per hour) */
  throughput: number;
  
  /** Success rate */
  successRate: number;
  
  /** Error rate */
  errorRate: number;
  
  /** Retry rate */
  retryRate: number;
  
  /** Average cost per workflow */
  avgCostPerWorkflow: number;
}

/**
 * Agent performance metrics
 */
export interface AgentPerformanceMetrics {
  /** Execution time statistics */
  executionTime: {
    min: number;
    max: number;
    avg: number;
    p95: number;
    p99: number;
  };
  
  /** Success metrics */
  success: {
    rate: number;
    count: number;
  };
  
  /** Error metrics */
  errors: {
    rate: number;
    count: number;
    byType: Record<string, number>;
  };
  
  /** Cost metrics */
  cost: {
    total: number;
    average: number;
    perToken: number;
  };
  
  /** Token usage */
  tokens: {
    total: number;
    average: number;
    efficiency: number;
  };
}

/**
 * Resource performance metrics
 */
export interface ResourcePerformanceMetrics {
  /** Memory usage */
  memory: {
    peak: number;
    average: number;
    efficiency: number;
  };
  
  /** CPU usage */
  cpu: {
    total: number;
    average: number;
    peak: number;
  };
  
  /** Network usage */
  network: {
    requests: number;
    bytesTransferred: number;
    latency: number;
  };
  
  /** Storage usage */
  storage: {
    reads: number;
    writes: number;
    bytesStored: number;
  };
}

/**
 * Quality performance metrics
 */
export interface QualityPerformanceMetrics {
  /** Data quality scores */
  dataQuality: {
    completeness: number;
    accuracy: number;
    freshness: number;
    relevance: number;
  };
  
  /** Output quality scores */
  outputQuality: {
    structure: number;
    content: number;
    formatting: number;
    personalization: number;
  };
  
  /** User satisfaction (if available) */
  userSatisfaction?: {
    overall: number;
    breakdown: Record<string, number>;
  };
}

/**
 * Data quality metrics for gathered information
 */
export interface DataQualityMetrics {
  /** Completeness score (0-1) */
  completeness: number;
  
  /** Accuracy score (0-1) */
  accuracy: number;
  
  /** Freshness score (0-1) */
  freshness: number;
  
  /** Source reliability average */
  sourceReliability: number;
  
  /** Data coverage percentage */
  coverage: number;
  
  /** Validation results */
  validation: ValidationResults;
}

/**
 * Validation results
 */
export interface ValidationResults {
  /** Total validations performed */
  total: number;
  
  /** Validations passed */
  passed: number;
  
  /** Validations failed */
  failed: number;
  
  /** Validation details */
  details: ValidationDetail[];
}

/**
 * Validation detail
 */
export interface ValidationDetail {
  /** Validation type */
  type: string;
  
  /** Validation result */
  result: 'pass' | 'fail' | 'warning';
  
  /** Validation message */
  message: string;
  
  /** Data field validated */
  field: string;
}

// ============================================================================
// Workflow Results Collection
// ============================================================================

/**
 * Accumulated results from all agents in the workflow
 */
export interface AgentWorkflowResults {
  /** Content planning results */
  contentPlanning: ContentPlanningResult | null;
  
  /** Information gathering results */
  informationGathering: InformationGatheringResult | null;
  
  /** Strategic planning results */
  strategicPlanning: StrategicPlanningResult | null;
  
  /** Content compilation results */
  contentCompilation: ContentCompilationResult | null;
  
  /** Final itinerary output */
  finalItinerary: CompiledItineraryOutput | null;
  
  /** Overall quality score */
  qualityScore: number;
  
  /** Processing metadata */
  processingMetadata: ProcessingMetadata;
}

/**
 * Content planning result structure
 */
export interface ContentPlanningResult {
  /** Analyzed context */
  context: ContentPlanningContext;
  
  /** Generated search queries */
  searchQueries: SearchQuery[];
  
  /** Information requirements */
  requirements: InformationRequirement[];
  
  /** Planning confidence */
  confidence: number;
  
  /** Processing time */
  processingTimeMs: number;
}

/**
 * Information gathering result structure
 */
export interface InformationGatheringResult {
  /** Gathered data repository */
  repository: GatheredInformationRepository;
  
  /** Data quality assessment */
  qualityAssessment: DataQualityMetrics;
  
  /** Gathering confidence */
  confidence: number;
  
  /** Processing time */
  processingTimeMs: number;
}

/**
 * Strategic planning result structure (defined in itinerary.ts)
 */
export interface StrategicPlanningResult {
  /** Strategic recommendations */
  recommendations: unknown; // Will be detailed in itinerary.ts
  
  /** Planning confidence */
  confidence: number;
  
  /** Processing time */
  processingTimeMs: number;
}

/**
 * Content compilation result structure (defined in itinerary.ts) 
 */
export interface ContentCompilationResult {
  /** Compiled itinerary */
  itinerary: unknown; // Will be detailed in itinerary.ts
  
  /** Compilation confidence */
  confidence: number;
  
  /** Processing time */
  processingTimeMs: number;
}

/**
 * Processing metadata for results
 */
export interface ProcessingMetadata {
  /** Total processing time */
  totalProcessingTimeMs: number;
  
  /** Processing start time */
  startedAt: Date;
  
  /** Processing end time */
  completedAt: Date;
  
  /** Agents executed */
  agentsExecuted: AgentType[];
  
  /** Processing warnings */
  warnings: ProcessingWarning[];
  
  /** Resource usage summary */
  resourceUsage: ResourceUsageSummary;
}

/**
 * Processing warning
 */
export interface ProcessingWarning {
  /** Warning type */
  type: string;
  
  /** Warning message */
  message: string;
  
  /** Affected agent */
  agent: AgentType;
  
  /** Warning severity */
  severity: 'low' | 'medium' | 'high';
  
  /** Warning timestamp */
  timestamp: Date;
}

/**
 * Resource usage summary
 */
export interface ResourceUsageSummary {
  /** Total cost */
  totalCost: number;
  
  /** Total tokens */
  totalTokens: number;
  
  /** Peak memory usage */
  peakMemoryMb: number;
  
  /** Total network requests */
  totalNetworkRequests: number;
  
  /** Cost breakdown by agent */
  costByAgent: Record<AgentType, number>;
  
  /** Token breakdown by agent */
  tokensByAgent: Record<AgentType, number>;
}

// ============================================================================
// Zod Validation Schemas
// ============================================================================

/**
 * Zod schema for session metadata validation
 */
export const SessionMetadataSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  expiresAt: z.date(),
  ttl: z.number().positive(),
  clientInfo: z.object({
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    origin: z.string().optional()
  }),
  tags: z.record(z.string()),
  priority: z.nativeEnum(SessionPriority),
  status: z.nativeEnum(SessionStatus)
});

/**
 * Validate session metadata using Zod
 */
export function validateSessionMetadata(data: unknown): SessionMetadata {
  const validated = SessionMetadataSchema.parse(data);
  return validated as SessionMetadata;
}

// ============================================================================
// Default Configurations
// ============================================================================

/**
 * Default session TTL in seconds (6 hours)
 */
export const DEFAULT_SESSION_TTL = 6 * 60 * 60;

/**
 * Default session priority
 */
export const DEFAULT_SESSION_PRIORITY = SessionPriority.NORMAL;

/**
 * Default persistence configuration
 */
export const DEFAULT_PERSISTENCE_CONFIG: Partial<SessionPersistenceConfig> = {
  backend: PersistenceBackend.UPSTASH_REDIS,
  serialization: {
    format: 'json',
    compression: true,
    validation: true,
    versioning: true
  },
  compression: {
    algorithm: 'gzip',
    level: 6,
    minSize: 1024
  }
};
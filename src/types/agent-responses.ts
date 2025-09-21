/**
 * Agent Response Interfaces
 * Type definitions for multi-agent system responses and task management
 */

export interface AgentTask {
  id: string;
  type: AgentType;
  workflowId: string;
  request: any; // ItineraryRequest
  status: TaskStatus;
  input: AgentInput;
  output?: AgentOutput;
  metadata: {
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    retryCount: number;
    maxRetries: number;
  };
}

export type AgentType =
  | 'itinerary-architect'
  | 'web-gatherer'
  | 'information-specialist'
  | 'form-putter';

export type TaskStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface AgentInput {
  formData: any; // EnhancedFormData
  context?: AgentContext;
  dependencies?: string[]; // Task IDs this depends on
}

export interface AgentOutput {
  data: any; // Agent-specific output format
  confidence: number;
  sources: SourceAttribution[];
  processingTime: number;
  recommendations?: string[];
}

export interface AgentContext {
  sessionId: string;
  userPreferences?: UserPreferences;
  previousOutputs?: AgentOutput[];
  workflowState?: WorkflowState;
  smartQueries?: any[]; // SmartQuery[]
  previousResults?: any[]; // Previous agent results
  stage?: string; // Current processing stage
}

export interface UserPreferences {
  language: string;
  currency: string;
  detailLevel: 'basic' | 'detailed' | 'comprehensive';
  creativityLevel: 'conservative' | 'balanced' | 'adventurous';
}

export interface WorkflowState {
  currentStep: string;
  progress: number; // 0-100
  completedTasks: string[];
  pendingTasks: string[];
}

/**
 * Agent-Specific Response Types
 */

export interface ArchitectResponse {
  itineraryStructure: ItineraryStructure;
  recommendations: string[];
  confidence: number;
  processingTime: number;
  sources: SourceAttribution[];
}

export interface GathererResponse {
  gatheredData: GatheredData;
  searchResults: SearchResult[];
  contentExtracts: ContentExtract[];
  confidence: number;
  processingTime: number;
  sources: SourceAttribution[];
}

export interface SpecialistResponse {
  recommendations: SpecialistRecommendation[];
  insights: string[];
  culturalContext: CulturalContext;
  confidence: number;
  processingTime: number;
  sources: SourceAttribution[];
}

export interface PutterResponse {
  formattedItinerary: FormattedItinerary;
  sections: ItinerarySection[];
  metadata: OutputMetadata;
  confidence: number;
  processingTime: number;
  sources: SourceAttribution[];
}

/**
 * Supporting Types for Agent Responses
 */

export interface ItineraryStructure {
  destination: string;
  duration: number;
  travelDates: {
    start: string;
    end: string;
  };
  destinations: Destination[];
  dailySchedule: DailySchedule[];
  transportation: TransportationPlan;
}

export interface Destination {
  name: string;
  type: 'primary' | 'secondary';
  duration: number;
  priority: 'high' | 'medium' | 'low';
}

export interface DailySchedule {
  day: number;
  theme: string;
  activities: Activity[];
  meals: Meal[];
  accommodation?: Accommodation;
}

export interface Activity {
  time: string;
  duration: number;
  name: string;
  category: string;
  location: string;
  cost?: CostEstimate;
}

export interface Meal {
  time: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recommendation?: string;
  cost?: CostEstimate;
}

export interface Accommodation {
  name: string;
  type: string;
  checkIn: string;
  checkOut: string;
  cost?: CostEstimate;
}

export interface TransportationPlan {
  segments: TransportationSegment[];
  totalCost?: CostEstimate;
}

export interface TransportationSegment {
  type: string;
  provider: string;
  route: string;
  departure: string;
  arrival: string;
  duration: number;
  cost?: CostEstimate;
}

export interface CostEstimate {
  amount: number;
  currency: string;
  type: 'estimated' | 'fixed';
  perPerson?: boolean;
}

export interface GatheredData {
  accommodation: AccommodationData[];
  activities: ActivityData[];
  dining: DiningData[];
  transportation: TransportationData[];
  general: GeneralData[];
}

export interface AccommodationData {
  name: string;
  type: string;
  location: string;
  rating?: number;
  priceRange: string;
  amenities: string[];
  description: string;
  bookingUrl?: string;
}

export interface ActivityData {
  name: string;
  category: string;
  location: string;
  duration: string;
  priceRange?: string;
  description: string;
  bookingRequired?: boolean;
  bookingUrl?: string;
}

export interface DiningData {
  name: string;
  cuisine: string;
  location: string;
  priceRange: string;
  rating?: number;
  specialties?: string[];
  description: string;
  bookingUrl?: string;
}

export interface TransportationData {
  type: string;
  provider: string;
  route: string;
  duration: string;
  priceRange?: string;
  description: string;
  bookingUrl?: string;
}

export interface GeneralData {
  category: string;
  title: string;
  content: string;
  source: string;
  relevance: number;
}

export interface SearchResult {
  id: string;
  query: string;
  provider: 'tavily' | 'exa';
  results: SearchItem[];
  metadata: {
    searchedAt: string;
    processingTime: number;
    totalResults: number;
  };
}

export interface SearchItem {
  url: string;
  title: string;
  snippet: string;
  relevanceScore: number;
  source: string;
  publishedDate?: string;
}

export interface ContentExtract {
  id: string;
  sourceUrl: string;
  extractedAt: string;
  content: {
    text: string;
    images?: ImageReference[];
    structured?: StructuredData;
  };
  metadata: {
    wordCount: number;
    language: string;
    reliability: number; // 0-1 scale
  };
}

export interface ImageReference {
  url: string;
  alt: string;
  caption?: string;
}

export interface StructuredData {
  type: string;
  data: any;
}

export interface SpecialistRecommendation {
  type: 'activity' | 'dining' | 'accommodation' | 'transportation';
  name: string;
  reason: string;
  confidence: number;
  alternatives?: string[];
}

export interface CulturalContext {
  localCustoms: string[];
  seasonalConsiderations: string[];
  languageTips: string[];
  currency: string;
  timeZone: string;
}

export interface FormattedItinerary {
  metadata: ItineraryMetadata;
  content: ItineraryContent;
}

export interface ItineraryMetadata {
  title: string;
  summary: string;
  duration: number;
  estimatedCost: CostEstimate;
  generatedAt: string;
  version: string;
}

export interface ItineraryContent {
  overview: OverviewSection;
  dailySchedule: DailySchedule[];
  accommodation: AccommodationSection;
  activities: ActivitiesSection;
  dining: DiningSection;
  transportation: TransportationSection;
  practicalInfo: PracticalInfoSection;
}

export interface OverviewSection {
  summary: string;
  highlights: string[];
  bestTime: string;
  budget: CostEstimate;
}

export interface AccommodationSection {
  recommendations: AccommodationData[];
  bookingTips: string[];
}

export interface ActivitiesSection {
  recommendations: ActivityData[];
  dailySuggestions: DailyActivity[];
}

export interface DailyActivity {
  day: number;
  activities: ActivityData[];
  theme: string;
}

export interface DiningSection {
  recommendations: DiningData[];
  mealPlan: MealPlan[];
}

export interface MealPlan {
  day: number;
  meals: Meal[];
}

export interface TransportationSection {
  overview: string;
  segments: TransportationSegment[];
  tips: string[];
}

export interface PracticalInfoSection {
  visa: string[];
  currency: string;
  language: string;
  safety: string[];
  emergency: EmergencyContact[];
}

export interface EmergencyContact {
  type: string;
  name: string;
  phone: string;
  address?: string;
}

export interface ItinerarySection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface OutputMetadata {
  format: 'html' | 'markdown' | 'json';
  sections: string[];
  wordCount: number;
  processingTime: number;
}

export interface SourceAttribution {
  type: 'search' | 'api' | 'database';
  provider?: string;
  url?: string;
  retrievedAt: string;
  reliability: number; // 0-1 scale
}

/**
 * Validation Rules:
 * - workflowId must reference valid workflow
 * - retryCount <= maxRetries (default 3)
 * - dependencies must reference existing tasks
 * - confidence between 0 and 1
 * - reliability between 0 and 1
 */

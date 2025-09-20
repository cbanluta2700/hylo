/**
 * Enhanced Itinerary Display Component - Advanced presentation of AI-generated travel itineraries
 * Provides rich formatting, interactive elements, and comprehensive travel information display
 */

import React, { useState, useMemo, useCallback } from 'react';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Calendar, 
  Star,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Bookmark,
  Share2,
  Download,
  Eye,
  EyeOff,
  Heart,
  Navigation,
  Info,
  AlertCircle,
  Camera,
  Utensils,
  Bed,
  Car,
  Plane,
  Train
} from 'lucide-react';

/**
 * Comprehensive itinerary data structure
 */
export interface EnhancedItinerary {
  id: string;
  tripSummary: {
    nickname: string;
    destination: string;
    startDate: string;
    endDate: string;
    duration: number;
    travelers: {
      adults: number;
      children: number;
    };
    budget: {
      total: number;
      mode: 'per-person' | 'total' | 'flexible';
      breakdown?: {
        accommodation: number;
        food: number;
        activities: number;
        transportation: number;
        misc: number;
      };
    };
    travelStyle: string;
  };
  preparedFor: {
    name: string;
    preferences: string[];
  };
  dailyItinerary: DayItinerary[];
  tips: TravelTip[];
  metadata: {
    generatedBy: string;
    generatedAt: string;
    dataSourcesCount: number;
    vectorOperations: number;
    searchQueries: number;
    confidence: number; // 0-100
    lastUpdated: string;
  };
  sources?: DataSource[];
}

/**
 * Daily itinerary structure
 */
export interface DayItinerary {
  day: number;
  date: string;
  theme?: string;
  totalBudget?: number;
  activities: Activity[];
  meals: Meal[];
  accommodation?: Accommodation;
  transportation?: Transportation[];
  notes?: string[];
}

/**
 * Activity information
 */
export interface Activity {
  id: string;
  name: string;
  type: 'attraction' | 'activity' | 'experience' | 'cultural' | 'adventure' | 'relaxation';
  location: string;
  coordinates?: { lat: number; lng: number };
  duration: string;
  startTime?: string;
  endTime?: string;
  cost: number;
  currency: string;
  rating?: number;
  description: string;
  tips?: string[];
  bookingRequired: boolean;
  bookingUrl?: string;
  images?: string[];
  aiGenerated: boolean;
  confidence: number;
}

/**
 * Meal information
 */
export interface Meal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  location: string;
  cuisine: string;
  cost: number;
  currency: string;
  rating?: number;
  description: string;
  dietaryInfo?: string[];
  reservationRequired: boolean;
  reservationUrl?: string;
  aiGenerated: boolean;
}

/**
 * Accommodation information
 */
export interface Accommodation {
  id: string;
  name: string;
  type: string;
  location: string;
  checkIn: string;
  checkOut: string;
  cost: number;
  currency: string;
  rating?: number;
  amenities: string[];
  description: string;
  bookingUrl?: string;
  aiGenerated: boolean;
}

/**
 * Transportation information
 */
export interface Transportation {
  id: string;
  type: 'flight' | 'train' | 'bus' | 'car' | 'taxi' | 'metro' | 'walking';
  from: string;
  to: string;
  departureTime?: string;
  arrivalTime?: string;
  duration: string;
  cost: number;
  currency: string;
  provider?: string;
  bookingRequired: boolean;
  bookingUrl?: string;
  notes?: string;
}

/**
 * Travel tip information
 */
export interface TravelTip {
  id: string;
  category: 'general' | 'transportation' | 'dining' | 'cultural' | 'safety' | 'budget' | 'packing';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  applicable: string[]; // days or 'all'
  aiGenerated: boolean;
  confidence: number;
}

/**
 * Data source information
 */
export interface DataSource {
  id: string;
  name: string;
  url: string;
  type: 'web' | 'api' | 'database' | 'user_input';
  lastAccessed: string;
  reliability: number; // 0-100
}

/**
 * Props for Enhanced Itinerary Display
 */
interface EnhancedItineraryDisplayProps {
  itinerary: EnhancedItinerary;
  className?: string;
  showMetadata?: boolean;
  showSources?: boolean;
  interactive?: boolean;
  onActivityClick?: (activity: Activity) => void;
  onMealClick?: (meal: Meal) => void;
  onBookmarkToggle?: (itemId: string, itemType: 'activity' | 'meal' | 'accommodation') => void;
  onShare?: (itinerary: EnhancedItinerary) => void;
  onDownload?: (itinerary: EnhancedItinerary) => void;
  bookmarkedItems?: Set<string>;
}

/**
 * Activity type icons
 */
const ACTIVITY_ICONS = {
  attraction: MapPin,
  activity: Star,
  experience: Camera,
  cultural: Info,
  adventure: Navigation,
  relaxation: Heart
};

/**
 * Transportation icons
 */
const TRANSPORT_ICONS = {
  flight: Plane,
  train: Train,
  bus: Car,
  car: Car,
  taxi: Car,
  metro: Train,
  walking: Navigation
};

/**
 * Enhanced Itinerary Display Component
 */
export const EnhancedItineraryDisplay: React.FC<EnhancedItineraryDisplayProps> = ({
  itinerary,
  className = '',
  showMetadata = true,
  showSources = false,
  interactive = true,
  onActivityClick,
  onMealClick,
  onBookmarkToggle,
  onShare,
  onDownload,
  bookmarkedItems = new Set()
}) => {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1])); // First day expanded by default
  const [showAiGenerated, setShowAiGenerated] = useState(true);
  const [selectedTipCategory, setSelectedTipCategory] = useState<string>('all');

  /**
   * Toggle day expansion
   */
  const toggleDayExpansion = useCallback((day: number) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(day)) {
        newSet.delete(day);
      } else {
        newSet.add(day);
      }
      return newSet;
    });
  }, []);

  /**
   * Calculate total trip cost
   */
  const totalCost = useMemo(() => {
    let total = 0;
    itinerary.dailyItinerary.forEach(day => {
      day.activities.forEach(activity => total += activity.cost);
      day.meals.forEach(meal => total += meal.cost);
      if (day.accommodation) total += day.accommodation.cost;
      day.transportation?.forEach(transport => total += transport.cost);
    });
    return total;
  }, [itinerary]);

  /**
   * Filter tips by category
   */
  const filteredTips = useMemo(() => {
    if (selectedTipCategory === 'all') return itinerary.tips;
    return itinerary.tips.filter(tip => tip.category === selectedTipCategory);
  }, [itinerary.tips, selectedTipCategory]);

  /**
   * Format date display
   */
  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  /**
   * Format currency
   */
  const formatCurrency = useCallback((amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  }, []);

  /**
   * Get confidence color
   */
  const getConfidenceColor = useCallback((confidence: number): string => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      {/* Header Section */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{itinerary.tripSummary.nickname}</h1>
            <p className="text-lg text-gray-600">{itinerary.tripSummary.destination}</p>
          </div>
          
          {interactive && (
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => onShare?.(itinerary)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Share itinerary"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => onDownload?.(itinerary)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Download itinerary"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Trip Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {itinerary.tripSummary.duration} days
              </div>
              <div className="text-xs text-gray-600">
                {formatDate(itinerary.tripSummary.startDate)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {itinerary.tripSummary.travelers.adults + itinerary.tripSummary.travelers.children} travelers
              </div>
              <div className="text-xs text-gray-600">
                {itinerary.tripSummary.travelers.adults} adults
                {itinerary.tripSummary.travelers.children > 0 && `, ${itinerary.tripSummary.travelers.children} children`}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-gray-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {formatCurrency(totalCost)}
              </div>
              <div className="text-xs text-gray-600">
                {itinerary.tripSummary.budget.mode}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-gray-500" />
            <div>
              <div className="text-sm font-medium text-gray-900 capitalize">
                {itinerary.tripSummary.travelStyle}
              </div>
              <div className="text-xs text-gray-600">travel style</div>
            </div>
          </div>
        </div>

        {/* Prepared For Section */}
        {itinerary.preparedFor.name && (
          <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
            <div className="text-sm font-medium text-gray-900 mb-1">
              Prepared for: {itinerary.preparedFor.name}
            </div>
            {itinerary.preparedFor.preferences.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {itinerary.preparedFor.preferences.map((pref, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {pref}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      {interactive && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAiGenerated(!showAiGenerated)}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
              >
                {showAiGenerated ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>AI Generated Items</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setExpandedDays(new Set(itinerary.dailyItinerary.map(day => day.day)))}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Expand All
              </button>
              <button
                onClick={() => setExpandedDays(new Set())}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Itinerary */}
      <div className="divide-y divide-gray-200">
        {itinerary.dailyItinerary.map((day) => (
          <div key={day.day} className="p-6">
            {/* Day Header */}
            <div 
              className={`flex items-center justify-between mb-4 ${interactive ? 'cursor-pointer' : ''}`}
              onClick={() => interactive && toggleDayExpansion(day.day)}
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-medium">
                  {day.day}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Day {day.day} {day.theme && `- ${day.theme}`}
                  </h3>
                  <p className="text-sm text-gray-600">{formatDate(day.date)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {day.totalBudget && (
                  <span className="text-sm text-gray-600">
                    {formatCurrency(day.totalBudget)}
                  </span>
                )}
                {interactive && (
                  expandedDays.has(day.day) ? 
                    <ChevronUp className="w-5 h-5 text-gray-400" /> :
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Day Content */}
            {expandedDays.has(day.day) && (
              <div className="space-y-4">
                {/* Accommodation */}
                {day.accommodation && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2 mb-2">
                        <Bed className="w-5 h-5 text-green-600" />
                        <h4 className="font-medium text-green-800">Accommodation</h4>
                      </div>
                      {day.accommodation.aiGenerated && showAiGenerated && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          AI Generated
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-green-700">
                      <p className="font-medium">{day.accommodation.name}</p>
                      <p>{day.accommodation.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span>{formatCurrency(day.accommodation.cost)}</span>
                        {day.accommodation.rating && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span>{day.accommodation.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Activities */}
                {day.activities.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-gray-500" />
                      Activities
                    </h4>
                    <div className="space-y-3">
                      {day.activities
                        .filter(activity => showAiGenerated || !activity.aiGenerated)
                        .map((activity) => {
                          const ActivityIcon = ACTIVITY_ICONS[activity.type] || Star;
                          const isBookmarked = bookmarkedItems.has(activity.id);
                          
                          return (
                            <div 
                              key={activity.id} 
                              className={`p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-all ${
                                interactive && onActivityClick ? 'cursor-pointer hover:bg-gray-50' : ''
                              }`}
                              onClick={() => onActivityClick?.(activity)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <ActivityIcon className="w-5 h-5 text-blue-600" />
                                  <h5 className="font-medium text-gray-900">{activity.name}</h5>
                                  {activity.aiGenerated && showAiGenerated && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                      AI
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  {interactive && onBookmarkToggle && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onBookmarkToggle(activity.id, 'activity');
                                      }}
                                      className={`p-1 rounded ${isBookmarked ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                                    >
                                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                                    </button>
                                  )}
                                  <span className={`text-xs ${getConfidenceColor(activity.confidence)}`}>
                                    {activity.confidence}%
                                  </span>
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                              
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center space-x-4">
                                  <span className="flex items-center space-x-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>{activity.location}</span>
                                  </span>
                                  <span className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{activity.duration}</span>
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-900">
                                    {formatCurrency(activity.cost, activity.currency)}
                                  </span>
                                  {activity.rating && (
                                    <div className="flex items-center space-x-1">
                                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                      <span>{activity.rating.toFixed(1)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {activity.bookingRequired && (
                                <div className="mt-2 flex items-center space-x-2 text-xs text-orange-600">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>Booking required</span>
                                  {activity.bookingUrl && (
                                    <a 
                                      href={activity.bookingUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Book now
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Meals */}
                {day.meals.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Utensils className="w-5 h-5 mr-2 text-gray-500" />
                      Meals
                    </h4>
                    <div className="space-y-3">
                      {day.meals
                        .filter(meal => showAiGenerated || !meal.aiGenerated)
                        .map((meal) => (
                          <div 
                            key={meal.id}
                            className={`p-3 bg-orange-50 border border-orange-200 rounded-lg ${
                              interactive && onMealClick ? 'cursor-pointer hover:bg-orange-100' : ''
                            }`}
                            onClick={() => onMealClick?.(meal)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-medium text-orange-900 capitalize">{meal.type}</h5>
                              <span className="text-sm font-medium text-orange-900">
                                {formatCurrency(meal.cost, meal.currency)}
                              </span>
                            </div>
                            <p className="text-sm text-orange-800 font-medium">{meal.name}</p>
                            <p className="text-sm text-orange-700">{meal.description}</p>
                            <div className="mt-1 text-xs text-orange-600">
                              {meal.location} • {meal.cuisine}
                              {meal.rating && (
                                <>
                                  {' • '}
                                  <span className="inline-flex items-center">
                                    <Star className="w-3 h-3 text-yellow-500 fill-current mr-1" />
                                    {meal.rating.toFixed(1)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Transportation */}
                {day.transportation && day.transportation.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Car className="w-5 h-5 mr-2 text-gray-500" />
                      Transportation
                    </h4>
                    <div className="space-y-2">
                      {day.transportation.map((transport) => {
                        const TransportIcon = TRANSPORT_ICONS[transport.type] || Car;
                        return (
                          <div key={transport.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <TransportIcon className="w-4 h-4 text-gray-600" />
                              <span className="text-sm text-gray-900">
                                {transport.from} → {transport.to}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({transport.duration})
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(transport.cost, transport.currency)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Day Notes */}
                {day.notes && day.notes.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                      <Info className="w-4 h-4 mr-1" />
                      Notes for Day {day.day}
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {day.notes.map((note, index) => (
                        <li key={index}>• {note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Travel Tips Section */}
      {itinerary.tips.length > 0 && (
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tips for Your Trip</h3>
            <select
              value={selectedTipCategory}
              onChange={(e) => setSelectedTipCategory(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="transportation">Transportation</option>
              <option value="dining">Dining</option>
              <option value="cultural">Cultural</option>
              <option value="safety">Safety</option>
              <option value="budget">Budget</option>
              <option value="packing">Packing</option>
            </select>
          </div>
          
          <div className="grid gap-3">
            {filteredTips.map((tip) => (
              <div key={tip.id} className="p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900">{tip.title}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      tip.priority === 'high' ? 'bg-red-100 text-red-800' :
                      tip.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {tip.priority}
                    </span>
                    {tip.aiGenerated && showAiGenerated && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        AI
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700">{tip.description}</p>
                <div className="mt-1 text-xs text-gray-500 capitalize">
                  {tip.category} • Applies to: {tip.applicable.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata Section */}
      {showMetadata && (
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generation Metadata</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Generated by:</span>
              <span className="ml-1 font-medium text-gray-900">{itinerary.metadata.generatedBy}</span>
            </div>
            <div>
              <span className="text-gray-500">Data sources:</span>
              <span className="ml-1 font-medium text-gray-900">{itinerary.metadata.dataSourcesCount}</span>
            </div>
            <div>
              <span className="text-gray-500">Vector operations:</span>
              <span className="ml-1 font-medium text-gray-900">{itinerary.metadata.vectorOperations}</span>
            </div>
            <div>
              <span className="text-gray-500">Search queries:</span>
              <span className="ml-1 font-medium text-gray-900">{itinerary.metadata.searchQueries}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <span className="text-gray-500">Overall confidence:</span>
                <span className={`ml-1 font-medium ${getConfidenceColor(itinerary.metadata.confidence)}`}>
                  {itinerary.metadata.confidence}%
                </span>
              </div>
              <div>
                <span className="text-gray-500">Last updated:</span>
                <span className="ml-1 font-medium text-gray-900">
                  {new Date(itinerary.metadata.lastUpdated).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Sources */}
      {showSources && itinerary.sources && itinerary.sources.length > 0 && (
        <div className="p-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Sources</h3>
          <div className="space-y-2">
            {itinerary.sources.map((source) => (
              <div key={source.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{source.name}</span>
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="text-xs text-gray-500">
                  Reliability: {source.reliability}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedItineraryDisplay;
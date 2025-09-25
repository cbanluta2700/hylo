/**
 * Direct Itinerary Display - No Polling Required
 * 
 * Since the AI workflow now returns the complete itinerary immediately,
 * we just display it directly without any polling complexity.
 */

import React, { useState, useEffect } from 'react';
import { Download, Mail, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import ResilientLoading from './ResilientLoading';
import type { TravelFormData } from '../types/travel-form';
import type { FormData } from './TripDetails/types';

interface ItineraryDisplayProps {
  formData?: TravelFormData | null;
  originalFormData?: FormData;
  isLoading: boolean;
  error?: string;
  aiItinerary?: any;
  className?: string;
}

const PersonalizedItineraryTitle: React.FC = () => (
  <div className="text-center mb-6">
    <h1 className="text-3xl font-bold font-raleway">
      <span className="text-[#ece8de]">YOUR </span>
      <span className="text-[#f9dd8b]">PERSONALIZED </span>
      <span className="text-[#ece8de]">ITINERARY</span>
    </h1>
  </div>
);

const SectionHeader: React.FC<{ icon?: string; title: string }> = ({ icon, title }) => (
  <div className="bg-form-box rounded-[36px] p-6 shadow-lg border border-gray-200 mb-6">
    <h2 className="text-2xl font-bold text-primary font-raleway flex items-center">
      {icon && <span className="mr-3">{icon}</span>}
      {title}
    </h2>
  </div>
);

const TipsSection: React.FC<{ tips: string; isLoading?: boolean }> = ({ tips, isLoading = false }) => (
  <div className="mb-8">
    {/* Tips Header */}
    <SectionHeader icon="💡" title="TIPS FOR YOUR TRIP" />
    
    {/* Tips Content */}
    <div className="bg-form-box rounded-[36px] p-8 shadow-lg border border-gray-200">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-gray-600">Generating personalized tips...</span>
        </div>
      ) : (
        <div className="prose prose-lg max-w-none">
          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
            {tips}
          </div>
        </div>
      )}
    </div>
  </div>
);

// Parse itinerary content into structured days
const parseItineraryContent = (content: string) => {
  const lines = content.split('\n');
  const days: { title: string; content: string }[] = [];
  let currentDay: { title: string; content: string } | null = null;
  let generalInfo = '';
  let finalTips = '';
  let inFinalTips = false;
  let inGeneralTips = false;
  let skipUntilDay = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip everything until we hit the first Day
    if (!skipUntilDay) {
      // Look for first day to start processing - updated pattern for "Day X:" format
      const dayMatch = line.match(/^(Day\s*\d+:|DAY\s*\d+:|\d+\.\s*Day|\d+\s*-\s*Day|#{1,4}\s*Day\s*\d+)/i);
      if (dayMatch) {
        skipUntilDay = true;
        // Process this day line
      } else {
        continue; // Skip everything before first day (including overview)
      }
    }
    
    // Check for Final Tips or General Tips sections
    if (line.match(/\*\*Final Tips\*\*|Final Tips:|### Final Tips|## Final Tips/i)) {
      inFinalTips = true;
      inGeneralTips = false;
      finalTips += line + '\n';
      continue;
    }
    
    if (line.match(/\*\*General Tips\*\*|General Tips:|### General Tips|## General Tips/i)) {
      inGeneralTips = true;
      inFinalTips = false;
      finalTips += line + '\n';
      continue;
    }
    
    // If we're in any tips section, collect all content
    if (inFinalTips || inGeneralTips) {
      finalTips += line + '\n';
      continue;
    }
    
    // Check if line contains day information - updated pattern for "Day X:" format
    const dayMatch = line.match(/^(Day\s*\d+:|DAY\s*\d+:|\d+\.\s*Day|\d+\s*-\s*Day|#{1,4}\s*Day\s*\d+)/i);
    
    if (dayMatch) {
      // Save previous day if exists
      if (currentDay) {
        // Format the day content into production-ready format
        currentDay.content = formatDayContentToProduction(currentDay.content);
        days.push(currentDay);
      }
      // Start new day - clean title by removing ### and Day numbering
      const cleanTitle = line
        .replace(/^#{1,6}\s*/, '') // Remove markdown headers ###
        .replace(/^Day\s*\d+:\s*/i, '') // Remove "Day X:" prefix
        .trim();
      
      currentDay = {
        title: cleanTitle,
        content: ''
      };
    } else if (currentDay) {
      // Add content to current day
      currentDay.content += line + '\n';
    }
  }
  
  // Add last day with formatting
  if (currentDay) {
    currentDay.content = formatDayContentToProduction(currentDay.content);
    days.push(currentDay);
  }
  
  return { 
    generalInfo: generalInfo.trim(), 
    days, 
    finalTips: finalTips.trim() 
  };
};

// Format day content into production-ready format
const formatDayContentToProduction = (content: string): string => {
  const lines = content.split('\n');
  let formatted = '';
  let inRecommendations = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      formatted += '\n';
      continue;
    }
    
    // Clean up Theme line - handle various markdown patterns
    if (trimmedLine.match(/^\*+Theme\**/i)) {
      const cleanTheme = trimmedLine
        .replace(/^\*+Theme\*+:?\s*/i, '') // Remove *Theme**: or **Theme**: or *Theme**:
        .replace(/\*+$/, ''); // Remove trailing asterisks
      formatted += `**Theme**: ${cleanTheme}\n\n`;
      continue;
    }
    
    // Clean up time section headers - remove ** and keep bold formatting
    if (trimmedLine.match(/^\*\*(Morning|Afternoon|Evening)\*\*$/i)) {
      const sectionName = trimmedLine.replace(/\*\*/g, '');
      formatted += `**${sectionName}**\n`;
      continue;
    }
    
    // Detect recommendations sections - handle malformed asterisks
    if (trimmedLine.match(/\*+Recommendations\**/i) || 
        (trimmedLine.match(/recommendations|suggested|tips for|where to/i) && trimmedLine.includes('•'))) {
      inRecommendations = true;
      formatted += `**Recommendations:**\n`;
      // Process the recommendation line if it has content after the header
      const afterHeader = trimmedLine.replace(/^\*+Recommendations\*+:?\s*/i, '');
      if (afterHeader && afterHeader.includes('•')) {
        const cleanRec = cleanActivityLine(afterHeader);
        if (cleanRec) {
          formatted += `• ${cleanRec}\n`;
        }
      }
      continue;
    }
    
    // Clean regular activity lines
    const cleanLine = cleanActivityLine(trimmedLine);
    if (cleanLine) {
      // Add bullet if not present
      if (!cleanLine.startsWith('•')) {
        formatted += `• ${cleanLine}\n`;
      } else {
        formatted += `${cleanLine}\n`;
      }
    } else {
      formatted += `${trimmedLine}\n`;
    }
  }
  
  return formatted.trim();
};

// Clean individual activity lines
const cleanActivityLine = (line: string): string => {
  // Remove bullet symbols and clean formatting
  let cleaned = line
    .replace(/^[•\-\*]\s*/, '') // Remove leading bullets
    .replace(/^\d+\.\s*/, '') // Remove numbered list markers
    .replace(/^#{1,6}\s*/, ''); // Remove markdown headers
    
  // Clean up bold markdown but preserve content structure
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '**$1**'); // Keep intentional bold
  
  // Don't include lines that are just formatting, costs summaries, or section headers
  if (cleaned.match(/^(Theme|Daily Costs|Total|Morning|Afternoon|Evening)(\s*:|\s*$)/i)) {
    return '';
  }
  
  // Don't include empty or very short lines
  if (cleaned.length < 10) {
    return '';
  }
  
  return cleaned;
};

const DaySection: React.FC<{ day: { title: string; content: string }; dayNumber: number }> = ({ day, dayNumber }) => (
  <div className="mb-8">
    {/* Day Header */}
    <div className="bg-form-box border border-gray-200 rounded-t-[24px] px-6 py-4">
      <h3 className="text-xl font-bold text-primary font-raleway flex items-center">
        <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
          {dayNumber}
        </span>
        {day.title}
      </h3>
    </div>
    
    {/* Day Content */}
    <div className="bg-form-box rounded-b-[24px] border border-t-0 border-gray-200 p-6">
      <div className="prose prose-lg max-w-none">
        <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
          {day.content.trim()}
        </div>
      </div>
    </div>
  </div>
);

const ItineraryContent: React.FC<{ content: string; onFinalTipsExtracted?: (tips: string) => void }> = ({ content, onFinalTipsExtracted }) => {
  const { generalInfo, days, finalTips } = parseItineraryContent(content);
  
  // Notify parent about extracted final tips
  React.useEffect(() => {
    if (finalTips && onFinalTipsExtracted) {
      onFinalTipsExtracted(finalTips);
    }
  }, [finalTips, onFinalTipsExtracted]);
  
  return (
    <div>
      {/* General Information */}
      {generalInfo && (
        <div className="bg-form-box rounded-[36px] p-8 shadow-lg border border-gray-200 mb-6">
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {generalInfo}
            </div>
          </div>
        </div>
      )}
      
      {/* Structured Days */}
      {days.length > 0 ? (
        <div className="space-y-2">
          {days.map((day, index) => (
            <DaySection key={index} day={day} dayNumber={index + 1} />
          ))}
        </div>
      ) : (
        /* Fallback to original content if no days found */
        <div className="bg-form-box rounded-[36px] p-8 shadow-lg border border-gray-200 mb-6">
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ItineraryDisplayDirect: React.FC<ItineraryDisplayProps> = ({
  formData,
  originalFormData,
  isLoading,
  error,
  aiItinerary,
  className = '',
}) => {
  const [tips, setTips] = useState<string>('');
  const [tipsLoading, setTipsLoading] = useState(false);
  const [tipsError, setTipsError] = useState('');
  const [extractedTips, setExtractedTips] = useState<string>('');

  // Handle extracted final tips from itinerary content
  const handleFinalTipsExtracted = (finalTips: string) => {
    if (finalTips && !extractedTips) {
      setExtractedTips(finalTips);
      console.log('📋 [TIPS] Extracted final tips from itinerary:', finalTips.slice(0, 100));
    }
  };

  // Generate personalized tips when itinerary is ready
  useEffect(() => {
    const generateTips = async () => {
      if (!aiItinerary || !formData || tipsLoading || tips || extractedTips) return;
      
      setTipsLoading(true);
      setTipsError('');
      
      try {
        console.log('🎯 [TIPS] Checking if tips need generation...');
        
        const response = await fetch('/api/itinerary/generate-tips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formData,
            aiItinerary
          }),
        });

        const result = await response.json() as any;
        
        if (result.success) {
          if (result.skipped) {
            console.log('✅ [TIPS] Tips already included in itinerary - using extracted tips');
          } else {
            setTips(result.tips);
            console.log('✅ [TIPS] Personalized tips generated');
          }
        } else {
          setTipsError('Failed to generate tips');
          console.error('❌ [TIPS] Generation failed:', result.error);
        }
      } catch (error) {
        setTipsError('Failed to generate tips');
        console.error('❌ [TIPS] Error:', error);
      } finally {
        setTipsLoading(false);
      }
    };

    generateTips();
  }, [aiItinerary, formData, extractedTips]);

  // Show error state
  if (error) {
    return (
      <div className={`${className} p-6`}>
        <div className="bg-red-50 border border-red-200 rounded-[36px] p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <div className="text-red-600 text-xl font-bold mb-4">Generation Failed</div>
          <div className="text-red-700 mb-4">{error}</div>
          <div className="text-sm text-red-600">
            Please try again or contact support if the issue persists.
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={`${className} p-6`}>
        <div className="bg-form-box rounded-[36px] p-8 text-center border border-gray-200">
          <ResilientLoading isLoading={true} />
          <div className="mt-6">
            <h3 className="text-2xl font-bold text-primary font-raleway mb-4">
              <span className="text-[#f9dd8b]">XAI GROK</span> CRAFTING YOUR ITINERARY
            </h3>
            <div className="text-gray-700">
              ✨ Creating your personalized travel experience...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success state with itinerary
  if (aiItinerary) {
    return (
      <div className={`${className} p-6`}>
        <PersonalizedItineraryTitle />
        
        {/* Trip Overview */}
        <SectionHeader icon="📍" title={`TRIP SUMMARY | ${formData?.nickname || 'My Trip'}`} />
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-form-box rounded-[24px] p-4 text-center border border-gray-200">
            <MapPin className="w-6 h-6 text-primary mx-auto mb-2" />
            <div className="font-bold text-primary">Destination</div>
            <div className="text-gray-700">{aiItinerary.destination || formData?.location}</div>
          </div>
          <div className="bg-form-box rounded-[24px] p-4 text-center border border-gray-200">
            <div className="text-2xl mb-2">📅</div>
            <div className="font-bold text-primary">Dates</div>
            <div className="text-gray-700">
              {formData?.flexibleDates 
                ? `Flexible (${formData?.plannedDays || aiItinerary.duration} days)`
                : `${formData?.departDate || 'TBD'} - ${formData?.returnDate || 'TBD'}`
              }
            </div>
          </div>
          <div className="bg-form-box rounded-[24px] p-4 text-center border border-gray-200">
            <div className="text-2xl mb-2">👥</div>
            <div className="font-bold text-primary">Travelers</div>
            <div className="text-gray-700">
              {formData?.adults || aiItinerary.travelers} adults
              {formData?.children && formData?.children > 0 ? `, ${formData.children} children` : ''}
            </div>
          </div>
          <div className="bg-form-box rounded-[24px] p-4 text-center border border-gray-200">
            <div className="text-2xl mb-2">💰</div>
            <div className="font-bold text-primary">Budget</div>
            <div className="text-gray-700">
              {formData?.budget?.flexibility === 'flexible' || formData?.budget?.flexibility === 'very-flexible' ? (
                <>My budget is flexible</>
              ) : (
                <>${(formData?.budget?.total?.toLocaleString() || 'N/A')} {formData?.budget?.currency || 'USD'}</>
              )}
            </div>
          </div>
          <div className="bg-form-box rounded-[24px] p-4 text-center border border-gray-200">
            <div className="text-2xl mb-2">👤</div>
            <div className="font-bold text-primary">Prepared for</div>
            <div className="text-gray-700">
              {originalFormData?.contactInfo?.name?.trim() ||
               originalFormData?.contactInfo?.trim() ||
               originalFormData?.contactName?.trim() ||
               (formData?.location ? `${formData.location} Traveler` : 'Traveler')}
            </div>
          </div>
        </div>

        {/* Main Itinerary Content */}
        <SectionHeader icon="📋" title="Your Detailed Itinerary" />
        <ItineraryContent 
          content={aiItinerary.content || 'No content available'} 
          onFinalTipsExtracted={handleFinalTipsExtracted}
        />

        {/* Personalized Tips Section */}
        {(extractedTips || tips || tipsLoading) && (
          <TipsSection 
            tips={extractedTips || tips || 'Generating personalized tips based on your preferences...'}
            isLoading={tipsLoading && !extractedTips}
          />
        )}

        {/* Tips Error State */}
        {tipsError && !tips && !extractedTips && !tipsLoading && (
          <div className="mb-8">
            <SectionHeader icon="💡" title="TIPS FOR YOUR TRIP" />
            <div className="bg-yellow-50 rounded-[36px] p-6 border border-yellow-200 text-center">
              <div className="text-yellow-800">
                Could not generate personalized tips. Please try refreshing the page.
              </div>
            </div>
          </div>
        )}

        {/* Additional Information */}
        {(aiItinerary.architecture || aiItinerary.research || aiItinerary.recommendations) && (
          <>
            <SectionHeader icon="🔍" title="AI Research & Planning" />
            
            {aiItinerary.architecture && (
              <div className="bg-blue-50 rounded-[36px] p-6 mb-4 border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-3">🏗️ Architecture Planning</h4>
                <div className="text-blue-700 text-sm whitespace-pre-wrap">
                  {typeof aiItinerary.architecture === 'string' 
                    ? aiItinerary.architecture.slice(0, 300) + '...'
                    : 'Architecture data available'
                  }
                </div>
              </div>
            )}

            {aiItinerary.research && (
              <div className="bg-purple-50 rounded-[36px] p-6 mb-4 border border-purple-200">
                <h4 className="font-bold text-purple-800 mb-3">📚 Research Findings</h4>
                <div className="text-purple-700 text-sm whitespace-pre-wrap">
                  {typeof aiItinerary.research === 'string' 
                    ? aiItinerary.research.slice(0, 300) + '...'
                    : 'Research data available'
                  }
                </div>
              </div>
            )}

            {aiItinerary.recommendations && (
              <div className="bg-orange-50 rounded-[36px] p-6 mb-4 border border-orange-200">
                <h4 className="font-bold text-orange-800 mb-3">👨‍💼 Specialist Recommendations</h4>
                <div className="text-orange-700 text-sm whitespace-pre-wrap">
                  {typeof aiItinerary.recommendations === 'string' 
                    ? aiItinerary.recommendations.slice(0, 300) + '...'
                    : 'Recommendations data available'
                  }
                </div>
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button className="bg-primary text-white px-6 py-3 rounded-[24px] hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Download PDF</span>
          </button>
          <button className="bg-gray-600 text-white px-6 py-3 rounded-[24px] hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
            <Mail className="w-5 h-5" />
            <span>Email Itinerary</span>
          </button>
        </div>
      </div>
    );
  }

  // Default state - waiting for form data
  return (
    <div className={`${className} p-6`}>
      <div className="bg-form-box rounded-[36px] p-8 text-center border border-gray-200">
        <h3 className="text-2xl font-bold text-primary font-raleway mb-4">
          Ready to Create Your Perfect Trip?
        </h3>
        <p className="text-gray-700">
          Fill out the form above to generate your personalized itinerary
        </p>
      </div>
    </div>
  );
};

export default ItineraryDisplayDirect;
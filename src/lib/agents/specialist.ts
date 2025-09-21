/**
 * Information Specialist Agent
 * Deep analysis and specialized information processing using Grok-4-Fast-Reasoning
 */

import { AgentInput, AgentOutput } from '../../types/agent-responses';
import { EnhancedFormData } from '../../types/form-data';
import { searchOrchestrator } from '../search-orchestrator';
import { SynthesizedInfo, InformationSource } from './gatherer';

/**
 * Specialist Agent Configuration
 */
export interface SpecialistConfig {
  model: 'grok-4-fast-reasoning';
  temperature: number;
  maxTokens: number;
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
  specializationAreas: string[];
  crossReferenceEnabled: boolean;
}

/**
 * Analysis Result
 */
export interface AnalysisResult {
  topic: string;
  analysis: string;
  insights: string[];
  recommendations: string[];
  confidence: number;
  sources: InformationSource[];
  crossReferences: string[];
  lastAnalyzed: string;
}

/**
 * Specialized Analysis Types
 */
export type AnalysisType =
  | 'risk_assessment'
  | 'cost_benefit_analysis'
  | 'suitability_analysis'
  | 'trend_analysis'
  | 'comparative_analysis'
  | 'feasibility_analysis';

/**
 * Information Specialist Agent
 */
export class InformationSpecialistAgent {
  private config: SpecialistConfig;

  constructor(config: Partial<SpecialistConfig> = {}) {
    this.config = {
      model: 'grok-4-fast-reasoning',
      temperature: 0.2, // Lower temperature for analytical tasks
      maxTokens: 2500,
      analysisDepth: 'comprehensive',
      specializationAreas: [
        'travel_safety',
        'cost_analysis',
        'cultural_suitability',
        'logistical_feasibility',
        'trend_analysis',
      ],
      crossReferenceEnabled: true,
      ...config,
    };
  }

  /**
   * Process specialized analysis request
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

      // Determine analysis types needed
      const analysisTypes = this.determineAnalysisTypes(input.formData);

      // Perform specialized analyses
      const analyses = await this.performAnalyses(analysisTypes, input.formData);

      // Synthesize findings
      const synthesizedFindings = this.synthesizeFindings(analyses);

      // Create agent output
      const output: AgentOutput = {
        data: synthesizedFindings,
        confidence: this.calculateOverallConfidence(analyses),
        sources: this.extractAllSources(analyses).map((source) => ({
          type: 'search' as const,
          provider: 'orchestrator',
          url: source.url,
          retrievedAt: new Date().toISOString(),
          reliability: source.credibilityScore,
        })),
        processingTime: Date.now() - startTime,
        recommendations: this.generateSpecialistRecommendations(synthesizedFindings),
      };

      return {
        success: true,
        output,
        metadata: {
          agentVersion: '1.0.0',
          processingTime: Date.now() - startTime,
          modelUsed: this.config.model,
          analysesPerformed: analyses.length,
          specializationAreas: this.config.specializationAreas,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SPECIALIST_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown specialist error',
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
   * Determine which analysis types are needed
   */
  private determineAnalysisTypes(formData: EnhancedFormData): AnalysisType[] {
    const analysisTypes: AnalysisType[] = [];

    // Always perform risk assessment
    analysisTypes.push('risk_assessment');

    // Cost-benefit analysis for budget-conscious travelers
    if (formData.budget && formData.budget > 0) {
      analysisTypes.push('cost_benefit_analysis');
    }

    // Suitability analysis based on group composition
    if (formData.adults > 0 || (formData.children && formData.children > 0)) {
      analysisTypes.push('suitability_analysis');
    }

    // Feasibility analysis for complex itineraries
    if (this.isComplexItinerary(formData)) {
      analysisTypes.push('feasibility_analysis');
    }

    // Trend analysis for current travel patterns
    analysisTypes.push('trend_analysis');

    return analysisTypes;
  }

  /**
   * Perform specialized analyses
   */
  private async performAnalyses(
    analysisTypes: AnalysisType[],
    formData: EnhancedFormData
  ): Promise<AnalysisResult[]> {
    const analyses: AnalysisResult[] = [];

    for (const analysisType of analysisTypes) {
      try {
        const analysis = await this.performSingleAnalysis(analysisType, formData);
        analyses.push(analysis);
      } catch (error) {
        console.warn(`Failed to perform ${analysisType} analysis:`, error);
        // Continue with other analyses
      }
    }

    return analyses;
  }

  /**
   * Perform a single specialized analysis
   */
  private async performSingleAnalysis(
    analysisType: AnalysisType,
    formData: EnhancedFormData
  ): Promise<AnalysisResult> {
    // Gather relevant information for this analysis type
    const relevantInfo = await this.gatherAnalysisData(analysisType, formData);

    // Perform the specific analysis
    const analysisResult = await this.executeAnalysis(analysisType, relevantInfo, formData);

    return {
      topic: analysisType.replace('_', ' '),
      analysis: analysisResult.analysis,
      insights: analysisResult.insights,
      recommendations: analysisResult.recommendations,
      confidence: analysisResult.confidence,
      sources: relevantInfo.sources,
      crossReferences: analysisResult.crossReferences || [],
      lastAnalyzed: new Date().toISOString(),
    };
  }

  /**
   * Gather data relevant to the analysis type
   */
  private async gatherAnalysisData(
    analysisType: AnalysisType,
    formData: EnhancedFormData
  ): Promise<{ info: SynthesizedInfo[]; sources: InformationSource[] }> {
    const destination = formData.location;
    const searchQueries = this.generateAnalysisQueries(analysisType, destination);

    const sources: InformationSource[] = [];

    for (const query of searchQueries) {
      try {
        const searchRequest = {
          query: query,
          type: 'text' as const,
          provider: 'orchestrator',
          options: {
            maxResults: 5,
          },
        };

        const searchResponse = await searchOrchestrator.search(searchRequest);

        const querySources = searchResponse.results.map((result) => ({
          url: result.url,
          title: result.title,
          content: result.snippet,
          credibilityScore: this.calculateCredibilityScore(result.source),
          sourceType: this.classifySourceType(result.source),
          relevanceScore: result.relevanceScore,
        }));

        sources.push(...querySources);
      } catch (error) {
        console.warn(`Failed to gather data for query "${query}":`, error);
      }
    }

    return {
      info: [], // Would be populated from gatherer agent
      sources: sources.slice(0, 10), // Limit sources
    };
  }

  /**
   * Generate search queries for analysis
   */
  private generateAnalysisQueries(analysisType: AnalysisType, destination: string): string[] {
    const queries: string[] = [];

    switch (analysisType) {
      case 'risk_assessment':
        queries.push(`${destination} travel safety 2025`);
        queries.push(`${destination} health risks travelers`);
        queries.push(`${destination} crime rate tourists`);
        break;

      case 'cost_benefit_analysis':
        queries.push(`${destination} travel costs 2025`);
        queries.push(`${destination} value for money activities`);
        queries.push(`${destination} budget travel tips`);
        break;

      case 'suitability_analysis':
        queries.push(`${destination} family friendly activities`);
        queries.push(`${destination} accessibility travel`);
        queries.push(`${destination} senior travel considerations`);
        break;

      case 'feasibility_analysis':
        queries.push(`${destination} transportation logistics`);
        queries.push(`${destination} travel time between attractions`);
        queries.push(`${destination} seasonal crowding`);
        break;

      case 'trend_analysis':
        queries.push(`${destination} travel trends 2025`);
        queries.push(`${destination} popular activities 2025`);
        queries.push(`${destination} tourist patterns`);
        break;

      case 'comparative_analysis':
        queries.push(`${destination} compared to similar destinations`);
        queries.push(`${destination} unique attractions`);
        break;
    }

    return queries;
  }

  /**
   * Execute the specific analysis
   */
  private async executeAnalysis(
    analysisType: AnalysisType,
    data: { info: SynthesizedInfo[]; sources: InformationSource[] },
    formData: EnhancedFormData
  ): Promise<{
    analysis: string;
    insights: string[];
    recommendations: string[];
    confidence: number;
    crossReferences?: string[];
  }> {
    const destination = formData.location;
    const sources = data.sources;

    switch (analysisType) {
      case 'risk_assessment':
        return this.performRiskAssessment(sources, destination);

      case 'cost_benefit_analysis':
        return this.performCostBenefitAnalysis(sources, formData);

      case 'suitability_analysis':
        return this.performSuitabilityAnalysis(sources, formData);

      case 'feasibility_analysis':
        return this.performFeasibilityAnalysis(sources, formData);

      case 'trend_analysis':
        return this.performTrendAnalysis(sources, destination);

      case 'comparative_analysis':
        return this.performComparativeAnalysis(sources, destination);

      default:
        return {
          analysis: 'Analysis type not supported',
          insights: [],
          recommendations: [],
          confidence: 0,
        };
    }
  }

  /**
   * Perform risk assessment analysis
   */
  private performRiskAssessment(
    sources: InformationSource[],
    destination: string
  ): {
    analysis: string;
    insights: string[];
    recommendations: string[];
    confidence: number;
  } {
    const insights: string[] = [];
    const recommendations: string[] = [];
    let riskLevel = 'low';

    // Analyze safety information from sources
    for (const source of sources) {
      const content = source.content.toLowerCase();

      if (content.includes('safe') && content.includes('generally')) {
        insights.push('Generally considered safe for tourists');
      }

      if (content.includes('caution') || content.includes('aware')) {
        insights.push('Exercise normal caution in tourist areas');
        riskLevel = 'medium';
      }

      if (content.includes('high risk') || content.includes('dangerous')) {
        insights.push('Some areas may have higher risk levels');
        riskLevel = 'high';
      }

      if (content.includes('health') && content.includes('vaccinations')) {
        recommendations.push('Check recommended vaccinations');
      }

      if (content.includes('emergency') && content.includes('numbers')) {
        recommendations.push('Save local emergency contact numbers');
      }
    }

    if (insights.length === 0) {
      insights.push('Limited safety information available');
      recommendations.push('Consult official travel advisories');
    }

    const analysis = `${destination} risk assessment: ${riskLevel} overall risk level based on available information.`;

    return {
      analysis,
      insights,
      recommendations,
      confidence: sources.length > 0 ? 0.7 : 0.3,
    };
  }

  /**
   * Perform cost-benefit analysis
   */
  private performCostBenefitAnalysis(
    sources: InformationSource[],
    formData: EnhancedFormData
  ): {
    analysis: string;
    insights: string[];
    recommendations: string[];
    confidence: number;
  } {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const budget = formData.budget || 0;

    // Analyze cost information
    for (const source of sources) {
      const content = source.content.toLowerCase();

      if (content.includes('expensive') || content.includes('high cost')) {
        insights.push('Generally considered expensive destination');
        if (budget < 2000) {
          recommendations.push('Consider budget accommodations and local transport');
        }
      }

      if (content.includes('good value') || content.includes('affordable')) {
        insights.push('Offers good value for money');
      }

      if (content.includes('free') && content.includes('attractions')) {
        insights.push('Many free or low-cost attractions available');
        recommendations.push('Focus on free activities to stretch budget');
      }
    }

    const analysis = `Cost-benefit analysis for ${formData.location}: ${insights.join('. ')}`;

    return {
      analysis,
      insights,
      recommendations,
      confidence: sources.length > 0 ? 0.75 : 0.4,
    };
  }

  /**
   * Perform suitability analysis
   */
  private performSuitabilityAnalysis(
    sources: InformationSource[],
    formData: EnhancedFormData
  ): {
    analysis: string;
    insights: string[];
    recommendations: string[];
    confidence: number;
  } {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const hasChildren = (formData.children || 0) > 0;
    const hasSeniors = formData.adults > 0; // Simplified

    for (const source of sources) {
      const content = source.content.toLowerCase();

      if (hasChildren && (content.includes('family') || content.includes('children'))) {
        if (content.includes('friendly') || content.includes('activities')) {
          insights.push('Family-friendly destination with child-oriented activities');
        }
      }

      if (hasSeniors && (content.includes('senior') || content.includes('accessible'))) {
        insights.push('Considered accessible for seniors');
        recommendations.push('Check accessibility of chosen activities');
      }

      if (content.includes('wheelchair') || content.includes('mobility')) {
        insights.push('Varying levels of accessibility available');
      }
    }

    const groupType = hasChildren ? 'family' : hasSeniors ? 'senior' : 'general';
    const analysis = `Suitability analysis for ${groupType} travel to ${
      formData.location
    }: ${insights.join('. ')}`;

    return {
      analysis,
      insights,
      recommendations,
      confidence: sources.length > 0 ? 0.8 : 0.5,
    };
  }

  /**
   * Perform feasibility analysis
   */
  private performFeasibilityAnalysis(
    sources: InformationSource[],
    formData: EnhancedFormData
  ): {
    analysis: string;
    insights: string[];
    recommendations: string[];
    confidence: number;
  } {
    const insights: string[] = [];
    const recommendations: string[] = [];

    for (const source of sources) {
      const content = source.content.toLowerCase();

      if (content.includes('transport') && content.includes('easy')) {
        insights.push('Good transportation infrastructure');
      }

      if (content.includes('crowded') || content.includes('busy')) {
        insights.push('Can be crowded during peak seasons');
        recommendations.push('Consider visiting during shoulder season');
      }

      if (content.includes('time') && content.includes('travel')) {
        insights.push('Travel times between attractions are reasonable');
      }
    }

    const analysis = `Feasibility analysis for ${formData.location}: ${insights.join('. ')}`;

    return {
      analysis,
      insights,
      recommendations,
      confidence: sources.length > 0 ? 0.7 : 0.4,
    };
  }

  /**
   * Perform trend analysis
   */
  private performTrendAnalysis(
    sources: InformationSource[],
    destination: string
  ): {
    analysis: string;
    insights: string[];
    recommendations: string[];
    confidence: number;
  } {
    const insights: string[] = [];
    const recommendations: string[] = [];

    for (const source of sources) {
      const content = source.content.toLowerCase();

      if (content.includes('popular') || content.includes('trending')) {
        insights.push('Currently popular destination');
      }

      if (content.includes('2025') || content.includes('new')) {
        insights.push('New attractions or experiences becoming available');
      }

      if (content.includes('season') && content.includes('peak')) {
        recommendations.push('Book accommodations early for peak season');
      }
    }

    const analysis = `Trend analysis for ${destination}: ${insights.join('. ')}`;

    return {
      analysis,
      insights,
      recommendations,
      confidence: sources.length > 0 ? 0.6 : 0.3,
    };
  }

  /**
   * Perform comparative analysis
   */
  private performComparativeAnalysis(
    sources: InformationSource[],
    destination: string
  ): {
    analysis: string;
    insights: string[];
    recommendations: string[];
    confidence: number;
  } {
    const insights: string[] = [];
    const recommendations: string[] = [];

    for (const source of sources) {
      const content = source.content.toLowerCase();

      if (content.includes('unique') || content.includes('special')) {
        insights.push('Offers unique attractions not found elsewhere');
      }

      if (content.includes('compared') || content.includes('versus')) {
        insights.push('Has distinct advantages over similar destinations');
      }
    }

    const analysis = `Comparative analysis for ${destination}: ${insights.join('. ')}`;

    return {
      analysis,
      insights,
      recommendations,
      confidence: sources.length > 0 ? 0.65 : 0.35,
    };
  }

  /**
   * Synthesize findings from all analyses
   */
  private synthesizeFindings(analyses: AnalysisResult[]): any {
    const synthesis = {
      overallAssessment: this.createOverallAssessment(analyses),
      keyInsights: this.extractKeyInsights(analyses),
      prioritizedRecommendations: this.prioritizeRecommendations(analyses),
      riskSummary: this.summarizeRisks(analyses),
      costSummary: this.summarizeCosts(analyses),
      feasibilityScore: this.calculateFeasibilityScore(analyses),
      confidence: this.calculateOverallConfidence(analyses),
      generatedAt: new Date().toISOString(),
    };

    return synthesis;
  }

  /**
   * Create overall assessment
   */
  private createOverallAssessment(analyses: AnalysisResult[]): string {
    const riskAnalysis = analyses.find((a) => a.topic === 'risk assessment');
    const costAnalysis = analyses.find((a) => a.topic === 'cost benefit analysis');
    const suitabilityAnalysis = analyses.find((a) => a.topic === 'suitability analysis');

    let assessment = 'Travel destination assessment: ';

    if (riskAnalysis) {
      assessment += `Risk level appears ${
        riskAnalysis.analysis.toLowerCase().includes('high') ? 'elevated' : 'manageable'
      }. `;
    }

    if (costAnalysis) {
      assessment += `Cost structure is ${
        costAnalysis.analysis.toLowerCase().includes('expensive') ? 'premium' : 'reasonable'
      }. `;
    }

    if (suitabilityAnalysis) {
      assessment += 'Destination appears suitable for the planned group composition.';
    }

    return assessment;
  }

  /**
   * Extract key insights from all analyses
   */
  private extractKeyInsights(analyses: AnalysisResult[]): string[] {
    const insights: string[] = [];

    for (const analysis of analyses) {
      insights.push(...analysis.insights.slice(0, 2)); // Top 2 insights per analysis
    }

    return insights.slice(0, 8); // Limit to 8 total insights
  }

  /**
   * Prioritize recommendations
   */
  private prioritizeRecommendations(analyses: AnalysisResult[]): string[] {
    const recommendations: string[] = [];

    for (const analysis of analyses) {
      recommendations.push(...analysis.recommendations);
    }

    // Simple prioritization - could be enhanced with scoring
    return recommendations.slice(0, 6);
  }

  /**
   * Summarize risks
   */
  private summarizeRisks(analyses: AnalysisResult[]): string {
    const riskAnalysis = analyses.find((a) => a.topic === 'risk assessment');

    if (riskAnalysis) {
      return riskAnalysis.analysis;
    }

    return 'Risk assessment not available';
  }

  /**
   * Summarize costs
   */
  private summarizeCosts(analyses: AnalysisResult[]): string {
    const costAnalysis = analyses.find((a) => a.topic === 'cost benefit analysis');

    if (costAnalysis) {
      return costAnalysis.analysis;
    }

    return 'Cost analysis not available';
  }

  /**
   * Calculate feasibility score
   */
  private calculateFeasibilityScore(analyses: AnalysisResult[]): number {
    const feasibilityAnalysis = analyses.find((a) => a.topic === 'feasibility analysis');

    if (feasibilityAnalysis) {
      return feasibilityAnalysis.confidence;
    }

    // Default feasibility based on other analyses
    const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;
    return Math.min(0.8, avgConfidence);
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(analyses: AnalysisResult[]): number {
    if (analyses.length === 0) return 0;

    const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;
    return Math.min(1.0, avgConfidence);
  }

  /**
   * Extract all sources from analyses
   */
  private extractAllSources(analyses: AnalysisResult[]): InformationSource[] {
    const allSources: InformationSource[] = [];

    for (const analysis of analyses) {
      allSources.push(...analysis.sources);
    }

    // Remove duplicates based on URL
    const uniqueSources = allSources.filter(
      (source, index, self) => index === self.findIndex((s) => s.url === source.url)
    );

    return uniqueSources.slice(0, 15); // Limit total sources
  }

  /**
   * Generate specialist recommendations
   */
  private generateSpecialistRecommendations(synthesis: any): string[] {
    const recommendations: string[] = [];

    if (synthesis.feasibilityScore < 0.6) {
      recommendations.push('Consider simplifying itinerary for better feasibility');
    }

    if (
      synthesis.keyInsights.some((insight: string) => insight.toLowerCase().includes('expensive'))
    ) {
      recommendations.push('Review budget allocation and consider cost-saving measures');
    }

    if (
      synthesis.keyInsights.some((insight: string) => insight.toLowerCase().includes('crowded'))
    ) {
      recommendations.push('Plan for peak season crowds and book popular activities early');
    }

    return recommendations;
  }

  /**
   * Helper methods
   */

  private isComplexItinerary(formData: EnhancedFormData): boolean {
    // Consider complex if multiple interests or long duration
    const interests = formData.selectedInterests || [];
    const duration = this.calculateDuration(formData);

    return interests.length > 3 || duration > 10;
  }

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

    return 7; // Default
  }

  private calculateCredibilityScore(sourceUrl: string): number {
    // Simplified credibility scoring - could be enhanced
    const url = sourceUrl.toLowerCase();

    if (url.includes('.gov') || url.includes('official')) return 0.9;
    if (url.includes('wikipedia.org')) return 0.7;
    if (url.includes('tripadvisor.com') || url.includes('booking.com')) return 0.8;
    if (url.includes('news') || url.includes('bbc') || url.includes('cnn')) return 0.85;

    return 0.6; // Default
  }

  private classifySourceType(sourceUrl: string): InformationSource['sourceType'] {
    const url = sourceUrl.toLowerCase();

    if (url.includes('.gov')) return 'official';
    if (url.includes('news') || url.includes('bbc') || url.includes('cnn')) return 'news';
    if (url.includes('tripadvisor') || url.includes('yelp')) return 'review';

    return 'blog';
  }

  /**
   * Validate input
   */
  private validateInput(input: AgentInput): void {
    if (!input.formData) {
      throw new Error('Form data is required for specialist analysis');
    }

    if (!input.formData.location) {
      throw new Error('Destination location is required');
    }
  }
}

/**
 * Factory function to create Information Specialist agent
 */
export function createInformationSpecialist(
  config?: Partial<SpecialistConfig>
): InformationSpecialistAgent {
  return new InformationSpecialistAgent(config);
}

/**
 * Default Information Specialist instance
 */
export const informationSpecialist = createInformationSpecialist();

/**
 * Validation Rules:
 * - Form data must include destination location
 * - Analysis types must be determined based on form data
 * - Each analysis must include confidence scoring
 * - Sources must be credibility-scored and deduplicated
 * - Recommendations must be prioritized and actionable
 * - Overall synthesis must integrate all analysis types
 */

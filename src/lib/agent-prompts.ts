/**
 * Agent Prompt Engineering and Response Parsing
 * Centralized prompts and parsing logic for all AI agents
 */

import { AgentType } from '../types/agent-responses';
import { EnhancedFormData } from '../types/form-data';

/**
 * Agent Prompt Configuration
 */
export interface AgentPrompt {
  systemPrompt: string;
  userPromptTemplate: string;
  responseFormat: string;
  validationRules: ValidationRule[];
  parsingInstructions: string;
}

/**
 * Validation Rule for Agent Responses
 */
export interface ValidationRule {
  field: string;
  type: 'required' | 'optional' | 'conditional';
  validator: (value: any) => boolean;
  errorMessage: string;
}

/**
 * Parsed Agent Response
 */
export interface ParsedResponse {
  success: boolean;
  data: any;
  confidence: number;
  validationErrors: string[];
  metadata: {
    parsingTime: number;
    formatVersion: string;
    agentType: AgentType;
  };
}

/**
 * Agent Prompts Registry
 */
export class AgentPromptsRegistry {
  private prompts: Map<AgentType, AgentPrompt> = new Map();

  constructor() {
    this.initializePrompts();
  }

  /**
   * Get prompt for agent type
   */
  getPrompt(agentType: AgentType): AgentPrompt {
    const prompt = this.prompts.get(agentType);
    if (!prompt) {
      throw new Error(`No prompt found for agent type: ${agentType}`);
    }
    return prompt;
  }

  /**
   * Parse agent response
   */
  parseResponse(agentType: AgentType, response: string, context?: any): ParsedResponse {
    const startTime = Date.now();
    const prompt = this.getPrompt(agentType);

    try {
      // Parse the response based on agent type
      const parsedData = this.parseResponseByType(agentType, response, context);

      // Validate the parsed response
      const validationResult = this.validateResponse(agentType, parsedData);

      return {
        success: validationResult.isValid,
        data: parsedData,
        confidence: this.calculateConfidence(parsedData, validationResult),
        validationErrors: validationResult.errors,
        metadata: {
          parsingTime: Date.now() - startTime,
          formatVersion: '1.0.0',
          agentType,
        },
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        confidence: 0,
        validationErrors: [error instanceof Error ? error.message : 'Unknown parsing error'],
        metadata: {
          parsingTime: Date.now() - startTime,
          formatVersion: '1.0.0',
          agentType,
        },
      };
    }
  }

  /**
   * Initialize all agent prompts
   */
  private initializePrompts(): void {
    // Itinerary Architect prompts
    this.prompts.set('itinerary-architect', {
      systemPrompt: this.getArchitectSystemPrompt(),
      userPromptTemplate: this.getArchitectUserPrompt(),
      responseFormat: this.getArchitectResponseFormat(),
      validationRules: this.getArchitectValidationRules(),
      parsingInstructions: this.getArchitectParsingInstructions(),
    });

    // Web Information Gatherer prompts
    this.prompts.set('web-gatherer', {
      systemPrompt: this.getGathererSystemPrompt(),
      userPromptTemplate: this.getGathererUserPrompt(),
      responseFormat: this.getGathererResponseFormat(),
      validationRules: this.getGathererValidationRules(),
      parsingInstructions: this.getGathererParsingInstructions(),
    });

    // Information Specialist prompts
    this.prompts.set('information-specialist', {
      systemPrompt: this.getSpecialistSystemPrompt(),
      userPromptTemplate: this.getSpecialistUserPrompt(),
      responseFormat: this.getSpecialistResponseFormat(),
      validationRules: this.getSpecialistValidationRules(),
      parsingInstructions: this.getSpecialistParsingInstructions(),
    });

    // Form Putter prompts
    this.prompts.set('form-putter', {
      systemPrompt: this.getPutterSystemPrompt(),
      userPromptTemplate: this.getPutterUserPrompt(),
      responseFormat: this.getPutterResponseFormat(),
      validationRules: this.getPutterValidationRules(),
      parsingInstructions: this.getPutterParsingInstructions(),
    });
  }

  /**
   * Itinerary Architect System Prompt
   */
  private getArchitectSystemPrompt(): string {
    return `You are the Itinerary Architect, a master travel planner specializing in creating comprehensive, personalized travel itineraries.

Your role is to:
1. Analyze traveler preferences, constraints, and goals
2. Design high-level itinerary structure and flow
3. Identify key destinations and activities
4. Create logical day-by-day progression
5. Ensure balance between must-see attractions and relaxation
6. Consider practical logistics (transportation, timing, costs)
7. Adapt to group composition and special needs
8. Provide clear rationale for all planning decisions

Always consider:
- Travel party composition (families, couples, groups)
- Time constraints and pacing preferences
- Budget considerations
- Accessibility and mobility needs
- Weather and seasonal factors
- Local customs and peak tourist times
- Transportation logistics between destinations

Structure your response as a comprehensive itinerary plan with:
- Executive summary of the trip concept
- Day-by-day breakdown with key activities
- Transportation and logistics overview
- Budget allocation recommendations
- Risk mitigation and contingency plans
- Personalization notes based on traveler preferences`;
  }

  /**
   * Itinerary Architect User Prompt Template
   */
  private getArchitectUserPrompt(): string {
    return `Create a comprehensive itinerary for a trip to {{destination}} from {{departDate}} to {{returnDate}}.

Traveler Details:
- Adults: {{adults}}
- Children: {{children}}
- Selected Interests: {{interests}}
- Travel Style: {{travelStyle}}
- Budget: ${{ budget }}
- Special Requirements: {{requirements}}

Please provide a detailed itinerary that includes:
1. Executive summary
2. Day-by-day activities
3. Transportation arrangements
4. Accommodation recommendations
5. Budget breakdown
6. Practical tips and recommendations

Ensure the itinerary is realistic, balanced, and tailored to the traveler's preferences.`;
  }

  /**
   * Itinerary Architect Response Format
   */
  private getArchitectResponseFormat(): string {
    return `Respond with a JSON object containing:

{
  "executiveSummary": "Brief overview of the trip concept",
  "travelerProfile": {
    "groupComposition": {...},
    "travelStyle": "string",
    "interests": ["array"],
    "specialConsiderations": {...},
    "budget": {...}
  },
  "itineraryStructure": {
    "totalDays": number,
    "pace": "string",
    "focusAreas": ["array"]
  },
  "dayPlans": [
    {
      "day": number,
      "theme": "string",
      "activities": [...],
      "meals": [...],
      "transportation": {...},
      "rest": {...},
      "flexibility": {...}
    }
  ],
  "logistics": {
    "arrival": {...},
    "internal": {...},
    "departure": {...},
    "reservations": {...}
  },
  "budget": {
    "total": number,
    "breakdown": {...},
    "perPerson": number,
    "dailyAverage": number,
    "contingencies": number
  },
  "recommendations": [...],
  "contingencies": [...],
  "metadata": {
    "generatedAt": "ISO date string",
    "planningDepth": "string",
    "confidence": number
  }
}`;
  }

  /**
   * Itinerary Architect Validation Rules
   */
  private getArchitectValidationRules(): ValidationRule[] {
    return [
      {
        field: 'executiveSummary',
        type: 'required',
        validator: (value) => typeof value === 'string' && value.length > 50,
        errorMessage: 'Executive summary must be a detailed string',
      },
      {
        field: 'dayPlans',
        type: 'required',
        validator: (value) => Array.isArray(value) && value.length > 0,
        errorMessage: 'Day plans must be a non-empty array',
      },
      {
        field: 'budget.total',
        type: 'required',
        validator: (value) => typeof value === 'number' && value > 0,
        errorMessage: 'Total budget must be a positive number',
      },
      {
        field: 'metadata.confidence',
        type: 'required',
        validator: (value) => typeof value === 'number' && value >= 0 && value <= 1,
        errorMessage: 'Confidence must be a number between 0 and 1',
      },
    ];
  }

  /**
   * Itinerary Architect Parsing Instructions
   */
  private getArchitectParsingInstructions(): string {
    return `Parse the JSON response and validate:
1. Executive summary is present and meaningful
2. Day plans array contains valid daily activities
3. Budget breakdown is realistic and complete
4. All required fields are present
5. Data types match expected formats
6. Confidence score is within valid range`;
  }

  /**
   * Web Information Gatherer System Prompt
   */
  private getGathererSystemPrompt(): string {
    return `You are the Web Information Gatherer, an expert at collecting and synthesizing web information for travel planning.

Your role is to:
1. Search for relevant travel information across multiple sources
2. Evaluate source credibility and reliability
3. Synthesize information from diverse sources
4. Identify key facts and practical information
5. Cross-reference information for accuracy
6. Provide comprehensive coverage of travel topics

Focus on gathering:
- Destination information and attractions
- Weather patterns and best times to visit
- Safety and health information
- Transportation options and logistics
- Accommodation types and price ranges
- Dining and cultural experiences
- Practical travel tips and local customs

Always prioritize:
- Official and reputable sources
- Recent and up-to-date information
- Comprehensive coverage of topics
- Balanced perspectives from multiple sources
- Practical and actionable information`;
  }

  /**
   * Web Information Gatherer User Prompt Template
   */
  private getGathererUserPrompt(): string {
    return `Gather comprehensive information for a trip to {{destination}}.

Search for and synthesize information about:
1. Tourist attractions and must-see sites
2. Weather patterns and best time to visit
3. Safety and health considerations
4. Transportation options within the destination
5. Accommodation types and typical price ranges
6. Local dining and cuisine options
7. Cultural customs and practical tips

Provide information from multiple credible sources and highlight any conflicting information or important updates.

Focus on practical information that travelers need for planning their trip.`;
  }

  /**
   * Web Information Gatherer Response Format
   */
  private getGathererResponseFormat(): string {
    return `Respond with a JSON object containing:

{
  "destination": "string",
  "searchTimestamp": "ISO date string",
  "information": {
    "attractions": [
      {
        "name": "string",
        "description": "string",
        "category": "string",
        "popularity": "high|medium|low",
        "bestTime": "string",
        "estimatedCost": number,
        "duration": "string"
      }
    ],
    "weather": {
      "bestTimeToVisit": "string",
      "seasonalPatterns": {...},
      "currentConditions": {...},
      "warnings": ["array"]
    },
    "safety": {
      "overallRating": "string",
      "healthConsiderations": ["array"],
      "safetyTips": ["array"],
      "emergencyContacts": ["array"]
    },
    "transportation": {
      "options": ["array"],
      "costs": {...},
      "tips": ["array"]
    },
    "accommodation": {
      "types": ["array"],
      "priceRanges": {...},
      "recommendations": ["array"]
    },
    "dining": {
      "cuisine": ["array"],
      "priceRanges": {...},
      "recommendations": ["array"]
    }
  },
  "sources": [
    {
      "url": "string",
      "title": "string",
      "credibilityScore": number,
      "publicationDate": "string",
      "type": "string"
    }
  ],
  "metadata": {
    "totalSources": number,
    "searchTime": number,
    "confidence": number,
    "lastUpdated": "ISO date string"
  }
}`;
  }

  /**
   * Web Information Gatherer Validation Rules
   */
  private getGathererValidationRules(): ValidationRule[] {
    return [
      {
        field: 'destination',
        type: 'required',
        validator: (value) => typeof value === 'string' && value.length > 0,
        errorMessage: 'Destination must be a non-empty string',
      },
      {
        field: 'information.attractions',
        type: 'required',
        validator: (value) => Array.isArray(value) && value.length > 0,
        errorMessage: 'Attractions must be a non-empty array',
      },
      {
        field: 'sources',
        type: 'required',
        validator: (value) => Array.isArray(value) && value.length > 0,
        errorMessage: 'Sources must be a non-empty array',
      },
      {
        field: 'metadata.confidence',
        type: 'required',
        validator: (value) => typeof value === 'number' && value >= 0 && value <= 1,
        errorMessage: 'Confidence must be a number between 0 and 1',
      },
    ];
  }

  /**
   * Web Information Gatherer Parsing Instructions
   */
  private getGathererParsingInstructions(): string {
    return `Parse the JSON response and validate:
1. Destination information is present and accurate
2. Information categories are comprehensive
3. Sources are credible and properly attributed
4. All required fields are present
5. Data structures match expected formats
6. Credibility scores are within valid ranges`;
  }

  /**
   * Information Specialist System Prompt
   */
  private getSpecialistSystemPrompt(): string {
    return `You are the Information Specialist, an expert analyst specializing in deep analysis of travel information.

Your role is to:
1. Perform specialized analyses of travel data
2. Evaluate risks and opportunities
3. Compare options and alternatives
4. Identify trends and patterns
5. Provide actionable insights and recommendations
6. Assess feasibility and practicality

Analysis types include:
- Risk assessment and safety analysis
- Cost-benefit analysis and budget optimization
- Suitability analysis for different traveler types
- Feasibility analysis of travel plans
- Trend analysis and market insights
- Comparative analysis of destinations/options

Always provide:
- Balanced and objective analysis
- Clear reasoning for conclusions
- Actionable recommendations
- Confidence levels for assessments
- Alternative perspectives where relevant`;
  }

  /**
   * Information Specialist User Prompt Template
   */
  private getSpecialistUserPrompt(): string {
    return `Perform specialized analysis for a trip to {{destination}} with the following parameters:

Traveler Profile:
- Group size: {{adults}} adults{{children > 0 ? ', ' + children + ' children' : ''}}
- Interests: {{interests}}
- Budget: ${{ budget }}
- Travel dates: {{departDate}} to {{returnDate}}

Please perform the following analyses:
1. Risk Assessment - Evaluate safety, health, and logistical risks
2. Cost-Benefit Analysis - Assess value for money and budget optimization
3. Suitability Analysis - Evaluate fit for traveler profile and preferences
4. Feasibility Analysis - Assess practicality of planned activities and logistics

Provide detailed analysis with specific recommendations and confidence levels.`;
  }

  /**
   * Information Specialist Response Format
   */
  private getSpecialistResponseFormat(): string {
    return `Respond with a JSON object containing:

{
  "analyses": [
    {
      "type": "risk_assessment|cost_benefit_analysis|suitability_analysis|feasibility_analysis",
      "title": "string",
      "summary": "string",
      "findings": [
        {
          "category": "string",
          "assessment": "string",
          "impact": "high|medium|low",
          "recommendations": ["array"]
        }
      ],
      "overallRating": "string",
      "confidence": number,
      "keyInsights": ["array"]
    }
  ],
  "overallAssessment": {
    "suitabilityScore": number,
    "riskLevel": "low|medium|high",
    "valueRating": "excellent|good|fair|poor",
    "feasibilityScore": number,
    "recommendations": ["array"]
  },
  "metadata": {
    "analysisTimestamp": "ISO date string",
    "analystVersion": "string",
    "dataSources": number,
    "confidence": number
  }
}`;
  }

  /**
   * Information Specialist Validation Rules
   */
  private getSpecialistValidationRules(): ValidationRule[] {
    return [
      {
        field: 'analyses',
        type: 'required',
        validator: (value) => Array.isArray(value) && value.length > 0,
        errorMessage: 'Analyses must be a non-empty array',
      },
      {
        field: 'overallAssessment',
        type: 'required',
        validator: (value) => typeof value === 'object' && value !== null,
        errorMessage: 'Overall assessment must be an object',
      },
      {
        field: 'overallAssessment.suitabilityScore',
        type: 'required',
        validator: (value) => typeof value === 'number' && value >= 0 && value <= 100,
        errorMessage: 'Suitability score must be a number between 0 and 100',
      },
      {
        field: 'metadata.confidence',
        type: 'required',
        validator: (value) => typeof value === 'number' && value >= 0 && value <= 1,
        errorMessage: 'Confidence must be a number between 0 and 1',
      },
    ];
  }

  /**
   * Information Specialist Parsing Instructions
   */
  private getSpecialistParsingInstructions(): string {
    return `Parse the JSON response and validate:
1. All required analysis types are present
2. Assessment scores are within valid ranges
3. Recommendations are specific and actionable
4. Confidence levels are properly calculated
5. Data structures match expected formats
6. Cross-references are valid and meaningful`;
  }

  /**
   * Form Putter System Prompt
   */
  private getPutterSystemPrompt(): string {
    return `You are the Form Putter, a professional travel document formatter specializing in creating polished, comprehensive travel itineraries.

Your role is to:
1. Format raw travel information into professional documents
2. Structure information for optimal readability
3. Ensure consistency and completeness
4. Add professional presentation elements
5. Include all necessary practical information
6. Create user-friendly navigation and organization

Focus on creating:
- Clear, logical document structure
- Professional formatting and presentation
- Comprehensive coverage of all travel aspects
- User-friendly language and organization
- Practical and actionable information
- Professional appearance and credibility

Always ensure:
- Information is accurate and well-organized
- Formatting is consistent and professional
- All essential information is included
- Document is easy to navigate and understand
- Presentation enhances rather than obscures content`;
  }

  /**
   * Form Putter User Prompt Template
   */
  private getPutterUserPrompt(): string {
    return `Format the following travel information into a comprehensive, professional itinerary document:

Destination: {{destination}}
Travel Dates: {{departDate}} to {{returnDate}}
Travelers: {{adults}} adults{{children > 0 ? ', ' + children + ' children' : ''}}
Budget: ${{ budget }}

Raw Information:
{{itineraryData}}
{{practicalInfo}}
{{recommendations}}

Please create a complete, professional itinerary document that includes:
1. Professional title and overview
2. Day-by-day detailed plans
3. Complete practical information section
4. Budget breakdown and cost information
5. Emergency contacts and important details
6. Professional formatting and presentation

Ensure the document is ready for printing or digital distribution.`;
  }

  /**
   * Form Putter Response Format
   */
  private getPutterResponseFormat(): string {
    return `Respond with a JSON object containing:

{
  "document": {
    "title": "string",
    "version": "string",
    "generatedDate": "ISO date string",
    "sections": [
      {
        "id": "string",
        "title": "string",
        "content": "string",
        " subsections": [
          {
            "title": "string",
            "content": "string | object"
          }
        ]
      }
    ]
  },
  "metadata": {
    "formattingStyle": "string",
    "detailLevel": "string",
    "language": "string",
    "pageCount": number,
    "wordCount": number
  },
  "validation": {
    "completeness": number,
    "accuracy": number,
    "readability": number,
    "professionalism": number
  }
}`;
  }

  /**
   * Form Putter Validation Rules
   */
  private getPutterValidationRules(): ValidationRule[] {
    return [
      {
        field: 'document.title',
        type: 'required',
        validator: (value) => typeof value === 'string' && value.length > 0,
        errorMessage: 'Document title must be a non-empty string',
      },
      {
        field: 'document.sections',
        type: 'required',
        validator: (value) => Array.isArray(value) && value.length > 0,
        errorMessage: 'Document sections must be a non-empty array',
      },
      {
        field: 'validation.completeness',
        type: 'required',
        validator: (value) => typeof value === 'number' && value >= 0 && value <= 100,
        errorMessage: 'Completeness must be a number between 0 and 100',
      },
      {
        field: 'metadata.pageCount',
        type: 'optional',
        validator: (value) => typeof value === 'number' && value > 0,
        errorMessage: 'Page count must be a positive number',
      },
    ];
  }

  /**
   * Form Putter Parsing Instructions
   */
  private getPutterParsingInstructions(): string {
    return `Parse the JSON response and validate:
1. Document structure is complete and logical
2. All required sections are present
3. Content is properly formatted and organized
4. Metadata is accurate and complete
5. Validation scores are within expected ranges
6. Document is ready for presentation`;
  }

  /**
   * Parse response by agent type
   */
  private parseResponseByType(agentType: AgentType, response: string, context?: any): any {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response);
      return parsed;
    } catch (jsonError) {
      // If JSON parsing fails, try to extract structured data from text
      return this.parseTextResponse(agentType, response, context);
    }
  }

  /**
   * Parse text response when JSON fails
   */
  private parseTextResponse(agentType: AgentType, response: string, context?: any): any {
    // This would contain logic to extract structured data from text responses
    // For now, return a basic structure
    return {
      rawResponse: response,
      parsed: false,
      agentType,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Validate parsed response
   */
  private validateResponse(
    agentType: AgentType,
    data: any
  ): { isValid: boolean; errors: string[] } {
    const prompt = this.getPrompt(agentType);
    const errors: string[] = [];

    for (const rule of prompt.validationRules) {
      try {
        const value = this.getNestedValue(data, rule.field);
        if (!rule.validator(value)) {
          errors.push(rule.errorMessage);
        }
      } catch (error) {
        errors.push(`Validation error for field ${rule.field}: ${error}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    data: any,
    validation: { isValid: boolean; errors: string[] }
  ): number {
    let confidence = 0.8; // Base confidence

    if (validation.isValid) {
      confidence += 0.1;
    }

    // Adjust based on data completeness and quality
    if (data && typeof data === 'object') {
      const fieldCount = Object.keys(data).length;
      if (fieldCount > 10) confidence += 0.05;
      if (fieldCount > 20) confidence += 0.05;
    }

    return Math.min(1.0, Math.max(0.0, confidence));
  }
}

/**
 * Factory function to create Agent Prompts Registry
 */
export function createAgentPromptsRegistry(): AgentPromptsRegistry {
  return new AgentPromptsRegistry();
}

/**
 * Default Agent Prompts Registry instance
 */
export const agentPromptsRegistry = createAgentPromptsRegistry();

/**
 * Utility functions for prompt management
 */

export function interpolatePrompt(template: string, variables: Record<string, any>): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), String(value));
  }

  return result;
}

export function validatePromptVariables(
  template: string,
  variables: Record<string, any>
): string[] {
  const errors: string[] = [];
  const placeholders = template.match(/\{\{(\w+)\}\}/g) || [];

  for (const placeholder of placeholders) {
    const varName = placeholder.slice(2, -2); // Remove {{ }}
    if (!(varName in variables)) {
      errors.push(`Missing variable: ${varName}`);
    }
  }

  return errors;
}

export function estimateTokenCount(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Validation Rules:
 * - All agent types must have complete prompt configurations
 * - System prompts must be comprehensive and clear
 * - User prompt templates must include all necessary variables
 * - Response formats must be valid JSON schemas
 * - Validation rules must cover all critical fields
 * - Parsing instructions must be detailed and actionable
 * - Confidence calculations must be based on validation results
 */

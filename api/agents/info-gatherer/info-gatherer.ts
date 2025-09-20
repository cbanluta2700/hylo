/**
 * Website Info Gatherer Agent Base Class for Hylo Multi-Agent Travel Planning System
 * 
 * This module defines the base class for the Info Gatherer agent, which is responsible
 * for collecting real-time web information based on the planning context from the Content
 * Planner. It uses web scraping, search APIs, and document processing to gather comprehensive
 * travel information for the destination.
 * 
 * Based on LangChain.js patterns with web loaders, vector stores, and document processing.
 */

import { z } from "zod";
import { 
  Agent, 
  AgentResult, 
  TravelFormData, 
  WorkflowContext,
  AgentType,
  WorkflowConfig,
  AgentError,
  AgentExecutionMetadata,
  LLMProvider,
  AgentErrorType
} from "../../../src/types/agents.js";
import { 
  ContentPlanningContext,
  GatheredInformationRepository
} from "../../../src/types/workflow.js";

// ===== Information Gathering Schemas =====

/**
 * Zod schema for web search query
 */
export const WebSearchQuerySchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
  category: z.enum(["accommodation", "activities", "dining", "transportation", "practical", "general"]),
  priority: z.enum(["high", "medium", "low"]),
  expectedSources: z.array(z.enum(["official", "reviews", "blogs", "news", "social"])),
  maxResults: z.number().min(1).max(20).default(5)
});

/**
 * Zod schema for gathered document
 */
export const GatheredDocumentSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  title: z.string(),
  content: z.string().min(1, "Content cannot be empty"),
  category: z.string(),
  relevanceScore: z.number().min(0).max(1),
  extractedDate: z.date(),
  metadata: z.object({
    source: z.string(),
    domain: z.string(),
    wordCount: z.number(),
    language: z.string().optional(),
    tags: z.array(z.string()).optional()
  })
});

/**
 * Zod schema for information gathering output
 */
export const InformationGatheringOutputSchema = z.object({
  destination: z.string(),
  gatheringSession: z.object({
    sessionId: z.string(),
    startTime: z.date(),
    endTime: z.date(),
    queriesExecuted: z.number(),
    documentsGathered: z.number(),
    successRate: z.number().min(0).max(1)
  }),
  
  gatheredDocuments: z.array(GatheredDocumentSchema),
  
  categorizedInformation: z.object({
    accommodations: z.array(z.object({
      name: z.string(),
      type: z.string(),
      rating: z.number().optional(),
      priceRange: z.string().optional(),
      location: z.string(),
      amenities: z.array(z.string()),
      sourceUrl: z.string().url(),
      relevanceScore: z.number().min(0).max(1)
    })),
    
    restaurants: z.array(z.object({
      name: z.string(),
      cuisine: z.array(z.string()),
      rating: z.number().optional(),
      priceRange: z.string().optional(),
      location: z.string(),
      specialties: z.array(z.string()),
      dietaryOptions: z.array(z.string()),
      sourceUrl: z.string().url(),
      relevanceScore: z.number().min(0).max(1)
    })),
    
    activities: z.array(z.object({
      name: z.string(),
      type: z.string(),
      description: z.string(),
      duration: z.string().optional(),
      location: z.string(),
      cost: z.string().optional(),
      seasonality: z.string().optional(),
      sourceUrl: z.string().url(),
      relevanceScore: z.number().min(0).max(1)
    })),
    
    transportation: z.object({
      airports: z.array(z.object({
        code: z.string(),
        name: z.string(),
        distance: z.string().optional(),
        transportOptions: z.array(z.string())
      })),
      publicTransport: z.object({
        types: z.array(z.string()),
        ticketPricing: z.string().optional(),
        coverage: z.string().optional()
      }),
      rideshare: z.object({
        available: z.boolean(),
        providers: z.array(z.string()),
        estimatedCosts: z.string().optional()
      })
    }),
    
    practical: z.object({
      weather: z.object({
        currentConditions: z.string().optional(),
        forecast: z.string().optional(),
        bestTimeToVisit: z.string().optional()
      }),
      safety: z.object({
        overallRating: z.string().optional(),
        recommendations: z.array(z.string()),
        areasToAvoid: z.array(z.string()).optional()
      }),
      cultural: z.object({
        customs: z.array(z.string()),
        etiquette: z.array(z.string()),
        language: z.string().optional(),
        tipping: z.string().optional()
      }),
      currency: z.object({
        code: z.string().optional(),
        exchangeRate: z.string().optional(),
        paymentMethods: z.array(z.string()).optional()
      })
    })
  }),
  
  qualityMetrics: z.object({
    informationCoverage: z.number().min(0).max(1),
    sourceReliability: z.number().min(0).max(1),
    informationFreshness: z.number().min(0).max(1),
    relevanceScore: z.number().min(0).max(1)
  }),
  
  processingStatistics: z.object({
    totalProcessingTime: z.number(),
    averageProcessingTimePerQuery: z.number(),
    successfulQueries: z.number(),
    failedQueries: z.number(),
    rateLimitHits: z.number()
  })
});

// ===== Info Gatherer Agent Class =====

/**
 * Website Info Gatherer Agent - Second agent in the multi-agent workflow
 * 
 * Responsibilities:
 * - Execute web searches based on planning context
 * - Scrape and process relevant web content
 * - Extract structured information from gathered documents
 * - Categorize and organize information by type
 * - Provide quality assessment of gathered information
 * - Prepare comprehensive information repository for strategist
 */
export class InfoGathererAgent implements Agent {
  readonly name: AgentType = AgentType.INFO_GATHERER;
  readonly version = "1.0.0";
  readonly timeout = 120000; // 2 minutes for web operations
  readonly maxCost = 2.00; // $2.00 USD for web scraping costs
  
  private config: WorkflowConfig;
  private rateLimitState: Map<string, number> = new Map();
  
  constructor(config: WorkflowConfig) {
    this.config = config;
  }
  
  /**
   * Execute information gathering process
   */
  async execute(context: WorkflowContext): Promise<AgentResult> {
    const startTime = new Date();
    const errors: AgentError[] = [];
    const sessionId = this.generateSessionId();
    
    try {
      // Validate input
      const isValid = await this.validateInput(context);
      if (!isValid) {
        throw new Error("Invalid context provided for information gathering");
      }
      
      // Extract content planning context
      const planningContext = context.state.contentPlanningContext;
      if (!planningContext) {
        throw new Error("Content planning context is required");
      }
      
      // Generate information gathering output
      const gatheringResult = await this.gatherInformation(planningContext, sessionId);
      
      // Create gathered information repository
      const informationRepository: GatheredInformationRepository = {
        sessionId,
        destination: planningContext.destination.name,
        gatheredAt: new Date(),
        planningContext,
        rawDocuments: gatheringResult.gatheredDocuments.map(doc => ({
          id: doc.id,
          url: doc.url,
          title: doc.title,
          content: doc.content,
          category: doc.category,
          relevanceScore: doc.relevanceScore,
          extractedDate: doc.extractedDate,
          metadata: doc.metadata
        })),
        processedInformation: {
          accommodations: gatheringResult.categorizedInformation.accommodations,
          restaurants: gatheringResult.categorizedInformation.restaurants,
          activities: gatheringResult.categorizedInformation.activities,
          transportation: this.mapTransportationInfo(gatheringResult.categorizedInformation.transportation),
          weather: this.mapWeatherInfo(gatheringResult.categorizedInformation.practical.weather),
          events: [], // To be populated from activities
          safety: this.mapSafetyInfo(gatheringResult.categorizedInformation.practical.safety),
          culture: this.mapCulturalInfo(gatheringResult.categorizedInformation.practical.cultural),
          practical: this.mapPracticalInfo(gatheringResult.categorizedInformation.practical),
          pricing: this.extractPricingInfo(gatheringResult.categorizedInformation)
        },
        qualityAssessment: {
          completenessScore: gatheringResult.qualityMetrics.informationCoverage,
          reliabilityScore: gatheringResult.qualityMetrics.sourceReliability,
          freshnessScore: gatheringResult.qualityMetrics.informationFreshness,
          relevanceScore: gatheringResult.qualityMetrics.relevanceScore,
          confidence: this.calculateOverallConfidence(gatheringResult.qualityMetrics)
        },
        searchQueries: planningContext.searchQueries.map(sq => ({
          id: sq.id,
          query: sq.query,
          category: sq.category,
          executed: true,
          resultsCount: Math.floor(Math.random() * 10) + 1, // Mock results count
          executionTime: Math.floor(Math.random() * 5000) + 1000 // Mock execution time
        }))
      };
      
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startTime.getTime();
      
      const metadata: AgentExecutionMetadata = {
        startedAt: startTime,
        completedAt,
        durationMs,
        cost: this.calculateGatheringCost(gatheringResult.gatheringSession),
        provider: LLMProvider.GROQ, // Using Groq for information processing
        tokens: {
          input: this.estimateTokenUsage(planningContext, "input"),
          output: this.estimateTokenUsage(gatheringResult, "output"),
          total: this.estimateTokenUsage(planningContext, "input") + this.estimateTokenUsage(gatheringResult, "output")
        },
        retryAttempts: 0,
        version: this.version
      };
      
      return {
        agent: AgentType.INFO_GATHERER,
        success: true,
        data: informationRepository,
        metadata,
        errors,
        nextAgent: AgentType.STRATEGIST,
        confidence: informationRepository.qualityAssessment.confidence
      };
      
    } catch (error) {
      const agentError: AgentError = {
        type: AgentErrorType.EXECUTION_ERROR,
        message: error instanceof Error ? error.message : "Information gathering failed",
        severity: "high",
        recoverable: true,
        suggestedAction: "Retry with reduced scope or fallback to cached data",
        details: {
          destination: context.formData.destination,
          sessionId,
          timestamp: new Date()
        }
      };
      
      errors.push(agentError);
      
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startTime.getTime();
      
      const metadata: AgentExecutionMetadata = {
        startedAt: startTime,
        completedAt,
        durationMs,
        cost: 0,
        provider: LLMProvider.GROQ,
        tokens: { input: 0, output: 0, total: 0 },
        retryAttempts: 0,
        version: this.version
      };
      
      return {
        agent: AgentType.INFO_GATHERER,
        success: false,
        data: null,
        metadata,
        errors,
        confidence: 0
      };
    }
  }
  
  /**
   * Validate input context
   */
  async validateInput(input: unknown): Promise<boolean> {
    try {
      const context = input as WorkflowContext;
      
      if (!context.formData?.destination) {
        return false;
      }
      
      if (!context.state?.contentPlanningContext) {
        return false;
      }
      
      return true;
      
    } catch {
      return false;
    }
  }
  
  /**
   * Cleanup resources after execution
   */
  async cleanup(): Promise<void> {
    // Clear rate limit state
    this.rateLimitState.clear();
    return Promise.resolve();
  }
  
  /**
   * Gather information from web sources (mock implementation)
   * In a real implementation, this would use web scraping and search APIs
   */
  private async gatherInformation(
    planningContext: ContentPlanningContext,
    sessionId: string
  ): Promise<z.infer<typeof InformationGatheringOutputSchema>> {
    const startTime = new Date();
    
    // Mock implementation - in reality, this would:
    // 1. Execute web searches using search APIs
    // 2. Scrape relevant websites using Cheerio/Puppeteer
    // 3. Process documents using LangChain document loaders
    // 4. Extract structured information using LLMs
    // 5. Store in vector databases for similarity search
    
    const mockDocuments = await this.generateMockDocuments(planningContext);
    const categorizedInfo = await this.categorizeInformation(mockDocuments, planningContext);
    
    const endTime = new Date();
    const processingTime = endTime.getTime() - startTime.getTime();
    
    return {
      destination: planningContext.destination.name,
      gatheringSession: {
        sessionId,
        startTime,
        endTime,
        queriesExecuted: planningContext.searchQueries.length,
        documentsGathered: mockDocuments.length,
        successRate: 0.85 // 85% success rate
      },
      gatheredDocuments: mockDocuments,
      categorizedInformation: categorizedInfo,
      qualityMetrics: {
        informationCoverage: 0.8,
        sourceReliability: 0.75,
        informationFreshness: 0.9,
        relevanceScore: 0.85
      },
      processingStatistics: {
        totalProcessingTime: processingTime,
        averageProcessingTimePerQuery: processingTime / planningContext.searchQueries.length,
        successfulQueries: Math.floor(planningContext.searchQueries.length * 0.85),
        failedQueries: Math.ceil(planningContext.searchQueries.length * 0.15),
        rateLimitHits: 0
      }
    };
  }
  
  /**
   * Generate mock documents for testing (replace with real web scraping)
   */
  private async generateMockDocuments(
    planningContext: ContentPlanningContext
  ): Promise<z.infer<typeof GatheredDocumentSchema>[]> {
    const destination = planningContext.destination.name;
    
    return [
      {
        id: `doc_${Date.now()}_1`,
        url: `https://www.example-travel.com/${destination.toLowerCase().replace(/\s+/g, '-')}`,
        title: `Travel Guide to ${destination}`,
        content: `Comprehensive travel guide covering the best attractions, restaurants, and accommodations in ${destination}. Features detailed information about local culture, transportation options, and practical travel tips.`,
        category: "general",
        relevanceScore: 0.9,
        extractedDate: new Date(),
        metadata: {
          source: "travel-guide",
          domain: "example-travel.com",
          wordCount: 2500,
          language: "en",
          tags: ["travel", "guide", destination.toLowerCase()]
        }
      },
      {
        id: `doc_${Date.now()}_2`,
        url: `https://www.accommodation-reviews.com/${destination.toLowerCase().replace(/\s+/g, '-')}`,
        title: `Best Hotels and Accommodations in ${destination}`,
        content: `Detailed reviews and recommendations for the top accommodations in ${destination}, including luxury hotels, boutique properties, and budget-friendly options. Features pricing information and booking tips.`,
        category: "accommodation",
        relevanceScore: 0.85,
        extractedDate: new Date(),
        metadata: {
          source: "reviews",
          domain: "accommodation-reviews.com",
          wordCount: 1800,
          language: "en",
          tags: ["accommodation", "hotels", destination.toLowerCase()]
        }
      },
      {
        id: `doc_${Date.now()}_3`,
        url: `https://www.dining-guide.com/${destination.toLowerCase().replace(/\s+/g, '-')}-restaurants`,
        title: `Top Restaurants and Local Cuisine in ${destination}`,
        content: `Guide to the best restaurants, local specialties, and food experiences in ${destination}. Includes information about dietary restrictions, price ranges, and reservation requirements.`,
        category: "dining",
        relevanceScore: 0.8,
        extractedDate: new Date(),
        metadata: {
          source: "dining-guide",
          domain: "dining-guide.com",
          wordCount: 1500,
          language: "en",
          tags: ["dining", "restaurants", "cuisine", destination.toLowerCase()]
        }
      }
    ];
  }
  
  /**
   * Categorize gathered information into structured format
   */
  private async categorizeInformation(
    documents: z.infer<typeof GatheredDocumentSchema>[],
    planningContext: ContentPlanningContext
  ) {
    // Mock categorization - in reality, this would use LLM-based extraction
    const destination = planningContext.destination.name;
    
    return {
      accommodations: [
        {
          name: `Grand Hotel ${destination}`,
          type: "luxury hotel",
          rating: 4.5,
          priceRange: "$200-400/night",
          location: "City Center",
          amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Concierge"],
          sourceUrl: documents[0]?.url || "",
          relevanceScore: 0.9
        },
        {
          name: `Budget Inn ${destination}`,
          type: "budget hotel",
          rating: 3.8,
          priceRange: "$50-100/night",
          location: "Near Airport",
          amenities: ["WiFi", "Breakfast", "Parking"],
          sourceUrl: documents[0]?.url || "",
          relevanceScore: 0.7
        }
      ],
      
      restaurants: [
        {
          name: `Local Bistro ${destination}`,
          cuisine: ["local", "international"],
          rating: 4.3,
          priceRange: "$$",
          location: "Old Town",
          specialties: ["Local seafood", "Traditional dishes"],
          dietaryOptions: ["vegetarian", "gluten-free"],
          sourceUrl: documents[2]?.url || "",
          relevanceScore: 0.85
        }
      ],
      
      activities: [
        {
          name: `${destination} Historic Walking Tour`,
          type: "cultural",
          description: "Guided tour through the historic district with local expert guides.",
          duration: "3 hours",
          location: "Historic District",
          cost: "$25 per person",
          seasonality: "Year-round",
          sourceUrl: documents[0]?.url || "",
          relevanceScore: 0.8
        }
      ],
      
      transportation: {
        airports: [
          {
            code: "XXX",
            name: `${destination} International Airport`,
            distance: "15 km from city center",
            transportOptions: ["Taxi", "Bus", "Car rental"]
          }
        ],
        publicTransport: {
          types: ["Metro", "Bus", "Tram"],
          ticketPricing: "$2-5 per ride",
          coverage: "Good coverage in city center"
        },
        rideshare: {
          available: true,
          providers: ["Uber", "Local rideshare"],
          estimatedCosts: "$10-20 for typical city rides"
        }
      },
      
      practical: {
        weather: {
          currentConditions: "Pleasant with occasional rain",
          forecast: "Mild temperatures expected",
          bestTimeToVisit: "Spring and Fall for best weather"
        },
        safety: {
          overallRating: "Generally safe for tourists",
          recommendations: [
            "Keep valuables secure",
            "Stay in well-lit areas at night",
            "Use official transportation"
          ],
          areasToAvoid: ["Industrial district after dark"]
        },
        cultural: {
          customs: ["Greeting with handshake", "Respect for local traditions"],
          etiquette: ["Dress modestly in religious sites", "Tip 10-15% at restaurants"],
          language: "Local language with English widely spoken",
          tipping: "10-15% at restaurants, round up for taxis"
        },
        currency: {
          code: "USD", // Default to USD for mock
          exchangeRate: "Current market rate",
          paymentMethods: ["Cash", "Credit cards", "Mobile payments"]
        }
      }
    };
  }
  
  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `info_gathering_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
  
  /**
   * Calculate information gathering cost
   */
  private calculateGatheringCost(session: any): number {
    // Base cost for web operations
    const baseCost = 0.25;
    
    // Additional cost per query
    const perQueryCost = 0.05;
    const queryCost = session.queriesExecuted * perQueryCost;
    
    // Additional cost per document processed
    const perDocCost = 0.02;
    const docCost = session.documentsGathered * perDocCost;
    
    return baseCost + queryCost + docCost;
  }
  
  /**
   * Estimate token usage
   */
  private estimateTokenUsage(data: any, type: "input" | "output"): number {
    if (type === "input") {
      // Estimate input tokens for processing planning context
      return 1000;
    } else {
      // Estimate output tokens for structured information
      return 2500;
    }
  }
  
  /**
   * Calculate overall confidence from quality metrics
   */
  private calculateOverallConfidence(metrics: any): number {
    return (
      metrics.informationCoverage * 0.3 +
      metrics.sourceReliability * 0.3 +
      metrics.informationFreshness * 0.2 +
      metrics.relevanceScore * 0.2
    );
  }
  
  // ===== Helper Methods for Data Mapping =====
  
  /**
   * Map transportation info to expected format
   */
  private mapTransportationInfo(transportInfo: any): any {
    return {
      airports: transportInfo.airports || [],
      publicTransport: {
        types: transportInfo.publicTransport?.types || [],
        ticketPricing: {},
        coverage: transportInfo.publicTransport?.coverage || ""
      },
      rideshare: {
        available: transportInfo.rideshare?.available || false,
        providers: transportInfo.rideshare?.providers || [],
        estimatedCosts: {}
      },
      carRental: {
        available: true,
        providers: ["Major rental companies"],
        averageDailyCost: 50,
        parkingInfo: "Street parking and garages available"
      },
      walkability: {
        score: 7.5,
        description: "Generally walkable city center"
      }
    };
  }
  
  /**
   * Map weather info to expected format
   */
  private mapWeatherInfo(weatherInfo: any): any {
    return {
      destination: this.config.observability?.destination || "Unknown",
      forecast: [],
      packingTips: [
        "Pack layers for changing weather",
        "Bring rain protection",
        "Comfortable walking shoes recommended"
      ]
    };
  }
  
  /**
   * Map safety info to expected format
   */
  private mapSafetyInfo(safetyInfo: any): any {
    return {
      overallRating: 7.5,
      categories: {
        pettyTheft: 6,
        violentCrime: 8,
        scams: 7,
        naturalHazards: 9,
        healthRisks: 8
      },
      recommendations: safetyInfo.recommendations || [],
      emergencyContacts: {
        police: "911",
        medical: "911",
        tourism: "Tourist hotline"
      },
      areas: {
        safe: ["City center", "Tourist areas"],
        caution: ["Late night streets"],
        avoid: safetyInfo.areasToAvoid || []
      }
    };
  }
  
  /**
   * Map cultural info to expected format
   */
  private mapCulturalInfo(culturalInfo: any): any {
    return {
      customs: culturalInfo.customs || [],
      etiquette: culturalInfo.etiquette || [],
      language: {
        primary: culturalInfo.language || "English",
        common: ["English"],
        phrases: {
          "hello": "Hello",
          "thank you": "Thank you",
          "please": "Please"
        }
      },
      tipping: {
        expected: true,
        amounts: {
          "restaurant": "15-20%",
          "taxi": "Round up",
          "hotel": "$1-2 per service"
        }
      },
      dress: {
        general: "Casual to smart casual",
        religious: "Conservative dress required",
        formal: "Business attire for upscale venues"
      },
      holidays: []
    };
  }
  
  /**
   * Map practical info to expected format
   */
  private mapPracticalInfo(practicalInfo: any): any {
    return {
      currency: {
        code: practicalInfo.currency?.code || "USD",
        symbol: "$",
        exchangeRate: 1.0
      },
      electricity: {
        voltage: 120,
        plugType: ["Type A", "Type B"]
      },
      timeZone: {
        name: "Local Time Zone",
        offset: "-05:00",
        dst: true
      },
      internet: {
        wifiAvailability: "Widely available",
        mobileData: "Good coverage",
        costs: {
          "wifi": "Often free",
          "mobile_data": "$20-50/month"
        }
      },
      visa: {
        required: false
      }
    };
  }
  
  /**
   * Extract pricing info from categorized information
   */
  private extractPricingInfo(categorizedInfo: any): any {
    return {
      accommodation: {
        budget: { "per_night": 50 },
        mid: { "per_night": 150 },
        luxury: { "per_night": 300 }
      },
      food: {
        streetFood: { "per_meal": 8 },
        casual: { "per_meal": 25 },
        fineDining: { "per_meal": 75 }
      },
      activities: {
        free: ["Walking tours", "Parks", "Beaches"],
        budget: { "attraction": 15 },
        premium: { "guided_tour": 50 }
      },
      transport: {
        local: { "per_ride": 3 },
        intercity: { "per_trip": 25 },
        international: { "per_trip": 200 }
      },
      dailyBudget: {
        backpacker: 50,
        midRange: 150,
        luxury: 300
      }
    };
  }
}

// ===== Factory and Utility Functions =====

/**
 * Create a new Info Gatherer agent instance
 */
export function createInfoGathererAgent(config: WorkflowConfig): InfoGathererAgent {
  return new InfoGathererAgent(config);
}

/**
 * Validate information gathering output
 */
export function validateInformationGatheringOutput(data: unknown): z.infer<typeof InformationGatheringOutputSchema> {
  return InformationGatheringOutputSchema.parse(data);
}

/**
 * Create mock search queries for testing
 */
export function createMockSearchQueries(destination: string): z.infer<typeof WebSearchQuerySchema>[] {
  return [
    {
      query: `best hotels ${destination}`,
      category: "accommodation",
      priority: "high",
      expectedSources: ["official", "reviews"],
      maxResults: 10
    },
    {
      query: `top restaurants ${destination}`,
      category: "dining",
      priority: "high",
      expectedSources: ["reviews", "blogs"],
      maxResults: 8
    },
    {
      query: `things to do ${destination}`,
      category: "activities",
      priority: "high",
      expectedSources: ["official", "blogs"],
      maxResults: 12
    },
    {
      query: `${destination} transportation guide`,
      category: "transportation",
      priority: "medium",
      expectedSources: ["official"],
      maxResults: 5
    },
    {
      query: `${destination} travel tips safety`,
      category: "practical",
      priority: "medium",
      expectedSources: ["official", "blogs"],
      maxResults: 6
    }
  ];
}
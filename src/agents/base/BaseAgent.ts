/**
 * Base Agent Classes for Multi-Agent AI Workflow
 * 
 * This file implements the base classes for the four specialized agents in the 
 * multi-agent workflow system, using the latest LangGraph patterns for agent coordination.
 * 
 * Architecture:
 * - BaseAgent: Abstract base class with common functionality
 * - Specialized agent classes extending BaseAgent
 * - LangGraph Command-based state transitions
 * - TypeScript strict typing throughout
 * 
 * Based on Context7 LangGraph patterns with StateGraph orchestration.
 */

import { HumanMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { Index as UpstashIndex } from "@upstash/vector";
import { z } from "zod";

// Import comprehensive LLM Provider Manager
import { getLLMProviderManager, LLMRequest, LLMResponse } from '../providers/LLMProviderManager';
import { 
  Agent, 
  AgentType, 
  AgentResult,
  WorkflowContext, 
  TravelFormData,
  AgentError,
  AgentErrorType
} from "../../types/agents";

// =============================================================================
// ABSTRACT BASE AGENT CLASS
// =============================================================================

/**
 * Abstract base class for all agents in the multi-agent workflow.
 * Implements common functionality and establishes the contract for specialized agents.
 * 
 * Based on LangGraph agent patterns with Command-based state transitions.
 */
export abstract class BaseAgent implements Agent {
  public readonly abstract name: AgentType;
  public readonly abstract version: string;
  public readonly abstract timeout: number;
  public readonly abstract maxCost: number;

  // Protected properties available to subclasses
  protected startTime: Date | null = null;
  protected executionContext: WorkflowContext | null = null;
  protected errors: AgentError[] = [];

  /**
   * Abstract method that each agent must implement for its specific functionality
   */
  public abstract execute(context: WorkflowContext): Promise<AgentResult>;

  /**
   * Abstract method for input validation specific to each agent type
   */
  public abstract validateInput(input: unknown): Promise<boolean>;

  /**
   * Common cleanup method that can be extended by subclasses
   */
  public async cleanup(): Promise<void> {
    this.startTime = null;
    this.executionContext = null;
    this.errors = [];
  }

  // =============================================================================
  // PROTECTED HELPER METHODS FOR SUBCLASSES
  // =============================================================================

  /**
   * Creates a standardized error object for workflow error tracking
   */
  protected createError(
    type: AgentErrorType,
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    details?: Record<string, unknown>,
    recoverable: boolean = true
  ): AgentError {
    return {
      type,
      message,
      severity,
      recoverable,
      ...(details ? { details } : {})
    };
  }

  /**
   * Logs and tracks errors during agent execution
   */
  protected handleError(error: AgentError): void {
    this.errors.push(error);
    console.error(`[${this.name}] ${error.severity.toUpperCase()}: ${error.message}`, error.details);
  }

  /**
   * Validates that the agent can execute given the current workflow state
   */
  protected validateExecutionState(context: WorkflowContext): boolean {
    if (!context) {
      this.handleError(this.createError(
        AgentErrorType.VALIDATION_ERROR,
        'critical',
        'Execution context is null or undefined',
        { agentName: this.name },
        false
      ));
      return false;
    }

    if (!context.formData) {
      this.handleError(this.createError(
        AgentErrorType.VALIDATION_ERROR,
        'high',
        'Form data is missing from context',
        { agentName: this.name },
        false
      ));
      return false;
    }

    return true;
  }

  /**
   * Creates a system message for LLM interactions with agent-specific context
   */
  protected createSystemMessage(content: string, additionalContext?: Record<string, any>): SystemMessage {
    const contextData = {
      agent: this.name,
      timestamp: new Date().toISOString(),
      ...additionalContext
    };

    return new SystemMessage({
      content: `${content}\n\nContext: ${JSON.stringify(contextData, null, 2)}`
    });
  }

  /**
   * Creates a human message representing user input or form data
   */
  protected createHumanMessage(content: string): HumanMessage {
    return new HumanMessage({
      content,
      additional_kwargs: {
        agent: this.name,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Tracks execution time and creates performance metrics
   */
  protected startExecution(): void {
    this.startTime = new Date();
  }

  /**
   * Calculates execution time and creates performance metrics
   */
  protected getExecutionTime(): number {
    if (!this.startTime) return 0;
    return Date.now() - this.startTime.getTime();
  }

  /**
   * Validates timeout constraints
   */
  protected checkTimeout(): boolean {
    const executionTime = this.getExecutionTime();
    if (executionTime > this.timeout) {
      this.handleError(this.createError(
        AgentErrorType.TIMEOUT_ERROR,
        'high',
        `Agent execution exceeded timeout of ${this.timeout}ms`,
        { executionTime, agentName: this.name },
        false
      ));
      return false;
    }
    return true;
  }

  /**
   * Creates a structured result object for agent output
   */
  protected createResult(
    success: boolean,
    data?: any
  ): AgentResult {
    const now = new Date();
    return {
      agent: this.name,
      success,
      data: data || null,
      metadata: {
        startedAt: this.startTime || now,
        completedAt: now,
        durationMs: this.getExecutionTime(),
        cost: 0, // To be calculated by implementations
        provider: 'openai' as any, // Default provider, to be overridden
        tokens: {
          input: 0,
          output: 0,
          total: 0
        },
        retryAttempts: 0,
        version: this.version
      },
      errors: [...this.errors],
      confidence: success ? 0.9 : 0.0
    };
  }

  /**
   * Execute LLM request using comprehensive provider manager with fallbacks
   */
  protected async executeLLMRequest(
    prompt: string, 
    structuredOutput?: z.ZodSchema<any>,
    options: {
      maxTokens?: number;
      temperature?: number;
      timeout?: number;
      retries?: number;
      fallbackToAll?: boolean;
    } = {}
  ): Promise<LLMResponse> {
    const providerManager = getLLMProviderManager();
    
    const request: LLMRequest = {
      prompt,
      ...(structuredOutput && { structuredOutput }),
      maxTokens: options.maxTokens || 4000,
      temperature: options.temperature || 0.2,
      timeout: options.timeout || this.timeout,
      retries: options.retries || 3,
      fallbackToAll: options.fallbackToAll ?? true
    };

    try {
      return await providerManager.execute(request);
    } catch (error) {
      const agentError = this.createError(
        AgentErrorType.EXECUTION_ERROR,
        'high',
        `LLM request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { request, error: error instanceof Error ? error.stack : error },
        false
      );
      this.handleError(agentError);
      throw error;
    }
  }
}

// =============================================================================
// CONTENT PLANNER AGENT CLASS
// =============================================================================

/**
 * Content Planner Agent - First agent in the workflow
 * Analyzes user requirements and determines information gathering needs using LLM
 */
export class ContentPlannerAgent extends BaseAgent {
  public readonly name = AgentType.CONTENT_PLANNER;
  public readonly version = '1.0.0';
  public readonly timeout = 30000; // 30 seconds
  public readonly maxCost = 0.50; // $0.50 USD

  /**
   * Main execution method for content planning with LLM integration
   */
  public async execute(context: WorkflowContext): Promise<AgentResult> {
    this.startExecution();
    this.executionContext = context;

    try {
      // Validate execution context
      if (!this.validateExecutionState(context)) {
        return this.createResult(false, null);
      }

      // Validate specific input requirements for content planner
      if (!await this.validateInput(context.formData)) {
        return this.createResult(false, null);
      }

      // Check timeout before processing
      if (!this.checkTimeout()) {
        return this.createResult(false, null);
      }

      // Perform LLM-powered content planning
      const planningResult = await this.performContentPlanning(context);

      // Check timeout after processing
      if (!this.checkTimeout()) {
        return this.createResult(false, null);
      }

      return this.createResult(true, planningResult);

    } catch (error) {
      const agentError = this.createError(
        AgentErrorType.EXECUTION_ERROR,
        'high',
        `Content planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error: error instanceof Error ? error.stack : error },
        true
      );
      this.handleError(agentError);
      return this.createResult(false, null);
    }
  }

  /**
   * Validates input specific to content planning requirements
   */
  public async validateInput(input: unknown): Promise<boolean> {
    if (!input || typeof input !== 'object') {
      this.handleError(this.createError(
        AgentErrorType.VALIDATION_ERROR,
        'high',
        'Input is not a valid object',
        { inputType: typeof input }
      ));
      return false;
    }

    const formData = input as TravelFormData;

    // Validate required fields for content planning
    const requiredFields = ['destination', 'adults', 'children', 'departureDate', 'returnDate', 'budget'];
    for (const field of requiredFields) {
      if (!(field in formData) || formData[field as keyof TravelFormData] === null || formData[field as keyof TravelFormData] === undefined) {
        this.handleError(this.createError(
          AgentErrorType.VALIDATION_ERROR,
          'high',
          `Required field '${field}' is missing or null`,
          { field, formData }
        ));
        return false;
      }
    }

    return true;
  }

  /**
   * LLM-powered content planning logic using structured output
   */
  private async performContentPlanning(context: WorkflowContext): Promise<any> {
    // Build messages for LLM
    const messages = this.buildPlanningMessages(context);

    // Define schema for structured output
    const planningSchema = z.object({
      analysis: z.string().describe(
        "Analysis of the trip requirements and identification of needed information"
      ),
      informationNeeded: z.array(z.object({
        category: z.enum(['destination_info', 'weather', 'attractions', 'restaurants', 'accommodations', 'transportation', 'events', 'culture']),
        query: z.string().describe("Specific search query for this information"),
        priority: z.enum(['high', 'medium', 'low']).describe("Priority level for gathering this information"),
        reasoning: z.string().describe("Why this information is needed for the trip")
      })).describe("List of specific information that needs to be gathered from the web"),
      nextAgent: z.enum(['info_gatherer', 'strategist', 'compiler']).describe(
        "Next agent to hand off to - typically 'info_gatherer' for content planning"
      ),
      planningNotes: z.string().describe("Internal notes for the planning process")
    });

    try {
      // Execute LLM request with structured output
      const response = await this.executeLLMRequest(
        messages.map(m => m.content).join('\n'),
        planningSchema
      );

      // Parse the structured response - it comes as content when structured output is used
      const parsedResponse = typeof response.content === 'string' 
        ? JSON.parse(response.content) 
        : response.content;

      return {
        analysis: parsedResponse.analysis,
        informationNeeded: parsedResponse.informationNeeded,
        planningNotes: parsedResponse.planningNotes,
        nextAgent: parsedResponse.nextAgent,
        searchQueries: parsedResponse.informationNeeded.map((item: any) => item.query),
        priorityCategories: parsedResponse.informationNeeded.filter((item: any) => item.priority === 'high').map((item: any) => item.category)
      };

    } catch (error) {
      // Fallback to rule-based planning if LLM fails
      console.warn('LLM content planning failed, using fallback:', error);
      return this.getFallbackPlanning(context);
    }
  }

  /**
   * Builds messages for LLM content planning
   */
  private buildPlanningMessages(context: WorkflowContext): BaseMessage[] {
    const systemPrompt = [
      "You are a Content Planner Agent specialized in analyzing travel requests and identifying what information needs to be gathered from the web.",
      "",
      "Your responsibilities:",
      "1. Analyze the user's trip details (destination, dates, travelers, preferences, budget)",
      "2. Identify specific information that needs to be gathered from real-time web sources",
      "3. Categorize and prioritize the information needs",
      "4. Create specific search queries for each information category",
      "5. Provide reasoning for why each piece of information is important",
      "",
      "Information categories you can identify:",
      "- destination_info: General destination information, travel advisories, visa requirements",
      "- weather: Current weather conditions, seasonal patterns, what to pack",
      "- attractions: Tourist attractions, landmarks, must-see places, opening hours, tickets",
      "- restaurants: Local cuisine, restaurant recommendations, dietary restrictions",
      "- accommodations: Hotel availability, pricing, neighborhood recommendations",
      "- transportation: Local transport options, airport transfers, car rentals",
      "- events: Local events, festivals, seasonal activities during travel dates",
      "- culture: Local customs, etiquette, language tips, cultural considerations",
      "",
      "For each information need, provide:",
      "- A specific, actionable search query",
      "- Priority level (high/medium/low) based on trip requirements",
      "- Clear reasoning for why this information is needed",
      "",
      "Your analysis should be thorough but focused on actionable information gathering.",
      "Consider the user's travel style, group composition, and specific preferences.",
      "Always identify at least 3-5 key information areas that need research."
    ].join('\n');

    const userPrompt = this.buildUserPrompt(context.formData);

    return [
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt)
    ];
  }

  /**
   * Builds user prompt from form data
   */
  private buildUserPrompt(formData: TravelFormData): string {
    const details = [
      `Destination: ${formData.destination}`,
      `Travel Dates: ${formData.departureDate} to ${formData.returnDate}`,
      `Travelers: ${formData.adults} adults${formData.children > 0 ? `, ${formData.children} children` : ''}`,
      `Budget: ${formData.budget.mode === 'per-person' ? 'Per person' : 'Total'} budget of $${formData.budget.amount}`,
    ];

    if (formData.preferences.travelStyle) {
      details.push(`Travel Style: ${formData.preferences.travelStyle}`);
    }

    if (formData.preferences.accommodationType) {
      details.push(`Accommodation Type: ${formData.preferences.accommodationType}`);
    }

    if (formData.preferences.dietaryRestrictions && formData.preferences.dietaryRestrictions.length > 0) {
      details.push(`Dietary Restrictions: ${formData.preferences.dietaryRestrictions.join(', ')}`);
    }

    return [
      "Please analyze this travel request and identify what information needs to be gathered:",
      "",
      ...details,
      "",
      "What specific information should be researched to create an optimal travel itinerary?"
    ].join('\n');
  }



  /**
   * Fallback planning when LLM is unavailable
   */
  private getFallbackPlanning(context: WorkflowContext): any {
    const { formData } = context;
    
    return {
      analysis: `Analyzing trip to ${formData.destination} for ${formData.adults} adult(s) ${formData.children > 0 ? `and ${formData.children} children ` : ''}from ${formData.departureDate} to ${formData.returnDate}.`,
      informationNeeded: [
        {
          category: 'accommodations',
          query: `hotels ${formData.destination} ${formData.departureDate} ${formData.returnDate}`,
          priority: 'high',
          reasoning: 'Need to find suitable accommodations for the specified dates and party size'
        },
        {
          category: 'transportation', 
          query: `flights to ${formData.destination} ${formData.departureDate}`,
          priority: 'high',
          reasoning: 'Research transportation options to and within the destination'
        },
        {
          category: 'attractions',
          query: `things to do in ${formData.destination} attractions`,
          priority: 'medium',
          reasoning: 'Identify activities and attractions aligned with travel preferences'
        },
        {
          category: 'weather',
          query: `${formData.destination} weather ${formData.departureDate}`,
          priority: 'medium',
          reasoning: 'Check weather conditions to help with packing and activity planning'
        }
      ],
      nextAgent: 'info_gatherer',
      planningNotes: 'Fallback planning used due to LLM unavailability',
      searchQueries: [
        `hotels ${formData.destination} ${formData.departureDate} ${formData.returnDate}`,
        `flights to ${formData.destination} ${formData.departureDate}`,
        `things to do in ${formData.destination} attractions`,
        `${formData.destination} weather ${formData.departureDate}`
      ],
      priorityCategories: ['accommodations', 'transportation']
    };
  }
}

// =============================================================================
// INFO GATHERER AGENT CLASS
// =============================================================================

/**
 * Info Gatherer Agent - Second agent in the workflow
 * Collects real-time information using integrated services and stores in vector database
 */
export class InfoGathererAgent extends BaseAgent {
  public readonly name = AgentType.INFO_GATHERER;
  public readonly version = '2.0.0';
  public readonly timeout = 60000; // 60 seconds for comprehensive data gathering
  public readonly maxCost = 2.00; // $2.00 USD for web search + embeddings + vector operations
  
  // Service instances
  private vectorService: any = null;
  private embeddingsService: any = null;
  private webSearchService: any = null;
  private textSplitterService: any = null;

  public async execute(context: WorkflowContext): Promise<AgentResult> {
    this.startExecution();
    this.executionContext = context;

    try {
      if (!this.validateExecutionState(context)) {
        return this.createResult(false, null);
      }

      if (!await this.validateInput(context)) {
        return this.createResult(false, null);
      }

      if (!this.checkTimeout()) {
        return this.createResult(false, null);
      }

      // Initialize all required services
      await this.initializeServices();

      // Perform comprehensive info gathering with integrated services
      const gatheringResult = await this.performAdvancedInfoGathering(context);

      if (!this.checkTimeout()) {
        return this.createResult(false, null);
      }

      return this.createResult(true, gatheringResult);

    } catch (error) {
      const agentError = this.createError(
        AgentErrorType.EXECUTION_ERROR,
        'high',
        `Advanced info gathering failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error: error instanceof Error ? error.stack : error },
        true
      );
      this.handleError(agentError);
      return this.createResult(false, null);
    }
  }

  public async validateInput(input: unknown): Promise<boolean> {
    if (!input || typeof input !== 'object') {
      return false;
    }

    const context = input as WorkflowContext;

    // Validate that content planner results are available
    const plannerResult = context.agentResults[AgentType.CONTENT_PLANNER];
    if (!plannerResult || !plannerResult.success) {
      this.handleError(this.createError(
        AgentErrorType.VALIDATION_ERROR,
        'high',
        'Content planner results are not available or failed',
        { plannerResult }
      ));
      return false;
    }

    return true;
  }

  /**
   * Initialize all required services for advanced info gathering
   */
  private async initializeServices(): Promise<void> {
    try {
      // Dynamic imports to avoid circular dependencies
      const { upstashVectorService } = await import('../../../api/services/vector/upstash');
      const { jinaEmbeddingsService } = await import('../../../api/services/embeddings/jina');
      const { tavilyWebSearchService } = await import('../../../api/services/search/tavily');
      const { langChainTextSplitterService } = await import('../../../api/services/text/splitter');

      this.vectorService = upstashVectorService;
      this.embeddingsService = jinaEmbeddingsService;
      this.webSearchService = tavilyWebSearchService;
      this.textSplitterService = langChainTextSplitterService;

      // Initialize all services
      await Promise.all([
        this.vectorService.initialize(),
        this.embeddingsService.initialize(), 
        this.webSearchService.initialize(),
        this.textSplitterService.initialize()
      ]);

      console.log('InfoGathererAgent: All services initialized successfully');
    } catch (error) {
      throw new Error(`Service initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Advanced information gathering using integrated services
   */
  private async performAdvancedInfoGathering(context: WorkflowContext): Promise<any> {
    const plannerResult = context.agentResults[AgentType.CONTENT_PLANNER];
    const { formData } = context;
    
    if (!plannerResult?.data) {
      throw new Error('Content planner data not available');
    }

    // Extract information needs from content planner
    const plannerData = plannerResult.data as any;
    const informationNeeded = plannerData.informationNeeded || [];
    const searchQueries = plannerData.searchQueries || [];

    // Initialize result structure
    const gatheredData: any = {
      categories: {},
      sources: [],
      vectorOperations: 0,
      totalDataPoints: 0,
      totalTokensUsed: 0,
      searchResults: [],
      embeddingResults: [],
      timestamp: new Date().toISOString(),
      destination: formData.destination,
      searchQueriesUsed: searchQueries
    };

    // Process information needs by priority
    const prioritizedItems = this.prioritizeInformationNeeds(informationNeeded);
    
    for (const item of prioritizedItems) {
      try {
        const categoryData = await this.gatherCategoryDataAdvanced(item, formData, gatheredData);
        gatheredData.categories[item.category] = categoryData;
        
        // Update aggregated metrics
        gatheredData.totalDataPoints += categoryData.dataPoints || 0;
        gatheredData.totalTokensUsed += categoryData.tokensUsed || 0;
        gatheredData.vectorOperations += categoryData.vectorOperations || 0;
        
        if (categoryData.sources) {
          gatheredData.sources.push(...categoryData.sources);
        }
        
        if (categoryData.searchResults) {
          gatheredData.searchResults.push(...categoryData.searchResults);
        }

        // Check timeout periodically
        if (!this.checkTimeout()) {
          console.warn('InfoGatherer timeout reached, stopping data collection');
          break;
        }

        // Small delay to avoid overwhelming APIs
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.warn(`Failed to gather data for category ${item.category}:`, error);
        
        // Add error info to results for debugging
        gatheredData.categories[item.category] = {
          error: error instanceof Error ? error.message : String(error),
          category: item.category,
          dataPoints: 0
        };
      }
    }

    return {
      ...gatheredData,
      summary: `Gathered ${gatheredData.totalDataPoints} data points across ${Object.keys(gatheredData.categories).length} categories using ${gatheredData.totalTokensUsed} tokens and ${gatheredData.vectorOperations} vector operations`,
      nextAgent: 'strategist',
      success: gatheredData.totalDataPoints > 0
    };
  }

  /**
   * Prioritize information needs for efficient processing
   */
  private prioritizeInformationNeeds(informationNeeded: any[]): any[] {
    const highPriority = informationNeeded.filter(item => item.priority === 'high');
    const mediumPriority = informationNeeded.filter(item => item.priority === 'medium');
    const lowPriority = informationNeeded.filter(item => item.priority === 'low');
    
    return [...highPriority, ...mediumPriority, ...lowPriority];
  }

  /**
   * Gather data for a specific category using all integrated services
   */
  private async gatherCategoryDataAdvanced(item: any, formData: TravelFormData, gatheredData: any): Promise<any> {
    const { category, query, reasoning } = item;
    const categoryResult: any = {
      category,
      query,
      reasoning,
      dataPoints: 0,
      tokensUsed: 0,
      vectorOperations: 0,
      sources: [],
      searchResults: [],
      timestamp: new Date().toISOString()
    };

    try {
      // Step 1: Perform web search for real-time information
      const searchContext = {
        destination: formData.destination,
        budget: formData.budget.amount.toString(),
        travelStyle: formData.preferences.travelStyle || 'general',
        duration: this.calculateTripDuration(formData.departureDate, formData.returnDate),
        interests: [category]
      };

      const searchResults = await this.webSearchService.searchWithContext(query, searchContext);
      
      categoryResult.searchResults = searchResults.results;
      categoryResult.sources = searchResults.results.map((result: any) => ({
        url: result.url,
        title: result.title,
        score: result.score
      }));
      categoryResult.dataPoints = searchResults.results.length;

      // Step 2: Process and split content for vector storage
      const contentToProcess = searchResults.results
        .map((result: any) => result.content)
        .filter((content: string) => content && content.length > 50); // Filter out very short content

      if (contentToProcess.length > 0) {
        // Combine all content for processing
        const combinedContent = contentToProcess.join('\n\n---\n\n');
        
        // Split content into appropriate chunks
        const { ContentType } = await import('../../../api/services/text/splitter');
        const splittingResult = await this.textSplitterService.splitByContentType(
          combinedContent,
          ContentType.TRAVEL_CONTENT
        );

        // Step 3: Generate embeddings for content chunks
        const embeddingResults = await this.embeddingsService.embedTravelContent(
          splittingResult.chunks.map((chunk: any) => chunk.content),
          splittingResult.chunks.map((chunk: any) => ({
            type: category as any,
            location: formData.destination,
            category: category,
            source_url: categoryResult.sources[0]?.url || 'web_search',
            last_updated: new Date().toISOString()
          }))
        );

        categoryResult.tokensUsed = embeddingResults.reduce((sum: number, result: any) => sum + result.tokens_used, 0);

        // Step 4: Store in vector database
        const vectorData = embeddingResults.map((result: any, index: number) => ({
          id: `${formData.destination.replace(/\s+/g, '-')}-${category}-${Date.now()}-${index}`,
          vector: result.embedding,
          metadata: result.metadata,
          content: result.content
        }));

        const vectorResult = await this.vectorService.upsertVectors(vectorData);
        categoryResult.vectorOperations = vectorResult.upserted;

        // Step 5: Perform semantic similarity search to verify storage
        if (embeddingResults.length > 0) {
          const queryEmbedding = await this.embeddingsService.embedQuery(query);
          const similarityResults = await this.vectorService.searchByLocationAndType(
            queryEmbedding.embedding,
            formData.destination,
            category as any,
            3
          );
          
          categoryResult.vectorVerification = {
            stored: vectorResult.upserted,
            retrieved: similarityResults.length,
            topSimilarityScore: similarityResults[0]?.score || 0
          };
        }
      }

    } catch (error) {
      console.error(`Error in advanced category data gathering for ${category}:`, error);
      categoryResult.error = error instanceof Error ? error.message : String(error);
    }

    return categoryResult;
  }

  /**
   * Calculate trip duration in days
   */
  private calculateTripDuration(departureDate: string, returnDate: string): string {
    try {
      const departure = new Date(departureDate);
      const returnD = new Date(returnDate);
      const diffTime = Math.abs(returnD.getTime() - departure.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} days`;
    } catch (error) {
      return '1 week'; // fallback
    }
  }

  /**
   * Legacy method maintained for backward compatibility
   */
  private async initializeVectorStore(): Promise<void> {
    console.warn('initializeVectorStore is deprecated, use initializeServices instead');
    await this.initializeServices();
  }

  /**
   * Legacy method - now replaced by advanced gathering
   */
  private async performInfoGathering(context: WorkflowContext): Promise<any> {
    console.warn('performInfoGathering is deprecated, using performAdvancedInfoGathering');
    return this.performAdvancedInfoGathering(context);
  }
}

// =============================================================================
// STRATEGIST AGENT CLASS
// =============================================================================

/**
 * Strategist Agent - Third agent in the workflow
 * Analyzes gathered information using RAG and creates strategic travel recommendations
 */
export class StrategistAgent extends BaseAgent {
  public readonly name = AgentType.STRATEGIST;
  public readonly version = '1.0.0';
  public readonly timeout = 40000; // 40 seconds
  public readonly maxCost = 0.75; // $0.75 USD
  
  private vectorIndex: UpstashIndex | null = null;

  public async execute(context: WorkflowContext): Promise<AgentResult> {
    this.startExecution();
    this.executionContext = context;

    try {
      if (!this.validateExecutionState(context)) {
        return this.createResult(false, null);
      }

      if (!await this.validateInput(context)) {
        return this.createResult(false, null);
      }

      if (!this.checkTimeout()) {
        return this.createResult(false, null);
      }

      // Initialize vector connection for RAG
      await this.initializeVectorStore();

      // Perform LLM-powered strategic analysis with RAG
      const strategicResult = await this.performStrategicAnalysis(context);

      if (!this.checkTimeout()) {
        return this.createResult(false, null);
      }

      return this.createResult(true, strategicResult);

    } catch (error) {
      const agentError = this.createError(
        AgentErrorType.EXECUTION_ERROR,
        'high',
        `Strategic analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error: error instanceof Error ? error.stack : error },
        true
      );
      this.handleError(agentError);
      return this.createResult(false, null);
    }
  }

  public async validateInput(input: unknown): Promise<boolean> {
    if (!input || typeof input !== 'object') {
      return false;
    }

    const context = input as WorkflowContext;

    // Validate that both planner and gatherer results are available
    const plannerResult = context.agentResults[AgentType.CONTENT_PLANNER];
    const gathererResult = context.agentResults[AgentType.INFO_GATHERER];

    if (!plannerResult || !plannerResult.success) {
      this.handleError(this.createError(
        AgentErrorType.VALIDATION_ERROR,
        'high',
        'Content planner results are required for strategic analysis',
        { plannerResult }
      ));
      return false;
    }

    if (!gathererResult || !gathererResult.success) {
      this.handleError(this.createError(
        AgentErrorType.VALIDATION_ERROR,
        'high',
        'Info gatherer results are required for strategic analysis',
        { gathererResult }
      ));
      return false;
    }

    return true;
  }

  /**
   * Initialize Upstash Vector store for RAG retrieval
   */
  private async initializeVectorStore(): Promise<void> {
    if (!process.env['UPSTASH_VECTOR_REST_URL'] || !process.env['UPSTASH_VECTOR_REST_TOKEN']) {
      console.warn('Upstash Vector credentials not found. Strategic analysis will proceed without RAG.');
      return;
    }

    this.vectorIndex = new UpstashIndex({
      url: process.env['UPSTASH_VECTOR_REST_URL'],
      token: process.env['UPSTASH_VECTOR_REST_TOKEN'],
    });
  }

  /**
   * LLM-powered strategic analysis with RAG capabilities
   */
  private async performStrategicAnalysis(context: WorkflowContext): Promise<any> {
    const plannerResult = context.agentResults[AgentType.CONTENT_PLANNER];
    const gathererResult = context.agentResults[AgentType.INFO_GATHERER];
    const { formData } = context;

    if (!plannerResult?.data || !gathererResult?.data) {
      throw new Error('Required agent results not available for strategic analysis');
    }

    // Extract relevant data
    const plannerData = plannerResult.data as any;
    const gathererData = gathererResult.data as any;

    // Perform RAG-enhanced strategic queries
    const strategicQueries = await this.generateStrategicQueries(formData, plannerData, gathererData);
    const retrievedContext = await this.retrieveRelevantContext(strategicQueries, formData);

    // Generate strategic recommendations using LLM
    const recommendations = await this.generateStrategicRecommendations(
      formData,
      plannerData,
      gathererData,
      retrievedContext,
      strategicQueries
    );

    return {
      recommendations: recommendations.recommendations,
      budgetOptimization: recommendations.budgetOptimization,
      riskAssessment: recommendations.riskAssessment,
      timeline: recommendations.timeline,
      itineraryStructure: recommendations.itineraryStructure,
      nextAgent: 'compiler',
      strategicQueries,
      retrievedDataPoints: retrievedContext.length,
      confidenceScore: recommendations.confidenceScore,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate strategic queries for RAG retrieval
   */
  private async generateStrategicQueries(
    formData: TravelFormData, 
    plannerData: any, 
    _gathererData: any
  ): Promise<string[]> {
    try {
      const querySchema = z.object({
        strategicQueries: z.array(z.string()).describe(
          "Array of strategic queries to retrieve relevant travel information for recommendations"
        ),
        reasoning: z.string().describe("Explanation of the strategic approach")
      });

      const prompt = this.buildQueryGenerationPrompt(formData, plannerData, _gathererData);
      const response = await this.executeLLMRequest(prompt, querySchema);
      
      // Parse the structured response
      const parsedResponse = typeof response.content === 'string' 
        ? JSON.parse(response.content) 
        : response.content;

      return parsedResponse.strategicQueries;

    } catch (error) {
      console.warn('Strategic query generation failed, using fallback queries:', error);
      return this.getFallbackStrategicQueries(formData);
    }
  }

  /**
   * Retrieve relevant context using RAG with Upstash Vector
   */
  private async retrieveRelevantContext(queries: string[], formData: TravelFormData): Promise<any[]> {
    if (!this.vectorIndex || !queries.length) {
      return [];
    }

    const retrievedContext: any[] = [];
    const maxResultsPerQuery = 3;

    for (const query of queries) {
      try {
        // Query vector database with metadata filtering
        const results = await this.vectorIndex.query({
          data: query, // Upstash will generate embedding automatically
          topK: maxResultsPerQuery,
          includeMetadata: true,
          filter: `destination = '${formData.destination}'` // Filter by destination
        });

        if (results && results.length > 0) {
          retrievedContext.push(...results.map((result: any) => ({
            content: result.metadata?.content || 'No content available',
            category: result.metadata?.category || 'unknown',
            score: result.score || 0,
            query,
            id: result.id
          })));
        }

      } catch (error) {
        console.warn(`Failed to retrieve context for query: ${query}`, error);
      }
    }

    return retrievedContext;
  }

  /**
   * Generate strategic recommendations using LLM with RAG context
   */
  private async generateStrategicRecommendations(
    formData: TravelFormData,
    plannerData: any,
    gathererData: any,
    retrievedContext: any[],
    strategicQueries: string[]
  ): Promise<any> {
    try {
      const recommendationSchema = z.object({
        recommendations: z.array(z.object({
          category: z.string().describe("Category of recommendation (accommodation, transportation, activities, etc.)"),
          title: z.string().describe("Brief title for the recommendation"),
          description: z.string().describe("Detailed description of the recommendation"),
          priority: z.enum(['high', 'medium', 'low']).describe("Priority level"),
          cost: z.string().describe("Estimated cost impact"),
          timeRequired: z.string().describe("Time requirement for implementation"),
          reasoning: z.string().describe("Strategic reasoning behind this recommendation")
        })).describe("Array of strategic travel recommendations"),
        budgetOptimization: z.object({
          totalBudget: z.number().describe("Total estimated budget based on recommendations"),
          savings: z.array(z.string()).describe("Specific budget-saving strategies"),
          splurges: z.array(z.string()).describe("Recommended splurge opportunities"),
          breakdown: z.object({
            accommodation: z.number(),
            transportation: z.number(),
            activities: z.number(),
            food: z.number(),
            miscellaneous: z.number()
          }).describe("Budget breakdown by category")
        }).describe("Comprehensive budget optimization strategy"),
        riskAssessment: z.object({
          overall: z.enum(['low', 'medium', 'high']).describe("Overall risk level"),
          factors: z.array(z.string()).describe("Identified risk factors"),
          mitigations: z.array(z.string()).describe("Risk mitigation strategies")
        }).describe("Travel risk assessment and mitigation"),
        timeline: z.object({
          optimalBookingTime: z.string().describe("When to book various components"),
          milestones: z.array(z.object({
            task: z.string(),
            timeframe: z.string(),
            importance: z.enum(['critical', 'important', 'optional'])
          })).describe("Key planning milestones")
        }).describe("Strategic timeline for trip planning"),
        itineraryStructure: z.object({
          dailyPacing: z.string().describe("Recommended daily activity pacing"),
          themes: z.array(z.string()).describe("Suggested daily or multi-day themes"),
          flexibility: z.string().describe("Recommended flexibility level"),
          mustDos: z.array(z.string()).describe("Must-do activities or experiences"),
          alternatives: z.array(z.string()).describe("Alternative options for various preferences")
        }).describe("High-level itinerary structure recommendations"),
        confidenceScore: z.number().min(0).max(1).describe("Confidence score (0-1) based on available data quality")
      });

      const prompt = this.buildRecommendationPrompt(
        formData, 
        plannerData, 
        gathererData, 
        retrievedContext, 
        strategicQueries
      );
      
      const response = await this.executeLLMRequest(prompt, recommendationSchema);
      
      // Parse the structured response
      const parsedResponse = typeof response.content === 'string' 
        ? JSON.parse(response.content) 
        : response.content;

      return parsedResponse;

    } catch (error) {
      console.warn('Strategic recommendation generation failed, using fallback:', error);
      return this.getFallbackStrategicAnalysis(formData, gathererData);
    }
  }

  /**
   * Build prompt for strategic query generation
   */
  private buildQueryGenerationPrompt(formData: TravelFormData, plannerData: any, gathererData: any): string {
    return [
      `Generate strategic queries to retrieve relevant travel information for comprehensive recommendations.`,
      ``,
      `Trip Details:`,
      `- Destination: ${formData.destination}`,
      `- Dates: ${formData.departureDate} to ${formData.returnDate}`,
      `- Travelers: ${formData.adults} adults, ${formData.children} children`,
      `- Budget: $${formData.budget.amount} (${formData.budget.mode})`,
      `- Travel Style: ${formData.preferences.travelStyle}`,
      ``,
      `Content Planner Identified Needs:`,
      JSON.stringify(plannerData, null, 2),
      ``,
      `Information Gatherer Results:`,
      `- Data Points: ${gathererData.totalDataPoints}`,
      `- Categories: ${Object.keys(gathererData.categories || {}).join(', ')}`,
      ``,
      `Generate 5-8 strategic queries that will help retrieve the most relevant information for:`,
      `1. Creating optimal itinerary recommendations`,
      `2. Budget optimization strategies`,
      `3. Risk assessment and mitigation`,
      `4. Timeline and booking recommendations`,
      ``,
      `Focus on specific, actionable queries that leverage the gathered data.`
    ].join('\n');
  }

  /**
   * Build comprehensive prompt for strategic recommendations
   */
  private buildRecommendationPrompt(
    formData: TravelFormData,
    _plannerData: any,
    gathererData: any,
    retrievedContext: any[],
    strategicQueries: string[]
  ): string {
    return [
      `Create comprehensive strategic travel recommendations using the following information:`,
      ``,
      `TRIP DETAILS:`,
      `- Destination: ${formData.destination}`,
      `- Dates: ${formData.departureDate} to ${formData.returnDate}`,
      `- Travelers: ${formData.adults} adults, ${formData.children} children`,
      `- Budget: $${formData.budget.amount} (${formData.budget.mode})`,
      `- Travel Style: ${formData.preferences.travelStyle}`,
      `- Accommodation Type: ${formData.preferences.accommodationType}`,
      ``,
      `GATHERED DATA SUMMARY:`,
      `- Total Data Points: ${gathererData.totalDataPoints}`,
      `- Categories Covered: ${Object.keys(gathererData.categories || {}).join(', ')}`,
      ``,
      `RETRIEVED CONTEXT (from vector database):`,
      retrievedContext.map((ctx, idx) => 
        `${idx + 1}. [${ctx.category}] ${ctx.content} (Score: ${ctx.score?.toFixed(2) || 'N/A'})`
      ).join('\n'),
      ``,
      `STRATEGIC QUERIES USED:`,
      strategicQueries.map((query, idx) => `${idx + 1}. ${query}`).join('\n'),
      ``,
      `Based on this comprehensive analysis, provide strategic recommendations that:`,
      `1. Optimize the travel experience for the specific travel style and preferences`,
      `2. Maximize value within the stated budget`,
      `3. Account for practical considerations (timing, logistics, etc.)`,
      `4. Identify potential risks and mitigation strategies`,
      `5. Provide a clear structure for itinerary planning`,
      ``,
      `Ensure recommendations are specific, actionable, and tailored to this exact trip profile.`
    ].join('\n');
  }

  /**
   * Fallback strategic queries when LLM is unavailable
   */
  private getFallbackStrategicQueries(formData: TravelFormData): string[] {
    return [
      `best ${formData.preferences.travelStyle} accommodations in ${formData.destination}`,
      `${formData.destination} activities for ${formData.adults > 1 ? 'groups' : 'solo travelers'}`,
      `transportation options ${formData.destination}`,
      `${formData.destination} restaurant recommendations ${formData.preferences.travelStyle}`,
      `${formData.destination} weather ${formData.departureDate}`,
      `things to avoid ${formData.destination} travel`,
      `${formData.destination} cultural customs etiquette`
    ];
  }

  /**
   * Fallback strategic analysis when LLM is unavailable
   */
  private getFallbackStrategicAnalysis(formData: TravelFormData, _gathererData: any): any {
    return {
      recommendations: [
        {
          category: 'accommodation',
          title: 'Book Early for Best Rates',
          description: 'Secure accommodation 2-3 months in advance for optimal pricing and availability',
          priority: 'high',
          cost: 'Savings of 15-25%',
          timeRequired: '1-2 hours research',
          reasoning: 'Early booking typically offers better rates and more options'
        },
        {
          category: 'transportation',
          title: 'Use Local Transportation',
          description: 'Prefer public transportation and local options over tourist services',
          priority: 'medium',
          cost: 'Savings of 30-50%',
          timeRequired: 'Ongoing during trip',
          reasoning: 'Local transport is more cost-effective and authentic'
        }
      ],
      budgetOptimization: {
        totalBudget: formData.budget.amount,
        savings: ['Book accommodations early', 'Use public transportation', 'Eat at local restaurants'],
        splurges: ['One special dining experience', 'Must-see paid attractions'],
        breakdown: {
          accommodation: Math.round(formData.budget.amount * 0.35),
          transportation: Math.round(formData.budget.amount * 0.25),
          activities: Math.round(formData.budget.amount * 0.20),
          food: Math.round(formData.budget.amount * 0.15),
          miscellaneous: Math.round(formData.budget.amount * 0.05)
        }
      },
      riskAssessment: {
        overall: 'low' as const,
        factors: ['Weather variations', 'Peak season crowds'],
        mitigations: ['Check weather forecasts', 'Book popular attractions in advance']
      },
      timeline: {
        optimalBookingTime: '2-3 months before travel',
        milestones: [
          { task: 'Book accommodations', timeframe: '8-12 weeks before', importance: 'critical' as const },
          { task: 'Research activities', timeframe: '4-6 weeks before', importance: 'important' as const }
        ]
      },
      itineraryStructure: {
        dailyPacing: 'Moderate - 2-3 major activities per day',
        themes: ['Cultural exploration', 'Local cuisine', 'Relaxation'],
        flexibility: 'Medium - allow for spontaneous discoveries',
        mustDos: [`Visit ${formData.destination} landmarks`, 'Try local cuisine'],
        alternatives: ['Indoor activities for bad weather', 'Budget-friendly options']
      },
      confidenceScore: 0.6
    };
  }
}

// =============================================================================
// COMPILER AGENT CLASS
// =============================================================================

/**
 * Compiler Agent - Fourth and final agent in the workflow
 * Compiles all previous agent results into a comprehensive, structured itinerary
 */
export class CompilerAgent extends BaseAgent {
  public readonly name = AgentType.COMPILER;
  public readonly version = '1.0.0';
  public readonly timeout = 40000; // 40 seconds for comprehensive compilation
  public readonly maxCost = 0.60; // $0.60 USD

  public async execute(context: WorkflowContext): Promise<AgentResult> {
    this.startExecution();
    this.executionContext = context;

    try {
      if (!this.validateExecutionState(context)) {
        return this.createResult(false, null);
      }

      if (!await this.validateInput(context)) {
        return this.createResult(false, null);
      }

      if (!this.checkTimeout()) {
        return this.createResult(false, null);
      }

      // Compile comprehensive itinerary from all agent results
      const compilationResult = await this.performItineraryCompilation(context);

      if (!this.checkTimeout()) {
        return this.createResult(false, null);
      }

      return this.createResult(true, compilationResult);

    } catch (error) {
      const agentError = this.createError(
        AgentErrorType.EXECUTION_ERROR,
        'high',
        `Itinerary compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error: error instanceof Error ? error.stack : error },
        true
      );
      this.handleError(agentError);
      return this.createResult(false, null);
    }
  }

  public async validateInput(input: unknown): Promise<boolean> {
    if (!input || typeof input !== 'object') {
      return false;
    }

    const context = input as WorkflowContext;

    // Validate that all previous agent results are available
    const requiredAgents = [AgentType.CONTENT_PLANNER, AgentType.INFO_GATHERER, AgentType.STRATEGIST];
    
    for (const agentType of requiredAgents) {
      const result = context.agentResults[agentType];
      if (!result || !result.success) {
        this.handleError(this.createError(
          AgentErrorType.VALIDATION_ERROR,
          'high',
          `${agentType} results are required for compilation`,
          { agentType, result }
        ));
        return false;
      }
    }

    return true;
  }

  /**
   * Performs comprehensive itinerary compilation using LLM structured output
   */
  private async performItineraryCompilation(context: WorkflowContext): Promise<any> {
    const { formData } = context;
    const plannerResult = context.agentResults[AgentType.CONTENT_PLANNER];
    const gathererResult = context.agentResults[AgentType.INFO_GATHERER];
    const strategistResult = context.agentResults[AgentType.STRATEGIST];

    if (!plannerResult?.data || !gathererResult?.data || !strategistResult?.data) {
      throw new Error('Required agent results not available for compilation');
    }

    // Generate comprehensive itinerary using LLM
    const itinerary = await this.generateStructuredItinerary(
      formData,
      plannerResult.data,
      gathererResult.data,
      strategistResult.data
    );

    // Calculate compilation metadata
    const metadata = await this.calculateCompilationMetadata(
      formData,
      plannerResult.data,
      gathererResult.data,
      strategistResult.data,
      itinerary
    );

    return {
      ...itinerary,
      metadata,
      compilationTimestamp: new Date().toISOString(),
      workflow: {
        plannerVersion: plannerResult.agent,
        gathererVersion: gathererResult.agent,
        strategistVersion: strategistResult.agent,
        compilerVersion: this.name
      }
    };
  }

  /**
   * Generate structured itinerary using LLM with comprehensive schema
   */
  private async generateStructuredItinerary(
    formData: TravelFormData,
    plannerData: any,
    gathererData: any,
    strategistData: any
  ): Promise<any> {
    try {
      // Define comprehensive itinerary schema
      const itinerarySchema = z.object({
        tripSummary: z.object({
          nickname: z.string().describe("Catchy trip nickname"),
          destination: z.string().describe("Primary destination"),
          dates: z.object({
            departure: z.string().describe("Departure date"),
            return: z.string().describe("Return date"),
            duration: z.number().describe("Trip duration in days")
          }).describe("Trip date information"),
          travelers: z.object({
            adults: z.number().describe("Number of adults"),
            children: z.number().describe("Number of children"),
            total: z.number().describe("Total number of travelers")
          }).describe("Traveler information"),
          budget: z.object({
            amount: z.number().describe("Total budget amount"),
            mode: z.string().describe("Budget mode (per-person, total, flexible)"),
            currency: z.string().default("USD").describe("Budget currency")
          }).describe("Budget information"),
          preparedFor: z.string().describe("Name of the person this itinerary is prepared for")
        }).describe("Comprehensive trip summary section"),
        
        dailyItinerary: z.array(z.object({
          day: z.number().describe("Day number of the trip"),
          date: z.string().describe("Date for this day"),
          theme: z.string().describe("Theme or focus for this day"),
          activities: z.array(z.object({
            time: z.string().describe("Time of activity"),
            title: z.string().describe("Activity title"),
            description: z.string().describe("Activity description"),
            location: z.string().describe("Activity location"),
            duration: z.string().describe("Expected duration"),
            cost: z.string().describe("Estimated cost"),
            tips: z.array(z.string()).describe("Specific tips for this activity")
          })).describe("Activities for this day"),
          meals: z.object({
            breakfast: z.string().optional().describe("Breakfast recommendation"),
            lunch: z.string().optional().describe("Lunch recommendation"),
            dinner: z.string().optional().describe("Dinner recommendation")
          }).describe("Meal recommendations for this day"),
          transportation: z.string().describe("Transportation recommendations"),
          accommodation: z.string().optional().describe("Accommodation details if changing"),
          dailyBudget: z.string().describe("Estimated daily budget"),
          notes: z.array(z.string()).describe("Important notes for this day")
        })).describe("Day-by-day detailed itinerary"),

        travelTips: z.object({
          budgetSaving: z.array(z.string()).describe("Budget-saving strategies"),
          localCustoms: z.array(z.string()).describe("Local customs and etiquette"),
          safety: z.array(z.string()).describe("Safety tips"),
          transportation: z.array(z.string()).describe("Transportation advice"),
          communication: z.array(z.string()).describe("Communication tips"),
          general: z.array(z.string()).describe("General travel advice")
        }).describe("Comprehensive travel tips section"),

        emergencyInfo: z.object({
          localEmergency: z.string().describe("Local emergency number"),
          embassy: z.object({
            name: z.string().describe("Embassy name"),
            phone: z.string().describe("Embassy phone number"),
            address: z.string().describe("Embassy address")
          }).describe("Embassy information"),
          nearestHospital: z.string().describe("Nearest hospital information"),
          importantNumbers: z.array(z.object({
            service: z.string().describe("Service name"),
            number: z.string().describe("Phone number")
          })).describe("Other important phone numbers")
        }).describe("Emergency contact information"),

        packingList: z.object({
          essentials: z.array(z.string()).describe("Essential items to pack"),
          clothingRecommendations: z.array(z.string()).describe("Clothing recommendations"),
          electronics: z.array(z.string()).describe("Electronic items needed"),
          documents: z.array(z.string()).describe("Important documents to bring"),
          optional: z.array(z.string()).describe("Optional items that might be useful")
        }).describe("Comprehensive packing list"),

        weatherInfo: z.object({
          overview: z.string().describe("General weather overview for trip period"),
          dailyForecasts: z.array(z.object({
            date: z.string().describe("Date"),
            temperature: z.string().describe("Temperature range"),
            conditions: z.string().describe("Weather conditions"),
            recommendations: z.array(z.string()).describe("What to wear/bring")
          })).describe("Daily weather forecasts"),
          seasonalConsiderations: z.array(z.string()).describe("Seasonal travel considerations")
        }).describe("Weather information and recommendations")
      });

      const prompt = this.buildCompilationPrompt(formData, plannerData, gathererData, strategistData);
      const response = await this.executeLLMRequest(prompt, itinerarySchema);
      
      // Parse the structured response
      const parsedResponse = typeof response.content === 'string' 
        ? JSON.parse(response.content) 
        : response.content;

      return parsedResponse;

    } catch (error) {
      console.warn('Structured itinerary generation failed, using fallback:', error);
      return this.getFallbackItinerary(formData, gathererData, strategistData);
    }
  }

  /**
   * Build comprehensive compilation prompt
   */
  private buildCompilationPrompt(
    formData: TravelFormData,
    plannerData: any,
    gathererData: any,
    strategistData: any
  ): string {
    const tripDuration = this.calculateTripDuration(formData.departureDate, formData.returnDate);
    
    return [
      `Compile a comprehensive travel itinerary using the following analyzed data:`,
      ``,
      `TRIP DETAILS:`,
      `- Destination: ${formData.destination}`,
      `- Departure: ${formData.departureDate}`,
      `- Return: ${formData.returnDate}`,
      `- Duration: ${tripDuration} days`,
      `- Travelers: ${formData.adults} adults, ${formData.children} children`,
      `- Budget: $${formData.budget.amount} (${formData.budget.mode})`,
      `- Travel Style: ${formData.preferences.travelStyle}`,
      `- Accommodation: ${formData.preferences.accommodationType}`,
      ``,
      `CONTENT PLANNER ANALYSIS:`,
      JSON.stringify(plannerData, null, 2),
      ``,
      `GATHERED INFORMATION:`,
      `- Total Data Points: ${gathererData.totalDataPoints || 0}`,
      `- Categories: ${Object.keys(gathererData.categories || {}).join(', ')}`,
      `- Key Information: ${JSON.stringify(gathererData.summary || {})}`,
      ``,
      `STRATEGIC RECOMMENDATIONS:`,
      `- Recommendations Count: ${strategistData.recommendations?.length || 0}`,
      `- Budget Optimization: ${JSON.stringify(strategistData.budgetOptimization || {})}`,
      `- Risk Assessment: ${strategistData.riskAssessment?.overall || 'unknown'}`,
      `- Itinerary Structure: ${JSON.stringify(strategistData.itineraryStructure || {})}`,
      ``,
      `COMPILATION REQUIREMENTS:`,
      `1. Create a ${tripDuration}-day detailed itinerary`,
      `2. Include 2-4 major activities per day based on travel style`,
      `3. Incorporate strategic recommendations into daily planning`,
      `4. Ensure budget alignment with gathered cost data`,
      `5. Include all required sections: Trip Summary, Daily Itinerary, Travel Tips`,
      `6. Add comprehensive emergency information and packing list`,
      `7. Provide weather-appropriate recommendations`,
      ``,
      `Generate a complete, actionable travel itinerary that integrates all analyzed data.`
    ].join('\n');
  }

  /**
   * Calculate comprehensive compilation metadata
   */
  private async calculateCompilationMetadata(
    formData: TravelFormData,
    plannerData: any,
    gathererData: any,
    strategistData: any,
    itinerary: any
  ): Promise<any> {
    const tripDuration = this.calculateTripDuration(formData.departureDate, formData.returnDate);
    const totalActivities = itinerary.dailyItinerary?.reduce(
      (sum: number, day: any) => sum + (day.activities?.length || 0), 0
    ) || 0;

    return {
      compilationScore: this.calculateCompilationScore(itinerary),
      dataUtilization: {
        plannerDataPoints: Object.keys(plannerData).length,
        gathererDataPoints: gathererData.totalDataPoints || 0,
        strategistRecommendations: strategistData.recommendations?.length || 0,
        totalIntegration: this.calculateIntegrationScore(plannerData, gathererData, strategistData)
      },
      itineraryStats: {
        tripDuration,
        totalActivities,
        averageActivitiesPerDay: Math.round((totalActivities / tripDuration) * 10) / 10,
        budgetEstimate: itinerary.tripSummary?.budget?.amount || formData.budget.amount,
        coverageScore: this.calculateCoverageScore(itinerary, tripDuration)
      },
      qualityMetrics: {
        completeness: this.calculateCompletenessScore(itinerary),
        practicality: this.calculatePracticalityScore(itinerary),
        personalization: this.calculatePersonalizationScore(itinerary, formData)
      },
      optimizationLevel: strategistData.confidenceScore || 0.7,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate trip duration in days
   */
  private calculateTripDuration(departureDate: string, returnDate: string): number {
    const departure = new Date(departureDate);
    const returnD = new Date(returnDate);
    const timeDiff = returnD.getTime() - departure.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // Include departure day
  }

  /**
   * Calculate overall compilation quality score
   */
  private calculateCompilationScore(itinerary: any): number {
    let score = 0.5; // Base score

    // Check essential sections
    if (itinerary.tripSummary) score += 0.1;
    if (itinerary.dailyItinerary?.length > 0) score += 0.2;
    if (itinerary.travelTips) score += 0.1;
    if (itinerary.emergencyInfo) score += 0.05;
    if (itinerary.packingList) score += 0.05;

    return Math.min(score, 1.0);
  }

  /**
   * Calculate integration score between agent results
   */
  private calculateIntegrationScore(plannerData: any, gathererData: any, strategistData: any): number {
    let integrationPoints = 0;
    let totalPossible = 0;

    // Check planner-gatherer integration
    totalPossible += 1;
    if (plannerData && gathererData.totalDataPoints > 0) integrationPoints += 1;

    // Check gatherer-strategist integration  
    totalPossible += 1;
    if (strategistData.recommendations?.length > 0 && gathererData.categories) integrationPoints += 1;

    // Check comprehensive integration
    totalPossible += 1;
    if (plannerData && gathererData && strategistData) integrationPoints += 1;

    return totalPossible > 0 ? integrationPoints / totalPossible : 0.5;
  }

  /**
   * Calculate coverage score for itinerary completeness
   */
  private calculateCoverageScore(itinerary: any, tripDuration: number): number {
    const dailyItinerary = itinerary.dailyItinerary || [];
    const coverageRatio = dailyItinerary.length / tripDuration;
    return Math.min(coverageRatio, 1.0);
  }

  /**
   * Calculate completeness score
   */
  private calculateCompletenessScore(itinerary: any): number {
    const requiredSections = [
      'tripSummary', 'dailyItinerary', 'travelTips', 
      'emergencyInfo', 'packingList', 'weatherInfo'
    ];
    
    const presentSections = requiredSections.filter(section => itinerary[section]);
    return presentSections.length / requiredSections.length;
  }

  /**
   * Calculate practicality score
   */
  private calculatePracticalityScore(itinerary: any): number {
    let score = 0.5; // Base score

    // Check for practical elements
    if (itinerary.dailyItinerary?.[0]?.transportation) score += 0.1;
    if (itinerary.emergencyInfo?.localEmergency) score += 0.1;
    if (itinerary.travelTips?.budgetSaving?.length > 0) score += 0.1;
    if (itinerary.packingList?.essentials?.length > 0) score += 0.1;
    if (itinerary.weatherInfo?.overview) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Calculate personalization score based on form data
   */
  private calculatePersonalizationScore(itinerary: any, formData: TravelFormData): number {
    let score = 0.3; // Base score

    // Check for personalization elements
    if (itinerary.tripSummary?.nickname?.includes(formData.destination)) score += 0.1;
    if (formData.preferences.travelStyle && itinerary.dailyItinerary?.[0]?.activities) score += 0.2;
    if (formData.budget && itinerary.tripSummary?.budget) score += 0.1;
    if (formData.adults + formData.children && itinerary.tripSummary?.travelers) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * Fallback itinerary when LLM is unavailable
   */
  private getFallbackItinerary(formData: TravelFormData, _gathererData: any, strategistData: any): any {
    const tripDuration = this.calculateTripDuration(formData.departureDate, formData.returnDate);
    
    return {
      tripSummary: {
        nickname: `${formData.destination} Adventure`,
        destination: formData.destination,
        dates: {
          departure: formData.departureDate,
          return: formData.returnDate,
          duration: tripDuration
        },
        travelers: {
          adults: formData.adults,
          children: formData.children,
          total: formData.adults + formData.children
        },
        budget: {
          amount: formData.budget.amount,
          mode: formData.budget.mode,
          currency: "USD"
        },
        preparedFor: "Traveler"
      },
      dailyItinerary: Array.from({ length: tripDuration }, (_, index) => ({
        day: index + 1,
        date: this.addDaysToDate(formData.departureDate, index),
        theme: index === 0 ? "Arrival & Orientation" : `Explore ${formData.destination}`,
        activities: [
          {
            time: "09:00",
            title: index === 0 ? "Arrival and Check-in" : "Morning Exploration",
            description: index === 0 ? "Arrive and settle into accommodation" : "Discover local attractions",
            location: formData.destination,
            duration: "2-3 hours",
            cost: "$0-50",
            tips: ["Arrive early to maximize your day"]
          },
          {
            time: "14:00",
            title: "Afternoon Activity",
            description: "Experience local culture and attractions",
            location: formData.destination,
            duration: "3-4 hours",
            cost: "$20-100",
            tips: ["Book in advance if possible"]
          }
        ],
        meals: {
          breakfast: "Local café or hotel breakfast",
          lunch: "Traditional local restaurant",
          dinner: "Recommended local dining"
        },
        transportation: "Walking or local transport",
        dailyBudget: `$${Math.round(formData.budget.amount / tripDuration)}`,
        notes: ["Stay hydrated", "Keep important documents safe"]
      })),
      travelTips: {
        budgetSaving: strategistData.budgetOptimization?.savings || [
          "Use public transportation", 
          "Eat at local restaurants", 
          "Book accommodations in advance"
        ],
        localCustoms: ["Respect local customs", "Learn basic local phrases"],
        safety: ["Keep valuables secure", "Stay aware of surroundings"],
        transportation: ["Research local transport options", "Keep taxi numbers handy"],
        communication: ["Download translation apps", "Have emergency contacts"],
        general: ["Pack light", "Stay flexible with plans"]
      },
      emergencyInfo: {
        localEmergency: "112",
        embassy: {
          name: "US Embassy",
          phone: "Contact local directory",
          address: "Contact local directory"
        },
        nearestHospital: "Contact local directory for nearest medical facility",
        importantNumbers: [
          { service: "Tourist Police", number: "Contact local directory" },
          { service: "Tourist Hotline", number: "Contact local directory" }
        ]
      },
      packingList: {
        essentials: ["Passport and visa", "Travel insurance", "Medications", "Phone charger", "Cash and cards", "Travel adapter"],
        clothingRecommendations: ["Comfortable walking shoes", "Weather-appropriate clothing", "Light jacket"],
        electronics: ["Smartphone", "Camera", "Portable battery"],
        documents: ["Flight tickets", "Hotel confirmations", "Travel insurance", "Emergency contacts"],
        optional: ["Travel pillow", "First aid kit", "Snacks", "Entertainment"]
      },
      weatherInfo: {
        overview: `Check current weather conditions for ${formData.destination} during your travel dates`,
        dailyForecasts: [],
        seasonalConsiderations: ["Pack for variable weather", "Check seasonal travel advisories"]
      }
    };
  }

  /**
   * Add days to a date string
   */
  private addDaysToDate(dateString: string, days: number): string {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    const isoString = date.toISOString().split('T')[0];
    return isoString || dateString; // Fallback to input if split fails
  }

}

// =============================================================================
// AGENT FACTORY AND REGISTRY
// =============================================================================

/**
 * Factory class for creating agent instances
 */
export class AgentFactory {
  private static instances: Map<AgentType, BaseAgent> = new Map();

  /**
   * Creates or returns an existing agent instance
   */
  public static getAgent(type: AgentType): BaseAgent {
    if (!this.instances.has(type)) {
      const agent = this.createAgent(type);
      this.instances.set(type, agent);
    }

    return this.instances.get(type)!;
  }

  /**
   * Creates a new agent instance based on type
   */
  private static createAgent(type: AgentType): BaseAgent {
    switch (type) {
      case AgentType.CONTENT_PLANNER:
        return new ContentPlannerAgent();
      case AgentType.INFO_GATHERER:
        return new InfoGathererAgent();
      case AgentType.STRATEGIST:
        return new StrategistAgent();
      case AgentType.COMPILER:
        return new CompilerAgent();
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  }

  /**
   * Clears all cached agent instances
   */
  public static clearCache(): void {
    this.instances.clear();
  }

  /**
   * Gets all available agent types
   */
  public static getAvailableAgentTypes(): AgentType[] {
    return Object.values(AgentType);
  }
}
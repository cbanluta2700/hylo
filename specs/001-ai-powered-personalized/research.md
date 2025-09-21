# Research: AI-Powered Personalized Itinerary Generation

**Date**: September 20, 2025  
**Feature**: 001-ai-powered-personalized  
**Status**: Complete

## Research Summary

This document consolidates research findings for implementing AI-powered itinerary generation using multi-agent workflows, resolving all NEEDS CLARIFICATION items from the feature specification through Context7 MCP server analysis.

## Form Data Structure Analysis

Based on the current `App.tsx` implementation, the system collects comprehensive travel planning data across 8 main sections:

### Agent-Specific Prompt Engineering

Each agent must be prompted to generate content that fits into the structured output format:

#### **Itinerary Architect Prompts:**

```typescript
const architectPrompt = `
Create a structured daily itinerary for ${formData.location} from ${formData.departDate} to ${
  formData.returnDate
}.

FORMAT REQUIREMENTS:
- Each day needs: day number, date, descriptive title, theme
- Day 1 should typically be travel/arrival day
- Organize activities into logical time blocks (morning, afternoon, evening)
- Include accommodation check-in on arrival day
- Balance rest time with activities, especially for families

OUTPUT STRUCTURE:
{
  "dailyStructure": [
    {
      "day": 1,
      "date": "2024-06-14",
      "title": "Fly to Italy", 
      "theme": "travel-day",
      "timeBlocks": [...]
    }
  ]
}

Consider: ${JSON.stringify(formData)} with ${completenessScore}% form completion
`;
```

#### **Web Gatherer Prompts:**

```typescript
const gathererPrompt = `
Search for current travel options for: ${smartQuery.query}

REQUIRED OUTPUT FORMAT:
For flights: Include airline, departure/arrival times with airports, layovers, travel time
For accommodations: Provide 3 options - boutique hotel, AirBnB, unique local stay
For restaurants: Include cuisine type, location, booking information

OUTPUT MUST BE:
- Current and bookable (2024/2025)
- Specific with names, times, and links
- Family-friendly if children are involved (${formData.children} children)
- Within budget constraints: ${formatBudget(formData)}

Return structured data that can be formatted into boxed content sections.
`;
```

#### **Information Specialist Prompts:**

```typescript
const specialistPrompt = `
Generate personalized travel tips for ${formData.location} based on:
- Travel group: ${formatTravelers(formData.adults, formData.children)}
- Interests: ${formData.selectedInterests?.join(', ') || 'general tourism'}  
- Travel dates: ${formData.departDate} to ${formData.returnDate}
- Completion level: ${completenessScore}%

REQUIRED SECTIONS:
1. Practical daily tips (weather, timing, local customs)
2. Family-specific advice (if children present)
3. Packing recommendations 
4. Cultural insights with practical application

FORMAT FOR TIPS SECTION:
Each tip should be 1-2 sentences, practical and actionable
Group related tips together
Include specific local knowledge (like Rome's "nasoni" water fountains)
`;
```

#### **Form Putter Real-time Prompts:**

```typescript
const putterPrompt = `
User changed form field: ${changedField} to ${newValue}

Quickly suggest 2-3 micro-optimizations for the itinerary based on this change:
- Keep suggestions under 50 words each
- Focus on immediate practical impact
- Maintain consistency with existing recommendations

Current form state: ${JSON.stringify(formData)}
Respond in under 3 seconds with actionable updates.
`;
```

### Multi-Agent Architecture

```typescript
interface FormData {
  // 1. Destination & Dates
  location: string;
  departDate: string;
  returnDate: string;
  flexibleDates: boolean;
  plannedDays?: number;

  // 2. Travelers
  adults: number;
  children: number;
  childrenAges: number[];

  // 3. Budget
  budget: number;
  currency: 'USD' | 'EUR' | 'GBP' | string;
  flexibleBudget: boolean;
  budgetMode: 'total' | 'per-person';

  // 4. Travel Group
  selectedGroups: string[];
  customGroupText: string;

  // 5. Travel Interests
  selectedInterests: string[];
  customInterestsText: string;

  // 6. Itinerary Inclusions
  selectedInclusions: string[];
  customInclusionsText: string;
  inclusionPreferences: Record<string, any>;

  // 7. Travel Style Questions
  travelStyleChoice: 'not-selected' | TravelStyleChoice;
  travelStyleAnswers: {
    experience?: string[];
    vibes?: string[];
    vibesOther?: string;
    sampleDays?: string[];
    dinnerChoices?: string[];
    tripNickname?: string;
  };

  // 8. Contact & Trip Details
  contactInfo?: {
    name?: string;
    email?: string;
  };
}
```

### Data Processing Workflow

The current system organizes form data into 8 distinct sections for AI processing:

1. **Destination & Dates** - Location, travel dates, flexibility
2. **Travelers** - Group size and composition
3. **Budget** - Financial constraints and flexibility
4. **Travel Group** - Group type and special considerations
5. **Travel Interests** - Activity preferences and hobbies
6. **Itinerary Inclusions** - Specific requirements and preferences
7. **Travel Style Questions** - Personality and style matching
8. **Contact & Trip Details** - Communication and trip identification

### Smart Query Generation System

Instead of static agent data mapping, the system uses intelligent query generation that adapts to user selections and form context:

```typescript
interface SmartQuery {
  type: string;
  query: string;
  priority: 'high' | 'medium' | 'low';
  agent: 'architect' | 'gatherer' | 'specialist' | 'putter';
}

function generateSmartQueries(formData: FormData, architectOutput?: any): SmartQuery[] {
  const { location, departDate, returnDate, adults, children, childrenAges } = formData;
  const groupSize = adults + children;
  const hasChildren = children > 0;
  const childAges = childrenAges?.join(', ') || '';

  // Defensive handling for optional sections - users may skip Travel Style entirely
  const groupType = formData.selectedGroups?.[0] || 'travelers';
  const interests = formData.selectedInterests?.join(' ') || 'sightseeing tourism';
  const dinnerStyle =
    formData.travelStyleAnswers?.dinnerChoices?.[0] ||
    formData.selectedInterests?.find((i) => i.includes('food')) ||
    'local cuisine';

  // Handle cases where user skips to trip nickname without travel style
  const hasMinimalData =
    !formData.travelStyleChoice || formData.travelStyleChoice === 'not-selected';
  const fallbackInterests = hasMinimalData ? 'popular attractions must-see places' : interests;

  // Specialized query templates based on actual user selections
  const queryTemplates = {
    flights: () => {
      const origin = formData.inclusionPreferences?.flights?.departureAirports || 'nearest airport';
      const cabinClass = formData.inclusionPreferences?.flights?.cabinClasses?.join(' ') || '';
      return {
        type: 'flights',
        query:
          `${origin} to ${location} flights ${departDate} ${returnDate} ${groupSize} passengers ${cabinClass}`.trim(),
        priority: 'high' as const,
        agent: 'gatherer' as const,
      };
    },

    accommodations: () => {
      const hotelTypes =
        formData.inclusionPreferences?.accommodations?.selectedTypes?.join(' ') || 'hotels';
      const specialRequests = formData.inclusionPreferences?.accommodations?.specialRequests || '';
      const familyNeeds = hasChildren ? `family rooms ${childAges} year old` : '';
      return {
        type: 'accommodations',
        query:
          `${location} ${hotelTypes} ${departDate} ${returnDate} ${groupSize} guests ${specialRequests} ${familyNeeds}`.trim(),
        priority: 'high' as const,
        agent: 'gatherer' as const,
      };
    },

    activities: () => {
      return {
        type: 'activities',
        query:
          `${location} ${fallbackInterests} ${groupType} activities ${departDate} ${groupSize} people`.trim(),
        priority: 'high' as const,
        agent: 'specialist' as const,
      };
    },

    dining: () => {
      // Multiple fallback layers for dining preferences
      const diningPreference =
        formData.travelStyleAnswers?.dinnerChoices?.[0] || // Travel style choice
        formData.selectedInterests?.find((i) => i.toLowerCase().includes('food')) || // Food-related interest
        formData.selectedInterests?.find((i) => i.toLowerCase().includes('culinary')) || // Culinary interest
        'local cuisine restaurants'; // Ultimate fallback

      return {
        type: 'dining',
        query: `${location} ${diningPreference} ${groupSize} people reservations`.trim(),
        priority: 'medium' as const,
        agent: 'specialist' as const,
      };
    },

    cruise: () => ({
      type: 'cruise',
      query: `cruises from ${location} ${departDate} ${returnDate} ${groupSize} passengers`,
      priority: 'high' as const,
      agent: 'gatherer' as const,
      // Special handling for cruise data
      specialSource:
        'https://www.cruisecritic.com/find-a-cruise/destination-' + encodeURIComponent(location),
    }),

    transportation: () => ({
      type: 'transportation',
      query:
        `${location} local transportation ${groupType} ${groupSize} people getting around public transit taxi`.trim(),
      priority: 'medium' as const,
      agent: 'gatherer' as const,
    }),

    general: () => {
      // Adaptive general query based on available data
      const travelContext = hasMinimalData
        ? `first time visitors essential guide`
        : `${groupType} group ${fallbackInterests}`;

      return {
        type: 'general',
        query: `${location} travel guide 2025 ${travelContext} things to do`.trim(),
        priority: 'low' as const,
        agent: 'specialist' as const,
      };
    },
  };

  // Generate queries only for selected inclusions + always include general
  const selectedQueries = (formData.selectedInclusions || [])
    .filter((inclusion) => queryTemplates[inclusion])
    .map((inclusion) => queryTemplates[inclusion]());

  // Always add general travel guide - works even with minimal form data
  selectedQueries.push(queryTemplates.general());

  // If user has minimal selections, add default essential queries
  if (hasMinimalData && selectedQueries.length <= 1) {
    selectedQueries.push(queryTemplates.activities());
    if (formData.adults >= 2) {
      selectedQueries.push(queryTemplates.dining());
    }
  }

  return selectedQueries;
}
```

### Edge Case Handling: Incomplete Form Data

The smart query system is designed to be resilient when users skip sections, particularly the Travel Style category:

#### **Common Skip Scenarios:**

1. **Direct to Trip Nickname**: User fills basic info but skips travel style questions
2. **Partial Interests**: User selects some interests but no specific travel style
3. **Minimal Selections**: User only fills required fields (location, dates, travelers)

#### **Defensive Programming Strategy:**

```typescript
// Multi-layer fallback system for dining preferences
const diningPreference =
  formData.travelStyleAnswers?.dinnerChoices?.[0] || // 1st: Travel style choice
  formData.selectedInterests?.find((i) => i.includes('food')) || // 2nd: Food interest
  formData.selectedInterests?.find((i) => i.includes('culinary')) || // 3rd: Culinary interest
  'local cuisine restaurants'; // 4th: Ultimate fallback

// Adaptive query generation based on available data
const hasMinimalData = !formData.travelStyleChoice || formData.travelStyleChoice === 'not-selected';
const fallbackInterests = hasMinimalData
  ? 'popular attractions must-see places' // Generic for minimal data
  : interests; // Specific when available
```

#### **Automatic Query Enhancement:**

- **Minimal Data Detection**: System detects when user skips major sections
- **Essential Query Addition**: Automatically adds activities and dining queries for minimal selections
- **Context-Aware Fallbacks**: Uses generic but useful search terms when specific preferences unavailable
- **Graceful Degradation**: Always produces meaningful search queries regardless of completion level

This ensures the AI agents always have actionable search queries, even when users take shortcuts through the form flow.

---

```typescript
// Add SERP API for comprehensive search coverage
const SERP_API_KEY = '03e23c05a5e2ea27f55cd5329ddae880afbf01ccbb259fbb9ef9bbe1925f388c';

interface SearchProvider {
  name: string;
  execute: (query: string) => Promise<SearchResult[]>;
  specialHandling?: (query: SmartQuery) => Promise<SearchResult[]>;
}

const searchProviders: SearchProvider[] = [
  {
    name: 'SERP',
    execute: async (query: string) => {
      const response = await fetch(
        `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(
          query
        )}&api_key=${SERP_API_KEY}`
      );
      return response.json();
    },
  },
  {
    name: 'Tavily',
    execute: async (query: string) => {
      const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
      return await tvly.search(query, { maxResults: 10 });
    },
  },
  {
    name: 'Exa',
    execute: async (query: string) => {
      const client = new exa({ apiKey: process.env.EXA_API_KEY });
      return await client.search(query, { type: 'neural', numResults: 5 });
    },
  },
  {
    name: 'CruiseCritic',
    specialHandling: async (query: SmartQuery) => {
      if (query.type === 'cruise') {
        const cruiseUrl = `https://www.cruisecritic.com/find-a-cruise/destination-${encodeURIComponent(
          query.query.split(' ')[3]
        )}`;
        // Scrape top 5 cruise options with names and links
        return await scrapeCruiseOptions(cruiseUrl);
      }
      return [];
    },
  },
];
```

### Agent Query Distribution Strategy

```typescript
// Instead of static mapping, agents get context-aware query assignments
const distributeQueries = (queries: SmartQuery[]) => {
  return {
    'itinerary-architect': queries.filter(
      (q) => ['general', 'activities'].includes(q.type) && q.priority === 'high'
    ),
    'web-gatherer': queries.filter((q) =>
      ['flights', 'accommodations', 'cruise', 'transportation'].includes(q.type)
    ),
    'information-specialist': queries.filter((q) =>
      ['activities', 'dining', 'general'].includes(q.type)
    ),
    'form-putter': queries.filter((q) => q.priority === 'low' || q.type === 'general'),
  };
};
```

### Cruise-Specific Implementation

```typescript
async function scrapeCruiseOptions(cruiseUrl: string): Promise<CruiseOption[]> {
  try {
    // Use SERP API to get structured data
    const serpResponse = await fetch(
      `https://serpapi.com/search.json?engine=google&q=site:cruisecritic.com ${cruiseUrl}&api_key=${SERP_API_KEY}`
    );
    const data = await serpResponse.json();

    // Extract top 5 cruise options
    return (
      data.organic_results?.slice(0, 5).map((result) => ({
        name: result.title,
        url: result.link,
        snippet: result.snippet,
        price: extractPriceFromSnippet(result.snippet),
        duration: extractDurationFromSnippet(result.snippet),
      })) || []
    );
  } catch (error) {
    console.error('Cruise scraping failed:', error);
    return [];
  }
}
```

## Expected Output Format & Structure

The AI-generated itinerary follows a specific visual layout with distinct sections and structured content blocks:

### **Section 1: Header**

```markdown
# YOUR PERSONALIZED ITINERARY
```

### **Section 2: Trip Summary**

```markdown
## TRIP SUMMARY | "Trip Nickname"

+--------------+ +-----------------------------+ +------------------+ +--------------------------------------------------------------+ +------------------------+
| Destination | | Dates | | Travelers | | Budget | | Prepared for: |
| Italy | | Wed, Jun 14 – Wed, Jun 21 | | 2 adults, 1 child| | Currency: USD Amount: $5000 Mode: Total | | Name: John & Family |
+--------------+ +-----------------------------+ +------------------+ +--------------------------------------------------------------+ +------------------------+
```

### **Section 3: Map Integration**

```markdown
## 🗺️ DESTINATION MAP

[Interactive map of destination country/region]
```

### **Section 4: Daily Itinerary**

```markdown
## 🗓️ DAILY ITINERARY

### Day 1 | Wed, Jun 14 | Fly to Italy

+----------------------------------------------------------------------------------------------+
| ✈️ Flight recommendation: |
| |
| Delta Airlines > |
| |
| 7:10 am SEA (Seattle) ⟶ 3:56 pm JFK (New York) | Travel time: 5h 36m |
| |
| 1h 4m layover |
| |
| 5:00 pm JFK ⟶ 7:55 am FCO (Rome) | Travel time: 8h 55m |
| |
| Note: this flight lands on Tuesday, June 15th |
+----------------------------------------------------------------------------------------------+

### Day 2 | Thurs, Jun 15 | Welcome to Rome!

+----------------------------------------------------------------------------------------------------------------------+
| Welcome to Rome! After arriving at Leonardo da Vinci International Airport (FCO), make |
| your way to your hotel in the city center via taxi or train. |
| |
| +---------------------------------------------------------------+ |
| | 🏨 Accommodation recommendations: | |
| | | |
| | Click links to view details and book | |
| | | |
| | Boutique Hotel: Hotel Artemide > | |
| | AirBnB: Spanish Square Condo > | |
| | Quirky or unique local stay: Casa Monti Roma > | |
| +---------------------------------------------------------------+ |
| |
| Activities |
| |
| • Check in and refresh at your hotel |
| • Take a leisurely stroll to the Trevi Fountain (15 min walk) |
| • Take your time checking out shops, historical landmarks, and eateries along the way. |
| • Enjoy dinner at a local trattoria in the historic center |
| |
| +------------------------------------------------------------------------------------------+ |
| | 💡 Travel Tip | |
| | | |
| | Purchase a Roma Pass > for your stay to get free public transportation and entry | |
| | to many attractions. | |
| +------------------------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------------------------------------------+
```

### **Section 5: Trip Tips**

```markdown
## 💡 TIPS FOR YOUR TRIP

Based on your trip answers, travel group, location, etc.

+------------------------------------------------------------------------------------------------------------------------+
| Start Early, Nap Midday: Sightsee in the morning when it's cooler, then head back for a rest |
| after lunch (like the locals do). Even adults will appreciate the downtime. |
| |
| Hydrate Constantly: June can get hot—bring refillable water bottles. Rome especially has |
| free water fountains (called nasoni) with cold, drinkable water. |
| |
| Stroller Advice: We recommend you don't bring a stroller—Italy's cobblestone streets are no |
| joke—but if you must, we recommend a lightweight, foldable stroller with good wheels. |
| |
| Gelato is Your Friend: It's a reward, a bribe, a cool-down, and a cultural experience all in one. |
| |
| What to Pack |
| |
| • Lightweight clothes, hats, and sunblock |
| • Power adapter for European plugs (Type C, F, or L) |
| • Small toys or activities for meals and downtime |
| • Baby wipes (always handy in transit or with messy gelato!) |
+------------------------------------------------------------------------------------------------------------------------+
```

### **Agent Output Structure Requirements**

Each agent must format their output to fit into these structured sections:

#### **Itinerary Architect Output:**

```typescript
interface ArchitectOutput {
  tripSummary: {
    destination: string;
    dateRange: string;
    travelers: string;
    budget: string;
    preparedFor: string;
  };
  dailyStructure: Array<{
    day: number;
    date: string;
    title: string;
    theme: string;
    timeBlocks: Array<{
      time: string;
      activity: string;
      type: 'travel' | 'accommodation' | 'activity' | 'dining' | 'rest';
      notes?: string;
    }>;
  }>;
}
```

#### **Web Gatherer Output:**

```typescript
interface GathererOutput {
  flights: Array<{
    airline: string;
    departure: { time: string; airport: string; city: string };
    arrival: { time: string; airport: string; city: string };
    duration: string;
    layovers?: string;
    notes?: string;
    bookingLink: string;
  }>;
  accommodations: Array<{
    name: string;
    type: 'hotel' | 'airbnb' | 'unique';
    description: string;
    bookingLink: string;
  }>;
  restaurants: Array<{
    name: string;
    cuisine: string;
    description: string;
    reservationLink: string;
  }>;
}
```

#### **Information Specialist Output:**

```typescript
interface SpecialistOutput {
  personalizedTips: Array<{
    category: string;
    tips: string[];
    relevanceReason: string;
  }>;
  culturalInsights: Array<{
    topic: string;
    insight: string;
    practicalApplication: string;
  }>;
  packingList: {
    essentials: string[];
    familySpecific?: string[];
    weatherConsiderations: string[];
  };
}
```

---

## Technology Stack Decisions

### 1. Multi-Agent Workflow Orchestration

**Decision**: Inngest TypeScript SDK with Advanced Workflow Features  
**Rationale**:

- Native serverless function support with Vercel Edge Runtime compatibility
- Reliable step execution with automatic retries and state management
- Event-driven architecture perfect for form reactivity triggers
- TypeScript-first with comprehensive type safety
- Built-in progress tracking and monitoring capabilities
- **Advanced Features**: Step parallelism, event batching, temporal operations, durable fetch

#### Enhanced Multi-Agent Workflow with Smart Queries:

```typescript
export const intelligentItineraryWorkflow = inngest.createFunction(
  {
    id: 'intelligent-itinerary-workflow',
    batchEvents: { maxSize: 5, timeout: '10s' },
  },
  { event: 'form.itinerary.generate' },
  async ({ event, step }) => {
    const { formData } = event.data;

    // Step 1: Generate context-aware queries with fallback handling
    const smartQueries = await step.run('generate-smart-queries', () => {
      const queries = generateSmartQueries(formData);

      // Log data completeness for monitoring
      const completeness = calculateFormCompleteness(formData);
      console.log(`Form completion: ${completeness}% - Generated ${queries.length} queries`);

      return queries;
    });

    // Step 2: Distribute queries with priority-based assignment
    const queryDistribution = await step.run('distribute-queries', () =>
      distributeQueries(smartQueries)
    );

    // Step 3: Parallel agent execution with targeted queries
    const [architectResult, gathererResult, specialistResult] = await Promise.all([
      step.run('itinerary-architect', async () => {
        const queries = queryDistribution['itinerary-architect'];
        if (queries.length === 0) {
          // Fallback: create basic structure from minimal data
          return architectAgent.createBasicStructure(formData);
        }
        return architectAgent.process(queries, formData);
      }),

      step.run('web-gatherer', async () => {
        const queries = queryDistribution['web-gatherer'];
        return gathererAgent.search(queries, formData);
      }),

      step.run('information-specialist', async () => {
        const queries = queryDistribution['information-specialist'];
        // Always has at least general query as fallback
        return specialistAgent.enrich(queries, formData);
      }),
    ]);

    // Step 4: Intelligent result synthesis with completion awareness
    return await step.run('synthesize-results', () =>
      synthesizeIntelligentItinerary({
        architecture: architectResult,
        webData: gathererResult,
        insights: specialistResult,
        originalQueries: smartQueries,
        formData,
        completenessScore: calculateFormCompleteness(formData),
      })
    );
  }
);

// Synthesis function that creates the structured output format
function synthesizeIntelligentItinerary({
  architecture,
  webData,
  insights,
  originalQueries,
  formData,
  completenessScore,
}) {
  const tripDuration = calculateDays(formData.departDate, formData.returnDate);
  const tripNickname =
    formData.travelStyleAnswers?.tripNickname || `${formData.location} Adventure`;

  // Build structured sections
  const sections = {
    header: generateHeader(),

    tripSummary: generateTripSummary({
      destination: formData.location,
      dateRange: `${formatDate(formData.departDate)} – ${formatDate(formData.returnDate)}`,
      travelers: formatTravelers(formData.adults, formData.children),
      budget: formatBudget(formData),
      preparedFor: formData.contactInfo?.name || 'Your Trip',
    }),

    map: generateMapSection(formData.location),

    dailyItinerary: generateDailyItinerary({
      architectureStructure: architecture.dailyStructure,
      webDataResults: webData,
      duration: tripDuration,
      startDate: formData.departDate,
    }),

    tips: generateTipsSection({
      personalizedTips: insights.personalizedTips,
      formData: formData,
      completenessScore: completenessScore,
    }),
  };

  // Combine all sections into final markdown
  return combineIntoMarkdown(sections);
}

// Helper functions for structured generation
function generateTripSummary({ destination, dateRange, travelers, budget, preparedFor }) {
  return `
## TRIP SUMMARY | "${tripNickname}"

+--------------+    +-----------------------------+    +------------------+    +--------------------------------------------------------------+    +------------------------+
| Destination  |    |           Dates             |    |    Travelers     |    |                         Budget                               |    |     Prepared for:      |
|   ${destination.padEnd(10)} |    | ${dateRange.padEnd(25)} |    | ${travelers.padEnd(
    15
  )} |    | ${budget.padEnd(58)} |    | ${preparedFor.padEnd(20)} |
+--------------+    +-----------------------------+    +------------------+    +--------------------------------------------------------------+    +------------------------+
`;
}

function generateDailyItinerary({ architectureStructure, webDataResults, duration, startDate }) {
  let itinerary = `## 🗓️ DAILY ITINERARY\n\n`;

  architectureStructure.forEach((day, index) => {
    const dayDate = addDays(startDate, index);
    const dayTitle = `Day ${day.day} | ${formatDayDate(dayDate)} | ${day.title}`;

    itinerary += `### ${dayTitle}\n`;
    itinerary += `+${'-'.repeat(120)}+\n`;

    // Add day content based on type
    if (day.theme === 'travel-day') {
      itinerary += generateTravelDayContent(webDataResults.flights, day);
    } else {
      itinerary += generateActivityDayContent(webDataResults, insights, day);
    }

    itinerary += `+${'-'.repeat(120)}+\n\n`;
  });

  return itinerary;
}

function generateTipsSection({ personalizedTips, formData, completenessScore }) {
  let tips = `## 💡 TIPS FOR YOUR TRIP\n`;
  tips += `Based on your trip answers, travel group, location, etc.\n\n`;
  tips += `+${'-'.repeat(120)}+\n`;

  personalizedTips.forEach((tipCategory) => {
    tips += `| ${tipCategory.category}: ${tipCategory.tips.join('. ')} |\n`;
    tips += `|${' '.repeat(120)} |\n`;
  });

  tips += `+${'-'.repeat(120)}+\n`;

  return tips;
}

// Helper function to assess form completion
function calculateFormCompleteness(formData: FormData): number {
  const checks = [
    !!formData.location, // Required: 10%
    !!formData.departDate && !!formData.returnDate, // Required: 10%
    formData.adults > 0, // Required: 10%
    (formData.selectedGroups?.length || 0) > 0, // Optional: 15%
    (formData.selectedInterests?.length || 0) > 0, // Optional: 15%
    (formData.selectedInclusions?.length || 0) > 0, // Optional: 15%
    !!formData.travelStyleChoice && formData.travelStyleChoice !== 'not-selected', // Optional: 25%
  ];

  const weights = [10, 10, 10, 15, 15, 15, 25];
  const totalScore = checks.reduce((sum, check, index) => sum + (check ? weights[index] : 0), 0);

  return totalScore;
}
```

#### Agent Implementation with Smart Queries:

```typescript
// Web Gatherer Agent with multiple search providers
const gathererAgent = {
  async search(queries: SmartQuery[], formData: FormData) {
    const results = await Promise.all(
      queries.map(async (query) => {
        // Use different providers based on query type
        if (query.type === 'cruise' && query.specialSource) {
          return await scrapeCruiseOptions(query.specialSource);
        }

        // Parallel search across providers
        const [serpResults, tavilyResults, exaResults] = await Promise.all([
          searchProviders.find((p) => p.name === 'SERP').execute(query.query),
          searchProviders.find((p) => p.name === 'Tavily').execute(query.query),
          searchProviders.find((p) => p.name === 'Exa').execute(query.query),
        ]);

        return {
          query,
          results: {
            serp: serpResults,
            tavily: tavilyResults,
            exa: exaResults,
          },
        };
      })
    );

    return this.consolidateResults(results, formData);
  },

  consolidateResults(results: any[], formData: FormData) {
    // Intelligent result consolidation based on query priority and relevance
    return results.reduce((consolidated, result) => {
      const { query, results: searchResults } = result;

      // Prioritize results based on query priority and type
      consolidated[query.type] = {
        priority: query.priority,
        bestResults: this.selectBestResults(searchResults, query.type),
        metadata: {
          query: query.query,
          searchTime: new Date().toISOString(),
          confidence: this.calculateConfidence(searchResults),
        },
      };

      return consolidated;
    }, {});
  },
};
```

#### Advanced Features Implementation:

**1. Event Batching for Form Reactivity:**

```typescript
export const formUpdateWorkflow = inngest.createFunction(
  {
    id: 'form-update-workflow',
    batchEvents: { maxSize: 10, timeout: '2s' }, // Batch rapid form changes
  },
  { event: 'form.field.changed' },
  async ({ event, events, step }) => {
    // Process all form changes in batch for efficiency
    const consolidatedChanges = events.reduce(
      (acc, e) => ({
        ...acc,
        [e.data.field]: e.data.value,
      }),
      {}
    );

    return await step.run('update-recommendations', () =>
      updateItinerarySection(consolidatedChanges)
    );
  }
);
```

**2. Temporal Operations for Scheduling:**

```typescript
export const delayedRecommendations = inngest.createFunction(
  { id: 'delayed-recommendations' },
  { event: 'form.complete' },
  async ({ event, step }) => {
    // Wait for user to review before sending additional suggestions
    await step.sleep('user-review-period', Temporal.Duration.from({ minutes: 5 }));

    // Schedule follow-up recommendations for specific dates
    const tripStart = Temporal.Instant.from(event.data.startDate);
    await step.sleepUntil('trip-reminder', tripStart.subtract(Temporal.Duration.from({ days: 7 })));

    return await step.run('send-trip-reminder', () => sendTripReminder(event.data.email));
  }
);
```

**3. Durable Fetch with Retries:**

```typescript
export const webInformationGatherer = inngest.createFunction(
  { id: 'web-information-gatherer' },
  { event: 'search.web.data' },
  async ({ step }) => {
    // All external API calls are durable and retryable
    const tavilyApi = new TavilyApi({ fetch: step.fetch });
    const exaApi = new ExaApi({ fetch: step.fetch });

    const [tavilyResults, exaResults] = await Promise.all([
      step.run('tavily-search', () => tavilyApi.search('best restaurants in Paris 2024')),
      step.run('exa-search', () => exaApi.search('luxury hotels Paris recommendations:')),
    ]);

    return { tavilyResults, exaResults };
  }
);
```

**4. Promise.race for Fastest Response:**

```typescript
export const fastestRecommendation = inngest.createFunction(
  { id: 'fastest-recommendation' },
  { event: 'urgent.recommendation.needed' },
  async ({ step }) => {
    // Get fastest response from multiple sources
    const winner = await step.run('race-sources', async () => {
      const cached = step.run('get-cached', () => getCachedRecommendation());
      const live = step.run('get-live', () => getLiveRecommendation());
      const fallback = step.run('get-fallback', () => getFallbackRecommendation());

      return Promise.race([cached, live, fallback]);
    });

    return { winner };
  }
);
```

**5. Parallel Reduce for Multi-Agent Results:**

```typescript
export const multiAgentReduce = inngest.createFunction(
  { id: 'multi-agent-reduce' },
  { event: 'agents.aggregate' },
  async ({ event, step }) => {
    const { formData, destination } = event.data;

    // Parallel agent execution
    const [architectResult, gathererResult, specialistResult, putterResult] = await Promise.all([
      step.run('itinerary-architect', () => architectAgent.plan(formData, destination)),
      step.run('web-gatherer', () => gathererAgent.search(destination)),
      step.run('information-specialist', () => specialistAgent.enrich(destination)),
      step.run('form-putter', () => putterAgent.optimize(formData)),
    ]);

    // Reduce all agent results
    return await step.run('combine-results', () => {
      return {
        structure: architectResult,
        data: gathererResult,
        insights: specialistResult,
        optimizations: putterResult,
        confidence: calculateConfidence([
          architectResult,
          gathererResult,
          specialistResult,
          putterResult,
        ]),
      };
    });
  }
);
```

**Alternatives Considered**: Direct API orchestration, Temporal, Workflow engines  
**Why Chosen**: Serverless-native, minimal infrastructure overhead, excellent TypeScript support

### 2. AI/LLM Service Integration

**Decision**: Strategic Multi-LLM approach - xAI Grok + Groq Compound Models  
**Rationale**:

- **xAI Grok**: Advanced reasoning and complex planning capabilities
- **Groq Compound**: Ultra-fast web search and browser-optimized inference
- Both integrate seamlessly with Vercel AI SDK and Inngest step functions
- Cost-effective with 2M context and 4M TPM limits

#### xAI Model Configuration:

```typescript
import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';

// For complex itinerary planning and reasoning
const GROK_REASONING_MODEL = 'grok-4-fast-reasoning'; // $0.20/$0.50 per M tokens
const GROK_FAST_MODEL = 'grok-4-fast-non-reasoning'; // $0.20/$0.50 per M tokens

// Context: 2M tokens, Rate: 4M TPM, 480 RPM
const itineraryPlan = await generateText({
  model: xai(GROK_REASONING_MODEL),
  prompt: `Plan detailed 7-day itinerary for ${formData}`,
  tools: [getWeatherTool, findAttractionsTool, checkBudgetTool],
  maxTokens: 2000,
  temperature: 0.7,
});
```

#### Groq Compound Model Configuration:

```typescript
import Groq from 'groq-sdk';

// Web search agent - Groq Compound models
const WEB_SEARCH_MODEL = 'groq/compound'; // For comprehensive web search
const WEB_SEARCH_MINI = 'groq/compound-mini'; // For quick searches

// Browser search agent - OpenAI GPT-OSS models via Groq
const BROWSER_MODEL_20B = 'openai/gpt-oss-20b'; // Smaller, faster responses
const BROWSER_MODEL_120B = 'openai/gpt-oss-120b'; // Larger, more comprehensive

const webSearchClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Web Information Gatherer Agent
const searchResults = await webSearchClient.chat.completions.create({
  model: WEB_SEARCH_MODEL,
  messages: [
    {
      role: 'user',
      content: `Find current travel information for ${destination}: hotels, restaurants, activities, pricing`,
    },
  ],
  max_tokens: 1000,
  temperature: 0.3,
});

// Browser-optimized Form Putter Agent
const formUpdate = await webSearchClient.chat.completions.create({
  model: BROWSER_MODEL_20B,
  messages: [
    {
      role: 'user',
      content: `Update form recommendations based on: ${formChanges}`,
    },
  ],
  max_tokens: 500,
  temperature: 0.1,
});
```

**Alternatives Considered**: OpenAI only, Anthropic only, Google Gemini  
**Why Chosen**: Best-in-class reasoning (Grok) + speed (Groq) combination, cost optimization

### 3. Vector Storage and Caching

**Decision**: Upstash Vector + Redis  
**Rationale**:

- Serverless-native vector database with auto-scaling
- Vercel Edge Runtime compatibility
- Built-in embedding generation or custom model support
- Redis backend for session state and caching
- Pay-per-use pricing model

**Usage Pattern**:

```typescript
import { Index } from '@upstash/vector';

// Vector storage for itinerary similarity and caching
const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
});

// Cache generated content
await vectorIndex.upsert({
  id: `itinerary-${requestId}`,
  data: itineraryContent,
  metadata: { formData, timestamp, userId },
});
```

**Alternatives Considered**: Pinecone, Weaviate, Supabase Vector  
**Why Chosen**: Serverless-first design, Vercel integration, automatic scaling

### 4. Web Research Integration

**Decision**: Dual search approach - Tavily + Exa  
**Rationale**:

- **Tavily**: Comprehensive web crawling, extract up to 20 URLs, natural language instructions
- **Exa**: AI-optimized search, neural embeddings, LLM-friendly content format
- Complementary strengths for different research phases

**Tavily Pattern**:

```typescript
import { tavily } from '@tavily/core';

// Comprehensive travel research
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const research = await tvly.search('best restaurants in Paris 2024', {
  searchDepth: 'advanced',
  includeAnswer: true,
  maxResults: 10,
});
```

**Exa Pattern**:

```typescript
import exa from 'exa-js';

// AI-optimized content search
const client = new exa({ apiKey: process.env.EXA_API_KEY });
const results = await client.search('luxury hotels in Tokyo recommendations:', {
  type: 'neural',
  useAutoprompt: false,
  numResults: 5,
});
```

**Alternatives Considered**: Google Search API, Bing API, SerpAPI  
**Why Chosen**: AI-native design, optimized for LLM consumption, comprehensive coverage

## Multi-Agent Architecture

### Agent Role Definitions with Model Assignments

Based on user requirements and performance optimization, the system implements 4 specialized agents:

#### 1. Itinerary Architect & Content Planner

**Responsibility**: Overall itinerary structure, timeline optimization, logical flow  
**LLM**: xAI Grok-4-Fast-Reasoning (complex reasoning required)  
**Tools**: Calendar analysis, travel time calculation, preference weighing  
**Data Input**: Location, dates, travel style answers, budget, group composition

```typescript
const architectAgent = async (formData: FormData) => {
  return await generateText({
    model: xai('grok-4-fast-reasoning'),
    prompt: `Create structured ${formData.plannedDays || 7}-day itinerary for ${formData.location}`,
    tools: [calendarTool, budgetCalculator, groupAnalyzer],
    maxTokens: 2000,
  });
};
```

#### 2. Web Information Gatherer

**Responsibility**: Real-time travel data collection, pricing, availability  
**LLM**: Groq Compound (speed-critical for fresh web data)  
**Tools**: Tavily search, Exa search, price comparison APIs  
**Data Input**: Location, budget, interests, group size

```typescript
const gathererAgent = async (destination: string, budget: number) => {
  return await webSearchClient.chat.completions.create({
    model: 'groq/compound',
    messages: [
      {
        role: 'user',
        content: `Search current travel data for ${destination}: hotels under $${
          budget / 7
        }/night, restaurants, activities`,
      },
    ],
    max_tokens: 1000,
  });
};
```

#### 3. Information Specialist

**Responsibility**: Content enrichment, local insights, cultural context  
**LLM**: xAI Grok-4-Fast-Reasoning (deep knowledge synthesis)  
**Tools**: Vector similarity search, content analysis, factual verification  
**Data Input**: Location, travel style, interests, custom preferences

```typescript
const specialistAgent = async (location: string, interests: string[]) => {
  return await generateText({
    model: xai('grok-4-fast-reasoning'),
    prompt: `Provide cultural insights and local knowledge for ${location} focusing on ${interests.join(
      ', '
    )}`,
    tools: [vectorSearch, culturalDatabase, localEventsTool],
    maxTokens: 1500,
  });
};
```

#### 4. Form Putter

**Responsibility**: Real-time form updates, user preference tracking, browser optimization  
**LLM**: Groq OpenAI GPT-OSS-20B (ultra-low latency browser-optimized)  
**Tools**: Form state management, change detection, incremental updates  
**Data Input**: Form changes, flexibility flags, custom text inputs

```typescript
const putterAgent = async (formChanges: Partial<FormData>) => {
  return await webSearchClient.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [
      {
        role: 'user',
        content: `Optimize recommendations for form changes: ${JSON.stringify(formChanges)}`,
      },
    ],
    max_tokens: 500,
    temperature: 0.1,
  });
};
```

### Model Selection Strategy

| Agent      | Primary Task        | Model Choice          | Rationale                        |
| ---------- | ------------------- | --------------------- | -------------------------------- |
| Architect  | Complex planning    | Grok-4-Fast-Reasoning | Advanced reasoning, 2M context   |
| Gatherer   | Web search          | Groq Compound         | Optimized for web data retrieval |
| Specialist | Knowledge synthesis | Grok-4-Fast-Reasoning | Deep cultural knowledge          |
| Putter     | Form updates        | GPT-OSS-20B           | Browser-optimized, low latency   |

### Workflow Coordination

**Trigger**: Form submission or real-time form changes  
**Orchestration**: Inngest step-based execution  
**State Management**: Upstash Redis for workflow state  
**Communication**: Event-driven with structured data contracts

## Real-Time Implementation Strategy

### Form Reactivity

- **Change Detection**: React Hook Form + custom hooks
- **Debouncing**: 500ms for input fields, immediate for selections
- **State Sync**: Optimistic updates with server reconciliation
- **Conflict Resolution**: Last-write-wins with user notification

### Update Delivery

- **WebSocket**: Real-time push for itinerary updates
- **Polling Fallback**: 2-second intervals if WebSocket fails
- **Caching Strategy**: Vector similarity for partial updates
- **Progress Tracking**: Step-by-step agent progress indicators

## Performance Optimization

### Response Time Targets

- **Initial Generation**: <30 seconds (per spec)
- **Real-time Updates**: <10 seconds (per spec)
- **UI Responsiveness**: <3 seconds (constitutional requirement)

### Scaling Strategy

- **Agent Parallelization**: Independent agent execution where possible
- **Caching Layers**: Vector similarity, Redis state, CDN static assets
- **Resource Limits**: Vercel Edge Runtime constraints (50MB memory, 10s execution)
- **Fallback Systems**: Cached recommendations when agents unavailable

## Security and Privacy

### Data Protection

- **Form Data**: Encrypted at rest and in transit
- **API Keys**: Environment variables only, rotation strategy
- **User Sessions**: Redis-based with expiration
- **Content Filtering**: Safe search enabled on all external APIs

### Rate Limiting

- **API Protection**: Upstash rate limiting middleware
- **User Limits**: Per-user generation quotas
- **Cost Controls**: Monthly spending alerts and hard caps

## Integration Requirements

### Existing Codebase Integration

- **Form System**: Enhance existing TripDetails components
- **Type System**: Extend FormData interface with AI preferences
- **Validation**: Maintain Zod schemas with additional fields
- **Testing**: TDD approach with agent-specific test suites

## Serverless Function Architecture (8 Functions)

**Constraint**: Vercel limit of 12, targeting 8 for future expansion room (can extend to 10)

### **Core Functions (6 Essential)**

#### 1. `/api/itinerary/generate` - Main Orchestration

**Purpose**: Primary endpoint for itinerary generation  
**Responsibilities**:

- Receives form data from frontend
- Triggers Inngest workflow
- Returns initial response with workflow ID
- Handles WebSocket connection setup for real-time updates

```typescript
// POST /api/itinerary/generate
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { formData } = req.body;

  // Generate smart queries
  const smartQueries = generateSmartQueries(formData);

  // Trigger Inngest workflow
  const { ids } = await inngest.send('form.itinerary.generate', {
    data: { formData, queries: smartQueries, sessionId: generateId() },
  });

  // Return workflow tracking info
  return res.json({
    workflowId: ids[0],
    status: 'processing',
    estimatedTime: '20-30 seconds',
  });
}
```

#### 2. `/api/agents/architect` - Itinerary Architect

**Purpose**: Structure and timeline planning agent  
**Responsibilities**:

- Creates daily itinerary structure
- Optimizes logical flow and timing
- Handles travel day vs activity day planning
- Integrates with Grok-4-Fast-Reasoning model

```typescript
// POST /api/agents/architect
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { queries, formData, completenessScore } = req.body;

  const architectResult = await generateText({
    model: xai('grok-4-fast-reasoning'),
    prompt: buildArchitectPrompt(formData, queries),
    maxTokens: 2000,
    temperature: 0.7,
  });

  return res.json({
    agent: 'architect',
    result: parseArchitectOutput(architectResult),
    confidence: calculateConfidence(architectResult),
  });
}
```

#### 3. `/api/agents/gatherer` - Web Information Gatherer

**Purpose**: Real-time travel data collection  
**Responsibilities**:

- Searches across multiple providers (SERP, Tavily, Exa)
- Handles flight, hotel, restaurant searches
- Special cruise handling via CruiseCritic
- Uses Groq Compound for speed

```typescript
// POST /api/agents/gatherer
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { queries, formData } = req.body;

  // Parallel search across providers
  const results = await Promise.all(
    queries.map(async (query) => {
      if (query.type === 'cruise' && query.specialSource) {
        return await scrapeCruiseOptions(query.specialSource);
      }

      return await searchMultipleProviders(query);
    })
  );

  return res.json({
    agent: 'gatherer',
    results: consolidateSearchResults(results, formData),
    searchTime: new Date().toISOString(),
  });
}
```

#### 4. `/api/agents/specialist` - Information Specialist

**Purpose**: Cultural insights and personalized recommendations  
**Responsibilities**:

- Generates personalized travel tips
- Cultural context and local insights
- Packing and practical advice
- Uses Grok-4-Fast-Reasoning for deep knowledge

```typescript
// POST /api/agents/specialist
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { queries, formData, completenessScore } = req.body;

  const insights = await generateText({
    model: xai('grok-4-fast-reasoning'),
    prompt: buildSpecialistPrompt(formData, queries, completenessScore),
    maxTokens: 1500,
    temperature: 0.6,
  });

  return res.json({
    agent: 'specialist',
    personalizedTips: parseInsights(insights),
    culturalContext: extractCulturalInsights(insights),
    relevanceScore: completenessScore,
  });
}
```

#### 5. `/api/inngest` - Workflow Handler

**Purpose**: Inngest webhook receiver and workflow orchestration  
**Responsibilities**:

- Handles all Inngest workflow events
- Coordinates multi-agent execution
- Manages step-by-step progress tracking
- Error handling and retries

```typescript
// POST /api/inngest
import { serve } from 'inngest/next';
import {
  intelligentItineraryWorkflow,
  formUpdateWorkflow,
  delayedRecommendations,
} from '../../../lib/workflows';

export default serve(inngest, [
  intelligentItineraryWorkflow,
  formUpdateWorkflow,
  delayedRecommendations,
]);
```

#### 6. `/api/form/updates` - Real-time Form Updates

**Purpose**: Form Putter agent + real-time updates  
**Responsibilities**:

- Handles real-time form field changes
- Provides micro-optimizations
- WebSocket/polling endpoint for progress updates
- Uses GPT-OSS-20B for speed

```typescript
// POST /api/form/updates
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Polling endpoint for progress updates
    const { workflowId } = req.query;
    const status = await getWorkflowStatus(workflowId);
    return res.json(status);
  }

  if (req.method === 'POST') {
    // Real-time form field updates
    const { field, value, formData } = req.body;

    const suggestions = await webSearchClient.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'user',
          content: `User changed ${field} to ${value}. Suggest 2-3 quick optimizations.`,
        },
      ],
      max_tokens: 150,
    });

    return res.json({ suggestions: parseSuggestions(suggestions) });
  }
}
```

### **Supporting Functions (2 Additional)**

#### 7. `/api/search/providers` - Unified Search Interface

**Purpose**: Consolidated search provider management  
**Responsibilities**:

- SERP API integration
- Tavily search coordination
- Exa neural search
- Provider failover and rate limiting

```typescript
// POST /api/search/providers
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query, providers = ['SERP', 'Tavily', 'Exa'], queryType } = req.body;

  const searchResults = await Promise.allSettled(
    [
      providers.includes('SERP') ? serpSearch(query) : null,
      providers.includes('Tavily') ? tavilySearch(query) : null,
      providers.includes('Exa') ? exaSearch(query) : null,
    ].filter(Boolean)
  );

  return res.json({
    query,
    results: consolidateProviderResults(searchResults),
    providers: providers,
    timestamp: new Date().toISOString(),
  });
}
```

#### 8. `/api/cache/vector` - Vector Similarity Caching

**Purpose**: Upstash Vector storage and similarity matching  
**Responsibilities**:

- Cache generated itineraries for similarity matching
- Store embeddings for faster retrieval
- Handle partial itinerary updates
- Session state management

```typescript
// POST /api/cache/vector
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { operation, data, similarity_threshold = 0.8 } = req.body;

  const vectorIndex = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN,
  });

  switch (operation) {
    case 'store':
      await vectorIndex.upsert({
        id: `itinerary-${data.sessionId}`,
        data: data.content,
        metadata: {
          formData: data.formData,
          timestamp: new Date().toISOString(),
          completeness: data.completeness,
        },
      });
      break;

    case 'search':
      const similar = await vectorIndex.query({
        data: data.query,
        topK: 3,
        includeMetadata: true,
      });
      return res.json({ similarItineraries: similar });
  }

  return res.json({ success: true });
}
```

### **Function Flow Architecture**

```mermaid
graph TD
    A[Frontend Form] --> B[/api/itinerary/generate]
    B --> C[/api/inngest - Workflow Trigger]
    C --> D[/api/agents/architect]
    C --> E[/api/agents/gatherer]
    C --> F[/api/agents/specialist]

    E --> G[/api/search/providers]
    D --> H[/api/cache/vector]
    F --> H

    I[Real-time Updates] --> J[/api/form/updates]
    J --> K[WebSocket/Polling Response]

    C --> L[Synthesis & Final Output]
```

### **Resource Allocation**

| Function                  | Memory | Timeout | Expected Usage              |
| ------------------------- | ------ | ------- | --------------------------- |
| `/api/itinerary/generate` | 256MB  | 30s     | High - Main entry           |
| `/api/agents/architect`   | 512MB  | 25s     | Medium - Complex reasoning  |
| `/api/agents/gatherer`    | 256MB  | 20s     | High - Search queries       |
| `/api/agents/specialist`  | 256MB  | 15s     | Medium - Content generation |
| `/api/inngest`            | 128MB  | 60s     | Low - Event handling        |
| `/api/form/updates`       | 128MB  | 5s      | Very High - Real-time       |
| `/api/search/providers`   | 256MB  | 15s     | High - External APIs        |
| `/api/cache/vector`       | 128MB  | 10s     | Medium - Caching            |

**Total**: 8 functions optimized for Vercel Edge Runtime with room for 2 future additions.

---

**Status**: All NEEDS CLARIFICATION resolved  
**Next Phase**: Data model and API contract design  
**Dependencies**: All researched through Context7 MCP server as required by constitution

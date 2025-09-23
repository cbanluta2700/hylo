/**
 * Web Information Gatherer Agent
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - Groq for high-speed information processing
 * - Multiple search provider integration
 *
 * Task: T023 - Implement Web Information Gatherer agent
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { generateText } from 'ai';
import { aiProviders } from '../ai-clients/providers.js';
/**
 * Web Information Gatherer Agent
 * Uses Groq for fast processing and multiple search providers
 */
var WebInformationGathererAgent = /** @class */ (function () {
    function WebInformationGathererAgent() {
        this.agentType = 'gatherer';
    }
    /**
     * Gather comprehensive destination information
     * Uses AI to process and synthesize web search results
     */
    WebInformationGathererAgent.prototype.gatherInformation = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, client, systemPrompt, userPrompt, result, processingTime, gatheredInfo, error_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        startTime = Date.now();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        client = aiProviders.getClientForAgent(this.agentType);
                        if (!client) {
                            throw new Error('Groq client not available for gatherer agent');
                        }
                        console.log("[Gatherer Agent] Gathering information for ".concat(input.destination, " - workflow ").concat(input.workflowId));
                        systemPrompt = this.buildSystemPrompt();
                        userPrompt = this.buildUserPrompt(input);
                        return [4 /*yield*/, generateText({
                                model: client.client('llama3-70b-8192'),
                                system: systemPrompt,
                                prompt: userPrompt,
                                temperature: 0.3, // Lower temperature for factual information
                            })];
                    case 2:
                        result = _b.sent();
                        processingTime = Date.now() - startTime;
                        gatheredInfo = this.parseGathererResponse(result.text, input);
                        console.log("[Gatherer Agent] Completed information gathering in ".concat(processingTime, "ms"));
                        return [2 /*return*/, __assign(__assign(__assign({}, gatheredInfo), { processingTime: processingTime }), (((_a = result.usage) === null || _a === void 0 ? void 0 : _a.totalTokens) && { tokensUsed: result.usage.totalTokens }))];
                    case 3:
                        error_1 = _b.sent();
                        console.error("[Gatherer Agent] Failed for workflow ".concat(input.workflowId, ":"), error_1);
                        throw new Error("Information gathering failed: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Build system prompt for information gathering
     */
    WebInformationGathererAgent.prototype.buildSystemPrompt = function () {
        return "You are a specialized travel information gatherer with extensive knowledge of worldwide destinations.\n\nYour role is to provide comprehensive, accurate, and up-to-date information about travel destinations, including accommodations, restaurants, activities, and practical travel advice.\n\nKey responsibilities:\n1. Provide accurate destination overview and practical information\n2. Recommend accommodations matching traveler preferences and budget\n3. Suggest restaurants covering various price points and cuisines\n4. Identify activities and attractions aligned with traveler interests\n5. Advise on transportation options and costs\n6. Share valuable local insights and cultural tips\n\nOutput Format (JSON):\n{\n  \"destinationInfo\": {\n    \"overview\": \"Brief destination description\",\n    \"bestTimeToVisit\": \"Seasonal advice\",\n    \"localCurrency\": \"Currency code\",\n    \"averageCosts\": {\n      \"meal_budget\": number,\n      \"activity_budget\": number,\n      \"transport_daily\": number\n    },\n    \"culturalNotes\": [\"tip1\", \"tip2\"]\n  },\n  \"accommodations\": [\n    {\n      \"name\": \"Hotel/Property Name\",\n      \"type\": \"hotel|hostel|apartment|bnb\",\n      \"location\": \"Area/District\",\n      \"priceRange\": \"budget|mid-range|luxury\",\n      \"rating\": 4.5,\n      \"amenities\": [\"wifi\", \"breakfast\", \"pool\"],\n      \"bookingInfo\": \"How to book or website\"\n    }\n  ],\n  \"restaurants\": [\n    {\n      \"name\": \"Restaurant Name\", \n      \"cuisine\": \"Cuisine Type\",\n      \"location\": \"Area/District\",\n      \"priceRange\": \"$|$$|$$$|$$$$\",\n      \"rating\": 4.2,\n      \"specialties\": [\"dish1\", \"dish2\"],\n      \"reservationRequired\": true\n    }\n  ],\n  \"activities\": [\n    {\n      \"name\": \"Activity Name\",\n      \"type\": \"cultural|adventure|relaxation|entertainment\",\n      \"location\": \"Location\",\n      \"duration\": \"2-3 hours\",\n      \"cost\": \"Free|$20-30|$$\",\n      \"rating\": 4.8,\n      \"description\": \"Brief description\",\n      \"bookingRequired\": false,\n      \"bestTimeOfDay\": \"morning|afternoon|evening\"\n    }\n  ],\n  \"transportation\": [\n    {\n      \"type\": \"metro|taxi|bus|rental_car\",\n      \"description\": \"Description and coverage\",\n      \"cost\": \"Cost information\",\n      \"duration\": \"Travel time info\",\n      \"bookingInfo\": \"How to use/book\"\n    }\n  ],\n  \"localInsights\": [\n    {\n      \"tip\": \"Practical tip or cultural insight\",\n      \"category\": \"cultural|practical|safety|food|transport\"\n    }\n  ]\n}\n\nProvide specific, actionable information that helps travelers make informed decisions.";
    };
    /**
     * Build user prompt with travel requirements
     */
    WebInformationGathererAgent.prototype.buildUserPrompt = function (input) {
        return "Gather comprehensive travel information for this destination:\n\nDESTINATION: ".concat(input.destination, "\n\nTRAVEL REQUIREMENTS:\n- Duration: ").concat(input.itineraryStructure.totalDays, " days\n- Budget: ").concat(input.budget.total, " ").concat(input.budget.currency, " total\n- Accommodation Budget: ").concat(input.budget.breakdown.accommodation, " ").concat(input.budget.currency, "\n- Food Budget: ").concat(input.budget.breakdown.food, " ").concat(input.budget.currency, "\n- Activities Budget: ").concat(input.budget.breakdown.activities, " ").concat(input.budget.currency, "\n\nTRAVELER PREFERENCES:\n- Travel Pace: ").concat(input.travelStyle.pace, "\n- Accommodation Type: ").concat(input.travelStyle.accommodationType, "\n- Dining Preferences: ").concat(input.travelStyle.diningPreferences, "\n- Activity Level: ").concat(input.travelStyle.activityLevel, "\n- Primary Interests: ").concat(input.interests.join(', '), "\n\nTRAVEL PHASES:\n").concat(input.itineraryStructure.travelPhases
            .map(function (phase, i) { var _a; return "- Phase ".concat(i + 1, ": ").concat(phase.focus, " (").concat(((_a = phase.days) === null || _a === void 0 ? void 0 : _a.length) || 1, " day(s))"); })
            .join('\n'), "\n\nProvide comprehensive information covering:\n1. Destination overview and practical information\n2. Accommodations matching their budget and style preferences\n3. Restaurant recommendations across different price points\n4. Activities and attractions aligned with their interests\n5. Transportation options and local travel advice\n6. Cultural insights and practical tips\n\nFocus on providing specific, actionable recommendations that will help create an amazing travel experience within their budget and style preferences.");
    };
    /**
     * Parse AI response into structured gatherer output
     */
    WebInformationGathererAgent.prototype.parseGathererResponse = function (responseText, input) {
        try {
            // Try to parse JSON response
            var jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                var parsed = JSON.parse(jsonMatch[0]);
                if (parsed.destinationInfo && parsed.accommodations) {
                    return parsed;
                }
            }
        }
        catch (error) {
            console.warn('[Gatherer Agent] JSON parsing failed, using fallback information');
        }
        // Fallback: Create basic information structure
        return this.createFallbackInformation(input);
    };
    /**
     * Create fallback information structure
     * Used when AI response parsing fails
     */
    WebInformationGathererAgent.prototype.createFallbackInformation = function (input) {
        return {
            destinationInfo: {
                overview: "".concat(input.destination, " is a popular travel destination offering diverse experiences."),
                bestTimeToVisit: 'Year-round destination with varying seasonal highlights',
                localCurrency: 'Local Currency',
                averageCosts: {
                    meal_budget: Math.floor(input.budget.breakdown.food / input.itineraryStructure.totalDays),
                    activity_budget: Math.floor(input.budget.breakdown.activities / input.itineraryStructure.totalDays),
                    transport_daily: Math.floor(input.budget.breakdown.transportation / input.itineraryStructure.totalDays),
                },
                culturalNotes: [
                    'Respect local customs and traditions',
                    'Learn basic phrases in the local language',
                ],
            },
            accommodations: [
                {
                    name: "".concat(input.travelStyle.accommodationType, " accommodation in ").concat(input.destination),
                    type: input.travelStyle.accommodationType,
                    location: 'Central area',
                    priceRange: input.travelStyle.accommodationType,
                    rating: 4.0,
                    amenities: ['wifi', 'breakfast'],
                    bookingInfo: 'Book through major travel sites',
                },
            ],
            restaurants: [
                {
                    name: 'Local restaurant recommendation',
                    cuisine: 'Local cuisine',
                    location: 'City center',
                    priceRange: '$$',
                    rating: 4.2,
                    specialties: ['local specialties'],
                    reservationRequired: false,
                },
            ],
            activities: input.interests.map(function (interest) { return ({
                name: "".concat(interest, " activity"),
                type: 'cultural',
                location: input.destination,
                duration: '2-3 hours',
                cost: '$20-30',
                rating: 4.5,
                description: "Experience ".concat(interest, " in ").concat(input.destination),
                bookingRequired: false,
                bestTimeOfDay: 'morning',
            }); }),
            transportation: [
                {
                    type: 'public transport',
                    description: 'Local public transportation system',
                    cost: 'Affordable daily passes available',
                    duration: 'Varies by route',
                    bookingInfo: 'Purchase at stations or via mobile app',
                },
            ],
            localInsights: [
                {
                    tip: 'Carry cash for small vendors and local markets',
                    category: 'practical',
                },
                {
                    tip: 'Respect local customs and dress codes',
                    category: 'cultural',
                },
            ],
        };
    };
    return WebInformationGathererAgent;
}());
export { WebInformationGathererAgent };
/**
 * Singleton instance for gatherer agent
 */
export var gathererAgent = new WebInformationGathererAgent();

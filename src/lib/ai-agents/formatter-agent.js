/**
 * Form Putter Agent (Formatter Agent)
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - GPT-OSS for final formatting (with Groq fallback)
 * - Type-safe development
 *
 * Task: T025 - Implement Form Putter agent
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
 * Form Putter (Formatter) Agent
 * Uses GPT-OSS (with Groq fallback) for final itinerary formatting and validation
 */
var FormPutterAgent = /** @class */ (function () {
    function FormPutterAgent() {
        this.agentType = 'formatter';
    }
    /**
     * Generate final formatted itinerary
     */
    FormPutterAgent.prototype.formatItinerary = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, client, systemPrompt, userPrompt, result, processingTime, formattedResult, error_1;
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
                            throw new Error('GPT-OSS/Groq client not available for formatter agent');
                        }
                        console.log("[Formatter Agent] Creating final itinerary for workflow ".concat(input.workflowId));
                        systemPrompt = this.buildSystemPrompt();
                        userPrompt = this.buildUserPrompt(input);
                        return [4 /*yield*/, generateText({
                                model: client.client(client.model),
                                system: systemPrompt,
                                prompt: userPrompt,
                                temperature: 0.2, // Low temperature for consistent formatting
                            })];
                    case 2:
                        result = _b.sent();
                        processingTime = Date.now() - startTime;
                        formattedResult = this.parseFormatterResponse(result.text, input);
                        console.log("[Formatter Agent] Completed formatting in ".concat(processingTime, "ms"));
                        return [2 /*return*/, __assign(__assign(__assign({}, formattedResult), { processingTime: processingTime }), (((_a = result.usage) === null || _a === void 0 ? void 0 : _a.totalTokens) && { tokensUsed: result.usage.totalTokens }))];
                    case 3:
                        error_1 = _b.sent();
                        console.error("[Formatter Agent] Failed for workflow ".concat(input.workflowId, ":"), error_1);
                        throw new Error("Itinerary formatting failed: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Build system prompt for itinerary formatting
     */
    FormPutterAgent.prototype.buildSystemPrompt = function () {
        return "You are an expert travel itinerary formatter and validator specializing in creating detailed, practical, and beautiful travel itineraries.\n\nYour role is to synthesize all gathered information into a comprehensive, day-by-day itinerary that is both inspiring and practical.\n\nKey responsibilities:\n1. Create detailed daily schedules with specific timing and logistics\n2. Ensure budget compliance and practical feasibility\n3. Validate that the itinerary matches traveler preferences\n4. Provide practical tips and local insights\n5. Include alternatives and contingency options\n6. Format everything in a clear, easy-to-follow structure\n\nOutput Format (JSON):\n{\n  \"finalItinerary\": {\n    \"id\": \"itinerary_unique_id\",\n    \"tripOverview\": {\n      \"destination\": \"City, Country\",\n      \"duration\": \"X days, Y nights\",\n      \"totalDays\": 7,\n      \"totalBudget\": 2500,\n      \"currency\": \"USD\",\n      \"tripStyle\": \"Cultural exploration with moderate pace\",\n      \"bestFor\": [\"first-time visitors\", \"culture lovers\"]\n    },\n    \"dailySchedule\": [\n      {\n        \"day\": 1,\n        \"date\": \"2024-12-01\",\n        \"theme\": \"Arrival & Orientation\",\n        \"estimatedBudget\": 300,\n        \"morning\": {\n          \"time\": \"9:00 AM\",\n          \"activity\": \"Airport arrival & hotel check-in\",\n          \"location\": \"City Center\",\n          \"cost\": \"Free\",\n          \"tips\": \"Arrive early to avoid crowds\"\n        },\n        \"afternoon\": {\n          \"time\": \"2:00 PM\", \n          \"activity\": \"Walking tour of historic center\",\n          \"location\": \"Historic District\",\n          \"cost\": \"$25\",\n          \"tips\": \"Wear comfortable shoes\"\n        },\n        \"evening\": {\n          \"time\": \"7:00 PM\",\n          \"activity\": \"Welcome dinner at local restaurant\",\n          \"location\": \"Restaurant Name\",\n          \"cost\": \"$60\",\n          \"tips\": \"Reservations recommended\"\n        },\n        \"meals\": {\n          \"breakfast\": \"Hotel breakfast\",\n          \"lunch\": \"Local caf\u00E9 near attractions\", \n          \"dinner\": \"Traditional restaurant\"\n        },\n        \"transportation\": \"Airport transfer + walking\",\n        \"accommodation\": \"Hotel Name (City Center)\"\n      }\n    ],\n    \"practicalInfo\": {\n      \"budgetBreakdown\": {\n        \"accommodation\": 1200,\n        \"food\": 600,\n        \"activities\": 500,\n        \"transportation\": 150,\n        \"miscellaneous\": 50\n      },\n      \"packingTips\": [\"Comfortable walking shoes\", \"Weather-appropriate clothing\"],\n      \"localTips\": [\"Local customs\", \"Language tips\"],\n      \"importantInfo\": [\"Emergency numbers\", \"Embassy contact\"],\n      \"emergencyInfo\": [\"Hospital locations\", \"Police contacts\"]\n    },\n    \"alternatives\": {\n      \"rainyDayOptions\": [\"Indoor museum\", \"Shopping district\"],\n      \"budgetFriendlySwaps\": [\"Free walking tour\", \"Picnic in park\"],\n      \"upgradeOptions\": [\"Private tour guide\", \"Fine dining experience\"]\n    }\n  },\n  \"validationResults\": {\n    \"budgetCompliance\": true,\n    \"preferencesAlignment\": 85,\n    \"logisticalFeasibility\": true,\n    \"issues\": [\"Minor timing concern with Day 3\"],\n    \"suggestions\": [\"Consider booking restaurant in advance\"]\n  }\n}\n\nCreate a detailed, practical itinerary that travelers can confidently follow.";
    };
    /**
     * Build user prompt with all workflow information
     */
    FormPutterAgent.prototype.buildUserPrompt = function (input) {
        return "Create a comprehensive final itinerary using all the gathered information:\n\nTRIP DETAILS:\n- Destination: ".concat(input.formData.location, "\n- Departure: ").concat(input.formData.departDate, "\n- Return: ").concat(input.formData.returnDate || 'Open-ended', "\n- Total Budget: ").concat(input.formData.budget.total, " ").concat(input.formData.budget.currency, "\n- Group: ").concat(input.formData.adults, " adult(s)").concat(input.formData.children > 0 ? ", ".concat(input.formData.children, " children") : '', "\n\nTRIP ARCHITECTURE:\n- Total Days: ").concat(input.architecture.itineraryStructure.totalDays, "\n- Style: ").concat(input.architecture.planningContext.tripStyle, "\n- Goals: ").concat(input.architecture.planningContext.experienceGoals.join(', '), "\n\nDAILY BUDGET ALLOCATION:\n").concat(input.architecture.itineraryStructure.dailyBudgetBreakdown
            .map(function (day) { return "Day ".concat(day.day, ": ").concat(day.allocatedBudget, " ").concat(input.formData.budget.currency); })
            .join('\n'), "\n\nTRAVEL PHASES:\n").concat(input.architecture.itineraryStructure.travelPhases
            .map(function (phase) { var _a; return "".concat(phase.phase, ": Days ").concat((_a = phase.days) === null || _a === void 0 ? void 0 : _a.join(', '), " - ").concat(phase.focus); })
            .join('\n'), "\n\nTOP RECOMMENDED ACCOMMODATIONS:\n").concat(input.processedRecommendations.rankedRecommendations.accommodations
            .filter(function (acc) { return acc.score >= 75; })
            .slice(0, 3)
            .map(function (acc) { return "".concat(acc.name, " (Score: ").concat(acc.score, ") - ").concat(acc.reasoning); })
            .join('\n'), "\n\nTOP RECOMMENDED RESTAURANTS:\n").concat(input.processedRecommendations.rankedRecommendations.restaurants
            .filter(function (rest) { return rest.score >= 75; })
            .slice(0, 5)
            .map(function (rest) { return "".concat(rest.name, " (Score: ").concat(rest.score, ") - ").concat(rest.reasoning); })
            .join('\n'), "\n\nTOP RECOMMENDED ACTIVITIES:\n").concat(input.processedRecommendations.rankedRecommendations.activities
            .filter(function (act) { return act.score >= 75; })
            .slice(0, 8)
            .map(function (act) { return "".concat(act.name, " (Score: ").concat(act.score, ") - Day ").concat(act.recommendedDay || 'TBD'); })
            .join('\n'), "\n\nLOCAL INSIGHTS:\n").concat(input.gatheredInfo.localInsights.map(function (tip) { return "".concat(tip.category, ": ").concat(tip.tip); }).join('\n'), "\n\nUSER PREFERENCES TO VALIDATE AGAINST:\n- Interests: ").concat(input.formData.interests.join(', '), "\n- Avoid: ").concat(input.formData.avoidances.join(', '), "\n- Travel Experience: ").concat(input.formData.travelExperience, "\n- Trip Vibe: ").concat(input.formData.tripVibe, "\n\nPlease create a detailed day-by-day itinerary that:\n1. Follows the established budget and timing\n2. Incorporates the highest-scored recommendations\n3. Creates logical daily themes and flow\n4. Includes specific times, costs, and practical tips\n5. Validates budget compliance and preference alignment\n6. Provides alternatives for flexibility\n\nMake it inspiring yet practical - something travelers can confidently follow to have an amazing experience.");
    };
    /**
     * Parse AI response into structured formatter output
     */
    FormPutterAgent.prototype.parseFormatterResponse = function (responseText, input) {
        try {
            // Try to parse JSON response
            var jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                var parsed = JSON.parse(jsonMatch[0]);
                if (parsed.finalItinerary && parsed.validationResults) {
                    return parsed;
                }
            }
        }
        catch (error) {
            console.warn('[Formatter Agent] JSON parsing failed, creating fallback itinerary');
        }
        // Fallback: Create basic itinerary structure
        return this.createFallbackItinerary(input);
    };
    /**
     * Create fallback itinerary when AI response parsing fails
     */
    FormPutterAgent.prototype.createFallbackItinerary = function (input) {
        var totalDays = input.architecture.itineraryStructure.totalDays;
        var dailyBudget = Math.floor(input.formData.budget.total / totalDays);
        var departDate = new Date(input.formData.departDate);
        var dailySchedule = Array.from({ length: totalDays }, function (_, i) {
            var currentDate = new Date(departDate);
            currentDate.setDate(departDate.getDate() + i);
            return {
                day: i + 1,
                date: currentDate.getFullYear() +
                    '-' +
                    String(currentDate.getMonth() + 1).padStart(2, '0') +
                    '-' +
                    String(currentDate.getDate()).padStart(2, '0'),
                theme: i === 0
                    ? 'Arrival & Orientation'
                    : i === totalDays - 1
                        ? 'Final Day & Departure'
                        : 'Exploration',
                estimatedBudget: dailyBudget,
                morning: {
                    time: '9:00 AM',
                    activity: 'Morning exploration',
                    location: input.formData.location,
                    cost: '$20-30',
                },
                afternoon: {
                    time: '2:00 PM',
                    activity: 'Afternoon activities',
                    location: input.formData.location,
                    cost: '$30-50',
                },
                evening: {
                    time: '7:00 PM',
                    activity: 'Evening dining and culture',
                    location: input.formData.location,
                    cost: '$40-60',
                },
                meals: {
                    breakfast: 'Local café',
                    lunch: 'Restaurant or food market',
                    dinner: 'Traditional restaurant',
                },
                transportation: 'Walking + local transport',
                accommodation: 'Selected accommodation',
            };
        });
        return {
            finalItinerary: {
                id: "itinerary_".concat(input.workflowId),
                tripOverview: {
                    destination: input.formData.location,
                    duration: "".concat(totalDays, " days"),
                    totalDays: totalDays,
                    totalBudget: input.formData.budget.total,
                    currency: input.formData.budget.currency,
                    tripStyle: input.architecture.planningContext.tripStyle,
                    bestFor: input.architecture.planningContext.experienceGoals,
                },
                dailySchedule: dailySchedule,
                practicalInfo: {
                    budgetBreakdown: {
                        accommodation: input.formData.budget.breakdown.accommodation,
                        food: input.formData.budget.breakdown.food,
                        activities: input.formData.budget.breakdown.activities,
                        transportation: input.formData.budget.breakdown.transportation,
                        miscellaneous: input.formData.budget.breakdown.shopping,
                    },
                    packingTips: ['Comfortable walking shoes', 'Weather-appropriate clothing'],
                    localTips: input.gatheredInfo.localInsights.map(function (tip) { return tip.tip; }),
                    importantInfo: ['Check visa requirements', 'Verify passport validity'],
                    emergencyInfo: ['Keep emergency contacts accessible', 'Know local emergency numbers'],
                },
                alternatives: {
                    rainyDayOptions: ['Museums and galleries', 'Shopping centers', 'Cultural centers'],
                    budgetFriendlySwaps: ['Free walking tours', 'Public parks', 'Local markets'],
                    upgradeOptions: ['Private guides', 'Fine dining', 'Luxury experiences'],
                },
            },
            validationResults: {
                budgetCompliance: true,
                preferencesAlignment: 80,
                logisticalFeasibility: true,
                issues: [],
                suggestions: [
                    'Consider booking accommodations in advance',
                    'Check opening hours for attractions',
                ],
            },
        };
    };
    return FormPutterAgent;
}());
export { FormPutterAgent };
/**
 * Singleton instance for formatter agent
 */
export var formatterAgent = new FormPutterAgent();

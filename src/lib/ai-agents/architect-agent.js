/**
 * Itinerary Architect Agent
 *
 * Constitutional Requirement  async execute(input: ArchitectInput): Promise<ArchitectOutput> {
    console.log('🏗️ [80] Architect Agent: Starting itinerary architecture generation', {
      workflowId: input.workflowId.substring(0, 15) + '...',
      location: input.formData.location,
      budget: input.formData.budget.total,
      travelers: `${input.formData.adults}+${input.formData.children}`
    });

    const startTime = Date.now();

    try {
      const client = aiProviders.getClientForAgent(this.agentType);
      if (!client) {
        console.error('❌ [81] Architect Agent: XAI Grok client not available');
        throw new Error('XAI Grok client not available for architect agent');
      }

      console.log('🤖 [82] Architect Agent: XAI Grok client acquired');

      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(input.formData);

      console.log('📝 [83] Architect Agent: Prompts prepared', {
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length,
        includesLocation: userPrompt.includes(input.formData.location)
      });

      console.log(`🔄 [84] Architect Agent: Generating architecture for workflow ${input.workflowId.substring(0, 15)}...`); Runtime compatibility
 * - Type-safe development with Zod validation
 * - XAI Grok-4-Fast-Reasoning for complex planning
 *
 * Task: T022 - Implement Itinerary Architect agent
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
 * Itinerary Architect Agent
 * Uses XAI Grok for complex reasoning and trip structure planning
 */
var ItineraryArchitectAgent = /** @class */ (function () {
    function ItineraryArchitectAgent() {
        this.agentType = 'architect';
    }
    /**
     * Generate trip structure and framework
     * Creates the foundation for all other agents to build upon
     */
    ItineraryArchitectAgent.prototype.generateArchitecture = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, client, systemPrompt, userPrompt, result, processingTime, architecture, error_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log('🏗️ [80] Architect Agent: Starting itinerary architecture generation', {
                            workflowId: input.workflowId.substring(0, 15) + '...',
                            location: input.formData.location,
                            budget: input.formData.budget.total,
                            travelers: "".concat(input.formData.adults, "+").concat(input.formData.children),
                        });
                        startTime = Date.now();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        client = aiProviders.getClientForAgent(this.agentType);
                        if (!client) {
                            console.error('❌ [81] Architect Agent: XAI Grok client not available');
                            throw new Error('XAI Grok client not available for architect agent');
                        }
                        console.log('🤖 [82] Architect Agent: XAI Grok client acquired');
                        systemPrompt = this.buildSystemPrompt();
                        userPrompt = this.buildUserPrompt(input.formData);
                        console.log('📝 [83] Architect Agent: Prompts prepared', {
                            systemPromptLength: systemPrompt.length,
                            userPromptLength: userPrompt.length,
                            includesLocation: userPrompt.includes(input.formData.location),
                        });
                        console.log("\uD83D\uDD04 [84] Architect Agent: Generating architecture for workflow ".concat(input.workflowId.substring(0, 15), "..."));
                        return [4 /*yield*/, generateText({
                                model: client.client('grok-beta'),
                                system: systemPrompt,
                                prompt: userPrompt,
                                temperature: 0.7,
                            })];
                    case 2:
                        result = _b.sent();
                        processingTime = Date.now() - startTime;
                        architecture = this.parseArchitectureResponse(result.text, input.formData);
                        console.log("[Architect Agent] Completed in ".concat(processingTime, "ms"));
                        return [2 /*return*/, __assign(__assign(__assign({}, architecture), { processingTime: processingTime }), (((_a = result.usage) === null || _a === void 0 ? void 0 : _a.totalTokens) && { tokensUsed: result.usage.totalTokens }))];
                    case 3:
                        error_1 = _b.sent();
                        console.error("[Architect Agent] Failed for workflow ".concat(input.workflowId, ":"), error_1);
                        throw new Error("Architecture generation failed: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Build system prompt for architecture planning
     */
    ItineraryArchitectAgent.prototype.buildSystemPrompt = function () {
        return "You are an expert travel itinerary architect specializing in creating comprehensive trip frameworks.\n\nYour role is to analyze travel preferences and create a detailed structural foundation that other agents will use to populate with specific activities, restaurants, and accommodations.\n\nKey responsibilities:\n1. Analyze the traveler's style, budget, and preferences\n2. Create a logical day-by-day framework with budget allocation\n3. Identify travel phases (arrival, exploration, experiences, departure)\n4. Determine logistical requirements and timing constraints\n5. Set priorities for each phase based on traveler preferences\n\nOutput Format (JSON):\n{\n  \"itineraryStructure\": {\n    \"totalDays\": number,\n    \"dailyBudgetBreakdown\": [\n      {\n        \"day\": number,\n        \"allocatedBudget\": number,\n        \"plannedCategories\": [\"accommodation\", \"food\", \"activities\", \"transportation\"]\n      }\n    ],\n    \"travelPhases\": [\n      {\n        \"phase\": \"arrival\" | \"exploration\" | \"experiences\" | \"departure\",\n        \"days\": [day_numbers],\n        \"focus\": \"brief_description\",\n        \"priorities\": [\"priority1\", \"priority2\"]\n      }\n    ],\n    \"logisticalRequirements\": {\n      \"transportation\": [\"type1\", \"type2\"],\n      \"accommodation\": [\"type1\", \"type2\"],\n      \"reservationNeeds\": [\"item1\", \"item2\"]\n    }\n  },\n  \"planningContext\": {\n    \"tripStyle\": \"description\",\n    \"budgetStrategy\": \"description\", \n    \"timeOptimization\": \"description\",\n    \"experienceGoals\": [\"goal1\", \"goal2\"]\n  }\n}\n\nBe specific, practical, and aligned with the traveler's stated preferences and constraints.";
    };
    /**
     * Build user prompt with travel form data
     */
    ItineraryArchitectAgent.prototype.buildUserPrompt = function (formData) {
        var departDate = new Date(formData.departDate);
        var returnDate = formData.returnDate ? new Date(formData.returnDate) : null;
        var totalDays = formData.plannedDays ||
            (returnDate
                ? Math.ceil((returnDate.getTime() - departDate.getTime()) / (1000 * 60 * 60 * 24))
                : 7);
        return "Plan the architectural framework for this trip:\n\nDESTINATION & TIMING:\n- Location: ".concat(formData.location, "\n- Departure: ").concat(formData.departDate, "\n- Return: ").concat(formData.returnDate || 'Open-ended', "\n- Duration: ").concat(totalDays, " days\n- Group: ").concat(formData.adults, " adult(s)").concat(formData.children > 0 ? ", ".concat(formData.children, " child(ren)") : '', "\n\nBUDGET INFORMATION:\n- Total Budget: ").concat(formData.budget.total, " ").concat(formData.budget.currency, "\n- Accommodation: ").concat(formData.budget.breakdown.accommodation, " ").concat(formData.budget.currency, "\n- Food: ").concat(formData.budget.breakdown.food, " ").concat(formData.budget.currency, "  \n- Activities: ").concat(formData.budget.breakdown.activities, " ").concat(formData.budget.currency, "\n- Transportation: ").concat(formData.budget.breakdown.transportation, " ").concat(formData.budget.currency, "\n- Flexibility: ").concat(formData.budget.flexibility, "\n\nTRAVEL STYLE & PREFERENCES:\n- Pace: ").concat(formData.travelStyle.pace, "\n- Accommodation Type: ").concat(formData.travelStyle.accommodationType, "\n- Dining Preferences: ").concat(formData.travelStyle.diningPreferences, "\n- Activity Level: ").concat(formData.travelStyle.activityLevel, "\n- Cultural Immersion: ").concat(formData.travelStyle.culturalImmersion, "\n\nINTERESTS & ACTIVITIES:\n- Primary Interests: ").concat(formData.interests.join(', '), "\n- Things to Avoid: ").concat(formData.avoidances.join(', ') || 'None specified', "\n- Dietary Restrictions: ").concat(formData.dietaryRestrictions.join(', ') || 'None', "\n- Trip Vibe: ").concat(formData.tripVibe, "\n- Experience Level: ").concat(formData.travelExperience, "\n- Dinner Preference: ").concat(formData.dinnerChoice, "\n\nADDITIONAL SERVICES:\n").concat(Object.entries(formData.additionalServices)
            .filter(function (_a) {
            var _ = _a[0], value = _a[1];
            return value;
        })
            .map(function (_a) {
            var service = _a[0], _ = _a[1];
            return "- ".concat(service.replace('_', ' '), ": Requested");
        })
            .join('\n') || '- No additional services requested', "\n\nCreate a comprehensive architectural framework that maximizes their experience within budget constraints while respecting their travel style and preferences.");
    };
    /**
     * Parse AI response into structured architecture output
     */
    ItineraryArchitectAgent.prototype.parseArchitectureResponse = function (responseText, formData) {
        try {
            // Try to parse JSON response
            var jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                var parsed = JSON.parse(jsonMatch[0]);
                if (parsed.itineraryStructure && parsed.planningContext) {
                    return parsed;
                }
            }
        }
        catch (error) {
            console.warn('[Architect Agent] JSON parsing failed, using fallback structure');
        }
        // Fallback: Create structured response from form data
        return this.createFallbackArchitecture(formData);
    };
    /**
     * Create fallback architecture structure
     * Used when AI response parsing fails
     */
    ItineraryArchitectAgent.prototype.createFallbackArchitecture = function (formData) {
        var totalDays = formData.plannedDays || 7;
        var dailyBudget = Math.floor(formData.budget.total / totalDays);
        var dailyBudgetBreakdown = Array.from({ length: totalDays }, function (_, i) { return ({
            day: i + 1,
            allocatedBudget: dailyBudget,
            plannedCategories: ['accommodation', 'food', 'activities', 'transportation'],
        }); });
        var travelPhases = [
            {
                phase: 'arrival',
                days: [1],
                focus: 'Settle in and explore immediate area',
                priorities: ['accommodation', 'orientation', 'local food'],
            },
            {
                phase: 'exploration',
                days: Array.from({ length: Math.max(1, totalDays - 2) }, function (_, i) { return i + 2; }),
                focus: 'Main activities and experiences',
                priorities: formData.interests.slice(0, 3),
            },
            {
                phase: 'departure',
                days: [totalDays],
                focus: 'Final experiences and departure preparation',
                priorities: ['departure logistics', 'final shopping'],
            },
        ];
        return {
            itineraryStructure: {
                totalDays: totalDays,
                dailyBudgetBreakdown: dailyBudgetBreakdown,
                travelPhases: travelPhases,
                logisticalRequirements: {
                    transportation: ['airport transfer', 'local transport'],
                    accommodation: [formData.travelStyle.accommodationType],
                    reservationNeeds: ['restaurant bookings', 'activity tickets'],
                },
            },
            planningContext: {
                tripStyle: "".concat(formData.travelStyle.pace, " pace with ").concat(formData.travelStyle.culturalImmersion, " cultural immersion"),
                budgetStrategy: "".concat(formData.budget.flexibility, " budget approach"),
                timeOptimization: "".concat(formData.travelStyle.activityLevel, " activity level"),
                experienceGoals: formData.interests.slice(0, 4),
            },
        };
    };
    return ItineraryArchitectAgent;
}());
export { ItineraryArchitectAgent };
/**
 * Singleton instance for architect agent
 */
export var architectAgent = new ItineraryArchitectAgent();

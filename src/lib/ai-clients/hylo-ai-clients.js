/**
 * Hylo AI Clients - Enhanced Setup for Inngest Workflow
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - XAI Grok integration for reasoning tasks
 * - Type-safe development
 *
 * Following architecture structure from migration plan
 */
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
import { xai } from '@ai-sdk/xai';
/**
 * XAI Grok model instances for different tasks
 * Following the existing provider configuration
 */
export var grokModel = xai('grok-beta');
export var grokFastModel = xai('grok-4-fast-reasoning'); // For speed-critical tasks
/**
 * Helper function for generating travel itinerary architecture
 * Used by: Architect Agent in the 4-agent workflow
 */
export var generateTravelArchitecture = function (formData) { return __awaiter(void 0, void 0, void 0, function () {
    var generateText, architecture;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, import('ai')];
            case 1:
                generateText = (_b.sent()).generateText;
                return [4 /*yield*/, generateText({
                        model: grokModel,
                        prompt: "Generate detailed travel itinerary architecture for ".concat(formData.location, " with ").concat(formData.adults, " adults, ").concat(formData.children, " children, budget ").concat(((_a = formData.budget) === null || _a === void 0 ? void 0 : _a.total) || 'flexible', ", travel style: ").concat(formData.travelStyle, ". Include day-by-day structure, key activities, and accommodation recommendations."),
                        temperature: 0.7, // Creative planning
                    })];
            case 2:
                architecture = (_b.sent()).text;
                return [2 /*return*/, architecture];
        }
    });
}); };
/**
 * Helper function for intelligent recommendation filtering
 * Used by: Specialist Agent for ranking and filtering
 */
export var filterRecommendations = function (recommendations, preferences, budget) { return __awaiter(void 0, void 0, void 0, function () {
    var generateText, budgetConstraint, filtered;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, import('ai')];
            case 1:
                generateText = (_a.sent()).generateText;
                budgetConstraint = budget ? "budget: ".concat(budget.total || budget) : 'flexible budget';
                return [4 /*yield*/, generateText({
                        model: grokModel,
                        prompt: "Filter and rank these travel recommendations based on preferences: ".concat(preferences.join(', '), " and ").concat(budgetConstraint, ". Recommendations: ").concat(JSON.stringify(recommendations)),
                        temperature: 0.4, // Balanced for reasoning and consistency
                    })];
            case 2:
                filtered = (_a.sent()).text;
                return [2 /*return*/, filtered];
        }
    });
}); };
/**
 * Helper function for itinerary formatting
 * Used by: Formatter Agent for final output structuring
 */
export var formatItinerary = function (rawData, travelStyle) { return __awaiter(void 0, void 0, void 0, function () {
    var generateText, formatted;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, import('ai')];
            case 1:
                generateText = (_a.sent()).generateText;
                return [4 /*yield*/, generateText({
                        model: grokFastModel, // Use faster model for formatting
                        prompt: "Format this travel data into a beautiful, well-structured itinerary with ".concat(travelStyle, " style. Data: ").concat(JSON.stringify(rawData)),
                        temperature: 0.3, // Low temperature for consistent formatting
                    })];
            case 2:
                formatted = (_a.sent()).text;
                return [2 /*return*/, formatted];
        }
    });
}); };
/**
 * Helper function for gathering web information
 * Used by: Gatherer Agent for research and information collection
 */
export var processGatheredInfo = function (searchResults, location) { return __awaiter(void 0, void 0, void 0, function () {
    var generateText, processed;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, import('ai')];
            case 1:
                generateText = (_a.sent()).generateText;
                return [4 /*yield*/, generateText({
                        model: grokFastModel, // Fast processing for large data
                        prompt: "Process and synthesize this travel information for ".concat(location, ": ").concat(JSON.stringify(searchResults), ". Extract key insights, activities, and recommendations."),
                        temperature: 0.5, // Moderate creativity for synthesis
                    })];
            case 2:
                processed = (_a.sent()).text;
                return [2 /*return*/, processed];
        }
    });
}); };
/**
 * Validate AI providers are available
 * Edge Runtime compatible validation
 */
export var validateAIProviders = function () {
    var requiredKeys = ['XAI_API_KEY'];
    var missing = requiredKeys.filter(function (key) { return !process.env[key]; });
    if (missing.length > 0) {
        console.warn("[AI Clients] Missing API keys: ".concat(missing.join(', ')));
        return false;
    }
    return true;
};

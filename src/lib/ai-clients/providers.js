/**
 * AI Provider Client Setup
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility (no Node.js built-ins)
 * - Type-safe development with strict TypeScript
 * - Multi-LLM provider approach for resilience
 *
 * Task: T021 - Create AI provider client setup
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
import { createXai } from '@ai-sdk/xai';
import { createGroq } from '@ai-sdk/groq';
/**
 * XAI Grok client setup
 * Used for: Itinerary Architect and Information Specialist agents
 */
var createXaiClient = function () {
    var apiKey = process.env['XAI_API_KEY'];
    if (!apiKey) {
        console.warn('[AI Provider] XAI API key not configured');
        return null;
    }
    try {
        var xai = createXai({
            apiKey: apiKey,
            // Configure for Edge Runtime
            baseURL: 'https://api.x.ai/v1',
        });
        return {
            provider: 'xai',
            model: 'grok-beta', // XAI Grok-4-Fast-Reasoning equivalent
            client: xai,
            isAvailable: true,
        };
    }
    catch (error) {
        console.error('[AI Provider] Failed to initialize XAI client:', error);
        return {
            provider: 'xai',
            model: 'grok-beta',
            client: null,
            isAvailable: false,
        };
    }
};
/**
 * Groq client setup
 * Used for: Web Information Gatherer agent (high-speed processing)
 */
var createGroqClient = function () {
    var apiKey = process.env['GROQ_API_KEY'];
    if (!apiKey) {
        console.warn('[AI Provider] Groq API key not configured');
        return null;
    }
    try {
        var groq = createGroq({
            apiKey: apiKey,
            // Configure for Edge Runtime compatibility
            baseURL: 'https://api.groq.com/openai/v1',
        });
        return {
            provider: 'groq',
            model: 'llama3-70b-8192', // Groq Compound equivalent for fast processing
            client: groq,
            isAvailable: true,
        };
    }
    catch (error) {
        console.error('[AI Provider] Failed to initialize Groq client:', error);
        return {
            provider: 'groq',
            model: 'llama3-70b-8192',
            client: null,
            isAvailable: false,
        };
    }
};
/**
 * GPT-OSS client setup (placeholder)
 * Used for: Form Putter agent (formatting and final output)
 *
 * Note: This would connect to an open-source GPT endpoint
 * For now, we'll use Groq as fallback until GPT-OSS endpoint is configured
 */
var createGptOssClient = function () {
    var endpoint = process.env['GPT_OSS_ENDPOINT'];
    var apiKey = process.env['GPT_OSS_API_KEY'];
    if (!endpoint || !apiKey) {
        console.warn('[AI Provider] GPT-OSS endpoint not configured, using Groq fallback');
        return createGroqClient(); // Fallback to Groq
    }
    // TODO: Implement GPT-OSS client when endpoint is available
    console.log('[AI Provider] GPT-OSS client configuration pending');
    return createGroqClient(); // Fallback to Groq for now
};
/**
 * AI Providers Manager
 * Manages multiple LLM providers with failover support
 */
var AIProvidersManager = /** @class */ (function () {
    function AIProvidersManager() {
        this.providers = new Map();
        this.initialized = false;
        this.initialize();
    }
    /**
     * Initialize all AI provider clients
     * Edge Runtime compatible initialization
     */
    AIProvidersManager.prototype.initialize = function () {
        console.log('🤖 [50] AI Providers: Starting initialization of all providers');
        try {
            // Initialize XAI Grok client
            console.log('🔧 [51] AI Providers: Initializing XAI Grok client');
            var xaiClient = createXaiClient();
            if (xaiClient) {
                this.providers.set('xai', xaiClient);
                console.log('✅ [52] AI Providers: XAI Grok client initialized');
            }
            else {
                console.log('⚠️ [53] AI Providers: XAI Grok client not available (missing API key)');
            }
            // Initialize Groq client
            console.log('🔧 [54] AI Providers: Initializing Groq client');
            var groqClient = createGroqClient();
            if (groqClient) {
                this.providers.set('groq', groqClient);
                console.log('✅ [55] AI Providers: Groq client initialized');
            }
            else {
                console.log('⚠️ [56] AI Providers: Groq client not available (missing API key)');
            }
            // Initialize GPT-OSS client (or fallback)
            console.log('🔧 [57] AI Providers: Initializing GPT-OSS client');
            var gptOssClient = createGptOssClient();
            if (gptOssClient) {
                this.providers.set('gpt-oss', gptOssClient);
                console.log('✅ [58] AI Providers: GPT-OSS client initialized');
            }
            else {
                console.log('⚠️ [59] AI Providers: GPT-OSS client not available (missing API key)');
            }
            this.initialized = true;
            console.log("\uD83C\uDF89 [60] AI Providers: Initialization completed", {
                totalProviders: this.providers.size,
                providers: Array.from(this.providers.keys()),
            });
        }
        catch (error) {
            console.error('💥 [61] AI Providers: Initialization failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                providersInitialized: this.providers.size,
            });
            this.initialized = false;
        }
    };
    /**
     * Get client for specific provider
     */
    AIProvidersManager.prototype.getProvider = function (provider) {
        var client = this.providers.get(provider);
        if (!client) {
            console.error("[AI Provider] Provider ".concat(provider, " not available"));
            return null;
        }
        if (!client.isAvailable) {
            console.error("[AI Provider] Provider ".concat(provider, " is not available"));
            return null;
        }
        return client;
    };
    /**
     * Get client for specific agent type
     * Maps agents to optimal LLM providers
     */
    AIProvidersManager.prototype.getClientForAgent = function (agentType) {
        var providerMap = {
            architect: 'xai', // XAI Grok for reasoning and planning
            gatherer: 'groq', // Groq for fast information processing
            specialist: 'xai', // XAI Grok for analysis and filtering
            formatter: 'gpt-oss', // GPT-OSS for formatting (fallback to Groq)
        };
        var provider = providerMap[agentType];
        if (!provider) {
            console.error("[AI Provider] No provider mapped for agent type: ".concat(agentType));
            return null;
        }
        return this.getProvider(provider);
    };
    /**
     * Check if providers are ready
     */
    AIProvidersManager.prototype.isReady = function () {
        return this.initialized && this.providers.size > 0;
    };
    /**
     * Get available providers list
     */
    AIProvidersManager.prototype.getAvailableProviders = function () {
        var _this = this;
        return Array.from(this.providers.keys()).filter(function (key) { var _a; return (_a = _this.providers.get(key)) === null || _a === void 0 ? void 0 : _a.isAvailable; });
    };
    /**
     * Health check for all providers
     */
    AIProvidersManager.prototype.healthCheck = function () {
        return __awaiter(this, void 0, void 0, function () {
            var health, _i, _a, _b, key, client;
            return __generator(this, function (_c) {
                health = {};
                for (_i = 0, _a = this.providers; _i < _a.length; _i++) {
                    _b = _a[_i], key = _b[0], client = _b[1];
                    try {
                        // Simple availability check - providers initialized and have valid configuration
                        health[key] = client.isAvailable && client.client !== null;
                    }
                    catch (error) {
                        console.error("[AI Provider] Health check failed for ".concat(key, ":"), error);
                        health[key] = false;
                    }
                }
                return [2 /*return*/, health];
            });
        });
    };
    /**
     * Retry logic for failed AI requests
     * Constitutional requirement: graceful error handling
     */
    AIProvidersManager.prototype.withRetry = function (operation_1) {
        return __awaiter(this, arguments, void 0, function (operation, maxRetries, delay) {
            var lastError, _loop_1, attempt, state_1;
            if (maxRetries === void 0) { maxRetries = 3; }
            if (delay === void 0) { delay = 1000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        lastError = null;
                        _loop_1 = function (attempt) {
                            var _b, error_1;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _c.trys.push([0, 2, , 5]);
                                        _b = {};
                                        return [4 /*yield*/, operation()];
                                    case 1: return [2 /*return*/, (_b.value = _c.sent(), _b)];
                                    case 2:
                                        error_1 = _c.sent();
                                        lastError = error_1;
                                        console.warn("[AI Provider] Attempt ".concat(attempt, "/").concat(maxRetries, " failed:"), error_1);
                                        if (!(attempt < maxRetries)) return [3 /*break*/, 4];
                                        // Exponential backoff delay
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay * Math.pow(2, attempt - 1)); })];
                                    case 3:
                                        // Exponential backoff delay
                                        _c.sent();
                                        _c.label = 4;
                                    case 4: return [3 /*break*/, 5];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        };
                        attempt = 1;
                        _a.label = 1;
                    case 1:
                        if (!(attempt <= maxRetries)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(attempt)];
                    case 2:
                        state_1 = _a.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        _a.label = 3;
                    case 3:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 4: throw lastError || new Error('All retry attempts failed');
                }
            });
        });
    };
    return AIProvidersManager;
}());
export { AIProvidersManager };
/**
 * Singleton instance for AI providers
 * Edge Runtime compatible
 */
export var aiProviders = new AIProvidersManager();
/**
 * Environment validation for AI providers
 * Ensures required API keys are configured
 */
export var validateAIProviders = function () {
    var requiredKeys = ['XAI_API_KEY', 'GROQ_API_KEY'];
    var missing = requiredKeys.filter(function (key) { return !process.env[key]; });
    if (missing.length > 0) {
        console.error("[AI Provider] Missing required environment variables: ".concat(missing.join(', ')));
        return false;
    }
    console.log('[AI Provider] All required API keys configured');
    return true;
};

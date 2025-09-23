/**
 * Environment Variable Validation Endpoint
 *
 * Tests all required API keys and service connections for AI workflow
 * Constitutional requirement: All API endpoints must use Edge Runtime
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
// Export Edge Runtime configuration (constitutional requirement)
export var config = {
    runtime: 'edge',
};
/**
 * Test XAI API connectivity
 */
function testXAIConnection() {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, response, responseTime, error_1, responseTime;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = Date.now();
                    console.log('🤖 Testing XAI Grok API connection...');
                    if (!process.env.XAI_API_KEY) {
                        console.log('⚠️ XAI API key missing');
                        return [2 /*return*/, {
                                service: 'XAI Grok',
                                status: 'missing',
                                message: 'XAI_API_KEY environment variable not set',
                            }];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    console.log('📡 Making request to XAI API...');
                    return [4 /*yield*/, fetch('https://api.x.ai/v1/models', {
                            method: 'GET',
                            headers: {
                                Authorization: "Bearer ".concat(process.env.XAI_API_KEY),
                                'Content-Type': 'application/json',
                            },
                            signal: AbortSignal.timeout(5000), // 5 second timeout
                        })];
                case 2:
                    response = _a.sent();
                    responseTime = Date.now() - startTime;
                    console.log("\uD83D\uDCCA XAI API response: ".concat(response.status, " (").concat(responseTime, "ms)"));
                    if (response.ok) {
                        console.log('✅ XAI API connection successful');
                        return [2 /*return*/, {
                                service: 'XAI Grok',
                                status: 'connected',
                                message: 'API key valid and service accessible',
                                responseTime: responseTime,
                            }];
                    }
                    else {
                        console.log("\u274C XAI API failed with status: ".concat(response.status));
                        return [2 /*return*/, {
                                service: 'XAI Grok',
                                status: 'failed',
                                message: "API responded with status: ".concat(response.status),
                                responseTime: responseTime,
                            }];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    responseTime = Date.now() - startTime;
                    console.error("\uD83D\uDCA5 XAI API connection failed:", error_1);
                    return [2 /*return*/, {
                            service: 'XAI Grok',
                            status: 'failed',
                            message: "Connection failed: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'),
                            responseTime: responseTime,
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Test Groq API connectivity
 */
function testGroqConnection() {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, response, responseTime, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = Date.now();
                    if (!process.env.GROQ_API_KEY) {
                        return [2 /*return*/, {
                                service: 'Groq',
                                status: 'missing',
                                message: 'GROQ_API_KEY environment variable not set',
                            }];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch('https://api.groq.com/openai/v1/models', {
                            method: 'GET',
                            headers: {
                                Authorization: "Bearer ".concat(process.env.GROQ_API_KEY),
                                'Content-Type': 'application/json',
                            },
                            signal: AbortSignal.timeout(5000),
                        })];
                case 2:
                    response = _a.sent();
                    responseTime = Date.now() - startTime;
                    if (response.ok) {
                        return [2 /*return*/, {
                                service: 'Groq',
                                status: 'connected',
                                message: 'API key valid and service accessible',
                                responseTime: responseTime,
                            }];
                    }
                    else {
                        return [2 /*return*/, {
                                service: 'Groq',
                                status: 'failed',
                                message: "API responded with status: ".concat(response.status),
                                responseTime: responseTime,
                            }];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    return [2 /*return*/, {
                            service: 'Groq',
                            status: 'failed',
                            message: "Connection failed: ".concat(error_2 instanceof Error ? error_2.message : 'Unknown error'),
                            responseTime: Date.now() - startTime,
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Test Upstash Redis connectivity
 */
function testRedisConnection() {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, response, responseTime, error_3, responseTime;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = Date.now();
                    console.log('🏗️ Testing Redis/KV connectivity...');
                    // Check for your specific Redis/KV variable names
                    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
                        console.log('⚠️ Redis/KV credentials missing');
                        return [2 /*return*/, {
                                service: 'Redis/KV Storage',
                                status: 'missing',
                                message: 'KV_REST_API_URL or KV_REST_API_TOKEN not set',
                            }];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    console.log('📡 Testing Redis/KV connection...');
                    console.log("\uD83D\uDD17 Using URL: ".concat(process.env.KV_REST_API_URL));
                    return [4 /*yield*/, fetch("".concat(process.env.KV_REST_API_URL, "/ping"), {
                            method: 'GET',
                            headers: {
                                Authorization: "Bearer ".concat(process.env.KV_REST_API_TOKEN),
                            },
                            signal: AbortSignal.timeout(5000),
                        })];
                case 2:
                    response = _a.sent();
                    responseTime = Date.now() - startTime;
                    console.log("\uD83D\uDCCA Redis/KV response: ".concat(response.status, " (").concat(responseTime, "ms)"));
                    if (response.ok) {
                        console.log('✅ Redis/KV connection successful');
                        return [2 /*return*/, {
                                service: 'Redis/KV Storage',
                                status: 'connected',
                                message: 'KV instance accessible via REST API',
                                responseTime: responseTime,
                            }];
                    }
                    else {
                        console.log("\u274C Redis/KV failed with status: ".concat(response.status));
                        return [2 /*return*/, {
                                service: 'Redis/KV Storage',
                                status: 'failed',
                                message: "KV responded with status: ".concat(response.status),
                                responseTime: responseTime,
                            }];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _a.sent();
                    responseTime = Date.now() - startTime;
                    console.error("\uD83D\uDCA5 Redis/KV connection failed:", error_3);
                    return [2 /*return*/, {
                            service: 'Redis/KV Storage',
                            status: 'failed',
                            message: "Connection failed: ".concat(error_3 instanceof Error ? error_3.message : 'Unknown error'),
                            responseTime: responseTime,
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Test Upstash Vector connectivity
 */
function testVectorConnection() {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, response, responseTime, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = Date.now();
                    if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
                        return [2 /*return*/, {
                                service: 'Upstash Vector',
                                status: 'missing',
                                message: 'UPSTASH_VECTOR_REST_URL or UPSTASH_VECTOR_REST_TOKEN not set',
                            }];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch("".concat(process.env.UPSTASH_VECTOR_REST_URL, "/info"), {
                            method: 'GET',
                            headers: {
                                Authorization: "Bearer ".concat(process.env.UPSTASH_VECTOR_REST_TOKEN),
                            },
                            signal: AbortSignal.timeout(5000),
                        })];
                case 2:
                    response = _a.sent();
                    responseTime = Date.now() - startTime;
                    if (response.ok) {
                        return [2 /*return*/, {
                                service: 'Upstash Vector',
                                status: 'connected',
                                message: 'Vector DB instance accessible',
                                responseTime: responseTime,
                            }];
                    }
                    else {
                        return [2 /*return*/, {
                                service: 'Upstash Vector',
                                status: 'failed',
                                message: "Vector DB responded with status: ".concat(response.status),
                                responseTime: responseTime,
                            }];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _a.sent();
                    return [2 /*return*/, {
                            service: 'Upstash Vector',
                            status: 'failed',
                            message: "Connection failed: ".concat(error_4 instanceof Error ? error_4.message : 'Unknown error'),
                            responseTime: Date.now() - startTime,
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Test Inngest environment variables (no API call needed)
 */
function testInngestConnection() {
    console.log('⚙️ Checking Inngest workflow environment variables...');
    var hasEventKey = Boolean(process.env.INNGEST_EVENT_KEY);
    var hasSigningKey = Boolean(process.env.INNGEST_SIGNING_KEY);
    console.log("\uD83D\uDD11 INNGEST_EVENT_KEY: ".concat(hasEventKey ? '✅ SET' : '❌ MISSING'));
    console.log("\uD83D\uDD11 INNGEST_SIGNING_KEY: ".concat(hasSigningKey ? '✅ SET' : '❌ MISSING'));
    if (hasEventKey && hasSigningKey) {
        console.log('✅ Inngest workflow keys configured');
        return {
            service: 'Inngest Workflow',
            status: 'connected',
            message: 'Both INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY are configured',
        };
    }
    else {
        var missingKeys = [];
        if (!hasEventKey)
            missingKeys.push('INNGEST_EVENT_KEY');
        if (!hasSigningKey)
            missingKeys.push('INNGEST_SIGNING_KEY');
        console.log("\u274C Inngest missing keys: ".concat(missingKeys.join(', ')));
        return {
            service: 'Inngest Workflow',
            status: 'missing',
            message: "Missing environment variables: ".concat(missingKeys.join(', ')),
        };
    }
}
/**
 * Test search provider API keys (basic validation)
 */
function testSearchProviders() {
    var providers = [
        { name: 'Tavily AI Search', key: 'TAVILY_API_KEY' },
        { name: 'Exa AI Search', key: 'EXA_API_KEY' },
        { name: 'SERP API', key: 'SERP_API_KEY' },
    ];
    return providers.map(function (provider) {
        var hasKey = Boolean(process.env[provider.key]);
        console.log("\uD83D\uDD0D ".concat(provider.name, ": ").concat(hasKey ? '✅ SET' : '❌ MISSING'));
        return {
            service: provider.name,
            status: hasKey ? 'connected' : 'missing',
            message: hasKey ? "".concat(provider.key, " is set") : "".concat(provider.key, " environment variable not set"),
        };
    });
}
/**
 * Test additional environment variables (Redis/KV and AI backup keys)
 */
function testAdditionalEnvVars() {
    console.log('🔧 Testing additional environment variables...');
    var additionalVars = [
        // AI Provider backup keys
        { name: 'XAI Grok (Backup)', key: 'XAI_API_KEY_2' },
        { name: 'Groq (Backup)', key: 'GROQ_API_KEY_2' },
        // Your specific Redis/KV configuration
        { name: 'KV REST API URL', key: 'KV_REST_API_URL' },
        { name: 'KV URL', key: 'KV_URL' },
        { name: 'Redis URL', key: 'REDIS_URL' },
        // Public URLs
        { name: 'Public API URL', key: 'NEXT_PUBLIC_API_URL' },
        { name: 'Public WebSocket URL', key: 'NEXT_PUBLIC_WS_URL' },
    ];
    return additionalVars.map(function (envVar) {
        var hasKey = Boolean(process.env[envVar.key]);
        console.log("\uD83D\uDD27 ".concat(envVar.name, ": ").concat(hasKey ? '✅ SET' : '❌ MISSING'));
        return {
            service: envVar.name,
            status: hasKey ? 'connected' : 'missing',
            message: hasKey
                ? "".concat(envVar.key, " is configured")
                : "".concat(envVar.key, " environment variable not set"),
        };
    });
}
/**
 * GET /api/validate-env - Validate all environment variables and connections
 */
export default function handler(req) {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, _a, xaiResult, groqResult, redisResult, vectorResult, inngestResult, searchResults, additionalResults, allResults, totalTests, passed, failed, response, processingTime, error_5, processingTime, errorResponse;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    startTime = Date.now();
                    // DEBUG: Log endpoint activation
                    console.log('🔧 Environment Validation Endpoint - ACTIVATED');
                    console.log('📊 Request details:', {
                        method: req.method,
                        url: req.url,
                        timestamp: new Date().toISOString(),
                        userAgent: ((_b = req.headers.get('user-agent')) === null || _b === void 0 ? void 0 : _b.substring(0, 50)) + '...',
                    });
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, , 4]);
                    console.log('🧪 Starting comprehensive environment validation...');
                    // Run all validation tests
                    console.log('🚀 Testing AI provider connections...');
                    return [4 /*yield*/, Promise.all([
                            testXAIConnection(),
                            testGroqConnection(),
                            testRedisConnection(),
                            testVectorConnection(),
                        ])];
                case 2:
                    _a = _d.sent(), xaiResult = _a[0], groqResult = _a[1], redisResult = _a[2], vectorResult = _a[3];
                    console.log('⚙️ Checking Inngest workflow configuration...');
                    inngestResult = testInngestConnection();
                    console.log('🔍 Testing search provider configurations...');
                    searchResults = testSearchProviders();
                    console.log('🔧 Testing additional environment variables...');
                    additionalResults = testAdditionalEnvVars();
                    allResults = __spreadArray(__spreadArray([
                        xaiResult,
                        groqResult,
                        redisResult,
                        vectorResult,
                        inngestResult
                    ], searchResults, true), additionalResults, true);
                    // Log individual results
                    allResults.forEach(function (result, index) {
                        var status = result.status === 'connected' ? '✅' : result.status === 'failed' ? '❌' : '⚠️';
                        console.log("".concat(status, " ").concat(result.service, ":"), {
                            status: result.status,
                            message: result.message,
                            responseTime: result.responseTime ? "".concat(result.responseTime, "ms") : 'N/A',
                        });
                    });
                    totalTests = allResults.length;
                    passed = allResults.filter(function (r) { return r.status === 'connected'; }).length;
                    failed = totalTests - passed;
                    console.log('📈 Validation Summary:', {
                        total: totalTests,
                        passed: passed,
                        failed: failed,
                        successRate: "".concat(Math.round((passed / totalTests) * 100), "%"),
                    });
                    response = {
                        success: failed === 0,
                        timestamp: new Date().toISOString(),
                        totalTests: totalTests,
                        passed: passed,
                        failed: failed,
                        results: allResults,
                    };
                    processingTime = Date.now() - startTime;
                    console.log('⏱️ Environment validation completed in:', processingTime + 'ms');
                    console.log('🎯 Overall validation result:', response.success ? '✅ SUCCESS' : '❌ FAILED');
                    return [2 /*return*/, new Response(JSON.stringify(response), {
                            status: response.success ? 200 : 503,
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Response-Time': "".concat(processingTime, "ms"),
                                'X-Edge-Runtime': 'true',
                                'Access-Control-Allow-Origin': '*',
                                'Cache-Control': 'no-cache, no-store, must-revalidate',
                            },
                        })];
                case 3:
                    error_5 = _d.sent();
                    processingTime = Date.now() - startTime;
                    console.error('💥 Environment validation FAILED with error:', error_5);
                    console.error('🔍 Error details:', {
                        name: error_5 instanceof Error ? error_5.name : 'Unknown',
                        message: error_5 instanceof Error ? error_5.message : 'Unknown error',
                        stack: error_5 instanceof Error ? (_c = error_5.stack) === null || _c === void 0 ? void 0 : _c.substring(0, 500) : 'No stack trace',
                        processingTime: processingTime + 'ms',
                    });
                    errorResponse = {
                        success: false,
                        timestamp: new Date().toISOString(),
                        totalTests: 0,
                        passed: 0,
                        failed: 1,
                        results: [
                            {
                                service: 'Validation System',
                                status: 'failed',
                                message: "Validation system error: ".concat(error_5 instanceof Error ? error_5.message : 'Unknown error'),
                            },
                        ],
                    };
                    return [2 /*return*/, new Response(JSON.stringify(errorResponse), {
                            status: 500,
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Edge-Runtime': 'true',
                                'Access-Control-Allow-Origin': '*',
                            },
                        })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Handle HTTP methods
 */
export function GET(req) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, handler(req)];
        });
    });
}
export function OPTIONS(req) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Response(null, {
                    status: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
                    },
                })];
        });
    });
}

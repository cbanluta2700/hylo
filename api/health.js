/**
 * Health Check Endpoint for AI-Powered Itinerary Generation
 *
 * Verifies Edge Runtime compatibility and environment configuration
 * Constitutional requirement: All API endpoints must use Edge Runtime
 *
 * Compatible with Vercel Edge Runtime and Web APIs
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
// Export Edge Runtime configuration (constitutional requirement)
export var config = {
    runtime: 'edge',
};
/**
 * Test API endpoint health
 */
function testApiEndpoint(baseUrl_1, endpoint_1) {
    return __awaiter(this, arguments, void 0, function (baseUrl, endpoint, testMethod, testData) {
        var startTime, fullUrl, options, response, responseTime, error_1, responseTime;
        if (testMethod === void 0) { testMethod = 'GET'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = Date.now();
                    fullUrl = "".concat(baseUrl).concat(endpoint);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    options = {
                        method: testMethod,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    };
                    if (testMethod === 'POST' && testData) {
                        options.body = JSON.stringify(testData);
                    }
                    return [4 /*yield*/, fetch(fullUrl, options)];
                case 2:
                    response = _a.sent();
                    responseTime = Date.now() - startTime;
                    return [2 /*return*/, {
                            endpoint: endpoint,
                            status: response.status < 400 ? 'healthy' : 'unhealthy',
                            responseTime: responseTime,
                            statusCode: response.status,
                        }];
                case 3:
                    error_1 = _a.sent();
                    responseTime = Date.now() - startTime;
                    return [2 /*return*/, {
                            endpoint: endpoint,
                            status: 'unhealthy',
                            responseTime: responseTime,
                            error: error_1 instanceof Error ? error_1.message : 'Unknown error',
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Check all API endpoints health
 */
function checkApiEndpoints(baseUrl) {
    return __awaiter(this, void 0, void 0, function () {
        var endpoints, basicEndpoints, _i, basicEndpoints_1, _a, path, method, result, itineraryEndpoints, _b, itineraryEndpoints_1, _c, path, method, testData, result, allHealthy;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log('🔍 Testing API endpoints health...');
                    endpoints = [];
                    basicEndpoints = [
                        { path: '/api/validate-env', method: 'GET' },
                        { path: '/api/inngest', method: 'GET' },
                    ];
                    _i = 0, basicEndpoints_1 = basicEndpoints;
                    _d.label = 1;
                case 1:
                    if (!(_i < basicEndpoints_1.length)) return [3 /*break*/, 4];
                    _a = basicEndpoints_1[_i], path = _a.path, method = _a.method;
                    console.log("\uD83D\uDCE1 Testing ".concat(method, " ").concat(path, "..."));
                    return [4 /*yield*/, testApiEndpoint(baseUrl, path, method)];
                case 2:
                    result = _d.sent();
                    endpoints.push(result);
                    console.log("".concat(result.status === 'healthy' ? '✅' : '❌', " ").concat(path, ": ").concat(result.statusCode, " (").concat(result.responseTime, "ms)"));
                    _d.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    itineraryEndpoints = [
                        {
                            path: '/api/itinerary/generate',
                            method: 'POST',
                            testData: {
                                location: 'test-location',
                                departDate: '2025-10-01',
                                returnDate: '2025-10-05',
                                budget: 1000,
                                adults: 2,
                                flexibleDates: false,
                            },
                        },
                        { path: '/api/itinerary/get-itinerary?workflowId=test-id', method: 'GET' },
                        { path: '/api/itinerary/progress-simple', method: 'GET' },
                    ];
                    _b = 0, itineraryEndpoints_1 = itineraryEndpoints;
                    _d.label = 5;
                case 5:
                    if (!(_b < itineraryEndpoints_1.length)) return [3 /*break*/, 8];
                    _c = itineraryEndpoints_1[_b], path = _c.path, method = _c.method, testData = _c.testData;
                    console.log("\uD83D\uDCE1 Testing ".concat(method, " ").concat(path, "..."));
                    return [4 /*yield*/, testApiEndpoint(baseUrl, path, method, testData)];
                case 6:
                    result = _d.sent();
                    endpoints.push(result);
                    console.log("".concat(result.status === 'healthy' ? '✅' : '❌', " ").concat(path, ": ").concat(result.statusCode || 'ERROR', " (").concat(result.responseTime, "ms)").concat(result.error ? " - ".concat(result.error) : ''));
                    _d.label = 7;
                case 7:
                    _b++;
                    return [3 /*break*/, 5];
                case 8:
                    allHealthy = endpoints.every(function (ep) { return ep.status === 'healthy'; });
                    console.log("\uD83C\uDFAF API endpoints health: ".concat(allHealthy ? '✅ ALL HEALTHY' : '❌ SOME UNHEALTHY'));
                    console.log("\uD83D\uDCCA Summary: ".concat(endpoints.filter(function (ep) { return ep.status === 'healthy'; }).length, "/").concat(endpoints.length, " endpoints healthy"));
                    return [2 /*return*/, {
                            success: allHealthy,
                            endpoints: endpoints,
                        }];
            }
        });
    });
}
/**
 * Check environment variables availability
 */
function checkEnvironmentVariables() {
    var required = [
        'XAI_API_KEY',
        'GROQ_API_KEY',
        'INNGEST_EVENT_KEY',
        // User's specific Upstash Redis/KV configuration
        'KV_REST_API_URL',
        'KV_REST_API_TOKEN',
        // Upstash Vector Database
        'UPSTASH_VECTOR_REST_URL',
        'UPSTASH_VECTOR_REST_TOKEN',
        'TAVILY_API_KEY',
        'EXA_API_KEY',
        'SERP_API_KEY',
    ];
    var missing = [];
    for (var _i = 0, required_1 = required; _i < required_1.length; _i++) {
        var varName = required_1[_i];
        if (!process.env[varName]) {
            missing.push(varName);
        }
    }
    return {
        success: missing.length === 0,
        missing: missing,
    };
}
/**
 * Verify Edge Runtime environment
 */
function checkEdgeRuntime() {
    // In Edge Runtime, these should be undefined
    var nodeBuiltins = [
        typeof require,
        typeof process.platform,
        typeof process.arch,
        typeof __dirname,
        typeof __filename,
    ];
    // Check if Web APIs are available (Edge Runtime feature)
    var webApis = [
        typeof fetch,
        typeof Request,
        typeof Response,
        typeof Headers,
        typeof URL,
        typeof crypto,
    ];
    // All Node.js built-ins should be undefined or restricted
    var nodeBuiltinsRestricted = nodeBuiltins.every(function (type) { return type === 'undefined' || type === 'object'; });
    // All Web APIs should be available
    var webApisAvailable = webApis.every(function (type) { return type === 'function' || type === 'object'; });
    return nodeBuiltinsRestricted && webApisAvailable;
}
/**
 * GET /api/health - Health check endpoint
 * Web API compatible handler for Vercel Edge Runtime
 */
export default function handler(req) {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, url, baseUrl, edgeRuntimeCheck, envCheck, aiProvidersCheck, stateManagementCheck, searchProvidersCheck, apiEndpointsCheck, allChecksPass, response, unhealthyEndpoints, processingTime, error_2, processingTime, errorResponse;
        var _a, _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    startTime = Date.now();
                    // DEBUG: Log endpoint activation
                    console.log('🏥 Health Check Endpoint - ACTIVATED');
                    console.log('📊 Request details:', {
                        method: req.method,
                        url: req.url,
                        timestamp: new Date().toISOString(),
                        userAgent: ((_a = req.headers.get('user-agent')) === null || _a === void 0 ? void 0 : _a.substring(0, 50)) + '...',
                    });
                    url = new URL(req.url);
                    baseUrl = "".concat(url.protocol, "//").concat(url.host);
                    _h.label = 1;
                case 1:
                    _h.trys.push([1, 3, , 4]);
                    console.log('🔍 Starting health checks...');
                    edgeRuntimeCheck = checkEdgeRuntime();
                    console.log('⚡ Edge Runtime check:', edgeRuntimeCheck ? '✅ PASS' : '❌ FAIL');
                    envCheck = checkEnvironmentVariables();
                    console.log('🔧 Environment variables check:', {
                        success: envCheck.success ? '✅ PASS' : '❌ FAIL',
                        missing: envCheck.missing.length,
                        missingVars: envCheck.missing,
                    });
                    aiProvidersCheck = Boolean(process.env.XAI_API_KEY && process.env.GROQ_API_KEY);
                    console.log('🤖 AI providers check:', aiProvidersCheck ? '✅ PASS' : '❌ FAIL', {
                        xaiKey: process.env.XAI_API_KEY ? 'SET' : 'MISSING',
                        groqKey: process.env.GROQ_API_KEY ? 'SET' : 'MISSING',
                    });
                    stateManagementCheck = Boolean(process.env.KV_REST_API_URL &&
                        process.env.KV_REST_API_TOKEN &&
                        process.env.UPSTASH_VECTOR_REST_URL &&
                        process.env.UPSTASH_VECTOR_REST_TOKEN);
                    console.log('🗄️ State management check:', stateManagementCheck ? '✅ PASS' : '❌ FAIL', {
                        kvUrl: process.env.KV_REST_API_URL ? 'SET' : 'MISSING',
                        kvToken: process.env.KV_REST_API_TOKEN ? 'SET' : 'MISSING',
                        vectorUrl: process.env.UPSTASH_VECTOR_REST_URL ? 'SET' : 'MISSING',
                        vectorToken: process.env.UPSTASH_VECTOR_REST_TOKEN ? 'SET' : 'MISSING',
                    });
                    searchProvidersCheck = Boolean(process.env.TAVILY_API_KEY && process.env.EXA_API_KEY && process.env.SERP_API_KEY);
                    console.log('🔍 Search providers check:', searchProvidersCheck ? '✅ PASS' : '❌ FAIL', {
                        tavilyKey: process.env.TAVILY_API_KEY ? 'SET' : 'MISSING',
                        exaKey: process.env.EXA_API_KEY ? 'SET' : 'MISSING',
                        serpKey: process.env.SERP_API_KEY ? 'SET' : 'MISSING',
                    });
                    // API endpoints health check
                    console.log('🔍 Starting API endpoints health check...');
                    return [4 /*yield*/, checkApiEndpoints(baseUrl)];
                case 2:
                    apiEndpointsCheck = _h.sent();
                    console.log('📡 API endpoints check:', apiEndpointsCheck.success ? '✅ PASS' : '❌ FAIL');
                    allChecksPass = edgeRuntimeCheck &&
                        envCheck.success &&
                        aiProvidersCheck &&
                        stateManagementCheck &&
                        searchProvidersCheck &&
                        apiEndpointsCheck.success;
                    console.log('🎯 Overall health status:', allChecksPass ? '✅ HEALTHY' : '❌ UNHEALTHY');
                    response = {
                        status: allChecksPass ? 'healthy' : 'unhealthy',
                        timestamp: new Date().toISOString(),
                        version: '1.0.0',
                        environment: process.env.NODE_ENV || 'unknown',
                        checks: {
                            edgeRuntime: edgeRuntimeCheck,
                            environmentVariables: envCheck.success,
                            aiProviders: aiProvidersCheck,
                            stateManagement: stateManagementCheck,
                            searchProviders: searchProvidersCheck,
                            apiEndpoints: apiEndpointsCheck.success,
                        },
                        apiEndpoints: apiEndpointsCheck.endpoints,
                    };
                    // Add details if there are issues
                    if (!allChecksPass) {
                        console.log('⚠️ Health check issues detected');
                        response.details = {
                            missingVars: envCheck.missing,
                            errors: [],
                        };
                        if (!edgeRuntimeCheck) {
                            (_b = response.details.errors) === null || _b === void 0 ? void 0 : _b.push('Edge Runtime environment not detected');
                            console.log('❌ Edge Runtime not detected');
                        }
                        if (!aiProvidersCheck) {
                            (_c = response.details.errors) === null || _c === void 0 ? void 0 : _c.push('AI provider API keys missing');
                            console.log('❌ AI provider keys missing');
                        }
                        if (!stateManagementCheck) {
                            (_d = response.details.errors) === null || _d === void 0 ? void 0 : _d.push('State management configuration incomplete');
                            console.log('❌ State management config incomplete');
                        }
                        if (!searchProvidersCheck) {
                            (_e = response.details.errors) === null || _e === void 0 ? void 0 : _e.push('Search provider API keys missing');
                            console.log('❌ Search provider keys missing');
                        }
                        if (!apiEndpointsCheck.success) {
                            unhealthyEndpoints = apiEndpointsCheck.endpoints
                                .filter(function (ep) { return ep.status === 'unhealthy'; })
                                .map(function (ep) { return ep.endpoint; });
                            (_f = response.details.errors) === null || _f === void 0 ? void 0 : _f.push("Unhealthy API endpoints: ".concat(unhealthyEndpoints.join(', ')));
                            console.log('❌ API endpoints unhealthy:', unhealthyEndpoints);
                        }
                    }
                    else {
                        console.log('🎉 All health checks PASSED!');
                    }
                    processingTime = Date.now() - startTime;
                    console.log('⏱️ Health check completed in:', processingTime + 'ms');
                    return [2 /*return*/, new Response(JSON.stringify(response), {
                            status: allChecksPass ? 200 : 503,
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Response-Time': "".concat(processingTime, "ms"),
                                'Cache-Control': 'no-cache, no-store, must-revalidate',
                                'X-Edge-Runtime': 'true',
                                'Access-Control-Allow-Origin': '*',
                            },
                        })];
                case 3:
                    error_2 = _h.sent();
                    processingTime = Date.now() - startTime;
                    console.error('💥 Health check FAILED with error:', error_2);
                    console.error('🔍 Error details:', {
                        name: error_2 instanceof Error ? error_2.name : 'Unknown',
                        message: error_2 instanceof Error ? error_2.message : 'Unknown error',
                        stack: error_2 instanceof Error ? (_g = error_2.stack) === null || _g === void 0 ? void 0 : _g.substring(0, 500) : 'No stack trace',
                        processingTime: processingTime + 'ms',
                    });
                    errorResponse = {
                        status: 'unhealthy',
                        timestamp: new Date().toISOString(),
                        version: '1.0.0',
                        environment: process.env.NODE_ENV || 'unknown',
                        checks: {
                            edgeRuntime: false,
                            environmentVariables: false,
                            aiProviders: false,
                            stateManagement: false,
                            searchProviders: false,
                            apiEndpoints: false,
                        },
                        details: {
                            errors: ["Health check error: ".concat(error_2 instanceof Error ? error_2.message : 'Unknown error')],
                        },
                    };
                    return [2 /*return*/, new Response(JSON.stringify(errorResponse), {
                            status: 500,
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Edge-Runtime': 'true',
                                'Cache-Control': 'no-cache',
                                'Access-Control-Allow-Origin': '*',
                            },
                        })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Handle HTTP method routing
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

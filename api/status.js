/**
 * API Status Dashboard Endpoint
 *
 * Provides detailed status information for all API endpoints
 * Used for monitoring and debugging API health
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
export var config = {
    runtime: 'edge',
};
/**
 * Test a single API endpoint
 */
function testEndpoint(baseUrl_1, endpoint_1) {
    return __awaiter(this, arguments, void 0, function (baseUrl, endpoint, method, testData) {
        var startTime, fullUrl, endpointInfo, options, timeoutPromise, fetchPromise, response, responseTime, status_1, error_1, responseTime;
        if (method === void 0) { method = 'GET'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = Date.now();
                    fullUrl = "".concat(baseUrl).concat(endpoint);
                    endpointInfo = getEndpointInfo(endpoint);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    options = {
                        method: method,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    };
                    if (method === 'POST' && testData) {
                        options.body = JSON.stringify(testData);
                    }
                    timeoutPromise = new Promise(function (_, reject) {
                        setTimeout(function () { return reject(new Error('Request timeout')); }, 10000);
                    });
                    fetchPromise = fetch(fullUrl, options);
                    return [4 /*yield*/, Promise.race([fetchPromise, timeoutPromise])];
                case 2:
                    response = _a.sent();
                    responseTime = Date.now() - startTime;
                    status_1 = 'online';
                    if (response.status >= 500) {
                        status_1 = 'offline';
                    }
                    else if (response.status >= 400) {
                        status_1 = 'degraded';
                    }
                    return [2 /*return*/, __assign(__assign({}, endpointInfo), { endpoint: endpoint, status: status_1, lastChecked: new Date().toISOString(), responseTime: responseTime, statusCode: response.status })];
                case 3:
                    error_1 = _a.sent();
                    responseTime = Date.now() - startTime;
                    return [2 /*return*/, __assign(__assign({}, endpointInfo), { endpoint: endpoint, status: 'offline', lastChecked: new Date().toISOString(), responseTime: responseTime, error: error_1 instanceof Error ? error_1.message : 'Unknown error' })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Get endpoint information
 */
function getEndpointInfo(endpoint) {
    var endpointMap = {
        '/api/health': {
            name: 'Health Check',
            description: 'System health monitoring and diagnostics',
            dependencies: ['Environment Variables', 'Edge Runtime'],
        },
        '/api/validate-env': {
            name: 'Environment Validation',
            description: 'Validates all required environment variables and external service connectivity',
            dependencies: ['AI Providers', 'Redis', 'Vector DB', 'Search Providers'],
        },
        '/api/inngest': {
            name: 'Inngest Integration',
            description: 'Workflow orchestration system status',
            dependencies: ['Inngest Service', 'Environment Variables'],
        },
        '/api/itinerary/generate': {
            name: 'Generate Itinerary',
            description: 'Main endpoint for starting AI-powered itinerary generation',
            dependencies: ['Form Validation', 'Workflow Session', 'Inngest', 'Redis'],
        },
        '/api/itinerary/get-itinerary': {
            name: 'Get Itinerary',
            description: 'Retrieves completed itinerary results',
            dependencies: ['Redis', 'Workflow Session'],
        },
        '/api/itinerary/progress-simple': {
            name: 'Progress Updates',
            description: 'Server-sent events for real-time workflow progress',
            dependencies: ['Redis', 'SSE Support'],
        },
        '/api/inngest/webhook': {
            name: 'Inngest Webhook',
            description: 'Handles workflow execution callbacks from Inngest',
            dependencies: ['Inngest Authentication', 'Workflow Processing'],
        },
    };
    return (endpointMap[endpoint] || {
        name: endpoint
            .replace('/api/', '')
            .replace(/\//g, ' ')
            .replace(/\b\w/g, function (l) { return l.toUpperCase(); }),
        description: 'API endpoint',
        dependencies: [],
    });
}
/**
 * Main status check handler
 */
export default function handler(req) {
    return __awaiter(this, void 0, void 0, function () {
        var url, baseUrl, endpoints, coreEndpoints, workflowEndpoints, integrationEndpoints, allEndpoints, _i, allEndpoints_1, endpointConfig, path, method, testData, result, error_2, healthyCount, degradedCount, offlineCount, overall, response, error_3, errorResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('📊 API Status Dashboard - Starting comprehensive check');
                    url = new URL(req.url);
                    baseUrl = "".concat(url.protocol, "//").concat(url.host);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, , 9]);
                    endpoints = [];
                    coreEndpoints = [
                        { path: '/api/health', method: 'GET' },
                        { path: '/api/validate-env', method: 'GET' },
                        { path: '/api/inngest', method: 'GET' },
                    ];
                    workflowEndpoints = [
                        {
                            path: '/api/itinerary/generate',
                            method: 'POST',
                            testData: {
                                sessionId: 'health-check-session-123',
                                formData: {
                                    location: 'test-health-check',
                                    departDate: '2025-10-01',
                                    returnDate: '2025-10-05',
                                    budget: 1000,
                                    adults: 2,
                                    flexibleDates: false,
                                },
                            },
                        },
                        { path: '/api/itinerary/get-itinerary?workflowId=health-check-test', method: 'GET' },
                        { path: '/api/itinerary/progress-simple', method: 'GET' },
                    ];
                    integrationEndpoints = [
                        { path: '/api/inngest/webhook', method: 'POST', testData: { test: true } },
                    ];
                    allEndpoints = __spreadArray(__spreadArray(__spreadArray([], coreEndpoints, true), workflowEndpoints, true), integrationEndpoints, true);
                    console.log("\uD83D\uDCE1 Testing ".concat(allEndpoints.length, " API endpoints..."));
                    _i = 0, allEndpoints_1 = allEndpoints;
                    _a.label = 2;
                case 2:
                    if (!(_i < allEndpoints_1.length)) return [3 /*break*/, 7];
                    endpointConfig = allEndpoints_1[_i];
                    path = endpointConfig.path, method = endpointConfig.method;
                    testData = 'testData' in endpointConfig ? endpointConfig.testData : undefined;
                    console.log("\uD83D\uDD0D Testing ".concat(method, " ").concat(path, "..."));
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, testEndpoint(baseUrl, path, method, testData)];
                case 4:
                    result = _a.sent();
                    endpoints.push(result);
                    console.log("".concat(result.status === 'online' ? '✅' : result.status === 'degraded' ? '⚠️' : '❌', " ").concat(path, ": ").concat(result.statusCode || 'ERROR', " (").concat(result.responseTime, "ms)"));
                    return [3 /*break*/, 6];
                case 5:
                    error_2 = _a.sent();
                    console.log("\uD83D\uDCA5 Error testing ".concat(path, ":"), error_2);
                    endpoints.push(__assign(__assign({}, getEndpointInfo(path)), { endpoint: path, status: 'offline', lastChecked: new Date().toISOString(), error: error_2 instanceof Error ? error_2.message : 'Test failed' }));
                    return [3 /*break*/, 6];
                case 6:
                    _i++;
                    return [3 /*break*/, 2];
                case 7:
                    healthyCount = endpoints.filter(function (ep) { return ep.status === 'online'; }).length;
                    degradedCount = endpoints.filter(function (ep) { return ep.status === 'degraded'; }).length;
                    offlineCount = endpoints.filter(function (ep) { return ep.status === 'offline'; }).length;
                    overall = 'healthy';
                    if (offlineCount > 0) {
                        overall = 'unhealthy';
                    }
                    else if (degradedCount > 0) {
                        overall = 'degraded';
                    }
                    response = {
                        overall: overall,
                        timestamp: new Date().toISOString(),
                        version: '1.0.0',
                        totalEndpoints: endpoints.length,
                        healthyEndpoints: healthyCount,
                        endpoints: endpoints.sort(function (a, b) { return a.endpoint.localeCompare(b.endpoint); }),
                    };
                    console.log("\uD83C\uDFAF API Status Summary: ".concat(overall.toUpperCase()));
                    console.log("\uD83D\uDCCA ".concat(healthyCount, " healthy, ").concat(degradedCount, " degraded, ").concat(offlineCount, " offline"));
                    return [2 /*return*/, new Response(JSON.stringify(response, null, 2), {
                            status: 200,
                            headers: {
                                'Content-Type': 'application/json',
                                'Cache-Control': 'no-cache, no-store, must-revalidate',
                                'Access-Control-Allow-Origin': '*',
                                'X-Total-Endpoints': endpoints.length.toString(),
                                'X-Healthy-Endpoints': healthyCount.toString(),
                                'X-Overall-Status': overall,
                            },
                        })];
                case 8:
                    error_3 = _a.sent();
                    console.error('💥 API Status check failed:', error_3);
                    errorResponse = {
                        overall: 'unhealthy',
                        timestamp: new Date().toISOString(),
                        version: '1.0.0',
                        totalEndpoints: 0,
                        healthyEndpoints: 0,
                        endpoints: [],
                    };
                    return [2 /*return*/, new Response(JSON.stringify(errorResponse), {
                            status: 500,
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*',
                            },
                        })];
                case 9: return [2 /*return*/];
            }
        });
    });
}
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

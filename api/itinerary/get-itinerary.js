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
/**
 * Get Itinerary Results API Endpoint
 * Enhanced with comprehensive logging and error handling
 */
import { sessionManager } from '../../src/lib/workflows/session-manager.js';
export var config = {
    runtime: 'edge',
};
export default function handler(request) {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, url, workflowId, session, Redis, redis, itineraryData, itinerary, error_1, sessionError_1, error_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    // Add deployment verification logging
                    console.log('🚀 [GET-ITINERARY] ENDPOINT ACTIVATED - Deployment verified', {
                        timestamp: new Date().toISOString(),
                        method: request.method,
                        url: request.url,
                        headers: Object.fromEntries(request.headers.entries()),
                    });
                    if (request.method !== 'GET') {
                        console.log('❌ [Get-Itinerary] Method not allowed:', request.method);
                        return [2 /*return*/, Response.json({ success: false, error: 'Method not allowed' }, { status: 405 })];
                    }
                    startTime = Date.now();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 11, , 12]);
                    url = new URL(request.url);
                    workflowId = url.searchParams.get('workflowId');
                    console.log('🔍 [Get-Itinerary] Request details:', {
                        workflowId: workflowId,
                        searchParams: Object.fromEntries(url.searchParams),
                        pathname: url.pathname,
                    });
                    if (!workflowId) {
                        console.log('❌ [Get-Itinerary] Missing workflowId parameter');
                        return [2 /*return*/, Response.json({ success: false, error: 'workflowId parameter is required' }, { status: 400 })];
                    }
                    console.log("\uD83D\uDD0D [Get-Itinerary] Checking status for workflow: ".concat(workflowId));
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 9, , 10]);
                    console.log('🧪 [Get-Itinerary] Testing sessionManager availability...');
                    return [4 /*yield*/, sessionManager.getSession(workflowId)];
                case 3:
                    session = _b.sent();
                    console.log('🧪 [Get-Itinerary] SessionManager test result:', {
                        sessionFound: !!session,
                        sessionStatus: (session === null || session === void 0 ? void 0 : session.status) || 'not-found',
                    });
                    if (!session) {
                        console.log("\u274C [Get-Itinerary] No session found for: ".concat(workflowId));
                        return [2 /*return*/, Response.json({
                                success: false,
                                error: 'Workflow not found',
                                workflowId: workflowId,
                                debug: 'Session not found in storage',
                            }, { status: 404 })];
                    }
                    console.log("\u2705 [Get-Itinerary] Session found", {
                        workflowId: workflowId.substring(0, 12) + '...',
                        status: session.status,
                        currentStage: session.currentStage,
                        progress: session.progress,
                    });
                    if (!(session.status === 'completed')) return [3 /*break*/, 8];
                    console.log("\uD83C\uDF89 [Get-Itinerary] Workflow completed - retrieving results");
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 7, , 8]);
                    return [4 /*yield*/, import('@upstash/redis')];
                case 5:
                    Redis = (_b.sent()).Redis;
                    redis = new Redis({
                        url: process.env['KV_REST_API_URL'],
                        token: process.env['KV_REST_API_TOKEN'],
                    });
                    return [4 /*yield*/, redis.get("itinerary:".concat(workflowId))];
                case 6:
                    itineraryData = _b.sent();
                    itinerary = itineraryData ? JSON.parse(itineraryData) : null;
                    console.log("\u2705 [Get-Itinerary] Workflow completed for: ".concat(workflowId), {
                        hasItineraryData: !!itineraryData,
                        itinerarySize: itineraryData ? itineraryData.length : 0,
                    });
                    return [2 /*return*/, Response.json({
                            success: true,
                            workflowId: workflowId,
                            status: 'completed',
                            progress: 100,
                            itinerary: itinerary || {
                                message: 'AI itinerary generation completed successfully!',
                                destination: ((_a = session.formData) === null || _a === void 0 ? void 0 : _a.location) || 'Unknown',
                                status: 'Your personalized travel itinerary has been generated.',
                            },
                            processingTime: Date.now() - startTime,
                        })];
                case 7:
                    error_1 = _b.sent();
                    console.error("\uD83D\uDCA5 [Get-Itinerary] Error retrieving itinerary:", error_1);
                    return [2 /*return*/, Response.json({
                            success: false,
                            error: 'Failed to retrieve completed itinerary',
                            debug: error_1 instanceof Error ? error_1.message : 'Redis access error',
                            workflowId: workflowId,
                        }, { status: 500 })];
                case 8: 
                // If still processing or other status
                return [2 /*return*/, Response.json({
                        success: false,
                        workflowId: workflowId,
                        status: session.status || 'processing',
                        progress: session.progress || 25,
                        currentStage: session.currentStage || 'architect',
                        message: "AI ".concat(session.currentStage || 'architect', " agent is working on your itinerary..."),
                        timestamp: new Date().toISOString(),
                        processingTime: Date.now() - startTime,
                    })];
                case 9:
                    sessionError_1 = _b.sent();
                    console.error('💥 [Get-Itinerary] SessionManager error:', sessionError_1);
                    return [2 /*return*/, Response.json({
                            success: false,
                            error: 'Session manager unavailable',
                            debug: sessionError_1 instanceof Error ? sessionError_1.message : 'Unknown session error',
                            workflowId: workflowId,
                        }, { status: 500 })];
                case 10: return [3 /*break*/, 12];
                case 11:
                    error_2 = _b.sent();
                    console.error("\uD83D\uDCA5 [Get-Itinerary] Handler error:", error_2);
                    return [2 /*return*/, Response.json({
                            success: false,
                            error: 'Internal server error',
                            debug: error_2 instanceof Error ? error_2.message : 'Unknown error',
                            processingTime: Date.now() - startTime,
                        }, { status: 500 })];
                case 12: return [2 /*return*/];
            }
        });
    });
}

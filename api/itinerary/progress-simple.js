/**
 * Progress Stream API Endpoint
 *
 * Constitutional Requirements:
 * - Vercel Edge Runtime only
 * - Server-Sent Events (SSE) streaming
 * - Real-time progress updates
 *
 * Task: T038 - Implement /api/itinerary/progress-simple endpoint
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
import { WorkflowOrchestrator } from '../../src/lib/workflows/orchestrator.js';
// Runtime configuration for Vercel Edge
export var config = {
    runtime: 'edge',
};
/**
 * GET /api/itinerary/progress-simple
 * Server-Sent Events stream for real-time progress updates
 */
export default function handler(request) {
    return __awaiter(this, void 0, void 0, function () {
        var url, workflowId, stream, writer, encoder, sendEvent, startPolling;
        var _this = this;
        return __generator(this, function (_a) {
            // Only allow GET method
            if (request.method !== 'GET') {
                return [2 /*return*/, Response.json({ error: 'Method not allowed' }, { status: 405 })];
            }
            url = new URL(request.url);
            workflowId = url.searchParams.get('workflowId');
            if (!workflowId) {
                return [2 /*return*/, Response.json({ error: 'workflowId parameter is required' }, { status: 400 })];
            }
            console.log("[Progress Stream API] Starting SSE stream for workflow ".concat(workflowId));
            stream = new TransformStream();
            writer = stream.writable.getWriter();
            encoder = new TextEncoder();
            sendEvent = function (data) { return __awaiter(_this, void 0, void 0, function () {
                var sseData;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            sseData = "data: ".concat(JSON.stringify(data), "\n\n");
                            return [4 /*yield*/, writer.write(encoder.encode(sseData))];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); };
            startPolling = function () { return __awaiter(_this, void 0, void 0, function () {
                var lastProgress_1, pollCount_1, maxPolls_1, poll_1, error_1;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 1, , 3]);
                            lastProgress_1 = -1;
                            pollCount_1 = 0;
                            maxPolls_1 = 120;
                            poll_1 = function () { return __awaiter(_this, void 0, void 0, function () {
                                var workflowStatus, error_2;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            _a.trys.push([0, 14, , 17]);
                                            return [4 /*yield*/, WorkflowOrchestrator.getWorkflowStatus(workflowId)];
                                        case 1:
                                            workflowStatus = _a.sent();
                                            if (!!workflowStatus) return [3 /*break*/, 4];
                                            return [4 /*yield*/, sendEvent({
                                                    workflowId: workflowId,
                                                    progress: 0,
                                                    currentStage: 'not-found',
                                                    message: 'Workflow not found',
                                                    timestamp: new Date().toISOString(),
                                                })];
                                        case 2:
                                            _a.sent();
                                            return [4 /*yield*/, writer.close()];
                                        case 3:
                                            _a.sent();
                                            return [2 /*return*/];
                                        case 4:
                                            if (!(workflowStatus.progress !== lastProgress_1 || pollCount_1 === 0)) return [3 /*break*/, 6];
                                            return [4 /*yield*/, sendEvent({
                                                    workflowId: workflowId,
                                                    progress: workflowStatus.progress,
                                                    currentStage: workflowStatus.currentStage,
                                                    message: getStageMessage(workflowStatus.currentStage, workflowStatus.progress),
                                                    timestamp: new Date().toISOString(),
                                                })];
                                        case 5:
                                            _a.sent();
                                            lastProgress_1 = workflowStatus.progress;
                                            _a.label = 6;
                                        case 6:
                                            if (!(workflowStatus.status === 'completed' || workflowStatus.status === 'failed')) return [3 /*break*/, 9];
                                            return [4 /*yield*/, sendEvent({
                                                    workflowId: workflowId,
                                                    progress: workflowStatus.progress,
                                                    currentStage: workflowStatus.currentStage,
                                                    message: workflowStatus.status === 'completed'
                                                        ? 'Itinerary generation completed!'
                                                        : workflowStatus.errorMessage || 'Itinerary generation failed',
                                                    timestamp: new Date().toISOString(),
                                                })];
                                        case 7:
                                            _a.sent();
                                            return [4 /*yield*/, writer.close()];
                                        case 8:
                                            _a.sent();
                                            return [2 /*return*/];
                                        case 9:
                                            pollCount_1++;
                                            if (!(pollCount_1 < maxPolls_1)) return [3 /*break*/, 10];
                                            setTimeout(poll_1, 5000); // Poll every 5 seconds
                                            return [3 /*break*/, 13];
                                        case 10: 
                                        // Timeout after max polls
                                        return [4 /*yield*/, sendEvent({
                                                workflowId: workflowId,
                                                progress: workflowStatus.progress,
                                                currentStage: 'timeout',
                                                message: 'Progress stream timed out. Please refresh to check current status.',
                                                timestamp: new Date().toISOString(),
                                            })];
                                        case 11:
                                            // Timeout after max polls
                                            _a.sent();
                                            return [4 /*yield*/, writer.close()];
                                        case 12:
                                            _a.sent();
                                            _a.label = 13;
                                        case 13: return [3 /*break*/, 17];
                                        case 14:
                                            error_2 = _a.sent();
                                            console.error("[Progress Stream API] Polling error for ".concat(workflowId, ":"), error_2);
                                            return [4 /*yield*/, sendEvent({
                                                    workflowId: workflowId,
                                                    progress: 0,
                                                    currentStage: 'error',
                                                    message: 'Error occurred while checking progress',
                                                    timestamp: new Date().toISOString(),
                                                })];
                                        case 15:
                                            _a.sent();
                                            return [4 /*yield*/, writer.close()];
                                        case 16:
                                            _a.sent();
                                            return [3 /*break*/, 17];
                                        case 17: return [2 /*return*/];
                                    }
                                });
                            }); };
                            // Start polling
                            poll_1();
                            return [3 /*break*/, 3];
                        case 1:
                            error_1 = _a.sent();
                            console.error("[Progress Stream API] Stream error for ".concat(workflowId, ":"), error_1);
                            return [4 /*yield*/, writer.close()];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); };
            // Start the polling process
            startPolling();
            // Return SSE response
            return [2 /*return*/, new Response(stream.readable, {
                    status: 200,
                    headers: {
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        Connection: 'keep-alive',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Cache-Control',
                    },
                })];
        });
    });
}
/**
 * Get user-friendly message for each stage
 */
function getStageMessage(stage, progress) {
    switch (stage) {
        case 'architect':
            return 'Planning your trip structure...';
        case 'gatherer':
            return 'Gathering destination information...';
        case 'specialist':
            return 'Processing recommendations...';
        case 'formatter':
            return 'Creating your personalized itinerary...';
        case 'complete':
            return 'Your itinerary is ready!';
        case 'not-found':
            return 'Workflow not found';
        case 'error':
            return 'An error occurred';
        case 'timeout':
            return 'Progress stream timed out';
        default:
            return "Processing... (".concat(progress, "%)");
    }
}

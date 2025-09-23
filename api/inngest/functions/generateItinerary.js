/**
 * Mainimport { inngest } from '../client.js';
import { sessionManager } from '../../../src/lib/workflows/session-manager.js';
// Import existing AI agents
import { architectAgent } from '../../../src/lib/ai-agents/architect-agent.js';
import { gathererAgent } from '../../../src/lib/ai-agents/gatherer-agent.js';
import { specialistAgent } from '../../../src/lib/ai-agents/specialist-agent.js';
import { formatterAgent } from '../../../src/lib/ai-agents/formatter-agent.js';ry Generation Function
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - Step-based architecture for reliability
 * - Proper event handling and progress updates
 * - 4-agent workflow orchestration
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
import { inngest } from '../client.js';
// Import existing AI agents
import { architectAgent } from '../../../src/lib/ai-agents/architect-agent.js';
import { gathererAgent } from '../../../src/lib/ai-agents/gatherer-agent.js';
import { specialistAgent } from '../../../src/lib/ai-agents/specialist-agent.js';
import { formatterAgent } from '../../../src/lib/ai-agents/formatter-agent.js';
// Import progress integration
import { updateWorkflowProgress, } from '../../../src/lib/workflows/progress-integration.js';
// Import enhanced error handling
import { handleEnhancedWorkflowError } from '../../../src/lib/workflows/enhanced-error-handling.js';
/**
 * Main orchestrator function for AI-powered itinerary generation
 * Coordinates all 4 agents in sequence with proper error handling
 */
export var generateItinerary = inngest.createFunction({
    id: 'generate-itinerary',
    name: 'AI Travel Itinerary Generator',
    retries: 3,
}, { event: 'itinerary/generate' }, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var _c, workflowId, sessionId, formData, architecture_1, gatheredInfo_1, filteredRecommendations_1, finalItinerary, error_1;
    var event = _b.event, step = _b.step;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _c = event.data, workflowId = _c.workflowId, sessionId = _c.sessionId, formData = _c.formData;
                console.log('🚀 [INNGEST] Main Workflow: Starting itinerary generation', {
                    workflowId: workflowId.substring(0, 15) + '...',
                    sessionId: sessionId.substring(0, 8) + '...',
                    location: formData.location,
                    travelers: "".concat(formData.adults, "+").concat(formData.children),
                });
                _d.label = 1;
            case 1:
                _d.trys.push([1, 14, , 17]);
                return [4 /*yield*/, step.run('architect-planning', function () { return __awaiter(void 0, void 0, void 0, function () {
                        var result;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    console.log('🏗️ [INNGEST] Step 1: Architecture planning started');
                                    return [4 /*yield*/, architectAgent.generateArchitecture({
                                            workflowId: workflowId,
                                            formData: formData,
                                        })];
                                case 1:
                                    result = _a.sent();
                                    console.log('✅ [INNGEST] Step 1: Architecture planning completed');
                                    return [2 /*return*/, result];
                            }
                        });
                    }); })];
            case 2:
                architecture_1 = _d.sent();
                // Progress Update: Architecture Complete
                return [4 /*yield*/, step.sendEvent('progress-architecture', {
                        name: 'workflow/progress',
                        data: {
                            workflowId: workflowId,
                            stage: 'architecture-complete',
                            progress: 25,
                        },
                    })];
            case 3:
                // Progress Update: Architecture Complete
                _d.sent();
                // Update Redis for SSE streaming
                return [4 /*yield*/, step.run('update-progress-architect', function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, updateWorkflowProgress(workflowId, 'architect', ['architect'])];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            case 4:
                // Update Redis for SSE streaming
                _d.sent();
                return [4 /*yield*/, step.run('information-gathering', function () { return __awaiter(void 0, void 0, void 0, function () {
                        var result;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    console.log('🌐 [INNGEST] Step 2: Information gathering started');
                                    return [4 /*yield*/, gathererAgent.gatherInformation({
                                            workflowId: workflowId,
                                            destination: formData.location,
                                            itineraryStructure: architecture_1.itineraryStructure,
                                            interests: formData.interests || [],
                                            budget: formData.budget,
                                            travelStyle: formData.travelStyle,
                                        })];
                                case 1:
                                    result = _a.sent();
                                    console.log('✅ [INNGEST] Step 2: Information gathering completed');
                                    return [2 /*return*/, result];
                            }
                        });
                    }); })];
            case 5:
                gatheredInfo_1 = _d.sent();
                // Progress Update: Gathering Complete
                return [4 /*yield*/, step.sendEvent('progress-gathering', {
                        name: 'workflow/progress',
                        data: {
                            workflowId: workflowId,
                            stage: 'gathering-complete',
                            progress: 50,
                        },
                    })];
            case 6:
                // Progress Update: Gathering Complete
                _d.sent();
                // Update Redis for SSE streaming
                return [4 /*yield*/, step.run('update-progress-gatherer', function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, updateWorkflowProgress(workflowId, 'gatherer', ['architect', 'gatherer'])];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            case 7:
                // Update Redis for SSE streaming
                _d.sent();
                return [4 /*yield*/, step.run('specialist-processing', function () { return __awaiter(void 0, void 0, void 0, function () {
                        var result;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    console.log('👨‍💼 [INNGEST] Step 3: Specialist processing started');
                                    return [4 /*yield*/, specialistAgent.processRecommendations({
                                            workflowId: workflowId,
                                            architecture: architecture_1,
                                            gatheredInfo: gatheredInfo_1,
                                            userPreferences: {
                                                interests: formData.interests || [],
                                                avoidances: [], // Will be added to form in future
                                                travelExperience: 'intermediate', // Default value
                                                tripVibe: ((_a = formData.travelStyle) === null || _a === void 0 ? void 0 : _a.pace) || 'moderate',
                                            },
                                        })];
                                case 1:
                                    result = _b.sent();
                                    console.log('✅ [INNGEST] Step 3: Specialist processing completed');
                                    return [2 /*return*/, result];
                            }
                        });
                    }); })];
            case 8:
                filteredRecommendations_1 = _d.sent();
                // Progress Update: Specialist Complete
                return [4 /*yield*/, step.sendEvent('progress-specialist', {
                        name: 'workflow/progress',
                        data: {
                            workflowId: workflowId,
                            stage: 'specialist-complete',
                            progress: 75,
                        },
                    })];
            case 9:
                // Progress Update: Specialist Complete
                _d.sent();
                // Update Redis for SSE streaming
                return [4 /*yield*/, step.run('update-progress-specialist', function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, updateWorkflowProgress(workflowId, 'specialist', [
                                        'architect',
                                        'gatherer',
                                        'specialist',
                                    ])];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            case 10:
                // Update Redis for SSE streaming
                _d.sent();
                return [4 /*yield*/, step.run('final-formatting', function () { return __awaiter(void 0, void 0, void 0, function () {
                        var result;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    console.log('📝 [INNGEST] Step 4: Final formatting started');
                                    return [4 /*yield*/, formatterAgent.formatItinerary({
                                            workflowId: workflowId,
                                            formData: formData,
                                            architecture: architecture_1,
                                            gatheredInfo: gatheredInfo_1,
                                            processedRecommendations: filteredRecommendations_1,
                                        })];
                                case 1:
                                    result = _a.sent();
                                    console.log('✅ [INNGEST] Step 4: Final formatting completed');
                                    return [2 /*return*/, result];
                            }
                        });
                    }); })];
            case 11:
                finalItinerary = _d.sent();
                // Final Progress Update: Workflow Complete
                return [4 /*yield*/, step.sendEvent('workflow-complete', {
                        name: 'workflow/complete',
                        data: {
                            workflowId: workflowId,
                            itinerary: finalItinerary,
                        },
                    })];
            case 12:
                // Final Progress Update: Workflow Complete
                _d.sent();
                // Update session with final result
                return [4 /*yield*/, step.run('update-session', function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, updateWorkflowProgress(workflowId, 'complete', [
                                        'architect',
                                        'gatherer',
                                        'specialist',
                                        'formatter',
                                    ])];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            case 13:
                // Update session with final result
                _d.sent();
                console.log('🎉 [INNGEST] Main Workflow: Itinerary generation completed successfully', {
                    workflowId: workflowId.substring(0, 15) + '...',
                });
                return [2 /*return*/, {
                        workflowId: workflowId,
                        sessionId: sessionId,
                        status: 'completed',
                        itinerary: finalItinerary,
                    }];
            case 14:
                error_1 = _d.sent();
                console.error('💥 [INNGEST] Main Workflow: Failed', {
                    workflowId: workflowId.substring(0, 15) + '...',
                    error: error_1 instanceof Error ? error_1.message : 'Unknown error',
                });
                // Handle error and update progress
                return [4 /*yield*/, step.run('handle-workflow-error', function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, handleEnhancedWorkflowError(workflowId, 'main-workflow', error_1 instanceof Error ? error_1 : new Error('Unknown error'))];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            case 15:
                // Handle error and update progress
                _d.sent();
                // Send error event
                return [4 /*yield*/, step.sendEvent('workflow-error', {
                        name: 'workflow/error',
                        data: {
                            workflowId: workflowId,
                            error: error_1 instanceof Error ? error_1.message : 'Unknown error',
                            stage: 'main-workflow',
                        },
                    })];
            case 16:
                // Send error event
                _d.sent();
                throw error_1; // Re-throw to trigger Inngest retry mechanism
            case 17: return [2 /*return*/];
        }
    });
}); });

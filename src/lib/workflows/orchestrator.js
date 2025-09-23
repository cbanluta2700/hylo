/**
 * Main Workflow Orchestrator
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility (CONSTITUTIONAL PRINCIPLE I - NON-NEGOTIABLE)
 * - AI SDK 5.0+ for LLM integration (Constitution v1.1.0)
 * - Type-safe development
 * - Direct AI workflow execution (Edge-First Architecture)
 *
 * Task: T026-T031 - Main workflow orchestration
 * Using Inngest "invoking functions directly" pattern from docs
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
import { sessionManager } from './session-manager.js';
/**
 * Workflow Orchestrator Class
 * Simplified approach using Inngest "invoking functions directly" pattern
 */
/**
 * Generate unique workflow ID
 */
function generateWorkflowId() {
    return "wf_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
}
var WorkflowOrchestrator = /** @class */ (function () {
    function WorkflowOrchestrator() {
    }
    /**
     * Initiate new itinerary generation workflow
     * Using Inngest "invoking functions directly" pattern
     */
    WorkflowOrchestrator.startWorkflow = function (sessionId, formData) {
        return __awaiter(this, void 0, void 0, function () {
            var workflowId, inngest, error_1, estimatedMinutes, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        workflowId = generateWorkflowId();
                        console.log('🚀 [70] Workflow Orchestrator: Starting itinerary generation', {
                            workflowId: workflowId.substring(0, 15) + '...',
                            sessionId: sessionId.substring(0, 8) + '...',
                            location: formData.location,
                            travelers: "".concat(formData.adults, "+").concat(formData.children),
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        console.log('📁 [71] Workflow Orchestrator: Initializing session');
                        // Create session first
                        return [4 /*yield*/, sessionManager.createSession(workflowId, sessionId, formData)];
                    case 2:
                        // Create session first
                        _a.sent();
                        console.log('🚀 [72] Workflow Orchestrator: Phase 2 - Triggering Inngest workflow');
                        console.log('🔧 [72b] Status: Sending itinerary/generate event');
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 6, , 7]);
                        return [4 /*yield*/, import('../../../api/inngest/client.js')];
                    case 4:
                        inngest = (_a.sent()).inngest;
                        console.log('📡 [72c] Sending Inngest event: itinerary/generate');
                        return [4 /*yield*/, inngest.send({
                                name: 'itinerary/generate',
                                data: {
                                    workflowId: workflowId,
                                    sessionId: sessionId,
                                    formData: formData,
                                },
                            })];
                    case 5:
                        _a.sent();
                        console.log('✅ [72d] Inngest event sent successfully');
                        return [3 /*break*/, 7];
                    case 6:
                        error_1 = _a.sent();
                        console.error('💥 [72e] Failed to send Inngest event:', error_1);
                        throw new Error("Workflow initiation failed: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'));
                    case 7:
                        console.log('✅ [73] Workflow Orchestrator: Inngest workflow triggered successfully');
                        estimatedMinutes = this.estimateProcessingTime(formData);
                        console.log('✅ [77] Workflow Orchestrator: Workflow initiated directly', {
                            workflowId: workflowId,
                            estimatedMinutes: estimatedMinutes,
                            method: 'direct-execution',
                        });
                        return [2 /*return*/, {
                                workflowId: workflowId,
                                estimatedCompletionTime: estimatedMinutes * 60 * 1000,
                            }];
                    case 8:
                        error_2 = _a.sent();
                        console.error('💥 [78] Workflow Orchestrator: Failed to start workflow:', {
                            error: error_2 instanceof Error ? error_2.message : 'Unknown error',
                            workflowId: workflowId,
                            sessionId: sessionId.substring(0, 8) + '...',
                        });
                        throw new Error("Workflow initialization error: ".concat(error_2 instanceof Error ? error_2.message : 'Unknown error'));
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get workflow status and progress
     */
    WorkflowOrchestrator.getWorkflowStatus = function (workflowId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sessionManager.getSession(workflowId)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Cancel running workflow
     */
    WorkflowOrchestrator.cancelWorkflow = function (workflowId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, sessionManager.updateProgress(workflowId, {
                                status: 'failed',
                                errorMessage: 'Workflow cancelled by user',
                            })];
                    case 1:
                        _a.sent();
                        console.log("[Workflow] Cancelled workflow ".concat(workflowId));
                        return [2 /*return*/, true];
                    case 2:
                        error_3 = _a.sent();
                        console.error("[Workflow] Failed to cancel workflow ".concat(workflowId, ":"), error_3);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Estimate processing time based on form complexity
     * More complex forms = longer processing time
     */
    WorkflowOrchestrator.estimateProcessingTime = function (formData) {
        var baseTime = 3; // 3 minutes base
        // Add time for duration
        if (formData.plannedDays && formData.plannedDays > 7) {
            baseTime += Math.floor(formData.plannedDays / 7);
        }
        // Add time for interests complexity
        if (formData.interests.length > 5) {
            baseTime += 1;
        }
        // Add time for group size
        if (formData.adults + formData.children > 4) {
            baseTime += 1;
        }
        // Add time for budget complexity
        if (formData.budget.total > 5000) {
            baseTime += 1;
        }
        return Math.min(baseTime, 8); // Cap at 8 minutes
    };
    return WorkflowOrchestrator;
}());
export { WorkflowOrchestrator };

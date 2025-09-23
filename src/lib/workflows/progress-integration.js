/**
 * Progress Integration Utilities
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - Integration with existing SSE progress reporting
 * - Sync with Redis session manager
 *
 * Connects Inngest workflow events with the existing progress system
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
import { sessionManager } from '../workflows/session-manager.js';
/**
 * Standard progress stages mapping
 */
export var PROGRESS_STAGES = {
    architect: { progress: 25, message: 'Creating your trip structure...' },
    gatherer: { progress: 50, message: 'Gathering destination information...' },
    specialist: { progress: 75, message: 'Processing recommendations...' },
    formatter: { progress: 90, message: 'Finalizing your itinerary...' },
    complete: { progress: 100, message: 'Your personalized itinerary is ready!' },
};
/**
 * Update progress in session manager for SSE streaming
 * Used by Inngest functions to maintain progress sync
 */
export function updateWorkflowProgress(workflowId, stage, completedSteps) {
    return __awaiter(this, void 0, void 0, function () {
        var stageInfo, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    stageInfo = PROGRESS_STAGES[stage];
                    console.log('📊 [Progress Integration] Updating workflow progress', {
                        workflowId: workflowId.substring(0, 15) + '...',
                        stage: stage,
                        progress: stageInfo.progress,
                        message: stageInfo.message,
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, sessionManager.updateProgress(workflowId, __assign(__assign({ currentStage: stage, progress: stageInfo.progress }, (stage === 'complete' && { status: 'completed' })), (completedSteps && { completedSteps: completedSteps })))];
                case 2:
                    _a.sent();
                    console.log('✅ [Progress Integration] Progress updated successfully');
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('💥 [Progress Integration] Failed to update progress:', error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Handle workflow error and update progress
 */
export function handleWorkflowError(workflowId, stage, error) {
    return __awaiter(this, void 0, void 0, function () {
        var errorMessage, updateError_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    errorMessage = error instanceof Error ? error.message : error;
                    console.log('❌ [Progress Integration] Handling workflow error', {
                        workflowId: workflowId.substring(0, 15) + '...',
                        stage: stage,
                        error: errorMessage,
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, sessionManager.updateProgress(workflowId, {
                            status: 'failed',
                            errorMessage: errorMessage,
                        })];
                case 2:
                    _a.sent();
                    console.log('✅ [Progress Integration] Error status updated');
                    return [3 /*break*/, 4];
                case 3:
                    updateError_1 = _a.sent();
                    console.error('💥 [Progress Integration] Failed to update error status:', updateError_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Initialize workflow progress
 */
export function initializeWorkflowProgress(workflowId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🚀 [Progress Integration] Initializing workflow progress', {
                        workflowId: workflowId.substring(0, 15) + '...',
                    });
                    return [4 /*yield*/, updateWorkflowProgress(workflowId, 'architect', [])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}

/**
 * Enhanced Error Handling Integration for Inngest Workflows
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - Integration with existing ErrorBoundary system
 * - Progressive enhancement with graceful degradation
 * - Observable operations with monitoring
 *
 * Connects Inngest workflow errors with the existing error handling infrastructure
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
import { sessionManager } from '../workflows/session-manager.js';
/**
 * Workflow error categories
 */
export var WorkflowErrorType;
(function (WorkflowErrorType) {
    WorkflowErrorType["VALIDATION"] = "validation";
    WorkflowErrorType["NETWORK"] = "network";
    WorkflowErrorType["AI_PROVIDER"] = "ai_provider";
    WorkflowErrorType["TIMEOUT"] = "timeout";
    WorkflowErrorType["SYSTEM"] = "system";
    WorkflowErrorType["RATE_LIMIT"] = "rate_limit";
})(WorkflowErrorType || (WorkflowErrorType = {}));
/**
 * Classify and enhance workflow errors
 */
export function classifyWorkflowError(error, stage) {
    var errorType = WorkflowErrorType.SYSTEM;
    var retryable = true;
    var userMessage = 'An unexpected error occurred. Our team has been notified.';
    var recoveryActions = ['Try again in a few moments', 'Refresh the page'];
    // Network errors
    if (error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('timeout')) {
        errorType = WorkflowErrorType.NETWORK;
        userMessage = 'Unable to connect to our AI services. Please check your internet connection.';
        recoveryActions = [
            'Check your internet connection',
            'Try again in a few moments',
            'Contact support if the issue persists',
        ];
    }
    // AI Provider errors
    else if (error.message.includes('API key') ||
        error.message.includes('unauthorized') ||
        error.message.includes('quota') ||
        error.message.includes('rate limit')) {
        errorType = WorkflowErrorType.AI_PROVIDER;
        retryable = error.message.includes('rate limit');
        userMessage = retryable
            ? "Our AI services are experiencing high demand. We'll automatically retry in a moment."
            : "There's an issue with our AI services. Our team has been notified.";
        recoveryActions = retryable
            ? ["Please wait, we'll automatically retry", 'Try again in a few minutes']
            : ['Contact support for assistance', 'Try again later'];
    }
    // Validation errors
    else if (error.message.includes('validation') ||
        error.message.includes('invalid') ||
        stage === 'validation') {
        errorType = WorkflowErrorType.VALIDATION;
        retryable = false;
        userMessage =
            'There was an issue with your travel preferences. Please check your form and try again.';
        recoveryActions = [
            'Review your travel form for any missing or invalid information',
            'Make sure all required fields are filled out',
            'Try submitting again',
        ];
    }
    // Timeout errors
    else if (error.message.includes('timeout') || error.message.includes('timed out')) {
        errorType = WorkflowErrorType.TIMEOUT;
        userMessage =
            'The AI took longer than expected to process your request. This sometimes happens with complex itineraries.';
        recoveryActions = [
            'Try again - simpler requests typically process faster',
            'Consider reducing the number of destinations or activities',
            'Contact support if you continue to experience timeouts',
        ];
    }
    return {
        type: errorType,
        stage: stage,
        message: error.message,
        originalError: error,
        retryable: retryable,
        userMessage: userMessage,
        recoveryActions: recoveryActions,
    };
}
/**
 * Handle workflow errors with comprehensive error reporting
 */
export function handleEnhancedWorkflowError(workflowId, stage, error) {
    return __awaiter(this, void 0, void 0, function () {
        var workflowError, updateError_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    workflowError = classifyWorkflowError(error, stage);
                    console.error('💥 [Enhanced Error Handler] Workflow error occurred', {
                        workflowId: workflowId.substring(0, 15) + '...',
                        stage: stage,
                        errorType: workflowError.type,
                        retryable: workflowError.retryable,
                        userMessage: workflowError.userMessage,
                        originalError: error.message,
                    });
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 5, , 6]);
                    // Update session with detailed error information
                    return [4 /*yield*/, sessionManager.updateProgress(workflowId, {
                            status: 'failed',
                            errorMessage: workflowError.userMessage,
                        })];
                case 2:
                    // Update session with detailed error information
                    _b.sent();
                    if (!(typeof process !== 'undefined' && ((_a = process.env) === null || _a === void 0 ? void 0 : _a['NODE_ENV']) === 'production')) return [3 /*break*/, 4];
                    return [4 /*yield*/, sendErrorToMonitoring(workflowId, workflowError)];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    console.log('✅ [Enhanced Error Handler] Error status updated successfully');
                    return [3 /*break*/, 6];
                case 5:
                    updateError_1 = _b.sent();
                    console.error('💥 [Enhanced Error Handler] Failed to update error status:', updateError_1);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * Send error reports to monitoring service
 */
function sendErrorToMonitoring(workflowId, workflowError) {
    return __awaiter(this, void 0, void 0, function () {
        var errorReport, monitoringError_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    errorReport = {
                        workflowId: workflowId,
                        type: 'inngest_workflow_error',
                        errorType: workflowError.type,
                        stage: workflowError.stage,
                        message: workflowError.message,
                        retryable: workflowError.retryable,
                        timestamp: new Date().toISOString(),
                        context: {
                            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
                            url: typeof window !== 'undefined' ? window.location.href : undefined,
                        },
                    };
                    // Send to monitoring endpoint
                    return [4 /*yield*/, fetch('/api/monitoring/errors', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(errorReport),
                        })];
                case 1:
                    // Send to monitoring endpoint
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    monitoringError_1 = _a.sent();
                    console.error('Failed to send error to monitoring:', monitoringError_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Create user-friendly error responses for API endpoints
 */
export function createErrorResponse(workflowError, workflowId) {
    return Response.json({
        success: false,
        error: workflowError.userMessage,
        errorType: workflowError.type,
        retryable: workflowError.retryable,
        recoveryActions: workflowError.recoveryActions,
        workflowId: workflowId,
        timestamp: new Date().toISOString(),
    }, {
        status: workflowError.retryable ? 503 : 400,
    });
}
/**
 * Determine if an error should trigger automatic retry
 */
export function shouldRetryError(workflowError) {
    return (workflowError.retryable &&
        (workflowError.type === WorkflowErrorType.NETWORK ||
            workflowError.type === WorkflowErrorType.RATE_LIMIT ||
            workflowError.type === WorkflowErrorType.TIMEOUT));
}

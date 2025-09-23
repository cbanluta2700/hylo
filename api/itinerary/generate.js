/**
 * Generate Itinerary API Endpoint
 *
 * Constitutional Requirements:
 * - Vercel Edge Runtime only
 * - Zod v    console.log('✅ [28] API Generate: Request validated successfully', {
      sessionId: sessionId.substring(0, 8) + '...',
      location: formData.location,
      travelers: `${formData.adults || 0} adults, ${formData.children || 0} children`,
      dates: `${formData.departDate} to ${formData.returnDate}`
    });ion at API boundaries
 * - Structured error handling
 *
 * Task: T036 - Implement /api/itinerary/generate endpoint
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
import { z } from 'zod';
import { WorkflowOrchestrator } from '../../src/lib/workflows/orchestrator.js';
import { TravelFormDataSchema } from '../../src/schemas/ai-workflow-schemas.js';
// Runtime configuration for Vercel Edge
export var config = {
    runtime: 'edge',
};
/**
 * Request validation schema
 */
var generateRequestSchema = z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
    formData: TravelFormDataSchema,
});
/**
 * POST /api/itinerary/generate
 * Initiates AI workflow for itinerary generation
 */
export default function handler(request) {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, body, validation, _a, sessionId, formData, processedFormData, workflowResult, processingTime, response, error_1, processingTime;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('🚀 [21] API Generate: Request received', {
                        method: request.method,
                        url: request.url,
                        timestamp: new Date().toISOString(),
                    });
                    // Only allow POST method
                    if (request.method !== 'POST') {
                        console.log('❌ [22] API Generate: Method not allowed', { method: request.method });
                        return [2 /*return*/, Response.json({
                                success: false,
                                error: 'Method not allowed',
                                code: 'METHOD_NOT_ALLOWED',
                            }, { status: 405 })];
                    }
                    startTime = Date.now();
                    console.log('⏱️ [23] API Generate: Processing started', { startTime: startTime });
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, request.json().catch(function () { return null; })];
                case 2:
                    body = _b.sent();
                    console.log('📝 [24] API Generate: Request body parsed', {
                        hasBody: !!body,
                        bodyKeys: body ? Object.keys(body) : [],
                    });
                    if (!body) {
                        console.log('❌ [25] API Generate: Invalid JSON in request body');
                        return [2 /*return*/, Response.json({
                                success: false,
                                error: 'Invalid JSON in request body',
                                code: 'INVALID_JSON',
                            }, { status: 400 })];
                    }
                    validation = generateRequestSchema.safeParse(body);
                    console.log('🔍 [26] API Generate: Request validation', {
                        success: validation.success,
                        hasSessionId: !!body.sessionId,
                        hasFormData: !!body.formData,
                    });
                    if (!validation.success) {
                        console.error('❌ [27] API Generate: Validation failed', validation.error.format());
                        return [2 /*return*/, Response.json({
                                success: false,
                                error: 'Invalid request data',
                                code: 'VALIDATION_ERROR',
                                details: validation.error.format(),
                            }, { status: 400 })];
                    }
                    _a = validation.data, sessionId = _a.sessionId, formData = _a.formData;
                    console.log('✅ [28] API Generate: Request validated successfully', {
                        sessionId: String(sessionId).substring(0, 8) + '...',
                        location: formData.location,
                        travelers: "".concat(formData.adults || 0, " adults, ").concat(formData.children || 0, " children"),
                        dates: "".concat(formData.departDate, " to ").concat(formData.returnDate),
                    });
                    processedFormData = __assign(__assign({}, formData), { departDate: formData.departDate, returnDate: formData.returnDate, submittedAt: formData.submittedAt
                            ? new Date(formData.submittedAt)
                            : new Date() });
                    console.log('🔄 [29] API Generate: Form data processed', {
                        submittedAt: processedFormData.submittedAt,
                        formDataKeys: Object.keys(processedFormData),
                    });
                    console.log("\uD83D\uDE80 [30] API Generate: Starting workflow for session ".concat(sessionId));
                    return [4 /*yield*/, WorkflowOrchestrator.startWorkflow(sessionId, processedFormData)];
                case 3:
                    workflowResult = _b.sent();
                    processingTime = Date.now() - startTime;
                    console.log("\u2705 [31] API Generate: Workflow initiated successfully", {
                        workflowId: workflowResult.workflowId,
                        processingTime: "".concat(processingTime, "ms"),
                        estimatedCompletion: "".concat(workflowResult.estimatedCompletionTime, "ms"),
                    });
                    response = {
                        success: true,
                        workflowId: workflowResult.workflowId,
                        estimatedCompletionTime: workflowResult.estimatedCompletionTime,
                        message: 'Itinerary generation started successfully',
                    };
                    console.log('🎉 [32] API Generate: Success response prepared', {
                        workflowId: response.workflowId,
                        estimatedTime: response.estimatedCompletionTime,
                        totalProcessingTime: "".concat(processingTime, "ms"),
                    });
                    return [2 /*return*/, Response.json(response, {
                            status: 202, // Accepted - processing will continue asynchronously
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Processing-Time': processingTime.toString(),
                                'X-Workflow-Id': workflowResult.workflowId,
                            },
                        })];
                case 4:
                    error_1 = _b.sent();
                    processingTime = Date.now() - startTime;
                    console.error('💥 [33] API Generate: Error caught', {
                        error: error_1 instanceof Error ? error_1.message : 'Unknown error',
                        processingTime: "".concat(processingTime, "ms"),
                        stack: error_1 instanceof Error ? error_1.stack : undefined,
                    });
                    // Handle specific error types
                    if (error_1 instanceof Error) {
                        console.log('🔍 [34] API Generate: Error analysis', {
                            errorType: error_1.constructor.name,
                            isInngestError: error_1.message.includes('Inngest'),
                            isWorkflowError: error_1.message.includes('workflow'),
                            isAIError: error_1.message.includes('provider') || error_1.message.includes('AI'),
                        });
                        // Inngest or workflow initialization errors
                        if (error_1.message.includes('Inngest') || error_1.message.includes('workflow')) {
                            console.log('🚧 [35] API Generate: Workflow service error detected');
                            return [2 /*return*/, Response.json({
                                    success: false,
                                    error: 'Workflow service temporarily unavailable',
                                    code: 'SERVICE_UNAVAILABLE',
                                }, {
                                    status: 503,
                                    headers: {
                                        'X-Processing-Time': processingTime.toString(),
                                    },
                                })];
                        }
                        // AI provider errors
                        if (error_1.message.includes('provider') || error_1.message.includes('AI')) {
                            console.log('🤖 [36] API Generate: AI service error detected');
                            return [2 /*return*/, Response.json({
                                    success: false,
                                    error: 'AI services temporarily unavailable',
                                    code: 'AI_SERVICE_ERROR',
                                }, {
                                    status: 503,
                                    headers: {
                                        'X-Processing-Time': processingTime.toString(),
                                    },
                                })];
                        }
                    }
                    // Generic server error
                    return [2 /*return*/, Response.json({
                            success: false,
                            error: 'Internal server error',
                            code: 'INTERNAL_ERROR',
                        }, {
                            status: 500,
                            headers: {
                                'X-Processing-Time': processingTime.toString(),
                            },
                        })];
                case 5: return [2 /*return*/];
            }
        });
    });
}

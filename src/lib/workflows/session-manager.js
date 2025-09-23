/**
 * WorkflowSession Redis Management
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility (Web APIs only)
 * - Type-safe development with Zod validation
 * - No Node.js built-ins
 *
 * Task: T020 - Implement WorkflowSession Redis management
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
import { Redis } from '@upstash/redis';
/**
 * Redis client configuration for Edge Runtime
 * Uses user's specific Upstash Redis/KV configuration
 */
var getRedisClient = function () {
    var url = process.env['KV_REST_API_URL'];
    var token = process.env['KV_REST_API_TOKEN'];
    if (!url || !token) {
        throw new Error('Upstash Redis/KV credentials not configured. Check KV_REST_API_URL and KV_REST_API_TOKEN');
    }
    return new Redis({
        url: url,
        token: token,
    });
};
/**
 * Session manager for AI workflow state
 */
var WorkflowSessionManager = /** @class */ (function () {
    function WorkflowSessionManager() {
        this.SESSION_TTL = 3600; // 1 hour expiration
        this.SESSION_PREFIX = 'workflow:session:';
        this.redis = getRedisClient();
    }
    /**
     * Create new workflow session
     * Atomic operation with expiration
     */
    WorkflowSessionManager.prototype.createSession = function (workflowId, sessionId, formData) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionKey, session, key, setResult, verifyResult, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('📁 [SessionManager] Creating new workflow session', {
                            workflowId: workflowId.substring(0, 12) + '...',
                            sessionId: sessionId.substring(0, 8) + '...',
                            location: formData.location,
                            travelers: "".concat(formData.adults, "+").concat(formData.children),
                            redisUrl: process.env['KV_REST_API_URL'] ? 'configured' : 'missing',
                            redisToken: process.env['KV_REST_API_TOKEN'] ? 'configured' : 'missing',
                        });
                        sessionKey = "".concat(this.SESSION_PREFIX).concat(workflowId);
                        console.log('📁 [SessionManager] Using session key:', sessionKey);
                        session = {
                            id: workflowId,
                            sessionId: sessionId,
                            requestId: "req_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9)),
                            status: 'pending',
                            currentStage: 'architect',
                            progress: 0,
                            completedSteps: [],
                            startedAt: new Date(),
                            retryCount: 0,
                            formData: formData,
                        };
                        key = "".concat(this.SESSION_PREFIX).concat(workflowId);
                        console.log('💾 [SessionManager] Prepared session for Redis storage', {
                            workflowId: workflowId.substring(0, 12) + '...',
                            redisKey: key,
                            sessionTTL: "".concat(this.SESSION_TTL, "s"),
                            sessionSize: JSON.stringify(session).length,
                            sessionStatus: session.status,
                            sessionStage: session.currentStage,
                            sessionData: {
                                location: session.formData.location,
                                dates: "".concat(session.formData.departDate, " to ").concat(session.formData.returnDate),
                                adults: session.formData.adults,
                                children: session.formData.children,
                            },
                        });
                        console.log('💾 [46] Session Manager: Prepared session for Redis storage', {
                            redisKey: key,
                            sessionTTL: "".concat(this.SESSION_TTL, "s"),
                            sessionSize: JSON.stringify(session).length,
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.redis.setex(key, this.SESSION_TTL, JSON.stringify(session))];
                    case 2:
                        setResult = _a.sent();
                        console.log("\u2705 [SessionManager] Session created and stored in Redis", {
                            workflowId: workflowId.substring(0, 12) + '...',
                            redisKey: key,
                            setResult: setResult,
                            ttl: this.SESSION_TTL,
                            timestamp: new Date().toISOString(),
                        });
                        return [4 /*yield*/, this.redis.get(key)];
                    case 3:
                        verifyResult = _a.sent();
                        console.log("\uD83D\uDD0D [SessionManager] Session storage verification", {
                            workflowId: workflowId.substring(0, 12) + '...',
                            stored: !!verifyResult,
                            dataLength: verifyResult ? verifyResult.length : 0,
                        });
                        return [2 /*return*/, session];
                    case 4:
                        error_1 = _a.sent();
                        console.error("\uD83D\uDCA5 [SessionManager] Failed to create session", {
                            workflowId: workflowId.substring(0, 12) + '...',
                            redisKey: key,
                            error: error_1 instanceof Error ? error_1.message : 'Unknown error',
                            errorStack: error_1 instanceof Error ? error_1.stack : undefined,
                            redisConnected: this.redis ? 'yes' : 'no',
                        });
                        throw new Error('Failed to create workflow session');
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Retrieve workflow session by ID
     */
    WorkflowSessionManager.prototype.getSession = function (workflowId) {
        return __awaiter(this, void 0, void 0, function () {
            var key, sessionData, allKeys, keysError_1, session, error_2;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        key = "".concat(this.SESSION_PREFIX).concat(workflowId);
                        console.log("\uD83D\uDD0D [SessionManager] Retrieving session", {
                            workflowId: workflowId.substring(0, 12) + '...',
                            redisKey: key,
                            prefix: this.SESSION_PREFIX,
                            timestamp: new Date().toISOString(),
                        });
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 8, , 9]);
                        console.log("\uD83D\uDD0D [SessionManager] Calling Redis GET for key: ".concat(key));
                        return [4 /*yield*/, this.redis.get(key)];
                    case 2:
                        sessionData = _d.sent();
                        console.log("\uD83D\uDD0D [SessionManager] Redis GET result", {
                            workflowId: workflowId.substring(0, 12) + '...',
                            hasData: !!sessionData,
                            dataType: typeof sessionData,
                            dataLength: sessionData ? sessionData.length : 0,
                            dataPreview: sessionData ? sessionData.substring(0, 100) + '...' : null,
                        });
                        if (!!sessionData) return [3 /*break*/, 7];
                        console.log("\u274C [SessionManager] No session found in Redis", {
                            workflowId: workflowId.substring(0, 12) + '...',
                            redisKey: key,
                            searchedPrefix: this.SESSION_PREFIX,
                        });
                        _d.label = 3;
                    case 3:
                        _d.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.redis.keys('workflow:*')];
                    case 4:
                        allKeys = _d.sent();
                        console.log("\uD83D\uDD0D [SessionManager] Available workflow keys in Redis:", {
                            totalKeys: allKeys.length,
                            keys: allKeys.slice(0, 10), // Show first 10 keys
                            ourKey: key,
                            keyExists: allKeys.includes(key),
                        });
                        return [3 /*break*/, 6];
                    case 5:
                        keysError_1 = _d.sent();
                        console.log("\u26A0\uFE0F [SessionManager] Could not list Redis keys:", keysError_1);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/, null];
                    case 7:
                        console.log("\u2705 [SessionManager] Found session data, parsing JSON");
                        session = JSON.parse(sessionData);
                        // Parse dates back from JSON
                        session.startedAt = new Date(session.startedAt);
                        if (session.completedAt) {
                            session.completedAt = new Date(session.completedAt);
                        }
                        console.log("\u2705 [SessionManager] Successfully retrieved and parsed session", {
                            workflowId: workflowId.substring(0, 12) + '...',
                            sessionId: session.sessionId.substring(0, 8) + '...',
                            status: session.status,
                            currentStage: session.currentStage,
                            progress: session.progress,
                            completedSteps: session.completedSteps,
                            location: (_a = session.formData) === null || _a === void 0 ? void 0 : _a.location,
                            startedAt: (_b = session.startedAt) === null || _b === void 0 ? void 0 : _b.toISOString(),
                            completedAt: (_c = session.completedAt) === null || _c === void 0 ? void 0 : _c.toISOString(),
                        });
                        return [2 /*return*/, session];
                    case 8:
                        error_2 = _d.sent();
                        console.error("\uD83D\uDCA5 [SessionManager] Failed to get session", {
                            workflowId: workflowId.substring(0, 12) + '...',
                            redisKey: key,
                            error: error_2 instanceof Error ? error_2.message : 'Unknown error',
                            errorStack: error_2 instanceof Error ? error_2.stack : undefined,
                            errorType: error_2 instanceof Error ? error_2.constructor.name : typeof error_2,
                        });
                        return [2 /*return*/, null];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update workflow session progress
     * Atomic operation with progress validation
     */
    WorkflowSessionManager.prototype.updateProgress = function (workflowId, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var session, updatedSession, key, setResult, error_3;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log("\uD83D\uDD04 [SessionManager] Updating session progress", {
                            workflowId: workflowId.substring(0, 12) + '...',
                            updates: updates,
                            timestamp: new Date().toISOString(),
                        });
                        return [4 /*yield*/, this.getSession(workflowId)];
                    case 1:
                        session = _b.sent();
                        if (!session) {
                            console.error("\u274C [SessionManager] Session not found for update", {
                                workflowId: workflowId.substring(0, 12) + '...',
                                searchedKey: "".concat(this.SESSION_PREFIX).concat(workflowId),
                                updateAttempted: updates,
                            });
                            return [2 /*return*/, false];
                        }
                        console.log("\u2705 [SessionManager] Found existing session for update", {
                            workflowId: workflowId.substring(0, 12) + '...',
                            currentStatus: session.status,
                            currentStage: session.currentStage,
                            currentProgress: session.progress,
                            newUpdates: updates,
                        });
                        // Validate progress value
                        if (updates.progress !== undefined && (updates.progress < 0 || updates.progress > 100)) {
                            console.error("\u274C [SessionManager] Invalid progress value", {
                                workflowId: workflowId.substring(0, 12) + '...',
                                invalidProgress: updates.progress,
                                validRange: '0-100',
                            });
                            return [2 /*return*/, false];
                        }
                        updatedSession = __assign(__assign(__assign({}, session), updates), (updates.status === 'completed' && { completedAt: new Date() }));
                        key = "".concat(this.SESSION_PREFIX).concat(workflowId);
                        console.log("\uD83D\uDCBE [SessionManager] Saving updated session to Redis", {
                            workflowId: workflowId.substring(0, 12) + '...',
                            redisKey: key,
                            oldStatus: session.status,
                            newStatus: updatedSession.status,
                            oldStage: session.currentStage,
                            newStage: updatedSession.currentStage,
                            oldProgress: session.progress,
                            newProgress: updatedSession.progress,
                            completedSteps: updatedSession.completedSteps,
                            completedAt: (_a = updatedSession.completedAt) === null || _a === void 0 ? void 0 : _a.toISOString(),
                        });
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.redis.setex(key, this.SESSION_TTL, JSON.stringify(updatedSession))];
                    case 3:
                        setResult = _b.sent();
                        console.log("\u2705 [SessionManager] Session successfully updated", {
                            workflowId: workflowId.substring(0, 12) + '...',
                            stage: updatedSession.currentStage,
                            progress: updatedSession.progress + '%',
                            status: updatedSession.status,
                            setResult: setResult,
                            ttl: this.SESSION_TTL,
                        });
                        return [2 /*return*/, true];
                    case 4:
                        error_3 = _b.sent();
                        console.error("\uD83D\uDCA5 [SessionManager] Failed to update session", {
                            workflowId: workflowId.substring(0, 12) + '...',
                            redisKey: key,
                            error: error_3 instanceof Error ? error_3.message : 'Unknown error',
                            errorStack: error_3 instanceof Error ? error_3.stack : undefined,
                        });
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Mark workflow as completed
     */
    WorkflowSessionManager.prototype.completeSession = function (workflowId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log("\uD83C\uDF89 [SessionManager] Completing workflow session", {
                    workflowId: workflowId.substring(0, 12) + '...',
                    timestamp: new Date().toISOString(),
                });
                return [2 /*return*/, this.updateProgress(workflowId, {
                        status: 'completed',
                        currentStage: 'complete',
                        progress: 100,
                    })];
            });
        });
    };
    /**
     * Mark workflow as failed with error
     */
    WorkflowSessionManager.prototype.failSession = function (workflowId, errorMessage) {
        return __awaiter(this, void 0, void 0, function () {
            var session;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uD83D\uDCA5 [SessionManager] Failing workflow session", {
                            workflowId: workflowId.substring(0, 12) + '...',
                            errorMessage: errorMessage,
                            timestamp: new Date().toISOString(),
                        });
                        return [4 /*yield*/, this.getSession(workflowId)];
                    case 1:
                        session = _a.sent();
                        if (!session) {
                            return [2 /*return*/, false];
                        }
                        return [2 /*return*/, this.updateProgress(workflowId, {
                                status: 'failed',
                                errorMessage: errorMessage,
                                retryCount: session.retryCount + 1,
                            })];
                }
            });
        });
    };
    /**
     * Delete workflow session
     * Used for cleanup or cancellation
     */
    WorkflowSessionManager.prototype.deleteSession = function (workflowId) {
        return __awaiter(this, void 0, void 0, function () {
            var key, deleted, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = "".concat(this.SESSION_PREFIX).concat(workflowId);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.redis.del(key)];
                    case 2:
                        deleted = _a.sent();
                        console.log("[WorkflowSession] Deleted session ".concat(workflowId));
                        return [2 /*return*/, deleted > 0];
                    case 3:
                        error_4 = _a.sent();
                        console.error("[WorkflowSession] Failed to delete session ".concat(workflowId, ":"), error_4);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get sessions by user session ID
     * For user dashboard/history functionality
     */
    WorkflowSessionManager.prototype.getSessionsByUser = function (sessionId_1) {
        return __awaiter(this, arguments, void 0, function (sessionId, limit) {
            var keys, sessions, _i, _a, key, sessionData, session, error_5;
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.redis.keys("".concat(this.SESSION_PREFIX, "*"))];
                    case 1:
                        keys = _b.sent();
                        sessions = [];
                        _i = 0, _a = keys.slice(0, limit * 2);
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        key = _a[_i];
                        return [4 /*yield*/, this.redis.get(key)];
                    case 3:
                        sessionData = _b.sent();
                        if (sessionData) {
                            session = JSON.parse(sessionData);
                            if (session.sessionId === sessionId) {
                                session.startedAt = new Date(session.startedAt);
                                if (session.completedAt) {
                                    session.completedAt = new Date(session.completedAt);
                                }
                                sessions.push(session);
                            }
                        }
                        if (sessions.length >= limit)
                            return [3 /*break*/, 5];
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, sessions.sort(function (a, b) { return b.startedAt.getTime() - a.startedAt.getTime(); })];
                    case 6:
                        error_5 = _b.sent();
                        console.error("[WorkflowSession] Failed to get sessions for user ".concat(sessionId, ":"), error_5);
                        return [2 /*return*/, []];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return WorkflowSessionManager;
}());
export { WorkflowSessionManager };
/**
 * Singleton instance for workflow session management
 * Edge Runtime compatible
 */
export var sessionManager = new WorkflowSessionManager();
/**
 * Utility function to generate workflow ID
 * Edge Runtime compatible UUID generation
 */
export var generateWorkflowId = function () {
    // Use crypto.randomUUID if available (modern Edge Runtime)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback UUID generation for older runtimes
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0;
        var v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

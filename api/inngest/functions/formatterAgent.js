/**
 * Formatter Agent Function
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - Fast processing for final output structuring
 * - Type-safe development
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
import { formatItinerary } from '../../../src/lib/ai-clients/hylo-ai-clients.js';
/**
 * Individual Formatter Agent Function
 * Creates the final structured itinerary output
 */
export var formatterAgent = inngest.createFunction({
    id: 'formatter-agent',
    name: 'Itinerary Formatter Agent',
    retries: 2,
}, { event: 'agent/formatter/start' }, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var _c, workflowId, processedData, travelStyle, formattedItinerary, error_1;
    var event = _b.event, step = _b.step;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _c = event.data, workflowId = _c.workflowId, processedData = _c.processedData, travelStyle = _c.travelStyle;
                console.log('📝 [INNGEST] Formatter Agent: Starting itinerary formatting', {
                    workflowId: workflowId.substring(0, 15) + '...',
                    travelStyle: travelStyle,
                });
                _d.label = 1;
            case 1:
                _d.trys.push([1, 4, , 5]);
                return [4 /*yield*/, step.run('format-itinerary', function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, formatItinerary(processedData, travelStyle)];
                                case 1: return [2 /*return*/, _a.sent()];
                            }
                        });
                    }); })];
            case 2:
                formattedItinerary = _d.sent();
                // Send completion event
                return [4 /*yield*/, step.sendEvent('formatter-complete', {
                        name: 'agent/formatter/complete',
                        data: {
                            workflowId: workflowId,
                            itinerary: formattedItinerary,
                        },
                    })];
            case 3:
                // Send completion event
                _d.sent();
                console.log('✅ [INNGEST] Formatter Agent: Itinerary formatting completed');
                return [2 /*return*/, {
                        workflowId: workflowId,
                        agent: 'formatter',
                        status: 'completed',
                        itinerary: formattedItinerary,
                    }];
            case 4:
                error_1 = _d.sent();
                console.error('💥 [INNGEST] Formatter Agent: Failed', {
                    workflowId: workflowId.substring(0, 15) + '...',
                    error: error_1 instanceof Error ? error_1.message : 'Unknown error',
                });
                throw error_1;
            case 5: return [2 /*return*/];
        }
    });
}); });
